import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import { buildTardal, TIME_SLOTS, type Slot } from "@/lib/lottery-analysis";
import { Layers } from "lucide-react";

export const Route = createFileRoute("/_gated/tardal")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: TardalPage,
});

function TardalPage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4 text-primary" /> TARDAL — Analisa Per Slot Jam
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Top 5 digit terkuat di tiap posisi (AS / KOP / KEPALA / EKOR) dihitung
            per slot jam, dari {feed.rows.length} hari data real ({feed.source}).
            Skor = % kemunculan digit di posisi tersebut untuk slot itu.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue={TIME_SLOTS[0]}>
        <TabsList className="grid w-full grid-cols-6">
          {TIME_SLOTS.map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs font-mono">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
        {TIME_SLOTS.map((slot) => (
          <TabsContent key={slot} value={slot} className="mt-4">
            <SlotTardal rows={feed.rows} slot={slot} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function SlotTardal({ rows, slot }: { rows: import("@/lib/lottery-analysis").ResultRow[]; slot: Slot }) {
  // Keep only this slot's value in each row, blank the rest.
  const filtered = rows.map((r) => ({
    ...r,
    results: TIME_SLOTS.reduce(
      (acc, s) => ({ ...acc, [s]: s === slot ? r.results[s] : "-" }),
      {} as Record<Slot, string>,
    ),
  }));
  const samples = filtered.filter((r) => r.results[slot] !== "-").length;
  const t = buildTardal(filtered);
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">
        Slot <span className="font-mono font-bold text-primary">{slot}</span> · {samples} draw dianalisa
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {t.map(({ position, digits }) => {
          const top5 = digits.slice(0, 5);
          const maxScore = top5[0]?.score || 1;
          return (
            <Card key={position}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">Posisi {position}</CardTitle>
                <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-black text-primary">
                  Top: {top5[0]?.digit ?? "-"} · {top5[0]?.score ?? 0}%
                </span>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {top5.map((d, i) => (
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