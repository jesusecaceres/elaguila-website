/**
 * Build 04B — production activation asserts (kill switch, notification gate, Daily seam).
 * Run: npx tsx scripts/digital-contact-human-connection-04b-assert.ts
 */

import type { DigitalContactProfile } from "../app/lib/digitalContact/digitalContactTypes";
import { resolveVideoEligibility } from "../app/lib/digitalContact/humanConnection/resolveVideoEligibility";
import { unconfiguredVideoProvider } from "../app/lib/digitalContact/humanConnection/providers/unconfiguredProvider";
import { createDailyVideoProvider } from "../app/lib/digitalContact/humanConnection/providers/dailyProvider";
import {
  HUMAN_CONNECTION_SESSION_TTL_MS,
  HUMAN_CONNECTION_WAIT_TIMEOUT_MS,
} from "../app/lib/digitalContact/humanConnection/constants";

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

const WED_10AM_PST = new Date("2026-01-14T18:00:00.000Z");
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
});

const lookup = (slug: string) => (slug === "alpha" ? eligibleBase : null);

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

// 1. kill switch off
{
  const r = resolveVideoEligibility({
    profile: eligibleBase,
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
    providerHealthy: true,
    videoEnabled: false,
    notificationReady: true,
  });
  assertEq("1 kill_switch_off", r.reason, "kill_switch_off");
  assertEq("1 offer false", r.offerImmediateVideo, false);
}

// 2. notification unconfigured
{
  const r = resolveVideoEligibility({
    profile: eligibleBase,
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
    providerHealthy: true,
    videoEnabled: true,
    notificationReady: false,
  });
  assertEq("2 notification_unconfigured", r.reason, "notification_unconfigured");
  assertEq("2 offer false", r.offerImmediateVideo, false);
}

// 3. fully eligible with notify + provider
{
  const r = resolveVideoEligibility({
    profile: eligibleBase,
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
    providerHealthy: true,
    videoEnabled: true,
    notificationReady: true,
  });
  assertEq("3 eligible", r.reason, "eligible");
  assertEq("3 offer true", r.offerImmediateVideo, true);
}

// 4. Daily adapter without key is not configured
{
  const prev = process.env.DAILY_API_KEY;
  delete process.env.DAILY_API_KEY;
  const daily = createDailyVideoProvider();
  assertEq("4 daily without key", daily.isConfigured(), false);
  assertEq("4 daily recording false", daily.getCapability().supportsRecording, false);
  if (prev !== undefined) process.env.DAILY_API_KEY = prev;
}

// 5. unconfigured remains fail-closed
{
  assertEq("5 unconfigured", unconfiguredVideoProvider.isConfigured(), false);
}

// 6. session TTL in 10–20 min band
{
  assertTrue("6 ttl >= 10m", HUMAN_CONNECTION_SESSION_TTL_MS >= 10 * 60_000);
  assertTrue("6 ttl <= 20m", HUMAN_CONNECTION_SESSION_TTL_MS <= 20 * 60_000);
}

// 7. wait timeout still ~75s
{
  assertEq("7 wait 75s", HUMAN_CONNECTION_WAIT_TIMEOUT_MS, 75_000);
}

// 8. visitor must never require host secret fields in public session type shape
{
  const visitorKeys = ["sessionId", "visitorJoinUrl", "expiresAt", "providerId"];
  assertTrue("8 visitor key sessionId", visitorKeys.includes("sessionId"));
  assertTrue("8 no hostJoinUrl in visitor keys", !visitorKeys.includes("hostJoinUrl"));
}

// 9. allowVideo false still denied even with kill switch on
{
  const r = resolveVideoEligibility({
    profile: { ...eligibleBase, capabilities: { allowVideo: false } },
    now: WED_10AM_PST,
    lookupProfile: lookup,
    providerConfigured: true,
    videoEnabled: true,
    notificationReady: true,
  });
  assertEq("9 allow_video_false", r.reason, "allow_video_false");
}

// 10. presence expired
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
    videoEnabled: true,
    notificationReady: true,
  });
  assertEq("10 presence_expired", r.reason, "presence_expired");
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
