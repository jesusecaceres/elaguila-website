"use client";

import { useState } from "react";
import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import {
  EN_VENTA_MAX_EXTERNAL_VIDEO_URLS,
  isValidEnVentaExternalVideoUrl,
  trimEnVentaVideoUrl,
} from "@/app/clasificados/en-venta/shared/utils/enVentaVideoUrls";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";

const COPY = {
  es: {
    title: "Video opcional",
    desc: "Puedes agregar hasta 4 enlaces de video. Los videos se mostrarán en la vista previa y en el anuncio publicado.",
    helper:
      "Agrega hasta 4 enlaces de video de YouTube, TikTok, Instagram, Vimeo u otra plataforma compatible.",
    helperSecondary: "Recomendado: usa enlaces externos para que tu anuncio cargue más rápido.",
    add: "Añadir video",
    remove: "Quitar",
    placeholder: "https://",
    limit: "Límite de 4 videos alcanzado.",
    invalid: "Pega un enlace válido que empiece con https://",
    duplicate: "Ese enlace ya está en la lista.",
    videoLabel: (n: number) => `Video ${n}`,
  },
  en: {
    title: "Optional video",
    desc: "You can add up to 4 video links. They will appear in preview and on the published listing.",
    helper: "Add up to 4 video links from YouTube, TikTok, Instagram, Vimeo, or another supported platform.",
    helperSecondary: "Recommended: use external links so your listing loads faster.",
    add: "Add video",
    remove: "Remove",
    placeholder: "https://",
    limit: "4-video limit reached.",
    invalid: "Paste a valid link that starts with https://",
    duplicate: "That link is already in the list.",
    videoLabel: (n: number) => `Video ${n}`,
  },
} as const;

function shortenUrl(url: string): string {
  const t = url.trim();
  if (t.length <= 56) return t;
  return `${t.slice(0, 53)}…`;
}

export function EnVentaExternalVideoUrlsSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<S>) {
  const t = COPY[lang];
  const urls = state.videoUrls ?? [];
  const atLimit = urls.length >= EN_VENTA_MAX_EXTERNAL_VIDEO_URLS;
  const [draftUrl, setDraftUrl] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  function tryAdd() {
    const next = trimEnVentaVideoUrl(draftUrl);
    if (!next) {
      setAddError(null);
      return;
    }
    if (!isValidEnVentaExternalVideoUrl(next)) {
      setAddError(t.invalid);
      return;
    }
    const key = next.toLowerCase();
    if (urls.some((u) => u.toLowerCase() === key)) {
      setAddError(t.duplicate);
      return;
    }
    if (urls.length >= EN_VENTA_MAX_EXTERNAL_VIDEO_URLS) return;
    setState((s) => ({ ...s, videoUrls: [...(s.videoUrls ?? []), next] }));
    setDraftUrl("");
    setAddError(null);
  }

  function removeAt(index: number) {
    setState((s) => ({
      ...s,
      videoUrls: (s.videoUrls ?? []).filter((_, i) => i !== index),
    }));
  }

  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <p className="text-xs text-[#111111]/60">{t.helper}</p>
      <p className="mt-1 text-xs text-[#111111]/55">{t.helperSecondary}</p>

      {urls.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {urls.map((url, index) => (
            <li
              key={`${index}-${url}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-[#111111]/55">
                  {t.videoLabel(index + 1)}
                </p>
                <p className="mt-0.5 truncate text-sm text-[#111111]" title={url}>{shortenUrl(url)}</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold text-[#111111] hover:bg-[#F5F5F5]"
                onClick={() => removeAt(index)}
              >
                {t.remove}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!atLimit ? (
        <div className="mt-4">
          <label className={labelClass}>{lang === "es" ? "Enlace de video" : "Video link"}</label>
          <input
            className={`${inputClass} mt-2 ${addError ? "border-red-500 ring-1 ring-red-500/35" : ""}`}
            value={draftUrl}
            onChange={(e) => {
              setDraftUrl(e.target.value);
              if (addError) setAddError(null);
            }}
            placeholder={t.placeholder}
            aria-invalid={Boolean(addError)}
          />
          {addError ? (
            <p className="mt-1 text-xs font-medium text-red-800" role="alert">{addError}</p>
          ) : null}
          <button
            type="button"
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#A98C2A]/40 bg-[#111111] px-4 py-2.5 text-sm font-semibold text-[#F5F5F5] hover:opacity-95 disabled:opacity-50"
            onClick={() => tryAdd()}
            disabled={!trimEnVentaVideoUrl(draftUrl)}
          >
            {t.add}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-xs font-medium text-[#111111]/55">{t.limit}</p>
      )}
    </SectionShell>
  );
}
