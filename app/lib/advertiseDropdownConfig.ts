/**
 * Gate A1 — Advertise CTA dropdown lane routes and labels.
 * Uses existing publish/landing destinations only; avoids defaulting to Varios.
 */

export type AdvertiseLang = "es" | "en";

export type AdvertiseLane = "clasificados" | "negocios-locales" | "recursos-comunitarios";

export const ADVERTISE_DROPDOWN_COPY = {
  es: {
    button: "Anúnciate con nosotros",
    clasificados: "Clasificados",
    negociosLocales: "Negocios Locales",
    recursosComunitarios: "Recursos Comunitarios",
    menuAria: "Elige dónde anunciarte",
  },
  en: {
    button: "Advertise with us",
    clasificados: "Classifieds",
    negociosLocales: "Local Businesses",
    recursosComunitarios: "Community Resources",
    menuAria: "Choose where to advertise",
  },
} as const;

export function appendLangToAdvertisePath(path: string, lang: AdvertiseLang): string {
  const [base, hash] = path.split("#");
  const joiner = base.includes("?") ? "&" : "?";
  const withParam = `${base}${joiner}lang=${lang}`;
  return hash ? `${withParam}#${hash}` : withParam;
}

/** Clasificados — publish category chooser (not Varios). */
export function buildClasificadosAdvertiseHref(lang: AdvertiseLang): string {
  const redirect = encodeURIComponent(`/clasificados/publicar?lang=${lang}`);
  return `/login?mode=post&lang=${lang}&redirect=${redirect}`;
}

export function buildAdvertiseLaneHref(lane: AdvertiseLane, lang: AdvertiseLang): string {
  switch (lane) {
    case "clasificados":
      return buildClasificadosAdvertiseHref(lang);
    case "negocios-locales":
      return appendLangToAdvertisePath("/negocios-locales", lang);
    case "recursos-comunitarios":
      return appendLangToAdvertisePath("/recursos-comunitarios", lang);
  }
}

export type AdvertiseDropdownOption = {
  id: AdvertiseLane;
  label: string;
  href: string;
};

export function getAdvertiseDropdownOptions(lang: AdvertiseLang): AdvertiseDropdownOption[] {
  const copy = ADVERTISE_DROPDOWN_COPY[lang];
  return [
    { id: "clasificados", label: copy.clasificados, href: buildAdvertiseLaneHref("clasificados", lang) },
    {
      id: "negocios-locales",
      label: copy.negociosLocales,
      href: buildAdvertiseLaneHref("negocios-locales", lang),
    },
    {
      id: "recursos-comunitarios",
      label: copy.recursosComunitarios,
      href: buildAdvertiseLaneHref("recursos-comunitarios", lang),
    },
  ];
}
