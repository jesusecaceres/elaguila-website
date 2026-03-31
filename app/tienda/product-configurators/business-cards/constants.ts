import type { CanvasBleedPt } from "./types";

/** US standard 3.5" × 2" + 0.125" bleed (common print spec — adjust with production) */
export const STANDARD_BUSINESS_CARD_CANVAS: CanvasBleedPt = {
  trimWidthPt: 252,
  trimHeightPt: 144,
  bleedPt: 9,
  safeInsetPt: 5.4,
};

export const BUILDER_FEATURE_FLAGS = {
  enableBackSide: true,
  enableLivePreview: false,
  enablePdfExport: false,
} as const;
