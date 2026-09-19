/**
 * Quick Classifieds routes — the only place the `/publicar/rapido` path literals live.
 * Everything under `/publicar/**` is already wrapped by `PublishAuthGateLayout` (app/(site)/publicar/layout.tsx),
 * which sends a logged-out customer to the existing login with `redirect=<this exact path>` and returns them here.
 */

import type { QuickClassifiedCategoryKey } from "./quickClassifiedTypes";

export const QUICK_CLASSIFIEDS_BASE_PATH = "/publicar/rapido";
export const QUICK_CLASSIFIEDS_MY_AD_PATH = `${QUICK_CLASSIFIEDS_BASE_PATH}/mi-anuncio`;

/** `src` marks where a Quick link came from (staff share vs. public gateway) — display/UX only, never authority. */
export type QuickLinkSource = "staff" | "gateway" | "direct";

function withQuery(path: string, params: Record<string, string | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === "") continue;
    q.set(k, v);
  }
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}

export function quickClassifiedsChooserPath(lang: string, src?: QuickLinkSource): string {
  return withQuery(QUICK_CLASSIFIEDS_BASE_PATH, { lang, src });
}

export function quickClassifiedCategoryPath(
  category: QuickClassifiedCategoryKey,
  lang: string,
  src?: QuickLinkSource,
): string {
  return withQuery(`${QUICK_CLASSIFIEDS_BASE_PATH}/${category}`, { lang, src });
}

export function quickClassifiedMyAdPath(lang: string, category?: QuickClassifiedCategoryKey | null): string {
  return withQuery(QUICK_CLASSIFIEDS_MY_AD_PATH, { lang, cat: category ?? null });
}

/** Absolute URL for Copy / Share (staff launchpad). `origin` comes from `window.location.origin` at click time. */
export function quickClassifiedShareUrl(
  origin: string,
  category: QuickClassifiedCategoryKey | null,
  lang: string,
): string {
  const base = origin.replace(/\/+$/, "");
  const path = category ? quickClassifiedCategoryPath(category, lang, "staff") : quickClassifiedsChooserPath(lang, "staff");
  return `${base}${path}`;
}

export function isQuickClassifiedCategoryKey(raw: string | null | undefined): raw is QuickClassifiedCategoryKey {
  const v = (raw ?? "").trim().toLowerCase();
  return (
    v === "en-venta" ||
    v === "rentas" ||
    v === "empleos" ||
    v === "autos" ||
    v === "bienes-raices" ||
    v === "clases" ||
    v === "comunidad" ||
    v === "busco" ||
    v === "mascotas-y-perdidos"
  );
}
