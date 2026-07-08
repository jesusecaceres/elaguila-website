"use client";

import Image from "next/image";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";

export function ServiciosProfessionalVisualProofRow({
  profile,
  lang,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
}) {
  const images = [...profile.gallery, ...profile.galleryMore].slice(0, 4);

  if (images.length === 0) return null;

  return (
    <section
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#D8C2A0] bg-[#FFFAF3] p-4 shadow-[0_4px_20px_-8px_rgba(212,165,116,0.14)] sm:p-5"
      aria-labelledby="servicios-visual-proof-heading"
      data-servicios-professional-visual-proof="1"
    >
      <div className="max-w-2xl">
        <h2 id="servicios-visual-proof-heading" className="text-lg font-bold tracking-tight text-[#1F1A17] md:text-xl">
          {lang === "en" ? "Quick visual preview" : "Vista rápida del trabajo"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[#5A5148]">
          {lang === "en"
            ? "Selected profile photos before the full gallery."
            : "Fotos destacadas del perfil antes de explorar la galería completa."}
        </p>
      </div>

      <div className="-mx-1 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] md:hidden">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative aspect-[5/4] w-[min(82vw,300px)] shrink-0 snap-center overflow-hidden rounded-xl border border-[#D8C2A0] bg-[#F5F0E8] shadow-sm"
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="85vw"
              unoptimized={serviciosImageUnoptimized(image.url)}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative aspect-[5/4] overflow-hidden rounded-xl border border-[#D8C2A0] bg-[#F5F0E8] shadow-sm"
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 25vw"
              unoptimized={serviciosImageUnoptimized(image.url)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
