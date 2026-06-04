/**
 * Gate E / GA2 — Category listing-tier read model (read-only).
 *
 * Doctrine (enforced in code, not by account metadata):
 * - profiles.membership_tier is NEVER listing monetization truth.
 * - business_lite / business_premium are NEVER category monetization truth.
 * - account_type is profile metadata only.
 * - En Venta gratis/pro stays En Venta-specific (not global).
 * - Republish / Refrescado ≠ Featured / Destacado ≠ Verify Leonix (trust, not paid).
 * - Boost / Impulsado and Auto Refresh are future unless explicit safe listing fields exist.
 * - No Supabase calls, mutations, payments, or UI in this module.
 */

import {
  resolveCategoryAdPlan,
  type CategoryAdPlanDisplay,
} from "./categoryAdPlans";
import { republishCapabilityReason } from "@/app/admin/_lib/classifiedsRepublishCapability";
import { listingPlanFromDetailPairs } from "@/app/(site)/dashboard/lib/dashboardListingMeta";
import { EN_VENTA_VISIBILITY_WINDOW_MS } from "@/app/clasificados/en-venta/boosts/enVentaVisibilityRenewal";

// ---------------------------------------------------------------------------
// Tool keys & statuses
// ---------------------------------------------------------------------------

export const CATEGORY_LISTING_TOOL_KEYS = [
  "republish",
  "moveToTop",
  "featured",
  "verified",
  "boost",
  "autoRefresh",
  "analytics",
  "leads",
  "concierge",
  "expirationRenewal",
] as const;

export type CategoryListingToolKey = (typeof CATEGORY_LISTING_TOOL_KEYS)[number];

export type CategoryListingToolStatus =
  | "available"
  | "locked"
  | "unsupported"
  | "unknown"
  | "future";

/** @deprecated Prefer CategoryListingToolStatus */
export type ToolStateStatus = CategoryListingToolStatus;

export type CategoryListingToolState = {
  key: CategoryListingToolKey;
  status: CategoryListingToolStatus;
  label: string;
  reason?: string;
  source: string;
  warnings?: string[];
};

/** Legacy shape without `key` / `source` — kept for existing Admin chips. */
export type ToolState = Pick<CategoryListingToolState, "status" | "label" | "reason">;

export type CategoryListingMonetizationTools = Record<CategoryListingToolKey, ToolState>;

export type CategoryListingMonetizationWarning = {
  code: string;
  message: string;
  severity: "info" | "warning" | "gap";
  source?: string;
};

export type AnalyticsCapabilityHint = "proven" | "partial" | "none" | "unknown";

export type CategoryListingMonetizationInput = {
  category?: string | null;
  categorySlug?: string | null;
  source?: string | null;
  sourceTable?: string | null;
  sourceId?: string | null;
  internalId?: string | null;
  leonixAdId?: string | null;
  slug?: string | null;
  ownerId?: string | null;
  ownerUserId?: string | null;
  status?: string | null;
  lifecycleStatus?: string | null;
  listing?: Record<string, unknown> | null;
  detailPairs?: unknown;
  packageTier?: string | null;
  planKind?: string | null;
  categoryPlan?: CategoryAdPlanDisplay | null;
  packageEntitlement?: {
    id?: string | null;
    tier?: string | null;
    isActive?: boolean | null;
  } | null;
  analyticsCapability?: AnalyticsCapabilityHint | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  expiresAt?: string | null;
  republishedAt?: string | null;
  republishSortAt?: string | null;
  promotedUntil?: string | null;
  featuredUntil?: string | null;
  boostExpiresAt?: string | null;
  /** When true, row came from legacy/mock admin — monetization must stay defensive. */
  legacyMockAdminSource?: boolean | null;
  /** When true, category uses a dual analytics pipeline (global + category table). */
  dualAnalyticsPipeline?: boolean | null;
};

export type PipelineClassification =
  | "CLASSIFIED_PRIVATE"
  | "CLASSIFIED_SCAFFOLD"
  | "SERVICE_BUSINESS_PROFILE"
  | "RESTAURANT_PROFILE"
  | "AUTOS_CLASSIFIED"
  | "JOBS_PIPELINE"
  | "TRAVEL_STAGED"
  | "UNKNOWN";

