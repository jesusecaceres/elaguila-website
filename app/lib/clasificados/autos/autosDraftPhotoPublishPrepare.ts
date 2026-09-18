"use client";

import type { AutoDealerListing, MediaImageEntry } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  deriveHeroImageUrls,
  normalizeMediaImagesOrder,
} from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";
import {
  AUTOS_DRAFT_FINANCE_IMAGE_REF,
  AUTOS_DRAFT_LOGO_REF,
  mediaIdFromRef,
} from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftIdbRefs";
import {
  idbGetDealerLogoDataUrl,
  idbGetDraftImageDataUrl,
  idbGetFinanceImageDataUrl,
} from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftImageIdb";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  autosDraftImageRequiresUpload,
  isAutosNonDurableVideoRef,
  isAutosPublishableRemoteImageUrl,
} from "@/app/lib/clasificados/autos/autosPublishMediaTransport";

const UPLOAD_PATH = "/api/clasificados/autos/media/draft-photo-upload";

/**
 * Owner lock (2026-09-17, Gate 04): bounded concurrency for the EXISTING upload path — never
 * more than this many draft-photo uploads in flight at once, across the whole publish-prepare
 * call (parent gallery + every child vehicle share the same pool). No new queue library; this is
 * a small worker-pool over the same `uploadAutosDraftPhoto`/`resolveImageBlob` functions below.
 */
const AUTOS_DRAFT_UPLOAD_CONCURRENCY = 4;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!, i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

export type AutosPhotoPublishPrepareResult =
  | {
      ok: true;
      listing: AutoDealerListing;
      additionalInventoryVehicles: AutosAdditionalInventoryVehicleDraft[];
    }
  | {
      ok: false;
      kind: "local_video" | "upload_error" | "blob_unconfigured";
      message: string;
    };

async function resolveImageBlob(url: string, namespace: string): Promise<Blob> {
  const refId = mediaIdFromRef(url);
  if (refId) {
    const dataUrl = await idbGetDraftImageDataUrl(namespace, refId);
    if (!dataUrl) throw new Error("idb_image_missing");
    const res = await fetch(dataUrl);
    return res.blob();
  }
  if (url === AUTOS_DRAFT_LOGO_REF) {
    const dataUrl = await idbGetDealerLogoDataUrl(namespace);
    if (!dataUrl) throw new Error("idb_logo_missing");
    const res = await fetch(dataUrl);
    return res.blob();
  }
  if (url === AUTOS_DRAFT_FINANCE_IMAGE_REF) {
    const dataUrl = await idbGetFinanceImageDataUrl(namespace);
    if (!dataUrl) throw new Error("idb_finance_image_missing");
    const res = await fetch(dataUrl);
    return res.blob();
  }
  if (/^data:image\//i.test(url) || url.startsWith("blob:")) {
    const res = await fetch(url);
    return res.blob();
  }
  throw new Error("unsupported_image_ref");
}

async function uploadAutosDraftPhoto(
  blob: Blob,
  ctx: {
    draftId: string;
    slot: "gallery" | "logo" | "finance_image";
    index?: number;
    authToken?: string | null;
  },
): Promise<string> {
  const form = new FormData();
  form.set("draftId", ctx.draftId);
  form.set("slot", ctx.slot);
  if (ctx.index !== undefined) form.set("index", String(ctx.index));
  form.set("file", blob, "image.jpg");
  const headers: Record<string, string> = {};
  if (ctx.authToken) headers.Authorization = `Bearer ${ctx.authToken}`;
  const res = await fetch(UPLOAD_PATH, { method: "POST", body: form, headers });
  const j = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    publicUrl?: string;
    error?: string;
    detail?: string;
  };
  if (res.status === 503 && j.error === "blob_unconfigured") {
    throw new Error("blob_unconfigured");
  }
  if (!res.ok || !j.ok || typeof j.publicUrl !== "string") {
    const msg = [j.error, j.detail].filter(Boolean).join(": ") || `upload_http_${res.status}`;
    throw new Error(msg);
  }
  return j.publicUrl;
}

