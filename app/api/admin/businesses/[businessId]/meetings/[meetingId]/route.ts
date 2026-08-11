/**
 * Program 5 — Meeting Studio staff API. Updates meeting status, adds attendees,
 * records consent, creates notes, imports transcripts.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireSalesWorkspaceAccess, actorHasCapability, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import {
  updateMeeting, addAttendee, recordConsent, createNote, importTranscript,
} from "@/app/lib/business/meetingStudio/repository";
import type {
  MeetingStatus, MeetingConsentType, MeetingConsentState, MeetingConsentMethod,
  MeetingLanguage, MeetingNoteType, MeetingNoteVisibility, MeetingNoteSensitivity,
  AttendeeType, AttendanceState,
} from "@/app/lib/business/meetingStudio/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessId: string; meetingId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_meeting_studio")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { businessId, meetingId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const action = body.action as string | undefined;
  if (!action) return NextResponse.json({ error: "missing_action" }, { status: 400 });

  const actor = { type: "staff" as const, rosterId: access.actor.rosterId, authUserId: access.actor.authUserId, email: access.actor.email, role: access.actor.role };

  if (action === "update_status") {
    if (!actorHasCapability(access.actor, "conduct_business_meeting")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const status = body.status as MeetingStatus | undefined;
    if (!status) return NextResponse.json({ error: "missing_status" }, { status: 400 });
    const result = await updateMeeting(meetingId, businessId, { status }, actor);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ meeting: result.meeting });
  }

  if (action === "add_attendee") {
    if (!actorHasCapability(access.actor, "prepare_business_meeting")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const attendeeType = body.attendeeType as AttendeeType | undefined;
    const displayName = body.displayName as string | undefined;
    if (!attendeeType || !displayName) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    const result = await addAttendee({
      meetingId, businessId, attendeeType, displayName,
      contactReference: body.contactReference ?? null,
      staffRosterId: body.staffRosterId ?? null,
      staffAuthUserId: body.staffAuthUserId ?? null,
      language: body.language ?? null,
      attendanceState: body.attendanceState as AttendanceState | undefined,
    }, actor);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ attendee: result.attendee }, { status: 201 });
  }

  if (action === "record_consent") {
    if (!actorHasCapability(access.actor, "record_meeting_consent")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const consentType = body.consentType as MeetingConsentType | undefined;
    const state = body.state as MeetingConsentState | undefined;
    const method = body.method as MeetingConsentMethod | undefined;
    const language = body.language as MeetingLanguage | undefined;
    if (!consentType || !state || !method || !language) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    const result = await recordConsent({
      meetingId, businessId, consentType, state, method, language,
      scopeDetails: body.scopeDetails ?? null,
    }, actor);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ consent: result.consent }, { status: 201 });
  }

  if (action === "create_note") {
    if (!actorHasCapability(access.actor, "record_meeting_notes")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const noteType = body.noteType as MeetingNoteType | undefined;
    const content = body.content as string | undefined;
    if (!noteType || !content) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    const result = await createNote({
      meetingId, businessId, noteType, content,
      visibility: (body.visibility as MeetingNoteVisibility) ?? "staff_only",
      sensitivity: (body.sensitivity as MeetingNoteSensitivity) ?? "normal",
      potentialFactKey: body.potentialFactKey ?? null,
    }, actor);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ note: result.note }, { status: 201 });
  }

  if (action === "import_transcript") {
    if (!actorHasCapability(access.actor, "conduct_business_meeting")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const language = body.language as MeetingLanguage | undefined;
    if (!language) return NextResponse.json({ error: "missing_language" }, { status: 400 });
    const result = await importTranscript({
      meetingId, businessId, language,
      transcriptText: body.transcriptText ?? null,
      storagePath: body.storagePath ?? null,
      consentRecordId: body.consentRecordId ?? null,
    }, actor);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ transcript: result.transcript }, { status: 201 });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
