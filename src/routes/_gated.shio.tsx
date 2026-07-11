import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import { shioStats, shioStatsBySlot, shioNumbers, type ShioName } from "@/lib/lottery-analysis";
import { TIME_SLOTS } from "@/lib/lottery.functions";
import { Compass } from "lucide-react";

export const Route = createFileRoute("/_gated/shio")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: ShioPage,
});

function ShioPage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  const stats = useMemo(() => shioStats(feed.rows), [feed]);
  const perSlot = useMemo(
    () => TIME_SLOTS.map((s) => shioStatsBySlot(feed.rows, s)),
    [feed],
  );
  const [selected, setSelected] = useState<ShioName>(stats[0]?.name ?? "Kuda");
  const nums = shioNumbers(selected);
  const maxCount = stats[0]?.count || 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Compass className="h-4 w-4 text-primary" /> Prediksi Shio 2026 (Kuda Api)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Frekuensi & gap kemunculan tiap shio dari 2D belakang, {feed.rows.length} hari data real ({feed.source}). Shio 01 = Kuda (kalender 2026).
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => {
          const active = s.name === selected;
          return (
            <button
              key={s.name}
              onClick={() => setSelected(s.name)}
              className={`rounded-xl border p-3 text-left transition ${active ? "border-primary bg-primary/15" : "border-border bg-card hover:border-primary/50"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-foreground">{s.name}</span>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] font-bold">{s.pct}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${Math.round((s.count / maxCount) * 100)}%` }} />
              </div>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {s.count} hit · gap {s.gap}
              </p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Nomor 2D — Shio {selected}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {nums.map((n) => (
              <span key={n} className="rounded-md bg-primary/15 px-2.5 py-1 font-mono text-xs font-black text-primary">{n}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Shio Terkuat Per Slot Jam</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {perSlot.map((panel) => {
              const top3 = panel.items.slice(0, 3);
              const max = top3[0]?.count || 1;
              return (
                <div key={panel.slot} className="rounded-xl border border-border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-sm font-black text-primary">{panel.slot}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {panel.samples} draw
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {top3.map((it) => (
                      <div key={it.name} className="flex items-center gap-2 text-[11px]">
                        <span className="w-16 font-bold text-foreground">{it.name}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${Math.round((it.count / max) * 100)}%` }} />
                        </div>
                        <span className="w-14 text-right font-mono text-muted-foreground">
                          {it.count}× · g{it.gap}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}