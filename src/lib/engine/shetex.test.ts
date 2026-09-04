import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runShetexEngine, shetexProfile } from "./shetex.ts";
import { isApexName, isHalcyonName, isKetexName, isShetexName, isTrexName } from "./types.ts";
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

describe("SHETEX TREX Entries profile", () => {
  it("locks the shetex.txt defaults", () => {
    const p = shetexProfile();
    assert.equal(p.name, "SHETEX");
    assert.equal(p.rr, 1.8);
    assert.equal(p.minRoomR, 1.6);
    assert.equal(p.minLegAtr, 2.6);
    assert.equal(p.slAtrMult, 0.35);
    assert.equal(p.ftcWait, 8);
    assert.equal(p.cooldownBars, 5);
    assert.equal(p.useHtfEma, true);
    assert.equal(p.coverMax, 2);
    assert.equal(p.needThird, true);
    assert.equal(p.useLongbar, true);
    assert.equal(p.legLookback, 40);
    assert.equal(p.bandAtr, 0.7);
    assert.equal(isShetexName("SHETEX"), true);
    assert.equal(isShetexName("TREX1"), false);
    assert.equal(isTrexName("SHETEX"), false);
    assert.equal(isKetexName("SHETEX"), false);
    assert.equal(isApexName("SHETEX"), false);
    assert.equal(isHalcyonName("SHETEX"), false);
  });

  it("does not emit on warmup, has no BE, and stays 1.8R", () => {
    const bars = walk(360);
    for (const tf of ["5m", "15m", "1h", "4h"] as const) {
      const res = runShetexEngine(bars, tf);
      assert.ok(Array.isArray(res.signals));
      for (const s of res.signals) {
        assert.ok(s.barIndex >= 266);
        assert.equal(s.indicator, "SHETEX");
        assert.equal(s.rr, 1.8);
        assert.equal(s.beAtR, undefined);
        assert.ok(s.entry > 0 && s.sl > 0 && s.tp > 0);
        const slDist = Math.abs(s.entry - s.sl);
        const tpDist = Math.abs(s.tp - s.entry);
        assert.ok(Math.abs(tpDist / slDist - 1.8) < 1e-9);
        if (s.side === "long") {
          assert.ok(s.sl < s.entry && s.tp > s.entry);
        } else {
          assert.ok(s.sl > s.entry && s.tp < s.entry);
        }
      }
    }
  });
});
