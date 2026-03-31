"use client";

import { useEffect, useRef } from "react";
import type {
  BienesRaicesNegocioPreviewVm,
  BienesRaicesPreviewQuickFactVm,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

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

function IconVr({ className }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function StreamableVideo({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const isHls = /\.m3u8(\?|$)/i.test(url);
    if (!isHls) {
      el.src = url;
      return () => {
        el.pause();
        el.removeAttribute("src");
      };
    }
    let cancelled = false;
    let hls: { destroy: () => void } | null = null;
    if (el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = url;
      return () => {
        el.pause();
        el.removeAttribute("src");
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
    });
    return () => {
      cancelled = true;
      hls?.destroy();
      const v = ref.current;
      if (v) {
        v.pause();
        v.removeAttribute("src");
      }
    };
  }, [url]);
  return <video ref={ref} controls playsInline className="aspect-[4/3] w-full object-cover" />;
}

function GalleryVideoTile({
  index,
  vm,
}: {
  index: 0 | 1;
  vm: BienesRaicesNegocioPreviewVm;
}) {
  const hasVideo = index === 0 ? vm.media.hasVideo1 : vm.media.hasVideo2;
  const thumb = vm.media.videoThumbUrls[index] ?? null;
  const playback = vm.media.videoPlaybackUrls[index] ?? null;
  const yt = vm.media.youtubeIds[index] ?? null;
  const watchUrl = yt ? `https://www.youtube.com/watch?v=${yt}` : playback ?? "";

  if (!hasVideo) {
    return (
      <div className="aspect-[4/3] w-full">
        <EmptyMedia
          title={`Video ${index + 1} (opcional)`}
          subtitle="Agrega un video en el formulario para activar este bloque."
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
        className="relative block overflow-hidden rounded-2xl border shadow-md"
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
          <StreamableVideo url={playback} />
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
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-black/80 text-center text-xs font-semibold text-white px-2">
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
      <EmptyMedia title={`Video ${index + 1}`} subtitle="Sin datos de vista previa para este video." icon={<IconPlay className="h-7 w-7" />} />
    </div>
  );
}

function LeonixMark() {
  return (
    <div className="flex flex-col items-center" aria-hidden>
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-sm"
        style={{ borderColor: BRONZE, background: CHARCOAL_DEEP }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    </div>
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

function FactBlock({ title, rows }: { title: string; rows: Array<{ label: string; value: string }> }) {
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)]"
      style={{ borderColor: BORDER, background: CREAM_CARD }}
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
        {title}
      </h3>
      <dl className="mt-4 grid gap-x-10 gap-y-5 sm:grid-cols-2">
        {rows.map((r) => (
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

function DeepSection({ icon, heading, items }: { icon: React.ReactNode; heading: string; items: string[] }) {
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6 shadow-[0_10px_36px_-14px_rgba(42,36,22,0.07)]"
      style={{ borderColor: BORDER, background: CREAM_CARD }}
    >
      <div className="flex items-start gap-3">
        <SectionIcon>{icon}</SectionIcon>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold tracking-tight" style={{ color: CHARCOAL }}>
            {heading}
          </h3>
          {items.length > 0 ? (
            <ul className="mt-4 space-y-2.5">
              {items.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: CHARCOAL }}>
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full" style={{ background: BRONZE }} aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-relaxed" style={{ color: MUTED }}>
              No proporcionado aún.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function deepIcon(id: string) {
  const c = "h-5 w-5";
  switch (id) {
    case "tipoYEstilo":
      return <IconHome className={c} />;
    case "construccion":
    case "loteTerreno":
    case "identificadores":
      return <IconRuler className={c} />;
    case "interior":
      return <IconBath className={c} />;
    case "exterior":
    case "escuelasUbicacion":
      return <IconPin className={c} />;
    case "estacionamiento":
      return <IconCar className={c} />;
    case "utilidades":
      return <IconSparkle className={c} />;
    case "comunidadHoa":
      return <IconHome className={c} />;
    case "financiera":
      return <IconCalendar className={c} />;
    case "observacionesAgente":
      return <IconEye className={c} />;
    default:
      return <IconHome className={c} />;
  }
}

export function BienesRaicesNegocioPreviewView({
  vm,
  editHref,
  footerExtra,
}: {
  vm: BienesRaicesNegocioPreviewVm;
  /** When set, shows a subtle link to return to the publish flow. */
  editHref?: string;
  footerExtra?: string;
}) {
  const quickFacts = vm.quickFacts.map((qf) => ({
    Icon: QUICK_FACT_ICONS[qf.icon] ?? IconSparkle,
    label: qf.label,
    value: qf.value,
  }));

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: IVORY, color: CHARCOAL }}>
      <header className="border-b" style={{ borderColor: BORDER, background: "rgba(253, 251, 247, 0.92)" }}>
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-5">
            <LeonixMark />
            <nav className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: MUTED }}>
              <span style={{ color: CHARCOAL }}>Bienes raíces</span>
              <span className="mx-2 opacity-40">›</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1" style={{ borderColor: BORDER, background: CREAM_CARD }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="opacity-75" aria-hidden style={{ color: CHARCOAL }}>
                  <rect x="5" y="9" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9 9V7a3 3 0 013-3h0a3 3 0 013 3v2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Negocio
              </span>
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {editHref ? (
              <a
                href={editHref}
                className="text-[11px] font-bold uppercase tracking-wide underline"
                style={{ color: BRONZE_SOFT }}
              >
                Volver a editar
              </a>
            ) : null}
            <div
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] shadow-sm"
              style={{ borderColor: BORDER, background: CREAM_CARD, color: BRONZE_SOFT }}
            >
              <IconEye className="shrink-0 opacity-80" />
              Vista previa del anuncio
            </div>
          </div>
        </div>
      </header>

      <div
        className="border-b"
        style={{ borderColor: BORDER, background: "linear-gradient(90deg, rgba(197,160,89,0.08), rgba(253,251,247,0.95))" }}
      >
        <div className="mx-auto flex max-w-[1240px] items-start gap-4 px-6 py-4 lg:px-8">
          <span className="mt-0.5 shrink-0" style={{ color: BRONZE }}>
            <IconSparkle className="block" />
          </span>
          <p className="max-w-3xl text-sm leading-relaxed" style={{ color: CHARCOAL }}>
            Así es como se verá tu anuncio en Leonix. Puedes seguir editando antes de publicar.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-[1240px] px-6 pb-20 pt-10 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[1fr_minmax(280px,340px)] lg:items-start lg:gap-12">
          <div>
            <h1
              className="max-w-[720px] text-[1.65rem] font-bold leading-tight tracking-tight sm:text-3xl lg:text-[2.1rem]"
              style={{ color: CHARCOAL_DEEP, fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {vm.heroTitle}
            </h1>
            <p className="mt-4 flex items-start gap-2 text-sm font-medium" style={{ color: MUTED }}>
              <span className="mt-0.5 shrink-0" style={{ color: BRONZE }}>
                <IconPin className="block" />
              </span>
              {vm.addressLine}
            </p>
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <span className="text-4xl font-bold tracking-tight sm:text-[2.75rem]" style={{ color: BRONZE, fontFamily: "Georgia, serif" }}>
                {vm.priceDisplay}
              </span>
              <span
                className="mb-1 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ borderColor: `${BRONZE}55`, background: "rgba(197, 160, 89, 0.12)", color: BRONZE_SOFT }}
              >
                {vm.listingStatusLabel}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium" style={{ color: MUTED }}>
              {vm.operationSummary}
            </p>

            <div
              className="mt-8 flex flex-wrap gap-3 rounded-2xl border p-4 sm:gap-4 sm:p-5"
              style={{ borderColor: BORDER, background: CREAM_CARD, boxShadow: "0 16px 48px -20px rgba(42,36,22,0.12)" }}
            >
              {quickFacts.map(({ Icon, label, value }) => (
                <div
                  key={label}
                  className="flex min-w-[140px] flex-1 items-center gap-3 rounded-xl border px-3 py-2.5 sm:px-4"
                  style={{ borderColor: BORDER }}
                >
                  <span style={{ color: BRONZE }} className="shrink-0">
                    <Icon className="block" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                      {label}
                    </p>
                    <p className="text-sm font-bold" style={{ color: CHARCOAL }}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside
            className="rounded-2xl border p-5 shadow-[0_20px_56px_-16px_rgba(42,36,22,0.18)]"
            style={{ borderColor: BORDER, background: CREAM_CARD }}
          >
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: BORDER }}>
              {vm.identity.hasPhoto && vm.identity.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vm.identity.photoUrl} alt="" className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="aspect-[4/3] w-full">
                  <EmptyMedia
                    title="Sin foto de identidad"
                    subtitle="Agrega una foto o logo en el formulario para mostrarlo aquí."
                    icon={<IconEye className="h-6 w-6" />}
                  />
                </div>
              )}
            </div>
            <p className="mt-4 text-lg font-bold" style={{ color: CHARCOAL_DEEP }}>
              {vm.identity.name}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: BRONZE_SOFT }}>
              {vm.identity.role}
            </p>
            <div className="mt-4 rounded-xl border px-3 py-3" style={{ borderColor: BORDER, background: "rgba(249,246,241,0.6)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>
                Inmobiliaria
              </p>
              <p className="mt-1 text-sm font-bold" style={{ color: CHARCOAL }}>
                {vm.identity.brokerageName}
              </p>
            </div>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: MUTED }}>
              <span className="font-semibold" style={{ color: CHARCOAL }}>
                {vm.identity.verifiedLine}
              </span>
              {vm.identity.licenseLine ? (
                <>
                  <br />
                  {vm.identity.licenseLine}
                </>
              ) : null}
            </p>
            {vm.identity.socialChips.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {vm.identity.socialChips.map((s) => (
                  <span
                    key={s}
                    className="flex h-8 min-w-[2rem] items-center justify-center rounded-full border px-2 text-[10px] font-bold"
                    style={{ borderColor: BORDER, color: CHARCOAL }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              className="mt-5 w-full rounded-xl border-2 py-3 text-xs font-bold uppercase tracking-wide transition hover:bg-[rgba(197,160,89,0.08)]"
              style={{ borderColor: BRONZE, color: BRONZE_SOFT }}
            >
              {vm.identity.profileCtaLabel}
            </button>
          </aside>
        </section>

        <section className="mt-14">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-bold" style={{ color: CHARCOAL_DEEP }}>
              Galería multimedia
            </h2>
            <p className="text-xs font-medium" style={{ color: MUTED }}>
              {vm.media.metaLine}
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-12 lg:gap-4">
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-2xl border shadow-lg" style={{ borderColor: BORDER }}>
                {vm.media.hasPhotos && vm.media.heroUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vm.media.heroUrl} alt="" className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="aspect-[16/10] w-full">
                    <EmptyMedia
                      title="Sin fotos aún"
                      subtitle="Agrega al menos una foto para activar la galería del anuncio."
                      icon={<IconHome className="h-7 w-7" />}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:col-span-5">
              {([0, 1] as const).map((i) => (
                <div key={i} className="relative" style={{ borderColor: BORDER }}>
                  <GalleryVideoTile index={i} vm={vm} />
                </div>
              ))}
              {vm.media.virtualTourUrl ? (
                <a
                  href={vm.media.virtualTourUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-2 flex min-h-[140px] items-center gap-4 rounded-2xl border px-5 py-4 text-white shadow-md sm:min-h-[160px]"
                  style={{
                    borderColor: "rgba(26,39,68,0.4)",
                    background: "linear-gradient(135deg, #1a2744 0%, #243a5e 50%, #1e3050 100%)",
                  }}
                >
                  <IconVr className="shrink-0 opacity-95" />
                  <div>
                    <p className="text-sm font-bold">Tour virtual 3D</p>
                    <p className="mt-1 text-xs opacity-80">Abrir recorrido en una nueva pestaña</p>
                  </div>
                </a>
              ) : (
                <div
                  className="col-span-2 flex min-h-[140px] items-center gap-4 rounded-2xl border px-5 py-4 text-white shadow-md opacity-80 sm:min-h-[160px]"
                  style={{
                    borderColor: "rgba(26,39,68,0.4)",
                    background: "linear-gradient(135deg, #1a2744 0%, #243a5e 50%, #1e3050 100%)",
                  }}
                >
                  <IconVr className="shrink-0 opacity-95" />
                  <div>
                    <p className="text-sm font-bold">Tour virtual</p>
                    <p className="mt-1 text-xs opacity-80">No proporcionado aún. Agrega un enlace en el formulario para activarlo.</p>
                  </div>
                </div>
              )}
              <div
                className="col-span-2 flex min-h-[140px] items-center gap-4 rounded-2xl border px-5 py-4 shadow-md sm:min-h-[160px]"
                style={{ borderColor: BORDER, background: CREAM_CARD }}
              >
                <span style={{ color: BRONZE }}>
                  <IconFloor className="block" />
                </span>
                <div>
                  <p className="text-sm font-bold" style={{ color: CHARCOAL }}>
                    {vm.media.floorPlanUrls[0] ? "Plano de planta" : "Planos de planta"}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: MUTED }}>
                    {vm.media.floorPlanUrls.length > 0
                      ? "Vista previa del primer plano cargado."
                      : "No proporcionado aún. Agrega planos en el formulario para activar este bloque."}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {vm.media.floorPlanUrls.length > 0 ? (
            <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: BORDER }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vm.media.floorPlanUrls[0]!} alt="" className="max-h-64 w-full object-contain" />
            </div>
          ) : null}
          {vm.media.hasSitePlan && vm.media.sitePlanUrl ? (
            <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: BORDER }}>
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                Plano de sitio / comunidad
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vm.media.sitePlanUrl} alt="" className="max-h-64 w-full object-contain bg-white" />
            </div>
          ) : null}
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-10">
          <div className="space-y-6">
            <FactBlock title="Detalles de la propiedad" rows={vm.propertyDetailsRows} />
            {vm.hasHighlights ? <FactBlock title="Características destacadas" rows={vm.highlightsRows} /> : null}
            <div
              className="rounded-2xl border p-6 sm:p-8 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)]"
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
                  No proporcionada aún. Agrega una descripción en el formulario para mostrarla aquí.
                </p>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-8">
            <div
              className="overflow-hidden rounded-2xl border shadow-[0_24px_64px_-20px_rgba(26,24,20,0.35)]"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="px-5 py-4" style={{ background: CHARCOAL_DEEP }}>
                <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#F5F0E8]">{vm.contactRailTitle}</p>
              </div>
              <div className="space-y-3 px-5 py-5" style={{ background: "#2F2A24" }}>
                {vm.contact.showSolicitarInfo ? (
                  <button
                    type="button"
                    className="w-full rounded-xl py-3.5 text-sm font-bold text-[#1E1810] shadow-md transition hover:brightness-105"
                    style={{ background: `linear-gradient(180deg, ${BRONZE} 0%, ${BRONZE_SOFT} 100%)` }}
                  >
                    Solicitar información
                  </button>
                ) : null}
                {vm.contact.showProgramarVisita ? (
                  <button
                    type="button"
                    className="w-full rounded-xl border py-3 text-sm font-semibold text-[#F5F0E8] transition hover:bg-white/5"
                    style={{ borderColor: "rgba(245,240,232,0.25)" }}
                  >
                    Programar visita
                  </button>
                ) : null}
                {vm.contact.showLlamar ? (
                  <button
                    type="button"
                    className="w-full rounded-xl border py-3 text-sm font-semibold text-[#F5F0E8] transition hover:bg-white/5"
                    style={{ borderColor: "rgba(245,240,232,0.25)" }}
                  >
                    Llamar ahora
                  </button>
                ) : null}
                {vm.contact.showWhatsapp ? (
                  <button
                    type="button"
                    className="w-full rounded-xl border py-3 text-sm font-semibold text-[#E8F5E9] transition hover:bg-white/5"
                    style={{ borderColor: "rgba(37,211,102,0.35)" }}
                  >
                    Enviar por WhatsApp
                  </button>
                ) : null}
              </div>
              <div className="space-y-3 border-t px-5 py-4" style={{ borderColor: "rgba(255,255,255,0.08)", background: "#3A342E" }}>
                {vm.contact.secondAgent ? (
                  <div className="flex gap-3 rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    {vm.contact.secondAgent.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={vm.contact.secondAgent.photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="h-11 w-11 shrink-0 rounded-full bg-[#5c5348]" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#F5F0E8]">{vm.contact.secondAgent.name}</p>
                      <p className="text-[10px] uppercase tracking-wide text-[#c4b8a8]">{vm.contact.secondAgent.role}</p>
                      <p className="mt-1 text-xs text-[#e8dfd4]">{vm.contact.secondAgent.phone}</p>
                    </div>
                  </div>
                ) : null}
                {vm.contact.lender ? (
                  <div className="flex gap-3 rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    {vm.contact.lender.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={vm.contact.lender.photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="h-11 w-11 shrink-0 rounded-full bg-[#5c5348]" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#F5F0E8]">{vm.contact.lender.name}</p>
                      <p className="text-[10px] uppercase tracking-wide text-[#c4b8a8]">{vm.contact.lender.role}</p>
                      <p className="mt-1 text-xs text-[#e8dfd4]">{vm.contact.lender.subtitle}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-20">
          <div className="mb-10 text-center">
            <h2
              className="text-xl font-bold uppercase tracking-[0.12em] sm:text-2xl"
              style={{ color: CHARCOAL_DEEP, fontFamily: "Georgia, serif" }}
            >
              Detalles completos del inmueble
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm" style={{ color: MUTED }}>
              Ficha técnica organizada: lo que captures en el formulario se refleja aquí.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {vm.deepBlocks.map((b) => (
              <DeepSection key={b.id} icon={deepIcon(b.id)} heading={b.heading} items={b.bullets} />
            ))}
          </div>
        </section>

        <footer className="mt-16 border-t pt-8 text-center text-xs" style={{ borderColor: BORDER, color: MUTED }}>
          <p>{vm.footerNote}</p>
          {footerExtra ? <p className="mt-2 opacity-70">{footerExtra}</p> : null}
        </footer>
      </main>
    </div>
  );
}
