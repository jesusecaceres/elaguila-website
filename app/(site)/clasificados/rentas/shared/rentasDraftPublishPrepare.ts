/**
 * Browser-only: convert Rentas draft `data:image/*` and `blob:` refs to HTTPS Blob URLs
 * before `publishLeonixListingFromRentas*Draft` (same bridge pattern as Restaurantes
 * `resolveRestauranteDraftMediaToRemoteUrls`).
 */

import type { RentasNegocioFormState } from "@/app/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import {
  isRentasPublishableRemoteImageRef,
  rentasDraftImageRequiresBlobUpload,
} from "@/app/clasificados/rentas/shared/rentasPublishMediaTransport";

const UPLOAD_PATH = "/api/clasificados/rentas/draft-media-upload";

async function uploadBlobForRentasDraft(
  blob: Blob,
  ctx: { draftId: string; slot: "gallery" | "logo"; index?: number },
): Promise<string> {
  const form = new FormData();
  form.set("draftId", ctx.draftId);
  form.set("slot", ctx.slot);
  if (ctx.index !== undefined) form.set("index", String(ctx.index));
  form.set("file", blob, "image.jpg");
  const res = await fetch(UPLOAD_PATH, { method: "POST", body: form });
  const j = (await res.json()) as { ok?: boolean; publicUrl?: string; error?: string; detail?: string };
  if (!res.ok || !j.ok || typeof j.publicUrl !== "string") {
    const msg = [j.error, j.detail].filter(Boolean).join(": ") || `upload_http_${res.status}`;
    throw new Error(msg);
  }
  return j.publicUrl;
}

async function resolveImageRefToPublicUrl(
  url: string,
  ctx: { draftId: string; slot: "gallery" | "logo"; index?: number },
): Promise<string> {
  const t = url.trim();
  if (!t) return t;
  if (isRentasPublishableRemoteImageRef(t)) return t;
  if (/^data:image\//i.test(t)) {
    const res = await fetch(t);
    const blob = await res.blob();
    return uploadBlobForRentasDraft(blob, ctx);
  }
  if (t.startsWith("blob:")) {
    const res = await fetch(t);
    const blob = await res.blob();
    return uploadBlobForRentasDraft(blob, ctx);
  }
  throw new Error(
    `rentas_publish_media: unsupported image ref (use data:image, blob:, or https). Got: ${t.slice(0, 48)}…`,
  );
}

async function mapGalleryUrls(urls: readonly string[], draftId: string): Promise<string[]> {
  return Promise.all(
    urls.map(async (u, i) => {
      if (typeof u !== "string" || !u.trim()) return u;
      if (!rentasDraftImageRequiresBlobUpload(u) && isRentasPublishableRemoteImageRef(u)) return u.trim();
      if (rentasDraftImageRequiresBlobUpload(u)) {
        return resolveImageRefToPublicUrl(u, { draftId, slot: "gallery", index: i });
      }
      throw new Error(`rentas_publish_media: cannot transport gallery image at index ${i}`);
    }),
  );
}

function assertGalleryTransportClean(urls: readonly string[], label: string): void {
  const nonEmptyIdx = urls
    .map((u, i) => (typeof u === "string" && u.trim() ? i : -1))
    .filter((i) => i >= 0);
  if (!nonEmptyIdx.length) return;
  for (const i of nonEmptyIdx) {
    const u = urls[i] as string;
    const t = u.trim();
    if (!/^https:\/\//i.test(t)) {
      throw new Error(`${label}: gallery[${i}] must be HTTPS before publish (http, data:, and blob: are not allowed).`);
    }
    if (!isRentasPublishableRemoteImageRef(u)) {
      throw new Error(`${label}: gallery[${i}] is not a publishable HTTPS URL after prepare`);
    }
  }
}

export async function resolveRentasPrivadoDraftMediaToRemoteUrls(
  state: RentasPrivadoFormState,
  draftId: string,
): Promise<RentasPrivadoFormState> {
  const photoDataUrls = await mapGalleryUrls(state.media.photoDataUrls, draftId);
  assertGalleryTransportClean(photoDataUrls, "Rentas privado");
  return {
    ...state,
    media: {
      ...state.media,
      photoDataUrls,
    },
  };
}

export async function resolveRentasNegocioDraftMediaToRemoteUrls(
  state: RentasNegocioFormState,
  draftId: string,
): Promise<RentasNegocioFormState> {
  const photoDataUrls = await mapGalleryUrls(state.media.photoDataUrls, draftId);
  assertGalleryTransportClean(photoDataUrls, "Rentas negocio");

  let negocioLogoDataUrl = state.negocioLogoDataUrl;
  if (typeof negocioLogoDataUrl === "string" && negocioLogoDataUrl.trim()) {
    if (rentasDraftImageRequiresBlobUpload(negocioLogoDataUrl)) {
      negocioLogoDataUrl = await resolveImageRefToPublicUrl(negocioLogoDataUrl, { draftId, slot: "logo" });
    } else if (!isRentasPublishableRemoteImageRef(negocioLogoDataUrl)) {
      throw new Error("rentas_publish_media: negocio logo is not a supported image ref");
    }
  }

  return {
    ...state,
    media: {
      ...state.media,
      photoDataUrls,
    },
    negocioLogoDataUrl,
  };
}
