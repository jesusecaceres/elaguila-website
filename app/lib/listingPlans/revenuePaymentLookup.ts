/**
 * Revenue OS payment/entitlement read-only lookup — server-only.
 * Gate STRIPE-REVENUE-OS-ADMIN-USER-REVENUE-PROOF-01
 * Lookup only — never mutates payment or entitlement state.
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  loadPaymentRecordById,
  loadPaymentRecordByStripeSessionId,
  type LeonixPaymentRecordRow,
} from "./revenuePaymentRecords";
import {
  formatRevenueAmount,
  normalizeRevenuePaymentDisplayState,
  resolveRevenueCategoryLabel,
  resolveRevenuePackageLabel,
  revenueAdPlanBadgeLabel,
  type RevenueEntitlementDisplayState,
  type RevenuePaymentDisplayState,
} from "./revenueDisplay";
import { isPaymentCleared } from "./paymentTracking";
import {
  chunkListingIds,
  pickBestRevenueOsEntitlementByListingId,
  type RevenueOsEntitlementRow,
} from "./revenueOsEntitlementPrecedence";

export type RevenuePaymentProof = {
  found: boolean;
  paymentState: RevenuePaymentDisplayState;
  entitlementState: RevenueEntitlementDisplayState;
  paymentRecordId: string | null;
  stripeCheckoutSessionId: string | null;
  category: string | null;
  packageKey: string | null;
  packageLabel: string;
  categoryLabel: string;
  listingId: string | null;
  leonixAdId: string | null;
  amountDisplay: string | null;
  paidAt: string | null;
  entitlementEndsAt: string | null;
  adPlanBadge: string | null;
  promoRedemptionStatus: string | null;
  paymentSource: string | null;
  webhookBacked: boolean;
};

export type RevenuePaymentLookupInput = {
  stripeCheckoutSessionId?: string | null;
  paymentRecordId?: string | null;
  lang?: "en" | "es";
};

async function loadEntitlementForPayment(payment: LeonixPaymentRecordRow): Promise<{
  status: RevenueEntitlementDisplayState;
  endsAt: string | null;
  packageKey: string | null;
}> {
  if (!isSupabaseAdminConfigured()) {
    return { status: "missing", endsAt: null, packageKey: null };
  }

  const supabase = getAdminSupabase();
  let entitlementId = payment.package_entitlement_id;

  if (!entitlementId && payment.id) {
    const { data } = await supabase
      .from("listing_package_entitlements")
      .select("id, status, ends_at, package_key")
      .eq("payment_record_id", payment.id)
      .maybeSingle();
    if (data?.id) {
      return mapEntitlementRow(data as Record<string, unknown>);
    }
  }

  if (entitlementId) {
    const { data } = await supabase
      .from("listing_package_entitlements")
      .select("id, status, ends_at, package_key")
      .eq("id", entitlementId)
      .maybeSingle();
    if (data) return mapEntitlementRow(data as Record<string, unknown>);
  }

  if (isPaymentCleared(payment.payment_status)) {
    return { status: "pending", endsAt: null, packageKey: payment.package_key };
  }

  return { status: "missing", endsAt: null, packageKey: null };
}

function mapEntitlementRow(raw: Record<string, unknown>): {
  status: RevenueEntitlementDisplayState;
  endsAt: string | null;
  packageKey: string | null;
} {
  const status = String(raw.status ?? "").trim().toLowerCase();
  const endsAt = raw.ends_at != null ? String(raw.ends_at) : null;
  const packageKey = raw.package_key != null ? String(raw.package_key) : null;

  if (status === "active") {
    if (endsAt) {
      const end = new Date(endsAt);
      if (Number.isFinite(end.getTime()) && end.getTime() <= Date.now()) {
        return { status: "expired", endsAt, packageKey };
      }
    }
    return { status: "active", endsAt, packageKey };
  }
  if (status === "expired" || status === "revoked") {
    return { status: "expired", endsAt, packageKey };
  }
  return { status: "pending", endsAt, packageKey };
}

async function loadPromoRedemptionStatus(
  promoRedemptionId: string | null,
): Promise<string | null> {
  if (!promoRedemptionId || !isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("leonix_promo_code_redemptions")
    .select("status")
    .eq("id", promoRedemptionId)
    .maybeSingle();
  return data?.status != null ? String(data.status) : null;
}

function emptyProof(lang: "en" | "es"): RevenuePaymentProof {
  return {
    found: false,
    paymentState: "missing",
    entitlementState: "missing",
    paymentRecordId: null,
    stripeCheckoutSessionId: null,
    category: null,
    packageKey: null,
    packageLabel: lang === "es" ? "Paquete" : "Package",
    categoryLabel: "",
    listingId: null,
    leonixAdId: null,
    amountDisplay: null,
    paidAt: null,
    entitlementEndsAt: null,
    adPlanBadge: null,
    promoRedemptionStatus: null,
    paymentSource: null,
    webhookBacked: false,
  };
}

export async function lookupRevenuePaymentProof(
  input: RevenuePaymentLookupInput,
): Promise<RevenuePaymentProof> {
  const lang = input.lang === "en" ? "en" : "es";
  const sessionId = String(input.stripeCheckoutSessionId ?? "").trim();
  const recordId = String(input.paymentRecordId ?? "").trim();

  if (!sessionId && !recordId) {
    return emptyProof(lang);
  }

  let payment: LeonixPaymentRecordRow | null = null;
  if (sessionId) payment = await loadPaymentRecordByStripeSessionId(sessionId);
  if (!payment && recordId) payment = await loadPaymentRecordById(recordId);

  if (!payment) {
    return emptyProof(lang);
  }

  const paymentState = normalizeRevenuePaymentDisplayState(payment.payment_status);
  const entitlement = await loadEntitlementForPayment(payment);
  const promoStatus = await loadPromoRedemptionStatus(payment.promo_redemption_id);

  const packageKey = payment.package_key ?? entitlement.packageKey;
  const amountCents = payment.amount_total_cents ?? payment.amount_cents;

  const adPlanBadge =
    entitlement.status === "active"
      ? revenueAdPlanBadgeLabel({
          category: payment.category,
          packageKey,
          billingMode: payment.billing_mode,
          lang,
          activeUntil: entitlement.endsAt,
        })
      : null;

  return {
    found: true,
    paymentState,
    entitlementState: entitlement.status,
    paymentRecordId: payment.id,
    stripeCheckoutSessionId: payment.stripe_checkout_session_id,
    category: payment.category,
    packageKey,
    packageLabel: resolveRevenuePackageLabel(packageKey, lang),
    categoryLabel: resolveRevenueCategoryLabel(payment.category, lang),
    listingId: payment.listing_id,
    leonixAdId: payment.leonix_ad_id,
    amountDisplay: formatRevenueAmount({
      amountCents,
      billingMode: payment.billing_mode,
      currency: payment.currency,
      lang,
    }),
    paidAt: payment.paid_at,
    entitlementEndsAt: entitlement.endsAt,
    adPlanBadge,
    promoRedemptionStatus: promoStatus,
    paymentSource: payment.source,
    webhookBacked: payment.source === "stripe_webhook" && isPaymentCleared(payment.payment_status),
  };
}

export type RevenueListingAdPlanProof = {
  listingKey: string;
  adPlanBadge: string | null;
  packageKey: string | null;
  entitlementStatus: string | null;
  endsAt: string | null;
};

/**
 * Gate I.4.3 — batched per-category fetch replacing the original per-listing awaited loop (up to
 * 80 sequential round trips, confirmed the dominant cost of the dashboard's measured ~5.37s
 * entitlement wait — see the Gate I.4A audit). Grouped by `category` — the same batching shape
 * already established by `fetchActiveListingPackageEntitlementsForRows` — because the original
 * per-item query filtered on `category` AND `listing_id` together; dropping the category filter
 * entirely could theoretically cross-match a `listing_id` that collides across two categories'
 * separate source tables. Chunking and precedence logic live in `revenueOsEntitlementPrecedence.ts`
 * (pure, self-test-safe).
 */
