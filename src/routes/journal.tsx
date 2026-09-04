import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, Download, RotateCcw } from "lucide-react";
import { DeskShell } from "@/components/desk/shell";
import { StatusChip } from "@/components/desk/status-chip";
import { Kpi, PositionsTable, SideBadge } from "@/components/desk/tables";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import {
  analyzeJournal,
  filterJournal,
  journalOptions,
  tradesToCsv,
  type JournalTrade,
} from "@/lib/engine/journal";
import { indicatorLabel } from "@/lib/engine/types";
import { getJournal, resetDeskJournal, saveDeskTradeNote, seedDeskJournal } from "@/lib/server/functions";
import { useLiveDesk } from "@/lib/use-live-desk";
import { useLocale } from "@/lib/locale";
import {
  cn,
  fmtBarOpen,
  fmtDuration,
  fmtPct,
  fmtPx,
  fmtR,
  fmtUsd,
  fmtWhen,
} from "@/lib/utils";

export const Route = createFileRoute("/journal")({
  loader: () => getJournal(),
  component: Page,
});

const HIST_LABEL: Record<string, { fa: string; en: string }> = {
  "lt-2": { fa: "< −2R", en: "< −2R" },
  "-2--1": { fa: "−2 تا −1", en: "−2 to −1" },
  "-1-0": { fa: "−1 تا 0", en: "−1 to 0" },
  "0-1": { fa: "0 تا 1", en: "0 to 1" },
  "1-2": { fa: "1 تا 2", en: "1 to 2" },
  gt2: { fa: "> 2R", en: "> 2R" },
};

function reasonLabel(reason: string, fa: boolean) {
  if (reason === "sl") return fa ? "استاپ" : "Stop";
  if (reason === "tp") return fa ? "تارگت" : "Target";
  if (reason === "be") return fa ? "ورود (BE)" : "Break-even";
  if (reason === "venue") return fa ? "صرافی" : "Venue";
  return reason || "—";
}

function num(v: unknown, d = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : d;
}

