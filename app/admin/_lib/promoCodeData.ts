import "server-only";

import { resolveEffectivePromoCodeStatus } from "@/app/lib/listingPlans/promoCodeLifecycle";
import { getAdminSupabase } from "@/app/lib/supabase/server";

export type LeonixPromoCodeRow = {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  code: string;
  code_type: string;
  promo_type: string | null;
  percent_off: number | null;
  amount_off_cents: number | null;
  is_active: boolean | null;
  non_stackable: boolean;
  one_time_use: boolean;
  max_redemptions: number | null;
  redemption_count: number;
  starts_at: string | null;
  ends_at: string | null;
  package_tier: string | null;
  contract_term: string | null;
  category: string | null;
  category_scope: string[] | null;
  package_scope: string[] | null;
  listing_source: string | null;
  listing_id: string | null;
  package_entitlement_id: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  business_name: string | null;
  sales_rep_id: string | null;
  sales_rep_name: string | null;
  requires_owner_approval: boolean;
  revoked_at: string | null;
  metadata: Record<string, unknown>;
};

export type PromoCodeDashboardSnapshot = {
  dataUnavailable: boolean;
  dataUnavailableNote: string | null;
  activeCount: number;
  expiringSoonCount: number;
  revokedOrExpiredCount: number;
};

const EXPIRING_SOON_MS = 14 * 24 * 60 * 60 * 1000;

export type PromoCodeAttentionFlag =
  | "missing_discount"
  | "expiring_soon"
  | "max_reached"
  | "limit_nearly_reached"
  | "assigned_business_mismatch"
  | "assigned_email_mismatch";

export type PromoCodeUsageEntry = {
  redemptionId: string;
  redemptionStatus: string;
  redeemedAt: string | null;
  discountCents: number;
  listingId: string | null;
  leonixAdId: string | null;
  usedEmail: string | null;
  usedBusinessName: string | null;
  category: string | null;
  packageKey: string | null;
  stripeCheckoutSessionId: string | null;
  paymentRecordId: string | null;
  paymentStatus: string | null;
  amountTotalCents: number | null;
  amountDiscountCents: number | null;
  publicAdUrl: string | null;
  paymentTrackerHref: string | null;
  mismatchFlags: PromoCodeAttentionFlag[];
};

export type PromoCodeOsSummary = {
  activeCount: number;
  usedCount: number;
  expiringSoonCount: number;
  needsAttentionCount: number;
};

function numOrNull(raw: unknown): number | null {
  if (raw == null || !Number.isFinite(Number(raw))) return null;
  return Number(raw);
}

function stringArrayOrNull(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out = raw.map((v) => String(v).trim()).filter(Boolean);
  return out.length ? out : null;
}

function mapTableError(msg: string): string | null {
  if (/does not exist|schema cache|relation/i.test(msg)) {
    return "leonix_promo_codes table not found — run Supabase migrations.";
  }
  return msg || null;
}

function rowFromDb(raw: Record<string, unknown>): LeonixPromoCodeRow {
  const metaRaw = raw.metadata;
  const metadata =
    metaRaw && typeof metaRaw === "object" && !Array.isArray(metaRaw)
      ? (metaRaw as Record<string, unknown>)
      : {};

  return {
    id: String(raw.id),
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
    status: String(raw.status),
    code: String(raw.code),
    code_type: String(raw.code_type),
    promo_type: raw.promo_type != null ? String(raw.promo_type) : null,
    percent_off: numOrNull(raw.percent_off),
    amount_off_cents:
      raw.amount_off_cents != null && Number.isFinite(Number(raw.amount_off_cents))
        ? Math.floor(Number(raw.amount_off_cents))
        : null,
    is_active: raw.is_active == null ? null : Boolean(raw.is_active),
    non_stackable: Boolean(raw.non_stackable),
    one_time_use: Boolean(raw.one_time_use),
    max_redemptions:
      raw.max_redemptions != null && Number.isFinite(Number(raw.max_redemptions))
        ? Number(raw.max_redemptions)
        : null,
    redemption_count: Number(raw.redemption_count ?? 0),
    starts_at: raw.starts_at != null ? String(raw.starts_at) : null,
    ends_at: raw.ends_at != null ? String(raw.ends_at) : null,
    package_tier: raw.package_tier != null ? String(raw.package_tier) : null,
    contract_term: raw.contract_term != null ? String(raw.contract_term) : null,
    category: raw.category != null ? String(raw.category) : null,
    category_scope: stringArrayOrNull(raw.category_scope),
    package_scope: stringArrayOrNull(raw.package_scope),
    listing_source: raw.listing_source != null ? String(raw.listing_source) : null,
    listing_id: raw.listing_id != null ? String(raw.listing_id).trim() || null : null,
    package_entitlement_id:
      raw.package_entitlement_id != null ? String(raw.package_entitlement_id) : null,
    customer_email: raw.customer_email != null ? String(raw.customer_email) : null,
    customer_phone: raw.customer_phone != null ? String(raw.customer_phone) : null,
    customer_name: raw.customer_name != null ? String(raw.customer_name) : null,
    business_name: raw.business_name != null ? String(raw.business_name) : null,
    sales_rep_id: raw.sales_rep_id != null ? String(raw.sales_rep_id) : null,
    sales_rep_name: raw.sales_rep_name != null ? String(raw.sales_rep_name) : null,
    requires_owner_approval: Boolean(raw.requires_owner_approval),
    revoked_at: raw.revoked_at != null ? String(raw.revoked_at) : null,
    metadata,
  };
}

