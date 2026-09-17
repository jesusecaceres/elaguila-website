import { NextResponse } from "next/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { runPublicProspectResearch } from "@/app/lib/business/aiResearch/publicProspectResearch";

export const dynamic = "force-dynamic";

/**
 * DISCOVER FIX (Gate 2) — the public-source, staff-only, pre-visit prospect research lane.
 * Gated on `run_public_research` (NOT `run_ai_research`) — deliberately separate from, and never
 * a substitute for, the client-consented AI briefing engine at
 * POST /api/admin/businesses/[businessId]/research, which is completely untouched by this route.
 * No client consent is required or checked here (see publicProspectResearch.ts doc comment for
 * why). Returns ephemeral candidates only — nothing is written to canonical business truth by
 * this call; accepting a candidate is a separate client action against
 * PATCH /api/admin/businesses/[businessId]/identity.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("run_public_research");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await ctx.params;
  const result = await runPublicProspectResearch(businessId);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "business_not_found" ? 404 : 500 });
  }

  await appendAdminAuditLog({
    action: "business_public_prospect_research_run",
    targetType: "businesses",
    targetId: businessId,
    meta: {
      actor_email: access.actor.email,
      ran_google_places: result.ranGooglePlaces,
      ran_website_scan: result.ranWebsiteScan,
      candidate_count: result.candidates.length,
    },
  });

  return NextResponse.json({
    ok: true,
    current: result.current,
    candidates: result.candidates,
    ranGooglePlaces: result.ranGooglePlaces,
    ranWebsiteScan: result.ranWebsiteScan,
  });
}
