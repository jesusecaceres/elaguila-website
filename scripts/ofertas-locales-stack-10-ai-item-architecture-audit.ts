/**
 * Stack 10 — Ofertas Locales AI item architecture audit.
 * Run: npm run ofertas-locales:stack-10-ai-item-architecture-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_10_AI_ITEM_ARCHITECTURE_PLAN.md";
const ARCH = "app/lib/ofertas-locales/OFERTAS_LOCALES_AI_EXTRACTION_CLICKABLE_ITEMS_ARCHITECTURE.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_10_AI_ITEM_ARCHITECTURE_AUDIT.md";
const TYPES = "app/lib/ofertas-locales/ofertasLocalesTypes.ts";
const CONSTANTS = "app/lib/ofertas-locales/ofertasLocalesConstants.ts";
const AI_HELPERS = "app/lib/ofertas-locales/ofertasLocalesAiArchitecture.ts";

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

const FORBIDDEN_CHANGED_PREFIXES = [
  "app/api/ofertas-locales/scan/",
  "app/api/ofertas-locales/items/",
  "app/admin/",
  "app/(site)/dashboard/",
  "app/(site)/clasificados/",
  "supabase/migrations/",
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
  assert.ok(exists(PLAN), "Stack 10 plan must exist");
  assert.ok(exists(ARCH), "AI extraction architecture doc must exist");
  assert.ok(exists(AUDIT_DOC), "Stack 10 audit doc must exist");
  assert.ok(exists(AI_HELPERS), "AI architecture helpers must exist");

  const plan = read(PLAN);
  const arch = read(ARCH);
  const types = read(TYPES);
  const constants = read(CONSTANTS);
  const helpers = read(AI_HELPERS);
  const docsBundle = `${plan}\n${arch}`;

  assert.ok(docsBundle.includes("Google Document AI"), "Google Document AI documented");
  assert.ok(
    docsBundle.includes("Leonix AI Normalizer") || docsBundle.includes("leonix_normalizer"),
    "Leonix AI Normalizer documented"
  );
  assert.ok(
    docsBundle.includes("Business verification") || docsBundle.includes("business review"),
    "business verification documented"
  );
  assert.ok(
    docsBundle.includes("No AI auto-publication") ||
      docsBundle.includes("no AI auto-publication") ||
      docsBundle.includes("canOfertaLocalItemGoPublic"),
    "no AI auto-publication rule documented"
  );

  assert.ok(types.includes("OfertaLocalScanJobRecordDraft"), "scan job record type");
  assert.ok(types.includes("OfertaLocalSearchableItemDraft"), "searchable item type");
  assert.ok(types.includes("OfertaLocalClickableItemCardView"), "clickable item card view type");
  assert.ok(types.includes("OfertaLocalShoppingListDraft"), "shopping list type");
  assert.ok(types.includes("OfertaLocalShoppingRouteDraft"), "route type");
  assert.ok(types.includes('"reviewed"'), "scan status includes reviewed");

  assert.ok(
    constants.includes("OFERTAS_LOCALES_SHOPPING_ROUTE_MAX_STOPS = 5"),
    "route max stops constant equals 5"
  );

  assert.ok(helpers.includes("canOfertaLocalItemGoPublic"), "canOfertaLocalItemGoPublic helper");
  assert.ok(helpers.includes("getOfertaLocalAiPipelineSteps"), "pipeline steps helper");
  assert.ok(helpers.includes("getOfertaLocalRouteStopKey"), "route stop key helper");
  assert.ok(helpers.includes("normalizeOfertaLocalItemSearchText"), "item search text helper");

  assert.ok(!exists("app/api/ofertas-locales/scan"), "no scan API route dir");
  assert.ok(!exists("app/api/ofertas-locales/items"), "no items API route dir");
  assert.ok(!exists("app/api/ofertas-locales/ai-extract"), "no AI extraction API");

  assert.ok(!helpers.includes("@google-cloud/documentai"), "no Google Document AI SDK");
  assert.ok(!helpers.includes('from "openai"'), "no OpenAI SDK import");
  assert.ok(!helpers.includes("@google/generative-ai"), "no Gemini SDK");
  assert.ok(!helpers.includes("fetch("), "no fetch in AI helpers");

  assert.ok(arch.includes("oferta_local_scan_jobs"), "future scan jobs table");
  assert.ok(arch.includes("oferta_local_items"), "future items table");
  assert.ok(arch.includes("oferta_local_shopping_lists"), "future shopping lists table");
  assert.ok(arch.includes("oferta_local_route_events"), "future route events table");

  const changed = changedFiles();
  for (const prefix of FORBIDDEN_CHANGED_PREFIXES) {
    assert.ok(
      !changed.some((f) => f.startsWith(prefix)),
      `Forbidden path changed: ${prefix}`
    );
  }
  for (const nav of NAV_FILES) {
    assert.ok(!changed.includes(nav), `Nav untouched: ${nav}`);
  }
  assert.ok(!changed.some((f) => f.includes("categoryConfig")), "categoryConfig untouched");
  assert.ok(!changed.some((f) => f.toLowerCase().includes("stripe")), "no Stripe changes");

  const allowedOutsideLib = ["package.json", "scripts/ofertas-locales-stack-10-ai-item-architecture-audit.ts"];
  for (const f of changed) {
    if (f.startsWith("app/lib/ofertas-locales/")) continue;
    if (allowedOutsideLib.includes(f)) continue;
    if (f.startsWith(".next/")) continue;
    assert.fail(`Unexpected changed file outside Stack 10 scope: ${f}`);
  }

  const pkg = read("package.json");
  assert.ok(
    pkg.includes('"ofertas-locales:stack-10-ai-item-architecture-audit"'),
    "package script for stack 10 audit"
  );

  console.log("Stack 10 — Ofertas Locales AI item architecture audit passed.");
}

run();
