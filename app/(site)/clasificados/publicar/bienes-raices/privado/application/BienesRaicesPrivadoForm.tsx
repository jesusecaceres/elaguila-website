"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ClasificadosApplicationTopActions } from "@/app/clasificados/lib/publishUi/ClasificadosApplicationTopActions";
import { gateBienesRaicesPrivadoPreview } from "@/app/clasificados/lib/publish/leonixRequiredForPreviewGates";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  parseBrNegocioPropiedadParam,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  BR_PREVIEW_PRIVADO,
  BR_PUBLICAR_HUB,
  BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";
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
import { readFileAsDataUrl } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/readFileAsDataUrl";
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
  createEmptyBienesRaicesPrivadoFormState,
  type BienesRaicesPrivadoFormState,
} from "../schema/bienesRaicesPrivadoFormState";
import {
  clearBienesRaicesPrivadoDraft,
  loadBienesRaicesPrivadoDraft,
  saveBienesRaicesPrivadoDraft,
} from "./utils/bienesRaicesPrivadoDraft";

const MAX_PHOTOS = 8;

function precioDigitsUnbounded(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
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

export function BienesRaicesPrivadoForm() {
  const router = useRouter();
  const [state, setState] = useState<BienesRaicesPrivadoFormState>(createEmptyBienesRaicesPrivadoFormState);
  const [hydrated, setHydrated] = useState(false);
  const [previewGateMessage, setPreviewGateMessage] = useState<string | null>(null);

  useEffect(() => {
    const d = loadBienesRaicesPrivadoDraft();
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
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => saveBienesRaicesPrivadoDraft(state), 400);
    return () => window.clearTimeout(id);
  }, [state, hydrated]);

  const flushSave = useCallback(() => {
    saveBienesRaicesPrivadoDraft(state);
  }, [state]);

  const previewHref = `${BR_PREVIEW_PRIVADO}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(state.categoriaPropiedad)}`;

  const onPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_PHOTOS - state.media.photoDataUrls.length;
    if (room <= 0) return;
    const next: string[] = [...state.media.photoDataUrls];
    for (let i = 0; i < files.length && next.length < MAX_PHOTOS; i++) {
      const f = files[i];
      if (!f || !/^image\//.test(f.type)) continue;
      try {
        next.push(await readFileAsDataUrl(f));
      } catch {
        /* ignore */
      }
    }
    setState((s) => ({
      ...s,
      media: {
        ...s.media,
        photoDataUrls: next,
        primaryImageIndex: Math.min(s.media.primaryImageIndex, Math.max(0, next.length - 1)),
      },
    }));
  };

  const cat = state.categoriaPropiedad;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F6F0E2] px-4 pb-28 pt-24 text-[#2C2416] sm:px-5 sm:pb-24 sm:pt-28">
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-7 md:space-y-8">
        <header className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">Leonix · Bienes Raíces · Privado</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1E1810] sm:text-[1.65rem]">Publicar — Particular</h1>
          <p className={aiSubClass}>
            La vista previa solo muestra lo que llenes. El borrador vive en esta sesión del navegador (misma pestaña); al
            cerrarla se descarta.
          </p>
        </header>

        <ClasificadosApplicationTopActions
          onPreviewValidated={() => {
            const g = gateBienesRaicesPrivadoPreview(state);
            if (!g.ok) {
              setPreviewGateMessage(g.message);
              return;
            }
            setPreviewGateMessage(null);
            flushSave();
            router.push(previewHref);
          }}
          openPreviewHref={previewHref}
          onBeforeOpenUnvalidatedPreview={flushSave}
          onDeleteApplication={() => {
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
          }}
          validationBlockedMessage={previewGateMessage}
          deleteConfirmMessage="¿Eliminar el borrador de esta solicitud y empezar de nuevo?"
        />
        <p className="text-xs leading-relaxed text-[#5C5346]/88">
          <strong className="text-[#1E1810]">Vista previa</strong> valida los campos mínimos del anuncio.{" "}
          <strong className="text-[#1E1810]">Abrir vista previa</strong> guarda y abre sin esa validación.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={BR_PUBLICAR_HUB}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-[#C9B46A]/50 px-6 text-sm font-semibold text-[#6E5418] transition hover:bg-[#FFEFD8] sm:w-auto"
          >
            Volver al hub BR
          </Link>
        </div>

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>Categoría</h2>
          <p className={aiSubClass}>Elige una; los demás campos se adaptan en el formulario y en la vista previa.</p>
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

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>Anuncio</h2>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="sm:col-span-2">
              <AiField required label="Título">
                <input
                  className={fieldClass}
                  value={state.titulo}
                  onChange={(e) => setState((s) => ({ ...s, titulo: e.target.value }))}
                  autoComplete="off"
                />
              </AiField>
            </div>
            <AiField required label="Precio (USD)" hint="Solo números enteros; en la vista previa verás el formato con comas.">
              <input
                className={fieldClass}
                inputMode="numeric"
                value={state.precio}
                onChange={(e) => setState((s) => ({ ...s, precio: precioDigitsUnbounded(e.target.value) }))}
                autoComplete="off"
              />
            </AiField>
            <AiField label="Estado del anuncio">
              <select
                className={fieldClass}
                value={state.estadoAnuncio}
                onChange={(e) =>
                  setState((s) => ({ ...s, estadoAnuncio: e.target.value as BienesRaicesPrivadoFormState["estadoAnuncio"] }))
                }
              >
                {ESTADOS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </AiField>
            <AiField label="Ciudad o zona">
              <input
                className={fieldClass}
                value={state.ciudad}
                onChange={(e) => setState((s) => ({ ...s, ciudad: e.target.value }))}
                autoComplete="address-level2"
              />
            </AiField>
            <AiField label="Dirección o referencia" hint="Texto corto; puedes omitir número exacto.">
              <input
                className={fieldClass}
                value={state.ubicacionLinea}
                onChange={(e) => setState((s) => ({ ...s, ubicacionLinea: e.target.value }))}
                autoComplete="street-address"
              />
            </AiField>
            <p className="sm:col-span-2 text-xs text-[#5C5346]">
              Para vista previa: ciudad o línea de ubicación (al menos uno)
              <span className="text-[#B8954A]" aria-hidden>
                {" "}
                *
              </span>
              .
            </p>
            <div className="sm:col-span-2">
              <AiField label="Enlace a mapa (opcional)" hint="Pega un enlace https (por ejemplo Google Maps).">
                <input
                  className={fieldClass}
                  type="url"
                  placeholder="https://"
                  value={state.enlaceMapa}
                  onChange={(e) => setState((s) => ({ ...s, enlaceMapa: e.target.value }))}
                />
              </AiField>
            </div>
            <div className="sm:col-span-2">
              <AiField label="Descripción">
                <textarea
                  className={textareaFieldClass}
                  rows={6}
                  value={state.descripcion}
                  onChange={(e) => setState((s) => ({ ...s, descripcion: e.target.value }))}
                />
              </AiField>
            </div>
          </div>
        </section>

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>Fotos y video</h2>
          <p className={aiSubClass}>
            Hasta {MAX_PHOTOS} fotos. Al menos una foto para una vista previa completa
            <span className="text-[#B8954A]" aria-hidden>
              {" "}
              *
            </span>
            . Un video (enlace o archivo corto).
          </p>
          <div className="mt-4">
            <span className={aiLabelClass}>Fotos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="mt-2 block w-full text-sm text-[#5C5346]"
              onChange={(e) => onPhotos(e.target.files)}
            />
            {state.media.photoDataUrls.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {state.media.photoDataUrls.map((url, i) => (
                  <li
                    key={`${i}-${url.slice(0, 24)}`}
                    className="flex min-w-0 flex-col gap-2 rounded-lg border border-[#E8DFD0] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover" />
                      <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1">
                        <button
                          type="button"
                          className="text-left text-xs font-bold text-[#B8954A] underline"
                          onClick={() =>
                            setState((s) => {
                              const urls = s.media.photoDataUrls.filter((_, j) => j !== i);
                              let pi = s.media.primaryImageIndex;
                              if (pi >= urls.length) pi = Math.max(0, urls.length - 1);
                              return { ...s, media: { ...s.media, photoDataUrls: urls, primaryImageIndex: pi } };
                            })
                          }
                        >
                          Quitar
                        </button>
                        <button
                          type="button"
                          className="text-left text-xs font-bold text-[#5C5346] underline"
                          onClick={() => setState((s) => ({ ...s, media: { ...s.media, primaryImageIndex: i } }))}
                        >
                          {i === state.media.primaryImageIndex ? "Portada" : "Usar como portada"}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="mt-4">
            <AiField label="Video (URL)" hint="YouTube o enlace directo a mp4, etc.">
              <input
                className={fieldClass}
                type="url"
                placeholder="https://"
                value={state.media.videoUrl}
                onChange={(e) => setState((s) => ({ ...s, media: { ...s.media, videoUrl: e.target.value } }))}
              />
            </AiField>
          </div>
        </section>

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>Propietario (particular)</h2>
          <p className={aiSubClass}>
            Tu nombre y cómo te contactan. No se pide sitio web ni redes sociales. Para vista previa: nombre
            <span className="text-[#B8954A]" aria-hidden>
              {" "}
              *
            </span>{" "}
            y al menos un medio de contacto (teléfono, WhatsApp o correo)
            <span className="text-[#B8954A]" aria-hidden>
              {" "}
              *
            </span>
            .
          </p>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="sm:col-span-2">
              <span className={aiLabelClass}>Foto (opcional)</span>
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-sm"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const data = await readFileAsDataUrl(f);
                    setState((s) => ({ ...s, seller: { ...s.seller, fotoDataUrl: data } }));
                  } catch {
                    /* ignore */
                  }
                }}
              />
              {state.seller.fotoDataUrl ? (
                <button
                  type="button"
                  className="mt-2 text-xs font-bold text-[#B8954A] underline"
                  onClick={() => setState((s) => ({ ...s, seller: { ...s.seller, fotoDataUrl: "" } }))}
                >
                  Quitar foto
                </button>
              ) : null}
            </div>
            <AiField required label="Nombre completo">
              <input
                className={fieldClass}
                value={state.seller.nombre}
                onChange={(e) => setState((s) => ({ ...s, seller: { ...s.seller, nombre: e.target.value } }))}
                autoComplete="name"
              />
            </AiField>
            <AiField label="Teléfono">
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
            <AiField label="WhatsApp">
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
            <div className="sm:col-span-2">
              <AiField label="Correo electrónico">
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
              <AiField label="Mensaje para interesados (opcional)" hint="Texto breve que verán antes de escribirte o llamarte.">
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
            <h2 className={aiTitleClass}>Detalle residencial</h2>
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
              </AiField>
              <AiField label="Lote (ft²)">
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.residencial.loteSqft}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, loteSqft: e.target.value } }))}
                />
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
                    <span className="min-w-0 flex-1">{d.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {cat === "comercial" ? (
          <section className={`${aiCardClass} min-w-0`}>
            <h2 className={aiTitleClass}>Detalle comercial</h2>
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
            <h2 className={aiTitleClass}>Detalle terreno / lote</h2>
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

        <p className="break-words text-center text-xs leading-relaxed text-[#5C5346]/80">
          Borrador guardado solo en este dispositivo. Ruta:{" "}
          <code className="break-all rounded bg-[#F9F6F1] px-1.5 py-0.5 text-[11px]">{BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY}</code>
        </p>
      </div>
    </main>
  );
}
