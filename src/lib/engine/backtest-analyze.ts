import type { JournalTrade } from "./journal.ts";
import { pathExcursion, type PaperExit } from "./paper.ts";
import type { Bar, Side, Signal } from "./types.ts";

export type AnalyzedTrade = {
  i: number;
  side: Side;
  entry: number;
  sl: number;
  tp: number;
  exit: number;
  reason: "sl" | "tp" | "be";
  pnlR: number;
  pnl: number;
  maeR: number;
  mfeR: number;
  capture: number | null;
  givebackR: number;
  barsHeld: number;
  holdMs: number;
  plannedRr: number;
  entryWhy: string;
  opened: number;
  closed: number;
  scratch: boolean;
  noProfit: boolean;
  stoppedFromProfit: boolean;
  missedTp: boolean;
  indicator?: string;
  timeframe?: string;
  symbol?: string;
  mode?: string;
};

export type SliceStats = {
  key: string;
  n: number;
  wins: number;
  losses: number;
  sl: number;
  tp: number;
  be: number;
  wr: number;
  netR: number;
  expectR: number;
  avgWinR: number;
  avgLossR: number;
  avgMae: number;
  avgMfe: number;
  avgCapture: number;
  avgHoldBars: number;
  slPct: number;
  maxWinR: number;
  maxLossR: number;
  scratchN: number;
  deadN: number;
  deadPct: number;
};

export type HistBar = { key: string; lo: number; hi: number; n: number };

export type Finding = {
  severity: "bad" | "warn" | "good" | "info";
  kind:
    | "no_trades"
    | "few_trades"
    | "combo_sl_heavy"
    | "combo_strong"
    | "combo_weak"
    | "combo_dead"
    | "side_sl_heavy"
    | "side_strong"
    | "side_weak"
    | "sl_rate_high"
    | "scratch_heavy"
    | "giveback_heavy"
    | "missed_tp"
    | "capture_low"
    | "expect_neg"
    | "expect_pos"
    | "worst_stop"
    | "best_trade"
    | "tiny_profit";
  side?: Side;
  n?: number;
  pct?: number;
  r?: number;
  extra?: string;
};

export type BacktestAnalysis = {
  n: number;
  signals: number;
  slN: number;
  tpN: number;
  beN: number;
  slPct: number;
  tpPct: number;
  wr: number;
  netR: number;
  expectR: number;
  avgWinR: number;
  avgLossR: number;
  avgMae: number;
  avgMfe: number;
  avgCapture: number;
  avgHoldBars: number;
  scratchN: number;
  noProfitN: number;
  stoppedFromProfitN: number;
  missedTpN: number;
  bySide: SliceStats[];
  byReason: SliceStats[];
  byEntry: SliceStats[];
  byIndicator: SliceStats[];
  byTf: SliceStats[];
  byCombo: SliceStats[];
  byMode: SliceStats[];
  hist: HistBar[];
  worstStops: AnalyzedTrade[];
  bestWins: AnalyzedTrade[];
  scratches: AnalyzedTrade[];
  givebacks: AnalyzedTrade[];
  findings: Finding[];
  all: AnalyzedTrade[];
};

export const R_HIST: Array<{ key: string; lo: number; hi: number }> = [
  { key: "lt-2", lo: Number.NEGATIVE_INFINITY, hi: -2 },
  { key: "-2--1", lo: -2, hi: -1 },
  { key: "-1-0", lo: -1, hi: 0 },
  { key: "0-0.3", lo: 0, hi: 0.3 },
  { key: "0.3-1", lo: 0.3, hi: 1 },
  { key: "1-2", lo: 1, hi: 2 },
  { key: "gt2", lo: 2, hi: Number.POSITIVE_INFINITY },
];

const SCRATCH_R = 0.3;
const PROFIT_MFE = 0.35;

function num(v: unknown, d = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : d;
}

