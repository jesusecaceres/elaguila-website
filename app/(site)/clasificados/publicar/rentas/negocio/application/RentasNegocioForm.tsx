"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ListingRulesConfirmationSection from "@/app/clasificados/en-venta/shared/components/ListingRulesConfirmationSection";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  parseBrNegocioPropiedadParam,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { ClasificadosApplicationTopActions } from "@/app/clasificados/lib/publishUi/ClasificadosApplicationTopActions";
import { gateRentasNegocioPreview } from "@/app/clasificados/lib/publish/leonixRequiredForPreviewGates";
import {
  RENTAS_PREVIEW_NEGOCIO,
  RENTAS_PUBLICAR_NEGOCIO_PUBLIC_ENTRY,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";
import { Gate12cContactChannelsFields } from "@/app/clasificados/publicar/shared/Gate12cContactChannelsFields";
import { RENTAS_RESIDENCIAL_HIGHLIGHT_FORM_VISUAL } from "@/app/clasificados/rentas/shared/rentasResidencialHighlightFormVisuals";
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
import {
  compressImageFileToJpegDataUrl,
} from "@/app/clasificados/publicar/bienes-raices/privado/application/utils/brPrivadoMediaCompress";
import { LeonixRealEstateSortablePhotoStrip } from "@/app/clasificados/lib/LeonixRealEstateSortablePhotoStrip";
import { RentasAnuncioFormSection } from "@/app/clasificados/publicar/rentas/shared/RentasAnuncioFormSection";
import { RentasShowingTourSection } from "@/app/clasificados/publicar/rentas/shared/RentasShowingTourSection";
import {
  rentasFlowGroupActive,
  rentasResidencialFormRowsMode,
} from "@/app/clasificados/rentas/shared/rentasRentalTypeApply";
import {
  COMERCIAL_DESTACADOS_DEFS,
  COMERCIAL_SUBTIPO_POR_TIPO,
  COMERCIAL_TIPO_OPCIONES,
  TERRENO_DESTACADOS_DEFS,
  TERRENO_SUBTIPO_POR_TIPO,
  TERRENO_TIPO_OPCIONES,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteComercialTerrenoMeta";
import { SUBTIPO_POR_TIPO, TIPO_PROPIEDAD_OPCIONES } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteResidencialTipoMeta";
import {
  createEmptyRentasNegocioFormState,
  type RentasNegocioFormState,
} from "../schema/rentasNegocioFormState";
import {
  clearRentasNegocioDraft,
  loadRentasNegocioDraft,
  saveRentasNegocioDraft,
} from "./utils/rentasNegocioDraft";
import { formatRentasSqftPreview } from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";

const MAX_PHOTOS = 8;
const MAX_VIDEO_URLS = 4;

function RentasSqftPreview({ value }: { value: string }) {
  const shown = formatRentasSqftPreview(value);
  if (!shown) return null;
  return <p className="mt-1.5 text-xs font-medium text-[#5C5346]">Vista previa: {shown}</p>;
}

const RENTAS_NEGOCIO_PREVIEW_ACTION_LABELS = {
  preview: "Validar y ver vista previa",
  openPreview: "Ver vista previa (sin validar)",
  openPreviewTitle:
    "Abre la vista previa enseguida con el borrador guardado en esta pestaña. No exige las confirmaciones del final ni todos los campos mínimos.",
  deleteApplication: "Eliminar borrador",
} as const;

const RENTAS_SECTION = {
  es: {
    photosVideo: "Fotos y video",
    contact: "Información de contacto",
    residential: "Detalle residencial",
    commercial: "Detalle comercial",
    land: "Detalle terreno / lote",
  },
  en: {
    photosVideo: "Photos and video",
    contact: "Contact information",
    residential: "Residential details",
    commercial: "Commercial details",
    land: "Land / lot details",
  },
} as const;

const CATEGORIAS: { id: BrNegocioCategoriaPropiedad; label: string }[] = [
  { id: "residencial", label: "Residencial" },
  { id: "comercial", label: "Comercial" },
  { id: "terreno_lote", label: "Terreno / lote" },
];

const ESTADOS: { id: RentasNegocioFormState["estadoAnuncio"]; label: string }[] = [
  { id: "disponible", label: "Disponible" },
  { id: "pendiente", label: "Pendiente" },
  { id: "bajo_contrato", label: "Bajo contrato" },
  { id: "rentado", label: "Rentado" },
];

const CONDICION_OPTS: { value: RentasNegocioFormState["residencial"]["condicion"]; label: string }[] = [
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

export function RentasNegocioForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );
  const [state, setState] = useState<RentasNegocioFormState>(createEmptyRentasNegocioFormState);
  const [hydrated, setHydrated] = useState(false);
  const [previewGateMessage, setPreviewGateMessage] = useState<string | null>(null);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;
  const photosInputRef = useRef<HTMLInputElement>(null);
  const negocioLogoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const d = loadRentasNegocioDraft();
    if (d) setState(d);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => saveRentasNegocioDraft(stateRef.current), 280);
    return () => window.clearTimeout(id);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    function flush() {
      saveRentasNegocioDraft(stateRef.current);
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

  const flushSave = useCallback(() => {
    saveRentasNegocioDraft(stateRef.current);
  }, []);

  const previewHref = useMemo(
    () =>
      withClasificadosPublishLang(RENTAS_PREVIEW_NEGOCIO, routeLang, {
        [BR_NEGOCIO_Q_PROPIEDAD]: state.categoriaPropiedad,
      }),
    [routeLang, state.categoriaPropiedad],
  );

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
      const out: RentasNegocioFormState = {
        ...s,
        media: { ...s.media, photoDataUrls: next, primaryImageIndex },
      };
      queueMicrotask(() => saveRentasNegocioDraft(out));
      return out;
    });
    if (photosInputRef.current) photosInputRef.current.value = "";
  };

  const normalizeVideoUrls = (urls: readonly string[]): string[] => {
    const out: string[] = [];
    for (const raw of urls) {
      const v = String(raw ?? "").trim();
      if (!v || out.includes(v)) continue;
      out.push(v);
      if (out.length >= MAX_VIDEO_URLS) break;
    }
    return out;
  };

  const onVideoUrlChange = (index: number, raw: string) => {
    setMediaNotice(null);
    setState((s) => {
      const current = normalizeVideoUrls(s.media.videoUrls?.length ? s.media.videoUrls : [s.media.videoUrl]);
      const nextInput = Array.from({ length: MAX_VIDEO_URLS }, (_, i) => current[i] ?? "");
      nextInput[index] = raw;
      const nextUrls = normalizeVideoUrls(nextInput);
      const out: RentasNegocioFormState = {
        ...s,
        media: {
          ...s.media,
          videoUrl: nextUrls[0] ?? "",
          videoUrls: nextUrls,
          videoLocalDataUrl: "",
          videoLocalDraftId: "",
          videoLocalFileName: "",
          videoLocalMimeType: "",
          videoLocalSizeBytes: 0,
          videoLocalUpdatedAt: 0,
        },
      };
      queueMicrotask(() => saveRentasNegocioDraft(out));
      return out;
    });
  };

  const cat = state.categoriaPropiedad;
  const rentasFlow = rentasFlowGroupActive(state);
  const residencialRowsMode = rentasResidencialFormRowsMode(rentasFlow);
  const confirmAll =
    state.confirmListingAccurate && state.confirmPhotosRepresentItem && state.confirmCommunityRules;

  const previewActionsProps = {
    onPreviewValidated: () => {
      if (!confirmAll) return;
      const g = gateRentasNegocioPreview(stateRef.current);
      if (!g.ok) {
        setPreviewGateMessage(g.message);
        return;
      }
      setPreviewGateMessage(null);
      flushSave();
      router.push(previewHref);
    },
    openPreviewHref: previewHref,
    onBeforeOpenUnvalidatedPreview: flushSave,
    disableValidatedPreview: !confirmAll,
    validationBlockedMessage: previewGateMessage ?? (!confirmAll ? CONFIRM_PREVIEW_BLOCKED[lang] : null),
    labels: RENTAS_NEGOCIO_PREVIEW_ACTION_LABELS[lang],
    onDeleteApplication: async () => {
      clearRentasNegocioDraft();
      const empty = createEmptyRentasNegocioFormState();
      try {
        const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        const p = parseBrNegocioPropiedadParam(sp.get(BR_NEGOCIO_Q_PROPIEDAD));
        setState(p ? { ...empty, categoriaPropiedad: p } : empty);
      } catch {
        setState(empty);
      }
      setPreviewGateMessage(null);
    },
    deleteConfirmMessage: "¿Eliminar el borrador de esta solicitud y empezar de nuevo?",
  };

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#F6F0E2] px-4 pb-[max(7rem,env(safe-area-inset-bottom,0px))] pt-24 text-[#2C2416] sm:px-5 sm:pb-24 sm:pt-28">
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-7 md:space-y-8">
        <header className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{lang === "en" ? "Leonix · Rentals · Business" : "Leonix · Rentas · Negocio"}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1E1810] sm:text-[1.65rem]">{lang === "en" ? "Post rental — Business" : "Publicar renta — Negocio"}</h1>
          <p className={aiSubClass}>
            {lang === "en"
              ? "Preview with the same premium shell as Real Estate Business. The draft lives in this browser session."
              : "Vista previa con el mismo shell premium que Bienes Raíces Negocio. El borrador vive en esta sesión del navegador."}
          </p>
        </header>

        <ClasificadosApplicationTopActions {...previewActionsProps} />
        <p className="text-xs leading-relaxed text-[#5C5346]/88">
          {lang === "en" ? (
            <><strong className="text-[#1E1810]">Validate and preview</strong> requires the final confirmations and minimum requirements; if they pass, opens your test listing.{" "}
            <strong className="text-[#1E1810]">View preview (without validation)</strong> saves the draft and opens instantly (useful while you finish optional fields).</>
          ) : (
            <><strong className="text-[#1E1810]">Validar y ver vista previa</strong> exige las confirmaciones del final y los
            requisitos mínimos; si pasan, abre tu anuncio de prueba.{" "}
            <strong className="text-[#1E1810]">Ver vista previa (sin validar)</strong> guarda el borrador y abre al instante
            (útil mientras terminas campos opcionales).</>
          )}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={`/clasificados/rentas?lang=${lang}`}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-[#C9B46A]/50 px-6 text-sm font-semibold text-[#6E5418] transition hover:bg-[#FFEFD8] sm:w-auto"
          >
            {lang === "en" ? "Back to Rentals" : "Volver a Rentas"}
          </Link>
        </div>

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>{lang === "en" ? "Category" : "Categoría"}</h2>
          <p className={aiSubClass}>{lang === "en" ? "Choose one; the other fields adapt in the form and preview." : "Elige una; los demás campos se adaptan en el formulario y en la vista previa."}</p>
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
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <RentasAnuncioFormSection
          state={state}
          setState={setState}
          fieldClass={fieldClass}
          textareaFieldClass={textareaFieldClass}
          estadoOptions={ESTADOS}
        />

        <RentasShowingTourSection
          state={state}
          setState={setState}
          fieldClass={fieldClass}
          textareaFieldClass={textareaFieldClass}
        />

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>{RENTAS_SECTION[lang].photosVideo}</h2>
          <p className={aiSubClass}>
            Hasta {MAX_PHOTOS} fotos (se comprimen en el navegador). Para una vista previa completa hace falta al menos una
            foto
            <span className="text-[#B8954A]" aria-hidden>
              {" "}
              *
            </span>
            . Los videos se agregan como enlaces externos (hasta {MAX_VIDEO_URLS}); no se suben archivos de video en esta
            versión pública de Rentas. Nada se sube a servidores en este paso; el borrador vive en esta sesión hasta que exista publicación.
          </p>
          {mediaNotice ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950" role="status">
              {mediaNotice}
            </p>
          ) : null}
          <div className="mt-4">
            <span className={aiLabelClass}>{lang === "en" ? "Listing photos" : "Fotos del anuncio"}</span>
            <input
              ref={photosInputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => onPhotos(e.target.files)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#C9B46A]/70 bg-[#FFF6E7] px-4 text-sm font-semibold text-[#1E1810] transition hover:bg-[#FFEFD8]"
                onClick={() => photosInputRef.current?.click()}
              >
                {lang === "en" ? "Upload or add photos" : "Subir o añadir fotos"}
              </button>
              <span className="self-center text-xs text-[#5C5346]">
                {state.media.photoDataUrls.length}/{MAX_PHOTOS} {lang === "en" ? "selected" : "seleccionadas"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#5C5346]">
              {lang === "en" ? (
                <>
                  Each photo is a card with preview. Use the <strong className="text-[#1E1810]">⋮⋮ Order</strong> control{" "}
                  to drag and reorder. The cover image can be different from the first slot.
                </>
              ) : (
                <>
                  Cada foto es una tarjeta con vista previa. Usa el control <strong className="text-[#1E1810]">⋮⋮ Orden</strong>{" "}
                  para arrastrar y reordenar. La portada puede ser distinta del primer casillero.
                </>
              )}
            </p>
            {state.media.photoDataUrls.length > 0 ? (
              <LeonixRealEstateSortablePhotoStrip
                urls={state.media.photoDataUrls}
                primaryImageIndex={0}
                onReorder={(nextUrls) => {
                  setState((s) => {
                    const out: RentasNegocioFormState = {
                      ...s,
                      media: { ...s.media, photoDataUrls: nextUrls, primaryImageIndex: 0 },
                    };
                    queueMicrotask(() => saveRentasNegocioDraft(out));
                    return out;
                  });
                }}
                onRemove={(i) =>
                  setState((s) => {
                    const urls = s.media.photoDataUrls.filter((_, j) => j !== i);
                    const out: RentasNegocioFormState = {
                      ...s,
                      media: { ...s.media, photoDataUrls: urls, primaryImageIndex: 0 },
                    };
                    queueMicrotask(() => saveRentasNegocioDraft(out));
                    return out;
                  })
                }
                onSetPrimary={() => null}
              />
            ) : null}
          </div>
          <div className="mt-6 border-t border-[#E8DFD0] pt-5">
            <span className={aiLabelClass}>Videos por enlace (opcional)</span>
            <p className={aiHintClass}>
              Puedes agregar hasta {MAX_VIDEO_URLS} enlaces externos. Recomendado: YouTube, TikTok, Instagram, Facebook,
              Vimeo o un MP4 público. Leonix mostrará estos enlaces como tarjetas de video en el área multimedia.
            </p>
            <div className="mt-4 grid gap-3">
              {Array.from({ length: MAX_VIDEO_URLS }, (_, i) => {
                const current = normalizeVideoUrls(state.media.videoUrls?.length ? state.media.videoUrls : [state.media.videoUrl]);
                const value = current[i] ?? "";
                const invalid = value.trim() && !/^https?:\/\//i.test(value.trim());
                return (
                  <AiField
                    key={i}
                    label={lang === "en" ? `Video ${i + 1}` : `Video ${i + 1}`}
                    hint={i === 0 ? (lang === "en" ? "The first link is primary for preview and published output." : "El primer enlace es el principal para la vista previa y la salida publicada.") : undefined}
                  >
                    <input
                      className={fieldClass}
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      placeholder="https://youtube.com/..."
                      value={value}
                      onChange={(e) => onVideoUrlChange(i, e.target.value)}
                    />
                    {invalid ? (
                      <p className="mt-2 text-xs font-medium text-amber-800">
                        {lang === "en" ? "Use a full URL starting with http:// or https://." : "Usa una URL completa que empiece con http:// o https://."}
                      </p>
                    ) : null}
                  </AiField>
                );
              })}
            </div>
            {normalizeVideoUrls(state.media.videoUrls?.length ? state.media.videoUrls : [state.media.videoUrl]).length ? (
              <p className="mt-3 text-xs font-medium text-[#2C7A4E]">
                Enlaces listos: se guardarán en el borrador y se mostrarán como tarjetas en el área multimedia.
              </p>
            ) : null}
          </div>
        </section>

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>{RENTAS_SECTION[lang].contact}</h2>
          <p className={aiSubClass}>
            Tu nombre o marca y cómo quieres que te contacten. La vista previa reutiliza el shell de Bienes Raíces Negocio
            (identidad, CTAs, redes). Nombre visible
            <span className="text-[#B8954A]" aria-hidden>
              {" "}
              *
            </span>{" "}
            obligatorio para una salida completa.
          </p>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="sm:col-span-2">
              <span className={aiLabelClass}>Logo o foto del equipo (opcional)</span>
              <input
                ref={negocioLogoInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const data = await compressImageFileToJpegDataUrl(f);
                    setState((s) => {
                      const out: RentasNegocioFormState = { ...s, negocioLogoDataUrl: data };
                      queueMicrotask(() => saveRentasNegocioDraft(out));
                      return out;
                    });
                  } catch {
                    /* ignore */
                  }
                  if (negocioLogoInputRef.current) negocioLogoInputRef.current.value = "";
                }}
              />
              <div className="mt-2 flex flex-wrap items-start gap-3">
                <button
                  type="button"
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border border-[#C9B46A]/70 bg-[#FFF6E7] px-4 text-sm font-semibold text-[#1E1810] transition hover:bg-[#FFEFD8]"
                  onClick={() => negocioLogoInputRef.current?.click()}
                >
                  Subir logo o foto
                </button>
                {state.negocioLogoDataUrl ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <img
                      src={state.negocioLogoDataUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-full border border-[#E8DFD0] object-cover"
                    />
                    <button
                      type="button"
                      className="text-left text-xs font-bold text-[#B8954A] underline"
                      onClick={() =>
                        setState((s) => {
                          const out: RentasNegocioFormState = { ...s, negocioLogoDataUrl: "" };
                          queueMicrotask(() => saveRentasNegocioDraft(out));
                          return out;
                        })
                      }
                    >
                      Quitar imagen
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <AiField required label="Nombre visible">
              <input
                className={fieldClass}
                value={state.negocioNombre}
                onChange={(e) => setState((s) => ({ ...s, negocioNombre: e.target.value }))}
                autoComplete="organization"
              />
            </AiField>
            <AiField label="Marca / brokerage">
              <input
                className={fieldClass}
                value={state.negocioMarca}
                onChange={(e) => setState((s) => ({ ...s, negocioMarca: e.target.value }))}
              />
            </AiField>
            <AiField label="Licencia o registro (opcional)">
              <input
                className={fieldClass}
                value={state.negocioLicencia}
                onChange={(e) => setState((s) => ({ ...s, negocioLicencia: e.target.value }))}
              />
            </AiField>
            <AiField label="Teléfono directo">
              <input
                className={fieldClass}
                inputMode="numeric"
                value={formatUsPhoneDisplay(digitsOnly(state.negocioTelDirecto))}
                onChange={(e) => {
                  const prev = digitsOnly(state.negocioTelDirecto);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, negocioTelDirecto: display }));
                }}
                autoComplete="tel"
              />
            </AiField>
            <AiField label="Teléfono de oficina (opcional)">
              <input
                className={fieldClass}
                inputMode="numeric"
                value={formatUsPhoneDisplay(digitsOnly(state.negocioTelOficina))}
                onChange={(e) => {
                  const prev = digitsOnly(state.negocioTelOficina);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, negocioTelOficina: display }));
                }}
                autoComplete="tel"
              />
            </AiField>
            <AiField label="WhatsApp">
              <input
                className={fieldClass}
                inputMode="numeric"
                value={formatUsPhoneDisplay(digitsOnly(state.negocioWhatsapp))}
                onChange={(e) => {
                  const prev = digitsOnly(state.negocioWhatsapp);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, negocioWhatsapp: display }));
                }}
                autoComplete="tel"
              />
            </AiField>
            <AiField
              label="Número para mensajes de texto"
              hint="Puede ser el mismo número de teléfono o uno diferente."
            >
              <input
                className={fieldClass}
                inputMode="numeric"
                placeholder="Puede ser el mismo número de teléfono o uno diferente."
                value={formatUsPhoneDisplay(digitsOnly(state.negocioMensajesTexto))}
                onChange={(e) => {
                  const prev = digitsOnly(state.negocioMensajesTexto);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, negocioMensajesTexto: display }));
                }}
                autoComplete="tel"
              />
            </AiField>
            <div className="sm:col-span-2">
              <AiField label="Correo electrónico">
                <input
                  className={fieldClass}
                  type="email"
                  value={state.negocioEmail}
                  onChange={(e) => setState((s) => ({ ...s, negocioEmail: e.target.value }))}
                  autoComplete="email"
                />
              </AiField>
            </div>
            <div className="sm:col-span-2">
              <AiField label="Sitio web (opcional)">
                <input
                  className={fieldClass}
                  type="url"
                  placeholder="https://"
                  value={state.negocioSitioWeb}
                  onChange={(e) => setState((s) => ({ ...s, negocioSitioWeb: e.target.value }))}
                />
              </AiField>
            </div>
            <div className="sm:col-span-2">
              <AiField label="Redes y enlaces" hint="Un enlace por línea (https://…).">
                <textarea
                  className={textareaFieldClass}
                  rows={4}
                  value={state.negocioRedes}
                  onChange={(e) => setState((s) => ({ ...s, negocioRedes: e.target.value }))}
                />
              </AiField>
            </div>
            <div className="sm:col-span-2">
              <AiField
                label="Mensaje para interesados (opcional)"
                hint="Texto breve que verán antes de escribirte o llamarte."
              >
                <textarea
                  className={textareaFieldClass}
                  rows={3}
                  value={state.negocioBio}
                  onChange={(e) => setState((s) => ({ ...s, negocioBio: e.target.value }))}
                />
              </AiField>
            </div>
            <div className="sm:col-span-2 mt-2 border-t border-black/10 pt-5">
              <Gate12cContactChannelsFields
                lang="es"
                value={state.contactChannels}
                onChange={(next) => setState((s) => ({ ...s, contactChannels: next }))}
                fieldClass={fieldClass}
                titleClass={aiTitleClass}
              />
            </div>
          </div>
        </section>

        {cat === "residencial" ? (
          <section className={`${aiCardClass} min-w-0`}>
            <h2 className={aiTitleClass}>{RENTAS_SECTION[lang].residential}</h2>
            {residencialRowsMode === "full_legacy" ? (
            <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
              <AiField label="Tipo">
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
                      {o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label="Subtipo">
                <select
                  className={fieldClass}
                  value={state.residencial.subtipo}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, subtipo: e.target.value } }))}
                >
                  {SUBTIPO_POR_TIPO[state.residencial.tipoCodigo].map((o) => (
                    <option key={o.value || "none"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label="Recámaras">
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.residencial.recamaras}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, recamaras: e.target.value } }))}
                />
              </AiField>
              <AiField label="Baños completos">
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  value={state.residencial.banos}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, banos: e.target.value } }))}
                />
              </AiField>
              <AiField label="Medios baños">
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  value={state.residencial.mediosBanos}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, mediosBanos: e.target.value } }))}
                />
              </AiField>
              <AiField label="Interior (ft²)">
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.residencial.interiorSqft}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, interiorSqft: e.target.value } }))}
                />
                <RentasSqftPreview value={state.residencial.interiorSqft} />
              </AiField>
              <AiField label="Lote (ft²)">
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.residencial.loteSqft}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, loteSqft: e.target.value } }))}
                />
                <RentasSqftPreview value={state.residencial.loteSqft} />
              </AiField>
              <AiField label="Estacionamiento">
                <input
                  className={fieldClass}
                  value={state.residencial.estacionamiento}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, estacionamiento: e.target.value } }))}
                />
              </AiField>
              <AiField label="Año de construcción">
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.residencial.ano}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, ano: e.target.value } }))}
                />
              </AiField>
              <AiField label="Condición">
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
                      {o.label}
                    </option>
                  ))}
                </select>
              </AiField>
            </div>
            ) : residencialRowsMode === "room_partial" ? (
              <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
                <AiField label="Baños completos">
                  <input
                    className={fieldClass}
                    inputMode="decimal"
                    value={state.residencial.banos}
                    onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, banos: e.target.value } }))}
                  />
                </AiField>
                <AiField label="Medios baños">
                  <input
                    className={fieldClass}
                    inputMode="decimal"
                    value={state.residencial.mediosBanos}
                    onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, mediosBanos: e.target.value } }))}
                  />
                </AiField>
                <AiField label="Interior (ft²)">
                  <input
                    className={fieldClass}
                    inputMode="numeric"
                    value={state.residencial.interiorSqft}
                    onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, interiorSqft: e.target.value } }))}
                  />
                  <RentasSqftPreview value={state.residencial.interiorSqft} />
                </AiField>
                <AiField label="Estacionamiento">
                  <input
                    className={fieldClass}
                    value={state.residencial.estacionamiento}
                    onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, estacionamiento: e.target.value } }))}
                  />
                </AiField>
              </div>
            ) : (
              <p className={`${aiSubClass} mt-3`}>
                Para este tipo de renta, los detalles de habitación o espacio compartido van arriba en “Anuncio”; aquí solo
                puedes marcar destacados si aplica.
              </p>
            )}
            <div className="mt-6">
              <span className={aiLabelClass}>Destacados</span>
              <p className={aiHintClass}>Opcional: qué destacar en la vista previa.</p>
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
                    <span className="text-base leading-none shrink-0 pt-0.5" aria-hidden>
                      {RENTAS_RESIDENCIAL_HIGHLIGHT_FORM_VISUAL[d.key as keyof typeof RENTAS_RESIDENCIAL_HIGHLIGHT_FORM_VISUAL]}
                    </span>
                    <span className="min-w-0 flex-1">{d.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {cat === "comercial" ? (
          <section className={`${aiCardClass} min-w-0`}>
            <h2 className={aiTitleClass}>{RENTAS_SECTION[lang].commercial}</h2>
            <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
              <AiField label="Tipo comercial">
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
                      {o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label="Subtipo">
                <select
                  className={fieldClass}
                  value={state.comercial.subtipo}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, subtipo: e.target.value } }))}
                >
                  {COMERCIAL_SUBTIPO_POR_TIPO[state.comercial.tipoCodigo].map((o) => (
                    <option key={o.value || "none"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <div className="sm:col-span-2">
                <AiField label="Uso">
                  <input
                    className={fieldClass}
                    value={state.comercial.uso}
                    onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, uso: e.target.value } }))}
                  />
                </AiField>
              </div>
              <AiField label="Interior (ft²)">
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.comercial.interiorSqft}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, interiorSqft: e.target.value } }))}
                />
                <RentasSqftPreview value={state.comercial.interiorSqft} />
              </AiField>
              <AiField label="Oficinas">
                <input
                  className={fieldClass}
                  value={state.comercial.oficinas}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, oficinas: e.target.value } }))}
                />
              </AiField>
              <AiField label="Baños">
                <input
                  className={fieldClass}
                  value={state.comercial.banos}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, banos: e.target.value } }))}
                />
              </AiField>
              <AiField label="Niveles">
                <input
                  className={fieldClass}
                  value={state.comercial.niveles}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, niveles: e.target.value } }))}
                />
              </AiField>
              <AiField label="Estacionamiento">
                <input
                  className={fieldClass}
                  value={state.comercial.estacionamiento}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, estacionamiento: e.target.value } }))}
                />
              </AiField>
              <AiField label="Zonificación">
                <input
                  className={fieldClass}
                  value={state.comercial.zonificacion}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, zonificacion: e.target.value } }))}
                />
              </AiField>
              <AiField label="Condición">
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
                <span className="text-sm font-medium text-[#2C2416]">Acceso de carga</span>
              </label>
            </div>
            <div className="mt-6">
              <span className={aiLabelClass}>Destacados</span>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {COMERCIAL_DESTACADOS_DEFS.map((d) => (
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
                    <span className="min-w-0 flex-1">{d.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {cat === "terreno_lote" ? (
          <section className={`${aiCardClass} min-w-0`}>
            <h2 className={aiTitleClass}>{RENTAS_SECTION[lang].land}</h2>
            <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
              <AiField label="Tipo">
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
                      {o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label="Subtipo">
                <select
                  className={fieldClass}
                  value={state.terreno.subtipo}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, subtipo: e.target.value } }))}
                >
                  {TERRENO_SUBTIPO_POR_TIPO[state.terreno.tipoCodigo].map((o) => (
                    <option key={o.value || "none"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label="Lote (ft²)">
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.terreno.loteSqft}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, loteSqft: e.target.value } }))}
                />
                <RentasSqftPreview value={state.terreno.loteSqft} />
              </AiField>
              <AiField label="Uso / zonificación">
                <input
                  className={fieldClass}
                  value={state.terreno.usoZonificacion}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, usoZonificacion: e.target.value } }))}
                />
              </AiField>
              <AiField label="Acceso">
                <input
                  className={fieldClass}
                  value={state.terreno.acceso}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, acceso: e.target.value } }))}
                />
              </AiField>
              <AiField label="Servicios">
                <input
                  className={fieldClass}
                  value={state.terreno.servicios}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, servicios: e.target.value } }))}
                />
              </AiField>
              <AiField label="Topografía">
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
                <span className="text-sm font-medium">Listo para construir</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                  checked={state.terreno.cercado}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, cercado: e.target.checked } }))}
                />
                <span className="text-sm font-medium">Cercado</span>
              </label>
            </div>
            <div className="mt-6">
              <span className={aiLabelClass}>Destacados</span>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {TERRENO_DESTACADOS_DEFS.map((d) => (
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
                    <span className="min-w-0 flex-1">{d.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : null}

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

        <section className={`${aiCardClass} min-w-0`} aria-labelledby="sec-review">
          <h2 id="sec-review" className={aiTitleClass}>
            {lang === "es" ? "Revisión final" : "Final review"}
          </h2>
          <p className={aiSubClass}>
            {lang === "en"
              ? "When your content is ready, use the buttons below to open the preview or start publishing."
              : "Cuando tu contenido esté listo, usa los botones de abajo para abrir la vista previa o iniciar la publicación."}
          </p>

          {/* Pricing summary */}
          <div className="mt-5 rounded-xl border border-[#C9782F]/50 bg-[#FFFDF7]/50 px-4 py-3">
            <p className="text-xs font-semibold text-[#8a7a62]">
              {lang === "en" ? "Price summary" : "Resumen de precios"}
            </p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5D4A25]">
                  {lang === "en" ? "Rental listing" : "Anuncio de renta"}
                </span>
                <span className="font-semibold text-[#3D2C12]">$24.99 / 30 {lang === "en" ? "days" : "días"}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-[#D8C79A]/40 pt-2">
                <span className="font-semibold text-[#3D2C12]">
                  {lang === "en" ? "Total" : "Total"}
                </span>
                <span className="font-bold text-[#C9782F]">$24.99</span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#5D4A25]/80">
              {lang === "en"
                ? "Paid listing activation happens after secure payment."
                : "La activación del anuncio pagado ocurre después del pago seguro."}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-[#D8C79A]/40 pt-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
              <button
                type="button"
                onClick={previewActionsProps.onPreviewValidated}
                disabled={previewActionsProps.disableValidatedPreview}
                className="inline-flex min-h-[48px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-xl bg-[#3B66AD] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#2f5699] disabled:cursor-not-allowed disabled:opacity-40 sm:max-w-xs"
              >
                {lang === "en" ? "Preview" : "Vista previa"}
              </button>
              <button
                type="button"
                onClick={() => {
                  previewActionsProps.onBeforeOpenUnvalidatedPreview();
                  router.push(previewActionsProps.openPreviewHref);
                }}
                className="inline-flex min-h-[48px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-xl border-2 border-[#3B66AD]/45 bg-white px-4 py-3 text-sm font-bold leading-tight text-[#2f5699] shadow-sm transition hover:bg-[#3B66AD]/5 sm:max-w-xs"
              >
                {lang === "en" ? "View preview (draft)" : "Ver vista previa (borrador)"}
              </button>
            </div>
            {previewActionsProps.validationBlockedMessage ? (
              <p className="text-sm font-medium text-amber-900" role="status">
                {previewActionsProps.validationBlockedMessage}
              </p>
            ) : null}
            <div className="pt-1">
              <button
                type="button"
                onClick={previewActionsProps.onDeleteApplication}
                className="text-xs font-medium text-red-800/90 underline decoration-red-800/30 underline-offset-2 hover:text-red-950"
              >
                {previewActionsProps.labels.deleteApplication}
              </button>
            </div>
          </div>
        </section>

        <p className="break-words text-center text-xs leading-relaxed text-[#5C5346]/80">
          Borrador guardado solo en este dispositivo. Ruta:{" "}
          <code className="break-all rounded bg-[#F9F6F1] px-1.5 py-0.5 text-[11px]">{RENTAS_PUBLICAR_NEGOCIO_PUBLIC_ENTRY}</code>
        </p>
      </div>
    </main>
  );
}
