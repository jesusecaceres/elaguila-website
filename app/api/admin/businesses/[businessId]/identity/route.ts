import { NextResponse } from "next/server";
import { requireStaffWorkspaceWriteAccess, requireSalesWorkspaceAccess, actorHasCapability, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { buildBusinessApplicationContext } from "@/app/lib/business/applicationContext/businessApplicationContext";
import { getBusinessByIdForCurrentUser, updateBusinessCoreFieldsAsStaff } from "@/app/lib/business/repositories/businessesRepo";
import { upsertContactValueAsStaff } from "@/app/lib/business/repositories/contactsRepo";
import { upsertServiceAreaAsStaff } from "@/app/lib/business/repositories/serviceAreasRepo";
import { upsertDigitalProfileAsStaff } from "@/app/lib/business/repositories/digitalProfilesRepo";
import type { DigitalProfilePlatform } from "@/app/lib/business/types";

export const dynamic = "force-dynamic";

const KNOWN_PLATFORMS: readonly DigitalProfilePlatform[] = [
  "google_business", "facebook", "instagram", "tiktok", "youtube", "linkedin", "x", "yelp", "whatsapp_business", "snapchat", "pinterest", "other",
];

/**
 * LEONIX BUSINESS INFORMATION EDITOR (Gate 1) — the ONE staff-facing canonical identity read+write
 * surface. GET reuses buildBusinessApplicationContext (the exact same projection Servicios prefill
 * already reads) plus the raw `businesses` row fields the editor also exposes. PATCH writes through
 * the new Gate-1 repository functions — never a second mutation architecture, never a new table.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_business_detail")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;
  const admin = getAdminSupabase();
  const [business, context] = await Promise.all([
    getBusinessByIdForCurrentUser(admin, businessId),
    buildBusinessApplicationContext(businessId),
  ]);
  if (!business || !context) return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    business: {
      displayName: business.displayName,
      publicName: business.publicName,
      broadBusinessType: business.broadBusinessType,
      specificBusinessType: business.specificBusinessType,
      customSpecificType: business.customSpecificType,
      businessPrimaryLanguage: business.businessPrimaryLanguage,
    },
    context,
    canEdit: actorHasCapability(access.actor, "edit_business_identity"),
  });
}

type IdentityPatchBody = {
  business?: {
    displayName?: string;
    publicName?: string | null;
    broadBusinessType?: string;
    specificBusinessType?: string | null;
    customSpecificType?: string | null;
    businessPrimaryLanguage?: string | null;
  };
  contacts?: { phone?: string; email?: string; website?: string; whatsapp?: string };
  address?: { street?: string; city?: string; stateProvince?: string; postalCode?: string; country?: string };
  serviceAreaText?: string;
  socials?: Partial<Record<string, string>>;
};

export async function PATCH(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("edit_business_identity");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await ctx.params;
  const admin = getAdminSupabase();
  const existing = await getBusinessByIdForCurrentUser(admin, businessId);
  if (!existing) return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as IdentityPatchBody;
  const errors: string[] = [];

  if (b.business) {
    const result = await updateBusinessCoreFieldsAsStaff(admin, businessId, b.business);
    if (!result.ok) errors.push(`business:${result.error}`);
  }

  if (b.contacts) {
    const c = b.contacts;
    if (c.phone?.trim()) {
      const r = await upsertContactValueAsStaff(admin, businessId, "phone", null, c.phone);
      if (!r.ok) errors.push(`phone:${r.error}`);
    }
    if (c.email?.trim()) {
      const r = await upsertContactValueAsStaff(admin, businessId, "email", null, c.email);
      if (!r.ok) errors.push(`email:${r.error}`);
    }
    if (c.website?.trim()) {
      const r = await upsertContactValueAsStaff(admin, businessId, "website", null, c.website);
      if (!r.ok) errors.push(`website:${r.error}`);
    }
    if (c.whatsapp?.trim()) {
      const r = await upsertContactValueAsStaff(admin, businessId, "phone", "whatsapp", c.whatsapp);
      if (!r.ok) errors.push(`whatsapp:${r.error}`);
    }
  }

  if (b.address && (b.address.street?.trim() || b.address.city?.trim() || b.address.stateProvince?.trim() || b.address.postalCode?.trim() || b.address.country?.trim())) {
    const a = b.address;
    const rawText = [a.street, a.city, a.stateProvince, a.postalCode, a.country].filter((v) => v?.trim()).join(", ");
    const r = await upsertServiceAreaAsStaff(admin, businessId, "physical_address", {
      rawText: rawText || a.street || a.city || "",
      cityHint: a.city ?? null,
      country: a.country ?? null,
      structuredDetailsPatch: {
        streetName: a.street?.trim() || undefined,
        city: a.city?.trim() || undefined,
        stateProvince: a.stateProvince?.trim() || undefined,
        postalCode: a.postalCode?.trim() || undefined,
        addressVisibility: a.street?.trim() ? "public_exact" : undefined,
      },
    });
    if (!r.ok) errors.push(`address:${r.error}`);
  }

  if (b.serviceAreaText?.trim()) {
    const r = await upsertServiceAreaAsStaff(admin, businessId, "service_area_text", { rawText: b.serviceAreaText });
    if (!r.ok) errors.push(`serviceAreaText:${r.error}`);
  }

  if (b.socials) {
    for (const [platform, rawValue] of Object.entries(b.socials)) {
      if (typeof rawValue !== "string" || !rawValue.trim()) continue;
      if (!KNOWN_PLATFORMS.includes(platform as DigitalProfilePlatform)) {
        errors.push(`socials.${platform}:unknown_platform`);
        continue;
      }
      const r = await upsertDigitalProfileAsStaff(admin, businessId, platform as DigitalProfilePlatform, rawValue);
      if (!r.ok) errors.push(`socials.${platform}:${r.error}`);
    }
  }

  if (errors.length) {
    return NextResponse.json({ ok: false, error: "partial_write_failure", details: errors }, { status: 400 });
  }

  const context = await buildBusinessApplicationContext(businessId);
  return NextResponse.json({ ok: true, context });
}
