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
  non_stackable: boolean;
  one_time_use: boolean;
  max_redemptions: number | null;
  redemption_count: number;
  starts_at: string | null;
  ends_at: string | null;
  package_tier: string | null;
  contract_term: string | null;
  category: string | null;
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
  limit?: number;
};

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
