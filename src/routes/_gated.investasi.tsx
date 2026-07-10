import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

export const Route = createFileRoute("/_gated/investasi")({
  component: InvestasiPage,
});

type Row = {
  putaran: number;
  taruhan: number;
  modalPutaran: number;
  totalModal: number;
  kemenangan: number;
  profit: number;
};

function InvestasiPage() {
  const [jumlahNomor, setJumlahNomor] = useState(70);
  const [hadiah, setHadiah] = useState(95);
  const [taruhanAwal, setTaruhanAwal] = useState(1000);
  const [putaran, setPutaran] = useState(10);
  const [pembulatan, setPembulatan] = useState(100);

  const rows = useMemo<Row[]>(() => {
    const data: Row[] = [];
    const targetProfit = taruhanAwal * hadiah - taruhanAwal * jumlahNomor;
    if (jumlahNomor >= hadiah || targetProfit <= 0) return data;
    let totalModal = 0;
    for (let i = 1; i <= Math.min(putaran, 50); i++) {
      let t: number;
      if (i === 1) t = taruhanAwal;
      else {
        const exact = (targetProfit + totalModal) / (hadiah - jumlahNomor);
        t = pembulatan > 1 ? Math.ceil(exact / pembulatan) * pembulatan : Math.ceil(exact);
      }
      const modal = t * jumlahNomor;
      totalModal += modal;
      const kem = t * hadiah;
      data.push({ putaran: i, taruhan: t, modalPutaran: modal, totalModal, kemenangan: kem, profit: kem - totalModal });
    }
    return data;
  }, [jumlahNomor, hadiah, taruhanAwal, putaran, pembulatan]);

  const fmt = (n: number) => n.toLocaleString("id-ID");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calculator className="h-4 w-4 text-primary" /> Kalkulator Investasi (Recovery)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Setiap putaran, taruhan per nomor dihitung agar profit akhir = profit target putaran 1, kompensasi modal semua putaran sebelumnya.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-5">
          <Field label="Jumlah Nomor" v={jumlahNomor} onChange={setJumlahNomor} />
          <Field label="Hadiah × per perak" v={hadiah} onChange={setHadiah} />
          <Field label="Taruhan Awal" v={taruhanAwal} onChange={setTaruhanAwal} />
          <Field label="Jumlah Putaran" v={putaran} onChange={setPutaran} />
          <Field label="Pembulatan" v={pembulatan} onChange={setPembulatan} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Simulasi Putaran</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-xs text-rose-400">
              Parameter tidak valid: jumlah nomor ≥ hadiah, atau profit awal ≤ 0.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-xs">
                <thead className="border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 text-left">Putaran</th>
                    <th className="px-2 py-2 text-right">Taruhan/Nomor</th>
                    <th className="px-2 py-2 text-right">Modal Putaran</th>
                    <th className="px-2 py-2 text-right">Total Modal</th>
                    <th className="px-2 py-2 text-right">Kemenangan</th>
                    <th className="px-2 py-2 text-right">Profit Bersih</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.putaran} className="border-b border-border/40">
                      <td className="px-2 py-1.5 font-bold text-foreground">#{r.putaran}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmt(r.taruhan)}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{fmt(r.modalPutaran)}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{fmt(r.totalModal)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmt(r.kemenangan)}</td>
                      <td className={`px-2 py-1.5 text-right font-mono font-black ${r.profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {fmt(r.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, v, onChange }: { label: string; v: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input type="number" value={v} onChange={(e) => onChange(Number(e.target.value) || 0)} className="font-mono" />
    </div>
  );
}