import {
  getOfertaLocalCommercialProductForOfferType,
  type OfertaLocalCommercialProduct,
} from "./ofertasLocalesCommercial";

type SupabaseLike = { from: (table: string) => any };

export type OfertaLocalPartnerOperationalStatus = "active" | "suspended" | "expired";
export type OfertaLocalPartnerVerificationStatus = "unverified" | "verified" | "revoked";
export type OfertaLocalPartnerAssignmentStatus = "active" | "suspended" | "revoked" | "expired";

export type OfertaLocalPartnerOrganizationRow = {
  id: string;
  display_name: string;
  partner_type: string;
  verification_status: OfertaLocalPartnerVerificationStatus;
  operational_status: OfertaLocalPartnerOperationalStatus;
  pickup_location_eligible: boolean;
  verified_at: string | null;
};

export type OfertaLocalPartnerAssignmentRow = {
  id: string;
  oferta_local_id: string;
  partner_organization_id: string;
  assignment_status: OfertaLocalPartnerAssignmentStatus;
  courtesy_starts_at: string | null;
  courtesy_ends_at: string | null;
  courtesy_product_key: string;
  placement_priority: number | null;
  badge_enabled: boolean;
  highlighted_placement_enabled: boolean;
  pickup_visibility_enabled: boolean;
  revoked_reason: string | null;
  partner?: OfertaLocalPartnerOrganizationRow | null;
};

export type OfertaLocalPartnerPickupLocationRow = {
  id: string;
  partner_organization_id: string;
  display_name: string;
  address: string;
  city: string;
  state: string | null;
  zip_code: string | null;
  hours: string | null;
  contact: string | null;
  map_url: string | null;
  public_status: string;
};

export type OfertaLocalPartnerPublicVm = {
  isVerifiedPartner: boolean;
  badgeLabel: string | null;
  partnerName: string | null;
  highlightedPlacement: boolean;
  placementPriority: number;
  pickupLocations: OfertaLocalPartnerPickupLocationRow[];
};

export type OfertaLocalSubmissionEligibilitySource =
  | { ok: true; source: "paid"; product: OfertaLocalCommercialProduct }
  | {
      ok: true;
      source: "partner_courtesy";
      product: OfertaLocalCommercialProduct;
      assignment: OfertaLocalPartnerAssignmentRow;
    }
  | { ok: false; source: "ineligible"; status: number; code: string; message: string };

export const OFERTAS_LOCALES_PARTNER_ASSIGNMENT_SELECT = `
  id,
  oferta_local_id,
  partner_organization_id,
  assignment_status,
  courtesy_starts_at,
  courtesy_ends_at,
  courtesy_product_key,
  placement_priority,
  badge_enabled,
  highlighted_placement_enabled,
  pickup_visibility_enabled,
  revoked_reason,
  partner:ofertas_local_partner_organizations (
    id,
    display_name,
    partner_type,
    verification_status,
    operational_status,
    pickup_location_eligible,
    verified_at
  )
`;

function nowTime(now = new Date()): number {
  return now.getTime();
}

function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

export function isOfertaLocalVerifiedActivePartner(
  partner: OfertaLocalPartnerOrganizationRow | null | undefined,
): boolean {
  return Boolean(
    partner &&
      partner.verification_status === "verified" &&
      partner.operational_status === "active",
  );
}

export function isOfertaLocalPartnerAssignmentCurrent(
  assignment: OfertaLocalPartnerAssignmentRow | null | undefined,
  now = new Date(),
): boolean {
  if (!assignment || assignment.assignment_status !== "active") return false;
  const start = parseTime(assignment.courtesy_starts_at);
  const end = parseTime(assignment.courtesy_ends_at);
  const current = nowTime(now);
  if (start != null && current < start) return false;
  if (end != null && current >= end) return false;
  return true;
}

export function assignmentMatchesOfertaLocalProduct(
  assignment: OfertaLocalPartnerAssignmentRow,
  offerType: string,
): OfertaLocalCommercialProduct | null {
  const product = getOfertaLocalCommercialProductForOfferType(offerType);
  if (!product || product.packageKey !== assignment.courtesy_product_key) return null;
  return product;
}

export function resolveOfertaLocalPartnerPublicVm(input: {
  assignment?: OfertaLocalPartnerAssignmentRow | null;
  pickupLocations?: OfertaLocalPartnerPickupLocationRow[];
  now?: Date;
}): OfertaLocalPartnerPublicVm {
  const assignment = input.assignment ?? null;
  const partner = assignment?.partner ?? null;
  const active = isOfertaLocalVerifiedActivePartner(partner) &&
    isOfertaLocalPartnerAssignmentCurrent(assignment, input.now);

  return {
    isVerifiedPartner: active && assignment?.badge_enabled === true,
    badgeLabel: active && assignment?.badge_enabled ? "Verified Leonix magazine partner" : null,
    partnerName: active ? partner?.display_name ?? null : null,
    highlightedPlacement: active && assignment?.highlighted_placement_enabled === true,
    placementPriority: active ? Math.max(0, Number(assignment?.placement_priority ?? 0)) : 0,
    pickupLocations:
      active && assignment?.pickup_visibility_enabled && partner?.pickup_location_eligible
        ? (input.pickupLocations ?? []).filter((row) => row.public_status === "active")
        : [],
  };
}

