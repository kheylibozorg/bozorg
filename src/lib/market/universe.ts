import type { VenueId } from "@/lib/engine/types";
import { coinOf, FALLBACK_BASES, looksLikeFallbackUniverse } from "@/lib/exchanges/meta";
import { defaultMaxLeverage } from "./binance";
import { fetchListedMarkets } from "./venues";

export type Asset = {
  symbol: string;
  base: string;
  name: string;
  marketCapUsd: number;
  volume24hUsd: number;
  maxLeverage: number;
  venueSymbol?: string;
};

const FALLBACK: Asset[] = [
  { symbol: "BTCUSDT", base: "BTC", name: "Bitcoin", marketCapUsd: 1.7e12, volume24hUsd: 4e10, maxLeverage: 125, venueSymbol: "BTCUSDT" },
  { symbol: "ETHUSDT", base: "ETH", name: "Ethereum", marketCapUsd: 4.2e11, volume24hUsd: 2e10, maxLeverage: 100, venueSymbol: "ETHUSDT" },
  { symbol: "BNBUSDT", base: "BNB", name: "BNB", marketCapUsd: 1.1e11, volume24hUsd: 2e9, maxLeverage: 75, venueSymbol: "BNBUSDT" },
  { symbol: "SOLUSDT", base: "SOL", name: "Solana", marketCapUsd: 9e10, volume24hUsd: 4e9, maxLeverage: 75, venueSymbol: "SOLUSDT" },
  { symbol: "XRPUSDT", base: "XRP", name: "XRP", marketCapUsd: 1.4e11, volume24hUsd: 3e9, maxLeverage: 75, venueSymbol: "XRPUSDT" },
  { symbol: "DOGEUSDT", base: "DOGE", name: "Dogecoin", marketCapUsd: 3.5e10, volume24hUsd: 2e9, maxLeverage: 75, venueSymbol: "DOGEUSDT" },
  { symbol: "ADAUSDT", base: "ADA", name: "Cardano", marketCapUsd: 2.5e10, volume24hUsd: 8e8, maxLeverage: 75, venueSymbol: "ADAUSDT" },
  { symbol: "TRXUSDT", base: "TRX", name: "TRON", marketCapUsd: 2.4e10, volume24hUsd: 7e8, maxLeverage: 50, venueSymbol: "TRXUSDT" },
  { symbol: "AVAXUSDT", base: "AVAX", name: "Avalanche", marketCapUsd: 1.2e10, volume24hUsd: 5e8, maxLeverage: 50, venueSymbol: "AVAXUSDT" },
  { symbol: "LINKUSDT", base: "LINK", name: "Chainlink", marketCapUsd: 1.3e10, volume24hUsd: 6e8, maxLeverage: 50, venueSymbol: "LINKUSDT" },
];

type GeckoRow = {
  id: string;
  symbol: string;
  name: string;
  market_cap: number;
  total_volume: number;
};

const SKIP = new Set([
  "usdt", "usdc", "dai", "fdusd", "usde", "usds", "busd", "tusd", "pyusd",
  "wbtc", "steth", "wsteth", "weeth", "cbbtc", "weth",
]);

function toAssets(
  rows: Array<{ symbol: string; name: string; marketCap: number; volume: number }>,
  minMcap: number,
): Asset[] {
  const out: Asset[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const base = r.symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!base || base.length > 12) continue;
    if (SKIP.has(base.toLowerCase())) continue;
    if (seen.has(base)) continue;
    if (minMcap > 0 && (!r.marketCap || r.marketCap < minMcap)) continue;
    seen.add(base);
    const symbol = `${base}USDT`;
    out.push({
      symbol,
      base,
      name: r.name,
      marketCapUsd: r.marketCap,
      volume24hUsd: r.volume ?? 0,
      maxLeverage: defaultMaxLeverage(symbol),
      venueSymbol: symbol,
    });
  }
  return out;
}

