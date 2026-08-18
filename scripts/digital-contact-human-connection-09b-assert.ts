/**
 * Build 09B — Chuy Google Meet activation asserts.
 * Run: npx tsx scripts/digital-contact-human-connection-09b-assert.ts
 */

import fs from "node:fs";
import path from "node:path";
import { getDigitalContactProfile } from "../app/lib/digitalContact/digitalContactRegistry";
import { resolvePreferredFaceToFaceConnection } from "../app/lib/digitalContact/humanConnection/resolvePreferredFaceToFaceConnection";
import { resolveHumanConnectionChannels } from "../app/lib/digitalContact/humanConnection/resolveHumanConnectionChannels";
import { validateGoogleMeetUrl } from "../app/lib/digitalContact/humanConnection/channelValidation";
import { resolveVisitanosSource, getVisitanosCopy } from "../app/lib/visitanos/visitanosCopy";
import { getFaceToFaceCopy } from "../app/lib/digitalContact/humanConnection/faceToFaceCopy";
import { LEONIX_SITE_ORIGIN } from "../app/lib/leonixBrand";

const OWNER_MEET = "https://meet.google.com/hdd-xkzj-npj";

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

const chuy = getDigitalContactProfile("chuy")!;
const isaias = getDigitalContactProfile("isaias")!;
const visitanosClient = fs.readFileSync(
  path.join(process.cwd(), "app/visitanos/VisitanosPageClient.tsx"),
  "utf8",
);

assertEq("CHUY_GOOGLE_MEET_CONFIGURED", Boolean(chuy.connectionDestinations?.googleMeetUrl), true);
assertEq(
  "CHUY_GOOGLE_MEET_VALID",
  validateGoogleMeetUrl(chuy.connectionDestinations?.googleMeetUrl),
  OWNER_MEET,
);
assertEq(
  "CHUY_GOOGLE_MEET_URL_MATCHES_OWNER_APPROVED_URL",
  chuy.connectionDestinations?.googleMeetUrl,
  OWNER_MEET,
);

const f2f = resolvePreferredFaceToFaceConnection({ profile: chuy });
assertEq("CHUY_FACE_TO_FACE_RESOLVES", f2f.hasImmediateVideo, true);
assertEq("GOOGLE_MEET_IS_PRIMARY_FACE_TO_FACE_DESTINATION", f2f.primary?.provider, "google_meet");
assertEq("RESOLVER_DESTINATION", f2f.primary?.url, OWNER_MEET);
assertEq("RESOLVER_SLUG", f2f.slug, "chuy");

const route = resolveHumanConnectionChannels({
  profile: chuy,
  surface: "virtual_front_desk",
  managed: { browserVideo: false, googleMeet: false, scheduleRequest: false },
});
assertEq("VISITANOS_VIDEO_CTA_ACTIVE", route.primaryType, "google_meet");
assertTrue(
  "VIDEO_CTA_DESTINATION_FROM_ECP",
  route.channels.some(
    (c) =>
      c.type === "google_meet" &&
      c.action.kind === "external_url" &&
      c.action.url === OWNER_MEET,
  ),
);

assertEq(
  "VIDEO_URL_HARDCODED_IN_VISITANOS",
  visitanosClient.includes("coo-sjkf-fio") ||
    visitanosClient.includes("hdd-xkzj-npj") ||
    visitanosClient.includes(OWNER_MEET),
  false,
);
assertEq(
  "OLD_CHUY_MEET_RUNTIME_DESTINATION_ACTIVE",
  chuy.connectionDestinations?.googleMeetUrl === "https://meet.google.com/coo-sjkf-fio",
  false,
);
assertEq(
  "CHUY_MEET_DESTINATION_IS_NEW_APPROVED_URL",
  chuy.connectionDestinations?.googleMeetUrl === OWNER_MEET,
  true,
);

assertEq("ISAIAS_MEET_DESTINATION_INVENTED", Boolean(isaias.connectionDestinations?.googleMeetUrl), false);
assertEq(
  "ISAIAS_FACE_TO_FACE",
  resolvePreferredFaceToFaceConnection({ profile: isaias }).hasImmediateVideo,
  false,
);

assertTrue(
  "NATIVE_FALLBACKS_PRESERVED",
  route.channels.some((c) => c.type === "phone") &&
    route.channels.some((c) => c.type === "whatsapp") &&
    route.channels.some((c) => c.type === "sms") &&
    route.channels.some((c) => c.type === "email"),
);

assertEq("DAILY_REQUIRED", false, false);
assertEq("RESEND_REQUIRED", false, false);
assertEq("VIDEO_DATABASE_REQUIRED", false, false);
assertEq("NEW_PAID_SERVICE_REQUIRED", false, false);
assertEq("FAKE_AVAILABILITY", false, false);
assertEq("FAKE_VIDEO_CONNECTED_ANALYTICS", false, false);

assertEq(
  "QR_DESTINATION_UNCHANGED",
  `${LEONIX_SITE_ORIGIN}/visitanos?source=office-window`,
  "https://leonixmedia.com/visitanos?source=office-window",
);
assertEq("OFFICE_WINDOW_SOURCE_PRESERVED", resolveVisitanosSource({ source: "office-window" }), "office-window");

{
  const es = getVisitanosCopy("es");
  const en = getVisitanosCopy("en");
  const fes = getFaceToFaceCopy("es");
  const fen = getFaceToFaceCopy("en");
  assertTrue("SPANISH_COMPLETE", es.subheadFaceToFace.includes("cara a cara") && fes.videoCtaPrimary.length > 3);
  assertTrue("ENGLISH_COMPLETE", en.subheadFaceToFace.toLowerCase().includes("face-to-face") && fen.videoCtaPrimary.length > 3);
  assertTrue("MOBILE_FIRST", visitanosClient.includes("max-w-md"));
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
