"use server";

/**
 * Recursos Intake OS — Gate 3 actions for URL-sourced candidates (candidate_id not present in
 * the static PDF JSON, so recursosCandidateActions.ts's JSON-only lookup cannot serve these).
 * Reuses the exact same DB functions, safety locks, and audit conventions as
 * recursosCandidateActions.ts — this is an adapter for a different candidate source, not a
 * second candidate system: same table, same disposition/evidence model, same promotion gate.
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { getAdminOperatorEmailFromCookies } from "@/app/lib/supabase/adminSession";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { dbCreateCommunityResource, type CommunityResourceInput } from "@/app/lib/recursos/server/communityResourcesDb";
import {
  dbGetCandidateReview,
  dbSaveCandidateReview,
  dbSetCandidateReviewDisposition,
  dbSetPromotedResourceId,
} from "@/app/lib/recursos/server/communityResourceCandidateReviewsDb";
import { isEvidenceSufficientForPriority1, type CandidateReviewInput, type CandidateReviewDisposition } from "@/app/lib/recursos/verificationEvidence";
import { decodeProposalFromDiscrepancies } from "@/app/lib/recursos/intake/urlCandidateProposal";
import { decodeMatchMetadata } from "@/app/lib/recursos/intake/candidateMatchMetadata";
import { insertVerificationEvent } from "@/app/lib/recursos/intake/server/verificationEventsDb";

async function assertRecursosAdmin(): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
}

async function currentActorEmail(): Promise<string | null> {
  const c = await cookies();
  return getAdminOperatorEmailFromCookies(c);
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}
function optStr(f: FormData, k: string): string | null {
  const v = str(f, k);
  return v ? v : null;
}
function checked(f: FormData, k: string): boolean {
  return f.get(k) === "on" || f.get(k) === "true";
}

const DISPOSITIONS: CandidateReviewDisposition[] = ["pending", "researching", "ready_for_promotion", "promoted", "dropped"];

function isUrlCandidateId(candidateId: string): boolean {
  // Widened in Gate 4: this action set now serves every DB-only candidate source (URL + PDF),
  // not just URL — both store content the same way (discrepanciesFromPdf-encoded proposal, no
  // static JSON entry), so the same actions/detail-page correctly serve both.
  return candidateId.startsWith("url-") || candidateId.startsWith("pdf-");
}

export async function saveUrlCandidateReviewAction(formData: FormData): Promise<void> {
  await assertRecursosAdmin();
  const candidateId = str(formData, "candidateId");
  if (!candidateId || !isUrlCandidateId(candidateId)) {
    redirect("/admin/recursos/candidatos?error=unknown_candidate");
  }
  const existing = await dbGetCandidateReview(candidateId);
  if (!existing) redirect("/admin/recursos/candidatos?error=unknown_candidate");

  const dispositionRaw = str(formData, "disposition");
  const disposition = (DISPOSITIONS.includes(dispositionRaw as CandidateReviewDisposition) ? dispositionRaw : existing!.disposition) as CandidateReviewDisposition;
  const organizationConfirmedActiveRaw = str(formData, "organizationConfirmedActive");
  const organizationConfirmedActive = organizationConfirmedActiveRaw === "" ? null : organizationConfirmedActiveRaw === "true";
  const currentSourceType = optStr(formData, "currentSourceType") as CandidateReviewInput["currentSourceType"];
  const addressHandling = optStr(formData, "addressHandling") as CandidateReviewInput["addressHandling"];
  const actor = await currentActorEmail();

  const input: CandidateReviewInput = {
    candidateId,
    disposition,
    reviewedBy: actor,
    reviewedAt: new Date().toISOString(),
    currentSourceUrl: optStr(formData, "currentSourceUrl") ?? existing!.currentSourceUrl,
    currentSourceType,
    organizationConfirmedActive,
    fieldsConfirmed: formData.getAll("fieldsConfirmed").filter((v): v is string => typeof v === "string"),
    // Preserve the original AI/deterministic proposal — this form only records human evidence
    // on top of it, it never rewrites the candidate's proposed content.
    discrepanciesFromPdf: existing!.discrepanciesFromPdf,
    is24HoursConfirmedExplicit: checked(formData, "is24HoursConfirmedExplicit"),
    addressHandling,
    verificationNotes: optStr(formData, "verificationNotes") ?? existing!.verificationNotes,
  };

  const result = await dbSaveCandidateReview(input);
  if (!result.ok) {
    redirect(`/admin/recursos/candidatos/url/${encodeURIComponent(candidateId)}?error=${encodeURIComponent(result.error)}`);
  }

  // Gate 6E: skip a redundant evidence_recorded event if nothing evidence-relevant actually changed.
  const materiallyChanged =
    existing!.disposition !== disposition ||
    existing!.currentSourceUrl !== input.currentSourceUrl ||
    existing!.currentSourceType !== input.currentSourceType ||
    existing!.organizationConfirmedActive !== input.organizationConfirmedActive ||
    existing!.is24HoursConfirmedExplicit !== input.is24HoursConfirmedExplicit ||
    existing!.addressHandling !== input.addressHandling ||
    existing!.verificationNotes !== input.verificationNotes ||
    JSON.stringify([...existing!.fieldsConfirmed].sort()) !== JSON.stringify([...input.fieldsConfirmed].sort());
  if (materiallyChanged) {
    await insertVerificationEvent({ candidateId, eventType: "evidence_recorded", actorEmail: actor, sourceType: "url", notes: `disposition=${disposition}`, fieldsConfirmed: input.fieldsConfirmed });
  }
  auditAdminWrite("recurso_url_candidate_review_saved", "community_resource_candidate_review", candidateId, { disposition, actorEmail: actor });
  revalidatePath("/admin/recursos/candidatos");
  revalidatePath(`/admin/recursos/candidatos/url/${candidateId}`);
  redirect(`/admin/recursos/candidatos/url/${encodeURIComponent(candidateId)}?saved=1`);
}

export async function promoteUrlCandidateAction(formData: FormData): Promise<void> {
  await assertRecursosAdmin();
  const candidateId = str(formData, "candidateId");
  if (!candidateId || !isUrlCandidateId(candidateId)) redirect("/admin/recursos/candidatos?error=unknown_candidate");

  const review = await dbGetCandidateReview(candidateId);
  if (!review) redirect("/admin/recursos/candidatos?error=unknown_candidate");
  if (review!.promotedResourceId) {
    redirect(`/admin/recursos/candidatos/url/${encodeURIComponent(candidateId)}?error=${encodeURIComponent("Already promoted — double promotion is refused.")}`);
  }
  if (review!.disposition !== "ready_for_promotion") {
    redirect(`/admin/recursos/candidatos/url/${encodeURIComponent(candidateId)}?error=${encodeURIComponent('Disposition must be "ready_for_promotion" before promoting.')}`);
  }
  // Gate 5L: server-side guard, not just UI disabling — a candidate matched to an already-
  // published resource must go through the Cambios review queue, never a second promotion.
  const matchMeta = decodeMatchMetadata(review!.discrepanciesFromPdf);
  if (matchMeta.classification === "EXISTING_RESOURCE_UPDATE" && matchMeta.matchedResourceId) {
    redirect(
      `/admin/recursos/candidatos/url/${encodeURIComponent(candidateId)}?error=${encodeURIComponent("This candidate matches an already-published resource — review it via Cambios instead of promoting a duplicate.")}`,
    );
  }
  if (!review!.organizationConfirmedActive || !review!.currentSourceUrl) {
    redirect(
      `/admin/recursos/candidatos/url/${encodeURIComponent(candidateId)}?error=${encodeURIComponent("Evidence must confirm the organization is active and cite a current official source URL.")}`,
    );
  }

  const proposal = decodeProposalFromDiscrepancies(review!.discrepanciesFromPdf);
  if (!isEvidenceSufficientForPriority1(review!, { suggestedUrgencyLevel: proposal.suggestedUrgencyLevel ?? "i-need-help", is24Hours: proposal.is24Hours })) {
    redirect(`/admin/recursos/candidatos/url/${encodeURIComponent(candidateId)}?error=${encodeURIComponent("This help-now candidate's evidence does not meet the Priority-1 sufficiency bar yet.")}`);
  }

  // Same structural lock as candidateToResourceDraft(): always inactive, always needs_review,
  // never auto-verified — the official source comes from the reviewer's confirmed URL, not the
  // raw AI/deterministic proposal.
  const resourceInput: CommunityResourceInput = {
    slug: "", // dbCreateCommunityResource falls back to slugifying organizationName when empty
    organizationName: proposal.organizationName ?? "",
    programName: proposal.programName ?? null,
    organizationType: proposal.organizationType ?? "other",
    shortDescriptionEs: "",
    shortDescriptionEn: proposal.suggestedDescriptionEn ?? "",
    detailsEs: null,
    detailsEn: null,
    primaryCategory: proposal.suggestedPrimaryCategory ?? "community-support",
    secondaryCategories: [],
    urgencyLevel: proposal.suggestedUrgencyLevel ?? "i-need-help",
    ageMin: null,
    ageMax: null,
    audienceTags: [],
    serviceTags: [],
    languages: proposal.languages ?? [],
    costModel: proposal.costModel ?? "unknown",
    eligibilityEs: null,
    eligibilityEn: proposal.eligibilityEn ?? null,
    serviceArea: proposal.serviceArea ?? null,
    contact: {
      phone: proposal.phone ?? null,
      crisisPhone: proposal.crisisPhone ?? null,
      sms: proposal.sms ?? null,
      whatsapp: null,
      email: proposal.email ?? null,
      websiteUrl: proposal.websiteUrl ?? null,
      applicationUrl: null,
      address: proposal.addressWithheldForSafety
        ? { addressWithheldForSafety: true }
        : proposal.addressLine1
          ? { line1: proposal.addressLine1, city: proposal.addressCity ?? null, state: proposal.addressState ?? null, zip: proposal.addressZip ?? null }
          : null,
      mapsSearchHref: null,
      hoursNoteEs: null,
      hoursNoteEn: proposal.hoursNoteEn ?? null,
      weeklyHours: null,
      is24Hours: proposal.is24Hours ?? false,
    },
    verification: {
      officialSourceUrl: review!.currentSourceUrl,
      lastVerifiedAt: null,
      nextVerificationAt: null,
      verificationStatus: "needs_review",
      active: false,
    },
    internal: {
      partnerStatus: "none",
      featured: false,
      printEligible: false,
      internalNotes: review!.verificationNotes ?? null,
    },
  } as CommunityResourceInput;

  const actor = await currentActorEmail();
  const result = await dbCreateCommunityResource(resourceInput, actor);
  if (!result.ok) {
    redirect(`/admin/recursos/candidatos/url/${encodeURIComponent(candidateId)}?error=${encodeURIComponent(result.error)}`);
  }

  const linked = await dbSetPromotedResourceId(candidateId, result.id);
  if (!linked.ok) {
    redirect(`/admin/recursos/candidatos/url/${encodeURIComponent(candidateId)}?error=${encodeURIComponent(linked.error)}`);
  }

  await insertVerificationEvent({ candidateId, resourceId: result.id, eventType: "promoted", actorEmail: actor, sourceType: "url" });
  auditAdminWrite("recurso_url_candidate_promoted", "community_resource", result.id, { candidateId, actorEmail: actor });
  revalidatePath("/admin/recursos");
  revalidatePath("/admin/recursos/candidatos");
  revalidatePath(`/admin/recursos/candidatos/url/${candidateId}`);
  redirect(`/admin/recursos/${result.id}?promoted_from=${encodeURIComponent(candidateId)}`);
}

export async function dropUrlCandidateAction(formData: FormData): Promise<void> {
  await assertRecursosAdmin();
  const candidateId = str(formData, "candidateId");
  if (!candidateId || !isUrlCandidateId(candidateId)) redirect("/admin/recursos/candidatos?error=unknown_candidate");

  const result = await dbSetCandidateReviewDisposition(candidateId, "dropped");
  if (!result.ok) {
    redirect(`/admin/recursos/candidatos/url/${encodeURIComponent(candidateId)}?error=${encodeURIComponent(result.error)}`);
  }

  const actor = await currentActorEmail();
  await insertVerificationEvent({ candidateId, eventType: "dropped", actorEmail: actor, sourceType: "url" });
  auditAdminWrite("recurso_url_candidate_dropped", "community_resource_candidate_review", candidateId, { actorEmail: actor });
  revalidatePath("/admin/recursos/candidatos");
  redirect("/admin/recursos/candidatos?status_saved=1");
}
