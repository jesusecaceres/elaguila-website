// /app/api/events/core/route.ts

import { NextResponse } from "next/server";
import { allCities, cityBySlug, DEFAULT_CITY } from "../helpers/cityMap";
import { fetchEventbriteEvents } from "../helpers/eventbrite";
import { fetchTicketmasterEvents } from "../helpers/ticketmaster";
import { dedupeEvents } from "../helpers/dedupe";

export const dynamic = "force-dynamic"; // ensure fresh fetch on Vercel

/**
 * Core Events API
 * GET /api/events/core?city=sanjose
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Pull city or fallback to San Jose
    const citySlug = (searchParams.get("city") || DEFAULT_CITY).toLowerCase();

    const cityInfo = cityBySlug[citySlug];

    if (!cityInfo) {
      return NextResponse.json(
        { error: `City '${citySlug}' not found.` },
        { status: 400 }
      );
    }

    // ---------- FETCH PROVIDERS ----------
    const [eventbrite, ticketmaster] = await Promise.all([
      fetchEventbriteEvents(cityInfo),
      fetchTicketmasterEvents(cityInfo),
    ]);

    let combined = [...eventbrite, ...ticketmaster];

    // ---------- DEDUPE ----------
    const cleaned = dedupeEvents(combined);

    return NextResponse.json(
      {
        city: cityInfo.name,
        county: cityInfo.county,
        slug: cityInfo.slug,
        total: cleaned.length,
        events: cleaned,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("CORE API ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load events." },
      { status: 500 }
    );
  }
}
