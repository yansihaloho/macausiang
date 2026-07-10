import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import { shioStats, shioNumbers, type ShioName } from "@/lib/lottery-analysis";
import { Compass } from "lucide-react";

export const Route = createFileRoute("/_gated/shio")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: ShioPage,
});

function ShioPage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  const stats = useMemo(() => shioStats(feed.rows), [feed]);
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
    </div>
  );
}