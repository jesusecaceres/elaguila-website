import type { LayoutPreset, ScalePreset } from "../types";

export function scaleToLogoPercent(scale: ScalePreset): number {
  switch (scale) {
    case "sm":
      return 16;
    case "md":
      return 22;
    case "lg":
    default:
      return 28;
  }
}

export function scaleToTextRem(scale: ScalePreset): number {
  switch (scale) {
    case "sm":
      return 0.55;
    case "md":
      return 0.65;
    case "lg":
    default:
      return 0.78;
  }
}

/**
 * Maps 9-point layout preset to trim-relative logo center (block-mode `logoGeom`).
 * Aligns with the same grid intent as `presetToLogoStyle` for the legacy path.
 */
export function layoutPresetToLogoGeomCenter(preset: LayoutPreset): { xPct: number; yPct: number } {
  const map: Record<LayoutPreset, { xPct: number; yPct: number }> = {
    "top-left": { xPct: 18, yPct: 20 },
    "top-center": { xPct: 50, yPct: 20 },
    "top-right": { xPct: 82, yPct: 20 },
    "center-left": { xPct: 18, yPct: 50 },
    center: { xPct: 50, yPct: 50 },
    "center-right": { xPct: 82, yPct: 50 },
    "bottom-left": { xPct: 18, yPct: 80 },
    "bottom-center": { xPct: 50, yPct: 80 },
    "bottom-right": { xPct: 82, yPct: 80 },
  };
  return map[preset];
}

/** Keep sm/md/lg buttons in sync when the user edits logo width % manually. */
export function widthPctToNearestLogoScale(widthPct: number): ScalePreset {
  const sm = scaleToLogoPercent("sm");
  const md = scaleToLogoPercent("md");
  const lg = scaleToLogoPercent("lg");
  const d = (a: number, b: number) => Math.abs(a - b);
  if (d(widthPct, sm) <= d(widthPct, md) && d(widthPct, sm) <= d(widthPct, lg)) return "sm";
  if (d(widthPct, md) <= d(widthPct, lg)) return "md";
  return "lg";
}
