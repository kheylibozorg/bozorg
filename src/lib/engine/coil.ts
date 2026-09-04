import { atr, customAtr, dmi, ema, htfAt, resample, sma, trueRange } from "./math.ts";
import {
  TF_MS,
  WARMUP,
  type Bar,
  type EngineResult,
  type HalcyonName,
  type Signal,
  type SidesFilter,
  type Timeframe,
} from "./types.ts";

const EPS = 1e-10;
const LOG14 = Math.log10(14);

export type CoilProfile = {
  name: HalcyonName;
  rr: number;
  sides: SidesFilter;
  /** Aegis family 5m fades a locked 15m box. Original Coil is always native. */
  useHtfLock: boolean;
  qualityFill: boolean;
  boxLen: number;
  minCompress: number;
  minAge: number;
  unlockBars: number;
  adxMax: number;
  squeeze: number;
  chopMin: number;
  emaSepMax: number;
  minRangeAtr: number;
  maxRangeAtr: number;
  ftcWait: number;
  cooldownBars: number;
  slAtrMult: number;
  minStopPct: number;
  minTpPct: number;
  bufferFrac: number;
  maxTpBoxFrac: number;
  maxSlFrac: number;
  edgePct: number;
  awayPct: number;
  entryMaxPct: number;
  maxPokeAtr: number;
  breakAtr: number;
  adxKill: number;
  volMax: number;
  useSqueeze: boolean;
  requireInside: boolean;
  fillCloseLoc: number;
  fillMinBody: number;
  fillRequirePoke: boolean;
  fillChopMin: number;
  minBoxPct: number;
};

type LockParams = {
  boxLen: number;
  minCompress: number;
  minAge: number;
  unlockBars: number;
  adxMax: number;
  squeeze: number;
  chopMin: number;
  emaSepMax: number;
  minRangeAtr: number;
  maxRangeAtr: number;
  breakAtr: number;
  adxKill: number;
  useSqueeze: boolean;
};

function is5(tf: Timeframe) {
  return tf === "5m";
}
function is15(tf: Timeframe) {
  return tf === "15m";
}
function is1h(tf: Timeframe) {
  return tf === "1h";
}

/** 5m Aegis/Vesper/Orion lock the 15m box with these params (Pine request.security). */
const HTF_LOCK_5M: LockParams = {
  boxLen: 16,
  minCompress: 3,
  minAge: 1,
  unlockBars: 10,
  adxMax: 30,
  squeeze: 1.05,
  chopMin: 38,
  emaSepMax: 1.8,
  minRangeAtr: 0.9,
  maxRangeAtr: 5.5,
  breakAtr: 0.1,
  adxKill: 32,
  useSqueeze: true,
};

function aegisLock(tf: Timeframe): LockParams {
  if (is5(tf)) return { ...HTF_LOCK_5M };
  return {
    boxLen: is15(tf) ? 20 : is1h(tf) ? 16 : 14,
    minCompress: 3,
    minAge: 1,
    unlockBars: 12,
    adxMax: 32,
    squeeze: 1.1,
    chopMin: 36,
    emaSepMax: 2.2,
    minRangeAtr: 0.8,
    maxRangeAtr: 6.0,
    breakAtr: 0.1,
    adxKill: 32,
    useSqueeze: true,
  };
}

