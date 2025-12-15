// /app/api/events/core/route.ts

import { NextResponse } from "next/server";

import { cityMap } from "../helpers/cityMap";
import { fetchTicketmasterEvents } from "../helpers/ticketmaster";
import { fetchEventbriteEvents } from "../helpers/eventbrite";
import { fetchRssEvents } from "../helpers/rssEvents";
import { dedupeEvents } from "../helpers/dedupe";
import { NormalizedEvent } from "../helpers/types";

// Force dynamic fetch (no caching)
export const dynamic = "force-dynamic";

/**
 * GET /api/events/core?city=san-jose
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const citySlug = searchParams.get("city") || "san-jose";

    const city = cityMap[citySlug];

    if (!city) {
      return NextResponse.json(
        { error: "Invalid city" },
        { status: 400 }
      );
    }

    let events: NormalizedEvent[] = [];

    // ------------------------------------------------------------
    // Ticketmaster (always on)
    // ------------------------------------------------------------
    const ticketmasterEvents = await fetchTicketmasterEvents(city);
    events.push(...ticketmasterEvents);

    // ------------------------------------------------------------
    // Eventbrite (on-demand, community style)
    // ------------------------------------------------------------
    const eventbriteEvents = await fetchEventbriteEvents(city);
    events.push(...eventbriteEvents);

    // ------------------------------------------------------------
    // RSS Community Events
    // ------------------------------------------------------------
    const rssEvents = await fetchRssEvents(city);
    events.push(...rssEvents);

    // ------------------------------------------------------------
    // Deduplicate + sort
    // ------------------------------------------------------------
    const finalEvents = dedupeEvents(events).sort((a, b) => {
      return (
        new Date(a.startDate).getTime() -
        new Date(b.startDate).getTime()
      );
    });

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
