"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { getRoughDistanceMiles } from "@/app/lib/distance";
import type { ListingData } from "@/app/clasificados/components/ListingView";
import { BienesRaicesPrivadoOwnerTrustCard } from "@/app/clasificados/bienes-raices/privado/preview/BienesRaicesPrivadoOwnerTrustCard";
import {
  BR_PRIVADO_PREVIEW_ANCHORS,
  brPrivadoFactsSectionTitle,
  buildBrPrivadoPremiumPreviewSections,
  buildPrivadoMapsEmbedSrc,
  formatBrPrivadoPreviewPrice,
  normalizePrivadoMediaHref,
  structuredFactsToPrivadoStatRows,
} from "@/app/clasificados/bienes-raices/privado/preview/brPrivadoPremiumPreviewHelpers";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type BienesRaicesPreviewListingProps = {
  listing: ListingData;
  variant?: "embedded" | "full";
  /** Live public anuncio: match preview layout; hide preview chrome; use `#resumen` … anchors. */
  liveMode?: boolean;
  liveContact?: {
    onRequestInfo: () => void;
    onScheduleVisit: () => void;
    onOpenChat: () => void;
  };
};

const LIVE_PUBLIC_ANCHORS = {
  resumen: "resumen",
  detalles: "detalles",
  ubicacion: "ubicacion",
  contacto: "contacto",
} as const;

