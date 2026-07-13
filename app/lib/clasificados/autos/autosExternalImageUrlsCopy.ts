import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

export function autosExternalImageUrlPlaceholder(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Pega una URL válida de imagen que empiece con https://"
    : "Paste a valid image URL that starts with https://";
}

export function autosExternalImageUrlDuplicate(lang: AutosNegociosLang): string {
  return lang === "es" ? "Esta imagen ya fue agregada." : "This image has already been added.";
}

export function autosExternalImageUrlListLabel(lang: AutosNegociosLang, index: number): string {
  return lang === "es" ? `URL de imagen ${index + 1}` : `Image URL ${index + 1}`;
}
