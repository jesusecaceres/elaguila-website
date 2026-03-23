"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { getRoughDistanceMiles } from "@/app/lib/distance";
import BusinessListingIdentityRail from "@/app/clasificados/components/BusinessListingIdentityRail";
import type { ListingData } from "@/app/clasificados/components/ListingView";
import { negocioSectionTitle } from "@/app/clasificados/bienes-raices/negocio/mapping/bienesRaicesNegocioDetailGroups";
import {
  BR_NEGOCIO_PREVIEW_ANCHORS,
  buildGoogleMapsEmbedSrc,
  buildNegocioPremiumPreviewSections,
  formatBrNegocioPreviewPrice,
  normalizeMediaHref,
  pickDetailPairValue,
  structuredFactsToStatRows,
} from "@/app/clasificados/bienes-raices/negocio/preview/brNegocioPremiumPreviewHelpers";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type BienesRaicesPreviewNegocioFreshProps = {
  listing: ListingData;
  variant?: "embedded" | "full";
  /** Live public anuncio: hide preview chrome; anchors `#resumen` … `#contacto`. */
  liveMode?: boolean;
  liveBrContactActions?: {
    onRequestInfo: () => void;
    onScheduleVisit: () => void;
    onSendMessage: () => void;
  };
};

/** @deprecated Use `BienesRaicesPreviewNegocioFreshProps` — kept for re-exports. */
export type BienesRaicesNegocioPremiumDetailProps = BienesRaicesPreviewNegocioFreshProps;

const LIVE_PUBLIC_NEGOCIO_ANCHORS = {
  resumen: "resumen",
  interior: "interior",
  exterior: "exterior",
  detalles: "detalles",
  ubicacion: "ubicacion",
  contacto: "contacto",
} as const;

