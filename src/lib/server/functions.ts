import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { FALLBACK_UNIVERSE, filterByMinCap, minCapUsd, looksLikeFallbackUniverse } from "@/lib/market/universe";
import { fetchKlinesCached } from "@/lib/market/klines";
import { clearListedCache } from "@/lib/market/venues";
import { onlyClosedBars, runIndicator } from "@/lib/engine/run";
import { SCAN_RULE, type IndicatorName, type Timeframe, type VenueId } from "@/lib/engine/types";
import {
  clearUniverse,
  getSettings,
  listClosedPositions,
  listEquity,
  listOpenPositions,
  listScanLog,
  listSignals,
  listUniverse,
  patchSettings,
  publicSettings,
  replaceUniverse,
  resetJournal,
  rotateTickToken,
  saveTradeNote,
  seedDemoJournal,
  maybeSeedJournal,
  setScanCursor,
  stats,
} from "./desk.server";
import { lockOperator, lockStatus, requireOperator, setOperatorPin, unlockOperator } from "./lock.server";
import { bookVenue, getAdapter } from "@/lib/exchanges/registry";
import { accountFrom, clearUniverseCache, hasLiveKeys, refreshUniverse, runTick } from "./tick.server";

export const getDesk = createServerFn({ method: "GET" }).handler(async () => {
  await maybeSeedJournal();
  const lock = await lockStatus();
  const settings = publicSettings(await getSettings(), { unlocked: lock.unlocked });
  const venue = bookVenue(settings.venue);
  let universe = await listUniverse();
  const bookStale =
    !universe.length ||
    !settings.universeVenue ||
    bookVenue(settings.universeVenue) !== venue ||
    looksLikeFallbackUniverse(universe);
  if (bookStale) {
    try {
      universe = (await refreshUniverse(minCapUsd(settings.minMarketCapUsd), venue, true)).map((a) => ({
        symbol: a.symbol,
        base: a.base,
        name: a.name,
        market_cap_usd: a.marketCapUsd,
        volume_24h_usd: a.volume24hUsd,
        max_leverage: a.maxLeverage,
        venue_symbol: a.venueSymbol ?? a.symbol,
      }));
    } catch {
      if (venue === "paper") {
        await replaceUniverse(FALLBACK_UNIVERSE);
        universe = await listUniverse();
      } else {
        try {
          await clearUniverse();
        } catch {
          /* keep whatever is stored; the scan path will refuse a mismatched book */
        }
        universe = [];
      }
    }
  }
  universe = filterByMinCap(universe, minCapUsd(settings.minMarketCapUsd), (a) => Number(a.market_cap_usd));
  const [open, closed, signals, equity, scans, st] = await Promise.all([
    listOpenPositions(),
    listClosedPositions(60),
    listSignals(60),
    listEquity(80),
    listScanLog(24),
    stats(),
  ]);
  return {
    settings,
    lock,
    open,
    closed,
    signals,
    equity: equity.reverse(),
    scans,
    universe,
    stats: st,
  };
});

export const tickNow = createServerFn({ method: "POST" })
  .validator(z.object({ forceUniverse: z.boolean().optional(), source: z.string().max(32).optional() }).optional())
  .handler(async ({ data }) => {
    const lock = await lockStatus();
    if (lock.hasPin && !lock.unlocked) {
      throw new Error("Desk is locked. Unlock to run a manual scan.");
    }
    return runTick({ forceUniverse: data?.forceUniverse, source: data?.source ?? "manual" });
  });

export const rotateDeskToken = createServerFn({ method: "POST" }).handler(async () => {
  await requireOperator();
  const row = await rotateTickToken();
  return publicSettings(row, { unlocked: true });
});

