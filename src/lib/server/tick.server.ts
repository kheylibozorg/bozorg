import { fetchKlinesCached } from "@/lib/market/klines";
import { FALLBACK_UNIVERSE, fetchUniverse, fetchVenueUniverse, filterByMinCap, minCapUsd, looksLikeFallbackUniverse } from "@/lib/market/universe";
import { fetchVenueLastPrice } from "@/lib/market/venues";
import { onlyClosedBars, scanBarClosed } from "@/lib/engine/run";
import { origStopPx, pathExcursion, pnlAt, sizePosition, walkPath } from "@/lib/engine/paper";
import { HTF2_OF, HTF_OF, TF_MS, WARMUP, type KlineTf, type Timeframe, type VenueId } from "@/lib/engine/types";
import {
  dueTimeframes,
  isFreshSignal,
  latestClosedOpen,
  scanLastN,
  shouldResetCursor,
} from "@/lib/engine/scan-schedule";
import { bookVenue, chartHostLabel, getAdapter, resolveMaxLeverage, sameCoin, venueSymbol } from "@/lib/exchanges/registry";
import { venueMaxLeverage, loadPublicLeverageMaps } from "@/lib/exchanges/leverage";
import { capLeverage } from "@/lib/exchanges/lev-cap";
import type { ExchangeAccount } from "@/lib/exchanges/types";
import {
  alreadyFilled,
  acquireTickLock,
  bumpEquity,
  closePosition,
  getSettings,
  insertPosition,
  insertSignal,
  listOpenPositions,
  listUniverse,
  logScan,
  publicSettings,
  releaseTickLock,
  replaceUniverse,
  setScanCursor,
  setUniverseVenue,
  snapshotEquity,
  touchTick,
  updatePositionSl,
  markScanProgress,
  type SettingsRow,
} from "./desk.server";
import { trexBeAtR } from "@/lib/engine/trex";

const SCAN_BARS = 360;
const MIN_BARS = WARMUP + 12;
const SCAN_CONCURRENCY = 12;
const TICK_BUDGET_MS = 50_000;
const MAX_BATCH = 250;
const UNIVERSE_TTL_MS = 30 * 60_000;

type StampedAsset = Awaited<ReturnType<typeof fetchVenueUniverse>>[number];
let universeCache: { at: number; venue: VenueId; assets: StampedAsset[] } | null = null;

export function clearUniverseCache() {
  universeCache = null;
}

export function hasLiveKeys(s: SettingsRow, venue: VenueId) {
  if (venue === "hyperliquid") return Boolean(s.hyperliquid_private_key);
  if (venue === "lighter") return Boolean(s.lighter_api_private_key && s.lighter_account_index != null);
  if (venue === "aster") return Boolean(s.aster_api_key && s.aster_api_secret);
  if (venue === "toobit") return Boolean(s.toobit_api_key && s.toobit_api_secret);
  return false;
}

export function accountFrom(s: SettingsRow, venue: VenueId): ExchangeAccount {
  if (venue === "aster") {
    return { venue, apiKey: s.aster_api_key ?? undefined, apiSecret: s.aster_api_secret ?? undefined };
  }
  if (venue === "toobit") {
    return { venue, apiKey: s.toobit_api_key ?? undefined, apiSecret: s.toobit_api_secret ?? undefined };
  }
  if (venue === "hyperliquid") {
    return {
      venue,
      privateKey: s.hyperliquid_private_key ?? undefined,
      walletAddress: s.hyperliquid_wallet_address ?? undefined,
    };
  }
  return {
    venue: "lighter",
    apiKey: s.lighter_api_key ?? undefined,
    privateKey: s.lighter_api_private_key ?? undefined,
    accountIndex: s.lighter_account_index ?? undefined,
    apiKeyIndex: s.lighter_api_key_index ?? 2,
  };
}

const ORPHAN_MARK = "UNPROTECTED flatten failed";

