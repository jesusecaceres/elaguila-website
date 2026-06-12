import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

export function autosDraftRestoredFromSessionNote(lang: AutosNegociosLang): string {
  return lang === "es" ? "Borrador restaurado de esta sesión." : "Draft restored from this session.";
}

export function autosLocalFilesReselectAfterRefreshNote(lang: AutosNegociosLang): string {
  return lang === "es"
    ? "Algunos archivos locales deben seleccionarse nuevamente después de actualizar la página."
    : "Some local files need to be selected again after refreshing the page.";
}
