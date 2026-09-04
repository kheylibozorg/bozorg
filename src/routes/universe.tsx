import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { DeskShell } from "@/components/desk/shell";
import { Button } from "@/components/ui/button";
import { bookVenue, chartHostLabel, looksLikeFallbackUniverse, nativeSymbol, venueLabel } from "@/lib/exchanges/meta";
import { getDesk, refreshCoins } from "@/lib/server/functions";
import { useLocale } from "@/lib/locale";
import { fmtUsd } from "@/lib/utils";

export const Route = createFileRoute("/universe")({
  loader: () => getDesk(),
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const venue = bookVenue(data.settings.venue);
  const chart = chartHostLabel(venue);
  const label = venueLabel(venue);
  const fallback = looksLikeFallbackUniverse(data.universe);

  async function refresh() {
    setBusy(true);
    try {
      await refreshCoins();
      await router.invalidate({ sync: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <DeskShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{t.universe}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {(() => {
              const cap = Number(data.settings.minMarketCapUsd) || 0;
              const n = data.universe.length;
              if (locale === "fa") {
                const capBit = cap > 0 ? ` با مارکت‌کپ ≥ ${fmtUsd(cap, 0)}` : " — بدون کف مارکت‌کپ";
                const src = fallback
                  ? " این لیست موقت است؛ به‌روز کردن را بزن تا کتاب زندهٔ همان صرافی بیاید."
                  : "";
                return `${n} پرپچوال لیست‌شده روی «${label}». چارت و سیگنال فقط از ${chart} است، نه صرافی دیگر.${capBit}.${src}`;
              }
              const capBit = cap > 0 ? ` Market-cap floor ≥ ${fmtUsd(cap, 0)}.` : " No market-cap floor.";
              const src = fallback
                ? " This is the emergency 10-coin list — hit refresh to load that exchange's live book."
                : "";
              return `${n} perps listed on ${label}. Signals use ${chart} candles — not another venue's chart.${capBit}${src}`;
            })()}
          </p>
        </div>
        <Button onClick={refresh} disabled={busy} variant="outline">
          {busy ? t.running : t.refresh}
        </Button>
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface shadow-panel">
        <table className="w-full text-sm">
          <thead className="text-xs text-subtle">
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-start font-medium">#</th>
              <th className="px-3 py-2 text-start font-medium">Asset</th>
              <th className="px-3 py-2 text-start font-medium">{t.pair}</th>
              <th className="px-3 py-2 text-start font-medium">{t.chart}</th>
              <th className="px-3 py-2 text-start font-medium">Cap</th>
              <th className="px-3 py-2 text-start font-medium">Vol 24h</th>
              <th className="px-3 py-2 text-start font-medium">Max lev</th>
            </tr>
          </thead>
          <tbody>
            {data.universe.map((a, i) => (
              <tr key={a.symbol} className="border-b border-border/60">
                <td className="px-3 py-2.5 font-mono text-subtle">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <div className="font-medium">{a.base}</div>
                  <div className="text-xs text-subtle">{a.name}</div>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted">
                  {a.venue_symbol || nativeSymbol(venue, a.base)}
                </td>
                <td className="px-3 py-2.5 text-xs text-subtle">{chart}</td>
                <td className="px-3 py-2.5 font-mono tabular">{fmtUsd(Number(a.market_cap_usd), 0)}</td>
                <td className="px-3 py-2.5 font-mono tabular text-muted">{fmtUsd(Number(a.volume_24h_usd), 0)}</td>
                <td className="px-3 py-2.5 font-mono">{a.max_leverage}x</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.universe.length ? (
          <p className="p-6 text-sm text-muted">
            {locale === "fa"
              ? "لیست خالی است. صرافی را وصل کن یا به‌روز کردن را بزن تا کتاب همان صرافی خوانده شود."
              : "List is empty. Connect the venue or hit refresh to load that exchange's book."}
          </p>
        ) : null}
      </div>
    </DeskShell>
  );
}
