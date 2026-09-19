/**
 * Autos Privado — persist an owner's DASHBOARD EDIT to the SAME row (same UUID, same status).
 *
 * Proven defect (2026-09 category closeout): opening an active Privado listing from the dashboard
 * hydrated a local draft, the preview re-fetched the DB row and discarded the edits, the preview had
 * no Save (checkout hidden in dashboard_edit) and the server refused to PATCH an active privado row —
 * so edits never persisted, and the only remaining button ("continue to publish") POSTed a NEW row
 * and started a new $24.99 checkout. This helper is the missing Save: it PATCHes the declared id,
 * never creates a row, never touches status / expires_at, never calls checkout.
 */
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { resolveAutosPrivadoDraftNamespace } from "@/app/clasificados/autos/privado/lib/autosPrivadoDraftNamespace";
import {
  autosDraftListingHasLocalPhotos,
  resolveAutosDraftPhotosForPublish,
} from "@/app/lib/clasificados/autos/autosDraftPhotoPublishPrepare";
import { prepareAutosListingForApiTransport } from "@/app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare";

export type SaveAutosPrivadoDashboardEditResult = { ok: true } | { ok: false; userMessage: string };

export async function saveAutosPrivadoDashboardEdit(input: {
  listing: AutoDealerListing;
  lang: "es" | "en";
  accessToken: string;
  listingId: string;
}): Promise<SaveAutosPrivadoDashboardEditResult> {
  const lang = input.lang === "en" ? "en" : "es";
  const listingId = input.listingId.trim();
  if (!listingId) {
    return {
      ok: false,
      userMessage: lang === "es" ? "No se encontró el anuncio que estás editando." : "We could not find the listing you are editing.",
    };
  }
  let listing = { ...input.listing, autosLane: "privado" as const };

  if (autosDraftListingHasLocalPhotos(listing)) {
    const draftNamespace = await resolveAutosPrivadoDraftNamespace();
    const draftId = draftNamespace.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 80) || "privado";
    const photoResult = await resolveAutosDraftPhotosForPublish({
      listing,
      additionalInventoryVehicles: [],
      draftNamespace,
      draftId,
      authToken: input.accessToken,
      lang,
    });
    if (!photoResult.ok) return { ok: false, userMessage: photoResult.message };
    listing = { ...photoResult.listing, autosLane: "privado" };
  }

  const genericFailure = lang === "es" ? "No pudimos guardar los cambios. Intenta de nuevo." : "We could not save your changes. Please try again.";
  try {
    const res = await fetch(`/api/clasificados/autos/listings/${encodeURIComponent(listingId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${input.accessToken}` },
      body: JSON.stringify({ listing: prepareAutosListingForApiTransport(listing), lang }),
    });
    if (res.ok) return { ok: true };
    const j = (await res.json().catch(() => ({}))) as { errorCode?: string; message?: string };
    if (j.errorCode === "AUTOS_LISTING_STATUS_NOT_EDITABLE") {
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
