import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator as CalcIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_gated/kalkulator")({
  component: KalkulatorPage,
});

type Row = { put: number; taruh: number; total: number; potensi: number; bep: number };

function build(base: number, mult: number, steps: number, hadiahPerLine: number, lines: number): Row[] {
  const rows: Row[] = [];
  let total = 0;
  let taruh = base;
  for (let i = 1; i <= steps; i++) {
    total += taruh;
    const potensi = hadiahPerLine * lines;
    const bep = Math.max(0, potensi - total);
    rows.push({ put: i, taruh, total, potensi, bep });
    taruh = Math.ceil(taruh * mult);
  }
  return rows;
}

const rupiah = (n: number) =>
  "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

function KalkulatorPage() {
  const [base, setBase] = useState(1000);
  const [mult, setMult] = useState(2);
  const [steps, setSteps] = useState(8);
  const [hadiah, setHadiah] = useState(70000);
  const [lines, setLines] = useState(1);

  const rows = useMemo(
    () => build(base, mult, steps, hadiah, lines),
    [base, mult, steps, hadiah, lines],
  );
  const grand = rows[rows.length - 1]?.total ?? 0;

  function reset() {
    setBase(1000);
    setMult(2);
    setSteps(8);
    setHadiah(70000);
    setLines(1);
    toast.success("Kalkulator direset ke default");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CalcIcon className="h-4 w-4 text-primary" /> Konfigurasi Martingale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <Field label="Taruhan Awal">
              <Input
                type="number"
                value={base}
                onChange={(e) => setBase(Math.max(1, +e.target.value))}
              />
            </Field>
            <Field label="Kelipatan (Mult)">
              <Input
                type="number"
                step="0.1"
                value={mult}
                onChange={(e) => setMult(Math.max(1, +e.target.value))}
              />
            </Field>
            <Field label="Jumlah Put">
              <Input
                type="number"
                value={steps}
                onChange={(e) => setSteps(Math.min(20, Math.max(1, +e.target.value)))}
              />
            </Field>
            <Field label="Hadiah / Line">
              <Input
                type="number"
                value={hadiah}
                onChange={(e) => setHadiah(Math.max(0, +e.target.value))}
              />
            </Field>
            <Field label="Jumlah Line">
              <Input
                type="number"
                value={lines}
                onChange={(e) => setLines(Math.max(1, +e.target.value))}
              />
            </Field>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
            </Button>
            <span className="text-xs text-muted-foreground">
              Total modal {steps} put:{" "}
              <span className="font-bold text-foreground">{rupiah(grand)}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tabel Sesi</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Put</th>
                <th className="px-3 py-2 text-right">Taruh</th>
                <th className="px-3 py-2 text-right">Total Modal</th>
                <th className="px-3 py-2 text-right">Potensi Menang</th>
                <th className="px-3 py-2 text-right">Sisa BEP</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const profit = r.potensi > r.total;
                return (
                  <tr key={r.put} className="border-b border-border/40">
                    <td className="px-3 py-2 font-bold text-foreground">#{r.put}</td>
                    <td className="px-3 py-2 text-right font-mono">{rupiah(r.taruh)}</td>
                    <td className="px-3 py-2 text-right font-mono">{rupiah(r.total)}</td>
                    <td className="px-3 py-2 text-right font-mono">{rupiah(r.potensi)}</td>
                    <td className="px-3 py-2 text-right font-mono">{rupiah(r.bep)}</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                          profit
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {profit ? "Profit" : "Rugi"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}