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

const SESSION_LISTING_KEY = "lx-autos-publish-listing-privado";
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

  const cached =
    typeof window !== "undefined" ? window.sessionStorage.getItem(SESSION_LISTING_KEY) : null;

  if (cached) {
    const existing = await fetchAutosApi(`/api/clasificados/autos/listings/${cached}`, {
      headers: { Authorization: `Bearer ${input.accessToken}` },
    });
    if (existing.ok) {
      const row = (await existing.json()) as { status?: string; leonixAdId?: string | null };
      if (
        row.status === "draft" ||
        row.status === "pending_payment" ||
        row.status === "payment_failed"
      ) {
        const sync = await fetchAutosApi(`/api/clasificados/autos/listings/${cached}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${input.accessToken}`,
          },
          body: JSON.stringify({
            listing: prepareAutosListingForApiTransport(listing),
            lang,
          }),
        });
        if (sync.ok) {
          return { ok: true, listingId: cached, leonixAdId: row.leonixAdId?.trim() || null };
        }
        window.sessionStorage.removeItem(SESSION_LISTING_KEY);
      }
    } else {
      window.sessionStorage.removeItem(SESSION_LISTING_KEY);
    }
  }

  const create = await fetchAutosApi("/api/clasificados/autos/listings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({
      listing: prepareAutosListingForApiTransport(listing),
      lane: "privado",
      lang,
    }),
  });
  const created = (await create.json().catch(() => ({}))) as {
    ok?: boolean;
    id?: string;
    leonixAdId?: string | null;
    errorCode?: string;
    message?: string;
    error?: string;
  };
  if (!create.ok || !created.id) {
    return {
      ok: false,
      userMessage: autosConfirmErrorMessage(
        lang,
        created.errorCode ?? created.error,
        created.message ??
          (lang === "es"
            ? "No pudimos guardar tu anuncio antes del pago."
            : "We could not save your listing before checkout."),
      ),
    };
  }

  window.sessionStorage.setItem(SESSION_LISTING_KEY, created.id);
  return {
    ok: true,
    listingId: created.id,
    leonixAdId: created.leonixAdId?.trim() || null,
  };
}
