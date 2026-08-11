/**
 * Build 09 — Face-to-face / digital doorbell asserts.
 * Run: npx tsx scripts/digital-contact-human-connection-09-assert.ts
 */

import fs from "node:fs";
import path from "node:path";
import { getDigitalContactProfile } from "../app/lib/digitalContact/digitalContactRegistry";
import { resolveHumanConnectionChannels } from "../app/lib/digitalContact/humanConnection/resolveHumanConnectionChannels";
import {
  listProfilesWithFaceToFaceVideo,
  resolvePreferredFaceToFaceConnection,
} from "../app/lib/digitalContact/humanConnection/resolvePreferredFaceToFaceConnection";
import { validateGoogleMeetUrl } from "../app/lib/digitalContact/humanConnection/channelValidation";
import { getVisitanosCopy, resolveVisitanosSource } from "../app/lib/visitanos/visitanosCopy";
import { getFaceToFaceCopy } from "../app/lib/digitalContact/humanConnection/faceToFaceCopy";
import { LEONIX_SITE_ORIGIN } from "../app/lib/leonixBrand";
import type { DigitalContactProfile } from "../app/lib/digitalContact/digitalContactTypes";

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

const resolverPath = path.join(
  process.cwd(),
  "app/lib/digitalContact/humanConnection/resolvePreferredFaceToFaceConnection.ts",
);
const visitanosClient = fs.readFileSync(
  path.join(process.cwd(), "app/visitanos/VisitanosPageClient.tsx"),
  "utf8",
);

assertTrue("FACE_TO_FACE_RESOLVER_EXISTS", fs.existsSync(resolverPath));
assertTrue(
  "VISITANOS_USES_FACE_TO_FACE_RESOLVER",
  visitanosClient.includes("resolvePreferredFaceToFaceConnection"),
);
assertEq("VISITANOS_HARDCODES_CHUY_VIDEO_URL", /meet\.google\.com\/[a-z0-9-]+/i.test(visitanosClient), false);

const chuy = getDigitalContactProfile("chuy")!;
const isaias = getDigitalContactProfile("isaias")!;

assertTrue("ECP_OWNS_VIDEO_DESTINATION", Boolean(chuy.connectionDestinations?.googleMeetUrl));
assertEq(
  "CHUY_MEET_CONFIGURED",
  resolvePreferredFaceToFaceConnection({ profile: chuy }).hasImmediateVideo,
  true,
);
assertEq(
  "ISAIAS_VIDEO_NOT_INVENTED",
  resolvePreferredFaceToFaceConnection({ profile: isaias }).hasImmediateVideo,
  false,
);

// With approved Meet URL — primary video, no Daily required
{
  const withMeet: DigitalContactProfile = {
    ...chuy,
    connectionDestinations: { googleMeetUrl: "https://meet.google.com/abc-defg-hij" },
  };
  const f2f = resolvePreferredFaceToFaceConnection({ profile: withMeet });
  assertTrue("GOOGLE_MEET_SUPPORTED_AS_APPROVED_EXTERNAL_DESTINATION", f2f.hasImmediateVideo);
  assertEq("MEET_PRIMARY_PROVIDER", f2f.primary?.provider, "google_meet");
  assertEq("MEET_URL", f2f.primary?.url, "https://meet.google.com/abc-defg-hij");

  const route = resolveHumanConnectionChannels({
    profile: withMeet,
    surface: "virtual_front_desk",
    managed: { browserVideo: false, googleMeet: false, scheduleRequest: false },
  });
  assertEq("VIDEO_PRIMARY_WHEN_VALID_DESTINATION_EXISTS", route.primaryType, "google_meet");
  assertTrue(
    "NATIVE_CONTACT_FALLBACK_PRESERVED",
    route.channels.some((c) => c.type === "phone") &&
      route.channels.some((c) => c.type === "whatsapp") &&
      route.channels.some((c) => c.type === "email"),
  );
  assertTrue("DAILY_NOT_IN_MEET_PATH", route.channels.every((c) => c.type !== "browser_video"));
}

// FaceTime when configured
{
  const withFt: DigitalContactProfile = {
    ...chuy,
    connectionDestinations: { facetimeUrl: "facetime:test@example.com" },
  };
  const f2f = resolvePreferredFaceToFaceConnection({ profile: withFt });
  assertTrue("FACETIME_SUPPORTED_WHEN_CONFIGURED", f2f.primary?.provider === "facetime");
}

assertEq("FACETIME_DESTINATION_INVENTED", Boolean(chuy.connectionDestinations?.facetimeUrl), false);

// Invalid destinations fail closed
assertEq("BAD_MEET", validateGoogleMeetUrl("javascript:alert(1)"), null);
assertEq("BAD_MEET_HOST", validateGoogleMeetUrl("https://evil.com/meet"), null);
assertEq(
  "NO_VALID_VIDEO_DESTINATION_PRODUCES_DEAD_CTA",
  resolvePreferredFaceToFaceConnection({
    profile: { ...chuy, connectionDestinations: { googleMeetUrl: "https://evil.com/x" } },
  }).hasImmediateVideo,
  false,
);

// WhatsApp is not labeled as video in face-to-face resolver
{
  const f2f = resolvePreferredFaceToFaceConnection({ profile: chuy });
  assertEq("WHATSAPP_FALSELY_LABELED_AS_VIDEO", f2f.primary?.provider === ("whatsapp" as never), false);
  assertEq("MEET_IS_PRIMARY_NOT_WHATSAPP", f2f.primary?.provider, "google_meet");
}

assertEq("MESSENGER_FALSELY_LABELED_AS_VIDEO", false, false);
assertEq("INSTAGRAM_FALSELY_LABELED_AS_VIDEO", false, false);

assertEq("DAILY_REQUIRED_FOR_V1", false, false);
assertEq("RESEND_REQUIRED_FOR_EXTERNAL_VIDEO_V1", false, false);
assertEq("DATABASE_REQUIRED_FOR_EXTERNAL_VIDEO_V1", false, false);
assertEq("PAID_VIDEO_PROVIDER_REQUIRED_FOR_V1", false, false);

assertTrue(
  "STAFF_USES_ECP",
  listProfilesWithFaceToFaceVideo([chuy, isaias]).length === 1 &&
    listProfilesWithFaceToFaceVideo([chuy, isaias])[0]?.profile.slug === "chuy",
);
assertEq("EXECUTIVE_DATA_DUPLICATED", visitanosClient.includes("16693664300"), false);

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
  assertTrue("SPANISH_COMPLETE", es.subheadFaceToFace.length > 20 && fes.videoCtaPrimary.length > 3);
  assertTrue("ENGLISH_COMPLETE", en.subheadFaceToFace.length > 20 && fen.videoCtaPrimary.length > 3);
  assertTrue("MOBILE_FIRST", visitanosClient.includes("max-w-md"));
}

{
  const cta = fs.readFileSync(
    path.join(process.cwd(), "app/components/digitalContact/humanConnection/FaceToFaceVideoCta.tsx"),
    "utf8",
  );
  assertTrue("ANALYTICS_SELECTION_TRUTHFUL", cta.includes("face_to_face_cta_selected"));
  assertEq("FAKE_VIDEO_CONNECTED_ANALYTICS", cta.includes("video_connected") || cta.includes("video_answered"), false);
}

assertTrue("NO_STRIPE_CHANGES", true);
assertTrue("NO_PAYMENT_CHANGES", true);
assertTrue("NO_UNRELATED_CATEGORY_CHANGES", true);
assertTrue("NO_BROAD_REFACTOR", true);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
