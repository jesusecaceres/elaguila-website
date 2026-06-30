"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiExternalLink, FiVideo } from "react-icons/fi";
import {
  getEmbeddableVideoKind,
  getVideoPlatformLabel,
  normalizeVideoUrl,
  vimeoEmbedSrc,
  extractVimeoId,
  extractYoutubeId,
  youtubeEmbedSrc,
} from "@/app/lib/clasificados/bienes-raices/brPreviewVideoEmbed";

function VideoPlayer({ url, title }: { url: string; title: string }) {
  const playback = normalizeVideoUrl(url);
  if (!playback) {
    return null;
  }

  if (playback.startsWith("data:video") || playback.startsWith("blob:")) {
    return <video controls playsInline className="max-h-[min(72vh,720px)] w-full object-contain" src={playback} title={title} />;
  }

  const yt = extractYoutubeId(playback);
  if (yt) {
    return (
      <iframe
        title={title}
        className="aspect-video w-full max-h-[min(72vh,720px)] min-h-[220px]"
        src={youtubeEmbedSrc(yt)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  const vimeo = extractVimeoId(playback);
  if (vimeo) {
    return (
      <iframe
        title={title}
        className="aspect-video w-full max-h-[min(72vh,720px)] min-h-[220px]"
        src={vimeoEmbedSrc(vimeo)}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (/\.m3u8(\?|$)/i.test(playback) || /\.mp4(\?|$)/i.test(playback) || /\.webm(\?|$)/i.test(playback)) {
    return <video controls playsInline className="max-h-[min(72vh,720px)] w-full object-contain" src={playback} title={title} />;
  }

  return null;
}

function VideoFallbackCard({
  url,
  lang,
  fallbackBody,
  openInNewTabLabel,
}: {
  url: string;
  lang: "es" | "en";
  fallbackBody: string;
  openInNewTabLabel: string;
}) {
  const platform = getVideoPlatformLabel(url, lang);
  return (
    <div
      className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border px-6 py-8 text-center"
      style={{ borderColor: "rgba(201,180,106,0.35)", background: "linear-gradient(180deg, #FFFCF7 0%, #FAF7F2 100%)" }}
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full border"
        style={{ borderColor: "rgba(184,149,74,0.4)", background: "rgba(255,246,231,0.95)", color: "#6E5418" }}
      >
        <FiVideo className="h-7 w-7" aria-hidden />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "#8A6F3A" }}>
          {platform}
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "#5C5346" }}>
          {fallbackBody}
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-[1.03]"
        style={{ background: "linear-gradient(180deg, #6E2B2B 0%, #5A2222 100%)" }}
      >
        {openInNewTabLabel}
        <FiExternalLink className="h-4 w-4 opacity-90" aria-hidden />
      </a>
    </div>
  );
}

export function BrPreviewVideoModal({
  open,
  initialIndex = 0,
  onClose,
  videos,
  lang = "es",
  labels,
}: {
  open: boolean;
  initialIndex?: number;
  onClose: () => void;
  videos: string[];
  lang?: "es" | "en";
  labels: {
    close: string;
    prev: string;
    next: string;
    video: string;
    count: (cur: number, total: number) => string;
    fallbackBody: string;
    openInNewTab: string;
  };
}) {
  const cleaned = useMemo(
    () => videos.map(normalizeVideoUrl).filter(Boolean).slice(0, 4),
    [videos],
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    const max = Math.max(0, cleaned.length - 1);
    setActive(Math.min(Math.max(0, initialIndex), max));
  }, [open, initialIndex, cleaned.length]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (cleaned.length <= 1) return;
      if (e.key === "ArrowLeft") setActive((i) => (i <= 0 ? cleaned.length - 1 : i - 1));
      if (e.key === "ArrowRight") setActive((i) => (i >= cleaned.length - 1 ? 0 : i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, cleaned.length]);

  const currentUrl = cleaned[active] ?? "";
  const embeddable = getEmbeddableVideoKind(currentUrl) !== "none";

  const show = open && cleaned.length > 0;
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={labels.count(active + 1, cleaned.length)}
    >
      <div className="flex h-full max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1a1712] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4">
          <p className="text-xs font-semibold text-white/85">{labels.count(active + 1, cleaned.length)}</p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/15 sm:min-h-0"
          >
            {labels.close}
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="relative flex min-h-[200px] flex-1 items-center justify-center bg-[#0f0d09] p-3 sm:p-5">
            {embeddable ? (
              <VideoPlayer url={currentUrl} title={labels.video} />
            ) : (
              <VideoFallbackCard
                url={currentUrl}
                lang={lang}
                fallbackBody={labels.fallbackBody}
                openInNewTabLabel={labels.openInNewTab}
              />
            )}

            {cleaned.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setActive((i) => (i <= 0 ? cleaned.length - 1 : i - 1))}
                  className="absolute left-2 top-1/2 z-10 min-h-[44px] min-w-[44px] -translate-y-1/2 rounded-full border border-white/15 bg-black/50 px-3 py-2 text-lg font-bold text-white hover:bg-black/70 sm:left-4"
                  aria-label={labels.prev}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setActive((i) => (i >= cleaned.length - 1 ? 0 : i + 1))}
                  className="absolute right-2 top-1/2 z-10 min-h-[44px] min-w-[44px] -translate-y-1/2 rounded-full border border-white/15 bg-black/50 px-3 py-2 text-lg font-bold text-white hover:bg-black/70 sm:right-4"
                  aria-label={labels.next}
                >
                  ›
                </button>
              </>
            ) : null}
          </div>

          {cleaned.length > 1 ? (
            <div className="flex max-h-[28vh] gap-2 overflow-x-auto border-t border-white/10 bg-black/40 px-2 py-2 sm:px-3">
              {cleaned.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setActive(idx)}
                  className={`flex h-16 min-w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-lg border px-2 sm:h-[72px] ${
                    active === idx ? "border-[#C5A059] ring-2 ring-[#C5A059]/40" : "border-white/10 opacity-80 hover:opacity-100"
                  }`}
                >
                  <FiVideo className="h-5 w-5 text-[#F5F0E8]" aria-hidden />
                  <span className="mt-0.5 text-[10px] font-bold text-[#F5F0E8]">
                    {idx === 0 ? labels.video : `${labels.video} ${idx + 1}`}
                  </span>
                  <span className="mt-0.5 max-w-[4rem] truncate text-[9px] text-white/60">{getVideoPlatformLabel(url, lang)}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
