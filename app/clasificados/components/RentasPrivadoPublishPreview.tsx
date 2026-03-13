"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import type { ListingData } from "./ListingView";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const RENTAL_FACT_LABELS = new Set([
  "depósito", "deposit", "plazo del contrato", "lease term", "plazo contrato",
  "fecha disponible", "available date", "available", "disponible",
  "amueblado", "furnished", "mascotas", "pets", "mascotas permitidas",
  "estacionamiento", "parking", "servicios incluidos", "utilities included", "utilities",
  "lavandería", "laundry", "fumar", "smoking", "fumar permitido",
  "renta mensual", "monthly rent", "renta",
]);

function normalizeLabel(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function splitRentasDetails(
  detailPairs: Array<{ label: string; value: string }>,
  priceLabel: string,
  lang: "es" | "en"
): { rentalFacts: Array<{ label: string; value: string }>; amenities: Array<{ label: string; value: string }> } {
  const rentalFacts: Array<{ label: string; value: string }> = [];
  if (priceLabel) {
    rentalFacts.push({
      label: lang === "es" ? "Renta mensual" : "Monthly rent",
      value: priceLabel,
    });
  }
  if (Array.isArray(detailPairs)) {
    for (const p of detailPairs) {
      const n = normalizeLabel(p.label);
      if (RENTAL_FACT_LABELS.has(n) || /dep[oó]sito|plazo|disponible|amueblado|mascota|estacionamiento|servicio|lavander[ií]a|fumar|renta/i.test(n)) {
        if (!rentalFacts.some((o) => normalizeLabel(o.label) === n)) rentalFacts.push(p);
      }
    }
  }
  const amenities = Array.isArray(detailPairs)
    ? detailPairs.filter((p) => !RENTAL_FACT_LABELS.has(normalizeLabel(p.label)))
    : [];
  return { rentalFacts, amenities };
}

type MediaSlot = { type: "image"; url: string } | { type: "video"; index: number };

export type RentasPrivadoPublishPreviewProps = {
  listing: ListingData;
  /** When true, CTA buttons show toasts instead of performing actions */
  previewMode?: boolean;
};

export default function RentasPrivadoPublishPreview({
  listing,
  previewMode = true,
}: RentasPrivadoPublishPreviewProps) {
  const lang = listing.lang;
  const [mediaIndex, setMediaIndex] = useState(0);
  const [previewToast, setPreviewToast] = useState<string | null>(null);
  const galleryTouchStartX = useRef(0);

  const showToast = useCallback((msg: string) => {
    if (!previewMode) return;
    setPreviewToast(msg);
    const t = setTimeout(() => setPreviewToast(null), 3000);
    return () => clearTimeout(t);
  }, [previewMode]);

  const images = useMemo(() => {
    const incoming = listing.images ?? [];
    return Array.isArray(incoming) && incoming.length > 0 ? incoming : ["/logo.png"];
  }, [listing.images]);

  const mediaSlots = useMemo((): MediaSlot[] => {
    const slots: MediaSlot[] = [];
    if (images[0]) slots.push({ type: "image", url: images[0] });
    if (listing.proVideoUrl || listing.proVideoThumbUrl) slots.push({ type: "video", index: 0 });
    if (listing.proVideoUrl2 || listing.proVideoThumbUrl2) slots.push({ type: "video", index: 1 });
    images.slice(1).forEach((u) => slots.push({ type: "image", url: u }));
    if (slots.length === 0) slots.push({ type: "image", url: "/logo.png" });
    return slots;
  }, [images, listing.proVideoUrl, listing.proVideoThumbUrl, listing.proVideoUrl2, listing.proVideoThumbUrl2]);

  const { rentalFacts, amenities } = useMemo(
    () => splitRentasDetails(listing.detailPairs ?? [], listing.priceLabel, lang),
    [listing.detailPairs, listing.priceLabel, lang]
  );

  const safeMediaIndex = mediaSlots.length > 0 ? Math.min(mediaIndex, mediaSlots.length - 1) : 0;
  const goPrev = useCallback(() => {
    setMediaIndex((i) => (i <= 0 ? mediaSlots.length - 1 : i - 1));
  }, [mediaSlots.length]);
  const goNext = useCallback(() => {
    setMediaIndex((i) => (i >= mediaSlots.length - 1 ? 0 : i + 1));
  }, [mediaSlots.length]);

  const getVideoUrl = (index: number) => (index === 0 ? listing.proVideoUrl : listing.proVideoUrl2) ?? null;
  const getVideoThumbUrl = (index: number) => (index === 0 ? listing.proVideoThumbUrl : listing.proVideoThumbUrl2) ?? null;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            guardar: "☆ Guardar",
            compartir: "Compartir",
            contactar: "Contactar",
            llamar: "Llamar",
            texto: "Texto",
            email: "Email",
            buyerActionsHelper: "Así podrán contactarte los interesados.",
            rentaMensual: "Renta mensual",
            datosRental: "Datos del rental",
            caracteristicas: "Características y comodidades",
            ubicacion: "Ubicación",
            anunciante: "Anunciante",
            privado: "Privado",
            toastSave: "Vista previa: aquí el usuario guardará el anuncio",
            toastShare: "Vista previa: aquí el usuario compartirá el anuncio",
            toastCall: "Vista previa: aquí podrán llamarte",
            toastText: "Vista previa: aquí podrán enviarte texto",
            toastEmail: "Vista previa: aquí podrán enviarte correo",
          }
        : {
            guardar: "☆ Save",
            compartir: "Share",
            contactar: "Contact",
            llamar: "Call",
            texto: "Text",
            email: "Email",
            buyerActionsHelper: "This is how renters will contact you.",
            rentaMensual: "Monthly rent",
            datosRental: "Rental details",
            caracteristicas: "Features & amenities",
            ubicacion: "Location",
            anunciante: "Advertiser",
            privado: "Private",
            toastSave: "Preview: user would save listing here",
            toastShare: "Preview: user would share listing here",
            toastCall: "Preview: renters would call you here",
            toastText: "Preview: renters would text you here",
            toastEmail: "Preview: renters would email you here",
          },
    [lang]
  );

  const heroUrl = images[0] ?? "/logo.png";
  const quickFacts = useMemo(() => {
    const pairs = listing.detailPairs ?? [];
    const beds = pairs.find((p) => /rec[aá]mara|bedroom|bed/i.test(p.label));
    const baths = pairs.find((p) => /ba[nñ]o|bath/i.test(p.label));
    const sqft = pairs.find((p) => /pies|metros|sqft|sq\s*ft/i.test(p.label));
    const parts = [
      beds?.value,
      baths?.value,
      sqft?.value ? `${sqft.value} ${lang === "es" ? "pies²" : "sq ft"}` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : null;
  }, [listing.detailPairs, lang]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
      {/* Left: mini results card (private listing card preview) */}
      <div className="lg:col-span-3 order-2 lg:order-1">
        <div className="rounded-2xl border border-stone-300/50 bg-white shadow-sm overflow-hidden sticky top-4">
          <div className="aspect-[4/3] w-full overflow-hidden bg-[#E8E8E8]">
            <img
              src={heroUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-3">
            <div className="text-lg font-extrabold text-[#111111]">
              {/\$|\d/.test(listing.priceLabel)
                ? (lang === "es" ? "Renta " : "Rent ") + formatListingPrice(listing.priceLabel, { lang })
                : formatListingPrice(listing.priceLabel, { lang })}
              {/\d/.test(listing.priceLabel) && !/\/\s*mes|\/mes|month/i.test(listing.priceLabel) ? (
                <span className="ml-1 text-sm font-semibold text-[#111111]/70">/ {lang === "es" ? "mes" : "mo"}</span>
              ) : null}
            </div>
            {quickFacts && <div className="mt-1 text-xs text-[#111111]/80">{quickFacts}</div>}
            <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-[#111111] leading-snug">
              {listing.title}
            </h3>
            <div className="mt-1 text-xs text-[#111111]/90">{listing.city}</div>
            <div className="mt-2">
              <span className="text-xs font-medium text-[#111111]/70">{t.privado}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: main private open-ad (hero gallery, summary, facts, description, characteristics) */}
      <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
        <div className="rounded-2xl border border-stone-300/50 bg-white/95 shadow-sm overflow-hidden">
          {/* Hero gallery */}
          <div
            className="relative w-full aspect-[4/3] max-h-[400px] overflow-hidden bg-[#E8E8E8] border-b border-stone-200/80"
            onTouchStart={(e) => { galleryTouchStartX.current = e.touches[0]?.clientX ?? 0; }}
            onTouchEnd={(e) => {
              const endX = e.changedTouches[0]?.clientX ?? 0;
              const dx = endX - galleryTouchStartX.current;
              if (dx > 50) goPrev();
              else if (dx < -50) goNext();
            }}
          >
            {mediaSlots[safeMediaIndex]?.type === "image" ? (
              <img
                src={mediaSlots[safeMediaIndex].url}
                alt=""
                className="w-full h-full object-contain bg-[#0d0d0d]"
              />
            ) : mediaSlots[safeMediaIndex]?.type === "video" ? (
              (() => {
                const idx = mediaSlots[safeMediaIndex].index;
                const src = getVideoUrl(idx);
                const poster = getVideoThumbUrl(idx);
                if (!src && !poster) return null;
                return (
                  <video
                    className="w-full h-full object-contain bg-[#0d0d0d]"
                    controls
                    preload="none"
                    playsInline
                    poster={poster ?? undefined}
                    src={src ?? undefined}
                  />
                );
              })()
            ) : null}
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
          {/* Thumbnail strip */}
          {mediaSlots.length > 1 && (
            <div className="flex gap-2 p-2 bg-white border-t border-stone-200/80 overflow-x-auto">
              {mediaSlots.slice(0, 8).map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMediaIndex(idx)}
                  className={cx(
                    "h-14 w-14 min-w-[3.5rem] shrink-0 rounded-lg overflow-hidden border-2 transition",
                    safeMediaIndex === idx ? "border-stone-400 ring-1 ring-stone-300" : "border-stone-200 hover:border-stone-300"
                  )}
                >
                  {slot.type === "image" ? (
                    <img src={slot.url} alt="" className="w-full h-full object-cover" />
                  ) : getVideoThumbUrl(slot.index) ? (
                    <img src={getVideoThumbUrl(slot.index)!} alt="" className="w-full h-full object-cover opacity-90" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-2xl bg-stone-200">🎥</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary: title, rent, location */}
        <div className="rounded-2xl border border-stone-300/50 bg-white p-5 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] leading-tight">
            {listing.title}
          </h1>
          <div className="mt-3">
            <div className="text-sm font-medium text-[#111111]/80">{t.rentaMensual}</div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#111111]">
              {formatListingPrice(listing.priceLabel, { lang })}
            </div>
          </div>
          <div className="mt-3 text-sm text-[#111111]/90">
            {listing.city} · {listing.todayLabel}
          </div>
        </div>

        {/* Rental facts */}
        {rentalFacts.length > 0 && (
          <div className="rounded-2xl border border-stone-200/80 bg-[#FAFAF9] p-5">
            <h3 className="text-sm font-semibold text-[#111111]">{t.datosRental}</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rentalFacts.map((f) => (
                <div key={f.label} className="rounded-xl border border-stone-200/80 bg-white px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-[#111111]/60">{f.label}</div>
                  <div className="mt-0.5 text-sm font-semibold text-[#111111]">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="rounded-2xl border border-stone-200/80 bg-[#FAFAF9] p-5">
          <div className="text-sm text-[#111111] leading-relaxed whitespace-pre-wrap">
            {listing.description}
          </div>
        </div>

        {/* Characteristics / amenities */}
        {amenities.length > 0 && (
          <div className="rounded-2xl border border-stone-200/80 bg-[#FAFAF9] p-5">
            <h3 className="text-sm font-semibold text-[#111111]">{t.caracteristicas}</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {amenities.map((f) => (
                <div key={f.label} className="rounded-xl border border-stone-200/80 bg-white px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-[#111111]/60">{f.label}</div>
                  <div className="mt-0.5 text-sm font-semibold text-[#111111]">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: lighter contact / CTA column */}
      <div className="lg:col-span-3 order-3 space-y-4">
        <div className="rounded-2xl border border-stone-200/80 bg-[#FAFAF9] p-5 shadow-sm">
          <p className="text-sm text-[#111111]/80 mb-3">{t.buyerActionsHelper}</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => showToast(t.toastSave)}
              className="w-full px-4 py-3 rounded-xl font-semibold text-[#111111] border border-stone-300/60 bg-white hover:bg-stone-50 transition text-sm"
            >
              {t.guardar}
            </button>
            <button
              type="button"
              onClick={() => showToast(t.toastShare)}
              className="w-full px-4 py-3 rounded-xl font-semibold text-[#111111] border border-stone-300/60 bg-white hover:bg-stone-50 transition text-sm"
            >
              {t.compartir}
            </button>
            <span className="text-xs text-[#111111]/60 font-medium pt-1">
              {lang === "es" ? "Contactar" : "Contact"}
            </span>
            {listing.contactMethod !== "email" && (
              <>
                <button
                  type="button"
                  onClick={() => showToast(t.toastCall)}
                  className="w-full px-4 py-3 rounded-xl font-semibold text-[#111111] border border-stone-300/60 bg-white hover:bg-stone-50 transition text-sm"
                >
                  {t.llamar}
                </button>
                <button
                  type="button"
                  onClick={() => showToast(t.toastText)}
                  className="w-full px-4 py-3 rounded-xl font-semibold text-[#111111] border border-stone-300/60 bg-white hover:bg-stone-50 transition text-sm"
                >
                  {t.texto}
                </button>
              </>
            )}
            {listing.contactMethod !== "phone" && (
              <button
                type="button"
                onClick={() => showToast(t.toastEmail)}
                className="w-full px-4 py-3 rounded-xl font-semibold text-[#111111] border border-stone-300/60 bg-white hover:bg-stone-50 transition text-sm"
              >
                {t.email}
              </button>
            )}
          </div>
          {previewMode && previewToast && (
            <div className="mt-3 rounded-xl bg-[#111111] px-4 py-3 text-sm text-[#F5F5F5] shadow-lg" role="status">
              {previewToast}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-[#FAFAF9] p-4">
          <h4 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">{t.anunciante}</h4>
          <p className="text-sm font-medium text-[#111111]">{listing.sellerName?.trim() || (lang === "es" ? "Tú" : "You")}</p>
          <p className="mt-1 text-xs text-[#111111]/70">{t.privado}</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-[#FAFAF9] p-4">
          <h4 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">{t.ubicacion}</h4>
          <p className="text-sm text-[#111111]">{listing.city}</p>
        </div>
      </div>
    </div>
  );
}
