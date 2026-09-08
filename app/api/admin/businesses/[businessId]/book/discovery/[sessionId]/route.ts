import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToLivingBookActor } from "@/app/admin/_lib/livingBookActor";
import { findQuestionByKey } from "@/app/lib/business/livingBook/questionRegistry";
import { completeDiscoverySession, listAnswersForSession, recordDiscoveryAnswer } from "@/app/lib/business/livingBook/repository";
import { MAX_DISCOVERY_ANSWER_TEXT_LENGTH, MAX_DISCOVERY_SUMMARY_LENGTH } from "@/app/lib/business/livingBook/constants";

export const dynamic = "force-dynamic";

/** GET — the recorded answers for one session (used to resume where the session left off). */
export async function GET(_req: Request, ctx: { params: Promise<{ businessId: string; sessionId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "conduct_discovery")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { sessionId } = await ctx.params;
  const answers = await listAnswersForSession(sessionId);
  return NextResponse.json({ ok: true, answers });
}

/** PATCH — action: "answer" records one discovery-question answer; action: "complete" closes the session. */
export async function PATCH(req: Request, ctx: { params: Promise<{ businessId: string; sessionId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "conduct_discovery")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId, sessionId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (b.action === "answer") {
    const questionKey = typeof b.questionKey === "string" ? b.questionKey : "";
    const question = findQuestionByKey(questionKey);
    if (!question) return NextResponse.json({ ok: false, error: "unknown_question_key" }, { status: 400 });
    const skipped = b.skipped === true;
    const answerText = typeof b.answerText === "string" && b.answerText.trim() ? b.answerText.trim().slice(0, MAX_DISCOVERY_ANSWER_TEXT_LENGTH) : null;
    const answerValue = b.answerValue !== undefined ? b.answerValue : null;

    const result = await recordDiscoveryAnswer(
      { sessionId, businessId, questionKey, answerValue, answerText, skipped, createdFactId: null, createdUnknownId: null },
      staffActorToLivingBookActor(access.actor),
    );
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, id: result.id });
  }

  if (b.action === "complete") {
    const summary = typeof b.summary === "string" && b.summary.trim() ? b.summary.trim().slice(0, MAX_DISCOVERY_SUMMARY_LENGTH) : null;
    const success = await completeDiscoverySession(businessId, sessionId, summary, staffActorToLivingBookActor(access.actor));
    if (!success) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
}
