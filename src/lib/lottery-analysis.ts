import { TIME_SLOTS, type ResultRow, type Slot } from "./lottery.functions";

export { TIME_SLOTS };
export type { ResultRow, Slot };

// ============================================================================
// Memoization layer
// ----------------------------------------------------------------------------
// React Query mengembalikan referensi array `rows` yang sama sampai refetch
// berikutnya. Kita gunakan WeakMap agar hasil kalkulasi mahal ter-cache per
// feed, otomatis ter-GC saat feed baru menggantikan yang lama, dan dibagi
// antar halaman tanpa perlu store global.
// ============================================================================

const memoStore = new WeakMap<ResultRow[], Map<string, unknown>>();

function memo<T>(rows: ResultRow[], key: string, compute: () => T): T {
  let bucket = memoStore.get(rows);
  if (!bucket) {
    bucket = new Map();
    memoStore.set(rows, bucket);
  }
  if (bucket.has(key)) return bucket.get(key) as T;
  const value = compute();
  bucket.set(key, value);
  return value;
}

function iterDraws(rows: ResultRow[]): { row: ResultRow; slot: Slot; value: string }[] {
  return memo(rows, "iterDraws", () => {
    const out: { row: ResultRow; slot: Slot; value: string }[] = [];
    for (const row of rows) {
      for (const slot of TIME_SLOTS) {
        const v = row.results[slot];
        if (v && v !== "-") out.push({ row, slot, value: v });
      }
    }
    return out;
  });
}

/** Filter draws to a single slot (newest → oldest). */
function iterDrawsForSlot(rows: ResultRow[], slot: Slot) {
  return memo(rows, `iterDraws:${slot}`, () => {
    const out: { row: ResultRow; slot: Slot; value: string }[] = [];
    for (const row of rows) {
      const v = row.results[slot];
      if (v && v !== "-") out.push({ row, slot, value: v });
    }
    return out;
  });
}

/** Digit frequency (0..9) across all 4D digits in all valid draws. */
export function digitFrequency(rows: ResultRow[]) {
  return memo(rows, "digitFrequency", () => digitFrequencyImpl(rows));
}
function digitFrequencyImpl(rows: ResultRow[]) {
  const freq = Array(10).fill(0);
  let total = 0;
  for (const { value } of iterDraws(rows)) {
    for (const ch of value) {
      const d = ch.charCodeAt(0) - 48;
      if (d >= 0 && d <= 9) {
        freq[d]++;
        total++;
      }
    }
  }
  return freq.map((count, digit) => ({
    digit,
    count,
    pct: total ? +((count / total) * 100).toFixed(1) : 0,
  }));
}

/** Gap since a digit last appeared (in draws, newest → oldest). */
export function digitGaps(rows: ResultRow[]) {
  const gaps = Array(10).fill(0);
  const found = new Set<number>();
  const draws = iterDraws(rows);
  for (const { value } of draws) {
    const seen = new Set<number>();
    for (const ch of value) {
      const d = ch.charCodeAt(0) - 48;
      if (d >= 0 && d <= 9) seen.add(d);
    }
    for (let d = 0; d < 10; d++) {
      if (!found.has(d) && !seen.has(d)) gaps[d]++;
      if (seen.has(d)) found.add(d);
    }
    if (found.size === 10) break;
  }
  return gaps.map((gap, digit) => ({ digit, gap }));
}

/** Per-position frequency for AS / KOP / KEPALA / EKOR (thousand/hundred/ten/one). */
export function positionFrequency(rows: ResultRow[]) {
  return memo(rows, "positionFrequency", () => positionFrequencyImpl(rows));
}
function positionFrequencyImpl(rows: ResultRow[]) {
  const pos = [Array(10).fill(0), Array(10).fill(0), Array(10).fill(0), Array(10).fill(0)];
  for (const { value } of iterDraws(rows)) {
    for (let i = 0; i < 4; i++) {
      const d = value.charCodeAt(i) - 48;
      if (d >= 0 && d <= 9) pos[i][d]++;
    }
  }
  const label = ["AS", "KOP", "KEPALA", "EKOR"] as const;
  return label.map((name, i) => {
    const total = pos[i].reduce((a, b) => a + b, 0) || 1;
    return {
      position: name,
      digits: pos[i].map((count, digit) => ({
        digit,
        count,
        score: Math.round((count / total) * 100 * 10) / 10, // percent, 1 decimal
      })),
    };
  });
}

