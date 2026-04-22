/**
 * Vista previa Negocio — agente individual / residencial.
 * Datos: `AgenteIndividualResidencialFormState` directo (patrón Autos; sin VM intermedia).
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  BiArea,
  BiBath,
  BiBed,
  BiBuilding,
  BiCalendar,
  BiCar,
  BiLayer,
  BiShapeSquare,
} from "react-icons/bi";
import { FiExternalLink, FiMapPin, FiVideo } from "react-icons/fi";
import { SiFacebook, SiInstagram, SiTiktok, SiX, SiYoutube } from "react-icons/si";
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import type { QuickFactKey } from "../lib/agenteResidencialPreviewFormat";
import {
  buildBrokerSupportBlock,
  buildContactModel,
  buildDestacadosLabels,
  buildGalleryModel,
  buildLocationLine,
  buildMapQuery,
  buildOpenHouseSlotSummaries,
  buildPropertyDetailRows,
  buildQuickFacts,
  buildSecondAgentSocialHrefs,
  effectiveAgente2TelefonoPersonal,
  effectiveAgenteTelefonoOficina,
  effectiveAgenteTelefonoPersonal,
  formatEstadoAnuncioLabel,
  formatPrecioUsd,
  formatPreviewPhoneDisplay,
  formatTipoPublicacionFijoLine,
  galleryPhotoUrlsOrdered,
  hasBrandBlockVisible,
  hasSecondAgentRailContent,
  hrefFromUserInput,
  previewWhatsappClickHref,
  restPhotoIndicesAfterCover,
  trim,
  type AgenteResPreviewLocale,
} from "../lib/agenteResidencialPreviewFormat";
import { digitsOnly } from "../application/utils/phoneMask";
import { useBrAgenteResidencialCopy } from "../application/BrAgenteResidencialLocaleContext";
import { AgenteIndividualResidencialMediaLightbox } from "./AgenteIndividualResidencialMediaLightbox";
import {
  hasDescription,
  hasFeatures,
  hasLowerExtras,
  hasNotas,
  hasPropertyDetails,
} from "../lib/agenteResidencialPreviewPresence";

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

/** Mobile: gallery → headline → contact rail → body. Desktop: headline / gallery / body stacked in col1; rail col2. */
const MAIN_GRID =
  "mt-0 grid grid-cols-1 gap-y-3 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-x-7 lg:items-start";
const CARD_PAD = "px-4 py-4 sm:px-5 sm:py-4";
const SECTION_LABEL = `${typo.kicker} mb-2.5`;

const QUICK_FACT_ICON: Record<
  QuickFactKey,
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  recamaras: BiBed,
  banos: BiBath,
  tamano_interior: BiArea,
  estacionamientos: BiCar,
  ano_construccion: BiCalendar,
  tamano_lote: BiShapeSquare,
  oficinas: BiBuilding,
  niveles: BiLayer,
};

