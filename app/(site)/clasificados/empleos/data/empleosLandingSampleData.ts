/**
 * Leonix Clasificados — Empleos landing (Phase 1).
 * Structured sample inventory; replace with loaders/adapters without changing page layout.
 */

import { EMPLEOS_JOB_CATALOG } from "./empleosSampleCatalog";
import type { JobModalitySlug, JobTypeSlug } from "./empleosJobTypes";

export type { JobModalitySlug, JobTypeSlug } from "./empleosJobTypes";

export type SampleFeaturedJob = {
  id: string;
  slug: string;
  title: string;
  company: string;
  city: string;
  state: string;
  category: string;
  modality: JobModalitySlug;
  jobType: JobTypeSlug;
  salaryMin: number;
  salaryMax: number;
  salaryLabel: string;
  featured: boolean;
  quickApply: boolean;
  benefitChips: readonly string[];
  companyInitials: string;
  /**
   * Live DB mapping only — distinguishes paid visibility from standard listings when both appear in the landing strip.
   * Marketing samples omit this and rely on `featured`.
   */
  empleosVisibility?: "promoted" | "featured" | "standard";
};

export type SampleRecentJob = {
  id: string;
  slug: string;
  title: string;
  company: string;
  city: string;
  state: string;
  modality: JobModalitySlug;
  jobType: JobTypeSlug;
  salaryLabel: string;
  category: string;
  publishedAtLabel: string;
  quickApply: boolean;
};

export type SampleJobCategory = {
  slug: string;
  title: string;
  count: number;
  icon: "heart" | "hammer" | "utensils" | "building" | "tag" | "cpu" | "truck" | "boxes" | "sparkles" | "book";
};

export type SampleQuickFilter = {
  id: string;
  label: string;
  /** Maps to results query params (stable slugs). */
  params: Record<string, string>;
  icon: "clock" | "home" | "building2" | "hardhat" | "tag" | "headset" | "cpu" | "grid" | "heart";
};

export type SampleJobFairEvent = {
  title: string;
  subtitle: string;
  dateLine: string;
  timeLine: string;
  venue: string;
  imageSrc: string;
  imageAlt: string;
};

export const samplePopularSearches: readonly string[] = [
  "Cajero",
  "Enfermero",
  "Conductor",
  "Ventas",
  "Bodega",
  "Remoto",
  "Medio tiempo",
  "Oficina",
];

export const sampleCategorySelectOptions: readonly { value: string; label: string }[] = [
  { value: "", label: "Todas las industrias" },
  { value: "oficina", label: "Administración / Oficina" },
  { value: "atencion-cliente", label: "Atención al cliente" },
  { value: "ventas", label: "Ventas" },
  { value: "marketing", label: "Marketing / Publicidad" },
  { value: "tecnologia", label: "Tecnología / IT" },
  { value: "diseno", label: "Diseño / Creativo" },
  { value: "construccion", label: "Construcción" },
  { value: "electricidad", label: "Electricidad" },
  { value: "plomeria", label: "Plomería" },
  { value: "hvac", label: "HVAC / Aire acondicionado" },
  { value: "jardineria", label: "Jardinería / Landscaping" },
  { value: "limpieza", label: "Limpieza" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "mecanica", label: "Mecánica / Automotriz" },
  { value: "manufactura", label: "Manufactura / Producción" },
  { value: "bodega", label: "Almacén / Warehouse" },
  { value: "logistica", label: "Logística / Transporte" },
  { value: "transporte", label: "Chofer / Delivery" },
  { value: "restaurante", label: "Restaurante / Cocina" },
  { value: "mesero", label: "Mesero / Bartender" },
  { value: "cafeteria", label: "Cafetería / Panadería" },
  { value: "cuidado-ninos", label: "Cuidado de niños" },
  { value: "cuidado-mayores", label: "Cuidado de personas mayores" },
  { value: "salud", label: "Salud / Clínica" },
  { value: "dental", label: "Dental" },
  { value: "belleza", label: "Belleza / Barbería / Estética" },
  { value: "educacion", label: "Educación / Tutoría" },
  { value: "fitness", label: "Entrenamiento / Fitness" },
  { value: "seguridad", label: "Seguridad" },
  { value: "real-estate", label: "Real Estate / Propiedades" },
  { value: "finanzas", label: "Finanzas / Contabilidad" },
  { value: "legal", label: "Legal" },
  { value: "recursos-humanos", label: "Recursos Humanos" },
  { value: "eventos", label: "Eventos" },
  { value: "trabajo-domestico", label: "Trabajo doméstico" },
  { value: "freelance", label: "Freelance / Contrato" },
  { value: "practicas", label: "Prácticas / Internship" },
  { value: "voluntariado", label: "Voluntariado" },
  { value: "otro", label: "Otro" },
];

