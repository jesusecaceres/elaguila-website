/**
 * Client Discovery & Project Blueprint Engine, Gate 3 — human-facing bilingual labels for every
 * internal enum this workspace touches (MD <truth_ui>: "human labels only, never raw enums").
 * Pure, no "server-only" marker — used by server components, client components, and tests alike.
 */
import type { WebsiteDiscoverySection } from "./websiteDiscoveryCatalog";
import type {
  DiscoveryCompletenessClass,
  DiscoveryConsentMethod,
  DiscoveryConsentState,
  DiscoveryConsentType,
  DiscoveryItemConfirmationState,
  DiscoveryTruthClass,
  ProjectDiscoveryIntentStatus,
  ProjectDiscoveryStatus,
  ProjectType,
} from "./types";
import type { WebsiteReadinessState, WebsiteScopeClassCandidate } from "./websiteDiscoveryLogic";
import type { ScopeSignalReason } from "./websiteDiscoveryCatalog";

export interface BilingualLabel {
  es: string;
  en: string;
}

function label(es: string, en: string): BilingualLabel {
  return { es, en };
}

export function formatBilingual(l: BilingualLabel): string {
  return `${l.es} / ${l.en}`;
}

// ---------------------------------------------------------------------------------------------
// Truth classes — "human labels only, never raw enums." AI_EXTRACTED must never read as
// equivalent to CLIENT_CONFIRMED (MD <truth_ui>).
// ---------------------------------------------------------------------------------------------
const TRUTH_CLASS_LABELS: Record<DiscoveryTruthClass, BilingualLabel> = {
  client_confirmed: label("Confirmado por el cliente", "Client confirmed"),
  public_verified: label("Información pública verificada", "Public information"),
  staff_observation: label("Observación del personal", "Staff observation"),
  ai_extracted: label("Extraído por IA — necesita revisión", "AI-extracted — needs review"),
  needs_confirmation: label("Necesita confirmación", "Needs confirmation"),
  unknown: label("Desconocido", "Unknown"),
  client_preference: label("Preferencia del cliente", "Client preference"),
  leonix_recommendation: label("Recomendación de Leonix", "Leonix recommendation"),
  technical_decision: label("Decisión técnica", "Technical decision"),
};

export function truthClassLabel(value: DiscoveryTruthClass): BilingualLabel {
  return TRUTH_CLASS_LABELS[value];
}

/** AI_EXTRACTED and STAFF_OBSERVATION must never render with the same visual weight as CLIENT_CONFIRMED. */
export function truthClassIsProvisional(value: DiscoveryTruthClass): boolean {
  return value === "ai_extracted" || value === "staff_observation" || value === "needs_confirmation" || value === "unknown";
}

const COMPLETENESS_CLASS_LABELS: Record<DiscoveryCompletenessClass, BilingualLabel> = {
  required_before_build: label("Requerido antes de construir", "Required before build"),
  required_before_launch: label("Requerido antes de lanzar", "Required before launch"),
  helpful: label("Útil", "Helpful"),
  optional: label("Opcional", "Optional"),
  not_applicable: label("No aplica", "Not applicable"),
  needs_leonix_decision: label("Requiere decisión de Leonix", "Needs Leonix decision"),
  needs_official_research: label("Requiere investigación oficial", "Needs official research"),
};

export function completenessClassLabel(value: DiscoveryCompletenessClass): BilingualLabel {
  return COMPLETENESS_CLASS_LABELS[value];
}

const CONFIRMATION_STATE_LABELS: Record<DiscoveryItemConfirmationState, BilingualLabel> = {
  unconfirmed: label("Sin confirmar", "Unconfirmed"),
  confirmed: label("Confirmado", "Confirmed"),
  rejected: label("Rechazado", "Rejected"),
};

export function confirmationStateLabel(value: DiscoveryItemConfirmationState): BilingualLabel {
  return CONFIRMATION_STATE_LABELS[value];
}

const DISCOVERY_STATUS_LABELS: Record<ProjectDiscoveryStatus, BilingualLabel> = {
  in_progress: label("En progreso", "In progress"),
  needs_client_information: label("Falta información del cliente", "Needs Client Information"),
  needs_leonix_decision: label("Requiere decisión de Leonix", "Needs Leonix Decision"),
  ready_for_blueprint: label("Listo para el plan del proyecto", "Ready for Blueprint"),
  blueprint_created: label("Plan del proyecto creado", "Blueprint created"),
};

