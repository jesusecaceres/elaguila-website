import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { resolveLearningCenterFlagTier } from "@/app/lib/business/learning/featureFlag";
import { listActiveCategories, listPublishedLessons } from "@/app/lib/business/learning/repository";
import { searchPublishedLessons, toLessonSummary } from "@/app/lib/business/learning/logic";

/**
 * GET /api/dashboard/business/learning/catalog — PUBLIC. Learning Center categories + published
 * lesson summaries (never a lesson body), optionally filtered by ?q= search text in ?lang=
 * (es default). No bearer token is required -- this is public content, read exclusively through
 * the service-role repository (never an anon table grant). A bearer token is optional and used
 * only to let an early pilot user preview the catalog before the flag is enabled globally; an
 * anonymous request is treated identically once the flag is enabled.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  const userId = token ? await resolveAuthenticatedUserId(token) : null;

  const tier = await resolveLearningCenterFlagTier(userId);
  if (tier !== "global" && tier !== "pilot") {
    return NextResponse.json({ ok: true, comingSoon: true, categories: [], lessons: [] });
  }

  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") === "en" ? "en" : "es";
  const q = searchParams.get("q") ?? "";

  const [categories, lessons] = await Promise.all([listActiveCategories(), listPublishedLessons()]);
  const filtered = q.trim() ? searchPublishedLessons(lessons, q, lang) : lessons;

  return NextResponse.json({
    ok: true,
    comingSoon: false,
    categories,
    lessons: filtered.map(toLessonSummary),
  });
}
