export function roundToStep(qty: number, step: number, min = 0) {
  const s = step > 0 ? step : 1;
  const n = Math.floor(qty / s + 1e-12) * s;
  const v = Number(n.toPrecision(12));
  if (v < min) return 0;
  return v;
}
