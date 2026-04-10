import type { BienesRaicesPreviewMediaVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

export type LeonixGalleryPhotoSlide = {
  kind: "photo";
  /** Original draft index (first occurrence) for caption alignment */
  sourceIndex: number;
  url: string;
  caption: string;
};

export type LeonixGalleryVideoSlide = { kind: "video"; slot: 0 | 1 };

export type LeonixGallerySlide = LeonixGalleryPhotoSlide | LeonixGalleryVideoSlide;

export function leonixGalleryPhotoSlidesWithCaptions(
  urls: string[] | undefined,
  captionsFull: string[] | undefined,
): LeonixGalleryPhotoSlide[] {
  const list = urls ?? [];
  const caps = captionsFull ?? [];
  const seen = new Set<string>();
  const out: LeonixGalleryPhotoSlide[] = [];
  list.forEach((raw, index) => {
    const url = String(raw ?? "").trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push({ kind: "photo", sourceIndex: index, url, caption: caps[index] ?? "" });
  });
  return out;
}

export function appendLeonixVideoSlides(
  slides: LeonixGallerySlide[],
  m: BienesRaicesPreviewMediaVm | undefined,
): void {
  if (m?.hasVideo1) slides.push({ kind: "video", slot: 0 });
  if (m?.hasVideo2) slides.push({ kind: "video", slot: 1 });
}

export function buildLeonixGallerySlidesFromMediaVm(m: BienesRaicesPreviewMediaVm | undefined): LeonixGallerySlide[] {
  const photos = leonixGalleryPhotoSlidesWithCaptions(m?.allPhotoUrls, m?.photoCaptionsFull);
  const out: LeonixGallerySlide[] = [...photos];
  appendLeonixVideoSlides(out, m);
  return out;
}

/** Slide index for lightbox when opening the cover / hero (same URL as draft cover index). */
export function leonixSlideIndexForCoverPhoto(urls: string[] | undefined, coverPhotoIndex: number, captions?: string[]): number {
  const list = urls ?? [];
  const idx = Math.min(Math.max(0, coverPhotoIndex), Math.max(0, list.length - 1));
  const target = String(list[idx] ?? "").trim();
  if (!target) return 0;
  const slides = leonixGalleryPhotoSlidesWithCaptions(list, captions);
  const i = slides.findIndex((s) => s.url === target);
  return i >= 0 ? i : 0;
}

export function leonixSlideIndexForPhotoUrl(urls: string[] | undefined, captions: string[] | undefined, photoUrl: string): number {
  const target = String(photoUrl ?? "").trim();
  if (!target) return 0;
  const slides = leonixGalleryPhotoSlidesWithCaptions(urls, captions);
  const i = slides.findIndex((s) => s.url === target);
  return i >= 0 ? i : 0;
}

/** 0-based slide index for video slot in the combined photo+video strip. */
export function leonixSlideIndexForVideoSlot(
  m: BienesRaicesPreviewMediaVm | undefined,
  slot: 0 | 1,
): number {
  const photos = leonixGalleryPhotoSlidesWithCaptions(m?.allPhotoUrls, m?.photoCaptionsFull);
  const base = photos.length;
  if (slot === 0) return base;
  return base + (m?.hasVideo1 ? 1 : 0);
}
