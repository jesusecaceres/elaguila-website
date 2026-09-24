/** Shared bilingual labels for Viajes travel-module editors. */

export function viajesModL(lang: "es" | "en", es: string, en: string): string {
  return lang === "en" ? en : es;
}
