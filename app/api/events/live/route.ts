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
  category: string; 
  type: EventType;
};

// ---------------------------------------------------------
// HELPER — Ensure URLs are safe
// ---------------------------------------------------------
function ensureHttps(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (!url.startsWith("http")) return `https://${url}`;
  return url;
}

// ---------------------------------------------------------
// CATEGORY MAPPING — Maximum Mapping (Option C)
// ---------------------------------------------------------
function mapCategoryAndType(text: string): EventType {
  const t = text.toLowerCase();

  if (t.includes("concert") || t.includes("live") || t.includes("music"))
    return "music";

  if (t.includes("kids") || t.includes("youth") || t.includes("family"))
    return "youth";

  if (t.includes("festival") || t.includes("fair"))
    return "family";

  if (t.includes("food") || t.includes("taco") || t.includes("wine") || t.includes("beer"))
    return "food";

  if (t.includes("club") || t.includes("dj") || t.includes("nightlife") || t.includes("party"))
    return "nightlife";

  if (t.includes("holiday") || t.includes("christmas") || t.includes("navidad"))
    return "holiday";

  if (t.includes("sport") || t.includes("soccer") || t.includes("game") || t.includes("vs "))
    return "sports";

  if (t.includes("couple") || t.includes("date night"))
    return "couples";

  if (t.includes("single") || t.includes("speed dating"))
    return "singles";

  return "community";
}

// ---------------------------------------------------------
// COUNTY DETECTOR — STRICT MODE
// ---------------------------------------------------------
function detectCounty(text: string): string | null {
  const t = text.toLowerCase();

  // Santa Clara
  if (t.includes("san jose")) return "Santa Clara";
  if (t.includes("santa clara")) return "Santa Clara";
  if (t.includes("sunnyvale")) return "Santa Clara";
  if (t.includes("mountain view")) return "Santa Clara";
  if (t.includes("milpitas")) return "Santa Clara";
  if (t.includes("palo alto")) return "Santa Clara";
  if (t.includes("gilroy")) return "Santa Clara";
  if (t.includes("morgan hill")) return "Santa Clara";

  // Alameda
  if (t.includes("oakland") || t.includes("fremont") || t.includes("hayward"))
    return "Alameda";

  // San Mateo
  if (t.includes("san mateo") || t.includes("redwood"))
    return "San Mateo";

  // SF
  if (t.includes("san francisco")) return "San Francisco";

  // Santa Cruz
  if (t.includes("santa cruz") || t.includes("watsonville"))
    return "Santa Cruz";

  // Monterey
  if (t.includes("salinas") || t.includes("monterey"))
    return "Monterey";

  // Central Valley
  if (t.includes("stockton") || t.includes("lodi") || t.includes("tracy") || t.includes("manteca"))
    return "San Joaquin";

  if (t.includes("modesto") || t.includes("turlock"))
    return "Stanislaus";

  if (t.includes("merced") || t.includes("los banos"))
    return "Merced";

  if (t.includes("fresno"))
    return "Fresno";

  return null; // STRICT MODE — reject if no county
}

// ---------------------------------------------------------
// TICKETMASTER NORMALIZER
// ---------------------------------------------------------
function normalizeTicketmaster(ev: any): LiveEvent | null {
  const title = ev.name || "";
  const desc = ev.info || ev.pleaseNote || "";
  const county = detectCounty(
    (ev._embedded?.venues?.[0]?.city?.name || "") + " " + title + " " + desc
  );

  if (!county) return null; // STRICT MODE

  const text = title + " " + desc;
  const type = mapCategoryAndType(text);

  return {
    id: ev.id,
    title,
    description: desc,
    image: ev.images?.[0]?.url || FALLBACK_IMAGE,
    sourceUrl: ensureHttps(ev.url),
    county,
    category: type,
    type,
  };
}

// ---------------------------------------------------------
// FETCH RSS EVENTS FROM THE RSS ROUTE
// ---------------------------------------------------------
async function fetchRssEvents(): Promise<LiveEvent[]> {
  try {
    const base = process.env.BASE_URL;
    if (!base) return [];

    const res = await fetch(`${base}/api/events/rss`, { cache: "no-store" });
    if (!res.ok) return [];

    const data = await res.json();

    return data
      .map((ev: any): LiveEvent | null => {
        const type = mapCategoryAndType(ev.title + " " + ev.description);

        if (!ev.county) return null;

        return {
          id: ev.id,
          title: ev.title,
          description: ev.description,
          image: ev.image || FALLBACK_IMAGE,
          sourceUrl: ev.sourceUrl,
          county: ev.county,
          category: type,
          type,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error("RSS LIVE ERROR:", err);
    return [];
  }
}

// ---------------------------------------------------------
// MAIN HANDLER — MERGE TM + RSS EVENTS
// ---------------------------------------------------------
export async function GET() {
  try {
    let tmEvents: LiveEvent[] = [];

    const key = process.env.TICKETMASTER_API_KEY;
    if (key) {
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${key}&countryCode=US&stateCode=CA&size=50`;

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      const raw = json._embedded?.events || [];
      tmEvents = raw.map(normalizeTicketmaster).filter(Boolean) as LiveEvent[];
    }

    // Get RSS events
    const rssEvents = await fetchRssEvents();

    const combined = [...tmEvents, ...rssEvents];

    // Deduplicate
    const map = new Map<string, LiveEvent>();
    for (const ev of combined) {
      const key = ev.sourceUrl || ev.id;
      if (!map.has(key)) map.set(key, ev);
    }

    return NextResponse.json(Array.from(map.values()));
  } catch (err) {
    console.error("LIVE EVENTS ERROR:", err);
    return NextResponse.json([]);
  }
}
