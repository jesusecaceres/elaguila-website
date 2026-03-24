"use client";

import { useRef } from "react";
import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { cx, labelClass } from "../helpers/fieldCx";

const COPY = {
  es: {
    title: "Fotos",
    desc: "Agrega fotos reales y claras. Eso ayuda a vender más rápido.",
    primary: "Foto principal",
    gallery: "Galería",
    add: "Añadir fotos",
    hint: "Estructura lista para subida; la publicación final conectará al almacenamiento.",
  },
  en: {
    title: "Photos",
    desc: "Add real, clear photos — they sell faster.",
    primary: "Primary photo",
    gallery: "Gallery",
    add: "Add photos",
    hint: "Structure ready for upload; publish step will connect storage.",
  },
} as const;

export function PhotosSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<S>) {
  const t = COPY[lang];
  const inputRef = useRef<HTMLInputElement>(null);

  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: string[] = [...state.images];
    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      next.push(url);
    }
    setState((s) => ({ ...s, images: next }));
  }

  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <p className="text-xs text-[#111111]/55">{t.hint}</p>
      <div>
        <label className={labelClass}>{t.primary}</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {state.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.images[0]} alt="" className="h-28 w-28 rounded-xl border object-cover" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-black/20 text-xs text-[#111111]/45">
              —
            </div>
          )}
        </div>
      </div>
      <div>
        <label className={labelClass}>{t.gallery}</label>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cx(
            "mt-2 rounded-xl border border-black/15 bg-[#F5F5F5] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#ECECEC]"
          )}
        >
          {t.add}
        </button>
        {state.images.length > 1 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {state.images.slice(1).map((url, i) => (
              <li key={`${url}-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-20 w-20 rounded-lg border object-cover" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </SectionShell>
  );
}
