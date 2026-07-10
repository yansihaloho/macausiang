import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import { TIME_SLOTS } from "@/lib/lottery.functions";
import { Grid3x3 } from "lucide-react";

export const Route = createFileRoute("/_gated/paito")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: PaitoPage,
});

const COLORS = [
  { name: "None", cls: "" },
  { name: "Merah", cls: "bg-rose-500/70 text-white" },
  { name: "Kuning", cls: "bg-amber-400/80 text-black" },
  { name: "Hijau", cls: "bg-emerald-500/70 text-white" },
  { name: "Biru", cls: "bg-sky-500/70 text-white" },
  { name: "Ungu", cls: "bg-violet-500/70 text-white" },
];

function PaitoPage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  const [activeColor, setActiveColor] = useState(1);
  const [cells, setCells] = useState<Record<string, number>>({});

  function toggle(key: string) {
    setCells((prev) => {
      const next = { ...prev };
      if (prev[key] === activeColor) delete next[key];
      else next[key] = activeColor;
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Grid3x3 className="h-4 w-4 text-primary" /> Paito Warna — Interaktif
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Klik cell untuk mewarnai (pola manual). {feed.rows.length} hari data real · {feed.source}.
          </p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c, i) => (
              <button
                key={i}
                onClick={() => setActiveColor(i)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${activeColor === i ? "border-primary ring-2 ring-primary/40" : "border-border"} ${c.cls || "bg-muted text-foreground"}`}
              >
                {c.name}
              </button>
            ))}
            <button
              onClick={() => setCells({})}
              className="ml-auto rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-center">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="sticky left-0 z-10 bg-muted/80 px-3 py-2 text-left">Tanggal</th>
                  {TIME_SLOTS.map((s) => (
                    <th key={s} className="px-2 py-2 font-mono">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feed.rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-border/40">
                    <td className="sticky left-0 z-10 bg-card px-3 py-1.5 text-left font-mono text-[11px] text-muted-foreground">
                      {row.tanggal}
                    </td>
                    {TIME_SLOTS.map((s, ci) => {
                      const key = `${ri}-${ci}`;
                      const colorIdx = cells[key] ?? 0;
                      const color = COLORS[colorIdx];
                      const v = row.results[s];
                      return (
                        <td
                          key={s}
                          onClick={() => toggle(key)}
                          className={`cursor-pointer px-2 py-1.5 font-mono text-xs font-bold ${color.cls || "text-foreground hover:bg-muted/40"}`}
                        >
                          {v && v !== "-" ? v : "----"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}