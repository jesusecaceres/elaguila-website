import { NextResponse, type NextRequest } from "next/server";
import { findActiveMembershipForCurrentUser } from "@/app/lib/business/repositories/membershipsRepo";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { resolveLearningCenterFlagTier } from "@/app/lib/business/learning/featureFlag";
import { completeLessonProgress, getPublishedLessonByKey, listCapabilityRecordsForUser, listProgressForUser, startLessonProgress } from "@/app/lib/business/learning/repository";
import type { LearningActor } from "@/app/lib/business/learning/types";

/**
 * GET /api/dashboard/business/learning/progress — signed-in only. Returns the caller's own
 * progress and gained capability records. authUserId is always resolved server-side from the
 * verified bearer token -- never trusted from the request.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const tier = await resolveLearningCenterFlagTier(userId);
  if (tier === "unavailable") return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });

  const [progress, capabilityRecords] = await Promise.all([listProgressForUser(userId), listCapabilityRecordsForUser(userId)]);
  return NextResponse.json({ ok: true, progress, capabilityRecords });
}

type ProgressBody = { lessonKey?: unknown; action?: unknown };

/**
 * POST /api/dashboard/business/learning/progress — signed-in only. body: {lessonKey, action:
 * "start"|"complete"}. Only a lesson with status='published' can receive progress. businessId is
 * resolved server-side from the caller's own active membership (nullable -- a person with no
 * business yet can still start/complete lessons).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const tier = await resolveLearningCenterFlagTier(userId);
  if (tier === "unavailable") return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });

  let body: ProgressBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const lessonKey = typeof body.lessonKey === "string" ? body.lessonKey : "";
  const action = body.action === "start" || body.action === "complete" ? body.action : null;
  if (!lessonKey) return NextResponse.json({ ok: false, error: "missing_lesson_key" }, { status: 400 });
  if (!action) return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });

  const lesson = await getPublishedLessonByKey(lessonKey);
  if (!lesson) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const userClient = getServerSupabaseForBearerToken(token);
  const membership = await findActiveMembershipForCurrentUser(userClient, userId);
  const businessId = membership?.businessId ?? null;

  if (action === "start") {
    const progress = await startLessonProgress(userId, businessId, lesson.id);
    if (!progress) return NextResponse.json({ ok: false, error: "start_failed" }, { status: 500 });
    return NextResponse.json({ ok: true, progress });
  }

  // action === "complete"
  const { data: authData } = await userClient.auth.getUser();
  const ownerEmail = authData?.user?.email;
  if (!ownerEmail) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const actor: LearningActor = { type: "owner", authUserId: userId, email: ownerEmail.trim().toLowerCase() };
  const result = await completeLessonProgress(actor, businessId, lesson);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, progress: result.progress });
}
