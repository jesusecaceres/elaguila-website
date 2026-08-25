/**
 * Package 3 — neutral, READ-ONLY Travel Opportunity Lead projection.
 *
 * Viajes owns the source truth (`viajes_staged_listings` + the intake block); this module is a
 * pure mapper other systems (e.g. a future Business Concierge) may CONSUME. Nothing here
 * writes, and no consumer may mutate Viajes application truth through it. Not imported by any
 * Concierge code in this package — published contract only.
 */

import type { ViajesIntakeCommunityBenefit, ViajesIntakePriceBasis } from "./viajesIntakeTypes";
import type {
  ViajesCommunityBenefitStatus,
  ViajesStagedApplicationStage,
  ViajesStagedListingJsonV1,
  ViajesStagedListingRow,
} from "./viajesStagedListingTypes";
import { resolveViajesStagedApplicationStage } from "./viajesStagedListingTypes";

export type TravelOpportunityLeadStage =
  | ViajesStagedApplicationStage
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "expired"
  | "unpublished";

export type TravelOpportunityLead = {
  stagedListingId: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  offerType: string;
  destination: string;
  departureCity: string;
  normalPrice: string;
  priceBasis: ViajesIntakePriceBasis | "";
  communityBenefit: ViajesIntakeCommunityBenefit | null;
  /** Fail-closed: undefined column (migration not applied) maps to "none". */
  communityBenefitStatus: ViajesCommunityBenefitStatus;
  stage: TravelOpportunityLeadStage;
  createdAt: string;
  updatedAt: string;
};

/** Null when the row carries no intake block (pre-Package-3 rows, private lane, etc.). */
export function mapViajesStagedRowToTravelOpportunityLead(
  row: ViajesStagedListingRow,
): TravelOpportunityLead | null {
  const json = (row.listing_json ?? {}) as ViajesStagedListingJsonV1;
  const intake = json.intake;
  if (!intake) return null;

  const stage: TravelOpportunityLeadStage =
    row.lifecycle_status === "draft"
      ? resolveViajesStagedApplicationStage(json)
      : row.lifecycle_status;

  return {
    stagedListingId: row.id,
    businessName: intake.businessName,
    contactName: intake.contactName,
    email: intake.email,
    phone: intake.phone,
    website: intake.website,
    offerType: intake.offerType,
    destination: intake.destino,
    departureCity: intake.ciudadSalida,
    normalPrice: intake.precio,
    priceBasis: intake.priceBasis,
    communityBenefit: intake.communityBenefit ?? null,
    communityBenefitStatus: row.community_benefit_status ?? "none",
    stage,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
