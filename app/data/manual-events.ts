// /app/data/manual-events.ts

/**
 * Featured Events — ALAS DE ORO / GOLDEN WINGS
 * These are premium sponsor events manually added by the admin.
 * 
 * RULES:
 * - Every event MUST include an image (sponsor flyer or custom graphic).
 * - Section title auto-translates: "Alas de Oro" (ES) / "Golden Wings" (EN).
 * - Icon auto-switches based on lang:
 *      /branding/alas-de-oro.png   (ES)
 *      /branding/golden-wings.png  (EN)
 * - These events ALWAYS appear in Section 1 of the Eventos page.
 */

export interface ManualEvent {
  id: string;
  title: {
    es: string;
    en: string;
  };
  description: {
    es: string;
    en: string;
  };
  image: string; // ALWAYS required — no fallback
  url: string;
  startDate: string;  // ISO format
  endDate?: string;
  venue: string;
  city: string;       // city slug (e.g., "sanjose")
  county: string;
}

// -------------------
// SAMPLE DATA (you will replace)
// -------------------

export const manualFeaturedEvents: ManualEvent[] = [
  {
    id: "featured-1",
    title: {
      es: "Tu evento destacado aquí",
      en: "Your featured event here",
    },
    description: {
      es: "Evento patrocinado por un socio de Alas de Oro.",
      en: "Sponsored event by an Alas de Oro partner.",
    },
    image: "/branding/alas-de-oro.png", // temporary placeholder you will replace
    url: "https://elaguilaenvuelo.com", // replace with event link
    startDate: new Date().toISOString(),
    venue: "San Jose, CA",
    city: "sanjose",
    county: "Santa Clara County",
  },
];
