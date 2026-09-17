/**
 * Gate D fix — pure, non-interactive label lookups shared by the Growth Plan server component
 * (GrowthPlanJourney.tsx) and its client action components (GrowthPlanActions.tsx). These were
 * previously defined inside GrowthPlanActions.tsx, which carries a top-level "use client" directive
 * — in Next.js's real RSC bundling (unlike a plain react-dom/server test harness, which does not
 * enforce module boundaries), EVERY export of a "use client" module becomes a client reference when
 * imported into a Server Component, so GrowthPlanJourney.tsx calling providerClassLabel()/
 * roadmapStateLabel() directly (not rendering them as JSX) threw at runtime: "Attempted to call
 * X() from the server but X is on the client." Moving these two pure functions (no hooks, no
 * state, no client-only API) into their own plain module fixes it for both callers.
 */
import type { GrowthProviderClass, GrowthRoadmapStepState } from "@/app/lib/business/growthEngine/types";

const PROVIDER_CLASS_LABEL: Record<GrowthProviderClass, { es: string; en: string }> = {
  leonix_provides: { es: "Leonix puede ayudar", en: "Leonix can help" },
  leonix_coordinates_partner: { es: "Leonix + socio", en: "Leonix + partner" },
  external_professional_required: { es: "Profesional externo", en: "External professional" },
};

export function providerClassLabel(providerClass: GrowthProviderClass): string {
  const l = PROVIDER_CLASS_LABEL[providerClass];
  return `${l.es} / ${l.en}`;
}

const ROADMAP_STATE_LABEL: Record<GrowthRoadmapStepState, { es: string; en: string }> = {
  not_started: { es: "Sin empezar", en: "Upcoming" },
  in_progress: { es: "En curso", en: "Current" },
  needs_client_input: { es: "Requiere info del cliente", en: "Needs Client Input" },
  needs_official_research: { es: "Requiere investigación oficial", en: "Needs Official Research" },
  blocked: { es: "Bloqueado", en: "Blocked" },
  complete: { es: "Completo", en: "Complete" },
  not_applicable: { es: "No aplica", en: "Not Applicable" },
};

export function roadmapStateLabel(state: GrowthRoadmapStepState): string {
  const l = ROADMAP_STATE_LABEL[state];
  return `${l.es} / ${l.en}`;
}

export const ROADMAP_STATE_KEYS = Object.keys(ROADMAP_STATE_LABEL) as GrowthRoadmapStepState[];
