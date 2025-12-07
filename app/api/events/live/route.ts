import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGE = "/event-fallback.png";

type EventType =
  | "singles"
  | "youth"
  | "family"
  | "couples"
  | "nightlife"
  | "food"
  | "music"
  | "community"
  | "holiday"
  | "sports";

type LiveEvent = {
  id: string;
  title: string;
  description: string;
  image: string;
  sourceUrl: string;
  county: string;
  category: string; // raw label (Music, Sports, etc.)
  type: EventType; // used by dropdowns
};

// ----------------------------
// HELPERS
// ----------------------------

function ensureHttps(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (!url.startsWith("http")) return `https://${url}`;
  return url;
}

// ----------------------------
// RSS FETCHER
// ----------------------------
async function fetchRssEvents(): Promise<LiveEvent[]> {
  try {
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      console.error("❌ BASE_URL is missing in environment variables.");
      return [];
    }

    const res = await fetch(`${baseUrl}/api/events/rss`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("❌ RSS endpoint returned", res.status);
      return [];
    }

    const raw = await res.json();

    // We expect /api/events/rss to already normalize basic fields.
    // Here we just make sure `type` exists for dropdowns.
    return (raw || []).map((ev: any, index: number): LiveEvent => {
      const county = ev.county || "Santa Clara";
      const category = ev.category || "Community";
      const baseType = (ev.type as EventType | undefined) ?? mapTypeFromCategory(category);

      return {
        id: ev.id?.toString() ?? `rss-${index}`,
        title: ev.title || "Evento comunitario",
        description: ev.description || "",
        image: ev.image || FALLBACK_IMAGE,
        sourceUrl: ensureHttps(ev.sourceUrl || ev.link),
        county,
        category,
        type: baseType,
      };
    });
  } catch (err) {
    console.error("❌ RSS fetch error:", err);
    return [];
  }
}

// ----------------------------
// MAP CATEGORY → TYPE
// ----------------------------
function mapTypeFromCategory(category: string): EventType {
  const cat = (category || "").toLowerCase();

  if (cat.includes("music") || cat.includes("concierto") || cat.includes("concert"))
    return "music";
  if (cat.includes("sport") || cat.includes("deporte"))
    return "sports";
  if (cat.includes("food") || cat.includes("comida") || cat.includes("wine") || cat.includes("beer"))
    return "food";
  if (cat.includes("family") || cat.includes("familia"))
    return "family";
  if (cat.includes("kids") || cat.includes("niño") || cat.includes("youth") || cat.includes("teen"))
    return "youth";
  if (cat.includes("holiday") || cat.includes("navidad") || cat.includes("christmas"))
    return "holiday";
  if (cat.includes("night") || cat.includes("club") || cat.includes("nightlife"))
    return "nightlife";
  if (cat.includes("single"))
    return "singles";
  if (cat.includes("couple"))
    return "couples";

  return "community";
}

// ----------------------------
// NORMALIZE TICKETMASTER
// ----------------------------
function normalizeTicketmaster(ev: any): LiveEvent {
  const genre = ev.classifications?.[0]?.genre?.name || "";
  const segment = ev.classifications?.[0]?.segment?.name || "";
  const name = ev.name || "";

  const rawCategory = genre || segment || "Community";

  const type = mapTypeFromTicketmaster(rawCategory, name);

  return {
    id: ev.id,
    title: ev.name || "Evento",
    description: ev.info || ev.pleaseNote || "",
    image: ev.images?.[0]?.url || FALLBACK_IMAGE,
    sourceUrl: ensureHttps(ev.url),
    county: extractCountyFromTM(ev),
    category: rawCategory,
    type,
  };
}

