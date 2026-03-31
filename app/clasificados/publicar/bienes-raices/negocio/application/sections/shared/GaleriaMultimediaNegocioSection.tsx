"use client";

import type { BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
import { BrField, BrPreviewHint, brInputClass, brCardClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

const MAX_PHOTOS = 50;
const MAX_VIDEOS = 2;
const MAX_PLANS = 3;

export function GaleriaMultimediaNegocioSection({
  state,
  setState,
  isConstructor,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
  isConstructor: boolean;
}) {
  const displayPhotos = state.media.photoUrls.length === 0 ? [""] : state.media.photoUrls;

  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Galería multimedia</h2>
      <p className={brSubTitleClass}>
        Sube enlaces a tus archivos (por ahora URLs). La primera foto o la que marques como portada alimenta el hero; dos videos
        llenan los thumbnails; el tour y los planos activan sus bloques en la vista previa.
      </p>
      <BrPreviewHint>
        Estas fotos alimentan la galería principal del preview; el plano de sitio solo se muestra en flujo constructor.
      </BrPreviewHint>

      <div className="mt-5 space-y-4">
        <BrField
          label="Fotos (URLs, una por línea o usa agregar)"
          hint={`Hasta ${MAX_PHOTOS} fotos. Orden = carrusel; la portada es el índice abajo.`}
        >
          <div className="space-y-2">
            {displayPhotos.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={brInputClass}
                  value={url}
                  placeholder="https://…"
                  onChange={(e) => {
                    const base = state.media.photoUrls.length === 0 ? [] : [...state.media.photoUrls];
                    while (base.length <= i) base.push("");
                    base[i] = e.target.value;
                    setState((s) => ({ ...s, media: { ...s.media, photoUrls: base } }));
                  }}
                />
                <button
                  type="button"
                  className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-2 text-sm font-semibold text-red-800"
                  onClick={() => {
                    const next = state.media.photoUrls.filter((_, j) => j !== i);
                    setState((s) => ({
                      ...s,
                      media: { ...s.media, photoUrls: next, coverIndex: Math.min(s.media.coverIndex, Math.max(0, next.length - 1)) },
                    }));
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-sm font-semibold text-[#5C4E2E]"
              disabled={state.media.photoUrls.length >= MAX_PHOTOS}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  media: { ...s.media, photoUrls: [...s.media.photoUrls, ""] },
                }))
              }
            >
              + Agregar foto
            </button>
          </div>
        </BrField>

        <BrField label="Índice de foto de portada (0 = primera)" hint="Debe ser menor al número de fotos con URL válida.">
          <input
            type="number"
            min={0}
            className={brInputClass}
            value={state.media.coverIndex}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                media: { ...s.media, coverIndex: Math.max(0, parseInt(e.target.value, 10) || 0) },
              }))
            }
          />
        </BrField>

        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: MAX_VIDEOS }).map((_, i) => (
            <BrField key={i} label={`Video ${i + 1} (URL de archivo o miniatura)`}>
              <input
                className={brInputClass}
                value={state.media.videoUrls[i] ?? ""}
                onChange={(e) => {
                  const next = [...state.media.videoUrls];
                  next[i] = e.target.value;
                  while (next.length < MAX_VIDEOS) next.push("");
                  setState((s) => ({ ...s, media: { ...s.media, videoUrls: next.slice(0, MAX_VIDEOS) } }));
                }}
              />
            </BrField>
          ))}
        </div>

        <BrField label="Enlace de tour virtual" hint="Si hay URL, el panel de tour virtual se activa en la vista previa.">
          <input
            className={brInputClass}
            value={state.media.virtualTourUrl}
            onChange={(e) => setState((s) => ({ ...s, media: { ...s.media, virtualTourUrl: e.target.value } }))}
          />
        </BrField>

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: MAX_PLANS }).map((_, i) => (
            <BrField key={i} label={`Plano ${i + 1}`}>
              <input
                className={brInputClass}
                value={state.media.floorPlanUrls[i] ?? ""}
                onChange={(e) => {
                  const next = [...state.media.floorPlanUrls];
                  next[i] = e.target.value;
                  while (next.length < MAX_PLANS) next.push("");
                  setState((s) => ({ ...s, media: { ...s.media, floorPlanUrls: next.slice(0, MAX_PLANS) } }));
                }}
              />
            </BrField>
          ))}
        </div>

        {isConstructor ? (
          <BrField label="Plano del sitio / comunidad (desarrollador)" hint="Opcional; refuerza el flujo de proyecto nuevo.">
            <input
              className={brInputClass}
              value={state.media.sitePlanUrl}
              onChange={(e) => setState((s) => ({ ...s, media: { ...s.media, sitePlanUrl: e.target.value } }))}
            />
          </BrField>
        ) : null}
      </div>
    </section>
  );
}
