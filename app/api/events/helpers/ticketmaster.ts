import { EventInput } from "./types";
import { CITY_MAP } from "./cityMap";

export async function fetchTicketmasterEvents(city: string): Promise<EventInput[]> {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) return [];

    const mapped = CITY_MAP[city]?.query || "San Jose";

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&city=${encodeURIComponent(
      mapped
    )}&countryCode=US&size=50`;

    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    const events = data._embedded?.events || [];
    return events.map((ev: any) => ({
      id: ev.id,
      title: ev.name,
      description: ev.info || "",
      startDate: ev.dates?.start?.dateTime || null,
      endDate: null,
      image: ev.images?.[0]?.url || "",
      url: ev.url,
      venue: ev._embedded?.venues?.[0]?.name || "",
      city: city,
      source: "ticketmaster",
    }));
  } catch (err) {
    console.error("❌ TICKETMASTER FETCH ERROR:", err);
    return [];
  }
}
