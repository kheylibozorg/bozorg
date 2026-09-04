import { o as __toESM } from "../_runtime.mjs";
import { o as indicatorLabel } from "./types-BFJLnIEL.mjs";
import { B as require_react, b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as probeBtc, g as useLocale } from "./functions-zXYqw9Df.mjs";
import { o as fmtPx, r as fmtBarOpen, t as DeskShell } from "./shell-BOxIB2Hf.mjs";
import { t as Button } from "./button-Cl7s1nXS.mjs";
import { t as Badge } from "./badge-QMmY5nv6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/audit-rVuVvw2c.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Card({ n, title, tone, toneLabel, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-lg border border-border bg-surface p-5 shadow-panel",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-xs text-subtle",
					children: n
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl tracking-tight",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: tone === "ok" ? "long" : tone === "no" ? "short" : "warn",
					children: toneLabel
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 grid gap-3 text-sm leading-relaxed text-muted",
			children
		})]
	});
}
function ProbePanel({ fa }) {
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [err, setErr] = (0, import_react.useState)(null);
	const [data, setData] = (0, import_react.useState)(null);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					onClick: run,
					disabled: busy,
					children: busy ? fa ? "در حال اجرای موتور…" : "Running engines…" : fa ? "پروب زنده BTC 15m" : "Live BTC 15m probe"
				}), data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono text-xs text-subtle",
					dir: "ltr",
					children: [
						data.symbol,
						" · ",
						data.bars,
						" bars · last ",
						fmtBarOpen(data.lastBar)
					]
				}) : null]
			}),
			err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-short",
				children: err
			}) : null,
			data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto rounded-sm border border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[520px] text-left text-sm",
					dir: "ltr",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-bg-elev text-xs uppercase tracking-wide text-subtle",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Engine"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Fills"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Bias"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Armed"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Last fill"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.engines.map((e) => {
						const last = e.last[e.last.length - 1];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-fg",
									children: indicatorLabel(e.name)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 font-mono tabular",
									children: e.count
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: e.lastBias
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: e.armed ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-xs",
									children: last ? `${last.side} @ ${fmtPx(last.entry)} · ${fmtBarOpen(last.barTime)}` : "—"
								})
							]
						}, e.name);
					}) })]
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: fa ? "کندل‌های بسته‌شدهٔ بیت‌کوین از بایننس/استر می‌آید و هر ۹ موتور روی همان سری اجرا می‌شود. اگر جدول پر شود، موتور عملیاتی است." : "Closed BTC perps candles from Binance/Aster, then all nine engines on the same series. A filled table means the engines are operational." })
		]
	});
}
function Page() {
	const { locale } = useLocale();
	const fa = locale === "fa";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DeskShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl tracking-tight",
			children: fa ? "ممیزی ربات" : "Bot audit"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-2xl text-sm text-muted",
			children: fa ? "سه سؤال تو، با مقایسهٔ خط‌به‌خط با اسکریپت‌های Pine که فرستادی. یک باگ اجرایی پیدا و همین‌جا درست شد." : "Your three questions, after a line-by-line compare with the Pine scripts you sent. One execution bug was found and fixed here."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					n: "01",
					title: fa ? "باگ دارد؟" : "Are there bugs?",
					tone: "note",
					toneLabel: fa ? "یکی بود — درست شد" : "One was — now fixed",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: fa ? "موتور سیگنال تمیز است. باگ در مدیریت پوزیشن بعد از ورود بود، نه در خود اندیکاتور." : "The signal engines are clean. The bug was in post-entry management, not in the indicators." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "grid list-disc gap-1 ps-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "قبل: هر تیک فقط آخرین کندل ۵دقیقه‌ای را برای SL/TP می‌دید. اگر استاپ بین دو تیک روی کندل قبلی خورده بود و کندل آخر دیگر به آن نمی‌رسید، پوزیشن کاغذی باز می‌ماند. الان همهٔ کندل‌های بعد از ورود به‌ترتیب راه می‌روند." : "Before: each tick only inspected the latest 5m bar for SL/TP. A stop that wicked on an earlier bar between ticks was missed if the last bar never retagged it. Now every 5m bar after the fill is walked in order." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "ورود زنده مارکت است، نه لیمیت روی FTC — نسبت به فلش TradingView لغزش دارد. این محدودیت اجراست، نه باگ منطق." : "Live entries are market orders, not a limit at FTC — slippage versus the TradingView arrow. Execution limit, not a logic bug." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "اگر SL و TP در یک کندل هر دو بخورند، قرارداد لاب APEX است: استاپ برنده است. روی صرافی زنده ممکن است TP زودتر پر شود." : "If SL and TP both trade in one bar, the APEX lab contract awards the stop. A live venue may fill TP first." })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					n: "02",
					title: fa ? "منطق اندیکاتور درست پیاده شده؟" : "Is the indicator logic implemented correctly?",
					tone: "ok",
					toneLabel: fa ? "بله — پورت وفادار" : "Yes — faithful port",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: fa ? "نه موتور APEX، نه سه کویل HALCYON (Aegis / Vesper / Orion)، نه دو TREX، نه KETEX، نه SHETEX بازنویسی خلاقانه نیستند. اسکلت، گیت‌های قفل‌شده، و ترتیب مسلح→تگ همان Pine است." : "APEX, the three HALCYON coils (Aegis / Vesper / Orion), both TREX labs, KETEX and SHETEX are not creative rewrites. Skeleton, locked gates, and arm→tag order match Pine." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "grid list-disc gap-1 ps-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "APEX: کاور مستر/لانگ‌بار → پیوت زنده → تست دوم در باند ATR (minTests) → FTC → تگ بدون خوردن استاپ. تاچ اول عمداً رد می‌شود. گیت‌های ۵م/۱۵م/۱ساعت هر سه فایل 1R / 1.5R / 2R قفل‌اند (از جمله ۵م فقط شورت، widen استاپ، minVol)." : "APEX: master/longbar cover → live pivot → second test in the ATR band (minTests) → FTC → tag without the stop. First-touch skipped. 5m/15m/1h auto-gates from all three 1R / 1.5R / 2R files are locked (including 5m shorts-only, stop widen, minVol)." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "ATR سفارشی (۵+۱۰+۲۱×۲+۶۶×۳+۱۳۲×۵+۲۶۴×۸)/۲۰، last-third، room-to-pivot، HTF EMA21 و HTF2 ×۱۶ با lookahead_off، استک EMA21/84/200، DI، confirm close، کف استاپ — مطابق Pine." : "Custom ATR (5+10+21×2+66×3+132×5+264×8)/20, last-third, room-to-pivot, HTF EMA21 and HTF2 ×16 with lookahead_off, EMA21/84/200 stack, DI, confirm close, stop floor — match Pine." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "HALCYON: همان قفل فشرده. ۵م باکس ۱۵م را با request.security و lookahead_off فید می‌کند. گیت کیفیت فیل (fillCloseLoc / maxSlFrac / fillMinBody / poke / chop / minBoxPct) از شاخه‌های RR داخل Pine آمده." : "HALCYON: same compression lock. 5m fades a 15m box via request.security, lookahead_off. Fill quality gates (fillCloseLoc / maxSlFrac / fillMinBody / poke / chop / minBoxPct) follow the RR branches in Pine." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "TREX 1.0R و 1.2R: باند ۰.۷۰ ATR، HTF EMA50، کف استاپ/تارگت ۰.۵٪، BE@۰.۳۵ / ۰.۳۲. پارامترها دقیقاً همان دو فایل ۱۵م هستند." : "TREX 1.0R and 1.2R: 0.70 ATR band, HTF EMA50, 0.5% stop/target floors, BE@0.35 / 0.32. Parameters match the two 15m files exactly." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "KETEX ۲.۲R: همان اسکلت تست دوم TREX، با کیفیت NEXUS (HTF EMA21 ±۰.۳٪، رژیم EMA84، کلوز آن‌سوی FTC). اتاق حداقل ۲.۲R، انتظار ۸ کندل، کول‌داون ۵. بدون BE و بدون گیت جدا برای هر تایم — خانوادهٔ جدا از APEX لاب." : "KETEX 2.2R: TREX second-test skeleton with NEXUS quality (HTF EMA21 ±0.3%, EMA84 regime, close beyond FTC). Min room 2.2R, 8-bar wait, 5-bar cooldown. No BE and no per-TF auto-gates — its own family, not the APEX lab." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "SHETEX ۱.۸R: TREX Entries بومی ۴ساعته. تست دوم → تگ FTC بدون کلوز تأیید. HTF EMA50، اتاق ۱.۶R، انتظار ۸، کول‌داون ۵. بدون کف استاپ/تارگت و بدون BE — خانوادهٔ جدا از TREX1 / TREX12." : "SHETEX 1.8R: native 4H TREX Entries. Second-test → FTC tag with no confirm close. HTF EMA50, room 1.6R, 8-bar wait, 5-bar cooldown. No stop/target floors and no BE — own family, not TREX1 / TREX12." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "نکتهٔ وفاداری: لاب TREX روی ۱۵م قفل شده و Pine گیت جدا برای ۵م/۱ساعت ندارد. ربات همان پارامترها را روی هر چهار تایم‌فریم اسکن می‌کند — کار می‌کند، اما اعداد لاب فقط برای ۱۵م معتبرند." : "Fidelity note: TREX is a 15m lab and Pine has no per-TF auto-gates. The bot scans those same parameters on 5m/1h/4h — it runs, but the published stats are 15m-only." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "کویل HALC 2.2R (رنج اصلی) در فایل‌های پیوست نبود؛ از نسخهٔ قبلی میز مانده. Aegis/Vesper/Orion همان سه فایلی هستند که فرستادی." : "Original HALC 2.2R coil was not in the attached zip; it remains from the previous desk. Aegis/Vesper/Orion are the three files you sent." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "quirk وفادار: حلقه threeMasters وقتی مبدأ لگ عقب‌تر از کاور است اجرا نمی‌شود (مثل Pine). فیلتر واقعی همان طول لگ × ATR است." : "Faithful quirk: the threeMasters loop does not run when the leg origin is older than the cover bar (same as Pine). The real filter is still leg length × ATR." })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					n: "03",
					title: fa ? "عملیاتی هست؟" : "Is it operational?",
					tone: "ok",
					toneLabel: fa ? "کاغذی بله — زنده با کلید" : "Paper yes — live with keys",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: fa ? "بله. اسکنر روی کلوز بار، ژورنال، آنالیز فیل‌ها، SL/TP روی مسیر ۵دقیقه، و کرون به /api/tick یک حلقه کامل است. کاغذی بدون کلید با داده زنده پرپ کار می‌کند. زنده روی Hyperliquid / Lighter / Aster / Toobit سفارش می‌فرستد." : "Yes. Closed-bar scanner, journal, fill analysis, 5m path SL/TP, and cron hitting /api/tick are a complete loop. Paper needs no keys and still uses live perp data. Live sends orders on Hyperliquid / Lighter / Aster / Toobit." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "grid list-disc gap-1 ps-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "از دکمهٔ پایین برای پروب BTC 15m استفاده کن — اگر تعداد فیل‌ها عدد شد، موتور روی داده واقعی اجرا شده." : "Use the BTC 15m probe below — a numeric fill count means the engines ran on live candles." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									"پین اپراتور را از",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/venues",
										className: "text-long underline-offset-2 hover:underline",
										children: "صرافی‌ها"
									}),
									" ",
									"بگذار، وگرنه لینک میز همه تنظیمات را باز می‌گذارد."
								] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									"Set the operator PIN on",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/venues",
										className: "text-long underline-offset-2 hover:underline",
										children: "Venues"
									}),
									" ",
									"or the desk URL can change settings."
								] }) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: fa ? "بدون کلید واقعی نمی‌توان فیل زنده را اثبات کرد. دکمه Test فقط موجودی و امضا را چک می‌کند." : "A live fill cannot be proven without your keys. Test only checks balance and signing." })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProbePanel, { fa })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					n: "04",
					title: fa ? "TP و BE کجاست؟" : "Where are TP and BE?",
					tone: "ok",
					toneLabel: fa ? "فرمول مشخص" : "Exact formula",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "overflow-x-auto rounded-sm bg-bg-elev p-3 font-mono text-xs text-fg",
						dir: "ltr",
						children: `entry = FTC
slDist = |FTC − SL|
TP     = FTC ± R × slDist
APEX 1 / 1.5 / 2     R from profile
Aegis / Vesper / Orion  1.0 / 1.5 / 2.0
Coil HALC               2.2
TREX 1.0 / 1.2          then BE @ 0.35R / 0.32R → SL = entry
KETEX                   2.2 · no BE
SHETEX                  1.8 · no BE
same-bar SL+TP → SL`
					})
				})
			]
		})
	] });
}
//#endregion
export { Page as component };
