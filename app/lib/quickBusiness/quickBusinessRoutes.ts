/**
 * Quick Business routes — the only place the `/publicar/negocio-rapido` literals live.
 * Everything under `/publicar/**` is wrapped by `PublishAuthGateLayout` (app/(site)/publicar/layout.tsx): a
 * logged-out customer goes to the existing login with `redirect=<this exact path>` and returns here.
 */

import type { QuickBusinessCategoryKey } from "./quickBusinessTypes";

export const QUICK_BUSINESS_BASE_PATH = "/publicar/negocio-rapido";

/** `src` marks where a link came from (staff share vs. gateway) — display only, never authority. */
export type QuickBusinessLinkSource = "staff" | "gateway" | "direct";

function withQuery(path: string, params: Record<string, string | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === "") continue;
    q.set(k, v);
  }
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}

export function quickBusinessChooserPath(lang: string, src?: QuickBusinessLinkSource): string {
  return withQuery(QUICK_BUSINESS_BASE_PATH, { lang, src });
}

export function quickBusinessCategoryPath(category: QuickBusinessCategoryKey, lang: string, src?: QuickBusinessLinkSource): string {
  return withQuery(`${QUICK_BUSINESS_BASE_PATH}/${category}`, { lang, src });
}

/** Simple control doorway. `cat` selects one business; omitted, the doorway lists them. */
export function quickBusinessMyBusinessPath(lang: string, category?: QuickBusinessCategoryKey): string {
  return withQuery(`${QUICK_BUSINESS_BASE_PATH}/mi-negocio`, { lang, cat: category });
}

/** Absolute URL for Copy / Share (staff launchpad). `origin` = `window.location.origin` at click time. */
export function quickBusinessShareUrl(origin: string, category: QuickBusinessCategoryKey | null, lang: string): string {
  const base = origin.replace(/\/+$/, "");
  const path = category ? quickBusinessCategoryPath(category, lang, "staff") : quickBusinessChooserPath(lang, "staff");
  return `${base}${path}`;
}

export function isQuickBusinessCategoryKey(raw: string | null | undefined): raw is QuickBusinessCategoryKey {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "servicios" || v === "restaurantes" || v === "autos-dealer" || v === "bienes-negocio";
}
