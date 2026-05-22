import "server-only";

import { formatMoneyCents } from "@/app/lib/listingPlans/packagePricingRules";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { PackageEntitlementBenefit } from "@/app/lib/listingPlans/packageEntitlements";

export type ListingPackageEntitlementRow = {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  category: string;
  listing_source: string;
  listing_id: string | null;
  package_tier: string;
  entitlement_code: string | null;
  contract_code: string | null;
  customer_name: string | null;
  business_name: string | null;
  notes: string | null;
  starts_at: string;
  ends_at: string;
  placement_scope: string[];
  benefits: Record<string, boolean>;
  metadata: Record<string, unknown>;
  revoked_at: string | null;
};

export type PackageEntitlementDashboardSnapshot = {
  dataUnavailable: boolean;
  dataUnavailableNote: string | null;
  activeCount: number;
  expiringSoonCount: number;
  revokedOrExpiredCount: number;
  recent: ListingPackageEntitlementRow[];
};

const EXPIRING_SOON_MS = 14 * 24 * 60 * 60 * 1000;

function mapTableError(msg: string): string | null {
  if (/does not exist|schema cache|relation/i.test(msg)) {
    return "listing_package_entitlements table not found — run Supabase migrations.";
  }
  return msg || null;
}

function rowFromDb(raw: Record<string, unknown>): ListingPackageEntitlementRow {
  const benefitsRaw = raw.benefits;
  const benefits =
    benefitsRaw && typeof benefitsRaw === "object" && !Array.isArray(benefitsRaw)
      ? (benefitsRaw as Record<string, boolean>)
      : {};
  const scopeRaw = raw.placement_scope;
  const placement_scope = Array.isArray(scopeRaw)
    ? scopeRaw.map((s) => String(s)).filter(Boolean)
    : [];
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
    category: String(raw.category),
    listing_source: String(raw.listing_source),
    listing_id:
      raw.listing_id != null && String(raw.listing_id).trim() !== ""
        ? String(raw.listing_id).trim()
        : null,
    package_tier: String(raw.package_tier),
    entitlement_code: raw.entitlement_code != null ? String(raw.entitlement_code) : null,
    contract_code: raw.contract_code != null ? String(raw.contract_code) : null,
    customer_name: raw.customer_name != null ? String(raw.customer_name) : null,
    business_name: raw.business_name != null ? String(raw.business_name) : null,
    notes: raw.notes != null ? String(raw.notes) : null,
    starts_at: String(raw.starts_at),
    ends_at: String(raw.ends_at),
    placement_scope,
    benefits,
    metadata,
    revoked_at: raw.revoked_at != null ? String(raw.revoked_at) : null,
  };
}

export function formatEntitlementListingHeadline(
  row: Pick<ListingPackageEntitlementRow, "listing_id" | "business_name" | "customer_name">,
): string {
  if (row.business_name?.trim()) return row.business_name.trim();
  if (row.customer_name?.trim()) return row.customer_name.trim();
  if (row.listing_id) return row.listing_id;
  return "Pending listing";
}

export function formatEntitlementListingIdLine(listingId: string | null): string {
  if (!listingId) return "Unassigned listing — attach when ad exists";
  return `listing_id: ${listingId}`;
}

export function effectiveEntitlementStatus(
  row: Pick<ListingPackageEntitlementRow, "status" | "starts_at" | "ends_at" | "revoked_at">,
  now = new Date(),
): string {
  if (row.status === "revoked" || row.revoked_at) return "revoked";
  const start = new Date(row.starts_at);
  const end = new Date(row.ends_at);
  if (Number.isFinite(end.getTime()) && end.getTime() < now.getTime()) return "expired";
  if (Number.isFinite(start.getTime()) && start.getTime() > now.getTime()) return "scheduled";
  return row.status === "scheduled" ? "scheduled" : "active";
}

export type PackageEntitlementTrackerFilters = {
  q?: string;
  category?: string;
  package_tier?: string;
  status?: string;
  limit?: number;
};

