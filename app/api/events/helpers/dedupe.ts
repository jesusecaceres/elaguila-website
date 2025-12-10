// /app/api/events/helpers/dedupe.ts

/**
 * Removes duplicate events across providers (Eventbrite, Ticketmaster, RSS, manual).
 * Deduplication rules:
 * - Same title (case-insensitive)
 * - Same start date (normalized to ISO)
 * - Same venue/location (if provided)
 * - Same city slug
 */

export interface NormalizedEvent {
  id: string;
  title: string;
  description?: string;
  url: string;
  startDate: string;
  endDate?: string;
  venue?: string;
  city: string;     // slug
  county: string;
  image?: string;
  source: string;   // "eventbrite" | "ticketmaster" | "rss" | "manual"
}

/**
 * Creates a hash key for duplicate detection.
 * Uses title + startDate + venue + city.
 */
const makeKey = (e: NormalizedEvent) => {
  const title = e.title?.trim().toLowerCase() || "";
  const date = e.startDate?.split("T")[0] || "";
  const venue = (e.venue || "").trim().toLowerCase();
  const city = e.city || "";

  return `${title}|${date}|${venue}|${city}`;
};

/**
 * Dedupe master function
 */
export function dedupeEvents(events: NormalizedEvent[]): NormalizedEvent[] {
  const map = new Map<string, NormalizedEvent>();

  for (const e of events) {
    const key = makeKey(e);

    // If not in map, store it
    if (!map.has(key)) {
      map.set(key, e);
      continue;
    }

    // If conflict exists, prefer:
    // 1. Image present
    // 2. Eventbrite > Ticketmaster > RSS > Manual
    const existing = map.get(key)!;

    const score = (ev: NormalizedEvent) => {
      let s = 0;

      // Prefer events with images
      if (ev.image) s += 2;

      // Prefer richer sources
      switch (ev.source) {
        case "eventbrite": s += 3; break;
        case "ticketmaster": s += 2; break;
        case "rss": s += 1; break;
        case "manual": s += 0; break;
      }

      return s;
    };

    if (score(e) > score(existing)) {
      map.set(key, e);
    }
  }

  return Array.from(map.values());
}
