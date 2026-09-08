import type { SupabaseClient } from "@supabase/supabase-js";

import { mergeComidaLocalDraftFromStorage } from "./comidaLocalDraftPersistence";
import type { ComidaLocalDraft } from "./comidaLocalTypes";

/**
 * Globalization Package A closure — Comida Local dedicated listing-edit context.
 *
 * The category's rows persist the COMPLETE application draft as `listing_json` (see
 * `draftToComidaLocalPublicListingInsert`), and the publish route's update branch keys
 * same-row updates by `draft_listing_id` while preserving id, slug, Leonix Ad ID, status,
 * payment status, and ownership (I.13A ownership guard). This module is therefore the whole
 * category adapter the editor needs:
 *  - `fetchOwnerComidaLocalListingForEdit` — owner-scoped hydration (RLS owner-select policy +
 *    explicit owner_user_id match) returning the row's own draft, fail-closed on anything
 *    ambiguous (missing row, missing `draft_listing_id` on a legacy row — publishing such a
 *    draft would INSERT a duplicate, so editing is refused instead).
 *  - a hard-refresh-safe localStorage edit-context marker so the application, preview, and
 *    return-to-edit all agree which listing is being edited and which edit workspace key
 *    (draftWorkspaceContract Rule 1 — never the new-ad key) holds the unsaved changes.
 */

export type ComidaLocalListingEditContext = {
  listingId: string;
  slug: string;
  leonixAdId: string | null;
  status: string;
  draftListingId: string;
  /** Row `updated_at` as hydrated — draftWorkspaceContract Rule 3 anchor. */
  sourceUpdatedAt: string | null;
};

const EDIT_CONTEXT_STORAGE_KEY = "leonix:comida-local:edit-context:v1";

export function readComidaLocalEditContext(): ComidaLocalListingEditContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(EDIT_CONTEXT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ComidaLocalListingEditContext>;
    const listingId = typeof parsed.listingId === "string" ? parsed.listingId.trim() : "";
    const slug = typeof parsed.slug === "string" ? parsed.slug.trim() : "";
    const draftListingId = typeof parsed.draftListingId === "string" ? parsed.draftListingId.trim() : "";
    if (!listingId || !slug || !draftListingId) return null;
    return {
      listingId,
      slug,
      leonixAdId: typeof parsed.leonixAdId === "string" && parsed.leonixAdId.trim() ? parsed.leonixAdId.trim() : null,
      status: typeof parsed.status === "string" ? parsed.status : "",
      draftListingId,
      sourceUpdatedAt:
        typeof parsed.sourceUpdatedAt === "string" && parsed.sourceUpdatedAt.trim() ? parsed.sourceUpdatedAt.trim() : null,
    };
  } catch {
    return null;
  }
}

export function writeComidaLocalEditContext(context: ComidaLocalListingEditContext): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EDIT_CONTEXT_STORAGE_KEY, JSON.stringify(context));
  } catch {
    /* best-effort */
  }
}

export function clearComidaLocalEditContext(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(EDIT_CONTEXT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export type ComidaLocalEditHydrationResult =
  | { ok: true; draft: ComidaLocalDraft; context: ComidaLocalListingEditContext }
  | { ok: false; reason: "not_found" | "not_editable_legacy_row" | "query_error" };

/**
 * Owner-scoped hydration of an existing listing into its application draft. `ownerUserId`
 * must come from `auth.getUser()` — never from a query/body value. Fail-closed: a row without
 * a `draft_listing_id` cannot be edited (the publish update branch keys on it; a regenerated
 * id would INSERT a duplicate listing instead of updating this row).
 */
export async function fetchOwnerComidaLocalListingForEdit(
  sb: SupabaseClient,
  input: { ownerUserId: string; listingId: string },
): Promise<ComidaLocalEditHydrationResult> {
  const ownerUserId = input.ownerUserId.trim();
  const listingId = input.listingId.trim();
  if (!ownerUserId || !listingId) return { ok: false, reason: "not_found" };

  const { data, error } = await sb
    .from("comida_local_public_listings")
    .select("id, slug, leonix_ad_id, status, draft_listing_id, updated_at, listing_json")
    .eq("id", listingId)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  if (error) return { ok: false, reason: "query_error" };
  if (!data) return { ok: false, reason: "not_found" };

  const row = data as Record<string, unknown>;
  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  const rowDraftListingId = typeof row.draft_listing_id === "string" ? row.draft_listing_id.trim() : "";
  if (!slug || !rowDraftListingId) return { ok: false, reason: "not_editable_legacy_row" };

  // The row's stored listing_json IS the application draft (tolerantly re-sanitized). The
  // draftListingId is forced to the ROW's column value — that is what the publish route's
  // same-row update branch matches on.
  const draft: ComidaLocalDraft = {
    ...mergeComidaLocalDraftFromStorage(row.listing_json),
    draftListingId: rowDraftListingId,
  };

  return {
    ok: true,
    draft,
    context: {
      listingId,
      slug,
      leonixAdId: typeof row.leonix_ad_id === "string" && row.leonix_ad_id.trim() ? row.leonix_ad_id.trim() : null,
      status: typeof row.status === "string" ? row.status : "",
      draftListingId: rowDraftListingId,
      sourceUpdatedAt: typeof row.updated_at === "string" && row.updated_at.trim() ? row.updated_at.trim() : null,
    },
  };
}