function aegisFillGates(tf: Timeframe, rr: number) {
  let fillCloseLoc = 0.62;
  let maxSlFrac = 0.32;
  let fillMinBody = 0.0;
  let fillRequirePoke = false;
  let fillChopMin = 0.0;
  let minBoxPct = 0.0;
  if (is5(tf)) {
    if (rr >= 1.9) {
      fillCloseLoc = 0.74;
      maxSlFrac = 0.16;
      fillMinBody = 0.28;
      fillChopMin = 50;
    } else if (rr >= 1.4) {
      fillCloseLoc = 0.74;
      maxSlFrac = 0.16;
      fillMinBody = 0.24;
      fillChopMin = 46;
    } else {
      fillCloseLoc = 0.76;
      maxSlFrac = 0.2;
      fillRequirePoke = true;
    }
  } else if (is15(tf)) {
    if (rr >= 1.9) {
      fillCloseLoc = 0.8;
      maxSlFrac = 0.16;
      fillMinBody = 0.18;
    } else if (rr >= 1.4) {
      fillCloseLoc = 0.8;
      maxSlFrac = 0.32;
      fillMinBody = 0.16;
      minBoxPct = 0.018;
    } else {
      fillCloseLoc = 0.62;
      maxSlFrac = 0.24;
      fillMinBody = 0.16;
      fillRequirePoke = true;
    }
  } else if (is1h(tf)) {
    if (rr >= 1.9) {
      fillCloseLoc = 0.74;
      maxSlFrac = 0.32;
      fillMinBody = 0.16;
    } else if (rr >= 1.4) {
      fillCloseLoc = 0.74;
      maxSlFrac = 0.32;
    } else {
      fillCloseLoc = 0.62;
      maxSlFrac = 0.28;
    }
  } else {
    fillCloseLoc = 0.62;
    maxSlFrac = 0.32;
  }
  return { fillCloseLoc, maxSlFrac, fillMinBody, fillRequirePoke, fillChopMin, minBoxPct };
}

/**
 * HALCYON Aegis (1.0R) / Vesper (1.5R) / Orion (2.0R) — same lock + FTC spring.
 * Quality is the fill. 5m fades a locked 15-minute box, lookahead_off.
 */
function aegisProfile(name: HalcyonName, tf: Timeframe, rr: number): CoilProfile {
  const lock = aegisLock(tf);
  const fill = aegisFillGates(tf, rr);
  return {
    name,
    rr,
    sides: "Both",
    useHtfLock: is5(tf),
    qualityFill: true,
    boxLen: lock.boxLen,
    minCompress: lock.minCompress,
    minAge: lock.minAge,
    unlockBars: lock.unlockBars,
    adxMax: lock.adxMax,
    squeeze: lock.squeeze,
    chopMin: lock.chopMin,
    emaSepMax: lock.emaSepMax,
    minRangeAtr: lock.minRangeAtr,
    maxRangeAtr: lock.maxRangeAtr,
    ftcWait: is5(tf) ? 18 : 10,
    cooldownBars: 2,
    slAtrMult: 0.14,
    minStopPct: is5(tf) ? 0.003 : 0.0032,
    minTpPct: is5(tf) ? 0.003 : 0.005,
    bufferFrac: 0.03,
    maxTpBoxFrac: 0.7,
    maxSlFrac: fill.maxSlFrac,
    edgePct: 0.2,
    awayPct: 0.28,
    entryMaxPct: 0.32,
    maxPokeAtr: 0.55,
    breakAtr: 0.1,
    adxKill: 32,
    volMax: is5(tf) ? 3 : 9,
    useSqueeze: true,
    requireInside: true,
    fillCloseLoc: fill.fillCloseLoc,
    fillMinBody: fill.fillMinBody,
    fillRequirePoke: fill.fillRequirePoke,
    fillChopMin: fill.fillChopMin,
    minBoxPct: fill.minBoxPct,
  };
}

/**
 * Original HALCYON Coil (رنج.txt) — native box per TF, 2.2R must fit.
 * Auto profile: 5m / 15m / 1H / 4H. No HTF fade.
 */
