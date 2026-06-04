"use client";

import { useCallback, useRef, useState } from "react";

import { COMIDA_LOCAL_ACCEPTED_IMAGE_MIME } from "@/app/lib/clasificados/comida-local/comidaLocalImageValidation";
import { resolveComidaLocalImageUrl } from "@/app/lib/clasificados/comida-local/comidaLocalImageValidation";
import { uploadComidaLocalDraftImage } from "@/app/lib/clasificados/comida-local/comidaLocalDraftMediaUpload";
import type { ComidaLocalImageDraft, ComidaLocalImageRole } from "@/app/lib/clasificados/comida-local/comidaLocalTypes";

const ACCEPT = COMIDA_LOCAL_ACCEPTED_IMAGE_MIME.join(",");

type Props = {
  role: ComidaLocalImageRole;
  label: string;
  helper: string;
  optional?: boolean;
  draftListingId: string;
  image: ComidaLocalImageDraft | null;
  onImageChange: (image: ComidaLocalImageDraft | null) => void;
  minHeightClass?: string;
};

export function ComidaLocalImageUploadField({
  role,
  label,
  helper,
  optional,
  draftListingId,
  image,
  onImageChange,
  minHeightClass = "min-h-[140px]",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const src = resolveComidaLocalImageUrl(image);

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!draftListingId.trim()) {
        setError("Guarda el borrador e intenta de nuevo.");
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const result = await uploadComidaLocalDraftImage({
          file,
          role,
          draftListingId,
        });
        if (!result.ok) {
          setError(result.detail || result.error || "No se pudo subir la imagen.");
          return;
        }
        onImageChange({ ...result.image, role });
      } catch {
        setError("Error de red al subir. Intenta otra vez.");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [draftListingId, onImageChange, role]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/70">
          {label}
          {optional ? (
            <span className="ml-1 font-normal normal-case text-[#1E1814]/45">(opcional)</span>
          ) : null}
        </span>
        {src ? (
          <button
            type="button"
            className="text-xs font-medium text-[#7A1E2C] hover:underline"
            onClick={() => onImageChange(null)}
            disabled={uploading}
          >
            Quitar
          </button>
        ) : null}
      </div>

      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#D4C4A8] bg-[#FDF8F0] ${minHeightClass}`}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="h-full max-h-48 w-full object-cover"
          />
        ) : (
          <p className="px-4 text-center text-sm text-[#1E1814]/55">
            {uploading ? "Subiendo…" : "JPEG, PNG o WebP"}
          </p>
        )}
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FFFCF7]/80 text-sm font-medium text-[#7A1E2C]">
            Subiendo…
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading || !draftListingId}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-[#7A1E2C] bg-white px-3 py-2 text-sm font-medium text-[#7A1E2C] hover:bg-[#7A1E2C]/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {src ? "Reemplazar" : "Subir imagen"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          void handleFile(f ?? null);
        }}
      />

      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      <p className="text-xs leading-relaxed text-[#1E1814]/60">{helper}</p>
    </div>
  );
}
