import { customAtr, ema, htfAt, resample } from "./math.ts";
import {
  HTF_OF,
  TF_MS,
  WARMUP,
  type Bar,
  type EngineResult,
  type KetexName,
  type Signal,
  type Timeframe,
} from "./types.ts";

const EPS = 1e-10;

/** APEX profile from ketex.txt — NEXUS quality + TREX second-test reversals. */
export type KetexProfile = {
  name: KetexName;
  rr: number;
  useHtf: boolean;
  useEma84: boolean;
  confirmCl: boolean;
  sides: "Both" | "Long" | "Short";
  legLookback: number;
  minLegAtr: number;
  coverMax: 1 | 2;
  needThird: boolean;
  useLongbar: boolean;
  slAtrMult: number;
  ftcWait: number;
  minRoomR: number;
  cooldownBars: number;
  bandAtr: number;
  minAwayAtr: number;
};

/** Default `mode = "APEX"` inputs. Do not mix with APEX1/1.5/2 lab gates. */
export const KETEX_PROFILE: KetexProfile = {
  name: "KETEX",
  rr: 2.2,
  useHtf: true,
  useEma84: true,
  confirmCl: true,
  sides: "Both",
  legLookback: 40,
  minLegAtr: 2.6,
  coverMax: 2,
  needThird: true,
  useLongbar: true,
  slAtrMult: 0.35,
  ftcWait: 8,
  minRoomR: 2.2,
  cooldownBars: 5,
  bandAtr: 0.7,
  minAwayAtr: 1.0,
};

export function ketexProfile(): KetexProfile {
  return { ...KETEX_PROFILE };
}

function cType(rng: number, catr: number): number {
  const r = rng / Math.max(catr, EPS);
  if (r < 0.8) return 0;
  if (r <= 1.2) return 1;
  if (r <= 2.5) return 2;
  return 3;
}

function lastThird(bearish: boolean, close: number, high: number, low: number) {
  const rng = Math.max(high - low, EPS);
  const third = rng / 3;
  return bearish ? close <= low + third : close >= high - third;
}

function threeMasters(
  fromOff: number,
  toOff: number,
  wantHigh: boolean,
  i: number,
  bars: Bar[],
  catr: number[],
): boolean {
  let run = 0;
  let lastExt = wantHigh ? -1e20 : 1e20;
  for (let off = fromOff; off <= toOff; off++) {
    const idx = i - off;
    if (idx < 0) continue;
    const bar = bars[idx]!;
    const rng = Math.max(bar.high - bar.low, EPS);
    const body = Math.abs(bar.close - bar.open);
    const upSh = bar.high - Math.max(bar.close, bar.open);
    const dnSh = Math.min(bar.close, bar.open) - bar.low;
    const masterish =
      cType(rng, catr[idx]!) === 1 && (body / rng >= 0.8 || Math.max(upSh, dnSh) / rng >= 0.8);
    const dirOk = wantHigh ? bar.close > bar.open : bar.close < bar.open;
    if (masterish && dirOk) {
      const ext = wantHigh ? bar.high : bar.low;
      if (wantHigh) {
        if (ext > lastExt) {
          run += 1;
          lastExt = ext;
        } else {
          run = 1;
          lastExt = Math.max(lastExt, ext);
        }
      } else if (ext < lastExt) {
        run += 1;
        lastExt = ext;
      } else {
        run = 1;
        lastExt = Math.min(lastExt, ext);
      }
      if (run >= 3) return true;
    } else {
      run = 0;
    }
  }
  return false;
}

function originLowOff(eOff: number, look: number, i: number, bars: Bar[]) {
  let mn = bars[i - eOff]!.low;
  let idx = eOff;
  const maxOff = Math.min(eOff + look, i);
  for (let off = eOff; off <= maxOff; off++) {
    const v = bars[i - off]!.low;
    if (v < mn) {
      mn = v;
      idx = off;
    }
  }
  return idx;
}

function originHighOff(eOff: number, look: number, i: number, bars: Bar[]) {
  let mx = bars[i - eOff]!.high;
  let idx = eOff;
  const maxOff = Math.min(eOff + look, i);
  for (let off = eOff; off <= maxOff; off++) {
    const v = bars[i - off]!.high;
    if (v > mx) {
      mx = v;
      idx = off;
    }
  }
  return idx;
}

function moveOkUp(eOff: number, i: number, bars: Bar[], catr: number[], p: KetexProfile) {
  const orig = originLowOff(eOff, p.legLookback, i, bars);
  const e = i - eOff;
  const o = i - orig;
  const dist = bars[e]!.high - bars[o]!.low;
  return dist >= p.minLegAtr * catr[e]! || threeMasters(orig, eOff, true, i, bars, catr);
}

