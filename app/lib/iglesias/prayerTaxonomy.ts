export const PRAYER_CATEGORY_KEYS = [
  "HEALTH",
  "FAMILY",
  "MARRIAGE",
  "CHILDREN",
  "GRIEF",
  "WORK",
  "HOUSING",
  "RECOVERY",
  "ANXIETY_FEAR",
  "FAITH_DIRECTION",
  "COMMUNITY",
  "OTHER",
] as const;

export type PrayerCategoryKey = (typeof PRAYER_CATEGORY_KEYS)[number];

const CATEGORY_SET = new Set<string>(PRAYER_CATEGORY_KEYS);

export function isPrayerCategoryKey(value: string): value is PrayerCategoryKey {
  return CATEGORY_SET.has(value);
}

export const PRAYER_CATEGORY_LABELS: Record<PrayerCategoryKey, { es: string; en: string }> = {
  HEALTH: { es: "Salud", en: "Health" },
  FAMILY: { es: "Familia", en: "Family" },
  MARRIAGE: { es: "Matrimonio", en: "Marriage" },
  CHILDREN: { es: "Hijos", en: "Children" },
  GRIEF: { es: "Duelo", en: "Grief" },
  WORK: { es: "Trabajo", en: "Work" },
  HOUSING: { es: "Vivienda", en: "Housing" },
  RECOVERY: { es: "Recuperación", en: "Recovery" },
  ANXIETY_FEAR: { es: "Ansiedad o miedo", en: "Anxiety or fear" },
  FAITH_DIRECTION: { es: "Fe y dirección", en: "Faith and direction" },
  COMMUNITY: { es: "Comunidad", en: "Community" },
  OTHER: { es: "Otra", en: "Other" },
};

export function prayerCategoryLabel(key: PrayerCategoryKey | null | undefined, lang: "es" | "en"): string | null {
  if (!key || !isPrayerCategoryKey(key)) return null;
  return PRAYER_CATEGORY_LABELS[key][lang];
}

export const PRAYER_VISIBILITIES = ["PUBLIC_NAMED", "PUBLIC_ANONYMOUS", "PRIVATE_PRAYER_TEAM"] as const;
export type PrayerVisibility = (typeof PRAYER_VISIBILITIES)[number];

export function isPrayerVisibility(value: string): value is PrayerVisibility {
  return (PRAYER_VISIBILITIES as readonly string[]).includes(value);
}

export const PRAYER_LANGUAGES = ["es", "en"] as const;
export type PrayerLanguage = (typeof PRAYER_LANGUAGES)[number];

export function isPrayerLanguage(value: string): value is PrayerLanguage {
  return (PRAYER_LANGUAGES as readonly string[]).includes(value);
}

export const PRAYER_PUBLIC_STATUSES = [
  "OPEN",
  "STILL_NEEDS_PRAYER",
  "UPDATE_POSTED",
  "ANSWERED_OR_GRATITUDE",
] as const;

export type PrayerPublicStatus = (typeof PRAYER_PUBLIC_STATUSES)[number];

export const PRAYER_REPORT_REASONS = [
  "HATE_HARASSMENT",
  "THREAT",
  "PRIVATE_INFORMATION",
  "SPAM",
  "INAPPROPRIATE",
  "OTHER",
] as const;

export type PrayerReportReason = (typeof PRAYER_REPORT_REASONS)[number];

export function isPrayerReportReason(value: string): value is PrayerReportReason {
  return (PRAYER_REPORT_REASONS as readonly string[]).includes(value);
}

export const PRAYER_CONTACT_METHODS = ["email", "phone", "whatsapp"] as const;
export type PrayerContactMethod = (typeof PRAYER_CONTACT_METHODS)[number];

export function isPrayerContactMethod(value: string): value is PrayerContactMethod {
  return (PRAYER_CONTACT_METHODS as readonly string[]).includes(value);
}
