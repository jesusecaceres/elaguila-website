/**
 * Gate HOME-LAUNCH-9 — "Anúnciate con nosotros" intents and routes.
 *
 * Advertising (business visibility) and publishing a classified are separate paths. The menu
 * lists clear intents that land on existing public pages, language preserved. The legacy
 * login → `/publicar` redirect is gone: "Publicar en Clasificados" goes to `/clasificados`.
 */

import type { SupportedLang } from "@/app/lib/language";
import { getPublicNavItemLabel } from "@/app/lib/leonix/publicNavCopy";

/** @deprecated Use SupportedLang — retained for legacy imports. */
export type AdvertiseLang = SupportedLang;

/** @deprecated Legacy lane ids (magazine reader helper). New consumers use AdvertiseIntent. */
export type AdvertiseLane = "clasificados" | "negocios-locales" | "recursos-comunitarios";

export type AdvertiseIntent =
  | "digital-presence"
  | "magazine-digital"
  | "post-classified"
  | "media-kit"
  | "contact";

export const ADVERTISE_INTENTS: readonly AdvertiseIntent[] = [
  "digital-presence",
  "magazine-digital",
  "post-classified",
  "media-kit",
  "contact",
];

export type AdvertiseDropdownCopy = {
  button: string;
  menuAria: string;
  digitalPresence: string;
  magazineDigital: string;
  postClassified: string;
  mediaKit: string;
  talkToLeonix: string;
  /** Legacy lane labels — still consumed by the magazine reader helper. */
  clasificados: string;
  negociosLocales: string;
  recursosComunitarios: string;
};

const ADVERTISE_ES: AdvertiseDropdownCopy = {
  button: "Anúnciate con nosotros",
  menuAria: "Elige cómo anunciarte con Leonix",
  digitalPresence: "Presencia digital",
  magazineDigital: "Revista + digital",
  postClassified: "Publicar en Clasificados",
  mediaKit: "Media Kit",
  talkToLeonix: "Hablar con Leonix",
  clasificados: "Clasificados",
  negociosLocales: "Negocios Locales",
  recursosComunitarios: "Recursos Comunitarios",
};

const ADVERTISE_EN: AdvertiseDropdownCopy = {
  button: "Advertise with us",
  menuAria: "Choose how to advertise with Leonix",
  digitalPresence: "Digital presence",
  magazineDigital: "Magazine + digital",
  postClassified: "Post in Classifieds",
  mediaKit: "Media Kit",
  talkToLeonix: "Talk to Leonix",
  clasificados: "Classifieds",
  negociosLocales: "Local Businesses",
  recursosComunitarios: "Community Resources",
};

function fromEn(partial: Partial<AdvertiseDropdownCopy>): AdvertiseDropdownCopy {
  return { ...ADVERTISE_EN, ...partial };
}

export const ADVERTISE_DROPDOWN_COPY: Record<SupportedLang, AdvertiseDropdownCopy> = {
  es: ADVERTISE_ES,
  en: ADVERTISE_EN,
  vi: fromEn({
    button: "Quảng cáo cùng chúng tôi",
    clasificados: "Rao vặt",
    recursosComunitarios: "Tài nguyên cộng đồng",
    menuAria: "Chọn nơi quảng cáo",
  }),
  pt: fromEn({
    button: "Anuncie conosco",
    menuAria: "Escolha como anunciar com a Leonix",
    digitalPresence: "Presença digital",
    magazineDigital: "Revista + digital",
    postClassified: "Publicar nos Classificados",
    mediaKit: "Media Kit",
    talkToLeonix: "Falar com a Leonix",
    clasificados: "Classificados",
    recursosComunitarios: "Recursos comunitários",
  }),
  tl: fromEn({
    button: "Mag-advertise sa amin",
    menuAria: "Piliin kung paano mag-advertise sa Leonix",
    digitalPresence: "Digital presence",
    magazineDigital: "Magazine + digital",
    postClassified: "Mag-post sa Classifieds",
    mediaKit: "Media Kit",
    talkToLeonix: "Makipag-usap sa Leonix",
    clasificados: "Classifieds",
    recursosComunitarios: "Mga mapagkukunan ng komunidad",
  }),
  km: fromEn({
    button: "ផ្សាយពាណិជ្ជកម្មជាមួយយើង",
    clasificados: "ការផ្សាយពាណិជ្ជកម្ម",
    recursosComunitarios: "ធនធានសហគមន៍",
    menuAria: "ជ្រើសកន្លែងផ្សាយពាណិជ្ជកម្ម",
  }),
  zh: fromEn({
    button: "与我们投放广告",
    clasificados: "分类信息",
    recursosComunitarios: "社区资源",
    menuAria: "选择广告投放位置",
  }),
  ja: fromEn({
    button: "Leonixで広告掲載",
    clasificados: "クラシファイド",
    recursosComunitarios: "コミュニティリソース",
    menuAria: "広告掲載先を選択",
  }),
  ko: fromEn({
    button: "Leonix에서 광고하기",
    clasificados: "분류 광고",
    recursosComunitarios: "커뮤니티 리소스",
    menuAria: "광고 위치 선택",
  }),
  hi: fromEn({
    button: "हमारे साथ विज्ञापन दें",
    clasificados: "क्लासिफ़ाइड",
    recursosComunitarios: "सामुदायिक संसाधन",
    menuAria: "विज्ञापन स्थान चुनें",
  }),
  hy: fromEn({
    button: "Գովազդել Leonix-ի հետ",
    clasificados: "Դասակարգված",
    recursosComunitarios: "Համայնքային ռեսուրսներ",
    menuAria: "Ընտրեք գովազդի տեղը",
  }),
  ru: fromEn({
    button: "Рекламироваться с Leonix",
    clasificados: "Объявления",
    recursosComunitarios: "Ресурсы сообщества",
    menuAria: "Выберите, где рекламироваться",
  }),
  pa: fromEn({
    button: "ਸਾਡੇ ਨਾਲ ਇਸ਼ਤਿਹਾਰ ਦਿਓ",
    clasificados: "Classifieds",
    recursosComunitarios: "ਕਮਿਊਨਿਟੀ ਸਰੋਤ",
    menuAria: "ਇਸ਼ਤਿਹਾਰ ਦੀ ਥਾਂ ਚੁਣੋ",
  }),
};