async function fetchRevenueOsAdPlanProofsForCategory(
  category: string,
  entries: Array<{ listingId: string; listingKey: string }>,
  lang: "en" | "es",
  nowIso: string,
): Promise<Record<string, RevenueListingAdPlanProof>> {
  const supabase = getAdminSupabase();
  const listingKeyByListingId = new Map<string, string>();
  const idSet = new Set<string>();
  for (const entry of entries) {
    idSet.add(entry.listingId);
    listingKeyByListingId.set(entry.listingId, entry.listingKey);
  }
  const ids = [...idSet];

  const rawRows: RevenueOsEntitlementRow[] = [];
  for (const chunk of chunkListingIds(ids)) {
    const { data, error } = await supabase
      .from("listing_package_entitlements")
      .select("listing_id, status, package_key, billing_mode, ends_at")
      .eq("category", category)
      .in("listing_id", chunk)
      .eq("status", "active")
      .gt("ends_at", nowIso);
    // Fail closed per chunk — a failed/errored chunk simply contributes no proofs, matching the
    // original code's own behavior (it never checked `error` either; a failed query left `data`
    // empty, which already skipped every listing in that response).
    if (error || !Array.isArray(data)) continue;
    rawRows.push(...(data as RevenueOsEntitlementRow[]));
  }

  const bestByListingId = pickBestRevenueOsEntitlementByListingId(rawRows);

  const categoryOut: Record<string, RevenueListingAdPlanProof> = {};
  for (const [listingId, row] of bestByListingId) {
    const listingKey = listingKeyByListingId.get(listingId);
    if (!listingKey) continue;
    const packageKey = String(row.package_key);
    const endsAt = row.ends_at != null ? String(row.ends_at) : null;
    categoryOut[listingKey] = {
      listingKey,
      packageKey,
      entitlementStatus: String(row.status ?? "active"),
      endsAt,
      adPlanBadge: revenueAdPlanBadgeLabel({
        category,
        packageKey,
        billingMode: row.billing_mode != null ? String(row.billing_mode) : null,
        lang,
        activeUntil: endsAt,
      }),
    };
  }
  return categoryOut;
}

