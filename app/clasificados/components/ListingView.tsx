"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ContactActions from "./ContactActions";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { getRoughDistanceMiles } from "@/app/lib/distance";
import ProBadge from "./ProBadge";

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
  /** Second Pro video (2 videos sobresalientes). */
  proVideoUrl2?: string | null;
  proVideoThumbUrl2?: string | null;
  lang: "es" | "en";
  /** Real seller display name when available; fallback to "Tú" / "You" in preview */
  sellerName?: string | null;
  /** Optional category label for chip (e.g. "En Venta") */
  categoryLabel?: string | null;
};

type MediaSlot =
  | { type: "image"; url: string }
  | { type: "video"; index: number }
  | { type: "locked-image" }
  | { type: "locked-video" };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Pro comparison: benefit id passed from parent to highlight the matching UI element. Only real Pro-only benefits. */
export type ProHighlightId =
  | "more-photos"
  | "pro-video"
  | "visibility-boosts"
  | "pro-badge"
  | "analytics"
  | "duration";

export type ListingViewProps = {
  listing: ListingData;
  /** Seller preview (toasts, no real actions). */
  previewMode?: boolean;
  /** When true, render this same listing as if upgraded to Pro (badge, boost, benefits block). Preview-only; does not change data. */
  previewProUpgrade?: boolean;
  /** Pro comparison: which benefit to highlight in the preview (clickable list). */
  proHighlight?: ProHighlightId | string | null;
  /** Called when user clicks a benefit in the Pro list; parent can set proHighlight to scroll/highlight. */
  onProBenefitClick?: (id: ProHighlightId) => void;
  /** When true, do not render Pro comparison UI (analytics block, benefits panel). Use for Rentas Privado (Pro-only, no upgrade framing). */
  hideProComparisonUI?: boolean;
};

