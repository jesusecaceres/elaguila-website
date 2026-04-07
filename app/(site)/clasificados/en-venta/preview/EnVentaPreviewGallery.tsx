"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  orderedImages: string[];
  videoUrl: string | null;
  showVideo: boolean;
  photoCountLabel: string;
  lang: "es" | "en";
  plan: "free" | "pro";
};

export function EnVentaPreviewGallery({ orderedImages, videoUrl, showVideo, photoCountLabel, lang, plan }: Props) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const slides = useMemo(() => {
    const imgs: Array<{ type: "image"; src: string; i: number } | { type: "video"; src: string; i: number }> =
      orderedImages.map((src, i) => ({ type: "image" as const, src, i }));
    if (showVideo && videoUrl) {
      imgs.push({ type: "video" as const, src: videoUrl, i: imgs.length });
    }
    return imgs;
  }, [orderedImages, showVideo, videoUrl]);

  useEffect(() => {
    setActive(0);
  }, [slides.length]);

  const current = slides[Math.min(active, Math.max(0, slides.length - 1))] ?? null;

  const videoLabel = lang === "es" ? "Video" : "Video";
  const openLabel = lang === "es" ? "Abrir medios" : "Open media";
  const closeLabel = lang === "es" ? "Cerrar" : "Close";
  const prevLabel = lang === "es" ? "Anterior" : "Previous";
  const nextLabel = lang === "es" ? "Siguiente" : "Next";

  if (slides.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 shadow-[0_10px_36px_-12px_rgba(42,36,22,0.12)]">
        <div className="flex aspect-[4/3] items-center justify-center px-4 text-center text-sm text-[#5C5346]/75">
          {lang === "es" ? "Sin fotos en el borrador" : "No photos in draft"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7] shadow-[0_14px_44px_-14px_rgba(42,36,22,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]">
        {plan === "pro" ? (
          <span className="absolute right-3 top-3 z-10 rounded-full border border-[#C9B46A]/50 bg-gradient-to-r from-[#FBF7EF] to-[#F3EBDD] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5C4E2E] shadow-sm">
            Pro
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative block w-full text-left"
          aria-label={openLabel}
        >
          <div className="relative aspect-[4/3] w-full bg-gradient-to-b from-[#FAF7F2] to-[#EDE6DC]">
          {current?.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.src} alt="" className="h-full w-full object-cover" />
          ) : current?.type === "video" ? (
            <VideoCover lang={lang} />
          ) : null}
          </div>
          <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-white/10" />
        </button>
      </div>

      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]/90">{photoCountLabel}</p>

      {slides.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {slides.map((s, idx) => (
            <button
              key={`${s.type}-${s.i}-${idx}`}
              type="button"
              onClick={() => setActive(idx)}
              className={`relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-2xl border bg-[#FFFCF7] shadow-sm transition ${
                active === idx
                  ? "border-[#C9A84A] ring-2 ring-[#D4BC6A]/50 ring-offset-2 ring-offset-[#F3EBDD]"
                  : "border-[#E8DFD0]/90 hover:border-[#D4C4A8]"
              }`}
            >
              {s.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.src} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-[#2A2620] text-[10px] font-bold uppercase tracking-wide text-[#FAF7F2]">
                  <span aria-hidden>▶</span>
                  {videoLabel}
                </div>
              )}
            </button>
          ))}
        </div>
      ) : null}

      {open ? (
        <Lightbox
          lang={lang}
          slides={slides}
          active={active}
          onClose={() => setOpen(false)}
          onPrev={() => setActive((i) => (i <= 0 ? slides.length - 1 : i - 1))}
          onNext={() => setActive((i) => (i >= slides.length - 1 ? 0 : i + 1))}
          closeLabel={closeLabel}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
        />
      ) : null}
    </div>
  );
}

function VideoCover({ lang }: { lang: "es" | "en" }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#2A2620] to-[#15110B] p-6 text-center">
      <span className="text-3xl" aria-hidden>
        🎥
      </span>
      <p className="text-sm font-semibold text-[#FAF7F2]">{lang === "es" ? "Video" : "Video"}</p>
      <p className="text-xs text-[#FAF7F2]/70">{lang === "es" ? "Toca para ver" : "Tap to view"}</p>
    </div>
  );
}

function Lightbox({
  lang,
  slides,
  active,
  onClose,
  onPrev,
  onNext,
  closeLabel,
  prevLabel,
  nextLabel,
}: {
  lang: "es" | "en";
  slides: Array<{ type: "image" | "video"; src: string; i: number }>;
  active: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const current = slides[Math.min(active, Math.max(0, slides.length - 1))] ?? null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f0d09] shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2">
          <div className="text-xs font-semibold text-white/75">
            {lang === "es" ? "Vista de medios" : "Media viewer"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/15"
            aria-label={closeLabel}
          >
            {closeLabel}
          </button>
        </div>

        <div className="relative aspect-[16/10] w-full bg-black">
          {current?.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.src} alt="" className="h-full w-full object-contain" />
          ) : current?.type === "video" ? (
            <VideoPlayer url={current.src} lang={lang} />
          ) : null}

          {slides.length > 1 ? (
            <>
              <button
                type="button"
                onClick={onPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15"
                aria-label={prevLabel}
              >
                ←
              </button>
              <button
                type="button"
                onClick={onNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15"
                aria-label={nextLabel}
              >
                →
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function VideoPlayer({ url, lang }: { url: string; lang: "es" | "en" }) {
  if (url.startsWith("blob:")) {
    return <video src={url} controls className="h-full w-full object-contain" />;
  }
  const yt = extractYoutubeId(url);
  if (yt) {
    return (
      <iframe
        title={lang === "es" ? "Video del anuncio" : "Listing video"}
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${yt}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return <StreamableVideo url={url} lang={lang} />;
}

/**
 * Mux direct-upload uses HLS (.m3u8). Safari plays HLS natively; Chrome/Firefox need hls.js.
 */
function StreamableVideo({ url, lang }: { url: string; lang: "es" | "en" }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isHls = /\.m3u8(\?|$)/i.test(url);

    if (!isHls) {
      el.src = url;
      return () => {
        el.pause();
        el.removeAttribute("src");
      };
    }

    let cancelled = false;
    let hls: { destroy: () => void } | null = null;

    if (el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = url;
      return () => {
        el.pause();
        el.removeAttribute("src");
      };
    }

    void import("hls.js").then(({ default: HlsCtor }) => {
      if (cancelled || !ref.current) return;
      if (HlsCtor.isSupported()) {
        const instance = new HlsCtor({ enableWorker: true });
        hls = instance;
        instance.loadSource(url);
        instance.attachMedia(ref.current!);
      } else {
        ref.current!.src = url;
      }
    });

    return () => {
      cancelled = true;
      hls?.destroy();
      const v = ref.current;
      if (v) {
        v.pause();
        v.removeAttribute("src");
      }
    };
  }, [url]);

  return (
    <video
      ref={ref}
      controls
      playsInline
      className="h-full w-full object-contain"
      aria-label={lang === "es" ? "Video del anuncio" : "Listing video"}
    />
  );
}

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/\/embed\/([^/]+)/);
      if (m) return m[1];
    }
  } catch {
    return null;
  }
  return null;
}
