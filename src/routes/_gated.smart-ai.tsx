import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { buildAiPrediction, engineConfidences, TIME_SLOTS } from "@/lib/mock-data";
import { Sparkles, Cpu } from "lucide-react";

export const Route = createFileRoute("/_gated/smart-ai")({
  component: SmartAiPage,
});

function SmartAiPage() {
  const engines = engineConfidences();
  const pred = buildAiPrediction(21);
  const meta = Math.round(engines.reduce((a, e) => a + e.confidence, 0) / engines.length);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-transparent lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" /> CERDAS — 20-Engine Ensemble
            </CardTitle>
            <Badge className="bg-primary/20 text-primary">Meta {meta}%</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                BBFS 7 (rekomendasi)
              </p>
              <div className="flex gap-2">
                {pred.bbfs7.split("").map((d, i) => (
                  <span
                    key={i}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/25 font-mono text-2xl font-black text-primary shadow-inner"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Top-25 · 2D
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pred.top25.map((n) => (
                  <span
                    key={n}
                    className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-bold text-foreground"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rekomendasi per Slot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {TIME_SLOTS.map((s, i) => {
              const p = buildAiPrediction(100 + i);
              return (
                <div key={s} className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <span className="text-xs font-bold text-muted-foreground">{s}</span>
                  <span className="font-mono text-sm font-black text-foreground">{p.bbfs7}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Cpu className="h-4 w-4 text-primary" /> Confidence per Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {engines.map((e) => (
              <div key={e.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{e.name}</span>
                  <span className="font-mono font-bold text-muted-foreground">
                    {e.confidence}%
                  </span>
                </div>
                <Progress value={e.confidence} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}