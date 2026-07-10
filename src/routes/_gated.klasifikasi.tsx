import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import { classifyStats } from "@/lib/lottery-analysis";
import { Scale } from "lucide-react";

export const Route = createFileRoute("/_gated/klasifikasi")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: KlasifikasiPage,
});

function KlasifikasiPage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  const { stats, timeline } = useMemo(() => classifyStats(feed.rows), [feed]);
  const pct = (n: number) => (stats.total ? Math.round((n / stats.total) * 100) : 0);

  const groups = [
    { key: "ganjil", label: "Ganjil vs Genap (2D belakang)", a: { label: "Ganjil", v: stats.ganjil }, b: { label: "Genap", v: stats.genap } },
    { key: "besar", label: "Besar vs Kecil (2D ≥ 50)", a: { label: "Besar", v: stats.besar }, b: { label: "Kecil", v: stats.kecil } },
    { key: "ganjilEkor", label: "Ganjil-Ekor vs Genap-Ekor", a: { label: "Ganjil-E", v: stats.ganjilEkor }, b: { label: "Genap-E", v: stats.genapEkor } },
    { key: "besarEkor", label: "Besar-Ekor (≥5) vs Kecil-Ekor", a: { label: "Besar-E", v: stats.besarEkor }, b: { label: "Kecil-E", v: stats.kecilEkor } },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Scale className="h-4 w-4 text-primary" /> Klasifikasi Ganjil / Genap / Besar / Kecil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Analisa {stats.total} draw real dari {feed.source}. Basis: 2D belakang
            (KEPALA-EKOR) & digit EKOR terakhir.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => {
          const pctA = pct(g.a.v);
          const pctB = 100 - pctA;
          return (
            <Card key={g.key}>
              <CardHeader>
                <CardTitle className="text-sm">{g.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-emerald-400">{g.a.label} · {g.a.v} ({pctA}%)</span>
                  <span className="text-rose-400">{g.b.label} · {g.b.v} ({pctB}%)</span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                  <div className="bg-emerald-500" style={{ width: `${pctA}%` }} />
                  <div className="bg-rose-500" style={{ width: `${pctB}%` }} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Timeline Draw Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="depan">
            <TabsList>
              <TabsTrigger value="depan">Depan (2D belakang)</TabsTrigger>
              <TabsTrigger value="ekor">Ekor</TabsTrigger>
            </TabsList>
            <TabsContent value="depan" className="mt-3">
              <TimelineTable timeline={timeline} mode="depan" />
            </TabsContent>
            <TabsContent value="ekor" className="mt-3">
              <TimelineTable timeline={timeline} mode="ekor" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineTable({
  timeline,
  mode,
}: {
  timeline: ReturnType<typeof classifyStats>["timeline"];
  mode: "depan" | "ekor";
}) {
  const rows = timeline.slice(0, 60);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-xs">
        <thead className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 text-left">Tgl</th>
            <th className="px-2 py-1.5 text-left">Slot</th>
            <th className="px-2 py-1.5 text-left">Hasil</th>
            <th className="px-2 py-1.5 text-center">Ganjil/Genap</th>
            <th className="px-2 py-1.5 text-center">Besar/Kecil</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => {
            const isGanjil = mode === "depan" ? t.ganjil : t.ganjilEkor;
            const isBesar = mode === "depan" ? t.besar : t.besarEkor;
            return (
              <tr key={i} className="border-b border-border/40">
                <td className="px-2 py-1.5 text-muted-foreground">{t.tanggal}</td>
                <td className="px-2 py-1.5 font-mono text-muted-foreground">{t.slot}</td>
                <td className="px-2 py-1.5 font-mono font-black text-foreground">{t.value}</td>
                <td className="px-2 py-1.5 text-center">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${isGanjil ? "bg-amber-500/20 text-amber-400" : "bg-sky-500/20 text-sky-400"}`}>
                    {isGanjil ? "GANJIL" : "GENAP"}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${isBesar ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                    {isBesar ? "BESAR" : "KECIL"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}