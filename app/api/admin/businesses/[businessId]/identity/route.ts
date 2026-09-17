import { NextResponse } from "next/server";
import { requireStaffWorkspaceWriteAccess, requireSalesWorkspaceAccess, actorHasCapability, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { buildBusinessApplicationContext } from "@/app/lib/business/applicationContext/businessApplicationContext";
import { getBusinessByIdForCurrentUser, updateBusinessCoreFieldsAsStaff } from "@/app/lib/business/repositories/businessesRepo";
import { upsertContactValueAsStaff } from "@/app/lib/business/repositories/contactsRepo";
import { upsertServiceAreaAsStaff } from "@/app/lib/business/repositories/serviceAreasRepo";
import { upsertDigitalProfileAsStaff } from "@/app/lib/business/repositories/digitalProfilesRepo";
import { normalizeContactValue } from "@/app/lib/business/normalization";
import { BROAD_BUSINESS_TYPES } from "@/app/lib/business/constants";
import type { DigitalProfilePlatform } from "@/app/lib/business/types";

export const dynamic = "force-dynamic";

const KNOWN_PLATFORMS: readonly DigitalProfilePlatform[] = [
  "google_business", "facebook", "instagram", "tiktok", "youtube", "linkedin", "x", "yelp", "whatsapp_business", "snapchat", "pinterest", "other",
];
const KNOWN_BROAD_BUSINESS_TYPES: readonly string[] = BROAD_BUSINESS_TYPES.map((o) => o.value);

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

type FieldError = { field: string; error: string };

/**
 * LIVE QA BLOCKER 01 — PHASE 1, pure validation, ZERO writes. Every field that CAN be checked
 * without touching the database is checked here first, so a malformed value (e.g. an unknown
 * broad_business_type) is rejected before ANY unrelated field is written — never "some fields
 * silently saved because they happened to run before the bad one."
 */
function validateBeforeWrite(b: IdentityPatchBody): FieldError[] {
  const errors: FieldError[] = [];

  if (b.business?.displayName !== undefined && !b.business.displayName.trim()) {
    errors.push({ field: "business.displayName", error: "invalid_display_name" });
  }
  if (b.business?.broadBusinessType !== undefined && !KNOWN_BROAD_BUSINESS_TYPES.includes(b.business.broadBusinessType)) {
    errors.push({ field: "business.broadBusinessType", error: "invalid_business_type" });
  }

  if (b.contacts?.phone?.trim() && !normalizeContactValue("phone", b.contacts.phone)) {
    errors.push({ field: "contacts.phone", error: "invalid_contact_value" });
  }
  if (b.contacts?.whatsapp?.trim() && !normalizeContactValue("phone", b.contacts.whatsapp)) {
    errors.push({ field: "contacts.whatsapp", error: "invalid_contact_value" });
  }
  if (b.contacts?.email?.trim() && !normalizeContactValue("email", b.contacts.email)) {
    errors.push({ field: "contacts.email", error: "invalid_contact_value" });
  }
  if (b.contacts?.website?.trim() && !normalizeContactValue("website", b.contacts.website)) {
    errors.push({ field: "contacts.website", error: "invalid_contact_value" });
  }

  if (b.socials) {
    for (const [platform, value] of Object.entries(b.socials)) {
      if (typeof value !== "string" || !value.trim()) continue;
      if (!KNOWN_PLATFORMS.includes(platform as DigitalProfilePlatform)) {
        errors.push({ field: `socials.${platform}`, error: "unknown_platform" });
      }
    }
  }

  return errors;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("edit_business_identity");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await ctx.params;
  const admin = getAdminSupabase();
  const existingBusiness = await getBusinessByIdForCurrentUser(admin, businessId);
  if (!existingBusiness) return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as IdentityPatchBody;

  // PHASE 1 — validate everything that can be validated, with ZERO writes attempted yet.
  const validationErrors = validateBeforeWrite(b);
  if (validationErrors.length) {
    return NextResponse.json({ ok: false, error: "validation_failed", fieldErrors: validationErrors }, { status: 400 });
  }

  // PHASE 2 — attempt every write, tracking exactly which section succeeded or failed. A failure
  // in one section never stops the others from being attempted, and — critically — the response
  // NEVER implies "nothing was saved" when something actually committed. Each upsert function is
  // idempotent (find-existing-row-then-update, else insert), so a retry after a partial failure
  // updates the same rows in place rather than duplicating them.
  const savedSections: string[] = [];
  const failedSections: FieldError[] = [];

  if (b.business) {
    const result = await updateBusinessCoreFieldsAsStaff(admin, businessId, b.business);
    if (result.ok) savedSections.push("business");
    else failedSections.push({ field: "business", error: result.error });
  }

  if (b.contacts) {
    const c = b.contacts;
    if (c.phone?.trim()) {
      const r = await upsertContactValueAsStaff(admin, businessId, "phone", null, c.phone);
      if (r.ok) savedSections.push("contacts.phone");
      else failedSections.push({ field: "contacts.phone", error: r.error });
    }
    if (c.email?.trim()) {
      const r = await upsertContactValueAsStaff(admin, businessId, "email", null, c.email);
      if (r.ok) savedSections.push("contacts.email");
      else failedSections.push({ field: "contacts.email", error: r.error });
    }
    if (c.website?.trim()) {
      const r = await upsertContactValueAsStaff(admin, businessId, "website", null, c.website);
      if (r.ok) savedSections.push("contacts.website");
      else failedSections.push({ field: "contacts.website", error: r.error });
    }
    if (c.whatsapp?.trim()) {
      const r = await upsertContactValueAsStaff(admin, businessId, "phone", "whatsapp", c.whatsapp);
      if (r.ok) savedSections.push("contacts.whatsapp");
      else failedSections.push({ field: "contacts.whatsapp", error: r.error });
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
    if (r.ok) savedSections.push("address");
    else failedSections.push({ field: "address", error: r.error });
  }

  if (b.serviceAreaText?.trim()) {
    const r = await upsertServiceAreaAsStaff(admin, businessId, "service_area_text", { rawText: b.serviceAreaText });
    if (r.ok) savedSections.push("serviceAreaText");
    else failedSections.push({ field: "serviceAreaText", error: r.error });
  }

  if (b.socials) {
    for (const [platform, rawValue] of Object.entries(b.socials)) {
      if (typeof rawValue !== "string" || !rawValue.trim()) continue;
      // KNOWN_PLATFORMS membership already re-checked in phase 1 — this loop only ever sees
      // values that passed validation, so no unknown_platform branch is reachable here.
      const r = await upsertDigitalProfileAsStaff(admin, businessId, platform as DigitalProfilePlatform, rawValue);
      if (r.ok) savedSections.push(`socials.${platform}`);
      else failedSections.push({ field: `socials.${platform}`, error: r.error });
    }
  }

  // Always rehydrate canonical truth, whether every section succeeded or not — the client uses
  // this to reconcile its form state to what is ACTUALLY persisted, never a guess.
  const context = await buildBusinessApplicationContext(businessId);

  if (failedSections.length) {
    return NextResponse.json(
      { ok: true, partial: true, savedSections, failedSections, context },
      { status: 200 },
    );
  }

  return NextResponse.json({ ok: true, partial: false, savedSections, context });
}
