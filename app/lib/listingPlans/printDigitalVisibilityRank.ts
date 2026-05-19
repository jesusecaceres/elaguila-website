import type { CategoryListingMonetizationSummary } from "./categoryListingMonetization";

export type PrintDigitalVisibilityCategory =
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

export type VisibilityRankBucket =
  | "premium_destacado_module"
  | "full_page_print_priority"
  | "print_advertiser_pool"
  | "digital_featured"
  | "republished"
  | "organic"
  | "separate_model"
  | "deferred"
  | "unknown";

export type VisibilityRankSummary = {
  category: string;
  bucket: VisibilityRankBucket;
  rankWeight: number;
  label: string;
  reason: string;
  source: string;
  eligibleForResultsPriority: boolean;
  eligibleForDestacadosModule: boolean;
  searchFilterMustMatchFirst: boolean;
  warnings: string[];
};

export type ListingVisibilityRankInput = {
  category?: string | null;
  listing?: Record<string, unknown> | null;
  monetization?: CategoryListingMonetizationSummary | null;
  now?: Date | string | number | null;
};

export const VISIBILITY_RANK_WEIGHTS: Record<VisibilityRankBucket, number> = {
  premium_destacado_module: 600,
  full_page_print_priority: 500,
  print_advertiser_pool: 400,
  digital_featured: 300,
  republished: 200,
  organic: 100,
  separate_model: 50,
  deferred: 25,
  unknown: 0,
};

export const PRINT_DIGITAL_V1_CATEGORIES = [
  "servicios",
  "restaurantes",
  "autos",
  "bienes-raices",
  "rentas",
] as const;

const NOT_CLIENT_READY = new Set(["clases", "comunidad"]);
const SEPARATE_MODEL = new Set(["empleos", "viajes"]);
const V1_CATEGORIES = new Set<string>(PRINT_DIGITAL_V1_CATEGORIES);

const EXPLICIT_BUCKET_ALIASES: Record<string, VisibilityRankBucket> = {
  premium_destacado_module: "premium_destacado_module",
  premium: "premium_destacado_module",
  destacado_module: "premium_destacado_module",
  full_page_print_priority: "full_page_print_priority",
  full_page: "full_page_print_priority",
  print_advertiser_pool: "print_advertiser_pool",
  print_pool: "print_advertiser_pool",
  digital_featured: "digital_featured",
  featured: "digital_featured",
  republished: "republished",
  republish: "republished",
  organic: "organic",
  separate_model: "separate_model",
  deferred: "deferred",
  unknown: "unknown",
};

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

function readNumber(row: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function readBoolean(row: Record<string, unknown>, keys: readonly string[]): boolean | null {
  for (const key of keys) {
    if (!hasOwn(row, key)) continue;
    const value = row[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "y"].includes(normalized)) return true;
      if (["false", "0", "no", "n"].includes(normalized)) return false;
    }
  }
  return null;
}

