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

  /** Top pills: short category-like only — recámaras, baños, pies cuadrados. No full rental facts. U.S.-focused: "Pies cuadrados" only, no metros. */
  const shortFactPills = useMemo(() => {
    const pairs = listing.detailPairs ?? [];
    const out: Array<{ label: string; value: string }> = [];
    const beds = pairs.find((p) => /rec[aá]mara|bedroom|bed/i.test(p.label));
    const baths = pairs.find((p) => /ba[nñ]o|bath/i.test(p.label));
    const sqft = pairs.find((p) => /pies|metros|sqft|sq\s*ft/i.test(p.label));
    if (beds?.value) out.push(beds);
    if (baths?.value) out.push(baths);
    if (sqft?.value) {
      out.push({
        label: lang === "es" ? "Pies cuadrados" : "Square feet",
        value: `${sqft.value} ${lang === "es" ? "pies²" : "sq ft"}`,
      });
    }
    return out;
  }, [listing.detailPairs, lang]);

  /** Full rental facts + amenities for right-side characteristics block (checklist-style). */
  const allCharacteristics = useMemo(
    () => [...rentalFacts, ...amenities].filter((f) => f.value?.trim()),
    [rentalFacts, amenities]
  );

  /** Normalize display label for characteristics: U.S. rental — "Pies cuadrados" only, no metros. */
  const displayCharacteristic = useCallback(
    (f: { label: string; value: string }) => {
      const n = normalizeLabel(f.label);
      if (/pies|metros|sqft|sq\s*ft/i.test(n)) {
        const val = f.value.replace(/\s*(metros?|m²|m2)\s*$/i, "").trim();
        return {
          label: lang === "es" ? "Pies cuadrados" : "Square feet",
          value: val ? `${val} ${lang === "es" ? "pies²" : "sq ft"}` : f.value,
        };
      }
      return f;
    },
    [lang]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7">
      {/* Main: ONE unified listing flow — title → price → location → pills → hero → description (expanded width) */}
      <div className="lg:col-span-8">
        <div className="rounded-2xl border border-[#C9B46A]/30 bg-[#FAF8F5] shadow-sm overflow-hidden">
          {/* Top block: title, rent, location, fact pills — single visual unit */}
          <div className="p-5 sm:p-6 pb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] leading-tight tracking-tight">
              {listing.title}
            </h1>
            <div className="mt-3">
              <span className="text-xs font-medium text-[#111111]/70 uppercase tracking-wide">{t.rentaMensual}</span>
              <div className="mt-0.5 text-xl sm:text-2xl font-extrabold text-[#111111]">
                {formatListingPrice(listing.priceLabel, { lang })}
              </div>
            </div>
            <div className="mt-2 text-sm text-[#111111]/85">
              {listing.city} · {listing.todayLabel}
            </div>
            {shortFactPills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {shortFactPills.map((f) => (
                  <span
                    key={`${f.label}-${f.value}`}
                    className="inline-flex items-center rounded-full border border-[#C9B46A]/35 bg-white/80 px-3 py-1.5 text-xs font-medium text-[#111111]"
                  >
                    {f.label}: {f.value}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hero gallery — part of same flow, soft divider */}
          <div
            className="relative w-full aspect-[4/3] max-h-[380px] overflow-hidden bg-[#1a1a1a] border-y border-[#C9B46A]/20"
            onTouchStart={(e) => { galleryTouchStartX.current = e.touches[0]?.clientX ?? 0; }}
            onTouchEnd={(e) => {
              const endX = e.changedTouches[0]?.clientX ?? 0;
              const dx = endX - galleryTouchStartX.current;
              if (dx > 50) goPrev();
              else if (dx < -50) goNext();
            }}
          >
            {mediaSlots[safeMediaIndex]?.type === "image" ? (
              <img src={mediaSlots[safeMediaIndex].url} alt="" className="w-full h-full object-contain bg-[#0d0d0d]" />
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
          {mediaSlots.length > 1 && (
            <div className="flex gap-1.5 p-2 bg-[#F5F2ED] border-b border-[#C9B46A]/15 overflow-x-auto">
              {mediaSlots.slice(0, 8).map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMediaIndex(idx)}
                  className={cx(
                    "h-12 w-12 min-w-[3rem] shrink-0 rounded-lg overflow-hidden border-2 transition",
                    safeMediaIndex === idx
                      ? "border-[#C9B46A]/70 ring-1 ring-[#C9B46A]/30"
                      : "border-[#C9B46A]/20 hover:border-[#C9B46A]/40"
                  )}
                >
                  {slot.type === "image" ? (
                    <img src={slot.url} alt="" className="w-full h-full object-cover" />
                  ) : getVideoThumbUrl(slot.index) ? (
                    <img src={getVideoThumbUrl(slot.index)!} alt="" className="w-full h-full object-cover opacity-90" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-xl bg-[#E8E4DD]">🎥</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Description — section of same flow */}
          <div className="px-5 sm:px-6 py-4">
            <h3 className="text-[11px] font-semibold text-[#111111]/60 uppercase tracking-wide mb-2">
              {lang === "es" ? "Descripción" : "Description"}
            </h3>
            <div className="text-sm text-[#111111] leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </div>
          </div>
        </div>
      </div>

      {/* Right: contact block (with announcer merged) + characteristics block */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-2xl border border-[#C9B46A]/35 bg-[#FDFBF7] p-5 shadow-sm">
          <h4 className="text-sm font-bold text-[#111111] mb-1">
            {lang === "es" ? "Contactar" : "Contact"}
          </h4>
          <p className="text-xs text-[#111111]/75 mb-3">{t.buyerActionsHelper}</p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => showToast(t.toastSave)}
              className="w-full px-4 py-3 rounded-xl font-semibold text-[#111111] border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] transition text-sm flex items-center justify-center gap-2"
            >
              <span aria-hidden className="text-base">☆</span>
              {lang === "es" ? "Guardar" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => showToast(t.toastShare)}
              className="w-full px-4 py-3 rounded-xl font-semibold text-[#111111] border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] transition text-sm flex items-center justify-center gap-2"
            >
              <span aria-hidden className="text-sm">↗</span>
              {lang === "es" ? "Compartir" : "Share"}
            </button>
            {listing.contactMethod !== "email" && (
              <>
                <button
                  type="button"
                  onClick={() => showToast(t.toastCall)}
                  className="w-full px-4 py-3 rounded-xl font-semibold text-[#111111] bg-[#C9B46A]/90 hover:bg-[#C9B46A] transition text-sm shadow-sm flex items-center justify-center gap-2"
                >
                  <span aria-hidden className="text-sm">📞</span>
                  {t.llamar}
                </button>
                <button
                  type="button"
                  onClick={() => showToast(t.toastText)}
                  className="w-full px-4 py-3 rounded-xl font-semibold text-[#111111] border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] transition text-sm flex items-center justify-center gap-2"
                >
                  <span aria-hidden className="text-sm">💬</span>
                  {t.texto}
                </button>
              </>
            )}
            {listing.contactMethod !== "phone" && (
              <button
                type="button"
                onClick={() => showToast(t.toastEmail)}
                className="w-full px-4 py-3 rounded-xl font-semibold text-[#111111] bg-[#C9B46A]/90 hover:bg-[#C9B46A] transition text-sm shadow-sm flex items-center justify-center gap-2"
              >
                <span aria-hidden className="text-sm">✉</span>
                {t.email}
              </button>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-[#C9B46A]/20">
            <p className="text-sm font-semibold text-[#111111]">{listing.sellerName?.trim() || (lang === "es" ? "Tú" : "You")}</p>
            <p className="text-xs text-[#111111]/65 mt-0.5">{t.privado}</p>
          </div>
          {previewMode && previewToast && (
            <div className="mt-3 rounded-xl bg-[#111111] px-4 py-3 text-sm text-[#F5F5F5] shadow-lg" role="status">
              {previewToast}
            </div>
          )}
        </div>

        {/* Right-side characteristics — checklist-style, fuller rental facts + amenities */}
        {allCharacteristics.length > 0 && (
          <div className="rounded-2xl border border-[#C9B46A]/35 bg-[#FDFBF7] p-5 shadow-sm">
            <h4 className="text-sm font-bold text-[#111111] mb-3">
              {lang === "es" ? "Características del lugar" : "Place details"}
            </h4>
            <ul className="space-y-2.5">
              {allCharacteristics.map((f) => {
                const { label, value } = displayCharacteristic(f);
                return (
                  <li key={`${f.label}-${f.value}`} className="flex items-start gap-2.5">
                    <span aria-hidden className="mt-0.5 shrink-0 w-4 h-4 rounded-full border border-[#C9B46A]/50 bg-[#C9B46A]/15 flex items-center justify-center text-[10px] text-[#8B6914]">✓</span>
                    <span className="text-sm text-[#111111]">
                      <span className="font-medium text-[#111111]/85">{label}</span>
                      <span className="text-[#111111]/70"> — </span>
                      <span className="font-semibold text-[#111111]">{value}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
