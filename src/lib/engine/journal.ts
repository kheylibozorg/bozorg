export type JournalTrade = {
  id: number;
  mode: string;
  venue: string;
  symbol: string;
  timeframe: string;
  indicator: string;
  side: string;
  entry: number;
  sl: number;
  tp: number;
  qty: number;
  leverage: number;
  notional_usd: number;
  risk_usd: number;
  opened_at: string;
  closed_at: string | null;
  exit_px: number | null;
  exit_reason: string | null;
  pnl_usd: number | null;
  pnl_r: number | null;
  fees_usd: number;
  status: string;
  exchange_order_id: string | null;
  bar_time?: number | null;
  orig_sl?: number | null;
  mae_r?: number | null;
  mfe_r?: number | null;
  bars_held?: number | null;
  hold_ms?: number | null;
  signal_reason?: string | null;
  atr_at_entry?: number | null;
  be_moved?: number | null;
  equity_at_open?: number | null;
  rr_planned?: number | null;
  margin_usd?: number | null;
  notes?: string | null;
};

export type JournalBucket = {
  key: string;
  n: number;
  wins: number;
  r: number;
  usd: number;
  wr: number;
};

export type JournalHistBar = { key: string; lo: number; hi: number; n: number };

export type JournalPoint = { t: number; r: number; usd: number };

export type JournalStats = {
  n: number;
  wins: number;
  losses: number;
  be: number;
  wr: number;
  netR: number;
  netUsd: number;
  avgWinR: number;
  avgLossR: number;
  avgWinUsd: number;
  avgLossUsd: number;
  profitFactor: number;
  expectR: number;
  maxWinR: number;
  maxLossR: number;
  maxDdR: number;
  avgHoldMs: number;
  avgMae: number;
  avgMfe: number;
  avgFees: number;
  streak: number;
  maxWinStreak: number;
  maxLoseStreak: number;
  byIndicator: JournalBucket[];
  byTf: JournalBucket[];
  bySide: JournalBucket[];
  byReason: JournalBucket[];
  hist: JournalHistBar[];
  curve: JournalPoint[];
};

export const HIST: Array<{ key: string; lo: number; hi: number }> = [
  { key: "lt-2", lo: Number.NEGATIVE_INFINITY, hi: -2 },
  { key: "-2--1", lo: -2, hi: -1 },
  { key: "-1-0", lo: -1, hi: 0 },
  { key: "0-1", lo: 0, hi: 1 },
  { key: "1-2", lo: 1, hi: 2 },
  { key: "gt2", lo: 2, hi: Number.POSITIVE_INFINITY },
];

function num(v: unknown, d = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : d;
}

function isWin(row: JournalTrade) {
  const usd = num(row.pnl_usd, NaN);
  if (Number.isFinite(usd)) return usd > 0;
  return num(row.pnl_r) > 0;
}

function pushBucket(map: Map<string, JournalBucket>, key: string, row: JournalTrade) {
  const cur = map.get(key) ?? { key, n: 0, wins: 0, r: 0, usd: 0, wr: 0 };
  cur.n += 1;
  if (isWin(row)) cur.wins += 1;
  cur.r += num(row.pnl_r);
  cur.usd += num(row.pnl_usd);
  cur.wr = cur.n ? (100 * cur.wins) / cur.n : 0;
  map.set(key, cur);
}

function sortedBuckets(map: Map<string, JournalBucket>) {
  return [...map.values()].sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
}

