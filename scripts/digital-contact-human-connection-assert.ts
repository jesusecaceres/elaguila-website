/**
 * Build 04 Human Connection — targeted eligibility / security / contract asserts.
 * Run: npx tsx scripts/digital-contact-human-connection-assert.ts
 */

import type { DigitalContactProfile } from "../app/lib/digitalContact/digitalContactTypes";
import { resolveVideoEligibility } from "../app/lib/digitalContact/humanConnection/resolveVideoEligibility";
import { normalizeVisitorFirstName } from "../app/lib/digitalContact/humanConnection/normalizeVisitorName";
import {
  __resetHumanConnectionRateLimitForTests,
  checkHumanConnectionRateLimit,
} from "../app/lib/digitalContact/humanConnection/rateLimit";
import { unconfiguredVideoProvider } from "../app/lib/digitalContact/humanConnection/providers/unconfiguredProvider";
import { HUMAN_CONNECTION_WAIT_TIMEOUT_MS } from "../app/lib/digitalContact/humanConnection/constants";

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

const beta = baseProfile({ slug: "beta", fullName: "Beta", email: "beta@example.com", phoneDigits: "15550000002" });

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

function assertTrue(name: string, cond: boolean) {
  assertEq(name, cond, true);
}

const WED_10AM_PST = new Date("2026-01-14T18:00:00.000Z");
const WED_8AM_PST = new Date("2026-01-14T16:00:00.000Z");

const freshAvailable = {
  status: "available" as const,
  setAt: "2026-01-14T17:00:00.000Z",
  expiresAt: "2026-01-14T19:00:00.000Z",
};

const eligibleBase = baseProfile({
  workingHours: { timezone: TZ, days: WEEKDAY_9_5 },
  publicAvailabilityPolicy: { showWorkingHours: true, showAvailability: true },
  capabilities: { allowVideo: true, allowScheduling: true },
  temporaryPresence: freshAvailable,
  backupRepresentativeSlug: "beta",
});

const lookup = lookupFrom({ alpha: eligibleBase, beta });

// 1. provider not configured
{
  const r = resolveVideoEligibility({
    profile: eligibleBase,
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: false,
  });
  assertEq("1 provider_unconfigured", r.reason, "provider_unconfigured");
  assertEq("1 offer false", r.offerImmediateVideo, false);
}

// 2. provider healthy + eligible
{
  const r = resolveVideoEligibility({
    profile: eligibleBase,
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
    providerHealthy: true,
  });
  assertEq("2 eligible", r.reason, "eligible");
  assertEq("2 offer true", r.offerImmediateVideo, true);
}

// 3. executive missing
{
  const r = resolveVideoEligibility({
    profile: null,
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
  });
  assertEq("3 missing", r.reason, "executive_missing");
}

// 4. inactive
{
  const r = resolveVideoEligibility({
    profile: { ...eligibleBase, active: false },
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
  });
  assertEq("4 inactive", r.reason, "executive_inactive");
}

// 5. allowVideo false
{
  const r = resolveVideoEligibility({
    profile: { ...eligibleBase, capabilities: { allowVideo: false } },
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
  });
  assertEq("5 allow_video_false", r.reason, "allow_video_false");
}

// 6. unknown schedule
{
  const r = resolveVideoEligibility({
    profile: {
      ...eligibleBase,
      workingHours: undefined,
      temporaryPresence: freshAvailable,
    },
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
  });
  assertEq("6 unknown_schedule", r.reason, "unknown_schedule");
}

// 7. outside hours
{
  const r = resolveVideoEligibility({
    profile: eligibleBase,
    now: WED_8AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
  });
  assertEq("7 outside_hours", r.reason, "outside_hours");
}

// 8. absence
{
  const r = resolveVideoEligibility({
    profile: {
      ...eligibleBase,
      absence: {
        enabled: true,
        startAt: "2026-01-14T00:00:00.000Z",
        endAt: "2026-01-15T00:00:00.000Z",
        publicMessage: { es: "Ausente", en: "Away" },
      },
    },
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
  });
  assertEq("8 absence_active", r.reason, "absence_active");
}

// 9. presence missing — Build 11: office hours + provider enough (no manual presence)
{
  const r = resolveVideoEligibility({
    profile: { ...eligibleBase, temporaryPresence: null },
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
  });
  assertEq("9 presence_missing_still_eligible", r.offerImmediateVideo, true);
  assertEq("9 reason eligible", r.reason, "eligible");
}

// 10. presence expired — Build 11: expired presence does not block office-hours doorbell
{
  const r = resolveVideoEligibility({
    profile: {
      ...eligibleBase,
      temporaryPresence: {
        status: "available",
        setAt: "2026-01-14T10:00:00.000Z",
        expiresAt: "2026-01-14T11:00:00.000Z",
      },
    },
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
  });
  assertEq("10 presence_expired_still_eligible", r.offerImmediateVideo, true);
}

