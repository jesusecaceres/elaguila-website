// app/api/rss/route.ts

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // required for server functions

export async function GET() {
  try {
    const url =
      "https://newsdata.io/api/1/news?apikey=pub_23658618aea63f3f5a040a6f6ce5c98693d88&q=latino%20america&language=es,en";

    const res = await fetch(url);
    if (!res.ok) throw new Error("RSS provider error");

    const data = await res.json();

    return NextResponse.json({
      status: "ok",
      total: data.totalResults,
      articles: data.results?.map((item: any) => ({
        title: item.title,
        link: item.link,
        description: item.description,
        source: item.source_id,
        published: item.pubDate,
        image: item.image_url,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}
