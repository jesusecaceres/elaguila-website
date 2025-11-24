import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  },
});

// ------------------------------------------------------------------
//  RSS SOURCES (Google, Univision, Telemundo, CNN Español)
// ------------------------------------------------------------------
const sources = [
  // Google News (Spanish + English)
  "https://news.google.com/rss?hl=es-US&gl=US&ceid=US:es",
  "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",

  // Univision
  "https://feeds.univision.com/rss/news.xml",

  // Telemundo
  "https://www.telemundo.com/rss.xml",

  // CNN Español
  "https://cnnespanol.cnn.com/feed/",
];

// ------------------------------------------------------------------
//  FETCH + MERGE + CLEAN RSS FEEDS
// ------------------------------------------------------------------
export async function GET(req: Request) {
  try {
    let allArticles: any[] = [];

    const feedPromises = sources.map((url) =>
      parser
        .parseURL(url)
        .then((feed) =>
          feed.items.map((item) => ({
            title: item.title || "",
            link: item.link || "",
            content: item.contentSnippet || item.content || "",
            date: item.pubDate || null,
            isoDate: item.isoDate || null,
            img: extractImage(item.content || "") || null,
            source: feed.title || "Unknown",
          }))
        )
        .catch((err) => {
          console.error("Feed error for URL:", url);
          return [];
        })
    );

    const results = await Promise.all(feedPromises);

    results.forEach((group) => {
      allArticles = allArticles.concat(group);
    });

    // Sort newest first (safe sort)
    allArticles.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    // Return first 50 for performance
    return NextResponse.json(allArticles.slice(0, 50));
  } catch (err) {
    console.error("RSS ENGINE ERROR:", err);
    return NextResponse.json([]);
  }
}

// ------------------------------------------------------------------
// Extract image URL from HTML
// ------------------------------------------------------------------
function extractImage(html: string) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^">]+)"/i);
  return match ? match[1] : null;
}