export function ofertaLocalPartnerRankingWeight(vm: Pick<OfertaLocalPartnerPublicVm, "isVerifiedPartner" | "highlightedPlacement" | "placementPriority">): number {
  if (!vm.isVerifiedPartner) return 0;
  return 1000 + (vm.highlightedPlacement ? 500 : 0) + Math.max(0, vm.placementPriority);
}

export function compareOfertaLocalDefaultRanking(a: {
  relevanceScore?: number;
  partner: Pick<OfertaLocalPartnerPublicVm, "isVerifiedPartner" | "highlightedPlacement" | "placementPriority">;
  updatedAt: string;
  id: string;
}, b: {
  relevanceScore?: number;
  partner: Pick<OfertaLocalPartnerPublicVm, "isVerifiedPartner" | "highlightedPlacement" | "placementPriority">;
  updatedAt: string;
  id: string;
}): number {
  const relevance = (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
  if (relevance !== 0) return relevance;
  const partner = ofertaLocalPartnerRankingWeight(b.partner) - ofertaLocalPartnerRankingWeight(a.partner);
  if (partner !== 0) return partner;
  const freshness = b.updatedAt.localeCompare(a.updatedAt);
  if (freshness !== 0) return freshness;
  return a.id.localeCompare(b.id);
}

export async function fetchOfertaLocalActivePartnerAssignment(
  supabase: SupabaseLike,
  ofertaLocalId: string,
): Promise<OfertaLocalPartnerAssignmentRow | null> {
  const { data, error } = await supabase
    .from("ofertas_local_partner_assignments")
    .select(OFERTAS_LOCALES_PARTNER_ASSIGNMENT_SELECT)
    .eq("oferta_local_id", ofertaLocalId)
    .eq("assignment_status", "active")
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as OfertaLocalPartnerAssignmentRow;
}

export async function fetchOfertaLocalPartnerPickupLocations(
  supabase: SupabaseLike,
  partnerOrganizationId: string,
): Promise<OfertaLocalPartnerPickupLocationRow[]> {
  const { data, error } = await supabase
    .from("ofertas_local_partner_pickup_locations")
    .select("id, partner_organization_id, display_name, address, city, state, zip_code, hours, contact, map_url, public_status")
    .eq("partner_organization_id", partnerOrganizationId)
    .eq("public_status", "active")
    .order("display_name", { ascending: true });
  if (error || !data) return [];
  return data as OfertaLocalPartnerPickupLocationRow[];
}

export async function validateOfertaLocalPartnerCourtesyEligibility(input: {
  supabase: SupabaseLike;
  parent: { id: string; owner_id: string; offer_type: string; leonix_ad_id?: string | null };
  ownerId: string;
  now?: Date;
}): Promise<OfertaLocalSubmissionEligibilitySource> {
  if (input.parent.owner_id !== input.ownerId) {
    return { ok: false, source: "ineligible", status: 403, code: "forbidden", message: "Listing is owned by another user." };
  }
  if (!/^LNX-[A-Z0-9]{8}$/.test(String(input.parent.leonix_ad_id ?? ""))) {
    return { ok: false, source: "ineligible", status: 422, code: "leonix_ad_id_missing", message: "Stable Leonix Ad ID is required." };
  }

  const assignment = await fetchOfertaLocalActivePartnerAssignment(input.supabase, input.parent.id);
  if (!assignment) {
    return { ok: false, source: "ineligible", status: 402, code: "partner_courtesy_required", message: "No active partner courtesy assignment exists." };
  }
  if (!isOfertaLocalVerifiedActivePartner(assignment.partner)) {
    return { ok: false, source: "ineligible", status: 402, code: "partner_not_verified", message: "Partner is not verified and active." };
  }
  if (!isOfertaLocalPartnerAssignmentCurrent(assignment, input.now)) {
    return { ok: false, source: "ineligible", status: 402, code: "partner_courtesy_inactive", message: "Partner courtesy term is not active." };
  }
  const product = assignmentMatchesOfertaLocalProduct(assignment, input.parent.offer_type);
  if (!product) {
    return { ok: false, source: "ineligible", status: 402, code: "partner_product_mismatch", message: "Partner courtesy product does not match listing lane." };
  }
  return { ok: true, source: "partner_courtesy", product, assignment };
}