export function effectivePromoCodeStatus(
  row: Pick<
    LeonixPromoCodeRow,
    | "status"
    | "starts_at"
    | "ends_at"
    | "revoked_at"
    | "redemption_count"
    | "max_redemptions"
  >,
  now = new Date(),
): string {
  return resolveEffectivePromoCodeStatus(
    {
      status: row.status,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      revokedAt: row.revoked_at,
      redemptionCount: row.redemption_count,
      maxRedemptions: row.max_redemptions,
    },
    now,
  );
}

export function formatPromoCustomerLine(row: Pick<LeonixPromoCodeRow, "business_name" | "customer_name" | "customer_email">): string | null {
  const parts: string[] = [];
  if (row.business_name?.trim()) parts.push(row.business_name.trim());
  else if (row.customer_name?.trim()) parts.push(row.customer_name.trim());
  if (row.customer_email?.trim()) parts.push(row.customer_email.trim());
  return parts.length ? parts.join(" · ") : null;
}

export function formatPromoSalesRepLine(row: Pick<LeonixPromoCodeRow, "sales_rep_id" | "sales_rep_name">): string | null {
  const id = row.sales_rep_id?.trim();
  const name = row.sales_rep_name?.trim();
  if (!id && !name) return null;
  if (id && name) return `${name} (${id})`;
  return id || name || null;
}