function hasAnyField(row: Record<string, unknown>, keys: readonly string[]): boolean {
  return keys.some((key) => hasOwn(row, key));
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

function normalizeToken(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function parseNow(input: ListingVisibilityRankInput["now"]): Date {
  if (input instanceof Date && Number.isFinite(input.getTime())) return input;
  if (typeof input === "number" && Number.isFinite(input)) return new Date(input);
  if (typeof input === "string" && input.trim()) {
    const d = new Date(input);
    if (Number.isFinite(d.getTime())) return d;
  }
  return new Date();
}

function isExpired(raw: string | null, now: Date): boolean {
  if (!raw) return false;
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return false;
  return d.getTime() < now.getTime();
}

function normalizeExplicitBucket(raw: string | null): VisibilityRankBucket | null {
  if (!raw) return null;
  const token = normalizeToken(raw);
  return EXPLICIT_BUCKET_ALIASES[token] ?? null;
}

type PrintPackageKind = "premium" | "full_page" | "print_pool";

function classifyPrintPackage(raw: string | null): PrintPackageKind | null {
  if (!raw) return null;
  const token = normalizeToken(raw);

  if (
    token.includes("premium") ||
    token.includes("cover") ||
    token.includes("back_cover") ||
    token.includes("outside_cover") ||
    token.includes("outside_premium")
  ) {
    return "premium";
  }

  if (
    token.includes("full_page") ||
    token.includes("fullpage") ||
    (token.includes("full") && token.includes("page"))
  ) {
    return "full_page";
  }

  if (
    token.includes("half_page") ||
    token.includes("halfpage") ||
    token.includes("quarter_page") ||
    token.includes("quarterpage") ||
    token.includes("classified") ||
    token === "print" ||
    token.includes("classified_print")
  ) {
    return "print_pool";
  }

  return null;
}

function isDigitalFeaturedTier(raw: string | null): boolean {
  if (!raw) return false;
  const token = normalizeToken(raw);
  return (
    token.includes("featured") ||
    token.includes("destacado") ||
    token.includes("sponsored") ||
    token.includes("patrocinado") ||
    token.includes("spotlight")
  );
}

function hasRepublishSignal(row: Record<string, unknown>, monetization?: CategoryListingMonetizationSummary | null): boolean {
  if (
    hasAnyField(row, ["republished_at", "republish_sort_at", "republish_count", "republishedAt", "republishSortAt", "republishCount"])
  ) {
    const count = readNumber(row, ["republish_count", "republishCount"]);
    const at = readString(row, ["republished_at", "republish_sort_at", "republishedAt", "republishSortAt"]);
    if (at) return true;
    if (count != null && count > 0) return true;
  }
  const republishTool = monetization?.tools.republish;
  if (republishTool?.status === "available") return true;
  if (monetization?.metadata.republishedAt) return true;
  if (monetization?.metadata.republishCount != null && monetization.metadata.republishCount > 0) return true;
  return false;
}

function hasFeaturedSpotlight(row: Record<string, unknown>): boolean {
  const promoted = readBoolean(row, ["promoted", "admin_promoted", "adminPromoted"]);
  const featured = readBoolean(row, ["featured", "destacado"]);
  if (promoted === true || featured === true) return true;
  return isDigitalFeaturedTier(readString(row, ["digital_visibility_tier", "digitalVisibilityTier"]));
}

function summaryFromBucket(
  category: string,
  bucket: VisibilityRankBucket,
  label: string,
  reason: string,
  source: string,
  warnings: string[],
): VisibilityRankSummary {
  return {
    category,
    bucket,
    rankWeight: VISIBILITY_RANK_WEIGHTS[bucket],
    label,
    reason,
    source,
    eligibleForResultsPriority: bucket === "full_page_print_priority",
    eligibleForDestacadosModule: bucket === "premium_destacado_module",
    searchFilterMustMatchFirst: true,
    warnings,
  };
}

export function resolveListingVisibilityRank(input: ListingVisibilityRankInput): VisibilityRankSummary {
  const row = input.listing ? { ...input.listing } : {};
  const warnings: string[] = [];
  const now = parseNow(input.now);
  const category = normalizeCategorySlug(
    input.category ?? row.category ?? row.category_slug ?? row.listing_category,
  );

  if (category === "en-venta") {
    warnings.push("En Venta uses separate Free/Pro ideology and does not inherit the Print-to-Digital ladder.");
    return summaryFromBucket(
      category,
      "separate_model",
      "En Venta separate model",
      "En Venta Free/Pro is category-specific and out of Print-to-Digital V1.",
      "category gate",
      warnings,
    );
  }

  if (NOT_CLIENT_READY.has(category)) {
    warnings.push(`${category} is not client-ready for paid listing visibility ranking.`);
    return summaryFromBucket(
      category,
      "deferred",
      "Deferred category",
      "Clases/Comunidad are not client-ready for Print-to-Digital ranking.",
      "category gate",
      warnings,
    );
  }

  if (SEPARATE_MODEL.has(category)) {
    warnings.push(`${category} uses a separate monetization model and is deferred from Print-to-Digital V1.`);
    return summaryFromBucket(
      category,
      "separate_model",
      "Separate category model",
      "Empleos/Viajes are not ranked by the Print-to-Digital helper in V1.",
      "category gate",
      warnings,
    );
  }

  if (!V1_CATEGORIES.has(category)) {
    warnings.push("Unknown category for Print-to-Digital V1; returning unknown bucket instead of inferring from account data.");
    return summaryFromBucket(
      category,
      "unknown",
      "Unknown category",
      "Category is outside documented V1 Print-to-Digital scope.",
      "category gate",
      warnings,
    );
  }

  if (category === "rentas") {
    warnings.push(
      "Rentas print-to-digital visibility should be applied carefully for property managers and business landlords.",
    );
  }

  if (category === "autos") {
    const lane = readString(row, ["lane", "autos_lane", "autosLane"]);
    if (lane && normalizeToken(lane) === "privado") {
      warnings.push("Autos privado lane may not use negocios/dealer print priority; confirm lane before applying results priority.");
    }
  }

  const explicitBucket = normalizeExplicitBucket(
    readString(row, ["visibility_rank_bucket", "visibilityRankBucket"]),
  );
  const explicitReason = readString(row, ["visibility_rank_reason", "visibilityRankReason"]);
  if (explicitBucket) {
    return summaryFromBucket(
      category,
      explicitBucket,
      explicitBucket.replace(/_/g, " "),
      explicitReason ?? "Explicit visibility_rank_bucket field on listing row.",
      "visibility_rank_bucket field",
      warnings,
    );
  }
  if (readString(row, ["visibility_rank_bucket", "visibilityRankBucket"])) {
    warnings.push("visibility_rank_bucket was present but could not be normalized; falling back to derived ranking.");
  }

  const printRaw =
    readString(row, ["print_package_tier", "printPackageTier", "print_package", "printPackage"]) ??
    null;
  const printKind = classifyPrintPackage(printRaw);

  if (printKind === "premium") {
    return summaryFromBucket(
      category,
      "premium_destacado_module",
      "Premium print — Destacados module",
      "Premium print package maps to Destacados/Patrocinado modules, not normal results priority by default.",
      printRaw ? `print package field (${printRaw})` : "print package field",
      warnings,
    );
  }

  if (printKind === "full_page") {
    return summaryFromBucket(
      category,
      "full_page_print_priority",
      "Full-page print priority",
      "Full-page print advertisers receive priority inside matching category results after search/filter.",
      printRaw ? `print package field (${printRaw})` : "print package field",
      warnings,
    );
  }

  if (printKind === "print_pool") {
    return summaryFromBucket(
      category,
      "print_advertiser_pool",
      "Print advertiser pool",
      "Half-page, quarter-page, or classified print advertisers compete below full-page priority.",
      printRaw ? `print package field (${printRaw})` : "print package field",
      warnings,
    );
  }

  if (printRaw) {
    warnings.push(`print package value "${printRaw}" was not recognized; treating listing as organic with a metadata gap.`);
  }

  const sponsoredUntil = readString(row, ["sponsored_until", "sponsoredUntil"]);
  const featuredUntil = readString(row, ["featured_until", "featuredUntil"]);
  const digitalTier = readString(row, ["digital_visibility_tier", "digitalVisibilityTier"]);
  const sponsoredActive = sponsoredUntil ? !isExpired(sponsoredUntil, now) : null;
  const featuredActive = featuredUntil ? !isExpired(featuredUntil, now) : null;

  if (sponsoredUntil && sponsoredActive === false) {
    warnings.push("sponsored_until is in the past; sponsored placement should not be treated as active.");
  }
  if (featuredUntil && featuredActive === false) {
    warnings.push("featured_until is in the past; featured placement should not be treated as active.");
  }

  const digitalFeatured =
    (isDigitalFeaturedTier(digitalTier) && (featuredUntil == null || featuredActive !== false)) ||
    (hasFeaturedSpotlight(row) && (featuredUntil == null || featuredActive !== false)) ||
    (sponsoredUntil != null && sponsoredActive === true);

  if (digitalFeatured) {
    return summaryFromBucket(
      category,
      "digital_featured",
      "Digital featured / Destacado",
      "Staff or digital featured/sponsored flags rank below print-priority tiers.",
      digitalTier
        ? `digital_visibility_tier (${digitalTier})`
        : sponsoredActive
          ? "sponsored_until active"
          : "featured/promoted listing fields",
      warnings,
    );
  }

  if (hasRepublishSignal(row, input.monetization ?? null)) {
    return summaryFromBucket(
      category,
      "republished",
      "Refrescado / Republished",
      "Republish/Refrescado ranks below print-priority advertisers and must not outrank full-page print unless policy changes.",
      hasAnyField(row, ["republished_at", "republish_sort_at", "republish_count"])
        ? "republish listing fields"
        : "monetization read model republish metadata",
      warnings,
    );
  }

  if (hasAnyField(row, ["boost_active", "boosted", "impulsado", "boost_expires"])) {
    warnings.push("Boost/Impulsado metadata may exist but remains below print priority and is not a ranking upgrade in Gate G1.");
  }

  if (
    !hasAnyField(row, [
      "print_package_tier",
      "printPackageTier",
      "print_package",
      "printPackage",
      "digital_visibility_tier",
      "digitalVisibilityTier",
    ])
  ) {
    warnings.push("No print or digital visibility tier fields were present; organic fallback is used.");
  }

  return summaryFromBucket(
    category,
    "organic",
    "Organic / basic",
    "Default marketplace listing pool after paid/print visibility logic.",
    "fallback",
    warnings,
  );
}

/**
 * Compare two visibility summaries for sort ordering.
 * Higher rankWeight sorts first. Ties return 0 so callers preserve existing order.
 * Does not sort by date; category-specific fallback sorting remains after bucket compare.
 */
export function compareVisibilityRank(a: VisibilityRankSummary, b: VisibilityRankSummary): number {
  if (a.rankWeight !== b.rankWeight) return b.rankWeight - a.rankWeight;
  return 0;
}
