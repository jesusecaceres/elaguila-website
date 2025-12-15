import { NextResponse } from "next/server";

import { cityBySlug, DEFAULT_CITY } from "../helpers/cityMap";
import { fetchTicketmasterEvents } from "../helpers/ticketmaster";
import { fetchEventbriteEvents } from "../helpers/eventbrite";
import { fetchRSSEvents } from "../helpers/rssEvents";
import { dedupeEvents } from "../helpers/dedupe";

export const dynamic = "force-dynamic";

/**
 * GET /api/events/core?city=sanjose
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const citySlug = searchParams.get("city") || DEFAULT_CITY;

    const city = cityBySlug[citySlug];

    if (!city) {
      return NextResponse.json(
        { error: "Invalid city" },
        { status: 400 }
      );
    }

    let events: any[] = [];

    // Ticketmaster
    events.push(...(await fetchTicketmasterEvents(city)));

    // Eventbrite
    events.push(...(await fetchEventbriteEvents(city)));

    // RSS (San Jose–based)
    events.push(...(await fetchRSSEvents()));

    // De-dupe + sort
    const finalEvents = dedupeEvents(events).sort(
      (a, b) =>
        new Date(a.startDate).getTime() -
        new Date(b.startDate).getTime()
    );

    return NextResponse.json({
      city: city.name,
      count: finalEvents.length,
      events: finalEvents,
    });
  } catch (err) {
    console.error("❌ Events API error:", err);
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 }
    );
  }
}
