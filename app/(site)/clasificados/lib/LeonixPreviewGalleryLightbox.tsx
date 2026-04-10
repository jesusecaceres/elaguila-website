"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BienesRaicesPreviewMediaVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { BrNegocioStreamableVideo } from "@/app/clasificados/bienes-raices/preview/negocio/components/BrNegocioStreamableVideo";
import {
  buildLeonixGallerySlidesFromMediaVm,
  type LeonixGallerySlide,
} from "./leonixGallerySlides";

type Vm = { media: BienesRaicesPreviewMediaVm };

function ZoomablePhoto({ url, caption }: { url: string; caption: string }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setScale(1);
  }, [url]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setScale((s) => {
      const next = s + (e.deltaY > 0 ? -0.12 : 0.12);
      return Math.min(4, Math.max(1, next));
    });
  }, []);

  return (
    <div
      className="relative flex max-h-[min(72vh,780px)] w-full flex-1 touch-pan-y items-center justify-center overflow-auto"
      onWheel={onWheel}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="max-h-none max-w-full object-contain transition-transform duration-150 ease-out"
        style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
        draggable={false}
      />
      {scale > 1 ? (
        <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center px-4">
          <button
            type="button"
            className="pointer-events-auto rounded-full border border-white/25 bg-black/55 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm hover:bg-black/70"
            onClick={() => setScale(1)}
          >
            Restablecer
          </button>
        </div>
      ) : null}
      {caption ? (
        <p className="pointer-events-none absolute left-0 right-0 top-3 px-4 text-center text-xs text-white/85">{caption}</p>
      ) : null}
    </div>
  );
}

function VideoSlide({ vm, slot }: { vm: Vm; slot: 0 | 1 }) {
  const m = vm.media;
  const yt = m?.youtubeIds?.[slot] ?? null;
  const playback = m?.videoPlaybackUrls?.[slot] ?? null;
  const thumb = m?.videoThumbUrls?.[slot] ?? null;
  const watchUrl = yt ? `https://www.youtube.com/watch?v=${yt}` : playback ?? "";

  if (yt) {
    return (
      <iframe
        title="Video del anuncio"
        className="h-full min-h-[200px] w-full max-h-[min(72vh,720px)]"
        src={`https://www.youtube-nocookie.com/embed/${yt}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (playback && /^data:video\//i.test(playback)) {
    return <video controls playsInline className="h-full max-h-[min(72vh,720px)] w-full object-contain" src={playback} />;
  }
  if (playback && /\.m3u8|\.mp4(\?|$)|blob:/i.test(playback)) {
    return playback.includes(".m3u8") || playback.startsWith("blob:") ? (
      <BrNegocioStreamableVideo url={playback} className="h-full min-h-[200px] max-h-[min(72vh,720px)] w-full object-contain" />
    ) : (
      <video poster={thumb ?? undefined} controls playsInline className="h-full max-h-[min(72vh,720px)] w-full object-contain" src={playback} />
    );
  }
  if (watchUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-white/85">Abre el video en una nueva pestaña.</p>
        <a
          href={watchUrl}
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

function slideKey(s: LeonixGallerySlide, idx: number): string {
  if (s.kind === "photo") return `p-${s.sourceIndex}-${idx}`;
  return `v-${s.slot}`;
}

/**
 * Shared Leonix real-estate preview lightbox: deduped photo slides + video slots, quiet zoom, sticky close bar.
 */
export function LeonixPreviewGalleryLightbox({
  vm,
  open,
  initialIndex,
  onClose,
}: {
  vm: Vm;
  open: boolean;
  initialIndex: number;
  onClose: () => void;
}) {
  const slides = useMemo(() => buildLeonixGallerySlidesFromMediaVm(vm.media), [vm.media]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      const max = Math.max(0, slides.length - 1);
      setActive(Math.min(Math.max(0, initialIndex), max));
    }
  }, [open, initialIndex, slides.length]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") setActive((i) => (i <= 0 ? slides.length - 1 : i - 1));
      else if (e.key === "ArrowRight") setActive((i) => (i >= slides.length - 1 ? 0 : i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, slides.length]);

  const current = slides[Math.min(active, Math.max(0, slides.length - 1))] ?? null;
  const show = open && slides.length > 0;

  return !show ? null : (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Galería de fotos y videos"
    >
      <div className="flex h-[min(96vh,100dvh)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f0d09] shadow-2xl">
        <div
          className="sticky top-0 z-[92] flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0f0d09]/98 px-3 py-2.5 backdrop-blur-md sm:px-4"
          style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))" }}
        >
          <p className="min-w-0 truncate text-xs font-semibold text-white/90">
            Galería · {active + 1} / {slides.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-white/25"
            aria-label="Cerrar galería"
          >
            Cerrar
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            {current?.kind === "photo" ? (
              <ZoomablePhoto url={current.url} caption={current.caption} />
            ) : current?.kind === "video" ? (
              <div className="flex h-full min-h-0 w-full max-w-5xl items-center justify-center p-2 sm:p-4">
                <VideoSlide vm={vm} slot={current.slot} />
              </div>
            ) : null}

            {slides.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setActive((i) => (i <= 0 ? slides.length - 1 : i - 1))}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 px-3 py-2 text-lg font-bold text-white hover:bg-black/70 sm:left-4"
                  aria-label="Anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setActive((i) => (i >= slides.length - 1 ? 0 : i + 1))}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 px-3 py-2 text-lg font-bold text-white hover:bg-black/70 sm:right-4"
                  aria-label="Siguiente"
                >
                  ›
                </button>
              </>
            ) : null}
          </div>

          {slides.length > 1 ? (
            <div className="flex max-h-[min(28vh,240px)] shrink-0 gap-2 overflow-x-auto border-t border-white/10 bg-black/40 px-2 py-2 sm:px-3">
              {slides.map((s, idx) => (
                <button
                  key={slideKey(s, idx)}
                  type="button"
                  onClick={() => setActive(idx)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border sm:h-[72px] sm:w-[72px] ${
                    active === idx ? "border-[#C5A059] ring-2 ring-[#C5A059]/40" : "border-white/10 opacity-80 hover:opacity-100"
                  }`}
                >
                  {s.kind === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-[#2A2620] text-[10px] font-bold text-[#F5F0E8]">
                      ▶
                      <span className="mt-0.5">V{s.slot + 1}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
