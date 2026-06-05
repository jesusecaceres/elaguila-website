/**
 * Stack 9A — Ofertas Locales premium wizard UX audit.
 * Run: npm run ofertas-locales:stack-9a-wizard-ux-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_9A_WIZARD_UX_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_9A_WIZARD_UX_AUDIT.md";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const WIZARD_PROGRESS = "app/(site)/publicar/ofertas-locales/OfertasLocalesWizardProgress.tsx";
const WIZARD_STEPS = "app/lib/ofertas-locales/ofertasLocalesWizardSteps.ts";
const APP_COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const TYPES = "app/lib/ofertas-locales/ofertasLocalesTypes.ts";

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

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
  assert.ok(exists(PLAN), "Stack 9A plan must exist");
  assert.ok(exists(AUDIT_DOC), "Stack 9A audit doc must exist");

  const app = read(APP_CLIENT);
  const progress = read(WIZARD_PROGRESS);
  const steps = read(WIZARD_STEPS);
  const copy = read(APP_COPY);
  const bundle = `${app}\n${progress}\n${steps}\n${copy}`;

  assert.ok(steps.includes("OFERTAS_LOCALES_WIZARD_STEP_COUNT = 7"), "7 wizard steps defined");
  assert.ok(steps.includes('labelEs: "Oferta"'), "Spanish step label Oferta");
  assert.ok(steps.includes('labelEn: "Offer"'), "English step label Offer");
  assert.ok(steps.includes('labelEs: "Negocio"'), "Spanish Negocio");
  assert.ok(steps.includes('labelEs: "Revisar"'), "Spanish Revisar");
  assert.ok(steps.includes('labelEn: "Review"'), "English Review");

  assert.ok(app.includes("OfertasLocalesWizardProgress"), "wizard progress component");
  assert.ok(app.includes("OFERTAS_LOCALES_WIZARD_STEPS"), "wizard steps import");
  assert.ok(app.includes("Paso ${step} de"), "Spanish progress copy");
  assert.ok(app.includes("Step ${step} of"), "English progress copy");
  assert.ok(app.includes("wizardBack"), "Back navigation");
  assert.ok(app.includes("wizardNext"), "Next navigation");
  assert.ok(app.includes("goNext"), "Next handler");
  assert.ok(app.includes("goBack"), "Back handler");
  assert.ok(app.includes("case 1:") && app.includes("case 7:"), "step switch cases");

  assert.ok(app.includes("wantsAiSearchableSpecials"), "AI intent wired");
  assert.ok(app.includes("customMarketType"), "custom Otro wired");
  assert.ok(app.includes("facebookUrl"), "social fields wired");
  assert.ok(app.includes("wantsFeaturedPlacement"), "featured intent wired");
  assert.ok(!app.includes('label={lang === "en" ? "Membership CTA"'), "no editable membership CTA");
  assert.ok(!app.match(/membershipCtaLabel[\s\S]{0,80}<input/), "membershipCtaLabel not editable input");

  assert.ok(app.includes("OFERTAS_LOCALES_APPLICATION_DIGITAL_PRICING_KEYS"), "digital-only pricing");
  assert.ok(!app.includes("quarterLocalDeals"), "no print package table");
  assert.ok(!app.includes("halfGrowth"), "no print package table");

  assert.ok(!bundle.includes("googleReviewsUrl"), "no reviews");
  assert.ok(!bundle.includes("bookingUrl"), "no booking CTA");

  assert.ok(progress.includes("lg:hidden"), "mobile progress UX");
  assert.ok(progress.includes("lg:block"), "desktop progress UX");

  const changed = changedFiles();
  for (const nav of NAV_FILES) {
    assert.ok(!changed.includes(nav), `Nav must not change: ${nav}`);
  }
  assert.ok(!changed.some((f) => f.startsWith("app/admin/")), "admin untouched");
  assert.ok(!changed.some((f) => f.startsWith("app/(site)/dashboard/")), "dashboard untouched");
  assert.ok(!changed.some((f) => f.includes("clasificados/ofertas-locales")), "no public results");
  assert.ok(!changed.some((f) => f.match(/ofertas-locales\/(anuncio|resultados|results)/)), "no public detail");

  assert.ok(read(TYPES).includes("customMarketType"), "types intact");

  const pkg = read("package.json");
  assert.ok(pkg.includes('"ofertas-locales:stack-9a-wizard-ux-audit"'), "package script");

  console.log("Stack 9A — Ofertas Locales premium wizard UX audit passed.");
}

run();
