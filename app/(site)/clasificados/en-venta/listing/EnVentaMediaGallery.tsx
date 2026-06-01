"use client";

import { useCallback, useMemo, useState } from "react";
import { EnVentaVideoPlayer } from "@/app/clasificados/en-venta/shared/components/EnVentaVideoPlayer";
import { isEmbeddableExternalVideoUrl } from "@/app/clasificados/en-venta/shared/utils/enVentaVideoEmbed";
import { EN_VENTA_SURFACE } from "@/app/clasificados/en-venta/shared/styles/enVentaBrand";

type Slide = { type: "image"; src: string } | { type: "video"; src: string };

type Props = {
  urls: string[];
  title: string;
  videoUrl?: string | null;
  lang?: "es" | "en";
};

export function EnVentaMediaGallery({ urls, title, videoUrl = null, lang = "es" }: Props) {
  const [idx, setIdx] = useState(0);

  const slides = useMemo((): Slide[] => {
    const imgs: Slide[] = urls.filter(Boolean).map((src) => ({ type: "image", src }));
    const v = videoUrl?.trim();
    if (v && isEmbeddableExternalVideoUrl(v)) {
      imgs.push({ type: "video", src: v });
    }
    return imgs;
  }, [urls, videoUrl]);

  const safe = slides.length ? slides : [];
  const current = safe[idx] ?? null;

  const go = useCallback(
    (d: number) => {
      if (!safe.length) return;
      setIdx((i) => (i + d + safe.length) % safe.length);
    },
    [safe.length]
  );

  if (!safe.length) {
    return (
      <div className={`flex aspect-[4/3] items-center justify-center ${EN_VENTA_SURFACE.contentCardInner} text-[#3D3428]/50`}>
        📷
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-[#D6C7AD]/70 bg-[#FBF7EF]/50 shadow-[0_10px_36px_-12px_rgba(31,36,28,0.12)]"
        onTouchStart={(e) => {
          (e.currentTarget as HTMLDivElement).dataset.x0 = String(e.touches[0]?.clientX ?? 0);
        }}
        onTouchEnd={(e) => {
          const x0 = Number((e.currentTarget as HTMLDivElement).dataset.x0 || 0);
          const x1 = e.changedTouches[0]?.clientX ?? 0;
          const dx = x1 - x0;
          if (dx > 50) go(-1);
          else if (dx < -50) go(1);
        }}
      >
        {current?.type === "video" ? (
          <EnVentaVideoPlayer url={current.src} lang={lang} />
        ) : current?.type === "image" ? (
          <img src={current.src} alt={title} className="h-full w-full bg-black/5 object-cover" />
        ) : null}
        {safe.length > 1 ? (
          <>
            <button
              type="button"
              aria-label={lang === "es" ? "Anterior" : "Previous"}
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-[#E8DFD0]/80 bg-white/95 px-2.5 py-1.5 text-sm shadow"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label={lang === "es" ? "Siguiente" : "Next"}
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[#E8DFD0]/80 bg-white/95 px-2.5 py-1.5 text-sm shadow"
            >
              ›
            </button>
          </>
        ) : null}
      </div>
      {safe.length > 1 ? (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {safe.map((s, i) => (
            <button
              key={`${s.type}-${i}-${s.src.slice(0, 24)}`}
              type="button"
              onClick={() => setIdx(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border ${
                i === idx ? "border-[#C9A84A] ring-1 ring-[#D4BC6A]/45" : "border-[#E8DFD0]/90"
              }`}
            >
              {s.type === "image" ? (
                <img src={s.src} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-[#2A2620] text-[9px] font-bold uppercase text-[#FAF7F2]">
                  ▶
                </div>
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
