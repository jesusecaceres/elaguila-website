/**
 * Gate BCO-4A / Gate B — deterministic Sales Workspace logic. No AI. Every output here is a pure
 * function of confirmed profile data; nothing here infers a need or guesses a fact. Per the
 * controlling doctrine: staff opinions stay staff notes, owner statements stay owner statements,
 * and a recommendation is never made from absence alone without asking for confirmation first.
 */

export type BusinessSalesStatus =
  | "new"
  | "needs_review"
  | "ready_to_contact"
  | "contacted"
  | "follow_up_due"
  | "waiting_on_owner"
  | "not_a_fit_right_now"
  | "active_client"
  | "archived";

export type SalesNoteType =
  | "call_attempt"
  | "conversation"
  | "follow_up"
  | "owner_request"
  | "missing_information"
  | "concern"
  | "opportunity"
  | "not_a_fit"
  | "internal_note"
  | "other";

export type SalesContactMethod = "phone" | "sms" | "whatsapp" | "email" | "in_person" | "other";
export type SalesNoteOutcome = "reached" | "no_answer" | "left_message" | "scheduled_follow_up" | "not_interested" | "interested" | "other";
export type FollowUpStoredStatus = "scheduled" | "due_today" | "overdue" | "completed" | "cancelled" | "waiting_on_owner";

type LabeledOption<T extends string> = { value: T; es: string; en: string };

export const BUSINESS_SALES_STATUSES: readonly LabeledOption<BusinessSalesStatus>[] = [
  { value: "new", es: "Nuevo", en: "New" },
  { value: "needs_review", es: "Necesita revisión", en: "Needs review" },
  { value: "ready_to_contact", es: "Listo para contactar", en: "Ready to contact" },
  { value: "contacted", es: "Contactado", en: "Contacted" },
  { value: "follow_up_due", es: "Seguimiento pendiente", en: "Follow-up due" },
  { value: "waiting_on_owner", es: "Esperando al dueño", en: "Waiting on owner" },
  { value: "not_a_fit_right_now", es: "No es buen momento", en: "Not a fit right now" },
  { value: "active_client", es: "Cliente activo", en: "Active client" },
  { value: "archived", es: "Archivado", en: "Archived" },
];

export const SALES_NOTE_TYPES: readonly LabeledOption<SalesNoteType>[] = [
  { value: "call_attempt", es: "Intento de llamada", en: "Call attempt" },
  { value: "conversation", es: "Conversación", en: "Conversation" },
  { value: "follow_up", es: "Seguimiento", en: "Follow-up" },
  { value: "owner_request", es: "Solicitud del dueño", en: "Owner request" },
  { value: "missing_information", es: "Información faltante", en: "Missing information" },
  { value: "concern", es: "Inquietud", en: "Concern" },
  { value: "opportunity", es: "Oportunidad", en: "Opportunity" },
  { value: "not_a_fit", es: "No es buen momento", en: "Not a fit" },
  { value: "internal_note", es: "Nota interna", en: "Internal note" },
  { value: "other", es: "Otro", en: "Other" },
];

export const SALES_CONTACT_METHODS: readonly LabeledOption<SalesContactMethod>[] = [
  { value: "phone", es: "Llamada", en: "Call" },
  { value: "sms", es: "SMS", en: "SMS" },
  { value: "whatsapp", es: "WhatsApp", en: "WhatsApp" },
  { value: "email", es: "Correo electrónico", en: "Email" },
  { value: "in_person", es: "En persona", en: "In person" },
  { value: "other", es: "Otro", en: "Other" },
];

export const SALES_NOTE_OUTCOMES: readonly LabeledOption<SalesNoteOutcome>[] = [
  { value: "reached", es: "Se logró contactar", en: "Reached" },
  { value: "no_answer", es: "No contestó", en: "No answer" },
  { value: "left_message", es: "Se dejó mensaje", en: "Left message" },
  { value: "scheduled_follow_up", es: "Se agendó seguimiento", en: "Scheduled follow-up" },
  { value: "not_interested", es: "No interesado", en: "Not interested" },
  { value: "interested", es: "Interesado", en: "Interested" },
  { value: "other", es: "Otro", en: "Other" },
];

export const FOLLOW_UP_STATUSES: readonly LabeledOption<FollowUpStoredStatus>[] = [
  { value: "scheduled", es: "Programado", en: "Scheduled" },
  { value: "due_today", es: "Vence hoy", en: "Due today" },
  { value: "overdue", es: "Atrasado", en: "Overdue" },
  { value: "completed", es: "Completado", en: "Completed" },
  { value: "cancelled", es: "Cancelado", en: "Cancelled" },
  { value: "waiting_on_owner", es: "Esperando al dueño", en: "Waiting on owner" },
];

export function labelFrom<T extends string>(list: readonly LabeledOption<T>[], value: T, lang: "es" | "en"): string {
  return list.find((o) => o.value === value)?.[lang] ?? value;
}

/**
 * `due_today`/`overdue` are never written directly by staff — they're derived here at read time
 * from `scheduled_date` vs the current date, so the status never goes stale waiting on a cron.
 * Terminal statuses (completed/cancelled/waiting_on_owner) always pass through unchanged.
 */
