/**
 * Staff-managed Business ads: Quick ($249 Simple) vs Full ($399 Full) on the SAME listing.
 *
 * Quick vs Full is an entitlement, not a second form, a second row, or a second custody model.
 * The four BUSINESS_CATEGORY_PACKAGE_PAIR categories sell this split. Rentas, Empleos,
 * Autos privados, and Comida Local keep their own products and are never mapped to $249/$399.
 *
 * Pure: no DB, no Stripe, no env. Amounts come from revenuePricingMatrix at read time.
 */
import {
  BUSINESS_CATEGORY_PACKAGE_PAIR,
  type BusinessAccessLevel,
} from "@/app/lib/listingPlans/businessAccessLevel";
import {
  businessPackageKeyForPlan,
  withQuickPlanParam,
  type BusinessPlanChoice,
} from "@/app/lib/listingPlans/businessQuickPlanSignal";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";
import type { QuickSalesCategory } from "./quickSalesCategories";

/** Canonical Servicios application under PublishAuthGateLayout. Not the Quick adapter. */
export const SERVICIOS_CANONICAL_INTAKE_PATH = "/publicar/servicios";

/** Customer Quick adapter — a different, shorter form. Staff must not open this as the doorway. */
export const SERVICIOS_QUICK_ADAPTER_PATH = "/publicar/negocio-rapido/servicios";

/** Checkpoint redirect — not a fillable application. */
export const SERVICIOS_CHECKPOINT_PATH = "/clasificados/publicar/servicios";

/**
 * Categories that sell the Quick $249 Simple / Full $399 Full pair.
 * The four pair families share one application per category; Quick vs Full is entitlement only.
 */
export const STAFF_BUSINESS_PAIR_CATEGORIES = ["servicios", "restaurantes", "autos", "bienes-raices"] as const;

/**
 * Do not apply $249/$399 here. These keep their existing category-specific products and prices.
 */
export const STAFF_BUSINESS_PAIR_EXCLUDED_CATEGORIES = [
  "rentas",
  "empleos",
  "autos-privado",
  "comida-local",
] as const;

/**
 * Canonical packages for families that are NOT the $249/$399 pair. Stamped on assisted custody
 * so publication evaluates the real category product, never a business-pair key.
 */
export const STAFF_CATEGORY_PRICED_PACKAGE_KEYS = {
  rentas: "rentas_30d",
  empleos: "empleos_job_post_paid",
  "autos-privado": "autos_privado_30d",
  "comida-local": "comida_local_base_monthly",
} as const;

export type StaffCategoryPricedFamily = keyof typeof STAFF_CATEGORY_PRICED_PACKAGE_KEYS;

export type StaffBusinessPlan = BusinessPlanChoice;

export type StaffBusinessOffer = {
  plan: StaffBusinessPlan;
  packageKey: string;
  access: Exclude<BusinessAccessLevel, "none">;
  priceCents: number;
};

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isStaffBusinessPairCategory(category: string | null | undefined): boolean {
  const key = trimmed(category).toLowerCase();
  return key in BUSINESS_CATEGORY_PACKAGE_PAIR;
}

/** True when $249/$399 must never be sold as this category's base pair. */
export function isStaffBusinessPairExcluded(category: string | null | undefined): boolean {
  const key = trimmed(category).toLowerCase();
  return (STAFF_BUSINESS_PAIR_EXCLUDED_CATEGORIES as readonly string[]).includes(key);
}

export function parseStaffBusinessPlan(value: unknown): StaffBusinessPlan | null {
  const raw = trimmed(value).toLowerCase();
  if (raw === "quick" || raw === "full") return raw;
  return null;
}

export function staffBusinessPlanFromPackageKey(
  category: string | null | undefined,
  packageKey: string | null | undefined,
): StaffBusinessPlan | null {
  const pair = BUSINESS_CATEGORY_PACKAGE_PAIR[trimmed(category).toLowerCase()];
  if (!pair) return null;
  const key = trimmed(packageKey).toLowerCase();
  if (!key) return null;
  if (key === pair.simple) return "quick";
  if (key === pair.full) return "full";
  return null;
}

export function staffBusinessPackageKeyForPlan(
  category: string | null | undefined,
  plan: StaffBusinessPlan,
): string | null {
  if (isStaffBusinessPairExcluded(category)) return null;
  return businessPackageKeyForPlan(category, plan);
}

export function staffCategoryPricedPackageKey(category: string | null | undefined): string | null {
  const key = trimmed(category).toLowerCase() as StaffCategoryPricedFamily;
  return STAFF_CATEGORY_PRICED_PACKAGE_KEYS[key] ?? null;
}

