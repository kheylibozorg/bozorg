import type { VenueId } from "../engine/types";

export const VENUE_META: Array<{
  id: VenueId;
  label: string;
  kind: "dex" | "cex" | "sim";
  blurbFa: string;
  blurbEn: string;
  docs: string;
}> = [
  {
    id: "paper",
    label: "Paper",
    kind: "sim",
    blurbFa: "کاغذی. جهان ارز و چارت از پرپچوال‌های زندهٔ آستر — بدون کلید. بایننس فقط پشتیبان کندل است.",
    blurbEn: "Simulated fills. Universe and charts from live Aster perps. No keys. Binance is a candle fallback only.",
    docs: "",
  },
  {
    id: "hyperliquid",
    label: "Hyperliquid",
    kind: "dex",
    blurbFa: "پرپچوال آن‌چین. بعد از وصل، لیست ارز و چارت از خود هایپرلیکوئید است. کلید ایجنت + آدرس اصلی.",
    blurbEn: "On-chain perps. After connect, listed coins and charts come from Hyperliquid itself. Agent key + master address.",
    docs: "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api",
  },
  {
    id: "lighter",
    label: "Lighter",
    kind: "dex",
    blurbFa: "صرافی zk. لیست بازار و کندل از خود لایتر. کلید API + ایندکس حساب.",
    blurbEn: "zk DEX. Markets and candles from Lighter itself. API key + account index.",
    docs: "https://apidocs.lighter.xyz/docs/get-started",
  },
  {
    id: "aster",
    label: "Aster",
    kind: "dex",
    blurbFa: "پرپچوال غیرمتمرکز. فقط ارزهای لیست‌شده روی آستر، روی چارت آستر.",
    blurbEn: "Perp DEX. Only Aster-listed perps, scanned on Aster candles.",
    docs: "https://docs.asterdex.com/for-developers/aster-api/api-documentation",
  },
  {
    id: "toobit",
    label: "Toobit",
    kind: "cex",
    blurbFa: "صرافی متمرکز USDT-M. جهان ارز و چارت از خود توبیت (جفت SWAP).",
    blurbEn: "Centralized USDT-M. Universe and charts from Toobit swap contracts.",
    docs: "https://api-docs.toobit.com/",
  },
];

export const LIVE_VENUES: Exclude<VenueId, "paper">[] = ["hyperliquid", "lighter", "aster", "toobit"];

const STABLES = new Set(["USDT", "USDC", "DAI", "FDUSD", "USDE", "USDS", "BUSD", "TUSD", "PYUSD"]);

export const FALLBACK_BASES = ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "ADA", "TRX", "AVAX", "LINK"] as const;

/** True when the stored book is the 10-coin emergency list, not a live venue book. */
export function looksLikeFallbackUniverse(rows: Array<{ base: string }>) {
  if (rows.length !== FALLBACK_BASES.length) return false;
  const want = new Set<string>(FALLBACK_BASES);
  return rows.every((r) => want.has(r.base.toUpperCase()));
}

export function coinOf(symbol: string) {
  return symbol.replace(/USDT|USDC|-SWAP-|-PERP/gi, "").replace(/[-_/]/g, "").toUpperCase();
}

/** Base coin if this row is a tradeable perp on a USDT-margined book. Empty string = skip. */
export function isTradeableBase(raw: string) {
  const base = coinOf(raw) || raw.toUpperCase().replace(/[^A-Z0-9:]/g, "");
  if (!base || base.length < 2 || base.length > 16) return "";
  if (STABLES.has(base)) return "";
  if (base.includes(":")) return "";
  return base;
}

/** How that venue names the perp on its own book / chart. */
export function nativeSymbol(venue: VenueId, symbolOrBase: string) {
  const base = coinOf(symbolOrBase);
  if (venue === "toobit") return `${base}-SWAP-USDT`;
  if (venue === "hyperliquid" || venue === "lighter") return base;
  return `${base}USDT`;
}

export function chartHostLabel(venue: VenueId) {
  if (venue === "paper") return "Aster";
  if (venue === "hyperliquid") return "Hyperliquid";
  if (venue === "lighter") return "Lighter";
  if (venue === "aster") return "Aster";
  return "Toobit";
}

/** Book + candles follow the selected venue even in paper mode. Live only gates real orders. */
export function bookVenue(venue: string | null | undefined): VenueId {
  if (venue === "hyperliquid" || venue === "lighter" || venue === "aster" || venue === "toobit" || venue === "paper") {
    return venue;
  }
  return "paper";
}

export function venueLabel(venue: string | null | undefined) {
  const id = bookVenue(venue);
  return VENUE_META.find((v) => v.id === id)?.label ?? id;
}
