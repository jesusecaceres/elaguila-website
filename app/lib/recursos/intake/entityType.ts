/**
 * Recursos Intake OS — Gate ES-7A entity classification. Pure types/constants only. Deliberately
 * NOT a new database enum — carried through the existing `discrepancies_from_pdf` jsonb cargo bay
 * on `UrlCandidateProposal` (see urlCandidateProposal.ts's FIELD_KEYS), the same pattern already
 * used for the Spanish Bridge fields (ES-5C). No migration, no new table.
 */
export type EntityType = "PRIMARY_RESOURCE" | "PROGRAM" | "PARTNER_ORGANIZATION" | "LOCATION" | "REFERRAL_LINK";

export const ENTITY_TYPES: EntityType[] = ["PRIMARY_RESOURCE", "PROGRAM", "PARTNER_ORGANIZATION", "LOCATION", "REFERRAL_LINK"];

export const ENTITY_TYPE_VALUES: ReadonlySet<EntityType> = new Set(ENTITY_TYPES);

/**
 * ES-7N hard gate: the ONLY function permitted to decide whether an entity may ever reach
 * dbSaveCandidateReview()/promotion. LOCATION and REFERRAL_LINK are structurally excluded —
 * every call site that creates a candidate must check this first (see entityCandidateCreation.ts).
 */
export function isCandidateEligibleEntityType(entityType: EntityType): boolean {
  return entityType === "PRIMARY_RESOURCE" || entityType === "PROGRAM" || entityType === "PARTNER_ORGANIZATION";
}

export const ENTITY_TYPE_LABEL: Record<EntityType, string> = {
  PRIMARY_RESOURCE: "Recurso principal",
  PROGRAM: "Programa",
  PARTNER_ORGANIZATION: "Organización asociada",
  LOCATION: "Ubicación",
  REFERRAL_LINK: "Enlace de referencia",
};
