import "server-only";

import { formatMoneyCents } from "@/app/lib/listingPlans/packagePricingRules";
import {
  effectivePromoCodeStatus,
  fetchPromoCodesForTracker,
  formatPromoCustomerLine,
  formatPromoSalesRepLine,
  type LeonixPromoCodeRow,
} from "./promoCodeData";
import {
  effectiveEntitlementStatus,
  fetchPackageEntitlementsForTracker,
  formatSalesRepAttribution,
  type ListingPackageEntitlementRow,
} from "./packageEntitlementData";

const EXPIRING_SOON_MS = 14 * 24 * 60 * 60 * 1000;

export type SalesRepSummary = {
  salesRepId: string;
  salesRepName: string;
  activeCodes: number;
  activeEntitlements: number;
  expiringSoon: number;
  revokedOrExpired: number;
  estimatedContractTotalCents: number;
  commissionEligibleCount: number;
  estimatedCommissionCents: number;
};

export type SalesTrackerActivity = {
  id: string;
  code: string;
  source: "promo" | "entitlement";
  customerLine: string | null;
  salesRepLine: string | null;
  packageTier: string | null;
  category: string | null;
  status: string;
  endsAt: string | null;
  entitlementId: string | null;
  pricingLine: string | null;
};

export type SalesTrackerSnapshot = {
  unavailable: boolean;
  note: string | null;
  totalActiveCodes: number;
  totalActiveEntitlements: number;
  totalExpiringSoon: number;
  totalRevokedOrExpired: number;
  totalEstimatedContractCents: number;
  totalCommissionEligibleCount: number;
  totalEstimatedCommissionCents: number;
  reps: SalesRepSummary[];
  recentActivity: SalesTrackerActivity[];
};

function extractSalesRepId(row: LeonixPromoCodeRow): string | null {
  return row.sales_rep_id?.trim() || null;
}

function extractSalesRepName(row: LeonixPromoCodeRow): string {
  return row.sales_rep_name?.trim() || row.sales_rep_id?.trim() || "Unknown";
}

function extractEntitlementSalesRepId(row: ListingPackageEntitlementRow): string | null {
  const meta = row.metadata;
  const id = meta.sales_rep_id;
  return id != null && String(id).trim() ? String(id).trim() : null;
}

function extractEntitlementSalesRepName(row: ListingPackageEntitlementRow): string {
  const meta = row.metadata;
  const name = meta.sales_rep_name;
  const id = meta.sales_rep_id;
  if (name != null && String(name).trim()) return String(name).trim();
  if (id != null && String(id).trim()) return String(id).trim();
  return "Unknown";
}

function extractPricingCents(metadata: Record<string, unknown>, key: string): number {
  const pricing = metadata.pricing;
  if (!pricing || typeof pricing !== "object" || Array.isArray(pricing)) return 0;
  const val = (pricing as Record<string, unknown>)[key];
  return typeof val === "number" && Number.isFinite(val) ? val : 0;
}

function extractCommission(metadata: Record<string, unknown>): { eligible: boolean; cents: number } {
  const preview = metadata.commission_preview;
  if (!preview || typeof preview !== "object" || Array.isArray(preview)) {
    return { eligible: false, cents: 0 };
  }
  const rec = preview as Record<string, unknown>;
  const eligible = rec.commission_eligible === true;
  const cents =
    typeof rec.estimated_commission_cents === "number" && Number.isFinite(rec.estimated_commission_cents)
      ? rec.estimated_commission_cents
      : 0;
  return { eligible, cents };
}

function formatPricingLine(metadata: Record<string, unknown>): string | null {
  const total = extractPricingCents(metadata, "estimated_contract_total_cents");
  if (!total) return null;
  return `≈ ${formatMoneyCents(total)} total`;
}

export type SalesTrackerFilters = {
  q?: string;
  sales_rep_id?: string;
  status?: string;
  category?: string;
  package_tier?: string;
  code_type?: string;
};

function matchesSalesRepFilter(repId: string | null, filter: string): boolean {
  if (!filter.trim()) return true;
  const needle = filter.trim().toLowerCase();
  return (repId ?? "").toLowerCase().includes(needle);
}

