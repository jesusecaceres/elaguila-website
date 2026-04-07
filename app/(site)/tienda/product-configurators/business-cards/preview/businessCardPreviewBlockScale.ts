import type { ScalePreset } from "../types";
import { scaleToTextRem } from "../layoutPresets";

/**
 * Block mode: `groupScale` scales all line font sizes relative to template baseline (`md`).
 * Legacy path uses `scaleToTextRem` directly on the stack.
 */
export function blockModeTextScaleMultiplierFromGroupScale(groupScale: ScalePreset): number {
  return scaleToTextRem(groupScale) / scaleToTextRem("md");
}
