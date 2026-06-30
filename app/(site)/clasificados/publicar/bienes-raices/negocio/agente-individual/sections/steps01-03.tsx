"use client";

import { useEffect, useState } from "react";
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AGENTE_RES_MAX_VIDEO_URLS } from "../schema/agenteIndividualResidencialFormState";
import { AiField, aiCardClass, aiInputClass, aiSubClass, aiTitleClass } from "../application/formPrimitives";
import { readFileAsDataUrl } from "../application/utils/readFileAsDataUrl";
import { LeonixRealEstateSortablePhotoStrip } from "@/app/(site)/clasificados/lib/LeonixRealEstateSortablePhotoStrip";
import {
  COMERCIAL_SUBTIPO_POR_TIPO,
  COMERCIAL_SUBVALUE_LABEL_EN,
  COMERCIAL_TIPO_LABEL_EN,
  COMERCIAL_TIPO_OPCIONES,
  TERRENO_SUBTIPO_POR_TIPO,
  TERRENO_SUBVALUE_LABEL_EN,
  TERRENO_TIPO_LABEL_EN,
  TERRENO_TIPO_OPCIONES,
  type ComercialTipoCodigo,
  type TerrenoTipoCodigo,
} from "../schema/agenteComercialTerrenoMeta";
import {
  SUBTIPO_POR_TIPO,
  SUBTIPO_SUBVALUE_LABEL_EN,
  TIPO_PROPIEDAD_LABEL_EN,
  TIPO_PROPIEDAD_OPCIONES,
} from "../schema/agenteResidencialTipoMeta";
import type { TipoPropiedadCodigo } from "../schema/agenteResidencialTipoMeta";
import { BrAgenteLocationFormFields } from "@/app/lib/clasificados/bienes-raices/brLocationFormFields";
import { useBrAgenteResidencialCopy } from "../application/BrAgenteResidencialLocaleContext";
import { formatPrecioUsd } from "../lib/agenteResidencialPreviewFormat";

/** Virtual tour uploads: images, PDF, short video, static HTML — not a general file dump. */
export const BR_AGENTE_RES_TOUR_FILE_ACCEPT =
  "image/*,application/pdf,.pdf,video/mp4,video/webm,video/quicktime,.mp4,.webm,.html,.htm";

/** Brochure-style documents only (no executables). */
export const BR_AGENTE_RES_BROCHURE_FILE_ACCEPT =
  "application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,image/jpeg,.jpg,.jpeg,.png,image/png";

