// ------------------------------------------------------------
// /app/api/events/full/route.ts
// Main Events Engine — Strict Local Only
// ------------------------------------------------------------

import { NextResponse } from "next/server";

import {
  UnifiedEvent,
  EventCategory,
  EventbriteRaw,
  TicketmasterRaw,
  EventsApiResponse,
} from "../../events/helpers/types";

import { allCities, CitySlug, counties } from "../../events/helpers/cityMap";
import {
  normalizeEventbrite,
  normalizeTicketmaster,
} from "../../events/helpers/normalizeEvent";
import { dedupeEvents } from "../../events/helpers/dedupe";

// ------------------------------------------------------------
// DEFAULT SETTINGS
// ------------------------------------------------------------

const DEFAULT_CITY: CitySlug = "sanjose";

const EVENTBRITE_TOKEN = process.env.EVENTBRITE_API_KEY;
const TICKETMASTER_KEY = process.env.TICKETMASTER_API_KEY;

if (!EVENTBRITE_TOKEN) console.warn("⚠️ Missing EVENTBRITE_API_KEY");
if (!TICKETMASTER_KEY) console.warn("⚠️ Missing TICKETMASTER_API_KEY");

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function isValidCity(city: string | null): city is CitySlug {
  if (!city) return false;
  return allCities.some((c) => c.slug === city);
}

function getCityInfo(city: CitySlug) {
  return allCities.find((c) => c.slug === city)!;
}

// ------------------------------------------------------------
// EVENTBRITE FETCH (Strict Local Only)
// ------------------------------------------------------------

async function fetchEventbrite(city: CitySlug): Promise<UnifiedEvent[]> {
  if (!EVENTBRITE_TOKEN) return [];

  const info = getCityInfo(city);

  const url = new URL("https://www.eventbriteapi.com/v3/events/search/");
  url.searchParams.set("location.address", info.name);
  url.searchParams.set("location.within", "10mi"); // Strict local
  url.searchParams.set("expand", "venue");
  url.searchParams.set("sort_by", "date");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${EVENTBRITE_TOKEN}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const json = await res.json();
  const rawEvents: EventbriteRaw[] = json.events || [];

  const normalized = rawEvents
    .map((e) => normalizeEventbrite(e))
    .filter((e): e is UnifiedEvent => e !== null);

  return normalized;
}

// ------------------------------------------------------------
// TICKETMASTER FETCH (Strict Local Only)
// ------------------------------------------------------------

async function fetchTicketmaster(city: CitySlug): Promise<UnifiedEvent[]> {
  if (!TICKETMASTER_KEY) return [];

  const info = getCityInfo(city);

  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", TICKETMASTER_KEY);
  url.searchParams.set("city", info.name);
  url.searchParams.set("countryCode", "US");
  url.searchParams.set("size", "50");

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) return [];

  const json = await res.json();
  const rawEvents: TicketmasterRaw[] = json._embedded?.events || [];

  const normalized = rawEvents
    .map((e) => normalizeTicketmaster(e))
    .filter((e): e is UnifiedEvent => e !== null);

  return normalized;
}

// ------------------------------------------------------------
// MAIN GET HANDLER
// ------------------------------------------------------------

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    let city = searchParams.get("city") as CitySlug | null;
    let category = searchParams.get("category") as EventCategory | null;

    // Default city = San José
    if (!isValidCity(city)) city = DEFAULT_CITY;

    // --------------------------------------------------------
    // FETCH ALL SOURCES
    // --------------------------------------------------------

    const [eb, tm] = await Promise.all([
      fetchEventbrite(city),
      fetchTicketmaster(city),
    ]);

    let events = dedupeEvents([...eb, ...tm]);

    // --------------------------------------------------------
    // FILTER BY CATEGORY (if needed)
    // --------------------------------------------------------

    if (category) {
      events = events.filter((e) => e.category === category);
    }

    // --------------------------------------------------------
    // EMPTY CASE
    // --------------------------------------------------------

    if (events.length === 0) {
      return NextResponse.json({
        events: [],
        city,
        message: "No events available for this city.",
      });
    }

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return NextResponse.json({
      events,
      city,
      category,
    } as EventsApiResponse);
  } catch (err) {
    console.error("❌ FULL EVENTS ROUTE ERROR:", err);
    return NextResponse.json({
      events: [],
      message: "Error loading events.",
    });
  }
}
