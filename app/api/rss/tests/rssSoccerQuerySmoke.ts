import {
  buildSearchQuery,
  filterSoccerResultQuality,
  isAmericanFootballNoise,
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
  // The old bug: bare "football" with no exclusion, e.g. "soccer football news Latino".
  // "football" may still appear negated (e.g. -"college football") — that is the fix, not the bug.
  checks.push(!/football news/i.test(enSoccer));
  checks.push(!/football news/i.test(enFutbol));
  checks.push(/\bsoccer\b/i.test(enSoccer));
  checks.push(/-NFL/i.test(enSoccer));
  checks.push(/-"college football"|-college football/i.test(enSoccer));
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

  return checks.every(Boolean);
}
