import { NextResponse } from "next/server";
import Parser from "rss-parser";
import {
  buildSearchQuery,
  dedupeRssArticles,
  didAllFeedsFail,
  extractArticleImage,
  filterSoccerResultQuality,
  googleNewsRssUrl,
  shouldUseSpecializedFeeds,
} from "./newsQuery";

/**
 * A category/subcategory/lang selection's content never changes meaningfully within a couple of
 * minutes (Google News/RSS sources update on their own schedule, not per-request), so serve the
 * CDN's cached copy for that window instead of hitting every upstream feed on every request.
 * stale-while-revalidate keeps serving the last good copy (fresh feeling) while a background
 * request refreshes it; stale-if-error keeps serving it if that background refresh fails outright
 * (e.g. Google News is briefly down) instead of a client ever seeing a hard failure. The cache key
 * is the full request URL, so category/subcategory/lang are never conflated (?category=deportes&
 * subcategory=Soccer&lang=en is a different cache entry than &subcategory=NFL or &lang=es).
 */
const CACHE_CONTROL_SUCCESS = "public, s-maxage=120, stale-while-revalidate=600, stale-if-error=3600";

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "LeonixMediaRSSBot/1.0" },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
});

type Lang = "es" | "en";

type RssArticle = {
  title?: string;
  link?: string;
  img?: string | null;
  date?: string;
  desc?: string;
};

const SOURCES_ES: Record<string, string[]> = {
  // N3 (2026-09-03): removed dead/broken publisher feeds confirmed by direct fetch --
  // univision.com/feeds/sports.xml (404), telemundodeportes.com/rss.xml (serves an HTML page,
  // not RSS), xataka.com/tag/rss (serves an HTML page, not RSS), cnnespanol.cnn.com/category/
  // {tecnologia,economia,internacional}/rss (404, CNN Español restructured these endpoints),
  // forbes.com.mx/feed/ (403 blocked), univision.com/feeds/entertainment.xml (404),
  // telemundo.com/rss/entretenimiento (404), peopleenespanol.com/feed/ (404). Each was already
  // failing silently on every request (caught per-feed, logged, contributed nothing) -- removing
  // them cuts dead-request latency/log noise without changing delivered content.
  deportes: ["https://news.google.com/rss/search?q=deportes+latinoamerica&hl=es&gl=US&ceid=US:es"],
  tecnologia: ["https://news.google.com/rss/search?q=tecnologia+latinoamerica&hl=es&gl=US&ceid=US:es"],
  negocios: ["https://news.google.com/rss/search?q=negocios+latinoamerica&hl=es&gl=US&ceid=US:es"],
  internacional: [
    "https://www.bbc.com/mundo/ultimas_noticias/index.xml",
    "https://news.google.com/rss/search?q=noticias+internacionales&hl=es&gl=US&ceid=US:es",
  ],
  cultura: ["https://news.google.com/rss/search?q=cultura+latina&hl=es&gl=US&ceid=US:es"],
  // Owner-QA Gate 6 (2026-09-03): reordered so getFeedUrls' baseFeeds.slice(0,2) picks up the
  // real, image-bearing publisher feed instead of grabbing two Google News queries -- Google
  // News RSS items carry no image data at all (confirmed by direct inspection), so with the old
  // [google, google, localnewsmatters] order, Local was silently never touching
  // localnewsmatters.org and only ever surfacing image-less Google results.
  local: [
    "https://localnewsmatters.org/feed/",
    "https://news.google.com/rss/search?q=San+Jos%C3%A9+Santa+Clara+noticias&hl=es&gl=US&ceid=US:es",
    "https://news.google.com/rss/search?q=%C3%81rea+de+la+Bah%C3%ADa+Silicon+Valley+noticias&hl=es&gl=US&ceid=US:es",
  ],
  ultimas: [
    "https://news.google.com/rss/search?q=noticias+latinoamerica&hl=es&gl=US&ceid=US:es",
  ],
  tendencias: [
    "https://news.google.com/rss/search?q=tendencias+latinoamerica&hl=es&gl=US&ceid=US:es",
  ],
};