function originalCoilProfile(tf: Timeframe): CoilProfile {
  let boxLen = 16;
  let minCompress = 4;
  let adxMax = 26;
  let fillCloseLoc = 0.62;
  let volMax = 9;
  if (tf === "5m") {
    boxLen = 24;
    minCompress = 6;
    adxMax = 20;
    fillCloseLoc = 0.78;
    volMax = 1.6;
  } else if (tf === "15m") {
    boxLen = 20;
    minCompress = 5;
    adxMax = 26;
    fillCloseLoc = 0.62;
    volMax = 1.8;
  } else if (tf === "1h") {
    boxLen = 16;
    minCompress = 4;
    adxMax = 26;
    fillCloseLoc = 0.62;
    volMax = 9;
  } else {
    boxLen = 16;
    minCompress = 4;
    adxMax = 26;
    fillCloseLoc = 0.62;
    volMax = 9;
  }
  return {
    name: "HALC",
    rr: 2.2,
    sides: "Both",
    useHtfLock: false,
    qualityFill: false,
    boxLen,
    minCompress,
    minAge: 2,
    unlockBars: 8,
    adxMax,
    squeeze: 0.95,
    chopMin: 42,
    emaSepMax: 1.5,
    minRangeAtr: 1.1,
    maxRangeAtr: 4.4,
    ftcWait: 6,
    cooldownBars: 3,
    slAtrMult: 0.14,
    minStopPct: 0.0032,
    minTpPct: 0,
    bufferFrac: 0.03,
    maxTpBoxFrac: 1,
    maxSlFrac: 0.38,
    edgePct: 0.2,
    awayPct: 0.28,
    entryMaxPct: 0.32,
    maxPokeAtr: 0.55,
    breakAtr: 0.1,
    adxKill: 32,
    volMax,
    useSqueeze: true,
    requireInside: false,
    fillCloseLoc,
    fillMinBody: 0,
    fillRequirePoke: false,
    fillChopMin: 0,
    minBoxPct: 0,
  };
}

export function coilProfile(name: HalcyonName, tf: Timeframe): CoilProfile {
  if (name === "HAEG") return aegisProfile(name, tf, 1.0);
  if (name === "HVES") return aegisProfile(name, tf, 1.5);
  if (name === "HORI") return aegisProfile(name, tf, 2.0);
  return originalCoilProfile(tf);
}

type Ind = {
  catr: number[];
  atrRatio: number[];
  ema21: number[];
  ema84: number[];
  adx: number[];
  chop: number[];
  volSma: number[];
};

function indicators(bars: Bar[]): Ind {
  const high = bars.map((b) => b.high);
  const low = bars.map((b) => b.low);
  const close = bars.map((b) => b.close);
  const vol = bars.map((b) => b.volume);
  const catr = customAtr(high, low, close);
  const atr14 = atr(high, low, close, 14);
  const atr100 = atr(high, low, close, 100);
  const atrRatio = atr14.map((a, i) => a / Math.max(atr100[i]!, 1e-12));
  const ema21 = ema(close, 21);
  const ema84 = ema(close, 84);
  const { adx } = dmi(high, low, close, 14, 14);
  const tr = trueRange(high, low, close);
  const chop = new Array<number>(bars.length).fill(NaN);
  let trSum = 0;
  for (let i = 0; i < bars.length; i++) {
    trSum += Number.isFinite(tr[i]!) ? tr[i]! : 0;
    if (i >= 14) trSum -= Number.isFinite(tr[i - 14]!) ? tr[i - 14]! : 0;
    if (i < 13) continue;
    let hh = -Infinity;
    let ll = Infinity;
    for (let k = 0; k < 14; k++) {
      const b = bars[i - k]!;
      if (b.high > hh) hh = b.high;
      if (b.low < ll) ll = b.low;
    }
    const den = Math.max(hh - ll, 1e-10);
    chop[i] = (100 * Math.log10(Math.max(trSum, 1e-10) / den)) / LOG14;
  }
  return { catr, atrRatio, ema21, ema84, adx, chop, volSma: sma(vol, 20) };
}