export const sampleJobTypeSelectOptions: readonly { value: string; label: string }[] = [
  { value: "", label: "Cualquier tipo" },
  { value: "tiempo-completo", label: "Tiempo completo" },
  { value: "medio-tiempo", label: "Medio tiempo" },
  { value: "temporal", label: "Temporal" },
  { value: "por-contrato", label: "Por contrato" },
  { value: "practicas", label: "Prácticas" },
  { value: "aprendiz", label: "Aprendiz" },
  { value: "freelance", label: "Freelance" },
  { value: "por-proyecto", label: "Por proyecto" },
  { value: "por-temporada", label: "Por temporada" },
  { value: "fin-de-semana", label: "Fin de semana" },
  { value: "turno-dia", label: "Turno de día" },
  { value: "turno-noche", label: "Turno de noche" },
  { value: "turno-mixto", label: "Turno mixto" },
  { value: "remoto", label: "Remoto" },
  { value: "hibrido", label: "Híbrido" },
  { value: "presencial", label: "Presencial" },
  { value: "voluntario", label: "Voluntario" },
  { value: "por-horas", label: "Por horas" },
  { value: "turno-nocturno", label: "Turno nocturno" },
  { value: "voluntariado", label: "Voluntariado" },
  { value: "otro", label: "Otro" },
];

/** Salary band presets (annual USD) — maps to salaryMin/salaryMax on results. */
export const sampleSalaryBandOptions: readonly { value: string; label: string; min: string; max: string }[] = [
  { value: "", label: "Cualquier salario", min: "", max: "" },
  { value: "30-45k", label: "$30,000 – $45,000 / año", min: "30000", max: "45000" },
  { value: "45-60k", label: "$45,000 – $60,000 / año", min: "45000", max: "60000" },
  { value: "60-80k", label: "$60,000 – $80,000 / año", min: "60000", max: "80000" },
  { value: "80-100k", label: "$80,000 – $100,000 / año", min: "80000", max: "100000" },
  { value: "100k+", label: "$100,000+ / año", min: "100000", max: "" },
];

export const sampleModalityOptions: readonly { value: string; label: string }[] = [
  { value: "", label: "Todas las modalidades" },
  { value: "presencial", label: "En persona" },
  { value: "remoto", label: "Remoto" },
  { value: "hibrido", label: "Híbrido" },
  { value: "campo", label: "Trabajo en campo" },
  { value: "varias-ubicaciones", label: "Varias ubicaciones" },
  { value: "otro", label: "Otro" },
];

export const sampleExperienceOptions: readonly { value: string; label: string }[] = [
  { value: "", label: "Cualquier nivel" },
  { value: "sin-experiencia", label: "Sin experiencia" },
  { value: "entry", label: "Principiante" },
  { value: "mid", label: "Intermedio" },
  { value: "senior", label: "Experto" },
  { value: "supervisor", label: "Supervisor / Lead" },
  { value: "gerencia", label: "Gerencia" },
  { value: "certificacion", label: "Certificación requerida" },
  { value: "licencia", label: "Licencia requerida" },
];

export const sampleCompanyTypeOptions: readonly { value: string; label: string }[] = [
  { value: "", label: "Cualquier empresa" },
  { value: "small", label: "Pequeña empresa" },
  { value: "mid", label: "Mediana empresa" },
  { value: "enterprise", label: "Gran empresa / corporativo" },
];

/** US state (value = USPS code). Expand with full 50-state list when live data covers national inventory. */
export const sampleUsStateSelectOptions: readonly { value: string; labelEs: string; labelEn: string }[] = [
  { value: "", labelEs: "Todos los estados", labelEn: "All states" },
  { value: "CA", labelEs: "California", labelEn: "California" },
  { value: "TX", labelEs: "Texas", labelEn: "Texas" },
  { value: "FL", labelEs: "Florida", labelEn: "Florida" },
  { value: "NY", labelEs: "Nueva York", labelEn: "New York" },
  { value: "AZ", labelEs: "Arizona", labelEn: "Arizona" },
  { value: "NV", labelEs: "Nevada", labelEn: "Nevada" },
  { value: "OR", labelEs: "Oregón", labelEn: "Oregon" },
  { value: "WA", labelEs: "Washington", labelEn: "Washington" },
  { value: "IL", labelEs: "Illinois", labelEn: "Illinois" },
];

