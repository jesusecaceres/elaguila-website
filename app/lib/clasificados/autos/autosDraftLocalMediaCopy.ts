import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

/** Honest copy: local file uploads are session/tab draft only — not durable cloud storage until publish. */
export function autosLocalFileTemporaryDraftNote(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Los archivos locales se guardan solo en esta pestaña del navegador (borrador temporal). Las URLs de imagen permanecen guardadas. Al publicar, los archivos se suben a almacenamiento en la nube."
    : "Local files are saved only in this browser tab (temporary draft). Image URLs stay saved. Files upload to cloud storage when you publish.";
}

export const AUTOS_LOCAL_FILE_TEMPORARY_ES = "borrador temporal";
export const AUTOS_LOCAL_FILE_TEMPORARY_EN = "temporary draft";
