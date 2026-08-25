/**
 * Revenue OS V1 category/package pricing matrix (pure read model).
 * Gate STRIPE-REVENUE-OS-PACKAGE-KEY-ALIGNMENT-01 — canonical package keys; no DB, Stripe, or env.
 */

/** Publicar empleo — regular paid job post (Stripe + promo eligible). */
export const EMPLEOS_JOB_POST_PAID_PACKAGE_KEY = "empleos_job_post_paid";

/** Publicar feria de empleos — always free (no Stripe, no promo). */
export const EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY = "empleos_job_fair_free";

export const OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY = "ofertas_locales_flyer_30d";
/** Historical/retired — see ofertas_locales_coupons_free below (owner lock 2026-08-25). */
export const OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY = "ofertas_locales_coupons_30d";
/** Package 2 — owner lock 2026-08-25: canonical FREE basic community coupon package. */
export const OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY = "ofertas_locales_coupons_free";
/** Package 2 — owner lock 2026-08-25: canonical FREE Viajes business/community package. */
export const VIAJES_BUSINESS_FREE_PACKAGE_KEY = "viajes_business_free";

export type RevenueBillingMode =
  | "one_time"
  | "monthly_subscription"
  | "free"
  | "affiliate";

export type RevenueCustomerType =
  | "private_seller"
  | "dealer_business"
  | "agent_business"
  | "employer"
  | "restaurant_business"
  | "service_business"
  | "travel_business"
  | "community"
  | "affiliate";

export type RevenuePackageDefinition = {
  category: string;
  packageKey: string;
  customerType: RevenueCustomerType;
  /** Category-specific pipeline slug (e.g. empleos job_post vs job_fair). */
  pipeline?: string | null;
  label: string;
  priceCents: number;
  billingMode: RevenueBillingMode;
  durationDays: number | null;
  includedInventory: string;
  addOnInventory: string | null;
  promoEligible: boolean;
  printCompEligible: boolean;
  placementEligible: boolean;
  /** Future Stripe Checkout session eligibility. */
  stripeEligible: boolean;
  /** Revenue OS placement tier key when placement applies. */
  placementTierKey?: string | null;
  /** Owner decision not yet locked in repo. */
  unresolvedOwnerDecision: string | null;
  /**
   * Package C Build 2 (C4) — verified 15% introductory discount eligibility. Defaults to true
   * whenever `promoEligible` is true; set explicitly `false` to exclude a package (e.g. a future
   * Premium print package) regardless of its promo-code eligibility. Data-driven so exclusion
   * never depends on a hardcoded price check.
   */
  verifiedIntroDiscountEligible?: boolean;
  /**
   * Package C Build 3 (C5/C6) — data-driven capability grants this package includes, resolved
   * by resolveCategoryListingPlan()/resolveBusinessToolsAccess() (categoryCommercialPlan.ts).
   * Additive, config-driven — never inferred from placement, verification, or account tier.
   */
  capabilities?: string[];
  /**
   * Package C Build 3 (C5/C6) — true when this package can no longer be purchased (new sales),
   * while the definition itself stays resolvable for historical price/label reads. The actual
   * sale-blocking enforcement is `stripeEligible: false` / `promoEligible: false` on the same
   * entry (read by the existing generic checkout/promo validators) — this flag is documentation
   * and the basis for a cheap route-level defense-in-depth check, not a second guard mechanism.
   */
  newSalesRetired?: boolean;
};

// Package C Build 1 — owner-locked in the Execution Bible v2: Autos boost $129/mo (+10),
// Bienes pack $99/mo (+3, max 4 total), FSBO $49.99/45d, offers add-ons $79/mo. Only the
// genuinely still-open decisions remain below. Package 3 (owner lock 2026-08-25): the former
// "Viajes business monthly pricing final lock" entry is resolved (retired for new sales, free
// package canonical) and removed; matrix entries reference the named constants rather than
// array positions so a resolved decision can be deleted without shifting the others.
export const REVENUE_UNRESOLVED_DECISION_RENTAS_SPLIT = "Rentas V1 negocio split confirmation";
export const REVENUE_UNRESOLVED_DECISION_LISTING_WINDOW =
  "Clases / Comunidad / Mascotas listing window duration";
export const REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS = [
  REVENUE_UNRESOLVED_DECISION_RENTAS_SPLIT,
  REVENUE_UNRESOLVED_DECISION_LISTING_WINDOW,
] as const;

