/**
 * Leonix bilingual discovery — Empleos adapter, WAVE 4 (2026-09-24).
 *
 * Canonical basis (codes Empleos ALREADY persists on `EmpleosJobRecord`):
 *   category  raw category slug (the publish select list: oficina, ventas, restaurante, limpieza, ...)
 *   jobType   `JobTypeSlug`  (tiempo-completo, medio-tiempo, temporal, ...)
 *   modality  `JobModalitySlug` (presencial, hibrido, remoto, ...)
 * Role words (cocinero / cook, chofer / driver, cajero / cashier, ...) are approved aliases of the existing
 * category codes — nothing new is stored. Titles, descriptions and requirements are owner text in their
 * original language (cross-language prose stays deferred). No translation call.
 */
import type { EmpleosJobRecord } from "@/app/(site)/clasificados/empleos/data/empleosJobTypes";
import { catalogKeywordMatcher, createCatalogDiscoveryAdapter, type CatalogConcept } from "../catalogDiscovery";
import type { CanonicalConceptRef } from "../canonicalTaxonomyAdapter";

export const EMPLEOS_CONCEPT_KIND = { category: "category", jobType: "jobType", modality: "modality" } as const;

const cat = (id: string, es: string, en: string, aliases: readonly string[] = []): CatalogConcept => ({
  kind: EMPLEOS_CONCEPT_KIND.category,
  id,
  es,
  en,
  aliases,
});

const jt = (kind: string, id: string, es: string, en: string, aliases: readonly string[]): CatalogConcept => ({
  kind,
  id,
  es,
  en,
  aliases,
  expandTerms: false,
});

