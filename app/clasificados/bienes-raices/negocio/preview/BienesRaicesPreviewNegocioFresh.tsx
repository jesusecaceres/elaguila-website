"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { getRoughDistanceMiles } from "@/app/lib/distance";
import { partitionBienesRaicesPreviewDetailPairs } from "@/app/clasificados/bienes-raices/shared/utils/bienesRaicesPreviewDetailPartition";
import { groupBienesRaicesNegocioDetailPairs, negocioSectionTitle } from "@/app/clasificados/bienes-raices/negocio/mapping/bienesRaicesNegocioDetailGroups";
import BusinessListingIdentityRail from "@/app/clasificados/components/BusinessListingIdentityRail";
import type { ListingData } from "@/app/clasificados/components/ListingView";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeMediaHref(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t) || t.startsWith("blob:") || t.startsWith("/")) return t;
  return `https://${t}`;
}

function pickDetailPairValue(
  pairs: Array<{ label: string; value: string }> | undefined,
  labelTest: (label: string) => boolean
): string {
  const p = pairs?.find((x) => labelTest((x.label ?? "").toLowerCase()));
  return (p?.value ?? "").trim();
}

function formatBrPriceWithCommaThousands(priceLabel: string, lang: "es" | "en"): string {
  const base = formatListingPrice(priceLabel, { lang });
  const lower = base.toLowerCase();
  if (lower.includes("gratis") || lower.includes("free")) return base;
  const numericMatch = base.match(/-?\d+(?:\.\d+)?/);
  if (!numericMatch) return base;
  const n = Number(numericMatch[0]);
  if (!Number.isFinite(n)) return base;
  const roundedIntStr = String(Math.round(n));
  const withCommas = roundedIntStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return base.includes("$") ? `$${withCommas}` : withCommas;
}

export type BienesRaicesPreviewNegocioFreshProps = {
  listing: ListingData;
};

const ANCHOR_IDS = {
  resumen: "br-negocio-sec-resumen",
  interior: "br-negocio-sec-interior",
  exterior: "br-negocio-sec-exterior",
  detalles: "br-negocio-sec-detalles",
  ubicacion: "br-negocio-sec-ubicacion",
  contacto: "br-negocio-sec-contacto",
} as const;

