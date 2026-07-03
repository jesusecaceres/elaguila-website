/**
 * Revenue OS Checkout request validation and URL builders.
 * Gate STRIPE-REVENUE-OS-CHECKOUT-SESSION-01 — server-safe; matrix is source of truth for price.
 */

import {
  EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY,
  getRevenuePackageDefinition,
  isStripeEligiblePackageKey,
  type RevenuePackageDefinition,
} from "./revenuePricingMatrix";
import { RESTAURANTES_COUPON_ADDON_PACKAGE_KEY } from "./publishCheckoutCheckpoint";

export type RevenueCheckoutAddOnInput = {
  key: string;
  quantity?: number;
};

export type ValidatedRevenueCheckoutAddOn = {
  key: string;
  packageDef: RevenuePackageDefinition;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

/** Server-owned allowlist: base package → permitted add-on keys for that category. */
const CHECKOUT_ADDON_ALLOWLIST: Record<
  string,
  { category: string; basePackageKey: string; allowedKeys: readonly string[] }
> = {
  restaurantes: {
    category: "restaurantes",
    basePackageKey: "restaurantes_base_monthly",
    allowedKeys: [RESTAURANTES_COUPON_ADDON_PACKAGE_KEY],
  },
};

export function validateRevenueCheckoutAddOns(input: {
  category: string;
  basePackageKey: string;
  addOns?: RevenueCheckoutAddOnInput[] | null;
}):
  | { ok: true; addOns: ValidatedRevenueCheckoutAddOn[] }
  | { ok: false; code: string; message: string } {
  const category = String(input.category ?? "").trim().toLowerCase();
  const basePackageKey = String(input.basePackageKey ?? "").trim().toLowerCase();
  const raw = input.addOns ?? [];

  if (!raw.length) {
    return { ok: true, addOns: [] };
  }

  const allow = CHECKOUT_ADDON_ALLOWLIST[category];
  if (!allow || allow.basePackageKey !== basePackageKey) {
    return {
      ok: false,
      code: "add_ons_not_supported",
      message: "Add-ons are not supported for this category/package checkout.",
    };
  }

  const seen = new Set<string>();
  const validated: ValidatedRevenueCheckoutAddOn[] = [];

  for (const item of raw) {
    const key = String(item.key ?? "").trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) {
      return { ok: false, code: "duplicate_add_on", message: "Duplicate add-on key in request." };
    }
    seen.add(key);

    if (!allow.allowedKeys.includes(key)) {
      return { ok: false, code: "add_on_not_allowed", message: `Add-on key not allowed: ${key}` };
    }

    const packageDef = getRevenuePackageDefinition(key);
    if (!packageDef || packageDef.category !== category) {
      return {
        ok: false,
        code: "add_on_unknown",
        message: "Unknown add-on key or category mismatch.",
      };
    }

    if (!isStripeEligiblePackageKey(key) || packageDef.priceCents <= 0) {
      return {
        ok: false,
        code: "add_on_not_stripe_eligible",
        message: "Add-on is not eligible for Stripe Checkout.",
      };
    }

    const quantity = Math.max(1, Math.floor(Number(item.quantity ?? 1)));
    if (quantity !== 1) {
      return {
        ok: false,
        code: "add_on_invalid_quantity",
        message: "Add-on quantity must be 1 for this checkout.",
      };
    }

    validated.push({
      key,
      packageDef,
      quantity,
      unitPriceCents: packageDef.priceCents,
      lineTotalCents: packageDef.priceCents * quantity,
    });
  }

  return { ok: true, addOns: validated };
}

export function computeRevenueCheckoutSubtotalCents(
  basePackageDef: RevenuePackageDefinition,
  addOns: ValidatedRevenueCheckoutAddOn[],
): number {
  return basePackageDef.priceCents + addOns.reduce((sum, a) => sum + a.lineTotalCents, 0);
}

export type RevenueStripeLineItemBuild = {
  packageDef: RevenuePackageDefinition;
  unitAmountCents: number;
  quantity?: number;
};

/** Proportionally distribute final total across base + add-ons so Stripe sum matches server total. */
export function buildRevenueStripeLineItems(input: {
  basePackageDef: RevenuePackageDefinition;
  addOns: ValidatedRevenueCheckoutAddOn[];
  subtotalCents: number;
  finalAmountCents: number;
}): RevenueStripeLineItemBuild[] {
  const lines: { packageDef: RevenuePackageDefinition; fullCents: number }[] = [
    { packageDef: input.basePackageDef, fullCents: input.basePackageDef.priceCents },
    ...input.addOns.map((a) => ({ packageDef: a.packageDef, fullCents: a.lineTotalCents })),
  ];

  const subtotal = input.subtotalCents;
  const finalTotal = Math.max(0, Math.floor(input.finalAmountCents));

  if (subtotal <= 0 || lines.length === 0) {
    return [{ packageDef: input.basePackageDef, unitAmountCents: finalTotal, quantity: 1 }];
  }

  if (finalTotal >= subtotal) {
    return lines.map((line) => ({
      packageDef: line.packageDef,
      unitAmountCents: line.fullCents,
      quantity: 1,
    }));
  }

  let allocated = 0;
  return lines.map((line, index) => {
    if (index === lines.length - 1) {
      return {
        packageDef: line.packageDef,
        unitAmountCents: Math.max(0, finalTotal - allocated),
        quantity: 1,
      };
    }
    const share = Math.round((line.fullCents * finalTotal) / subtotal);
    allocated += share;
    return {
      packageDef: line.packageDef,
      unitAmountCents: Math.max(0, share),
      quantity: 1,
    };
  });
}

