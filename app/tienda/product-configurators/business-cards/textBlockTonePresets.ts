import type { BusinessCardTextBlock } from "./types";

/** Deterministic hierarchy presets — shared by toolbar and inspector. */
export const TEXT_BLOCK_TONE_PATCH: Record<
  "headline" | "support" | "caption",
  Pick<BusinessCardTextBlock, "fontWeight" | "lineHeight" | "letterSpacingEm" | "textTransform" | "textTone">
> = {
  headline: {
    textTone: "headline",
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacingEm: 0.015,
    textTransform: "none",
  },
  support: {
    textTone: "support",
    fontWeight: 500,
    lineHeight: 1.45,
    letterSpacingEm: 0,
    textTransform: "none",
  },
  caption: {
    textTone: "caption",
    fontWeight: 500,
    lineHeight: 1.3,
    letterSpacingEm: 0.04,
    textTransform: "uppercase",
  },
};
