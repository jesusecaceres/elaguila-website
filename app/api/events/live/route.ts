import { NextResponse } from "next/server";

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;

// CENTER OF SEARCH → SAN JOSE, CA
const SJ_LAT = 37.3382;
const SJ_LNG = -121.8863;

// RADIUS → 150 miles
const RADIUS = 150;

// Fallback flyer if Ticketmaster provides none
const FALLBACK_IMAGE = "/fallback-event.jpg";

// Counties we want to KEEP (El Águila regions)
const APPROVED_COUNTIES = [
  "Santa Clara",
  "San Benito",
  "Santa Cruz",
  "Monterey",
  "Alameda",
  "San Mateo",
  "San Francisco",
  "Contra Costa",
  "Marin",
  "Napa",
  "Sonoma",
  "Stanislaus",
  "San Joaquin",
  "Merced",
  "Fresno",
  "Madera",
];

// Mapping city → county for categorization
const CITY_TO_COUNTY: Record<string, string> = {
  "San Jose": "Santa Clara",
  "Santa Clara": "Santa Clara",
  "Sunnyvale": "Santa Clara",
  "Milpitas": "Santa Clara",
  "Mountain View": "Santa Clara",
  "Los Gatos": "Santa Clara",
  "Campbell": "Santa Clara",
  "Cupertino": "Santa Clara",
  "Saratoga": "Santa Clara",
  "Gilroy": "Santa Clara",
  "Morgan Hill": "Santa Clara",

  "Hollister": "San Benito",

  "Santa Cruz": "Santa Cruz",
  "Watsonville": "Santa Cruz",
  "Capitola": "Santa Cruz",

  "Salinas": "Monterey",
  "Monterey": "Monterey",
  "Seaside": "Monterey",
  "Marina": "Monterey",

  "Fremont": "Alameda",
  "Hayward": "Alameda",
  "Oakland": "Alameda",
  "Berkeley": "Alameda",
  "Union City": "Alameda",

  "Redwood City": "San Mateo",
  "San Mateo": "San Mateo",
  "Palo Alto": "San Mateo",

  "San Francisco": "San Francisco",

  "Modesto": "Stanislaus",
  "Ceres": "Stanislaus",
  "Turlock": "Stanislaus",

  "Stockton": "San Joaquin",
  "Manteca": "San Joaquin",
  "Lodi": "San Joaquin",
  "Tracy": "San Joaquin",

  "Merced": "Merced",

  "Fresno": "Fresno",
  "Clovis": "Fresno",
};

// Category mapping based on Ticketmaster classifications
function determineCategory(classification: any): string {
  if (!classification) return "Community";

  const seg = classification.segment?.name?.toLowerCase() || "";
  const genre = classification.genre?.name?.toLowerCase() || "";

  if (seg.includes("sports")) return "Sports";
  if (seg.includes("music")) return "Music";
  if (seg.includes("arts")) return "Family";
  if (seg.includes("film")) return "Nightlife";
  if (genre.includes("family")) return "Family";
  if (genre.includes("festival")) return "Community";

  return "Community";
}

// Normalize Ticketmaster event → El Águila format
function normalizeEvent(ev: any) {
  const venue = ev._embedded?.venues?.[0];
  const city = venue?.city?.name || "";
  const county = CITY_TO_COUNTY[city] || "";

  return {
    id: ev.id,
    title: ev.name,
    description: ev.info || "",
    date: ev.dates?.start?.localDate || "",
    time: ev.dates?.start?.localTime || "",
    image:
      ev.images?.find((i: any) => i.width > 600)?.url || FALLBACK_IMAGE,
    sourceUrl: ev.url || "",
    city,
    county,
    category: determineCategory(ev.classifications?.[0]),
  };
}

export async function GET() {
  try {
    if (!TICKETMASTER_API_KEY) {
      console.error("Ticketmaster API key missing");
      return NextResponse.json([], { status: 500 });
    }

    // Build Ticketmaster search URL
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&latlong=${SJ_LAT},${SJ_LNG}&radius=${RADIUS}&unit=miles&locale=*`;

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error("Ticketmaster API error:", res.status);
      return NextResponse.json([], { status: 500 });
    }

    const data = await res.json();
    const events = data._embedded?.events || [];

    // Normalize & filter by approved counties
    const normalized = events
      .map(normalizeEvent)
      .filter((ev) => APPROVED_COUNTIES.includes(ev.county));

    // Remove past events
    const today = new Date().toISOString().split("T")[0];
    const upcoming = normalized.filter((ev) => ev.date >= today);

    return NextResponse.json(upcoming, {
      headers: {
        "Cache-Control": "s-maxage=10800", // cache for 3 hours
      },
    });
  } catch (error) {
    console.error("LIVE EVENTS API ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}
