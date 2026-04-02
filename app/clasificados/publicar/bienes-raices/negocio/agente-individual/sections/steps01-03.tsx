"use client";

import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AiField, aiCardClass, aiInputClass, aiSubClass, aiTitleClass } from "../application/formPrimitives";
import { readFileAsDataUrl } from "../application/utils/readFileAsDataUrl";
import {
  SUBTIPO_POR_TIPO,
  SUBTIPO_SUBVALUE_LABEL_EN,
  TIPO_PROPIEDAD_LABEL_EN,
  TIPO_PROPIEDAD_OPCIONES,
} from "../schema/agenteResidencialTipoMeta";
import type { TipoPropiedadCodigo } from "../schema/agenteResidencialTipoMeta";
import { useBrAgenteResidencialCopy } from "../application/BrAgenteResidencialLocaleContext";

export function Step01TipoAnuncio({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: React.Dispatch<React.SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const { lang, t } = useBrAgenteResidencialCopy();
  const codigo = state.tipoPropiedadCodigo;
  const subtipos = SUBTIPO_POR_TIPO[codigo];
  const showSubtipoDropdown = subtipos.length > 0 && codigo !== "otro";

  const tipoLabel = (value: TipoPropiedadCodigo) =>
    lang === "en" ? TIPO_PROPIEDAD_LABEL_EN[value] : TIPO_PROPIEDAD_OPCIONES.find((o) => o.value === value)?.label ?? value;

  const subtipoOptionLabel = (value: string, fallback: string) =>
    lang === "en" ? SUBTIPO_SUBVALUE_LABEL_EN[value] ?? fallback : fallback;

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{t.step01.title}</h2>
      <p className={aiSubClass}>{t.step01.sub}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AiField label={t.step01.tipoPublicacion} hint={t.step01.tipoPublicacionHint}>
          <div className="mt-1.5 flex items-center gap-2">
            <input className={aiInputClass} readOnly value={t.step01.ventaResidencial} aria-readonly />
          </div>
        </AiField>
        <AiField label={t.step01.tipoPropiedad}>
          <select
            className={aiInputClass}
            value={codigo}
            onChange={(e) => {
              const next = e.target.value as TipoPropiedadCodigo;
              setState((s) => ({
                ...s,
                tipoPropiedadCodigo: next,
                tipoPropiedadOtro: next === "otro" ? s.tipoPropiedadOtro : "",
                subtipoPropiedad: next === "otro" ? "" : SUBTIPO_POR_TIPO[next].length ? "" : s.subtipoPropiedad,
              }));
            }}
          >
            {TIPO_PROPIEDAD_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {tipoLabel(o.value)}
              </option>
            ))}
          </select>
        </AiField>

        {codigo === "otro" ? (
          <div className="sm:col-span-2">
            <AiField label={t.step01.especificaTipo} hint={t.step01.especificaTipoHint}>
              <input
                className={aiInputClass}
                value={state.tipoPropiedadOtro}
                onChange={(e) => setState((s) => ({ ...s, tipoPropiedadOtro: e.target.value }))}
                autoComplete="off"
              />
            </AiField>
          </div>
        ) : null}

        {showSubtipoDropdown ? (
          <div className="sm:col-span-2">
            <AiField label={t.step01.subtipo} hint={t.step01.subtipoHint}>
              <select
                className={aiInputClass}
                value={state.subtipoPropiedad}
                onChange={(e) => setState((s) => ({ ...s, subtipoPropiedad: e.target.value }))}
              >
                {subtipos.map((o) => (
                  <option key={o.value || "none"} value={o.value}>
                    {subtipoOptionLabel(o.value, o.label)}
                  </option>
                ))}
              </select>
            </AiField>
          </div>
        ) : codigo === "otro" ? (
          <div className="sm:col-span-2">
            <AiField label={t.step01.detalleAdicional} hint={t.step01.detalleAdicionalHint}>
              <input
                className={aiInputClass}
                value={state.subtipoPropiedad}
                onChange={(e) => setState((s) => ({ ...s, subtipoPropiedad: e.target.value }))}
                autoComplete="off"
              />
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
  archivo,
  adjunto,
  quitar,
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
  archivo: string;
  adjunto: string;
  quitar: string;
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
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold text-[#5C4E2E]">
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
        <p className="mt-2 text-xs text-[#5C5346]">
          {archivo} {fileName || adjunto}{" "}
          <button type="button" className="font-semibold text-red-800" onClick={clearFile}>
            {quitar}
          </button>
        </p>
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
  const { t } = useBrAgenteResidencialCopy();
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
        <AiField label={t.step02.ciudad}>
          <input
            className={aiInputClass}
            value={state.ciudad}
            onChange={(ev) => setState((s) => ({ ...s, ciudad: ev.target.value }))}
            autoComplete="address-level2"
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
            onUrl={(v) => setState((s) => ({ ...s, listadoUrl: v }))}
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
            archivo={t.step02.archivo}
            adjunto={t.step02.adjunto}
            quitar={t.step02.quitar}
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
          <label className="mt-2 inline-flex cursor-pointer items-center rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold">
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
            <div className="mt-3 flex flex-wrap gap-3">
              {photos.map((u, i) => (
                <div key={`${i}-${u.slice(0, 32)}`} className="flex flex-col gap-1">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-20 w-20 rounded-lg border object-cover" />
                    <button
                      type="button"
                      className="absolute -right-1 -top-1 rounded-full bg-white px-1.5 text-xs shadow"
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
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={i <= 0}
                      className="rounded border border-[#E8DFD0] bg-white px-1.5 py-0.5 text-[10px] font-semibold disabled:opacity-40"
                      aria-label={t.step03.moverIzq}
                      onClick={() => swapPhotos(i, i - 1)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={i >= photos.length - 1}
                      className="rounded border border-[#E8DFD0] bg-white px-1.5 py-0.5 text-[10px] font-semibold disabled:opacity-40"
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
          onUrl={(v) => setState((s) => ({ ...s, videoUrl: v, videoDataUrl: "" }))}
          fileAccept="video/*"
          onPickFile={(dataUrl) => setState((s) => ({ ...s, videoDataUrl: dataUrl, videoUrl: "" }))}
          clearFile={() => setState((s) => ({ ...s, videoDataUrl: "" }))}
          fileActive={Boolean(state.videoDataUrl)}
          pegarUrl={t.step02.pegarUrl}
          subirArchivo={t.step02.subirPdf}
          archivo={t.step02.archivo}
          adjunto={t.step02.adjunto}
          quitar={t.step02.quitar}
        />
        <UrlOrFileRow
          label={t.step03.tour}
          hint={t.step03.tourHint}
          urlValue={state.tourUrl}
          onUrl={(v) => setState((s) => ({ ...s, tourUrl: v, tourDataUrl: "" }))}
          fileAccept="image/*,application/pdf,.pdf"
          onPickFile={(dataUrl) => setState((s) => ({ ...s, tourDataUrl: dataUrl, tourUrl: "" }))}
          clearFile={() => setState((s) => ({ ...s, tourDataUrl: "" }))}
          fileActive={Boolean(state.tourDataUrl)}
          pegarUrl={t.step02.pegarUrl}
          subirArchivo={t.step02.subirPdf}
          archivo={t.step02.archivo}
          adjunto={t.step02.adjunto}
          quitar={t.step02.quitar}
        />
        <UrlOrFileRow
          label={t.step03.folleto}
          hint={t.step03.folletoHint}
          urlValue={state.brochureUrl}
          onUrl={(v) => setState((s) => ({ ...s, brochureUrl: v, brochureDataUrl: "" }))}
          fileAccept="application/pdf,.pdf"
          onPickFile={(dataUrl) => setState((s) => ({ ...s, brochureDataUrl: dataUrl, brochureUrl: "" }))}
          clearFile={() => setState((s) => ({ ...s, brochureDataUrl: "" }))}
          fileActive={Boolean(state.brochureDataUrl)}
          pegarUrl={t.step02.pegarUrl}
          subirArchivo={t.step02.subirPdf}
          archivo={t.step02.archivo}
          adjunto={t.step02.adjunto}
          quitar={t.step02.quitar}
        />
      </div>
    </section>
  );
}