export default function BienesRaicesPreviewNegocioFresh({ listing }: BienesRaicesPreviewNegocioFreshProps) {
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

  const virtualTourHref = normalizeMediaHref(
    (rail.virtualTourUrl ?? "").trim() ||
      pickDetailPairValue(listing.detailPairs, (lab) => /tour virtual|virtual tour/.test(lab))
  );
  const floorPlanHref = normalizeMediaHref(
    (listing.floorPlanUrl ?? "").trim() ||
      pickDetailPairValue(listing.detailPairs, (lab) => /plano|floorplan|floor plan/.test(lab))
  );
  const proVideoHref = normalizeMediaHref((listing.proVideoUrl ?? "").trim());

  const openLightbox = (index: number) => {
    setLightboxIndex(Math.max(0, Math.min(index, photoUrls.length - 1)));
    setLightboxZoom(1);
    setLightboxOpen(true);
  };
  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxZoom(1);
  };
  const prevLightbox = () =>
    setLightboxIndex((i) => (i <= 0 ? photoUrls.length - 1 : i - 1));
  const nextLightbox = () =>
    setLightboxIndex((i) => (i >= photoUrls.length - 1 ? 0 : i + 1));

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

  const { quickFacts, featureTags } = useMemo(
    () => partitionBienesRaicesPreviewDetailPairs(listing.detailPairs ?? [], lang),
    [listing.detailPairs, lang]
  );

  const summaryLabelKey = (label: string) => label.trim().toLowerCase();
  const summaryKeys = useMemo(
    () => new Set(quickFacts.map((f) => summaryLabelKey(f.label))),
    [quickFacts]
  );

  const detailAddressLine = useMemo(() => {
    const match = (listing.detailPairs ?? []).find((p) => /direcci[oó]n|address/i.test((p.label ?? "").toLowerCase()));
    return (match?.value ?? "").trim() || null;
  }, [listing.detailPairs]);
  const detailNeighborhoodLine = useMemo(() => {
    const match = (listing.detailPairs ?? []).find((p) => /vecindad|neighborhood/i.test((p.label ?? "").toLowerCase()));
    return (match?.value ?? "").trim() || null;
  }, [listing.detailPairs]);
  const addressFallback = (listing.approximateArea ?? "").trim() || null;
  const addressLine = detailAddressLine ?? addressFallback;
  const neighborhoodLine = detailNeighborhoodLine;

  const groupedSections = useMemo(() => groupBienesRaicesNegocioDetailPairs(listing.detailPairs ?? []), [listing.detailPairs]);

  const filteredSections = useMemo(() => {
    return groupedSections
      .map((sec) => ({
        ...sec,
        pairs: sec.pairs.filter((p) => !summaryKeys.has(summaryLabelKey(p.label))),
      }))
      .filter((sec) => sec.pairs.length > 0);
  }, [groupedSections, summaryKeys]);

  const distanceMiles = useMemo(
    () => (viewerCityInput.trim() && listing.city ? getRoughDistanceMiles(viewerCityInput, listing.city) : null),
    [viewerCityInput, listing.city]
  );

  const mapsSearchHref =
    addressLine || listing.city
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([addressLine, listing.city].filter(Boolean).join(", "))}`
      : null;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            tabs: ["Resumen", "Interior", "Exterior", "Detalles", "Ubicación", "Contacto"] as const,
            publicar: "Publicar",
            brand: "Leonix Clasificados",
            aboutTitle: "Acerca de esta propiedad",
            factsTitle: "Datos y características",
            locationTitle: "Ubicación",
            mapCta: "Abrir en Google Maps",
            lowerAgentTitle: "Información del listado",
            tourTile: "Tour virtual",
            planTile: "Plano",
            videoTile: "Video",
            photosTile: "+ fotos",
            gallery: "Galería de fotos",
            close: "Cerrar",
            zoomIn: "Acercar",
            zoomOut: "Alejar",
            prev: "Anterior",
            next: "Siguiente",
          }
        : {
            tabs: ["Summary", "Interior", "Exterior", "Details", "Location", "Contact"] as const,
            publicar: "Publish",
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
            gallery: "Photo gallery",
            close: "Close",
            zoomIn: "Zoom in",
            zoomOut: "Zoom out",
            prev: "Previous",
            next: "Next",
          },
    [lang]
  );

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const tabTargets = [
    ANCHOR_IDS.resumen,
    ANCHOR_IDS.interior,
    ANCHOR_IDS.exterior,
    ANCHOR_IDS.detalles,
    ANCHOR_IDS.ubicacion,
    ANCHOR_IDS.contacto,
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
    <div className="w-full min-w-0 rounded-[1.75rem] border border-stone-200/90 bg-gradient-to-b from-[#FBFAF7] via-[#F8F6F1] to-[#F0EBE3] shadow-[0_16px_56px_-24px_rgba(17,17,17,0.22)] overflow-x-hidden">
      <div className="p-4 sm:p-5 lg:p-6">
        <header className="mb-5 sm:mb-6 w-full min-w-0 border-b border-stone-200/70 pb-4 sm:pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-2xl border border-[#C9B46A]/45 bg-[#FFFCF6] px-4 py-2.5 sm:px-5 sm:py-3 shadow-sm ring-1 ring-[#C9B46A]/20">
              <span className="text-sm sm:text-base font-bold tracking-tight text-[#111111]">{t.brand}</span>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-xl border border-[#3F5A43]/70 bg-[#3F5A43] px-4 py-2.5 text-sm font-semibold text-[#F7F4EC] shadow-sm transition hover:bg-[#36503A]"
            >
              {t.publicar}
            </button>
          </div>
          <nav
            className="mt-4 flex flex-wrap gap-1 border-t border-stone-200/50 pt-4"
            aria-label={lang === "es" ? "Secciones del anuncio" : "Listing sections"}
          >
            {t.tabs.map((label, tabIdx) => (
              <button
                key={label}
                type="button"
                onClick={() => scrollToId(tabTargets[tabIdx]!)}
                className={cx(
                  "rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold transition",
                  tabIdx === 0
                    ? "border border-[#C9B46A]/50 bg-[#FAF3E4] text-[#111111]"
                    : "border border-transparent text-[#111111]/65 hover:border-stone-200/80 hover:bg-white/60 hover:text-[#111111]"
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </header>

        <div className="mx-auto w-full max-w-[82rem] min-w-0">
          <div className="min-w-0 flex flex-col gap-6 sm:gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0 flex flex-col gap-6 sm:gap-8 lg:col-start-1 lg:row-start-1">
              <div id={ANCHOR_IDS.resumen} className="scroll-mt-28">
                <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] lg:items-stretch lg:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
                  <div className="relative min-h-[220px] w-full min-w-0 overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100 shadow-inner aspect-[4/3] sm:min-h-[260px] sm:aspect-[16/11] lg:aspect-auto lg:min-h-[min(52vh,520px)] lg:max-h-[560px] lg:max-w-full">
                    <button
                      type="button"
                      onClick={() => openLightbox(0)}
                      className="absolute inset-0 block h-full w-full cursor-zoom-in"
                      aria-label={t.gallery}
                    >
                      <img src={negocioMainHeroSrc} alt="" className="h-full w-full object-cover" />
                    </button>
                    {photoUrls.length > 1 && (
                      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/30 bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {photoUrls.length} {lang === "es" ? "fotos" : "photos"}
                      </div>
                    )}
                  </div>

                  <div
                    className="grid aspect-square h-auto min-h-0 w-full min-w-0 grid-cols-2 grid-rows-2 gap-2 lg:aspect-auto lg:max-h-[560px] lg:grid-cols-2 lg:grid-rows-2 lg:gap-2 lg:min-h-0"
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
                  </div>
                </div>
              </div>

              <section className="rounded-2xl border border-[#C9B46A]/28 bg-[#FFFDFB] p-5 sm:p-7 shadow-[0_12px_40px_-28px_rgba(17,17,17,0.35)] scroll-mt-28">
                {listing.categoryLabel ? (
                  <span className="inline-flex rounded-full border border-[#C9B46A]/40 bg-[#FAF3E4] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#6B5A2A]">
                    {listing.categoryLabel}
                  </span>
                ) : null}
                <h1 className="mt-3 text-2xl sm:text-3xl lg:text-[2.1rem] font-extrabold text-[#111111] leading-[1.15] tracking-tight">
                  {listing.title}
                </h1>
                <p className="mt-4 text-3xl sm:text-[2.15rem] font-extrabold tabular-nums text-[#111111]">
                  {formatBrPriceWithCommaThousands(listing.priceLabel, lang)}
                </p>
                {listing.todayLabel ? (
                  <p className="mt-2 text-sm text-[#111111]/60">{listing.todayLabel}</p>
                ) : null}
                <div className="mt-4 space-y-1.5 text-sm text-[#111111]/80">
                  {addressLine ? (
                    <p>
                      <span className="font-semibold text-[#111111]/90">{lang === "es" ? "Dirección" : "Address"}:</span>{" "}
                      {addressLine}
                    </p>
                  ) : null}
                  {neighborhoodLine ? (
                    <p>
                      <span className="font-semibold text-[#111111]/90">{lang === "es" ? "Vecindad" : "Neighborhood"}:</span>{" "}
                      {neighborhoodLine}
                    </p>
                  ) : null}
                  <p>
                    <span className="font-semibold text-[#111111]/90">{lang === "es" ? "Ciudad" : "City"}:</span> {listing.city}
                  </p>
                </div>

                {iconFacts.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {iconFacts.map((f) => (
                      <span
                        key={`${f._key}-${f.value}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B46A]/30 bg-[#FAF3E4]/80 px-3.5 py-2 text-xs font-semibold text-[#111111] shadow-sm"
                      >
                        <span aria-hidden>{f.icon}</span>
                        <span className="text-[#111111]/65">{f.label}:</span> {f.value}
                      </span>
                    ))}
                  </div>
                )}

                {featureTags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {featureTags.map((tag, i) => (
                      <span
                        key={`tag-${i}-${tag.label}`}
                        className="inline-flex rounded-lg border border-stone-200/90 bg-white/90 px-2.5 py-1 text-xs font-medium text-[#111111]/85"
                      >
                        {tag.value}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              <section className="scroll-mt-28">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111111]/50 mb-4">{t.aboutTitle}</h2>
                <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-6 sm:p-8 shadow-sm">
                  <div className="max-w-[68ch] text-base leading-[1.75] text-[#111111]/92 whitespace-pre-wrap">{listing.description}</div>
                </div>
              </section>

              <section id={ANCHOR_IDS.detalles} className="scroll-mt-28">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111111]/50 mb-4">{t.factsTitle}</h2>
                <div className="space-y-5">
                  {filteredSections.map((sec) => (
                    <div
                      key={sec.id}
                      id={
                        sec.id === "interior"
                          ? ANCHOR_IDS.interior
                          : sec.id === "exteriorLot"
                            ? ANCHOR_IDS.exterior
                            : undefined
                      }
                      className="rounded-2xl border border-stone-200/70 bg-white/85 p-5 sm:p-6 shadow-sm scroll-mt-28"
                    >
                      <h3 className="text-sm font-bold text-[#111111] mb-4 pb-2 border-b border-stone-200/60">
                        {negocioSectionTitle(sec.id, lang)}
                      </h3>
                      <dl className="grid gap-3 sm:grid-cols-2">
                        {sec.pairs.map((p, idx) => (
                          <div key={`${p.label}-${idx}`} className="min-w-0">
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#111111]/45">{p.label}</dt>
                            <dd className="mt-0.5 text-sm text-[#111111]/90 break-words">{p.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              </section>

              <section id={ANCHOR_IDS.ubicacion} className="scroll-mt-28">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111111]/50 mb-4">{t.locationTitle}</h2>
                <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
                  <div className="aspect-[21/9] min-h-[160px] w-full bg-gradient-to-br from-[#E8E4DC] via-[#EFE9DF] to-[#DDD6CA] flex items-center justify-center">
                    <div className="text-center px-4">
                      <p className="text-4xl opacity-40 mb-2" aria-hidden>
                        📍
                      </p>
                      <p className="text-sm font-medium text-[#111111]/75">
                        {addressLine || listing.city || (lang === "es" ? "Ubicación por confirmar" : "Location to be confirmed")}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="text-sm text-[#111111]/85 space-y-1">
                      {addressLine ? <p>{addressLine}</p> : null}
                      <p className="font-medium">{listing.city}</p>
                    </div>
                    {mapsSearchHref ? (
                      <a
                        href={mapsSearchHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl border border-[#3F5A43]/50 bg-[#EEF3ED] px-4 py-2.5 text-sm font-semibold text-[#2F4A33] hover:bg-[#E3EBDD] transition"
                      >
                        {t.mapCta}
                      </a>
                    ) : null}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-[#111111]/50 mb-2">
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
                        <p className="mt-2 text-sm text-[#111111]/70">
                          {lang === "es" ? "Aproximadamente" : "Approximately"} {Math.round(distanceMiles)}{" "}
                          {lang === "es" ? "millas de distancia" : "miles away"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

            </div>

            <aside className="w-full min-w-0 lg:col-start-2 lg:row-start-1 lg:self-start lg:sticky lg:top-6">
              <BusinessListingIdentityRail
                businessRail={rail}
                category="bienes-raices"
                businessRailTier={listing.businessRailTier}
                lang={lang}
                ownerId={listing.ownerId ?? null}
                agentProfileReturnUrl={listing.agentProfileReturnUrl ?? null}
                premiumBienesRaices
              />
            </aside>

            <section id={ANCHOR_IDS.contacto} className="w-full min-w-0 lg:col-span-2 scroll-mt-28">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111111]/50 mb-4">{t.lowerAgentTitle}</h2>
              <LowerAgentBlock rail={rail} lang={lang} />
            </section>
          </div>
        </div>

        {lightboxOpen && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-[1px] p-3 sm:p-6">
            <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col rounded-2xl border border-white/10 bg-black/50">
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
    <div className="rounded-2xl border border-stone-200/80 bg-[#FFFDFB] p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-6">
        {rail.agentPhotoUrl ? (
          <img src={rail.agentPhotoUrl} alt="" className="h-24 w-24 rounded-2xl border border-stone-200 object-cover shrink-0 shadow-sm" />
        ) : null}
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#111111]/50">
              {lang === "es" ? "Agente" : "Agent"}
            </p>
            <p className="text-lg font-bold text-[#111111]">{rail.agent?.trim() || rail.name}</p>
            {rail.role?.trim() ? <p className="text-sm text-[#111111]/70">{rail.role}</p> : null}
            {rail.agentLicense?.trim() ? (
              <p className="text-xs text-[#111111]/55 mt-1">
                {lang === "es" ? "Licencia" : "License"}: {rail.agentLicense}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {rail.logoUrl ? <img src={rail.logoUrl} alt="" className="h-12 w-12 rounded-lg border border-stone-200 object-contain bg-white" /> : null}
            <p className="text-base font-semibold text-[#111111]">{rail.name}</p>
          </div>
          {rail.businessDescription?.trim() ? (
            <p className="text-sm leading-relaxed text-[#111111]/80 whitespace-pre-wrap max-w-[62ch]">{rail.businessDescription}</p>
          ) : null}
          <div className="flex flex-wrap gap-3 text-sm">
            {rail.officePhone?.trim() ? (
              <span className="text-[#111111]">
                <span className="text-[#111111]/60">{lang === "es" ? "Tel." : "Phone"}:</span> {rail.officePhone}
              </span>
            ) : null}
            {rail.agentEmail?.trim() ? (
              <span className="text-[#111111] break-all">
                <span className="text-[#111111]/60">{lang === "es" ? "Correo" : "Email"}:</span> {rail.agentEmail.trim()}
              </span>
            ) : null}
            {rail.website?.trim() ? (
              <span className="text-[#111111] break-all">
                <span className="text-[#111111]/60">{lang === "es" ? "Web" : "Web"}:</span> {rail.website}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
