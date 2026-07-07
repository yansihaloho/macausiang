import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import { getLotteryFeed } from "@/lib/lottery.functions";
import { engineConfidences, digitFrequency, digitGaps, buildPrediction } from "@/lib/lottery-analysis";
import { Brain, Cpu, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_gated/otak-ai")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: OtakAiPage,
});

function OtakAiPage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  const rows = feed.rows;
  const qc = useQueryClient();
  const router = useRouter();

  const engines = engineConfidences(rows);
  const freq = digitFrequency(rows);
  const gaps = digitGaps(rows);
  const pred = buildPrediction(rows);
  const totalDraws = freq.reduce((a, f) => a + f.count, 0) / 4; // 4 digits per draw

  const [refreshing, setRefreshing] = useState(false);
  async function forceRefresh() {
    setRefreshing(true);
    toast.info("Menarik data terbaru dari nomorupdate.org…");
    try {
      const fresh = await getLotteryFeed({ data: { force: true } });
      qc.setQueryData(lotteryQueryOptions.queryKey, fresh);
      await router.invalidate();
      toast.success("Data ter-refresh dan model dihitung ulang.");
    } catch (e) {
      toast.error(`Gagal refresh: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRefreshing(false);
    }
  }

  const thoughts = [
    `Meta ensemble: BBFS7 = ${pred.bbfs7}. Top-25 pertama = ${pred.top25.slice(0, 5).join(", ")}.`,
    `Digit terpanas: ${[...freq].sort((a, b) => b.count - a.count).slice(0, 3).map((f) => `${f.digit}(${f.pct}%)`).join(", ")}.`,
    `Due digits (gap ≥): ${[...gaps].sort((a, b) => b.gap - a.gap).slice(0, 3).map((g) => `${g.digit} gap=${g.gap}`).join(", ")}.`,
    `Sample training: ${Math.round(totalDraws)} draw real (${rows.length} hari) dari ${feed.source}.`,
    `Feed terakhir di-fetch: ${new Date(feed.fetchedAt).toLocaleString("id-ID")}.`,
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-primary/40 bg-gradient-to-br from-primary/15 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-primary" /> AI Brain State
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Total draw analyzed" v={String(Math.round(totalDraws))} />
            <Row k="Hari data" v={String(rows.length)} />
            <Row k="Sumber" v={feed.source} />
            <Row k="Last fetch" v={new Date(feed.fetchedAt).toLocaleTimeString("id-ID")} />
            <Row
              k="Auto-refresh"
              v={<Badge className="bg-emerald-500/20 text-emerald-400">tiap 5 menit</Badge>}
            />
            <Button onClick={forceRefresh} disabled={refreshing} className="mt-3 w-full gap-2">
              <Zap className="h-4 w-4" />
              {refreshing ? "Menarik data…" : "Force Refresh dari Sumber"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cpu className="h-4 w-4 text-primary" /> Bobot Engine (dihitung dari data real)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {engines.map((e) => (
                <div key={e.name} className="rounded-lg border border-border bg-muted/40 p-2">
                  <p className="truncate text-[11px] font-bold text-foreground">{e.name}</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-mono text-lg font-black text-primary">
                      {e.confidence}
                    </span>
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                  <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{e.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Think Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {thoughts.map((t, i) => (
              <li
                key={i}
                className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground"
              >
                {t}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-bold text-foreground">{v}</span>
    </div>
  );
}