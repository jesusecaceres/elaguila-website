/**
 * Program 5 — Meeting Studio repository. Server-only, always via getAdminSupabase()
 * (service-role), matching the Program 4 / Living Book / Stewardship pattern exactly.
 * Every write requires a MeetingActor — no bare strings. Meeting notes never directly
 * mutate business_facts. Consent is append-only. No fake recording/transcription.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import {
  canTransitionMeetingStatus, noteSourceClassForType, noteRequiresConfirmation,
  eligiblePromotionDestinations, mapNoteSourceClassToLivingBook, confidenceForNoteSourceClass,
} from "./logic";
import type {
  BusinessMeeting, MeetingActor, MeetingAttendee, MeetingConsentRecord, MeetingConsentMethod,
  MeetingConsentState, MeetingConsentType, MeetingLanguage, MeetingNote, MeetingNoteSensitivity,
  MeetingNoteType, MeetingNoteVisibility, MeetingNotePromotionDestination, MeetingNotePromotion,
  MeetingStatus, MeetingTranscriptImport, MeetingType,
  TranscriptImportMethod, TranscriptImportStatus,
} from "./types";
import { upsertFact, createUnknown, createContradiction } from "@/app/lib/business/livingBook/repository";
import type {
  LivingBookActor, FactCategory, ContradictionType, ContradictionSeverity,
} from "@/app/lib/business/livingBook/types";

function actorRosterId(actor: MeetingActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}

function actorRole(actor: MeetingActor): string {
  return actor.type === "staff" ? actor.role : "business_owner";
}

const MEETING_COLUMNS =
  "id, business_id, meeting_type, status, language, scheduled_at, started_at, completed_at, agenda_snapshot, briefing_snapshot, recap_es, recap_en, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, completed_by_roster_id, completed_by_auth_user_id, completed_by_email, completed_by_role, created_at, updated_at";

function mapMeetingRow(row: Record<string, unknown>): BusinessMeeting {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    meetingType: row.meeting_type as MeetingType,
    status: row.status as MeetingStatus,
    language: row.language as MeetingLanguage,
    scheduledAt: (row.scheduled_at as string | null) ?? null,
    startedAt: (row.started_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    agendaSnapshot: (row.agenda_snapshot as Record<string, unknown> | null) ?? null,
    briefingSnapshot: (row.briefing_snapshot as Record<string, unknown> | null) ?? null,
    recapEs: (row.recap_es as string | null) ?? null,
    recapEn: (row.recap_en as string | null) ?? null,
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    completedByRosterId: (row.completed_by_roster_id as string | null) ?? null,
    completedByAuthUserId: (row.completed_by_auth_user_id as string | null) ?? null,
    completedByEmail: (row.completed_by_email as string | null) ?? null,
    completedByRole: (row.completed_by_role as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const ATTENDEE_COLUMNS =
  "id, meeting_id, business_id, attendee_type, display_name, contact_reference, staff_roster_id, staff_auth_user_id, language, attendance_state, created_at";

function mapAttendeeRow(row: Record<string, unknown>): MeetingAttendee {
  return {
    id: String(row.id),
    meetingId: String(row.meeting_id),
    businessId: String(row.business_id),
    attendeeType: row.attendee_type as MeetingAttendee["attendeeType"],
    displayName: String(row.display_name),
    contactReference: (row.contact_reference as string | null) ?? null,
    staffRosterId: (row.staff_roster_id as string | null) ?? null,
    staffAuthUserId: (row.staff_auth_user_id as string | null) ?? null,
    language: (row.language as MeetingLanguage | null) ?? null,
    attendanceState: row.attendance_state as MeetingAttendee["attendanceState"],
    createdAt: String(row.created_at),
  };
}

const CONSENT_COLUMNS =
  "id, meeting_id, business_id, consent_type, state, method, language, recorded_actor_type, recorded_by_roster_id, recorded_by_auth_user_id, recorded_by_email, recorded_by_role, scope_details, created_at";

function mapConsentRow(row: Record<string, unknown>): MeetingConsentRecord {
  return {
    id: String(row.id),
    meetingId: String(row.meeting_id),
    businessId: String(row.business_id),
    consentType: row.consent_type as MeetingConsentType,
    state: row.state as MeetingConsentState,
    method: row.method as MeetingConsentMethod,
    language: row.language as MeetingLanguage,
    recordedActorType: row.recorded_actor_type as "staff" | "owner",
    recordedByRosterId: (row.recorded_by_roster_id as string | null) ?? null,
    recordedByAuthUserId: String(row.recorded_by_auth_user_id),
    recordedByEmail: String(row.recorded_by_email),
    recordedByRole: String(row.recorded_by_role),
    scopeDetails: (row.scope_details as Record<string, unknown> | null) ?? null,
    createdAt: String(row.created_at),
  };
}

const NOTE_COLUMNS =
  "id, meeting_id, business_id, note_type, content, source_class, visibility, sensitivity, potential_fact_key, requires_confirmation, recorded_actor_type, recorded_by_roster_id, recorded_by_auth_user_id, recorded_by_email, recorded_by_role, created_at";

function mapNoteRow(row: Record<string, unknown>): MeetingNote {
  return {
    id: String(row.id),
    meetingId: String(row.meeting_id),
    businessId: String(row.business_id),
    noteType: row.note_type as MeetingNoteType,
    content: String(row.content),
    sourceClass: row.source_class as MeetingNote["sourceClass"],
    visibility: row.visibility as MeetingNoteVisibility,
    sensitivity: row.sensitivity as MeetingNoteSensitivity,
    potentialFactKey: (row.potential_fact_key as string | null) ?? null,
    requiresConfirmation: Boolean(row.requires_confirmation),
    recordedActorType: row.recorded_actor_type as "staff" | "owner",
    recordedByRosterId: (row.recorded_by_roster_id as string | null) ?? null,
    recordedByAuthUserId: String(row.recorded_by_auth_user_id),
    recordedByEmail: String(row.recorded_by_email),
    recordedByRole: String(row.recorded_by_role),
    createdAt: String(row.created_at),
  };
}

const TRANSCRIPT_COLUMNS =
  "id, meeting_id, business_id, import_method, language, transcript_text, storage_path, consent_record_id, status, imported_actor_type, imported_by_roster_id, imported_by_auth_user_id, imported_by_email, imported_by_role, created_at, reviewed_at";

function mapTranscriptRow(row: Record<string, unknown>): MeetingTranscriptImport {
  return {
    id: String(row.id),
    meetingId: String(row.meeting_id),
    businessId: String(row.business_id),
    importMethod: row.import_method as TranscriptImportMethod,
    language: row.language as MeetingLanguage,
    transcriptText: (row.transcript_text as string | null) ?? null,
    storagePath: (row.storage_path as string | null) ?? null,
    consentRecordId: (row.consent_record_id as string | null) ?? null,
    status: row.status as TranscriptImportStatus,
    importedActorType: row.imported_actor_type as "staff" | "owner",
    importedByRosterId: (row.imported_by_roster_id as string | null) ?? null,
    importedByAuthUserId: String(row.imported_by_auth_user_id),
    importedByEmail: String(row.imported_by_email),
    importedByRole: String(row.imported_by_role),
    createdAt: String(row.created_at),
    reviewedAt: (row.reviewed_at as string | null) ?? null,
  };
}

export type CreateMeetingInput = {
  businessId: string;
  meetingType: MeetingType;
  language: MeetingLanguage;
  scheduledAt: string | null;
};

export async function createMeeting(
  input: CreateMeetingInput,
  actor: MeetingActor,
): Promise<{ ok: true; meeting: BusinessMeeting } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_meetings")
    .insert({
      business_id: input.businessId,
      meeting_type: input.meetingType,
      status: "planned",
      language: input.language,
      scheduled_at: input.scheduledAt,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select(MEETING_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, meeting: mapMeetingRow(data as Record<string, unknown>) };
}

export async function listMeetingsForBusiness(businessId: string): Promise<BusinessMeeting[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_meetings")
    .select(MEETING_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapMeetingRow);
}

export async function getMeetingById(meetingId: string, businessId: string): Promise<BusinessMeeting | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_meetings")
    .select(MEETING_COLUMNS)
    .eq("id", meetingId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapMeetingRow(data as Record<string, unknown>);
}

export type UpdateMeetingInput = {
  status?: MeetingStatus;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  recapEs?: string | null;
  recapEn?: string | null;
  agendaSnapshot?: Record<string, unknown> | null;
  briefingSnapshot?: Record<string, unknown> | null;
};

export async function updateMeeting(
  meetingId: string,
  businessId: string,
  patch: UpdateMeetingInput,
  actor: MeetingActor,
): Promise<{ ok: true; meeting: BusinessMeeting } | { ok: false; error: string }> {
  const existing = await getMeetingById(meetingId, businessId);
  if (!existing) return { ok: false, error: "meeting_not_found" };

  if (patch.status && patch.status !== existing.status) {
    if (!canTransitionMeetingStatus(existing.status, patch.status)) {
      return { ok: false, error: "invalid_status_transition" };
    }
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status) update.status = patch.status;
  if (patch.scheduledAt !== undefined) update.scheduled_at = patch.scheduledAt;
  if (patch.startedAt !== undefined) update.started_at = patch.startedAt;
  if (patch.completedAt !== undefined) update.completed_at = patch.completedAt;
  if (patch.recapEs !== undefined) update.recap_es = patch.recapEs;
  if (patch.recapEn !== undefined) update.recap_en = patch.recapEn;
  if (patch.agendaSnapshot !== undefined) update.agenda_snapshot = patch.agendaSnapshot;
  if (patch.briefingSnapshot !== undefined) update.briefing_snapshot = patch.briefingSnapshot;

  if (patch.status === "completed") {
    update.completed_by_roster_id = actorRosterId(actor);
    update.completed_by_auth_user_id = actor.authUserId;
    update.completed_by_email = actor.email;
    update.completed_by_role = actorRole(actor);
    if (!update.completed_at) update.completed_at = new Date().toISOString();
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_meetings")
    .update(update)
    .eq("id", meetingId)
    .eq("business_id", businessId)
    .select(MEETING_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "update_failed" };
  return { ok: true, meeting: mapMeetingRow(data as Record<string, unknown>) };
}

export type AddAttendeeInput = {
  meetingId: string;
  businessId: string;
  attendeeType: MeetingAttendee["attendeeType"];
  displayName: string;
  contactReference?: string | null;
  staffRosterId?: string | null;
  staffAuthUserId?: string | null;
  language?: MeetingLanguage | null;
  attendanceState?: MeetingAttendee["attendanceState"];
};

export async function addAttendee(
  input: AddAttendeeInput,
  _actor: MeetingActor,
): Promise<{ ok: true; attendee: MeetingAttendee } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_meeting_attendees")
    .insert({
      meeting_id: input.meetingId,
      business_id: input.businessId,
      attendee_type: input.attendeeType,
      display_name: input.displayName.trim(),
      contact_reference: input.contactReference ?? null,
      staff_roster_id: input.staffRosterId ?? null,
      staff_auth_user_id: input.staffAuthUserId ?? null,
      language: input.language ?? null,
      attendance_state: input.attendanceState ?? "tentative",
    })
    .select(ATTENDEE_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, attendee: mapAttendeeRow(data as Record<string, unknown>) };
}

export async function listAttendeesForMeeting(meetingId: string, businessId: string): Promise<MeetingAttendee[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_meeting_attendees")
    .select(ATTENDEE_COLUMNS)
    .eq("meeting_id", meetingId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapAttendeeRow);
}

export type RecordConsentInput = {
  meetingId: string;
  businessId: string;
  consentType: MeetingConsentType;
  state: MeetingConsentState;
  method: MeetingConsentMethod;
  language: MeetingLanguage;
  scopeDetails?: Record<string, unknown> | null;
};

export async function recordConsent(
  input: RecordConsentInput,
  actor: MeetingActor,
): Promise<{ ok: true; consent: MeetingConsentRecord } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_meeting_consents")
    .insert({
      meeting_id: input.meetingId,
      business_id: input.businessId,
      consent_type: input.consentType,
      state: input.state,
      method: input.method,
      language: input.language,
      recorded_actor_type: actor.type,
      recorded_by_roster_id: actorRosterId(actor),
      recorded_by_auth_user_id: actor.authUserId,
      recorded_by_email: actor.email,
      recorded_by_role: actorRole(actor),
      scope_details: input.scopeDetails ?? null,
    })
    .select(CONSENT_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, consent: mapConsentRow(data as Record<string, unknown>) };
}

export async function listConsentsForMeeting(meetingId: string, businessId: string): Promise<MeetingConsentRecord[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_meeting_consents")
    .select(CONSENT_COLUMNS)
    .eq("meeting_id", meetingId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapConsentRow);
}

export type CreateNoteInput = {
  meetingId: string;
  businessId: string;
  noteType: MeetingNoteType;
  content: string;
  visibility: MeetingNoteVisibility;
  sensitivity: MeetingNoteSensitivity;
  potentialFactKey?: string | null;
};

export async function createNote(
  input: CreateNoteInput,
  actor: MeetingActor,
): Promise<{ ok: true; note: MeetingNote } | { ok: false; error: string }> {
  const trimmed = input.content.trim();
  if (!trimmed) return { ok: false, error: "empty_content" };
  if (trimmed.length > 8000) return { ok: false, error: "content_too_long" };

  const sourceClass = noteSourceClassForType(input.noteType);
  const requiresConfirmation = noteRequiresConfirmation(input.noteType);

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_meeting_notes")
    .insert({
      meeting_id: input.meetingId,
      business_id: input.businessId,
      note_type: input.noteType,
      content: trimmed,
      source_class: sourceClass,
      visibility: input.visibility,
      sensitivity: input.sensitivity,
      potential_fact_key: input.potentialFactKey ?? null,
      requires_confirmation: requiresConfirmation,
      recorded_actor_type: actor.type,
      recorded_by_roster_id: actorRosterId(actor),
      recorded_by_auth_user_id: actor.authUserId,
      recorded_by_email: actor.email,
      recorded_by_role: actorRole(actor),
    })
    .select(NOTE_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, note: mapNoteRow(data as Record<string, unknown>) };
}

export async function listNotesForMeeting(meetingId: string, businessId: string): Promise<MeetingNote[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_meeting_notes")
    .select(NOTE_COLUMNS)
    .eq("meeting_id", meetingId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapNoteRow);
}

export type ImportTranscriptInput = {
  meetingId: string;
  businessId: string;
  language: MeetingLanguage;
  transcriptText: string | null;
  storagePath: string | null;
  consentRecordId: string | null;
};

export async function importTranscript(
  input: ImportTranscriptInput,
  actor: MeetingActor,
): Promise<{ ok: true; transcript: MeetingTranscriptImport } | { ok: false; error: string }> {
  if (!input.transcriptText && !input.storagePath) {
    return { ok: false, error: "transcript_text_or_storage_path_required" };
  }
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_meeting_transcript_imports")
    .insert({
      meeting_id: input.meetingId,
      business_id: input.businessId,
      import_method: "manual_import",
      language: input.language,
      transcript_text: input.transcriptText,
      storage_path: input.storagePath,
      consent_record_id: input.consentRecordId,
      status: "imported",
      imported_actor_type: actor.type,
      imported_by_roster_id: actorRosterId(actor),
      imported_by_auth_user_id: actor.authUserId,
      imported_by_email: actor.email,
      imported_by_role: actorRole(actor),
    })
    .select(TRANSCRIPT_COLUMNS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, transcript: mapTranscriptRow(data as Record<string, unknown>) };
}

export async function listTranscriptsForMeeting(meetingId: string, businessId: string): Promise<MeetingTranscriptImport[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_meeting_transcript_imports")
    .select(TRANSCRIPT_COLUMNS)
    .eq("meeting_id", meetingId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapTranscriptRow);
}

// ---------------------------------------------------------------------------
// Meeting note → Living Business Book promotion
// ---------------------------------------------------------------------------

const PROMOTION_COLUMNS =
  "id, business_id, meeting_id, meeting_note_id, destination_type, destination_record_id, promoted_by_roster_id, promoted_by_auth_user_id, promoted_by_email, promoted_by_role, created_at";

function mapPromotionRow(row: Record<string, unknown>): MeetingNotePromotion {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    meetingId: String(row.meeting_id),
    meetingNoteId: String(row.meeting_note_id),
    destinationType: row.destination_type as MeetingNotePromotionDestination,
    destinationRecordId: String(row.destination_record_id),
    promotedByRosterId: (row.promoted_by_roster_id as string | null) ?? null,
    promotedByAuthUserId: String(row.promoted_by_auth_user_id),
    promotedByEmail: String(row.promoted_by_email),
    promotedByRole: String(row.promoted_by_role),
    createdAt: String(row.created_at),
  };
}

export async function getPromotionsForMeeting(meetingId: string, businessId: string): Promise<MeetingNotePromotion[]> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("business_meeting_note_promotions")
    .select(PROMOTION_COLUMNS)
    .eq("meeting_id", meetingId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (!data) return [];
  return (data as Record<string, unknown>[]).map(mapPromotionRow);
}

export type PromoteToFactFields = {
  factKey: string;
  factCategory: FactCategory;
  displayValue: string;
};

export type PromoteToUnknownFields = {
  questionLabel: string;
};

export type PromoteToContradictionFields = {
  claimALabel: string;
  claimBLabel: string;
  contradictionType: ContradictionType;
  severity: ContradictionSeverity;
};

export type PromoteMeetingNoteInput = {
  noteId: string;
  meetingId: string;
  businessId: string;
  destination: MeetingNotePromotionDestination;
  fact?: PromoteToFactFields;
  unknown?: PromoteToUnknownFields;
  contradiction?: PromoteToContradictionFields;
};

/**
 * Explicit staff promotion of a meeting note to the Living Business Book.
 * Steps:
 * 1. Load source note — enforces (noteId, meetingId, businessId) triple
 * 2. Reject if not found or cross-business mismatch
 * 3. Reject already-promoted note (UNIQUE enforced at DB level too)
 * 4. Validate destination compatibility with note type
 * 5. Map MeetingActor → LivingBookActor (staff only)
 * 6. Call canonical Living Book repository — no SQL here, no direct business_facts reference
 * 7. Write durable promotion record ONLY after destination write succeeds
 * 8. Return destination ID
 *
 * Source meeting note is NEVER mutated.
 * meeting notes do NOT directly mutate business_facts — upsertFact/createUnknown/createContradiction are called.
 */
