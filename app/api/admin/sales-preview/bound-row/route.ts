/**
 * LEONIX QUICK SALES WORKSPACE — reopen: the stored canonical row this staff session is bound to.
 *
 * GET (no parameters). The row id is taken ONLY from the signed assisted context, so there is no
 * way to ask this route for an arbitrary listing. Refuses without a staff session, without a live
 * context for a Quick Sales family, and for any listing the custody ledger does not hold for the
 * context's business. Returns the raw row so each category's intake can run its own existing
 * row -> draft mapper; it mutates nothing.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { readActiveAssistedPublishingContext } from "@/app/lib/auth/assistedPublishingSession";
import { readAssistedBoundRow } from "@/app/lib/sales/assistedBoundRow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" } as const;

export async function GET(request: NextRequest) {
  const access = await requireStaffWorkspaceWriteAccess("assisted_category_publishing");
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: access.status, headers: NO_STORE });
  }
  const ctx = await readActiveAssistedPublishingContext(request.cookies);
  if (!ctx) return NextResponse.json({ ok: true, bound: null }, { headers: NO_STORE });

  const result = await readAssistedBoundRow({
    category: ctx.category,
    businessId: ctx.businessId,
    listingId: typeof ctx.listingId === "string" ? ctx.listingId : null,
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true, bound: result.bound }, { headers: NO_STORE });
}
