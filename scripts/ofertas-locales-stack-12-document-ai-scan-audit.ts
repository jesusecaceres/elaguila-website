/**
 * Stack 12 — Ofertas Locales Document AI scan audit.
 * Run: npm run ofertas-locales:stack-12-document-ai-scan-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_12_DOCUMENT_AI_SCAN_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_12_DOCUMENT_AI_SCAN_AUDIT.md";
const CONFIG = "app/lib/ofertas-locales/ofertasLocalesDocumentAiConfig.ts";
const CLIENT = "app/lib/ofertas-locales/ofertasLocalesDocumentAiClient.ts";
const NORMALIZER = "app/lib/ofertas-locales/ofertasLocalesAiNormalizer.ts";
const READINESS = "app/lib/ofertas-locales/ofertasLocalesAiScanReadiness.ts";
const SCAN_ROUTE = "app/api/ofertas-locales/scan/route.ts";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const SCAN_PANEL = "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

const STACK12_CHANGED_PATTERNS = [
  /^app\/lib\/ofertas-locales\//,
  /^app\/\(site\)\/publicar\/ofertas-locales\//,
  /^app\/api\/ofertas-locales\/scan\//,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^scripts\/ofertas-locales-stack-12-document-ai-scan-audit\.ts$/,
] as const;

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function isStack12ChangedFile(file: string): boolean {
  return STACK12_CHANGED_PATTERNS.some((re) => re.test(file));
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
  assert.ok(exists(PLAN), "Stack 12 plan must exist");
  assert.ok(exists(AUDIT_DOC), "Stack 12 audit doc must exist");
  assert.ok(exists(CONFIG), "Document AI config helper must exist");
  assert.ok(exists(CLIENT), "Document AI client must exist");
  assert.ok(exists(NORMALIZER), "Normalizer placeholder must exist");
  assert.ok(exists(READINESS), "Scan readiness helper must exist");
  assert.ok(exists(SCAN_ROUTE), "Scan API route must exist");

  const config = read(CONFIG);
  const client = read(CLIENT);
  const normalizer = read(NORMALIZER);
  const readinessFile = read(READINESS);
  const route = read(SCAN_ROUTE);
  const panel = read(SCAN_PANEL);
  const copy = read(COPY);
  const app = read(APP_CLIENT);
  const pkg = read("package.json");

  for (const key of [
    "GOOGLE_DOCUMENT_AI_CREDENTIALS_JSON",
    "GOOGLE_DOCUMENT_AI_PROJECT_ID",
    "GOOGLE_DOCUMENT_AI_PROCESSOR_LOCATION",
    "GOOGLE_DOCUMENT_AI_OCR_PROCESSOR_ID",
  ]) {
    assert.ok(config.includes(key), `config uses ${key}`);
  }

  assert.ok(!config.includes("GOOGLE_APPLICATION_CREDENTIALS_JSON"), "no translation cred env");
  assert.ok(!config.includes("GOOGLE_CLOUD_PROJECT_ID"), "no translation project env");
  assert.ok(config.includes('import "server-only"'), "config is server-only");
  assert.ok(client.includes('import "server-only"'), "client is server-only");
  assert.ok(client.includes("processOfertaLocalAssetWithDocumentAi"), "Document AI processor export");
  assert.ok(client.includes("@google-cloud/documentai"), "uses Document AI SDK");

  assert.ok(readinessFile.includes("getOfertaLocalAiScanReadiness"), "readiness helper");
  assert.ok(normalizer.includes("normalizeDocumentAiResultToOfertaLocalItems"), "normalizer export");
  assert.ok(normalizer.includes('reviewStatus: lowConfidence') || normalizer.includes('"needs_review"'), "needs_review default path");
  assert.ok(normalizer.includes("isActive: false"), "inactive candidates");

  assert.ok(route.includes("getBearerUserId"), "scan route requires auth");
  assert.ok(route.includes("isOfertaLocalDocumentAiConfigured"), "config check");
  assert.ok(route.includes("google_document_ai"), "Google Document AI provider");
  assert.ok(route.includes("is_active: false"), "items not active");
  assert.ok(!route.includes("review_status: \"approved\""), "no auto-approve");
  assert.ok(!route.includes("GOOGLE_DOCUMENT_AI_CREDENTIALS_JSON"), "no credential env in route response");
  assert.ok(!route.includes("credentials"), "no credentials in route output");

  assert.ok(panel.includes("Escanear con AI") || copy.includes("Escanear con AI"), "ES scan button");
  assert.ok(panel.includes("Scan with AI") || copy.includes("Scan with AI"), "EN scan button");
  assert.ok(
    copy.includes("revisarse antes de publicarse") || copy.includes("reviewed before they can be published"),
    "review-before-publish copy"
  );
  assert.ok(app.includes("OfertasLocalesAiScanPanel"), "app uses scan panel");

  assert.ok(!exists("app/api/ofertas-locales/items"), "no items API route");
  assert.ok(!pkg.includes("NEXT_PUBLIC_GOOGLE_DOCUMENT_AI"), "no NEXT_PUBLIC Google creds");

  const stack12Changed = changedFiles().filter(isStack12ChangedFile);
  for (const nav of NAV_FILES) {
    assert.ok(!stack12Changed.includes(nav), `Nav untouched: ${nav}`);
  }
  assert.ok(!stack12Changed.some((f) => f.startsWith("app/admin/")), "admin untouched");
  assert.ok(!stack12Changed.some((f) => f.startsWith("app/(site)/dashboard/")), "dashboard untouched");
  assert.ok(!stack12Changed.some((f) => f.startsWith("app/(site)/clasificados/")), "clasificados untouched");
  assert.ok(!stack12Changed.some((f) => f.includes("categoryConfig")), "categoryConfig untouched");
  assert.ok(!stack12Changed.some((f) => f.toLowerCase().includes("stripe")), "no Stripe");

  assert.ok(
    pkg.includes('"ofertas-locales:stack-12-document-ai-scan-audit"'),
    "package script for stack 12 audit"
  );
  assert.ok(pkg.includes("@google-cloud/documentai"), "Document AI dependency");

  console.log("Stack 12 — Ofertas Locales Document AI scan audit passed.");
}

run();
