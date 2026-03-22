"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { getBrSubcategoriaFromPropertyType } from "../publish/brPrivadoPublishConstants";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Lang = "es" | "en";

export function PrivateBrPreviewContent(props: {
  lang: Lang;
  description: string;
  rawPrice: string;
  rawTitle: string;
  rawCity: string;
  details: Record<string, string>;
  previewDetailPairs: Array<{ label: string; value: string }>;
  images: string[];
  sellerDisplayName: string;
  previewPhone: string;
  previewEmail: string;
  formatMoneyMaybe: (raw: string, lang: Lang) => string;
  copyRulesConfirm: string;
  copyFullPreviewInfoConfirm: string;
  copyFullPreviewBackToEdit: string;
  copyFullPreviewConfirmPublish: string;
  copyPublishing: string;
  fullPreviewRulesConfirmed: boolean;
  setFullPreviewRulesConfirmed: (v: boolean) => void;
  fullPreviewInfoConfirmed: boolean;
  setFullPreviewInfoConfirmed: (v: boolean) => void;
  setShowRulesModal: (v: boolean) => void;
  closeFullPreviewModal: () => void;
  handleFullPreviewConfirmPublish: () => void;
  publishing: boolean;
  onSave?: () => void | Promise<void>;
  onShare?: () => void | Promise<void>;
}) {
  const {
    lang,
    description,
    rawPrice,
    rawTitle,
    rawCity,
    details,
    previewDetailPairs: _previewDetailPairs,
    images,
    sellerDisplayName,
    previewPhone,
    previewEmail,
    formatMoneyMaybe,
    copyRulesConfirm,
    copyFullPreviewInfoConfirm,
    copyFullPreviewBackToEdit,
    copyFullPreviewConfirmPublish,
    copyPublishing,
    fullPreviewRulesConfirmed,
    setFullPreviewRulesConfirmed,
    fullPreviewInfoConfirmed,
    setFullPreviewInfoConfirmed,
    setShowRulesModal,
    closeFullPreviewModal,
    handleFullPreviewConfirmPublish,
    publishing,
    onSave,
    onShare,
  } = props;

  const confirmSectionRef = useRef<HTMLDivElement>(null);
  const resumenRef = useRef<HTMLDivElement>(null);
  const ubicacionRef = useRef<HTMLDivElement>(null);
  const contactoRef = useRef<HTMLDivElement>(null);
  const detallesRef = useRef<HTMLElement>(null);
  const interiorRef = useRef<HTMLDivElement>(null);
  const exteriorRef = useRef<HTMLDivElement>(null);
  const [heroStartIndex, setHeroStartIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoomIndex, setLightboxZoomIndex] = useState<number | null>(null);
  const [contactSheet, setContactSheet] = useState<"solicitar" | "visita" | null>(null);
  const [saveFeedbackMessage, setSaveFeedbackMessage] = useState<"saved" | "signin" | null>(null);
  const [shareFeedback, setShareFeedback] = useState(false);
  const n = images.length;
  const handleSave = useCallback(() => {
    if (typeof onSave === "function") {
      setSaveFeedbackMessage(null);
      void Promise.resolve(onSave()).then(() => {
        setSaveFeedbackMessage("saved");
        setTimeout(() => setSaveFeedbackMessage(null), 2000);
      });
    } else {
      setSaveFeedbackMessage("signin");
      setTimeout(() => setSaveFeedbackMessage(null), 2500);
    }
  }, [onSave]);
  const handleShare = useCallback(() => {
    if (typeof onShare === "function") {
      void Promise.resolve(onShare()).then(() => {
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
      });
    }
  }, [onShare]);
  const scrollTo = (ref: RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const addr = (details.enVentaAddress ?? "").trim();
  const zone = (details.enVentaZone ?? "").trim();
  const addressForMessage = (addr || rawTitle.trim() || zone || (lang === "es" ? "esta propiedad" : "this property")).trim() || (lang === "es" ? "esta propiedad" : "this property");
  const msgSolicitar = lang === "es" ? `Hola, me interesa tu propiedad en ${addressForMessage}. La vi en Leonix Media y me gustaría recibir más información.` : `Hi, I'm interested in your property at ${addressForMessage}. I saw it on Leonix Media and would like more information.`;
  const msgVisita = lang === "es" ? `Hola, me interesa mucho tu propiedad en ${addressForMessage}. La vi en Leonix Media y quería saber cuándo sería posible programar una visita.` : `Hi, I'm very interested in your property at ${addressForMessage}. I saw it on Leonix Media and wanted to know when it might be possible to schedule a visit.`;
  const emailSubject = lang === "es" ? "Consulta sobre tu propiedad" : "Question about your property";
  const phoneDigits = (previewPhone ?? "").replace(/\D/g, "");
  const hasPhone = phoneDigits.length >= 10;
  const hasEmail = !!(previewEmail ?? "").trim();
  const canCycle = n > 3;
  const maxStart = Math.max(0, n - 3);
  const safeStart = n ? Math.min(heroStartIndex, maxStart) : 0;
  const primaryImage = n ? images[safeStart] : null;
  const side1 = n > 1 ? images[(safeStart + 1) % n] : null;
  const side2 = n > 2 ? images[(safeStart + 2) % n] : null;
  const hasRealCity = rawCity.trim() !== "" && rawCity !== (lang === "es" ? "(Ciudad)" : "(City)");
  const mainLine = addr ? addr : hasRealCity ? rawCity.trim() : "";
  const brSubcat = (details.bienesRaicesSubcategoria ?? "").trim() || getBrSubcategoriaFromPropertyType((details.enVentaPropertyType ?? "").trim());
  const br = (details.enVentaBedrooms ?? "").trim();
  const ba = (details.enVentaBathrooms ?? "").trim();
  const sqRaw = (details.enVentaSquareFeet ?? "").trim();
  const sqNum = sqRaw ? Number(sqRaw.replace(/,/g, "").replace(/\s/g, "").trim()) : NaN;
  const sqDisplay = Number.isFinite(sqNum) ? sqNum.toLocaleString(lang === "es" ? "es-US" : "en-US") : sqRaw;
  const hideBedrooms = brSubcat === "terrenos" || brSubcat === "comercial" || brSubcat === "industrial";
  const quickFacts = [
    !hideBedrooms && br && { label: lang === "es" ? "Recámaras" : "Bedrooms", value: br },
    brSubcat !== "terrenos" && ba && { label: lang === "es" ? "Baños" : "Bathrooms", value: ba },
    sqRaw && { label: lang === "es" ? "Pies²" : "Sq ft", value: sqDisplay },
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const featureTagsFromDetails: Array<{ label: string; value: string }> = [];
  const zoneVal = (details.enVentaZone ?? "").trim();
  if (zoneVal) featureTagsFromDetails.push({ label: lang === "es" ? "Vecindad" : "Neighborhood", value: zoneVal });
  const parkingVal = (details.enVentaParkingSpaces ?? "").trim();
  if (parkingVal) featureTagsFromDetails.push({ label: lang === "es" ? "Estacionamiento" : "Parking", value: parkingVal });
  const lotVal = (details.enVentaLotSize ?? "").trim();
  if (lotVal) featureTagsFromDetails.push({ label: lang === "es" ? "Terreno" : "Lot size", value: lotVal });
  const levelsVal = (details.enVentaLevels ?? "").trim();
  if (levelsVal) featureTagsFromDetails.push({ label: lang === "es" ? "Niveles" : "Levels", value: levelsVal });
  const hasPrice = rawPrice.trim() !== "" && /[\d]/.test(rawPrice.replace(/,/g, ""));
  const priceDisplay = hasPrice ? (formatMoneyMaybe(rawPrice, lang) || rawPrice.trim()) : (lang === "es" ? "Precio no indicado" : "Price not specified");
  const hasTitle = rawTitle.trim().length > 0;
  const titleDisplay = hasTitle ? rawTitle.trim() : (lang === "es" ? "(Sin título)" : "(No title)");

  return (
    <div className="max-w-4xl mx-auto px-1 sm:px-0">
      {/* Full-page warm canvas: wraps entire preview content */}
      <div className="rounded-2xl border border-[#C9B46A]/15 bg-[#F8F4EE] shadow-sm p-4 sm:p-6 min-h-[60vh] space-y-6 sm:space-y-5">
        {/* A. Header: brand + Publicar (no search) */}
        <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#C9B46A]/45 bg-gradient-to-b from-[#FDFBF7] to-[#F8F4EE] px-5 py-2.5 text-base font-extrabold tracking-tight text-[#1a1510] shadow-sm">
            <span className="h-5 w-0.5 rounded-full bg-[#C9B46A]/70" aria-hidden />
            {lang === "es" ? "Leonix Clasificados" : "Leonix Classifieds"}
          </span>
          <button
            type="button"
            onClick={() => confirmSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="rounded-xl bg-[#2D5016] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#244012] transition"
          >
            {lang === "es" ? "Publicar" : "Post"}
          </button>
        </header>
        {/* B. Section nav row: scroll to sections */}
        <nav className="flex flex-wrap gap-2 mb-5" aria-label={lang === "es" ? "Secciones" : "Sections"}>
          {[
            { id: "resumen", es: "Resumen", en: "Summary", ref: resumenRef },
            { id: "interior", es: "Interior", en: "Interior", ref: interiorRef },
            { id: "exterior", es: "Exterior", en: "Exterior", ref: exteriorRef },
            { id: "detalles", es: "Detalles", en: "Details", ref: detallesRef },
            { id: "ubicacion", es: "Ubicación", en: "Location", ref: ubicacionRef },
            { id: "contacto", es: "Contacto", en: "Contact", ref: contactoRef },
          ].map(({ id, es, en, ref: sectionRef }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(sectionRef as RefObject<HTMLElement | null>)}
              className="rounded-lg border border-[#C9B46A]/30 bg-[#F8F6F0] px-3 py-2 text-xs font-medium text-[#111111]/90 hover:bg-[#EFE7D8] hover:border-[#C9B46A]/40 transition"
            >
              {lang === "es" ? es : en}
            </button>
          ))}
        </nav>
        {/* C + D + E */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-6">
          <div className="lg:col-span-8 space-y-5 sm:space-y-5">
            {/* C. Hero gallery: main + two side slots; cycle when >3 images */}
            <div ref={resumenRef} id="resumen" className="relative scroll-mt-4">
              {primaryImage ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-8 relative rounded-xl overflow-hidden bg-[#E8E8E8] border border-[#C9B46A]/20 aspect-[4/3] min-h-[220px]">
                    <img src={primaryImage} alt="" className="w-full h-full object-cover" />
                    {canCycle && (
                      <>
                        <button
                          type="button"
                          onClick={() => setHeroStartIndex((i) => Math.max(0, i - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-lg font-bold"
                          aria-label={lang === "es" ? "Anterior" : "Previous"}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroStartIndex((i) => Math.min(maxStart, i + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-lg font-bold"
                          aria-label={lang === "es" ? "Siguiente" : "Next"}
                        >
                          →
                        </button>
                      </>
                    )}
                  </div>
                  <div className="md:col-span-4 flex flex-col gap-2">
                    {side1 ? (
                      <div className="rounded-lg overflow-hidden bg-[#E8E8E8] border border-[#C9B46A]/20 aspect-[4/3] min-h-[90px]">
                        <img src={side1} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-[#C9B46A]/15 bg-[#F8F6F0]/50 aspect-[4/3] min-h-[90px]" aria-hidden />
                    )}
                    {side2 ? (
                      <div className="rounded-lg overflow-hidden bg-[#E8E8E8] border border-[#C9B46A]/20 aspect-[4/3] min-h-[90px]">
                        <img src={side2} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-[#C9B46A]/15 bg-[#F8F6F0]/50 aspect-[4/3] min-h-[90px]" aria-hidden />
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-[#E8E8E8] border border-[#C9B46A]/20 aspect-[16/10] min-h-[200px] flex items-center justify-center">
                  <span className="text-[#111111]/50 text-sm">{lang === "es" ? "Sin imagen" : "No image"}</span>
                </div>
              )}
              {n > 0 && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  {canCycle && (
                    <span className="text-[11px] text-[#111111]/60">
                      {safeStart + 1}–{Math.min(safeStart + 3, n)} {lang === "es" ? "de" : "of"} {n}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="rounded-lg border border-[#C9B46A]/40 bg-[#F8F6F0] px-3 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#EFE7D8] transition"
                  >
                    {lang === "es" ? "Ver todas las fotos" : "View all photos"}
                  </button>
                </div>
              )}
            </div>
            {/* D. Main info: price, title, address, zone, facts, features (Ubicación) */}
            <div ref={ubicacionRef} id="ubicacion" className="rounded-xl border border-[#C9B46A]/20 bg-[#FAFAF8] p-5 scroll-mt-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                {priceDisplay}
              </div>
              <h2 className="mt-3 text-xl sm:text-2xl font-bold text-[#111111] leading-tight">
                {titleDisplay}
              </h2>
              {mainLine && <p className="mt-3 text-sm text-[#111111]/85 font-medium">{mainLine}</p>}
              {zone && <p className="mt-1 text-xs text-[#111111]/65">{lang === "es" ? "Vecindad: " : "Neighborhood: "}{zone}</p>}
              {quickFacts.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {quickFacts.map((f) => (
                    <span key={f.label} className="rounded-full border border-[#C9B46A]/35 bg-[#F8F6F0] px-3 py-1.5 text-xs font-medium text-[#111111]">
                      {f.label}: {f.value}
                    </span>
                  ))}
                </div>
              )}
              {featureTagsFromDetails.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {featureTagsFromDetails.map((item, i) => (
                    <span key={i} className="rounded-lg border border-[#C9B46A]/25 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#111111]/90">
                      {item.label}: {item.value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        {/* E. Right private seller card: info + 2x2 action grid (Guardar, Compartir | Solicitar, Programar visita) */}
        <div className="lg:col-span-4">
          <div ref={contactoRef} id="contacto" className="rounded-xl border border-[#C9B46A]/25 bg-[#FAFAF8] p-4 sm:p-5 shadow-sm scroll-mt-4 space-y-5">
            <div>
              <h4 className="text-sm font-bold text-[#111111] mb-1 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-[#C9B46A]/50" aria-hidden />
                {lang === "es" ? "Contactar" : "Contact"}
              </h4>
              <p className="text-base font-semibold text-[#111111] mt-2 leading-snug">
                {sellerDisplayName.trim() || (lang === "es" ? "Propietario" : "Owner")}
              </p>
              {previewPhone && (
                <p className="mt-2 text-sm text-[#111111]">
                  <a href={`tel:${previewPhone.replace(/\D/g, "")}`} className="font-medium hover:underline">{previewPhone}</a>
                </p>
              )}
              {previewEmail && (
                <p className="mt-1 text-sm text-[#111111] break-all">
                  <a href={`mailto:${previewEmail}`} className="font-medium hover:underline">{previewEmail}</a>
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-2 min-h-[44px]">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-[#B8860B]/90 text-white px-4 py-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold hover:bg-[#A0780A] transition border border-[#C9B46A]/40 shadow-sm min-h-[44px] leading-tight"
                title={lang === "es" ? "Guardar progreso" : "Save progress"}
              >
                {saveFeedbackMessage === "saved" ? (lang === "es" ? "Guardado" : "Saved") : saveFeedbackMessage === "signin" ? (lang === "es" ? "Inicia sesión para guardar" : "Sign in to save") : (lang === "es" ? "Guardar" : "Save")}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F4EE] text-[#111111] px-4 py-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold hover:bg-[#EFE7D8] transition min-h-[44px] leading-tight"
                title={lang === "es" ? "Compartir enlace" : "Share link"}
              >
                {shareFeedback ? (lang === "es" ? "¡Copiado!" : "Copied!") : (lang === "es" ? "Compartir" : "Share")}
              </button>
              <button
                type="button"
                onClick={() => setContactSheet("solicitar")}
                className="rounded-xl bg-[#2D5016] text-white px-4 py-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold hover:bg-[#244012] transition border border-[#2D5016]/80 min-w-0 min-h-[44px] leading-tight"
              >
                {lang === "es" ? "Solicitar información" : "Request info"}
              </button>
              <button
                type="button"
                onClick={() => setContactSheet("visita")}
                className="rounded-xl border-2 border-[#2D5016]/70 bg-[#2D5016]/08 text-[#2D5016] px-4 py-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold hover:bg-[#2D5016]/15 transition min-w-0 min-h-[44px] leading-tight"
              >
                {lang === "es" ? "Programar visita" : "Schedule visit"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom: Descripción + Detalles de la propiedad (private BR only) */}
      <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8 max-w-2xl">
        <section>
          <h3 className="text-lg font-bold text-[#111111] mb-3 flex items-center gap-2 pb-2 border-b border-[#C9B46A]/30">
            <span className="w-1 h-6 rounded-full bg-[#C9B46A]/60" aria-hidden />
            {lang === "es" ? "Descripción" : "About this property"}
          </h3>
          <div className="rounded-xl border border-[#C9B46A]/20 bg-[#FAFAF8] p-4 sm:p-5 text-[#111111] leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
            {(description ?? "").trim() ? description.trim() : (lang === "es" ? "Sin descripción." : "No description.")}
          </div>
        </section>
        <section ref={detallesRef} id="detalles" className="scroll-mt-4">
          <h3 className="text-lg font-bold text-[#111111] mb-3 flex items-center gap-2 pb-2 border-b border-[#C9B46A]/30">
            <span className="w-1 h-6 rounded-full bg-[#C9B46A]/60" aria-hidden />
            {lang === "es" ? "Detalles de la propiedad" : "Property details"}
          </h3>
          <div className="space-y-5">
            {(() => {
              const subcat = (details.bienesRaicesSubcategoria ?? "").trim() || getBrSubcategoriaFromPropertyType((details.enVentaPropertyType ?? "").trim());
              const showResidentialInterior = subcat === "residencial" || subcat === "condos-townhomes" || subcat === "multifamiliar";
              const interiorRows: Array<{ label: string; value: string }> = [];
              if (showResidentialInterior) {
                const brVal = (details.enVentaBedrooms ?? "").trim();
                if (brVal) interiorRows.push({ label: lang === "es" ? "Recámaras" : "Bedrooms", value: brVal });
              }
              const baVal = (details.enVentaBathrooms ?? "").trim();
              if (baVal && subcat !== "terrenos") interiorRows.push({ label: lang === "es" ? "Baños" : "Bathrooms", value: baVal });
              const sqVal = (details.enVentaSquareFeet ?? "").trim();
              if (sqVal) interiorRows.push({ label: lang === "es" ? "Pies²" : "Sq ft", value: sqVal });
              const lvVal = (details.enVentaLevels ?? "").trim();
              if (lvVal && subcat !== "terrenos") interiorRows.push({ label: lang === "es" ? "Niveles" : "Levels", value: lvVal });
              const exteriorRows: Array<{ label: string; value: string }> = [];
              const lotVal = (details.enVentaLotSize ?? "").trim();
              if (lotVal) exteriorRows.push({ label: lang === "es" ? "Terreno" : "Lot size", value: lotVal });
              const pkVal = (details.enVentaParkingSpaces ?? "").trim();
              if (pkVal) exteriorRows.push({ label: lang === "es" ? "Estacionamiento" : "Parking", value: pkVal });
              const zoneVal = (details.enVentaZone ?? "").trim();
              if (zoneVal) exteriorRows.push({ label: lang === "es" ? "Vecindad" : "Neighborhood", value: zoneVal });
              const extraRows: Array<{ label: string; value: string }> = [];
              const ptVal = (details.enVentaPropertyType ?? "").trim();
              if (ptVal) extraRows.push({ label: lang === "es" ? "Tipo de propiedad" : "Property type", value: ptVal });
              const stVal = (details.enVentaPropertySubtype ?? "").trim();
              if (stVal) extraRows.push({ label: lang === "es" ? "Subtipo" : "Subtype", value: stVal });
              const ybVal = (details.enVentaYearBuilt ?? "").trim();
              if (ybVal) extraRows.push({ label: lang === "es" ? "Año de construcción" : "Year built", value: ybVal });
              const utilVal = (details.enVentaUtilitiesForProperty ?? "").trim();
              if (utilVal) extraRows.push({ label: lang === "es" ? "Servicios disponibles" : "Utilities", value: utilVal });
              const zonVal = (details.enVentaZoning ?? "").trim();
              if (zonVal) extraRows.push({ label: lang === "es" ? "Zonificación" : "Zoning", value: zonVal });
              const multiRows: Array<{ label: string; value: string }> = [];
              const vtVal = (details.enVentaVirtualTourUrl ?? "").trim();
              if (vtVal) multiRows.push({ label: lang === "es" ? "Tour virtual" : "Virtual tour", value: vtVal });
              const vUrlVal = (details.enVentaVideoUrl ?? "").trim();
              if (vUrlVal) multiRows.push({ label: lang === "es" ? "Video" : "Video", value: vUrlVal });
              const hasAny = interiorRows.length > 0 || exteriorRows.length > 0 || extraRows.length > 0 || multiRows.length > 0;
              if (!hasAny) return <p className="text-sm text-[#111111]/70">{lang === "es" ? "Sin detalles adicionales." : "No additional details."}</p>;
              return (
                <>
                  {interiorRows.length > 0 && (
                    <div ref={interiorRef} id="interior" className="scroll-mt-4">
                      <h4 className="text-sm font-bold text-[#111111] mb-2 flex items-center gap-2">
                        <span className="w-0.5 h-4 rounded-full bg-[#C9B46A]/50" aria-hidden />
                        {lang === "es" ? "Interior" : "Interior"}
                      </h4>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {interiorRows.map((r) => (
                          <div key={r.label} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-center rounded-lg bg-[#F8F6F0]/80 px-4 py-3 sm:px-3 sm:py-2">
                            <dt className="text-xs sm:text-sm text-[#111111]/80">{r.label}</dt>
                            <dd className="text-sm font-medium text-[#111111]">{r.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                  {exteriorRows.length > 0 && (
                    <div ref={exteriorRef} id="exterior" className="scroll-mt-4">
                      <h4 className="text-sm font-bold text-[#111111] mb-2 flex items-center gap-2">
                        <span className="w-0.5 h-4 rounded-full bg-[#C9B46A]/50" aria-hidden />
                        {lang === "es" ? "Exterior / Terreno" : "Exterior / Lot"}
                      </h4>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {exteriorRows.map((r) => (
                          <div key={r.label} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-center rounded-lg bg-[#F8F6F0]/80 px-4 py-3 sm:px-3 sm:py-2">
                            <dt className="text-xs sm:text-sm text-[#111111]/80">{r.label}</dt>
                            <dd className="text-sm font-medium text-[#111111]">{r.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                  {extraRows.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#111111] mb-2 flex items-center gap-2">
                        <span className="w-0.5 h-4 rounded-full bg-[#C9B46A]/50" aria-hidden />
                        {lang === "es" ? "Información adicional" : "Additional info"}
                      </h4>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {extraRows.map((r) => (
                          <div key={r.label} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-center rounded-lg bg-[#F8F6F0]/80 px-4 py-3 sm:px-3 sm:py-2">
                            <dt className="text-xs sm:text-sm text-[#111111]/80">{r.label}</dt>
                            <dd className="text-sm font-medium text-[#111111] break-all">{r.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                  {multiRows.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#111111] mb-2 flex items-center gap-2">
                        <span className="w-0.5 h-4 rounded-full bg-[#C9B46A]/50" aria-hidden />
                        {lang === "es" ? "Multimedia" : "Multimedia"}
                      </h4>
                      <dl className="grid grid-cols-1 gap-3">
                        {multiRows.map((r) => (
                          <div key={r.label} className="rounded-lg bg-[#F8F6F0]/80 px-4 py-3 sm:px-3 sm:py-2">
                            <dt className="text-xs sm:text-sm text-[#111111]/80">{r.label}</dt>
                            <dd className="text-sm font-medium text-[#111111] mt-1 break-all">
                              <a href={r.value} target="_blank" rel="noopener noreferrer" className="text-[#A98C2A] hover:underline">{r.value}</a>
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </section>
      </div>
      {/* Lightbox: all photos inside preview modal */}
      {lightboxOpen && n > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={lang === "es" ? "Galería de fotos" : "Photo gallery"}
          onClick={() => { setLightboxZoomIndex(null); setLightboxOpen(false); }}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => { setLightboxZoomIndex(null); setLightboxOpen(false); }}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/90 text-[#111111] w-10 h-10 flex items-center justify-center text-lg font-bold hover:bg-white"
              aria-label={lang === "es" ? "Cerrar" : "Close"}
            >
              ×
            </button>
            {lightboxZoomIndex !== null ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-full max-h-[85vh] flex items-center justify-center bg-black/40 rounded-xl overflow-hidden">
                  <img
                    src={images[lightboxZoomIndex]}
                    alt=""
                    className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
                  />
                  {n > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLightboxZoomIndex((prev) => (prev === 0 ? n - 1 : (prev ?? 0) - 1)); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-2xl font-bold"
                        aria-label={lang === "es" ? "Anterior" : "Previous"}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLightboxZoomIndex((prev) => ((prev ?? 0) + 1) % n); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-2xl font-bold"
                        aria-label={lang === "es" ? "Siguiente" : "Next"}
                      >
                        →
                      </button>
                    </>
                  )}
                </div>
                <p className="text-sm text-white/90">
                  {lightboxZoomIndex + 1} {lang === "es" ? "de" : "of"} {n}
                </p>
                <button
                  type="button"
                  onClick={() => setLightboxZoomIndex(null)}
                  className="rounded-lg bg-white/90 text-[#111111] px-4 py-2 text-sm font-medium hover:bg-white"
                >
                  {lang === "es" ? "Ver todas" : "View all"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-4xl w-full">
                {images.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxZoomIndex(i)}
                    className="rounded-lg overflow-hidden bg-[#222] aspect-square focus:ring-2 ring-white/50"
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Contact chooser: always open when either CTA is clicked; show options when phone/email exist */}
      {contactSheet && (() => {
        const msg = contactSheet === "solicitar" ? msgSolicitar : msgVisita;
        const emailAddr = (previewEmail ?? "").trim();
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAddr)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msg)}`;
        const yahooUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(emailAddr)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msg)}`;
        const mailtoUrl = `mailto:${encodeURIComponent(emailAddr)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msg)}`;
        const copyEmail = () => {
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(emailAddr).catch(() => {});
          }
          setContactSheet(null);
        };
        const copyPhone = () => {
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(previewPhone ?? "").catch(() => {});
          }
          setContactSheet(null);
        };
        return (
          <div
            className="fixed inset-0 z-[99] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={lang === "es" ? "Opciones de contacto" : "Contact options"}
            onClick={() => setContactSheet(null)}
          >
            <div
              className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white shadow-xl p-4 pb-safe space-y-4 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-semibold text-[#111111] pb-2 border-b border-black/10">
                {contactSheet === "solicitar"
                  ? (lang === "es" ? "Solicitar información" : "Request info")
                  : (lang === "es" ? "Programar visita" : "Schedule visit")}
              </p>
              {!(hasPhone || hasEmail) ? (
                <p className="text-sm text-[#111111]/80">
                  {lang === "es" ? "Añade tu teléfono o correo en el formulario para que los compradores puedan contactarte." : "Add your phone or email in the form so buyers can contact you."}
                </p>
              ) : null}
              {hasEmail && (
                <div>
                  <p className="text-xs font-medium text-[#111111]/70 mb-2">{lang === "es" ? "Email" : "Email"}</p>
                  <div className="space-y-2">
                    <a href={gmailUrl} target="_blank" rel="noopener noreferrer" onClick={() => setContactSheet(null)} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111] hover:bg-[#E8E8E8] transition min-h-[44px]">
                      {lang === "es" ? "Abrir Gmail" : "Open Gmail"}
                    </a>
                    <a href={yahooUrl} target="_blank" rel="noopener noreferrer" onClick={() => setContactSheet(null)} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111] hover:bg-[#E8E8E8] transition min-h-[44px]">
                      {lang === "es" ? "Abrir Yahoo Mail" : "Open Yahoo Mail"}
                    </a>
                    <button type="button" onClick={copyEmail} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111] hover:bg-[#E8E8E8] transition text-left min-h-[44px]">
                      {lang === "es" ? "Copiar email" : "Copy email"}
                    </button>
                    <a href={mailtoUrl} onClick={() => setContactSheet(null)} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111]/80 hover:bg-[#E8E8E8] transition min-h-[44px]">
                      {lang === "es" ? "Usar app predeterminada" : "Use default app"}
                    </a>
                  </div>
                </div>
              )}
              {hasPhone && (
                <div>
                  <p className="text-xs font-medium text-[#111111]/70 mb-2">{lang === "es" ? "Teléfono" : "Phone"}</p>
                  <div className="flex flex-col space-y-2">
                    <button type="button" onClick={copyPhone} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111] hover:bg-[#E8E8E8] transition text-left min-h-[44px] order-3 sm:order-1">
                      {lang === "es" ? "Copiar teléfono" : "Copy phone"}
                    </button>
                    <a href={`tel:${phoneDigits}`} onClick={() => setContactSheet(null)} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111]/80 hover:bg-[#E8E8E8] transition min-h-[44px] order-1 sm:order-2">
                      {lang === "es" ? "Llamar" : "Call"}
                    </a>
                    <a href={`sms:${phoneDigits}?body=${encodeURIComponent(msg)}`} onClick={() => setContactSheet(null)} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111]/80 hover:bg-[#E8E8E8] transition min-h-[44px] order-2 sm:order-3">
                      {lang === "es" ? "Texto / SMS" : "Text / SMS"}
                    </a>
                  </div>
                </div>
              )}
              <button type="button" onClick={() => setContactSheet(null)} className="w-full rounded-xl border border-black/15 py-3.5 sm:py-3 text-sm font-medium text-[#111111] hover:bg-[#F5F5F5] transition min-h-[44px]">
                {lang === "es" ? "Cancelar" : "Cancel"}
              </button>
            </div>
          </div>
        );
      })()}
      {/* Confirm block */}
      <div ref={confirmSectionRef} id="confirmar" className="mt-10 pt-8 border-t border-black/10 max-w-2xl space-y-3 scroll-mt-4">
        <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
          <input
            type="checkbox"
            checked={fullPreviewRulesConfirmed}
            onChange={(e) => setFullPreviewRulesConfirmed(e.target.checked)}
            className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
          />
          <span>
            {copyRulesConfirm}
            {" "}
            <button type="button" onClick={() => setShowRulesModal(true)} className="text-[#A98C2A] hover:text-[#8f7a24] underline font-medium">
              {lang === "es" ? "Ver reglas" : "View rules"}
            </button>
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
          <input
            type="checkbox"
            checked={fullPreviewInfoConfirmed}
            onChange={(e) => setFullPreviewInfoConfirmed(e.target.checked)}
            className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
          />
          <span>{copyFullPreviewInfoConfirm}</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={closeFullPreviewModal}
            className="flex-1 w-full max-w-full rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] text-[#111111] font-semibold py-3.5 text-center hover:bg-[#E8E8E8] transition"
          >
            {copyFullPreviewBackToEdit}
          </button>
          <button
            type="button"
            onClick={handleFullPreviewConfirmPublish}
            disabled={!fullPreviewRulesConfirmed || !fullPreviewInfoConfirmed || publishing}
            className={cx(
              "flex-1 w-full max-w-full rounded-xl font-semibold py-3.5 text-center transition",
              fullPreviewRulesConfirmed && fullPreviewInfoConfirmed && !publishing
                ? "bg-[#111111] text-[#F5F5F5] hover:opacity-95"
                : "bg-[#D9D9D9] text-[#111111]/60 cursor-not-allowed"
            )}
          >
            {publishing ? copyPublishing : copyFullPreviewConfirmPublish}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}