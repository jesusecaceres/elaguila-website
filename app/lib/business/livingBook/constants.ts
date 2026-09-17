/**
 * Gate BCO-5A — Living Business Book constants. Follows the same `{ value, es, en }` labeled-option
 * convention as app/lib/business/constants.ts.
 */
import type {
  ConfidenceLevel, ConsentState, ContradictionSeverity, ContradictionType, CorrectionType,
  DiscoveryConsentState, DiscoverySessionType, EvidenceType, FactCategory, FactSensitivity,
  FactVisibility, SourceClass, UnknownPriority,
} from "./types";

export const LIVING_BOOK_FLAG_KEY = "living_business_book";

type LabeledOption<T extends string> = { value: T; es: string; en: string };

export const FACT_CATEGORIES: readonly LabeledOption<FactCategory>[] = [
  { value: "business_and_owner_goals", es: "Negocio y metas del dueño", en: "Business and owner goals" },
  { value: "customers_and_market", es: "Clientes y mercado", en: "Customers and market" },
  { value: "products_and_services", es: "Productos y servicios", en: "Products and services" },
  { value: "operations_and_capacity", es: "Operaciones y capacidad", en: "Operations and capacity" },
  { value: "visibility_and_communication", es: "Visibilidad y comunicación", en: "Visibility and communication" },
  { value: "challenges_and_readiness", es: "Retos y preparación", en: "Challenges and readiness" },
  { value: "other", es: "Otro", en: "Other" },
];

/** Never collapsed into one generic "notes" bucket — each source class carries a distinct trust level. */
export const SOURCE_CLASSES: readonly LabeledOption<SourceClass>[] = [
  { value: "owner_confirmed", es: "Confirmado por el dueño", en: "Owner confirmed" },
  { value: "owner_statement", es: "Declaración del dueño", en: "Owner statement" },
  { value: "staff_observation", es: "Observación del personal", en: "Staff observation" },
  { value: "public_source_observation", es: "Fuente pública", en: "Public source observation" },
  { value: "connected_account_observation", es: "Cuenta conectada", en: "Connected account observation" },
  { value: "leonix_listing_observation", es: "Anuncio de Leonix", en: "Leonix listing observation" },
  { value: "imported_record", es: "Registro importado", en: "Imported record" },
  { value: "ai_inference", es: "Inferencia de IA (no verificado)", en: "AI inference (not verified)" },
  { value: "unknown", es: "Desconocido", en: "Unknown" },
  { value: "system_derived", es: "Derivado del sistema", en: "System derived" },
];

export const CONFIDENCE_LEVELS: readonly LabeledOption<ConfidenceLevel>[] = [
  { value: "low", es: "Baja", en: "Low" },
  { value: "medium", es: "Media", en: "Medium" },
  { value: "high", es: "Alta", en: "High" },
];

export const FACT_VISIBILITIES: readonly LabeledOption<FactVisibility>[] = [
  { value: "owner_and_staff", es: "Dueño y personal", en: "Owner and staff" },
  { value: "staff_only", es: "Solo personal", en: "Staff only" },
];

export const FACT_SENSITIVITIES: readonly LabeledOption<FactSensitivity>[] = [
  { value: "standard", es: "Estándar", en: "Standard" },
  { value: "sensitive", es: "Sensible", en: "Sensitive" },
];

export const EVIDENCE_TYPES: readonly LabeledOption<EvidenceType>[] = [
  { value: "owner_statement", es: "Declaración del dueño", en: "Owner statement" },
  { value: "staff_note", es: "Nota del personal", en: "Staff note" },
  { value: "public_web_page", es: "Página web pública", en: "Public web page" },
  { value: "social_profile", es: "Perfil social", en: "Social profile" },
  { value: "listing_data", es: "Datos de un anuncio", en: "Listing data" },
  { value: "document", es: "Documento", en: "Document" },
  { value: "photo", es: "Foto", en: "Photo" },
  { value: "other", es: "Otro", en: "Other" },
];

export const CONSENT_STATES: readonly LabeledOption<ConsentState>[] = [
  { value: "not_required", es: "No requerido", en: "Not required" },
  { value: "owner_provided", es: "El dueño lo proporcionó", en: "Owner provided" },
  { value: "owner_declined", es: "El dueño lo rechazó", en: "Owner declined" },
  { value: "unknown", es: "Desconocido", en: "Unknown" },
];

export const UNKNOWN_PRIORITIES: readonly LabeledOption<UnknownPriority>[] = [
  { value: "low", es: "Baja", en: "Low" },
  { value: "medium", es: "Media", en: "Medium" },
  { value: "high", es: "Alta", en: "High" },
];

export const CONTRADICTION_TYPES: readonly LabeledOption<ContradictionType>[] = [
  { value: "fact_vs_fact", es: "Hecho contra hecho", en: "Fact vs. fact" },
  { value: "fact_vs_evidence", es: "Hecho contra evidencia", en: "Fact vs. evidence" },
  { value: "evidence_vs_evidence", es: "Evidencia contra evidencia", en: "Evidence vs. evidence" },
  { value: "statement_vs_public_source", es: "Declaración contra fuente pública", en: "Statement vs. public source" },
];

export const CONTRADICTION_SEVERITIES: readonly LabeledOption<ContradictionSeverity>[] = [
  { value: "low", es: "Baja", en: "Low" },
  { value: "medium", es: "Media", en: "Medium" },
  { value: "high", es: "Alta", en: "High" },
];

export const CORRECTION_TYPES: readonly LabeledOption<CorrectionType>[] = [
  { value: "owner_confirms", es: "El dueño confirma", en: "Owner confirms" },
  { value: "owner_corrects", es: "El dueño corrige", en: "Owner corrects" },
  { value: "owner_rejects", es: "El dueño rechaza", en: "Owner rejects" },
  { value: "staff_clarification_request", es: "Personal solicita aclaración", en: "Staff clarification request" },
];

export const DISCOVERY_SESSION_TYPES: readonly LabeledOption<DiscoverySessionType>[] = [
  { value: "owner_questionnaire", es: "Cuestionario del dueño", en: "Owner questionnaire" },
  { value: "staff_interview", es: "Entrevista con el personal", en: "Staff interview" },
  { value: "meeting", es: "Reunión", en: "Meeting" },
  { value: "phone_call", es: "Llamada telefónica", en: "Phone call" },
  { value: "business_review", es: "Revisión del negocio", en: "Business review" },
  { value: "digital_discovery", es: "Descubrimiento digital", en: "Digital discovery" },
];

export const DISCOVERY_CONSENT_STATES: readonly LabeledOption<DiscoveryConsentState>[] = [
  { value: "not_required", es: "No requerido", en: "Not required" },
  { value: "owner_provided", es: "El dueño lo proporcionó", en: "Owner provided" },
  { value: "owner_declined", es: "El dueño lo rechazó", en: "Owner declined" },
  { value: "pending", es: "Pendiente", en: "Pending" },
];

export const MAX_EVIDENCE_CAPTURED_TEXT_LENGTH = 4000;
export const MAX_CORRECTION_EXPLANATION_LENGTH = 2000;
export const MAX_DISCOVERY_SUMMARY_LENGTH = 4000;
export const MAX_DISCOVERY_ANSWER_TEXT_LENGTH = 4000;
