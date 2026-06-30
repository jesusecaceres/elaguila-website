/**
 * Revenue OS V1 category/package pricing matrix (pure read model).
 * Gate STRIPE-REVENUE-OS-SCHEMA-AND-ENTITLEMENT-CONTRACT-01 — no DB, Stripe, or env.
 */

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
  label: string;
  priceCents: number;
  billingMode: RevenueBillingMode;
  durationDays: number | null;
  includedInventory: string;
  addOnInventory: string | null;
  promoEligible: boolean;
  printCompEligible: boolean;
  placementEligible: boolean;
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
    unresolvedOwnerDecision: REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[4],
  },
  {
    category: "empleos",
    packageKey: "empleos_job_30d",
    customerType: "employer",
    label: "Empleos job post 30-day",
    priceCents: 2499,
    billingMode: "one_time",
    durationDays: 30,
    includedInventory: "1 job post",
    addOnInventory: null,
    promoEligible: true,
    printCompEligible: false,
    placementEligible: true,
    unresolvedOwnerDecision: null,
  },
  {
    category: "empleos",
    packageKey: "empleos_job_fair",
    customerType: "employer",
    label: "Empleos job fair",
    priceCents: 0,
    billingMode: "free",
    durationDays: null,
    includedInventory: "event participation",
    addOnInventory: null,
    promoEligible: false,
    printCompEligible: false,
    placementEligible: false,
    unresolvedOwnerDecision: "Define event proof for job fair comp",
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
    unresolvedOwnerDecision: REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS[7],
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
    unresolvedOwnerDecision: "Commission tracking model separate from paid placement",
  },
];

export function listRevenuePackagesForCategory(category: string): RevenuePackageDefinition[] {
  const slug = String(category ?? "").trim().toLowerCase();
  return REVENUE_V1_PACKAGE_MATRIX.filter((p) => p.category === slug);
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
