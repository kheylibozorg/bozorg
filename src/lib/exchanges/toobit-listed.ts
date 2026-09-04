import { capLeverage } from "./lev-cap.ts";
import { isTradeableBase, nativeSymbol } from "./meta.ts";

export type ParsedListed = {
  base: string;
  symbol: string;
  venueSymbol: string;
  volume24hUsd: number;
  maxLeverage: number;
};

type ContractRow = {
  symbol?: string;
  status?: string;
  quoteAsset?: string;
  inverse?: boolean;
  riskLimits?: Array<{ maxLeverage?: string }>;
};

function pushUnique(
  out: ParsedListed[],
  seen: Set<string>,
  rawSymbol: string,
  volume: number,
  maxLeverage: number,
) {
  const base = isTradeableBase(rawSymbol);
  if (!base || seen.has(base)) return;
  seen.add(base);
  out.push({
    base,
    symbol: `${base}USDT`,
    venueSymbol: nativeSymbol("toobit", base),
    volume24hUsd: volume,
    maxLeverage: capLeverage(maxLeverage),
  });
}

/** USDT-M swaps from Toobit /api/v1/exchangeInfo `contracts`. */
export function listedFromToobitContracts(
  contracts: ContractRow[],
  volumes?: Map<string, number>,
): ParsedListed[] {
  const out: ParsedListed[] = [];
  const seen = new Set<string>();
  for (const c of contracts) {
    if (!c.symbol) continue;
    if (c.status && c.status !== "TRADING") continue;
    if (c.quoteAsset && c.quoteAsset !== "USDT") continue;
    if (c.inverse) continue;
    const best = Math.max(0, ...(c.riskLimits ?? []).map((r) => Number(r.maxLeverage ?? 0)));
    const vol = volumes?.get(c.symbol.toUpperCase()) ?? 0;
    pushUnique(out, seen, c.symbol, vol, best);
  }
  return out;
}

/** Fallback book from the 24h contract ticker (`BTC-SWAP-USDT`). */
export function listedFromToobitTickers(rows: Array<{ s?: string; qv?: string }>): ParsedListed[] {
  const out: ParsedListed[] = [];
  const seen = new Set<string>();
  for (const t of rows) {
    const sym = (t.s ?? "").toUpperCase();
    if (!sym.includes("-SWAP-")) continue;
    pushUnique(out, seen, sym, Number(t.qv ?? 0) || 0, 0);
  }
  return out;
}