export function deriveFollowUpDisplayStatus(stored: FollowUpStoredStatus, scheduledDateIso: string, todayIso: string): FollowUpStoredStatus {
  if (stored !== "scheduled") return stored;
  if (scheduledDateIso < todayIso) return "overdue";
  if (scheduledDateIso === todayIso) return "due_today";
  return "scheduled";
}

// ---------------------------------------------------------------------------
// Profile completeness — a checklist, never a bare percentage. Every item names exactly what's
// missing and why it's checked; nothing here is a fear-based red score.
// ---------------------------------------------------------------------------

export type ProfileCompletenessInput = {
  business: { displayName: string; broadBusinessType: string | null; businessStage: string | null; updatedAt: string; preferredResponseMethod: string | null };
  authorizationNeedsReview: boolean;
  contacts: readonly { contactType: string; capabilities: readonly string[] }[];
  serviceAreas: readonly { country: string | null; rawText: string }[];
  digitalProfiles: readonly { platform: string }[];
  customLinks: readonly { linkType: string }[];
  listingLinks: readonly { status: string }[];
};

export type CompletenessItemId =
  | "identity_confirmed"
  | "primary_contact_confirmed"
  | "service_area_confirmed"
  | "has_website"
  | "has_whatsapp"
  | "has_google_business"
  | "has_connected_ad"
  | "authorization_reviewed"
  | "recently_updated";

export type CompletenessItem = { id: CompletenessItemId; met: boolean; label: { es: string; en: string } };

const RECENTLY_UPDATED_WINDOW_DAYS = 90;

function hasWebsite(input: ProfileCompletenessInput): boolean {
  return input.contacts.some((c) => c.contactType === "website") || input.customLinks.length > 0;
}
function hasWhatsappNumber(input: ProfileCompletenessInput): boolean {
  return input.contacts.some((c) => c.contactType === "phone" && c.capabilities.includes("whatsapp"));
}
function hasGoogleBusinessLink(input: ProfileCompletenessInput): boolean {
  return input.digitalProfiles.some((p) => p.platform === "google_business");
}
function hasConnectedAd(input: ProfileCompletenessInput): boolean {
  return input.listingLinks.some((l) => l.status === "verified" || l.status === "pending");
}
function isIdentityConfirmed(input: ProfileCompletenessInput): boolean {
  return Boolean(input.business.displayName.trim() && input.business.broadBusinessType && input.business.businessStage);
}
function isServiceAreaConfirmed(input: ProfileCompletenessInput): boolean {
  return input.serviceAreas.some((a) => Boolean(a.country) || a.rawText.trim().length > 0);
}
function isRecentlyUpdated(input: ProfileCompletenessInput, nowMs: number): boolean {
  const updatedMs = new Date(input.business.updatedAt).getTime();
  if (Number.isNaN(updatedMs)) return false;
  return (nowMs - updatedMs) / (1000 * 60 * 60 * 24) <= RECENTLY_UPDATED_WINDOW_DAYS;
}

export function computeProfileCompleteness(
  input: ProfileCompletenessInput,
  nowMs: number = Date.now(),
): { items: readonly CompletenessItem[]; metCount: number; totalCount: number } {
  const items: CompletenessItem[] = [
    { id: "identity_confirmed", met: isIdentityConfirmed(input), label: { es: "Identidad del negocio confirmada", en: "Business identity confirmed" } },
    { id: "primary_contact_confirmed", met: input.contacts.length > 0, label: { es: "Contacto principal confirmado", en: "Primary contact confirmed" } },
    { id: "service_area_confirmed", met: isServiceAreaConfirmed(input), label: { es: "Zona de servicio confirmada", en: "Service area confirmed" } },
    { id: "has_website", met: hasWebsite(input), label: { es: "Sitio web disponible", en: "Website available" } },
    { id: "has_whatsapp", met: hasWhatsappNumber(input), label: { es: "Número de WhatsApp disponible", en: "WhatsApp number available" } },
    { id: "has_google_business", met: hasGoogleBusinessLink(input), label: { es: "Perfil de Google Business vinculado", en: "Google Business Profile linked" } },
    { id: "has_connected_ad", met: hasConnectedAd(input), label: { es: "Anuncio de Leonix conectado", en: "Connected Leonix advertisement" } },
    { id: "authorization_reviewed", met: !input.authorizationNeedsReview, label: { es: "Autorización revisada", en: "Authorization reviewed" } },
    { id: "recently_updated", met: isRecentlyUpdated(input, nowMs), label: { es: "Perfil actualizado recientemente", en: "Profile updated recently" } },
  ];
  return { items, metCount: items.filter((i) => i.met).length, totalCount: items.length };
}

// ---------------------------------------------------------------------------
// "Possible next helpful action" — deterministic, evidence-based, never commission-first. Exactly
// one suggestion is returned, in the priority order the gate specifies; every branch names its
// evidence, what to confirm, and what not to recommend yet.
// ---------------------------------------------------------------------------

