/**
 * Single source of truth for Recursos public URLs. Every route/component that links to a
 * category or resource detail page must go through these helpers so the URL shape only ever
 * changes in one place — load-bearing for the print/QR slug-durability doctrine (Build 03C-COMPACT
 * era): once a resource's detail URL has been printed with a QR code, it must never move.
 */
import { withLang, type SupportedLang } from "@/app/lib/language";
import type { PrimaryCategorySlug } from "./types";

export const RECURSOS_BASE_PATH = "/recursos-comunitarios";

export function recursosCategoryPath(category: PrimaryCategorySlug): string {
  return `${RECURSOS_BASE_PATH}/${category}`;
}

export function recursosResourcePath(slug: string): string {
  return `${RECURSOS_BASE_PATH}/recurso/${slug}`;
}

export const RECURSOS_RESULTS_PATH = `${RECURSOS_BASE_PATH}/resultados`;

export function recursosCategoryHref(category: PrimaryCategorySlug, lang: SupportedLang): string {
  return withLang(recursosCategoryPath(category), lang);
}

export function recursosResourceHref(slug: string, lang: SupportedLang): string {
  return withLang(recursosResourcePath(slug), lang);
}

export function recursosResultsHref(lang: SupportedLang, params?: { q?: string; category?: PrimaryCategorySlug; urgency?: string }): string {
  return withLang(RECURSOS_RESULTS_PATH, lang, {
    q: params?.q || undefined,
    category: params?.category || undefined,
    urgency: params?.urgency || undefined,
  });
}
