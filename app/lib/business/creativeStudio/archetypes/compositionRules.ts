/**
 * Program 6, Gate 6F — Composition zone system.
 * Structured zones for AI/staff to place content. Never "put an image somewhere."
 */
import type { ContentSlotKey } from "./types";
import type { PrintFormatKey } from "../printSpecs";
import type { CreativeArchetypeKey } from "./types";

export interface CreativeCompositionZone {
  key: string;
  role: ContentSlotKey;
  required: boolean;
  priority: number;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  minTextPt?: number;
  maxCharacters?: number;
  imageFit?: "cover" | "contain";
  allowOverlap: false;
}

export type LayoutVariant = "A" | "B" | "C";

export interface CompositionPlan {
  readonly format: PrintFormatKey;
  readonly archetype: CreativeArchetypeKey;
  readonly layoutVariant: LayoutVariant;
  readonly zones: readonly CreativeCompositionZone[];
}

// ─── Layout variant builders ──────────────────────────────────────────────

function zone(
  key: string,
  role: ContentSlotKey,
  required: boolean,
  priority: number,
  xPct: number,
  yPct: number,
  widthPct: number,
  heightPct: number,
  extra?: Partial<Omit<CreativeCompositionZone, "key" | "role" | "required" | "priority" | "xPct" | "yPct" | "widthPct" | "heightPct" | "allowOverlap">>,
): CreativeCompositionZone {
  return { key, role, required, priority, xPct, yPct, widthPct, heightPct, allowOverlap: false, ...extra };
}

// AUTHORITY_TRADITIONAL_UPGRADED layouts

function authorityFullPageA(): readonly CreativeCompositionZone[] {
  return [
    zone("logo", "logo", true, 1, 5, 3, 25, 10),
    zone("headline", "headline", true, 2, 35, 3, 60, 12, { minTextPt: 22, maxCharacters: 80 }),
    zone("portrait", "portrait", false, 3, 5, 18, 30, 30, { imageFit: "cover" }),
    zone("subheadline", "subheadline", false, 4, 38, 18, 57, 8, { minTextPt: 14, maxCharacters: 120 }),
    zone("services", "services", true, 5, 5, 52, 55, 25, { minTextPt: 9.5, maxCharacters: 300 }),
    zone("trust", "trust", false, 6, 62, 52, 33, 20, { minTextPt: 9.5, maxCharacters: 200 }),
    zone("cta", "cta", true, 7, 5, 82, 40, 10, { minTextPt: 10, maxCharacters: 60 }),
    zone("contact", "contact", true, 8, 50, 82, 25, 10, { minTextPt: 10, maxCharacters: 100 }),
    zone("qr", "qr", true, 9, 78, 82, 15, 15),
    zone("disclaimer", "disclaimer", false, 10, 5, 95, 90, 4, { minTextPt: 7.5, maxCharacters: 300 }),
  ];
}

function authorityFullPageB(): readonly CreativeCompositionZone[] {
  return [
    zone("headline", "headline", true, 1, 5, 3, 90, 15, { minTextPt: 22, maxCharacters: 80 }),
    zone("logo", "logo", true, 2, 5, 20, 20, 8),
    zone("portrait", "portrait", false, 3, 30, 20, 35, 35, { imageFit: "cover" }),
    zone("services", "services", true, 4, 5, 60, 50, 25, { minTextPt: 9.5, maxCharacters: 300 }),
    zone("cta", "cta", true, 5, 60, 60, 35, 12, { minTextPt: 10, maxCharacters: 60 }),
    zone("contact", "contact", true, 6, 5, 88, 40, 8, { minTextPt: 10, maxCharacters: 100 }),
    zone("qr", "qr", true, 7, 78, 85, 15, 15),
    zone("disclaimer", "disclaimer", false, 8, 5, 95, 90, 4, { minTextPt: 7.5, maxCharacters: 300 }),
  ];
}

