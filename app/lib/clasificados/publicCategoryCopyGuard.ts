import type { HubCategoryKey } from "@/app/(site)/clasificados/config/clasificadosHub";
import type { SupportedLang } from "@/app/lib/language";
import {
  getClasificadosCategoryCopy,
  getClasificadosHubPageCopy,
} from "@/app/lib/clasificados/clasificadosHubPageCopy";

/** Public hub cards beyond standard HubCategoryKey slugs. */
export type PublicExtraCategoryKey = "dealers-de-autos" | "ofertas-locales";

export type PublicCategoryKey = HubCategoryKey | PublicExtraCategoryKey;

/** Visible on `/clasificados` hub grid (matches page render order). */
export const CLASIFICADOS_HUB_VISIBLE_CATEGORY_KEYS: readonly PublicCategoryKey[] = [
  "ofertas-locales",
  "en-venta",
  "rentas",
  "empleos",
  "bienes-raices",
  "servicios",
  "autos",
  "restaurantes",
  "travel",
  "comunidad",
  "clases",
  "busco",
  "mascotas-y-perdidos",
  "dealers-de-autos",
] as const;

export type PublicCategoryCardCopy = {
  label: string;
  desc: string;
  explore: string;
  post: string;
};

export type PublicCategoryCopyStatus = {
  complete: boolean;
  resolvedVia: SupportedLang;
  usingFallback: boolean;
};

type DealersCopy = Omit<PublicCategoryCardCopy, "explore"> & { explore: string };

const DEALERS_DE_AUTOS_COPY: Record<"es" | "en" | "vi", DealersCopy> = {
  es: {
    label: "Dealers de Autos",
    desc: "Inventario de concesionarios y negocios de autos.",
    explore: "EXPLORAR",
    post: "Publicar en Dealers de Autos",
  },
  en: {
    label: "Auto Dealers",
    desc: "Dealership and auto business inventory.",
    explore: "EXPLORE",
    post: "Post in Auto Dealers",
  },
  vi: {
    label: "Đại lý ô tô",
    desc: "Kho xe của đại lý và doanh nghiệp ô tô.",
    explore: "KHÁM PHÁ",
    post: "Đăng trong Đại lý ô tô",
  },
};

/** VI hub categories with hand-authored native copy (not EN fallback). */
const VI_NATIVE_HUB_KEYS = new Set<HubCategoryKey>([
  "en-venta",
  "rentas",
  "empleos",
  "autos",
  "bienes-raices",
  "servicios",
  "restaurantes",
  "travel",
  "comunidad",
  "clases",
  "busco",
  "mascotas-y-perdidos",
]);

function dealersCopy(lang: SupportedLang): DealersCopy {
  if (lang === "es") return DEALERS_DE_AUTOS_COPY.es;
  if (lang === "vi") return DEALERS_DE_AUTOS_COPY.vi;
  return DEALERS_DE_AUTOS_COPY.en;
}

function isHubCategoryKey(key: PublicCategoryKey): key is HubCategoryKey {
  return key !== "dealers-de-autos" && key !== "ofertas-locales";
}

export function getPublicCategoryLabel(categoryKey: PublicCategoryKey, lang: SupportedLang): string {
  if (categoryKey === "dealers-de-autos") return dealersCopy(lang).label;
  if (categoryKey === "ofertas-locales") return getClasificadosHubPageCopy(lang).ofertasLocalesTitle;
  return getClasificadosCategoryCopy(lang, categoryKey).label;
}

export function getPublicCategoryDescription(categoryKey: PublicCategoryKey, lang: SupportedLang): string {
  if (categoryKey === "dealers-de-autos") return dealersCopy(lang).desc;
  if (categoryKey === "ofertas-locales") return getClasificadosHubPageCopy(lang).ofertasLocalesDesc;
  return getClasificadosCategoryCopy(lang, categoryKey).desc;
}

export function getPublicCategoryExploreLabel(lang: SupportedLang): string {
  return getClasificadosHubPageCopy(lang).explore;
}

export function getPublicCategoryPostCta(categoryKey: PublicCategoryKey, lang: SupportedLang): string {
  if (categoryKey === "dealers-de-autos") return dealersCopy(lang).post;
  if (categoryKey === "ofertas-locales") return getClasificadosHubPageCopy(lang).ofertasLocalesPublish;
  const hub = getClasificadosHubPageCopy(lang);
  const label = getPublicCategoryLabel(categoryKey, lang);
  return hub.postInCategory(label);
}

export function getPublicCategoryCardCopy(
  categoryKey: PublicCategoryKey,
  lang: SupportedLang,
): PublicCategoryCardCopy {
  const hub = getClasificadosHubPageCopy(lang);
  return {
    label: getPublicCategoryLabel(categoryKey, lang),
    desc: getPublicCategoryDescription(categoryKey, lang),
    explore:
      categoryKey === "ofertas-locales" ? hub.ofertasLocalesBrowse : getPublicCategoryExploreLabel(lang),
    post: getPublicCategoryPostCta(categoryKey, lang),
  };
}

export function getPublicCategoryCopyStatus(
  categoryKey: PublicCategoryKey,
  lang: SupportedLang,
): PublicCategoryCopyStatus {
  if (lang === "es" || lang === "en") {
    if (isHubCategoryKey(categoryKey)) {
      const row = getClasificadosCategoryCopy(lang, categoryKey);
      return {
        complete: Boolean(row.label.trim() && row.desc.trim()),
        resolvedVia: lang,
        usingFallback: false,
      };
    }
    if (categoryKey === "dealers-de-autos") {
      const row = DEALERS_DE_AUTOS_COPY[lang === "es" ? "es" : "en"];
      return { complete: true, resolvedVia: lang, usingFallback: false };
    }
    const hub = getClasificadosHubPageCopy(lang);
    return {
      complete: Boolean(hub.ofertasLocalesTitle.trim() && hub.ofertasLocalesPublish.trim()),
      resolvedVia: lang,
      usingFallback: false,
    };
  }

  if (lang === "vi") {
    if (categoryKey === "dealers-de-autos") {
      return { complete: true, resolvedVia: "vi", usingFallback: false };
    }
    if (categoryKey === "ofertas-locales") {
      const hub = getClasificadosHubPageCopy("vi");
      return {
        complete: Boolean(hub.ofertasLocalesTitle.trim() && hub.ofertasLocalesPublish.trim()),
        resolvedVia: "vi",
        usingFallback: false,
      };
    }
    if (VI_NATIVE_HUB_KEYS.has(categoryKey)) {
      const en = getClasificadosCategoryCopy("en", categoryKey).label;
      const native = getPublicCategoryLabel(categoryKey, "vi");
      return {
        complete: native.trim().length > 0 && native !== en,
        resolvedVia: "vi",
        usingFallback: native === en,
      };
    }
  }

  const label = getPublicCategoryLabel(categoryKey, lang);
  const enLabel = isHubCategoryKey(categoryKey)
    ? getClasificadosCategoryCopy("en", categoryKey).label
    : categoryKey === "dealers-de-autos"
      ? DEALERS_DE_AUTOS_COPY.en.label
      : getClasificadosHubPageCopy("en").ofertasLocalesTitle;

  return {
    complete: false,
    resolvedVia: "en",
    usingFallback: label === enLabel || lang !== "vi",
  };
}

/** @internal — exposed for translation guard script static validation. */
export const PUBLIC_CATEGORY_GUARD_INTERNAL = {
  DEALERS_DE_AUTOS_COPY,
  VI_NATIVE_HUB_KEYS,
} as const;
