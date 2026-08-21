"use server";

/**
 * Recursos Intake OS — Gate 5 change-proposal review actions. Every action: requires
 * can_manage_recursos server-side, re-reads the proposal fresh (never trusts client state),
 * re-checks status='pending' before transitioning, writes through the single-field allow-listed
 * update path (never a blind object spread / full-resource overwrite), and leaves a
 * verification_event + admin_audit_log trail.
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { getAdminOperatorEmailFromCookies } from "@/app/lib/supabase/adminSession";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import {
  dbGetResourceChangeProposal,
  dbListPendingResourceChangeProposalsForResource,
  dbUpdateResourceChangeProposalStatus,
} from "@/app/lib/recursos/intake/server/resourceChangeProposalsDb";
import { dbUpdateSingleResourceField } from "@/app/lib/recursos/intake/server/resourceFieldAcceptDb";
import { insertVerificationEvent } from "@/app/lib/recursos/intake/server/verificationEventsDb";
import { isSafetySensitiveField } from "@/app/lib/recursos/intake/resourceChangeDetection";

async function actorEmail(): Promise<string | null> {
  const c = await cookies();
  return getAdminOperatorEmailFromCookies(c);
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

export async function acceptChangeProposalAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const id = str(formData, "proposalId");
  const proposal = id ? await dbGetResourceChangeProposal(id) : null;
  if (!proposal) redirect("/admin/recursos/cambios?error=unknown_proposal");
  if (proposal!.status !== "pending") {
    redirect(`/admin/recursos/cambios?error=${encodeURIComponent("This proposal was already reviewed.")}`);
  }
  if (proposal!.proposedValue === null) {
    redirect(`/admin/recursos/cambios?error=${encodeURIComponent("Proposal has no value to accept.")}`);
  }

  const actor = await actorEmail();
  const fieldResult = await dbUpdateSingleResourceField(proposal!.resourceId, proposal!.fieldName, String(proposal!.proposedValue), actor);
  if (!fieldResult.ok) {
    redirect(`/admin/recursos/cambios?error=${encodeURIComponent(fieldResult.error)}`);
  }

  await dbUpdateResourceChangeProposalStatus(id, "accepted", actor);
  await insertVerificationEvent({
    resourceId: proposal!.resourceId,
    sourceIntakeJobId: proposal!.sourceIntakeJobId,
    eventType: "field_accepted",
    actorEmail: actor,
    sourceType: proposal!.proposalSource,
    previousValue: proposal!.oldValue as string | null,
    accepted: proposal!.proposedValue as string | null,
    notes: `field=${proposal!.fieldName}`,
  });
  auditAdminWrite("recurso_change_proposal_accepted", "community_resources", proposal!.resourceId, { proposalId: id, field: proposal!.fieldName, actorEmail: actor });

  revalidatePath("/admin/recursos/cambios");
  revalidatePath(`/admin/recursos/${proposal!.resourceId}`);
  redirect("/admin/recursos/cambios?status_saved=1");
}

export async function rejectChangeProposalAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const id = str(formData, "proposalId");
  const proposal = id ? await dbGetResourceChangeProposal(id) : null;
  if (!proposal) redirect("/admin/recursos/cambios?error=unknown_proposal");
  if (proposal!.status !== "pending") {
    redirect(`/admin/recursos/cambios?error=${encodeURIComponent("This proposal was already reviewed.")}`);
  }

  const actor = await actorEmail();
  // Never touches community_resources.
  await dbUpdateResourceChangeProposalStatus(id, "rejected", actor);
  await insertVerificationEvent({
    resourceId: proposal!.resourceId,
    sourceIntakeJobId: proposal!.sourceIntakeJobId,
    eventType: "field_rejected",
    actorEmail: actor,
    sourceType: proposal!.proposalSource,
    previousValue: proposal!.oldValue as string | null,
    notes: `field=${proposal!.fieldName}`,
  });
  auditAdminWrite("recurso_change_proposal_rejected", "community_resources", proposal!.resourceId, { proposalId: id, field: proposal!.fieldName, actorEmail: actor });

  revalidatePath("/admin/recursos/cambios");
  redirect("/admin/recursos/cambios?status_saved=1");
}

export async function needsMoreResearchChangeProposalAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const id = str(formData, "proposalId");
  const proposal = id ? await dbGetResourceChangeProposal(id) : null;
  if (!proposal) redirect("/admin/recursos/cambios?error=unknown_proposal");
  if (proposal!.status !== "pending") {
    redirect(`/admin/recursos/cambios?error=${encodeURIComponent("This proposal was already reviewed.")}`);
  }

  const actor = await actorEmail();
  // Never touches community_resources — this candidate/field may feed a future intake/re-verification pass.
  await dbUpdateResourceChangeProposalStatus(id, "needs_more_research", actor);
  auditAdminWrite("recurso_change_proposal_needs_research", "community_resources", proposal!.resourceId, { proposalId: id, field: proposal!.fieldName, actorEmail: actor });

  revalidatePath("/admin/recursos/cambios");
  redirect("/admin/recursos/cambios?status_saved=1");
}

/**
 * Accepts every PENDING proposal for one resource EXCEPT safety-sensitive fields, reusing the
 * exact same per-field acceptance path as acceptChangeProposalAction (no separate bulk SQL
 * UPDATE) — one field at a time, one audit/event row per field, so the trail is identical to a
 * human clicking Accept on each one individually.
 */
export async function acceptAllSafeChangeProposalsAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const resourceId = str(formData, "resourceId");
  if (!resourceId) redirect("/admin/recursos/cambios?error=unknown_resource");

  const pending = await dbListPendingResourceChangeProposalsForResource(resourceId);
  const safeOnes = pending.filter((p) => !isSafetySensitiveField(p.fieldName) && p.proposedValue !== null);

  const actor = await actorEmail();
  let acceptedCount = 0;
  for (const proposal of safeOnes) {
    const fieldResult = await dbUpdateSingleResourceField(proposal.resourceId, proposal.fieldName, String(proposal.proposedValue), actor);
    if (!fieldResult.ok) continue; // one field failing must not abort the rest
    await dbUpdateResourceChangeProposalStatus(proposal.id, "accepted", actor);
    await insertVerificationEvent({
      resourceId: proposal.resourceId,
      sourceIntakeJobId: proposal.sourceIntakeJobId,
      eventType: "field_accepted",
      actorEmail: actor,
      sourceType: proposal.proposalSource,
      previousValue: proposal.oldValue as string | null,
      accepted: proposal.proposedValue as string | null,
      notes: `field=${proposal.fieldName} (bulk-safe)`,
    });
    acceptedCount++;
  }

  auditAdminWrite("recurso_change_proposals_bulk_safe_accepted", "community_resources", resourceId, { actorEmail: actor, acceptedCount, totalPending: pending.length });

  revalidatePath("/admin/recursos/cambios");
  revalidatePath(`/admin/recursos/${resourceId}`);
  redirect("/admin/recursos/cambios?status_saved=1");
}
