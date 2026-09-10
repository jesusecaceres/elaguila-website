/**
 * Gate SERVICIOS-2 — Servicios adapter for the shared Saved Search system.
 *
 * Translates between the live Servicios public filter contract (`ServiciosResultsFilterQuery`,
 * `app/(site)/clasificados/servicios/lib/serviciosResultsFilter.ts`) and the generic normalized
 * Saved Search contract. Same shape and doctrine as the proven Autos/Bienes Raíces/Rentas
 * adapters — this file contains no engine of its own, only the field translation only Servicios
 * can know.
 *
 * Only fields the REAL results pipeline uses to decide inclusion are represented:
 * `filterServiciosPublicListingRows` (facets), `filterServiciosRowsByKeyword` (`q`) and
 * `filterServiciosRowsBySeller` (`seller`). Deliberately excluded:
 *   - `sort` — presentation order only (`sortServiciosResultsForDisplay`), never inclusion.
 *     Persisting it would make two identical searches fingerprint differently.
 *   - `page` / `perPage` — pagination, not match semantics.
 *
 * PRICE: Servicios has no price filter at all — it is a flat $399/mo subscription category and
 * `ServiciosResultsFilterQuery` has no price field. `minPrice`/`maxPrice` are therefore always
 * `null` here. That is the truthful value, not a placeholder: saving a price band a Servicios
 * shopper can never set would be saving a filter that does not exist.
 */
import type { ServiciosResultsFilterQuery } from "@/app/(site)/clasificados/servicios/lib/serviciosResultsFilter";
import type { SavedSearchNormalizedInput } from "../savedSearchTypes";

export const SAVED_SEARCH_SERVICIOS_CATEGORY = "servicios";

/** Every key optional; an absent key means "no filter on this field", matching
 * `ServiciosResultsFilterQuery`'s own undefined = no filter convention. Stored in
 * `saved_searches.filter_payload`. */
export type ServiciosSavedSearchFilterPayload = {
  /** Free-text keyword — a real inclusion filter (`filterServiciosRowsByKeyword`). */
  q?: string;
  state?: string;
  zip?: string;
  country?: string;
  /** Trade family (`internal_group`) — Servicios' primary category facet. */
  group?: string;
  /** Business vs independent presentation (`filterServiciosRowsBySeller`). */
  seller?: "business" | "independent";
  whatsapp?: boolean;
  promo?: boolean;
  call?: boolean;
  verified?: boolean;
  web?: boolean;
  bilingual?: boolean;
  email?: boolean;
  emergency?: boolean;
  mobileSvc?: boolean;
  msg?: boolean;
  phys?: boolean;
  svcMulti?: boolean;
  offer?: boolean;
  legal?: boolean;
  langEs?: boolean;
  langEn?: boolean;
  langOt?: boolean;
  vint?: boolean;
  wknd?: boolean;
  openNow?: boolean;
  licensed?: boolean;
  insured?: boolean;
  freeEstimate?: boolean;
  freeConsultation?: boolean;
  hasPhotos?: boolean;
  hasVideos?: boolean;
  hasOffers?: boolean;
  sameDay?: boolean;
  appointment?: boolean;
};

/** The `"1"`-flag facets, listed once so the two directions can never drift apart. */
const FLAG_KEYS = [
  "whatsapp",
  "promo",
  "call",
  "verified",
  "web",
  "bilingual",
  "email",
  "emergency",
  "mobileSvc",
  "msg",
  "phys",
  "svcMulti",
  "offer",
  "legal",
  "langEs",
  "langEn",
  "langOt",
  "vint",
  "wknd",
  "openNow",
  "licensed",
  "insured",
  "freeEstimate",
  "freeConsultation",
  "hasPhotos",
  "hasVideos",
  "hasOffers",
  "sameDay",
  "appointment",
] as const satisfies readonly (keyof ServiciosSavedSearchFilterPayload)[];

type ServiciosFlagKey = (typeof FLAG_KEYS)[number];

/** The Servicios filter query the shopper is actively browsing with -> the generic normalized
 * Saved Search contract, ready for `canonicalizeSavedSearch`/`buildSavedSearchFingerprint`. */
