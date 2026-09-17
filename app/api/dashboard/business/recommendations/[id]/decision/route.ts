import { NextResponse, type NextRequest } from "next/server";
import { resolveStewardshipAccess } from "@/app/lib/business/stewardship/access";
import { getRecommendationById, recordOwnerDecision } from "@/app/lib/business/stewardship/repository";
import type { StewardshipActor } from "@/app/lib/business/stewardship/types";
import { MAX_NOTE_LENGTH } from "@/app/lib/business/stewardship/constants";

type DecisionBody = { businessId?: unknown; decision?: unknown; note?: unknown; reviewDate?: unknown };

const VALID_DECISIONS = new Set(["accept", "decline", "postpone"]);

/**
 * PATCH /api/dashboard/business/recommendations/[id]/decision — body: {businessId, decision,
 * note?, reviewDate?}. Applies only to the exact owner business, server-authenticated, ignores
 * any body-supplied actor identity. Never triggers payment, checkout, publication, or fulfillment.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  let body: DecisionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const businessId = typeof body.businessId === "string" ? body.businessId : null;
  const access = await resolveStewardshipAccess(req, businessId);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  if (access.entitlement.state !== "personalized_access_active" || !access.stewardshipFlagAvailable) {
    return NextResponse.json({ ok: false, error: "personalized_access_unavailable" }, { status: 403 });
  }

  const decision = typeof body.decision === "string" ? body.decision : "";
  const note = typeof body.note === "string" ? body.note : null;
  const reviewDate = typeof body.reviewDate === "string" ? body.reviewDate : null;

  if (!VALID_DECISIONS.has(decision)) return NextResponse.json({ ok: false, error: "invalid_decision" }, { status: 400 });
  if (note !== null && note.length > MAX_NOTE_LENGTH) return NextResponse.json({ ok: false, error: "note_too_long" }, { status: 400 });
  if (decision === "postpone" && !reviewDate) return NextResponse.json({ ok: false, error: "postpone_requires_review_date" }, { status: 400 });

  const existing = await getRecommendationById(access.business.id, id);
  if (!existing) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (existing.visibility !== "owner_and_staff" || existing.status !== "shared_with_owner") {
    return NextResponse.json({ ok: false, error: "not_decidable" }, { status: 409 });
  }

  const actor: StewardshipActor = { type: "owner", authUserId: access.userId, email: access.email };
  const result = await recordOwnerDecision(actor, access.business.id, id, decision as "accept" | "decline" | "postpone", note, reviewDate);
  if (!result.ok) {
    // The RPC re-validates exact eligibility/decision shape itself (defense in depth) --
    // "not_eligible"/"update_failed_or_already_decided" mean another request already decided or
    // the row no longer matches; "missing_owner_actor_attribution"/"owner_actor_required" would
    // indicate a server-side defect, never a client input problem.
    const status =
      result.error === "not_eligible" || result.error === "update_failed_or_already_decided" ? 409 :
      result.error === "invalid_decision" || result.error === "postpone_requires_review_date" || result.error === "review_date_not_allowed" ? 400 :
      500;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, recommendation: { id: result.recommendation.id, status: result.recommendation.status, ownerDecision: result.recommendation.ownerDecision, ownerDecisionAt: result.recommendation.ownerDecisionAt } });
}
