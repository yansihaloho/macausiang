import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TIME_SLOTS } from "@/lib/lottery.functions";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import { buildSlotPrediction, digitGaps } from "@/lib/lottery-analysis";
import { Target } from "lucide-react";

export const Route = createFileRoute("/_gated/prediksi")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: PrediksiPage,
});

function PrediksiPage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  const rows = feed.rows;
  const gaps = digitGaps(rows);
  const due = [...gaps].sort((a, b) => b.gap - a.gap).slice(0, 4);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-primary" /> Slot-Chain Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Menganalisa gap kemunculan tiap digit di {rows.length} hari data real dari{" "}
            {feed.source}. "Due" = digit dengan gap terpanjang sejak kemunculan terakhir.
          </p>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Due Digits (gap tertinggi)
            </p>
            <div className="flex gap-3">
              {due.map((d) => (
                <div
                  key={d.digit}
                  className="flex flex-col items-center rounded-xl border border-primary/40 bg-primary/10 px-4 py-3"
                >
                  <span className="font-mono text-3xl font-black text-primary">{d.digit}</span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    gap {d.gap}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Prediksi per Slot (analisa spesifik slot)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2 text-left">Slot</th>
                  <th className="px-3 py-2 text-center">BBFS 5</th>
                  <th className="px-3 py-2 text-center">BBFS 7</th>
                  <th className="px-3 py-2 text-center">BBFS 9</th>
                  <th className="px-3 py-2 text-left">Top-25 (preview)</th>
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((s) => {
                  const p = buildSlotPrediction(rows, s);
                  return (
                    <tr key={s} className="border-b border-border/40">
                      <td className="px-3 py-2 font-bold text-foreground">{s}</td>
                      <td className="px-3 py-2 text-center font-mono">{p.bbfs5}</td>
                      <td className="px-3 py-2 text-center font-mono">{p.bbfs7}</td>
                      <td className="px-3 py-2 text-center font-mono">{p.bbfs9}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {p.top25.slice(0, 8).join(", ")}…
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}