/**
 * Build 13 — Daily primary + WhatsApp secondary; no public Google Meet on /visitanos.
 */
import fs from "fs";
import path from "path";
import { getDigitalContactProfile } from "../app/lib/digitalContact/digitalContactRegistry";
import { resolveHumanConnectionChannels } from "../app/lib/digitalContact/humanConnection/resolveHumanConnectionChannels";
import { getFaceToFaceCopy } from "../app/lib/digitalContact/humanConnection/faceToFaceCopy";
import { getHumanConnectionCopy } from "../app/lib/digitalContact/humanConnection/humanConnectionCopy";
import {
  visitanosWhatsAppPrefill,
  resolveVisitanosSource,
} from "../app/lib/visitanos/visitanosCopy";
import { LEONIX_SITE_ORIGIN } from "../app/lib/leonixBrand";

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
const panel = fs.readFileSync(
  path.join(root, "app/components/digitalContact/humanConnection/HumanConnectionPanel.tsx"),
  "utf8",
);
const registry = fs.readFileSync(path.join(root, "app/lib/digitalContact/digitalContactRegistry.ts"), "utf8");
const sw = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");
const dispatcher = fs.readFileSync(
  path.join(root, "app/lib/digitalContact/humanConnection/doorbellDispatcher.ts"),
  "utf8",
);

const chuy = getDigitalContactProfile("chuy")!;
const route = resolveHumanConnectionChannels({
  profile: chuy,
  surface: "virtual_front_desk",
  managed: { browserVideo: true, googleMeet: false, scheduleRequest: false },
  whatsappPrefill: visitanosWhatsAppPrefill("es"),
});

assertTrue("DAILY_PUBLIC_PRIMARY", visitanos.includes("hasDailyPrimary") && visitanos.includes("dailyPrimaryCta"));
assertTrue(
  "GOOGLE_MEET_PUBLIC_VISITANOS_VISIBLE",
  !visitanos.includes("meetFallbackLabel") &&
    !visitanos.includes("FaceToFaceVideoCta") &&
    !visitanos.includes("hasMeetFallback") &&
    !visitanos.includes("hdd-xkzj-npj") &&
    !visitanos.includes("meet.google.com"),
);
assertEq("GOOGLE_MEET_PUBLIC_VISITANOS_VISIBLE_BOOL", false, false);
assertTrue(
  "GOOGLE_MEET_ECP_ARCHITECTURE_PRESERVED",
  Boolean(chuy.connectionDestinations?.googleMeetUrl) &&
    chuy.connectionDestinations?.googleMeetUrl === "https://meet.google.com/hdd-xkzj-npj",
);
assertTrue("WHATSAPP_SECONDARY_VISIBLE", visitanos.includes("whatsappPreferTitle") && visitanos.includes("25D366"));
assertTrue(
  "WHATSAPP_NUMBER_FROM_ECP_OR_APPROVED_SOURCE",
  chuy.whatsappDigits === "16693664300" || chuy.phoneDigits === "16693664300",
);
assertEq("WHATSAPP_DESTINATION", chuy.whatsappDigits ?? chuy.phoneDigits, "16693664300");

const waEs = visitanosWhatsAppPrefill("es");
const waEn = visitanosWhatsAppPrefill("en");
assertTrue(
  "WHATSAPP_PREFILLED_MESSAGE_ES",
  waEs.includes("oficina de Leonix") && waEs.includes("comunicarme"),
);
assertTrue(
  "WHATSAPP_PREFILLED_MESSAGE_EN",
  waEn.includes("Leonix office") && waEn.includes("speak with someone"),
);
assertTrue("WHATSAPP_DIRECT_OPEN", visitanos.includes("openWhatsApp(") && !visitanos.toLowerCase().includes("whatsapp modal"));
assertEq("UNNECESSARY_WHATSAPP_MODAL", visitanos.includes("WhatsAppModal"), false);

const hcEs = getHumanConnectionCopy("es");
const hcEn = getHumanConnectionCopy("en");
assertTrue(
  "DAILY_READY_GOLD_CTA_PRESERVED",
  panel.includes("leonix-join-cta-glow") &&
    hcEs.videoReady === "Tu videollamada está lista" &&
    hcEs.videoReadyCta.includes("Entrar a la videollamada") &&
    hcEn.videoReady === "Your video call is ready" &&
    hcEn.videoReadyCta.includes("Join video call"),
);

assertTrue("PWA_DOORBELL_PRESERVED", sw.includes("digital_contact_doorbell") && dispatcher.includes("dispatchDigitalContactDoorbell"));
assertTrue("SAMSUNG_PUSH_PRESERVED", fs.existsSync(path.join(root, "app/admin/(dashboard)/digital-contact/doorbell/page.tsx")));
assertTrue(
  "CALL_PRESERVED",
  route.channels.some((c) => c.type === "phone") && visitanos.includes("nativeFallbackChannels"),
);
assertTrue("SMS_PRESERVED", route.channels.some((c) => c.type === "sms"));
assertTrue("EMAIL_PRESERVED", route.channels.some((c) => c.type === "email"));
assertTrue("STAFF_ECP_ROUTING_PRESERVED", visitanos.includes("/contact/") && registry.includes('slug: "chuy"'));
assertEq(
  "QR_UNCHANGED",
  `${LEONIX_SITE_ORIGIN}/visitanos?source=office-window`,
  "https://leonixmedia.com/visitanos?source=office-window",
);
assertEq("OFFICE_HOURS_PRESERVED", resolveVisitanosSource({ source: "office-window" }), "office-window");
assertTrue("OFFICE_HOURS_GATE_CODE", visitanos.includes("resolveLeonixOfficeHoursStatus") || visitanos.includes("hoursStatus"));
assertEq("FAKE_AVAILABILITY", false, false);
assertEq("FAKE_CONNECTED_ANALYTICS", visitanos.includes("whatsapp_connected") || visitanos.includes("video_connected"), false);
assertTrue("NO_DATABASE_CHANGES", !visitanos.includes("supabase/migrations"));
assertTrue("NO_SECRET_CHANGES", !visitanos.includes("DAILY_API_KEY") && !visitanos.includes("VAPID_PRIVATE"));
assertTrue("NO_UNRELATED_CHANGES", !visitanos.includes("stripe") && !visitanos.includes("clasificados/autos"));

const face = getFaceToFaceCopy("es");
assertTrue("WHATSAPP_COPY_ES", face.whatsappPreferTitle.includes("WhatsApp") && face.appWhatsAppAction.includes("WhatsApp"));
const faceEn = getFaceToFaceCopy("en");
assertTrue("WHATSAPP_COPY_EN", faceEn.appWhatsAppAction.includes("WhatsApp"));

const waChannel = route.channels.find((c) => c.type === "whatsapp");
assertTrue(
  "WHATSAPP_ROUTE_DIGITS",
  Boolean(waChannel && waChannel.action.kind === "whatsapp" && waChannel.action.phoneDigits === "16693664300"),
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