function metadataStr(metadata: Record<string, unknown>, key: string): string {
  const v = metadata[key];
  return v != null ? String(v).trim() : "";
}

export function formatSalesRepAttribution(metadata: Record<string, unknown>): string | null {
  const id = metadataStr(metadata, "sales_rep_id");
  const name = metadataStr(metadata, "sales_rep_name");
  if (!id && !name) return null;
  if (id && name) return `${name} (${id})`;
  return id || name;
}

export function formatCreatorAttribution(metadata: Record<string, unknown>): string {
  const name = metadataStr(metadata, "creator_name") || "Admin";
  const role = metadataStr(metadata, "creator_role");
  const email = metadataStr(metadata, "creator_email");
  if (email) return `${name} · ${email}`;
  if (role) return `${name} (${role})`;
  return name;
}

function metadataRecord(metadata: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const v = metadata[key];
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

export function formatEntitlementPricingPromoLine(metadata: Record<string, unknown>): string | null {
  const pricing = metadataRecord(metadata, "pricing");
  const promo = metadataRecord(metadata, "promo_rule");
  if (!pricing && !promo) return null;

  const parts: string[] = [];
  const term = pricing ? metadataStr(pricing, "contract_term") : "";
  if (term) parts.push(term.replace(/_/g, " "));
  const monthly = pricing?.discounted_monthly_price_cents;
  if (typeof monthly === "number" && Number.isFinite(monthly)) {
    parts.push(`${formatMoneyCents(monthly)}/mo`);
  }
  const total = pricing?.estimated_contract_total_cents;
  if (typeof total === "number" && Number.isFinite(total)) {
    parts.push(`≈ ${formatMoneyCents(total)} total`);
  }
  const promoType = promo ? metadataStr(promo, "promo_code_type") : "";
  if (promoType) parts.push(`promo: ${promoType}`);

  return parts.length ? parts.join(" · ") : null;
}

export function entitlementPricingBadges(metadata: Record<string, unknown>): string[] {
  const promo = metadataRecord(metadata, "promo_rule");
  if (!promo) return [];
  const badges: string[] = [];
  if (promo.non_stackable === true) badges.push("Non-stackable");
  if (promo.requires_owner_approval === true) badges.push("Owner approval");
  if (promo.one_time_use === true) badges.push("One-time");
  return badges;
}

export function formatEntitlementCommissionPreviewLine(metadata: Record<string, unknown>): string | null {
  const preview = metadataRecord(metadata, "commission_preview");
  if (!preview) return null;
  if (preview.commission_eligible === true) {
    const cents = preview.estimated_commission_cents;
    if (typeof cents === "number" && Number.isFinite(cents)) {
      return `Commission preview (estimate): ${formatMoneyCents(cents)}`;
    }
  }
  return "Commission preview: pending until payment clears";
}

export function matchesEntitlementSearch(row: ListingPackageEntitlementRow, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const meta = row.metadata;
  const hay = [
    row.entitlement_code,
    row.contract_code,
    row.business_name,
    row.customer_name,
    row.listing_id,
    metadataStr(meta, "sales_rep_id"),
    metadataStr(meta, "sales_rep_name"),
    metadataStr(meta, "leonix_ad_id"),
    metadataStr(meta, "creator_name"),
    metadataStr(meta, "creator_email"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export async function fetchPackageEntitlementsForTracker(
  filters: PackageEntitlementTrackerFilters = {},
): Promise<{
  rows: ListingPackageEntitlementRow[];
  unavailable: boolean;
  note: string | null;
  totalFetched: number;
}> {
  const limit = filters.limit ?? 150;
  try {
    const supabase = getAdminSupabase();
    let query = supabase
      .from("listing_package_entitlements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.package_tier) {
      query = query.eq("package_tier", filters.package_tier);
    }
    if (filters.status === "revoked") {
      query = query.eq("status", "revoked");
    }

    const { data, error } = await query;
    if (error) {
      return { rows: [], unavailable: true, note: mapTableError(error.message), totalFetched: 0 };
    }

    let rows = (data ?? []).map((r) => rowFromDb(r as Record<string, unknown>));
    const totalFetched = rows.length;

    if (filters.q) {
      rows = rows.filter((r) => matchesEntitlementSearch(r, filters.q!));
    }

    const statusFilter = filters.status?.trim();
    if (statusFilter && statusFilter !== "revoked") {
      if (statusFilter === "pending_listing") {
        rows = rows.filter((r) => !r.listing_id);
      } else {
        rows = rows.filter((r) => effectiveEntitlementStatus(r) === statusFilter);
      }
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

export function benefitLabels(benefits: Record<string, boolean>): string[] {
  const labels: Record<PackageEntitlementBenefit, string> = {
    destacados_module: "Destacados",
    results_priority: "Results priority",
    classified_listing: "Classified listing",
    republish_access: "Republish",
    boost_access: "Boost",
    auto_refresh_access: "Auto refresh",
    print_advertiser_badge: "Print badge",
    verified_review_eligible: "Verified review",
    concierge_eligible: "Concierge",
  };
  return (Object.keys(labels) as PackageEntitlementBenefit[])
    .filter((k) => benefits[k])
    .map((k) => labels[k]);
}

export async function fetchRecentPackageEntitlements(limit: number): Promise<{
  rows: ListingPackageEntitlementRow[];
  unavailable: boolean;
  note: string | null;
}> {
  const res = await fetchPackageEntitlementsForTracker({ limit });
  return { rows: res.rows, unavailable: res.unavailable, note: res.note };
}

export async function countActivePremiumEntitlements(now = new Date()): Promise<number | null> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("listing_package_entitlements")
      .select("id, starts_at, ends_at, status, revoked_at")
      .eq("package_tier", "premium")
      .in("status", ["active", "scheduled"]);

    if (error) return null;
    return (data ?? []).filter((r) => {
      const rec = r as { starts_at: string; ends_at: string; status: string; revoked_at: string | null };
      return effectiveEntitlementStatus(
        {
          status: rec.status,
          starts_at: rec.starts_at,
          ends_at: rec.ends_at,
          revoked_at: rec.revoked_at,
        },
        now,
      ) === "active";
    }).length;
  } catch {
    return null;
  }
}

export async function getPackageEntitlementDashboardSnapshot(): Promise<PackageEntitlementDashboardSnapshot> {
  const recentRes = await fetchRecentPackageEntitlements(8);
  if (recentRes.unavailable) {
    return {
      dataUnavailable: true,
      dataUnavailableNote: recentRes.note,
      activeCount: 0,
      expiringSoonCount: 0,
      revokedOrExpiredCount: 0,
      recent: [],
    };
  }

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from("listing_package_entitlements").select("*");

    if (error) {
      return {
        dataUnavailable: true,
        dataUnavailableNote: mapTableError(error.message),
        activeCount: 0,
        expiringSoonCount: 0,
        revokedOrExpiredCount: 0,
        recent: recentRes.rows,
      };
    }

    const now = Date.now();
    const soon = now + EXPIRING_SOON_MS;
    let activeCount = 0;
    let expiringSoonCount = 0;
    let revokedOrExpiredCount = 0;

    for (const raw of data ?? []) {
      const row = rowFromDb(raw as Record<string, unknown>);
      const effective = effectiveEntitlementStatus(row);
      if (effective === "active") {
        activeCount += 1;
        const endMs = new Date(row.ends_at).getTime();
        if (Number.isFinite(endMs) && endMs <= soon && endMs >= now) {
          expiringSoonCount += 1;
        }
      } else if (effective === "revoked" || effective === "expired") {
        revokedOrExpiredCount += 1;
      }
    }

    return {
      dataUnavailable: false,
      dataUnavailableNote: null,
      activeCount,
      expiringSoonCount,
      revokedOrExpiredCount,
      recent: recentRes.rows,
    };
  } catch (e) {
    return {
      dataUnavailable: true,
      dataUnavailableNote: e instanceof Error ? e.message : "unknown",
      activeCount: 0,
      expiringSoonCount: 0,
      revokedOrExpiredCount: 0,
      recent: recentRes.rows,
    };
  }
}
