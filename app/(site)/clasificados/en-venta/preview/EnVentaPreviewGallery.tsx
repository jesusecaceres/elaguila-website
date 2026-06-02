"use client";

import { useEffect, useMemo, useState } from "react";
import { EnVentaVideoPlayer } from "@/app/clasificados/en-venta/shared/components/EnVentaVideoPlayer";
import {
  EnVentaMediaTabToggle,
  resolveEnVentaDefaultMediaTab,
  type EnVentaMediaTab,
} from "@/app/clasificados/en-venta/shared/components/EnVentaMediaTabToggle";
import { isEmbeddableExternalVideoUrl } from "@/app/clasificados/en-venta/shared/utils/enVentaVideoEmbed";
import { EN_VENTA_SURFACE } from "@/app/clasificados/en-venta/shared/styles/enVentaBrand";

type PhotoSlide = { type: "image"; src: string; i: number };

type Props = {
  orderedImages: string[];
  videoUrl: string | null;
  showVideo: boolean;
  photoCountLabel: string;
  lang: "es" | "en";
  plan: "free" | "pro";
};

export function EnVentaPreviewGallery({ orderedImages, videoUrl, showVideo, photoCountLabel, lang, plan }: Props) {
  const photoSlides: PhotoSlide[] = useMemo(
    () => orderedImages.map((src, i) => ({ type: "image" as const, src, i })),
    [orderedImages]
  );

  const embedVideoUrl = useMemo(() => {
    const v = videoUrl?.trim();
    return showVideo && v && isEmbeddableExternalVideoUrl(v) ? v : null;
  }, [showVideo, videoUrl]);

  const hasPhotos = photoSlides.length > 0;
  const hasVideos = Boolean(embedVideoUrl);
  const showToggle = hasPhotos && hasVideos;

  const [activeTab, setActiveTab] = useState<EnVentaMediaTab>(() =>
    resolveEnVentaDefaultMediaTab(hasPhotos, hasVideos)
  );
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  useEffect(() => {
    setActiveTab(resolveEnVentaDefaultMediaTab(hasPhotos, hasVideos));
    setActivePhotoIdx(0);
  }, [hasPhotos, hasVideos, photoSlides.length, embedVideoUrl]);

  const currentPhoto = photoSlides[Math.min(activePhotoIdx, Math.max(0, photoSlides.length - 1))] ?? null;

  const videoLabel = lang === "es" ? "Video" : "Video";
  const openLabel = lang === "es" ? "Abrir medios" : "Open media";
  const closeLabel = lang === "es" ? "Cerrar" : "Close";
  const prevLabel = lang === "es" ? "Anterior" : "Previous";
  const nextLabel = lang === "es" ? "Siguiente" : "Next";

  if (!hasPhotos && !hasVideos) {
    return (
      <div className={EN_VENTA_SURFACE.galleryFrame}>
        <div className="flex aspect-[4/3] items-center justify-center px-4 text-center text-sm text-[#5C5346]/75">
          {lang === "es" ? "Sin fotos en el borrador" : "No photos in draft"}
        </div>
      </div>
    );
  }

  const openPhotoLightbox = (idx: number) => {
    setLightboxIdx(idx);
    setOpen(true);
  };

  const openVideoLightbox = () => {
    setLightboxIdx(0);
    setOpen(true);
  };

  return (
    <div className="space-y-3">
      {showToggle ? (
        <EnVentaMediaTabToggle lang={lang} activeTab={activeTab} onTabChange={setActiveTab} />
      ) : null}

      {activeTab === "photos" && hasPhotos ? (
        <>
          <div className={`relative ${EN_VENTA_SURFACE.galleryFrame}`}>
            <button
              type="button"
              onClick={() => openPhotoLightbox(activePhotoIdx)}
              className="group relative block w-full text-left"
              aria-label={openLabel}
            >
              <div className="relative aspect-[4/3] w-full bg-gradient-to-b from-[#FAF7F2] to-[#EDE6DC]">
                {currentPhoto ? (
                  <img src={currentPhoto.src} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <span className="pointer-events-none absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </div>

          <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]/90">
            {photoCountLabel}
          </p>

          {photoSlides.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photoSlides.map((s, idx) => (
                <button
                  key={`photo-${s.i}-${idx}`}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-2xl border bg-[#FFFCF7] shadow-sm transition ${
                    activePhotoIdx === idx
                      ? "border-[#C9A84A] ring-2 ring-[#D4BC6A]/50 ring-offset-2 ring-offset-[#F3EBDD]"
                      : "border-[#E8DFD0]/90 hover:border-[#D4C4A8]"
                  }`}
                >
                  <img src={s.src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : activeTab === "videos" && embedVideoUrl ? (
        <div className={`relative ${EN_VENTA_SURFACE.galleryFrame}`}>
          <div className="relative aspect-[4/3] w-full bg-black">
            <EnVentaVideoPlayer url={embedVideoUrl} lang={lang} />
            <button
              type="button"
              onClick={openVideoLightbox}
              className="absolute bottom-3 right-3 rounded-xl border border-white/20 bg-black/50 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm transition hover:bg-black/65"
            >
              {openLabel}
            </button>
          </div>
        </div>
      ) : null}

      {open && activeTab === "photos" && hasPhotos ? (
        <PhotoLightbox
          lang={lang}
          slides={photoSlides}
          active={lightboxIdx}
          onClose={() => setOpen(false)}
          onPrev={() => setLightboxIdx((i) => (i <= 0 ? photoSlides.length - 1 : i - 1))}
          onNext={() => setLightboxIdx((i) => (i >= photoSlides.length - 1 ? 0 : i + 1))}
          closeLabel={closeLabel}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
        />
      ) : null}

      {open && activeTab === "videos" && embedVideoUrl ? (
        <VideoLightbox
          lang={lang}
          videoUrl={embedVideoUrl}
          onClose={() => setOpen(false)}
          closeLabel={closeLabel}
          videoLabel={videoLabel}
        />
      ) : null}
    </div>
  );
}

function VideoLightbox({
  lang,
  videoUrl,
  onClose,
  closeLabel,
  videoLabel,
}: {
  lang: "es" | "en";
  videoUrl: string;
  onClose: () => void;
  closeLabel: string;
  videoLabel: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f0d09] shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
          <div className="text-xs font-semibold text-white/75">{videoLabel}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/15"
            aria-label={closeLabel}
          >
            {closeLabel}
          </button>
        </div>
        <div className="relative aspect-[16/10] w-full bg-black">
          <EnVentaVideoPlayer url={videoUrl} lang={lang} />
        </div>
      </div>
    </div>
  );
}

function PhotoLightbox({
  lang,
  slides,
  active,
  onClose,
  onPrev,
  onNext,
  closeLabel,
  prevLabel,
  nextLabel,
}: {
  lang: "es" | "en";
  slides: PhotoSlide[];
  active: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const current = slides[Math.min(active, Math.max(0, slides.length - 1))] ?? null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f0d09] shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
          <div className="text-xs font-semibold text-white/75">
            {lang === "es" ? "Vista de fotos" : "Photo viewer"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/15"
            aria-label={closeLabel}
          >
            {closeLabel}
          </button>
        </div>

        <div className="relative aspect-[16/10] w-full bg-black">
          {current ? <img src={current.src} alt="" className="h-full w-full object-contain" /> : null}

          {slides.length > 1 ? (
            <>
              <button
                type="button"
                onClick={onPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15"
                aria-label={prevLabel}
              >
                ←
              </button>
              <button
                type="button"
                onClick={onNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15"
                aria-label={nextLabel}
              >
                →
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}