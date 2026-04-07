"use client";

/**
 * BR Negocio-style gallery modal for agente-individual residencial preview.
 * UI aligned with `BrNegocioGalleryLightbox`; props are plain URLs (no legacy VM).
 */

import { useCallback, useEffect, useMemo, useState } from "react";

type Slide = { kind: "photo"; index: number; url: string } | { kind: "video" };

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id && id.length >= 11 ? id.slice(0, 11) : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      return v && v.length >= 11 ? v.slice(0, 11) : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function ZoomablePhoto({
  url,
  zoomHint,
  resetZoom,
}: {
  url: string;
  zoomHint: string;
  resetZoom: string;
}) {
  const [scale, setScale] = useState(1);

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
      className="relative flex max-h-[min(78vh,820px)] w-full flex-1 touch-pan-y items-center justify-center overflow-auto"
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
      <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4">
        <span className="rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[11px] text-white/90 backdrop-blur-sm">
          {zoomHint}
        </span>
        <button
          type="button"
          className="pointer-events-auto rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-bold text-white hover:bg-white/25"
          onClick={() => setScale(1)}
        >
          {resetZoom}
        </button>
      </div>
    </div>
  );
}

function VideoSlideContent({
  videoDataUrl,
  videoExternalHref,
  openVideoTabLabel,
}: {
  videoDataUrl: string | null;
  videoExternalHref: string | null;
  openVideoTabLabel: string;
}) {
  const playback = videoDataUrl || videoExternalHref || "";
  if (!playback.trim()) {
    return <p className="p-8 text-center text-sm text-white/70">—</p>;
  }

  if (playback.startsWith("data:video") || playback.startsWith("blob:")) {
    return <video controls playsInline className="max-h-[78vh] w-full max-w-5xl object-contain" src={playback} />;
  }

  const yt = extractYoutubeId(playback);
  if (yt) {
    return (
      <iframe
        title="Video"
        className="h-full min-h-[240px] w-full max-w-5xl"
        src={`https://www.youtube-nocookie.com/embed/${yt}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (/\.m3u8|\.mp4(\?|$)|\.webm(\?|$)/i.test(playback) || playback.startsWith("data:video")) {
    return <video controls playsInline className="max-h-[78vh] w-full max-w-5xl object-contain" src={playback} />;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm text-white/85">{openVideoTabLabel}</p>
      <a
        href={playback}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/15"
      >
        {openVideoTabLabel}
      </a>
    </div>
  );
}

export function AgenteIndividualResidencialMediaLightbox({
  open,
  initialIndex,
  onClose,
  photoUrls,
  videoDataUrl,
  videoExternalHref,
  labels,
}: {
  open: boolean;
  initialIndex: number;
  onClose: () => void;
  photoUrls: string[];
  videoDataUrl: string | null;
  videoExternalHref: string | null;
  labels: {
    close: string;
    prev: string;
    next: string;
    galleryCount: (cur: number, total: number) => string;
    video: string;
    zoomHint: string;
    resetZoom: string;
    openVideoTab: string;
  };
}) {
  const slides: Slide[] = useMemo(() => {
    const out: Slide[] = photoUrls.map((url, index) => ({ kind: "photo" as const, index, url }));
    const hasVideo = Boolean((videoDataUrl && videoDataUrl.trim()) || (videoExternalHref && videoExternalHref.trim()));
    if (hasVideo) out.push({ kind: "video" });
    return out;
  }, [photoUrls, videoDataUrl, videoExternalHref]);

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
      aria-label={labels.galleryCount(active + 1, slides.length)}
    >
      <div className="flex h-full max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f0d09] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
          <p className="text-xs font-semibold text-white/80">{labels.galleryCount(active + 1, slides.length)}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/15"
          >
            {labels.close}
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col bg-black">
          <div className="relative flex min-h-[200px] flex-1 items-center justify-center">
            {current?.kind === "photo" ? (
              <ZoomablePhoto url={current.url} zoomHint={labels.zoomHint} resetZoom={labels.resetZoom} />
            ) : current?.kind === "video" ? (
              <div className="h-full w-full max-w-5xl p-2 sm:p-4">
                <VideoSlideContent
                  videoDataUrl={videoDataUrl}
                  videoExternalHref={videoExternalHref}
                  openVideoTabLabel={labels.openVideoTab}
                />
              </div>
            ) : null}

            {slides.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setActive((i) => (i <= 0 ? slides.length - 1 : i - 1))}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 px-3 py-2 text-lg font-bold text-white hover:bg-black/70 sm:left-4"
                  aria-label={labels.prev}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setActive((i) => (i >= slides.length - 1 ? 0 : i + 1))}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 px-3 py-2 text-lg font-bold text-white hover:bg-black/70 sm:right-4"
                  aria-label={labels.next}
                >
                  ›
                </button>
              </>
            ) : null}
          </div>

          {slides.length > 1 ? (
            <div className="flex max-h-[28vh] gap-2 overflow-x-auto border-t border-white/10 bg-black/40 px-2 py-2 sm:px-3">
              {slides.map((s, idx) => (
                <button
                  key={s.kind === "photo" ? `p-${s.index}` : "v"}
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
                      <span className="mt-0.5">{labels.video}</span>
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