function prevWindow(src: number[], i: number, len: number, wantHigh: boolean) {
  let best = wantHigh ? -Infinity : Infinity;
  let age = 0;
  let found = false;
  for (let k = 1; k <= len; k++) {
    const idx = i - k;
    if (idx < 0) return { val: NaN, age: NaN };
    const v = src[idx]!;
    const better = wantHigh ? v > best : v < best;
    if (!found || better) {
      best = v;
      age = k - 1;
      found = true;
    }
  }
  return { val: found ? best : NaN, age: found ? age : NaN };
}

function lockParamsOf(p: CoilProfile): LockParams {
  return {
    boxLen: p.boxLen,
    minCompress: p.minCompress,
    minAge: p.minAge,
    unlockBars: p.unlockBars,
    adxMax: p.adxMax,
    squeeze: p.squeeze,
    chopMin: p.chopMin,
    emaSepMax: p.emaSepMax,
    minRangeAtr: p.minRangeAtr,
    maxRangeAtr: p.maxRangeAtr,
    breakAtr: p.breakAtr,
    adxKill: p.adxKill,
    useSqueeze: p.useSqueeze,
  };
}

/** Pine f_lock_at — var state lives on the series it is called on. */
export function lockCoil(bars: Bar[], ind: Ind, p: LockParams) {
  const n = bars.length;
  const locked = new Array<boolean>(n).fill(false);
  const lockHi = new Array<number>(n).fill(NaN);
  const lockLo = new Array<number>(n).fill(NaN);
  const high = bars.map((b) => b.high);
  const low = bars.map((b) => b.low);
  let compressRun = 0;
  let unlockRun = 0;
  let isLocked = false;
  let hi = NaN;
  let lo = NaN;
  for (let i = 0; i < n; i++) {
    const boxH = prevWindow(high, i, p.boxLen, true);
    const boxL = prevWindow(low, i, p.boxLen, false);
    const catr = ind.catr[i]!;
    const adx = ind.adx[i]!;
    const atrRatio = ind.atrRatio[i]!;
    const e21 = ind.ema21[i]!;
    const e84 = ind.ema84[i]!;
    const chop = ind.chop[i]!;
    const ht = boxH.val - boxL.val;
    let compressing = false;
    if (Number.isFinite(catr) && catr > 0 && Number.isFinite(ht) && ht > 0) {
      const ha = ht / catr;
      const adxOk = !Number.isFinite(adx) || adx <= p.adxMax;
      const sqOk = !p.useSqueeze || !Number.isFinite(atrRatio) || atrRatio <= p.squeeze;
      const chopOk = !Number.isFinite(chop) || chop >= p.chopMin;
      const emaOk =
        !Number.isFinite(e21) || !Number.isFinite(e84) || Math.abs(e21 - e84) <= p.emaSepMax * catr;
      const ageOk =
        Number.isFinite(boxH.age) &&
        Number.isFinite(boxL.age) &&
        boxH.age >= p.minAge &&
        boxL.age >= p.minAge;
      const widthOk = ha >= p.minRangeAtr && ha <= p.maxRangeAtr;
      compressing = adxOk && sqOk && chopOk && emaOk && ageOk && widthOk;
    }
    compressRun = compressing ? compressRun + 1 : 0;
    unlockRun = compressing ? 0 : unlockRun + 1;
    if (!isLocked) {
      if (compressRun >= p.minCompress && Number.isFinite(catr) && catr > 0 && Number.isFinite(boxH.val)) {
        isLocked = true;
        hi = boxH.val;
        lo = boxL.val;
      }
    }
    const height = hi - lo;
    const bar = bars[i]!;
    const broke =
      isLocked &&
      Number.isFinite(catr) &&
      (bar.close > hi + p.breakAtr * catr || bar.close < lo - p.breakAtr * catr);
    const adxDead = isLocked && Number.isFinite(adx) && adx >= p.adxKill;
    if (isLocked && (broke || adxDead || unlockRun >= p.unlockBars || !Number.isFinite(height) || height <= 0)) {
      isLocked = false;
      hi = NaN;
      lo = NaN;
    }
    locked[i] = isLocked;
    lockHi[i] = hi;
    lockLo[i] = lo;
  }
  return { locked, lockHi, lockLo };
}

