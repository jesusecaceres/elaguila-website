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
  const galleryTouchStartX = useRef(0);

  const mediaSlots = useMemo((): MediaSlot[] => {
    const urls = listing.images ?? [];
    const slots: MediaSlot[] = [];
    if (urls[0]) slots.push({ type: "image", url: urls[0] });
    if (listing.isPro && (listing.proVideoUrl || listing.proVideoThumbUrl)) slots.push({ type: "video" });
    urls.slice(1).forEach((u) => slots.push({ type: "image", url: u }));
    if (slots.length === 0) slots.push({ type: "image", url: "/logo.png" });
    return slots;
  }, [listing.images, listing.isPro, listing.proVideoUrl, listing.proVideoThumbUrl]);

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
          }
        : {
            actionsTitle: "Actions",
            guardar: "☆ Save",
            compartir: "Share",
            contactar: "Contact seller",
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
          },
    [lang]
  );

  const currentSlot = mediaSlots[safeMediaIndex];
  const hasProVideo = listing.isPro && (listing.proVideoUrl || listing.proVideoThumbUrl);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left column */}
      <div className="min-w-0">
        <div className="rounded-2xl border border-black/10 bg-[#D9D9D9]/35 backdrop-blur p-6 sm:p-8">
          {/* Gallery — aspect 4/3, object-cover */}
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
                <img
                  src={currentSlot.url}
                  alt=""
                  className="object-cover w-full h-full"
                />
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

          {/* Thumbnail strip */}
          {listing.images.length >= 1 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {listing.images.slice(0, 8).map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMediaIndex(idx)}
                  className={cx(
                    "h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 bg-[#E8E8E8] flex items-center justify-center",
                    mediaIndex === idx ? "border-[#C9B46A]/60" : "border-black/10"
                  )}
                >
                  <img src={src} alt="" className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}

          {/* Title, Price, Location */}
          <div className="flex items-start justify-between gap-4 mt-6">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-[#111111] leading-tight">
                {listing.title}
              </h1>
              <div className="mt-3 text-2xl font-semibold text-[#D4A92A]">
                {formatListingPrice(listing.priceLabel, { lang })}
              </div>
              <div className="mt-4 text-[#111111]">
                {listing.city} • {listing.todayLabel}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              {listing.isPro ? <ProBadge /> : null}
            </div>
          </div>

          {/* ProPreviewCard — only in preview mode, under Title/Price/Location */}
          {previewMode && (
            <div className="mt-6">
              <ProPreviewCard lang={lang} />
            </div>
          )}

          {/* Details card — rounded-xl border p-4 space-y-2 */}
          {listing.detailPairs.length > 0 && (
            <div className="mt-6 rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-4 space-y-2">
              <h3 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide">
                {t.details}
              </h3>
              {listing.detailPairs.map((p) => (
                <div key={p.label} className="flex justify-between gap-2 text-sm">
                  <span className="text-[#111111]/70">{p.label}</span>
                  <span className="font-medium text-[#111111]">{p.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="mt-6 rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6">
            <div className="text-sm text-[#111111] whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </div>
          </div>

          {/* Pro video (standalone when not in gallery) */}
          {hasProVideo && mediaSlots.length <= 1 && (
            <div className="mt-6 rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#111111]">{t.proVideo}</div>
                  <div className="mt-1 text-xs text-[#111111]/80">{t.tapToPlay}</div>
                </div>
                {!showProVideo && (
                  <button
                    type="button"
                    onClick={() => setShowProVideo(true)}
                    className="rounded-full border border-[#C9B46A]/70 bg-[#F2EFE8] px-4 py-2 text-xs font-semibold text-[#111111]"
                  >
                    {t.play}
                  </button>
                )}
              </div>
              <div className="mt-4">
                {!showProVideo && listing.proVideoThumbUrl ? (
                  <button
                    type="button"
                    onClick={() => setShowProVideo(true)}
                    className="block w-full overflow-hidden rounded-xl border border-black/10"
                  >
                    <img
                      src={listing.proVideoThumbUrl}
                      alt=""
                      className="h-auto w-full object-cover opacity-95 hover:opacity-100"
                    />
                  </button>
                ) : listing.proVideoUrl ? (
                  <video
                    className="w-full rounded-xl border border-[#C9B46A]/55"
                    controls
                    preload="none"
                    playsInline
                    poster={listing.proVideoThumbUrl ?? undefined}
                    src={listing.proVideoUrl}
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right column — actions, seller, location, contact */}
      <div className="min-w-0 space-y-6">
        {/* Action buttons — disabled in preview */}
        <div className="rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6">
          <div className="text-xl font-bold text-[#111111]">{t.actionsTitle}</div>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              disabled={previewMode}
              className={cx(
                "w-full px-5 py-3 rounded-full font-semibold transition border",
                previewMode
                  ? "border-black/10 bg-[#E8E8E8] text-[#111111]/60 cursor-not-allowed"
                  : "border-black/10 bg-[#D9D9D9]/40 text-[#111111] hover:bg-[#D9D9D9]/55"
              )}
            >
              {t.guardar}
            </button>
            <button
              type="button"
              disabled={previewMode}
              className={cx(
                "w-full px-5 py-3 rounded-full font-semibold transition border",
                previewMode
                  ? "border-black/10 bg-[#E8E8E8] text-[#111111]/60 cursor-not-allowed"
                  : "border-[#C9B46A]/55 bg-[#F5F5F5] text-[#111111] hover:bg-[#D9D9D9]/55"
              )}
            >
              {t.compartir}
            </button>
            <button
              type="button"
              disabled={previewMode}
              className={cx(
                "w-full px-5 py-3 rounded-full font-semibold transition border",
                previewMode
                  ? "border-black/10 bg-[#E8E8E8] text-[#111111]/60 cursor-not-allowed"
                  : "border-[#C9B46A]/55 bg-[#F5F5F5] text-[#111111] hover:bg-[#D9D9D9]/55"
              )}
            >
              {t.contactar}
            </button>
          </div>
        </div>

        {/* Seller card */}
        <div className="rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6">
          <h4 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">
            {t.postedBy}
          </h4>
          <p className="text-sm font-medium text-[#111111]">{t.you}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#111111]/70">
            <span>⭐ {t.newSeller}</span>
            <span>📅 {t.memberSince} {new Date().getFullYear()}</span>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6">
          <h3 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">
            {t.location}
          </h3>
          <p className="text-sm text-[#111111] mb-2">
            {t.sellerLocation} {listing.city}
          </p>
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

        {/* Contact — single section, Llamar / Texto / Correo, flex flex-wrap gap-3 */}
        <div className="rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6">
          <div className="text-xl font-bold text-[#111111]">{t.contactTitle}</div>
          <div className="mt-3 text-[#111111] text-sm">{t.contactBody}</div>
          <div className="mt-4 flex flex-wrap gap-3" id="contact-actions">
            <ContactActions
              lang={lang}
              phone={listing.contactMethod !== "email" ? listing.contactPhone : undefined}
              text={listing.contactMethod !== "email" ? listing.contactPhone : undefined}
              email={listing.contactMethod !== "phone" ? listing.contactEmail : undefined}
              className="flex flex-wrap gap-3"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
