/** TODAY-2 — DIY Concierge bilingual copy. Spanish is the default per the existing product architecture. */

export type ConciergeLang = "es" | "en";

export const DIMENSION_LABELS: Record<string, { es: string; en: string }> = {
  business_foundation: { es: "Fundamento del negocio", en: "Business foundation" },
  customer_clarity: { es: "Claridad sobre los clientes", en: "Customer clarity" },
  offer_and_value: { es: "Oferta y valor", en: "Offer and value" },
  operations_and_capacity: { es: "Operaciones y capacidad", en: "Operations and capacity" },
  visibility_and_discovery: { es: "Visibilidad y descubrimiento", en: "Visibility and discovery" },
  communication_and_follow_up: { es: "Comunicación y seguimiento", en: "Communication and follow-up" },
  owner_goals_and_sustainability: { es: "Metas del dueño y sostenibilidad", en: "Owner goals and sustainability" },
};

export const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  available: { es: "Disponible", en: "Available" },
  in_progress: { es: "En progreso", en: "In progress" },
  awaiting_evidence: { es: "Esperando evidencia", en: "Awaiting evidence" },
  awaiting_owner_confirmation: { es: "Esperando tu confirmación", en: "Awaiting your confirmation" },
  completed: { es: "Completado", en: "Completed" },
  postponed: { es: "Pospuesto", en: "Postponed" },
  blocked: { es: "Bloqueado", en: "Blocked" },
  no_longer_applicable: { es: "Ya no aplica", en: "No longer applicable" },
  cancelled: { es: "Cancelado", en: "Cancelled" },
};

export const BLOCKED_REASON_LABELS: Record<string, { es: string; en: string }> = {
  contradiction_blocked: {
    es: "Hay información contradictoria que Leonix necesita aclarar antes de sugerir una acción aquí.",
    en: "There's contradictory information Leonix needs clarified before suggesting an action here.",
  },
  insufficient_information: {
    es: "Todavía no hay suficiente información confirmada sobre esta área.",
    en: "There isn't enough confirmed information about this area yet.",
  },
  human_review_required: {
    es: "Esta evaluación necesita revisión humana antes de sugerir nuevas acciones.",
    en: "This assessment needs human review before suggesting new actions.",
  },
  capacity_risk: {
    es: "Se identificó un posible riesgo de capacidad; Leonix aún no tiene una acción específica para esto.",
    en: "A possible capacity risk was identified; Leonix doesn't yet have a specific action for this.",
  },
  not_evidenced: {
    es: "Todavía no hay una acción específica del catálogo para este resultado.",
    en: "There isn't a specific catalog action for this result yet.",
  },
};

export const ENTITLEMENT_STATE_LABELS: Record<string, { es: string; en: string }> = {
  public_learning_only: {
    es: "Tienes acceso al Centro de aprendizaje público y al Constructor de ideas.",
    en: "You have access to the public Learning Center and the Idea Builder.",
  },
  quarter_preview: {
    es: "Tu paquete actual (Quarter Page) incluye educación pública y el Constructor de ideas. El Concierge DIY personalizado es parte de los paquetes Half Page en adelante.",
    en: "Your current package (Quarter Page) includes public education and the Idea Builder. The personalized DIY Concierge is part of Half Page packages and above.",
  },
  personalized_access_active: {
    es: "Tu Concierge DIY personalizado está activo para este negocio.",
    en: "Your personalized DIY Concierge is active for this business.",
  },
  pending_entitlement_linkage: {
    es: "Todavía estamos confirmando la conexión entre tu cuenta y tu paquete. Mientras tanto, el Centro de aprendizaje y el Constructor de ideas siguen disponibles.",
    en: "We're still confirming the connection between your account and your package. In the meantime, the Learning Center and Idea Builder remain available.",
  },
  upgrade_available: {
    es: "Puedes explorar los beneficios de un paquete Half Page o superior.",
    en: "You can explore the benefits of a Half Page package or higher.",
  },
  concierge_add_on_available: {
    es: "Puedes solicitar orientación humana pagada (Guíame) para esta acción.",
    en: "You can request paid human guidance (Guide Me) for this action.",
  },
  managed_service_request_available: {
    es: "Puedes solicitar que Leonix se encargue de esto por ti (servicio pagado).",
    en: "You can request that Leonix handle this for you (paid service).",
  },
  temporarily_unavailable: {
    es: "Esta función no está disponible temporalmente.",
    en: "This feature is temporarily unavailable.",
  },
  emergency_disabled: {
    es: "Esta función no está disponible para tu cuenta en este momento.",
    en: "This feature isn't available for your account right now.",
  },
};
