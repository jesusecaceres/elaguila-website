"use client";

import { useState } from "react";
import Image from "next/image";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { ShellVenueGalleryBundle } from "./restaurantDetailShellTypes";

interface RestauranteLockedGallerySectionProps {
  galleryBundle?: ShellVenueGalleryBundle;
}

export function RestauranteLockedGallerySection({ 
  galleryBundle 
}: RestauranteLockedGallerySectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"comida" | "interior" | "exterior" | "video">("comida");
  const [activeIndex, setActiveIndex] = useState(0);

  // Find the food category (key: "food") - this is the default
  const foodCategory = galleryBundle?.categories?.find(cat => cat.key === "food");
  const foodImages = foodCategory?.items ?? [];
  
  // Desktop: 4x2 grid (8 images), Mobile: 2x3 grid (6 images)
  const previewImages = foodImages.slice(0, typeof window !== 'undefined' && window.innerWidth >= 768 ? 8 : 6);
  
  const hasContent = foodImages.length > 0 || 
                     (galleryBundle?.categories?.find(cat => cat.key === "interior")?.items.length ?? 0) > 0 ||
                     (galleryBundle?.categories?.find(cat => cat.key === "exterior")?.items.length ?? 0) > 0 ||
                     (galleryBundle?.categories?.find(cat => cat.key === "video")?.items.length ?? 0) > 0;

  const hasVideoTab = (galleryBundle?.categories?.find(cat => cat.key === "video")?.items.length ?? 0) > 0;

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
      <section className="rounded-3xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_16px_64px_-24px_rgba(212,165,116,0.18)] overflow-hidden">
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1F1A17] leading-tight mb-8">Galería</h2>
          
          {/* Preview Grid - Comida by default */}
          {previewImages.length > 0 && (
            <div className="space-y-6">
              {/* Desktop: 4x2 grid, Mobile: 2x3 grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewImages.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => openModal("comida", index)}
                    className="relative aspect-[16/10] rounded-xl overflow-hidden group hover:opacity-90 transition-opacity"
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
              
              {/* CTA Button */}
              <div className="text-center">
                <button
                  onClick={() => openModal("comida", 0)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#BEA98E] text-[#1F1A17] rounded-full font-semibold hover:bg-[#D8C2A0] transition-colors"
                >
                  Explorar fotos y videos
                  <FiExternalLink className="w-4 h-4" />
                </button>
              </div>
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
                    Video
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 items-center justify-center overflow-hidden">
              {currentItems.length > 0 && activeIndex < currentItems.length && (
                <div className="relative w-full h-full flex items-center justify-center">
                  {activeCategory === "video" ? (
                    <video
                      src={currentItems[activeIndex].videoSrc || currentItems[activeIndex].videoRemoteUrl}
                      controls
                      className="max-w-full max-h-full object-contain"
                    />
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

// Import FiExternalLink
import { FiExternalLink } from "react-icons/fi";
