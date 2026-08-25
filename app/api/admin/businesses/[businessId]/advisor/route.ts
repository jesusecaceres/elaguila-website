/**
 * Program 7 — Admin API route for listing advisor signals.
 * Dynamic [businessId] repair of the encoded %5BbusinessId%5D folder.
 */
import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { isAdvisorEnabled } from "@/app/lib/business/advisor/featureFlag";
import { listAllSignals } from "@/app/lib/business/advisor/repository";

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
  if (!(await isAdvisorEnabled())) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 404 });
  }

  const { businessId } = await params;
  const signals = await listAllSignals(businessId);
  return NextResponse.json({ signals });
}
