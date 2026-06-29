"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { buildServiciosGetQuoteIntent, trackServiciosListingCta } from "../lib/serviciosCtaIntents";
import { SV } from "./serviciosDesignTokens";
import { ServiciosGalleryVideoTile } from "./ServiciosGalleryVideoTile";
import { CtaActionSheet } from "@/app/components/cta/CtaActionSheet";
import type { CtaSheetIntent } from "@/app/components/cta/types";

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

export function ServiciosGalleryWithTabs({
  profile,
  lang,
  listingSlug,
  listingSourceId = null,
  listingShareUrl,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  listingSlug?: string;
  listingSourceId?: string | null;
  listingShareUrl?: string;
}) {
  const L = getServiciosProfileLabels(lang);
  const mains = profile.gallery;
  const more = profile.galleryMore;
  const videos = profile.galleryVideos;
  const allPhotos = [...mains, ...more];

  const hasPhotos = allPhotos.length > 0;
  const hasVideos = videos.length > 0;

  const [activeTab, setActiveTab] = useState<"photos" | "videos">(() =>
    !hasPhotos && hasVideos ? "videos" : "photos",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
  const [narrowViewport, setNarrowViewport] = useState(false);

  useEffect(() => {
    if (!hasPhotos && hasVideos && activeTab === "photos") setActiveTab("videos");
  }, [hasPhotos, hasVideos, activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setNarrowViewport(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const closeCta = useCallback(() => {
    setCtaOpen(false);
    setCtaIntent(null);
  }, []);

  const galleryQuoteMessage =
    lang === "en"
      ? "Hi, I saw your profile on Leonix and would like something like this."
      : "Hola, vi tu perfil en Leonix y quiero algo como esto.";

  const handleGalleryQuoteClick = () => {
    const intent = buildServiciosGetQuoteIntent(profile, lang, {
      listingSlug,
      listingShareUrl,
      quoteMessage: galleryQuoteMessage,
    });
    if (!intent) return;
    trackServiciosListingCta(listingSlug, "cta_quote_sms_click", {
      sourceId: listingSourceId,
      source: "gallery_tabs",
      href: "sheet",
    });
    setCtaIntent(intent);
    setCtaOpen(true);
  };

  const openModal = (index: number) => {
    setCurrentModalIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const photoCap = narrowViewport ? 4 : 6;
  const visibleImages = allPhotos.slice(0, photoCap);
  const hasMoreImages = allPhotos.length > photoCap;

  if (allPhotos.length === 0 && videos.length === 0) return null;

  return (
    <>
      <section
        className="rounded-2xl border p-3 shadow-sm sm:p-6 md:p-8"
        style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
      >
        <h2 className="text-lg font-bold tracking-tight text-[#2F2A23] md:text-xl">
          {L.gallery}
        </h2>

        <div className="mt-3 md:mt-4">
          {hasPhotos && hasVideos ? (
            <nav className="inline-flex rounded-xl border border-[#E8D7B8] bg-[#FCF9F2] p-1 shadow-sm" aria-label={L.gallery}>
              <button
                type="button"
                onClick={() => setActiveTab("photos")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "photos"
                    ? "bg-white text-[#6F7A3A] shadow-sm ring-1 ring-[#E8D7B8]"
                    : "text-[#6F6254] hover:text-[#2F2A23]"
                }`}
              >
                {lang === "en" ? "Photos" : "Fotos"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("videos")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "videos"
                    ? "bg-white text-[#6F7A3A] shadow-sm ring-1 ring-[#E8D7B8]"
                    : "text-[#6F6254] hover:text-[#2F2A23]"
                }`}
              >
                {lang === "en" ? "Videos" : "Videos"}
              </button>
            </nav>
          ) : null}
        </div>

        {/* Tab content */}
        <div className="mt-4 md:mt-6">
          {activeTab === "photos" && hasPhotos ? (
            <div>
              {visibleImages.length > 0 ? (
                <>
                  <div
                    className={
                      narrowViewport
                        ? "grid grid-cols-2 gap-2"
                        : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    }
                  >
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
                        onClick={() => openModal(photoCap)}
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
          ) : null}

          {activeTab === "videos" && videos.length > 0 && (
            <div
              className={
                videos.length === 1
                  ? "mx-auto grid max-w-3xl grid-cols-1 gap-3 md:gap-4"
                  : narrowViewport
                    ? "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]"
                    : "grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4"
              }
            >
              {videos.map((v) => (
                <div
                  key={v.id}
                  className={
                    videos.length > 1 && narrowViewport
                      ? "w-[min(100%,min(92vw,28rem))] shrink-0 snap-start md:w-auto md:shrink"
                      : "flex flex-col"
                  }
                >
                  {videos.length > 1 && v.isPrimary && (
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#3B66AD]/90">{L.videoTour}</p>
                  )}
                  <div className="flex-1">
                    <ServiciosGalleryVideoTile v={v} lang={lang} />
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
      <CtaActionSheet open={ctaOpen} onClose={closeCta} intent={ctaIntent} lang={lang} />
    </>
  );
}
