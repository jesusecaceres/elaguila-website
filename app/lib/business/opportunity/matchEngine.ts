/**
 * Package B, Gate 4 — deterministic, explainable opportunity match engine.
 *
 * Pure functions, no I/O, no AI provider call — matches the healthMap/logic.ts and
 * stewardship/logic.ts convention ("deliberately NOT server-only so it is directly
 * unit-testable"). Every match carries human-readable ES/EN reasons; confidence is secondary and
 * never replaces the reasons. If AI-assisted opportunity wording is added later, it must remain
 * advisory and grounded in these structured reasons — never a source of new facts.
 */
import type { BroadBusinessType } from "@/app/lib/business/types";
import type { EditorialOpportunitySource } from "./editorialSource";
import type { OpportunityMatchReason } from "./types";

export interface OpportunityMatchBusinessInput {
  broadBusinessType: BroadBusinessType | null;
  primaryCity: string | null;
}

export interface OpportunityMatchCandidate {
  source: EditorialOpportunitySource;
  matchReasons: readonly OpportunityMatchReason[];
  confidence: "low" | "medium" | "high";
}

function categoryReason(matched: boolean, category: BroadBusinessType | null): OpportunityMatchReason | null {
  if (!matched || !category) return null;
  return {
    category: "category_match",
    explanationEs: `El negocio pertenece a la categoría "${category}", que coincide con las categorías sugeridas para este contenido.`,
    explanationEn: `The business belongs to the "${category}" category, which matches this content's suggested categories.`,
  };
}

function geographyReason(matched: boolean, city: string | null): OpportunityMatchReason | null {
  if (!matched || !city) return null;
  return {
    category: "geography_match",
    explanationEs: `El negocio sirve a ${city}, dentro del área geográfica relevante para este contenido.`,
    explanationEn: `The business serves ${city}, within the relevant geographic area for this content.`,
  };
}

function editorialThemeReason(source: EditorialOpportunitySource): OpportunityMatchReason {
  return {
    category: "editorial_theme_match",
    explanationEs: `El tema editorial "${source.themeEs}" encaja naturalmente con el tipo de negocio.`,
    explanationEn: `The editorial theme "${source.themeEn}" naturally fits this type of business.`,
  };
}

/**
 * Evaluates one business against one editorial/campaign source. Returns null when there is no
 * category match at all — category match is the required baseline signal; geography only adds
 * confidence, it never substitutes for a category match (this stays a business-category-based
 * match engine, not a "any business near X" spam generator).
 */
export function matchBusinessToSource(
  business: OpportunityMatchBusinessInput,
  source: EditorialOpportunitySource,
): OpportunityMatchCandidate | null {
  const categoryMatched = Boolean(business.broadBusinessType) && source.suggestedBusinessCategories.includes(business.broadBusinessType as BroadBusinessType);
  if (!categoryMatched) return null;

  const geographyMatched = source.suggestedCities.length === 0
    || Boolean(business.primaryCity && source.suggestedCities.some((c) => c.toLowerCase() === business.primaryCity!.toLowerCase()));

  const reasons: OpportunityMatchReason[] = [editorialThemeReason(source)];
  const categoryR = categoryReason(categoryMatched, business.broadBusinessType);
  if (categoryR) reasons.push(categoryR);
  const geoR = geographyReason(source.suggestedCities.length > 0 && geographyMatched, business.primaryCity);
  if (geoR) reasons.push(geoR);

  // Confidence is derived transparently from how many independent reasons support the match — it
  // is never a black-box number and never overrides the reasons above.
  let confidence: "low" | "medium" | "high" = "low";
  if (reasons.length >= 3) confidence = "high";
  else if (reasons.length === 2) confidence = "medium";

  return { source, matchReasons: reasons, confidence };
}

/** Evaluates a business against every currently-active source and returns all category matches. */
export function matchBusinessToAllSources(
  business: OpportunityMatchBusinessInput,
  sources: readonly EditorialOpportunitySource[],
): readonly OpportunityMatchCandidate[] {
  const out: OpportunityMatchCandidate[] = [];
  for (const source of sources) {
    const match = matchBusinessToSource(business, source);
    if (match) out.push(match);
  }
  return out;
}
