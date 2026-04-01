/**
 * Trim-relative % bounds for studio-native objects (inspector + reducer safety).
 * Positions are center-based in the preview (translate -50% -50%).
 */

export const NATIVE_CENTER_MIN_PCT = 5;
export const NATIVE_CENTER_MAX_PCT = 95;

export const NATIVE_SIZE_MIN_PCT = 5;
export const NATIVE_SIZE_MAX_PCT = 90;

export const NATIVE_ROTATION_MIN = -180;
export const NATIVE_ROTATION_MAX = 180;

export function clampNativeCenterPct(v: number): number {
  if (!Number.isFinite(v)) return NATIVE_CENTER_MIN_PCT;
  return Math.min(NATIVE_CENTER_MAX_PCT, Math.max(NATIVE_CENTER_MIN_PCT, v));
}

export function clampNativeSizePct(v: number): number {
  if (!Number.isFinite(v)) return NATIVE_SIZE_MIN_PCT;
  return Math.min(NATIVE_SIZE_MAX_PCT, Math.max(NATIVE_SIZE_MIN_PCT, v));
}

export function clampNativeRotationDeg(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(NATIVE_ROTATION_MAX, Math.max(NATIVE_ROTATION_MIN, v));
}

export function clampNativeFillOpacity(v: number): number {
  if (!Number.isFinite(v)) return 1;
  return Math.min(1, Math.max(0, v));
}

export function clampNativeStrokeWidthPx(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(24, Math.max(0, v));
}
