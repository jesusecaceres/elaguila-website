"use client";

import { useCallback, useMemo, useState } from "react";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { getRoughDistanceMiles } from "@/app/lib/distance";
import { partitionBienesRaicesPreviewDetailPairs } from "@/app/clasificados/lib/bienesRaicesPreviewDetailPartition";
import BusinessListingIdentityRail from "./BusinessListingIdentityRail";
import type { ListingData } from "./ListingView";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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

  const images = useMemo(() => {
    const incoming = listing.images ?? [];
    return Array.isArray(incoming) && incoming.length > 0 ? incoming : ["/logo.png"];
  }, [listing.images]);

  // Kept: same hero selection logic.
  const safeHero = Math.min(heroIndex, Math.max(0, images.length - 1));
  const heroSrc = images[safeHero] ?? "/logo.png";

  const canCycle = images.length > 1;
  const goPrevHero = () =>
    setHeroIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  const goNextHero = () =>
    setHeroIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
  const openLightbox = (index: number) => {
    setLightboxIndex(Math.max(0, Math.min(index, images.length - 1)));
    setLightboxZoom(1);
    setLightboxOpen(true);
  };
  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxZoom(1);
  };
  const prevLightbox = () =>
    setLightboxIndex((i) => (i <= 0 ? images.length - 1 : i - 1));
  const nextLightbox = () =>
    setLightboxIndex((i) => (i >= images.length - 1 ? 0 : i + 1));

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
            aboutAgent: "Sobre el agente",
            propertyPhotos: "Fotos de la propiedad",
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
            aboutAgent: "About the agent",
            propertyPhotos: "Property photos",
          },
    [lang]
  );

  const sellerDisplayName = (listing.sellerName ?? "").trim() || t.you;
  const detailCardClass = "rounded-2xl border border-stone-200/90 bg-white/90 p-4 sm:p-5 lg:p-6 shadow-sm";

  const showBusinessRail = Boolean(listing.businessRail && listing.category === "bienes-raices");

  const portraitSrc = useMemo(() => {
    const agent = listing.businessRail?.agentPhotoUrl?.trim();
    if (agent) return agent;
    return heroSrc;
  }, [listing.businessRail?.agentPhotoUrl, heroSrc]);

  const aboutAgentText = (listing.businessRail?.businessDescription ?? "").trim();

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

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {images.map((url, idx) => (
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

  return (
    <div className="rounded-[1.75rem] border border-stone-200/90 bg-gradient-to-b from-[#FBFAF7] to-[#F4F1EA] shadow-[0_12px_48px_-16px_rgba(17,17,17,0.18)] overflow-hidden">
      <div className="p-4 sm:p-6 lg:p-8">
        {showBusinessRail && listing.businessRail ? (
          <>
            {/* Hero band: profile summary (left on desktop) + large portrait (right). Mobile: portrait first. */}
            <div className="flex flex-col-reverse lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] gap-6 lg:gap-10 lg:items-stretch">
              <div className="min-w-0 flex lg:min-h-[560px]">
                <BusinessListingIdentityRail
                  businessRail={listing.businessRail}
                  category="bienes-raices"
                  businessRailTier={listing.businessRailTier}
                  lang={lang}
                  ownerId={listing.ownerId ?? null}
                  presentation="profile"
                  listingCity={listing.city}
                />
              </div>
              <div className="relative min-h-[320px] sm:min-h-[400px] lg:min-h-[560px] rounded-2xl overflow-hidden border border-[#C9B46A]/35 bg-stone-200 shadow-[0_16px_40px_-24px_rgba(17,17,17,0.35)]">
                <img src={portraitSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </div>
            </div>

            {aboutAgentText ? (
              <section className="mt-10 lg:mt-14 border-t border-[#C9B46A]/28 pt-10" aria-labelledby="br-about-agent-heading">
                <h2
                  id="br-about-agent-heading"
                  className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8B6914]/90 mb-5 pb-2 border-b border-[#C9B46A]/25 w-full max-w-xl"
                >
                  {t.aboutAgent}
                </h2>
                <div className="max-w-[70ch] text-sm sm:text-[0.95rem] text-[#111111]/88 leading-[1.8] whitespace-pre-wrap">
                  {aboutAgentText}
                </div>
              </section>
            ) : null}

            <div className="mt-10 lg:mt-12 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#111111]/55">{t.propertyPhotos}</h3>
              {propertyHeroSection}
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
                  {lang === "es" ? "Galería de fotos" : "Photo gallery"} {lightboxIndex + 1}/{images.length}
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
                  src={images[lightboxIndex] ?? "/logo.png"}
                  alt=""
                  className="h-full w-full object-contain transition-transform duration-200"
                  style={{ transform: `scale(${lightboxZoom})` }}
                />
                {images.length > 1 && (
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

        {/* Main listing content row (below hero): left-only */}
        <div className="mt-8 lg:grid lg:grid-cols-1">
          <div className="lg:col-start-1 lg:col-span-1 min-w-0 space-y-5 sm:space-y-6 border-t border-stone-200/70 pt-8">
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

