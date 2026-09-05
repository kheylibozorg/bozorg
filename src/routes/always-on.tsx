import { createFileRoute, useRouter } from "@tanstack/react-router";
import { CopyBtn } from "@/components/desk/copy-btn";
import { LockPanel } from "@/components/desk/lock-panel";
import { DeskShell } from "@/components/desk/shell";
import { StatusChip } from "@/components/desk/status-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDesk, rotateDeskToken, tickNow } from "@/lib/server/functions";
import { useCronWatchdog, useLiveDesk } from "@/lib/use-live-desk";
import { useLocale } from "@/lib/locale";
import { timeAgo } from "@/lib/utils";
import { CRON_STALE_MS } from "@/lib/engine/scan-schedule";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/always-on")({
  loader: () => getDesk(),
  component: Page,
});

const WORKER = `export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(pingDesk(env));
  },
  async fetch(_request, env) {
    const result = await pingDesk(env);
    return new Response(JSON.stringify(result, null, 2), {
      status: result.ok ? 200 : 502,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  },
};

async function pingDesk(env, attempt) {
  attempt = attempt || 0;
  const base = String(env.DESK_URL || "").replace(/\\/$/, "");
  const token = String(env.DESK_TOKEN || "");
  if (!base || !token) return { ok: false, error: "DESK_URL and DESK_TOKEN must be set" };
  const url = base + "/api/tick";
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-cron-source": "cloudflare",
        authorization: "Bearer " + token,
      },
      signal: AbortSignal.timeout(55000),
    });
    const text = await res.text();
    let body = text;
    try { body = JSON.parse(text); } catch {}
    if (!res.ok && attempt < 2 && res.status >= 500) {
      await new Promise(function (r) { setTimeout(r, 1200 * (attempt + 1)); });
      return pingDesk(env, attempt + 1);
    }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    if (attempt < 2) {
      await new Promise(function (r) { setTimeout(r, 1200 * (attempt + 1)); });
      return pingDesk(env, attempt + 1);
    }
    return { ok: false, error: String(err) };
  }
}
`;

