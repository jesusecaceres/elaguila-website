// ------------------------------------------------------------
// normalizeEvent.ts
// Converts Eventbrite + Ticketmaster into UnifiedEvent format
// ------------------------------------------------------------

import {
  EventbriteRaw,
  TicketmasterRaw,
  UnifiedEvent,
  EventCategory,
} from "./types";

import { matchCity, CitySlug, allCities } from "./cityMap";

const FALLBACK_IMAGE = "/event-fallback.png";

// ------------------------------------------------------------
// CATEGORY DETECTION (English + Spanish)
// ------------------------------------------------------------

export function detectCategory(text: string): EventCategory {
  const t = text.toLowerCase();

  // MUSIC
  if (
    t.includes("music") ||
    t.includes("musica") ||
    t.includes("concert") ||
    t.includes("concierto") ||
    t.includes("live band") ||
    t.includes("grupo") ||
    t.includes("banda")
  ) {
    return "music";
  }

  // FOOD
  if (
    t.includes("food") ||
    t.includes("comida") ||
    t.includes("taco") ||
    t.includes("dinner") ||
    t.includes("wine") ||
    t.includes("beer")
  ) {
    return "food";
  }

  // FAMILY
  if (
    t.includes("family") ||
    t.includes("familia") ||
    t.includes("kids") ||
    t.includes("niño") ||
    t.includes("niños")
  ) {
    return "family";
  }

  // HOLIDAY
  if (
    t.includes("navidad") ||
    t.includes("christmas") ||
    t.includes("holiday") ||
    t.includes("xmas") ||
    t.includes("posada")
  ) {
    return "holiday";
  }

  // NIGHTLIFE
  if (
    t.includes("nightlife") ||
    t.includes("club") ||
    t.includes("fiesta") ||
    t.includes("baile") ||
    t.includes("party") ||
    t.includes("salsa") ||
    t.includes("reggaeton")
  ) {
    return "nightlife";
  }

  // SPORTS
  if (
    t.includes("sport") ||
    t.includes("sports") ||
    t.includes("game") ||
    t.includes("vs ")
  ) {
    return "sports";
  }

  // COUPLES
  if (t.includes("couples") || t.includes("date night")) {
    return "couples";
  }

  // SINGLES
  if (t.includes("singles") || t.includes("speed dating")) {
    return "singles";
  }

  return "community";
}

// ------------------------------------------------------------
// DATE NORMALIZATION
// ------------------------------------------------------------

function normalizeDate(date: string | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ------------------------------------------------------------
// EVENTBRITE → UnifiedEvent
// ------------------------------------------------------------

export function normalizeEventbrite(raw: EventbriteRaw): UnifiedEvent | null {
  const title = raw.name?.text?.trim() || "";
  const description = raw.description?.text?.trim() || "";
  const img = raw.logo?.url || FALLBACK_IMAGE;
  const url = raw.url;

  const venueCity = raw.venue?.address?.city || "";
  const cityMatch = matchCity(venueCity);

  if (!cityMatch) return null; // ignore events outside our supported cities

  const category = detectCategory(`${title} ${description}`);

  return {
    id: `eb-${raw.id}`,
    title,
    description,
    image: img,
    sourceUrl: url,
    startDate: normalizeDate(raw.start?.local),
    endDate: normalizeDate(raw.end?.local),
    city: cityMatch.slug,
    cityName: cityMatch.name,
    county: cityMatch.county,
    category,
    source: "eventbrite",
  };
}

// ------------------------------------------------------------
// TICKETMASTER → UnifiedEvent
// ------------------------------------------------------------

export function normalizeTicketmaster(raw: TicketmasterRaw): UnifiedEvent | null {
  const title = raw.name || "";
  const description = raw.info || raw.pleaseNote || "";

  const img =
    raw.images?.[0]?.url ||
    raw.images?.[1]?.url ||
    FALLBACK_IMAGE;

  const url = raw.url;

  const venueCity = raw._embedded?.venues?.[0]?.city?.name || "";
  const cityMatch = matchCity(venueCity);

  if (!cityMatch) return null;

  const category = detectCategory(`${title} ${description}`);

  return {
    id: `tm-${raw.id}`,
    title,
    description,
    image: img,
    sourceUrl: url,
    startDate: normalizeDate(raw.dates?.start?.localDate || null),
    endDate: normalizeDate(null),
    city: cityMatch.slug,
    cityName: cityMatch.name,
    county: cityMatch.county,
    category,
    source: "ticketmaster",
  };
}
