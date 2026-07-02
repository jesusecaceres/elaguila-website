import "server-only";

import { formatMoneyCents } from "@/app/lib/listingPlans/packagePricingRules";
import {
  normalizePaymentStatus,
  isPaymentCleared,
  formatPaymentStatusLabel,
  type PaymentStatus,
} from "@/app/lib/listingPlans/paymentTracking";
import { getAdminSupabase } from "@/app/lib/supabase/server";

export type LeonixPaymentRecordRow = {
  id: string;
  created_at: string;
  updated_at: string;
  category: string | null;
  listing_source: string | null;
  listing_id: string | null;
  package_tier: string | null;
  contract_term: string | null;
  package_entitlement_id: string | null;
  promo_code_id: string | null;
  promo_code: string | null;
  sales_rep_id: string | null;
  sales_rep_name: string | null;
  customer_name: string | null;
  customer_email: string | null;
  business_name: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  source: string;
  payment_status: string;
  currency: string;
  package_key: string | null;
  leonix_ad_id: string | null;
  promo_redemption_id: string | null;
  amount_total_cents: number | null;
  amount_paid_cents: number | null;
  discount_percent: number | null;
  paid_at: string | null;
  commission_eligible: boolean;
  commission_status: string;
  estimated_commission_cents: number | null;
  metadata: Record<string, unknown>;
  /** Enriched read-only fields (not DB columns). */
  entitlement_status: string | null;
  promo_redemption_status: string | null;
};

export type PaymentTrackerSnapshot = {
  unavailable: boolean;
  note: string | null;
  pendingCount: number;
  paidCount: number;
  failedCanceledRefundedCount: number;
  commissionEligibleCount: number;
  estimatedPaidTotalCents: number;
  rows: LeonixPaymentRecordRow[];
};

function mapTableError(msg: string): string | null {
  if (/does not exist|schema cache|relation/i.test(msg)) {
    return "leonix_payment_records table not found — run Supabase migration.";
  }
  return msg || null;
}

function rowFromDb(raw: Record<string, unknown>): LeonixPaymentRecordRow {
  const metaRaw = raw.metadata;
  const metadata =
    metaRaw && typeof metaRaw === "object" && !Array.isArray(metaRaw)
      ? (metaRaw as Record<string, unknown>)
      : {};

  return {
    id: String(raw.id),
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
    category: raw.category != null ? String(raw.category) : null,
    listing_source: raw.listing_source != null ? String(raw.listing_source) : null,
    listing_id: raw.listing_id != null ? String(raw.listing_id).trim() || null : null,
    package_tier: raw.package_tier != null ? String(raw.package_tier) : null,
    contract_term: raw.contract_term != null ? String(raw.contract_term) : null,
    package_entitlement_id: raw.package_entitlement_id != null ? String(raw.package_entitlement_id) : null,
    promo_code_id: raw.promo_code_id != null ? String(raw.promo_code_id) : null,
    promo_code: raw.promo_code != null ? String(raw.promo_code) : null,
    sales_rep_id: raw.sales_rep_id != null ? String(raw.sales_rep_id) : null,
    sales_rep_name: raw.sales_rep_name != null ? String(raw.sales_rep_name) : null,
    customer_name: raw.customer_name != null ? String(raw.customer_name) : null,
    customer_email: raw.customer_email != null ? String(raw.customer_email) : null,
    business_name: raw.business_name != null ? String(raw.business_name) : null,
    stripe_checkout_session_id: raw.stripe_checkout_session_id != null ? String(raw.stripe_checkout_session_id) : null,
    stripe_payment_intent_id: raw.stripe_payment_intent_id != null ? String(raw.stripe_payment_intent_id) : null,
    source: String(raw.source ?? "unknown"),
    payment_status: String(raw.payment_status ?? "unknown"),
    currency: String(raw.currency ?? "usd"),
    package_key: raw.package_key != null ? String(raw.package_key) : null,
    leonix_ad_id: raw.leonix_ad_id != null ? String(raw.leonix_ad_id).trim() || null : null,
    promo_redemption_id: raw.promo_redemption_id != null ? String(raw.promo_redemption_id) : null,
    amount_total_cents: raw.amount_total_cents != null && Number.isFinite(Number(raw.amount_total_cents)) ? Number(raw.amount_total_cents) : null,
    amount_paid_cents: raw.amount_paid_cents != null && Number.isFinite(Number(raw.amount_paid_cents)) ? Number(raw.amount_paid_cents) : null,
    discount_percent: raw.discount_percent != null && Number.isFinite(Number(raw.discount_percent)) ? Number(raw.discount_percent) : null,
    paid_at: raw.paid_at != null ? String(raw.paid_at) : null,
    commission_eligible: Boolean(raw.commission_eligible),
    commission_status: String(raw.commission_status ?? "not_eligible"),
    estimated_commission_cents: raw.estimated_commission_cents != null && Number.isFinite(Number(raw.estimated_commission_cents)) ? Number(raw.estimated_commission_cents) : null,
    metadata,
    entitlement_status: null,
    promo_redemption_status: null,
  };
}

