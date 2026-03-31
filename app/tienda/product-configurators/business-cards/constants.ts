import type { CanvasBleedPt } from "./types";

/** US standard 3.5" × 2" — trim in points (72 pt/inch) */
export const STANDARD_BUSINESS_CARD_CANVAS: CanvasBleedPt = {
  trimWidthPt: 252,
  trimHeightPt: 144,
  bleedPt: 9,
  safeInsetPt: 12,
};

/** Logo file guardrails (client-side MVP) */
export const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
export const LOGO_MAX_MB = 12;

/**
 * Minimum logo pixel width for ~1" print at 300 DPI proxy (very approximate).
 * Below = soft warning only in MVP.
 */
export const LOGO_MIN_PIXEL_DIM = 360;

export const TEXT_FIELD_MAX: Partial<Record<import("./types").TextFieldRole, number>> = {
  personName: 42,
  title: 64,
  company: 48,
  phone: 24,
  email: 52,
  website: 52,
  address: 120,
  tagline: 90,
};

export const BUILDER_FEATURE_FLAGS = {
  enableBackSide: true,
  enableLivePreview: true,
  enablePdfExport: false,
} as const;