function isOrphanPosition(pos: { signal_reason?: string | null }) {
  return typeof pos.signal_reason === "string" && pos.signal_reason.includes(ORPHAN_MARK);
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

function resolveBatch(raw: number, universeLen: number) {
  if (!universeLen) return 0;
  if (!Number.isFinite(raw) || raw <= 0) return Math.min(MAX_BATCH, universeLen);
  return Math.min(MAX_BATCH, universeLen, Math.max(1, Math.round(raw)));
}

export async function refreshUniverse(minMcap: number, venue: VenueId = "paper", force = false) {
  const floor = minCapUsd(minMcap);
  const book = bookVenue(venue);
  if (
    !force &&
    universeCache &&
    universeCache.venue === book &&
    Date.now() - universeCache.at < UNIVERSE_TTL_MS &&
    universeCache.assets.length
  ) {
    return filterByMinCap(universeCache.assets, floor, (a) => a.marketCapUsd);
  }
  let listed: StampedAsset[] = [];
  let listedErr: Error | null = null;
  try {
    listed = await fetchVenueUniverse(book, force);
  } catch (e) {
    listedErr = e instanceof Error ? e : new Error(`${book} listed markets empty`);
    listed = [];
  }
  if (!listed.length && universeCache && universeCache.venue === book && universeCache.assets.length) {
    return filterByMinCap(universeCache.assets, floor, (a) => a.marketCapUsd);
  }
  if (!listed.length) {
    const existing = await listUniverse().catch(() => []);
    const stored = await getSettings().catch(() => null);
    const storedVenue = stored?.universe_venue ? bookVenue(stored.universe_venue) : null;
    if (existing.length && storedVenue === book) {
      return filterByMinCap(
        existing.map((a) => ({
          symbol: a.symbol,
          base: a.base,
          name: a.name,
          marketCapUsd: Number(a.market_cap_usd),
          volume24hUsd: Number(a.volume_24h_usd),
          maxLeverage: Number(a.max_leverage),
          venueSymbol: a.venue_symbol ?? a.symbol,
        })),
        floor,
        (a) => a.marketCapUsd,
      );
    }
    if (book === "paper") {
      try {
        listed = await fetchUniverse(0);
      } catch {
        listed = [];
      }
      if (!listed.length) listed = FALLBACK_UNIVERSE.slice();
    } else if (!listed.length) {
      throw listedErr ?? new Error(`${book} listed markets empty`);
    }
  }
  try {
    await loadPublicLeverageMaps();
  } catch {
    /* stamp with defaults */
  }
  const stamped = await Promise.all(
    listed.map(async (a) => ({
      ...a,
      maxLeverage: await venueMaxLeverage(book, a.symbol),
    })),
  );
  await replaceUniverse(stamped);
  if (looksLikeFallbackUniverse(stamped)) {
    universeCache = null;
    await setUniverseVenue("");
  } else {
    await setUniverseVenue(book);
    universeCache = { at: Date.now(), venue: book, assets: stamped };
  }
  return filterByMinCap(stamped, floor, (a) => a.marketCapUsd);
}

export async function restampUniverseLeverage(venue: VenueId) {
  const rows = await listUniverse();
  if (!rows.length) return [];
  const stamped = await Promise.all(
    rows.map(async (a) => ({
      symbol: a.symbol,
      base: a.base,
      name: a.name,
      marketCapUsd: Number(a.market_cap_usd),
      volume24hUsd: Number(a.volume_24h_usd),
      maxLeverage: await venueMaxLeverage(venue, a.symbol),
      venueSymbol: a.venue_symbol ?? a.symbol,
    })),
  );
  await replaceUniverse(stamped);
  await setUniverseVenue(venue);
  return stamped;
}

export async function runTick(opts?: { forceUniverse?: boolean; batch?: number; source?: string }) {
  const t0 = Date.now();
  const source = opts?.source ?? "manual";
  const lock = await acquireTickLock();
  if (!lock) {
    return {
      ok: true,
      skipped: true,
      reason: "tick already running",
      public: publicSettings(await getSettings()),
    };
  }
  try {
    return await runTickBody({ ...opts, source, t0 });
  } finally {
    await releaseTickLock(lock);
  }
}

async function runTickBody(opts: { forceUniverse?: boolean; batch?: number; source: string; t0: number }) {
  const t0 = opts.t0;
  const settings = await getSettings();
  if (!settings.bot_enabled) {
    await touchTick(opts.source);
    return { ok: true, skipped: true, reason: "bot off", public: publicSettings(await getSettings()) };
  }

  const venue = bookVenue(settings.venue);
  const minMcap = minCapUsd(settings.min_market_cap_usd);

  let universe: Array<{
    symbol: string;
    base: string;
    name: string;
    market_cap_usd: number;
    volume_24h_usd: number;
    max_leverage: number;
  }>;
  try {
    const fresh = await refreshUniverse(minMcap, venue, Boolean(opts?.forceUniverse));
    universe = fresh.map((a) => ({
      symbol: a.symbol,
      base: a.base,
      name: a.name,
      market_cap_usd: a.marketCapUsd,
      volume_24h_usd: a.volume24hUsd,
      max_leverage: a.maxLeverage,
    }));
  } catch {
    const stored = await getSettings().catch(() => null);
    const existing = await listUniverse().catch(() => []);
    if (existing.length && bookVenue(stored?.universe_venue ?? "") === venue) {
      universe = filterByMinCap(existing, minMcap, (a) => Number(a.market_cap_usd));
    } else {
      universe = [];
    }
  }

  const open = await listOpenPositions();
  let closed = 0;
  let opened = 0;
  let signals = 0;
  let scanned = 0;

  const openSyms = [...new Set(open.map((p) => p.symbol))];
  const lastBars = new Map<string, Awaited<ReturnType<typeof fetchKlinesCached>>>();
  await mapPool(openSyms, 4, async (sym) => {
    try {
      const bars = await fetchKlinesCached(sym, "5m", 96, venue);
      lastBars.set(sym, bars);
    } catch {
      /* skip */
    }
  });

  let equity = Number(settings.equity_usd);
  const live =
    settings.mode === "live" &&
    Boolean(settings.live_enabled) &&
    venue !== "paper" &&
    hasLiveKeys(settings, venue);
  const acc = accountFrom(settings, venue === "paper" ? "lighter" : venue);
  const adapter = live ? getAdapter(venue) : null;
  if (live && adapter) {
    try {
      const bal = await adapter.fetchBalance(acc);
      if (bal != null && bal > 0) equity = bal;
    } catch {
      /* keep desk equity */
    }
  }

  for (const pos of open) {
    if (live && adapter && pos.mode === "live" && isOrphanPosition(pos)) {
      try {
        const res = await adapter.closePosition(acc, venueSymbol(venue, pos.symbol));
        if (res.ok || res.message === "flat") {
          let exitPx = Number(pos.entry);
          try {
            const last = await fetchVenueLastPrice(venue, pos.symbol);
            if (Number.isFinite(last)) exitPx = last;
          } catch {
            /* keep entry */
          }
          const origPx = origStopPx({
            side: pos.side as "long" | "short",
            entry: Number(pos.entry),
            sl: Number(pos.sl),
            origSl: pos.orig_sl,
            qty: pos.qty,
            risk: pos.risk_usd,
          });
          const pnl = pnlAt(pos.side as "long" | "short", Number(pos.entry), exitPx, Number(pos.qty), Number(pos.fees_usd));
          const slDist = Math.abs(Number(pos.entry) - origPx);
          const pnlR =
            slDist > 0
              ? (pos.side === "long" ? exitPx - Number(pos.entry) : Number(pos.entry) - exitPx) / slDist
              : 0;
          const holdMs = Math.max(0, Date.now() - new Date(pos.opened_at).getTime());
          await closePosition(pos.id, exitPx, "flatten retry", pnl, pnlR, { holdMs, beMoved: false });
          equity += pnl;
          await bumpEquity(pnl);
          closed += 1;
          continue;
        }
      } catch {
        /* still walk SL/TP below; retry flatten next tick */
      }
    }
    const bars = lastBars.get(pos.symbol);
    if (!bars?.length) continue;
    const side = pos.side as "long" | "short";
    const entry = Number(pos.entry);
    let slNow = Number(pos.sl);
    const tpNow = Number(pos.tp);
    const tf = (pos.timeframe as Timeframe) in TF_MS ? (pos.timeframe as Timeframe) : "5m";
    const tfMs = TF_MS[tf];
    const openedMs = new Date(pos.opened_at).getTime();
    const barTime = Number(pos.bar_time);
    const start = Number.isFinite(barTime) && barTime > 0 ? barTime + tfMs : openedMs;
    let path = bars.filter((b) => b.time >= start - 2000);
    if (!path.length) path = [bars[bars.length - 1]!];
    const walked = walkPath({
      side,
      entry,
      sl: slNow,
      tp: tpNow,
      bars: path,
      beAtR: trexBeAtR(pos.indicator),
    });
    if (walked.beMoved && Math.abs(walked.sl - slNow) > 1e-12) {
      let venueOk = true;
      if (live && adapter && pos.mode === "live") {
        try {
          const res = await adapter.updateStop(acc, {
            symbol: venueSymbol(venue, pos.symbol),
            side,
            sl: walked.sl,
            tp: tpNow,
            qty: Number(pos.qty),
          });
          venueOk = res.ok;
        } catch {
          venueOk = false;
        }
      }
      if (venueOk) {
        try {
          await updatePositionSl(pos.id, walked.sl);
          slNow = walked.sl;
        } catch {
          /* keep original stop */
        }
      }
    }
    const reason = walked.hit?.reason ?? null;
    if (reason) {
      const exit = walked.hit!.exit;
      const why = reason;
      if (live && adapter && pos.mode === "live") {
        try {
          const res = await adapter.closePosition(acc, venueSymbol(venue, pos.symbol));
          if (!res.ok) continue;
        } catch {
          continue;
        }
      }
      const origPx = origStopPx({
        side,
        entry,
        sl: Number(pos.sl),
        origSl: pos.orig_sl,
        qty: pos.qty,
        risk: pos.risk_usd,
      });
      const slDist = Math.abs(entry - origPx);
      const pnl = pnlAt(side, entry, exit, Number(pos.qty), Number(pos.fees_usd));
      const pnlR = slDist > 0 ? (side === "long" ? exit - entry : entry - exit) / slDist : 0;
      const until = walked.hit ? path.filter((b) => b.time <= walked.hit!.barTime) : path;
      const { maeR, mfeR } = pathExcursion({ side, entry, origSl: origPx, bars: until });
      const openMs = Number.isFinite(barTime) && barTime > 0 ? barTime : openedMs;
      const closeMs = walked.hit?.barTime ?? Date.now();
      await closePosition(pos.id, exit, why, pnl, pnlR, {
        maeR,
        mfeR,
        barsHeld: walked.barsHeld,
        holdMs: Math.max(0, closeMs - openMs),
        beMoved: walked.beMoved,
      });
      equity += pnl;
      await bumpEquity(pnl);
      closed += 1;
    }
  }

  if (live && adapter) {
    try {
      const exPos = await adapter.fetchPositions(acc);
      const still = await listOpenPositions();
      for (const pos of still) {
        if (pos.mode !== "live") continue;
        const age = Date.now() - new Date(pos.opened_at).getTime();
        if (age < 45_000) continue;
        const onEx = exPos.some((p) => sameCoin(p.symbol, pos.symbol) || sameCoin(p.symbol, venueSymbol(venue, pos.symbol)));
        if (onEx) continue;
        let exitPx = Number(pos.entry);
        try {
          const last = await fetchVenueLastPrice(venue, pos.symbol);
          if (Number.isFinite(last)) exitPx = last;
        } catch {
          /* keep entry */
        }
        const origPx = origStopPx({
          side: pos.side as "long" | "short",
          entry: Number(pos.entry),
          sl: Number(pos.sl),
          origSl: pos.orig_sl,
          qty: pos.qty,
          risk: pos.risk_usd,
        });
        const pnl = pnlAt(pos.side as "long" | "short", Number(pos.entry), exitPx, Number(pos.qty), Number(pos.fees_usd));
        const slDist = Math.abs(Number(pos.entry) - origPx);
        const pnlR =
          slDist > 0
            ? (pos.side === "long" ? exitPx - Number(pos.entry) : Number(pos.entry) - exitPx) / slDist
            : 0;
        const holdMs = Math.max(0, Date.now() - new Date(pos.opened_at).getTime());
        await closePosition(pos.id, exitPx, "venue", pnl, pnlR, { holdMs, beMoved: false });
        equity += pnl;
        await bumpEquity(pnl);
        closed += 1;
      }
    } catch {
      /* venue read failed — keep desk rows */
    }
  }

  const stillOpen = await listOpenPositions();
  const held = new Set(stillOpen.map((p) => p.symbol));
  let usedMargin = stillOpen.reduce(
    (a, p) => a + Number(p.notional_usd) / Math.max(1, Number(p.leverage)),
    0,
  );

  const scanDone = {
    "5m": Number(settings.scan_done_5m) || 0,
    "15m": Number(settings.scan_done_15m) || 0,
    "1h": Number(settings.scan_done_1h) || 0,
    "4h": Number(settings.scan_done_4h) || 0,
  };
  const nowMs = Date.now();
  const tfs = dueTimeframes(nowMs, scanDone, opts.source);
  if (!tfs.length) {
    await touchTick(opts.source);
    return {
      ok: true,
      skipped: true,
      reason: "waiting for next closed bar",
      scanned: 0,
      signals: 0,
      opened: closed,
      closed,
      durationMs: Date.now() - t0,
      coins: 0,
      universe: universe.length,
      tfs,
      public: publicSettings(await getSettings()),
    };
  }

  const tradeable = universe;
  const batch = resolveBatch(opts?.batch ?? Number(settings.scan_batch), tradeable.length);
  const closed5m = latestClosedOpen(TF_MS["5m"], nowMs);
  const epoch = Number(settings.scan_epoch_ms) || 0;
  let cursor = Number(settings.scan_cursor) || 0;
  if (shouldResetCursor(epoch, closed5m, tfs)) cursor = 0;
  const slice: typeof tradeable = [];
  if (tradeable.length) {
    const n = Math.min(batch, tradeable.length);
    for (let k = 0; k < n; k++) {
      slice.push(tradeable[(cursor + k) % tradeable.length]!);
    }
  }

  type Found = {
    symbol: string;
    timeframe: Timeframe;
    indicator: string;
    side: "long" | "short";
    entry: number;
    sl: number;
    tp: number;
    rr: number;
    atr: number;
    reason: string;
    barTime: number;
  };
  const found: Found[] = [];
  const seenSig = new Set<string>();
  const deadline = t0 + TICK_BUDGET_MS;
  let scannedCoins = 0;
  let tried = 0;
  const lastN = scanLastN(opts.source);

  await mapPool(slice, SCAN_CONCURRENCY, async (asset) => {
    if (Date.now() > deadline) return;
    tried += 1;
    try {
    const need = new Set<KlineTf>(tfs);
    for (const tf of tfs) {
      need.add(HTF_OF[tf]);
      need.add(HTF2_OF[tf]);
    }
    const loaded = new Map<KlineTf, Awaited<ReturnType<typeof fetchKlinesCached>>>();
    await Promise.all(
      [...need].map(async (tf) => {
        try {
          const limit = tf === "1d" || tf === "1w" ? 80 : SCAN_BARS;
          loaded.set(tf, await fetchKlinesCached(asset.symbol, tf, limit, venue));
        } catch {
          loaded.set(tf, []);
        }
      }),
    );
    let any = false;
    for (const tf of tfs) {
      const raw = loaded.get(tf) ?? [];
      const closedBars = onlyClosedBars(raw, tf);
      if (closedBars.length < MIN_BARS) continue;
      const htfTf = HTF_OF[tf];
      const htf2Tf = HTF2_OF[tf];
      const htfClosed = onlyClosedBars(loaded.get(htfTf) ?? [], htfTf);
      const htf2Closed = onlyClosedBars(loaded.get(htf2Tf) ?? [], htf2Tf);
      scanned += 1;
      any = true;
      const sigs = scanBarClosed(
        closedBars,
        tf,
        htfClosed.length > 20 ? htfClosed : undefined,
        lastN,
        htf2Closed.length > 10 ? htf2Closed : undefined,
      );
      for (const s of sigs) {
        const key = `${asset.symbol}|${tf}|${s.indicator}|${s.barTime}`;
        if (seenSig.has(key)) continue;
        seenSig.add(key);
        found.push({
          symbol: asset.symbol,
          timeframe: tf,
          indicator: s.indicator,
          side: s.side,
          entry: s.entry,
          sl: s.sl,
          tp: s.tp,
          rr: s.rr,
          atr: s.atr,
          reason: s.reason,
          barTime: s.barTime,
        });
      }
    }
    if (any) scannedCoins += 1;
    } catch {
      /* one coin must not abort the rest of the tick */
    }
  });

  const scanIncomplete = Boolean(slice.length) && tried < slice.length;
  if (tradeable.length && slice.length) {
    const nextRaw = cursor + Math.max(0, tried);
    const wrapped = nextRaw >= tradeable.length && tried > 0;
    const next = wrapped ? 0 : nextRaw % Math.max(1, tradeable.length);
    let done: { "5m"?: number; "15m"?: number; "1h"?: number; "4h"?: number } | undefined;
    if (wrapped) {
      const n = Date.now();
      done = {};
      for (const tf of tfs) done[tf] = latestClosedOpen(TF_MS[tf], n);
    }
    try {
      await markScanProgress({ cursor: next, epochMs: closed5m, done });
    } catch {
      await setScanCursor(next);
    }
  }

  signals = found.length;
  const remainingSlots = Math.max(0, Number(settings.max_positions) - (await listOpenPositions()).length);
  let used = 0;
  const capitalPct = Number(settings.capital_pct) || 10;
  const userLevCap = Math.min(200, Math.max(1, Math.round(Number(settings.max_leverage) || 200)));
  const levMemo = new Map<string, number>();

  async function maxLev(sym: string) {
    const hit = levMemo.get(sym);
    if (hit) return hit;
    const n = await resolveMaxLeverage(venue, venue === "paper" ? sym : venueSymbol(venue, sym), acc);
    const capped = Math.min(userLevCap, capLeverage(n));
    levMemo.set(sym, capped);
    return capped;
  }

  for (const s of found) {
    let taken = false;
    let skip = "";
    const stale = opts.source !== "manual" && !isFreshSignal(s.barTime, s.timeframe, Date.now());
    if (stale) skip = "stale bar";
    else if (held.has(s.symbol)) skip = "already in symbol";
    else if (used >= remainingSlots) skip = "max positions";
    else if (
      await alreadyFilled({
        symbol: s.symbol,
        timeframe: s.timeframe,
        indicator: s.indicator,
        side: s.side,
        entry: s.entry,
        barTime: s.barTime,
      })
    )
      skip = "already filled";
    else {
      const lev = await maxLev(s.symbol);
      const sized = sizePosition({
        equity,
        capitalPct,
        entry: s.entry,
        sl: s.sl,
        leverage: lev,
        usedMargin,
      });
      if (!sized) skip = "size failed";
      else {
        let orderId: string | undefined;
        let placedLive = false;
        let orphan = false;
        if (live) {
          const ad = getAdapter(venue);
          if (!ad) skip = "no adapter";
          else if (!hasLiveKeys(settings, venue)) skip = `${venue} keys missing`;
          else {
            try {
              const res = await ad.placeOrder(acc, {
                symbol: venueSymbol(venue, s.symbol),
                side: s.side,
                qty: sized.qty,
                leverage: lev,
                sl: s.sl,
                tp: s.tp,
              });
              if (res.ok) {
                orderId = res.orderId;
                placedLive = true;
              } else if (res.liveOpen) {
                orderId = res.orderId;
                placedLive = true;
                orphan = true;
              } else {
                skip = res.message;
              }
            } catch (e) {
              skip = e instanceof Error ? e.message : "order threw";
            }
          }
        }
        if (!skip) {
          const fill = {
            mode: live ? "live" : "paper",
            venue: live ? venue : "paper",
            symbol: s.symbol,
            timeframe: s.timeframe,
            indicator: s.indicator,
            side: s.side,
            entry: s.entry,
            sl: s.sl,
            tp: s.tp,
            qty: sized.qty,
            leverage: lev,
            notional: sized.notional,
            risk: sized.risk,
            fees: sized.fees,
            orderId,
            barTime: s.barTime,
            origSl: s.sl,
            atr: s.atr,
            equityAtOpen: equity,
            rrPlanned: s.rr,
            margin: sized.margin,
          };
          const reason = orphan ? `${s.reason} · ${ORPHAN_MARK}` : s.reason;
          async function flattenLive() {
            if (!adapter) return false;
            try {
              const res = await adapter.closePosition(acc, venueSymbol(venue, s.symbol));
              return res.ok || res.message === "flat";
            } catch {
              return false;
            }
          }
          async function bookOrphan() {
            return insertPosition({ ...fill, signalReason: `${s.reason} · ${ORPHAN_MARK}` });
          }
          try {
            const id = await insertPosition({ ...fill, signalReason: reason });
            if (!id) {
              skip = "already filled";
              if (placedLive) {
                const flat = await flattenLive();
                if (!flat) {
                  const retry = await bookOrphan().catch(() => 0);
                  if (retry) {
                    held.add(s.symbol);
                    used += 1;
                    opened += 1;
                    usedMargin += sized.margin;
                    taken = true;
                    skip = ORPHAN_MARK;
                  }
                }
              }
            } else {
              held.add(s.symbol);
              used += 1;
              opened += 1;
              usedMargin += sized.margin;
              taken = true;
              if (orphan) skip = ORPHAN_MARK;
            }
          } catch (e) {
            skip = e instanceof Error ? e.message : "position insert failed";
            if (placedLive) {
              const flat = await flattenLive();
              if (!flat) {
                try {
                  const retry = await bookOrphan();
                  if (retry) {
                    held.add(s.symbol);
                    used += 1;
                    opened += 1;
                    usedMargin += sized.margin;
                    taken = true;
                    skip = ORPHAN_MARK;
                  }
                } catch {
                  /* still untracked */
                }
              }
            }
          }
        }
      }
    }
    try {
      await insertSignal({
        barTime: s.barTime,
        symbol: s.symbol,
        timeframe: s.timeframe,
        indicator: s.indicator,
        side: s.side,
        entry: s.entry,
        sl: s.sl,
        tp: s.tp,
        rr: s.rr,
        atr: s.atr,
        reason: s.reason,
        taken,
        skipReason: skip || undefined,
      });
    } catch {
      /* schema mismatch must not abort the rest of the tick */
    }
  }

  const freshSettings = await getSettings();
  await snapshotEquity(Number(freshSettings.equity_usd), (await listOpenPositions()).length, freshSettings.mode);
  const ms = Date.now() - t0;
  const heads = slice.slice(0, 8).map((s) => s.base).join(",");
  const note = `${scannedCoins}/${tradeable.length} ${venue} perps · chart ${chartHostLabel(venue)} · ${tfs.join("/")}${scanIncomplete ? " · sweep continues next minute" : " · fresh close"} · ${heads}${slice.length > 8 ? "…" : ""}`;
  await logScan(scanned, signals, opened, closed, ms, note, opts.source);

  return {
    ok: true,
    skipped: false,
    scanned,
    signals,
    opened,
    closed,
    durationMs: ms,
    coins: scannedCoins,
    universe: universe.length,
    tfs,
    batch: slice.map((s) => s.symbol),
    public: publicSettings(await getSettings()),
  };
}

export async function markToMarket(symbol: string, venue: VenueId = "paper") {
  return fetchVenueLastPrice(venue, symbol);
}
