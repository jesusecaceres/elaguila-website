import { EventInput } from "./types";
import { CITY_MAP } from "./cityMap";

export async function fetchEventbriteEvents(city: string): Promise<EventInput[]> {
  try {
    const token = process.env.EVENTBRITE_API_KEY;
    if (!token) {
      console.error("❌ Missing EVENTBRITE_API_KEY");
      return [];
    }

    const mapped = CITY_MAP[city]?.query || "San Jose";

    const url = `https://www.eventbriteapi.com/v3/events/search/?location.address=${encodeURIComponent(
      mapped
    )}&expand=venue`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("❌ Eventbrite error", await res.text());
      return [];
    }

    const data = await res.json();
    if (!data.events) return [];

    return data.events.map((ev: any) => ({
      id: ev.id,
      title: ev.name?.text || "Event",
      description: ev.description?.text || "",
      startDate: ev.start?.local || null,
      endDate: ev.end?.local || null,
      image: ev.logo?.url || "",
      url: ev.url || "",
      venue: ev.venue?.address?.localized_address_display || "",
      city: city,
      source: "eventbrite",
    }));
  } catch (err) {
    console.error("❌ EVENTBRITE FETCH ERROR:", err);
    return [];
  }
}
