import "server-only";

import { formatMoneyCents } from "@/app/lib/listingPlans/packagePricingRules";
import {
  normalizePaymentStatus,
  isPaymentCleared,
  formatPaymentStatusLabel,
  type PaymentStatus,
} from "@/app/lib/listingPlans/paymentTracking";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { adminCategoryWorkspaceQueueHref } from "@/app/admin/_lib/adminCategoryWorkspaceQueueHref";
import { derivePaymentCircuit, type PaymentCircuit } from "./paymentCircuit";
import {
  classifyPublication,
  publicationSourceForCategory,
  PUBLICATION_SOURCE_SELECT,
  type PublicationSource,
  type PublicationTruth,
} from "./publicationSemantics";

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
  stripe_subscription_id?: string | null;
  stripe_payment_intent_id: string | null;
  source: string;
  payment_status: string;
  currency: string;
  package_key: string | null;
  leonix_ad_id: string | null;
  promo_redemption_id: string | null;
  /** Package C Build 2 (C4). */
  verified_intro_discount_redemption_id: string | null;
  /** Package E Build E3, Gate 4 — real columns for the manual-cleared-payment state machine
   * (source: 'admin_manual' only). Additive: every other source's rows just carry null here. */
  owner_user_id: string | null;
  manual_method: string | null;
  manual_state: string | null;
  evidence_reference: string | null;
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
  /** Package C Build 4 (C8, Gate 7) — provenance of the entitlement this payment produced
   * (stripe_webhook/admin_manual/print_included/comp/partner/manual_cleared_payment). Read from
   * `listing_package_entitlements.grant_source`; null when there is no linked entitlement. */
  grant_source: string | null;
  promo_redemption_status: string | null;
  /** Package C Build 1 — canonical subscription state (active/grace/suspended/canceled/
   * cancel_at_period_end) from leonix_subscription_records; null for one-time payments. */
  subscription_status?: string | null;
  /** Package C Build 2 (C4) — verified-intro-15% redemption truth. Masked identity display
   * only — never the identity hash, never a raw email/phone value. */
  verified_intro_discount_status: string | null;
  verified_intro_discount_verification_method: string | null;
  verified_intro_discount_email_masked: string | null;
  verified_intro_discount_phone_masked: string | null;
  verified_intro_discount_business_identity_type: string | null;
  verified_intro_discount_business_identity_fallback_reason: string | null;
  /** Gate 2/12 — read-only enrichment: never a DB column, never written back. */
  billing_mode: string | null;
  /** The category's OWN listing row read through the shared publication semantics (null when the
   * category/row has no safe canonical lookup). Payment truth stays separate from this. */
  publication: PublicationTruth | null;
  /** Read-only link into the canonical Admin category queue, pre-filtered by Leonix Ad ID / listing id. */
  listing_admin_href: string | null;
  /** Most recent webhook-ledger row linked to this payment record (completed fulfilments only link). */
  webhook_diag: { status: string; resultCode: string | null; receivedAt: string | null } | null;
  circuit: PaymentCircuit | null;
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
    stripe_subscription_id: raw.stripe_subscription_id != null ? String(raw.stripe_subscription_id) : null,
    stripe_payment_intent_id: raw.stripe_payment_intent_id != null ? String(raw.stripe_payment_intent_id) : null,
    source: String(raw.source ?? "unknown"),
    payment_status: String(raw.payment_status ?? "unknown"),
    currency: String(raw.currency ?? "usd"),
    package_key: raw.package_key != null ? String(raw.package_key) : null,
    leonix_ad_id: raw.leonix_ad_id != null ? String(raw.leonix_ad_id).trim() || null : null,
    promo_redemption_id: raw.promo_redemption_id != null ? String(raw.promo_redemption_id) : null,
    verified_intro_discount_redemption_id:
      raw.verified_intro_discount_redemption_id != null ? String(raw.verified_intro_discount_redemption_id) : null,
    owner_user_id: raw.owner_user_id != null ? String(raw.owner_user_id) : null,
    manual_method: raw.manual_method != null ? String(raw.manual_method) : null,
    manual_state: raw.manual_state != null ? String(raw.manual_state) : null,
    evidence_reference: raw.evidence_reference != null ? String(raw.evidence_reference) : null,
    amount_total_cents: raw.amount_total_cents != null && Number.isFinite(Number(raw.amount_total_cents)) ? Number(raw.amount_total_cents) : null,
    amount_paid_cents: raw.amount_paid_cents != null && Number.isFinite(Number(raw.amount_paid_cents)) ? Number(raw.amount_paid_cents) : null,
    discount_percent: raw.discount_percent != null && Number.isFinite(Number(raw.discount_percent)) ? Number(raw.discount_percent) : null,
    paid_at: raw.paid_at != null ? String(raw.paid_at) : null,
    commission_eligible: Boolean(raw.commission_eligible),
    commission_status: String(raw.commission_status ?? "not_eligible"),
    estimated_commission_cents: raw.estimated_commission_cents != null && Number.isFinite(Number(raw.estimated_commission_cents)) ? Number(raw.estimated_commission_cents) : null,
    metadata,
    entitlement_status: null,
    grant_source: null,
    promo_redemption_status: null,
    subscription_status: null,
    verified_intro_discount_status: null,
    verified_intro_discount_verification_method: null,
    verified_intro_discount_email_masked: null,
    verified_intro_discount_phone_masked: null,
    verified_intro_discount_business_identity_type: null,
    verified_intro_discount_business_identity_fallback_reason: null,
    billing_mode: raw.billing_mode != null ? String(raw.billing_mode) : null,
    publication: null,
    listing_admin_href: null,
    webhook_diag: null,
    circuit: null,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Gate 2/12 — batch-read each row's OWN canonical listing (per category table) and the webhook
 * ledger rows linked to these payment records. Read-only; a failed lookup degrades to an honest
 * "lookup failed" instead of a guess.
 */