/** Fixed “now” for stable relative time labels at build/prerender. */
const LANDING_TIME_REF = new Date("2026-04-10T18:00:00.000Z");

function publishedLabelEs(iso: string): string {
  const diffH = Math.floor((LANDING_TIME_REF.getTime() - new Date(iso).getTime()) / 3600000);
  if (diffH < 48) return `Hace ${Math.max(1, diffH)} horas`;
  const days = Math.floor(diffH / 24);
  return days === 1 ? "Hace 1 día" : `Hace ${days} días`;
}

export const sampleFeaturedJobs: SampleFeaturedJob[] = EMPLEOS_JOB_CATALOG.filter((j) => j.showOnLandingFeatured).map(
  (j) => ({
    id: j.id,
    slug: j.slug,
    title: j.title,
    company: j.company,
    city: j.city,
    state: j.state,
    category: j.category,
    modality: j.modality,
    jobType: j.jobType,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    salaryLabel: j.salaryLabel,
    featured: true,
    quickApply: j.quickApply,
    benefitChips: j.benefitChips,
    companyInitials: j.companyInitials,
  }),
);

export const sampleRecentJobs: SampleRecentJob[] = EMPLEOS_JOB_CATALOG.filter((j) => j.showOnLandingRecent)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  .map((j) => ({
    id: j.id,
    slug: j.slug,
    title: j.title,
    company: j.company,
    city: j.city,
    state: j.state,
    modality: j.modality,
    jobType: j.jobType,
    salaryLabel: j.salaryLabel,
    category: j.category,
    publishedAtLabel: publishedLabelEs(j.publishedAt),
    quickApply: j.quickApply,
  }));

export const sampleJobCategories: SampleJobCategory[] = [
  { slug: "salud", title: "Salud", count: 428, icon: "heart" },
  { slug: "oficios", title: "Oficios", count: 512, icon: "hammer" },
  { slug: "restaurante", title: "Restaurante", count: 361, icon: "utensils" },
  { slug: "oficina", title: "Oficina", count: 294, icon: "building" },
  { slug: "ventas", title: "Ventas", count: 267, icon: "tag" },
  { slug: "tecnologia", title: "Tecnología", count: 198, icon: "cpu" },
  { slug: "transporte", title: "Transporte", count: 176, icon: "truck" },
  { slug: "bodega", title: "Bodega", count: 241, icon: "boxes" },
  { slug: "limpieza", title: "Limpieza", count: 189, icon: "sparkles" },
  { slug: "educacion", title: "Educación", count: 122, icon: "book" },
];

export const sampleQuickFilters: SampleQuickFilter[] = [
  { id: "ft", label: "Tiempo completo", params: { jobType: "tiempo-completo" }, icon: "clock" },
  { id: "pt", label: "Medio tiempo", params: { jobType: "medio-tiempo" }, icon: "clock" },
  { id: "rem", label: "Remoto", params: { modality: "remoto" }, icon: "home" },
  { id: "hyb", label: "Híbrido", params: { modality: "hibrido" }, icon: "building2" },
  { id: "pres", label: "En persona", params: { modality: "presencial" }, icon: "building2" },
  { id: "salud", label: "Salud", params: { category: "salud" }, icon: "heart" },
  { id: "const", label: "Construcción", params: { category: "oficios" }, icon: "hardhat" },
  { id: "sales", label: "Ventas", params: { category: "ventas" }, icon: "tag" },
  { id: "cx", label: "Servicio al cliente", params: { q: "servicio al cliente" }, icon: "headset" },
  { id: "tech", label: "Tecnología", params: { category: "tecnologia" }, icon: "cpu" },
  { id: "all", label: "Ver todas", params: {}, icon: "grid" },
];

export const sampleJobFairEvent: SampleJobFairEvent = {
  title: "Ferias de empleo y eventos",
  subtitle: "Conecta con empleadores y encuentra tu próxima oportunidad en persona.",
  dateLine: "Miércoles 16 de julio",
  timeLine: "10:00 a. m. – 3:00 p. m.",
  venue: "Centro de Convenciones · acceso con registro",
  imageSrc:
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=80",
  imageAlt: "Dos personas dándose la mano en un evento profesional",
};
