import { NextResponse, type NextRequest } from "next/server";

import { actorHasCapability, requireSalesWorkspaceAccess, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToFieldDiscoveryActor } from "@/app/admin/_lib/fieldDiscoveryActor";
import { getBriefingDraftById, markBriefingReviewed, updateDraftItems } from "@/app/lib/business/aiResearch/repository";
import { staffActorToLivingBookActor } from "@/app/admin/_lib/livingBookActor";
import { createContradiction, createUnknown, upsertFact } from "@/app/lib/business/livingBook/repository";
import type { BusinessAiBriefingDraft } from "@/app/lib/business/aiResearch/types";

export const runtime = "nodejs";

type PatchAction =
  | "mark_reviewed"
  | "promote_strength"
  | "promote_opportunity"
  | "promote_unknown"
  | "promote_contradiction"
  | "reject_item"
  | "reject_draft";

const ACTIONS = new Set<PatchAction>([
  "mark_reviewed",
  "promote_strength",
  "promote_opportunity",
  "promote_unknown",
  "promote_contradiction",
  "reject_item",
  "reject_draft",
]);

function fail(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Recomputes the draft's overall review_status from its item-level promotion states — never
 * silently marks fully_promoted unless every relevant item across all four arrays is resolved. */
function computeReviewStatus(draft: BusinessAiBriefingDraft, currentStatus: string): "staff_reviewed" | "partially_promoted" | "fully_promoted" {
  const all = [...draft.strengths, ...draft.opportunities, ...draft.contradictions, ...draft.unknowns];
  if (all.length === 0) return currentStatus === "draft" ? "staff_reviewed" : (currentStatus as "staff_reviewed" | "partially_promoted" | "fully_promoted");
  const allResolved = all.every((i) => i.promotionStatus !== "unresolved");
  const anyPromoted = all.some((i) => i.promotionStatus === "promoted");
  if (allResolved) return "fully_promoted";
  return anyPromoted ? "partially_promoted" : "staff_reviewed";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessId: string; draftId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return fail(denialStatusCode(access.reason), access.reason);

  const { businessId, draftId } = await params;
  const draft = await getBriefingDraftById(businessId, draftId);
  if (!draft) return fail(404, "draft_not_found");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "bad_json");
  }
  // Body must never carry actor identity — derived exclusively server-side above.
  const o = (body ?? {}) as Record<string, unknown>;
  const action = String(o.action ?? "");
  const itemId = typeof o.itemId === "string" ? o.itemId : null;
  if (!ACTIONS.has(action as PatchAction)) return fail(400, "bad_request");

  const fieldDiscoveryActor = staffActorToFieldDiscoveryActor(access.actor);
  const livingBookActor = staffActorToLivingBookActor(access.actor);

  if (action === "mark_reviewed") {
    if (!actorHasCapability(access.actor, "review_ai_briefing")) return fail(403, "forbidden");
    const result = await markBriefingReviewed(businessId, draftId, fieldDiscoveryActor);
    return result.ok ? NextResponse.json({ ok: true }) : fail(500, result.error);
  }

  if (action === "reject_draft") {
    if (!actorHasCapability(access.actor, "review_ai_briefing")) return fail(403, "forbidden");
    const success = await updateDraftItems(businessId, draftId, { reviewStatus: "rejected" });
    return success ? NextResponse.json({ ok: true }) : fail(500, "update_failed");
  }

  if (!itemId) return fail(400, "bad_request");

  if (action === "reject_item") {
    if (!actorHasCapability(access.actor, "review_ai_briefing")) return fail(403, "forbidden");
    const strengths = draft.strengths.map((i) => (i.itemId === itemId ? { ...i, promotionStatus: "rejected" as const } : i));
    const opportunities = draft.opportunities.map((i) => (i.itemId === itemId ? { ...i, promotionStatus: "rejected" as const } : i));
    const contradictions = draft.contradictions.map((i) => (i.itemId === itemId ? { ...i, promotionStatus: "rejected" as const } : i));
    const unknowns = draft.unknowns.map((i) => (i.itemId === itemId ? { ...i, promotionStatus: "rejected" as const } : i));
    const updatedDraft = { ...draft, strengths, opportunities, contradictions, unknowns };
    const success = await updateDraftItems(businessId, draftId, {
      strengths,
      opportunities,
      contradictions,
      unknowns,
      reviewStatus: computeReviewStatus(updatedDraft, draft.reviewStatus),
    });
    return success ? NextResponse.json({ ok: true }) : fail(500, "update_failed");
  }

  // Every remaining action is a promotion — requires the stricter capability, never granted to
  // sales_rep, and always guards against repeated promotion of the same item.
  if (!actorHasCapability(access.actor, "promote_ai_briefing")) return fail(403, "forbidden");

  if (action === "promote_strength" || action === "promote_opportunity") {
    const list = action === "promote_strength" ? draft.strengths : draft.opportunities;
    const item = list.find((i) => i.itemId === itemId);
    if (!item) return fail(404, "draft_not_found");
    if (item.promotionStatus === "promoted") return fail(409, "item_already_promoted");

    const factResult = await upsertFact(
      {
        businessId,
        factKey: `ai_briefing_${draft.researchRunId}_${itemId}`,
        factCategory: "visibility_and_communication",
        value: { es: item.claimEs, en: item.claimEn, evidenceRefs: item.evidenceRefs },
        displayValue: item.claimEn,
        sourceClass: "ai_inference",
        confidence: item.confidence,
        visibility: "staff_only",
        sensitivity: "standard",
        effectiveDate: null,
      },
      livingBookActor,
    );
    if (!factResult.ok) return fail(500, factResult.error);

    const updateList = list.map((i) => (i.itemId === itemId ? { ...i, promotionStatus: "promoted" as const } : i));
    const updatedDraft = action === "promote_strength" ? { ...draft, strengths: updateList } : { ...draft, opportunities: updateList };
    const patch = action === "promote_strength" ? { strengths: updateList } : { opportunities: updateList };
    await updateDraftItems(businessId, draftId, { ...patch, reviewStatus: computeReviewStatus(updatedDraft, draft.reviewStatus) });
    return NextResponse.json({ ok: true, factId: factResult.id });
  }

  if (action === "promote_unknown") {
    const item = draft.unknowns.find((i) => i.itemId === itemId);
    if (!item) return fail(404, "draft_not_found");
    if (item.promotionStatus === "promoted") return fail(409, "item_already_promoted");

    const unknownResult = await createUnknown(
      { businessId, questionLabel: item.questionEn, whyItMatters: item.whyNeededEn, whoCanAnswer: null, priority: item.priority, assignedChannel: null, visibility: "staff_only" },
      livingBookActor,
    );
    if (!unknownResult.ok) return fail(500, unknownResult.error);

    const unknowns = draft.unknowns.map((i) => (i.itemId === itemId ? { ...i, promotionStatus: "promoted" as const } : i));
    const updatedDraft = { ...draft, unknowns };
    await updateDraftItems(businessId, draftId, { unknowns, reviewStatus: computeReviewStatus(updatedDraft, draft.reviewStatus) });
    return NextResponse.json({ ok: true, unknownId: unknownResult.id });
  }

  if (action === "promote_contradiction") {
    if (!(livingBookActor.type === "staff")) return fail(403, "forbidden");
    const item = draft.contradictions.find((i) => i.itemId === itemId);
    if (!item) return fail(404, "draft_not_found");
    if (item.promotionStatus === "promoted") return fail(409, "item_already_promoted");

    const contradictionResult = await createContradiction(
      {
        businessId,
        contradictionType: "statement_vs_public_source",
        severity: "medium",
        claimALabel: item.descriptionEn.slice(0, 500),
        claimAFactId: null,
        claimAEvidenceId: null,
        claimBLabel: item.recommendedConfirmationQuestionEn.slice(0, 500),
        claimBFactId: null,
        claimBEvidenceId: null,
      },
      livingBookActor,
    );
    if (!contradictionResult.ok) return fail(500, contradictionResult.error);

    const contradictions = draft.contradictions.map((i) => (i.itemId === itemId ? { ...i, promotionStatus: "promoted" as const } : i));
    const updatedDraft = { ...draft, contradictions };
    await updateDraftItems(businessId, draftId, { contradictions, reviewStatus: computeReviewStatus(updatedDraft, draft.reviewStatus) });
    return NextResponse.json({ ok: true, contradictionId: contradictionResult.id });
  }

  return fail(400, "bad_request");
}
