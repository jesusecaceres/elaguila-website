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
