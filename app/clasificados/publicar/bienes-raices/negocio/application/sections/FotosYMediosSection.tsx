"use client";

import { useRef } from "react";
import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import { cx } from "../helpers/cx";
import type { NegocioFormApi } from "../types/negocioFormApi";

const MAX_IMAGES = 12;

export function FotosYMediosSection({ state, setState }: NegocioFormApi) {
  const { inmueble } = state;
  const fileRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setState((s) => {
      const cur = [...s.inmueble.imagenes];
      for (let i = 0; i < files.length && cur.length < MAX_IMAGES; i++) {
        cur.push(URL.createObjectURL(files[i]));
      }
      return { ...s, inmueble: { ...s.inmueble, imagenes: cur.slice(0, MAX_IMAGES) } };
    });
  }

  function removeAt(idx: number) {
    setState((s) => {
      const cur = [...s.inmueble.imagenes];
      const url = cur[idx];
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      cur.splice(idx, 1);
      return { ...s, inmueble: { ...s.inmueble, imagenes: cur } };
    });
  }

  const p = (k: keyof typeof inmueble, v: string) =>
    setState((s) => ({ ...s, inmueble: { ...s.inmueble, [k]: v } }));

  return (
    <BrSectionShell
      title="Fotos y medios"
      description="Sube fotos claras y bien iluminadas. Puedes agregar hasta 12 imágenes. El orden lo ajustamos en una siguiente etapa."
    >
      <div>
        <label className={brLabelClass}>Galería (hasta {MAX_IMAGES})</label>
        <p className={brHintClass}>La primera imagen será la principal en la ficha.</p>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cx(
            "mt-2 rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#F0F0F0]"
          )}
        >
          Agregar fotos
        </button>
        {inmueble.imagenes.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {inmueble.imagenes.map((url, i) => (
              <li key={`${url}-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-20 w-20 rounded-lg border border-black/10 object-cover" />
                <button
                  type="button"
                  className="absolute -right-1 -top-1 rounded-full bg-black/70 px-1.5 text-xs text-white"
                  onClick={() => removeAt(i)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div>
        <label className={brLabelClass}>URL de video</label>
        <p className={brHintClass}>Pega el enlace completo, por ejemplo de YouTube o Vimeo.</p>
        <input className={`${brInputClass} mt-2`} value={inmueble.videoUrl} onChange={(e) => p("videoUrl", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Tour virtual</label>
        <p className={brHintClass}>Pega el enlace completo del tour virtual, por ejemplo Matterport.</p>
        <input className={`${brInputClass} mt-2`} value={inmueble.tourVirtualUrl} onChange={(e) => p("tourVirtualUrl", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Miniatura de video (URL)</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.videoThumbUrl} onChange={(e) => p("videoThumbUrl", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Plano / floor plan (URL)</label>
          <p className={brHintClass}>Sube el plano o agrega la URL si ya lo tienes en línea.</p>
          <input className={`${brInputClass} mt-2`} value={inmueble.planoUrl} onChange={(e) => p("planoUrl", e.target.value)} />
        </div>
      </div>
    </BrSectionShell>
  );
}
