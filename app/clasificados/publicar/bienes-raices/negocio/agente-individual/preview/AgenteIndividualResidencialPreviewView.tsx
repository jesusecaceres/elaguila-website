"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  FiExternalLink,
  FiHome,
  FiLayers,
  FiMapPin,
  FiMaximize2,
  FiSun,
} from "react-icons/fi";
import { SiFacebook, SiInstagram, SiTiktok, SiX, SiYoutube } from "react-icons/si";
import type { AgenteIndividualResidencialPreviewVm } from "../mapping/agenteIndividualResidencialPreviewVm";

const IVORY = "#F9F6F1";
const CREAM = "#FDFBF7";
const CHARCOAL = "#2C2416";
const MUTED = "#5C5346";
const BRONZE = "#B8954A";
const BRONZE_SOFT = "rgba(184, 149, 74, 0.14)";
const BORDER = "rgba(44, 36, 22, 0.1)";
const CARD_SHADOW = "0 4px 24px rgba(44, 36, 22, 0.06)";
const MEDIA_SHADOW = "0 8px 32px rgba(44, 36, 22, 0.09)";

const SECTION_GAP = "mt-7 md:mt-8";
const CARD_PAD = "p-4 sm:p-5";
const SECTION_LABEL = "text-[10px] font-bold uppercase tracking-[0.16em]";

const QUICK_FACT_ICONS: ComponentType<{ className?: string; "aria-hidden"?: boolean }>[] = [
  FiHome,
  FiMaximize2,
  FiLayers,
  FiMapPin,
  FiSun,
  FiHome,
];

function anchorPropsForHref(href: string, downloadFallback?: string | null) {
  if (href.startsWith("data:")) {
    return { download: downloadFallback || "archivo.pdf" } as const;
  }
  return { target: "_blank" as const, rel: "noopener noreferrer" };
}