const SOURCES_EN: Record<string, string[]> = {
  deportes: [
    "https://www.espn.com/espn/rss/news",
    "https://news.google.com/rss/search?q=latino+sports&hl=en&gl=US&ceid=US:en",
  ],
  tecnologia: [
    "https://www.theverge.com/rss/index.xml",
    "https://www.engadget.com/rss.xml",
    "https://news.google.com/rss/search?q=technology+latino&hl=en&gl=US&ceid=US:en",
  ],
  negocios: [
    "https://www.cnbc.com/id/10001147/device/rss/rss.html",
    "https://news.google.com/rss/search?q=latino+business&hl=en&gl=US&ceid=US:en",
  ],
  // N3 (2026-09-03): removed rss.cnn.com/rss/cnn_world.rss (DNS/connection failure, unreachable)
  // and nbcnews.com/latino/latino-news/rss.xml (serves an HTML page, not RSS) -- both confirmed
  // dead by direct fetch; each already failed silently on every request.
  internacional: [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://news.google.com/rss/search?q=latin+america+news&hl=en&gl=US&ceid=US:en",
  ],
  cultura: ["https://news.google.com/rss/search?q=latino+culture&hl=en&gl=US&ceid=US:en"],
  // Owner-QA Gate 6 (2026-09-03): reordered -- see matching ES comment above. localnewsmatters.org
  // (content:encoded <img>) and nbcbayarea.com (media:content) both carry genuine article images
  // confirmed by direct feed inspection; they were previously unreachable because slice(0,2)
  // picked up the two Google queries that preceded them instead.
  local: [
    "https://localnewsmatters.org/feed/",
    "https://www.nbcbayarea.com/news/local/feed/",
    "https://news.google.com/rss/search?q=San+Jose+Santa+Clara+County+news&hl=en&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=Bay+Area+Silicon+Valley+news&hl=en&gl=US&ceid=US:en",
  ],
  ultimas: [
    "https://news.google.com/rss/search?q=latino+news&hl=en&gl=US&ceid=US:en",
  ],
  tendencias: [
    "https://news.google.com/rss/search?q=trending+latino&hl=en&gl=US&ceid=US:en",
  ],
};

function getFeedUrls(category: string, subcategory: string | null, lang: Lang): string[] {
  const sources = lang === "en" ? SOURCES_EN : SOURCES_ES;
  const baseFeeds = sources[category] ?? sources.ultimas;

  const trimmed = subcategory?.trim();
  if (!trimmed) {
    return baseFeeds;
  }

  const primaryQuery = buildSearchQuery(category, trimmed, lang);
  const secondaryQuery =
    lang === "es"
      ? `${trimmed} ${category} noticias comunidad latina`
      : `${trimmed} ${category} news Latino community`;

  if (shouldUseSpecializedFeeds(category, trimmed, lang)) {
    // The generic category base feed is not subcategory-scoped and dilutes a narrower
    // subcategory with unrelated content from the same broad category. This subcategory relies
    // only on its two dedicated, query-scoped Google News searches. See shouldUseSpecializedFeeds
    // for which (category, subcategory) pairs this covers and the evidence behind each.
    return [googleNewsRssUrl(primaryQuery, lang), googleNewsRssUrl(secondaryQuery, lang)];
  }

  return [
    googleNewsRssUrl(primaryQuery, lang),
    googleNewsRssUrl(secondaryQuery, lang),
    // Include two publisher feeds so image-bearing sources (e.g. Engadget enclosures) surface alongside Google News.
    ...baseFeeds.slice(0, 2),
  ];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "ultimas";
  const subcategory = searchParams.get("subcategory");
  const langParam = searchParams.get("lang") || "es";
  const lang: Lang = langParam === "en" ? "en" : "es";

  const feeds = getFeedUrls(category, subcategory, lang);

  try {
    const promises = feeds.map(async (url: string) => {
      try {
        const feed = await parser.parseURL(url);
        const items = feed.items.map((item) => {
          const record = item as unknown as Record<string, unknown>;
          const content =
            typeof record.content === "string"
              ? record.content
              : typeof record["content:encoded"] === "string"
                ? record["content:encoded"]
                : undefined;

          return {
            title: typeof item.title === "string" ? item.title : "",
            link: typeof item.link === "string" ? item.link : "",
            img: extractArticleImage(item, content),
            date: item.isoDate || item.pubDate || undefined,
            desc: item.contentSnippet || "",
          } satisfies RssArticle;
        });
        return { ok: true, items };
      } catch (err) {
        console.error("Feed error:", url, err);
        return { ok: false, items: [] as RssArticle[] };
      }
    });

    const feedResults = await Promise.all(promises);

    if (didAllFeedsFail(feedResults)) {
      // Every feed threw (upstream unreachable/429/timeout/malformed XML) -- a genuine, temporary
      // failure, not "this narrow query has zero matches". Signal it as an error (503) so the CDN's
      // stale-if-error can serve the last known-good cached copy for this exact selection instead
      // of a client ever seeing this empty response; never cache this response itself.
      return NextResponse.json([], { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    const deduped = dedupeRssArticles(feedResults.flatMap((r) => r.items));
    const all = filterSoccerResultQuality(deduped, category, subcategory);

    all.sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );

    return NextResponse.json(all.slice(0, 40), {
      headers: { "Cache-Control": CACHE_CONTROL_SUCCESS },
    });
  } catch (err) {
    console.error("RSS ENGINE ERROR:", err);
    return NextResponse.json([], { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

