import { o as __toESM } from "../_runtime.mjs";
import { o as indicatorLabel } from "./types-BFJLnIEL.mjs";
import { B as require_react, b as require_jsx_runtime, v as Link, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as seedDeskJournal, g as useLocale, s as resetDeskJournal } from "./functions-D1fgtqih.mjs";
import { i as RotateCcw } from "../_libs/lucide-react.mjs";
import { o as Route$5 } from "./router-kf2Pjw6r.mjs";
import { a as fmtPct, c as fmtUsd, n as cn, o as fmtPx, s as fmtR, t as DeskShell } from "./shell-nfsQvvNB.mjs";
import { t as Button } from "./button-CcRDLENc.mjs";
import { n as Label, r as Select } from "./field-B2YuifSf.mjs";
import { t as Badge } from "./badge-CcZoPOMs.mjs";
import { r as useLiveDesk, t as StatusChip } from "./use-live-desk-CqPO2xoy.mjs";
import { t as Kpi } from "./tables-zfW_kLwj.mjs";
import { n as filterJournal, r as journalOptions } from "./journal-BM2UEAXn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/backtest-OJGPINfy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var R_HIST = [
	{
		key: "lt-2",
		lo: Number.NEGATIVE_INFINITY,
		hi: -2
	},
	{
		key: "-2--1",
		lo: -2,
		hi: -1
	},
	{
		key: "-1-0",
		lo: -1,
		hi: 0
	},
	{
		key: "0-0.3",
		lo: 0,
		hi: .3
	},
	{
		key: "0.3-1",
		lo: .3,
		hi: 1
	},
	{
		key: "1-2",
		lo: 1,
		hi: 2
	},
	{
		key: "gt2",
		lo: 2,
		hi: Number.POSITIVE_INFINITY
	}
];
var SCRATCH_R = .3;
var PROFIT_MFE = .35;
function num(v, d = 0) {
	const n = typeof v === "number" ? v : Number(v);
	return Number.isFinite(n) ? n : d;
}
function avg(xs) {
	return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function sliceOf(key, rows) {
	const n = rows.length;
	const wins = rows.filter((t) => t.pnlR > 0);
	const losses = rows.filter((t) => t.pnlR <= 0);
	const sl = rows.filter((t) => t.reason === "sl").length;
	const tp = rows.filter((t) => t.reason === "tp").length;
	const be = rows.filter((t) => t.reason === "be").length;
	const netR = rows.reduce((a, t) => a + t.pnlR, 0);
	const caps = rows.map((t) => t.capture).filter((v) => v != null);
	const scratchN = rows.filter((t) => t.scratch).length;
	const deadN = rows.filter((t) => t.pnlR < SCRATCH_R).length;
	return {
		key,
		n,
		wins: wins.length,
		losses: losses.length,
		sl,
		tp,
		be,
		wr: n ? 100 * wins.length / n : 0,
		netR,
		expectR: n ? netR / n : 0,
		avgWinR: avg(wins.map((t) => t.pnlR)),
		avgLossR: avg(losses.map((t) => t.pnlR)),
		avgMae: avg(rows.map((t) => t.maeR)),
		avgMfe: avg(rows.map((t) => t.mfeR)),
		avgCapture: avg(caps),
		avgHoldBars: avg(rows.map((t) => t.barsHeld)),
		slPct: n ? 100 * sl / n : 0,
		maxWinR: wins.reduce((a, t) => Math.max(a, t.pnlR), 0),
		maxLossR: losses.reduce((a, t) => Math.min(a, t.pnlR), 0),
		scratchN,
		deadN,
		deadPct: n ? 100 * deadN / n : 0
	};
}
function grouped(trades, keyOf) {
	const map = /* @__PURE__ */ new Map();
	for (const t of trades) {
		const key = keyOf(t);
		if (!key) continue;
		const list = map.get(key) ?? [];
		list.push(t);
		map.set(key, list);
	}
	return [...map.entries()].map(([k, rows]) => sliceOf(k, rows)).sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
}
function comboKey(t) {
	if (!t.indicator || !t.timeframe) return null;
	return `${t.indicator} · ${t.timeframe} · ${t.side}`;
}
function exitReason(raw, pnlR) {
	if (raw === "tp" || raw === "be" || raw === "sl") return raw;
	if (pnlR > .3) return "tp";
	if (Math.abs(pnlR) < .05) return "be";
	return "sl";
}
function journalToAnalyzed(rows) {
	return rows.filter((r) => r.status === "closed").map((r, i) => {
		const side = r.side === "short" ? "short" : "long";
		const pnlR = num(r.pnl_r);
		const pnl = num(r.pnl_usd);
		const entry = num(r.entry);
		const orig = num(r.orig_sl) || num(r.sl);
		const tp = num(r.tp);
		const exit = num(r.exit_px, entry);
		const maeR = num(r.mae_r);
		const mfeR = num(r.mfe_r);
		const reason = exitReason(r.exit_reason, pnlR);
		const dist = Math.abs(entry - orig);
		const plannedRr = num(r.rr_planned) || (dist > 0 ? Math.abs(tp - entry) / dist : 0);
		const capture = mfeR > .05 ? Math.max(0, pnlR) / mfeR : null;
		const opened = Date.parse(r.opened_at) || num(r.bar_time);
		const closed = r.closed_at ? Date.parse(r.closed_at) : opened;
		return {
			i,
			side,
			entry,
			sl: orig,
			tp,
			exit,
			reason,
			pnlR,
			pnl,
			maeR,
			mfeR,
			capture,
			givebackR: Math.max(0, mfeR - Math.max(pnlR, 0)),
			barsHeld: Math.max(1, num(r.bars_held, 1)),
			holdMs: num(r.hold_ms) || Math.max(0, closed - opened),
			plannedRr,
			entryWhy: r.signal_reason || r.indicator || "—",
			opened,
			closed,
			scratch: pnlR > 0 && pnlR < SCRATCH_R,
			noProfit: pnlR <= 0,
			stoppedFromProfit: reason !== "tp" && mfeR >= PROFIT_MFE && pnlR < PROFIT_MFE,
			missedTp: reason === "sl" && plannedRr > 0 && mfeR >= plannedRr * .85,
			indicator: r.indicator,
			timeframe: r.timeframe,
			symbol: r.symbol,
			mode: r.mode
		};
	});
}
function analyzeBacktest(trades, signalCount = 0) {
	const n = trades.length;
	const wins = trades.filter((t) => t.pnlR > 0);
	const losses = trades.filter((t) => t.pnlR <= 0);
	const slN = trades.filter((t) => t.reason === "sl").length;
	const tpN = trades.filter((t) => t.reason === "tp").length;
	const beN = trades.filter((t) => t.reason === "be").length;
	const netR = trades.reduce((a, t) => a + t.pnlR, 0);
	const caps = trades.map((t) => t.capture).filter((v) => v != null);
	const scratchN = trades.filter((t) => t.scratch).length;
	const noProfitN = trades.filter((t) => t.noProfit).length;
	const stoppedFromProfitN = trades.filter((t) => t.stoppedFromProfit).length;
	const missedTpN = trades.filter((t) => t.missedTp).length;
	const long = trades.filter((t) => t.side === "long");
	const short = trades.filter((t) => t.side === "short");
	const bySide = [long.length ? sliceOf("long", long) : null, short.length ? sliceOf("short", short) : null].filter((x) => Boolean(x));
	const byReason = [
		"sl",
		"tp",
		"be"
	].map((k) => sliceOf(k, trades.filter((t) => t.reason === k))).filter((s) => s.n > 0);
	const hist = R_HIST.map((h) => ({
		...h,
		n: 0
	}));
	for (const t of trades) {
		const bar = hist.find((h) => t.pnlR >= h.lo && t.pnlR < h.hi) ?? hist[hist.length - 1];
		if (bar) bar.n += 1;
	}
	const analysis = {
		n,
		signals: signalCount,
		slN,
		tpN,
		beN,
		slPct: n ? 100 * slN / n : 0,
		tpPct: n ? 100 * tpN / n : 0,
		wr: n ? 100 * wins.length / n : 0,
		netR,
		expectR: n ? netR / n : 0,
		avgWinR: avg(wins.map((t) => t.pnlR)),
		avgLossR: avg(losses.map((t) => t.pnlR)),
		avgMae: avg(trades.map((t) => t.maeR)),
		avgMfe: avg(trades.map((t) => t.mfeR)),
		avgCapture: avg(caps),
		avgHoldBars: avg(trades.map((t) => t.barsHeld)),
		scratchN,
		noProfitN,
		stoppedFromProfitN,
		missedTpN,
		bySide,
		byReason,
		byEntry: grouped(trades, (t) => t.entryWhy || "—"),
		byIndicator: grouped(trades, (t) => t.indicator || null),
		byTf: grouped(trades, (t) => t.timeframe || null),
		byCombo: grouped(trades, comboKey),
		byMode: grouped(trades, (t) => t.mode || null),
		hist,
		worstStops: trades.filter((t) => t.reason === "sl").slice().sort((a, b) => a.pnlR - b.pnlR).slice(0, 8),
		bestWins: trades.filter((t) => t.pnlR > 0).slice().sort((a, b) => b.pnlR - a.pnlR).slice(0, 8),
		scratches: trades.filter((t) => t.scratch || t.pnlR >= 0 && t.pnlR < SCRATCH_R).slice().sort((a, b) => a.pnlR - b.pnlR).slice(0, 8),
		givebacks: trades.filter((t) => t.stoppedFromProfit).slice().sort((a, b) => b.givebackR - a.givebackR).slice(0, 8),
		findings: [],
		all: trades
	};
	analysis.findings = buildFindings(analysis);
	return analysis;
}
function buildFindings(a) {
	const out = [];
	if (!a.n) {
		out.push({
			severity: "info",
			kind: "no_trades"
		});
		return out;
	}
	if (a.n < 8) out.push({
		severity: "warn",
		kind: "few_trades",
		n: a.n
	});
	const combos = a.byCombo.filter((s) => s.n >= 2);
	const slCombo = [...combos].sort((x, y) => y.slPct - x.slPct || y.n - x.n)[0];
	if (slCombo && slCombo.slPct >= 50) out.push({
		severity: slCombo.slPct >= 70 ? "bad" : "warn",
		kind: "combo_sl_heavy",
		extra: slCombo.key,
		n: slCombo.sl,
		pct: slCombo.slPct,
		r: slCombo.netR
	});
	const bestCombo = [...combos].sort((x, y) => y.netR - x.netR)[0];
	if (bestCombo && bestCombo.netR > 0) out.push({
		severity: "good",
		kind: "combo_strong",
		extra: bestCombo.key,
		n: bestCombo.n,
		r: bestCombo.netR,
		pct: bestCombo.wr
	});
	const weakCombo = [...combos].sort((x, y) => x.netR - y.netR)[0];
	if (weakCombo && weakCombo.netR < 0 && weakCombo.key !== bestCombo?.key) out.push({
		severity: "bad",
		kind: "combo_weak",
		extra: weakCombo.key,
		n: weakCombo.n,
		r: weakCombo.netR,
		pct: weakCombo.wr
	});
	const deadCombo = [...combos].sort((x, y) => y.deadPct - x.deadPct || y.deadN - x.deadN)[0];
	if (deadCombo && deadCombo.deadPct >= 50) out.push({
		severity: "warn",
		kind: "combo_dead",
		extra: deadCombo.key,
		n: deadCombo.deadN,
		pct: deadCombo.deadPct
	});
	const slHeavy = [...a.bySide].sort((x, y) => y.slPct - x.slPct)[0];
	if (slHeavy && slHeavy.n >= 3 && slHeavy.slPct >= 55) out.push({
		severity: slHeavy.slPct >= 70 ? "bad" : "warn",
		kind: "side_sl_heavy",
		side: slHeavy.key,
		n: slHeavy.sl,
		pct: slHeavy.slPct
	});
	const bestSide = [...a.bySide].sort((x, y) => y.netR - x.netR)[0];
	if (bestSide && bestSide.n >= 3 && bestSide.netR > 0) out.push({
		severity: "good",
		kind: "side_strong",
		side: bestSide.key,
		n: bestSide.n,
		r: bestSide.netR,
		pct: bestSide.wr
	});
	const weakSide = [...a.bySide].sort((x, y) => x.netR - y.netR)[0];
	if (weakSide && weakSide.n >= 3 && weakSide.netR < 0) out.push({
		severity: "bad",
		kind: "side_weak",
		side: weakSide.key,
		n: weakSide.n,
		r: weakSide.netR,
		pct: weakSide.wr
	});
	if (a.slPct >= 60) out.push({
		severity: "bad",
		kind: "sl_rate_high",
		pct: a.slPct,
		n: a.slN
	});
	if (a.n && a.scratchN / a.n >= .15) out.push({
		severity: "warn",
		kind: "scratch_heavy",
		n: a.scratchN,
		pct: 100 * a.scratchN / a.n
	});
	if (a.n && a.noProfitN / a.n >= .55) out.push({
		severity: "bad",
		kind: "tiny_profit",
		n: a.noProfitN,
		pct: 100 * a.noProfitN / a.n
	});
	if (a.n && a.stoppedFromProfitN / a.n >= .2) out.push({
		severity: "warn",
		kind: "giveback_heavy",
		n: a.stoppedFromProfitN,
		pct: 100 * a.stoppedFromProfitN / a.n
	});
	if (a.missedTpN >= 2) out.push({
		severity: "warn",
		kind: "missed_tp",
		n: a.missedTpN
	});
	if (a.avgCapture > 0 && a.avgCapture < .45) out.push({
		severity: "warn",
		kind: "capture_low",
		pct: 100 * a.avgCapture
	});
	if (a.expectR < 0) out.push({
		severity: "bad",
		kind: "expect_neg",
		r: a.expectR
	});
	else if (a.expectR >= .12) out.push({
		severity: "good",
		kind: "expect_pos",
		r: a.expectR
	});
	const worst = a.worstStops[0];
	if (worst) out.push({
		severity: "info",
		kind: "worst_stop",
		side: worst.side,
		r: worst.pnlR,
		extra: [
			worst.indicator,
			worst.timeframe,
			String(worst.entry)
		].filter(Boolean).join(" · ")
	});
	const best = a.bestWins[0];
	if (best) out.push({
		severity: "info",
		kind: "best_trade",
		side: best.side,
		r: best.pnlR,
		extra: [
			best.indicator,
			best.timeframe,
			String(best.entry)
		].filter(Boolean).join(" · ")
	});
	return out;
}
function Page() {
	const data = Route$5.useLoaderData();
	const { t, locale } = useLocale();
	const fa = locale === "fa";
	const router = useRouter();
	useLiveDesk(2e4);
	const [mode, setMode] = (0, import_react.useState)("all");
	const [indicator, setIndicator] = (0, import_react.useState)("all");
	const [timeframe, setTimeframe] = (0, import_react.useState)("all");
	const [side, setSide] = (0, import_react.useState)("all");
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [confirm, setConfirm] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [msg, setMsg] = (0, import_react.useState)(null);
	const closed = data.closed;
	const opts = (0, import_react.useMemo)(() => journalOptions(closed), [closed]);
	const filtered = (0, import_react.useMemo)(() => filterJournal(closed, {
		indicator,
		timeframe,
		side,
		mode
	}), [
		closed,
		indicator,
		timeframe,
		side,
		mode
	]);
	const analysis = (0, import_react.useMemo)(() => analyzeBacktest(journalToAnalyzed(filtered)), [filtered]);
	const rows = (0, import_react.useMemo)(() => {
		const all = analysis.all;
		if (filter === "all") return all;
		if (filter === "long" || filter === "short") return all.filter((x) => x.side === filter);
		if (filter === "sl" || filter === "tp" || filter === "be") return all.filter((x) => x.reason === filter);
		if (filter === "scratch") return all.filter((x) => x.scratch || x.pnlR >= 0 && x.pnlR < .3);
		return all.filter((x) => x.stoppedFromProfit);
	}, [analysis, filter]);
	const unlocked = data.lock.unlocked;
	const hasPin = data.lock.hasPin;
	const empty = !closed.length;
	async function reset(scope) {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskShell, {
		status: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusChip, {
			botEnabled: data.settings.botEnabled,
			mode: data.settings.mode,
			venue: data.settings.venue,
			lastTickAt: data.settings.lastTickAt,
			lastTickSource: data.settings.lastTickSource,
			durable: data.settings.durable
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-w-0 flex-col gap-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-3xl tracking-tight",
							children: t.backtest
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-3xl text-sm text-muted",
							children: fa ? "همه معاملات کاغذی و واقعی، دسته‌به‌دسته: اندیکاتور، تایم‌فریم، لانگ/شورت، نحوه ورود. کدام استاپ می‌خورد، کدام سود می‌دهد، کدام تقریباً هیچ." : "Every paper and live fill, batched by engine, timeframe, side and entry. Which stops out, which pays, which barely does."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: loadSample,
							disabled: busy,
							children: t.loadSample
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "danger",
							onClick: () => setConfirm(confirm ? null : "closed"),
							disabled: busy,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
								className: "size-4",
								strokeWidth: 1.75
							}), t.resetJournal]
						})]
					})]
				}),
				confirm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-lg border border-short/40 bg-short-dim/25 p-4",
					children: hasPin && !unlocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-fg",
						children: [
							t.lockedReset,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/venues",
								className: "text-long underline-offset-2 hover:underline",
								children: t.venues
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-fg",
								children: t.confirmReset
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-3 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									disabled: busy,
									onClick: () => setConfirm("closed"),
									className: cn("rounded-sm border p-3 text-start text-sm", confirm === "closed" ? "border-short bg-surface" : "border-border bg-bg-elev"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-medium",
										children: t.resetClosed
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-muted",
										children: t.resetClosedHint
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									disabled: busy,
									onClick: () => setConfirm("paper"),
									className: cn("rounded-sm border p-3 text-start text-sm", confirm === "paper" ? "border-short bg-surface" : "border-border bg-bg-elev"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-medium",
										children: t.resetPaper
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-muted",
										children: t.resetPaperHint
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "danger",
									disabled: busy,
									onClick: () => reset(confirm),
									children: busy ? "…" : confirm === "paper" ? t.confirmPaperBtn : t.confirmClosedBtn
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									disabled: busy,
									onClick: () => setConfirm(null),
									children: t.cancel
								})]
							})
						]
					})
				}) : null,
				msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: msg
				}) : null,
				empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-lg border border-border bg-surface p-8 shadow-panel",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl tracking-tight",
						children: fa ? "هنوز معامله‌ای نیست" : "No fills yet"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm text-muted",
						children: fa ? "بعد از فیل‌های کاغذی یا واقعی، آنالیز اینجا ساخته می‌شود. برای دیدن شکل صفحه، دفتر نمونه را بار کن." : "Paper and live fills land here. Load the sample blotter to see the readout."
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-panel sm:grid-cols-2 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t.mode }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: mode,
									onChange: (e) => setMode(e.target.value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "all",
										children: t.all
									}), opts.modes.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: m,
										children: m === "live" ? t.live : m === "paper" ? t.paper : m
									}, m))]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t.thInd }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: indicator,
									onChange: (e) => setIndicator(e.target.value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "all",
										children: t.all
									}), opts.indicators.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: k,
										children: indicatorLabel(k) || k
									}, k))]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "TF" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: timeframe,
									onChange: (e) => setTimeframe(e.target.value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "all",
										children: t.all
									}), opts.timeframes.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: k,
										children: k
									}, k))]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t.thSide }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: side,
									onChange: (e) => setSide(e.target.value),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "all",
											children: t.all
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "long",
											children: t.long
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "short",
											children: t.short
										})
									]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: fa ? `${analysis.n} از ${closed.length} فیل بسته در این برش.` : `${analysis.n} of ${closed.length} closed fills in this cut.`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3 md:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: t.trades,
								value: String(analysis.n),
								hint: `${analysis.n - analysis.noProfitN}W / ${analysis.noProfitN}L`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: t.winRate,
								value: fmtPct(analysis.wr)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: t.expect,
								value: fmtR(analysis.expectR),
								tone: analysis.expectR >= 0 ? "long" : "short"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: t.netR,
								value: fmtR(analysis.netR),
								tone: analysis.netR >= 0 ? "long" : "short"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3 md:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: fa ? "استاپ‌خورده" : "Stopped",
								value: fmtPct(analysis.slPct),
								hint: `${analysis.slN} SL · ${analysis.tpN} TP · ${analysis.beN} BE`,
								tone: analysis.slPct >= 60 ? "short" : "fg"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: fa ? "سود ناچیز/صفر" : "Dead / scratch",
								value: String(analysis.scratchN + analysis.noProfitN),
								hint: `${analysis.noProfitN} ${fa ? "بدون سود" : "no profit"} · ${analysis.scratchN} ${fa ? "ناچیز" : "scratch"}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: fa ? "جذب حرکت" : "Capture",
								value: analysis.avgCapture ? fmtPct(analysis.avgCapture * 100) : "—",
								hint: `MAE ${fmtR(analysis.avgMae)} · MFE ${fmtR(analysis.avgMfe)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: fa ? "برگشت از سود" : "Giveback",
								value: String(analysis.stoppedFromProfitN),
								hint: fa ? "رفت تو سود، بعد مرد" : "Went green, then died"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-lg border border-border bg-surface p-4 shadow-panel",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium",
							children: fa ? "نتیجه آنالیز" : "Engine readout"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 grid gap-2",
							children: analysis.findings.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FindingRow, {
								f,
								fa
							}, `${f.kind}-${i}`))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliceTable, {
						title: fa ? "دسته: اندیکاتور · تایم‌فریم · سمت" : "Batch: engine · TF · side",
						rows: analysis.byCombo,
						fa
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 lg:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliceTable, {
							title: fa ? "بر اساس اندیکاتور" : "By engine",
							rows: analysis.byIndicator,
							fa
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliceTable, {
							title: fa ? "بر اساس تایم‌فریم" : "By timeframe",
							rows: analysis.byTf,
							fa
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 lg:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliceTable, {
							title: fa ? "لانگ در برابر شورت" : "Long vs short",
							rows: analysis.bySide,
							fa
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliceTable, {
							title: fa ? "نحوه خروج" : "How it exited",
							rows: analysis.byReason,
							fa
						})]
					}),
					analysis.byEntry.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliceTable, {
						title: fa ? "نحوه ورود" : "Entry path",
						rows: analysis.byEntry,
						fa
					}) : null,
					analysis.byMode.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliceTable, {
						title: fa ? "کاغذی در برابر واقعی" : "Paper vs live",
						rows: analysis.byMode,
						fa
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-lg border border-border bg-surface p-4 shadow-panel",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-medium",
							children: fa ? "توزیع R همه نمونه‌ها" : "R distribution — every fill"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 grid grid-cols-7 gap-2",
							children: analysis.hist.map((h) => {
								const max = Math.max(1, ...analysis.hist.map((x) => x.n));
								const pct = h.n / max * 100;
								const bad = h.hi <= 0;
								const tiny = h.lo >= 0 && h.hi <= .3;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex h-24 items-end rounded-sm bg-bg-elev px-1",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `w-full rounded-sm ${bad ? "bg-short" : tiny ? "bg-warn" : "bg-long"}`,
												style: { height: `${Math.max(h.n ? 8 : 0, pct)}%` }
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-center font-mono text-[10px] text-subtle",
											children: histLabel(h.key, fa)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-center font-mono text-xs tabular",
											children: h.n
										})
									]
								}, h.key);
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 xl:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeList, {
								title: fa ? "بیشترین استاپ" : "Hardest stops",
								empty: fa ? "استاپی در این برش نیست." : "No stops in this cut.",
								rows: analysis.worstStops,
								fa,
								tone: "short"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeList, {
								title: fa ? "بیشترین سود" : "Biggest wins",
								empty: fa ? "سودی ثبت نشده." : "No winners.",
								rows: analysis.bestWins,
								fa,
								tone: "long"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeList, {
								title: fa ? "سود ناچیز / صفر" : "Scratch / no profit",
								empty: fa ? "سود ناچیزی نبود." : "No scratches.",
								rows: analysis.scratches,
								fa,
								tone: "warn"
							})
						]
					}),
					analysis.givebacks.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeList, {
						title: fa ? "رفت تو سود، برگشت خورد" : "Went green, then died",
						empty: "",
						rows: analysis.givebacks,
						fa,
						tone: "warn",
						showGiveback: true
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-lg border border-border bg-surface shadow-panel",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-medium",
								children: fa ? "همه نمونه‌ها" : "Every fill"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-1",
								children: [
									["all", fa ? "همه" : "All"],
									["long", fa ? "لانگ" : "Long"],
									["short", fa ? "شورت" : "Short"],
									["sl", fa ? "استاپ" : "SL"],
									["tp", fa ? "تارگت" : "TP"],
									["be", "BE"],
									["scratch", fa ? "ناچیز" : "Scratch"],
									["giveback", fa ? "برگشت" : "Giveback"]
								].map(([k, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setFilter(k),
									className: `rounded-full border px-2.5 py-1 text-xs ${filter === k ? "border-accent bg-accent/15 text-fg" : "border-border bg-bg-elev text-muted hover:text-fg"}`,
									children: label
								}, k))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-x-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full min-w-[920px] text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
									className: "text-xs text-subtle",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-border",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2 text-start font-medium",
												children: fa ? "سمت" : "Side"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2 text-start font-medium",
												children: fa ? "اندیکاتور" : "Engine"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2 text-start font-medium",
												children: "TF"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2 text-start font-medium",
												children: fa ? "ورود" : "Entry"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2 text-start font-medium",
												children: fa ? "خروج" : "Exit"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2 text-start font-medium",
												children: "R"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2 text-start font-medium",
												children: "MAE"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2 text-start font-medium",
												children: "MFE"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-3 py-2 text-start font-medium",
												children: fa ? "نحوه ورود" : "Path"
											})
										]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
									className: "font-mono tabular",
									children: !rows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										colSpan: 9,
										className: "px-3 py-8 text-sm text-muted",
										children: fa ? "نمونه‌ای در این فیلتر نیست." : "Nothing in this cut."
									}) }) : rows.map((tr) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-border/60",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SideCell, {
													side: tr.side,
													fa
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-2",
												children: tr.indicator ? indicatorLabel(tr.indicator) || tr.indicator : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-2",
												children: tr.timeframe ?? "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-2",
												children: fmtPx(tr.entry)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "px-3 py-2",
												children: [
													fmtPx(tr.exit),
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-subtle",
														children: reasonLabel(tr.reason, fa)
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: tr.pnlR >= 0 ? "px-3 py-2 text-long" : "px-3 py-2 text-short",
												children: fmtR(tr.pnlR)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-2 text-short",
												children: fmtR(tr.maeR)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-3 py-2 text-long",
												children: fmtR(tr.mfeR)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "max-w-[240px] truncate px-3 py-2 text-xs text-muted",
												title: tr.entryWhy,
												children: tr.entryWhy
											})
										]
									}, `${tr.opened}-${tr.i}`))
								})]
							})
						})]
					})
				] })
			]
		})
	});
}
function SideCell({ side, fa }) {
	const long = side === "long";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: long ? "long" : "short",
		children: long ? fa ? "لانگ" : "long" : fa ? "شورت" : "short"
	});
}
function reasonLabel(reason, fa) {
	if (reason === "sl") return fa ? "استاپ" : "SL";
	if (reason === "tp") return fa ? "تارگت" : "TP";
	if (reason === "be") return fa ? "ورود" : "BE";
	return reason;
}
function histLabel(key, fa) {
	const pair = {
		"lt-2": ["< −2R", "< −2R"],
		"-2--1": ["−2…−1", "−2…−1"],
		"-1-0": ["−1…۰", "−1…0"],
		"0-0.3": ["ناچیز", "scratch"],
		"0.3-1": ["۰.۳…۱", "0.3…1"],
		"1-2": ["۱…۲", "1…2"],
		gt2: ["> ۲R", "> 2R"]
	}[key];
	return pair ? fa ? pair[0] : pair[1] : key;
}
function comboLabel(key, fa) {
	const parts = key.split(" · ");
	if (parts.length < 3) return sliceKey(key, fa);
	const [ind, tf, side] = parts;
	return `${ind} · ${tf} · ${sliceKey(side ?? "", fa)}`;
}
function FindingRow({ f, fa }) {
	const tone = f.severity === "bad" ? "border-short/40 bg-short-dim/40" : f.severity === "good" ? "border-long/40 bg-long-dim/40" : f.severity === "warn" ? "border-warn/40 bg-surface-2" : "border-border bg-bg-elev";
	const bar = f.severity === "bad" ? "bg-short" : f.severity === "good" ? "bg-long" : f.severity === "warn" ? "bg-warn" : "bg-border-strong";
	const text = findingText(f, fa, f.side === "long" ? fa ? "لانگ" : "long" : f.side === "short" ? fa ? "شورت" : "short" : "");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `relative overflow-hidden rounded-md border px-3 py-2.5 ${tone}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute inset-y-0 start-0 w-0.5 ${bar}` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-sm",
				children: text.title
			}),
			text.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-0.5 text-xs text-muted",
				children: text.detail
			}) : null
		]
	});
}
function findingText(f, fa, side) {
	const combo = f.extra ? comboLabel(f.extra, fa) : "";
	switch (f.kind) {
		case "no_trades": return {
			title: fa ? "در این برش فیل بسته‌ای نیست." : "No closed fills in this cut.",
			detail: fa ? "فیلتر را باز کن یا صبر کن ربات فیل ببندد." : "Widen the filter or wait for the bot to close fills."
		};
		case "few_trades": return {
			title: fa ? `فقط ${f.n} نمونه — برای قضاوت موتور کم است.` : `Only ${f.n} fills — thin sample.`,
			detail: ""
		};
		case "combo_sl_heavy": return {
			title: fa ? `${combo} بیشترین استاپ را خورده: ${fmtPct(f.pct ?? 0)}.` : `${combo} ate the most stops: ${fmtPct(f.pct ?? 0)}.`,
			detail: fa ? `${f.n} استاپ در این دسته. اول همین موتور/تایم/سمت را بهبود بده.` : `${f.n} stops in this batch. Tighten this engine/TF/side first.`
		};
		case "combo_strong": return {
			title: fa ? `${combo} بیشترین سود را داده: ${fmtR(f.r ?? 0)} خالص، برد ${fmtPct(f.pct ?? 0)}.` : `${combo} paid the most: ${fmtR(f.r ?? 0)} net, ${fmtPct(f.pct ?? 0)} win rate.`,
			detail: fa ? `${f.n} معامله در این دسته.` : `${f.n} fills in this batch.`
		};
		case "combo_weak": return {
			title: fa ? `${combo} ضرر داده: ${fmtR(f.r ?? 0)} خالص.` : `${combo} is the leak: ${fmtR(f.r ?? 0)} net.`,
			detail: fa ? `${f.n} معامله. این دسته را جدا بررسی کن.` : `${f.n} fills. Audit this batch on its own.`
		};
		case "combo_dead": return {
			title: fa ? `${combo} تقریباً سود نداده: ${fmtPct(f.pct ?? 0)} صفر یا ناچیز.` : `${combo} barely paid: ${fmtPct(f.pct ?? 0)} dead or scratch.`,
			detail: fa ? `${f.n} فیل بی‌فایده در این دسته.` : `${f.n} dead fills in this batch.`
		};
		case "side_sl_heavy": return {
			title: fa ? `${side} بیشترین استاپ را خورده: ${fmtPct(f.pct ?? 0)} از این سمت.` : `${side} ate the most stops: ${fmtPct(f.pct ?? 0)} of that side.`,
			detail: fa ? `${f.n} استاپ.` : `${f.n} stops.`
		};
		case "side_strong": return {
			title: fa ? `${side} بیشترین سود را داده: ${fmtR(f.r ?? 0)} خالص.` : `${side} paid the most: ${fmtR(f.r ?? 0)} net.`,
			detail: ""
		};
		case "side_weak": return {
			title: fa ? `${side} ضرر داده: ${fmtR(f.r ?? 0)}.` : `${side} is the leak: ${fmtR(f.r ?? 0)}.`,
			detail: ""
		};
		case "sl_rate_high": return {
			title: fa ? `${fmtPct(f.pct ?? 0)} از همه فیل‌ها استاپ خورده‌اند.` : `${fmtPct(f.pct ?? 0)} of all fills stopped out.`,
			detail: ""
		};
		case "scratch_heavy": return {
			title: fa ? `${f.n} معامله سود ناچیز (زیر ۰.۳R).` : `${f.n} scratches under 0.3R.`,
			detail: fa ? "تارگت نزدیک است یا BE خیلی زود مسلح می‌شود." : "Target is close or BE is arming too early."
		};
		case "tiny_profit": return {
			title: fa ? `${fmtPct(f.pct ?? 0)} از نمونه‌ها سود نداده‌اند.` : `${fmtPct(f.pct ?? 0)} of samples paid nothing.`,
			detail: ""
		};
		case "giveback_heavy": return {
			title: fa ? `${f.n} معامله رفت تو سود بعد برگشت خورد.` : `${f.n} fills went green then died.`,
			detail: fa ? "MFE هست، نگهداری نیست." : "MFE exists, hold does not."
		};
		case "missed_tp": return {
			title: fa ? `${f.n} بار نزدیک تارگت رفت و استاپ خورد.` : `${f.n} times price tagged near TP then stopped.`,
			detail: ""
		};
		case "capture_low": return {
			title: fa ? `فقط ${fmtPct(f.pct ?? 0)} از MFE در فیل مانده.` : `Only ${fmtPct(f.pct ?? 0)} of MFE is kept.`,
			detail: ""
		};
		case "expect_neg": return {
			title: fa ? `امید ریاضی منفی است: ${fmtR(f.r ?? 0)}.` : `Expectancy is negative: ${fmtR(f.r ?? 0)}.`,
			detail: ""
		};
		case "expect_pos": return {
			title: fa ? `امید ریاضی مثبت: ${fmtR(f.r ?? 0)}.` : `Expectancy is positive: ${fmtR(f.r ?? 0)}.`,
			detail: ""
		};
		case "worst_stop": return {
			title: fa ? `بدترین استاپ: ${side} · ${combo} → ${fmtR(f.r ?? 0)}.` : `Worst stop: ${side} · ${combo} → ${fmtR(f.r ?? 0)}.`,
			detail: ""
		};
		case "best_trade": return {
			title: fa ? `بهترین سود: ${side} · ${combo} → ${fmtR(f.r ?? 0)}.` : `Best win: ${side} · ${combo} → ${fmtR(f.r ?? 0)}.`,
			detail: ""
		};
		default: return {
			title: f.kind,
			detail: ""
		};
	}
}
function SliceTable({ title, rows, fa }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-lg border border-border bg-surface shadow-panel",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "border-b border-border px-3 py-2 text-sm font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[640px] text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "text-xs text-subtle",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-start font-medium",
								children: fa ? "دسته" : "Batch"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-start font-medium",
								children: "n"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-start font-medium",
								children: "WR"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-start font-medium",
								children: "SL%"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-start font-medium",
								children: fa ? "مرده" : "Dead"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-start font-medium",
								children: "ΣR"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-start font-medium",
								children: "E[R]"
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
					className: "font-mono tabular",
					children: !rows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 7,
						className: "px-3 py-6 text-sm text-muted",
						children: fa ? "دسته‌ای در این برش نیست." : "No batches in this cut."
					}) }) : rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/60",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: comboLabel(r.key, fa)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: r.n
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: fmtPct(r.wr)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: r.slPct >= 60 ? "px-3 py-2 text-short" : "px-3 py-2",
								children: fmtPct(r.slPct)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: r.deadPct >= 50 ? "px-3 py-2 text-warn" : "px-3 py-2",
								children: fmtPct(r.deadPct)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: r.netR >= 0 ? "px-3 py-2 text-long" : "px-3 py-2 text-short",
								children: fmtR(r.netR)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: r.expectR >= 0 ? "px-3 py-2 text-long" : "px-3 py-2 text-short",
								children: fmtR(r.expectR)
							})
						]
					}, r.key))
				})]
			})
		})]
	});
}
function sliceKey(key, fa) {
	if (key === "long") return fa ? "لانگ" : "long";
	if (key === "short") return fa ? "شورت" : "short";
	if (key === "sl") return fa ? "استاپ" : "SL";
	if (key === "tp") return fa ? "تارگت" : "TP";
	if (key === "be") return fa ? "ورود (BE)" : "BE";
	if (key === "paper") return fa ? "کاغذی" : "paper";
	if (key === "live") return fa ? "واقعی" : "live";
	return key;
}
function TradeList({ title, empty, rows, fa, tone, showGiveback }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-lg border border-border bg-surface shadow-panel",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "border-b border-border px-3 py-2 text-sm font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "divide-y divide-border/60",
			children: !rows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 py-6 text-sm text-muted",
				children: empty
			}) : rows.map((tr) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-1 px-3 py-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SideCell, {
								side: tr.side,
								fa
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted",
								children: [
									tr.indicator ? indicatorLabel(tr.indicator) || tr.indicator : "",
									" ",
									tr.timeframe ?? ""
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `font-mono text-sm tabular ${tone === "long" ? "text-long" : tone === "short" ? "text-short" : "text-warn"}`,
							children: fmtR(tr.pnlR)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-mono text-xs text-muted",
						children: [
							tr.symbol ?? "",
							" ",
							fmtPx(tr.entry),
							" → ",
							fmtPx(tr.exit),
							" · ",
							reasonLabel(tr.reason, fa),
							showGiveback ? ` · ${fa ? "برگشت" : "giveback"} ${fmtR(tr.givebackR)}` : ""
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-[11px] text-subtle",
						children: [
							"MAE ",
							fmtR(tr.maeR),
							" · MFE ",
							fmtR(tr.mfeR),
							" · ",
							fmtUsd(tr.pnl)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "truncate text-[11px] text-muted",
						title: tr.entryWhy,
						children: tr.entryWhy
					})
				]
			}, `${title}-${tr.i}-${tr.opened}`))
		})]
	});
}
//#endregion
export { Page as component };
