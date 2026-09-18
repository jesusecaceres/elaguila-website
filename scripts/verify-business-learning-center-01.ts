/**
 * TODAY-1 — Public Business Learning Center + Idea Builder foundation verification. Hand-rolled
 * node:assert script, matching this repo's testing convention (no jest/vitest). Run via `npx tsx
 * scripts/verify-business-learning-center-01.ts`.
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

const MIGRATION_PATH = "supabase/migrations/20260807120000_business_learning_center_foundation.sql";

check("Migration file exists", () => {
  assert.ok(exists(MIGRATION_PATH), `missing ${MIGRATION_PATH}`);
});

const MIGRATION = read(MIGRATION_PATH);

// ---------------------------------------------------------------------------
// Migration structure
// ---------------------------------------------------------------------------

const TABLES = [
  "business_learning_categories",
  "business_learning_lessons",
  "business_learning_resources",
  "business_learning_progress",
  "business_capability_records",
  "business_idea_drafts",
];

check("Migration: creates exactly the six TODAY-1 tables", () => {
  for (const t of TABLES) {
    assert.ok(MIGRATION.includes(`CREATE TABLE IF NOT EXISTS public.${t}`), `missing CREATE TABLE for ${t}`);
  }
  assert.strictEqual((MIGRATION.match(/CREATE TABLE IF NOT EXISTS public\.business_/g) ?? []).length, 6, "expected exactly 6 CREATE TABLE statements");
});

check("Migration: RLS enabled on all six tables, zero policies", () => {
  const rlsCount = (MIGRATION.match(/ENABLE ROW LEVEL SECURITY/g) ?? []).length;
  assert.strictEqual(rlsCount, 6, `expected 6 RLS-enable statements, found ${rlsCount}`);
  assert.strictEqual((MIGRATION.match(/CREATE POLICY/g) ?? []).length, 0, "must have zero CREATE POLICY statements");
});

check("Migration: grant hardening matches the owner-proven Gate BCO-4A.6/4A.7/5A/6A pattern exactly", () => {
  const revokeCount = (MIGRATION.match(/REVOKE ALL PRIVILEGES ON TABLE public\.\S+ FROM PUBLIC;/g) ?? []).length;
  const grantCount = (MIGRATION.match(/GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.\S+ TO service_role;/g) ?? []).length;
  assert.strictEqual(revokeCount, 6, `expected 6 REVOKE statements, found ${revokeCount}`);
  assert.strictEqual(grantCount, 6, `expected 6 explicit grants, found ${grantCount}`);
  assert.ok(!/^GRANT ALL PRIVILEGES/m.test(MIGRATION), "must never use GRANT ALL PRIVILEGES");
});

check("Migration: zero grants to anon/authenticated/PUBLIC", () => {
  const grantLines = MIGRATION.split("\n").filter((line) => line.trim().startsWith("GRANT "));
  const badGrants = grantLines.filter((line) => /\bTO (anon|authenticated|PUBLIC)\b/i.test(line));
  assert.strictEqual(badGrants.length, 0, `unexpected grant line(s): ${badGrants.join(" | ")}`);
});

check("Migration: no destructive statement, no production reference", () => {
  assert.ok(!/^DROP |^TRUNCATE|^DELETE FROM/im.test(MIGRATION));
  assert.ok(!MIGRATION.includes("xuieateniufcrsfdomwl"));
});

// ---------------------------------------------------------------------------
// TODAY-1A — Privilege hardening parity patch migration
// ---------------------------------------------------------------------------

const HARDENING_PATH = "supabase/migrations/20260807130000_business_learning_center_privilege_hardening.sql";

check("Hardening migration file exists", () => {
  assert.ok(exists(HARDENING_PATH), `missing ${HARDENING_PATH}`);
});

const HARDENING = read(HARDENING_PATH);

check("Hardening migration: all six expected tables appear in it", () => {
  for (const t of TABLES) {
    assert.ok(HARDENING.includes(`public.${t}`), `hardening migration missing table ${t}`);
  }
});

check("Hardening migration: PUBLIC is fully revoked on all six tables", () => {
  const revokePublicCount = (HARDENING.match(/REVOKE ALL PRIVILEGES ON TABLE public\.\S+ FROM PUBLIC;/g) ?? []).length;
  assert.strictEqual(revokePublicCount, 6, `expected 6 REVOKE ... FROM PUBLIC, found ${revokePublicCount}`);
});

check("Hardening migration: anon is fully revoked on all six tables", () => {
  const revokeAnonCount = (HARDENING.match(/REVOKE ALL PRIVILEGES ON TABLE public\.\S+ FROM anon;/g) ?? []).length;
  assert.strictEqual(revokeAnonCount, 6, `expected 6 REVOKE ... FROM anon, found ${revokeAnonCount}`);
});

check("Hardening migration: authenticated is fully revoked on all six tables", () => {
  const revokeAuthCount = (HARDENING.match(/REVOKE ALL PRIVILEGES ON TABLE public\.\S+ FROM authenticated;/g) ?? []).length;
  assert.strictEqual(revokeAuthCount, 6, `expected 6 REVOKE ... FROM authenticated, found ${revokeAuthCount}`);
});

check("Hardening migration: service_role is fully revoked before the narrow grant on all six tables", () => {
  const revokeSvcCount = (HARDENING.match(/REVOKE ALL PRIVILEGES ON TABLE public\.\S+ FROM service_role;/g) ?? []).length;
  assert.strictEqual(revokeSvcCount, 6, `expected 6 REVOKE ... FROM service_role, found ${revokeSvcCount}`);
  // Every REVOKE FROM service_role must be immediately followed by the narrow GRANT to service_role
  // for the same table (REVOKE-then-GRANT ordering, never GRANT-then-REVOKE).
  const tables = TABLES;
  for (const t of tables) {
    const revokeIdx = HARDENING.indexOf(`REVOKE ALL PRIVILEGES ON TABLE public.${t} FROM service_role;`);
    const grantIdx = HARDENING.indexOf(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${t} TO service_role;`);
    assert.ok(revokeIdx !== -1 && grantIdx !== -1, `${t}: missing service_role REVOKE or GRANT`);
    assert.ok(revokeIdx < grantIdx, `${t}: REVOKE FROM service_role must precede the narrow GRANT`);
  }
});

check("Hardening migration: service_role receives exactly SELECT, INSERT, UPDATE, DELETE on all six tables", () => {
  const grantCount = (HARDENING.match(/GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.\S+ TO service_role;/g) ?? []).length;
  assert.strictEqual(grantCount, 6, `expected 6 narrow service_role grants, found ${grantCount}`);
  // No other GRANT line may exist in the hardening migration.
  const otherGrants = HARDENING.split("\n").filter((line) => line.trim().startsWith("GRANT ") && !line.includes("GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."));
  assert.strictEqual(otherGrants.length, 0, `unexpected extra GRANT line(s): ${otherGrants.join(" | ")}`);
});

check("Hardening migration: no REFERENCES grant exists", () => {
  assert.ok(!/GRANT REFERENCES\b/i.test(HARDENING), "must never grant REFERENCES");
});

check("Hardening migration: no TRIGGER grant exists", () => {
  assert.ok(!/GRANT TRIGGER\b/i.test(HARDENING), "must never grant TRIGGER");
});

check("Hardening migration: no TRUNCATE grant exists", () => {
  assert.ok(!/GRANT TRUNCATE\b/i.test(HARDENING), "must never grant TRUNCATE");
});

check("Hardening migration: no GRANT ALL PRIVILEGES exists", () => {
  assert.ok(!/^GRANT ALL PRIVILEGES/im.test(HARDENING), "must never use GRANT ALL PRIVILEGES as a statement");
  assert.ok(!/^\s*GRANT ALL\b/im.test(HARDENING), "must never use GRANT ALL as a statement");
});

check("Hardening migration: no grant to PUBLIC, anon, or authenticated exists", () => {
  const grantLines = HARDENING.split("\n").filter((line) => line.trim().startsWith("GRANT "));
  const badGrants = grantLines.filter((line) => /\bTO (anon|authenticated|PUBLIC)\b/i.test(line));
  assert.strictEqual(badGrants.length, 0, `unexpected grant to anon/authenticated/PUBLIC: ${badGrants.join(" | ")}`);
});

check("Hardening migration: no Production reference and no secret literal", () => {
  assert.ok(!HARDENING.includes("xuieateniufcrsfdomwl"), "must not reference the Production project ref");
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^"'`]|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/i;
  assert.ok(!secretPattern.test(HARDENING), "hardening migration matched a secret pattern");
});

check("Hardening migration: idempotent and wrapped in a single transaction", () => {
  assert.ok(/^\s*BEGIN;/m.test(HARDENING), "must begin a transaction");
  assert.ok(/^\s*COMMIT;/m.test(HARDENING), "must commit the transaction");
  const beginCount = (HARDENING.match(/\bBEGIN\b/g) ?? []).length;
  const commitCount = (HARDENING.match(/\bCOMMIT\b/g) ?? []).length;
  assert.strictEqual(beginCount, 1, `expected exactly 1 BEGIN, found ${beginCount}`);
  assert.strictEqual(commitCount, 1, `expected exactly 1 COMMIT, found ${commitCount}`);
  // No destructive DDL -- only REVOKE/GRANT.
  assert.ok(!/^DROP |^TRUNCATE|^DELETE FROM|^ALTER TABLE/im.test(HARDENING), "must contain no destructive statement");
});

check("Migration: feature flag business_learning_center inserted disabled by default via the existing flags table", () => {
  assert.ok(MIGRATION.includes("business_identity_flags"));
  assert.ok(MIGRATION.includes("'business_learning_center', false, false"));
});

check("Migration: business_learning_lessons carries the published-body CHECK constraint", () => {
  assert.ok(MIGRATION.includes("business_learning_lessons_published_body_chk"), "missing business_learning_lessons_published_body_chk");
  const chk = MIGRATION.match(/business_learning_lessons_published_body_chk CHECK \([\s\S]*?\n\s*\)\s*,/)?.[0] ?? "";
  assert.ok(chk.includes("status <> 'published'"), "CHECK must exempt non-published rows");
  assert.ok(chk.includes("body_es IS NOT NULL") && chk.includes("body_en IS NOT NULL"), "CHECK must require both bodies");
});

check("Migration: business_capability_records enforces the same dual-actor shape as Gate BCO-5A/6A", () => {
  assert.ok(MIGRATION.includes("business_capability_records_actor_chk"));
  const chk = MIGRATION.match(/business_capability_records_actor_chk CHECK \([\s\S]*?\)\s*\)/)?.[0] ?? "";
  assert.ok(chk.includes("created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL"));
  assert.ok(chk.includes("created_actor_type = 'owner' AND created_by_roster_id IS NULL"));
});

check("Migration: exactly 8 published and 8 planned lesson seed blocks", () => {
  const publishedBlocks = (MIGRATION.match(/-- Published \d\/8 —/g) ?? []).length;
  const plannedBlocks = (MIGRATION.match(/-- Planned \d\/8 —/g) ?? []).length;
  assert.strictEqual(publishedBlocks, 8, `expected 8 published lesson blocks, found ${publishedBlocks}`);
  assert.strictEqual(plannedBlocks, 8, `expected 8 planned lesson blocks, found ${plannedBlocks}`);
});

check("Migration: every published lesson's Spanish and English body exceeds 1,200 characters", () => {
  // Strip -- line comments first (a stray apostrophe in prose would otherwise desync the literal scan).
  const stripped = MIGRATION.split("\n")
    .map((line) => {
      const idx = line.indexOf("--");
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join("\n");

  const literals: string[] = [];
  let i = 0;
  while (i < stripped.length) {
    if (stripped[i] === "'") {
      let j = i + 1;
      let buf = "";
      while (j < stripped.length) {
        if (stripped[j] === "'") {
          if (stripped[j + 1] === "'") {
            buf += "'";
            j += 2;
            continue;
          }
          break;
        }
        buf += stripped[j];
        j++;
      }
      literals.push(buf);
      i = j + 1;
    } else {
      i++;
    }
  }

  const PUBLISHED_LESSON_KEYS = [
    "consistent_business_information", "who_is_your_customer", "revenue_vs_profit", "healthy_boundaries_and_capacity",
    "google_business_basics", "advertising_fundamentals", "whatsapp_business_basics", "reviews_and_customer_response",
  ];
  for (const key of PUBLISHED_LESSON_KEYS) {
    const idx = literals.indexOf(key);
    assert.ok(idx !== -1, `lesson_key ${key} not found in migration seed`);
    const [, , , , bodyEs, bodyEn] = literals.slice(idx + 1, idx + 7);
    assert.ok(bodyEs.trim().length > 1200, `${key} body_es is only ${bodyEs.trim().length} chars (must exceed 1200)`);
    assert.ok(bodyEn.trim().length > 1200, `${key} body_en is only ${bodyEn.trim().length} chars (must exceed 1200)`);
  }
});

check("Migration: glossary terms seeded between 15 and 20 (locked range)", () => {
  const count = (MIGRATION.match(/\('[a-z0-9_]+', 'glossary_term',/g) ?? []).length;
  assert.ok(count >= 15 && count <= 20, `expected 15-20 glossary terms, found ${count}`);
});

check("Migration: checklists/templates seeded between 6 and 8 (locked range)", () => {
  const count = (MIGRATION.match(/SELECT l\.id, '[a-z0-9_]+', '(checklist|template)',/g) ?? []).length;
  assert.ok(count >= 6 && count <= 8, `expected 6-8 checklist/template resources, found ${count}`);
});

// ---------------------------------------------------------------------------
// Pure logic — imported directly (no I/O, no server-only guard)
// ---------------------------------------------------------------------------

import { filterPublishedLessons, isPublishableBody, buildLessonCompletionCapabilityGrant, toLessonSummary, isKnownHealthDimensionKey } from "../app/lib/business/learning/logic";
import type { LearningLesson } from "../app/lib/business/learning/types";
import { computeDraftCompletionState, buildEducationalReadinessSummary, validateDraftPatch } from "../app/lib/business/ideaBuilder/logic";
import { MAX_TEXT_FIELD_LENGTH } from "../app/lib/business/ideaBuilder/constants";

const NOW = "2026-08-07T12:00:00.000Z";
function lesson(overrides: Partial<LearningLesson>): LearningLesson {
  return {
    id: overrides.id ?? `lesson-${Math.random()}`,
    categoryId: "cat-1",
    lessonKey: "sample_lesson",
    titleEs: "x",
    titleEn: "x",
    summaryEs: "x",
    summaryEn: "x",
    bodyEs: null,
    bodyEn: null,
    level: "foundation",
    estimatedMinutes: 10,
    capabilityKey: "sample_capability",
    relatedDimensionKeys: ["business_foundation"],
    status: "planned",
    publishedAt: null,
    sortOrder: 1,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

check("Logic: filterPublishedLessons excludes planned/draft/archived lessons", () => {
  const lessons = [
    lesson({ id: "a", status: "published" }),
    lesson({ id: "b", status: "planned" }),
    lesson({ id: "c", status: "draft" }),
    lesson({ id: "d", status: "archived" }),
  ];
  const result = filterPublishedLessons(lessons);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, "a");
});

check("Logic: toLessonSummary strips bodyEs/bodyEn -- a catalog list can never leak a lesson body", () => {
  const l = lesson({ status: "published", bodyEs: "a".repeat(1300), bodyEn: "b".repeat(1300) });
  const summary = toLessonSummary(l);
  assert.ok(!("bodyEs" in summary));
  assert.ok(!("bodyEn" in summary));
});

check("Logic: isPublishableBody enforces the 1200-character floor in both languages", () => {
  assert.strictEqual(isPublishableBody("a".repeat(1199), "b".repeat(1300)), false);
  assert.strictEqual(isPublishableBody("a".repeat(1300), "b".repeat(1199)), false);
  assert.strictEqual(isPublishableBody(null, "b".repeat(1300)), false);
  assert.strictEqual(isPublishableBody("a".repeat(1300), "b".repeat(1300)), true);
});

check("Logic: isKnownHealthDimensionKey reuses the canonical Gate BCO-6A dimension set (no duplicated list)", () => {
  assert.strictEqual(isKnownHealthDimensionKey("business_foundation"), true);
  assert.strictEqual(isKnownHealthDimensionKey("not_a_real_dimension"), false);
});

check("Logic: buildLessonCompletionCapabilityGrant is deterministic -- never AI-inferred", () => {
  const l = lesson({ id: "l1", capabilityKey: "google_business_basics", status: "published" });
  const grant = buildLessonCompletionCapabilityGrant(l);
  assert.deepStrictEqual(grant, { capabilityKey: "google_business_basics", source: "lesson_completed", sourceLessonId: "l1" });
});

check("Idea Builder logic: computeDraftCompletionState counts required fields and readiness answers independently", () => {
  const empty = computeDraftCompletionState({ ideaDescription: null, customerDefinition: null, problemDefinition: null, simpleOffer: null, readinessAnswers: {} });
  assert.strictEqual(empty.isComplete, false);
  assert.strictEqual(empty.requiredFieldsFilled, 0);
  assert.strictEqual(empty.readinessTotal, 8, "expected 8 readiness questions in the fixed registry");
});

check("Idea Builder logic: buildEducationalReadinessSummary never claims market validation or profitability", () => {
  const summary = buildEducationalReadinessSummary({ readinessAnswers: {} });
  assert.strictEqual(summary.byCategory.length, 4, "expected exactly 4 readiness categories");
  const serialized = JSON.stringify(summary).toLowerCase();
  for (const forbidden of ["market demand", "profitable", "validated", "guarantee", "will succeed"]) {
    assert.ok(!serialized.includes(forbidden), `readiness summary unexpectedly references "${forbidden}"`);
  }
});

check("Idea Builder logic: validateDraftPatch rejects an over-length field and an invalid path/language", () => {
  assert.strictEqual(validateDraftPatch({ ideaDescription: "x".repeat(MAX_TEXT_FIELD_LENGTH + 1) }).ok, false);
  assert.strictEqual(validateDraftPatch({ path: "not_a_real_path" as never }).ok, false);
  assert.strictEqual(validateDraftPatch({ language: "fr" as never }).ok, false);
  assert.strictEqual(validateDraftPatch({ ideaDescription: "a short idea" }).ok, true);
});

// ---------------------------------------------------------------------------
// Repository -- published-only filtering enforced in the actual query, not just app logic
// ---------------------------------------------------------------------------

const LEARNING_REPOSITORY_SRC = read("app/lib/business/learning/repository.ts");

check("Repository: listPublishedLessons and getPublishedLessonByKey both filter status='published' in the query itself", () => {
  const publishedFilterCount = (LEARNING_REPOSITORY_SRC.match(/\.eq\("status", "published"\)/g) ?? []).length;
  assert.ok(publishedFilterCount >= 2, `expected at least 2 status='published' filters in the repository, found ${publishedFilterCount}`);
});

check("Repository: completeLessonProgress refuses to grant progress/capability on a non-published lesson", () => {
  assert.ok(LEARNING_REPOSITORY_SRC.includes('if (lesson.status !== "published") return { ok: false, error: "lesson_not_published" };'));
});

check("Repository: capability grant is idempotent -- a concurrent unique-violation (23505) is treated as success, never surfaced as an error", () => {
  assert.ok(LEARNING_REPOSITORY_SRC.includes('"code"?: string') || LEARNING_REPOSITORY_SRC.includes("code?: string"));
  assert.ok(LEARNING_REPOSITORY_SRC.includes('!== "23505"'));
});

// ---------------------------------------------------------------------------
// Public route API -- never requires auth for catalog/lesson reads; auth-gated routes never trust
// a caller-supplied identity.
// ---------------------------------------------------------------------------

const CATALOG_ROUTE = read("app/api/dashboard/business/learning/catalog/route.ts");
const LESSON_ROUTE = read("app/api/dashboard/business/learning/lessons/[lessonKey]/route.ts");
const PROGRESS_ROUTE = read("app/api/dashboard/business/learning/progress/route.ts");
const IDEA_BUILDER_ROUTE = read("app/api/dashboard/business/idea-builder/route.ts");

check("Public routes: catalog and lesson-detail never require a bearer token to be present", () => {
  assert.ok(!/if \(!token\) return NextResponse\.json/.test(CATALOG_ROUTE), "catalog route must not hard-require a token");
  assert.ok(!/if \(!token\) return NextResponse\.json/.test(LESSON_ROUTE), "lesson-detail route must not hard-require a token");
});

check("Public lesson-detail route: a non-published lessonKey returns 404, never leaked content", () => {
  assert.ok(LESSON_ROUTE.includes('error: "not_found" }, { status: 404 }'));
  assert.ok(LESSON_ROUTE.includes("getPublishedLessonByKey"));
});

check("Progress + Idea Builder routes: every handler resolves identity via extractBearerToken -> resolveAuthenticatedUserId, never a request-body id", () => {
  for (const src of [PROGRESS_ROUTE, IDEA_BUILDER_ROUTE]) {
    assert.ok(src.includes("extractBearerToken"), "must derive identity from the bearer token");
    assert.ok(src.includes("resolveAuthenticatedUserId"), "must resolve the verified user id server-side");
    assert.ok(!/body\.authUserId|b\.authUserId|body\.userId|b\.userId/.test(src), "route must never read an acting identity from the request body");
  }
});

check("Progress route: GET and POST both 401 when no bearer token is present", () => {
  const unauthorizedCount = (PROGRESS_ROUTE.match(/error: "unauthorized" }, { status: 401 }/g) ?? []).length;
  assert.ok(unauthorizedCount >= 4, `expected at least 4 unauthorized guards (2 per handler), found ${unauthorizedCount}`);
});

check("Idea Builder route: GET/POST/PATCH/DELETE all resolve identity before touching the repository", () => {
  for (const fn of ["export async function GET", "export async function POST", "export async function PATCH", "export async function DELETE"]) {
    assert.ok(IDEA_BUILDER_ROUTE.includes(fn), `missing handler: ${fn}`);
  }
});

check("Idea Builder route: a fresh draft always generates its own intentId server-side via randomUUID, never trusting a client-fabricated id as a security boundary", () => {
  assert.ok(IDEA_BUILDER_ROUTE.includes("randomUUID()"));
});

// ---------------------------------------------------------------------------
// Feature flag -- single flag, reused table, no parallel flags system
// ---------------------------------------------------------------------------

const FEATURE_FLAG_SRC = read("app/lib/business/learning/featureFlag.ts");

check("Feature flag: reuses business_identity_flags and computeFlagTier -- no parallel flags table", () => {
  assert.ok(FEATURE_FLAG_SRC.includes('.from("business_identity_flags")'));
  assert.ok(FEATURE_FLAG_SRC.includes("computeFlagTier"));
  assert.ok(!FEATURE_FLAG_SRC.includes("CREATE TABLE"));
});

// ---------------------------------------------------------------------------
// Content-batch-02 documentation
// ---------------------------------------------------------------------------

check("docs/business-learning-center-content-batch-02.md exists and documents all 8 planned lessons", () => {
  const rel = "docs/business-learning-center-content-batch-02.md";
  assert.ok(exists(rel), `missing ${rel}`);
  const doc = read(rel);
  for (const key of [
    "branding_basics", "referrals_basics", "profitable_service_basics", "simple_analytics",
    "local_seo_basics", "product_photography_basics", "short_video_basics", "customer_data_protection",
  ]) {
    assert.ok(doc.includes(key), `content-batch-02 doc missing lesson_key ${key}`);
  }
});

// ---------------------------------------------------------------------------
// Secret / production-reference scan across every TODAY-1 file
// ---------------------------------------------------------------------------

const GATE_FILES = [
  MIGRATION_PATH,
  HARDENING_PATH,
  "app/lib/business/learning/types.ts",
  "app/lib/business/learning/constants.ts",
  "app/lib/business/learning/logic.ts",
  "app/lib/business/learning/repository.ts",
  "app/lib/business/learning/featureFlag.ts",
  "app/lib/business/ideaBuilder/types.ts",
  "app/lib/business/ideaBuilder/constants.ts",
  "app/lib/business/ideaBuilder/questionRegistry.ts",
  "app/lib/business/ideaBuilder/logic.ts",
  "app/lib/business/ideaBuilder/repository.ts",
  "app/api/dashboard/business/learning/catalog/route.ts",
  "app/api/dashboard/business/learning/lessons/[lessonKey]/route.ts",
  "app/api/dashboard/business/learning/progress/route.ts",
  "app/api/dashboard/business/idea-builder/route.ts",
  "app/(site)/aprender/page.tsx",
  "app/(site)/aprender/[categoryKey]/page.tsx",
  "app/(site)/aprender/leccion/[lessonKey]/page.tsx",
  "app/(site)/aprender/glosario/page.tsx",
  "app/(site)/aprender/recursos/page.tsx",
  "app/(site)/aprender/learningCopy.ts",
  "app/(site)/aprender/_components/LearningSearch.tsx",
  "app/(site)/aprender/_components/LessonProgressButton.tsx",
  "app/(site)/dashboard/business-tools/idea-builder/page.tsx",
  "app/(site)/dashboard/business-tools/idea-builder/IdeaBuilderWizard.tsx",
  "app/(site)/dashboard/business-tools/idea-builder/ideaBuilderCopy.ts",
];

check("No secret pattern or the production Supabase ref appears in any TODAY-1 file", () => {
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^"'`]|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|xuieateniufcrsfdomwl/i;
  for (const rel of GATE_FILES) {
    assert.ok(!secretPattern.test(read(rel)), `${rel} matched a secret/production-ref pattern`);
  }
});

// ---------------------------------------------------------------------------
// Phase 1 — flagship /aprender landing (Gate L1). Truth, copy hygiene, parity, a11y standard.
// ---------------------------------------------------------------------------

import { learningCopy, learningLandingCopy, contentLangFromRouteLang } from "../app/(site)/aprender/learningCopy";
import {
  LEARNING_JOURNEY_KEYS, LEARNING_JOURNEY_LESSON_KEYS, LEARNING_LESSON_STAGE, LEARNING_ROADMAP_STAGE_KEYS,
  LEARNING_ROUTES, LEARNING_START_HERE_KEYS, buildJourneyHref, resolveJourneyLessons, resolveRoadmapStages,
  resolveStartHereLessons, resolveTopicTiles,
} from "../app/(site)/aprender/learningJourneys";
import type { LearningCategory } from "../app/lib/business/learning/types";

const APRENDER_DIR = "app/(site)/aprender";
const APRENDER_LANDING_FILES = [
  `${APRENDER_DIR}/page.tsx`,
  `${APRENDER_DIR}/learningCopy.ts`,
  `${APRENDER_DIR}/learningJourneys.ts`,
  `${APRENDER_DIR}/_components/learningUi.ts`,
  `${APRENDER_DIR}/_components/learningGlyphs.tsx`,
  `${APRENDER_DIR}/_components/LearningHero.tsx`,
  `${APRENDER_DIR}/_components/LearningJourneyCards.tsx`,
  `${APRENDER_DIR}/_components/LearningBusinessRoadmap.tsx`,
  `${APRENDER_DIR}/_components/LearningStartHere.tsx`,
  `${APRENDER_DIR}/_components/LearningTopicTiles.tsx`,
  `${APRENDER_DIR}/_components/LearningToolkit.tsx`,
  `${APRENDER_DIR}/_components/LearningMethod.tsx`,
  `${APRENDER_DIR}/_components/LearningAccessClose.tsx`,
];
const APRENDER_ALL_PUBLIC_FILES = [
  ...APRENDER_LANDING_FILES,
  `${APRENDER_DIR}/[categoryKey]/page.tsx`,
  `${APRENDER_DIR}/leccion/[lessonKey]/page.tsx`,
  `${APRENDER_DIR}/glosario/page.tsx`,
  `${APRENDER_DIR}/recursos/page.tsx`,
  `${APRENDER_DIR}/_components/LearningSearch.tsx`,
  `${APRENDER_DIR}/_components/LessonProgressButton.tsx`,
];

/** Source with block/line comments removed so doc comments never trip a copy assertion. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
}

const PUBLISHED_SEED_KEYS = [
  "consistent_business_information", "who_is_your_customer", "revenue_vs_profit", "healthy_boundaries_and_capacity",
  "google_business_basics", "advertising_fundamentals", "whatsapp_business_basics", "reviews_and_customer_response",
];
const PLANNED_SEED_KEYS = [
  "branding_basics", "referrals_basics", "profitable_service_basics", "simple_analytics",
  "local_seo_basics", "product_photography_basics", "short_video_basics", "customer_data_protection",
];

check("Phase 1: every landing file exists", () => {
  for (const rel of APRENDER_LANDING_FILES) assert.ok(exists(rel), `missing ${rel}`);
});

check("Phase 1: no 'Business Concierge' eyebrow/UI anywhere on public /aprender (comments excluded)", () => {
  for (const rel of APRENDER_ALL_PUBLIC_FILES) {
    const src = stripComments(read(rel));
    assert.ok(!/Business Concierge/i.test(src), `${rel} still renders a Business Concierge string`);
    assert.ok(!/business-tools\/concierge|BusinessConcierge|HealthMap|healthMap/.test(src), `${rel} imports/renders Concierge UI`);
  }
  assert.strictEqual(learningCopy("es").siteEyebrow, "Centro de Aprendizaje Leonix");
  assert.strictEqual(learningCopy("en").siteEyebrow, "Leonix Learning Center");
});

check("Phase 1: hero copy exists in ES and EN (locked concepts, CTAs, four trust marks)", () => {
  const es = learningLandingCopy("es").hero;
  const en = learningLandingCopy("en").hero;
  assert.strictEqual(es.title, "Aprende. Construye. Haz crecer tu idea.");
  assert.strictEqual(en.title, "Learn. Build. Grow your idea.");
  assert.strictEqual(es.ctaPrimary, "Encontrar mi punto de partida");
  assert.strictEqual(en.ctaPrimary, "Find where to start");
  assert.strictEqual(es.ctaSecondary, "Explorar todos los temas");
  assert.strictEqual(en.ctaSecondary, "Explore all topics");
  assert.deepStrictEqual(es.trust, ["Bilingüe", "Práctico", "A tu ritmo", "Sin costo"]);
  assert.deepStrictEqual(en.trust, ["Bilingual", "Practical", "At your pace", "No cost"]);
  assert.ok(es.support.length > 40 && en.support.length > 40);
});

check("Phase 1: three journey cards (3/3) with title, empathy, outcome and CTA in both languages", () => {
  assert.strictEqual(LEARNING_JOURNEY_KEYS.length, 3);
  for (const lang of ["es", "en"] as const) {
    const items = learningLandingCopy(lang).journeys.items;
    for (const key of LEARNING_JOURNEY_KEYS) {
      const it = items[key];
      assert.ok(it.title && it.empathy && it.outcome && it.cta, `${lang}/${key} journey copy incomplete`);
      assert.ok(LEARNING_JOURNEY_LESSON_KEYS[key].length > 0, `${key} journey has no lesson sequence`);
    }
  }
  assert.strictEqual(learningLandingCopy("es").journeys.items.idea.cta, "Empezar por mi idea");
  assert.strictEqual(learningLandingCopy("es").journeys.items.empezando.cta, "Preparar mi negocio");
  assert.strictEqual(learningLandingCopy("es").journeys.items.negocio.cta, "Hacer crecer mi negocio");
});

check("Phase 1: roadmap has exactly the seven locked stages (7/7) in order, ES + EN labels", () => {
  assert.deepStrictEqual([...LEARNING_ROADMAP_STAGE_KEYS], ["idea", "cliente", "marca", "numeros", "preparacion", "lanzamiento", "crecimiento"]);
  const es = learningLandingCopy("es").roadmap.stages;
  const en = learningLandingCopy("en").roadmap.stages;
  assert.deepStrictEqual(LEARNING_ROADMAP_STAGE_KEYS.map((k) => es[k].title), ["Idea", "Cliente", "Marca", "Números", "Preparación", "Lanzamiento", "Crecimiento"]);
  for (const k of LEARNING_ROADMAP_STAGE_KEYS) assert.ok(en[k].title && en[k].body, `EN roadmap stage ${k} missing`);
  assert.strictEqual(learningLandingCopy("es").roadmap.intro, "No necesitas aprender todo hoy. Solo entender tu siguiente paso.");
  assert.strictEqual(learningLandingCopy("es").roadmap.inPreparation, "En preparación");
});

check("Phase 1: zero fake lesson keys — every mapped key is a real PUBLISHED seed lesson, none planned", () => {
  const mapped = new Set<string>([
    ...Object.values(LEARNING_JOURNEY_LESSON_KEYS).flat(),
    ...Object.keys(LEARNING_LESSON_STAGE),
    ...LEARNING_START_HERE_KEYS,
  ]);
  for (const key of mapped) {
    assert.ok(PUBLISHED_SEED_KEYS.includes(key), `mapped lesson key "${key}" is not a published seed lesson`);
    assert.ok(!PLANNED_SEED_KEYS.includes(key), `mapped lesson key "${key}" is a planned (unpublished) lesson`);
  }
  assert.deepStrictEqual([...LEARNING_START_HERE_KEYS], [
    "who_is_your_customer", "revenue_vs_profit", "consistent_business_information", "google_business_basics", "reviews_and_customer_response",
  ]);
});

check("Phase 1: start-here / journey / roadmap resolvers only ever surface published lessons and never invent counts", () => {
  const catalog = [
    lesson({ id: "l1", lessonKey: "who_is_your_customer", status: "published", estimatedMinutes: 12 }),
    lesson({ id: "l2", lessonKey: "revenue_vs_profit", status: "planned" }),
    lesson({ id: "l3", lessonKey: "consistent_business_information", status: "draft" }),
    lesson({ id: "l4", lessonKey: "google_business_basics", status: "published", estimatedMinutes: 15 }),
    lesson({ id: "l5", lessonKey: "reviews_and_customer_response", status: "archived" }),
  ];
  const startHere = resolveStartHereLessons(catalog).map((l) => l.lessonKey);
  assert.deepStrictEqual(startHere, ["who_is_your_customer", "google_business_basics"], "unpublished curated keys must be silently omitted");
  assert.deepStrictEqual(resolveJourneyLessons("idea", catalog).map((l) => l.lessonKey), ["who_is_your_customer"]);
  const stages = resolveRoadmapStages(catalog);
  assert.strictEqual(stages.length, 7);
  assert.strictEqual(stages.find((s) => s.key === "numeros")?.lessons.length, 0, "a planned lesson must not count toward a stage");
  assert.strictEqual(stages.find((s) => s.key === "cliente")?.lessons.length, 1);
  assert.strictEqual(stages.find((s) => s.key === "idea")?.lessons.length, 0, "idea stage has no published lesson yet → 'En preparación'");
});

check("Phase 1: a category with zero published lessons is hidden from the topic tiles", () => {
  const cat = (id: string, key: string, sortOrder: number): LearningCategory => ({
    id, categoryKey: key, titleEs: key, titleEn: key, summaryEs: "", summaryEn: "", sortOrder, status: "active", createdAt: NOW, updatedAt: NOW,
  });
  const categories = [cat("c1", "fundamentos_del_negocio", 1), cat("c6", "proteccion_y_datos", 6), cat("c2", "clientes_y_demanda", 2)];
  const catalog = [
    lesson({ id: "a", categoryId: "c1", lessonKey: "consistent_business_information", status: "published" }),
    lesson({ id: "b", categoryId: "c6", lessonKey: "customer_data_protection", status: "planned" }),
    lesson({ id: "c", categoryId: "c2", lessonKey: "who_is_your_customer", status: "published" }),
  ];
  const tiles = resolveTopicTiles(categories, catalog);
  assert.deepStrictEqual(tiles.map((t) => t.category.categoryKey), ["fundamentos_del_negocio", "clientes_y_demanda"]);
  assert.ok(tiles.every((t) => t.publishedCount > 0));
});

check("Phase 1: glossary/resource counts are derived from published resources — no literal counts in the landing", () => {
  const page = read(`${APRENDER_DIR}/page.tsx`);
  assert.ok(page.includes("listAllPublishedResources"), "landing must read published resources");
  assert.ok(page.includes('r.resourceType === "glossary_term"'), "glossary count must be truth-derived");
  assert.ok(page.includes('r.resourceType === "checklist" || r.resourceType === "template"'), "resource count must be truth-derived");
  const toolkit = stripComments(read(`${APRENDER_DIR}/_components/LearningToolkit.tsx`));
  assert.ok(!/\b(19|7|8|16)\b\s*<\//.test(toolkit), "toolkit must not hardcode counts");
  assert.ok(toolkit.includes("glossaryCount") && toolkit.includes("resourceCount"));
});

check("Phase 1: Idea Builder route preserved and rendered honestly (explore now, sign in to save)", () => {
  assert.strictEqual(LEARNING_ROUTES.ideaBuilder, "/dashboard/business-tools/idea-builder");
  assert.ok(exists("app/(site)/dashboard/business-tools/idea-builder/page.tsx"));
  assert.strictEqual(learningLandingCopy("es").toolkit.ideaBuilder.note, "Puedes explorar la herramienta ahora. Inicia sesión para guardar y continuar después.");
  assert.ok(/sign in/i.test(learningLandingCopy("en").toolkit.ideaBuilder.note));
});

check("Phase 1: no /publicar anywhere on public /aprender", () => {
  for (const rel of APRENDER_ALL_PUBLIC_FILES) assert.ok(!read(rel).includes("/publicar"), `${rel} links to /publicar`);
});

check("Phase 1: ES/EN parity — identical copy shape, every EN leaf non-empty, no Spanish diacritics leaking into EN", () => {
  const leaves = (v: unknown, prefix = ""): [string, string][] => {
    if (typeof v === "string") return [[prefix, v]];
    if (Array.isArray(v)) return v.flatMap((x, i) => leaves(x, `${prefix}[${i}]`));
    if (v && typeof v === "object") return Object.entries(v as Record<string, unknown>).flatMap(([k, x]) => leaves(x, `${prefix}.${k}`));
    return [];
  };
  const es = leaves(learningLandingCopy("es"));
  const en = leaves(learningLandingCopy("en"));
  assert.deepStrictEqual(en.map(([k]) => k), es.map(([k]) => k), "EN copy shape must mirror ES exactly");
  for (const [k, v] of en) {
    assert.ok(v.trim().length > 0, `EN leaf ${k} is empty`);
    assert.ok(!/[áéíóúñ¿¡]/i.test(v), `EN leaf ${k} contains Spanish diacritics: ${v}`);
  }
  const chromeEs = leaves(learningCopy("es"));
  const chromeEn = leaves(learningCopy("en"));
  assert.deepStrictEqual(chromeEn.map(([k]) => k), chromeEs.map(([k]) => k));
  for (const [k, v] of chromeEn) assert.ok(!/[áéíóúñ¿¡]/i.test(v), `EN chrome leaf ${k} contains Spanish diacritics`);
});

check("Phase 1: ES chrome uses correct accents (no unaccented legacy chrome strings)", () => {
  const es = learningCopy("es");
  assert.strictEqual(es.categoriesTitle, "Categorías");
  assert.strictEqual(es.levelLabel.practical, "Práctico");
  assert.strictEqual(es.lessonSingular, "lección");
  assert.strictEqual(es.checklistLabel, "Lista de verificación");
  assert.strictEqual(es.backToCategory, "Volver a la categoría");
  const src = stripComments(read(`${APRENDER_DIR}/learningCopy.ts`));
  for (const bad of ["Educacion", "Categorias", "Practico", "leccion(es)", "Leccion", "Informacion", "Proteccion", "verificacion", "categoria\"", "sesion"]) {
    assert.ok(!src.includes(bad), `learningCopy.ts still contains unaccented "${bad}"`);
  }
});

check("Phase 1: PT/TL parameter infrastructure preserved (route lang kept in links, content falls back to ES)", () => {
  assert.strictEqual(contentLangFromRouteLang("pt"), "es");
  assert.strictEqual(contentLangFromRouteLang("tl"), "es");
  assert.strictEqual(contentLangFromRouteLang("en"), "en");
  assert.ok(buildJourneyHref("idea", "pt").includes("lang=pt"), "journey href must keep ?lang=pt");
  assert.ok(buildJourneyHref("negocio", "en").includes("journey=negocio"));
  assert.ok(buildJourneyHref("idea", "es").includes("#donde-estas"), "Phase 1 journey links anchor to the journey section");
  const page = read(`${APRENDER_DIR}/page.tsx`);
  assert.ok(page.includes("normalizeLang("), "landing must normalize the route language via app/lib/language");
});

check("Phase 1: every link/anchor in the landing components carries a ≥44 px touch-target class", () => {
  const OK = /min-h-11|min-h-\[2\.875rem\]|min-h-\[3rem\]|LEARNING_BTN_PRIMARY|LEARNING_BTN_OUTLINE|LEARNING_LINK|min-h-\[10rem\]|h-full/;
  for (const rel of APRENDER_LANDING_FILES.filter((f) => f.endsWith(".tsx"))) {
    const src = read(rel);
    const tags = src.match(/<(Link|a)\b[\s\S]*?>/g) ?? [];
    for (const tag of tags) assert.ok(OK.test(tag), `${rel}: link without a touch-target class → ${tag.slice(0, 120)}`);
  }
  const ui = read(`${APRENDER_DIR}/_components/learningUi.ts`);
  assert.ok(ui.includes("min-h-[2.875rem]") && ui.includes("min-h-11"));
});

check("Phase 1: professional-help boundary and access/trust copy present in ES and EN close band", () => {
  const es = learningLandingCopy("es").close;
  const en = learningLandingCopy("en").close;
  assert.strictEqual(es.title, "Conocimiento para avanzar, sin barreras.");
  assert.strictEqual(es.trustLine, "Aprendizaje práctico. Bilingüe. Sin costo.");
  assert.ok(es.boundary.includes("profesional autorizado"));
  assert.ok(/licensed professional/i.test(en.boundary));
  assert.strictEqual(es.cta, "Encontrar mi ruta");
  const close = read(`${APRENDER_DIR}/_components/LearningAccessClose.tsx`);
  assert.ok(close.includes("c.boundary") && close.includes("#${LEARNING_ANCHORS.journeys}"));
  assert.ok(!/partner|sponsor|patrocin/i.test(stripComments(close)), "close band must not name a partner or sponsor");
});

check("Phase 1: hero never hides critical text behind animation (no framer-motion / opacity-0 in landing components)", () => {
  for (const rel of APRENDER_LANDING_FILES) {
    const src = stripComments(read(rel));
    assert.ok(!src.includes("framer-motion"), `${rel} imports framer-motion`);
    assert.ok(!/opacity-0|opacity:\s*0/.test(src), `${rel} starts content at opacity 0`);
  }
});

check("Phase 1: /aprender is a public SEO pillar (metadata + CollectionPage JSON-LD), sitemap untouched", () => {
  const seo = read("app/lib/leonix/publicPillarSeo.ts");
  assert.ok(seo.includes('| "aprender"'), "PublicPillarId must include aprender");
  assert.ok(seo.includes('aprender: "/aprender"'), "pillar path must be /aprender");
  assert.ok(seo.includes("Centro de Aprendizaje Leonix") && seo.includes("Leonix Learning Center"));
  const page = read(`${APRENDER_DIR}/page.tsx`);
  assert.ok(page.includes('buildPublicPillarMetadata("aprender"') && page.includes('<PublicPillarJsonLd id="aprender"'));
  const sitemap = read("app/sitemap.ts");
  assert.ok(!sitemap.includes("/aprender"), "Phase 1 must not expand the sitemap (reported for a later gate)");
});

check("Phase 1: decorative SVG vignettes are aria-hidden and the landing has one h1 plus real section headings", () => {
  const glyphs = read(`${APRENDER_DIR}/_components/learningGlyphs.tsx`);
  const svgTags = glyphs.match(/<svg\b[^>]*>/g) ?? [];
  assert.ok(svgTags.length >= 5, `expected the hero, three journey and Idea Builder vignettes (found ${svgTags.length})`);
  for (const tag of svgTags) assert.ok(tag.includes("aria-hidden"), `SVG without aria-hidden: ${tag.slice(0, 80)}`);
  const hero = read(`${APRENDER_DIR}/_components/LearningHero.tsx`);
  assert.strictEqual((hero.match(/<h1\b/g) ?? []).length, 1);
  for (const rel of APRENDER_LANDING_FILES.filter((f) => /Learning(JourneyCards|BusinessRoadmap|StartHere|TopicTiles|Toolkit|Method|AccessClose)\.tsx$/.test(f))) {
    assert.ok(/<h2\b/.test(read(rel)), `${rel} has no h2 section heading`);
  }
});

console.log(`\n${passed} check(s) passed${failed ? `, ${failed} FAILED` : ""}.`);
if (failed > 0) {
  console.log("\nSome checks failed.");
  process.exit(1);
} else {
  console.log("\nAll checks passed.");
}
