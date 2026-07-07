import { PACKAGE_ENTITLEMENT_CATEGORIES, PACKAGE_ENTITLEMENT_CONTRACT_TERMS, PACKAGE_ENTITLEMENT_PROMO_CODE_TYPES, PACKAGE_ENTITLEMENT_TIERS } from "./packageEntitlementConstants";
import { REVENUE_V1_PACKAGE_MATRIX } from "@/app/lib/listingPlans/revenuePricingMatrix";

export const PROMO_CODE_TRACKER_FETCH_LIMIT = 150;

export const PROMO_CODE_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
  { value: "redeemed", label: "Redeemed" },
] as const;

export const PROMO_CODE_TYPES = PACKAGE_ENTITLEMENT_PROMO_CODE_TYPES;

export const PROMO_CODE_CATEGORIES = PACKAGE_ENTITLEMENT_CATEGORIES;

export const PROMO_CODE_PACKAGE_TIERS = PACKAGE_ENTITLEMENT_TIERS;

export const PROMO_CODE_CONTRACT_TERMS = PACKAGE_ENTITLEMENT_CONTRACT_TERMS;

export type PromoPackageScopeOption = { value: string; label: string };

/**
 * Revenue OS package scope options for the Promo Admin OS dropdown.
 * Derived from the canonical Revenue OS pricing matrix — only paid, promo- and
 * Stripe-eligible package keys are selectable. Offers/coupon add-on keys are
 * excluded because Revenue OS checkout cannot charge them yet. A blank value
 * keeps category-only (any package) codes possible.
 */
export const PROMO_CODE_PACKAGE_SCOPE_OPTIONS: PromoPackageScopeOption[] = [
  { value: "", label: "Any package (category-only code)" },
  ...REVENUE_V1_PACKAGE_MATRIX.filter(
    (p) =>
      p.promoEligible &&
      p.stripeEligible &&
      p.priceCents > 0 &&
      !p.packageKey.endsWith("_offers_addon"),
  ).map((p) => ({ value: p.packageKey, label: `${p.packageKey} — ${p.label}` })),
];

export type PromoQuickPresetFields = {
  code_type?: string;
  promo_type?: string;
  percent_off?: string;
  amount_off_dollars?: string;
  category?: string;
  package_scope?: string;
  status?: string;
  notes?: string;
  code_mode?: "auto" | "custom";
};

export type PromoQuickPreset = {
  id: string;
  label: string;
  /** Future/unsupported presets are shown but not selectable. */
  disabled?: boolean;
  fields?: PromoQuickPresetFields;
};

/**
 * Quick-create presets for Chuy so routine discount codes need no manual typing.
 * Only Restaurante (fully wired in Revenue OS checkout) and a general category-only
 * discount are enabled. Servicios / Bienes Raíces presets are shown as "coming later"
 * so the UI never fakes readiness for categories not yet wired end to end.
 */
export const PROMO_CODE_QUICK_PRESETS: PromoQuickPreset[] = [
  { id: "custom", label: "Custom discount code" },
  {
    id: "restaurante_launch_25",
    label: "Restaurante launch 25%",
    fields: {
      code_type: "discount",
      promo_type: "percent_off",
      percent_off: "25",
      category: "restaurantes",
      package_scope: "restaurantes_base_monthly",
      status: "active",
      code_mode: "auto",
      notes: "Restaurante launch — 25% off base monthly ($399/mo) plan. Code auto-generated on save.",
    },
  },
  {
    id: "restaurante_qa_25",
    label: "Restaurante QA 25%",
    fields: {
      code_type: "discount",
      promo_type: "percent_off",
      percent_off: "25",
      category: "restaurantes",
      package_scope: "restaurantes_base_monthly",
      status: "active",
      code_mode: "auto",
      notes: "Restaurante QA — 25% off base monthly for launch verification.",
    },
  },
  { id: "servicios_launch_25", label: "Servicios launch 25% (coming later)", disabled: true },
  { id: "bienes_raices_launch_25", label: "Bienes Raíces negocio launch 25% (coming later)", disabled: true },
  {
    id: "general_launch_25",
    label: "General launch discount (25%, any package)",
    fields: {
      code_type: "discount",
      promo_type: "percent_off",
      percent_off: "25",
      package_scope: "",
      status: "active",
      code_mode: "auto",
      notes: "General launch — 25% off, category-only (no package scope lock).",
    },
  },
  {
    id: "newsletter_launch_25",
    label: "Newsletter launch 25% (draft — email send later)",
    fields: {
      code_type: "newsletter",
      promo_type: "percent_off",
      percent_off: "25",
      status: "draft",
      code_mode: "auto",
      notes:
        "Newsletter launch — unique one-time code for subscriber identity. Email sending is a later gate unless email pipeline is active.",
    },
  },
];
