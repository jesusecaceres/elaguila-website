"use server";

/**
 * Build 03A-V — candidate review + controlled promotion actions.
 *
 * Mirrors `recursosActions.ts`: cookie + roster-permission gate, FormData parsing,
 * redirect-based feedback, audit writes. Two actions only:
 *
 * - saveCandidateReviewAction: persists review/evidence state to
 *   community_resource_candidate_reviews. NEVER creates a community_resources row.
 * - promoteCandidateAction: the ONLY bridge from a reviewed candidate to a real (but
 *   inactive, needs_review) community_resources row. Never marks anything verified —
 *   that remains setVerificationStatusAction's job exclusively (recursosActions.ts).
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
import { candidateToResourceDraft, type CandidateResourceRecord } from "@/app/lib/recursos/sourceIngestion";
import { isEvidenceSufficientForPriority1, type CandidateReviewInput, type CandidateReviewDisposition } from "@/app/lib/recursos/verificationEvidence";
import candidatesData from "@/data/recursos/candidates/scc-community-resource-guide-2023.json";

const CANDIDATES = candidatesData as unknown as CandidateResourceRecord[];

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

function findCandidate(candidateId: string): CandidateResourceRecord | undefined {
  return CANDIDATES.find((c) => c.candidateId === candidateId);
}

const DISPOSITIONS: CandidateReviewDisposition[] = ["pending", "researching", "ready_for_promotion", "promoted", "dropped"];

export async function saveCandidateReviewAction(formData: FormData): Promise<void> {
  await assertRecursosAdmin();
  const candidateId = str(formData, "candidateId");
  if (!candidateId || !findCandidate(candidateId)) {
    redirect("/admin/recursos/candidatos?error=unknown_candidate");
  }

  const dispositionRaw = str(formData, "disposition");
  const disposition = (DISPOSITIONS.includes(dispositionRaw as CandidateReviewDisposition) ? dispositionRaw : "pending") as CandidateReviewDisposition;

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
    currentSourceUrl: optStr(formData, "currentSourceUrl"),
    currentSourceType,
    organizationConfirmedActive,
    fieldsConfirmed: formData.getAll("fieldsConfirmed").filter((v): v is string => typeof v === "string"),
    discrepanciesFromPdf: [],
    is24HoursConfirmedExplicit: checked(formData, "is24HoursConfirmedExplicit"),
    addressHandling,
    verificationNotes: optStr(formData, "verificationNotes"),
  };

  const result = await dbSaveCandidateReview(input);
  if (!result.ok) {
    redirect(`/admin/recursos/candidatos/${encodeURIComponent(candidateId)}?error=${encodeURIComponent(result.error)}`);
  }

  auditAdminWrite("recurso_candidate_review_saved", "community_resource_candidate_review", candidateId, {
    disposition,
    actorEmail: actor,
  });
  revalidatePath("/admin/recursos/candidatos");
  revalidatePath(`/admin/recursos/candidatos/${candidateId}`);
  redirect(`/admin/recursos/candidatos/${encodeURIComponent(candidateId)}?saved=1`);
}

/**
 * The only path from a candidate to a real community_resources row. Always creates it
 * active=false, verificationStatus="needs_review", lastVerifiedAt=null — never verified,
 * never active. Refuses without sufficient review evidence; refuses double-promotion.
 */
export async function promoteCandidateAction(formData: FormData): Promise<void> {
  await assertRecursosAdmin();
  const candidateId = str(formData, "candidateId");
  const candidate = candidateId ? findCandidate(candidateId) : undefined;
  if (!candidate) redirect("/admin/recursos/candidatos?error=unknown_candidate");

  const review = await dbGetCandidateReview(candidateId);
  if (!review) {
    redirect(`/admin/recursos/candidatos/${encodeURIComponent(candidateId)}?error=${encodeURIComponent("Save review evidence before promoting.")}`);
  }
  if (review!.promotedResourceId) {
    redirect(`/admin/recursos/candidatos/${encodeURIComponent(candidateId)}?error=${encodeURIComponent("Already promoted — double promotion is refused.")}`);
  }
  if (review!.disposition !== "ready_for_promotion") {
    redirect(
      `/admin/recursos/candidatos/${encodeURIComponent(candidateId)}?error=${encodeURIComponent('Disposition must be "ready_for_promotion" before promoting.')}`,
    );
  }
  if (!review!.organizationConfirmedActive || !review!.currentSourceUrl) {
    redirect(
      `/admin/recursos/candidatos/${encodeURIComponent(candidateId)}?error=${encodeURIComponent("Evidence must confirm the organization is active and cite a current official source URL.")}`,
    );
  }
  if (!isEvidenceSufficientForPriority1(review!, candidate)) {
    redirect(
      `/admin/recursos/candidatos/${encodeURIComponent(candidateId)}?error=${encodeURIComponent("This help-now candidate's evidence does not meet the Priority-1 sufficiency bar yet.")}`,
    );
  }

  const draft = candidateToResourceDraft(candidate);
  // Official source comes from the CURRENT verified evidence, never blindly from the PDF candidate.
  const resourceInput: CommunityResourceInput = {
    ...draft,
    verification: {
      ...draft.verification,
      officialSourceUrl: review!.currentSourceUrl,
      lastVerifiedAt: null,
      nextVerificationAt: null,
      verificationStatus: "needs_review",
      active: false,
    },
  } as CommunityResourceInput;

  const actor = await currentActorEmail();
  const result = await dbCreateCommunityResource(resourceInput, actor);
  if (!result.ok) {
    redirect(`/admin/recursos/candidatos/${encodeURIComponent(candidateId)}?error=${encodeURIComponent(result.error)}`);
  }

  const linked = await dbSetPromotedResourceId(candidateId, result.id);
  if (!linked.ok) {
    redirect(`/admin/recursos/candidatos/${encodeURIComponent(candidateId)}?error=${encodeURIComponent(linked.error)}`);
  }

  auditAdminWrite("recurso_candidate_promoted", "community_resource", result.id, {
    candidateId,
    actorEmail: actor,
  });
  revalidatePath("/admin/recursos");
  revalidatePath("/admin/recursos/candidatos");
  revalidatePath(`/admin/recursos/candidatos/${candidateId}`);
  redirect(`/admin/recursos/${result.id}?promoted_from=${encodeURIComponent(candidateId)}`);
}

export async function dropCandidateAction(formData: FormData): Promise<void> {
  await assertRecursosAdmin();
  const candidateId = str(formData, "candidateId");
  if (!candidateId || !findCandidate(candidateId)) redirect("/admin/recursos/candidatos?error=unknown_candidate");

  const result = await dbSetCandidateReviewDisposition(candidateId, "dropped");
  if (!result.ok) {
    redirect(`/admin/recursos/candidatos/${encodeURIComponent(candidateId)}?error=${encodeURIComponent(result.error)}`);
  }

  const actor = await currentActorEmail();
  auditAdminWrite("recurso_candidate_dropped", "community_resource_candidate_review", candidateId, { actorEmail: actor });
  revalidatePath("/admin/recursos/candidatos");
  revalidatePath(`/admin/recursos/candidatos/${candidateId}`);
  redirect("/admin/recursos/candidatos?status_saved=1");
}
