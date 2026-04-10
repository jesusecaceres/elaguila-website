"use client";

import { useState, type CSSProperties } from "react";
import type { BienesRaicesPreviewQuickFactVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { BrNegocioStreamableVideo } from "@/app/clasificados/bienes-raices/preview/negocio/components/BrNegocioStreamableVideo";
import {
  leonixGalleryPhotoSlidesWithCaptions,
  leonixSlideIndexForCoverPhoto,
  leonixSlideIndexForPhotoUrl,
  leonixSlideIndexForVideoSlot,
} from "@/app/clasificados/lib/leonixGallerySlides";
import { LeonixPreviewGalleryLightbox } from "@/app/clasificados/lib/LeonixPreviewGalleryLightbox";
import type { BienesRaicesPrivadoPreviewVm } from "./model/bienesRaicesPrivadoPreviewVm";

const IVORY = "#F9F6F1";
const CREAM_CARD = "#FDFBF7";
const CHARCOAL = "#3D3630";
const CHARCOAL_DEEP = "#2A2620";
const BRONZE = "#C5A059";
const BRONZE_SOFT = "#B8954A";
const BORDER = "rgba(61, 54, 48, 0.12)";
const MUTED = "rgba(61, 54, 48, 0.62)";

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconBed({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 16V8m0 8v3h16v-3M4 8V6a1 1 0 011-1h3v9M4 8h5m11 8V11a2 2 0 00-2-2h-4v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconBath({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5zm0 0V9a3 3 0 013-3h1m-4 6V7m14 5V9a2 2 0 00-2-2h-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconRuler({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20L20 4M8 4h2v4M14 4h2v4M4 14h4v2M4 8h4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCar({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 17h14l-1.5-5h-11L5 17zm0 0v2m14-2v2M7 17v-3m10 3v-3M6 10l1.5-3h9L18 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSparkle({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l1.2 4.2L17 8l-3.8 1.8L12 14l-1.2-4.2L7 8l3.8-1.8L12 2zM19 15l.6 2.1 2.1.6-2.1.6-.6 2.1-.6-2.1-2.1-.6 2.1-.6.6-2.1z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlay({ className }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function IconVr({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 12h8M6 8h12a2 2 0 012 2v4a2 2 0 01-2 2h-2l-2 2-2-2h-4l-2 2-2-2H6a2 2 0 01-2-2v-4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

const QUICK_FACT_ICONS: Record<BienesRaicesPreviewQuickFactVm["icon"], typeof IconBed> = {
  bed: IconBed,
  bath: IconBath,
  ruler: IconRuler,
  car: IconCar,
  calendar: IconCalendar,
  home: IconHome,
  pin: IconPin,
  sparkle: IconSparkle,
};

function GalleryVideoTile({
  index,
  vm,
  aspectClass = "aspect-[4/3]",
}: {
  index: 0 | 1;
  vm: BienesRaicesPrivadoPreviewVm;
  aspectClass?: string;
}) {
  const m = vm.media;
  const hasVideo = index === 0 ? Boolean(m?.hasVideo1) : Boolean(m?.hasVideo2);
  const thumb = m?.videoThumbUrls?.[index] ?? null;
  const playback = m?.videoPlaybackUrls?.[index] ?? null;
  const yt = m?.youtubeIds?.[index] ?? null;
  const watchUrl = yt ? `https://www.youtube.com/watch?v=${yt}` : playback ?? "";

  if (!hasVideo) {
    return null;
  }

  if (yt && thumb) {
    return (
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative block overflow-hidden rounded-2xl border text-left shadow-md ${aspectClass}`}
        style={{ borderColor: BORDER }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt="" className="h-full w-full object-cover brightness-[0.92]" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#1a2744] shadow-lg">
            <IconPlay />
          </div>
        </div>
      </a>
    );
  }

  /** Draft local file (data URL) — not Mux; same-tab only. */
  if (playback && /^data:video\//i.test(playback)) {
    return (
      <div className={`overflow-hidden rounded-2xl border shadow-md ${aspectClass}`} style={{ borderColor: BORDER }}>
        <video controls playsInline className="h-full w-full object-cover" src={playback} />
      </div>
    );
  }

  if (playback && /\.m3u8|\.mp4(\?|$)|blob:/i.test(playback)) {
    return (
      <div className={`overflow-hidden rounded-2xl border shadow-md ${aspectClass}`} style={{ borderColor: BORDER }}>
        {playback.includes(".m3u8") || playback.startsWith("blob:") ? (
          <BrNegocioStreamableVideo url={playback} className="h-full w-full object-cover" />
        ) : (
          <video poster={thumb ?? undefined} controls playsInline className="h-full w-full object-cover" src={playback} />
        )}
      </div>
    );
  }

  if (thumb && !playback) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border shadow-md ${aspectClass}`} style={{ borderColor: BORDER }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt="" className="h-full w-full object-cover brightness-[0.92]" />
      </div>
    );
  }

  if (playback) {
    return (
      <a
        href={playback}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative block overflow-hidden rounded-2xl border shadow-md ${aspectClass}`}
        style={{ borderColor: BORDER }}
      >
        <div className="flex h-full w-full items-center justify-center bg-black/80 px-2 text-center text-xs font-semibold text-white">
          Ver video en nueva pestaña
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#1a2744] shadow-lg">
            <IconPlay />
          </div>
        </div>
      </a>
    );
  }

  return null;
}

function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
      style={{ borderColor: BORDER, color: BRONZE, background: CREAM_CARD }}
    >
      {children}
    </span>
  );
}

function FactBlock({ title, rows }: { title: string; rows: Array<{ label: string; value: string }> | undefined }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (safeRows.length === 0) return null;
  return (
    <div
      className="min-w-0 rounded-xl border p-3.5 shadow-[0_10px_36px_-14px_rgba(42,36,22,0.08)] sm:p-4"
      style={{ borderColor: BORDER, background: CREAM_CARD }}
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
        {title}
      </h3>
      <dl className="mt-2.5 grid gap-x-5 gap-y-3 sm:mt-3 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-3.5">
        {safeRows.map((r) => (
          <div key={`${r.label}-${r.value}`} className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
              {r.label}
            </dt>
            <dd
              className="mt-1 break-words text-sm font-medium leading-snug [overflow-wrap:anywhere] [font-variant-numeric:tabular-nums]"
              style={{ color: CHARCOAL }}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function LowerModuleCard({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-4 shadow-[0_10px_36px_-14px_rgba(42,36,22,0.08)] sm:p-4"
      style={{ borderColor: BORDER, background: CREAM_CARD }}
    >
      {eyebrow ? (
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
          {eyebrow}
        </p>
      ) : null}
      <h3 className={`font-bold tracking-tight ${eyebrow ? "mt-2 text-base" : "text-base"}`} style={{ color: CHARCOAL_DEEP }}>
        {title}
      </h3>
      {subtitle ? (
        <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
          {subtitle}
        </p>
      ) : null}
      <div className={subtitle || eyebrow ? "mt-5" : "mt-4"}>{children}</div>
    </div>
  );
}

type GalleryTopSpec = { kind: "photo"; url: string } | { kind: "video"; slot: 0 | 1 };

function galleryTopCells(vm: BienesRaicesPrivadoPreviewVm): [GalleryTopSpec | null, GalleryTopSpec | null] {
  const m = vm.media;
  const all = m?.allPhotoUrls ?? [];
  const coverIdx = Math.min(Math.max(0, m?.coverPhotoIndex ?? 0), Math.max(0, all.length - 1));
  const pool = all.map((url, i) => ({ url, i })).filter((x) => all.length > 0 && x.i !== coverIdx);
  let pi = 0;
  const nextPhoto = (): string | null => {
    const x = pool[pi];
    if (!x) return null;
    pi += 1;
    return x.url;
  };
  const cellA: GalleryTopSpec | null = m?.hasVideo1
    ? { kind: "video", slot: 0 }
    : (() => {
        const u = nextPhoto();
        return u ? { kind: "photo", url: u } : null;
      })();
  const cellB: GalleryTopSpec | null = m?.hasVideo2
    ? { kind: "video", slot: 1 }
    : (() => {
        const u = nextPhoto();
        return u ? { kind: "photo", url: u } : null;
      })();
  return [cellA, cellB];
}

/** When the primary video is shown in the hero column, reserve sidebar slots for extra photos only. */
function galleryTopCellsSidebarOnly(vm: BienesRaicesPrivadoPreviewVm): [GalleryTopSpec | null, GalleryTopSpec | null] {
  const m = vm.media;
  if (!m) return [null, null];
  return galleryTopCells({
    ...vm,
    media: {
      ...m,
      hasVideo1: false,
      hasVideo2: false,
    },
  });
}

/** Publishable ad canvas only — preview chrome (`LeonixPreviewPageShell`) wraps edit back-link. */
export function BienesRaicesPrivadoPreviewView({ vm }: { vm: BienesRaicesPrivadoPreviewVm }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const quickFacts = (vm.quickFacts ?? []).map((qf) => ({
    Icon: QUICK_FACT_ICONS[qf.icon] ?? IconSparkle,
    label: qf.label,
    value: qf.value,
  }));

  const media = vm.media;
  const hasPhotos = Boolean(media?.hasPhotos && media?.heroUrl);
  const hasPrimaryVideo = Boolean(media?.hasVideo1);
  const videoOnlyHero = !hasPhotos && hasPrimaryVideo;
  const [gTopA, gTopB] = videoOnlyHero ? galleryTopCellsSidebarOnly(vm) : galleryTopCells(vm);

  const dedupedPhotoSlides = leonixGalleryPhotoSlidesWithCaptions(media?.allPhotoUrls, media?.photoCaptionsFull);
  const uniquePhotoCount = dedupedPhotoSlides.length;
  const hasVidMeta = Boolean(media?.hasVideo1 || media?.hasVideo2);
  const galleryMetaLineDisplay =
    uniquePhotoCount > 0
      ? `${uniquePhotoCount} foto${uniquePhotoCount === 1 ? "" : "s"} en la galería`
      : hasVidMeta
        ? "Video en el anuncio"
        : String(media?.metaLine ?? "").trim();
  const showGallerySection =
    hasPhotos ||
    hasPrimaryVideo ||
    Boolean(media?.virtualTourUrl) ||
    Boolean(media?.floorPlanUrls?.[0]) ||
    Boolean(media?.hasSitePlan && media?.sitePlanUrl) ||
    Boolean(vm.location.mapsUrl);

  const hasDetailRows = (vm.propertyDetailsRows ?? []).length > 0;
  const heroTitleShown = String(vm.heroTitle ?? "").trim();
  const addressLineShown = String(vm.addressLine ?? "").trim();
  const priceShown = String(vm.priceDisplay ?? "").trim();
  const sellerNameShown = String(vm.seller.name ?? "").trim();
  const sellerRoleShown = String(vm.seller.byOwnerLabel ?? "").trim();
  const showSellerPhotoAside = Boolean(vm.seller.hasPhoto && vm.seller.photoUrl);
  const showMainSellerAside =
    showSellerPhotoAside ||
    Boolean(sellerNameShown) ||
    Boolean(sellerRoleShown) ||
    Boolean(String(vm.seller.noteLine ?? "").trim()) ||
    Boolean(String(vm.seller.phoneDisplay ?? "").trim()) ||
    Boolean(String(vm.seller.whatsappDisplay ?? "").trim()) ||
    Boolean(String(vm.seller.emailDisplay ?? "").trim());

  const renderGallerySpec = (spec: GalleryTopSpec, idx: number) => {
    if (spec.kind === "photo") {
      return (
        <div key={`ph-${spec.url}-${idx}`} className="relative min-h-0 overflow-hidden rounded-2xl border shadow-md" style={{ borderColor: BORDER }}>
          <button
            type="button"
            className="block w-full text-left"
            onClick={() =>
              openGallery(leonixSlideIndexForPhotoUrl(vm.media?.allPhotoUrls, vm.media?.photoCaptionsFull, spec.url))
            }
            aria-label="Abrir foto en galería"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spec.url} alt="" className="aspect-[4/3] w-full object-cover" />
          </button>
        </div>
      );
    }
    return (
      <div key={`vid-${spec.slot}`} className="relative min-h-0 overflow-hidden rounded-2xl border shadow-md" style={{ borderColor: BORDER }}>
        <div className="relative aspect-[4/3] w-full">
          <GalleryVideoTile index={spec.slot} vm={vm} />
          <button
            type="button"
            className="absolute right-2 top-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-md sm:text-[11px]"
            style={{ borderColor: BORDER, background: "rgba(253,251,247,0.95)", color: CHARCOAL_DEEP }}
            onClick={() => openGallery(leonixSlideIndexForVideoSlot(vm.media, spec.slot))}
          >
            Galería
          </button>
        </div>
      </div>
    );
  };

  const sidebarGallerySpecs = [gTopA, gTopB].filter((s): s is GalleryTopSpec => s != null);

  const fourthTile =
    vm.location.mapsUrl ? (
      <a
        key="maps"
        href={vm.location.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-[120px] flex-col justify-center gap-2 rounded-2xl border px-4 py-3 shadow-md sm:min-h-[130px]"
        style={{ borderColor: BORDER, background: CREAM_CARD }}
      >
        <span style={{ color: BRONZE }}>
          <IconPin className="block h-6 w-6" />
        </span>
        <p className="text-sm font-bold" style={{ color: CHARCOAL }}>
          Ubicación en mapa
        </p>
        <p className="text-xs" style={{ color: MUTED }}>
          Ver en mapa externo
        </p>
      </a>
    ) : media?.floorPlanUrls?.[0] ? (
      <div key="floor" className="overflow-hidden rounded-2xl border shadow-md" style={{ borderColor: BORDER }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.floorPlanUrls[0]!} alt="" className="aspect-[4/3] w-full object-cover" />
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
          Plano de planta
        </p>
      </div>
    ) : media?.hasSitePlan && media?.sitePlanUrl ? (
      <div key="site" className="overflow-hidden rounded-2xl border shadow-md" style={{ borderColor: BORDER }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.sitePlanUrl} alt="" className="aspect-[4/3] w-full object-contain bg-white" />
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
          Plano de sitio
        </p>
      </div>
    ) : null;

  const tourTile = media?.virtualTourUrl ? (
    <a
      key="tour"
      href={media.virtualTourUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-[120px] flex-col justify-center gap-2 rounded-2xl border px-4 py-3 text-white shadow-md sm:min-h-[130px]"
      style={{
        borderColor: "rgba(26,39,68,0.4)",
        background: "linear-gradient(135deg, #1a2744 0%, #243a5e 50%, #1e3050 100%)",
      }}
    >
      <IconVr className="shrink-0 opacity-95" />
      <div>
        <p className="text-sm font-bold">Tour virtual</p>
        <p className="mt-0.5 text-xs opacity-85">Abrir recorrido</p>
      </div>
    </a>
  ) : null;

  return (
    <div className="w-full min-w-0 max-w-[100vw] overflow-x-hidden antialiased" style={{ backgroundColor: IVORY, color: CHARCOAL }}>
      <main className="mx-auto w-full min-w-0 max-w-[1240px] px-4 pb-[max(3.25rem,env(safe-area-inset-bottom,0px))] pt-2.5 sm:px-6 sm:pb-14 sm:pt-3.5 lg:px-8">
        {showGallerySection ? (
          <section className="mb-0" id="galeria-multimedia">
            <div className="mb-1.5 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="flex items-center gap-2">
                <SectionIcon>
                  <IconHome className="h-4 w-4" />
                </SectionIcon>
                <h2 className="text-base font-bold sm:text-lg" style={{ color: CHARCOAL_DEEP }}>
                  Galería multimedia
                </h2>
              </div>
              {galleryMetaLineDisplay ? (
                <p className="text-[11px] font-medium sm:text-xs" style={{ color: MUTED }}>
                  {galleryMetaLineDisplay}
                </p>
              ) : null}
            </div>
            <div className="grid min-w-0 gap-2.5 lg:grid-cols-12 lg:gap-3.5">
              {hasPhotos || videoOnlyHero ? (
                <div className="min-w-0 lg:col-span-7">
                  <div className="relative">
                    {hasPhotos && media?.heroUrl ? (
                      <>
                        <button
                          type="button"
                          className="group relative w-full overflow-hidden rounded-2xl border text-left shadow-lg transition hover:opacity-[0.98]"
                          style={{ borderColor: BORDER }}
                          onClick={() =>
                            openGallery(
                              leonixSlideIndexForCoverPhoto(
                                media?.allPhotoUrls,
                                media?.coverPhotoIndex ?? 0,
                                media?.photoCaptionsFull,
                              ),
                            )
                          }
                          aria-label="Abrir galería de fotos"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={media.heroUrl} alt="" className="aspect-[16/10] w-full object-cover" />
                          <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/[0.06]" aria-hidden />
                        </button>
                        {uniquePhotoCount > 0 ? (
                          <button
                            type="button"
                            className="absolute bottom-3 right-3 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide shadow-md transition hover:brightness-95"
                            style={{ borderColor: BORDER, background: "rgba(253,251,247,0.94)", color: CHARCOAL_DEEP }}
                            onClick={() =>
                              openGallery(
                                leonixSlideIndexForCoverPhoto(
                                  media?.allPhotoUrls,
                                  media?.coverPhotoIndex ?? 0,
                                  media?.photoCaptionsFull,
                                ),
                              )
                            }
                            aria-label="Abrir galería completa"
                          >
                            {uniquePhotoCount} fotos
                          </button>
                        ) : null}
                      </>
                    ) : videoOnlyHero ? (
                      <div className="relative overflow-hidden rounded-2xl border shadow-lg" style={{ borderColor: BORDER }}>
                        <div className="relative aspect-[16/10] w-full">
                          <div className="absolute inset-0 overflow-hidden rounded-2xl">
                            <GalleryVideoTile index={0} vm={vm} aspectClass="h-full w-full" />
                          </div>
                          <button
                            type="button"
                            className="absolute bottom-3 right-3 z-10 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide shadow-md transition hover:brightness-95"
                            style={{ borderColor: BORDER, background: "rgba(253,251,247,0.94)", color: CHARCOAL_DEEP }}
                            onClick={() => openGallery(leonixSlideIndexForVideoSlot(media, 0))}
                            aria-label="Abrir video en galería"
                          >
                            Galería
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {media?.heroCaption ? (
                    <p className="mt-2 px-0.5 text-xs font-medium leading-snug sm:text-sm" style={{ color: MUTED }}>
                      {media.heroCaption}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div
                className={`grid min-w-0 grid-cols-2 gap-2 sm:gap-2.5 ${hasPhotos || videoOnlyHero ? "lg:col-span-5" : "lg:col-span-12"} [grid-template-columns:minmax(0,1fr)_minmax(0,1fr)]`}
              >
                {sidebarGallerySpecs.map((spec, idx) => renderGallerySpec(spec, idx))}
                {tourTile}
                {fourthTile}
              </div>
            </div>
          </section>
        ) : null}

        <section
          className={`grid min-w-0 grid-cols-1 gap-4 lg:items-start lg:gap-5 ${showGallerySection ? "mt-5 border-t pt-5" : "mt-0 border-0 pt-1.5"} ${
            showMainSellerAside ? "lg:grid-cols-[1fr_minmax(280px,340px)]" : ""
          }`}
          style={{ borderColor: BORDER }}
        >
          <div className="min-w-0">
            {heroTitleShown ? (
              <h1
                className="max-w-full text-[1.65rem] font-bold leading-[1.15] tracking-tight [overflow-wrap:anywhere] sm:text-[2rem] lg:max-w-[720px] lg:text-[2.35rem]"
                style={{ color: CHARCOAL_DEEP, fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {heroTitleShown}
              </h1>
            ) : (
              <h1 className="sr-only">Vista previa del anuncio</h1>
            )}
            {addressLineShown ? (
              <p className="mt-2.5 flex items-start gap-2 text-sm font-medium leading-snug" style={{ color: MUTED }}>
                <span className="mt-0.5 shrink-0" style={{ color: BRONZE }}>
                  <IconPin className="block h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </span>
                <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{addressLineShown}</span>
              </p>
            ) : null}
            {priceShown || vm.listingStatusLabel ? (
              <div className="mt-3 flex flex-wrap items-end gap-2.5">
                {priceShown ? (
                  <span
                    className="break-words text-[1.65rem] font-bold tracking-tight [font-variant-numeric:tabular-nums] sm:text-[2.25rem] lg:text-[2.5rem]"
                    style={{ color: BRONZE, fontFamily: "Georgia, serif" }}
                  >
                    {priceShown}
                  </span>
                ) : null}
                {vm.listingStatusLabel ? (
                  <span
                    className="mb-1 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ borderColor: `${BRONZE}55`, background: "rgba(197, 160, 89, 0.12)", color: BRONZE_SOFT }}
                  >
                    {vm.listingStatusLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
            {vm.operationSummary ? (
              <p className="mt-1.5 text-xs font-medium" style={{ color: MUTED }}>
                {vm.operationSummary}
              </p>
            ) : null}

            {quickFacts.length > 0 ? (
              <div
                className="mt-3.5 grid grid-cols-2 gap-1.5 rounded-xl border p-2 sm:flex sm:flex-wrap sm:gap-2 sm:p-2.5"
                style={{ borderColor: BORDER, background: CREAM_CARD, boxShadow: "0 10px 36px -16px rgba(42,36,22,0.12)" }}
              >
                {quickFacts.map(({ Icon, label, value }, qfIdx) => (
                  <div
                    key={`${label}-${qfIdx}`}
                    className="flex min-h-[44px] min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 sm:min-h-0 sm:min-w-[7.5rem] sm:flex-1 sm:px-2.5 sm:py-2"
                    style={{ borderColor: BORDER }}
                  >
                    <span style={{ color: BRONZE }} className="shrink-0">
                      <Icon className="block h-[18px] w-[18px] sm:h-5 sm:w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                        {label}
                      </p>
                      <p
                        className="text-sm font-bold leading-tight [font-variant-numeric:tabular-nums] [overflow-wrap:anywhere] sm:leading-snug"
                        style={{ color: CHARCOAL }}
                      >
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {showMainSellerAside ? (
            <aside
              className="min-w-0 rounded-xl border p-3 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.14)] sm:p-3.5 lg:sticky lg:top-4 lg:self-start"
              style={{ borderColor: BORDER, background: CREAM_CARD }}
            >
              {showSellerPhotoAside && vm.seller.photoUrl ? (
                <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: BORDER }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vm.seller.photoUrl}
                    alt=""
                    className="aspect-[4/5] w-full max-h-[min(280px,40vh)] object-cover object-top sm:max-h-[min(340px,44vh)] lg:max-h-[360px]"
                  />
                </div>
              ) : null}
              {sellerNameShown ? (
                <p
                  className={`break-words text-base font-bold leading-snug tracking-tight sm:text-lg ${showSellerPhotoAside ? "mt-3 sm:mt-4" : "mt-0"}`}
                  style={{ color: CHARCOAL_DEEP }}
                >
                  {sellerNameShown}
                </p>
              ) : null}
              {sellerRoleShown ? (
                <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] sm:text-[11px]" style={{ color: BRONZE_SOFT }}>
                  {sellerRoleShown}
                </p>
              ) : null}
              {vm.seller.noteLine ? (
                <p className="mt-3 text-sm leading-relaxed [overflow-wrap:anywhere]" style={{ color: MUTED }}>
                  {vm.seller.noteLine}
                </p>
              ) : null}
              <div
                className={
                  vm.seller.phoneDisplay || vm.seller.whatsappDisplay || vm.seller.emailDisplay
                    ? `space-y-2 border-t pt-4 text-sm ${showSellerPhotoAside || sellerNameShown || sellerRoleShown || vm.seller.noteLine ? "mt-4" : "mt-0"}`
                    : "hidden"
                }
                style={{ borderColor: BORDER }}
              >
                {vm.seller.phoneDisplay ? (
                  <p className="font-medium [font-variant-numeric:tabular-nums]" style={{ color: CHARCOAL }}>
                    {vm.seller.phoneDisplay}
                  </p>
                ) : null}
                {vm.seller.whatsappDisplay ? (
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
                    WhatsApp
                  </p>
                ) : null}
                {vm.seller.whatsappDisplay ? (
                  <p className="[font-variant-numeric:tabular-nums]" style={{ color: CHARCOAL }}>
                    {vm.seller.whatsappDisplay}
                  </p>
                ) : null}
                {vm.seller.emailDisplay ? (
                  <p className="break-all text-sm leading-snug opacity-90" style={{ color: CHARCOAL }}>
                    {vm.seller.emailDisplay}
                  </p>
                ) : null}
              </div>
            </aside>
          ) : null}
        </section>

        <section
          className={`mt-5 grid min-w-0 grid-cols-1 gap-3.5 sm:mt-7 lg:items-stretch lg:gap-3.5 ${
            hasDetailRows && vm.hasHighlights
              ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(280px,340px)]"
              : hasDetailRows || vm.hasHighlights
                ? "lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]"
                : "lg:grid-cols-1"
          }`}
        >
          {hasDetailRows ? (
            <FactBlock title="Detalles de la propiedad" rows={vm.propertyDetailsRows} />
          ) : null}
          {vm.hasHighlights ? <FactBlock title="Características destacadas" rows={vm.highlightsRows ?? []} /> : null}
          <aside
            className={`flex min-h-full flex-col lg:sticky lg:top-6 lg:min-h-0 lg:self-start ${
              !hasDetailRows && !vm.hasHighlights ? "lg:mx-auto lg:w-full lg:max-w-md" : ""
            }`}
          >
            <div
              className="flex flex-1 flex-col overflow-hidden rounded-2xl border shadow-[0_24px_64px_-20px_rgba(26,24,20,0.35)]"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="px-4 py-3 sm:px-5" style={{ background: CHARCOAL_DEEP }}>
                <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#F5F0E8]">{vm.contactRailTitle}</p>
              </div>
              {vm.contact.instructionsLine ? (
                <p
                  className="border-b px-5 py-3 text-xs leading-relaxed text-[#d8cfc3]"
                  style={{ borderColor: "rgba(255,255,255,0.08)", background: "#2F2A24" }}
                >
                  {vm.contact.instructionsLine}
                </p>
              ) : null}
              <div className="flex flex-1 flex-col space-y-2.5 px-4 py-3.5 sm:px-5 sm:py-4" style={{ background: "#2F2A24" }}>
                {vm.contact.showSolicitarInfo && vm.contact.solicitarInfoHref ? (
                  <a
                    href={vm.contact.solicitarInfoHref}
                    className="flex min-h-[48px] w-full items-center justify-center rounded-xl px-3 py-3.5 text-center text-sm font-bold text-[#1E1810] shadow-md transition hover:brightness-105"
                    style={{ background: `linear-gradient(180deg, ${BRONZE} 0%, ${BRONZE_SOFT} 100%)` }}
                  >
                    Escribir correo
                  </a>
                ) : null}
                {vm.contact.showLlamar && vm.contact.llamarHref ? (
                  <a
                    href={vm.contact.llamarHref}
                    className="flex min-h-[48px] w-full items-center justify-center rounded-xl border px-3 py-3 text-center text-sm font-semibold text-[#F5F0E8] transition hover:bg-white/5"
                    style={{ borderColor: "rgba(245,240,232,0.25)" }}
                  >
                    Llamar
                  </a>
                ) : null}
                {vm.contact.showWhatsapp && vm.contact.whatsappHref ? (
                  <a
                    href={vm.contact.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[48px] w-full items-center justify-center rounded-xl border px-3 py-3 text-center text-sm font-semibold text-[#E8F5E9] transition hover:bg-white/5"
                    style={{ borderColor: "rgba(37,211,102,0.35)" }}
                  >
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          </aside>
        </section>

        {vm.hasDescription ? (
          <section className="mt-4 min-w-0 sm:mt-5">
            <div
              className="min-w-0 rounded-xl border p-4 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)] sm:p-5 md:p-5"
              style={{ borderColor: BORDER, background: CREAM_CARD }}
            >
              <h2 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
                Descripción
              </h2>
              <p
                className="mt-3.5 whitespace-pre-wrap text-[15px] leading-[1.72] [overflow-wrap:anywhere] sm:mt-4 sm:text-sm sm:leading-[1.78]"
                style={{ color: CHARCOAL }}
              >
                {vm.description}
              </p>
            </div>
          </section>
        ) : null}

        {vm.location.hasMeaningfulAddress ? (
          <section className="mt-7 min-w-0 sm:mt-9">
            <div className="px-1 text-center">
              <h2
                className="text-lg font-bold uppercase tracking-[0.12em] sm:text-xl"
                style={{ color: CHARCOAL_DEEP, fontFamily: "Georgia, serif" }}
              >
                Ubicación
              </h2>
            </div>
            <div className="mx-auto mt-5 max-w-2xl sm:mt-6">
              <LowerModuleCard eyebrow="Referencia" title="Ubicación aproximada">
                {vm.location.line1 ? (
                  <p className="break-words text-sm font-semibold leading-snug [overflow-wrap:anywhere]" style={{ color: CHARCOAL }}>
                    {vm.location.line1}
                  </p>
                ) : null}
                {vm.location.cityStateZip ? (
                  <p className="mt-1 break-words text-sm leading-snug [overflow-wrap:anywhere]" style={{ color: MUTED }}>
                    {vm.location.cityStateZip}
                  </p>
                ) : null}
                {vm.location.mapsUrl ? (
                  <a
                    href={vm.location.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center justify-center rounded-xl border-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition hover:bg-[rgba(197,160,89,0.08)]"
                    style={{ borderColor: BRONZE, color: BRONZE_SOFT }}
                  >
                    Ver en mapa
                  </a>
                ) : null}
              </LowerModuleCard>
            </div>
          </section>
        ) : null}

        {String(vm.footerNote ?? "").trim() ? (
          <footer className="mt-8 border-t pt-4 text-center text-xs" style={{ borderColor: BORDER, color: MUTED }}>
            <p>{vm.footerNote}</p>
          </footer>
        ) : null}
      </main>

      <LeonixPreviewGalleryLightbox vm={vm} open={galleryOpen} initialIndex={galleryIndex} onClose={() => setGalleryOpen(false)} />
    </div>
  );
}
