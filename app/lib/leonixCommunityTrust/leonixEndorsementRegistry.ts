/**
 * Globalization Build 03 — Leonix Community Trust endorsement registry (Gate 11/12).
 *
 * Controlled, category-aware endorsement definitions. Labels live HERE, never on a vote row —
 * copy can evolve without rewriting historical votes. A code registry is deliberately preferred
 * over admin-configurable DB rows for V1 (Gate 11): the definition set is small, stable, and
 * product-curated — DB-configurability would be real scope growth for no proven operational gain.
 *
 * NOT a 1-5 star clone. Every entry is a discrete, category-appropriate quality a shopper can
 * genuinely endorse — never a numeric rating scale.
 */

/**
 * Gate D17 added "comida-local". Final Completion item 21 added "bienes_raices_negocio" /
 * "rentas_negocio" — reconciled together (both landed independently on the same shared file;
 * see 20260827190000_leonix_endorsement_votes_comida_local_br_rentas_reconcile.sql for the DB
 * side of this reconciliation).
 */
export type LeonixEndorsementCategory =
  | "servicios"
  | "restaurantes"
  | "comida-local"
  | "bienes_raices_negocio"
  | "rentas_negocio";

export type LeonixEndorsementDefinition = {
  /** Stable machine key — never renamed once votes exist against it (would orphan real votes). */
  key: string;
  es: string;
  en: string;
  active: boolean;
  /** Display order within its category, ascending. */
  order: number;
};

/**
 * Gate 12 — category-aware taxonomy. Each category's list is entirely its own; keys are never
 * shared/reused across categories even where the underlying idea is similar (e.g. "friendly" for
 * Servicios vs "friendly_staff" for Restaurantes) so a restaurant's history can never be confused
 * with a service provider's.
 */
export const LEONIX_ENDORSEMENT_REGISTRY: Readonly<Record<LeonixEndorsementCategory, readonly LeonixEndorsementDefinition[]>> = {
  restaurantes: [
    { key: "clean", es: "Restaurante limpio", en: "Clean restaurant", active: true, order: 1 },
    { key: "friendly_staff", es: "Personal amable", en: "Friendly staff", active: true, order: 2 },
    { key: "great_food", es: "Buena comida", en: "Great food", active: true, order: 3 },
    { key: "good_service", es: "Buen servicio", en: "Good service", active: true, order: 4 },
    { key: "great_atmosphere", es: "Buen ambiente", en: "Great atmosphere", active: true, order: 5 },
  ],
  servicios: [
    { key: "professional", es: "Profesional", en: "Professional", active: true, order: 1 },
    { key: "on_time", es: "Puntual", en: "On time", active: true, order: 2 },
    { key: "friendly", es: "Trato amable", en: "Friendly", active: true, order: 3 },
    { key: "good_communication", es: "Buena comunicación", en: "Good communication", active: true, order: 4 },
    { key: "quality_work", es: "Trabajo de calidad", en: "Quality work", active: true, order: 5 },
  ],
  "comida-local": [
    { key: "cl_tasty_food", es: "Comida sabrosa", en: "Tasty food", active: true, order: 1 },
    { key: "cl_generous_portions", es: "Porciones generosas", en: "Generous portions", active: true, order: 2 },
    { key: "cl_friendly_seller", es: "Vendedor amable", en: "Friendly seller", active: true, order: 3 },
    { key: "cl_on_time", es: "Llega a tiempo", en: "Shows up on time", active: true, order: 4 },
    { key: "cl_clean_setup", es: "Puesto limpio", en: "Clean setup", active: true, order: 5 },
  ],
  // Item 21 (Final Completion) — BR Negocio: professional-only (agent/brokerage identity),
  // never exposed to BR Privado. Curated vocabulary as approved.
  bienes_raices_negocio: [
    { key: "respuesta_rapida", es: "Respuesta rápida", en: "Quick to respond", active: true, order: 1 },
    { key: "comunicacion_clara", es: "Comunicación clara", en: "Clear communication", active: true, order: 2 },
    { key: "informacion_precisa", es: "Información precisa", en: "Accurate information", active: true, order: 3 },
    { key: "proceso_sencillo", es: "Proceso sencillo", en: "Smooth process", active: true, order: 4 },
    { key: "conocimiento_area", es: "Conocimiento del área", en: "Knows the area", active: true, order: 5 },
  ],
  // Rentas Negocio: professional-only (business/property-manager identity), never exposed to
  // Rentas Privado. Curated vocabulary as approved.
  rentas_negocio: [
    { key: "respuesta_rapida", es: "Respuesta rápida", en: "Quick to respond", active: true, order: 1 },
    { key: "mantenimiento_tiempo", es: "Mantenimiento a tiempo", en: "Timely maintenance", active: true, order: 2 },
    { key: "trato_justo", es: "Trato justo", en: "Fair treatment", active: true, order: 3 },
    { key: "proceso_renta_sencillo", es: "Proceso de renta sencillo", en: "Easy rental process", active: true, order: 4 },
    { key: "propiedad_como_descrita", es: "Propiedad como se describe", en: "Property as described", active: true, order: 5 },
  ],
} as const;