async function fromCoinGecko(minMcap: number): Promise<Asset[]> {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false";
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error("coingecko");
  const rows = (await res.json()) as GeckoRow[];
  if (!Array.isArray(rows)) throw new Error("coingecko shape");
  return toAssets(
    rows.map((r) => ({
      symbol: r.symbol,
      name: r.name,
      marketCap: r.market_cap,
      volume: r.total_volume ?? 0,
    })),
    minMcap,
  );
}

async function fromCoinPaprika(minMcap: number): Promise<Asset[]> {
  const res = await fetch("https://api.coinpaprika.com/v1/tickers?quotes=USD", {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error("coinpaprika");
  const rows = (await res.json()) as Array<{
    symbol: string;
    name: string;
    rank?: number;
    quotes?: { USD?: { market_cap?: number; volume_24h?: number } };
  }>;
  if (!Array.isArray(rows)) throw new Error("coinpaprika shape");
  const ranked = [...rows].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999)).slice(0, 250);
  return toAssets(
    ranked.map((r) => ({
      symbol: r.symbol,
      name: r.name,
      marketCap: Number(r.quotes?.USD?.market_cap ?? 0),
      volume: Number(r.quotes?.USD?.volume_24h ?? 0),
    })),
    minMcap,
  );
}

/** Names + market caps only — never the tradeable set. The venue book is the source of truth. */
export async function fetchUniverse(minMcap: number): Promise<Asset[]> {
  for (const src of [fromCoinGecko, fromCoinPaprika]) {
    try {
      const out = await src(minMcap);
      if (out.length >= 8) return out;
    } catch {
      /* next source */
    }
  }
  return FALLBACK.filter((a) => minMcap <= 0 || a.marketCapUsd >= minMcap);
}

async function metaByBase(): Promise<Map<string, { name: string; marketCapUsd: number; volume24hUsd: number }>> {
  const map = new Map<string, { name: string; marketCapUsd: number; volume24hUsd: number }>();
  try {
    const assets = await fetchUniverse(0);
    for (const a of assets) {
      map.set(a.base, { name: a.name, marketCapUsd: a.marketCapUsd, volume24hUsd: a.volume24hUsd });
    }
  } catch {
    for (const a of FALLBACK) {
      map.set(a.base, { name: a.name, marketCapUsd: a.marketCapUsd, volume24hUsd: a.volume24hUsd });
    }
  }
  return map;
}

/** Every listed perp on the connected venue. Paper = Aster ∪ Binance USDT-M perps. Cap filter is applied by the caller. */
export async function fetchVenueUniverse(venue: VenueId, force = false): Promise<Asset[]> {
  const listed = await fetchListedMarkets(venue, force);
  const meta = await metaByBase().catch(
    () => new Map<string, { name: string; marketCapUsd: number; volume24hUsd: number }>(),
  );
  const out: Asset[] = [];
  const seen = new Set<string>();
  for (const row of listed) {
    const base = coinOf(row.base) || row.base;
    if (!base || seen.has(base)) continue;
    seen.add(base);
    const m = meta.get(base);
    out.push({
      symbol: row.symbol,
      base,
      name: m?.name ?? base,
      marketCapUsd: m?.marketCapUsd ?? 0,
      volume24hUsd: row.volume24hUsd || m?.volume24hUsd || 0,
      maxLeverage: row.maxLeverage || defaultMaxLeverage(row.symbol),
      venueSymbol: row.venueSymbol || row.symbol,
    });
  }
  out.sort((a, b) => b.marketCapUsd - a.marketCapUsd || a.base.localeCompare(b.base));
  return out;
}

/** 0 = no floor (trade every listed perp). Unknown caps are kept only when no coin has cap data. */
export function filterByMinCap<T>(assets: T[], minMcap: number, capOf: (row: T) => number): T[] {
  const floor = Number(minMcap);
  if (!Number.isFinite(floor) || floor <= 0) return assets;
  const known = assets.filter((a) => capOf(a) > 0);
  if (!known.length) return assets;
  return assets.filter((a) => capOf(a) >= floor);
}

export function minCapUsd(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n;
}

export { FALLBACK as FALLBACK_UNIVERSE, looksLikeFallbackUniverse, FALLBACK_BASES };