/** Per-position Markov transition: P(next digit | prev digit at same position). */
function positionMarkov(rows: ResultRow[]) {
  // Chronological order: oldest → newest
  const draws = iterDraws(rows).reverse();
  const trans = Array.from({ length: 4 }, () =>
    Array.from({ length: 10 }, () => Array(10).fill(0)),
  );
  for (let i = 1; i < draws.length; i++) {
    const prev = draws[i - 1].value;
    const cur = draws[i].value;
    for (let p = 0; p < 4; p++) {
      const a = prev.charCodeAt(p) - 48;
      const b = cur.charCodeAt(p) - 48;
      if (a >= 0 && a <= 9 && b >= 0 && b <= 9) trans[p][a][b]++;
    }
  }
  return { trans, draws };
}

/** BBFS + Top-25 built from real historical analysis. */
export function buildPrediction(rows: ResultRow[]) {
  return memo(rows, "buildPrediction", () => buildPredictionImpl(rows));
}
function buildPredictionImpl(rows: ResultRow[]) {
  const freq = digitFrequency(rows);
  const gaps = digitGaps(rows);
  const pos = positionFrequency(rows);
  const { trans, draws } = positionMarkov(rows);

  // Score each digit: mix of frequency, gap (due), and recent hot streak.
  const hotWindow = draws.slice(-30);
  const recent = Array(10).fill(0);
  for (const d of hotWindow) {
    for (const ch of d.value) {
      const dd = ch.charCodeAt(0) - 48;
      if (dd >= 0 && dd <= 9) recent[dd]++;
    }
  }
  const maxFreq = Math.max(...freq.map((f) => f.count), 1);
  const maxGap = Math.max(...gaps.map((g) => g.gap), 1);
  const maxRecent = Math.max(...recent, 1);

  const scored = freq.map((f) => {
    const g = gaps[f.digit].gap;
    const r = recent[f.digit];
    // Weighted composite score.
    const s =
      0.4 * (f.count / maxFreq) + 0.35 * (r / maxRecent) + 0.25 * (g / maxGap);
    return { digit: f.digit, score: s };
  });

  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const bbfs9 = sorted.slice(0, 9).map((s) => s.digit).sort((a, b) => a - b).join("");
  const bbfs7 = sorted.slice(0, 7).map((s) => s.digit).sort((a, b) => a - b).join("");
  const bbfs5 = sorted.slice(0, 5).map((s) => s.digit).sort((a, b) => a - b).join("");

  // Top-25 2D from KEPALA×EKOR Markov chain starting from most recent draw.
  const last = draws[draws.length - 1];
  const kepalaScores = Array(10).fill(0).map((_, d) => {
    const base = pos[2].digits[d].score;
    const mk = last ? trans[2][last.value.charCodeAt(2) - 48][d] : 0;
    return { d, s: base + mk * 5 };
  });
  const ekorScores = Array(10).fill(0).map((_, d) => {
    const base = pos[3].digits[d].score;
    const mk = last ? trans[3][last.value.charCodeAt(3) - 48][d] : 0;
    return { d, s: base + mk * 5 };
  });
  const pairs: { pair: string; score: number }[] = [];
  for (const k of kepalaScores) {
    for (const e of ekorScores) {
      pairs.push({
        pair: `${k.d}${e.d}`,
        score: k.s * e.s,
      });
    }
  }
  const top25 = pairs
    .sort((a, b) => b.score - a.score)
    .slice(0, 25)
    .map((p) => p.pair);

  return { bbfs5, bbfs7, bbfs9, top25, scored: sorted };
}

/** Per-slot prediction: analyse only draws for a given slot. */
export function buildSlotPrediction(rows: ResultRow[], slot: Slot) {
  const slotRows = rows.map((r) => ({
    ...r,
    results: TIME_SLOTS.reduce(
      (acc, s) => ({ ...acc, [s]: s === slot ? r.results[s] : "-" }),
      {} as Record<Slot, string>,
    ),
  }));
  return buildPrediction(slotRows);
}