export function matchesPromoCodeSearch(row: LeonixPromoCodeRow, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const notes = row.metadata.notes != null ? String(row.metadata.notes) : "";
  const hay = [
    row.code,
    row.business_name,
    row.customer_name,
    row.customer_email,
    row.customer_phone,
    row.sales_rep_id,
    row.sales_rep_name,
    row.category,
    row.package_tier,
    row.listing_id,
    row.package_entitlement_id,
    notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export type PromoCodeTrackerFilters = {
  q?: string;
  category?: string;
  code_type?: string;
  status?: string;
  attention?: string;
  limit?: number;
};

function resolvePercentOff(row: LeonixPromoCodeRow): number | null {
  if (row.percent_off != null && row.percent_off > 0) return row.percent_off;
  const meta = row.metadata.discount_percent ?? row.metadata.percent_off;
  const n = numOrNull(meta);
  return n != null && n > 0 ? n : null;
}

function resolveAmountOffCents(row: LeonixPromoCodeRow): number | null {
  if (row.amount_off_cents != null && row.amount_off_cents > 0) return row.amount_off_cents;
  const metaCents = numOrNull(row.metadata.discount_amount_cents);
  if (metaCents != null && metaCents > 0) return Math.floor(metaCents);
  const dollars = numOrNull(row.metadata.discount_amount_dollars ?? row.metadata.discount_amount);
  if (dollars != null && dollars > 0) return Math.round(dollars * 100);
  return null;
}

export function promoCodeMissingDiscount(row: LeonixPromoCodeRow): boolean {
  if (row.code_type !== "discount") return false;
  return resolvePercentOff(row) == null && resolveAmountOffCents(row) == null;
}

export function formatPromoDiscountSummary(row: LeonixPromoCodeRow): string {
  if (row.code_type !== "discount") return "—";
  const pct = resolvePercentOff(row);
  if (pct != null) return `${pct}% off`;
  const cents = resolveAmountOffCents(row);
  if (cents != null) return `$${(cents / 100).toFixed(2)} off`;
  return "Missing discount value";
}

export function formatPromoCategoryScope(row: LeonixPromoCodeRow): string {
  if (row.category_scope?.length) return row.category_scope.join(", ");
  if (row.category?.trim()) return row.category.trim();
  return "Any category";
}

export function formatPromoPackageScope(row: LeonixPromoCodeRow): string {
  if (row.package_scope?.length) return row.package_scope.join(", ");
  if (row.package_tier?.trim()) return `${row.package_tier} (legacy tier)`;
  return "Any package";
}

export function promoCodeUsageMode(row: LeonixPromoCodeRow): "public_launch" | "assigned_private" {
  const hasAssignment = Boolean(
    row.business_name?.trim() || row.customer_email?.trim() || row.customer_name?.trim(),
  );
  return hasAssignment ? "assigned_private" : "public_launch";
}

function normalizeCompareToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isExpiringSoon(row: LeonixPromoCodeRow, now = Date.now()): boolean {
  const endMs = row.ends_at ? new Date(row.ends_at).getTime() : NaN;
  return Number.isFinite(endMs) && endMs <= now + EXPIRING_SOON_MS && endMs >= now;
}

function isMaxRedemptionsReached(row: LeonixPromoCodeRow): boolean {
  const max = row.max_redemptions;
  if (max == null || !Number.isFinite(max) || max < 1) return false;
  return row.redemption_count >= max;
}

function isLimitNearlyReached(row: LeonixPromoCodeRow): boolean {
  const max = row.max_redemptions;
  if (max == null || !Number.isFinite(max) || max < 2) return false;
  return row.redemption_count >= max - 1 && row.redemption_count < max;
}

export function computePromoAttentionFlags(
  row: LeonixPromoCodeRow,
  usage: PromoCodeUsageEntry[] = [],
): PromoCodeAttentionFlag[] {
  const flags: PromoCodeAttentionFlag[] = [];
  const effective = effectivePromoCodeStatus(row);

  if (promoCodeMissingDiscount(row)) flags.push("missing_discount");
  if (effective === "active" && isExpiringSoon(row)) flags.push("expiring_soon");
  if (isMaxRedemptionsReached(row)) flags.push("max_reached");
  else if (isLimitNearlyReached(row)) flags.push("limit_nearly_reached");

  const assignedBusiness = row.business_name?.trim();
  const assignedEmail = row.customer_email?.trim()?.toLowerCase();

  for (const entry of usage) {
    if (assignedBusiness && entry.usedBusinessName) {
      if (normalizeCompareToken(assignedBusiness) !== normalizeCompareToken(entry.usedBusinessName)) {
        if (!flags.includes("assigned_business_mismatch")) flags.push("assigned_business_mismatch");
      }
    }
    if (assignedEmail && entry.usedEmail) {
      if (assignedEmail !== entry.usedEmail.trim().toLowerCase()) {
        if (!flags.includes("assigned_email_mismatch")) flags.push("assigned_email_mismatch");
      }
    }
  }

  return flags;
}

export function computePromoOsSummary(
  rows: LeonixPromoCodeRow[],
  usageLedger?: Map<string, PromoCodeUsageEntry[]>,
): PromoCodeOsSummary {
  let activeCount = 0;
  let usedCount = 0;
  let expiringSoonCount = 0;
  let needsAttentionCount = 0;

  for (const row of rows) {
    const effective = effectivePromoCodeStatus(row);
    const usage = usageLedger?.get(row.id) ?? [];
    if (effective === "active") activeCount += 1;
    if (row.redemption_count > 0 || effective === "redeemed") usedCount += 1;
    if (effective === "active" && isExpiringSoon(row)) expiringSoonCount += 1;
    if (computePromoAttentionFlags(row, usage).length > 0) needsAttentionCount += 1;
  }

  return { activeCount, usedCount, expiringSoonCount, needsAttentionCount };
}

function attentionFlagLabel(flag: PromoCodeAttentionFlag): string {
  switch (flag) {
    case "missing_discount":
      return "Missing discount value";
    case "expiring_soon":
      return "Expiring soon";
    case "max_reached":
      return "Max redemptions reached";
    case "limit_nearly_reached":
      return "Redemption limit nearly reached";
    case "assigned_business_mismatch":
      return "Assigned business differs from used business";
    case "assigned_email_mismatch":
      return "Assigned email differs from checkout email";
    default:
      return flag;
  }
}

export function promoAttentionFlagLabel(flag: PromoCodeAttentionFlag): string {
  return attentionFlagLabel(flag);
}

export async function fetchPromoUsageLedgerForCodes(
  promoCodeIds: string[],
): Promise<Map<string, PromoCodeUsageEntry[]>> {
  const ledger = new Map<string, PromoCodeUsageEntry[]>();
  if (!promoCodeIds.length) return ledger;

  try {
    const supabase = getAdminSupabase();
    const ids = promoCodeIds.slice(0, 100);
    const { data: redemptions, error } = await supabase
      .from("leonix_promo_code_redemptions")
      .select(
        "id, promo_code_id, status, redeemed_at, discount_cents, listing_id, leonix_ad_id, email, category, package_key, stripe_checkout_session_id, payment_record_id, metadata",
      )
      .in("promo_code_id", ids)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error || !redemptions?.length) return ledger;

    const paymentIds = [
      ...new Set(
        redemptions
          .map((r) => (r as { payment_record_id?: string | null }).payment_record_id)
          .filter(Boolean) as string[],
      ),
    ];

    const paymentsById = new Map<string, Record<string, unknown>>();
    if (paymentIds.length) {
      const { data: payments } = await supabase
        .from("leonix_payment_records")
        .select("*")
        .in("id", paymentIds.slice(0, 100));
      for (const p of payments ?? []) {
        paymentsById.set(String((p as { id: string }).id), p as Record<string, unknown>);
      }
    }

    const restaurantListingIds = new Set<string>();
    for (const red of redemptions) {
      const cat = String((red as { category?: string }).category ?? "").toLowerCase();
      const listingId = String((red as { listing_id?: string }).listing_id ?? "").trim();
      if (cat === "restaurantes" && listingId) restaurantListingIds.add(listingId);
    }

    const slugByListingId = new Map<string, string>();
    if (restaurantListingIds.size) {
      const { data: listings } = await supabase
        .from("restaurantes_public_listings")
        .select("id, slug, status")
        .in("id", [...restaurantListingIds].slice(0, 100));
      for (const listing of listings ?? []) {
        const id = String((listing as { id: string }).id);
        const slug = String((listing as { slug?: string }).slug ?? "").trim();
        const status = String((listing as { status?: string }).status ?? "");
        if (slug && status === "published") slugByListingId.set(id, slug);
      }
    }

    for (const raw of redemptions) {
      const red = raw as Record<string, unknown>;
      const promoCodeId = String(red.promo_code_id ?? "");
      if (!promoCodeId) continue;

      const paymentId = red.payment_record_id != null ? String(red.payment_record_id) : null;
      const payment = paymentId ? paymentsById.get(paymentId) : undefined;
      const paymentMeta =
        payment?.metadata && typeof payment.metadata === "object" && !Array.isArray(payment.metadata)
          ? (payment.metadata as Record<string, unknown>)
          : {};

      const listingId = red.listing_id != null ? String(red.listing_id).trim() || null : null;
      const category = red.category != null ? String(red.category) : null;
      const redemptionStatus = String(red.status ?? "pending");
      const paymentStatus = payment?.payment_status != null ? String(payment.payment_status) : null;
      const promoCodeFromPayment =
        payment?.promo_code != null
          ? String(payment.promo_code)
          : paymentMeta.promo_code != null
            ? String(paymentMeta.promo_code)
            : null;

      let publicAdUrl: string | null = null;
      if (
        category === "restaurantes" &&
        listingId &&
        slugByListingId.has(listingId) &&
        redemptionStatus === "redeemed" &&
        paymentStatus === "paid"
      ) {
        publicAdUrl = `/clasificados/restaurantes/${encodeURIComponent(slugByListingId.get(listingId)!)}?lang=es`;
      }

      let paymentTrackerHref: string | null = null;
      if (paymentId) {
        paymentTrackerHref = `/admin/workspace/payment-tracker?q=${encodeURIComponent(paymentId)}`;
      } else if (promoCodeFromPayment) {
        paymentTrackerHref = `/admin/workspace/payment-tracker?promo_code=${encodeURIComponent(promoCodeFromPayment)}`;
      }

      const entry: PromoCodeUsageEntry = {
        redemptionId: String(red.id),
        redemptionStatus,
        redeemedAt: red.redeemed_at != null ? String(red.redeemed_at) : null,
        discountCents: numOrNull(red.discount_cents) ?? 0,
        listingId,
        leonixAdId: red.leonix_ad_id != null ? String(red.leonix_ad_id).trim() || null : null,
        usedEmail:
          (payment?.customer_email != null ? String(payment.customer_email) : null) ??
          (red.email != null ? String(red.email) : null),
        usedBusinessName: payment?.business_name != null ? String(payment.business_name) : null,
        category,
        packageKey: red.package_key != null ? String(red.package_key) : null,
        stripeCheckoutSessionId:
          red.stripe_checkout_session_id != null ? String(red.stripe_checkout_session_id) : null,
        paymentRecordId: paymentId,
        paymentStatus,
        amountTotalCents: numOrNull(payment?.amount_total_cents ?? payment?.amount_cents),
        amountDiscountCents: numOrNull(payment?.amount_discount_cents ?? paymentMeta.promo_discount_cents),
        publicAdUrl,
        paymentTrackerHref,
        mismatchFlags: [],
      };

      const list = ledger.get(promoCodeId) ?? [];
      list.push(entry);
      ledger.set(promoCodeId, list);
    }
  } catch {
    return ledger;
  }

  return ledger;
}

export function computeUsageEntryMismatchFlags(
  row: LeonixPromoCodeRow,
  entry: PromoCodeUsageEntry,
): PromoCodeAttentionFlag[] {
  return computePromoAttentionFlags(row, [entry]).filter(
    (f) => f === "assigned_business_mismatch" || f === "assigned_email_mismatch",
  );
}

export async function fetchPromoCodesForTracker(
  filters: PromoCodeTrackerFilters = {},
): Promise<{
  rows: LeonixPromoCodeRow[];
  unavailable: boolean;
  note: string | null;
  totalFetched: number;
}> {
  const limit = filters.limit ?? 150;
  try {
    const supabase = getAdminSupabase();
    let query = supabase.from("leonix_promo_codes").select("*").order("created_at", { ascending: false }).limit(limit);

    if (filters.category) query = query.eq("category", filters.category);
    if (filters.code_type) query = query.eq("code_type", filters.code_type);
    if (filters.status === "revoked") query = query.eq("status", "revoked");
    if (filters.status === "redeemed") query = query.eq("status", "redeemed");
    if (filters.status === "draft") query = query.eq("status", "draft");

    const { data, error } = await query;
    if (error) {
      return { rows: [], unavailable: true, note: mapTableError(error.message), totalFetched: 0 };
    }

    let rows = (data ?? []).map((r) => rowFromDb(r as Record<string, unknown>));
    const totalFetched = rows.length;

    if (filters.q) {
      rows = rows.filter((r) => matchesPromoCodeSearch(r, filters.q!));
    }

    const statusFilter = filters.status?.trim();
    if (statusFilter && !["revoked", "redeemed", "draft"].includes(statusFilter)) {
      rows = rows.filter((r) => effectivePromoCodeStatus(r) === statusFilter);
    }

    const attention = filters.attention?.trim();
    if (attention === "needs_attention") {
      rows = rows.filter((r) => computePromoAttentionFlags(r).length > 0);
    } else if (attention === "has_redemptions") {
      rows = rows.filter((r) => r.redemption_count > 0);
    } else if (attention === "missing_discount") {
      rows = rows.filter((r) => promoCodeMissingDiscount(r));
    }

    return { rows, unavailable: false, note: null, totalFetched };
  } catch (e) {
    return {
      rows: [],
      unavailable: true,
      note: e instanceof Error ? e.message : "unknown",
      totalFetched: 0,
    };
  }
}

export async function getPromoCodeDashboardSnapshot(): Promise<PromoCodeDashboardSnapshot> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from("leonix_promo_codes").select("*");

    if (error) {
      return {
        dataUnavailable: true,
        dataUnavailableNote: mapTableError(error.message),
        activeCount: 0,
        expiringSoonCount: 0,
        revokedOrExpiredCount: 0,
      };
    }

    const now = Date.now();
    const soon = now + EXPIRING_SOON_MS;
    let activeCount = 0;
    let expiringSoonCount = 0;
    let revokedOrExpiredCount = 0;

    for (const raw of data ?? []) {
      const row = rowFromDb(raw as Record<string, unknown>);
      const effective = effectivePromoCodeStatus(row);
      if (effective === "active") {
        activeCount += 1;
        const endMs = row.ends_at ? new Date(row.ends_at).getTime() : NaN;
        if (Number.isFinite(endMs) && endMs <= soon && endMs >= now) {
          expiringSoonCount += 1;
        }
      } else if (effective === "revoked" || effective === "expired" || effective === "redeemed") {
        revokedOrExpiredCount += 1;
      }
    }

    return {
      dataUnavailable: false,
      dataUnavailableNote: null,
      activeCount,
      expiringSoonCount,
      revokedOrExpiredCount,
    };
  } catch (e) {
    return {
      dataUnavailable: true,
      dataUnavailableNote: e instanceof Error ? e.message : "unknown",
      activeCount: 0,
      expiringSoonCount: 0,
      revokedOrExpiredCount: 0,
    };
  }
}

