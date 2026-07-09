"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { ServiciosGalleryImage, ServiciosGalleryVideo, ServiciosLang } from "../types/serviciosBusinessProfile";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { ServiciosGalleryVideoTile } from "./ServiciosGalleryVideoTile";

export function ServiciosMediaLightbox({
  photos,
  videos,
  lang,
  isOpen,
  onClose,
  initialTab = "photos",
  initialPhotoIndex = 0,
  initialVideoIndex = 0,
}: {
  photos: ServiciosGalleryImage[];
  videos: ServiciosGalleryVideo[];
  lang: ServiciosLang;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "photos" | "videos";
  initialPhotoIndex?: number;
  initialVideoIndex?: number;
}) {
  const hasPhotos = photos.length > 0;
  const hasVideos = videos.length > 0;
  const showTabs = hasPhotos && hasVideos;

  const [activeTab, setActiveTab] = useState<"photos" | "videos">(() =>
    !hasPhotos && hasVideos ? "videos" : initialTab,
  );
  const [photoIndex, setPhotoIndex] = useState(initialPhotoIndex);
  const [videoIndex, setVideoIndex] = useState(initialVideoIndex);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(!hasPhotos && hasVideos ? "videos" : initialTab);
    setPhotoIndex(initialPhotoIndex);
    setVideoIndex(initialVideoIndex);
  }, [isOpen, initialTab, initialPhotoIndex, initialVideoIndex, hasPhotos, hasVideos]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const goPhotoPrevious = useCallback(() => {
    setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const goPhotoNext = useCallback(() => {
    setPhotoIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const goVideoPrevious = useCallback(() => {
    setVideoIndex((i) => (i - 1 + videos.length) % videos.length);
  }, [videos.length]);

  const goVideoNext = useCallback(() => {
    setVideoIndex((i) => (i + 1) % videos.length);
  }, [videos.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (activeTab === "photos" && hasPhotos) {
        if (e.key === "ArrowLeft") goPhotoPrevious();
        if (e.key === "ArrowRight") goPhotoNext();
      }
      if (activeTab === "videos" && hasVideos) {
        if (e.key === "ArrowLeft") goVideoPrevious();
        if (e.key === "ArrowRight") goVideoNext();
      }
    },
    [
      activeTab,
      goPhotoNext,
      goPhotoPrevious,
      goVideoNext,
      goVideoPrevious,
      hasPhotos,
      hasVideos,
      onClose,
    ],
  );

  if (!isOpen) return null;

  const currentPhoto = photos[photoIndex];
  const currentVideo = videos[videoIndex];
  const photosLabel = lang === "en" ? "Photos" : "Fotos";
  const videosLabel = lang === "en" ? "Videos" : "Videos";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={lang === "en" ? "Gallery viewer" : "Visor de galería"}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#17130f] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          {showTabs ? (
            <nav
              className="inline-flex rounded-xl border border-white/15 bg-black/40 p-1"
              aria-label={lang === "en" ? "Media type" : "Tipo de medio"}
            >
              <button
                type="button"
                onClick={() => setActiveTab("photos")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "photos"
                    ? "bg-white/95 text-[#1F1A17] shadow-sm"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {photosLabel}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("videos")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "videos"
                    ? "bg-white/95 text-[#1F1A17] shadow-sm"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {videosLabel}
              </button>
            </nav>
          ) : (
            <p className="text-sm font-semibold text-white/90">
              {activeTab === "videos" ? videosLabel : photosLabel}
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-black/65 px-3 text-sm font-semibold text-white shadow-lg ring-1 ring-white/25 transition hover:bg-black/80"
            aria-label={lang === "en" ? "Close" : "Cerrar"}
          >
            <span className="text-lg leading-none" aria-hidden>
              ×
            </span>
            <span>{lang === "en" ? "Close" : "Cerrar"}</span>
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
          {activeTab === "photos" && hasPhotos ? (
            <>
              {photos.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={goPhotoPrevious}
                    className="absolute left-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white shadow-lg ring-1 ring-white/25 transition hover:bg-black/80 sm:left-4 sm:h-12 sm:w-12"
                    aria-label={lang === "en" ? "Previous photo" : "Foto anterior"}
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={goPhotoNext}
                    className="absolute right-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white shadow-lg ring-1 ring-white/25 transition hover:bg-black/80 sm:right-4 sm:h-12 sm:w-12"
                    aria-label={lang === "en" ? "Next photo" : "Siguiente foto"}
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              ) : null}
              {currentPhoto ? (
                <div className="relative max-h-[72vh] max-w-full">
                  <Image
                    src={currentPhoto.url}
                    alt={currentPhoto.alt}
                    width={1200}
                    height={900}
                    className="max-h-[72vh] max-w-full rounded-lg object-contain"
                    unoptimized={serviciosImageUnoptimized(currentPhoto.url)}
                  />
                </div>
              ) : null}
              {photos.length > 1 ? (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
                  {photoIndex + 1} / {photos.length}
                </div>
              ) : null}
            </>
          ) : null}

          {activeTab === "videos" && hasVideos ? (
            <>
              {videos.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={goVideoPrevious}
                    className="absolute left-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white shadow-lg ring-1 ring-white/25 transition hover:bg-black/80 sm:left-4 sm:h-12 sm:w-12"
                    aria-label={lang === "en" ? "Previous video" : "Video anterior"}
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={goVideoNext}
                    className="absolute right-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white shadow-lg ring-1 ring-white/25 transition hover:bg-black/80 sm:right-4 sm:h-12 sm:w-12"
                    aria-label={lang === "en" ? "Next video" : "Siguiente video"}
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              ) : null}
              {currentVideo ? (
                <div className="w-full max-w-3xl px-2">
                  <ServiciosGalleryVideoTile v={currentVideo} lang={lang} />
                </div>
              ) : null}
              {videos.length > 1 ? (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
                  {videoIndex + 1} / {videos.length}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
