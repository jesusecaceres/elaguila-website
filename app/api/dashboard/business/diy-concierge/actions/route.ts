import { NextResponse, type NextRequest } from "next/server";
import { resolveDiyAccess } from "@/app/lib/business/diyConcierge/access";
import { getFullRun, getLatestCompletedRun } from "@/app/lib/business/healthMap/repository";
import { buildActionCard, selectActionsForRun } from "@/app/lib/business/diyConcierge/logic";
import { ensureActionInstance, getActionByKey, recordActionDecision } from "@/app/lib/business/diyConcierge/repository";
import type { DiyActionOwnerDecision, DiyConciergeActor } from "@/app/lib/business/diyConcierge/types";
import { isServiceRequestDecision } from "@/app/lib/business/diyConcierge/logic";
import { MAX_NOTE_LENGTH } from "@/app/lib/business/diyConcierge/constants";

/**
 * GET /api/dashboard/business/diy-concierge/actions?businessId= — the deterministic personalized
 * DIY Action Registry for this exact business, instantiated against the latest completed Health
 * Map run. Never generative: selection comes entirely from selectActionsForRun() (logic.ts)
 * against the code-resident actionRegistry.ts templates. Blocked/information-required dimensions
 * are always reported truthfully, never silently skipped.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const access = await resolveDiyAccess(req, businessId);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  if (access.entitlement.state !== "personalized_access_active") {
    return NextResponse.json({ ok: true, businessId: access.business.id, entitlementState: access.entitlement.state, actions: [], blocked: [] });
  }

  const latestRun = await getLatestCompletedRun(access.business.id);
  if (!latestRun) {
    return NextResponse.json({ ok: true, businessId: access.business.id, entitlementState: access.entitlement.state, actions: [], blocked: [] });
  }
  const full = await getFullRun(latestRun.id);
  if (!full) {
    return NextResponse.json({ ok: true, businessId: access.business.id, entitlementState: access.entitlement.state, actions: [], blocked: [] });
  }

  const { selected, blocked } = selectActionsForRun(full.dimensionResults, full.readiness);

  const actor: DiyConciergeActor = { type: "owner", authUserId: access.userId, email: access.email };
  const cards = [];
  for (const s of selected) {
    const instance = await ensureActionInstance(actor, access.business.id, {
      actionKey: s.template.actionKey,
      dimensionKey: s.template.dimensionKey,
      sourceRunId: full.run.id,
      sourceFindingId: null,
    });
    if (instance) cards.push(buildActionCard(s.template, instance));
  }

  return NextResponse.json({ ok: true, businessId: access.business.id, entitlementState: access.entitlement.state, actions: cards, blocked });
}

type DecisionBody = { businessId?: unknown; actionKey?: unknown; decision?: unknown; note?: unknown };

const VALID_DECISIONS: readonly DiyActionOwnerDecision[] = [
  "start", "continue", "mark_ready_for_review", "confirm_completion", "postpone", "resume", "decline",
  "request_guidance", "request_managed_service",
];

/**
 * POST /api/dashboard/business/diy-concierge/actions — body: {businessId, actionKey, decision,
 * note?}. Applies exactly one deterministic transition (logic.ts computeNextStatus). Guidance/
 * managed-service decisions do not change the action's own status here — they must be submitted
 * through /service-requests, which records the paid structured request separately.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: DecisionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const businessId = typeof body.businessId === "string" ? body.businessId : null;
  const access = await resolveDiyAccess(req, businessId);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  if (access.entitlement.state !== "personalized_access_active") {
    return NextResponse.json({ ok: false, error: "personalized_access_unavailable" }, { status: 403 });
  }

  const actionKey = typeof body.actionKey === "string" ? body.actionKey : "";
  const decision = typeof body.decision === "string" ? (body.decision as DiyActionOwnerDecision) : null;
  const note = typeof body.note === "string" ? body.note : null;

  if (!actionKey) return NextResponse.json({ ok: false, error: "missing_action_key" }, { status: 400 });
  if (!decision || !VALID_DECISIONS.includes(decision)) return NextResponse.json({ ok: false, error: "invalid_decision" }, { status: 400 });
  if (note !== null && note.length > MAX_NOTE_LENGTH) return NextResponse.json({ ok: false, error: "note_too_long" }, { status: 400 });

  if (isServiceRequestDecision(decision)) {
    return NextResponse.json({ ok: false, error: "use_service_requests_endpoint" }, { status: 400 });
  }

  const action = await getActionByKey(access.business.id, actionKey);
  if (!action) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const actor: DiyConciergeActor = { type: "owner", authUserId: access.userId, email: access.email };
  const result = await recordActionDecision(actor, access.business.id, actionKey, decision, note);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "not_found" ? 404 : 409 });
  }
  return NextResponse.json({ ok: true, action: result.action });
}
