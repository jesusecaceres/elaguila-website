"use client";

import { useState, type CSSProperties } from "react";
import type {
  BienesRaicesNegocioPreviewVm,
  BienesRaicesPreviewQuickFactVm,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import {
  leonixGalleryPhotoSlidesWithCaptions,
  leonixSlideIndexForCoverPhoto,
  leonixSlideIndexForPhotoUrl,
  leonixSlideIndexForVideoSlot,
} from "@/app/clasificados/lib/leonixGallerySlides";
import { LeonixPreviewGalleryLightbox } from "@/app/clasificados/lib/LeonixPreviewGalleryLightbox";
import { LeonixPreviewGalleryVideoTile } from "@/app/clasificados/lib/leonixPreviewGalleryVideoTile";
import { LeonixPreviewQuickFactsStrip } from "@/app/clasificados/lib/leonixPrivadoPreviewQuickFacts";
import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";
import { RENTAS_RESIDENCIAL_HIGHLIGHT_FORM_VISUAL } from "@/app/clasificados/rentas/shared/rentasResidencialHighlightFormVisuals";
import { RENTAS_SERVICIOS_INCLUIDOS_DEFS } from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";

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
      <dl className="mt-4 grid gap-x-4 gap-y-5 sm:grid-cols-2 sm:gap-x-10">
        {safeRows.map((r) => (
          <div key={`${r.label}-${r.value}`}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
              {r.label}
            </dt>
            <dd className="mt-1 whitespace-pre-line text-sm font-medium leading-snug" style={{ color: CHARCOAL }}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function FactRowsList({ rows }: { rows: Array<{ label: string; value: string }> | undefined }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return (
    <dl className="grid gap-x-4 gap-y-4 sm:grid-cols-2 sm:gap-x-8">
      {safeRows.map((r) => (
        <div key={`${r.label}-${r.value}`}>
          <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
            {r.label}
          </dt>
          <dd className="mt-1 whitespace-pre-line text-sm font-medium leading-snug" style={{ color: CHARCOAL }}>
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
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

function communityModuleTitle(pub: BienesRaicesNegocioPreviewVm["publicationType"]): string {
  if (pub === "proyecto_nuevo") return "Comunidad y proyecto";
  if (pub === "comercial") return "Entorno comercial";
  if (pub === "terreno") return "Contexto del terreno";
  if (pub === "multifamiliar_inversion") return "Vecindario y comunidad";
  return "Vecindario y movilidad";
}

function DeepSection({ icon, heading, items }: { icon: React.ReactNode; heading: string; items: string[] | undefined }) {
  const lines = Array.isArray(items) ? items : [];
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
          {lines.length > 0 ? (
            <ul className="mt-4 space-y-2.5">
              {lines.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: CHARCOAL }}>
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full" style={{ background: BRONZE }} aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-relaxed" style={{ color: MUTED }}>
              Sin datos en este bloque.
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

type GalleryTopSpec = { kind: "photo"; url: string } | { kind: "video"; slot: 0 | 1 } | { kind: "more" };

/** Video slots take priority in the top 2×2 so destacados no desplazan el video cuando hay muchas fotos. */
function galleryTopCells(vm: BienesRaicesNegocioPreviewVm): [GalleryTopSpec | null, GalleryTopSpec | null, GalleryTopSpec | null, GalleryTopSpec | null] {
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
  const videoSlot: 0 | 1 | null = m?.hasVideo1 ? 0 : m?.hasVideo2 ? 1 : null;
  const topLeft = (() => {
    const u = nextPhoto();
    return u ? ({ kind: "photo", url: u } as const) : null;
  })();
  const topRight = (() => {
    const u = nextPhoto();
    return u ? ({ kind: "photo", url: u } as const) : null;
  })();
  const bottomLeft = (() => {
    const u = nextPhoto();
    return u ? ({ kind: "photo", url: u } as const) : null;
  })();
  const bottomRight = videoSlot != null
    ? ({ kind: "video", slot: videoSlot } as const)
    : (() => {
        const u = nextPhoto();
        if (u) return { kind: "photo", url: u } as const;
        return null;
      })();
  return [topLeft, topRight, bottomLeft, bottomRight];
}

function splitCsvAndBullets(value: string): string[] {
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  const normalized = raw.replace(/^•\s*/gm, "").replace(/\n/g, ",");
  return normalized
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

const SERVICIOS_EMOJI_BY_LABEL = new Map(
  RENTAS_SERVICIOS_INCLUIDOS_DEFS.map((s) => [s.label.toLowerCase(), s.emoji] as const),
);

function servicioChipText(label: string): string {
  const t = String(label ?? "").trim();
  if (!t) return "";
  const emoji = SERVICIOS_EMOJI_BY_LABEL.get(t.toLowerCase());
  return emoji ? `${emoji} ${t}` : `✨ ${t}`;
}

function groupedRentasRows(rows: Array<{ label: string; value: string }> | undefined) {
  const list = Array.isArray(rows) ? rows : [];
  const byLabel = new Map(list.map((r) => [r.label, r.value] as const));
  const pick = (label: string) => {
    const v = byLabel.get(label);
    if (!v || !String(v).trim()) return null;
    return { label, value: String(v).trim() };
  };
  return {
    resumen: [
      pick("Renta mensual"),
      pick("Depósito"),
      pick("Plazo del contrato"),
      pick("Disponibilidad"),
      pick("Estado del anuncio"),
    ].filter((x): x is { label: string; value: string } => x != null),
    caracteristicas: [
      pick("Tipo"),
      pick("Subtipo"),
      pick("Recámaras"),
      pick("Baños completos"),
      pick("Medios baños"),
      pick("Interior (ft²)"),
      pick("Lote (ft²)"),
      pick("Estacionamiento"),
      pick("Año de construcción"),
      pick("Condición"),
      pick("Amueblado"),
      pick("Mascotas"),
      pick("Zona o vecindario"),
    ].filter((x): x is { label: string; value: string } => x != null),
    servicios: splitCsvAndBullets(String(byLabel.get("Servicios incluidos") ?? "")),
    requisitos: String(byLabel.get("Requisitos") ?? "").trim(),
  };
}

const HIGHLIGHT_LABEL_TO_EMOJI = new Map(
  BR_HIGHLIGHT_PRESET_DEFS.map((d) => [d.label.toLowerCase(), RENTAS_RESIDENCIAL_HIGHLIGHT_FORM_VISUAL[d.key]] as const),
);

function highlightChipText(label: string): string {
  const t = String(label ?? "").trim();
  if (!t) return "";
  const e = HIGHLIGHT_LABEL_TO_EMOJI.get(t.toLowerCase());
  return e ? `${e} ${t}` : t;
}

/** Dark contact + ubicación card (Rentas-style) — reused beside hero on duplex layout. */
function BienesRaicesNegocioDarkContactAside({
  vm,
  onContactLinkClick,
}: {
  vm: BienesRaicesNegocioPreviewVm;
  onContactLinkClick?: () => void;
}) {
  const track = () => onContactLinkClick?.();
  return (
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
        {vm.contact.horarioPreferidoLine || vm.contact.openHouseSummary ? (
          <div
            className="border-b px-5 py-3 text-xs leading-relaxed text-[#d8cfc3]"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "#2F2A24" }}
          >
            {vm.contact.horarioPreferidoLine ? (
              <p>
                <span className="font-semibold text-[#F5F0E8]">Horario preferido</span>
                <span className="mt-1 block text-[#d8cfc3]">{vm.contact.horarioPreferidoLine}</span>
              </p>
            ) : null}
            {vm.contact.openHouseSummary ? (
              <p className={vm.contact.horarioPreferidoLine ? "mt-3" : ""}>
                <span className="font-semibold text-[#F5F0E8]">Open house</span>
                <span className="mt-1 block whitespace-pre-line text-[#d8cfc3]">{vm.contact.openHouseSummary}</span>
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-1 flex-col space-y-3 px-5 py-5" style={{ background: "#2F2A24" }}>
          <p className="text-sm font-bold text-[#F5F0E8]">{vm.identity.name}</p>
          {vm.identity.bioLine ? <p className="text-xs leading-relaxed text-[#D8CFC3]">{vm.identity.bioLine}</p> : null}
          {vm.contact.showSolicitarInfo && vm.contact.solicitarInfoHref ? (
            <a
              href={vm.contact.solicitarInfoHref}
              onClick={track}
              className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-xl px-3 py-3.5 text-center text-sm font-bold text-[#1E1810] shadow-md transition hover:brightness-105"
              style={{ background: `linear-gradient(180deg, ${BRONZE} 0%, ${BRONZE_SOFT} 100%)` }}
            >
              Solicitar información
            </a>
          ) : null}
          {vm.contact.showProgramarVisita && vm.contact.programarVisitaHref ? (
            <a
              href={vm.contact.programarVisitaHref}
              onClick={track}
              className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-xl border px-3 py-3 text-center text-sm font-semibold text-[#F5F0E8] transition hover:bg-white/5"
              style={{ borderColor: "rgba(245,240,232,0.25)" }}
            >
              Programar visita
            </a>
          ) : null}
          {vm.contact.showLlamar && vm.contact.llamarHref ? (
            <a
              href={vm.contact.llamarHref}
              onClick={track}
              className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-xl border px-3 py-3 text-center text-sm font-semibold text-[#F5F0E8] transition hover:bg-white/5"
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
              onClick={track}
              className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-xl border px-3 py-3 text-center text-sm font-semibold text-[#E8F5E9] transition hover:bg-white/5"
              style={{ borderColor: "rgba(37,211,102,0.35)" }}
            >
              Enviar por WhatsApp
            </a>
          ) : null}
          {vm.contact.showSms && vm.contact.smsHref ? (
            <a
              href={vm.contact.smsHref}
              onClick={track}
              className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-xl border px-3 py-3 text-center text-sm font-semibold text-[#E3F2FD] transition hover:bg-white/5"
              style={{ borderColor: "rgba(100,181,246,0.45)" }}
            >
              Enviar texto
            </a>
          ) : null}
          {(vm.location.line1 || vm.location.colonia || vm.location.cityStateZip || vm.location.mapsUrl) ? (
            <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#E8DFD4]">Ubicación</p>
              {vm.location.line1 ? <p className="mt-1 text-xs text-[#F5F0E8]">{vm.location.line1}</p> : null}
              {vm.location.colonia ? <p className="mt-1 text-xs text-[#D8CFC3]">{vm.location.colonia}</p> : null}
              {vm.location.cityStateZip ? <p className="mt-1 text-xs text-[#D8CFC3]">{vm.location.cityStateZip}</p> : null}
              {vm.location.mapsUrl ? (
                <a
                  href={vm.location.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={track}
                  className="mt-3 inline-flex rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-[#F5F0E8]"
                  style={{ borderColor: "rgba(255,255,255,0.35)" }}
                >
                  Ver en mapa
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="space-y-3 border-t px-5 py-4" style={{ borderColor: "rgba(255,255,255,0.08)", background: "#3A342E" }}>
          {vm.identity.contactPhone || vm.identity.contactEmail ? (
            <div className="flex gap-3 rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              {vm.identity.hasPhoto && vm.identity.photoUrl ? (
                <img src={vm.identity.photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="h-11 w-11 shrink-0 rounded-full bg-[#5c5348]" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#F5F0E8]">{vm.identity.name}</p>
                {vm.identity.contactPhone ? <p className="mt-1 text-xs text-[#e8dfd4]">{vm.identity.contactPhone}</p> : null}
                {vm.identity.contactEmail ? (
                  <p className="mt-0.5 truncate text-xs text-[#e8dfd4]">{vm.identity.contactEmail}</p>
                ) : null}
              </div>
            </div>
          ) : null}
          {vm.contact.secondAgent ? (
            <div className="flex gap-3 rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              {vm.contact.secondAgent.photoUrl ? (
                <img src={vm.contact.secondAgent.photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="h-11 w-11 shrink-0 rounded-full bg-[#5c5348]" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#F5F0E8]">{vm.contact.secondAgent.name}</p>
                <p className="text-[10px] uppercase tracking-wide text-[#c4b8a8]">{vm.contact.secondAgent.role}</p>
                <p className="mt-1 text-xs text-[#e8dfd4]">{vm.contact.secondAgent.phone}</p>
                {vm.contact.secondAgent.emailLine ? (
                  <p className="mt-0.5 truncate text-xs text-[#e8dfd4]">{vm.contact.secondAgent.emailLine}</p>
                ) : null}
                {vm.contact.secondAgent.bioLine ? (
                  <p className="mt-2 text-[11px] leading-snug text-[#d8cfc3]">{vm.contact.secondAgent.bioLine}</p>
                ) : null}
              </div>
            </div>
          ) : null}
          {vm.contact.lender ? (
            <div className="flex gap-3 rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              {vm.contact.lender.photoUrl ? (
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
  );
}

/** Publishable ad canvas only — chrome (“Volver a editar”) lives in `LeonixPreviewPageShell`. */
export function BienesRaicesNegocioPreviewView({
  vm,
  rentasPolishedDuplexLayout = false,
  onContactLinkClick,
}: {
  vm: BienesRaicesNegocioPreviewVm;
  /** When true, places the dark contact card beside the hero stack (Rentas) and omits legacy duplicate detail grids. */
  rentasPolishedDuplexLayout?: boolean;
  onContactLinkClick?: () => void;
}) {
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
  const [gTopA, gTopB, gBottomA, gBottomB] = galleryTopCells(vm);
  const sidebarGallerySpecsNegocio: Array<GalleryTopSpec | null> = [gTopA, gTopB, gBottomA, gBottomB];
  const hasSidebarMediaNegocio = sidebarGallerySpecsNegocio.some((s) => s != null);
  const grouped = groupedRentasRows(vm.propertyDetailsRows);

  const dedupedPhotoSlides = leonixGalleryPhotoSlidesWithCaptions(vm.media?.allPhotoUrls, vm.media?.photoCaptionsFull);
  const uniquePhotoCount = dedupedPhotoSlides.length;
  const galleryMetaLine =
    uniquePhotoCount > 0
      ? `${uniquePhotoCount} foto${uniquePhotoCount === 1 ? "" : "s"} en la galería`
      : String(vm.media?.metaLine ?? "").trim();

  return (
    <div className="w-full min-w-0 max-w-[100vw] overflow-x-hidden antialiased" style={{ backgroundColor: IVORY, color: CHARCOAL }}>
      <main className="mx-auto max-w-[1240px] min-w-0 px-4 pb-[max(4rem,env(safe-area-inset-bottom,0px))] pt-3 sm:px-6 sm:pb-16 sm:pt-4 lg:px-8">
        <section className="mb-0" id="galeria-multimedia">
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="flex items-center gap-2">
              <SectionIcon>
                <IconHome className="h-4 w-4" />
              </SectionIcon>
              <h2 className="text-base font-bold sm:text-lg" style={{ color: CHARCOAL_DEEP }}>
                Galería multimedia
              </h2>
            </div>
            <p className="text-[11px] font-medium sm:text-xs" style={{ color: MUTED }}>
              {galleryMetaLine}
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-12 lg:gap-4">
            <div className={hasSidebarMediaNegocio ? "lg:col-span-7" : "lg:col-span-12"}>
              <div className="relative">
                <button
                  type="button"
                  className="group relative w-full overflow-hidden rounded-2xl border text-left shadow-lg transition hover:opacity-[0.98]"
                  style={{ borderColor: BORDER }}
                  onClick={() => {
                    if (!vm.media?.hasPhotos || !vm.media?.heroUrl) return;
                    openGallery(
                      leonixSlideIndexForCoverPhoto(
                        vm.media.allPhotoUrls,
                        vm.media.coverPhotoIndex ?? 0,
                        vm.media.photoCaptionsFull,
                      ),
                    );
                  }}
                  disabled={!vm.media?.hasPhotos || !vm.media?.heroUrl}
                  aria-label="Abrir galería de fotos"
                >
                  {vm.media?.hasPhotos && vm.media?.heroUrl ? (
                     
                    <img src={vm.media.heroUrl} alt="" className="aspect-[16/10] w-full object-cover" />
                  ) : (
                    <div className="aspect-[16/10] w-full">
                      <EmptyMedia title="Galería" subtitle="Sin fotografías en este anuncio." icon={<IconHome className="h-7 w-7" />} />
                    </div>
                  )}
                  {vm.media?.hasPhotos && vm.media?.heroUrl ? (
                    <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/[0.06]" aria-hidden />
                  ) : null}
                </button>
                {vm.media && uniquePhotoCount > 0 ? (
                  <button
                    type="button"
                    className="absolute bottom-3 right-3 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide shadow-md transition hover:brightness-95"
                    style={{ borderColor: BORDER, background: "rgba(253,251,247,0.94)", color: CHARCOAL_DEEP }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openGallery(
                        leonixSlideIndexForCoverPhoto(
                          vm.media?.allPhotoUrls,
                          vm.media?.coverPhotoIndex ?? 0,
                          vm.media?.photoCaptionsFull,
                        ),
                      );
                    }}
                    aria-label="Abrir galería completa"
                  >
                    {uniquePhotoCount} fotos
                  </button>
                ) : null}
              </div>
              {vm.media?.heroCaption ? (
                <p className="mt-2 px-0.5 text-xs font-medium leading-snug sm:text-sm" style={{ color: MUTED }}>
                  {vm.media.heroCaption}
                </p>
              ) : null}
            </div>
              {hasSidebarMediaNegocio ? (
              <div className="grid grid-cols-2 gap-3 lg:col-span-5">
              {sidebarGallerySpecsNegocio.map((spec, idx) => {
                if (!spec || spec.kind === "more") return null;
                return (
                <div key={idx} className="relative min-h-0 overflow-hidden rounded-2xl border shadow-md" style={{ borderColor: BORDER }}>
                  {spec.kind === "photo" ? (
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() =>
                        openGallery(
                          leonixSlideIndexForPhotoUrl(vm.media?.allPhotoUrls, vm.media?.photoCaptionsFull, spec.url),
                        )
                      }
                      aria-label="Abrir foto en galería"
                    >
                      { }
                      <img src={spec.url} alt="" className="aspect-[4/3] w-full object-cover" />
                    </button>
                  ) : (
                    <div className="relative aspect-[4/3] w-full">
                      <LeonixPreviewGalleryVideoTile slot={spec.slot} media={vm.media} whenEmpty="placeholder" />
                      <button
                        type="button"
                        className="absolute right-2 top-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-md sm:text-[11px]"
                        style={{ borderColor: BORDER, background: "rgba(253,251,247,0.95)", color: CHARCOAL_DEEP }}
                        onClick={() => openGallery(leonixSlideIndexForVideoSlot(vm.media, spec.slot))}
                      >
                        Galería
                      </button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
              ) : null}
          </div>
          {(vm.media?.floorPlanUrls?.length ?? 0) > 1 ? (
            <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: BORDER }}>
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                Planos adicionales ({(vm.media?.floorPlanUrls?.length ?? 0) - 1})
              </p>
              <div className="grid gap-2 p-3 sm:grid-cols-2">
                {(vm.media?.floorPlanUrls ?? []).slice(1).map((u) => (
                   
                  <img key={u.slice(0, 48)} src={u} alt="" className="max-h-56 w-full rounded-lg border object-contain" style={{ borderColor: BORDER }} />
                ))}
              </div>
            </div>
          ) : null}
          {vm.media?.hasSitePlan && vm.media?.sitePlanUrl && (Boolean(vm.location?.mapsUrl) || Boolean(vm.media?.floorPlanUrls?.[0])) ? (
            <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: BORDER }}>
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>
                Plano de sitio / comunidad
              </p>
              { }
              <img src={vm.media.sitePlanUrl} alt="" className="max-h-64 w-full object-contain bg-white" />
            </div>
          ) : null}
        </section>

        {vm.hasDescription ? (
          <section className="mt-8">
            <div
              className="rounded-2xl border p-6 sm:p-7 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)]"
              style={{ borderColor: BORDER, background: CREAM_CARD }}
            >
              <h2 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
                Descripción
              </h2>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-[1.75]" style={{ color: CHARCOAL }}>
                {vm.description}
              </p>
            </div>
          </section>
        ) : null}

        <section
          className={
            rentasPolishedDuplexLayout
              ? "mt-7 grid min-w-0 grid-cols-1 gap-4 border-t pt-7 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start lg:gap-5"
              : "mt-7 grid gap-6 border-t pt-7 lg:grid-cols-1 lg:items-start lg:gap-8"
          }
          style={{ borderColor: BORDER }}
        >
          <div className="min-w-0">
            <h1
              className="max-w-[720px] break-words text-[1.65rem] font-bold leading-[1.15] tracking-tight [overflow-wrap:anywhere] sm:text-[2rem] lg:text-[2.35rem]"
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

            <LeonixPreviewQuickFactsStrip quickFacts={quickFacts} />

            <div className="mt-6 space-y-4">
              {grouped.resumen.length > 0 ? <FactBlock title="Resumen de renta" rows={grouped.resumen} /> : null}
              {grouped.requisitos ? (
                <div className="rounded-2xl border p-5 sm:p-6 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)]" style={{ borderColor: BORDER, background: CREAM_CARD }}>
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>Requisitos</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: CHARCOAL }}>{grouped.requisitos}</p>
                </div>
              ) : null}
              {grouped.caracteristicas.length > 0 ? <FactBlock title="Características" rows={grouped.caracteristicas} /> : null}
              {grouped.servicios.length > 0 ? (
                <div className="rounded-2xl border p-5 sm:p-6 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)]" style={{ borderColor: BORDER, background: CREAM_CARD }}>
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>Servicios incluidos</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {grouped.servicios.map((svc) => (
                      <span key={svc} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: BORDER, background: "#fff", color: CHARCOAL }}>
                        {servicioChipText(svc)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {vm.hasHighlights && (vm.highlightsRows?.length ?? 0) > 0 ? (
                <div className="rounded-2xl border p-5 sm:p-6 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)]" style={{ borderColor: BORDER, background: CREAM_CARD }}>
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
                    {String(vm.highlightsSectionTitle ?? "").trim() || "Destacados"}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(vm.highlightsRows ?? []).map((row) => (
                      <span key={row.label} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: BORDER, background: "#fff", color: CHARCOAL }}>
                        {highlightChipText(row.label)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {rentasPolishedDuplexLayout ? (
            <BienesRaicesNegocioDarkContactAside vm={vm} onContactLinkClick={onContactLinkClick} />
          ) : (
            <aside
              className="rounded-2xl border p-5 shadow-[0_16px_44px_-12px_rgba(42,36,22,0.15)] lg:sticky lg:top-6 lg:self-start"
              hidden
              style={{ borderColor: BORDER, background: CREAM_CARD }}
            >
              <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: BORDER }}>
                {vm.identity.hasPhoto && vm.identity.photoUrl ? (
                  <img
                    src={vm.identity.photoUrl}
                    alt=""
                    className="aspect-[4/5] w-full max-h-[min(340px,44vh)] object-cover object-top sm:max-h-[360px]"
                  />
                ) : (
                  <div className="aspect-[4/5] w-full max-h-[min(260px,36vh)]">
                    <EmptyMedia
                      title="Identidad del anuncio"
                      subtitle="Sin imagen principal cargada."
                      icon={<IconEye className="h-6 w-6" />}
                    />
                  </div>
                )}
              </div>
              <p className="mt-4 text-lg font-bold leading-tight" style={{ color: CHARCOAL_DEEP }}>
                {vm.identity.name}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: BRONZE_SOFT }}>
                {vm.identity.role}
              </p>
              {vm.identity.bioLine ? (
                <p className="mt-3 text-sm leading-relaxed" style={{ color: MUTED }}>
                  {vm.identity.bioLine}
                </p>
              ) : null}
              {vm.identity.showBrokerageBlock !== false ? (
                <div
                  className="mt-4 flex items-center gap-3 rounded-xl border px-3 py-3.5 sm:gap-4"
                  style={{ borderColor: BORDER, background: "rgba(249,246,241,0.6)" }}
                >
                  {vm.identity.brokerageLogoUrl &&
                  !(vm.identity.photoUrl && vm.identity.brokerageLogoUrl && vm.identity.photoUrl === vm.identity.brokerageLogoUrl) ? (
                    <img
                      src={vm.identity.brokerageLogoUrl}
                      alt=""
                      className="h-14 w-auto max-w-[152px] shrink-0 object-contain object-left sm:h-16 sm:max-w-[168px]"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>
                      Inmobiliaria / marca
                    </p>
                    <p className="mt-1 text-sm font-bold leading-snug" style={{ color: CHARCOAL }}>
                      {vm.identity.brokerageName}
                    </p>
                  </div>
                </div>
              ) : null}
              {vm.identity.verifiedLine || vm.identity.licenseLine ? (
                <p className="mt-3 text-xs leading-relaxed" style={{ color: MUTED }}>
                  {vm.identity.verifiedLine ? (
                    <span className="font-semibold" style={{ color: CHARCOAL }}>
                      {vm.identity.verifiedLine}
                    </span>
                  ) : null}
                  {vm.identity.licenseLine ? (
                    <>
                      {vm.identity.verifiedLine ? <br /> : null}
                      {vm.identity.licenseLine}
                    </>
                  ) : null}
                </p>
              ) : null}
              {(vm.identity.contactPhone || vm.identity.contactEmail) ? (
                <div className="mt-3 space-y-1 text-xs" style={{ color: CHARCOAL }}>
                  {vm.identity.contactPhone ? <p className="font-medium">{vm.identity.contactPhone}</p> : null}
                  {vm.identity.contactEmail ? <p className="truncate opacity-90">{vm.identity.contactEmail}</p> : null}
                </div>
              ) : null}
              {(vm.identity?.socialLinks ?? []).length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(vm.identity?.socialLinks ?? []).map((sl) => (
                    <a
                      key={sl.href}
                      href={sl.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full border px-3 text-[10px] font-bold transition hover:bg-[rgba(197,160,89,0.1)]"
                      style={{ borderColor: BORDER, color: CHARCOAL }}
                    >
                      {sl.label}
                    </a>
                  ))}
                </div>
              ) : null}
              {vm.identity.profileCtaEnabled && vm.identity.profileHref ? (
                <a
                  href={vm.identity.profileHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex w-full items-center justify-center rounded-xl border-2 py-3 text-xs font-bold uppercase tracking-wide transition hover:bg-[rgba(197,160,89,0.08)]"
                  style={{ borderColor: BRONZE, color: BRONZE_SOFT }}
                >
                  {vm.identity.profileCtaLabel}
                </a>
              ) : (
                <p className="mt-5 text-center text-[11px] leading-snug" style={{ color: MUTED }}>
                  Añade un sitio web o red social en la ficha para activar el enlace público de perfil.
                </p>
              )}
            </aside>
          )}
        </section>

        {!rentasPolishedDuplexLayout ? (
        <section className="mt-10 grid gap-5 lg:grid-cols-[1fr_1fr_minmax(280px,340px)] lg:items-stretch lg:gap-5">
          <FactBlock title="Detalles de la propiedad" rows={vm.propertyDetailsRows} />
          {vm.hasHighlights ? (
            <FactBlock
              title={String(vm.highlightsSectionTitle ?? "").trim() || "Características destacadas"}
              rows={vm.highlightsRows ?? []}
            />
          ) : (
            <div
              className="rounded-2xl border p-5 sm:p-6 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.08)]"
              style={{ borderColor: BORDER, background: CREAM_CARD }}
            >
              <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: MUTED }}>
                {String(vm.highlightsSectionTitle ?? "").trim() || "Características destacadas"}
              </h3>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: MUTED }}>
                Sin elementos destacados en este anuncio.
              </p>
            </div>
          )}
          <BienesRaicesNegocioDarkContactAside vm={vm} onContactLinkClick={onContactLinkClick} />
        </section>
        ) : null}

        {!rentasPolishedDuplexLayout ? (
        <section className="mt-14">
          <div className="mb-8 text-center">
            <h2
              className="text-xl font-bold uppercase tracking-[0.12em] sm:text-2xl"
              style={{ color: CHARCOAL_DEEP, fontFamily: "Georgia, serif" }}
            >
              Detalles completos del inmueble
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm" style={{ color: MUTED }}>
              Ficha técnica por bloques según los datos de este anuncio.
            </p>
          </div>

          {(vm.detailClusters ?? []).length === 0 ? (
            <p className="mx-auto max-w-xl text-center text-sm leading-relaxed" style={{ color: MUTED }}>
              Sin bloques de detalle técnico en este anuncio.
            </p>
          ) : (
            <div className="space-y-12">
              {(vm.detailClusters ?? []).map((cluster) => (
                <div key={cluster.id}>
                  <h3
                    className="mb-5 text-center text-sm font-bold uppercase tracking-[0.12em]"
                    style={{ color: BRONZE_SOFT }}
                  >
                    {cluster.title}
                  </h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    {(cluster.blocks ?? []).map((b) => (
                      <DeepSection key={b.id} icon={deepIcon(b.id)} heading={b.heading} items={b.bullets} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        ) : null}

        {String(vm.footerNote ?? "").trim() ? (
          <footer className="mt-12 border-t pt-6 text-center text-xs" style={{ borderColor: BORDER, color: MUTED }}>
            <p>{vm.footerNote}</p>
          </footer>
        ) : (
          <div className="mt-12 border-t pt-5" style={{ borderColor: BORDER }} aria-hidden />
        )}
      </main>

      <LeonixPreviewGalleryLightbox vm={vm} open={galleryOpen} initialIndex={galleryIndex} onClose={() => setGalleryOpen(false)} />
    </div>
  );
}
