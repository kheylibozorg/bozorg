import { TF_MS, type Timeframe } from "./types.ts";

export const SCAN_TFS: Timeframe[] = ["5m", "15m", "1h", "4h"];

/** UI treats the cron as dead if no heartbeat lands within this window. */
export const CRON_STALE_MS = 90_000;

/**
 * How long after a bar's close we still accept a fill.
 * 5m: the whole next 5m bar (same candle Pine would fill into).
 * Higher TFs: five minutes — later than that the move is already gone.
 */
export const FRESH_MS: Record<Timeframe, number> = {
  "5m": TF_MS["5m"] - 3_000,
  "15m": 5 * 60_000,
  "1h": 5 * 60_000,
  "4h": 5 * 60_000,
};

export type ScanDone = Record<Timeframe, number>;

export function emptyScanDone(): ScanDone {
  return { "5m": 0, "15m": 0, "1h": 0, "4h": 0 };
}

/** Open time of the latest fully closed bar. */
export function latestClosedOpen(tfMs: number, now: number): number {
  const open = Math.floor(now / tfMs) * tfMs;
  return open - tfMs;
}

export function barCloseTime(barOpen: number, tfMs: number): number {
  return barOpen + tfMs;
}

/**
 * Cron: only TFs whose latest closed bar is still fresh and not fully swept.
 * Manual: every TF (operator asked for a scan now).
 */
export function dueTimeframes(now: number, scanDone: ScanDone, source?: string): Timeframe[] {
  if (!source || source === "manual") return SCAN_TFS.slice();
  return SCAN_TFS.filter((tf) => {
    const tfMs = TF_MS[tf];
    const closedOpen = latestClosedOpen(tfMs, now);
    if (closedOpen <= (scanDone[tf] || 0)) return false;
    const age = now - barCloseTime(closedOpen, tfMs);
    if (age < 0) return false;
    if (age > FRESH_MS[tf]) return false;
    return true;
  });
}

/** Cron only inspects the just-closed bar. Manual may look back a few. */
export function scanLastN(source?: string): number {
  if (!source || source === "manual") return 4;
  return 1;
}

/** True only for the latest closed bar, and only while it is still fresh. */
export function isFreshSignal(barOpen: number, tf: Timeframe, now: number): boolean {
  const tfMs = TF_MS[tf];
  if (!Number.isFinite(barOpen) || barOpen <= 0) return false;
  const latest = latestClosedOpen(tfMs, now);
  if (barOpen !== latest) return false;
  const age = now - barCloseTime(barOpen, tfMs);
  return age >= -2_000 && age <= FRESH_MS[tf];
}

/** Start a new universe sweep when a fresh 5m close appears. */
export function shouldResetCursor(epochMs: number, latestClosed5m: number, tfs: Timeframe[]): boolean {
  return tfs.includes("5m") && latestClosed5m > 0 && latestClosed5m !== epochMs;
}
