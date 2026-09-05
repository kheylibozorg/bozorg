import { defaultMaxLeverage } from "@/lib/market/binance";
import { signedQuery } from "./hmac";
import { roundToStep } from "./qty";
import { capLeverage } from "./lev-cap";
import { listedFromToobitContracts, listedFromToobitTickers } from "./toobit-listed";
import type { ExchangeAdapter, ExchangeAccount, ListedMarket, PlaceOrderInput, PlaceOrderResult, UpdateStopInput } from "./types";

const BASE = "https://api.toobit.com";

type Contract = {
  symbol: string;
  contractMultiplier: number;
  minQty: number;
  stepSize: number;
  maxLeverage: number;
};

let contractCache: { at: number; rows: Contract[] } | null = null;

async function loadContracts(): Promise<Contract[]> {
  const now = Date.now();
  if (contractCache && now - contractCache.at < 10 * 60_000) return contractCache.rows;
  const res = await fetch(`${BASE}/api/v1/exchangeInfo`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Toobit exchangeInfo ${res.status}`);
  const json = (await res.json()) as {
    contracts?: Array<{
      symbol: string;
      contractMultiplier?: string;
      riskLimits?: Array<{ maxLeverage?: string }>;
      filters?: Array<{ filterType: string; minQty?: string; stepSize?: string }>;
    }>;
  };
  const rows = (json.contracts ?? []).map((c) => {
    const lot = c.filters?.find((f) => f.filterType === "LOT_SIZE");
    const minQtyCoins = Number(lot?.minQty ?? 0);
    const stepCoins = Number(lot?.stepSize ?? 0);
    const mult = Number(c.contractMultiplier ?? 1) || 1;
    return {
      symbol: c.symbol,
      contractMultiplier: mult,
      minQty: minQtyCoins > 0 ? minQtyCoins / mult : 1,
      stepSize: stepCoins > 0 ? stepCoins / mult : 1,
      maxLeverage: capLeverage(Math.max(0, ...(c.riskLimits ?? []).map((r) => Number(r.maxLeverage ?? 0))) || 25),
    };
  });
  contractCache = { at: now, rows };
  return rows;
}

function contractOf(rows: Contract[], symbol: string) {
  return rows.find((r) => r.symbol === symbol) ?? null;
}

async function signed(
  apiKey: string,
  secret: string,
  method: "GET" | "POST",
  path: string,
  params: Record<string, string | number | undefined>,
) {
  const p = { ...params, timestamp: Date.now(), recvWindow: 10000 };
  const { qs } = signedQuery(p, secret);
  const url = method === "GET" ? `${BASE}${path}?${qs}` : `${BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "X-BB-APIKEY": apiKey,
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
    throw new Error(msg || `Toobit ${res.status}`);
  }
  return json;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function pxClose(a: number, b: number) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return Math.abs(a - b) < 1e-8;
  return Math.abs(a - b) / Math.abs(b) < 0.015;
}

type ToobitPos = {
  symbol?: string;
  position?: string | number;
  positionAmt?: string | number;
  side?: string;
  stopLoss?: string | number;
  takeProfit?: string | number;
  sl?: string | number;
  tp?: string | number;
  stopLossPrice?: string | number;
  takeProfitPrice?: string | number;
};

type ToobitOpen = {
  symbol?: string;
  type?: string;
  origType?: string;
  orderType?: string;
  stopPrice?: string | number;
  price?: string | number;
  side?: string;
};

function orderKind(o: ToobitOpen): "sl" | "tp" | null {
  const blob = `${o.type ?? ""} ${o.origType ?? ""} ${o.orderType ?? ""} ${o.side ?? ""}`.toUpperCase();
  if (blob.includes("LOSS")) return "sl";
  if (blob.includes("PROFIT")) return "tp";
  return null;
}

function asRows(json: unknown): unknown[] | null {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.list)) return o.list;
  }
  return null;
}

type Protection = { size: number; hasSl: boolean; hasTp: boolean; sideLong: boolean; unknown: boolean };

