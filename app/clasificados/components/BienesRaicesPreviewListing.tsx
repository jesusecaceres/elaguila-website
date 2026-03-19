"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { getRoughDistanceMiles } from "@/app/lib/distance";
import { partitionBienesRaicesPreviewDetailPairs } from "@/app/clasificados/lib/bienesRaicesPreviewDetailPartition";
import BusinessListingIdentityRail from "./BusinessListingIdentityRail";
import type { ListingData } from "./ListingView";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Openable media href: absolute http(s), blob (preview uploads), or site-relative paths. */
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
  // Keep existing formatListingPrice behavior for Gratis/Free and fallback cases.
  const base = formatListingPrice(priceLabel, { lang });
  const lower = base.toLowerCase();
  if (lower.includes("gratis") || lower.includes("free")) return base;

  const numericMatch = base.match(/-?\d+(?:\.\d+)?/);
  if (!numericMatch) return base;

  const n = Number(numericMatch[0]);
  if (!Number.isFinite(n)) return base;

  const roundedIntStr = String(Math.round(n));
  const withCommas = roundedIntStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // formatListingPrice returns `$${...}` for numeric values, so keep `$` prefix when present.
  return base.includes("$") ? `$${withCommas}` : withCommas;
}

export type BienesRaicesPreviewListingProps = {
  listing: ListingData;
};

