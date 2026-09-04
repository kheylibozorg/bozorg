import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nativeSymbol, coinOf, bookVenue, isTradeableBase, venueLabel, looksLikeFallbackUniverse, chartHostLabel } from "../exchanges/meta.ts";
import { listedFromToobitContracts, listedFromToobitTickers } from "../exchanges/toobit-listed.ts";
import { barFromBinanceRow, barFromHlCandle, barFromLighterCandle, klineWindow, sortBars } from "./ohlcv.ts";

describe("venue-native markets", () => {
  it("names the pair the way that venue books it", () => {
    assert.equal(nativeSymbol("aster", "BTCUSDT"), "BTCUSDT");
    assert.equal(nativeSymbol("paper", "ETHUSDT"), "ETHUSDT");
    assert.equal(nativeSymbol("toobit", "BTCUSDT"), "BTC-SWAP-USDT");
    assert.equal(nativeSymbol("toobit", "SOL"), "SOL-SWAP-USDT");
    assert.equal(nativeSymbol("hyperliquid", "BTCUSDT"), "BTC");
    assert.equal(nativeSymbol("lighter", "ETHUSDT"), "ETH");
  });

  it("strips Toobit swap tails to the coin", () => {
    assert.equal(coinOf("BTC-SWAP-USDT"), "BTC");
    assert.equal(coinOf("BTCUSDT"), "BTC");
    assert.equal(coinOf("BTC"), "BTC");
  });

  it("always sends a startTime window so Toobit/Lighter are not one-bar replies", () => {
    const w = klineWindow("5m", 360, 1_700_000_000_000);
    assert.equal(w.count, 360);
    assert.equal(w.end - w.start, 360 * 5 * 60 * 1000);
    assert.ok(w.start < w.end);
  });

  it("parses Binance-style, Hyperliquid and Lighter candles to the same bar shape", () => {
    const binance = barFromBinanceRow([1_700, "10", "12", "9", "11", "33"]);
    const hl = barFromHlCandle({ t: 1_700, o: "10", h: "12", l: "9", c: "11", v: "33" });
    const lighter = barFromLighterCandle({ t: 1_700, o: 10, h: 12, l: 9, c: 11, v: 33 });
    assert.deepEqual(binance, { time: 1700, open: 10, high: 12, low: 9, close: 11, volume: 33 });
    assert.deepEqual(hl, binance);
    assert.deepEqual(lighter, binance);
    assert.equal(barFromBinanceRow(["x"]), null);
    assert.equal(barFromHlCandle({ t: 1, o: "bad" }), null);
  });

  it("sorts mixed candle order and drops dupes", () => {
    const out = sortBars(
      [
        { time: 3, open: 1, high: 1, low: 1, close: 1, volume: 1 },
        { time: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 },
        { time: 3, open: 2, high: 2, low: 2, close: 2, volume: 2 },
      ],
      10,
    );
    assert.deepEqual(
      out.map((b) => b.time),
      [1, 3],
    );
    assert.equal(out[1]?.close, 2);
  });

  it("book follows the selected venue even when fills are paper", () => {
    assert.equal(bookVenue("hyperliquid"), "hyperliquid");
    assert.equal(bookVenue("lighter"), "lighter");
    assert.equal(bookVenue("aster"), "aster");
    assert.equal(bookVenue("toobit"), "toobit");
    assert.equal(bookVenue("paper"), "paper");
    assert.equal(bookVenue(null), "paper");
    assert.equal(bookVenue("nope"), "paper");
    assert.equal(venueLabel("toobit"), "Toobit");
    assert.equal(chartHostLabel("paper"), "Aster");
    assert.equal(chartHostLabel("hyperliquid"), "Hyperliquid");
  });

  it("skips stables and HIP-3 prefixes from the tradeable book", () => {
    assert.equal(isTradeableBase("BTCUSDT"), "BTC");
    assert.equal(isTradeableBase("ETH-SWAP-USDT"), "ETH");
    assert.equal(isTradeableBase("USDT"), "");
    assert.equal(isTradeableBase("USDC"), "");
    assert.equal(isTradeableBase("xyz:TSLA"), "");
    assert.equal(isTradeableBase("kPEPE"), "KPEPE");
  });

  it("builds Toobit perps from contracts and from SWAP tickers", () => {
    const fromBook = listedFromToobitContracts(
      [
        { symbol: "BTC-SWAP-USDT", status: "TRADING", quoteAsset: "USDT", inverse: false, riskLimits: [{ maxLeverage: "100" }] },
        { symbol: "ETH-SWAP-USDT", status: "TRADING", quoteAsset: "USDT", inverse: false },
        { symbol: "BTCUSDT", status: "TRADING", quoteAsset: "USDT" },
        { symbol: "DOGE-SWAP-USDC", status: "TRADING", quoteAsset: "USDC" },
        { symbol: "XRP-SWAP-USDT", status: "HALT", quoteAsset: "USDT" },
      ],
      new Map([["BTC-SWAP-USDT", 9e9]]),
    );
    assert.equal(fromBook.length, 2);
    assert.equal(fromBook[0]?.base, "BTC");
    assert.equal(fromBook[0]?.venueSymbol, "BTC-SWAP-USDT");
    assert.equal(fromBook[0]?.volume24hUsd, 9e9);
    assert.equal(fromBook[0]?.maxLeverage, 100);
    assert.equal(fromBook[1]?.base, "ETH");

    const fromTickers = listedFromToobitTickers([
      { s: "SOL-SWAP-USDT", qv: "12" },
      { s: "ETHUSDT", qv: "99" },
      { s: "SOL-SWAP-USDT", qv: "1" },
    ]);
    assert.equal(fromTickers.length, 1);
    assert.equal(fromTickers[0]?.base, "SOL");
    assert.equal(fromTickers[0]?.venueSymbol, "SOL-SWAP-USDT");
  });

  it("flags the emergency 10-coin list so the desk retries the live book", () => {
    const rows = ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "ADA", "TRX", "AVAX", "LINK"].map((base) => ({ base }));
    assert.equal(looksLikeFallbackUniverse(rows), true);
    assert.equal(looksLikeFallbackUniverse(rows.concat({ base: "SUI" })), false);
    assert.equal(looksLikeFallbackUniverse([{ base: "BTC" }]), false);
  });
});
