import { signedQuery } from "./hmac";
import { roundToStep } from "./qty";
import { capLeverage } from "./lev-cap";
import { venueMaxLeverage } from "./leverage";
import { isTradeableBase, nativeSymbol } from "./meta";
import type { ExchangeAdapter, ExchangeAccount, ListedMarket, PlaceOrderInput, PlaceOrderResult, UpdateStopInput } from "./types";

const BASE = "https://fapi.asterdex.com";

type Spec = {
  symbol: string;
  minQty: number;
  stepSize: number;
  qtyPrecision: number;
  tickSize: number;
};

let specCache: { at: number; rows: Spec[] } | null = null;

function roundPrice(n: number, tick: number) {
  const s = tick > 0 ? tick : 0.1;
  return Number((Math.round(n / s) * s).toPrecision(12));
}

async function loadSpecs(): Promise<Spec[]> {
  const now = Date.now();
  if (specCache && now - specCache.at < 10 * 60_000) return specCache.rows;
  const res = await fetch(`${BASE}/fapi/v1/exchangeInfo`);
  if (!res.ok) throw new Error(`Aster exchangeInfo ${res.status}`);
  const info = (await res.json()) as {
    symbols?: Array<{
      symbol: string;
      quantityPrecision?: number;
      pricePrecision?: number;
      filters?: Array<{ filterType: string; minQty?: string; stepSize?: string; tickSize?: string }>;
    }>;
  };
  const rows = (info.symbols ?? []).map((s) => {
    const lot = s.filters?.find((f) => f.filterType === "LOT_SIZE") ?? s.filters?.find((f) => f.filterType === "MARKET_LOT_SIZE");
    const px = s.filters?.find((f) => f.filterType === "PRICE_FILTER");
    return {
      symbol: s.symbol,
      minQty: Number(lot?.minQty ?? 0),
      stepSize: Number(lot?.stepSize ?? 0) || 10 ** -(s.quantityPrecision ?? 3),
      qtyPrecision: s.quantityPrecision ?? 3,
      tickSize: Number(px?.tickSize ?? 0) || 10 ** -(s.pricePrecision ?? 1),
    };
  });
  specCache = { at: now, rows };
  return rows;
}

