import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as setDeskPin, g as useLocale, h as unlockDesk, i as lockDesk } from "./functions-zXYqw9Df.mjs";
import { t as Button } from "./button-Cl7s1nXS.mjs";
import { n as Label, t as Input } from "./field-LgWUhHTe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lock-panel-C014QUAa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LockPanel({ hasPin, unlocked }) {
	const { locale } = useLocale();
	const router = useRouter();
	const [pin, setPin] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [err, setErr] = (0, import_react.useState)(null);
	const fa = locale === "fa";
	async function submit() {
		setBusy(true);
		setErr(null);
		try {
			if (hasPin) await unlockDesk({ data: { pin } });
			else await setDeskPin({ data: { pin } });
			setPin("");
			await router.invalidate({ sync: true });
		} catch (e) {
			setErr(e instanceof Error ? e.message : "failed");
		} finally {
			setBusy(false);
		}
	}
	async function lock() {
		setBusy(true);
		try {
			await lockDesk();
			await router.invalidate({ sync: true });
		} finally {
			setBusy(false);
		}
	}
	if (unlocked) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-long/30 bg-long-dim/40 p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-fg",
			children: fa ? "میز باز است. توکن کرون و کلیدها فقط برای تو دیده می‌شوند. قبل از بستن تب، قفل کن." : "Desk unlocked. Cron token and key hints are visible only in this session. Lock before sharing the link."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "outline",
			onClick: lock,
			disabled: busy,
			children: fa ? "قفل کردن" : "Lock"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-warn/40 bg-surface p-4 shadow-panel",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-medium",
				children: hasPin ? fa ? "میز قفل است" : "Desk is locked" : fa ? "یک پین اپراتور بگذار" : "Set an operator PIN"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 max-w-2xl text-sm text-muted",
				children: hasPin ? fa ? "لینک این میز عمومی است. بدون پین کسی نمی‌تواند کلید، توکن کرون، یا حالت زنده را عوض کند." : "This URL is public. Without the PIN nobody can change keys, the cron token, or live mode." : fa ? "الان هر کسی که لینک را داشته باشد می‌تواند همه چیز را عوض کند — از جمله چسباندن کلید API. حداقل ۶ کاراکتر. این پین را جای امن نگه دار." : "Right now anyone with this link can change everything — including pasting API keys. 6+ characters. Store it offline."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-3 flex flex-wrap items-end gap-2",
				onSubmit: (e) => {
					e.preventDefault();
					submit();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid min-w-48 flex-1 gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "desk-pin",
						children: fa ? "پین" : "PIN"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "desk-pin",
						type: "password",
						autoComplete: "current-password",
						value: pin,
						onChange: (e) => setPin(e.target.value),
						placeholder: fa ? "حداقل ۶ کاراکتر" : "6+ characters"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					disabled: busy || pin.trim().length < 6,
					children: busy ? "…" : hasPin ? fa ? "باز کردن" : "Unlock" : fa ? "ثبت پین" : "Set PIN"
				})]
			}),
			err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-short",
				children: err
			}) : null
		]
	});
}
//#endregion
export { LockPanel as t };
