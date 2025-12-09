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

//
// ------------------------------------------------------------
// A G G R E S S I V E   R S S   S O U R C E S
// ------------------------------------------------------------
// These include Bay Area + Central Valley feeds.
// Some block serverless traffic — aggressive mode bypasses that.
//
const RSS_FEEDS: { url: string; source: string }[] = [
  // BAY AREA
  { url: "https://www.mercurynews.com/feed/", source: "Mercury News" },
  { url: "https://events.sanjoseca.gov/feed", source: "San Jose" },
  { url: "https://events.santaclaraca.gov/feed", source: "Santa Clara" },
  { url: "https://events.gilroy.com/feed", source: "Gilroy" },
  { url: "https://events.morganhill.ca.gov/feed", source: "Morgan Hill" },
  { url: "https://events.santacruzcounty.us/feed", source: "Santa Cruz" },
  { url: "https://events.montereycounty.us/feed", source: "Monterey" },

  // CENTRAL VALLEY
  { url: "https://visitstockton.org/events/feed", source: "Stockton" },
  { url: "https://www.lodinews.com/feed/", source: "Lodi" },
  { url: "https://www.modbee.com/news/local/community/?ac=1&mr=1&mi=1&rss=true", source: "Modesto" },
  { url: "https://visittracy.com/events/feed", source: "Tracy" },
  { url: "https://visitmanteca.org/events/feed", source: "Manteca" },
  { url: "https://visitfresnocounty.org/events/feed", source: "Fresno" },
  { url: "https://www.cityofmadera.ca.gov/feed", source: "Madera" },
  { url: "https://www.co.merced.ca.us/rss", source: "Merced" },
];

//
// ------------------------------------------------------------
// Aggressive Fetch Helper
// ------------------------------------------------------------
// Custom headers, redirect following, fallback attempts, and error tolerance.
//
async function aggressiveFetch(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
      },
    });

    if (!res.ok) return null;

    const text = await res.text();
    if (!text || text.trim().length < 20) return null;

    return text;
  } catch {
    return null;
  }
}

//
// ------------------------------------------------------------
// XML Parsing Helpers
// ------------------------------------------------------------
function getTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  if (!match) return "";
  return match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

function parseRss(xml: string, source: string): RssEvent[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  return items.map((item) => {
    const title = getTag(item, "title") || "Evento";
    const description =
      getTag(item, "description") || getTag(item, "summary") || "";
    const link = getTag(item, "link");

    // Image search
    let image = FALLBACK_IMAGE;
    const media = item.match(/<media:content[^>]*url="([^"]+)"/i);
    const enc = item.match(/<enclosure[^>]*url="([^"]+)"/i);
    if (media?.[1]) image = media[1];
    if (enc?.[1]) image = enc[1];

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

//
// ------------------------------------------------------------
// County Mapping
// ------------------------------------------------------------
function guessCounty(t: string): string {
  const s = t.toLowerCase();

  // Santa Clara County
  if (
    s.includes("san jose") ||
    s.includes("santa clara") ||
    s.includes("sunnyvale") ||
    s.includes("mountain view") ||
    s.includes("milpitas") ||
    s.includes("palo alto") ||
    s.includes("gilroy") ||
    s.includes("morgan hill")
  ) return "Santa Clara";

  // Alameda
  if (s.includes("oakland") || s.includes("fremont") || s.includes("hayward"))
    return "Alameda";

  // San Mateo
  if (s.includes("san mateo") || s.includes("redwood") || s.includes("burlingame"))
    return "San Mateo";

  // San Francisco
  if (s.includes("san francisco")) return "San Francisco";

  // Santa Cruz
  if (s.includes("santa cruz") || s.includes("watsonville"))
    return "Santa Cruz";

  // Monterey
  if (s.includes("salinas") || s.includes("monterey") || s.includes("marina"))
    return "Monterey";

  // Central Valley
  if (s.includes("stockton")) return "San Joaquin";
  if (s.includes("lodi")) return "San Joaquin";
  if (s.includes("tracy")) return "San Joaquin";
  if (s.includes("manteca")) return "San Joaquin";

  if (s.includes("modesto") || s.includes("turlock")) return "Stanislaus";
  if (s.includes("merced") || s.includes("los banos") || s.includes("atwater"))
    return "Merced";
  if (s.includes("fresno")) return "Fresno";
  if (s.includes("madera")) return "Madera";

  return "Santa Clara";
}

//
// ------------------------------------------------------------
// Category Mapping
// ------------------------------------------------------------
function guessCategory(text: string): string {
  const t = text.toLowerCase();

  if (t.includes("kids") || t.includes("niños") || t.includes("youth"))
    return "Youth/Kids";

  if (t.includes("family") || t.includes("festival") || t.includes("fair"))
    return "Family";

  if (t.includes("music") || t.includes("concert") || t.includes("live"))
    return "Music";

  if (t.includes("food") || t.includes("taco") || t.includes("comida"))
    return "Food";

  if (t.includes("sport") || t.includes("soccer") || t.includes("basketball"))
    return "Sports";

  if (t.includes("night") || t.includes("club") || t.includes("dj"))
    return "Nightlife";

  if (t.includes("holiday") || t.includes("christmas") || t.includes("navidad"))
    return "Holiday";

  return "Community";
}

//
// ------------------------------------------------------------
// MAIN HANDLER (AGGRESSIVE MODE)
// ------------------------------------------------------------
export async function GET() {
  try {
    const results = await Promise.all(
      RSS_FEEDS.map(async (feed) => {
        const raw = await aggressiveFetch(feed.url);
        if (!raw) return [];
        return parseRss(raw, feed.source);
      })
    );

    // Flatten + dedupe by URL
    const flat = results.flat().filter((ev) => ev.sourceUrl);
    const map = new Map<string, RssEvent>();

    for (const ev of flat) {
      if (!map.has(ev.sourceUrl)) map.set(ev.sourceUrl, ev);
    }

    return NextResponse.json(Array.from(map.values()));
  } catch (err) {
    console.error("RSS ERROR:", err);
    return NextResponse.json([]);
  }
}
