import { o as __toESM } from "../_runtime.mjs";
import { o as indicatorLabel } from "./types-BFJLnIEL.mjs";
import { B as require_react, b as require_jsx_runtime, v as Link, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as seedDeskJournal, g as useLocale, s as resetDeskJournal, u as saveDeskTradeNote } from "./functions-D1fgtqih.mjs";
import { c as Download, i as RotateCcw, u as BookOpen } from "../_libs/lucide-react.mjs";
import { a as Route$4 } from "./router-kf2Pjw6r.mjs";
import { a as fmtPct, c as fmtUsd, i as fmtDuration, l as fmtWhen, n as cn, o as fmtPx, r as fmtBarOpen, s as fmtR, t as DeskShell } from "./shell-nfsQvvNB.mjs";
import { t as Button } from "./button-CcRDLENc.mjs";
import { i as Textarea, n as Label, r as Select, t as Input } from "./field-B2YuifSf.mjs";
import { t as Badge } from "./badge-CcZoPOMs.mjs";
import { r as useLiveDesk, t as StatusChip } from "./use-live-desk-CqPO2xoy.mjs";
import { n as PositionsTable, r as SideBadge, t as Kpi } from "./tables-zfW_kLwj.mjs";
import { i as tradesToCsv, n as filterJournal, r as journalOptions, t as analyzeJournal } from "./journal-BM2UEAXn.mjs";
import { a as ResponsiveContainer, i as Area, n as YAxis, o as Tooltip, r as XAxis, t as AreaChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/journal-BFo-hQPm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var HIST_LABEL = {
	"lt-2": {
		fa: "< −2R",
		en: "< −2R"
	},
	"-2--1": {
		fa: "−2 تا −1",
		en: "−2 to −1"
	},
	"-1-0": {
		fa: "−1 تا 0",
		en: "−1 to 0"
	},
	"0-1": {
		fa: "0 تا 1",
		en: "0 to 1"
	},
	"1-2": {
		fa: "1 تا 2",
		en: "1 to 2"
	},
	gt2: {
		fa: "> 2R",
		en: "> 2R"
	}
};
function reasonLabel(reason, fa) {
	if (reason === "sl") return fa ? "استاپ" : "Stop";
	if (reason === "tp") return fa ? "تارگت" : "Target";
	if (reason === "be") return fa ? "ورود (BE)" : "Break-even";
	if (reason === "venue") return fa ? "صرافی" : "Venue";
	return reason || "—";
}
function num(v, d = 0) {
	const n = typeof v === "number" ? v : Number(v);
	return Number.isFinite(n) ? n : d;
}
function Page() {
	const data = Route$4.useLoaderData();
	const { t, locale } = useLocale();
	const fa = locale === "fa";
	const router = useRouter();
	useLiveDesk(2e4);
	const [symbol, setSymbol] = (0, import_react.useState)("");
	const [indicator, setIndicator] = (0, import_react.useState)("all");
	const [timeframe, setTimeframe] = (0, import_react.useState)("all");
	const [side, setSide] = (0, import_react.useState)("all");
	const [reason, setReason] = (0, import_react.useState)("all");
	const [mode, setMode] = (0, import_react.useState)("all");
	const [pickedId, setPickedId] = (0, import_react.useState)(null);
	const [confirm, setConfirm] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [msg, setMsg] = (0, import_react.useState)(null);
	const closed = data.closed;
	const open = data.open;
	const opts = (0, import_react.useMemo)(() => journalOptions(closed), [closed]);
	const filtered = (0, import_react.useMemo)(() => filterJournal(closed, {
		symbol,
		indicator,
		timeframe,
		side,
		reason,
		mode
	}), [
		closed,
		symbol,
		indicator,
		timeframe,
		side,
		reason,
		mode
	]);
	const stats = (0, import_react.useMemo)(() => analyzeJournal(filtered, num(data.settings.startingEquityUsd, 1e4)), [filtered, data.settings.startingEquityUsd]);
	const picked = closed.find((r) => r.id === pickedId) ?? open.find((r) => r.id === pickedId) ?? filtered[0] ?? open[0] ?? null;
	const curve = stats.curve.map((p) => ({
		t: new Date(p.t).toLocaleDateString(fa ? "fa-IR" : "en-GB", {
			month: "short",
			day: "numeric"
		}),
		equity: p.usd,
		r: p.r
	}));
	const histMax = Math.max(1, ...stats.hist.map((h) => h.n));
	const unlocked = data.lock.unlocked;
	const hasPin = data.lock.hasPin;
	const pnl = stats.netUsd;
	const empty = !closed.length && !open.length;
	async function reset(scope) {
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
		a.download = `apex-journal-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
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
							children: t.journal
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-2xl text-sm text-muted",
							children: t.journalHint
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								onClick: loadSample,
								disabled: busy,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
									className: "size-4",
									strokeWidth: 1.75
								}), t.loadSample]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								onClick: exportCsv,
								disabled: !filtered.length,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
									className: "size-4",
									strokeWidth: 1.75
								}), t.exportCsv]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "danger",
								onClick: () => setConfirm(confirm ? null : "closed"),
								disabled: busy,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
									className: "size-4",
									strokeWidth: 1.75
								}), t.resetJournal]
							})
						]
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
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl tracking-tight",
							children: t.emptyJournal
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-xl text-sm text-muted",
							children: t.emptyJournalHint
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: loadSample,
								disabled: busy,
								children: t.loadSample
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => router.navigate({ to: "/" }),
								children: t.desk
							})]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: t.trades,
								value: String(stats.n),
								hint: `${stats.wins} ${t.wins} · ${stats.losses} ${t.losses}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: t.winRate,
								value: fmtPct(stats.wr),
								tone: stats.wr >= 50 ? "long" : "fg"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: t.netR,
								value: fmtR(stats.netR),
								tone: stats.netR >= 0 ? "long" : "short"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
								label: t.pnl,
								value: fmtUsd(pnl),
								tone: pnl >= 0 ? "long" : "short"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm shadow-panel sm:grid-cols-3 lg:grid-cols-5",
						children: [
							[
								t.pf,
								stats.profitFactor ? stats.profitFactor.toFixed(2) : "—",
								false
							],
							[
								t.expect,
								fmtR(stats.expectR),
								stats.expectR < 0
							],
							[
								t.streak,
								stats.streak ? `${stats.streak > 0 ? "+" : ""}${stats.streak}` : "0",
								stats.streak < 0
							],
							[
								t.dd,
								fmtR(stats.maxDdR),
								stats.maxDdR < 0
							],
							[
								t.avgWin,
								fmtR(stats.avgWinR),
								false
							],
							[
								t.avgLoss,
								fmtR(stats.avgLossR),
								true
							],
							[
								t.mae,
								stats.avgMae ? stats.avgMae.toFixed(2) : "—",
								true
							],
							[
								t.mfe,
								stats.avgMfe ? stats.avgMfe.toFixed(2) : "—",
								false
							],
							[
								t.hold,
								fmtDuration(stats.avgHoldMs, locale),
								false
							],
							[
								t.fees,
								fmtUsd(stats.avgFees),
								false
							]
						].map(([k, v, bad]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-subtle",
								children: k
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: cn("font-mono tabular", bad ? "text-short" : "text-fg"),
								children: v
							})]
						}, String(k)))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid min-w-0 gap-4 xl:grid-cols-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "min-w-0 overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-panel xl:col-span-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mb-3 text-sm font-medium",
								children: t.blotter
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlotterTable, {
								rows: filtered,
								empty: t.noClosed,
								pickedId: picked?.id ?? null,
								onPick: setPickedId,
								fa,
								locale,
								t
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
							className: "min-w-0 rounded-lg border border-border bg-surface p-4 shadow-panel xl:col-span-2 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-7rem)] xl:self-start xl:overflow-y-auto",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mb-3 text-sm font-medium",
								children: t.tradeDetail
							}), picked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeDetail, {
								row: picked,
								fa,
								t,
								locale,
								canEdit: !hasPin || unlocked,
								onSaved: async () => {
									await router.invalidate({ sync: true });
								}
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: t.pickTrade
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-lg border border-border bg-surface p-4 shadow-panel",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex flex-wrap items-end justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-medium",
								children: t.filters
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-subtle",
								children: [
									t.showing,
									" ",
									filtered.length,
									" ",
									t.ofTrades
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "j-sym",
										children: t.symbol
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "j-sym",
										value: symbol,
										placeholder: "BTC",
										onChange: (e) => setSymbol(e.target.value.toUpperCase())
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t.byIndicator }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: indicator,
										onChange: (e) => setIndicator(e.target.value),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "all",
											children: t.all
										}), opts.indicators.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: k,
											children: indicatorLabel(k)
										}, k))]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t.byTf }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
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
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t.bySide }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
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
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t.reason }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: reason,
										onChange: (e) => setReason(e.target.value),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "all",
											children: t.all
										}), opts.reasons.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: k,
											children: reasonLabel(k, fa)
										}, k))]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t.mode }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: mode,
										onChange: (e) => setMode(e.target.value),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "all",
											children: t.all
										}), opts.modes.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: k,
											children: k === "live" ? t.live : t.paper
										}, k))]
									})]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "min-w-0 overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-panel",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-3 text-sm font-medium",
							children: t.openNow
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PositionsTable, {
							rows: open,
							empty: t.noPositions,
							onPick: setPickedId,
							pickedId: picked?.id
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid min-w-0 gap-4 lg:grid-cols-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-lg border border-border bg-surface p-4 shadow-panel lg:col-span-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mb-3 text-sm font-medium",
								children: t.curve
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-44",
								children: curve.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
									width: "100%",
									height: "100%",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
										data: curve,
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
												id: "j-eq",
												x1: "0",
												y1: "0",
												x2: "0",
												y2: "1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
													offset: "0%",
													stopColor: "var(--color-long)",
													stopOpacity: .32
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
													offset: "100%",
													stopColor: "var(--color-long)",
													stopOpacity: 0
												})]
											}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
												dataKey: "t",
												hide: true
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
												hide: true,
												domain: ["auto", "auto"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
												background: "var(--color-surface)",
												border: "1px solid var(--color-border)",
												borderRadius: 8,
												color: "var(--color-fg)",
												fontSize: 12
											} }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
												type: "monotone",
												dataKey: "equity",
												stroke: "var(--color-long)",
												fill: "url(#j-eq)",
												strokeWidth: 1.5
											})
										]
									})
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid h-full place-items-center text-sm text-muted",
									children: t.noClosed
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-lg border border-border bg-surface p-4 shadow-panel lg:col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mb-3 text-sm font-medium",
								children: t.rDist
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-2",
								children: stats.hist.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-[4.5rem_minmax(0,1fr)_1.5rem] items-center gap-2 text-xs",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-subtle",
											children: HIST_LABEL[h.key]?.[locale] ?? h.key
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-2 min-w-0 overflow-hidden rounded-full bg-bg-elev",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `h-full rounded-full ${h.lo < 0 ? "bg-short" : "bg-long"}`,
												style: { width: `${100 * h.n / histMax}%` }
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono tabular text-muted",
											children: h.n
										})
									]
								}, h.key))
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
						children: [
							{
								title: t.byIndicator,
								rows: stats.byIndicator,
								label: (k) => indicatorLabel(k)
							},
							{
								title: t.byTf,
								rows: stats.byTf,
								label: (k) => k
							},
							{
								title: t.bySide,
								rows: stats.bySide,
								label: (k) => k === "long" ? t.long : k === "short" ? t.short : k
							},
							{
								title: t.byExit,
								rows: stats.byReason,
								label: (k) => reasonLabel(k, fa)
							}
						].map((block) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-lg border border-border bg-surface p-4 shadow-panel",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mb-3 text-sm font-medium",
								children: block.title
							}), !block.rows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "—"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "grid gap-2",
								children: block.rows.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-baseline justify-between gap-2 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: block.label(b.key)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono tabular text-xs text-subtle",
										children: [
											b.n,
											" · ",
											fmtPct(b.wr, 0),
											" ·",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: b.r >= 0 ? "text-long" : "text-short",
												children: fmtR(b.r)
											})
										]
									})]
								}, b.key))
							})]
						}, block.title))
					})
				] })
			]
		})
	});
}
function BlotterTable({ rows, empty, pickedId, onPick, fa, locale, t }) {
	if (!rows.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-1 py-8 text-sm text-muted",
		children: empty
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-2 md:hidden",
		children: rows.map((r) => {
			const usd = num(r.pnl_usd);
			const win = usd > 0;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onPick(r.id),
				className: cn("min-h-11 rounded-sm border p-3 text-start", pickedId === r.id ? "border-accent bg-surface-2" : "border-border bg-bg-elev"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-medium",
						children: [
							r.symbol.replace("USDT", ""),
							" · ",
							indicatorLabel(r.indicator)
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("font-mono tabular text-sm", win ? "text-long" : "text-short"),
						children: fmtR(num(r.pnl_r))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1 flex flex-wrap items-center gap-2 text-xs text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SideBadge, { side: r.side }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.timeframe }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: reasonLabel(r.exit_reason ?? "", fa) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono",
							children: fmtUsd(usd)
						}),
						r.mae_r != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono text-short",
							children: ["MAE ", num(r.mae_r).toFixed(2)]
						}) : null,
						r.mfe_r != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono text-long",
							children: ["MFE ", num(r.mfe_r).toFixed(2)]
						}) : null
					]
				})]
			}, r.id);
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "hidden min-w-0 overflow-x-auto md:block",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full text-start text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "text-xs text-subtle",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: t.symbol
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: t.thInd
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: t.thSide
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "R"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "$"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: t.thOut
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: t.hold
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
				className: "font-mono tabular",
				children: rows.map((r) => {
					const usd = num(r.pnl_usd);
					const win = usd > 0 || usd === 0 && num(r.pnl_r) >= 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						onClick: () => onPick(r.id),
						className: cn("cursor-pointer border-b border-border/60 transition-colors hover:bg-surface-2", pickedId === r.id ? "bg-surface-2" : ""),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-3 py-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-fg",
									children: r.symbol.replace("USDT", "")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-subtle",
									children: [
										r.timeframe,
										" · ",
										r.mode
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 text-muted",
								children: indicatorLabel(r.indicator)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SideBadge, { side: r.side })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: win ? "px-3 py-2.5 text-long" : "px-3 py-2.5 text-short",
								children: fmtR(num(r.pnl_r))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: win ? "px-3 py-2.5 text-long" : "px-3 py-2.5 text-short",
								children: fmtUsd(usd)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 text-muted",
								children: reasonLabel(r.exit_reason ?? "", fa)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 text-subtle",
								children: r.hold_ms != null ? fmtDuration(num(r.hold_ms), locale) : "—"
							})
						]
					}, r.id);
				})
			})]
		})
	})] });
}
function RiskPath({ row, t }) {
	const entry = num(row.entry);
	const orig = num(row.orig_sl ?? row.sl);
	const dist = Math.abs(entry - orig);
	if (!(dist > 0)) return null;
	const sign = row.side === "long" ? 1 : -1;
	const rAt = (px) => sign * (px - entry) / dist;
	const planned = Math.max(.5, num(row.rr_planned, 1));
	const mae = row.mae_r != null ? num(row.mae_r) : 0;
	const mfe = row.mfe_r != null ? num(row.mfe_r) : 0;
	const exitR = row.exit_px != null ? rAt(num(row.exit_px)) : null;
	const minR = Math.min(-1.2, -mae - .12);
	const maxR = Math.max(planned + .2, mfe + .12, exitR ?? 0);
	const x = (r) => `${(r - minR) / (maxR - minR) * 100}%`;
	const realized = row.status === "closed" ? num(row.pnl_r) : null;
	const capture = mfe > .05 && realized != null ? Math.max(0, Math.min(1.5, realized / mfe)) : null;
	const give = mfe > 0 && realized != null ? mfe - realized : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-2",
		dir: "ltr",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between text-xs text-subtle",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.path }), capture != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono tabular",
					children: [
						t.capture,
						" ",
						(100 * capture).toFixed(0),
						"%",
						give != null && give > .05 ? ` · ${t.giveback} ${fmtR(give)}` : ""
					]
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-10 rounded-sm bg-bg-elev",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-y-3 rounded-full bg-short-dim",
						style: {
							left: x(Math.min(0, -mae)),
							right: `calc(100% - ${x(0)})`
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-y-3 rounded-full bg-long-dim",
						style: {
							left: x(0),
							right: `calc(100% - ${x(Math.max(0, mfe || planned))})`
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute top-1/2 h-3 w-px -translate-y-1/2 bg-short",
						style: { left: x(-1) },
						title: "SL"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-fg",
						style: { left: x(0) },
						title: "Entry"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute top-1/2 h-3 w-px -translate-y-1/2 bg-long",
						style: { left: x(planned) },
						title: "TP"
					}),
					exitR != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-fg bg-accent",
						style: { left: x(exitR) },
						title: "Exit"
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-between font-mono text-xs text-subtle",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["SL ", fmtPx(orig)] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["E ", fmtPx(entry)] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["TP ", fmtPx(num(row.tp))] })
				]
			})
		]
	});
}
function TradeDetail({ row, fa, t, locale, canEdit, onSaved }) {
	const usd = num(row.pnl_usd);
	const win = row.status !== "closed" ? null : usd > 0;
	const [note, setNote] = (0, import_react.useState)(row.notes ?? "");
	const [saving, setSaving] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setNote(row.notes ?? "");
	}, [row.id, row.notes]);
	const groups = [
		{
			title: fa ? "سطوح" : "Levels",
			pairs: [
				["Entry", fmtPx(num(row.entry))],
				[t.origStop, fmtPx(num(row.orig_sl ?? row.sl))],
				["SL", fmtPx(num(row.sl))],
				["TP", fmtPx(num(row.tp))],
				[t.exitPx, row.exit_px != null ? fmtPx(num(row.exit_px)) : "—"],
				[t.plannedRr, row.rr_planned != null ? Number(row.rr_planned).toFixed(2) : "—"]
			]
		},
		{
			title: fa ? "سایز" : "Size",
			pairs: [
				[t.qty, String(num(row.qty))],
				["Lev", `${row.leverage}x`],
				[t.notional, fmtUsd(num(row.notional_usd), 0)],
				[t.margin, row.margin_usd != null ? fmtUsd(num(row.margin_usd), 0) : "—"],
				[t.risk, fmtUsd(num(row.risk_usd))],
				[t.fees, fmtUsd(num(row.fees_usd))]
			]
		},
		{
			title: fa ? "مسیر" : "Path",
			pairs: [
				[t.mae, row.mae_r != null ? num(row.mae_r).toFixed(2) : "—"],
				[t.mfe, row.mfe_r != null ? num(row.mfe_r).toFixed(2) : "—"],
				[t.barsHeld, row.bars_held != null ? String(row.bars_held) : "—"],
				[t.hold, row.hold_ms != null ? fmtDuration(num(row.hold_ms), locale) : "—"],
				[t.beMoved, num(row.be_moved) ? t.yes : t.no],
				[t.atr, row.atr_at_entry != null ? fmtPx(num(row.atr_at_entry)) : "—"]
			]
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
				[t.orderId, row.exchange_order_id || "—"]
			]
		}
	];
	async function saveNote() {
		setSaving(true);
		try {
			await saveDeskTradeNote({ data: {
				id: row.id,
				notes: note
			} });
			await onSaved();
		} catch (e) {
			window.alert(e instanceof Error ? e.message : "save failed");
		} finally {
			setSaving(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-xl tracking-tight",
						children: row.symbol.replace("USDT", "")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm text-muted",
						children: row.timeframe
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "muted",
						children: indicatorLabel(row.indicator)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SideBadge, { side: row.side }),
					row.status === "closed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: win ? "long" : "short",
						children: win ? t.wins : t.losses
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "warn",
						children: t.open
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "muted",
						children: reasonLabel(row.exit_reason ?? "", fa)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-4 font-mono tabular",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-subtle",
					children: "R"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: win === false ? "text-short" : "text-long",
					children: row.status === "closed" ? fmtR(num(row.pnl_r)) : "—"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-subtle",
					children: "PnL"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: win === false ? "text-short" : "text-long",
					children: row.status === "closed" ? fmtUsd(usd) : "—"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RiskPath, {
				row,
				t
			}),
			row.signal_reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-sm bg-bg-elev px-3 py-2 text-xs leading-relaxed text-muted",
				dir: "ltr",
				children: row.signal_reason
			}) : null,
			groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-2 text-xs font-medium text-subtle",
				children: g.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
				className: "grid grid-cols-2 gap-x-3 gap-y-2 text-sm",
				children: g.pairs.map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-xs text-subtle",
						children: k
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "truncate font-mono tabular text-fg",
						title: v,
						children: v
					})]
				}, k))
			})] }, g.title)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `note-${row.id}`,
						children: t.note
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						id: `note-${row.id}`,
						value: note,
						disabled: !canEdit,
						onChange: (e) => setNote(e.target.value),
						className: "min-h-20"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-subtle",
							children: t.noteHint
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							disabled: !canEdit || saving || note === (row.notes ?? ""),
							onClick: saveNote,
							children: saving ? "…" : t.saveNote
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { Page as component };
