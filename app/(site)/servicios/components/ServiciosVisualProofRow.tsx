"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import {
  getAllServiciosGalleryPhotos,
  getFeaturedVisualProofImages,
} from "../lib/serviciosFeaturedMedia";
import { ServiciosMediaLightbox } from "./ServiciosMediaLightbox";

export function ServiciosVisualProofRow({
  profile,
  lang,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
}) {
  const images = getFeaturedVisualProofImages(profile, 4);
  const allPhotos = getAllServiciosGalleryPhotos(profile);
  const videos = profile.galleryVideos;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState(0);

  const openPhoto = useCallback(
    (imageId: string) => {
      const idx = allPhotos.findIndex((g) => g.id === imageId);
      setLightboxPhotoIndex(idx >= 0 ? idx : 0);
      setLightboxOpen(true);
    },
    [allPhotos],
  );

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  if (images.length === 0) return null;

  return (
    <>
      <section
        className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#D8C2A0] bg-[#FFFAF3] p-4 shadow-[0_4px_20px_-8px_rgba(212,165,116,0.14)] sm:p-5"
        aria-labelledby="servicios-visual-proof-heading"
        data-servicios-visual-proof="1"
      >
        <div className="max-w-2xl">
          <h2 id="servicios-visual-proof-heading" className="text-lg font-bold tracking-tight text-[#1F1A17] md:text-xl">
            {lang === "en" ? "Quick visual preview" : "Vista rápida del trabajo"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#5A5148]">
            {lang === "en"
              ? "Featured profile photos before the full gallery."
              : "Fotos destacadas del perfil antes de explorar la galería completa."}
          </p>
        </div>

        <div className="-mx-1 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] md:hidden">
          {images.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => openPhoto(image.id)}
              className="relative aspect-[5/4] w-[min(82vw,300px)] shrink-0 snap-center overflow-hidden rounded-xl border border-[#D8C2A0] bg-[#F5F0E8] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B66AD]/60"
              aria-label={image.alt}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="85vw"
                unoptimized={serviciosImageUnoptimized(image.url)}
              />
            </button>
          ))}
        </div>

        <div className="mt-4 hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-4">
          {images.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => openPhoto(image.id)}
              className="relative aspect-[5/4] overflow-hidden rounded-xl border border-[#D8C2A0] bg-[#F5F0E8] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B66AD]/60"
              aria-label={image.alt}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
                unoptimized={serviciosImageUnoptimized(image.url)}
              />
            </button>
          ))}
        </div>
      </section>

      <ServiciosMediaLightbox
        photos={allPhotos}
        videos={videos}
        lang={lang}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        initialTab="photos"
        initialPhotoIndex={lightboxPhotoIndex}
      />
    </>
  );
}
