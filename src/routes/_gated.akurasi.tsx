import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lotteryQueryOptions } from "@/lib/lottery-query";
import { buildAccuracy } from "@/lib/lottery-analysis";
import { Activity } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_gated/akurasi")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lotteryQueryOptions),
  component: AkurasiPage,
});

function AkurasiPage() {
  const { data: feed } = useSuspenseQuery(lotteryQueryOptions);
  const data = buildAccuracy(feed.rows);
  const totalSamples = data.reduce((a, r) => a + r.samples, 0);
  const avg = (key: "bbfs5" | "bbfs7" | "bbfs9" | "top25") =>
    Math.round(data.reduce((a, r) => a + r[key], 0) / data.length);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground">
          Backtest: prediksi untuk tiap draw historis dihitung dari data sebelum draw itu,
          lalu dibandingkan dengan hasil sesungguhnya. Total sampel: <strong>{totalSamples}</strong> draw
          nyata dari <strong>{feed.source}</strong>.
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { k: "bbfs5", label: "BBFS 5" },
          { k: "bbfs7", label: "BBFS 7" },
          { k: "bbfs9", label: "BBFS 9" },
          { k: "top25", label: "Top-25 2D" },
        ].map((m) => (
          <Card key={m.k}>
            <CardContent className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Avg {m.label}
              </p>
              <p className="mt-2 text-3xl font-black text-foreground">
                {avg(m.k as "bbfs5")}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-primary" /> Akurasi per Slot
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="slot" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="bbfs5" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bbfs7" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bbfs9" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="top25" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}