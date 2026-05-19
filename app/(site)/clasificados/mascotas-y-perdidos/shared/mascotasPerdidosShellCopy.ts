export type MascotasPerdidosShellLang = "es" | "en";

export const MASCOTAS_PERDIDOS_PRODUCT = {
  title: {
    es: "Mascotas y Perdidos",
    en: "Pets & Lost & Found",
  },
  description: {
    es: "Avisos gratuitos y sencillos para mascotas perdidas o encontradas, adopciones y objetos perdidos o encontrados en tu comunidad.",
    en: "Free, simple notices for lost or found pets, adoptions, and lost or found items in your community.",
  },
  helper: {
    es: "Publicación gratuita · Sin redes sociales · Sin sitio web · Sin volantes",
    en: "Free posting · No social links · No website · No flyers",
  },
} as const;

export function mascotasPerdidosLangFromSearchParams(
  sp: { get: (k: string) => string | null } | null,
): MascotasPerdidosShellLang {
  return sp?.get("lang") === "en" ? "en" : "es";
}

export function mascotasPerdidosPathWithLang(path: string, lang: MascotasPerdidosShellLang): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}lang=${lang}`;
}
