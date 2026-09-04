import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { DeskShell } from "@/components/desk/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale";
import { probeBtc } from "@/lib/server/functions";
import { fmtBarOpen, fmtPx } from "@/lib/utils";
import { indicatorLabel } from "@/lib/engine/types";

export const Route = createFileRoute("/audit")({
  component: Page,
});

type Tone = "ok" | "no" | "note";

function Card({
  n,
  title,
  tone,
  toneLabel,
  children,
}: {
  n: string;
  title: string;
  tone: Tone;
  toneLabel: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-panel">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-subtle">{n}</span>
        <h2 className="font-display text-xl tracking-tight">{title}</h2>
        <Badge tone={tone === "ok" ? "long" : tone === "no" ? "short" : "warn"}>{toneLabel}</Badge>
      </div>
      <div className="mt-3 grid gap-3 text-sm leading-relaxed text-muted">{children}</div>
    </article>
  );
}

type Probe = Awaited<ReturnType<typeof probeBtc>>;

function ProbePanel({ fa }: { fa: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<Probe | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      setData(await probeBtc());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "probe failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={run} disabled={busy}>
          {busy ? (fa ? "در حال اجرای موتور…" : "Running engines…") : fa ? "پروب زنده BTC 15m" : "Live BTC 15m probe"}
        </Button>
        {data ? (
          <span className="font-mono text-xs text-subtle" dir="ltr">
            {data.symbol} · {data.bars} bars · last {fmtBarOpen(data.lastBar)}
          </span>
        ) : null}
      </div>
      {err ? <p className="text-short">{err}</p> : null}
      {data ? (
        <div className="overflow-x-auto rounded-sm border border-border">
          <table className="w-full min-w-[520px] text-left text-sm" dir="ltr">
            <thead className="bg-bg-elev text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="px-3 py-2 font-medium">Engine</th>
                <th className="px-3 py-2 font-medium">Fills</th>
                <th className="px-3 py-2 font-medium">Bias</th>
                <th className="px-3 py-2 font-medium">Armed</th>
                <th className="px-3 py-2 font-medium">Last fill</th>
              </tr>
            </thead>
            <tbody>
              {data.engines.map((e) => {
                const last = e.last[e.last.length - 1];
                return (
                  <tr key={e.name} className="border-t border-border">
                    <td className="px-3 py-2 text-fg">{indicatorLabel(e.name)}</td>
                    <td className="px-3 py-2 font-mono tabular">{e.count}</td>
                    <td className="px-3 py-2">{e.lastBias}</td>
                    <td className="px-3 py-2">{e.armed ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">
                      {last
                        ? `${last.side} @ ${fmtPx(last.entry)} · ${fmtBarOpen(last.barTime)}`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>
          {fa
            ? "کندل‌های بسته‌شدهٔ بیت‌کوین از بایننس/استر می‌آید و هر ۹ موتور روی همان سری اجرا می‌شود. اگر جدول پر شود، موتور عملیاتی است."
            : "Closed BTC perps candles from Binance/Aster, then all nine engines on the same series. A filled table means the engines are operational."}
        </p>
      )}
    </div>
  );
}

function Page() {
  const { locale } = useLocale();
  const fa = locale === "fa";

  return (
    <DeskShell>
      <h1 className="font-display text-3xl tracking-tight">{fa ? "ممیزی ربات" : "Bot audit"}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        {fa
          ? "سه سؤال تو، با مقایسهٔ خط‌به‌خط با اسکریپت‌های Pine که فرستادی. یک باگ اجرایی پیدا و همین‌جا درست شد."
          : "Your three questions, after a line-by-line compare with the Pine scripts you sent. One execution bug was found and fixed here."}
      </p>

      <div className="mt-6 grid gap-4">
        <Card
          n="01"
          title={fa ? "باگ دارد؟" : "Are there bugs?"}
          tone="note"
          toneLabel={fa ? "یکی بود — درست شد" : "One was — now fixed"}
        >
          <p>
            {fa
              ? "موتور سیگنال تمیز است. باگ در مدیریت پوزیشن بعد از ورود بود، نه در خود اندیکاتور."
              : "The signal engines are clean. The bug was in post-entry management, not in the indicators."}
          </p>
          <ul className="grid list-disc gap-1 ps-5">
            <li>
              {fa
                ? "قبل: هر تیک فقط آخرین کندل ۵دقیقه‌ای را برای SL/TP می‌دید. اگر استاپ بین دو تیک روی کندل قبلی خورده بود و کندل آخر دیگر به آن نمی‌رسید، پوزیشن کاغذی باز می‌ماند. الان همهٔ کندل‌های بعد از ورود به‌ترتیب راه می‌روند."
                : "Before: each tick only inspected the latest 5m bar for SL/TP. A stop that wicked on an earlier bar between ticks was missed if the last bar never retagged it. Now every 5m bar after the fill is walked in order."}
            </li>
            <li>
              {fa
                ? "ورود زنده مارکت است، نه لیمیت روی FTC — نسبت به فلش TradingView لغزش دارد. این محدودیت اجراست، نه باگ منطق."
                : "Live entries are market orders, not a limit at FTC — slippage versus the TradingView arrow. Execution limit, not a logic bug."}
            </li>
            <li>
              {fa
                ? "اگر SL و TP در یک کندل هر دو بخورند، قرارداد لاب APEX است: استاپ برنده است. روی صرافی زنده ممکن است TP زودتر پر شود."
                : "If SL and TP both trade in one bar, the APEX lab contract awards the stop. A live venue may fill TP first."}
            </li>
          </ul>
        </Card>

        <Card
          n="02"
          title={fa ? "منطق اندیکاتور درست پیاده شده؟" : "Is the indicator logic implemented correctly?"}
          tone="ok"
          toneLabel={fa ? "بله — پورت وفادار" : "Yes — faithful port"}
        >
          <p>
            {fa
              ? "نه موتور APEX، نه سه کویل HALCYON (Aegis / Vesper / Orion)، نه دو TREX، نه KETEX، نه SHETEX بازنویسی خلاقانه نیستند. اسکلت، گیت‌های قفل‌شده، و ترتیب مسلح→تگ همان Pine است."
              : "APEX, the three HALCYON coils (Aegis / Vesper / Orion), both TREX labs, KETEX and SHETEX are not creative rewrites. Skeleton, locked gates, and arm→tag order match Pine."}
          </p>
          <ul className="grid list-disc gap-1 ps-5">
            <li>
              {fa
                ? "APEX: کاور مستر/لانگ‌بار → پیوت زنده → تست دوم در باند ATR (minTests) → FTC → تگ بدون خوردن استاپ. تاچ اول عمداً رد می‌شود. گیت‌های ۵م/۱۵م/۱ساعت هر سه فایل 1R / 1.5R / 2R قفل‌اند (از جمله ۵م فقط شورت، widen استاپ، minVol)."
                : "APEX: master/longbar cover → live pivot → second test in the ATR band (minTests) → FTC → tag without the stop. First-touch skipped. 5m/15m/1h auto-gates from all three 1R / 1.5R / 2R files are locked (including 5m shorts-only, stop widen, minVol)."}
            </li>
            <li>
              {fa
                ? "ATR سفارشی (۵+۱۰+۲۱×۲+۶۶×۳+۱۳۲×۵+۲۶۴×۸)/۲۰، last-third، room-to-pivot، HTF EMA21 و HTF2 ×۱۶ با lookahead_off، استک EMA21/84/200، DI، confirm close، کف استاپ — مطابق Pine."
                : "Custom ATR (5+10+21×2+66×3+132×5+264×8)/20, last-third, room-to-pivot, HTF EMA21 and HTF2 ×16 with lookahead_off, EMA21/84/200 stack, DI, confirm close, stop floor — match Pine."}
            </li>
            <li>
              {fa
                ? "HALCYON: همان قفل فشرده. ۵م باکس ۱۵م را با request.security و lookahead_off فید می‌کند. گیت کیفیت فیل (fillCloseLoc / maxSlFrac / fillMinBody / poke / chop / minBoxPct) از شاخه‌های RR داخل Pine آمده."
                : "HALCYON: same compression lock. 5m fades a 15m box via request.security, lookahead_off. Fill quality gates (fillCloseLoc / maxSlFrac / fillMinBody / poke / chop / minBoxPct) follow the RR branches in Pine."}
            </li>
            <li>
              {fa
                ? "TREX 1.0R و 1.2R: باند ۰.۷۰ ATR، HTF EMA50، کف استاپ/تارگت ۰.۵٪، BE@۰.۳۵ / ۰.۳۲. پارامترها دقیقاً همان دو فایل ۱۵م هستند."
                : "TREX 1.0R and 1.2R: 0.70 ATR band, HTF EMA50, 0.5% stop/target floors, BE@0.35 / 0.32. Parameters match the two 15m files exactly."}
            </li>
            <li>
              {fa
                ? "KETEX ۲.۲R: همان اسکلت تست دوم TREX، با کیفیت NEXUS (HTF EMA21 ±۰.۳٪، رژیم EMA84، کلوز آن‌سوی FTC). اتاق حداقل ۲.۲R، انتظار ۸ کندل، کول‌داون ۵. بدون BE و بدون گیت جدا برای هر تایم — خانوادهٔ جدا از APEX لاب."
                : "KETEX 2.2R: TREX second-test skeleton with NEXUS quality (HTF EMA21 ±0.3%, EMA84 regime, close beyond FTC). Min room 2.2R, 8-bar wait, 5-bar cooldown. No BE and no per-TF auto-gates — its own family, not the APEX lab."}
            </li>
            <li>
              {fa
                ? "SHETEX ۱.۸R: TREX Entries بومی ۴ساعته. تست دوم → تگ FTC بدون کلوز تأیید. HTF EMA50، اتاق ۱.۶R، انتظار ۸، کول‌داون ۵. بدون کف استاپ/تارگت و بدون BE — خانوادهٔ جدا از TREX1 / TREX12."
                : "SHETEX 1.8R: native 4H TREX Entries. Second-test → FTC tag with no confirm close. HTF EMA50, room 1.6R, 8-bar wait, 5-bar cooldown. No stop/target floors and no BE — own family, not TREX1 / TREX12."}
            </li>
            <li>
              {fa
                ? "نکتهٔ وفاداری: لاب TREX روی ۱۵م قفل شده و Pine گیت جدا برای ۵م/۱ساعت ندارد. ربات همان پارامترها را روی هر چهار تایم‌فریم اسکن می‌کند — کار می‌کند، اما اعداد لاب فقط برای ۱۵م معتبرند."
                : "Fidelity note: TREX is a 15m lab and Pine has no per-TF auto-gates. The bot scans those same parameters on 5m/1h/4h — it runs, but the published stats are 15m-only."}
            </li>
            <li>
              {fa
                ? "کویل HALC 2.2R (رنج اصلی) در فایل‌های پیوست نبود؛ از نسخهٔ قبلی میز مانده. Aegis/Vesper/Orion همان سه فایلی هستند که فرستادی."
                : "Original HALC 2.2R coil was not in the attached zip; it remains from the previous desk. Aegis/Vesper/Orion are the three files you sent."}
            </li>
            <li>
              {fa
                ? "quirk وفادار: حلقه threeMasters وقتی مبدأ لگ عقب‌تر از کاور است اجرا نمی‌شود (مثل Pine). فیلتر واقعی همان طول لگ × ATR است."
                : "Faithful quirk: the threeMasters loop does not run when the leg origin is older than the cover bar (same as Pine). The real filter is still leg length × ATR."}
            </li>
          </ul>
        </Card>

        <Card
          n="03"
          title={fa ? "عملیاتی هست؟" : "Is it operational?"}
          tone="ok"
          toneLabel={fa ? "کاغذی بله — زنده با کلید" : "Paper yes — live with keys"}
        >
          <p>
            {fa
              ? "بله. اسکنر روی کلوز بار، ژورنال، آنالیز فیل‌ها، SL/TP روی مسیر ۵دقیقه، و کرون به /api/tick یک حلقه کامل است. کاغذی بدون کلید با داده زنده پرپ کار می‌کند. زنده روی Hyperliquid / Lighter / Aster / Toobit سفارش می‌فرستد."
              : "Yes. Closed-bar scanner, journal, fill analysis, 5m path SL/TP, and cron hitting /api/tick are a complete loop. Paper needs no keys and still uses live perp data. Live sends orders on Hyperliquid / Lighter / Aster / Toobit."}
          </p>
          <ul className="grid list-disc gap-1 ps-5">
            <li>
              {fa
                ? "از دکمهٔ پایین برای پروب BTC 15m استفاده کن — اگر تعداد فیل‌ها عدد شد، موتور روی داده واقعی اجرا شده."
                : "Use the BTC 15m probe below — a numeric fill count means the engines ran on live candles."}
            </li>
            <li>
              {fa ? (
                <>
                  پین اپراتور را از{" "}
                  <Link to="/venues" className="text-long underline-offset-2 hover:underline">
                    صرافی‌ها
                  </Link>{" "}
                  بگذار، وگرنه لینک میز همه تنظیمات را باز می‌گذارد.
                </>
              ) : (
                <>
                  Set the operator PIN on{" "}
                  <Link to="/venues" className="text-long underline-offset-2 hover:underline">
                    Venues
                  </Link>{" "}
                  or the desk URL can change settings.
                </>
              )}
            </li>
            <li>
              {fa
                ? "بدون کلید واقعی نمی‌توان فیل زنده را اثبات کرد. دکمه Test فقط موجودی و امضا را چک می‌کند."
                : "A live fill cannot be proven without your keys. Test only checks balance and signing."}
            </li>
          </ul>
          <ProbePanel fa={fa} />
        </Card>

        <Card
          n="04"
          title={fa ? "TP و BE کجاست؟" : "Where are TP and BE?"}
          tone="ok"
          toneLabel={fa ? "فرمول مشخص" : "Exact formula"}
        >
          <pre className="overflow-x-auto rounded-sm bg-bg-elev p-3 font-mono text-xs text-fg" dir="ltr">
            {`entry = FTC
slDist = |FTC − SL|
TP     = FTC ± R × slDist
APEX 1 / 1.5 / 2     R from profile
Aegis / Vesper / Orion  1.0 / 1.5 / 2.0
Coil HALC               2.2
TREX 1.0 / 1.2          then BE @ 0.35R / 0.32R → SL = entry
KETEX                   2.2 · no BE
SHETEX                  1.8 · no BE
same-bar SL+TP → SL`}
          </pre>
        </Card>
      </div>
    </DeskShell>
  );
}
