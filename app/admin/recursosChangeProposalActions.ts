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
import { dbGetCommunityResourceSpanishStatus, dbSetCommunityResourceSpanishStatus } from "@/app/lib/recursos/intake/server/resourceSpanishStatusDb";

async function actorEmail(): Promise<string | null> {
  const c = await cookies();
  return getAdminOperatorEmailFromCookies(c);
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

const TRANSLATABLE_EN_FIELDS = new Set(["shortDescriptionEn", "detailsEn", "eligibilityEn", "hoursNoteEn"]);
const TRANSLATABLE_ES_FIELDS = new Set(["shortDescriptionEs", "detailsEs", "eligibilityEs", "hoursNoteEs"]);

/**
 * Gate ES-8L/M/N — called in the SAME accept workflow, right after a translatable presentation
 * field write succeeds. Never erases Spanish text, never auto-regenerates, never touches factual
 * verification_status/last_verified_at/next_verification_at — only ever downgrades spanish_status,
 * and only when the just-accepted content genuinely puts the currently-trusted Spanish in doubt.
 *
 *   EN field accepted + spanish_status='verified_translation' -> needs_translation_review
 *     (ES-8L: the approved translation was drafted from English facts that just changed).
 *   EN field accepted + spanish_status='official_spanish' + source='official_bilingual_source'
 *     -> needs_translation_review (ES-8M: conservative — a bilingual source's English side and
 *     Spanish side are presented together, so an EN update warrants re-confirming the pair).
 *   EN field accepted + spanish_status='official_spanish' + source='official_spanish_source'
 *     -> NO CHANGE (ES-8M: Spanish is independently authoritative from its own official source —
 *     Leonix's English presentation changing does not stale Spanish sourced separately).
 *   ES field accepted + spanish_status already trusted (official_spanish OR verified_translation)
 *     -> needs_translation_review (ES-8N: the Spanish text itself just changed — whatever was
 *     previously confirmed no longer describes what's now in the column; source_type is always
 *     PRESERVED as-is, never relabeled to ai_translation_reviewed or auto-flipped to official).
 *
 * Failure here is non-fatal (matches this file's existing per-item error tolerance) — a downgrade
 * write failing must never roll back or block the field-content write that already succeeded.
 */
async function maybeDowngradeSpanishStatusOnAccept(resourceId: string, fieldName: string): Promise<void> {
  const isEnField = TRANSLATABLE_EN_FIELDS.has(fieldName);
  const isEsField = TRANSLATABLE_ES_FIELDS.has(fieldName);
  if (!isEnField && !isEsField) return;

  const spanishRow = await dbGetCommunityResourceSpanishStatus(resourceId);
  if (!spanishRow) return;
  const { spanishStatus, spanishSourceType } = spanishRow;

  if (isEnField) {
    if (spanishStatus === "official_spanish" && spanishSourceType === "official_spanish_source") return;
    if (spanishStatus === "verified_translation" || (spanishStatus === "official_spanish" && spanishSourceType === "official_bilingual_source")) {
      await dbSetCommunityResourceSpanishStatus(resourceId, "needs_translation_review", spanishSourceType);
    }
    return;
  }

  // isEsField
  if (spanishStatus === "official_spanish" || spanishStatus === "verified_translation") {
    await dbSetCommunityResourceSpanishStatus(resourceId, "needs_translation_review", spanishSourceType);
  }
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
  await maybeDowngradeSpanishStatusOnAccept(proposal!.resourceId, proposal!.fieldName);

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
 * Accepts every PENDING proposal for one resource EXCEPT safety-sensitive fields AND
 * translation/official_spanish proposals, reusing the exact same per-field acceptance path as
 * acceptChangeProposalAction (no separate bulk SQL UPDATE) — one field at a time, one audit/event
 * row per field, so the trail is identical to a human clicking Accept on each one individually.
 *
 * Spanish Bridge (Gate ES-2C): translation proposals are ALWAYS excluded from bulk-safe-accept,
 * regardless of which field they touch. SAFETY_SENSITIVE_FIELDS only covers structured facts
 * (phone/address/is24Hours) — it was never designed to gate prose content, so an AI-generated
 * Spanish translation of e.g. eligibilityEs/shortDescriptionEs would otherwise be one click away
 * from bulk-publication the moment those fields become writable. This exclusion is independent
 * of and in addition to the existing safety-field exclusion — neither replaces the other.
 *
 * Existing Resource Official-Spanish Bridge (Gate ES-9E): official_spanish proposals get the
 * EXACT same exclusion, for the exact same reason — a resource entering this generic factual
 * bulk-accept flow must never be able to reach spanish_status='needs_translation_review'-adjacent
 * content acceptance through this button. Official-source Spanish content is only ever accepted
 * through the dedicated confirmation core (confirmOfficialSpanishCore /
 * approveOfficialSpanishBatchAction), which also flips spanish_status and preserves provenance —
 * this generic action does neither and must never be allowed to touch these fields.
 */
export async function acceptAllSafeChangeProposalsAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const resourceId = str(formData, "resourceId");
  if (!resourceId) redirect("/admin/recursos/cambios?error=unknown_resource");

  const pending = await dbListPendingResourceChangeProposalsForResource(resourceId);
  const safeOnes = pending.filter(
    (p) => !isSafetySensitiveField(p.fieldName) && p.proposalSource !== "translation" && p.proposalSource !== "official_spanish" && p.proposedValue !== null,
  );

  const actor = await actorEmail();
  let acceptedCount = 0;
  for (const proposal of safeOnes) {
    const fieldResult = await dbUpdateSingleResourceField(proposal.resourceId, proposal.fieldName, String(proposal.proposedValue), actor);
    if (!fieldResult.ok) continue; // one field failing must not abort the rest
    await maybeDowngradeSpanishStatusOnAccept(proposal.resourceId, proposal.fieldName);
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
