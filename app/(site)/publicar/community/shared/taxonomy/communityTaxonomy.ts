/** Category select options for Clases + Comunidad quick publish. */

export type CommunitySelectOption = {
  value: string;
  labelEs: string;
  labelEn: string;
};

/** Stable slugs stored in `draft.category` / `Leonix:classCategory`. */
export const CLASES_CATEGORY_OPTIONS: readonly CommunitySelectOption[] = [
  { value: "", labelEs: "— Selecciona —", labelEn: "— Select —" },
  { value: "ingles", labelEs: "Inglés", labelEn: "English" },
  { value: "espanol", labelEs: "Español", labelEn: "Spanish" },
  { value: "zumba", labelEs: "Zumba", labelEn: "Zumba" },
  { value: "fitness", labelEs: "Fitness", labelEn: "Fitness" },
  { value: "boxeo", labelEs: "Boxeo", labelEn: "Boxing" },
  { value: "artes_marciales", labelEs: "Artes marciales", labelEn: "Martial arts" },
  { value: "yoga", labelEs: "Yoga", labelEn: "Yoga" },
  { value: "baile_danza", labelEs: "Baile / Danza", labelEn: "Dance" },
  { value: "musica", labelEs: "Música", labelEn: "Music" },
  { value: "arte", labelEs: "Arte", labelEn: "Art" },
  { value: "tutoria", labelEs: "Tutoría", labelEn: "Tutoring" },
  { value: "computacion", labelEs: "Computación", labelEn: "Computing" },
  { value: "certificacion", labelEs: "Certificación", labelEn: "Certification" },
  { value: "deportes", labelEs: "Deportes", labelEn: "Sports" },
  { value: "cocina", labelEs: "Cocina", labelEn: "Cooking" },
  { value: "manualidades", labelEs: "Manualidades", labelEn: "Crafts" },
  { value: "finanzas_negocios", labelEs: "Finanzas / Negocios", labelEn: "Finance / Business" },
  { value: "salud_bienestar", labelEs: "Salud / Bienestar", labelEn: "Health / Wellness" },
  { value: "taller_workshop", labelEs: "Taller / Workshop", labelEn: "Workshop" },
  { value: "clase_comunitaria", labelEs: "Clase comunitaria", labelEn: "Community class" },
  { value: "otro", labelEs: "Otro tipo de clase", labelEn: "Other class type" },
] as const;

const CLASES_LABEL_BY_SLUG = new Map(
  CLASES_CATEGORY_OPTIONS.filter((o) => o.value).map((o) => [o.value, o] as const),
);

/** Legacy draft values → current slug (safe migration). */
export const CLASES_CATEGORY_LEGACY_MAP: Readonly<Record<string, string>> = {
  danza: "baile_danza",
  /** Old "Clase comunitaria" used slug `comunidad` — avoid collision with hub category. */
  comunidad: "clase_comunitaria",
  taller: "taller_workshop",
  /** Legacy combined option slug (pre-split Zumba / Fitness). */
  zumba_fitness: "zumba",
  zumbaFitness: "zumba",
};

export function resolveClasesCategoryPublicLabel(slug: string, custom: string, lang: "es" | "en"): string {
  const c = String(custom ?? "").trim();
  if (slug === "otro" && c) return c;
  if (slug === "otro") return lang === "en" ? "Other class type" : "Otro tipo de clase";
  const row = CLASES_LABEL_BY_SLUG.get(slug);
  if (row) return lang === "en" ? row.labelEn : row.labelEs;
  if (c && !slug) return c;
  return c || slug || (lang === "en" ? "—" : "—");
}

export const COMUNIDAD_CATEGORY_OPTIONS: readonly CommunitySelectOption[] = [
  { value: "", labelEs: "— Selecciona —", labelEn: "— Select —" },
  { value: "feria", labelEs: "Feria", labelEn: "Fair" },
  { value: "festival", labelEs: "Festival", labelEn: "Festival" },
  { value: "comida", labelEs: "Distribución de comida", labelEn: "Food distribution" },
  { value: "iglesia", labelEs: "Evento de iglesia / comunidad", labelEn: "Church / community" },
  { value: "ciudad", labelEs: "Evento de la ciudad", labelEn: "City event" },
  { value: "salud", labelEs: "Clínica de salud", labelEn: "Health clinic" },
  { value: "escolar", labelEs: "Evento escolar", labelEn: "School event" },
  { value: "recursos", labelEs: "Evento de recursos", labelEn: "Resource event" },
  { value: "familia", labelEs: "Evento familiar", labelEn: "Family event" },
  { value: "taller", labelEs: "Taller abierto", labelEn: "Open workshop" },
  { value: "otro", labelEs: "Otro tipo de evento", labelEn: "Other event type" },
] as const;

