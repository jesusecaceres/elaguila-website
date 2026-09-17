/**
 * Assisted Publishing (Gate 11) — "Leonix Managed" inventory, COMPOSED from existing canonical
 * truth, never a second listing-truth system:
 *   businesses (creation_source='staff_assisted')     -> who Leonix is preparing
 *   business_profiles                                  -> Business Profile draft/published
 *   business_ownership_claims + business_memberships   -> not released / claim pending / claimed
 *   business_listing_links                             -> real category listings attached
 *   business_profile_entitlements x listing entitlements (via the existing resolver) -> commercial
 *
 * Honest limitation, stated in the UI too: category application DRAFTS for 14 of 17 pipelines
 * live in the operator's browser (sessionStorage/IndexedDB) by design, so they cannot appear in
 * any server inventory until they are published (or, for Autos/Ofertas Locales, DB-drafted).
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { resolveBusinessProfileCommercialState } from "@/app/lib/business/profile/entitlementRepository";
import type { BusinessProfileCommercialState } from "@/app/lib/business/profile/types";

export type ManagedProfileStatus = "none" | "draft" | "published";
export type ManagedOwnershipStatus = "not_released" | "claim_pending" | "claimed";

export type LeonixManagedRow = {
  businessId: string;
  displayName: string;
  publicName: string | null;
  slug: string;
  broadBusinessType: string;
  updatedAt: string;
  profileStatus: ManagedProfileStatus;
  profileUpdatedAt: string | null;
  ownership: ManagedOwnershipStatus;
  claimExpiresAt: string | null;
  commercial: BusinessProfileCommercialState;
  commercialEligible: boolean;
  linkedListingCount: number;
  /** Derived next action label — bilingual, deterministic, never AI. */
  nextAction: string;
};

export const MANAGED_FILTERS = ["all", "draft", "published", "not_released", "claim_pending", "claimed", "not_eligible", "eligible"] as const;
export type ManagedFilter = (typeof MANAGED_FILTERS)[number];

export function normalizeManagedFilter(raw: string | null | undefined): ManagedFilter {
  const v = (raw ?? "").trim().toLowerCase();
  return (MANAGED_FILTERS as readonly string[]).includes(v) ? (v as ManagedFilter) : "all";
}

export function managedRowMatchesFilter(row: LeonixManagedRow, filter: ManagedFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "draft":
      return row.profileStatus === "draft";
    case "published":
      return row.profileStatus === "published";
    case "not_released":
      return row.ownership === "not_released";
    case "claim_pending":
      return row.ownership === "claim_pending";
    case "claimed":
      return row.ownership === "claimed";
    case "not_eligible":
      return !row.commercialEligible;
    case "eligible":
      return row.commercialEligible;
  }
}

export function deriveManagedNextAction(row: Pick<LeonixManagedRow, "profileStatus" | "ownership" | "commercialEligible">): string {
  if (row.profileStatus === "none") return "Crear perfil / Build profile";
  if (row.ownership === "claimed") return row.profileStatus === "published" ? "Publicado — gestionado por el dueño / Published — owner-managed" : "El dueño puede publicar / Owner can publish";
  if (row.ownership === "claim_pending") return "Esperando reclamo del cliente / Awaiting client claim";
  if (!row.commercialEligible) return "Registrar paquete/venta / Record package or sale";
  return "Entregar al cliente / Release to client";
}

const MANAGED_LIMIT = 60;

export async function listLeonixManagedRows(): Promise<{ rows: LeonixManagedRow[]; truncated: boolean }> {
  const admin = getAdminSupabase();
  const { data: businesses, error } = await admin
    .from("businesses")
    .select("id, display_name, public_name, slug, broad_business_type, updated_at")
    .eq("creation_source", "staff_assisted")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(MANAGED_LIMIT + 1);
  if (error || !businesses || businesses.length === 0) return { rows: [], truncated: false };

  const truncated = businesses.length > MANAGED_LIMIT;
  const page = businesses.slice(0, MANAGED_LIMIT) as { id: string; display_name: string; public_name: string | null; slug: string; broad_business_type: string; updated_at: string }[];
  const ids = page.map((b) => b.id);

  const [profilesRes, claimsRes, membershipsRes, linksRes] = await Promise.all([
    admin.from("business_profiles").select("business_id, status, updated_at").in("business_id", ids),
    admin.from("business_ownership_claims").select("business_id, status, expires_at, created_at").in("business_id", ids).order("created_at", { ascending: false }),
    admin.from("business_memberships").select("business_id").in("business_id", ids).eq("membership_status", "active"),
    admin.from("business_listing_links").select("business_id").in("business_id", ids).eq("status", "verified"),
  ]);

  const profileById = new Map<string, { status: ManagedProfileStatus; updatedAt: string }>();
  for (const p of (profilesRes.data ?? []) as { business_id: string; status: "draft" | "published"; updated_at: string }[]) {
    profileById.set(p.business_id, { status: p.status, updatedAt: p.updated_at });
  }
  const pendingClaimById = new Map<string, string>();
  for (const c of (claimsRes.data ?? []) as { business_id: string; status: string; expires_at: string }[]) {
    if (c.status === "pending" && new Date(c.expires_at).getTime() > Date.now() && !pendingClaimById.has(c.business_id)) {
      pendingClaimById.set(c.business_id, c.expires_at);
    }
  }
  const claimedIds = new Set(((membershipsRes.data ?? []) as { business_id: string }[]).map((m) => m.business_id));
  const linkCounts = new Map<string, number>();
  for (const l of (linksRes.data ?? []) as { business_id: string }[]) {
    linkCounts.set(l.business_id, (linkCounts.get(l.business_id) ?? 0) + 1);
  }

  const commercial = await Promise.all(ids.map((id) => resolveBusinessProfileCommercialState(id)));

  const rows = page.map((b, i): LeonixManagedRow => {
    const profile = profileById.get(b.id);
    const ownership: ManagedOwnershipStatus = claimedIds.has(b.id) ? "claimed" : pendingClaimById.has(b.id) ? "claim_pending" : "not_released";
    const base = {
      profileStatus: profile?.status ?? ("none" as const),
      ownership,
      commercialEligible: commercial[i].eligible,
    };
    return {
      businessId: b.id,
      displayName: b.display_name,
      publicName: b.public_name,
      slug: b.slug,
      broadBusinessType: b.broad_business_type,
      updatedAt: b.updated_at,
      profileStatus: base.profileStatus,
      profileUpdatedAt: profile?.updatedAt ?? null,
      ownership,
      claimExpiresAt: pendingClaimById.get(b.id) ?? null,
      commercial: commercial[i].state,
      commercialEligible: commercial[i].eligible,
      linkedListingCount: linkCounts.get(b.id) ?? 0,
      nextAction: deriveManagedNextAction(base),
    };
  });

  return { rows, truncated };
}
