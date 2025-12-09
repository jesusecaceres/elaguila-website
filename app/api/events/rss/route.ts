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
// REAL EVENT FEEDS ONLY — NO NEWS
// ---------------------------------------------------------
const RSS_FEEDS: { url: string; region: string }[] = [
  // Eventbrite regional event feeds
  { url: "https://www.eventbrite.com/d/ca--san-jose/events/rss/", region: "Santa Clara" },
  { url: "https://www.eventbrite.com/d/ca--gilroy/events/rss/", region: "Santa Clara" },
  { url: "https://www.eventbrite.com/d/ca--san-francisco/events/rss/", region: "San Francisco" },
  { url: "https://www.eventbrite.com/d/ca--oakland/events/rss/", region: "Alameda" },
  { url: "https://www.eventbrite.com/d/ca--fremont/events/rss/", region: "Alameda" },
  { url: "https://www.eventbrite.com/d/ca--santa-cruz/events/rss/", region: "Santa Cruz" },
  { url: "https://www.eventbrite.com/d/ca--salinas/events/rss/", region: "Monterey" },

  // VisitCalifornia-dependent event RSS feeds
  { url: "https://visitstockton.org/events/feed/", region: "San Joaquin" },
  { url: "https://visittracy.com/events/feed/", region: "San Joaquin" },
  { url: "https://visitmanteca.org/events/feed/", region: "San Joaquin" },
  { url: "https://visitfresnocounty.org/events/feed/", region: "Fresno" }
];

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------
function getTagContent(item: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = item.match(regex);
  if (!match || !match[1]) return "";
  return match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

// Extract first valid image from RSS
function extractImage(item: string): string {
  const mediaMatch = item.match(/<media:content[^>]*url="([^"]+)"/i);
  const enclosureMatch = item.match(/<enclosure[^>]*url="([^"]+)"/i);
  return mediaMatch?.[1] || enclosureMatch?.[1] || FALLBACK_IMAGE;
}

// Map text → category (maximum mapping)
function mapCategory(text: string): string {
  const t = text.toLowerCase();

  if (t.includes("concert") || t.includes("live") || t.includes("music"))
    return "Music";

  if (t.includes("kids") || t.includes("youth") || t.includes("family"))
    return "Youth/Kids";

  if (t.includes("festival") || t.includes("fair"))
    return "Family";

  if (t.includes("food") || t.includes("taco") || t.includes("wine") || t.includes("beer"))
    return "Food";

  if (t.includes("night") || t.includes("club") || t.includes("dj") || t.includes("party"))
    return "Nightlife";

  if (t.includes("christmas") || t.includes("holida") || t.includes("navidad"))
    return "Holiday";

  if (t.includes("sport") || t.includes("soccer") || t.includes("basketball") || t.includes("baseball"))
    return "Sports";

  if (t.includes("couple") || t.includes("date night"))
    return "Couples";

  if (t.includes("single") || t.includes("speed dating"))
    return "Singles";

  return "Community";
}

// Map city text → county
function detectCounty(text: string): string | null {
  const t = text.toLowerCase();

  // Bay Area + Region
  if (t.includes("san jose")) return "Santa Clara";
  if (t.includes("santa clara")) return "Santa Clara";
  if (t.includes("sunnyvale")) return "Santa Clara";
  if (t.includes("mountain view")) return "Santa Clara";
  if (t.includes("gilroy")) return "Santa Clara";
  if (t.includes("morgan hill")) return "Santa Clara";

  if (t.includes("oakland") || t.includes("fremont") || t.includes("hayward")) return "Alameda";
  if (t.includes("san mateo") || t.includes("redwood")) return "San Mateo";
  if (t.includes("san francisco")) return "San Francisco";

  if (t.includes("santa cruz") || t.includes("watsonville")) return "Santa Cruz";
  if (t.includes("salinas") || t.includes("monterey")) return "Monterey";

  // Central Valley
  if (t.includes("stockton") || t.includes("lodi") || t.includes("tracy") || t.includes("manteca"))
    return "San Joaquin";

  if (t.includes("merced") || t.includes("los banos")) return "Merced";
  if (t.includes("modesto") || t.includes("turlock")) return "Stanislaus";
  if (t.includes("fresno")) return "Fresno";

  return null; // STRICT MODE
}

// ---------------------------------------------------------
// PARSE RSS
// ---------------------------------------------------------
function parseRss(xml: string, regionDefault: string): RssEvent[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  return items
    .map((item) => {
      const title = getTagContent(item, "title");
      const desc = getTagContent(item, "description");
      const link = getTagContent(item, "link");
      const image = extractImage(item);

      const county = detectCounty(title + " " + desc) || null;

      // STRICT MODE — discard if no location
      if (!county) return null;

      const category = mapCategory(title + " " + desc);

      return {
        id: `rss-${Buffer.from(link).toString("base64")}`,
        title,
        description: desc,
        image,
        sourceUrl: link,
        county,
        category
      };
    })
    .filter(Boolean) as RssEvent[];
}

// ---------------------------------------------------------
// MAIN HANDLER
// ---------------------------------------------------------
export async function GET() {
  try {
    const results = await Promise.all(
      RSS_FEEDS.map(async ({ url, region }) => {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) return [];
          const xml = await res.text();
          return parseRss(xml, region);
        } catch {
          return [];
        }
      })
    );

    const all = results.flat();
    const map = new Map<string, RssEvent>();

    for (const ev of all) {
      if (!map.has(ev.sourceUrl)) map.set(ev.sourceUrl, ev);
    }

    return NextResponse.json(Array.from(map.values()));
  } catch (err) {
    console.error("RSS ERROR:", err);
    return NextResponse.json([]);
  }
}