export const EMPLEOS_CONCEPT_CATALOG: readonly CatalogConcept[] = [
  cat("oficina", "Administración / Oficina", "Administration / Office", ["office", "admin", "administrativo", "administrative", "secretaria", "secretary", "recepcionista", "receptionist", "asistente administrativo"]),
  cat("atencion-cliente", "Atención al cliente", "Customer service", ["customer support", "servicio al cliente", "cajero", "cajera", "cashier", "call center"]),
  cat("ventas", "Ventas", "Sales", ["vendedor", "vendedora", "salesperson", "sales associate", "cajero", "cajera", "cashier", "retail", "tienda"]),
  cat("marketing", "Marketing / Publicidad", "Marketing / Advertising", ["publicidad", "advertising", "mercadotecnia"]),
  cat("tecnologia", "Tecnología / IT", "Technology / IT", ["tecnologia", "it", "software", "developer", "programador", "programmer", "sistemas"]),
  cat("diseno", "Diseño / Creativo", "Design / Creative", ["diseño", "designer", "diseñador", "graphic design", "creativo"]),
  cat("construccion", "Construcción", "Construction", ["construction", "albañil", "albanil", "mason", "obrero", "laborer", "carpintero", "carpenter", "drywall", "roofer", "techador", "pintor", "painter"]),
  cat("electricidad", "Electricidad", "Electrical", ["electricista", "electrician"]),
  cat("plomeria", "Plomería", "Plumbing", ["plomero", "plumber"]),
  cat("hvac", "HVAC / Aire acondicionado", "HVAC / Air conditioning", ["aire acondicionado", "air conditioning", "calefaccion", "heating"]),
  cat("jardineria", "Jardinería / Landscaping", "Gardening / Landscaping", ["jardinero", "gardener", "landscaper", "landscape", "yard work", "paisajismo"]),
  cat("limpieza", "Limpieza", "Cleaning", ["cleaner", "janitor", "conserje", "housekeeping", "housekeeper", "limpiador", "limpiadora", "custodio", "custodian"]),
  cat("mantenimiento", "Mantenimiento", "Maintenance", ["handyman", "maintenance technician", "tecnico de mantenimiento"]),
  cat("mecanica", "Mecánica / Automotriz", "Mechanic / Automotive", ["mecanico", "mecánico", "mechanic", "automotriz", "automotive", "auto repair", "tecnico automotriz"]),
  cat("manufactura", "Manufactura / Producción", "Manufacturing / Production", ["factory", "fabrica", "operario", "operador de maquina", "production", "assembly", "ensamble"]),
  cat("bodega", "Almacén / Warehouse", "Warehouse", ["almacen", "bodega", "montacargas", "forklift", "stocker", "surtidor", "picker", "packer", "empacador"]),
  cat("logistica", "Logística / Transporte", "Logistics / Transportation", ["logistics", "camionero", "trucker", "truck driver", "despachador", "dispatcher", "freight"]),
  cat("transporte", "Chofer / Delivery", "Driver / Delivery", ["chofer", "driver", "conductor", "repartidor", "delivery driver", "delivery", "rideshare"]),
  cat("restaurante", "Restaurante / Cocina", "Restaurant / Kitchen", ["cocinero", "cocinera", "cook", "line cook", "chef", "cocina", "kitchen", "lavaplatos", "dishwasher", "ayudante de cocina", "prep cook", "food service"]),
  cat("mesero", "Mesero / Bartender", "Server / Bartender", ["mesera", "waiter", "waitress", "server", "cantinero", "bartender", "host", "hostess"]),
  cat("cafeteria", "Cafetería / Panadería", "Cafe / Bakery", ["cafe", "café", "panaderia", "panadería", "bakery", "barista", "baker", "panadero", "coffee"]),
  cat("cuidado-ninos", "Cuidado de niños", "Childcare", ["niñera", "ninera", "nanny", "babysitter", "daycare", "guarderia", "child care"]),
  cat("cuidado-mayores", "Cuidado de personas mayores", "Elder care", ["cuidador", "cuidadora", "caregiver", "senior care", "eldercare", "home health aide"]),
  cat("salud", "Salud / Clínica", "Health / Clinic", ["health", "healthcare", "clinica", "clinic", "enfermera", "enfermero", "nurse", "medical", "medico", "medical assistant"]),
  cat("dental", "Dental", "Dental", ["dentista", "dentist", "dental assistant", "asistente dental", "hygienist"]),
  cat("belleza", "Belleza / Barbería / Estética", "Beauty / Barber / Salon", ["barbero", "barber", "estilista", "stylist", "hair", "peluquero", "peluquera", "salon", "esteticista", "nail tech"]),
  cat("educacion", "Educación / Tutoría", "Education / Tutoring", ["maestro", "maestra", "teacher", "tutor", "teaching", "profesor", "profesora", "school"]),
  cat("fitness", "Entrenamiento / Fitness", "Fitness / Training", ["entrenador", "trainer", "personal trainer", "gym", "gimnasio", "coach"]),
  cat("seguridad", "Seguridad", "Security", ["guardia", "guard", "security guard", "guardia de seguridad", "vigilante"]),
  cat("real-estate", "Real Estate / Propiedades", "Real estate", ["bienes raices", "bienes raíces", "propiedades", "realtor", "agente de bienes raices", "property"]),
  cat("finanzas", "Finanzas / Contabilidad", "Finance / Accounting", ["contador", "contadora", "accountant", "accounting", "bookkeeper", "contabilidad", "finance"]),
  cat("legal", "Legal", "Legal", ["abogado", "abogada", "lawyer", "attorney", "paralegal"]),
  cat("recursos-humanos", "Recursos Humanos", "Human resources", ["hr", "rrhh", "reclutador", "recruiter", "recruiting"]),
  cat("eventos", "Eventos", "Events", ["event staff", "banquetes", "banquet", "coordinador de eventos", "event coordinator"]),
  cat("trabajo-domestico", "Trabajo doméstico", "Domestic work", ["domestic", "empleada domestica", "maid", "housekeeper", "ama de llaves", "limpieza de casas", "house cleaning"]),
  cat("freelance", "Freelance / Contrato", "Freelance / Contract", ["contratista", "contractor", "independiente", "gig"]),
  cat("practicas", "Prácticas / Internship", "Internship", ["internship", "intern", "pasante", "pasantia"]),
  cat("voluntariado", "Voluntariado", "Volunteer", ["volunteer", "voluntario", "voluntaria"]),
  jt("jobType", "tiempo-completo", "Tiempo completo", "Full time", ["full-time", "fulltime", "full time", "tiempo completo", "jornada completa"]),
  jt("jobType", "medio-tiempo", "Medio tiempo", "Part time", ["part-time", "parttime", "part time", "medio tiempo", "tiempo parcial"]),
  jt("jobType", "temporal", "Temporal", "Temporary", ["temp", "temporary", "temporal"]),
  jt("jobType", "por-contrato", "Por contrato", "Contract", ["contract", "contrato", "por contrato"]),
  jt("jobType", "por-temporada", "Por temporada", "Seasonal", ["seasonal", "temporada", "por temporada"]),
  jt("jobType", "por-horas", "Por horas", "Hourly", ["hourly", "por hora", "por horas"]),
  jt("jobType", "fin-de-semana", "Fin de semana", "Weekends", ["weekend", "weekends", "fin de semana", "fines de semana"]),
  jt("jobType", "turno-nocturno", "Turno nocturno", "Night shift", ["night shift", "nocturno", "turno de noche", "overnight"]),
  jt("modality", "remoto", "Remoto", "Remote", ["remote", "work from home", "desde casa", "trabajo remoto", "teletrabajo"]),
  jt("modality", "hibrido", "Híbrido", "Hybrid", ["hybrid", "hibrido"]),
  jt("modality", "presencial", "Presencial", "On-site", ["on site", "onsite", "on-site", "in person", "in-person", "presencial"]),
];

