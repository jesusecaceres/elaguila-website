import {
  resolveCategoryAdPlan,
  type CategoryAdPlanDisplay,
} from "./categoryAdPlans";

export type ToolStateStatus =
  | "available"
  | "locked"
  | "unsupported"
  | "unknown"
  | "future";

export type ToolState = {
  status: ToolStateStatus;
  label: string;
  reason?: string;
};

export type CategoryListingMonetizationTools = {
  republish: ToolState;
  moveToTop: ToolState;
  featured: ToolState;
  verified: ToolState;
  boost: ToolState;
  autoRefresh: ToolState;
  analytics: ToolState;
  leads: ToolState;
  concierge: ToolState;
  expirationRenewal: ToolState;
};

export type CategoryListingMonetizationSummary = {
  category: string;
  source: string;
  planKind: string | null;
  planLabel: string;
  planSource: string;
  accountTierIgnored: boolean;
  tools: CategoryListingMonetizationTools;
  metadata: {
    leonixAdId?: string | null;
    republishedAt?: string | null;
    republishCount?: number | null;
    expiresAt?: string | null;
    promoted?: boolean | null;
    featured?: boolean | null;
    verified?: boolean | null;
    sourceId?: string | null;
    slug?: string | null;
  };
  warnings: string[];
};

export type CategoryListingMonetizationInput = {
  category?: string | null;
  source?: string | null;
  sourceTable?: string | null;
  listing?: Record<string, unknown> | null;
  detailPairs?: unknown;
  categoryPlan?: CategoryAdPlanDisplay | null;
};

const SUPPORTED_CATEGORY_SLUGS = [
  "servicios",
  "restaurantes",
  "autos",
  "bienes-raices",
  "rentas",
  "en-venta",
  "clases",
  "comunidad",
  "viajes",
  "empleos",
] as const;

export type CategoryListingMonetizationCategory = (typeof SUPPORTED_CATEGORY_SLUGS)[number];

const NOT_V1_MONETIZATION = new Set(["empleos", "viajes"]);
const NOT_CLIENT_READY = new Set(["clases", "comunidad"]);

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

