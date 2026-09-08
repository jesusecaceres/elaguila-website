import type { Lang } from "./listingDisplayStatus";

/**
 * Gate I.13A — never surface a raw Supabase/Postgres error string (column names,
 * constraint text, RLS denial detail) to the owner dashboard. Callers should still
 * `console.error` the real error for debugging; this returns only safe, localized,
 * user-facing copy for the visible error banner.
 */
export function dashboardSafeMutationErrorCopy(lang: Lang): string {
  return lang === "es"
    ? "No pudimos completar esta acción. Intenta de nuevo en unos momentos."
    : "We couldn't complete this action. Please try again in a moment.";
}