export function Step01TipoAnuncio({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: React.Dispatch<React.SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const { lang, t } = useBrAgenteResidencialCopy();
  const cat = state.categoriaPropiedad;

  const subIntro =
    cat === "comercial" ? t.step01.subComercial : cat === "terreno_lote" ? t.step01.subTerreno : t.step01.subResidencial;

  const ventaHint =
    cat === "comercial"
      ? t.step01.tipoPublicacionHintComercial
      : cat === "terreno_lote"
        ? t.step01.tipoPublicacionHintTerreno
        : t.step01.tipoPublicacionHintResidencial;

  const ventaLabel =
    cat === "comercial"
      ? t.step01.ventaComercial
      : cat === "terreno_lote"
        ? t.step01.ventaTerreno
        : t.step01.ventaResidencial;

  const residencialCodigo = state.tipoPropiedadCodigo;
  const residencialSubtipos = SUBTIPO_POR_TIPO[residencialCodigo];
  const showResidencialSubtipo = residencialSubtipos.length > 0;

  const tipoResLabel = (value: TipoPropiedadCodigo) =>
    lang === "en" ? TIPO_PROPIEDAD_LABEL_EN[value] : TIPO_PROPIEDAD_OPCIONES.find((o) => o.value === value)?.label ?? value;

  const subtipoResOptionLabel = (value: string, fallback: string) =>
    lang === "en" ? SUBTIPO_SUBVALUE_LABEL_EN[value] ?? fallback : fallback;

  const comercialSubtipos = COMERCIAL_SUBTIPO_POR_TIPO[state.comercialTipoCodigo];
  const showComercialSubtipo = comercialSubtipos.length > 0;

  const subtipoComercialOptionLabel = (value: string, fallback: string) =>
    lang === "en" ? COMERCIAL_SUBVALUE_LABEL_EN[value] ?? fallback : fallback;

  const terrenoCodigo = state.terrenoTipoCodigo;
  const terrenoSubtipos = TERRENO_SUBTIPO_POR_TIPO[terrenoCodigo];
  const showTerrenoSubtipo = terrenoSubtipos.length > 0;

  const subtipoTerrenoOptionLabel = (value: string, fallback: string) =>
    lang === "en" ? TERRENO_SUBVALUE_LABEL_EN[value] ?? fallback : fallback;

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{t.step01.title}</h2>
      <p className={aiSubClass}>{subIntro}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AiField label={t.step01.tipoPublicacion} hint={ventaHint}>
          <div className="mt-1.5 flex items-center gap-2">
            <input className={aiInputClass} readOnly value={ventaLabel} aria-readonly />
          </div>
        </AiField>

        {cat === "residencial" ? (
          <AiField label={t.step01.tipoPropiedad}>
            <select
              className={aiInputClass}
              value={residencialCodigo}
              onChange={(e) => {
                const next = e.target.value as TipoPropiedadCodigo;
                setState((s) => ({
                  ...s,
                  tipoPropiedadCodigo: next,
                  subtipoPropiedad: "",
                }));
              }}
            >
              {TIPO_PROPIEDAD_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {tipoResLabel(o.value)}
                </option>
              ))}
            </select>
          </AiField>
        ) : null}

        {cat === "comercial" ? (
          <AiField label={t.step01.tipoComercial}>
            <select
              className={aiInputClass}
              value={state.comercialTipoCodigo}
              onChange={(e) => {
                const next = e.target.value as ComercialTipoCodigo;
                setState((s) => ({
                  ...s,
                  comercialTipoCodigo: next,
                  comercialSubtipoPropiedad: "",
                }));
              }}
            >
              {COMERCIAL_TIPO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {lang === "en" ? COMERCIAL_TIPO_LABEL_EN[o.value] : o.label}
                </option>
              ))}
            </select>
          </AiField>
        ) : null}

        {cat === "terreno_lote" ? (
          <AiField label={t.step01.tipoTerreno}>
            <select
              className={aiInputClass}
              value={terrenoCodigo}
              onChange={(e) => {
                const next = e.target.value as TerrenoTipoCodigo;
                setState((s) => ({
                  ...s,
                  terrenoTipoCodigo: next,
                  terrenoSubtipoPropiedad: "",
                }));
              }}
            >
              {TERRENO_TIPO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {lang === "en" ? TERRENO_TIPO_LABEL_EN[o.value] : o.label}
                </option>
              ))}
            </select>
          </AiField>
        ) : null}

        {cat === "residencial" && showResidencialSubtipo ? (
          <div className="sm:col-span-2">
            <AiField label={t.step01.subtipo} hint={t.step01.subtipoHint}>
              <select
                className={aiInputClass}
                value={state.subtipoPropiedad}
                onChange={(e) => setState((s) => ({ ...s, subtipoPropiedad: e.target.value }))}
              >
                {residencialSubtipos.map((o) => (
                  <option key={o.value || "none"} value={o.value}>
                    {subtipoResOptionLabel(o.value, o.label)}
                  </option>
                ))}
              </select>
            </AiField>
          </div>
        ) : null}

        {cat === "comercial" && showComercialSubtipo ? (
          <div className="sm:col-span-2">
            <AiField label={t.step01.subtipo} hint={t.step01.subtipoHint}>
              <select
                className={aiInputClass}
                value={state.comercialSubtipoPropiedad}
                onChange={(e) => setState((s) => ({ ...s, comercialSubtipoPropiedad: e.target.value }))}
              >
                {comercialSubtipos.map((o) => (
                  <option key={o.value || "none"} value={o.value}>
                    {subtipoComercialOptionLabel(o.value, o.label)}
                  </option>
                ))}
              </select>
            </AiField>
          </div>
        ) : null}

        {cat === "terreno_lote" && showTerrenoSubtipo ? (
          <div className="sm:col-span-2">
            <AiField label={t.step01.subtipo} hint={t.step01.subtipoHint}>
              <select
                className={aiInputClass}
                value={state.terrenoSubtipoPropiedad}
                onChange={(e) => setState((s) => ({ ...s, terrenoSubtipoPropiedad: e.target.value }))}
              >
                {terrenoSubtipos.map((o) => (
                  <option key={o.value || "none"} value={o.value}>
                    {subtipoTerrenoOptionLabel(o.value, o.label)}
                  </option>
                ))}
              </select>
            </AiField>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function UrlOrFileRow({
  label,
  hint,
  urlValue,
  onUrl,
  fileAccept,
  onPickFile,
  clearFile,
  fileActive,
  fileName,
  pegarUrl,
  subirArchivo,
  quitar,
  fileReadyLabel,
  usarUrlLabel,
}: {
  label: string;
  hint?: string;
  urlValue: string;
  onUrl: (v: string) => void;
  fileAccept: string;
  onPickFile: (dataUrl: string, fileName: string) => void;
  clearFile: () => void;
  fileActive: boolean;
  fileName?: string;
  pegarUrl: string;
  subirArchivo: string;
  quitar: string;
  fileReadyLabel: string;
  usarUrlLabel: string;
}) {
  const [urlDraft, setUrlDraft] = useState(urlValue);
  useEffect(() => {
    setUrlDraft(urlValue);
  }, [urlValue]);

  return (
    <AiField label={label} hint={hint}>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-start">
        <input
          type="url"
          className={`${aiInputClass} sm:flex-1`}
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder={pegarUrl}
          autoComplete="off"
          disabled={fileActive}
        />
        <button
          type="button"
          disabled={fileActive || !urlDraft.trim()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#C9B46A]/60 bg-[#FFF6E7] px-4 py-2.5 text-xs font-semibold text-[#5C4E2E] disabled:opacity-40 sm:min-h-0"
          onClick={() => onUrl(urlDraft.trim())}
        >
          {usarUrlLabel}
        </button>
        <label className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-4 py-2.5 text-xs font-semibold text-[#5C4E2E] touch-manipulation sm:w-auto sm:min-h-0 sm:px-3 sm:py-2">
          {subirArchivo}
          <input
            type="file"
            accept={fileAccept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              void readFileAsDataUrl(f).then((dataUrl) => onPickFile(dataUrl, f.name)).catch(() => {});
            }}
          />
        </label>
      </div>
      {urlValue && !fileActive ? (
        <p className="mt-2 text-xs font-medium text-[#5C5346]">{urlValue}</p>
      ) : null}
      {fileActive ? (
        <div className="mt-2 rounded-xl border border-[#C9B46A]/45 bg-[#FFF9E8] px-3 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#6E5418]">{fileReadyLabel}</p>
          {fileName ? <p className="mt-1 text-sm font-semibold text-[#1E1810]">{fileName}</p> : null}
          <button type="button" className="mt-2 text-xs font-semibold text-red-800 hover:underline" onClick={clearFile}>
            {quitar}
          </button>
        </div>
      ) : null}
    </AiField>
  );
}

function normalizedUrlFields(values: string[], max: number): string[] {
  const next = Array.from({ length: max }, (_, i) => values[i] ?? "");
  return next;
}

function validHttpUrl(raw: string): boolean {
  return /^https?:\/\/\S+/i.test(raw.trim());
}

function VideoUrlAddRows({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: React.Dispatch<React.SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const { t } = useBrAgenteResidencialCopy();
  const existing = normalizedUrlFields(state.videoUrls?.length ? state.videoUrls : state.videoUrl ? [state.videoUrl] : [], AGENTE_RES_MAX_VIDEO_URLS);
  const filledCount = existing.filter((u) => u.trim()).length;
  const [visibleCount, setVisibleCount] = useState(Math.min(AGENTE_RES_MAX_VIDEO_URLS, Math.max(1, filledCount + 1)));
  const fileActive = Boolean(state.videoDataUrl);

  const patchUrl = (index: number, value: string) => {
    setState((s) => {
      const next = normalizedUrlFields(s.videoUrls?.length ? s.videoUrls : s.videoUrl ? [s.videoUrl] : [], AGENTE_RES_MAX_VIDEO_URLS);
      next[index] = value;
      const compact = next.map((u) => u.trim()).filter(Boolean).slice(0, AGENTE_RES_MAX_VIDEO_URLS);
      return { ...s, videoUrls: compact, videoUrl: compact[0] ?? "", videoDataUrl: "", videoArchivoNombre: "" };
    });
  };

  return (
    <AiField label={t.step03.video} hint={t.step03.videoHint}>
      <div className="mt-3 space-y-3">
        {existing.slice(0, visibleCount).map((value, index) => {
          const ok = validHttpUrl(value);
          return (
            <div key={index} className="rounded-xl border border-[#E8DFD0] bg-white/70 p-3">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#5C5346]/90">
                {t.step03.videoUrlLabel(index + 1)}
              </label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <input
                  type="url"
                  className={`${aiInputClass} sm:flex-1`}
                  value={value}
                  onChange={(e) => patchUrl(index, e.target.value)}
                  placeholder={t.step02.pegarUrl}
                  autoComplete="off"
                  disabled={fileActive}
                />
                {value.trim() ? (
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-50 sm:min-h-0"
                    onClick={() => patchUrl(index, "")}
                  >
                    {t.step02.quitar}
                  </button>
                ) : null}
              </div>
              {ok ? <p className="mt-2 text-xs font-bold text-[#2F6B3C]">{t.step03.videoAdded}</p> : null}
            </div>
          );
        })}
        {!fileActive && visibleCount < AGENTE_RES_MAX_VIDEO_URLS ? (
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-dashed border-[#C9B46A]/70 bg-[#FFF6E7] px-4 py-2.5 text-xs font-bold text-[#5C4E2E] transition hover:border-[#B8954A] hover:bg-[#FFF0D6] sm:min-h-0"
            onClick={() => setVisibleCount((n) => Math.min(AGENTE_RES_MAX_VIDEO_URLS, n + 1))}
          >
            {t.step03.addVideo}
          </button>
        ) : null}
      </div>
    </AiField>
  );
}

export function Step02InformacionBasica({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: React.Dispatch<React.SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const { lang, t } = useBrAgenteResidencialCopy();
  const est = t.step02.estados;
  const precioPreview = formatPrecioUsd(state.precio);

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{t.step02.title}</h2>
      <p className={aiSubClass}>{t.step02.sub}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <AiField label={t.step02.titulo}>
            <input
              className={aiInputClass}
              value={state.titulo}
              onChange={(ev) => setState((s) => ({ ...s, titulo: ev.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <AiField label={t.step02.precio} hint={t.step02.precioHint}>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5C5346]">$</span>
            <input
              className={`${aiInputClass} pl-7`}
              inputMode="decimal"
              value={state.precio}
              onChange={(ev) => setState((s) => ({ ...s, precio: ev.target.value }))}
              autoComplete="off"
            />
          </div>
          {precioPreview ? (
            <p className="mt-1.5 text-xs font-medium text-[#5C5346]">{t.step02.precioPreview(precioPreview)}</p>
          ) : null}
        </AiField>
        <AiField label={t.step02.estadoAnuncio} hint={t.step02.estadoAnuncioHint}>
          <select
            className={aiInputClass}
            value={state.estadoAnuncio}
            onChange={(ev) =>
              setState((s) => ({
                ...s,
                estadoAnuncio: ev.target.value as AgenteIndividualResidencialFormState["estadoAnuncio"],
              }))
            }
          >
            <option value="disponible">{est.disponible}</option>
            <option value="pendiente">{est.pendiente}</option>
            <option value="bajo_contrato">{est.bajo_contrato}</option>
            <option value="vendido">{est.vendido}</option>
          </select>
        </AiField>
        <div className="sm:col-span-2">
          <AiField label={t.step02.direccion} hint={t.step02.direccionHint}>
            <input
              className={aiInputClass}
              value={state.direccionLinea1}
              onChange={(ev) => {
                const v = ev.target.value;
                setState((s) => ({ ...s, direccionLinea1: v, direccion: v }));
              }}
              autoComplete="street-address"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={t.step02.direccionUnidad} hint={t.step02.direccionUnidadHint}>
            <input
              className={aiInputClass}
              value={state.direccionLinea2}
              onChange={(ev) => setState((s) => ({ ...s, direccionLinea2: ev.target.value }))}
              autoComplete="address-line2"
            />
          </AiField>
        </div>
        <BrAgenteLocationFormFields state={state} setState={setState} lang={lang} copy={t.step02} />
        <div className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-black/10 bg-white/80 px-3 py-2.5">
          <input
            id="agente-mostrar-direccion-exacta"
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0"
            checked={state.mostrarDireccionExacta}
            onChange={(ev) => setState((s) => ({ ...s, mostrarDireccionExacta: ev.target.checked }))}
          />
          <label htmlFor="agente-mostrar-direccion-exacta" className="text-sm leading-snug text-[#1E1810]">
            <span className="font-semibold">{t.step02.mostrarDireccionExacta}</span>
            <span className="mt-1 block text-xs text-[#5C5346]/90">{t.step02.mostrarDireccionExactaHint}</span>
          </label>
        </div>
      </div>
    </section>
  );
}

export function Step03Media({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: React.Dispatch<React.SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const { t } = useBrAgenteResidencialCopy();
  const photos = state.fotosDataUrls;

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{t.step03.title}</h2>
      <p className={aiSubClass}>{t.step03.sub}</p>
      <div className="mt-5 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{t.step03.fotos}</p>
          <label className="mt-2 inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-4 py-2.5 text-xs font-semibold touch-manipulation sm:min-h-0 sm:px-3 sm:py-2">
            {t.step03.agregarFotos}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                void Promise.all(files.map((f) => readFileAsDataUrl(f))).then((urls) => {
                  setState((s) => ({
                    ...s,
                    fotosDataUrls: [...s.fotosDataUrls, ...urls].slice(0, 40),
                  }));
                });
              }}
            />
          </label>
          {photos.length > 0 ? (
            <LeonixRealEstateSortablePhotoStrip
              urls={photos}
              primaryImageIndex={state.fotoPortadaIndex}
              onReorder={(nextUrls, nextPrimary) =>
                setState((s) => ({ ...s, fotosDataUrls: nextUrls, fotoPortadaIndex: nextPrimary }))
              }
              onRemove={(i) =>
                setState((s) => {
                  const next = s.fotosDataUrls.filter((_, j) => j !== i);
                  let idx = s.fotoPortadaIndex;
                  if (idx >= next.length) idx = Math.max(0, next.length - 1);
                  return { ...s, fotosDataUrls: next, fotoPortadaIndex: idx };
                })
              }
              onSetPrimary={(i) => setState((s) => ({ ...s, fotoPortadaIndex: i }))}
            />
          ) : null}
        </div>
        <UrlOrFileRow
          label={t.step02.listado}
          hint={t.step02.listadoHint}
          urlValue={state.listadoUrl}
          onUrl={(v) => setState((s) => ({ ...s, listadoUrl: v, listadoArchivoDataUrl: "", listadoArchivoNombre: "" }))}
          fileAccept="application/pdf,.pdf,image/*"
          onPickFile={(dataUrl, name) =>
            setState((s) => ({
              ...s,
              listadoArchivoDataUrl: dataUrl,
              listadoArchivoNombre: name,
              listadoUrl: "",
            }))
          }
          clearFile={() => setState((s) => ({ ...s, listadoArchivoDataUrl: "", listadoArchivoNombre: "" }))}
          fileActive={Boolean(state.listadoArchivoDataUrl)}
          fileName={state.listadoArchivoNombre}
          pegarUrl={t.step02.pegarUrl}
          subirArchivo={t.step02.subirPdf}
          quitar={t.step02.quitar}
          fileReadyLabel={t.step03.archivoListoPublicar}
          usarUrlLabel={t.step03.usarUrl}
        />
        <VideoUrlAddRows state={state} setState={setState} />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{t.step03.subirVideoDispositivo}</p>
          <label className="mt-2 inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-4 py-2.5 text-xs font-semibold text-[#5C4E2E] touch-manipulation sm:w-auto sm:min-h-0 sm:px-3 sm:py-2">
            {t.step03.subirVideoDispositivo}
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                void readFileAsDataUrl(f)
                  .then((dataUrl) =>
                    setState((s) => ({ ...s, videoDataUrl: dataUrl, videoUrl: "", videoUrls: [], videoArchivoNombre: f.name })),
                  )
                  .catch(() => {});
              }}
            />
          </label>
          {state.videoDataUrl ? (
            <div className="mt-2 rounded-xl border border-[#C9B46A]/45 bg-[#FFF9E8] px-3 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#6E5418]">{t.step03.videoListoPublicar}</p>
              {state.videoArchivoNombre ? <p className="mt-1 text-sm font-semibold text-[#1E1810]">{state.videoArchivoNombre}</p> : null}
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-red-800 hover:underline"
                onClick={() => setState((s) => ({ ...s, videoDataUrl: "", videoArchivoNombre: "" }))}
              >
                {t.step02.quitar}
              </button>
            </div>
          ) : null}
        </div>
        <UrlOrFileRow
          label={t.step03.tour}
          hint={t.step03.tourHint}
          urlValue={state.tourUrl}
          onUrl={(v) => setState((s) => ({ ...s, tourUrl: v, tourDataUrl: "", tourArchivoNombre: "" }))}
          fileAccept={BR_AGENTE_RES_TOUR_FILE_ACCEPT}
          onPickFile={(dataUrl, name) =>
            setState((s) => ({ ...s, tourDataUrl: dataUrl, tourUrl: "", tourArchivoNombre: name }))
          }
          clearFile={() => setState((s) => ({ ...s, tourDataUrl: "", tourArchivoNombre: "" }))}
          fileActive={Boolean(state.tourDataUrl)}
          fileName={state.tourArchivoNombre}
          pegarUrl={t.step02.pegarUrl}
          subirArchivo={t.step02.subirPdf}
          quitar={t.step02.quitar}
          fileReadyLabel={t.step03.archivoListoPublicar}
          usarUrlLabel={t.step03.usarUrl}
        />
        <UrlOrFileRow
          label={t.step03.folleto}
          hint={t.step03.folletoHint}
          urlValue={state.brochureUrl}
          onUrl={(v) => setState((s) => ({ ...s, brochureUrl: v, brochureDataUrl: "", brochureArchivoNombre: "" }))}
          fileAccept={BR_AGENTE_RES_BROCHURE_FILE_ACCEPT}
          onPickFile={(dataUrl, name) =>
            setState((s) => ({ ...s, brochureDataUrl: dataUrl, brochureUrl: "", brochureArchivoNombre: name }))
          }
          clearFile={() => setState((s) => ({ ...s, brochureDataUrl: "", brochureArchivoNombre: "" }))}
          fileActive={Boolean(state.brochureDataUrl)}
          fileName={state.brochureArchivoNombre}
          pegarUrl={t.step02.pegarUrl}
          subirArchivo={t.step02.subirPdf}
          quitar={t.step02.quitar}
          fileReadyLabel={t.step03.archivoListoPublicar}
          usarUrlLabel={t.step03.usarUrl}
        />
      </div>
    </section>
  );
}
