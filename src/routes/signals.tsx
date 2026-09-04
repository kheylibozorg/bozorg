import { createFileRoute } from "@tanstack/react-router";
import { DeskShell } from "@/components/desk/shell";
import { StatusChip } from "@/components/desk/status-chip";
import { SignalsTable } from "@/components/desk/tables";
import { getDesk } from "@/lib/server/functions";
import { useLiveDesk } from "@/lib/use-live-desk";
import { useLocale } from "@/lib/locale";

export const Route = createFileRoute("/signals")({
  loader: () => getDesk(),
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();
  const { t, locale } = useLocale();
  useLiveDesk(20000);
  return (
    <DeskShell
      status={
        <StatusChip
          botEnabled={data.settings.botEnabled}
          mode={data.settings.mode}
          venue={data.settings.venue}
          lastTickAt={data.settings.lastTickAt}
          lastTickSource={data.settings.lastTickSource}
          durable={data.settings.durable}
        />
      }
    >
      <h1 className="font-display text-3xl tracking-tight">{t.signals}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        {locale === "fa"
          ? "یازده اندیکاتور: APEX 1R / 1.5R / 2R و چهار کویل HALCYON دست‌نخورده، TREX 1.0R و 1.2R، KETEX 2.2R، به‌علاوه SHETEX 1.8R. SHETEX = تست دوم → FTC، بدون BE. سیگنال فقط روی کندل بسته."
          : "Eleven indicators: APEX 1R / 1.5R / 2R and four HALCYON coils untouched, TREX 1.0R and 1.2R, KETEX 2.2R, plus SHETEX 1.8R. SHETEX = second-test → FTC, no BE. Signals fire on closed bars only."}
      </p>
      <div className="mt-6 rounded-lg border border-border bg-surface p-4 shadow-panel">
        <SignalsTable rows={data.signals} empty={t.noSignals} />
      </div>
    </DeskShell>
  );
}
