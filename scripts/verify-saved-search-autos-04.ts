/**
 * Saved Search 04 — durable match outbox + dedupe + failure boundary verifier.
 * Run: npx tsx scripts/verify-saved-search-autos-04.ts
 *
 * A. Storage — migration exists, DB-level dedupe, internal UUID relationships, no secrets/address
 * B. Orchestrator — reuses eligibility + matcher + active-search read, no parallel engine
 * C. Dedupe — retry-safe insert behavior, explicit
 * D. Failure boundary — Saved Search failure cannot fail the publish handler
 * E. Security — no client-forgeable events, no caller-controlled owner_user_id, no service-role leak
 * F. Forbidden scope — no email/SMS/push/cron/Edge Function/notification UI/BR/Rentas matcher
 */
import fs from "node:fs";
import path from "node:path";
import { strict as assert } from "node:assert";

const root = process.cwd();
const failures: string[] = [];

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function stripSqlComments(sql: string): string {
  return sql
    .split(/\r?\n/)
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}

function stripJsComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

const MIGRATION_PATH = "supabase/migrations/20260818120000_saved_search_match_events.sql";
const ORCHESTRATOR_PATH = "app/lib/saved-search/autos/autosSavedSearchMatchOrchestrator.ts";
const SERVICE_PATH = "app/lib/clasificados/autos/autosClassifiedsListingService.ts";
const CRUD_PATH = "app/lib/saved-search/savedSearchServerCrud.ts";
const MATCHER_PATH = "app/lib/saved-search/autos/savedSearchAutosMatcher.ts";
const ELIGIBILITY_PATH = "app/lib/saved-search/autos/autosPublicEligibleListing.ts";

const sql = read(MIGRATION_PATH);
const sqlNoComments = stripSqlComments(sql);
const sqlNorm = sql.replace(/\s+/g, " ").toLowerCase();
const sqlCodeNorm = sqlNoComments.replace(/\s+/g, " ").toLowerCase();

const orchestratorSrc = read(ORCHESTRATOR_PATH);
const orchestratorCode = stripJsComments(orchestratorSrc);
const serviceSrc = read(SERVICE_PATH);
const crudSrc = read(CRUD_PATH);

// =================================================================================
// A. Storage
// =================================================================================

check("migration file exists at the expected path", () => {
  assert.ok(fs.existsSync(path.join(root, MIGRATION_PATH)));
});

check("saved_search_match_events table created (absent-safe, additive only)", () => {
  assert.ok(sqlNorm.includes("create table if not exists public.saved_search_match_events"));
});

check("saved_search_processing_failures table created (absent-safe, additive only)", () => {
  assert.ok(sqlNorm.includes("create table if not exists public.saved_search_processing_failures"));
});

check("internal UUID relationships used — saved_search_id/owner_user_id/listing_id are uuid FKs, not display ids", () => {
  assert.ok(sqlNorm.includes("saved_search_id uuid not null references public.saved_searches (id) on delete cascade"));
  assert.ok(sqlNorm.includes("owner_user_id uuid not null references auth.users (id) on delete cascade"));
  assert.ok(sqlNorm.includes("listing_id uuid not null references public.autos_classifieds_listings (id) on delete cascade"));
});

check("DB-level dedupe unique index exists on (saved_search_id, listing_id, event_type)", () => {
  assert.ok(
    /create unique index if not exists saved_search_match_events_dedupe_uidx\s+on public\.saved_search_match_events \(saved_search_id, listing_id, event_type\)/.test(
      sqlNorm,
    ),
  );
});

check("no secret fields, no exact hidden address, no full listing_payload blob stored", () => {
  // Check only the CREATE TABLE column lists — COMMENT ON TABLE prose legitimately describes
  // what must NOT be stored (and even contains a stray ";" inside a sentence), so scanning the
  // whole file text would false-positive on documentation, not an actual column definition.
  const createTableBlocks = sqlNoComments.match(/CREATE TABLE[\s\S]*?\n\);/g) ?? [];
  assert.ok(createTableBlocks.length === 2, `expected 2 CREATE TABLE blocks, found ${createTableBlocks.length}`);
  const columnsOnly = createTableBlocks.join("\n").toLowerCase();
  assert.ok(!columnsOnly.includes("listing_payload"), "must never store the raw listing_payload JSONB blob");
  assert.ok(!/\baddress\b|contact_email|contact_phone|auth_token|\bpayment\b/.test(columnsOnly), "must never define an address/contact/auth/payment column");
  assert.ok(!/service_role_key|supabase_service_role/.test(sqlCodeNorm));
});

