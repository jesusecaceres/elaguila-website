/**
 * Category schema/config layer for Clasificados.
 * Drives: plan eligibility, posting steps, form field groups, subcategories,
 * preview/pro preview, business branch, lifecycle, moderation.
 *
 * REAL ESTATE ARCHITECTURE:
 * - RENTAS = rentals only (individuals, agents, companies all post rentals; renta mensual, depósito, etc.).
 *   Business branch here = "business posting rentals" (not the sales lane).
 * - EN VENTA = will host professional real-estate SALES (homes, condos, multifamily, land, commercial,
 *   industrial, business presence). Same business contract (seller_type, business_name, business_meta)
 *   will be reused there when the sales lane is built.
 */

import { categoryConfig, type CategoryKey } from "./categoryConfig";
import { EN_VENTA_SUBCATEGORIES as EN_VENTA_SUBCATEGORIES_FROM_TAXONOMY } from "./enVentaTaxonomy";
import { RENTAS_SUBCATEGORIES as RENTAS_SUBCATEGORIES_FROM_TAXONOMY } from "./rentasTaxonomy";

/** Plan types for listing/seller eligibility. */
export type PlanType =
  | "free"
  | "pro"
  | "business_standard"
  | "business_plus";

/** Listing/seller type (e.g. consumer vs dealership vs business). */
export type ListingType = "consumer" | "dealership" | "business";

/** Posting flow step. Rentas adds "rentas-track" (privado vs negocio = business posting rentals) between category and basics. */
export type PublishStep = "category" | "rentas-track" | "basics" | "details" | "media";

/** Validation rule reference (key only; rules implemented per category/form). */
export type ValidationRuleKey = string;

/** Subcategory stub for future wiring (e.g. En Venta ramas). */
export type SubcategoryStub = {
  key: string;
  label: { es: string; en: string };
};

/** Lifecycle rule reference (e.g. expiry, renewal). */
export type LifecycleRuleKey = string;

/** Moderation flag reference. */
export type ModerationFlagKey = string;

export type CategorySchema = {
  /** Category key (must match CategoryKey). */
  key: CategoryKey;
  /** Display label (from categoryConfig). */
  label: { es: string; en: string };
  /** Plan eligibility: which plans can post in this category. */
  plans: PlanType[];
  /** Listing/seller types allowed (e.g. consumer + dealership for autos). Omit = consumer only. */
  listingTypes?: ListingType[];
  /** Pricing / plan mapping (future). */
  pricing?: Record<PlanType, unknown>;
  /** Top-level subcategories (e.g. En Venta ramas). Ready for form/display wiring. */
  subcategories?: SubcategoryStub[];
  /** Form field group key: references which detail fields to show (e.g. "en-venta"). */
  formFieldGroupKey?: string;
  /** Validation rule keys for this category. */
  validationRules?: ValidationRuleKey[];
  /** Whether free preview is available. */
  previewEligible: boolean;
  /** Whether Pro preview CTA is available. */
  proPreviewEligible: boolean;
  /** Whether business branch (standard/plus) is eligible. */
  businessBranchEligible: boolean;
  /** Posting step order. En Venta: category → basics → media (no details step). Others: category → basics → details → media. */
  stepOrder: PublishStep[];
  /** Lifecycle rules (e.g. expiry). */
  lifecycle?: LifecycleRuleKey[];
  /** Moderation flags. */
  moderation?: ModerationFlagKey[];
};

const PUBLISH_STEPS_FULL: PublishStep[] = ["category", "basics", "details", "media"];
const PUBLISH_STEPS_EN_VENTA: PublishStep[] = ["category", "basics", "media"];
/** Rentas: track selection (Privado vs Negocio + plan) before basics. */
const PUBLISH_STEPS_RENTAS: PublishStep[] = ["category", "rentas-track", "basics", "details", "media"];

/** En Venta subcategories from taxonomy (single source of truth). */
const EN_VENTA_SUBCATEGORIES: SubcategoryStub[] = EN_VENTA_SUBCATEGORIES_FROM_TAXONOMY.map((s) => ({
  key: s.key,
  label: s.label,
}));

/** Rentas subcategories from taxonomy. */
const RENTAS_SUBCATEGORIES: SubcategoryStub[] = RENTAS_SUBCATEGORIES_FROM_TAXONOMY.map((s) => ({
  key: s.key,
  label: s.label,
}));

/** Build schema entry for a category; label from categoryConfig. */
function schema(
  key: CategoryKey,
  overrides: Omit<CategorySchema, "key" | "label">
): CategorySchema {
  const config = categoryConfig[key];
  return {
    key,
    label: config?.label ?? { es: key, en: key },
    ...overrides,
  };
}

