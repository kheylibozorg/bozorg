import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtUsd(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(abs >= 1e8 ? 1 : 2)}M`;
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function fmtPct(n: number, digits = 1) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function fmtR(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}R`;
}

export function fmtPx(n: number) {
  if (!Number.isFinite(n) || n === 0) return n === 0 ? "0" : "—";
  const abs = Math.abs(n);
  if (abs >= 1000) return n.toFixed(2);
  if (abs >= 1) return n.toFixed(4);
  if (abs >= 0.01) return n.toFixed(6);
  return n.toPrecision(4);
}

export function timeAgo(iso: string | null | undefined, locale: "fa" | "en" = "en") {
  if (!iso) return locale === "fa" ? "هرگز" : "never";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 10) return locale === "fa" ? "الان" : "now";
  if (s < 60) return locale === "fa" ? `${s} ثانیه` : `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return locale === "fa" ? `${m} دقیقه` : `${m}m`;
  const h = Math.round(m / 60);
  if (h < 36) return locale === "fa" ? `${h} ساعت` : `${h}h`;
  const d = Math.round(h / 24);
  return locale === "fa" ? `${d} روز` : `${d}d`;
}

export function fmtBarOpen(t: number | string | null | undefined) {
  if (t == null || t === "") return "—";
  const ms =
    typeof t === "number"
      ? t
      : /^\d+$/.test(String(t))
        ? Number(t)
        : Date.parse(String(t));
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  return new Date(ms).toISOString().replace("T", " ").slice(0, 16);
}

export function fmtWhen(iso: string | null | undefined, locale: "fa" | "en" = "en") {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString(locale === "fa" ? "fa-IR" : "en-GB", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDuration(ms: number, locale: "fa" | "en") {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const s = Math.round(ms / 1000);
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

export function usdToMillions(usd: number) {
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return Math.round(usd / 1e6);
}

export function millionsToUsd(m: number) {
  if (!Number.isFinite(m) || m <= 0) return 0;
  return m * 1e6;
}
