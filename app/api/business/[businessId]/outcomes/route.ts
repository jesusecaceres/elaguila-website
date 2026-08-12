/**
 * Program 7 — Owner API route for outcomes.
 * Returns owner-safe outcomes only. Never exposes staff-only evidence or reflections.
 */
import { NextResponse } from "next/server";
import { resolveOutcomesOwnerAccess } from "@/app/lib/business/outcomes/ownerAccess";
import { listBusinessOutcomes } from "@/app/lib/business/outcomes/repository";
import { isOwnerSafeOutcome, shapeOutcomeForOwner } from "@/app/lib/business/outcomes/logic";

export async function GET(
  req: Request,
  { params }: { params: { businessId: string } },
) {
  const access = await resolveOutcomesOwnerAccess(req, params.businessId ?? null);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const outcomes = await listBusinessOutcomes(access.business.id);
  const ownerSafeOutcomes = outcomes
    .filter((o) => isOwnerSafeOutcome(o))
    .map(shapeOutcomeForOwner);

  return NextResponse.json({ outcomes: ownerSafeOutcomes });
}
