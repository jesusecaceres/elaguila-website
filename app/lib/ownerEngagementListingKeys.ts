/**
 * All `listing_analytics.listing_id` values that should roll up to an owner's dashboards,
 * spanning `listings` and category-specific public tables.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function collectOwnerListingKeysForAnalytics(sb: SupabaseClient, ownerId: string): Promise<string[]> {
  const keys = new Set<string>();

  const { data: ownedListings } = await sb.from("listings").select("id, leonix_ad_id").eq("owner_id", ownerId);
  for (const r of ownedListings ?? []) {
    const row = r as { id?: string; leonix_ad_id?: string | null };
    if (row.id) keys.add(String(row.id));
    const ad = row.leonix_ad_id?.trim();
    if (ad) keys.add(ad);
  }

  const { data: serv } = await sb.from("servicios_public_listings").select("slug, leonix_ad_id").eq("owner_user_id", ownerId);
  for (const r of serv ?? []) {
    const row = r as { slug?: string; leonix_ad_id?: string | null };
    if (row.slug?.trim()) keys.add(row.slug.trim());
    const ad = row.leonix_ad_id?.trim();
    if (ad) keys.add(ad);
  }

  const { data: emp } = await sb.from("empleos_public_listings").select("id, slug, leonix_ad_id").eq("owner_user_id", ownerId);
  for (const r of emp ?? []) {
    const row = r as { id?: string; slug?: string; leonix_ad_id?: string | null };
    if (row.id) keys.add(String(row.id));
    if (row.slug?.trim()) keys.add(row.slug.trim());
    const ad = row.leonix_ad_id?.trim();
    if (ad) keys.add(ad);
  }

  const { data: aut } = await sb.from("autos_classifieds_listings").select("id, leonix_ad_id").eq("owner_user_id", ownerId);
  for (const r of aut ?? []) {
    const row = r as { id?: string; leonix_ad_id?: string | null };
    if (row.id) keys.add(String(row.id));
    const ad = row.leonix_ad_id?.trim();
    if (ad) keys.add(ad);
  }

  const { data: rst } = await sb.from("restaurantes_public_listings").select("id, slug, leonix_ad_id").eq("owner_user_id", ownerId);
  for (const r of rst ?? []) {
    const row = r as { id?: string; slug?: string; leonix_ad_id?: string | null };
    if (row.id) keys.add(String(row.id));
    if (row.slug?.trim()) keys.add(row.slug.trim());
    const ad = row.leonix_ad_id?.trim();
    if (ad) keys.add(ad);
  }

  const { data: via } = await sb.from("viajes_staged_listings").select("id, slug, leonix_ad_id").eq("owner_user_id", ownerId);
  for (const r of via ?? []) {
    const row = r as { id?: string; slug?: string; leonix_ad_id?: string | null };
    if (row.id) keys.add(String(row.id));
    if (row.slug?.trim()) keys.add(row.slug.trim());
    const ad = row.leonix_ad_id?.trim();
    if (ad) keys.add(ad);
  }

  return [...keys].filter(Boolean);
}

/** Row counts across tables for dashboard “how many listings” copy (not analytics key cardinality). */
export async function countOwnerInventoryListings(sb: SupabaseClient, ownerId: string): Promise<number> {
  const [{ count: nList }, { count: nServ }, { count: nEmp }, { count: nAuto }, { count: nRest }] = await Promise.all([
    sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", ownerId),
    sb.from("servicios_public_listings").select("id", { count: "exact", head: true }).eq("owner_user_id", ownerId),
    sb.from("empleos_public_listings").select("id", { count: "exact", head: true }).eq("owner_user_id", ownerId),
    sb.from("autos_classifieds_listings").select("id", { count: "exact", head: true }).eq("owner_user_id", ownerId),
    sb.from("restaurantes_public_listings").select("id", { count: "exact", head: true }).eq("owner_user_id", ownerId),
  ]);
  return (nList ?? 0) + (nServ ?? 0) + (nEmp ?? 0) + (nAuto ?? 0) + (nRest ?? 0);
}

/**
 * Active / published listings the owner can manage across `listings` + category public tables.
 * Used for dashboard “Anuncios activos” (honest cross-source count).
 */
export async function countOwnerActiveListingsAcrossSources(sb: SupabaseClient, ownerId: string): Promise<number> {
  let total = 0;

  try {
    const q = await sb.from("listings").select("id", { count: "exact", head: true }).eq("owner_id", ownerId).eq("status", "active");
    if (!q.error && typeof q.count === "number") total += q.count;
  } catch {
    /* ignore */
  }

  try {
    const q = await sb
      .from("servicios_public_listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", ownerId)
      .eq("listing_status", "published");
    if (!q.error && typeof q.count === "number") total += q.count;
    else {
      const q2 = await sb.from("servicios_public_listings").select("id", { count: "exact", head: true }).eq("owner_user_id", ownerId);
      if (!q2.error && typeof q2.count === "number") total += q2.count;
    }
  } catch {
    /* ignore */
  }

  try {
    const q = await sb
      .from("empleos_public_listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", ownerId)
      .eq("lifecycle_status", "published");
    if (!q.error && typeof q.count === "number") total += q.count;
  } catch {
    /* ignore */
  }

  try {
    const q = await sb
      .from("autos_classifieds_listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", ownerId)
      .eq("status", "active");
    if (!q.error && typeof q.count === "number") total += q.count;
  } catch {
    /* ignore */
  }

  try {
    const q = await sb
      .from("restaurantes_public_listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", ownerId)
      .eq("status", "published");
    if (!q.error && typeof q.count === "number") total += q.count;
  } catch {
    /* ignore */
  }

  /** Matches `fetchOwnerViajesListings`: owner’s public staged offers only. */
  try {
    const q = await sb
      .from("viajes_staged_listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", ownerId)
      .eq("is_public", true);
    if (!q.error && typeof q.count === "number") total += q.count;
  } catch {
    /* ignore */
  }

  return total;
}