export default function BienesRaicesPreviewListing({ listing }: BienesRaicesPreviewListingProps) {
  const lang = listing.lang;
  const [heroIndex, setHeroIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [viewerCityInput, setViewerCityInput] = useState("");
  const [previewToast, setPreviewToast] = useState<string | null>(null);

  const showPreviewToast = useCallback((msg: string) => {
    setPreviewToast(msg);
    const t = setTimeout(() => setPreviewToast(null), 3000);
    return () => clearTimeout(t);
  }, []);

  const photoUrls = useMemo(() => {
    const incoming = listing.images ?? [];
    return Array.isArray(incoming) && incoming.length > 0 ? incoming : ["/logo.png"];
  }, [listing.images]);

  const isLogoPlaceholder = (u: string) => u === "/logo.png" || u.endsWith("/logo.png");
  /** True when the only “image” is the default logo (no real uploads yet). */
  const isDefaultPhotoOnly = photoUrls.length === 1 && isLogoPlaceholder(photoUrls[0] ?? "");

  // Non-negocio hero: allow cycling thumbnails under hero.
  const safeHero = Math.min(heroIndex, Math.max(0, photoUrls.length - 1));
  const heroSrc = photoUrls[safeHero] ?? "/logo.png";

  const canCycle = photoUrls.length > 1;
  const goPrevHero = () =>
    setHeroIndex((i) => (i <= 0 ? photoUrls.length - 1 : i - 1));
  const goNextHero = () =>
    setHeroIndex((i) => (i >= photoUrls.length - 1 ? 0 : i + 1));
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

  useEffect(() => {
    setLightboxZoom(1);
  }, [lightboxIndex]);

  const { quickFacts } = useMemo(
    () => partitionBienesRaicesPreviewDetailPairs(listing.detailPairs ?? [], lang),
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
  const addressFallback = (listing.approximateArea ?? "").trim() || null;
  const addressLine = detailAddressLine ?? addressFallback;
  const compactQuickFacts = useMemo(
    () =>
      quickFacts.filter((f) => {
        const label = (f.label ?? "").trim().toLowerCase();
        return !/vecindad|neighborhood|niveles|stories/.test(label);
      }),
    [quickFacts]
  );
  const neighborhoodLine = useMemo(() => {
    const fromFacts = quickFacts.find((f) => /vecindad|neighborhood/.test((f.label ?? "").toLowerCase()))?.value?.trim() || null;
    return detailNeighborhoodLine ?? fromFacts;
  }, [quickFacts, detailNeighborhoodLine]);

  const iconFacts = useMemo(() => {
    const buckets = [
      { pattern: /rec[aá]maras|bedrooms?/, icon: "🛏️", key: "bed" },
      { pattern: /ba[ñn]os|bathrooms?/, icon: "🛁", key: "bath" },
      { pattern: /pies|ft|sq\s*ft|superficie|area/, icon: "📏", key: "area" },
      { pattern: /estacionamiento|parking|garage/, icon: "🚗", key: "parking" },
      { pattern: /terreno|lot|land/, icon: "🌿", key: "lot" },
    ];
    return buckets
      .map((b) => {
        const match = compactQuickFacts.find((f) => b.pattern.test((f.label ?? "").toLowerCase()));
        return match ? { ...match, icon: b.icon, _key: b.key } : null;
      })
      .filter((v): v is { label: string; value: string; icon: string; _key: string } => Boolean(v));
  }, [compactQuickFacts]);

  const distanceMiles = useMemo(
    () => (viewerCityInput.trim() && listing.city ? getRoughDistanceMiles(viewerCityInput, listing.city) : null),
    [viewerCityInput, listing.city]
  );

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            guardar: "☆ Guardar",
            compartir: "Compartir",
            contactPhoneOnly: "Llamar",
            contactEmailOnly: "Email",
            buyerActionsHelper: "Así podrán contactarte los compradores.",
            postedBy: "Publicado por",
            you: "Tú",
            newSeller: "Nuevo vendedor",
            memberSince: "Miembro desde",
            location: "Ubicación",
            sellerLocation: "Ubicación del vendedor:",
            distanceLabel: "Calcula la distancia desde tu ciudad",
            cityPlaceholder: "Ingresa tu ciudad",
            milesAway: "Aproximadamente",
            miles: "millas de distancia",
            previewToastSave: "Vista previa: aquí el usuario guardará el anuncio",
            previewToastShare: "Vista previa: aquí el usuario compartirá el anuncio",
            previewToastCall: "Vista previa: aquí el comprador podrá llamarte",
            previewToastText: "Vista previa: aquí el comprador podrá enviarte texto",
            previewToastEmail: "Vista previa: aquí el comprador podrá enviarte correo",
            memberLabel: "Miembro",
            responsePlaceholder: "Respuesta: —",
            verifiedPlaceholder: "Verificado (próximamente)",
            descripcion: "Descripción",
            detallesPropiedad: "Detalles de la propiedad",
            propertyPhotos: "Fotos de la propiedad",
            tileTour: "Tour virtual",
            tilePlan: "Plano",
            tileVideo: "Video",
            tileMorePhotos: "+ fotos",
          }
        : {
            guardar: "☆ Save",
            compartir: "Share",
            contactPhoneOnly: "Call",
            contactEmailOnly: "Email",
            buyerActionsHelper: "This is how buyers will contact you.",
            postedBy: "Posted by",
            you: "You",
            newSeller: "New seller",
            memberSince: "Member since",
            location: "Location",
            sellerLocation: "Seller location:",
            distanceLabel: "Calculate distance from your city",
            cityPlaceholder: "Enter your city",
            milesAway: "Approximately",
            miles: "miles away",
            previewToastSave: "Preview: user would save listing here",
            previewToastShare: "Preview: user would share listing here",
            previewToastCall: "Preview: buyer would call you here",
            previewToastText: "Preview: buyer would text you here",
            previewToastEmail: "Preview: buyer would email you here",
            memberLabel: "Member",
            responsePlaceholder: "Response: —",
            verifiedPlaceholder: "Verified (coming soon)",
            descripcion: "Description",
            detallesPropiedad: "Property details",
            propertyPhotos: "Property photos",
            tileTour: "Virtual tour",
            tilePlan: "Floor plan",
            tileVideo: "Video",
            tileMorePhotos: "+ photos",
          },
    [lang]
  );

  const sellerDisplayName = (listing.sellerName ?? "").trim() || t.you;
  const detailCardClass = "rounded-2xl border border-stone-200/90 bg-white/90 p-4 sm:p-5 lg:p-6 shadow-sm";

  const showBusinessRail = Boolean(listing.businessRail && listing.category === "bienes-raices");

  const virtualTourRaw =
    (listing.businessRail?.virtualTourUrl ?? "").trim() ||
    pickDetailPairValue(listing.detailPairs, (lab) => /tour virtual|virtual tour/.test(lab));
  const floorPlanRaw =
    (listing.floorPlanUrl ?? "").trim() ||
    pickDetailPairValue(listing.detailPairs, (lab) => /plano|floorplan|floor plan/.test(lab));
  const virtualTourHref = normalizeMediaHref(virtualTourRaw);
  const floorPlanHref = normalizeMediaHref(floorPlanRaw);
  const proVideoHref = normalizeMediaHref((listing.proVideoUrl ?? "").trim());

  /** Extra listing photos after the main hero (negocio: no thumbnail row; extras only via + fotos). */
  const extraImageCount = isDefaultPhotoOnly ? 0 : Math.max(0, photoUrls.length - 1);
  const negocioMainHeroSrc = photoUrls[0] ?? "/logo.png";

  const openMorePhotosLightbox = useCallback(() => {
    if (extraImageCount <= 0) return;
    // Land on first photo beyond the hero (the “additional” set); user can arrow to hero and back.
    const start = photoUrls.length > 1 ? 1 : 0;
    setLightboxIndex(start);
    setLightboxZoom(1);
    setLightboxOpen(true);
  }, [extraImageCount, photoUrls.length]);

  /** Main hero: fixed aspect — do not stretch to match the right column height (avoids empty band under image). */
  const negocioHeroOnly = (
    <div className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100 shadow-inner aspect-[4/3]">
      <img src={negocioMainHeroSrc} alt="" className="h-full w-full object-cover" />
    </div>
  );

  const propertyHeroSection = (
    <div className="min-w-0 flex flex-col gap-3">
      <div className="relative min-h-[280px] sm:min-h-[340px] lg:min-h-0 lg:h-[520px] xl:h-[540px] rounded-2xl overflow-hidden border border-stone-200/80 bg-stone-100 shadow-inner">
        <img src={heroSrc} alt="" className="w-full h-full object-cover" />
        {canCycle && (
          <>
            <button
              type="button"
              onClick={goPrevHero}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg"
              aria-label={lang === "es" ? "Anterior" : "Previous"}
            >
              ←
            </button>
            <button
              type="button"
              onClick={goNextHero}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg"
              aria-label={lang === "es" ? "Siguiente" : "Next"}
            >
              →
            </button>
          </>
        )}
      </div>

      {photoUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {photoUrls.map((url, idx) => (
            <button
              key={`${url}-m-${idx}`}
              type="button"
              onClick={() => setHeroIndex(idx)}
              className={cx(
                "h-16 w-16 min-w-[4rem] shrink-0 rounded-lg overflow-hidden border-2",
                safeHero === idx ? "border-[#C9B46A]" : "border-stone-200"
              )}
              aria-label={lang === "es" ? `Foto ${idx + 1}` : `Photo ${idx + 1}`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  /** Fixed 2×2 media grid: equal square cells; inactive slots stay aligned (disabled look). */
  const negocioTileShell =
    "flex aspect-square min-h-0 w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-1 text-center shadow-sm";
  const negocioTileActive =
    "border-[#C9B46A]/35 bg-[#FFFCF6] text-[10px] font-semibold leading-tight text-[#111111] transition hover:bg-[#F8F2E6] sm:text-[11px]";
  const negocioTileDisabled =
    "border-[#C9B46A]/10 bg-[#EFEDE8]/90 text-[10px] font-semibold leading-tight text-[#111111]/32 sm:text-[11px] pointer-events-none select-none";

  return (
    <div className="rounded-[1.75rem] border border-stone-200/90 bg-gradient-to-b from-[#FBFAF7] to-[#F4F1EA] shadow-[0_12px_48px_-16px_rgba(17,17,17,0.18)] overflow-hidden">
      <div className="p-4 sm:p-6 lg:p-8">
        {showBusinessRail && listing.businessRail ? (
          <>
            {/*
              BR negocio full-preview top band (one row):
              - Left: main listing photo (aspect ratio, does not stretch with the right rail).
              - Right column: 2×2 media tiles on top, business / agent rail directly underneath.
              Title · price · address · details start below this full-width band (not under the hero alone).
            */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] gap-4 sm:gap-5 lg:gap-6 lg:items-start">
              <div className="order-1 min-w-0 self-start lg:max-w-none">{negocioHeroOnly}</div>
              <div className="order-2 flex w-full min-w-0 flex-col gap-3 sm:gap-3.5 self-start">
                <div
                  className="grid w-full max-w-[16.25rem] shrink-0 grid-cols-2 grid-rows-2 gap-2 self-center sm:max-w-[17rem] lg:mx-0 lg:self-start"
                  aria-label={lang === "es" ? "Medios de la propiedad" : "Property media"}
                >
                  {virtualTourHref ? (
                    <a
                      href={virtualTourHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cx(negocioTileShell, negocioTileActive)}
                    >
                      <span className="text-base sm:text-lg leading-none" aria-hidden>
                        🌐
                      </span>
                      <span>{t.tileTour}</span>
                    </a>
                  ) : (
                    <div className={cx(negocioTileShell, negocioTileDisabled)} aria-disabled="true">
                      <span className="text-base opacity-40 sm:text-lg" aria-hidden>
                        🌐
                      </span>
                      <span>{t.tileTour}</span>
                    </div>
                  )}
                  {floorPlanHref ? (
                    <a
                      href={floorPlanHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cx(negocioTileShell, negocioTileActive)}
                    >
                      <span className="text-base sm:text-lg leading-none" aria-hidden>
                        📐
                      </span>
                      <span>{t.tilePlan}</span>
                    </a>
                  ) : (
                    <div className={cx(negocioTileShell, negocioTileDisabled)} aria-disabled="true">
                      <span className="text-base opacity-40 sm:text-lg" aria-hidden>
                        📐
                      </span>
                      <span>{t.tilePlan}</span>
                    </div>
                  )}
                  {proVideoHref ? (
                    <a
                      href={proVideoHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cx(negocioTileShell, negocioTileActive)}
                    >
                      <span className="text-base sm:text-lg leading-none" aria-hidden>
                        🎥
                      </span>
                      <span>{t.tileVideo}</span>
                    </a>
                  ) : (
                    <div className={cx(negocioTileShell, negocioTileDisabled)} aria-disabled="true">
                      <span className="text-base opacity-40 sm:text-lg" aria-hidden>
                        🎥
                      </span>
                      <span>{t.tileVideo}</span>
                    </div>
                  )}
                  {extraImageCount > 0 ? (
                    <button
                      type="button"
                      onClick={openMorePhotosLightbox}
                      className={cx(negocioTileShell, negocioTileActive, "cursor-pointer")}
                    >
                      <span className="text-base sm:text-lg leading-none" aria-hidden>
                        🖼️
                      </span>
                      <span>{t.tileMorePhotos}</span>
                      <span className="text-[8px] font-bold uppercase tracking-wide text-[#8B6914]/90 leading-none">
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
                    <div className={cx(negocioTileShell, negocioTileDisabled)} aria-disabled="true">
                      <span className="text-base opacity-40 sm:text-lg" aria-hidden>
                        🖼️
                      </span>
                      <span>{t.tileMorePhotos}</span>
                    </div>
                  )}
                </div>
                <div className="w-full min-w-0">
                  <BusinessListingIdentityRail
                    businessRail={listing.businessRail}
                    category="bienes-raices"
                    businessRailTier={listing.businessRailTier}
                    lang={lang}
                    ownerId={listing.ownerId ?? null}
                    agentProfileReturnUrl={listing.agentProfileReturnUrl ?? null}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-6 lg:gap-8 items-start lg:items-stretch lg:grid-cols-1">{propertyHeroSection}</div>
        )}

        {lightboxOpen && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-[1px] p-3 sm:p-6">
            <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col rounded-2xl border border-white/10 bg-black/50">
              <div className="flex items-center justify-between px-4 py-3 text-white">
                <p className="text-sm font-medium">
                  {lang === "es" ? "Galería de fotos" : "Photo gallery"} {lightboxIndex + 1}/{photoUrls.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLightboxZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
                    className="rounded-lg border border-white/25 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
                    aria-label={lang === "es" ? "Alejar" : "Zoom out"}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                    className="rounded-lg border border-white/25 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
                    aria-label={lang === "es" ? "Acercar" : "Zoom in"}
                  >
                    ＋
                  </button>
                  <button
                    type="button"
                    onClick={closeLightbox}
                    className="rounded-lg border border-white/25 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
                    aria-label={lang === "es" ? "Cerrar galería" : "Close gallery"}
                  >
                    {lang === "es" ? "Cerrar" : "Close"}
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
                      aria-label={lang === "es" ? "Anterior" : "Previous"}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={nextLightbox}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/55 hover:bg-black/75 text-white text-xl font-bold"
                      aria-label={lang === "es" ? "Siguiente" : "Next"}
                    >
                      →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Below the full top band (hero + media grid + rail): title / price / address — full width, not nested under the left column */}
        <div className={cx("w-full min-w-0", showBusinessRail ? "mt-5 sm:mt-6" : "mt-8")}>
          <div
            className={cx(
              "min-w-0 space-y-5 sm:space-y-6 border-t border-stone-200/70",
              showBusinessRail ? "pt-5 sm:pt-6" : "pt-8"
            )}
          >
            {/* Title / price / city / posted + quick facts + feature chips */}
            <div className="rounded-2xl border border-[#C9B46A]/30 bg-[#FFFCF6] p-5 sm:p-6 lg:p-7 shadow-sm w-full lg:w-[min(100%,52rem)]">
              {listing.categoryLabel ? (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8B6914] mb-2">{listing.categoryLabel}</p>
              ) : null}

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111111] leading-tight tracking-tight break-words">
                {listing.title}
              </h1>

              <div className="mt-3 text-2xl sm:text-3xl lg:text-[2rem] font-extrabold text-[#111111] tabular-nums">
                {formatBrPriceWithCommaThousands(listing.priceLabel, lang)}
              </div>

              <div className="mt-3 text-sm text-[#111111]/75">{listing.todayLabel}</div>

              {addressLine ? (
                <p className="mt-2 text-sm text-[#111111]/70">
                  <span className="font-medium text-[#111111]/80">{lang === "es" ? "Dirección:" : "Address:"}</span>{" "}
                  {addressLine}
                </p>
              ) : null}
              {neighborhoodLine ? (
                <p className="mt-1 text-sm text-[#111111]/65">
                  <span className="font-medium text-[#111111]/75">{lang === "es" ? "Vecindad:" : "Neighborhood:"}</span>{" "}
                  {neighborhoodLine}
                </p>
              ) : null}

              {(iconFacts.length > 0 || compactQuickFacts.length > 0) && (
                <div className="mt-4 pt-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-[#111111]/55 mb-3">{t.detallesPropiedad}</h2>

                  {iconFacts.length > 0 && (
                    <div className="mb-5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#111111]/50 mb-2">
                        {lang === "es" ? "Datos clave" : "Quick facts"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {iconFacts.map((f) => (
                          <span
                            key={`qf-icon-${f._key}-${f.value}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B46A]/35 bg-[#FAF3E4] px-3 py-1.5 text-xs font-semibold text-[#111111]"
                          >
                            <span aria-hidden>{f.icon}</span>
                            <span className="text-[#111111]/60 font-medium">{f.label}:</span> {f.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="w-full lg:w-[min(100%,52rem)] rounded-2xl border border-[#C9B46A]/28 bg-[#FFFDF7] p-5 sm:p-6 lg:p-7 shadow-[0_10px_28px_-24px_rgba(17,17,17,0.45)]">
              <h3 className="text-sm font-semibold text-[#111111]/75 uppercase tracking-wide mb-3">{t.descripcion}</h3>
              <div className="max-w-[74ch] text-sm sm:text-base text-[#111111]/95 whitespace-pre-wrap leading-7">
                {listing.description}
              </div>
            </div>

            {/* Property details section header/cards (existing info-only partitioning) */}
            {/* Note: title/price/facts/features already rendered above; remaining cards are seller and location. */}

            {/* Seller / published-by */}
            <div className={`${detailCardClass} w-full`} data-section="seller-profile">
              <h4 className="text-xs font-semibold text-[#111111]/70 uppercase tracking-wide mb-2">{t.postedBy}</h4>
              <p className="text-base font-semibold text-[#111111]">{sellerDisplayName}</p>
              <span className="inline-block mt-1 text-xs text-[#111111]/60 font-medium">{t.memberLabel}</span>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#111111]/60">
                <span>⭐ {t.newSeller}</span>
                <span>📅 {t.memberSince} {new Date().getFullYear()}</span>
              </div>

              <div className="mt-2 text-xs text-[#111111]/50">{t.responsePlaceholder}</div>
              <div className="mt-1 text-xs text-[#111111]/50">{t.verifiedPlaceholder}</div>
            </div>

            {/* Location */}
            <div className={`${detailCardClass} w-full`}>
              <h3 className="text-xs font-semibold text-[#111111]/70 uppercase tracking-wide mb-2">{t.location}</h3>
              <p className="text-sm text-[#111111] mb-2">
                {t.sellerLocation} {listing.city}
              </p>

              <label className="block text-sm text-[#111111]/70 mb-1">{t.distanceLabel}</label>

              <CityAutocomplete
                value={viewerCityInput}
                onChange={setViewerCityInput}
                placeholder={t.cityPlaceholder}
                lang={lang}
                variant="light"
                className="mt-1 w-full max-w-full sm:max-w-md"
              />

              {distanceMiles !== null && (
                <p className="mt-2 text-sm text-[#111111]/70">
                  {t.milesAway} {Math.round(distanceMiles)} {t.miles}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