export function analyzeJournal(rows: JournalTrade[], startEquity = 0): JournalStats {
  const closed = rows.filter((r) => r.status === "closed");
  const n = closed.length;
  const winsRows = closed.filter(isWin);
  const lossRows = closed.filter((r) => !isWin(r));
  const be = closed.filter((r) => (r.exit_reason ?? "") === "be").length;
  const netR = closed.reduce((a, r) => a + num(r.pnl_r), 0);
  const netUsd = closed.reduce((a, r) => a + num(r.pnl_usd), 0);
  const winR = winsRows.reduce((a, r) => a + num(r.pnl_r), 0);
  const lossR = lossRows.reduce((a, r) => a + num(r.pnl_r), 0);
  const winUsd = winsRows.reduce((a, r) => a + num(r.pnl_usd), 0);
  const lossUsd = lossRows.reduce((a, r) => a + num(r.pnl_usd), 0);
  const grossWin = winsRows.reduce((a, r) => a + Math.max(0, num(r.pnl_usd)), 0);
  const grossLoss = Math.abs(lossRows.reduce((a, r) => a + Math.min(0, num(r.pnl_usd)), 0));
  const hold = closed.map((r) => num(r.hold_ms, NaN)).filter((v) => Number.isFinite(v) && v >= 0);
  const mae = closed.map((r) => num(r.mae_r, NaN)).filter((v) => Number.isFinite(v));
  const mfe = closed.map((r) => num(r.mfe_r, NaN)).filter((v) => Number.isFinite(v));
  const fees = closed.reduce((a, r) => a + num(r.fees_usd), 0);

  const chrono = [...closed].sort((a, b) => {
    const ta = new Date(a.closed_at ?? a.opened_at).getTime();
    const tb = new Date(b.closed_at ?? b.opened_at).getTime();
    return ta - tb;
  });
  let cur = 0;
  let maxW = 0;
  let maxL = 0;
  let runR = 0;
  let peakR = 0;
  let maxDdR = 0;
  let runUsd = startEquity;
  const curve: JournalPoint[] = startEquity
    ? [{ t: chrono[0] ? new Date(chrono[0].opened_at).getTime() : Date.now(), r: 0, usd: startEquity }]
    : [];
  for (const row of chrono) {
    const w = isWin(row);
    if (w) {
      cur = cur > 0 ? cur + 1 : 1;
      maxW = Math.max(maxW, cur);
    } else {
      cur = cur < 0 ? cur - 1 : -1;
      maxL = Math.max(maxL, -cur);
    }
    runR += num(row.pnl_r);
    peakR = Math.max(peakR, runR);
    maxDdR = Math.min(maxDdR, runR - peakR);
    runUsd += num(row.pnl_usd);
    curve.push({
      t: new Date(row.closed_at ?? row.opened_at).getTime(),
      r: runR,
      usd: runUsd,
    });
  }
  let streak = 0;
  if (chrono.length) {
    const lastWin = isWin(chrono[chrono.length - 1]!);
    for (let i = chrono.length - 1; i >= 0; i--) {
      if (isWin(chrono[i]!) !== lastWin) break;
      streak += lastWin ? 1 : -1;
    }
  }

  const byIndicator = new Map<string, JournalBucket>();
  const byTf = new Map<string, JournalBucket>();
  const bySide = new Map<string, JournalBucket>();
  const byReason = new Map<string, JournalBucket>();
  for (const row of closed) {
    pushBucket(byIndicator, row.indicator || "—", row);
    pushBucket(byTf, row.timeframe || "—", row);
    pushBucket(bySide, row.side || "—", row);
    pushBucket(byReason, row.exit_reason || "—", row);
  }

  const hist = HIST.map((h) => ({ ...h, n: 0 }));
  for (const row of closed) {
    const r = num(row.pnl_r);
    const bar = hist.find((h) => r >= h.lo && r < h.hi) ?? hist[hist.length - 1];
    if (bar) bar.n += 1;
  }

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

  return {
    n,
    wins: winsRows.length,
    losses: lossRows.length,
    be,
    wr: n ? (100 * winsRows.length) / n : 0,
    netR,
    netUsd,
    avgWinR: winsRows.length ? winR / winsRows.length : 0,
    avgLossR: lossRows.length ? lossR / lossRows.length : 0,
    avgWinUsd: winsRows.length ? winUsd / winsRows.length : 0,
    avgLossUsd: lossRows.length ? lossUsd / lossRows.length : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0,
    expectR: n ? netR / n : 0,
    maxWinR: winsRows.reduce((a, r) => Math.max(a, num(r.pnl_r)), 0),
    maxLossR: lossRows.reduce((a, r) => Math.min(a, num(r.pnl_r)), 0),
    maxDdR,
    avgHoldMs: avg(hold),
    avgMae: avg(mae),
    avgMfe: avg(mfe),
    avgFees: n ? fees / n : 0,
    streak,
    maxWinStreak: maxW,
    maxLoseStreak: maxL,
    byIndicator: sortedBuckets(byIndicator),
    byTf: sortedBuckets(byTf),
    bySide: sortedBuckets(bySide),
    byReason: sortedBuckets(byReason),
    hist,
    curve,
  };
}

export function filterJournal(
  rows: JournalTrade[],
  q: {
    symbol?: string;
    indicator?: string;
    timeframe?: string;
    side?: string;
    reason?: string;
    mode?: string;
  },
) {
  const sym = (q.symbol ?? "").trim().toUpperCase();
  return rows.filter((r) => {
    if (sym && !r.symbol.toUpperCase().includes(sym) && !r.symbol.replace("USDT", "").toUpperCase().includes(sym)) {
      return false;
    }
    if (q.indicator && q.indicator !== "all" && r.indicator !== q.indicator) return false;
    if (q.timeframe && q.timeframe !== "all" && r.timeframe !== q.timeframe) return false;
    if (q.side && q.side !== "all" && r.side !== q.side) return false;
    if (q.reason && q.reason !== "all" && (r.exit_reason ?? "") !== q.reason) return false;
    if (q.mode && q.mode !== "all" && r.mode !== q.mode) return false;
    return true;
  });
}

export function journalOptions(rows: JournalTrade[]) {
  const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort();
  return {
    indicators: uniq(rows.map((r) => r.indicator)),
    timeframes: uniq(rows.map((r) => r.timeframe)),
    reasons: uniq(rows.map((r) => r.exit_reason ?? "")),
    modes: uniq(rows.map((r) => r.mode)),
  };
}

export function tradesToCsv(rows: JournalTrade[]) {
  const cols = [
    "id",
    "status",
    "mode",
    "venue",
    "symbol",
    "timeframe",
    "indicator",
    "side",
    "entry",
    "orig_sl",
    "sl",
    "tp",
    "exit_px",
    "exit_reason",
    "qty",
    "leverage",
    "notional_usd",
    "margin_usd",
    "risk_usd",
    "pnl_usd",
    "pnl_r",
    "fees_usd",
    "mae_r",
    "mfe_r",
    "rr_planned",
    "bars_held",
    "hold_ms",
    "be_moved",
    "atr_at_entry",
    "equity_at_open",
    "signal_reason",
    "notes",
    "exchange_order_id",
    "bar_time",
    "opened_at",
    "closed_at",
  ] as const;
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(",")];
  for (const r of rows) {
    lines.push(cols.map((c) => esc(r[c])).join(","));
  }
  return `\uFEFF${lines.join("\n")}`;
}
