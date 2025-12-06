// app/data/events.ts

import manualEvents from "./manual-events";

/**
 * AUTO EVENTS PLACEHOLDER
 * ------------------------------------
 * This array will later be replaced with real auto-gathered events
 * from RSS feeds, APIs, or other sources.
 */
const autoEvents = [
  {
    id: "auto-1",
    title: "San José Art Walk",
    description: "Local artists showcase their work in downtown San José.",
    date: "2026-02-22",
    location: "San José, CA",
    county: "Santa Clara",
    flyer: "/events/auto-artwalk.jpg",
  },
  {
    id: "auto-2",
    title: "Family Fitness Day",
    description: "A full day of free family fitness activities and classes.",
    date: "2026-03-05",
    location: "Hayward, CA",
    county: "Alameda",
    flyer: "/events/auto-fitness.jpg",
  },
  {
    id: "auto-3",
    title: "Modesto Night Market",
    description: "Vendors, food trucks, music, and handmade goods.",
    date: "2026-04-12",
    location: "Modesto, CA",
    county: "Stanislaus",
    flyer: "/events/auto-market.jpg",
  },
];

/**
 * MERGE EVENTS
 * ------------------------------------
 * Manual events ALWAYS appear first.
 * Auto events appear after.
 * Featured events are handled on the page itself.
 */
const events = [...manualEvents, ...autoEvents];

/**
 * TYPE EXPORT
 * (Used so the Eventos page knows what fields exist)
 */
export type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  county: string;
  flyer: string;
  featured?: boolean;
};

export default events;
