import { TF_MS, type Timeframe } from "./types.ts";

export const SCAN_TFS: Timeframe[] = ["5m", "15m", "1h", "4h"];

/** UI treats the cron as dead if no heartbeat lands within this window. */
export const CRON_STALE_MS = 90_000;

/**
 * How long after a bar's close we still accept a fill.
 * Window is the rest of the next bar of that TF so a 200-coin book can
 * finish across 1-minute cron pings (Vercel ~10s/tick ≈ 30–40 coins).
 */
export const FRESH_MS: Record<Timeframe, number> = {
  "5m": TF_MS["5m"] - 3_000,
  "15m": TF_MS["15m"] - 3_000,
  "1h": TF_MS["1h"] - 3_000,
  "4h": TF_MS["4h"] - 3_000,
};

export type ScanDone = Record<Timeframe, number>;

export type TfCursor = { c: number; e: number };

export function emptyScanDone(): ScanDone {
  return { "5m": 0, "15m": 0, "1h": 0, "4h": 0 };
}

export function emptyCursors(): Record<Timeframe, TfCursor> {
  return { "5m": { c: 0, e: 0 }, "15m": { c: 0, e: 0 }, "1h": { c: 0, e: 0 }, "4h": { c: 0, e: 0 } };
}

export function parseCursors(raw: unknown): Record<Timeframe, TfCursor> {
  const out = emptyCursors();
  let obj: unknown = raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return out;
    try {
      obj = JSON.parse(t);
    } catch {
      return out;
    }
  }
  if (!obj || typeof obj !== "object") return out;
  const rec = obj as Record<string, { c?: unknown; e?: unknown } | number>;
  for (const tf of SCAN_TFS) {
    const row = rec[tf];
    if (typeof row === "number" && Number.isFinite(row)) {
      out[tf] = { c: Math.max(0, Math.floor(row)), e: 0 };
      continue;
    }
    if (!row || typeof row !== "object") continue;
    const c = Number(row.c);
    const e = Number(row.e);
    out[tf] = {
      c: Number.isFinite(c) ? Math.max(0, Math.floor(c)) : 0,
      e: Number.isFinite(e) ? e : 0,
    };
  }
  return out;
}

/** Consecutive completed items from the start of a planned slice. */
export function prefixCompleted(done: boolean[]): number {
  let n = 0;
  while (n < done.length && done[n]) n += 1;
  return n;
}

/** Round-robin items from several slices so a 5m wave cannot starve 1h/4h. */
export function interleaveSlices<T>(slices: T[][]): T[] {
  const out: T[] = [];
  const max = Math.max(0, ...slices.map((s) => s.length));
  for (let i = 0; i < max; i++) {
    for (const s of slices) {
      const x = s[i];
      if (x !== undefined) out.push(x);
    }
  }
  return out;
}

export function nextTfCursor(opts: {
  cur: number;
  epoch: number;
  closedOpen: number;
  universeLen: number;
  prefixDone: number;
}): { cursor: TfCursor; wrapped: boolean } {
  const start = shouldResetCursor(opts.epoch, opts.closedOpen) ? 0 : opts.cur;
  const len = Math.max(0, opts.universeLen);
  const prefix = Math.max(0, Math.min(opts.prefixDone, len || opts.prefixDone));
  if (!len) return { cursor: { c: 0, e: opts.closedOpen }, wrapped: false };
  const nextRaw = start + prefix;
  const wrapped = nextRaw >= len && prefix > 0;
  return {
    cursor: { c: wrapped ? 0 : nextRaw % len, e: opts.closedOpen },
    wrapped,
  };
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

/** Start a new sweep for this TF when its latest closed bar changes. */
export function shouldResetCursor(epochMs: number, latestClosed: number): boolean {
  return latestClosed > 0 && latestClosed !== epochMs;
}
