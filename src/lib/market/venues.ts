import { type Bar, type KlineTf, type VenueId } from "@/lib/engine/types";
import { fetchLighterMarkets } from "@/lib/exchanges/lighter";
import { coinOf, nativeSymbol } from "@/lib/exchanges/meta";
import { getAdapter } from "@/lib/exchanges/registry";
import type { ListedMarket } from "@/lib/exchanges/types";
import { fetchKlines as fetchPaperKlines, fetchLastPrice as fetchPaperLastPrice } from "./binance";
import { usdtPerpSymbols } from "./perps";
import {
  barFromBinanceRow,
  barFromHlCandle,
  barFromLighterCandle,
  klineWindow,
  sortBars,
} from "./ohlcv";

export type { ListedMarket };

export { barFromBinanceRow, barFromHlCandle, barFromLighterCandle, klineWindow, sortBars };

const LIGHTER_TF: Record<KlineTf, string | null> = {
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
  "1w": "1w",
};

type Cache<T> = { at: number; value: T };
const listedCache = new Map<VenueId, Cache<ListedMarket[]>>();
const LISTED_TTL_MS = 15 * 60_000;

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  let lastErr: Error | null = null;
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
      signal: init?.signal ?? AbortSignal.timeout(12_000),
    });
    if (res.status === 429 || res.status === 418) {
      lastErr = new Error(`market ${res.status}`);
      await new Promise((r) => setTimeout(r, 350 * (i + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`market ${res.status}`);
    return res.json() as Promise<T>;
  }
  throw lastErr ?? new Error("market 429");
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  return getJson<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
}

async function fetchPaperListed(): Promise<ListedMarket[]> {
  const adapter = getAdapter("aster");
  if (adapter) {
    try {
      const rows = await adapter.listMarkets();
      if (rows.length >= 8) return rows;
    } catch {
      /* Aster public book failed — try Binance-family union */
    }
  }
  const perps = await usdtPerpSymbols();
  return [...perps].map((symbol) => {
    const base = coinOf(symbol);
    return {
      base,
      symbol,
      venueSymbol: symbol,
      volume24hUsd: 0,
      maxLeverage: 0,
    };
  });
}

async function listedFromVenue(venue: VenueId): Promise<ListedMarket[]> {
  if (venue === "paper") return fetchPaperListed();
  const adapter = getAdapter(venue);
  if (!adapter) return fetchPaperListed();
  return adapter.listMarkets();
}

/** Public listed perps on that venue. Throws if the venue book cannot be read. */
export async function fetchListedMarkets(venue: VenueId, force = false): Promise<ListedMarket[]> {
  const hit = listedCache.get(venue);
  if (!force && hit && Date.now() - hit.at < LISTED_TTL_MS && hit.value.length) return hit.value;
  const rows = await listedFromVenue(venue);
  const cleaned = rows.filter((r) => r.base);
  if (cleaned.length < 8) throw new Error(`${venue} listed markets empty`);
  listedCache.set(venue, { at: Date.now(), value: cleaned });
  return cleaned;
}

export function clearListedCache(venue?: VenueId) {
  if (venue) listedCache.delete(venue);
  else listedCache.clear();
}

async function fetchAsterKlines(symbol: string, tf: KlineTf, limit: number): Promise<Bar[]> {
  const q = new URLSearchParams({
    symbol: nativeSymbol("aster", symbol),
    interval: tf,
    limit: String(Math.min(1500, limit)),
  });
  const rows = await getJson<Array<Array<number | string>>>(`https://fapi.asterdex.com/fapi/v1/klines?${q}`);
  return sortBars((rows ?? []).map(barFromBinanceRow).filter((b): b is Bar => Boolean(b)), limit);
}

async function fetchToobitKlines(symbol: string, tf: KlineTf, limit: number): Promise<Bar[]> {
  const { start, end, count } = klineWindow(tf, Math.min(1000, limit));
  const q = new URLSearchParams({
    symbol: nativeSymbol("toobit", symbol),
    interval: tf,
    limit: String(count),
    startTime: String(start),
    endTime: String(end),
  });
  const rows = await getJson<Array<Array<number | string>>>(`https://api.toobit.com/quote/v1/klines?${q}`);
  return sortBars((Array.isArray(rows) ? rows : []).map(barFromBinanceRow).filter((b): b is Bar => Boolean(b)), limit);
}

async function fetchHyperliquidKlines(symbol: string, tf: KlineTf, limit: number): Promise<Bar[]> {
  const { start, end } = klineWindow(tf, Math.min(5000, limit));
  const rows = await postJson<Array<Parameters<typeof barFromHlCandle>[0]>>("https://api.hyperliquid.xyz/info", {
    type: "candleSnapshot",
    req: { coin: nativeSymbol("hyperliquid", symbol), interval: tf, startTime: start, endTime: end },
  });
  return sortBars((Array.isArray(rows) ? rows : []).map(barFromHlCandle).filter((b): b is Bar => Boolean(b)), limit);
}

async function fetchLighterKlines(symbol: string, tf: KlineTf, limit: number): Promise<Bar[]> {
  const resolutions = tf === "1w" ? ["1w", "7d", "1d"] : [LIGHTER_TF[tf]];
  const markets = await fetchLighterMarkets();
  const base = coinOf(symbol);
  const row = markets.find((m) => m.coin === base);
  if (!row) return [];
  for (const resolution of resolutions) {
    if (!resolution) continue;
    try {
      const { start, end, count } = klineWindow(tf, Math.min(500, limit));
      const q = new URLSearchParams({
        market_id: String(row.marketIndex),
        resolution,
        start_timestamp: String(start),
        end_timestamp: String(end),
        count_back: String(count),
      });
      const json = await getJson<{ c?: Array<Parameters<typeof barFromLighterCandle>[0]> }>(
        `https://mainnet.zklighter.elliot.ai/api/v1/candles?${q}`,
      );
      const bars = sortBars((json.c ?? []).map(barFromLighterCandle).filter((b): b is Bar => Boolean(b)), limit);
      if (bars.length) return bars;
    } catch {
      /* try next resolution */
    }
  }
  return [];
}

export async function fetchVenueKlines(
  venue: VenueId,
  symbol: string,
  tf: KlineTf,
  limit = 360,
): Promise<Bar[]> {
  if (venue === "hyperliquid") return fetchHyperliquidKlines(symbol, tf, limit);
  if (venue === "lighter") return fetchLighterKlines(symbol, tf, limit);
  if (venue === "aster") return fetchAsterKlines(symbol, tf, limit);
  if (venue === "toobit") return fetchToobitKlines(symbol, tf, limit);
  return fetchPaperKlines(symbol, tf, limit);
}

export async function fetchVenueLastPrice(venue: VenueId, symbol: string): Promise<number> {
  const base = coinOf(symbol);
  if (venue === "hyperliquid") {
    const mids = await postJson<Record<string, string>>("https://api.hyperliquid.xyz/info", { type: "allMids" });
    const n = Number(mids[base] ?? mids[nativeSymbol("hyperliquid", symbol)] ?? NaN);
    if (Number.isFinite(n)) return n;
  } else if (venue === "lighter") {
    const markets = await fetchLighterMarkets();
    const row = markets.find((m) => m.coin === base);
    if (row && row.lastPrice > 0) return row.lastPrice;
  } else if (venue === "aster") {
    const t = await getJson<{ price: string }>(
      `https://fapi.asterdex.com/fapi/v1/ticker/price?symbol=${nativeSymbol("aster", symbol)}`,
    );
    const n = Number(t.price);
    if (Number.isFinite(n)) return n;
  } else if (venue === "toobit") {
    const rows = await getJson<Array<{ s?: string; c?: string }>>("https://api.toobit.com/quote/v1/contract/ticker/24hr");
    const hit = rows.find((r) => r.s?.toUpperCase() === nativeSymbol("toobit", symbol));
    const n = Number(hit?.c);
    if (Number.isFinite(n)) return n;
  } else {
    return fetchPaperLastPrice(symbol);
  }
  const bars = await fetchVenueKlines(venue, symbol, "5m", 2);
  return bars[bars.length - 1]?.close ?? NaN;
}
