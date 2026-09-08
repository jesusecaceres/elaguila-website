/**
 * Program 7 — Owner API route for advisor signals.
 * Returns owner-safe active signals only. Never exposes staff-only signals.
 */
import { NextResponse } from "next/server";
import { resolveAdvisorOwnerAccess } from "@/app/lib/business/advisor/ownerAccess";
import { listActiveSignals } from "@/app/lib/business/advisor/repository";
import { shapeSignalForOwner } from "@/app/lib/business/advisor/logic";

export async function GET(
  req: Request,
  { params }: { params: { businessId: string } },
) {
  const access = await resolveAdvisorOwnerAccess(req, params.businessId ?? null);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const signals = await listActiveSignals(access.business.id);
  const ownerSafeSignals = signals.map(shapeSignalForOwner);

  return NextResponse.json({ signals: ownerSafeSignals });
}
