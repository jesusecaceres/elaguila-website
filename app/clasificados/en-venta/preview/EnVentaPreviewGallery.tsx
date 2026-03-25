"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  orderedImages: string[];
  videoUrl: string | null;
  showVideo: boolean;
  lang: "es" | "en";
  plan: "free" | "pro";
};

export function EnVentaPreviewGallery({ orderedImages, videoUrl, showVideo, lang, plan }: Props) {
  const [active, setActive] = useState(0);

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
        <div className="relative aspect-[4/3] w-full bg-gradient-to-b from-[#FAF7F2] to-[#EDE6DC]">
          {current?.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.src} alt="" className="h-full w-full object-cover" />
          ) : current?.type === "video" ? (
            <VideoEmbed url={current.src} lang={lang} />
          ) : null}
        </div>
      </div>

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
    </div>
  );
}

function VideoEmbed({ url, lang }: { url: string; lang: "es" | "en" }) {
  if (url.startsWith("blob:")) {
    return <video src={url} controls className="h-full w-full object-cover" />;
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
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <p className="text-sm font-semibold text-[#3D3428]">{lang === "es" ? "Video" : "Video"}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-[#C9B46A]/50 bg-[#FFFCF7] px-4 py-2 text-sm font-semibold text-[#2A2620] shadow-sm transition hover:bg-white"
      >
        {lang === "es" ? "Abrir enlace" : "Open link"}
      </a>
    </div>
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
