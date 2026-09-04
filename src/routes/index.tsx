import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DeskShell } from "@/components/desk/shell";
import { StatusChip } from "@/components/desk/status-chip";
import { Kpi, PositionsTable, SignalsTable } from "@/components/desk/tables";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { getDesk, saveDeskSettings, tickNow } from "@/lib/server/functions";
import { useCronWatchdog, useLiveDesk } from "@/lib/use-live-desk";
import { useLocale } from "@/lib/locale";
import { fmtPct, fmtR, fmtUsd, millionsToUsd, usdToMillions } from "@/lib/utils";
import { CRON_STALE_MS } from "@/lib/engine/scan-schedule";
import { bookVenue, chartHostLabel, venueLabel } from "@/lib/exchanges/meta";

export const Route = createFileRoute("/")({
  loader: () => getDesk(),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  const { t, locale } = useLocale();
  const router = useRouter();
  const s = data.settings;
  const unlocked = data.lock.unlocked;
  useLiveDesk(20000);
  useCronWatchdog({ enabled: unlocked, lastTickAt: s.lastTickAt });
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [capital, setCapital] = useState(String(s.capitalPct ?? 10));
  const [batch, setBatch] = useState(String(s.scanBatch ?? 0));
  const [maxPos, setMaxPos] = useState(String(s.maxPositions ?? 4));
  const [maxLev, setMaxLev] = useState(String(s.maxLeverage ?? 200));
  const [minCap, setMinCap] = useState(String(usdToMillions(s.minMarketCapUsd)));
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    setCapital(String(s.capitalPct ?? 10));
    setBatch(String(s.scanBatch ?? 0));
    setMaxPos(String(s.maxPositions ?? 4));
    setMaxLev(String(s.maxLeverage ?? 200));
    setMinCap(String(usdToMillions(s.minMarketCapUsd)));
  }, [s.capitalPct, s.scanBatch, s.maxPositions, s.maxLeverage, s.minMarketCapUsd]);
  const pnl = Number(data.stats.pnl);
  const curve = data.equity.map((e) => ({
    t: new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    equity: Number(e.equity_usd),
  }));
  const stale = !s.lastTickAt || Date.now() - new Date(s.lastTickAt).getTime() > CRON_STALE_MS;

  async function saveSizing() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const saved = await saveDeskSettings({
        data: {
          capital_pct: Math.min(100, Math.max(1, Number(capital) || 10)),
          scan_batch: Math.min(250, Math.max(0, Math.round(Number(batch) || 0))),
          max_positions: Math.min(20, Math.max(1, Math.round(Number(maxPos) || 4))),
          max_leverage: Math.min(200, Math.max(1, Math.round(Number(maxLev) || 200))),
          min_market_cap_usd: millionsToUsd(Number(minCap) || 0),
        },
      });
      setCapital(String(saved.capitalPct ?? capital));
      setBatch(String(saved.scanBatch ?? batch));
      setMaxPos(String(saved.maxPositions ?? maxPos));
      setMaxLev(String(saved.maxLeverage ?? maxLev));
      setMinCap(String(usdToMillions(saved.minMarketCapUsd)));
      setSaveMsg(t.saved);
      await router.invalidate({ sync: true });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "save failed");
    } finally {
      setSaving(false);
    }
  }

  async function scan() {
    setBusy(true);
    try {
      await tickNow({ data: { forceUniverse: data.universe.length === 0 || data.settings.universeVenue !== data.settings.venue } });
      await router.invalidate({ sync: true });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "scan failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DeskShell
      status={
        <StatusChip
          botEnabled={s.botEnabled}
          mode={s.mode}
          venue={s.venue}
          lastTickAt={s.lastTickAt}
          lastTickSource={s.lastTickSource}
          durable={s.durable}
        />
      }
    >
      <div className="flex flex-col gap-6">
        {!data.lock.hasPin ? (
          <div className="rounded-lg border border-short/40 bg-short-dim/30 p-4 text-sm text-fg">
            {locale === "fa"
              ? "لینک این میز عمومی است. تا پین نگذاری هر کس می‌تواند کلید و Live را عوض کند. از صرافی‌ها پین بگذار."
              : "This URL is public. Until you set a PIN, anyone can change keys and Live. Set it on Venues."}{" "}
            <Link to="/venues" className="text-long underline-offset-2 hover:underline">
              {locale === "fa" ? "صرافی‌ها" : "Venues"}
            </Link>
            {" · "}
            <Link to="/audit" className="text-long underline-offset-2 hover:underline">
              {locale === "fa" ? "نتیجه ممیزی" : "Audit"}
            </Link>
          </div>
        ) : !s.durable ? (
          <div className="rounded-lg border border-warn/40 bg-surface p-4 text-sm text-muted">
            {s.serverless
              ? locale === "fa"
                ? "روی Vercel بدون Neon دیتابیس ذخیره نمی‌شود و با هر درخواست پاک می‌شود. در Vercel → Settings → Environment Variables مقدار DATABASE_URL را از Neon بگذار و Redeploy کن."
                : "On Vercel without Neon, nothing is saved. Add DATABASE_URL from Neon in Vercel → Settings → Environment Variables, then Redeploy."
              : locale === "fa"
                ? "این پیش‌نمایش است. برای اینکه از هر سیستم و بعد از بستن کروم همه چیز همان بماند، اپ را Publish کن تا دیتابیس Neon وصل شود. بعد کرون کلادفلر را از صفحه همیشه روشن وصل کن."
                : "This is the preview. Publish so Neon keeps the desk identical on every device. Then connect Cloudflare cron from Always-on."}{" "}
            <Link to="/always-on" className="text-long underline-offset-2 hover:underline">
              {locale === "fa" ? "همیشه روشن" : "Always on"}
            </Link>
          </div>
        ) : s.botEnabled && stale ? (
          <div className="rounded-lg border border-warn/40 bg-surface p-4 text-sm text-muted">
            {locale === "fa"
              ? "دیتابیس پایدار است ولی کرون هنوز تیک نزده. از همیشه روشن Worker کلادفلر را وصل کن تا با کامپیوتر خاموش هم معامله ثبت شود."
              : "Database is durable, but cron has not ticked yet. Connect the Cloudflare worker on Always-on."}{" "}
            <Link to="/always-on" className="text-long underline-offset-2 hover:underline">
              {locale === "fa" ? "همیشه روشن" : "Always on"}
            </Link>
          </div>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{t.desk}</h1>
            <p className="mt-1 max-w-xl text-sm text-muted">
              {locale === "fa"
                ? `${data.universe.length} پرپ روی ${venueLabel(s.venue)} · چارت ${chartHostLabel(bookVenue(s.venue))} · سیگنال فقط روی آخرین کندل بسته‌شده.`
                : `${data.universe.length} perps on ${venueLabel(s.venue)} · ${chartHostLabel(bookVenue(s.venue))} candles · signals on the just-closed bar only.`}
            </p>
          </div>
          <Button onClick={scan} disabled={busy}>
            {busy ? t.scanning : t.scanNow}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              k: "1R",
              name: "APEX 1R",
              fa: "۱۵م و ۱س هر دو سمت · ۵م فقط شورت · کف استاپ بدون Widen",
              en: "15m / 1h both sides · 5m shorts only · skip undersized stops",
            },
            {
              k: "1.5R",
              name: "APEX 1.5R",
              fa: "کف استاپ با Widen · ۵م شورت · ۱۵م و ۱س هر دو سمت",
              en: "Stop floor with widen · 5m shorts · 15m / 1h both sides",
            },
            {
              k: "2R",
              name: "APEX 2R",
              fa: "فقط شورت در هر تایم‌فریم · حجم نسبی روی ۵م و ۱۵م",
              en: "Shorts only on every TF · relative volume on 5m / 15m",
            },
          ].map((p) => (
            <article key={p.k} className="rounded-lg border border-border bg-surface p-4 shadow-panel">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-xl tracking-tight">{p.name}</h2>
                <span className="font-mono text-xs text-long">{p.k}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{locale === "fa" ? p.fa : p.en}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              k: "1.0R",
              name: "Aegis",
              fa: "کویل فشرده · بیشترین فیل باکیفیت · ۵م از باکس قفل‌شدهٔ ۱۵م",
              en: "Compression coil · most quality fills · 5m fades a locked 15m box",
            },
            {
              k: "1.5R",
              name: "Vesper",
              fa: "تعادل تعداد و ریوارد · همان فنر FTC · فیل سخت‌تر از Aegis",
              en: "Balance of count and reward · same FTC spring · stricter fill than Aegis",
            },
            {
              k: "2.0R",
              name: "Orion",
              fa: "سخت‌گیرانه‌ترین فیل کویل · تارگت ۲R باید داخل باکس جا شود",
              en: "Strictest coil fill · 2R target must fit inside the locked box",
            },
            {
              k: "2.2R",
              name: "Coil",
              fa: "HALCYON اصلی · باکس بومی هر تایم · ۲.۲R داخل رنج",
              en: "Original HALCYON · native box per TF · 2.2R must fit in the range",
            },
          ].map((p) => (
            <article key={p.k} className="rounded-lg border border-border bg-surface p-4 shadow-panel">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-xl tracking-tight">{p.name}</h2>
                <span className="font-mono text-xs text-muted">{p.k}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{locale === "fa" ? p.fa : p.en}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              k: "1.0R",
              name: "TREX 1.0R",
              fa: "تست دوم پیوت زنده · ورود FTC · بعد از +۰.۳۵R استاپ به ورود · هر دو سمت",
              en: "Second-test live pivot · FTC entry · stop to BE after +0.35R · both sides",
            },
            {
              k: "1.2R",
              name: "TREX 1.2R",
              fa: "همان اسکلت · تارگت ۱.۲R · BE@۰.۳۲R · لگ و اتاق سخت‌تر",
              en: "Same skeleton · 1.2R target · BE@0.32R · stricter leg and room",
            },
            {
              k: "2.2R",
              name: "KETEX",
              fa: "APEX جدید · تست دوم + رژیم EMA84 و کلوز FTC · HTF EMA21 · بدون BE · هر دو سمت",
              en: "New APEX · second-test + EMA84 regime and FTC close · HTF EMA21 · no BE · both sides",
            },
            {
              k: "1.8R",
              name: "SHETEX",
              fa: "TREX Entries · تست دوم → FTC · تارگت ۱.۸R · HTF EMA50 · بدون BE · بومی ۴ساعته",
              en: "TREX Entries · second-test → FTC · 1.8R target · HTF EMA50 · no BE · native 4H",
            },
          ].map((p) => (
            <article key={p.k} className="rounded-lg border border-border bg-surface p-4 shadow-panel">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-xl tracking-tight">{p.name}</h2>
                <span className="font-mono text-xs text-muted">{p.k}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{locale === "fa" ? p.fa : p.en}</p>
            </article>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi label={t.equity} value={fmtUsd(s.equityUsd, 0)} hint={`${t.paper} / ${s.venue}`} />
          <Kpi label={t.open} value={String(data.stats.open)} hint={`max ${s.maxPositions}`} />
          <Kpi
            label={t.winRate}
            value={fmtPct(data.stats.winRate)}
            hint={`${data.stats.closed} ${t.trades}`}
            tone={data.stats.winRate >= 50 ? "long" : "fg"}
          />
          <Kpi label={t.netR} value={fmtR(data.stats.r)} tone={data.stats.r >= 0 ? "long" : "short"} />
          <Kpi label={t.pnl} value={fmtUsd(pnl)} tone={pnl >= 0 ? "long" : "short"} />
        </div>

        <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium">{t.capital}</h2>
              <p className="mt-1 max-w-xl text-xs text-muted">{t.capitalHint}</p>
            </div>
            <span className="text-xs text-subtle">
              {locale === "fa" ? `سقف اهرم ${s.maxLeverage ?? 200}x` : `Leverage cap ${s.maxLeverage ?? 200}x`}
            </span>
          </div>
          <div className="mb-4 grid gap-1.5 rounded-lg border border-accent/50 bg-surface-2 p-3">
            <Label htmlFor="desk-maxlev">{t.autoLev}</Label>
            <Input
              id="desk-maxlev"
              type="number"
              min={1}
              max={200}
              step={1}
              value={maxLev}
              disabled={!unlocked || saving}
              onChange={(e) => setMaxLev(e.target.value)}
            />
            <div className="flex flex-wrap gap-1">
              {[5, 10, 20, 25, 50, 100, 200].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={!unlocked || saving}
                  onClick={() => setMaxLev(String(n))}
                  className={`min-h-8 rounded-sm border px-2 text-xs ${
                    Number(maxLev) === n
                      ? "border-accent bg-surface text-fg"
                      : "border-border text-muted hover:border-border-strong"
                  } disabled:opacity-40`}
                >
                  {n}x
                </button>
              ))}
            </div>
            <p className="text-xs text-subtle">
              {(() => {
                const capN = Math.min(100, Math.max(1, Number(capital) || 10));
                const userCap = Math.min(200, Math.max(1, Math.round(Number(maxLev) || 200)));
                const btc = data.universe.find((a) => a.base === "BTC") ?? data.universe[0];
                const venueLev = Number(btc?.max_leverage) || 25;
                const lev = Math.min(userCap, venueLev);
                const notional = s.equityUsd * (capN / 100) * lev;
                const coin = btc?.base ?? "BTC";
                return locale === "fa"
                  ? `۱ تا ۲۰۰. ربات از سقف خود ارز بالاتر نمی‌رود. الان: ${capN}٪ مارجین × ${lev}x روی ${coin} ≈ ${fmtUsd(notional, 0)} حجم · سقف ارز ${venueLev}x`
                  : `1–200. Never above that coin's venue max. Now: ${capN}% margin × ${lev}x on ${coin} ≈ ${fmtUsd(notional, 0)} notional · venue max ${venueLev}x`;
              })()}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="desk-capital">{t.capital} %</Label>
              <Input
                id="desk-capital"
                type="number"
                min={1}
                max={100}
                step={1}
                value={capital}
                disabled={!unlocked || saving}
                onChange={(e) => setCapital(e.target.value)}
              />
              <div className="flex flex-wrap gap-1">
                {[5, 10, 15, 20, 25, 50].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={!unlocked || saving}
                    onClick={() => setCapital(String(n))}
                    className={`min-h-8 rounded-sm border px-2 text-xs ${
                      Number(capital) === n
                        ? "border-accent bg-surface-2 text-fg"
                        : "border-border text-muted hover:border-border-strong"
                    } disabled:opacity-40`}
                  >
                    {n}%
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="desk-batch">{locale === "fa" ? "ارز در هر تیک (۰ = همه)" : "Coins per tick (0 = all)"}</Label>
              <Input
                id="desk-batch"
                type="number"
                min={0}
                max={250}
                step={1}
                value={batch}
                disabled={!unlocked || saving}
                onChange={(e) => setBatch(e.target.value)}
              />
              <div className="flex flex-wrap gap-1">
                {[
                  { n: 0, label: locale === "fa" ? "همه" : "all" },
                  { n: 40, label: "40" },
                  { n: 80, label: "80" },
                  { n: 120, label: "120" },
                ].map((p) => (
                  <button
                    key={p.n}
                    type="button"
                    disabled={!unlocked || saving}
                    onClick={() => setBatch(String(p.n))}
                    className={`min-h-8 rounded-sm border px-2 text-xs ${
                      Number(batch) === p.n
                        ? "border-accent bg-surface-2 text-fg"
                        : "border-border text-muted hover:border-border-strong"
                    } disabled:opacity-40`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="desk-mincap">{t.minCap} · {locale === "fa" ? "میلیون $" : "USD millions"}</Label>
              <Input
                id="desk-mincap"
                type="number"
                min={0}
                step={1}
                value={minCap}
                disabled={!unlocked || saving}
                onChange={(e) => setMinCap(e.target.value)}
              />
              <div className="flex flex-wrap gap-1">
                {[
                  { n: 0, label: t.minCapAll },
                  { n: 100, label: "100" },
                  { n: 300, label: "300" },
                  { n: 800, label: "800" },
                  { n: 1000, label: "1B" },
                ].map((p) => (
                  <button
                    key={p.n}
                    type="button"
                    disabled={!unlocked || saving}
                    onClick={() => setMinCap(String(p.n))}
                    className={`min-h-8 rounded-sm border px-2 text-xs ${
                      Number(minCap) === p.n
                        ? "border-accent bg-surface-2 text-fg"
                        : "border-border text-muted hover:border-border-strong"
                    } disabled:opacity-40`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="desk-maxpos">{t.maxPos}</Label>
              <Input
                id="desk-maxpos"
                type="number"
                min={1}
                max={20}
                step={1}
                value={maxPos}
                disabled={!unlocked || saving}
                onChange={(e) => setMaxPos(e.target.value)}
              />
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3, 4, 6, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={!unlocked || saving}
                    onClick={() => setMaxPos(String(n))}
                    className={`min-h-8 rounded-sm border px-2 text-xs ${
                      Number(maxPos) === n
                        ? "border-accent bg-surface-2 text-fg"
                        : "border-border text-muted hover:border-border-strong"
                    } disabled:opacity-40`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={saveSizing} disabled={!unlocked || saving}>
                {saving ? "…" : t.save}
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-subtle">
            {locale === "fa"
              ? Number(s.scanBatch) > 0
                ? `کرون هر دقیقه می‌زند. هر تیک تا ${s.scanBatch} ارز از ${data.universe.length} تا (لیست خود صرافی) را روی آخرین کندل بسته‌شدهٔ همان صرافی اسکن می‌کند؛ بقیه دقیقه بعد. کندل قبلی و کندل باز هرگز معامله نمی‌شود.`
                : `کرون هر دقیقه می‌زند. هر تیک هر ${data.universe.length} ارز لیست‌شده روی صرافی را فقط روی آخرین کندل بسته‌شدهٔ همان چارت اسکن می‌کند — نه کندل در حال شکل‌گیری، نه کندل صرافی دیگر.`
              : Number(s.scanBatch) > 0
                ? `Cron fires every minute. Each tick scans up to ${s.scanBatch} of ${data.universe.length} venue-listed coins on that exchange's just-closed bar; the rest continue next minute. Forming and previous candles are never filled.`
                : `Cron fires every minute. Each tick scans all ${data.universe.length} venue-listed coins on that exchange's just-closed bar only — not the forming candle, not another venue's chart.`}
            {Number(s.minMarketCapUsd) > 0
              ? locale === "fa"
                ? ` فیلتر مارکت‌کپ: ≥ ${fmtUsd(s.minMarketCapUsd, 0)}.`
                : ` Market-cap floor: ≥ ${fmtUsd(s.minMarketCapUsd, 0)}.`
              : locale === "fa"
                ? " بدون کف مارکت‌کپ."
                : " No market-cap floor."}
            {locale === "fa"
              ? ` سقف اهرم ${s.maxLeverage ?? 200}x — بالاتر از سقف خود ارز نمی‌رود.`
              : ` Leverage cap ${s.maxLeverage ?? 200}x — never above that coin's venue max.`}
            {saveMsg ? ` · ${saveMsg}` : ""}
            {!unlocked
              ? locale === "fa"
                ? " · برای ذخیره، از صرافی‌ها پین را باز کن."
                : " · Unlock the PIN on Venues to save."
              : ""}
          </p>
        </section>

        <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">{t.equity}</h2>
            <span className="text-xs text-subtle">paper ledger</span>
          </div>
          <div className="h-48">
            {curve.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={curve}>
                  <defs>
                    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-long)" stopOpacity={0.35} />
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
                  <Area type="monotone" dataKey="equity" stroke="var(--color-long)" fill="url(#eq)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted">
                {locale === "fa" ? "منحنی بعد از اولین تیک پر می‌شود." : "The curve fills after the first tick."}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
          <h2 className="mb-1 text-sm font-medium">{t.positions}</h2>
          <p className="mb-3 text-xs text-subtle">
            {locale === "fa"
              ? "ستون TP همان تارگت است: APEX 1R · 1.5R · 2R، HALCYON 1R · 1.5R · 2R · 2.2R، TREX 1.0R · 1.2R، KETEX 2.2R، SHETEX 1.8R. کاغذی را ربات روی کندل ۵دقیقه می‌بندد؛ زنده را خود صرافی با سفارش محافظ. TREX بعد از BE استاپ را به ورود می‌کشد."
              : "The TP column is the target: APEX 1R · 1.5R · 2R, HALCYON 1R · 1.5R · 2R · 2.2R, TREX 1.0R · 1.2R, KETEX 2.2R, SHETEX 1.8R. Paper exits on the 5m bar; live attaches a protective order on the venue. TREX moves the stop to entry after BE."}
          </p>
          <PositionsTable rows={data.open} empty={t.noPositions} />
        </section>

        <section className="rounded-lg border border-border bg-surface p-4 shadow-panel">
          <h2 className="mb-3 text-sm font-medium">{t.recentSignals}</h2>
          <SignalsTable rows={data.signals} empty={t.noSignals} />
        </section>

        {data.scans[0] ? (
          <p className="text-xs text-subtle">
            last scan · {data.scans[0].source || "manual"} · {data.scans[0].scanned} charts · {data.scans[0].signals}{" "}
            signals · {data.scans[0].duration_ms} ms · {data.scans[0].note}
          </p>
        ) : null}
        <p className="text-xs text-subtle">{t.disclaimer}</p>
      </div>
    </DeskShell>
  );
}
