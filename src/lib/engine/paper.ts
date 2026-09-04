import { FEE_BPS, type Bar, type Signal, type Side } from "./types.ts";

const EPS = 1e-10;

export type PaperFill = {
  side: Side;
  entry: number;
  sl: number;
  tp: number;
  qty: number;
  leverage: number;
  notional: number;
  risk: number;
  fees: number;
  indicator: string;
  timeframe: string;
  symbol: string;
  openedBarTime: number;
};

export type PaperExit = PaperFill & {
  exit: number;
  reason: "sl" | "tp" | "be";
  pnl: number;
  pnlR: number;
  closedBarTime: number;
};

/** Margin = capitalPct of equity. Notional = margin × max leverage of that coin. */
export function sizePosition(opts: {
  equity: number;
  capitalPct: number;
  entry: number;
  sl: number;
  leverage: number;
  usedMargin?: number;
}) {
  const lev = Math.max(1, opts.leverage);
  const pct = Math.min(100, Math.max(1, opts.capitalPct));
  const want = opts.equity * (pct / 100);
  const used = Math.max(0, opts.usedMargin ?? 0);
  const free = Math.max(0, opts.equity - used);
  if (want <= 0 || opts.entry <= 0 || free < want * 0.9) return null;
  const margin = Math.min(want, free * 0.98);
  if (!(margin > 0)) return null;
  const notional = margin * lev;
  const qty = notional / opts.entry;
  if (!(qty > 0)) return null;
  const slDist = Math.abs(opts.entry - opts.sl);
  return {
    qty,
    notional,
    margin,
    risk: qty * slDist,
    leverage: lev,
    fees: (notional * FEE_BPS) / 10000,
  };
}

/** Same-bar SL+TP = SL, matching the APEX header contract. */
export function pathExit(side: Side, sl: number, tp: number, bar: Bar): "sl" | "tp" | null {
  if (side === "long") {
    const hitSl = bar.low <= sl;
    const hitTp = bar.high >= tp;
    if (hitSl && hitTp) return "sl";
    if (hitSl) return "sl";
    if (hitTp) return "tp";
    return null;
  }
  const hitSl = bar.high >= sl;
  const hitTp = bar.low <= tp;
  if (hitSl && hitTp) return "sl";
  if (hitSl) return "sl";
  if (hitTp) return "tp";
  return null;
}

export type PathHit = {
  reason: "sl" | "tp" | "be";
  exit: number;
  sl: number;
  barTime: number;
};

/**
 * Walk every bar after the fill (oldest first). First touch of SL/TP wins.
 * TREX: once price travels beAtR in favor, stop moves to entry on that bar
 * before the same-bar SL/TP check — same as the paper simulator.
 */
export function walkPath(opts: {
  side: Side;
  entry: number;
  sl: number;
  tp: number;
  bars: Bar[];
  beAtR?: number | null;
}): { sl: number; beMoved: boolean; hit: PathHit | null; barsHeld: number } {
  let sl = opts.sl;
  const origSl = opts.sl;
  let beMoved = false;
  let i = 0;
  for (const bar of opts.bars) {
    i += 1;
    let hit = pathExit(opts.side, sl, opts.tp, bar);
    if (!hit && opts.beAtR && !beMoved) {
      const dist = Math.abs(opts.entry - origSl);
      const fav = opts.side === "long" ? bar.high - opts.entry : opts.entry - bar.low;
      if (dist > 0 && fav >= opts.beAtR * dist) {
        sl = opts.entry;
        beMoved = true;
        hit = pathExit(opts.side, sl, opts.tp, bar);
      }
    }
    if (hit) {
      const atBe = beMoved && Math.abs(sl - opts.entry) <= EPS * Math.max(1, opts.entry);
      const reason: PathHit["reason"] = hit === "tp" ? "tp" : atBe ? "be" : "sl";
      const exit = hit === "sl" ? sl : opts.tp;
      return { sl, beMoved, hit: { reason, exit, sl, barTime: bar.time }, barsHeld: i };
    }
  }
  return { sl, beMoved, hit: null, barsHeld: i };
}

/** Reconstruct original stop if BE already pulled SL to entry. */
export function origStopPx(opts: {
  side: Side;
  entry: number;
  sl: number;
  origSl?: number | null;
  qty?: number | null;
  risk?: number | null;
}) {
  const orig = Number(opts.origSl);
  if (Number.isFinite(orig) && orig > 0 && Math.abs(opts.entry - orig) > 1e-12) return orig;
  if (Math.abs(opts.entry - opts.sl) > 1e-8) return opts.sl;
  const qty = Number(opts.qty);
  const risk = Number(opts.risk);
  const dist = qty > 0 && risk > 0 ? risk / qty : 0;
  if (!(dist > 0)) return opts.sl;
  return opts.side === "long" ? opts.entry - dist : opts.entry + dist;
}