export const REVENUE_V1_PACKAGE_MATRIX: RevenuePackageDefinition[] = [
  {
    category: "autos",
    packageKey: "autos_privado_30d",
    customerType: "private_seller",
    label: "Autos private 30-day",
    priceCents: 2499,
    billingMode: "one_time",
    durationDays: 30,
    includedInventory: "1 vehicle",
    addOnInventory: null,
    promoEligible: true,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: true,
    unresolvedOwnerDecision: null,
  },
  {
    category: "autos",
    packageKey: "autos_dealer_monthly",
    customerType: "dealer_business",
    label: "Autos dealer monthly",
    priceCents: 39900,
    billingMode: "monthly_subscription",
    durationDays: null,
    includedInventory: "10 active vehicles",
    addOnInventory: "+10 vehicles via autos_dealer_inventory_pack_monthly ($129/mo)",
    promoEligible: true,
    printCompEligible: true,
    placementEligible: true,
    stripeEligible: true,
    unresolvedOwnerDecision: null,
  },
  {
    category: "autos",
    packageKey: "autos_dealer_inventory_pack_monthly",
    customerType: "dealer_business",
    pipeline: "dealer_inventory_pack",
    label: "Autos dealer inventory pack monthly",
    priceCents: 12900,
    billingMode: "monthly_subscription",
    durationDays: null,
    includedInventory: "+10 additional active vehicles",
    addOnInventory: null,
    promoEligible: true,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: true,
    unresolvedOwnerDecision: null,
  },
  {
    category: "bienes-raices",
    packageKey: "br_agent_monthly",
    customerType: "agent_business",
    label: "Bienes Raíces agent monthly",
    priceCents: 39900,
    billingMode: "monthly_subscription",
    durationDays: null,
    includedInventory: "1 business/agent package",
    addOnInventory: "+3 properties via br_inventory_pack_monthly ($99/mo)",
    promoEligible: true,
    printCompEligible: true,
    placementEligible: true,
    stripeEligible: true,
    unresolvedOwnerDecision: null,
  },
  {
    category: "bienes-raices",
    packageKey: "br_inventory_pack_monthly",
    customerType: "agent_business",
    label: "Bienes Raíces inventory pack monthly",
    priceCents: 9900,
    billingMode: "monthly_subscription",
    durationDays: null,
    includedInventory: "+3 additional properties",
    addOnInventory: null,
    promoEligible: false,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: true,
    unresolvedOwnerDecision: null,
  },
  {
    category: "bienes-raices",
    packageKey: "br_fsbo_45d",
    customerType: "private_seller",
    label: "Bienes Raíces FSBO 45-day",
    priceCents: 4999,
    billingMode: "one_time",
    durationDays: 45,
    includedInventory: "1 listing",
    addOnInventory: null,
    promoEligible: true,
    printCompEligible: false,
    placementEligible: true,
    stripeEligible: true,
    unresolvedOwnerDecision: null,
  },
  {
    category: "rentas",
    packageKey: "rentas_30d",
    customerType: "private_seller",
    label: "Rentas 30-day",
    priceCents: 2499,
    billingMode: "one_time",
    durationDays: 30,
    includedInventory: "1 listing",
    addOnInventory: null,
    promoEligible: true,
    printCompEligible: false,
    placementEligible: true,
    stripeEligible: true,
    unresolvedOwnerDecision: REVENUE_UNRESOLVED_DECISION_RENTAS_SPLIT,
  },
  {
    category: "restaurantes",
    packageKey: "restaurantes_base_monthly",
    customerType: "restaurant_business",
    label: "Restaurantes base monthly",
    priceCents: 39900,
    billingMode: "monthly_subscription",
    durationDays: null,
    includedInventory: "1 profile/listing",
    addOnInventory: null,
    promoEligible: true,
    printCompEligible: true,
    placementEligible: true,
    stripeEligible: true,
    unresolvedOwnerDecision: null,
    // Package C Build 3 (C5/C6) — owner-locked: coupons/offers are now INCLUDED in the $399
    // base package (supersedes the retired restaurantes_offers_addon $79 add-on below).
    capabilities: ["coupons_offers"],
  },
  {
    category: "restaurantes",
    packageKey: "restaurantes_offers_addon",
    customerType: "restaurant_business",
    label: "Restaurantes offers add-on (retired — included in base package)",
    priceCents: 7900,
    billingMode: "monthly_subscription",
    durationDays: null,
    includedInventory: "coupons/offers module",
    addOnInventory: null,
    // Package C Build 3 (C5/C6) — retired for new sales: coupons/offers are now included in
    // restaurantes_base_monthly. Definition kept (never deleted) so historical payment/
    // entitlement/promo rows still resolve labels and price. stripeEligible/promoEligible
    // false is the actual central guard (read by validateRevenueCheckoutRequest and the promo
    // resolver); newSalesRetired is documentation + a cheap route-level defense-in-depth check.
    promoEligible: false,
    printCompEligible: true,
    placementEligible: true,
    stripeEligible: false,
    unresolvedOwnerDecision: null,
    capabilities: [],
    newSalesRetired: true,
  },
  {
    category: "servicios",
    packageKey: "servicios_base_monthly",
    customerType: "service_business",
    label: "Servicios base monthly",
    priceCents: 39900,
    billingMode: "monthly_subscription",
    durationDays: null,
    includedInventory: "1 profile/listing",
    addOnInventory: null,
    promoEligible: true,
    printCompEligible: true,
    placementEligible: true,
    stripeEligible: true,
    unresolvedOwnerDecision: null,
    // Package C Build 3 (C5/C6) — owner-locked: coupons/offers are now INCLUDED in the $399
    // base package (supersedes the retired servicios_offers_addon $79 add-on below).
    capabilities: ["coupons_offers"],
  },
  {
    category: "servicios",
    packageKey: "servicios_offers_addon",
    customerType: "service_business",
    label: "Servicios offers add-on (retired — included in base package)",
    priceCents: 7900,
    billingMode: "monthly_subscription",
    durationDays: null,
    includedInventory: "coupons/offers module",
    addOnInventory: null,
    // Package C Build 3 (C5/C6) — retired for new sales; see restaurantes_offers_addon above.
    promoEligible: false,
    printCompEligible: true,
    placementEligible: true,
    stripeEligible: false,
    unresolvedOwnerDecision: null,
    capabilities: [],
    newSalesRetired: true,
  },
  {
    category: "empleos",
    packageKey: EMPLEOS_JOB_POST_PAID_PACKAGE_KEY,
    customerType: "employer",
    pipeline: "job_post",
    label: "Empleos job post (Publicar empleo)",
    priceCents: 2499,
    billingMode: "one_time",
    durationDays: 30,
    includedInventory: "1 job post",
    addOnInventory: null,
    promoEligible: true,
    printCompEligible: false,
    placementEligible: true,
    stripeEligible: true,
    placementTierKey: "paid_private",
    unresolvedOwnerDecision: null,
  },
  {
    category: "ofertas-locales",
    packageKey: OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY,
    customerType: "service_business",
    pipeline: "interactive_flyer",
    label: "Ofertas Locales interactive flyer 30-day",
    priceCents: 39900,
    billingMode: "one_time",
    durationDays: 30,
    includedInventory: "1 interactive flyer listing; AI extraction/review, searchable products, flyer page, product cards, and shopping list included",
    addOnInventory: null,
    promoEligible: false,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: true,
    unresolvedOwnerDecision: null,
  },
  {
    // Owner lock 2026-08-25: basic Leonix community coupons are free for new publishing.
    // Historical $199 package retained for audit/history only — see
    // ofertas_locales_coupons_free below for the current canonical free package.
    category: "ofertas-locales",
    packageKey: OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY,
    customerType: "service_business",
    pipeline: "coupons",
    label: "Cupones Leonix 30-day (retired — new publishing is free)",
    priceCents: 19900,
    billingMode: "one_time",
    durationDays: 30,
    includedInventory: "1 coupon or promotion listing; AI extraction/review and public coupon result/detail included",
    addOnInventory: null,
    // stripeEligible/promoEligible false is the actual central guard (read by
    // validateRevenueCheckoutRequest and the promo resolver); newSalesRetired is documentation
    // + the route-level defense-in-depth check in app/api/revenue-os/checkout/route.ts.
    promoEligible: false,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: false,
    unresolvedOwnerDecision: null,
    newSalesRetired: true,
  },
  {
    // Owner lock 2026-08-25: canonical FREE basic community coupon package. Free does NOT mean
    // Featured/Premium placement, homepage placement, Business Tools, paid ranking, a managed
    // campaign, the interactive flyer, magazine placement, or sponsored content — those remain
    // exclusively part of the paid ofertas_locales_flyer_30d product and the paid Restaurante/
    // Servicios base packages' bundled coupons_offers capability.
    category: "ofertas-locales",
    packageKey: OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY,
    customerType: "service_business",
    pipeline: "coupons",
    label: "Leonix community coupon — free",
    priceCents: 0,
    billingMode: "free",
    // Content/offer validity lifecycle, NOT a billing duration (there is no billing) — mirrors
    // the same 30-day public-term lifecycle the paid coupon product used
    // (OFERTAS_LOCALES_PUBLIC_TERM_DAYS in ofertasLocalesConstants.ts). Free-to-publish does not
    // mean a coupon may claim an untruthful/indefinite expiration.
    durationDays: 30,
    includedInventory: "1 coupon or promotion submission",
    addOnInventory: null,
    promoEligible: false,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: false,
    placementTierKey: "free",
    unresolvedOwnerDecision: null,
  },
  {
    category: "empleos",
    packageKey: EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY,
    customerType: "employer",
    pipeline: "job_fair",
    label: "Empleos job fair (Publicar feria de empleos)",
    priceCents: 0,
    billingMode: "free",
    durationDays: null,
    includedInventory: "event participation",
    addOnInventory: null,
    promoEligible: false,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: false,
    placementTierKey: "free",
    unresolvedOwnerDecision: "Job fair is always free — no Stripe or promo required",
  },
  {
    category: "en-venta",
    packageKey: "en_venta_free_v1",
    customerType: "private_seller",
    label: "En Venta free V1",
    priceCents: 0,
    billingMode: "free",
    durationDays: null,
    includedInventory: "1 listing",
    addOnInventory: null,
    promoEligible: false,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: false,
    unresolvedOwnerDecision: "Legacy Pro fields documented but inactive in V1",
  },
  {
    category: "clases",
    packageKey: "clases_paid_30d",
    customerType: "community",
    label: "Clases paid 30-day",
    priceCents: 2499,
    billingMode: "one_time",
    durationDays: 30,
    includedInventory: "1 class",
    addOnInventory: null,
    promoEligible: true,
    printCompEligible: false,
    placementEligible: true,
    stripeEligible: true,
    placementTierKey: "paid_private",
    unresolvedOwnerDecision: REVENUE_UNRESOLVED_DECISION_LISTING_WINDOW,
  },
  {
    category: "clases",
    packageKey: "clases_free",
    customerType: "community",
    label: "Clases free",
    priceCents: 0,
    billingMode: "free",
    durationDays: null,
    includedInventory: "1 class",
    addOnInventory: null,
    promoEligible: false,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: false,
    placementTierKey: "free",
    unresolvedOwnerDecision: REVENUE_UNRESOLVED_DECISION_LISTING_WINDOW,
  },
  {
    category: "comunidad",
    packageKey: "comunidad_free",
    customerType: "community",
    label: "Comunidad free",
    priceCents: 0,
    billingMode: "free",
    durationDays: null,
    includedInventory: "1 post",
    addOnInventory: null,
    promoEligible: false,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: false,
    placementTierKey: "free",
    unresolvedOwnerDecision: null,
  },
  {
    category: "mascotas-y-perdidos",
    packageKey: "mascotas_free",
    customerType: "community",
    label: "Mascotas y perdidos free",
    priceCents: 0,
    billingMode: "free",
    durationDays: null,
    includedInventory: "1 listing",
    addOnInventory: null,
    promoEligible: false,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: false,
    placementTierKey: "free",
    unresolvedOwnerDecision: null,
  },
  {
    category: "busco",
    packageKey: "busco_free",
    customerType: "community",
    label: "Busco / Se Busca free",
    priceCents: 0,
    billingMode: "free",
    durationDays: null,
    includedInventory: "1 request",
    addOnInventory: null,
    promoEligible: false,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: false,
    placementTierKey: "free",
    unresolvedOwnerDecision: null,
  },
  {
    // Owner lock 2026-08-25: Viajes business participation is free for new publishing.
    // Historical $399 package retained for audit/history only — see viajes_business_free below
    // for the current canonical free package. Historical printCompEligible/placementEligible
    // remain true here because they describe how PAST real payments were interpreted; they are
    // not read for any new sale once stripeEligible/promoEligible are false.
    category: "viajes",
    packageKey: "viajes_business_monthly",
    customerType: "travel_business",
    label: "Viajes business monthly (retired — new publishing is free)",
    priceCents: 39900,
    billingMode: "monthly_subscription",
    durationDays: null,
    includedInventory: "1 business/offer",
    addOnInventory: null,
    // stripeEligible/promoEligible false is the actual central guard (read by
    // validateRevenueCheckoutRequest and the promo resolver); newSalesRetired is documentation
    // + the route-level defense-in-depth check in app/api/revenue-os/checkout/route.ts. The
    // owner-lock decision this unresolvedOwnerDecision entry tracked is now resolved (retired
    // for new sales, replaced by the free package below) — set to null rather than reused.
    promoEligible: false,
    printCompEligible: true,
    placementEligible: true,
    stripeEligible: false,
    unresolvedOwnerDecision: null,
    newSalesRetired: true,
  },
  {
    // Owner lock 2026-08-25: canonical FREE Viajes business/community package. Product
    // doctrine: free to participate, curated for community value, reviewed before publication.
    // Free does NOT mean Featured/Premium placement or Business Tools — those are not granted
    // by this package.
    category: "viajes",
    packageKey: VIAJES_BUSINESS_FREE_PACKAGE_KEY,
    customerType: "travel_business",
    label: "Viajes business — free (community participation)",
    priceCents: 0,
    billingMode: "free",
    durationDays: null,
    includedInventory: "1 reviewed business/offer submission",
    addOnInventory: null,
    promoEligible: false,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: false,
    placementTierKey: "free",
    unresolvedOwnerDecision: null,
  },
  {
    category: "viajes",
    packageKey: "viajes_affiliate",
    customerType: "affiliate",
    label: "Viajes affiliate",
    priceCents: 0,
    billingMode: "affiliate",
    durationDays: null,
    includedInventory: "affiliate listing/offer",
    addOnInventory: null,
    promoEligible: false,
    printCompEligible: false,
    placementEligible: true,
    stripeEligible: false,
    placementTierKey: "affiliate",
    unresolvedOwnerDecision: "Commission tracking model separate from paid placement",
  },
];

