"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import type { BienesRaicesPreviewMediaVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { BrNegocioStreamableVideo } from "@/app/clasificados/bienes-raices/preview/negocio/components/BrNegocioStreamableVideo";
import { isHostedStreamOrBlobUrl, isHttpsDirectVideoUrl, isInlineVideoDataUrl } from "@/app/clasificados/lib/leonixPreviewVideoUrl";
import { leonixGalleryPhotoSlidesWithCaptions } from "./leonixGallerySlides";

type Vm = { media: BienesRaicesPreviewMediaVm };

type GalleryLightboxUi = {
  resetZoom: string;
  listingVideoTitle: string;
  openVideoNewTab: string;
  watchVideo: string;
  videoUnavailable: string;
  dialogAria: string;
  photosTab: string;
  videoTab: string;
  photosCountLabel: (idx: number, total: number) => string;
  videoHeader: string;
  galleryHeader: string;
  closeAria: string;
  close: string;
  prevAria: string;
  nextAria: string;
};

function galleryLightboxUi(lang: RentasLandingLang | undefined): GalleryLightboxUi {
  if (lang === "en") {
    return {
      resetZoom: "Reset",
      listingVideoTitle: "Listing video",
      openVideoNewTab: "Open the video in a new tab.",
      watchVideo: "Watch video",
      videoUnavailable: "Video unavailable.",
      dialogAria: "Photo and video gallery",
      photosTab: "Photos",
      videoTab: "Video",
      photosCountLabel: (idx, total) => `Photos · ${idx + 1} / ${total}`,
      videoHeader: "Video",
      galleryHeader: "Gallery",
      closeAria: "Close gallery",
      close: "Close",
      prevAria: "Previous",
      nextAria: "Next",
    };
  }
  return {
    resetZoom: "Restablecer",
    listingVideoTitle: "Video del anuncio",
    openVideoNewTab: "Abre el video en una nueva pestaña.",
    watchVideo: "Ver video",
    videoUnavailable: "Video no disponible.",
    dialogAria: "Galería de fotos y videos",
    photosTab: "Fotos",
    videoTab: "Video",
    photosCountLabel: (idx, total) => `Fotos · ${idx + 1} / ${total}`,
    videoHeader: "Video",
    galleryHeader: "Galería",
    closeAria: "Cerrar galería",
    close: "Cerrar",
    prevAria: "Anterior",
    nextAria: "Siguiente",
  };
}

function ZoomablePhoto({ url, caption, resetLabel }: { url: string; caption: string; resetLabel: string }) {
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
      className="relative flex h-full min-h-0 w-full flex-1 touch-pan-y items-center justify-center overflow-hidden px-1 sm:px-2"
      onWheel={onWheel}
    >
      <img
        src={url}
        alt=""
        className="max-h-[min(78vh,820px)] max-w-full object-contain transition-transform duration-150 ease-out"
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
            {resetLabel}
          </button>
        </div>
      ) : null}
      {caption ? (
        <p className="pointer-events-none absolute left-0 right-0 top-3 px-4 text-center text-xs text-white/85">{caption}</p>
      ) : null}
    </div>
  );
}

