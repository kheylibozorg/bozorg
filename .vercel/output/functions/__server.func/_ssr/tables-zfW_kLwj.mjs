import { o as indicatorLabel } from "./types-BFJLnIEL.mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { g as useLocale } from "./functions-D1fgtqih.mjs";
import { c as fmtUsd, d as timeAgo, n as cn, o as fmtPx, r as fmtBarOpen, s as fmtR } from "./shell-nfsQvvNB.mjs";
import { t as Badge } from "./badge-CcZoPOMs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tables-zfW_kLwj.js
var import_jsx_runtime = require_jsx_runtime();
function closedPnlUsd(r) {
	const usd = Number(r.pnl_usd);
	if (r.pnl_usd != null && Number.isFinite(usd)) return usd;
	const mult = Number(r.pnl_r);
	const risk = Number(r.risk_usd);
	if (Number.isFinite(mult) && Number.isFinite(risk) && risk > 0) return mult * risk;
	return null;
}
function SideBadge({ side }) {
	const { t } = useLocale();
	const long = side === "long";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: long ? "long" : "short",
		children: long ? t.long : t.short
	});
}
function PositionsTable({ rows, empty, onPick, pickedId }) {
	const { locale } = useLocale();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-w-0 overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[640px] text-start text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "text-xs text-subtle",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Symbol"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "TF"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Ind"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Side"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Entry"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "SL"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "TP"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Lev"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "R"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: locale === "fa" ? "سود $" : "PnL $"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: locale === "fa" ? "خروج" : "Out"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "When"
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
				className: "font-mono tabular",
				children: !rows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					colSpan: 12,
					className: "px-3 py-8 text-sm text-muted",
					children: empty
				}) }) : rows.map((r) => {
					const usd = closedPnlUsd(r);
					const win = r.status !== "closed" || (usd != null ? usd >= 0 : Number(r.pnl_r) >= 0);
					const active = pickedId === r.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: cn("border-b border-border/60 transition-colors", onPick ? "cursor-pointer hover:bg-surface-2" : "", active ? "bg-surface-2" : ""),
						onClick: onPick ? () => onPick(r.id) : void 0,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 text-fg",
								children: r.symbol.replace("USDT", "")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 text-muted",
								children: r.timeframe
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
								className: "px-3 py-2.5",
								children: fmtPx(Number(r.entry))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 text-short",
								children: fmtPx(Number(r.sl))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 text-long",
								children: fmtPx(Number(r.tp))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-3 py-2.5",
								children: [r.leverage, "x"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: win ? "px-3 py-2.5 text-long" : "px-3 py-2.5 text-short",
								children: r.status === "closed" ? fmtR(Number(r.pnl_r)) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: win ? "px-3 py-2.5 text-long" : "px-3 py-2.5 text-short",
								children: r.status === "closed" && usd != null ? fmtUsd(usd) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 text-muted",
								children: r.status === "closed" ? r.exit_reason || "—" : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2.5 text-subtle",
								children: timeAgo(r.opened_at, locale)
							})
						]
					}, r.id);
				})
			})]
		})
	});
}
function skipLabel(reason, fa) {
	const r = (reason ?? "").trim();
	if (!r) return fa ? "رد" : "skip";
	if (r === "stale bar") return fa ? "کندل قدیمی" : "old bar";
	if (r === "already in symbol") return fa ? "همین ارز باز است" : "already in symbol";
	if (r === "max positions") return fa ? "سقف پوزیشن" : "max positions";
	if (r === "already filled") return fa ? "قبلاً گرفته شد" : "already filled";
	if (r === "size failed") return fa ? "سایز نشد" : "size failed";
	return r;
}
function SignalsTable({ rows, empty }) {
	const { locale } = useLocale();
	if (!rows.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-1 py-8 text-sm text-muted",
		children: empty
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-w-0 overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[640px] text-start text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "text-xs text-subtle",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Symbol"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "TF"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Ind"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Side"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Entry"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "R:R"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Fill"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: locale === "fa" ? "کندل (UTC)" : "Candle UTC"
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
				className: "font-mono tabular",
				children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border/60",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2.5",
							children: r.symbol.replace("USDT", "")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2.5 text-muted",
							children: r.timeframe
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
							className: "px-3 py-2.5",
							children: fmtPx(Number(r.entry))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2.5",
							children: Number(r.rr).toFixed(1)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2.5",
							children: r.taken ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "long",
								children: locale === "fa" ? "گرفته شد" : "taken"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-subtle",
								children: skipLabel(r.skip_reason, locale === "fa")
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2.5 text-subtle",
							children: fmtBarOpen(r.bar_time ?? r.ts)
						})
					]
				}, r.id))
			})]
		})
	});
}
function Kpi({ label, value, hint, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-panel",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute inset-y-0 start-0 w-0.5 ${tone === "long" ? "bg-long" : tone === "short" ? "bg-short" : "bg-border-strong"}` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `mt-2 font-mono text-2xl tabular tracking-tight ${tone === "long" ? "text-long" : tone === "short" ? "text-short" : "text-fg"}`,
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-xs text-subtle",
				children: hint
			}) : null
		]
	});
}
//#endregion
export { SignalsTable as i, PositionsTable as n, SideBadge as r, Kpi as t };
