/**
 * LEO-13 meeting intelligence — deterministic related-email matching only.
 * Pure / fixture-safe (no server-only). Vague keyword matches are rejected.
 */
import type {
  LeoCalendarEventEvidence,
  LeoEmailMessageEvidence,
  LeoMeetingIntelligenceResult,
  LeoMeetingRelatedEmail,
} from "@/app/leo/_lib/leoTypes";

/** Mirrors LEO_GOOGLE_BOUNDS.maxRelatedEmailsPerMeeting — kept local for fixture-safe import. */
const MAX_RELATED_EMAILS = 10;

function normalizeEmail(v: string | null | undefined): string | null {
  const t = (v ?? "").trim().toLowerCase();
  return t && t.includes("@") ? t : null;
}

function extractAddress(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const angle = raw.match(/<([^>]+)>/);
  return normalizeEmail(angle?.[1] ?? raw);
}

function messageParticipants(msg: LeoEmailMessageEvidence): string[] {
  const set = new Set<string>();
  const from = extractAddress(msg.sender);
  if (from) set.add(from);
  for (const r of [...(msg.recipients ?? []), ...(msg.to ?? []), ...(msg.cc ?? [])]) {
    const a = extractAddress(r);
    if (a) set.add(a);
  }
  return [...set];
}

function meetingEmails(event: LeoCalendarEventEvidence): string[] {
  const set = new Set<string>();
  if (event.organizer) {
    const o = normalizeEmail(event.organizer);
    if (o) set.add(o);
  }
  for (const a of event.attendees ?? []) {
    const e = normalizeEmail(a.email);
    if (e) set.add(e);
  }
  return [...set];
}

function strongTitlePhraseMatch(title: string | null, subject: string | null): boolean {
  if (!title?.trim() || !subject?.trim()) return false;
  const t = title.trim().toLowerCase().replace(/\s+/g, " ");
  const s = subject.trim().toLowerCase().replace(/\s+/g, " ");
  // Both sides must carry a substantial phrase — reject single weak keywords.
  if (t.length < 12 || s.length < 12) return false;
  return s.includes(t) || t.includes(s);
}

/**
 * Pure related-email matcher. Max candidates enforced.
 * Weak keyword-only matches are rejected.
 * Overlap on owner-only identity (organizer == owner in To:) is not sufficient.
 */
export function matchRelatedEmailsForMeeting(input: {
  meeting: LeoCalendarEventEvidence;
  emails: LeoEmailMessageEvidence[];
  maxCandidates?: number;
  /** When set, owner-only email overlap is not treated as meeting-related. */
  ownerEmail?: string | null;
}): LeoMeetingRelatedEmail[] {
  const max = Math.min(input.maxCandidates ?? MAX_RELATED_EMAILS, MAX_RELATED_EMAILS);
  const meetingAddrs = new Set(meetingEmails(input.meeting));
  const owner = normalizeEmail(input.ownerEmail);
  const related: LeoMeetingRelatedEmail[] = [];

  for (const email of input.emails) {
    if (related.length >= max) break;
    const participants = messageParticipants(email);
    const emailOverlap = participants.filter((p) => meetingAddrs.has(p));
    const meaningfulOverlap = owner
      ? emailOverlap.filter((e) => e !== owner)
      : emailOverlap;

    if (meaningfulOverlap.length > 0) {
      const reason =
        meaningfulOverlap.some((e) => e === normalizeEmail(input.meeting.organizer))
          ? "EXACT_ORGANIZER_EMAIL"
          : "EXACT_ATTENDEE_EMAIL";
      related.push({
        message: email,
        matchReason: reason,
        matchedEmails: meaningfulOverlap.slice(0, 5),
      });
      continue;
    }

    const titleMatch = strongTitlePhraseMatch(input.meeting.title, email.subject);
    const urlHost = input.meeting.meetingUrl
      ?.replace(/^https?:\/\//i, "")
      .split("/")[0]
      ?.toLowerCase();
    const corroborating =
      Boolean(input.meeting.eventId && email.snippet?.includes(input.meeting.eventId)) ||
      Boolean(
        urlHost &&
          urlHost.length >= 4 &&
          email.snippet?.toLowerCase().includes(urlHost),
      ) ||
      Boolean(
        input.meeting.location &&
          input.meeting.location.length >= 8 &&
          email.snippet?.toLowerCase().includes(input.meeting.location.toLowerCase()),
      );

    if (titleMatch && corroborating) {
      related.push({
        message: email,
        matchReason: "STRONG_TITLE_PLUS_CORROBORATION",
        matchedEmails: [],
      });
    }
    // Weak keyword-only — intentionally not linked.
  }

  return related;
}

/**
 * Build meeting intelligence from one event + bounded Gmail evidence.
 */
export function buildLeoMeetingIntelligence(input: {
  meeting: LeoCalendarEventEvidence | null;
  emails: LeoEmailMessageEvidence[];
  maxRelated?: number;
  ownerEmail?: string | null;
}): LeoMeetingIntelligenceResult {
  const limitations: string[] = [
    "Related emails require deterministic evidence — vague keyword matches are rejected.",
    `Related email candidates capped at ${MAX_RELATED_EMAILS}.`,
  ];
  const unknowns: string[] = [];

  if (!input.meeting) {
    return {
      meeting: null,
      attendees: [],
      relatedEmailEvidence: [],
      unknowns: ["no_meeting_selected"],
      limitations: [...limitations, "No meeting event was provided."],
    };
  }

  const relatedEmailEvidence = matchRelatedEmailsForMeeting({
    meeting: input.meeting,
    emails: input.emails,
    maxCandidates: input.maxRelated,
    ownerEmail: input.ownerEmail,
  });

  if (relatedEmailEvidence.length === 0 && input.emails.length > 0) {
    unknowns.push("no_deterministically_related_emails");
  }

  return {
    meeting: input.meeting,
    attendees: input.meeting.attendees ?? [],
    relatedEmailEvidence,
    unknowns,
    limitations,
  };
}
