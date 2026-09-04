import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pathExcursion, walkPath } from "./paper.ts";
import type { Bar } from "./types.ts";

function bar(i: number, o: Partial<Bar> = {}): Bar {
  const t0 = Date.UTC(2024, 0, 1);
  return {
    time: t0 + i * 5 * 60_000,
    open: 100,
    high: 100.2,
    low: 99.8,
    close: 100,
    volume: 1,
    ...o,
  };
}

describe("walkPath — SL/TP across missed ticks", () => {
  it("closes on an older 5m bar even if the latest bar never tagged SL", () => {
    const bars: Bar[] = [
      bar(0),
      bar(1, { low: 89, high: 100.1, close: 95 }),
      bar(2, { low: 99.5, high: 100.4, close: 100 }),
    ];
    const hit = walkPath({
      side: "long",
      entry: 100,
      sl: 90,
      tp: 110,
      bars,
    });
    assert.equal(hit.hit?.reason, "sl");
    assert.equal(hit.hit?.exit, 90);
    assert.equal(hit.hit?.barTime, bars[1]!.time);
  });

  it("takes the first chronological hit, not the last bar", () => {
    const bars: Bar[] = [
      bar(0, { high: 111, low: 99.9, close: 110 }),
      bar(1, { high: 100.1, low: 89, close: 90 }),
    ];
    const hit = walkPath({
      side: "long",
      entry: 100,
      sl: 90,
      tp: 110,
      bars,
    });
    assert.equal(hit.hit?.reason, "tp");
    assert.equal(hit.hit?.exit, 110);
  });

  it("moves TREX stop to entry after +0.35R then can BE-exit on a later bar", () => {
    const bars: Bar[] = [
      bar(0, { high: 104, low: 100.1, close: 103.5 }),
      bar(1, { high: 103.2, low: 99.9, close: 100 }),
    ];
    const hit = walkPath({
      side: "long",
      entry: 100,
      sl: 90,
      tp: 110,
      bars,
      beAtR: 0.35,
    });
    assert.equal(hit.beMoved, true);
    assert.equal(hit.hit?.reason, "be");
    assert.equal(hit.hit?.exit, 100);
    assert.equal(hit.hit?.barTime, bars[1]!.time);
  });
});

describe("pathExcursion", () => {
  it("tracks MAE against the trade and MFE in favor, in R", () => {
    const bars: Bar[] = [
      bar(0, { low: 98, high: 101, close: 100 }),
      bar(1, { low: 96, high: 108, close: 107 }),
    ];
    const x = pathExcursion({
      side: "long",
      entry: 100,
      origSl: 90,
      bars,
    });
    assert.equal(x.maeR, 0.4);
    assert.equal(x.mfeR, 0.8);
  });
});