export const saveDeskSettings = createServerFn({ method: "POST" })
  .validator(
    z.object({
      mode: z.enum(["paper", "live"]).optional(),
      venue: z.enum(["paper", "hyperliquid", "lighter", "aster", "toobit"]).optional(),
      risk_pct: z.number().min(0.1).max(5).optional(),
      capital_pct: z.number().min(1).max(100).optional(),
      max_leverage: z.number().int().min(1).max(200).optional(),
      max_positions: z.number().int().min(1).max(20).optional(),
      min_market_cap_usd: z.number().min(0).max(5e12).optional(),
      equity_usd: z.number().positive().optional(),
      starting_equity_usd: z.number().positive().optional(),
      live_enabled: z.number().int().min(0).max(1).optional(),
      bot_enabled: z.number().int().min(0).max(1).optional(),
      paper_24h: z.number().int().min(0).max(1).optional(),
      scan_batch: z.number().int().min(0).max(250).optional(),
      lighter_api_key: z.string().nullable().optional(),
      lighter_api_private_key: z.string().nullable().optional(),
      lighter_account_index: z.number().int().nullable().optional(),
      lighter_api_key_index: z.number().int().nullable().optional(),
      aster_api_key: z.string().nullable().optional(),
      aster_api_secret: z.string().nullable().optional(),
      toobit_api_key: z.string().nullable().optional(),
      toobit_api_secret: z.string().nullable().optional(),
      hyperliquid_private_key: z.string().nullable().optional(),
      hyperliquid_wallet_address: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireOperator();
    if (data.mode === "live" && data.venue === "paper") {
      throw new Error("Paper is simulation only. Pick Hyperliquid, Lighter, Aster, or Toobit for live fills.");
    }
    const before = await getSettings();
    const patch = { ...data };
    const inferred: VenueId | undefined = data.venue
      ? data.venue
      : data.hyperliquid_private_key
        ? "hyperliquid"
        : data.lighter_api_private_key
          ? "lighter"
          : data.aster_api_key && data.aster_api_secret
            ? "aster"
            : data.toobit_api_key && data.toobit_api_secret
              ? "toobit"
              : undefined;
    if (inferred) patch.venue = inferred;
    const venue = (patch.venue ?? before.venue) as VenueId;
    const merged = {
      ...before,
      hyperliquid_private_key: patch.hyperliquid_private_key ?? before.hyperliquid_private_key,
      lighter_api_private_key: patch.lighter_api_private_key ?? before.lighter_api_private_key,
      lighter_account_index: patch.lighter_account_index ?? before.lighter_account_index,
      aster_api_key: patch.aster_api_key ?? before.aster_api_key,
      aster_api_secret: patch.aster_api_secret ?? before.aster_api_secret,
      toobit_api_key: patch.toobit_api_key ?? before.toobit_api_key,
      toobit_api_secret: patch.toobit_api_secret ?? before.toobit_api_secret,
    };
    const newKeys = Boolean(
      patch.hyperliquid_private_key ||
        patch.lighter_api_private_key ||
        (patch.aster_api_key && patch.aster_api_secret) ||
        (patch.toobit_api_key && patch.toobit_api_secret),
    );
    const pickingLive = Boolean(inferred && inferred !== "paper");
    if (venue !== "paper" && (newKeys || pickingLive) && patch.mode !== "paper" && hasLiveKeys(merged, venue)) {
      patch.mode = patch.mode ?? "live";
      patch.live_enabled = patch.live_enabled ?? 1;
      patch.bot_enabled = patch.bot_enabled ?? 1;
    }
    const row = await patchSettings(patch);
    const venueChanged = Boolean(patch.venue && patch.venue !== before.venue);
    const modeChanged = Boolean(patch.mode && patch.mode !== before.mode);
    const capChanged =
      patch.min_market_cap_usd != null &&
      minCapUsd(patch.min_market_cap_usd) !== minCapUsd(before.min_market_cap_usd);
    if (capChanged) {
      try {
        await setScanCursor(0);
      } catch {
        /* cursor reset is best-effort */
      }
    }
    if (venueChanged || modeChanged || newKeys) {
      const v = bookVenue(row.venue);
      try {
        await setScanCursor(0);
      } catch {
        /* cursor reset is best-effort */
      }
      try {
        clearListedCache(v);
        clearUniverseCache();
        await refreshUniverse(minCapUsd(row.min_market_cap_usd), v, true);
      } catch {
        if (v !== "paper") {
          try {
            await clearUniverse();
          } catch {
            /* next getDesk retries */
          }
        }
      }
    }
    return publicSettings(row, { unlocked: true });
  });

export const setDeskPin = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(6).max(64) }))
  .handler(async ({ data }) => {
    return setOperatorPin(data.pin);
  });

export const unlockDesk = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(1).max(64) }))
  .handler(async ({ data }) => {
    return unlockOperator(data.pin);
  });

