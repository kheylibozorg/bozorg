import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TF_MS } from "./types.ts";
import {
  FRESH_MS,
  dueTimeframes,
  emptyScanDone,
  isFreshSignal,
  latestClosedOpen,
  scanLastN,
  shouldResetCursor,
} from "./scan-schedule.ts";

const T5 = TF_MS["5m"];

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
});

describe("scanLastN / cursor reset", () => {
  it("cron looks at exactly one closed bar", () => {
    assert.equal(scanLastN("cloudflare"), 1);
    assert.equal(scanLastN("backup"), 1);
    assert.equal(scanLastN("watchdog"), 1);
    assert.equal(scanLastN("manual"), 4);
  });
  it("resets the universe cursor on a new 5m close", () => {
    const close = Date.UTC(2026, 0, 1, 12, 5, 0);
    const bar = close - T5;
    assert.equal(shouldResetCursor(0, bar, ["5m"]), true);
    assert.equal(shouldResetCursor(bar, bar, ["5m"]), false);
    assert.equal(shouldResetCursor(bar - T5, bar, ["5m"]), true);
    assert.equal(shouldResetCursor(0, bar, ["15m"]), false);
  });
});
