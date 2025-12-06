// CITY → COUNTY MAPPING FOR EL ÁGUILA EVENTS ENGINE

export const CITY_TO_COUNTY: Record<string, string> = {
  // Bay Area
  "San Jose": "Santa Clara",
  "Santa Clara": "Santa Clara",
  "Sunnyvale": "Santa Clara",
  "Mountain View": "Santa Clara",
  "Palo Alto": "Santa Clara",
  "Milpitas": "Santa Clara",
  "Campbell": "Santa Clara",
  "Los Gatos": "Santa Clara",

  "Fremont": "Alameda",
  "Hayward": "Alameda",
  "Oakland": "Alameda",
  "Berkeley": "Alameda",
  "Union City": "Alameda",

  "San Francisco": "San Francisco",

  "San Mateo": "San Mateo",
  "Redwood City": "San Mateo",
  "Pacifica": "San Mateo",

  // Central Valley
  "Modesto": "Stanislaus",
  "Ceres": "Stanislaus",
  "Turlock": "Stanislaus",
  "Hughson": "Stanislaus",

  "Manteca": "San Joaquin",
  "Stockton": "San Joaquin",
  "Lathrop": "San Joaquin",
  "Lodi": "San Joaquin",

  "Merced": "Merced",

  // Coastal / Hollister / Santa Cruz / Monterey
  "Hollister": "San Benito",
  "Gilroy": "Santa Clara",
  "Morgan Hill": "Santa Clara",

  "Watsonville": "Santa Cruz",
  "Capitola": "Santa Cruz",
  "Santa Cruz": "Santa Cruz",
  "Scotts Valley": "Santa Cruz",

  "Salinas": "Monterey",
};

export function getCounty(city: string) {
  return CITY_TO_COUNTY[city] || "";
}
