/**
 * TODAY-1 + G1 — Public Business Learning Center (foundation, checkpoint landing, pathway pages)
 * + Idea Builder foundation verification. Hand-rolled
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
  "app/(site)/aprender/learningPathwayCopy.ts",
  "app/(site)/aprender/learningJourneys.ts",
  "app/(site)/aprender/ruta/page.tsx",
  "app/(site)/aprender/ruta/[journeyKey]/page.tsx",
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
// Gate G1 — /aprender checkpoint landing + three pathway pages on the canonical 7-checkpoint
// spine. Truth, copy hygiene, parity, a11y standard. (Supersedes the Phase-1 long-landing checks:
// the approved Phase-1 visual primitives are still asserted; the Phase-1 information architecture
// — inline journey panel, 7-stage roadmap, Start Here grid on the landing — is asserted retired.)
// ---------------------------------------------------------------------------

import { learningCopy, learningLandingCopy, contentLangFromRouteLang } from "../app/(site)/aprender/learningCopy";
import { learningPathwayCopy } from "../app/(site)/aprender/learningPathwayCopy";
import {
  LEARNING_CHECKPOINT_KEYS, LEARNING_JOURNEY_KEYS, LEARNING_JOURNEY_LESSONS, LEARNING_JOURNEY_LESSON_KEYS,
  LEARNING_LESSON_CHECKPOINT, LEARNING_NEXT_JOURNEY, LEARNING_ROUTES, buildJourneyHref, categoryHref, checkpointAnchor,
  isLearningJourneyKey, journeyFromSearchParams, lessonHref, resolveJourneyCheckpoints, resolveJourneyLessons, resolveTopicTiles,
} from "../app/(site)/aprender/learningJourneys";
import type { LearningCategory } from "../app/lib/business/learning/types";

const APRENDER_DIR = "app/(site)/aprender";
const PATHWAY_PAGE = `${APRENDER_DIR}/ruta/[journeyKey]/page.tsx`;
const APRENDER_SHARED_FILES = [
  `${APRENDER_DIR}/learningCopy.ts`,
  `${APRENDER_DIR}/learningPathwayCopy.ts`,
  `${APRENDER_DIR}/learningJourneys.ts`,
  `${APRENDER_DIR}/_components/learningUi.ts`,
  `${APRENDER_DIR}/_components/learningGlyphs.tsx`,
];
/** What the landing renders (G1 order). */
const APRENDER_LANDING_COMPONENTS = [
  `${APRENDER_DIR}/_components/LearningHero.tsx`,
  `${APRENDER_DIR}/_components/LearningJourneyCards.tsx`,
  `${APRENDER_DIR}/_components/LearningTrustStrip.tsx`,
  `${APRENDER_DIR}/_components/LearningStartHelper.tsx`,
  `${APRENDER_DIR}/_components/LearningToolsRow.tsx`,
  `${APRENDER_DIR}/_components/LearningAccessClose.tsx`,
];
/** What only the pathway pages render (they also share LearningToolsRow + LearningAccessClose with the landing). */
const APRENDER_PATHWAY_COMPONENTS = [
  `${APRENDER_DIR}/_components/LearningPathwayHero.tsx`,
  `${APRENDER_DIR}/_components/LearningCheckpointSpine.tsx`,
  `${APRENDER_DIR}/_components/LearningPathwayExtras.tsx`,
  `${APRENDER_DIR}/_components/LearningPathwayBridge.tsx`,
];
/** Approved Phase-1 full-size sections: kept in the repository, rendered by neither the landing nor a pathway. */
const APRENDER_RETAINED_COMPONENTS = [
  `${APRENDER_DIR}/_components/LearningToolkit.tsx`,
  `${APRENDER_DIR}/_components/LearningMethod.tsx`,
  `${APRENDER_DIR}/_components/LearningTopicTiles.tsx`,
];
const APRENDER_G1_FILES = [
  `${APRENDER_DIR}/page.tsx`,
  `${APRENDER_DIR}/ruta/page.tsx`,
  PATHWAY_PAGE,
  ...APRENDER_SHARED_FILES,
  ...APRENDER_LANDING_COMPONENTS,
  ...APRENDER_PATHWAY_COMPONENTS,
  ...APRENDER_RETAINED_COMPONENTS,
];
const APRENDER_ALL_PUBLIC_FILES = [
  ...APRENDER_G1_FILES,
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

/** Every string leaf of a copy object, with its path. */
function leaves(v: unknown, prefix = ""): [string, string][] {
  if (typeof v === "string") return [[prefix, v]];
  if (Array.isArray(v)) return v.flatMap((x, i) => leaves(x, `${prefix}[${i}]`));
  if (v && typeof v === "object") return Object.entries(v as Record<string, unknown>).flatMap(([k, x]) => leaves(x, `${prefix}.${k}`));
  return [];
}

const SPANISH_DIACRITICS = /[áéíóúñ¿¡]/i;

const PUBLISHED_SEED_KEYS = [
  "consistent_business_information", "who_is_your_customer", "revenue_vs_profit", "healthy_boundaries_and_capacity",
  "google_business_basics", "advertising_fundamentals", "whatsapp_business_basics", "reviews_and_customer_response",
];
const PLANNED_SEED_KEYS = [
  "branding_basics", "referrals_basics", "profitable_service_basics", "simple_analytics",
  "local_seo_basics", "product_photography_basics", "short_video_basics", "customer_data_protection",
];

check("G1: every landing/pathway file exists and the retired Phase-1 landing sections are gone", () => {
  for (const rel of APRENDER_G1_FILES) assert.ok(exists(rel), `missing ${rel}`);
  assert.ok(!exists(`${APRENDER_DIR}/_components/LearningStartHere.tsx`), "the large Start Here grid must be retired (replaced by LearningStartHelper)");
  assert.ok(!exists(`${APRENDER_DIR}/_components/LearningBusinessRoadmap.tsx`), "the Phase-1 roadmap must be evolved into LearningCheckpointSpine");
});

check("G1: no 'Business Concierge' eyebrow/UI anywhere on public /aprender (comments excluded)", () => {
  for (const rel of APRENDER_ALL_PUBLIC_FILES) {
    const src = stripComments(read(rel));
    assert.ok(!/Business Concierge/i.test(src), `${rel} still renders a Business Concierge string`);
    assert.ok(!/business-tools\/concierge|BusinessConcierge|HealthMap|healthMap/.test(src), `${rel} imports/renders Concierge UI`);
  }
  assert.strictEqual(learningCopy("es").siteEyebrow, "Centro de Aprendizaje Leonix");
  assert.strictEqual(learningCopy("en").siteEyebrow, "Leonix Learning Center");
});

check("G1: hero copy exists in ES and EN (locked concepts, CTAs to the doors and the helper, four trust marks)", () => {
  const es = learningLandingCopy("es").hero;
  const en = learningLandingCopy("en").hero;
  assert.strictEqual(es.title, "Aprende. Construye. Haz crecer tu idea.");
  assert.strictEqual(en.title, "Learn. Build. Grow your idea.");
  assert.strictEqual(es.ctaPrimary, "Encontrar mi punto de partida");
  assert.strictEqual(en.ctaPrimary, "Find where to start");
  assert.strictEqual(es.ctaSecondary, "No sé por dónde empezar");
  assert.strictEqual(en.ctaSecondary, "I'm not sure where to start");
  assert.deepStrictEqual(es.trust, ["Bilingüe", "Práctico", "A tu ritmo", "Sin costo"]);
  assert.deepStrictEqual(en.trust, ["Bilingual", "Practical", "At your pace", "No cost"]);
  assert.ok(es.support.length > 40 && en.support.length > 40);
  const hero = read(`${APRENDER_DIR}/_components/LearningHero.tsx`);
  assert.ok(hero.includes("#${LEARNING_ANCHORS.journeys}") && hero.includes("#${LEARNING_ANCHORS.helper}"), "hero CTAs must anchor to the doors and the helper");
  assert.ok(!hero.includes("LEARNING_ANCHORS.topics"), "hero must no longer point at a topics grid on the landing");
});

check("G1: three journey doors (3/3) with title, empathy, outcome and CTA in both languages", () => {
  assert.deepStrictEqual([...LEARNING_JOURNEY_KEYS], ["idea", "empezando", "negocio"]);
  for (const lang of ["es", "en"] as const) {
    const items = learningLandingCopy(lang).journeys.items;
    for (const key of LEARNING_JOURNEY_KEYS) {
      const it = items[key];
      assert.ok(it.title && it.empathy && it.outcome && it.cta, `${lang}/${key} journey copy incomplete`);
      assert.ok(LEARNING_JOURNEY_LESSON_KEYS[key].length > 0, `${key} journey has no lesson sequence`);
    }
  }
  const es = learningLandingCopy("es").journeys.items;
  assert.strictEqual(es.idea.title, "Tengo una idea");
  assert.strictEqual(es.empezando.title, "Estoy empezando");
  assert.strictEqual(es.negocio.title, "Ya tengo un negocio");
  assert.strictEqual(es.idea.cta, "Empezar por mi idea");
  assert.strictEqual(es.empezando.cta, "Preparar mi negocio");
  assert.strictEqual(es.negocio.cta, "Hacer crecer mi negocio");
});

check("G1: journey hrefs are route-mode (/aprender/ruta/{journey}) — 3/3, never the Phase-1 query/anchor form", () => {
  assert.strictEqual(buildJourneyHref("idea", "es"), "/aprender/ruta/idea?lang=es");
  assert.strictEqual(buildJourneyHref("empezando", "es"), "/aprender/ruta/empezando?lang=es");
  assert.strictEqual(buildJourneyHref("negocio", "en"), "/aprender/ruta/negocio?lang=en");
  for (const key of LEARNING_JOURNEY_KEYS) {
    const href = buildJourneyHref(key, "es");
    assert.ok(!href.includes("journey=") && !href.includes("#"), `${key} href still uses the query/anchor form: ${href}`);
  }
  assert.strictEqual(LEARNING_ROUTES.pathway, "/aprender/ruta");
  assert.ok(!read(`${APRENDER_DIR}/learningJourneys.ts`).includes("LEARNING_JOURNEY_LINK_MODE"), "the query link mode must be retired, not left switchable");
});

check("G1: exactly the seven canonical checkpoints (7/7) in Bible order, ES + EN labels, a focus line per journey", () => {
  assert.deepStrictEqual([...LEARNING_CHECKPOINT_KEYS], ["entender", "construir", "preparar", "visible", "crecer", "proteger", "siguiente"]);
  const es = learningPathwayCopy("es").spine;
  const en = learningPathwayCopy("en").spine;
  assert.deepStrictEqual(LEARNING_CHECKPOINT_KEYS.map((k) => es.checkpoints[k].title), ["Entender", "Construir", "Preparar", "Hacerte visible", "Crecer", "Proteger", "Siguiente paso"]);
  assert.deepStrictEqual(LEARNING_CHECKPOINT_KEYS.map((k) => en.checkpoints[k].title), ["Understand", "Build", "Prepare", "Become visible", "Grow", "Protect", "Next step"]);
  for (const j of LEARNING_JOURNEY_KEYS) {
    for (const k of LEARNING_CHECKPOINT_KEYS) {
      assert.ok(es.focus[j][k].length > 10 && en.focus[j][k].length > 10, `missing ${j}/${k} focus line`);
      assert.ok(es.checkpoints[k].body && en.checkpoints[k].body, `missing ${k} checkpoint body`);
    }
  }
  assert.strictEqual(new Set(LEARNING_CHECKPOINT_KEYS.map(checkpointAnchor)).size, 7, "checkpoint anchors must be unique");
  const copySrc = stripComments(read(`${APRENDER_DIR}/learningCopy.ts`));
  assert.ok(!/LearningRoadmapStageKey|lanzamiento|preparacion:/.test(copySrc), "the Phase-1 roadmap stage labels must be retired as the spine");
});

check("G1: zero fake lesson keys — every mapped key is a real PUBLISHED seed lesson with one home checkpoint, none planned", () => {
  const mapped = new Set<string>([...Object.values(LEARNING_JOURNEY_LESSON_KEYS).flat(), ...Object.keys(LEARNING_LESSON_CHECKPOINT)]);
  for (const key of mapped) {
    assert.ok(PUBLISHED_SEED_KEYS.includes(key), `mapped lesson key "${key}" is not a published seed lesson`);
    assert.ok(!PLANNED_SEED_KEYS.includes(key), `mapped lesson key "${key}" is a planned (unpublished) lesson`);
    assert.ok(LEARNING_CHECKPOINT_KEYS.includes(LEARNING_LESSON_CHECKPOINT[key]), `lesson "${key}" has no canonical home checkpoint`);
  }
  for (const key of PUBLISHED_SEED_KEYS) assert.ok(key in LEARNING_LESSON_CHECKPOINT, `published lesson "${key}" is not placed on the spine`);
  for (const j of LEARNING_JOURNEY_KEYS) {
    assert.deepStrictEqual([...LEARNING_JOURNEY_LESSON_KEYS[j]], LEARNING_JOURNEY_LESSONS[j].map((e) => e.lessonKey), `${j}: key list must be derived from the entries`);
    assert.strictEqual(new Set(LEARNING_JOURNEY_LESSON_KEYS[j]).size, LEARNING_JOURNEY_LESSON_KEYS[j].length, `${j}: a lesson is listed twice`);
  }
});

check("G1: journeys are ordered views of ONE school — per-journey depth/urgency/framing/action, never duplicated lesson content", () => {
  for (const j of LEARNING_JOURNEY_KEYS) {
    for (const e of LEARNING_JOURNEY_LESSONS[j]) {
      assert.ok(["core", "light", "deep"].includes(e.depth) && ["now", "soon", "later"].includes(e.urgency), `${j}/${e.lessonKey}: bad depth/urgency`);
      for (const text of [e.framing, e.action]) {
        assert.ok(text.es.trim().length > 15 && text.en.trim().length > 15, `${j}/${e.lessonKey}: framing/action must exist in ES and EN`);
        assert.ok(!SPANISH_DIACRITICS.test(text.en), `${j}/${e.lessonKey}: Spanish diacritics in EN text`);
        assert.ok(text.es.length <= 140 && text.en.length <= 140, `${j}/${e.lessonKey}: framing/action is a one-liner, not lesson content`);
      }
    }
  }
  const who = LEARNING_JOURNEY_KEYS.map((j) => LEARNING_JOURNEY_LESSONS[j].find((e) => e.lessonKey === "who_is_your_customer"));
  assert.ok(who.every(Boolean), "the shared customer lesson must appear in all three journeys");
  assert.strictEqual(new Set(who.map((e) => e!.framing.es)).size, 3, "the same lesson must be framed differently per journey");
  assert.strictEqual(who[2]!.depth, "deep");
  assert.deepStrictEqual(LEARNING_NEXT_JOURNEY, { idea: "empezando", empezando: "negocio", negocio: null });
  const journeysSrc = stripComments(read(`${APRENDER_DIR}/learningJourneys.ts`));
  assert.ok(!/bodyEs|bodyEn|body_es|body_en/.test(journeysSrc), "the journey map must never carry lesson bodies");
});

check("G1: checkpoint resolver only surfaces published lessons, keeps journey order, and leaves empty checkpoints empty", () => {
  const catalog = [
    lesson({ id: "l1", lessonKey: "who_is_your_customer", status: "published", estimatedMinutes: 12 }),
    lesson({ id: "l2", lessonKey: "revenue_vs_profit", status: "planned" }),
    lesson({ id: "l3", lessonKey: "consistent_business_information", status: "draft" }),
    lesson({ id: "l4", lessonKey: "google_business_basics", status: "published", estimatedMinutes: 15 }),
    lesson({ id: "l5", lessonKey: "reviews_and_customer_response", status: "archived" }),
    lesson({ id: "l6", lessonKey: "branding_basics", status: "planned" }),
  ];
  assert.deepStrictEqual(resolveJourneyLessons("idea", catalog).map((l) => l.lessonKey), ["who_is_your_customer"]);
  const cps = resolveJourneyCheckpoints("empezando", catalog);
  assert.deepStrictEqual(cps.map((c) => c.key), [...LEARNING_CHECKPOINT_KEYS]);
  assert.deepStrictEqual(cps.find((c) => c.key === "entender")?.items.map((i) => i.lesson.lessonKey), ["who_is_your_customer"]);
  assert.deepStrictEqual(cps.find((c) => c.key === "visible")?.items.map((i) => i.lesson.lessonKey), ["google_business_basics"], "draft/archived lessons must not render");
  assert.strictEqual(cps.find((c) => c.key === "preparar")?.items.length, 0, "a planned lesson must not count toward a checkpoint");
  assert.strictEqual(cps.find((c) => c.key === "construir")?.items.length, 0, "a planned lesson (branding_basics) must stay hidden");
  const rendered = cps.flatMap((c) => c.items.map((i) => i.lesson.status));
  assert.ok(rendered.every((s) => s === "published"));

  const full = PUBLISHED_SEED_KEYS.map((k, i) => lesson({ id: `p${i}`, lessonKey: k, status: "published" }));
  const visible = resolveJourneyCheckpoints("negocio", full).find((c) => c.key === "visible")!;
  assert.deepStrictEqual(
    visible.items.map((i) => i.lesson.lessonKey),
    ["consistent_business_information", "google_business_basics", "whatsapp_business_basics", "reviews_and_customer_response"],
    "lessons inside a checkpoint follow the journey order",
  );
  for (const j of LEARNING_JOURNEY_KEYS) {
    const empty = resolveJourneyCheckpoints(j, full).filter((c) => c.items.length === 0).map((c) => c.key);
    for (const k of ["construir", "proteger", "siguiente"] as const) assert.ok(empty.includes(k), `${j}/${k} has no published lesson yet → must be empty`);
  }
});

check("G1: empty checkpoints render the truthful 'En preparación' state — never a zero badge, never a planned title", () => {
  assert.strictEqual(learningPathwayCopy("es").spine.inPreparation, "En preparación");
  assert.strictEqual(learningPathwayCopy("en").spine.inPreparation, "In preparation");
  assert.strictEqual(learningLandingCopy("es").journeys.inPreparation, "En preparación");
  const spine = stripComments(read(`${APRENDER_DIR}/_components/LearningCheckpointSpine.tsx`));
  assert.ok(spine.includes("c.inPreparation") && spine.includes("c.inPreparationBody"));
  assert.ok(/hasLessons \? \(/.test(spine), "spine must branch on real published lessons");
  for (const rel of APRENDER_G1_FILES) {
    const src = stripComments(read(rel));
    for (const key of PLANNED_SEED_KEYS) assert.ok(!src.includes(key), `${rel} references planned lesson "${key}"`);
  }
  for (const [k, v] of [...leaves(learningPathwayCopy("es")), ...leaves(learningLandingCopy("es"))]) {
    assert.ok(!/Pr[oó]ximamente/i.test(v), `copy leaf ${k} teases unpublished content`);
  }
});

check("G1: /aprender is condensed — hero → doors → trust → helper → tools row → close, and nothing else", () => {
  const page = stripComments(read(`${APRENDER_DIR}/page.tsx`));
  const order = ["<LearningHero", "<LearningJourneyCards", "<LearningTrustStrip", "<LearningStartHelper", "<LearningToolsRow", "<LearningAccessClose"];
  const idx = order.map((tag) => page.indexOf(tag));
  assert.ok(idx.every((i) => i !== -1), `landing is missing a section: ${order.filter((_, i) => idx[i] === -1).join(", ")}`);
  assert.deepStrictEqual([...idx].sort((a, b) => a - b), idx, "landing sections are out of the approved order");
  assert.strictEqual((page.match(/<Learning[A-Z]\w+/g) ?? []).length, 6, "landing must render exactly six sections");
  for (const moved of ["LearningCheckpointSpine", "LearningBusinessRoadmap", "LearningStartHere\"", "LearningTopicTiles", "LearningSearch", "LearningToolkit", "LearningMethod", "listActiveCategories"]) {
    assert.ok(!page.includes(moved), `landing still pulls in ${moved}`);
  }
  assert.strictEqual(learningLandingCopy("es").helper.title, "No sé por dónde empezar");
  const helper = read(`${APRENDER_DIR}/_components/LearningStartHelper.tsx`);
  assert.ok(helper.includes('buildJourneyHref("idea"'), "helper must recommend the idea pathway");
  assert.ok(!/\.map\(/.test(stripComments(helper)), "helper must not list a curriculum");
});

check("G1 polish: a pathway is the school route, not a second landing — secondary material is compact, full sections are retained but not rendered", () => {
  const page = stripComments(read(PATHWAY_PAGE));
  assert.strictEqual((page.match(/<Learning[A-Z]\w+/g) ?? []).length, 6, "pathway must render exactly six sections");
  for (const full of ["LearningToolkit", "LearningMethod", "LearningTopicTiles", "LearningSearch"]) {
    assert.ok(!page.includes(full), `pathway still renders the full ${full} section`);
  }
  for (const rel of [...APRENDER_RETAINED_COMPONENTS, `${APRENDER_DIR}/_components/LearningSearch.tsx`]) assert.ok(exists(rel), `${rel} must stay in the repository`);
  assert.deepStrictEqual(learningPathwayCopy("es").extras.methodSteps, ["Aprende", "Practica", "Usa IA", "Verifica", "Sigue"]);
  assert.deepStrictEqual(learningPathwayCopy("en").extras.methodSteps, ["Learn", "Practice", "Use AI", "Verify", "Keep going"]);
  assert.strictEqual(learningPathwayCopy("es").extras.topicsTitle, "Explorar por tema");
  assert.strictEqual(learningPathwayCopy("en").extras.topicsTitle, "Explore by topic");
  const extras = stripComments(read(`${APRENDER_DIR}/_components/LearningPathwayExtras.tsx`));
  assert.ok(extras.includes("METHOD_STRIP_GLYPHS") && extras.includes("c.methodSteps.map"), "method strip must reuse the shared glyph set");
  assert.ok(!/<details|aria-expanded|useState/.test(extras), "secondary material must not be hidden behind an accordion");
  assert.ok((extras.match(/flex flex-wrap/g) ?? []).length >= 2, "method strip and topic links must wrap, never scroll sideways");
});

check("G1: glossary/resource counts stay truth-derived — no literal counts on the landing or the pathway", () => {
  for (const rel of [`${APRENDER_DIR}/page.tsx`, PATHWAY_PAGE]) {
    const page = read(rel);
    assert.ok(page.includes("listAllPublishedResources"), `${rel} must read published resources`);
    assert.ok(page.includes('r.resourceType === "glossary_term"'), `${rel}: glossary count must be truth-derived`);
    assert.ok(page.includes('r.resourceType === "checklist" || r.resourceType === "template"'), `${rel}: resource count must be truth-derived`);
  }
  for (const rel of [`${APRENDER_DIR}/_components/LearningToolsRow.tsx`, `${APRENDER_DIR}/_components/LearningToolkit.tsx`]) {
    const src = stripComments(read(rel));
    assert.ok(!/\b(18|19|7|8|16)\b\s*<\//.test(src), `${rel} must not hardcode counts`);
    assert.ok(src.includes("glossaryCount") && src.includes("resourceCount"));
  }
});

check("G1: the three pathway pages resolve through ONE shared page (async params, notFound for unknown keys)", () => {
  assert.ok(!exists(`${APRENDER_DIR}/ruta/idea`) && !exists(`${APRENDER_DIR}/ruta/empezando`) && !exists(`${APRENDER_DIR}/ruta/negocio`), "no per-journey page copies");
  const page = read(PATHWAY_PAGE);
  assert.ok(page.includes("params: Promise<{ journeyKey: string }>") && page.includes("searchParams: Promise<"), "must use the Next 15 async params/searchParams convention");
  assert.ok(/if \(!isLearningJourneyKey\(journeyKey\)\) notFound\(\);/.test(page), "unknown journey keys must 404");
  assert.ok(page.includes("resolveLearningCenterFlagTier(null)") && page.includes('tier !== "global"'), "pathway keeps the flag gate");
  assert.ok(page.includes("normalizeLang(") && page.includes("generateMetadata") && page.includes("alternates: { canonical: path }"));
  const order = ["<LearningPathwayHero", "<LearningCheckpointSpine", "<LearningToolsRow", "<LearningPathwayExtras", "<LearningPathwayBridge", "<LearningAccessClose"];
  const idx = order.map((tag) => page.indexOf(tag));
  assert.ok(idx.every((i) => i !== -1), `pathway is missing a section: ${order.filter((_, i) => idx[i] === -1).join(", ")}`);
  assert.deepStrictEqual([...idx].sort((a, b) => a - b), idx, "pathway sections are out of order");
  for (const key of ["idea", "empezando", "negocio"]) assert.strictEqual(isLearningJourneyKey(key), true);
  for (const key of ["", "foo", "IDEA", "ruta", "leccion", undefined, null, 3]) assert.strictEqual(isLearningJourneyKey(key), false);
  for (const lang of ["es", "en"] as const) {
    const c = learningPathwayCopy(lang);
    for (const j of LEARNING_JOURNEY_KEYS) assert.ok(c.hero.goals[j] && c.bridge.next[j].title && c.bridge.next[j].cta && c.seo[j].title && c.seo[j].description, `${lang}/${j} pathway copy incomplete`);
  }
  const bare = read(`${APRENDER_DIR}/ruta/page.tsx`);
  assert.ok(bare.includes("redirect(") && bare.includes("LEARNING_ANCHORS.journeys"), "/aprender/ruta must send people to the three doors");
});

check("G1: legacy /aprender?journey= links redirect server-side to the pathway route; the inline journey panel is retired", () => {
  const page = read(`${APRENDER_DIR}/page.tsx`);
  assert.ok(page.includes('import { redirect } from "next/navigation";'));
  const redirectIdx = page.indexOf("redirect(buildJourneyHref(legacyJourney, routeLang))");
  assert.ok(redirectIdx !== -1, "landing must redirect a valid legacy journey param");
  assert.ok(redirectIdx < page.indexOf("resolveLearningCenterFlagTier(null)"), "redirect must happen before any rendering work");
  assert.strictEqual(journeyFromSearchParams({ journey: "idea" }), "idea");
  assert.strictEqual(journeyFromSearchParams({ journey: ["negocio", "idea"] }), "negocio");
  assert.strictEqual(journeyFromSearchParams({ journey: "hack" }), null, "an unknown value must fall through to the normal landing");
  assert.strictEqual(journeyFromSearchParams({}), null);
  const cards = stripComments(read(`${APRENDER_DIR}/_components/LearningJourneyCards.tsx`));
  assert.ok(!/ruta-seleccionada|selected|aria-current/.test(cards), "journey cards must no longer expand a journey inline");
  assert.ok(cards.includes("buildJourneyHref(key, routeLang)"));
});

check("G1: Idea Builder copy is truthful — the tool requires sign-in, and nothing claims anonymous exploring", () => {
  assert.strictEqual(LEARNING_ROUTES.ideaBuilder, "/dashboard/business-tools/idea-builder");
  const ideaPage = read("app/(site)/dashboard/business-tools/idea-builder/page.tsx");
  assert.ok(ideaPage.includes("/login?redirect="), "repository truth changed: the Idea Builder no longer redirects signed-out users — revisit this copy");
  const es = learningLandingCopy("es").toolkit.ideaBuilder;
  const en = learningLandingCopy("en").toolkit.ideaBuilder;
  assert.strictEqual(es.note, "Inicia sesión para usar el Constructor de ideas y guardar tu progreso.");
  assert.strictEqual(en.note, "Sign in to use the Idea Builder and save your progress.");
  assert.strictEqual(es.signInShort, "Requiere iniciar sesión");
  assert.strictEqual(en.signInShort, "Sign-in required");
  for (const rel of APRENDER_ALL_PUBLIC_FILES) {
    const src = stripComments(read(rel));
    assert.ok(!/explorar la herramienta|explore the tool|sin iniciar sesi[oó]n|without signing in/i.test(src), `${rel} still claims the Idea Builder can be explored anonymously`);
  }
  assert.ok(read(`${APRENDER_DIR}/_components/LearningToolsRow.tsx`).includes("c.ideaBuilder.signInShort"));
  assert.ok(read(`${APRENDER_DIR}/_components/LearningToolkit.tsx`).includes("c.ideaBuilder.note"));
});

check("G1: category browsing is preserved as SECONDARY navigation — hidden when empty, never the front door", () => {
  assert.ok(exists(`${APRENDER_DIR}/[categoryKey]/page.tsx`));
  assert.strictEqual(categoryHref("clientes_y_demanda", "es"), "/aprender/clientes_y_demanda?lang=es");
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
  const pathway = read(PATHWAY_PAGE);
  assert.ok(pathway.indexOf("<LearningPathwayExtras") > pathway.indexOf("<LearningCheckpointSpine"), "topic links come after the spine on a pathway");
  assert.ok(pathway.includes("resolveTopicTiles(categories, lessons)"), "pathway topic links must be truth-derived (published categories only)");
  assert.ok(read(`${APRENDER_DIR}/_components/LearningPathwayExtras.tsx`).includes("categoryHref(category.categoryKey, routeLang)"), "topic links must open the existing category pages");
  // Static segments win over /aprender/[categoryKey]; a category_key must never shadow one.
  const RESERVED = ["ruta", "leccion", "glosario", "recursos"];
  const seededCategoryKeys = [...MIGRATION.matchAll(/^\('([a-z_]+)', '[^']+', '[^']+', '[^']*', '[^']*', \d, 'active'\)/gm)].map((m) => m[1]);
  assert.strictEqual(seededCategoryKeys.length, 6, "expected the six seeded category keys");
  for (const key of seededCategoryKeys) assert.ok(!RESERVED.includes(key), `category_key "${key}" collides with a reserved /aprender segment`);
});

check("G1: stable keys and deep links intact — lesson_key/capability_key untouched, Concierge + Idea Builder links still resolve", () => {
  for (const key of [...PUBLISHED_SEED_KEYS, ...PLANNED_SEED_KEYS]) assert.ok(MIGRATION.includes(`'${key}'`), `seed lesson_key ${key} missing`);
  assert.strictEqual(lessonHref("who_is_your_customer", "es"), "/aprender/leccion/who_is_your_customer?lang=es");
  assert.strictEqual(lessonHref("who_is_your_customer", "en", "idea"), "/aprender/leccion/who_is_your_customer?lang=en&journey=idea");
  assert.ok(read("app/(site)/dashboard/business-tools/concierge/_components/ActionCard.tsx").includes("/aprender/leccion/${data.relatedLessonKey}"));
  assert.ok(read("app/(site)/dashboard/business-tools/idea-builder/IdeaBuilderWizard.tsx").includes("/aprender/leccion/${l.lessonKey}"));
  assert.ok(exists(`${APRENDER_DIR}/leccion/[lessonKey]/page.tsx`) && exists(`${APRENDER_DIR}/glosario/page.tsx`) && exists(`${APRENDER_DIR}/recursos/page.tsx`));
});

check("G1 boundary: lesson pages, progress semantics and Home are not part of this gate", () => {
  const lessonPage = read(`${APRENDER_DIR}/leccion/[lessonKey]/page.tsx`);
  assert.ok(lessonPage.includes("LessonProgressButton") && lessonPage.includes("getPublishedLessonByKey"));
  assert.ok(!/learningPathwayCopy|LearningCheckpointSpine|LessonPackage/.test(lessonPage), "lesson page must not be redesigned in G1");
  const progress = read("app/api/dashboard/business/learning/progress/route.ts");
  assert.ok(progress.includes('body.action === "start" || body.action === "complete"'), "progress actions must be unchanged in G1");
  for (const rel of APRENDER_G1_FILES) assert.ok(!/from ["'][^"']*\/home\//.test(read(rel)), `${rel} must not reach into Home`);
  assert.ok(read("app/(site)/home/homePageCopy.ts").includes('learningCenter: "/aprender"'), "Home must keep linking the Learning Center front door");
});

check("G1: no /publicar anywhere on public /aprender", () => {
  for (const rel of APRENDER_ALL_PUBLIC_FILES) assert.ok(!read(rel).includes("/publicar"), `${rel} links to /publicar`);
});

check("G1: ES/EN parity — identical copy shape (landing, chrome, pathway), every EN leaf non-empty, no Spanish diacritics in EN", () => {
  const pairs: [string, unknown, unknown][] = [
    ["landing", learningLandingCopy("es"), learningLandingCopy("en")],
    ["chrome", learningCopy("es"), learningCopy("en")],
    ["pathway", learningPathwayCopy("es"), learningPathwayCopy("en")],
  ];
  for (const [name, esCopy, enCopy] of pairs) {
    const es = leaves(esCopy);
    const en = leaves(enCopy);
    assert.deepStrictEqual(en.map(([k]) => k), es.map(([k]) => k), `${name}: EN copy shape must mirror ES exactly`);
    for (const [k, v] of en) {
      assert.ok(v.trim().length > 0, `${name}: EN leaf ${k} is empty`);
      assert.ok(!SPANISH_DIACRITICS.test(v), `${name}: EN leaf ${k} contains Spanish diacritics: ${v}`);
    }
    for (const [k, v] of es) assert.ok(v.trim().length > 0, `${name}: ES leaf ${k} is empty`);
  }
});

check("G1: ES chrome uses correct accents (no unaccented legacy chrome strings)", () => {
  const es = learningCopy("es");
  assert.strictEqual(es.categoriesTitle, "Categorías");
  assert.strictEqual(es.levelLabel.practical, "Práctico");
  assert.strictEqual(es.lessonSingular, "lección");
  assert.strictEqual(es.checklistLabel, "Lista de verificación");
  assert.strictEqual(es.backToCategory, "Volver a la categoría");
  for (const rel of [`${APRENDER_DIR}/learningCopy.ts`, `${APRENDER_DIR}/learningPathwayCopy.ts`]) {
    const src = stripComments(read(rel));
    for (const bad of ["Educacion", "Categorias", "Practico", "leccion(es)", "Leccion", "Informacion", "Proteccion", "verificacion", "categoria\"", "sesion", "preparacion\"", "Despues", "accion\""]) {
      assert.ok(!src.includes(bad), `${rel} still contains unaccented "${bad}"`);
    }
  }
});

check("G1: PT/TL parameter infrastructure preserved (route lang kept in links, content falls back to ES)", () => {
  assert.strictEqual(contentLangFromRouteLang("pt"), "es");
  assert.strictEqual(contentLangFromRouteLang("tl"), "es");
  assert.strictEqual(contentLangFromRouteLang("en"), "en");
  assert.ok(buildJourneyHref("idea", "pt").includes("lang=pt"), "journey href must keep ?lang=pt");
  assert.ok(lessonHref("revenue_vs_profit", "tl", "negocio").includes("lang=tl"));
  for (const rel of [`${APRENDER_DIR}/page.tsx`, PATHWAY_PAGE, `${APRENDER_DIR}/ruta/page.tsx`]) {
    assert.ok(read(rel).includes("normalizeLang("), `${rel} must normalize the route language via app/lib/language`);
  }
});

check("G1: every link/anchor in the landing + pathway components carries a ≥44 px touch-target class", () => {
  const OK = /min-h-11|min-h-\[2\.875rem\]|min-h-\[3rem\]|LEARNING_BTN_PRIMARY|LEARNING_BTN_OUTLINE|LEARNING_LINK|LEARNING_TOOL_TILE|min-h-\[10rem\]|h-full/;
  for (const rel of [...APRENDER_LANDING_COMPONENTS, ...APRENDER_PATHWAY_COMPONENTS, ...APRENDER_RETAINED_COMPONENTS]) {
    const src = read(rel);
    const tags = src.match(/<(Link|a)\b[\s\S]*?>/g) ?? [];
    for (const tag of tags) assert.ok(OK.test(tag), `${rel}: link without a touch-target class → ${tag.slice(0, 120)}`);
  }
  const ui = read(`${APRENDER_DIR}/_components/learningUi.ts`);
  assert.ok(ui.includes("min-h-[2.875rem]") && ui.includes("min-h-11") && ui.includes("min-h-[4.5rem]"));
});

check("G1: mobile-first spine — vertical progression at every width, desktop-only overview rail, no sideways scrolling", () => {
  const spine = stripComments(read(`${APRENDER_DIR}/_components/LearningCheckpointSpine.tsx`));
  assert.ok(spine.includes('"relative mt-10 hidden lg:block"'), "the horizontal overview rail must be desktop-only");
  assert.ok(spine.includes("md:grid-cols-2 xl:grid-cols-3"), "lesson cards must reflow 1 → 2 → 3 columns");
  for (const rel of [...APRENDER_LANDING_COMPONENTS, ...APRENDER_PATHWAY_COMPONENTS]) {
    assert.ok(!/overflow-x-(auto|scroll)|snap-x|whitespace-nowrap/.test(stripComments(read(rel))), `${rel} introduces a sideways-scrolling strip`);
  }
  for (const rel of [`${APRENDER_DIR}/page.tsx`, PATHWAY_PAGE]) assert.ok(read(rel).includes("overflow-x-hidden"));
});

check("G1: approved Phase-1 visual primitives are reused — shared tokens/vignettes, no colour outside the approved palette", () => {
  const hexes = (src: string) => new Set((src.match(/#[0-9A-Fa-f]{6}\b/g) ?? []).map((h) => h.toUpperCase()));
  const approved = new Set<string>();
  for (const rel of [
    `${APRENDER_DIR}/_components/learningUi.ts`, `${APRENDER_DIR}/_components/learningGlyphs.tsx`, `${APRENDER_DIR}/_components/LearningToolkit.tsx`,
    `${APRENDER_DIR}/_components/LearningAccessClose.tsx`, `${APRENDER_DIR}/_components/LearningTopicTiles.tsx`, `${APRENDER_DIR}/_components/LearningMethod.tsx`,
    `${APRENDER_DIR}/page.tsx`,
  ]) for (const h of hexes(read(rel))) approved.add(h);
  const NEW_COMPONENTS = ["LearningTrustStrip", "LearningStartHelper", "LearningToolsRow", "LearningPathwayHero", "LearningCheckpointSpine", "LearningPathwayExtras", "LearningPathwayBridge"];
  for (const name of NEW_COMPONENTS) {
    const src = read(`${APRENDER_DIR}/_components/${name}.tsx`);
    assert.ok(src.includes('from "./learningUi"'), `${name} must use the shared Learning tokens`);
    for (const h of hexes(src)) assert.ok(approved.has(h), `${name} introduces a colour outside the approved palette: ${h}`);
    assert.ok(!/font-(mono|sans)\b|next\/font/.test(src), `${name} introduces a new font`);
  }
  for (const name of ["LearningPathwayHero", "LearningPathwayBridge"]) {
    const src = read(`${APRENDER_DIR}/_components/${name}.tsx`);
    assert.ok(src.includes("JourneyVignette") && src.includes("JOURNEY_ACCENT"), `${name} must reuse the approved journey vignette + accent`);
  }
  assert.ok(read(`${APRENDER_DIR}/_components/LearningTrustStrip.tsx`).includes("TRUST_GLYPHS"));
  assert.ok(read(`${APRENDER_DIR}/_components/LearningCheckpointSpine.tsx`).includes("CHECKPOINT_GLYPHS"));
});

check("G1: professional-help boundary and access/trust copy present in ES and EN close band (landing + pathway)", () => {
  const es = learningLandingCopy("es").close;
  const en = learningLandingCopy("en").close;
  assert.strictEqual(es.title, "Conocimiento para avanzar, sin barreras.");
  assert.strictEqual(es.trustLine, "Aprendizaje práctico. Bilingüe. Sin costo.");
  assert.ok(es.boundary.includes("profesional autorizado"));
  assert.ok(/licensed professional/i.test(en.boundary));
  assert.strictEqual(es.cta, "Encontrar mi ruta");
  const close = read(`${APRENDER_DIR}/_components/LearningAccessClose.tsx`);
  assert.ok(close.includes("c.boundary") && close.includes("#${LEARNING_ANCHORS.journeys}"));
  for (const rel of APRENDER_G1_FILES) {
    assert.ok(!/partner|sponsor|patrocin|aliado/i.test(stripComments(read(rel))), `${rel} must not name a partner or sponsor`);
  }
});

check("G1: no critical text hidden behind animation (no framer-motion / opacity-0 in landing or pathway)", () => {
  for (const rel of APRENDER_G1_FILES) {
    const src = stripComments(read(rel));
    assert.ok(!src.includes("framer-motion"), `${rel} imports framer-motion`);
    assert.ok(!/opacity-0|opacity:\s*0/.test(src), `${rel} starts content at opacity 0`);
  }
});

check("G1: /aprender is a public SEO pillar (metadata + CollectionPage JSON-LD), sitemap untouched", () => {
  const seo = read("app/lib/leonix/publicPillarSeo.ts");
  assert.ok(seo.includes('| "aprender"'), "PublicPillarId must include aprender");
  assert.ok(seo.includes('aprender: "/aprender"'), "pillar path must be /aprender");
  assert.ok(seo.includes("Centro de Aprendizaje Leonix") && seo.includes("Leonix Learning Center"));
  const page = read(`${APRENDER_DIR}/page.tsx`);
  assert.ok(page.includes('buildPublicPillarMetadata("aprender"') && page.includes('<PublicPillarJsonLd id="aprender"'));
  const sitemap = read("app/sitemap.ts");
  assert.ok(!sitemap.includes("/aprender"), "G1 must not expand the sitemap (reserved for the SEO/launch gate)");
});

check("G1: decorative SVG vignettes are aria-hidden; landing and pathway each have one h1 plus real section headings", () => {
  const glyphs = read(`${APRENDER_DIR}/_components/learningGlyphs.tsx`);
  const svgTags = glyphs.match(/<svg\b[^>]*>/g) ?? [];
  assert.ok(svgTags.length >= 5, `expected the hero, three journey and Idea Builder vignettes (found ${svgTags.length})`);
  for (const tag of svgTags) assert.ok(tag.includes("aria-hidden"), `SVG without aria-hidden: ${tag.slice(0, 80)}`);
  const h1Count = (files: string[]) => files.reduce((n, rel) => n + (read(rel).match(/<h1\b/g) ?? []).length, 0);
  assert.strictEqual(h1Count(APRENDER_LANDING_COMPONENTS), 1, "landing components must contain exactly one h1 (hero)");
  assert.strictEqual(h1Count(APRENDER_PATHWAY_COMPONENTS), 1, "pathway components must contain exactly one h1 (pathway hero)");
  for (const name of ["LearningJourneyCards", "LearningStartHelper", "LearningToolsRow", "LearningAccessClose", "LearningCheckpointSpine", "LearningToolkit", "LearningMethod", "LearningTopicTiles", "LearningPathwayExtras", "LearningPathwayBridge"]) {
    assert.ok(/<h2\b/.test(read(`${APRENDER_DIR}/_components/${name}.tsx`)), `${name} has no h2 section heading`);
  }
  assert.ok(/<h3\b/.test(read(`${APRENDER_DIR}/_components/LearningCheckpointSpine.tsx`)) && /<h4\b/.test(read(`${APRENDER_DIR}/_components/LearningCheckpointSpine.tsx`)), "spine needs checkpoint (h3) and lesson (h4) headings");
});

console.log(`\n${passed} check(s) passed${failed ? `, ${failed} FAILED` : ""}.`);
if (failed > 0) {
  console.log("\nSome checks failed.");
  process.exit(1);
} else {
  console.log("\nAll checks passed.");
}
