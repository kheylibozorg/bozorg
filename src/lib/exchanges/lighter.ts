import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { defaultMaxLeverage } from "@/lib/market/binance";
import { coinOf, isTradeableBase, nativeSymbol } from "./meta";
import { capLeverage } from "./lev-cap";
import type { ExchangeAdapter, ExchangeAccount, ListedMarket, PlaceOrderInput, PlaceOrderResult, UpdateStopInput } from "./types";

const BASE = "https://mainnet.zklighter.elliot.ai";

type BookDetail = {
  symbol?: string;
  market_id?: number;
  market_index?: number;
  min_base_amount?: string;
  max_leverage?: number;
  size_decimals?: number;
  price_decimals?: number;
  default_initial_margin_fraction?: number;
  min_initial_margin_fraction?: number;
  last_trade_price?: number;
  status?: string;
  daily_quote_token_volume?: number | string;
};

type MarketRow = {
  symbol: string;
  coin: string;
  marketIndex: number;
  maxLeverage: number;
  sizeDecimals: number;
  priceDecimals: number;
  minBase: number;
  lastPrice: number;
  status: string;
  volume24hUsd: number;
};

function wasmPaths() {
  const candidates: string[] = [
    join(process.cwd(), "wasm"),
    join(process.cwd(), "node_modules/lighter-ts-sdk"),
    join(process.cwd(), "lighter-wasm"),
  ];
  try {
    const require = createRequire(import.meta.url);
    let dir = dirname(require.resolve("lighter-ts-sdk"));
    for (let i = 0; i < 8; i++) {
      candidates.push(dir);
      dir = dirname(dir);
    }
  } catch {
    /* resolve may fail under a bundler */
  }
  for (const root of candidates) {
    const nested = join(root, "wasm/lighter-signer.wasm");
    const nestedExec = join(root, "wasm/wasm_exec.js");
    if (existsSync(nested) && existsSync(nestedExec)) return { wasmPath: nested, wasmExecPath: nestedExec };
    const flat = join(root, "lighter-signer.wasm");
    const flatExec = join(root, "wasm_exec.js");
    if (existsSync(flat) && existsSync(flatExec)) return { wasmPath: flat, wasmExecPath: flatExec };
  }
  throw new Error("Lighter WASM signer files were not found next to lighter-ts-sdk.");
}

let marketsCache: { at: number; rows: MarketRow[] } | null = null;

export async function fetchLighterMarkets(): Promise<MarketRow[]> {
  const now = Date.now();
  if (marketsCache && now - marketsCache.at < 10 * 60_000 && marketsCache.rows.length) return marketsCache.rows;
  try {
    const res = await fetch(`${BASE}/api/v1/orderBookDetails`);
    if (!res.ok) throw new Error("lighter markets");
    const json = (await res.json()) as { order_book_details?: BookDetail[] } | BookDetail[];
    const rows = Array.isArray(json) ? json : json.order_book_details ?? [];
    const mapped = rows
      .map((r) => {
        const raw = (r.symbol ?? "").toUpperCase().replace(/[-_/]/g, "");
        const coin = raw.replace(/USDT|USD$/, "");
        const symbol = raw.endsWith("USDT") || raw.endsWith("USD") ? `${coin}USDT` : `${raw}USDT`;
        const minImf = Number(r.min_initial_margin_fraction ?? 0);
        const defImf = Number(r.default_initial_margin_fraction ?? 0);
        const fromMin = minImf > 0 ? Math.max(1, Math.round(10000 / minImf)) : 0;
        const fromDef = defImf > 0 ? Math.max(1, Math.round(10000 / defImf)) : 0;
        const marketIndex = Number(r.market_id ?? r.market_index);
        return {
          symbol,
          coin,
          marketIndex,
          maxLeverage: capLeverage(Number(r.max_leverage ?? 0) || fromMin || fromDef || 25),
          sizeDecimals: Number(r.size_decimals ?? 4),
          priceDecimals: Number(r.price_decimals ?? 2),
          minBase: Number(r.min_base_amount ?? 0),
          lastPrice: Number(r.last_trade_price ?? 0),
          status: String(r.status ?? "active").toLowerCase(),
          volume24hUsd: Number(r.daily_quote_token_volume ?? 0) || 0,
        };
      })
      .filter((r) => r.coin.length >= 2 && Number.isFinite(r.marketIndex));
    if (mapped.length) marketsCache = { at: now, rows: mapped };
    return mapped.length ? mapped : (marketsCache?.rows ?? []);
  } catch {
    return marketsCache?.rows ?? [];
  }
}

