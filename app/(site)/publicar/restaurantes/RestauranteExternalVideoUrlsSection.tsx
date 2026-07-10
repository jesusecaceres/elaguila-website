"use client";

import { useState } from "react";
import {
  collectRestauranteExternalVideoUrls,
  isValidRestauranteExternalVideoUrl,
  RESTAURANTE_MAX_EXTERNAL_VIDEO_URLS,
  restauranteDraftHasVideo,
  shortenRestauranteVideoUrl,
  trimRestauranteVideoUrl,
} from "@/app/lib/clasificados/restaurantes/restauranteVideoUrls";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import type { RestauranteDraftPatch } from "@/app/clasificados/restaurantes/application/useRestauranteDraft";
import { resolveRestauranteGallerySequence } from "@/app/clasificados/restaurantes/application/restauranteGalleryMediaSequence";
import { tr, type RestauranteAppUiLang } from "./restauranteApplicationFormCopy";

const OTHER_INPUT =
  "mt-1.5 w-full max-w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm text-[color:var(--lx-text)]";

type Props = {
  draft: RestauranteListingDraft;
  setDraftPatch: (patch: RestauranteDraftPatch) => void;
  lang?: RestauranteAppUiLang;
};

function syncVideoGallerySequence(
  prev: RestauranteListingDraft,
  nextUrls: string[],
): Partial<RestauranteListingDraft> {
  const hasVideo =
    nextUrls.length > 0 ||
    restauranteDraftHasVideo({ ...prev, videoUrls: nextUrls, videoUrl: nextUrls[0], videoFile: undefined });
  let seq = prev.galleryMediaSequence ?? resolveRestauranteGallerySequence(prev);
  if (hasVideo) {
    if (!seq.includes("v")) seq = [...seq, "v"];
  } else {
    seq = seq.filter((x) => x !== "v");
  }
  return {
    videoUrls: nextUrls,
    videoUrl: nextUrls[0],
    videoFile: undefined,
    galleryMediaSequence: seq.length ? seq : undefined,
  };
}

export function RestauranteExternalVideoUrlsSection({ draft, setDraftPatch, lang = "es" }: Props) {
  const urls = collectRestauranteExternalVideoUrls(draft);
  const atLimit = urls.length >= RESTAURANTE_MAX_EXTERNAL_VIDEO_URLS;
  const [draftUrl, setDraftUrl] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  function tryAdd() {
    const next = trimRestauranteVideoUrl(draftUrl);
    if (!next) {
      setAddError(null);
      return;
    }
    if (!isValidRestauranteExternalVideoUrl(next)) {
      setAddError(tr(lang, "Pega un enlace válido que empiece con https://", "Paste a valid link starting with https://"));
      return;
    }
    if (urls.some((u) => u.toLowerCase() === next.toLowerCase())) {
      setAddError(tr(lang, "Ese enlace ya está en la lista.", "That link is already in the list."));
      return;
    }
    if (urls.length >= RESTAURANTE_MAX_EXTERNAL_VIDEO_URLS) return;
    const merged = [...urls, next];
    setDraftPatch((prev) => syncVideoGallerySequence(prev, merged));
    setDraftUrl("");
    setAddError(null);
  }

  function removeAt(index: number) {
    const merged = urls.filter((_, i) => i !== index);
    setDraftPatch((prev) => syncVideoGallerySequence(prev, merged));
  }

  return (
    <div className="mt-8 rounded-xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/30 p-4 sm:p-5">
      <h3 className="text-base font-bold text-[color:var(--lx-text)]">
        {tr(lang, "Video opcional", "Optional video")}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)] sm:max-w-2xl">
        {tr(
          lang,
          "Puedes agregar enlaces de video. Los videos se mostrarán en la vista previa y en el anuncio publicado.",
          "You can add video links. Videos will appear in the preview and on the published listing.",
        )}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)] sm:max-w-2xl">
        {tr(
          lang,
          "Recomendado: usa enlaces externos de YouTube, TikTok, Instagram, Vimeo u otra plataforma compatible para evitar cargas pesadas y mostrar más de tu presencia digital.",
          "Recommended: use external links from YouTube, TikTok, Instagram, Vimeo, or another compatible platform to avoid heavy uploads and showcase more of your digital presence.",
        )}
      </p>

      {urls.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {urls.map((url, index) => (
            <li
              key={`${index}-${url}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
                  {tr(lang, "Video", "Video")} {index + 1}
                </p>
                <p className="mt-0.5 truncate text-sm text-[color:var(--lx-text)]" title={url}>
                  {shortenRestauranteVideoUrl(url)}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-[color:var(--lx-nav-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-hover)]"
                onClick={() => removeAt(index)}
              >
                {tr(lang, "Quitar", "Remove")}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!atLimit ? (
        <div className="mt-4 max-w-lg">
          <label className="block text-sm font-semibold text-[color:var(--lx-text-2)]">
            {tr(lang, "Enlace de video", "Video link")}
          </label>
          <input
            className={`${OTHER_INPUT} mt-1 ${addError ? "border-red-500 ring-1 ring-red-500/35" : ""}`}
            value={draftUrl}
            onChange={(e) => {
              setDraftUrl(e.target.value);
              if (addError) setAddError(null);
            }}
            placeholder="https://"
            aria-invalid={Boolean(addError)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                tryAdd();
              }
            }}
          />
          {addError ? (
            <p className="mt-1 text-xs font-medium text-red-800" role="alert">
              {addError}
            </p>
          ) : null}
          <button
            type="button"
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)] disabled:opacity-50"
            onClick={() => tryAdd()}
            disabled={!trimRestauranteVideoUrl(draftUrl)}
          >
            {tr(lang, "Añadir video", "Add video")}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-xs font-medium text-[color:var(--lx-muted)]">
          {tr(lang, "Límite de 4 videos alcanzado.", "Limit of 4 videos reached.")}
        </p>
      )}
    </div>
  );
}
