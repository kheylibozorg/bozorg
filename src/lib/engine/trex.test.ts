import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { simulateTrades } from "./paper.ts";
import { runTrexEngine, trexBeAtR, trexProfile } from "./trex.ts";
import type { Bar, Signal } from "./types.ts";

function walk(n: number, seed = 100): Bar[] {
  const bars: Bar[] = [];
  let px = seed;
  const t0 = Date.UTC(2024, 0, 1);
  for (let i = 0; i < n; i++) {
    px += Math.sin(i / 11) * 0.35 + Math.cos(i / 29) * 0.15;
    const high = px + 0.4 + (i % 7) * 0.02;
    const low = px - 0.4 - (i % 5) * 0.02;
    bars.push({
      time: t0 + i * 15 * 60 * 1000,
      open: px - 0.05,
      high,
      low,
      close: px,
      volume: 1000 + (i % 20) * 10,
    });
  }
  return bars;
}

describe("TREX locked lab profiles", () => {
  it("1.0R matches the published 15m Pine", () => {
    const p = trexProfile("TREX1");
    assert.equal(p.rr, 1);
    assert.equal(p.beAtR, 0.35);
    assert.equal(p.minLegAtr, 2);
    assert.equal(p.slAtrMult, 0.35);
    assert.equal(p.ftcWait, 12);
    assert.equal(p.minRoomR, 1.2);
    assert.equal(p.minStopPct, 0.5);
    assert.equal(p.minTpPct, 0.5);
    assert.equal(p.cooldownBars, 2);
    assert.equal(p.coverMax, 2);
    assert.equal(p.needThird, true);
    assert.equal(p.useLongbar, true);
    assert.equal(p.useHtfEma, true);
    assert.equal(p.legLookback, 40);
    assert.equal(trexBeAtR("TREX1"), 0.35);
    assert.equal(trexBeAtR("APEX1"), null);
  });

  it("1.2R matches the published 15m Pine", () => {
    const p = trexProfile("TREX12");
    assert.equal(p.rr, 1.2);
    assert.equal(p.beAtR, 0.32);
    assert.equal(p.minLegAtr, 2.4);
    assert.equal(p.minRoomR, 1.5);
    assert.equal(p.cooldownBars, 3);
    assert.equal(p.slAtrMult, 0.35);
    assert.equal(p.minStopPct, 0.5);
    assert.equal(p.minTpPct, 0.5);
    assert.equal(trexBeAtR("TREX12"), 0.32);
  });

  it("does not emit on warmup and does not throw on a quiet walk", () => {
    const bars = walk(320);
    for (const name of ["TREX1", "TREX12"] as const) {
      for (const tf of ["5m", "15m", "1h", "4h"] as const) {
        const res = runTrexEngine(bars, tf, name);
        assert.ok(Array.isArray(res.signals));
        for (const s of res.signals) {
          assert.ok(s.barIndex >= 266);
          assert.equal(s.indicator, name);
          assert.ok(s.rr === 1 || s.rr === 1.2);
          assert.equal(s.beAtR, name === "TREX12" ? 0.32 : 0.35);
          assert.ok(s.entry > 0 && s.sl > 0 && s.tp > 0);
          if (s.side === "long") {
            assert.ok(s.sl < s.entry && s.tp > s.entry);
          } else {
            assert.ok(s.sl > s.entry && s.tp < s.entry);
          }
        }
      }
    }
  });
});

describe("TREX break-even execution", () => {
  it("moves stop to entry after +0.35R and exits BE on the same bar if price tags entry", () => {
    const t0 = Date.UTC(2024, 0, 1);
    const bars: Bar[] = [];
    for (let i = 0; i < 12; i++) {
      bars.push({
        time: t0 + i * 60_000,
        open: 100,
        high: 100.2,
        low: 99.8,
        close: 100,
        volume: 1,
      });
    }
    bars[6] = { time: bars[6]!.time, open: 100, high: 104, low: 99.9, close: 100, volume: 1 };
    const signals: Signal[] = [
      {
        barIndex: 5,
        barTime: bars[5]!.time,
        indicator: "TREX1",
        side: "long",
        entry: 100,
        sl: 90,
        tp: 110,
        rr: 1,
        atr: 1,
        beAtR: 0.35,
        reason: "test",
      },
    ];
    const sim = simulateTrades(signals, bars, {
      equity: 10_000,
      capitalPct: 10,
      leverage: 10,
      symbol: "BTCUSDT",
      timeframe: "15m",
    });
    assert.equal(sim.trades.length, 1);
    assert.equal(sim.trades[0]!.reason, "be");
    assert.equal(sim.trades[0]!.exit, 100);
    assert.equal(sim.trades[0]!.closedBarTime, bars[6]!.time);
    assert.ok(Math.abs(sim.trades[0]!.pnlR) < 1e-9);
  });

  it("moves stop to entry after +0.35R and exits BE on the next bar if the BE bar holds", () => {
    const t0 = Date.UTC(2024, 0, 1);
    const bars: Bar[] = [];
    for (let i = 0; i < 12; i++) {
      bars.push({
        time: t0 + i * 60_000,
        open: 100,
        high: 100.2,
        low: 99.8,
        close: 100,
        volume: 1,
      });
    }
    bars[6] = { time: bars[6]!.time, open: 100, high: 104, low: 100.1, close: 103.5, volume: 1 };
    bars[7] = { time: bars[7]!.time, open: 103, high: 103.2, low: 99.9, close: 100, volume: 1 };
    const signals: Signal[] = [
      {
        barIndex: 5,
        barTime: bars[5]!.time,
        indicator: "TREX1",
        side: "long",
        entry: 100,
        sl: 90,
        tp: 110,
        rr: 1,
        atr: 1,
        beAtR: 0.35,
        reason: "test",
      },
    ];
    const sim = simulateTrades(signals, bars, {
      equity: 10_000,
      capitalPct: 10,
      leverage: 10,
      symbol: "BTCUSDT",
      timeframe: "15m",
    });
    assert.equal(sim.trades.length, 1);
    assert.equal(sim.trades[0]!.reason, "be");
    assert.equal(sim.trades[0]!.exit, 100);
    assert.equal(sim.trades[0]!.closedBarTime, bars[7]!.time);
    assert.ok(Math.abs(sim.trades[0]!.pnlR) < 1e-9);
  });

  it("does not move APEX stops — no beAtR means original SL/TP path", () => {
    const t0 = Date.UTC(2024, 0, 1);
    const bars: Bar[] = [];
    for (let i = 0; i < 12; i++) {
      bars.push({
        time: t0 + i * 60_000,
        open: 100,
        high: 100.2,
        low: 99.8,
        close: 100,
        volume: 1,
      });
    }
    bars[6] = { time: bars[6]!.time, open: 100, high: 104, low: 99.9, close: 103.5, volume: 1 };
    bars[8] = { time: bars[8]!.time, open: 103, high: 103.2, low: 89, close: 90, volume: 1 };
    const signals: Signal[] = [
      {
        barIndex: 5,
        barTime: bars[5]!.time,
        indicator: "APEX1",
        side: "long",
        entry: 100,
        sl: 90,
        tp: 110,
        rr: 1,
        atr: 1,
        reason: "apex",
      },
    ];
    const sim = simulateTrades(signals, bars, {
      equity: 10_000,
      capitalPct: 10,
      leverage: 10,
      symbol: "BTCUSDT",
      timeframe: "15m",
    });
    assert.equal(sim.trades.length, 1);
    assert.equal(sim.trades[0]!.reason, "sl");
    assert.equal(sim.trades[0]!.exit, 90);
  });
});
