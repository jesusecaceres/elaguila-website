/**
 * Shared US state → IANA timezone resolver + business-local clock reader — generalized from
 * Servicios' working `resolveServiciosBusinessTimeZone`/`serviciosZonedNow`
 * (app/(site)/servicios/lib/serviciosBusinessTimeZone.ts), following the same precedent as
 * `computeBusinessHoursStatus.ts` (generalized from Restaurantes) so other categories don't
 * reimplement the same state→zone map. Logic and doctrine are unchanged; only the input shape
 * is category-neutral. Servicios' own file is left as-is — this is additive, not a migration.
 *
 * HONEST FAILURE: when the zone cannot be determined this returns `null`, and callers must not
 * fall back to the host clock — a server runs in UTC and a browser runs in the viewer's zone,
 * neither of which is the business's local time. A null zone means "state open/closed" without
 * asserting which.
 *
 * Pure: no I/O, no framework imports.
 */

export type UsBusinessLocationLike = {
  region?: string | null;
  country?: string | null;
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
 * US state/territory → IANA zone. One zone per state (see Servicios' original file for the full
 * rationale on the handful of genuinely split states) — a known, documented approximation rather
 * than an unresolved status.
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
 * Returns an IANA zone, or `null` when the location does not carry enough truth to know what
 * time it is where the business actually is. Scoped to the United States on purpose.
 */
export function resolveUsBusinessTimeZone(location: UsBusinessLocationLike | null | undefined): string | null {
  if (!location) return null;
  const country = norm(location.country);
  if (!US_COUNTRY_TOKENS.has(country)) return null;
  const code = stateCodeFrom(String(location.region ?? ""));
  if (!code) return null;
  return US_STATE_TO_IANA[code] ?? null;
}

/** The clock, read in the business's own zone. */
export type BusinessZonedNow = {
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
 * Reads the current wall clock IN `timeZone` using `Intl.DateTimeFormat` — DST-correct, no manual
 * offset arithmetic. Returns `null` when the zone is missing or the runtime rejects it.
 */
export function zonedNowInTimeZone(timeZone: string | null | undefined, at: Date = new Date()): BusinessZonedNow | null {
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
    const h = hour === 24 ? 0 : hour;
    if (h < 0 || h > 23 || minute < 0 || minute > 59) return null;
    return { minutesFromMidnight: h * 60 + minute, jsDay };
  } catch {
    return null;
  }
}
