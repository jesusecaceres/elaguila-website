/**
 * Internal Servicios listing template routing (Gate 1 foundation).
 * Maps business type / labels to rendering shells — not exposed as a public category.
 */

import type { ServiciosLang } from "@/app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";

export type ServiciosListingTemplate =
  | "standard_service"
  | "legal_provider"
  | "clinic_provider"
  | "financial_provider"
  | "advisor_provider";

export type ResolveServiciosListingTemplateInput = {
  businessTypeId?: string | null;
  internalGroup?: string | null;
  categoryLabel?: string | null;
};

const EXACT_TEMPLATE_BY_BUSINESS_TYPE_ID: Readonly<Record<string, ServiciosListingTemplate>> = {
  abogado_asesoria_legal: "legal_provider",
  terapia_fisica: "clinic_provider",
  salud_mental_psicologia: "clinic_provider",
  nutricion_dietas: "clinic_provider",
  acupuntura: "clinic_provider",
  contador_impuestos: "financial_provider",
  consultoria_negocios: "advisor_provider",
  arquitectura: "advisor_provider",
  recursos_humanos: "advisor_provider",
  notaria: "legal_provider",
};

const LEGAL_KEYWORDS = [
  "abogado",
  "legal",
  "inmigracion",
  "accidente",
  "lesiones",
  "criminal",
  "familia",
  "bancarrota",
  "compensacion",
  "workers_comp",
  "notaria",
  "notario",
] as const;

const CLINIC_KEYWORDS = [
  "dentista",
  "dental",
  "doctor",
  "clinica",
  "medico",
  "medical",
  "terapia",
  "psicologia",
  "chiropractor",
  "quiropractico",
  "ortodoncista",
  "braces",
  "implants",
  "nutricion",
  "acupuntura",
] as const;

const FINANCIAL_KEYWORDS = [
  "contador",
  "impuestos",
  "tax",
  "accounting",
  "accountant",
  "bookkeeping",
  "payroll",
  "itin",
] as const;

const ADVISOR_KEYWORDS = [
  "consultoria_negocios",
  "consultoria de negocios",
  "business consulting",
  "arquitectura",
  "recursos_humanos",
  "recursos humanos",
  "insurance",
  "aseguranza",
  "seguros",
] as const;

/** Templates that use a professional-style listing shell (non-standard). */
const PROFESSIONAL_TEMPLATES: ReadonlySet<ServiciosListingTemplate> = new Set([
  "legal_provider",
  "clinic_provider",
  "financial_provider",
  "advisor_provider",
]);

function normalizeHaystack(value: string | null | undefined): string {
  if (value == null || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return trimmed
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
  } catch {
    return trimmed.toLowerCase();
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Match keyword in haystack without substring false positives (e.g. terapia vs terapeuticos). */
function haystackMatchesKeyword(haystack: string, keyword: string): boolean {
  const k = normalizeHaystack(keyword);
  if (!k || !haystack) return false;
  if (k.includes("_")) return haystack.includes(k);
  const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(k)}(?:[^a-z0-9]|$)`);
  return re.test(haystack);
}

function haystackMatchesAny(haystack: string, keywords: readonly string[]): boolean {
  return keywords.some((kw) => haystackMatchesKeyword(haystack, kw));
}

function buildRoutingHaystack(input: ResolveServiciosListingTemplateInput): string {
  const parts = [
    normalizeHaystack(input.businessTypeId),
    normalizeHaystack(input.internalGroup),
    normalizeHaystack(input.categoryLabel),
  ].filter(Boolean);
  return parts.join(" ");
}

function resolveFromKeywords(haystack: string): ServiciosListingTemplate | null {
  if (!haystack) return null;
  if (haystackMatchesAny(haystack, LEGAL_KEYWORDS)) return "legal_provider";
  if (haystackMatchesAny(haystack, CLINIC_KEYWORDS)) return "clinic_provider";
  if (haystackMatchesAny(haystack, FINANCIAL_KEYWORDS)) return "financial_provider";
  if (haystackMatchesAny(haystack, ADVISOR_KEYWORDS)) return "advisor_provider";
  return null;
}

/**
 * Resolves which internal listing/profile template shell applies.
 * Never throws; unknown inputs default to `standard_service`.
 */
export function resolveServiciosListingTemplate(
  input: ResolveServiciosListingTemplateInput = {},
): ServiciosListingTemplate {
  const businessTypeId = normalizeHaystack(input.businessTypeId);
  if (businessTypeId) {
    const exact = EXACT_TEMPLATE_BY_BUSINESS_TYPE_ID[businessTypeId];
    if (exact) return exact;
  }

  const haystack = buildRoutingHaystack(input);
  const fromKeywords = resolveFromKeywords(haystack);
  if (fromKeywords) return fromKeywords;

  return "standard_service";
}

export function isServiciosProfessionalTemplate(template: ServiciosListingTemplate): boolean {
  return PROFESSIONAL_TEMPLATES.has(template);
}

/** Minimal copy hook for later gates — returns internal template key only (no public UI strings). */
export function resolveServiciosTemplateCopy(
  template: ServiciosListingTemplate,
  _lang: ServiciosLang = "es",
): { template: ServiciosListingTemplate } {
  return { template };
}