export default function ListingView({
  listing,
  previewMode = false,
  previewProUpgrade = false,
  proHighlight = null,
  onProBenefitClick,
  hideProComparisonUI = false,
}: ListingViewProps) {
  const effectiveIsPro = listing.isPro || previewProUpgrade;
  const lang = listing.lang;
  const [viewerCityInput, setViewerCityInput] = useState("");
  const [mediaIndex, setMediaIndex] = useState(0);
  const [showProVideo, setShowProVideo] = useState(false);
  const [previewToast, setPreviewToast] = useState<string | null>(null);
  const galleryTouchStartX = useRef(0);
  const highlightRefs = useRef<Record<string, HTMLElement | null>>({});

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
    if (effectiveIsPro && (listing.proVideoUrl || listing.proVideoThumbUrl)) slots.push({ type: "video", index: 0 });
    if (effectiveIsPro && (listing.proVideoUrl2 || listing.proVideoThumbUrl2)) slots.push({ type: "video", index: 1 });
    images.slice(1).forEach((u) => slots.push({ type: "image", url: u }));
    // Free preview: show locked Pro slots (2 videos sobresalientes = 2 locked-video slots).
    if (previewMode && !effectiveIsPro) {
      const extraPhotoSlots = Math.min(2, Math.max(0, 12 - slots.length));
      for (let i = 0; i < extraPhotoSlots; i++) slots.push({ type: "locked-image" });
      slots.push({ type: "locked-video" });
      slots.push({ type: "locked-video" });
    }
    // Pro preview: second slot as locked if only one video uploaded.
    if (previewMode && effectiveIsPro) {
      const videoCount = slots.filter((s) => s.type === "video").length;
      if (videoCount < 2) slots.push({ type: "locked-video" });
    }
    if (slots.length === 0) slots.push({ type: "image", url: "/logo.png" });
    return slots;
  }, [images, effectiveIsPro, listing.proVideoUrl, listing.proVideoThumbUrl, listing.proVideoUrl2, listing.proVideoThumbUrl2, previewMode]);

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
            previewToastCall: "Vista previa: aquí el comprador podrá llamarte",
            previewToastText: "Vista previa: aquí el comprador podrá enviarte texto",
            previewToastEmail: "Vista previa: aquí el comprador podrá enviarte correo",
            previewToastContact: "Vista previa: contacto —",
            memberLabel: "Miembro",
            responsePlaceholder: "Respuesta: —",
            verifiedPlaceholder: "Verificado (próximamente)",
            sellerProCue: "Con Pro tu perfil tiene mayor visibilidad.",
            trustSignalsTitle: "Señales de confianza",
            quickResponseLabel: "Respuesta rápida",
            verifiedSellerLabel: "Vendedor verificado",
            comingSoon: "próximamente",
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
            memberLabel: "Member",
            responsePlaceholder: "Response: —",
            verifiedPlaceholder: "Verified (coming soon)",
            sellerProCue: "With Pro your profile gets more visibility.",
            trustSignalsTitle: "Trust signals",
            quickResponseLabel: "Quick response",
            verifiedSellerLabel: "Verified seller",
            comingSoon: "coming soon",
          },
    [lang]
  );

  const sellerDisplayName = (listing.sellerName ?? "").trim() || t.you;

  /** Reusable detail card style for right column — category-agnostic; same pattern for seller, trust, location, etc. */
  const detailCardClass = "rounded-2xl border border-black/10 bg-white p-4 sm:p-5 shadow-sm";

  const contactCtaLabel =
    listing.contactMethod === "phone"
      ? t.contactPhoneOnly
      : listing.contactMethod === "email"
        ? t.contactEmailOnly
        : t.contactBoth;

  const currentSlot = mediaSlots[safeMediaIndex];
  const hasProVideo = effectiveIsPro && (listing.proVideoUrl || listing.proVideoThumbUrl || listing.proVideoUrl2 || listing.proVideoThumbUrl2);
  const getVideoUrl = (index: number) => (index === 0 ? listing.proVideoUrl : listing.proVideoUrl2) ?? null;
  const getVideoThumbUrl = (index: number) => (index === 0 ? listing.proVideoThumbUrl : listing.proVideoThumbUrl2) ?? null;

  const setHighlightRef = useCallback((id: string, el: HTMLElement | null) => {
    highlightRefs.current[id] = el;
  }, []);

  useEffect(() => {
    if (!proHighlight) return;
    const el = highlightRefs.current[proHighlight];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [proHighlight]);

  const highlightClass = "ring-2 ring-amber-400 ring-offset-2 ring-offset-[#D9D9D9] transition";
  const isHighlight = (id: string) => proHighlight === id;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,28rem)] gap-4 sm:gap-6 lg:gap-10">
      {/* Left: media — Pro gets premium framing; free layout unchanged. Reusable across categories. */}
      <div className="min-w-0 lg:min-w-0 order-1">
        <div
          className={cx(
            "rounded-2xl overflow-hidden bg-[#1a1a1a]",
            hideProComparisonUI ? "shadow-lg border border-stone-300/40" : effectiveIsPro ? "shadow-xl ring-2 ring-[#C9B46A]/25 ring-offset-2 ring-offset-[#D9D9D9]" : "shadow-lg"
          )}
        >
          {mediaSlots.length > 0 && (
            <div
              ref={(el) => setHighlightRef("pro-video", el)}
              data-pro-highlight="pro-video"
              className={cx("relative w-full aspect-[4/3] overflow-hidden", isHighlight("pro-video") && highlightClass)}
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
              ) : currentSlot?.type === "locked-image" || currentSlot?.type === "locked-video" ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#1f1f1f] to-[#151515] border border-[#C9B46A]/40 rounded-xl p-6 sm:p-8">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B46A]/50 bg-[#C9B46A]/15 px-3 py-1 text-xs font-semibold text-[#C9B46A]">
                    Pro
                  </span>
                  <span className="text-5xl sm:text-6xl opacity-90" aria-hidden>{currentSlot.type === "locked-video" ? "🎥" : "🖼️"}</span>
                  <span className="text-base font-semibold text-white/95">
                    {currentSlot.type === "locked-video"
                      ? (lang === "es" ? "Video sobresaliente" : "Featured video")
                      : (lang === "es" ? "Más fotos" : "More photos")}
                  </span>
                  <span className="text-sm text-white/60">
                    {currentSlot.type === "locked-video"
                      ? (lang === "es" ? "Disponible con Pro" : "Available with Pro")
                      : (lang === "es" ? "Hasta 12 fotos con Pro" : "Up to 12 photos with Pro")}
                  </span>
                </div>
              ) : (
                currentSlot?.type === "video" && (
                  (() => {
                    const idx = currentSlot.index;
                    const src = getVideoUrl(idx);
                    const poster = getVideoThumbUrl(idx);
                    if (!src && !poster) return null;
                    return (
                      <div className="relative w-full h-full">
                        <video
                          className="object-contain w-full h-full bg-[#0d0d0d]"
                          controls
                          preload="none"
                          playsInline
                          poster={poster ?? undefined}
                          src={src ?? undefined}
                        />
                        <span
                          className="absolute bottom-3 left-3 inline-flex items-center rounded-lg border border-[#C9B46A]/40 bg-black/60 px-2.5 py-1 text-xs font-semibold text-[#C9B46A] backdrop-blur-sm"
                          aria-hidden
                        >
                          {lang === "es" ? "Video sobresaliente" : "Featured video"}
                        </span>
                      </div>
                    );
                  })()
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
          {/* Thumbnail rail — Pro: premium border; locked slots more valuable; good tap targets on mobile */}
          {mediaSlots.length >= 1 && (
            <div
              ref={(el) => setHighlightRef("more-photos", el)}
              data-pro-highlight="more-photos"
              className={cx(
                "flex gap-2 p-3 sm:p-3.5 bg-[#1a1a1a] overflow-x-auto",
                hideProComparisonUI ? "border-t border-white/10" : effectiveIsPro ? "border-t border-[#C9B46A]/25" : "border-t border-white/10",
                isHighlight("more-photos") && highlightClass
              )}
            >
              {mediaSlots.slice(0, 8).map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMediaIndex(idx)}
                  className={cx(
                    "h-16 w-16 min-w-[4rem] shrink-0 rounded-lg overflow-hidden flex items-center justify-center border-2 transition",
                    safeMediaIndex === idx
                      ? "border-[#C9B46A] ring-2 ring-[#C9B46A]/40 ring-offset-2 ring-offset-[#1a1a1a]"
                      : "border-white/20 hover:border-white/40 opacity-80 hover:opacity-100"
                  )}
                >
                  {slot.type === "image" ? (
                    <img src={slot.url} alt="" className="object-cover w-full h-full" />
                  ) : slot.type === "locked-image" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] border-0 rounded-lg gap-0.5">
                      <span className="text-xl" aria-hidden>🖼️</span>
                      <span className="text-[10px] font-semibold text-[#C9B46A] uppercase tracking-wide">Pro</span>
                    </div>
                  ) : slot.type === "locked-video" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f] border-0 rounded-lg gap-0.5">
                      <span className="text-xl" aria-hidden>🎥</span>
                      <span className="text-[10px] font-semibold text-[#C9B46A] uppercase tracking-wide">Pro</span>
                    </div>
                  ) : slot.type === "video" ? (
                    getVideoThumbUrl(slot.index) ? (
                      <img src={getVideoThumbUrl(slot.index)!} alt="" className="object-cover w-full h-full opacity-90" />
                    ) : (
                      <span className="text-2xl" aria-hidden>🎥</span>
                    )
                  ) : (
                    <span className="text-2xl" aria-hidden>🎥</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pro preview only: analytics block — preview-only; not part of published ad. Hidden for Rentas Privado (no comparison). */}
        {previewProUpgrade && !hideProComparisonUI && (
          <div
            ref={(el) => setHighlightRef("analytics", el)}
            data-pro-highlight="analytics"
            className={cx(
              "mt-4 rounded-2xl border border-[#C9B46A]/30 bg-[#252525] p-4 sm:p-5 shadow-sm",
              isHighlight("analytics") && highlightClass
            )}
          >
            <h3 className="text-xs font-semibold text-[#C9B46A] uppercase tracking-wide mb-3">
              {lang === "es" ? "Analíticas del anuncio (Pro)" : "Listing analytics (Pro)"}
            </h3>
            <p className="text-xs text-white/60 mb-3">
              {lang === "es" ? "Señales para entender si tu anuncio está funcionando." : "Signals to see how your listing is performing."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#1a1a1a] border border-white/10 p-3">
                <p className="text-[10px] uppercase tracking-wide text-white/50 mb-1">{lang === "es" ? "Vistas" : "Views"}</p>
                <p className="text-lg font-bold text-white">—</p>
                <p className="text-[10px] text-white/40 mt-0.5">{lang === "es" ? "vistas del anuncio" : "listing views"}</p>
              </div>
              <div className="rounded-xl bg-[#1a1a1a] border border-white/10 p-3">
                <p className="text-[10px] uppercase tracking-wide text-white/50 mb-1">{lang === "es" ? "Guardados" : "Saves"}</p>
                <p className="text-lg font-bold text-white">—</p>
                <p className="text-[10px] text-white/40 mt-0.5">{lang === "es" ? "guardados / compartidos" : "saves / shares"}</p>
              </div>
              <div className="rounded-xl bg-[#1a1a1a] border border-white/10 p-3">
                <p className="text-[10px] uppercase tracking-wide text-white/50 mb-1">{lang === "es" ? "Rendimiento" : "Performance"}</p>
                <p className="text-lg font-bold text-white">—</p>
                <p className="text-[10px] text-white/40 mt-0.5">{lang === "es" ? "seguimiento del rendimiento" : "performance tracking"}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: info stack — title/price/meta first, then CTA, then description/seller/location. Mobile: stacked; lg: right rail. */}
      <div className="min-w-0 space-y-4 sm:space-y-5 order-2">
        {/* Card 1: Title, price, meta. Pro: premium accent; spacing so title and badge don't collide. */}
        <div
          className={cx(
            "rounded-2xl border p-4 sm:p-5 lg:p-6 shadow-sm",
            hideProComparisonUI ? "border-stone-300/50 bg-white" : effectiveIsPro ? "border-[#C9B46A]/30 border-l-4 border-l-[#C9B46A]/50 bg-[#FAFAF9]" : "border-black/10 bg-white"
          )}
        >
          <div className="flex flex-wrap items-start gap-x-3 gap-y-3">
            <div className="min-w-0 flex-1 basis-full sm:basis-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#111111] leading-tight tracking-tight break-words">
                {listing.title}
              </h1>
              <div className="mt-3 text-xl sm:text-2xl font-bold text-[#1a1a1a]">
                {formatListingPrice(listing.priceLabel, { lang })}
              </div>
              <div className="mt-2 text-sm text-[#111111]/80">
                {listing.city} · {listing.todayLabel}
              </div>
              {(() => {
                const pairs = listing.detailPairs ?? [];
                const conditionPair = pairs.find((p) => /condición|condition/i.test(p.label));
                const others = pairs.filter((p) => p !== conditionPair && p.value?.trim());
                const metaLine1 = [listing.categoryLabel, ...others.map((p) => p.value)].filter(Boolean).join(" · ");
                const metaLine2 = conditionPair?.value ? (lang === "es" ? `Condición: ${conditionPair.value}` : `Condition: ${conditionPair.value}`) : "";
                if (!metaLine1 && !metaLine2) return null;
                return (
                  <div className="mt-3 space-y-0.5">
                    {metaLine1 ? <p className="text-xs text-[#111111]/70">{metaLine1}</p> : null}
                    {metaLine2 ? <p className="text-xs text-[#111111]/70">{metaLine2}</p> : null}
                  </div>
                );
              })()}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0 sm:ml-auto">
              {effectiveIsPro && !hideProComparisonUI ? (
                <span ref={(el) => setHighlightRef("pro-badge", el)} data-pro-highlight="pro-badge" className={cx("inline-flex", isHighlight("pro-badge") && highlightClass)}>
                  <ProBadge />
                </span>
              ) : null}
              {previewProUpgrade && !hideProComparisonUI && (
                <span
                  ref={(el) => setHighlightRef("visibility-boosts", el)}
                  data-pro-highlight="visibility-boosts"
                  className={cx(
                    "inline-flex items-center gap-1 rounded-full border border-[#C9B46A]/50 bg-[#C9B46A]/15 px-3 py-1.5 text-xs font-semibold text-[#8B6914]",
                    isHighlight("visibility-boosts") && highlightClass
                  )}
                  aria-hidden
                >
                  {lang === "es" ? "2 impulsos de visibilidad" : "2 visibility boosts"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pro preview only: interactive benefits zone — real Pro-only benefits; click to highlight. Hidden for Rentas Privado (no comparison). */}
        {previewProUpgrade && !hideProComparisonUI && (
          <div
            ref={(el) => setHighlightRef("duration", el)}
            data-pro-highlight="duration"
            className={cx(
              "rounded-2xl border border-[#C9B46A]/40 bg-[#F8F6F0] p-4 sm:p-5 lg:p-6 shadow-sm",
              isHighlight("duration") && highlightClass
            )}
          >
            <p className="text-sm font-semibold text-[#111111] mb-1">
              {lang === "es" ? "Tu anuncio con Pro llega a más compradores." : "Your Pro listing reaches more buyers."}
            </p>
            <p className="text-xs text-[#111111]/70 mb-2">
              {lang === "es"
                ? "Toca un beneficio para ver dónde aparece en la vista previa."
                : "Tap a benefit to see where it appears in the preview."}
            </p>
            <p className="text-sm text-[#111111]/90 mb-2">
              {lang === "es" ? "Con Pro tu anuncio incluye:" : "With Pro your listing includes:"}
            </p>
            <p className="text-xs text-[#111111]/60 mb-3">
              {lang === "es" ? "Duración del anuncio: 30 días" : "Listing duration: 30 days"}
            </p>
            <ul className="text-sm text-[#111111]/90 space-y-2 list-none">
              {[
                { id: "more-photos" as const, es: "Hasta 12 fotos", en: "Up to 12 photos" },
                { id: "pro-video" as const, es: "2 videos sobresalientes", en: "2 featured videos" },
                { id: "visibility-boosts" as const, es: "2 impulsos de visibilidad", en: "2 visibility boosts" },
                { id: "pro-badge" as const, es: "Insignia Pro", en: "Pro badge" },
                { id: "analytics" as const, es: "Analíticas del anuncio", en: "Listing analytics" },
                { id: "duration" as const, es: "Duración del anuncio: 30 días", en: "Listing duration: 30 days" },
              ].map(({ id, es, en }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onProBenefitClick?.(id)}
                    className={cx(
                      "w-full text-left rounded-xl px-3 py-2.5 transition min-h-[44px]",
                      isHighlight(id) ? "bg-amber-500/20 ring-1 ring-amber-500/50" : "hover:bg-[#C9B46A]/15"
                    )}
                  >
                    {lang === "es" ? es : en}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Card 2: CTA — Guardar, Compartir, contacto (shared). Private preview: lighter border. */}
        <div className={cx(
          "rounded-2xl border p-4 sm:p-5 lg:p-6",
          hideProComparisonUI ? "border-stone-300/50 bg-[#FAFAF9]" : "border-[#C9B46A]/40 bg-[#FAF9F6]"
        )} id="listing-buyer-actions">
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

        {/* Descripción */}
        <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5 lg:p-6 shadow-sm">
          <div className="text-sm text-[#111111] whitespace-pre-wrap leading-relaxed">
            {listing.description}
          </div>
        </div>

        {/* Seller / profile block — reusable across categories; placeholders where real data not yet available */}
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
          {previewProUpgrade && !hideProComparisonUI && (
            <p className="mt-3 text-xs font-medium text-[#C9B46A]/90" aria-hidden>
              {t.sellerProCue}
            </p>
          )}
        </div>

        {/* Trust signals block — modular, reusable; placeholders only; no full reviews yet */}
        <div className={detailCardClass} data-section="trust-signals">
          <h4 className="text-xs font-semibold text-[#111111]/70 uppercase tracking-wide mb-3">{t.trustSignalsTitle}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-[#111111]/90">{t.quickResponseLabel}</span>
              <span className="text-xs text-[#111111]/50">— ({t.comingSoon})</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-[#111111]/90">{t.verifiedSellerLabel}</span>
              <span className="text-xs text-[#111111]/50">({t.comingSoon})</span>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className={detailCardClass}>
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
          <div className={detailCardClass}>
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
          <div className={detailCardClass}>
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
