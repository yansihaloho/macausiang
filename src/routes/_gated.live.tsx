import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIME_SLOTS } from "@/lib/lottery.functions";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/_gated/live")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: LivePage,
});

function nextSlotSeconds(): { label: string; secs: number } {
  const now = new Date();
  // Konversi waktu lokal → WIB (UTC+7) apa pun timezone user.
  // getTimezoneOffset() = menit yang ditambahkan ke waktu lokal utk mendapat UTC.
  const wib = new Date(now.getTime() + (now.getTimezoneOffset() + 7 * 60) * 60_000);
  const mins = wib.getUTCHours() * 60 + wib.getUTCMinutes();
  const slots = [1, 13 * 60, 16 * 60, 19 * 60, 22 * 60, 23 * 60];
  const labels = ["00:01", "13:00", "16:00", "19:00", "22:00", "23:00"];
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] > mins) {
      const diff = (slots[i] - mins) * 60 - wib.getUTCSeconds();
      return { label: labels[i], secs: diff };
    }
  }
  return { label: "00:01", secs: (24 * 60 + 1 - mins) * 60 - wib.getUTCSeconds() };
}

function fmt(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

function LivePage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  const rows = feed.rows;
  const [countdown, setCountdown] = useState(nextSlotSeconds());
  useEffect(() => {
    const id = setInterval(() => setCountdown(nextSlotSeconds()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalWindow = 60 * 60 * 4;
  const pct = Math.max(0, Math.min(1, 1 - countdown.secs / totalWindow));
  const dash = 2 * Math.PI * 70;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm">Slot Berikutnya</CardTitle>
            <Badge className="gap-1 bg-emerald-500/20 text-emerald-400">
              <Radio className="h-3 w-3 animate-pulse" /> LIVE
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" stroke="var(--muted)" strokeWidth="10" fill="none" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="var(--primary)"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={dash}
                  strokeDashoffset={dash * (1 - pct)}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="text-center">
                <p className="font-mono text-2xl font-black text-foreground">
                  {fmt(countdown.secs)}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  menuju {countdown.label}
                </p>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Auto-refresh setiap detik. Result akan muncul otomatis setelah draw.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Live Result — 8 hari terakhir</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="px-2 py-2 text-left">Tanggal</th>
                  {TIME_SLOTS.map((s) => (
                    <th key={s} className="px-2 py-2 text-center">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((r) => (
                  <tr key={r.isoDate || r.tanggal} className="border-b border-border/50">
                    <td className="px-2 py-2 text-xs">
                      <p className="font-semibold text-foreground">{r.hari}</p>
                      <p className="text-muted-foreground">{r.tanggal}</p>
                    </td>
                    {TIME_SLOTS.map((s) => (
                      <td key={s} className="px-2 py-2 text-center font-mono font-bold text-foreground">
                        {r.results[s]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Sumber: {feed.source} · terakhir diambil{" "}
              {new Date(feed.fetchedAt).toLocaleString("id-ID")} · auto-refresh 5 menit
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}