function EmptySlot({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      className="flex h-full min-h-[108px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-4 text-center"
      style={{
        borderColor: BORDER,
        background: "linear-gradient(180deg, rgba(253,251,247,0.95) 0%, rgba(249,246,241,0.85) 100%)",
        color: MUTED,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: BRONZE }}>
        {title}
      </p>
      <p className="text-[11px] leading-snug opacity-90">{subtitle}</p>
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

function sectionHeading(text: string) {
  return (
    <h3 className={`${SECTION_LABEL} mb-3`} style={{ color: MUTED }}>
      {text}
    </h3>
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
  const m = vm.media;
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
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <a href="/clasificados" className="text-[10px] font-bold tracking-[0.18em]" style={{ color: MUTED }}>
              LEONIX
            </a>
            <span
              className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
              style={{ borderColor: BORDER, color: MUTED }}
            >
              Vista previa · Negocio
            </span>
          </div>
          {editHref ? (
            <Link
              href={editHref}
              prefetch={false}
              className="text-[10px] font-bold uppercase tracking-[0.12em] underline decoration-[#c4a85a]/40 underline-offset-4 transition hover:decoration-[#B8954A]"
              style={{ color: BRONZE }}
              onClick={() => onBeforeNavigateToEdit?.()}
            >
              Volver a editar
            </Link>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <p className="text-center text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: MUTED }}>
          Vista previa del anuncio
        </p>

        {/* Hero + right rail */}
        <section className="mt-4 grid gap-5 lg:grid-cols-[1fr_minmax(272px,300px)] lg:items-start lg:gap-7">
          <div className="min-w-0">
            <h1
              className="text-[1.5rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[1.85rem] md:text-[2.05rem]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: CHARCOAL }}
            >
              {h.title}
            </h1>
            <p className="mt-1 text-[13px] font-semibold leading-snug" style={{ color: MUTED }}>
              {h.operationLine}
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[13px] leading-snug" style={{ color: MUTED }}>
              <FiMapPin className="inline h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              <span>{h.locationLine}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
              <span
                className="text-[1.65rem] font-bold leading-none tracking-tight sm:text-[2.15rem]"
                style={{ color: "#9A7230", fontFamily: "Georgia, serif" }}
              >
                {h.priceDisplay}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em]"
                style={{
                  border: `1px solid ${BRONZE_SOFT}`,
                  background: "rgba(197, 160, 89, 0.1)",
                  color: "#8B6B2A",
                }}
              >
                {h.statusPill}
              </span>
            </div>

            <div
              className="mt-4 overflow-hidden rounded-xl border"
              style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}
            >
              <div className="grid grid-cols-3">
                {h.quickFacts.map((q, i) => {
                  const Icon = QUICK_FACT_ICONS[i % QUICK_FACT_ICONS.length];
                  return (
                    <div
                      key={i}
                      className={`min-w-0 px-2 py-3 sm:px-3 sm:py-3.5 ${i > 0 ? "border-l" : ""}`}
                      style={{ borderColor: "rgba(44, 36, 22, 0.08)" }}
                    >
                      <div className="mb-1.5 flex justify-center" style={{ color: BRONZE }}>
                        <Icon className="h-4 w-4 opacity-90" aria-hidden />
                      </div>
                      <p className="text-[8px] font-bold uppercase leading-tight tracking-[0.08em]" style={{ color: MUTED }}>
                        {q.label}
                      </p>
                      <p className="mt-1 truncate text-[13px] font-bold leading-tight tracking-tight">{q.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <aside
            className="rounded-xl border p-4 sm:p-4"
            style={{
              borderColor: BORDER,
              background: `linear-gradient(180deg, ${CREAM} 0%, #faf7f2 100%)`,
              boxShadow: CARD_SHADOW,
            }}
          >
            {pc.brandLogoUrl ? (
              <div className="mx-auto mb-2 flex max-w-[160px] justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pc.brandLogoUrl} alt="" className="max-h-12 w-auto object-contain opacity-95" />
              </div>
            ) : null}
            {pc.brandName ? (
              <p className="text-center text-xs font-bold tracking-tight" style={{ color: MUTED }}>
                {pc.brandName}
              </p>
            ) : null}
            {pc.brandWebsiteHref ? (
              <a
                href={pc.brandWebsiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 flex w-full items-center justify-center gap-1 text-center text-[11px] font-semibold"
                style={{ color: BRONZE }}
              >
                Sitio web
                <FiExternalLink className="h-3 w-3 opacity-80" aria-hidden />
              </a>
            ) : null}

            <div className="mx-auto mt-3 w-full max-w-[200px]">
              {pc.agentPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pc.agentPhotoUrl}
                  alt=""
                  className="mx-auto aspect-square w-full max-h-48 rounded-xl border object-cover"
                  style={{ borderColor: BORDER, boxShadow: "0 2px 12px rgba(44,36,22,0.06)" }}
                />
              ) : (
                <div
                  className="flex aspect-square w-full items-center justify-center rounded-xl border text-[11px] font-medium"
                  style={{
                    borderColor: BORDER,
                    color: MUTED,
                    background: "linear-gradient(145deg, rgba(255,252,247,0.9), rgba(249,246,241,0.7))",
                  }}
                >
                  Foto del agente
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-base font-bold leading-tight tracking-tight">{pc.agentName}</p>
            <p className="mt-0.5 text-center text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: BRONZE }}>
              {pc.agentTitle}
            </p>
            {pc.agentBio ? (
              <p className="mt-2 text-center text-[11px] leading-relaxed" style={{ color: MUTED }}>
                {pc.agentBio}
              </p>
            ) : null}
            {pc.areaServicioLine ? (
              <p className="mt-2 text-center text-[10px] leading-snug" style={{ color: MUTED }}>
                <span className="font-semibold opacity-80">Área:</span> {pc.areaServicioLine}
              </p>
            ) : null}
            {pc.idiomasLine ? (
              <p className="mt-1 text-center text-[10px] leading-snug" style={{ color: MUTED }}>
                <span className="font-semibold opacity-80">Idiomas:</span> {pc.idiomasLine}
              </p>
            ) : null}
            {pc.agentLicenseLine ? (
              <p className="mt-2.5 text-center text-[10px] leading-snug" style={{ color: MUTED }}>
                {pc.agentLicenseLine}
              </p>
            ) : null}
            {pc.brandLicenseLine ? (
              <p className="mt-1.5 text-center text-[10px] leading-snug" style={{ color: MUTED }}>
                {pc.brandLicenseLine}
              </p>
            ) : null}

            <div
              className="mt-3 space-y-1 rounded-lg px-2 py-2.5 text-center"
              style={{ background: "rgba(44,36,22,0.03)" }}
            >
              <p className="text-sm font-semibold tracking-tight">{pc.phoneDisplay}</p>
              <p className="truncate text-[11px] opacity-85">{pc.emailDisplay}</p>
            </div>

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
                  className="flex w-full items-center justify-center rounded-lg border bg-white/60 py-2 text-[13px] font-semibold transition hover:bg-white"
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
          </aside>
        </section>

        {/* Gallery */}
        <section className={SECTION_GAP}>
          {sectionHeading("Galería")}
          <div className="grid gap-2 lg:grid-cols-12 lg:gap-3">
            <div className="lg:col-span-7">
              {m.heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.heroUrl}
                  alt=""
                  className="aspect-[16/10] w-full rounded-xl border object-cover"
                  style={{ borderColor: BORDER, boxShadow: MEDIA_SHADOW }}
                />
              ) : (
                <EmptySlot title="Foto principal" subtitle="Agrega fotos en el formulario." />
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5 lg:col-span-5 lg:gap-2">
              {m.secondaryUrls.slice(0, 2).map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={u}
                  alt=""
                  className="aspect-[4/3] w-full rounded-lg border object-cover"
                  style={{ borderColor: BORDER, boxShadow: "0 2px 12px rgba(44,36,22,0.05)" }}
                />
              ))}
              {m.secondaryUrls.length < 2
                ? Array.from({ length: 2 - m.secondaryUrls.length }).map((_, i) => (
                    <EmptySlot key={`e-${i}`} title={`Foto ${m.secondaryUrls.length + i + 2}`} subtitle="Opcional" />
                  ))
                : null}
              {m.videoEmbedUrl ? (
                m.videoEmbedUrl.startsWith("data:") ? (
                  <video
                    src={m.videoEmbedUrl}
                    controls
                    className="aspect-[4/3] w-full rounded-lg border object-cover"
                    style={{ borderColor: BORDER }}
                  />
                ) : (
                  <a
                    href={m.videoEmbedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-lg border text-[11px] font-bold tracking-wide"
                    style={{ borderColor: BORDER, background: "#1a2744", color: "#fff", boxShadow: MEDIA_SHADOW }}
                  >
                    Ver video
                  </a>
                )
              ) : (
                <EmptySlot title="Video" subtitle="Pega un enlace o sube un archivo." />
              )}
              {m.tourHref ? (
                <a
                  href={m.tourHref}
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-lg border text-center text-[11px] font-bold tracking-wide"
                  style={{ borderColor: BORDER, background: "#243a5e", color: "#fff", boxShadow: MEDIA_SHADOW }}
                  {...anchorPropsForHref(m.tourHref, "tour.pdf")}
                >
                  Ver tour
                </a>
              ) : (
                <EmptySlot title="Tour" subtitle="Enlace o archivo." />
              )}
            </div>
          </div>
          {m.photoCount > 0 ? (
            <p className="mt-2 text-center text-[10px] font-medium" style={{ color: MUTED }}>
              {m.photoCount} fotos en total
            </p>
          ) : null}
        </section>

        {/* Details + features */}
        <section className={`${SECTION_GAP} grid gap-4 lg:grid-cols-2 lg:gap-5`}>
          <div className="rounded-xl border" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
            <div className={CARD_PAD}>
              <h3 className={`${SECTION_LABEL} mb-3`} style={{ color: MUTED }}>
                Detalles de la propiedad
              </h3>
              <dl className="grid gap-2.5 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2.5">
                {vm.propertyRows.map((r) => (
                  <div key={r.label} className="min-w-0 border-b pb-2.5 last:border-b-0 sm:border-b-0 sm:pb-0" style={{ borderColor: "rgba(44,36,22,0.06)" }}>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.06em]" style={{ color: MUTED }}>
                      {r.label}
                    </dt>
                    <dd className="mt-0.5 text-[13px] font-semibold leading-snug">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="rounded-xl border" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
            <div className={CARD_PAD}>
              <h3 className={`${SECTION_LABEL} mb-3`} style={{ color: MUTED }}>
                Características destacadas
              </h3>
              {vm.destacadosLabels.length ? (
                <ul className="grid gap-1.5 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-1.5">
                  {vm.destacadosLabels.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-[13px] leading-snug">
                      <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: `linear-gradient(180deg, #C9A85A, ${BRONZE})` }}>
                        ✓
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px]" style={{ color: MUTED }}>
                  Sin características seleccionadas.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Description */}
        <section className={`${SECTION_GAP} rounded-xl border`} style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
          <div className={CARD_PAD}>
            <h3
              className="mb-3 text-sm font-bold leading-tight tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: CHARCOAL }}
            >
              Descripción
            </h3>
            {vm.hasDescription ? (
              <div className="space-y-3 text-[13px] leading-[1.65]">
                {vm.descripcionPrincipal.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-[13px]" style={{ color: MUTED }}>
                Sin descripción todavía.
              </p>
            )}
            {vm.hasNotas ? (
              <div className="mt-5 border-t pt-4" style={{ borderColor: "rgba(44,36,22,0.08)" }}>
                <p className={`${SECTION_LABEL} mb-2`} style={{ color: MUTED }}>
                  Notas adicionales
                </p>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed" style={{ color: MUTED }}>
                  {vm.notasAdicionales}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        {(vm.extras.openHouseSummary || vm.extras.asesorBlock || mapsUrl) && (
          <section className={`${SECTION_GAP} space-y-4`}>
            <h2
              className="text-center text-base font-bold leading-tight tracking-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: CHARCOAL }}
            >
              Más información
            </h2>
            <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
              {vm.extras.openHouseSummary ? (
                <div className="rounded-xl border" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                  <div className={CARD_PAD}>
                    <h4 className={`${SECTION_LABEL} mb-2`} style={{ color: MUTED }}>
                      Open house
                    </h4>
                    <p className="whitespace-pre-line text-[13px] leading-relaxed">{vm.extras.openHouseSummary}</p>
                  </div>
                </div>
              ) : null}
              {vm.extras.asesorBlock ? (
                <div className="rounded-xl border" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                  <div className={CARD_PAD}>
                    <h4 className={`${SECTION_LABEL} mb-2`} style={{ color: MUTED }}>
                      Contacto de financiamiento
                    </h4>
                    <p className="text-[13px] font-semibold">{vm.extras.asesorBlock.name}</p>
                    <p className="text-[13px]">{vm.extras.asesorBlock.phone}</p>
                    <p className="mt-0.5 truncate text-[11px] opacity-90">{vm.extras.asesorBlock.email}</p>
                  </div>
                </div>
              ) : null}
              {mapsUrl ? (
                <div className="rounded-xl border lg:col-span-2" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                  <div className={`${CARD_PAD} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}>
                    <h4 className={`${SECTION_LABEL} mb-0 sm:mb-0`} style={{ color: MUTED }}>
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
          <footer className="mt-8 border-t pt-5 text-center text-[10px] leading-relaxed" style={{ borderColor: BORDER, color: MUTED }}>
            {footerExtra}
          </footer>
        ) : null}
      </main>
    </div>
  );
}
