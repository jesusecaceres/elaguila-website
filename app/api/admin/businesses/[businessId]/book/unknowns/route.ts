import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToLivingBookActor } from "@/app/admin/_lib/livingBookActor";
import { FACT_VISIBILITIES, UNKNOWN_PRIORITIES } from "@/app/lib/business/livingBook/constants";
import { createUnknown } from "@/app/lib/business/livingBook/repository";
import type { UnknownChannel } from "@/app/lib/business/livingBook/types";

export const dynamic = "force-dynamic";

const PRIORITY_VALUES = new Set<string>(UNKNOWN_PRIORITIES.map((o) => o.value));
const VISIBILITY_VALUES = new Set<string>(FACT_VISIBILITIES.map((o) => o.value));
const CHANNEL_VALUES = new Set<UnknownChannel>(["discovery_session", "staff_followup", "owner_dashboard"]);

/** POST — create an unknown (a legitimate "we don't know this yet" state). */
export async function POST(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "manage_unknowns")) {
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

  const questionLabel = typeof b.questionLabel === "string" ? b.questionLabel.trim() : "";
  if (!questionLabel) return NextResponse.json({ ok: false, error: "empty_question_label" }, { status: 400 });
  const priority = typeof b.priority === "string" && PRIORITY_VALUES.has(b.priority) ? b.priority : "medium";
  const visibility = typeof b.visibility === "string" && VISIBILITY_VALUES.has(b.visibility) ? b.visibility : "staff_only";
  const assignedChannel = typeof b.assignedChannel === "string" && CHANNEL_VALUES.has(b.assignedChannel as UnknownChannel) ? (b.assignedChannel as UnknownChannel) : null;
  const whyItMatters = typeof b.whyItMatters === "string" && b.whyItMatters.trim() ? b.whyItMatters.trim() : null;
  const whoCanAnswer = typeof b.whoCanAnswer === "string" && b.whoCanAnswer.trim() ? b.whoCanAnswer.trim() : null;

  const result = await createUnknown(
    { businessId, questionLabel, whyItMatters, whoCanAnswer, priority: priority as never, assignedChannel, visibility: visibility as never },
    staffActorToLivingBookActor(access.actor),
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