export function discoveryStatusLabel(value: ProjectDiscoveryStatus): BilingualLabel {
  return DISCOVERY_STATUS_LABELS[value];
}

const INTENT_STATUS_LABELS: Record<ProjectDiscoveryIntentStatus, BilingualLabel> = {
  candidate: label("Candidato", "Candidate"),
  confirmed: label("Confirmado", "Confirmed"),
  declined: label("Rechazado", "Declined"),
  converted_to_project: label("Convertido en proyecto", "Converted to project"),
};

export function intentStatusLabel(value: ProjectDiscoveryIntentStatus): BilingualLabel {
  return INTENT_STATUS_LABELS[value];
}

const READINESS_LABELS: Record<WebsiteReadinessState, BilingualLabel> = {
  READY: label("Listo", "Ready"),
  READY_WITH_NON_BLOCKING_GAPS: label("Listo, con vacíos que no bloquean", "Ready, with non-blocking gaps"),
  NOT_READY: label("Aún no listo", "Not ready yet"),
  NEEDS_LEONIX_ARCHITECTURE_DECISION: label("Requiere decisión de arquitectura de Leonix", "Needs Leonix architecture decision"),
};

export function readinessStateLabel(value: WebsiteReadinessState): BilingualLabel {
  return READINESS_LABELS[value];
}

const SCOPE_CANDIDATE_LABELS: Record<WebsiteScopeClassCandidate, BilingualLabel> = {
  rapid_business_site: label("Sitio rápido de negocio", "Rapid business site"),
  business_site: label("Sitio de negocio estándar", "Standard business site"),
  custom_platform: label("Posible alcance de plataforma personalizada", "Possible custom platform scope"),
};

export function scopeCandidateLabel(value: WebsiteScopeClassCandidate): BilingualLabel {
  return SCOPE_CANDIDATE_LABELS[value];
}

const SCOPE_SIGNAL_REASON_LABELS: Record<ScopeSignalReason, BilingualLabel> = {
  user_authentication: label("Cuentas de usuario", "User accounts"),
  customer_dashboard: label("Panel de cliente", "Customer dashboard"),
  native_marketplace: label("Mercado nativo", "Native marketplace"),
  complex_database: label("Base de datos compleja", "Complex database"),
  stored_customer_history: label("Historial de cliente almacenado", "Stored customer records"),
  native_workflow_state: label("Flujo de trabajo personalizado", "Custom workflow"),
  custom_checkout: label("Pago (checkout) personalizado", "Complex checkout"),
  significant_uploads: label("Cargas de archivos significativas", "Significant file uploads"),
  proprietary_messaging: label("Mensajería propia", "Proprietary messaging"),
  scheduling_engine: label("Motor de citas/reservas", "Scheduling engine"),
  significant_integrations: label("Integraciones significativas", "Significant integrations"),
  regulated_sensitive_data: label("Datos sensibles regulados", "Regulated / sensitive data"),
  native_mobile_app: label("Aplicación móvil nativa", "Native mobile app"),
};

export function scopeSignalReasonLabel(value: ScopeSignalReason): BilingualLabel {
  return SCOPE_SIGNAL_REASON_LABELS[value];
}

const CONSENT_TYPE_LABELS: Record<DiscoveryConsentType, BilingualLabel> = {
  notes: label("Notas", "Notes"),
  audio_recording: label("Grabación de la reunión", "Meeting recording"),
  transcription: label("Transcripción", "Transcription"),
  file_photo_review: label("Revisión de archivos/fotos", "File/photo review"),
  followup_messages: label("Mensajes de seguimiento", "Follow-up messages"),
};

export function consentTypeLabel(value: DiscoveryConsentType): BilingualLabel {
  return CONSENT_TYPE_LABELS[value];
}

const CONSENT_STATE_LABELS: Record<DiscoveryConsentState, BilingualLabel> = {
  provided: label("Otorgado", "Provided"),
  declined: label("Rechazado", "Declined"),
  withdrawn: label("Retirado", "Withdrawn"),
};

export function consentStateLabel(value: DiscoveryConsentState): BilingualLabel {
  return CONSENT_STATE_LABELS[value];
}

