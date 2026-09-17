/**
 * Staff-Created Business Profile pipeline -- staff-side builder API. GET loads the current draft
 * (or null if never saved) behind view_business_profile; PUT saves draft fields behind
 * manage_business_profile. Neither method ever accepts or forwards a `status` field -- staff can
 * never publish. Publication is owner-only (see app/api/business/profile/publish/route.ts).
 */
import { NextResponse, type NextRequest } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess, requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { isBusinessProfileEnabled } from "@/app/lib/business/profile/featureFlag";
import { getBusinessProfile, upsertBusinessProfileDraftAsStaff } from "@/app/lib/business/profile/repository";
import { BUSINESS_PROFILE_GALLERY_MAX_IMAGES } from "@/app/lib/business/profile/constants";
import type { BusinessProfileDraftInput, BusinessProfileHighlight } from "@/app/lib/business/profile/types";
import { getAdminSupabase } from "@/app/lib/supabase/server";

async function businessExists(businessId: string): Promise<boolean> {
  const admin = getAdminSupabase();
  const { data, error } = await admin.from("businesses").select("id").eq("id", businessId).maybeSingle();
  return !error && !!data;
}

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_business_profile")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await params;
  const profile = await getBusinessProfile(businessId);
  return NextResponse.json({ ok: true, profile, enabled: await isBusinessProfileEnabled() });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("manage_business_profile");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  if (!(await isBusinessProfileEnabled())) return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 503 });

  const { businessId } = await params;
  if (!(await businessExists(businessId))) {
    return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const input = parseDraftInput(body);
  const result = await upsertBusinessProfileDraftAsStaff(businessId, input, access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, profile: result.profile });
}
