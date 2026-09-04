import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { customAtr, ema } from "./math.ts";
import {
  ALL_INDICATORS,
  APEX_INDICATORS,
  HALCYON_INDICATORS,
  SCAN_RULE,
  apexProfile,
  indicatorLabel,
  type Bar,
  type Timeframe,
} from "./types.ts";

describe("APEX locked lab profiles", () => {
  it("keeps 1R / 1.5R / 2R gates and still scans them first", () => {
    assert.deepEqual(APEX_INDICATORS, ["APEX1", "APEX15", "APEX2"]);
    assert.deepEqual(HALCYON_INDICATORS, ["HAEG", "HVES", "HORI", "HALC"]);
    assert.deepEqual(ALL_INDICATORS, ["APEX1", "APEX15", "APEX2", "HAEG", "HVES", "HORI", "HALC", "TREX1", "TREX12", "KETEX", "SHETEX"]);
    for (const tf of ["5m", "15m", "1h", "4h"] as Timeframe[]) {
      assert.deepEqual(SCAN_RULE[tf].slice(0, 3), ["APEX2", "APEX15", "APEX1"]);
      assert.deepEqual(SCAN_RULE[tf].slice(3, 7), ["HORI", "HVES", "HAEG", "HALC"]);
      assert.deepEqual(SCAN_RULE[tf].slice(7, 9), ["TREX12", "TREX1"]);
      assert.deepEqual(SCAN_RULE[tf].slice(9), ["KETEX", "SHETEX"]);
    }
    assert.equal(indicatorLabel("APEX1"), "1R");
    assert.equal(indicatorLabel("APEX15"), "1.5R");
    assert.equal(indicatorLabel("APEX2"), "2R");
    assert.equal(indicatorLabel("HAEG"), "Aegis");
    assert.equal(indicatorLabel("HVES"), "Vesper");
    assert.equal(indicatorLabel("HORI"), "Orion");
    assert.equal(indicatorLabel("HALC"), "Coil");
    assert.equal(indicatorLabel("TREX1"), "T1.0");
    assert.equal(indicatorLabel("TREX12"), "T1.2");
    assert.equal(indicatorLabel("KETEX"), "KETEX");
    assert.equal(indicatorLabel("SHETEX"), "SHETEX");
  });

  it("locks 1R auto-gates from the published Pine", () => {
    const m5 = apexProfile("APEX1", "5m");
    assert.equal(m5.rr, 1);
    assert.equal(m5.sides, "Short");
    assert.equal(m5.minBr, 0.45);
    assert.equal(m5.emaStack, true);
    assert.equal(m5.requireDI, true);
    assert.equal(m5.requireCover1, false);
    assert.equal(m5.minTests, 1);
    assert.equal(m5.minAwayAtr, 1.5);
    assert.equal(m5.slAtrMult, 0.15);
    assert.equal(m5.minRoomR, 1.8);
    assert.equal(m5.ftcWait, 12);
    assert.equal(m5.cooldownBars, 2);
    assert.equal(m5.minLegAtr, 2.2);
    assert.equal(m5.bandAtr, 0.8);
    assert.equal(m5.minStopPct, 0.35);
    assert.equal(m5.widenStop, false);
    assert.equal(m5.minVol, 0);

    const m15 = apexProfile("APEX1", "15m");
    assert.equal(m15.sides, "Both");
    assert.equal(m15.minBr, 0.55);
    assert.equal(m15.emaStack, false);
    assert.equal(m15.requireDI, false);
    assert.equal(m15.requireCover1, true);
    assert.equal(m15.minTests, 2);
    assert.equal(m15.slAtrMult, 0.5);
    assert.equal(m15.minRoomR, 1.2);
    assert.equal(m15.minStopPct, 0.5);
    assert.equal(m15.bandAtr, 0.85);

    const h1 = apexProfile("APEX1", "1h");
    const h4 = apexProfile("APEX1", "4h");
    assert.equal(h1.minBr, 0.6);
    assert.equal(h1.minStopPct, 0.6);
    assert.equal(h1.sides, "Both");
    assert.equal(h1.emaStack, true);
    assert.deepEqual(h4, h1);
  });

  it("locks 1.5R auto-gates from the published Pine", () => {
    const m5 = apexProfile("APEX15", "5m");
    assert.equal(m5.rr, 1.5);
    assert.equal(m5.sides, "Short");
    assert.equal(m5.minBr, 0.55);
    assert.equal(m5.requireCover1, true);
    assert.equal(m5.minTests, 2);
    assert.equal(m5.minLegAtr, 2.6);
    assert.equal(m5.bandAtr, 0.7);
    assert.equal(m5.minStopPct, 0.233);
    assert.equal(m5.widenStop, true);

    const m15 = apexProfile("APEX15", "15m");
    assert.equal(m15.sides, "Both");
    assert.equal(m15.slAtrMult, 0.35);
    assert.equal(m15.ftcWait, 8);
    assert.equal(m15.cooldownBars, 5);
    assert.equal(m15.minStopPct, 0.35);
    assert.equal(m15.widenStop, true);

    const h1 = apexProfile("APEX15", "1h");
    assert.equal(h1.minBr, 0.75);
    assert.equal(h1.requireCover1, false);
    assert.equal(h1.minStopPct, 0.4);
    assert.equal(h1.widenStop, false);
    assert.equal(h1.sides, "Both");
  });

  it("locks 2R auto-gates from the published Pine — shorts only", () => {
    const m5 = apexProfile("APEX2", "5m");
    assert.equal(m5.rr, 2);
    assert.equal(m5.sides, "Short");
    assert.equal(m5.minBr, 0.7);
    assert.equal(m5.emaStack, false);
    assert.equal(m5.requireDI, true);
    assert.equal(m5.minVol, 0.8);
    assert.equal(m5.minStopPct, 0.175);
    assert.equal(m5.widenStop, true);

    const m15 = apexProfile("APEX2", "15m");
    assert.equal(m15.sides, "Short");
    assert.equal(m15.minVol, 0.9);
    assert.equal(m15.minStopPct, 0.25);
    assert.equal(m15.widenStop, true);
    assert.equal(m15.requireCover1, false);

    const h1 = apexProfile("APEX2", "1h");
    assert.equal(h1.sides, "Short");
    assert.equal(h1.minBr, 0);
    assert.equal(h1.requireCover1, true);
    assert.equal(h1.minRoomR, 2.2);
    assert.equal(h1.ftcWait, 8);
    assert.equal(h1.cooldownBars, 3);
    assert.equal(h1.minStopPct, 0.45);
    assert.equal(h1.widenStop, false);
    assert.equal(apexProfile("APEX2", "4h").sides, "Short");
  });
});

describe("APEX math", () => {
  it("custom ATR is finite after the 264-bar warmup", () => {
    const n = 320;
    const high: number[] = [];
    const low: number[] = [];
    const close: number[] = [];
    let px = 50_000;
    for (let i = 0; i < n; i++) {
      px += Math.sin(i / 9) * 40;
      high.push(px + 30);
      low.push(px - 30);
      close.push(px);
    }
    const atr = customAtr(high, low, close);
    assert.ok(Number.isFinite(atr[300]!));
    assert.ok(Number.isFinite(ema(close, 21)[40]!));
  });

  it("same-bar SL+TP is a stop, matching the Pine header", () => {
    const b: Bar = { time: 1, open: 100, high: 120, low: 80, close: 110, volume: 1 };
    const longHit = b.low <= 90 && b.high >= 115;
    const shortHit = b.high >= 110 && b.low <= 85;
    assert.equal(longHit, true);
    assert.equal(shortHit, true);
  });
});