/** Active, display-ordered definitions for one category. */
export function getLeonixEndorsementDefinitions(category: LeonixEndorsementCategory): LeonixEndorsementDefinition[] {
  const defs = LEONIX_ENDORSEMENT_REGISTRY[category] ?? [];
  return [...defs].filter((d) => d.active).sort((a, b) => a.order - b.order);
}

const LEONIX_ENDORSEMENT_CATEGORIES: readonly LeonixEndorsementCategory[] = [
  "servicios",
  "restaurantes",
  "comida-local",
  "bienes_raices_negocio",
  "rentas_negocio",
];

/** True only if `key` is a real, active, registered endorsement for `category` — the server-side
 * validation gate before any vote write (never trust a client-supplied key blindly). */
export function isValidLeonixEndorsementKey(category: string, key: string): category is LeonixEndorsementCategory {
  if (!isLeonixEndorsementCategory(category)) return false;
  return getLeonixEndorsementDefinitions(category).some((d) => d.key === key);
}

export function isLeonixEndorsementCategory(category: string): category is LeonixEndorsementCategory {
  return (LEONIX_ENDORSEMENT_CATEGORIES as readonly string[]).includes(category);
}

export type LeonixEndorsementTargetType =
  | "servicios_profile"
  | "restaurantes_listing"
  | "comida_local_listing"
  | "bienes_raices_negocio_identity"
  | "rentas_negocio_identity";

/** `leonix_endorsement_votes.target_type` for a given category — the durable business-identity
 * table/entity each category's target_id actually references (Gate 13; Gate D17 adds
 * comida-local). BR/Rentas Negocio target a durable per-owner `leonix_professional_identities`
 * row (item 21), never a disposable listing id. */
export function leonixEndorsementTargetTypeForCategory(category: LeonixEndorsementCategory): LeonixEndorsementTargetType {
  if (category === "servicios") return "servicios_profile";
  if (category === "restaurantes") return "restaurantes_listing";
  if (category === "comida-local") return "comida_local_listing";
  if (category === "bienes_raices_negocio") return "bienes_raices_negocio_identity";
  return "rentas_negocio_identity";
}

/**
 * Item 21 (Final Completion) — readiness gate, independent of the registry/UI code above being
 * complete. Both new BR/Rentas categories are now live: the prepared migration
 * (20260827180000_leonix_professional_identities_br_rentas_community_trust.sql, plus the
 * 20260827190000 reconciliation with Comida Local's own migration) was applied to canonical
 * production and verified (table/RLS/constraints/RPC present and correct; Servicios/Restaurantes
 * regression-checked; BR/Rentas identity resolve/create proven idempotent; Privado proven unable
 * to become a target via the category CHECK).
 */
const LEONIX_ENDORSEMENT_CATEGORY_LIVE: Record<LeonixEndorsementCategory, boolean> = {
  servicios: true,
  restaurantes: true,
  "comida-local": true,
  bienes_raices_negocio: true,
  rentas_negocio: true,
};

export function isLeonixEndorsementCategoryLive(category: LeonixEndorsementCategory): boolean {
  return LEONIX_ENDORSEMENT_CATEGORY_LIVE[category] === true;
}