/** Category schemas: En Venta = first production template; others = eligibility + stubs. */
const CATEGORY_SCHEMAS: Record<Exclude<CategoryKey, "all">, CategorySchema> = {
  "en-venta": schema("en-venta", {
    plans: ["free", "pro"],
    subcategories: EN_VENTA_SUBCATEGORIES,
    formFieldGroupKey: "en-venta",
    validationRules: ["en_venta_meta"],
    previewEligible: true,
    proPreviewEligible: true,
    businessBranchEligible: false, // future: true for real-estate sales lane (same business contract as rentas)
    stepOrder: PUBLISH_STEPS_EN_VENTA,
  }),
  rentas: schema("rentas", {
    plans: ["pro", "business_standard", "business_plus"],
    businessBranchEligible: true, // business posting RENTALS only (not sales)
    formFieldGroupKey: "rentas",
    subcategories: RENTAS_SUBCATEGORIES,
    validationRules: ["rentas_meta"],
    previewEligible: true,
    proPreviewEligible: true,
    stepOrder: PUBLISH_STEPS_RENTAS,
  }),
  autos: schema("autos", {
    plans: ["free", "pro"],
    listingTypes: ["consumer", "dealership"],
    businessBranchEligible: true,
    formFieldGroupKey: "autos",
    previewEligible: true,
    proPreviewEligible: true,
    stepOrder: PUBLISH_STEPS_FULL,
  }),
  servicios: schema("servicios", {
    plans: ["business_standard", "business_plus"],
    businessBranchEligible: true,
    formFieldGroupKey: "servicios",
    previewEligible: true,
    proPreviewEligible: true,
    stepOrder: PUBLISH_STEPS_FULL,
  }),
  restaurantes: schema("restaurantes", {
    plans: ["business_standard", "business_plus"],
    businessBranchEligible: true,
    formFieldGroupKey: "restaurantes",
    previewEligible: true,
    proPreviewEligible: true,
    stepOrder: PUBLISH_STEPS_FULL,
  }),
  empleos: schema("empleos", {
    plans: ["pro"],
    businessBranchEligible: false,
    formFieldGroupKey: "empleos",
    previewEligible: true,
    proPreviewEligible: true,
    stepOrder: PUBLISH_STEPS_FULL,
  }),
  clases: schema("clases", {
    plans: ["free", "pro"],
    businessBranchEligible: false,
    formFieldGroupKey: "clases",
    previewEligible: true,
    proPreviewEligible: true,
    stepOrder: PUBLISH_STEPS_FULL,
  }),
  comunidad: schema("comunidad", {
    plans: ["free"],
    businessBranchEligible: false,
    formFieldGroupKey: "comunidad",
    previewEligible: true,
    proPreviewEligible: false,
    stepOrder: PUBLISH_STEPS_FULL,
  }),
  travel: schema("travel", {
    plans: ["business_standard", "business_plus"],
    businessBranchEligible: true,
    formFieldGroupKey: "travel",
    previewEligible: true,
    proPreviewEligible: true,
    stepOrder: PUBLISH_STEPS_FULL,
  }),
};

/** Publishable categories (exclude "all"). */
export type PublishableCategoryKey = Exclude<CategoryKey, "all">;

/** Get category schema. Returns undefined for "all" or unknown. */
export function getCategorySchema(
  key: string
): CategorySchema | undefined {
  if (key === "all") return undefined;
  const k = key as PublishableCategoryKey;
  return CATEGORY_SCHEMAS[k];
}

/** Get allowed plan types for a category. */
export function getPlansForCategory(key: string): PlanType[] {
  const schema = getCategorySchema(key);
  return schema?.plans ?? [];
}

/** Get posting step order for a category. Defaults to full order (category → basics → details → media). */
export function getStepOrderForCategory(key: string): PublishStep[] {
  const schema = getCategorySchema(key);
  return schema?.stepOrder ?? PUBLISH_STEPS_FULL;
}

/** Whether category supports free plan. */
export function categoryAllowsFree(key: string): boolean {
  return getPlansForCategory(key).includes("free");
}

/** Whether category supports Pro plan. */
export function categoryAllowsPro(key: string): boolean {
  return getPlansForCategory(key).includes("pro");
}

/** Whether category supports business branch (standard/plus). */
export function categoryAllowsBusinessBranch(key: string): boolean {
  const s = getCategorySchema(key);
  return s?.businessBranchEligible ?? false;
}
