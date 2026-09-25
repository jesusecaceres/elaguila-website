/**
 * Autos Privado — persist an owner's DASHBOARD EDIT to the SAME row (same UUID, same status).
 *
 * Recovery port of d3ed73abf (final form a4a1749b4), adapted to golden-survivor.
 *
 * Proven defect (2026-09 category closeout): opening an active Privado listing from the dashboard
 * hydrated a local draft, the preview had no Save (checkout hidden in dashboard_edit) and the server
 * refused to PATCH an active privado row — so edits never persisted, and the only remaining button
 * ("continue to publish") POSTed a NEW row and started a new checkout. This helper is the missing
 * Save: it PATCHes the declared id via the existing owner-scoped `/api/clasificados/autos/listings/[id]`
 * route (same owner-bearer PATCH the Negocios dashboard-edit canonical branch uses), never creates a
 * row, never touches status / expires_at / payment fields, never calls checkout.
 *
 * Golden adaptation: the declared row is read first and must be a `privado` row (mirrors the
 * `wrong_lane` fail-closed rule of `saveAutosListingToCanonicalRow`); the server remains the authority
 * on ownership, editable status and the vehicle identity-substitution guard.
 */
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { resolveAutosPrivadoDraftNamespace } from "@/app/clasificados/autos/privado/lib/autosPrivadoDraftNamespace";
import {
  autosDraftListingHasLocalPhotos,
  resolveAutosDraftPhotosForPublish,
} from "@/app/lib/clasificados/autos/autosDraftPhotoPublishPrepare";
import { prepareAutosListingForApiTransport } from "@/app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare";
import { autosCanonicalSaveMessage } from "@/app/lib/clasificados/autos/autosCanonicalListingIdentity";

export type SaveAutosPrivadoDashboardEditResult = { ok: true } | { ok: false; userMessage: string };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function saveAutosPrivadoDashboardEdit(input: {
  listing: AutoDealerListing;
  lang: "es" | "en";
  accessToken: string;
  listingId: string;
  /** Injectable for pure verification; defaults to the global fetch. */
  fetchFn?: FetchLike;
}): Promise<SaveAutosPrivadoDashboardEditResult> {
  const lang = input.lang === "en" ? "en" : "es";
  const fetchFn: FetchLike = input.fetchFn ?? ((u, i) => fetch(u, i));
  const listingId = input.listingId.trim();
  if (!listingId) {
    return {
      ok: false,
      userMessage: lang === "es" ? "No se encontró el anuncio que estás editando." : "We could not find the listing you are editing.",
    };
  }
  const token = input.accessToken.trim();
  if (!token) return { ok: false, userMessage: autosCanonicalSaveMessage("auth", lang) };

  const genericFailure = lang === "es" ? "No pudimos guardar los cambios. Intenta de nuevo." : "We could not save your changes. Please try again.";
  const url = `/api/clasificados/autos/listings/${encodeURIComponent(listingId)}`;
  const auth = { Authorization: `Bearer ${token}` };

  // Lane check on the declared row (fail closed; never falls back to POST/create).
  try {
    const r = await fetchFn(url, { headers: auth });
    if (r.status === 401 || r.status === 403) return { ok: false, userMessage: autosCanonicalSaveMessage("auth", lang) };
    if (r.status === 404) return { ok: false, userMessage: autosCanonicalSaveMessage("not_found", lang) };
    if (!r.ok) return { ok: false, userMessage: genericFailure };
    const j = ((await r.json().catch(() => ({}))) ?? {}) as { lane?: unknown };
    const lane = typeof j.lane === "string" ? j.lane.trim() : "";
    if (lane && lane !== "privado") return { ok: false, userMessage: autosCanonicalSaveMessage("wrong_lane", lang) };
  } catch {
    return { ok: false, userMessage: genericFailure };
  }

  let listing: AutoDealerListing = { ...input.listing, autosLane: "privado" };

  if (autosDraftListingHasLocalPhotos(listing)) {
    const draftNamespace = await resolveAutosPrivadoDraftNamespace();
    const draftId = draftNamespace.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 80) || "privado";
    const photoResult = await resolveAutosDraftPhotosForPublish({
      listing,
      additionalInventoryVehicles: [],
      draftNamespace,
      draftId,
      authToken: token,
      lang,
    });
    if (!photoResult.ok) return { ok: false, userMessage: photoResult.message };
    listing = { ...photoResult.listing, autosLane: "privado" };
  }

  try {
    const res = await fetchFn(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ listing: prepareAutosListingForApiTransport(listing), lang }),
    });
    if (res.ok) return { ok: true };
    const j = ((await res.json().catch(() => ({}))) ?? {}) as { errorCode?: string; error?: string; message?: string };
    if (res.status === 404) return { ok: false, userMessage: autosCanonicalSaveMessage("not_found", lang) };
    if (res.status === 401 || res.status === 403) return { ok: false, userMessage: autosCanonicalSaveMessage("auth", lang) };
    if (j.error === "status_not_editable" || j.errorCode === "AUTOS_LISTING_STATUS_NOT_EDITABLE") {
      return {
        ok: false,
        userMessage:
          lang === "es" ? "Este anuncio no se puede editar en su estado actual." : "This listing cannot be edited in its current status.",
      };
    }
    return { ok: false, userMessage: j.message?.trim() || genericFailure };
  } catch {
    return { ok: false, userMessage: genericFailure };
  }
}
