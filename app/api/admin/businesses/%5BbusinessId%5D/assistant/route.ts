/**
 * Program 7 — Admin API route for listing assistant threads.
 */
import { NextResponse } from "next/server";
import { requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { listThreadsForBusiness } from "@/app/lib/business/assistant/repository";

export async function GET(
  _req: Request,
  { params }: { params: { businessId: string } },
) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.reason }, { status: 403 });
  }

  const threads = await listThreadsForBusiness(params.businessId);
  return NextResponse.json({ threads });
}
