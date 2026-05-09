"use client";

import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import { normalizeClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationNormalize";
import { inlineServiciosHeavyMediaFromIdb } from "./clasificadosServiciosDraftMedia";
import { SERVICIOS_DRAFT_MEDIA_NAMESPACE } from "./clasificadosServiciosStorage";
import { isServiciosPublishableRemoteMediaUrl, isServiciosLocalOrTransportBlockedRef } from "./serviciosMediaTransport";

const PUBLISH_BLOB_NS_KEY = "leonix.servicios.publishDraftBlobNs";

export function getServiciosPublishDraftListingId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let v = sessionStorage.getItem(PUBLISH_BLOB_NS_KEY);
    if (!v) {
      v = `sv${Date.now().toString(36)}${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(PUBLISH_BLOB_NS_KEY, v);
    }
    return v;
  } catch {
    return `sv-fallback-${Date.now()}`;
  }
}

const SLOTS = new Set([
  "logo",
  "cover",
  "gallery",
  "video",
  "promoImage",
  "promoPdf",
  "licenseDoc",
  "insuranceDoc",
]);

async function uploadBlobForDraft(
  blob: Blob,
  ctx: { draftListingId: string; slot: string; index?: number },
): Promise<string> {
  if (!SLOTS.has(ctx.slot)) throw new Error(`bad_slot:${ctx.slot}`);
  const form = new FormData();
  form.set("draftListingId", ctx.draftListingId);
  form.set("slot", ctx.slot);
  if (ctx.index !== undefined) form.set("index", String(ctx.index));
  const mime = blob.type || "image/jpeg";
  const ext =
    mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("pdf") ? "pdf" : mime.includes("webm") ? "webm" : "jpg";
  form.set("file", blob, `upload.${ext}`);
  const res = await fetch("/api/clasificados/servicios/draft-media-upload", {
    method: "POST",
    body: form,
  });
  const j = (await res.json()) as { ok?: boolean; publicUrl?: string; error?: string; detail?: string };
  if (!res.ok || !j.ok || typeof j.publicUrl !== "string") {
    const msg = [j.error, j.detail].filter(Boolean).join(": ") || `upload_http_${res.status}`;
    throw new Error(msg);
  }
  return j.publicUrl;
}

async function uploadUrlIfNeeded(
  url: string,
  ctx: { draftListingId: string; slot: string; index?: number },
): Promise<string> {
  const t = url.trim();
  if (!t) return t;
  if (isServiciosPublishableRemoteMediaUrl(t)) return t;
  if (!isServiciosLocalOrTransportBlockedRef(t)) return t;

  const res = await fetch(t);
  const blob = await res.blob();
  if (!blob || blob.size < 1) throw new Error("empty_blob_after_fetch");
  return uploadBlobForDraft(blob, ctx);
}

/**
 * Expand IDB placeholders to data URLs, then replace data:/blob: media with Vercel Blob HTTPS URLs
 * so `POST /api/clasificados/servicios/publish` stays under platform limits.
 */
export async function resolveServiciosDraftMediaToRemoteUrls(
  state: ClasificadosServiciosApplicationState,
): Promise<ClasificadosServiciosApplicationState> {
  const draftListingId = getServiciosPublishDraftListingId();
  let working = normalizeClasificadosServiciosApplicationState(state);
  try {
    working = await inlineServiciosHeavyMediaFromIdb(SERVICIOS_DRAFT_MEDIA_NAMESPACE, working);
  } catch {
    working = normalizeClasificadosServiciosApplicationState(working);
  }
  working = normalizeClasificadosServiciosApplicationState(working);

  let logoUrl = working.logoUrl;
  if (logoUrl.trim() && !isServiciosPublishableRemoteMediaUrl(logoUrl)) {
    logoUrl = await uploadUrlIfNeeded(logoUrl, { draftListingId, slot: "logo" });
  }

  let coverUrl = working.coverUrl;
  if (coverUrl.trim() && !isServiciosPublishableRemoteMediaUrl(coverUrl)) {
    coverUrl = await uploadUrlIfNeeded(coverUrl, { draftListingId, slot: "cover" });
  }

  const gallery = await Promise.all(
    (working.gallery ?? []).map(async (g, i) => {
      const u = g.url;
      if (!u.trim() || isServiciosPublishableRemoteMediaUrl(u)) return g;
      const next = await uploadUrlIfNeeded(u, { draftListingId, slot: "gallery", index: i });
      return { ...g, url: next, source: g.source };
    }),
  );

  const videos = await Promise.all(
    (working.videos ?? []).map(async (v, i) => {
      const u = v.url;
      if (!u.trim() || isServiciosPublishableRemoteMediaUrl(u)) return v;
      const next = await uploadUrlIfNeeded(u, { draftListingId, slot: "video", index: i });
      return { ...v, url: next, source: v.source };
    }),
  );

  const promotions = await Promise.all(
    (working.promotions ?? []).map(async (row, i) => {
      let imageUrl = row.imageUrl;
      if (imageUrl.trim() && !isServiciosPublishableRemoteMediaUrl(imageUrl)) {
        imageUrl = await uploadUrlIfNeeded(imageUrl, { draftListingId, slot: "promoImage", index: i });
      }
      let pdfUrl = row.pdfUrl;
      if (pdfUrl.trim() && !isServiciosPublishableRemoteMediaUrl(pdfUrl)) {
        pdfUrl = await uploadUrlIfNeeded(pdfUrl, { draftListingId, slot: "promoPdf", index: i });
      }
      return { ...row, imageUrl, pdfUrl };
    }),
  );

  let licenseDocumentUrl = working.licenseDocumentUrl;
  if (licenseDocumentUrl.trim() && !isServiciosPublishableRemoteMediaUrl(licenseDocumentUrl)) {
    licenseDocumentUrl = await uploadUrlIfNeeded(licenseDocumentUrl, { draftListingId, slot: "licenseDoc" });
  }

  let insuranceDocumentUrl = working.insuranceDocumentUrl;
  if (insuranceDocumentUrl.trim() && !isServiciosPublishableRemoteMediaUrl(insuranceDocumentUrl)) {
    insuranceDocumentUrl = await uploadUrlIfNeeded(insuranceDocumentUrl, { draftListingId, slot: "insuranceDoc" });
  }

  return normalizeClasificadosServiciosApplicationState({
    ...working,
    logoUrl,
    coverUrl,
    gallery,
    videos,
    promotions,
    licenseDocumentUrl,
    insuranceDocumentUrl,
  });
}
