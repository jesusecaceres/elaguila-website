// /app/data/community-events.ts

/**
 * Community Events — Eventos de la Comunidad
 * 
 * These are events submitted by the community.
 * Admin must approve and manually add them here (Phase 2 temporary workflow).
 * 
 * RULES:
 * - Bilingual content is supported (ES + EN fields).
 * - Image is required (flyer submitted by community or created by admin).
 * - Events appear in Section 2 of the Eventos page.
 * - Does NOT use the Alas de Oro (Golden Wings) branding.
 */

export interface CommunityEvent {
  id: string;
  title: {
    es: string;
    en: string;
  };
  description: {
    es: string;
    en: string;
  };
  image: string;   // flyer image path
  url: string;     // where the event link goes
  startDate: string; 
  endDate?: string;
  venue: string;
  city: string;     // slug (sanjose, gilroy, etc.)
  county: string;
}

// -------------------
// SAMPLE EVENT (you will replace)
// -------------------

export const communityEvents: CommunityEvent[] = [
  {
    id: "community-1",
    title: {
      es: "Tu evento comunitario aquí",
      en: "Your community event here",
    },
    description: {
      es: "Ejemplo de evento enviado por la comunidad.",
      en: "Example of a community-submitted event.",
    },
    image: "/branding/alas-de-oro.png", // TEMP — Replace with actual flyer
    url: "https://elaguilaenvuelo.com",
    startDate: new Date().toISOString(),
    venue: "San Jose, CA",
    city: "sanjose",
    county: "Santa Clara County",
  }
];
