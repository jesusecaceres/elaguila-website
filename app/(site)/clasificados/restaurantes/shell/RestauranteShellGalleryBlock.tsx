"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ShellGalleryItem } from "./restaurantDetailShellTypes";
import {
  buildShellMediaSlides,
  ShellGalleryThumb,
  ShellVideoSlide,
  type ShellMediaSlide,
} from "./RestauranteShellGalleryPrimitives";

export function RestauranteShellGalleryBlock({
  gallery,
  galleryCta,
}: {
  gallery: ShellGalleryItem[];
  galleryCta?: { label: string; href: string };
}) {
  const slides = useMemo(() => buildShellMediaSlides(gallery), [gallery]);
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

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowLeft") setActive((i) => (i <= 0 ? slides.length - 1 : i - 1));
      else if (e.key === "ArrowRight") setActive((i) => (i >= slides.length - 1 ? 0 : i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, slides.length]);

  const current: ShellMediaSlide | null = slides[Math.min(active, Math.max(0, slides.length - 1))] ?? null;

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

      {open && slides.length > 0 ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Galería de fotos y videos"
        >
          <div className="flex h-full max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f0d09] shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
              <p className="text-xs font-semibold text-white/80">
                Galería · {active + 1} / {slides.length}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/15"
              >
                Cerrar
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center bg-black p-2 sm:p-4">
              {current?.kind === "image" ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={current.url}
                  alt={current.alt}
                  className="max-h-[min(78vh,820px)] max-w-full object-contain"
                  draggable={false}
                />
              ) : current?.kind === "video" ? (
                <ShellVideoSlide item={current.item} />
              ) : null}
              {slides.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Anterior"
                    onClick={() => setActive((i) => (i <= 0 ? slides.length - 1 : i - 1))}
                    className="absolute left-1 top-1/2 z-10 min-h-[44px] min-w-[44px] -translate-y-1/2 rounded-full border border-white/20 bg-black/50 px-3 py-2 text-sm font-bold text-white hover:bg-black/70 sm:left-3"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Siguiente"
                    onClick={() => setActive((i) => (i >= slides.length - 1 ? 0 : i + 1))}
                    className="absolute right-1 top-1/2 z-10 min-h-[44px] min-w-[44px] -translate-y-1/2 rounded-full border border-white/20 bg-black/50 px-3 py-2 text-sm font-bold text-white hover:bg-black/70 sm:right-3"
                  >
                    ›
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