const COMUNIDAD_LABEL_BY_SLUG = new Map(
  COMUNIDAD_CATEGORY_OPTIONS.filter((o) => o.value).map((o) => [o.value, o] as const),
);

export function resolveComunidadEventTypePublicLabel(slug: string, custom: string, lang: "es" | "en"): string {
  const c = String(custom ?? "").trim();
  if (slug === "otro" && c) return c;
  if (slug === "otro") return lang === "en" ? "Other event type" : "Otro tipo de evento";
  const row = COMUNIDAD_LABEL_BY_SLUG.get(slug);
  if (row) return lang === "en" ? row.labelEn : row.labelEs;
  return c || slug || (lang === "en" ? "—" : "—");
}

export const COMUNIDAD_ACCESSIBILITY_OPTIONS: readonly CommunitySelectOption[] = [
  { value: "familiar", labelEs: "Familiar", labelEn: "Family-friendly" },
  { value: "accesible", labelEs: "Accesible", labelEn: "Accessible" },
  { value: "al_aire_libre", labelEs: "Al aire libre", labelEn: "Outdoors" },
  { value: "interior", labelEs: "Interior", labelEn: "Indoors" },
  { value: "no_seguro", labelEs: "No estoy seguro", labelEn: "Not sure" },
] as const;

export type CommunityAudienceSlug = "ninos" | "jovenes" | "adultos" | "familias" | "todos";
export type CommunityRegistrationSlug = "si" | "no" | "noSeguro";
export type ClasesSkillLevelSlug = "principiante" | "intermedio" | "avanzado" | "todos";

export const COMMUNITY_AUDIENCE_OPTIONS: readonly CommunitySelectOption[] = [
  { value: "ninos", labelEs: "Niños", labelEn: "Children" },
  { value: "jovenes", labelEs: "Jóvenes", labelEn: "Teens / youth" },
  { value: "adultos", labelEs: "Adultos", labelEn: "Adults" },
  { value: "familias", labelEs: "Familias", labelEn: "Families" },
  { value: "todos", labelEs: "Todos", labelEn: "Everyone" },
] as const;

export const COMMUNITY_REGISTRATION_OPTIONS: readonly CommunitySelectOption[] = [
  { value: "si", labelEs: "Sí", labelEn: "Yes" },
  { value: "no", labelEs: "No", labelEn: "No" },
  { value: "noSeguro", labelEs: "No estoy seguro", labelEn: "Not sure" },
] as const;

export const CLASES_SKILL_LEVEL_OPTIONS: readonly CommunitySelectOption[] = [
  { value: "principiante", labelEs: "Principiante", labelEn: "Beginner" },
  { value: "intermedio", labelEs: "Intermedio", labelEn: "Intermediate" },
  { value: "avanzado", labelEs: "Avanzado", labelEn: "Advanced" },
  { value: "todos", labelEs: "Todos los niveles", labelEn: "All levels" },
] as const;

const AUD_MAP = new Map(COMMUNITY_AUDIENCE_OPTIONS.map((o) => [o.value, o] as const));
const REG_MAP = new Map(COMMUNITY_REGISTRATION_OPTIONS.map((o) => [o.value, o] as const));
const LVL_MAP = new Map(CLASES_SKILL_LEVEL_OPTIONS.map((o) => [o.value, o] as const));

export function labelCommunityAudience(slug: string, lang: "es" | "en"): string {
  const row = AUD_MAP.get(slug);
  return row ? (lang === "en" ? row.labelEn : row.labelEs) : slug || "—";
}

export function labelCommunityRegistration(slug: string, lang: "es" | "en"): string {
  const row = REG_MAP.get(slug);
  return row ? (lang === "en" ? row.labelEn : row.labelEs) : slug || "—";
}

export function labelClasesSkillLevel(slug: string, lang: "es" | "en"): string {
  const row = LVL_MAP.get(slug);
  return row ? (lang === "en" ? row.labelEn : row.labelEs) : slug || "—";
}

export function labelComunidadAccessibilityKey(key: string, lang: "es" | "en"): string {
  const row = COMUNIDAD_ACCESSIBILITY_OPTIONS.find((o) => o.value === key);
  return row ? (lang === "en" ? row.labelEn : row.labelEs) : key;
}