function authorityQuarterA(): readonly CreativeCompositionZone[] {
  return [
    zone("logo", "logo", true, 1, 5, 3, 30, 12),
    zone("headline", "headline", true, 2, 40, 3, 55, 15, { minTextPt: 22, maxCharacters: 50 }),
    zone("services", "services", true, 3, 5, 20, 90, 35, { minTextPt: 9.5, maxCharacters: 150 }),
    zone("cta", "cta", true, 4, 5, 60, 50, 12, { minTextPt: 10, maxCharacters: 40 }),
    zone("contact", "contact", true, 5, 60, 60, 35, 12, { minTextPt: 10, maxCharacters: 60 }),
    zone("qr", "qr", true, 6, 75, 75, 20, 20),
  ];
}

// PREMIUM_PHOTO_HERO layouts

function premiumHeroFullPageA(): readonly CreativeCompositionZone[] {
  return [
    zone("hero_image", "hero_image", true, 1, 0, 0, 100, 55, { imageFit: "cover" }),
    zone("headline", "headline", true, 2, 5, 58, 90, 12, { minTextPt: 22, maxCharacters: 80 }),
    zone("subheadline", "subheadline", false, 3, 5, 72, 60, 8, { minTextPt: 14, maxCharacters: 120 }),
    zone("benefits", "benefits", false, 4, 5, 82, 50, 10, { minTextPt: 9.5, maxCharacters: 200 }),
    zone("cta", "cta", true, 5, 60, 82, 20, 10, { minTextPt: 10, maxCharacters: 60 }),
    zone("qr", "qr", true, 6, 82, 80, 13, 13),
    zone("contact", "contact", true, 7, 5, 93, 50, 5, { minTextPt: 10, maxCharacters: 100 }),
    zone("disclaimer", "disclaimer", false, 8, 55, 93, 40, 5, { minTextPt: 7.5, maxCharacters: 200 }),
  ];
}

function premiumHeroFullPageB(): readonly CreativeCompositionZone[] {
  return [
    zone("hero_image", "hero_image", true, 1, 0, 0, 60, 100, { imageFit: "cover" }),
    zone("headline", "headline", true, 2, 65, 10, 30, 20, { minTextPt: 22, maxCharacters: 60 }),
    zone("subheadline", "subheadline", false, 3, 65, 32, 30, 12, { minTextPt: 14, maxCharacters: 100 }),
    zone("benefits", "benefits", false, 4, 65, 48, 30, 20, { minTextPt: 9.5, maxCharacters: 180 }),
    zone("cta", "cta", true, 5, 65, 72, 30, 10, { minTextPt: 10, maxCharacters: 50 }),
    zone("qr", "qr", true, 6, 65, 85, 15, 12),
    zone("contact", "contact", true, 7, 65, 93, 30, 5, { minTextPt: 10, maxCharacters: 80 }),
  ];
}

// SPONSORED_EDITORIAL layouts

function sponsoredEditorialFullPageA(): readonly CreativeCompositionZone[] {
  return [
    zone("leonix_brand", "leonix_brand", true, 1, 5, 3, 30, 6),
    zone("headline", "headline", true, 2, 5, 12, 90, 10, { minTextPt: 22, maxCharacters: 80 }),
    zone("subheadline", "subheadline", false, 3, 5, 24, 90, 6, { minTextPt: 14, maxCharacters: 150 }),
    zone("content_block_1", "benefits", true, 4, 5, 33, 42, 12, { minTextPt: 9.5, maxCharacters: 200 }),
    zone("content_block_2", "services", true, 5, 53, 33, 42, 12, { minTextPt: 9.5, maxCharacters: 200 }),
    zone("content_block_3", "trust", true, 6, 5, 48, 42, 12, { minTextPt: 9.5, maxCharacters: 200 }),
    zone("content_block_4", "offer", true, 7, 53, 48, 42, 12, { minTextPt: 9.5, maxCharacters: 200 }),
    zone("content_block_5", "cta", true, 8, 5, 63, 90, 10, { minTextPt: 9.5, maxCharacters: 250 }),
    zone("sponsor", "sponsor", true, 9, 5, 76, 90, 10, { minTextPt: 9.5, maxCharacters: 200 }),
    zone("disclaimer", "disclaimer", true, 10, 5, 88, 90, 5, { minTextPt: 7.5, maxCharacters: 300 }),
    zone("qr", "qr", true, 11, 80, 88, 12, 10),
    zone("page_number", "page_number", true, 12, 90, 95, 8, 4, { minTextPt: 7.5 }),
  ];
}

