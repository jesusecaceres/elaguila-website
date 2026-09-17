/**
 * Business Development & Growth Engine, Gate D — "Create Commitment" bridge from a Growth solution
 * into the EXISTING Promise Keeper commitment system (createCommitment) — no Growth Engine task
 * table, no parallel to-do list. Mirrors the Creative Studio bridge exactly: create the real row in
 * its own canonical domain first, then record the link back on the Growth Engine side via
 * linkGrowthSolutionExecution (already supports {type:"commitment", id} — added in Gate A, unused
 * until now).
 *
 * This is also the generic handoff used for the three MD Part 4 execution routes that have no
 * dedicated domain of their own: EXTERNAL PROFESSIONAL, PARTNER COORDINATION, and PROMOTIONAL
 * MATERIAL — each is just a Promise Keeper commitment with different prefilled title/context; see
 * app/lib/business/growthEngine/executionMatrix.ts for which route a solution classifies into.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getGrowthSolutionById, linkGrowthSolutionExecution } from "@/app/lib/business/growthEngine/repository";
import { createCommitment } from "@/app/lib/business/promiseKeeper/repository";
import type { ResponsibleParty } from "@/app/lib/business/promiseKeeper/types";

export const runtime = "nodejs";

const VALID_RESPONSIBLE_PARTIES: readonly ResponsibleParty[] = ["owner", "staff", "shared", "external"];

function isValidResponsibleParty(v: unknown): v is ResponsibleParty {
  return typeof v === "string" && (VALID_RESPONSIBLE_PARTIES as readonly string[]).includes(v);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; solutionId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("manage_growth_solutions");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  // Promise Keeper commitment creation is itself capability-gated — a solution manager without
  // either commitment capability cannot use this bridge to bypass Promise Keeper's own gate.
  if (!access.actor.capabilities.has("manage_own_commitments") && !access.actor.capabilities.has("manage_team_commitments")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }

  const { businessId, solutionId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    titleEs?: unknown;
    titleEn?: unknown;
    responsibleParty?: unknown;
    smallestNextStep?: unknown;
    dueAt?: unknown;
  };

  const titleEs = typeof body.titleEs === "string" ? body.titleEs.trim() : "";
  const titleEn = typeof body.titleEn === "string" ? body.titleEn.trim() : "";
  if (!titleEs || !titleEn) return NextResponse.json({ ok: false, error: "title_required" }, { status: 400 });
  const responsibleParty = isValidResponsibleParty(body.responsibleParty) ? body.responsibleParty : "staff";
  const smallestNextStep = typeof body.smallestNextStep === "string" && body.smallestNextStep.trim() ? body.smallestNextStep.trim() : null;
  const dueAt = typeof body.dueAt === "string" && body.dueAt ? body.dueAt : null;

  const solution = await getGrowthSolutionById(businessId, solutionId);
  if (!solution) return NextResponse.json({ ok: false, error: "solution_not_found" }, { status: 404 });

  // Self-assign by default when the responsible party is "staff" — the operator creating this
  // commitment is claiming it. A full roster-picker (assigning a DIFFERENT staff member) is a
  // documented, deliberate scope reduction this gate, matching the same
  // "smallest practical control" instruction the mission gave for item-level review; nothing here
  // prevents adding one later since assignedRosterId is already a real, editable column.
  const commitmentActor = access.actor;
  const commitmentResult = await createCommitment(
    {
      businessId,
      titleEs,
      titleEn,
      responsibleParty,
      assignedRosterId: responsibleParty === "staff" ? access.actor.rosterId : null,
      smallestNextStep,
      dueAt,
      evidenceRequired: false,
    },
    commitmentActor,
  );

  if (!commitmentResult.ok) return NextResponse.json({ ok: false, error: commitmentResult.error }, { status: 400 });

  const linked = await linkGrowthSolutionExecution(businessId, solutionId, { type: "commitment", id: commitmentResult.commitment.id }, access.actor);
  if (!linked.ok) {
    // Commitment is durable (never rolled back, matching every other bridge's own convention) —
    // report the link-side failure so staff can retry linking without losing the created commitment.
    return NextResponse.json({ ok: false, error: "link_failed", commitment: commitmentResult.commitment }, { status: 500 });
  }

  return NextResponse.json({ ok: true, commitment: commitmentResult.commitment, solution: linked.solution });
}
