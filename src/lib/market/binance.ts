import type { Bar, KlineTf, Timeframe } from "@/lib/engine/types";

const HOSTS = ["https://fapi.asterdex.com", "https://fapi.binance.com"];

const TF_MAP: Record<KlineTf, string> = {
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
  "1w": "1w",
};

type RawKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

function toBar(k: RawKline): Bar {
  return {
    time: k[0],
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
  };
}

async function getJson<T>(url: string): Promise<T> {
  let lastErr: Error | null = null;
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.status === 429 || res.status === 418) {
      lastErr = new Error(`kline ${res.status}`);
      await new Promise((r) => setTimeout(r, 350 * (i + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`kline ${res.status}`);
    return res.json() as Promise<T>;
  }
  throw lastErr ?? new Error("kline 429");
}

export async function fetchKlines(
  symbol: string,
  tf: KlineTf,
  limit = 500,
  endTime?: number,
): Promise<Bar[]> {
  const interval = TF_MAP[tf];
  const q = new URLSearchParams({
    symbol,
    interval,
    limit: String(Math.min(1500, limit)),
  });
  if (endTime) q.set("endTime", String(endTime));
  let lastErr: unknown;
  for (const host of HOSTS) {
    try {
      const rows = await getJson<RawKline[]>(`${host}/fapi/v1/klines?${q}`);
      if (Array.isArray(rows) && rows.length) return rows.map(toBar);
    } catch (err) {
      lastErr = err;
    }
  }
  const okx = await fetchOkx(symbol, tf, limit);
  if (okx.length) return okx;
  throw lastErr instanceof Error ? lastErr : new Error("no kline source");
}

const OKX_BAR: Record<KlineTf, string> = {
  "5m": "5m",
  "15m": "15m",
  "1h": "1H",
  "4h": "4H",
  "1d": "1D",
  "1w": "1W",
};

async function fetchOkx(symbol: string, tf: KlineTf, limit: number): Promise<Bar[]> {
  try {
    const inst = symbol.replace("USDT", "-USDT-SWAP");
    const url = `https://www.okx.com/api/v5/market/candles?instId=${inst}&bar=${OKX_BAR[tf]}&limit=${Math.min(300, limit)}`;
    const json = await getJson<{ data?: string[][] }>(url);
    const rows = json.data ?? [];
    return rows
      .map((k) => ({
        time: Number(k[0]),
        open: Number(k[1]),
        high: Number(k[2]),
        low: Number(k[3]),
        close: Number(k[4]),
        volume: Number(k[5]),
      }))
      .sort((a, b) => a.time - b.time);
  } catch {
    return [];
  }
}

export async function fetchKlinesRange(
  symbol: string,
  tf: KlineTf,
  barsWanted: number,
): Promise<Bar[]> {
  const out: Bar[] = [];
  let end: number | undefined;
  const cap = Math.min(barsWanted, 8000);
  while (out.length < cap) {
    const batch = await fetchKlines(symbol, tf, 1500, end);
    if (!batch.length) break;
    out.unshift(...batch);
    end = batch[0]!.time - 1;
    if (batch.length < 50) break;
  }
  const uniq = new Map<number, Bar>();
  for (const b of out) uniq.set(b.time, b);
  return [...uniq.values()].sort((a, b) => a.time - b.time).slice(-cap);
}

export async function fetchLastPrice(symbol: string): Promise<number> {
  for (const host of HOSTS) {
    try {
      const t = await getJson<{ price: string }>(`${host}/fapi/v1/ticker/price?symbol=${symbol}`);
      const n = Number(t.price);
      if (Number.isFinite(n)) return n;
    } catch {
      /* next */
    }
  }
  const bars = await fetchKlines(symbol, "5m", 1);
  return bars[bars.length - 1]?.close ?? NaN;
}

export function defaultMaxLeverage(symbol: string): number {
  const s = symbol.replace(/USDT|USDC/g, "");
  if (s === "BTC") return 125;
  if (s === "ETH") return 100;
  if (["BNB", "SOL", "XRP", "DOGE", "ADA"].includes(s)) return 75;
  if (["AVAX", "LINK", "DOT", "LTC", "BCH", "UNI", "SUI", "NEAR", "APT"].includes(s)) return 50;
  return 25;
}

export async function fetchPremiums(symbols: string[]) {
  for (const host of HOSTS) {
    try {
      const rows = await getJson<Array<{ symbol: string; markPrice: string; lastFundingRate: string }>>(
        `${host}/fapi/v1/premiumIndex`,
      );
      const want = new Set(symbols);
      return rows
        .filter((r) => want.has(r.symbol))
        .map((r) => ({
          symbol: r.symbol,
          mark: Number(r.markPrice),
          funding: Number(r.lastFundingRate),
        }));
    } catch {
      /* next */
    }
  }
  return [];
}

export type { Timeframe };
