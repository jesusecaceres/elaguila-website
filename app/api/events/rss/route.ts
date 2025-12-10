// /app/api/events/rss/route.ts

import { NextResponse } from "next/server";
import { fetchRSSEvents } from "../helpers/rssEvents";
import { dedupeEvents } from "../helpers/dedupe";

export const dynamic = "force-dynamic"; // always fresh

export async function GET() {
  try {
    const rssEvents = await fetchRSSEvents();

    // Deduplicate RSS-only results
    const cleaned = dedupeEvents(rssEvents);

    return NextResponse.json(
      {
        total: cleaned.length,
        events: cleaned,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("RSS API ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load RSS events." },
      { status: 500 }
    );
  }
}