/**
 * Best-effort sync of listing_id on linked promo code when entitlement attach occurs.
 */
export async function syncPromoCodeListingIdFromEntitlement(
  entitlementId: string,
  listingId: string,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const { data: promoRow } = await supabase
      .from("leonix_promo_codes")
      .select("id, metadata")
      .eq("package_entitlement_id", entitlementId)
      .maybeSingle();

    if (!promoRow) return { ok: true, error: null };

    const existingMeta =
      promoRow.metadata && typeof promoRow.metadata === "object" && !Array.isArray(promoRow.metadata)
        ? (promoRow.metadata as Record<string, unknown>)
        : {};

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("leonix_promo_codes")
      .update({
        listing_id: listingId,
        updated_at: now,
        metadata: {
          ...existingMeta,
          listing_attached_at: now,
          listing_attached_by: "admin_attach_sync",
        },
      })
      .eq("id", String((promoRow as { id: string }).id));

    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export type LinkPromoFromEntitlementInput = {
  entitlementId: string;
  code: string;
  codeType: string;
  packageTier: string;
  contractTerm: string | null;
  category: string;
  listingSource: string;
  listingId: string | null;
  customerName: string | null;
  businessName: string | null;
  salesRepId: string | null;
  salesRepName: string | null;
  startsAt: string;
  endsAt: string;
  promoRule: Record<string, unknown>;
  pricingMetadata?: Record<string, unknown>;
};

/**
 * Best-effort link when package entitlement is created. Never throws to caller.
 */
export async function upsertPromoCodeFromPackageEntitlement(
  input: LinkPromoFromEntitlementInput,
): Promise<{ ok: boolean; promoId: string | null; error: string | null }> {
  try {
    const supabase = getAdminSupabase();
    const code = input.code.trim().toUpperCase();
    const metadata = {
      source: "package_entitlement_generator",
      package_entitlement_id: input.entitlementId,
      promo_rule: input.promoRule,
      ...(input.pricingMetadata ? { pricing: input.pricingMetadata } : {}),
    };

    const { data: existing } = await supabase
      .from("leonix_promo_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    const row = {
      code,
      code_type: input.codeType,
      status: "active",
      non_stackable: true,
      one_time_use: false,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      package_tier: input.packageTier,
      contract_term: input.contractTerm,
      category: input.category,
      listing_source: input.listingSource,
      listing_id: input.listingId,
      package_entitlement_id: input.entitlementId,
      customer_name: input.customerName,
      business_name: input.businessName,
      sales_rep_id: input.salesRepId,
      sales_rep_name: input.salesRepName,
      requires_owner_approval: input.promoRule.requires_owner_approval === true,
      metadata,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { data, error } = await supabase
        .from("leonix_promo_codes")
        .update(row)
        .eq("id", String((existing as { id: string }).id))
        .select("id")
        .maybeSingle();
      if (error) return { ok: false, promoId: null, error: error.message };
      return { ok: true, promoId: data?.id ? String((data as { id: string }).id) : null, error: null };
    }

    const { data, error } = await supabase.from("leonix_promo_codes").insert(row).select("id").maybeSingle();
    if (error) return { ok: false, promoId: null, error: error.message };
    return { ok: true, promoId: data?.id ? String((data as { id: string }).id) : null, error: null };
  } catch (e) {
    return { ok: false, promoId: null, error: e instanceof Error ? e.message : "unknown" };
  }
}
