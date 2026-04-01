"use client";

import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AiField, aiCardClass, aiInputClass, aiSubClass, aiTitleClass } from "../application/formPrimitives";
import { readFileAsDataUrl } from "../application/utils/readFileAsDataUrl";
import { SUBTIPO_POR_TIPO, TIPO_PROPIEDAD_OPCIONES } from "../schema/agenteResidencialTipoMeta";
import type { TipoPropiedadCodigo } from "../schema/agenteResidencialTipoMeta";

export function Step01TipoAnuncio({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: React.Dispatch<React.SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const codigo = state.tipoPropiedadCodigo;
  const subtipos = SUBTIPO_POR_TIPO[codigo];
  const showSubtipoDropdown = subtipos.length > 0 && codigo !== "otro";

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Tipo de anuncio</h2>
      <p className={aiSubClass}>Residencial en Leonix: una vitrina clara para compradores. Esta ruta es solo venta.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AiField label="Tipo de publicación" hint="Fijo en esta variante: solo venta residencial.">
          <div className="mt-1.5 flex items-center gap-2">
            <input className={aiInputClass} readOnly value="Venta residencial" aria-readonly />
          </div>
        </AiField>
        <AiField label="Tipo de propiedad">
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
                {o.label}
              </option>
            ))}
          </select>
        </AiField>

        {codigo === "otro" ? (
          <div className="sm:col-span-2">
            <AiField label="Especifica el tipo de propiedad" hint="Se muestra en el anuncio como tipo de propiedad.">
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
            <AiField
              label="Subtipo (opcional)"
              hint="Detalle según el tipo elegido (por ejemplo penthouse o planta baja). No es obligatorio."
            >
              <select
                className={aiInputClass}
                value={state.subtipoPropiedad}
                onChange={(e) => setState((s) => ({ ...s, subtipoPropiedad: e.target.value }))}
              >
                {subtipos.map((o) => (
                  <option key={o.value || "none"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </AiField>
          </div>
        ) : codigo === "otro" ? (
          <div className="sm:col-span-2">
            <AiField label="Detalle adicional (opcional)" hint="Si quieres añadir una nota corta sobre el tipo o la distribución.">
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
}) {
  return (
    <AiField label={label} hint={hint}>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-start">
        <input
          type="url"
          className={`${aiInputClass} sm:flex-1`}
          value={urlValue}
          onChange={(e) => onUrl(e.target.value)}
          placeholder="Pegar URL"
          autoComplete="off"
        />
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold text-[#5C4E2E]">
          Subir PDF o archivo
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
          Archivo: {fileName || "adjunto"}{" "}
          <button type="button" className="font-semibold text-red-800" onClick={clearFile}>
            Quitar
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
  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Información básica</h2>
      <p className={aiSubClass}>Datos que verán primero los compradores en la vista previa.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <AiField label="Título del anuncio">
            <input
              className={aiInputClass}
              value={state.titulo}
              onChange={(e) => setState((s) => ({ ...s, titulo: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <AiField label="Precio" hint="Usa números; en la vista previa se muestra en dólares.">
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5C5346]">$</span>
            <input
              className={`${aiInputClass} pl-7`}
              inputMode="decimal"
              value={state.precio}
              onChange={(e) => setState((s) => ({ ...s, precio: e.target.value }))}
              autoComplete="off"
            />
          </div>
        </AiField>
        <AiField label="Estado del anuncio" hint="Indica si sigue disponible, pendiente, bajo contrato o vendido.">
          <select
            className={aiInputClass}
            value={state.estadoAnuncio}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                estadoAnuncio: e.target.value as AgenteIndividualResidencialFormState["estadoAnuncio"],
              }))
            }
          >
            <option value="disponible">Disponible</option>
            <option value="pendiente">Pendiente</option>
            <option value="bajo_contrato">Bajo contrato</option>
            <option value="vendido">Vendido</option>
          </select>
        </AiField>
        <AiField label="Ciudad">
          <input
            className={aiInputClass}
            value={state.ciudad}
            onChange={(e) => setState((s) => ({ ...s, ciudad: e.target.value }))}
            autoComplete="address-level2"
          />
        </AiField>
        <AiField label="Área de la ciudad" hint="La zona general donde se ubica la propiedad.">
          <input
            className={aiInputClass}
            value={state.areaCiudad}
            onChange={(e) => setState((s) => ({ ...s, areaCiudad: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <div className="sm:col-span-2">
          <AiField label="Dirección" hint="Calle y número; puedes omitir número interior en el anuncio público.">
            <input
              className={aiInputClass}
              value={state.direccion}
              onChange={(e) => setState((s) => ({ ...s, direccion: e.target.value }))}
              autoComplete="street-address"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <UrlOrFileRow
            label="Enlace o archivo del listado"
            hint="Así el comprador puede ver más detalles en tu publicación original sin llenar demasiado este anuncio."
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
  const photos = state.fotosDataUrls;

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Fotos y medios</h2>
      <p className={aiSubClass}>
        La imagen principal es la portada. Video, tour y folleto se usan en la vista previa cuando activas los botones correspondientes.
      </p>
      <div className="mt-5 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">Fotos</p>
          <label className="mt-2 inline-flex cursor-pointer items-center rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold">
            Agregar fotos
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
            <div className="mt-3 flex flex-wrap gap-2">
              {photos.map((u, i) => (
                <div key={`${i}-${u.slice(0, 24)}`} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="h-20 w-20 rounded-lg border object-cover" />
                  <button
                    type="button"
                    className="absolute -right-1 -top-1 rounded-full bg-white px-1.5 text-xs shadow"
                    onClick={() =>
                      setState((s) => {
                        const next = s.fotosDataUrls.filter((_, j) => j !== i);
                        let idx = s.fotoPortadaIndex;
                        if (idx >= next.length) idx = Math.max(0, next.length - 1);
                        return { ...s, fotosDataUrls: next, fotoPortadaIndex: idx };
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {photos.length > 0 ? (
          <AiField label="Imagen principal (portada)" hint="Elige cuál foto es la portada.">
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
                  Foto {i + 1}
                </option>
              ))}
            </select>
          </AiField>
        ) : null}
        <UrlOrFileRow
          label="Video (opcional)"
          hint="Enlace público o archivo breve para la cuadrícula de vista previa."
          urlValue={state.videoUrl}
          onUrl={(v) => setState((s) => ({ ...s, videoUrl: v, videoDataUrl: "" }))}
          fileAccept="video/*"
          onPickFile={(dataUrl) => setState((s) => ({ ...s, videoDataUrl: dataUrl, videoUrl: "" }))}
          clearFile={() => setState((s) => ({ ...s, videoDataUrl: "" }))}
          fileActive={Boolean(state.videoDataUrl)}
        />
        <UrlOrFileRow
          label="Tour o recorrido (opcional)"
          hint="Matterport, enlace 360 o archivo; se enlaza con «Ver tour» si está activo."
          urlValue={state.tourUrl}
          onUrl={(v) => setState((s) => ({ ...s, tourUrl: v, tourDataUrl: "" }))}
          fileAccept="image/*,application/pdf,.pdf"
          onPickFile={(dataUrl) => setState((s) => ({ ...s, tourDataUrl: dataUrl, tourUrl: "" }))}
          clearFile={() => setState((s) => ({ ...s, tourDataUrl: "" }))}
          fileActive={Boolean(state.tourDataUrl)}
        />
        <UrlOrFileRow
          label="Folleto o PDF (opcional)"
          hint="Se enlaza con «Ver folleto» si está activo."
          urlValue={state.brochureUrl}
          onUrl={(v) => setState((s) => ({ ...s, brochureUrl: v, brochureDataUrl: "" }))}
          fileAccept="application/pdf,.pdf"
          onPickFile={(dataUrl) => setState((s) => ({ ...s, brochureDataUrl: dataUrl, brochureUrl: "" }))}
          clearFile={() => setState((s) => ({ ...s, brochureDataUrl: "" }))}
          fileActive={Boolean(state.brochureDataUrl)}
        />
      </div>
    </section>
  );
}
