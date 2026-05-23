import type { VisibilityRankBucket } from "./printDigitalVisibilityRank";

export type PackageEntitlementTier =
  | "premium"
  | "full_page"
  | "half_page"
  | "quarter_page"
  | "classified_print"
  | "digital_only"
  | "none"
  | "unknown";

export type PackageEntitlementCategory =
  | "servicios"
  | "restaurantes"
  | "autos"
  | "bienes-raices"
  | "rentas"
  | "en-venta"
  | "clases"
  | "comunidad"
  | "empleos"
  | "viajes"
  | string;

export type PackageEntitlementBenefit =
  | "destacados_module"
  | "results_priority"
  | "classified_listing"
  | "republish_access"
  | "boost_access"
  | "auto_refresh_access"
  | "print_advertiser_badge"
  | "verified_review_eligible"
  | "concierge_eligible";

export type PackageEntitlementSummary = {
  category: string;
  tier: PackageEntitlementTier;
  label: string;
  source: string;
  benefits: Record<PackageEntitlementBenefit, boolean>;
  visibilityBucket: VisibilityRankBucket;
  eligibleForDestacadosModule: boolean;
  eligibleForResultsPriority: boolean;
  eligibleForRepublish: boolean;
  eligibleForBoost: boolean;
  requiresMatchingCategoryFirst: boolean;
  durationDays: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean | null;
  warnings: string[];
};

export type PackageEntitlementInput = {
  category?: string | null;
  listing?: Record<string, unknown> | null;
  tier?: PackageEntitlementTier | string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  now?: Date | string | number | null;
};

export const PACKAGE_ENTITLEMENT_V1_CATEGORIES = [
  "servicios",
  "restaurantes",
  "autos",
  "bienes-raices",
  "rentas",
] as const;

const NOT_CLIENT_READY = new Set(["clases", "comunidad"]);
const SEPARATE_MODEL = new Set(["empleos", "viajes"]);
const V1_CATEGORIES = new Set<string>(PACKAGE_ENTITLEMENT_V1_CATEGORIES);

const ALL_BENEFITS: PackageEntitlementBenefit[] = [
  "destacados_module",
  "results_priority",
  "classified_listing",
  "republish_access",
  "boost_access",
  "auto_refresh_access",
  "print_advertiser_badge",
  "verified_review_eligible",
  "concierge_eligible",
];

function emptyBenefits(): Record<PackageEntitlementBenefit, boolean> {
  return Object.fromEntries(ALL_BENEFITS.map((b) => [b, false])) as Record<PackageEntitlementBenefit, boolean>;
}

function withBenefits(
  partial: Partial<Record<PackageEntitlementBenefit, boolean>>,
): Record<PackageEntitlementBenefit, boolean> {
  return { ...emptyBenefits(), ...partial };
}

export function normalizePackageEntitlementTier(value: unknown): PackageEntitlementTier {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "none";

  const token = raw.replace(/[\s-]+/g, "_");

  if (
    token === "premium" ||
    token.includes("cover") ||
    token.includes("back_cover") ||
    token.includes("outside_cover") ||
    token.includes("outside_premium")
  ) {
    return "premium";
  }

  if (token === "full_page" || token === "fullpage" || token === "full" || token.includes("full_page")) {
    return "full_page";
  }

  if (token === "half_page" || token === "halfpage" || token === "half") {
    return "half_page";
  }

  if (token === "quarter_page" || token === "quarterpage" || token === "quarter") {
    return "quarter_page";
  }

  if (token === "classified_print" || token === "classified" || token === "print_classified") {
    return "classified_print";
  }

  if (
    token === "digital_only" ||
    token === "digital" ||
    token.includes("republish") ||
    token.includes("boost") ||
    token.includes("impulsado") ||
    token.includes("refrescado")
  ) {
    return "digital_only";
  }

  if (token === "none" || token === "organic" || token === "free" || token === "standard") {
    return "none";
  }

  if (token === "unknown") return "unknown";

  return "unknown";
}

export type PackageEntitlementTierDefinition = {
  tier: PackageEntitlementTier;
  label: string;
  benefits: Record<PackageEntitlementBenefit, boolean>;
  visibilityBucket: VisibilityRankBucket;
  eligibleForDestacadosModule: boolean;
  eligibleForResultsPriority: boolean;
};