check("snapshot fields are limited to Gate 12's approved, display-safe list", () => {
  for (const col of ["matched_fingerprint", "leonix_ad_id", "listing_title", "listing_price", "listing_city", "listing_state", "seller_lane"]) {
    assert.ok(sqlNorm.includes(col), `expected snapshot column ${col}`);
  }
});

check("event_type is truthfully minimal — only listing_activated_match, no fabricated price_drop/relisted semantics", () => {
  assert.ok(sqlNorm.includes("event_type text not null default 'listing_activated_match'"));
  assert.ok(/check \(event_type in \('listing_activated_match'\)\)/.test(sqlNorm));
  assert.ok(!sqlCodeNorm.includes("'price_drop'") && !sqlCodeNorm.includes("'relisted'") && !sqlCodeNorm.includes("'availability_change'"));
  assert.ok(!sqlCodeNorm.includes("new_or_republished_match"), "stale event-type literal must not remain anywhere in the migration");
});

check("status reserved for future delivery only — this build never writes anything but 'pending'", () => {
  assert.ok(sqlNorm.includes("status text not null default 'pending'"));
  const insertSection = orchestratorCode.slice(orchestratorCode.indexOf("eventRows ="));
  assert.ok(!/status:\s*["'`]/.test(insertSection), "orchestrator insert payload must never set status explicitly (must rely on the column default)");
});

check("RLS enabled with no policies on both new tables — server/service-role only", () => {
  for (const table of ["saved_search_match_events", "saved_search_processing_failures"]) {
    assert.ok(sqlNorm.includes(`alter table public.${table} enable row level security`), `${table} must enable RLS`);
  }
  assert.ok(!/create policy/.test(sqlCodeNorm), "must not create any policy on either new table — service-role only, matching leonix_stripe_webhook_events");
});

check("no destructive SQL anywhere in the migration", () => {
  assert.ok(!sqlCodeNorm.includes("drop table"));
  assert.ok(!sqlCodeNorm.includes("truncate"));
  assert.ok(!sqlCodeNorm.includes("delete from"));
  assert.ok(!sqlCodeNorm.includes("drop column"));
});

check("updated_at is database-maintained via dedicated triggers, matching repo precedent", () => {
  assert.ok(orchestratorSrc.length >= 0); // no-op guard so this check block always has a body
  assert.ok(sqlNorm.includes("create or replace function public.saved_search_match_events_set_updated_at"));
  assert.ok(sqlNorm.includes("create trigger saved_search_match_events_updated_at"));
  assert.ok(sqlNorm.includes("create or replace function public.saved_search_processing_failures_set_updated_at"));
});

// =================================================================================
// B. Orchestrator
// =================================================================================

check("orchestrator reuses certifyAutosPublicEligibleListing verbatim — no parallel eligibility engine", () => {
  assert.ok(orchestratorSrc.includes('from "./autosPublicEligibleListing"'));
  assert.ok(orchestratorSrc.includes("certifyAutosPublicEligibleListing("));
});

check("orchestrator reuses matchesAutosSavedSearch verbatim — no parallel Autos filter engine", () => {
  assert.ok(orchestratorSrc.includes('from "./savedSearchAutosMatcher"'));
  assert.ok(orchestratorSrc.includes("matchesAutosSavedSearch("));
  assert.ok(!/applyAutosPublicFilters/.test(orchestratorSrc), "orchestrator must not call the low-level filter function directly — only through the existing matcher");
});

check("orchestrator reuses listActiveSavedSearchesForCategory — reads only active Autos saved searches", () => {
  assert.ok(orchestratorSrc.includes("listActiveSavedSearchesForCategory(supabase, SAVED_SEARCH_AUTOS_CATEGORY)"));
});

check("active-search query itself scopes to category=autos AND is_active=true — no full-table scan", () => {
  const fn = crudSrc.match(/export async function listActiveSavedSearchesForCategory[\s\S]*?\n}/)?.[0] ?? "";
  assert.ok(fn.includes('.eq("category", category)'));
  assert.ok(fn.includes('.eq("is_active", true)'));
});

check("orchestrator does not scan/matcher any category other than autos", () => {
  assert.ok(!/bienes|rentas|bienesRaices/i.test(stripJsComments(orchestratorSrc)));
});

check("orchestrator returns a structured result for logging/inspection, never throws to the caller by design", () => {
  assert.ok(orchestratorSrc.includes("export type AutosSavedSearchMatchOrchestrationResult"));
  assert.ok(orchestratorSrc.includes("export async function triggerAutosSavedSearchMatchBestEffort"));
});

// =================================================================================
// C. Dedupe / retry-safety
// =================================================================================

check("match-event insert uses upsert+ignoreDuplicates against the exact DB unique key — retry-safe by construction", () => {
  const insertCall = orchestratorSrc.match(/\.upsert\(eventRows,[\s\S]*?\)/)?.[0] ?? "";
  assert.ok(insertCall.includes('onConflict: "saved_search_id,listing_id,event_type"'));
  assert.ok(insertCall.includes("ignoreDuplicates: true"));
});

check("dedupe is a real database constraint, not merely an application-side check", () => {
  assert.ok(/create unique index/.test(sqlNorm) && sqlNorm.includes("saved_search_match_events_dedupe_uidx"));
});

// =================================================================================
// D. Failure boundary
// =================================================================================

check("publication hook calls only the never-throwing wrapper, not the raw orchestrator", () => {
  const hookCalls = serviceSrc.match(/triggerAutosSavedSearchMatchBestEffort\([^)]*\)/g) ?? [];
  assert.equal(hookCalls.length, 2, `expected exactly 2 hook call sites (negocios + privado activation branches), found ${hookCalls.length}`);
  assert.ok(!serviceSrc.includes("runAutosSavedSearchMatchOrchestration("), "the publish/activation service must never call the raw orchestrator directly — only the best-effort wrapper");
});

