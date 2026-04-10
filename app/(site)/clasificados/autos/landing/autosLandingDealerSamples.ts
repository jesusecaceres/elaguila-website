/**
 * Blueprint dealer band — structured like future promoted dealer rows (name, city, rating, logo).
 * `resultsHandoff` seeds `/clasificados/autos/resultados` until dealer slugs exist.
 */
export type AutosLandingDealerSample = {
  id: string;
  name: string;
  city: string;
  state: string;
  rating: number;
  logoUrl: string;
  /** Query seeds aligned with `serializeAutosBrowseUrl` / filter contract. */
  resultsHandoff: {
    seller: "dealer";
    city: string;
    /** Optional keyword-style seed for future dealer-centric search. */
    q?: string;
  };
};

const LOGO = "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80";

export const AUTOS_LANDING_DEALER_SAMPLES: AutosLandingDealerSample[] = [
  {
    id: "dlr-bay-prestige",
    name: "Bay Prestige Motors",
    city: "San Jose",
    state: "CA",
    rating: 4.8,
    logoUrl: LOGO,
    resultsHandoff: { seller: "dealer", city: "San Jose", q: "Honda" },
  },
  {
    id: "dlr-golden-trucks",
    name: "Golden State Trucks",
    city: "San Jose",
    state: "CA",
    rating: 4.6,
    logoUrl: LOGO,
    resultsHandoff: { seller: "dealer", city: "San Jose", q: "Toyota" },
  },
  {
    id: "dlr-norcal-chevy",
    name: "NorCal Chevrolet",
    city: "Fremont",
    state: "CA",
    rating: 4.7,
    logoUrl: LOGO,
    resultsHandoff: { seller: "dealer", city: "Fremont", q: "Chevrolet" },
  },
  {
    id: "dlr-peninsula-bmw",
    name: "Peninsula BMW",
    city: "Palo Alto",
    state: "CA",
    rating: 4.9,
    logoUrl: LOGO,
    resultsHandoff: { seller: "dealer", city: "Palo Alto", q: "BMW" },
  },
];
