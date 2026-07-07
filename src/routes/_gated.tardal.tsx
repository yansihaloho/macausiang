import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildTardal } from "@/lib/mock-data";
import { Layers } from "lucide-react";

export const Route = createFileRoute("/_gated/tardal")({
  component: TardalPage,
});

const POS = ["AS", "KOP", "KEPALA", "EKOR"] as const;

function TardalPage() {
  const t = buildTardal();
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
            20-engine analysis untuk masing-masing posisi digit (AS / KOP / KEPALA / EKOR).
            Skor menunjukkan tingkat kepercayaan digit muncul di posisi tersebut pada draw berikutnya.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {POS.map((pos) => {
          const list = t[pos];
          const top = list[0];
          return (
            <Card key={pos}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">Posisi {pos}</CardTitle>
                <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-black text-primary">
                  Top: {top.digit} · {top.score}
                </span>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {list.map((d, i) => (
                    <div
                      key={d.digit}
                      className={`rounded-lg border p-2 text-center ${
                        i < 3
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-muted/30"
                      }`}
                    >
                      <p className="font-mono text-xl font-black text-foreground">
                        {d.digit}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {d.score}
                      </p>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${d.score}%` }}
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