"use client";

import { useCallback, useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPlay, FiX } from "react-icons/fi";
import { previewPrivadoCopy, type PreviewPrivadoLang } from "./previewPrivadoCopy";
import { previewPrivadoCardClass, previewPrivadoSectionEyebrowClass } from "./previewPrivadoTokens";

function isLocalPreviewSrc(src: string): boolean {
  return src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("idb:");
}

function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|m3u8)(\?|$)/i.test(url);
}

function PreviewMedia({
  src,
  alt,
  className,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  if (isLocalPreviewSrc(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} fetchPriority={priority ? "high" : undefined} />
  );
}

export function PreviewPrivadoGallery({
  photos,
  videoUrls,
  hasVideo,
  title,
  lang,
}: {
  photos: string[];
  videoUrls: string[];
  hasVideo: boolean;
  title: string;
  lang: PreviewPrivadoLang;
}) {
  const copy = previewPrivadoCopy(lang);
  const [index, setIndex] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);
  const safeIndex = photos.length === 0 ? 0 : Math.min(index, photos.length - 1);
  const main = photos[safeIndex];
  const showCounter = photos.length > 1;
  const videoUrl = videoUrls[0];

  useEffect(() => {
    setIndex(0);
  }, [photos.join("|")]);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (photos.length < 2) return;
      setIndex((i) => (i + dir + photos.length) % photos.length);
    },
    [photos.length],
  );

  if (!main && !hasVideo) return null;

  return (
    <section className={`${previewPrivadoCardClass} min-w-0 overflow-hidden p-3 sm:p-4`}>
      <p className={`${previewPrivadoSectionEyebrowClass} mb-3`}>{copy.gallery}</p>
      <div className="relative aspect-[16/10] max-h-[min(520px,48vh)] w-full overflow-hidden rounded-[16px] bg-[#F3EEE4]">
        {main ? (
          <PreviewMedia
            src={main}
            alt={title || copy.gallery}
            className="h-full w-full object-cover"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[#5C5346]">
            {copy.watchVideo}
          </div>
        )}
        {showCounter ? (
          <p className="pointer-events-none absolute right-3 top-3 rounded-full bg-[#1F241C]/80 px-3 py-1 text-xs font-bold text-[#FFFCF7]">
            {safeIndex + 1} / {photos.length}
          </p>
        ) : null}
        {showCounter ? (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#FFFDF7]/95 text-[#1F241C] shadow"
              onClick={() => go(-1)}
              aria-label={copy.prev}
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#FFFDF7]/95 text-[#1F241C] shadow"
              onClick={() => go(1)}
              aria-label={copy.next}
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {photos.length > 1 || hasVideo ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {photos.slice(0, 8).map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-[10px] border ${
                i === safeIndex ? "border-[#C9A84A] ring-1 ring-[#C9A84A]/40" : "border-[#D6C7AD]/80"
              }`}
              aria-label={`${copy.gallery} ${i + 1}`}
            >
              <PreviewMedia src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          {hasVideo ? (
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              className="relative flex h-16 w-24 shrink-0 flex-col items-center justify-center overflow-hidden rounded-[10px] border border-[#D6C7AD]/80 bg-[#1F241C] text-[#FFFCF7]"
            >
              <FiPlay className="h-5 w-5" />
              <span className="mt-1 text-[10px] font-bold">{copy.watchVideo}</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {videoOpen && hasVideo ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0"
            aria-label={copy.close}
            onClick={() => setVideoOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-[16px] bg-[#FFFDF7] p-4">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#D6C7AD] bg-[#FFFDF7]"
                onClick={() => setVideoOpen(false)}
                aria-label={copy.close}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            {videoUrl && isDirectVideoFile(videoUrl) ? (
              <video src={videoUrl} controls className="max-h-[60vh] w-full rounded-[12px] bg-black" />
            ) : (
              <p className="text-sm leading-relaxed text-[#5C5346]">{copy.videoPreviewNote}</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
