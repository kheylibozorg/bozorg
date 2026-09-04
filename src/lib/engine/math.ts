/** Wilder RMA — matches Pine `ta.rma` / `ta.atr` smoothing. */
export function rma(src: number[], length: number): number[] {
  const out = new Array<number>(src.length).fill(NaN);
  if (length <= 0 || src.length === 0) return out;
  let sum = 0;
  let seeded = false;
  let prev = 0;
  for (let i = 0; i < src.length; i++) {
    const v = src[i]!;
    if (!Number.isFinite(v)) continue;
    if (!seeded) {
      sum += v;
      if (i + 1 === length) {
        prev = sum / length;
        out[i] = prev;
        seeded = true;
      }
      continue;
    }
    prev = (prev * (length - 1) + v) / length;
    out[i] = prev;
  }
  return out;
}

export function ema(src: number[], length: number): number[] {
  const out = new Array<number>(src.length).fill(NaN);
  if (length <= 0) return out;
  const k = 2 / (length + 1);
  let prev = NaN;
  let sum = 0;
  for (let i = 0; i < src.length; i++) {
    const v = src[i]!;
    if (!Number.isFinite(v)) continue;
    if (!Number.isFinite(prev)) {
      sum += v;
      if (i + 1 >= length) {
        prev = sum / length;
        out[i] = prev;
      }
      continue;
    }
    prev = v * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

export function sma(src: number[], length: number): number[] {
  const out = new Array<number>(src.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < src.length; i++) {
    const v = src[i]!;
    sum += Number.isFinite(v) ? v : 0;
    if (i >= length) {
      const old = src[i - length]!;
      sum -= Number.isFinite(old) ? old : 0;
    }
    if (i >= length - 1) out[i] = sum / length;
  }
  return out;
}

export function trueRange(high: number[], low: number[], close: number[]): number[] {
  const tr = new Array<number>(high.length).fill(NaN);
  for (let i = 0; i < high.length; i++) {
    if (i === 0) {
      tr[i] = high[i]! - low[i]!;
      continue;
    }
    const hl = high[i]! - low[i]!;
    const hc = Math.abs(high[i]! - close[i - 1]!);
    const lc = Math.abs(low[i]! - close[i - 1]!);
    tr[i] = Math.max(hl, hc, lc);
  }
  return tr;
}

export function atr(high: number[], low: number[], close: number[], length: number) {
  return rma(trueRange(high, low, close), length);
}

/** Weighted custom ATR from the Pine scripts. */
export function customAtr(high: number[], low: number[], close: number[]): number[] {
  const a5 = atr(high, low, close, 5);
  const a10 = atr(high, low, close, 10);
  const a21 = atr(high, low, close, 21);
  const a66 = atr(high, low, close, 66);
  const a132 = atr(high, low, close, 132);
  const a264 = atr(high, low, close, 264);
  const out = new Array<number>(high.length).fill(NaN);
  for (let i = 0; i < high.length; i++) {
    const v =
      (a5[i]! * 1 +
        a10[i]! * 1 +
        a21[i]! * 2 +
        a66[i]! * 3 +
        a132[i]! * 5 +
        a264[i]! * 8) /
      20;
    out[i] = v;
  }
  return out;
}

export function rsi(close: number[], length = 14): number[] {
  const out = new Array<number>(close.length).fill(NaN);
  const gain: number[] = new Array(close.length).fill(0);
  const loss: number[] = new Array(close.length).fill(0);
  for (let i = 1; i < close.length; i++) {
    const d = close[i]! - close[i - 1]!;
    gain[i] = d > 0 ? d : 0;
    loss[i] = d < 0 ? -d : 0;
  }
  const avgG = rma(gain, length);
  const avgL = rma(loss, length);
  for (let i = 0; i < close.length; i++) {
    const g = avgG[i]!;
    const l = avgL[i]!;
    if (!Number.isFinite(g) || !Number.isFinite(l)) continue;
    if (l === 0) out[i] = 100;
    else out[i] = 100 - 100 / (1 + g / l);
  }
  return out;
}

/** Pine `ta.dmi(len, adxLen)` → [pdi, mdi, adx] */
export function dmi(
  high: number[],
  low: number[],
  close: number[],
  len = 14,
  adxLen = 14,
): { pdi: number[]; mdi: number[]; adx: number[] } {
  const n = high.length;
  const plusDM = new Array<number>(n).fill(0);
  const minusDM = new Array<number>(n).fill(0);
  for (let i = 1; i < n; i++) {
    const up = high[i]! - high[i - 1]!;
    const down = low[i - 1]! - low[i]!;
    plusDM[i] = up > down && up > 0 ? up : 0;
    minusDM[i] = down > up && down > 0 ? down : 0;
  }
  const tr = rma(trueRange(high, low, close), len);
  const pdm = rma(plusDM, len);
  const mdm = rma(minusDM, len);
  const pdi = new Array<number>(n).fill(NaN);
  const mdi = new Array<number>(n).fill(NaN);
  const dx = new Array<number>(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    const t = tr[i]!;
    if (!Number.isFinite(t) || t === 0) continue;
    pdi[i] = (100 * pdm[i]!) / t;
    mdi[i] = (100 * mdm[i]!) / t;
    const den = pdi[i]! + mdi[i]!;
    if (den === 0) dx[i] = 0;
    else dx[i] = (100 * Math.abs(pdi[i]! - mdi[i]!)) / den;
  }
  return { pdi, mdi, adx: rma(dx, adxLen) };
}

export function resample(
  bars: { time: number; open: number; high: number; low: number; close: number; volume: number }[],
  tfMs: number,
) {
  const out: typeof bars = [];
  let cur: (typeof bars)[number] | null = null;
  let bucket = -1;
  for (const b of bars) {
    const k = Math.floor(b.time / tfMs) * tfMs;
    if (k !== bucket) {
      if (cur) out.push(cur);
      bucket = k;
      cur = { time: k, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume };
    } else if (cur) {
      cur.high = Math.max(cur.high, b.high);
      cur.low = Math.min(cur.low, b.low);
      cur.close = b.close;
      cur.volume += b.volume;
    }
  }
  if (cur) out.push(cur);
  return out;
}

/**
 * Pine `request.security(..., lookahead_off)`: the HTF bar is only visible
 * on the LTF bar whose close is at or after that HTF close.
 * `ltfCloseTime` = LTF open + LTF duration. `htfMs` = HTF duration.
 */
export function htfAt(
  times: number[],
  values: number[],
  ltfCloseTime: number,
  htfMs: number,
): number {
  if (!times.length || !Number.isFinite(htfMs) || htfMs <= 0) return NaN;
  let lo = 0;
  let hi = times.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const htfClose = times[mid]! + htfMs;
    if (htfClose <= ltfCloseTime + 1) {
      idx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return idx >= 0 ? values[idx]! : NaN;
}
