import { navCopyLang, normalizeLang, replaceLangInHref, type SupportedLang } from "@/app/lib/language";

export type MascotasPerdidosShellLang = "es" | "en";

export const MASCOTAS_PERDIDOS_PRODUCT = {
  title: {
    es: "Mascotas y Perdidos",
    en: "Pets & Lost & Found",
  },
  description: {
    es: "Avisos gratuitos para mascotas perdidas o encontradas, adopciones y objetos perdidos o encontrados.",
    en: "Free notices for lost or found pets, adoptions, and lost or found items.",
  },
  helper: {
    es: "Publicación gratuita · Sin redes sociales · Sin sitio web · Sin volantes",
    en: "Free posting · No social links · No website · No flyers",
  },
} as const;

export function mascotasPerdidosLangFromSearchParams(
  sp: { get: (k: string) => string | null } | null,
): MascotasPerdidosShellLang {
  return navCopyLang(normalizeLang(sp?.get("lang")));
}

export function mascotasPerdidosRouteLangFromSearchParams(
  sp: { get: (k: string) => string | null } | null,
): SupportedLang {
  return normalizeLang(sp?.get("lang"));
}

export function mascotasPerdidosPathWithLang(path: string, routeLang: SupportedLang): string {
  return replaceLangInHref(path, routeLang);
}
