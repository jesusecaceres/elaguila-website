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
import type { RecurringCostClass } from "./platformRegistry";
import type {
  AccessStatus,
  BinaryDecision,
  CmsDecision,
  HasAccountAnswer,
  InfrastructureComplexity,
  OwnershipOwner,
  PlatformDecisionStatus,
  StorageDecision,
  WebsiteArchitectureClass,
} from "./architectureDecisionEngine";
import type { BlueprintStatus, WebsiteBlueprintReadinessState } from "./blueprintEngine";

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

/**
 * Gate 3.1 <part_9_truth_capture_safety> — the exact four plain-language choices an operator is
 * ever asked to pick from while CAPTURING an answer (distinct from truthClassLabel(), which is the
 * DISPLAY label for already-saved data). Phrased as "who said this" rather than a state name, so
 * staff cannot casually misclassify a staff assumption, an old note, or public research as
 * CLIENT_CONFIRMED. Deliberately excludes public_verified/ai_extracted/leonix_recommendation/
 * technical_decision/unknown — those are never operator-chosen at capture time (system/AI/staff
 * catalog provenance, not a live capture choice).
 */
export const TRUTH_CAPTURE_CHOICES: readonly DiscoveryTruthClass[] = ["client_confirmed", "client_preference", "staff_observation", "needs_confirmation"];

const TRUTH_CAPTURE_CHOICE_LABELS: Record<(typeof TRUTH_CAPTURE_CHOICES)[number], BilingualLabel> = {
  client_confirmed: label("El cliente me lo dijo", "Client told me"),
  client_preference: label("Preferencia del cliente", "Client preference"),
  staff_observation: label("Nota / observación del personal", "Staff note / observation"),
  needs_confirmation: label("Necesita confirmación", "Needs confirmation"),
};