function Page() {
  const data = Route.useLoaderData();
  const { locale } = useLocale();
  const router = useRouter();
  const unlocked = data.lock.unlocked;
  useLiveDesk(15000);
  useCronWatchdog({ enabled: unlocked, lastTickAt: data.settings.lastTickAt });
  const token = unlocked ? data.settings.tickToken : "";
  const [origin, setOrigin] = useState("");
  const [busy, setBusy] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fa = locale === "fa";

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const deskUrl = origin || "https://YOUR-APP.grok.me";
  const stale =
    !data.settings.lastTickAt || Date.now() - new Date(data.settings.lastTickAt).getTime() > CRON_STALE_MS;
  const cronAlive = Boolean(data.settings.lastTickAt) && !stale;
  const fromCron =
    data.settings.lastTickSource === "cloudflare" ||
    data.settings.lastTickSource === "vercel" ||
    data.settings.lastTickSource === "cron" ||
    data.settings.lastTickSource === "backup" ||
    data.settings.lastTickSource === "watchdog";

  const wrangler = useMemo(
    () => `name = "apex-desk-cron"
main = "worker.js"
compatibility_date = "2026-08-01"

[triggers]
crons = ["* * * * *"]

[vars]
DESK_URL = "${deskUrl}"
# Put DESK_TOKEN as a secret, not plaintext:
# wrangler secret put DESK_TOKEN`,
    [deskUrl],
  );

  async function testTick() {
    setBusy(true);
    setErr(null);
    try {
      await tickNow({ data: {} });
      await router.invalidate({ sync: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "tick failed");
    } finally {
      setBusy(false);
    }
  }

  async function rotate() {
    if (
      !window.confirm(
        fa ? "توکن عوض شود؟ کرون کلادفلر را هم باید به‌روز کنی." : "Rotate token? Update Cloudflare DESK_TOKEN too.",
      )
    ) {
      return;
    }
    setRotating(true);
    setErr(null);
    try {
      await rotateDeskToken();
      await router.invalidate({ sync: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "rotate failed");
    } finally {
      setRotating(false);
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
      <h1 className="font-display text-3xl tracking-tight">{fa ? "همیشه روشن" : "Always on"}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        {fa
          ? `اسکن دستی لازم نیست. کرون هر دقیقه پینگ می‌زند. جهان ارز از لیست همان صرافی است و فقط آخرین کندل بسته‌شدهٔ چارت همان صرافی معامله می‌شود؛ اگر اسکن در همان دقیقه تمام نشود، دقیقه بعد ادامه می‌دهد — کندل قبلی و کندل باز هرگز. قفل تیک + یکتایی ارز/تایم/اندیکاتور/کندل جلوی سفارش تکراری را می‌گیرد.`
          : `You do not need to click Scan. Cron pings every minute. The universe is that venue's listed perps and only the just-closed bar on that venue's chart is traded; if the sweep does not finish in that minute, the next tick continues — never the forming candle, never another book. A tick lock plus unique (coin, TF, indicator, candle) blocks duplicate fills.`}
      </p>

      <div className="mt-6">
        <LockPanel hasPin={data.lock.hasPin} unlocked={unlocked} />
      </div>
      {err ? <p className="mt-3 text-sm text-short">{err}</p> : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4 shadow-panel">
          <div className="text-xs text-subtle">{fa ? "دیتابیس" : "Database"}</div>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone={data.settings.durable ? "long" : "warn"}>
              {data.settings.durable ? (fa ? "Neon پایدار" : "Neon durable") : fa ? "پیش‌نمایش" : "preview"}
            </Badge>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {data.settings.durable
              ? fa
                ? "بعد از Publish همه چیز روی Neon است."
                : "After Publish, everything lives on Neon."
              : data.settings.serverless
                ? fa
                  ? "Vercel فایل نمی‌نویسد. بدون DATABASE_URL (Neon) کلید و توکن و پوزیشن با هر درخواست پاک می‌شود. در تنظیمات پروژه Vercel همان URL را بگذار."
                  : "Vercel cannot write files. Without DATABASE_URL (Neon) keys, token, and positions vanish on every request. Set it in the Vercel project env."
                : fa
                  ? "این پیش‌نمایش محلی است. برای کار روی هر سیستم Publish کن."
                  : "Preview storage. Publish so every device sees the same desk."}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 shadow-panel">
          <div className="text-xs text-subtle">{fa ? "کرون ۲۴ساعته" : "24h cron"}</div>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone={cronAlive && fromCron ? "long" : cronAlive ? "warn" : "short"}>
              {cronAlive && fromCron ? (fa ? "فعال از کلاد" : "cloud alive") : cronAlive ? (fa ? "تیک دستی" : "manual tick") : fa ? "منتظر کرون" : "waiting"}
            </Badge>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {fa
              ? "کرون باید هر دقیقه بزند (* * * * *). تیک‌های بین‌کندلی پوزیشن‌ها را مدیریت می‌کنند و اسکن را روی آخرین کلوز ادامه می‌دهند. اگر کلادفلر ۱–۲ دقیقه دیر کرد، تیک بعدی همان کندل تازه را می‌گیرد — نه کندل قدیمی. پینگ دوم رایگان: cron-job.org هر ۱ دقیقه."
              : "Cron must fire every minute (* * * * *). In-between ticks manage open positions and finish the sweep on the just-closed bar. If Cloudflare slips 1–2 minutes, the next ping still takes that fresh close — never the previous candle. Free backup: cron-job.org every 1 minute."}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 shadow-panel">
          <div className="text-xs text-subtle">{fa ? "ربات" : "Bot"}</div>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone={data.settings.botEnabled ? "long" : "muted"}>
              {data.settings.botEnabled ? (fa ? "روشن" : "on") : fa ? "خاموش" : "off"}
            </Badge>
            <Badge tone={data.settings.mode === "live" ? "short" : "fg"}>
              {data.settings.mode === "live" ? (fa ? "واقعی" : "live") : fa ? "کاغذی" : "paper"}
            </Badge>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {fa
              ? "کاغذی بدون کلید ۲۴ساعته اسکن می‌شود. زنده: کلید را Test کن، بعد Live را خودت روشن کن. کرون خودش سفارش می‌فرستد."
              : "Paper scans 24h with no keys. Live: Test keys on Venues, then turn Live on yourself. Cron sends the order — no extra click."}
          </p>
        </div>
      </div>

      <ol className="mt-6 grid gap-4">
        <li className="rounded-lg border border-border bg-surface p-4 shadow-panel">
          <div className="text-xs text-subtle">01</div>
          <h2 className="mt-1 font-medium">{fa ? "میز را Publish کن" : "Publish the desk"}</h2>
          <p className="mt-1 text-sm text-muted">
            {fa
              ? "Publish دیتابیس Neon را وصل می‌کند. بعد آدرس عمومی را در کلادفلر بگذار."
              : "Publish attaches Neon. Then put the public URL in Cloudflare."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="block min-w-0 flex-1 overflow-x-auto rounded-sm bg-bg-elev p-3 font-mono text-xs">{deskUrl}</code>
            <CopyBtn text={deskUrl} label={fa ? "کپی آدرس" : "Copy URL"} />
          </div>
        </li>
        <li className="rounded-lg border border-border bg-surface p-4 shadow-panel">
          <div className="text-xs text-subtle">02</div>
          <h2 className="mt-1 font-medium">{fa ? "Worker رایگان در Cloudflare" : "Free Cloudflare worker"}</h2>
          <p className="mt-1 text-sm text-muted">
            {fa
              ? "dash.cloudflare.com → Workers → Create. کد را paste کن. Triggers را روی * * * * * بگذار. DESK_TOKEN را به‌صورت Secret بگذار، نه متغیر معمولی."
              : "dash.cloudflare.com → Workers → Create. Paste the worker. Cron * * * * *. Store DESK_TOKEN as a Secret, not a plain var."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyBtn text={WORKER} label={fa ? "کپی Worker" : "Copy worker"} />
            <CopyBtn text={wrangler} label="wrangler.toml" />
          </div>
          <pre className="mt-3 max-h-56 overflow-auto rounded-sm bg-bg-elev p-3 font-mono text-xs text-fg">{WORKER}</pre>
        </li>
        <li className="rounded-lg border border-border bg-surface p-4 shadow-panel">
          <div className="text-xs text-subtle">03</div>
          <h2 className="mt-1 font-medium">{fa ? "متغیرهای Worker" : "Worker variables"}</h2>
          <p className="mt-1 text-sm text-muted">
            {fa
              ? "توکن فقط وقتی عوض می‌شود که خودت روی «تعویض توکن» بزنی. ریست سرور، کرون، یا ذخیرهٔ تنظیمات آن را عوض نمی‌کند."
              : "This token never changes unless you click Rotate token. Restarts, cron, and saving settings do not touch it."}{" "}
            {unlocked
              ? fa
                ? "بعد از تعویض، DESK_TOKEN کلادفلر را هم عوض کن."
                : "After Rotate, update Cloudflare DESK_TOKEN too."
              : fa
                ? "برای دیدن مقدار توکن، پین را باز کن."
                : "Unlock the PIN to see the token value."}
          </p>
          {data.settings.tokenIsDefault ? (
            <p className="mt-2 rounded-sm border border-warn/40 bg-bg-elev p-2 text-xs text-muted">
              {fa
                ? "هنوز توکن اختصاصی نساختی. یک‌بار «تعویض توکن» را بزن و همان را در کلادفلر بگذار. از آن به بعد خودش عوض نمی‌شود."
                : "No dedicated token yet. Click Rotate token once and put that value in Cloudflare. After that it will not change by itself."}
            </p>
          ) : null}
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex flex-wrap items-center gap-2 rounded-sm bg-bg-elev p-3">
              <span className="font-mono text-xs text-subtle">DESK_URL</span>
              <code className="min-w-0 flex-1 overflow-x-auto font-mono text-xs">{deskUrl}</code>
              <CopyBtn text={deskUrl} />
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-sm bg-bg-elev p-3">
              <span className="font-mono text-xs text-subtle">DESK_TOKEN</span>
              <code className="min-w-0 flex-1 overflow-x-auto font-mono text-xs">
                {unlocked ? token : fa ? "—— قفل —— " : "—— locked ——"}
              </code>
              {unlocked ? <CopyBtn text={token} /> : null}
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={testTick} disabled={busy || (data.lock.hasPin && !unlocked)}>
              {busy ? "…" : fa ? "تست تیک همین حالا" : "Test tick now"}
            </Button>
            <Button variant="outline" onClick={rotate} disabled={rotating || !unlocked}>
              {rotating ? "…" : fa ? "تعویض توکن" : "Rotate token"}
            </Button>
          </div>
        </li>
        <li className="rounded-lg border border-border bg-surface p-4 shadow-panel">
          <div className="text-xs text-subtle">04</div>
          <h2 className="mt-1 font-medium">{fa ? "پشتیبان رایگان اگر کلادفلر دیر کرد" : "Free backup if Cloudflare is late"}</h2>
          <p className="mt-1 text-sm text-muted">
            {fa
              ? "برو cron-job.org (رایگان) → Create cronjob. هر ۱ دقیقه GET بزن به این آدرس. هدر Authorization را Bearer توکن بگذار و x-cron-source را backup. توکن را در URL نگذار. این دومین تایمر است؛ با کلادفلر تداخل بد ندارد."
              : "Go to cron-job.org (free) → Create cronjob. GET this URL every 1 minute. Set header Authorization = Bearer TOKEN and x-cron-source = backup. Never put the token in the URL. Second timer; overlapping pings are ignored."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="block min-w-0 flex-1 overflow-x-auto rounded-sm bg-bg-elev p-3 font-mono text-xs">
              {`${deskUrl}/api/tick`}
            </code>
            <CopyBtn text={`${deskUrl}/api/tick`} label={fa ? "کپی URL" : "Copy URL"} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="block min-w-0 flex-1 overflow-x-auto rounded-sm bg-bg-elev p-3 font-mono text-xs">
              {unlocked && token
                ? `Authorization: Bearer ${token}`
                : `Authorization: Bearer ${fa ? "—— قفل —— " : "—— locked ——"}`}
            </code>
            {unlocked && token ? (
              <CopyBtn text={`Bearer ${token}`} label={fa ? "کپی هدر" : "Copy header"} />
            ) : null}
          </div>
        </li>
      </ol>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">Scan log</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {data.scans.map((c, i) => (
            <li key={i} className="flex flex-wrap justify-between gap-2 border-b border-border/60 py-2 font-mono text-xs">
              <span className="text-subtle">{timeAgo(c.ts, locale)}</span>
              <span className="text-muted">{c.source || "manual"}</span>
              <span>
                {c.scanned} charts · {c.signals} sig · {c.opened} open · {c.closed} close · {c.duration_ms}ms
              </span>
              <span className="text-muted">{c.note}</span>
            </li>
          ))}
          {!data.scans.length ? (
            <li className="text-muted">{fa ? "هنوز تیکی نخورده." : "No ticks yet."}</li>
          ) : null}
        </ul>
      </div>
    </DeskShell>
  );
}
