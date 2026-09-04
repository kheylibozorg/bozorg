import { o as __toESM } from "../_runtime.mjs";
import "./tick.server-RDv3OzT7.mjs";
import { B as require_react, b as require_jsx_runtime, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as rotateDeskToken, g as useLocale, m as tickNow } from "./functions-zXYqw9Df.mjs";
import { s as Route$7 } from "./router-CyiDPfjt.mjs";
import { d as timeAgo, t as DeskShell } from "./shell-BOxIB2Hf.mjs";
import { t as Button } from "./button-Cl7s1nXS.mjs";
import { t as LockPanel } from "./lock-panel-C014QUAa.mjs";
import { t as Badge } from "./badge-QMmY5nv6.mjs";
import { n as useCronWatchdog, r as useLiveDesk, t as StatusChip } from "./use-live-desk-COX79b8w.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/always-on-DtGSem0S.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CopyBtn({ text, label = "Copy" }) {
	const [done, setDone] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		type: "button",
		variant: "ghost",
		className: "h-11 shrink-0",
		onClick: async () => {
			try {
				await navigator.clipboard.writeText(text);
			} catch {
				const el = document.createElement("textarea");
				el.value = text;
				document.body.appendChild(el);
				el.select();
				document.execCommand("copy");
				el.remove();
			}
			setDone(true);
			window.setTimeout(() => setDone(false), 1600);
		},
		children: done ? "Copied" : label
	});
}
var WORKER = `export default {
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
  const url = base + "/api/tick?token=" + encodeURIComponent(token);
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
	const data = Route$7.useLoaderData();
	const { locale } = useLocale();
	const router = useRouter();
	const unlocked = data.lock.unlocked;
	useLiveDesk(15e3);
	useCronWatchdog({
		enabled: unlocked,
		lastTickAt: data.settings.lastTickAt
	});
	const token = unlocked ? data.settings.tickToken : "";
	const [origin, setOrigin] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [rotating, setRotating] = (0, import_react.useState)(false);
	const [err, setErr] = (0, import_react.useState)(null);
	const fa = locale === "fa";
	(0, import_react.useEffect)(() => {
		setOrigin(window.location.origin);
	}, []);
	const deskUrl = origin || "https://YOUR-APP.grok.me";
	const stale = !data.settings.lastTickAt || Date.now() - new Date(data.settings.lastTickAt).getTime() > 9e4;
	const cronAlive = Boolean(data.settings.lastTickAt) && !stale;
	const fromCron = data.settings.lastTickSource === "cloudflare" || data.settings.lastTickSource === "vercel" || data.settings.lastTickSource === "cron" || data.settings.lastTickSource === "backup" || data.settings.lastTickSource === "watchdog";
	const wrangler = (0, import_react.useMemo)(() => `name = "apex-desk-cron"
main = "worker.js"
compatibility_date = "2026-08-01"

[triggers]
crons = ["* * * * *"]

