// app/data/rss-events.ts
// Automatic RSS Event Fetcher for El Águila en Vuelo
// Coach-made system — clean, hybrid, bilingual, cinematic.

// ---------------------------
// Event Structure
// ---------------------------
export interface RSSEvent {
  id: string;
  title: string;
  description: string;
  date: string;            // parsed or detected
  link: string;            // official event link
  source: string;          // url of the RSS feed
  image: string;           // extracted or fallback
  county: string;          // guessed from source
  category: string;        // future NLP classification
}

// ---------------------------
// Fallback Image
// ---------------------------
const FALLBACK_IMAGE = "/event-fallback.png";

// ---------------------------
// RSS Feeds (expand anytime)
// ---------------------------
const rssFeeds: { url: string; county: string }[] = [
  { url: "https://www.mercurynews.com/feed/", county: "Santa Clara" },
  { url: "https://www.eastbaytimes.com/feed/", county: "Alameda" },
  { url: "https://www.visitcalifornia.com/events/rss.xml", county: "California" },
  { url: "https://www.sanjose.org/events/rss", county: "Santa Clara" },
  { url: "https://www.sftravel.com/events/rss", county: "San Francisco" },
];

// ---------------------------
// Parse RSS → JSON
// ---------------------------
async function fetchAndParseRSS(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const xmlText = await res.text();

    // Convert XML → DOM
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "text/xml");

    const items = Array.from(xml.getElementsByTagName("item"));

    return items.map((item) => {
      const title = item.getElementsByTagName("title")[0]?.textContent || "Untitled Event";
      const description =
        item.getElementsByTagName("description")[0]?.textContent || "No description available.";
      const pubDate = item.getElementsByTagName("pubDate")[0]?.textContent || "";
      const link = item.getElementsByTagName("link")[0]?.textContent || "";
      const enclosure = item.getElementsByTagName("enclosure")[0];
      const image =
        enclosure?.getAttribute("url") ||
        FALLBACK_IMAGE;

      return {
        id: `${url}-${title.substring(0, 32)}-${pubDate}`.replace(/\s+/g, ""),
        title,
        description,
        date: pubDate || "",
        link,
        image,
        source: url,
      };
    });
  } catch (err) {
    console.error("RSS Fetch Error:", err);
    return [];
  }
}

// ---------------------------
// Main: Gather All RSS Events
// ---------------------------
export async function getRSSEvents(): Promise<RSSEvent[]> {
  const results: RSSEvent[] = [];

  for (const feed of rssFeeds) {
    const parsed = await fetchAndParseRSS(feed.url);

    parsed.forEach((ev) => {
      results.push({
        ...ev,
        county: feed.county,
        category: "General", // This will be improved when we add auto-classification
      });
    });
  }

  // Remove duplicates by link
  const unique = Array.from(new Map(results.map((e) => [e.link, e])).values());

  // Sort by most recent first
  unique.sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));

  return unique;
}

export default getRSSEvents;
