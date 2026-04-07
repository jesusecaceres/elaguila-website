"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { BienesRaicesPreviewQuickFactVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { BrNegocioStreamableVideo } from "@/app/clasificados/bienes-raices/preview/negocio/components/BrNegocioStreamableVideo";
import { BrPrivadoGalleryLightbox } from "./components/BrPrivadoGalleryLightbox";
import type { BienesRaicesPrivadoPreviewVm } from "./model/bienesRaicesPrivadoPreviewVm";

const IVORY = "#F9F6F1";
const CREAM_CARD = "#FDFBF7";
const CHARCOAL = "#3D3630";
const CHARCOAL_DEEP = "#2A2620";
const BRONZE = "#C5A059";
const BRONZE_SOFT = "#B8954A";
const BORDER = "rgba(61, 54, 48, 0.12)";
const MUTED = "rgba(61, 54, 48, 0.62)";

function EmptyMedia({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 py-8 text-center"
      style={{
        background: "linear-gradient(135deg, rgba(42,38,32,0.06) 0%, rgba(197,160,89,0.08) 55%, rgba(253,251,247,0.9) 100%)",
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm"
        style={{ borderColor: BORDER, background: CREAM_CARD, color: BRONZE }}
        aria-hidden
      >
        {icon}
      </div>
      <p className="text-sm font-bold" style={{ color: CHARCOAL_DEEP }}>
        {title}
      </p>
      <p className="max-w-sm text-xs leading-relaxed" style={{ color: MUTED }}>
        {subtitle}
      </p>
    </div>
  );
}

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

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
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

function IconFloor({ className }: { className?: string }) {
  return (
    <svg className={className} width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="1.25" opacity="0.5" />
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

function GalleryVideoTile({ index, vm }: { index: 0 | 1; vm: BienesRaicesPrivadoPreviewVm }) {
  const m = vm.media;
  const hasVideo = index === 0 ? Boolean(m?.hasVideo1) : Boolean(m?.hasVideo2);
  const thumb = m?.videoThumbUrls?.[index] ?? null;
  const playback = m?.videoPlaybackUrls?.[index] ?? null;
  const yt = m?.youtubeIds?.[index] ?? null;
  const watchUrl = yt ? `https://www.youtube.com/watch?v=${yt}` : playback ?? "";

  if (!hasVideo) {
    return (
      <div className="aspect-[4/3] w-full">
        <EmptyMedia
          title={`Video ${index + 1}`}
          subtitle="Sin video en este espacio."
          icon={<IconPlay className="h-7 w-7" />}
        />
      </div>
    );
  }

  if (yt && thumb) {
    return (
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block overflow-hidden rounded-2xl border text-left shadow-md"
        style={{ borderColor: BORDER }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt="" className="aspect-[4/3] w-full object-cover brightness-[0.92]" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#1a2744] shadow-lg">
            <IconPlay />
          </div>
        </div>
      </a>
    );
  }

  if (playback && /\.m3u8|\.mp4(\?|$)|blob:/i.test(playback)) {
    return (
      <div className="overflow-hidden rounded-2xl border shadow-md" style={{ borderColor: BORDER }}>
        {playback.includes(".m3u8") || playback.startsWith("blob:") ? (
          <BrNegocioStreamableVideo url={playback} className="aspect-[4/3] w-full object-cover" />
        ) : (
          <video poster={thumb ?? undefined} controls playsInline className="aspect-[4/3] w-full object-cover" src={playback} />
        )}
      </div>
    );
  }

  if (thumb && !playback) {
    return (
      <div className="relative overflow-hidden rounded-2xl border shadow-md" style={{ borderColor: BORDER }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt="" className="aspect-[4/3] w-full object-cover brightness-[0.92]" />
      </div>
    );
  }

  if (playback) {
    return (
      <a
        href={playback}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block overflow-hidden rounded-2xl border shadow-md"
        style={{ borderColor: BORDER }}
      >
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-black/80 px-2 text-center text-xs font-semibold text-white">
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

  return (
    <div className="aspect-[4/3] w-full">
      <EmptyMedia title={`Video ${index + 1}`} subtitle="No hay reproducción disponible para este archivo." icon={<IconPlay className="h-7 w-7" />} />
    </div>
  );
}

function LeonixBrandMark({ logoUrl }: { logoUrl: string }) {
  if (logoUrl) {
    return (
      <a href="/clasificados" className="flex shrink-0 items-center" aria-label="Leonix Inicio">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="" className="h-9 w-auto max-w-[140px] object-contain object-left" />
      </a>
    );
  }
  return (
    <a href="/clasificados" className="flex flex-col items-start no-underline" aria-label="Leonix Inicio">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-sm"
        style={{ borderColor: BRONZE, background: CHARCOAL_DEEP }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3c-1.2 1.8-3.5 2.5-5 4-.8 2.2.5 4.5 2 6-1 1.2-2.5 2-3 3.5.8.3 1.8-.2 2.5-.8.5 1.2 1.5 2 2.5 2.5 1-.5 2-1.3 2.5-2.5.7.6 1.7 1.1 2.5.8-.5-1.5-2-2.3-3-3.5 1.5-1.5 2.8-3.8 2-6-1.5-1.5-3.8-2.2-5-4z"
            fill={BRONZE}
            opacity="0.95"
          />
        </svg>
      </div>
      <span className="mt-1 text-[9px] font-bold tracking-[0.2em]" style={{ color: CHARCOAL }}>
        LEONIX
      </span>
    </a>
  );
}

function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
      style={{ borderColor: BORDER, color: BRONZE, background: CREAM_CARD }}
    >
      {children}
    </span>
  );
}

function FactBlock({ title, rows }: { title: string; rows: Array<{ label: string; value: string }> | undefined }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)]"
      style={{ borderColor: BORDER, background: CREAM_CARD }}
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
        {title}
      </h3>
      <dl className="mt-4 grid gap-x-10 gap-y-5 sm:grid-cols-2">
        {safeRows.map((r) => (
          <div key={`${r.label}-${r.value}`}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
              {r.label}
            </dt>
            <dd className="mt-1 text-sm font-medium leading-snug" style={{ color: CHARCOAL }}>
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
      className="rounded-2xl border p-5 sm:p-6 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)]"
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

function photoIndexInGallery(vm: BienesRaicesPrivadoPreviewVm, url: string): number {
  const urls = vm.media?.allPhotoUrls ?? [];
  const i = urls.indexOf(url);
  return i >= 0 ? i : 0;
}

export function BienesRaicesPrivadoPreviewView({
  vm,
  editHref,
  footerExtra,
}: {
  vm: BienesRaicesPrivadoPreviewVm;
  editHref?: string;
  footerExtra?: string;
}) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const gallerySlideIndexForVideo = (slot: 0 | 1) => {
    const n = vm.media?.allPhotoUrls?.length ?? 0;
    if (slot === 0) return n;
    return n + (vm.media?.hasVideo1 ? 1 : 0);
  };

  const quickFacts = (vm.quickFacts ?? []).map((qf) => ({
    Icon: QUICK_FACT_ICONS[qf.icon] ?? IconSparkle,
    label: qf.label,
    value: qf.value,
  }));
  const [gTopA, gTopB] = galleryTopCells(vm);

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: IVORY, color: CHARCOAL }}>
      <header className="border-b" style={{ borderColor: BORDER, background: "rgba(253, 251, 247, 0.96)" }}>
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-3.5 lg:px-8">
          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
            <LeonixBrandMark logoUrl={vm.platformLogoUrl ?? ""} />
            <nav className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: MUTED }}>
              <span style={{ color: CHARCOAL }}>Bienes raíces</span>
              <span className="mx-2 opacity-40">›</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
                style={{ borderColor: BORDER, background: CREAM_CARD }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="opacity-75" aria-hidden style={{ color: CHARCOAL }}>
                  <path
                    d="M12 12a3 3 0 100-6 3 3 0 000 6zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Privado
              </span>
            </nav>
          </div>
          {editHref ? (
            <Link
              href={editHref}
              className="text-[11px] font-bold uppercase tracking-wide underline"
              style={{ color: BRONZE_SOFT }}
              prefetch={false}
            >
              Volver a editar
            </Link>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-6 pb-16 pt-4 lg:px-8">
        <section className="mb-0" id="galeria-multimedia">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <div className="flex items-center gap-2">
              <SectionIcon>
                <IconHome className="h-4 w-4" />
              </SectionIcon>
              <h2 className="text-base font-bold sm:text-lg" style={{ color: CHARCOAL_DEEP }}>
                Galería multimedia
              </h2>
            </div>
            <p className="text-[11px] font-medium sm:text-xs" style={{ color: MUTED }}>
              {vm.media?.metaLine ?? ""}
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-12 lg:gap-4">
            <div className="lg:col-span-7">
              <div className="relative">
                <button
                  type="button"
                  className="group relative w-full overflow-hidden rounded-2xl border text-left shadow-lg transition hover:opacity-[0.98]"
                  style={{ borderColor: BORDER }}
                  onClick={() => vm.media?.hasPhotos && vm.media?.heroUrl && openGallery(vm.media.coverPhotoIndex ?? 0)}
                  disabled={!vm.media?.hasPhotos || !vm.media?.heroUrl}
                  aria-label="Abrir galería de fotos"
                >
                  {vm.media?.hasPhotos && vm.media?.heroUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={vm.media.heroUrl} alt="" className="aspect-[16/10] w-full object-cover" />
                  ) : (
                    <div className="aspect-[16/10] w-full">
                      <EmptyMedia title="Galería" subtitle="Ranura de portada — se llena al publicar." icon={<IconHome className="h-7 w-7" />} />
                    </div>
                  )}
                  {vm.media?.hasPhotos && vm.media?.heroUrl ? (
                    <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/[0.06]" aria-hidden />
                  ) : null}
                </button>
                {vm.media && vm.media.photoCount > 0 ? (
                  <button
                    type="button"
                    className="absolute bottom-3 right-3 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide shadow-md transition hover:brightness-95"
                    style={{ borderColor: BORDER, background: "rgba(253,251,247,0.94)", color: CHARCOAL_DEEP }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openGallery(vm.media?.coverPhotoIndex ?? 0);
                    }}
                    aria-label="Abrir galería completa"
                  >
                    {vm.media?.photoCount ?? 0} fotos
                  </button>
                ) : null}
              </div>
              {vm.media?.heroCaption ? (
                <p className="mt-2 px-0.5 text-xs font-medium leading-snug sm:text-sm" style={{ color: MUTED }}>
                  {vm.media.heroCaption}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:col-span-5">
              {[gTopA, gTopB].map((spec, idx) => (
                <div key={idx} className="relative min-h-0 overflow-hidden rounded-2xl border shadow-md" style={{ borderColor: BORDER }}>
                  {!spec ? (
                    <div className="aspect-[4/3] w-full">
                      <EmptyMedia
                        title={idx === 0 ? "Medio 1" : "Medio 2"}
                        subtitle="Ranura de galería."
                        icon={<IconHome className="h-6 w-6" />}
                      />
                    </div>
                  ) : spec.kind === "photo" ? (
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() => openGallery(photoIndexInGallery(vm, spec.url))}
                      aria-label="Abrir foto en galería"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={spec.url} alt="" className="aspect-[4/3] w-full object-cover" />
                    </button>
                  ) : (
                    <div className="relative aspect-[4/3] w-full">
                      <GalleryVideoTile index={spec.slot} vm={vm} />
                      <button
                        type="button"
                        className="absolute right-2 top-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-md sm:text-[11px]"
                        style={{ borderColor: BORDER, background: "rgba(253,251,247,0.95)", color: CHARCOAL_DEEP }}
                        onClick={() => openGallery(gallerySlideIndexForVideo(spec.slot))}
                      >
                        Galería
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {vm.media?.virtualTourUrl ? (
                <a
                  href={vm.media.virtualTourUrl}
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
              ) : (
                <div
                  className="flex min-h-[120px] flex-col justify-center gap-2 rounded-2xl border px-4 py-3 shadow-sm sm:min-h-[130px]"
                  style={{ borderColor: BORDER, background: "rgba(249,246,241,0.85)" }}
                >
                  <IconVr className="shrink-0 opacity-60" style={{ color: BRONZE }} />
                  <p className="text-sm font-bold" style={{ color: MUTED }}>
                    Tour virtual
                  </p>
                  <p className="text-xs" style={{ color: MUTED }}>
                    No disponible en este anuncio.
                  </p>
                </div>
              )}
              {vm.location.mapsUrl ? (
                <a
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
              ) : vm.media?.floorPlanUrls?.[0] ? (
                <div className="overflow-hidden rounded-2xl border shadow-md" style={{ borderColor: BORDER }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={vm.media.floorPlanUrls[0]!} alt="" className="aspect-[4/3] w-full object-cover" />
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                    Plano de planta
                  </p>
                </div>
              ) : vm.media?.hasSitePlan && vm.media?.sitePlanUrl ? (
                <div className="overflow-hidden rounded-2xl border shadow-md" style={{ borderColor: BORDER }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={vm.media.sitePlanUrl} alt="" className="aspect-[4/3] w-full object-contain bg-white" />
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                    Plano de sitio
                  </p>
                </div>
              ) : (
                <div
                  className="flex min-h-[120px] flex-col justify-center gap-2 rounded-2xl border px-4 py-3 shadow-sm sm:min-h-[130px]"
                  style={{ borderColor: BORDER, background: CREAM_CARD }}
                >
                  <span style={{ color: BRONZE }}>
                    <IconFloor className="block h-6 w-6" />
                  </span>
                  <p className="text-sm font-bold" style={{ color: CHARCOAL }}>
                    Plano / mapa
                  </p>
                  <p className="text-xs" style={{ color: MUTED }}>
                    Sin plano ni enlace de mapa en este anuncio.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-6 border-t pt-7 lg:grid-cols-[1fr_minmax(280px,340px)] lg:items-start lg:gap-8" style={{ borderColor: BORDER }}>
          <div>
            <h1
              className="max-w-[720px] text-[1.75rem] font-bold leading-[1.15] tracking-tight sm:text-[2rem] lg:text-[2.35rem]"
              style={{ color: CHARCOAL_DEEP, fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {vm.heroTitle}
            </h1>
            <p className="mt-2.5 flex items-start gap-2 text-sm font-medium leading-snug" style={{ color: MUTED }}>
              <span className="mt-0.5 shrink-0" style={{ color: BRONZE }}>
                <IconPin className="block" />
              </span>
              {vm.addressLine}
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2.5">
              <span className="text-3xl font-bold tracking-tight sm:text-[2.5rem]" style={{ color: BRONZE, fontFamily: "Georgia, serif" }}>
                {vm.priceDisplay}
              </span>
              <span
                className="mb-1 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ borderColor: `${BRONZE}55`, background: "rgba(197, 160, 89, 0.12)", color: BRONZE_SOFT }}
              >
                {vm.listingStatusLabel}
              </span>
            </div>
            {vm.operationSummary ? (
              <p className="mt-1.5 text-xs font-medium" style={{ color: MUTED }}>
                {vm.operationSummary}
              </p>
            ) : null}

            <div
              className="mt-5 flex flex-wrap gap-2 rounded-2xl border p-3 sm:gap-2.5 sm:p-3.5"
              style={{ borderColor: BORDER, background: CREAM_CARD, boxShadow: "0 10px 36px -16px rgba(42,36,22,0.12)" }}
            >
              {quickFacts.map(({ Icon, label, value }, qfIdx) => (
                <div
                  key={`${label}-${qfIdx}`}
                  className="flex min-w-[112px] flex-1 items-center gap-2 rounded-lg border px-2.5 py-2 sm:min-w-[128px]"
                  style={{ borderColor: BORDER }}
                >
                  <span style={{ color: BRONZE }} className="shrink-0">
                    <Icon className="block h-[18px] w-[18px] sm:h-5 sm:w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                      {label}
                    </p>
                    <p className="truncate text-sm font-bold" style={{ color: CHARCOAL }}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside
            className="rounded-2xl border p-5 shadow-[0_16px_44px_-12px_rgba(42,36,22,0.15)] lg:sticky lg:top-6 lg:self-start"
            style={{ borderColor: BORDER, background: CREAM_CARD }}
          >
            <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: BORDER }}>
              {vm.seller.hasPhoto && vm.seller.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vm.seller.photoUrl}
                  alt=""
                  className="aspect-[4/5] w-full max-h-[min(340px,44vh)] object-cover object-top sm:max-h-[360px]"
                />
              ) : (
                <div className="aspect-[4/5] w-full max-h-[min(260px,36vh)]">
                  <EmptyMedia
                    title="Foto del vendedor"
                    subtitle="Opcional en el formulario de particulares."
                    icon={<IconEye className="h-6 w-6" />}
                  />
                </div>
              )}
            </div>
            <p className="mt-4 text-lg font-bold leading-tight" style={{ color: CHARCOAL_DEEP }}>
              {vm.seller.name}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: BRONZE_SOFT }}>
              {vm.seller.byOwnerLabel}
            </p>
            {vm.seller.noteLine ? (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: MUTED }}>
                {vm.seller.noteLine}
              </p>
            ) : null}
            <div className="mt-4 space-y-2 border-t pt-4 text-sm" style={{ borderColor: BORDER }}>
              {vm.seller.phoneDisplay ? (
                <p className="font-medium" style={{ color: CHARCOAL }}>
                  {vm.seller.phoneDisplay}
                </p>
              ) : null}
              {vm.seller.whatsappDisplay ? (
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
                  WhatsApp
                </p>
              ) : null}
              {vm.seller.whatsappDisplay ? <p style={{ color: CHARCOAL }}>{vm.seller.whatsappDisplay}</p> : null}
              {vm.seller.emailDisplay ? (
                <p className="truncate text-sm opacity-90" style={{ color: CHARCOAL }}>
                  {vm.seller.emailDisplay}
                </p>
              ) : null}
            </div>
          </aside>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1fr_1fr_minmax(280px,340px)] lg:items-stretch lg:gap-5">
          <FactBlock title="Detalles de la propiedad" rows={vm.propertyDetailsRows} />
          {vm.hasHighlights ? (
            <FactBlock title="Características destacadas" rows={vm.highlightsRows ?? []} />
          ) : (
            <div
              className="rounded-2xl border p-5 sm:p-6 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)]"
              style={{ borderColor: BORDER, background: CREAM_CARD }}
            >
              <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
                Características destacadas
              </h3>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: MUTED }}>
                Sin elementos destacados en este anuncio.
              </p>
            </div>
          )}
          <aside className="flex min-h-full flex-col lg:sticky lg:top-8 lg:min-h-0 lg:self-start">
            <div
              className="flex flex-1 flex-col overflow-hidden rounded-2xl border shadow-[0_24px_64px_-20px_rgba(26,24,20,0.35)]"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="px-5 py-3.5" style={{ background: CHARCOAL_DEEP }}>
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
              <div className="flex flex-1 flex-col space-y-3 px-5 py-5" style={{ background: "#2F2A24" }}>
                {vm.contact.showSolicitarInfo && vm.contact.solicitarInfoHref ? (
                  <a
                    href={vm.contact.solicitarInfoHref}
                    className="flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-bold text-[#1E1810] shadow-md transition hover:brightness-105"
                    style={{ background: `linear-gradient(180deg, ${BRONZE} 0%, ${BRONZE_SOFT} 100%)` }}
                  >
                    Solicitar información
                  </a>
                ) : null}
                {vm.contact.showLlamar && vm.contact.llamarHref ? (
                  <a
                    href={vm.contact.llamarHref}
                    className="flex w-full items-center justify-center rounded-xl border py-3 text-sm font-semibold text-[#F5F0E8] transition hover:bg-white/5"
                    style={{ borderColor: "rgba(245,240,232,0.25)" }}
                  >
                    Llamar ahora
                  </a>
                ) : null}
                {vm.contact.showWhatsapp && vm.contact.whatsappHref ? (
                  <a
                    href={vm.contact.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-xl border py-3 text-sm font-semibold text-[#E8F5E9] transition hover:bg-white/5"
                    style={{ borderColor: "rgba(37,211,102,0.35)" }}
                  >
                    Enviar por WhatsApp
                  </a>
                ) : null}
              </div>
              <div className="space-y-3 border-t px-5 py-4" style={{ borderColor: "rgba(255,255,255,0.08)", background: "#3A342E" }}>
                <div className="flex gap-3 rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  {vm.seller.hasPhoto && vm.seller.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={vm.seller.photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="h-11 w-11 shrink-0 rounded-full bg-[#5c5348]" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#F5F0E8]">{vm.seller.name}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#c4b8a8]">{vm.seller.byOwnerLabel}</p>
                    {vm.seller.phoneDisplay ? <p className="mt-1 text-xs text-[#e8dfd4]">{vm.seller.phoneDisplay}</p> : null}
                    {vm.seller.emailDisplay ? (
                      <p className="mt-0.5 truncate text-xs text-[#e8dfd4]">{vm.seller.emailDisplay}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-8">
          <div
            className="rounded-2xl border p-6 sm:p-7 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)]"
            style={{ borderColor: BORDER, background: CREAM_CARD }}
          >
            <h2 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
              Descripción
            </h2>
            {vm.hasDescription ? (
              <p className="mt-5 whitespace-pre-wrap text-sm leading-[1.75]" style={{ color: CHARCOAL }}>
                {vm.description}
              </p>
            ) : (
              <p className="mt-5 text-sm leading-[1.75]" style={{ color: MUTED }}>
                Sin descripción en este anuncio.
              </p>
            )}
          </div>
        </section>

        {vm.location.hasMeaningfulAddress ? (
          <section className="mt-14">
            <div className="text-center">
              <h2
                className="text-xl font-bold uppercase tracking-[0.12em] sm:text-2xl"
                style={{ color: CHARCOAL_DEEP, fontFamily: "Georgia, serif" }}
              >
                Ubicación
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm" style={{ color: MUTED }}>
                Referencia del anuncio (plantilla BR Privado).
              </p>
            </div>
            <div className="mx-auto mt-8 max-w-2xl">
              <LowerModuleCard eyebrow="Referencia" title="Ubicación aproximada" subtitle="Se refinará con el formulario de publicación.">
                {vm.location.line1 ? (
                  <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                    {vm.location.line1}
                  </p>
                ) : null}
                {vm.location.cityStateZip ? (
                  <p className="mt-1 text-sm" style={{ color: MUTED }}>
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

        {String(vm.footerNote ?? "").trim() || footerExtra ? (
          <footer className="mt-12 border-t pt-6 text-center text-xs" style={{ borderColor: BORDER, color: MUTED }}>
            {String(vm.footerNote ?? "").trim() ? <p>{vm.footerNote}</p> : null}
            {footerExtra ? <p className="mt-2 opacity-70">{footerExtra}</p> : null}
          </footer>
        ) : (
          <div className="mt-12 border-t pt-5" style={{ borderColor: BORDER }} aria-hidden />
        )}
      </main>

      <BrPrivadoGalleryLightbox vm={vm} open={galleryOpen} initialIndex={galleryIndex} onClose={() => setGalleryOpen(false)} />
    </div>
  );
}
