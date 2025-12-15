import { NextResponse } from "next/server";
import { fetchTicketmasterEvents } from "../helpers/ticketmaster";
import { fetchEventbriteEvents } from "../helpers/eventbrite";
import { normalizeEvent } from "../helpers/normalizeEvent";
import { dedupeEvents } from "../helpers/dedupe";
import { cityMap } from "../helpers/cityMap";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const city = searchParams.get("city") || "sanjose";
  const includeEventbrite =
    searchParams.get("includeEventbrite") === "true";

  const cityConfig = cityMap[city];

  if (!cityConfig) {
    return NextResponse.json({ events: [] });
  }

  let events: any[] = [];

  try {
    // ------------------------------------------------------------
    // Ticketmaster (always runs)
    // ------------------------------------------------------------
    const ticketmasterEvents = await fetchTicketmasterEvents({
      lat: cityConfig.lat,
      lng: cityConfig.lng,
      radius: cityConfig.radius,
    });

    events.push(
      ...ticketmasterEvents.map((e) => normalizeEvent(e, "ticketmaster"))
    );

    // ------------------------------------------------------------
    // Eventbrite (ON-DEMAND ONLY, COMMUNITY ANCHORED)
    // ------------------------------------------------------------
    if (includeEventbrite) {
      const eventbriteEvents = await fetchEventbriteEvents({
        location: cityConfig.metro, // broader than city
        category: "community", // 🔑 THIS IS THE FIX
        limit: 10,
      });

      events.push(
        ...eventbriteEvents.map((e) =>
          normalizeEvent(e, "eventbrite")
        )
      );
    }

    // ------------------------------------------------------------
    // Deduplicate + Return
    // ------------------------------------------------------------
    const cleanEvents = dedupeEvents(events);

    return NextResponse.json({ events: cleanEvents });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json({ events: [] });
  }
}
