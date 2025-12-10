// /app/api/events/helpers/ticketmaster.ts

import { normalizeEvent, NormalizedEvent } from "./normalizeEvent";
import { CityInfo } from "./cityMap";

const TM_API = "https://app.ticketmaster.com/discovery/v2/events.json";
const TM_KEY = process.env.TICKETMASTER_API_KEY;

/**
 * Fetch events from Ticketmaster for a specific city.
 * Radius set to 50 miles to capture regional events (Bay Area + Central Valley).
 */
export async function fetchTicketmasterEvents(city: CityInfo): Promise<NormalizedEvent[]> {
  if (!TM_KEY) {
    console.warn("⚠️ Missing TICKETMASTER_API_KEY — skipping Ticketmaster events.");
    return [];
  }

  const url = new URL(TM_API);

  url.searchParams.set("apikey", TM_KEY);
  url.searchParams.set("keyword", city.name);
  url.searchParams.set("size", "50");
  url.searchParams.set("radius", "50"); // captures surrounding region
  url.searchParams.set("unit", "miles");
  url.searchParams.set("sort", "date,asc");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      console.error(`Ticketmaster error for ${city.name}:`, await res.text());
      return [];
    }

    const data = await res.json();

    if (!data || !data._embedded || !data._embedded.events) {
      return [];
    }

    const rawEvents = data._embedded.events;

    const normalized: NormalizedEvent[] = rawEvents
      .map((ev: any) => {
        const mapped = {
          id: ev.id,
          name: ev.name,
          description: ev.info || ev.pleaseNote || "",
          url: ev.url,
          start: { dateTime: ev.dates?.start?.dateTime },
          end: { dateTime: ev.dates?.end?.dateTime },
          venue: ev._embedded?.venues?.[0]?.name || "",
          images: ev.images || [],
        };

        return normalizeEvent(mapped, city, "ticketmaster");
      })
      .filter((e: any) => e !== null);

    return normalized;
  } catch (err) {
    console.error("Ticketmaster fetch failed:", err);
    return [];
  }
}
