/**
 * Stack 7 — Ofertas Locales publish readiness static audit.
 * Run: npm run ofertas-locales:stack-7-publish-readiness-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_7_PUBLISH_READINESS_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_7_PUBLISH_READINESS_AUDIT.md";
const MIGRATION = "supabase/migrations/20260605120000_ofertas_locales.sql";
const MAPPER = "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts";
const PUBLISH_ROUTE = "app/api/ofertas-locales/publish/route.ts";
const PUBLISH_CLIENT = "app/lib/ofertas-locales/ofertasLocalesPublishSubmit.ts";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";

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
  assert.ok(exists(PLAN), `${PLAN} must exist`);
  assert.ok(exists(AUDIT_DOC), `${AUDIT_DOC} must exist`);
  assert.ok(exists(MIGRATION), `${MIGRATION} must exist`);

  const migration = read(MIGRATION);
  assert.ok(migration.includes("create table if not exists public.ofertas_locales"), "ofertas_locales table");
  assert.ok(migration.includes("enable row level security"), "RLS enabled");
  assert.ok(migration.includes("ofertas_locales_select_owner"), "owner select policy");
  assert.ok(migration.includes("ofertas_locales_insert_owner"), "owner insert policy");
  assert.ok(migration.includes("ofertas_locales_update_owner_pending"), "owner update policy");
  assert.ok(!migration.includes("ofertas_locales_select_public"), "no public select policy");
  assert.ok(!migration.includes("for select\n  using (status = 'approved')"), "no approved public read");
  assert.ok(migration.includes("pending_review"), "pending_review status");

  const mapper = read(MAPPER);
  assert.ok(mapper.includes("export function mapOfertaLocalDraftToInsertPayload"), "publish mapper");
  assert.ok(mapper.includes("export function validateOfertaLocalDraftForServerPublish"), "server validation");
  assert.ok(mapper.includes('status: "pending_review"'), "maps pending_review status");

  assert.ok(exists(PUBLISH_ROUTE), "publish API route");
  const route = read(PUBLISH_ROUTE);
  assert.ok(route.includes("getBearerUserId"), "auth required");
  assert.ok(route.includes("401") || route.includes("unauthorized"), "blocks unauthenticated");
  assert.ok(route.includes("validateOfertaLocalDraftForServerPublish"), "server validation in route");
  assert.ok(route.includes('.from("ofertas_locales")'), "inserts ofertas_locales");
  assert.ok(route.includes("pending_review") || route.includes("mapOfertaLocalDraftToInsertPayload"), "pending review insert");
  assert.ok(!route.includes("stripe"), "no Stripe");
  assert.ok(!route.includes("analytics_events"), "no analytics events");
  assert.ok(!/record\w*Analytics/i.test(route), "no analytics recording");

  const client = read(PUBLISH_CLIENT);
  assert.ok(client.includes("/api/ofertas-locales/publish"), "client publish route");

  const app = read(APP_CLIENT);
  assert.ok(app.includes("submitOfertaLocalDraftForReview"), "draft calls publish submit");
  assert.ok(app.includes("submitForReview"), "submit button copy");
  assert.ok(app.includes("submitSuccessTitle"), "success state");

  assert.ok(!exists("app/(site)/clasificados/ofertas-locales"), "no public results page");
  assert.ok(!exists("app/(site)/clasificados/ofertas-locales/results"), "no public results route");

  const pkg = read("package.json");
  assert.ok(pkg.includes('"ofertas-locales:stack-7-publish-readiness-audit"'), "package script");

  const changed = changedFiles();
  for (const nav of NAV_FILES) {
    assert.ok(!changed.includes(nav), `Nav must not change: ${nav}`);
  }
  assert.ok(!changed.some((f) => f.startsWith("app/admin/")), "no admin changes");
  assert.ok(!changed.some((f) => f.includes("app/(site)/dashboard/")), "no dashboard changes");

  console.log("Stack 7 — Ofertas Locales publish readiness audit passed.");
}

run();
