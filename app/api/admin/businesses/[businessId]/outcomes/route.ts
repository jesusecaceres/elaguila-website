/**
 * Program 7 — Admin API route for listing business outcomes.
 * Dynamic [businessId] repair of the encoded %5BbusinessId%5D folder.
 */
import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { isOutcomesEnabled } from "@/app/lib/business/outcomes/featureFlag";
import { listBusinessOutcomes } from "@/app/lib/business/outcomes/repository";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "view_business_detail")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!(await isOutcomesEnabled())) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 404 });
  }

  const { businessId } = await params;
  const outcomes = await listBusinessOutcomes(businessId);
  return NextResponse.json({ outcomes });
}
