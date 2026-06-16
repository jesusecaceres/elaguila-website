"use client";

import { useState } from "react";
import Image from "next/image";
import { FiX, FiChevronLeft, FiChevronRight, FiExternalLink } from "react-icons/fi";
import type { ShellVenueGalleryBundle } from "./restaurantDetailShellTypes";
import { ShellVideoSlide } from "./RestauranteShellGalleryPrimitives";
import { RestauranteVideoPreviewCard } from "./RestauranteVideoPreviewCard";

interface RestauranteLockedGallerySectionProps {
  galleryBundle?: ShellVenueGalleryBundle;
  lang?: "es" | "en";
}

export function RestauranteLockedGallerySection({
  galleryBundle,
  lang = "es",
}: RestauranteLockedGallerySectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"comida" | "interior" | "exterior" | "video">("comida");
  const [activeIndex, setActiveIndex] = useState(0);

  // Find the food category (key: "food") - this is the default
  const foodCategory = galleryBundle?.categories?.find(cat => cat.key === "food");
  const foodImages = foodCategory?.items ?? [];
  const videoCategory = galleryBundle?.categories?.find((cat) => cat.key === "video");
  const videoItems = videoCategory?.items ?? [];

  const previewImages = foodImages.slice(0, 7);
  
  const hasContent = foodImages.length > 0 || 
                     (galleryBundle?.categories?.find(cat => cat.key === "interior")?.items.length ?? 0) > 0 ||
                     (galleryBundle?.categories?.find(cat => cat.key === "exterior")?.items.length ?? 0) > 0 ||
                     (galleryBundle?.categories?.find(cat => cat.key === "video")?.items.length ?? 0) > 0;

  const hasVideoTab =
    (galleryBundle?.categories?.find((cat) => cat.key === "video")?.items.length ?? 0) > 0;
  const videoItemCount =
    galleryBundle?.categories?.find((cat) => cat.key === "video")?.items.length ?? 0;

  if (!hasContent) {
    return null;
  }

  // Get items for current category
  const getCurrentItems = () => {
    const category = galleryBundle?.categories?.find(cat => {
      switch (activeCategory) {
        case "comida":
          return cat.key === "food";
        case "interior":
          return cat.key === "interior";
        case "exterior":
          return cat.key === "exterior";
        case "video":
          return cat.key === "video";
        default:
          return false;
      }
    });
    return category?.items ?? [];
  };

  const currentItems = getCurrentItems();

  const openModal = (category: typeof activeCategory = "comida", index = 0) => {
    setActiveCategory(category);
    setActiveIndex(index);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const nextItem = () => {
    const items = getCurrentItems();
    if (activeIndex < items.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const prevItem = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const switchCategory = (category: typeof activeCategory) => {
    setActiveCategory(category);
    setActiveIndex(0);
  };

  return (
    <>
      {/* Gallery Section */}
      <section className="rounded-2xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_4px_20px_-8px_rgba(212,165,116,0.14)] overflow-hidden">
        <div className="p-4 sm:p-5">
          <h2 className="mb-3 text-lg font-bold leading-tight tracking-tight text-[#1F1A17] md:text-xl">
            {lang === "en" ? "Gallery & Videos" : "Galería y Videos"}
          </h2>

          {previewImages.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-7 md:gap-2">
                {previewImages.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => openModal("comida", index)}
                    className="relative aspect-[4/3] rounded-lg overflow-hidden group hover:opacity-90 transition-opacity"
                  >
                    <Image
                      src={item.imageUrl!}
                      alt={item.alt}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs bg-black/60 px-2 py-1 rounded">
                        Ver
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {videoItems.length > 0 ? (
            <div className={previewImages.length > 0 ? "mt-4 space-y-2" : "space-y-2"}>
              <h3 className="text-sm font-semibold text-[#1F1A17]">
                {videoItems.length > 1 ? (lang === "en" ? "Videos" : "Videos") : lang === "en" ? "Video" : "Video"}
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {videoItems.map((item, index) => (
                  <RestauranteVideoPreviewCard
                    key={`video-preview-${index}`}
                    videoRemoteUrl={item.videoRemoteUrl}
                    videoSrc={item.videoSrc}
                    label={item.alt}
                    lang={lang}
                    compact
                    onClick={() => openModal("video", index)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {(previewImages.length > 0 || videoItems.length > 0) && (
            <div className="mt-3 flex justify-center pt-1">
              <button
                type="button"
                onClick={() => openModal(previewImages.length > 0 ? "comida" : "video", 0)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#BEA98E] px-4 py-2 text-sm font-semibold text-[#1F1A17] transition-colors hover:bg-[#D8C2A0]"
              >
                {lang === "en" ? "Explore photos & videos" : "Explorar fotos y videos"}
                <FiExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Modal/Lightbox */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Galería · ${activeCategory}`}
        >
          <div className="flex h-full max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f0d09] shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
              <p className="text-xs font-semibold text-white/80">
                Galería · {activeIndex + 1} / {currentItems.length}
              </p>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0 overflow-x-auto border-b border-white/10 px-3 sm:px-4">
              <div className="flex gap-2">
                <button
                  onClick={() => switchCategory("comida")}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeCategory === "comida"
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Comida
                </button>
                <button
                  onClick={() => switchCategory("interior")}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeCategory === "interior"
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Interior
                </button>
                <button
                  onClick={() => switchCategory("exterior")}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeCategory === "exterior"
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Exterior
                </button>
                {hasVideoTab && (
                  <button
                    onClick={() => switchCategory("video")}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeCategory === "video"
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {videoItemCount > 1 ? "Videos" : "Video"}
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {activeCategory === "video" && currentItems.length > 1 ? (
                <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-white/10 px-3 py-2 sm:px-4">
                  {currentItems.map((item, idx) => (
                    <RestauranteVideoPreviewCard
                      key={idx}
                      videoRemoteUrl={item.videoRemoteUrl}
                      videoSrc={item.videoSrc}
                      label={item.alt}
                      lang={lang}
                      compact
                      selected={activeIndex === idx}
                      onClick={() => setActiveIndex(idx)}
                    />
                  ))}
                </div>
              ) : null}
              <div className="flex flex-1 items-center justify-center overflow-hidden">
              {currentItems.length > 0 && activeIndex < currentItems.length && (
                <div className="relative flex h-full w-full items-center justify-center">
                  {activeCategory === "video" ? (
                    <div className="w-full max-w-5xl p-2">
                      <ShellVideoSlide item={currentItems[activeIndex]} />
                    </div>
                  ) : (
                    <Image
                      src={currentItems[activeIndex].imageUrl!}
                      alt={currentItems[activeIndex].alt}
                      fill
                      className="object-contain"
                    />
                  )}
                </div>
              )}
              </div>
            </div>

            {/* Navigation */}
            {currentItems.length > 1 && (
              <div className="flex shrink-0 items-center justify-between gap-2 p-3 sm:p-4">
                <button
                  type="button"
                  onClick={prevItem}
                  disabled={activeIndex === 0}
                  className="rounded-lg bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={nextItem}
                  disabled={activeIndex === currentItems.length - 1}
                  className="rounded-lg bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
