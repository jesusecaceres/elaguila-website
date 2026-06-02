/**
 * A5.QA-01 Autos Negocios Business Hub parity static gate.
 * Run: npm run autos:a5-qa-01-business-hub-parity-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_ROWS = [
  "Servicios Business Hub contact model inspected read-only",
  "Servicios branded social helper inspected read-only",
  "Servicios faux map inspected read-only",
  "Autos Negocios has SMS/text field or safe SMS source",
  "Autos Negocios supports LinkedIn social",
  "Autos Negocios supports X social",
  "Autos Negocios supports Snapchat social",
  "Autos Negocios supports Pinterest social",
  "Autos Negocios supports WhatsApp profile social",
  "Autos Negocios supports Google Reviews link",
  "Autos Negocios supports Yelp Reviews link",
  "Autos Negocios supports up to 3 custom links with titles",
  "Custom links show under Encuentra más sobre nosotros / Find more about us",
  "Finance/pre-approval contact still works",
  "Empty fields hide from output",
  "Contact card reflows cleanly when sections are missing",
  "Social buttons use brand colors",
  "Review links use branded treatment",
  "Location uses branded map-style panel",
  "Unsafe URLs are hidden",
  "External links open safely",
  "Application helper copy explains main inventory vehicle",
  "Application helper copy explains additional inventory vehicle",
  "Main listings appear in landing/results",
  "Additional inventory vehicles appear in landing/results",
  "Main detail shows other dealer vehicles",
  "Child detail shows main/other dealer vehicles excluding itself",
  "Inventory cards link to real detail pages",
  "Public buyer does not see owner inventory management CTAs",
  "Privado was inspected for shared CTA impact",
  "No dealership-only fields were added to Privado",
  "No unrelated categories were touched",
  "No fake ratings/reviews/socials were added",
  "No Stripe/payment logic was added",
  "npm run build passed",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function isAllowedPath(p: string): boolean {
  if (p === "package.json") return true;
  return (
    p.startsWith("app/(site)/clasificados/autos/") ||
    p.startsWith("app/(site)/publicar/autos/") ||
    p.startsWith("app/lib/clasificados/autos/") ||
    p.startsWith("scripts/autos-") ||
    p.startsWith("e2e/autos/")
  );
}

function run() {
  const mdPath = "app/lib/clasificados/autos/AUTOS_A5_QA_01_BUSINESS_HUB_PARITY_AUDIT.md";
  assert.ok(fs.existsSync(path.join(ROOT, mdPath)), "A5.QA-01 audit markdown must exist");
  const md = read(mdPath);
  for (const row of AUDIT_ROWS) {
    assert.ok(md.includes(`| ${row} |`), `Missing audit row: ${row}`);
  }

  const listingType = read("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");
  assert.ok(listingType.includes("dealerSmsPhone"), "SMS field on listing type");
  assert.ok(listingType.includes("linkedin"), "LinkedIn on dealer socials");
  assert.ok(listingType.includes('"x"'), "X on dealer socials");
  assert.ok(listingType.includes("snapchat"), "Snapchat on dealer socials");
  assert.ok(listingType.includes("pinterest"), "Pinterest on dealer socials");
  assert.ok(listingType.includes("whatsappProfile"), "WhatsApp profile on dealer socials");
  assert.ok(listingType.includes("googleReviewsUrl"), "Google reviews URL field");
  assert.ok(listingType.includes("yelpReviewsUrl"), "Yelp reviews URL field");
  assert.ok(listingType.includes("dealerCustomLinks"), "Custom links field");

  const copy = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  assert.ok(copy.includes("Encuentra más sobre nosotros"), "ES custom links section");
  assert.ok(copy.includes("Find more about us"), "EN custom links section");
  assert.ok(copy.includes("Opiniones en Google"), "ES Google reviews label");
  assert.ok(copy.includes("Google Reviews"), "EN Google reviews label");
  assert.ok(copy.includes("inventoryMainHelper"), "Main inventory helper");
  assert.ok(copy.includes("inventoryAddHelper"), "Add inventory helper");
  assert.ok(!copy.includes("+1 vehicle"), "No +1 tier copy");
  assert.ok(!copy.includes("+5 vehicle"), "No +5 tier copy");

  const mapper = read("app/(site)/clasificados/autos/negocios/lib/mapAutosDealerToBusinessHubContact.ts");
  assert.ok(mapper.includes("safeExternalHref"), "Unsafe URL filtering in mapper");
  assert.ok(mapper.includes("sms:"), "SMS CTA href in contact mapper");

  const dealerStack = read("app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx");
  assert.ok(dealerStack.includes("AutosNegociosBusinessHubFauxMap"), "Branded faux map in contact card");
  assert.ok(dealerStack.includes("autosBusinessHubSocialBrandStyle"), "Branded social styles");
  assert.ok(dealerStack.includes("AutosNegociosHubReviewLinkButton"), "Review link buttons");
  assert.ok(dealerStack.includes('rel="noopener noreferrer"'), "Safe external links");
  assert.ok(dealerStack.includes("textMessageCta"), "SMS CTA label wired");
  assert.ok(dealerStack.includes("buyerInventoryHref"), "Buyer-only inventory CTA");

  const app = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(app.includes("dealerSmsPhone"), "SMS field in application");
  assert.ok(app.includes("whatsappProfile"), "WhatsApp profile in application");
  assert.ok(app.includes("dealerCustomLinks"), "Custom links in application");

  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privadoApp.includes("googleReviewsUrl"), "No Google reviews in Privado form");
  assert.ok(!privadoApp.includes("dealerCustomLinks"), "No custom links in Privado form");
  assert.ok(!privadoApp.includes("dealerSmsPhone"), "No dealer SMS field in Privado form");

  const serviciosPath = "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx";
  const serviciosBefore = execSync(`git diff --name-only -- ${serviciosPath}`, { cwd: ROOT, encoding: "utf8" }).trim();
  assert.ok(!serviciosBefore, "Servicios files must not be modified");

  const pkg = read("package.json");
  assert.ok(pkg.includes("autos:a5-qa-01-business-hub-parity-audit"), "package script registered");

  const bad = changedFiles().filter((p) => !isAllowedPath(p) && !p.startsWith(".next/"));
  if (bad.length > 0) {
    console.warn("Warning: changed files outside Autos scope:", bad.slice(0, 20).join(", "));
  }

  console.log("autos:a5-qa-01-business-hub-parity-audit — OK");
}

run();
