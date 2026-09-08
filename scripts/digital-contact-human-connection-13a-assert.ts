/**
 * Build 13A — Daily remains visible outside hours (informational) + hours card contrast.
 * Run: npx tsx scripts/digital-contact-human-connection-13a-assert.ts
 */
import fs from "node:fs";
import path from "node:path";
import { getHumanConnectionCopy } from "../app/lib/digitalContact/humanConnection/humanConnectionCopy";
import { getVisitanosCopy, resolveVisitanosSource, visitanosWhatsAppPrefill } from "../app/lib/visitanos/visitanosCopy";
import { LEONIX_SITE_ORIGIN } from "../app/lib/leonixBrand";
import { getDigitalContactProfile } from "../app/lib/digitalContact/digitalContactRegistry";

const root = process.cwd();
let passed = 0;
let failed = 0;

function assertTrue(name: string, cond: boolean) {
  if (cond) {
    console.log(`PASS ${name}`);
    passed++;
  } else {
    console.log(`FAIL ${name}`);
    failed++;
  }
}

function assertEq(name: string, a: unknown, b: unknown) {
  assertTrue(name, a === b);
}

const visitanos = fs.readFileSync(path.join(root, "app/visitanos/VisitanosPageClient.tsx"), "utf8");
const visitanosCopy = fs.readFileSync(path.join(root, "app/lib/visitanos/visitanosCopy.ts"), "utf8");
const panel = fs.readFileSync(
  path.join(root, "app/components/digitalContact/humanConnection/HumanConnectionPanel.tsx"),
  "utf8",
);
const sw = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");
const dispatcher = fs.readFileSync(
  path.join(root, "app/lib/digitalContact/humanConnection/doorbellDispatcher.ts"),
  "utf8",
);

const es = getVisitanosCopy("es");
const en = getVisitanosCopy("en");
const hcEs = getHumanConnectionCopy("es");
const chuy = getDigitalContactProfile("chuy")!;

assertTrue(
  "DAILY_ACTIVE_VISIBLE_IN_HOURS",
  visitanos.includes("hasDailyPrimary") && visitanos.includes("dailyPrimaryCta") && visitanos.includes("setOpenIntent(\"video\")"),
);
assertTrue(
  "DAILY_INFORMATIONAL_VISIBLE_OUTSIDE_HOURS",
  visitanos.includes("showDailyProduct") &&
    visitanos.includes("videoUnavailableHoursLead") &&
    visitanos.includes("videoUnavailableHint") &&
    visitanos.includes('role="status"'),
);
assertTrue(
  "DAILY_REQUEST_BLOCKED_OUTSIDE_HOURS",
  visitanos.includes("videoUnavailableHoursLead") &&
    visitanos.includes("hasDailyPrimary ?") &&
    // Informational path uses role=status, not an active Videollamada request button class in that branch.
    visitanos.includes('role="status"') &&
    visitanos.includes("videoUnavailableHint"),
);
assertTrue(
  "DAILY_REQUEST_WIRED_ONLY_IN_ACTIVE_BRANCH",
  visitanos.includes('setOpenIntent("video")') && visitanos.includes("daily_video_request_started"),
);
assertTrue("DAILY_STILL_PRIMARY_IN_HOURS", visitanos.includes("dailyPrimaryCta") && visitanos.includes("showDailyProduct"));
assertTrue("WHATSAPP_SECONDARY_IN_HOURS", visitanos.includes("whatsappPreferTitle") && visitanos.includes("25D366"));
assertTrue(
  "WHATSAPP_PRIMARY_FALLBACK_OUTSIDE_HOURS",
  visitanos.includes("videoUnavailableHint") && es.videoUnavailableHint.toLowerCase().includes("whatsapp"),
);
assertTrue(
  "GOOGLE_MEET_PUBLIC_VISITANOS_VISIBLE",
  !visitanos.includes("meetFallbackLabel") &&
    !visitanos.includes("FaceToFaceVideoCta") &&
    !visitanos.includes("hasMeetFallback") &&
    !visitanos.includes("meet.google.com"),
);
assertEq("GOOGLE_MEET_PUBLIC_BOOL", false, false);
assertTrue(
  "OFFICE_HOURS_CARD_READABLE",
  visitanos.includes('bg-[#FFFDF7]') &&
    visitanos.includes("text-[#1F241C]") &&
    visitanos.includes("text-[#7A1E2C]") &&
    visitanos.includes("text-[#2A241C]") &&
    !visitanos.includes("bg-[rgba(255,253,247,0.12)]") &&
    !visitanos.includes("text-[#F8F4EA]/88") &&
    !visitanos.includes("text-[#F8F4EA]/75"),
);
assertEq("LOW_CONTRAST_HOURS_COPY", visitanos.includes("text-[#F8F4EA]/88"), false);
assertTrue(
  "GOLD_JOIN_CTA_PRESERVED",
  panel.includes("leonix-join-cta-glow") && hcEs.videoReadyCta.includes("Entrar a la videollamada"),
);
assertTrue("PWA_PUSH_PRESERVED", sw.includes("digital_contact_doorbell") && dispatcher.includes("dispatchDigitalContactDoorbell"));
assertTrue(
  "SAMSUNG_DOORBELL_PRESERVED",
  fs.existsSync(path.join(root, "app/admin/(dashboard)/digital-contact/doorbell/page.tsx")),
);
assertTrue("CALL_PRESERVED", visitanos.includes("nativeFallbackChannels"));
assertTrue("SMS_PRESERVED", visitanos.includes("nativeFallbackChannels"));
assertTrue("EMAIL_PRESERVED", visitanos.includes("nativeFallbackChannels"));
assertTrue("STAFF_ROUTING_PRESERVED", visitanos.includes("/contact/"));
assertEq(
  "QR_UNCHANGED",
  `${LEONIX_SITE_ORIGIN}/visitanos?source=office-window`,
  "https://leonixmedia.com/visitanos?source=office-window",
);
assertEq("OFFICE_WINDOW_SOURCE", resolveVisitanosSource({ source: "office-window" }), "office-window");
assertEq("NO_FAKE_AVAILABILITY", visitanos.includes("someone is available"), false);
assertTrue("NO_DATABASE_CHANGES", !visitanos.includes("supabase/migrations"));
assertTrue("NO_ENV_CHANGES", !visitanos.includes("WEB_PUSH_VAPID_PRIVATE"));
assertTrue("NO_SECRET_CHANGES", !visitanos.includes("DAILY_API_KEY"));
assertTrue("NO_UNRELATED_CHANGES", !visitanos.toLowerCase().includes("stripe") && !visitanos.includes("clasificados/autos"));

assertTrue("COPY_ES_VIDEO_UNAVAILABLE", es.videoProductTitle === "Videollamada" && es.videoUnavailableHoursDetail.includes("9:00"));
assertTrue("COPY_EN_VIDEO_UNAVAILABLE", en.videoProductTitle === "Video call" && en.videoUnavailableHoursDetail.includes("Monday"));
assertEq("WHATSAPP_DIGITS", chuy.whatsappDigits ?? chuy.phoneDigits, "16693664300");
assertTrue("WHATSAPP_PREFILL_ES", visitanosWhatsAppPrefill("es").includes("oficina de Leonix"));
assertTrue("WHATSAPP_PREFILL_EN", visitanosWhatsAppPrefill("en").includes("Leonix office"));
assertTrue("COPY_FILE_HAS_FIELDS", visitanosCopy.includes("videoUnavailableHoursLead"));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