async function loadListingAndWebhookTruth(rows: LeonixPaymentRecordRow[]): Promise<{
  publicationByRowId: Map<string, PublicationTruth>;
  webhookByPaymentId: Map<string, { status: string; resultCode: string | null; receivedAt: string | null }>;
}> {
  const supabase = getAdminSupabase();
  const publicationByRowId = new Map<string, PublicationTruth>();
  const webhookByPaymentId = new Map<string, { status: string; resultCode: string | null; receivedAt: string | null }>();

  const idsBySource = new Map<PublicationSource, Set<string>>();
  for (const r of rows) {
    const src = publicationSourceForCategory(r.category);
    if (!src || !r.listing_id || !UUID_RE.test(r.listing_id)) continue;
    if (!idsBySource.has(src)) idsBySource.set(src, new Set());
    idsBySource.get(src)!.add(r.listing_id);
  }
  for (const [src, idSet] of idsBySource) {
    const ids = [...idSet].slice(0, 100);
    let byId = new Map<string, Record<string, unknown>>();
    let failed = false;
    try {
      const { data, error } = await supabase.from(src).select(PUBLICATION_SOURCE_SELECT[src]).in("id", ids);
      if (error) failed = true;
      else byId = new Map(((data ?? []) as unknown as Record<string, unknown>[]).map((d) => [String(d.id), d]));
    } catch {
      failed = true;
    }
    for (const r of rows) {
      if (publicationSourceForCategory(r.category) !== src || !r.listing_id || !UUID_RE.test(r.listing_id)) continue;
      publicationByRowId.set(
        r.id,
        failed
          ? { semantic: "UNKNOWN", reason: "Listing lookup failed (query error) — state could not be read.", rawStatus: null, source: src }
          : classifyPublication(src, byId.get(r.listing_id) ?? null, { paymentCleared: isPaymentCleared(normalizePaymentStatus(r.payment_status)) }),
      );
    }
  }

  const paymentIds = rows.map((r) => r.id).slice(0, 100);
  if (paymentIds.length > 0) {
    try {
      const { data } = await supabase
        .from("leonix_stripe_webhook_events")
        .select("payment_record_id, status, result_code, received_at")
        .in("payment_record_id", paymentIds)
        .order("received_at", { ascending: false });
      for (const e of (data ?? []) as { payment_record_id: string; status: string; result_code: string | null; received_at: string | null }[]) {
        if (!webhookByPaymentId.has(e.payment_record_id)) {
          webhookByPaymentId.set(e.payment_record_id, { status: e.status, resultCode: e.result_code, receivedAt: e.received_at });
        }
      }
    } catch {
      /* ledger unreadable → no webhook_diag; the circuit text never claims one exists */
    }
  }
  return { publicationByRowId, webhookByPaymentId };
}

