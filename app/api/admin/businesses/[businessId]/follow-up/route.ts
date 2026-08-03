import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { completeFollowUp, getCurrentFollowUp, markFollowUpStatus, upsertCurrentFollowUp } from "@/app/admin/_lib/businessWorkspaceData";
import { SALES_CONTACT_METHODS, type SalesContactMethod } from "@/app/admin/_lib/salesWorkspaceLogic";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  const { businessId } = await ctx.params;
  const followUp = await getCurrentFollowUp(businessId);
  return NextResponse.json({ ok: true, followUp });
}

export async function POST(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "create_follow_up")) {
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
  const scheduledDate = b.scheduledDate;
  if (typeof scheduledDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    return NextResponse.json({ ok: false, error: "invalid_scheduled_date" }, { status: 400 });
  }
  const purpose = b.purpose;
  if (typeof purpose !== "string" || !purpose.trim()) {
    return NextResponse.json({ ok: false, error: "empty_purpose" }, { status: 400 });
  }
  const contactMethod: SalesContactMethod | null =
    typeof b.contactMethod === "string" && SALES_CONTACT_METHODS.some((o) => o.value === b.contactMethod) ? (b.contactMethod as SalesContactMethod) : null;
  const scheduledTime = typeof b.scheduledTime === "string" && b.scheduledTime.trim() ? b.scheduledTime : null;
  const assignedRosterId = typeof b.assignedRosterId === "string" && b.assignedRosterId.trim() ? b.assignedRosterId : null;

  const result = await upsertCurrentFollowUp(
    {
      businessId,
      scheduledDate,
      scheduledTime,
      contactMethod,
      purpose,
      assignedRosterId,
    },
    access.actor,
  );
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

/** Quick actions: complete, cancel ("not a fit"), or mark waiting on owner. */
export async function PATCH(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "create_follow_up")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;
  const current = await getCurrentFollowUp(businessId);
  if (!current) {
    return NextResponse.json({ ok: false, error: "no_current_follow_up" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const action = (body as { action?: unknown }).action;
  const outcome = typeof (body as { outcome?: unknown }).outcome === "string" ? ((body as { outcome: string }).outcome as string) : null;

  let success: boolean;
  if (action === "complete") {
    success = await completeFollowUp(current.id, businessId, outcome, access.actor);
  } else if (action === "cancel") {
    success = await markFollowUpStatus(current.id, businessId, "cancelled", access.actor);
  } else if (action === "waiting_on_owner") {
    success = await markFollowUpStatus(current.id, businessId, "waiting_on_owner", access.actor);
  } else {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }
  if (!success) {
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
