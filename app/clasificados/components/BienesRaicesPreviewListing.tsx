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

export type BienesRaicesPreviewListingProps = {
  listing: ListingData;
};

/**
 * Buyer-facing BR preview shell for /preview-listing only.
 * Warm Private-BR-style hierarchy: hero + stacked thumbs, business rail, title block, fact pills, feature tags.
 */
export default function BienesRaicesPreviewListing({ listing }: BienesRaicesPreviewListingProps) {
  const lang = listing.lang;
  const [heroIndex, setHeroIndex] = useState(0);
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

  /** Vertical thumbs (all photos, scroll if many) — desktop access beyond first four without a new media contract. */
  const sideThumbs = images;
  const safeHero = Math.min(heroIndex, Math.max(0, images.length - 1));
  const heroSrc = images[safeHero] ?? "/logo.png";

  const { quickFacts, featureTags } = useMemo(
    () => partitionBienesRaicesPreviewDetailPairs(listing.detailPairs ?? [], lang),
    [listing.detailPairs, lang]
  );

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
          },
    [lang]
  );

  const sellerDisplayName = (listing.sellerName ?? "").trim() || t.you;
  const detailCardClass = "rounded-2xl border border-stone-200/90 bg-white/90 p-4 sm:p-5 shadow-sm";

  const showBusinessRail = Boolean(listing.businessRail && listing.category === "bienes-raices");

  return (
    <div className="rounded-[1.75rem] border border-stone-200/90 bg-gradient-to-b from-[#FBFAF7] to-[#F4F1EA] shadow-[0_12px_48px_-16px_rgba(17,17,17,0.18)] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,26rem)] gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
        {/* Hero / gallery */}
        <div className="min-w-0 flex flex-col gap-3 order-1">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-stretch">
            <div className="flex-1 min-h-[220px] sm:min-h-[320px] lg:min-h-[380px] rounded-2xl overflow-hidden border border-stone-200/80 bg-stone-100 shadow-inner">
              <img src={heroSrc} alt="" className="w-full h-full object-cover" />
            </div>
            {sideThumbs.length > 1 && (
              <div className="hidden sm:flex flex-col gap-2 w-[104px] lg:w-[118px] max-h-[min(420px,70vh)] overflow-y-auto shrink-0 pr-0.5">
                {sideThumbs.map((url, i) => {
                  const idx = i;
                  return (
                    <button
                      key={`${url}-${i}`}
                      type="button"
                      onClick={() => setHeroIndex(idx)}
                      className={cx(
                        "relative flex-1 min-h-[72px] rounded-xl overflow-hidden border-2 transition",
                        safeHero === idx
                          ? "border-[#C9B46A] ring-2 ring-[#C9B46A]/35 ring-offset-2 ring-offset-[#F4F1EA]"
                          : "border-stone-200/80 hover:border-stone-300"
                      )}
                    >
                      <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {/* Mobile thumb strip */}
          {images.length > 1 && (
            <div className="flex sm:hidden gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {images.map((url, idx) => (
                <button
                  key={`${url}-m-${idx}`}
                  type="button"
                  onClick={() => setHeroIndex(idx)}
                  className={cx(
                    "h-16 w-16 min-w-[4rem] shrink-0 rounded-lg overflow-hidden border-2",
                    safeHero === idx ? "border-[#C9B46A]" : "border-stone-200"
                  )}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="min-w-0 space-y-4 sm:space-y-5 order-2">
          {showBusinessRail && listing.businessRail && (
            <BusinessListingIdentityRail
              businessRail={listing.businessRail}
              category="bienes-raices"
              businessRailTier={listing.businessRailTier}
              lang={lang}
            />
          )}

          <div className="rounded-2xl border border-stone-200/80 bg-white p-5 sm:p-6 shadow-sm">
            {listing.categoryLabel ? (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8B6914] mb-2">{listing.categoryLabel}</p>
            ) : null}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] leading-tight tracking-tight break-words">
              {listing.title}
            </h1>
            <div className="mt-3 text-2xl sm:text-3xl font-bold text-[#1a1a1a] tabular-nums">
              {formatListingPrice(listing.priceLabel, { lang })}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#111111]/75">
              <span className="font-medium text-[#111111]">{listing.city}</span>
              <span className="text-[#111111]/40" aria-hidden>
                ·
              </span>
              <span>{listing.todayLabel}</span>
            </div>

            {quickFacts.length > 0 && (
              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#111111]/50 mb-2">
                  {lang === "es" ? "Datos clave" : "Quick facts"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickFacts.map((f) => (
                    <span
                      key={`qf-${f.label}-${f.value}`}
                      className="rounded-full border border-[#C9B46A]/30 bg-[#FDF9EE] px-3 py-1.5 text-xs font-semibold text-[#111111]"
                    >
                      <span className="text-[#111111]/60 font-medium">{f.label}:</span> {f.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {featureTags.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#111111]/50 mb-2">
                  {lang === "es" ? "Características" : "Features"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {featureTags.map((f) => (
                    <span
                      key={`ft-${f.label}-${f.value}`}
                      className="rounded-lg border border-stone-200 bg-[#FAFAF8] px-3 py-1.5 text-xs font-medium text-[#111111]/90"
                    >
                      <span className="text-[#111111]/55">{f.label}:</span> {f.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#C9B46A]/35 bg-[#FFFCF5] p-4 sm:p-5 lg:p-6" id="listing-buyer-actions">
            <p className="text-sm text-[#111111]/80 mb-3">{t.buyerActionsHelper}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => showPreviewToast(t.previewToastSave)}
                className="px-5 py-3 rounded-xl font-semibold text-[#111111] border border-black/12 bg-white hover:bg-stone-50 transition shadow-sm"
              >
                {t.guardar}
              </button>
              <button
                type="button"
                onClick={() => showPreviewToast(t.previewToastShare)}
                className="px-5 py-3 rounded-xl font-semibold text-[#111111] border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] transition shadow-sm"
              >
                {t.compartir}
              </button>
              {listing.contactMethod !== "email" && (
                <>
                  <button
                    type="button"
                    onClick={() => showPreviewToast(t.previewToastCall)}
                    className="px-5 py-3 rounded-xl font-semibold text-[#111111] border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] transition shadow-sm"
                  >
                    {t.contactPhoneOnly}
                  </button>
                  <button
                    type="button"
                    onClick={() => showPreviewToast(t.previewToastText)}
                    className="px-5 py-3 rounded-xl font-semibold text-[#111111] border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] transition shadow-sm"
                  >
                    {lang === "es" ? "Texto" : "Text"}
                  </button>
                </>
              )}
              {listing.contactMethod !== "phone" && (
                <button
                  type="button"
                  onClick={() => showPreviewToast(t.previewToastEmail)}
                  className="px-5 py-3 rounded-xl font-semibold text-[#111111] border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] transition shadow-sm"
                >
                  {t.contactEmailOnly}
                </button>
              )}
            </div>
            {previewToast && (
              <div className="mt-3 rounded-xl bg-[#111111] px-4 py-3 text-sm text-[#F5F5F5] shadow-lg" role="status">
                {previewToast}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 lg:p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-[#111111]/60 uppercase tracking-wide mb-2">{t.descripcion}</h3>
            <div className="text-sm text-[#111111] whitespace-pre-wrap leading-relaxed">{listing.description}</div>
          </div>

          <div className={detailCardClass} data-section="seller-profile">
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

          <div className={detailCardClass}>
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
              className="mt-1 w-full max-w-full"
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
  );
}
