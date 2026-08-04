import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { resolveLearningCenterFlagTier } from "@/app/lib/business/learning/featureFlag";
import { validateDraftPatch, computeDraftCompletionState, buildEducationalReadinessSummary } from "@/app/lib/business/ideaBuilder/logic";
import {
  abandonOwnIdeaDraft, completeOwnIdeaDraft, deleteOwnIdeaDraft, getOwnIdeaDraft, listOwnIdeaDrafts, saveOwnIdeaDraftStep,
} from "@/app/lib/business/ideaBuilder/repository";
import type { IdeaDraftPatch } from "@/app/lib/business/ideaBuilder/types";

/**
 * GET /api/dashboard/business/idea-builder — signed-in only. ?intentId= returns one draft (plus
 * its completion state and educational readiness summary); omitted returns the list of the
 * caller's own drafts. Never claims market validation, profitability, or a guaranteed outcome.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const tier = await resolveLearningCenterFlagTier(userId);
  if (tier === "unavailable") return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const intentId = searchParams.get("intentId");

  if (intentId) {
    const draft = await getOwnIdeaDraft(userId, intentId);
    if (!draft) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({
      ok: true,
      draft,
      completionState: computeDraftCompletionState(draft),
      readinessSummary: buildEducationalReadinessSummary(draft),
    });
  }

  const drafts = await listOwnIdeaDrafts(userId);
  return NextResponse.json({ ok: true, drafts });
}

type PostBody = {
  intentId?: unknown;
  path?: unknown;
  ideaDescription?: unknown;
  customerDefinition?: unknown;
  problemDefinition?: unknown;
  simpleOffer?: unknown;
  readinessAnswers?: unknown;
  language?: unknown;
};

/**
 * POST /api/dashboard/business/idea-builder — signed-in only. Save/resume: creates a new draft
 * (new intentId) when none is supplied, otherwise upserts the step. authUserId is always
 * server-derived from the verified bearer token -- never trusted from the body.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const tier = await resolveLearningCenterFlagTier(userId);
  if (tier === "unavailable") return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });

  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const intentId = typeof body.intentId === "string" && body.intentId.trim() ? body.intentId.trim() : randomUUID();

  const patch: IdeaDraftPatch = {};
  if (body.path === "have_business" || body.path === "thinking_about_starting") patch.path = body.path;
  if (typeof body.ideaDescription === "string") patch.ideaDescription = body.ideaDescription;
  if (typeof body.customerDefinition === "string") patch.customerDefinition = body.customerDefinition;
  if (typeof body.problemDefinition === "string") patch.problemDefinition = body.problemDefinition;
  if (typeof body.simpleOffer === "string") patch.simpleOffer = body.simpleOffer;
  if (body.readinessAnswers && typeof body.readinessAnswers === "object") patch.readinessAnswers = body.readinessAnswers as IdeaDraftPatch["readinessAnswers"];
  if (body.language === "es" || body.language === "en") patch.language = body.language;

  const validation = validateDraftPatch(patch);
  if (!validation.ok) return NextResponse.json({ ok: false, error: "invalid_draft", detail: validation.errors }, { status: 400 });

  const draft = await saveOwnIdeaDraftStep(userId, intentId, patch);
  if (!draft) return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });

  return NextResponse.json({
    ok: true,
    draft,
    completionState: computeDraftCompletionState(draft),
    readinessSummary: buildEducationalReadinessSummary(draft),
  });
}

type PatchBody = { intentId?: unknown; action?: unknown };

/** PATCH /api/dashboard/business/idea-builder — signed-in only. body: {intentId, action: "complete"|"abandon"}. */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const tier = await resolveLearningCenterFlagTier(userId);
  if (tier === "unavailable") return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const intentId = typeof body.intentId === "string" ? body.intentId : "";
  if (!intentId) return NextResponse.json({ ok: false, error: "missing_intent_id" }, { status: 400 });

  if (body.action === "complete") {
    const draft = await completeOwnIdeaDraft(userId, intentId);
    if (!draft) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, draft });
  }
  if (body.action === "abandon") {
    const ok = await abandonOwnIdeaDraft(userId, intentId);
    if (!ok) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
}

/** DELETE /api/dashboard/business/idea-builder?intentId= — signed-in only, the caller's own draft. */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const intentId = searchParams.get("intentId");
  if (!intentId) return NextResponse.json({ ok: false, error: "missing_intent_id" }, { status: 400 });

  const ok = await deleteOwnIdeaDraft(userId, intentId);
  if (!ok) return NextResponse.json({ ok: false, error: "delete_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
