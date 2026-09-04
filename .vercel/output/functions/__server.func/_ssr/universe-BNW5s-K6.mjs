import { o as __toESM } from "../_runtime.mjs";
import { R as venueLabel, a as chartHostLabel, i as bookVenue, w as nativeSymbol, x as looksLikeFallbackUniverse } from "./tick.server-DYwNr8MZ.mjs";
import { B as require_react, b as require_jsx_runtime, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { g as useLocale, o as refreshCoins } from "./functions-D1fgtqih.mjs";
import { r as Route$2 } from "./router-kf2Pjw6r.mjs";
import { c as fmtUsd, t as DeskShell } from "./shell-nfsQvvNB.mjs";
import { t as Button } from "./button-CcRDLENc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/universe-BNW5s-K6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Page() {
	const data = Route$2.useLoaderData();
	const { t, locale } = useLocale();
	const router = useRouter();
	const [busy, setBusy] = (0, import_react.useState)(false);
	const venue = bookVenue(data.settings.venue);
	const chart = chartHostLabel(venue);
	const label = venueLabel(venue);
	const fallback = looksLikeFallbackUniverse(data.universe);
	async function refresh() {
		setBusy(true);
		try {
			await refreshCoins();
			await router.invalidate({ sync: true });
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DeskShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-end justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl tracking-tight",
			children: t.universe
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-2xl text-sm text-muted",
			children: (() => {
				const cap = Number(data.settings.minMarketCapUsd) || 0;
				const n = data.universe.length;
				if (locale === "fa") {
					const capBit = cap > 0 ? ` با مارکت‌کپ ≥ ${fmtUsd(cap, 0)}` : " — بدون کف مارکت‌کپ";
					return `${n} پرپچوال لیست‌شده روی «${label}». چارت و سیگنال فقط از ${chart} است، نه صرافی دیگر.${capBit}.${fallback ? " این لیست موقت است؛ به‌روز کردن را بزن تا کتاب زندهٔ همان صرافی بیاید." : ""}`;
				}
				const capBit = cap > 0 ? ` Market-cap floor ≥ ${fmtUsd(cap, 0)}.` : " No market-cap floor.";
				return `${n} perps listed on ${label}. Signals use ${chart} candles — not another venue's chart.${capBit}${fallback ? " This is the emergency 10-coin list — hit refresh to load that exchange's live book." : ""}`;
			})()
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			onClick: refresh,
			disabled: busy,
			variant: "outline",
			children: busy ? t.running : t.refresh
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-6 overflow-x-auto rounded-lg border border-border bg-surface shadow-panel",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "text-xs text-subtle",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-start font-medium",
							children: "#"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-start font-medium",
							children: "Asset"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-start font-medium",
							children: t.pair
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-start font-medium",
							children: t.chart
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-start font-medium",
							children: "Cap"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-start font-medium",
							children: "Vol 24h"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-start font-medium",
							children: "Max lev"
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.universe.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-b border-border/60",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2.5 font-mono text-subtle",
						children: i + 1
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-3 py-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-medium",
							children: a.base
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-subtle",
							children: a.name
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2.5 font-mono text-xs text-muted",
						children: a.venue_symbol || nativeSymbol(venue, a.base)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2.5 text-xs text-subtle",
						children: chart
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2.5 font-mono tabular",
						children: fmtUsd(Number(a.market_cap_usd), 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2.5 font-mono tabular text-muted",
						children: fmtUsd(Number(a.volume_24h_usd), 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-3 py-2.5 font-mono",
						children: [a.max_leverage, "x"]
					})
				]
			}, a.symbol)) })]
		}), !data.universe.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "p-6 text-sm text-muted",
			children: locale === "fa" ? "لیست خالی است. صرافی را وصل کن یا به‌روز کردن را بزن تا کتاب همان صرافی خوانده شود." : "List is empty. Connect the venue or hit refresh to load that exchange's book."
		}) : null]
	})] });
}
//#endregion
export { Page as component };