export function getPackageEntitlementBenefits(tier: PackageEntitlementTier): PackageEntitlementTierDefinition {
  switch (tier) {
    case "premium":
      return {
        tier,
        label: "Premium print package",
        benefits: withBenefits({
          destacados_module: true,
          classified_listing: true,
          print_advertiser_badge: true,
          concierge_eligible: true,
          verified_review_eligible: true,
        }),
        visibilityBucket: "premium_destacado_module",
        eligibleForDestacadosModule: true,
        eligibleForResultsPriority: false,
      };
    case "full_page":
      return {
        tier,
        label: "Full-page print package",
        benefits: withBenefits({
          results_priority: true,
          classified_listing: true,
          print_advertiser_badge: true,
          republish_access: true,
          boost_access: true,
          verified_review_eligible: true,
        }),
        visibilityBucket: "full_page_print_priority",
        eligibleForDestacadosModule: false,
        eligibleForResultsPriority: true,
      };
    case "half_page":
      return {
        tier,
        label: "Half-page print package",
        benefits: withBenefits({
          classified_listing: true,
          republish_access: true,
          boost_access: true,
          print_advertiser_badge: true,
        }),
        visibilityBucket: "print_advertiser_pool",
        eligibleForDestacadosModule: false,
        eligibleForResultsPriority: false,
      };
    case "quarter_page":
      return {
        tier,
        label: "Quarter-page print package",
        benefits: withBenefits({
          print_advertiser_badge: true,
          republish_access: true,
        }),
        visibilityBucket: "print_advertiser_pool",
        eligibleForDestacadosModule: false,
        eligibleForResultsPriority: false,
      };
    case "classified_print":
      return {
        tier,
        label: "Classified print package",
        benefits: withBenefits({
          classified_listing: true,
          print_advertiser_badge: true,
        }),
        visibilityBucket: "print_advertiser_pool",
        eligibleForDestacadosModule: false,
        eligibleForResultsPriority: false,
      };
    case "digital_only":
      return {
        tier,
        label: "Digital-only tools",
        benefits: withBenefits({
          republish_access: true,
          boost_access: true,
          auto_refresh_access: true,
        }),
        visibilityBucket: "digital_featured",
        eligibleForDestacadosModule: false,
        eligibleForResultsPriority: false,
      };
    case "none":
      return {
        tier,
        label: "No package entitlement",
        benefits: emptyBenefits(),
        visibilityBucket: "organic",
        eligibleForDestacadosModule: false,
        eligibleForResultsPriority: false,
      };
    case "unknown":
    default:
      return {
        tier: "unknown",
        label: "Unknown package entitlement",
        benefits: emptyBenefits(),
        visibilityBucket: "unknown",
        eligibleForDestacadosModule: false,
        eligibleForResultsPriority: false,
      };
  }
}

function hasOwn(row: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(row, key);
}

function readString(row: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function normalizeCategorySlug(raw: unknown): string {
  const c = String(raw ?? "").trim().toLowerCase();
  if (!c) return "unknown";
  if (c === "en_venta" || c === "for-sale" || c === "for_sale") return "en-venta";
  if (c === "bienes_raices" || c === "real-estate" || c === "real_estate") return "bienes-raices";
  if (c === "empleo") return "empleos";
  if (c === "travel") return "viajes";
  if (c === "autos_paid") return "autos";
  return c;
}

function parseNow(input: PackageEntitlementInput["now"]): Date {
  if (input instanceof Date && Number.isFinite(input.getTime())) return input;
  if (typeof input === "number" && Number.isFinite(input)) return new Date(input);
  if (typeof input === "string" && input.trim()) {
    const d = new Date(input);
    if (Number.isFinite(d.getTime())) return d;
  }
  return new Date();
}

function parseIso(raw: string | null | undefined): Date | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d : null;
}

