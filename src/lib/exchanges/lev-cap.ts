/** Never request more than this, even if a venue advertises 250x+. */
export const LEV_CAP = 200;

export function capLeverage(n: number, fallback = 25) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v) || v < 1) return Math.min(LEV_CAP, Math.max(1, fallback));
  return Math.min(LEV_CAP, Math.max(1, v));
}
