import { NextResponse } from "next/server";
import { fetchTicketmasterEvents } from "../helpers/ticketmaster";
import { fetchEventbriteEvents } from "../helpers/eventbrite";
import { normalizeEvent } from "../helpers/normalizeEvent";
import { dedupeEvents } from "../helpers/dedupe";
import { counties, DEFAULT_CITY } from "../helpers/cityMap";

export const dynamic = "force-dynamic";

// 🔒 Safe defaults (San Jose metro)
const FALLBACK_COORDS = {
  lat: 37.3382,
  lng: -121.8863,
  radius: 50,
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const citySlug = searchParams.get("city") || DEFAULT_CITY;
  const includeEventbrite =
    searchParams.get("includeEventbrite") === "true";

  const cityConfig = counties
    .flatMap((c) => c.cities)
    .find((c) => c.slug === citySlug);

  if (!cityConfig) {
    return NextResponse.json({ events: [] });
  }

  // ✅ Defensive extraction (TypeScript-safe)
  const lat =
    typeof (cityConfig as any).lat === "number"
      ? (cityConfig as any).lat
      : FALLBACK_COORDS.lat;

  const lng =
    typeof (cityConfig as any).lng === "number"
      ? (cityConfig as any).lng
      : FALLBACK_COORDS.lng;

  const radius =
    typeof (cityConfig as any).radius === "number"
      ? (cityConfig as any).radius
      : FALLBACK_COORDS.radius;

  let events: any[] = [];

  try {
    // ------------------------------------------------------------
    // Ticketmaster (always)
    // ------------------------------------------------------------
    const ticketmasterEvents = await fetchTicketmasterEvents({
      lat,
      lng,
      radius,
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
        location: cityConfig.name,
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
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json({ events: [] });
  }
}
