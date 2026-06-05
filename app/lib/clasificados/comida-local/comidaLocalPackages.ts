import type { ComidaLocalPackageTierDb } from "./comidaLocalPublishTypes";

export type ComidaLocalPackageTier = ComidaLocalPackageTierDb;

export type ComidaLocalPackageDefinition = {
  tier: ComidaLocalPackageTier;
  label: string;
  priceLabel: string;
  priceCents: number;
  /** Listing duration in days; null until billing/renewal policy is confirmed (L5A noted 60-day TBD). */
  durationDays: number | null;
  maxGalleryImages: number;
  maxSocialLinks: number;
  allowLogo: boolean;
  allowLocationUrl: boolean;
  /** Planned Plus benefit — not active in public ranking until a future gate. */
  featuredPlacement: boolean;
  description: string;
  includedFeatures: readonly string[];
};

export const COMIDA_LOCAL_PACKAGE_TIERS: readonly ComidaLocalPackageTier[] = ["basic", "plus"] as const;

export const COMIDA_LOCAL_BASIC_PACKAGE: ComidaLocalPackageDefinition = {
  tier: "basic",
  label: "Comida Local Basic",
  priceLabel: "$99",
  priceCents: 9900,
  durationDays: null,
  maxGalleryImages: 2,
  maxSocialLinks: 3,
  allowLogo: true,
  allowLocationUrl: true,
  featuredPlacement: false,
  description: "Listado sencillo con foto principal, logo opcional y galería limitada.",
  includedFeatures: [
    "Foto principal",
    "Logo opcional",
    "Hasta 2 fotos en galería",
    "Hasta 3 redes sociales",
    "Enlace de ubicación",
  ],
};

export const COMIDA_LOCAL_PLUS_PACKAGE: ComidaLocalPackageDefinition = {
  tier: "plus",
  label: "Comida Local Plus",
  priceLabel: "$149",
  priceCents: 14900,
  durationDays: null,
  maxGalleryImages: 5,
  maxSocialLinks: 3,
  allowLogo: true,
  allowLocationUrl: true,
  featuredPlacement: false,
  description: "Listado más completo con más galería; destacado planificado para un gate futuro.",
  includedFeatures: [
    "Foto principal",
    "Logo opcional",
    "Hasta 5 fotos en galería",
    "Hasta 3 redes sociales",
    "Enlace de ubicación",
    "Destacado (planificado)",
  ],
};

const PACKAGE_BY_TIER: Record<ComidaLocalPackageTier, ComidaLocalPackageDefinition> = {
  basic: COMIDA_LOCAL_BASIC_PACKAGE,
  plus: COMIDA_LOCAL_PLUS_PACKAGE,
};

const TIER_ALIASES: Record<string, ComidaLocalPackageTier> = {
  basic: "basic",
  plus: "plus",
  comida_local_basic: "basic",
  comida_local_plus: "plus",
  "comida-local-basic": "basic",
  "comida-local-plus": "plus",
};

export function normalizeComidaLocalPackageTierKey(raw: unknown): ComidaLocalPackageTier {
  const key = String(raw ?? "").trim().toLowerCase();
  return TIER_ALIASES[key] ?? "basic";
}

export function isValidComidaLocalPackageTier(raw: unknown): raw is ComidaLocalPackageTier {
  const key = String(raw ?? "").trim().toLowerCase();
  return key in TIER_ALIASES || key === "basic" || key === "plus";
}

export function getComidaLocalPackageByTier(
  tier: ComidaLocalPackageTier | string | null | undefined
): ComidaLocalPackageDefinition {
  const normalized = normalizeComidaLocalPackageTierKey(tier);
  return PACKAGE_BY_TIER[normalized];
}

export function getComidaLocalPackageLabel(
  tier: ComidaLocalPackageTier | string | null | undefined,
  lang: "es" | "en" = "es"
): string {
  const pkg = getComidaLocalPackageByTier(tier);
  if (lang === "en") {
    return pkg.tier === "plus" ? "Comida Local Plus" : "Comida Local Basic";
  }
  return pkg.label;
}

export function getComidaLocalPackagePriceLabel(
  tier: ComidaLocalPackageTier | string | null | undefined
): string {
  return getComidaLocalPackageByTier(tier).priceLabel;
}

export type ComidaLocalPackageLimits = Pick<
  ComidaLocalPackageDefinition,
  "maxGalleryImages" | "maxSocialLinks" | "allowLogo" | "allowLocationUrl" | "featuredPlacement"
>;

export function getComidaLocalPackageLimits(
  tier: ComidaLocalPackageTier | string | null | undefined
): ComidaLocalPackageLimits {
  const pkg = getComidaLocalPackageByTier(tier);
  return {
    maxGalleryImages: pkg.maxGalleryImages,
    maxSocialLinks: pkg.maxSocialLinks,
    allowLogo: pkg.allowLogo,
    allowLocationUrl: pkg.allowLocationUrl,
    featuredPlacement: pkg.featuredPlacement,
  };
}

/** Basic-tier gallery cap — default for draft UI before package is chosen. */
export const COMIDA_LOCAL_DEFAULT_GALLERY_MAX = COMIDA_LOCAL_BASIC_PACKAGE.maxGalleryImages;
