// /app/api/events/helpers/eventbrite.ts

import { normalizeEvent, NormalizedEvent } from "./normalizeEvent";
import { CityInfo } from "./cityMap";

// Eventbrite API base
const EVENTBRITE_API = "https://www.eventbriteapi.com/v3/events/search/";

// Your Eventbrite token from environment variables
const TOKEN = process.env.EVENTBRITE_TOKEN;

/**
 * Fetches Eventbrite events for a specific city.
 * Uses "location.address" + "location.within=25km" for consistent results.
 */
export async function fetchEventbriteEvents(city: CityInfo): Promise<NormalizedEvent[]> {
  if (!TOKEN) {
    console.warn("⚠️ Missing EVENTBRITE_TOKEN — skipping Eventbrite events.");
    return [];
  }

  const url = new URL(EVENTBRITE_API);

  // Search parameters
  url.searchParams.set("location.address", city.name);
  url.searchParams.set("location.within", "25km");
  url.searchParams.set("expand", "venue");
  url.searchParams.set("sort_by", "date");

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Eventbrite error for ${city.name}:`, await res.text());
      return [];
    }

    const data = await res.json();
    if (!data || !data.events) return [];

    // Convert raw Eventbrite events → normalized
    const normalized: NormalizedEvent[] = data.events
      .map((e: any) => normalizeEvent(e, city, "eventbrite"))
      .filter((e: any) => e !== null);

    return normalized;
  } catch (err) {
    console.error("Eventbrite fetch failed:", err);
    return [];
  }
}
