import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

export function autosExternalVideoTitle(lang: AutosNegociosLang): string {
  return lang === "es" ? "Video opcional" : "Optional video";
}

export function autosExternalVideoDescription(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Puedes agregar hasta 4 enlaces de video. Los videos se mostrarán en la vista previa y en el anuncio publicado."
    : "You can add up to 4 video links. Videos will show in the preview and published listing.";
}

export function autosExternalVideoHelper(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Agrega hasta 4 enlaces de video de YouTube, TikTok, Instagram, Vimeo u otra plataforma compatible."
    : "Add up to 4 video links from YouTube, TikTok, Instagram, Vimeo, or another compatible platform.";
}

export function autosExternalVideoSecondaryHelper(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Recomendado: usa enlaces externos para que tu anuncio cargue más rápido."
    : "Recommended: use external links so your listing loads faster.";
}

export function autosExternalVideoPlaceholder(lang: AutosNegociosLang): string {
  return lang === "es" ? "Pega un enlace de video https://..." : "Paste a video link https://...";
}

export function autosExternalVideoAddCta(lang: AutosNegociosLang): string {
  return lang === "es" ? "Añadir video" : "Add video";
}

export function autosExternalVideoRemoveCta(lang: AutosNegociosLang): string {
  return lang === "es" ? "Quitar" : "Remove";
}

export function autosExternalVideoLimitReached(lang: AutosNegociosLang): string {
  return lang === "es" ? "Límite de 4 videos alcanzado." : "4 video limit reached.";
}

export function autosExternalVideoInvalid(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Pega un enlace válido que empiece con https://"
    : "Paste a valid link that starts with https://";
}

export function autosExternalVideoDuplicate(lang: AutosNegociosLang): string {
  return lang === "es" ? "Este video ya fue agregado." : "This video has already been added.";
}

export function autosExternalVideoListLabel(lang: AutosNegociosLang, index: number): string {
  return lang === "es" ? `Video ${index + 1}` : `Video ${index + 1}`;
}
