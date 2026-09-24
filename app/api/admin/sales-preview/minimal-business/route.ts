/**
 * Quick Sales — create a minimal canonical businesses row for assisted custody.
 * POST { businessName, publicName?, contactName?, phone?, email?, confirmCreateDespiteDuplicates? }
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createMinimalAssistedBusiness } from "@/app/lib/sales/createMinimalAssistedBusiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(status: number, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

export async function POST(request: NextRequest) {
  const access = await requireStaffWorkspaceWriteAccess("assisted_category_publishing");
  if (!access.ok) return fail(access.status, access.reason);

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "bad_json");
  }

  const result = await createMinimalAssistedBusiness(
    {
      businessName: typeof body.businessName === "string" ? body.businessName : "",
      publicName: typeof body.publicName === "string" ? body.publicName : null,
      contactName: typeof body.contactName === "string" ? body.contactName : null,
      phone: typeof body.phone === "string" ? body.phone : null,
      email: typeof body.email === "string" ? body.email : null,
      confirmCreateDespiteDuplicates: body.confirmCreateDespiteDuplicates === true,
    },
    access.actor,
  );

  if (!result.ok) {
    if (result.error === "invalid_input") return fail(400, result.error, { field: result.field });
    if (result.error === "duplicate_business_warning") {
      return NextResponse.json({ ok: false, error: result.error, duplicateWarning: result.duplicateWarning });
    }
    return fail(500, result.error, { detail: result.detail });
  }

  return NextResponse.json({
    ok: true,
    businessId: result.businessId,
    displayName: result.displayName,
    publicName: result.publicName,
    contactName: result.contactName,
    phone: result.phone,
    email: result.email,
  });
}
