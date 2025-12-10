// /app/api/events/helpers/normalizeEvent.ts

import { cityBySlug, CityInfo } from "./cityMap";

export interface NormalizedEvent {
  id: string;
  title: string;
  description?: string;
  url: string;
  startDate: string;
  endDate?: string;
  venue?: string;
  city: string;     // slug
  county: string;
  image?: string;
  source: string;   // eventbrite | ticketmaster | rss | manual
}

/**
 * Ensures safe strings
 */
const safe = (v: any): string =>
  typeof v === "string" ? v.trim() : "";

/**
 * Converts ANY incoming event provider result into a standardized format.
 */
export function normalizeEvent(
  e: any,
  cityInfo: CityInfo,
  source: "eventbrite" | "ticketmaster" | "rss" | "manual"
): NormalizedEvent | null {
  try {
    if (!e) return null;

    // --------- ID ---------
    const id =
      e.id ||
      e.event_id ||
      e._id ||
      `${source}-${Math.random().toString(36).slice(2, 10)}`;

    // --------- TITLE ---------
    const title =
      safe(e.name) ||
      safe(e.title) ||
      safe(e.short_title) ||
      "Untitled Event";

    // --------- DESCRIPTION ---------
    const description =
      safe(e.description) ||
      safe(e.summary) ||
      safe(e.info) ||
      "";

    // --------- URL ---------
    const url =
      safe(e.url) ||
      safe(e.event_url) ||
      safe(e.link) ||
      "";

    // --------- DATE HANDLING ---------
    const startDate =
      e.startDate ||
      e.start?.local ||
      e.start?.dateTime ||
      e.start_time ||
      e.datetime ||
      null;

    if (!startDate) return null;

    const endDate =
      e.endDate ||
      e.end?.local ||
      e.end?.dateTime ||
      e.end_time ||
      null;

    // --------- VENUE ---------
    const venue =
      safe(e.venue?.name) ||
      safe(e.venue_name) ||
      safe(e.location) ||
      safe(e.address?.city) ||
      "";

    // --------- IMAGE ---------
    let image =
      e.image ||
      e.images?.[0]?.url ||
      e.logo?.url ||
      e.logo ||
      e.event_image ||
      null;

    // If image is array (Ticketmaster)
    if (!image && e.images && Array.isArray(e.images)) {
      const best = e.images.find((img: any) => img.url);
      if (best) image = best.url;
    }

    // Universal fallback image
    if (!image) image = "/default-event.png";

    // --------- RETURN NORMALIZED EVENT ---------
    return {
      id,
      title,
      description,
      url,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      venue,
      city: cityInfo.slug,
      county: cityInfo.county,
      image,
      source,
    };
  } catch (err) {
    console.error("Error normalizing event:", err);
    return null;
  }
}
