/**
 * Revenue OS V1 category/package pricing matrix (pure read model).
 * Gate STRIPE-REVENUE-OS-PACKAGE-KEY-ALIGNMENT-01 — canonical package keys; no DB, Stripe, or env.
 */

/** Publicar empleo — regular paid job post (Stripe + promo eligible). */
export const EMPLEOS_JOB_POST_PAID_PACKAGE_KEY = "empleos_job_post_paid";

/** Publicar feria de empleos — always free (no Stripe, no promo). */
export const EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY = "empleos_job_fair_free";

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
};

export const REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS = [
  "Autos dealer +10 inventory add-on final price ($149/mo likely)",
  "Bienes Raices FSBO $49.99 final lock",
  "Bienes Raices +4 properties add-on final lock",
  "Restaurantes offers add-on $99/mo final lock",
  "Servicios offers add-on $99/mo final lock",
  "Viajes business monthly pricing final lock",
  "Rentas V1 negocio split confirmation",
  "Clases / Comunidad / Mascotas listing window duration",
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
    addOnInventory: "+10 vehicles add-on (price TBD)",
    promoEligible: true,
    printCompEligible: true,
    placementEligible: true,
    stripeEligible: true,
    unresolvedOwnerDecision: REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[0],
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
    addOnInventory: "+4 properties add-on (price TBD)",
    promoEligible: true,
    printCompEligible: true,
    placementEligible: true,
    stripeEligible: true,
    unresolvedOwnerDecision: REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[2],
  },
  {
    category: "bienes-raices",
    packageKey: "br_inventory_pack_monthly",
    customerType: "agent_business",
    label: "Bienes Raíces inventory pack monthly",
    priceCents: 9900,
    billingMode: "monthly_subscription",
    durationDays: null,
    includedInventory: "+4 additional properties",
    addOnInventory: null,
    promoEligible: false,
    printCompEligible: false,
    placementEligible: false,
    stripeEligible: true,
    unresolvedOwnerDecision: REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[2],
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
    unresolvedOwnerDecision: REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[1],
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
    unresolvedOwnerDecision: REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[6],
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
  },
  {
    category: "restaurantes",
    packageKey: "restaurantes_offers_addon",
    customerType: "restaurant_business",
    label: "Restaurantes offers add-on",
    priceCents: 9900,
    billingMode: "monthly_subscription",
    durationDays: null,
    includedInventory: "coupons/offers module",
    addOnInventory: null,
    promoEligible: true,
    printCompEligible: true,
    placementEligible: true,
    stripeEligible: true,
    unresolvedOwnerDecision: REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[3],
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
  },
  {
    category: "servicios",
    packageKey: "servicios_offers_addon",
    customerType: "service_business",
    label: "Servicios offers add-on",
    priceCents: 9900,
    billingMode: "monthly_subscription",
    durationDays: null,
    includedInventory: "coupons/offers module",
    addOnInventory: null,
    promoEligible: true,
    printCompEligible: true,
    placementEligible: true,
    stripeEligible: true,
    unresolvedOwnerDecision: REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[4],
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
    unresolvedOwnerDecision: REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[7],
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
    unresolvedOwnerDecision: REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[7],
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
    category: "viajes",
    packageKey: "viajes_business_monthly",
    customerType: "travel_business",
    label: "Viajes business monthly",
    priceCents: 39900,
    billingMode: "monthly_subscription",
    durationDays: null,
    includedInventory: "1 business/offer",
    addOnInventory: null,
    promoEligible: true,
    printCompEligible: true,
    placementEligible: true,
    stripeEligible: true,
    unresolvedOwnerDecision: REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[5],
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