export function truthCaptureChoiceLabel(value: DiscoveryTruthClass): BilingualLabel {
  return TRUTH_CAPTURE_CHOICE_LABELS[value] ?? truthClassLabel(value);
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

// ---------------------------------------------------------------------------------------------
// Gate 4 — Website Architecture Review labels (MD <bilingual>). "human labels only, never raw
// enums" applies here exactly as it did to Gate 3's own truth/status enums.
// ---------------------------------------------------------------------------------------------
const ARCHITECTURE_CLASS_LABELS: Record<WebsiteArchitectureClass, BilingualLabel> = {
  RAPID_BUSINESS_SITE: label("Sitio rápido de negocio", "Rapid Business Site"),
  BUSINESS_SITE: label("Sitio de negocio", "Business Site"),
  CUSTOM_PLATFORM: label("Plataforma personalizada", "Custom Platform"),
  PRESERVE_EXISTING_PLATFORM: label("Conservar la plataforma actual", "Preserve Existing Platform"),
};

export function architectureClassLabel(value: WebsiteArchitectureClass): BilingualLabel {
  return ARCHITECTURE_CLASS_LABELS[value];
}

const PLATFORM_DECISION_STATUS_LABELS: Record<PlatformDecisionStatus, BilingualLabel> = {
  required: label("Requerido", "Required"),
  optional: label("Opcional", "Optional"),
  not_needed: label("No se necesita", "Not Needed"),
  preserve_existing: label("Conservar existente", "Preserve Existing"),
};

export function platformDecisionStatusLabel(value: PlatformDecisionStatus): BilingualLabel {
  return PLATFORM_DECISION_STATUS_LABELS[value];
}

const RECURRING_COST_CLASS_LABELS: Record<RecurringCostClass, BilingualLabel> = {
  no_expected_cost: label("Sin costo de proveedor separado esperado", "No expected separate vendor fee"),
  may_have_recurring_cost: label("Puede tener costo recurrente", "May have recurring vendor cost"),
  paid_external_provider: label("Proveedor externo de pago", "Paid external provider"),
  verify_current_pricing: label("Verificar precio actual", "Verify current pricing"),
};

export function recurringCostClassLabel(value: RecurringCostClass): BilingualLabel {
  return RECURRING_COST_CLASS_LABELS[value];
}

const INFRASTRUCTURE_COMPLEXITY_LABELS: Record<InfrastructureComplexity, BilingualLabel> = {
  LOW: label("Baja", "Low"),
  MODERATE: label("Moderada", "Moderate"),
  HIGH: label("Alta", "High"),
  CUSTOM: label("Personalizada", "Custom"),
};

export function infrastructureComplexityLabel(value: InfrastructureComplexity): BilingualLabel {
  return INFRASTRUCTURE_COMPLEXITY_LABELS[value];
}

const BINARY_DECISION_LABELS: Record<BinaryDecision, BilingualLabel> = {
  REQUIRED: label("Requerido", "Required"),
  NOT_NEEDED: label("No se necesita", "Not Needed"),
  NEEDS_REVIEW: label("Requiere revisión", "Needs Review"),
};

export function binaryDecisionLabel(value: BinaryDecision): BilingualLabel {
  return BINARY_DECISION_LABELS[value];
}

const STORAGE_DECISION_LABELS: Record<StorageDecision, BilingualLabel> = {
  REQUIRED: label("Requerido", "Required"),
  NOT_NEEDED: label("No se necesita", "Not Needed"),
  EXTERNAL_EXISTING: label("Proveedor externo existente", "External Existing Provider"),
};

export function storageDecisionLabel(value: StorageDecision): BilingualLabel {
  return STORAGE_DECISION_LABELS[value];
}

const CMS_DECISION_LABELS: Record<CmsDecision, BilingualLabel> = {
  REQUIRED: label("Requerido", "Required"),
  OPTIONAL: label("Opcional", "Optional"),
  NOT_NEEDED: label("No se necesita", "Not Needed"),
  PRESERVE_EXISTING: label("Conservar existente", "Preserve Existing"),
};

export function cmsDecisionLabel(value: CmsDecision): BilingualLabel {
  return CMS_DECISION_LABELS[value];
}

const ACCESS_STATUS_LABELS: Record<AccessStatus, BilingualLabel> = {
  not_requested: label("No solicitado", "Not Requested"),
  needs_access: label("Necesita acceso", "Needs Access"),
  invited: label("Invitado", "Invited"),
  access_confirmed: label("Acceso confirmado", "Access Confirmed"),
  client_action_required: label("Se requiere acción del cliente", "Client Action Required"),
};

export function accessStatusLabel(value: AccessStatus): BilingualLabel {
  return ACCESS_STATUS_LABELS[value];
}

const HAS_ACCOUNT_LABELS: Record<HasAccountAnswer, BilingualLabel> = {
  yes: label("Sí", "Yes"),
  no: label("No", "No"),
  unknown: label("Desconocido", "Unknown"),
};

export function hasAccountLabel(value: HasAccountAnswer): BilingualLabel {
  return HAS_ACCOUNT_LABELS[value];
}

const OWNERSHIP_OWNER_LABELS: Record<OwnershipOwner, BilingualLabel> = {
  client: label("Cliente", "Client"),
  leonix_managed: label("Administrado por Leonix", "Leonix-Managed"),
  shared: label("Compartido", "Shared"),
  unknown: label("Desconocido", "Unknown"),
};

export function ownershipOwnerLabel(value: OwnershipOwner): BilingualLabel {
  return OWNERSHIP_OWNER_LABELS[value];
}

// ---------------------------------------------------------------------------------------------
// Gate 5 — blueprint versioning/readiness labels + the exact bilingual phrase pairs the mission
// requires verbatim, defined once here so the review UI and any future surface never re-phrase them.
// ---------------------------------------------------------------------------------------------
const BLUEPRINT_STATUS_LABELS: Record<BlueprintStatus, BilingualLabel> = {
  draft: label("Borrador", "Draft"),
  internal_review: label("Revisión interna", "Internal Review"),
  client_confirmation_needed: label("Se requiere confirmación del cliente", "Client Confirmation Needed"),
  approved_for_build: label("Aprobado para construcción", "Approved for Build"),
  superseded: label("Reemplazado por una versión nueva", "Superseded"),
};

export function blueprintStatusLabel(value: BlueprintStatus): BilingualLabel {
  return BLUEPRINT_STATUS_LABELS[value];
}

const BLUEPRINT_READINESS_STATE_LABELS: Record<WebsiteBlueprintReadinessState, BilingualLabel> = {
  READY: label("Listo para generar", "Ready to Generate"),
  NOT_READY: label("No listo", "Not Ready"),
  NEEDS_LEONIX_DECISION: label("Requiere decisión de Leonix", "Needs Leonix Decision"),
  COMMERCIAL_REVIEW_REQUIRED: label("Requiere revisión comercial", "Commercial Review Required"),
};

export function blueprintReadinessStateLabel(value: WebsiteBlueprintReadinessState): BilingualLabel {
  return BLUEPRINT_READINESS_STATE_LABELS[value];
}

/** The exact EN/ES phrase pairs the Gate 5 mission requires verbatim, in one place. */
export const BLUEPRINT_UI_PHRASES = {
  projectBlueprint: label("Plan del proyecto", "Project Blueprint"),
  readyToGenerate: label("Listo para generar", "Ready to Generate"),
  generateBlueprint: label("Generar plan del proyecto", "Generate Blueprint"),
  draft: label("Borrador", "Draft"),
  approvedForBuild: label("Aprobado para construcción", "Approved for Build"),
  blueprintMayBeStale: label("El plan del proyecto puede estar desactualizado", "Blueprint May Be Stale"),
  createWebsiteProject: label("Crear proyecto de sitio web", "Create Website Project"),
  clientConfirmationNeeded: label("Se requiere confirmación del cliente", "Client Confirmation Needed"),
  buildDependencies: label("Dependencias de construcción", "Build Dependencies"),
} as const satisfies Record<string, BilingualLabel>;