function Page() {
  const data = Route.useLoaderData();
  const { t, locale } = useLocale();
  const fa = locale === "fa";
  const router = useRouter();
  useLiveDesk(20000);

  const [symbol, setSymbol] = useState("");
  const [indicator, setIndicator] = useState("all");
  const [timeframe, setTimeframe] = useState("all");
  const [side, setSide] = useState("all");
  const [reason, setReason] = useState("all");
  const [mode, setMode] = useState("all");
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<null | "closed" | "paper">(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const closed = data.closed as JournalTrade[];
  const open = data.open as JournalTrade[];
  const opts = useMemo(() => journalOptions(closed), [closed]);
  const filtered = useMemo(
    () => filterJournal(closed, { symbol, indicator, timeframe, side, reason, mode }),
    [closed, symbol, indicator, timeframe, side, reason, mode],
  );
  const stats = useMemo(
    () => analyzeJournal(filtered, num(data.settings.startingEquityUsd, 10000)),
    [filtered, data.settings.startingEquityUsd],
  );
  const picked =
    closed.find((r) => r.id === pickedId) ?? open.find((r) => r.id === pickedId) ?? filtered[0] ?? open[0] ?? null;

  const curve = stats.curve.map((p) => ({
    t: new Date(p.t).toLocaleDateString(fa ? "fa-IR" : "en-GB", { month: "short", day: "numeric" }),
    equity: p.usd,
    r: p.r,
  }));
  const histMax = Math.max(1, ...stats.hist.map((h) => h.n));
  const unlocked = data.lock.unlocked;
  const hasPin = data.lock.hasPin;
  const pnl = stats.netUsd;
  const empty = !closed.length && !open.length;

  async function reset(scope: "closed" | "paper") {
    setBusy(true);
    setMsg(null);
    try {
      await resetDeskJournal({ data: { scope } });
      setConfirm(null);
      setPickedId(null);
      setMsg(t.resetDone);
      await router.invalidate({ sync: true });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "reset failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadSample() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await seedDeskJournal();
      setMsg(res.skipped ? t.sampleSkip : t.sampleLoaded);
      await router.invalidate({ sync: true });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "seed failed");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const blob = new Blob([tradesToCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apex-journal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-3xl tracking-tight">{t.journal}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">{t.journalHint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {empty ? (
              <Button variant="outline" onClick={loadSample} disabled={busy}>
                <BookOpen className="size-4" strokeWidth={1.75} />
                {t.loadSample}
              </Button>
            ) : null}
            <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
              <Download className="size-4" strokeWidth={1.75} />
              {t.exportCsv}
            </Button>
            <Button variant="danger" onClick={() => setConfirm(confirm ? null : "closed")} disabled={busy}>
              <RotateCcw className="size-4" strokeWidth={1.75} />
              {t.resetJournal}
            </Button>
          </div>
        </div>

        {confirm ? (
          <div className="rounded-lg border border-short/40 bg-short-dim/25 p-4">
            {hasPin && !unlocked ? (
              <p className="text-sm text-fg">
                {t.lockedReset}{" "}
                <Link to="/venues" className="text-long underline-offset-2 hover:underline">
                  {t.venues}
                </Link>
              </p>
            ) : (
              <div className="grid gap-3">
                <p className="text-sm text-fg">{t.confirmReset}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirm("closed")}
                    className={cn(
                      "rounded-sm border p-3 text-start text-sm",
                      confirm === "closed" ? "border-short bg-surface" : "border-border bg-bg-elev",
                    )}
                  >
                    <div className="font-medium">{t.resetClosed}</div>
                    <p className="mt-1 text-xs text-muted">{t.resetClosedHint}</p>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirm("paper")}
                    className={cn(
                      "rounded-sm border p-3 text-start text-sm",
                      confirm === "paper" ? "border-short bg-surface" : "border-border bg-bg-elev",
                    )}
                  >
                    <div className="font-medium">{t.resetPaper}</div>
                    <p className="mt-1 text-xs text-muted">{t.resetPaperHint}</p>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="danger" disabled={busy} onClick={() => reset(confirm)}>
                    {busy ? "…" : confirm === "paper" ? t.confirmPaperBtn : t.confirmClosedBtn}
                  </Button>
                  <Button variant="ghost" disabled={busy} onClick={() => setConfirm(null)}>
                    {t.cancel}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
        {msg ? <p className="text-sm text-muted">{msg}</p> : null}

        {empty ? (
          <section className="rounded-lg border border-border bg-surface p-8 shadow-panel">
            <h2 className="font-display text-2xl tracking-tight">{t.emptyJournal}</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">{t.emptyJournalHint}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={loadSample} disabled={busy}>
                {t.loadSample}
              </Button>
              <Button variant="outline" onClick={() => router.navigate({ to: "/" })}>
                {t.desk}
              </Button>
            </div>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label={t.trades} value={String(stats.n)} hint={`${stats.wins} ${t.wins} · ${stats.losses} ${t.losses}`} />
              <Kpi label={t.winRate} value={fmtPct(stats.wr)} tone={stats.wr >= 50 ? "long" : "fg"} />
              <Kpi label={t.netR} value={fmtR(stats.netR)} tone={stats.netR >= 0 ? "long" : "short"} />
              <Kpi label={t.pnl} value={fmtUsd(pnl)} tone={pnl >= 0 ? "long" : "short"} />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm shadow-panel sm:grid-cols-3 lg:grid-cols-5">
              {[
                [t.pf, stats.profitFactor ? stats.profitFactor.toFixed(2) : "—", false],
                [t.expect, fmtR(stats.expectR), stats.expectR < 0],
                [t.streak, stats.streak ? `${stats.streak > 0 ? "+" : ""}${stats.streak}` : "0", stats.streak < 0],
                [t.dd, fmtR(stats.maxDdR), stats.maxDdR < 0],
                [t.avgWin, fmtR(stats.avgWinR), false],
                [t.avgLoss, fmtR(stats.avgLossR), true],
                [t.mae, stats.avgMae ? stats.avgMae.toFixed(2) : "—", true],
                [t.mfe, stats.avgMfe ? stats.avgMfe.toFixed(2) : "—", false],
                [t.hold, fmtDuration(stats.avgHoldMs, locale), false],
                [t.fees, fmtUsd(stats.avgFees), false],
              ].map(([k, v, bad]) => (
                <div key={String(k)} className="min-w-0">
                  <div className="text-xs text-subtle">{k}</div>
                  <div className={cn("font-mono tabular", bad ? "text-short" : "text-fg")}>{v}</div>
                </div>
              ))}
            </div>

            <div className="grid min-w-0 gap-4 xl:grid-cols-5">
              <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-panel xl:col-span-3">
                <h2 className="mb-3 text-sm font-medium">{t.blotter}</h2>
                <BlotterTable
                  rows={filtered}
                  empty={t.noClosed}
                  pickedId={picked?.id ?? null}
                  onPick={setPickedId}
                  fa={fa}
                  locale={locale}
                  t={t}
                />
              </section>
              <aside className="min-w-0 rounded-lg border border-border bg-surface p-4 shadow-panel xl:col-span-2 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-7rem)] xl:self-start xl:overflow-y-auto">
                <h2 className="mb-3 text-sm font-medium">{t.tradeDetail}</h2>
                {picked ? (
                  <TradeDetail
                    row={picked}
                    fa={fa}
                    t={t}
                    locale={locale}
                    canEdit={!hasPin || unlocked}
                    onSaved={async () => {
                      await router.invalidate({ sync: true });
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted">{t.pickTrade}</p>
                )}
              </aside>
            </div>

            <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-sm font-medium">{t.filters}</h2>
                <span className="text-xs text-subtle">
                  {t.showing} {filtered.length} {t.ofTrades}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="grid gap-1.5">
                  <Label htmlFor="j-sym">{t.symbol}</Label>
                  <Input
                    id="j-sym"
                    value={symbol}
                    placeholder="BTC"
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>{t.byIndicator}</Label>
                  <Select value={indicator} onChange={(e) => setIndicator(e.target.value)}>
                    <option value="all">{t.all}</option>
                    {opts.indicators.map((k) => (
                      <option key={k} value={k}>
                        {indicatorLabel(k)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t.byTf}</Label>
                  <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                    <option value="all">{t.all}</option>
                    {opts.timeframes.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t.bySide}</Label>
                  <Select value={side} onChange={(e) => setSide(e.target.value)}>
                    <option value="all">{t.all}</option>
                    <option value="long">{t.long}</option>
                    <option value="short">{t.short}</option>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t.reason}</Label>
                  <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                    <option value="all">{t.all}</option>
                    {opts.reasons.map((k) => (
                      <option key={k} value={k}>
                        {reasonLabel(k, fa)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t.mode}</Label>
                  <Select value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="all">{t.all}</option>
                    {opts.modes.map((k) => (
                      <option key={k} value={k}>
                        {k === "live" ? t.live : t.paper}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </section>

            <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-panel">
              <h2 className="mb-3 text-sm font-medium">{t.openNow}</h2>
              <PositionsTable rows={open} empty={t.noPositions} onPick={setPickedId} pickedId={picked?.id} />
            </section>

            <div className="grid min-w-0 gap-4 lg:grid-cols-5">
              <section className="rounded-lg border border-border bg-surface p-4 shadow-panel lg:col-span-3">
                <h2 className="mb-3 text-sm font-medium">{t.curve}</h2>
                <div className="h-44">
                  {curve.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={curve}>
                        <defs>
                          <linearGradient id="j-eq" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-long)" stopOpacity={0.32} />
                            <stop offset="100%" stopColor="var(--color-long)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="t" hide />
                        <YAxis hide domain={["auto", "auto"]} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: 8,
                            color: "var(--color-fg)",
                            fontSize: 12,
                          }}
                        />
                        <Area type="monotone" dataKey="equity" stroke="var(--color-long)" fill="url(#j-eq)" strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-muted">{t.noClosed}</div>
                  )}
                </div>
              </section>
              <section className="rounded-lg border border-border bg-surface p-4 shadow-panel lg:col-span-2">
                <h2 className="mb-3 text-sm font-medium">{t.rDist}</h2>
                <div className="grid gap-2">
                  {stats.hist.map((h) => (
                    <div key={h.key} className="grid grid-cols-[4.5rem_minmax(0,1fr)_1.5rem] items-center gap-2 text-xs">
                      <span className="font-mono text-subtle">{HIST_LABEL[h.key]?.[locale] ?? h.key}</span>
                      <div className="h-2 min-w-0 overflow-hidden rounded-full bg-bg-elev">
                        <div
                          className={`h-full rounded-full ${h.lo < 0 ? "bg-short" : "bg-long"}`}
                          style={{ width: `${(100 * h.n) / histMax}%` }}
                        />
                      </div>
                      <span className="font-mono tabular text-muted">{h.n}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: t.byIndicator, rows: stats.byIndicator, label: (k: string) => indicatorLabel(k) },
                { title: t.byTf, rows: stats.byTf, label: (k: string) => k },
                { title: t.bySide, rows: stats.bySide, label: (k: string) => (k === "long" ? t.long : k === "short" ? t.short : k) },
                { title: t.byExit, rows: stats.byReason, label: (k: string) => reasonLabel(k, fa) },
              ].map((block) => (
                <section key={block.title} className="rounded-lg border border-border bg-surface p-4 shadow-panel">
                  <h2 className="mb-3 text-sm font-medium">{block.title}</h2>
                  {!block.rows.length ? (
                    <p className="text-sm text-muted">—</p>
                  ) : (
                    <ul className="grid gap-2">
                      {block.rows.map((b) => (
                        <li key={b.key} className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="text-muted">{block.label(b.key)}</span>
                          <span className="font-mono tabular text-xs text-subtle">
                            {b.n} · {fmtPct(b.wr, 0)} ·{" "}
                            <span className={b.r >= 0 ? "text-long" : "text-short"}>{fmtR(b.r)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </DeskShell>
  );
}

function BlotterTable({
  rows,
  empty,
  pickedId,
  onPick,
  fa,
  locale,
  t,
}: {
  rows: JournalTrade[];
  empty: string;
  pickedId: number | null;
  onPick: (id: number) => void;
  fa: boolean;
  locale: "fa" | "en";
  t: ReturnType<typeof useLocale>["t"];
}) {
  if (!rows.length) return <p className="px-1 py-8 text-sm text-muted">{empty}</p>;
  return (
    <>
      <div className="grid gap-2 md:hidden">
        {rows.map((r) => {
          const usd = num(r.pnl_usd);
          const win = usd > 0;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onPick(r.id)}
              className={cn(
                "min-h-11 rounded-sm border p-3 text-start",
                pickedId === r.id ? "border-accent bg-surface-2" : "border-border bg-bg-elev",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {r.symbol.replace("USDT", "")} · {indicatorLabel(r.indicator)}
                </span>
                <span className={cn("font-mono tabular text-sm", win ? "text-long" : "text-short")}>{fmtR(num(r.pnl_r))}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <SideBadge side={r.side} />
                <span>{r.timeframe}</span>
                <span>{reasonLabel(r.exit_reason ?? "", fa)}</span>
                <span className="font-mono">{fmtUsd(usd)}</span>
                {r.mae_r != null ? <span className="font-mono text-short">MAE {num(r.mae_r).toFixed(2)}</span> : null}
                {r.mfe_r != null ? <span className="font-mono text-long">MFE {num(r.mfe_r).toFixed(2)}</span> : null}
              </div>
            </button>
          );
        })}
      </div>
      <div className="hidden min-w-0 overflow-x-auto md:block">
        <table className="w-full text-start text-sm">
          <thead className="text-xs text-subtle">
            <tr className="border-b border-border">
              <th className="px-3 py-2 font-medium">{t.symbol}</th>
              <th className="px-3 py-2 font-medium">{t.thInd}</th>
              <th className="px-3 py-2 font-medium">{t.thSide}</th>
              <th className="px-3 py-2 font-medium">R</th>
              <th className="px-3 py-2 font-medium">$</th>
              <th className="px-3 py-2 font-medium">{t.thOut}</th>
              <th className="px-3 py-2 font-medium">{t.hold}</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular">
            {rows.map((r) => {
              const usd = num(r.pnl_usd);
              const win = usd > 0 || (usd === 0 && num(r.pnl_r) >= 0);
              return (
                <tr
                  key={r.id}
                  onClick={() => onPick(r.id)}
                  className={cn(
                    "cursor-pointer border-b border-border/60 transition-colors hover:bg-surface-2",
                    pickedId === r.id ? "bg-surface-2" : "",
                  )}
                >
                  <td className="px-3 py-2.5">
                    <div className="text-fg">{r.symbol.replace("USDT", "")}</div>
                    <div className="text-xs text-subtle">
                      {r.timeframe} · {r.mode}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{indicatorLabel(r.indicator)}</td>
                  <td className="px-3 py-2.5">
                    <SideBadge side={r.side} />
                  </td>
                  <td className={win ? "px-3 py-2.5 text-long" : "px-3 py-2.5 text-short"}>{fmtR(num(r.pnl_r))}</td>
                  <td className={win ? "px-3 py-2.5 text-long" : "px-3 py-2.5 text-short"}>{fmtUsd(usd)}</td>
                  <td className="px-3 py-2.5 text-muted">{reasonLabel(r.exit_reason ?? "", fa)}</td>
                  <td className="px-3 py-2.5 text-subtle">
                    {r.hold_ms != null ? fmtDuration(num(r.hold_ms), locale) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RiskPath({ row, t }: { row: JournalTrade; t: ReturnType<typeof useLocale>["t"] }) {
  const entry = num(row.entry);
  const orig = num(row.orig_sl ?? row.sl);
  const dist = Math.abs(entry - orig);
  if (!(dist > 0)) return null;
  const sign = row.side === "long" ? 1 : -1;
  const rAt = (px: number) => (sign * (px - entry)) / dist;
  const planned = Math.max(0.5, num(row.rr_planned, 1));
  const mae = row.mae_r != null ? num(row.mae_r) : 0;
  const mfe = row.mfe_r != null ? num(row.mfe_r) : 0;
  const exitR = row.exit_px != null ? rAt(num(row.exit_px)) : null;
  const minR = Math.min(-1.2, -mae - 0.12);
  const maxR = Math.max(planned + 0.2, mfe + 0.12, exitR ?? 0);
  const x = (r: number) => `${((r - minR) / (maxR - minR)) * 100}%`;
  const realized = row.status === "closed" ? num(row.pnl_r) : null;
  const capture = mfe > 0.05 && realized != null ? Math.max(0, Math.min(1.5, realized / mfe)) : null;
  const give = mfe > 0 && realized != null ? mfe - realized : null;
  return (
    <div className="grid gap-2" dir="ltr">
      <div className="flex items-center justify-between text-xs text-subtle">
        <span>{t.path}</span>
        {capture != null ? (
          <span className="font-mono tabular">
            {t.capture} {(100 * capture).toFixed(0)}%
            {give != null && give > 0.05 ? ` · ${t.giveback} ${fmtR(give)}` : ""}
          </span>
        ) : null}
      </div>
      <div className="relative h-10 rounded-sm bg-bg-elev">
        <div
          className="absolute inset-y-3 rounded-full bg-short-dim"
          style={{ left: x(Math.min(0, -mae)), right: `calc(100% - ${x(0)})` }}
        />
        <div
          className="absolute inset-y-3 rounded-full bg-long-dim"
          style={{ left: x(0), right: `calc(100% - ${x(Math.max(0, mfe || planned))})` }}
        />
        <span className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-short" style={{ left: x(-1) }} title="SL" />
        <span className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-fg" style={{ left: x(0) }} title="Entry" />
        <span className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-long" style={{ left: x(planned) }} title="TP" />
        {exitR != null ? (
          <span
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-fg bg-accent"
            style={{ left: x(exitR) }}
            title="Exit"
          />
        ) : null}
      </div>
      <div className="flex justify-between font-mono text-xs text-subtle">
        <span>SL {fmtPx(orig)}</span>
        <span>E {fmtPx(entry)}</span>
        <span>TP {fmtPx(num(row.tp))}</span>
      </div>
    </div>
  );
}

function TradeDetail({
  row,
  fa,
  t,
  locale,
  canEdit,
  onSaved,
}: {
  row: JournalTrade;
  fa: boolean;
  t: ReturnType<typeof useLocale>["t"];
  locale: "fa" | "en";
  canEdit: boolean;
  onSaved: () => Promise<void>;
}) {
  const usd = num(row.pnl_usd);
  const win = row.status !== "closed" ? null : usd > 0;
  const [note, setNote] = useState(row.notes ?? "");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setNote(row.notes ?? "");
  }, [row.id, row.notes]);
  const groups: Array<{ title: string; pairs: Array<[string, string]> }> = [
    {
      title: fa ? "سطوح" : "Levels",
      pairs: [
        ["Entry", fmtPx(num(row.entry))],
        [t.origStop, fmtPx(num(row.orig_sl ?? row.sl))],
        ["SL", fmtPx(num(row.sl))],
        ["TP", fmtPx(num(row.tp))],
        [t.exitPx, row.exit_px != null ? fmtPx(num(row.exit_px)) : "—"],
        [t.plannedRr, row.rr_planned != null ? Number(row.rr_planned).toFixed(2) : "—"],
      ],
    },
    {
      title: fa ? "سایز" : "Size",
      pairs: [
        [t.qty, String(num(row.qty))],
        ["Lev", `${row.leverage}x`],
        [t.notional, fmtUsd(num(row.notional_usd), 0)],
        [t.margin, row.margin_usd != null ? fmtUsd(num(row.margin_usd), 0) : "—"],
        [t.risk, fmtUsd(num(row.risk_usd))],
        [t.fees, fmtUsd(num(row.fees_usd))],
      ],
    },
    {
      title: fa ? "مسیر" : "Path",
      pairs: [
        [t.mae, row.mae_r != null ? num(row.mae_r).toFixed(2) : "—"],
        [t.mfe, row.mfe_r != null ? num(row.mfe_r).toFixed(2) : "—"],
        [t.barsHeld, row.bars_held != null ? String(row.bars_held) : "—"],
        [t.hold, row.hold_ms != null ? fmtDuration(num(row.hold_ms), locale) : "—"],
        [t.beMoved, num(row.be_moved) ? t.yes : t.no],
        [t.atr, row.atr_at_entry != null ? fmtPx(num(row.atr_at_entry)) : "—"],
      ],
    },
    {
      title: fa ? "زمان" : "Time",
      pairs: [
        [t.mode, row.mode === "live" ? t.live : t.paper],
        [t.venue, row.venue],
        [t.equityAtOpen, row.equity_at_open != null ? fmtUsd(num(row.equity_at_open), 0) : "—"],
        [t.candle, fmtBarOpen(row.bar_time)],
        [t.openedAt, fmtWhen(row.opened_at, locale)],
        [t.closedAt, fmtWhen(row.closed_at, locale)],
        [t.orderId, row.exchange_order_id || "—"],
      ],
    },
  ];

  async function saveNote() {
    setSaving(true);
    try {
      await saveDeskTradeNote({ data: { id: row.id, notes: note } });
      await onSaved();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-xl tracking-tight">{row.symbol.replace("USDT", "")}</span>
        <span className="text-sm text-muted">{row.timeframe}</span>
        <Badge tone="muted">{indicatorLabel(row.indicator)}</Badge>
        <SideBadge side={row.side} />
        {row.status === "closed" ? (
          <Badge tone={win ? "long" : "short"}>{win ? t.wins : t.losses}</Badge>
        ) : (
          <Badge tone="warn">{t.open}</Badge>
        )}
        <Badge tone="muted">{reasonLabel(row.exit_reason ?? "", fa)}</Badge>
      </div>
      <div className="flex flex-wrap gap-4 font-mono tabular">
        <div>
          <div className="text-xs text-subtle">R</div>
          <div className={win === false ? "text-short" : "text-long"}>
            {row.status === "closed" ? fmtR(num(row.pnl_r)) : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-subtle">PnL</div>
          <div className={win === false ? "text-short" : "text-long"}>
            {row.status === "closed" ? fmtUsd(usd) : "—"}
          </div>
        </div>
      </div>
      <RiskPath row={row} t={t} />
      {row.signal_reason ? (
        <p className="rounded-sm bg-bg-elev px-3 py-2 text-xs leading-relaxed text-muted" dir="ltr">
          {row.signal_reason}
        </p>
      ) : null}
      {groups.map((g) => (
        <div key={g.title}>
          <div className="mb-2 text-xs font-medium text-subtle">{g.title}</div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            {g.pairs.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-subtle">{k}</dt>
                <dd className="truncate font-mono tabular text-fg" title={v}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      <div className="grid gap-1.5">
        <Label htmlFor={`note-${row.id}`}>{t.note}</Label>
        <Textarea
          id={`note-${row.id}`}
          value={note}
          disabled={!canEdit}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-20"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-subtle">{t.noteHint}</span>
          <Button variant="outline" disabled={!canEdit || saving || note === (row.notes ?? "")} onClick={saveNote}>
            {saving ? "…" : t.saveNote}
          </Button>
        </div>
      </div>
    </div>
  );
}
