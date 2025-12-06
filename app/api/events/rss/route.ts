import { NextResponse } from "next/server";
import Parser from "rss-parser";

// -----------------------------
// CONFIG
// -----------------------------

const EVENTBRITE_TOKEN = process.env.EVENTBRITE_API_KEY;
const MEETUP_KEY = process.env.MEETUP_API_KEY || null;

const FALLBACK_IMAGE = "/fallback-event.jpg";

// Cities we target for Eventbrite + Meetup
const TARGET_CITIES = [
  "San Jose",
  "Santa Clara",
  "Sunnyvale",
  "Mountain View",
  "Palo Alto",
  "Fremont",
  "Hayward",
  "Oakland",
  "Berkeley",
  "San Francisco",
  "San Mateo",
  "Milpitas",
  "Campbell",
  "Los Gatos",
  "Redwood City",
  "Union City",
  "Modesto",
  "Turlock",
  "Ceres",
  "Manteca",
  "Stockton",
  "Lodi",
  "Merced",
  "Hollister",
  "Gilroy",
  "Morgan Hill",
  "Salinas",
  "Watsonville",
  "Santa Cruz",
];

// City → County map
const CITY_TO_COUNTY: Record<string, string> = {
  "San Jose": "Santa Clara",
  "Santa Clara": "Santa Clara",
  "Sunnyvale": "Santa Clara",
  "Mountain View": "Santa Clara",
  "Palo Alto": "Santa Clara",
  "Fremont": "Alameda",
  "Hayward": "Alameda",
  "Oakland": "Alameda",
  "Berkeley": "Alameda",
  "San Francisco": "San Francisco",
  "San Mateo": "San Mateo",
  "Redwood City": "San Mateo",
  "Milpitas": "Santa Clara",
  "Los Gatos": "Santa Clara",
  "Campbell": "Santa Clara",
  "Union City": "Alameda",
  "Modesto": "Stanislaus",
  "Ceres": "Stanislaus",
  "Turlock": "Stanislaus",
  "Manteca": "San Joaquin",
  "Stockton": "San Joaquin",
  "Lodi": "San Joaquin",
  "Merced": "Merced",
  "Hollister": "San Benito",
  "Gilroy": "Santa Clara",
  "Morgan Hill": "Santa Clara",
  "Salinas": "Monterey",
  "Watsonville": "Santa Cruz",
  "Santa Cruz": "Santa Cruz",
};

// -----------------------------
// HELPERS
// -----------------------------

function normalizeEvent(evt: any) {
  return {
    id: evt.id || crypto.randomUUID(),
    title: evt.title || "Untitled Event",
    description: evt.description || "",
    date: evt.date || "",
    time: evt.time || "",
    city: evt.city || "",
    county: CITY_TO_COUNTY[evt.city] || "",
    category: evt.category || "Community",
    image: evt.image || FALLBACK_IMAGE,
    sourceUrl: evt.sourceUrl || "",
  };
}

// Remove duplicates by title + date
function dedupe(events: any[]) {
  const seen = new Set();
  return events.filter((evt) => {
    const key = `${evt.title}-${evt.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// -----------------------------
// EVENTBRITE FETCHER
// -----------------------------

async function fetchEventbrite() {
  if (!EVENTBRITE_TOKEN) return [];

  const allEvents: any[] = [];

  for (const city of TARGET_CITIES) {
    const url = `https://www.eventbriteapi.com/v3/events/search/?location.address=${encodeURIComponent(
      city
    )}&token=${EVENTBRITE_TOKEN}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) continue;

    const data = await res.json();
    if (!data.events) continue;

    for (const e of data.events) {
      const start = e.start?.local || "";
      const date = start ? start.split("T")[0] : "";

      if (new Date(date) < new Date()) continue; // past events filtered

      allEvents.push(
        normalizeEvent({
          id: e.id,
          title: e.name.text,
          description: e.description?.text || "",
          date,
          time: start ? start.split("T")[1].slice(0, 5) : "",
          city,
          category: e.category_id || "Community",
          image: e.logo?.url || FALLBACK_IMAGE,
          sourceUrl: e.url,
        })
      );
    }
  }

  return allEvents;
}

// -----------------------------
// MEETUP FETCHER (Optional)
// -----------------------------

async function fetchMeetup() {
  if (!MEETUP_KEY) return [];

  const allEvents: any[] = [];

  for (const city of TARGET_CITIES) {
    const url = `https://api.meetup.com/find/upcoming_events?key=${MEETUP_KEY}&text=${encodeURIComponent(
      city
    )}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) continue;

    const data = await res.json();
    if (!data.events) continue;

    for (const e of data.events) {
      const date = e.local_date;
      if (new Date(date) < new Date()) continue;

      allEvents.push(
        normalizeEvent({
          id: e.id,
          title: e.name,
          description: e.description || "",
          date: e.local_date,
          time: e.local_time,
          city,
          category: "Community",
          image: e.featured_photo?.photo_link || FALLBACK_IMAGE,
          sourceUrl: e.link,
        })
      );
    }
  }

  return allEvents;
}

// -----------------------------
// RSS FETCHER (LA Times + Mercury News)
// -----------------------------

async function fetchRSS() {
  const parser = new Parser();
  const feeds = [
    "https://www.latimes.com/california.rss",
    "https://www.mercurynews.com/events/feed/",
  ];

  const events: any[] = [];

  for (const feed of feeds) {
    try {
      const rss = await parser.parseURL(feed);
      rss.items.forEach((item) => {
        events.push(
          normalizeEvent({
            title: item.title,
            description: item.contentSnippet || "",
            date: item.pubDate ? item.pubDate.split(" ")[0] : "",
            time: "",
            city: "",
            category: "Community",
            image: FALLBACK_IMAGE,
            sourceUrl: item.link,
          })
        );
      });
    } catch (e) {}
  }

  return events;
}

// -----------------------------
// MAIN ROUTE
// -----------------------------

export async function GET() {
  try {
    const [eb, meetup, rss] = await Promise.all([
      fetchEventbrite(),
      fetchMeetup(),
      fetchRSS(),
    ]);

    let combined = [...eb, ...meetup, ...rss];

    // future events only
    combined = combined.filter((e) => e.date && new Date(e.date) >= new Date());

    combined = dedupe(combined);

    return NextResponse.json(combined, {
      headers: {
        "Cache-Control": "s-maxage=10800", // 3 hours
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }
}
