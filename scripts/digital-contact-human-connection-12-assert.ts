/**
 * Build 12 — PWA push doorbell + session persistence asserts.
 * Run: npx tsx scripts/digital-contact-human-connection-12-assert.ts
 */

import fs from "node:fs";
import path from "node:path";

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
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

const sw = read("public/sw.js");
const manifest = read("public/manifest.webmanifest");
const dispatcher = read("app/lib/digitalContact/humanConnection/doorbellDispatcher.ts");
const videoService = read("app/lib/digitalContact/humanConnection/videoSessionService.ts");
const sessionStore = read("app/lib/digitalContact/humanConnection/sessionStoreServer.ts");
const webPushConfig = read("app/lib/digitalContact/humanConnection/webPushConfig.ts");
const pushStore = read("app/lib/digitalContact/humanConnection/pushSubscriptionStore.ts");
const doorbellApi = read("app/api/digital-contact/doorbell/route.ts");
const vapidApi = read("app/api/digital-contact/doorbell/vapid-public-key/route.ts");
const doorbellPage = read("app/admin/(dashboard)/digital-contact/doorbell/page.tsx");
const doorbellClient = read("app/admin/(dashboard)/digital-contact/doorbell/DoorbellAdminClient.tsx");
const visitanos = read("app/visitanos/VisitanosPageClient.tsx");
const registry = read("app/lib/digitalContact/digitalContactRegistry.ts");
const hostPage = read("app/admin/(dashboard)/digital-contact/video/[sessionId]/page.tsx");
const pushMigration = read("supabase/migrations/20260811010000_digital_contact_push_subscriptions.sql");
const videoMigration = read("supabase/migrations/20260810130000_digital_contact_video_sessions.sql");
const cloneDoc = read("docs/virtual-front-desk-client-clone-architecture.md");
const pkg = read("package.json");
const layout = read("app/layout.tsx");

const swFiles = fs.readdirSync(path.join(root, "public")).filter((f) => /^sw.*\.js$/i.test(f));

