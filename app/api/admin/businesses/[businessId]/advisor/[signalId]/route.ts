/**
 * Program 7 — Admin API for Advisor signal lifecycle actions.
 * Path carries both businessId and signalId so a signal cannot be mutated across businesses.
 */
import { NextResponse } from "next/server";
import {
  actorHasCapability,
  denialStatusCode,
  requireSalesWorkspaceAccess,
  salesActorToAdvisorActor,
} from "@/app/admin/_lib/businessWorkspaceAccess";
import { isAdvisorEnabled } from "@/app/lib/business/advisor/featureFlag";
import { canAcknowledgeSignal, canDismissSignal, canResolveSignal } from "@/app/lib/business/advisor/logic";
import { acknowledgeSignal, dismissSignal, getSignalById, resolveSignal } from "@/app/lib/business/advisor/repository";

const VALID_ACTIONS = ["acknowledge", "resolve", "dismiss"] as const;
type AdvisorAction = (typeof VALID_ACTIONS)[number];

function isAdvisorAction(value: unknown): value is AdvisorAction {
  return typeof value === "string" && (VALID_ACTIONS as readonly string[]).includes(value);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string; signalId: string }> },
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

  const { businessId, signalId } = await params;
  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (!isAdvisorAction(action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const existing = await getSignalById(businessId, signalId);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (action === "acknowledge" && !canAcknowledgeSignal(existing.status)) {
    return NextResponse.json({ error: "invalid_status_transition" }, { status: 400 });
  }
  if (action === "resolve" && !canResolveSignal(existing.status)) {
    return NextResponse.json({ error: "invalid_status_transition" }, { status: 400 });
  }
  if (action === "dismiss" && !canDismissSignal(existing.status)) {
    return NextResponse.json({ error: "invalid_status_transition" }, { status: 400 });
  }

  const actor = salesActorToAdvisorActor(access.actor);
  const updated =
    action === "acknowledge"
      ? await acknowledgeSignal(businessId, signalId, actor)
      : action === "resolve"
        ? await resolveSignal(businessId, signalId, actor)
        : await dismissSignal(businessId, signalId, actor);

  if (!updated) {
    return NextResponse.json({ error: "mutation_failed" }, { status: 400 });
  }
  return NextResponse.json({ signal: updated });
}
