/**
 * Build 05 — operational activation asserts (Chuy ECP + fail-closed matrix).
 * Run: npx tsx scripts/digital-contact-human-connection-05-assert.ts
 */

import {
  getDigitalContactProfile,
  listActiveDigitalContactProfiles,
} from "../app/lib/digitalContact/digitalContactRegistry";
import { resolveExecutivePublicAvailability } from "../app/lib/digitalContact/resolveExecutivePublicAvailability";
import { resolveVideoEligibility } from "../app/lib/digitalContact/humanConnection/resolveVideoEligibility";
import { resolveVisitanosSource } from "../app/lib/visitanos/visitanosCopy";
import { LEONIX_SITE_ORIGIN } from "../app/lib/leonixBrand";

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

const chuy = getDigitalContactProfile("chuy");
const isaias = getDigitalContactProfile("isaias");
const WED_10AM_PST = new Date("2026-01-14T18:00:00.000Z");
const WED_8AM_PST = new Date("2026-01-14T16:00:00.000Z");

assertTrue("1 chuy exists", Boolean(chuy));
assertEq("2 chuy allowVideo", chuy?.capabilities?.allowVideo, true);
assertEq("3 chuy allowScheduling", chuy?.capabilities?.allowScheduling, true);
assertEq("4 chuy showAvailability", chuy?.publicAvailabilityPolicy?.showAvailability, true);
assertEq("5 chuy timezone", chuy?.workingHours?.timezone, "America/Los_Angeles");
assertEq("6 chuy email unchanged", chuy?.email, "chuy@leonixmedia.com");
assertEq("7 chuy no backup invented", chuy?.backupRepresentativeSlug ?? null, null);
assertEq("8 chuy no presence seeded", chuy?.temporaryPresence ?? null, null);
assertEq("9 chuy no absence invented", chuy?.absence ?? null, null);

const mon = chuy?.workingHours?.days.find((d) => d.day === "mon");
assertEq("10 mon open", mon?.open, "09:00");
assertEq("11 mon close", mon?.close, "17:00");
assertEq("12 mon not closed", mon?.closed, false);

assertTrue("13 isaias exists", Boolean(isaias));
assertEq("14 isaias allowVideo not invented", isaias?.capabilities?.allowVideo ?? false, false);
assertEq("15 isaias hours not invented", isaias?.workingHours ?? null, null);
assertEq("16 isaias presence not invented", isaias?.temporaryPresence ?? null, null);

// Primary VFD order — chuy first
const active = listActiveDigitalContactProfiles();
assertEq("17 primary is chuy", active[0]?.slug, "chuy");

// No presence → not available / not video eligible
{
  const avail = resolveExecutivePublicAvailability({
    profile: chuy!,
    now: WED_10AM_PST,
    lookupProfile: getDigitalContactProfile,
  });
  assertEq("18 no presence state", avail.publicAvailabilityState, "within_hours");
  assertTrue("18 not available", avail.publicAvailabilityState !== "available");

  const video = resolveVideoEligibility({
    profile: chuy!,
    now: WED_10AM_PST,
    lookupProfile: getDigitalContactProfile,
    providerConfigured: true,
    providerHealthy: true,
    videoEnabled: true,
    notificationReady: true,
  });
  assertEq("19 no presence → video denied", video.offerImmediateVideo, false);
  assertEq("19 reason presence_missing", video.reason, "presence_missing");
}

// Fresh presence + dependencies → eligible
{
  const withPresence = {
    ...chuy!,
    temporaryPresence: {
      status: "available" as const,
      setAt: "2026-01-14T17:00:00.000Z",
      expiresAt: "2026-01-14T19:00:00.000Z",
    },
  };
  const video = resolveVideoEligibility({
    profile: withPresence,
    now: WED_10AM_PST,
    lookupProfile: getDigitalContactProfile,
    providerConfigured: true,
    providerHealthy: true,
    videoEnabled: true,
    notificationReady: true,
  });
  assertEq("20 fresh available eligible", video.reason, "eligible");
  assertEq("20 offer true", video.offerImmediateVideo, true);
}

// Outside hours + AVAILABLE → not video eligible
{
  const withPresence = {
    ...chuy!,
    temporaryPresence: {
      status: "available" as const,
      setAt: "2026-01-14T15:00:00.000Z",
      expiresAt: "2026-01-14T17:00:00.000Z",
    },
  };
  const video = resolveVideoEligibility({
    profile: withPresence,
    now: WED_8AM_PST,
    lookupProfile: getDigitalContactProfile,
    providerConfigured: true,
    providerHealthy: true,
    videoEnabled: true,
    notificationReady: true,
  });
  assertEq("21 outside hours denied", video.reason, "outside_hours");
}

// Expired presence
{
  const expired = {
    ...chuy!,
    temporaryPresence: {
      status: "available" as const,
      setAt: "2026-01-14T10:00:00.000Z",
      expiresAt: "2026-01-14T11:00:00.000Z",
    },
  };
  const video = resolveVideoEligibility({
    profile: expired,
    now: WED_10AM_PST,
    lookupProfile: getDigitalContactProfile,
    providerConfigured: true,
    providerHealthy: true,
    videoEnabled: true,
    notificationReady: true,
  });
  assertEq("22 expired denied", video.reason, "presence_expired");
}

// Kill switch
{
  const withPresence = {
    ...chuy!,
    temporaryPresence: {
      status: "available" as const,
      setAt: "2026-01-14T17:00:00.000Z",
      expiresAt: "2026-01-14T19:00:00.000Z",
    },
  };
  const video = resolveVideoEligibility({
    profile: withPresence,
    now: WED_10AM_PST,
    lookupProfile: getDigitalContactProfile,
    providerConfigured: true,
    providerHealthy: true,
    videoEnabled: false,
    notificationReady: true,
  });
  assertEq("23 kill switch", video.reason, "kill_switch_off");
}

// Missing provider
{
  const withPresence = {
    ...chuy!,
    temporaryPresence: {
      status: "available" as const,
      setAt: "2026-01-14T17:00:00.000Z",
      expiresAt: "2026-01-14T19:00:00.000Z",
    },
  };
  const video = resolveVideoEligibility({
    profile: withPresence,
    now: WED_10AM_PST,
    lookupProfile: getDigitalContactProfile,
    providerConfigured: false,
    videoEnabled: true,
    notificationReady: true,
  });
  assertEq("24 missing provider", video.reason, "provider_unconfigured");
}

// Missing notification
{
  const withPresence = {
    ...chuy!,
    temporaryPresence: {
      status: "available" as const,
      setAt: "2026-01-14T17:00:00.000Z",
      expiresAt: "2026-01-14T19:00:00.000Z",
    },
  };
  const video = resolveVideoEligibility({
    profile: withPresence,
    now: WED_10AM_PST,
    lookupProfile: getDigitalContactProfile,
    providerConfigured: true,
    providerHealthy: true,
    videoEnabled: true,
    notificationReady: false,
  });
  assertEq("25 missing notification", video.reason, "notification_unconfigured");
}

// QR / source
assertEq("26 office-window source", resolveVisitanosSource({ source: "office-window" }), "office-window");
assertEq("27 junk source null", resolveVisitanosSource({ source: "evil.com" }), null);
assertEq(
  "28 QR destination",
  `${LEONIX_SITE_ORIGIN}/visitanos?source=office-window`,
  "https://leonixmedia.com/visitanos?source=office-window",
);

// Schedule remains capability-flagged request (not appointment)
assertEq("29 schedule capability true", chuy?.capabilities?.allowScheduling, true);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