export function serviciosFilterQueryToSavedSearch(
  query: ServiciosResultsFilterQuery,
): SavedSearchNormalizedInput {
  const payload: ServiciosSavedSearchFilterPayload = {};

  const q = query.q?.trim();
  if (q) payload.q = q;
  const state = query.state?.trim();
  if (state) payload.state = state;
  const zip = query.zip?.trim();
  if (zip) payload.zip = zip;
  const country = query.country?.trim();
  if (country) payload.country = country;
  const group = query.group?.trim();
  if (group) payload.group = group;

  // "all" is the no-filter sentinel in `filterServiciosRowsBySeller` — never persisted as a real facet.
  if (query.seller === "business" || query.seller === "independent") payload.seller = query.seller;

  for (const key of FLAG_KEYS) {
    if (query[key as ServiciosFlagKey] === "1") payload[key] = true;
  }

  return {
    category: SAVED_SEARCH_SERVICIOS_CATEGORY,
    city: query.city?.trim() ?? "",
    minPrice: null,
    maxPrice: null,
    filterPayload: payload as Record<string, unknown>,
  };
}

/** A saved search row -> the exact `ServiciosResultsFilterQuery` the real results pipeline
 * expects. Used by the matcher and by "open this saved search in results" — never a second
 * reimplementation of what each field means. */
export function savedSearchToServiciosFilterQuery(
  saved: SavedSearchNormalizedInput,
): ServiciosResultsFilterQuery {
  const p = (saved.filterPayload ?? {}) as ServiciosSavedSearchFilterPayload;
  const query: ServiciosResultsFilterQuery = {
    city: saved.city || undefined,
    state: p.state,
    zip: p.zip,
    country: p.country,
    group: p.group,
    q: p.q,
    seller: p.seller ?? "all",
  };
  for (const key of FLAG_KEYS) {
    if (p[key] === true) query[key as ServiciosFlagKey] = "1";
  }
  return query;
}

/**
 * Human-readable summary of the major matching facets for the owner dashboard's saved-search
 * list. Never dumps raw `filter_payload` JSON; only surfaces facets a person would recognize
 * from having set them.
 */
export function describeServiciosSavedSearchFacets(
  saved: SavedSearchNormalizedInput,
  lang: "es" | "en",
): string[] {
  const p = (saved.filterPayload ?? {}) as ServiciosSavedSearchFilterPayload;
  const parts: string[] = [];

  if (p.group) parts.push(p.group);
  if (p.seller) {
    parts.push(
      p.seller === "business"
        ? lang === "es"
          ? "Negocio"
          : "Business"
        : lang === "es"
          ? "Independiente"
          : "Independent",
    );
  }
  if (p.verified) parts.push(lang === "es" ? "Verificado por Leonix" : "Leonix verified");
  if (p.openNow) parts.push(lang === "es" ? "Abierto ahora" : "Open now");
  if (p.licensed) parts.push(lang === "es" ? "Con licencia" : "Licensed");
  if (p.insured) parts.push(lang === "es" ? "Asegurado" : "Insured");
  if (p.emergency) parts.push(lang === "es" ? "Emergencias" : "Emergency service");
  if (p.mobileSvc) parts.push(lang === "es" ? "Servicio móvil" : "Mobile service");
  if (p.sameDay) parts.push(lang === "es" ? "Mismo día" : "Same day");
  if (p.appointment) parts.push(lang === "es" ? "Con cita" : "By appointment");
  if (p.freeEstimate) parts.push(lang === "es" ? "Presupuesto gratis" : "Free estimate");
  if (p.freeConsultation) parts.push(lang === "es" ? "Consulta gratis" : "Free consultation");
  if (p.bilingual) parts.push(lang === "es" ? "Bilingüe" : "Bilingual");
  if (p.hasOffers) parts.push(lang === "es" ? "Con ofertas" : "Has offers");
  if (p.hasVideos) parts.push(lang === "es" ? "Con video" : "Has video");
  else if (p.hasPhotos) parts.push(lang === "es" ? "Con fotos" : "Has photos");
  if (p.q) parts.push(`"${p.q}"`);

  return parts;
}
