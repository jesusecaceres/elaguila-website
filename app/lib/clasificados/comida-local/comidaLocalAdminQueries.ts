import type { SupabaseClient } from "@supabase/supabase-js";

import {
  COMIDA_LOCAL_STATUS_VOCAB,
  decideComidaLocalAdminAction,
  type ComidaLocalAdminAction,
  type ComidaLocalAdminActionDecision,
} from "./comidaLocalAdminModeration";
import type { ComidaLocalPublicListingRow } from "./comidaLocalPublicTypes";

/** Admin moderation read — all columns needed for queue + inspect. Server/admin only. */
export const COMIDA_LOCAL_ADMIN_LISTING_SELECT =
  "id, owner_user_id, leonix_ad_id, slug, status, package_tier, payment_status, published_at, expires_at, created_at, updated_at, business_name, food_type, food_type_custom, city_display, city_canonical, phone, whatsapp, instagram_url, facebook_url, tiktok_url, main_photo, listing_json, suspended_reason";

/** Same select without the optional `suspended_reason` column (fallback when that column is not deployed). */
const COMIDA_LOCAL_ADMIN_LISTING_SELECT_NO_REASON = COMIDA_LOCAL_ADMIN_LISTING_SELECT.replace(", suspended_reason", "");

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
  /** 'payment' = payment engine suspension, 'moderation' = staff suspension, NULL = not suspension-managed. */
  suspended_reason?: string | null;
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
  /** Exact `status` value (one of the table's CHECK vocabulary). */
  status?: string;
};

export type ComidaLocalAdminListResult = {
  rows: ComidaLocalAdminListingRow[];
  /** Query / filter error — the array form swallows it into [], this form reports it. */
  error: string | null;
};

const ADMIN_SEARCH_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeAdminRow(raw: Record<string, unknown>): ComidaLocalAdminListingRow {
  return raw as ComidaLocalAdminListingRow;
}

/** Escape LIKE wildcards so a search term is matched literally (contains). */
function likeContains(term: string): string {
  return "%" + term.replace(/[\\%_]/g, (c) => "\\" + c) + "%";
}

/**
 * List Comida Local rows for admin moderation; reports the error instead of swallowing it.
 * Caller must pass `getAdminSupabase()` — never a public/anonymous client.
 *
 * Scopes: queue = every status (full operational queue: drafts, payment-pending, paused, suspended,
 * published); live = status published exactly — the rule the public reader uses.
 */
export async function listAdminComidaLocalListingsDetailed(
  sb: SupabaseClient,
  filters: ComidaLocalAdminListFilters = {}
): Promise<ComidaLocalAdminListResult> {
  const limit = Math.min(Math.max(filters.limit ?? 80, 1), 200);

  const id = filters.id?.trim();
  const owner = filters.owner_user_id?.trim();
  // id / owner_user_id are uuid columns: an .eq on free text makes the WHOLE query error. Say so instead
  // of silently returning nothing.
  if (id && !ADMIN_SEARCH_UUID_RE.test(id)) return { rows: [], error: "id must be a full UUID" };
  if (owner && !ADMIN_SEARCH_UUID_RE.test(owner)) return { rows: [], error: "owner must be a full user UUID" };

  const status = filters.status?.trim().toLowerCase();
  if (status && !(COMIDA_LOCAL_STATUS_VOCAB as readonly string[]).includes(status)) {
    return { rows: [], error: "unknown status " + JSON.stringify(status) };
  }
  const slug = filters.slug?.trim();
  const leonix = filters.leonix_ad_id?.trim();
  const search = filters.q?.trim();

  const buildQuery = (select: string) => {
    let query = sb
      .from("comida_local_public_listings")
      .select(select)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (filters.scope === "live") {
      query = query.eq("status", "published");
    }
    if (status) query = query.eq("status", status);
    if (slug) query = query.eq("slug", slug);
    if (id) query = query.eq("id", id);
    if (leonix) query = query.ilike("leonix_ad_id", likeContains(leonix));
    if (owner) query = query.eq("owner_user_id", owner);
    if (search) {
      const like = "%" + search + "%";
      // id / owner_user_id are uuid columns: an .eq. on free text made the WHOLE query error, and the
      // error was swallowed into an empty list (a Leonix Ad ID search silently returned nothing).
      const isUuidSearch = ADMIN_SEARCH_UUID_RE.test(search);
      query = query.or(
        [
          `leonix_ad_id.ilike.${like}`,
          `slug.ilike.${like}`,
          `business_name.ilike.${like}`,
          `city_display.ilike.${like}`,
          `city_canonical.ilike.${like}`,
          ...(isUuidSearch ? [`id.eq.${search}`, `owner_user_id.eq.${search}`] : []),
        ].join(",")
      );
    }
    return query;
  };

  let { data, error } = await buildQuery(COMIDA_LOCAL_ADMIN_LISTING_SELECT);
  if (error && /suspended_reason/i.test(error.message)) {
    // A missing optional column must never turn the whole queue "unavailable": re-read without it (the
    // suspension reason then simply is not shown — it is never guessed).
    ({ data, error } = await buildQuery(COMIDA_LOCAL_ADMIN_LISTING_SELECT_NO_REASON));
  }
  if (error) return { rows: [], error: error.message };
  return { rows: ((data ?? []) as unknown as Record<string, unknown>[]).map(normalizeAdminRow), error: null };
}

