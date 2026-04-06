"use client";

import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AiField, aiCardClass, aiInputClass, aiSubClass, aiTitleClass } from "../application/formPrimitives";
import { readFileAsDataUrl } from "../application/utils/readFileAsDataUrl";
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
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { useBrAgenteResidencialCopy } from "../application/BrAgenteResidencialLocaleContext";

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
                  tipoPropiedadOtro: "",
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
  uploadedLabel,
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
  uploadedLabel: string;
}) {
  return (
    <AiField label={label} hint={hint}>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-start">
        <input
          type="url"
          className={`${aiInputClass} sm:flex-1`}
          value={urlValue}
          onChange={(e) => onUrl(e.target.value)}
          placeholder={pegarUrl}
          autoComplete="off"
        />
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
      {fileActive ? (
        <div className="mt-2 rounded-xl border border-[#C9B46A]/45 bg-[#FFF9E8] px-3 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#6E5418]">{uploadedLabel}</p>
          {fileName ? <p className="mt-1 text-sm font-semibold text-[#1E1810]">{fileName}</p> : null}
          <button type="button" className="mt-2 text-xs font-semibold text-red-800 hover:underline" onClick={clearFile}>
            {quitar}
          </button>
        </div>
      ) : null}
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
        <AiField label={t.step02.ciudad} hint={t.step02.ciudadHint}>
          <CityAutocomplete
            value={state.ciudad}
            onChange={(v) => setState((s) => ({ ...s, ciudad: v }))}
            lang={lang}
            variant="brForm"
            stripInvalidOnBlur
            placeholder={t.step02.ciudadPlaceholder}
            className="w-full"
          />
        </AiField>
        <AiField label={t.step02.area} hint={t.step02.areaHint}>
          <input
            className={aiInputClass}
            value={state.areaCiudad}
            onChange={(ev) => setState((s) => ({ ...s, areaCiudad: ev.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <div className="sm:col-span-2">
          <AiField label={t.step02.direccion} hint={t.step02.direccionHint}>
            <input
              className={aiInputClass}
              value={state.direccion}
              onChange={(ev) => setState((s) => ({ ...s, direccion: ev.target.value }))}
              autoComplete="street-address"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
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
            uploadedLabel={t.step03.archivoSubido}
          />
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

  const swapPhotos = (i: number, j: number) => {
    if (j < 0 || j >= photos.length || i === j) return;
    setState((s) => {
      const next = [...s.fotosDataUrls];
      [next[i], next[j]] = [next[j], next[i]];
      let idx = s.fotoPortadaIndex;
      if (idx === i) idx = j;
      else if (idx === j) idx = i;
      return { ...s, fotosDataUrls: next, fotoPortadaIndex: idx };
    });
  };

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
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible">
              {photos.map((u, i) => (
                <div key={`${i}-${u.slice(0, 32)}`} className="flex w-[5.5rem] shrink-0 flex-col gap-1.5 sm:w-auto sm:shrink">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-[5.5rem] w-[5.5rem] rounded-lg border object-cover sm:h-20 sm:w-20" />
                    <button
                      type="button"
                      className="absolute -right-1 -top-1 flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-white px-2 text-xs shadow touch-manipulation"
                      aria-label={t.step03.eliminar}
                      onClick={() =>
                        setState((s) => {
                          const next = s.fotosDataUrls.filter((_, j) => j !== i);
                          let idx = s.fotoPortadaIndex;
                          if (idx === i) idx = Math.min(i, Math.max(0, next.length - 1));
                          else if (idx > i) idx -= 1;
                          if (idx >= next.length) idx = Math.max(0, next.length - 1);
                          return { ...s, fotosDataUrls: next, fotoPortadaIndex: idx };
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={i <= 0}
                      className="min-h-[40px] min-w-[2.5rem] touch-manipulation rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-[11px] font-semibold disabled:opacity-40 sm:min-h-0 sm:min-w-0 sm:px-1.5 sm:py-0.5 sm:text-[10px]"
                      aria-label={t.step03.moverIzq}
                      onClick={() => swapPhotos(i, i - 1)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={i >= photos.length - 1}
                      className="min-h-[40px] min-w-[2.5rem] touch-manipulation rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-[11px] font-semibold disabled:opacity-40 sm:min-h-0 sm:min-w-0 sm:px-1.5 sm:py-0.5 sm:text-[10px]"
                      aria-label={t.step03.moverDer}
                      onClick={() => swapPhotos(i, i + 1)}
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {photos.length > 0 ? (
          <AiField label={t.step03.portada} hint={t.step03.portadaHint}>
            <select
              className={aiInputClass}
              value={state.fotoPortadaIndex}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  fotoPortadaIndex: Number(e.target.value),
                }))
              }
            >
              {photos.map((_, i) => (
                <option key={i} value={i}>
                  {t.step03.fotoN(i + 1)}
                </option>
              ))}
            </select>
          </AiField>
        ) : null}
        <UrlOrFileRow
          label={t.step03.video}
          hint={t.step03.videoHint}
          urlValue={state.videoUrl}
          onUrl={(v) => setState((s) => ({ ...s, videoUrl: v, videoDataUrl: "", videoArchivoNombre: "" }))}
          fileAccept="video/*"
          onPickFile={(dataUrl, name) =>
            setState((s) => ({ ...s, videoDataUrl: dataUrl, videoUrl: "", videoArchivoNombre: name }))
          }
          clearFile={() => setState((s) => ({ ...s, videoDataUrl: "", videoArchivoNombre: "" }))}
          fileActive={Boolean(state.videoDataUrl)}
          fileName={state.videoArchivoNombre}
          pegarUrl={t.step02.pegarUrl}
          subirArchivo={t.step03.subirVideo}
          quitar={t.step02.quitar}
          uploadedLabel={t.step03.archivoSubido}
        />
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
          uploadedLabel={t.step03.archivoSubido}
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
          uploadedLabel={t.step03.archivoSubido}
        />
      </div>
    </section>
  );
}
