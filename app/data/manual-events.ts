// app/data/manual-events.ts

export interface ManualEvent {
  id: string;                 // unique identifier
  title_es: string;           // Spanish title
  title_en: string;           // English title
  description_es: string;     // Spanish description
  description_en: string;     // English description
  date: string;               // ISO date for sorting
  time?: string;              // optional event time
  venue?: string;             // optional location name
  address?: string;           // optional full address
  county: string;             // Santa Clara, Alameda, etc.
  category: string;           // Music, Food, Family, etc.
  image: string;              // flyer image path (public/)
  featured: boolean;          // featured events show first
  created: string;            // timestamp for admin tracking
}

const manualEvents: ManualEvent[] = [
  // SAMPLE EVENT — keep or delete
  {
    id: "sample-001",
    title_es: "Festival Comunitario de Primavera",
    title_en: "Spring Community Festival",
    description_es: "Un día lleno de música, comida y diversión para toda la familia.",
    description_en: "A full day of music, food, and fun for the whole family.",
    date: "2025-04-20",
    time: "12:00 PM",
    venue: "Plaza de San José",
    address: "200 E Santa Clara St, San José, CA",
    county: "Santa Clara",
    category: "Family",
    image: "/event-fallback.png",   // use fallback or add your own flyer
    featured: true,
    created: new Date().toISOString(),
  },

  // Add more manual events below this line:
  // {
  //   id: "unique-id-here",
  //   title_es: "",
  //   title_en: "",
  //   description_es: "",
  //   description_en: "",
  //   date: "",
  //   time: "",
  //   venue: "",
  //   address: "",
  //   county: "",
  //   category: "",
  //   image: "/my-event.png",
  //   featured: false,
  //   created: new Date().toISOString(),
  // },
];

export default manualEvents;
