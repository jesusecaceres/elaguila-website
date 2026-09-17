import type {
  HealthConfidence, HealthDimensionKey, HealthDimensionStatus, HealthEvidenceStrength, HealthFindingSeverity,
  HealthFindingType, HealthFreshness, HealthRunTriggerType, RecommendationReadinessStatus,
} from "./types";

export const HEALTH_MAP_FLAG_KEY = "business_health_map";

export const CALCULATION_VERSION = "hm-v1";

export const HEALTH_DIMENSION_KEYS: readonly HealthDimensionKey[] = [
  "business_foundation",
  "customer_clarity",
  "offer_and_value",
  "operations_and_capacity",
  "visibility_and_discovery",
  "communication_and_follow_up",
  "owner_goals_and_sustainability",
];

export type LabeledOption<T extends string> = { value: T; es: string; en: string };

export const HEALTH_DIMENSION_LABELS: readonly LabeledOption<HealthDimensionKey>[] = [
  { value: "business_foundation", es: "Fundamento del negocio", en: "Business foundation" },
  { value: "customer_clarity", es: "Claridad sobre los clientes", en: "Customer clarity" },
  { value: "offer_and_value", es: "Oferta y valor", en: "Offer and value" },
  { value: "operations_and_capacity", es: "Operaciones y capacidad", en: "Operations and capacity" },
  { value: "visibility_and_discovery", es: "Visibilidad y descubrimiento", en: "Visibility and discovery" },
  { value: "communication_and_follow_up", es: "Comunicación y seguimiento", en: "Communication and follow-up" },
  { value: "owner_goals_and_sustainability", es: "Metas del dueño y sostenibilidad", en: "Owner goals and sustainability" },
];

export const HEALTH_DIMENSION_STATUSES: readonly LabeledOption<HealthDimensionStatus>[] = [
  { value: "strong", es: "Fuerte", en: "Strong" },
  { value: "stable", es: "Estable", en: "Stable" },
  { value: "needs_attention", es: "Necesita atención", en: "Needs attention" },
  { value: "insufficient_information", es: "Información insuficiente", en: "Insufficient information" },
  { value: "blocked_by_contradiction", es: "Bloqueado por una contradicción", en: "Blocked by contradiction" },
];

export const HEALTH_CONFIDENCE_LEVELS: readonly LabeledOption<HealthConfidence>[] = [
  { value: "low", es: "Baja", en: "Low" },
  { value: "medium", es: "Media", en: "Medium" },
  { value: "high", es: "Alta", en: "High" },
];

export const HEALTH_EVIDENCE_STRENGTHS: readonly LabeledOption<HealthEvidenceStrength>[] = [
  { value: "none", es: "Ninguna", en: "None" },
  { value: "low", es: "Baja", en: "Low" },
  { value: "medium", es: "Media", en: "Medium" },
  { value: "high", es: "Alta", en: "High" },
];

export const HEALTH_FRESHNESS_VALUES: readonly LabeledOption<HealthFreshness>[] = [
  { value: "fresh", es: "Reciente", en: "Fresh" },
  { value: "aging", es: "Envejeciendo", en: "Aging" },
  { value: "stale", es: "Desactualizado", en: "Stale" },
  { value: "unknown", es: "Desconocido", en: "Unknown" },
];

export const HEALTH_RUN_TRIGGER_TYPES: readonly LabeledOption<HealthRunTriggerType>[] = [
  { value: "staff_requested", es: "Solicitado por el equipo", en: "Staff requested" },
  { value: "owner_requested", es: "Solicitado por el dueño", en: "Owner requested" },
  { value: "discovery_completed", es: "Descubrimiento completado", en: "Discovery completed" },
  { value: "business_record_changed", es: "Registro del negocio cambiado", en: "Business record changed" },
  { value: "system_refresh", es: "Actualización del sistema", en: "System refresh" },
];

export const HEALTH_FINDING_TYPES: readonly LabeledOption<HealthFindingType>[] = [
  { value: "strength", es: "Fortaleza", en: "Strength" },
  { value: "risk", es: "Riesgo", en: "Risk" },
  { value: "gap", es: "Vacío", en: "Gap" },
  { value: "opportunity", es: "Oportunidad", en: "Opportunity" },
  { value: "unknown", es: "Desconocido", en: "Unknown" },
  { value: "contradiction", es: "Contradicción", en: "Contradiction" },
];

export const HEALTH_FINDING_SEVERITIES: readonly LabeledOption<HealthFindingSeverity>[] = [
  { value: "info", es: "Informativo", en: "Info" },
  { value: "low", es: "Baja", en: "Low" },
  { value: "medium", es: "Media", en: "Medium" },
  { value: "high", es: "Alta", en: "High" },
];

export const RECOMMENDATION_READINESS_STATUSES: readonly LabeledOption<RecommendationReadinessStatus>[] = [
  { value: "ready", es: "Listo", en: "Ready" },
  { value: "needs_more_information", es: "Necesita más información", en: "Needs more information" },
  { value: "resolve_contradictions_first", es: "Resolver contradicciones primero", en: "Resolve contradictions first" },
  { value: "capacity_risk", es: "Riesgo de capacidad", en: "Capacity risk" },
  { value: "human_review_required", es: "Requiere revisión humana", en: "Human review required" },
];

export const MAX_SUMMARY_LENGTH = 4000;
export const MAX_EXPLANATION_LENGTH = 4000;
export const MAX_REASON_LENGTH = 2000;
export const MAX_HUMAN_REVIEW_NOTE_LENGTH = 2000;

/** Core dimensions used by the readiness gate's needs_more_information check (business_foundation, customer_clarity, offer_and_value). */
export const CORE_READINESS_DIMENSIONS: readonly HealthDimensionKey[] = ["business_foundation", "customer_clarity", "offer_and_value"];
