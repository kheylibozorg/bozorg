import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeBacktest, journalToAnalyzed, type AnalyzedTrade } from "./backtest-analyze.ts";
import type { JournalTrade } from "./journal.ts";
import type { Side } from "./types.ts";

function t(p: Partial<AnalyzedTrade> & { side: Side; pnlR: number; reason: AnalyzedTrade["reason"] }): AnalyzedTrade {
  return {
    i: 0,
    entry: 100,
    sl: 99,
    tp: 102,
    exit: 99,
    pnl: p.pnlR * 10,
    maeR: 1,
    mfeR: 0.2,
    capture: null,
    givebackR: 0,
    barsHeld: 3,
    holdMs: 3 * 3600_000,
    plannedRr: 2,
    entryWhy: p.side === "long" ? "FTC support" : "FTC resistance",
    opened: 1,
    closed: 2,
    scratch: p.pnlR > 0 && p.pnlR < 0.3,
    noProfit: p.pnlR <= 0,
    stoppedFromProfit: false,
    missedTp: false,
    ...p,
  };
}

describe("analyzeBacktest", () => {
  it("flags shorts as the side that ate the most stops", () => {
    const rows: AnalyzedTrade[] = [
      t({ side: "long", pnlR: 1.5, reason: "tp", mfeR: 1.6, capture: 0.94, i: 0 }),
      t({ side: "long", pnlR: 1.4, reason: "tp", mfeR: 1.5, capture: 0.93, i: 1 }),
      t({ side: "long", pnlR: 1.2, reason: "tp", mfeR: 1.3, capture: 0.92, i: 2 }),
      t({ side: "short", pnlR: -1, reason: "sl", mfeR: 0.1, maeR: 1.05, i: 3 }),
      t({ side: "short", pnlR: -1, reason: "sl", mfeR: 0.05, maeR: 1.1, i: 4 }),
      t({ side: "short", pnlR: -1, reason: "sl", mfeR: 0.2, maeR: 1.02, i: 5 }),
      t({ side: "short", pnlR: 0.1, reason: "be", mfeR: 0.4, scratch: true, noProfit: false, i: 6 }),
    ];
    const a = analyzeBacktest(rows, 9);
    assert.equal(a.n, 7);
    assert.equal(a.signals, 9);
    const shorts = a.bySide.find((s) => s.key === "short");
    const longs = a.bySide.find((s) => s.key === "long");
    assert.ok(shorts && longs);
    assert.ok(shorts.slPct > longs.slPct);
    assert.ok(a.findings.some((f) => f.kind === "side_sl_heavy" && f.side === "short"));
    assert.ok(a.findings.some((f) => f.kind === "side_strong" && f.side === "long"));
    assert.equal(a.worstStops[0]?.side, "short");
    assert.equal(a.bestWins[0]?.side, "long");
  });

  it("separates tiny profits from real winners and givebacks", () => {
    const rows: AnalyzedTrade[] = [
      t({ side: "long", pnlR: 0.12, reason: "be", scratch: true, noProfit: false, mfeR: 0.5, givebackR: 0.38, stoppedFromProfit: true, i: 0 }),
      t({ side: "long", pnlR: 0.08, reason: "be", scratch: true, noProfit: false, mfeR: 0.6, givebackR: 0.52, stoppedFromProfit: true, i: 1 }),
      t({ side: "long", pnlR: 2.2, reason: "tp", mfeR: 2.3, capture: 0.96, i: 2 }),
      t({ side: "short", pnlR: -1, reason: "sl", missedTp: true, mfeR: 1.9, plannedRr: 2, givebackR: 1.9, stoppedFromProfit: true, i: 3 }),
      t({ side: "short", pnlR: -1, reason: "sl", missedTp: true, mfeR: 1.8, plannedRr: 2, i: 4 }),
      t({ side: "short", pnlR: 0, reason: "be", noProfit: true, mfeR: 0.4, stoppedFromProfit: true, i: 5 }),
      t({ side: "long", pnlR: 0.2, reason: "be", scratch: true, noProfit: false, i: 6 }),
      t({ side: "long", pnlR: 1.8, reason: "tp", mfeR: 1.9, capture: 0.95, i: 7 }),
    ];
    const a = analyzeBacktest(rows);
    assert.ok(a.scratchN >= 3);
    assert.ok(a.missedTpN >= 2);
    assert.ok(a.givebacks.length >= 3);
    assert.ok(a.findings.some((f) => f.kind === "scratch_heavy" || f.kind === "giveback_heavy"));
    assert.ok(a.findings.some((f) => f.kind === "missed_tp"));
    assert.equal(a.hist.find((h) => h.key === "0-0.3")?.n, 4);
  });

  it("ranks indicator · timeframe · side batches for engine work", () => {
    const rows: AnalyzedTrade[] = [
      t({ side: "short", pnlR: -1, reason: "sl", indicator: "APEX1", timeframe: "15m", i: 0 }),
      t({ side: "short", pnlR: -1, reason: "sl", indicator: "APEX1", timeframe: "15m", i: 1 }),
      t({ side: "short", pnlR: -1, reason: "sl", indicator: "APEX1", timeframe: "15m", i: 2 }),
      t({ side: "long", pnlR: 1.5, reason: "tp", indicator: "TREX1", timeframe: "1h", i: 3 }),
      t({ side: "long", pnlR: 1.2, reason: "tp", indicator: "TREX1", timeframe: "1h", i: 4 }),
      t({ side: "long", pnlR: 0.1, reason: "be", indicator: "TREX1", timeframe: "1h", scratch: true, noProfit: false, i: 5 }),
      t({ side: "long", pnlR: 0.05, reason: "be", indicator: "KETEX", timeframe: "5m", scratch: true, noProfit: false, i: 6 }),
      t({ side: "long", pnlR: -0.2, reason: "be", indicator: "KETEX", timeframe: "5m", i: 7 }),
    ];
    const a = analyzeBacktest(rows);
    assert.ok(a.byCombo.some((s) => s.key === "APEX1 · 15m · short" && s.slPct === 100));
    assert.ok(a.findings.some((f) => f.kind === "combo_sl_heavy" && f.extra === "APEX1 · 15m · short"));
    assert.ok(a.findings.some((f) => f.kind === "combo_strong" && f.extra === "TREX1 · 1h · long"));
    assert.ok(a.findings.some((f) => f.kind === "combo_dead"));
    const ketex = a.byCombo.find((s) => s.key.includes("KETEX"));
    assert.ok(ketex && ketex.deadPct >= 50);
  });

  it("empty window yields a single no_trades finding", () => {
    const a = analyzeBacktest([]);
    assert.equal(a.n, 0);
    assert.deepEqual(
      a.findings.map((f) => f.kind),
      ["no_trades"],
    );
  });
});