async function readProtection(
  account: { apiKey: string; apiSecret: string },
  symbol: string,
  sl: number,
  tp: number,
): Promise<Protection> {
  const [posRes, openRes] = await Promise.all([
    signed(account.apiKey, account.apiSecret, "GET", "/api/v1/futures/positions", { symbol })
      .then((json) => ({ ok: true as const, json }))
      .catch(() => ({ ok: false as const, json: null })),
    signed(account.apiKey, account.apiSecret, "GET", "/api/v1/futures/openOrders", { symbol })
      .then((json) => ({ ok: true as const, json }))
      .catch(() => ({ ok: false as const, json: null })),
  ]);
  if (!posRes.ok) {
    return { size: 0, hasSl: false, hasTp: false, sideLong: true, unknown: true };
  }
  const posRows = asRows(posRes.json);
  if (!posRows) {
    return { size: 0, hasSl: false, hasTp: false, sideLong: true, unknown: true };
  }
  const positions = posRows as ToobitPos[];
  const pos = positions.find((p) => Math.abs(Number(p.position ?? p.positionAmt ?? 0)) > 0);
  const size = Math.abs(Number(pos?.position ?? pos?.positionAmt ?? 0));
  const sideLabel = (pos?.side ?? "").toUpperCase();
  const sideLong = sideLabel === "LONG" || (sideLabel !== "SHORT" && Number(pos?.position ?? 0) > 0);
  let hasSl = pxClose(Number(pos?.stopLoss ?? pos?.sl ?? pos?.stopLossPrice ?? 0), sl);
  let hasTp = pxClose(Number(pos?.takeProfit ?? pos?.tp ?? pos?.takeProfitPrice ?? 0), tp);
  if (openRes.ok) {
    const openRows = asRows(openRes.json);
    if (openRows) {
      for (const o of openRows as ToobitOpen[]) {
        const k = orderKind(o);
        const px = Number(o.stopPrice ?? o.price ?? 0);
        if (k === "sl") hasSl = true;
        else if (k === "tp") hasTp = true;
        else if (pxClose(px, sl)) hasSl = true;
        else if (pxClose(px, tp)) hasTp = true;
      }
    }
  }
  return { size, hasSl, hasTp, sideLong, unknown: false };
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

async function flattenUnconfirmed(
  account: ExchangeAccount,
  symbol: string,
  why: string,
  orderId?: string,
): Promise<PlaceOrderResult> {
  try {
    const closed = await marketCloseToobit(account, symbol);
    return flattenMessage(closed, why, orderId);
  } catch (err) {
    return {
      ok: false,
      liveOpen: true,
      orderId,
      message: `${why} — flatten failed (${err instanceof Error ? err.message : "close threw"})`,
    };
  }
}

async function attachStops(
  account: { apiKey: string; apiSecret: string },
  symbol: string,
  sideLong: boolean,
  sl: number,
  tp: number,
) {
  await signed(account.apiKey, account.apiSecret, "POST", "/api/v1/futures/position/trading-stop", {
    symbol,
    side: sideLong ? "LONG" : "SHORT",
    slTriggerBy: "MARK_PRICE",
    tpTriggerBy: "MARK_PRICE",
    stopLoss: String(sl),
    takeProfit: String(tp),
  });
}

async function toobitPositionAmt(account: ExchangeAccount, symbol: string): Promise<number | null> {
  if (!account.apiKey || !account.apiSecret) return null;
  try {
    const json = await signed(account.apiKey, account.apiSecret, "GET", "/api/v1/futures/positions", {
      symbol,
    });
    const list = asRows(json) as Array<{ position?: string | number; positionAmt?: string | number }> | null;
    if (!list) return null;
    const row = list.find((r) => Number(r.position ?? r.positionAmt) !== 0) ?? list[0];
    if (!row) return 0;
    return Math.abs(Number(row.position ?? row.positionAmt ?? 0)) || 0;
  } catch {
    return null;
  }
}

async function waitToobitFlat(account: ExchangeAccount, symbol: string): Promise<"flat" | "open" | "unknown"> {
  let last: number | null = null;
  for (let i = 0; i < 3; i++) {
    last = await toobitPositionAmt(account, symbol);
    if (last === 0) return "flat";
    if (i < 2) await sleep(300);
  }
  if (last == null) return "unknown";
  return last === 0 ? "flat" : "open";
}

async function marketCloseToobit(account: ExchangeAccount, symbol: string): Promise<PlaceOrderResult> {
  if (!account.apiKey || !account.apiSecret) return { ok: false, message: "Toobit API key missing" };
  const amt = await toobitPositionAmt(account, symbol);
  if (amt == null) return { ok: false, message: "Toobit position read failed before close" };
  if (!amt) return { ok: true, message: "flat" };
  const json = await signed(account.apiKey, account.apiSecret, "GET", "/api/v1/futures/positions", {
    symbol,
  });
  const rows = asRows(json) as Array<{ position: string; side?: string }> | null;
  if (!rows) return { ok: false, message: "Toobit position read failed before close" };
  const row = rows.find((r) => Number(r.position) !== 0) ?? rows[0];
  if (!row || Number(row.position) === 0) return { ok: true, message: "flat" };
  const sideLabel = (row.side ?? "").toUpperCase();
  const long = sideLabel === "LONG" || (sideLabel !== "SHORT" && Number(row.position) > 0);
  const side = long ? "SELL_CLOSE" : "BUY_CLOSE";
  await signed(account.apiKey, account.apiSecret, "POST", "/api/v1/futures/order", {
    symbol,
    side,
    type: "LIMIT",
    priceType: "MARKET",
    quantity: Math.abs(Number(row.position)),
    newClientOrderId: `apex-c-${Date.now()}`,
  });
  const state = await waitToobitFlat(account, symbol);
  if (state !== "flat") {
    return {
      ok: false,
      message:
        state === "unknown"
          ? "Toobit close unconfirmed — SL/TP left in place"
          : "Toobit close left a remainder — SL/TP left in place",
    };
  }
  return { ok: true, message: "closed" };
}

export const toobitAdapter: ExchangeAdapter = {
  id: "toobit",
  label: "Toobit",
  kind: "cex",
  docs: "https://api-docs.toobit.com/",
  symbolOf: (base) => `${base}-SWAP-USDT`,
  async listMarkets(): Promise<ListedMarket[]> {
    const [infoRes, tickerRes] = await Promise.all([
      fetch(`${BASE}/api/v1/exchangeInfo`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20_000) }),
      fetch(`${BASE}/quote/v1/contract/ticker/24hr`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) }).catch(() => null),
    ]);
    const vol = new Map<string, number>();
    let tickerRows: Array<{ s?: string; qv?: string }> = [];
    if (tickerRes && tickerRes.ok) {
      try {
        const tickers = (await tickerRes.json()) as Array<{ s?: string; qv?: string }>;
        tickerRows = Array.isArray(tickers) ? tickers : [];
        for (const t of tickerRows) {
          if (t.s) vol.set(t.s.toUpperCase(), Number(t.qv ?? 0) || 0);
        }
      } catch {
        /* volume is optional */
      }
    }
    let out: ListedMarket[] = [];
    if (infoRes.ok) {
      try {
        const info = (await infoRes.json()) as {
          contracts?: Array<{
            symbol?: string;
            status?: string;
            quoteAsset?: string;
            inverse?: boolean;
            riskLimits?: Array<{ maxLeverage?: string }>;
          }>;
        };
        out = listedFromToobitContracts(info.contracts ?? [], vol);
      } catch {
        out = [];
      }
    }
    if (out.length < 8) out = listedFromToobitTickers(tickerRows);
    return out;
  },
  async fetchMaxLeverage(symbol) {
    try {
      const rows = await loadContracts();
      return capLeverage(contractOf(rows, symbol)?.maxLeverage || defaultMaxLeverage(symbol.replace("-SWAP-", "")));
    } catch {
      return defaultMaxLeverage(symbol.replace("-SWAP-", ""));
    }
  },
  async fetchBalance(account) {
    if (!account.apiKey || !account.apiSecret) throw new Error("Toobit API key missing");
    const data = (await signed(account.apiKey, account.apiSecret, "GET", "/api/v1/futures/balance", {})) as
      | { availableBalance?: string; balance?: string; coin?: string }
      | Array<{ coin?: string; asset?: string; availableBalance: string }>;
    if (Array.isArray(data)) {
      const usdt = data.find((r) => (r.coin ?? r.asset) === "USDT") ?? data[0];
      return Number(usdt?.availableBalance ?? 0);
    }
    return Number(data.availableBalance ?? data.balance ?? 0);
  },
  async placeOrder(account, order: PlaceOrderInput): Promise<PlaceOrderResult> {
    if (!account.apiKey || !account.apiSecret) return { ok: false, message: "Toobit API key missing" };
    const keys = { apiKey: account.apiKey, apiSecret: account.apiSecret };
    let oid: string | undefined;
    try {
      const rows = await loadContracts();
      const spec = contractOf(rows, order.symbol);
      if (!spec) return { ok: false, message: `Toobit has no swap for ${order.symbol}` };
      const contracts = roundToStep(order.qty / spec.contractMultiplier, spec.stepSize, spec.minQty);
      if (!contracts) {
        return {
          ok: false,
          message: `Toobit size below min (${spec.minQty} contracts · multiplier ${spec.contractMultiplier})`,
        };
      }
      const lev = capLeverage(Math.min(order.leverage, spec.maxLeverage || order.leverage));
      try {
        await signed(keys.apiKey, keys.apiSecret, "POST", "/api/v1/futures/leverage", {
          symbol: order.symbol,
          leverage: lev,
        });
      } catch {
        /* ignore */
      }
      const side = order.side === "long" ? "BUY_OPEN" : "SELL_OPEN";
      try {
        const data = (await signed(keys.apiKey, keys.apiSecret, "POST", "/api/v1/futures/order", {
          symbol: order.symbol,
          side,
          type: "LIMIT",
          priceType: "MARKET",
          quantity: contracts,
          newClientOrderId: `apex-${Date.now()}`,
          takeProfit: String(order.tp),
          stopLoss: String(order.sl),
          tpTriggerBy: "MARK_PRICE",
          slTriggerBy: "MARK_PRICE",
          tpOrderType: "MARKET",
          slOrderType: "MARKET",
        })) as { orderId?: string | number };
        oid = data.orderId ? String(data.orderId) : undefined;
      } catch (err) {
        const afterFail = await readProtection(keys, order.symbol, order.sl, order.tp).catch(
          (): Protection => ({
            size: 0,
            hasSl: false,
            hasTp: false,
            sideLong: order.side === "long",
            unknown: true,
          }),
        );
        if (afterFail.unknown) {
          return flattenUnconfirmed(
            account,
            order.symbol,
            `Toobit entry unconfirmed (${err instanceof Error ? err.message : "order failed"})`,
          );
        }
        if (afterFail.size <= 0) {
          return { ok: false, message: err instanceof Error ? err.message : "Toobit order failed" };
        }
      }

      let lastGood: Protection | null = null;
      let sawUnknown = false;
      for (let i = 0; i < 3; i++) {
        await sleep(350);
        const prot = await readProtection(keys, order.symbol, order.sl, order.tp);
        if (prot.unknown) {
          sawUnknown = true;
          continue;
        }
        lastGood = prot;
        if (prot.hasSl && prot.hasTp) break;
        if (prot.size > 0 && i === 1) {
          try {
            await attachStops(keys, order.symbol, prot.sideLong, order.sl, order.tp);
          } catch {
            /* verify below */
          }
        }
      }
      if (!lastGood) {
        if (sawUnknown || oid) {
          return flattenUnconfirmed(account, order.symbol, "Toobit fill unconfirmed (position read failed)", oid);
        }
        return { ok: false, message: "Toobit IOC did not fill" };
      }
      if (lastGood.size <= 0) {
        if (sawUnknown) {
          return flattenUnconfirmed(account, order.symbol, "Toobit fill unconfirmed (position read failed)", oid);
        }
        return { ok: false, message: "Toobit IOC did not fill" };
      }
      if (lastGood.hasSl && lastGood.hasTp) {
        return {
          ok: true,
          orderId: oid,
          message: `Toobit market ${order.side} ${contracts} ct · SL/TP on venue`,
        };
      }
      const missing = [!lastGood.hasSl && "SL", !lastGood.hasTp && "TP"].filter(Boolean).join("+");
      return flattenUnconfirmed(account, order.symbol, `Toobit filled but ${missing} missing`, oid);
    } catch (err) {
      if (oid) {
        return flattenUnconfirmed(
          account,
          order.symbol,
          `Toobit entry unconfirmed (${err instanceof Error ? err.message : "order failed"})`,
          oid,
        );
      }
      return { ok: false, message: err instanceof Error ? err.message : "Toobit order failed" };
    }
  },
  async updateStop(account, order: UpdateStopInput): Promise<PlaceOrderResult> {
    if (!account.apiKey || !account.apiSecret) return { ok: false, message: "Toobit API key missing" };
    try {
      const rows = await loadContracts();
      const spec = contractOf(rows, order.symbol);
      const contracts = spec
        ? roundToStep(order.qty / spec.contractMultiplier, spec.stepSize, spec.minQty)
        : Number(order.qty.toPrecision(6));
      try {
        await signed(account.apiKey, account.apiSecret, "POST", "/api/v1/futures/position/trading-stop", {
          symbol: order.symbol,
          slTriggerBy: "MARK_PRICE",
          slOrdPx: String(order.sl),
          slTriggerPx: String(order.sl),
          stopLoss: String(order.sl),
          takeProfit: String(order.tp),
        });
        return { ok: true, message: "Toobit SL moved to BE · TP kept" };
      } catch {
        const side = order.side === "long" ? "SELL_CLOSE" : "BUY_CLOSE";
        await signed(account.apiKey, account.apiSecret, "POST", "/api/v1/futures/order", {
          symbol: order.symbol,
          side,
          type: "STOP",
          priceType: "MARKET",
          stopPrice: String(order.sl),
          quantity: contracts,
          newClientOrderId: `apex-be-${Date.now()}`,
        });
        return { ok: true, message: "Toobit BE stop placed · TP kept" };
      }
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Toobit update stop failed" };
    }
  },
  async closePosition(account, symbol) {
    try {
      return await marketCloseToobit(account, symbol);
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "close failed" };
    }
  },
  async fetchPositions(account) {
    if (!account.apiKey || !account.apiSecret) throw new Error("Toobit API key missing");
    const rows = (await signed(account.apiKey, account.apiSecret, "GET", "/api/v1/futures/positions", {})) as Array<{
      symbol: string;
      position: string;
      side?: string;
      avgPrice?: string;
      leverage?: string;
      unrealisedPnl?: string;
    }>;
    return rows
      .filter((r) => Number(r.position) !== 0)
      .map((r) => {
        const sideLabel = (r.side ?? "").toUpperCase();
        const long = sideLabel === "LONG" || (sideLabel !== "SHORT" && Number(r.position) > 0);
        return {
          symbol: r.symbol,
          side: long ? ("long" as const) : ("short" as const),
          qty: Math.abs(Number(r.position)),
          entry: Number(r.avgPrice ?? 0),
          leverage: Number(r.leverage ?? 1),
          upl: Number(r.unrealisedPnl ?? 0),
        };
      });
  },
  async testConnection(account) {
    try {
      if (!account.apiKey || !account.apiSecret) return { ok: false, message: "Toobit API key and secret required." };
      const bal = await this.fetchBalance(account);
      const pos = await this.fetchPositions(account);
      return { ok: true, message: `Toobit live · ${(bal ?? 0).toFixed(2)} USDT · ${pos.length} open` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Toobit ping failed" };
    }
  },
};
