"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { getPreviewDraft } from "@/app/lib/previewListingDraft";
import { getRoughDistanceMiles } from "@/app/lib/distance";
import { formatListingPrice } from "@/app/lib/formatListingPrice";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getRoughDistanceLabel(viewerCity: string, listingCity: string, lang: "es" | "en"): string {
  const miles = getRoughDistanceMiles(viewerCity, listingCity);
  if (miles === null) {
    return lang === "es"
      ? "Agrega una ciudad reconocida para estimar distancia"
      : "Enter a recognized city to estimate distance";
  }
  return lang === "es"
    ? `Aproximadamente a ${Math.round(miles)} millas de ti`
    : `Approximately ${Math.round(miles)} miles from you`;
}

export default function PreviewListingPage() {
  const searchParams = useSearchParams();
  const lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const [draft, setDraft] = useState<ReturnType<typeof getPreviewDraft>>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [viewerCityInput, setViewerCityInput] = useState("");
  const [showProVideo, setShowProVideo] = useState(false);
  const galleryTouchStartX = useRef(0);

  useEffect(() => {
    setDraft(getPreviewDraft());
  }, []);

  const images = useMemo(() => draft?.imageUrls ?? [], [draft?.imageUrls]);
  const coverImage = images[0] ?? null;
  const activeImage = images[activeImageIndex] ?? coverImage;

  const viewerDistanceMiles = useMemo(
    () => (draft ? getRoughDistanceMiles(viewerCityInput, draft.city) : null),
    [draft, viewerCityInput]
  );
  const viewerDistanceLabel = useMemo(
    () => (draft ? getRoughDistanceLabel(viewerCityInput, draft.city, draft.lang) : ""),
    [draft, viewerCityInput]
  );

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            backToEdit: "Volver a editar",
            noPreview: "No hay vista previa disponible.",
            goToClassifieds: "Ir a Clasificados",
            details: "Detalles",
            description: "Descripción",
            contact: "Contacto",
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
            mainPhotoHere: "Tu foto principal aparecerá aquí",
            noDescription: "Sin descripción",
            noPrice: "Sin precio",
            free: "Gratis",
            city: "Ciudad",
            phoneOrEmailNotShown: "Teléfono o email (no mostrado)",
            prev: "Anterior",
            next: "Siguiente",
            play: "Reproducir",
            proVideo: "Video (Pro)",
            tapToPlay: "Toque la miniatura para reproducir. No se reproduce automáticamente.",
          }
        : {
            backToEdit: "Back to edit",
            noPreview: "No preview available.",
            goToClassifieds: "Go to Classifieds",
            details: "Details",
            description: "Description",
            contact: "Contact",
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
            mainPhotoHere: "Your main photo will appear here",
            noDescription: "No description",
            noPrice: "No price",
            free: "Free",
            city: "City",
            phoneOrEmailNotShown: "Phone or email (not shown)",
            prev: "Previous",
            next: "Next",
            play: "Play",
            proVideo: "Pro Video",
            tapToPlay: "Tap the thumbnail to play. No autoplay.",
          },
    [lang]
  );

  if (!draft) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] text-[#111111]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-28 pb-16 text-center">
          <p className="text-lg text-[#111111]/80">{t.noPreview}</p>
          <Link
            href={`/clasificados?lang=${lang}`}
            className="mt-4 inline-block rounded-xl bg-[#C9B46A] text-[#111111] font-semibold px-5 py-2.5 hover:opacity-90"
          >
            {t.goToClassifieds}
          </Link>
        </div>
      </main>
    );
  }

  const L = draft.lang;
  const title = draft.title.trim() || (L === "es" ? "(Sin título)" : "(No title)");
  const description = draft.description.trim() || (L === "es" ? t.noDescription : "No description");
  const price = !draft.price.trim() && !draft.isFree
    ? (L === "es" ? t.noPrice : "No price")
    : formatListingPrice(draft.price, { lang: L, isFree: draft.isFree });
  const city = draft.city.trim() || (L === "es" ? t.city : "City");
  const showPhone = (draft.contactMethod === "phone" || draft.contactMethod === "both") && draft.contactPhone;
  const showEmail = (draft.contactMethod === "email" || draft.contactMethod === "both") && draft.contactEmail;

  const backUrl = draft.backToEditUrl || `/clasificados/publicar/${draft.category}?lang=${draft.lang}`;

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111]">
      <Navbar />
      {/* Back to edit bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 border-b border-black/10 bg-[#F5F5F5] shadow-sm">
        <Link
          href={backUrl}
          className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] transition"
        >
          ← {t.backToEdit}
        </Link>
        <span className="text-xs text-[#111111]/50">
          {L === "es" ? "Vista previa (como la verán los compradores)" : "Preview (as buyers will see it)"}
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,340px)] gap-8">
          {/* Left: image gallery + content */}
          <div>
            {/* Gallery */}
            <div
              className="relative rounded-xl border border-black/10 overflow-hidden bg-[#E8E8E8] max-h-[min(50vh,380px)] min-h-[200px] flex items-center justify-center"
              onTouchStart={(e) => {
                galleryTouchStartX.current = e.touches[0]?.clientX ?? 0;
              }}
              onTouchEnd={(e) => {
                const endX = e.changedTouches[0]?.clientX ?? 0;
                const dx = endX - galleryTouchStartX.current;
                if (images.length <= 1) return;
                if (dx > 50) setActiveImageIndex((i) => (i - 1 + images.length) % images.length);
                else if (dx < -50) setActiveImageIndex((i) => (i + 1) % images.length);
              }}
            >
              {activeImage ? (
                <img
                  src={activeImage}
                  alt=""
                  className="max-h-full max-w-full w-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center text-[#111111]/50 text-sm px-4 text-center min-h-[200px]">
                  {t.mainPhotoHere}
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-xl font-bold"
                    aria-label={t.prev}
                    onClick={() => setActiveImageIndex((i) => (i - 1 + images.length) % images.length)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-xl font-bold"
                    aria-label={t.next}
                    onClick={() => setActiveImageIndex((i) => (i + 1) % images.length)}
                  >
                    →
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {images.slice(0, 5).map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={cx(
                      "h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 bg-[#E8E8E8] flex items-center justify-center",
                      activeImageIndex === idx ? "border-[#C9B46A]/60" : "border-black/10"
                    )}
                  >
                    <img src={src} alt="" className="max-h-full max-w-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Pro video */}
            {draft.isPro && (draft.proVideoUrl || draft.proVideoThumbUrl) && (
              <div className="mt-6 rounded-xl border border-black/10 bg-[#F5F5F5] p-4">
                <div className="text-sm font-semibold text-[#111111]">{t.proVideo}</div>
                <div className="mt-1 text-xs text-[#111111]/80">{t.tapToPlay}</div>
                <div className="mt-3">
                  {!showProVideo && draft.proVideoThumbUrl ? (
                    <button
                      type="button"
                      onClick={() => setShowProVideo(true)}
                      className="block w-full rounded-xl overflow-hidden border border-black/10"
                    >
                      <img
                        src={draft.proVideoThumbUrl}
                        alt=""
                        className="w-full aspect-video object-cover"
                      />
                    </button>
                  ) : draft.proVideoUrl ? (
                    <video
                      className="w-full rounded-xl border border-black/10 bg-black"
                      controls
                      preload="none"
                      playsInline
                      poster={draft.proVideoThumbUrl || undefined}
                      src={draft.proVideoUrl}
                    />
                  ) : null}
                </div>
              </div>
            )}

            {/* Title, price, meta */}
            <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-0">
              <span className="text-2xl font-extrabold text-[#111111]">{price}</span>
              <span className="text-[#111111]/40">·</span>
              <span className="text-sm text-[#111111]/80">{city}</span>
              <span className="text-[#111111]/40">·</span>
              <span className="text-xs text-[#111111]/60">{draft.todayLabel}</span>
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold text-[#111111] leading-tight">{title}</h1>

            {/* Description */}
            <div className="mt-6 rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6">
              <div className="text-sm text-[#111111] whitespace-pre-wrap leading-relaxed">
                {description}
              </div>
            </div>
          </div>

          {/* Right: details, contact, location */}
          <div className="space-y-4">
            {/* Details */}
            {draft.detailPairs.length > 0 && (
              <div className="rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-5">
                <h3 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-3">
                  {t.details}
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {draft.detailPairs.map((p) => (
                    <div key={p.label}>
                      <span className="text-[#111111]/55">{p.label}</span>
                      <span className="ml-1 font-medium text-[#111111]">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div
              id="preview-contact-section"
              className="rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6 scroll-mt-4"
            >
              <h3 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">
                {t.contact}
              </h3>
              <div className="text-sm text-[#111111] space-y-1">
                {showPhone && <p>{draft.contactPhone}</p>}
                {showEmail && <p>{draft.contactEmail}</p>}
                {!showPhone && !showEmail && (
                  <p className="text-[#111111]/50">{t.phoneOrEmailNotShown}</p>
                )}
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
                {t.sellerLocation} {city}
              </p>
              <label className="block text-sm text-[#111111]/80 mb-1">{t.distanceLabel}</label>
              <CityAutocomplete
                value={viewerCityInput}
                onChange={setViewerCityInput}
                placeholder={t.cityPlaceholder}
                lang={draft.lang}
                variant="light"
                className="mt-1"
              />
              {viewerDistanceMiles !== null && (
                <p className="mt-2 text-sm text-[#111111]/80">
                  {t.milesAway} {Math.round(viewerDistanceMiles)} {t.miles}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