/** Back-compat array form (errors swallowed → []). Used by the global admin search. */
export async function listAdminComidaLocalListings(
  sb: SupabaseClient,
  filters: ComidaLocalAdminListFilters = {}
): Promise<ComidaLocalAdminListingRow[]> {
  const res = await listAdminComidaLocalListingsDetailed(sb, filters);
  return res.error ? [] : res.rows;
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

export type ComidaLocalAdminActionResult =
  | {
      ok: true;
      id: string;
      slug: string | null;
      leonixAdId: string | null;
      fromStatus: string;
      toStatus: string;
      suspendedReason: string | null;
      paymentStatus: string | null;
    }
  | { ok: false; httpStatus: 400 | 404 | 409 | 500; error: string; message: string };

/**
 * The ONLY staff status mover for Comida Local. Reads the row, runs the payment-aware policy
 * (decideComidaLocalAdminAction) and applies it as a compare-and-set update. There is no raw
 * "set status to X" path: staff can never publish a row without payment proof, can never overwrite a
 * payment-engine suspension, and this function never writes payment_status. Caller enforces admin auth
 * and writes the audit row.
 */
export async function applyAdminComidaLocalAction(
  sb: SupabaseClient,
  id: string,
  action: ComidaLocalAdminAction
): Promise<ComidaLocalAdminActionResult> {
  const rowId = id.trim();
  if (!rowId) return { ok: false, httpStatus: 400, error: "missing_id", message: "Missing listing id." };
  if (!ADMIN_SEARCH_UUID_RE.test(rowId)) return { ok: false, httpStatus: 404, error: "not_found", message: "Listing not found." };

  const { data: row, error: readError } = await sb
    .from("comida_local_public_listings")
    .select("id, slug, leonix_ad_id, status, payment_status, published_at, suspended_reason")
    .eq("id", rowId)
    .maybeSingle();
  if (readError) return { ok: false, httpStatus: 500, error: "lookup_failed", message: "Could not read the listing." };
  if (!row) return { ok: false, httpStatus: 404, error: "not_found", message: "Listing not found." };

  const rec = row as Record<string, unknown>;
  const decision: ComidaLocalAdminActionDecision = decideComidaLocalAdminAction(action, {
    status: rec.status as string | null,
    payment_status: rec.payment_status as string | null,
    published_at: rec.published_at as string | null,
    suspended_reason: rec.suspended_reason as string | null,
  });
  if (!decision.ok) {
    return { ok: false, httpStatus: decision.httpStatus, error: decision.error, message: decision.message };
  }

  const patch: Record<string, unknown> = { ...decision.patch, updated_at: new Date().toISOString() };
  let update = sb
    .from("comida_local_public_listings")
    .update(patch)
    .eq("id", rowId)
    .eq("status", decision.expectStatus);
  if (decision.requireNonPaymentReason) {
    // Restore is a CAS that excludes payment suspensions: a concurrent payment-engine suspension wins.
    update = update.or("suspended_reason.is.null,suspended_reason.eq.moderation");
  }
  const { data: updated, error: updateError } = await update.select("id");
  if (updateError) return { ok: false, httpStatus: 500, error: "update_failed", message: updateError.message };
  // Zero-row detection: a silent no-op (the row moved under us) is reported, never claimed as success.
  if (!updated?.length) {
    return {
      ok: false,
      httpStatus: 409,
      error: "no_row_updated",
      message: "The listing changed while you were acting on it. Reload and try again.",
    };
  }

  return {
    ok: true,
    id: rowId,
    slug: typeof rec.slug === "string" ? rec.slug : null,
    leonixAdId: typeof rec.leonix_ad_id === "string" ? rec.leonix_ad_id : null,
    fromStatus: decision.expectStatus,
    toStatus: decision.patch.status,
    suspendedReason:
      "suspended_reason" in decision.patch ? decision.patch.suspended_reason ?? null : ((rec.suspended_reason as string | null) ?? null),
    paymentStatus: typeof rec.payment_status === "string" ? rec.payment_status : null,
  };
}
