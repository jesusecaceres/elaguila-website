"use client";

import { FiPlay } from "react-icons/fi";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type { AutoDealerListing } from "../../types/autoDealerListing";
import type { AutosNegociosCopy } from "../../lib/autosNegociosCopy";
import { useAutosNegociosPreviewCopy } from "../../lib/AutosNegociosPreviewLocaleContext";
import { deriveHeroImageUrls } from "../../lib/autoDealerHeroImages";
import {
  buildAutosGalleryMediaSets,
  type AutosGalleryLightboxItem,
} from "@/app/lib/clasificados/autos/autosGalleryLightbox";
import { MediaImage } from "../../components/MediaImage";
import { BusinessGalleryLightbox, type BusinessGallerySlide } from "@/app/components/media/BusinessGalleryModal";
import {
  AUTOS_GALLERY_SELECT_TAB_EVENT,
  AUTOS_PREVIEW_SECTION_IDS,
  autosPreviewMediaTabClass,
  autosPreviewPremiumCardClass,
} from "./previewPremiumTokens";

const CARD = `${autosPreviewPremiumCardClass} min-w-0 overflow-x-hidden p-3 sm:p-4`;

type AutosGalleryTab = "all" | "photos" | "video";

function mediaTabClass(active: boolean): string {
  return `${autosPreviewMediaTabClass}${active ? " border-[#C9A84A] bg-[#FBF7EF] ring-1 ring-[#C9A84A]/35" : ""}`;
}

