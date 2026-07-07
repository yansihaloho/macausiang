import { createServerFn } from "@tanstack/react-start";

export const TIME_SLOTS = ["00:01", "13:00", "16:00", "19:00", "22:00", "23:00"] as const;
export type Slot = (typeof TIME_SLOTS)[number];

export type ResultRow = {
  /** Original short date from source, e.g. "07 Jul". */
  tanggal: string;
  /** Resolved ISO date (yyyy-mm-dd) in WIB, best-effort. */
  isoDate: string;
  /** Day-of-week label in Indonesian. */
  hari: string;
  results: Record<Slot, string>;
};

export type LotteryFeed = {
  source: "nomorupdate.org";
  fetchedAt: string;
  rows: ResultRow[];
};

const BULAN_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, May: 4, Jun: 5, Jul: 6,
  Agu: 7, Aug: 7, Sep: 8, Okt: 9, Oct: 9, Nov: 10, Des: 11, Dec: 11,
};
const HARI_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function resolveIsoDate(shortDate: string, todayWIB: Date): { iso: string; hari: string } {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})/.exec(shortDate.trim());
  if (!m) return { iso: "", hari: "" };
  const day = parseInt(m[1], 10);
  const monKey = m[2].charAt(0).toUpperCase() + m[2].slice(1, 3).toLowerCase();
  const mon = BULAN_MAP[monKey];
  if (mon === undefined) return { iso: "", hari: "" };
  let year = todayWIB.getUTCFullYear();
  // If the parsed month is greater than current WIB month, it must belong to previous year.
  if (mon > todayWIB.getUTCMonth()) year -= 1;
  const d = new Date(Date.UTC(year, mon, day));
  const iso = d.toISOString().slice(0, 10);
  const hari = HARI_ID[d.getUTCDay()];
  return { iso, hari };
}

function parseNomorUpdate(html: string): ResultRow[] {
  // Rows in the source: <tr> <td>date</td> <td>00:01</td> ... 6 slots </tr>
  const rowRe = /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<\/tr>/g;
  const rows: ResultRow[] = [];
  const now = new Date();
  const wibNow = new Date(now.getTime() + 7 * 3600_000);
  for (const m of html.matchAll(rowRe)) {
    const [, tanggal, s1, s2, s3, s4, s5, s6] = m;
    const clean = (v: string) => {
      const t = v.trim();
      return /^\d{4}$/.test(t) ? t : "-";
    };
    const { iso, hari } = resolveIsoDate(tanggal, wibNow);
    rows.push({
      tanggal: tanggal.trim(),
      isoDate: iso,
      hari,
      results: {
        "00:01": clean(s1),
        "13:00": clean(s2),
        "16:00": clean(s3),
        "19:00": clean(s4),
        "22:00": clean(s5),
        "23:00": clean(s6),
      },
    });
  }
  return rows;
}

// Opportunistic in-memory cache within a warm Worker isolate.
let cache: { at: number; feed: LotteryFeed } | null = null;
const TTL_MS = 5 * 60_000;

export const getLotteryFeed = createServerFn({ method: "GET" })
  .inputValidator((data: { force?: boolean } | undefined) => data ?? {})
  .handler(async ({ data }): Promise<LotteryFeed> => {
    const force = data?.force === true;
    if (!force && cache && Date.now() - cache.at < TTL_MS) {
      return cache.feed;
    }
    try {
      const res = await fetch("https://nomorupdate.org/", {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; StrategiBesar/1.0; +https://lovable.dev)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        throw new Error(`nomorupdate.org returned ${res.status}`);
      }
      const html = await res.text();
      const rows = parseNomorUpdate(html);
      if (rows.length === 0) {
        throw new Error("Tidak ada baris result yang berhasil di-parse.");
      }
      const feed: LotteryFeed = {
        source: "nomorupdate.org",
        fetchedAt: new Date().toISOString(),
        rows,
      };
      cache = { at: Date.now(), feed };
      return feed;
    } catch (err) {
      // If we have any cached data, keep serving it and mark stale in fetchedAt.
      if (cache) return cache.feed;
      throw err instanceof Error ? err : new Error(String(err));
    }
  });