function VideoSlide({ vm, slot, ui }: { vm: Vm; slot: 0 | 1; ui: GalleryLightboxUi }) {
  const m = vm.media;
  const yt = m?.youtubeIds?.[slot] ?? null;
  const playback = m?.videoPlaybackUrls?.[slot] ?? null;
  const thumb = m?.videoThumbUrls?.[slot] ?? null;
  const watchUrl = yt ? `https://www.youtube.com/watch?v=${yt}` : playback ?? "";

  if (yt) {
    return (
      <iframe
        title={ui.listingVideoTitle}
        className="h-full min-h-[220px] w-full max-h-[min(78vh,820px)]"
        src={`https://www.youtube-nocookie.com/embed/${yt}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (playback && isInlineVideoDataUrl(playback)) {
    return <video controls playsInline className="h-full max-h-[min(78vh,820px)] w-full object-contain" src={playback} />;
  }
  if (playback && isHostedStreamOrBlobUrl(playback)) {
    return playback.includes(".m3u8") || playback.startsWith("blob:") ? (
      <BrNegocioStreamableVideo url={playback} className="h-full min-h-[220px] max-h-[min(78vh,820px)] w-full object-contain" />
    ) : (
      <video poster={thumb ?? undefined} controls playsInline className="h-full max-h-[min(78vh,820px)] w-full object-contain" src={playback} />
    );
  }
  if (playback && isHttpsDirectVideoUrl(playback)) {
    return <video controls playsInline className="h-full max-h-[min(78vh,820px)] w-full object-contain" src={playback} />;
  }
  if (watchUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 sm:p-8">
        <div
          className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border px-6 py-8 text-center"
          style={{ borderColor: "rgba(201,180,106,0.35)", background: "linear-gradient(180deg, #FFFCF7 0%, #FAF7F2 100%)" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "#5C5346" }}>
            {ui.openVideoNewTab}
          </p>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm"
            style={{ background: "linear-gradient(180deg, #6E2B2B 0%, #5A2222 100%)" }}
          >
            {ui.watchVideo}
          </a>
        </div>
      </div>
    );
  }
  return <p className="p-8 text-center text-sm text-white/70">{ui.videoUnavailable}</p>;
}

/**
 * Shared Leonix real-estate preview lightbox: Fotos / Video tabs, zoom on photos, sticky header + close.
 */
export function LeonixPreviewGalleryLightbox({
  vm,
  open,
  initialIndex,
  onClose,
  lang,
}: {
  vm: Vm;
  open: boolean;
  initialIndex: number;
  onClose: () => void;
  /** Defaults to Spanish when omitted. */
  lang?: RentasLandingLang;
}) {
  const lb = galleryLightboxUi(lang);
  const photoSlides = useMemo(
    () => leonixGalleryPhotoSlidesWithCaptions(vm.media?.allPhotoUrls, vm.media?.photoCaptionsFull),
    [vm.media],
  );
  const hasV1 = Boolean(vm.media?.hasVideo1);
  const hasV2 = Boolean(vm.media?.hasVideo2);
  const hasVideoTab = hasV1 || hasV2;
  const [tab, setTab] = useState<"fotos" | "video">("fotos");
  const [photoIdx, setPhotoIdx] = useState(0);
  const [videoSlot, setVideoSlot] = useState<0 | 1>(0);

  useEffect(() => {
    if (!open) return;
    const n = photoSlides.length;
    if (initialIndex >= n && hasVideoTab) {
      setTab("video");
      const slot: 0 | 1 = initialIndex > n && hasV2 ? 1 : 0;
      setVideoSlot(slot);
    } else {
      setTab("fotos");
      setPhotoIdx(n ? Math.min(Math.max(0, initialIndex), n - 1) : 0);
    }
  }, [open, initialIndex, photoSlides.length, hasVideoTab, hasV2]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (tab !== "fotos" || photoSlides.length <= 1) return;
      if (e.key === "ArrowLeft") setPhotoIdx((i) => (i <= 0 ? photoSlides.length - 1 : i - 1));
      if (e.key === "ArrowRight") setPhotoIdx((i) => (i >= photoSlides.length - 1 ? 0 : i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, tab, photoSlides.length]);

  const show = open && (photoSlides.length > 0 || hasVideoTab);
  const currentPhoto = photoSlides[photoIdx] ?? null;
  const headerCount =
    tab === "fotos" && photoSlides.length > 0
      ? lb.photosCountLabel(photoIdx, photoSlides.length)
      : tab === "video"
        ? lb.videoHeader
        : lb.galleryHeader;

  return !show ? null : (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-3 pt-[max(4.25rem,env(safe-area-inset-top,0px))] backdrop-blur-sm sm:p-6 sm:pt-[max(5rem,env(safe-area-inset-top,0px))]"
      role="dialog"
      aria-modal="true"
      aria-label={lb.dialogAria}
    >
      <div className="flex h-[min(96vh,100dvh)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f0d09] shadow-2xl">
        <div
          className="sticky top-0 z-[92] flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0f0d09]/98 px-3 py-2.5 backdrop-blur-md sm:gap-3 sm:px-4"
          style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))" }}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {photoSlides.length > 0 ? (
              <button
                type="button"
                onClick={() => setTab("fotos")}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold sm:text-xs ${
                  tab === "fotos" ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10"
                }`}
              >
                {lb.photosTab}
              </button>
            ) : null}
            {hasVideoTab ? (
              <button
                type="button"
                onClick={() => setTab("video")}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold sm:text-xs ${
                  tab === "video" ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10"
                }`}
              >
                {lb.videoTab}
              </button>
            ) : null}
            <p className="min-w-0 truncate text-xs font-semibold text-white/90">{headerCount}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-white/25"
            aria-label={lb.closeAria}
          >
            {lb.close}
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
            {tab === "fotos" && currentPhoto ? (
              <ZoomablePhoto url={currentPhoto.url} caption={currentPhoto.caption} resetLabel={lb.resetZoom} />
            ) : null}
            {tab === "video" && hasVideoTab ? (
              <div className="flex h-full min-h-0 w-full max-w-5xl flex-1 items-center justify-center p-2 sm:p-4">
                <VideoSlide vm={vm} slot={videoSlot === 1 && hasV2 ? 1 : 0} ui={lb} />
              </div>
            ) : null}

            {tab === "fotos" && photoSlides.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setPhotoIdx((i) => (i <= 0 ? photoSlides.length - 1 : i - 1))}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 px-3 py-2 text-lg font-bold text-white hover:bg-black/70 sm:left-4"
                  aria-label={lb.prevAria}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoIdx((i) => (i >= photoSlides.length - 1 ? 0 : i + 1))}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 px-3 py-2 text-lg font-bold text-white hover:bg-black/70 sm:right-4"
                  aria-label={lb.nextAria}
                >
                  ›
                </button>
              </>
            ) : null}
          </div>

          {tab === "fotos" && photoSlides.length > 1 ? (
            <div className="flex max-h-[min(24vh,200px)] shrink-0 gap-2 overflow-x-auto border-t border-white/10 bg-black/40 px-2 py-2 sm:px-3">
              {photoSlides.map((s, idx) => (
                <button
                  key={`ph-${s.sourceIndex}-${idx}`}
                  type="button"
                  onClick={() => setPhotoIdx(idx)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border sm:h-[72px] sm:w-[72px] ${
                    photoIdx === idx ? "border-[#C5A059] ring-2 ring-[#C5A059]/40" : "border-white/10 opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={s.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
