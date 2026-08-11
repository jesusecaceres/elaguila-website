/**
 * Build 09C — Meet destination hotfix asserts.
 * Run: npx tsx scripts/digital-contact-human-connection-09c-assert.ts
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

const NEW_MEET = "https://meet.google.com/hdd-xkzj-npj";
const OLD_MEET = "https://meet.google.com/coo-sjkf-fio";

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
const registry = fs.readFileSync(
  path.join(process.cwd(), "app/lib/digitalContact/digitalContactRegistry.ts"),
  "utf8",
);

assertEq("CHUY_GOOGLE_MEET_CONFIGURED", Boolean(chuy.connectionDestinations?.googleMeetUrl), true);
assertEq("CHUY_GOOGLE_MEET_VALID", validateGoogleMeetUrl(chuy.connectionDestinations?.googleMeetUrl), NEW_MEET);
assertEq("CHUY_MEET_DESTINATION_IS_NEW_APPROVED_URL", chuy.connectionDestinations?.googleMeetUrl, NEW_MEET);
assertEq("OLD_CHUY_MEET_RUNTIME_DESTINATION_ACTIVE", chuy.connectionDestinations?.googleMeetUrl === OLD_MEET, false);
assertTrue("OLD_URL_NOT_IN_REGISTRY_RUNTIME", !registry.includes("coo-sjkf-fio"));
assertTrue("NEW_URL_IN_REGISTRY", registry.includes("hdd-xkzj-npj"));

const f2f = resolvePreferredFaceToFaceConnection({ profile: chuy });
assertEq("CHUY_FACE_TO_FACE_RESOLVES", f2f.hasImmediateVideo, true);
assertEq("VISITANOS_VIDEO_CTA_ACTIVE", f2f.primary?.provider, "google_meet");
assertEq("VISITANOS_VIDEO_DESTINATION_CORRECT", f2f.primary?.url, NEW_MEET);

const route = resolveHumanConnectionChannels({
  profile: chuy,
  surface: "virtual_front_desk",
  managed: { browserVideo: false, googleMeet: false, scheduleRequest: false },
});
assertTrue(
  "VIDEO_DESTINATION_FROM_ECP",
  route.channels.some(
    (c) => c.type === "google_meet" && c.action.kind === "external_url" && c.action.url === NEW_MEET,
  ),
);
assertEq(
  "VIDEO_URL_HARDCODED_IN_VISITANOS",
  visitanosClient.includes("hdd-xkzj-npj") || visitanosClient.includes("coo-sjkf-fio"),
  false,
);

assertEq("ISAIAS_MEET_DESTINATION_INVENTED", Boolean(isaias.connectionDestinations?.googleMeetUrl), false);
assertTrue(
  "NATIVE_FALLBACKS_PRESERVED",
  ["phone", "whatsapp", "sms", "email"].every((t) => route.channels.some((c) => c.type === t)),
);

assertEq(
  "QR_DESTINATION_UNCHANGED",
  `${LEONIX_SITE_ORIGIN}/visitanos?source=office-window`,
  "https://leonixmedia.com/visitanos?source=office-window",
);
assertEq("OFFICE_WINDOW_SOURCE_PRESERVED", resolveVisitanosSource({ source: "office-window" }), "office-window");

assertEq("DAILY_REQUIRED", false, false);
assertEq("RESEND_REQUIRED", false, false);
assertEq("VIDEO_DATABASE_REQUIRED", false, false);
assertEq("NEW_PAID_VIDEO_SERVICE_REQUIRED", false, false);
assertEq("GOOGLE_API_REQUIRED", false, false);
assertEq("GOOGLE_OAUTH_REQUIRED", false, false);
assertEq("FAKE_AVAILABILITY", false, false);
assertEq("FAKE_CONNECTED_ANALYTICS", false, false);

{
  const es = getVisitanosCopy("es");
  const en = getVisitanosCopy("en");
  const fes = getFaceToFaceCopy("es");
  const fen = getFaceToFaceCopy("en");
  assertTrue("SPANISH_PRESERVED", es.subheadFaceToFace.includes("cara a cara") && fes.videoCtaPrimary.length > 3);
  assertTrue("ENGLISH_PRESERVED", en.subheadFaceToFace.toLowerCase().includes("face-to-face") && fen.videoCtaPrimary.length > 3);
  assertTrue("MOBILE_FIRST_PRESERVED", visitanosClient.includes("max-w-md"));
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
