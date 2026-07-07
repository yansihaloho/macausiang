import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import { buildLog } from "@/lib/lottery-analysis";
import { Download, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_gated/laporan")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: LaporanPage,
});

function LaporanPage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  const rows = buildLog(feed.rows, 30);
  const wins = rows.filter((r) => r.status === "WIN").length;
  const losses = rows.filter((r) => r.status === "LOSS").length;
  const pending = rows.filter((r) => r.status === "PENDING").length;
  const evaluated = wins + losses;
  const hitRate = evaluated ? Math.round((wins / evaluated) * 100) : 0;

  function exportCsv() {
    const header = ["id", "tanggal", "slot", "bbfs7", "hasil", "status"];
    const csv = [
      header.join(","),
      ...rows.map((r) => [r.id, r.tanggal, r.slot, r.bbfs7, r.hasil, r.status].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-prediksi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV berhasil di-export");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatBox label="WIN" value={String(wins)} tone="win" />
        <StatBox label="LOSS" value={String(losses)} tone="loss" />
        <StatBox label="PENDING" value={String(pending)} tone="pending" />
        <StatBox label="Hit Rate" value={`${hitRate}%`} tone="win" />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">
            Riwayat Prediksi — {rows.length} entri (sumber {feed.source})
          </CardTitle>
          <Button size="sm" onClick={exportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Tanggal</th>
                <th className="px-3 py-2 text-left">Slot</th>
                <th className="px-3 py-2 text-left">BBFS 7 (prediksi)</th>
                <th className="px-3 py-2 text-left">Hasil Real</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.tanggal}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.slot}</td>
                  <td className="px-3 py-2 font-mono font-bold">{r.bbfs7}</td>
                  <td className="px-3 py-2 font-mono font-bold text-foreground">{r.hasil}</td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        r.status === "WIN"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : r.status === "LOSS"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.status === "WIN" && <CheckCircle2 className="h-3 w-3" />}
                      {r.status === "LOSS" && <XCircle className="h-3 w-3" />}
                      {r.status === "PENDING" && <Clock className="h-3 w-3" />}
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone: "win" | "loss" | "pending" }) {
  const cls =
    tone === "win"
      ? "text-emerald-400"
      : tone === "loss"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className={`mt-2 text-3xl font-black ${cls}`}>{value}</p>
      </CardContent>
    </Card>
  );
}