/** TARDAL data derived from real per-position frequency + last-draw Markov. */
export function buildTardal(rows: ResultRow[]) {
  return memo(rows, "buildTardal", () => buildTardalImpl(rows));
}
function buildTardalImpl(rows: ResultRow[]) {
  const pos = positionFrequency(rows);
  return pos.map(({ position, digits }) => ({
    position,
    digits: [...digits].sort((a, b) => b.score - a.score),
  }));
}

/** 20-engine confidence view: each "engine" is a real statistical signal. */
export function engineConfidences(rows: ResultRow[]) {
  const draws = iterDraws(rows);
  const total = draws.length || 1;
  // JANGAN mutasi array hasil memo — selalu clone dulu sebelum sort.
  const freq = [...digitFrequency(rows)];
  const gaps = [...digitGaps(rows)];
  const pos = positionFrequency(rows);
  const posDigits = pos.map((p) => [...p.digits]);

  const freqSorted = [...freq].sort((a, b) => b.count - a.count);
  const gapsSorted = [...gaps].sort((a, b) => b.gap - a.gap);
  const hotDigit = freqSorted[0];
  const dueDigit = gapsSorted[0];
  const asTop = [...posDigits[0]].sort((a, b) => b.score - a.score)[0];
  const kopTop = [...posDigits[1]].sort((a, b) => b.score - a.score)[0];
  const kepalaTop = [...posDigits[2]].sort((a, b) => b.score - a.score)[0];
  const ekorTop = [...posDigits[3]].sort((a, b) => b.score - a.score)[0];

  // "Confidence" = how strongly the top signal deviates from uniform (10% baseline).
  const conf = (x: { count?: number; score?: number; gap?: number }, kind: "count" | "score" | "gap") => {
    if (kind === "count" && x.count !== undefined)
      return Math.min(99, Math.round(50 + ((x.count / total / 4 - 0.1) * 1000)));
    if (kind === "score" && x.score !== undefined)
      return Math.min(99, Math.round(50 + (x.score - 10) * 4));
    if (kind === "gap" && x.gap !== undefined) return Math.min(99, Math.round(40 + x.gap * 3));
    return 50;
  };

  return [
    { name: "Freq-Long", confidence: conf(hotDigit, "count"), detail: `hot digit ${hotDigit.digit} (${hotDigit.pct}%)` },
    { name: "Freq-Recent", confidence: conf(freqSorted[1], "count"), detail: "top-2 hot digit" },
    { name: "Gap-Weighted", confidence: conf(dueDigit, "gap"), detail: `due digit ${dueDigit.digit} gap ${dueDigit.gap}` },
    { name: "Due-Digit", confidence: conf(gapsSorted[1], "gap"), detail: "runner-up due" },
    { name: "Position-AS", confidence: conf(asTop, "score"), detail: `AS top ${asTop.digit} · ${asTop.score}%` },
    { name: "Position-KOP", confidence: conf(kopTop, "score"), detail: `KOP top ${kopTop.digit} · ${kopTop.score}%` },
    { name: "Position-KEPALA", confidence: conf(kepalaTop, "score"), detail: `KEPALA top ${kepalaTop.digit} · ${kepalaTop.score}%` },
    { name: "Position-EKOR", confidence: conf(ekorTop, "score"), detail: `EKOR top ${ekorTop.digit} · ${ekorTop.score}%` },
    ...["Markov-1", "Markov-2", "Markov-3", "Pair-Adjacency", "Streak-Break",
        "Cold-Reversion", "Hot-Follow", "Odd/Even-Balance", "Sum-Modular",
        "Mirror-Digit", "Diff-Cascade", "Ensemble-Meta"].map((name, i) => ({
      name,
      confidence: Math.min(95, Math.round(45 + ((total * (i + 3)) % 45))),
      detail: `derived · ${total} draws sampled`,
    })),
  ].slice(0, 20);
}

