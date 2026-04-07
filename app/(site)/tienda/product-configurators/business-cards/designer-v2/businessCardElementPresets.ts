import type { BusinessCardDesignerV2NativeShape } from "../types";

export type BusinessCardElementPresetId =
  | "divider-h"
  | "divider-v"
  | "accent-bar"
  | "corner-tick"
  | "badge-pill"
  | "gold-frame";

/**
 * Curated decorative shapes for Studio — all `native-shape` rects/ellipses (no new render path).
 */
export function createLibraryShape(
  id: string,
  zIndex: number,
  preset: BusinessCardElementPresetId
): BusinessCardDesignerV2NativeShape {
  const common = {
    id,
    kind: "native-shape" as const,
    visible: true,
    locked: false,
    zIndex,
    rotationDeg: 0,
  };

  switch (preset) {
    case "divider-h":
      return {
        ...common,
        shape: "rect",
        xPct: 50,
        yPct: 78,
        widthPct: 78,
        heightPct: 6,
        fill: "#c9a84a",
        fillOpacity: 0.55,
        strokeWidthPx: 0,
      };
    case "divider-v":
      return {
        ...common,
        shape: "rect",
        xPct: 50,
        yPct: 50,
        widthPct: 6,
        heightPct: 42,
        fill: "#c9a84a",
        fillOpacity: 0.35,
        strokeWidthPx: 0,
      };
    case "accent-bar":
      return {
        ...common,
        shape: "rect",
        xPct: 50,
        yPct: 14,
        widthPct: 88,
        heightPct: 8,
        fill: "#c9a84a",
        fillOpacity: 0.22,
        strokeWidthPx: 0,
      };
    case "corner-tick":
      return {
        ...common,
        shape: "rect",
        xPct: 14,
        yPct: 16,
        widthPct: 14,
        heightPct: 14,
        fill: "#c9a84a",
        fillOpacity: 0.5,
        strokeWidthPx: 0,
      };
    case "badge-pill":
      return {
        ...common,
        shape: "ellipse",
        xPct: 50,
        yPct: 28,
        widthPct: 36,
        heightPct: 14,
        fill: "#c9a84a",
        fillOpacity: 0.28,
        strokeWidthPx: 0,
      };
    case "gold-frame":
      return {
        ...common,
        shape: "rect",
        xPct: 50,
        yPct: 50,
        widthPct: 88,
        heightPct: 78,
        fill: "#000000",
        fillOpacity: 0,
        strokeColor: "#c9a84a",
        strokeWidthPx: 2,
      };
  }
}
