/**
 * Category schema/config layer for Clasificados.
 * Drives: plan eligibility, posting steps, form field groups, subcategories,
 * preview/pro preview, business branch, lifecycle, moderation.
 * En Venta is the first production template; other categories have eligibility
 * and stubs ready for future wiring.
 */

import { categoryConfig, type CategoryKey } from "./categoryConfig";

/** Plan types for listing/seller eligibility. */
export type PlanType =
  | "free"
  | "pro"
  | "business_standard"
  | "business_plus";

/** Listing/seller type (e.g. consumer vs dealership vs business). */
export type ListingType = "consumer" | "dealership" | "business";

/** Posting flow step. Order is fixed: category → basics → (details if applicable) → media. */
export type PublishStep = "category" | "basics" | "details" | "media";

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

/** En Venta ramas (subcategories) — first production template. */
const EN_VENTA_SUBCATEGORIES: SubcategoryStub[] = [
  { key: "electronicos", label: { es: "Electrónicos", en: "Electronics" } },
  { key: "hogar", label: { es: "Hogar", en: "Home" } },
  { key: "muebles", label: { es: "Muebles", en: "Furniture" } },
  { key: "ropa-accesorios", label: { es: "Ropa y accesorios", en: "Clothing & accessories" } },
  { key: "bebes-ninos", label: { es: "Bebés y niños", en: "Babies & kids" } },
  { key: "herramientas", label: { es: "Herramientas", en: "Tools" } },
  { key: "auto-partes", label: { es: "Auto partes", en: "Auto parts" } },
  { key: "deportes", label: { es: "Deportes", en: "Sports" } },
  { key: "juguetes-juegos", label: { es: "Juguetes y juegos", en: "Toys & games" } },
  { key: "coleccionables", label: { es: "Coleccionables", en: "Collectibles" } },
  { key: "musica-foto-video", label: { es: "Música / foto / video", en: "Music / photo / video" } },
  { key: "otros", label: { es: "Otros", en: "Other" } },
];

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
    businessBranchEligible: false,
    stepOrder: PUBLISH_STEPS_EN_VENTA,
  }),
  rentas: schema("rentas", {
    plans: ["pro", "business_standard", "business_plus"],
    businessBranchEligible: true,
    formFieldGroupKey: "rentas",
    previewEligible: true,
    proPreviewEligible: true,
    stepOrder: PUBLISH_STEPS_FULL,
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