function anchorPropsForHref(href: string, downloadFallback?: string | null) {
  if (href.startsWith("data:")) {
    return { download: downloadFallback || "file.pdf" } as const;
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
      {icon ? (
        <span className="opacity-50" style={{ color: BRONZE }}>
          {icon}
        </span>
      ) : null}
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border text-[#3d3428] transition hover:border-[#c4a85a]/50 hover:bg-[rgba(197,160,89,0.08)] sm:h-8 sm:w-8"
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

export function AgenteIndividualResidencialPreviewPage({
  data,
  editHref,
  footerExtra,
  onBeforeNavigateToEdit,
}: {
  data: AgenteIndividualResidencialFormState;
  editHref?: string;
  footerExtra?: string;
  onBeforeNavigateToEdit?: () => void;
}) {
  const { lang, t } = useBrAgenteResidencialCopy();
  const locale: AgenteResPreviewLocale = lang === "en" ? "en" : "es";
  const p = t.previewUi;

  const slotTourCaption = (variant: "tour" | "brochure" | "none") => {
    if (variant === "tour") return p.tourVirtual;
    if (variant === "brochure") return p.planoFolleto;
    return p.tourPlano;
  };

  const g = buildGalleryModel(data);
  const cr = buildContactModel(data);
  const propertyRows = buildPropertyDetailRows(data, locale);
  const destacadosLabels = buildDestacadosLabels(data, locale);
  const quickFacts = buildQuickFacts(data, locale);
  const showBrand = hasBrandBlockVisible(data);
  const title = trim(data.titulo);
  const priceDisplay = formatPrecioUsd(data.precio);
  const statusPill = formatEstadoAnuncioLabel(data, locale);
  const locationLine = buildLocationLine(data);
  const mapQuery = buildMapQuery(data);
  const mapsUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null;
  const openHouseSummaries = buildOpenHouseSlotSummaries(data, locale);
  const brokerSupportBlock = buildBrokerSupportBlock(data);
  const agente2Social = buildSecondAgentSocialHrefs(data);
  const opLine = formatTipoPublicacionFijoLine(data, locale);

  const agentLicenseLine = trim(data.agenteLicencia) ? `${p.licenciaAgente} ${trim(data.agenteLicencia)}` : "";
  const brandLicenseLine = showBrand && trim(data.marcaLicencia) ? `${p.licenciaMarca} ${trim(data.marcaLicencia)}` : "";
  const resolvedBrandSite = showBrand ? hrefFromUserInput(data.marcaSitioWeb) : null;
  /** BR Negocio lane is fixed to `agente_individual` (see `BrNegocioSellerTipo`). */
  const showPrimaryAgentVisual = true;
  const showSecondAgentRail = hasSecondAgentRailContent(data);
  const agente2LicenseLine = trim(data.agente2Licencia) ? `${p.licenciaAgente} ${trim(data.agente2Licencia)}` : "";
  const agentePersonalRaw = effectiveAgenteTelefonoPersonal(data);
  const agenteOfficeRaw = effectiveAgenteTelefonoOficina(data);
  const agentePersonalOk = digitsOnly(agentePersonalRaw).length >= 10;
  const agenteOfficeOk = digitsOnly(agenteOfficeRaw).length >= 10;
  const agenteCardSiteHref = hrefFromUserInput(data.agenteSitioWeb);
  const agente2PersonalRaw = effectiveAgente2TelefonoPersonal(data);
  const agente2OfficeRaw = trim(data.agente2TelefonoOficina);
  const agente2PersonalOk = digitsOnly(agente2PersonalRaw).length >= 10;
  const agente2OfficeOk = digitsOnly(agente2OfficeRaw).length >= 10;
  const agente2WaHref = previewWhatsappClickHref(data.agente2Whatsapp);
  const agente2SiteHref = hrefFromUserInput(data.agente2SitioWeb);

  const [mediaLightboxOpen, setMediaLightboxOpen] = useState(false);
  const [mediaLightboxIndex, setMediaLightboxIndex] = useState(0);

  const photoUrlsOrdered = useMemo(() => galleryPhotoUrlsOrdered(data), [data]);
  const restPhotoIdx = useMemo(() => restPhotoIndicesAfterCover(data), [data]);
  const idxSecondaryA = restPhotoIdx[0];
  const idxSecondaryB = restPhotoIdx[1];

  const openMediaAt = useCallback((idx: number) => {
    setMediaLightboxIndex(idx);
    setMediaLightboxOpen(true);
  }, []);

  const hasVideoInLightbox = Boolean(g.videoDataUrl || g.videoExternalHref);
  const videoSlideIndex = photoUrlsOrdered.length;

  const showPrimaryContactStrip =
    agentePersonalOk || agenteOfficeOk || trim(data.correoPrincipal) || Boolean(agenteCardSiteHref);
  const showAgente2ContactStrip =
    agente2PersonalOk ||
    agente2OfficeOk ||
    trim(data.agente2Correo) ||
    Boolean(agente2WaHref) ||
    Boolean(agente2SiteHref);

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: IVORY, color: CHARCOAL }}>
      <header
        className="border-b backdrop-blur-sm"
        style={{ borderColor: BORDER, background: "rgba(253, 251, 247, 0.92)" }}
      >
        <div className="mx-auto max-w-[1140px] px-4 py-3 sm:px-6 sm:py-3.5 lg:px-7 lg:py-4">
          <div className="relative flex min-h-[2.875rem] items-center sm:min-h-[3.125rem]">
            <div className="relative z-10 min-w-0 max-w-[38%] flex-1 pr-2 sm:max-w-[42%] sm:pr-3">
              <p
                className="line-clamp-2 text-left text-[13px] font-bold leading-tight tracking-[-0.01em] text-[#2C2416] sm:text-[14px] sm:leading-snug"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontVariantNumeric: "tabular-nums" }}
                title={p.badge}
              >
                {p.badge}
              </p>
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-[clamp(6.5rem,30vw,11rem)]">
              <Image
                src="/leonix-preview-wordmark.png"
                alt="Leonix Media Clasificados"
                width={640}
                height={98}
                sizes="(max-width: 640px) min(220px, 58vw), (max-width: 1024px) 260px, 300px"
                className="h-auto w-full max-w-[min(240px,58vw)] object-contain object-center sm:max-w-[min(280px,52vw)] lg:max-w-[min(320px,42vw)]"
                priority
              />
            </div>
            <div className="relative z-10 flex min-w-0 max-w-[38%] flex-1 items-center justify-end pl-2 sm:max-w-[42%] sm:pl-3">
              {editHref ? (
                <Link
                  href={editHref}
                  prefetch={false}
                  className="inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-full border border-[#C9B46A]/50 bg-[rgba(255,252,247,0.95)] px-2.5 py-1.5 text-center text-[9px] font-semibold uppercase leading-none tracking-[0.08em] text-[#5C4A28] shadow-[0_1px_2px_rgba(44,36,22,0.06)] transition hover:border-[#B8954A]/65 hover:bg-[#FFF6E7] sm:px-3 sm:text-[10px]"
                  style={{ borderColor: "rgba(201, 180, 106, 0.42)" }}
                  onClick={() => onBeforeNavigateToEdit?.()}
                >
                  {p.volverEditar}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1140px] px-4 pb-10 pt-1 sm:px-6 lg:px-7">
        <p className={`mb-0 text-center ${typo.meta}`} style={{ color: MUTED }}>
          {p.meta}
        </p>

        {/* Shell: mobile order = gallery → title → rail → body; lg = title / gallery / body | rail */}
        <section className={MAIN_GRID}>
          <div className="order-2 min-w-0 lg:col-start-1 lg:row-start-1">
            <div className="rounded-xl border px-4 py-3 sm:px-6 sm:py-3" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
              {title ? (
                <h1 className={typo.title} style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: CHARCOAL }}>
                  {title}
                </h1>
              ) : null}
              <p className={`${title ? "mt-1" : ""} ${typo.bodySm} font-semibold`} style={{ color: MUTED }}>
                {opLine}
              </p>
              {locationLine || mapsUrl ? (
                <p className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 ${typo.bodySm} font-medium`} style={{ color: MUTED }}>
                  {locationLine ? (
                    <>
                      <FiMapPin className="inline h-3.5 w-3.5 shrink-0 opacity-65" aria-hidden />
                      <span>{locationLine}</span>
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
                      {p.verMapa}
                    </a>
                  ) : null}
                </p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
                {priceDisplay ? (
                  <span className={typo.price} style={{ color: "#8E6A28", fontFamily: "Georgia, serif" }}>
                    {priceDisplay}
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
                  {statusPill}
                </span>
              </div>
              {quickFacts.length ? (
                <div
                  className="mt-4 overflow-x-auto overflow-y-hidden rounded-xl border [-webkit-overflow-scrolling:touch] sm:overflow-x-visible"
                  style={{ borderColor: BORDER, background: IVORY, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)" }}
                >
                  <div
                    className="grid min-w-max gap-px bg-[rgba(44,36,22,0.08)] sm:min-w-0"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(quickFacts.length, 6)}, minmax(0, 1fr))`,
                    }}
                  >
                    {quickFacts.map((q) => {
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

          <div className="order-1 min-w-0 lg:col-start-1 lg:row-start-2">
            <div>
              <h3 className={`${typo.kicker} mb-1.5`} style={{ color: MUTED }}>
                {p.galeria}
              </h3>
              <div className="grid gap-2.5 lg:grid-cols-12 lg:items-start lg:gap-3.5">
                <div className="min-w-0 lg:col-span-8">
                  {g.mainUrl ? (
                    <div>
                      <button
                        type="button"
                        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border bg-transparent p-0 text-left"
                        style={{ borderColor: BORDER, boxShadow: MEDIA_SHADOW }}
                        onClick={() => openMediaAt(data.fotoPortadaIndex)}
                        aria-label={p.galeria}
                      >
                        { }
                        <img
                          src={g.mainUrl}
                          alt=""
                          className="aspect-[16/10] w-full object-cover transition duration-200 group-hover:opacity-95"
                        />
                      </button>
                      <GalleryCaption>{p.fotoPrincipal}</GalleryCaption>
                    </div>
                  ) : (
                    <div>
                      <EmptySlot title={p.slotPrincipal} subtitle={p.slotPrincipalSub} />
                      <GalleryCaption>{p.fotoPrincipal}</GalleryCaption>
                    </div>
                  )}
                </div>

                <div className="grid min-w-0 grid-cols-2 gap-2 lg:col-span-4 lg:gap-2">
                  {g.secondary1 && idxSecondaryA !== undefined ? (
                    <div>
                      <button
                        type="button"
                        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg border bg-transparent p-0 text-left"
                        style={{ borderColor: BORDER, boxShadow: "0 2px 14px rgba(44,36,22,0.06)" }}
                        onClick={() => openMediaAt(idxSecondaryA)}
                        aria-label={p.foto2}
                      >
                        { }
                        <img
                          src={g.secondary1}
                          alt=""
                          className="aspect-[4/3] w-full object-cover transition duration-200 group-hover:opacity-95"
                        />
                      </button>
                      <GalleryCaption>{p.foto2}</GalleryCaption>
                    </div>
                  ) : (
                    <div>
                      <EmptySlot title={p.foto2} subtitle={p.opcional} />
                      <GalleryCaption>{p.foto2}</GalleryCaption>
                    </div>
                  )}

                  {g.secondary2 && idxSecondaryB !== undefined ? (
                    <div>
                      <button
                        type="button"
                        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg border bg-transparent p-0 text-left"
                        style={{ borderColor: BORDER, boxShadow: "0 2px 14px rgba(44,36,22,0.06)" }}
                        onClick={() => openMediaAt(idxSecondaryB)}
                        aria-label={p.foto3}
                      >
                        { }
                        <img
                          src={g.secondary2}
                          alt=""
                          className="aspect-[4/3] w-full object-cover transition duration-200 group-hover:opacity-95"
                        />
                      </button>
                      <GalleryCaption>{p.foto3}</GalleryCaption>
                    </div>
                  ) : (
                    <div>
                      <EmptySlot title={p.foto3} subtitle={p.opcional} />
                      <GalleryCaption>{p.foto3}</GalleryCaption>
                    </div>
                  )}

                  {g.videoDataUrl ? (
                    <div>
                      <button
                        type="button"
                        className="group relative block w-full overflow-hidden rounded-lg border bg-[#0f172a] p-0 text-left"
                        style={{ borderColor: BORDER, boxShadow: MEDIA_SHADOW }}
                        onClick={() => hasVideoInLightbox && openMediaAt(videoSlideIndex)}
                        aria-label={p.reproducirVideo}
                      >
                        <video
                          src={g.videoDataUrl}
                          muted
                          playsInline
                          className="pointer-events-none aspect-[4/3] w-full object-cover opacity-95"
                        />
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/35 opacity-100 transition group-hover:bg-black/45">
                          <FiVideo className="h-8 w-8 text-white drop-shadow" aria-hidden />
                          <span className="text-[10px] font-bold uppercase tracking-wide text-white">{p.reproducirVideo}</span>
                        </span>
                      </button>
                      <GalleryCaption>{p.video}</GalleryCaption>
                    </div>
                  ) : g.videoExternalHref ? (
                    <div>
                      <button
                        type="button"
                        className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border text-[11px] font-bold tracking-wide transition hover:opacity-95"
                        style={{ borderColor: BORDER, background: "#1a2744", color: "#fff", boxShadow: MEDIA_SHADOW }}
                        onClick={() => hasVideoInLightbox && openMediaAt(videoSlideIndex)}
                        aria-label={p.reproducirVideo}
                      >
                        <FiVideo className="h-6 w-6 opacity-90" aria-hidden />
                        {p.reproducirVideo}
                      </button>
                      <GalleryCaption>{p.video}</GalleryCaption>
                    </div>
                  ) : (
                    <div>
                      <EmptySlot
                        title={p.slotVideoTitle}
                        subtitle={p.slotVideoSub}
                        icon={<FiVideo className="h-5 w-5" aria-hidden />}
                      />
                      <GalleryCaption>{p.video}</GalleryCaption>
                    </div>
                  )}

                  {g.tourOrPlan.href ? (
                    <div>
                      <a
                        href={g.tourOrPlan.href}
                        className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border text-center text-[11px] font-bold tracking-wide"
                        style={{ borderColor: BORDER, background: "#243a5e", color: "#fff", boxShadow: MEDIA_SHADOW }}
                        {...anchorPropsForHref(
                          g.tourOrPlan.href,
                          g.tourOrPlan.variant === "brochure" ? "folleto.pdf" : "tour.pdf",
                        )}
                      >
                        {g.tourOrPlan.variant === "tour" ? p.abrirTour : p.abrirPlano}
                      </a>
                      <GalleryCaption>{slotTourCaption(g.tourOrPlan.variant)}</GalleryCaption>
                    </div>
                  ) : (
                    <div>
                      <EmptySlot title={p.slotTour} subtitle={p.slotTourSub} />
                      <GalleryCaption>{slotTourCaption("none")}</GalleryCaption>
                    </div>
                  )}
                </div>
              </div>

              {g.showAllPhotosPill ? (
                <div
                  className="mt-1.5 flex justify-center"
                  role="note"
                  title={p.notaVerTodasFotos}
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
                    {p.verTodasFotos(g.totalPhotos)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="order-4 flex min-w-0 flex-col gap-3 lg:col-start-1 lg:row-start-3">
            {(hasPropertyDetails(data) || hasFeatures(data)) && (
              <section
                className={`grid gap-3.5 lg:gap-3 lg:items-stretch ${
                  hasPropertyDetails(data) && hasFeatures(data) ? "lg:grid-cols-2" : "lg:grid-cols-1"
                }`}
              >
                {hasPropertyDetails(data) ? (
                  <div className="rounded-xl border" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                    <div className={CARD_PAD}>
                      <h3 className={SECTION_LABEL} style={{ color: MUTED }}>
                        {p.detallesPropiedad}
                      </h3>
                      <dl className="grid gap-2 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2">
                        {propertyRows.map((r) => (
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
                {hasFeatures(data) ? (
                  <div className="rounded-xl border" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                    <div className={CARD_PAD}>
                      <h3 className={SECTION_LABEL} style={{ color: MUTED }}>
                        {p.caracteristicas}
                      </h3>
                      <ul className="grid gap-1.5 sm:grid-cols-2 sm:gap-x-2.5 sm:gap-y-1.5">
                        {destacadosLabels.map((lbl) => (
                          <li key={lbl} className={`flex items-start gap-2 ${typo.body} leading-snug`}>
                            <span
                              className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                              style={{ background: `linear-gradient(180deg, #C9A85A, ${BRONZE})` }}
                            >
                              ✓
                            </span>
                            <span>{lbl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </section>
            )}

            {hasDescription(data) || hasNotas(data) ? (
              <section className="rounded-xl border" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                <div className={CARD_PAD}>
                  <h3
                    className={`mb-2.5 ${typo.sectionSerif}`}
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: CHARCOAL }}
                  >
                    {p.descripcion}
                  </h3>
                  {hasDescription(data) ? (
                    <div className={`space-y-3 ${typo.body}`}>
                      {trim(data.descripcionPrincipal)
                        .split(/\n\n+/)
                        .map((para, i) => (
                          <p key={i} className="whitespace-pre-wrap text-[#3a342c]">
                            {para}
                          </p>
                        ))}
                    </div>
                  ) : null}
                  {hasNotas(data) ? (
                    <div className={`${hasDescription(data) ? "mt-4 border-t pt-3" : ""}`} style={{ borderColor: "rgba(44,36,22,0.08)" }}>
                      <p className={`${typo.kicker} mb-2`} style={{ color: MUTED }}>
                        {p.notasAdicionales}
                      </p>
                      <p className={`${typo.body} whitespace-pre-wrap`} style={{ color: MUTED }}>
                        {trim(data.notasAdicionales)}
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {hasLowerExtras(data) ? (
              <section className="space-y-3">
                <h2
                  className={`text-center ${typo.lowerSerif}`}
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: MUTED }}
                >
                  Más información
                </h2>
                <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
                  {openHouseSummaries.length > 0 ? (
                    <div className="rounded-xl border lg:col-span-2" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                      <div className={CARD_PAD}>
                        <h4 className={`${typo.kicker} mb-2`} style={{ color: MUTED }}>
                          {p.openHouse}
                        </h4>
                        <div
                          className={`grid gap-2 ${openHouseSummaries.length > 1 ? "sm:grid-cols-2" : ""}`}
                        >
                          {openHouseSummaries.map((summary, i) => (
                            <div
                              key={i}
                              className="rounded-lg border px-3 py-2.5"
                              style={{ borderColor: BORDER, background: "rgba(255,252,247,0.65)" }}
                            >
                              <p className={`${typo.body} whitespace-pre-line`}>{summary}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {brokerSupportBlock ? (
                    <div className="rounded-xl border lg:col-span-2" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                      <div className={CARD_PAD}>
                        <h4 className={`${typo.kicker} mb-2`} style={{ color: MUTED }}>
                          {p.brokerAsesor}
                        </h4>
                        {brokerSupportBlock.fotoDataUrl ? (
                          <div className="mb-2 max-w-[100px]">
                            { }
                            <img
                              src={brokerSupportBlock.fotoDataUrl}
                              alt=""
                              className="aspect-square w-full max-h-[100px] rounded-md border object-cover"
                              style={{ borderColor: BORDER }}
                            />
                          </div>
                        ) : null}
                        <p className={`${typo.body} font-semibold`}>{brokerSupportBlock.name}</p>
                        {brokerSupportBlock.title ? (
                          <p className={`${typo.bodySm} mt-0.5`} style={{ color: MUTED }}>
                            {brokerSupportBlock.title}
                          </p>
                        ) : null}
                        {brokerSupportBlock.license ? (
                          <p className={`${typo.bodySm} mt-1 opacity-90`} style={{ color: MUTED_LIGHT }}>
                            {brokerSupportBlock.license}
                          </p>
                        ) : null}
                        {brokerSupportBlock.email ? (
                          <a
                            href={`mailto:${brokerSupportBlock.email}`}
                            className="mt-2 block truncate text-sm font-semibold"
                            style={{ color: BRONZE }}
                          >
                            {brokerSupportBlock.email}
                          </a>
                        ) : null}
                        {digitsOnly(brokerSupportBlock.personalPhone).length >= 10 ? (
                          <a
                            href={`tel:${digitsOnly(brokerSupportBlock.personalPhone)}`}
                            className={`mt-2 block ${typo.bodySm} font-semibold`}
                            style={{ color: CHARCOAL }}
                          >
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/90">{p.telPersonal}</span>
                            {formatPreviewPhoneDisplay(brokerSupportBlock.personalPhone)}
                          </a>
                        ) : null}
                        {digitsOnly(brokerSupportBlock.officePhone).length >= 10 ? (
                          <a
                            href={`tel:${digitsOnly(brokerSupportBlock.officePhone)}`}
                            className={`mt-1 block ${typo.bodySm} font-semibold`}
                            style={{ color: CHARCOAL }}
                          >
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/90">{p.telOficina}</span>
                            {formatPreviewPhoneDisplay(brokerSupportBlock.officePhone)}
                          </a>
                        ) : null}
                        {brokerSupportBlock.whatsappHref ? (
                          <a
                            href={brokerSupportBlock.whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-2 inline-flex items-center gap-1 ${typo.bodySm} font-semibold`}
                            style={{ color: "#128C7E" }}
                          >
                            {p.whatsapp}
                            <FiExternalLink className="h-3 w-3 opacity-80" aria-hidden />
                          </a>
                        ) : null}
                        {brokerSupportBlock.website ? (
                          <a
                            href={brokerSupportBlock.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold"
                            style={{ color: BRONZE }}
                          >
                            {p.sitioWeb}
                            <FiExternalLink className="h-3 w-3 opacity-80" aria-hidden />
                          </a>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {brokerSupportBlock.socialInstagram ? (
                            <SocialCircle href={brokerSupportBlock.socialInstagram} label="Instagram">
                              <SiInstagram className="h-3.5 w-3.5" aria-hidden />
                            </SocialCircle>
                          ) : null}
                          {brokerSupportBlock.socialFacebook ? (
                            <SocialCircle href={brokerSupportBlock.socialFacebook} label="Facebook">
                              <SiFacebook className="h-3.5 w-3.5" aria-hidden />
                            </SocialCircle>
                          ) : null}
                          {brokerSupportBlock.socialYoutube ? (
                            <SocialCircle href={brokerSupportBlock.socialYoutube} label="YouTube">
                              <SiYoutube className="h-3.5 w-3.5" aria-hidden />
                            </SocialCircle>
                          ) : null}
                          {brokerSupportBlock.socialTiktok ? (
                            <SocialCircle href={brokerSupportBlock.socialTiktok} label="TikTok">
                              <SiTiktok className="h-3.5 w-3.5" aria-hidden />
                            </SocialCircle>
                          ) : null}
                          {brokerSupportBlock.socialX ? (
                            <SocialCircle href={brokerSupportBlock.socialX} label="X">
                              <SiX className="h-3.5 w-3.5" aria-hidden />
                            </SocialCircle>
                          ) : null}
                          {brokerSupportBlock.socialOtro ? (
                            <SocialCircle href={brokerSupportBlock.socialOtro} label={p.verSitioWeb}>
                              <FiExternalLink className="h-3.5 w-3.5" aria-hidden />
                            </SocialCircle>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {mapQuery ? (
                    <div className="rounded-xl border lg:col-span-2" style={{ borderColor: BORDER, background: CREAM, boxShadow: CARD_SHADOW }}>
                      <div className={`${CARD_PAD} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}>
                        <h4 className={`${typo.kicker} mb-0`} style={{ color: MUTED }}>
                          {p.ubicacionAprox}
                        </h4>
                        {mapsUrl ? (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center justify-center rounded-lg border px-3 py-2 text-[11px] font-bold transition hover:bg-[rgba(197,160,89,0.08)]"
                            style={{ borderColor: `${BRONZE}aa`, color: BRONZE }}
                          >
                            {p.abrirMapa}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {footerExtra ? (
              <footer className={`border-t pt-4 text-center ${typo.bodySm}`} style={{ borderColor: BORDER, color: MUTED }}>
                {footerExtra}
              </footer>
            ) : null}
          </div>

          <aside
            className="order-3 rounded-xl border lg:sticky lg:top-4 lg:z-10 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-start"
            style={{
              borderColor: BORDER,
              background: `linear-gradient(180deg, ${CREAM} 0%, #f8f4ec 100%)`,
              boxShadow: CARD_SHADOW,
            }}
          >
            <div className="p-3.5 sm:p-4">
              {showBrand ? (
                <div
                  className="mb-4 rounded-xl border px-3 py-3.5 sm:px-4 sm:py-4"
                  style={{
                    borderColor: BORDER,
                    background: "linear-gradient(180deg, rgba(255,252,247,0.98) 0%, rgba(249,246,241,0.92) 100%)",
                    boxShadow: "0 2px 14px rgba(44,36,22,0.06)",
                  }}
                >
                  {trim(data.marcaLogoDataUrl) ? (
                    <div className="mx-auto mb-2.5 flex h-[4.25rem] w-full max-w-[200px] items-center justify-center sm:h-[4.75rem] sm:max-w-[220px]">
                      { }
                      <img
                        src={trim(data.marcaLogoDataUrl)}
                        alt=""
                        className="max-h-full max-w-full object-contain opacity-[0.98]"
                      />
                    </div>
                  ) : null}
                  {trim(data.marcaNombre) ? (
                    <p className={`text-center ${typo.bodySm} font-bold leading-snug`} style={{ color: MUTED }}>
                      {trim(data.marcaNombre)}
                    </p>
                  ) : null}
                  {brandLicenseLine ? (
                    <p className={`mt-1.5 text-center text-[10px] leading-snug`} style={{ color: MUTED_LIGHT }}>
                      {brandLicenseLine}
                    </p>
                  ) : null}
                  {resolvedBrandSite ? (
                    <a
                      href={resolvedBrandSite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex w-full items-center justify-center gap-1 text-center text-[11px] font-semibold"
                      style={{ color: BRONZE }}
                    >
                      {p.sitioWeb}
                      <FiExternalLink className="h-3 w-3 opacity-80" aria-hidden />
                    </a>
                  ) : null}
                </div>
              ) : null}

              <div>
                {showPrimaryAgentVisual ? (
                  <div className="mx-auto w-full max-w-[236px]">
                    {trim(data.agenteFotoDataUrl) ? (
                       
                      <img
                        src={trim(data.agenteFotoDataUrl)}
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
                        {p.fotoAgente}
                      </div>
                    )}
                  </div>
                ) : null}
                {trim(data.agenteNombre) ? <p className={`mt-2.5 text-center ${typo.railName}`}>{trim(data.agenteNombre)}</p> : null}
                {trim(data.agenteTitulo) ? (
                  <p className={`mt-0.5 text-center ${typo.railMeta}`} style={{ color: BRONZE }}>
                    {trim(data.agenteTitulo)}
                  </p>
                ) : null}
                {trim(data.agenteAreaServicio) ? (
                  <p className={`mt-2 text-center ${typo.bodySm}`} style={{ color: MUTED }}>
                    <span className="font-semibold opacity-85">{p.area}</span> {trim(data.agenteAreaServicio)}
                  </p>
                ) : null}
                {trim(data.agenteIdiomas) ? (
                  <p className={`mt-1 text-center ${typo.bodySm}`} style={{ color: MUTED }}>
                    <span className="font-semibold opacity-85">{p.idiomas}</span> {trim(data.agenteIdiomas)}
                  </p>
                ) : null}
                {agentLicenseLine ? (
                  <p className={`mt-2.5 text-center text-[10px] leading-snug`} style={{ color: MUTED_LIGHT }}>
                    {agentLicenseLine}
                  </p>
                ) : null}

                {showSecondAgentRail ? (
                  <div
                    className="mt-4 rounded-lg border px-3 py-3"
                    style={{ borderColor: BORDER, background: "rgba(44,36,22,0.03)" }}
                  >
                    <p className={`text-center ${typo.railMeta}`} style={{ color: BRONZE }}>
                      {locale === "en" ? "Second agent" : "Segundo agente"}
                    </p>
                    {trim(data.agente2FotoDataUrl) ? (
                      <div className="mx-auto mt-2 flex max-w-[120px] justify-center">
                        { }
                        <img
                          src={trim(data.agente2FotoDataUrl)}
                          alt=""
                          className="aspect-square w-full max-h-[120px] rounded-md border object-cover"
                          style={{ borderColor: BORDER }}
                        />
                      </div>
                    ) : null}
                    {trim(data.agente2Nombre) ? (
                      <p className={`mt-2 text-center text-sm font-bold leading-tight`} style={{ color: CHARCOAL }}>
                        {trim(data.agente2Nombre)}
                      </p>
                    ) : null}
                    {trim(data.agente2Titulo) ? (
                      <p className={`mt-0.5 text-center ${typo.railMeta}`} style={{ color: BRONZE }}>
                        {trim(data.agente2Titulo)}
                      </p>
                    ) : null}
                    {agente2LicenseLine ? (
                      <p className={`mt-2 text-center text-[10px] leading-snug`} style={{ color: MUTED_LIGHT }}>
                        {agente2LicenseLine}
                      </p>
                    ) : null}
                    {showAgente2ContactStrip ? (
                      <div className="mt-2 space-y-1 text-center">
                        {agente2PersonalOk ? (
                          <p className="text-[11px] leading-snug">
                            <span className="font-semibold text-[#5C5346]">{p.telPersonal}:</span>{" "}
                            <a href={`tel:${digitsOnly(agente2PersonalRaw)}`} className="font-semibold text-[#2C2416] underline-offset-2 hover:underline">
                              {formatPreviewPhoneDisplay(agente2PersonalRaw)}
                            </a>
                          </p>
                        ) : null}
                        {agente2OfficeOk ? (
                          <p className="text-[11px] leading-snug">
                            <span className="font-semibold text-[#5C5346]">{p.telOficina}:</span>{" "}
                            <a href={`tel:${digitsOnly(agente2OfficeRaw)}`} className="font-semibold text-[#2C2416] underline-offset-2 hover:underline">
                              {formatPreviewPhoneDisplay(agente2OfficeRaw)}
                            </a>
                          </p>
                        ) : null}
                        {agente2WaHref ? (
                          <p className="text-[11px]">
                            <a
                              href={agente2WaHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-[#128C7E] underline-offset-2 hover:underline"
                            >
                              {p.whatsapp}
                            </a>
                          </p>
                        ) : null}
                        {trim(data.agente2Correo) ? (
                          <p className={`truncate text-[11px] opacity-90`}>{trim(data.agente2Correo)}</p>
                        ) : null}
                        {agente2SiteHref ? (
                          <p className="text-[11px]">
                            <a
                              href={agente2SiteHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#B8954A] underline-offset-2 hover:underline"
                            >
                              {p.sitioWeb}
                              <FiExternalLink className="h-3 w-3 opacity-80" aria-hidden />
                            </a>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {agente2Social.showRow ? (
                      <div className="mt-3 flex flex-wrap justify-center gap-1.5 border-t pt-3" style={{ borderColor: BORDER }}>
                        {agente2Social.socialInstagram ? (
                          <SocialCircle href={agente2Social.socialInstagram} label="Instagram">
                            <SiInstagram className="h-3.5 w-3.5" aria-hidden />
                          </SocialCircle>
                        ) : null}
                        {agente2Social.socialFacebook ? (
                          <SocialCircle href={agente2Social.socialFacebook} label="Facebook">
                            <SiFacebook className="h-3.5 w-3.5" aria-hidden />
                          </SocialCircle>
                        ) : null}
                        {agente2Social.socialYoutube ? (
                          <SocialCircle href={agente2Social.socialYoutube} label="YouTube">
                            <SiYoutube className="h-3.5 w-3.5" aria-hidden />
                          </SocialCircle>
                        ) : null}
                        {agente2Social.socialTiktok ? (
                          <SocialCircle href={agente2Social.socialTiktok} label="TikTok">
                            <SiTiktok className="h-3.5 w-3.5" aria-hidden />
                          </SocialCircle>
                        ) : null}
                        {agente2Social.socialX ? (
                          <SocialCircle href={agente2Social.socialX} label="X">
                            <SiX className="h-3 w-3" aria-hidden />
                          </SocialCircle>
                        ) : null}
                        {agente2Social.socialOtro ? (
                          <SocialCircle href={agente2Social.socialOtro} label="Enlace">
                            <FiExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </SocialCircle>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {showPrimaryContactStrip ? (
                  <div
                    className="mt-3 space-y-1 rounded-md px-2 py-2 text-center"
                    style={{ background: "rgba(44,36,22,0.04)" }}
                  >
                    {agentePersonalOk ? (
                      <p className={`${typo.bodySm} font-semibold tracking-tight`}>
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/90">{p.telPersonal}</span>
                        {formatPreviewPhoneDisplay(agentePersonalRaw)}
                      </p>
                    ) : null}
                    {agenteOfficeOk ? (
                      <p className={`${typo.bodySm} font-semibold tracking-tight`}>
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/90">{p.telOficina}</span>
                        {formatPreviewPhoneDisplay(agenteOfficeRaw)}
                      </p>
                    ) : null}
                    {trim(data.correoPrincipal) ? (
                      <p className={`truncate ${typo.bodySm} opacity-90`}>{trim(data.correoPrincipal)}</p>
                    ) : null}
                    {agenteCardSiteHref ? (
                      <p className={typo.bodySm}>
                        <a
                          href={agenteCardSiteHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 font-semibold text-[#B8954A] underline-offset-2 hover:underline"
                        >
                          {p.sitioWeb}
                          <FiExternalLink className="h-3 w-3 opacity-80" aria-hidden />
                        </a>
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {cr.showSocialIcons ? (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5 border-t pt-3" style={{ borderColor: BORDER }}>
                    {cr.socialInstagram ? (
                      <SocialCircle href={cr.socialInstagram} label="Instagram">
                        <SiInstagram className="h-3.5 w-3.5" aria-hidden />
                      </SocialCircle>
                    ) : null}
                    {cr.socialFacebook ? (
                      <SocialCircle href={cr.socialFacebook} label="Facebook">
                        <SiFacebook className="h-3.5 w-3.5" aria-hidden />
                      </SocialCircle>
                    ) : null}
                    {cr.socialYoutube ? (
                      <SocialCircle href={cr.socialYoutube} label="YouTube">
                        <SiYoutube className="h-3.5 w-3.5" aria-hidden />
                      </SocialCircle>
                    ) : null}
                    {cr.socialTiktok ? (
                      <SocialCircle href={cr.socialTiktok} label="TikTok">
                        <SiTiktok className="h-3.5 w-3.5" aria-hidden />
                      </SocialCircle>
                    ) : null}
                    {cr.socialX ? (
                      <SocialCircle href={cr.socialX} label="X">
                        <SiX className="h-3 w-3" aria-hidden />
                      </SocialCircle>
                    ) : null}
                    {cr.socialOtro ? (
                      <SocialCircle href={cr.socialOtro} label="Enlace">
                        <FiExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </SocialCircle>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-3 space-y-1.5 border-t pt-3" style={{ borderColor: BORDER }}>
                  {cr.showLlamar && cr.llamarHref ? (
                    <a
                      href={cr.llamarHref}
                      className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg px-2 py-2.5 text-[13px] font-bold text-[#1E1810] shadow-sm transition hover:brightness-[1.02] lg:min-h-0"
                      style={{ background: `linear-gradient(180deg, #C9A85A 0%, ${BRONZE} 100%)` }}
                    >
                      {p.llamar}
                    </a>
                  ) : null}
                  {cr.showWhatsapp && cr.whatsappHref ? (
                    <a
                      href={cr.whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border bg-white/70 px-2 py-2 text-[13px] font-semibold transition hover:bg-white lg:min-h-0"
                      style={{ borderColor: "rgba(37,211,102,0.35)" }}
                    >
                      {p.whatsapp}
                    </a>
                  ) : null}
                  {cr.showSolicitarInformacion && cr.solicitarInfoHref ? (
                    <a
                      href={cr.solicitarInfoHref}
                      className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[13px] font-semibold lg:min-h-0"
                      style={{ borderColor: BORDER }}
                    >
                      {p.solicitarInfo}
                    </a>
                  ) : null}
                  {cr.showProgramarVisita && cr.programarVisitaHref ? (
                    <a
                      href={cr.programarVisitaHref}
                      className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[13px] font-semibold lg:min-h-0"
                      style={{ borderColor: BORDER }}
                      {...(cr.programarVisitaHref.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {p.programarVisita}
                    </a>
                  ) : null}
                  {cr.showVerSitioWeb && cr.verSitioWebHref ? (
                    <a
                      href={cr.verSitioWebHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[11px] font-bold lg:min-h-0 lg:py-1.5"
                      style={{ borderColor: BORDER }}
                    >
                      {p.verSitioWeb}
                    </a>
                  ) : null}
                  {cr.showVerListado && cr.verListadoHref ? (
                    <a
                      href={cr.verListadoHref}
                      className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[11px] font-bold transition hover:bg-[rgba(197,160,89,0.06)] lg:min-h-0"
                      style={{ borderColor: `${BRONZE}99`, color: BRONZE }}
                      {...anchorPropsForHref(cr.verListadoHref, cr.listadoDownloadName)}
                    >
                      {p.verListado}
                    </a>
                  ) : null}
                  {cr.showVerMls && cr.verMlsHref ? (
                    <a
                      href={cr.verMlsHref}
                      className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[11px] font-bold lg:min-h-0 lg:py-1.5"
                      style={{ borderColor: BORDER }}
                      {...anchorPropsForHref(cr.verMlsHref, cr.listadoDownloadName)}
                    >
                      {p.verMls}
                    </a>
                  ) : null}
                  {cr.showVerTour && cr.verTourHref ? (
                    <a
                      href={cr.verTourHref}
                      className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[11px] font-bold lg:min-h-0 lg:py-1.5"
                      style={{ borderColor: BORDER }}
                      {...anchorPropsForHref(cr.verTourHref, "tour.pdf")}
                    >
                      {p.verTour}
                    </a>
                  ) : null}
                  {cr.showVerFolleto && cr.verFolletoHref ? (
                    <a
                      href={cr.verFolletoHref}
                      className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[11px] font-bold lg:min-h-0 lg:py-1.5"
                      style={{ borderColor: BORDER }}
                      {...anchorPropsForHref(cr.verFolletoHref, "folleto.pdf")}
                    >
                      {p.verFolleto}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>
        </section>

        <AgenteIndividualResidencialMediaLightbox
          open={mediaLightboxOpen}
          initialIndex={mediaLightboxIndex}
          onClose={() => setMediaLightboxOpen(false)}
          photoUrls={photoUrlsOrdered}
          videoDataUrl={g.videoDataUrl}
          videoExternalHref={g.videoExternalHref}
          labels={{
            close: p.lightboxClose,
            prev: p.lightboxPrev,
            next: p.lightboxNext,
            galleryCount: p.lightboxGalleryCount,
            video: p.lightboxVideo,
            zoomHint: p.lightboxZoomHint,
            resetZoom: p.lightboxResetZoom,
            openVideoTab: p.lightboxOpenVideoTab,
          }}
        />
      </main>
    </div>
  );
}
