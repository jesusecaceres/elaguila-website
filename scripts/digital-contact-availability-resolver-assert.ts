/**
 * Deterministic asserts for resolveExecutivePublicAvailability (Build 03).
 * Run: npx tsx scripts/digital-contact-availability-resolver-assert.ts
 */

import type { DigitalContactProfile } from "../app/lib/digitalContact/digitalContactTypes";
import { resolveExecutivePublicAvailability } from "../app/lib/digitalContact/resolveExecutivePublicAvailability";

const TZ = "America/Los_Angeles";

const WEEKDAY_9_5 = [
  { day: "mon" as const, closed: false, open: "09:00", close: "17:00" },
  { day: "tue" as const, closed: false, open: "09:00", close: "17:00" },
  { day: "wed" as const, closed: false, open: "09:00", close: "17:00" },
  { day: "thu" as const, closed: false, open: "09:00", close: "17:00" },
  { day: "fri" as const, closed: false, open: "09:00", close: "17:00" },
  { day: "sat" as const, closed: true },
  { day: "sun" as const, closed: true },
];

function baseProfile(overrides: Partial<DigitalContactProfile> = {}): DigitalContactProfile {
  return {
    slug: "alpha",
    fullName: "Alpha Executive",
    title: "Test",
    company: "Leonix Media",
    legalEntity: "Leonix Global LLC",
    phoneDisplay: "(555) 000-0001",
    phoneDigits: "15550000001",
    email: "alpha@example.com",
    website: "https://leonixmedia.com",
    address: {
      line1: "871 Coleman Ave",
      city: "San Jose",
      state: "CA",
      postalCode: "95110",
      country: "US",
    },
    photoPath: null,
    trustChips: [],
    socials: [],
    active: true,
    ...overrides,
  };
}

const beta: DigitalContactProfile = baseProfile({
  slug: "beta",
  fullName: "Beta Executive",
  email: "beta@example.com",
  phoneDigits: "15550000002",
});

const inactiveBeta: DigitalContactProfile = baseProfile({
  slug: "beta",
  active: false,
});

function lookupFrom(map: Record<string, DigitalContactProfile | undefined>) {
  return (slug: string) => {
    const p = map[String(slug).trim().toLowerCase()];
    if (!p || !p.active) return null;
    return p;
  };
}

let passed = 0;
let failed = 0;