function avg(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function origSlOf(t: PaperExit) {
  const extra = t as PaperExit & { origSl?: number };
  const orig = Number(extra.origSl);
  if (Number.isFinite(orig) && orig > 0) return orig;
  return t.sl;
}

function sliceOf(key: string, rows: AnalyzedTrade[]): SliceStats {
  const n = rows.length;
  const wins = rows.filter((t) => t.pnlR > 0);
  const losses = rows.filter((t) => t.pnlR <= 0);
  const sl = rows.filter((t) => t.reason === "sl").length;
  const tp = rows.filter((t) => t.reason === "tp").length;
  const be = rows.filter((t) => t.reason === "be").length;
  const netR = rows.reduce((a, t) => a + t.pnlR, 0);
  const caps = rows.map((t) => t.capture).filter((v): v is number => v != null);
  const scratchN = rows.filter((t) => t.scratch).length;
  const deadN = rows.filter((t) => t.pnlR < SCRATCH_R).length;
  return {
    key,
    n,
    wins: wins.length,
    losses: losses.length,
    sl,
    tp,
    be,
    wr: n ? (100 * wins.length) / n : 0,
    netR,
    expectR: n ? netR / n : 0,
    avgWinR: avg(wins.map((t) => t.pnlR)),
    avgLossR: avg(losses.map((t) => t.pnlR)),
    avgMae: avg(rows.map((t) => t.maeR)),
    avgMfe: avg(rows.map((t) => t.mfeR)),
    avgCapture: avg(caps),
    avgHoldBars: avg(rows.map((t) => t.barsHeld)),
    slPct: n ? (100 * sl) / n : 0,
    maxWinR: wins.reduce((a, t) => Math.max(a, t.pnlR), 0),
    maxLossR: losses.reduce((a, t) => Math.min(a, t.pnlR), 0),
    scratchN,
    deadN,
    deadPct: n ? (100 * deadN) / n : 0,
  };
}

function grouped(trades: AnalyzedTrade[], keyOf: (t: AnalyzedTrade) => string | null) {
  const map = new Map<string, AnalyzedTrade[]>();
  for (const t of trades) {
    const key = keyOf(t);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(t);
    map.set(key, list);
  }
  return [...map.entries()]
    .map(([k, rows]) => sliceOf(k, rows))
    .sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
}

function comboKey(t: AnalyzedTrade) {
  if (!t.indicator || !t.timeframe) return null;
  return `${t.indicator} · ${t.timeframe} · ${t.side}`;
}

function exitReason(raw: string | null | undefined, pnlR: number): AnalyzedTrade["reason"] {
  if (raw === "tp" || raw === "be" || raw === "sl") return raw;
  if (pnlR > 0.3) return "tp";
  if (Math.abs(pnlR) < 0.05) return "be";
  return "sl";
}

export function journalToAnalyzed(rows: JournalTrade[]): AnalyzedTrade[] {
  return rows
    .filter((r) => r.status === "closed")
    .map((r, i) => {
      const side: Side = r.side === "short" ? "short" : "long";
      const pnlR = num(r.pnl_r);
      const pnl = num(r.pnl_usd);
      const entry = num(r.entry);
      const orig = num(r.orig_sl) || num(r.sl);
      const tp = num(r.tp);
      const exit = num(r.exit_px, entry);
      const maeR = num(r.mae_r);
      const mfeR = num(r.mfe_r);
      const reason = exitReason(r.exit_reason, pnlR);
      const dist = Math.abs(entry - orig);
      const plannedRr = num(r.rr_planned) || (dist > 0 ? Math.abs(tp - entry) / dist : 0);
      const capture = mfeR > 0.05 ? Math.max(0, pnlR) / mfeR : null;
      const opened = Date.parse(r.opened_at) || num(r.bar_time);
      const closed = r.closed_at ? Date.parse(r.closed_at) : opened;
      return {
        i,
        side,
        entry,
        sl: orig,
        tp,
        exit,
        reason,
        pnlR,
        pnl,
        maeR,
        mfeR,
        capture,
        givebackR: Math.max(0, mfeR - Math.max(pnlR, 0)),
        barsHeld: Math.max(1, num(r.bars_held, 1)),
        holdMs: num(r.hold_ms) || Math.max(0, closed - opened),
        plannedRr,
        entryWhy: r.signal_reason || r.indicator || "—",
        opened,
        closed,
        scratch: pnlR > 0 && pnlR < SCRATCH_R,
        noProfit: pnlR <= 0,
        stoppedFromProfit: reason !== "tp" && mfeR >= PROFIT_MFE && pnlR < PROFIT_MFE,
        missedTp: reason === "sl" && plannedRr > 0 && mfeR >= plannedRr * 0.85,
        indicator: r.indicator,
        timeframe: r.timeframe,
        symbol: r.symbol,
        mode: r.mode,
      };
    });
}

export function enrichTrades(trades: PaperExit[], bars: Bar[], signals: Signal[]): AnalyzedTrade[] {
  const idx = new Map<number, number>();
  for (let i = 0; i < bars.length; i++) idx.set(bars[i]!.time, i);
  const whyOf = (t: PaperExit) => {
    const hit = signals.find((s) => s.barTime === t.openedBarTime && s.side === t.side);
    return hit?.reason ?? t.indicator;
  };
  return trades.map((t, i) => {
    const oi = idx.get(t.openedBarTime) ?? 0;
    const ci = idx.get(t.closedBarTime) ?? oi;
    const origSl = origSlOf(t);
    const path = bars.slice(oi + 1, ci + 1);
    const { maeR, mfeR } = pathExcursion({ side: t.side, entry: t.entry, origSl, bars: path });
    const dist = Math.abs(t.entry - origSl);
    const plannedRr = dist > 0 ? Math.abs(t.tp - t.entry) / dist : 0;
    const capture = mfeR > 0.05 ? Math.max(0, t.pnlR) / mfeR : null;
    const givebackR = Math.max(0, mfeR - Math.max(t.pnlR, 0));
    const scratch = t.pnlR > 0 && t.pnlR < SCRATCH_R;
    const noProfit = t.pnlR <= 0;
    const stoppedFromProfit = t.reason !== "tp" && mfeR >= PROFIT_MFE && t.pnlR < PROFIT_MFE;
    const missedTp = t.reason === "sl" && plannedRr > 0 && mfeR >= plannedRr * 0.85;
    return {
      i,
      side: t.side,
      entry: t.entry,
      sl: origSl,
      tp: t.tp,
      exit: t.exit,
      reason: t.reason,
      pnlR: t.pnlR,
      pnl: t.pnl,
      maeR,
      mfeR,
      capture,
      givebackR,
      barsHeld: Math.max(1, ci - oi),
      holdMs: Math.max(0, t.closedBarTime - t.openedBarTime),
      plannedRr,
      entryWhy: whyOf(t),
      opened: t.openedBarTime,
      closed: t.closedBarTime,
      scratch,
      noProfit,
      stoppedFromProfit,
      missedTp,
      indicator: t.indicator,
      timeframe: t.timeframe,
      symbol: t.symbol,
    };
  });
}

export function analyzeBacktest(trades: AnalyzedTrade[], signalCount = 0): BacktestAnalysis {
  const n = trades.length;
  const wins = trades.filter((t) => t.pnlR > 0);
  const losses = trades.filter((t) => t.pnlR <= 0);
  const slN = trades.filter((t) => t.reason === "sl").length;
  const tpN = trades.filter((t) => t.reason === "tp").length;
  const beN = trades.filter((t) => t.reason === "be").length;
  const netR = trades.reduce((a, t) => a + t.pnlR, 0);
  const caps = trades.map((t) => t.capture).filter((v): v is number => v != null);
  const scratchN = trades.filter((t) => t.scratch).length;
  const noProfitN = trades.filter((t) => t.noProfit).length;
  const stoppedFromProfitN = trades.filter((t) => t.stoppedFromProfit).length;
  const missedTpN = trades.filter((t) => t.missedTp).length;

  const long = trades.filter((t) => t.side === "long");
  const short = trades.filter((t) => t.side === "short");
  const bySide = [
    long.length ? sliceOf("long", long) : null,
    short.length ? sliceOf("short", short) : null,
  ].filter((x): x is SliceStats => Boolean(x));

  const byReason = (["sl", "tp", "be"] as const)
    .map((k) => sliceOf(k, trades.filter((t) => t.reason === k)))
    .filter((s) => s.n > 0);

  const hist: HistBar[] = R_HIST.map((h) => ({ ...h, n: 0 }));
  for (const t of trades) {
    const bar = hist.find((h) => t.pnlR >= h.lo && t.pnlR < h.hi) ?? hist[hist.length - 1];
    if (bar) bar.n += 1;
  }

  const analysis: BacktestAnalysis = {
    n,
    signals: signalCount,
    slN,
    tpN,
    beN,
    slPct: n ? (100 * slN) / n : 0,
    tpPct: n ? (100 * tpN) / n : 0,
    wr: n ? (100 * wins.length) / n : 0,
    netR,
    expectR: n ? netR / n : 0,
    avgWinR: avg(wins.map((t) => t.pnlR)),
    avgLossR: avg(losses.map((t) => t.pnlR)),
    avgMae: avg(trades.map((t) => t.maeR)),
    avgMfe: avg(trades.map((t) => t.mfeR)),
    avgCapture: avg(caps),
    avgHoldBars: avg(trades.map((t) => t.barsHeld)),
    scratchN,
    noProfitN,
    stoppedFromProfitN,
    missedTpN,
    bySide,
    byReason,
    byEntry: grouped(trades, (t) => t.entryWhy || "—"),
    byIndicator: grouped(trades, (t) => t.indicator || null),
    byTf: grouped(trades, (t) => t.timeframe || null),
    byCombo: grouped(trades, comboKey),
    byMode: grouped(trades, (t) => t.mode || null),
    hist,
    worstStops: trades
      .filter((t) => t.reason === "sl")
      .slice()
      .sort((a, b) => a.pnlR - b.pnlR)
      .slice(0, 8),
    bestWins: trades
      .filter((t) => t.pnlR > 0)
      .slice()
      .sort((a, b) => b.pnlR - a.pnlR)
      .slice(0, 8),
    scratches: trades
      .filter((t) => t.scratch || (t.pnlR >= 0 && t.pnlR < SCRATCH_R))
      .slice()
      .sort((a, b) => a.pnlR - b.pnlR)
      .slice(0, 8),
    givebacks: trades
      .filter((t) => t.stoppedFromProfit)
      .slice()
      .sort((a, b) => b.givebackR - a.givebackR)
      .slice(0, 8),
    findings: [],
    all: trades,
  };
  analysis.findings = buildFindings(analysis);
  return analysis;
}

function buildFindings(a: BacktestAnalysis): Finding[] {
  const out: Finding[] = [];
  if (!a.n) {
    out.push({ severity: "info", kind: "no_trades" });
    return out;
  }
  if (a.n < 8) out.push({ severity: "warn", kind: "few_trades", n: a.n });

  const combos = a.byCombo.filter((s) => s.n >= 2);
  const slCombo = [...combos].sort((x, y) => y.slPct - x.slPct || y.n - x.n)[0];
  if (slCombo && slCombo.slPct >= 50) {
    out.push({
      severity: slCombo.slPct >= 70 ? "bad" : "warn",
      kind: "combo_sl_heavy",
      extra: slCombo.key,
      n: slCombo.sl,
      pct: slCombo.slPct,
      r: slCombo.netR,
    });
  }
  const bestCombo = [...combos].sort((x, y) => y.netR - x.netR)[0];
  if (bestCombo && bestCombo.netR > 0) {
    out.push({
      severity: "good",
      kind: "combo_strong",
      extra: bestCombo.key,
      n: bestCombo.n,
      r: bestCombo.netR,
      pct: bestCombo.wr,
    });
  }
  const weakCombo = [...combos].sort((x, y) => x.netR - y.netR)[0];
  if (weakCombo && weakCombo.netR < 0 && weakCombo.key !== bestCombo?.key) {
    out.push({
      severity: "bad",
      kind: "combo_weak",
      extra: weakCombo.key,
      n: weakCombo.n,
      r: weakCombo.netR,
      pct: weakCombo.wr,
    });
  }
  const deadCombo = [...combos].sort((x, y) => y.deadPct - x.deadPct || y.deadN - x.deadN)[0];
  if (deadCombo && deadCombo.deadPct >= 50) {
    out.push({
      severity: "warn",
      kind: "combo_dead",
      extra: deadCombo.key,
      n: deadCombo.deadN,
      pct: deadCombo.deadPct,
    });
  }

  const slHeavy = [...a.bySide].sort((x, y) => y.slPct - x.slPct)[0];
  if (slHeavy && slHeavy.n >= 3 && slHeavy.slPct >= 55) {
    out.push({
      severity: slHeavy.slPct >= 70 ? "bad" : "warn",
      kind: "side_sl_heavy",
      side: slHeavy.key as Side,
      n: slHeavy.sl,
      pct: slHeavy.slPct,
    });
  }

  const bestSide = [...a.bySide].sort((x, y) => y.netR - x.netR)[0];
  if (bestSide && bestSide.n >= 3 && bestSide.netR > 0) {
    out.push({
      severity: "good",
      kind: "side_strong",
      side: bestSide.key as Side,
      n: bestSide.n,
      r: bestSide.netR,
      pct: bestSide.wr,
    });
  }

  const weakSide = [...a.bySide].sort((x, y) => x.netR - y.netR)[0];
  if (weakSide && weakSide.n >= 3 && weakSide.netR < 0) {
    out.push({
      severity: "bad",
      kind: "side_weak",
      side: weakSide.key as Side,
      n: weakSide.n,
      r: weakSide.netR,
      pct: weakSide.wr,
    });
  }

  if (a.slPct >= 60) out.push({ severity: "bad", kind: "sl_rate_high", pct: a.slPct, n: a.slN });

  if (a.n && a.scratchN / a.n >= 0.15) {
    out.push({
      severity: "warn",
      kind: "scratch_heavy",
      n: a.scratchN,
      pct: (100 * a.scratchN) / a.n,
    });
  }

  if (a.n && a.noProfitN / a.n >= 0.55) {
    out.push({
      severity: "bad",
      kind: "tiny_profit",
      n: a.noProfitN,
      pct: (100 * a.noProfitN) / a.n,
    });
  }

  if (a.n && a.stoppedFromProfitN / a.n >= 0.2) {
    out.push({
      severity: "warn",
      kind: "giveback_heavy",
      n: a.stoppedFromProfitN,
      pct: (100 * a.stoppedFromProfitN) / a.n,
    });
  }

  if (a.missedTpN >= 2) out.push({ severity: "warn", kind: "missed_tp", n: a.missedTpN });

  if (a.avgCapture > 0 && a.avgCapture < 0.45) {
    out.push({ severity: "warn", kind: "capture_low", pct: 100 * a.avgCapture });
  }

  if (a.expectR < 0) out.push({ severity: "bad", kind: "expect_neg", r: a.expectR });
  else if (a.expectR >= 0.12) out.push({ severity: "good", kind: "expect_pos", r: a.expectR });

  const worst = a.worstStops[0];
  if (worst) {
    out.push({
      severity: "info",
      kind: "worst_stop",
      side: worst.side,
      r: worst.pnlR,
      extra: [worst.indicator, worst.timeframe, String(worst.entry)].filter(Boolean).join(" · "),
    });
  }
  const best = a.bestWins[0];
  if (best) {
    out.push({
      severity: "info",
      kind: "best_trade",
      side: best.side,
      r: best.pnlR,
      extra: [best.indicator, best.timeframe, String(best.entry)].filter(Boolean).join(" · "),
    });
  }
  return out;
}
