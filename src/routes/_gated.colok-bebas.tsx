import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import { colokBebas } from "@/lib/lottery-analysis";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/_gated/colok-bebas")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: ColokBebasPage,
});

function ColokBebasPage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  const recent = useMemo(() => colokBebas(feed.rows, 30), [feed]);
  const long = useMemo(() => colokBebas(feed.rows, 90), [feed]);
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
            Peluang tiap digit muncul minimal 1× di hasil 4D, dari 30 draw terakhir sumber {feed.source}.
          </p>
          <div className="flex gap-2">
            {top4.map((d) => (
              <div key={d.digit} className="flex flex-col items-center rounded-xl border border-primary/40 bg-primary/10 px-4 py-3">
                <span className="font-mono text-3xl font-black text-primary">{d.digit}</span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{d.pct}%</span>
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
              {panel.data.map((d) => (
                <div key={d.digit} className="flex items-center gap-3">
                  <span className="w-6 font-mono text-lg font-black text-foreground">{d.digit}</span>
                  <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="w-14 text-right font-mono text-xs font-bold text-muted-foreground">{d.pct}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}