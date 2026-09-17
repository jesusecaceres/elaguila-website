import { NextResponse, type NextRequest } from "next/server";
import { resolveDiyAccess } from "@/app/lib/business/diyConcierge/access";
import { findTemplateByKey } from "@/app/lib/business/diyConcierge/actionRegistry";
import { isEvidenceTypeAllowedForAction } from "@/app/lib/business/diyConcierge/logic";
import { addActionEvidence, getActionByKey } from "@/app/lib/business/diyConcierge/repository";
import type { DiyConciergeActor, DiyEvidenceType } from "@/app/lib/business/diyConcierge/types";
import { DIY_EVIDENCE_TYPES, MAX_NOTE_LENGTH } from "@/app/lib/business/diyConcierge/constants";

type EvidenceBody = { businessId?: unknown; actionKey?: unknown; evidenceType?: unknown; valueText?: unknown; referenceId?: unknown; ownerNote?: unknown };

/**
 * POST /api/dashboard/business/diy-concierge/actions/evidence — body: {businessId, actionKey,
 * evidenceType, valueText?, referenceId?, ownerNote?}. Evidence types are bounded and validated
 * per-action against the action's own template.requiredEvidenceTypes. referenceId only ever
 * points at an existing record's id (fact/listing/file) — this route never accepts or stores a
 * raw secret, credential, or a new upload target of its own.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: EvidenceBody;
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
  const evidenceType = typeof body.evidenceType === "string" ? (body.evidenceType as DiyEvidenceType) : null;
  const valueText = typeof body.valueText === "string" ? body.valueText : null;
  const referenceId = typeof body.referenceId === "string" ? body.referenceId : null;
  const ownerNote = typeof body.ownerNote === "string" ? body.ownerNote : null;

  if (!actionKey) return NextResponse.json({ ok: false, error: "missing_action_key" }, { status: 400 });
  if (!evidenceType || !DIY_EVIDENCE_TYPES.includes(evidenceType)) return NextResponse.json({ ok: false, error: "invalid_evidence_type" }, { status: 400 });
  if (!valueText && !referenceId) return NextResponse.json({ ok: false, error: "missing_value" }, { status: 400 });
  if (valueText && valueText.length > MAX_NOTE_LENGTH) return NextResponse.json({ ok: false, error: "value_too_long" }, { status: 400 });
  if (ownerNote && ownerNote.length > MAX_NOTE_LENGTH) return NextResponse.json({ ok: false, error: "note_too_long" }, { status: 400 });

  const action = await getActionByKey(access.business.id, actionKey);
  if (!action) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const template = findTemplateByKey(actionKey);
  if (!template || !isEvidenceTypeAllowedForAction(template, evidenceType)) {
    return NextResponse.json({ ok: false, error: "evidence_type_not_allowed_for_action" }, { status: 400 });
  }

  const actor: DiyConciergeActor = { type: "owner", authUserId: access.userId, email: access.email };
  const evidence = await addActionEvidence(actor, access.business.id, action.id, {
    evidenceType,
    valueText,
    referenceId,
    ownerNote,
    visibility: "owner_and_staff",
  });
  if (!evidence) return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, evidence });
}
