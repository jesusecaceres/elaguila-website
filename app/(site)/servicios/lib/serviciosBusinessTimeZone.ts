/**
 * Gate SERVICIOS-3 (D-1) — business-local time for Servicios hours.
 *
 * ── THE DEFECT THIS CLOSES ───────────────────────────────────────────────────────────────────
 * `serviciosHeroHoursStatus.ts` computed "open now" with `now.getHours()` — the RUNTIME HOST's
 * clock — and contained no timezone handling at all. That is wrong in two independent ways:
 *
 *   1. The open-now FILTER runs inside `resultados/page.tsx`, a SERVER component, so on Vercel it
 *      evaluated in UTC. A Sonoma County business open 9am–5pm Pacific was judged against UTC and
 *      was misclassified for roughly seven hours of every day.
 *   2. The public BADGE renders in the VIEWER's timezone. So the filter and the badge could — and
 *      on any non-UTC viewer routinely did — disagree about the same listing at the same moment.
 *
 * ── THE RULE ─────────────────────────────────────────────────────────────────────────────────
 * A business's hours are stated in the business's own local time. This module resolves that zone
 * from the listing's already-persisted location, and `serviciosHeroHoursStatus` reads the clock in
 * that zone via `Intl.DateTimeFormat` — the same resolution for the badge and the filter, because
 * both call the same function.
 *
 * ── HONEST FAILURE ───────────────────────────────────────────────────────────────────────────
 * When the zone cannot be determined this returns `null`, and callers MUST NOT fall back to the
 * host clock: UTC is not the business's local time and pretending otherwise is exactly the defect.
 * A null zone means "we do not know what time it is where this business is", and the honest
 * consequences are:
 *   - the badge states the hours WITHOUT claiming open or closed;
 *   - the open-now filter excludes the listing (fails closed rather than advertising a guess).
 *
 * Pure: no I/O, no framework imports.
 */

/** The persisted location fields a Servicios listing already carries. All optional. */
export type ServiciosBusinessLocationLike = {
  physicalRegion?: string | null;
  physicalCountry?: string | null;
  physicalPostalCode?: string | null;
  physicalCity?: string | null;
};

