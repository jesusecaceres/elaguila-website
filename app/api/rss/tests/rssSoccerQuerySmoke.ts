import {
  buildSearchQuery,
  dedupeRssArticles,
  filterSoccerResultQuality,
  isAmericanFootballNoise,
  normalizedHeadlineKey,
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

  return checks.every(Boolean);
}
