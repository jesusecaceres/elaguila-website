/**
 * Program 5 — Proposal Foundation repository. Server-only, always via getAdminSupabase().
 * Every write requires a ProposalActor. Proposal acceptance does not charge, create
 * payment, grant entitlement, or fulfill. Pricing is resolved from the real
 * revenue_pricing_matrix / packagePricingRules — never invented.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { REVENUE_V1_PACKAGE_MATRIX, type RevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";
import { canTransitionProposalStatus, nextProposalVersion, previousCurrentShouldBecomeSuperseded } from "./logic";
import type {
  BusinessProposal, ProposalActor, ProposalPricingSnapshot, ProposalStatus, ProposalVersion,
} from "./types";

function actorRosterId(actor: ProposalActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}

function actorRole(actor: ProposalActor): string {
  return actor.type === "staff" ? actor.role : "business_owner";
}

const PROPOSAL_COLUMNS =
  "id, business_id, source_recommendation_id, status, version, is_current, owner_goal_en, owner_goal_es, verified_need_en, verified_need_es, recommended_intervention, free_option_en, free_option_es, scope_en, scope_es, deliverables_en, deliverables_es, exclusions_en, exclusions_es, responsibilities_en, responsibilities_es, timeline_en, timeline_es, review_date, pricing_snapshot, entitlement_reference, success_metric_en, success_metric_es, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, accepted_actor_type, accepted_by_roster_id, accepted_by_auth_user_id, accepted_by_email, accepted_by_role, accepted_at, declined_at, created_at, updated_at";

function mapProposalRow(row: Record<string, unknown>): BusinessProposal {
  const pricingRaw = row.pricing_snapshot as Record<string, unknown> | null;
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    sourceRecommendationId: (row.source_recommendation_id as string | null) ?? null,
    status: row.status as ProposalStatus,
    version: Number(row.version),
    isCurrent: Boolean(row.is_current),
    ownerGoalEn: (row.owner_goal_en as string | null) ?? null,
    ownerGoalEs: (row.owner_goal_es as string | null) ?? null,
    verifiedNeedEn: String(row.verified_need_en),
    verifiedNeedEs: String(row.verified_need_es),
    recommendedIntervention: String(row.recommended_intervention),
    freeOptionEn: (row.free_option_en as string | null) ?? null,
    freeOptionEs: (row.free_option_es as string | null) ?? null,
    scopeEn: String(row.scope_en),
    scopeEs: String(row.scope_es),
    deliverablesEn: String(row.deliverables_en),
    deliverablesEs: String(row.deliverables_es),
    exclusionsEn: (row.exclusions_en as string | null) ?? null,
    exclusionsEs: (row.exclusions_es as string | null) ?? null,
    responsibilitiesEn: String(row.responsibilities_en),
    responsibilitiesEs: String(row.responsibilities_es),
    timelineEn: String(row.timeline_en),
    timelineEs: String(row.timeline_es),
    reviewDate: (row.review_date as string | null) ?? null,
    pricingSnapshot: pricingRaw
      ? {
          packageKey: (pricingRaw.packageKey as string | null) ?? null,
          packageLabel: (pricingRaw.packageLabel as string | null) ?? null,
          priceCents: (pricingRaw.priceCents as number | null) ?? null,
          billingMode: (pricingRaw.billingMode as string | null) ?? null,
          durationDays: (pricingRaw.durationDays as number | null) ?? null,
          pricingSource: (pricingRaw.pricingSource as ProposalPricingSnapshot["pricingSource"]) ?? "unknown",
          pricingConfirmed: Boolean(pricingRaw.pricingConfirmed),
        }
      : null,
    entitlementReference: (row.entitlement_reference as string | null) ?? null,
    successMetricEn: String(row.success_metric_en),
    successMetricEs: String(row.success_metric_es),
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    acceptedActorType: (row.accepted_actor_type as "staff" | "owner" | null) ?? null,
    acceptedByRosterId: (row.accepted_by_roster_id as string | null) ?? null,
    acceptedByAuthUserId: (row.accepted_by_auth_user_id as string | null) ?? null,
    acceptedByEmail: (row.accepted_by_email as string | null) ?? null,
    acceptedByRole: (row.accepted_by_role as string | null) ?? null,
    acceptedAt: (row.accepted_at as string | null) ?? null,
    declinedAt: (row.declined_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function resolvePricingFromMatrix(packageKey: string): ProposalPricingSnapshot | null {
  const pkg = REVENUE_V1_PACKAGE_MATRIX.find((p: RevenuePackageDefinition) => p.packageKey === packageKey);
  if (!pkg) return null;
  return {
    packageKey: pkg.packageKey,
    packageLabel: pkg.label,
    priceCents: pkg.priceCents,
    billingMode: pkg.billingMode,
    durationDays: pkg.durationDays,
    pricingSource: "revenue_pricing_matrix",
    pricingConfirmed: pkg.priceCents > 0,
  };
}

export type CreateProposalInput = {
  businessId: string;
  sourceRecommendationId?: string | null;
  ownerGoalEn?: string | null;
  ownerGoalEs?: string | null;
  verifiedNeedEn: string;
  verifiedNeedEs: string;
  recommendedIntervention: string;
  freeOptionEn?: string | null;
  freeOptionEs?: string | null;
  scopeEn: string;
  scopeEs: string;
  deliverablesEn: string;
  deliverablesEs: string;
  exclusionsEn?: string | null;
  exclusionsEs?: string | null;
  responsibilitiesEn: string;
  responsibilitiesEs: string;
  timelineEn: string;
  timelineEs: string;
  reviewDate?: string | null;
  packageKey?: string | null;
  entitlementReference?: string | null;
  successMetricEn: string;
  successMetricEs: string;
};

function requiredText(value: string, fallback = ""): string {
  const primary = value.trim();
  if (primary) return primary;
  return fallback.trim();
}

async function setProposalCurrentFlag(
  proposal: Pick<BusinessProposal, "id" | "businessId">,
  isCurrent: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("business_proposals")
    .update({ is_current: isCurrent, updated_at: new Date().toISOString() })
    .eq("id", proposal.id)
    .eq("business_id", proposal.businessId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function deleteInsertedProposal(proposalId: string, businessId: string): Promise<void> {
  const supabase = getAdminSupabase();
  await supabase.from("business_proposals").delete().eq("id", proposalId).eq("business_id", businessId);
}

async function restorePreviousCurrentFlags(previous: readonly BusinessProposal[]): Promise<void> {
  for (const row of previous) {
    await setProposalCurrentFlag(row, true);
  }
}

/**
 * Mark an in-flight previous current row superseded. Terminal rows never enter here.
 * Status machine has no draft/staff_review/owner_review → superseded path; replacement
 * still uses the existing superseded status (not a new enum).
 */
