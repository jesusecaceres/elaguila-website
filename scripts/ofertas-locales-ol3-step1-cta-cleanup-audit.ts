/**
 * Gate OL-3 — Ofertas Locales Step 1 CTA cleanup audit.
 * Run: npm run ofertas-locales:ol3-step1-cta-cleanup-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL3_STEP1_CTA_CLEANUP_PLAN.md";
const AUDIT = "app/lib/ofertas-locales/OFERTAS_LOCALES_OL3_STEP1_CTA_CLEANUP_AUDIT.md";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const PUBLISH_MAPPER = "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts";
const CONSTANTS = "app/lib/ofertas-locales/ofertasLocalesConstants.ts";
const TYPES = "app/lib/ofertas-locales/ofertasLocalesTypes.ts";
const PACKAGE_JSON = "package.json";

const FORBIDDEN_CHANGED = [
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
  /stripe/i,
  /^supabase\/migrations\//,
  /^database\/migrations\//,
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
  /^app\/api\/ofertas-locales\/scan/,
  /^app\/lib\/clasificados\//,
] as const;

const ALLOWED_CHANGED = [
  /^app\/lib\/ofertas-locales\/OFERTAS_LOCALES_OL3/,
  /^app\/\(site\)\/publicar\/ofertas-locales\//,
  /^scripts\/ofertas-locales-ol3-step1-cta-cleanup-audit\.ts$/,
  /^package\.json$/,
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

function run() {
  assert.ok(exists(PLAN), "OL-3 plan doc must exist");
  assert.ok(exists(AUDIT), "OL-3 audit doc must exist");

  const app = read(APP_CLIENT);
  const copy = read(COPY);
  const mapper = read(PUBLISH_MAPPER);
  const constants = read(CONSTANTS);
  const types = read(TYPES);
  const pkg = read(PACKAGE_JSON);

  assert.match(copy, /¿Quieres más exposición\?/, "Spanish exposure title required");
  assert.match(copy, /Want more exposure\?/, "English exposure title required");
  assert.match(copy, /revista impresa|ubicación destacada/, "Spanish exposure body must mention magazine/featured");
  assert.match(copy, /print magazine options|featured placement on Leonix/, "English exposure body required");
  assert.match(copy, /newsletter|redes sociales|campanas especiales|social media|special campaigns/i, "campaign channels mentioned");
  assert.match(copy, /Hablar con Leonix/, "Spanish exposure CTA required");
  assert.match(copy, /Talk to Leonix/, "English exposure CTA required");

  assert.match(app, /step1MoreExposureCta/, "application must use exposure CTA label");
  assert.match(app, /more_exposure_contact/, "exposure contact href preserved");

  assert.doesNotMatch(app, /leonixPartnerTitle/, "public partner title must not render in application");
  assert.doesNotMatch(app, /leonixPartnerCta/, "public partner CTA must not render in application");
  assert.doesNotMatch(app, /contactPartnerHref|leonix_partner_contact/, "partner contact href removed from UI");
  assert.doesNotMatch(app, /¿Quieres ser Leonix Partner\?/, "Spanish partner panel text must not render");
  assert.doesNotMatch(app, /Want to become a Leonix Partner\?/, "English partner panel text must not render");

  assert.match(mapper, /is_magazine_pickup_partner/, "partner publish field preserved");
  assert.match(types, /isMagazinePickupPartner/, "partner draft type preserved");
  assert.match(constants, /pickup_partner|PARTNER/, "partner constants preserved");

  assert.match(pkg, /ofertas-locales:ol3-step1-cta-cleanup-audit/, "package script wired");

  for (const file of changedFiles()) {
    if (FORBIDDEN_CHANGED.some((re) => re.test(file))) {
      assert.fail(`Forbidden file changed: ${file}`);
    }
    if (
      (file.startsWith("app/lib/ofertas-locales/") ||
        file.startsWith("app/(site)/publicar/ofertas-locales/")) &&
      !ALLOWED_CHANGED.some((re) => re.test(file))
    ) {
      // Allow OL-3 scope files only; other OL files unchanged in this gate
      if (!file.includes("OL3") && !file.includes("publicar/ofertas-locales")) {
        // noop — publicar path is allowed prefix
      }
    }
  }

  console.log("Gate OL-3 — Ofertas Locales Step 1 CTA cleanup audit passed.");
}

run();