export const lockDesk = createServerFn({ method: "POST" }).handler(async () => {
  return lockOperator();
});

export const refreshCoins = createServerFn({ method: "POST" }).handler(async () => {
  const lock = await lockStatus();
  if (lock.hasPin && !lock.unlocked) {
    throw new Error("Desk is locked.");
  }
  const s = await getSettings();
  const venue = bookVenue(s.venue);
  clearListedCache(venue);
  clearUniverseCache();
  const assets = await refreshUniverse(minCapUsd(s.min_market_cap_usd), venue, true);
  return { count: assets.length, venue };
});

export const testVenue = createServerFn({ method: "POST" })
  .validator(z.object({ venue: z.enum(["hyperliquid", "lighter", "aster", "toobit"]) }))
  .handler(async ({ data }) => {
    await requireOperator();
    const settings = await getSettings();
    const adapter = getAdapter(data.venue as VenueId);
    if (!adapter) return { ok: false, message: "No adapter" };
    const res = await adapter.testConnection(accountFrom(settings, data.venue));
    if (res.ok) {
      try {
        await patchSettings({
          venue: data.venue,
          mode: "live",
          live_enabled: 1,
          bot_enabled: 1,
        });
      } catch {
        /* arming is best-effort; the ping itself succeeded */
      }
      try {
        clearListedCache(data.venue as VenueId);
        clearUniverseCache();
        const assets = await refreshUniverse(minCapUsd(settings.min_market_cap_usd), data.venue as VenueId, true);
        return {
          ok: true,
          message: `${res.message} · ${assets.length} perps from ${adapter.label}`,
        };
      } catch (e) {
        return {
          ok: true,
          message: `${res.message} · book failed (${e instanceof Error ? e.message : "listed markets"})`,
        };
      }
    }
    return res;
  });

export const getJournal = createServerFn({ method: "GET" }).handler(async () => {
  await maybeSeedJournal();
  const lock = await lockStatus();
  const settings = publicSettings(await getSettings(), { unlocked: lock.unlocked });
  const [open, closed, st] = await Promise.all([
    listOpenPositions(),
    listClosedPositions(2000),
    stats(),
  ]);
  return { settings, lock, open, closed, stats: st };
});

export const resetDeskJournal = createServerFn({ method: "POST" })
  .validator(z.object({ scope: z.enum(["closed", "paper"]) }))
  .handler(async ({ data }) => {
    const lock = await lockStatus();
    if (lock.hasPin) await requireOperator();
    return resetJournal(data.scope);
  });

export const seedDeskJournal = createServerFn({ method: "POST" }).handler(async () => {
  const lock = await lockStatus();
  if (lock.hasPin) await requireOperator();
  return seedDemoJournal();
});

export const saveDeskTradeNote = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int(), notes: z.string().max(2000) }))
  .handler(async ({ data }) => {
    const lock = await lockStatus();
    if (lock.hasPin) await requireOperator();
    return saveTradeNote(data.id, data.notes);
  });

export const probeBtc = createServerFn({ method: "GET" }).handler(async () => {
  const settings = await getSettings();
  const venue = bookVenue(settings.venue);
  const tf: Timeframe = "15m";
  const raw = await fetchKlinesCached("BTCUSDT", tf, 400, venue);
  const bars = onlyClosedBars(raw, tf);
  const htf = onlyClosedBars(await fetchKlinesCached("BTCUSDT", "1h", 200, venue), "1h");
  const htf2 = onlyClosedBars(await fetchKlinesCached("BTCUSDT", "4h", 120, venue), "4h");
  const engines = [];
  for (const name of SCAN_RULE[tf]) {
    const res = runIndicator(bars, tf, name as IndicatorName, htf, htf2);
    engines.push({
      name,
      count: res.signals.length,
      lastBias: res.lastBias,
      armed: res.armed,
      lastAtr: res.lastAtr,
      lastClose: res.lastClose,
      last: res.signals.slice(-3).map((s) => ({
        side: s.side,
        entry: s.entry,
        sl: s.sl,
        tp: s.tp,
        rr: s.rr,
        barTime: s.barTime,
        reason: s.reason,
      })),
    });
  }
  return {
    symbol: "BTCUSDT",
    tf,
    bars: bars.length,
    lastBar: bars[bars.length - 1]?.time ?? 0,
    engines,
  };
});