function scale(n: number, decimals: number) {
  return Math.max(1, Math.round(n * 10 ** decimals));
}

function marketOf(markets: MarketRow[], symbol: string) {
  const coin = coinOf(symbol);
  return markets.find((m) => m.coin === coin || m.symbol === symbol.toUpperCase()) ?? null;
}

type ActiveOrder = {
  order_index?: number;
  orderIndex?: number;
  market_index?: number;
  market_id?: number;
  marketIndex?: number;
};

/** Best-effort snapshot of live order indexes on one market. Empty if the public read fails. */
async function listActiveOrderIndexes(account: ExchangeAccount, marketIndex: number): Promise<number[]> {
  if (account.accountIndex == null) return [];
  try {
    const q = new URLSearchParams({
      account_index: String(account.accountIndex),
      market_id: String(marketIndex),
    });
    const res = await fetch(`${BASE}/api/v1/accountActiveOrders?${q}`);
    if (!res.ok) return [];
    const json = (await res.json()) as { orders?: ActiveOrder[] } | ActiveOrder[];
    const orders = Array.isArray(json) ? json : json.orders ?? [];
    const ids: number[] = [];
    for (const o of orders) {
      const mkt = Number(o.market_index ?? o.market_id ?? o.marketIndex ?? marketIndex);
      if (mkt !== marketIndex) continue;
      const idx = Number(o.order_index ?? o.orderIndex);
      if (Number.isFinite(idx) && idx > 0) ids.push(idx);
    }
    return ids;
  } catch {
    return [];
  }
}

type Signer = {
  initialize(): Promise<void>;
  ensureWasmClient(): Promise<void>;
  checkClient(useWasmCheck?: boolean): Promise<string | null>;
  updateLeverage(marketIndex: number, marginMode: number, leverage: number): Promise<[unknown, string, string | null]>;
  createOtocoOrder(params: {
    mainOrder: {
      marketIndex: number;
      baseAmount: number;
      isAsk: boolean;
      orderType: number;
      clientOrderIndex?: number;
      avgExecutionPrice?: number;
      idealPrice?: number;
      maxSlippage?: number;
    };
    stopLoss: { triggerPrice: number; isLimit: boolean };
    takeProfit: { triggerPrice: number; isLimit: boolean };
  }): Promise<{ tx: unknown; hash: string; error: string | null }>;
  createOcoOrder(params: {
    orders: [
      {
        marketIndex: number;
        clientOrderIndex?: number;
        baseAmount: number;
        price: number;
        isAsk: boolean;
        orderType?: number;
        reduceOnly?: boolean;
        triggerPrice?: number;
      },
      {
        marketIndex: number;
        clientOrderIndex?: number;
        baseAmount: number;
        price: number;
        isAsk: boolean;
        orderType?: number;
        reduceOnly?: boolean;
        triggerPrice?: number;
      },
    ];
  }): Promise<{ tx: unknown; hash: string; error: string | null }>;
  cancelAllOrders(
    timeInForce: number,
    time: number,
    nonce?: number,
    cancelAllMarketIndex?: number,
  ): Promise<[unknown, unknown, string | null]>;
  cancelOrder(params: { marketIndex: number; orderIndex: number }): Promise<[unknown, string, string | null]>;
  createMarketOrder(params: {
    marketIndex: number;
    clientOrderIndex: number;
    baseAmount: number;
    avgExecutionPrice: number;
    isAsk: boolean;
    reduceOnly?: boolean;
  }): Promise<[unknown, string, string | null]>;
  getBestPrice(marketIndex: number, isAsk: boolean): Promise<number>;
  close(): Promise<void>;
};

async function withSigner<T>(account: ExchangeAccount, fn: (client: Signer) => Promise<T>): Promise<T> {
  if (!account.privateKey) throw new Error("Lighter API private key missing");
  if (account.accountIndex == null) throw new Error("Lighter account index missing");
  const { SignerClient } = await import("lighter-ts-sdk");
  const wasm = wasmPaths();
  const client = new SignerClient({
    url: BASE,
    network: "mainnet",
    privateKey: account.privateKey.trim(),
    accountIndex: account.accountIndex,
    apiKeyIndex: account.apiKeyIndex ?? 2,
    wasmConfig: wasm,
    enableWebSocket: false,
    enableBatching: false,
  }) as unknown as Signer;
  try {
    await client.initialize();
    await client.ensureWasmClient();
    return await fn(client);
  } finally {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
  }
}