function assertAutosNoLocalVideo(listing: AutoDealerListing, lang: "es" | "en"): AutosPhotoPublishPrepareResult | null {
  if (listing.videoSourceType === "file" && listing.videoFileDataUrl?.trim()) {
    return {
      ok: false,
      kind: "local_video",
      message:
        lang === "es"
          ? "Los videos deben ser enlaces externos. Agrega un enlace de YouTube, TikTok, Facebook, Instagram o sitio web."
          : "Videos must be external links. Add a YouTube, TikTok, Facebook, Instagram, or website video link.",
    };
  }
  const refs = [listing.videoUrl, ...(listing.videoUrls ?? []), listing.videoFileDataUrl];
  for (const v of refs) {
    if (typeof v !== "string" || !v.trim()) continue;
    if (isAutosNonDurableVideoRef(v)) {
      return {
        ok: false,
        kind: "local_video",
        message:
          lang === "es"
            ? "Los videos deben ser enlaces externos. Agrega un enlace de YouTube, TikTok, Facebook, Instagram o sitio web."
            : "Videos must be external links. Add a YouTube, TikTok, Facebook, Instagram, or website video link.",
      };
    }
  }
  return null;
}

async function mapMediaImages(
  images: MediaImageEntry[] | undefined,
  namespace: string,
  draftId: string,
  authToken: string | null,
  onItemDone?: () => void,
): Promise<MediaImageEntry[] | undefined> {
  if (!images?.length) return images;
  const mapped = await mapWithConcurrency(images, AUTOS_DRAFT_UPLOAD_CONCURRENCY, async (m, i) => {
    const url = m.url ?? "";
    if (!url.trim()) {
      onItemDone?.();
      return null;
    }
    if (!autosDraftImageRequiresUpload(url)) {
      if (!isAutosPublishableRemoteImageUrl(url)) {
        throw new Error(`unsupported_gallery_ref_${i}`);
      }
      onItemDone?.();
      return m;
    }
    const blob = await resolveImageBlob(url, namespace);
    const publicUrl = await uploadAutosDraftPhoto(blob, {
      draftId,
      slot: "gallery",
      index: i,
      authToken,
    });
    onItemDone?.();
    return { ...m, url: publicUrl, sourceType: "url" as const };
  });
  const next = mapped.filter((m): m is MediaImageEntry => m !== null);
  return normalizeMediaImagesOrder(next);
}

async function resolveOptionalImageField(
  url: string | null | undefined,
  namespace: string,
  draftId: string,
  slot: "logo" | "finance_image",
  authToken: string | null,
  onItemDone?: () => void,
): Promise<string | null | undefined> {
  if (typeof url !== "string" || !url.trim()) return url ?? undefined;
  if (!autosDraftImageRequiresUpload(url)) {
    if (!isAutosPublishableRemoteImageUrl(url)) return undefined;
    onItemDone?.();
    return url.trim();
  }
  const blob = await resolveImageBlob(url, namespace);
  const publicUrl = await uploadAutosDraftPhoto(blob, { draftId, slot, authToken });
  onItemDone?.();
  return publicUrl;
}

/**
 * Browser-only: upload local / IndexedDB Autos draft photos to durable HTTPS Blob URLs
 * before listing create/PATCH/checkout (Rentas/Servicios publish bridge pattern).
 */
