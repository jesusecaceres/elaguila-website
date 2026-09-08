/**
 * Intentional public destinations for Empleos landing CTAs (single source of truth).
 */

/** Job seeker results (filters via query string). I.5.8 — canonical "/resultados"; matches
 * buildEmpleosResultadosUrl and the category route registry. This constant has no live importers
 * today (confirmed), kept in sync so it can't drift back into disagreement if ever wired up. */
export const EMPLEOS_RESULTS_PATH = "/clasificados/empleos/resultados";

/** Category-owned publish entry for the July 1 single job-ad launch path. */
// Gate I.5.2 — canonical publish entry, matches categoryRouteRegistry.ts's empleos adapter.
export const EMPLEOS_PUBLISH_HUB_PATH = "/publicar/empleos";

/** Preserved legacy category chooser path; not promoted from the July 1 Empleos launch surface. */
export const EMPLEOS_BUSINESS_PLANS_PATH = "/clasificados/publicar";

/** Preserved internal job-fair lane; not promoted from the July 1 Empleos launch surface. */
export const EMPLEOS_EVENT_INFO_PATH = "/publicar/empleos/feria";