/**
 * Resolve the package the staff actor is selling. Body plan/key wins; otherwise the live cookie
 * is preserved (so a remint that only binds listingId cannot silently drop Full). Omitted on a
 * pair category fails safe to Quick — the lesser product — never to Full. Category-priced
 * families stamp their existing canonical package and never receive $249/$399.
 */
export function resolveStaffBusinessPackage(input: {
  category: string;
  requestedPlan?: unknown;
  requestedPackageKey?: unknown;
  livePackageKey?: unknown;
}): { ok: true; plan: StaffBusinessPlan; packageKey: string } | { ok: false; error: "invalid_package_key" } | { ok: true; plan: null; packageKey: string | null } {
  const category = trimmed(input.category).toLowerCase();
  if (isStaffBusinessPairExcluded(category) || !isStaffBusinessPairCategory(category)) {
    const priced = staffCategoryPricedPackageKey(category);
    const requestedKey = trimmed(input.requestedPackageKey);
    if (requestedKey) {
      if (priced && requestedKey.toLowerCase() !== priced) return { ok: false, error: "invalid_package_key" };
      if (!priced) return { ok: false, error: "invalid_package_key" };
    }
    const liveKey = trimmed(input.livePackageKey);
    if (liveKey && priced && liveKey.toLowerCase() === priced) {
      return { ok: true, plan: null, packageKey: priced };
    }
    return { ok: true, plan: null, packageKey: priced };
  }

  const requestedKey = trimmed(input.requestedPackageKey);
  if (requestedKey) {
    const plan = staffBusinessPlanFromPackageKey(category, requestedKey);
    if (!plan) return { ok: false, error: "invalid_package_key" };
    return { ok: true, plan, packageKey: requestedKey.toLowerCase() };
  }

  const requestedPlan = parseStaffBusinessPlan(input.requestedPlan);
  if (requestedPlan) {
    const packageKey = staffBusinessPackageKeyForPlan(category, requestedPlan);
    if (!packageKey) return { ok: false, error: "invalid_package_key" };
    return { ok: true, plan: requestedPlan, packageKey };
  }

  const liveKey = trimmed(input.livePackageKey);
  if (liveKey) {
    const plan = staffBusinessPlanFromPackageKey(category, liveKey);
    if (plan) return { ok: true, plan, packageKey: liveKey.toLowerCase() };
  }

  const packageKey = staffBusinessPackageKeyForPlan(category, "quick");
  if (!packageKey) return { ok: false, error: "invalid_package_key" };
  return { ok: true, plan: "quick", packageKey };
}

export function staffBusinessOffer(category: string, plan: StaffBusinessPlan): StaffBusinessOffer | null {
  const packageKey = staffBusinessPackageKeyForPlan(category, plan);
  if (!packageKey) return null;
  const def = getRevenuePackageDefinition(packageKey);
  if (!def) return null;
  return {
    plan,
    packageKey,
    access: plan === "quick" ? "simple" : "full",
    priceCents: def.priceCents,
  };
}

export function staffBusinessOffers(category: string): StaffBusinessOffer[] {
  const quick = staffBusinessOffer(category, "quick");
  const full = staffBusinessOffer(category, "full");
  return [quick, full].filter((o): o is StaffBusinessOffer => Boolean(o));
}

/** The EXISTING canonical Servicios application, with the Quick marker only when selling Simple. */
export function staffServiciosIntakeHref(plan: StaffBusinessPlan): string {
  return plan === "quick" ? withQuickPlanParam(SERVICIOS_CANONICAL_INTAKE_PATH) : SERVICIOS_CANONICAL_INTAKE_PATH;
}

export function staffIntakePathForCategory(
  category: QuickSalesCategory,
  plan: StaffBusinessPlan | null,
  fallback: string,
): string {
  const base = trimmed(fallback) || SERVICIOS_CANONICAL_INTAKE_PATH;
  if (isStaffBusinessPairCategory(category) && plan === "quick") return withQuickPlanParam(base);
  return base;
}

export function staffManualPaymentHref(input: {
  listingId?: string | null;
  packageKey?: string | null;
  category?: string | null;
}): string {
  const params = new URLSearchParams();
  const listingId = trimmed(input.listingId);
  const packageKey = trimmed(input.packageKey);
  const category = trimmed(input.category);
  if (listingId) params.set("listingId", listingId);
  if (packageKey) params.set("packageKey", packageKey);
  if (category) params.set("category", category);
  const qs = params.toString();
  return qs
    ? `/admin/workspace/payment-tracker/manual-payment?${qs}`
    : "/admin/workspace/payment-tracker/manual-payment";
}
