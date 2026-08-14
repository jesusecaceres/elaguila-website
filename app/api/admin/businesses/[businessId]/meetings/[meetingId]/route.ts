/**
 * Program 5 — Meeting Studio staff API. Updates meeting status, adds attendees,
 * records consent, creates notes, imports transcripts.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireSalesWorkspaceAccess, actorHasCapability, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import {
  updateMeeting, addAttendee, recordConsent, createNote, importTranscript,
  promoteMeetingNote, getPromotionsForMeeting,
} from "@/app/lib/business/meetingStudio/repository";
import type {
  MeetingStatus, MeetingConsentType, MeetingConsentState, MeetingConsentMethod,
  MeetingLanguage, MeetingNoteType, MeetingNoteVisibility, MeetingNoteSensitivity,
  MeetingNotePromotionDestination, AttendeeType, AttendanceState,
} from "@/app/lib/business/meetingStudio/types";
import type { FactCategory, ContradictionType, ContradictionSeverity } from "@/app/lib/business/livingBook/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ businessId: string; meetingId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_meeting_studio")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { businessId, meetingId } = await params;
  const promotions = await getPromotionsForMeeting(meetingId, businessId);
  return NextResponse.json({ promotions });
}

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

  if (action === "promote_note") {
    if (!actorHasCapability(access.actor, "review_meeting_notes")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const noteId = body.noteId as string | undefined;
    const destination = body.destination as MeetingNotePromotionDestination | undefined;
    if (!noteId || !destination) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    const validDestinations: MeetingNotePromotionDestination[] = ["fact", "unknown", "contradiction", "correction"];
    if (!validDestinations.includes(destination)) {
      return NextResponse.json({ error: "invalid_destination" }, { status: 400 });
    }

    let factInput: { factKey: string; factCategory: FactCategory; displayValue: string } | undefined;
    let unknownInput: { questionLabel: string } | undefined;
    let contradictionInput: { claimALabel: string; claimBLabel: string; contradictionType: ContradictionType; severity: ContradictionSeverity } | undefined;

    if (destination === "fact") {
      const factKey = body.factKey as string | undefined;
      const factCategory = body.factCategory as FactCategory | undefined;
      if (!factKey?.trim() || !factCategory) {
        return NextResponse.json({ error: "fact_key_and_category_required" }, { status: 400 });
      }
      factInput = { factKey, factCategory, displayValue: body.displayValue ?? "" };
    }

    if (destination === "unknown") {
      unknownInput = { questionLabel: body.questionLabel ?? "" };
    }

    if (destination === "contradiction") {
      const claimALabel = body.claimALabel as string | undefined;
      const claimBLabel = body.claimBLabel as string | undefined;
      if (!claimALabel?.trim()) return NextResponse.json({ error: "claim_a_label_required" }, { status: 400 });
      if (!claimBLabel?.trim()) return NextResponse.json({ error: "claim_b_label_required" }, { status: 400 });
      contradictionInput = {
        claimALabel,
        claimBLabel,
        contradictionType: (body.contradictionType as ContradictionType) ?? "fact_vs_fact",
        severity: (body.severity as ContradictionSeverity) ?? "medium",
      };
    }

    const result = await promoteMeetingNote({
      noteId, meetingId, businessId, destination,
      fact: factInput,
      unknown: unknownInput,
      contradiction: contradictionInput,
    }, actor);

    if (!result.ok) {
      if (result.error === "already_promoted") {
        return NextResponse.json({ error: result.error }, { status: 409 });
      }
      if (result.error === "note_not_found") {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      if (result.error === "only_staff_may_promote" || result.error === "correction_promotion_deferred") {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      destinationId: result.destinationId,
      destinationType: result.destinationType,
    }, { status: 201 });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