export type RevenueCheckoutRequest = {
  category: string;
  packageKey: string;
  listingId?: string | null;
  listingDraftId?: string | null;
  leonixAdId?: string | null;
  ownerUserId?: string | null;
  customerEmail?: string | null;
  promoCode?: string | null;
  locale?: "es" | "en" | null;
  returnPath?: string | null;
  addOns?: RevenueCheckoutAddOnInput[] | null;
};

export type RevenueCheckoutValidationError = {
  ok: false;
  code: string;
  message: string;
};

export type RevenueCheckoutValidationSuccess = {
  ok: true;
  packageDef: RevenuePackageDefinition;
  listingRef: string;
  amountCents: number;
  subtotalCents: number;
  addOns: ValidatedRevenueCheckoutAddOn[];
  currency: "usd";
  stripeMode: "payment" | "subscription";
};

export type RevenueCheckoutValidationResult =
  | RevenueCheckoutValidationError
  | RevenueCheckoutValidationSuccess;

export function resolveCheckoutPackage(
  category: string,
  packageKey: string,
): RevenuePackageDefinition | null {
  const cat = String(category ?? "").trim().toLowerCase();
  const key = String(packageKey ?? "").trim().toLowerCase();
  const def = getRevenuePackageDefinition(key);
  if (!def || def.category !== cat) return null;
  return def;
}

export function validateRevenueCheckoutRequest(
  input: RevenueCheckoutRequest,
  opts?: { finalAmountCents?: number | null; validatedAddOns?: ValidatedRevenueCheckoutAddOn[] },
): RevenueCheckoutValidationResult {
  const category = String(input.category ?? "").trim().toLowerCase();
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();

  if (!category) {
    return { ok: false, code: "invalid_category", message: "Category is required." };
  }
  if (!packageKey) {
    return { ok: false, code: "invalid_package_key", message: "Package key is required." };
  }

  const listingRef =
    String(input.listingId ?? "").trim() ||
    String(input.listingDraftId ?? "").trim();
  if (!listingRef) {
    return {
      ok: false,
      code: "listing_required",
      message: "listingId or listingDraftId is required.",
    };
  }

  if (packageKey === EMPLEOS_JOB_FAIR_FREE_PACKAGE_KEY) {
    return {
      ok: false,
      code: "package_not_stripe_eligible",
      message: "Empleos job fair is always free — Stripe Checkout is not used.",
    };
  }

  const packageDef = resolveCheckoutPackage(category, packageKey);
  if (!packageDef) {
    return {
      ok: false,
      code: "package_category_mismatch",
      message: "Unknown package key or category/package mismatch.",
    };
  }

  if (!isStripeEligiblePackageKey(packageKey)) {
    return {
      ok: false,
      code: "package_not_stripe_eligible",
      message: "Package is not Stripe Checkout eligible.",
    };
  }

  if (packageDef.billingMode === "free" || packageDef.priceCents <= 0) {
    return {
      ok: false,
      code: "package_is_free",
      message: "Free packages cannot use Stripe Checkout.",
    };
  }

  const addOnResult = validateRevenueCheckoutAddOns({
    category,
    basePackageKey: packageKey,
    addOns: input.addOns,
  });
  if (!addOnResult.ok) {
    return addOnResult;
  }

  const addOns = opts?.validatedAddOns ?? addOnResult.addOns;
  const subtotalCents = computeRevenueCheckoutSubtotalCents(packageDef, addOns);

  const amountCents =
    opts?.finalAmountCents != null && Number.isFinite(opts.finalAmountCents)
      ? Math.max(0, Math.floor(opts.finalAmountCents))
      : subtotalCents;

  if (amountCents <= 0) {
    return {
      ok: false,
      code: "checkout_not_required",
      message: "Final amount is zero — Checkout not required (comp/deferred gate).",
    };
  }

  const stripeMode: "payment" | "subscription" =
    packageDef.billingMode === "monthly_subscription" ? "subscription" : "payment";

  return {
    ok: true,
    packageDef,
    listingRef,
    amountCents,
    subtotalCents,
    addOns,
    currency: "usd",
    stripeMode,
  };
}

export function getRevenueSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export function buildCheckoutSuccessUrl(input: {
  category: string;
  packageKey: string;
  locale?: "es" | "en" | null;
  returnPath?: string | null;
}): string {
  const origin = getRevenueSiteOrigin();
  const lang = input.locale === "en" ? "lang=en" : "lang=es";
  const returnQ = input.returnPath?.trim()
    ? `&return_to=${encodeURIComponent(input.returnPath.trim())}`
    : "";
  return `${origin}/revenue-os/pago/exito?session_id={CHECKOUT_SESSION_ID}&category=${encodeURIComponent(input.category)}&package_key=${encodeURIComponent(input.packageKey)}&${lang}${returnQ}`;
}

export function buildCheckoutCancelUrl(input: {
  category: string;
  packageKey: string;
  listingId: string;
  locale?: "es" | "en" | null;
}): string {
  const origin = getRevenueSiteOrigin();
  const lang = input.locale === "en" ? "lang=en" : "lang=es";
  return `${origin}/revenue-os/pago/cancelado?category=${encodeURIComponent(input.category)}&package_key=${encodeURIComponent(input.packageKey)}&listing_id=${encodeURIComponent(input.listingId)}&${lang}`;
}

export function isRevenueStripeEnvConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY?.trim();
}

export function isRevenueSupabaseAdminConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}
