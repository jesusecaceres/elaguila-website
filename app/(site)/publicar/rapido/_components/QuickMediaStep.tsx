"use client";

import { useRef, useState } from "react";
import { compressImageFileToJpegDataUrl } from "@/app/clasificados/publicar/bienes-raices/privado/application/utils/brPrivadoMediaCompress";
import { newImageId } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";
import { qt, quickCopy } from "@/app/lib/quickClassifieds/quickClassifiedCopy";
import type { QuickClassifiedMediaContract, QuickLang, QuickMediaItem } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickCard, quickSecondaryBtn } from "./QuickShell";

type Props = {
  lang: QuickLang;
  contract: QuickClassifiedMediaContract;
  media: QuickMediaItem[];
  onChange: (next: QuickMediaItem[]) => void;
};

function looksLikeImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|heic|heif|gif|bmp|avif)$/i.test(file.name);
}

/** Media Lock step — ≥ 1 real image, canonical cap, cover = first. Photos are compressed to JPEG data URLs
 * with the same existing compressor the Rentas / BR privado applications use, so every canonical draft store
 * receives exactly the representation it already expects. */
export function QuickMediaStep({ lang, contract, media, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const max = contract.maxImages;
  const room = max == null ? Number.POSITIVE_INFINITY : Math.max(0, max - media.length);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    if (room <= 0) {
      setError(quickCopy("mediaMax", lang, { max: String(max) }));
      return;
    }
    setBusy(true);
    const next = [...media];
    let bad = false;
    for (let i = 0; i < list.length && next.length < media.length + room; i++) {
      const file = list[i];
      if (!file || !looksLikeImage(file)) {
        bad = true;
        continue;
      }
      try {
        const dataUrl = await compressImageFileToJpegDataUrl(file);
        if (!dataUrl.startsWith("data:image/")) {
          bad = true;
          continue;
        }
        next.push({ id: newImageId(), dataUrl, fileName: file.name, mime: "image/jpeg" });
      } catch {
        bad = true;
      }
    }
    setBusy(false);
    if (bad) setError(quickCopy("mediaBadFile", lang));
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  function makeCover(id: string) {
    const idx = media.findIndex((m) => m.id === id);
    if (idx <= 0) return;
    const next = [...media];
    const [item] = next.splice(idx, 1);
    next.unshift(item);
    onChange(next);
  }

  function remove(id: string) {
    onChange(media.filter((m) => m.id !== id));
  }

  return (
    <section className={quickCard}>
      <h2 className="text-lg font-extrabold">{quickCopy("mediaTitle", lang)}</h2>
      <p className="mt-1 text-sm text-[#5D4A25]/90">{quickCopy("mediaIntro", lang)}</p>
      <p className="mt-1 text-xs text-[#7A7164]">{qt(contract.note, lang)}</p>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void onFiles(e.target.files)} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void onFiles(e.target.files)} />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className={quickSecondaryBtn} disabled={busy || room <= 0} onClick={() => inputRef.current?.click()}>
          📷 {quickCopy("mediaAdd", lang)}
        </button>
        <button type="button" className={quickSecondaryBtn} disabled={busy || room <= 0} onClick={() => cameraRef.current?.click()}>
          📸 {quickCopy("mediaTakePhoto", lang)}
        </button>
      </div>
      {busy ? <p className="mt-2 text-xs text-[#7A7164]" aria-live="polite">{quickCopy("mediaProcessing", lang)}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-700" role="alert">{error}</p> : null}

      {media.length ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((m, i) => (
            <li key={m.id} className="relative overflow-hidden rounded-xl border border-[#D8C79A] bg-white">
              <img src={m.dataUrl} alt="" className="aspect-square w-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-[#7A1E2C] px-2 py-0.5 text-[11px] font-bold text-white">{quickCopy("mediaCover", lang)}</span>
              ) : null}
              <div className="flex divide-x divide-[#E8DFD0] text-xs">
                {i !== 0 ? (
                  <button type="button" className="min-h-[40px] flex-1 font-semibold text-[#6E4E18]" onClick={() => makeCover(m.id)}>
                    {quickCopy("mediaMakeCover", lang)}
                  </button>
                ) : null}
                <button type="button" className="min-h-[40px] flex-1 font-semibold text-red-700" onClick={() => remove(m.id)}>
                  {quickCopy("mediaRemove", lang)}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-[#D8C79A] bg-white/60 p-4 text-center text-sm text-[#7A7164]">{quickCopy("mediaMin", lang)}</p>
      )}
    </section>
  );
}