function mapHtfLock(
  ltf: Bar[],
  ltfMs: number,
  htf: Bar[],
  htfMs: number,
  locked: boolean[],
  hi: number[],
  lo: number[],
) {
  const times = htf.map((b) => b.time);
  const lockN = locked.map((v) => (v ? 1 : 0));
  const outL = new Array<boolean>(ltf.length).fill(false);
  const outH = new Array<number>(ltf.length).fill(NaN);
  const outLo = new Array<number>(ltf.length).fill(NaN);
  for (let i = 0; i < ltf.length; i++) {
    const closeTime = ltf[i]!.time + ltfMs;
    outL[i] = htfAt(times, lockN, closeTime, htfMs) > 0.5;
    outH[i] = htfAt(times, hi, closeTime, htfMs);
    outLo[i] = htfAt(times, lo, closeTime, htfMs);
  }
  return { locked: outL, lockHi: outH, lockLo: outLo };
}

function reasonOf(name: HalcyonName, rr: number, side: "long" | "short") {
  const label =
    name === "HAEG" ? "Aegis" : name === "HVES" ? "Vesper" : name === "HORI" ? "Orion" : "Coil";
  const edge = side === "long" ? "support" : "resistance";
  return `HALCYON ${label} ${rr}R coil ${edge} · FTC tag`;
}

