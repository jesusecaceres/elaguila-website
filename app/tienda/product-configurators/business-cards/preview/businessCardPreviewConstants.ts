/** Ignore sub-pixel jitter only — small threshold so drags feel responsive */
export const BUSINESS_CARD_PREVIEW_DRAG_THRESHOLD = 0.04;

/** Clamp pointer-derived % inside trim during drag (preview interaction). */
export function clampPreviewDragPct(v: number, min = 8, max = 92): number {
  return Math.min(max, Math.max(min, v));
}
