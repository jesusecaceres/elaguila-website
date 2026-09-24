import type { SupabaseClient } from "@supabase/supabase-js";

import { mergeComidaLocalDraftFromStorage } from "./comidaLocalDraftPersistence";
import { comidaLocalDraftFromLegacyRowColumns } from "./comidaLocalLegacyRowMapper";
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

/**
 * Staff assisted reopen: the raw canonical row the signed context is bound to -> the application
 * draft, via the same mapper as the owner edit. A row without a usable `listing_json` is reconstructed
 * from its normalized columns (comidaLocalLegacyRowMapper.ts); null (never a blank draft) when it is
 * below that safe minimum or is not editable, so a reopen can never replace the form with an empty one.
 */
export function comidaLocalDraftFromAssistedBoundRow(
  row: Record<string, unknown>,
  listingId: string,
): ComidaLocalDraft | null {
  const result = comidaLocalEditHydrationFromRow(row, listingId);
  return result.ok ? result.draft : null;
}

/**
 * Bilingual, staff-safe notice shown INSTEAD of the form when a reopened row cannot be reconstructed
 * safely (`comidaLocalDraftFromAssistedBoundRow` returned null). The intake never opens a blank
 * editable form over an existing listing.
 */
export const COMIDA_LOCAL_ASSISTED_REOPEN_UNSAFE_NOTICE = {
  titleEs: "No se puede reabrir este anuncio de forma segura",
  titleEn: "This listing cannot be reopened safely",
  bodyEs:
    "Este anuncio guardado no tiene datos suficientes para cargarlo en el formulario (faltan nombre, descripción, ciudad o contacto). Para no sobrescribir el anuncio real con un formulario vacío, no se abrió el formulario ni se puede guardar desde aquí. Contacta a soporte de Leonix.",
  bodyEn:
    "This saved listing does not have enough data to load into the form (name, description, city or contact is missing). To avoid overwriting the real listing with an empty form, the form was not opened and saving from here is disabled. Contact Leonix support.",
} as const;

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
    // Literal (not built from COMIDA_LOCAL_LEGACY_ROW_COLUMNS) so the postgrest select stays typed;
    // the trailing columns are the legacy reverse-mapper inputs (a verifier pins the two in sync).
    .select(
      "id, slug, leonix_ad_id, status, draft_listing_id, updated_at, listing_json, " +
        "business_name, food_type, food_type_custom, city_canonical, city_display, zone_note, que_vendes, " +
        "phone, whatsapp, instagram_url, facebook_url, tiktok_url, location_note, location_url, " +
        "availability_note, service_options, payment_methods, payment_other_note, price_level, languages, " +
        "main_photo, logo_image, gallery_images",
    )
    .eq("id", listingId)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();
  if (error) return { ok: false, reason: "query_error" };
  if (!data) return { ok: false, reason: "not_found" };

  // The select list is a long concatenated string, so supabase-js cannot infer a row type from it.
  return comidaLocalEditHydrationFromRow(data as unknown as Record<string, unknown>, listingId);
}

/**
 * The category's ONE row -> draft mapper (pure). Shared by the owner-scoped fetch above and by the
 * staff assisted reopen (`useAssistedBoundRow`), so a reopened row hydrates exactly like an owner edit.
 */
export function comidaLocalEditHydrationFromRow(
  row: Record<string, unknown>,
  listingId: string,
): ComidaLocalEditHydrationResult {
  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  const rowDraftListingId = typeof row.draft_listing_id === "string" ? row.draft_listing_id.trim() : "";
  if (!slug || !rowDraftListingId) return { ok: false, reason: "not_editable_legacy_row" };

  // The row's stored listing_json IS the application draft (tolerantly re-sanitized). The
  // draftListingId is forced to the ROW's column value — that is what the publish route's
  // same-row update branch matches on.
  //
  // A missing / non-object / identity-less listing_json (legacy row) must NEVER yield an empty
  // draft: merging `undefined` returns a blank draft that a save would write over the real row's
  // columns. Such a row falls back to the deterministic reverse mapping of its normalized columns
  // (comidaLocalLegacyRowMapper.ts) and, when even that is below the safe minimum, is refused.
  const rawJson = row.listing_json;
  const jsonDraft =
    rawJson && typeof rawJson === "object" && !Array.isArray(rawJson)
      ? mergeComidaLocalDraftFromStorage(row.listing_json)
      : null;
  let baseDraft: ComidaLocalDraft | null = jsonDraft && jsonDraft.businessName.trim() ? jsonDraft : null;
  if (!baseDraft) {
    const legacy = comidaLocalDraftFromLegacyRowColumns(row);
    if (!legacy.ok) return { ok: false, reason: "not_editable_legacy_row" };
    baseDraft = legacy.draft;
  }
  const draft: ComidaLocalDraft = {
    ...baseDraft,
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
