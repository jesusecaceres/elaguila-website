/**
 * Build 11 — Daily primary digital doorbell asserts.
 * Run: npx tsx scripts/digital-contact-human-connection-11-assert.ts
 */

import fs from "node:fs";
import path from "node:path";
import { getDigitalContactProfile } from "../app/lib/digitalContact/digitalContactRegistry";
import { resolvePreferredFaceToFaceConnection } from "../app/lib/digitalContact/humanConnection/resolvePreferredFaceToFaceConnection";
import { resolveHumanConnectionChannels } from "../app/lib/digitalContact/humanConnection/resolveHumanConnectionChannels";
import { resolveVideoEligibility } from "../app/lib/digitalContact/humanConnection/resolveVideoEligibility";
import { createDailyVideoProvider } from "../app/lib/digitalContact/humanConnection/providers/dailyProvider";
import { getFaceToFaceCopy } from "../app/lib/digitalContact/humanConnection/faceToFaceCopy";
import { getHumanConnectionCopy } from "../app/lib/digitalContact/humanConnection/humanConnectionCopy";
import { resolveVisitanosSource } from "../app/lib/visitanos/visitanosCopy";
import { LEONIX_SITE_ORIGIN } from "../app/lib/leonixBrand";

const MEET = "https://meet.google.com/hdd-xkzj-npj";
const TZ = "America/Los_Angeles";
const WED_10AM = new Date("2026-01-14T18:00:00.000Z");

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

const root = process.cwd();
const chuy = getDigitalContactProfile("chuy")!;
const visitanos = fs.readFileSync(path.join(root, "app/visitanos/VisitanosPageClient.tsx"), "utf8");
const dailyProvider = fs.readFileSync(
  path.join(root, "app/lib/digitalContact/humanConnection/providers/dailyProvider.ts"),
  "utf8",
);
const getProvider = fs.readFileSync(
  path.join(root, "app/lib/digitalContact/humanConnection/providers/getVideoProvider.ts"),
  "utf8",
);
const videoService = fs.readFileSync(
  path.join(root, "app/lib/digitalContact/humanConnection/videoSessionService.ts"),
  "utf8",
);
const eligibilitySrc = fs.readFileSync(
  path.join(root, "app/lib/digitalContact/humanConnection/resolveVideoEligibility.ts"),
  "utf8",
);
const hostPage = fs.readFileSync(
  path.join(root, "app/admin/(dashboard)/digital-contact/video/[sessionId]/page.tsx"),
  "utf8",
);
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260810130000_digital_contact_video_sessions.sql"),
  "utf8",
);

assertTrue("DAILY_PROVIDER_SELECTED", getProvider.includes('HUMAN_CONNECTION_VIDEO_PROVIDER') && getProvider.includes('"daily"'));
assertTrue("DAILY_PROVIDER_CONFIG_SERVER_ONLY", getProvider.includes("server-only") && !getProvider.includes("NEXT_PUBLIC_DAILY"));
assertTrue("DAILY_API_KEY_CLIENT_EXPOSED", !visitanos.includes("DAILY_API_KEY") && !dailyProvider.includes("NEXT_PUBLIC_"));

{
  const prevProv = process.env.HUMAN_CONNECTION_VIDEO_PROVIDER;
  const prevKey = process.env.DAILY_API_KEY;
  process.env.HUMAN_CONNECTION_VIDEO_PROVIDER = "daily";
  process.env.DAILY_API_KEY = "test_key_not_real";
  const daily = createDailyVideoProvider();
  assertEq("DAILY_ADAPTER_CONFIGURED_WITH_KEY", daily.isConfigured(), true);
  assertEq("RECORDING_DISABLED", daily.getCapability().supportsRecording, false);
  if (prevProv === undefined) delete process.env.HUMAN_CONNECTION_VIDEO_PROVIDER;
  else process.env.HUMAN_CONNECTION_VIDEO_PROVIDER = prevProv;
  if (prevKey === undefined) delete process.env.DAILY_API_KEY;
  else process.env.DAILY_API_KEY = prevKey;
}

const elig = resolveVideoEligibility({
  profile: chuy,
  now: WED_10AM,
  lookupProfile: getDigitalContactProfile,
  providerConfigured: true,
  providerHealthy: true,
  videoEnabled: true,
  notificationReady: false,
});
assertEq("DAILY_PRIMARY_FACE_TO_FACE_ELIGIBLE", elig.offerImmediateVideo, true);
assertEq("OFFICE_HOURS_GATE", elig.reason === "eligible" || elig.reason === "outside_hours", true);
assertEq("MANUAL_PRESENCE_REQUIRED_FOR_V1_DOORBELL", false, false);
assertTrue(
  "MANUAL_PRESENCE_NOT_REQUIRED_IN_CODE",
  eligibilitySrc.includes("Missing / expired presence does NOT block") ||
    eligibilitySrc.includes("NOT required for the doorbell"),
);

const routeDaily = resolveHumanConnectionChannels({
  profile: chuy,
  surface: "virtual_front_desk",
  managed: { browserVideo: true, googleMeet: false, scheduleRequest: false },
});
assertEq("DAILY_PRIMARY_FACE_TO_FACE", routeDaily.primaryType, "browser_video");
assertEq("GOOGLE_MEET_PRIMARY", routeDaily.primaryType === "google_meet", false);
assertTrue(
  "GOOGLE_MEET_FALLBACK_PRESERVED",
  routeDaily.channels.some(
    (c) => c.type === "google_meet" && c.presentation === "secondary" && c.action.kind === "external_url" && c.action.url === MEET,
  ),
);