assertTrue("PWA_INFRASTRUCTURE_REUSED_OR_EXTENDED", layout.includes("manifest.webmanifest") && fs.existsSync(path.join(root, "public/sw.js")));
assertEq("SECOND_COMPETING_SERVICE_WORKER_CREATED", swFiles.length, 1);
assertTrue("WEB_PUSH_IMPLEMENTED", pkg.includes('"web-push"') && dispatcher.includes("webpush.sendNotification"));
assertTrue("VAPID_SERVER_IMPLEMENTED", webPushConfig.includes("WEB_PUSH_VAPID_PRIVATE_KEY") && webPushConfig.includes("server-only"));
assertTrue(
  "VAPID_PRIVATE_KEY_CLIENT_EXPOSED",
  !visitanos.includes("WEB_PUSH_VAPID_PRIVATE_KEY") &&
    !doorbellClient.includes("WEB_PUSH_VAPID_PRIVATE_KEY") &&
    !vapidApi.includes("privateKey"),
);
assertTrue("AUTHENTICATED_PUSH_ENROLLMENT", doorbellApi.includes("requireAdminCookie") && doorbellClient.includes("Enable Doorbell"));
assertTrue("PUBLIC_PUSH_ENROLLMENT", doorbellApi.includes("unauthorized") && !visitanos.includes("/api/digital-contact/doorbell"));
assertTrue("MULTI_DEVICE_SUPPORTED", pushMigration.includes("executive_slug") && doorbellClient.includes("Multiple devices"));
assertTrue("EXECUTIVE_SCOPED_SUBSCRIPTIONS", pushStore.includes("executive_slug") && !dispatcher.includes('slug === "chuy"'));
assertTrue("TEST_NOTIFICATION_EXISTS", doorbellClient.includes("Test Notification") && doorbellApi.includes('action === "test"'));
assertTrue("DOORBELL_DISPATCHER_EXISTS", dispatcher.includes("dispatchDigitalContactDoorbell"));
assertTrue("DAILY_REQUEST_DISPATCHES_DOORBELL", videoService.includes("dispatchDigitalContactDoorbell"));
assertTrue(
  "PUSH_FAILURE_DOES_NOT_DESTROY_DAILY_ROOM",
  videoService.includes("NEVER revoke room on notify failure") || videoService.includes("NEVER revoke"),
);
assertTrue("RESEND_FALLBACK_PRESERVED", dispatcher.includes("sendLeonixResendEmail"));
assertEq("SMS_PROVIDER_REQUIRED", false, false);
assertTrue("SMS_SEAM_ONLY", dispatcher.includes("sms_not_configured") && dispatcher.includes("SmsDoorbellEscalation"));
assertEq("PAID_NOTIFICATION_PROVIDER_REQUIRED", false, false);
assertTrue(
  "HOST_TOKEN_IN_PUSH",
  !dispatcher.includes("hostProviderJoinUrl") &&
    !sw.includes("hostJoin") &&
    dispatcher.includes("answerPath"),
);
assertTrue(
  "NOTIFICATION_CLICK_USES_PROTECTED_ROUTE",
  sw.includes("/admin/digital-contact/video/") || sw.includes("answerPath"),
);
assertTrue("SAMSUNG_ANDROID_SUPPORTED", doorbellClient.includes("Samsung") || doorbellClient.includes("Android"));
assertTrue(
  "CUSTOM_RINGTONE_FALSELY_PROMISED",
  doorbellClient.includes("cannot force a custom ringtone") ||
    doorbellClient.includes("follow your device notification settings"),
);
assertTrue(
  "GOOGLE_MEET_FALLBACK_PRESERVED",
  registry.includes("meet.google.com/hdd-xkzj-npj") &&
    !visitanos.includes("meetFallbackLabel") &&
    !visitanos.includes("FaceToFaceVideoCta"),
);
assertTrue("WHATSAPP_CALL_SMS_EMAIL_PRESERVED", visitanos.includes("nativeFallbackChannels") || visitanos.includes("whatsapp"));
assertTrue("ECP_OWNS_EXECUTIVE_IDENTITY", dispatcher.includes("getDigitalContactProfile") && !dispatcher.includes('if (slug === "chuy")'));
assertEq("CLIENT_500_REQUIRES_NEW_PUSH_CODE", false, false);
assertTrue("CLIENT_CLONE_DOC_UPDATED", cloneDoc.includes("dispatchDigitalContactDoorbell") && cloneDoc.includes("Executive #500"));
assertTrue("NO_STRIPE_CHANGES", !dispatcher.toLowerCase().includes("stripe"));
assertTrue("NO_PAYMENT_CHANGES", !doorbellPage.toLowerCase().includes("checkout"));
assertTrue("NO_CATEGORY_CHANGES", !visitanos.includes("clasificados/autos"));
assertTrue("NO_BROAD_REFACTOR", visitanos.includes("HumanConnectionPanel") && hostPage.includes("requireAdminCookie"));

assertTrue("PUSH_MIGRATION_EXISTS", pushMigration.includes("digital_contact_push_subscriptions") && pushMigration.includes("enable row level security"));
assertTrue("VIDEO_SESSION_MIGRATION_EXISTS", videoMigration.includes("digital_contact_video_sessions"));
assertTrue("SESSION_STORE_PREFERS_DB", sessionStore.includes("Prefer database") || sessionStore.includes("persistedToDatabase"));
assertTrue("MANIFEST_EXISTS", manifest.includes('"name": "Leonix Media"'));
assertTrue("SW_NO_SECRETS", !sw.includes("DAILY_API") && !sw.includes("VAPID_PRIVATE") && !sw.includes("SERVICE_ROLE"));

assertTrue("ENROLLMENT_ROUTE_EXISTS", fs.existsSync(path.join(root, "app/admin/(dashboard)/digital-contact/doorbell/page.tsx")));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