async function markWorkingProposalSuperseded(
  current: BusinessProposal,
  actor: ProposalActor,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("business_proposals")
    .update({ status: "superseded", is_current: false, updated_at: now })
    .eq("id", current.id)
    .eq("business_id", current.businessId)
    .in("status", ["draft", "staff_review", "owner_review"])
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "retire_failed" };

  await supabase.from("business_proposal_versions").insert({
    proposal_id: current.id,
    business_id: current.businessId,
    version: current.version,
    status: "superseded",
    changed_actor_type: actor.type,
    changed_by_roster_id: actorRosterId(actor),
    changed_by_auth_user_id: actor.authUserId,
    changed_by_email: actor.email,
    changed_by_role: actorRole(actor),
    change_reason: "replaced_by_new_version",
    snapshot: { from: current.status, to: "superseded" },
  });
  return { ok: true };
}

export async function createProposal(
  input: CreateProposalInput,
  actor: ProposalActor,
): Promise<{ ok: true; proposal: BusinessProposal } | { ok: false; error: string }> {
  const verifiedNeedEn = requiredText(input.verifiedNeedEn);
  const recommendedIntervention = requiredText(input.recommendedIntervention);
  const scopeEn = requiredText(input.scopeEn);
  const deliverablesEn = requiredText(input.deliverablesEn);
  const responsibilitiesEn = requiredText(input.responsibilitiesEn);
  const timelineEn = requiredText(input.timelineEn);
  const successMetricEn = requiredText(input.successMetricEn);
  if (!verifiedNeedEn || !recommendedIntervention || !scopeEn || !deliverablesEn || !responsibilitiesEn || !timelineEn || !successMetricEn) {
    return { ok: false, error: "missing_required_fields" };
  }

  const existing = await listProposalsForBusiness(input.businessId);
  const version = nextProposalVersion(existing.map((row) => row.version));
  const previousCurrent = existing.filter((row) => row.isCurrent);

  const pricingSnapshot = input.packageKey ? resolvePricingFromMatrix(input.packageKey) : null;

  const supabase = getAdminSupabase();
  // Insert inactive first so a failed insert cannot leave zero current rows.
  const { data, error } = await supabase
    .from("business_proposals")
    .insert({
      business_id: input.businessId,
      source_recommendation_id: input.sourceRecommendationId ?? null,
      status: "draft",
      version,
      is_current: false,
      owner_goal_en: requiredText(input.ownerGoalEn ?? "") || null,
      owner_goal_es: requiredText(input.ownerGoalEs ?? "") || null,
      verified_need_en: verifiedNeedEn,
      verified_need_es: requiredText(input.verifiedNeedEs, verifiedNeedEn),
      recommended_intervention: recommendedIntervention,
      free_option_en: requiredText(input.freeOptionEn ?? "") || null,
      free_option_es: requiredText(input.freeOptionEs ?? "") || null,
      scope_en: scopeEn,
      scope_es: requiredText(input.scopeEs, scopeEn),
      deliverables_en: deliverablesEn,
      deliverables_es: requiredText(input.deliverablesEs, deliverablesEn),
      exclusions_en: requiredText(input.exclusionsEn ?? "") || null,
      exclusions_es: requiredText(input.exclusionsEs ?? "") || null,
      responsibilities_en: responsibilitiesEn,
      responsibilities_es: requiredText(input.responsibilitiesEs, responsibilitiesEn),
      timeline_en: timelineEn,
      timeline_es: requiredText(input.timelineEs, timelineEn),
      review_date: input.reviewDate ?? null,
      pricing_snapshot: pricingSnapshot,
      entitlement_reference: requiredText(input.entitlementReference ?? "") || null,
      success_metric_en: successMetricEn,
      success_metric_es: requiredText(input.successMetricEs, successMetricEn),
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select(PROPOSAL_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };

  const created = mapProposalRow(data as Record<string, unknown>);

  for (const current of previousCurrent) {
    const cleared = await setProposalCurrentFlag(current, false);
    if (!cleared.ok) {
      await restorePreviousCurrentFlags(previousCurrent);
      await deleteInsertedProposal(created.id, created.businessId);
      return cleared;
    }
  }

  const activated = await setProposalCurrentFlag(created, true);
  if (!activated.ok) {
    await restorePreviousCurrentFlags(previousCurrent);
    await deleteInsertedProposal(created.id, created.businessId);
    return activated;
  }

  for (const current of previousCurrent) {
    if (!previousCurrentShouldBecomeSuperseded(current.status)) continue;
    const superseded = await markWorkingProposalSuperseded(current, actor);
    if (!superseded.ok) {
      // New row is already the sole current. Working previous is not current; superseded stamp is best-effort.
      return { ok: true, proposal: { ...created, isCurrent: true } };
    }
  }

  return { ok: true, proposal: { ...created, isCurrent: true } };
}

export async function listProposalsForBusiness(businessId: string): Promise<BusinessProposal[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_proposals")
    .select(PROPOSAL_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapProposalRow);
}

export type OwnerHandoffProposalRow = {
  businessId: string;
  displayName: string;
  proposalId: string;
  version: number;
  verifiedNeedEn: string;
  recommendedIntervention: string;
  acceptedAt: string | null;
  acceptedByEmail: string | null;
  acceptedByRole: string | null;
};

const OWNER_HANDOFF_LIMIT = 20;

/**
 * Bounded Command Center read model: current accepted proposals only.
 * Two queries max (proposals + matching businesses). Not N+1. Not a new table.
 */
export async function listAcceptedCurrentProposalsForHandoff(): Promise<OwnerHandoffProposalRow[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_proposals")
    .select("id, business_id, version, verified_need_en, recommended_intervention, accepted_at, accepted_by_email, accepted_by_role")
    .eq("status", "accepted")
    .eq("is_current", true)
    .order("accepted_at", { ascending: false })
    .limit(OWNER_HANDOFF_LIMIT);
  if (error || !data || data.length === 0) return [];

  const businessIds = [...new Set((data as Record<string, unknown>[]).map((row) => String(row.business_id)))];
  const { data: businesses, error: businessError } = await supabase
    .from("businesses")
    .select("id, display_name")
    .in("id", businessIds);
  if (businessError || !businesses) return [];

  const names = new Map((businesses as Record<string, unknown>[]).map((row) => [String(row.id), String(row.display_name ?? "")]));
  return (data as Record<string, unknown>[]).map((row) => ({
    businessId: String(row.business_id),
    displayName: names.get(String(row.business_id)) || "Business",
    proposalId: String(row.id),
    version: Number(row.version),
    verifiedNeedEn: String(row.verified_need_en ?? ""),
    recommendedIntervention: String(row.recommended_intervention ?? ""),
    acceptedAt: (row.accepted_at as string | null) ?? null,
    acceptedByEmail: (row.accepted_by_email as string | null) ?? null,
    acceptedByRole: (row.accepted_by_role as string | null) ?? null,
  }));
}

export async function getProposalById(proposalId: string, businessId: string): Promise<BusinessProposal | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_proposals")
    .select(PROPOSAL_COLUMNS)
    .eq("id", proposalId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapProposalRow(data as Record<string, unknown>);
}

export type UpdateProposalStatusInput = {
  proposalId: string;
  businessId: string;
  newStatus: ProposalStatus;
  changeReason?: string | null;
};

export async function updateProposalStatus(
  input: UpdateProposalStatusInput,
  actor: ProposalActor,
): Promise<{ ok: true; proposal: BusinessProposal } | { ok: false; error: string }> {
  const existing = await getProposalById(input.proposalId, input.businessId);
  if (!existing) return { ok: false, error: "proposal_not_found" };

  if (!canTransitionProposalStatus(existing.status, input.newStatus)) {
    return { ok: false, error: "invalid_status_transition" };
  }

  const update: Record<string, unknown> = {
    status: input.newStatus,
    updated_at: new Date().toISOString(),
  };

  if (input.newStatus === "accepted") {
    update.accepted_actor_type = actor.type;
    update.accepted_by_roster_id = actorRosterId(actor);
    update.accepted_by_auth_user_id = actor.authUserId;
    update.accepted_by_email = actor.email;
    update.accepted_by_role = actorRole(actor);
    update.accepted_at = new Date().toISOString();
    update.declined_at = null;
  }
  if (input.newStatus === "declined") {
    update.declined_at = new Date().toISOString();
    update.accepted_actor_type = null;
    update.accepted_by_roster_id = null;
    update.accepted_by_auth_user_id = null;
    update.accepted_by_email = null;
    update.accepted_by_role = null;
    update.accepted_at = null;
  }
  if (input.newStatus === "expired" || input.newStatus === "cancelled") {
    update.accepted_actor_type = null;
    update.accepted_by_roster_id = null;
    update.accepted_by_auth_user_id = null;
    update.accepted_by_email = null;
    update.accepted_by_role = null;
    update.accepted_at = null;
    update.declined_at = null;
  }
  if (input.newStatus === "superseded") {
    update.is_current = false;
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_proposals")
    .update(update)
    .eq("id", input.proposalId)
    .eq("business_id", input.businessId)
    .select(PROPOSAL_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "update_failed" };

  const updated = mapProposalRow(data as Record<string, unknown>);

  if (input.changeReason) {
    await supabase.from("business_proposal_versions").insert({
      proposal_id: input.proposalId,
      business_id: input.businessId,
      version: existing.version,
      status: input.newStatus,
      changed_actor_type: actor.type,
      changed_by_roster_id: actorRosterId(actor),
      changed_by_auth_user_id: actor.authUserId,
      changed_by_email: actor.email,
      changed_by_role: actorRole(actor),
      change_reason: input.changeReason,
      snapshot: { from: existing.status, to: input.newStatus },
    });
  }

  return { ok: true, proposal: updated };
}

export async function listVersionsForProposal(proposalId: string): Promise<ProposalVersion[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_proposal_versions")
    .select("id, proposal_id, business_id, version, status, changed_actor_type, changed_by_roster_id, changed_by_auth_user_id, changed_by_email, changed_by_role, change_reason, snapshot, created_at")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    proposalId: String(row.proposal_id),
    businessId: String(row.business_id),
    version: Number(row.version),
    status: row.status as ProposalStatus,
    changedActorType: row.changed_actor_type as "staff" | "owner",
    changedByRosterId: (row.changed_by_roster_id as string | null) ?? null,
    changedByAuthUserId: String(row.changed_by_auth_user_id),
    changedByEmail: String(row.changed_by_email),
    changedByRole: String(row.changed_by_role),
    changeReason: (row.change_reason as string | null) ?? null,
    snapshot: (row.snapshot as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  }));
}
