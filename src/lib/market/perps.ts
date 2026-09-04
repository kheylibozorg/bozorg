/** USDT-M perpetual symbols that actually have klines (Binance / Aster). */

type Cache = { at: number; symbols: Set<string> };

const TTL_MS = 30 * 60_000;
let cache: Cache | null = null;
const hostCache = new Map<string, Cache>();

async function fromHost(url: string): Promise<string[]> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`exchangeInfo ${res.status}`);
  const json = (await res.json()) as {
    symbols?: Array<{
      symbol?: string;
      status?: string;
      contractType?: string;
      quoteAsset?: string;
    }>;
  };
  const out: string[] = [];
  for (const s of json.symbols ?? []) {
    if (!s.symbol || !s.symbol.endsWith("USDT")) continue;
    if (s.status && s.status !== "TRADING") continue;
    if (s.contractType && s.contractType !== "PERPETUAL") continue;
    if (s.quoteAsset && s.quoteAsset !== "USDT") continue;
    out.push(s.symbol);
  }
  return out;
}

export async function usdtPerpSymbolsFrom(url: string): Promise<Set<string>> {
  const hit = hostCache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.symbols;
  try {
    const symbols = new Set(await fromHost(url));
    if (symbols.size >= 8) hostCache.set(url, { at: Date.now(), symbols });
    return symbols.size ? symbols : (hit?.symbols ?? new Set());
  } catch {
    return hit?.symbols ?? new Set();
  }
}

export async function usdtPerpSymbols(): Promise<Set<string>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.symbols;
  const symbols = new Set<string>();
  const hosts = [
    "https://fapi.binance.com/fapi/v1/exchangeInfo",
    "https://fapi.asterdex.com/fapi/v1/exchangeInfo",
  ];
  await Promise.all(
    hosts.map(async (url) => {
      try {
        for (const s of await fromHost(url)) symbols.add(s);
      } catch {
        /* next */
      }
    }),
  );
  if (symbols.size >= 20) cache = { at: Date.now(), symbols };
  return symbols.size ? symbols : (cache?.symbols ?? new Set());
}

export function isUsdtPerpSymbol(symbol: string, perps: Set<string>) {
  if (!perps.size) return true;
  return perps.has(symbol);
}