function durationDaysBetween(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function isPackageEntitlementActive(input: {
  startsAt?: string | null;
  endsAt?: string | null;
  now?: Date | string | number | null;
}): boolean | null {
  const start = parseIso(input.startsAt ?? null);
  const end = parseIso(input.endsAt ?? null);
  if (!start && !end) return null;

  const now = parseNow(input.now ?? null);
  if (start && now.getTime() < start.getTime()) return false;
  if (end && now.getTime() > end.getTime()) return false;
  return true;
}

function readTierFromListing(row: Record<string, unknown>): { tier: PackageEntitlementTier; source: string } {
  const entitlementTier = readString(row, ["package_entitlement_tier", "packageEntitlementTier"]);
  if (entitlementTier) {
    return { tier: normalizePackageEntitlementTier(entitlementTier), source: "package_entitlement_tier" };
  }

  const printTier = readString(row, ["print_package_tier", "printPackageTier", "print_package", "printPackage"]);
  if (printTier) {
    return { tier: normalizePackageEntitlementTier(printTier), source: "print_package_tier" };
  }

  const digitalTier = readString(row, ["digital_visibility_tier", "digitalVisibilityTier"]);
  if (digitalTier) {
    const normalized = normalizePackageEntitlementTier(digitalTier);
    if (normalized !== "none" && normalized !== "unknown") {
      return { tier: normalized === "premium" || normalized === "full_page" ? normalized : "digital_only", source: "digital_visibility_tier" };
    }
  }

  const packageTier = readString(row, ["package_tier", "packageTier"]);
  if (packageTier) {
    const normalized = normalizePackageEntitlementTier(packageTier);
    return {
      tier: normalized,
      source: "package_tier (verify category context; may be non-print vocabulary)",
    };
  }

  return { tier: "none", source: "fallback" };
}

function categoryGateSummary(
  category: string,
  visibilityBucket: VisibilityRankBucket,
  label: string,
  reason: string,
  warnings: string[],
): PackageEntitlementSummary {
  const def = getPackageEntitlementBenefits("none");
  return {
    category,
    tier: "none",
    label,
    source: "category gate",
    benefits: def.benefits,
    visibilityBucket,
    eligibleForDestacadosModule: false,
    eligibleForResultsPriority: false,
    eligibleForRepublish: false,
    eligibleForBoost: false,
    requiresMatchingCategoryFirst: true,
    durationDays: null,
    startsAt: null,
    endsAt: null,
    isActive: null,
    warnings: [...warnings, reason],
  };
}

export function resolvePackageEntitlement(input: PackageEntitlementInput): PackageEntitlementSummary {
  const row = input.listing ? { ...input.listing } : {};
  const warnings: string[] = [];
  const category = normalizeCategorySlug(
    input.category ?? row.category ?? row.category_slug ?? row.listing_category,
  );

  if (category === "en-venta") {
    return categoryGateSummary(
      category,
      "separate_model",
      "En Venta separate model",
      "En Venta uses Free/Pro ideology; Print-to-Digital package entitlements do not apply.",
      warnings,
    );
  }

  if (NOT_CLIENT_READY.has(category)) {
    return categoryGateSummary(
      category,
      "deferred",
      "Deferred category",
      `${category} is not client-ready for package entitlements.`,
      warnings,
    );
  }

  if (SEPARATE_MODEL.has(category)) {
    return categoryGateSummary(
      category,
      "separate_model",
      "Separate category model",
      `${category} uses a separate monetization model outside Print-to-Digital V1 entitlements.`,
      warnings,
    );
  }

  if (!V1_CATEGORIES.has(category)) {
    warnings.push("Category is outside Print-to-Digital V1 entitlement scope.");
  }

  if (category === "rentas") {
    warnings.push(
      "Rentas entitlements should be applied carefully for property managers and business landlords.",
    );
  }

  const codeHint = readString(row, [
    "entitlement_code",
    "entitlementCode",
    "contract_code",
    "contractCode",
    "promo_code",
    "promoCode",
  ]);
  if (codeHint) {
    warnings.push(
      "A promo/entitlement code field was present on the row; codes are discounts or references only until an entitlement record is wired. Package tier must not be inferred from payment alone.",
    );
  }

  let tier: PackageEntitlementTier;
  let source: string;

  if (input.tier != null && String(input.tier).trim()) {
    tier = normalizePackageEntitlementTier(input.tier);
    source = "input tier override";
  } else {
    const fromRow = readTierFromListing(row);
    tier = fromRow.tier;
    source = fromRow.source;
  }

  if (tier === "unknown") {
    warnings.push("Package tier value could not be normalized; treat as unknown until Admin entitlement data exists.");
  }

  if (tier === "none" && V1_CATEGORIES.has(category)) {
    warnings.push("No package entitlement tier was found on this listing; organic/basic access is assumed.");
  }

  const def = getPackageEntitlementBenefits(tier);

  const startsAt =
    input.startsAt ??
    readString(row, ["starts_at", "startsAt", "entitlement_starts_at", "entitlementStartsAt"]) ??
    null;
  const endsAt =
    input.endsAt ??
    readString(row, ["ends_at", "endsAt", "entitlement_ends_at", "entitlementEndsAt"]) ??
    readString(row, ["sponsored_until", "sponsoredUntil", "featured_until", "featuredUntil"]) ??
    null;

  const startDate = parseIso(startsAt);
  const endDate = parseIso(endsAt);
  const isActive = isPackageEntitlementActive({ startsAt, endsAt, now: input.now });
  const durationDays = durationDaysBetween(startDate, endDate);

  if (endsAt && isActive === false) {
    warnings.push("Entitlement end date is in the past; visibility benefits should not be treated as active.");
  }
  if (startsAt && isActive === false && startDate && parseNow(input.now).getTime() < startDate.getTime()) {
    warnings.push("Entitlement start date is in the future; benefits are not active yet.");
  }
  if (tier !== "none" && !startsAt && !endsAt) {
    warnings.push("No entitlement start/end dates were present; contract duration is unknown until schema is added.");
  }

  if (
    hasOwn(row, "stripe_checkout_session_id") ||
    hasOwn(row, "stripe_payment_intent_id") ||
    hasOwn(row, "payment_status")
  ) {
    warnings.push("Payment/Stripe fields may exist on the row but must not be used as package entitlement truth.");
  }

  return {
    category,
    tier,
    label: def.label,
    source,
    benefits: { ...def.benefits },
    visibilityBucket: def.visibilityBucket,
    eligibleForDestacadosModule: def.eligibleForDestacadosModule,
    eligibleForResultsPriority: def.eligibleForResultsPriority,
    eligibleForRepublish: def.benefits.republish_access,
    eligibleForBoost: def.benefits.boost_access,
    requiresMatchingCategoryFirst: true,
    durationDays,
    startsAt,
    endsAt,
    isActive,
    warnings,
  };
}
