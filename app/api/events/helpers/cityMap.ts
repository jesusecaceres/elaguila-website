// ------------------------------------------------------------
// cityMap.ts — Official Local Cities Map for El Águila Events
// ------------------------------------------------------------

export const CITY_MAP: Record<
  string,
  {
    query: string;    // The name used for Eventbrite / Ticketmaster API search
    county: string;   // County grouping
  }
> = {
  // ----------------------------
  // Santa Clara County (Main)
  // ----------------------------
  "sanjose": { query: "San Jose", county: "Santa Clara" },
  "sunnyvale": { query: "Sunnyvale", county: "Santa Clara" },
  "santaclara": { query: "Santa Clara", county: "Santa Clara" },
  "mountainview": { query: "Mountain View", county: "Santa Clara" },
  "milpitas": { query: "Milpitas", county: "Santa Clara" },
  "paloalto": { query: "Palo Alto", county: "Santa Clara" },
  "gilroy": { query: "Gilroy", county: "Santa Clara" },
  "morganhill": { query: "Morgan Hill", county: "Santa Clara" },

  // ----------------------------
  // Santa Cruz County
  // ----------------------------
  "santacruz": { query: "Santa Cruz", county: "Santa Cruz" },
  "watsonville": { query: "Watsonville", county: "Santa Cruz" },

  // ----------------------------
  // Monterey County
  // ----------------------------
  "monterey": { query: "Monterey", county: "Monterey" },
  "salinas": { query: "Salinas", county: "Monterey" },

  // ----------------------------
  // Central Valley
  // ----------------------------
  "modesto": { query: "Modesto", county: "Stanislaus" },
  "turlock": { query: "Turlock", county: "Stanislaus" },

  "stockton": { query: "Stockton", county: "San Joaquin" },
  "tracy": { query: "Tracy", county: "San Joaquin" },
  "lodi": { query: "Lodi", county: "San Joaquin" },
  "manteca": { query: "Manteca", county: "San Joaquin" },

  "fresno": { query: "Fresno", county: "Fresno" },

  "merced": { query: "Merced", county: "Merced" },
};

// --------------------------------------
// Type
// --------------------------------------
export type CitySlug = keyof typeof CITY_MAP;
