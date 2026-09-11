/**
 * Shared client-safe humanizer for the internal denial-reason codes returned by
 * businessWorkspaceAccess.ts (SalesWorkspaceDenialReason / StaffWriteDenialReason) and the
 * handful of module-local equivalents (e.g. Promise Keeper's owner_bootstrap_cannot_write_*).
 * The server routes keep returning the raw code in JSON (diagnostics/tests rely on the exact
 * string — see scripts/verify-business-concierge-actor-safety-01.ts), but no staff-facing UI
 * should ever render that code verbatim. Unknown codes fall back to the caller's own message
 * rather than leaking an unrecognized internal string.
 */
const STAFF_WRITE_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  bootstrap_write_denied:
    "Tu sesión actual es acceso de respaldo del propietario y no puede guardar cambios de Business Concierge. Inicia sesión con tu cuenta de equipo real. / Your current session is owner backup access and cannot save Business Concierge changes. Sign in with your real team account.",
  staff_identity_incomplete:
    "Tu cuenta de equipo no está completamente vinculada. Contacta a un administrador. / Your team account is not fully linked. Contact an admin.",
  no_admin_cookie: "Tu sesión expiró. Inicia sesión de nuevo. / Your session expired. Sign in again.",
  bootstrap_session_not_allowed: "Tu sesión expiró. Inicia sesión de nuevo. / Your session expired. Sign in again.",
  no_operator_identity: "Tu sesión expiró. Inicia sesión de nuevo. / Your session expired. Sign in again.",
  auth_user_not_found: "Tu sesión ya no es válida. Inicia sesión de nuevo. / Your session is no longer valid. Sign in again.",
  identity_mismatch: "Tu sesión ya no es válida. Inicia sesión de nuevo. / Your session is no longer valid. Sign in again.",
  roster_not_found:
    "Tu cuenta no está autorizada para el equipo de Leonix. Contacta a un administrador. / Your account is not authorized for the Leonix team. Contact an admin.",
  roster_inactive: "Tu cuenta de equipo está inactiva. Contacta a un administrador. / Your team account is inactive. Contact an admin.",
  role_not_permitted: "Tu rol no tiene permiso para esta acción. / Your role does not have permission for this action.",
  owner_bootstrap_cannot_write_follow_ups:
    "Se requiere una asignación de personal para programar el seguimiento. / A staff roster assignment is required to schedule follow-up.",
  staff_roster_required:
    "Se requiere una asignación de personal para registrar esta decisión. / A staff roster assignment is required to record this decision.",
  rate_limited:
    "El análisis está muy solicitado en este momento. Intenta de nuevo en un minuto. / Analysis is in high demand right now. Try again in a minute.",
  client_blockers_remain:
    "Aún faltan respuestas requeridas del cliente antes de construir. Resuelva las preguntas pendientes antes de marcar Listo para el Plan del Proyecto. / Required client answers are still missing before build. Resolve the outstanding questions before marking Ready for Blueprint.",
  leonix_decision_remains:
    "Quedan decisiones de arquitectura de Leonix pendientes. Resuélvalas en Decisiones de Leonix antes de marcar Listo para el Plan del Proyecto. / Leonix architecture decisions are still outstanding. Resolve them in Leonix Decisions before marking Ready for Blueprint.",
  context_unavailable:
    "No se pudo verificar la preparación en este momento. Intenta de nuevo. / Readiness could not be verified right now. Try again.",
  invalid_transition:
    "Esta acción no es válida en el estado actual del plan del proyecto. Actualiza la página e intenta de nuevo. / This action isn't valid in the blueprint's current state. Refresh the page and try again.",
  not_approved:
    "El plan del proyecto debe estar Aprobado para Construcción antes de crear el proyecto. / The blueprint must be Approved for Build before creating the project.",
  supersedes_wrong_intent:
    "No se pudo vincular la nueva versión con la anterior. Actualiza la página e intenta de nuevo. / Could not link the new version to the previous one. Refresh the page and try again.",
  handoff_items_pending:
    "Todavía hay elementos de la lista de entrega sin completar. Márquelos como completos o no aplicables antes de finalizar la entrega. / Handoff checklist items are still pending. Mark them complete or not applicable before completing handoff.",
  snapshot_failed:
    "No se pudo generar la lista de verificación. Intenta de nuevo. / Could not generate the checklist. Try again.",
  invalid_campaign_dates:
    "La fecha de inicio o fin de la campaña no es válida. Corrígela en el descubrimiento (formato AAAA-MM-DD) antes de crear la campaña. / The campaign start or end date is not valid. Fix it in discovery (YYYY-MM-DD format) before creating the campaign.",
  stale_acknowledgement_required:
    "El plan puede estar desactualizado. Un revisor debe confirmar que se liberará contra la versión aprobada, o generar una nueva versión. / The blueprint may be stale. A reviewer must acknowledge releasing against the approved version, or generate a new version.",
  client_confirmation_missing:
    "Se requiere confirmación del cliente antes de continuar. / Client confirmation is required before continuing.",
};

/**
 * Returns a bilingual, staff-readable message for a known denial/failure code, or `fallback`
 * when the code is missing or not one of the recognized internal auth codes (e.g. a domain error
 * like "duplicate_business_warning" that a caller already handles separately, or a genuinely
 * unexpected string that should never be shown raw).
 */
export function humanizeStaffWriteError(code: string | null | undefined, fallback: string): string {
  if (!code) return fallback;
  return STAFF_WRITE_ERROR_MESSAGES[code] ?? fallback;
}