function titleCase(raw: string): string {
  return raw
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function categoryFromSource(source: string): string | null {
  const s = source.trim().toLowerCase();
  if (s.includes("servicios_public")) return "servicios";
  if (s.includes("restaurantes_public")) return "restaurantes";
  if (s.includes("autos_classifieds")) return "autos";
  if (s.includes("empleos_public")) return "empleos";
  if (s.includes("viajes_staged")) return "viajes";
  if (s === "servicios" || s === "restaurantes" || s === "autos" || s === "empleos" || s === "viajes") return s;
  return null;
}

function normalizeCategory(raw: unknown, source: string): string {
  const fromSource = categoryFromSource(source);
  if (fromSource) return fromSource;
  const c = String(raw ?? "").trim().toLowerCase();
  if (c === "en_venta" || c === "for-sale" || c === "for_sale") return "en-venta";
  if (c === "bienes_raices" || c === "real-estate" || c === "real_estate") return "bienes-raices";
  if (c === "empleo") return "empleos";
  if (c === "travel") return "viajes";
  if (c === "autos_paid") return "autos";
  return c || "unknown";
}

function tool(status: ToolStateStatus, label: string, reason?: string): ToolState {
  return reason ? { status, label, reason } : { status, label };
}

function fieldBackedBooleanTool(
  row: Record<string, unknown>,
  keys: readonly string[],
  availableLabel: string,
  lockedLabel: string,
  missingLabel: string,
): ToolState {
  if (!hasAnyField(row, keys)) return tool("unknown", missingLabel, "No safe listing-level field was present on this row.");
  const value = readBoolean(row, keys);
  if (value === true) return tool("available", availableLabel);
  if (value === false) return tool("locked", lockedLabel);
  return tool("unknown", missingLabel, "Field exists but could not be normalized to a boolean.");
}

function existingPlanInput(row: Record<string, unknown>, category: string, source: string, detailPairs: unknown) {
  return {
    category,
    sourceTable: source,
    packageTier: readString(row, ["package_tier", "packageTier"]),
    plan: readString(row, ["plan", "listing_plan", "ad_plan"]),
    tier: readString(row, ["tier", "plan_tier", "rentas_tier"]),
    sellerType: readString(row, ["seller_type", "sellerType"]),
    rentasTier: readString(row, ["rentas_tier", "rentasTier"]),
    servicesTier: readString(row, ["services_tier", "servicios_tier"]),
    autosLane: readString(row, ["lane", "autosLane"]),
    viajesLane: readString(row, ["lane", "viajes_lane", "viajesLane"]),
    listingKind: readString(row, ["listing_kind", "listingKind", "kind"]),
    isAffiliate: readBoolean(row, ["is_affiliate", "isAffiliate"]),
    price: row.price as string | number | null | undefined,
    classPrice: row.class_price as string | number | null | undefined,
    classTuition: row.tuition as string | number | null | undefined,
    detailPairs,
    fallbackPlanOrTier: null,
    raw: row,
  };
}

function resolvePlan(
  category: string,
  source: string,
  row: Record<string, unknown>,
  detailPairs: unknown,
  existing: CategoryAdPlanDisplay | null | undefined,
  warnings: string[],
): Pick<CategoryListingMonetizationSummary, "planKind" | "planLabel" | "planSource"> {
  if (category === "servicios") {
    const explicit = readString(row, ["listing_plan", "ad_plan", "package_tier", "services_tier", "servicios_tier"]);
    if (!explicit) {
      warnings.push("Servicios has no explicit listing-level plan field on this row; the read model reports the gap instead of inventing a paid tier.");
      return {
        planKind: null,
        planLabel: "Unspecified services listing plan",
        planSource: "missing explicit Servicios listing plan field",
      };
    }
    return {
      planKind: `servicios_${explicit.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      planLabel: titleCase(explicit),
      planSource: "explicit Servicios listing field",
    };
  }

  if (NOT_CLIENT_READY.has(category)) {
    warnings.push(`${category} is not client-ready for paid listing tools; only a defensive summary is returned.`);
    return {
      planKind: null,
      planLabel: "Not client-ready",
      planSource: "category gate",
    };
  }

  if (NOT_V1_MONETIZATION.has(category)) {
    warnings.push(`${category} uses a separate model and is not part of V1 category monetization.`);
  }

  const display = existing ?? resolveCategoryAdPlan(existingPlanInput(row, category, source, detailPairs));
  if (display.warning) warnings.push(display.warning);
  return {
    planKind: display.key,
    planLabel: display.labelEn,
    planSource: existing ? "provided category plan result" : "categoryAdPlans resolver",
  };
}

function resolveToolStates(category: string, row: Record<string, unknown>, warnings: string[]): CategoryListingMonetizationTools {
  const unsupportedCategory = NOT_CLIENT_READY.has(category);
  const separateModelCategory = NOT_V1_MONETIZATION.has(category);
  const unsupportedReason = unsupportedCategory
    ? "Category is later/not client-ready."
    : separateModelCategory
      ? "Category has a separate model and is not V1 monetization."
      : undefined;

  const republishFields = ["republished_at", "republish_count", "last_republished_by", "last_republished_source", "republish_sort_at"];
  const hasRepublish = hasAnyField(row, republishFields);
  if (!hasRepublish) warnings.push("No safe republish metadata fields were present; consumers should show a metadata gap, not assume eligibility.");

  const republish = unsupportedReason
    ? tool("unsupported", "Republish metadata unsupported", unsupportedReason)
    : hasRepublish
      ? tool("available", "Republish / Refrescado metadata is readable")
      : tool("unknown", "Republish metadata missing", "No safe listing-level republish fields were present.");

  const moveToTop = unsupportedReason
    ? tool("unsupported", "Move-to-top unsupported", unsupportedReason)
    : hasRepublish
      ? tool("available", "Move to top reads republish metadata")
      : tool("unknown", "Move-to-top metadata missing", "No safe listing-level republish ordering fields were present.");

  const featured = unsupportedReason
    ? tool("unsupported", "Featured / Destacado unsupported", unsupportedReason)
    : fieldBackedBooleanTool(
        row,
        ["promoted", "admin_promoted", "featured", "destacado"],
        "Featured / Destacado flag is active",
        "Featured / Destacado flag is off",
        "Featured / Destacado flag missing",
      );

  const verified = fieldBackedBooleanTool(
    row,
    ["leonix_verified", "verified"],
    "Verify Leonix trust flag is active",
    "Verify Leonix trust flag is off",
    "Verify Leonix field missing",
  );

  const boost = hasAnyField(row, ["boost_active", "boosted", "impulsado"])
    ? fieldBackedBooleanTool(row, ["boost_active", "boosted", "impulsado"], "Boost / Impulsado flag is active", "Boost / Impulsado flag is off", "Boost / Impulsado field missing")
    : tool("future", "Boost / Impulsado is future", "No explicit safe listing-level boost field exists.");

  if (hasOwn(row, "boost_expires")) {
    warnings.push("Legacy boost_expires was detected but is not treated as active Boost / Impulsado monetization.");
  }

  const autoRefresh = hasAnyField(row, ["auto_refresh", "auto_refresh_enabled"])
    ? fieldBackedBooleanTool(row, ["auto_refresh", "auto_refresh_enabled"], "Auto Refresh flag is active", "Auto Refresh flag is off", "Auto Refresh field missing")
    : tool("future", "Auto Refresh is future", "No explicit safe listing-level auto-refresh field exists.");

  const analytics = hasAnyField(row, ["views", "views_count", "saves", "shares", "analytics_enabled"])
    ? tool("available", "Analytics metadata is readable")
    : tool("future", "Analytics is future or absent", "No analytics field was present on this row.");

  const leads = hasAnyField(row, ["messages", "message_count", "leads", "leads_count", "contact_count"])
    ? tool("available", "Lead/contact metadata is readable")
    : tool("future", "Leads are future or absent", "No lead/contact field was present on this row.");

  const concierge = hasAnyField(row, ["concierge", "concierge_requested", "concierge_status"])
    ? tool("available", "Concierge help metadata is readable")
    : tool("future", category === "servicios" ? "Concierge can be offered later as help" : "Concierge is future", "Concierge is separate from paid placement.");

  const expirationRenewal = hasOwn(row, "expires_at")
    ? tool("available", "Expiration / renewal field is readable")
    : tool("future", "Expiration / renewal is future or unknown", "No safe expiration field was present.");
  if (!hasOwn(row, "expires_at")) {
    warnings.push("No safe expires_at field was present; renewal eligibility must be shown as future/unknown until schema support exists.");
  }

  return {
    republish,
    moveToTop,
    featured,
    verified,
    boost,
    autoRefresh,
    analytics,
    leads,
    concierge,
    expirationRenewal,
  };
}

export function resolveCategoryListingMonetization(
  input: CategoryListingMonetizationInput,
): CategoryListingMonetizationSummary {
  const row = input.listing ? { ...input.listing } : {};
  const source = String(input.sourceTable ?? input.source ?? readString(row, ["source", "table"]) ?? "unknown").trim() || "unknown";
  const category = normalizeCategory(input.category ?? row.category ?? row.category_slug ?? row.listing_category, source);
  const warnings: string[] = [];
  const detailPairs = input.detailPairs ?? row.detail_pairs ?? row.detailPairs;

  if (!SUPPORTED_CATEGORY_SLUGS.includes(category as CategoryListingMonetizationCategory)) {
    warnings.push("Unknown category; read model is defensive and does not infer category monetization from account data.");
  }

  const plan = resolvePlan(category, source, row, detailPairs, input.categoryPlan, warnings);
  const tools = resolveToolStates(category, row, warnings);

  return {
    category,
    source,
    ...plan,
    accountTierIgnored: true,
    tools,
    metadata: {
      leonixAdId: readString(row, ["leonix_ad_id", "leonixAdId"]),
      republishedAt: readString(row, ["republished_at", "republishedAt"]),
      republishCount: readNumber(row, ["republish_count", "republishCount"]),
      expiresAt: readString(row, ["expires_at", "expiresAt"]),
      promoted: readBoolean(row, ["promoted", "admin_promoted"]),
      featured: readBoolean(row, ["featured", "destacado"]),
      verified: readBoolean(row, ["leonix_verified", "verified"]),
      sourceId: readString(row, ["id", "source_id", "sourceId"]),
      slug: readString(row, ["slug"]),
    },
    warnings,
  };
}

export { SUPPORTED_CATEGORY_SLUGS as CATEGORY_LISTING_MONETIZATION_CATEGORIES };