async function enrichPaymentTrackerRows(
  rows: LeonixPaymentRecordRow[],
): Promise<LeonixPaymentRecordRow[]> {
  if (rows.length === 0) return rows;
  const supabase = getAdminSupabase();
  const entitlementIds = rows.map((r) => r.package_entitlement_id).filter(Boolean) as string[];
  const promoIds = rows.map((r) => r.promo_redemption_id).filter(Boolean) as string[];

  const entitlementStatusById = new Map<string, string>();
  if (entitlementIds.length > 0) {
    const { data } = await supabase
      .from("listing_package_entitlements")
      .select("id, status")
      .in("id", entitlementIds.slice(0, 100));
    for (const row of data ?? []) {
      entitlementStatusById.set(String((row as { id: string }).id), String((row as { status: string }).status));
    }
  }

  const promoStatusById = new Map<string, string>();
  if (promoIds.length > 0) {
    const { data } = await supabase
      .from("leonix_promo_code_redemptions")
      .select("id, status")
      .in("id", promoIds.slice(0, 100));
    for (const row of data ?? []) {
      promoStatusById.set(String((row as { id: string }).id), String((row as { status: string }).status));
    }
  }

  return rows.map((row) => ({
    ...row,
    entitlement_status: row.package_entitlement_id
      ? entitlementStatusById.get(row.package_entitlement_id) ?? "missing"
      : null,
    promo_redemption_status: row.promo_redemption_id
      ? promoStatusById.get(row.promo_redemption_id) ?? null
      : null,
  }));
}

export type PaymentTrackerFilters = {
  q?: string;
  status?: string;
  sales_rep_id?: string;
  category?: string;
  promo_code?: string;
  limit?: number;
};

function matchesSearch(row: LeonixPaymentRecordRow, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    row.promo_code,
    row.business_name,
    row.customer_name,
    row.customer_email,
    row.sales_rep_id,
    row.sales_rep_name,
    row.category,
    row.package_tier,
    row.package_key,
    row.listing_id,
    row.leonix_ad_id,
    row.stripe_checkout_session_id,
    row.stripe_payment_intent_id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export async function fetchPaymentTrackerSnapshot(
  filters: PaymentTrackerFilters = {},
): Promise<PaymentTrackerSnapshot> {
  const limit = filters.limit ?? 200;
  try {
    const supabase = getAdminSupabase();
    let query = supabase
      .from("leonix_payment_records")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filters.status) query = query.eq("payment_status", filters.status);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.sales_rep_id) query = query.eq("sales_rep_id", filters.sales_rep_id);
    if (filters.promo_code) query = query.eq("promo_code", filters.promo_code);

    const { data, error } = await query;
    if (error) {
      return {
        unavailable: true,
        note: mapTableError(error.message),
        pendingCount: 0,
        paidCount: 0,
        failedCanceledRefundedCount: 0,
        commissionEligibleCount: 0,
        estimatedPaidTotalCents: 0,
        rows: [],
      };
    }

    let rows = (data ?? []).map((r) => rowFromDb(r as Record<string, unknown>));
    if (filters.q) {
      rows = rows.filter((r) => matchesSearch(r, filters.q!));
    }

    rows = await enrichPaymentTrackerRows(rows);

    let pendingCount = 0;
    let paidCount = 0;
    let failedCanceledRefundedCount = 0;
    let commissionEligibleCount = 0;
    let estimatedPaidTotalCents = 0;

    for (const row of rows) {
      const s = normalizePaymentStatus(row.payment_status);
      if (s === "pending" || s === "unpaid" || s === "requires_action") pendingCount++;
      else if (isPaymentCleared(s)) {
        paidCount++;
        if (row.amount_paid_cents != null) estimatedPaidTotalCents += row.amount_paid_cents;
        else if (row.amount_total_cents != null) estimatedPaidTotalCents += row.amount_total_cents;
      } else if (s === "failed" || s === "canceled" || s === "refunded" || s === "disputed") {
        failedCanceledRefundedCount++;
      }
      if (row.commission_eligible) commissionEligibleCount++;
    }

    return {
      unavailable: false,
      note: null,
      pendingCount,
      paidCount,
      failedCanceledRefundedCount,
      commissionEligibleCount,
      estimatedPaidTotalCents,
      rows,
    };
  } catch (e) {
    return {
      unavailable: true,
      note: e instanceof Error ? e.message : "unknown",
      pendingCount: 0,
      paidCount: 0,
      failedCanceledRefundedCount: 0,
      commissionEligibleCount: 0,
      estimatedPaidTotalCents: 0,
      rows: [],
    };
  }
}

export type PaymentTrackerDashboardSnapshot = {
  unavailable: boolean;
  note: string | null;
  pendingCount: number;
  paidCount: number;
  commissionEligibleCount: number;
};

export async function getPaymentTrackerDashboardSnapshot(): Promise<PaymentTrackerDashboardSnapshot> {
  const snap = await fetchPaymentTrackerSnapshot({ limit: 500 });
  return {
    unavailable: snap.unavailable,
    note: snap.note,
    pendingCount: snap.pendingCount,
    paidCount: snap.paidCount,
    commissionEligibleCount: snap.commissionEligibleCount,
  };
}
