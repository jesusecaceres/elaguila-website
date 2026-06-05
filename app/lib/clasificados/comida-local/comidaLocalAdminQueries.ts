import type { SupabaseClient } from "@supabase/supabase-js";

import type { ComidaLocalPublicListingRow } from "./comidaLocalPublicTypes";

/** Admin moderation read — all columns needed for queue + inspect. Server/admin only. */
export const COMIDA_LOCAL_ADMIN_LISTING_SELECT =
  "id, owner_user_id, leonix_ad_id, slug, status, package_tier, payment_status, published_at, expires_at, created_at, updated_at, business_name, food_type, food_type_custom, city_display, city_canonical, phone, whatsapp, instagram_url, facebook_url, tiktok_url, main_photo, listing_json";

export type ComidaLocalAdminListingRow = Pick<
  ComidaLocalPublicListingRow,
  | "id"
  | "slug"
  | "leonix_ad_id"
  | "status"
  | "package_tier"
  | "payment_status"
  | "published_at"
  | "business_name"
  | "food_type"
  | "food_type_custom"
  | "city_canonical"
  | "city_display"
  | "phone"
  | "whatsapp"
  | "instagram_url"
  | "facebook_url"
  | "tiktok_url"
  | "main_photo"
  | "listing_json"
> & {
  owner_user_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ComidaLocalAdminListFilters = {
  limit?: number;
  /** When `live`, only `status = published`. */
  scope?: "live" | "queue";
  q?: string;
  slug?: string;
  id?: string;
  leonix_ad_id?: string;
  owner_user_id?: string;
};

const ALLOWED_ADMIN_STATUS = new Set([
  "draft",
  "published",
  "paused",
  "suspended",
  "pending_payment",
]);

function normalizeAdminRow(raw: Record<string, unknown>): ComidaLocalAdminListingRow {
  return raw as ComidaLocalAdminListingRow;
}

/**
 * List all Comida Local rows for admin moderation.
 * Caller must pass `getAdminSupabase()` — never a public/anonymous client.
 */
export async function listAdminComidaLocalListings(
  sb: SupabaseClient,
  filters: ComidaLocalAdminListFilters = {}
): Promise<ComidaLocalAdminListingRow[]> {
  const limit = Math.min(Math.max(filters.limit ?? 80, 1), 200);

  let query = sb
    .from("comida_local_public_listings")
    .select(COMIDA_LOCAL_ADMIN_LISTING_SELECT)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (filters.scope === "live") {
    query = query.eq("status", "published");
  }

  const slug = filters.slug?.trim();
  if (slug) query = query.eq("slug", slug);

  const id = filters.id?.trim();
  if (id) query = query.eq("id", id);

  const leonix = filters.leonix_ad_id?.trim();
  if (leonix) query = query.ilike("leonix_ad_id", leonix);

  const owner = filters.owner_user_id?.trim();
  if (owner) query = query.eq("owner_user_id", owner);

  const search = filters.q?.trim();
  if (search) {
    const like = `%${search}%`;
    query = query.or(
      [
        `leonix_ad_id.ilike.${like}`,
        `slug.ilike.${like}`,
        `business_name.ilike.${like}`,
        `city_display.ilike.${like}`,
        `city_canonical.ilike.${like}`,
        `id.eq.${search}`,
        `owner_user_id.eq.${search}`,
      ].join(",")
    );
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(normalizeAdminRow);
}

/** Single-row admin inspect (listing_json included). */
export async function getAdminComidaLocalListingById(
  sb: SupabaseClient,
  id: string
): Promise<ComidaLocalAdminListingRow | null> {
  const rowId = id.trim();
  if (!rowId) return null;

  const { data, error } = await sb
    .from("comida_local_public_listings")
    .select(COMIDA_LOCAL_ADMIN_LISTING_SELECT)
    .eq("id", rowId)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeAdminRow(data as Record<string, unknown>);
}

/** Safe status moderation — only DB-allowed values. Caller must enforce admin auth. */
export async function updateAdminComidaLocalListingStatus(
  sb: SupabaseClient,
  id: string,
  status: string
): Promise<{ ok: boolean; slug: string | null }> {
  const rowId = id.trim();
  const next = status.trim();
  if (!rowId || !ALLOWED_ADMIN_STATUS.has(next)) return { ok: false, slug: null };

  const { data: existing } = await sb
    .from("comida_local_public_listings")
    .select("slug")
    .eq("id", rowId)
    .maybeSingle();

  const slug =
    existing && typeof (existing as { slug?: string }).slug === "string"
      ? (existing as { slug: string }).slug
      : null;

  const { error } = await sb
    .from("comida_local_public_listings")
    .update({ status: next, updated_at: new Date().toISOString() })
    .eq("id", rowId);

  return { ok: !error, slug };
}
