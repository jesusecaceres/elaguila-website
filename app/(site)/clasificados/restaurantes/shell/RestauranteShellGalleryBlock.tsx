"use client";

import { useCallback, useMemo, useState } from "react";
import type { ShellGalleryItem } from "./restaurantDetailShellTypes";
import {
  buildShellMediaSlides,
  ShellGalleryThumb,
  ShellVideoSlide,
} from "./RestauranteShellGalleryPrimitives";
import { BusinessGalleryLightbox, type BusinessGallerySlide } from "@/app/components/media/BusinessGalleryModal";

export function RestauranteShellGalleryBlock({
  gallery,
  galleryCta,
}: {
  gallery: ShellGalleryItem[];
  galleryCta?: { label: string; href: string };
}) {
  const slides = useMemo(() => buildShellMediaSlides(gallery), [gallery]);
  const gallerySlides: BusinessGallerySlide[] = useMemo(
    () =>
      slides.map((s) =>
        s.kind === "image" ? s : { kind: "video" as const, renderVideo: () => <ShellVideoSlide item={s.item} /> },
      ),
    [slides],
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const openAt = useCallback(
    (idx: number) => {
      const max = Math.max(0, slides.length - 1);
      setActive(Math.min(Math.max(0, idx), max));
      setOpen(true);
    },
    [slides.length]
  );

  return (
    <section id="media" aria-labelledby="gallery-heading" className="scroll-mt-24">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Ambiente</p>
        <h2 id="gallery-heading" className="mt-1 text-2xl font-bold tracking-tight text-[color:var(--lx-text)]">
          Galería del restaurante
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
          Fotos y video del listado — el tono del lugar en una sola pasada.
        </p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {gallery.map((g, idx) => (
          <ShellGalleryThumb key={`${g.alt}-${idx}`} g={g} onOpen={() => openAt(idx)} />
        ))}
      </div>
      {galleryCta ? (
        <div className="mt-5">
          <a
            href={galleryCta.href}
            className="text-sm font-semibold text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
          >
            {galleryCta.label}
          </a>
        </div>
      ) : null}

      <BusinessGalleryLightbox
        open={open}
        onClose={() => setOpen(false)}
        slides={gallerySlides}
        activeIndex={active}
        onActiveIndexChange={setActive}
        ariaLabel="Galería de fotos y videos"
        copy={{ close: "Cerrar", prev: "Anterior", next: "Siguiente", counterLabel: "Galería" }}
      />
    </section>
  );
}
