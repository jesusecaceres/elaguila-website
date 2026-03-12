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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: large media gallery only — seller order preserved (hero, video, rest), arrows + thumbnails */}
      <div className="min-w-0">
        <div className="rounded-2xl border border-black/10 bg-[#D9D9D9]/35 backdrop-blur p-6 sm:p-8">
          {mediaSlots.length > 0 && (
            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#E8E8E8]"
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
                <img src={currentSlot.url} alt="" className="object-cover w-full h-full" />
              ) : (
                hasProVideo && (
                  <video
                    className="object-cover w-full h-full"
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-xl font-bold"
                    aria-label={lang === "es" ? "Anterior" : "Previous"}
                    onClick={goPrev}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-xl font-bold"
                    aria-label={lang === "es" ? "Siguiente" : "Next"}
                    onClick={goNext}
                  >
                    →
                  </button>
                </>
              )}
            </div>
          )}
          {mediaSlots.length >= 1 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {mediaSlots.slice(0, 8).map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMediaIndex(idx)}
                  className={cx(
                    "h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 bg-[#E8E8E8] flex items-center justify-center",
                    safeMediaIndex === idx ? "border-[#C9B46A]/60" : "border-black/10"
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

      {/* Right: above fold = title, price, city+posted, category chip, buyer actions; below = detalles, descripción, contacto, publicado por; bottom = Pro card */}
      <div className="min-w-0 space-y-6">
        {/* Title, price, city, chip, actions — marketplace-style above the fold */}
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] leading-tight">
                {listing.title}
              </h1>
              <div className="mt-2 text-xl font-semibold text-[#D4A92A]">
                {formatListingPrice(listing.priceLabel, { lang })}
              </div>
              <div className="mt-2 text-sm text-[#111111]">
                {listing.city} · {listing.todayLabel}
              </div>
            </div>
            {listing.isPro ? <ProBadge /> : null}
          </div>
          {listing.categoryLabel ? (
            <span className="mt-2 inline-block rounded-md border border-black/10 bg-white px-2 py-0.5 text-xs font-medium text-[#111111]/80">
              {listing.categoryLabel}
            </span>
          ) : null}

          {/* Buyer actions row — real method labels; helper copy in preview */}
          <div className="mt-4" id="listing-buyer-actions">
            {previewMode && (
              <p className="text-xs text-[#111111]/70 mb-2">{t.buyerActionsHelper}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => previewMode && showPreviewToast(t.previewToastSave)}
                className="px-4 py-2 rounded-full font-semibold text-sm border border-black/10 bg-[#D9D9D9]/40 text-[#111111] hover:bg-[#D9D9D9]/55 transition"
              >
                {t.guardar}
              </button>
              <button
                type="button"
                onClick={() => previewMode && showPreviewToast(t.previewToastShare)}
                className="px-4 py-2 rounded-full font-semibold text-sm border border-[#C9B46A]/55 bg-[#F5F5F5] text-[#111111] hover:bg-[#D9D9D9]/55 transition"
              >
                {t.compartir}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (previewMode) {
                    const parts = [t.previewToastContact];
                    if (listing.contactPhone) parts.push(`Tel: ${listing.contactPhone}`);
                    if (listing.contactEmail) parts.push(`Email: ${listing.contactEmail}`);
                    showPreviewToast(parts.join(" "));
                  }
                }}
                className="px-4 py-2 rounded-full font-semibold text-sm border border-[#C9B46A]/55 bg-[#F8F6F0] text-[#111111] hover:bg-[#EFE7D8] transition"
              >
                {contactCtaLabel}
              </button>
            </div>
            {/* Toast near CTA region */}
            {previewMode && previewToast && (
              <div className="mt-3 rounded-xl bg-[#111111] px-4 py-2.5 text-sm text-[#F5F5F5] shadow-lg" role="status">
                {previewToast}
              </div>
            )}
          </div>
        </div>

        {/* Detalles */}
        {listing.detailPairs.length > 0 && (
          <div className="rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-4 space-y-2">
            <h3 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide">{t.details}</h3>
            {listing.detailPairs.map((p) => (
              <div key={p.label} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-sm">
                <span className="text-[#111111]/70 shrink-0">{p.label}</span>
                <span className="font-medium text-[#111111] break-words min-w-0">{p.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Descripción */}
        <div className="rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6">
          <div className="text-sm text-[#111111] whitespace-pre-wrap leading-relaxed">
            {listing.description}
          </div>
        </div>

        {/* Contacto */}
        <div className="rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6">
          <div className="text-lg font-bold text-[#111111]">{t.contactTitle}</div>
          <div className="mt-2 text-[#111111] text-sm">{t.contactBody}</div>
          <div className="mt-3 flex flex-wrap gap-3">
            <ContactActions
              lang={lang}
              phone={listing.contactMethod !== "email" ? listing.contactPhone : undefined}
              text={listing.contactMethod !== "email" ? listing.contactPhone : undefined}
              email={listing.contactMethod !== "phone" ? listing.contactEmail : undefined}
              className="flex flex-wrap gap-3"
            />
          </div>
        </div>

        {/* Publicado por — real seller name when available */}
        <div className="rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6">
          <h4 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">{t.postedBy}</h4>
          <p className="text-sm font-medium text-[#111111]">{sellerDisplayName}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#111111]/70">
            <span>⭐ {t.newSeller}</span>
            <span>📅 {t.memberSince} {new Date().getFullYear()}</span>
          </div>
        </div>

        {/* Location / distance */}
        <div className="rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6">
          <h3 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">{t.location}</h3>
          <p className="text-sm text-[#111111] mb-2">{t.sellerLocation} {listing.city}</p>
          <label className="block text-sm text-[#111111]/80 mb-1">{t.distanceLabel}</label>
          <CityAutocomplete
            value={viewerCityInput}
            onChange={setViewerCityInput}
            placeholder={t.cityPlaceholder}
            lang={lang}
            variant="light"
            className="mt-1 w-full max-w-full"
          />
          {distanceMiles !== null && (
            <p className="mt-2 text-sm text-[#111111]/80">
              {t.milesAway} {Math.round(distanceMiles)} {t.miles}
            </p>
          )}
        </div>

        {/* Pro card at bottom — does not interrupt title/price/details flow */}
        {previewMode && (
          <div className="mt-6">
            <ProPreviewCard lang={lang} />
          </div>
        )}

        {/* Pro video standalone when not in gallery */}
        {hasProVideo && mediaSlots.length <= 1 && (
          <div className="rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6">
            <div className="text-sm font-semibold text-[#111111]">{t.proVideo}</div>
            <div className="mt-1 text-xs text-[#111111]/80">{t.tapToPlay}</div>
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
                <video className="w-full rounded-xl border border-[#C9B46A]/55" controls preload="none" playsInline poster={listing.proVideoThumbUrl ?? undefined} src={listing.proVideoUrl} />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
