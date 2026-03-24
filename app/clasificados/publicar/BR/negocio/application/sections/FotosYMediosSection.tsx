"use client";

import Image from "next/image";
import type { LeonixBRNegocioMedios } from "../schema/leonixBrNegocioForm";
import { LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";
import { cx } from "../helpers/cx";

export function FotosYMediosSection({
  value,
  onChange,
  onPickGalleryFiles,
  maxImages = 12,
}: {
  value: LeonixBRNegocioMedios;
  onChange: (next: LeonixBRNegocioMedios) => void;
  onPickGalleryFiles: (files: FileList | null) => void;
  maxImages?: number;
}) {
  const remaining = Math.max(0, maxImages - value.imagenesDataUrls.length);
  return (
    <SectionShell
      title="Fotos y medios"
      description="Sube fotos claras y bien iluminadas. Puedes agregar hasta 12 imágenes."
    >
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <p className="text-sm font-semibold text-[#111111]">Galería (hasta {maxImages} imágenes)</p>
        <p className="mt-1 text-xs text-[#111111]/65">
          La primera imagen será la principal en la ficha. Puedes describir el orden abajo si lo necesitas.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <label
            className={cx(
              "cursor-pointer rounded-xl border border-dashed border-black/20 bg-[#FAFAFA] px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-[#F0F0F0]",
              remaining === 0 && "pointer-events-none opacity-50"
            )}
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
            {value.imagenesDataUrls.length}/{maxImages} · te quedan {remaining}
          </span>
        </div>
        {value.imagenesDataUrls.length > 0 ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {value.imagenesDataUrls.map((src, i) => (
              <li key={`${i}-${src.slice(0, 24)}`} className="relative overflow-hidden rounded-lg border border-black/10">
                <div className="relative aspect-[4/3] w-full bg-black/5">
                  <Image src={src} alt="" fill className="object-cover" unoptimized />
                </div>
                <button
                  type="button"
                  className="mt-1 w-full rounded-lg bg-[#111111] py-1.5 text-xs font-semibold text-white hover:opacity-95"
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
        helper="Pega el enlace completo del video, por ejemplo YouTube o Vimeo."
        value={value.videoUrl}
        onChange={(e) => onChange({ ...value, videoUrl: e.target.value })}
      />
      <LeonixTextField
        label="Tour virtual (URL)"
        optional
        helper="Pega el enlace completo del tour virtual, por ejemplo Matterport o YouTube."
        value={value.tourVirtualUrl}
        onChange={(e) => onChange({ ...value, tourVirtualUrl: e.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Plano (URL)"
          optional
          helper="Sube el plano del inmueble o agrega la URL si ya lo tienes en línea."
          value={value.planoUrl}
          onChange={(e) => onChange({ ...value, planoUrl: e.target.value })}
        />
        <LeonixTextField
          label="Nombre del archivo de plano"
          optional
          value={value.planoNombreArchivo}
          onChange={(e) => onChange({ ...value, planoNombreArchivo: e.target.value })}
        />
      </div>
      <LeonixTextField
        label="Miniatura de video (URL)"
        optional
        value={value.thumbnailVideoUrl}
        onChange={(e) => onChange({ ...value, thumbnailVideoUrl: e.target.value })}
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
