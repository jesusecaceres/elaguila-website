"use client";

import { useRef, useState } from "react";
import { compressImageFileToJpegDataUrl } from "@/app/clasificados/publicar/bienes-raices/privado/application/utils/brPrivadoMediaCompress";
import { newImageId } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";
import { quickCopy } from "@/app/lib/quickClassifieds/quickClassifiedCopy";
import type { QuickLang } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import type { QuickBusinessCategoryKey } from "@/app/lib/quickBusiness/quickBusinessTypes";
import {
  REQUIRED_SUBJECT_ROLE_BY_CATEGORY,
  SUBJECT_ATTRIBUTION,
  type QuickMediaRole,
} from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";
import { quickCard, quickSecondaryBtn } from "@/app/publicar/rapido/_components/QuickShell";
import type { QuickBusinessDraftMediaItem } from "./quickBusinessDraftStore";

/**
 * Gate QB-MEDIA-03 — the Quick Business media step.
 *
 * WHY THIS EXISTS RATHER THAN REUSING `QuickMediaStep`: the certified Quick Classifieds media step
 * is byte-frozen and produces `QuickMediaItem`, which carries no semantic role. Quick Business's
 * whole media claim is that a dealer logo is not a vehicle photo and an agent headshot is not a
 * property photo — which is unprovable unless the PRODUCER emits a role. So Quick Business owns
 * its own step. It is a copy of the certified step's upload/compress/cover/remove behaviour (same
 * compressor, same `accept="image/*"`, same cover-is-first rule, still no video affordance of any
 * kind) plus one added control: what does this photo show?
 *
 * FOR THE TWO `declared` FAMILIES (Autos Dealer, Bienes Negocio) a newly added photo starts with
 * NO role. The customer must say what it is. Nothing here ever pre-selects "vehicle" or
 * "property": a silent default is precisely the misclassification this gate exists to stop.
 *
 * FOR THE TWO `structural` FAMILIES (Servicios, Restaurantes) the step asks for photos OF THE
 * BUSINESS and the canonical shape keeps the logo in its own non-gallery field, so a new photo
 * starts as `business` and can be re-marked as a logo. That keeps those families' truthful
 * category requirement exactly as it was.
 */

type Props = {
  lang: QuickLang;
  category: QuickBusinessCategoryKey;
  contract: { maxImages: number | null; note: { es: string; en: string } };
  media: QuickBusinessDraftMediaItem[];
  onChange: (next: QuickBusinessDraftMediaItem[]) => void;
};

type RoleOption = { role: QuickMediaRole; es: string; en: string };

/** What each family may declare. The first entry is the family's required subject role. */
const ROLE_OPTIONS: Record<QuickBusinessCategoryKey, readonly RoleOption[]> = {
  servicios: [
    { role: "business", es: "Foto del negocio / trabajo", en: "Photo of the business / work" },
    { role: "logo", es: "Logotipo", en: "Logo" },
  ],
  restaurantes: [
    { role: "business", es: "Foto del restaurante / platillo", en: "Photo of the restaurant / dish" },
    { role: "logo", es: "Logotipo", en: "Logo" },
  ],
  "autos-dealer": [
    { role: "vehicle", es: "Foto del vehículo", en: "Photo of the vehicle" },
    { role: "logo", es: "Logotipo del dealer", en: "Dealer logo" },
    { role: "business", es: "Foto del dealer / general", en: "Dealership / general photo" },
  ],
  "bienes-negocio": [
    { role: "property", es: "Foto de la propiedad", en: "Photo of the property" },
    { role: "headshot", es: "Foto profesional / retrato", en: "Professional headshot" },
    { role: "business", es: "Foto de la oficina / general", en: "Office / general photo" },
    { role: "logo", es: "Logotipo", en: "Logo" },
  ],
};

const COPY = {
  whatIsThis: { es: "¿Qué muestra esta foto?", en: "What does this photo show?" },
  choose: { es: "Elige una opción…", en: "Choose one…" },
  subjectBadge: { es: "Cuenta para el requisito", en: "Counts toward the requirement" },
  identityBadge: { es: "No cuenta como foto requerida", en: "Does not count as the required photo" },
  unmarked: {
    es: "Marca qué muestra cada foto para continuar.",
    en: "Mark what each photo shows to continue.",
  },
} as const;

function looksLikeImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|heic|heif|gif|bmp|avif)$/i.test(file.name);
}

export function QuickBusinessMediaStep({ lang, category, contract, media, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = ROLE_OPTIONS[category];
  const subjectRole = REQUIRED_SUBJECT_ROLE_BY_CATEGORY[category];
  // Only a `structural` family may start a photo already marked; a `declared` family must be told.
  const initialRole: QuickMediaRole | null = SUBJECT_ATTRIBUTION[category] === "structural" ? subjectRole : null;

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
        next.push({ id: newImageId(), dataUrl, fileName: file.name, mime: "image/jpeg", role: initialRole });
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
    if (item) next.unshift(item);
    onChange(next);
  }

  function remove(id: string) {
    onChange(media.filter((m) => m.id !== id));
  }

  function setRole(id: string, role: QuickMediaRole | null) {
    onChange(media.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  const anyUnmarked = media.some((m) => m.role == null);

  return (
    <section className={quickCard}>
      <h2 className="text-lg font-extrabold">{quickCopy("mediaTitle", lang)}</h2>
      <p className="mt-1 text-sm text-[#5D4A25]/90">{quickCopy("mediaIntro", lang)}</p>
      <p className="mt-1 text-xs text-[#7A7164]">{contract.note[lang]}</p>

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
      {anyUnmarked ? (
        <p className="mt-2 text-sm text-[#7A1E2C]" role="status">{COPY.unmarked[lang]}</p>
      ) : null}

      {media.length ? (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {media.map((m, i) => (
            <li key={m.id} className="relative overflow-hidden rounded-xl border border-[#D8C79A] bg-white">
              <img src={m.dataUrl} alt="" className="aspect-square w-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-[#7A1E2C] px-2 py-0.5 text-[11px] font-bold text-white">{quickCopy("mediaCover", lang)}</span>
              ) : null}

              <div className="border-t border-[#E8DFD0] p-2">
                <label className="block text-[11px] font-semibold text-[#6E4E18]" htmlFor={`qb-role-${m.id}`}>
                  {COPY.whatIsThis[lang]}
                </label>
                <select
                  id={`qb-role-${m.id}`}
                  className="mt-1 min-h-[40px] w-full rounded-lg border border-[#D8C79A] bg-white px-2 text-sm"
                  value={m.role ?? ""}
                  onChange={(e) => setRole(m.id, (e.target.value || null) as QuickMediaRole | null)}
                >
                  <option value="">{COPY.choose[lang]}</option>
                  {options.map((o) => (
                    <option key={o.role} value={o.role}>
                      {lang === "en" ? o.en : o.es}
                    </option>
                  ))}
                </select>
                {m.role ? (
                  <p className={`mt-1 text-[11px] ${m.role === subjectRole ? "text-[#2F6B3A]" : "text-[#7A7164]"}`}>
                    {m.role === subjectRole ? COPY.subjectBadge[lang] : COPY.identityBadge[lang]}
                  </p>
                ) : null}
              </div>

              <div className="flex divide-x divide-[#E8DFD0] border-t border-[#E8DFD0] text-xs">
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