function assertEq(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// Wed 2026-01-14 18:00 UTC = 10:00 AM PST (within 9–5)
const WED_10AM_PST = new Date("2026-01-14T18:00:00.000Z");
// Wed 2026-01-14 01:05 UTC = 5:05 PM PST Tue? Wait — Jan 14 01:05 UTC = Jan 13 5:05 PM PST
// Use Wed Jan 14 Pacific: 5:05 PM PST = 2026-01-15T01:05:00.000Z
const WED_505PM_PST = new Date("2026-01-15T01:05:00.000Z");
// Wed 4:55 PM PST = 2026-01-15T00:55:00.000Z
const WED_455PM_PST = new Date("2026-01-15T00:55:00.000Z");
// Wed 8:00 AM PST = 2026-01-14T16:00:00.000Z
const WED_8AM_PST = new Date("2026-01-14T16:00:00.000Z");

// Summer PDT: Wed 2026-07-15 10:00 AM PDT = 2026-07-15T17:00:00.000Z
const WED_10AM_PDT = new Date("2026-07-15T17:00:00.000Z");
// Wed 2026-07-15 5:05 PM PDT = 2026-07-16T00:05:00.000Z
const WED_505PM_PDT = new Date("2026-07-16T00:05:00.000Z");

const withHours = baseProfile({
  workingHours: { timezone: TZ, days: WEEKDAY_9_5 },
  publicAvailabilityPolicy: { showWorkingHours: true, showAvailability: true },
  backupRepresentativeSlug: "beta",
});

const lookupOk = lookupFrom({ alpha: withHours, beta });

// 1. in hours + fresh available + visibility on → available
{
  const r = resolveExecutivePublicAvailability({
    profile: {
      ...withHours,
      temporaryPresence: {
        status: "available",
        setAt: "2026-01-14T17:00:00.000Z",
        expiresAt: "2026-01-14T20:00:00.000Z",
      },
    },
    now: WED_10AM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("1 available", r.publicAvailabilityState, "available");
}

// 2. available but visibility off → within_hours
{
  const r = resolveExecutivePublicAvailability({
    profile: {
      ...withHours,
      publicAvailabilityPolicy: { showWorkingHours: true, showAvailability: false },
      temporaryPresence: {
        status: "available",
        setAt: "2026-01-14T17:00:00.000Z",
        expiresAt: "2026-01-14T20:00:00.000Z",
      },
    },
    now: WED_10AM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("2 visibility off", r.publicAvailabilityState, "within_hours");
}

// 3. busy when policy on
{
  const r = resolveExecutivePublicAvailability({
    profile: {
      ...withHours,
      temporaryPresence: {
        status: "busy",
        setAt: "2026-01-14T17:00:00.000Z",
        expiresAt: "2026-01-14T20:00:00.000Z",
      },
    },
    now: WED_10AM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("3 busy", r.publicAvailabilityState, "busy");
}

// 4. away when permitted
{
  const r = resolveExecutivePublicAvailability({
    profile: {
      ...withHours,
      temporaryPresence: {
        status: "away",
        setAt: "2026-01-14T17:00:00.000Z",
        expiresAt: "2026-01-14T20:00:00.000Z",
      },
    },
    now: WED_10AM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("4 away", r.publicAvailabilityState, "away");
}

// 5. outside hours
{
  const r = resolveExecutivePublicAvailability({
    profile: withHours,
    now: WED_8AM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("5 outside_hours", r.publicAvailabilityState, "outside_hours");
}

// 6. available 4:55 expires 5:25, evaluate 5:05 → outside_hours
{
  const r = resolveExecutivePublicAvailability({
    profile: {
      ...withHours,
      temporaryPresence: {
        status: "available",
        setAt: WED_455PM_PST.toISOString(),
        expiresAt: new Date("2026-01-15T01:25:00.000Z").toISOString(),
      },
    },
    now: WED_505PM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("6 after close suppresses available", r.publicAvailabilityState, "outside_hours");
}

// 7. expired available
{
  const r = resolveExecutivePublicAvailability({
    profile: {
      ...withHours,
      temporaryPresence: {
        status: "available",
        setAt: "2026-01-14T16:00:00.000Z",
        expiresAt: "2026-01-14T17:00:00.000Z",
      },
    },
    now: WED_10AM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("7 expired → within_hours", r.publicAvailabilityState, "within_hours");
}

// 8. absence + temporary available → absent
{
  const r = resolveExecutivePublicAvailability({
    profile: {
      ...withHours,
      temporaryPresence: {
        status: "available",
        setAt: "2026-01-14T17:00:00.000Z",
        expiresAt: "2026-01-14T20:00:00.000Z",
      },
      absence: {
        enabled: true,
        startAt: "2026-01-01T00:00:00.000Z",
        endAt: "2026-02-01T00:00:00.000Z",
        publicMessage: { es: "Fuera temporalmente", en: "Temporarily away" },
      },
    },
    now: WED_10AM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("8 absence overrides", r.publicAvailabilityState, "absent");
}

// 9. absence ended
{
  const r = resolveExecutivePublicAvailability({
    profile: {
      ...withHours,
      absence: {
        enabled: true,
        startAt: "2025-01-01T00:00:00.000Z",
        endAt: "2025-02-01T00:00:00.000Z",
      },
    },
    now: WED_10AM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("9 absence ended", r.publicAvailabilityState, "within_hours");
}

// 10. no schedule
{
  const r = resolveExecutivePublicAvailability({
    profile: baseProfile({ slug: "alpha" }),
    now: WED_10AM_PST,
    lookupProfile: lookupFrom({ alpha: baseProfile() }),
  });
  assertEq("10 unknown_schedule", r.publicAvailabilityState, "unknown_schedule");
}

// 11. invalid timezone
{
  const r = resolveExecutivePublicAvailability({
    profile: baseProfile({
      workingHours: { timezone: "Not/AZone", days: WEEKDAY_9_5 },
    }),
    now: WED_10AM_PST,
    lookupProfile: lookupFrom({}),
  });
  assertEq("11 invalid tz", r.publicAvailabilityState, "unknown_schedule");
}

// 12. inactive
{
  const r = resolveExecutivePublicAvailability({
    profile: baseProfile({ active: false }),
    now: WED_10AM_PST,
    lookupProfile: lookupFrom({}),
  });
  assertEq("12 inactive", r.publicAvailabilityState, "inactive");
}

// 13. backup valid
{
  const r = resolveExecutivePublicAvailability({
    profile: withHours,
    now: WED_10AM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("13 backup valid", r.backupSlug, "beta");
}

// 14. self backup rejected
{
  const r = resolveExecutivePublicAvailability({
    profile: { ...withHours, backupRepresentativeSlug: "alpha" },
    now: WED_10AM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("14 self backup", r.backupSlug, null);
}

// 15. inactive backup rejected
{
  const r = resolveExecutivePublicAvailability({
    profile: withHours,
    now: WED_10AM_PST,
    lookupProfile: lookupFrom({ alpha: withHours, beta: inactiveBeta }),
  });
  assertEq("15 inactive backup", r.backupSlug, null);
}

// 16. malformed absence
{
  const r = resolveExecutivePublicAvailability({
    profile: {
      ...withHours,
      absence: {
        enabled: true,
        startAt: "not-a-date",
        endAt: "also-bad",
      },
    },
    now: WED_10AM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("16 malformed absence", r.publicAvailabilityState, "within_hours");
  assertEq("16 absenceActive false", r.absenceActive, false);
}

// 17. DST winter within
{
  const r = resolveExecutivePublicAvailability({
    profile: withHours,
    now: WED_10AM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("17 winter within", r.publicAvailabilityState, "within_hours");
  assertEq("17 winter withinHours true", r.withinWorkingHours, true);
}

// 18. DST summer outside after close
{
  const r = resolveExecutivePublicAvailability({
    profile: withHours,
    now: WED_505PM_PDT,
    lookupProfile: lookupOk,
  });
  assertEq("18 summer outside", r.publicAvailabilityState, "outside_hours");
}

// 18b summer within
{
  const r = resolveExecutivePublicAvailability({
    profile: withHours,
    now: WED_10AM_PDT,
    lookupProfile: lookupOk,
  });
  assertEq("18b summer within", r.withinWorkingHours, true);
}

// 19. missing temporary presence → never available
{
  const r = resolveExecutivePublicAvailability({
    profile: withHours,
    now: WED_10AM_PST,
    lookupProfile: lookupOk,
  });
  assertEq("19 never available without presence", r.publicAvailabilityState, "within_hours");
}

// 20. truthful registry-like profile with no Build 03 config
{
  const registryLike = baseProfile({ slug: "chuy" });
  const r = resolveExecutivePublicAvailability({
    profile: registryLike,
    now: WED_10AM_PST,
    lookupProfile: lookupFrom({ chuy: registryLike }),
  });
  assertEq("20 unknown fallback", r.publicAvailabilityState, "unknown_schedule");
  assertEq("20 no available claim", r.publicAvailabilityState === "available", false);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
