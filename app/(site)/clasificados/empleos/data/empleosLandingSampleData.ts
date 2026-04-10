/**
 * Leonix Clasificados — Empleos landing (Phase 1).
 * Structured sample inventory; replace with loaders/adapters without changing page layout.
 */

export type JobModalitySlug = "presencial" | "hibrido" | "remoto";

export type JobTypeSlug =
  | "tiempo-completo"
  | "medio-tiempo"
  | "temporal"
  | "por-contrato";

export type SampleFeaturedJob = {
  id: string;
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
};

export type SampleRecentJob = {
  id: string;
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
  { value: "salud", label: "Salud" },
  { value: "oficios", label: "Oficios y construcción" },
  { value: "restaurante", label: "Restaurante" },
  { value: "oficina", label: "Oficina y administración" },
  { value: "ventas", label: "Ventas" },
  { value: "tecnologia", label: "Tecnología" },
  { value: "transporte", label: "Transporte" },
  { value: "bodega", label: "Bodega y logística" },
  { value: "limpieza", label: "Limpieza" },
  { value: "educacion", label: "Educación" },
];

export const sampleJobTypeSelectOptions: readonly { value: string; label: string }[] = [
  { value: "", label: "Cualquier tipo" },
  { value: "tiempo-completo", label: "Tiempo completo" },
  { value: "medio-tiempo", label: "Medio tiempo" },
  { value: "temporal", label: "Temporal" },
  { value: "por-contrato", label: "Por contrato" },
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
  { value: "presencial", label: "Presencial" },
  { value: "hibrido", label: "Híbrido" },
  { value: "remoto", label: "Remoto" },
];

export const sampleExperienceOptions: readonly { value: string; label: string }[] = [
  { value: "", label: "Cualquier nivel" },
  { value: "entry", label: "Primer empleo / trainee" },
  { value: "mid", label: "Intermedio" },
  { value: "senior", label: "Avanzado / liderazgo" },
];

export const sampleCompanyTypeOptions: readonly { value: string; label: string }[] = [
  { value: "", label: "Cualquier empresa" },
  { value: "small", label: "Pequeña empresa" },
  { value: "mid", label: "Mediana empresa" },
  { value: "enterprise", label: "Gran empresa / corporativo" },
];

export const sampleFeaturedJobs: SampleFeaturedJob[] = [
  {
    id: "feat-rn-downey",
    title: "Enfermero(a) registrado(a)",
    company: "HealthPlus Medical Group",
    city: "Downey",
    state: "CA",
    category: "salud",
    modality: "presencial",
    jobType: "tiempo-completo",
    salaryMin: 65000,
    salaryMax: 78000,
    salaryLabel: "$65,000 – $78,000 / año",
    featured: true,
    quickApply: true,
    benefitChips: ["Tiempo completo", "Seguro médico", "401(k)"],
    companyInitials: "HP",
  },
  {
    id: "feat-sales-montebello",
    title: "Ejecutivo de ventas B2B",
    company: "Distribuidora del Valle",
    city: "Montebello",
    state: "CA",
    category: "ventas",
    modality: "hibrido",
    jobType: "tiempo-completo",
    salaryMin: 55000,
    salaryMax: 72000,
    salaryLabel: "$55,000 – $72,000 / año + comisiones",
    featured: true,
    quickApply: false,
    benefitChips: ["Híbrido", "Comisiones", "Vehículo de demostración"],
    companyInitials: "DV",
  },
  {
    id: "feat-dev-remote",
    title: "Desarrollador full stack (mid)",
    company: "Nimbus Apps",
    city: "Remoto",
    state: "CA",
    category: "tecnologia",
    modality: "remoto",
    jobType: "tiempo-completo",
    salaryMin: 95000,
    salaryMax: 118000,
    salaryLabel: "$95,000 – $118,000 / año",
    featured: true,
    quickApply: true,
    benefitChips: ["Remoto", "Equipo pequeño", "Seguro dental"],
    companyInitials: "NA",
  },
];

export const sampleRecentJobs: SampleRecentJob[] = [
  {
    id: "recent-warehouse-sgv",
    title: "Ayudante de bodega",
    company: "Logística Sur",
    city: "South Gate",
    state: "CA",
    modality: "presencial",
    jobType: "tiempo-completo",
    salaryLabel: "$19.50 – $21 / hora",
    category: "bodega",
    publishedAtLabel: "Hace 2 horas",
    quickApply: true,
  },
  {
    id: "recent-cook-lynnwood",
    title: "Cocinero de línea",
    company: "Mariscos El Puerto",
    city: "Lynwood",
    state: "CA",
    modality: "presencial",
    jobType: "tiempo-completo",
    salaryLabel: "$20 – $22 / hora + propinas",
    category: "restaurante",
    publishedAtLabel: "Hace 5 horas",
    quickApply: false,
  },
  {
    id: "recent-csr-remote",
    title: "Representante de servicio al cliente",
    company: "Brightline Support",
    city: "Remoto",
    state: "CA",
    modality: "remoto",
    jobType: "medio-tiempo",
    salaryLabel: "$18 – $20 / hora",
    category: "oficina",
    publishedAtLabel: "Hace 8 horas",
    quickApply: true,
  },
  {
    id: "recent-driver-local",
    title: "Conductor de rutas locales (Clase C)",
    company: "Envíos Rápidos CA",
    city: "Commerce",
    state: "CA",
    modality: "presencial",
    jobType: "tiempo-completo",
    salaryLabel: "$22 – $24 / hora",
    category: "transporte",
    publishedAtLabel: "Hace 1 día",
    quickApply: false,
  },
];

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
  { id: "pres", label: "Presencial", params: { modality: "presencial" }, icon: "building2" },
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
