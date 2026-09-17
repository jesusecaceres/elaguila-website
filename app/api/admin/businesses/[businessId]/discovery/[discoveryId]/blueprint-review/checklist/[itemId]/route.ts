/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — update one QA/Launch/Handoff checklist
 * item's status/note/evidence. Server-authoritative; never lets client-side button-hiding be the
 * only enforcement (the actual release/handoff GUARDS live in the release/handoff-complete routes,
 * not here — this route only ever records a real staff decision on ONE item).
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { updateCheckItemStatus } from "@/app/lib/business/projectDiscovery/blueprintCheckItemRepository";
import type { CheckItemStatus } from "@/app/lib/business/projectDiscovery/blueprintChecklistEngine";

export const runtime = "nodejs";

const VALID_STATUSES: readonly CheckItemStatus[] = ["not_checked", "pending", "pass", "complete", "fail", "blocked", "not_applicable"];

interface Body {
  status?: unknown;
  note?: unknown;
  evidenceSourceFileId?: unknown;
  evidenceUrl?: unknown;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string; itemId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["review_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, itemId } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const status = VALID_STATUSES.includes(body.status as CheckItemStatus) ? (body.status as CheckItemStatus) : "";
  if (!status) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });

  const result = await updateCheckItemStatus(
    businessId,
    itemId,
    {
      status,
      note: typeof body.note === "string" ? body.note : null,
      evidenceSourceFileId: typeof body.evidenceSourceFileId === "string" ? body.evidenceSourceFileId : null,
      evidenceUrl: typeof body.evidenceUrl === "string" ? body.evidenceUrl : null,
    },
    access.actor,
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true, item: result.item });
}
