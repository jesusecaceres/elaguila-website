// ------------------------------------------------------------
// dedupe.ts
// Removes duplicate events from Eventbrite + Ticketmaster
// ------------------------------------------------------------

import { UnifiedEvent } from "./types";

/**
 * Generates a unique key for deduplication.
 * Priority: URL → Title + Date → ID
 */
function dedupeKey(event: UnifiedEvent): string {
  if (event.sourceUrl) return event.sourceUrl.toLowerCase().trim();
  if (event.title && event.startDate)
    return (event.title + event.startDate).toLowerCase().trim();
  return event.id.toLowerCase().trim();
}

/**
 * Remove duplicates from an array of UnifiedEvent.
 */
export function dedupeEvents(events: UnifiedEvent[]): UnifiedEvent[] {
  const map = new Map<string, UnifiedEvent>();

  for (const ev of events) {
    const key = dedupeKey(ev);
    if (!map.has(key)) {
      map.set(key, ev);
    }
  }

  return Array.from(map.values());
}
