// ------------------------------------------------------------
// types.ts — Shared Event Type for Eventbrite + Ticketmaster
// ------------------------------------------------------------

export type FinalEvent = {
  id: string;
  title: string;
  description: string;
  image: string;
  url: string;       // final cleaned URL
  city: string;      // "San Jose", "Gilroy", etc.
  county: string;    // "Santa Clara", "San Joaquin", etc.
  category: string;  // "music", "sports", "family", etc.
  date: string;      // ISO date string
};
