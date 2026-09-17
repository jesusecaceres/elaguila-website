/**
 * Program 7 — Admin API route for listing advisor signals.
 */
import { NextResponse } from "next/server";
import { requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { listAllSignals } from "@/app/lib/business/advisor/repository";

export async function GET(
  _req: Request,
  { params }: { params: { businessId: string } },
) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.reason }, { status: 403 });
  }

  const signals = await listAllSignals(params.businessId);
  return NextResponse.json({ signals });
}
