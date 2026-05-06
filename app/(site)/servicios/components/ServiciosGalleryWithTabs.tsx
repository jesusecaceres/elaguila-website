"use client";

import { useState } from "react";
import Image from "next/image";
import type { ServiciosGalleryVideo, ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { parseYouTubeVideoId, youTubeEmbedSrc } from "../lib/serviciosVideoEmbed";
import { resolveServiciosQuoteDestination } from "../lib/serviciosContactActions";
import { SV } from "./serviciosDesignTokens";

function VideoTile({ v, lang }: { v: ServiciosGalleryVideo; lang: ServiciosLang }) {
  const yt = parseYouTubeVideoId(v.url);
  if (yt) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/[0.06] bg-black shadow-sm">
        <iframe
          title={lang === "en" ? "Video" : "Video"}
          src={youTubeEmbedSrc(yt)}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/[0.06] bg-black/[0.04] shadow-sm">
      <video src={v.url} className="h-full w-full object-cover" controls playsInline preload="metadata" />
    </div>
  );
}

function GalleryImage({ g, onQuoteClick }: { 
  g: { id: string; url: string; alt: string }; 
  onQuoteClick?: () => void 
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-black/[0.06] bg-black/[0.03] shadow-sm">
      <Image
        src={g.url}
        alt={g.alt}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
        unoptimized={serviciosImageUnoptimized(g.url)}
      />
      {onQuoteClick ? (
        <div className="absolute inset-0 bg-black/0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={onQuoteClick}
              className="rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold text-[#3B66AD] shadow-lg transition hover:bg-white"
            >
              {g.alt}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GalleryModal({ 
  images, 
  videos, 
  isOpen, 
  onClose, 
  currentIndex, 
  setCurrentIndex,
  lang 
}: {
  images: Array<{ id: string; url: string; alt: string }>;
  videos: ServiciosGalleryVideo[];
  isOpen: boolean;
  onClose: () => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  lang: ServiciosLang;
}) {
  if (!isOpen) return null;

  const allMedia = [...images.map(img => ({ ...img, type: 'image' as const })), ...videos.map(video => ({ ...video, type: 'video' as const }))];
  const currentMedia = allMedia[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((currentIndex - 1 + allMedia.length) % allMedia.length);
  };

  const goToNext = () => {
    setCurrentIndex((currentIndex + 1) % allMedia.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] w-full bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-lg transition hover:bg-white hover:text-gray-900"
          aria-label={lang === "en" ? "Close" : "Cerrar"}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Navigation arrows */}
        {allMedia.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-lg transition hover:bg-white hover:text-gray-900"
              aria-label={lang === "en" ? "Previous" : "Anterior"}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-lg transition hover:bg-white hover:text-gray-900"
              aria-label={lang === "en" ? "Next" : "Siguiente"}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
              </svg>
            </button>
          </>
        )}

        {/* Media content */}
        <div className="flex h-full min-h-[400px] items-center justify-center p-8">
          {currentMedia?.type === 'image' ? (
            <div className="relative max-w-full max-h-[70vh]">
              <Image
                src={currentMedia.url}
                alt={currentMedia.alt}
                width={800}
                height={600}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                unoptimized={serviciosImageUnoptimized(currentMedia.url)}
              />
            </div>
          ) : currentMedia?.type === 'video' ? (
            <div className="relative w-full max-w-4xl aspect-video">
              <VideoTile v={currentMedia} lang={lang} />
            </div>
          ) : null}
        </div>

        {/* Media counter */}
        {allMedia.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
            {currentIndex + 1} / {allMedia.length}
          </div>
        )}
      </div>
    </div>
  );
}

export function ServiciosGalleryWithTabs({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const mains = profile.gallery;
  const more = profile.galleryMore;
  const videos = profile.galleryVideos;

  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);

  const quoteDestination = resolveServiciosQuoteDestination(profile, lang);

  const handleGalleryQuoteClick = () => {
    if (!quoteDestination) return;

    const message = lang === "en"
      ? "Hi, I saw your profile on Leonix and would like something like this."
      : "Hola, vi tu perfil en Leonix y quiero algo como esto.";

    if (quoteDestination.kind === "whatsapp") {
      const encodedMessage = encodeURIComponent(message);
      window.open(`${quoteDestination.href}?text=${encodedMessage}`, "_blank", "noopener noreferrer");
    } else {
      window.open(quoteDestination.href, "_blank", "noopener noreferrer");
    }
  };

  const openModal = (index: number) => {
    setCurrentModalIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Show first 6 images in main gallery
  const visibleImages = mains.slice(0, 6);
  const hasMoreImages = mains.length > 6 || more.length > 0;

  if (mains.length === 0 && more.length === 0 && videos.length === 0) return null;

  return (
    <>
      <section
        className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
        style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
      >
        <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">
          {L.gallery}
        </h2>

        {/* Tabs */}
        <div className="mt-4 border-b border-black/[0.06]">
          <nav className="-mb-px flex space-x-8" aria-label={L.gallery}>
            <button
              onClick={() => setActiveTab('photos')}
              className={`py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'photos'
                  ? 'border-[#3B66AD] text-[#3B66AD]'
                  : 'border-transparent text-[color:var(--lx-muted)] hover:text-[color:var(--lx-text)]'
              }`}
            >
              {lang === "en" ? "Photos" : "Fotos"}
            </button>
            {videos.length > 0 && (
              <button
                onClick={() => setActiveTab('videos')}
                className={`py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'videos'
                    ? 'border-[#3B66AD] text-[#3B66AD]'
                    : 'border-transparent text-[color:var(--lx-muted)] hover:text-[color:var(--lx-text)]'
                }`}
              >
                {lang === "en" ? "Videos" : "Videos"}
              </button>
            )}
          </nav>
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === 'photos' && (
            <div>
              {visibleImages.length > 0 ? (
                <>
                  {/* 3x2 grid for desktop */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleImages.map((g, index) => (
                      <GalleryImage 
                        key={g.id} 
                        g={g} 
                        onQuoteClick={handleGalleryQuoteClick} 
                      />
                    ))}
                  </div>

                  {/* View more photos */}
                  {hasMoreImages && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => openModal(6)} // Start modal from 7th image
                        className="inline-flex items-center gap-2 rounded-xl border border-[#3B66AD]/20 bg-[#3B66AD]/[0.06] px-4 py-2.5 text-sm font-medium text-[#3B66AD] transition hover:border-[#3B66AD]/40 hover:bg-[#3B66AD]/[0.1]"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0l16-16a2 2 0 01-2.828 0L4 16z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01" />
                        </svg>
                        {lang === "en" ? "View more photos" : "Ver más fotos"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-[color:var(--lx-muted)]">
                  {lang === "en" ? "No photos available" : "No hay fotos disponibles"}
                </p>
              )}
            </div>
          )}

          {activeTab === 'videos' && videos.length > 0 && (
            <div className={`${
              videos.length === 1
                ? "grid grid-cols-1 gap-3 md:gap-4 max-w-3xl mx-auto"
                : videos.length >= 2
                  ? "grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4"
                  : ""
            }`}>
              {videos.map((v) => (
                <div key={v.id}>
                  {videos.length > 1 && v.isPrimary && (
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#3B66AD]/90">{L.videoTour}</p>
                  )}
                  <VideoTile v={v} lang={lang} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      <GalleryModal
        images={[...mains, ...more]}
        videos={videos}
        isOpen={isModalOpen}
        onClose={closeModal}
        currentIndex={currentModalIndex}
        setCurrentIndex={setCurrentModalIndex}
        lang={lang}
      />
    </>
  );
}
