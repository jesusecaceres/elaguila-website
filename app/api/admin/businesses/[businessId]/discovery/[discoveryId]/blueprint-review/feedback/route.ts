/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — capture client review feedback against one
 * frozen blueprint version (MD <feedback_capture>). projectIntentId is always derived from the
 * blueprint row itself — never trusted from client input — so feedback can never be recorded
 * against a blueprint/intent combination that doesn't actually match.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getBlueprintById } from "@/app/lib/business/projectDiscovery/blueprintRepository";
import { captureBlueprintFeedback, type BlueprintFeedbackType } from "@/app/lib/business/projectDiscovery/blueprintFeedbackRepository";

export const runtime = "nodejs";

const VALID_TYPES: readonly BlueprintFeedbackType[] = ["approved", "change_requested", "needs_clarification", "general"];

interface Body {
  blueprintId?: unknown;
  sectionKey?: unknown;
  fieldKey?: unknown;
  feedbackType?: unknown;
  feedbackText?: unknown;
  clientApproved?: unknown;
  sourceMeetingId?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["review_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, discoveryId } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const blueprintId = typeof body.blueprintId === "string" ? body.blueprintId : "";
  const feedbackType = VALID_TYPES.includes(body.feedbackType as BlueprintFeedbackType) ? (body.feedbackType as BlueprintFeedbackType) : "";
  const feedbackText = typeof body.feedbackText === "string" ? body.feedbackText.trim() : "";
  if (!blueprintId || !feedbackType || !feedbackText) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });

  const blueprint = await getBlueprintById(businessId, blueprintId);
  if (!blueprint || blueprint.discoveryId !== discoveryId) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const result = await captureBlueprintFeedback(
    {
      businessId,
      blueprintId,
      projectIntentId: blueprint.projectIntentId,
      sectionKey: typeof body.sectionKey === "string" ? body.sectionKey : null,
      fieldKey: typeof body.fieldKey === "string" ? body.fieldKey : null,
      feedbackType,
      feedbackText,
      clientApproved: typeof body.clientApproved === "boolean" ? body.clientApproved : null,
      sourceMeetingId: typeof body.sourceMeetingId === "string" ? body.sourceMeetingId : null,
    },
    access.actor,
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true, feedback: result.feedback });
}