export function getAdvertiseDropdownCopy(lang: SupportedLang): AdvertiseDropdownCopy {
  const base = ADVERTISE_DROPDOWN_COPY[lang] ?? ADVERTISE_EN;
  return {
    ...base,
    negociosLocales: getPublicNavItemLabel("negocios-locales", lang),
    clasificados: getPublicNavItemLabel("clasificados", lang),
    recursosComunitarios: getPublicNavItemLabel("recursos-comunitarios", lang),
  };
}

export function appendLangToAdvertisePath(path: string, lang: SupportedLang): string {
  const [base, hash] = path.split("#");
  const joiner = base.includes("?") ? "&" : "?";
  const withParam = `${base}${joiner}lang=${lang}`;
  return hash ? `${withParam}#${hash}` : withParam;
}

/**
 * Existing public destinations only (Gate 0 route map):
 * - digital presence → Negocios Locales (current business-facing landing; no dedicated page yet)
 * - magazine + digital / media kit → Media Kit (advertising information)
 * - post a classified → Clasificados hub (never the legacy `/publicar` login redirect)
 * - talk to Leonix → Contact, advertising intent
 */
export const ADVERTISE_INTENT_PATHS: Record<AdvertiseIntent, string> = {
  "digital-presence": "/negocios-locales",
  "magazine-digital": "/media-kit",
  "post-classified": "/clasificados",
  "media-kit": "/media-kit",
  contact: "/contacto?inquiryType=advertising",
};

export function buildAdvertiseIntentHref(intent: AdvertiseIntent, lang: SupportedLang): string {
  return appendLangToAdvertisePath(ADVERTISE_INTENT_PATHS[intent], lang);
}

/** @deprecated Legacy lane routing kept for backwards compatibility; no `/publicar` redirect. */
export function buildAdvertiseLaneHref(lane: AdvertiseLane, lang: SupportedLang): string {
  switch (lane) {
    case "clasificados":
      return appendLangToAdvertisePath("/clasificados", lang);
    case "negocios-locales":
      return appendLangToAdvertisePath("/negocios-locales", lang);
    case "recursos-comunitarios":
      return appendLangToAdvertisePath("/recursos-comunitarios", lang);
  }
}

export type AdvertiseDropdownOption = {
  id: AdvertiseIntent;
  label: string;
  href: string;
};

export function getAdvertiseDropdownOptions(lang: SupportedLang): AdvertiseDropdownOption[] {
  const copy = getAdvertiseDropdownCopy(lang);
  const labels: Record<AdvertiseIntent, string> = {
    "digital-presence": copy.digitalPresence,
    "magazine-digital": copy.magazineDigital,
    "post-classified": copy.postClassified,
    "media-kit": copy.mediaKit,
    contact: copy.talkToLeonix,
  };
  return ADVERTISE_INTENTS.map((id) => ({
    id,
    label: labels[id],
    href: buildAdvertiseIntentHref(id, lang),
  }));
}
