/**
 * Clasificados publish / application pipeline — route lang vs UI copy lang.
 * Route URLs preserve full SupportedLang; UI chrome uses ES/EN via navCopyLang.
 */

import {
  navCopyLang,
  resolvePublicLangFromSearchParams,
  resolveRouteLang,
  withLang,
  type SupportedLang,
} from "@/app/lib/language";

export type ClasificadosCopyLang = "es" | "en";

export type ClasificadosPublishLangContext = {
  routeLang: SupportedLang;
  copyLang: ClasificadosCopyLang;
};

/** Client components — URL → cookie → default. */
export function resolveClasificadosPublishLang(
  queryLang: string | null | undefined,
): ClasificadosPublishLangContext {
  const routeLang = resolveRouteLang(queryLang);
  return { routeLang, copyLang: navCopyLang(routeLang) };
}

/** Server pages — searchParams only (no cookie). */
export function resolveClasificadosPublishLangFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined> | undefined,
): ClasificadosPublishLangContext {
  const routeLang = resolvePublicLangFromSearchParams(searchParams);
  return { routeLang, copyLang: navCopyLang(routeLang) };
}

export function withClasificadosPublishLang(
  href: string,
  routeLang: SupportedLang,
  extraParams?: Record<string, string | number | boolean | null | undefined>,
): string {
  return withLang(href, routeLang, extraParams);
}
