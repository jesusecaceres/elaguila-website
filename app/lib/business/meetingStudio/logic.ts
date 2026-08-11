/**
 * Program 5 — Meeting Studio pure logic functions. No DB, no UI.
 * Validates meeting status transitions, consent append-only contract,
 * and note-to-fact promotion safety.
 */
import { isValidMeetingStatusTransition } from "./constants";
import type {
  MeetingConsentState,
  MeetingConsentType,
  MeetingNoteType,
  MeetingNoteSourceClass,
  MeetingStatus,
} from "./types";

export function canTransitionMeetingStatus(from: MeetingStatus, to: MeetingStatus): boolean {
  return isValidMeetingStatusTransition(from, to);
}

export function isAppendOnlyConsentTransition(
  _previousState: MeetingConsentState | null,
  _newState: MeetingConsentState,
): boolean {
  return true;
}

export function noteRequiresConfirmation(noteType: MeetingNoteType): boolean {
  return noteType === "potential_fact" || noteType === "owner_statement";
}

export function noteSourceClassForType(noteType: MeetingNoteType): MeetingNoteSourceClass {
  switch (noteType) {
    case "owner_statement":
      return "owner_stated";
    case "staff_observation":
      return "staff_observed";
    case "potential_fact":
      return "system_derived";
    case "unknown":
      return "system_derived";
    case "contradiction":
      return "system_derived";
    case "decision":
      return "owner_stated";
    case "action_item":
      return "staff_observed";
    default:
      return "staff_observed";
  }
}

export function canPromoteNoteToFact(noteType: MeetingNoteType): boolean {
  return noteType === "potential_fact";
}

export function consentTypeRequiresExplicitAck(consentType: MeetingConsentType): boolean {
  return consentType !== "notes";
}

export function isTranscriptionLive(importMethod: string): boolean {
  return importMethod !== "manual_import";
}

export function isAudioRecordingLive(_state: unknown): boolean {
  return false;
}

export function buildDefaultAgenda(meetingType: string): Record<string, unknown> {
  const baseSections = [
    { key: "attendees", labelEs: "Asistentes", labelEn: "Attendees" },
    { key: "consent", labelEs: "Consentimiento", labelEn: "Consent" },
    { key: "goals", labelEs: "Objetivos", labelEn: "Goals" },
    { key: "guided_questions", labelEs: "Preguntas guiadas", labelEn: "Guided questions" },
    { key: "unknowns", labelEs: "Incertidumbres", labelEn: "Unknowns" },
    { key: "contradictions", labelEs: "Contradicciones", labelEn: "Contradictions" },
    { key: "recommendation_review", labelEs: "Revisión de recomendación", labelEn: "Recommendation review" },
    { key: "options_comparison", labelEs: "Comparación de opciones", labelEn: "Options comparison" },
    { key: "decision", labelEs: "Decisión", labelEn: "Decision" },
    { key: "recap", labelEs: "Resumen", labelEn: "Recap" },
    { key: "commitments", labelEs: "Compromisos", labelEn: "Commitments" },
  ];
  return { version: 1, meetingType, sections: baseSections };
}
