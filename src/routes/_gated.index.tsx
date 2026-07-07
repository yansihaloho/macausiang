import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIME_SLOTS } from "@/lib/lottery.functions";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import {
  buildLog,
  buildPrediction,
  digitFrequency,
} from "@/lib/lottery-analysis";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  Flame,
  Database,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_gated/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  const rows = feed.rows;
  const log = buildLog(rows);
  const wins = log.filter((r) => r.status === "WIN").length;
  const losses = log.filter((r) => r.status === "LOSS").length;
  const pending = log.filter((r) => r.status === "PENDING").length;
  const wlRatio = losses ? (wins / losses).toFixed(2) : "∞";

  const freq = digitFrequency(rows);
  const totalDraws = rows.reduce(
    (a, r) => a + TIME_SLOTS.filter((s) => r.results[s] !== "-").length,
    0,
  );
  const hottest = [...freq].sort((a, b) => b.count - a.count).slice(0, 3);
  const coldest = [...freq].sort((a, b) => a.count - b.count).slice(0, 3);
  const today = rows[0];
  const pred = buildPrediction(rows);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Database className="h-4 w-4" />}
          label="Total Draw"
          value={String(totalDraws)}
          delta={`${rows.length} hari · nomorupdate.org`}
        />
        <Stat
          icon={<Trophy className="h-4 w-4" />}
          label="Backtest Win/Loss"
          value={`${wins} / ${losses}`}
          delta={`Ratio ${wlRatio}`}
          up={wins >= losses}
        />
        <Stat
          icon={<Target className="h-4 w-4" />}
          label="Prediksi Pending"
          value={String(pending)}
          delta="Menunggu draw"
        />
        <Stat
          icon={<Flame className="h-4 w-4" />}
          label="Digit Terpanas"
          value={hottest.map((h) => h.digit).join(" · ")}
          delta={`${hottest[0].count}× dalam ${rows.length} hari`}
          up
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm">Heat Map Digit — 10 hari terakhir</CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              {totalDraws} draws
            </Badge>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freq}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="digit" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {freq.map((d) => {
                    const isHot = hottest.some((h) => h.digit === d.digit);
                    const isCold = coldest.some((c) => c.digit === d.digit);
                    return (
                      <Cell
                        key={d.digit}
                        fill={isHot ? "#f97316" : isCold ? "#64748b" : "#3b82f6"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Prediksi Berikutnya · Analisa Real</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PredBlock label="BBFS 5" value={pred.bbfs5} />
            <PredBlock label="BBFS 7" value={pred.bbfs7} />
            <PredBlock label="BBFS 9" value={pred.bbfs9} />
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Top 25 · 2D
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pred.top25.map((n) => (
                  <span
                    key={n}
                    className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-bold text-foreground"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Result Terkini · {today.hari}, {today.tanggal}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {TIME_SLOTS.map((slot) => {
              const v = today.results[slot];
              return (
                <div
                  key={slot}
                  className="rounded-xl border border-border bg-muted/40 p-3 text-center"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {slot} WIB
                  </p>
                  <p className="mt-1 font-mono text-2xl font-black tracking-wider text-foreground">
                    {v}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground">
            Sumber: {feed.source} · terakhir diambil{" "}
            {new Date(feed.fetchedAt).toLocaleString("id-ID")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  delta,
  up,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  up?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="rounded-md bg-primary/10 p-1.5 text-primary">{icon}</span>
          <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
        </div>
        <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{value}</p>
        <p
          className={`mt-1 flex items-center gap-1 text-xs font-semibold ${
            up === undefined
              ? "text-muted-foreground"
              : up
                ? "text-emerald-400"
                : "text-destructive"
          }`}
        >
          {up === true && <TrendingUp className="h-3 w-3" />}
          {up === false && <TrendingDown className="h-3 w-3" />}
          {delta}
        </p>
      </CardContent>
    </Card>
  );
}

function PredBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="flex gap-1.5">
        {value.split("").map((d, i) => (
          <span
            key={i}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/20 font-mono text-lg font-black text-primary"
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}