const idsOf = (kind: string) => new Set(EMPLEOS_CONCEPT_CATALOG.filter((c) => c.kind === kind).map((c) => c.id));
const CATEGORY_IDS = idsOf(EMPLEOS_CONCEPT_KIND.category);
const JOB_TYPE_IDS = idsOf(EMPLEOS_CONCEPT_KIND.jobType);
const MODALITY_IDS = idsOf(EMPLEOS_CONCEPT_KIND.modality);

export const empleosDiscoveryAdapter = createCatalogDiscoveryAdapter<EmpleosJobRecord>({
  category: "empleos",
  catalog: EMPLEOS_CONCEPT_CATALOG,
  rowConcepts(j) {
    const out: CanonicalConceptRef[] = [];
    if (CATEGORY_IDS.has(j.category)) out.push({ kind: EMPLEOS_CONCEPT_KIND.category, id: j.category });
    if (JOB_TYPE_IDS.has(j.jobType)) out.push({ kind: EMPLEOS_CONCEPT_KIND.jobType, id: j.jobType });
    if (MODALITY_IDS.has(j.modality)) out.push({ kind: EMPLEOS_CONCEPT_KIND.modality, id: j.modality });
    return out;
  },
  rowLiterals: (j) => [
    j.title,
    j.company,
    j.category,
    j.categoryCustomLabel,
    j.jobType,
    j.modality,
    j.experience,
    j.companyType,
    j.city,
    j.state,
    j.stateRegion,
    j.postalCode,
    j.country,
    j.salaryLabel,
    String(j.salaryMin),
    String(j.salaryMax),
    j.industryFocus,
    j.scheduleLabel,
    j.languagesSpoken,
    j.feriaDateLine,
    j.feriaTimeLine,
    j.feriaVenue,
    j.employerAddressLine,
  ],
  rowCustomText: (j) => [
    j.summary,
    j.description,
    ...(j.requirements ?? []),
    ...(j.benefits ?? []),
    ...(j.benefitChips ?? []),
  ],
});

/** Keyword (`q`) matcher only — category / jobType / modality / location / salary facets stay in `filterEmpleosJobs`. Compile once per call. */
export function empleosKeywordMatcher(rawQ: string): (row: EmpleosJobRecord) => boolean {
  return catalogKeywordMatcher(empleosDiscoveryAdapter, rawQ);
}