async function accountQuery(account: ExchangeAccount) {
  const q =
    account.accountIndex != null
      ? `by=index&value=${account.accountIndex}`
      : account.apiKey
        ? `by=l1_address&value=${account.apiKey}`
        : null;
  if (!q) return null;
  const res = await fetch(`${BASE}/api/v1/account?${q}`);
  if (!res.ok) return null;
  return (await res.json()) as {
    accounts?: Array<{
      collateral?: string;
      available_balance?: string;
      positions?: Array<{
        symbol: string;
        position?: string;
        avg_entry_price?: string;
        leverage?: string;
        unrealized_pnl?: string;
        market_id?: number;
      }>;
    }>;
    collateral?: string;
    available_balance?: string;
  };
}

export const lighterAdapter: ExchangeAdapter = {
  id: "lighter",
  label: "Lighter",
  kind: "dex",
  docs: "https://apidocs.lighter.xyz/docs/get-started",
  symbolOf: (base) => base,
  async listMarkets(): Promise<ListedMarket[]> {
    const rows = await fetchLighterMarkets();
    const out: ListedMarket[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      if (r.status && r.status !== "active") continue;
      const base = isTradeableBase(r.coin);
      if (!base || seen.has(base)) continue;
      seen.add(base);
      out.push({
        base,
        symbol: `${base}USDT`,
        venueSymbol: nativeSymbol("lighter", base),
        volume24hUsd: r.volume24hUsd,
        maxLeverage: r.maxLeverage,
      });
    }
    return out;
  },
  async fetchMaxLeverage(symbol) {
    const markets = await fetchLighterMarkets();
    const row = marketOf(markets, symbol);
    return capLeverage(row?.maxLeverage || defaultMaxLeverage(symbol));
  },
  async fetchBalance(account) {
    if (!account.apiKey && account.accountIndex == null) return null;
    try {
      const json = await accountQuery(account);
      if (!json) return null;
      const acc = json.accounts?.[0] ?? json;
      const v = Number(acc.available_balance ?? acc.collateral ?? 0);
      return Number.isFinite(v) ? v : null;
    } catch {
      return null;
    }
  },
  async placeOrder(account, order: PlaceOrderInput): Promise<PlaceOrderResult> {
    try {
      const markets = await fetchLighterMarkets();
      const mkt = marketOf(markets, order.symbol);
      if (!mkt) return { ok: false, message: `Lighter has no market for ${order.symbol}` };
      if (mkt.minBase > 0 && order.qty < mkt.minBase) {
        return { ok: false, message: `Lighter min size is ${mkt.minBase} ${mkt.coin}` };
      }
      const qty = scale(order.qty, mkt.sizeDecimals);
      const sl = scale(order.sl, mkt.priceDecimals);
      const tp = scale(order.tp, mkt.priceDecimals);
      const isAsk = order.side === "short";
      const hash = await withSigner(account, async (client) => {
        try {
          await client.updateLeverage(mkt.marketIndex, 0, capLeverage(Math.min(order.leverage, mkt.maxLeverage)));
        } catch {
          /* already set */
        }
        let ideal = 0;
        try {
          ideal = await client.getBestPrice(mkt.marketIndex, isAsk);
        } catch {
          ideal = mkt.lastPrice ? scale(mkt.lastPrice, mkt.priceDecimals) : 0;
        }
        const otoco = await client.createOtocoOrder({
          mainOrder: {
            marketIndex: mkt.marketIndex,
            baseAmount: qty,
            isAsk,
            orderType: 1,
            clientOrderIndex: Date.now() % 1_000_000_000,
            avgExecutionPrice: ideal || undefined,
            idealPrice: ideal || undefined,
            maxSlippage: 0.012,
          },
          stopLoss: { triggerPrice: sl, isLimit: false },
          takeProfit: { triggerPrice: tp, isLimit: false },
        });
        if (otoco.error) throw new Error(otoco.error);
        if (!otoco.hash) {
          throw new Error("Lighter OTOCO did not confirm — no order sent");
        }
        return otoco.hash;
      });
      return { ok: true, orderId: hash, message: `Lighter ${order.side} ${mkt.coin} · SL/TP on venue` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Lighter order failed" };
    }
  },
  async updateStop(account, order: UpdateStopInput): Promise<PlaceOrderResult> {
    try {
      const markets = await fetchLighterMarkets();
      const mkt = marketOf(markets, order.symbol);
      if (!mkt) return { ok: false, message: `Lighter has no market for ${order.symbol}` };
      const qty = scale(order.qty, mkt.sizeDecimals);
      const sl = scale(order.sl, mkt.priceDecimals);
      const tp = scale(order.tp, mkt.priceDecimals);
      const isAsk = order.side === "long";
      const oldIndexes = await listActiveOrderIndexes(account, mkt.marketIndex);
      const hash = await withSigner(account, async (client) => {
        const oco = await client.createOcoOrder({
          orders: [
            {
              marketIndex: mkt.marketIndex,
              clientOrderIndex: Date.now() % 1_000_000_000,
              baseAmount: qty,
              price: sl,
              isAsk,
              orderType: 2,
              reduceOnly: true,
              triggerPrice: sl,
            },
            {
              marketIndex: mkt.marketIndex,
              clientOrderIndex: (Date.now() + 1) % 1_000_000_000,
              baseAmount: qty,
              price: tp,
              isAsk,
              orderType: 4,
              reduceOnly: true,
              triggerPrice: tp,
            },
          ],
        });
        if (oco.error) throw new Error(oco.error);
        if (!oco.hash) throw new Error("Lighter OCO did not confirm — existing SL/TP left in place");
        for (const orderIndex of oldIndexes) {
          try {
            await client.cancelOrder({ marketIndex: mkt.marketIndex, orderIndex });
          } catch {
            /* new OCO is live; leftover old reduce-only is safer than a gap */
          }
        }
        return oco.hash;
      });
      return { ok: true, orderId: hash, message: "Lighter SL moved to BE · TP replaced" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Lighter update stop failed" };
    }
  },
  async closePosition(account, symbol) {
    try {
      const markets = await fetchLighterMarkets();
      const mkt = marketOf(markets, symbol);
      if (!mkt) return { ok: true, message: "no market" };
      const pos = (await this.fetchPositions(account)).find((p) => coinOf(p.symbol) === mkt.coin);
      if (!pos || !pos.qty) return { ok: true, message: "flat" };
      const qty = scale(pos.qty, mkt.sizeDecimals);
      const isAsk = pos.side === "long";
      const hash = await withSigner(account, async (client) => {
        let px = 0;
        try {
          px = await client.getBestPrice(mkt.marketIndex, isAsk);
        } catch {
          px = scale(pos.entry || mkt.lastPrice || 1, mkt.priceDecimals);
        }
        const [, h, err] = await client.createMarketOrder({
          marketIndex: mkt.marketIndex,
          clientOrderIndex: Date.now() % 1_000_000_000,
          baseAmount: qty,
          avgExecutionPrice: px,
          isAsk,
          reduceOnly: true,
        });
        if (err) throw new Error(err);
        return h;
      });
      return { ok: true, orderId: hash, message: "closed" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "close failed" };
    }
  },
  async fetchPositions(account) {
    const json = await accountQuery(account);
    if (!json) return [];
    const pos = json.accounts?.[0]?.positions ?? [];
    return pos
      .filter((p) => Number(p.position) !== 0)
      .map((p) => ({
        symbol: p.symbol,
        side: Number(p.position) > 0 ? ("long" as const) : ("short" as const),
        qty: Math.abs(Number(p.position)),
        entry: Number(p.avg_entry_price ?? 0),
        leverage: Number(p.leverage ?? 1),
        upl: Number(p.unrealized_pnl ?? 0),
      }));
  },
  async testConnection(account) {
    try {
      const bal = await this.fetchBalance(account);
      if (account.accountIndex == null && !account.apiKey) {
        return { ok: false, message: "Need L1 address or account index to read the account." };
      }
      if (bal == null) return { ok: false, message: "Account not found on Lighter mainnet." };
      if (!account.privateKey) {
        return {
          ok: false,
          message: `Account visible (${bal.toFixed(2)} USDC) but no API private key — cannot sign orders.`,
        };
      }
      const check = await withSigner(account, async (client) => client.checkClient(true));
      if (check) return { ok: false, message: check };
      return { ok: true, message: `Lighter signer ready · account ${account.accountIndex} · ${bal.toFixed(2)} USDC` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Lighter ping failed" };
    }
  },
};
