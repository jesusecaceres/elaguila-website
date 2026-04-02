/**
 * Vista previa Leonix — agente individual / residencial.
 * Regiones alineadas a `AgenteIndividualResidencialPreviewVm` y `AGENTE_RES_SLOT_INVENTORY`.
 */
"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  BiArea,
  BiBath,
  BiBed,
  BiCalendar,
  BiCar,
  BiShapeSquare,
} from "react-icons/bi";
import {
  FiExternalLink,
  FiMapPin,
  FiVideo,
} from "react-icons/fi";
import { SiFacebook, SiInstagram, SiTiktok, SiX, SiYoutube } from "react-icons/si";
import type {
  AgenteIndividualResidencialPreviewVm,
  AgenteResGalleryTileRole,
  AgenteResQuickFactSemanticKey,
} from "../mapping/agenteIndividualResidencialPreviewVm";

const IVORY = "#F9F6F1";
const CREAM = "#FDFBF7";
const CHARCOAL = "#2C2416";
const MUTED = "#5C5346";
const MUTED_LIGHT = "#7a7165";
const BRONZE = "#B8954A";
const BRONZE_SOFT = "rgba(184, 149, 74, 0.14)";
const BORDER = "rgba(44, 36, 22, 0.1)";
const CARD_SHADOW = "0 4px 24px rgba(44, 36, 22, 0.06)";
const MEDIA_SHADOW = "0 10px 36px rgba(44, 36, 22, 0.1)";

/** Sistema tipográfico — roles fijos */
const typo = {
  meta: "text-[9px] font-bold uppercase tracking-[0.18em]",
  kicker: "text-[10px] font-bold uppercase tracking-[0.14em]",
  labelCaps: "text-[10px] font-bold uppercase tracking-[0.08em]",
  body: "text-[13px] leading-[1.65]",
  bodySm: "text-[12px] leading-[1.55]",
  detailValue: "text-[13px] font-semibold leading-snug tracking-tight",
  detailLabel: "text-[10px] font-semibold uppercase tracking-[0.06em]",
  railName: "text-base font-bold leading-tight tracking-tight",
  railMeta: "text-[10px] font-bold uppercase tracking-[0.12em]",
  price: "text-[1.7rem] font-bold leading-none tracking-tight sm:text-[2.1rem]",
  title: "text-[1.55rem] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[1.9rem] md:text-[2.1rem]",
  sectionSerif: "text-base font-bold leading-tight tracking-tight",
  lowerSerif: "text-sm font-semibold leading-tight tracking-tight",
} as const;

const SECTION_GAP = "mt-6 md:mt-7";
const CARD_PAD = "px-4 py-4 sm:px-5 sm:py-4";
const SECTION_LABEL = `${typo.kicker} mb-2.5`;

const QUICK_FACT_ICON: Record<
  AgenteResQuickFactSemanticKey,
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  recamaras: BiBed,
  banos: BiBath,
  tamano_interior: BiArea,
  estacionamientos: BiCar,
  ano_construccion: BiCalendar,
  tamano_lote: BiShapeSquare,
};

const GALLERY_ROLE_LABEL: Record<AgenteResGalleryTileRole, string> = {
  main_photo: "Foto principal",
  secondary_photo_1: "Foto 2",
  secondary_photo_2: "Foto 3",
  video: "Video",
  tour_or_plan: "Tour / plano",
};

function tourPlanSlotLabel(variant: "tour" | "brochure" | "none"): string {
  if (variant === "tour") return "Tour virtual";
  if (variant === "brochure") return "Plano / folleto";
  return GALLERY_ROLE_LABEL.tour_or_plan;
}

function anchorPropsForHref(href: string, downloadFallback?: string | null) {
  if (href.startsWith("data:")) {
    return { download: downloadFallback || "archivo.pdf" } as const;
  }
  return { target: "_blank" as const, rel: "noopener noreferrer" };
}

