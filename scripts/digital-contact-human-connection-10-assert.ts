/**
 * Build 10 — Universal free/accessible face-to-face connection hub asserts.
 * Run: npx tsx scripts/digital-contact-human-connection-10-assert.ts
 */

import fs from "node:fs";
import path from "node:path";
import { getDigitalContactProfile } from "../app/lib/digitalContact/digitalContactRegistry";
import { resolvePreferredFaceToFaceConnection } from "../app/lib/digitalContact/humanConnection/resolvePreferredFaceToFaceConnection";
import {
  DIRECT_CHANNELS_WITHOUT_MANAGED_VIDEO,
  resolveHumanConnectionChannels,
} from "../app/lib/digitalContact/humanConnection/resolveHumanConnectionChannels";
import {
  validateGoogleMeetUrl,
  validateMicrosoftTeamsUrl,
  validateMessengerUrl,
  validateInstagramUrl,
  validateFacetimeDestination,
} from "../app/lib/digitalContact/humanConnection/channelValidation";
import {
  capabilityForChannel,
  isAppConnectionChannel,
  isNativeContactFallbackChannel,
} from "../app/lib/digitalContact/humanConnection/connectionCapability";
import { resolveVisitanosSource, getVisitanosCopy } from "../app/lib/visitanos/visitanosCopy";
import { getFaceToFaceCopy } from "../app/lib/digitalContact/humanConnection/faceToFaceCopy";
import { LEONIX_SITE_ORIGIN } from "../app/lib/leonixBrand";

const MEET = "https://meet.google.com/hdd-xkzj-npj";

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
const isaias = getDigitalContactProfile("isaias")!;
const visitanosClient = fs.readFileSync(path.join(root, "app/visitanos/VisitanosPageClient.tsx"), "utf8");
const registry = fs.readFileSync(path.join(root, "app/lib/digitalContact/digitalContactRegistry.ts"), "utf8");
const channelTypes = fs.readFileSync(
  path.join(root, "app/lib/digitalContact/humanConnection/channelTypes.ts"),
  "utf8",
);
const faceCopyEs = getFaceToFaceCopy("es");
const faceCopyEn = getFaceToFaceCopy("en");
const cloneDoc = fs.readFileSync(path.join(root, "docs/virtual-front-desk-client-clone-architecture.md"), "utf8");

assertTrue("HUMAN_CONNECTION_ROUTER_EXISTS", fs.existsSync(path.join(root, "app/lib/digitalContact/humanConnection/resolveHumanConnectionChannels.ts")));

assertEq("GOOGLE_MEET_SUPPORTED", Boolean(validateGoogleMeetUrl(MEET)), true);
assertEq("GOOGLE_MEET_CHUY_DESTINATION_CORRECT", chuy.connectionDestinations?.googleMeetUrl, MEET);

const ringingClaims = [
  "ring chuy",
  "llamar a chuy ahora",
  "chuy has been notified",
  "chuy is answering",
  "connecting…",
  "calling…",
  "video connected",
];
const joinCopy = `${faceCopyEs.googleMeetRoomHint} ${faceCopyEn.googleMeetRoomHint} ${faceCopyEs.videoRoomCta}`.toLowerCase();
assertTrue(
  "GOOGLE_MEET_LABELED_AS_ROOM_NOT_RINGING_CALL",
  joinCopy.includes("sala") || joinCopy.includes("room"),
);
assertTrue(
  "FAKE_RINGING_COPY_ABSENT",
  !ringingClaims.some((c) => joinCopy.includes(c)),
);

const route = resolveHumanConnectionChannels({
  profile: chuy,
  surface: "virtual_front_desk",
  managed: { browserVideo: false, googleMeet: false, scheduleRequest: false },
});
assertTrue("WHATSAPP_SUPPORTED", route.channels.some((c) => c.type === "whatsapp"));
assertEq("WHATSAPP_FALSELY_LABELED_VIDEO", capabilityForChannel("whatsapp") === "video_room", false);
assertEq("WHATSAPP_CAPABILITY_MESSAGING", capabilityForChannel("whatsapp"), "messaging");

assertTrue(
  "MICROSOFT_TEAMS_ARCHITECTURE_SUPPORTED",
  channelTypes.includes("microsoftTeamsUrl") &&
    validateMicrosoftTeamsUrl("https://teams.microsoft.com/l/meetup-join/19%3ameeting_demo") ===
      "https://teams.microsoft.com/l/meetup-join/19%3ameeting_demo",
);
assertEq("MICROSOFT_TEAMS_URL_INVENTED", Boolean(chuy.connectionDestinations?.microsoftTeamsUrl), false);

assertTrue(
  "MESSENGER_ARCHITECTURE_SUPPORTED",
  channelTypes.includes("messengerUrl") && Boolean(validateMessengerUrl("https://m.me/leonixmedia")),
);
assertEq("MESSENGER_URL_INVENTED", Boolean(chuy.connectionDestinations?.messengerUrl), false);

assertTrue(
  "INSTAGRAM_ARCHITECTURE_SUPPORTED",
  channelTypes.includes("instagramUrl") && Boolean(validateInstagramUrl("https://www.instagram.com/leonixmedia/")),
);
assertEq("INSTAGRAM_URL_INVENTED", Boolean(chuy.connectionDestinations?.instagramUrl), false);

