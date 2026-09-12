/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — create a REAL Promise Keeper commitment
 * from a concrete QA/Launch/Handoff checklist item (MD <promise_keeper>). Same double-gate as the
 * feedback commitment bridge.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createCommitmentFromCheckItem } from "@/app/lib/business/projectDiscovery/blueprintCommitmentBridge";
import type { ResponsibleParty } from "@/app/lib/business/promiseKeeper/types";

export const runtime = "nodejs";

const VALID_PARTIES: readonly ResponsibleParty[] = ["owner", "staff", "shared", "external"];

interface Body {
  titleEs?: unknown;
  titleEn?: unknown;
  responsibleParty?: unknown;
  assignedRosterId?: unknown;
  smallestNextStep?: unknown;
  dueAt?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string; itemId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["review_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  if (!access.actor.capabilities.has("manage_own_commitments") && !access.actor.capabilities.has("manage_team_commitments")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }

  const { businessId, itemId } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const titleEs = typeof body.titleEs === "string" ? body.titleEs.trim() : "";
  const titleEn = typeof body.titleEn === "string" ? body.titleEn.trim() : "";
  const responsibleParty = VALID_PARTIES.includes(body.responsibleParty as ResponsibleParty) ? (body.responsibleParty as ResponsibleParty) : "";
  if (!titleEs || !titleEn || !responsibleParty) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });

  const result = await createCommitmentFromCheckItem(
    businessId,
    itemId,
    {
      businessId,
      titleEs,
      titleEn,
      responsibleParty,
      assignedRosterId: typeof body.assignedRosterId === "string" ? body.assignedRosterId : null,
      smallestNextStep: typeof body.smallestNextStep === "string" ? body.smallestNextStep : null,
      dueAt: typeof body.dueAt === "string" ? body.dueAt : null,
    },
    access.actor,
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true, commitmentId: result.commitmentId });
}
