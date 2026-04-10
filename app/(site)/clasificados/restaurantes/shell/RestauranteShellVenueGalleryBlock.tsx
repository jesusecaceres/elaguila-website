"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ShellVenueGalleryBundle, ShellVenueGalleryCategoryKey } from "./restaurantDetailShellTypes";
import {
  buildShellMediaSlides,
  ShellGalleryThumb,
  ShellVideoSlide,
  type ShellMediaSlide,
} from "./RestauranteShellGalleryPrimitives";

const SUPPLEMENT_PREVIEW = 6;

function MediaLightbox({
  open,
  onClose,
  slides,
  active,
  setActive,
  scopeLabel,
}: {
  open: boolean;
  onClose: () => void;
  slides: ShellMediaSlide[];
  active: number;
  setActive: Dispatch<SetStateAction<number>>;
  scopeLabel: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") setActive((i) => (i <= 0 ? slides.length - 1 : i - 1));
      else if (e.key === "ArrowRight") setActive((i) => (i >= slides.length - 1 ? 0 : i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, slides.length, onClose, setActive]);

  const current = slides[Math.min(active, Math.max(0, slides.length - 1))] ?? null;

  if (!open || slides.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Galería · ${scopeLabel}`}
    >
      <div className="flex h-full max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f0d09] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
          <p className="text-xs font-semibold text-white/80">
            {scopeLabel} · {active + 1} / {slides.length}
          </p>
          <button
            type="button"
            onClick={onClose}
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
  );
}

export function RestauranteShellVenueGalleryBlock({
  bundle,
  galleryCta,
}: {
  bundle: ShellVenueGalleryBundle;
  galleryCta?: { label: string; href: string };
}) {
  const { categories, supplemental } = bundle;
  const hasCats = categories.length > 0;
  const hasSupp = (supplemental?.length ?? 0) > 0;

  const [activeKey, setActiveKey] = useState<ShellVenueGalleryCategoryKey | null>(
    categories[0]?.key ?? null
  );

  const activeCategory = useMemo(() => {
    if (!hasCats) return null;
    const found = categories.find((c) => c.key === activeKey);
    return found ?? categories[0]!;
  }, [categories, activeKey, hasCats]);

  const activeItems = activeCategory?.items ?? [];

  const [suppExpanded, setSuppExpanded] = useState(false);
  const supplementVisible = useMemo(() => {
    if (!supplemental?.length) return [];
    if (suppExpanded || supplemental.length <= SUPPLEMENT_PREVIEW) return supplemental;
    return supplemental.slice(0, SUPPLEMENT_PREVIEW);
  }, [supplemental, suppExpanded]);

  const catSlides = useMemo(() => buildShellMediaSlides(activeItems), [activeItems]);
  const suppSlides = useMemo(() => buildShellMediaSlides(supplemental ?? []), [supplemental]);

  const [lbOpen, setLbOpen] = useState(false);
  const [lbScope, setLbScope] = useState<"category" | "supplement">("category");
  const [lbActive, setLbActive] = useState(0);

  const openCategoryAt = useCallback(
    (idx: number) => {
      setLbScope("category");
      const max = Math.max(0, catSlides.length - 1);
      setLbActive(Math.min(Math.max(0, idx), max));
      setLbOpen(true);
    },
    [catSlides.length]
  );

  const openSuppAt = useCallback(
    (idx: number) => {
      setLbScope("supplement");
      const max = Math.max(0, suppSlides.length - 1);
      setLbActive(Math.min(Math.max(0, idx), max));
      setLbOpen(true);
    },
    [suppSlides.length]
  );

  const lbSlides = lbScope === "supplement" ? suppSlides : catSlides;
  const lbLabel =
    lbScope === "supplement"
      ? hasCats
        ? "Fotos adicionales"
        : "Galería general"
      : activeCategory
        ? activeCategory.label
        : "Galería";

  const showTabs = categories.length > 1;

  useEffect(() => {
    if (!lbOpen || lbSlides.length === 0) return;
    setLbActive((i) => Math.min(i, Math.max(0, lbSlides.length - 1)));
  }, [lbOpen, lbSlides.length]);

  if (!hasCats && !hasSupp) return null;

  return (
    <section id="galeria-lugar" aria-labelledby="venue-gallery-heading" className="scroll-mt-24">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Ambiente</p>
        <h2 id="venue-gallery-heading" className="mt-1 text-2xl font-bold tracking-tight text-[color:var(--lx-text)]">
          El lugar, la mesa y el entorno
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
          Un recorrido visual: interior, platos y exterior cuando aplica — para imaginarte la experiencia antes de reservar.
        </p>
        {hasCats && activeCategory && showTabs ? (
          <p className="mt-3 text-sm text-[color:var(--lx-text-2)]">
            Álbum: <span className="font-semibold text-[color:var(--lx-text)]">{activeCategory.label}</span>
          </p>
        ) : hasCats && activeCategory && !showTabs ? (
          <p className="mt-3 text-sm text-[color:var(--lx-text-2)]">{activeCategory.label}</p>
        ) : null}
      </div>

      {showTabs ? (
        <div
          className="mt-6 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]"
          role="tablist"
          aria-label="Categorías de la galería"
        >
          {categories.map((c) => {
            const selected = c.key === activeCategory?.key;
            return (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setActiveKey(c.key);
                  setLbOpen(false);
                }}
                className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition min-h-[44px] ${
                  selected
                    ? "border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-text)] ring-2 ring-[color:var(--lx-gold)]/25"
                    : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-hover)]"
                }`}
              >
                {c.label}
                <span className="ml-1.5 tabular-nums text-[color:var(--lx-muted)]">({c.items.length})</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {hasCats && activeCategory ? (
        <div
          className={`${showTabs ? "mt-5" : "mt-6"} grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3`}
          role="tabpanel"
          aria-label={activeCategory.label}
        >
          {activeItems.map((g, idx) => (
            <ShellGalleryThumb key={`${activeCategory.key}-${g.alt}-${idx}`} g={g} onOpen={() => openCategoryAt(idx)} />
          ))}
        </div>
      ) : null}

      {hasSupp ? (
        <div className={hasCats ? "mt-10" : "mt-5"}>
          {hasCats ? (
            <>
              <h3 className="text-base font-bold text-[color:var(--lx-text)]">Fotos adicionales</h3>
              <p className="mt-1 text-sm text-[color:var(--lx-text-2)]">
                Imágenes de la galería general (complementarias a las categorías de arriba).
              </p>
            </>
          ) : (
            <p className="text-sm text-[color:var(--lx-text-2)]">
              Galería general: fotos adicionales del anuncio (cuando no hay álbumes por categoría).
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-3xl sm:grid-cols-3 sm:gap-3">
            {supplementVisible.map((g, idx) => (
              <ShellGalleryThumb
                key={`supp-${g.alt}-${idx}`}
                g={g}
                onOpen={() => {
                  const globalIdx = supplemental!.indexOf(g);
                  openSuppAt(globalIdx >= 0 ? globalIdx : idx);
                }}
              />
            ))}
          </div>
          {supplemental!.length > SUPPLEMENT_PREVIEW ? (
            <button
              type="button"
              onClick={() => setSuppExpanded((e) => !e)}
              className="mt-4 text-sm font-semibold text-[color:var(--lx-text)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
            >
              {suppExpanded ? "Mostrar menos" : `Ver más fotos (${supplemental!.length - SUPPLEMENT_PREVIEW} más)`}
            </button>
          ) : null}
        </div>
      ) : null}

      {galleryCta ? (
        <div className="mt-6">
          <a
            href={galleryCta.href}
            className="text-sm font-semibold text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
          >
            {galleryCta.label}
          </a>
        </div>
      ) : null}

      <MediaLightbox
        open={lbOpen}
        onClose={() => setLbOpen(false)}
        slides={lbSlides}
        active={lbActive}
        setActive={setLbActive}
        scopeLabel={lbLabel}
      />
    </section>
  );
}
