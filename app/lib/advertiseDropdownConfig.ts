/**
 * Gate A1 — Advertise CTA dropdown lane routes and labels.
 * Uses existing publish/landing destinations only; avoids defaulting to Varios.
 */

import type { SupportedLang } from "@/app/lib/language";
import { getPublicNavItemLabel } from "@/app/lib/leonix/publicNavCopy";

/** @deprecated Use SupportedLang — retained for legacy imports. */
export type AdvertiseLang = SupportedLang;

export type AdvertiseLane = "clasificados" | "negocios-locales" | "recursos-comunitarios";

export type AdvertiseDropdownCopy = {
  button: string;
  clasificados: string;
  negociosLocales: string;
  recursosComunitarios: string;
  menuAria: string;
};

const ADVERTISE_ES: AdvertiseDropdownCopy = {
  button: "Anúnciate con nosotros",
  clasificados: "Clasificados",
  negociosLocales: "Negocios Locales",
  recursosComunitarios: "Recursos Comunitarios",
  menuAria: "Elige dónde anunciarte",
};

const ADVERTISE_EN: AdvertiseDropdownCopy = {
  button: "Advertise with us",
  clasificados: "Classifieds",
  negociosLocales: "Local Businesses",
  recursosComunitarios: "Community Resources",
  menuAria: "Choose where to advertise",
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
    clasificados: "Classificados",
    recursosComunitarios: "Recursos comunitários",
    menuAria: "Escolha onde anunciar",
  }),
  tl: fromEn({
    button: "Mag-advertise sa amin",
    clasificados: "Classifieds",
    recursosComunitarios: "Mga mapagkukunan ng komunidad",
    menuAria: "Piliin kung saan mag-advertise",
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

/** Clasificados — publish category chooser (not Varios). */
export function buildClasificadosAdvertiseHref(lang: SupportedLang): string {
  const redirect = encodeURIComponent(`/clasificados/publicar?lang=${lang}`);
  return `/login?mode=post&lang=${lang}&redirect=${redirect}`;
}

export function buildAdvertiseLaneHref(lane: AdvertiseLane, lang: SupportedLang): string {
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

export function getAdvertiseDropdownOptions(lang: SupportedLang): AdvertiseDropdownOption[] {
  const copy = getAdvertiseDropdownCopy(lang);
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
