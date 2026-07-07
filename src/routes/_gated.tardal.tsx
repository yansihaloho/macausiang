import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import { buildTardal } from "@/lib/lottery-analysis";
import { Layers } from "lucide-react";

export const Route = createFileRoute("/_gated/tardal")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: TardalPage,
});

function TardalPage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  const t = buildTardal(feed.rows);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4 text-primary" /> TARDAL — Analisa Per Posisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Frekuensi digit di masing-masing posisi (AS / KOP / KEPALA / EKOR), dihitung
            dari {feed.rows.length} hari data real ({feed.source}). Skor = persentase
            kemunculan digit tersebut di posisi itu.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {t.map(({ position, digits }) => {
          const top = digits[0];
          const maxScore = digits[0].score || 1;
          return (
            <Card key={position}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">Posisi {position}</CardTitle>
                <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-black text-primary">
                  Top: {top.digit} · {top.score}%
                </span>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {digits.map((d, i) => (
                    <div
                      key={d.digit}
                      className={`rounded-lg border p-2 text-center ${
                        i < 3
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-muted/30"
                      }`}
                    >
                      <p className="font-mono text-xl font-black text-foreground">{d.digit}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {d.score}%
                      </p>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min(100, (d.score / maxScore) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}