function EmptySlot({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className="flex h-full min-h-[104px] w-full flex-col items-center justify-center gap-1 rounded-lg border px-2 py-3 text-center"
      style={{
        borderColor: BORDER,
        background: "linear-gradient(180deg, rgba(253,251,247,0.98) 0%, rgba(249,246,241,0.88) 100%)",
        color: MUTED,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
      }}
    >
      {icon ? <span className="opacity-50" style={{ color: BRONZE }}>{icon}</span> : null}
      <p className={typo.kicker} style={{ color: BRONZE }}>
        {title}
      </p>
      <p className={`${typo.bodySm} opacity-90`}>{subtitle}</p>
    </div>
  );
}

function SocialCircle({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-[#3d3428] transition hover:border-[#c4a85a]/50 hover:bg-[rgba(197,160,89,0.08)]"
      style={{ borderColor: BORDER, color: CHARCOAL }}
    >
      {children}
    </a>
  );
}

function GalleryCaption({ children }: { children: ReactNode }) {
  return (
    <p className={`mt-1.5 text-center ${typo.meta}`} style={{ color: MUTED_LIGHT }}>
      {children}
    </p>
  );
}

export function AgenteIndividualResidencialPreviewView({
  vm,
  editHref,
  footerExtra,
  onBeforeNavigateToEdit,
}: {
  vm: AgenteIndividualResidencialPreviewVm;
  editHref?: string;
  footerExtra?: string;
  onBeforeNavigateToEdit?: () => void;
}) {
  const h = vm.hero;
  const pc = vm.professionalCard;
  const soc = vm.social;
  const g = vm.gallery;
  const cr = vm.contactRail;
  const mapsUrl = vm.extras.mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vm.extras.mapQuery)}`
    : null;

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: IVORY, color: CHARCOAL }}>
      <header
        className="border-b backdrop-blur-sm"
        style={{ borderColor: BORDER, background: "rgba(253, 251, 247, 0.92)" }}
      >
        <div className="mx-auto flex max-w-[1140px] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-7">
          <div className="flex items-center gap-2">
            <a href="/clasificados" className={`${typo.meta} tracking-[0.16em]`} style={{ color: MUTED }}>
              LEONIX
            </a>
            <span
              className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]"
              style={{ borderColor: BORDER, color: MUTED }}
            >
              Vista previa · Negocio
            </span>
          </div>
          {editHref ? (
            <Link
              href={editHref}
              prefetch={false}
              className={`${typo.meta} underline decoration-[#c4a85a]/40 underline-offset-4 transition hover:decoration-[#B8954A]`}
              style={{ color: BRONZE }}
              onClick={() => onBeforeNavigateToEdit?.()}
            >
              Volver a editar
            </Link>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-[1140px] px-4 pb-10 pt-2 sm:px-6 lg:px-7">
        <p className={`mb-1 text-center ${typo.meta}`} style={{ color: MUTED }}>
          Vista previa del anuncio
        </p>

        {/* Galería arriba (columna izq.) · texto/hechos debajo · carril derecho (flujo normal, sin sticky) */}
        <section className="mt-2 grid grid-cols-1 gap-y-3 lg:grid-cols-[1fr_300px] lg:items-start lg:gap-x-7">
          <div className="flex min-w-0 flex-col gap-3">
            <div>
              <h3 className={`${typo.kicker} mb-2`} style={{ color: MUTED }}>
                Galería
              </h3>
              <div className="grid gap-2.5 lg:grid-cols-12 lg:gap-3.5 lg:items-start">
                <div className="min-w-0 lg:col-span-8">
                  {g.mainPhoto.url ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={g.mainPhoto.url}
                        alt=""
                        className="aspect-[16/10] w-full rounded-xl border object-cover lg:min-h-[min(360px,52vh)]"
                        style={{ borderColor: BORDER, boxShadow: MEDIA_SHADOW }}
                      />
                      <GalleryCaption>{GALLERY_ROLE_LABEL.main_photo}</GalleryCaption>
                    </div>
                  ) : (
                    <div>
                      <EmptySlot title="Foto principal" subtitle="Agrega fotos en el formulario." />
                      <GalleryCaption>{GALLERY_ROLE_LABEL.main_photo}</GalleryCaption>
                    </div>
                  )}
                </div>

                <div className="grid min-w-0 grid-cols-2 gap-2 lg:col-span-4 lg:gap-2">
                  {g.secondaryPhoto1.url ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={g.secondaryPhoto1.url}
                        alt=""
                        className="aspect-[4/3] w-full rounded-lg border object-cover"
                        style={{ borderColor: BORDER, boxShadow: "0 2px 14px rgba(44,36,22,0.06)" }}
                      />
                      <GalleryCaption>{GALLERY_ROLE_LABEL.secondary_photo_1}</GalleryCaption>
                    </div>
                  ) : (
                    <div>
                      <EmptySlot title="Foto 2" subtitle="Opcional" />
                      <GalleryCaption>{GALLERY_ROLE_LABEL.secondary_photo_1}</GalleryCaption>
                    </div>
                  )}

                  {g.secondaryPhoto2.url ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={g.secondaryPhoto2.url}
                        alt=""
                        className="aspect-[4/3] w-full rounded-lg border object-cover"
                        style={{ borderColor: BORDER, boxShadow: "0 2px 14px rgba(44,36,22,0.06)" }}
                      />
                      <GalleryCaption>{GALLERY_ROLE_LABEL.secondary_photo_2}</GalleryCaption>
                    </div>
                  ) : (
                    <div>
                      <EmptySlot title="Foto 3" subtitle="Opcional" />
                      <GalleryCaption>{GALLERY_ROLE_LABEL.secondary_photo_2}</GalleryCaption>
                    </div>
                  )}

                  {g.video.dataUrl ? (
                    <div>
                      <video
                        src={g.video.dataUrl}
                        controls
                        className="aspect-[4/3] w-full rounded-lg border object-cover"
                        style={{ borderColor: BORDER }}
                      />
                      <GalleryCaption>{GALLERY_ROLE_LABEL.video}</GalleryCaption>
                    </div>
                  ) : g.video.externalHref ? (
                    <div>
                      <a
                        href={g.video.externalHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border text-[11px] font-bold tracking-wide"
                        style={{ borderColor: BORDER, background: "#1a2744", color: "#fff", boxShadow: MEDIA_SHADOW }}
                      >
                        <FiVideo className="h-6 w-6 opacity-90" aria-hidden />
                        Reproducir video
                      </a>
                      <GalleryCaption>{GALLERY_ROLE_LABEL.video}</GalleryCaption>
                    </div>
                  ) : (
                    <div>
                      <EmptySlot
                        title="Video"
                        subtitle="Pega un enlace o sube un archivo."
                        icon={<FiVideo className="h-5 w-5" aria-hidden />}
                      />
                      <GalleryCaption>{GALLERY_ROLE_LABEL.video}</GalleryCaption>
                    </div>
                  )}

                  {g.tourOrPlan.href ? (
                    <div>
                      <a
                        href={g.tourOrPlan.href}
                        className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border text-center text-[11px] font-bold tracking-wide"
                        style={{ borderColor: BORDER, background: "#243a5e", color: "#fff", boxShadow: MEDIA_SHADOW }}
                        {...anchorPropsForHref(g.tourOrPlan.href, g.tourOrPlan.variant === "brochure" ? "folleto.pdf" : "tour.pdf")}
                      >
                        {g.tourOrPlan.variant === "tour" ? "Abrir tour" : "Abrir plano / folleto"}
                      </a>
                      <GalleryCaption>{tourPlanSlotLabel(g.tourOrPlan.variant)}</GalleryCaption>
                    </div>
                  ) : (
                    <div>
                      <EmptySlot title="Tour / plano" subtitle="Enlace o archivo (tour o folleto)." />
                      <GalleryCaption>{tourPlanSlotLabel("none")}</GalleryCaption>
                    </div>
                  )}
                </div>
              </div>

              {g.showAllPhotosCta.visible ? (
                <div
                  className="mt-3 flex justify-center"
                  role="note"
                  title="En el anuncio publicado, este control abre la galería completa."
                >
                  <span
                    className={`inline-flex items-center justify-center rounded-full border px-4 py-2 ${typo.kicker}`}
                    style={{
                      borderColor: `${BRONZE}55`,
                      color: BRONZE,
                      background: "rgba(197, 160, 89, 0.08)",
                      cursor: "default",
                    }}
                  >
                    Ver todas las fotos ({g.showAllPhotosCta.totalPhotoCount})
                  </span>
                </div>
              ) : null}
            </div>

            <div>
              {h.title ? (
                <h1 className={typo.title} style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: CHARCOAL }}>
                  {h.title}
                </h1>
              ) : null}
              <p className={`${h.title ? "mt-1" : ""} ${typo.bodySm} font-semibold`} style={{ color: MUTED }}>
                {h.operationLine}
              </p>
              {h.locationLine || mapsUrl ? (
                <p className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 ${typo.bodySm} font-medium`} style={{ color: MUTED }}>
                  {h.locationLine ? (
                    <>
                      <FiMapPin className="inline h-3.5 w-3.5 shrink-0 opacity-65" aria-hidden />
                      <span>{h.locationLine}</span>
                    </>
                  ) : null}
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`shrink-0 font-semibold underline underline-offset-2 ${typo.bodySm}`}
                      style={{ color: BRONZE }}
                    >
                      Ver en mapa
                    </a>
                  ) : null}
                </p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
                {h.priceDisplay ? (
                  <span className={typo.price} style={{ color: "#8E6A28", fontFamily: "Georgia, serif" }}>
                    {h.priceDisplay}
                  </span>
                ) : null}
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                  style={{
                    border: `1px solid ${BRONZE_SOFT}`,
                    background: "rgba(197, 160, 89, 0.1)",
                    color: "#7A5F22",
                  }}
                >
                  {h.statusPill}
                </span>
              </div>

              {h.quickFacts.length ? (
                <div
                  className="mt-2 overflow-hidden rounded-xl border"
                  style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}
                >
                  <div
                    className="grid gap-px bg-[rgba(44,36,22,0.08)]"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(h.quickFacts.length, 6)}, minmax(0, 1fr))`,
                    }}
                  >
                    {h.quickFacts.map((q) => {
                      const Icon = QUICK_FACT_ICON[q.key];
                      return (
                        <div key={q.key} className="min-w-0 bg-[#FDFBF7] px-1.5 py-2.5 sm:px-2 sm:py-3">
                          <div className="mb-1 flex justify-center" style={{ color: BRONZE }} aria-hidden>
                            <Icon className="h-4 w-4 opacity-95" />
                          </div>
                          <p className={`text-center ${typo.labelCaps} leading-tight`} style={{ color: MUTED }}>
                            {q.label}
                          </p>
                          <p className={`mt-0.5 truncate text-center ${typo.detailValue}`}>{q.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <aside
            className="rounded-xl border"
            style={{
              borderColor: BORDER,
              background: `linear-gradient(180deg, ${CREAM} 0%, #f8f4ec 100%)`,
              boxShadow: CARD_SHADOW,
            }}
          >
            <div className="p-3.5 sm:p-4">
              {pc.hasBrandBlock ? (
                <div className="border-b pb-3" style={{ borderColor: "rgba(44,36,22,0.08)" }}>
                  {pc.brandLogoUrl ? (
                    <div className="mx-auto mb-2 flex max-w-[148px] justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={pc.brandLogoUrl} alt="" className="max-h-11 w-auto object-contain opacity-[0.97]" />
                    </div>
                  ) : null}
                  {pc.brandName ? (
                    <p className={`text-center ${typo.bodySm} font-bold`} style={{ color: MUTED }}>
                      {pc.brandName}
                    </p>
                  ) : null}
                  {pc.brandWebsiteHref ? (
                    <a
                      href={pc.brandWebsiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-1.5 flex w-full items-center justify-center gap-1 text-center text-[11px] font-semibold`}
                      style={{ color: BRONZE }}
                    >
                      Sitio web
                      <FiExternalLink className="h-3 w-3 opacity-80" aria-hidden />
                    </a>
                  ) : null}
                </div>
              ) : null}

              <div className={pc.hasBrandBlock ? "pt-3" : ""}>
                <div className="mx-auto w-full max-w-[236px]">
                  {pc.agentPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pc.agentPhotoUrl}
                      alt=""
                      className="mx-auto aspect-square w-full max-h-[240px] rounded-lg border object-cover"
                      style={{ borderColor: BORDER, boxShadow: "0 2px 14px rgba(44,36,22,0.07)" }}
                    />
                  ) : (
                    <div
                      className="flex aspect-square w-full items-center justify-center rounded-lg border text-[11px] font-medium"
                      style={{
                        borderColor: BORDER,
                        color: MUTED,
                        background: "linear-gradient(145deg, rgba(255,252,247,0.95), rgba(249,246,241,0.75))",
                      }}
                    >
                      Foto del agente
                    </div>
                  )}
                </div>
                {pc.agentName ? <p className={`mt-2.5 text-center ${typo.railName}`}>{pc.agentName}</p> : null}
                {pc.agentTitle ? (
                  <p className={`mt-0.5 text-center ${typo.railMeta}`} style={{ color: BRONZE }}>
                    {pc.agentTitle}
                  </p>
                ) : null}
                {pc.areaServicioLine ? (
                  <p className={`mt-2 text-center ${typo.bodySm}`} style={{ color: MUTED }}>
                    <span className="font-semibold opacity-85">Área:</span> {pc.areaServicioLine}
                  </p>
                ) : null}
                {pc.idiomasLine ? (
                  <p className={`mt-1 text-center ${typo.bodySm}`} style={{ color: MUTED }}>
                    <span className="font-semibold opacity-85">Idiomas:</span> {pc.idiomasLine}
                  </p>
                ) : null}
                {pc.agentLicenseLine ? (
                  <p className={`mt-2.5 text-center text-[10px] leading-snug`} style={{ color: MUTED_LIGHT }}>
                    {pc.agentLicenseLine}
                  </p>
                ) : null}
                {pc.hasBrandBlock && pc.brandLicenseLine ? (
                  <p className={`mt-1.5 text-center text-[10px] leading-snug`} style={{ color: MUTED_LIGHT }}>
                    {pc.brandLicenseLine}
                  </p>
                ) : null}

                {pc.phoneDisplay || pc.emailDisplay ? (
                  <div
                    className="mt-3 space-y-0.5 rounded-md px-2 py-2 text-center"
                    style={{ background: "rgba(44,36,22,0.04)" }}
                  >
                    {pc.phoneDisplay ? <p className="text-sm font-semibold tracking-tight">{pc.phoneDisplay}</p> : null}
                    {pc.emailDisplay ? <p className={`truncate ${typo.bodySm} opacity-90`}>{pc.emailDisplay}</p> : null}
                  </div>
                ) : null}

                {cr.showSocialIcons ? (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5 border-t pt-3" style={{ borderColor: BORDER }}>
                    {soc.instagram ? (
                      <SocialCircle href={soc.instagram} label="Instagram">
                        <SiInstagram className="h-3.5 w-3.5" aria-hidden />
                      </SocialCircle>
                    ) : null}
                    {soc.facebook ? (
                      <SocialCircle href={soc.facebook} label="Facebook">
                        <SiFacebook className="h-3.5 w-3.5" aria-hidden />
                      </SocialCircle>
                    ) : null}
                    {soc.youtube ? (
                      <SocialCircle href={soc.youtube} label="YouTube">
                        <SiYoutube className="h-3.5 w-3.5" aria-hidden />
                      </SocialCircle>
                    ) : null}
                    {soc.tiktok ? (
                      <SocialCircle href={soc.tiktok} label="TikTok">
                        <SiTiktok className="h-3.5 w-3.5" aria-hidden />
                      </SocialCircle>
                    ) : null}
                    {soc.x ? (
                      <SocialCircle href={soc.x} label="X">
                        <SiX className="h-3 w-3" aria-hidden />
                      </SocialCircle>
                    ) : null}
                    {soc.otro ? (
                      <SocialCircle href={soc.otro} label="Enlace">
                        <FiExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </SocialCircle>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-3 space-y-1.5 border-t pt-3" style={{ borderColor: BORDER }}>
                  {cr.showLlamar && cr.llamarHref ? (
                    <a
                      href={cr.llamarHref}
                      className="flex w-full items-center justify-center rounded-lg py-2.5 text-[13px] font-bold text-[#1E1810] shadow-sm transition hover:brightness-[1.02]"
                      style={{ background: `linear-gradient(180deg, #C9A85A 0%, ${BRONZE} 100%)` }}
                    >
                      Llamar ahora
                    </a>
                  ) : null}
                  {cr.showWhatsapp && cr.whatsappHref ? (
                    <a
                      href={cr.whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center rounded-lg border bg-white/70 py-2 text-[13px] font-semibold transition hover:bg-white"
                      style={{ borderColor: "rgba(37,211,102,0.35)" }}
                    >
                      WhatsApp
                    </a>
                  ) : null}
                  {cr.showSolicitarInformacion && cr.solicitarInformacionHref ? (
                    <a
                      href={cr.solicitarInformacionHref}
                      className="flex w-full items-center justify-center rounded-lg border py-2 text-[13px] font-semibold"
                      style={{ borderColor: BORDER }}
                    >
                      Solicitar información
                    </a>
                  ) : null}
                  {cr.showProgramarVisita && cr.programarVisitaHref ? (
                    <a
                      href={cr.programarVisitaHref}
                      className="flex w-full items-center justify-center rounded-lg border py-2 text-[13px] font-semibold"
                      style={{ borderColor: BORDER }}
                      {...(cr.programarVisitaHref.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      Programar visita
                    </a>
                  ) : null}
                  {cr.showVerSitioWeb && cr.verSitioWebHref ? (
                    <a
                      href={cr.verSitioWebHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center rounded-lg border py-1.5 text-[11px] font-bold"
                      style={{ borderColor: BORDER }}
                    >
                      Ver sitio web
                    </a>
                  ) : null}
                  {cr.showVerListado && cr.verListadoHref ? (
                    <a
                      href={cr.verListadoHref}
                      className="flex w-full items-center justify-center rounded-lg border py-2 text-[11px] font-bold transition hover:bg-[rgba(197,160,89,0.06)]"
                      style={{ borderColor: `${BRONZE}99`, color: BRONZE }}
                      {...anchorPropsForHref(cr.verListadoHref, cr.listadoDownloadName)}
                    >
                      Ver listado completo
                    </a>
                  ) : null}
                  {cr.showVerMls && cr.verMlsHref ? (
                    <a
                      href={cr.verMlsHref}
                      className="flex w-full items-center justify-center rounded-lg border py-1.5 text-[11px] font-bold"
                      style={{ borderColor: BORDER }}
                      {...anchorPropsForHref(cr.verMlsHref, cr.listadoDownloadName)}
                    >
                      Ver MLS
                    </a>
                  ) : null}
                  {cr.showVerTour && cr.verTourHref ? (
                    <a
                      href={cr.verTourHref}
                      className="flex w-full items-center justify-center rounded-lg border py-1.5 text-[11px] font-bold"
                      style={{ borderColor: BORDER }}
                      {...anchorPropsForHref(cr.verTourHref, "tour.pdf")}
                    >
                      Ver tour
                    </a>
                  ) : null}
                  {cr.showVerFolleto && cr.verFolletoHref ? (
                    <a
                      href={cr.verFolletoHref}
                      className="flex w-full items-center justify-center rounded-lg border py-1.5 text-[11px] font-bold"
                      style={{ borderColor: BORDER }}
                      {...anchorPropsForHref(cr.verFolletoHref, "folleto.pdf")}
                    >
                      Ver folleto
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* Detalles + características — misma fila visual; cada tarjeta solo si hay filas / destacados */}
        {(vm.propertyRows.length > 0 || vm.destacadosLabels.length > 0) && (
          <section className={`${SECTION_GAP} grid gap-3.5 lg:grid-cols-2 lg:gap-4 lg:items-stretch`}>
            {vm.propertyRows.length > 0 ? (
              <div className="rounded-xl border" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                <div className={CARD_PAD}>
                  <h3 className={SECTION_LABEL} style={{ color: MUTED }}>
                    Detalles de la propiedad
                  </h3>
                  <dl className="grid gap-2 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-2">
                    {vm.propertyRows.map((r) => (
                      <div key={r.label} className="min-w-0 border-b border-[rgba(44,36,22,0.06)] pb-2 last:border-b-0 sm:border-b-0 sm:pb-0">
                        <dt className={typo.detailLabel} style={{ color: MUTED_LIGHT }}>
                          {r.label}
                        </dt>
                        <dd className={`mt-0.5 ${typo.detailValue}`}>{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            ) : null}
            {vm.destacadosLabels.length > 0 ? (
              <div className="rounded-xl border" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                <div className={CARD_PAD}>
                  <h3 className={SECTION_LABEL} style={{ color: MUTED }}>
                    Características destacadas
                  </h3>
                  <ul className="grid gap-1.5 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-1.5">
                    {vm.destacadosLabels.map((t) => (
                      <li key={t} className={`flex items-start gap-2 ${typo.body} leading-snug`}>
                        <span
                          className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: `linear-gradient(180deg, #C9A85A, ${BRONZE})` }}
                        >
                          ✓
                        </span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {vm.hasDescription || vm.hasNotas ? (
          <section
            className={`${SECTION_GAP} rounded-xl border`}
            style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}
          >
            <div className={CARD_PAD}>
              <h3
                className={`mb-2.5 ${typo.sectionSerif}`}
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: CHARCOAL }}
              >
                Descripción
              </h3>
              {vm.hasDescription ? (
                <div className={`space-y-3 ${typo.body}`}>
                  {vm.descripcionPrincipal.split(/\n\n+/).map((para, i) => (
                    <p key={i} className="whitespace-pre-wrap text-[#3a342c]">
                      {para}
                    </p>
                  ))}
                </div>
              ) : null}
              {vm.hasNotas ? (
                <div className={`${vm.hasDescription ? "mt-4 border-t pt-3" : ""}`} style={{ borderColor: "rgba(44,36,22,0.08)" }}>
                  <p className={`${typo.kicker} mb-2`} style={{ color: MUTED }}>
                    Notas adicionales
                  </p>
                  <p className={`${typo.body} whitespace-pre-wrap`} style={{ color: MUTED }}>
                    {vm.notasAdicionales}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {(vm.extras.openHouseSummary || vm.extras.asesorBlock || mapsUrl) && (
          <section className={`${SECTION_GAP} space-y-3`}>
            <h2
              className={`text-center ${typo.lowerSerif}`}
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: MUTED }}
            >
              Más información
            </h2>
            <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
              {vm.extras.openHouseSummary ? (
                <div className="rounded-xl border" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                  <div className={CARD_PAD}>
                    <h4 className={`${typo.kicker} mb-2`} style={{ color: MUTED }}>
                      Open house
                    </h4>
                    <p className={`${typo.body} whitespace-pre-line`}>{vm.extras.openHouseSummary}</p>
                  </div>
                </div>
              ) : null}
              {vm.extras.asesorBlock ? (
                <div className="rounded-xl border" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                  <div className={CARD_PAD}>
                    <h4 className={`${typo.kicker} mb-2`} style={{ color: MUTED }}>
                      Contacto de financiamiento
                    </h4>
                    <p className={`${typo.body} font-semibold`}>{vm.extras.asesorBlock.name}</p>
                    <p className={typo.body}>{vm.extras.asesorBlock.phone}</p>
                    <p className={`mt-0.5 truncate ${typo.bodySm} opacity-90`}>{vm.extras.asesorBlock.email}</p>
                  </div>
                </div>
              ) : null}
              {mapsUrl ? (
                <div className="rounded-xl border lg:col-span-2" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                  <div className={`${CARD_PAD} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}>
                    <h4 className={`${typo.kicker} mb-0`} style={{ color: MUTED }}>
                      Ubicación aproximada
                    </h4>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center rounded-lg border px-3 py-2 text-[11px] font-bold transition hover:bg-[rgba(197,160,89,0.08)]"
                      style={{ borderColor: `${BRONZE}aa`, color: BRONZE }}
                    >
                      Abrir en mapa
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        )}

        {footerExtra ? (
          <footer className={`mt-6 border-t pt-4 text-center ${typo.bodySm}`} style={{ borderColor: BORDER, color: MUTED }}>
            {footerExtra}
          </footer>
        ) : null}
      </main>
    </div>
  );
}