function moveOkDn(eOff: number, i: number, bars: Bar[], catr: number[], p: KetexProfile) {
  const orig = originHighOff(eOff, p.legLookback, i, bars);
  const e = i - eOff;
  const o = i - orig;
  const dist = bars[o]!.high - bars[e]!.low;
  return dist >= p.minLegAtr * catr[e]! || threeMasters(orig, eOff, false, i, bars, catr);
}

function coverHighAt(
  eOff: number,
  i: number,
  bars: Bar[],
  catr: number[],
  p: KetexProfile,
): { ok: boolean; extreme: number; inner: number } {
  const e = i - eOff;
  const cur = bars[i]!;
  const bar = bars[e]!;
  const extreme = bar.high;
  const inner = Math.min(bar.open, bar.close);
  const rngE = Math.max(bar.high - bar.low, EPS);
  const bodyR = Math.abs(bar.close - bar.open) / rngE;
  const upSh = (bar.high - Math.max(bar.close, bar.open)) / rngE;
  const dnSh = (Math.min(bar.close, bar.open) - bar.low) / rngE;
  const master =
    cType(rngE, catr[e]!) === 1 &&
    bar.close > bar.open &&
    (bodyR >= 0.8 || upSh >= 0.8 || dnSh >= 0.8);
  const longish = p.useLongbar && cType(rngE, catr[e]!) >= 2;
  const line = master ? bar.low : longish ? bar.high - catr[e]! : NaN;
  let ok = false;
  if (Number.isFinite(line) && (master || longish) && moveOkUp(eOff, i, bars, catr, p)) {
    if (cur.close < line && (!p.needThird || lastThird(true, cur.close, cur.high, cur.low))) {
      ok = true;
    }
  }
  return { ok, extreme, inner };
}

function coverLowAt(
  eOff: number,
  i: number,
  bars: Bar[],
  catr: number[],
  p: KetexProfile,
): { ok: boolean; extreme: number; inner: number } {
  const e = i - eOff;
  const cur = bars[i]!;
  const bar = bars[e]!;
  const extreme = bar.low;
  const inner = Math.max(bar.open, bar.close);
  const rngE = Math.max(bar.high - bar.low, EPS);
  const bodyR = Math.abs(bar.close - bar.open) / rngE;
  const upSh = (bar.high - Math.max(bar.close, bar.open)) / rngE;
  const dnSh = (Math.min(bar.close, bar.open) - bar.low) / rngE;
  const master =
    cType(rngE, catr[e]!) === 1 &&
    bar.close < bar.open &&
    (bodyR >= 0.8 || upSh >= 0.8 || dnSh >= 0.8);
  const longish = p.useLongbar && cType(rngE, catr[e]!) >= 2;
  const line = master ? bar.high : longish ? bar.low + catr[e]! : NaN;
  let ok = false;
  if (Number.isFinite(line) && (master || longish) && moveOkDn(eOff, i, bars, catr, p)) {
    if (cur.close > line && (!p.needThird || lastThird(false, cur.close, cur.high, cur.low))) {
      ok = true;
    }
  }
  return { ok, extreme, inner };
}

function lowestSince(i: number, len: number, bars: Bar[]) {
  let mn = bars[i]!.low;
  const n = Math.max(0, len);
  for (let k = 0; k <= n; k++) {
    const idx = i - k;
    if (idx < 0) break;
    mn = Math.min(mn, bars[idx]!.low);
  }
  return mn;
}

function highestSince(i: number, len: number, bars: Bar[]) {
  let mx = bars[i]!.high;
  const n = Math.max(0, len);
  for (let k = 0; k <= n; k++) {
    const idx = i - k;
    if (idx < 0) break;
    mx = Math.max(mx, bars[idx]!.high);
  }
  return mx;
}

function highestCloseSince(i: number, len: number, bars: Bar[]) {
  let mx = bars[i]!.close;
  const n = Math.max(0, len);
  for (let k = 0; k <= n; k++) {
    const idx = i - k;
    if (idx < 0) break;
    mx = Math.max(mx, bars[idx]!.close);
  }
  return mx;
}

function lowestCloseSince(i: number, len: number, bars: Bar[]) {
  let mn = bars[i]!.close;
  const n = Math.max(0, len);
  for (let k = 0; k <= n; k++) {
    const idx = i - k;
    if (idx < 0) break;
    mn = Math.min(mn, bars[idx]!.close);
  }
  return mn;
}

