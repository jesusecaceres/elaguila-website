"use client";

import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AiField, aiCardClass, aiInputClass, aiLabelClass, aiSubClass, aiTitleClass } from "../application/formPrimitives";
import { readFileAsDataUrl } from "../application/utils/readFileAsDataUrl";

export function Step01TipoAnuncio({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: React.Dispatch<React.SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Tipo de anuncio</h2>
      <p className={aiSubClass}>Residencial en Leonix: una vitrina clara para compradores.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AiField label="Tipo de publicación">
          <select
            className={aiInputClass}
            value={state.tipoPublicacion}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                tipoPublicacion: e.target.value as AgenteIndividualResidencialFormState["tipoPublicacion"],
              }))
            }
          >
            <option value="residencial_venta">Venta residencial</option>
            <option value="residencial_renta">Renta residencial</option>
          </select>
        </AiField>
        <AiField label="Tipo de propiedad">
          <input
            className={aiInputClass}
            value={state.tipoPropiedad}
            onChange={(e) => setState((s) => ({ ...s, tipoPropiedad: e.target.value }))}
            placeholder="Ej. Casa, condominio, townhome"
            autoComplete="off"
          />
        </AiField>
        <div className="sm:col-span-2">
          <AiField
            label="Subtipo (opcional)"
            hint="Sólo si aplica a tu modelo de propiedad (ej. piso en condominio)."
          >
            <input
              className={aiInputClass}
              value={state.subtipoPropiedad}
              onChange={(e) => setState((s) => ({ ...s, subtipoPropiedad: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
      </div>
    </section>
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
        <AiField label="Estado del anuncio" hint="Indica si sigue disponible, bajo contrato o vendido.">
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
            <option value="proximamente">Próximamente</option>
            <option value="bajo_contrato">Bajo contrato</option>
            <option value="vendido">Vendido</option>
            <option value="rentado">Rentado</option>
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
          <AiField
            label="Enlace del listado"
            hint="Pega el enlace del MLS, sitio web o publicación original."
          >
            <input
              className={aiInputClass}
              type="url"
              value={state.enlaceListado}
              onChange={(e) => setState((s) => ({ ...s, enlaceListado: e.target.value }))}
              autoComplete="url"
              placeholder="https://"
            />
          </AiField>
        </div>
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
  onFileDataUrl,
  clearDataUrl,
  dataUrlActive,
}: {
  label: string;
  hint?: string;
  urlValue: string;
  onUrl: (v: string) => void;
  fileAccept: string;
  onFileDataUrl: (v: string) => void;
  clearDataUrl: () => void;
  dataUrlActive: boolean;
}) {
  return (
    <AiField label={label} hint={hint}>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-start">
        <input
          type="url"
          className={`${aiInputClass} sm:flex-1`}
          value={urlValue}
          onChange={(e) => onUrl(e.target.value)}
          placeholder="Pegar URL (https://…)"
          autoComplete="off"
        />
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold text-[#5C4E2E]">
          Subir archivo
          <input
            type="file"
            accept={fileAccept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              void readFileAsDataUrl(f).then(onFileDataUrl).catch(() => {});
            }}
          />
        </label>
      </div>
      {dataUrlActive ? (
        <button type="button" className="mt-2 text-xs font-semibold text-red-800" onClick={clearDataUrl}>
          Quitar archivo subido
        </button>
      ) : null}
    </AiField>
  );
}

export function Step03Media({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: React.Dispatch<React.SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const m = state.media;
  const photos = m.photoUrls;

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Fotos y medios</h2>
      <p className={aiSubClass}>Sube archivos o pega enlaces. La imagen principal es la portada en la vista previa.</p>
      <div className="mt-5 space-y-6">
        <div>
          <p className={aiLabelClass}>Fotos</p>
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
                    media: { ...s.media, photoUrls: [...s.media.photoUrls, ...urls].slice(0, 40) },
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
                        const next = s.media.photoUrls.filter((_, j) => j !== i);
                        let idx = s.media.primaryImageIndex;
                        if (idx >= next.length) idx = Math.max(0, next.length - 1);
                        return { ...s, media: { ...s.media, photoUrls: next, primaryImageIndex: idx } };
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
              value={m.primaryImageIndex}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  media: { ...s.media, primaryImageIndex: Number(e.target.value) },
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
          label="Video"
          hint="Enlace público o archivo (se muestra en la cuadrícula de vista previa)."
          urlValue={m.videoUrl}
          onUrl={(v) => setState((s) => ({ ...s, media: { ...s.media, videoUrl: v } }))}
          fileAccept="video/*"
          onFileDataUrl={(v) => setState((s) => ({ ...s, media: { ...s.media, videoDataUrl: v, videoUrl: "" } }))}
          clearDataUrl={() => setState((s) => ({ ...s, media: { ...s.media, videoDataUrl: "" } }))}
          dataUrlActive={Boolean(m.videoDataUrl)}
        />
        <UrlOrFileRow
          label="Tour o recorrido"
          hint="Matterport, enlace 360 o PDF del recorrido."
          urlValue={m.tourUrl}
          onUrl={(v) => setState((s) => ({ ...s, media: { ...s.media, tourUrl: v } }))}
          fileAccept="image/*,application/pdf,.pdf"
          onFileDataUrl={(v) => setState((s) => ({ ...s, media: { ...s.media, tourDataUrl: v, tourUrl: "" } }))}
          clearDataUrl={() => setState((s) => ({ ...s, media: { ...s.media, tourDataUrl: "" } }))}
          dataUrlActive={Boolean(m.tourDataUrl)}
        />
        <UrlOrFileRow
          label="Folleto o PDF (opcional)"
          urlValue={m.brochureUrl}
          onUrl={(v) => setState((s) => ({ ...s, media: { ...s.media, brochureUrl: v } }))}
          fileAccept="application/pdf,.pdf"
          onFileDataUrl={(v) => setState((s) => ({ ...s, media: { ...s.media, brochureDataUrl: v, brochureUrl: "" } }))}
          clearDataUrl={() => setState((s) => ({ ...s, media: { ...s.media, brochureDataUrl: "" } }))}
          dataUrlActive={Boolean(m.brochureDataUrl)}
        />
      </div>
    </section>
  );
}
