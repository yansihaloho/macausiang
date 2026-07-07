import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AI_THOUGHTS, engineConfidences } from "@/lib/mock-data";
import { Brain, Cpu, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_gated/otak-ai")({
  component: OtakAiPage,
});

function OtakAiPage() {
  const [engines, setEngines] = useState(engineConfidences(3));
  const [thoughts, setThoughts] = useState(AI_THOUGHTS);
  const [learning, setLearning] = useState(false);

  function triggerLearn() {
    setLearning(true);
    toast.info("Manual learning triggered…");
    setTimeout(() => {
      setEngines(engineConfidences(Math.floor(Math.random() * 1000)));
      setThoughts([
        {
          time: new Date().toLocaleTimeString("id-ID", { hour12: false }),
          msg: "Manual learn: bobot engine di-rebalance berdasarkan 200 draw terakhir.",
        },
        ...thoughts,
      ]);
      setLearning(false);
      toast.success("Otak AI selesai belajar.");
    }, 1400);
  }

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
            <Row k="Total draw trained" v="3,148" />
            <Row k="Last learn" v="2 menit lalu" />
            <Row k="Model version" v="v6.2.1-ensemble" />
            <Row k="Auto-learn" v={<Badge className="bg-emerald-500/20 text-emerald-400">ON</Badge>} />
            <Row k="Cadence" v="setiap 15 menit" />
            <Button
              onClick={triggerLearn}
              disabled={learning}
              className="mt-3 w-full gap-2"
            >
              <Zap className="h-4 w-4" />
              {learning ? "Belajar…" : "Trigger Manual Learn"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cpu className="h-4 w-4 text-primary" /> Bobot Engine (live)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {engines.map((e) => (
                <div
                  key={e.name}
                  className="rounded-lg border border-border bg-muted/40 p-2"
                >
                  <p className="truncate text-[11px] font-bold text-foreground">{e.name}</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-mono text-lg font-black text-primary">
                      {e.confidence}
                    </span>
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
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
          <ul className="space-y-3">
            {thoughts.map((t, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3"
              >
                <span className="font-mono text-[11px] font-bold text-muted-foreground">
                  {t.time}
                </span>
                <span className="text-xs text-foreground">{t.msg}</span>
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