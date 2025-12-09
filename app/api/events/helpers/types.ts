// ------------------------------------------------------------
// types.ts — Shared Event Type for Eventbrite + Ticketmaster
// ------------------------------------------------------------

export type FinalEvent = {
  id: string;
  title: string;
  description: string;
  image: string;
  url: string;

  city: string;
  county: string;
  category: string;

  // MAIN canonical date field
  date: string; // ISO

  // OPTIONAL compatibility fields (old code still checks these)
  startDate?: string;
  endDate?: string;
};
