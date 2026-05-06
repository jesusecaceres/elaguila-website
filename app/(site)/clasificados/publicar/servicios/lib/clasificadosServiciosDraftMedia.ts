import type { ClasificadosServiciosApplicationState, GalleryItem, VideoItem } from "./clasificadosServiciosApplicationTypes";
import { normalizeClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationNormalize";
import {
  idbServiciosClearNamespace,
  idbServiciosGetDataUrl,
  idbServiciosPutDataUrl,
} from "./clasificadosServiciosDraftMediaIdb";

export const SV_IDB_PREFIX = "__LX_SV_IDB__";

export function serviciosRefOfferImage(slot: number): string {
  return `${SV_IDB_PREFIX}|OFFER_IMG|${slot}`;
}
export function serviciosRefOfferPdf(slot: number): string {
  return `${SV_IDB_PREFIX}|OFFER_PDF|${slot}`;
}
function isDataUrl(s: string): boolean {
  return typeof s === "string" && s.startsWith("data:") && s.length > 80;
}

type OfferMediaRef =
  | { kind: "offerImg"; slot?: number }
  | { kind: "offerPdf"; slot?: number };

function parseOfferMediaRef(url: string): OfferMediaRef | null {
  if (!url.startsWith(SV_IDB_PREFIX)) return null;
  const rest = url.slice(SV_IDB_PREFIX.length);
  if (rest === "|OFFER_IMG") return { kind: "offerImg" };
  if (rest === "|OFFER_PDF") return { kind: "offerPdf" };
  const img = /^\|OFFER_IMG\|(\d+)$/.exec(rest);
  if (img?.[1]) return { kind: "offerImg", slot: Number(img[1]) };
  const pdf = /^\|OFFER_PDF\|(\d+)$/.exec(rest);
  if (pdf?.[1]) return { kind: "offerPdf", slot: Number(pdf[1]) };
  return null;
}

function parseServiciosRef(url: string):
  | { kind: "logo" }
  | { kind: "cover" }
  | { kind: "g"; id: string }
  | { kind: "v"; id: string }
  | null {
  if (!url.startsWith(SV_IDB_PREFIX)) return null;
  const rest = url.slice(SV_IDB_PREFIX.length);
  if (rest === "|LOGO") return { kind: "logo" };
  if (rest === "|COVER") return { kind: "cover" };
  const g = /^\|G\|(.+)$/.exec(rest);
  if (g?.[1]) return { kind: "g", id: g[1] };
  const v = /^\|V\|(.+)$/.exec(rest);
  if (v?.[1]) return { kind: "v", id: v[1] };
  return null;
}

function idbKeyForOfferSlot(slot: number | undefined): string | undefined {
  return slot === undefined ? undefined : String(slot);
}

/** Drop media rows that still hold unresolved IDB refs after failed rehydration. */
export function stripUnresolvedServiciosIdbRefs(state: ClasificadosServiciosApplicationState): ClasificadosServiciosApplicationState {
  const gallery = (state.gallery ?? []).filter((g) => !g.url.startsWith(SV_IDB_PREFIX));
  const videos = (state.videos ?? []).filter((v) => !v.url.startsWith(SV_IDB_PREFIX));
  const logoUrl = state.logoUrl.startsWith(SV_IDB_PREFIX) ? "" : state.logoUrl;
  const coverUrl = state.coverUrl.startsWith(SV_IDB_PREFIX) ? "" : state.coverUrl;
  const promotions = (state.promotions ?? []).map((row) => ({
    ...row,
    imageUrl: row.imageUrl.startsWith(SV_IDB_PREFIX) ? "" : row.imageUrl,
    pdfUrl: row.pdfUrl.startsWith(SV_IDB_PREFIX) ? "" : row.pdfUrl,
  }));
  const gIds = new Set(gallery.map((x) => x.id));
  const featuredGalleryIds = state.featuredGalleryIds.filter((id) => gIds.has(id));
  return normalizeClasificadosServiciosApplicationState({
    ...state,
    gallery,
    videos,
    featuredGalleryIds,
    logoUrl,
    coverUrl,
    promotions,
  });
}

export async function offloadServiciosHeavyMediaToIdb(
  namespace: string,
  state: ClasificadosServiciosApplicationState,
): Promise<ClasificadosServiciosApplicationState> {
  let logoUrl = state.logoUrl;
  if (isDataUrl(logoUrl)) {
    await idbServiciosPutDataUrl(namespace, "logo", undefined, logoUrl);
    logoUrl = `${SV_IDB_PREFIX}|LOGO`;
  }

  let coverUrl = state.coverUrl;
  if (isDataUrl(coverUrl)) {
    await idbServiciosPutDataUrl(namespace, "cover", undefined, coverUrl);
    coverUrl = `${SV_IDB_PREFIX}|COVER`;
  }

  const gallery: GalleryItem[] = [];
  for (const g of state.gallery ?? []) {
    if (g.source === "file" && isDataUrl(g.url)) {
      await idbServiciosPutDataUrl(namespace, "g", g.id, g.url);
      gallery.push({ ...g, url: `${SV_IDB_PREFIX}|G|${g.id}` });
    } else {
      gallery.push(g);
    }
  }

  const videos: VideoItem[] = [];
  for (const v of state.videos ?? []) {
    if (v.source === "file" && isDataUrl(v.url)) {
      await idbServiciosPutDataUrl(namespace, "v", v.id, v.url);
      videos.push({ ...v, url: `${SV_IDB_PREFIX}|V|${v.id}` });
    } else {
      videos.push(v);
    }
  }

  const promotions = [...(state.promotions ?? [])];
  for (let i = 0; i < promotions.length; i++) {
    const row = promotions[i]!;
    let imageUrl = row.imageUrl;
    if (isDataUrl(imageUrl)) {
      await idbServiciosPutDataUrl(namespace, "offerImg", String(i), imageUrl);
      imageUrl = serviciosRefOfferImage(i);
    }
    let pdfUrl = row.pdfUrl;
    if (isDataUrl(pdfUrl)) {
      await idbServiciosPutDataUrl(namespace, "offerPdf", String(i), pdfUrl);
      pdfUrl = serviciosRefOfferPdf(i);
    }
    promotions[i] = { ...row, imageUrl, pdfUrl };
  }

  return normalizeClasificadosServiciosApplicationState({
    ...state,
    logoUrl,
    coverUrl,
    gallery,
    videos,
    promotions,
  });
}

export async function inlineServiciosHeavyMediaFromIdb(
  namespace: string,
  state: ClasificadosServiciosApplicationState,
): Promise<ClasificadosServiciosApplicationState> {
  let logoUrl = state.logoUrl;
  if (parseServiciosRef(logoUrl)?.kind === "logo") {
    const blob = await idbServiciosGetDataUrl(namespace, "logo", undefined);
    logoUrl = blob ?? "";
  }

  let coverUrl = state.coverUrl;
  if (parseServiciosRef(coverUrl)?.kind === "cover") {
    const blob = await idbServiciosGetDataUrl(namespace, "cover", undefined);
    coverUrl = blob ?? "";
  }

  const gallery: GalleryItem[] = [];
  for (const g of state.gallery ?? []) {
    const pr = parseServiciosRef(g.url);
    if (pr?.kind === "g") {
      const blob = await idbServiciosGetDataUrl(namespace, "g", pr.id);
      if (blob) gallery.push({ ...g, url: blob, source: g.source });
    } else {
      gallery.push(g);
    }
  }

  const videos: VideoItem[] = [];
  for (const v of state.videos ?? []) {
    const pr = parseServiciosRef(v.url);
    if (pr?.kind === "v") {
      const blob = await idbServiciosGetDataUrl(namespace, "v", pr.id);
      if (blob) videos.push({ ...v, url: blob, source: v.source });
    } else {
      videos.push(v);
    }
  }

  const promotions = [...(state.promotions ?? [])];
  for (let i = 0; i < promotions.length; i++) {
    const row = promotions[i]!;
    let imageUrl = row.imageUrl;
    const imgRef = parseOfferMediaRef(imageUrl);
    if (imgRef?.kind === "offerImg") {
      const blob = await idbServiciosGetDataUrl(namespace, "offerImg", idbKeyForOfferSlot(imgRef.slot));
      imageUrl = blob ?? "";
    }
    let pdfUrl = row.pdfUrl;
    const pdfRef = parseOfferMediaRef(pdfUrl);
    if (pdfRef?.kind === "offerPdf") {
      const blob = await idbServiciosGetDataUrl(namespace, "offerPdf", idbKeyForOfferSlot(pdfRef.slot));
      pdfUrl = blob ?? "";
    }
    promotions[i] = { ...row, imageUrl, pdfUrl };
  }

  return normalizeClasificadosServiciosApplicationState({
    ...state,
    logoUrl,
    coverUrl,
    gallery,
    videos,
    promotions,
  });
}

export async function clearServiciosDraftMediaNamespace(namespace: string): Promise<void> {
  await idbServiciosClearNamespace(namespace);
}
