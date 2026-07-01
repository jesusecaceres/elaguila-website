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
  opts?: { finalAmountCents?: number | null },
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

  const amountCents =
    opts?.finalAmountCents != null && Number.isFinite(opts.finalAmountCents)
      ? Math.max(0, Math.floor(opts.finalAmountCents))
      : packageDef.priceCents;

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
