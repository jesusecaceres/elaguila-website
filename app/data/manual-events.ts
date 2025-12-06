// Manual events added by the El Águila admin team

export interface ManualEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  county: string;
  category: string;
  image?: string;
  link: string; // REQUIRED for merging with EventItem
}

const manualEvents: ManualEvent[] = [
  {
    id: "manual-1",
    title: "El Águila Community Festival",
    description: "Join us for music, food, raffles, and entertainment for all ages.",
    date: "March 15, 2026",
    county: "Santa Clara",
    category: "Community",
    image: "/eventos/aguila-festival.jpg",
    link: "#",   // ← Add this to ALL manual events
  },
  {
    id: "manual-2",
    title: "Family Resource Fair",
    description: "A day of support for families including health screenings, resources, and giveaways.",
    date: "April 2, 2026",
    county: "Alameda",
    category: "Family",
    image: "/eventos/family-fair.jpg",
    link: "#",
  },
  {
    id: "manual-3",
    title: "Latino Business Networking Night",
    description: "Connect with entrepreneurs, learn strategies, and grow your network.",
    date: "May 10, 2026",
    county: "Santa Clara",
    category: "Business",
    image: "/eventos/network-night.jpg",
    link: "#",
  },
];

export default manualEvents;
