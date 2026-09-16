/**
 * Assisted Publishing — ONE reusable intent-preservation contract for the Business Concierge.
 *
 * Root defect this replaces: six Quick Actions on /admin/businesses pointed at the bare
 * `#businesses-inventory` anchor, so the moment staff clicked "Add note" / "Research" / etc. the
 * chosen action was gone — they scrolled to the search box with no memory of why. This module is
 * the single place that (a) names the allowed intents, (b) carries one through the URL
 * (`/admin/businesses?action=<intent>`), and (c) resolves it to the real destination once a
 * business is selected or created. Pure and side-effect free so it is unit-testable with node:assert
 * (this repo has no jest/vitest) and safe to import from server pages, client components and the
 * canvass API route alike.
 *
 * Destinations are the EXISTING section ids on /admin/businesses/[businessId] (`#outreach`,
 * `#discover`, ...) or existing routes — this file introduces no new module, only routing truth.
 */

export const CONCIERGE_ACTIONS = [
  "create_listing",
  "business_profile",
  "note",
  "follow_up",
  "meeting",
  "research",
  "creative_studio",
] as const;

export type ConciergeAction = (typeof CONCIERGE_ACTIONS)[number];

export function normalizeConciergeAction(raw: string | null | undefined): ConciergeAction | null {
  const v = (raw ?? "").trim().toLowerCase();
  return (CONCIERGE_ACTIONS as readonly string[]).includes(v) ? (v as ConciergeAction) : null;
}

/** Bilingual label used by the intent banner and by canvass copy. */
export function conciergeActionLabel(action: ConciergeAction): string {
  switch (action) {
    case "create_listing":
      return "Crear anuncio / perfil para el cliente / Create ad / profile for client";
    case "business_profile":
      return "Perfil de Negocio Leonix / Leonix Business Profile";
    case "note":
      return "Agregar nota / Add note";
    case "follow_up":
      return "Crear seguimiento / Create follow-up";
    case "meeting":
      return "Iniciar reunión / Start meeting";
    case "research":
      return "Investigar / Research";
    case "creative_studio":
      return "Estudio Creativo / Creative Studio";
  }
}

/** Command Center → inventory search, carrying the intent. */
export function buildConciergeInventoryHref(action: ConciergeAction): string {
  return `/admin/businesses?action=${encodeURIComponent(action)}#businesses-inventory`;
}

/**
 * The one resolver: a selected/created business + the carried intent → where staff lands.
 * `create_listing` goes to the Create-for-Client launcher with the business preselected; every
 * other intent lands on the EXISTING section of the business workspace that already owns that
 * work (same anchor ids `BusinessDashboardNav` renders today).
 */
export function resolveConciergeActionDestination(action: ConciergeAction | null, businessId: string): string {
  const base = `/admin/businesses/${businessId}`;
  switch (action) {
    case "create_listing":
      return `/admin/businesses/create-for-client?businessId=${encodeURIComponent(businessId)}`;
    case "business_profile":
      return `${base}#business-profile`;
    case "note":
    case "follow_up":
      return `${base}#outreach`;
    case "meeting":
      return `${base}#meetings`;
    case "research":
      return `${base}#discover`;
    case "creative_studio":
      return `${base}#creative`;
    default:
      return base;
  }
}
