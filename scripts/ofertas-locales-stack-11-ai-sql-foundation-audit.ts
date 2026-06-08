/**
 * Stack 11 — Ofertas Locales AI SQL foundation audit.
 * Run: npm run ofertas-locales:stack-11-ai-sql-foundation-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_11_AI_SQL_FOUNDATION_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_11_AI_SQL_FOUNDATION_AUDIT.md";
const MIGRATION_GLOB_PREFIX = "supabase/migrations/";
const MAPPER = "app/lib/ofertas-locales/ofertasLocalesAiDbMapper.ts";
const TYPES = "app/lib/ofertas-locales/ofertasLocalesTypes.ts";
const AI_ARCH = "app/lib/ofertas-locales/ofertasLocalesAiArchitecture.ts";

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

const FORBIDDEN_CHANGED_PREFIXES = [
  "app/api/ofertas-locales/scan/",
  "app/api/ofertas-locales/items/",
  "app/admin/",
  "app/(site)/dashboard/",
  "app/(site)/clasificados/",
] as const;

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function migrationFile(): string {
  const dir = path.join(ROOT, "supabase/migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.includes("oferta_local_ai_scan_items") && f.endsWith(".sql"))
    .sort();
  assert.ok(files.length >= 1, "migration file for scan/items must exist");
  return `${MIGRATION_GLOB_PREFIX}${files[files.length - 1]}`;
}

const STACK11_CHANGED_PATTERNS = [
  /^app\/lib\/ofertas-locales\//,
  /^supabase\/migrations\/.*oferta_local_ai_scan_items\.sql$/,
  /^package\.json$/,
  /^scripts\/ofertas-locales-stack-11-ai-sql-foundation-audit\.ts$/,
] as const;

function isStack11ChangedFile(file: string): boolean {
  return STACK11_CHANGED_PATTERNS.some((re) => re.test(file));
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
  assert.ok(exists(PLAN), "Stack 11 plan must exist");
  assert.ok(exists(AUDIT_DOC), "Stack 11 audit doc must exist");
  assert.ok(exists(MAPPER), "DB mapper file must exist");

  const migrationRel = migrationFile();
  const sql = read(migrationRel);
  const mapper = read(MAPPER);
  const types = read(TYPES);
  const aiArch = read(AI_ARCH);

  assert.ok(sql.includes("oferta_local_scan_jobs"), "migration creates oferta_local_scan_jobs");
  assert.ok(sql.includes("oferta_local_items"), "migration creates oferta_local_items");
  assert.ok(sql.includes("references public.ofertas_locales (id)"), "FK to ofertas_locales");

  assert.ok(sql.includes("enable row level security"), "RLS enabled");
  assert.ok(sql.includes("oferta_local_scan_jobs_select_owner"), "scan jobs owner select");
  assert.ok(sql.includes("oferta_local_items_select_owner"), "items owner select");
  assert.ok(sql.includes("oferta_local_scan_jobs_insert_owner"), "scan jobs owner insert");
  assert.ok(sql.includes("oferta_local_items_insert_owner"), "items owner insert");

  assert.ok(!sql.includes("for select") || !sql.match(/for select[\s\S]*to anon/), "no anon public select");
  const publicSelectScan = /oferta_local_scan_jobs[\s\S]*for select[\s\S]*using\s*\(\s*true\s*\)/i;
  const publicSelectItems = /oferta_local_items[\s\S]*for select[\s\S]*using\s*\(\s*true\s*\)/i;
  assert.ok(!publicSelectScan.test(sql), "no public select policy for scan jobs");
  assert.ok(!publicSelectItems.test(sql), "no public select policy for items");

  for (const status of [
    "pending",
    "processing",
    "needs_review",
    "reviewed",
    "approved",
    "failed",
    "cancelled",
  ]) {
    assert.ok(sql.includes(`'${status}'`), `scan status includes ${status}`);
  }

  for (const status of ["pending", "needs_review", "approved", "rejected"]) {
    assert.ok(sql.includes(`'${status}'`), `item review status includes ${status}`);
  }

  assert.ok(sql.includes("review_status text not null default 'pending'"), "review_status defaults pending");
  assert.ok(sql.includes("is_active boolean not null default false"), "is_active defaults false");
  assert.ok(sql.includes("'google_document_ai'"), "google_document_ai provider");
  assert.ok(sql.includes("'leonix_normalizer'"), "leonix_normalizer provider");

  assert.ok(types.includes("OfertaLocalScanJobDbRow"), "scan job DB row type");
  assert.ok(types.includes("OfertaLocalScanJobDbInsert"), "scan job DB insert type");
  assert.ok(types.includes("OfertaLocalItemDbRow"), "item DB row type");
  assert.ok(types.includes("OfertaLocalItemDbInsert"), "item DB insert type");
  assert.ok(types.includes("OfertaLocalItemPublicEligibilityInput"), "eligibility input type");

  assert.ok(mapper.includes("canOfertaLocalItemBePubliclyEligible"), "public eligibility helper");
  assert.ok(mapper.includes("mapOfertaLocalSearchableItemDraftToDbInsert"), "item draft mapper");
  assert.ok(mapper.includes("mapOfertaLocalScanJobDraftToDbInsert"), "scan job draft mapper");
  assert.ok(aiArch.includes("canOfertaLocalItemBePubliclyEligible"), "eligibility re-exported");

  assert.ok(!mapper.includes("@supabase"), "mapper has no Supabase client");
  assert.ok(!mapper.includes("fetch("), "mapper has no fetch");
  assert.ok(!mapper.includes("@google-cloud"), "no Google SDK in mapper");
  assert.ok(!mapper.includes('from "openai"'), "no OpenAI in mapper");

  assert.ok(!exists("app/api/ofertas-locales/items"), "no items API route");
  // Stack 12 adds app/api/ofertas-locales/scan — not a Stack 11 regression.

  const stack11Changed = changedFiles().filter(isStack11ChangedFile);
  for (const prefix of FORBIDDEN_CHANGED_PREFIXES) {
    assert.ok(!stack11Changed.some((f) => f.startsWith(prefix)), `Forbidden changed: ${prefix}`);
  }
  for (const nav of NAV_FILES) {
    assert.ok(!stack11Changed.includes(nav), `Nav untouched: ${nav}`);
  }
  assert.ok(!stack11Changed.some((f) => f.includes("categoryConfig")), "categoryConfig untouched");
  assert.ok(!stack11Changed.some((f) => f.toLowerCase().includes("stripe")), "no Stripe changes");

  for (const f of stack11Changed) {
    if (f.startsWith("app/lib/ofertas-locales/")) continue;
    if (f.startsWith("supabase/migrations/")) continue;
    if (f === "package.json") continue;
    if (f === "scripts/ofertas-locales-stack-11-ai-sql-foundation-audit.ts") continue;
    assert.fail(`Unexpected Stack 11 changed file: ${f}`);
  }

  const pkg = read("package.json");
  assert.ok(
    pkg.includes('"ofertas-locales:stack-11-ai-sql-foundation-audit"'),
    "package script for stack 11 audit"
  );

  console.log("Stack 11 — Ofertas Locales AI SQL foundation audit passed.");
}

run();
