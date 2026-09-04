import { defaultMaxLeverage } from "@/lib/market/binance";
import type { VenueId } from "@/lib/engine/types";
import { capLeverage } from "./lev-cap";
import { fetchLighterMarkets } from "./lighter";
import { coinOf } from "./meta";

export { capLeverage, LEV_CAP } from "./lev-cap";

type LevMap = Record<string, number>;

let cache: {
  at: number;
  maps: { hyperliquid: LevMap; lighter: LevMap; toobit: LevMap; aster: LevMap };
} | null = null;

function put(map: LevMap, symbolOrCoin: string, lev: number) {
  const coin = coinOf(symbolOrCoin);
  if (!coin || !(lev > 0)) return;
  map[coin] = Math.max(map[coin] ?? 0, capLeverage(lev));
}

async function fetchHyperliquidMap(): Promise<LevMap> {
  const map: LevMap = {};
  try {
    const res = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "meta" }),
    });
    if (!res.ok) return map;
    const json = (await res.json()) as { universe?: Array<{ name: string; maxLeverage: number }> };
    for (const u of json.universe ?? []) put(map, u.name, u.maxLeverage);
  } catch {
    /* public meta down */
  }
  return map;
}

async function fetchLighterMap(): Promise<LevMap> {
  const map: LevMap = {};
  try {
    const rows = await fetchLighterMarkets();
    for (const r of rows) put(map, r.coin, r.maxLeverage);
  } catch {
    /* public books down */
  }
  return map;
}

async function fetchToobitMap(): Promise<LevMap> {
  const map: LevMap = {};
  try {
    const res = await fetch("https://api.toobit.com/api/v1/exchangeInfo", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return map;
    const json = (await res.json()) as {
      contracts?: Array<{ symbol: string; riskLimits?: Array<{ maxLeverage?: string }> }>;
    };
    for (const c of json.contracts ?? []) {
      const best = Math.max(0, ...(c.riskLimits ?? []).map((r) => Number(r.maxLeverage ?? 0)));
      put(map, c.symbol, best);
    }
  } catch {
    /* public info down */
  }
  return map;
}

async function fetchAsterMap(): Promise<LevMap> {
  const map: LevMap = {};
  try {
    const res = await fetch("https://fapi.asterdex.com/fapi/v1/exchangeInfo", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return map;
    const json = (await res.json()) as {
      symbols?: Array<{
        symbol: string;
        requiredMarginPercent?: string;
        maintMarginPercent?: string;
        filters?: Array<{ filterType: string; multiplierUp?: string }>;
      }>;
    };
    for (const s of json.symbols ?? []) {
      const pct = Number(s.requiredMarginPercent ?? 0);
      // requiredMarginPercent is maintenance-style (BTC 5% → 20x), not the max.
      // Use the better of that and the known Binance-family cap so paper/live
      // without a signed bracket still gets a high but legal number.
      const fromPct = pct > 0 ? 100 / pct : 0;
      put(map, s.symbol, Math.max(fromPct, defaultMaxLeverage(s.symbol)));
    }
  } catch {
    /* public info down */
  }
  return map;
}

export async function loadPublicLeverageMaps() {
  const now = Date.now();
  if (cache && now - cache.at < 10 * 60_000) return cache.maps;
  const [hyperliquid, lighter, toobit, aster] = await Promise.all([
    fetchHyperliquidMap(),
    fetchLighterMap(),
    fetchToobitMap(),
    fetchAsterMap(),
  ]);
  cache = { at: now, maps: { hyperliquid, lighter, toobit, aster } };
  return cache.maps;
}

/** Highest public max across the four venues — used for paper sizing. Capped at 200. */
export async function publicMaxLeverage(symbol: string): Promise<number> {
  const maps = await loadPublicLeverageMaps();
  const coin = coinOf(symbol);
  const best = Math.max(
    maps.hyperliquid[coin] ?? 0,
    maps.lighter[coin] ?? 0,
    maps.toobit[coin] ?? 0,
    maps.aster[coin] ?? 0,
    defaultMaxLeverage(symbol),
  );
  return capLeverage(best, 25);
}

export async function venueMaxLeverage(venue: VenueId, symbol: string): Promise<number> {
  if (venue === "paper") return publicMaxLeverage(symbol);
  const maps = await loadPublicLeverageMaps();
  const coin = coinOf(symbol);
  if (venue === "hyperliquid") return capLeverage(maps.hyperliquid[coin] || defaultMaxLeverage(symbol));
  if (venue === "lighter") return capLeverage(maps.lighter[coin] || defaultMaxLeverage(symbol));
  if (venue === "toobit") return capLeverage(maps.toobit[coin] || defaultMaxLeverage(symbol));
  if (venue === "aster") return capLeverage(maps.aster[coin] || defaultMaxLeverage(symbol));
  return capLeverage(defaultMaxLeverage(symbol));
}
