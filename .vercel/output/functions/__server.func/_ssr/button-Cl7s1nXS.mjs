import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as cn } from "./shell-BOxIB2Hf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/button-Cl7s1nXS.js
var import_jsx_runtime = require_jsx_runtime();
var styles = {
	primary: "bg-fg text-bg hover:bg-fg/90",
	ghost: "bg-transparent text-fg hover:bg-surface-2",
	outline: "bg-transparent text-fg border border-border hover:border-border-strong hover:bg-surface",
	danger: "bg-short text-fg hover:bg-short/90",
	long: "bg-long text-accent-fg hover:bg-long/90",
	short: "bg-short text-fg hover:bg-short/90"
};
function Button({ className, variant = "primary", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40", styles[variant], className),
		...props
	});
}
//#endregion
export { Button as t };
