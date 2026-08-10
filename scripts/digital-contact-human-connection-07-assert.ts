/**
 * Build 07 — Free/Native V1 launch gate asserts.
 * Run: npx tsx scripts/digital-contact-human-connection-07-assert.ts
 */

import fs from "node:fs";
import path from "node:path";
import { getDigitalContactProfile } from "../app/lib/digitalContact/digitalContactRegistry";
import { resolveHumanConnectionChannels } from "../app/lib/digitalContact/humanConnection/resolveHumanConnectionChannels";
import {
  buildMailtoHref,
  buildSmsHref,
  buildTelHref,
  buildWhatsAppUrl,
} from "../app/lib/digitalContact/humanConnection/nativeChannelHrefs";
import {
  evaluateHumanConnectionLaunchReadiness,
  getDefaultBuild07LaunchEvidence,
  isScheduleRequestBackendReady,
} from "../app/lib/digitalContact/humanConnection/launchReadiness";
import { getVisitanosCopy, resolveVisitanosSource } from "../app/lib/visitanos/visitanosCopy";
import { isAllowedPublicLaunchPath, isStaticPrefixBypass } from "../app/lib/launchLock/publicLaunchLock";
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

assertTrue("1 chuy exists", Boolean(chuy));
assertTrue("2 isaias exists", Boolean(isaias));

// --- ECP truth ---
assertEq("3 chuy phoneDigits", chuy!.phoneDigits, "16693664300");
assertEq("3 chuy phoneDisplay", chuy!.phoneDisplay, "(669) 366-4300");
assertEq("3 chuy email", chuy!.email, "chuy@leonixmedia.com");
assertEq("3 chuy whatsappDigits field", chuy!.whatsappDigits ?? null, null);

assertEq("4 isaias phoneDigits", isaias!.phoneDigits, "14087040204");
assertEq("4 isaias phoneDisplay", isaias!.phoneDisplay, "(408) 704-0204");
assertEq("4 isaias email", isaias!.email, "isaias@leonixmedia.com");
assertEq("4 isaias whatsappDigits field", isaias!.whatsappDigits ?? null, null);

// --- Native href certification ---
{
  const tel = buildTelHref(chuy!.phoneDigits);
  assertEq("5 chuy tel", tel, "tel:+16693664300");
  assertTrue("5 no js", !String(tel).toLowerCase().includes("javascript"));
  const sms = buildSmsHref(chuy!.phoneDigits, "");
  assertEq("5 chuy sms", sms, "sms:+16693664300");
  const wa = buildWhatsAppUrl(chuy!.whatsappDigits || chuy!.phoneDigits, "");
  assertEq("5 chuy wa", wa, "https://wa.me/16693664300");
  const mail = buildMailtoHref(chuy!.email);
  assertEq("5 chuy mailto", mail, "mailto:chuy@leonixmedia.com");
}

{
  const tel = buildTelHref(isaias!.phoneDigits);
  assertEq("6 isaias tel", tel, "tel:+14087040204");
  const sms = buildSmsHref(isaias!.phoneDigits);
  assertEq("6 isaias sms", sms, "sms:+14087040204");
  const wa = buildWhatsAppUrl(isaias!.whatsappDigits || isaias!.phoneDigits);
  assertEq("6 isaias wa", wa, "https://wa.me/14087040204");
  const mail = buildMailtoHref(isaias!.email);
  assertEq("6 isaias mailto", mail, "mailto:isaias@leonixmedia.com");
}

assertEq("7 bad tel", buildTelHref("123"), null);
assertEq("7 js mailto", buildMailtoHref('evil"@x.com'), null);
assertEq("7 display contamination", buildTelHref("(669) 366-4300"), "tel:+16693664300");

// --- Router native V1 (no managed deps) ---
{
  const r = resolveHumanConnectionChannels({
    profile: chuy!,
    surface: "virtual_front_desk",
    managed: { browserVideo: false, googleMeet: false, scheduleRequest: false },
  });
  const t = r.channels.map((c) => c.type);
  assertTrue("8 chuy phone", t.includes("phone"));
  assertTrue("8 chuy sms", t.includes("sms"));
  assertTrue("8 chuy whatsapp", t.includes("whatsapp"));
  assertTrue("8 chuy email", t.includes("email"));
  assertTrue("8 no facetime", !t.includes("facetime"));
  assertTrue("8 no meet", !t.includes("google_meet"));
  assertTrue("8 no browser video", !t.includes("browser_video"));
  assertTrue("8 no schedule without backend", !t.includes("schedule_request"));
  assertEq("8 primary call", r.primaryType, "phone");
}