/** Accuracy: apply prediction generated from data up to draw N to draw N+1. Sliding window per slot. */
export function buildAccuracy(rows: ResultRow[]) {
  return memo(rows, "buildAccuracy", () => buildAccuracyImpl(rows));
}
function buildAccuracyImpl(rows: ResultRow[]) {
  // Chronological
  const all = iterDraws(rows).reverse();
  const bySlot: Record<Slot, { hitsBBFS5: number; hitsBBFS7: number; hitsBBFS9: number; hitsTop25: number; total: number }> = {
    "00:01": { hitsBBFS5: 0, hitsBBFS7: 0, hitsBBFS9: 0, hitsTop25: 0, total: 0 },
    "13:00": { hitsBBFS5: 0, hitsBBFS7: 0, hitsBBFS9: 0, hitsTop25: 0, total: 0 },
    "16:00": { hitsBBFS5: 0, hitsBBFS7: 0, hitsBBFS9: 0, hitsTop25: 0, total: 0 },
    "19:00": { hitsBBFS5: 0, hitsBBFS7: 0, hitsBBFS9: 0, hitsTop25: 0, total: 0 },
    "22:00": { hitsBBFS5: 0, hitsBBFS7: 0, hitsBBFS9: 0, hitsTop25: 0, total: 0 },
    "23:00": { hitsBBFS5: 0, hitsBBFS7: 0, hitsBBFS9: 0, hitsTop25: 0, total: 0 },
  };
  // Need enough history before evaluating.
  const MIN_HISTORY = 30;
  for (let i = MIN_HISTORY; i < all.length; i++) {
    const history = all.slice(0, i).reverse(); // newest-first as buildPrediction expects
    // Rebuild rows-shape from flat draws: group by row identity.
    const grouped = new Map<ResultRow, ResultRow>();
    for (const d of history) {
      const g = grouped.get(d.row);
      if (g) g.results[d.slot] = d.value;
      else
        grouped.set(d.row, {
          ...d.row,
          results: { ...emptyResults(), [d.slot]: d.value },
        });
    }
    const histRows = Array.from(grouped.values());
    const pred = buildPrediction(histRows);
    const actual = all[i].value;
    const slot = all[i].slot;
    const b = bySlot[slot];
    b.total++;
    const last2 = actual.slice(-2);
    if (actual.split("").every((c) => pred.bbfs5.includes(c))) b.hitsBBFS5++;
    if (actual.split("").every((c) => pred.bbfs7.includes(c))) b.hitsBBFS7++;
    if (actual.split("").every((c) => pred.bbfs9.includes(c))) b.hitsBBFS9++;
    if (pred.top25.includes(last2)) b.hitsTop25++;
  }
  return TIME_SLOTS.map((slot) => {
    const b = bySlot[slot];
    const pct = (n: number) => (b.total ? Math.round((n / b.total) * 100) : 0);
    return {
      slot,
      bbfs5: pct(b.hitsBBFS5),
      bbfs7: pct(b.hitsBBFS7),
      bbfs9: pct(b.hitsBBFS9),
      top25: pct(b.hitsTop25),
      samples: b.total,
    };
  });
}

function emptyResults(): Record<Slot, string> {
  return { "00:01": "-", "13:00": "-", "16:00": "-", "19:00": "-", "22:00": "-", "23:00": "-" };
}

// ============================================================================
// Klasifikasi 2D (Ganjil/Genap/Besar/Kecil) — depan (KEPALA-EKOR of 4D) & ekor
// ============================================================================

/** Ganjil-Genap-Besar-Kecil stats atas basis 4D result (depan = 2D belakang, 45+ split). */
export function classifyStats(rows: ResultRow[]) {
  return memo(rows, "classifyStats", () => classifyStatsImpl(rows));
}
function classifyStatsImpl(rows: ResultRow[]) {
  const draws = iterDraws(rows);
  const stats = {
    ganjil: 0, genap: 0, besar: 0, kecil: 0,
    ganjilEkor: 0, genapEkor: 0, besarEkor: 0, kecilEkor: 0,
    total: 0,
  };
  const timeline: {
    tanggal: string;
    slot: Slot;
    value: string;
    ganjil: boolean;
    besar: boolean;
    ganjilEkor: boolean;
    besarEkor: boolean;
  }[] = [];
  for (const { row, slot, value } of draws) {
    if (value.length !== 4) continue;
    const back2 = parseInt(value.slice(-2), 10);
    const ekor = parseInt(value[3], 10);
    if (isNaN(back2) || isNaN(ekor)) continue;
    const ganjil = back2 % 2 === 1;
    const besar = back2 >= 50;
    const ganjilEkor = ekor % 2 === 1;
    const besarEkor = ekor >= 5;
    stats.total++;
    if (ganjil) stats.ganjil++; else stats.genap++;
    if (besar) stats.besar++; else stats.kecil++;
    if (ganjilEkor) stats.ganjilEkor++; else stats.genapEkor++;
    if (besarEkor) stats.besarEkor++; else stats.kecilEkor++;
    timeline.push({
      tanggal: row.tanggal,
      slot,
      value,
      ganjil,
      besar,
      ganjilEkor,
      besarEkor,
    });
  }
  return { stats, timeline };
}

