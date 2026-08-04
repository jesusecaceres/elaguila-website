"use client";

import { useCallback, useEffect, useState } from "react";

export type ViajesGalleryImage = {
  src: string;
  alt: string;
  focalX: number;
  focalY: number;
};

export function ViajesOfferDetailGallery({
  images,
  title,
  lang = "es",
}: {
  images: ViajesGalleryImage[];
  title: string;
  lang?: "es" | "en";
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const total = images.length;

  const go = useCallback(
    (delta: number) => {
      if (!total) return;
      setActive((i) => (i + delta + total) % total);
    },
    [total]
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, go]);

  if (!total) return null;
  const current = images[Math.min(active, total - 1)]!;

  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-sm sm:p-8">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--lx-burgundy)]">
          {lang === "en" ? "Gallery" : "Galería"}
        </h2>
        <p className="text-xs font-semibold text-[color:var(--lx-muted)]">
          {active + 1} / {total}
        </p>
      </div>

      <button
        type="button"
        className="relative mt-4 block w-full overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-gold)]"
        onClick={() => setLightbox(true)}
        aria-label={lang === "en" ? "Open gallery" : "Abrir galería"}
      >
        <img
          src={current.src}
          alt={current.alt || title}
          className="aspect-[16/10] w-full object-cover"
          style={{ objectPosition: `${current.focalX * 100}% ${current.focalY * 100}%` }}
        />
      </button>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[color:var(--lx-nav-border)] text-sm font-bold"
          onClick={() => go(-1)}
          aria-label={lang === "en" ? "Previous" : "Anterior"}
        >
          ←
        </button>
        <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
          {images.map((g, i) => (
            <li key={`${g.src}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`h-14 w-20 overflow-hidden rounded-lg border-2 ${
                  i === active ? "border-[color:var(--lx-gold)]" : "border-transparent opacity-80"
                }`}
                aria-label={`${lang === "en" ? "Photo" : "Foto"} ${i + 1}`}
              >
                <img
                  src={g.src}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ objectPosition: `${g.focalX * 100}% ${g.focalY * 100}%` }}
                />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[color:var(--lx-nav-border)] text-sm font-bold"
          onClick={() => go(1)}
          aria-label={lang === "en" ? "Next" : "Siguiente"}
        >
          →
        </button>
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-2 text-sm font-bold text-white"
            onClick={() => setLightbox(false)}
          >
            {lang === "en" ? "Close" : "Cerrar"}
          </button>
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            ←
          </button>
          <img
            src={current.src}
            alt={current.alt || title}
            className="max-h-[85vh] max-w-[min(1100px,94vw)] object-contain"
            style={{ objectPosition: `${current.focalX * 100}% ${current.focalY * 100}%` }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            →
          </button>
        </div>
      ) : null}
    </section>
  );
}