export type NextHelpfulActionId =
  | "complete_profile"
  | "confirm_website"
  | "confirm_google_business"
  | "confirm_whatsapp"
  | "confirm_connected_ad"
  | "proceed_to_discovery";

export type NextHelpfulAction = {
  id: NextHelpfulActionId;
  headline: { es: string; en: string };
  evidence: { es: string; en: string };
  whatToConfirm: { es: string; en: string };
  whatNotToRecommendYet: { es: string; en: string };
};

export function computeNextHelpfulAction(input: ProfileCompletenessInput, nowMs: number = Date.now()): NextHelpfulAction {
  const completeness = computeProfileCompleteness(input, nowMs);
  const met = (id: CompletenessItemId) => completeness.items.find((i) => i.id === id)?.met ?? false;
  const coreComplete = met("identity_confirmed") && met("primary_contact_confirmed") && met("service_area_confirmed");
  const whatsappPreferred = input.business.preferredResponseMethod === "whatsapp";

  if (!coreComplete) {
    return {
      id: "complete_profile",
      headline: { es: "Completa la información básica del negocio", en: "Complete missing business information" },
      evidence: { es: "Faltan datos básicos: identidad, contacto principal o zona de servicio.", en: "Core data is missing: identity, primary contact, or service area." },
      whatToConfirm: { es: "Qué información básica falta y quién puede completarla.", en: "Which core fields are missing and who can complete them." },
      whatNotToRecommendYet: { es: "No recomiendes ningún servicio pagado todavía.", en: "Do not recommend any paid service yet." },
    };
  }
  if (!met("has_website")) {
    return {
      id: "confirm_website",
      headline: { es: "Confirma si el negocio ya tiene sitio web", en: "Confirm whether the business already has a website" },
      evidence: { es: "No hay sitio web ni enlace registrado en el perfil.", en: "No website or link is recorded on the profile." },
      whatToConfirm: { es: "Confirma con el dueño si ya tiene un sitio web antes de recomendar uno.", en: "Confirm whether the business already has a website before recommending one." },
      whatNotToRecommendYet: { es: "No asumas que necesita un sitio nuevo sin preguntar primero.", en: "Do not assume a new website is needed without asking first." },
    };
  }
  if (!met("has_google_business")) {
    return {
      id: "confirm_google_business",
      headline: { es: "Pregunta por su Perfil de Google Business", en: "Ask about their Google Business Profile" },
      evidence: { es: "Tiene sitio web, pero no hay un Perfil de Google Business vinculado.", en: "Website exists but no Google Business link is on file." },
      whatToConfirm: { es: "Pregunta si su Perfil de Google Business está activo y actualizado.", en: "Ask whether their Google Business Profile is active and accurate." },
      whatNotToRecommendYet: { es: "No recomiendes crear uno nuevo sin confirmar si ya existe.", en: "Do not recommend creating a new one without confirming whether one already exists." },
    };
  }
  if (whatsappPreferred && !met("has_whatsapp")) {
    return {
      id: "confirm_whatsapp",
      headline: { es: "Confirma el número de WhatsApp", en: "Confirm the WhatsApp number" },
      evidence: { es: "El método de respuesta preferido es WhatsApp, pero ningún teléfono tiene esa capacidad marcada.", en: "WhatsApp is the preferred response method, but no phone is marked WhatsApp-capable." },
      whatToConfirm: { es: "Confirma directamente con el dueño el número correcto de WhatsApp.", en: "Confirm the correct WhatsApp number directly with the owner." },
      whatNotToRecommendYet: { es: "No marques un número como WhatsApp sin confirmarlo.", en: "Do not mark a number as WhatsApp-capable without confirming it." },
    };
  }
  if (!met("has_connected_ad")) {
    return {
      id: "confirm_connected_ad",
      headline: { es: "Pregunta si hay un anuncio existente para conectar", en: "Ask whether an existing advertisement should be connected" },
      evidence: { es: "No hay ningún anuncio de Leonix conectado a este perfil.", en: "No Leonix advertisement is connected to this profile." },
      whatToConfirm: { es: "Pregunta si el negocio ya tiene un anuncio publicado en Leonix.", en: "Ask whether the business already has a listing published on Leonix." },
      whatNotToRecommendYet: { es: "No sugieras publicar un anuncio nuevo sin descartar uno existente primero.", en: "Do not suggest publishing a new ad without ruling out an existing one first." },
    };
  }
  return {
    id: "proceed_to_discovery",
    headline: { es: "Continúa con Business Discovery", en: "Proceed to Business Discovery" },
    evidence: { es: "Lo fundamental del perfil está completo.", en: "Everything foundational is complete." },
    whatToConfirm: { es: "Nada pendiente — continúa con Business Discovery antes de recomendar un servicio pagado.", en: "Nothing pending — proceed to Business Discovery before recommending a paid service." },
    whatNotToRecommendYet: { es: "No recomiendes un servicio pagado por comisión; deja que Business Discovery guíe el siguiente paso.", en: "Do not recommend a paid service on commission — let Business Discovery guide the next step." },
  };
}