export function listRevenuePackagesForCategory(category: string): RevenuePackageDefinition[] {
  const slug = String(category ?? "").trim().toLowerCase();
  return REVENUE_V1_PACKAGE_MATRIX.filter((p) => p.category === slug);
}

export function getRevenuePackageDefinition(
  packageKey: string,
): RevenuePackageDefinition | null {
  const key = String(packageKey ?? "").trim().toLowerCase();
  return REVENUE_V1_PACKAGE_MATRIX.find((p) => p.packageKey === key) ?? null;
}

export function isStripeEligiblePackageKey(packageKey: string | null | undefined): boolean {
  const def = getRevenuePackageDefinition(String(packageKey ?? ""));
  if (!def) return false;
  return def.stripeEligible === true;
}

export function isPromoEligiblePackageKey(packageKey: string | null | undefined): boolean {
  const def = getRevenuePackageDefinition(String(packageKey ?? ""));
  if (!def) return false;
  return def.promoEligible === true;
}

export function getRevenuePackagePriceCents(input: {
  category: string;
  packageKey: string;
  customerType?: RevenueCustomerType | string | null;
}): { priceCents: number | null; definition: RevenuePackageDefinition | null; warnings: string[] } {
  const warnings: string[] = [];
  const category = String(input.category ?? "").trim().toLowerCase();
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();
  const customerType = input.customerType
    ? String(input.customerType).trim().toLowerCase()
    : null;

  let matches = REVENUE_V1_PACKAGE_MATRIX.filter(
    (p) => p.category === category && p.packageKey === packageKey,
  );

  if (customerType) {
    matches = matches.filter((p) => p.customerType === customerType);
  }

  if (matches.length === 0) {
    warnings.push("No V1 package match for category/package/customer type.");
    return { priceCents: null, definition: null, warnings };
  }

  if (matches.length > 1) {
    warnings.push("Multiple V1 package matches — customer type required.");
  }

  const definition = matches[0];
  if (definition.unresolvedOwnerDecision) {
    warnings.push(`NEEDS OWNER FINAL LOCK: ${definition.unresolvedOwnerDecision}`);
  }

  return { priceCents: definition.priceCents, definition, warnings };
}

export function formatRevenuePriceLabel(priceCents: number, currency = "usd"): string {
  if (priceCents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(priceCents / 100);
}
