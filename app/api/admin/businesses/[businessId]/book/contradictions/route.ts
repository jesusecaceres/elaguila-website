import { NextResponse } from "next/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { CONTRADICTION_SEVERITIES, CONTRADICTION_TYPES } from "@/app/lib/business/livingBook/constants";
import { createContradiction } from "@/app/lib/business/livingBook/repository";

export const dynamic = "force-dynamic";

const TYPE_VALUES = new Set<string>(CONTRADICTION_TYPES.map((o) => o.value));
const SEVERITY_VALUES = new Set<string>(CONTRADICTION_SEVERITIES.map((o) => o.value));

/** POST — record two disagreeing claims side by side. Requires resolve_contradictions (manager+). */
export async function POST(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("resolve_contradictions");
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  }
  const { businessId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const contradictionType = typeof b.contradictionType === "string" && TYPE_VALUES.has(b.contradictionType) ? b.contradictionType : null;
  if (!contradictionType) return NextResponse.json({ ok: false, error: "invalid_contradiction_type" }, { status: 400 });
  const severity = typeof b.severity === "string" && SEVERITY_VALUES.has(b.severity) ? b.severity : "medium";
  const claimALabel = typeof b.claimALabel === "string" ? b.claimALabel.trim() : "";
  const claimBLabel = typeof b.claimBLabel === "string" ? b.claimBLabel.trim() : "";
  if (!claimALabel || !claimBLabel) return NextResponse.json({ ok: false, error: "empty_claim_label" }, { status: 400 });

  const result = await createContradiction(
    {
      businessId,
      contradictionType: contradictionType as never,
      severity: severity as never,
      claimALabel,
      claimAFactId: typeof b.claimAFactId === "string" ? b.claimAFactId : null,
      claimAEvidenceId: typeof b.claimAEvidenceId === "string" ? b.claimAEvidenceId : null,
      claimBLabel,
      claimBFactId: typeof b.claimBFactId === "string" ? b.claimBFactId : null,
      claimBEvidenceId: typeof b.claimBEvidenceId === "string" ? b.claimBEvidenceId : null,
    },
    access.actor,
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
