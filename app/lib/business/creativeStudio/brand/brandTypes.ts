/**
 * Program 6, Gate 6B — Official Leonix brand asset types.
 * Deterministic brand asset classification. No AI-generated substitutes.
 */

export type BrandAssetKind = "FULL_CREST" | "WORDMARK";

export type BrandAssetUsage =
  | "major_branded_pages"
  | "covers"
  | "premium_leonix_moments"
  | "leonix_owned_promotional"
  | "normal_magazine_headers"
  | "sponsored_inserts"
  | "editorial_footers"
  | "routine_attribution";

export interface BrandAssetDefinition {
  readonly kind: BrandAssetKind;
  readonly path: string;
  readonly altText: string;
  readonly preferredUsage: readonly BrandAssetUsage[];
  readonly exists: boolean;
}

export type BrandAssetRegistry = readonly BrandAssetDefinition[];
