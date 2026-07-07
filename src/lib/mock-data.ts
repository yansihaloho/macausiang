// Deterministic mock data for the 4D Macau dashboard demo.

export const TIME_SLOTS = ["00:01", "13:00", "16:00", "19:00", "22:00", "23:00"] as const;
export type Slot = (typeof TIME_SLOTS)[number];

const HARI_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export type ResultRow = {
  hari: string;
  tanggal: string;
  results: Record<Slot, string>;
};

// Simple seeded PRNG so mock data is stable across renders/refresh.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pad4(n: number) {
  return n.toString().padStart(4, "0");
}

export function buildMockResults(days = 10): ResultRow[] {
  const rng = seeded(20260707);
  const today = new Date();
  const rows: ResultRow[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const results = {} as Record<Slot, string>;
    TIME_SLOTS.forEach((slot) => {
      // Latest slot of "today" might not have drawn yet in a real feed.
      if (i === 0 && (slot === "22:00" || slot === "23:00")) {
        results[slot] = "-";
      } else {
        results[slot] = pad4(Math.floor(rng() * 10000));
      }
    });
    rows.push({
      hari: HARI_ID[d.getDay()],
      tanggal: `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`,
      results,
    });
  }
  return rows;
}

export const MOCK_RESULTS = buildMockResults(10);

// Digit frequency across last N draws
export function digitFrequency(rows: ResultRow[]) {
  const freq = Array(10).fill(0);
  rows.forEach((r) =>
    TIME_SLOTS.forEach((slot) => {
      const v = r.results[slot];
      if (!v || v === "-") return;
      for (const ch of v) {
        const d = parseInt(ch, 10);
        if (!isNaN(d)) freq[d]++;
      }
    }),
  );
  return freq.map((count, digit) => ({ digit, count }));
}

// Fake AI predictions (BBFS + top-25)
export function buildAiPrediction(seed = 42) {
  const rng = seeded(seed);
  const digits = new Set<number>();
  while (digits.size < 7) digits.add(Math.floor(rng() * 10));
  const bbfs7 = Array.from(digits).sort((a, b) => a - b).join("");
  const bbfs9 = Array.from({ length: 10 }, (_, i) => i)
    .filter((d) => rng() > 0.15)
    .slice(0, 9)
    .join("");
  const top25 = new Set<string>();
  while (top25.size < 25) top25.add(pad4(Math.floor(rng() * 10000)).slice(-2));
  return {
    bbfs5: bbfs7.slice(0, 5),
    bbfs7,
    bbfs9,
    top25: Array.from(top25),
  };
}

// 20-engine ensemble mock (name + confidence)
export const AI_ENGINES = [
  "Markov-1", "Markov-2", "Markov-3", "Freq-Recent", "Freq-Long",
  "Gap-Weighted", "Due-Digit", "Position-AS", "Position-KOP", "Position-KEPALA",
  "Position-EKOR", "Pair-Adjacency", "Streak-Break", "Cold-Reversion", "Hot-Follow",
  "Odd/Even-Balance", "Sum-Modular", "Mirror-Digit", "Diff-Cascade", "Ensemble-Meta",
];

export function engineConfidences(seed = 7) {
  const rng = seeded(seed);
  return AI_ENGINES.map((name) => ({
    name,
    confidence: Math.round(45 + rng() * 50),
    contribution: Math.round(rng() * 100),
  }));
}

// TARDAL per-position digits
export function buildTardal(seed = 11) {
  const rng = seeded(seed);
  const pos = (offset: number) =>
    Array.from({ length: 10 }, (_, d) => ({
      digit: d,
      score: Math.round(20 + seeded(seed + offset + d * 13)() * 80),
    })).sort((a, b) => b.score - a.score);
  return {
    AS: pos(1),
    KOP: pos(2),
    KEPALA: pos(3),
    EKOR: pos(4),
    generatedAt: new Date().toISOString(),
    _rng: rng,
  };
}

// Sliding window accuracy per slot
export function buildAccuracy() {
  const rng = seeded(99);
  return TIME_SLOTS.map((slot) => ({
    slot,
    bbfs5: Math.round(30 + rng() * 40),
    bbfs7: Math.round(45 + rng() * 40),
    bbfs9: Math.round(60 + rng() * 35),
    top25: Math.round(20 + rng() * 45),
    samples: 40 + Math.floor(rng() * 60),
  }));
}

// Prediction log entries for Laporan
export function buildLog() {
  const rng = seeded(555);
  const rows: {
    id: string;
    tanggal: string;
    slot: Slot;
    bbfs7: string;
    hasil: string;
    status: "WIN" | "LOSS" | "PENDING";
  }[] = [];
  const today = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - Math.floor(i / TIME_SLOTS.length));
    const slot = TIME_SLOTS[i % TIME_SLOTS.length];
    const digits = new Set<number>();
    while (digits.size < 7) digits.add(Math.floor(rng() * 10));
    const bbfs7 = Array.from(digits).sort().join("");
    const hasil = i < 2 ? "-" : pad4(Math.floor(rng() * 10000));
    let status: "WIN" | "LOSS" | "PENDING" = "PENDING";
    if (hasil !== "-") {
      const hit = hasil.split("").every((c) => bbfs7.includes(c));
      status = hit ? "WIN" : "LOSS";
    }
    rows.push({
      id: `${d.toISOString().slice(0, 10)}-${slot}`,
      tanggal: `${d.getDate()} ${BULAN_ID[d.getMonth()]}`,
      slot,
      bbfs7,
      hasil,
      status,
    });
  }
  return rows;
}

// AI brain "thoughts"
export const AI_THOUGHTS = [
  { time: "22:14:03", msg: "Slot 22:00 → hot digits (2,7,9) still trending. Bumping weight +0.12." },
  { time: "22:11:41", msg: "Markov-3 flagged 47→81 transition. Cross-checking with Freq-Long." },
  { time: "22:07:22", msg: "Gap-Weighted engine: digit 4 overdue by 11 draws." },
  { time: "22:02:18", msg: "Cold-Reversion learned from LOSS 19:00 (7482). Penalty applied to Cold engine." },
  { time: "21:58:05", msg: "Ensemble-Meta rebalanced. Position-EKOR now leading contributor." },
  { time: "21:44:39", msg: "Auto-generated top-25 for 22:00. BBFS7 = 0234789." },
];