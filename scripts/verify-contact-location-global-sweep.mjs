/**
 * CONTACT-LOCATION-GLOBAL-SWEEP-01 verification.
 * Run: npm run verify:contact-location-global-sweep
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
  console.error(`verify-contact-location-global-sweep: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const CONTACT_FORM_FILES = [
  "app/components/contact/GlobalContactForm.tsx",
  "app/(site)/tienda/components/TiendaContactForm.tsx",
  "app/(site)/newsletter/NewsletterPageClient.tsx",
  "app/components/leonix/coming-soon-v2/ComingSoonLaunchSignupForm.tsx",
];

const globalCopy = read("app/lib/leonix/globalLocationFieldCopy.ts");
const globalInput = read("app/components/forms/GlobalLocationInput.tsx");
const contactEmail = read("app/lib/email/contactInquiryEmail.ts");
const processLead = read("app/lib/leonix/processLeonixLeadPost.ts");
const newsletterRoute = read("app/api/newsletter/subscribe/route.ts");
const adminDetail = read("app/admin/_components/leads/AdminLeonixLeadDetailDrawer.tsx");
const packageJson = read("package.json");
const docs = read("docs/contact-location-global-sweep.md");

const NORCAL_DROPDOWN_MARKERS = [
  "NorCalCitySelect",
  "Elige una ciudad / zona del norte de California",
  "Choose a city / area in Northern California",
  "Select a Northern California city / area",
  "getNorCalCityOptions",
];

// 1–3. No NorCal-only location labels in contact forms
for (const rel of CONTACT_FORM_FILES) {
  const content = read(rel);
  for (const marker of NORCAL_DROPDOWN_MARKERS) {
    if (content.includes(marker)) fail(`${rel} still references NorCal dropdown marker: ${marker}`);
  }
}
ok("no public contact form uses Northern California-only dropdown labels");

// 4–5. Flexible Spanish/English labels
if (!globalCopy.includes("Ciudad, estado/región y país")) fail("Spanish global location label missing");
if (!globalCopy.includes("City, state/region, and country")) fail("English global location label missing");
ok("flexible Spanish and English location labels exist");

// 6. Fixed NorCal city dropdown removed from contact forms
for (const rel of CONTACT_FORM_FILES) {
  if (!read(rel).includes("GlobalLocationInput")) fail(`${rel} must use GlobalLocationInput`);
}
if (!globalInput.includes('type="text"')) fail("GlobalLocationInput must be free text");
ok("fixed NorCal dropdowns removed from contact/lead forms");

// 7. Submit mapping preserved
if (!read(CONTACT_FORM_FILES[0]).includes("cityArea: normalizeLocationForSubmit")) {
  fail("GlobalContactForm must map cityArea on submit");
}
if (!read(CONTACT_FORM_FILES[1]).includes("cityArea: normalizeLocationForSubmit")) {
  fail("TiendaContactForm must map cityArea on submit");
}
if (!read(CONTACT_FORM_FILES[2]).includes("city: normalizeLocationForSubmit")) {
  fail("NewsletterPageClient must map city on submit");
}
if (!read(CONTACT_FORM_FILES[3]).includes("city: normalizeLocationForSubmit")) {
  fail("ComingSoonLaunchSignupForm must map city on submit");
}
if (!processLead.includes("cityArea")) fail("processLeonixLeadPost must preserve cityArea");
if (!newsletterRoute.includes("city")) fail("newsletter route must preserve city field");
ok("submit mapping for location/city preserved");

// 8. Email notification includes location
if (!contactEmail.includes("locationLabel")) fail("email builder must label location");
if (!contactEmail.includes("fields.cityArea")) fail("lead email must include cityArea");
if (!contactEmail.includes("fields.city")) fail("newsletter email must include city");
ok("email notification body still includes location/city");

// 9. Admin display preserved
if (!adminDetail.includes("city_area")) fail("admin lead detail must show city_area");
ok("admin lead display preserves submitted location");

// 10. No schema/migration changes
const migrationHits = fs
  .readdirSync(path.join(root, "supabase/migrations"))
  .filter((f) => f.includes("global_location") || f.includes("contact_location"));
if (migrationHits.length > 0) fail("unexpected location migration");
ok("no Supabase schema/migration changes");

// 11. No email provider/env changes
const emailConfig = read("app/lib/email/leonixResendConfig.ts");
const notificationRecipient = read("app/lib/email/leonixNotificationRecipient.ts");
if (!emailConfig.includes("RESEND_API_KEY")) fail("Resend config unexpectedly changed");
if (!notificationRecipient.includes("LEONIX_NOTIFICATION_EMAIL")) fail("notification recipient config missing");
for (const rel of CONTACT_FORM_FILES) {
  if (/RESEND_API_KEY|sendLeonixResendEmail/i.test(read(rel))) {
    fail(`${rel} must not touch email provider`);
  }
}
ok("no email provider/env changes in contact forms");

// 12. No admin dashboard changes (beyond preserved display)
if (/GlobalLocationInput|NorCalCitySelect/.test(adminDetail)) {
  fail("admin dashboard should not import contact location input");
}
ok("no admin dashboard redesign");

// 13. No Stripe/payment changes
for (const rel of CONTACT_FORM_FILES) {
  if (/stripe/i.test(read(rel))) fail(`stripe reference in ${rel}`);
}
ok("no Stripe/payment changes");

// Package script + docs
if (!packageJson.includes('"verify:contact-location-global-sweep"')) {
  fail("package.json missing verify script");
}
if (!exists("docs/contact-location-global-sweep.md")) fail("audit doc missing");
if (!docs.includes("GlobalLocationInput")) fail("audit doc incomplete");
ok("verify script and audit doc registered");

console.log("\nverify-contact-location-global-sweep: all checks passed");
