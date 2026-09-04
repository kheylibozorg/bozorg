import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { formatPrice, formatSize } from "@nktkas/hyperliquid/utils";
import { privateKeyToAccount } from "viem/accounts";
import { defaultMaxLeverage } from "@/lib/market/binance";
import { coinOf, isTradeableBase, nativeSymbol } from "./meta";
import { capLeverage } from "./lev-cap";
import type { ExchangeAdapter, ExchangeAccount, ListedMarket, PlaceOrderInput, PlaceOrderResult, UpdateStopInput } from "./types";

const INFO_URL = "https://api.hyperliquid.xyz/info";

type MetaAsset = { name: string; szDecimals: number; maxLeverage: number; isDelisted?: boolean };
type Meta = { universe: MetaAsset[] };

function normalizePk(raw: string): `0x${string}` {
  const s = raw.trim();
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

function masterAddress(account: ExchangeAccount): `0x${string}` | null {
  const w = account.walletAddress?.trim();
  if (w && /^0x[0-9a-fA-F]{40}$/.test(w)) return w.toLowerCase() as `0x${string}`;
  if (!account.privateKey) return null;
  try {
    return privateKeyToAccount(normalizePk(account.privateKey)).address;
  } catch {
    return null;
  }
}

async function info<T>(body: unknown): Promise<T> {
  const res = await fetch(INFO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Hyperliquid info ${res.status}`);
  return res.json() as Promise<T>;
}

let metaCache: { at: number; meta: Meta; mids: Record<string, string> } | null = null;

async function loadMeta() {
  const now = Date.now();
  if (metaCache && now - metaCache.at < 60_000) return metaCache;
  const [meta, mids] = await Promise.all([
    info<Meta>({ type: "meta" }),
    info<Record<string, string>>({ type: "allMids" }),
  ]);
  metaCache = { at: now, meta, mids };
  return metaCache;
}

function assetOf(meta: Meta, symbol: string) {
  const coin = coinOf(symbol);
  const idx = meta.universe.findIndex((u) => u.name.toUpperCase() === coin);
  if (idx < 0) return null;
  return { idx, asset: meta.universe[idx]!, coin };
}

function walletOf(account: ExchangeAccount) {
  if (!account.privateKey) throw new Error("Hyperliquid private key missing");
  return privateKeyToAccount(normalizePk(account.privateKey));
}

function clients(account: ExchangeAccount) {
  const transport = new HttpTransport();
  const wallet = walletOf(account);
  const exchange = new ExchangeClient({ transport, wallet });
  return { exchange };
}

function statusesOf(result: unknown): unknown[] {
  const r = result as { response?: { data?: { statuses?: unknown[] } } };
  return Array.isArray(r.response?.data?.statuses) ? r.response.data.statuses : [];
}

function statusError(st: unknown): string | null {
  if (st && typeof st === "object" && "error" in st) return String((st as { error: unknown }).error);
  return null;
}

function allOrderErrors(result: unknown): string | null {
  const r = result as { status?: string };
  if (r.status && r.status !== "ok") return r.status;
  const errs = statusesOf(result)
    .map(statusError)
    .filter((e): e is string => Boolean(e));
  return errs.length ? errs.join("; ") : null;
}

function statusOid(st: unknown): string | undefined {
  if (!st || typeof st !== "object") return undefined;
  const rec = st as Record<string, { oid?: number }>;
  const hit = rec.filled ?? rec.resting;
  if (hit && typeof hit === "object" && hit.oid != null) return String(hit.oid);
  return undefined;
}

function parseOrderId(result: unknown): string | undefined {
  return statusOid(statusesOf(result)[0]);
}

function entryLive(result: unknown): boolean {
  return Boolean(parseOrderId(result));
}

function protectionLanded(result: unknown, minLegs: number): boolean {
  if (allOrderErrors(result)) return false;
  const st = statusesOf(result);
  if (st.length < minLegs) return false;
  return st.every((s) => !statusError(s));
}

type HlOpenOrder = {
  coin?: string;
  oid?: number;
  isTrigger?: boolean;
  triggerPx?: string | number;
  tpsl?: string;
  sz?: string;
  side?: string;
};

async function listTriggers(account: ExchangeAccount, coin: string): Promise<HlOpenOrder[]> {
  const user = masterAddress(account);
  if (!user) return [];
  const opens = await info<HlOpenOrder[]>({ type: "frontendOpenOrders", user });
  return (Array.isArray(opens) ? opens : []).filter(
    (o) => o.coin?.toUpperCase() === coin && Boolean(o.isTrigger) && Number.isFinite(o.oid),
  );
}

async function cancelOids(account: ExchangeAccount, assetIdx: number, oids: number[]) {
  if (!oids.length) return;
  const { exchange } = clients(account);
  await exchange.cancel({ cancels: oids.map((o) => ({ a: assetIdx, o })) });
}

async function coinPositionSize(account: ExchangeAccount, coin: string): Promise<number> {
  const user = masterAddress(account);
  if (!user) return 0;
  const state = await info<{
    assetPositions?: Array<{ position?: { coin: string; szi: string } }>;
  }>({ type: "clearinghouseState", user });
  const pos = state.assetPositions?.find((p) => p.position?.coin?.toUpperCase() === coin);
  return Math.abs(Number(pos?.position?.szi ?? 0));
}

async function marketCloseHl(account: ExchangeAccount, symbol: string): Promise<PlaceOrderResult> {
  if (!account.privateKey) return { ok: false, message: "Hyperliquid private key missing" };
  const user = masterAddress(account);
  if (!user) return { ok: false, message: "Hyperliquid address missing" };
  const { meta, mids } = await loadMeta();
  const hit = assetOf(meta, symbol);
  if (!hit) return { ok: true, message: "no market" };
  const state = await info<{
    assetPositions?: Array<{ position?: { coin: string; szi: string } }>;
  }>({ type: "clearinghouseState", user });
  const pos = state.assetPositions?.find((p) => p.position?.coin?.toUpperCase() === hit.coin);
  const szi = Number(pos?.position?.szi ?? 0);
  if (!szi) return { ok: true, message: "flat" };
  const mid = Number(mids[hit.coin] ?? 0);
  const isBuy = szi < 0;
  const slip = isBuy ? 1.02 : 0.98;
  const px = formatPrice((mid || Math.abs(szi)) * slip, hit.asset.szDecimals);
  const sz = formatSize(Math.abs(szi), hit.asset.szDecimals);
  const { exchange } = clients(account);
  const result = await exchange.order({
    orders: [
      {
        a: hit.idx,
        b: isBuy,
        p: px,
        s: sz,
        r: true,
        t: { limit: { tif: "Ioc" } },
      },
    ],
    grouping: "na",
  });
  const err = allOrderErrors(result);
  if (err) return { ok: false, message: err };
  return { ok: true, orderId: parseOrderId(result), message: "closed" };
}

/** Close first. Only cancel leftover triggers after the position is actually flat. */
async function closeAndDisarm(account: ExchangeAccount, symbol: string): Promise<PlaceOrderResult> {
  const closed = await marketCloseHl(account, symbol);
  if (!closed.ok && closed.message !== "flat") return closed;
  try {
    const { meta } = await loadMeta();
    const hit = assetOf(meta, symbol);
    if (!hit) return closed;
    const left = await coinPositionSize(account, hit.coin);
    if (left > 0) return { ok: false, message: "Hyperliquid close left a remainder" };
    const leftover = await listTriggers(account, hit.coin);
    await cancelOids(
      account,
      hit.idx,
      leftover.map((o) => Number(o.oid)),
    );
  } catch {
    /* position is already flat */
  }
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

function pxClose(a: number, b: number) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const scale = Math.max(Math.abs(b), Math.abs(a), 1e-9);
  return Math.abs(a - b) / scale < 0.002;
}

export const hyperliquidAdapter: ExchangeAdapter = {
  id: "hyperliquid",
  label: "Hyperliquid",
  kind: "dex",
  docs: "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api",
  symbolOf: (base) => base,
  async listMarkets(): Promise<ListedMarket[]> {
    const json = await info<[Meta, Array<{ dayNtlVlm?: string; markPx?: string }>]>({
      type: "metaAndAssetCtxs",
    });
    const universe = json[0]?.universe ?? [];
    const ctxs = json[1] ?? [];
    const out: ListedMarket[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < universe.length; i++) {
      const u = universe[i]!;
      if (!u.name || u.isDelisted) continue;
      const mark = Number(ctxs[i]?.markPx ?? 0);
      if (mark <= 0) continue;
      const base = isTradeableBase(u.name);
      if (!base || seen.has(base)) continue;
      seen.add(base);
      out.push({
        base,
        symbol: `${base}USDT`,
        venueSymbol: nativeSymbol("hyperliquid", base),
        volume24hUsd: Number(ctxs[i]?.dayNtlVlm ?? 0) || 0,
        maxLeverage: capLeverage(Number(u.maxLeverage ?? 0) || 0),
      });
    }
    return out;
  },
  async fetchMaxLeverage(symbol) {
    try {
      const { meta } = await loadMeta();
      const hit = assetOf(meta, symbol);
      return capLeverage(hit?.asset.maxLeverage || defaultMaxLeverage(symbol));
    } catch {
      return defaultMaxLeverage(symbol);
    }
  },
  async fetchBalance(account) {
    const user = masterAddress(account);
    if (!user) return null;
    const state = await info<{ withdrawable?: string; marginSummary?: { accountValue?: string } }>({
      type: "clearinghouseState",
      user,
    });
    const v = Number(state.withdrawable ?? state.marginSummary?.accountValue ?? 0);
    return Number.isFinite(v) ? v : null;
  },
  async placeOrder(account, order: PlaceOrderInput): Promise<PlaceOrderResult> {
    try {
      if (!account.privateKey) return { ok: false, message: "Hyperliquid private key missing" };
      const { meta, mids } = await loadMeta();
      const hit = assetOf(meta, order.symbol);
      if (!hit) return { ok: false, message: `Hyperliquid has no market for ${order.symbol}` };
      const market = hit;
      const szDec = market.asset.szDecimals;
      const mid = Number(mids[hit.coin] ?? mids[hit.asset.name] ?? 0);
      if (!mid) return { ok: false, message: `No Hyperliquid mid for ${hit.coin}` };
      const isBuy = order.side === "long";
      const slip = isBuy ? 1.015 : 0.985;
      const px = formatPrice(mid * slip, szDec);
      const sz = formatSize(order.qty, szDec);
      if (Number(sz) * mid < 10) {
        return { ok: false, message: `Hyperliquid min notional is $10 (got ${(Number(sz) * mid).toFixed(2)})` };
      }
      const lev = capLeverage(Math.min(order.leverage, hit.asset.maxLeverage || order.leverage));
      const { exchange } = clients(account);
      try {
        await exchange.updateLeverage({ asset: hit.idx, isCross: true, leverage: lev });
      } catch {
        /* already set */
      }
      const slPx = formatPrice(order.sl, szDec);
      const tpPx = formatPrice(order.tp, szDec);
      const entry = {
        a: hit.idx,
        b: isBuy,
        p: px,
        s: sz,
        r: Boolean(order.reduceOnly),
        t: { limit: { tif: "Ioc" as const } },
      };
      const sl = {
        a: hit.idx,
        b: !isBuy,
        p: slPx,
        s: sz,
        r: true,
        t: { trigger: { isMarket: true, triggerPx: slPx, tpsl: "sl" as const } },
      };
      const tp = {
        a: hit.idx,
        b: !isBuy,
        p: tpPx,
        s: sz,
        r: true,
        t: { trigger: { isMarket: true, triggerPx: tpPx, tpsl: "tp" as const } },
      };

      async function place(params: Parameters<typeof exchange.order>[0]): Promise<unknown> {
        try {
          return await exchange.order(params);
        } catch (err) {
          return {
            status: "err",
            response: {
              data: { statuses: [{ error: err instanceof Error ? err.message : "order threw" }] },
            },
          };
        }
      }

      async function protectOrFlatten(entryResult: unknown, why: string): Promise<PlaceOrderResult> {
        const protect = await place({ orders: [sl, tp], grouping: "positionTpsl" });
        if (protectionLanded(protect, 2)) {
          return {
            ok: true,
            orderId: parseOrderId(entryResult) ?? parseOrderId(protect),
            message: `Hyperliquid IOC ${order.side} ${market.coin} · SL/TP on venue`,
          };
        }
        const oid = parseOrderId(entryResult) ?? parseOrderId(protect);
        try {
          const closed = await closeAndDisarm(account, order.symbol);
          return flattenMessage(closed, why, oid);
        } catch (err) {
          return {
            ok: false,
            liveOpen: true,
            orderId: oid,
            message: `${why} — flatten failed (${err instanceof Error ? err.message : "close threw"})`,
          };
        }
      }

      const grouped = await place({ orders: [entry, sl, tp], grouping: "normalTpsl" });
      if (protectionLanded(grouped, 3) && entryLive(grouped)) {
        return {
          ok: true,
          orderId: parseOrderId(grouped),
          message: `Hyperliquid IOC ${order.side} ${hit.coin} · SL/TP on venue`,
        };
      }

      let hasPos = entryLive(grouped);
      if (!hasPos) {
        try {
          hasPos = (await coinPositionSize(account, hit.coin)) > 0;
        } catch {
          hasPos = false;
        }
      }

      if (hasPos) {
        return await protectOrFlatten(
          grouped,
          allOrderErrors(grouped) || "Hyperliquid entry filled but SL/TP did not confirm",
        );
      }

      const solo = await place({ orders: [entry], grouping: "na" });
      const soloErr = allOrderErrors(solo);
      if (soloErr || !entryLive(solo)) {
        return { ok: false, message: soloErr || "Hyperliquid IOC did not fill" };
      }
      return await protectOrFlatten(solo, allOrderErrors(solo) || "Hyperliquid SL/TP rejected after fill");
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Hyperliquid order failed" };
    }
  },
  async updateStop(account, order: UpdateStopInput): Promise<PlaceOrderResult> {
    try {
      if (!account.privateKey) return { ok: false, message: "Hyperliquid private key missing" };
      const { meta } = await loadMeta();
      const hit = assetOf(meta, order.symbol);
      if (!hit) return { ok: false, message: `Hyperliquid has no market for ${order.symbol}` };
      const user = masterAddress(account);
      if (!user) return { ok: false, message: "Hyperliquid address missing" };
      const { exchange } = clients(account);
      const coin = hit.coin;
      const existing = await listTriggers(account, coin);
      const slPx = formatPrice(order.sl, hit.asset.szDecimals);
      const tpPx = formatPrice(order.tp, hit.asset.szDecimals);
      const sz = formatSize(order.qty, hit.asset.szDecimals);
      const closeBuy = order.side === "short";
      const fresh = [
        {
          a: hit.idx,
          b: closeBuy,
          p: slPx,
          s: sz,
          r: true,
          t: { trigger: { isMarket: true, triggerPx: slPx, tpsl: "sl" as const } },
        },
        {
          a: hit.idx,
          b: closeBuy,
          p: tpPx,
          s: sz,
          r: true,
          t: { trigger: { isMarket: true, triggerPx: tpPx, tpsl: "tp" as const } },
        },
      ];

      async function placeFresh(): Promise<unknown> {
        try {
          return await exchange.order({ orders: fresh, grouping: "positionTpsl" });
        } catch (err) {
          return {
            status: "err",
            response: {
              data: { statuses: [{ error: err instanceof Error ? err.message : "order threw" }] },
            },
          };
        }
      }

      const first = await placeFresh();
      async function venueHasNewPair() {
        const opens = await listTriggers(account, coin);
        const hasSl = opens.some((o) => o.tpsl === "sl" && pxClose(Number(o.triggerPx), order.sl));
        const hasTp = opens.some((o) => o.tpsl === "tp" && pxClose(Number(o.triggerPx), order.tp));
        return { opens, hasSl, hasTp };
      }

      let check = await venueHasNewPair();
      if (!check.hasSl || !check.hasTp) {
        await placeFresh();
        check = await venueHasNewPair();
      }
      if (check.hasSl && check.hasTp) {
        const keep = new Set(
          check.opens
            .filter(
              (o) =>
                (o.tpsl === "sl" && pxClose(Number(o.triggerPx), order.sl)) ||
                (o.tpsl === "tp" && pxClose(Number(o.triggerPx), order.tp)),
            )
            .map((o) => String(o.oid)),
        );
        const stale = existing.filter((o) => o.oid != null && !keep.has(String(o.oid)));
        if (stale.length) {
          try {
            await cancelOids(
              account,
              hit.idx,
              stale.map((o) => Number(o.oid)),
            );
          } catch {
            /* new pair is live */
          }
        }
        return { ok: true, message: "Hyperliquid SL moved to BE · TP kept" };
      }
      return {
        ok: false,
        message:
          allOrderErrors(first) ||
          "Hyperliquid BE stop did not confirm — original SL kept",
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Hyperliquid update stop failed" };
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
    const user = masterAddress(account);
    if (!user) return [];
    const state = await info<{
      assetPositions?: Array<{
        position?: {
          coin: string;
          szi: string;
          entryPx: string;
          leverage?: { value?: number };
          unrealizedPnl?: string;
        };
      }>;
    }>({ type: "clearinghouseState", user });
    return (state.assetPositions ?? [])
      .filter((p) => Number(p.position?.szi) !== 0)
      .map((p) => {
        const szi = Number(p.position!.szi);
        return {
          symbol: p.position!.coin,
          side: szi > 0 ? ("long" as const) : ("short" as const),
          qty: Math.abs(szi),
          entry: Number(p.position!.entryPx ?? 0),
          leverage: Number(p.position!.leverage?.value ?? 1),
          upl: Number(p.position!.unrealizedPnl ?? 0),
        };
      });
  },
  async testConnection(account) {
    try {
      if (!account.privateKey) return { ok: false, message: "Paste the agent (or main) private key." };
      try {
        walletOf(account);
      } catch {
        return { ok: false, message: "Private key is not a valid hex key." };
      }
      const user = masterAddress(account);
      if (!user) return { ok: false, message: "Could not derive address." };
      const bal = await this.fetchBalance(account);
      const pos = await this.fetchPositions(account);
      const agentNote = account.walletAddress
        ? `master ${user.slice(0, 6)}…${user.slice(-4)}`
        : `derived ${user.slice(0, 6)}…${user.slice(-4)} (paste master address if this is an agent key)`;
      if (bal == null) return { ok: false, message: `Signed, but no clearinghouse state for ${agentNote}.` };
      return {
        ok: true,
        message: `Hyperliquid live · ${agentNote} · ${bal.toFixed(2)} USDC · ${pos.length} open`,
      };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Hyperliquid ping failed" };
    }
  },
};
