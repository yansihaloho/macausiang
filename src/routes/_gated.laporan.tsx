import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildLog } from "@/lib/mock-data";
import { Download, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_gated/laporan")({
  component: LaporanPage,
});

function LaporanPage() {
  const rows = buildLog();

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
    a.download = "laporan-prediksi.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV berhasil di-export");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">Riwayat Prediksi</CardTitle>
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
                <th className="px-3 py-2 text-left">BBFS 7</th>
                <th className="px-3 py-2 text-left">Hasil</th>
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