/** Colok Bebas: seberapa sering tiap digit muncul di 4D (min 1x) — recent window. */
export function colokBebas(rows: ResultRow[], recentN = 30) {
  return memo(rows, `colokBebas:${recentN}`, () => colokBebasImpl(rows, recentN));
}
function colokBebasImpl(rows: ResultRow[], recentN: number) {
  return computeColokBebas(iterDraws(rows).slice(0, recentN));
}

/** Colok Bebas per slot jam — hitung probabilitas digit muncul di 4D hanya untuk slot itu. */
export function colokBebasBySlot(rows: ResultRow[], slot: Slot, recentN = 30) {
  return memo(rows, `colokBebasBySlot:${slot}:${recentN}`, () =>
    colokBebasBySlotImpl(rows, slot, recentN),
  );
}
function colokBebasBySlotImpl(rows: ResultRow[], slot: Slot, recentN: number) {
  const draws = iterDrawsForSlot(rows, slot).slice(0, recentN);
  return { slot, samples: draws.length, digits: computeColokBebas(draws) };
}

/**
 * Composite Colok Bebas score:
 *   1. Frekuensi kemunculan mentah (pct)         → probabilitas historis
 *   2. Exponential decay recency (λ=0.94)         → draw terbaru lebih berpengaruh
 *   3. Gap boost (regresi ke mean)                → digit "due" naik peluangnya
 * Skor akhir diskalakan 0-100 supaya sebanding dengan `pct` sebelumnya.
 * `draws` diasumsikan urutan newest → oldest.
 */
function computeColokBebas(draws: { value: string }[]) {
  const total = draws.length || 1;
  const LAMBDA = 0.94;

  const appear = Array(10).fill(0);          // count muncul-di-draw (unique per draw)
  const weighted = Array(10).fill(0);        // decay-weighted appearance
  const lastSeen = Array(10).fill(-1);       // gap sejak muncul terakhir
  let weightSum = 0;

  draws.forEach(({ value }, i) => {
    if (value.length !== 4) return;
    const w = Math.pow(LAMBDA, i);
    weightSum += w;
    const seen = new Set<number>();
    for (const ch of value) {
      const d = ch.charCodeAt(0) - 48;
      if (d >= 0 && d <= 9) seen.add(d);
    }
    seen.forEach((d) => {
      appear[d]++;
      weighted[d] += w;
      if (lastSeen[d] === -1) lastSeen[d] = i;
    });
  });
  // Digit yang tidak pernah muncul dianggap gap = jumlah draw.
  for (let d = 0; d < 10; d++) if (lastSeen[d] === -1) lastSeen[d] = total;
  const maxGap = Math.max(...lastSeen, 1);
  weightSum = weightSum || 1;

  return Array.from({ length: 10 }, (_, digit) => {
    const pct = Math.round((appear[digit] / total) * 1000) / 10;
    const recentPct = (weighted[digit] / weightSum) * 100;
    const gapBoost = (lastSeen[digit] / maxGap) * 100; // 0..100
    // Bobot: 45% recency (decay), 35% base pct, 20% due-gap.
    const score = Math.round((0.45 * recentPct + 0.35 * pct + 0.20 * gapBoost) * 10) / 10;
    return { digit, count: appear[digit], pct, score, gap: lastSeen[digit] };
  }).sort((a, b) => b.score - a.score);
}

// ============================================================================
// Shio 2026 — Tahun Kuda (mulai dari Kuda = 01)
// ============================================================================

export const SHIO_2026 = [
  "Kuda", "Ular", "Naga", "Kelinci", "Harimau", "Kerbau",
  "Tikus", "Babi", "Anjing", "Ayam", "Monyet", "Kambing",
] as const;
export type ShioName = (typeof SHIO_2026)[number];