function fillCoil(
  bars: Bar[],
  ind: Ind,
  locked: boolean[],
  lockHi: number[],
  lockLo: number[],
  p: CoilProfile,
): EngineResult {
  const n = bars.length;
  const signals: Signal[] = [];
  let prevLocked = false;
  let loTouches = 0;
  let hiTouches = 0;
  let leftLo = false;
  let leftHi = false;
  let lastFill = -9999;
  let armFtc = NaN;
  let armSl = NaN;
  let armDir = 0;
  let armAge = 0;
  let lastArmed: "LONG" | "SHORT" | null = null;

  for (let i = 0; i < n; i++) {
    const bar = bars[i]!;
    const coilOn = locked[i] === true && Number.isFinite(lockHi[i]) && Number.isFinite(lockLo[i]);
    const justLocked = coilOn && !prevLocked;
    prevLocked = coilOn;

    if (justLocked) {
      loTouches = 1;
      hiTouches = 1;
      const ht0 = lockHi[i]! - lockLo[i]!;
      leftLo = bar.close >= lockLo[i]! + p.awayPct * ht0;
      leftHi = bar.close <= lockHi[i]! - p.awayPct * ht0;
      armFtc = NaN;
      armDir = 0;
    }
    if (!coilOn) {
      armFtc = NaN;
      armDir = 0;
      loTouches = 0;
      hiTouches = 0;
      leftLo = false;
      leftHi = false;
      continue;
    }

    const height = lockHi[i]! - lockLo[i]!;
    const rng = Math.max(bar.high - bar.low, EPS);
    const closeLocL = (bar.close - bar.low) / rng;
    const closeLocS = (bar.high - bar.close) / rng;
    const body = Math.abs(bar.close - bar.open) / rng;
    const vs = ind.volSma[i]!;
    const volOk = p.volMax >= 8.5 || !Number.isFinite(vs) || vs <= 0 || bar.volume <= p.volMax * vs;
    const catr = ind.catr[i]!;
    const chop = ind.chop[i]!;

    if (!justLocked && Number.isFinite(armFtc) && armDir !== 0) {
      armAge += 1;
      const tagged = armDir === 1 ? bar.low <= armFtc : bar.high >= armFtc;
      const conf = armDir === 1 ? bar.close > armFtc : bar.close < armFtc;
      const loc = armDir === 1 ? closeLocL : closeLocS;
      const locOk = loc >= p.fillCloseLoc;
      const invalidated = armDir === 1 ? bar.close < armSl : bar.close > armSl;
      const inside = p.requireInside ? bar.close >= lockLo[i]! && bar.close <= lockHi[i]! : true;
      const fillSlOk = p.qualityFill ? (armDir === 1 ? bar.low > armSl : bar.high < armSl) : true;
      const fillPoke = armDir === 1 ? bar.low < lockLo[i]! : bar.high > lockHi[i]!;
      const fillBodyOk = !Number.isFinite(body) || body >= p.fillMinBody;
      const fillPokeOk = !p.fillRequirePoke || fillPoke;
      const fillChopOk = !Number.isFinite(chop) || chop >= p.fillChopMin;
      const sideBlocked = p.sides === (armDir === 1 ? "Short" : "Long");
      if (armAge > p.ftcWait) {
        armFtc = NaN;
        armDir = 0;
      } else if (tagged) {
        if (
          conf &&
          locOk &&
          inside &&
          fillSlOk &&
          fillBodyOk &&
          fillPokeOk &&
          fillChopOk &&
          !sideBlocked &&
          i >= WARMUP
        ) {
          const risk = Math.abs(armFtc - armSl);
          const tp = armDir === 1 ? armFtc + p.rr * risk : armFtc - p.rr * risk;
          const fit =
            armDir === 1
              ? tp <= lockHi[i]! - p.bufferFrac * height
              : tp >= lockLo[i]! + p.bufferFrac * height;
          const near =
            armDir === 1
              ? armFtc - lockLo[i]! <= p.entryMaxPct * height
              : lockHi[i]! - armFtc <= p.entryMaxPct * height;
          const tpPct = Math.abs(tp - armFtc) / armFtc;
          const tpBox = Math.abs(tp - armFtc) / height;
          const tpPctOk = !p.qualityFill || tpPct + 1e-12 >= p.minTpPct;
          const tpBoxOk = !p.qualityFill || tpBox <= p.maxTpBoxFrac + 1e-12;
          if (fit && near && risk > 0 && tpPctOk && tpBoxOk && i - lastFill >= p.cooldownBars) {
            const side = armDir === 1 ? "long" : "short";
            signals.push({
              barIndex: i,
              barTime: bar.time,
              indicator: p.name,
              side,
              entry: armFtc,
              sl: armSl,
              tp,
              rr: p.rr,
              atr: catr,
              reason: reasonOf(p.name, p.rr, side),
            });
            lastFill = i;
            if (armDir === 1) leftLo = false;
            else leftHi = false;
          }
        }
        armFtc = NaN;
        armDir = 0;
      } else if (invalidated) {
        armFtc = NaN;
        armDir = 0;
      }
    }

    if (
      !justLocked &&
      !Number.isFinite(armFtc) &&
      i - lastFill >= p.cooldownBars &&
      Number.isFinite(catr) &&
      catr > 0 &&
      height > 0
    ) {
      const nearLo = bar.low <= lockLo[i]! + p.edgePct * height;
      const nearHi = bar.high >= lockHi[i]! - p.edgePct * height;
      const pokeLo = bar.low < lockLo[i]!;
      const pokeHi = bar.high > lockHi[i]!;
      const pokeOkLo = pokeLo ? lockLo[i]! - bar.low <= p.maxPokeAtr * catr : true;
      const pokeOkHi = pokeHi ? bar.high - lockHi[i]! <= p.maxPokeAtr * catr : true;
      if (nearLo) loTouches += 1;
      else if (bar.close >= lockLo[i]! + p.awayPct * height) leftLo = true;
      if (nearHi) hiTouches += 1;
      else if (bar.close <= lockHi[i]! - p.awayPct * height) leftHi = true;

      let goL =
        leftLo &&
        nearLo &&
        pokeOkLo &&
        volOk &&
        loTouches >= 2 &&
        bar.close >= lockLo[i]! &&
        bar.close - lockLo[i]! <= p.entryMaxPct * height &&
        closeLocL >= 0.45;
      let goS =
        leftHi &&
        nearHi &&
        pokeOkHi &&
        volOk &&
        hiTouches >= 2 &&
        bar.close <= lockHi[i]! &&
        lockHi[i]! - bar.close <= p.entryMaxPct * height &&
        closeLocS >= 0.45;
      if (goL && goS) {
        if (bar.close - lockLo[i]! <= lockHi[i]! - bar.close) goS = false;
        else goL = false;
      }
      const armSide = goL ? 1 : goS ? -1 : 0;
      if (armSide !== 0 && p.sides !== (armSide === 1 ? "Short" : "Long")) {
        const ftc = armSide === 1 ? Math.min(bar.low, lockLo[i]!) : Math.max(bar.high, lockHi[i]!);
        const minSl = p.minStopPct * ftc;
        let slDist = Math.max(p.slAtrMult * catr, minSl);
        if (p.qualityFill && p.minTpPct > 0) slDist = Math.max(slDist, (p.minTpPct * ftc) / p.rr);
        const room =
          armSide === 1
            ? lockHi[i]! - p.bufferFrac * height - ftc
            : ftc - (lockLo[i]! + p.bufferFrac * height);
        if (room > 0) {
          const maxForRr = room / p.rr;
          if (slDist > maxForRr) slDist = maxForRr;
          const slOk = slDist >= minSl && slDist <= p.maxSlFrac * height;
          const tpDist = p.rr * slDist;
          const tpOk = !p.qualityFill || tpDist / ftc + 1e-12 >= p.minTpPct;
          const tpBoxOk = !p.qualityFill || tpDist / height <= p.maxTpBoxFrac + 1e-12;
          const boxPctOk = !p.qualityFill || height / ftc >= p.minBoxPct;
          if (slOk && tpOk && tpBoxOk && boxPctOk) {
            armFtc = ftc;
            armSl = armSide === 1 ? ftc - slDist : ftc + slDist;
            armDir = armSide;
            armAge = 0;
            lastArmed = armSide === 1 ? "LONG" : "SHORT";
          }
        }
      }
    }
  }

  const last = bars[n - 1];
  return {
    signals,
    lastAtr: ind.catr[n - 1] ?? NaN,
    lastClose: last?.close ?? NaN,
    lastBias: locked[n - 1] ? lastArmed ?? "FLAT" : "FLAT",
    armed: Number.isFinite(armFtc) ? (armDir === 1 ? "LONG" : armDir === -1 ? "SHORT" : null) : null,
  };
}

export function runCoilEngine(
  bars: Bar[],
  tf: Timeframe,
  name: HalcyonName,
  htfBars?: Bar[],
): EngineResult {
  const p = coilProfile(name, tf);
  if (!bars.length) {
    return { signals: [], lastAtr: NaN, lastClose: NaN, lastBias: "FLAT", armed: null };
  }
  const native = indicators(bars);
  let locked: boolean[];
  let lockHi: number[];
  let lockLo: number[];
  if (p.useHtfLock) {
    const htfMs = TF_MS["15m"];
    const htf = htfBars && htfBars.length > 10 ? htfBars : resample(bars, htfMs);
    const htfInd = indicators(htf);
    const raw = lockCoil(htf, htfInd, HTF_LOCK_5M);
    const mapped = mapHtfLock(bars, TF_MS[tf], htf, htfMs, raw.locked, raw.lockHi, raw.lockLo);
    locked = mapped.locked;
    lockHi = mapped.lockHi;
    lockLo = mapped.lockLo;
  } else {
    const raw = lockCoil(bars, native, lockParamsOf(p));
    locked = raw.locked;
    lockHi = raw.lockHi;
    lockLo = raw.lockLo;
  }
  return fillCoil(bars, native, locked, lockHi, lockLo, p);
}
