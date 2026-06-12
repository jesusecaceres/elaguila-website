"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EnVentaVideoPlayer } from "@/app/clasificados/en-venta/shared/components/EnVentaVideoPlayer";
import {
  EnVentaMediaTabToggle,
  resolveEnVentaDefaultMediaTab,
  type EnVentaMediaTab,
} from "@/app/clasificados/en-venta/shared/components/EnVentaMediaTabToggle";
import {
  EnVentaVideoUrlPicker,
  normalizeEnVentaGalleryVideoUrls,
} from "@/app/clasificados/en-venta/shared/components/EnVentaVideoUrlPicker";
import { EN_VENTA_SURFACE } from "@/app/clasificados/en-venta/shared/styles/enVentaBrand";

type Props = {
  urls: string[];
  title: string;
  videoUrl?: string | null;
  videoUrls?: string[];
  lang?: "es" | "en";
};

export function EnVentaMediaGallery({ urls, title, videoUrl = null, videoUrls, lang = "es" }: Props) {
  const photoUrls = useMemo(() => urls.filter(Boolean), [urls]);
  const allVideoUrls = useMemo(
    () => normalizeEnVentaGalleryVideoUrls(videoUrls, videoUrl),
    [videoUrls, videoUrl]
  );
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const embedVideoUrl = useMemo(() => {
    if (!allVideoUrls.length) return null;
    const idx = Math.min(activeVideoIdx, allVideoUrls.length - 1);
    return allVideoUrls[idx];
  }, [allVideoUrls, activeVideoIdx]);

  const hasPhotos = photoUrls.length > 0;
  const hasVideos = allVideoUrls.length > 0;

  const [activeTab, setActiveTab] = useState<EnVentaMediaTab>(() =>
    resolveEnVentaDefaultMediaTab(hasPhotos, hasVideos)
  );
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    setActiveTab(resolveEnVentaDefaultMediaTab(hasPhotos, hasVideos));
    setPhotoIdx(0);
  }, [hasPhotos, hasVideos, photoUrls.length, allVideoUrls.length]);

  useEffect(() => {
    if (activeVideoIdx >= allVideoUrls.length) setActiveVideoIdx(0);
  }, [activeVideoIdx, allVideoUrls.length]);

  const goPhoto = useCallback(
    (d: number) => {
      if (!photoUrls.length) return;
      setPhotoIdx((i) => (i + d + photoUrls.length) % photoUrls.length);
    },
    [photoUrls.length]
  );

  if (!hasPhotos && !hasVideos) {
    return (
      <div className={`flex aspect-[4/3] items-center justify-center ${EN_VENTA_SURFACE.contentCardInner} text-[#3D3428]/50`}>
        📷
      </div>
    );
  }

  const currentPhoto = photoUrls[Math.min(photoIdx, Math.max(0, photoUrls.length - 1))] ?? null;
  const showToggle = hasPhotos && hasVideos;

  return (
    <div className="space-y-3">
      {showToggle ? (
        <EnVentaMediaTabToggle lang={lang} activeTab={activeTab} onTabChange={setActiveTab} />
      ) : null}

      {activeTab === "photos" && hasPhotos ? (
        <>
          <div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-[#D6C7AD]/70 bg-[#FBF7EF]/50 shadow-[0_10px_36px_-12px_rgba(31,36,28,0.12)]"
            onTouchStart={(e) => {
              (e.currentTarget as HTMLDivElement).dataset.x0 = String(e.touches[0]?.clientX ?? 0);
            }}
            onTouchEnd={(e) => {
              const x0 = Number((e.currentTarget as HTMLDivElement).dataset.x0 || 0);
              const x1 = e.changedTouches[0]?.clientX ?? 0;
              const dx = x1 - x0;
              if (dx > 50) goPhoto(-1);
              else if (dx < -50) goPhoto(1);
            }}
          >
            {currentPhoto ? (
              <img src={currentPhoto} alt={title} className="h-full w-full bg-black/5 object-cover" />
            ) : null}
            {photoUrls.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label={lang === "es" ? "Anterior" : "Previous"}
                  onClick={() => goPhoto(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-[#E8DFD0]/80 bg-white/95 px-2.5 py-1.5 text-sm shadow"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label={lang === "es" ? "Siguiente" : "Next"}
                  onClick={() => goPhoto(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[#E8DFD0]/80 bg-white/95 px-2.5 py-1.5 text-sm shadow"
                >
                  ›
                </button>
              </>
            ) : null}
          </div>
          {photoUrls.length > 1 ? (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {photoUrls.map((src, i) => (
                <button
                  key={`photo-${i}-${src.slice(0, 24)}`}
                  type="button"
                  onClick={() => setPhotoIdx(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border ${
                    i === photoIdx ? "border-[#C9A84A] ring-1 ring-[#D4BC6A]/45" : "border-[#E8DFD0]/90"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : activeTab === "videos" && embedVideoUrl ? (
        <div className="space-y-3">
          <EnVentaVideoUrlPicker
            lang={lang}
            videoUrls={allVideoUrls}
            activeIndex={Math.min(activeVideoIdx, allVideoUrls.length - 1)}
            onSelect={setActiveVideoIdx}
          />
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-[#D6C7AD]/70 bg-black shadow-[0_10px_36px_-12px_rgba(31,36,28,0.12)]">
            <EnVentaVideoPlayer url={embedVideoUrl} lang={lang} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