export function PreviewAutoGallery({
  data,
  publicPlaybackOnly = false,
  embeddedInCanvas = false,
  mockupShelf = false,
}: {
  data: AutoDealerListing;
  /** Live/public detail: only durable URLs — no blob, data:, or videoFileDataUrl. */
  publicPlaybackOnly?: boolean;
  /** When true, gallery sits inside unified vehicle canvas without its own outer card. */
  embeddedInCanvas?: boolean;
  /** Mockup layout: large main image + counter + horizontal thumbs (incl. video). */
  mockupShelf?: boolean;
}) {
  const { lang, t } = useAutosNegociosPreviewCopy();
  const g = t.preview.gallery;

  const images = deriveHeroImageUrls(data);
  const primaryImageUrl = data.mediaImages?.find((m) => m.isPrimary)?.url?.trim();
  const primaryImageIndex = primaryImageUrl ? images.indexOf(primaryImageUrl) : -1;
  const { photoItems, videoItems, allItems } = useMemo(
    () => buildAutosGalleryMediaSets(data, images, { publicPlaybackOnly }),
    [data, images, publicPlaybackOnly],
  );

  const defaultTab = useMemo((): AutosGalleryTab => {
    if (photoItems.length > 0) return "photos";
    return "video";
  }, [photoItems.length]);

  const [activeTab, setActiveTab] = useState<AutosGalleryTab>(defaultTab);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mainIndex, setMainIndex] = useState(primaryImageIndex >= 0 ? primaryImageIndex : 0);

  useEffect(() => {
    setActiveTab(defaultTab);
    setLightboxIndex(null);
    setMainIndex(0);
  }, [defaultTab]);

  useEffect(() => {
    setMainIndex((i) => (images.length === 0 ? 0 : Math.min(i, images.length - 1)));
  }, [images.length]);

  const activeItems = useMemo(() => {
    if (activeTab === "video") return videoItems;
    if (activeTab === "all") return allItems;
    return photoItems;
  }, [activeTab, photoItems, videoItems, allItems]);

  // Escape/ArrowLeft/ArrowRight are now handled by BusinessGalleryLightbox's own internal
  // keydown listener (registered only while `open`) — a second window-level handler here would
  // double-fire and skip every arrow-key press by 2 items.

  const selectTab = useCallback((tab: AutosGalleryTab) => {
    setActiveTab(tab);
    setLightboxIndex(null);
  }, []);

  useEffect(() => {
    const onSelectTab = (e: Event) => {
      const detail = (e as CustomEvent<AutosGalleryTab>).detail;
      if (detail === "photos" || detail === "video" || detail === "all") selectTab(detail);
    };
    window.addEventListener(AUTOS_GALLERY_SELECT_TAB_EVENT, onSelectTab);
    return () => window.removeEventListener(AUTOS_GALLERY_SELECT_TAB_EVENT, onSelectTab);
  }, [selectTab]);

  const openAt = useCallback(
    (idx: number) => {
      if (!activeItems[idx]) return;
      setLightboxIndex(idx);
    },
    [activeItems],
  );

  /** Owner-locked Gate 11/12: switching Todo/Fotos/Videos WHILE the lightbox is open must never
   * reset to item 0 or close the viewer — it preserves the same media item when it still belongs
   * to the chosen filter (photoItems/videoItems/allItems all share the same object references, so
   * reference equality is a stable identity check), or lands on the first valid item otherwise. */
  const handleLightboxFilterChange = useCallback(
    (nextTab: AutosGalleryTab) => {
      const currentItem = lightboxIndex != null ? activeItems[lightboxIndex] : null;
      const nextItems = nextTab === "video" ? videoItems : nextTab === "all" ? allItems : photoItems;
      const preservedIndex = currentItem ? nextItems.indexOf(currentItem) : -1;
      setActiveTab(nextTab);
      setLightboxIndex(nextItems.length === 0 ? null : preservedIndex >= 0 ? preservedIndex : 0);
    },
    [lightboxIndex, activeItems, videoItems, allItems, photoItems],
  );

  const altBase = data.vehicleTitle?.trim() || g.vehicleFallback;

  const lightboxSlides: BusinessGallerySlide[] = useMemo(
    () =>
      activeItems.map((item): BusinessGallerySlide =>
        item.kind === "photo"
          ? { kind: "image", url: item.src, alt: altBase }
          : { kind: "video", renderVideo: () => <GalleryVideoContent item={item} lang={lang} g={g} /> },
      ),
    [activeItems, altBase, g, lang],
  );

  const main = images[mockupShelf ? mainIndex : (primaryImageIndex >= 0 ? primaryImageIndex : 0)] ?? images[0];
  const extra = Math.max(0, images.length - 1);
  const hasPhotos = photoItems.length > 0;
  const hasVideos = videoItems.length > 0;

  if (!hasPhotos && !hasVideos) return null;

  const moreLabel = extra > 0 ? g.morePhotos(extra) : "";

  const photoRailImages = mockupShelf ? images.slice(0, 4) : images.slice(1, 4);
  const showMockupNav = mockupShelf && images.length > 1;

  const wrapperClass = embeddedInCanvas ? "min-w-0" : `${CARD} scroll-mt-28`;

  const goPrev = () => setMainIndex((i) => Math.max(0, i - 1));
  const goNext = () => setMainIndex((i) => Math.min(images.length - 1, i + 1));

  return (
    <div id={AUTOS_PREVIEW_SECTION_IDS.gallery} className={wrapperClass}>
      {hasPhotos || hasVideos ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {hasPhotos && hasVideos ? (
            <button type="button" className={mediaTabClass(activeTab === "all")} onClick={() => selectTab("all")}>
              {lang === "es" ? "Todo" : "All"} ({photoItems.length + videoItems.length})
            </button>
          ) : null}
          {hasPhotos ? (
            <button type="button" className={mediaTabClass(activeTab === "photos")} onClick={() => selectTab("photos")}>
              {lang === "es" ? "Fotos" : "Photos"} ({photoItems.length})
            </button>
          ) : null}
          {hasVideos ? (
            <button type="button" className={mediaTabClass(activeTab === "video")} onClick={() => selectTab("video")}>
              {lang === "es" ? "Video" : "Video"} ({videoItems.length})
            </button>
          ) : null}
        </div>
      ) : null}

      {activeTab === "all" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {photoItems.map((item, photoIdx) => (
            <Thumb key={`all-photo-${photoIdx}`} src={item.src} alt={altBase} onOpen={() => openAt(photoIdx)} />
          ))}
          {videoItems.map((item, videoIdx) => (
            <VideoWalkaroundThumb
              key={`all-video-${videoIdx}`}
              posterSrc={images[0]}
              label={item.videoLabel ?? `Video ${videoIdx + 1}`}
              g={g}
              onOpen={() => openAt(photoItems.length + videoIdx)}
            />
          ))}
        </div>
      ) : activeTab === "video" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {videoItems.map((item, videoIdx) => (
            <VideoWalkaroundThumb
              key={`video-tab-${videoIdx}`}
              posterSrc={images[0]}
              label={item.videoLabel ?? `Video ${videoIdx + 1}`}
              g={g}
              onOpen={() => openAt(videoIdx)}
            />
          ))}
        </div>
      ) : mockupShelf && hasPhotos ? (
        <div className="flex flex-col gap-3">
          {main ? (
            <div className="relative min-w-0 aspect-[16/10] max-h-[min(520px,52vh)] overflow-hidden rounded-[14px] bg-[#F3EEE4]">
              <button
                type="button"
                className="relative block h-full w-full cursor-zoom-in text-left"
                onClick={() => {
                  setActiveTab("photos");
                  openAt(mainIndex);
                }}
                aria-label={lang === "es" ? "Abrir galería de fotos" : "Open photo gallery"}
              >
                <MediaImage
                  src={main}
                  alt={altBase}
                  fill
                  className="object-contain"
                  sizes="(min-width: 1280px) 900px, 100vw"
                  priority
                />
              </button>
              {images.length > 1 ? (
                <span className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/30 bg-[#1F241C]/85 px-3 py-1 text-xs font-bold tracking-tight text-[#FFFCF7] shadow-md backdrop-blur-sm">
                  {mainIndex + 1} / {images.length}
                </span>
              ) : null}
              {showMockupNav ? (
                <>
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-[#FFFCF7]/95 text-[#1F241C] shadow-md disabled:opacity-40"
                    onClick={goPrev}
                    disabled={mainIndex <= 0}
                    aria-label={lang === "es" ? "Foto anterior" : "Previous photo"}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-[#FFFCF7]/95 text-[#1F241C] shadow-md disabled:opacity-40"
                    onClick={goNext}
                    disabled={mainIndex >= images.length - 1}
                    aria-label={lang === "es" ? "Foto siguiente" : "Next photo"}
                  >
                    ›
                  </button>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
            {photoRailImages.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                className={`relative aspect-[4/3] w-[22%] min-w-[4.75rem] max-w-[120px] shrink-0 overflow-hidden rounded-[10px] border text-left ${
                  i === mainIndex ? "border-[#C9A84A] ring-1 ring-[#C9A84A]/40" : "border-[#D6C7AD]/70"
                }`}
                onClick={() => {
                  setMainIndex(i);
                  setActiveTab("photos");
                }}
                onDoubleClick={() => {
                  setActiveTab("photos");
                  openAt(i);
                }}
                aria-label={`${altBase}${g.viewAlt(Math.max(0, i - 1))}`}
              >
                <MediaImage src={src} alt="" fill className="object-cover" sizes="120px" />
              </button>
            ))}
          </div>
        </div>
      ) : (
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

          {photoRailImages.length > 0 && !mockupShelf ? (
            <div
              className={`flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-0 lg:[&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:hidden ${
                photoRailImages.length >= 3
                  ? "lg:w-[min(240px,32%)] lg:shrink-0"
                  : "lg:w-[min(200px,28%)] lg:shrink-0"
              }`}
            >
              {photoRailImages.map((src, i) => {
                const galleryIndex = i + 1;
                return (
                  <Thumb
                    key={`${src}-${i}`}
                    src={src}
                    alt={`${altBase}${g.viewAlt(i)}`}
                    onOpen={() => openAt(galleryIndex)}
                    stacked
                    showMoreOverlay={i === photoRailImages.length - 1 && extra > 3}
                    moreLabel={i === photoRailImages.length - 1 && extra > 3 ? g.morePhotos(extra - 3) : undefined}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      )}

      <BusinessGalleryLightbox
        open={lightboxIndex != null}
        onClose={() => setLightboxIndex(null)}
        slides={lightboxSlides}
        activeIndex={lightboxIndex ?? 0}
        onActiveIndexChange={setLightboxIndex}
        ariaLabel={lang === "es" ? "Galería del vehículo" : "Vehicle gallery"}
        copy={{
          close: lang === "es" ? "Cerrar" : "Close",
          prev: lang === "es" ? "Anterior" : "Previous",
          next: lang === "es" ? "Siguiente" : "Next",
          counterLabel: lang === "es" ? "Galería del vehículo" : "Vehicle gallery",
        }}
        headerSlot={
          hasPhotos && hasVideos ? (
            <AutosLightboxFilterSwitch lang={lang} activeTab={activeTab} onChange={handleLightboxFilterChange} photoCount={photoItems.length} videoCount={videoItems.length} />
          ) : undefined
        }
      />
    </div>
  );
}

/** Owner-locked Gate 11: Todo/Fotos/Videos switch rendered inside the shared lightbox's own
 * header (via `headerSlot`) — only offered when the ad genuinely has both photos and videos. */
function AutosLightboxFilterSwitch({
  lang,
  activeTab,
  onChange,
  photoCount,
  videoCount,
}: {
  lang: "es" | "en";
  activeTab: AutosGalleryTab;
  onChange: (tab: AutosGalleryTab) => void;
  photoCount: number;
  videoCount: number;
}) {
  const tabClass = (active: boolean) =>
    `rounded-lg px-2.5 py-1 text-xs font-bold transition ${
      active ? "bg-white/20 text-white" : "text-white/60 hover:text-white/85"
    }`;
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={tabClass(activeTab === "all")} onClick={() => onChange("all")}>
        {lang === "es" ? "Todo" : "All"} ({photoCount + videoCount})
      </button>
      <button type="button" className={tabClass(activeTab === "photos")} onClick={() => onChange("photos")}>
        {lang === "es" ? "Fotos" : "Photos"} ({photoCount})
      </button>
      <button type="button" className={tabClass(activeTab === "video")} onClick={() => onChange("video")}>
        {lang === "es" ? "Videos" : "Videos"} ({videoCount})
      </button>
    </div>
  );
}

/** Video-only slide content — `BusinessGalleryLightbox` renders the `image` slide kind itself. */
function GalleryVideoContent({
  item,
  lang,
  g,
}: {
  item: Exclude<AutosGalleryLightboxItem, { kind: "photo" }>;
  lang: "es" | "en";
  g: AutosNegociosCopy["preview"]["gallery"];
}) {
  if (item.kind === "youtube") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          src={item.embedUrl}
          title={item.videoLabel ?? g.videoBadge}
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
    <div
      className={
        fillContainer
          ? "relative h-full w-full"
          : "relative aspect-[4/3] overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] md:aspect-auto md:min-h-[140px]"
      }
    >
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

function VideoWalkaroundThumb({
  posterSrc,
  label,
  g,
  onOpen,
  stacked = false,
}: {
  posterSrc?: string;
  label: string;
  g: AutosNegociosCopy["preview"]["gallery"];
  onOpen: () => void;
  stacked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative flex items-center justify-center overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-left ${
        stacked
          ? "aspect-[4/3] w-[42vw] max-w-[160px] shrink-0 snap-start lg:aspect-auto lg:min-h-[120px] lg:w-full lg:max-w-none"
          : "aspect-[4/3] w-full md:aspect-auto md:min-h-[140px]"
      }`}
      aria-label={`${g.videoAria} — ${label}`}
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
        {label}
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