const CONSENT_METHOD_LABELS: Record<DiscoveryConsentMethod, BilingualLabel> = {
  verbal: label("Verbal", "Verbal"),
  written: label("Por escrito", "Written"),
  digital_acknowledgment: label("Confirmación digital", "Digital acknowledgment"),
};

export function consentMethodLabel(value: DiscoveryConsentMethod): BilingualLabel {
  return CONSENT_METHOD_LABELS[value];
}

const PROJECT_TYPE_LABELS: Record<ProjectType, BilingualLabel> = {
  website: label("Sitio web", "Website"),
  website_improvement: label("Mejora de sitio web", "Website improvement"),
  landing_page: label("Página de aterrizaje", "Landing page"),
  logo_brand_identity: label("Logo / identidad de marca", "Logo / brand identity"),
  business_cards: label("Tarjetas de presentación", "Business cards"),
  flyer: label("Volante", "Flyer"),
  banner_signage: label("Pancarta / señalización", "Banner / signage"),
  promotional_products: label("Productos promocionales", "Promotional products"),
  campaign_creative: label("Creativo de campaña", "Campaign creative"),
  sponsored_editorial: label("Editorial patrocinado", "Sponsored editorial"),
  media_exposure_campaign: label("Campaña de exposición en medios", "Media exposure campaign"),
  social_setup_cleanup: label("Configuración / limpieza de redes sociales", "Social setup / cleanup"),
  google_business_profile_support: label("Soporte de Perfil de Negocio de Google", "Google Business Profile support"),
  referral_materials: label("Materiales de referidos", "Referral materials"),
  launch_package_multi_project: label("Paquete de lanzamiento (multi-proyecto)", "Launch package (multi-project)"),
  custom_platform_software: label("Plataforma / software personalizado", "Custom platform / software"),
  other: label("Otro", "Other"),
};

export function projectTypeLabel(value: ProjectType): BilingualLabel {
  return PROJECT_TYPE_LABELS[value];
}

// ---------------------------------------------------------------------------------------------
// Sections Review grouping (MD <sections_review>: "may group sensibly — not literally 27
// top-level accordions"). Every one of the 27 WebsiteDiscoverySection values appears in exactly
// one group.
// ---------------------------------------------------------------------------------------------
export type SectionReviewGroupKey =
  | "business_goal" | "audience_offers" | "brand_visual" | "content_media" | "website_features"
  | "domain_ownership" | "operations" | "seo_analytics" | "accessibility_languages" | "legal_research" | "timeline";

export const SECTION_REVIEW_GROUPS: readonly { key: SectionReviewGroupKey; label: BilingualLabel; sections: readonly WebsiteDiscoverySection[] }[] = [
  { key: "business_goal", label: label("Negocio y objetivo", "Business & Goal"), sections: ["business_identity", "website_objective"] },
  { key: "audience_offers", label: label("Audiencia y ofertas", "Audience & Offers"), sections: ["audience", "offers_services_products"] },
  { key: "brand_visual", label: label("Marca y referencias visuales", "Brand & Visual References"), sections: ["brand_identity", "visual_references"] },
  { key: "content_media", label: label("Contenido y medios", "Content & Media"), sections: ["content", "media_assets"] },
  {
    key: "website_features", label: label("Funciones del sitio web", "Website Features"),
    sections: ["page_architecture", "primary_cta", "forms", "booking_scheduling", "payments_commerce", "cms", "backend_database_auth", "scope"],
  },
  { key: "domain_ownership", label: label("Dominio y propiedad", "Domain & Ownership"), sections: ["domain", "hosting_deployment", "ownership_billing"] },
  { key: "operations", label: label("Operaciones", "Operations"), sections: ["social_presence", "maintenance"] },
  { key: "seo_analytics", label: label("SEO y analítica", "SEO & Analytics"), sections: ["seo", "analytics"] },
  { key: "accessibility_languages", label: label("Accesibilidad e idiomas", "Accessibility & Languages"), sections: ["accessibility", "languages"] },
  { key: "legal_research", label: label("Legal e investigación oficial", "Legal & Official Research"), sections: ["privacy_legal"] },
  { key: "timeline", label: label("Cronograma", "Timeline"), sections: ["schedule_approvals"] },
];

export function sectionReviewGroupForSection(section: WebsiteDiscoverySection): SectionReviewGroupKey {
  const found = SECTION_REVIEW_GROUPS.find((g) => g.sections.includes(section));
  return found ? found.key : "website_features";
}
