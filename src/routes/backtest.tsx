import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { DeskShell } from "@/components/desk/shell";
import { StatusChip } from "@/components/desk/status-chip";
import { Kpi } from "@/components/desk/tables";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/field";
import {
  analyzeBacktest,
  journalToAnalyzed,
  type AnalyzedTrade,
  type Finding,
  type SliceStats,
} from "@/lib/engine/backtest-analyze";
import { filterJournal, journalOptions, type JournalTrade } from "@/lib/engine/journal";
import { indicatorLabel } from "@/lib/engine/types";
import { getJournal, resetDeskJournal, seedDeskJournal } from "@/lib/server/functions";
import { useLiveDesk } from "@/lib/use-live-desk";
import { useLocale } from "@/lib/locale";
import { cn, fmtPct, fmtPx, fmtR, fmtUsd } from "@/lib/utils";

export const Route = createFileRoute("/backtest")({
  loader: () => getJournal(),
  component: Page,
});

type Filter = "all" | "long" | "short" | "sl" | "tp" | "be" | "scratch" | "giveback";

function Page() {
  const data = Route.useLoaderData();
  const { t, locale } = useLocale();
  const fa = locale === "fa";
  const router = useRouter();
  useLiveDesk(20000);

  const [mode, setMode] = useState("all");
  const [indicator, setIndicator] = useState("all");
  const [timeframe, setTimeframe] = useState("all");
  const [side, setSide] = useState("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [confirm, setConfirm] = useState<null | "closed" | "paper">(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const closed = data.closed as JournalTrade[];
  const opts = useMemo(() => journalOptions(closed), [closed]);
  const filtered = useMemo(
    () => filterJournal(closed, { indicator, timeframe, side, mode }),
    [closed, indicator, timeframe, side, mode],
  );
  const analysis = useMemo(() => analyzeBacktest(journalToAnalyzed(filtered)), [filtered]);

  const rows = useMemo(() => {
    const all = analysis.all;
    if (filter === "all") return all;
    if (filter === "long" || filter === "short") return all.filter((x) => x.side === filter);
    if (filter === "sl" || filter === "tp" || filter === "be") return all.filter((x) => x.reason === filter);
    if (filter === "scratch") return all.filter((x) => x.scratch || (x.pnlR >= 0 && x.pnlR < 0.3));
    return all.filter((x) => x.stoppedFromProfit);
  }, [analysis, filter]);

  const unlocked = data.lock.unlocked;
  const hasPin = data.lock.hasPin;
  const empty = !closed.length;

  async function reset(scope: "closed" | "paper") {
    setBusy(true);
    setMsg(null);
    try {
      await resetDeskJournal({ data: { scope } });
      setConfirm(null);
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
            <h1 className="font-display text-3xl tracking-tight">{t.backtest}</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              {fa
                ? "همه معاملات کاغذی و واقعی، دسته‌به‌دسته: اندیکاتور، تایم‌فریم، لانگ/شورت، نحوه ورود. کدام استاپ می‌خورد، کدام سود می‌دهد، کدام تقریباً هیچ."
                : "Every paper and live fill, batched by engine, timeframe, side and entry. Which stops out, which pays, which barely does."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {empty ? (
              <Button variant="outline" onClick={loadSample} disabled={busy}>
                {t.loadSample}
              </Button>
            ) : null}
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
            <h2 className="font-display text-2xl tracking-tight">{fa ? "هنوز معامله‌ای نیست" : "No fills yet"}</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              {fa
                ? "بعد از فیل‌های کاغذی یا واقعی، آنالیز اینجا ساخته می‌شود. برای دیدن شکل صفحه، دفتر نمونه را بار کن."
                : "Paper and live fills land here. Load the sample blotter to see the readout."}
            </p>
          </section>
        ) : (
          <>
            <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-panel sm:grid-cols-2 lg:grid-cols-4">
              <div className="grid gap-1.5">
                <Label>{t.mode}</Label>
                <Select value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="all">{t.all}</option>
                  {opts.modes.map((m) => (
                    <option key={m} value={m}>
                      {m === "live" ? t.live : m === "paper" ? t.paper : m}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>{t.thInd}</Label>
                <Select value={indicator} onChange={(e) => setIndicator(e.target.value)}>
                  <option value="all">{t.all}</option>
                  {opts.indicators.map((k) => (
                    <option key={k} value={k}>
                      {indicatorLabel(k as never) || k}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>TF</Label>
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
                <Label>{t.thSide}</Label>
                <Select value={side} onChange={(e) => setSide(e.target.value)}>
                  <option value="all">{t.all}</option>
                  <option value="long">{t.long}</option>
                  <option value="short">{t.short}</option>
                </Select>
              </div>
            </div>

            <p className="text-sm text-muted">
              {fa
                ? `${analysis.n} از ${closed.length} فیل بسته در این برش.`
                : `${analysis.n} of ${closed.length} closed fills in this cut.`}
            </p>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi label={t.trades} value={String(analysis.n)} hint={`${analysis.n - analysis.noProfitN}W / ${analysis.noProfitN}L`} />
              <Kpi label={t.winRate} value={fmtPct(analysis.wr)} />
              <Kpi label={t.expect} value={fmtR(analysis.expectR)} tone={analysis.expectR >= 0 ? "long" : "short"} />
              <Kpi label={t.netR} value={fmtR(analysis.netR)} tone={analysis.netR >= 0 ? "long" : "short"} />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi
                label={fa ? "استاپ‌خورده" : "Stopped"}
                value={fmtPct(analysis.slPct)}
                hint={`${analysis.slN} SL · ${analysis.tpN} TP · ${analysis.beN} BE`}
                tone={analysis.slPct >= 60 ? "short" : "fg"}
              />
              <Kpi
                label={fa ? "سود ناچیز/صفر" : "Dead / scratch"}
                value={String(analysis.scratchN + analysis.noProfitN)}
                hint={`${analysis.noProfitN} ${fa ? "بدون سود" : "no profit"} · ${analysis.scratchN} ${fa ? "ناچیز" : "scratch"}`}
              />
              <Kpi
                label={fa ? "جذب حرکت" : "Capture"}
                value={analysis.avgCapture ? fmtPct(analysis.avgCapture * 100) : "—"}
                hint={`MAE ${fmtR(analysis.avgMae)} · MFE ${fmtR(analysis.avgMfe)}`}
              />
              <Kpi
                label={fa ? "برگشت از سود" : "Giveback"}
                value={String(analysis.stoppedFromProfitN)}
                hint={fa ? "رفت تو سود، بعد مرد" : "Went green, then died"}
              />
            </div>

            <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
              <h2 className="text-sm font-medium">{fa ? "نتیجه آنالیز" : "Engine readout"}</h2>
              <div className="mt-3 grid gap-2">
                {analysis.findings.map((f, i) => (
                  <FindingRow key={`${f.kind}-${i}`} f={f} fa={fa} />
                ))}
              </div>
            </section>

            <SliceTable
              title={fa ? "دسته: اندیکاتور · تایم‌فریم · سمت" : "Batch: engine · TF · side"}
              rows={analysis.byCombo}
              fa={fa}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <SliceTable title={fa ? "بر اساس اندیکاتور" : "By engine"} rows={analysis.byIndicator} fa={fa} />
              <SliceTable title={fa ? "بر اساس تایم‌فریم" : "By timeframe"} rows={analysis.byTf} fa={fa} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <SliceTable title={fa ? "لانگ در برابر شورت" : "Long vs short"} rows={analysis.bySide} fa={fa} />
              <SliceTable title={fa ? "نحوه خروج" : "How it exited"} rows={analysis.byReason} fa={fa} />
            </div>
            {analysis.byEntry.length ? (
              <SliceTable title={fa ? "نحوه ورود" : "Entry path"} rows={analysis.byEntry} fa={fa} />
            ) : null}
            {analysis.byMode.length > 1 ? (
              <SliceTable title={fa ? "کاغذی در برابر واقعی" : "Paper vs live"} rows={analysis.byMode} fa={fa} />
            ) : null}

            <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
              <h2 className="text-sm font-medium">{fa ? "توزیع R همه نمونه‌ها" : "R distribution — every fill"}</h2>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {analysis.hist.map((h) => {
                  const max = Math.max(1, ...analysis.hist.map((x) => x.n));
                  const pct = (h.n / max) * 100;
                  const bad = h.hi <= 0;
                  const tiny = h.lo >= 0 && h.hi <= 0.3;
                  return (
                    <div key={h.key} className="grid gap-1">
                      <div className="flex h-24 items-end rounded-sm bg-bg-elev px-1">
                        <div
                          className={`w-full rounded-sm ${bad ? "bg-short" : tiny ? "bg-warn" : "bg-long"}`}
                          style={{ height: `${Math.max(h.n ? 8 : 0, pct)}%` }}
                        />
                      </div>
                      <div className="text-center font-mono text-[10px] text-subtle">{histLabel(h.key, fa)}</div>
                      <div className="text-center font-mono text-xs tabular">{h.n}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-3">
              <TradeList
                title={fa ? "بیشترین استاپ" : "Hardest stops"}
                empty={fa ? "استاپی در این برش نیست." : "No stops in this cut."}
                rows={analysis.worstStops}
                fa={fa}
                tone="short"
              />
              <TradeList
                title={fa ? "بیشترین سود" : "Biggest wins"}
                empty={fa ? "سودی ثبت نشده." : "No winners."}
                rows={analysis.bestWins}
                fa={fa}
                tone="long"
              />
              <TradeList
                title={fa ? "سود ناچیز / صفر" : "Scratch / no profit"}
                empty={fa ? "سود ناچیزی نبود." : "No scratches."}
                rows={analysis.scratches}
                fa={fa}
                tone="warn"
              />
            </div>

            {analysis.givebacks.length ? (
              <TradeList
                title={fa ? "رفت تو سود، برگشت خورد" : "Went green, then died"}
                empty=""
                rows={analysis.givebacks}
                fa={fa}
                tone="warn"
                showGiveback
              />
            ) : null}

            <section className="rounded-lg border border-border bg-surface shadow-panel">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
                <h2 className="text-sm font-medium">{fa ? "همه نمونه‌ها" : "Every fill"}</h2>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ["all", fa ? "همه" : "All"],
                      ["long", fa ? "لانگ" : "Long"],
                      ["short", fa ? "شورت" : "Short"],
                      ["sl", fa ? "استاپ" : "SL"],
                      ["tp", fa ? "تارگت" : "TP"],
                      ["be", "BE"],
                      ["scratch", fa ? "ناچیز" : "Scratch"],
                      ["giveback", fa ? "برگشت" : "Giveback"],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFilter(k)}
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        filter === k
                          ? "border-accent bg-accent/15 text-fg"
                          : "border-border bg-bg-elev text-muted hover:text-fg"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead className="text-xs text-subtle">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-start font-medium">{fa ? "سمت" : "Side"}</th>
                      <th className="px-3 py-2 text-start font-medium">{fa ? "اندیکاتور" : "Engine"}</th>
                      <th className="px-3 py-2 text-start font-medium">TF</th>
                      <th className="px-3 py-2 text-start font-medium">{fa ? "ورود" : "Entry"}</th>
                      <th className="px-3 py-2 text-start font-medium">{fa ? "خروج" : "Exit"}</th>
                      <th className="px-3 py-2 text-start font-medium">R</th>
                      <th className="px-3 py-2 text-start font-medium">MAE</th>
                      <th className="px-3 py-2 text-start font-medium">MFE</th>
                      <th className="px-3 py-2 text-start font-medium">{fa ? "نحوه ورود" : "Path"}</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono tabular">
                    {!rows.length ? (
                      <tr>
                        <td colSpan={9} className="px-3 py-8 text-sm text-muted">
                          {fa ? "نمونه‌ای در این فیلتر نیست." : "Nothing in this cut."}
                        </td>
                      </tr>
                    ) : (
                      rows.map((tr) => (
                        <tr key={`${tr.opened}-${tr.i}`} className="border-b border-border/60">
                          <td className="px-3 py-2">
                            <SideCell side={tr.side} fa={fa} />
                          </td>
                          <td className="px-3 py-2">{tr.indicator ? indicatorLabel(tr.indicator as never) || tr.indicator : "—"}</td>
                          <td className="px-3 py-2">{tr.timeframe ?? "—"}</td>
                          <td className="px-3 py-2">{fmtPx(tr.entry)}</td>
                          <td className="px-3 py-2">
                            {fmtPx(tr.exit)} <span className="text-subtle">{reasonLabel(tr.reason, fa)}</span>
                          </td>
                          <td className={tr.pnlR >= 0 ? "px-3 py-2 text-long" : "px-3 py-2 text-short"}>{fmtR(tr.pnlR)}</td>
                          <td className="px-3 py-2 text-short">{fmtR(tr.maeR)}</td>
                          <td className="px-3 py-2 text-long">{fmtR(tr.mfeR)}</td>
                          <td className="max-w-[240px] truncate px-3 py-2 text-xs text-muted" title={tr.entryWhy}>
                            {tr.entryWhy}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </DeskShell>
  );
}

function SideCell({ side, fa }: { side: string; fa: boolean }) {
  const long = side === "long";
  return <Badge tone={long ? "long" : "short"}>{long ? (fa ? "لانگ" : "long") : fa ? "شورت" : "short"}</Badge>;
}

function reasonLabel(reason: string, fa: boolean) {
  if (reason === "sl") return fa ? "استاپ" : "SL";
  if (reason === "tp") return fa ? "تارگت" : "TP";
  if (reason === "be") return fa ? "ورود" : "BE";
  return reason;
}

function histLabel(key: string, fa: boolean) {
  const map: Record<string, [string, string]> = {
    "lt-2": ["< −2R", "< −2R"],
    "-2--1": ["−2…−1", "−2…−1"],
    "-1-0": ["−1…۰", "−1…0"],
    "0-0.3": ["ناچیز", "scratch"],
    "0.3-1": ["۰.۳…۱", "0.3…1"],
    "1-2": ["۱…۲", "1…2"],
    gt2: ["> ۲R", "> 2R"],
  };
  const pair = map[key];
  return pair ? (fa ? pair[0] : pair[1]) : key;
}

function comboLabel(key: string, fa: boolean) {
  const parts = key.split(" · ");
  if (parts.length < 3) return sliceKey(key, fa);
  const [ind, tf, side] = parts;
  return `${ind} · ${tf} · ${sliceKey(side ?? "", fa)}`;
}

function FindingRow({ f, fa }: { f: Finding; fa: boolean }) {
  const tone =
    f.severity === "bad"
      ? "border-short/40 bg-short-dim/40"
      : f.severity === "good"
        ? "border-long/40 bg-long-dim/40"
        : f.severity === "warn"
          ? "border-warn/40 bg-surface-2"
          : "border-border bg-bg-elev";
  const bar =
    f.severity === "bad" ? "bg-short" : f.severity === "good" ? "bg-long" : f.severity === "warn" ? "bg-warn" : "bg-border-strong";
  const side = f.side === "long" ? (fa ? "لانگ" : "long") : f.side === "short" ? (fa ? "شورت" : "short") : "";
  const text = findingText(f, fa, side);
  return (
    <div className={`relative overflow-hidden rounded-md border px-3 py-2.5 ${tone}`}>
      <span className={`absolute inset-y-0 start-0 w-0.5 ${bar}`} />
      <div className="text-sm">{text.title}</div>
      {text.detail ? <div className="mt-0.5 text-xs text-muted">{text.detail}</div> : null}
    </div>
  );
}

function findingText(f: Finding, fa: boolean, side: string): { title: string; detail: string } {
  const combo = f.extra ? comboLabel(f.extra, fa) : "";
  switch (f.kind) {
    case "no_trades":
      return {
        title: fa ? "در این برش فیل بسته‌ای نیست." : "No closed fills in this cut.",
        detail: fa ? "فیلتر را باز کن یا صبر کن ربات فیل ببندد." : "Widen the filter or wait for the bot to close fills.",
      };
    case "few_trades":
      return {
        title: fa ? `فقط ${f.n} نمونه — برای قضاوت موتور کم است.` : `Only ${f.n} fills — thin sample.`,
        detail: "",
      };
    case "combo_sl_heavy":
      return {
        title: fa
          ? `${combo} بیشترین استاپ را خورده: ${fmtPct(f.pct ?? 0)}.`
          : `${combo} ate the most stops: ${fmtPct(f.pct ?? 0)}.`,
        detail: fa
          ? `${f.n} استاپ در این دسته. اول همین موتور/تایم/سمت را بهبود بده.`
          : `${f.n} stops in this batch. Tighten this engine/TF/side first.`,
      };
    case "combo_strong":
      return {
        title: fa
          ? `${combo} بیشترین سود را داده: ${fmtR(f.r ?? 0)} خالص، برد ${fmtPct(f.pct ?? 0)}.`
          : `${combo} paid the most: ${fmtR(f.r ?? 0)} net, ${fmtPct(f.pct ?? 0)} win rate.`,
        detail: fa ? `${f.n} معامله در این دسته.` : `${f.n} fills in this batch.`,
      };
    case "combo_weak":
      return {
        title: fa
          ? `${combo} ضرر داده: ${fmtR(f.r ?? 0)} خالص.`
          : `${combo} is the leak: ${fmtR(f.r ?? 0)} net.`,
        detail: fa ? `${f.n} معامله. این دسته را جدا بررسی کن.` : `${f.n} fills. Audit this batch on its own.`,
      };
    case "combo_dead":
      return {
        title: fa
          ? `${combo} تقریباً سود نداده: ${fmtPct(f.pct ?? 0)} صفر یا ناچیز.`
          : `${combo} barely paid: ${fmtPct(f.pct ?? 0)} dead or scratch.`,
        detail: fa ? `${f.n} فیل بی‌فایده در این دسته.` : `${f.n} dead fills in this batch.`,
      };
    case "side_sl_heavy":
      return {
        title: fa
          ? `${side} بیشترین استاپ را خورده: ${fmtPct(f.pct ?? 0)} از این سمت.`
          : `${side} ate the most stops: ${fmtPct(f.pct ?? 0)} of that side.`,
        detail: fa ? `${f.n} استاپ.` : `${f.n} stops.`,
      };
    case "side_strong":
      return {
        title: fa
          ? `${side} بیشترین سود را داده: ${fmtR(f.r ?? 0)} خالص.`
          : `${side} paid the most: ${fmtR(f.r ?? 0)} net.`,
        detail: "",
      };
    case "side_weak":
      return {
        title: fa ? `${side} ضرر داده: ${fmtR(f.r ?? 0)}.` : `${side} is the leak: ${fmtR(f.r ?? 0)}.`,
        detail: "",
      };
    case "sl_rate_high":
      return {
        title: fa ? `${fmtPct(f.pct ?? 0)} از همه فیل‌ها استاپ خورده‌اند.` : `${fmtPct(f.pct ?? 0)} of all fills stopped out.`,
        detail: "",
      };
    case "scratch_heavy":
      return {
        title: fa
          ? `${f.n} معامله سود ناچیز (زیر ۰.۳R).`
          : `${f.n} scratches under 0.3R.`,
        detail: fa ? "تارگت نزدیک است یا BE خیلی زود مسلح می‌شود." : "Target is close or BE is arming too early.",
      };
    case "tiny_profit":
      return {
        title: fa ? `${fmtPct(f.pct ?? 0)} از نمونه‌ها سود نداده‌اند.` : `${fmtPct(f.pct ?? 0)} of samples paid nothing.`,
        detail: "",
      };
    case "giveback_heavy":
      return {
        title: fa
          ? `${f.n} معامله رفت تو سود بعد برگشت خورد.`
          : `${f.n} fills went green then died.`,
        detail: fa ? "MFE هست، نگهداری نیست." : "MFE exists, hold does not.",
      };
    case "missed_tp":
      return {
        title: fa ? `${f.n} بار نزدیک تارگت رفت و استاپ خورد.` : `${f.n} times price tagged near TP then stopped.`,
        detail: "",
      };
    case "capture_low":
      return {
        title: fa
          ? `فقط ${fmtPct(f.pct ?? 0)} از MFE در فیل مانده.`
          : `Only ${fmtPct(f.pct ?? 0)} of MFE is kept.`,
        detail: "",
      };
    case "expect_neg":
      return {
        title: fa ? `امید ریاضی منفی است: ${fmtR(f.r ?? 0)}.` : `Expectancy is negative: ${fmtR(f.r ?? 0)}.`,
        detail: "",
      };
    case "expect_pos":
      return {
        title: fa ? `امید ریاضی مثبت: ${fmtR(f.r ?? 0)}.` : `Expectancy is positive: ${fmtR(f.r ?? 0)}.`,
        detail: "",
      };
    case "worst_stop":
      return {
        title: fa
          ? `بدترین استاپ: ${side} · ${combo} → ${fmtR(f.r ?? 0)}.`
          : `Worst stop: ${side} · ${combo} → ${fmtR(f.r ?? 0)}.`,
        detail: "",
      };
    case "best_trade":
      return {
        title: fa
          ? `بهترین سود: ${side} · ${combo} → ${fmtR(f.r ?? 0)}.`
          : `Best win: ${side} · ${combo} → ${fmtR(f.r ?? 0)}.`,
        detail: "",
      };
    default:
      return { title: f.kind, detail: "" };
  }
}

function SliceTable({ title, rows, fa }: { title: string; rows: SliceStats[]; fa: boolean }) {
  return (
    <section className="rounded-lg border border-border bg-surface shadow-panel">
      <h2 className="border-b border-border px-3 py-2 text-sm font-medium">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-xs text-subtle">
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-start font-medium">{fa ? "دسته" : "Batch"}</th>
              <th className="px-3 py-2 text-start font-medium">n</th>
              <th className="px-3 py-2 text-start font-medium">WR</th>
              <th className="px-3 py-2 text-start font-medium">SL%</th>
              <th className="px-3 py-2 text-start font-medium">{fa ? "مرده" : "Dead"}</th>
              <th className="px-3 py-2 text-start font-medium">ΣR</th>
              <th className="px-3 py-2 text-start font-medium">E[R]</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular">
            {!rows.length ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-sm text-muted">
                  {fa ? "دسته‌ای در این برش نیست." : "No batches in this cut."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.key} className="border-b border-border/60">
                  <td className="px-3 py-2">{comboLabel(r.key, fa)}</td>
                  <td className="px-3 py-2">{r.n}</td>
                  <td className="px-3 py-2">{fmtPct(r.wr)}</td>
                  <td className={r.slPct >= 60 ? "px-3 py-2 text-short" : "px-3 py-2"}>{fmtPct(r.slPct)}</td>
                  <td className={r.deadPct >= 50 ? "px-3 py-2 text-warn" : "px-3 py-2"}>{fmtPct(r.deadPct)}</td>
                  <td className={r.netR >= 0 ? "px-3 py-2 text-long" : "px-3 py-2 text-short"}>{fmtR(r.netR)}</td>
                  <td className={r.expectR >= 0 ? "px-3 py-2 text-long" : "px-3 py-2 text-short"}>{fmtR(r.expectR)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function sliceKey(key: string, fa: boolean) {
  if (key === "long") return fa ? "لانگ" : "long";
  if (key === "short") return fa ? "شورت" : "short";
  if (key === "sl") return fa ? "استاپ" : "SL";
  if (key === "tp") return fa ? "تارگت" : "TP";
  if (key === "be") return fa ? "ورود (BE)" : "BE";
  if (key === "paper") return fa ? "کاغذی" : "paper";
  if (key === "live") return fa ? "واقعی" : "live";
  return key;
}

function TradeList({
  title,
  empty,
  rows,
  fa,
  tone,
  showGiveback,
}: {
  title: string;
  empty: string;
  rows: AnalyzedTrade[];
  fa: boolean;
  tone: "long" | "short" | "warn";
  showGiveback?: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface shadow-panel">
      <h2 className="border-b border-border px-3 py-2 text-sm font-medium">{title}</h2>
      <div className="divide-y divide-border/60">
        {!rows.length ? (
          <p className="px-3 py-6 text-sm text-muted">{empty}</p>
        ) : (
          rows.map((tr) => (
            <div key={`${title}-${tr.i}-${tr.opened}`} className="grid gap-1 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <SideCell side={tr.side} fa={fa} />
                  <span className="text-xs text-muted">
                    {tr.indicator ? indicatorLabel(tr.indicator as never) || tr.indicator : ""} {tr.timeframe ?? ""}
                  </span>
                </div>
                <span
                  className={`font-mono text-sm tabular ${
                    tone === "long" ? "text-long" : tone === "short" ? "text-short" : "text-warn"
                  }`}
                >
                  {fmtR(tr.pnlR)}
                </span>
              </div>
              <div className="font-mono text-xs text-muted">
                {tr.symbol ?? ""} {fmtPx(tr.entry)} → {fmtPx(tr.exit)} · {reasonLabel(tr.reason, fa)}
                {showGiveback ? ` · ${fa ? "برگشت" : "giveback"} ${fmtR(tr.givebackR)}` : ""}
              </div>
              <div className="text-[11px] text-subtle">
                MAE {fmtR(tr.maeR)} · MFE {fmtR(tr.mfeR)} · {fmtUsd(tr.pnl)}
              </div>
              <div className="truncate text-[11px] text-muted" title={tr.entryWhy}>
                {tr.entryWhy}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
