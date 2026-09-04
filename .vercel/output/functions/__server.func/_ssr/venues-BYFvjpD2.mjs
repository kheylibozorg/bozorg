import { o as __toESM } from "../_runtime.mjs";
import { n as VENUE_META } from "./tick.server-RDv3OzT7.mjs";
import { B as require_react, b as require_jsx_runtime, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { g as useLocale, l as saveDeskSettings, p as testVenue } from "./functions-zXYqw9Df.mjs";
import { n as Route$1 } from "./router-CyiDPfjt.mjs";
import { f as usdToMillions, t as DeskShell, u as millionsToUsd } from "./shell-BOxIB2Hf.mjs";
import { t as Button } from "./button-Cl7s1nXS.mjs";
import { n as Label, r as Select, t as Input } from "./field-LgWUhHTe.mjs";
import { t as LockPanel } from "./lock-panel-C014QUAa.mjs";
import { t as Badge } from "./badge-QMmY5nv6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/venues-BYFvjpD2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Page() {
	const data = Route$1.useLoaderData();
	const { t, locale } = useLocale();
	const router = useRouter();
	const s = data.settings;
	const unlocked = data.lock.unlocked;
	const [mode, setMode] = (0, import_react.useState)(s.mode);
	const [venue, setVenue] = (0, import_react.useState)(s.venue);
	const [capital, setCapital] = (0, import_react.useState)(String(s.capitalPct ?? 10));
	const [maxPos, setMaxPos] = (0, import_react.useState)(String(s.maxPositions));
	const [equity, setEquity] = (0, import_react.useState)(String(s.equityUsd));
	const [batch, setBatch] = (0, import_react.useState)(String(s.scanBatch ?? 0));
	const [minCap, setMinCap] = (0, import_react.useState)(String(usdToMillions(s.minMarketCapUsd)));
	const [bot, setBot] = (0, import_react.useState)(s.botEnabled);
	const [live, setLive] = (0, import_react.useState)(s.liveEnabled);
	const [lighterKey, setLighterKey] = (0, import_react.useState)("");
	const [lighterPk, setLighterPk] = (0, import_react.useState)("");
	const [lighterIdx, setLighterIdx] = (0, import_react.useState)(s.lighterAccountIndex != null ? String(s.lighterAccountIndex) : "");
	const [lighterKeyIdx, setLighterKeyIdx] = (0, import_react.useState)(s.lighterKeyIndex != null ? String(s.lighterKeyIndex) : "2");
	const [asterKey, setAsterKey] = (0, import_react.useState)("");
	const [asterSec, setAsterSec] = (0, import_react.useState)("");
	const [toobitKey, setToobitKey] = (0, import_react.useState)("");
	const [toobitSec, setToobitSec] = (0, import_react.useState)("");
	const [hlPk, setHlPk] = (0, import_react.useState)("");
	const [hlAddr, setHlAddr] = (0, import_react.useState)("");
	const [msg, setMsg] = (0, import_react.useState)(null);
	const [err, setErr] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [testing, setTesting] = (0, import_react.useState)(null);
	const [testMsg, setTestMsg] = (0, import_react.useState)({});
	const fa = locale === "fa";
	(0, import_react.useEffect)(() => {
		setMode(s.mode);
		setVenue(s.venue);
		setCapital(String(s.capitalPct ?? 10));
		setMaxPos(String(s.maxPositions ?? 4));
		setEquity(String(s.equityUsd));
		setBatch(String(s.scanBatch ?? 0));
		setMinCap(String(usdToMillions(s.minMarketCapUsd)));
		setBot(s.botEnabled);
		setLive(s.liveEnabled);
	}, [
		s.mode,
		s.venue,
		s.capitalPct,
		s.maxPositions,
		s.equityUsd,
		s.scanBatch,
		s.minMarketCapUsd,
		s.botEnabled,
		s.liveEnabled
	]);
	async function save() {
		setBusy(true);
		setMsg(null);
		setErr(null);
		try {
			const saved = await saveDeskSettings({ data: {
				mode,
				venue,
				capital_pct: Math.min(100, Math.max(1, Number(capital) || 10)),
				max_positions: Math.min(20, Math.max(1, Math.round(Number(maxPos) || 4))),
				equity_usd: Number(equity),
				scan_batch: Math.min(250, Math.max(0, Math.round(Number(batch) || 0))),
				min_market_cap_usd: millionsToUsd(Number(minCap) || 0),
				bot_enabled: bot ? 1 : 0,
				live_enabled: live ? 1 : 0,
				lighter_api_key: lighterKey || void 0,
				lighter_api_private_key: lighterPk || void 0,
				lighter_account_index: lighterIdx ? Number(lighterIdx) : void 0,
				lighter_api_key_index: lighterKeyIdx ? Number(lighterKeyIdx) : void 0,
				aster_api_key: asterKey || void 0,
				aster_api_secret: asterSec || void 0,
				toobit_api_key: toobitKey || void 0,
				toobit_api_secret: toobitSec || void 0,
				hyperliquid_private_key: hlPk || void 0,
				hyperliquid_wallet_address: hlAddr || void 0
			} });
			setCapital(String(saved.capitalPct ?? capital));
			setMaxPos(String(saved.maxPositions ?? maxPos));
			setBatch(String(saved.scanBatch ?? batch));
			setMinCap(String(usdToMillions(saved.minMarketCapUsd)));
			setEquity(String(saved.equityUsd ?? equity));
			setMode(saved.mode);
			setVenue(saved.venue);
			setBot(saved.botEnabled);
			setLive(saved.liveEnabled);
			setLighterKey("");
			setLighterPk("");
			setAsterKey("");
			setAsterSec("");
			setToobitKey("");
			setToobitSec("");
			setHlPk("");
			setHlAddr("");
			setMsg(t.saved);
			await router.invalidate({ sync: true });
		} catch (e) {
			setErr(e instanceof Error ? e.message : "save failed");
		} finally {
			setBusy(false);
		}
	}
	async function ping(id) {
		setTesting(id);
		setErr(null);
		try {
			const payload = {
				venue: id,
				mode: "live",
				live_enabled: 1,
				bot_enabled: 1
			};
			if (id === "hyperliquid") {
				if (hlPk) payload.hyperliquid_private_key = hlPk;
				if (hlAddr) payload.hyperliquid_wallet_address = hlAddr;
			} else if (id === "lighter") {
				if (lighterKey) payload.lighter_api_key = lighterKey;
				if (lighterPk) payload.lighter_api_private_key = lighterPk;
				if (lighterIdx) payload.lighter_account_index = Number(lighterIdx);
				if (lighterKeyIdx) payload.lighter_api_key_index = Number(lighterKeyIdx);
			} else if (id === "aster") {
				if (asterKey) payload.aster_api_key = asterKey;
				if (asterSec) payload.aster_api_secret = asterSec;
			} else {
				if (toobitKey) payload.toobit_api_key = toobitKey;
				if (toobitSec) payload.toobit_api_secret = toobitSec;
			}
			await saveDeskSettings({ data: payload });
			setMode("live");
			setVenue(id);
			setLive(true);
			setBot(true);
			const res = await testVenue({ data: { venue: id } });
			setTestMsg((m) => ({
				...m,
				[id]: {
					ok: res.ok,
					text: res.message
				}
			}));
			if (res.ok) {
				setMsg(fa ? "وصل شد · زنده مسلح است · کرون خودش معامله می‌فرستد" : "Connected · live armed · cron will send orders");
				if (id === "hyperliquid") {
					setHlPk("");
					setHlAddr("");
				} else if (id === "lighter") {
					setLighterKey("");
					setLighterPk("");
				} else if (id === "aster") {
					setAsterKey("");
					setAsterSec("");
				} else {
					setToobitKey("");
					setToobitSec("");
				}
			}
			await router.invalidate({ sync: true });
		} catch (e) {
			setTestMsg((m) => ({
				...m,
				[id]: {
					ok: false,
					text: e instanceof Error ? e.message : "test failed"
				}
			}));
		} finally {
			setTesting(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DeskShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl tracking-tight",
			children: t.venues
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-2xl text-sm text-muted",
			children: t.keys
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-2xl text-sm text-muted",
			children: fa ? "بعد از Test سبز، ربات خودش تمام پرپچوال‌های لیست‌شدهٔ همان صرافی را می‌خواند و اسکن را روی چارت همان صرافی می‌زند — نه بایننس، نه کتاب صرافی قبلی." : "A green Test rebuilds the universe from that exchange's listed perps and scans that venue's own candles — not Binance, not the previous book."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockPanel, {
				hasPin: data.lock.hasPin,
				unlocked
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5",
			children: VENUE_META.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				disabled: !unlocked,
				onClick: () => {
					setVenue(v.id);
					if (v.id === "paper") {
						setMode("paper");
						setLive(false);
					} else {
						setMode("live");
						setLive(true);
						setBot(true);
					}
				},
				className: `rounded-lg border p-4 text-start shadow-panel transition-colors ${venue === v.id ? "border-accent bg-surface" : "border-border bg-bg-elev hover:border-border-strong"} disabled:opacity-50`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: v.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: v.kind === "sim" ? "fg" : v.kind === "dex" ? "long" : "warn",
						children: v.kind
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs leading-relaxed text-muted",
					children: fa ? v.blurbFa : v.blurbEn
				})]
			}, v.id))
		}),
		venue !== "paper" && mode === "live" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 rounded-lg border border-long/40 bg-long-dim/30 p-3 text-sm text-fg",
			children: fa ? "زنده: ورود مارکت است. TP و SL روی خود صرافی. کلید را بچسبان و Test بزن — اگر سبز شد همان لحظه مسلح می‌شود و کرون معامله می‌فرستد." : "Live: market entry. TP/SL on the venue. Paste keys and hit Test — a green ping arms live and cron sends the orders."
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-4 rounded-lg border border-border bg-surface p-4 shadow-panel sm:grid-cols-2 lg:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Mode" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: mode,
						disabled: !unlocked,
						onChange: (e) => {
							const next = e.target.value;
							setMode(next);
							if (next === "live" && venue === "paper") setVenue("hyperliquid");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "paper",
							children: t.paper
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "live",
							children: t.live
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: [t.capital, " %"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						step: "1",
						min: 1,
						max: 100,
						value: capital,
						disabled: !unlocked,
						onChange: (e) => setCapital(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t.maxPos }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						min: 1,
						max: 20,
						value: maxPos,
						disabled: !unlocked,
						onChange: (e) => setMaxPos(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: locale === "fa" ? "ارز در هر تیک (۰ = همه)" : "Coins per tick (0 = all)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						min: 0,
						max: 250,
						value: batch,
						disabled: !unlocked,
						onChange: (e) => setBatch(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: [
							t.minCap,
							" · ",
							locale === "fa" ? "میلیون دلار" : "USD millions"
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							min: 0,
							step: 1,
							value: minCap,
							disabled: !unlocked,
							onChange: (e) => setMinCap(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1",
							children: [
								{
									n: 0,
									label: t.minCapAll
								},
								{
									n: 100,
									label: "100"
								},
								{
									n: 300,
									label: "300"
								},
								{
									n: 800,
									label: "800"
								},
								{
									n: 1e3,
									label: "1B"
								}
							].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: !unlocked,
								onClick: () => setMinCap(String(p.n)),
								className: `min-h-8 rounded-sm border px-2 text-xs ${Number(minCap) === p.n ? "border-accent bg-surface-2 text-fg" : "border-border text-muted hover:border-border-strong"} disabled:opacity-40`,
								children: p.label
							}, p.n))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-subtle",
							children: t.minCapHint
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: [t.equity, " USD"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						value: equity,
						disabled: !unlocked,
						onChange: (e) => setEquity(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex h-11 items-center gap-2 self-end text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: bot,
						disabled: !unlocked,
						onChange: (e) => setBot(e.target.checked)
					}), t.botOn]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex h-11 items-center gap-2 self-end text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: live,
							disabled: !unlocked,
							onChange: (e) => setLive(e.target.checked)
						}),
						t.live,
						" enabled"
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-4 lg:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "rounded-lg border border-border bg-surface p-4",
					disabled: !unlocked,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "px-1 text-sm font-medium",
							children: "Hyperliquid"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mb-3 text-xs text-subtle",
							children: [s.hasHyperliquid ? s.hyperliquidKeyHint || "connected" : "not connected", s.hyperliquidAddrHint ? ` · ${s.hyperliquidAddrHint}` : ""]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Agent / API wallet private key",
								type: "password",
								value: hlPk,
								onChange: (e) => setHlPk(e.target.value)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Master wallet 0x… (required for agent keys)",
								value: hlAddr,
								onChange: (e) => setHlAddr(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								disabled: !unlocked || testing === "hyperliquid",
								onClick: () => ping("hyperliquid"),
								children: testing === "hyperliquid" ? "…" : "Test"
							}), testMsg.hyperliquid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `text-xs ${testMsg.hyperliquid.ok ? "text-long" : "text-short"}`,
								children: testMsg.hyperliquid.text
							}) : null]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "rounded-lg border border-border bg-surface p-4",
					disabled: !unlocked,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "px-1 text-sm font-medium",
							children: "Lighter"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mb-3 text-xs text-subtle",
							children: [
								s.lighterKeyHint || "not connected",
								" · account ",
								s.lighterAccountIndex ?? "—",
								" · key ",
								s.lighterKeyIndex ?? 2
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "L1 address",
									value: lighterKey,
									onChange: (e) => setLighterKey(e.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "API private key",
									type: "password",
									value: lighterPk,
									onChange: (e) => setLighterPk(e.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "Account index",
										value: lighterIdx,
										onChange: (e) => setLighterIdx(e.target.value)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "API key index (2)",
										value: lighterKeyIdx,
										onChange: (e) => setLighterKeyIdx(e.target.value)
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								disabled: !unlocked || testing === "lighter",
								onClick: () => ping("lighter"),
								children: testing === "lighter" ? "…" : "Test"
							}), testMsg.lighter ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `text-xs ${testMsg.lighter.ok ? "text-long" : "text-short"}`,
								children: testMsg.lighter.text
							}) : null]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "rounded-lg border border-border bg-surface p-4",
					disabled: !unlocked,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "px-1 text-sm font-medium",
							children: "Aster"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-3 text-xs text-subtle",
							children: s.asterKeyHint || "not connected"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "API key",
								value: asterKey,
								onChange: (e) => setAsterKey(e.target.value)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "API secret",
								type: "password",
								value: asterSec,
								onChange: (e) => setAsterSec(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								disabled: !unlocked || testing === "aster",
								onClick: () => ping("aster"),
								children: testing === "aster" ? "…" : "Test"
							}), testMsg.aster ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `text-xs ${testMsg.aster.ok ? "text-long" : "text-short"}`,
								children: testMsg.aster.text
							}) : null]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "rounded-lg border border-border bg-surface p-4",
					disabled: !unlocked,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "px-1 text-sm font-medium",
							children: "Toobit"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-3 text-xs text-subtle",
							children: s.toobitKeyHint || "not connected"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "API key",
								value: toobitKey,
								onChange: (e) => setToobitKey(e.target.value)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "API secret",
								type: "password",
								value: toobitSec,
								onChange: (e) => setToobitSec(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								disabled: !unlocked || testing === "toobit",
								onClick: () => ping("toobit"),
								children: testing === "toobit" ? "…" : "Test"
							}), testMsg.toobit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `text-xs ${testMsg.toobit.ok ? "text-long" : "text-short"}`,
								children: testMsg.toobit.text
							}) : null]
						})
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex items-center gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: save,
					disabled: busy || !unlocked,
					children: t.save
				}),
				msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm text-long",
					children: msg
				}) : null,
				err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm text-short",
					children: err
				}) : null
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 max-w-2xl text-xs text-subtle",
			children: fa ? "لوریج دستی نیست. برای هر ارز بالاترین سقف همان صرافی گرفته می‌شود؛ اگر بالای ۲۰۰ بود همان ۲۰۰ ست می‌شود. درصد سرمایه از میز، مارجین است. کلید را Save یا Test کن تا زنده بدون کار اضافه مسلح شود." : "Leverage is not manual. Each coin uses that venue's highest cap, hard-capped at 200x. Capital % is margin. Save or Test keys and live arms without extra steps."
		})
	] });
}
//#endregion
export { Page as component };
