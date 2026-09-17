/**
 * Business Development & Growth Engine, Gate D — the ONE canonical solution-execution mapping (MD
 * Part 4). Extracted from what was inline regex logic duplicated only in GrowthPlanJourney.tsx's
 * SolutionExecutionActions (Gate C) into a single, shared, testable module — every UI/route that
 * needs to decide "where does this solution's real work happen" imports this, rather than
 * re-guessing from category/title text a second time.
 *
 * Deliberately has no "server-only" marker: pure classification logic, no secret/DB/network call —
 * mirrors the aiResearch/briefingSynthesis.ts precedent already used for schema.ts/modelRouting.ts
 * elsewhere in this domain.
 */
import type { GrowthProviderClass } from "./types";

export type GrowthExecutionRoute =
  | "creative_logo"
  | "creative_website"
  | "creative_ad"
  | "creative_sponsored_editorial"
  | "official_requirement"
  | "external_professional"
  | "promotional_material"
  | "partner_coordination";

export type GrowthExecutionRouteInfo = {
  route: GrowthExecutionRoute;
  labelEs: string;
  labelEn: string;
};

const ROUTE_LABELS: Record<GrowthExecutionRoute, { es: string; en: string }> = {
  creative_logo: { es: "Proyecto de logo (Creative Studio)", en: "Logo project (Creative Studio)" },
  creative_website: { es: "Proyecto de sitio web (Creative Studio)", en: "Website project (Creative Studio)" },
  creative_ad: { es: "Creativo de campaña (Creative Studio)", en: "Campaign creative (Creative Studio)" },
  creative_sponsored_editorial: { es: "Editorial patrocinado (Creative Studio)", en: "Sponsored editorial (Creative Studio)" },
  official_requirement: { es: "Investigación de requisito oficial", en: "Official requirement research" },
  external_professional: { es: "Profesional externo requerido", en: "External professional required" },
  promotional_material: { es: "Pedido de Promocionales", en: "Promocionales order" },
  partner_coordination: { es: "Coordinación con socio", en: "Partner coordination" },
};

/**
 * MD Part 4's canonical mapping, in priority order:
 *   LOGO / WEBSITE / ADVERTISEMENT / SPONSORED EDITORIAL -> Creative Studio lane
 *   (legal/licensing/tax/regulatory text, regardless of provider_class) -> Growth Official
 *     Requirements Research — a legal *question* is always a research question first, even if the
 *     eventual answer is "hire an attorney".
 *   provider_class === external_professional_required (and NOT a legal/licensing text match) ->
 *     EXTERNAL PROFESSIONAL — an explicit external-action representation (a commitment), never
 *     routed into Creative Studio as if Leonix were the provider.
 *   promotional/physical-collateral text (business cards, flyers, banners, signage, promotional
 *     products, print collateral) -> PROMOTIONAL MATERIAL. No canonical Promocionales
 *     order/fulfillment system exists in this worktree (confirmed by source search) and Creative
 *     Studio's CreativeAssetType has no physical-collateral value — per MD Part 4, this is
 *     therefore the smallest truthful handoff: a Promise Keeper commitment stating the order
 *     requires external/Leonix Promocionales fulfillment, never a fabricated Creative Studio job.
 *   partner/coordination text (radio, photography, printing partner, specialty production) or
 *     provider_class === leonix_coordinates_partner -> PARTNER COORDINATION (a commitment).
 *   default -> creative_ad (Leonix's general creative bucket — matches Gate C's own prior default).
 */
export function classifyGrowthSolutionExecutionRoute(solution: {
  category: string;
  titleEn: string;
  providerClass: GrowthProviderClass;
}): GrowthExecutionRouteInfo {
  const text = `${solution.category} ${solution.titleEn}`.toLowerCase();

  const isLegal = /legal|licens|regulat|\btax\b|permit/i.test(text);
  const isPromotionalMaterial = /business card|flyer|banner|signage|promotional product|print collateral|promotional material/i.test(text);
  const isPartner = /\bradio\b|photograph|printing partner|specialty production/i.test(text);
  const isLogo = /logo|brand identity/i.test(text);
  const isWebsite = /website|web site|domain/i.test(text);
  const isEditorial = /editorial|sponsored feature/i.test(text);

  let route: GrowthExecutionRoute;
  if (isLegal) {
    route = "official_requirement";
  } else if (solution.providerClass === "external_professional_required") {
    route = "external_professional";
  } else if (isPromotionalMaterial) {
    route = "promotional_material";
  } else if (isPartner || solution.providerClass === "leonix_coordinates_partner") {
    route = "partner_coordination";
  } else if (isLogo) {
    route = "creative_logo";
  } else if (isWebsite) {
    route = "creative_website";
  } else if (isEditorial) {
    route = "creative_sponsored_editorial";
  } else {
    route = "creative_ad";
  }

  return { route, labelEs: ROUTE_LABELS[route].es, labelEn: ROUTE_LABELS[route].en };
}

/** True for every route that must never open a Creative Studio job (MD Part 4's explicit rule). */
export function growthExecutionRouteIsCreativeStudio(route: GrowthExecutionRoute): boolean {
  return route === "creative_logo" || route === "creative_website" || route === "creative_ad" || route === "creative_sponsored_editorial";
}

/**
 * Full documented mapping for MD Part 4's own reference table — CAMPAIGN, FOLLOW-UP, COMMITMENT,
 * and CANONICAL OPPORTUNITY are deliberately not part of classifyGrowthSolutionExecutionRoute:
 * they are not category-driven classifications of a solution's nature, they are always-available
 * actions an operator can take on any solution (Campaign Builder, "Create Follow-up", "Create
 * Commitment") or an already-separate read-only domain (Opportunities) — see
 * GrowthPlanJourney.tsx / GrowthPlanActions.tsx (Gate C/D) for where each is actually wired.
 */
export const GROWTH_SOLUTION_EXECUTION_MATRIX_REFERENCE = {
  logo: "creative_studio_logo_lane",
  website: "creative_studio_website_lane",
  advertisement: "creative_studio_ad_lane",
  sponsored_editorial: "creative_studio_sponsored_editorial_lane",
  campaign: "growth_campaign",
  follow_up: "outreach_follow_up",
  commitment: "promise_keeper",
  official_requirement: "growth_official_requirements_research",
  canonical_opportunity: "opportunity_domain",
  partner_action: "promise_keeper_partner_coordination",
  external_professional: "promise_keeper_external_professional_action",
  promotional_material: "promise_keeper_promocionales_handoff",
} as const;
