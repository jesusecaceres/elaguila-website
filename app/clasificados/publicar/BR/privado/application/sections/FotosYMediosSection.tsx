"use client";

import Image from "next/image";
import type { LeonixBRPrivadoMedios } from "../schema/leonixBrPrivadoForm";
import { LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

const MAX_IMAGES = 12;

export function FotosYMediosSection({
  value,
  onChange,
  onPickGalleryFiles,
}: {
  value: LeonixBRPrivadoMedios;
  onChange: (next: LeonixBRPrivadoMedios) => void;
  onPickGalleryFiles: (files: FileList | null) => void;
}) {
  const remaining = Math.max(0, MAX_IMAGES - value.imagenesDataUrls.length);
  return (
    <SectionShell
      title="Fotos y medios"
      description="Sube fotos claras y bien iluminadas. Puedes agregar hasta 12 imágenes."
    >
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <p className="text-sm font-semibold text-[#111111]">Galería</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <label
            className={`cursor-pointer rounded-xl border border-dashed border-black/20 bg-[#FAFAFA] px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-[#F0F0F0] ${remaining === 0 ? "pointer-events-none opacity-50" : ""}`}
          >
            Agregar imágenes
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={remaining === 0}
              onChange={(e) => onPickGalleryFiles(e.target.files)}
            />
          </label>
          <span className="self-center text-xs text-[#111111]/55">
            {value.imagenesDataUrls.length}/{MAX_IMAGES}
          </span>
        </div>
        {value.imagenesDataUrls.length > 0 ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {value.imagenesDataUrls.map((src, i) => (
              <li key={`${i}-${src.slice(0, 20)}`} className="relative overflow-hidden rounded-lg border border-black/10">
                <div className="relative aspect-[4/3] w-full bg-black/5">
                  <Image src={src} alt="" fill className="object-cover" unoptimized />
                </div>
                <button
                  type="button"
                  className="mt-1 w-full rounded-lg bg-[#111111] py-1.5 text-xs font-semibold text-white"
                  onClick={() => {
                    const next = value.imagenesDataUrls.filter((_, j) => j !== i);
                    onChange({ ...value, imagenesDataUrls: next });
                  }}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <LeonixTextField
        label="Video (URL)"
        optional
        helper="Pega el enlace completo, por ejemplo YouTube."
        value={value.videoUrl}
        onChange={(e) => onChange({ ...value, videoUrl: e.target.value })}
      />
      <LeonixTextField
        label="Tour virtual (URL)"
        optional
        value={value.tourVirtualUrl}
        onChange={(e) => onChange({ ...value, tourVirtualUrl: e.target.value })}
      />
      <LeonixTextField
        label="Plano (URL)"
        optional
        value={value.planoUrl}
        onChange={(e) => onChange({ ...value, planoUrl: e.target.value })}
      />
      <LeonixTextarea
        label="Orden o notas de fotos"
        optional
        rows={2}
        value={value.ordenFotosNotas}
        onChange={(e) => onChange({ ...value, ordenFotosNotas: e.target.value })}
      />
    </SectionShell>
  );
}
