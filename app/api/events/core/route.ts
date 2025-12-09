import { NextResponse } from "next/server";
import { fetchEventbriteEvents } from "../helpers/eventbrite";
import { fetchTicketmasterEvents } from "../helpers/ticketmaster";
import { mergeAndDedupe } from "../helpers/dedupe";
import { normalizeEvent } from "../helpers/normalizeEvent";
import { CITY_MAP, CitySlug } from "../helpers/cityMap";

export const dynamic = "force-dynamic";

// ------------------------------------------------------------
// MAIN ENDPOINT — Returns merged events for a given city
// ------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const citySlug = (searchParams.get("city") || "sanjose").toLowerCase() as CitySlug;

    // Validate city
    const mappedCity = CITY_MAP[citySlug];
    if (!mappedCity) {
      return NextResponse.json({ error: "Invalid city" }, { status: 400 });
    }

    // ------------------------------------------------------------
    // 1) EVENTBRITE EVENTS
    // ------------------------------------------------------------
    const eventbriteRaw = await fetchEventbriteEvents(mappedCity);
    const eventbrite = eventbriteRaw.map((ev) =>
      normalizeEvent(ev, mappedCity.query, mappedCity.county)
    );

    // ------------------------------------------------------------
    // 2) TICKETMASTER EVENTS
    // ------------------------------------------------------------
    const ticketmasterRaw = await fetchTicketmasterEvents(mappedCity);
    const ticketmaster = ticketmasterRaw.map((ev) =>
      normalizeEvent(ev, mappedCity.query, mappedCity.county)
    );

    // ------------------------------------------------------------
    // 3) MERGE + DEDUPE
    // ------------------------------------------------------------
    const combined = mergeAndDedupe([...eventbrite, ...ticketmaster]);

    // ------------------------------------------------------------
    // 4) SORT BY DATE
    // ------------------------------------------------------------
    combined.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : Infinity;
      const db = b.date ? new Date(b.date).getTime() : Infinity;
      return da - db;
    });

    return NextResponse.json(combined);
  } catch (error) {
    console.error("❌ EVENTS CORE ROUTE ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}
