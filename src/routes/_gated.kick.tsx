import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tv, Radio } from "lucide-react";

export const Route = createFileRoute("/_gated/kick")({
  component: KickPage,
});

const CHANNEL = "ttm4d";

function KickPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Tv className="h-4 w-4 text-primary" /> KickLive · Channel{" "}
            <span className="font-mono">{CHANNEL}</span>
          </CardTitle>
          <Badge className="gap-1 bg-emerald-500/20 text-emerald-400">
            <Radio className="h-3 w-3 animate-pulse" /> Streaming
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="aspect-video overflow-hidden rounded-xl border border-border bg-black">
            <iframe
              title="Kick live stream"
              src={`https://player.kick.com/${CHANNEL}?autoplay=false&muted=true`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Live stream diambil langsung dari Kick.com. Jika stream offline, player akan
            menampilkan pesan dari Kick.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}