[vars]
DESK_URL = "${deskUrl}"
# Put DESK_TOKEN as a secret, not plaintext:
# wrangler secret put DESK_TOKEN`, [deskUrl]);
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
		if (!window.confirm(fa ? "توکن عوض شود؟ کرون کلادفلر را هم باید به‌روز کنی." : "Rotate token? Update Cloudflare DESK_TOKEN too.")) return;
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DeskShell, {
		status: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusChip, {
			botEnabled: data.settings.botEnabled,
			mode: data.settings.mode,
			venue: data.settings.venue,
			lastTickAt: data.settings.lastTickAt,
			lastTickSource: data.settings.lastTickSource,
			durable: data.settings.durable
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl tracking-tight",
				children: fa ? "همیشه روشن" : "Always on"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-sm text-muted",
				children: fa ? `اسکن دستی لازم نیست. کرون هر دقیقه پینگ می‌زند. جهان ارز از لیست همان صرافی است و فقط آخرین کندل بسته‌شدهٔ چارت همان صرافی معامله می‌شود؛ اگر اسکن در همان دقیقه تمام نشود، دقیقه بعد ادامه می‌دهد — کندل قبلی و کندل باز هرگز. قفل تیک + یکتایی ارز/تایم/اندیکاتور/کندل جلوی سفارش تکراری را می‌گیرد.` : `You do not need to click Scan. Cron pings every minute. The universe is that venue's listed perps and only the just-closed bar on that venue's chart is traded; if the sweep does not finish in that minute, the next tick continues — never the forming candle, never another book. A tick lock plus unique (coin, TF, indicator, candle) blocks duplicate fills.`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockPanel, {
					hasPin: data.lock.hasPin,
					unlocked
				})
			}),
			err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-short",
				children: err
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-surface p-4 shadow-panel",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-subtle",
								children: fa ? "دیتابیس" : "Database"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 flex items-center gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: data.settings.durable ? "long" : "warn",
									children: data.settings.durable ? fa ? "Neon پایدار" : "Neon durable" : fa ? "پیش‌نمایش" : "preview"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs leading-relaxed text-muted",
								children: data.settings.durable ? fa ? "بعد از Publish همه چیز روی Neon است." : "After Publish, everything lives on Neon." : data.settings.serverless ? fa ? "Vercel فایل نمی‌نویسد. بدون DATABASE_URL (Neon) کلید و توکن و پوزیشن با هر درخواست پاک می‌شود. در تنظیمات پروژه Vercel همان URL را بگذار." : "Vercel cannot write files. Without DATABASE_URL (Neon) keys, token, and positions vanish on every request. Set it in the Vercel project env." : fa ? "این پیش‌نمایش محلی است. برای کار روی هر سیستم Publish کن." : "Preview storage. Publish so every device sees the same desk."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-surface p-4 shadow-panel",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-subtle",
								children: fa ? "کرون ۲۴ساعته" : "24h cron"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 flex items-center gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: cronAlive && fromCron ? "long" : cronAlive ? "warn" : "short",
									children: cronAlive && fromCron ? fa ? "فعال از کلاد" : "cloud alive" : cronAlive ? fa ? "تیک دستی" : "manual tick" : fa ? "منتظر کرون" : "waiting"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs leading-relaxed text-muted",
								children: fa ? "کرون باید هر دقیقه بزند (* * * * *). تیک‌های بین‌کندلی پوزیشن‌ها را مدیریت می‌کنند و اسکن را روی آخرین کلوز ادامه می‌دهند. اگر کلادفلر ۱–۲ دقیقه دیر کرد، تیک بعدی همان کندل تازه را می‌گیرد — نه کندل قدیمی. پینگ دوم رایگان: cron-job.org هر ۱ دقیقه." : "Cron must fire every minute (* * * * *). In-between ticks manage open positions and finish the sweep on the just-closed bar. If Cloudflare slips 1–2 minutes, the next ping still takes that fresh close — never the previous candle. Free backup: cron-job.org every 1 minute."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-surface p-4 shadow-panel",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-subtle",
								children: fa ? "ربات" : "Bot"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: data.settings.botEnabled ? "long" : "muted",
									children: data.settings.botEnabled ? fa ? "روشن" : "on" : fa ? "خاموش" : "off"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: data.settings.mode === "live" ? "short" : "fg",
									children: data.settings.mode === "live" ? fa ? "واقعی" : "live" : fa ? "کاغذی" : "paper"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs leading-relaxed text-muted",
								children: fa ? "کاغذی بدون کلید ۲۴ساعته اسکن می‌شود. زنده: کلید را در صرافی‌ها Test کن تا مسلح شود. کرون خودش سفارش می‌فرستد." : "Paper scans 24h with no keys. Live: Test keys on Venues to arm. Cron sends the order — no extra click."
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "mt-6 grid gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-lg border border-border bg-surface p-4 shadow-panel",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-subtle",
								children: "01"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 font-medium",
								children: fa ? "میز را Publish کن" : "Publish the desk"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: fa ? "Publish دیتابیس Neon را وصل می‌کند. بعد آدرس عمومی را در کلادفلر بگذار." : "Publish attaches Neon. Then put the public URL in Cloudflare."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "block min-w-0 flex-1 overflow-x-auto rounded-sm bg-bg-elev p-3 font-mono text-xs",
									children: deskUrl
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyBtn, {
									text: deskUrl,
									label: fa ? "کپی آدرس" : "Copy URL"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-lg border border-border bg-surface p-4 shadow-panel",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-subtle",
								children: "02"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 font-medium",
								children: fa ? "Worker رایگان در Cloudflare" : "Free Cloudflare worker"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: fa ? "dash.cloudflare.com → Workers → Create. کد را paste کن. Triggers را روی * * * * * بگذار. DESK_TOKEN را به‌صورت Secret بگذار، نه متغیر معمولی." : "dash.cloudflare.com → Workers → Create. Paste the worker. Cron * * * * *. Store DESK_TOKEN as a Secret, not a plain var."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyBtn, {
									text: WORKER,
									label: fa ? "کپی Worker" : "Copy worker"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyBtn, {
									text: wrangler,
									label: "wrangler.toml"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
								className: "mt-3 max-h-56 overflow-auto rounded-sm bg-bg-elev p-3 font-mono text-xs text-fg",
								children: WORKER
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-lg border border-border bg-surface p-4 shadow-panel",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-subtle",
								children: "03"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 font-medium",
								children: fa ? "متغیرهای Worker" : "Worker variables"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm text-muted",
								children: [
									fa ? "توکن فقط وقتی عوض می‌شود که خودت روی «تعویض توکن» بزنی. ریست سرور، کرون، یا ذخیرهٔ تنظیمات آن را عوض نمی‌کند." : "This token never changes unless you click Rotate token. Restarts, cron, and saving settings do not touch it.",
									" ",
									unlocked ? fa ? "بعد از تعویض، DESK_TOKEN کلادفلر را هم عوض کن." : "After Rotate, update Cloudflare DESK_TOKEN too." : fa ? "برای دیدن مقدار توکن، پین را باز کن." : "Unlock the PIN to see the token value."
								]
							}),
							data.settings.tokenIsDefault ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 rounded-sm border border-warn/40 bg-bg-elev p-2 text-xs text-muted",
								children: fa ? "هنوز توکن اختصاصی نساختی. یک‌بار «تعویض توکن» را بزن و همان را در کلادفلر بگذار. از آن به بعد خودش عوض نمی‌شود." : "No dedicated token yet. Click Rotate token once and put that value in Cloudflare. After that it will not change by itself."
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "mt-3 grid gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2 rounded-sm bg-bg-elev p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-xs text-subtle",
											children: "DESK_URL"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "min-w-0 flex-1 overflow-x-auto font-mono text-xs",
											children: deskUrl
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyBtn, { text: deskUrl })
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2 rounded-sm bg-bg-elev p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-xs text-subtle",
											children: "DESK_TOKEN"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "min-w-0 flex-1 overflow-x-auto font-mono text-xs",
											children: unlocked ? token : fa ? "—— قفل —— " : "—— locked ——"
										}),
										unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyBtn, { text: token }) : null
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: testTick,
									disabled: busy || data.lock.hasPin && !unlocked,
									children: busy ? "…" : fa ? "تست تیک همین حالا" : "Test tick now"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: rotate,
									disabled: rotating || !unlocked,
									children: rotating ? "…" : fa ? "تعویض توکن" : "Rotate token"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-lg border border-border bg-surface p-4 shadow-panel",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-subtle",
								children: "04"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 font-medium",
								children: fa ? "پشتیبان رایگان اگر کلادفلر دیر کرد" : "Free backup if Cloudflare is late"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: fa ? "برو cron-job.org (رایگان) → Create cronjob. هر ۱ دقیقه GET بزن به این آدرس. هدر x-cron-source را backup بگذار. این دومین تایمر است؛ با کلادفلر تداخل بد ندارد." : "Go to cron-job.org (free) → Create cronjob. GET this URL every 1 minute. Set header x-cron-source = backup. Second timer; overlapping pings are ignored."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "block min-w-0 flex-1 overflow-x-auto rounded-sm bg-bg-elev p-3 font-mono text-xs",
									children: unlocked && token ? `${deskUrl}/api/tick?token=${token}` : `${deskUrl}/api/tick?token=${fa ? "—— قفل —— " : "—— locked ——"}`
								}), unlocked && token ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyBtn, {
									text: `${deskUrl}/api/tick?token=${token}`,
									label: fa ? "کپی URL" : "Copy URL"
								}) : null]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 rounded-lg border border-border bg-surface p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Scan log"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-3 grid gap-2 text-sm",
					children: [data.scans.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-wrap justify-between gap-2 border-b border-border/60 py-2 font-mono text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-subtle",
								children: timeAgo(c.ts, locale)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: c.source || "manual"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								c.scanned,
								" charts · ",
								c.signals,
								" sig · ",
								c.opened,
								" open · ",
								c.closed,
								" close · ",
								c.duration_ms,
								"ms"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: c.note
							})
						]
					}, i)), !data.scans.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-muted",
						children: fa ? "هنوز تیکی نخورده." : "No ticks yet."
					}) : null]
				})]
			})
		]
	});
}
//#endregion
export { Page as component };
