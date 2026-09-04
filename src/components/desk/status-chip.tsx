import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/locale";
import { CRON_STALE_MS } from "@/lib/engine/scan-schedule";
import { venueLabel } from "@/lib/exchanges/meta";
import { timeAgo } from "@/lib/utils";

export function StatusChip({
  botEnabled,
  mode,
  venue,
  lastTickAt,
  lastTickSource,
  durable,
}: {
  botEnabled: boolean;
  mode: string;
  venue?: string | null;
  lastTickAt: string | null;
  lastTickSource?: string | null;
  durable?: boolean;
}) {
  const { t, locale } = useLocale();
  const stale = !lastTickAt || Date.now() - new Date(lastTickAt).getTime() > CRON_STALE_MS;
  const live24 = botEnabled && !stale;
  const book = venueLabel(venue);
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Badge tone={botEnabled ? "long" : "muted"}>{botEnabled ? t.botOn : t.botOff}</Badge>
      <Badge tone={mode === "live" ? "short" : "fg"}>{mode === "live" ? t.live : t.paper}</Badge>
      <Badge tone="fg">{book}</Badge>
      <Badge tone={live24 ? "long" : "warn"}>{live24 ? "24h" : "idle"}</Badge>
      {durable != null ? (
        <Badge tone={durable ? "long" : "warn"}>{durable ? "Neon" : "preview"}</Badge>
      ) : null}
      <span className="text-xs text-subtle">
        {t.lastTick} {timeAgo(lastTickAt, locale)}
        {lastTickSource ? ` · ${lastTickSource}` : ""}
      </span>
    </div>
  );
}