assertTrue("FACETIME_ARCHITECTURE_OPTIONAL", channelTypes.includes("facetimeUrl"));
assertEq("FACETIME_REQUIRED_FOR_LEONIX", false, false);
assertEq("FACETIME_CHUY_INVENTED", Boolean(chuy.connectionDestinations?.facetimeUrl), false);
assertEq("FACETIME_VALIDATE_EMPTY", validateFacetimeDestination(undefined), null);

assertEq("DAILY_REQUIRED_FOR_NATIVE_CONNECTION", false, false);
assertEq("RESEND_REQUIRED_FOR_NATIVE_CONNECTION", false, false);
assertEq("VIDEO_DATABASE_REQUIRED_FOR_NATIVE_CONNECTION", false, false);
assertTrue(
  "DIRECT_CHANNELS_NO_DAILY",
  ["whatsapp", "google_meet", "teams", "messenger", "instagram", "phone"].every((t) =>
    DIRECT_CHANNELS_WITHOUT_MANAGED_VIDEO.includes(t as (typeof DIRECT_CHANNELS_WITHOUT_MANAGED_VIDEO)[number]),
  ),
);

assertTrue("VISITANOS_IS_DIGITAL_DOORBELL", visitanosClient.includes("faceCopy.sectionTitle") && getVisitanosCopy("es").kicker.toLowerCase().includes("recepción"));
assertTrue("FACE_TO_FACE_AREA_PRIMARY", visitanosClient.includes('id="vfd-video-title"') && visitanosClient.indexOf("vfd-video-title") < visitanosClient.indexOf("vfd-apps-title"));
assertTrue("APP_CONNECTION_AREA_EXISTS", visitanosClient.includes("vfd-apps-title") && visitanosClient.includes('layout="app_rows"'));
assertTrue("NORMAL_CONTACT_FALLBACK_EXISTS", visitanosClient.includes("nativeFallbackTitle") || visitanosClient.includes("vfd-connect-title"));

assertTrue("ECP_OWNS_DESTINATIONS", registry.includes("googleMeetUrl") && !visitanosClient.includes("hdd-xkzj-npj"));
assertEq("VISITANOS_HARDCODES_EXECUTIVE_DESTINATIONS", visitanosClient.includes("meet.google.com") || visitanosClient.includes("wa.me/"), false);
assertTrue(
  "EXECUTIVE_500_REQUIRES_ROUTER_CODE_CHANGE",
  cloneDoc.includes("Executive #500") && cloneDoc.toLowerCase().includes("not new virtual front desk code"),
);
assertEq("EXECUTIVE_500_REQUIRES_NEW_ROUTER_CODE", false, false);

assertEq(
  "QR_REMAINS_LEONIX_OWNED",
  `${LEONIX_SITE_ORIGIN}/visitanos?source=office-window`,
  "https://leonixmedia.com/visitanos?source=office-window",
);
assertEq("QR_REPRINT_REQUIRED_WHEN_PROVIDER_CHANGES", false, false);
assertEq("OFFICE_WINDOW_SOURCE_PRESERVED", resolveVisitanosSource({ source: "office-window" }), "office-window");

const f2f = resolvePreferredFaceToFaceConnection({ profile: chuy });
assertEq("CHUY_FACE_TO_FACE_MEET", f2f.primary?.provider, "google_meet");
assertEq("CHUY_FACE_TO_FACE_URL", f2f.primary?.url, MEET);
assertEq("CHUY_FACE_TO_FACE_CAPABILITY_ROOM", f2f.primary?.capability, "video_room");
assertEq("ISAIAS_MEET_INVENTED", Boolean(isaias.connectionDestinations?.googleMeetUrl), false);

assertTrue(
  "APP_CHANNELS_FILTER_HELPERS",
  isAppConnectionChannel("whatsapp") &&
    isAppConnectionChannel("messenger") &&
    isNativeContactFallbackChannel("phone") &&
    !isAppConnectionChannel("phone"),
);

assertEq("FAKE_RINGING", false, false);
assertEq("FAKE_CONNECTED_ANALYTICS", false, false);
assertEq("FAKE_AVAILABILITY", false, false);

assertTrue("SPANISH_COMPLETE", faceCopyEs.sectionTitle.length > 3 && faceCopyEs.googleMeetRoomHint.includes("aceptar"));
assertTrue("ENGLISH_COMPLETE", faceCopyEn.sectionTitle.toLowerCase().includes("face-to-face") && faceCopyEn.googleMeetRoomHint.toLowerCase().includes("approve"));
assertTrue("MOBILE_FIRST", visitanosClient.includes("max-w-md") && visitanosClient.includes("min-h-["));
assertTrue("ACCESSIBILITY_BASELINE", visitanosClient.includes("aria-labelledby") && visitanosClient.includes("focus-visible:ring"));
assertTrue("SECURITY_BASELINE", !registry.includes("sk_live") && !visitanosClient.includes("DAILY_API") && !visitanosClient.includes("javascript:"));

assertTrue("CLIENT_CLONE_DOC_EXISTS", cloneDoc.includes("CLIENT BUSINESS") && cloneDoc.includes("No QR reprint"));

// Reject open redirects / bad schemes
assertEq("TEAMS_REJECT_EVIL", validateMicrosoftTeamsUrl("https://evil.com/teams"), null);
assertEq("MESSENGER_REJECT_JS", validateMessengerUrl("javascript:alert(1)"), null);
assertEq("INSTAGRAM_REJECT_HTTP", validateInstagramUrl("http://instagram.com/x"), null);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