// OFFER_PROMO_BLAST layouts

function offerPromoQuarterA(): readonly CreativeCompositionZone[] {
  return [
    zone("offer", "offer", true, 1, 5, 5, 90, 30, { minTextPt: 22, maxCharacters: 60 }),
    zone("headline", "headline", true, 2, 5, 38, 90, 12, { minTextPt: 22, maxCharacters: 50 }),
    zone("benefits", "benefits", false, 3, 5, 53, 90, 20, { minTextPt: 9.5, maxCharacters: 120 }),
    zone("cta", "cta", true, 4, 5, 75, 50, 12, { minTextPt: 10, maxCharacters: 40 }),
    zone("qr", "qr", true, 5, 65, 75, 20, 20),
    zone("disclaimer", "disclaimer", true, 6, 5, 93, 90, 5, { minTextPt: 7.5, maxCharacters: 150 }),
  ];
}

// ─── Composition plan resolver ────────────────────────────────────────────

const COMPOSITION_PLANS: Record<string, readonly CreativeCompositionZone[]> = {
  "AUTHORITY_TRADITIONAL_UPGRADED+FULL_PAGE+A": authorityFullPageA(),
  "AUTHORITY_TRADITIONAL_UPGRADED+FULL_PAGE+B": authorityFullPageB(),
  "AUTHORITY_TRADITIONAL_UPGRADED+QUARTER+A": authorityQuarterA(),
  "PREMIUM_PHOTO_HERO+FULL_PAGE+A": premiumHeroFullPageA(),
  "PREMIUM_PHOTO_HERO+FULL_PAGE+B": premiumHeroFullPageB(),
  "PREMIUM_PHOTO_HERO+FULL_BLEED+A": premiumHeroFullPageA(),
  "PREMIUM_PHOTO_HERO+FULL_BLEED+B": premiumHeroFullPageB(),
  "SPONSORED_EDITORIAL+FULL_PAGE+A": sponsoredEditorialFullPageA(),
  "OFFER_PROMO_BLAST+QUARTER+A": offerPromoQuarterA(),
};

export function getCompositionPlan(
  archetype: CreativeArchetypeKey,
  format: PrintFormatKey,
  variant: LayoutVariant,
): CompositionPlan {
  const key = `${archetype}+${format}+${variant}`;
  const zones = COMPOSITION_PLANS[key];
  if (zones) {
    return { format, archetype, layoutVariant: variant, zones };
  }
  // Fallback: generate a basic plan from archetype required/optional slots
  return generateFallbackPlan(archetype, format, variant);
}

function generateFallbackPlan(
  archetype: CreativeArchetypeKey,
  format: PrintFormatKey,
  variant: LayoutVariant,
): CompositionPlan {
  // Minimal fallback with just required slots stacked vertically
  const key = `${archetype}+${format}+A`;
  const zones = COMPOSITION_PLANS[key];
  if (zones) {
    return { format, archetype, layoutVariant: variant, zones };
  }
  // Ultimate fallback: empty plan (will be caught by preflight)
  return { format, archetype, layoutVariant: variant, zones: [] };
}

export function getAvailableLayoutVariants(
  archetype: CreativeArchetypeKey,
  format: PrintFormatKey,
): readonly LayoutVariant[] {
  const variants: LayoutVariant[] = [];
  for (const v of ["A", "B", "C"] as LayoutVariant[]) {
    const key = `${archetype}+${format}+${v}`;
    if (COMPOSITION_PLANS[key]) variants.push(v);
  }
  return variants.length > 0 ? variants : ["A"];
}