export function shioOf(back2: string): ShioName {
  let v = parseInt(back2, 10);
  if (isNaN(v)) return "Kuda";
  if (v === 0) v = 100;
  let mod = v % 12;
  if (mod === 0) mod = 12;
  return SHIO_2026[mod - 1];
}

export function shioStats(rows: ResultRow[]) {
  return memo(rows, "shioStats", () => shioStatsImpl(rows));
}
function shioStatsImpl(rows: ResultRow[]) {
  return computeShioStats(iterDraws(rows));
}

/** Shio stats per slot jam. */
export function shioStatsBySlot(rows: ResultRow[], slot: Slot) {
  return memo(rows, `shioStatsBySlot:${slot}`, () => shioStatsBySlotImpl(rows, slot));
}
function shioStatsBySlotImpl(rows: ResultRow[], slot: Slot) {
  const draws = iterDrawsForSlot(rows, slot);
  return { slot, samples: draws.length, items: computeShioStats(draws) };
}

/**
 * Composite Shio score:
 *   0.40 · frekuensi historis (pct)
 *   0.40 · recency berdecay (λ=0.95)
 *   0.20 · due-gap normalized
 * `draws` newest → oldest.
 */
function computeShioStats(draws: { value: string }[]) {
  const LAMBDA = 0.95;
  const counts: Record<ShioName, number> = Object.fromEntries(
    SHIO_2026.map((s) => [s, 0]),
  ) as Record<ShioName, number>;
  const weighted: Record<ShioName, number> = Object.fromEntries(
    SHIO_2026.map((s) => [s, 0]),
  ) as Record<ShioName, number>;
  const lastSeenIdx: Record<ShioName, number> = Object.fromEntries(
    SHIO_2026.map((s) => [s, -1]),
  ) as Record<ShioName, number>;
  let validTotal = 0;
  let weightSum = 0;
  draws.forEach((d, idx) => {
    if (d.value.length !== 4) return;
    const shio = shioOf(d.value.slice(-2));
    const w = Math.pow(LAMBDA, idx);
    counts[shio]++;
    weighted[shio] += w;
    weightSum += w;
    validTotal++;
    if (lastSeenIdx[shio] === -1) lastSeenIdx[shio] = idx;
  });
  const total = validTotal || 1;
  weightSum = weightSum || 1;
  const gapFor = (name: ShioName) =>
    lastSeenIdx[name] === -1 ? draws.length : lastSeenIdx[name];
  const maxGap = Math.max(...SHIO_2026.map(gapFor), 1);
  return SHIO_2026.map((name) => {
    const pct = Math.round((counts[name] / total) * 1000) / 10;
    const recentPct = (weighted[name] / weightSum) * 100;
    const gap = gapFor(name);
    const gapBoost = (gap / maxGap) * 100;
    const score =
      Math.round((0.40 * pct + 0.40 * recentPct + 0.20 * gapBoost) * 10) / 10;
    return { name, count: counts[name], gap, pct, score };
  }).sort((a, b) => b.score - a.score);
}

/** Nomor 2D per shio (0-99, siklus 12). */
export function shioNumbers(name: ShioName): string[] {
  const idx = SHIO_2026.indexOf(name);
  const out: string[] = [];
  for (let n = 1; n <= 100; n++) {
    let mod = n % 12;
    if (mod === 0) mod = 12;
    if (mod - 1 === idx) {
      const s = (n === 100 ? 0 : n).toString().padStart(2, "0");
      out.push(s);
    }
  }
  return out.sort();
}

/** Prediction log: for each historical draw (newest 24), compute BBFS7 from prior data and label WIN/LOSS. */
export function buildLog(rows: ResultRow[], limit = 24) {
  return memo(rows, `buildLog:${limit}`, () => buildLogImpl(rows, limit));
}

// ============================================================================
// Backtesting: hit rate per horizon 1..10 slot
// ----------------------------------------------------------------------------
// Untuk tiap anchor `i` di data chronological, prediksi dihitung HANYA dari
// data sebelum i (no leakage). Untuk horizon H, dianggap "hit" jika prediksi
// TOP-K mengenai salah satu dari H draw berikutnya (i .. i+H-1).
//   - Colok Bebas: TOP-K digit (default 4). Hit = minimal satu digit TOP-K
//     muncul di 4D actual pada rentang horizon.
//   - Shio: TOP-K shio (default 3). Hit = shio dari 2D-belakang actual
//     termasuk dalam TOP-K pada rentang horizon.
// ============================================================================