export default function BienesRaicesPreviewNegocioFresh({
  listing,
  variant = "embedded",
  liveMode = false,
  liveBrContactActions = undefined,
}: BienesRaicesPreviewNegocioFreshProps) {
  const lang = listing.lang;
  const rail = listing.businessRail;
  if (!rail) {
    return <div className="p-6 text-sm text-[#111111]/70">{lang === "es" ? "Vista previa no disponible." : "Preview unavailable."}</div>;
  }

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [viewerCityInput, setViewerCityInput] = useState("");

  const photoUrls = useMemo(() => {
    const incoming = listing.images ?? [];
    return Array.isArray(incoming) && incoming.length > 0 ? incoming : ["/logo.png"];
  }, [listing.images]);

  const isLogoPlaceholder = (u: string) => u === "/logo.png" || u.endsWith("/logo.png");
  const isDefaultPhotoOnly = photoUrls.length === 1 && isLogoPlaceholder(photoUrls[0] ?? "");
  const negocioMainHeroSrc = photoUrls[0] ?? "/logo.png";
  const extraImageCount = isDefaultPhotoOnly ? 0 : Math.max(0, photoUrls.length - 1);
  const thumbStrip = useMemo(() => {
    if (isDefaultPhotoOnly) return [];
    return photoUrls.slice(0, 8);
  }, [photoUrls, isDefaultPhotoOnly]);

  const virtualTourHref = normalizeMediaHref(
    (rail.virtualTourUrl ?? "").trim() ||
      pickDetailPairValue(listing.detailPairs, (lab) => /tour virtual|virtual tour/.test(lab))
  );
  const floorPlanHref = normalizeMediaHref(
    (listing.floorPlanUrl ?? "").trim() ||
      pickDetailPairValue(listing.detailPairs, (lab) => /plano|floorplan|floor plan/.test(lab))
  );
  const proVideoHref = normalizeMediaHref((listing.proVideoUrl ?? "").trim());

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(Math.max(0, Math.min(index, photoUrls.length - 1)));
    setLightboxZoom(1);
    setLightboxOpen(true);
  }, [photoUrls.length]);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLightboxZoom(1);
  }, []);

  const prevLightbox = useCallback(() => {
    setLightboxIndex((i) => (i <= 0 ? photoUrls.length - 1 : i - 1));
  }, [photoUrls.length]);

  const nextLightbox = useCallback(() => {
    setLightboxIndex((i) => (i >= photoUrls.length - 1 ? 0 : i + 1));
  }, [photoUrls.length]);

  const openMorePhotosLightbox = useCallback(() => {
    if (extraImageCount <= 0) return;
    const start = photoUrls.length > 1 ? 1 : 0;
    setLightboxIndex(start);
    setLightboxZoom(1);
    setLightboxOpen(true);
  }, [extraImageCount, photoUrls.length]);

  useEffect(() => {
    setLightboxZoom(1);
  }, [lightboxIndex]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, closeLightbox, nextLightbox, prevLightbox]);

  const { quickFacts, featureTags, filteredSections } = useMemo(
    () => buildNegocioPremiumPreviewSections(listing.detailPairs ?? [], lang),
    [listing.detailPairs, lang]
  );

  const detailAddressLine = useMemo(() => {
    const match = (listing.detailPairs ?? []).find((p) => /direcci[oó]n|address/i.test((p.label ?? "").toLowerCase()));
    return (match?.value ?? "").trim() || null;
  }, [listing.detailPairs]);
  const detailNeighborhoodLine = useMemo(() => {
    const match = (listing.detailPairs ?? []).find((p) => /vecindad|neighborhood/i.test((p.label ?? "").toLowerCase()));
    return (match?.value ?? "").trim() || null;
  }, [listing.detailPairs]);
  const structuredAddr = (listing.structuredFacts?.addressLine ?? "").trim() || null;
  const structuredNeighborhood = (listing.structuredFacts?.neighborhood ?? "").trim() || null;
  const addressFallback = (listing.approximateArea ?? "").trim() || null;
  const addressLine = detailAddressLine || structuredAddr || addressFallback;
  const neighborhoodLine = detailNeighborhoodLine || structuredNeighborhood;

  const distanceMiles = useMemo(
    () => (viewerCityInput.trim() && listing.city ? getRoughDistanceMiles(viewerCityInput, listing.city) : null),
    [viewerCityInput, listing.city]
  );

  const mapsSearchHref =
    addressLine || listing.city
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([addressLine, listing.city].filter(Boolean).join(", "))}`
      : null;

  const mapsEmbedQuery = [addressLine, neighborhoodLine, listing.city].filter(Boolean).join(", ");
  const mapsEmbedSrc = buildGoogleMapsEmbedSrc(mapsEmbedQuery, lang);

  const statRows = useMemo(() => structuredFactsToStatRows(listing.structuredFacts, lang), [listing.structuredFacts, lang]);

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            tabs: ["Resumen", "Interior", "Exterior", "Detalles", "Ubicación", "Contacto"] as const,
            previewBadge: "Vista previa",
            previewSubtitle: "Así verán tu listado los compradores.",
            brand: "Leonix Clasificados",
            aboutTitle: "Acerca de esta propiedad",
            factsTitle: "Datos y características",
            locationTitle: "Ubicación",
            mapCta: "Abrir en Google Maps",
            lowerAgentTitle: "Representación del listado",
            tourTile: "Tour virtual",
            planTile: "Plano",
            videoTile: "Video",
            photosTile: "+ fotos",
            mapTile: "Mapa",
            gallery: "Galería de fotos",
            close: "Cerrar",
            zoomIn: "Acercar",
            zoomOut: "Alejar",
            prev: "Anterior",
            next: "Siguiente",
            mapFrameTitle: "Mapa de ubicación",
          }
        : {
            tabs: ["Summary", "Interior", "Exterior", "Details", "Location", "Contact"] as const,
            previewBadge: "Preview",
            previewSubtitle: "This is how buyers will see your listing.",
            brand: "Leonix Clasificados",
            aboutTitle: "About this home",
            factsTitle: "Facts & features",
            locationTitle: "Location",
            mapCta: "Open in Google Maps",
            lowerAgentTitle: "Listing representation",
            tourTile: "Virtual tour",
            planTile: "Floor plan",
            videoTile: "Video",
            photosTile: "+ photos",
            mapTile: "Map",
            gallery: "Photo gallery",
            close: "Close",
            zoomIn: "Zoom in",
            zoomOut: "Zoom out",
            prev: "Previous",
            next: "Next",
            mapFrameTitle: "Location map",
          },
    [lang]
  );

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const anchorIds = liveMode ? LIVE_PUBLIC_NEGOCIO_ANCHORS : BR_NEGOCIO_PREVIEW_ANCHORS;
  const tabTargets = [
    anchorIds.resumen,
    anchorIds.interior,
    anchorIds.exterior,
    anchorIds.detalles,
    anchorIds.ubicacion,
    anchorIds.contacto,
  ];

  const negocioTileInBand =
    "flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-1 text-center shadow-sm";
  const negocioTileActive =
    "border-[#C9B46A]/35 bg-[#FFFCF6] text-[10px] font-semibold leading-tight text-[#111111] transition hover:bg-[#F8F2E6] sm:text-[11px]";
  const negocioTileDisabled =
    "border-[#C9B46A]/10 bg-[#EFEDE8]/90 text-[10px] font-semibold leading-tight text-[#111111]/32 sm:text-[11px] pointer-events-none select-none";

  const iconFacts = useMemo(() => {
    const patterns = [
      { pattern: /rec[aá]maras|bedrooms?/, icon: "🛏️", key: "bed" },
      { pattern: /ba[ñn]os|bathrooms?/, icon: "🛁", key: "bath" },
      { pattern: /pies|ft|sq\s*ft|superficie|area|cuadrados/i, icon: "📏", key: "area" },
      { pattern: /estacionamiento|parking|garage/, icon: "🚗", key: "parking" },
      { pattern: /terreno|lot/, icon: "🌿", key: "lot" },
      { pattern: /niveles|levels|stories/, icon: "🏠", key: "levels" },
      { pattern: /año|year built/, icon: "📅", key: "year" },
    ];
    return patterns
      .map((b) => {
        const match = quickFacts.find((f) => b.pattern.test((f.label ?? "").toLowerCase()));
        return match ? { ...match, icon: b.icon, _key: b.key } : null;
      })
      .filter((v): v is { label: string; value: string; icon: string; _key: string } => Boolean(v));
  }, [quickFacts]);

  return (
    <div
      className={cx(
        "w-full min-w-0 overflow-x-hidden",
        variant === "full"
          ? "bg-[#F4F1EB]"
          : "rounded-[1.75rem] border border-stone-200/90 bg-gradient-to-b from-[#FBFAF7] via-[#F8F6F1] to-[#F0EBE3] shadow-[0_16px_56px_-24px_rgba(17,17,17,0.22)]"
      )}
    >
      <div className={cx(variant === "full" ? "px-4 py-5 sm:px-8 sm:py-8 lg:px-12 lg:py-10" : "p-4 sm:p-5 lg:p-6")}>
        <header
          className={cx(
            "mb-6 sm:mb-8 w-full min-w-0 border-b border-stone-200/70 pb-5 sm:pb-6",
            variant === "full" &&
              "sticky top-0 z-20 -mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 pt-2 bg-[#F4F1EB]/95 backdrop-blur-md"
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9B46A]/40 bg-[#FFFCF6] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#5C4D1F]">
                {t.previewBadge}
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold tracking-tight text-[#111111]">{t.brand}</p>
                <p className="mt-1 text-sm text-[#111111]/60 max-w-md">{t.previewSubtitle}</p>
              </div>
            </div>
          </div>
          <nav
            className="mt-5 flex flex-wrap gap-1.5 border-t border-stone-200/50 pt-5"
            aria-label={lang === "es" ? "Secciones del anuncio" : "Listing sections"}
          >
            {t.tabs.map((label, tabIdx) => (
              <button
                key={label}
                type="button"
                onClick={() => scrollToId(tabTargets[tabIdx]!)}
                className={cx(
                  "rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition",
                  tabIdx === 0
                    ? "border border-[#C9B46A]/50 bg-[#FAF3E4] text-[#111111]"
                    : "border border-transparent text-[#111111]/65 hover:border-stone-200/80 hover:bg-white/70 hover:text-[#111111]"
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </header>

        <div className="mx-auto w-full max-w-[88rem] min-w-0">
          <div className="min-w-0 flex flex-col gap-8 sm:gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_25rem]">
            <div className="min-w-0 flex flex-col gap-8 sm:gap-10 lg:col-start-1 lg:row-start-1">
              <div id={anchorIds.resumen} className="scroll-mt-28 space-y-4">
                <div className="flex w-full min-w-0 flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] lg:items-stretch lg:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,19rem)]">
                  <div
                    className={cx(
                      "relative min-h-[240px] w-full min-w-0 overflow-hidden rounded-2xl border border-stone-200/70 bg-stone-100 shadow-sm aspect-[4/3] sm:min-h-[280px] sm:aspect-[16/10] lg:aspect-auto",
                      variant === "full" ? "lg:min-h-[min(60vh,560px)] lg:max-h-[620px]" : "lg:min-h-[min(52vh,480px)] lg:max-h-[540px]"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => openLightbox(0)}
                      className="absolute inset-0 block h-full w-full cursor-zoom-in"
                      aria-label={t.gallery}
                    >
                      <img src={negocioMainHeroSrc} alt="" className="h-full w-full object-cover" />
                    </button>
                    {photoUrls.length > 1 && (
                      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/35 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {photoUrls.length} {lang === "es" ? "fotos" : "photos"}
                      </div>
                    )}
                  </div>

                  <div
                    className="grid h-auto min-h-0 w-full min-w-0 grid-cols-2 grid-rows-3 gap-2 sm:grid-cols-3 sm:grid-rows-2"
                    aria-label={lang === "es" ? "Medios de la propiedad" : "Property media"}
                  >
                    {virtualTourHref ? (
                      <a
                        href={virtualTourHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cx(negocioTileInBand, negocioTileActive, "min-h-0")}
                      >
                        <span className="text-lg leading-none" aria-hidden>
                          🌐
                        </span>
                        <span>{t.tourTile}</span>
                      </a>
                    ) : (
                      <div className={cx(negocioTileInBand, negocioTileDisabled, "min-h-0")} aria-disabled="true">
                        <span className="text-lg opacity-40" aria-hidden>
                          🌐
                        </span>
                        <span>{t.tourTile}</span>
                      </div>
                    )}
                    {floorPlanHref ? (
                      <a
                        href={floorPlanHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cx(negocioTileInBand, negocioTileActive, "min-h-0")}
                      >
                        <span className="text-lg leading-none" aria-hidden>
                          📐
                        </span>
                        <span>{t.planTile}</span>
                      </a>
                    ) : (
                      <div className={cx(negocioTileInBand, negocioTileDisabled, "min-h-0")} aria-disabled="true">
                        <span className="text-lg opacity-40" aria-hidden>
                          📐
                        </span>
                        <span>{t.planTile}</span>
                      </div>
                    )}
                    {proVideoHref ? (
                      <a
                        href={proVideoHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cx(negocioTileInBand, negocioTileActive, "min-h-0")}
                      >
                        <span className="text-lg leading-none" aria-hidden>
                          🎥
                        </span>
                        <span>{t.videoTile}</span>
                      </a>
                    ) : (
                      <div className={cx(negocioTileInBand, negocioTileDisabled, "min-h-0")} aria-disabled="true">
                        <span className="text-lg opacity-40" aria-hidden>
                          🎥
                        </span>
                        <span>{t.videoTile}</span>
                      </div>
                    )}
                    {extraImageCount > 0 ? (
                      <button
                        type="button"
                        onClick={openMorePhotosLightbox}
                        className={cx(negocioTileInBand, negocioTileActive, "min-h-0 cursor-pointer")}
                      >
                        <span className="text-lg leading-none" aria-hidden>
                          🖼️
                        </span>
                        <span>{t.photosTile}</span>
                        <span className="text-[8px] font-bold uppercase tracking-wide text-[#8B6914]/90">
                          {lang === "es"
                            ? extraImageCount === 1
                              ? "1 más"
                              : `${extraImageCount} más`
                            : extraImageCount === 1
                              ? "1 more"
                              : `${extraImageCount} more`}
                        </span>
                      </button>
                    ) : (
                      <div className={cx(negocioTileInBand, negocioTileDisabled, "min-h-0")} aria-disabled="true">
                        <span className="text-lg opacity-40" aria-hidden>
                          🖼️
                        </span>
                        <span>{t.photosTile}</span>
                      </div>
                    )}
                    {mapsSearchHref ? (
                      <a
                        href={mapsSearchHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cx(negocioTileInBand, negocioTileActive, "min-h-0")}
                      >
                        <span className="text-lg leading-none" aria-hidden>
                          📍
                        </span>
                        <span>{t.mapTile}</span>
                      </a>
                    ) : (
                      <div className={cx(negocioTileInBand, negocioTileDisabled, "min-h-0")} aria-disabled="true">
                        <span className="text-lg opacity-40" aria-hidden>
                          📍
                        </span>
                        <span>{t.mapTile}</span>
                      </div>
                    )}
                  </div>
                </div>

                {thumbStrip.length > 1 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1" aria-label={lang === "es" ? "Miniaturas" : "Thumbnails"}>
                    {thumbStrip.map((url, i) => (
                      <button
                        key={`${url}-${i}`}
                        type="button"
                        onClick={() => openLightbox(i)}
                        className={cx(
                          "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition",
                          i === 0 ? "border-[#C9B46A]/70 ring-1 ring-[#C9B46A]/25" : "border-stone-200/80 opacity-90 hover:opacity-100"
                        )}
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <section className="rounded-2xl border border-[#C9B46A]/30 bg-[#FFFDFB] p-6 sm:p-8 shadow-sm scroll-mt-28 ring-1 ring-[#C9B46A]/12">
                <div className="flex flex-wrap items-center gap-2">
                  {listing.categoryLabel ? (
                    <span className="inline-flex rounded-full border border-[#C9B46A]/45 bg-[#FAF3E4] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#5C4D1F]">
                      {listing.categoryLabel}
                    </span>
                  ) : null}
                  {listing.listingStatusLabel ? (
                    <span className="inline-flex rounded-full border border-emerald-700/25 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-900">
                      {listing.listingStatusLabel}
                    </span>
                  ) : null}
                </div>
                {listing.highlightChips && listing.highlightChips.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {listing.highlightChips.map((h, i) => (
                      <span
                        key={`hl-${i}-${h}`}
                        className="inline-flex rounded-lg border border-[#C9B46A]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#3D3420]"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="mt-6 text-3xl sm:text-[2.4rem] font-extrabold tabular-nums tracking-tight text-[#111111]">
                  {formatBrNegocioPreviewPrice(listing.priceLabel, lang)}
                </p>
                <h1 className="mt-3 text-2xl sm:text-3xl lg:text-[2.1rem] font-extrabold text-[#111111] leading-[1.15] tracking-tight">
                  {listing.title}
                </h1>
                {listing.listingSummaryShort ? (
                  <p className="mt-3 text-base font-medium text-[#111111]/78 leading-snug max-w-[68ch]">{listing.listingSummaryShort}</p>
                ) : null}
                {listing.todayLabel ? (
                  <p className="mt-2 text-sm text-[#111111]/50">{listing.todayLabel}</p>
                ) : null}

                <div className="mt-5 space-y-1.5 text-sm text-[#111111]/88">
                  {addressLine ? (
                    <p className="font-medium leading-snug">
                      {addressLine}
                      {neighborhoodLine ? <span className="text-[#111111]/55"> · {neighborhoodLine}</span> : null}
                    </p>
                  ) : null}
                  <p>
                    <span className="font-semibold text-[#111111]/80">{lang === "es" ? "Ciudad" : "City"}:</span>{" "}
                    {listing.city}
                    {listing.structuredFacts?.zip ? (
                      <span className="text-[#111111]/55">
                        {" "}
                        · {lang === "es" ? "CP" : "ZIP"} {listing.structuredFacts.zip}
                      </span>
                    ) : null}
                  </p>
                </div>

                {statRows.length > 0 ? (
                  <div className="mt-7 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {statRows.map((row) => (
                      <div
                        key={`${row.label}-${row.value}`}
                        className="flex items-baseline justify-between gap-3 rounded-xl border border-stone-200/75 bg-white px-3.5 py-2.5 text-sm shadow-sm"
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#111111]/42">{row.label}</span>
                        <span className="font-semibold text-[#111111] tabular-nums text-right">{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : iconFacts.length > 0 ? (
                  <div className="mt-7 flex flex-wrap gap-2">
                    {iconFacts.map((f) => (
                      <span
                        key={`${f._key}-${f.value}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B46A]/28 bg-[#FAF3E4]/70 px-3.5 py-2 text-xs font-semibold text-[#111111] shadow-sm"
                      >
                        <span aria-hidden>{f.icon}</span>
                        <span className="text-[#111111]/60">{f.label}:</span> {f.value}
                      </span>
                    ))}
                  </div>
                ) : null}

                {featureTags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {featureTags.map((tag, i) => (
                      <span
                        key={`tag-${i}-${tag.label}`}
                        className="inline-flex rounded-lg border border-stone-200/85 bg-white/95 px-2.5 py-1 text-xs font-medium text-[#111111]/82"
                      >
                        {tag.value}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              <section className="scroll-mt-28">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111111]/48 mb-4">{t.aboutTitle}</h2>
                <div className="rounded-2xl border border-stone-200/75 bg-white p-6 sm:p-8 shadow-sm">
                  <div className="max-w-[68ch] text-base leading-[1.75] text-[#111111]/90 whitespace-pre-wrap">{listing.description}</div>
                </div>
              </section>

              <section id={anchorIds.detalles} className="scroll-mt-28">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111111]/48 mb-4">{t.factsTitle}</h2>
                <div className="space-y-6">
                  {filteredSections.map((sec) => (
                    <div
                      key={sec.id}
                      id={
                        sec.id === "interior"
                          ? anchorIds.interior
                          : sec.id === "exteriorLot"
                            ? anchorIds.exterior
                            : undefined
                      }
                      className="rounded-2xl border border-stone-200/65 bg-white p-5 sm:p-7 shadow-sm scroll-mt-28"
                    >
                      <h3 className="text-sm font-bold text-[#111111] mb-4 pb-2 border-b border-stone-200/55">
                        {negocioSectionTitle(sec.id, lang)}
                      </h3>
                      <dl className="grid gap-3.5 sm:grid-cols-2">
                        {sec.pairs.map((p, idx) => (
                          <div key={`${p.label}-${idx}`} className="min-w-0">
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#111111]/42">{p.label}</dt>
                            <dd className="mt-0.5 text-sm text-[#111111]/88 break-words">{p.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              </section>

              <section id={anchorIds.ubicacion} className="scroll-mt-28">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111111]/48 mb-4">{t.locationTitle}</h2>
                <div className="overflow-hidden rounded-2xl border border-stone-200/75 bg-white shadow-sm">
                  {mapsEmbedSrc ? (
                    <iframe
                      title={t.mapFrameTitle}
                      src={mapsEmbedSrc}
                      className="h-[min(52vw,320px)] w-full border-0 sm:h-[280px]"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="aspect-[21/9] min-h-[160px] w-full bg-stone-200/40 flex items-center justify-center">
                      <div className="text-center px-4">
                        <p className="text-3xl opacity-35 mb-2" aria-hidden>
                          📍
                        </p>
                        <p className="text-sm font-medium text-[#111111]/65">
                          {addressLine || listing.city || (lang === "es" ? "Ubicación por confirmar" : "Location to be confirmed")}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="p-5 sm:p-6 space-y-4 border-t border-stone-100">
                    <div className="text-sm text-[#111111]/85 space-y-1">
                      {addressLine ? <p className="font-medium">{addressLine}</p> : null}
                      {neighborhoodLine ? <p className="text-[#111111]/70">{neighborhoodLine}</p> : null}
                      <p>{listing.city}</p>
                    </div>
                    {mapsSearchHref ? (
                      <a
                        href={mapsSearchHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl border border-[#3F5A43]/45 bg-[#EEF3ED] px-4 py-2.5 text-sm font-semibold text-[#2F4A33] hover:bg-[#E3EBDD] transition"
                      >
                        {t.mapCta}
                      </a>
                    ) : null}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-[#111111]/48 mb-2">
                        {lang === "es" ? "Distancia desde tu ciudad" : "Distance from your city"}
                      </label>
                      <CityAutocomplete
                        value={viewerCityInput}
                        onChange={setViewerCityInput}
                        placeholder={lang === "es" ? "Ingresa tu ciudad" : "Enter your city"}
                        lang={lang}
                        variant="light"
                        className="w-full max-w-md"
                      />
                      {distanceMiles !== null && (
                        <p className="mt-2 text-sm text-[#111111]/68">
                          {lang === "es" ? "Aproximadamente" : "Approximately"} {Math.round(distanceMiles)}{" "}
                          {lang === "es" ? "millas de distancia" : "miles away"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="w-full min-w-0 lg:col-start-2 lg:row-start-1 lg:self-start lg:sticky lg:top-24">
              <BusinessListingIdentityRail
                businessRail={rail}
                category="bienes-raices"
                businessRailTier={listing.businessRailTier}
                lang={lang}
                ownerId={listing.ownerId ?? null}
                agentProfileReturnUrl={listing.agentProfileReturnUrl ?? null}
                premiumBienesRaices
                liveBrContactActions={liveMode ? liveBrContactActions ?? null : null}
              />
            </aside>

            <section id={anchorIds.contacto} className="w-full min-w-0 lg:col-span-2 scroll-mt-28">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111111]/48 mb-4">{t.lowerAgentTitle}</h2>
              <LowerAgentBlock rail={rail} lang={lang} />
            </section>
          </div>
        </div>

        {lightboxOpen && (
          <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-[2px] p-3 sm:p-6">
            <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col rounded-2xl border border-white/10 bg-black/55">
              <div className="flex items-center justify-between px-4 py-3 text-white">
                <p className="text-sm font-medium">
                  {t.gallery} {lightboxIndex + 1}/{photoUrls.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLightboxZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
                    className="rounded-lg border border-white/25 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
                    aria-label={t.zoomOut}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                    className="rounded-lg border border-white/25 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
                    aria-label={t.zoomIn}
                  >
                    ＋
                  </button>
                  <button
                    type="button"
                    onClick={closeLightbox}
                    className="rounded-lg border border-white/25 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
                    aria-label={t.close}
                  >
                    {t.close}
                  </button>
                </div>
              </div>
              <div className="relative flex-1 overflow-hidden">
                <img
                  src={photoUrls[lightboxIndex] ?? "/logo.png"}
                  alt=""
                  className="h-full w-full object-contain transition-transform duration-200"
                  style={{ transform: `scale(${lightboxZoom})` }}
                />
                {photoUrls.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevLightbox}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/55 hover:bg-black/75 text-white text-xl font-bold"
                      aria-label={t.prev}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={nextLightbox}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/55 hover:bg-black/75 text-white text-xl font-bold"
                      aria-label={t.next}
                    >
                      →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LowerAgentBlock({
  rail,
  lang,
}: {
  rail: NonNullable<ListingData["businessRail"]>;
  lang: "es" | "en";
}) {
  return (
    <div className="rounded-2xl border border-stone-200/75 bg-[#FFFDFB] p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-8">
        {rail.agentPhotoUrl ? (
          <img src={rail.agentPhotoUrl} alt="" className="h-28 w-28 rounded-2xl border border-stone-200 object-cover shrink-0 shadow-sm" />
        ) : null}
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#111111]/48">
              {lang === "es" ? "Agente principal" : "Primary agent"}
            </p>
            <p className="text-xl font-bold text-[#111111]">{rail.agent?.trim() || rail.name}</p>
            {rail.role?.trim() ? <p className="text-sm text-[#111111]/68 mt-1">{rail.role}</p> : null}
            {rail.coAgentName?.trim() ? (
              <p className="text-sm text-[#111111]/72 mt-2">
                <span className="font-semibold text-[#111111]/55">{lang === "es" ? "Co-agente" : "Co-agent"}:</span>{" "}
                {rail.coAgentName.trim()}
              </p>
            ) : null}
            {rail.agentLicense?.trim() ? (
              <p className="text-xs text-[#111111]/52 mt-2">
                {lang === "es" ? "Licencia" : "License"}: {rail.agentLicense}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3 items-start">
            {rail.logoUrl ? <img src={rail.logoUrl} alt="" className="h-14 w-14 rounded-xl border border-stone-200 object-contain bg-white shadow-sm" /> : null}
            <div>
              <p className="text-base font-semibold text-[#111111]">{rail.name}</p>
              {rail.brokerageName?.trim() ? (
                <p className="text-sm text-[#111111]/65 mt-0.5">
                  {lang === "es" ? "Correduría" : "Brokerage"}: {rail.brokerageName.trim()}
                </p>
              ) : null}
            </div>
          </div>
          {rail.businessDescription?.trim() ? (
            <p className="text-sm leading-relaxed text-[#111111]/78 whitespace-pre-wrap max-w-[62ch]">{rail.businessDescription}</p>
          ) : null}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {rail.officePhone?.trim() ? (
              <span className="text-[#111111]">
                <span className="text-[#111111]/55">{lang === "es" ? "Tel." : "Phone"}:</span> {rail.officePhone}
              </span>
            ) : null}
            {rail.agentEmail?.trim() ? (
              <span className="text-[#111111] break-all">
                <span className="text-[#111111]/55">{lang === "es" ? "Correo" : "Email"}:</span> {rail.agentEmail.trim()}
              </span>
            ) : null}
            {rail.website?.trim() ? (
              <a
                href={normalizeMediaHref(rail.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#2F4A33] underline-offset-2 hover:underline break-all"
              >
                {lang === "es" ? "Sitio web" : "Website"}
              </a>
            ) : null}
          </div>
          {rail.socialLinks && rail.socialLinks.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {rail.socialLinks.map((s, i) => (
                <a
                  key={i}
                  href={normalizeMediaHref(s.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-stone-200/80 bg-white px-3 py-1.5 text-xs font-medium text-[#111111] hover:bg-stone-50"
                >
                  {s.label}
                </a>
              ))}
            </div>
          ) : rail.rawSocials ? (
            <p className="text-xs text-[#111111]/72 break-words">{rail.rawSocials}</p>
          ) : null}
          {(rail.languages || rail.hours) && (
            <div className="text-xs text-[#111111]/72 space-y-1 pt-1 border-t border-stone-200/60">
              {rail.languages ? (
                <p>
                  <span className="font-semibold text-[#111111]/50">{lang === "es" ? "Idiomas" : "Languages"}:</span> {rail.languages}
                </p>
              ) : null}
              {rail.hours ? (
                <p>
                  <span className="font-semibold text-[#111111]/50">{lang === "es" ? "Horario" : "Hours"}:</span> {rail.hours}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
