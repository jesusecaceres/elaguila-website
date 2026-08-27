"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Shared Fotos/Videos gallery modal — generalized from Restaurantes' working
 * `RestauranteShellGalleryBlock` + `RestauranteShellGalleryPrimitives`
 * (app/(site)/clasificados/restaurantes/shell/). The modal chrome (thumbnail grid, slide
 * index/counter, prev/next, Escape-to-close, visible close control, mobile-safe sizing) is
 * extracted verbatim in shape; video-platform detection (YouTube/Vimeo/local data URL) is
 * intentionally NOT reimplemented here — it stays Restaurantes-owned logic. Each slide/thumb
 * is supplied as a small render function by the caller, so a category's existing video
 * rendering (however it resolves platforms/thumbnails today) can be reused as-is without this
 * shared component inventing a second, competing video-parsing implementation.
 *
 * Worktree A builds this component only; wiring any category's live gallery onto it is
 * category-adapter work for a later worktree.
 */

export type BusinessGallerySlide =
  | { kind: "image"; url: string; alt: string }
  | { kind: "video"; renderVideo: () => ReactNode };

export type BusinessGalleryThumb = {
  /** Renders the thumbnail; call `onOpen` from the caller's own click handler. */
  renderThumb: (onOpen: () => void) => ReactNode;
};

export type BusinessGalleryModalCopy = {
  close: string;
  prev: string;
  next: string;
  /** e.g. "Galería" — combined with "{active} / {total}" for the counter line. */
  counterLabel: string;
};

export function BusinessGalleryModal({
  slides,
  thumbs,
  heading,
  eyebrow,
  description,
  galleryCta,
  copy,
  className,
}: {
  slides: BusinessGallerySlide[];
  thumbs: BusinessGalleryThumb[];
  heading: string;
  eyebrow?: string;
  description?: string;
  galleryCta?: { label: string; href: string };
  copy: BusinessGalleryModalCopy;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const openAt = useCallback(
    (idx: number) => {
      const max = Math.max(0, slides.length - 1);
      setActive(Math.min(Math.max(0, idx), max));
      setOpen(true);
    },
    [slides.length],
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

  const current = useMemo(
    () => slides[Math.min(active, Math.max(0, slides.length - 1))] ?? null,
    [slides, active],
  );

  return (
    <section className={className}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-2xl font-bold tracking-tight">{heading}</h2>
        {description ? <p className="mt-2 text-sm leading-relaxed opacity-80">{description}</p> : null}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {thumbs.map((t, idx) => (
          <div key={idx}>{t.renderThumb(() => openAt(idx))}</div>
        ))}
      </div>

      {galleryCta ? (
        <div className="mt-5">
          <a href={galleryCta.href} className="text-sm font-semibold underline underline-offset-4">
            {galleryCta.label}
          </a>
        </div>
      ) : null}

      {open && slides.length > 0 ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={heading}
        >
          <div className="flex h-full max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f0d09] shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
              <p className="text-xs font-semibold text-white/80">
                {copy.counterLabel} · {active + 1} / {slides.length}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/15"
              >
                {copy.close}
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center bg-black p-2 sm:p-4">
              {current?.kind === "image" ? (
                <img
                  src={current.url}
                  alt={current.alt}
                  className="max-h-[min(78vh,820px)] max-w-full object-contain"
                  draggable={false}
                />
              ) : current?.kind === "video" ? (
                current.renderVideo()
              ) : null}
              {slides.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label={copy.prev}
                    onClick={() => setActive((i) => (i <= 0 ? slides.length - 1 : i - 1))}
                    className="absolute left-1 top-1/2 z-10 min-h-[44px] min-w-[44px] -translate-y-1/2 rounded-full border border-white/20 bg-black/50 px-3 py-2 text-sm font-bold text-white hover:bg-black/70 sm:left-3"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label={copy.next}
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
