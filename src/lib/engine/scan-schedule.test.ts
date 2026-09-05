import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TF_MS } from "./types.ts";
import {
  FRESH_MS,
  dueTimeframes,
  emptyScanDone,
  interleaveSlices,
  isFreshSignal,
  latestClosedOpen,
  nextTfCursor,
  parseCursors,
  prefixCompleted,
  scanLastN,
  shouldResetCursor,
} from "./scan-schedule.ts";

const T5 = TF_MS["5m"];
const T15 = TF_MS["15m"];
const T1H = TF_MS["1h"];

describe("latestClosedOpen", () => {
  it("at exact 5m close returns the bar that just closed", () => {
    const close = Date.UTC(2026, 0, 1, 12, 5, 0);
    assert.equal(latestClosedOpen(T5, close), close - T5);
  });
  it("one second before the next close still points at the same bar", () => {
    const close = Date.UTC(2026, 0, 1, 12, 5, 0);
    const now = close + T5 - 1_000;
    assert.equal(latestClosedOpen(T5, now), latestClosedOpen(T5, close));
  });
});

describe("dueTimeframes", () => {
  it("manual always returns every TF", () => {
    const now = Date.UTC(2026, 0, 1, 12, 1, 0);
    assert.deepEqual(dueTimeframes(now, emptyScanDone(), "manual"), ["5m", "15m", "1h", "4h"]);
  });
  it("cron scans 5m right after close", () => {
    const close = Date.UTC(2026, 0, 1, 12, 5, 0);
    const tfs = dueTimeframes(close + 2_000, emptyScanDone(), "cloudflare");
    assert.ok(tfs.includes("5m"));
  });
  it("cron keeps sweeping 5m for the rest of the next bar if unfinished", () => {
    const close = Date.UTC(2026, 0, 1, 12, 5, 0);
    const tfs = dueTimeframes(close + 3 * 60_000, emptyScanDone(), "cloudflare");
    assert.ok(tfs.includes("5m"));
  });
  it("cron skips 5m after a full sweep of that bar", () => {
    const close = Date.UTC(2026, 0, 1, 12, 5, 0);
    const done = { ...emptyScanDone(), "5m": close - T5 };
    const tfs = dueTimeframes(close + 2_000, done, "cloudflare");
    assert.ok(!tfs.includes("5m"));
  });
  it("cron does not keep a 5m bar after the next one closes", () => {
    const close = Date.UTC(2026, 0, 1, 12, 5, 0);
    const tfs = dueTimeframes(close + T5 + 1_000, emptyScanDone(), "cron");
    const closed = latestClosedOpen(T5, close + T5 + 1_000);
    assert.equal(closed, close);
    assert.ok(tfs.includes("5m"));
    const oldOpen = close - T5;
    assert.equal(isFreshSignal(oldOpen, "5m", close + T5 + 1_000), false);
  });
  it("cron keeps sweeping 15m for the rest of the next 15m bar", () => {
    const close = Date.UTC(2026, 0, 1, 12, 15, 0);
    const tfs = dueTimeframes(close + 8 * 60_000, emptyScanDone(), "cloudflare");
    assert.ok(tfs.includes("15m"));
  });
  it("cron keeps sweeping 1h for 20 minutes so a 200-coin book can finish", () => {
    const close = Date.UTC(2026, 0, 1, 13, 0, 0);
    const tfs = dueTimeframes(close + 20 * 60_000, emptyScanDone(), "cloudflare");
    assert.ok(tfs.includes("1h"));
  });
  it("cron still sweeps 1h near the next close so a slow book can finish", () => {
    const close = Date.UTC(2026, 0, 1, 13, 0, 0);
    const tfs = dueTimeframes(close + 50 * 60_000, emptyScanDone(), "cloudflare");
    assert.ok(tfs.includes("1h"));
  });
});

describe("isFreshSignal", () => {
  it("rejects the previous 5m candle", () => {
    const close = Date.UTC(2026, 0, 1, 12, 10, 0);
    const prev = close - 2 * T5;
    assert.equal(isFreshSignal(prev, "5m", close + 1_000), false);
  });
  it("accepts the just-closed 5m candle for the rest of the next bar", () => {
    const close = Date.UTC(2026, 0, 1, 12, 5, 0);
    const open = close - T5;
    assert.equal(isFreshSignal(open, "5m", close + 1_000), true);
    assert.equal(isFreshSignal(open, "5m", close + FRESH_MS["5m"] - 1_000), true);
    assert.equal(isFreshSignal(open, "5m", close + FRESH_MS["5m"] + 4_000), false);
  });
  it("rejects a still-forming bar open", () => {
    const close = Date.UTC(2026, 0, 1, 12, 5, 0);
    assert.equal(isFreshSignal(close, "5m", close + 30_000), false);
  });
  it("accepts a 15m close 8 minutes later", () => {
    const close = Date.UTC(2026, 0, 1, 12, 15, 0);
    const open = close - T15;
    assert.equal(isFreshSignal(open, "15m", close + 8 * 60_000), true);
  });
});

describe("scanLastN / per-TF cursor", () => {
  it("cron looks at exactly one closed bar", () => {
    assert.equal(scanLastN("cloudflare"), 1);
    assert.equal(scanLastN("backup"), 1);
    assert.equal(scanLastN("watchdog"), 1);
    assert.equal(scanLastN("manual"), 4);
  });
  it("resets a TF cursor when that TF has a new closed bar", () => {
    const close = Date.UTC(2026, 0, 1, 12, 5, 0);
    const bar = close - T5;
    assert.equal(shouldResetCursor(0, bar), true);
    assert.equal(shouldResetCursor(bar, bar), false);
    assert.equal(shouldResetCursor(bar - T5, bar), true);
  });
  it("does not let a 5m wrap steal an unfinished 1h sweep", () => {
    const h1Close = Date.UTC(2026, 0, 1, 13, 0, 0);
    const h1Open = h1Close - T1H;
    const later5m = h1Close + 5 * T5;
    const h1 = nextTfCursor({
      cur: 80,
      epoch: h1Open,
      closedOpen: latestClosedOpen(T1H, later5m),
      universeLen: 200,
      prefixDone: 40,
    });
    assert.equal(h1.wrapped, false);
    assert.equal(h1.cursor.c, 120);
    assert.equal(h1.cursor.e, h1Open);
  });
  it("advances only the consecutive prefix so a killed tick does not skip coins", () => {
    assert.equal(prefixCompleted([true, true, false, true]), 2);
    assert.equal(prefixCompleted([false, true]), 0);
    const wrap = nextTfCursor({
      cur: 180,
      epoch: 1,
      closedOpen: 1,
      universeLen: 200,
      prefixDone: 20,
    });
    assert.equal(wrap.wrapped, true);
    assert.equal(wrap.cursor.c, 0);
  });
  it("parses stored per-TF cursors", () => {
    const got = parseCursors('{"5m":{"c":40,"e":9},"1h":{"c":12,"e":8}}');
    assert.equal(got["5m"].c, 40);
    assert.equal(got["1h"].c, 12);
    assert.equal(got["15m"].c, 0);
  });
});

describe("interleaveSlices", () => {
  it("round-robins so the first TF cannot take every slot", () => {
    const got = interleaveSlices([
      ["a", "b", "c"],
      ["x", "y"],
    ]);
    assert.deepEqual(got, ["a", "x", "b", "y", "c"]);
  });
});
