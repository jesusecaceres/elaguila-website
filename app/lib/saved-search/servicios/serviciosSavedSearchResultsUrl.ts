/**
 * Gate SERVICIOS-2 — reconstructs a real Servicios results URL from a normalized saved search.
 *
 * Servicios has no `serializeServiciosBrowseUrl` helper (confirmed by direct search — the live
 * results page parses its query string inline in
 * `app/(site)/clasificados/servicios/resultados/page.tsx`). The param names below are copied
 * key-for-key from that page's own `searchParams` reads, so this stays byte-compatible with the
 * real parser without inventing a second query contract. Note the deliberate snake_case names for
 * the later-added flags (`open_now`, `free_estimate`, `has_photos`, …) — that is the live URL
 * vocabulary, not a typo.
 *
 * Sort and page are never persisted as Saved Search match semantics (see the adapter), so a
 * reconstructed URL always opens on the default sort, page 1.
 */
import { SERVICIOS_RESULTS_PATH } from "@/app/(site)/clasificados/servicios/lib/serviciosBrowseParams";
import type { SupportedLang } from "@/app/lib/language";
import { savedSearchToServiciosFilterQuery } from "./savedSearchServiciosAdapter";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

/** Flag facet -> the exact query-string key the live results page reads it from. */
const FLAG_PARAM_BY_KEY = {
  whatsapp: "whatsapp",
  promo: "promo",
  call: "call",
  verified: "verified",
  web: "web",
  bilingual: "bilingual",
  email: "email",
  emergency: "emergency",
  mobileSvc: "mobileSvc",
  msg: "msg",
  phys: "phys",
  svcMulti: "svcMulti",
  offer: "offer",
  legal: "legal",
  langEs: "langEs",
  langEn: "langEn",
  langOt: "langOt",
  vint: "vint",
  wknd: "wknd",
  openNow: "open_now",
  licensed: "licensed",
  insured: "insured",
  freeEstimate: "free_estimate",
  freeConsultation: "free_consultation",
  hasPhotos: "has_photos",
  hasVideos: "has_videos",
  hasOffers: "has_offers",
  sameDay: "same_day",
  appointment: "appointment",
} as const;

export function buildServiciosSavedSearchResultsUrl(
  saved: SavedSearchNormalizedInput,
  routeLang: SupportedLang,
): string {
  const q = savedSearchToServiciosFilterQuery(saved);
  const lang = routeLang === "en" ? "en" : "es";
  const qs = new URLSearchParams();
  qs.set("lang", lang);

  if (q.city?.trim()) qs.set("city", q.city.trim());
  if (q.state?.trim()) qs.set("state", q.state.trim());
  if (q.zip?.trim()) qs.set("zip", q.zip.trim());
  if (q.country?.trim()) qs.set("country", q.country.trim());
  if (q.group?.trim()) qs.set("group", q.group.trim());
  if (q.q?.trim()) qs.set("q", q.q.trim());
  // "all" is the no-filter sentinel — never emitted, so the URL stays clean and fingerprints match.
  if (q.seller === "business" || q.seller === "independent") qs.set("seller", q.seller);

  for (const [key, param] of Object.entries(FLAG_PARAM_BY_KEY) as [
    keyof typeof FLAG_PARAM_BY_KEY,
    string,
  ][]) {
    if (q[key] === "1") qs.set(param, "1");
  }

  return `${SERVICIOS_RESULTS_PATH}?${qs.toString()}`;
}
