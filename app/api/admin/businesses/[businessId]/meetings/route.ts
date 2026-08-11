/**
 * Program 5 — Meeting Studio staff API. Creates a new meeting.
 * Requires view_meeting_studio + prepare_business_meeting capabilities.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireSalesWorkspaceAccess, actorHasCapability, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createMeeting } from "@/app/lib/business/meetingStudio/repository";
import type { MeetingType, MeetingLanguage } from "@/app/lib/business/meetingStudio/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_meeting_studio") || !actorHasCapability(access.actor, "prepare_business_meeting")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { businessId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const meetingType = body.meetingType as MeetingType | undefined;
  const language = (body.language as MeetingLanguage | undefined) ?? "es";
  const scheduledAt = body.scheduledAt as string | null | undefined;

  if (!meetingType || !["discovery", "check_in", "proposal_review", "follow_up", "intake"].includes(meetingType)) {
    return NextResponse.json({ error: "invalid_meeting_type" }, { status: 400 });
  }

  const result = await createMeeting(
    { businessId, meetingType, language, scheduledAt: scheduledAt ?? null },
    { type: "staff", rosterId: access.actor.rosterId, authUserId: access.actor.authUserId, email: access.actor.email, role: access.actor.role },
  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ meeting: result.meeting }, { status: 201 });
}
