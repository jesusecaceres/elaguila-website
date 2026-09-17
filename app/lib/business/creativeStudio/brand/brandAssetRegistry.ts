/**
 * Program 6, Gate 6B — Official Leonix brand asset registry.
 * LOCKED: Only these two official assets may be used for Leonix branding.
 * Do NOT recreate, redraw, AI-generate substitutes, recolor, or distort.
 */
import type { BrandAssetDefinition, BrandAssetRegistry } from "./brandTypes";

export const LEONIX_FULL_CREST: BrandAssetDefinition = {
  kind: "FULL_CREST",
  path: "/logo-clean.png",
  altText: "Leonix Media — Que Ruja el León",
  preferredUsage: [
    "major_branded_pages",
    "covers",
    "premium_leonix_moments",
    "leonix_owned_promotional",
  ],
  exists: true,
};

export const LEONIX_WORDMARK: BrandAssetDefinition = {
  kind: "WORDMARK",
  path: "/title_banner_leonix.png",
  altText: "LEONIX MEDIA — Que Ruja el León — Let the Lion Roar",
  preferredUsage: [
    "normal_magazine_headers",
    "sponsored_inserts",
    "editorial_footers",
    "routine_attribution",
  ],
  exists: true,
};

export const BRAND_ASSET_REGISTRY: BrandAssetRegistry = [
  LEONIX_FULL_CREST,
  LEONIX_WORDMARK,
];

export function getBrandAssetByKind(kind: BrandAssetDefinition["kind"]): BrandAssetDefinition | null {
  return BRAND_ASSET_REGISTRY.find((a) => a.kind === kind) ?? null;
}

export function getAllBrandAssets(): BrandAssetRegistry {
  return BRAND_ASSET_REGISTRY;
}
