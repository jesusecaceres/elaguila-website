// /app/api/events/helpers/rssEvents.ts

import Parser from "rss-parser";
import { normalizeEvent } from "./normalizeEvent";
import { CityInfo } from "./cityMap";

const parser = new Parser();

// ----- SAFE LOCAL + REGIONAL RSS FEEDS -----

const RSS_FEEDS: { name: string; url: string; city: string; county: string }[] = [
  // 1️⃣ Downtown San Jose
  {
    name: "Downtown San Jose Events",
    url: "https://sjdowntown.com/events/feed/",
    city: "sanjose",
    county: "Santa Clara County",
  },

  // 2️⃣ City of San José Events
  {
    name: "City of San Jose Calendar",
    url: "https://www.sanjoseca.gov/Home/Components/News/NewsFeed?format=rss",
    city: "sanjose",
    county: "Santa Clara County",
  },

  // 3️⃣ San José Public Library
  {
    name: "San Jose Library Events",
    url: "https://events.sjpl.org/events/feed/rss",
    city: "sanjose",
    county: "Santa Clara County",
  },

  // 4️⃣ Eventbrite Regional RSS
  {
    name: "Eventbrite Regional Feed",
    url: "https://www.eventbrite.com/d/ca--san-jose/events--rss/",
    city: "sanjose",
    county: "Santa Clara County",
  },

  // 5️⃣ Meetup (SAFE FAMILY GROUP)
  {
    name: "San Jose Family Events (Meetup)",
    url: "https://www.meetup.com/sanjose-family-events/events/rss/",
    city: "sanjose",
    county: "Santa Clara County",
  },

  // 6️⃣ Meetup (SAFE SOCIAL GROUP)
  {
    name: "San Jose Social Events (Meetup)",
    url: "https://www.meetup.com/sanjose-social-events/events/rss/",
    city: "sanjose",
    county: "Santa Clara County",
  },
];

// Fetch limit
const LIMIT = 10;

export async function fetchRSSEvents(): Promise<any[]> {
  const results: any[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const data = await parser.parseURL(feed.url);

      const sliced = data.items.slice(0, LIMIT);

      for (const item of sliced) {
        const mapped = {
          id: item.guid || item.id || `${feed.name}-${Math.random()}`,
          title: item.title,
          description: item.contentSnippet || "",
          url: item.link,
          startDate: item.pubDate || null,
          venue: feed.name,
          image: item.enclosure?.url || null,
        };

        // We normalize using our San Jose cityInfo because RSS feeds aren't city-specific
        const cityInfo: CityInfo = {
          name: "San Jose",
          slug: "sanjose",
          county: "Santa Clara County",
        };

        const normalized = normalizeEvent(mapped, cityInfo, "rss");
        if (normalized) results.push(normalized);
      }
    } catch (err) {
      console.error(`RSS Feed failed (${feed.name}):`, err);
      continue; // never break the full RSS engine
    }
  }

  return results;
}
