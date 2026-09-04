import { b as require_jsx_runtime, d as useRouterState, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { g as useLocale } from "./functions-D1fgtqih.mjs";
import { a as Radio, d as Activity, l as ChartLine, o as LayoutDashboard, r as ShieldCheck, s as Globe, t as Waypoints, u as BookOpen } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-nfsQvvNB.js
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function fmtUsd(n, digits = 2) {
	if (!Number.isFinite(n)) return "—";
	const sign = n < 0 ? "-" : "";
	const abs = Math.abs(n);
	if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
	if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(abs >= 1e8 ? 1 : 2)}M`;
	return `${sign}$${abs.toLocaleString("en-US", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	})}`;
}
function fmtPct(n, digits = 1) {
	if (!Number.isFinite(n)) return "—";
	return `${n.toFixed(digits)}%`;
}
function fmtR(n, digits = 2) {
	if (!Number.isFinite(n)) return "—";
	return `${n > 0 ? "+" : ""}${n.toFixed(digits)}R`;
}
function fmtPx(n) {
	if (!Number.isFinite(n) || n === 0) return n === 0 ? "0" : "—";
	const abs = Math.abs(n);
	if (abs >= 1e3) return n.toFixed(2);
	if (abs >= 1) return n.toFixed(4);
	if (abs >= .01) return n.toFixed(6);
	return n.toPrecision(4);
}
function timeAgo(iso, locale = "en") {
	if (!iso) return locale === "fa" ? "هرگز" : "never";
	const t = new Date(iso).getTime();
	if (!Number.isFinite(t)) return "—";
	const s = Math.max(0, Math.round((Date.now() - t) / 1e3));
	if (s < 10) return locale === "fa" ? "الان" : "now";
	if (s < 60) return locale === "fa" ? `${s} ثانیه` : `${s}s`;
	const m = Math.round(s / 60);
	if (m < 60) return locale === "fa" ? `${m} دقیقه` : `${m}m`;
	const h = Math.round(m / 60);
	if (h < 36) return locale === "fa" ? `${h} ساعت` : `${h}h`;
	const d = Math.round(h / 24);
	return locale === "fa" ? `${d} روز` : `${d}d`;
}
function fmtBarOpen(t) {
	if (t == null || t === "") return "—";
	const ms = typeof t === "number" ? t : /^\d+$/.test(String(t)) ? Number(t) : Date.parse(String(t));
	if (!Number.isFinite(ms) || ms <= 0) return "—";
	return new Date(ms).toISOString().replace("T", " ").slice(0, 16);
}
function fmtWhen(iso, locale = "en") {
	if (!iso) return "—";
	const d = new Date(iso);
	if (!Number.isFinite(d.getTime())) return "—";
	return d.toLocaleString(locale === "fa" ? "fa-IR" : "en-GB", {
		hour12: false,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit"
	});
}
function fmtDuration(ms, locale) {
	if (!Number.isFinite(ms) || ms < 0) return "—";
	const s = Math.round(ms / 1e3);
	if (s < 90) return locale === "fa" ? `${s} ثانیه` : `${s}s`;
	const m = Math.round(s / 60);
	if (m < 90) return locale === "fa" ? `${m} دقیقه` : `${m}m`;
	const h = m / 60;
	if (h < 36) {
		const t = h >= 10 ? h.toFixed(0) : h.toFixed(1);
		return locale === "fa" ? `${t} ساعت` : `${t}h`;
	}
	const d = h / 24;
	const t = d >= 10 ? d.toFixed(0) : d.toFixed(1);
	return locale === "fa" ? `${t} روز` : `${t}d`;
}
function usdToMillions(usd) {
	if (!Number.isFinite(usd) || usd <= 0) return 0;
	return Math.round(usd / 1e6);
}
function millionsToUsd(m) {
	if (!Number.isFinite(m) || m <= 0) return 0;
	return m * 1e6;
}
var NAV = [
	{
		to: "/",
		key: "desk",
		icon: LayoutDashboard
	},
	{
		to: "/signals",
		key: "signals",
		icon: Activity
	},
	{
		to: "/journal",
		key: "journal",
		icon: BookOpen
	},
	{
		to: "/backtest",
		key: "backtest",
		icon: ChartLine
	},
	{
		to: "/universe",
		key: "universe",
		icon: Globe
	},
	{
		to: "/venues",
		key: "venues",
		icon: Waypoints
	},
	{
		to: "/always-on",
		key: "alwaysOn",
		icon: Radio
	},
	{
		to: "/audit",
		key: "audit",
		icon: ShieldCheck
	}
];
function DeskShell({ children, status }) {
	const { t, locale, setLocale } = useLocale();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_circle_at_10%_-10%,color-mix(in_oklab,var(--color-long)_12%,transparent),transparent_55%)]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex min-w-0 items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-9 place-items-center rounded-sm border border-border bg-surface",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-lg leading-none text-long",
								children: "A"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block font-display text-lg leading-tight tracking-tight",
								children: t.brand
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden text-xs text-muted sm:block",
								children: t.tagline
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ms-auto flex items-center gap-2",
						children: [status, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-11 rounded-sm border border-border px-3 text-xs text-muted hover:text-fg",
							onClick: () => setLocale(locale === "fa" ? "en" : "fa"),
							children: locale === "fa" ? "EN" : "فا"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2 sm:px-6",
					children: NAV.map((item) => {
						const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							className: cn("flex h-10 shrink-0 items-center gap-2 rounded-sm px-3 text-sm transition-colors", active ? "bg-surface text-fg" : "text-muted hover:bg-surface-2 hover:text-fg"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-4",
								strokeWidth: 1.75
							}), t[item.key]]
						}, item.to);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "relative mx-auto min-w-0 max-w-7xl overflow-x-clip px-4 py-6 sm:px-6 sm:py-8",
				children
			})
		]
	});
}
//#endregion
export { fmtPct as a, fmtUsd as c, timeAgo as d, usdToMillions as f, fmtDuration as i, fmtWhen as l, cn as n, fmtPx as o, fmtBarOpen as r, fmtR as s, DeskShell as t, millionsToUsd as u };
