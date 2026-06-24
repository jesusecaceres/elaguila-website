/**
 * COMING-SOON-EMAIL-ALERTS-01 verification.
 * Run: npm run verify:coming-soon-email-alerts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function fail(msg) {
  console.error(`verify-coming-soon-email-alerts: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const leadsRoute = read("app/api/leads/route.ts");
const processLead = read("app/lib/leonix/processLeonixLeadPost.ts");
const newsletterRoute = read("app/api/newsletter/subscribe/route.ts");
const mediaKitRoute = read("app/api/media-kit/request/route.ts");
const sendEmail = read("app/lib/email/sendLeonixResendEmail.ts");
const resendConfig = read("app/lib/email/leonixResendConfig.ts");
const notificationRecipient = read("app/lib/email/leonixNotificationRecipient.ts");
const contactEmail = read("app/lib/email/contactInquiryEmail.ts");
const internalUrls = read("app/lib/email/leonixInternalNotificationUrls.ts");
const packageJson = read("package.json");
const docs = read("docs/coming-soon-email-alerts.md");

// 1. Lead form save path
if (!leadsRoute.includes("processLeonixLeadPost")) fail("lead save path missing");
if (!processLead.includes("saveLeonixLead")) fail("processLeonixLeadPost must save to Supabase");
ok("Coming Soon / lead form save path exists");

// 2. Newsletter save path
if (!newsletterRoute.includes("saveNewsletterSubscriber")) fail("newsletter save path missing");
ok("newsletter save path exists");

// 3. Media kit save path
if (!mediaKitRoute.includes("saveMediaKitLead")) fail("media kit save path missing");
ok("media kit save path exists");

// 4. Promo/print quote uses shared lead pipeline
if (!processLead.includes("promo_quote") && !contactEmail.includes("promo_quote")) {
  if (!contactEmail.includes("promotionalProducts")) fail("promo lead email path missing");
}
if (!contactEmail.includes("New Leonix promotional quote lead")) {
  fail("promo notification subject missing");
}
ok("promo/print quote save + notification path exists");

// 5. Server-only email utility / Resend
if (!sendEmail.includes("api.resend.com/emails")) fail("Resend sender missing");
if (!resendConfig.includes("RESEND_API_KEY")) fail("RESEND_API_KEY must be referenced server-side");
ok("server-only Resend email utility exists");

// 6. Notification recipient env or info@ fallback
if (!notificationRecipient.includes("LEONIX_NOTIFICATION_EMAIL")) {
  fail("LEONIX_NOTIFICATION_EMAIL not supported");
}
if (!notificationRecipient.includes("info@leonixmedia.com")) fail("info@leonixmedia.com fallback missing");
ok("notification recipient uses env var with info@ fallback");

// 7. API key not exposed to client
const clientPaths = [
  "app/(site)/lib/submitContactForm.ts",
  "app/(site)/lib/submitLaunchSignupForm.ts",
];
for (const rel of clientPaths) {
  const content = read(rel);
  if (/RESEND_API_KEY|api\.resend\.com/i.test(content)) {
    fail(`email secret exposed in client file ${rel}`);
  }
}
ok("email API key is server-only");

// 8. Email only after successful Supabase insert
if (!processLead.includes("if (saved && emailConfigured")) fail("leads must email after saved");
if (!newsletterRoute.includes("if (saved && !updated && emailConfigured")) {
  fail("newsletter must email after new save only");
}
if (!mediaKitRoute.includes("saveMediaKitLead")) fail("media kit must save first");
if (!mediaKitRoute.includes("buildMediaKitLeadEmail")) fail("media kit email must follow save");
const mediaKitSaveIdx = mediaKitRoute.indexOf("await saveMediaKitLead");
const mediaKitEmailIdx = mediaKitRoute.indexOf("await sendLeonixResendEmail");
if (mediaKitSaveIdx < 0 || mediaKitEmailIdx < mediaKitSaveIdx) fail("media kit email must run after save");
ok("emails sent only after successful Supabase insert");

// 9. Email failure does not break successful lead save
if (!processLead.includes("saved && !emailSent")) fail("leads must succeed when email fails");
if (!processLead.includes("ok: true")) fail("leads must return ok on saved-without-email");
if (!mediaKitRoute.includes("emailSent")) fail("media kit must report emailSent separately");
if (!mediaKitRoute.includes('ok: true')) fail("media kit must return ok when save succeeds");
ok("email failure does not break successful lead save");

// 10–13. Admin links in notification bodies
if (!contactEmail.includes("leonixAdminLeadInboxUrl")) fail("general admin inbox link helper missing");
if (!internalUrls.includes("view=promo")) fail("promo admin inbox URL missing");
if (!contactEmail.includes("leonixAdminPromoInboxUrl")) fail("promo admin link not used in email builder");
if (!contactEmail.includes("leonixAdminNewsletterInboxUrl")) fail("newsletter admin link missing");
if (!contactEmail.includes("leonixAdminMediaKitInboxUrl")) fail("media kit admin link missing");
if (!contactEmail.includes("New Leonix newsletter signup")) fail("newsletter subject missing");
if (!contactEmail.includes("New Leonix lead from Coming Soon")) fail("coming soon lead subject missing");
if (!contactEmail.includes("New Leonix media kit request")) fail("media kit subject missing");
ok("notification bodies include admin links and required subjects");

// 14. No public page redesign
const comingSoonShell = read("app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx");
if (/RESEND_API_KEY|sendLeonixResendEmail/i.test(comingSoonShell)) {
  fail("coming soon shell must not send email directly");
}
ok("no public page redesign for email");

// 15. No schema/migration changes for this gate
const migrationHits = fs
  .readdirSync(path.join(root, "supabase/migrations"))
  .filter((f) => f.includes("coming_soon_email") || f.includes("email_alert"));
if (migrationHits.length > 0) fail("unexpected email alert migration");
ok("no schema/migration changes");

// 16. No Stripe/payment changes
for (const rel of [
  "app/lib/leonix/processLeonixLeadPost.ts",
  "app/api/newsletter/subscribe/route.ts",
  "app/api/media-kit/request/route.ts",
]) {
  if (/stripe/i.test(read(rel))) fail(`unexpected stripe reference in ${rel}`);
}
ok("no Stripe/payment changes");

// 17. No category queue changes
if (/classifieds.*queue|review.queue/i.test(processLead)) fail("unexpected category queue changes");
ok("no category queue changes");

// 18. Package script
if (!packageJson.includes('"verify:coming-soon-email-alerts"')) {
  fail("package.json missing verify:coming-soon-email-alerts script");
}
ok("package script registered");

// Docs
if (!exists("docs/coming-soon-email-alerts.md")) fail("docs missing");
if (!docs.includes("RESEND_API_KEY")) fail("docs must mention RESEND_API_KEY");
if (!docs.includes("info@leonixmedia.com")) fail("docs must mention recipient");
ok("docs exist");

// Recipient wired in routes
if (!processLead.includes("resolveLeonixNotificationEmail")) fail("leads route must use notification recipient");
if (!newsletterRoute.includes("resolveLeonixNotificationEmail")) fail("newsletter route must use notification recipient");
if (!mediaKitRoute.includes("resolveLeonixNotificationEmail")) fail("media kit route must use notification recipient");
ok("notification recipient wired in all lead routes");

// LEONIX_EMAIL_FROM supported
if (!resendConfig.includes("LEONIX_EMAIL_FROM")) fail("LEONIX_EMAIL_FROM must be supported");
ok("LEONIX_EMAIL_FROM supported in Resend config");

console.log("\nverify-coming-soon-email-alerts: all checks passed");
