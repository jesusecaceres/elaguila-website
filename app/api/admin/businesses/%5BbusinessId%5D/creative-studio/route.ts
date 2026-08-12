/**
 * Program 6 — Admin API route for listing creative jobs.
 */
import { NextResponse } from "next/server";
import { requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { listJobsForBusiness } from "@/app/lib/business/creativeStudio/repository";

export async function GET(
  _req: Request,
  { params }: { params: { businessId: string } },
) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.reason }, { status: 403 });
  }

  const jobs = await listJobsForBusiness(params.businessId);
  return NextResponse.json({ jobs });
}