describe("journalToAnalyzed", () => {
  it("maps closed paper fills into the analyzer", () => {
    const row = {
      id: 1,
      mode: "paper",
      venue: "paper",
      symbol: "BTCUSDT",
      timeframe: "15m",
      indicator: "APEX1",
      side: "long",
      entry: 100,
      sl: 99,
      tp: 102,
      qty: 1,
      leverage: 10,
      notional_usd: 1000,
      risk_usd: 10,
      opened_at: "2026-01-01T00:00:00.000Z",
      closed_at: "2026-01-01T03:00:00.000Z",
      exit_px: 102,
      exit_reason: "tp",
      pnl_usd: 18,
      pnl_r: 2,
      fees_usd: 1,
      status: "closed",
      exchange_order_id: null,
      orig_sl: 99,
      mae_r: 0.2,
      mfe_r: 2.1,
      bars_held: 12,
      signal_reason: "APEX 1R FTC long",
      rr_planned: 2,
    } as JournalTrade;
    const [one] = journalToAnalyzed([row, { ...row, id: 2, status: "open" }]);
    assert.equal(one?.reason, "tp");
    assert.equal(one?.indicator, "APEX1");
    assert.equal(one?.missedTp, false);
    assert.ok((one?.capture ?? 0) > 0.9);
    const a = analyzeBacktest(journalToAnalyzed([row]));
    assert.equal(a.n, 1);
    assert.equal(a.byCombo[0]?.key, "APEX1 · 15m · long");
  });
});
