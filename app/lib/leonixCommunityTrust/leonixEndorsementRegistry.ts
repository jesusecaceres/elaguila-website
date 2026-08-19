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

export type LeonixEndorsementCategory = "servicios" | "restaurantes";

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
} as const;

/** Active, display-ordered definitions for one category. */
export function getLeonixEndorsementDefinitions(category: LeonixEndorsementCategory): LeonixEndorsementDefinition[] {
  const defs = LEONIX_ENDORSEMENT_REGISTRY[category] ?? [];
  return [...defs].filter((d) => d.active).sort((a, b) => a.order - b.order);
}

/** True only if `key` is a real, active, registered endorsement for `category` — the server-side
 * validation gate before any vote write (never trust a client-supplied key blindly). */
export function isValidLeonixEndorsementKey(category: string, key: string): category is LeonixEndorsementCategory {
  if (category !== "servicios" && category !== "restaurantes") return false;
  return getLeonixEndorsementDefinitions(category).some((d) => d.key === key);
}

export function isLeonixEndorsementCategory(category: string): category is LeonixEndorsementCategory {
  return category === "servicios" || category === "restaurantes";
}

/** `leonix_endorsement_votes.target_type` for a given category — the durable business-identity
 * table each category's target_id actually references (Gate 13). */
export function leonixEndorsementTargetTypeForCategory(category: LeonixEndorsementCategory): "servicios_profile" | "restaurantes_listing" {
  return category === "servicios" ? "servicios_profile" : "restaurantes_listing";
}
