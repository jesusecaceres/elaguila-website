import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { salesActorToLivingBookActor } from "@/app/admin/_lib/livingBookActor";
import { CONSENT_STATES, CONFIDENCE_LEVELS, EVIDENCE_TYPES, FACT_VISIBILITIES, MAX_EVIDENCE_CAPTURED_TEXT_LENGTH } from "@/app/lib/business/livingBook/constants";
import { addEvidence } from "@/app/lib/business/livingBook/repository";

export const dynamic = "force-dynamic";

const EVIDENCE_TYPE_VALUES = new Set<string>(EVIDENCE_TYPES.map((o) => o.value));
const CONSENT_VALUES = new Set<string>(CONSENT_STATES.map((o) => o.value));
const CONFIDENCE_VALUES = new Set<string>(CONFIDENCE_LEVELS.map((o) => o.value));
const VISIBILITY_VALUES = new Set<string>(FACT_VISIBILITIES.map((o) => o.value));

/** POST — attach one piece of evidence, optionally linked to a fact or unknown. */
export async function POST(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "create_evidence")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const evidenceType = typeof b.evidenceType === "string" && EVIDENCE_TYPE_VALUES.has(b.evidenceType) ? b.evidenceType : null;
  if (!evidenceType) return NextResponse.json({ ok: false, error: "invalid_evidence_type" }, { status: 400 });
  const sourceTitle = typeof b.sourceTitle === "string" ? b.sourceTitle.trim() : "";
  if (!sourceTitle) return NextResponse.json({ ok: false, error: "empty_source_title" }, { status: 400 });
  const capturedText = typeof b.capturedText === "string" && b.capturedText.trim() ? b.capturedText.trim().slice(0, MAX_EVIDENCE_CAPTURED_TEXT_LENGTH) : null;
  const consentState = typeof b.consentState === "string" && CONSENT_VALUES.has(b.consentState) ? b.consentState : "not_required";
  const reliability = typeof b.reliability === "string" && CONFIDENCE_VALUES.has(b.reliability) ? b.reliability : "medium";
  const visibility = typeof b.visibility === "string" && VISIBILITY_VALUES.has(b.visibility) ? b.visibility : "staff_only";
  const sourceUrl = typeof b.sourceUrl === "string" && b.sourceUrl.trim() ? b.sourceUrl.trim() : null;
  const sourceDate = typeof b.sourceDate === "string" && b.sourceDate.trim() ? b.sourceDate : null;
  const relatedFactId = typeof b.relatedFactId === "string" && b.relatedFactId.trim() ? b.relatedFactId : null;
  const relatedUnknownId = typeof b.relatedUnknownId === "string" && b.relatedUnknownId.trim() ? b.relatedUnknownId : null;

  const result = await addEvidence(
    {
      businessId,
      relatedFactId,
      relatedUnknownId,
      evidenceType: evidenceType as never,
      sourceTitle,
      sourceUrl,
      capturedText,
      sourceDate,
      consentState: consentState as never,
      reliability: reliability as never,
      visibility: visibility as never,
    },
    salesActorToLivingBookActor(access.actor),
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