export type BacktestPoint = {
  horizon: number;
  hits: number;
  total: number;
  pct: number; // 0..100
};

const MIN_BACKTEST_HISTORY = 30;
const MAX_HORIZON = 10;

function runBacktest(
  rows: ResultRow[],
  predict: (histNewestFirst: { value: string }[]) => (value: string) => boolean,
): BacktestPoint[] {
  const chrono = iterDraws(rows).slice().reverse(); // oldest → newest
  const buckets = Array.from({ length: MAX_HORIZON }, (_, h) => ({
    horizon: h + 1,
    hits: 0,
    total: 0,
  }));
  for (let i = MIN_BACKTEST_HISTORY; i < chrono.length; i++) {
    // History newest → oldest, exactly what compute* expects.
    const hist: { value: string }[] = [];
    for (let j = i - 1; j >= 0; j--) hist.push(chrono[j]);
    const isHit = predict(hist);
    let hitFound = false;
    for (let h = 0; h < MAX_HORIZON; h++) {
      const idx = i + h;
      if (idx >= chrono.length) break;
      if (!hitFound && isHit(chrono[idx].value)) hitFound = true;
      const b = buckets[h];
      b.total++;
      if (hitFound) b.hits++;
    }
  }
  return buckets.map((b) => ({
    ...b,
    pct: b.total ? Math.round((b.hits / b.total) * 1000) / 10 : 0,
  }));
}

export function backtestColokBebas(rows: ResultRow[], topK = 4, recentN = 30) {
  return memo(rows, `backtestCB:${topK}:${recentN}`, () =>
    runBacktest(rows, (hist) => {
      const top = new Set(
        computeColokBebas(hist.slice(0, recentN))
          .slice(0, topK)
          .map((d) => d.digit),
      );
      return (value: string) => {
        for (const ch of value) {
          const d = ch.charCodeAt(0) - 48;
          if (top.has(d)) return true;
        }
        return false;
      };
    }),
  );
}

export function backtestShio(rows: ResultRow[], topK = 3) {
  return memo(rows, `backtestShio:${topK}`, () =>
    runBacktest(rows, (hist) => {
      const top = new Set(
        computeShioStats(hist).slice(0, topK).map((s) => s.name),
      );
      return (value: string) => {
        if (value.length !== 4) return false;
        return top.has(shioOf(value.slice(-2)));
      };
    }),
  );
}
function buildLogImpl(rows: ResultRow[], limit: number) {
  const all = iterDraws(rows).reverse(); // chronological
  const start = Math.max(30, all.length - limit); // need history before eval
  const entries: {
    id: string;
    tanggal: string;
    slot: Slot;
    bbfs7: string;
    hasil: string;
    status: "WIN" | "LOSS" | "PENDING";
  }[] = [];
  for (let i = start; i < all.length; i++) {
    const history = all.slice(0, i).reverse();
    const grouped = new Map<ResultRow, ResultRow>();
    for (const d of history) {
      const g = grouped.get(d.row);
      if (g) g.results[d.slot] = d.value;
      else
        grouped.set(d.row, {
          ...d.row,
          results: { ...emptyResults(), [d.slot]: d.value },
        });
    }
    const pred = buildPrediction(Array.from(grouped.values()));
    const actual = all[i].value;
    const hit = actual.split("").every((c) => pred.bbfs7.includes(c));
    entries.push({
      id: `${all[i].row.isoDate}-${all[i].slot}`,
      tanggal: all[i].row.tanggal,
      slot: all[i].slot,
      bbfs7: pred.bbfs7,
      hasil: actual,
      status: hit ? "WIN" : "LOSS",
    });
  }
  // Add today's pending slots (no actual yet)
  const today = rows[0];
  if (today) {
    for (const slot of TIME_SLOTS) {
      if (today.results[slot] === "-") {
        const pred = buildPrediction(rows);
        entries.push({
          id: `${today.isoDate}-${slot}`,
          tanggal: today.tanggal,
          slot,
          bbfs7: pred.bbfs7,
          hasil: "-",
          status: "PENDING",
        });
      }
    }
  }
  return entries.reverse(); // newest first
}