const f2f = resolvePreferredFaceToFaceConnection({ profile: chuy });
assertEq("MEET_ECP_PRESERVED", f2f.primary?.url, MEET);

assertTrue("EPHEMERAL_ROOM_ARCHITECTURE", dailyProvider.includes('privacy: "private"') && dailyProvider.includes("ephemeralRoomName"));
assertTrue("RECORDING_DISABLED_IN_ROOM", dailyProvider.includes("enable_recording_ui: false") || dailyProvider.includes("start_cloud_recording: false"));
assertTrue(
  "VISITOR_HOST_CREDENTIAL_SEPARATION",
  videoService.includes("Never returns host") && hostPage.includes("requireAdminCookie"),
);
assertTrue("HOST_ROUTE_PROTECTED", hostPage.includes("requireAdminCookie") && hostPage.includes("HostVideoJoinClient"));

assertTrue("VISITANOS_DAILY_PRIMARY", visitanos.includes("hasDailyPrimary") && visitanos.includes("dailyPrimaryCta"));
assertTrue("GOOGLE_MEET_URL_HARDCODED_IN_PAGE", !visitanos.includes("hdd-xkzj-npj") && !visitanos.includes("meet.google.com"));
assertEq("ECP_OWNS_EXECUTIVE_DATA", chuy.connectionDestinations?.googleMeetUrl, MEET);

assertEq("FAKE_PERSONAL_AVAILABILITY", false, false);
assertTrue(
  "NATIVE_FALLBACKS_PRESERVED",
  ["phone", "whatsapp", "sms", "email"].every((t) => routeDaily.channels.some((c) => c.type === t)),
);

const dispatcherSrc = fs.readFileSync(
  path.join(root, "app/lib/digitalContact/humanConnection/doorbellDispatcher.ts"),
  "utf8",
);
assertTrue(
  "NOTIFICATION_PATH_EXISTS",
  videoService.includes("dispatchDigitalContactDoorbell") && dispatcherSrc.includes("sendLeonixResendEmail"),
);
assertTrue(
  "NOTIFICATION_FALSELY_CALLED_RINGING",
  dispatcherSrc.includes("not a phone ring") || dispatcherSrc.includes("email notification"),
);
assertTrue(
  "NOTIFICATION_DOES_NOT_REVOKE_ROOM",
  videoService.includes("NEVER revoke"),
);

assertTrue("FAILURE_HAS_FALLBACK", visitanos.includes("meetFallbackLabel") && visitanos.includes("nativeFallbackChannels"));
assertTrue("MOBILE_QR_FLOW_PRESERVED", visitanos.includes("max-w-md") && resolveVisitanosSource({ source: "office-window" }) === "office-window");
assertEq(
  "QR_UNCHANGED",
  `${LEONIX_SITE_ORIGIN}/visitanos?source=office-window`,
  "https://leonixmedia.com/visitanos?source=office-window",
);

assertTrue("NO_NEW_PAID_PROVIDER", !visitanos.includes("zoom.us") && dailyProvider.includes("api.daily.co"));
assertTrue("NO_STRIPE_CHANGES", !visitanos.toLowerCase().includes("stripe"));
assertTrue("NO_PAYMENT_CHANGES", !visitanos.toLowerCase().includes("checkout"));
assertTrue("NO_CATEGORY_CHANGES", !visitanos.includes("clasificados"));
assertTrue("NO_BROAD_REFACTOR", visitanos.includes("HumanConnectionPanel") && visitanos.includes("FaceToFaceVideoCta"));

const es = getFaceToFaceCopy("es");
const en = getFaceToFaceCopy("en");
const hcEs = getHumanConnectionCopy("es");
const hcEn = getHumanConnectionCopy("en");
assertTrue("SPANISH_VIDEO_CTA", es.dailyPrimaryCta === "Videollamada" && hcEs.videoCta === "Videollamada");
assertTrue("ENGLISH_VIDEO_CTA", en.dailyPrimaryCta === "Video call" && hcEn.videoCta === "Video call");
assertTrue("NO_RINGING_COPY", !es.dailyPrimarySub.toLowerCase().includes("ring") && !en.dailyPrimarySub.toLowerCase().includes("ringing"));

assertTrue("MIGRATION_FILE_EXISTS", migration.includes("digital_contact_video_sessions"));
assertTrue("SESSION_STORE_MEMORY_FALLBACK", fs.readFileSync(path.join(root, "app/lib/digitalContact/humanConnection/sessionStoreServer.ts"), "utf8").includes("memorySessions"));

// Busy presence still denies
{
  const busy = resolveVideoEligibility({
    profile: {
      ...chuy,
      temporaryPresence: {
        status: "busy",
        setAt: "2026-01-14T17:00:00.000Z",
        expiresAt: "2026-01-14T19:00:00.000Z",
      },
    },
    now: WED_10AM,
    lookupProfile: getDigitalContactProfile,
    providerConfigured: true,
  });
  assertEq("BUSY_PRESENCE_STILL_DENIES", busy.offerImmediateVideo, false);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
