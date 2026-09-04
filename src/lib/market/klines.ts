import { TF_MS, type Bar, type KlineTf, type VenueId } from "@/lib/engine/types";
import { fetchVenueKlines } from "./venues";

type Entry = { at: number; bars: Bar[] };

const cache = new Map<string, Entry>();

/** Cache is keyed by venue + bar-open so a Hyperliquid close never reuses a Binance candle. */
export async function fetchKlinesCached(
  symbol: string,
  tf: KlineTf,
  limit = 360,
  venue: VenueId = "paper",
): Promise<Bar[]> {
  const ms = TF_MS[tf];
  const bucket = Math.floor(Date.now() / ms);
  const key = `${venue}:${symbol}:${tf}:${limit}:${bucket}`;
  const hit = cache.get(key);
  if (hit) return hit.bars;
  const bars = await fetchVenueKlines(venue, symbol, tf, limit);
  if (bars.length) cache.set(key, { at: Date.now(), bars });
  if (cache.size > 4000) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  return bars;
}