function norm(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

const US_COUNTRY_TOKENS = new Set([
  "",
  "us",
  "usa",
  "u.s.",
  "u.s.a.",
  "united states",
  "united states of america",
  "estados unidos",
  "eeuu",
  "ee.uu.",
]);

/**
 * US state/territory → IANA zone.
 *
 * Deliberately one zone per state. The handful of genuinely split states (AZ's Navajo Nation, and
 * the counties in ID/KS/ND/NE/OR/SD/TX that sit in a second zone) are mapped to the state's
 * PREDOMINANT zone rather than left unresolved — a listing in those counties gets the wrong zone by
 * one hour, which is strictly better than the status quo of being wrong by seven. Recorded as a
 * known limitation rather than hidden; ZIP-level precision is a later refinement and would need a
 * real ZIP→timezone dataset, which this repo does not have and this gate will not invent.
 *
 * Arizona maps to Phoenix (no DST) and Hawaii to Honolulu (no DST) — `Intl` handles both correctly.
 */
const US_STATE_TO_IANA: Readonly<Record<string, string>> = {
  al: "America/Chicago",
  ak: "America/Anchorage",
  az: "America/Phoenix",
  ar: "America/Chicago",
  ca: "America/Los_Angeles",
  co: "America/Denver",
  ct: "America/New_York",
  de: "America/New_York",
  dc: "America/New_York",
  fl: "America/New_York",
  ga: "America/New_York",
  hi: "Pacific/Honolulu",
  id: "America/Boise",
  il: "America/Chicago",
  in: "America/Indiana/Indianapolis",
  ia: "America/Chicago",
  ks: "America/Chicago",
  ky: "America/New_York",
  la: "America/Chicago",
  me: "America/New_York",
  md: "America/New_York",
  ma: "America/New_York",
  mi: "America/Detroit",
  mn: "America/Chicago",
  ms: "America/Chicago",
  mo: "America/Chicago",
  mt: "America/Denver",
  ne: "America/Chicago",
  nv: "America/Los_Angeles",
  nh: "America/New_York",
  nj: "America/New_York",
  nm: "America/Denver",
  ny: "America/New_York",
  nc: "America/New_York",
  nd: "America/Chicago",
  oh: "America/New_York",
  ok: "America/Chicago",
  or: "America/Los_Angeles",
  pa: "America/New_York",
  ri: "America/New_York",
  sc: "America/New_York",
  sd: "America/Chicago",
  tn: "America/Chicago",
  tx: "America/Chicago",
  ut: "America/Denver",
  vt: "America/New_York",
  va: "America/New_York",
  wa: "America/Los_Angeles",
  wv: "America/New_York",
  wi: "America/Chicago",
  wy: "America/Denver",
  pr: "America/Puerto_Rico",
  vi: "America/St_Thomas",
  gu: "Pacific/Guam",
};

/** Full state names (ES and EN) that owners may type instead of a two-letter code. */
const US_STATE_NAME_TO_CODE: Readonly<Record<string, string>> = {
  california: "ca",
  "nueva york": "ny",
  "new york": "ny",
  texas: "tx",
  florida: "fl",
  washington: "wa",
  oregon: "or",
  nevada: "nv",
  arizona: "az",
  colorado: "co",
  illinois: "il",
  georgia: "ga",
  "nuevo mexico": "nm",
  "new mexico": "nm",
  "carolina del norte": "nc",
  "north carolina": "nc",
  "nueva jersey": "nj",
  "new jersey": "nj",
  pensilvania: "pa",
  pennsylvania: "pa",
  massachusetts: "ma",
  michigan: "mi",
  ohio: "oh",
  virginia: "va",
  "puerto rico": "pr",
  hawaii: "hi",
  hawái: "hi",
  alaska: "ak",
};

function stateCodeFrom(regionRaw: string): string | null {
  const region = norm(regionRaw)
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (!region) return null;
  if (/^[a-z]{2}$/.test(region) && US_STATE_TO_IANA[region]) return region;
  const byName = US_STATE_NAME_TO_CODE[region];
  return byName ?? null;
}

/**
 * THE resolver. Returns an IANA zone, or `null` when the listing does not carry enough location
 * truth to know what time it is where the business actually is.
 *
 * Scoped to the United States on purpose: that is the only market whose location truth this
 * category persists in a form that maps reliably to a zone today. A non-US country resolves to
 * `null` — an honest "unknown", not a guess.
 */
export function resolveServiciosBusinessTimeZone(
  location: ServiciosBusinessLocationLike | null | undefined,
): string | null {
  if (!location) return null;
  const country = norm(location.physicalCountry);
  if (!US_COUNTRY_TOKENS.has(country)) return null;
  const code = stateCodeFrom(String(location.physicalRegion ?? ""));
  if (!code) return null;
  return US_STATE_TO_IANA[code] ?? null;
}

/** The clock, read in the business's own zone. */
export type ServiciosZonedNow = {
  /** Minutes since local midnight, 0-1439. */
  minutesFromMidnight: number;
  /** Local weekday in `Date#getDay()` terms: 0 Sunday … 6 Saturday. */
  jsDay: number;
};

const JS_DAY_BY_WEEKDAY: Readonly<Record<string, number>> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

/**
 * Reads the current wall clock IN `timeZone` using `Intl.DateTimeFormat` — the stable, DST-correct
 * mechanism, rather than any manual offset arithmetic. Returns `null` when the zone is missing or
 * the runtime rejects it, so a caller can never mistake a failure for midnight Sunday.
 */
export function serviciosZonedNow(
  timeZone: string | null | undefined,
  at: Date = new Date(),
): ServiciosZonedNow | null {
  const zone = String(timeZone ?? "").trim();
  if (!zone) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    }).formatToParts(at);

    let hour: number | null = null;
    let minute: number | null = null;
    let jsDay: number | null = null;
    for (const p of parts) {
      if (p.type === "hour") hour = parseInt(p.value, 10);
      else if (p.type === "minute") minute = parseInt(p.value, 10);
      else if (p.type === "weekday") {
        const key = p.value.slice(0, 3).toLowerCase();
        if (key in JS_DAY_BY_WEEKDAY) jsDay = JS_DAY_BY_WEEKDAY[key];
      }
    }
    if (hour == null || minute == null || jsDay == null) return null;
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    // `hourCycle: "h23"` yields 00-23; guard anyway so a runtime quirk cannot produce 24:00.
    const h = hour === 24 ? 0 : hour;
    if (h < 0 || h > 23 || minute < 0 || minute > 59) return null;
    return { minutesFromMidnight: h * 60 + minute, jsDay };
  } catch {
    // An invalid IANA identifier throws a RangeError. Unknown is unknown.
    return null;
  }
}
