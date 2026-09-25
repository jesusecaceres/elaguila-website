"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LeonixVideoUrlAddRows } from "@/app/clasificados/lib/LeonixVideoUrlAddRows";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import ListingRulesConfirmationSection from "@/app/clasificados/en-venta/shared/components/ListingRulesConfirmationSection";
import { LeonixApplicationDataLossNotice } from "@/app/clasificados/lib/leonixApplicationStandard/LeonixApplicationDataLossNotice";
import { LeonixApplicationVerAnuncioActions } from "@/app/clasificados/lib/leonixApplicationStandard/LeonixApplicationVerAnuncioActions";
import { LeonixCategoryApplicationHeader } from "@/app/clasificados/lib/leonixApplicationStandard/LeonixCategoryApplicationHeader";
import { gateBienesRaicesPrivadoPreview } from "@/app/clasificados/lib/publish/leonixRequiredForPreviewGates";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  parseBrNegocioPropiedadParam,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  BR_PREVIEW_PRIVADO,
  BR_PUBLICAR_HUB,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";
import { LeonixCustomHighlightChipAdd } from "@/app/clasificados/lib/LeonixCustomHighlightChipAdd";
import { evaluateAddCustomHighlight } from "@/app/clasificados/lib/leonixCustomHighlightChips";
import { BrGate12dHoaCommunitySection } from "@/app/clasificados/publicar/bienes-raices/shared/BrGate12dHoaCommunitySection";
import {
  AiField,
  aiCardClass,
  aiHintClass,
  aiInputClass,
  aiLabelClass,
  aiSubClass,
  aiTextareaClass,
  aiTitleClass,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/formPrimitives";

const fieldClass = `${aiInputClass} min-w-0 max-w-full`;
const textareaFieldClass = `${aiTextareaClass} min-w-0 max-w-full`;
import {
  formatUsPhoneDisplay,
  onPhoneInputChange,
  digitsOnly,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/phoneMask";
import { compressImageFileToJpegDataUrl } from "./utils/brPrivadoMediaCompress";
import { LeonixRealEstateSortablePhotoStrip } from "@/app/clasificados/lib/LeonixRealEstateSortablePhotoStrip";
import { BrPrivadoCiudadZonaCombobox } from "./components/BrPrivadoCiudadZonaCombobox";
import {
  COMERCIAL_DESTACADO_EN,
  COMERCIAL_DESTACADOS_CHECKLIST_DEFS,
  COMERCIAL_SUBTIPO_POR_TIPO,
  COMERCIAL_SUBVALUE_LABEL_EN,
  COMERCIAL_TIPO_LABEL_EN,
  COMERCIAL_TIPO_OPCIONES,
  TERRENO_DESTACADO_EN,
  TERRENO_DESTACADOS_CHECKLIST_DEFS,
  TERRENO_SUBTIPO_POR_TIPO,
  TERRENO_SUBVALUE_LABEL_EN,
  TERRENO_TIPO_LABEL_EN,
  TERRENO_TIPO_OPCIONES,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteComercialTerrenoMeta";
import {
  SUBTIPO_SUBVALUE_LABEL_EN,
  TIPO_PROPIEDAD_LABEL_EN,
  TIPO_PROPIEDAD_OPCIONES,
  selectableSubtipoOptionsForTipo,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteResidencialTipoMeta";
import {
  createEmptyBienesRaicesPrivadoFormState,
  MAX_PRIVADO_VIDEO_URLS,
  type BienesRaicesPrivadoFormState,
} from "../schema/bienesRaicesPrivadoFormState";
import {
  clearBienesRaicesPrivadoDraft,
  loadBienesRaicesPrivadoDraft,
  saveBienesRaicesPrivadoDraft,
} from "./utils/bienesRaicesPrivadoDraft";
import { useBusinessApplicationLeaveGuard } from "@/app/lib/businessApplications/useBusinessApplicationLeaveGuard";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { formatSqftDisplay, formatUsdWhole, priceDigitsUnbounded } from "@/app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat";
import { BusinessAddressVerifiedInput } from "@/app/components/forms/BusinessAddressVerifiedInput";
import type { BusinessAddress } from "@/app/lib/businessAddress/businessAddressContract";

const MAX_PHOTOS = 8;
/** Gate I.5.4A.1 — reject an oversized seller photo up front instead of letting a slow/huge upload fail silently later. */
const MAX_SELLER_PHOTO_BYTES = 12 * 1024 * 1024;

/** Live preview of how price will render in the ad (USD, commas). */
function formatPricePreviewUsd(digitsRaw: string): string {
  return formatUsdWhole(digitsRaw);
}

function brPrivateUi(lang: "es" | "en", es: string, en: string): string {
  return lang === "en" ? en : es;
}

const BR_HIGHLIGHT_PRESET_EN: Record<string, string> = {
  piscina: "Pool",
  cocinaRemodelada: "Remodeled kitchen",
  electrodomesticosLujo: "Luxury appliances",
  patio: "Patio",
  balcon: "Balcony",
  vista: "View",
  comunidadCerrada: "Gated community",
  techosAltos: "High ceilings",
  cuartoPrincipalGrande: "Large primary bedroom",
  walkInCloset: "Walk-in closet",
  oficinaEnCasa: "Home office",
  panelesSolares: "Solar panels",
  smartHome: "Smart home",
  chimenea: "Fireplace",
  lavanderia: "Laundry",
  estacionamientoTechado: "Covered parking",
  accesoControlado: "Controlled access",
  elevador: "Elevator",
  terraza: "Terrace",
  gimnasio: "Gym",
  amenidadesDesarrollo: "Development amenities",
  sotano: "Basement",
  garaje: "Garage",
  portonElectrico: "Electric gate",
  adu: "ADU / guest house",
  remodelada: "Remodeled",
  nuevaConstruccion: "New construction",
};

function BrSqftPreview({ value, lang }: { value: string; lang: "es" | "en" }) {
  const shown = formatSqftDisplay(value);
  if (!shown) return null;
  return <p className="mt-1.5 text-xs font-medium text-[#5C5346]">{brPrivateUi(lang, "Vista previa:", "Preview:")} {shown}</p>;
}

const BR_PRIVADO_MAX_OPEN_HOUSE_SLOTS = 4;

/** Item 206 — repeatable Open House events for BR Privado, mirroring BR Negocio's
 * add/edit/remove pattern (same shared `AgenteResOpenHouseSlot` shape). */
function BrPrivadoOpenHouseSlots({
  state,
  setState,
  fieldClass,
  lang,
}: {
  state: BienesRaicesPrivadoFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesPrivadoFormState>>;
  fieldClass: string;
  lang: "es" | "en";
}) {
  const slots = state.gate12d.openHouseSlots;

  const patchSlot = (index: number, patch: Partial<(typeof slots)[number]>) => {
    setState((s) => ({
      ...s,
      gate12d: {
        ...s.gate12d,
        openHouseSlots: s.gate12d.openHouseSlots.map((row, j) => (j === index ? { ...row, ...patch } : row)),
      },
    }));
  };

  const removeSlot = (index: number) => {
    setState((s) => ({
      ...s,
      gate12d: { ...s.gate12d, openHouseSlots: s.gate12d.openHouseSlots.filter((_, j) => j !== index) },
    }));
  };

  const addSlot = () => {
    setState((s) => ({
      ...s,
      gate12d: {
        ...s.gate12d,
        openHouseSlots: [
          ...s.gate12d.openHouseSlots,
          { fecha: "", fechaFin: "", inicio: "", fin: "", diasHorariosAdicionales: "", notas: "", soloConCita: false, enlaceReservar: "" },
        ].slice(0, BR_PRIVADO_MAX_OPEN_HOUSE_SLOTS),
      },
    }));
  };

  return (
    <div>
      <span className={aiLabelClass}>{brPrivateUi(lang, "Open house / visitas", "Open house / showings")}</span>
      <div className="mt-2 space-y-3">
        {slots.map((slot, i) => (
          <div key={i} className="rounded-lg border border-[#E8DFD0] bg-[#FFFDF9] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">
                Open house{slots.length > 1 ? ` ${i + 1}` : ""}
              </p>
              <button type="button" className="text-xs font-semibold text-[#8B7355] underline-offset-2 hover:underline" onClick={() => removeSlot(i)}>
                {brPrivateUi(lang, "Eliminar", "Remove")}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AiField label={brPrivateUi(lang, "Fecha", "Date")}>
                <input className={fieldClass} type="date" value={slot.fecha} onChange={(e) => patchSlot(i, { fecha: e.target.value })} />
              </AiField>
              <AiField label={brPrivateUi(lang, "Hora inicio", "Start time")}>
                <input className={fieldClass} type="time" value={slot.inicio} onChange={(e) => patchSlot(i, { inicio: e.target.value })} />
              </AiField>
              <AiField label={brPrivateUi(lang, "Hora fin", "End time")}>
                <input className={fieldClass} type="time" value={slot.fin} onChange={(e) => patchSlot(i, { fin: e.target.value })} />
              </AiField>
              <AiField label={brPrivateUi(lang, "Notas (opcional)", "Notes (optional)")}>
                <input className={fieldClass} value={slot.notas} onChange={(e) => patchSlot(i, { notas: e.target.value })} />
              </AiField>
            </div>
          </div>
        ))}
      </div>
      {slots.length < BR_PRIVADO_MAX_OPEN_HOUSE_SLOTS ? (
        <button
          type="button"
          className="mt-3 w-full rounded-lg border border-dashed border-[#C9B46A]/60 bg-[#FFFCF7] px-3 py-2.5 text-sm font-semibold text-[#5C4A28] transition hover:border-[#B8954A]/80 hover:bg-[#FFF6E7]"
          onClick={addSlot}
        >
          {brPrivateUi(lang, "+ Añadir horario / visita", "+ Add time / showing")}
        </button>
      ) : null}
    </div>
  );
}

const CATEGORIAS: { id: BrNegocioCategoriaPropiedad; label: string }[] = [
  { id: "residencial", label: "Residencial" },
  { id: "comercial", label: "Comercial" },
  { id: "terreno_lote", label: "Terreno / lote" },
];

const ESTADOS: { id: BienesRaicesPrivadoFormState["estadoAnuncio"]; label: string }[] = [
  { id: "disponible", label: "Disponible" },
  { id: "pendiente", label: "Pendiente" },
  { id: "bajo_contrato", label: "Bajo contrato" },
  { id: "vendido", label: "Vendido" },
];

const CONDICION_OPTS: { value: BienesRaicesPrivadoFormState["residencial"]["condicion"]; label: string }[] = [
  { value: "", label: "—" },
  { value: "excelente", label: "Excelente" },
  { value: "buena", label: "Buena" },
  { value: "regular", label: "Regular" },
  { value: "necesita_reparacion", label: "Necesita reparación" },
];

const CONFIRM_PREVIEW_BLOCKED = {
  es: "Marca las tres confirmaciones al final del formulario para usar Vista previa con validación.",
  en: "Check all three confirmations at the bottom to use validated preview.",
} as const;

export function BienesRaicesPrivadoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );
  const [state, setState] = useState<BienesRaicesPrivadoFormState>(createEmptyBienesRaicesPrivadoFormState);
  const [hydrated, setHydrated] = useState(false);
  const [previewGateMessage, setPreviewGateMessage] = useState<string | null>(null);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const [sellerPhotoNotice, setSellerPhotoNotice] = useState<string | null>(null);
  const [verifiedAddress, setVerifiedAddress] = useState<BusinessAddress | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;
  const photosInputRef = useRef<HTMLInputElement>(null);
  const ownerPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const d = await loadBienesRaicesPrivadoDraft();
      if (cancelled) return;
      if (d) {
        setState(d);
        setHydrated(true);
        return;
      }
      try {
        const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        const p = parseBrNegocioPropiedadParam(sp.get(BR_NEGOCIO_Q_PROPIEDAD));
        if (p) setState((s) => ({ ...s, categoriaPropiedad: p }));
      } catch {
        /* ignore */
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Debounced autosave — always persists `stateRef.current` when the timer fires (avoids stale closures). */
  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => {
      saveBienesRaicesPrivadoDraft(stateRef.current);
    }, 280);
    return () => window.clearTimeout(id);
  }, [state, hydrated]);

  // BR-INV-D2-FIX — flush the current draft the moment the page is about to hide/unload (matches
  // the pattern already proven in RentasPrivadoForm/RentasNegocioForm). This form previously had
  // no such flush, relying solely on the 280ms debounced autosave above; a reload shortly after a
  // real edit could otherwise land between debounce ticks with only an older write on record.
  // useLeonixPublishFlowExitClear (mounted by BienesRaicesPrivadoApplication + the privado preview)
  // no longer clears on pagehide/pageshow, so this flush is what survives a hard refresh instead of
  // being wiped right after it runs; the hook now only clears on an SPA exit out of the flow.
  useEffect(() => {
    if (!hydrated) return;
    function flush() {
      saveBienesRaicesPrivadoDraft(stateRef.current);
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [hydrated]);

  // BR-INV-WAVE1-GATE3: save is now async (IndexedDB offload). Returns the promise so callers that
  // navigate right after (onVerAnuncio) can await it — otherwise router.push could race ahead of
  // the write and the preview page would read a stale draft.
  const flushSave = useCallback(() => {
    return saveBienesRaicesPrivadoDraft(stateRef.current);
  }, []);

  useBusinessApplicationLeaveGuard({
    isDirty: hydrated && state.titulo.trim().length > 0,
    persist: () => {
      void saveBienesRaicesPrivadoDraft(stateRef.current);
    },
  });

  const previewHref = withClasificadosPublishLang(BR_PREVIEW_PRIVADO, routeLang, {
    [BR_NEGOCIO_Q_PROPIEDAD]: state.categoriaPropiedad,
  });

  const onPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_PHOTOS - state.media.photoDataUrls.length;
    if (room <= 0) return;
    const next: string[] = [...state.media.photoDataUrls];
    for (let i = 0; i < files.length && next.length < MAX_PHOTOS; i++) {
      const f = files[i];
      if (!f || !/^image\//.test(f.type)) continue;
      try {
        next.push(await compressImageFileToJpegDataUrl(f));
      } catch {
        /* ignore */
      }
    }
    setState((s) => {
      const primaryImageIndex = Math.min(s.media.primaryImageIndex, Math.max(0, next.length - 1));
      const out: BienesRaicesPrivadoFormState = {
        ...s,
        media: {
          ...s.media,
          photoDataUrls: next,
          primaryImageIndex,
        },
      };
      queueMicrotask(() => saveBienesRaicesPrivadoDraft(out));
      return out;
    });
    if (photosInputRef.current) photosInputRef.current.value = "";
  };

  const normalizePrivadoVideoUrls = (urls: readonly string[]): string[] => {
    const out: string[] = [];
    for (const raw of urls) {
      const v = String(raw ?? "").trim();
      if (!v || out.includes(v)) continue;
      out.push(v);
      if (out.length >= MAX_PRIVADO_VIDEO_URLS) break;
    }
    return out;
  };

  const onVideoUrlChange = (index: number, raw: string) => {
    setMediaNotice(null);
    setState((s) => {
      const current = normalizePrivadoVideoUrls(s.media.videoUrls.length ? s.media.videoUrls : [s.media.videoUrl]);
      const nextInput = Array.from({ length: MAX_PRIVADO_VIDEO_URLS }, (_, i) => current[i] ?? "");
      nextInput[index] = raw;
      const nextUrls = normalizePrivadoVideoUrls(nextInput);
      const out: BienesRaicesPrivadoFormState = {
        ...s,
        // BR-INV-WAVE1-GATE2: device video upload removed (external URL only). Clearing any
        // legacy `videoLocalDataUrl` here so an old draft that still carries one converges to
        // URL-only as soon as the seller touches this field.
        media: { ...s.media, videoUrl: nextUrls[0] ?? "", videoUrls: nextUrls, videoLocalDataUrl: "" },
      };
      queueMicrotask(() => saveBienesRaicesPrivadoDraft(out));
      return out;
    });
  };

  const cat = state.categoriaPropiedad;
  const confirmAll =
    state.confirmListingAccurate && state.confirmPhotosRepresentItem && state.confirmCommunityRules;

  const pricePreview = formatPricePreviewUsd(state.precio);
  const activeVerifiedAddress =
    verifiedAddress &&
    verifiedAddress.street === state.gate12d.calleNumero &&
    (verifiedAddress.unit || "") === (state.gate12d.unidad || "") &&
    (verifiedAddress.city || "") === (state.ciudad || "") &&
    (verifiedAddress.region || "") === (state.gate12d.estado || "") &&
    (verifiedAddress.postalCode || "") === (state.gate12d.codigoPostal || "")
      ? verifiedAddress
      : null;

  const onVerAnuncio = async () => {
    if (!confirmAll) return;
    const g = gateBienesRaicesPrivadoPreview(stateRef.current);
    if (!g.ok) {
      setPreviewGateMessage(g.message);
      return;
    }
    setPreviewGateMessage(null);
    await flushSave();
    markPublishFlowOpeningPreview();
    router.push(previewHref);
  };

  const onReiniciar = () => {
    clearBienesRaicesPrivadoDraft();
    const empty = createEmptyBienesRaicesPrivadoFormState();
    try {
      const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      const p = parseBrNegocioPropiedadParam(sp.get(BR_NEGOCIO_Q_PROPIEDAD));
      setState(p ? { ...empty, categoriaPropiedad: p } : empty);
    } catch {
      setState(empty);
    }
    setPreviewGateMessage(null);
  };

  const verAnuncioValidationMessage = previewGateMessage ?? (!confirmAll ? CONFIRM_PREVIEW_BLOCKED[lang] : null);

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#F6F0E2] px-4 pb-[max(7rem,env(safe-area-inset-bottom,0px))] pt-24 text-[#2C2416] sm:px-5 sm:pb-24 sm:pt-28">
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-7 md:space-y-8">
        <LeonixCategoryApplicationHeader
          lang={lang}
          categoryTitle={
            lang === "en" ? "Leonix · Real Estate · Private" : "Leonix · Bienes Raíces · Privado"
          }
          headline={lang === "es" ? "Publicar — Particular" : "Post — Private seller"}
          hubHref={withClasificadosPublishLang(BR_PUBLICAR_HUB, routeLang)}
        />
        <LeonixApplicationDataLossNotice lang={lang} />

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>{brPrivateUi(lang, "Categoría", "Category")}</h2>
          <p className={aiSubClass}>{brPrivateUi(lang, "Elige una; los demás campos se adaptan en el formulario y en la vista previa.", "Choose one; the remaining fields adapt in the form and preview.")}</p>
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setState((s) => ({ ...s, categoriaPropiedad: c.id }))}
                className={`min-h-[48px] w-full rounded-xl border px-3 py-3 text-center text-sm font-semibold leading-snug transition sm:min-h-[44px] sm:py-2.5 ${
                  cat === c.id
                    ? "border-[#B8954A] bg-[#FFF6E7] text-[#1E1810] ring-1 ring-[#B8954A]/30"
                    : "border-[#E8DFD0] bg-white text-[#5C5346] hover:border-[#C9B46A]/60"
                }`}
              >
                {brPrivateUi(lang, c.label, c.id === "residencial" ? "Residential" : c.id === "comercial" ? "Commercial" : "Land / lot")}
              </button>
            ))}
          </div>
        </section>

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>{lang === "en" ? "Listing" : "Anuncio"}</h2>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="sm:col-span-2">
              <AiField required label={brPrivateUi(lang, "Título", "Title")}>
                <input
                  className={fieldClass}
                  value={state.titulo}
                  onChange={(e) => setState((s) => ({ ...s, titulo: e.target.value }))}
                  autoComplete="off"
                />
              </AiField>
            </div>
            <AiField
              required
              label={brPrivateUi(lang, "Precio (USD)", "Price (USD)")}
              hint={brPrivateUi(lang, "Escribe solo números; se formatea automáticamente con $ y comas.", "Enter numbers only; the price is formatted automatically with $ and commas.")}
            >
              <input
                className={fieldClass}
                inputMode="numeric"
                value={pricePreview || state.precio}
                onChange={(e) => setState((s) => ({ ...s, precio: priceDigitsUnbounded(e.target.value) }))}
                autoComplete="off"
              />
              {!pricePreview && state.precio.trim() ? (
                <p className="mt-2 text-xs text-[#5C5346]/85">{brPrivateUi(lang, "Revisa el número (debe ser mayor que cero).", "Check the number (it must be greater than zero).")}</p>
              ) : null}
            </AiField>
            <AiField label={brPrivateUi(lang, "Estado del anuncio", "Listing status")}>
              <select
                className={fieldClass}
                value={state.estadoAnuncio}
                onChange={(e) =>
                  setState((s) => ({ ...s, estadoAnuncio: e.target.value as BienesRaicesPrivadoFormState["estadoAnuncio"] }))
                }
              >
                {ESTADOS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {brPrivateUi(lang, o.label, o.id === "disponible" ? "Available" : o.id === "pendiente" ? "Pending" : o.id === "bajo_contrato" ? "Under contract" : "Sold")}
                  </option>
                ))}
              </select>
            </AiField>
            <AiField
              label={brPrivateUi(lang, "Ciudad o zona", "City or area")}
              hint={brPrivateUi(lang, "Escribe y elige una sugerencia NorCal, o escribe tu propia zona. Sirve para ubicación en el anuncio y para filtros futuros.", "Type and choose a Northern California suggestion, or enter your own area. It is used for the listing location and future filters.")}
            >
              <BrPrivadoCiudadZonaCombobox
                className={fieldClass}
                value={state.ciudad}
                onChange={(v) => setState((s) => ({ ...s, ciudad: v }))}
              />
            </AiField>
            <details className="sm:col-span-2 min-w-0 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7]/60 px-3 py-2">
              <summary className="cursor-pointer select-none text-sm font-semibold text-[#1E1810]">
                {brPrivateUi(lang, "Dirección estructurada (opcional)", "Structured address (optional)")}
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <AiField
                  label={brPrivateUi(lang, "Número y calle", "Street number and name")}
                  hint={brPrivateUi(
                    lang,
                    "Confirma una sugerencia de Google o escribe la dirección manualmente. Esto no cambia tu opción de privacidad.",
                    "Confirm a Google suggestion or enter the address manually. This does not change your privacy choice.",
                  )}
                >
                  <BusinessAddressVerifiedInput
                    key={hydrated ? "br-fsbo-address-ready" : "br-fsbo-address-loading"}
                    lang={lang}
                    value={
                      activeVerifiedAddress ?? {
                        street: state.gate12d.calleNumero,
                        unit: state.gate12d.unidad,
                        city: state.ciudad,
                        region: state.gate12d.estado,
                        postalCode: state.gate12d.codigoPostal,
                        country: "US",
                        verificationStatus: "manual",
                        provider: null,
                        providerPlaceId: null,
                        manualEntry: true,
                      }
                    }
                    locationHint={[state.ciudad, state.gate12d.estado, state.gate12d.codigoPostal]
                      .filter(Boolean)
                      .join(", ")}
                    inputClassName={fieldClass}
                    onChange={(next) => {
                      setVerifiedAddress(next);
                      setState((s) => ({
                        ...s,
                        ciudad: next.city || s.ciudad,
                        gate12d: {
                          ...s.gate12d,
                          calleNumero: next.street,
                          unidad: next.unit ?? s.gate12d.unidad,
                          estado: next.region || s.gate12d.estado,
                          codigoPostal: next.postalCode || s.gate12d.codigoPostal,
                        },
                      }));
                    }}
                  />
                </AiField>
                <AiField label={brPrivateUi(lang, "Unidad / apt / suite (opcional)", "Unit / apt / suite (optional)")}>
                  <input
                    className={fieldClass}
                    value={state.gate12d.unidad}
                    onChange={(e) => setState((s) => ({ ...s, gate12d: { ...s.gate12d, unidad: e.target.value } }))}
                    autoComplete="off"
                  />
                </AiField>
                <AiField label={brPrivateUi(lang, "Estado / provincia", "State / province")}>
                  <input
                    className={fieldClass}
                    value={state.gate12d.estado}
                    onChange={(e) => setState((s) => ({ ...s, gate12d: { ...s.gate12d, estado: e.target.value } }))}
                    autoComplete="address-level1"
                  />
                </AiField>
                <AiField label={brPrivateUi(lang, "Código postal", "ZIP / postal code")}>
                  <input
                    className={fieldClass}
                    inputMode="numeric"
                    value={state.gate12d.codigoPostal}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        gate12d: { ...s.gate12d, codigoPostal: e.target.value.replace(/[^\d-]/g, "").slice(0, 12) },
                      }))
                    }
                    autoComplete="postal-code"
                  />
                </AiField>
                <div className="sm:col-span-2">
                  <AiField label={brPrivateUi(lang, "Colonia / vecindario (opcional)", "Neighborhood (optional)")}>
                    <input
                      className={fieldClass}
                      value={state.gate12d.colonia}
                      onChange={(e) => setState((s) => ({ ...s, gate12d: { ...s.gate12d, colonia: e.target.value } }))}
                      autoComplete="off"
                    />
                  </AiField>
                </div>
              </div>
            </details>
            <AiField
              label={brPrivateUi(lang, "Referencia adicional (opcional)", "Additional location reference (optional)")}
              hint={brPrivateUi(lang, "Texto libre si quieres añadir contexto (cruces, puntos de referencia). No sustituye a la dirección estructurada arriba.", "Free text for extra context such as cross streets or landmarks. It does not replace the structured address above.")}
            >
              <input
                className={fieldClass}
                value={state.ubicacionLinea}
                onChange={(e) => setState((s) => ({ ...s, ubicacionLinea: e.target.value }))}
                autoComplete="off"
              />
            </AiField>
            <AiField
              label={brPrivateUi(lang, "Mostrar dirección exacta cuando aplique", "Show exact address when applicable")}
              hint={brPrivateUi(lang, "Si no activas esta opción, mostraremos una ubicación aproximada.", "If you do not enable this option, we will show an approximate location.")}
            >
              <label className="flex min-h-[44px] items-center gap-3 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2 text-sm text-[#2C2416]">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={Boolean(state.mostrarDireccionExacta)}
                  onChange={(e) => setState((s) => ({ ...s, mostrarDireccionExacta: e.target.checked }))}
                />
                <span className="min-w-0">
                  {brPrivateUi(lang, "Mostrar calle y unidad en vista previa, resultados y mapa cuando la información estructurada esté completa.", "Show street and unit in preview, results, and map when the structured address is complete.")}
                </span>
              </label>
            </AiField>
            <p className="sm:col-span-2 text-xs text-[#5C5346]">
              {brPrivateUi(lang, "Para vista previa: ciudad o línea de ubicación (al menos uno)", "For preview: city or location line (at least one)")}
              <span className="text-[#B8954A]" aria-hidden>
                {" "}
                *
              </span>
              .
            </p>
            {/* BR-INV-FINAL-WAVE-D: manual "Enlace a mapa" input removed per product direction — maps/
                directions are derived from the structured address instead. state.enlaceMapa stays in
                the schema/mapper for backward-compat reads of already-stored drafts/listings; new
                entries simply never populate it again. */}
            <div className="sm:col-span-2">
              <AiField
                label={brPrivateUi(lang, "Descripción principal", "Main description")}
                hint={brPrivateUi(lang, "Describe la propiedad, el espacio, las reglas importantes y lo que debe saber la persona interesada.", "Describe the property, the space, important rules, and what an interested person should know.")}
              >
                <textarea
                  className={textareaFieldClass}
                  rows={8}
                  value={state.descripcion}
                  onChange={(e) => setState((s) => ({ ...s, descripcion: e.target.value }))}
                />
              </AiField>
            </div>
            <div className="sm:col-span-2">
              <AiField
                label={brPrivateUi(lang, "¿Se permiten mascotas?", "Are pets allowed?")}
                hint={brPrivateUi(lang, "Requerido para publicar: se guarda como dato estructurado y alimenta el filtro “Mascotas” en resultados. En el anuncio publicado, el detalle de mascotas va en la sección HOA y comunidad (no como chip genérico).", "Required to publish: this is stored as structured data and powers the Pets filter in results. In the published listing, pet details appear in the HOA and community section, not as a generic chip.")}
              >
                <select
                  className={fieldClass}
                  value={state.petsAllowed}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      petsAllowed: e.target.value as BienesRaicesPrivadoFormState["petsAllowed"],
                    }))
                  }
                >
                  <option value="">{brPrivateUi(lang, "Selecciona…", "Select…")}</option>
                  <option value="yes">{brPrivateUi(lang, "Sí, se permiten", "Yes, pets allowed")}</option>
                  <option value="no">{brPrivateUi(lang, "No, no se permiten", "No, pets not allowed")}</option>
                </select>
              </AiField>
            </div>
            <BrGate12dHoaCommunitySection
              variant="privado"
              lang={lang}
              gate12d={state.gate12d}
              onChange={(patch) =>
                setState((s) => ({
                  ...s,
                  gate12d: { ...s.gate12d, ...patch },
                }))
              }
            />
            <details className="sm:col-span-2 min-w-0 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7]/60 px-3 py-2">
              <summary className="cursor-pointer select-none text-sm font-semibold text-[#1E1810]">
                {brPrivateUi(lang, "Open house y visitas (opcional)", "Open house and showings (optional)")}
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <AiField label={brPrivateUi(lang, "Open house activo", "Open house active")}>
                  <label className="flex min-h-[44px] items-center gap-2 text-sm text-[#2C2416]">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={state.gate12d.openHouseEnabled}
                      onChange={(e) =>
                        setState((s) => ({ ...s, gate12d: { ...s.gate12d, openHouseEnabled: e.target.checked } }))
                      }
                    />
                    {brPrivateUi(lang, "Sí, planeo un open house", "Yes, I plan an open house")}
                  </label>
                </AiField>
                <div className="sm:col-span-2">
                  <BrPrivadoOpenHouseSlots state={state} setState={setState} fieldClass={fieldClass} lang={lang} />
                </div>
                <AiField label={brPrivateUi(lang, "Visitas solo con cita", "Showings by appointment only")}>
                  <label className="flex min-h-[44px] items-center gap-2 text-sm text-[#2C2416]">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={state.gate12d.showingByAppointment}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          gate12d: { ...s.gate12d, showingByAppointment: e.target.checked },
                        }))
                      }
                    />
                    {brPrivateUi(lang, "Sí", "Yes")}
                  </label>
                </AiField>
                <div className="sm:col-span-2">
                  <AiField label={brPrivateUi(lang, "Instrucciones para visitas", "Showing instructions")}>
                    <textarea
                      className={textareaFieldClass}
                      rows={3}
                      value={state.gate12d.showingInstructions}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          gate12d: { ...s.gate12d, showingInstructions: e.target.value },
                        }))
                      }
                    />
                  </AiField>
                </div>
                <div className="sm:col-span-2">
                  <AiField label={brPrivateUi(lang, "Tour virtual (URL https, opcional)", "Virtual tour (HTTPS URL, optional)")} hint="Matterport, YouTube 360, etc.">
                    <input
                      className={fieldClass}
                      type="url"
                      placeholder="https://"
                      value={state.gate12d.virtualTourUrl}
                      onChange={(e) =>
                        setState((s) => ({ ...s, gate12d: { ...s.gate12d, virtualTourUrl: e.target.value } }))
                      }
                    />
                  </AiField>
                  {/^https?:\/\/\S+/i.test(state.gate12d.virtualTourUrl.trim()) ? (
                    <p className="mt-2 text-xs font-bold text-[#2F6B3C]">{brPrivateUi(lang, "Enlace añadido", "Link added")}</p>
                  ) : null}
                </div>
              </div>
            </details>
          </div>
        </section>

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>{brPrivateUi(lang, "Fotos y video", "Photos and video")}</h2>
          <p className={aiSubClass}>
            {brPrivateUi(lang, `Hasta ${MAX_PHOTOS} fotos (se comprimen en el navegador). Para una vista previa completa hace falta al menos una foto`, `Up to ${MAX_PHOTOS} photos (compressed in the browser). A complete preview needs at least one photo`)}
            <span className="text-[#B8954A]" aria-hidden>
              {" "}
              *
            </span>
            {brPrivateUi(lang, ". Un solo video por enlace (opcional). Nada se sube a servidores en este paso; el borrador vive en esta sesión hasta que exista publicación.", ". One video per external link (optional). Nothing is uploaded to servers in this step; the draft remains in this session until publishing.")}
          </p>
          {mediaNotice ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950" role="status">
              {mediaNotice}
            </p>
          ) : null}
          <div className="mt-4">
            <span className={aiLabelClass}>{brPrivateUi(lang, "Fotos del anuncio", "Listing photos")}</span>
            <input
              ref={photosInputRef}
              type="file"
              accept="image/*"
              multiple
              aria-label={brPrivateUi(lang, "Fotos del anuncio", "Listing photos")}
              className="sr-only"
              onChange={(e) => onPhotos(e.target.files)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#C9B46A]/70 bg-[#FFF6E7] px-4 text-sm font-semibold text-[#1E1810] transition hover:bg-[#FFEFD8]"
                onClick={() => photosInputRef.current?.click()}
              >
                {brPrivateUi(lang, "Subir o añadir fotos", "Upload or add photos")}
              </button>
              <span className="self-center text-xs text-[#5C5346]">
                {state.media.photoDataUrls.length}/{MAX_PHOTOS} {brPrivateUi(lang, "seleccionadas", "selected")}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#5C5346]">
              {lang === "en" ? <>Each photo is a preview card. Use <strong className="text-[#1E1810]">⋮⋮ Order</strong>{" "}to drag and reorder. The cover can be different from the first slot.</> : <>Cada foto es una tarjeta con vista previa. Usa el control <strong className="text-[#1E1810]">⋮⋮ Orden</strong>{" "}para arrastrar y reordenar. La portada puede ser distinta del primer casillero.</>}
            </p>
            {state.media.photoDataUrls.length > 0 ? (
              <LeonixRealEstateSortablePhotoStrip
                urls={state.media.photoDataUrls}
                primaryImageIndex={state.media.primaryImageIndex}
                onReorder={(nextUrls, nextPrimary) => {
                  setState((s) => {
                    const out: BienesRaicesPrivadoFormState = {
                      ...s,
                      media: { ...s.media, photoDataUrls: nextUrls, primaryImageIndex: nextPrimary },
                    };
                    queueMicrotask(() => saveBienesRaicesPrivadoDraft(out));
                    return out;
                  });
                }}
                onRemove={(i) =>
                  setState((s) => {
                    const urls = s.media.photoDataUrls.filter((_, j) => j !== i);
                    let pi = s.media.primaryImageIndex;
                    if (pi >= urls.length) pi = Math.max(0, urls.length - 1);
                    const out: BienesRaicesPrivadoFormState = {
                      ...s,
                      media: { ...s.media, photoDataUrls: urls, primaryImageIndex: pi },
                    };
                    queueMicrotask(() => saveBienesRaicesPrivadoDraft(out));
                    return out;
                  })
                }
                onSetPrimary={(i) =>
                  setState((s) => {
                    const out: BienesRaicesPrivadoFormState = {
                      ...s,
                      media: { ...s.media, primaryImageIndex: i },
                    };
                    queueMicrotask(() => saveBienesRaicesPrivadoDraft(out));
                    return out;
                  })
                }
              />
            ) : null}
          </div>
          <div className="mt-6 border-t border-[#E8DFD0] pt-5">
            <span className={aiLabelClass}>{brPrivateUi(lang, "Video (opcional)", "Video (optional)")}</span>
            <p className={aiHintClass}>
              {brPrivateUi(lang, `Comparte hasta ${MAX_PRIVADO_VIDEO_URLS} enlaces externos (YouTube, Vimeo, mp4, etc.). No se aceptan archivos de video del dispositivo.`, `Share up to ${MAX_PRIVADO_VIDEO_URLS} external links (YouTube, Vimeo, MP4, etc.). Video files from the device are not accepted.`)}
            </p>
            <div className="mt-4">
              <LeonixVideoUrlAddRows
                values={normalizePrivadoVideoUrls(state.media.videoUrls.length ? state.media.videoUrls : [state.media.videoUrl])}
                max={MAX_PRIVADO_VIDEO_URLS}
                onChange={(next) => {
                  for (let i = 0; i < next.length; i++) onVideoUrlChange(i, next[i]);
                }}
                fieldLabel={brPrivateUi(lang, "Video por enlace", "Video by link")}
                urlLabel={(n) => (n === 1 ? brPrivateUi(lang, "Video por enlace", "Video by link") : brPrivateUi(lang, `Video ${n} por enlace`, `Video ${n} by link`))}
                addLabel={brPrivateUi(lang, "+ Agregar video", "+ Add video")}
                removeLabel={brPrivateUi(lang, "Quitar", "Remove")}
                addedLabel={brPrivateUi(lang, "Video añadido", "Video added")}
              />
            </div>
          </div>
        </section>

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>{brPrivateUi(lang, "Propietario (particular)", "Owner (private seller)")}</h2>
          <p className={aiSubClass}>
            {brPrivateUi(lang, "Tu nombre y cómo te contactan. No se pide sitio web ni redes sociales. Para vista previa: nombre", "Your name and how people can contact you. No website or social media is requested. For preview: name")}
            <span className="text-[#B8954A]" aria-hidden>
              {" "}
              *
            </span>{" "}
            {brPrivateUi(lang, "y al menos un medio de contacto (teléfono, WhatsApp o correo)", "and at least one contact method (phone, WhatsApp, or email)")}
            <span className="text-[#B8954A]" aria-hidden>
              {" "}
              *
            </span>
            .
          </p>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="sm:col-span-2">
              <span className={aiLabelClass}>{brPrivateUi(lang, "Foto del propietario (opcional)", "Owner photo (optional)")}</span>
              <input
                ref={ownerPhotoInputRef}
                type="file"
                accept="image/*"
                aria-label={brPrivateUi(lang, "Foto del propietario", "Owner photo")}
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (ownerPhotoInputRef.current) ownerPhotoInputRef.current.value = "";
                  if (!f) return;
                  setSellerPhotoNotice(null);
                  if (!f.type.startsWith("image/")) {
                    setSellerPhotoNotice(brPrivateUi(lang, "Elige un archivo de imagen válido.", "Choose a valid image file."));
                    return;
                  }
                  if (f.size > MAX_SELLER_PHOTO_BYTES) {
                    setSellerPhotoNotice(brPrivateUi(lang, `La foto supera ${Math.round(MAX_SELLER_PHOTO_BYTES / (1024 * 1024))} MB. Elige una imagen más ligera.`, `The photo exceeds ${Math.round(MAX_SELLER_PHOTO_BYTES / (1024 * 1024))} MB. Choose a smaller image.`));
                    return;
                  }
                  try {
                    const data = await compressImageFileToJpegDataUrl(f);
                    setState((s) => {
                      const out: BienesRaicesPrivadoFormState = { ...s, seller: { ...s.seller, fotoDataUrl: data } };
                      queueMicrotask(() => saveBienesRaicesPrivadoDraft(out));
                      return out;
                    });
                  } catch {
                    setSellerPhotoNotice(brPrivateUi(lang, "No se pudo leer la foto. Inténtalo de nuevo.", "The photo could not be read. Try again."));
                  }
                }}
              />
              <div className="mt-2 flex flex-wrap items-start gap-3">
                <button
                  type="button"
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border border-[#C9B46A]/70 bg-[#FFF6E7] px-4 text-sm font-semibold text-[#1E1810] transition hover:bg-[#FFEFD8]"
                  onClick={() => ownerPhotoInputRef.current?.click()}
                >
                  {brPrivateUi(lang, "Subir foto", "Upload photo")}
                </button>
                {state.seller.fotoDataUrl ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    { }
                    <img
                      src={state.seller.fotoDataUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-full border border-[#E8DFD0] object-cover"
                    />
                    <button
                      type="button"
                      className="text-left text-xs font-bold text-[#B8954A] underline"
                      onClick={() => {
                        setSellerPhotoNotice(null);
                        setState((s) => {
                          const out: BienesRaicesPrivadoFormState = { ...s, seller: { ...s.seller, fotoDataUrl: "" } };
                          queueMicrotask(() => saveBienesRaicesPrivadoDraft(out));
                          return out;
                        });
                      }}
                    >
                      {brPrivateUi(lang, "Quitar foto", "Remove photo")}
                    </button>
                  </div>
                ) : null}
              </div>
              {sellerPhotoNotice ? <p className="mt-2 text-xs font-semibold text-[#9A3B1F]">{sellerPhotoNotice}</p> : null}
            </div>
            <AiField required label={brPrivateUi(lang, "Nombre completo", "Full name")}>
              <input
                className={fieldClass}
                value={state.seller.nombre}
                onChange={(e) => setState((s) => ({ ...s, seller: { ...s.seller, nombre: e.target.value } }))}
                autoComplete="name"
              />
            </AiField>
            <AiField label={brPrivateUi(lang, "Teléfono", "Phone")} hint={brPrivateUi(lang, "Número de 10 dígitos en EE. UU., sin el 1 inicial (para que no se duplique al marcar).", "10-digit U.S. number without the leading 1.")}>
              <input
                className={fieldClass}
                inputMode="numeric"
                value={formatUsPhoneDisplay(digitsOnly(state.seller.telefono))}
                onChange={(e) => {
                  const prev = digitsOnly(state.seller.telefono);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, seller: { ...s.seller, telefono: display } }));
                }}
                autoComplete="tel"
              />
            </AiField>
            <AiField label="WhatsApp" hint={brPrivateUi(lang, "Puede ser el mismo número de teléfono o uno diferente.", "It can be the same phone number or a different one.")}>
              <input
                className={fieldClass}
                inputMode="numeric"
                value={formatUsPhoneDisplay(digitsOnly(state.seller.whatsapp))}
                onChange={(e) => {
                  const prev = digitsOnly(state.seller.whatsapp);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, seller: { ...s.seller, whatsapp: display } }));
                }}
                autoComplete="tel"
              />
            </AiField>
            <AiField label={brPrivateUi(lang, "Número para mensajes de texto (SMS, opcional)", "Text message number (SMS, optional)")} hint={brPrivateUi(lang, "Puede ser el mismo número de teléfono o uno diferente.", "It can be the same phone number or a different one.")}>
              <input
                className={fieldClass}
                inputMode="numeric"
                value={formatUsPhoneDisplay(digitsOnly(state.seller.mensajesTexto))}
                onChange={(e) => {
                  const prev = digitsOnly(state.seller.mensajesTexto);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, seller: { ...s.seller, mensajesTexto: display } }));
                }}
                autoComplete="tel"
              />
            </AiField>
            <div className="sm:col-span-2">
              <AiField label={brPrivateUi(lang, "Correo electrónico", "Email")}>
                <input
                  className={fieldClass}
                  type="email"
                  value={state.seller.correo}
                  onChange={(e) => setState((s) => ({ ...s, seller: { ...s.seller, correo: e.target.value } }))}
                  autoComplete="email"
                />
              </AiField>
            </div>
            <div className="sm:col-span-2">
              <AiField label={brPrivateUi(lang, "Mensaje para interesados (opcional)", "Message for interested people (optional)")} hint={brPrivateUi(lang, "Texto breve que verán antes de escribirte o llamarte.", "Brief text they will see before messaging or calling you.")}>
                <textarea
                  className={textareaFieldClass}
                  rows={3}
                  value={state.seller.notaContacto}
                  onChange={(e) => setState((s) => ({ ...s, seller: { ...s.seller, notaContacto: e.target.value } }))}
                />
              </AiField>
            </div>
          </div>
        </section>

        {cat === "residencial" ? (
          <section className={`${aiCardClass} min-w-0`}>
            <h2 className={aiTitleClass}>{brPrivateUi(lang, "Detalle residencial", "Residential details")}</h2>
            <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
              <AiField label={brPrivateUi(lang, "Tipo", "Type")}>
                <select
                  className={fieldClass}
                  value={state.residencial.tipoCodigo}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      residencial: { ...s.residencial, tipoCodigo: e.target.value as typeof s.residencial.tipoCodigo, subtipo: "" },
                    }))
                  }
                >
                  {TIPO_PROPIEDAD_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {lang === "en" ? TIPO_PROPIEDAD_LABEL_EN[o.value] : o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label={brPrivateUi(lang, "Subtipo", "Subtype")}>
                <select
                  className={fieldClass}
                  value={state.residencial.subtipo}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, subtipo: e.target.value } }))}
                >
                  {selectableSubtipoOptionsForTipo(state.residencial.tipoCodigo, state.residencial.subtipo).map((o) => (
                    <option key={o.value || "none"} value={o.value}>
                      {lang === "en" ? SUBTIPO_SUBVALUE_LABEL_EN[o.value] ?? o.label : o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label={brPrivateUi(lang, "Niveles / pisos", "Levels / stories")} hint={brPrivateUi(lang, "Opcional. Distinto del subtipo (ej. condominio de 2 niveles).", "Optional. Separate from subtype (for example, a two-level condominium).")}>
                <select
                  className={fieldClass}
                  value={state.residencial.niveles}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, niveles: e.target.value } }))}
                >
                  <option value="">{brPrivateUi(lang, "— No indicado", "— Not specified")}</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3+">3+</option>
                </select>
              </AiField>
              <AiField label={brPrivateUi(lang, "Recámaras", "Bedrooms")}>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.residencial.recamaras}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, recamaras: e.target.value } }))}
                />
              </AiField>
              <AiField label={brPrivateUi(lang, "Baños completos", "Full bathrooms")}>
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  value={state.residencial.banos}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, banos: e.target.value } }))}
                />
              </AiField>
              <AiField label={brPrivateUi(lang, "Medios baños", "Half bathrooms")}>
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  value={state.residencial.mediosBanos}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, mediosBanos: e.target.value } }))}
                />
              </AiField>
              <AiField label={brPrivateUi(lang, "Interior (ft²)", "Interior (ft²)")}>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.residencial.interiorSqft}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, interiorSqft: e.target.value } }))}
                />
                <BrSqftPreview value={state.residencial.interiorSqft} lang={lang} />
              </AiField>
              <AiField label={brPrivateUi(lang, "Lote (ft²)", "Lot (ft²)")}>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.residencial.loteSqft}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, loteSqft: e.target.value } }))}
                />
                <BrSqftPreview value={state.residencial.loteSqft} lang={lang} />
              </AiField>
              <AiField label={brPrivateUi(lang, "Estacionamiento", "Parking")}>
                <input
                  className={fieldClass}
                  value={state.residencial.estacionamiento}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, estacionamiento: e.target.value } }))}
                />
              </AiField>
              <AiField label={brPrivateUi(lang, "Año de construcción", "Year built")}>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.residencial.ano}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, ano: e.target.value } }))}
                />
              </AiField>
              <AiField label={brPrivateUi(lang, "Condición", "Condition")}>
                <select
                  className={fieldClass}
                  value={state.residencial.condicion}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      residencial: { ...s.residencial, condicion: e.target.value as typeof s.residencial.condicion },
                    }))
                  }
                >
                  {CONDICION_OPTS.map((o) => (
                    <option key={o.value || "x"} value={o.value}>
                      {brPrivateUi(lang, o.label, o.value === "excelente" ? "Excellent" : o.value === "buena" ? "Good" : o.value === "regular" ? "Fair" : o.value === "necesita_reparacion" ? "Needs repair" : "—")}
                    </option>
                  ))}
                </select>
              </AiField>
            </div>
            <div className="mt-6">
              <span className={aiLabelClass}>{brPrivateUi(lang, "Destacados", "Highlights")}</span>
              <p className={aiHintClass}>{brPrivateUi(lang, "Opcional: qué destacar en la vista previa.", "Optional: choose what to highlight in preview.")}</p>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {BR_HIGHLIGHT_PRESET_DEFS.map((d) => (
                  <label key={d.key} className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                      checked={state.residencial.highlightKeys.includes(d.key)}
                      onChange={(e) =>
                        setState((s) => {
                          const set = new Set(s.residencial.highlightKeys);
                          if (e.target.checked) set.add(d.key);
                          else set.delete(d.key);
                          return { ...s, residencial: { ...s.residencial, highlightKeys: [...set] } };
                        })
                      }
                    />
                    <span className="min-w-0 flex-1">{lang === "en" ? BR_HIGHLIGHT_PRESET_EN[d.key] ?? d.label : d.label}</span>
                  </label>
                ))}
              </div>
              <LeonixCustomHighlightChipAdd
                label={brPrivateUi(lang, "Agregar otra característica", "Add another feature")}
                placeholder={brPrivateUi(lang, "Ej. Piso de mármol", "E.g. Marble flooring")}
                addLabel={brPrivateUi(lang, "Añadir", "Add")}
                removeAriaLabel={(label) => brPrivateUi(lang, `Quitar: ${label}`, `Remove: ${label}`)}
                capReachedLabel={brPrivateUi(lang, "Alcanzaste el máximo de características personalizadas.", "You've reached the maximum custom features.")}
                pendingValue={state.residencial.pendingCustomHighlight}
                onPendingChange={(next) =>
                  setState((s) => ({ ...s, residencial: { ...s.residencial, pendingCustomHighlight: next } }))
                }
                canAdd={Boolean(state.residencial.pendingCustomHighlight.trim())}
                atCap={
                  state.residencial.highlightKeys.filter((k) => !BR_HIGHLIGHT_PRESET_DEFS.some((d) => d.key === k))
                    .length >= 8
                }
                customValues={state.residencial.highlightKeys.filter(
                  (k) => !BR_HIGHLIGHT_PRESET_DEFS.some((d) => d.key === k),
                )}
                onAdd={() =>
                  setState((s) => {
                    const custom = s.residencial.highlightKeys.filter(
                      (k) => !BR_HIGHLIGHT_PRESET_DEFS.some((d) => d.key === k),
                    );
                    const r = evaluateAddCustomHighlight({
                      raw: s.residencial.pendingCustomHighlight,
                      existingValues: custom,
                      standardLabels: BR_HIGHLIGHT_PRESET_DEFS.map((d) => d.label),
                    });
                    if (!r.ok) return s;
                    const out: BienesRaicesPrivadoFormState = {
                      ...s,
                      residencial: {
                        ...s.residencial,
                        highlightKeys: [...s.residencial.highlightKeys, r.label],
                        pendingCustomHighlight: "",
                      },
                    };
                    queueMicrotask(() => saveBienesRaicesPrivadoDraft(out));
                    return out;
                  })
                }
                onRemove={(customIndex) =>
                  setState((s) => {
                    const custom = s.residencial.highlightKeys.filter(
                      (k) => !BR_HIGHLIGHT_PRESET_DEFS.some((d) => d.key === k),
                    );
                    const toRemove = custom[customIndex];
                    const out: BienesRaicesPrivadoFormState = {
                      ...s,
                      residencial: {
                        ...s.residencial,
                        highlightKeys: s.residencial.highlightKeys.filter((k) => k !== toRemove),
                      },
                    };
                    queueMicrotask(() => saveBienesRaicesPrivadoDraft(out));
                    return out;
                  })
                }
                inputClassName={fieldClass}
                labelClassName={aiLabelClass}
              />
            </div>
          </section>
        ) : null}

        {cat === "comercial" ? (
          <section className={`${aiCardClass} min-w-0`}>
            <h2 className={aiTitleClass}>{brPrivateUi(lang, "Detalle comercial", "Commercial details")}</h2>
            <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
              <AiField label={brPrivateUi(lang, "Tipo comercial", "Commercial type")}>
                <select
                  className={fieldClass}
                  value={state.comercial.tipoCodigo}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      comercial: { ...s.comercial, tipoCodigo: e.target.value as typeof s.comercial.tipoCodigo, subtipo: "" },
                    }))
                  }
                >
                  {COMERCIAL_TIPO_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {lang === "en" ? COMERCIAL_TIPO_LABEL_EN[o.value] : o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label={brPrivateUi(lang, "Subtipo", "Subtype")}>
                <select
                  className={fieldClass}
                  value={state.comercial.subtipo}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, subtipo: e.target.value } }))}
                >
                  {COMERCIAL_SUBTIPO_POR_TIPO[state.comercial.tipoCodigo].map((o) => (
                    <option key={o.value || "none"} value={o.value}>
                      {lang === "en" ? COMERCIAL_SUBVALUE_LABEL_EN[o.value] ?? o.label : o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <div className="sm:col-span-2">
                <AiField label={brPrivateUi(lang, "Uso", "Use")}>
                  <input
                    className={fieldClass}
                    value={state.comercial.uso}
                    onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, uso: e.target.value } }))}
                  />
                </AiField>
              </div>
              <AiField label={brPrivateUi(lang, "Interior (ft²)", "Interior (ft²)")}>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.comercial.interiorSqft}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, interiorSqft: e.target.value } }))}
                />
                <BrSqftPreview value={state.comercial.interiorSqft} lang={lang} />
              </AiField>
              <AiField label={brPrivateUi(lang, "Oficinas", "Offices")}>
                <input
                  className={fieldClass}
                  value={state.comercial.oficinas}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, oficinas: e.target.value } }))}
                />
              </AiField>
              <AiField label={brPrivateUi(lang, "Baños", "Bathrooms")}>
                <input
                  className={fieldClass}
                  value={state.comercial.banos}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, banos: e.target.value } }))}
                />
              </AiField>
              <AiField label={brPrivateUi(lang, "Niveles", "Levels")}>
                <input
                  className={fieldClass}
                  value={state.comercial.niveles}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, niveles: e.target.value } }))}
                />
              </AiField>
              <AiField label={brPrivateUi(lang, "Estacionamiento", "Parking")}>
                <input
                  className={fieldClass}
                  value={state.comercial.estacionamiento}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, estacionamiento: e.target.value } }))}
                />
              </AiField>
              <AiField label={brPrivateUi(lang, "Zonificación", "Zoning")}>
                <input
                  className={fieldClass}
                  value={state.comercial.zonificacion}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, zonificacion: e.target.value } }))}
                />
              </AiField>
              <AiField label={brPrivateUi(lang, "Condición", "Condition")}>
                <select
                  className={fieldClass}
                  value={state.comercial.condicion}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      comercial: { ...s.comercial, condicion: e.target.value as typeof s.comercial.condicion },
                    }))
                  }
                >
                  {CONDICION_OPTS.map((o) => (
                    <option key={`c-${o.value || "x"}`} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <label className="flex cursor-pointer items-start gap-3 sm:col-span-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                  checked={state.comercial.accesoCarga}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, accesoCarga: e.target.checked } }))}
                />
                <span className="text-sm font-medium text-[#2C2416]">{brPrivateUi(lang, "Acceso de carga", "Loading access")}</span>
              </label>
            </div>
            <div className="mt-6">
              <span className={aiLabelClass}>{brPrivateUi(lang, "Destacados", "Highlights")}</span>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {COMERCIAL_DESTACADOS_CHECKLIST_DEFS.map((d) => (
                  <label key={d.id} className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                      checked={state.comercial.destacadoIds.includes(d.id)}
                      onChange={(e) =>
                        setState((s) => {
                          const set = new Set(s.comercial.destacadoIds);
                          if (e.target.checked) set.add(d.id);
                          else set.delete(d.id);
                          return { ...s, comercial: { ...s.comercial, destacadoIds: [...set] } };
                        })
                      }
                    />
                    <span className="min-w-0 flex-1">{lang === "en" ? COMERCIAL_DESTACADO_EN[d.id] ?? d.label : d.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {cat === "terreno_lote" ? (
          <section className={`${aiCardClass} min-w-0`}>
            <h2 className={aiTitleClass}>{brPrivateUi(lang, "Detalle terreno / lote", "Land / lot details")}</h2>
            <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
              <AiField label={brPrivateUi(lang, "Tipo", "Type")}>
                <select
                  className={fieldClass}
                  value={state.terreno.tipoCodigo}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      terreno: { ...s.terreno, tipoCodigo: e.target.value as typeof s.terreno.tipoCodigo, subtipo: "" },
                    }))
                  }
                >
                  {TERRENO_TIPO_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {lang === "en" ? TERRENO_TIPO_LABEL_EN[o.value] : o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label={brPrivateUi(lang, "Subtipo", "Subtype")}>
                <select
                  className={fieldClass}
                  value={state.terreno.subtipo}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, subtipo: e.target.value } }))}
                >
                  {TERRENO_SUBTIPO_POR_TIPO[state.terreno.tipoCodigo].map((o) => (
                    <option key={o.value || "none"} value={o.value}>
                      {lang === "en" ? TERRENO_SUBVALUE_LABEL_EN[o.value] ?? o.label : o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label={brPrivateUi(lang, "Lote (ft²)", "Lot (ft²)")}>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.terreno.loteSqft}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, loteSqft: e.target.value } }))}
                />
                <BrSqftPreview value={state.terreno.loteSqft} lang={lang} />
              </AiField>
              <AiField label={brPrivateUi(lang, "Uso / zonificación", "Use / zoning")}>
                <input
                  className={fieldClass}
                  value={state.terreno.usoZonificacion}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, usoZonificacion: e.target.value } }))}
                />
              </AiField>
              <AiField label={brPrivateUi(lang, "Acceso", "Access")}>
                <input
                  className={fieldClass}
                  value={state.terreno.acceso}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, acceso: e.target.value } }))}
                />
              </AiField>
              <AiField label={brPrivateUi(lang, "Servicios", "Utilities")}>
                <input
                  className={fieldClass}
                  value={state.terreno.servicios}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, servicios: e.target.value } }))}
                />
              </AiField>
              <AiField label={brPrivateUi(lang, "Topografía", "Topography")}>
                <input
                  className={fieldClass}
                  value={state.terreno.topografia}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, topografia: e.target.value } }))}
                />
              </AiField>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                  checked={state.terreno.listoConstruir}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, listoConstruir: e.target.checked } }))}
                />
                <span className="text-sm font-medium">{brPrivateUi(lang, "Listo para construir", "Ready to build")}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                  checked={state.terreno.cercado}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, cercado: e.target.checked } }))}
                />
                <span className="text-sm font-medium">{brPrivateUi(lang, "Cercado", "Fenced")}</span>
              </label>
            </div>
            <div className="mt-6">
              <span className={aiLabelClass}>{brPrivateUi(lang, "Destacados", "Highlights")}</span>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {TERRENO_DESTACADOS_CHECKLIST_DEFS.map((d) => (
                  <label key={d.id} className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                      checked={state.terreno.destacadoIds.includes(d.id)}
                      onChange={(e) =>
                        setState((s) => {
                          const set = new Set(s.terreno.destacadoIds);
                          if (e.target.checked) set.add(d.id);
                          else set.delete(d.id);
                          return { ...s, terreno: { ...s.terreno, destacadoIds: [...set] } };
                        })
                      }
                    />
                    <span className="min-w-0 flex-1">{lang === "en" ? TERRENO_DESTACADO_EN[d.id] ?? d.label : d.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="min-w-0 space-y-5 rounded-2xl border border-[#E8DFD0] bg-[#FFFBF7] p-4 sm:p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">
              {lang === "es" ? "Confirmaciones y vista previa" : "Confirmations and preview"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#5C5346]/90">
              {lang === "es"
                ? "Marca las casillas, abre «Vista previa» para revisar el borrador y, si todo está bien, publica en vivo desde la pantalla de vista previa."
                : "Check the boxes, open “Preview” to review your draft, then publish live from the preview screen when you are ready."}
            </p>
          </div>
          <ListingRulesConfirmationSection
            lang={lang}
            subject="property"
            confirmAccurate={state.confirmListingAccurate}
            confirmPhotos={state.confirmPhotosRepresentItem}
            confirmRules={state.confirmCommunityRules}
            onAccurate={(v) => setState((s) => ({ ...s, confirmListingAccurate: v }))}
            onPhotos={(v) => setState((s) => ({ ...s, confirmPhotosRepresentItem: v }))}
            onRules={(v) => setState((s) => ({ ...s, confirmCommunityRules: v }))}
          />
          <LeonixApplicationVerAnuncioActions
            lang={lang}
            onVerAnuncio={onVerAnuncio}
            disableVerAnuncio={!confirmAll}
            validationMessage={verAnuncioValidationMessage}
            onReiniciar={onReiniciar}
            labels={
              lang === "en"
                ? {
                    verAnuncio: "Preview",
                    reiniciar: "Clear progress and restart",
                  }
                : {
                    verAnuncio: "Vista previa",
                    reiniciar: "Borrar progreso y reiniciar",
                  }
            }
          />
        </section>
      </div>
    </main>
  );
}
