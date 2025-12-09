// ------------------------------------------------------------
// types.ts
// Global Types for El Águila Events Engine
// ------------------------------------------------------------

import { CitySlug, CityInfo } from "./cityMap";

// ------------------------------------------------------------
// CATEGORY TYPES
// These match your dropdowns exactly.
// ------------------------------------------------------------

export type EventCategory =
  | "singles"
  | "youth"
  | "family"
  | "couples"
  | "nightlife"
  | "food"
  | "music"
  | "community"
  | "holiday"
  | "sports";

// ------------------------------------------------------------
// SOURCE TYPES
// ------------------------------------------------------------

export type EventSource = "eventbrite" | "ticketmaster";

// ------------------------------------------------------------
// UNIFIED EVENT INTERFACE
// Every event (Eventbrite, Ticketmaster) becomes this shape.
// ------------------------------------------------------------

export interface UnifiedEvent {
  id: string;
  title: string;
  description: string;
  image: string;
  sourceUrl: string;
  startDate: string | null;
  endDate: string | null;

  // Location
  city: CitySlug;
  cityName: string; // “San José”
  county: string;

  // Category (based on title/description)
  category: EventCategory;

  // Source (EB / TM)
  source: EventSource;
}

// ------------------------------------------------------------
// RAW EVENTBRITE FORMAT (partial)
// We only use the fields we care about.
// ------------------------------------------------------------

export interface EventbriteRaw {
  id: string;
  name: { text: string | null };
  description: { text: string | null };
  url: string;
  start: { local: string | null };
  end: { local: string | null };
  logo?: { url: string | null };
  venue?: {
    address?: {
      city?: string | null;
    };
  };
}

// ------------------------------------------------------------
// RAW TICKETMASTER FORMAT (partial)
// ------------------------------------------------------------

export interface TicketmasterRaw {
  id: string;
  name: string;
  info?: string | null;
  pleaseNote?: string | null;
  url: string;
  dates?: {
    start?: {
      localDate?: string | null;
    };
  };
  images?: { url: string }[];
  _embedded?: {
    venues?: {
      city?: { name?: string | null };
    }[];
  };
  classifications?: {
    segment?: { name?: string };
    genre?: { name?: string };
  }[];
}

// ------------------------------------------------------------
// API RESPONSE TYPE
// ------------------------------------------------------------

export interface EventsApiResponse {
  events: UnifiedEvent[];
  city: CitySlug;
  category?: EventCategory;
}