export type CategoryListingMonetizationResult = {
  category: string;
  sourceTable: string;
  sourceId: string | null;
  internalId: string | null;
  leonixAdId: string | null;
  slug: string | null;
  displayPlanLabel: string;
  planKind: string | null;
  listingTier: string | null;
  accountTierIgnored: true;
  tools: Record<CategoryListingToolKey, CategoryListingToolState>;
  metadata: {
    republishedAt?: string | null;
    republishCount?: number | null;
    expiresAt?: string | null;
    promoted?: boolean | null;
    featured?: boolean | null;
    verified?: boolean | null;
    sourceId?: string | null;
    slug?: string | null;
    packageTier?: string | null;
    packageEntitlementId?: string | null;
    leonixAdId?: string | null;
  };
  catalogWarnings: CategoryListingMonetizationWarning[];
  gaps: CategoryListingMonetizationWarning[];
  isClientReady: boolean;
  pipelineClassification: PipelineClassification;
};

/** Admin-compatible summary (flat `warnings`, `planLabel`, `source`). */
export type CategoryListingMonetizationSummary = CategoryListingMonetizationResult & {
  /** Flattened catalogWarnings + gaps for legacy Admin chips. */
  warnings: string[];
  planLabel: string;
  planSource: string;
  source: string;
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
  "busco",
  "mascotas-y-perdidos",
] as const;

export type CategoryListingMonetizationCategory = (typeof SUPPORTED_CATEGORY_SLUGS)[number];

const NOT_V1_MONETIZATION = new Set<string>(["empleos", "viajes"]);
const NOT_CLIENT_READY = new Set<string>(["clases", "comunidad", "busco", "mascotas-y-perdidos"]);

const SAFE_BOOST_FIELDS = ["boost_active", "boosted", "impulsado"] as const;
const SAFE_AUTO_REFRESH_FIELDS = ["auto_refresh", "auto_refresh_enabled"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  if (c === "mascotas" || c === "mascotas_perdidos") return "mascotas-y-perdidos";
  return c || "unknown";
}

function pipelineForCategory(category: string): PipelineClassification {
  switch (category) {
    case "en-venta":
    case "rentas":
    case "bienes-raices":
      return "CLASSIFIED_PRIVATE";
    case "clases":
    case "comunidad":
    case "busco":
    case "mascotas-y-perdidos":
      return "CLASSIFIED_SCAFFOLD";
    case "servicios":
      return "SERVICE_BUSINESS_PROFILE";
    case "restaurantes":
      return "RESTAURANT_PROFILE";
    case "autos":
      return "AUTOS_CLASSIFIED";
    case "empleos":
      return "JOBS_PIPELINE";
    case "viajes":
      return "TRAVEL_STAGED";
    default:
      return "UNKNOWN";
  }
}

function isClientReadyCategory(category: string): boolean {
  if (NOT_CLIENT_READY.has(category)) return false;
  if (NOT_V1_MONETIZATION.has(category)) return false;
  return SUPPORTED_CATEGORY_SLUGS.includes(category as CategoryListingMonetizationCategory);
}

function toolState(
  key: CategoryListingToolKey,
  status: CategoryListingToolStatus,
  label: string,
  source: string,
  reason?: string,
  warnings?: string[],
): CategoryListingToolState {
  return {
    key,
    status,
    label,
    source,
    ...(reason ? { reason } : {}),
    ...(warnings?.length ? { warnings } : {}),
  };
}

function addWarning(
  catalog: CategoryListingMonetizationWarning[],
  code: string,
  message: string,
  severity: CategoryListingMonetizationWarning["severity"],
  source?: string,
): void {
  catalog.push({ code, message, severity, ...(source ? { source } : {}) });
}

function fieldBackedBooleanTool(
  key: CategoryListingToolKey,
  row: Record<string, unknown>,
  keys: readonly string[],
  availableLabel: string,
  lockedLabel: string,
  missingLabel: string,
  source: string,
): CategoryListingToolState {
  if (!hasAnyField(row, keys)) {
    return toolState(key, "unknown", missingLabel, source, "No safe listing-level field was present on this row.");
  }
  const value = readBoolean(row, keys);
  if (value === true) return toolState(key, "available", availableLabel, source);
  if (value === false) return toolState(key, "locked", lockedLabel, source);
  return toolState(key, "unknown", missingLabel, source, "Field exists but could not be normalized to a boolean.");
}

