import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeJournal, filterJournal, tradesToCsv, type JournalTrade } from "./journal.ts";

function trade(p: Partial<JournalTrade> & { id: number }): JournalTrade {
  return {
    mode: "paper",
    venue: "paper",
    symbol: "BTCUSDT",
    timeframe: "15m",
    indicator: "APEX1",
    side: "long",
    entry: 100,
    sl: 90,
    tp: 110,
    qty: 1,
    leverage: 10,
    notional_usd: 1000,
    risk_usd: 10,
    opened_at: "2026-01-01T00:00:00.000Z",
    closed_at: "2026-01-01T01:00:00.000Z",
    exit_px: 110,
    exit_reason: "tp",
    pnl_usd: 9,
    pnl_r: 1,
    fees_usd: 1,
    status: "closed",
    exchange_order_id: null,
    hold_ms: 3_600_000,
    mae_r: 0.2,
    mfe_r: 1.1,
    ...p,
  };
}

describe("analyzeJournal", () => {
  it("computes WR, PF, expectancy, streaks and drawdown from closed fills", () => {
    const rows = [
      trade({ id: 1, pnl_usd: 10, pnl_r: 1, exit_reason: "tp", closed_at: "2026-01-01T01:00:00.000Z" }),
      trade({ id: 2, pnl_usd: 20, pnl_r: 2, exit_reason: "tp", closed_at: "2026-01-01T02:00:00.000Z" }),
      trade({
        id: 3,
        pnl_usd: -10,
        pnl_r: -1,
        exit_reason: "sl",
        closed_at: "2026-01-01T03:00:00.000Z",
        indicator: "APEX2",
      }),
    ];
    const s = analyzeJournal(rows, 10000);
    assert.equal(s.n, 3);
    assert.equal(s.wins, 2);
    assert.equal(s.losses, 1);
    assert.ok(Math.abs(s.wr - 66.666) < 0.02);
    assert.equal(s.netR, 2);
    assert.equal(s.netUsd, 20);
    assert.equal(s.profitFactor, 3);
    assert.ok(Math.abs(s.expectR - 2 / 3) < 1e-9);
    assert.equal(s.maxWinStreak, 2);
    assert.equal(s.maxLoseStreak, 1);
    assert.equal(s.streak, -1);
    assert.equal(s.maxDdR, -1);
    assert.equal(s.curve.at(-1)?.usd, 10020);
    assert.equal(s.byIndicator[0]?.key, "APEX1");
    assert.equal(s.byReason.find((b) => b.key === "tp")?.n, 2);
  });

  it("filterJournal slices by indicator, symbol and mode", () => {
    const rows = [
      trade({ id: 1, symbol: "ETHUSDT", indicator: "HALC", mode: "paper" }),
      trade({ id: 2, symbol: "BTCUSDT", indicator: "APEX1", mode: "live" }),
    ];
    const eth = filterJournal(rows, { symbol: "eth" });
    assert.equal(eth.length, 1);
    assert.equal(eth[0]?.id, 1);
    const apex = filterJournal(rows, { indicator: "APEX1" });
    assert.equal(apex.length, 1);
    assert.equal(apex[0]?.id, 2);
    const live = filterJournal(rows, { mode: "live" });
    assert.equal(live.length, 1);
    assert.equal(live[0]?.id, 2);
  });

  it("tradesToCsv includes blotter columns and a BOM", () => {
    const csv = tradesToCsv([trade({ id: 9, signal_reason: "FTC tag, second test", notes: "held through wick" })]);
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes("signal_reason"));
    assert.ok(csv.includes("FTC tag, second test"));
    assert.ok(csv.includes("notes"));
    assert.ok(csv.includes("held through wick"));
  });
});
