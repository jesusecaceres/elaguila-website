import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

/** Honest copy: local file uploads are session/tab draft only — not durable cloud storage until publish. */
export function autosLocalFileTemporaryDraftNote(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Los archivos locales se guardan como borrador temporal en este navegador. Si un archivo es demasiado pesado, se omitirá al guardar/publicar y te avisaremos; las URLs de imagen permanecen guardadas."
    : "Local files are saved as a temporary draft in this browser. If a file is too large, it will be skipped during save/publish and we will warn you; image URLs stay saved.";
}

export const AUTOS_LOCAL_FILE_TEMPORARY_ES = "borrador temporal";
export const AUTOS_LOCAL_FILE_TEMPORARY_EN = "temporary draft";
