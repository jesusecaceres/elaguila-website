import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGE = "/event-fallback.png";

type RssEvent = {
  id: string;
  title: string;
  description: string;
  image: string;
  sourceUrl: string;
  county: string;
  category: string;
};

// ---------------------------------------------------------
// RSS SOURCES — PLACEHOLDERS FOR BAY AREA + CENTRAL VALLEY
// Replace these with actual city event RSS feeds once you have them.
// ---------------------------------------------------------
const RSS_FEEDS: { url: string; source: string }[] = [
  // BAY AREA
  { url: "https://www.mercurynews.com/feed/", source: "Mercury News" },
  { url: "https://events.sanjoseca.gov/feed", source: "San Jose" },
  { url: "https://events.santaclaraca.gov/feed", source: "Santa Clara" },
  { url: "https://events.gilroy.com/feed", source: "Gilroy" },
  { url: "https://events.morganhill.ca.gov/feed", source: "Morgan Hill" },
  { url: "https://events.hollister.ca.gov/feed", source: "Hollister" },
  { url: "https://events.santacruzcounty.us/feed", source: "Santa Cruz" },
  { url: "https://events.montereycounty.us/feed", source: "Monterey" },

  // CENTRAL VALLEY — placeholders (most use ICS instead of RSS, but coded here)
  { url: "https://visitstockton.org/events/feed", source: "Stockton" },
  { url: "https://www.lodinews.com/feed/", source: "Lodi" },
  { url: "https://www.modbee.com/news/local/community/?ac=1&mr=1&mi=1&rss=true", source: "Modesto" },
  { url: "https://visittracy.com/events/feed", source: "Tracy" },
  { url: "https://visitmanteca.org/events/feed", source: "Manteca" },
  { url: "https://visitfresnocounty.org/events/feed", source: "Fresno" },
  { url: "https://www.cityofmadera.ca.gov/feed", source: "Madera" },
  { url: "https://www.co.merced.ca.us/rss", source: "Merced" },
];

// ---------------------------------------------------------
// Helper: Extract text from XML tag
// ---------------------------------------------------------
function getTagContent(item: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = item.match(regex);
  if (!match || !match[1]) return "";
  return match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

// ---------------------------------------------------------
// Parse RSS into structured events
// ---------------------------------------------------------
function parseRss(xml: string, source: string): RssEvent[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  return items.map((item) => {
    const title = getTagContent(item, "title") || "Evento";
    const description =
      getTagContent(item, "description") || getTagContent(item, "summary");
    const link = getTagContent(item, "link");

    // Image detection
    let image = FALLBACK_IMAGE;
    const mediaMatch = item.match(/<media:content[^>]*url="([^"]+)"[^>]*>/i);
    const enclosureMatch = item.match(/<enclosure[^>]*url="([^"]+)"[^>]*>/i);
    if (mediaMatch?.[1]) image = mediaMatch[1];
    if (enclosureMatch?.[1]) image = enclosureMatch[1];

    const county = guessCounty(title + " " + description);
    const category = guessCategory(title + " " + description);

    return {
      id: `rss-${source}-${Buffer.from(link || title).toString("base64")}`,
      title,
      description,
      image,
      sourceUrl: link || "",
      county,
      category,
    };
  });
}

// ---------------------------------------------------------
// Assign county by keywords
// ---------------------------------------------------------
function guessCounty(text: string): string {
  const t = text.toLowerCase();

  // Santa Clara County
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
  if (t.includes("san mateo") || t.includes("redwood city") || t.includes("burlingame"))
    return "San Mateo";

  // San Francisco
  if (t.includes("san francisco")) return "San Francisco";

  // Santa Cruz
  if (t.includes("santa cruz") || t.includes("watsonville"))
    return "Santa Cruz";

  // Monterey County
  if (t.includes("salinas") || t.includes("monterey") || t.includes("marina"))
    return "Monterey";

  // San Benito
  if (t.includes("hollister")) return "San Benito";

  // CENTRAL VALLEY
  if (t.includes("modesto")) return "Stanislaus";
  if (t.includes("turlock")) return "Stanislaus";
  if (t.includes("stockton")) return "San Joaquin";
  if (t.includes("lodi")) return "San Joaquin";
  if (t.includes("tracy")) return "San Joaquin";
  if (t.includes("manteca")) return "San Joaquin";
  if (t.includes("merced")) return "Merced";
  if (t.includes("atwater") || t.includes("los banos"))
    return "Merced";
  if (t.includes("madera")) return "Madera";
  if (t.includes("fresno")) return "Fresno";

  return "Santa Clara";
}

// ---------------------------------------------------------
// Categorize event
// ---------------------------------------------------------
function guessCategory(text: string): string {
  const t = text.toLowerCase();

  if (t.includes("kids") || t.includes("niños") || t.includes("youth"))
    return "Youth/Kids";

  if (t.includes("family") || t.includes("festival") || t.includes("fair"))
    return "Family";

  if (t.includes("music") || t.includes("concert") || t.includes("live"))
    return "Music";

  if (t.includes("food") || t.includes("comida") || t.includes("taco"))
    return "Food";

  if (t.includes("sports") || t.includes("soccer") || t.includes("basketball"))
    return "Sports";

  if (t.includes("nightlife") || t.includes("club") || t.includes("dj"))
    return "Nightlife";

  if (t.includes("holiday") || t.includes("christmas") || t.includes("navidad"))
    return "Holiday";

  return "Community";
}

// ---------------------------------------------------------
// MAIN HANDLER
// ---------------------------------------------------------
export async function GET() {
  try {
    const results = await Promise.all(
      RSS_FEEDS.map(async (feed) => {
        try {
          const res = await fetch(feed.url, { cache: "no-store" });
          if (!res.ok) return [];
          const xml = await res.text();
          return parseRss(xml, feed.source);
        } catch {
          return [];
        }
      })
    );

    // Flatten + dedupe
    const allEvents = results.flat().filter((ev) => ev.sourceUrl);

    const map = new Map<string, RssEvent>();
    for (const ev of allEvents) {
      if (!map.has(ev.sourceUrl)) map.set(ev.sourceUrl, ev);
    }

    return NextResponse.json(Array.from(map.values()));
  } catch {
    return NextResponse.json([]);
  }
}
