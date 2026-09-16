/**
 * Staff-Created Business Profile pipeline -- owner-side builder API. RLS/RPC-scoped throughout:
 * this route can only ever read or write the caller's OWN business's profile, and can never set
 * `status` -- publication only happens through /api/business/profile/publish.
 */
import { NextResponse, type NextRequest } from "next/server";
import { findActiveMembershipForBusinessAndUser } from "@/app/lib/business/repositories/membershipsRepo";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import { getOwnBusinessProfile, saveOwnBusinessProfileDraft } from "@/app/lib/business/profile/repository";
import { resolveBusinessProfileCommercialState } from "@/app/lib/business/profile/entitlementRepository";
import { isBusinessProfileEnabled } from "@/app/lib/business/profile/featureFlag";
import { BUSINESS_PROFILE_GALLERY_MAX_IMAGES } from "@/app/lib/business/profile/constants";
import type { BusinessProfileDraftInput, BusinessProfileHighlight } from "@/app/lib/business/profile/types";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";

function parseStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .slice(0, max);
}

function parseHighlights(value: unknown, max: number): BusinessProfileHighlight[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is { title?: unknown; description?: unknown } => typeof v === "object" && v !== null)
    .map((v) => ({
      title: typeof v.title === "string" ? v.title.trim().slice(0, 120) : "",
      description: typeof v.description === "string" ? v.description.trim().slice(0, 400) : "",
    }))
    .filter((h) => h.title.length > 0)
    .slice(0, max);
}

function parseDraftInput(body: unknown): BusinessProfileDraftInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    headline: typeof b.headline === "string" ? b.headline.trim().slice(0, 120) || null : null,
    shortDescription: typeof b.shortDescription === "string" ? b.shortDescription.trim().slice(0, 240) || null : null,
    aboutDescription: typeof b.aboutDescription === "string" ? b.aboutDescription.trim().slice(0, 4000) || null : null,
    logoUrl: typeof b.logoUrl === "string" ? b.logoUrl.trim() || null : null,
    heroImageUrl: typeof b.heroImageUrl === "string" ? b.heroImageUrl.trim() || null : null,
    galleryImages: parseStringArray(b.galleryImages, BUSINESS_PROFILE_GALLERY_MAX_IMAGES),
    featuredHighlights: parseHighlights(b.featuredHighlights, 8),
  };
}

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "missing_business_id" }, { status: 400 });

  const userClient = getServerSupabaseForBearerToken(token);
  const membership = await findActiveMembershipForBusinessAndUser(userClient, businessId, userId);
  if (!membership) return NextResponse.json({ error: "no_business" }, { status: 404 });

  const [profile, business, commercial] = await Promise.all([
    getOwnBusinessProfile(userClient, businessId),
    getBusinessByIdForCurrentUser(userClient, businessId),
    resolveBusinessProfileCommercialState(businessId),
  ]);
  return NextResponse.json({
    ok: true,
    profile,
    enabled: await isBusinessProfileEnabled(),
    business: business ? { id: business.id, displayName: business.displayName, publicName: business.publicName } : null,
    // Owner-safe subset only -- eligible/state, never the internal grant audit trail
    // (granted_by_email/roster_id, source_reference) which stays staff-only.
    commercial: { eligible: commercial.eligible, state: commercial.state },
  });
}

export async function PUT(req: NextRequest) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isBusinessProfileEnabled())) return NextResponse.json({ error: "feature_disabled" }, { status: 503 });

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const businessId = typeof (body as { businessId?: unknown }).businessId === "string" ? (body as { businessId: string }).businessId : "";
  if (!businessId) return NextResponse.json({ error: "missing_business_id" }, { status: 400 });

  const userClient = getServerSupabaseForBearerToken(token);
  const membership = await findActiveMembershipForBusinessAndUser(userClient, businessId, userId);
  if (!membership) return NextResponse.json({ error: "no_business" }, { status: 404 });

  const input = parseDraftInput(body);
  const result = await saveOwnBusinessProfileDraft(userClient, businessId, input);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "not_a_member" ? 403 : 400 });

  const profile = await getOwnBusinessProfile(userClient, businessId);
  return NextResponse.json({ ok: true, profile });
}