// 11. busy
{
  const r = resolveVideoEligibility({
    profile: {
      ...eligibleBase,
      temporaryPresence: { ...freshAvailable, status: "busy" },
    },
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
  });
  assertEq("11 presence_busy", r.reason, "presence_busy");
}

// 12. away
{
  const r = resolveVideoEligibility({
    profile: {
      ...eligibleBase,
      temporaryPresence: { ...freshAvailable, status: "away" },
    },
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
  });
  assertEq("12 presence_away", r.reason, "presence_away");
}

// 13. allowVideo + hours + provider (no presence) — Build 11 doorbell OK
{
  const r = resolveVideoEligibility({
    profile: {
      ...eligibleBase,
      temporaryPresence: undefined,
      capabilities: { allowVideo: true },
    },
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
  });
  assertTrue("13 hours+provider eligible", r.offerImmediateVideo === true);
}

// 14. office hours + allowVideo + provider — Build 11: sufficient for doorbell
{
  const r = resolveVideoEligibility({
    profile: {
      ...baseProfile({
        workingHours: { timezone: TZ, days: WEEKDAY_9_5 },
        publicAvailabilityPolicy: { showAvailability: true },
        capabilities: { allowVideo: true },
      }),
    },
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
  });
  assertTrue("14 hours+provider eligible", r.offerImmediateVideo === true);
}

// 15. provider unhealthy
{
  const r = resolveVideoEligibility({
    profile: eligibleBase,
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
    providerHealthy: false,
  });
  assertEq("15 provider_unhealthy", r.reason, "provider_unhealthy");
}

// 16. unconfigured adapter
{
  assertEq("16 adapter configured false", unconfiguredVideoProvider.isConfigured(), false);
  assertEq("16 adapter canCreate false", unconfiguredVideoProvider.getCapability().canCreateEphemeralSession, false);
  assertEq("16 recording false", unconfiguredVideoProvider.getCapability().supportsRecording, false);
}

// 17. malformed name
{
  assertEq("17 short name", normalizeVisitorFirstName("A"), null);
  assertEq("17 empty", normalizeVisitorFirstName("  "), null);
  assertEq("17 ok name", normalizeVisitorFirstName("María"), "María");
}

// 18. rate limit
{
  __resetHumanConnectionRateLimitForTests();
  const key = "test-rate";
  let blocked = false;
  for (let i = 0; i < 6; i++) {
    const r = checkHumanConnectionRateLimit({ key, limit: 5, windowMs: 60_000, now: 1_000 + i });
    if (!r.allowed) blocked = true;
  }
  assertTrue("18 rate limit trips", blocked);
}

// 19. wait timeout constant in range
{
  assertTrue("19 wait >= 60s", HUMAN_CONNECTION_WAIT_TIMEOUT_MS >= 60_000);
  assertTrue("19 wait <= 90s", HUMAN_CONNECTION_WAIT_TIMEOUT_MS <= 90_000);
}

// 20. backup not claimed available without proof
{
  const primaryBusy = {
    ...eligibleBase,
    temporaryPresence: { ...freshAvailable, status: "busy" as const },
  };
  const r = resolveVideoEligibility({
    profile: primaryBusy,
    now: WED_10AM_PST,
    lookupProfile: lookupFrom({
      alpha: primaryBusy,
      beta: baseProfile({ slug: "beta", active: true }), // no presence / video
    }),
    providerConfigured: true,
  });
  assertEq("20 primary busy", r.reason, "presence_busy");
  assertEq("20 backup not video", r.backupOfferImmediateVideo, false);
  assertEq("20 backup slug present", r.backupSlug, "beta");
}

// 21. backup video only with fresh proof
{
  const primaryBusy = {
    ...eligibleBase,
    temporaryPresence: { ...freshAvailable, status: "busy" as const },
  };
  const betaReady = baseProfile({
    slug: "beta",
    workingHours: { timezone: TZ, days: WEEKDAY_9_5 },
    publicAvailabilityPolicy: { showAvailability: true },
    capabilities: { allowVideo: true },
    temporaryPresence: freshAvailable,
  });
  const r = resolveVideoEligibility({
    profile: primaryBusy,
    now: WED_10AM_PST,
    lookupProfile: lookupFrom({ alpha: primaryBusy, beta: betaReady }),
    providerConfigured: true,
  });
  assertEq("21 backup offer video", r.backupOfferImmediateVideo, true);
}

// 22. policy showAvailability=false — Build 11: still offer doorbell from office hours
{
  const r = resolveVideoEligibility({
    profile: {
      ...eligibleBase,
      publicAvailabilityPolicy: { showAvailability: false, showWorkingHours: true },
    },
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
  });
  assertEq("22 policy_hides_still_offers_doorbell", r.offerImmediateVideo, true);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
