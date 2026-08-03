import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createSalesNote, listSalesNotes } from "@/app/admin/_lib/businessWorkspaceData";
import {
  SALES_CONTACT_METHODS,
  SALES_NOTE_OUTCOMES,
  SALES_NOTE_TYPES,
  type SalesContactMethod,
  type SalesNoteOutcome,
  type SalesNoteType,
} from "@/app/admin/_lib/salesWorkspaceLogic";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "view_all_staff_notes")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;
  const notes = await listSalesNotes(businessId);
  return NextResponse.json({ ok: true, notes });
}

export async function POST(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "create_internal_note")) {
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

  const noteType = b.noteType;
  if (typeof noteType !== "string" || !SALES_NOTE_TYPES.some((o) => o.value === noteType)) {
    return NextResponse.json({ ok: false, error: "invalid_note_type" }, { status: 400 });
  }
  const noteBody = b.body;
  if (typeof noteBody !== "string" || !noteBody.trim()) {
    return NextResponse.json({ ok: false, error: "empty_body" }, { status: 400 });
  }
  const visibility = b.visibility === "private" ? "private" : "internal";
  const contactMethod: SalesContactMethod | null =
    typeof b.contactMethod === "string" && SALES_CONTACT_METHODS.some((o) => o.value === b.contactMethod) ? (b.contactMethod as SalesContactMethod) : null;
  const outcome: SalesNoteOutcome | null =
    typeof b.outcome === "string" && SALES_NOTE_OUTCOMES.some((o) => o.value === b.outcome) ? (b.outcome as SalesNoteOutcome) : null;
  const followUpDate = typeof b.followUpDate === "string" && b.followUpDate.trim() ? b.followUpDate : null;

  const result = await createSalesNote(
    {
      businessId,
      noteType: noteType as SalesNoteType,
      body: noteBody,
      visibility,
      contactMethod,
      outcome,
      followUpDate,
    },
    access.actor,
  );
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
