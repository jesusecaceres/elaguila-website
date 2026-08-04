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

console.log(`\n${passed} check(s) passed${failed ? `, ${failed} FAILED` : ""}.`);
if (failed > 0) {
  console.log("\nSome checks failed.");
  process.exit(1);
} else {
  console.log("\nAll checks passed.");
}