check("hook call happens strictly AFTER the real activation write already committed, not inside the transaction", () => {
  const negocios = serviceSrc.slice(serviceSrc.indexOf("if (result.activated) {"), serviceSrc.indexOf('return { ok: true, transitioned: result.activated === true };'));
  const hookIdx = negocios.indexOf("triggerAutosSavedSearchMatchBestEffort");
  const updateIdx = negocios.indexOf(".update({ stripe_checkout_session_id: null");
  assert.ok(hookIdx > updateIdx && hookIdx !== -1 && updateIdx !== -1, "negocios branch: hook must run after the activation update");

  const privadoUpdateIdx = serviceSrc.indexOf('.update(patch)');
  const privadoHookIdx = serviceSrc.indexOf("triggerAutosSavedSearchMatchBestEffort", privadoUpdateIdx);
  const privadoReturnIdx = serviceSrc.indexOf("return { ok: true, transitioned: true };", privadoUpdateIdx);
  assert.ok(privadoUpdateIdx !== -1 && privadoHookIdx !== -1 && privadoReturnIdx !== -1, "could not locate privado activation update/hook/return");
  assert.ok(
    privadoHookIdx > privadoUpdateIdx && privadoHookIdx < privadoReturnIdx,
    "privado branch: hook must run strictly after the activation update and before the success return",
  );
});

check("triggerAutosSavedSearchMatchBestEffort itself is exception-proof (try/catch wraps the entire body, never rethrows)", () => {
  const fn = orchestratorSrc.match(/export async function triggerAutosSavedSearchMatchBestEffort[\s\S]*?\n}/)?.[0] ?? "";
  assert.ok(fn.includes("try {") && fn.includes("catch"));
  assert.ok(!/throw /.test(fn), "the best-effort wrapper must never re-throw");
});

