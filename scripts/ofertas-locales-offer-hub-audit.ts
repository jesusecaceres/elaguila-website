/**
 * Offer Hub + Flyer/Coupon Lane Cleanup + Final Review Foundation audit.
 * Run: npm run ofertas-locales:offer-hub-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_DOC = "docs/ofertas-locales-offer-hub-audit.md";
const TYPES = "app/lib/ofertas-locales/ofertasLocalesTypes.ts";
const FACTORY = "app/lib/ofertas-locales/createEmptyOfertaLocalDraft.ts";
const PERSISTENCE = "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts";
const HELPERS = "app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts";
const PUBLISH_MAPPER = "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const APP_COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const PREVIEW_CARD = "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx";
const PREVIEW_COPY = "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts";

const SOCIAL_FIELDS = [
  "facebookUrl",
  "instagramUrl",
  "tiktokUrl",
  "youtubeUrl",
  "xTwitterUrl",
  "linkedinUrl",
  "snapchatUrl",
  "pinterestUrl",
  "googleBusinessUrl",
  "googleReviewUrl",
  "yelpUrl",
  "email",
] as const;

const STRIPE_PATH_FRAGMENTS = ["stripe", "payment", "checkout"] as const;

const REQUIRED_AUDIT_ROWS = [
  "Weekly flyer lane is separate from coupon/promotion lane",
  "Coupon/promotion lane still exists",
  "Flyer lane no longer pushes coupon upload clutter as a core step",
  "Email is supported or honestly documented if not possible without DB changes",
  "Facebook supported",
  "Instagram supported",
  "TikTok supported",
  "YouTube supported",
  "X/Twitter supported",
  "LinkedIn supported",
  "Snapchat supported",
  "Pinterest supported",
  "Google Business supported",
  "Google Reviews supported",
  "Yelp supported",
  "Empty social fields are hidden",
  "Raw URLs are not shown publicly",
  "Phone opens tel:",
  "WhatsApp opens direct WhatsApp/browser link",
  "Website opens direct",
  "Directions opens direct",
  "Email opens/copies if present",
  "No fake ratings/reviews added",
  "No fake verified badge added",
  "No fake save/list feature added",
  'Trust cue uses "Published on Leonix / Publicado en Leonix"',
  "Step 7 shows pricing/plan summary",
  "Step 7 shows AI summary only if AI selected/scanned",
  "Rescan is not a confusing primary action after scan exists",
  "Preview CTA is gated by confirmations",
  "Submit remains blocked if AI review is incomplete",
  "Hard refresh persistence preserved",
  "Old drafts hydrate safely",
  "Spanish/English copy exists",
  "Mobile layout remains usable",
  "No unrelated categories changed",
  "No Supabase migration added",
  "No Stripe/payment files touched",
  "npm run build passed",
] as const;

const UNRELATED_CATEGORY_PREFIXES = [
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/clasificados/servicios/",
  "app/(site)/clasificados/autos/",
  "app/(site)/clasificados/rentas/",
  "app/(site)/clasificados/bienes-raices/",
  "app/(site)/clasificados/empleos/",
  "app/(site)/clasificados/en-venta/",
  "app/(site)/publicar/restaurantes/",
  "app/(site)/publicar/servicios/",
  "app/(site)/publicar/autos/",
  "app/(site)/publicar/rentas/",
  "app/(site)/publicar/bienes-raices/",
  "app/(site)/publicar/empleos/",
  "app/(site)/publicar/en-venta/",
] as const;

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function changedFiles(): string[] {
  let tracked: string[] = [];
  let untracked: string[] = [];
  try {
    tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    tracked = [];
  }
  try {
    untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    untracked = [];
  }
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function assertNoForbiddenScopeChanges(files: string[]) {
  assertNoUnrelatedCategories(files);
  assertNoMigrationChanges(files);
  assertNoStripePaymentChanges(files);
}

function assertNoUnrelatedCategories(files: string[]) {
  for (const file of files) {
    const normalized = file.replace(/\\/g, "/");
    for (const prefix of UNRELATED_CATEGORY_PREFIXES) {
      assert.ok(!normalized.startsWith(prefix), `Unrelated category changed: ${normalized}`);
    }
  }
}

function assertNoMigrationChanges(files: string[]) {
  for (const file of files) {
    assert.ok(!file.startsWith("supabase/migrations/"), `Supabase migration changed: ${file}`);
  }
}

function assertNoStripePaymentChanges(files: string[]) {
  for (const file of files) {
    const lower = file.toLowerCase();
    for (const frag of STRIPE_PATH_FRAGMENTS) {
      assert.ok(!lower.includes(frag), `Stripe/payment file changed: ${file}`);
    }
  }
}

function parseAuditTable(doc: string): Map<string, boolean> {
  const rows = new Map<string, boolean>();
  const lines = doc.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\|\s*(.+?)\s*\|\s*(TRUE|FALSE)\s*\|/);
    if (!match) continue;
    rows.set(match[1].trim(), match[2] === "TRUE");
  }
  return rows;
}

function run() {
  assert.ok(exists(AUDIT_DOC), `Audit doc must exist: ${AUDIT_DOC}`);

  const auditDoc = read(AUDIT_DOC);
  const types = read(TYPES);
  const factory = read(FACTORY);
  const persistence = read(PERSISTENCE);
  const helpers = read(HELPERS);
  const mapper = read(PUBLISH_MAPPER);
  const app = read(APP_CLIENT);
  const appCopy = read(APP_COPY);
  const preview = read(PREVIEW_CARD);
  const previewCopy = read(PREVIEW_COPY);
  const bundle = `${types}\n${factory}\n${persistence}\n${helpers}\n${mapper}\n${app}\n${appCopy}\n${preview}\n${previewCopy}`;

  for (const row of REQUIRED_AUDIT_ROWS) {
    assert.ok(auditDoc.includes(row), `Audit doc missing row: ${row}`);
  }

  const table = parseAuditTable(auditDoc);
  for (const row of REQUIRED_AUDIT_ROWS) {
    assert.ok(table.has(row), `Audit table missing parsed row: ${row}`);
  }

  for (const field of SOCIAL_FIELDS) {
    assert.ok(types.includes(field), `types: ${field}`);
    assert.ok(factory.includes(field), `factory: ${field}`);
    assert.ok(persistence.includes(field), `persistence: ${field}`);
  }

  assert.ok(helpers.includes("xTwitter"), "helpers: xTwitter key");
  assert.ok(helpers.includes("linkedin"), "helpers: linkedin key");
  assert.ok(helpers.includes("snapchat"), "helpers: snapchat key");
  assert.ok(helpers.includes("pinterest"), "helpers: pinterest key");
  assert.ok(mapper.includes("contactEmail"), "publish mapper: contactEmail metadata");
  assert.ok(mapper.includes("xTwitterUrl"), "publish mapper: xTwitterUrl");

  assert.ok(app.includes("xTwitterUrl"), "application: xTwitterUrl field");
  assert.ok(app.includes("step7Confirmations"), "application: step7 confirmations");
  assert.ok(app.includes("step7ConfirmationsComplete"), "application: preview gating");
  assert.ok(!app.includes("Want to add coupons or extra files?"), "flyer lane coupon clutter removed");

  assert.ok(appCopy.includes("Conecta tu negocio"), "copy ES: offer hub title");
  assert.ok(appCopy.includes("Connect your business"), "copy EN: offer hub title");
  assert.ok(appCopy.includes("Confirmo"), "copy ES: confirmation");
  assert.ok(appCopy.includes("I confirm"), "copy EN: confirmation");
  assert.ok(appCopy.includes("X / Twitter"), "copy: X / Twitter label");
  assert.ok(appCopy.includes("LinkedIn"), "copy: LinkedIn label");
  assert.ok(appCopy.includes("Snapchat"), "copy: Snapchat label");
  assert.ok(appCopy.includes("Pinterest"), "copy: Pinterest label");

  assert.ok(previewCopy.includes("Publicado en Leonix"), "preview copy ES: trust cue");
  assert.ok(previewCopy.includes("Published on Leonix"), "preview copy EN: trust cue");
  assert.ok(preview.includes("getOfertaLocalSocialLinksByCategory"), "preview: categorized social");
  assert.ok(preview.includes("EmailContactRow"), "preview: email row");
  assert.ok(!preview.includes('href={link.url}') || preview.includes("SocialPill"), "preview uses labeled social pills");

  assert.ok(bundle.includes("localStorage") || bundle.includes("saveOfertaLocalDraftToStorage"), "persistence path present");

  const pkg = read("package.json");
  assert.ok(pkg.includes("ofertas-locales:offer-hub-audit"), "package.json script registered");

  const changed = changedFiles();
  assertNoForbiddenScopeChanges(changed);

  console.log("ofertas-locales-offer-hub-audit: PASS");
  console.log(`Changed files checked: ${changed.length}`);
}

run();
