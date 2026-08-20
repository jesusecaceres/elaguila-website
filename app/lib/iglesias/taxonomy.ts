/** Canonical Iglesias Find-by-Need vocabulary. Landing shortcuts and filters share this contract. */

export const IGLESIAS_NEED_KEYS = [
  "PRAYER",
  "SPANISH_SERVICE",
  "BILINGUAL_SERVICE",
  "CHILDREN",
  "YOUTH",
  "FAMILIES",
  "MARRIAGE",
  "GRIEF",
  "FOOD_SUPPORT",
  "COMMUNITY_SUPPORT",
  "BIBLE_STUDY",
  "RECOVERY",
  "SENIORS",
  "DISABILITY_ACCESS",
  "LIVESTREAM",
  "SMALL_GROUPS",
] as const;

export type IglesiasNeedKey = (typeof IGLESIAS_NEED_KEYS)[number];

const NEED_SET = new Set<string>(IGLESIAS_NEED_KEYS);

export function isIglesiasNeedKey(value: string): value is IglesiasNeedKey {
  return NEED_SET.has(value);
}

export type IglesiasUiLang = "es" | "en";

export type IglesiasNeedCopy = {
  key: IglesiasNeedKey;
  labelEs: string;
  labelEn: string;
  helpEs: string;
  helpEn: string;
  /** Curated landing tile. Prayer stays visible at zero inventory. */
  landingTile: boolean;
};

export const IGLESIAS_NEED_CATALOG: readonly IglesiasNeedCopy[] = [
  {
    key: "PRAYER",
    labelEs: "Necesito oración",
    labelEn: "I need prayer",
    helpEs: "Pide oración en el muro, en público o en privado.",
    helpEn: "Ask for prayer on the wall, in public or in private.",
    landingTile: true,
  },
  {
    key: "FAMILIES",
    labelEs: "Familias",
    labelEn: "Families",
    helpEs: "Ministerios para toda la familia.",
    helpEn: "Ministries for the whole family.",
    landingTile: true,
  },
  {
    key: "CHILDREN",
    labelEs: "Niños",
    labelEn: "Children",
    helpEs: "Niños e iglesia infantil.",
    helpEn: "Children’s ministry.",
    landingTile: true,
  },
  {
    key: "YOUTH",
    labelEs: "Jóvenes",
    labelEn: "Youth",
    helpEs: "Jóvenes y adolescentes.",
    helpEn: "Youth and teens.",
    landingTile: true,
  },
  {
    key: "MARRIAGE",
    labelEs: "Matrimonio",
    labelEn: "Marriage",
    helpEs: "Apoyo para parejas y matrimonio.",
    helpEn: "Support for couples and marriage.",
    landingTile: true,
  },
  {
    key: "GRIEF",
    labelEs: "Duelo / pérdida",
    labelEn: "Grief / loss",
    helpEs: "Acompañamiento en el duelo.",
    helpEn: "Grief support.",
    landingTile: true,
  },
  {
    key: "FOOD_SUPPORT",
    labelEs: "Ayuda con alimentos",
    labelEn: "Food support",
    helpEs: "Despensas y apoyo alimentario.",
    helpEn: "Food pantry and meal support.",
    landingTile: true,
  },
  {
    key: "COMMUNITY_SUPPORT",
    labelEs: "Apoyo comunitario",
    labelEn: "Community support",
    helpEs: "Ayuda práctica para la comunidad.",
    helpEn: "Practical community help.",
    landingTile: true,
  },
  {
    key: "BIBLE_STUDY",
    labelEs: "Estudio bíblico",
    labelEn: "Bible study",
    helpEs: "Estudios y grupos de la Palabra.",
    helpEn: "Bible studies and groups.",
    landingTile: true,
  },
  {
    key: "SPANISH_SERVICE",
    labelEs: "Servicio en español",
    labelEn: "Spanish service",
    helpEs: "Servicios en español.",
    helpEn: "Services in Spanish.",
    landingTile: true,
  },
  {
    key: "BILINGUAL_SERVICE",
    labelEs: "Servicio bilingüe",
    labelEn: "Bilingual service",
    helpEs: "Servicios en español e inglés.",
    helpEn: "Services in Spanish and English.",
    landingTile: true,
  },
  {
    key: "RECOVERY",
    labelEs: "Recuperación",
    labelEn: "Recovery",
    helpEs: "Apoyo en recuperación.",
    helpEn: "Recovery support.",
    landingTile: true,
  },
  {
    key: "SENIORS",
    labelEs: "Adultos mayores",
    labelEn: "Seniors",
    helpEs: "Ministerio para adultos mayores.",
    helpEn: "Ministry for seniors.",
    landingTile: false,
  },
  {
    key: "DISABILITY_ACCESS",
    labelEs: "Accesibilidad",
    labelEn: "Accessibility",
    helpEs: "Acceso e inclusión.",
    helpEn: "Access and inclusion.",
    landingTile: false,
  },
  {
    key: "LIVESTREAM",
    labelEs: "Livestream",
    labelEn: "Livestream",
    helpEs: "Transmisión en vivo.",
    helpEn: "Live stream.",
    landingTile: false,
  },
  {
    key: "SMALL_GROUPS",
    labelEs: "Grupos pequeños",
    labelEn: "Small groups",
    helpEs: "Grupos y células.",
    helpEn: "Small groups.",
    landingTile: false,
  },
] as const;

export function iglesiasNeedLabel(key: IglesiasNeedKey, lang: IglesiasUiLang): string {
  const row = IGLESIAS_NEED_CATALOG.find((n) => n.key === key);
  if (!row) return key;
  return lang === "en" ? row.labelEn : row.labelEs;
}

export const IGLESIAS_LANDING_NEED_KEYS: readonly IglesiasNeedKey[] = IGLESIAS_NEED_CATALOG.filter(
  (n) => n.landingTile,
).map((n) => n.key);

export const IGLESIAS_SERVICE_LANGUAGES = ["es", "en", "bilingual"] as const;
export type IglesiasServiceLanguage = (typeof IGLESIAS_SERVICE_LANGUAGES)[number];

export const IGLESIAS_SERVICE_MODES = ["in_person", "online", "hybrid"] as const;
export type IglesiasServiceMode = (typeof IGLESIAS_SERVICE_MODES)[number];

export function isIglesiasServiceLanguage(value: string): value is IglesiasServiceLanguage {
  return (IGLESIAS_SERVICE_LANGUAGES as readonly string[]).includes(value);
}

export function isIglesiasServiceMode(value: string): value is IglesiasServiceMode {
  return (IGLESIAS_SERVICE_MODES as readonly string[]).includes(value);
}
