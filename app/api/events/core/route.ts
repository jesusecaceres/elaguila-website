import { NextResponse } from "next/server";
import { fetchEventbriteEvents } from "../helpers/eventbrite";
import { fetchTicketmasterEvents } from "../helpers/ticketmaster";
import { mergeAndDedupe } from "../helpers/dedupe";
import { normalizeEvent } from "../helpers/normalizeEvent";
import { CITY_MAP } from "../helpers/cityMap";

export const dynamic = "force-dynamic";

const DEFAULT_CITY = "sanjose";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Read ?city=sanjose
    const cityParam = searchParams.get("city")?.toLowerCase() || DEFAULT_CITY;

    // City object {query, county}
    const cityObj = CITY_MAP[cityParam] || CITY_MAP[DEFAULT_CITY];

    // The value we pass to Eventbrite / Ticketmaster
    const queryCity = cityObj.query;

    // -----------------------------------------------------
    // 1) FETCH EVENTBRITE EVENTS
    // -----------------------------------------------------
    const eventbrite = await fetchEventbriteEvents(queryCity);

    // -----------------------------------------------------
    // 2) FETCH TICKETMASTER EVENTS
    // -----------------------------------------------------
    const ticketmaster = await fetchTicketmasterEvents(queryCity);

    // -----------------------------------------------------
    // 3) NORMALIZE ALL EVENTS
    // -----------------------------------------------------
    const normalized = [...eventbrite, ...ticketmaster].map((ev) =>
      normalizeEvent(ev)
    );

    // -----------------------------------------------------
    // 4) REMOVE DUPLICATES
    // -----------------------------------------------------
    const finalEvents = mergeAndDedupe(normalized);

    // -----------------------------------------------------
    // 5) SORT BY DATE — EARLIEST FIRST
    // -----------------------------------------------------
    finalEvents.sort((a, b) => {
      const da = a.startDate ? new Date(a.startDate).getTime() : Infinity;
      const db = b.startDate ? new Date(b.startDate).getTime() : Infinity;
      return da - db;
    });

    return NextResponse.json({
      city: cityParam,
      count: finalEvents.length,
      events: finalEvents,
    });
  } catch (err) {
    console.error("❌ CORE EVENTS ERROR:", err);
    return NextResponse.json({
      city: DEFAULT_CITY,
      count: 0,
      events: [],
    });
  }
}
