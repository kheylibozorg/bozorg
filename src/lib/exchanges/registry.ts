import { asterAdapter } from "./aster";
import { hyperliquidAdapter } from "./hyperliquid";
import { lighterAdapter } from "./lighter";
import { toobitAdapter } from "./toobit";
import { capLeverage, publicMaxLeverage, venueMaxLeverage } from "./leverage";
import type { ExchangeAdapter, ExchangeAccount, ListedMarket } from "./types";
import type { VenueId } from "@/lib/engine/types";
import { coinOf } from "./meta";

export {
  VENUE_META,
  LIVE_VENUES,
  coinOf,
  nativeSymbol,
  chartHostLabel,
  bookVenue,
  venueLabel,
  isTradeableBase,
  looksLikeFallbackUniverse,
} from "./meta";
export { capLeverage, LEV_CAP } from "./leverage";
export type { ListedMarket };

const adapters: Record<Exclude<VenueId, "paper">, ExchangeAdapter> = {
  hyperliquid: hyperliquidAdapter,
  lighter: lighterAdapter,
  aster: asterAdapter,
  toobit: toobitAdapter,
};

export function getAdapter(venue: VenueId): ExchangeAdapter | null {
  if (venue === "paper") return null;
  return adapters[venue];
}

export async function resolveMaxLeverage(venue: VenueId, symbol: string, account?: ExchangeAccount) {
  if (venue === "paper") return publicMaxLeverage(symbol);
  try {
    const n = await adapters[venue].fetchMaxLeverage(symbol, account);
    if (n > 0) return capLeverage(n);
  } catch {
    /* fall through to public map */
  }
  return venueMaxLeverage(venue, symbol);
}

export function venueSymbol(venue: VenueId, binanceSymbol: string) {
  const base = coinOf(binanceSymbol);
  if (venue === "paper") return binanceSymbol;
  return adapters[venue].symbolOf(base);
}

export function sameCoin(a: string, b: string) {
  return coinOf(a) === coinOf(b);
}
