import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { g as useLocale } from "./functions-zXYqw9Df.mjs";
import { i as Route$3 } from "./router-CyiDPfjt.mjs";
import { t as DeskShell } from "./shell-BOxIB2Hf.mjs";
import { r as useLiveDesk, t as StatusChip } from "./use-live-desk-COX79b8w.mjs";
import { i as SignalsTable } from "./tables-CTXeJk0V.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/signals-1j73DDiq.js
var import_jsx_runtime = require_jsx_runtime();
function Page() {
	const data = Route$3.useLoaderData();
	const { t, locale } = useLocale();
	useLiveDesk(2e4);
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
				children: t.signals
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-sm text-muted",
				children: locale === "fa" ? "یازده اندیکاتور: APEX 1R / 1.5R / 2R و چهار کویل HALCYON دست‌نخورده، TREX 1.0R و 1.2R، KETEX 2.2R، به‌علاوه SHETEX 1.8R. SHETEX = تست دوم → FTC، بدون BE. سیگنال فقط روی کندل بسته." : "Eleven indicators: APEX 1R / 1.5R / 2R and four HALCYON coils untouched, TREX 1.0R and 1.2R, KETEX 2.2R, plus SHETEX 1.8R. SHETEX = second-test → FTC, no BE. Signals fire on closed bars only."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 rounded-lg border border-border bg-surface p-4 shadow-panel",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignalsTable, {
					rows: data.signals,
					empty: t.noSignals
				})
			})
		]
	});
}
//#endregion
export { Page as component };
