import { customAtr, dmi, ema, sma, resample } from "./math.ts";
import { runReversalEngine } from "./reversal.ts";
import { runCoilEngine } from "./coil.ts";
import { runTrexEngine } from "./trex.ts";
import { runKetexEngine } from "./ketex.ts";
import { runShetexEngine } from "./shetex.ts";
import {
  HTF2_OF,
  HTF_OF,
  SCAN_RULE,
  TF_MS,
  apexProfile,
  isApexName,
  isHalcyonName,
  isKetexName,
  isShetexName,
  isTrexName,
  type Bar,
  type EngineResult,
  type IndicatorName,
  type KlineTf,
  type Signal,
  type Timeframe,
} from "./types.ts";

export function prepareSeries(bars: Bar[], tf: Timeframe, htfBars?: Bar[], htf2Bars?: Bar[]) {
  const high = bars.map((b) => b.high);
  const low = bars.map((b) => b.low);
  const close = bars.map((b) => b.close);
  const vol = bars.map((b) => b.volume);
  const catr = customAtr(high, low, close);
  const ema21 = ema(close, 21);
  const ema84 = ema(close, 84);
  const ema200 = ema(close, 200);
  const { pdi, mdi } = dmi(high, low, close, 14, 14);
  const volSma = sma(vol, 20);

  const htfTf = HTF_OF[tf];
  const htf2Tf = HTF2_OF[tf];
  const htfMs = TF_MS[htfTf];
  const htf2Ms = TF_MS[htf2Tf];
  const htf = htfBars && htfBars.length > 10 ? htfBars : resample(bars, htfMs);
  const htf2 = htf2Bars && htf2Bars.length > 10 ? htf2Bars : resample(bars, htf2Ms);
  const htfTimes = htf.map((b) => b.time);
  const htfClose = htf.map((b) => b.close);
  const htfEma = ema(htfClose, 21);
  const htf2Times = htf2.map((b) => b.time);
  const htf2Close = htf2.map((b) => b.close);
  const htf2Ema = ema(htf2Close, 21);

  return {
    catr,
    ema21,
    ema84,
    ema200,
    pdi,
    mdi,
    volSma,
    htfTimes,
    htfClose,
    htfEma,
    htf2Times,
    htf2Close,
    htf2Ema,
    htfMs,
    htf2Ms,
  };
}

export function runIndicator(
  bars: Bar[],
  tf: Timeframe,
  name: IndicatorName,
  htfBars?: Bar[],
  htf2Bars?: Bar[],
): EngineResult {
  if (isApexName(name)) {
    const p = apexProfile(name, tf);
    const s = prepareSeries(bars, tf, htfBars, htf2Bars);
    return runReversalEngine(bars, s, p, {
      barMs: TF_MS[tf],
      htfMs: s.htfMs,
      htf2Ms: s.htf2Ms,
    });
  }
  if (isTrexName(name)) {
    return runTrexEngine(bars, tf, name, htfBars);
  }
  if (isKetexName(name)) {
    return runKetexEngine(bars, tf, htfBars);
  }
  if (isShetexName(name)) {
    return runShetexEngine(bars, tf, htfBars);
  }
  return runCoilEngine(bars, tf, name, htfBars);
}

/** Drop the still-forming candle. Never slice blindly — at exact close the last row is already closed. */
export function onlyClosedBars(bars: Bar[], tf: KlineTf, now = Date.now()): Bar[] {
  const ms = TF_MS[tf];
  return bars.filter((b) => Number.isFinite(b.time) && b.time + ms <= now + 2000);
}

function keepFamily(arr: Signal[]): Signal[] {
  const longs = arr.filter((s) => s.side === "long");
  const shorts = arr.filter((s) => s.side === "short");
  if (longs.length && shorts.length) return [];
  return arr;
}

export function scanBarClosed(
  bars: Bar[],
  tf: Timeframe,
  htfBars?: Bar[],
  lastN = 1,
  htf2Bars?: Bar[],
): Signal[] {
  const names = SCAN_RULE[tf];
  if (!bars.length) return [];
  const n = Math.max(1, Math.min(8, lastN));
  const want = new Set(bars.slice(-n).map((b) => b.time));
  const found: Signal[] = [];
  for (const name of names) {
    const res = runIndicator(bars, tf, name, htfBars, htf2Bars);
    for (const sig of res.signals) {
      if (!want.has(sig.barTime)) continue;
      found.push(sig);
    }
  }
  const byBar = new Map<number, Signal[]>();
  for (const s of found) {
    const arr = byBar.get(s.barTime) ?? [];
    arr.push(s);
    byBar.set(s.barTime, arr);
  }
  const clean: Signal[] = [];
  for (const arr of byBar.values()) {
    // Opposite sides cancel inside a family only — APEX long must not kill a HALCYON or TREX short.
    clean.push(...keepFamily(arr.filter((s) => isApexName(s.indicator))));
    clean.push(...keepFamily(arr.filter((s) => isHalcyonName(s.indicator))));
    clean.push(...keepFamily(arr.filter((s) => isTrexName(s.indicator))));
    clean.push(...keepFamily(arr.filter((s) => isKetexName(s.indicator))));
    clean.push(...keepFamily(arr.filter((s) => isShetexName(s.indicator))));
  }
  return clean;
}

export function allSignals(
  bars: Bar[],
  tf: Timeframe,
  name: IndicatorName,
  htfBars?: Bar[],
  htf2Bars?: Bar[],
) {
  return runIndicator(bars, tf, name, htfBars, htf2Bars).signals;
}

export { resample };
export { TF_MS, HTF_MS } from "./types";
