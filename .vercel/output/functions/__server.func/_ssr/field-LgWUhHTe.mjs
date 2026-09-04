import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as cn } from "./shell-BOxIB2Hf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/field-LgWUhHTe.js
var import_jsx_runtime = require_jsx_runtime();
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("text-xs font-medium text-muted", className),
		...props
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		suppressHydrationWarning: true,
		className: cn("h-11 w-full rounded-sm border border-border bg-bg-elev px-3 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus:border-accent", className),
		...props
	});
}
function Select({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		suppressHydrationWarning: true,
		className: cn("h-11 w-full rounded-sm border border-border bg-bg-elev px-3 text-sm text-fg outline-none focus:border-accent", className),
		...props
	});
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		suppressHydrationWarning: true,
		className: cn("min-h-28 w-full rounded-md border border-border bg-bg-elev px-3 py-2 text-sm text-fg outline-none focus:border-accent", className),
		...props
	});
}
//#endregion
export { Textarea as i, Label as n, Select as r, Input as t };
