import { clampPreviewDragPct } from "./businessCardPreviewConstants";

/** How close (in trim %) a value must be to snap — not too sticky */
export const BUSINESS_CARD_SNAP_THRESHOLD_PCT = 1.15;

/** Trim drag bounds (matches `clampPreviewDragPct` defaults). */
export const TRIM_DRAG_MIN_PCT = 8;
export const TRIM_DRAG_MAX_PCT = 92;

export type SnapGuideState = {
  /** Vertical line at this x% from left (0–100) */
  vertical: number | null;
  /** Horizontal line at this y% from top */
  horizontal: number | null;
};

/**
 * Snap center-based x/y (in trim %) to center, trim edges, and optional safe-area guides.
 * Safe inner lines (12 / 88) only when print guides are visible — matches dashed “safe” box intent.
 */
export function snapTrimPosition(
  xPct: number,
  yPct: number,
  opts: { guidesVisible: boolean }
): { xPct: number; yPct: number; guides: SnapGuideState } {
  const cx = clampPreviewDragPct(xPct);
  const cy = clampPreviewDragPct(yPct);

  const edgeTargets = [TRIM_DRAG_MIN_PCT, TRIM_DRAG_MAX_PCT];
  const centerTargets = [50];
  const safeTargets = opts.guidesVisible ? [12, 88] : [];

  const xPool = [...new Set([...edgeTargets, ...centerTargets, ...safeTargets])].sort((a, b) => a - b);
  const yPool = [...new Set([...edgeTargets, ...centerTargets, ...safeTargets])].sort((a, b) => a - b);

  const sx = snapToNearest(cx, xPool, BUSINESS_CARD_SNAP_THRESHOLD_PCT);
  const sy = snapToNearest(cy, yPool, BUSINESS_CARD_SNAP_THRESHOLD_PCT);

  return {
    xPct: sx.value,
    yPct: sy.value,
    guides: {
      vertical: sx.snappedTo,
      horizontal: sy.snappedTo,
    },
  };
}

function snapToNearest(
  v: number,
  targets: number[],
  threshold: number
): { value: number; snappedTo: number | null } {
  let best: number | null = null;
  let bestD = threshold + 1;
  for (const t of targets) {
    const d = Math.abs(v - t);
    if (d < bestD && d <= threshold) {
      bestD = d;
      best = t;
    }
  }
  if (best == null) return { value: v, snappedTo: null };
  return { value: best, snappedTo: best };
}

/** Snap only X or only Y (e.g. resize patch) */
export function snapAxis(v: number, guidesVisible: boolean): { value: number; guide: number | null } {
  const clamped = clampPreviewDragPct(v);
  const edgeTargets = [TRIM_DRAG_MIN_PCT, TRIM_DRAG_MAX_PCT];
  const centerTargets = [50];
  const safeTargets = guidesVisible ? [12, 88] : [];
  const pool = [...new Set([...edgeTargets, ...centerTargets, ...safeTargets])];
  const r = snapToNearest(clamped, pool, BUSINESS_CARD_SNAP_THRESHOLD_PCT);
  return { value: r.value, guide: r.snappedTo };
}
