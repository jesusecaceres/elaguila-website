export const CITY_MAP: Record<
  string,
  {
    query: string;
    county: string;
  }
> = {
  "San José": { query: "San Jose", county: "Santa Clara" },
  "San Jose": { query: "San Jose", county: "Santa Clara" },
  "Santa Clara": { query: "Santa Clara", county: "Santa Clara" },
  "Sunnyvale": { query: "Sunnyvale", county: "Santa Clara" },
  "Mountain View": { query: "Mountain View", county: "Santa Clara" },
  "Milpitas": { query: "Milpitas", county: "Santa Clara" },
  "Palo Alto": { query: "Palo Alto", county: "Santa Clara" },
  "Gilroy": { query: "Gilroy", county: "Santa Clara" },
  "Morgan Hill": { query: "Morgan Hill", county: "Santa Clara" },

  // ---- Nearby Areas ----
  "Santa Cruz": { query: "Santa Cruz", county: "Santa Cruz" },
  "Watsonville": { query: "Watsonville", county: "Santa Cruz" },
  "Monterey": { query: "Monterey", county: "Monterey" },
  "Salinas": { query: "Salinas", county: "Monterey" },

  // ---- Central Valley ----
  "Modesto": { query: "Modesto", county: "Stanislaus" },
  "Turlock": { query: "Turlock", county: "Stanislaus" },
  "Stockton": { query: "Stockton", county: "San Joaquin" },
  "Tracy": { query: "Tracy", county: "San Joaquin" },
  "Lodi": { query: "Lodi", county: "San Joaquin" },
  "Manteca": { query: "Manteca", county: "San Joaquin" },
  "Fresno": { query: "Fresno", county: "Fresno" },
  "Merced": { query: "Merced", county: "Merced" },
};

export type CityKey = keyof typeof CITY_MAP;
export const CITY_MAP: Record<
  string,
  {
    query: string;
    county: string;
  }
> = {
  "San José": { query: "San Jose", county: "Santa Clara" },
  "San Jose": { query: "San Jose", county: "Santa Clara" },
  "Santa Clara": { query: "Santa Clara", county: "Santa Clara" },
  "Sunnyvale": { query: "Sunnyvale", county: "Santa Clara" },
  "Mountain View": { query: "Mountain View", county: "Santa Clara" },
  "Milpitas": { query: "Milpitas", county: "Santa Clara" },
  "Palo Alto": { query: "Palo Alto", county: "Santa Clara" },
  "Gilroy": { query: "Gilroy", county: "Santa Clara" },
  "Morgan Hill": { query: "Morgan Hill", county: "Santa Clara" },

  // ---- Nearby Areas ----
  "Santa Cruz": { query: "Santa Cruz", county: "Santa Cruz" },
  "Watsonville": { query: "Watsonville", county: "Santa Cruz" },
  "Monterey": { query: "Monterey", county: "Monterey" },
  "Salinas": { query: "Salinas", county: "Monterey" },

  // ---- Central Valley ----
  "Modesto": { query: "Modesto", county: "Stanislaus" },
  "Turlock": { query: "Turlock", county: "Stanislaus" },
  "Stockton": { query: "Stockton", county: "San Joaquin" },
  "Tracy": { query: "Tracy", county: "San Joaquin" },
  "Lodi": { query: "Lodi", county: "San Joaquin" },
  "Manteca": { query: "Manteca", county: "San Joaquin" },
  "Fresno": { query: "Fresno", county: "Fresno" },
  "Merced": { query: "Merced", county: "Merced" },
};

export type CityKey = keyof typeof CITY_MAP;
