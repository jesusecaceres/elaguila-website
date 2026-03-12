"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import ContactActions from "./ContactActions";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { getRoughDistanceMiles } from "@/app/lib/distance";
import ProBadge from "./ProBadge";
import ProPreviewCard from "./ProPreviewCard";

export type ListingData = {
  title: string;
  priceLabel: string;
  city: string;
  description: string;
  todayLabel: string;
  images: string[];
  detailPairs: Array<{ label: string; value: string }>;
  contactMethod: "phone" | "email" | "both";
  contactPhone: string;
  contactEmail: string;
  isPro: boolean;
  proVideoThumbUrl: string | null;
  proVideoUrl: string | null;
  lang: "es" | "en";
  /** Real seller display name when available; fallback to "Tú" / "You" in preview */
  sellerName?: string | null;
  /** Optional category label for chip (e.g. "En Venta") */
  categoryLabel?: string | null;
};

type MediaSlot = { type: "image"; url: string } | { type: "video" };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type ListingViewProps = {
  listing: ListingData;
  previewMode?: boolean;
};

export default function ListingView({ listing, previewMode = false }: ListingViewProps) {
  const lang = listing.lang;
  const [viewerCityInput, setViewerCityInput] = useState("");
  const [mediaIndex, setMediaIndex] = useState(0);
  const [showProVideo, setShowProVideo] = useState(false);
  const [previewToast, setPreviewToast] = useState<string | null>(null);
  const galleryTouchStartX = useRef(0);

  const showPreviewToast = useCallback((msg: string) => {
    if (!previewMode) return;
    setPreviewToast(msg);
    const t = setTimeout(() => setPreviewToast(null), 3000);
    return () => clearTimeout(t);
  }, [previewMode]);

  // Same ordered media everywhere: hero (image 1), then Pro video (if any), then remaining images. No placeholder unless zero images.
  const images = useMemo(() => {
    const incoming = listing.images ?? [];
    return Array.isArray(incoming) && incoming.length > 0 ? incoming : ["/logo.png"];
  }, [listing.images]);

  const mediaSlots = useMemo((): MediaSlot[] => {
    const slots: MediaSlot[] = [];
    if (images[0]) slots.push({ type: "image", url: images[0] });
    if (listing.isPro && (listing.proVideoUrl || listing.proVideoThumbUrl)) slots.push({ type: "video" });
    images.slice(1).forEach((u) => slots.push({ type: "image", url: u }));
    if (slots.length === 0) slots.push({ type: "image", url: "/logo.png" });
    return slots;
  }, [images, listing.isPro, listing.proVideoUrl, listing.proVideoThumbUrl]);

  const safeMediaIndex = mediaSlots.length > 0 ? Math.min(mediaIndex, mediaSlots.length - 1) : 0;
  const goPrev = useCallback(() => {
    setMediaIndex((i) => (i <= 0 ? mediaSlots.length - 1 : i - 1));
  }, [mediaSlots.length]);
  const goNext = useCallback(() => {
    setMediaIndex((i) => (i >= mediaSlots.length - 1 ? 0 : i + 1));
  }, [mediaSlots.length]);

  const distanceMiles = useMemo(
    () => (viewerCityInput.trim() && listing.city ? getRoughDistanceMiles(viewerCityInput, listing.city) : null),
    [viewerCityInput, listing.city]
  );

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            actionsTitle: "Acciones",
            guardar: "☆ Guardar",
            compartir: "Compartir",
            contactar: "Contactar vendedor",
            contactPhoneOnly: "Llamar",
            contactEmailOnly: "Email",
            contactBoth: "Llamar / Texto / Email",
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
            contactTitle: "Contacto",
            contactBody: "Usa los botones para llamar, enviar mensaje o correo.",
            proVideo: "Video (Pro)",
            tapToPlay: "Toque la miniatura para reproducir. No se reproduce automáticamente.",
            play: "Reproducir",
            details: "Detalles",
            previewToastSave: "Vista previa: aquí el usuario guardará el anuncio",
            previewToastShare: "Vista previa: aquí el usuario compartirá el anuncio",
            previewToastCall: "Vista previa: el comprador podrá llamarte aquí",
            previewToastText: "Vista previa: el comprador podrá enviarte texto aquí",
            previewToastEmail: "Vista previa: el comprador podrá enviarte correo aquí",
            previewToastContact: "Vista previa: contacto —",
          }
        : {
            actionsTitle: "Actions",
            guardar: "☆ Save",
            compartir: "Share",
            contactar: "Contact seller",
            contactPhoneOnly: "Call",
            contactEmailOnly: "Email",
            contactBoth: "Call / Text / Email",
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
            contactTitle: "Contact",
            contactBody: "Use the buttons to call, text, or email.",
            proVideo: "Pro Video",
            tapToPlay: "Tap the thumbnail to play. No autoplay.",
            play: "Play",
            details: "Details",
            previewToastSave: "Preview: user would save listing here",
            previewToastShare: "Preview: user would share listing here",
            previewToastCall: "Preview: buyer would call you here",
            previewToastText: "Preview: buyer would text you here",
            previewToastEmail: "Preview: buyer would email you here",
            previewToastContact: "Preview: contact —",
          },
    [lang]
  );

  const sellerDisplayName = (listing.sellerName ?? "").trim() || t.you;
  const contactCtaLabel =
    listing.contactMethod === "phone"
      ? t.contactPhoneOnly
      : listing.contactMethod === "email"
        ? t.contactEmailOnly
        : t.contactBoth;

  const currentSlot = mediaSlots[safeMediaIndex];
  const hasProVideo = listing.isPro && (listing.proVideoUrl || listing.proVideoThumbUrl);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,28rem)] gap-6 lg:gap-10">
      {/* Left: media dominates — hero fills area, thumbnail rail intentional, minimal gray */}
      <div className="min-w-0 lg:min-w-0">
        <div className="rounded-2xl overflow-hidden bg-[#1a1a1a] shadow-lg">
          {mediaSlots.length > 0 && (
            <div
              className="relative w-full aspect-[4/3] overflow-hidden"
              onTouchStart={(e) => {
                galleryTouchStartX.current = e.touches[0]?.clientX ?? 0;
              }}
              onTouchEnd={(e) => {
                const endX = e.changedTouches[0]?.clientX ?? 0;
                const dx = endX - galleryTouchStartX.current;
                if (dx > 50) goPrev();
                else if (dx < -50) goNext();
              }}
            >
              {currentSlot?.type === "image" ? (
                <img src={currentSlot.url} alt="" className="object-contain w-full h-full bg-[#0d0d0d]" />
              ) : (
                hasProVideo && (
                  <video
                    className="object-contain w-full h-full bg-[#0d0d0d]"
                    controls
                    preload="none"
                    playsInline
                    poster={listing.proVideoThumbUrl ?? undefined}
                    src={listing.proVideoUrl ?? undefined}
                  />
                )
              )}
              {mediaSlots.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xl font-bold shadow-lg"
                    aria-label={lang === "es" ? "Anterior" : "Previous"}
                    onClick={goPrev}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xl font-bold shadow-lg"
                    aria-label={lang === "es" ? "Siguiente" : "Next"}
                    onClick={goNext}
                  >
                    →
                  </button>
                </>
              )}
            </div>
          )}
          {/* Thumbnail rail — clear selected state, premium feel */}
          {mediaSlots.length >= 1 && (
            <div className="flex gap-2 p-3 bg-[#1a1a1a] border-t border-white/10 overflow-x-auto">
              {mediaSlots.slice(0, 8).map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMediaIndex(idx)}
                  className={cx(
                    "h-16 w-16 shrink-0 rounded-lg overflow-hidden flex items-center justify-center border-2 transition",
                    safeMediaIndex === idx
                      ? "border-[#C9B46A] ring-2 ring-[#C9B46A]/40 ring-offset-2 ring-offset-[#1a1a1a]"
                      : "border-white/20 hover:border-white/40 opacity-80 hover:opacity-100"
                  )}
                >
                  {slot.type === "image" ? (
                    <img src={slot.url} alt="" className="object-cover w-full h-full" />
                  ) : listing.proVideoThumbUrl ? (
                    <img src={listing.proVideoThumbUrl} alt="" className="object-cover w-full h-full opacity-90" />
                  ) : (
                    <span className="text-2xl" aria-hidden>🎥</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: info stack — title/price first, then CTA card, then details/desc/seller/location/contact */}
      <div className="min-w-0 space-y-5">
        {/* Card 1: Title, price (dark), city+posted, category chip — no actions */}
        <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#111111] leading-tight tracking-tight">
                {listing.title}
              </h1>
              <div className="mt-3 text-2xl font-bold text-[#111111]">
                {formatListingPrice(listing.priceLabel, { lang })}
              </div>
              <div className="mt-2 text-sm text-[#111111]/80">
                {listing.city} · {listing.todayLabel}
              </div>
            </div>
            {listing.isPro ? <ProBadge /> : null}
          </div>
          {listing.categoryLabel ? (
            <span className="mt-3 inline-block rounded-lg border border-black/10 bg-[#F5F5F5] px-2.5 py-1 text-xs font-medium text-[#111111]/90">
              {listing.categoryLabel}
            </span>
          ) : null}
        </div>

        {/* Card 2: CTA section — Guardar, Compartir, contact (preview = toasts only; no real links) */}
        <div className="rounded-2xl border border-[#C9B46A]/40 bg-[#FAF9F6] p-5 sm:p-6" id="listing-buyer-actions">
          <p className="text-sm text-[#111111]/80 mb-3">{t.buyerActionsHelper}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => previewMode && showPreviewToast(t.previewToastSave)}
              className="px-5 py-3 rounded-xl font-semibold text-[#111111] border border-black/15 bg-white hover:bg-[#F5F5F5] transition shadow-sm"
            >
              {t.guardar}
            </button>
            <button
              type="button"
              onClick={() => previewMode && showPreviewToast(t.previewToastShare)}
              className="px-5 py-3 rounded-xl font-semibold text-[#111111] border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] transition shadow-sm"
            >
              {t.compartir}
            </button>
            {previewMode ? (
              <>
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
              </>
            ) : (
              <ContactActions
                lang={lang}
                phone={listing.contactMethod !== "email" ? listing.contactPhone : undefined}
                text={listing.contactMethod !== "email" ? listing.contactPhone : undefined}
                email={listing.contactMethod !== "phone" ? listing.contactEmail : undefined}
                className="flex flex-wrap gap-3"
              />
            )}
          </div>
          {previewMode && previewToast && (
            <div className="mt-3 rounded-xl bg-[#111111] px-4 py-3 text-sm text-[#F5F5F5] shadow-lg" role="status">
              {previewToast}
            </div>
          )}
        </div>

        {/* Detalles */}
        {listing.detailPairs.length > 0 && (
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-[#111111]/70 uppercase tracking-wide mb-3">{t.details}</h3>
            <div className="space-y-2">
              {listing.detailPairs.map((p) => (
                <div key={p.label} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm">
                  <span className="text-[#111111]/70 shrink-0">{p.label}</span>
                  <span className="font-medium text-[#111111] break-words min-w-0">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Descripción */}
        <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-sm">
          <div className="text-sm text-[#111111] whitespace-pre-wrap leading-relaxed">
            {listing.description}
          </div>
        </div>

        {/* Publicado por */}
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h4 className="text-xs font-semibold text-[#111111]/70 uppercase tracking-wide mb-2">{t.postedBy}</h4>
          <p className="text-base font-medium text-[#111111]">{sellerDisplayName}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#111111]/60">
            <span>⭐ {t.newSeller}</span>
            <span>📅 {t.memberSince} {new Date().getFullYear()}</span>
          </div>
        </div>

        {/* Ubicación */}
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-[#111111]/70 uppercase tracking-wide mb-2">{t.location}</h3>
          <p className="text-sm text-[#111111] mb-2">{t.sellerLocation} {listing.city}</p>
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

        {/* Contacto — live only uses real links; preview uses CTA card above */}
        {!previewMode && (
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-base font-bold text-[#111111]">{t.contactTitle}</div>
            <div className="mt-2 text-[#111111]/80 text-sm">{t.contactBody}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <ContactActions
                lang={lang}
                phone={listing.contactMethod !== "email" ? listing.contactPhone : undefined}
                text={listing.contactMethod !== "email" ? listing.contactPhone : undefined}
                email={listing.contactMethod !== "phone" ? listing.contactEmail : undefined}
                className="flex flex-wrap gap-3"
              />
            </div>
          </div>
        )}

        {/* Pro video standalone when not in gallery */}
        {hasProVideo && mediaSlots.length <= 1 && (
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-[#111111]">{t.proVideo}</div>
            <div className="mt-1 text-xs text-[#111111]/70">{t.tapToPlay}</div>
            <div className="mt-4">
              {listing.proVideoThumbUrl ? (
                <button
                  type="button"
                  onClick={() => setShowProVideo(true)}
                  className="block w-full overflow-hidden rounded-xl border border-black/10"
                >
                  <img src={listing.proVideoThumbUrl} alt="" className="h-auto w-full object-cover opacity-95 hover:opacity-100" />
                </button>
              ) : listing.proVideoUrl ? (
                <video className="w-full rounded-xl border border-black/10" controls preload="none" playsInline poster={listing.proVideoThumbUrl ?? undefined} src={listing.proVideoUrl} />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
