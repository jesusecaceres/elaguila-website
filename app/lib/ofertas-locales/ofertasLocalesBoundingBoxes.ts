import type { OfertaLocalSourceBoundingBox } from "./ofertasLocalesTypes";

function finiteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function normalizeOfertaLocalSourceBbox(raw: Record<string, unknown> | null | undefined): OfertaLocalSourceBoundingBox | null {
  if (!raw) return null;
  const xMinRaw = finiteNumber(raw.xMin);
  const yMinRaw = finiteNumber(raw.yMin);
  const xMaxRaw = finiteNumber(raw.xMax);
  const yMaxRaw = finiteNumber(raw.yMax);
  if (xMinRaw == null || yMinRaw == null || xMaxRaw == null || yMaxRaw == null) return null;

  let xMin = clamp01(xMinRaw);
  let yMin = clamp01(yMinRaw);
  let xMax = clamp01(xMaxRaw);
  let yMax = clamp01(yMaxRaw);
  if (xMin > xMax) [xMin, xMax] = [xMax, xMin];
  if (yMin > yMax) [yMin, yMax] = [yMax, yMin];
  if (xMax - xMin < 0.002 || yMax - yMin < 0.002) return null;
  return { xMin, yMin, xMax, yMax };
}