function roomR(dir: 1 | -1, extreme: number, slDist: number, resPx: number[], supPx: number[]) {
  if (slDist <= 0) return 0;
  if (dir === 1) {
    let best = 1e20;
    for (const px of resPx) {
      if (px > extreme && px < best) best = px;
    }
    if (best < 1e20) return (best - extreme) / slDist;
    return 99;
  }
  let best = -1e20;
  for (const px of supPx) {
    if (px < extreme && px > best) best = px;
  }
  if (best > -1e20) return (extreme - best) / slDist;
  return 99;
}

/**
 * KETEX — APEX entries (ketex.txt).
 * TREX second-test structure + NEXUS quality (HTF EMA21, EMA84 regime, confirm close).
 * First-touch skipped. No break-even. Own family — does not mix with APEX / HALCYON / TREX.
 */
export function runKetexEngine(bars: Bar[], tf: Timeframe, htfBars?: Bar[]): EngineResult {
  const p = ketexProfile();
  const n = bars.length;
  const signals: Signal[] = [];
  const high = bars.map((b) => b.high);
  const low = bars.map((b) => b.low);
  const close = bars.map((b) => b.close);
  const catr = customAtr(high, low, close);
  const ema21 = ema(close, 21);
  const ema84 = ema(close, 84);

  const htfTf = HTF_OF[tf];
  const htfMs = TF_MS[htfTf];
  const barMs = TF_MS[tf];
  const htf = htfBars && htfBars.length > 10 ? htfBars : resample(bars, htfMs);
  const htfTimes = htf.map((b) => b.time);
  const htfClose = htf.map((b) => b.close);
  const htfEma = ema(htfClose, 21);

  const resPx: number[] = [];
  const resAtr: number[] = [];
  const resBar: number[] = [];
  const supPx: number[] = [];
  const supAtr: number[] = [];
  const supBar: number[] = [];

  let armFtc = NaN;
  let armSl = NaN;
  let armDir = 0;
  let armAge = 0;
  let lastFill = -9999;
  let lastBias: "LONG" | "SHORT" | "FLAT" = "FLAT";
  let lastArmed: "LONG" | "SHORT" | null = null;

  for (let i = 2; i < n; i++) {
    const bar = bars[i]!;
    const a = catr[i]!;
    const atrOk = Number.isFinite(a) && a > 0;

    let newHighPivot = false;
    let newLowPivot = false;
    let highExt = NaN;
    let highIn = NaN;
    let lowExt = NaN;
    let lowIn = NaN;

    if (atrOk) {
      const cH1 = coverHighAt(1, i, bars, catr, p);
      const cH2 = coverHighAt(2, i, bars, catr, p);
      const cL1 = coverLowAt(1, i, bars, catr, p);
      const cL2 = coverLowAt(2, i, bars, catr, p);

      newHighPivot = cH1.ok || (p.coverMax >= 2 && cH2.ok && !cH1.ok);
      newLowPivot = cL1.ok || (p.coverMax >= 2 && cL2.ok && !cL1.ok);
      highExt = cH1.ok ? cH1.extreme : cH2.extreme;
      highIn = cH1.ok ? cH1.inner : cH2.inner;
      lowExt = cL1.ok ? cL1.extreme : cL2.extreme;
      lowIn = cL1.ok ? cL1.inner : cL2.inner;

      if (newHighPivot && newLowPivot) {
        if (highExt - highIn >= lowIn - lowExt) newLowPivot = false;
        else newHighPivot = false;
      }
    }

    let isReversalHigh = false;
    let isReversalLow = false;

    if (newHighPivot) {
      for (let k = resPx.length - 1; k >= 0; k--) {
        const px = resPx[k]!;
        const pa = resAtr[k]!;
        const b = resBar[k]!;
        const band = p.bandAtr * Math.max(a, pa);
        const age = i - b;
        if (Math.abs(highExt - px) <= band && age >= 4) {
          const look = Math.min(300, age);
          const away = px - lowestSince(i, look, bars);
          const broken = highestCloseSince(i, look, bars) > px + 0.2 * pa;
          if (away >= p.minAwayAtr * pa && !broken) isReversalHigh = true;
          break;
        }
      }
      resPx.push(highExt);
      resAtr.push(a);
      resBar.push(i);
      if (resPx.length > 40) {
        resPx.shift();
        resAtr.shift();
        resBar.shift();
      }
    }

    if (newLowPivot) {
      for (let k = supPx.length - 1; k >= 0; k--) {
        const px = supPx[k]!;
        const pa = supAtr[k]!;
        const b = supBar[k]!;
        const band = p.bandAtr * Math.max(a, pa);
        const age = i - b;
        if (Math.abs(lowExt - px) <= band && age >= 4) {
          const look = Math.min(300, age);
          const away = highestSince(i, look, bars) - px;
          const broken = lowestCloseSince(i, look, bars) < px - 0.2 * pa;
          if (away >= p.minAwayAtr * pa && !broken) isReversalLow = true;
          break;
        }
      }
      supPx.push(lowExt);
      supAtr.push(a);
      supBar.push(i);
      if (supPx.length > 40) {
        supPx.shift();
        supAtr.shift();
        supBar.shift();
      }
    }

    const ltfClose = bar.time + barMs;
    const htfC = htfAt(htfTimes, htfClose, ltfClose, htfMs);
    const htfE = htfAt(htfTimes, htfEma, ltfClose, htfMs);
    const htfLongOk = !p.useHtf || !Number.isFinite(htfE) || htfC >= htfE * 0.997;
    const htfShortOk = !p.useHtf || !Number.isFinite(htfE) || htfC <= htfE * 1.003;

    if (atrOk) {
      const arm = (dir: 1 | -1, extreme: number, inner: number) => {
        const slBuf = p.slAtrMult * a;
        const sl = dir === 1 ? extreme - slBuf : extreme + slBuf;
        let ftc = (extreme + inner) * 0.5;
        ftc = dir === 1 ? Math.max(ftc, extreme + 0.2 * a) : Math.min(ftc, extreme - 0.2 * a);
        const slDist = Math.abs(ftc - sl);
        const rm = roomR(dir, extreme, slDist, resPx, supPx);
        const ok = rm >= p.minRoomR && i - lastFill >= p.cooldownBars;
        return { ok, ftc, sl };
      };

      if (isReversalHigh && htfShortOk) {
        const r = arm(-1, highExt, highIn);
        if (r.ok) {
          armFtc = r.ftc;
          armSl = r.sl;
          armDir = -1;
          armAge = 0;
        }
      }
      if (isReversalLow && htfLongOk) {
        const r = arm(1, lowExt, lowIn);
        if (r.ok) {
          armFtc = r.ftc;
          armSl = r.sl;
          armDir = 1;
          armAge = 0;
        }
      }
    }

    const e21 = ema21[i]!;
    const e84 = ema84[i]!;
    const regimeLong = !p.useEma84 || !Number.isFinite(e84) || bar.close >= e84;
    const regimeShort = !p.useEma84 || !Number.isFinite(e84) || bar.close <= e84;

    if (Number.isFinite(armFtc)) {
      armAge += 1;
      const invalidated = armDir === 1 ? bar.low <= armSl : bar.high >= armSl;
      const tagged = armDir === 1 ? bar.low <= armFtc : bar.high >= armFtc;
      if (invalidated) {
        armFtc = NaN;
        armDir = 0;
      } else if (tagged) {
        const confL = !p.confirmCl || bar.close > armFtc;
        const confS = !p.confirmCl || bar.close < armFtc;
        let filled = false;
        if (i >= WARMUP) {
          if (armDir === 1 && confL && regimeLong && p.sides !== "Short") {
            const slDist = Math.abs(armFtc - armSl);
            signals.push({
              barIndex: i,
              barTime: bar.time,
              indicator: p.name,
              side: "long",
              entry: armFtc,
              sl: armSl,
              tp: armFtc + p.rr * slDist,
              rr: p.rr,
              atr: a,
              reason: "KETEX 2.2R second-test support · NEXUS close · FTC tag",
            });
            filled = true;
          }
          if (armDir === -1 && confS && regimeShort && p.sides !== "Long") {
            const slDist = Math.abs(armFtc - armSl);
            signals.push({
              barIndex: i,
              barTime: bar.time,
              indicator: p.name,
              side: "short",
              entry: armFtc,
              sl: armSl,
              tp: armFtc - p.rr * slDist,
              rr: p.rr,
              atr: a,
              reason: "KETEX 2.2R second-test resistance · NEXUS close · FTC tag",
            });
            filled = true;
          }
        }
        if (filled) lastFill = i;
        armFtc = NaN;
        armDir = 0;
      } else if (armAge >= p.ftcWait) {
        armFtc = NaN;
        armDir = 0;
      }
    }

    lastBias =
      Number.isFinite(e21) && Number.isFinite(e84) && e21 > e84 && (!p.useHtf || htfC > htfE)
        ? "LONG"
        : Number.isFinite(e21) && Number.isFinite(e84) && e21 < e84 && (!p.useHtf || htfC < htfE)
          ? "SHORT"
          : "FLAT";
    lastArmed = Number.isFinite(armFtc) ? (armDir === 1 ? "LONG" : "SHORT") : null;
  }

  const last = bars[n - 1];
  return {
    signals,
    lastAtr: n ? catr[n - 1]! : NaN,
    lastClose: last ? last.close : NaN,
    lastBias,
    armed: lastArmed,
  };
}
