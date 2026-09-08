/**
 * Program 4, Gate 4A — Field Discovery + Canvassing verification. Hand-rolled node:assert
 * script, matching this repo's testing convention (no jest/vitest). Run via
 * `npx tsx scripts/verify-field-discovery-canvassing-01.ts`.
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const exists = (rel: string) => fs.existsSync(path.join(ROOT, rel));

let passed = 0;
let failed = 0;
function check(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS  ${label}`);
    passed++;
  } catch (e) {
    console.log(`  FAIL  ${label}`);
    console.log(`        ${(e as Error).message}`);
    failed++;
  }
}

const MIGRATION_PATH = "supabase/migrations/20260810120000_field_discovery_canvassing_foundation.sql";
const TABLES = ["business_consent_records", "business_source_links", "business_source_files"];

const AUTHORIZED_LIB_FILES = [
  "app/lib/business/fieldDiscovery/types.ts",
  "app/lib/business/fieldDiscovery/constants.ts",
  "app/lib/business/fieldDiscovery/logic.ts",
  "app/lib/business/fieldDiscovery/sourceRegistry.ts",
  "app/lib/business/fieldDiscovery/repository.ts",
  "app/lib/business/fieldDiscovery/featureFlag.ts",
  "app/lib/business/fieldDiscovery/uploadClient.ts",
  "app/lib/business/fieldDiscovery/storagePaths.ts",
  "app/lib/business/fieldDiscovery/uploadValidation.ts",
];
const AUTHORIZED_API_FILES = [
  "app/api/admin/businesses/canvass/route.ts",
  "app/api/admin/field-discovery/assets/upload-intent/route.ts",
  "app/api/admin/field-discovery/assets/client-upload/route.ts",
  "app/api/admin/field-discovery/assets/upload/route.ts",
];
const AUTHORIZED_UI_FILES = [
  "app/admin/(dashboard)/businesses/canvass/page.tsx",
  "app/admin/(dashboard)/businesses/canvass/CanvassForm.tsx",
  "app/admin/(dashboard)/businesses/[businessId]/FieldDiscoveryActions.tsx",
];

// 1. Domain files exist
check("1. Domain files exist", () => {
  for (const rel of [...AUTHORIZED_LIB_FILES, ...AUTHORIZED_API_FILES, ...AUTHORIZED_UI_FILES, "app/admin/_lib/fieldDiscoveryActor.ts"]) {
    assert.ok(exists(rel), `missing ${rel}`);
  }
});

// 2. Feature flag exists and defaults false
check("2. Feature flag exists and defaults false", () => {
  const migration = read(MIGRATION_PATH);
  assert.ok(migration.includes("business_identity_flags"));
  assert.ok(migration.includes("'field_discovery_canvassing', false, false"));
});

const MIGRATION = read(MIGRATION_PATH);

// 3. Three Gate 4A tables exist in migration
check("3. Three Gate 4A tables exist in migration", () => {
  for (const t of TABLES) assert.ok(MIGRATION.includes(`CREATE TABLE IF NOT EXISTS public.${t}`), `missing CREATE TABLE for ${t}`);
  assert.strictEqual((MIGRATION.match(/CREATE TABLE IF NOT EXISTS public\.business_/g) ?? []).length, 3, "expected exactly 3 CREATE TABLE statements");
});

// 4. RLS enabled
check("4. RLS enabled on every table", () => {
  const n = (MIGRATION.match(/ENABLE ROW LEVEL SECURITY/g) ?? []).length;
  assert.strictEqual(n, 3, `expected 3, found ${n}`);
});

// 5. Zero-policy posture represented
check("5. Zero-policy posture (no CREATE POLICY)", () => {
  assert.strictEqual((MIGRATION.match(/CREATE POLICY/g) ?? []).length, 0);
});

// 6. Grants only service_role
check("6. Grants only service_role, revoke precedes grant", () => {
  for (const role of ["PUBLIC", "anon", "authenticated", "service_role"]) {
    const n = (MIGRATION.match(new RegExp(`REVOKE ALL PRIVILEGES ON TABLE public\\.\\S+ FROM ${role};`, "g")) ?? []).length;
    assert.strictEqual(n, 3, `expected 3 REVOKE...FROM ${role}, found ${n}`);
  }
  for (const t of TABLES) {
    const revokeIdx = MIGRATION.indexOf(`REVOKE ALL PRIVILEGES ON TABLE public.${t} FROM service_role;`);
    const grantIdx = MIGRATION.indexOf(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${t} TO service_role;`);
    assert.ok(revokeIdx !== -1 && grantIdx !== -1 && revokeIdx < grantIdx, `${t}: revoke must precede narrow grant`);
  }
  assert.ok(!/^\s*GRANT ALL\b/im.test(MIGRATION));
  const grantLines = MIGRATION.split("\n").filter((l) => l.trim().startsWith("GRANT "));
  const bad = grantLines.filter((l) => /\bTO (anon|authenticated|PUBLIC)\b/i.test(l));
  assert.strictEqual(bad.length, 0, JSON.stringify(bad));
});

// 7. Actor constraints
check("7. Actor attribution CHECK on every table", () => {
  assert.ok(MIGRATION.includes("business_consent_records_actor_chk"));
  assert.ok(MIGRATION.includes("business_source_links_actor_chk"));
  assert.ok(MIGRATION.includes("business_source_files_actor_chk"));
});

// 8. Consent append-only contract
check("8. Consent is append-only (repository never issues an UPDATE against business_consent_records)", () => {
  const repoSrc = read("app/lib/business/fieldDiscovery/repository.ts");
  assert.ok(!/business_consent_records["'`]\)\s*\.update/.test(repoSrc), "must never update a consent row");
});

// 9. Source type enum
check("9. Source type enum matches migration and constants", () => {
  assert.ok(MIGRATION.includes("'website', 'google_business', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'yelp', 'whatsapp', 'other'"));
  const constantsSrc = read("app/lib/business/fieldDiscovery/constants.ts");
  assert.ok(constantsSrc.includes('"website"') && constantsSrc.includes('"google_business"'));
});

// 10. File kind enum
check("10. File kind enum matches migration and constants", () => {
  assert.ok(MIGRATION.includes("'business_card', 'menu', 'flyer', 'logo', 'photo', 'screenshot', 'pdf', 'price_list', 'service_list', 'other'"));
  const constantsSrc = read("app/lib/business/fieldDiscovery/constants.ts");
  assert.ok(constantsSrc.includes('"business_card"'));
});

// 11. Upload MIME/size validation
check("11. Upload MIME/size validation exists and rejects unsupported types", () => {
  const src = read("app/lib/business/fieldDiscovery/uploadValidation.ts");
  assert.ok(src.includes("FIELD_DISCOVERY_UPLOAD_MIME_TYPES"));
  assert.ok(src.includes("unsupported_file_type"));
  assert.ok(src.includes("upload_too_large"));
});

// 12. Sanitized path
check("12. Sanitized storage path — no traversal, UUID-suffixed", () => {
  const src = read("app/lib/business/fieldDiscovery/storagePaths.ts");
  assert.ok(src.includes("randomUUID"));
  assert.ok(src.includes('replace(/\\.\\./g'));
});

// 13. Exact-business upload authorization
check("13. Exact-business upload authorization enforced in client-upload token handler", () => {
  const src = read("app/api/admin/field-discovery/assets/client-upload/route.ts");
  assert.ok(src.includes("isPathAuthorized"));
  assert.ok(src.includes("Upload path is not authorized"));
});

// 14. No client actor trust
check("14. No route trusts a client-supplied actor identity", () => {
  for (const rel of AUTHORIZED_API_FILES) {
    const src = read(rel);
    assert.ok(!/body\.authUserId|body\.rosterId|body\.actorRole|o\.authUserId|o\.rosterId/.test(src), `${rel} must never trust a body-supplied identity field`);
  }
});

// 15. Canvassing capability exists
check("15. conduct_canvassing capability exists in the matrix", () => {
  const capSrc = read("app/admin/_lib/salesWorkspaceCapabilities.ts");
  assert.ok(capSrc.includes('"conduct_canvassing"'));
  assert.ok(capSrc.includes('"view_field_discovery"'));
  assert.ok(capSrc.includes('"manage_discovery_sources"'));
  assert.ok(capSrc.includes('"upload_discovery_files"'));
});

// 16. Role matrix correct — sales_rep may canvass but never run/review/promote AI research
check("16. Role matrix: sales_rep may canvass but never run_ai_research/review_ai_briefing/promote_ai_briefing", () => {
  const capSrc = read("app/admin/_lib/salesWorkspaceCapabilities.ts");
  const salesRepBlock = capSrc.slice(capSrc.indexOf("sales_rep: ["), capSrc.indexOf("};", capSrc.indexOf("sales_rep: [")));
  assert.ok(salesRepBlock.includes('"conduct_canvassing"'));
  assert.ok(salesRepBlock.includes('"upload_discovery_files"'));
  assert.ok(!salesRepBlock.includes('"run_ai_research"'));
  assert.ok(!salesRepBlock.includes('"review_ai_briefing"'));
  assert.ok(!salesRepBlock.includes('"promote_ai_briefing"'));
  for (const role of ["super_admin", "sales_manager"]) {
    const block = capSrc.slice(capSrc.indexOf(`${role}: [`), capSrc.indexOf("],", capSrc.indexOf(`${role}: [`)));
    assert.ok(block.includes('"run_ai_research"'), `${role} missing run_ai_research`);
    assert.ok(block.includes('"review_ai_briefing"'), `${role} missing review_ai_briefing`);
    assert.ok(block.includes('"promote_ai_briefing"'), `${role} missing promote_ai_briefing`);
  }
});

// 17. Canvass route uses existing staff access
check("17. Canvass route uses requireSalesWorkspaceAccess (existing staff access)", () => {
  const src = read("app/api/admin/businesses/canvass/route.ts");
  assert.ok(src.includes("requireSalesWorkspaceAccess"));
  assert.ok(src.includes('actorHasCapability(access.actor, "conduct_canvassing")'));
});

// 18. Duplicate-warning logic used
check("18. Canvass route reuses resolveDuplicateWarning via searchCanvassDuplicateCandidates", () => {
  const repoSrc = read("app/lib/business/fieldDiscovery/repository.ts");
  assert.ok(repoSrc.includes("resolveDuplicateWarning"));
  assert.ok(repoSrc.includes('from "../duplicates"'));
  const routeSrc = read("app/api/admin/businesses/canvass/route.ts");
  assert.ok(routeSrc.includes("searchCanvassDuplicateCandidates"));
  assert.ok(routeSrc.includes("duplicate_business_warning"));
});

// 19. No duplicate business identity table
check("19. No duplicate business/prospect identity table created", () => {
  assert.ok(!/CREATE TABLE.*\bbusinesses\b/i.test(MIGRATION.replace(/REFERENCES public\.businesses/g, "")));
  assert.ok(!MIGRATION.includes("CREATE TABLE IF NOT EXISTS public.business_prospects"));
});

// 20. Discovery session reuse
check("20. Canvassing reuses existing business_discovery_sessions via startDiscoverySession", () => {
  const routeSrc = read("app/api/admin/businesses/canvass/route.ts");
  assert.ok(routeSrc.includes("startDiscoverySession"));
  assert.ok(routeSrc.includes('"@/app/lib/business/livingBook/repository"'));
  assert.ok(routeSrc.includes('sessionType: "staff_interview"'));
});

// 21. Question registry reuse (no second discovery-question engine)
check("21. No second discovery-question engine created (questionRegistry.ts not duplicated)", () => {
  assert.ok(!exists("app/lib/business/fieldDiscovery/questionRegistry.ts"), "must reuse livingBook/questionRegistry.ts, not duplicate it");
});

// 22-25. Website adapter safety
check("22-25. Website adapter has timeout, redirect limit, response-size limit, and SSRF protection", () => {
  const src = read("app/lib/business/aiResearch/websiteAdapter.ts");
  assert.ok(src.includes("FETCH_TIMEOUT_MS"));
  assert.ok(src.includes("MAX_REDIRECTS"));
  assert.ok(src.includes("MAX_RESPONSE_BYTES"));
  assert.ok(src.includes("BLOCKED_HOSTNAME_PATTERNS"));
  assert.ok(src.includes("checkWebsiteUrlSafety"));
});

// 26-27. Unsupported/manual source truth, no fake Google/social integration
check("26-27. Source registry declares manual-only truth — no fake Google/social integration claimed", () => {
  const src = read("app/lib/business/fieldDiscovery/sourceRegistry.ts");
  assert.ok(src.includes('researchSupport: "manual_only"'));
  assert.ok(src.includes('researchSupport: "live_v1"'));
  const websiteEntry = src.slice(src.indexOf('sourceKey: "website"'), src.indexOf('sourceKey: "google_business"'));
  assert.ok(websiteEntry.includes('researchSupport: "live_v1"'));
  const googleEntry = src.slice(src.indexOf('sourceKey: "google_business"'), src.indexOf('sourceKey: "facebook"'));
  assert.ok(googleEntry.includes('researchSupport: "manual_only"'), "google_business must remain manual_only in V1");
});

// 28. ES/EN UI states
check("28. Canvass UI has ES/EN copy", () => {
  const src = read("app/admin/(dashboard)/businesses/canvass/CanvassForm.tsx");
  assert.ok(/Nombre del negocio/.test(src) && /Business name/.test(src));
});

// 29. Mobile canvassing page
check("29. Canvass page is mobile-first (max-w constrained single column)", () => {
  const pageSrc = read("app/admin/(dashboard)/businesses/canvass/page.tsx");
  assert.ok(pageSrc.includes("max-w-xl"));
});

// 30. No Production reference
check("30. No Production reference or secret literal in any Gate 4A file", () => {
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^"'`]|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|xuieateniufcrsfdomwl/i;
  for (const rel of [MIGRATION_PATH, ...AUTHORIZED_LIB_FILES, ...AUTHORIZED_API_FILES, ...AUTHORIZED_UI_FILES]) {
    assert.ok(!secretPattern.test(read(rel)), `${rel} matched a secret/production-ref pattern`);
  }
});

check("Migration is one transaction, additive only, no destructive statement", () => {
  assert.strictEqual((MIGRATION.match(/^\s*BEGIN;/m) ?? []).length, 1);
  assert.strictEqual((MIGRATION.match(/^\s*COMMIT;/m) ?? []).length, 1);
  assert.ok(!/^DROP TABLE|^DROP FUNCTION|^DROP INDEX|^TRUNCATE|^DELETE FROM/im.test(MIGRATION), "must not contain destructive DROP TABLE/FUNCTION/INDEX or TRUNCATE/DELETE");
  // DROP TRIGGER IF EXISTS is allowed — it's the standard idempotent pattern (DROP IF EXISTS + CREATE)
});

check("Business creation RPC exists and is service_role-only (no authenticated grant)", () => {
  assert.ok(MIGRATION.includes("CREATE OR REPLACE FUNCTION public.create_staff_canvassed_business"));
  assert.ok(MIGRATION.includes("GRANT EXECUTE ON FUNCTION public.create_staff_canvassed_business(text, text, text, uuid) TO service_role;"));
  assert.ok(!/GRANT EXECUTE ON FUNCTION public\.create_staff_canvassed_business.*TO authenticated/.test(MIGRATION));
});

check("Business creation RPC never creates a membership or auth.users row", () => {
  const start = MIGRATION.indexOf("CREATE OR REPLACE FUNCTION public.create_staff_canvassed_business");
  const end = MIGRATION.indexOf("REVOKE ALL ON FUNCTION public.create_staff_canvassed_business", start);
  const body = MIGRATION.slice(start, end);
  assert.ok(!body.includes("INSERT INTO public.business_memberships"));
  assert.ok(!body.includes("INSERT INTO auth.users"));
  assert.ok(body.includes("INSERT INTO public.businesses"));
});

// Owner-guard prospect-stage exemption
check("36. assert_business_has_one_active_owner modified with prospect-stage exemption", () => {
  assert.ok(
    MIGRATION.includes("CREATE OR REPLACE FUNCTION public.assert_business_has_one_active_owner()"),
    "must redefine assert_business_has_one_active_owner",
  );
  assert.ok(
    MIGRATION.includes("biz_creation_source = 'staff_assisted' AND biz_onboarding_status = 'not_started'"),
    "must exempt staff_assisted AND not_started businesses",
  );
});

check("37. assert_business_has_one_active_owner_for_membership_change modified with prospect-stage exemption", () => {
  assert.ok(
    MIGRATION.includes("CREATE OR REPLACE FUNCTION public.assert_business_has_one_active_owner_for_membership_change()"),
    "must redefine assert_business_has_one_active_owner_for_membership_change",
  );
});

check("38. businesses_onboarding_advance_guard UPDATE trigger added", () => {
  assert.ok(
    MIGRATION.includes("CREATE CONSTRAINT TRIGGER businesses_onboarding_advance_guard"),
    "must add businesses_onboarding_advance_guard trigger",
  );
  assert.ok(
    MIGRATION.includes("AFTER UPDATE ON public.businesses"),
    "trigger must fire AFTER UPDATE on businesses",
  );
  assert.ok(
    /DEFERRABLE INITIALLY DEFERRED/.test(MIGRATION),
    "trigger must be DEFERRABLE INITIALLY DEFERRED",
  );
});

check("39. Owner-guard exemption is narrow (only staff_assisted + not_started)", () => {
  // Count occurrences of the exemption condition — should be exactly 2 (both functions)
  const exemptCount = (MIGRATION.match(/biz_creation_source = 'staff_assisted' AND biz_onboarding_status = 'not_started'/g) ?? []).length;
  assert.strictEqual(exemptCount, 2, `expected 2 exemption conditions, found ${exemptCount}`);
  // Must still raise exception for non-exempt businesses
  assert.ok(MIGRATION.includes("must have exactly one active primary owner"), "must preserve original exception");
});

// Same-business consent enforcement — composite unique key + composite FKs
check("31. business_consent_records has UNIQUE(id, business_id) composite key", () => {
  assert.ok(
    MIGRATION.includes("CONSTRAINT business_consent_records_id_business_key UNIQUE (id, business_id)"),
    "must have UNIQUE(id, business_id) constraint on business_consent_records",
  );
});

check("32. business_source_links has composite same-business consent FK", () => {
  assert.ok(
    MIGRATION.includes("CONSTRAINT business_source_links_consent_same_business_fk"),
    "must have business_source_links_consent_same_business_fk constraint",
  );
  assert.ok(
    MIGRATION.includes("FOREIGN KEY (consent_record_id, business_id)\n    REFERENCES public.business_consent_records(id, business_id)"),
    "must have composite FK (consent_record_id, business_id) -> business_consent_records(id, business_id)",
  );
  // Must NOT have a simple inline FK to business_consent_records(id) only
  const linksTableStart = MIGRATION.indexOf("CREATE TABLE IF NOT EXISTS public.business_source_links");
  const linksTableEnd = MIGRATION.indexOf("CREATE INDEX", linksTableStart);
  const linksTableDef = MIGRATION.slice(linksTableStart, linksTableEnd);
  assert.ok(
    !/consent_record_id\s+uuid\s+NULL\s+REFERENCES\s+public\.business_consent_records\(id\)/.test(linksTableDef),
    "must not have a simple inline consent FK — composite FK only",
  );
});

check("33. business_source_files has composite same-business consent FK", () => {
  assert.ok(
    MIGRATION.includes("CONSTRAINT business_source_files_consent_same_business_fk"),
    "must have business_source_files_consent_same_business_fk constraint",
  );
  const filesTableStart = MIGRATION.indexOf("CREATE TABLE IF NOT EXISTS public.business_source_files");
  const filesTableEnd = MIGRATION.indexOf("CREATE INDEX", filesTableStart);
  const filesTableDef = MIGRATION.slice(filesTableStart, filesTableEnd);
  assert.ok(
    filesTableDef.includes("FOREIGN KEY (consent_record_id, business_id)\n    REFERENCES public.business_consent_records(id, business_id)"),
    "must have composite FK (consent_record_id, business_id) -> business_consent_records(id, business_id)",
  );
  assert.ok(
    !/consent_record_id\s+uuid\s+NULL\s+REFERENCES\s+public\.business_consent_records\(id\)/.test(filesTableDef),
    "must not have a simple inline consent FK — composite FK only",
  );
});

check("34. No cross-business consent reference allowed structurally (composite FKs enforce same business)", () => {
  // Both composite FKs reference (id, business_id) — PostgreSQL rejects a row whose
  // (consent_record_id, business_id) pair does not exist in business_consent_records.
  // This structurally prevents referencing a consent row from another business.
  const fkCount = (MIGRATION.match(/FOREIGN KEY \(consent_record_id, business_id\)\s+REFERENCES public\.business_consent_records\(id, business_id\)/g) ?? []).length;
  assert.strictEqual(fkCount, 2, `expected 2 composite consent FKs, found ${fkCount}`);
});

check("35. Delete semantics preserve business_id (ON DELETE RESTRICT on composite consent FKs)", () => {
  // ON DELETE RESTRICT prevents deleting a consent row that is still referenced.
  // This never nulls or modifies business_id — it blocks the delete entirely.
  const restrictCount = (MIGRATION.match(/ON DELETE RESTRICT/g) ?? []).length;
  assert.ok(restrictCount >= 2, `expected at least 2 ON DELETE RESTRICT, found ${restrictCount}`);
  // Extract just the two composite consent FK constraint blocks and verify each uses RESTRICT, not SET NULL
  const consentFkPattern = /CONSTRAINT business_source_(?:links|files)_consent_same_business_fk\s+FOREIGN KEY \(consent_record_id, business_id\)\s+REFERENCES public\.business_consent_records\(id, business_id\)\s+ON DELETE (RESTRICT|SET NULL|CASCADE|NO ACTION)/g;
  let match: RegExpExecArray | null;
  let foundCount = 0;
  while ((match = consentFkPattern.exec(MIGRATION)) !== null) {
    foundCount++;
    assert.strictEqual(match[1], "RESTRICT", `composite consent FK must use ON DELETE RESTRICT, found ${match[1]}`);
  }
  assert.strictEqual(foundCount, 2, `expected 2 composite consent FK blocks, found ${foundCount}`);
});

const total = passed + failed;
console.log(`\n${passed}/${total} passed`);
if (failed > 0) process.exit(1);
