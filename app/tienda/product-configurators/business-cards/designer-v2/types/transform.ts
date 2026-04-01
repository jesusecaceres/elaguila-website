/**
 * Trim-relative transforms (0–100 in the card trim box).
 * Future editor tools will edit these; export/preview may map to CSS.
 */
export type DesignerV2Transform = {
  /** Horizontal center of the object in trim coordinates, 0–100 */
  xPct: number;
  /** Vertical center of the object in trim coordinates, 0–100 */
  yPct: number;
  widthPct: number;
  /** Optional explicit height; omit for auto-sized text */
  heightPct?: number;
  /** Clockwise degrees; 0 = upright */
  rotationDeg: number;
};