export async function resolveAutosDraftPhotosForPublish(input: {
  listing: AutoDealerListing;
  additionalInventoryVehicles?: AutosAdditionalInventoryVehicleDraft[];
  draftNamespace: string;
  draftId: string;
  authToken: string | null;
  lang: "es" | "en";
  /**
   * Owner lock (2026-09-17, Gate 05): optional truthful "X of Y" readiness reporting — counts
   * every image/logo/finance-image across the parent AND every child vehicle, including ones
   * that are already durable (they report done immediately, no network call). Never used to
   * gate Stripe/Revenue OS — purely a UI readiness signal for the caller.
   */
  onProgress?: (done: number, total: number) => void;
}): Promise<AutosPhotoPublishPrepareResult> {
  const videoBlock = assertAutosNoLocalVideo(input.listing, input.lang);
  if (videoBlock) return videoBlock;

  const childVehicles = input.additionalInventoryVehicles ?? [];
  const total =
    (input.listing.mediaImages?.length ?? 0) +
    (input.listing.dealerLogo?.trim() ? 1 : 0) +
    (input.listing.financeContactImageUrl?.trim() ? 1 : 0) +
    childVehicles.reduce((sum, v) => sum + (v.mediaImages?.length ?? 0), 0);
  let done = 0;
  const onItemDone = input.onProgress ? () => input.onProgress!(++done, total) : undefined;

  try {
    let listing = { ...input.listing };
    const mediaImages = await mapMediaImages(
      listing.mediaImages,
      input.draftNamespace,
      input.draftId,
      input.authToken,
      onItemDone,
    );
    if (mediaImages) {
      listing = {
        ...listing,
        mediaImages,
        heroImages: deriveHeroImageUrls({ ...listing, mediaImages }),
      };
    }

    const dealerLogo = await resolveOptionalImageField(
      listing.dealerLogo,
      input.draftNamespace,
      input.draftId,
      "logo",
      input.authToken,
      onItemDone,
    );
    if (dealerLogo !== listing.dealerLogo) {
      listing = { ...listing, dealerLogo: dealerLogo ?? undefined };
    }

    const financeContactImageUrl = await resolveOptionalImageField(
      listing.financeContactImageUrl,
      input.draftNamespace,
      input.draftId,
      "finance_image",
      input.authToken,
      onItemDone,
    );
    if (financeContactImageUrl !== listing.financeContactImageUrl) {
      listing = { ...listing, financeContactImageUrl: financeContactImageUrl ?? undefined };
    }

    let additionalInventoryVehicles = childVehicles;
    if (additionalInventoryVehicles.length) {
      const nextInv: AutosAdditionalInventoryVehicleDraft[] = [];
      for (let vi = 0; vi < additionalInventoryVehicles.length; vi++) {
        const v = additionalInventoryVehicles[vi]!;
        const invDraftId = `${input.draftId}-inv-${v.id ?? vi}`;
        const invMedia = await mapMediaImages(v.mediaImages, input.draftNamespace, invDraftId, input.authToken, onItemDone);
        if (invMedia) {
          nextInv.push({
            ...v,
            mediaImages: invMedia,
            heroImages: deriveHeroImageUrls({ ...v, mediaImages: invMedia } as AutoDealerListing),
          });
        } else {
          nextInv.push(v);
        }
      }
      additionalInventoryVehicles = nextInv;
    }

    return { ok: true, listing, additionalInventoryVehicles };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "upload_failed";
    if (msg === "blob_unconfigured") {
      return {
        ok: false,
        kind: "blob_unconfigured",
        message:
          input.lang === "es"
            ? "El almacenamiento de fotos de Autos no está configurado. Avísanos para habilitarlo."
            : "Autos photo storage is not configured. Contact us to enable it.",
      };
    }
    return {
      ok: false,
      kind: "upload_error",
      message:
        input.lang === "es"
          ? "No pudimos preparar tus fotos. Inténtalo de nuevo o elimina las fotos que no se puedan subir."
          : "We could not prepare your photos. Try again or remove photos that cannot be uploaded.",
    };
  }
}

export function autosDraftListingHasLocalPhotos(listing: AutoDealerListing): boolean {
  for (const m of listing.mediaImages ?? []) {
    if (autosDraftImageRequiresUpload(m.url ?? "")) return true;
  }
  if (autosDraftImageRequiresUpload(listing.dealerLogo ?? "")) return true;
  if (autosDraftImageRequiresUpload(listing.financeContactImageUrl ?? "")) return true;
  return false;
}

export function autosInventoryDraftHasLocalPhotos(vehicles: AutosAdditionalInventoryVehicleDraft[]): boolean {
  for (const v of vehicles) {
    for (const m of v.mediaImages ?? []) {
      if (autosDraftImageRequiresUpload(m.url ?? "")) return true;
    }
  }
  return false;
}