async function signed(
  account: ExchangeAccount,
  method: "GET" | "POST" | "DELETE",
  path: string,
  params: Record<string, string | number | undefined>,
) {
  if (!account.apiKey || !account.apiSecret) throw new Error("Aster API key missing");
  const p = { ...params, timestamp: Date.now(), recvWindow: 5000 };
  const { qs } = signedQuery(p, account.apiSecret);
  const url = method === "POST" ? `${BASE}${path}` : `${BASE}${path}?${qs}`;
  const res = await fetch(url, {
    method,
    headers: {
      "X-MBX-APIKEY": account.apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: method === "POST" ? qs : undefined,
  });
  const text = await res.text();
  let json: unknown = text;
  try {
    json = JSON.parse(text);
  } catch {
    /* raw */
  }
  if (!res.ok) {
    const msg = typeof json === "object" && json && "msg" in json ? String((json as { msg: string }).msg) : text;
    throw new Error(msg || `Aster ${res.status}`);
  }
  return json;
}

function isStopType(type: string, origType: string) {
  const typ = `${type} ${origType}`.toUpperCase();
  if (typ.includes("TAKE_PROFIT")) return false;
  return typ.includes("STOP");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function asterPositionAmt(account: ExchangeAccount, symbol: string): Promise<number | null> {
  try {
    const pos = (await signed(account, "GET", "/fapi/v2/positionRisk", { symbol })) as Array<{
      positionAmt: string;
    }>;
    return Number(pos[0]?.positionAmt ?? 0);
  } catch {
    return null;
  }
}

/** Wait until a fill shows up (or give up). 0 = confirmed flat, null = read failed. */
async function waitAsterAmt(account: ExchangeAccount, symbol: string): Promise<number | null> {
  let last: number | null = null;
  for (let i = 0; i < 3; i++) {
    last = await asterPositionAmt(account, symbol);
    if (last != null && last !== 0) return last;
    if (i < 2) await sleep(300);
  }
  return last;
}

/** Wait until the position is gone after a close. */
async function waitAsterFlat(account: ExchangeAccount, symbol: string): Promise<"flat" | "open" | "unknown"> {
  let last: number | null = null;
  for (let i = 0; i < 3; i++) {
    last = await asterPositionAmt(account, symbol);
    if (last === 0) return "flat";
    if (i < 2) await sleep(300);
  }
  if (last == null) return "unknown";
  return last === 0 ? "flat" : "open";
}

async function asterMarketClose(account: ExchangeAccount, symbol: string): Promise<PlaceOrderResult> {
  const specs = await loadSpecs();
  const spec = specs.find((s) => s.symbol === symbol);
  const amt = await asterPositionAmt(account, symbol);
  if (amt == null) return { ok: false, message: "Aster position read failed before close" };
  if (!amt) return { ok: true, message: "flat" };
  const qty = spec ? roundToStep(Math.abs(amt), spec.stepSize, spec.minQty) : Math.abs(amt);
  if (!qty) return { ok: false, message: `Aster close size below min for ${symbol}` };
  const side = amt > 0 ? "SELL" : "BUY";
  await signed(account, "POST", "/fapi/v1/order", {
    symbol,
    side,
    type: "MARKET",
    quantity: qty,
    reduceOnly: "true",
  });
  return { ok: true, message: "closed" };
}

async function asterCancelOpen(account: ExchangeAccount, symbol: string) {
  try {
    await signed(account, "DELETE", "/fapi/v1/allOpenOrders", { symbol });
  } catch {
    /* leftover algo orders are optional once flat */
  }
}

/** Two successful zero reads. One zero can be API lag right after a fill. */
async function confirmAsterAlreadyFlat(account: ExchangeAccount, symbol: string): Promise<"flat" | "open" | "unknown"> {
  let zeros = 0;
  for (let i = 0; i < 3; i++) {
    const amt = await asterPositionAmt(account, symbol);
    if (amt == null) {
      zeros = 0;
    } else if (!amt) {
      zeros += 1;
      if (zeros >= 2) return "flat";
    } else {
      return "open";
    }
    if (i < 2) await sleep(300);
  }
  return "unknown";
}

/** Close first. Never cancel SL/TP unless the position is confirmed flat. */
async function closeAndDisarm(account: ExchangeAccount, symbol: string): Promise<PlaceOrderResult> {
  const closed = await asterMarketClose(account, symbol);
  if (!closed.ok && closed.message !== "flat") return closed;
  if (closed.message === "flat") {
    const state = await confirmAsterAlreadyFlat(account, symbol);
    if (state === "open") {
      const again = await asterMarketClose(account, symbol);
      if (!again.ok && again.message !== "flat") return again;
      if (again.message === "flat") {
        return { ok: false, message: "Aster close unconfirmed — SL/TP left in place" };
      }
      const after = await waitAsterFlat(account, symbol);
      if (after !== "flat") {
        return {
          ok: false,
          message:
            after === "unknown"
              ? "Aster close unconfirmed — SL/TP left in place"
              : "Aster close left a remainder — SL/TP left in place",
        };
      }
      await asterCancelOpen(account, symbol);
      return { ok: true, orderId: again.orderId, message: "closed" };
    }
    if (state !== "flat") {
      return { ok: false, message: "Aster close unconfirmed — SL/TP left in place" };
    }
    await asterCancelOpen(account, symbol);
    return closed;
  }
  const state = await waitAsterFlat(account, symbol);
  if (state !== "flat") {
    return {
      ok: false,
      message:
        state === "unknown"
          ? "Aster close unconfirmed — SL/TP left in place"
          : "Aster close left a remainder — SL/TP left in place",
    };
  }
  await asterCancelOpen(account, symbol);
  return closed;
}

function flattenMessage(closed: PlaceOrderResult, why: string, orderId?: string): PlaceOrderResult {
  const flat = closed.ok || closed.message === "flat";
  if (flat) {
    return { ok: false, message: `${why} — flattened, no unprotected position left` };
  }
  return {
    ok: false,
    liveOpen: true,
    orderId,
    message: `${why} — flatten failed (${closed.message})`,
  };
}

export const asterAdapter: ExchangeAdapter = {
  id: "aster",
  label: "Aster",
  kind: "dex",
  docs: "https://docs.asterdex.com/for-developers/aster-api/api-documentation",
  symbolOf: (base) => `${base}USDT`,
  async listMarkets(): Promise<ListedMarket[]> {
    const [infoRes, tickerRes] = await Promise.all([
      fetch(`${BASE}/fapi/v1/exchangeInfo`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20_000) }),
      fetch(`${BASE}/fapi/v1/ticker/24hr`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) }).catch(() => null),
    ]);
    if (!infoRes.ok) throw new Error(`Aster exchangeInfo ${infoRes.status}`);
    const info = (await infoRes.json()) as {
      symbols?: Array<{
        symbol?: string;
        status?: string;
        contractType?: string;
        quoteAsset?: string;
      }>;
    };
    const vol = new Map<string, number>();
    if (tickerRes && tickerRes.ok) {
      try {
        const raw = (await tickerRes.json()) as Array<{ symbol?: string; quoteVolume?: string }> | { symbol?: string; quoteVolume?: string };
        const rows = Array.isArray(raw) ? raw : [raw];
        for (const t of rows) {
          if (t.symbol) vol.set(t.symbol.toUpperCase(), Number(t.quoteVolume ?? 0) || 0);
        }
      } catch {
        /* volume is optional */
      }
    }
    const out: ListedMarket[] = [];
    const seen = new Set<string>();
    for (const s of info.symbols ?? []) {
      if (!s.symbol) continue;
      if (s.status && s.status !== "TRADING") continue;
      if (s.contractType && s.contractType !== "PERPETUAL") continue;
      if (s.quoteAsset && s.quoteAsset !== "USDT") continue;
      const base = isTradeableBase(s.symbol);
      if (!base || seen.has(base)) continue;
      seen.add(base);
      out.push({
        base,
        symbol: s.symbol,
        venueSymbol: nativeSymbol("aster", base),
        volume24hUsd: vol.get(s.symbol.toUpperCase()) ?? 0,
        maxLeverage: 0,
      });
    }
    return out;
  },
  async fetchMaxLeverage(symbol, account) {
    if (account?.apiKey && account.apiSecret) {
      try {
        const rows = (await signed(account, "GET", "/fapi/v1/leverageBracket", { symbol })) as Array<{
          brackets?: Array<{ initialLeverage: number }>;
        }>;
        const max = Math.max(0, ...(rows[0]?.brackets ?? []).map((b) => Number(b.initialLeverage) || 0));
        if (max) return capLeverage(max);
      } catch {
        /* public fallback */
      }
    }
    return venueMaxLeverage("aster", symbol);
  },
  async fetchBalance(account) {
    const data = (await signed(account, "GET", "/fapi/v2/account", {})) as {
      totalWalletBalance?: string;
      availableBalance?: string;
    };
    return Number(data.availableBalance ?? data.totalWalletBalance ?? 0);
  },
  async placeOrder(account, order: PlaceOrderInput): Promise<PlaceOrderResult> {
    try {
      const specs = await loadSpecs();
      const spec = specs.find((s) => s.symbol === order.symbol);
      const qty = spec
        ? roundToStep(order.qty, spec.stepSize, spec.minQty)
        : Number(order.qty.toPrecision(6));
      if (!qty) return { ok: false, message: `Aster size below min for ${order.symbol}` };
      const sl = spec ? roundPrice(order.sl, spec.tickSize) : order.sl;
      const tp = spec ? roundPrice(order.tp, spec.tickSize) : order.tp;
      try {
        await signed(account, "POST", "/fapi/v1/leverage", {
          symbol: order.symbol,
          leverage: capLeverage(order.leverage),
        });
      } catch {
        /* leverage may already be set */
      }
      const side = order.side === "long" ? "BUY" : "SELL";
      const closeSide = side === "BUY" ? "SELL" : "BUY";
      let data: { orderId?: number } = {};
      try {
        data = (await signed(account, "POST", "/fapi/v1/order", {
          symbol: order.symbol,
          side,
          type: "MARKET",
          quantity: qty,
          newOrderRespType: "RESULT",
        })) as { orderId?: number };
      } catch (err) {
        const why = err instanceof Error ? err.message : "Aster order failed";
        const amt = await waitAsterAmt(account, order.symbol);
        if (amt === 0) return { ok: false, message: why };
        if (amt == null) {
          try {
            const closed = await closeAndDisarm(account, order.symbol);
            return flattenMessage(closed, `Aster entry unconfirmed (${why})`);
          } catch (e) {
            return {
              ok: false,
              liveOpen: true,
              message: `Aster entry unconfirmed (${why}) — flatten failed (${e instanceof Error ? e.message : "close threw"})`,
            };
          }
        }
      }

      let slErr = "";
      let tpErr = "";
      try {
        await signed(account, "POST", "/fapi/v1/order", {
          symbol: order.symbol,
          side: closeSide,
          type: "STOP_MARKET",
          stopPrice: sl,
          closePosition: "true",
          workingType: "MARK_PRICE",
        });
      } catch (err) {
        slErr = err instanceof Error ? err.message : "SL rejected";
      }
      try {
        await signed(account, "POST", "/fapi/v1/order", {
          symbol: order.symbol,
          side: closeSide,
          type: "TAKE_PROFIT_MARKET",
          stopPrice: tp,
          closePosition: "true",
          workingType: "MARK_PRICE",
        });
      } catch (err) {
        tpErr = err instanceof Error ? err.message : "TP rejected";
      }
      if (slErr || tpErr) {
        const missing = [slErr && `SL: ${slErr}`, tpErr && `TP: ${tpErr}`].filter(Boolean).join(" · ");
        const oid = data.orderId ? String(data.orderId) : undefined;
        try {
          const closed = await closeAndDisarm(account, order.symbol);
          return flattenMessage(closed, `Aster filled but ${missing}`, oid);
        } catch (err) {
          return {
            ok: false,
            liveOpen: true,
            orderId: oid,
            message: `Aster filled but ${missing} — flatten failed (${err instanceof Error ? err.message : "close threw"})`,
          };
        }
      }
      return {
        ok: true,
        orderId: data.orderId ? String(data.orderId) : undefined,
        message: "Aster market fill · SL/TP on venue",
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Aster order failed" };
    }
  },
  async updateStop(account, order: UpdateStopInput): Promise<PlaceOrderResult> {
    try {
      const specs = await loadSpecs();
      const spec = specs.find((s) => s.symbol === order.symbol);
      const sl = spec ? roundPrice(order.sl, spec.tickSize) : order.sl;
      const opens = (await signed(account, "GET", "/fapi/v1/openOrders", { symbol: order.symbol })) as Array<{
        orderId: number;
        type?: string;
        origType?: string;
      }>;
      const oldStopIds = opens.filter((o) => isStopType(o.type ?? "", o.origType ?? "")).map((o) => o.orderId);
      const closeSide = order.side === "long" ? "SELL" : "BUY";
      await signed(account, "POST", "/fapi/v1/order", {
        symbol: order.symbol,
        side: closeSide,
        type: "STOP_MARKET",
        stopPrice: sl,
        closePosition: "true",
        workingType: "MARK_PRICE",
      });
      for (const orderId of oldStopIds) {
        try {
          await signed(account, "DELETE", "/fapi/v1/order", { symbol: order.symbol, orderId });
        } catch {
          /* new BE stop is live; leftover old stop is safer than a gap */
        }
      }
      return { ok: true, message: "Aster SL moved to BE · TP kept" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Aster update stop failed" };
    }
  },
  async closePosition(account, symbol) {
    try {
      return await closeAndDisarm(account, symbol);
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "close failed" };
    }
  },
  async fetchPositions(account) {
    const rows = (await signed(account, "GET", "/fapi/v2/positionRisk", {})) as Array<{
      symbol: string;
      positionAmt: string;
      entryPrice: string;
      leverage: string;
      unRealizedProfit: string;
    }>;
    return rows
      .filter((r) => Number(r.positionAmt) !== 0)
      .map((r) => ({
        symbol: r.symbol,
        side: Number(r.positionAmt) > 0 ? ("long" as const) : ("short" as const),
        qty: Math.abs(Number(r.positionAmt)),
        entry: Number(r.entryPrice),
        leverage: Number(r.leverage),
        upl: Number(r.unRealizedProfit),
      }));
  },
  async testConnection(account) {
    try {
      if (!account.apiKey || !account.apiSecret) return { ok: false, message: "Aster API key and secret required." };
      const bal = await this.fetchBalance(account);
      const pos = await this.fetchPositions(account);
      return { ok: true, message: `Aster live · ${(bal ?? 0).toFixed(2)} USDT · ${pos.length} open` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Aster ping failed" };
    }
  },
};
