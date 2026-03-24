"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  orderedImages: string[];
  videoUrl: string | null;
  showVideo: boolean;
  lang: "es" | "en";
};

export function EnVentaPreviewGallery({ orderedImages, videoUrl, showVideo, lang }: Props) {
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
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#F0F0F0]">
        <div className="flex aspect-[4/3] items-center justify-center text-sm text-[#111111]/45">
          {lang === "es" ? "Sin fotos en el borrador" : "No photos in draft"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="relative aspect-[4/3] w-full bg-black/5">
          {current?.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.src} alt="" className="h-full w-full object-contain" />
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
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white ${
                active === idx ? "border-[#2563EB] ring-2 ring-[#2563EB]/25" : "border-black/10"
              }`}
            >
              {s.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.src} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#111111] text-[10px] font-semibold text-white">
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
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
      <p className="text-sm font-medium text-[#111111]/70">{lang === "es" ? "Video" : "Video"}</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#2563EB] underline">
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
