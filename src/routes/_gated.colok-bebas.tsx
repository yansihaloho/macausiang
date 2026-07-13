import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import { colokBebas, colokBebasBySlot } from "@/lib/lottery-analysis";
import { TIME_SLOTS } from "@/lib/lottery.functions";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/_gated/colok-bebas")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: ColokBebasPage,
});

function ColokBebasPage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  const recent = useMemo(() => colokBebas(feed.rows, 30), [feed]);
  const long = useMemo(() => colokBebas(feed.rows, 90), [feed]);
  const perSlot = useMemo(
    () => TIME_SLOTS.map((s) => colokBebasBySlot(feed.rows, s, 30)),
    [feed],
  );
  const top4 = recent.slice(0, 4);

  return (
    <div className="space-y-6">
      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-primary" /> Colok Bebas — Rekomendasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Skor komposit tiap digit: 45% recency berdecay (λ=0.94) · 35% frekuensi historis · 20% due-gap. Data {feed.source}.
          </p>
          <div className="flex gap-2">
            {top4.map((d) => (
              <div key={d.digit} className="flex flex-col items-center rounded-xl border border-primary/40 bg-primary/10 px-4 py-3">
                <span className="font-mono text-3xl font-black text-primary">{d.digit}</span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  skor {d.score}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { title: "30 Draw Terakhir", data: recent },
          { title: "90 Draw (Long-Term)", data: long },
        ].map((panel) => (
          <Card key={panel.title}>
            <CardHeader><CardTitle className="text-sm">{panel.title}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(() => {
                const maxScore = Math.max(...panel.data.map((d) => d.score), 1);
                return panel.data.map((d) => (
                <div key={d.digit} className="flex items-center gap-3">
                  <span className="w-6 font-mono text-lg font-black text-foreground">{d.digit}</span>
                  <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${Math.round((d.score / maxScore) * 100)}%` }} />
                  </div>
                  <span className="w-20 text-right font-mono text-[10px] font-bold text-muted-foreground">
                    {d.pct}% · g{d.gap}
                  </span>
                </div>
                ));
              })()}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Rekomendasi Per Slot Jam (30 draw)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {perSlot.map((panel) => (
              <div key={panel.slot} className="rounded-xl border border-border bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-primary">{panel.slot}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {panel.samples} draw
                  </span>
                </div>
                <div className="mb-2 flex gap-1.5">
                  {panel.digits.slice(0, 4).map((d) => (
                    <span key={d.digit} className="rounded-md bg-primary/15 px-2 py-1 font-mono text-sm font-black text-primary">
                      {d.digit}
                    </span>
                  ))}
                </div>
                <div className="space-y-1">
                  {(() => {
                    const top = panel.digits.slice(0, 6);
                    const maxS = Math.max(...top.map((d) => d.score), 1);
                    return top.map((d) => (
                    <div key={d.digit} className="flex items-center gap-2 text-[11px]">
                      <span className="w-4 font-mono font-bold text-foreground">{d.digit}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${Math.round((d.score / maxS) * 100)}%` }} />
                      </div>
                      <span className="w-10 text-right font-mono text-muted-foreground">{d.pct}%</span>
                    </div>
                    ));
                  })()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}