/** Max adverse / favorable excursion in R, using the original stop distance. */
export function pathExcursion(opts: {
  side: Side;
  entry: number;
  origSl: number;
  bars: Bar[];
}): { maeR: number; mfeR: number } {
  const dist = Math.abs(opts.entry - opts.origSl);
  if (!(dist > 0) || !opts.bars.length) return { maeR: 0, mfeR: 0 };
  let mae = 0;
  let mfe = 0;
  for (const bar of opts.bars) {
    if (opts.side === "long") {
      mae = Math.max(mae, (opts.entry - bar.low) / dist);
      mfe = Math.max(mfe, (bar.high - opts.entry) / dist);
    } else {
      mae = Math.max(mae, (bar.high - opts.entry) / dist);
      mfe = Math.max(mfe, (opts.entry - bar.low) / dist);
    }
  }
  return { maeR: mae, mfeR: mfe };
}

export function pnlAt(side: Side, entry: number, exit: number, qty: number, openFee: number) {
  const gross = side === "long" ? (exit - entry) * qty : (entry - exit) * qty;
  const closeFee = (Math.abs(exit * qty) * FEE_BPS) / 10000;
  return gross - openFee - closeFee;
}

export function simulateTrades(
  signals: Signal[],
  bars: Bar[],
  opts: { equity: number; capitalPct: number; leverage: number; symbol: string; timeframe: string },
) {
  const trades: PaperExit[] = [];
  let equity = opts.equity;
  let open: (PaperFill & { sigIndex: number; origSl: number; beAtR?: number; beMoved: boolean }) | null = null;
  const byBar = new Map<number, Signal[]>();
  for (const s of signals) {
    const list = byBar.get(s.barIndex) ?? [];
    list.push(s);
    byBar.set(s.barIndex, list);
  }

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]!;
    if (open) {
      let hit = pathExit(open.side, open.sl, open.tp, bar);
      if (!hit && open.beAtR && !open.beMoved) {
        const dist = Math.abs(open.entry - open.origSl);
        const fav = open.side === "long" ? bar.high - open.entry : open.entry - bar.low;
        if (dist > 0 && fav >= open.beAtR * dist) {
          open.sl = open.entry;
          open.beMoved = true;
          hit = pathExit(open.side, open.sl, open.tp, bar);
        }
      }
      if (hit) {
        const atBe = open.beMoved && Math.abs(open.sl - open.entry) <= EPS * Math.max(1, open.entry);
        const reason: PaperExit["reason"] = hit === "tp" ? "tp" : atBe ? "be" : "sl";
        const exit = hit === "sl" ? open.sl : open.tp;
        const pnl = pnlAt(open.side, open.entry, exit, open.qty, open.fees);
        const slDist = Math.abs(open.entry - open.origSl);
        const pnlR = slDist > 0 ? ((open.side === "long" ? exit - open.entry : open.entry - exit) / slDist) : 0;
        equity += pnl;
        trades.push({
          ...open,
          exit,
          reason,
          pnl,
          pnlR,
          closedBarTime: bar.time,
        });
        open = null;
      }
    }
    if (!open) {
      const sigs = byBar.get(i);
      if (sigs && sigs[0]) {
        const s = sigs[0]!;
        const sized = sizePosition({
          equity,
          capitalPct: opts.capitalPct,
          entry: s.entry,
          sl: s.sl,
          leverage: opts.leverage,
        });
        if (sized) {
          open = {
            side: s.side,
            entry: s.entry,
            sl: s.sl,
            tp: s.tp,
            qty: sized.qty,
            leverage: sized.leverage,
            notional: sized.notional,
            risk: sized.risk,
            fees: sized.fees,
            indicator: s.indicator,
            timeframe: opts.timeframe,
            symbol: opts.symbol,
            openedBarTime: s.barTime,
            sigIndex: i,
            origSl: s.sl,
            beAtR: s.beAtR,
            beMoved: false,
          };
        }
      }
    }
  }

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossWin = wins.reduce((a, t) => a + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
  const netR = trades.reduce((a, t) => a + t.pnlR, 0);
  let peak = 0;
  let dd = 0;
  let run = 0;
  for (const t of trades) {
    run += t.pnlR;
    peak = Math.max(peak, run);
    dd = Math.min(dd, run - peak);
  }

  return {
    trades,
    equity,
    wins: wins.length,
    losses: losses.length,
    winRate: trades.length ? (100 * wins.length) / trades.length : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0,
    expectR: trades.length ? netR / trades.length : 0,
    netR,
    maxDdR: dd,
  };
}
