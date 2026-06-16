import type { SupportedLang } from "@/app/lib/language";
import { PRODUCTOS_PROMOCION_PAGE_EN } from "./en";
import { PRODUCTOS_PROMOCION_PAGE_ES } from "./es";
import { PRODUCTOS_PROMOCION_PAGE_COMMUNITY } from "./community";
import type { ProductosPromocionPageCopy } from "./types";

export const PRODUCTOS_PROMOCION_PAGE_REGISTRY: Record<SupportedLang, ProductosPromocionPageCopy> = {
  es: PRODUCTOS_PROMOCION_PAGE_ES,
  en: PRODUCTOS_PROMOCION_PAGE_EN,
  vi: PRODUCTOS_PROMOCION_PAGE_COMMUNITY.vi!,
  pt: PRODUCTOS_PROMOCION_PAGE_COMMUNITY.pt!,
  tl: PRODUCTOS_PROMOCION_PAGE_COMMUNITY.tl!,
  km: PRODUCTOS_PROMOCION_PAGE_COMMUNITY.km!,
  zh: PRODUCTOS_PROMOCION_PAGE_COMMUNITY.zh!,
  ja: PRODUCTOS_PROMOCION_PAGE_COMMUNITY.ja!,
  ko: PRODUCTOS_PROMOCION_PAGE_COMMUNITY.ko!,
  hi: PRODUCTOS_PROMOCION_PAGE_COMMUNITY.hi!,
  hy: PRODUCTOS_PROMOCION_PAGE_COMMUNITY.hy!,
  ru: PRODUCTOS_PROMOCION_PAGE_COMMUNITY.ru!,
  pa: PRODUCTOS_PROMOCION_PAGE_COMMUNITY.pa!,
};

/** Promotional products catalog page UI copy — native for all active non-RTL languages. */
export function getProductosPromocionPageCopy(lang: SupportedLang): ProductosPromocionPageCopy {
  return PRODUCTOS_PROMOCION_PAGE_REGISTRY[lang] ?? PRODUCTOS_PROMOCION_PAGE_EN;
}

export type { ProductosPromocionPageCopy } from "./types";
