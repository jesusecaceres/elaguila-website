import type { BusinessCardDesignerV2NativeShape } from "../../types";

const DEFAULT_STROKE = "#c9a84a";

/**
 * When stroke width is positive, ensure a stroke color exists so the canvas always reflects the control.
 */
export function withStrokeColorIfWidthActive(
  shape: BusinessCardDesignerV2NativeShape,
  patch: Partial<BusinessCardDesignerV2NativeShape>
): Partial<BusinessCardDesignerV2NativeShape> {
  const nextW = patch.strokeWidthPx ?? shape.strokeWidthPx ?? 0;
  if (nextW <= 0) return patch;
  const nextColor = patch.strokeColor !== undefined ? patch.strokeColor : shape.strokeColor;
  if (nextColor?.trim()) return patch;
  const fill = shape.fill?.trim() ?? "";
  const fromFill = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(fill) ? fill : DEFAULT_STROKE;
  return { ...patch, strokeColor: fromFill };
}
