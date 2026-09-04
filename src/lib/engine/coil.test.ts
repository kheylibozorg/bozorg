import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coilProfile, runCoilEngine } from "./coil.ts";
import type { Bar } from "./types.ts";

function walk(n: number, seed = 100): Bar[] {
  const bars: Bar[] = [];
  let px = seed;
  const t0 = Date.UTC(2024, 0, 1);
  for (let i = 0; i < n; i++) {
    px += Math.sin(i / 11) * 0.35 + Math.cos(i / 29) * 0.15;
    const high = px + 0.4 + (i % 7) * 0.02;
    const low = px - 0.4 - (i % 5) * 0.02;
    bars.push({
      time: t0 + i * 60 * 60 * 1000,
      open: px - 0.05,
      high,
      low,
      close: px,
      volume: 1000 + (i % 20) * 10,
    });
  }
  return bars;
}

describe("HALCYON locked coil profiles", () => {
  it("Aegis / Vesper / Orion R and 5m HTF fade match the published Pine", () => {
    const a5 = coilProfile("HAEG", "5m");
    assert.equal(a5.rr, 1);
    assert.equal(a5.useHtfLock, true);
    assert.equal(a5.qualityFill, true);
    assert.equal(a5.fillCloseLoc, 0.76);
    assert.equal(a5.maxSlFrac, 0.2);
    assert.equal(a5.fillRequirePoke, true);
    assert.equal(a5.ftcWait, 18);
    assert.equal(a5.minStopPct, 0.003);
    assert.equal(a5.volMax, 3);
    assert.equal(a5.requireInside, true);

    const v5 = coilProfile("HVES", "5m");
    assert.equal(v5.rr, 1.5);
    assert.equal(v5.fillCloseLoc, 0.74);
    assert.equal(v5.maxSlFrac, 0.16);
    assert.equal(v5.fillMinBody, 0.24);
    assert.equal(v5.fillChopMin, 46);
    assert.equal(v5.fillRequirePoke, false);

    const o5 = coilProfile("HORI", "5m");
    assert.equal(o5.rr, 2);
    assert.equal(o5.fillCloseLoc, 0.74);
    assert.equal(o5.fillMinBody, 0.28);
    assert.equal(o5.fillChopMin, 50);
    assert.equal(o5.maxSlFrac, 0.16);
  });

  it("15m / 1h fill quality gates follow the RR branches", () => {
    const a15 = coilProfile("HAEG", "15m");
    assert.equal(a15.useHtfLock, false);
    assert.equal(a15.boxLen, 20);
    assert.equal(a15.fillCloseLoc, 0.62);
    assert.equal(a15.maxSlFrac, 0.24);
    assert.equal(a15.fillMinBody, 0.16);
    assert.equal(a15.fillRequirePoke, true);
    assert.equal(a15.ftcWait, 10);
    assert.equal(a15.minTpPct, 0.005);

    const v15 = coilProfile("HVES", "15m");
    assert.equal(v15.fillCloseLoc, 0.8);
    assert.equal(v15.maxSlFrac, 0.32);
    assert.equal(v15.minBoxPct, 0.018);

    const o15 = coilProfile("HORI", "15m");
    assert.equal(o15.fillCloseLoc, 0.8);
    assert.equal(o15.maxSlFrac, 0.16);
    assert.equal(o15.fillMinBody, 0.18);

    const a1 = coilProfile("HAEG", "1h");
    assert.equal(a1.boxLen, 16);
    assert.equal(a1.fillCloseLoc, 0.62);
    assert.equal(a1.maxSlFrac, 0.28);

    const v1 = coilProfile("HVES", "1h");
    assert.equal(v1.fillCloseLoc, 0.74);
    assert.equal(v1.maxSlFrac, 0.32);

    const o1 = coilProfile("HORI", "1h");
    assert.equal(o1.fillCloseLoc, 0.74);
    assert.equal(o1.fillMinBody, 0.16);

    const a4 = coilProfile("HAEG", "4h");
    assert.equal(a4.boxLen, 14);
    assert.equal(a4.fillCloseLoc, 0.62);
    assert.equal(a4.maxSlFrac, 0.32);
  });

  it("original Coil Auto profile is native 2.2R with the رنج.txt gates", () => {
    const c5 = coilProfile("HALC", "5m");
    assert.equal(c5.rr, 2.2);
    assert.equal(c5.useHtfLock, false);
    assert.equal(c5.qualityFill, false);
    assert.equal(c5.boxLen, 24);
    assert.equal(c5.minCompress, 6);
    assert.equal(c5.adxMax, 20);
    assert.equal(c5.fillCloseLoc, 0.78);
    assert.equal(c5.volMax, 1.6);
    assert.equal(c5.ftcWait, 6);
    assert.equal(c5.cooldownBars, 3);
    assert.equal(c5.minAge, 2);
    assert.equal(c5.unlockBars, 8);
    assert.equal(c5.squeeze, 0.95);
    assert.equal(c5.chopMin, 42);
    assert.equal(c5.emaSepMax, 1.5);
    assert.equal(c5.minRangeAtr, 1.1);
    assert.equal(c5.maxRangeAtr, 4.4);
    assert.equal(c5.maxSlFrac, 0.38);
    assert.equal(c5.requireInside, false);

    const c1 = coilProfile("HALC", "1h");
    assert.equal(c1.boxLen, 16);
    assert.equal(c1.minCompress, 4);
    assert.equal(c1.fillCloseLoc, 0.62);
    assert.equal(c1.volMax, 9);
    assert.equal(c1.adxMax, 26);

    const c15 = coilProfile("HALC", "15m");
    assert.equal(c15.boxLen, 20);
    assert.equal(c15.minCompress, 5);
    assert.equal(c15.volMax, 1.8);
  });

  it("does not emit on warmup and does not throw on a quiet walk", () => {
    const bars = walk(320);
    for (const name of ["HAEG", "HVES", "HORI", "HALC"] as const) {
      for (const tf of ["5m", "15m", "1h", "4h"] as const) {
        const res = runCoilEngine(bars, tf, name);
        assert.ok(Array.isArray(res.signals));
        for (const s of res.signals) {
          assert.ok(s.barIndex >= 266);
          assert.equal(s.indicator, name);
          assert.ok(s.rr === 1 || s.rr === 1.5 || s.rr === 2 || s.rr === 2.2);
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

  it("APEX profiles are a different module — coil engine only emits HALCYON names", () => {
    const bars = walk(300);
    for (const name of ["HAEG", "HVES", "HORI", "HALC"] as const) {
      const coil = runCoilEngine(bars, "1h", name);
      for (const s of coil.signals) {
        assert.equal(s.indicator, name);
      }
    }
  });
});
