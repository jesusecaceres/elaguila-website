/**
 * Hidden pending save for Autos Privado before Revenue OS Stripe checkout.
 * Gate AUTOS-PRIVADO-REVENUE-OS-PREVIEW-CHECKOUT-01
 *
 * Creates or syncs a draft / pending_payment row — never publishes before payment.
 */

import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { autosConfirmErrorMessage } from "@/app/lib/clasificados/autos/autosPublishApiContract";
import { resolveAutosPrivadoDraftNamespace } from "@/app/clasificados/autos/privado/lib/autosPrivadoDraftNamespace";
import {
  autosDraftListingHasLocalPhotos,
  resolveAutosDraftPhotosForPublish,
} from "@/app/lib/clasificados/autos/autosDraftPhotoPublishPrepare";
import {
  prepareAutosListingForApiTransport,
} from "@/app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare";
import { saveAutosPrivadoDraftResolved } from "@/app/clasificados/autos/privado/lib/autosPrivadoDraftStorage";
import { rememberAutosDraftNamespaceHint } from "@/app/clasificados/autos/shared/lib/autosDraftPreviewNamespaceHint";
import {
  getBrowserAutosIdentityStorages,
  readAutosExplicitListingIdFromSearch,
  saveAutosListingToCanonicalRow,
} from "@/app/lib/clasificados/autos/autosCanonicalListingIdentity";

const PREPARE_TIMEOUT_MS = 15_000;

export type SaveAutosPrivadoPendingResult =
  | { ok: true; listingId: string; leonixAdId: string | null }
  | { ok: false; userMessage: string };

async function fetchAutosApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), PREPARE_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

/** Dashboard edit context (`?source=dashboard&edit=1&listingId=`) declares the row a save must update. */
function readDashboardEditListingIdFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);
  if (q.get("source") !== "dashboard" || q.get("edit") !== "1") return null;
  return readAutosExplicitListingIdFromSearch(window.location.search);
}

function hasConfirmableAutosDraft(listing: AutoDealerListing): boolean {
  const textSeed = [
    listing.vehicleTitle,
    listing.make,
    listing.model,
    listing.trim,
    listing.city,
    listing.state,
    listing.dealerName,
    listing.dealerPhoneOffice,
    listing.dealerWhatsapp,
    listing.dealerEmail,
  ].some((v) => typeof v === "string" && v.trim().length > 0);
  const numericSeed =
    (typeof listing.year === "number" && Number.isFinite(listing.year)) ||
    (typeof listing.price === "number" && Number.isFinite(listing.price)) ||
    (typeof listing.mileage === "number" && Number.isFinite(listing.mileage));
  const mediaSeed = Boolean(
    listing.mediaImages?.length ||
      listing.heroImages?.length ||
      listing.videoUrls?.length ||
      listing.videoUrl?.trim(),
  );
  return textSeed || numericSeed || mediaSeed;
}

export async function saveAutosPrivadoPendingBeforeCheckout(input: {
  listing: AutoDealerListing;
  lang: "es" | "en";
  accessToken: string;
  /** Canonical row this save must update (dashboard edit / caller-known id). Never creates a second row. */
  existingListingId?: string | null;
}): Promise<SaveAutosPrivadoPendingResult> {
  const lang = input.lang === "en" ? "en" : "es";
  let listing = { ...input.listing, autosLane: "privado" as const };

  if (!hasConfirmableAutosDraft(listing)) {
    return {
      ok: false,
      userMessage:
        lang === "es"
          ? "Completa los datos del vehículo antes de iniciar el pago seguro."
          : "Complete your vehicle details before starting secure checkout.",
    };
  }

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
    if (!photoResult.ok) {
      return { ok: false, userMessage: photoResult.message };
    }
    listing = { ...photoResult.listing, autosLane: "privado" };
    rememberAutosDraftNamespaceHint("privado", draftNamespace);
    await saveAutosPrivadoDraftResolved(draftNamespace, {
      v: 1,
      vehicleTitleOverride: false,
      listing,
    });
  }

  // ONE APPLICATION = ONE CANONICAL ROW (closeout 2): the identity is bound to the draft (session +
  // local storage, per-user namespace) and a declared identity can only end in PATCH-the-same-row or a
  // fail-closed error — it never falls through to POST. Only a brand-new application POSTs.
  let namespace: string | null = null;
  try {
    namespace = await resolveAutosPrivadoDraftNamespace();
  } catch {
    namespace = null;
  }
  const saved = await saveAutosListingToCanonicalRow({
    lane: "privado",
    lang,
    token: input.accessToken,
    listingPayload: prepareAutosListingForApiTransport(listing),
    explicitListingId: input.existingListingId?.trim() || readDashboardEditListingIdFromLocation(),
    namespace,
    fetchFn: fetchAutosApi,
    storages: getBrowserAutosIdentityStorages(),
  });
  if (!saved.ok) {
    return {
      ok: false,
      userMessage:
        saved.code === "create_failed"
          ? autosConfirmErrorMessage(lang, saved.errorCode ?? undefined, saved.message)
          : saved.message,
    };
  }
  return { ok: true, listingId: saved.listingId, leonixAdId: saved.leonixAdId };
}
