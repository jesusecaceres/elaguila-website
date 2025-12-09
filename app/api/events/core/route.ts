import { NextResponse } from "next/server";
import { fetchEventbriteEvents } from "../helpers/eventbrite";
import { fetchTicketmasterEvents } from "../helpers/ticketmaster";
import { mergeAndDedupe } from "../helpers/dedupe";
import { normalizeEvent } from "../helpers/normalizeEvent";
import { CITY_MAP } from "../helpers/cityMap";

export const dynamic = "force-dynamic";

// -----------------------------------------
// DEFAULT CITY (SAN JOSÉ)
// -----------------------------------------
const DEFAULT_CITY = "san-jose";

// -----------------------------------------
// GET HANDLER
// -----------------------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // User-selected city
    const cityParam = searchParams.get("city");
    const city = cityParam ? cityParam.toLowerCase() : DEFAULT_CITY;

    // Sanity fallback
    const mappedCity = CITY_MAP[city] || CITY_MAP[DEFAULT_CITY];

    // -----------------------------------------
    // FETCH SOURCES
    // -----------------------------------------

    // 1) Eventbrite
    const eventbrite = await fetchEventbriteEvents(mappedCity);

    // 2) Ticketmaster (optional)
    const ticketmaster = await fetchTicketmasterEvents(mappedCity);

    // -----------------------------------------
    // COMBINE + NORMALIZE
    // -----------------------------------------
    const combined = [...eventbrite, ...ticketmaster].map((ev) =>
      normalizeEvent(ev, mappedCity)
    );

    // -----------------------------------------
    // REMOVE DUPLICATES & SORT BY DATE
    // -----------------------------------------
    const finalEvents = mergeAndDedupe(combined).sort((a, b) => {
      const da = new Date(a.startDate).getTime();
      const db = new Date(b.startDate).getTime();
      return da - db;
    });

    return NextResponse.json({
      city: mappedCity,
      count: finalEvents.length,
      events: finalEvents,
    });
  } catch (error) {
    console.error("❌ CORE EVENT API ERROR:", error);
    return NextResponse.json({ city: DEFAULT_CITY, events: [] });
  }
}
