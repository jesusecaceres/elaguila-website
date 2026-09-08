/**
 * Program 7 — Admin API route for listing business outcomes.
 */
import { NextResponse } from "next/server";
import { requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { listBusinessOutcomes } from "@/app/lib/business/outcomes/repository";

export async function GET(
  _req: Request,
  { params }: { params: { businessId: string } },
) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.reason }, { status: 403 });
  }

  const outcomes = await listBusinessOutcomes(params.businessId);
  return NextResponse.json({ outcomes });
}
