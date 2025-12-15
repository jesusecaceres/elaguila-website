import { NextResponse } from "next/server";
import { fetchTicketmasterEvents } from "../helpers/ticketmaster";
import { fetchEventbriteEvents } from "../helpers/eventbrite";
import { normalizeEvent } from "../helpers/normalizeEvent";
import { dedupeEvents } from "../helpers/dedupe";
import { counties, DEFAULT_CITY } from "../helpers/cityMap";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const city = searchParams.get("city") || DEFAULT_CITY;
  const includeEventbrite =
    searchParams.get("includeEventbrite") === "true";

  // 🔑 derive city config from counties (correct source)
  const cityConfig = counties
    .flatMap((c) => c.cities)
    .find((c) => c.slug === city);

  if (!cityConfig) {
    return NextResponse.json({ events: [] });
  }

  let events: any[] = [];

  try {
    // ------------------------------------------------------------
    // Ticketmaster (always)
    // ------------------------------------------------------------
    const ticketmasterEvents = await fetchTicketmasterEvents({
      lat: cityConfig.lat,
      lng: cityConfig.lng,
      radius: cityConfig.radius,
    });

    events.push(
      ...ticketmasterEvents.map((e) =>
        normalizeEvent(e, "ticketmaster")
      )
    );

    // ------------------------------------------------------------
    // Eventbrite (ON-DEMAND, COMMUNITY)
    // ------------------------------------------------------------
    if (includeEventbrite) {
      const eventbriteEvents = await fetchEventbriteEvents({
        location: cityConfig.name, // metro-safe
        category: "community",
        limit: 10,
      });

      events.push(
        ...eventbriteEvents.map((e) =>
          normalizeEvent(e, "eventbrite")
        )
      );
    }

    return NextResponse.json({
      events: dedupeEvents(events),
    });
  } catch (err) {
    console.error("Events API error:", err);
    return NextResponse.json({ events: [] });
  }
}
