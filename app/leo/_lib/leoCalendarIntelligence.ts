/**
 * LEO-13 deterministic calendar interpretation — fixture-safe, no invented timezone.
 */
import type {
  LeoCalendarEventEvidence,
  LeoCalendarEventClassification,
  LeoCalendarIntelligenceResult,
} from "@/app/leo/_lib/leoTypes";

function parseInstant(iso: string | null | undefined): number | null {
  if (!iso?.trim()) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

function sameUtcDay(aMs: number, bMs: number): boolean {
  const a = new Date(aMs);
  const b = new Date(bMs);
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function dayOffsetUtc(fromMs: number, days: number): number {
  return fromMs + days * 86_400_000;
}

/**
 * Classify a single event relative to now. Does not invent timezone —
 * uses start/end ISO as provided; notes limitation when timezone missing.
 */
export function classifyLeoCalendarEvent(
  event: LeoCalendarEventEvidence,
  nowMs: number,
): {
  classification: LeoCalendarEventClassification;
  limitations: string[];
} {
  const limitations: string[] = [];
  if (!event.timezone) {
    limitations.push(
      "Event timezone not supplied — preserving ISO timestamps without inventing a zone.",
    );
  }

  const start = parseInstant(event.start);
  const end = parseInstant(event.end);

  if (start == null) {
    return { classification: "UNKNOWN_TIME", limitations };
  }

  if (end != null && start <= nowMs && nowMs < end) {
    return { classification: "IN_PROGRESS", limitations };
  }

  if (end != null && end <= nowMs && nowMs - end <= 2 * 60 * 60 * 1000) {
    return { classification: "RECENTLY_ENDED", limitations };
  }

  if (end != null && end <= nowMs) {
    return { classification: "UNKNOWN_TIME", limitations };
  }

  if (sameUtcDay(start, nowMs) && start >= nowMs) {
    return { classification: "TODAY", limitations };
  }

  if (start > nowMs) {
    return { classification: "UPCOMING", limitations };
  }

  return { classification: "UNKNOWN_TIME", limitations };
}

export function pickLeoNextMeeting(
  events: LeoCalendarEventEvidence[],
  nowMs: number,
): LeoCalendarEventEvidence | null {
  const upcoming = events
    .map((e) => ({ e, start: parseInstant(e.start) }))
    .filter((x): x is { e: LeoCalendarEventEvidence; start: number } => x.start != null && x.start > nowMs)
    .sort((a, b) => a.start - b.start);
  return upcoming[0]?.e ?? null;
}

export function filterLeoEventsForDay(
  events: LeoCalendarEventEvidence[],
  dayMs: number,
): LeoCalendarEventEvidence[] {
  return events.filter((e) => {
    const start = parseInstant(e.start);
    return start != null && sameUtcDay(start, dayMs);
  });
}

/**
 * Build calendar intelligence from bounded event evidence.
 * Does not claim "you are free" unless the requested interval was read and empty.
 */
export function buildLeoCalendarIntelligence(input: {
  events: LeoCalendarEventEvidence[];
  nowMs?: number;
  /** True when the requested window was successfully read from Calendar API. */
  windowReadSuccessfully?: boolean;
  windowLabel?: string;
}): LeoCalendarIntelligenceResult {
  const nowMs = input.nowMs ?? Date.now();
  const limitations: string[] = [];
  const unknowns: string[] = [];

  const classified = input.events.map((event) => {
    const { classification, limitations: lim } = classifyLeoCalendarEvent(event, nowMs);
    return { event, classification, limitations: lim };
  });

  for (const c of classified) {
    for (const l of c.limitations) {
      if (!limitations.includes(l)) limitations.push(l);
    }
  }

  const todayEvents = filterLeoEventsForDay(input.events, nowMs);
  const tomorrowEvents = filterLeoEventsForDay(input.events, dayOffsetUtc(nowMs, 1));
  const nextEvent = pickLeoNextMeeting(input.events, nowMs);
  const upcomingEvents = input.events
    .filter((e) => {
      const s = parseInstant(e.start);
      return s != null && s > nowMs;
    })
    .sort((a, b) => (parseInstant(a.start) ?? 0) - (parseInstant(b.start) ?? 0));

  if (nextEvent) {
    // Annotate next meeting classification for callers.
    const idx = classified.findIndex((c) => c.event.eventId === nextEvent.eventId);
    if (idx >= 0) {
      classified[idx] = {
        ...classified[idx],
        classification: "NEXT_MEETING",
      };
    }
  }

  if (input.windowReadSuccessfully && input.events.length === 0) {
    limitations.push(
      `Bounded calendar window${input.windowLabel ? ` (${input.windowLabel})` : ""} was read successfully and contained no events.`,
    );
  } else if (!input.windowReadSuccessfully) {
    unknowns.push("calendar_window_not_fully_proven");
  }

  return {
    nowMs,
    todayEvents,
    tomorrowEvents,
    nextEvent,
    upcomingEvents,
    classified,
    limitations,
    unknowns,
  };
}