/** Batch read-only lookup for dashboard ad-plan badges (Revenue OS entitlements). */
export async function fetchRevenueOsAdPlanProofsForListings(
  items: Array<{ category: string; listingId: string; listingKey: string }>,
  lang: "en" | "es" = "es",
): Promise<Record<string, RevenueListingAdPlanProof>> {
  const out: Record<string, RevenueListingAdPlanProof> = {};
  if (!isSupabaseAdminConfigured() || items.length === 0) return out;

  const now = new Date().toISOString();

  const byCategory = new Map<string, Array<{ listingId: string; listingKey: string }>>();
  for (const item of items.slice(0, 80)) {
    const category = String(item.category ?? "").trim().toLowerCase();
    const listingId = String(item.listingId ?? "").trim();
    if (!category || !listingId) continue;
    const list = byCategory.get(category) ?? [];
    list.push({ listingId, listingKey: item.listingKey });
    byCategory.set(category, list);
  }
  if (byCategory.size === 0) return out;

  // Gate I.4.3 — one batched (chunked) query per distinct category, run concurrently. Category
  // count here is inherently small and bounded (the dashboard now sends one selected category
  // per request — Gate I.4.2 — so this is virtually always exactly 1, and even a hypothetical
  // mixed-category call is bounded by the fixed, small set of dashboard categories, never by
  // catalog size), so plain `Promise.all` is appropriate — no concurrency limiter needed. Each
  // category is caught independently so one malformed/failed group can never affect another's
  // result or fabricate eligibility.
  const perCategoryResults = await Promise.all(
    [...byCategory.entries()].map(async ([category, entries]) => {
      try {
        return await fetchRevenueOsAdPlanProofsForCategory(category, entries, lang, now);
      } catch (err) {
        console.error("[fetchRevenueOsAdPlanProofsForListings] category lookup failed", {
          category,
          message: err instanceof Error ? err.message : String(err),
        });
        return {} as Record<string, RevenueListingAdPlanProof>;
      }
    }),
  );
  for (const categoryOut of perCategoryResults) {
    Object.assign(out, categoryOut);
  }

  return out;
}
