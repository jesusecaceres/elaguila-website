import type { ClasificadosServiciosApplicationState, GalleryItem, VideoItem } from "./clasificadosServiciosApplicationTypes";
import { normalizeClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationNormalize";
import {
  idbServiciosClearNamespace,
  idbServiciosGetDataUrl,
  idbServiciosPutDataUrl,
} from "./clasificadosServiciosDraftMediaIdb";

export const SV_IDB_PREFIX = "__LX_SV_IDB__";

export function serviciosRefLogo(): string {
  return `${SV_IDB_PREFIX}|LOGO`;
}
export function serviciosRefCover(): string {
  return `${SV_IDB_PREFIX}|COVER`;
}
export function serviciosRefGallery(id: string): string {
  return `${SV_IDB_PREFIX}|G|${id}`;
}
export function serviciosRefVideo(id: string): string {
  return `${SV_IDB_PREFIX}|V|${id}`;
}
export function serviciosRefOfferImage(): string {
  return `${SV_IDB_PREFIX}|OFFER_IMG`;
}
export function serviciosRefOfferPdf(): string {
  return `${SV_IDB_PREFIX}|OFFER_PDF`;
}

function isDataUrl(s: string): boolean {
  return typeof s === "string" && s.startsWith("data:") && s.length > 80;
}

function parseServiciosRef(url: string):
  | { kind: "logo" }
  | { kind: "cover" }
  | { kind: "g"; id: string }
  | { kind: "v"; id: string }
  | { kind: "offerImg" }
  | { kind: "offerPdf" }
  | null {
  if (!url.startsWith(SV_IDB_PREFIX)) return null;
  const rest = url.slice(SV_IDB_PREFIX.length);
  if (rest === "|LOGO") return { kind: "logo" };
  if (rest === "|COVER") return { kind: "cover" };
  if (rest === "|OFFER_IMG") return { kind: "offerImg" };
  if (rest === "|OFFER_PDF") return { kind: "offerPdf" };
  const g = /^\|G\|(.+)$/.exec(rest);
  if (g?.[1]) return { kind: "g", id: g[1] };
  const v = /^\|V\|(.+)$/.exec(rest);
  if (v?.[1]) return { kind: "v", id: v[1] };
  return null;
}

/** Drop media rows that still hold unresolved IDB refs after failed rehydration. */
export function stripUnresolvedServiciosIdbRefs(state: ClasificadosServiciosApplicationState): ClasificadosServiciosApplicationState {
  const gallery = (state.gallery ?? []).filter((g) => !g.url.startsWith(SV_IDB_PREFIX));
  const videos = (state.videos ?? []).filter((v) => !v.url.startsWith(SV_IDB_PREFIX));
  const logoUrl = state.logoUrl.startsWith(SV_IDB_PREFIX) ? "" : state.logoUrl;
  const coverUrl = state.coverUrl.startsWith(SV_IDB_PREFIX) ? "" : state.coverUrl;
  const offerImageUrl = state.offerImageUrl.startsWith(SV_IDB_PREFIX) ? "" : state.offerImageUrl;
  const offerPdfUrl = state.offerPdfUrl.startsWith(SV_IDB_PREFIX) ? "" : state.offerPdfUrl;
  const gIds = new Set(gallery.map((x) => x.id));
  const featuredGalleryIds = state.featuredGalleryIds.filter((id) => gIds.has(id));
  return normalizeClasificadosServiciosApplicationState({
    ...state,
    gallery,
    videos,
    featuredGalleryIds,
    logoUrl,
    coverUrl,
    offerImageUrl,
    offerPdfUrl,
  });
}

export async function offloadServiciosHeavyMediaToIdb(
  namespace: string,
  state: ClasificadosServiciosApplicationState,
): Promise<ClasificadosServiciosApplicationState> {
  let logoUrl = state.logoUrl;
  if (isDataUrl(logoUrl)) {
    await idbServiciosPutDataUrl(namespace, "logo", undefined, logoUrl);
    logoUrl = serviciosRefLogo();
  }

  let coverUrl = state.coverUrl;
  if (isDataUrl(coverUrl)) {
    await idbServiciosPutDataUrl(namespace, "cover", undefined, coverUrl);
    coverUrl = serviciosRefCover();
  }

  const gallery: GalleryItem[] = [];
  for (const g of state.gallery ?? []) {
    if (g.source === "file" && isDataUrl(g.url)) {
      await idbServiciosPutDataUrl(namespace, "g", g.id, g.url);
      gallery.push({ ...g, url: serviciosRefGallery(g.id) });
    } else {
      gallery.push(g);
    }
  }

  const videos: VideoItem[] = [];
  for (const v of state.videos ?? []) {
    if (v.source === "file" && isDataUrl(v.url)) {
      await idbServiciosPutDataUrl(namespace, "v", v.id, v.url);
      videos.push({ ...v, url: serviciosRefVideo(v.id) });
    } else {
      videos.push(v);
    }
  }

  let offerImageUrl = state.offerImageUrl;
  if (isDataUrl(offerImageUrl)) {
    await idbServiciosPutDataUrl(namespace, "offerImg", undefined, offerImageUrl);
    offerImageUrl = serviciosRefOfferImage();
  }

  let offerPdfUrl = state.offerPdfUrl;
  if (isDataUrl(offerPdfUrl)) {
    await idbServiciosPutDataUrl(namespace, "offerPdf", undefined, offerPdfUrl);
    offerPdfUrl = serviciosRefOfferPdf();
  }

  return normalizeClasificadosServiciosApplicationState({
    ...state,
    logoUrl,
    coverUrl,
    gallery,
    videos,
    offerImageUrl,
    offerPdfUrl,
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

  let offerImageUrl = state.offerImageUrl;
  if (parseServiciosRef(offerImageUrl)?.kind === "offerImg") {
    const blob = await idbServiciosGetDataUrl(namespace, "offerImg", undefined);
    offerImageUrl = blob ?? "";
  }

  let offerPdfUrl = state.offerPdfUrl;
  if (parseServiciosRef(offerPdfUrl)?.kind === "offerPdf") {
    const blob = await idbServiciosGetDataUrl(namespace, "offerPdf", undefined);
    offerPdfUrl = blob ?? "";
  }

  return normalizeClasificadosServiciosApplicationState({
    ...state,
    logoUrl,
    coverUrl,
    gallery,
    videos,
    offerImageUrl,
    offerPdfUrl,
  });
}

export async function clearServiciosDraftMediaNamespace(namespace: string): Promise<void> {
  await idbServiciosClearNamespace(namespace);
}