function adminQueueLinkFor(row: LeonixPaymentRecordRow): string | null {
  if (!publicationSourceForCategory(row.category) || !row.category) return null;
  const q = row.leonix_ad_id || row.listing_id;
  if (!q) return null;
  const base = adminCategoryWorkspaceQueueHref(row.category.trim().toLowerCase().replace(/_/g, "-"));
  return `${base}${base.includes("?") ? "&" : "?"}q=${encodeURIComponent(q)}`;
}

async function enrichPaymentTrackerRows(
  rows: LeonixPaymentRecordRow[],
): Promise<LeonixPaymentRecordRow[]> {
  if (rows.length === 0) return rows;
  const supabase = getAdminSupabase();
  const entitlementIds = rows.map((r) => r.package_entitlement_id).filter(Boolean) as string[];
  const promoIds = rows.map((r) => r.promo_redemption_id).filter(Boolean) as string[];

  const entitlementStatusById = new Map<string, string>();
  const entitlementGrantSourceById = new Map<string, string | null>();
  if (entitlementIds.length > 0) {
    const { data } = await supabase
      .from("listing_package_entitlements")
      .select("id, status, grant_source")
      .in("id", entitlementIds.slice(0, 100));
    for (const row of data ?? []) {
      const r = row as { id: string; status: string; grant_source?: string | null };
      entitlementStatusById.set(String(r.id), String(r.status));
      entitlementGrantSourceById.set(String(r.id), r.grant_source != null ? String(r.grant_source) : null);
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

  // Package C Build 1 (Gate 14) — canonical subscription state per payment record (truthful
  // Active / grace / suspended / cancelled admin display; separate from entitlement/promo).
  const subscriptionStatusBySubId = new Map<string, string>();
  const subIds = rows
    .map((r) => (r as { stripe_subscription_id?: string | null }).stripe_subscription_id)
    .filter(Boolean) as string[];
  if (subIds.length > 0) {
    const { data } = await supabase
      .from("leonix_subscription_records")
      .select("stripe_subscription_id, status, cancel_at_period_end")
      .in("stripe_subscription_id", subIds.slice(0, 100));
    for (const row of data ?? []) {
      const key = String((row as { stripe_subscription_id: string }).stripe_subscription_id);
      const status = String((row as { status: string }).status);
      const cape = Boolean((row as { cancel_at_period_end?: boolean }).cancel_at_period_end);
      subscriptionStatusBySubId.set(key, status === "active" && cape ? "cancel_at_period_end" : status);
    }
  }

  // Package C Build 2 (C4) — verified-intro-15% redemption truth. Masked display values only.
  const verifiedIntroById = new Map<
    string,
    {
      status: string;
      verification_method: string | null;
      email_masked: string | null;
      phone_masked: string | null;
      business_identity_type: string | null;
      business_identity_fallback_reason: string | null;
    }
  >();
  const verifiedIntroIds = rows.map((r) => r.verified_intro_discount_redemption_id).filter(Boolean) as string[];
  if (verifiedIntroIds.length > 0) {
    const { data } = await supabase
      .from("leonix_verified_intro_discount_redemptions")
      .select(
        "id, status, verification_method, verified_email_masked, verified_phone_masked, business_identity_type, business_identity_fallback_reason",
      )
      .in("id", verifiedIntroIds.slice(0, 100));
    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      verifiedIntroById.set(String(r.id), {
        status: String(r.status ?? ""),
        verification_method: r.verification_method != null ? String(r.verification_method) : null,
        email_masked: r.verified_email_masked != null ? String(r.verified_email_masked) : null,
        phone_masked: r.verified_phone_masked != null ? String(r.verified_phone_masked) : null,
        business_identity_type: r.business_identity_type != null ? String(r.business_identity_type) : null,
        business_identity_fallback_reason:
          r.business_identity_fallback_reason != null ? String(r.business_identity_fallback_reason) : null,
      });
    }
  }

  const { publicationByRowId, webhookByPaymentId } = await loadListingAndWebhookTruth(rows);

  return rows.map((row) => {
    const verifiedIntro = row.verified_intro_discount_redemption_id
      ? verifiedIntroById.get(row.verified_intro_discount_redemption_id) ?? null
      : null;
    const entitlementStatus = row.package_entitlement_id
      ? entitlementStatusById.get(row.package_entitlement_id) ?? "missing"
      : null;
    const subscriptionStatus = (row as { stripe_subscription_id?: string | null }).stripe_subscription_id
      ? subscriptionStatusBySubId.get(
          String((row as { stripe_subscription_id?: string | null }).stripe_subscription_id),
        ) ?? null
      : null;
    const publication = publicationByRowId.get(row.id) ?? null;
    const webhookDiag = webhookByPaymentId.get(row.id) ?? null;
    return {
      ...row,
      publication,
      webhook_diag: webhookDiag,
      listing_admin_href: adminQueueLinkFor(row),
      circuit: derivePaymentCircuit({
        paymentStatus: row.payment_status,
        source: row.source,
        hasCheckoutSession: Boolean(row.stripe_checkout_session_id),
        hasListingId: Boolean(row.listing_id),
        billingMode: row.billing_mode,
        packageEntitlementId: row.package_entitlement_id,
        entitlementStatus,
        subscriptionStatus,
        listing: publication,
        webhook: webhookDiag,
      }),
      entitlement_status: row.package_entitlement_id
        ? entitlementStatusById.get(row.package_entitlement_id) ?? "missing"
        : null,
      grant_source: row.package_entitlement_id
        ? entitlementGrantSourceById.get(row.package_entitlement_id) ?? null
        : null,
      promo_redemption_status: row.promo_redemption_id
        ? promoStatusById.get(row.promo_redemption_id) ?? null
        : null,
      subscription_status: (row as { stripe_subscription_id?: string | null }).stripe_subscription_id
        ? subscriptionStatusBySubId.get(
            String((row as { stripe_subscription_id?: string | null }).stripe_subscription_id),
          ) ?? null
        : null,
      verified_intro_discount_status: verifiedIntro?.status ?? null,
      verified_intro_discount_verification_method: verifiedIntro?.verification_method ?? null,
      verified_intro_discount_email_masked: verifiedIntro?.email_masked ?? null,
      verified_intro_discount_phone_masked: verifiedIntro?.phone_masked ?? null,
      verified_intro_discount_business_identity_type: verifiedIntro?.business_identity_type ?? null,
      verified_intro_discount_business_identity_fallback_reason:
        verifiedIntro?.business_identity_fallback_reason ?? null,
    };
  });
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
  /**
   * Master Operating Book §15/§24 — "What payments failed?" / "What money is at risk?" had no
   * canonical Command Center answer even though this exact count was already computed by
   * fetchPaymentTrackerSnapshot() and silently discarded before reaching the dashboard. Counts
   * failed/canceled/refunded/disputed payment_status rows among the most recent 500 payment
   * records (same bounded-scan honesty as the rest of this snapshot).
   */
  failedCanceledRefundedCount: number;
};

export async function getPaymentTrackerDashboardSnapshot(): Promise<PaymentTrackerDashboardSnapshot> {
  const snap = await fetchPaymentTrackerSnapshot({ limit: 500 });
  return {
    unavailable: snap.unavailable,
    note: snap.note,
    pendingCount: snap.pendingCount,
    paidCount: snap.paidCount,
    commissionEligibleCount: snap.commissionEligibleCount,
    failedCanceledRefundedCount: snap.failedCanceledRefundedCount,
  };
}
