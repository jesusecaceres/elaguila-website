/** Shared C2 shell copy for Busco / Se busca routes. */

export type BuscoShellLang = "es" | "en";

export const BUSCO_PRODUCT = {
  title: { es: "Busco / Se busca", en: "Looking for / Wanted" },
  description: {
    es: "Publica solicitudes para encontrar artículos, ayuda, personas para actividades, grupos, transporte, recursos o algo específico que necesitas.",
    en: "Post requests to find items, help, people for activities, groups, rides, resources, or something specific you need.",
  },
  helper: {
    es: "Ideal para buscar algo específico sin crear un anuncio complicado. No es una sección de citas.",
    en: "Ideal for finding something specific without a complicated listing. This is not a dating section.",
  },
  notDatingNote: {
    es: "Esta sección es para solicitudes locales — no es para citas ni encuentros románticos.",
    en: "This section is for local requests — not for dating or romantic meetups.",
  },
} as const;

export function buscoLangFromSearchParams(sp: { get: (k: string) => string | null } | null): BuscoShellLang {
  return sp?.get("lang") === "en" ? "en" : "es";
}

export function buscoPathWithLang(path: string, lang: BuscoShellLang): string {
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}lang=${lang}`;
}
