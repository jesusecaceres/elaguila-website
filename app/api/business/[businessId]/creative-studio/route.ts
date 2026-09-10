/**
 * Program 6 — Creative Studio API route for owner-safe access.
 * Returns approved/owner-review creative only. Never exposes staff-only notes.
 */
import { NextResponse } from "next/server";
import { resolveCreativeStudioOwnerAccess } from "@/app/lib/business/creativeStudio/ownerAccess";
import { listJobsForBusiness } from "@/app/lib/business/creativeStudio/repository";

export async function GET(
  req: Request,
  { params }: { params: { businessId: string } },
) {
  const access = await resolveCreativeStudioOwnerAccess(req, params.businessId ?? null);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const jobs = await listJobsForBusiness(access.business.id);
  const ownerSafeJobs = jobs
    .filter((j) => j.status === "approved" || j.status === "owner_review")
    .map((j) => ({
      id: j.id,
      assetType: j.assetType,
      language: j.language,
      format: j.format,
      archetype: j.archetype,
      status: j.status,
      approvedAt: j.approvedAt,
    }));

  return NextResponse.json({ jobs: ownerSafeJobs });
}
