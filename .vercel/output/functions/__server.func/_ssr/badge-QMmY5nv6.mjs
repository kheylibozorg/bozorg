import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as cn } from "./shell-BOxIB2Hf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-QMmY5nv6.js
var import_jsx_runtime = require_jsx_runtime();
function Badge({ className, tone = "muted", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide", {
			muted: "bg-surface-2 text-muted border-border",
			long: "bg-long-dim text-long border-long/30",
			short: "bg-short-dim text-short border-short/30",
			warn: "bg-surface-2 text-warn border-warn/30",
			fg: "bg-fg/8 text-fg border-border"
		}[tone], className),
		...props
	});
}
//#endregion
export { Badge as t };
