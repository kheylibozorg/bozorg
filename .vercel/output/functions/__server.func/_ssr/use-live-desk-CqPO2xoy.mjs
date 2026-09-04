import { o as __toESM } from "../_runtime.mjs";
import { R as venueLabel } from "./tick.server-DYwNr8MZ.mjs";
import { B as require_react, b as require_jsx_runtime, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { g as useLocale, m as tickNow } from "./functions-D1fgtqih.mjs";
import { d as timeAgo } from "./shell-nfsQvvNB.mjs";
import { t as Badge } from "./badge-CcZoPOMs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-live-desk-CqPO2xoy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StatusChip({ botEnabled, mode, venue, lastTickAt, lastTickSource, durable }) {
	const { t, locale } = useLocale();
	const stale = !lastTickAt || Date.now() - new Date(lastTickAt).getTime() > 9e4;
	const live24 = botEnabled && !stale;
	const book = venueLabel(venue);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hidden items-center gap-2 sm:flex",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: botEnabled ? "long" : "muted",
				children: botEnabled ? t.botOn : t.botOff
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: mode === "live" ? "short" : "fg",
				children: mode === "live" ? t.live : t.paper
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: "fg",
				children: book
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: live24 ? "long" : "warn",
				children: live24 ? "24h" : "idle"
			}),
			durable != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: durable ? "long" : "warn",
				children: durable ? "Neon" : "preview"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-xs text-subtle",
				children: [
					t.lastTick,
					" ",
					timeAgo(lastTickAt, locale),
					lastTickSource ? ` · ${lastTickSource}` : ""
				]
			})
		]
	});
}
/** Reload loaders without sending the viewport back to the top. */
function invalidateQuiet(router, opts) {
	const scroll = router._scroll;
	if (scroll) scroll.next = false;
	const x = window.scrollX;
	const y = window.scrollY;
	return router.invalidate(opts).finally(() => {
		if (window.scrollX === x && window.scrollY === y) return;
		window.scrollTo(x, y);
		requestAnimationFrame(() => window.scrollTo(x, y));
	});
}
/** Keep the desk in sync with server-side cron fills while the page is open. */
function useLiveDesk(ms = 2e4) {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => {
			invalidateQuiet(router);
		}, ms);
		return () => window.clearInterval(id);
	}, [router, ms]);
}
/**
* If Cloudflare is late and this tab is open + unlocked, fire a catch-up tick.
* Browser-closed trading still depends on Cloudflare / cron-job.org.
*/
function useCronWatchdog(opts) {
	const router = useRouter();
	const lastTickAt = opts.lastTickAt;
	const running = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (!opts.enabled) return;
		const id = window.setInterval(() => {
			if (running.current) return;
			const last = lastTickAt ? new Date(lastTickAt).getTime() : 0;
			if (last && Date.now() - last < 8e4) return;
			running.current = true;
			tickNow({ data: { source: "watchdog" } }).then(() => invalidateQuiet(router)).catch(() => void 0).finally(() => {
				running.current = false;
			});
		}, 6e4);
		return () => window.clearInterval(id);
	}, [
		opts.enabled,
		lastTickAt,
		router
	]);
}
//#endregion
export { useCronWatchdog as n, useLiveDesk as r, StatusChip as t };
