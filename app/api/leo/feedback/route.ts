/**
 * LEO-22C owner-only response feedback.
 * POST upsert rating. GET quality snapshot.
 * No Gmail send. No Living Book rewrite. No RED execution.
 */
import { NextResponse } from "next/server";

import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";
import { LEO_FEEDBACK_FAILURE_CATEGORIES, LEO_FEEDBACK_POLARITIES } from "@/app/leo/_lib/leoFeedbackTypes";
import {
  getLeoFeedbackQualitySnapshot,
  submitLeoResponseFeedback,
} from "@/app/leo/_lib/leoFeedbackService";
import { isLeoWorkspaceId } from "@/app/leo/_lib/leoWorkspaceModel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function deny() {
  return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
}

export async function GET() {
  const access = await resolveLeoAccess();
  if (!access.allowed) return deny();
  const snapshot = await getLeoFeedbackQualitySnapshot();
  return NextResponse.json({ ok: true, snapshot });
}

export async function POST(req: Request) {
  const access = await resolveLeoAccess();
  if (!access.allowed) return deny();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const raw = body as Record<string, unknown>;
  const polarity = raw.polarity;
  if (polarity !== "POSITIVE" && polarity !== "NEGATIVE") {
    return NextResponse.json({ ok: false, error: "invalid_polarity" }, { status: 400 });
  }
  const localResponseId = typeof raw.localResponseId === "string" ? raw.localResponseId.trim() : "";
  if (!localResponseId) {
    return NextResponse.json({ ok: false, error: "local_response_id_required" }, { status: 400 });
  }

  const failureCategory =
    typeof raw.failureCategory === "string" &&
    (LEO_FEEDBACK_FAILURE_CATEGORIES as readonly string[]).includes(raw.failureCategory)
      ? (raw.failureCategory as (typeof LEO_FEEDBACK_FAILURE_CATEGORIES)[number])
      : null;

  const expectedDestination =
    typeof raw.expectedDestination === "string" && isLeoWorkspaceId(raw.expectedDestination)
      ? raw.expectedDestination
      : null;

  const result = await submitLeoResponseFeedback({
    polarity,
    failureCategory,
    sessionId: typeof raw.sessionId === "string" ? raw.sessionId : null,
    leoTurnId: typeof raw.leoTurnId === "string" ? raw.leoTurnId : null,
    userTurnId: typeof raw.userTurnId === "string" ? raw.userTurnId : null,
    localResponseId,
    requestSnapshot: typeof raw.requestSnapshot === "string" ? raw.requestSnapshot : null,
    responseSnapshot: typeof raw.responseSnapshot === "string" ? raw.responseSnapshot : null,
    activeWorkspace: typeof raw.activeWorkspace === "string" ? raw.activeWorkspace : null,
    selectedCardId: typeof raw.selectedCardId === "string" ? raw.selectedCardId : null,
    selectedEntityRef: typeof raw.selectedEntityRef === "string" ? raw.selectedEntityRef : null,
    presentationIntentKind: typeof raw.presentationIntentKind === "string" ? raw.presentationIntentKind : null,
    ownerNote: typeof raw.ownerNote === "string" ? raw.ownerNote : null,
    expectedDestination,
    sourceRefs: Array.isArray(raw.sourceRefs) ? (raw.sourceRefs as never) : [],
    proposeFactCorrection: raw.proposeFactCorrection === true,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, persistenceState: result.persistenceState },
      { status: 503 },
    );
  }
  return NextResponse.json({
    ok: true,
    record: result.record,
    correction: result.correction,
    persistenceState: "PERSISTED",
  });
}

export async function PUT() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}
