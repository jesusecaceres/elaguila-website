import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

export function autosExternalVideoTitle(lang: AutosNegociosLang): string {
  return lang === "es" ? "Video opcional" : "Optional video";
}

export function autosExternalVideoDescription(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Puedes agregar hasta 8 enlaces de video. Los videos se mostrarán en la vista previa y en el anuncio publicado."
    : "You can add up to 8 video links. Videos will show in the preview and published listing.";
}

export function autosExternalVideoHelper(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Agrega hasta 8 enlaces de video de YouTube, TikTok, Instagram, Vimeo u otra plataforma compatible."
    : "Add up to 8 video links from YouTube, TikTok, Instagram, Vimeo, or another compatible platform.";
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
  return lang === "es" ? "Límite de 8 videos alcanzado." : "8 video limit reached.";
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

export function autosExternalVideoBulkToggleCta(lang: AutosNegociosLang): string {
  return lang === "es" ? "Pegar varios enlaces" : "Paste multiple links";
}

export function autosExternalVideoBulkCancelCta(lang: AutosNegociosLang): string {
  return lang === "es" ? "Agregar uno a la vez" : "Add one at a time";
}

export function autosExternalVideoBulkPlaceholder(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Pega varios enlaces, uno por línea (o separados por coma)."
    : "Paste multiple links, one per line (or separated by commas).";
}

export function autosExternalVideoBulkHelper(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Separa cada enlace con un salto de línea, coma o espacio."
    : "Separate each link with a new line, comma, or space.";
}

export function autosExternalVideoBulkAddCta(lang: AutosNegociosLang): string {
  return lang === "es" ? "Agregar todos" : "Add all";
}

export function autosExternalVideoBulkResultSummary(
  lang: AutosNegociosLang,
  added: number,
  skippedInvalid: number,
  skippedDuplicate: number,
  skippedLimit: number,
): string {
  const parts: string[] = [];
  parts.push(
    lang === "es"
      ? `${added} ${added === 1 ? "video agregado" : "videos agregados"}.`
      : `${added} ${added === 1 ? "video added" : "videos added"}.`,
  );
  if (skippedInvalid > 0) {
    parts.push(
      lang === "es"
        ? `${skippedInvalid} enlace${skippedInvalid === 1 ? "" : "s"} no válido${skippedInvalid === 1 ? "" : "s"}.`
        : `${skippedInvalid} invalid link${skippedInvalid === 1 ? "" : "s"}.`,
    );
  }
  if (skippedDuplicate > 0) {
    parts.push(
      lang === "es"
        ? `${skippedDuplicate} duplicado${skippedDuplicate === 1 ? "" : "s"}.`
        : `${skippedDuplicate} duplicate${skippedDuplicate === 1 ? "" : "s"}.`,
    );
  }
  if (skippedLimit > 0) {
    parts.push(
      lang === "es"
        ? `${skippedLimit} omitido${skippedLimit === 1 ? "" : "s"} por el límite de 8.`
        : `${skippedLimit} skipped — 8 video limit.`,
    );
  }
  return parts.join(" ");
}

export function autosExternalVideoBulkEmpty(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Pega al menos un enlace de video."
    : "Paste at least one video link.";
}