{
  const r = resolveHumanConnectionChannels({
    profile: isaias!,
    surface: "digital_contact",
    managed: { browserVideo: false, googleMeet: false, scheduleRequest: false },
  });
  const t = r.channels.map((c) => c.type);
  assertTrue("9 isaias phone", t.includes("phone"));
  assertTrue("9 isaias sms", t.includes("sms"));
  assertTrue("9 isaias whatsapp", t.includes("whatsapp"));
  assertTrue("9 isaias email", t.includes("email"));
  assertTrue("9 isaias no video caps invent", !t.includes("browser_video"));
  assertTrue("9 isaias no schedule invent", !t.includes("schedule_request"));
  assertTrue("9 isaias no facetime", !t.includes("facetime"));
  // Independent from Chuy — Isaias has no allowScheduling / allowVideo
  assertEq("9 isaias allowVideo", isaias!.capabilities?.allowVideo ?? false, false);
  assertEq("9 isaias allowScheduling", isaias!.capabilities?.allowScheduling ?? false, false);
}

// Schedule with backend gate
{
  const r = resolveHumanConnectionChannels({
    profile: chuy!,
    surface: "digital_contact",
    managed: { scheduleRequest: true },
  });
  assertTrue("10 schedule when ready", r.channels.some((c) => c.type === "schedule_request"));
}
assertEq("10 schedule backend helper false", isScheduleRequestBackendReady(false), false);
assertEq("10 schedule backend helper true", isScheduleRequestBackendReady(true), true);

// No Daily/Resend required for native resolution (pure function proof)
{
  const prevDaily = process.env.DAILY_API_KEY;
  const prevResend = process.env.RESEND_API_KEY;
  delete process.env.DAILY_API_KEY;
  delete process.env.RESEND_API_KEY;
  const r = resolveHumanConnectionChannels({
    profile: chuy!,
    surface: "virtual_front_desk",
    managed: { browserVideo: false, googleMeet: false, scheduleRequest: false },
  });
  assertTrue("11 native without daily/resend", r.channels.some((c) => c.type === "phone"));
  assertTrue("11 whatsapp without daily", r.channels.some((c) => c.type === "whatsapp"));
  assertTrue("11 email without resend", r.channels.some((c) => c.type === "email"));
  if (prevDaily !== undefined) process.env.DAILY_API_KEY = prevDaily;
  if (prevResend !== undefined) process.env.RESEND_API_KEY = prevResend;
}

// Source attribution
assertEq("12 office-window", resolveVisitanosSource({ source: "office-window" }), "office-window");
assertEq("12 junk null", resolveVisitanosSource({ source: "https://evil.com" }), null);
assertEq("12 arbitrary null", resolveVisitanosSource({ source: "lead_hack" }), null);

// QR destination canonical + asset exists
const qrCanonical = `${LEONIX_SITE_ORIGIN}/visitanos?source=office-window`;
assertEq("13 qr canonical", qrCanonical, "https://leonixmedia.com/visitanos?source=office-window");
const qrPath = path.join(process.cwd(), "public", "qr", "visitanos-office-window.png");
assertTrue("13 qr file exists", fs.existsSync(qrPath));
assertTrue("13 qr png magic", fs.readFileSync(qrPath).subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])));
assertTrue("13 no provider domain in canonical", !qrCanonical.includes("daily.co") && !qrCanonical.includes("zoom"));

// Launch lock
assertTrue("14 visitanos allowed", isAllowedPublicLaunchPath("/visitanos"));
assertTrue("14 contact allowed", isAllowedPublicLaunchPath("/contact/chuy"));
assertTrue("14 contacto allowed", isAllowedPublicLaunchPath("/contacto"));
assertTrue("14 qr static allowed", isStaticPrefixBypass("/qr/visitanos-office-window.png"));

// Copy ES/EN
{
  const es = getVisitanosCopy("es");
  const en = getVisitanosCopy("en");
  assertTrue("15 es headline", es.headline.includes("Gracias") || es.headline.length > 8);
  assertTrue("15 en headline", en.headline.toLowerCase().includes("thank") || en.headline.length > 8);
  assertTrue("15 es hours", es.hoursWindow.includes("9:00"));
  assertTrue("15 en hours", en.hoursWindow.includes("9:00"));
  assertTrue("15 no daily jargon es", !es.subhead.toLowerCase().includes("daily"));
  assertTrue("15 no api jargon en", !en.subhead.toLowerCase().includes("api"));
}

// Launch readiness
{
  const ready = evaluateHumanConnectionLaunchReadiness(getDefaultBuild07LaunchEvidence());
  assertEq("16 NATIVE_V1_READY", ready.nativeV1Ready, true);
  assertEq("16 MANAGED_VIDEO_READY", ready.managedVideoReady, false);
  assertEq("16 FULL_HUMAN_CONNECTION_READY", ready.fullHumanConnectionReady, false);
}

// Fake analytics strings must not appear as required success claims in readiness module
{
  const src = fs.readFileSync(
    path.join(process.cwd(), "app/lib/digitalContact/humanConnection/launchReadiness.ts"),
    "utf8",
  );
  assertTrue("17 no call_answered", !src.includes("call_answered"));
  assertTrue("17 no whatsapp_connected", !src.includes("whatsapp_connected"));
}

// Staff routes through ECP (registry only)
assertEq("18 staff chuy path", `/contact/${chuy!.slug}`, "/contact/chuy");
assertEq("18 staff isaias path", `/contact/${isaias!.slug}`, "/contact/isaias");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
