"use client";

import { FiPlay, FiX } from "react-icons/fi";
import { useCallback, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { getAutosNegociosCopy, type AutosNegociosCopy } from "../lib/autosNegociosCopy";
import { deriveHeroImageUrls } from "../lib/autoDealerHeroImages";
import {
  getListingVideoExternalHref,
  getListingVideoSrcForElement,
  hasListingVideo,
  hasPublishedAutosListingVideo,
  resolvePublishedAutosVideoPlayback,
  type PublishedAutosVideoMode,
} from "../lib/autoDealerVideo";
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
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (lightbox == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i == null ? i : Math.min(images.length - 1, i + 1)));
      if (e.key === "ArrowLeft") setLightbox((i) => (i == null ? i : Math.max(0, i - 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, images.length]);

  const openAt = useCallback((idx: number) => {
    if (!images[idx]) return;
    setLightbox(idx);
  }, [images]);

  const publishedPb = resolvePublishedAutosVideoPlayback(data);
  const hasVideo = publicPlaybackOnly ? hasPublishedAutosListingVideo(data) : hasListingVideo(data);
  const videoSrc = publicPlaybackOnly ? undefined : getListingVideoSrcForElement(data);
  const videoHref = publicPlaybackOnly ? undefined : getListingVideoExternalHref(data);

  const scrollToVideo = useCallback(() => {
    const el = document.querySelector("[data-autos-gallery-video]");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    if (videoHref) window.open(videoHref, "_blank", "noopener,noreferrer");
  }, [videoHref]);
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
          <button type="button" className={autosPreviewMediaTabClass} onClick={scrollToVideo}>
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
                  streamUrl={publishedPb.streamUrl}
                  externalHref={publishedPb.externalHref}
                  posterSrc={publishedPb.posterUrl ?? main}
                  g={g}
                  lang={lang}
                />
                </div>
              ) : (
                <div key="video" data-autos-gallery-video>
                  <VideoTile videoSrc={videoSrc} videoHref={videoHref} posterSrc={main} g={g} />
                </div>
              ),
            )}
          </div>
        ) : null}
      </div>
      {lightbox != null && images[lightbox] ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lang === "es" ? "Galería de fotos" : "Photo gallery"}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label={lang === "es" ? "Cerrar galería" : "Close gallery"}
            onClick={() => setLightbox(null)}
          />
          <div className="relative z-10 flex w-full max-w-5xl flex-col items-stretch gap-3">
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#FFFCF7]/95 text-[color:var(--lx-text)] shadow-lg"
                onClick={() => setLightbox(null)}
                aria-label={lang === "es" ? "Cerrar" : "Close"}
              >
                <FiX className="h-6 w-6" aria-hidden />
              </button>
            </div>
            <div className="relative h-[min(70vh,640px)] w-full overflow-hidden rounded-2xl bg-black/40">
              <MediaImage
                src={images[lightbox]!}
                alt={`${altBase} — ${lightbox + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
            {images.length > 1 ? (
              <p className="text-center text-xs font-semibold text-[#FFFCF7]/90">
                {lightbox + 1} / {images.length}
              </p>
            ) : null}
            {images.length > 1 ? (
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  className="rounded-full border border-white/30 bg-[#FFFCF7]/15 px-4 py-2 text-sm font-bold text-[#FFFCF7]"
                  onClick={() => setLightbox((i) => (i == null ? i : Math.max(0, i - 1)))}
                >
                  {lang === "es" ? "Anterior" : "Previous"}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/30 bg-[#FFFCF7]/15 px-4 py-2 text-sm font-bold text-[#FFFCF7]"
                  onClick={() => setLightbox((i) => (i == null ? i : Math.min(images.length - 1, i + 1)))}
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

/** Safari plays HLS natively; Chrome/Firefox use hls.js (same pattern as En Venta preview). */
function StreamableAutosVideo({ url, posterUrl, lang, g }: { url: string; posterUrl?: string; lang: "es" | "en"; g: AutosNegociosCopy["preview"]["gallery"] }) {
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
    <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] md:aspect-auto md:min-h-[140px]">
      <video
        ref={ref}
        controls
        playsInline
        className="h-full w-full object-cover"
        aria-label={lang === "es" ? "Video del vehículo" : "Vehicle video"}
      />
      <span className="absolute bottom-2 left-2 rounded-md bg-[#FFFCF7]/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text)]">
        {g.videoBadge}
      </span>
    </div>
  );
}

function PublishedVideoTile({
  mode,
  streamUrl,
  externalHref,
  posterSrc,
  g,
  lang,
}: {
  mode: PublishedAutosVideoMode;
  streamUrl?: string;
  externalHref?: string;
  posterSrc?: string;
  g: AutosNegociosCopy["preview"]["gallery"];
  lang: "es" | "en";
}) {
  if (mode === "none") return null;

  if ((mode === "mux-hls" || mode === "progressive") && streamUrl) {
    return <StreamableAutosVideo url={streamUrl} posterUrl={posterSrc} lang={lang} g={g} />;
  }

  const href = externalHref || "#";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-left md:aspect-auto md:min-h-[140px]"
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
    </a>
  );
}

function VideoTile({
  videoSrc,
  videoHref,
  posterSrc,
  g,
}: {
  videoSrc: string | undefined;
  videoHref: string | undefined;
  posterSrc: string | undefined;
  g: AutosNegociosCopy["preview"]["gallery"];
}) {
  if (videoSrc) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] md:aspect-auto md:min-h-[140px]">
        <video src={videoSrc} controls className="h-full w-full object-cover" playsInline />
        <span className="absolute bottom-2 left-2 rounded-md bg-[#FFFCF7]/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text)]">
          {g.videoBadge}
        </span>
      </div>
    );
  }

  return (
    <a
      href={videoHref || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-left md:aspect-auto md:min-h-[140px]"
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
    </a>
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