export async function promoteMeetingNote(
  input: PromoteMeetingNoteInput,
  actor: MeetingActor,
): Promise<{ ok: true; destinationId: string; destinationType: MeetingNotePromotionDestination } | { ok: false; error: string }> {
  if (input.destination === "correction") {
    return { ok: false, error: "correction_promotion_deferred" };
  }

  if (actor.type !== "staff") {
    return { ok: false, error: "only_staff_may_promote" };
  }

  const supabase = getAdminSupabase();

  // 1. Load source note — exact business + meeting + note ID triple
  const { data: noteRow } = await supabase
    .from("business_meeting_notes")
    .select(NOTE_COLUMNS)
    .eq("id", input.noteId)
    .eq("meeting_id", input.meetingId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  if (!noteRow) return { ok: false, error: "note_not_found" };
  const note = mapNoteRow(noteRow as Record<string, unknown>);

  // 3. Reject already-promoted
  const { data: existingPromotion } = await supabase
    .from("business_meeting_note_promotions")
    .select("id")
    .eq("meeting_note_id", input.noteId)
    .maybeSingle();
  if (existingPromotion) return { ok: false, error: "already_promoted" };

  // 4. Validate destination compatibility
  const validDestinations = eligiblePromotionDestinations(note.noteType);
  if (!validDestinations.includes(input.destination)) {
    return { ok: false, error: "destination_not_eligible_for_note_type" };
  }

  // 5. Build canonical LivingBookActor — never accept caller-supplied fake fields
  const livingBookActor: Extract<LivingBookActor, { type: "staff" }> = {
    type: "staff",
    rosterId: actor.rosterId,
    authUserId: actor.authUserId,
    email: actor.email,
    role: actor.role,
  };

  const visibility = note.visibility === "shared_with_owner" ? "owner_and_staff" as const : "staff_only" as const;
  const sensitivity = note.sensitivity === "sensitive" ? "sensitive" as const : "standard" as const;

  // 6. Call canonical Living Book repository
  let destinationId: string;

  if (input.destination === "fact") {
    if (!input.fact) return { ok: false, error: "missing_fact_input" };
    const { factKey, factCategory, displayValue } = input.fact;
    if (!factKey.trim()) return { ok: false, error: "empty_fact_key" };
    if (!factCategory) return { ok: false, error: "missing_fact_category" };

    const sourceClass = mapNoteSourceClassToLivingBook(note.sourceClass) as import("@/app/lib/business/livingBook/types").SourceClass;
    const confidence = confidenceForNoteSourceClass(note.sourceClass);

    const result = await upsertFact({
      businessId: input.businessId,
      factKey: factKey.trim(),
      factCategory,
      value: note.content,
      displayValue: displayValue.trim() || null,
      sourceClass,
      confidence,
      visibility,
      sensitivity,
      effectiveDate: null,
    }, livingBookActor);

    if (!result.ok) return { ok: false, error: result.error };
    destinationId = result.id;

  } else if (input.destination === "unknown") {
    if (!input.unknown) return { ok: false, error: "missing_unknown_input" };
    const questionLabel = (input.unknown.questionLabel || note.content).trim();
    if (!questionLabel) return { ok: false, error: "empty_question_label" };

    const result = await createUnknown({
      businessId: input.businessId,
      questionLabel,
      whyItMatters: null,
      whoCanAnswer: null,
      priority: "medium",
      assignedChannel: null,
      visibility,
    }, livingBookActor);

    if (!result.ok) return { ok: false, error: result.error };
    destinationId = result.id;

  } else if (input.destination === "contradiction") {
    if (!input.contradiction) return { ok: false, error: "missing_contradiction_input" };
    const { claimALabel, claimBLabel, contradictionType, severity } = input.contradiction;
    if (!claimALabel.trim()) return { ok: false, error: "empty_claim_a_label" };
    if (!claimBLabel.trim()) return { ok: false, error: "empty_claim_b_label" };

    const result = await createContradiction({
      businessId: input.businessId,
      contradictionType: contradictionType ?? "fact_vs_fact",
      severity: severity ?? "medium",
      claimALabel: claimALabel.trim(),
      claimAFactId: null,
      claimAEvidenceId: null,
      claimBLabel: claimBLabel.trim(),
      claimBFactId: null,
      claimBEvidenceId: null,
    }, livingBookActor);

    if (!result.ok) return { ok: false, error: result.error };
    destinationId = result.id;

  } else {
    return { ok: false, error: "unsupported_destination" };
  }

  // 7. Write durable promotion record ONLY after destination write succeeds
  const { data: promotionRow, error: promotionError } = await supabase
    .from("business_meeting_note_promotions")
    .insert({
      business_id: input.businessId,
      meeting_id: input.meetingId,
      meeting_note_id: input.noteId,
      destination_type: input.destination,
      destination_record_id: destinationId,
      promoted_by_roster_id: actor.rosterId,
      promoted_by_auth_user_id: actor.authUserId,
      promoted_by_email: actor.email,
      promoted_by_role: actorRole(actor),
    })
    .select("id")
    .maybeSingle();

  if (promotionError || !promotionRow) {
    return { ok: false, error: promotionError?.message ?? "promotion_record_failed" };
  }

  return { ok: true, destinationId, destinationType: input.destination };
}