function existingPlanInput(
  row: Record<string, unknown>,
  category: string,
  source: string,
  detailPairs: unknown,
  input: CategoryListingMonetizationInput,
) {
  return {
    category,
    sourceTable: source,
    packageTier: input.packageTier ?? readString(row, ["package_tier", "packageTier"]),
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
  input: CategoryListingMonetizationInput,
  catalogWarnings: CategoryListingMonetizationWarning[],
  gaps: CategoryListingMonetizationWarning[],
): Pick<CategoryListingMonetizationSummary, "planKind" | "displayPlanLabel" | "planSource" | "listingTier"> {
  if (category === "servicios") {
    const explicit = readString(row, ["listing_plan", "ad_plan", "package_tier", "services_tier", "servicios_tier"]);
    if (!explicit) {
      addWarning(
        gaps,
        "servicios_plan_missing",
        "Servicios has no explicit listing-level plan field on this row; the read model reports the gap instead of inventing a paid tier.",
        "gap",
        "servicios",
      );
      return {
        planKind: null,
        displayPlanLabel: "Unspecified services listing plan",
        planSource: "missing explicit Servicios listing plan field",
        listingTier: input.packageTier ?? null,
      };
    }
    return {
      planKind: `servicios_${explicit.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      displayPlanLabel: titleCase(explicit),
      planSource: "explicit Servicios listing field",
      listingTier: explicit,
    };
  }

  if (NOT_CLIENT_READY.has(category)) {
    addWarning(
      catalogWarnings,
      "category_not_client_ready",
      `${category} is not client-ready for paid listing tools; only a defensive summary is returned.`,
      "warning",
      category,
    );
    return {
      planKind: null,
      displayPlanLabel: "Not client-ready",
      planSource: "category gate",
      listingTier: null,
    };
  }

  if (NOT_V1_MONETIZATION.has(category)) {
    addWarning(
      catalogWarnings,
      "separate_monetization_model",
      `${category} uses a separate model and is not part of V1 category monetization.`,
      "info",
      category,
    );
  }

  const display =
    input.categoryPlan ?? resolveCategoryAdPlan(existingPlanInput(row, category, source, detailPairs, input));
  if (display.warning) {
    addWarning(catalogWarnings, "plan_resolver_warning", display.warning, "warning", "categoryAdPlans");
  }

  if (category !== "en-venta" && display.key === "en_venta_pro") {
    addWarning(
      gaps,
      "en_venta_pro_leak",
      "En Venta Pro plan kind must not appear outside En Venta; treating as unknown.",
      "gap",
      category,
    );
  }

  return {
    planKind: category !== "en-venta" && display.key === "en_venta_pro" ? null : display.key,
    displayPlanLabel: display.labelEn,
    planSource: input.categoryPlan ? "provided category plan result" : "categoryAdPlans resolver",
    listingTier: input.packageTier ?? readString(row, ["package_tier", "packageTier", "tier", "plan"]) ?? display.key,
  };
}

function mergeRowDates(row: Record<string, unknown>, input: CategoryListingMonetizationInput): Record<string, unknown> {
  const merged = { ...row };
  const assign = (key: string, value: string | null | undefined) => {
    if (value && !hasOwn(merged, key)) merged[key] = value;
  };
  assign("expires_at", input.expiresAt ?? undefined);
  assign("republished_at", input.republishedAt ?? undefined);
  assign("republish_sort_at", input.republishSortAt ?? undefined);
  assign("promoted_until", input.promotedUntil ?? undefined);
  assign("featured_until", input.featuredUntil ?? undefined);
  assign("boost_expires", input.boostExpiresAt ?? undefined);
  assign("created_at", input.createdAt ?? undefined);
  assign("updated_at", input.updatedAt ?? undefined);
  assign("published_at", input.publishedAt ?? undefined);
  return merged;
}

function resolveRepublishTool(
  category: string,
  row: Record<string, unknown>,
  gaps: CategoryListingMonetizationWarning[],
): CategoryListingToolState {
  if (NOT_CLIENT_READY.has(category)) {
    return toolState(
      "republish",
      "unsupported",
      "Republish / Refrescado unsupported",
      "category gate",
      "Category is coming-soon/scaffold and not client-ready.",
    );
  }

  const reason = republishCapabilityReason(row, category);
  const republishFields = ["republished_at", "republish_count", "last_republished_by", "last_republished_source", "republish_sort_at"];
  const hasRepublishMeta = hasAnyField(row, republishFields);

  if (reason) {
    return toolState("republish", "locked", "Republish / Refrescado locked", "republishCapabilityReason", reason);
  }

  if (!hasRepublishMeta && category !== "en-venta") {
    addWarning(
      gaps,
      "republish_metadata_missing",
      "No safe republish metadata fields were present; consumers should show a metadata gap, not assume eligibility.",
      "gap",
      category,
    );
  }

  return toolState("republish", "available", "Republish / Refrescado eligible", "republishCapabilityReason");
}

function resolveMoveToTopTool(category: string, row: Record<string, unknown>, republish: CategoryListingToolState): CategoryListingToolState {
  if (republish.status === "unsupported") {
    return toolState("moveToTop", "unsupported", "Move-to-top unsupported", republish.source, republish.reason);
  }
  if (republish.status === "locked") {
    return toolState("moveToTop", "locked", "Move-to-top locked", republish.source, republish.reason);
  }
  const hasSort = hasAnyField(row, ["republish_sort_at", "republished_at", "republish_count"]);
  if (hasSort) {
    return toolState("moveToTop", "available", "Move to top reads republish ordering metadata", "republish sort fields");
  }
  return toolState(
    "moveToTop",
    "unknown",
    "Move-to-top metadata missing",
    "republish sort fields",
    "No safe listing-level republish ordering fields were present.",
  );
}

function resolveFeaturedTool(category: string, row: Record<string, unknown>, gaps: CategoryListingMonetizationWarning[]): CategoryListingToolState {
  if (NOT_CLIENT_READY.has(category)) {
    return toolState("featured", "unsupported", "Featured / Destacado unsupported", "category gate", "Category is not client-ready.");
  }
  if (NOT_V1_MONETIZATION.has(category)) {
    return toolState(
      "featured",
      "unsupported",
      "Featured / Destacado unsupported",
      "category gate",
      "Category uses a separate monetization model.",
    );
  }

  if (!hasAnyField(row, ["featured_until", "promoted_until"])) {
    addWarning(
      gaps,
      "featured_until_missing",
      "No featured_until or promoted_until field; spotlight duration cannot be determined from schema.",
      "gap",
      category,
    );
  }

  return fieldBackedBooleanTool(
    "featured",
    row,
    ["promoted", "admin_promoted", "featured", "destacado"],
    "Featured / Destacado flag is active",
    "Featured / Destacado flag is off",
    "Featured / Destacado flag missing",
    "listing spotlight fields",
  );
}

function resolveVerifiedTool(row: Record<string, unknown>): CategoryListingToolState {
  return fieldBackedBooleanTool(
    "verified",
    row,
    ["leonix_verified", "verified"],
    "Verify Leonix trust flag is active",
    "Verify Leonix trust flag is off",
    "Verify Leonix field missing",
    "trust verification fields",
  );
}

function resolveBoostTool(row: Record<string, unknown>, catalogWarnings: CategoryListingMonetizationWarning[]): CategoryListingToolState {
  if (hasOwn(row, "boost_expires") || hasOwn(row, "boostExpiresAt")) {
    addWarning(
      catalogWarnings,
      "legacy_boost_expires",
      "Legacy boost_expires was detected but is not treated as active Boost / Impulsado monetization.",
      "warning",
      "boost_expires",
    );
  }
  if (hasAnyField(row, SAFE_BOOST_FIELDS)) {
    return fieldBackedBooleanTool(
      "boost",
      row,
      SAFE_BOOST_FIELDS,
      "Boost / Impulsado flag is active",
      "Boost / Impulsado flag is off",
      "Boost / Impulsado field missing",
      "safe boost fields",
    );
  }
  return toolState(
    "boost",
    "future",
    "Boost / Impulsado is future",
    "doctrine",
    "No explicit safe listing-level boost field exists.",
  );
}

function resolveAutoRefreshTool(row: Record<string, unknown>): CategoryListingToolState {
  if (hasAnyField(row, SAFE_AUTO_REFRESH_FIELDS)) {
    return fieldBackedBooleanTool(
      "autoRefresh",
      row,
      SAFE_AUTO_REFRESH_FIELDS,
      "Auto Refresh flag is active",
      "Auto Refresh flag is off",
      "Auto Refresh field missing",
      "safe auto-refresh fields",
    );
  }
  return toolState(
    "autoRefresh",
    "future",
    "Auto Refresh is future",
    "doctrine",
    "No explicit safe listing-level auto-refresh field exists.",
  );
}

function resolveAnalyticsTool(
  category: string,
  row: Record<string, unknown>,
  input: CategoryListingMonetizationInput,
  catalogWarnings: CategoryListingMonetizationWarning[],
): CategoryListingToolState {
  const hint = input.analyticsCapability ?? "unknown";

  if (input.dualAnalyticsPipeline) {
    addWarning(
      catalogWarnings,
      "dual_analytics_pipeline",
      "Category may use both global listing_analytics and a category-specific events table.",
      "info",
      category,
    );
  }

  if (hint === "proven") {
    return toolState("analytics", "available", "Analytics capability proven for this listing", "input.analyticsCapability");
  }
  if (hint === "partial") {
    return toolState(
      "analytics",
      "unknown",
      "Analytics partially proven",
      "input.analyticsCapability",
      "Category has partial analytics; do not treat as fully proven.",
    );
  }
  if (hint === "none") {
    return toolState("analytics", "future", "Analytics not proven", "input.analyticsCapability", "No proven analytics source supplied.");
  }

  const rowSignals = hasAnyField(row, [
    "views",
    "views_count",
    "view_count",
    "apply_count",
    "saves",
    "shares",
    "analytics_enabled",
  ]);

  if (category === "empleos" && hasAnyField(row, ["apply_count", "view_count"])) {
    return toolState(
      "analytics",
      "unknown",
      "Empleos column metrics readable",
      "empleos columns",
      "apply_count/view_count are column metrics, not full event analytics.",
    );
  }

  if (rowSignals) {
    return toolState(
      "analytics",
      "unknown",
      "Analytics metadata readable on row",
      "listing row fields",
      "Row fields exist but analytics capability was not marked proven.",
    );
  }

  return toolState(
    "analytics",
    "future",
    "Analytics unproven",
    "defensive default",
    "No analytics capability hint or safe row fields were supplied.",
  );
}

function resolveLeadsTool(category: string, row: Record<string, unknown>): CategoryListingToolState {
  if (category === "empleos") {
    if (hasAnyField(row, ["apply_count", "applications_count"])) {
      return toolState("leads", "available", "Job applications metadata readable", "empleos apply_count");
    }
    return toolState("leads", "unknown", "Job applications unknown", "empleos", "No apply_count field on row.");
  }

  if (category === "servicios") {
    if (hasAnyField(row, ["leads", "leads_count", "contact_count", "message_count"])) {
      return toolState("leads", "available", "Servicios leads metadata readable", "servicios leads fields");
    }
    return toolState(
      "leads",
      "unknown",
      "Servicios leads partial",
      "servicios",
      "Leads pipeline exists but row lacks count fields.",
    );
  }

  if (hasAnyField(row, ["messages", "message_count", "leads", "leads_count", "contact_count"])) {
    return toolState("leads", "available", "Lead/contact metadata readable", "listing row fields");
  }

  if (NOT_CLIENT_READY.has(category)) {
    return toolState("leads", "unsupported", "Leads unsupported", "category gate", "Scaffold category.");
  }

  return toolState("leads", "future", "Leads unproven", "defensive default", "No lead/contact field was present on this row.");
}

function resolveConciergeTool(category: string, row: Record<string, unknown>): CategoryListingToolState {
  if (hasAnyField(row, ["concierge", "concierge_requested", "concierge_status"])) {
    return toolState("concierge", "available", "Concierge help metadata readable", "listing row fields");
  }
  return toolState(
    "concierge",
    "future",
    category === "servicios" ? "Concierge can be offered later as help" : "Concierge is future",
    "doctrine",
    "Concierge is separate from paid placement; no capture system on this row.",
  );
}

function resolveExpirationRenewalTool(
  category: string,
  row: Record<string, unknown>,
  gaps: CategoryListingMonetizationWarning[],
): CategoryListingToolState {
  if (hasOwn(row, "expires_at") || hasOwn(row, "expiresAt")) {
    return toolState("expirationRenewal", "available", "Expiration / renewal field is readable", "expires_at");
  }

  if (category === "en-venta") {
    const republishedAt = readString(row, ["republished_at", "republishedAt"]);
    if (republishedAt) {
      const repMs = Date.parse(republishedAt);
      if (Number.isFinite(repMs)) {
        return toolState(
          "expirationRenewal",
          "available",
          "En Venta visibility window readable from republished_at",
          "enVentaVisibilityRenewal",
          `Visibility window is ${EN_VENTA_VISIBILITY_WINDOW_MS / (60 * 60 * 1000)}h from last republish; not expires_at.`,
        );
      }
    }
    const plan = listingPlanFromDetailPairs(row.detail_pairs ?? row.detailPairs);
    if (plan === "pro") {
      addWarning(
        gaps,
        "en_venta_expiration_partial",
        "En Venta Pro uses visibility window from republished_at; no expires_at on listings row.",
        "gap",
        "en-venta",
      );
      return toolState(
        "expirationRenewal",
        "unknown",
        "En Venta visibility window partial",
        "enVentaVisibilityRenewal",
        "Pro listing but republished_at not supplied to read model.",
      );
    }
    addWarning(
      gaps,
      "en_venta_free_no_renewal",
      "En Venta Free has no expiration renewal tool; visibility is not Pro republish window.",
      "info",
      "en-venta",
    );
    return toolState(
      "expirationRenewal",
      "locked",
      "Expiration / renewal not applicable (Free)",
      "enVenta plan",
      "Free En Venta listings do not use Pro visibility renewal.",
    );
  }

  if (category === "viajes") {
    addWarning(
      gaps,
      "viajes_expiration_missing",
      "Viajes expects expires_at on staged listings; field missing on this row.",
      "gap",
      "viajes",
    );
  } else {
    addWarning(
      gaps,
      "expires_at_missing",
      "No safe expires_at field was present; renewal eligibility must be shown as future/unknown until schema support exists.",
      "gap",
      category,
    );
  }

  return toolState(
    "expirationRenewal",
    "future",
    "Expiration / renewal is future or unknown",
    "defensive default",
    "No safe expiration field was present.",
  );
}

function resolveToolStates(
  category: string,
  row: Record<string, unknown>,
  input: CategoryListingMonetizationInput,
  catalogWarnings: CategoryListingMonetizationWarning[],
  gaps: CategoryListingMonetizationWarning[],
): Record<CategoryListingToolKey, CategoryListingToolState> {
  const republish = resolveRepublishTool(category, row, gaps);
  return {
    republish,
    moveToTop: resolveMoveToTopTool(category, row, republish),
    featured: resolveFeaturedTool(category, row, gaps),
    verified: resolveVerifiedTool(row),
    boost: resolveBoostTool(row, catalogWarnings),
    autoRefresh: resolveAutoRefreshTool(row),
    analytics: resolveAnalyticsTool(category, row, input, catalogWarnings),
    leads: resolveLeadsTool(category, row),
    concierge: resolveConciergeTool(category, row),
    expirationRenewal: resolveExpirationRenewalTool(category, row, gaps),
  };
}

function collectIdentityWarnings(
  input: CategoryListingMonetizationInput,
  row: Record<string, unknown>,
  category: string,
  catalogWarnings: CategoryListingMonetizationWarning[],
  gaps: CategoryListingMonetizationWarning[],
): {
  sourceId: string | null;
  internalId: string | null;
  leonixAdId: string | null;
  slug: string | null;
} {
  const sourceId =
    input.sourceId ??
    input.internalId ??
    readString(row, ["id", "source_id", "sourceId", "listing_id"]);
  const internalId = input.internalId ?? sourceId;
  const leonixAdId = input.leonixAdId ?? readString(row, ["leonix_ad_id", "leonixAdId"]);
  const slug = input.slug ?? readString(row, ["slug"]);

  if (!sourceId) {
    addWarning(gaps, "missing_source_id", "Missing stable source ID on listing row.", "gap", category);
  }
  if (!leonixAdId) {
    if (category === "comunidad" || category === "clases" || category === "busco") {
      addWarning(
        catalogWarnings,
        "leonix_id_derived",
        "Leonix Ad ID may be derived from UUID for this category; not a persisted leonix_ad_id column.",
        "info",
        category,
      );
    } else {
      addWarning(gaps, "missing_leonix_ad_id", "Missing Leonix Ad ID on listing row.", "gap", category);
    }
  }
  const owner = input.ownerUserId ?? input.ownerId ?? readString(row, ["owner_user_id", "owner_id", "ownerId"]);
  if (!owner) {
    addWarning(gaps, "missing_owner_id", "Missing owner / seller user ID on listing row.", "gap", category);
  }
  if (input.legacyMockAdminSource) {
    addWarning(
      catalogWarnings,
      "legacy_mock_admin",
      "Row came from legacy/mock admin source; do not treat as monetization truth.",
      "warning",
      "admin mock",
    );
  }
  if (!input.packageEntitlement) {
    addWarning(
      catalogWarnings,
      "package_entitlement_not_supplied",
      "Package entitlement was not supplied; featured/republish eligibility from entitlements is unknown.",
      "info",
      "packageEntitlements",
    );
  }

  return { sourceId, internalId, leonixAdId, slug };
}


function flattenWarnings(
  catalogWarnings: CategoryListingMonetizationWarning[],
  gaps: CategoryListingMonetizationWarning[],
): string[] {
  return [...catalogWarnings, ...gaps].map((w) => w.message);
}

/**
 * Pure read-only resolver for category/listing monetization and tool availability.
 * No Supabase, Stripe, mutations, or UI.
 */
export function resolveCategoryListingMonetization(
  input: CategoryListingMonetizationInput,
): CategoryListingMonetizationSummary {
  const baseRow = input.listing ? { ...input.listing } : {};
  const row = mergeRowDates(baseRow, input);
  const sourceTable =
    String(input.sourceTable ?? input.source ?? readString(row, ["source", "table"]) ?? "unknown").trim() || "unknown";
  const category = normalizeCategory(
    input.category ?? input.categorySlug ?? row.category ?? row.category_slug ?? row.listing_category,
    sourceTable,
  );
  const catalogWarnings: CategoryListingMonetizationWarning[] = [];
  const gaps: CategoryListingMonetizationWarning[] = [];
  const detailPairs = input.detailPairs ?? row.detail_pairs ?? row.detailPairs;

  addWarning(
    catalogWarnings,
    "account_tier_ignored",
    "Account membership tier, business lite, and business premium are ignored; listing/category fields only.",
    "info",
    "doctrine",
  );

  if (!SUPPORTED_CATEGORY_SLUGS.includes(category as CategoryListingMonetizationCategory)) {
    addWarning(
      gaps,
      "unknown_category",
      "Unknown category; read model is defensive and does not infer category monetization from account data.",
      "gap",
      category,
    );
  }

  const identity = collectIdentityWarnings(input, row, category, catalogWarnings, gaps);
  const plan = resolvePlan(category, sourceTable, row, detailPairs, input, catalogWarnings, gaps);
  const fullTools = resolveToolStates(category, row, input, catalogWarnings, gaps);

  const packageEntitlementId = input.packageEntitlement?.id ?? null;
  const packageTier =
    input.packageTier ?? readString(row, ["package_tier", "packageTier"]) ?? input.packageEntitlement?.tier ?? null;

  const result: CategoryListingMonetizationResult = {
    category,
    sourceTable,
    sourceId: identity.sourceId,
    internalId: identity.internalId,
    leonixAdId: identity.leonixAdId,
    slug: identity.slug,
    displayPlanLabel: plan.displayPlanLabel,
    planKind: plan.planKind,
    listingTier: plan.listingTier,
    accountTierIgnored: true,
    tools: fullTools,
    metadata: {
      leonixAdId: identity.leonixAdId,
      republishedAt: input.republishedAt ?? readString(row, ["republished_at", "republishedAt"]),
      republishCount: readNumber(row, ["republish_count", "republishCount"]),
      expiresAt: input.expiresAt ?? readString(row, ["expires_at", "expiresAt"]),
      promoted: readBoolean(row, ["promoted", "admin_promoted"]),
      featured: readBoolean(row, ["featured", "destacado"]),
      verified: readBoolean(row, ["leonix_verified", "verified"]),
      sourceId: identity.sourceId,
      slug: identity.slug,
      packageTier,
      packageEntitlementId,
    },
    catalogWarnings,
    gaps,
    isClientReady: isClientReadyCategory(category),
    pipelineClassification: pipelineForCategory(category),
  };

  return {
    ...result,
    tools: fullTools,
    warnings: flattenWarnings(catalogWarnings, gaps),
    planLabel: plan.displayPlanLabel,
    planSource: plan.planSource,
    source: sourceTable,
  };
}

export { SUPPORTED_CATEGORY_SLUGS as CATEGORY_LISTING_MONETIZATION_CATEGORIES };
