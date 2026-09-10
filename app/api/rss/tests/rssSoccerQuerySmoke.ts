import {
  buildSearchQuery,
  dedupeRssArticles,
  didAllFeedsFail,
  decodeHtmlEntities,
  extractArticleImage,
  extractImagesFromHtml,
  filterSoccerResultQuality,
  isAmericanFootballNoise,
  normalizedHeadlineKey,
  normalizeImageUrl,
  selectBestImageUrl,
  shouldUseSpecializedFeeds,
} from "../newsQuery";

/**
 * Regression guard for the EN Sports -> Soccer / ES Deportes -> Fútbol query defect.
 * Root cause: the EN soccer query used the bare word "football", which Google News
 * search treats as ambiguous with NFL/American football. Guards:
 *   1. The EN soccer/futbol query text never contains the bare word "football" and
 *      negatively constrains NFL/college football/gridiron.
 *   2. The ES fútbol/soccer query is untouched and still targets soccer.
 *   3. The NFL query is untouched.
 *   4. The result-quality filter drops American-football contamination only from the
 *      soccer/futbol subcategory, and never touches NFL or other subcategories.
 */
export function assertRssSoccerQuerySmoke(): boolean {
  const checks: boolean[] = [];

  const enSoccer = buildSearchQuery("deportes", "soccer", "en");
  const enFutbol = buildSearchQuery("deportes", "futbol", "en");
  // The original bug: bare "football" with no exclusion, e.g. "soccer football news Latino".
  checks.push(!/football news/i.test(enSoccer));
  checks.push(!/football news/i.test(enFutbol));
  checks.push(/\bsoccer\b/i.test(enSoccer));
  checks.push(/-NFL/i.test(enSoccer));
  // N3 regression: a quoted multi-word exclusion (e.g. -"college football") combined with this
  // many other terms was proven (live, 2026-09-03) to make Google News RSS search return ZERO
  // results — a live, empirically confirmed defect, not a style preference. The query must never
  // contain a quoted phrase again.
  checks.push(!/-"/.test(enSoccer));
  checks.push(enSoccer === enFutbol);

  const esFutbol = buildSearchQuery("deportes", "futbol", "es");
  const esSoccer = buildSearchQuery("deportes", "soccer", "es");
  checks.push(/f[uú]tbol/i.test(esFutbol));
  checks.push(esFutbol === esSoccer);
  checks.push(esFutbol === "fútbol soccer noticias latinoamérica");

  const enNfl = buildSearchQuery("deportes", "nfl", "en");
  const esNfl = buildSearchQuery("deportes", "nfl", "es");
  checks.push(/\bNFL\b/.test(enNfl));
  checks.push(/\bNFL\b/.test(esNfl));

  checks.push(isAmericanFootballNoise("Cowboys beat Eagles in NFL showdown") === true);
  checks.push(isAmericanFootballNoise("Messi scores winning goal in Liga MX final") === false);
  checks.push(isAmericanFootballNoise("El equipo de fútbol clasifica a la final de la CONCACAF") === false);

  const mixedFeed = [
    { title: "Messi leads Inter Miami to MLS Cup win", desc: "" },
    { title: "Cowboys clinch playoff berth in NFL finale", desc: "" },
    { title: "Liga MX: América avanza a semifinales", desc: "" },
    { title: "College football: Ohio State wins Big Ten title", desc: "" },
  ];

  const filteredSoccer = filterSoccerResultQuality(mixedFeed, "deportes", "soccer");
  checks.push(filteredSoccer.length === 2);
  checks.push(filteredSoccer.every((a) => !/nfl|college football/i.test(a.title)));

  const filteredNfl = filterSoccerResultQuality(mixedFeed, "deportes", "nfl");
  checks.push(filteredNfl.length === mixedFeed.length);

  const filteredUnrelated = filterSoccerResultQuality(mixedFeed, "tecnologia", "ia");
  checks.push(filteredUnrelated.length === mixedFeed.length);

  // N3: subcategories under a category with a diluting generic base feed (deportes, tecnologia,
  // negocios, internacional) skip it in English; NFL and NCAA are exempt (proven to benefit from
  // it); "local"/"ultimas"/"tendencias" are never affected (no diluting base feed to skip); ES is
  // always false.
  checks.push(shouldUseSpecializedFeeds("deportes", "nba", "en") === true);
  checks.push(shouldUseSpecializedFeeds("deportes", "mlb", "en") === true);
  checks.push(shouldUseSpecializedFeeds("deportes", "nhl", "en") === true);
  checks.push(shouldUseSpecializedFeeds("deportes", "boxing", "en") === true);
  checks.push(shouldUseSpecializedFeeds("deportes", "soccer", "en") === true);
  checks.push(shouldUseSpecializedFeeds("deportes", "nfl", "en") === false);
  checks.push(shouldUseSpecializedFeeds("deportes", "ncaa", "en") === false);
  checks.push(shouldUseSpecializedFeeds("negocios", "entrepreneurs", "en") === true);
  checks.push(shouldUseSpecializedFeeds("tecnologia", "ai", "en") === true);
  checks.push(shouldUseSpecializedFeeds("internacional", "mexico", "en") === true);
  checks.push(shouldUseSpecializedFeeds("local", "san jose", "en") === false);
  checks.push(shouldUseSpecializedFeeds("ultimas", "breaking", "en") === false);
  checks.push(shouldUseSpecializedFeeds("deportes", "nba", "es") === false);
  checks.push(shouldUseSpecializedFeeds("negocios", "entrepreneurs", "es") === false);

  // N3: normalized headline key strips a genuine "Headline - Publisher" suffix but leaves a
  // headline that merely contains a hyphen alone.
  checks.push(
    normalizedHeadlineKey("Liga MX Wants Back In: Mexican Clubs Return? - Soy Futbol") ===
      "liga mx wants back in: mexican clubs return?"
  );
  checks.push(
    normalizedHeadlineKey("Team-building exercises boost morale") ===
      "team-building exercises boost morale"
  );

  // N3: dedupe catches the same story surfaced by two different Google News queries with
  // different tracking-URL blobs (link differs) but an identical or publisher-suffix-only-
  // different title, while never merging genuinely distinct stories.
  const rawFeed = [
    { title: "Liga MX Dominates Leagues Cup - Soy Futbol", link: "https://news.google.com/rss/articles/AAA" },
    { title: "Liga MX Dominates Leagues Cup - Soy Futbol", link: "https://news.google.com/rss/articles/BBB" },
    { title: "Liga MX Dominates Leagues Cup - ESPN", link: "https://news.google.com/rss/articles/CCC" },
    { title: "Son Heung-min scores twice for MLS All-Stars", link: "https://news.google.com/rss/articles/DDD" },
  ];
  const dedupedFeed = dedupeRssArticles(rawFeed);
  checks.push(dedupedFeed.length === 2);
  checks.push(dedupedFeed.some((a) => a.title.startsWith("Son Heung-min")));

  // N4: didAllFeedsFail distinguishes "every feed threw" (temporary upstream failure) from a
  // genuinely empty result (feeds fetched fine, just nothing matched) or partial failure.
  checks.push(didAllFeedsFail([{ ok: false }, { ok: false }, { ok: false }]) === true);
  checks.push(didAllFeedsFail([{ ok: true }, { ok: false }]) === false);
  checks.push(didAllFeedsFail([{ ok: true }, { ok: true }]) === false);
  checks.push(didAllFeedsFail([]) === false);

  // Owner-QA Gate 6: HTML-entity decoding on image URLs -- WordPress-style feeds (Local News
  // Matters) emit "&#038;"/"&amp;" for a literal "&" in a query string; a raw src attribute must
  // not survive as "&amp;ssl=1" (which depends on the CDN ignoring the resulting bogus
  // "amp;ssl" param instead of genuinely being correct).
  checks.push(decodeHtmlEntities("a&amp;b") === "a&b");
  checks.push(decodeHtmlEntities("a&#038;b") === "a&b");
  checks.push(decodeHtmlEntities("a&#x26;b") === "a&b");
  checks.push(
    normalizeImageUrl("https://i0.wp.com/img.jpg?fit=1024%2C768&amp;ssl=1") ===
      "https://i0.wp.com/img.jpg?fit=1024%2C768&ssl=1"
  );

  // selectBestImageUrl: rejects tracking pixels/blank/favicon/gif outright, defers (but still
  // uses) a "logo" URL only when nothing better is available, and otherwise takes the first
  // usable candidate in priority order.
  checks.push(
    selectBestImageUrl(["https://cdn.example.com/tracking-pixel.png", "https://cdn.example.com/real-photo.jpg"]) ===
      "https://cdn.example.com/real-photo.jpg"
  );
  checks.push(selectBestImageUrl(["https://cdn.example.com/site-logo.png"]) === "https://cdn.example.com/site-logo.png");
  checks.push(
    selectBestImageUrl(["https://cdn.example.com/site-logo.png", "https://cdn.example.com/real-photo.jpg"]) ===
      "https://cdn.example.com/real-photo.jpg"
  );
  checks.push(selectBestImageUrl(["not-a-url", "javascript:alert(1)"]) === null);

  // extractImagesFromHtml: pulls a real <img src>, ignores tags with no src, and falls back to
  // the first candidate in a srcset when present.
  checks.push(
    extractImagesFromHtml('<figure><img src="https://cdn.example.com/photo.jpg" alt=""></figure>')[0] ===
      "https://cdn.example.com/photo.jpg"
  );
  checks.push(extractImagesFromHtml("<p>no image here</p>").length === 0);
  checks.push(
    extractImagesFromHtml('<img srcset="https://cdn.example.com/small.jpg 300w, https://cdn.example.com/big.jpg 800w">')[0] ===
      "https://cdn.example.com/small.jpg"
  );

  // extractArticleImage: confirms the full priority chain -- media:content wins over a plain
  // enclosure, and a bare enclosure is used when nothing richer is present; a Google News-style
  // item (no enclosure/media fields, plain-text content) genuinely yields no image, matching what
  // was found live -- Google News RSS carries no image data at all, not an extraction miss.
  checks.push(
    extractArticleImage({
      enclosure: { url: "https://cdn.example.com/enclosure.jpg", type: "image/jpeg" },
    } as never) === "https://cdn.example.com/enclosure.jpg"
  );
  checks.push(
    extractArticleImage({ contentSnippet: "Plain text, no image fields at all." } as never, undefined) === null
  );
  checks.push(
    extractArticleImage({} as never, '<figure><img src="https://cdn.example.com/from-content.jpg"></figure>') ===
      "https://cdn.example.com/from-content.jpg"
  );

  return checks.every(Boolean);
}
