import { NextResponse } from "next/server";
import { fetchTicketmasterEvents } from "../helpers/ticketmaster";
import { fetchEventbriteEvents } from "../helpers/eventbrite";
import { normalizeEvent } from "../helpers/normalizeEvent";
import { dedupeEvents } from "../helpers/dedupe";
import { counties, DEFAULT_CITY } from "../helpers/cityMap";

export const dynamic = "force-dynamic";

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

  let events: any[] = [];

  try {
    // ------------------------------------------------------------
    // Ticketmaster (ALREADY NORMALIZED)
    // ------------------------------------------------------------
    const ticketmasterEvents = await fetchTicketmasterEvents(cityConfig);
    events.push(...ticketmasterEvents);

    // ------------------------------------------------------------
    // Eventbrite (RAW → NORMALIZE HERE)
    // ------------------------------------------------------------
    if (includeEventbrite) {
      const eventbriteEvents = await fetchEventbriteEvents({
        location: cityConfig.name,
        category: "community",
        limit: 10,
      });

      events.push(
        ...eventbriteEvents
          .map((e: any) => normalizeEvent(e, cityConfig, "eventbrite"))
          .filter(Boolean)
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
import { NextResponse } from "next/server";
import { fetchTicketmasterEvents } from "../helpers/ticketmaster";
import { fetchEventbriteEvents } from "../helpers/eventbrite";
import { normalizeEvent } from "../helpers/normalizeEvent";
import { dedupeEvents } from "../helpers/dedupe";
import { counties, DEFAULT_CITY } from "../helpers/cityMap";

export const dynamic = "force-dynamic";

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

  let events: any[] = [];

  try {
    // ------------------------------------------------------------
    // Ticketmaster (ALREADY NORMALIZED)
    // ------------------------------------------------------------
    const ticketmasterEvents = await fetchTicketmasterEvents(cityConfig);
    events.push(...ticketmasterEvents);

    // ------------------------------------------------------------
    // Eventbrite (RAW → NORMALIZE HERE)
    // ------------------------------------------------------------
    if (includeEventbrite) {
      const eventbriteEvents = await fetchEventbriteEvents({
        location: cityConfig.name,
        category: "community",
        limit: 10,
      });

      events.push(
        ...eventbriteEvents
          .map((e: any) => normalizeEvent(e, cityConfig, "eventbrite"))
          .filter(Boolean)
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