export default function BienesRaicesPreviewListing({
  listing,
  variant = "embedded",
  liveMode = false,
  liveContact,
}: BienesRaicesPreviewListingProps) {
  const lang = listing.lang;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [viewerCityInput, setViewerCityInput] = useState("");
  const [previewToast, setPreviewToast] = useState<string | null>(null);
  const lightboxTouchStartX = useRef(0);

  const showPreviewToast = useCallback((msg: string) => {
    setPreviewToast(msg);
    setTimeout(() => setPreviewToast(null), 2800);
  }, []);

  const photoUrls = useMemo(() => {
    const incoming = listing.images ?? [];
    return Array.isArray(incoming) && incoming.length > 0 ? incoming : ["/logo.png"];
  }, [listing.images]);

  const isLogoPlaceholder = (u: string) => u === "/logo.png" || u.endsWith("/logo.png");
  const isDefaultPhotoOnly = photoUrls.length === 1 && isLogoPlaceholder(photoUrls[0] ?? "");
  const heroSrc = photoUrls[0] ?? "/logo.png";
  const extraImageCount = isDefaultPhotoOnly ? 0 : Math.max(0, photoUrls.length - 1);
  const thumbStrip = useMemo(() => {
    if (isDefaultPhotoOnly) return [];
    return photoUrls.slice(0, 8);
  }, [photoUrls, isDefaultPhotoOnly]);

  const virtualTourHref = normalizePrivadoMediaHref((detailsVirtualTour(listing) ?? "").trim());
  const proVideoHref = normalizePrivadoMediaHref((listing.proVideoUrl ?? "").trim());
  const proVideo2Href = normalizePrivadoMediaHref((listing.proVideoUrl2 ?? "").trim());

  const openLightbox = useCallback(
    (index: number) => {
      setLightboxIndex(Math.max(0, Math.min(index, photoUrls.length - 1)));
      setLightboxZoom(1);
      setLightboxOpen(true);
    },
    [photoUrls.length]
  );

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
    () => buildBrPrivadoPremiumPreviewSections(listing.detailPairs ?? [], lang),
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
  const addressLine = detailAddressLine || structuredAddr;
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
  const mapsEmbedSrc = buildPrivadoMapsEmbedSrc(mapsEmbedQuery, lang);

  const statRows = useMemo(() => structuredFactsToPrivadoStatRows(listing.structuredFacts, lang), [listing.structuredFacts, lang]);

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            tabs: ["Resumen", "Detalles", "Ubicación", "Contacto"] as const,
            previewBadge: "Vista previa",
            previewSubtitle: "Vista de propietario — clara y confiable.",
            laneChip: "Leonix · Propietario",
            brand: "Leonix Clasificados",
            aboutTitle: "Acerca de esta propiedad",
            factsTitle: "Datos y características",
            locationTitle: "Ubicación",
            mapCta: "Abrir en Google Maps",
            gallery: "Galería",
            close: "Cerrar",
            zoomIn: "Acercar",
            zoomOut: "Alejar",
            prev: "Anterior",
            next: "Siguiente",
            mapFrameTitle: "Mapa",
            tourTile: "Tour virtual",
            videoTile: "Video",
            photosTile: "+ fotos",
            mapTile: "Mapa",
            approxChip: "Ubicación aproximada",
          }
        : {
            tabs: ["Overview", "Details", "Location", "Contact"] as const,
            previewBadge: "Preview",
            previewSubtitle: "Owner-led listing: polished, calm, and built to earn trust.",
            laneChip: "Leonix · Owner",
            brand: "Leonix Clasificados",
            aboutTitle: "About this home",
            factsTitle: "Facts & features",
            locationTitle: "Location",
            mapCta: "Open in Google Maps",
            gallery: "Gallery",
            close: "Close",
            zoomIn: "Zoom in",
            zoomOut: "Zoom out",
            prev: "Previous",
            next: "Next",
            mapFrameTitle: "Map",
            tourTile: "Virtual tour",
            videoTile: "Video",
            photosTile: "+ photos",
            mapTile: "Map",
            approxChip: "Approximate location",
          },
    [lang]
  );

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const anchorIds = liveMode ? LIVE_PUBLIC_ANCHORS : BR_PRIVADO_PREVIEW_ANCHORS;
  const tabTargets = [anchorIds.resumen, anchorIds.detalles, anchorIds.ubicacion, anchorIds.contacto];

  const tileBase =
    "flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-1 text-center shadow-sm";
  const tileOn = "border-stone-300/80 bg-white text-[10px] font-semibold text-[#111111] hover:bg-stone-50 sm:text-[11px]";
  const tileOff = "border-stone-200/60 bg-stone-100/80 text-[10px] font-semibold text-[#111111]/30 sm:text-[11px] pointer-events-none select-none";

  const iconFacts = useMemo(() => {
    const patterns = [
      { pattern: /rec[aá]maras|bedrooms?/, icon: "🛏️", key: "bed" },
      { pattern: /ba[ñn]os|bathrooms?/, icon: "🛁", key: "bath" },
      { pattern: /pies|ft|sq\s*ft/i, icon: "📏", key: "area" },
      { pattern: /estacionamiento|parking/, icon: "🚗", key: "parking" },
      { pattern: /terreno|lot size/, icon: "🌿", key: "lot" },
      { pattern: /niveles|levels/, icon: "🏠", key: "levels" },
      { pattern: /año|year built/, icon: "📅", key: "year" },
    ];
    return patterns
      .map((b) => {
        const match = quickFacts.find((f) => b.pattern.test((f.label ?? "").toLowerCase()));
        return match ? { ...match, icon: b.icon, _key: b.key } : null;
      })
      .filter((v): v is { label: string; value: string; icon: string; _key: string } => Boolean(v));
  }, [quickFacts]);

  const hooks = listing.managementHooks;
  return (
    <div
      className={cx(
        "relative w-full min-w-0 overflow-x-hidden",
        liveMode
          ? "bg-transparent"
          : variant === "full"
            ? "bg-[#F5F4F1]"
            : "rounded-[1.5rem] border border-stone-200/80 bg-gradient-to-b from-white to-stone-50/90 shadow-[0_12px_40px_-20px_rgba(17,17,17,0.18)]"
      )}
      data-br-branch="privado"
      data-publish-ready={hooks?.branch === "privado" ? (hooks.publishReady ? "true" : "false") : undefined}
      data-analytics-ready={hooks?.branch === "privado" ? (hooks.analyticsReady ? "true" : "false") : undefined}
    >
      {!liveMode && previewToast ? (
        <div className="fixed bottom-6 left-1/2 z-[130] -translate-x-1/2 rounded-full border border-stone-200 bg-[#111111] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {previewToast}
        </div>
      ) : null}

      <div className={cx(liveMode ? "p-0" : variant === "full" ? "px-4 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-9" : "p-4 sm:p-5 lg:p-6")}>
        {!liveMode ? (
          <header
            className={cx(
              "mb-6 w-full min-w-0 border-b border-stone-200/70 pb-5",
              variant === "full" &&
                "sticky top-0 z-20 -mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10 pt-2 bg-[#F5F4F1]/95 backdrop-blur-md"
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full border border-stone-300/60 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                {t.previewBadge}
              </div>
              <span className="inline-flex rounded-full border border-emerald-800/20 bg-emerald-50/90 px-2.5 py-1 text-[10px] font-semibold text-emerald-950">
                {t.laneChip}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-lg font-bold text-[#111111]">{t.brand}</p>
              <p className="mt-1 text-sm text-stone-600 max-w-md">{t.previewSubtitle}</p>
            </div>
            <nav
              className="mt-5 flex gap-1.5 overflow-x-auto overflow-y-hidden border-t border-stone-200/60 pt-4 pb-0.5 flex-nowrap sm:flex-wrap sm:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label={lang === "es" ? "Secciones" : "Sections"}
            >
              {t.tabs.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => scrollToId(tabTargets[i]!)}
                  className={cx(
                    "shrink-0 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition",
                    i === 0 ? "border border-stone-300 bg-white text-[#111111]" : "border border-transparent text-stone-600 hover:bg-white/80"
                  )}
                >
                  {label}
                </button>
              ))}
            </nav>
          </header>
        ) : null}

        <div className="mx-auto max-w-[86rem] min-w-0">
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_19.5rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="min-w-0 flex flex-col gap-8">
              <div id={anchorIds.resumen} className="scroll-mt-28 space-y-4">
                <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] lg:gap-4">
                  <div
                    className={cx(
                      "relative min-h-[220px] w-full overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100 aspect-[4/3] sm:min-h-[260px] sm:aspect-[16/10] lg:aspect-auto",
                      variant === "full" ? "lg:min-h-[min(52vh,480px)]" : "lg:min-h-[min(46vh,420px)]"
                    )}
                  >
                    <button type="button" onClick={() => openLightbox(0)} className="absolute inset-0 block cursor-zoom-in" aria-label={t.gallery}>
                      <img src={heroSrc} alt="" className="h-full w-full object-cover" />
                    </button>
                    {photoUrls.length > 1 && (
                      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/40 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {photoUrls.length} {lang === "es" ? "fotos" : "photos"}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" aria-label={lang === "es" ? "Enlaces rápidos" : "Quick links"}>
                    {virtualTourHref ? (
                      <a href={virtualTourHref} target="_blank" rel="noopener noreferrer" className={cx(tileBase, tileOn, "min-h-[4.5rem]")}>
                        <span className="text-lg" aria-hidden>
                          🌐
                        </span>
                        <span>{t.tourTile}</span>
                      </a>
                    ) : (
                      <div className={cx(tileBase, tileOff, "min-h-[4.5rem]")}>
                        <span className="text-lg opacity-40" aria-hidden>
                          🌐
                        </span>
                        <span>{t.tourTile}</span>
                      </div>
                    )}
                    {proVideoHref ? (
                      <a href={proVideoHref} target="_blank" rel="noopener noreferrer" className={cx(tileBase, tileOn, "min-h-[4.5rem]")}>
                        <span className="text-lg" aria-hidden>
                          🎥
                        </span>
                        <span>{listing.isPro && proVideo2Href ? `${t.videoTile} 1` : t.videoTile}</span>
                      </a>
                    ) : (
                      <div className={cx(tileBase, tileOff, "min-h-[4.5rem]")}>
                        <span className="text-lg opacity-40" aria-hidden>
                          🎥
                        </span>
                        <span>{t.videoTile}</span>
                      </div>
                    )}
                    {listing.isPro && proVideo2Href ? (
                      <a href={proVideo2Href} target="_blank" rel="noopener noreferrer" className={cx(tileBase, tileOn, "min-h-[4.5rem]")}>
                        <span className="text-lg" aria-hidden>
                          🎬
                        </span>
                        <span>{lang === "es" ? "Video 2" : "Video 2"}</span>
                      </a>
                    ) : (
                      <div className={cx(tileBase, tileOff, "min-h-[4.5rem]")}>
                        <span className="text-lg opacity-40" aria-hidden>
                          🎬
                        </span>
                        <span>{lang === "es" ? "Video 2" : "Video 2"}</span>
                      </div>
                    )}
                    {extraImageCount > 0 ? (
                      <button type="button" onClick={openMorePhotosLightbox} className={cx(tileBase, tileOn, "min-h-[4.5rem] cursor-pointer")}>
                        <span className="text-lg" aria-hidden>
                          🖼️
                        </span>
                        <span>{t.photosTile}</span>
                      </button>
                    ) : (
                      <div className={cx(tileBase, tileOff, "min-h-[4.5rem]")}>
                        <span className="text-lg opacity-40" aria-hidden>
                          🖼️
                        </span>
                        <span>{t.photosTile}</span>
                      </div>
                    )}
                    {mapsSearchHref ? (
                      <a href={mapsSearchHref} target="_blank" rel="noopener noreferrer" className={cx(tileBase, tileOn, "min-h-[4.5rem]")}>
                        <span className="text-lg" aria-hidden>
                          📍
                        </span>
                        <span>{t.mapTile}</span>
                      </a>
                    ) : (
                      <div className={cx(tileBase, tileOff, "min-h-[4.5rem]")}>
                        <span className="text-lg opacity-40" aria-hidden>
                          📍
                        </span>
                        <span>{t.mapTile}</span>
                      </div>
                    )}
                  </div>
                </div>

                {thumbStrip.length > 1 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {thumbStrip.map((url, i) => (
                      <button
                        key={`${url}-${i}`}
                        type="button"
                        onClick={() => openLightbox(i)}
                        className={cx(
                          "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition",
                          i === 0 ? "border-stone-500/50" : "border-stone-200/80 opacity-90 hover:opacity-100"
                        )}
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm scroll-mt-28">
                <div className="flex flex-wrap items-center gap-2">
                  {listing.categoryLabel ? (
                    <span className="inline-flex rounded-full border border-stone-300/70 bg-stone-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-700">
                      {listing.categoryLabel}
                    </span>
                  ) : null}
                  {listing.listingLocationIsApproximate ? (
                    <span className="inline-flex rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-950">
                      {t.approxChip}
                    </span>
                  ) : null}
                  {listing.listingStatusLabel ? (
                    <span className="inline-flex rounded-full border border-emerald-700/25 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-900">
                      {listing.listingStatusLabel}
                    </span>
                  ) : null}
                </div>
                {listing.highlightChips && listing.highlightChips.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {listing.highlightChips.map((h, i) => (
                      <span key={`hl-${i}-${h}`} className="inline-flex rounded-lg border border-stone-200 bg-stone-50/80 px-2.5 py-1 text-xs font-medium text-stone-800">
                        {h}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="mt-5 text-3xl sm:text-[2.2rem] font-extrabold tabular-nums tracking-tight text-[#111111]">
                  {formatBrPrivadoPreviewPrice(listing.priceLabel, lang)}
                </p>
                <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#111111] leading-tight tracking-tight">{listing.title}</h1>
                {listing.listingSummaryShort ? (
                  <p className="mt-2 text-sm font-medium text-stone-700">{listing.listingSummaryShort}</p>
                ) : null}
                {listing.todayLabel ? <p className="mt-2 text-sm text-stone-500">{listing.todayLabel}</p> : null}

                <div className="mt-4 space-y-1 text-sm text-stone-800">
                  {addressLine ? (
                    <p className="font-medium">
                      {addressLine}
                      {neighborhoodLine ? <span className="text-stone-500"> · {neighborhoodLine}</span> : null}
                    </p>
                  ) : null}
                  <p>
                    <span className="font-semibold text-stone-700">{lang === "es" ? "Ciudad" : "City"}:</span> {listing.city}
                  </p>
                </div>

                {statRows.length > 0 ? (
                  <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {statRows.map((row) => (
                      <div key={`${row.label}-${row.value}`} className="flex items-baseline justify-between gap-2 rounded-xl border border-stone-200/80 bg-stone-50/50 px-3 py-2 text-sm">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{row.label}</span>
                        <span className="font-semibold text-[#111111] tabular-nums text-right">{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : iconFacts.length > 0 ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {iconFacts.map((f) => (
                      <span
                        key={`${f._key}-${f.value}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#111111]"
                      >
                        <span aria-hidden>{f.icon}</span>
                        <span className="text-stone-500">{f.label}:</span> {f.value}
                      </span>
                    ))}
                  </div>
                ) : null}

                {featureTags.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {featureTags.map((tag, i) => (
                      <span key={`ft-${i}`} className="inline-flex rounded-lg border border-stone-200/90 bg-white px-2.5 py-1 text-xs font-medium text-stone-700">
                        {tag.value}
                      </span>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="scroll-mt-28">
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 mb-3">{t.aboutTitle}</h2>
                <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
                  <div className="max-w-[68ch] text-base leading-relaxed text-[#111111]/90 whitespace-pre-wrap">{listing.description}</div>
                </div>
              </section>

              <section id={anchorIds.detalles} className="scroll-mt-28">
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 mb-3">{t.factsTitle}</h2>
                <div className="space-y-5">
                  {filteredSections.map((sec) => (
                    <div key={sec.id} className="rounded-2xl border border-stone-200/75 bg-white p-5 sm:p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-[#111111] mb-3 pb-2 border-b border-stone-200/60">
                        {brPrivadoFactsSectionTitle(sec.id, lang)}
                      </h3>
                      <dl className="grid gap-3 sm:grid-cols-2">
                        {sec.pairs.map((p, idx) => (
                          <div key={`${p.label}-${idx}`} className="min-w-0">
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{p.label}</dt>
                            <dd className="mt-0.5 text-sm text-stone-800 break-words">{p.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              </section>

              <section id={anchorIds.ubicacion} className="scroll-mt-28">
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 mb-3">{t.locationTitle}</h2>
                <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
                  {mapsEmbedSrc ? (
                    <iframe
                      title={t.mapFrameTitle}
                      src={mapsEmbedSrc}
                      className="h-[min(52vw,300px)] w-full border-0 sm:h-[260px]"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="flex min-h-[140px] items-center justify-center bg-stone-100/60 px-4">
                      <p className="text-center text-sm text-stone-600">
                        {addressLine || listing.city || (lang === "es" ? "Ubicación por confirmar" : "Location to be confirmed")}
                      </p>
                    </div>
                  )}
                  <div className="space-y-3 border-t border-stone-100 p-5">
                    {mapsSearchHref ? (
                      <a
                        href={mapsSearchHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                      >
                        {t.mapCta}
                      </a>
                    ) : null}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
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
                      {distanceMiles !== null ? (
                        <p className="mt-2 text-sm text-stone-600">
                          {lang === "es" ? "Aproximadamente" : "Approximately"} {Math.round(distanceMiles)}{" "}
                          {lang === "es" ? "millas" : "miles"}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div id={anchorIds.contacto} className="w-full min-w-0 scroll-mt-28 lg:sticky lg:top-24 lg:self-start">
              <BienesRaicesPrivadoOwnerTrustCard
                listing={listing}
                onPreviewAction={liveMode ? undefined : showPreviewToast}
                liveContact={liveMode ? liveContact : undefined}
              />
            </div>
          </div>
        </div>

        {lightboxOpen && (
          <div className="fixed inset-0 z-[120] bg-black/85 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 sm:pt-6 sm:pb-6">
            <div className="relative mx-auto flex h-full max-w-6xl min-h-0 flex-col rounded-2xl border border-white/10 bg-black/55">
              <div className="flex items-center justify-between px-4 py-3 text-white">
                <p className="text-sm font-medium">
                  {t.gallery} {lightboxIndex + 1}/{photoUrls.length}
                </p>
                <div className="flex gap-2">
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
              <div
                className="relative flex-1 min-h-0 overflow-hidden touch-pan-y"
                onTouchStart={(e) => {
                  lightboxTouchStartX.current = e.touches[0]?.clientX ?? 0;
                }}
                onTouchEnd={(e) => {
                  if (photoUrls.length <= 1) return;
                  const endX = e.changedTouches[0]?.clientX ?? 0;
                  const dx = endX - lightboxTouchStartX.current;
                  if (dx > 50) prevLightbox();
                  else if (dx < -50) nextLightbox();
                }}
              >
                <img
                  src={photoUrls[lightboxIndex] ?? "/logo.png"}
                  alt=""
                  className="h-full w-full object-contain transition-transform duration-200 select-none"
                  draggable={false}
                  style={{ transform: `scale(${lightboxZoom})` }}
                />
                {photoUrls.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevLightbox}
                      className="absolute left-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-black/55 text-xl font-bold text-white hover:bg-black/75"
                      aria-label={t.prev}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={nextLightbox}
                      className="absolute right-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-black/55 text-xl font-bold text-white hover:bg-black/75"
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

function detailsVirtualTour(listing: ListingData): string {
  const pairs = listing.detailPairs ?? [];
  const hit = pairs.find((p) => /tour virtual|virtual tour/i.test((p.label ?? "").toLowerCase()));
  return (hit?.value ?? "").trim();
}
