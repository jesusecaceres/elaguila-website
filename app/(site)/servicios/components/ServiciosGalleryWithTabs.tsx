"use client";

import { useState } from "react";
import Image from "next/image";
import type { ServiciosGalleryVideo, ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { parseYouTubeVideoId, youTubeEmbedSrc } from "../lib/serviciosVideoEmbed";
import { resolveServiciosQuoteDestination, appendWhatsAppPrefill } from "../lib/serviciosContactActions";
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

function GalleryImage({ g, onQuoteClick, onOpen }: { 
  g: { id: string; url: string; alt: string }; 
  onQuoteClick?: () => void;
  onOpen?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-square w-full overflow-hidden rounded-xl border border-black/[0.06] bg-black/[0.03] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B66AD]/60"
      aria-label={g.alt}
    >
      <Image
        src={g.url}
        alt={g.alt}
        fill
        className="object-cover transition duration-200 group-hover:scale-[1.02]"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
        unoptimized={serviciosImageUnoptimized(g.url)}
      />
      {onQuoteClick ? (
        <div className="pointer-events-none absolute inset-0 bg-black/0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold text-[#3B66AD] shadow-lg">
              {g.alt}
            </span>
          </div>
        </div>
      ) : null}
    </button>
  );
}

function GalleryModal({ 
  images, 
  isOpen, 
  onClose, 
  currentIndex, 
  setCurrentIndex,
  lang 
}: {
  images: Array<{ id: string; url: string; alt: string }>;
  isOpen: boolean;
  onClose: () => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  lang: ServiciosLang;
}) {
  if (!isOpen) return null;

  const currentMedia = images[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((currentIndex - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((currentIndex + 1) % images.length);
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
        className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-[#17130f] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-black/65 px-3 text-sm font-semibold text-white shadow-lg ring-1 ring-white/25 transition hover:bg-black/80 sm:right-4 sm:top-4"
          aria-label={lang === "en" ? "Close" : "Cerrar"}
        >
          <span className="text-lg leading-none" aria-hidden>
            ×
          </span>
          <span>{lang === "en" ? "Close" : "Cerrar"}</span>
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white shadow-lg ring-1 ring-white/25 transition hover:bg-black/80 sm:left-4 sm:h-12 sm:w-12"
              aria-label={lang === "en" ? "Previous photo" : "Foto anterior"}
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white shadow-lg ring-1 ring-white/25 transition hover:bg-black/80 sm:right-4 sm:h-12 sm:w-12"
              aria-label={lang === "en" ? "Next photo" : "Siguiente foto"}
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        <div className="flex min-h-[56vh] items-center justify-center p-4 sm:min-h-[62vh] sm:p-8">
          {currentMedia ? (
            <div className="relative max-h-[78vh] max-w-full">
              <Image
                src={currentMedia.url}
                alt={currentMedia.alt}
                width={1200}
                height={900}
                className="max-h-[78vh] max-w-full rounded-lg object-contain"
                unoptimized={serviciosImageUnoptimized(currentMedia.url)}
              />
            </div>
          ) : null}
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
            {currentIndex + 1} / {images.length}
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
  const allPhotos = [...mains, ...more];

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
      const href = appendWhatsAppPrefill(quoteDestination.href, message);
      window.open(href, "_blank", "noopener noreferrer");
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

  const visibleImages = allPhotos.slice(0, 6);
  const hasMoreImages = allPhotos.length > 6;

  if (allPhotos.length === 0 && videos.length === 0) return null;

  return (
    <>
      <section
        className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
        style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
      >
        <h2 className="text-lg font-bold tracking-tight text-[#2F2A23] md:text-xl">
          {L.gallery}
        </h2>

        <div className="mt-4">
          <nav className="inline-flex rounded-xl border border-[#E8D7B8] bg-[#FCF9F2] p-1 shadow-sm" aria-label={L.gallery}>
            <button
              onClick={() => setActiveTab('photos')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'photos'
                  ? 'bg-white text-[#6F7A3A] shadow-sm ring-1 ring-[#E8D7B8]'
                  : 'text-[#6F6254] hover:text-[#2F2A23]'
              }`}
            >
              {lang === "en" ? "Photos" : "Fotos"}
            </button>
            {videos.length > 0 && (
              <button
                onClick={() => setActiveTab('videos')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === 'videos'
                    ? 'bg-white text-[#6F7A3A] shadow-sm ring-1 ring-[#E8D7B8]'
                    : 'text-[#6F6254] hover:text-[#2F2A23]'
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleImages.map((g, index) => (
                      <GalleryImage 
                        key={g.id} 
                        g={g} 
                        onQuoteClick={handleGalleryQuoteClick} 
                        onOpen={() => openModal(index)}
                      />
                    ))}
                  </div>

                  {/* View more photos */}
                  {hasMoreImages && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => openModal(6)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#E8D7B8] bg-[#FCF9F2] px-4 py-2.5 text-sm font-medium text-[#2F2A23] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/[0.08]"
                      >
                        <svg className="h-4 w-4 text-[#6F7A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0011.414 5H19a2 2 0 012 2v1m0 4v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7m18 0H3m18 0l-2.5-3a1 1 0 00-.8-.4H6.3a1 1 0 00-.8.4L3 12" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13a2 2 0 012-2h3a2 2 0 012 2 3v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6h3a2 2 0 012-2 3v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6h3a2 2 0 012-2 3v6A2 2 0 01-2 2H6a2 2 0 01-2-2V13z" />
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
                <div key={v.id} className="flex flex-col">
                  {videos.length > 1 && v.isPrimary && (
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#3B66AD]/90">{L.videoTour}</p>
                  )}
                  <div className="flex-1">
                    <VideoTile v={v} lang={lang} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      <GalleryModal
        images={allPhotos}
        isOpen={isModalOpen}
        onClose={closeModal}
        currentIndex={currentModalIndex}
        setCurrentIndex={setCurrentModalIndex}
        lang={lang}
      />
    </>
  );
}