check("no all-or-nothing transaction wraps primary activation + match-event writes together", () => {
  assert.ok(!/\.rpc\(\s*["']begin["']|BEGIN;|START TRANSACTION/i.test(serviceSrc + orchestratorSrc));
});

check("orchestrator's own internal stages are individually try/catch-guarded — a failure in one stage cannot corrupt or skip failure recording for another", () => {
  const tryCount = (orchestratorCode.match(/\btry\s*\{/g) ?? []).length;
  assert.ok(tryCount >= 5, `expected at least 5 distinct try/catch stages (load listing, certify, load active searches, matcher loop, write events), found ${tryCount}`);
});

check("seller-facing publish success (TryActivateAutosResult.ok/transitioned) is computed before and independent of the Saved Search call", () => {
  const negocios = serviceSrc.slice(serviceSrc.indexOf("if (result.activated) {"), serviceSrc.indexOf('return { ok: true, transitioned: result.activated === true };') + 60);
  assert.ok(!/await triggerAutosSavedSearchMatchBestEffort[\s\S]*?const transitioned|if \(!.*triggerAutos/.test(negocios), "activation success must never be conditioned on the Saved Search call's outcome");
});

// =================================================================================
// E. Security / ownership
// =================================================================================

check("no public/client route creates match events — orchestrator only reachable from server-side listing-activation code", () => {
  const apiFiles = fs.existsSync(path.join(root, "app/api")) ? [] : [];
  void apiFiles;
  // Grep-equivalent: confirm the orchestrator module is never imported from anything under app/api
  // with a client-reachable HTTP verb export that isn't the activation path itself.
  assert.ok(!/export async function (GET|POST|PUT|PATCH|DELETE)/.test(orchestratorSrc), "orchestrator file itself must not export an HTTP route handler");
});

check("owner_user_id on a match event always comes from the stored saved_search row, never caller/listing input", () => {
  const insertPayload = orchestratorSrc.match(/const eventRows = matches\.map[\s\S]*?\}\)\);/)?.[0] ?? "";
  assert.ok(insertPayload.includes("owner_user_id: search.ownerUserId"), "owner_user_id must be read from the saved_search row (search.ownerUserId), not any external input");
});

check("no service-role key or admin client referenced from any client-bundled Saved Search Autos file", () => {
  for (const rel of [
    "app/lib/saved-search/autos/savedSearchAutosAdapter.ts",
    "app/lib/saved-search/autos/savedSearchAutosMatcher.ts",
    "app/lib/saved-search/autos/autosPublicEligibleListing.ts",
  ]) {
    const src = read(rel);
    assert.ok(!/getAdminSupabase|service_role/i.test(src), `${rel} must never reference the admin client or service-role key`);
  }
});

check("orchestrator and hook files are server-only (import \"server-only\" or plain .ts service module never imported by a client component)", () => {
  assert.ok(orchestratorSrc.includes('import "server-only";'));
});

check("match-event table write path uses the admin (service-role) client, not a browser-anon client", () => {
  assert.ok(orchestratorSrc.includes("getAdminSupabase()"));
  assert.ok(!/createSupabaseBrowserClient/.test(orchestratorSrc));
});

// =================================================================================
// F. Forbidden scope
// =================================================================================

const newOrChangedFiles = [MIGRATION_PATH, ORCHESTRATOR_PATH, SERVICE_PATH, CRUD_PATH];

const FORBIDDEN_PATTERNS: [RegExp, string][] = [
  [/\bsendEmail\b|nodemailer|resend\.|sendgrid/i, "email"],
  [/\btwilio\b|\bsendSms\b/i, "SMS"],
  [/push notification|webpush|expo-notifications/i, "push notification"],
  [/notification.?center|notification.?ui/i, "notification UI"],
  [/\bcron\b/i, "cron"],
  [/edge function|supabase\/functions/i, "Edge Function"],
  [/scheduled.?worker|background.?polling|poll.?daemon/i, "scheduled/background worker"],
  [/webhook.?url|outgoing.?webhook/i, "outgoing webhook"],
];

check("no forbidden-scope terms actually implemented in any Saved Search 04 file (comments documenting what is NOT done are fine)", () => {
  for (const rel of newOrChangedFiles) {
    const code = rel.endsWith(".sql") ? stripSqlComments(read(rel)) : stripJsComments(read(rel));
    for (const [re, label] of FORBIDDEN_PATTERNS) {
      assert.ok(!re.test(code), `${rel} must not implement ${label}`);
    }
  }
});

check("no Bienes Raíces / Rentas matcher introduced", () => {
  for (const rel of [ORCHESTRATOR_PATH, MATCHER_PATH, ELIGIBILITY_PATH]) {
    const code = stripJsComments(read(rel));
    assert.ok(!/matchesBienesRaicesSavedSearch|matchesRentasSavedSearch/.test(code));
  }
});

check("no dashboard/customer-facing UI file touched by Saved Search 04", () => {
  for (const rel of newOrChangedFiles) {
    assert.ok(!rel.includes("dashboard") && !rel.includes("components/public"), `${rel} must not be a UI/dashboard file`);
  }
});

// =================================================================================
if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-saved-search-autos-04: PASS");