export async function fetchSalesTrackerSnapshot(
  filters: SalesTrackerFilters = {},
): Promise<SalesTrackerSnapshot> {
  const [promoResult, entitlementResult] = await Promise.all([
    fetchPromoCodesForTracker({ q: filters.q, category: filters.category, code_type: filters.code_type, status: filters.status, limit: 500 }),
    fetchPackageEntitlementsForTracker({ q: filters.q, category: filters.category, package_tier: filters.package_tier, status: filters.status, limit: 500 }),
  ]);

  if (promoResult.unavailable && entitlementResult.unavailable) {
    return {
      unavailable: true,
      note: promoResult.note || entitlementResult.note,
      totalActiveCodes: 0,
      totalActiveEntitlements: 0,
      totalExpiringSoon: 0,
      totalRevokedOrExpired: 0,
      totalEstimatedContractCents: 0,
      totalCommissionEligibleCount: 0,
      totalEstimatedCommissionCents: 0,
      reps: [],
      recentActivity: [],
    };
  }

  const now = Date.now();
  const soon = now + EXPIRING_SOON_MS;
  const repMap = new Map<string, SalesRepSummary>();

  function getOrCreate(repId: string, repName: string): SalesRepSummary {
    let entry = repMap.get(repId);
    if (!entry) {
      entry = {
        salesRepId: repId,
        salesRepName: repName,
        activeCodes: 0,
        activeEntitlements: 0,
        expiringSoon: 0,
        revokedOrExpired: 0,
        estimatedContractTotalCents: 0,
        commissionEligibleCount: 0,
        estimatedCommissionCents: 0,
      };
      repMap.set(repId, entry);
    }
    if (entry.salesRepName === "Unknown" && repName !== "Unknown") {
      entry.salesRepName = repName;
    }
    return entry;
  }

  let totalActiveCodes = 0;
  let totalActiveEntitlements = 0;
  let totalExpiringSoon = 0;
  let totalRevokedOrExpired = 0;
  let totalEstimatedContractCents = 0;
  let totalCommissionEligibleCount = 0;
  let totalEstimatedCommissionCents = 0;

  const promoCodes = filters.sales_rep_id
    ? promoResult.rows.filter((r) => matchesSalesRepFilter(extractSalesRepId(r), filters.sales_rep_id!))
    : promoResult.rows;

  for (const row of promoCodes) {
    const repId = extractSalesRepId(row);
    if (!repId) continue;
    const repName = extractSalesRepName(row);
    const entry = getOrCreate(repId, repName);

    const effective = effectivePromoCodeStatus(row);
    if (effective === "active") {
      entry.activeCodes += 1;
      totalActiveCodes += 1;
      const endMs = row.ends_at ? new Date(row.ends_at).getTime() : NaN;
      if (Number.isFinite(endMs) && endMs <= soon && endMs >= now) {
        entry.expiringSoon += 1;
        totalExpiringSoon += 1;
      }
    } else if (effective === "revoked" || effective === "expired" || effective === "redeemed") {
      entry.revokedOrExpired += 1;
      totalRevokedOrExpired += 1;
    }
  }

  const entitlements = filters.sales_rep_id
    ? entitlementResult.rows.filter((r) => matchesSalesRepFilter(extractEntitlementSalesRepId(r), filters.sales_rep_id!))
    : entitlementResult.rows;

  for (const row of entitlements) {
    const repId = extractEntitlementSalesRepId(row);
    if (!repId) continue;
    const repName = extractEntitlementSalesRepName(row);
    const entry = getOrCreate(repId, repName);

    const effective = effectiveEntitlementStatus(row);
    if (effective === "active") {
      entry.activeEntitlements += 1;
      totalActiveEntitlements += 1;
      const endMs = new Date(row.ends_at).getTime();
      if (Number.isFinite(endMs) && endMs <= soon && endMs >= now) {
        entry.expiringSoon += 1;
        totalExpiringSoon += 1;
      }
    } else if (effective === "revoked" || effective === "expired") {
      entry.revokedOrExpired += 1;
      totalRevokedOrExpired += 1;
    }

    const contractCents = extractPricingCents(row.metadata, "estimated_contract_total_cents");
    entry.estimatedContractTotalCents += contractCents;
    totalEstimatedContractCents += contractCents;

    const commission = extractCommission(row.metadata);
    if (commission.eligible) {
      entry.commissionEligibleCount += 1;
      entry.estimatedCommissionCents += commission.cents;
      totalCommissionEligibleCount += 1;
      totalEstimatedCommissionCents += commission.cents;
    }
  }

  const reps = [...repMap.values()].sort(
    (a, b) => b.activeCodes + b.activeEntitlements - (a.activeCodes + a.activeEntitlements),
  );

  const recentActivity: SalesTrackerActivity[] = [];
  const limit = 50;

  for (const row of promoCodes.slice(0, limit)) {
    recentActivity.push({
      id: row.id,
      code: row.code,
      source: "promo",
      customerLine: formatPromoCustomerLine(row),
      salesRepLine: formatPromoSalesRepLine(row),
      packageTier: row.package_tier,
      category: row.category,
      status: effectivePromoCodeStatus(row),
      endsAt: row.ends_at,
      entitlementId: row.package_entitlement_id,
      pricingLine: formatPricingLine(row.metadata),
    });
  }

  for (const row of entitlements.slice(0, limit)) {
    recentActivity.push({
      id: row.id,
      code: row.entitlement_code ?? "",
      source: "entitlement",
      customerLine: row.business_name?.trim() || row.customer_name?.trim() || null,
      salesRepLine: formatSalesRepAttribution(row.metadata),
      packageTier: row.package_tier,
      category: row.category,
      status: effectiveEntitlementStatus(row),
      endsAt: row.ends_at,
      entitlementId: row.id,
      pricingLine: formatPricingLine(row.metadata),
    });
  }

  recentActivity.sort((a, b) => {
    const aEnd = a.endsAt ? new Date(a.endsAt).getTime() : 0;
    const bEnd = b.endsAt ? new Date(b.endsAt).getTime() : 0;
    return aEnd - bEnd;
  });

  return {
    unavailable: false,
    note: null,
    totalActiveCodes,
    totalActiveEntitlements,
    totalExpiringSoon,
    totalRevokedOrExpired,
    totalEstimatedContractCents,
    totalCommissionEligibleCount,
    totalEstimatedCommissionCents,
    reps,
    recentActivity: recentActivity.slice(0, limit),
  };
}
