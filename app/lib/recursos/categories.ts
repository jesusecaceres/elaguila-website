import type { PrimaryCategorySlug, RecursosLang } from "./types";

export type PrimaryCategoryDef = {
  slug: PrimaryCategorySlug;
  labelEs: string;
  labelEn: string;
  descriptionEs: string;
  descriptionEn: string;
};

/** The 12 permanent primary categories — single source of truth for labels. */
export const PRIMARY_CATEGORIES: readonly PrimaryCategoryDef[] = [
  {
    slug: "urgent-safety",
    labelEs: "Ayuda urgente y seguridad",
    labelEn: "Urgent help & safety",
    descriptionEs: "Crisis, seguridad inmediata, violencia doméstica y refugio de emergencia.",
    descriptionEn: "Crisis, immediate safety, domestic violence, and emergency shelter.",
  },
  {
    slug: "food-basic-needs",
    labelEs: "Comida y necesidades básicas",
    labelEn: "Food & basic needs",
    descriptionEs: "Bancos de comida, pañales y artículos esenciales para el hogar.",
    descriptionEn: "Food banks, diapers, and essential household items.",
  },
  {
    slug: "housing-rent",
    labelEs: "Vivienda y renta",
    labelEn: "Housing & rent",
    descriptionEs: "Ayuda con renta, prevención de desalojo y navegación de vivienda.",
    descriptionEn: "Rent assistance, eviction prevention, and housing navigation.",
  },
  {
    slug: "mental-health-recovery",
    labelEs: "Salud mental y recuperación",
    labelEn: "Mental health & recovery",
    descriptionEs: "Apoyo emocional, consejería y recursos de recuperación.",
    descriptionEn: "Emotional support, counseling, and recovery resources.",
  },
  {
    slug: "health-clinics",
    labelEs: "Salud y clínicas",
    labelEn: "Health & clinics",
    descriptionEs: "Clínicas comunitarias y servicios de salud accesibles.",
    descriptionEn: "Community clinics and accessible health services.",
  },
  {
    slug: "legal-immigration",
    labelEs: "Legal e inmigración",
    labelEn: "Legal & immigration",
    descriptionEs: "Asesoría legal y apoyo en procesos de inmigración.",
    descriptionEn: "Legal advice and immigration process support.",
  },
  {
    slug: "babies-kids-parents",
    labelEs: "Bebés, niños y padres",
    labelEn: "Babies, children & parents",
    descriptionEs: "Cuidado infantil, apoyo para padres y primeros años.",
    descriptionEn: "Childcare, parent support, and early years services.",
  },
  {
    slug: "youth-education",
    labelEs: "Jóvenes y educación",
    labelEn: "Youth & education",
    descriptionEs: "Programas después de clases, tutoría y educación para jóvenes.",
    descriptionEn: "After-school programs, tutoring, and education for youth.",
  },
  {
    slug: "jobs-training",
    labelEs: "Trabajo y capacitación",
    labelEn: "Jobs & training",
    descriptionEs: "Empleo, capacitación vocacional y desarrollo laboral.",
    descriptionEn: "Employment, vocational training, and workforce development.",
  },
  {
    slug: "seniors-disability",
    labelEs: "Adultos mayores y discapacidad",
    labelEn: "Seniors & disability",
    descriptionEs: "Servicios para adultos mayores y personas con discapacidad.",
    descriptionEn: "Services for older adults and people with disabilities.",
  },
  {
    slug: "transportation-access",
    labelEs: "Transporte y acceso",
    labelEn: "Transportation & access",
    descriptionEs: "Transporte y apoyo para llegar a servicios esenciales.",
    descriptionEn: "Transportation and support to reach essential services.",
  },
  {
    slug: "community-support",
    labelEs: "Otros apoyos comunitarios",
    labelEn: "Other community support",
    descriptionEs: "Otros recursos y apoyos comunitarios locales.",
    descriptionEn: "Other local community resources and support.",
  },
] as const;

const CATEGORY_BY_SLUG: ReadonlyMap<PrimaryCategorySlug, PrimaryCategoryDef> = new Map(
  PRIMARY_CATEGORIES.map((c) => [c.slug, c]),
);

export function getPrimaryCategory(slug: PrimaryCategorySlug): PrimaryCategoryDef | undefined {
  return CATEGORY_BY_SLUG.get(slug);
}

export function getPrimaryCategoryLabel(slug: PrimaryCategorySlug, lang: RecursosLang): string {
  const c = CATEGORY_BY_SLUG.get(slug);
  if (!c) return slug;
  return lang === "en" ? c.labelEn : c.labelEs;
}

export function getPrimaryCategoryDescription(slug: PrimaryCategorySlug, lang: RecursosLang): string {
  const c = CATEGORY_BY_SLUG.get(slug);
  if (!c) return "";
  return lang === "en" ? c.descriptionEn : c.descriptionEs;
}