function mapTypeFromTicketmaster(category: string, title: string): EventType {
  const cat = (category || "").toLowerCase();
  const name = (title || "").toLowerCase();

  // Sports
  if (cat.includes("sport") || name.includes("vs "))
    return "sports";

  // Music / concerts
  if (cat.includes("music") || cat.includes("concert") || name.includes("festival"))
    return "music";

  // Family / kids
  if (
    cat.includes("family") ||
    name.includes("kids") ||
    name.includes("children") ||
    name.includes("family")
  )
    return "family";

  // Food / drink events
  if (
    name.includes("taco") ||
    name.includes("beer") ||
    name.includes("wine") ||
    name.includes("food")
  )
    return "food";

  // Holiday
  if (
    name.includes("navidad") ||
    name.includes("christmas") ||
    name.includes("xmas") ||
    name.includes("holiday")
  )
    return "holiday";

  // Nightlife
  if (name.includes("club") || name.includes("night") || name.includes("party"))
    return "nightlife";

  // Couples
  if (name.includes("date night") || name.includes("couples"))
    return "couples";

  // Singles
  if (name.includes("singles") || name.includes("speed dating"))
    return "singles";

  // Default
  return "community";
}

// ----------------------------
// COUNTY TAGGING
// ----------------------------
function extractCountyFromTM(ev: any): string {
  const venue = ev._embedded?.venues?.[0];
  if (!venue) return "Santa Clara";

  const city = venue.city?.name?.toLowerCase() || "";

  // Santa Clara County
  if (city.includes("san jose")) return "Santa Clara";
  if (city.includes("santa clara")) return "Santa Clara";
  if (city.includes("sunnyvale")) return "Santa Clara";
  if (city.includes("mountain view")) return "Santa Clara";
  if (city.includes("milpitas")) return "Santa Clara";
  if (city.includes("palo alto")) return "Santa Clara";
  if (city.includes("gilroy")) return "Santa Clara";
  if (city.includes("morgan hill")) return "Santa Clara";

  // Alameda
  if (city.includes("oakland") || city.includes("fremont") || city.includes("hayward"))
    return "Alameda";

  // San Mateo
  if (city.includes("san mateo") || city.includes("redwood"))
    return "San Mateo";

  // San Francisco
  if (city.includes("san francisco"))
    return "San Francisco";

  // Santa Cruz
  if (city.includes("santa cruz") || city.includes("watsonville"))
    return "Santa Cruz";

  // Monterey County
  if (city.includes("salinas") || city.includes("monterey"))
    return "Monterey";

  // Central Valley
  if (city.includes("modesto")) return "Stanislaus";
  if (city.includes("turlock")) return "Stanislaus";
  if (city.includes("stockton")) return "San Joaquin";
  if (city.includes("lodi")) return "San Joaquin";
  if (city.includes("tracy")) return "San Joaquin";
  if (city.includes("manteca")) return "San Joaquin";
  if (city.includes("merced")) return "Merced";
  if (city.includes("atwater") || city.includes("los banos")) return "Merced";
  if (city.includes("madera")) return "Madera";
  if (city.includes("fresno")) return "Fresno";

  return "Santa Clara";
}

// ----------------------------
// MAIN HANDLER
// ----------------------------
export async function GET() {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY;

    // 1) Ticketmaster
    let tmEvents: LiveEvent[] = [];
    if (apiKey) {
      const tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&countryCode=US&stateCode=CA&size=50`;
      const tmRes = await fetch(tmUrl, { cache: "no-store" });
      const tmData = await tmRes.json();
      const rawEvents = tmData._embedded?.events || [];
      tmEvents = rawEvents.map(normalizeTicketmaster);
    }

    // 2) RSS community events
    const rssEvents = await fetchRssEvents();

    // 3) Combine + dedupe by sourceUrl
    const combined = [...tmEvents, ...rssEvents];
    const map = new Map<string, LiveEvent>();

    for (const ev of combined) {
      const key = ev.sourceUrl || ev.id;
      if (!map.has(key)) {
        map.set(key, ev);
      }
    }

    const finalEvents = Array.from(map.values());

    return NextResponse.json(finalEvents);
  } catch (error) {
    console.error("❌ Live events fetch error:", error);
    return NextResponse.json([]);
  }
}
