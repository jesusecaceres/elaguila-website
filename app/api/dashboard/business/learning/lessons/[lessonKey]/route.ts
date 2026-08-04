import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { resolveLearningCenterFlagTier } from "@/app/lib/business/learning/featureFlag";
import { getPublishedLessonByKey, listAllPublishedResources } from "@/app/lib/business/learning/repository";

/**
 * GET /api/dashboard/business/learning/lessons/[lessonKey] — PUBLIC. Returns one published
 * lesson (with its bilingual body) plus any published checklists/templates linked to it. A
 * planned, draft, or archived lesson always returns 404 -- never leaked. Same optional-auth
 * pilot-preview pattern as the catalog route.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ lessonKey: string }> }): Promise<NextResponse> {
  const { lessonKey } = await context.params;

  const token = extractBearerToken(req.headers.get("authorization"));
  const userId = token ? await resolveAuthenticatedUserId(token) : null;

  const tier = await resolveLearningCenterFlagTier(userId);
  if (tier !== "global" && tier !== "pilot") {
    return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });
  }

  const lesson = await getPublishedLessonByKey(lessonKey);
  if (!lesson) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const allResources = await listAllPublishedResources();
  const relatedResources = allResources.filter((r) => r.lessonId === lesson.id);

  return NextResponse.json({ ok: true, lesson, relatedResources });
}
