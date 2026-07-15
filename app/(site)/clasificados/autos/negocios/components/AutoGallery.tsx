"use client";

import { FiPlay, FiX } from "react-icons/fi";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { getAutosNegociosCopy, type AutosNegociosCopy } from "../lib/autosNegociosCopy";
import { deriveHeroImageUrls } from "../lib/autoDealerHeroImages";
import {
  hasListingVideo,
  hasPublishedAutosListingVideo,
  resolvePublishedAutosVideoPlayback,
  type PublishedAutosVideoMode,
} from "../lib/autoDealerVideo";
import {
  buildAutosGalleryLightboxItems,
  firstAutosGalleryVideoIndex,
  type AutosGalleryLightboxItem,
} from "@/app/lib/clasificados/autos/autosGalleryLightbox";
import { MediaImage } from "./MediaImage";
import { normalizeAutosNegociosLang } from "../lib/autosNegociosLang";
import {
  AUTOS_PREVIEW_SECTION_IDS,
  autosPreviewMediaTabClass,
  autosPreviewPremiumCardClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

const CARD = `${autosPreviewPremiumCardClass} min-w-0 overflow-x-hidden p-3 sm:p-4`;

export function AutoGallery({
  data,
  publicPlaybackOnly = false,
}: {
  data: AutoDealerListing;
  /** Live/public detail: only durable URLs — no blob, data:, or videoFileDataUrl. */
  publicPlaybackOnly?: boolean;
}) {
  const sp = useSearchParams();
  const lang = normalizeAutosNegociosLang(sp?.get("lang"));
  const t = getAutosNegociosCopy(lang);
  const g = t.preview.gallery;

  const images = deriveHeroImageUrls(data);
  const mediaItems = useMemo(
    () => buildAutosGalleryLightboxItems(data, images, { publicPlaybackOnly }),
    [data, images, publicPlaybackOnly],
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const videoLightboxIndex = useMemo(() => firstAutosGalleryVideoIndex(mediaItems), [mediaItems]);

  useEffect(() => {
    if (lightboxIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i == null ? i : Math.min(mediaItems.length - 1, i + 1)));
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((i) => (i == null ? i : Math.max(0, i - 1)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, mediaItems.length]);

  const openAt = useCallback(
    (idx: number) => {
      if (!mediaItems[idx]) return;
      setLightboxIndex(idx);
    },
    [mediaItems],
  );

  const openVideoLightbox = useCallback(() => {
    if (videoLightboxIndex < 0) return;
    setLightboxIndex(videoLightboxIndex);
  }, [videoLightboxIndex]);

  const publishedPb = resolvePublishedAutosVideoPlayback(data);
  const hasVideo = publicPlaybackOnly ? hasPublishedAutosListingVideo(data) : hasListingVideo(data);

  const main = images[0];
  const extra = Math.max(0, images.length - 1);
  const subImages = images.slice(1, 4);
  const altBase = data.vehicleTitle?.trim() || g.vehicleFallback;

  if (!main && !hasVideo) return null;

  const bottomCells: Array<{ kind: "img"; src: string; galleryIndex: number } | { kind: "video" }> = [];
  let galleryIdx = 1;
  for (const src of subImages) {
    bottomCells.push({ kind: "img", src, galleryIndex: galleryIdx++ });
  }
  if (hasVideo) bottomCells.push({ kind: "video" });

  const moreLabel = extra > 0 ? g.morePhotos(extra) : "";
  const activeItem = lightboxIndex != null ? mediaItems[lightboxIndex] : null;

  return (
    <div id={AUTOS_PREVIEW_SECTION_IDS.gallery} className={`${CARD} scroll-mt-28`}>
      <div className="mb-3 flex flex-wrap gap-2">
        {main ? (
          <button type="button" className={autosPreviewMediaTabClass} onClick={() => openAt(0)}>
            {lang === "es" ? "Fotos" : "Photos"}
            {images.length > 1 ? ` (${images.length})` : ""}
          </button>
        ) : null}
        {hasVideo ? (
          <button type="button" className={autosPreviewMediaTabClass} onClick={openVideoLightbox}>
            {lang === "es" ? "Video" : "Video"}
          </button>
        ) : null}
        {extra > 0 ? (
          <button type="button" className={autosPreviewMediaTabClass} onClick={() => openAt(1)}>
            {lang === "es" ? `Ver todas (${images.length})` : `View all (${images.length})`}
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
        {main ? (
          <div className="relative min-w-0 flex-1 aspect-[16/9] max-h-[min(520px,48vh)] overflow-hidden rounded-[16px] sm:aspect-[16/10] lg:max-h-[min(580px,52vh)]">
            <button
              type="button"
              className="relative block h-full w-full cursor-zoom-in text-left"
              onClick={() => openAt(0)}
              aria-label={lang === "es" ? "Abrir galería de fotos" : "Open photo gallery"}
            >
              <MediaImage
                src={main}
                alt={altBase}
                fill
                className="object-cover"
                sizes="(min-width: 1280px) 1200px, 100vw"
                priority
              />
            </button>
            {extra > 0 ? (
              <button
                type="button"
                className="absolute right-3 top-3 rounded-full border border-white/30 bg-[color:var(--lx-text)]/85 px-3 py-1 text-xs font-bold tracking-tight text-[#FFFCF7] shadow-md backdrop-blur-sm pointer-events-auto cursor-pointer"
                aria-label={moreLabel}
                onClick={() => openAt(1)}
              >
                +{moreLabel}
              </button>
            ) : null}
          </div>
        ) : null}

        {bottomCells.length > 0 ? (
          <div
            className={`flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-0 lg:[&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:hidden ${
              bottomCells.length >= 3 ? "lg:w-[min(240px,32%)] lg:shrink-0" : "lg:w-[min(200px,28%)] lg:shrink-0"
            }`}
          >
            {bottomCells.map((cell, i) =>
              cell.kind === "img" ? (
                <Thumb
                  key={`${cell.src}-${i}`}
                  src={cell.src}
                  alt={`${altBase}${g.viewAlt(i)}`}
                  onOpen={() => openAt(cell.galleryIndex)}
                  stacked
                  showMoreOverlay={i === bottomCells.length - 1 && extra > 3}
                  moreLabel={i === bottomCells.length - 1 && extra > 3 ? g.morePhotos(extra - 3) : undefined}
                />
              ) : publicPlaybackOnly ? (
                <div key="video-pub" data-autos-gallery-video>
                  <PublishedVideoTile
                    mode={publishedPb.mode}
                    posterSrc={publishedPb.posterUrl ?? main}
                    g={g}
                    onOpen={openVideoLightbox}
                  />
                </div>
              ) : (
                <div key="video" data-autos-gallery-video>
                  <VideoTile posterSrc={main} g={g} onOpen={openVideoLightbox} />
                </div>
              ),
            )}
          </div>
        ) : null}
      </div>

      {lightboxIndex != null && activeItem ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lang === "es" ? "Galería de medios" : "Media gallery"}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label={lang === "es" ? "Cerrar galería" : "Close gallery"}
            onClick={() => setLightboxIndex(null)}
          />
          <div className="relative z-10 flex w-full max-w-5xl flex-col items-stretch gap-3">
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#FFFCF7]/95 text-[color:var(--lx-text)] shadow-lg"
                onClick={() => setLightboxIndex(null)}
                aria-label={lang === "es" ? "Cerrar" : "Close"}
              >
                <FiX className="h-6 w-6" aria-hidden />
              </button>
            </div>
            <GalleryLightboxSlide item={activeItem} altBase={altBase} lang={lang} g={g} />
            {mediaItems.length > 1 ? (
              <p className="text-center text-xs font-semibold text-[#FFFCF7]/90">
                <GalleryLightboxCounter item={activeItem} index={lightboxIndex} total={mediaItems.length} lang={lang} g={g} />
              </p>
            ) : null}
            {mediaItems.length > 1 ? (
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  className="rounded-full border border-white/30 bg-[#FFFCF7]/15 px-4 py-2 text-sm font-bold text-[#FFFCF7] disabled:opacity-40"
                  disabled={lightboxIndex <= 0}
                  onClick={() => setLightboxIndex((i) => (i == null ? i : Math.max(0, i - 1)))}
                >
                  {lang === "es" ? "Anterior" : "Previous"}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/30 bg-[#FFFCF7]/15 px-4 py-2 text-sm font-bold text-[#FFFCF7] disabled:opacity-40"
                  disabled={lightboxIndex >= mediaItems.length - 1}
                  onClick={() => setLightboxIndex((i) => (i == null ? i : Math.min(mediaItems.length - 1, i + 1)))}
                >
                  {lang === "es" ? "Siguiente" : "Next"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GalleryLightboxCounter({
  item,
  index,
  total,
  lang,
  g,
}: {
  item: AutosGalleryLightboxItem;
  index: number;
  total: number;
  lang: "es" | "en";
  g: AutosNegociosCopy["preview"]["gallery"];
}) {
  if (item.kind === "photo") {
    return (
      <>
        {lang === "es" ? "Foto" : "Photo"} {index + 1} / {total}
      </>
    );
  }
  return (
    <>
      {g.videoBadge} · {index + 1} / {total}
    </>
  );
}

function GalleryLightboxSlide({
  item,
  altBase,
  lang,
  g,
}: {
  item: AutosGalleryLightboxItem;
  altBase: string;
  lang: "es" | "en";
  g: AutosNegociosCopy["preview"]["gallery"];
}) {
  if (item.kind === "photo") {
    return (
      <div className="relative h-[min(70vh,640px)] w-full overflow-hidden rounded-2xl bg-black/40">
        <MediaImage src={item.src} alt={altBase} fill className="object-contain" sizes="100vw" />
      </div>
    );
  }

  if (item.kind === "youtube") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          src={item.embedUrl}
          title={g.videoBadge}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  if (item.kind === "stream") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <StreamableAutosVideo url={item.streamUrl} posterUrl={item.posterUrl} lang={lang} g={g} fillContainer />
      </div>
    );
  }

  return (
    <div className="flex min-h-[min(50vh,420px)] w-full flex-col items-center justify-center gap-4 rounded-2xl bg-black/40 px-6 py-10 text-center">
      <p className="max-w-md text-sm leading-relaxed text-[#FFFCF7]/90">
        {lang === "es"
          ? "Este video se reproduce en su plataforma original. Puedes abrirlo en una pestaña nueva."
          : "This video plays on its original platform. You can open it in a new tab."}
      </p>
      <a
        href={item.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/30 bg-[#FFFCF7]/15 px-5 text-sm font-bold text-[#FFFCF7] underline-offset-2 hover:underline"
      >
        {lang === "es" ? "Abrir en sitio externo" : "Open on external site"}
      </a>
    </div>
  );
}

/** Safari plays HLS natively; Chrome/Firefox use hls.js (same pattern as En Venta preview). */
function StreamableAutosVideo({
  url,
  posterUrl,
  lang,
  g,
  fillContainer = false,
}: {
  url: string;
  posterUrl?: string;
  lang: "es" | "en";
  g: AutosNegociosCopy["preview"]["gallery"];
  fillContainer?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isHls = /\.m3u8(\?|$)/i.test(url);

    if (!isHls) {
      el.src = url;
      if (posterUrl) el.poster = posterUrl;
      return () => {
        el.pause();
        el.removeAttribute("src");
        el.removeAttribute("poster");
      };
    }

    let cancelled = false;
    let hls: { destroy: () => void } | null = null;

    if (el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = url;
      if (posterUrl) el.poster = posterUrl;
      return () => {
        el.pause();
        el.removeAttribute("src");
        el.removeAttribute("poster");
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
      if (posterUrl && ref.current) ref.current.poster = posterUrl;
    });

    return () => {
      cancelled = true;
      hls?.destroy();
      const v = ref.current;
      if (v) {
        v.pause();
        v.removeAttribute("src");
        v.removeAttribute("poster");
      }
    };
  }, [url, posterUrl]);

  return (
    <div className={fillContainer ? "relative h-full w-full" : "relative aspect-[4/3] overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] md:aspect-auto md:min-h-[140px]"}>
      <video
        ref={ref}
        controls
        playsInline
        className="h-full w-full object-contain"
        aria-label={lang === "es" ? "Video del vehículo" : "Vehicle video"}
      />
      {!fillContainer ? (
        <span className="absolute bottom-2 left-2 rounded-md bg-[#FFFCF7]/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text)]">
          {g.videoBadge}
        </span>
      ) : null}
    </div>
  );
}

function PublishedVideoTile({
  mode,
  posterSrc,
  g,
  onOpen,
}: {
  mode: PublishedAutosVideoMode;
  posterSrc?: string;
  g: AutosNegociosCopy["preview"]["gallery"];
  onOpen: () => void;
}) {
  if (mode === "none") return null;

  return (
    <VideoWalkaroundThumb posterSrc={posterSrc} g={g} onOpen={onOpen} />
  );
}

function VideoTile({
  posterSrc,
  g,
  onOpen,
}: {
  posterSrc: string | undefined;
  g: AutosNegociosCopy["preview"]["gallery"];
  onOpen: () => void;
}) {
  return <VideoWalkaroundThumb posterSrc={posterSrc} g={g} onOpen={onOpen} />;
}

function VideoWalkaroundThumb({
  posterSrc,
  g,
  onOpen,
}: {
  posterSrc?: string;
  g: AutosNegociosCopy["preview"]["gallery"];
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-left md:aspect-auto md:min-h-[140px]"
      aria-label={g.videoAria}
    >
      {posterSrc ? (
        <MediaImage
          src={posterSrc}
          alt=""
          fill
          className="object-cover opacity-90 transition group-hover:opacity-100"
          sizes="(min-width: 768px) 25vw, 50vw"
        />
      ) : (
        <span className="absolute inset-0 bg-gradient-to-br from-[color:var(--lx-section)] to-[color:var(--lx-nav-hover)]" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-[color:var(--lx-text)]/55 to-transparent" />
      <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-[#FFFCF7]/95 text-[color:var(--lx-text)] shadow-lg backdrop-blur-sm transition group-hover:scale-[1.03]">
        <FiPlay className="ml-0.5 h-7 w-7" aria-hidden />
      </span>
      <span className="absolute bottom-2 left-2 z-10 rounded-md bg-[#FFFCF7]/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text)]">
        {g.videoBadge}
      </span>
    </button>
  );
}

function Thumb({
  src,
  alt,
  onOpen,
  stacked = false,
  showMoreOverlay = false,
  moreLabel,
}: {
  src: string;
  alt: string;
  onOpen: () => void;
  stacked?: boolean;
  showMoreOverlay?: boolean;
  moreLabel?: string;
}) {
  return (
    <button
      type="button"
      className={`relative w-full shrink-0 cursor-zoom-in overflow-hidden rounded-[14px] border border-[#D6C7AD]/70 text-left ${
        stacked
          ? "aspect-[4/3] w-[42vw] max-w-[160px] snap-start lg:aspect-auto lg:min-h-[120px] lg:w-full lg:max-w-none"
          : "aspect-[4/3] md:aspect-auto md:min-h-[140px]"
      }`}
      onClick={onOpen}
      aria-label={alt}
    >
      <MediaImage src={src} alt={alt} fill className="object-cover" sizes="(min-width: 1024px) 240px, 42vw" />
      {showMoreOverlay && moreLabel ? (
        <span className="absolute inset-0 flex items-center justify-center bg-[#1F241C]/55 text-xs font-bold uppercase tracking-wide text-[#FFFCF7]">
          +{moreLabel}
        </span>
      ) : null}
    </button>
  );
}
