"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiVideo } from "react-icons/fi";
import type { ShellGalleryItem } from "./restaurantDetailShellTypes";

function youtubeEmbedId(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname.startsWith("/embed/")) return u.pathname.slice("/embed/".length).split("/")[0] || null;
      const v = u.searchParams.get("v");
      if (v) return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

type Slide =
  | { kind: "image"; url: string; alt: string }
  | { kind: "video"; item: ShellGalleryItem };

function buildSlides(items: ShellGalleryItem[]): Slide[] {
  const out: Slide[] = [];
  for (const g of items) {
    if (g.category === "video") {
      out.push({ kind: "video", item: g });
    } else if (g.imageUrl) {
      out.push({ kind: "image", url: g.imageUrl, alt: g.alt });
    }
  }
  return out;
}

function VideoSlide({ item }: { item: ShellGalleryItem }) {
  const src = item.videoSrc?.trim();
  const remote = item.videoRemoteUrl?.trim();
  if (src) {
    return (
      <video
        key={src.slice(0, 80)}
        className="max-h-[min(78vh,820px)] w-full max-w-5xl object-contain"
        controls
        playsInline
        preload="metadata"
        src={src}
      />
    );
  }
  if (remote) {
    const yid = youtubeEmbedId(remote);
    if (yid) {
      return (
        <iframe
          title={item.alt}
          className="aspect-video h-auto min-h-[240px] w-full max-w-5xl rounded-lg border border-white/10"
          src={`https://www.youtube-nocookie.com/embed/${yid}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-white/85">Abre el video en una nueva pestaña.</p>
        <a
          href={remote}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/15"
        >
          Ver video
        </a>
      </div>
    );
  }
  return <p className="p-8 text-center text-sm text-white/70">Video no disponible.</p>;
}

export function RestauranteShellGalleryBlock({
  gallery,
  galleryCta,
}: {
  gallery: ShellGalleryItem[];
  galleryCta?: { label: string; href: string };
}) {
  const slides = useMemo(() => buildSlides(gallery), [gallery]);
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

  const current = slides[Math.min(active, Math.max(0, slides.length - 1))] ?? null;

  return (
    <section id="media" aria-labelledby="gallery-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="gallery-heading" className="text-xl font-bold tracking-tight text-[color:var(--lx-text)]">
          Galería
        </h2>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {gallery.map((g, idx) => (
          <button
            key={`${g.alt}-${idx}`}
            type="button"
            onClick={() => openAt(idx)}
            className={`relative aspect-square overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-left transition hover:ring-2 hover:ring-[color:var(--lx-gold-border)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-gold)] ${
              g.category === "video" ? "ring-2 ring-[color:var(--lx-gold)]/35" : ""
            }`}
          >
            {g.imageUrl ? (
              <Image
                src={g.imageUrl}
                alt={g.alt}
                fill
                unoptimized={g.imageUrl.startsWith("data:")}
                className="object-cover"
                sizes="(max-width:1024px) 50vw, 25vw"
              />
            ) : g.category === "video" && g.videoSrc?.startsWith("data:video") ? (
              <video
                className="absolute inset-0 h-full w-full object-cover"
                muted
                playsInline
                preload="metadata"
                src={g.videoSrc}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#2a2620] to-[#1a1814]" aria-hidden />
            )}
            {g.countOverlay != null ? (
              <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
                +{g.countOverlay}
              </span>
            ) : null}
            {g.category === "video" ? (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/92 text-[color:var(--lx-text)] shadow-lg">
                  <FiVideo className="h-5 w-5" aria-hidden />
                </span>
              </span>
            ) : null}
          </button>
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
                <VideoSlide item={current.item} />
              ) : null}
              {slides.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Anterior"
                    onClick={() => setActive((i) => (i <= 0 ? slides.length - 1 : i - 1))}
                    className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 px-3 py-2 text-sm font-bold text-white hover:bg-black/70 sm:left-3"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Siguiente"
                    onClick={() => setActive((i) => (i >= slides.length - 1 ? 0 : i + 1))}
                    className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 px-3 py-2 text-sm font-bold text-white hover:bg-black/70 sm:right-3"
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
