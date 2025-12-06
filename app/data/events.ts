export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  county: string;
  category: string;
  image: string;
  featured?: boolean;
}

export const events: EventItem[] = [
  {
    id: "event-1",
    title: "Festival de Música Latina",
    description: "Un evento lleno de música, comida y celebraciones familiares.",
    date: "2026-01-18",
    county: "Santa Clara",
    category: "Music",
    image: "/events/music-festival.jpg",
    featured: true,
  },
  {
    id: "event-2",
    title: "Family Park Day",
    description: "Actividades para niños, juegos, food trucks y diversión para toda la familia.",
    date: "2026-01-21",
    county: "Alameda",
    category: "Family",
    image: "/events/family-park.jpg",
  },
  {
    id: "event-3",
    title: "Youth Leadership Workshop",
    description: "Un taller para jóvenes con enfoque en liderazgo, metas y superación.",
    date: "2026-01-25",
    county: "San Mateo",
    category: "Youth",
    image: "/events/youth-leadership.jpg",
  },
  {
    id: "event-4",
    title: "Food Truck Friday",
    description: "Ven a probar la mejor comida de la bahía. Entrada gratis.",
    date: "2026-01-12",
    county: "Contra Costa",
    category: "Food",
    image: "/events/food-truck.jpg",
  },
  {
    id: "event-5",
    title: "Noche de Baile",
    description: "Una noche de música latina, DJs y diversión.",
    date: "2026-02-02",
    county: "Santa Clara",
    category: "Nightlife",
    image: "/events/night-dance.jpg",
  },
];
