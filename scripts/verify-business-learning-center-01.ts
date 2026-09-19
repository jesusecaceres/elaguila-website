/**
 * TODAY-1 + G1 + G2 + G2.1 + G3 + G4-I1 (+ I1.1 quarantine, I1.2/I1.3 Part C, I-1A repair artifact, I-1A.1 supplemental cleanup) — Public Business Learning Center (foundation, checkpoint landing, pathway
 * pages, canonical lesson engine)
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
/** Gate G4-I1 — Idea batch 1. Authored as packages; each renders only once its database row is published (seed I-1). */
const BATCH_I1_KEYS = ["what_problem_do_you_solve", "customer_conversations", "know_your_competition"];
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
    assert.ok(PUBLISHED_SEED_KEYS.includes(key) || (BATCH_I1_KEYS.includes(key) && getCodeOwnedLessonPackage(key) !== null), `mapped lesson key "${key}" is neither a published seed lesson nor an authored batch package`);
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

check("G1 boundary: progress semantics and Home are not part of the landing/pathway work (the lesson page is owned by G2)", () => {
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

// ---------------------------------------------------------------------------
// Gate G2 — canonical lesson engine: LessonPackage + validator + legacy adapter + flagship lesson
// "Quién es tu cliente" (READ · LISTEN · DO · ASK AI · VERIFY · SAVE · NEXT). Pure-unit checks run
// against the real modules; structure checks read source. No schema, progress or migration change.
// ---------------------------------------------------------------------------

import { validateLessonPackage, validateLessonPrompt, collectParityProblems, hasPlayableAudio, REQUIRED_PACKAGE_BLOCKS } from "../app/lib/business/learning/lessonPackage/validate";
import { legacyLessonToPackage, parseLegacyBody, LEGACY_SECTION_LABELS } from "../app/lib/business/learning/lessonPackage/legacyAdapter";
import { CODE_OWNED_LESSON_PACKAGES, getCodeOwnedLessonPackage, resolveLessonPackage } from "../app/lib/business/learning/lessonPackage/registry";
import { WHO_IS_YOUR_CUSTOMER_PACKAGE } from "../app/lib/business/learning/lessonPackage/packages/whoIsYourCustomer";
import { LEARNING_PROMPTS, WHO_IS_YOUR_CUSTOMER_PROMPT, editablePromptFields, renderPrompt, resolvePromptBody, resolvePromptValues } from "../app/lib/business/learning/lessonPackage/prompts";
import { CUSTOMER_STATEMENT_FIELD_KEYS, MAX_STATEMENT_ANSWER_LENGTH, buildCustomerStatement, cleanStatementAnswer } from "../app/lib/business/learning/lessonPackage/customerStatement";
import type { LessonPackage } from "../app/lib/business/learning/lessonPackage/types";
import { lessonCopy } from "../app/(site)/aprender/lessonCopy";
import { resolveNextLesson } from "../app/(site)/aprender/learningJourneys";
import { createHash } from "node:crypto";
import { buildGuidedResult, cleanGuidedAnswer } from "../app/lib/business/learning/lessonPackage/guidedResult";
import { packageToPlainText } from "../app/lib/business/learning/lessonPackage/plainText";
import { CANONICAL_PROJECT, ENGLISH_GRAMMAR_REPAIRS, SEED_I1A1_CLEANUP_SQL, SEED_I1A_REPAIRS_SQL, SUPPLEMENTAL_ACCENT_REPAIRS, buildSupplementalRepairs, buildSupplementalSql, SEED_I1_LEDGER, SEED_I1_RUNBOOK, buildRepairSql, expectedRepairedValues, SEED_I1_LESSONS, SEED_I1_SQL, buildAccentRepairs, buildEnglishRepairs, buildLedger, buildSeedSql, changedWords, repairSpanishAccents, stripMarks } from "./generate-learning-content-seed-i1";

const LESSON_LIB_DIR = "app/lib/business/learning/lessonPackage";
const LESSON_UI_DIR = `${APRENDER_DIR}/_components/lesson`;
const LESSON_PAGE = `${APRENDER_DIR}/leccion/[lessonKey]/page.tsx`;
const LESSON_LIB_FILES = [
  `${LESSON_LIB_DIR}/types.ts`, `${LESSON_LIB_DIR}/validate.ts`, `${LESSON_LIB_DIR}/legacyAdapter.ts`, `${LESSON_LIB_DIR}/registry.ts`,
  `${LESSON_LIB_DIR}/prompts.ts`, `${LESSON_LIB_DIR}/customerStatement.ts`,
  `${LESSON_LIB_DIR}/packages/whoIsYourCustomer.ts`, `${LESSON_LIB_DIR}/packages/whoIsYourCustomerAudio.ts`,
  `${LESSON_LIB_DIR}/guidedResult.ts`, `${LESSON_LIB_DIR}/plainText.ts`, `${LESSON_LIB_DIR}/promptParts.ts`,
  ...["whatProblemDoYouSolve", "customerConversations", "knowYourCompetition"].flatMap((n) => [`${LESSON_LIB_DIR}/packages/${n}.ts`, `${LESSON_LIB_DIR}/packages/${n}Audio.ts`, `${LESSON_LIB_DIR}/promptSets/${n}.ts`]),
];
const LESSON_SERVER_UI = [`${LESSON_UI_DIR}/LessonRenderer.tsx`, `${LESSON_UI_DIR}/LessonBlocks.tsx`, `${LESSON_UI_DIR}/lessonVisuals.tsx`];
const LESSON_CLIENT_UI = [
  `${LESSON_UI_DIR}/LessonActivityCustomerStatement.tsx`, `${LESSON_UI_DIR}/LessonActivityGuided.tsx`, `${LESSON_UI_DIR}/LessonPromptBlock.tsx`, `${LESSON_UI_DIR}/LessonChecklist.tsx`,
  `${LESSON_UI_DIR}/LessonLocalCompletion.tsx`, `${LESSON_UI_DIR}/LessonPrintSheet.tsx`, `${LESSON_UI_DIR}/LessonAudioPlayer.tsx`, `${LESSON_UI_DIR}/lessonLocalStore.ts`,
];
const LESSON_ALL_FILES = [...LESSON_LIB_FILES, ...LESSON_SERVER_UI, ...LESSON_CLIENT_UI, LESSON_PAGE, `${APRENDER_DIR}/lessonCopy.ts`];

const FLAGSHIP = WHO_IS_YOUR_CUSTOMER_PACKAGE;
/** The flagship's own three templates — the G2.1 checks below are about this set, not the whole registry. */
const FLAGSHIP_PROMPTS = ["who_is_your_customer", "who_is_your_customer_interview", "who_is_your_customer_challenge"].map((k) => LEARNING_PROMPTS[k]);
const BATCH_I1_FILES = [
  `${LESSON_LIB_DIR}/guidedResult.ts`, `${LESSON_LIB_DIR}/plainText.ts`, `${LESSON_LIB_DIR}/promptParts.ts`,
  ...["whatProblemDoYouSolve", "customerConversations", "knowYourCompetition"].flatMap((n) => [`${LESSON_LIB_DIR}/packages/${n}.ts`, `${LESSON_LIB_DIR}/packages/${n}Audio.ts`, `${LESSON_LIB_DIR}/promptSets/${n}.ts`]),
  `${LESSON_UI_DIR}/LessonActivityGuided.tsx`,
];
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const words = (s: string) => s.trim().split(/\s+/).length;

/** Every single-quoted SQL literal in the seed migration, in order (same scan the TODAY-1 body-length check uses). */
function sqlLiterals(sql: string): string[] {
  const stripped = sql.split("\n").map((line) => { const i = line.indexOf("--"); return i === -1 ? line : line.slice(0, i); }).join("\n");
  const out: string[] = [];
  let i = 0;
  while (i < stripped.length) {
    if (stripped[i] !== "'") { i++; continue; }
    let j = i + 1;
    let buf = "";
    while (j < stripped.length) {
      if (stripped[j] === "'") { if (stripped[j + 1] === "'") { buf += "'"; j += 2; continue; } break; }
      buf += stripped[j];
      j++;
    }
    out.push(buf);
    i = j + 1;
  }
  return out;
}
const SEED_LITERALS = sqlLiterals(MIGRATION);
function seedLesson(key: string) {
  const idx = SEED_LITERALS.indexOf(key);
  assert.ok(idx !== -1, `seed lesson ${key} not found`);
  const [titleEs, titleEn, summaryEs, summaryEn, bodyEs, bodyEn] = SEED_LITERALS.slice(idx + 1, idx + 7);
  return { lessonKey: key, titleEs, titleEn, summaryEs, summaryEn, bodyEs, bodyEn, estimatedMinutes: 12 };
}

check("G2: lesson engine files exist (package library, renderer, client islands, flagship package + audio script)", () => {
  for (const rel of LESSON_ALL_FILES) assert.ok(exists(rel), `missing ${rel}`);
  const types = read(`${LESSON_LIB_DIR}/types.ts`);
  assert.ok(types.includes("export type LessonPackage = {") && types.includes("export type LessonBlock ="), "LessonPackage / LessonBlock types must exist");
  for (const t of ["hook", "outcomes", "explain", "visual_model", "example", "compare", "activity", "ai_prompt", "mistakes", "glossary", "checklist", "resource", "verify", "pro_help", "recap"]) {
    assert.ok(types.includes(`type: "${t}"`), `block vocabulary is missing "${t}"`);
  }
  assert.ok(types.includes("visualKey: LessonVisualKey") && types.includes("activityKey: LessonActivityKey"), "visuals/activities must be referenced by code-owned keys");
  assert.ok(!/JSX|ReactNode|React\./.test(stripComments(types)) && !/from ["']react["']/.test(types), "LessonPackage must stay plain JSON (no JSX in content data)");
  for (const rel of LESSON_LIB_FILES) assert.ok(!stripComments(read(rel)).includes("server-only") && !/from ["']react/.test(read(rel)), `${rel} must stay a pure module`);
});

check("G2 validator: the flagship package passes with zero errors; every prompt in the registry passes", () => {
  const r = validateLessonPackage(FLAGSHIP, { prompts: LEARNING_PROMPTS });
  assert.deepStrictEqual(r.errors, [], `flagship validation errors: ${r.errors.join(" | ")}`);
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.warnings, []);
  for (const p of Object.values(LEARNING_PROMPTS)) assert.deepStrictEqual(validateLessonPrompt(p).errors, [], `${p.promptKey} prompt invalid`);
  assert.strictEqual(getCodeOwnedLessonPackage("who_is_your_customer"), FLAGSHIP);
  assert.strictEqual(FLAGSHIP.lessonKey, "who_is_your_customer", "stable lesson_key must not be renamed");
  assert.strictEqual(FLAGSHIP.source, "package");
});

check("G2 validator: rejects broken packages (identity, parity, required blocks, DO, prompt integrity, verify / pro-help boundaries, stale audio)", () => {
  const ctx = { prompts: LEARNING_PROMPTS };
  const errorsOf = (mutate: (p: LessonPackage) => void, c = ctx) => { const p = clone(FLAGSHIP); mutate(p); return validateLessonPackage(p, c).errors.join(" | "); };

  assert.ok(/lessonKey/.test(errorsOf((p) => { p.lessonKey = "Quien Es"; })), "bad identity key must fail");
  assert.ok(/\.en is empty/.test(errorsOf((p) => { p.meta.title.en = " "; })), "ES/EN parity must fail on an empty EN leaf");
  assert.ok(/only one language/.test(errorsOf((p) => { (p.meta as unknown as Record<string, unknown>).outcome = { es: "solo" }; })), "a half leaf must fail");
  for (const type of [...REQUIRED_PACKAGE_BLOCKS]) {
    assert.ok(new RegExp(`missing required block: ${type}|explain block is required`).test(errorsOf((p) => { p.blocks = p.blocks.filter((b) => b.type !== type); })), `missing ${type} must fail`);
  }
  assert.ok(/activity or a checklist/.test(errorsOf((p) => { p.blocks = p.blocks.filter((b) => b.type !== "activity" && b.type !== "checklist"); })), "a lesson with no DO must fail");
  assert.ok(!/activity or a checklist/.test(errorsOf((p) => { p.blocks = p.blocks.filter((b) => b.type !== "activity"); })), "checklist alone satisfies DO");
  assert.ok(/neutral variant/.test(errorsOf((p) => { for (const b of p.blocks) if (b.type === "example") b.variants = b.variants.filter((v) => v.journey); })), "example must work without journey context");
  assert.ok(/unknown promptKey/.test(errorsOf((p) => { for (const b of p.blocks) if (b.type === "ai_prompt") b.promptKey = "nope"; })));
  assert.ok(/block ids must be unique/.test(errorsOf((p) => { p.blocks[1].id = p.blocks[0].id; })));
  assert.ok(/consequential content requires a verify block/.test(errorsOf((p) => { p.meta.consequential = true; p.blocks = p.blocks.filter((b) => b.type !== "verify"); })));
  assert.ok(/requires a pro_help block/.test(errorsOf((p) => { p.meta.truthClass = "jurisdiction_sensitive"; })), "jurisdiction-sensitive content must demand professional-help");
  assert.ok(/recorded from script v/.test(errorsOf((p) => { p.audio!.assets = { es: { src: "/a.mp3", mime: "audio/mpeg", durationSeconds: 500, scriptVersion: 99, sourceKind: "human" } }; })), "a stale recording must fail");

  const badPrompt = clone(WHO_IS_YOUR_CUSTOMER_PROMPT);
  badPrompt.body.en = badPrompt.body.en.replace("[[city]]", "[[town]]");
  const pe = validateLessonPrompt(badPrompt).errors.join(" | ");
  assert.ok(/never uses \[\[city\]\]/.test(pe) && /undeclared token \[\[town\]\]/.test(pe), "prompt tokens must match declared fields in both languages");
  const consequential = clone(WHO_IS_YOUR_CUSTOMER_PROMPT);
  consequential.consequential = true;
  consequential.verify = { es: "", en: "" };
  assert.ok(/verification line/.test(validateLessonPrompt(consequential).errors.join(" | ")));
  assert.deepStrictEqual(collectParityProblems({ a: { es: "x", en: "y" }, b: [{ es: "x", en: "" }] }), ["b[0].en is empty"]);
});

check("G2 flagship: full canonical block vocabulary in teaching order, locked headline, accented display title, journey variants", () => {
  const types = FLAGSHIP.blocks.map((b) => b.type);
  assert.deepStrictEqual(types, ["hook", "outcomes", "explain", "visual_model", "example", "compare", "activity", "ai_prompt", "mistakes", "glossary", "checklist", "verify", "recap"]);
  assert.deepStrictEqual(FLAGSHIP.meta.title, { es: "Quién es tu cliente", en: "Who is your customer?" });
  assert.strictEqual(FLAGSHIP.meta.truthClass, "evergreen");
  assert.ok(!types.includes("pro_help"), "an evergreen lesson does not need a professional-help block");
  const hook = FLAGSHIP.blocks.find((b) => b.type === "hook")!;
  assert.ok(hook.type === "hook" && hook.headline.es === "Tu cliente no es “todo el mundo”." && hook.headline.en === "Your customer is not “everyone”.");
  assert.ok(hook.type === "hook" && hook.textAlternative.es.length > 120 && hook.textAlternative.en.length > 120, "the hook visual needs a useful text alternative");
  const outcomes = FLAGSHIP.blocks.find((b) => b.type === "outcomes")!;
  assert.ok(outcomes.type === "outcomes" && outcomes.items.length === 3);
  const explain = FLAGSHIP.blocks.find((b) => b.type === "explain")!;
  assert.ok(explain.type === "explain" && explain.chunks.length >= 3 && explain.chunks.every((c) => c.body.es.length < 420), "explanation must be short chunks, not one article");
  const model = FLAGSHIP.blocks.find((b) => b.type === "visual_model")!;
  assert.ok(model.type === "visual_model" && model.steps.map((s) => s.label.es).join(" → ") === "Todos → Quien más lo necesita → Tu mensaje");
  const example = FLAGSHIP.blocks.find((b) => b.type === "example")!;
  assert.ok(example.type === "example" && example.business.es === "Panadería de Rosa" && example.label.es === "Ejemplo ilustrativo" && example.label.en === "Illustrative example");
  assert.ok(example.type === "example" && ["idea", "empezando", "negocio", undefined].every((j) => example.variants.some((v) => v.journey === j)), "Rosa needs idea / empezando / negocio / neutral variants");
  assert.ok(example.type === "example" && new Set(example.variants.map((v) => v.story.es)).size === 4);
  const compare = FLAGSHIP.blocks.find((b) => b.type === "compare")!;
  assert.ok(compare.type === "compare" && compare.weak.text.es.includes("Mi cliente es cualquiera que quiera comprar."));
  assert.ok(compare.type === "compare" && compare.strong.text.es.includes("Familias de mi vecindario que necesitan pasteles de cumpleaños personalizados con 2–3 días de aviso y prefieren pedir por WhatsApp."));
  assert.ok(compare.type === "compare" && compare.strong.annotations.map((a) => a.tag.es).join(",") === "Quién,Problema,Dónde,Por qué tú");
  const mistakes = FLAGSHIP.blocks.find((b) => b.type === "mistakes")!;
  assert.ok(mistakes.type === "mistakes" && /te gustar[ií]a tener/.test(mistakes.items[0].mistake.es));
  const checklistBlock = FLAGSHIP.blocks.find((b) => b.type === "checklist")!;
  assert.ok(checklistBlock.type === "checklist" && checklistBlock.items.length === 4);
  const verify = FLAGSHIP.blocks.find((b) => b.type === "verify")!;
  assert.ok(verify.type === "verify" && verify.doctrine.es === "La IA ayuda. Tú verificas." && verify.doctrine.en === "AI helps. You verify." && /3 clientes reales/.test(verify.statement.es));
  const recap = FLAGSHIP.blocks.find((b) => b.type === "recap")!;
  assert.ok(recap.type === "recap" && recap.points.length === 3);
  const glossary = FLAGSHIP.blocks.find((b) => b.type === "glossary")!;
  assert.ok(glossary.type === "glossary" && glossary.resourceKeys.includes("glossary_target_customer"));
  if (glossary.type === "glossary") for (const key of glossary.resourceKeys) assert.ok(MIGRATION.includes(`'${key}'`), `glossary key ${key} is not a real seeded resource`);
});

check("G2: ES/EN parity across the flagship package, prompt, audio script and lesson chrome — no Spanish diacritics in EN", () => {
  assert.deepStrictEqual(collectParityProblems(FLAGSHIP), []);
  assert.deepStrictEqual(collectParityProblems(WHO_IS_YOUR_CUSTOMER_PROMPT), []);
  const enLeaves = (v: unknown, path = ""): [string, string][] => {
    if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 2 && "es" in v && "en" in v) return [[path, String((v as { en: unknown }).en)]];
    if (Array.isArray(v)) return v.flatMap((x, i) => enLeaves(x, `${path}[${i}]`));
    if (v && typeof v === "object") return Object.entries(v).flatMap(([k, x]) => enLeaves(x, `${path}.${k}`));
    return [];
  };
  for (const [path, text] of [...enLeaves(FLAGSHIP, "pkg"), ...enLeaves(WHO_IS_YOUR_CUSTOMER_PROMPT, "prompt")]) {
    assert.ok(!SPANISH_DIACRITICS.test(text), `EN leaf ${path} contains Spanish diacritics: ${text.slice(0, 60)}`);
  }
  const es = leaves(lessonCopy("es"));
  const en = leaves(lessonCopy("en"));
  assert.deepStrictEqual(en.map(([k]) => k), es.map(([k]) => k), "lesson chrome: EN shape must mirror ES");
  for (const [k, v] of en) assert.ok(v.trim().length > 0 && !SPANISH_DIACRITICS.test(v), `lesson chrome EN leaf ${k} is empty or has Spanish diacritics`);
  for (const [k, v] of es) assert.ok(v.trim().length > 0, `lesson chrome ES leaf ${k} is empty`);
  assert.deepStrictEqual([lessonCopy("es").modes.read, lessonCopy("es").modes.listen, lessonCopy("es").modes.do, lessonCopy("es").modes.askAi], ["Leer", "Escuchar", "Hacer", "Preguntar a IA"]);
  assert.deepStrictEqual([lessonCopy("en").modes.read, lessonCopy("en").modes.listen, lessonCopy("en").modes.do, lessonCopy("en").modes.askAi], ["Read", "Listen", "Do", "Ask AI"]);
});

check("G2.1 AI development lab: exactly three full, assistant-neutral conversation templates (develop · interview · challenge) with purpose, why-it-works, privacy and verify", () => {
  const block = FLAGSHIP.blocks.find((b) => b.type === "ai_prompt")!;
  assert.ok(block.type === "ai_prompt");
  if (block.type !== "ai_prompt") return;
  const keys = [block.promptKey, ...(block.moreTemplateKeys ?? [])];
  assert.deepStrictEqual(keys, ["who_is_your_customer", "who_is_your_customer_interview", "who_is_your_customer_challenge"], "exactly three templates, develop first");
  assert.deepStrictEqual(FLAGSHIP_PROMPTS.map((p) => p.promptKey), keys, "the flagship lab is exactly these three");
  assert.deepStrictEqual(block.title, { es: "Desarrolla a tu cliente con tu IA", en: "Develop your customer with AI" });
  assert.ok(block.intro && block.intro.es.length > 40 && block.intro.en.length > 40);

  const [develop, interview, challenge] = keys.map((k) => LEARNING_PROMPTS[k]);
  assert.deepStrictEqual([develop.title.es, interview.title.es, challenge.title.es], ["Desarrolla a mi cliente", "Entrevístame", "Reta mis suposiciones"]);
  assert.deepStrictEqual([develop.title.en, interview.title.en, challenge.title.en], ["Develop my customer", "Interview me", "Challenge my assumptions"]);
  assert.strictEqual(develop.version, 2, "the evolved primary template is a new version (a published prompt version is immutable)");

  for (const p of [develop, interview, challenge]) {
    assert.deepStrictEqual(validateLessonPrompt(p).errors, [], `${p.promptKey}: ${validateLessonPrompt(p).errors.join(" | ")}`);
    assert.deepStrictEqual(collectParityProblems(p), [], `${p.promptKey}: ES/EN parity`);
    assert.ok(p.purpose && p.purpose.es.length > 30 && p.purpose.en.length > 30, `${p.promptKey}: needs a "what this helps with" line`);
    assert.ok(p.whyItWorks.length >= 3, `${p.promptKey}: needs "why it works"`);
    assert.deepStrictEqual(p.privacy.never.map((n) => n.en), ["full names", "phone numbers", "addresses", "private account information"]);
    assert.ok(/clientes reales/.test(p.verify.es) && /real customers/i.test(p.verify.en), `${p.promptKey}: verify line`);
    assert.deepStrictEqual(Object.keys(p.variants ?? {}).sort(), ["empezando", "idea", "negocio"], `${p.promptKey}: needs idea / empezando / negocio variants`);
    // Full conversation starters, not one-line questions.
    for (const body of [p.body, ...Object.values(p.variants ?? {}).map((v) => v.body)]) {
      for (const lang of ["es", "en"] as const) {
        assert.ok(words(body[lang]) >= 90, `${p.promptKey}: a template must be a complete conversation starter (${words(body[lang])} words)`);
        assert.ok(!/\[\[[a-z_]+\]\]\S*\[\[/.test(body[lang]));
      }
    }
  }

  // Behaviour each template must teach.
  for (const body of [develop.body, ...Object.values(develop.variants!).map((v) => v.body)]) {
    assert.ok(/hip[oó]tesis|suposiciones|observaciones/i.test(body.es) && /hypothes|assumptions|observations/i.test(body.en), "develop: answers are framed as hypotheses/observations, not facts");
    assert.ok(/No (inventes|supongas)/.test(body.es) && /Do not (invent|assume)/.test(body.en), "develop: forbids invention");
    assert.ok(/personas reales|ventas reales/.test(body.es) && /real people|real sales/.test(body.en), "develop: ends in what to test for real");
  }
  for (const body of [interview.body, ...Object.values(interview.variants!).map((v) => v.body)]) {
    assert.ok(/unas 5 preguntas, una a la vez, y espera mi respuesta/.test(body.es) && /about 5 questions, one at a time, and wait for my answer/.test(body.en), "interview: ~5 questions, one at a time, waits");
    assert.ok(/No me des respuestas todav[ií]a/.test(body.es) && /Do not give me answers yet/.test(body.en));
    assert.ok(/No inventes nada/.test(body.es) && /Do not invent anything/.test(body.en));
  }
  for (const body of [challenge.body, ...Object.values(challenge.variants!).map((v) => v.body)]) {
    assert.ok(/No quiero que me des la raz[oó]n/.test(body.es) && /I do not want you to agree with me/.test(body.en), "challenge: not only for agreement");
    assert.ok(/Separa lo que parece que realmente s[eé] de lo que solo estoy suponiendo/.test(body.es) && /Separate what I seem to actually know from what I am only assuming/.test(body.en));
    assert.ok(/No presentes datos de mercado como si fueran ciertos/.test(body.es) && /Do not present market facts as if they were certain/.test(body.en), "challenge: never pretends market facts are known");
  }

  // Practical communication, no prompt-engineering jargon; no claimed certainty; assistant-neutral.
  const allText = JSON.stringify(LEARNING_PROMPTS);
  assert.ok(!/zero-shot|few-shot|context window|ventana de contexto|system prompt|prompt engineering/i.test(allText), "no technical AI jargon in the flagship templates");
  assert.ok(!/garantiz|guarantee|sin duda|definitely|con certeza|100%/i.test(allText), "templates must not claim certainty");
  const BRANDS = /openai|chatgpt|\bgpt-?\d|claude|anthropic|gemini|copilot|\bbard\b|\bllama ?\d|mistral|perplexity|deepseek/i;
  for (const rel of LESSON_ALL_FILES) assert.ok(!BRANDS.test(stripComments(read(rel))), `${rel} names an AI provider — templates must stay assistant-neutral`);
  assert.ok(develop.customize.length === 4 && develop.followUps.length === 3, "lab-level customise + keep-asking coaching stays on the primary template");
});

check("G2.1 auto-fill: all five activity answers + city + stage populate every template locally; missing stays missing; clearing the activity clears the templates", () => {
  const activity = FLAGSHIP.blocks.find((b) => b.type === "activity")!;
  assert.ok(activity.type === "activity");
  const answers = { offer: "pasteles personalizados", who: "familias de mi vecindario", problem: "un pastel especial con poco aviso", where: "grupos de WhatsApp del vecindario", why: "cumplo la fecha" };
  for (const p of FLAGSHIP_PROMPTS) {
    const activityTokens = p.fields.filter((f) => f.prefillFrom?.kind === "activity_field");
    assert.deepStrictEqual(activityTokens.map((f) => (f.prefillFrom as { fieldKey: string }).fieldKey), [...CUSTOMER_STATEMENT_FIELD_KEYS], `${p.promptKey}: all five activity answers feed the template`);
    if (activity.type === "activity") for (const f of activityTokens) assert.ok(activity.fields.some((a) => a.key === (f.prefillFrom as { fieldKey: string }).fieldKey));
    assert.deepStrictEqual(editablePromptFields(p).map((f) => f.token), ["city", "stage"], "the learner only adds what Leonix does not already have");

    for (const journey of ["idea", "empezando", "negocio", null] as const) {
      // Nothing typed, nothing answered → every learner value is a visible blank; nothing is invented.
      const emptyValues = resolvePromptValues(p, { answers: {}, typed: {}, journey, lang: "es" });
      const empty = renderPrompt(p, "es", emptyValues, journey);
      for (const t of ["offer", "who", "problem", "where", "why", "city"]) assert.ok(empty.missing.includes(t), `${p.promptKey}/${String(journey)}: [[${t}]] must stay missing`);
      assert.ok(empty.text.includes("[qué vendes]") && empty.text.includes("[ciudad]") && !empty.text.includes("[["), "blanks stay visibly incomplete");
      assert.ok(empty.parts.every((part) => part.kind !== "filled" || part.token === "stage"), "only the journey stage may be prefilled without learner input");

      // All five answers + city flow in, verbatim.
      const values = resolvePromptValues(p, { answers, typed: { city: "San José" }, journey, lang: "es" });
      const full = renderPrompt(p, "es", values, journey);
      for (const v of [...Object.values(answers), "San José"]) assert.ok(full.text.includes(v), `${p.promptKey}/${String(journey)}: "${v}" did not reach the template`);
      assert.deepStrictEqual(full.missing, journey ? [] : ["stage"], "with no journey the stage stays for the learner to fill");

      // One source of truth: a stale typed override can never resurrect an activity answer…
      const stale = resolvePromptValues(p, { answers: {}, typed: { offer: "valor viejo", city: "San José" }, journey, lang: "es" });
      assert.strictEqual(stale.offer, "", "clearing the activity clears the value in every template");
      // …and editing the activity updates the template.
      assert.strictEqual(resolvePromptValues(p, { answers: { ...answers, who: "oficinas del centro" }, typed: {}, journey, lang: "es" }).who, "oficinas del centro");
    }
    // The learner can overwrite the stage; an emptied stage stays empty (never re-guessed).
    assert.strictEqual(resolvePromptValues(p, { answers, typed: { stage: "" }, journey: "idea", lang: "es" }).stage, "");
    assert.strictEqual(resolvePromptValues(p, { answers, typed: {}, journey: "idea", lang: "en" }).stage, "I have an idea and I am not selling yet");
  }
  const lab = stripComments(read(`${LESSON_UI_DIR}/LessonPromptBlock.tsx`));
  assert.ok(lab.includes("resolvePromptValues(prompt, ctx)") && lab.includes("answers: state.answers"), "the lab assembles templates from the shared local lesson state");
  assert.ok(read(`${LESSON_UI_DIR}/LessonActivityCustomerStatement.tsx`).includes("update((prev) => ({ ...prev, answers: {} }))"), "“Borrar mis respuestas” empties the answers the templates read");
});

check("G2.1 stage-aware: idea explores, empezando prepares, negocio diagnoses — same lesson, different AI conversation; invalid journey falls back to neutral", () => {
  for (const p of FLAGSHIP_PROMPTS) {
    const bodies = { neutral: resolvePromptBody(p, null), idea: resolvePromptBody(p, "idea"), empezando: resolvePromptBody(p, "empezando"), negocio: resolvePromptBody(p, "negocio") };
    assert.strictEqual(new Set(Object.values(bodies).map((b) => b.es)).size, 4, `${p.promptKey}: the four ES bodies must differ`);
    assert.strictEqual(new Set(Object.values(bodies).map((b) => b.en)).size, 4, `${p.promptKey}: the four EN bodies must differ`);
    assert.strictEqual(bodies.neutral, p.body);
    assert.ok(/Estoy pensando en empezar un negocio/.test(bodies.idea.es) && /I am thinking about starting a small business/.test(bodies.idea.en), "idea: considering the business");
    assert.ok(/antes de gastar/.test(bodies.idea.es) && /before I spend/.test(bodies.idea.en), "idea: validate before spending");
    assert.ok(/Ya decid[ií] empezar/.test(bodies.empezando.es) && /I have decided to start/.test(bodies.empezando.en), "empezando: decided to start");
    assert.ok(/Ya opero un negocio/.test(bodies.negocio.es) && /I already operate a small business/.test(bodies.negocio.en), "negocio: already operating");
    assert.ok(/mis clientes principales/.test(bodies.negocio.es) && /my main customers/.test(bodies.negocio.en), "negocio: the five answers become observations about existing customers");
    assert.ok(bodies.neutral.es.includes("[[stage]]") && !bodies.negocio.es.includes("[[stage]]"), "a variant carries its stage in its wording; neutral asks for it");
  }
  const develop = LEARNING_PROMPTS.who_is_your_customer;
  assert.ok(/qu[eé] me falta aprender todav[ií]a/.test(resolvePromptBody(develop, "idea").es) && /de forma barata, antes de gastar fuerte/.test(resolvePromptBody(develop, "idea").es));
  assert.ok(/evidencia que deber[ií]a reunir antes de lanzar/.test(resolvePromptBody(develop, "empezando").es) && /No inventes fechas, precios, requisitos/.test(resolvePromptBody(develop, "empezando").es), "empezando: launch actions, no invented launch facts");
  const negocio = resolvePromptBody(develop, "negocio");
  assert.ok(/si mi base de clientes est[aá] cambiando/.test(negocio.es) && /sin perder a los clientes que ya tengo/.test(negocio.es));
  assert.ok(/qu[eé] informaci[oó]n real de clientes y de ventas tengo disponible/.test(negocio.es) && /No supongas datos demogr[aá]ficos, de ventas ni de mercado/.test(negocio.es));
  assert.ok(/whether my customer base is changing/.test(negocio.en) && /Do not assume demographic, sales, or market facts I have not provided/.test(negocio.en));

  // Invalid / absent journey → neutral behaviour, safely.
  assert.strictEqual(journeyFromSearchParams({ journey: "hack" }), null);
  assert.strictEqual(resolvePromptBody(develop, journeyFromSearchParams({ journey: "hack" })), develop.body);
  assert.strictEqual(resolvePromptBody({ ...develop, variants: undefined }, "idea"), develop.body, "a single-body prompt (original form) still works");
  const lab = read(`${LESSON_UI_DIR}/LessonPromptBlock.tsx`);
  assert.ok(lab.includes("renderPrompt(prompt, lang, resolvePromptValues(prompt, ctx), journey)"), "the lab renders the journey's variant");
  assert.ok(read(`${LESSON_UI_DIR}/LessonPrintSheet.tsx`).includes("journey).text"), "the printed primary template is the journey's variant too");
  // Stage variants live in data — the renderer stays generic (no lesson- or journey-specific branches).
  const renderer = stripComments(read(`${LESSON_UI_DIR}/LessonRenderer.tsx`));
  assert.ok(!/who_is_your_customer|journey === "(idea|empezando|negocio)"/.test(renderer + stripComments(lab)), "no lesson/journey condition jungle in the UI");
});

check("G2.1 result bridge: right after the customer sentence the learner is told what it is, what it is for, that it must be tested — with a CTA into the AI lab", () => {
  const activity = FLAGSHIP.blocks.find((b) => b.type === "activity")!;
  assert.ok(activity.type === "activity" && activity.resultBridge);
  if (activity.type !== "activity" || !activity.resultBridge) return;
  const b = activity.resultBridge;
  assert.deepStrictEqual(b.title, { es: "¿Y ahora qué hago con esto?", en: "What do I do with this now?" });
  assert.deepStrictEqual(b.cta, { es: "Desarrollarlo con mi IA", en: "Develop it with my AI" });
  assert.ok(/primer borrador de cliente/.test(b.lead.es) && /hip[oó]tesis de trabajo/.test(b.lead.es) && /no un anuncio terminado/.test(b.lead.es), "a first working draft — never finished advertising copy");
  assert.ok(/first customer draft/.test(b.lead.en) && /working hypothesis/.test(b.lead.en) && /not finished advertising copy/.test(b.lead.en));
  const points = b.points.map((p) => p.es).join(" ");
  assert.ok(/lo que hoy crees/.test(points) && /tu mensaje/.test(points) && /d[oó]nde encontrar/.test(points) && /investigar/.test(points) && /personas reales/.test(points), "organises beliefs · message/where/what to investigate · must be tested");
  assert.ok(/contexto para las conversaciones con tu IA/.test(b.carryForward.es) && /context for the AI conversations/.test(b.carryForward.en));
  assert.ok(b.points.length <= 4 && [b.lead, ...b.points, b.carryForward].every((t) => t.es.length < 170 && t.en.length < 170), "the bridge stays concise — not a new giant section");
  assert.deepStrictEqual(collectParityProblems(b), []);

  // A package activity without a bridge is rejected: never collect an answer without showing its use.
  const noBridge = clone(FLAGSHIP);
  for (const x of noBridge.blocks) if (x.type === "activity") delete x.resultBridge;
  assert.ok(/resultBridge/.test(validateLessonPackage(noBridge, { prompts: LEARNING_PROMPTS }).errors.join(" | ")));

  const ui = read(`${LESSON_UI_DIR}/LessonActivityCustomerStatement.tsx`);
  assert.ok(ui.indexOf("data-result-bridge") > ui.indexOf("copy.savedLocal") && ui.indexOf("copy.savedLocal") > ui.indexOf('aria-live="polite"'), "the bridge comes immediately after the generated sentence");
  assert.ok(ui.includes("<a href={bridge.ctaHref} className={`mt-4 ${LEARNING_BTN_PRIMARY}`}>"), "the CTA is a real ≥44 px anchor");
  assert.ok(ui.includes("{copy.copy}") && ui.includes("{copy.clear}"), "Copy my phrase / Clear my answers are kept");
  const renderer = read(`${LESSON_UI_DIR}/LessonRenderer.tsx`);
  assert.ok(renderer.includes("ctaHref: prompt ? `#${LESSON_MODE_ANCHORS.askAi}` : null"), "result → AI anchor targets the AI development section");
  assert.ok(renderer.includes('askAi: "preguntar-ia"') && renderer.includes("LESSON_MODE_ANCHORS.askAi : `b-${b.id}`"), "the AI section carries that anchor id");
});

check("G2.1 lab UI: primary template open, the others in native <details> (content stays in the HTML); compact per-template reminders; lab-level privacy + verify", () => {
  const lab = read(`${LESSON_UI_DIR}/LessonPromptBlock.tsx`);
  assert.ok(lab.includes("prompts.slice(1).map") && lab.includes("<details") && lab.includes("<summary"), "secondary templates use native disclosure, not JS tabs");
  assert.ok(!/role="tab|aria-selected|hidden=\{|display:\s*none/.test(stripComments(lab)), "no tab pattern that removes template content from the document");
  assert.ok(lab.includes("min-h-12 cursor-pointer"), "the disclosure control is a ≥44 px target");
  assert.ok(lab.includes("copy.purpose") && lab.includes("copy.why") && lab.includes("copy.reminder") && lab.includes("primary.privacy.never") && lab.includes("primary.verify[lang]"));
  assert.ok(lab.includes("motion-reduce:transition-none"), "the chevron respects reduced motion");
  for (const lang of ["es", "en"] as const) {
    const c = lessonCopy(lang).prompt;
    assert.ok(/datos personales|personal details/.test(c.reminder) && /personas reales|real people/.test(c.reminder), "each template repeats a one-line privacy + verify reminder");
    assert.ok(!/\b(tres|three|dos|two)\b/i.test(`${c.answersIncluded} ${c.moreTemplates}`), "lab chrome must not hardcode the template count");
  }
  assert.strictEqual(lessonCopy("es").prompt.purpose, "Para qué sirve");
  assert.strictEqual(lessonCopy("en").prompt.purpose, "What this helps with");
  assert.strictEqual(lessonCopy("es").prompt.why, "Por qué funciona");
  assert.strictEqual(lessonCopy("en").prompt.why, "Why it works");
});

check("G2.1 print: “Imprimir mi hoja” prints ONLY the worksheet DOM (title · sentence · checklist · primary AI template · verify reminder) — not the whole lesson", () => {
  const sheet = read(`${LESSON_UI_DIR}/LessonPrintSheet.tsx`);
  const css = stripComments(sheet);
  assert.ok(sheet.includes('LESSON_SHEET_ID = "leonix-lesson-sheet"') && sheet.includes("createPortal(sheet, document.body)"), "the sheet is a direct child of <body>");
  assert.ok(css.includes("body > *:not(#${LESSON_SHEET_ID}) { display: none !important; }"), "everything else is removed from the print layout (display:none), so no blank lesson pages paginate");
  assert.ok(!/visibility:\s*hidden/.test(css), "visibility:hidden keeps layout — that is what printed 13 pages");
  assert.ok(css.includes("#${LESSON_SHEET_ID} { display: none; }"), "the sheet never shows on screen");
  assert.ok(css.includes('setAttribute(SHEET_PRINT_ATTR, "")') && css.includes('addEventListener("afterprint", clear)'), "sheet-only rules apply only while the button prints");
  for (const part of ["{copy.sheetTitle}: {lessonTitle}", "{resultText}", "checklist.map", "{promptText}", "{copy.footer}"]) assert.ok(sheet.includes(part), `sheet is missing ${part}`);
  assert.ok(sheet.includes("/** The primary template only. */") && !sheet.includes("prompts.map"), "only the PRIMARY template is printed");
  assert.ok(/verificas|verify/i.test(lessonCopy("es").print.footer) && /verify/i.test(lessonCopy("en").print.footer), "the sheet ends with the verification reminder");
  assert.ok(!/jspdf|pdfkit|pdf-lib|react-pdf|puppeteer|html2canvas/i.test(sheet), "no PDF library");
  assert.ok(read(`${LESSON_UI_DIR}/LessonRenderer.tsx`).includes("prompt={prompt}"), "the renderer hands the sheet the primary template");
});

check("G2: Leonix calls no AI API and lesson islands send nothing over the network (learner text stays in the browser)", () => {
  for (const rel of [...LESSON_LIB_FILES, ...LESSON_SERVER_UI, ...LESSON_CLIENT_UI]) {
    const src = stripComments(read(rel));
    assert.ok(!/\bfetch\(|XMLHttpRequest|sendBeacon|axios|\/api\//.test(src), `${rel} performs a network call`);
    assert.ok(!/@anthropic-ai|from ["']openai["']|generativeai|api\.openai|\/v1\/(chat|messages|completions)/.test(src), `${rel} references an AI SDK/API`);
  }
  const store = read(`${LESSON_UI_DIR}/lessonLocalStore.ts`);
  assert.ok(store.includes("window.localStorage") && store.includes('"leonix.learning.v1"'), "anonymous answers live in localStorage");
  const pkgJson = read("package.json");
  assert.ok(!/jspdf|pdfkit|pdf-lib|react-pdf|puppeteer/i.test(read(`${LESSON_UI_DIR}/LessonPrintSheet.tsx`)), "print sheet must not use a PDF library");
  assert.ok(pkgJson.length > 0);
});

check("G2 activity: the customer sentence is built ONLY from learner input — blanks stay blanks, nothing is generated", () => {
  assert.deepStrictEqual([...CUSTOMER_STATEMENT_FIELD_KEYS], ["offer", "who", "problem", "where", "why"]);
  const activity = FLAGSHIP.blocks.find((b) => b.type === "activity")!;
  assert.ok(activity.type === "activity" && activity.activityKey === "customer_statement_builder");
  assert.ok(activity.type === "activity" && activity.fields.map((f) => f.key).join(",") === CUSTOMER_STATEMENT_FIELD_KEYS.join(","));
  assert.ok(activity.type === "activity" && activity.fields.map((f) => f.label.es).join("|") === "¿Qué vendes?|¿Quién lo necesita más?|¿Qué problema resuelves?|¿Dónde están?|¿Por qué te elegirían?");

  const none = buildCustomerStatement({}, "es");
  assert.strictEqual(none.filledCount, 0);
  assert.strictEqual(none.complete, false);
  assert.strictEqual(none.text, "Ayudo a [quién] con [problema] en [dónde] ofreciendo [qué vendes]. Me eligen porque [por qué tú].");
  assert.strictEqual(buildCustomerStatement({}, "en").text, "I help [who] with [problem] in [where] by offering [what you sell]. They choose me because [why you].");
  assert.ok(none.parts.filter((p) => p.kind === "blank").length === 5 && none.parts.every((p) => p.kind !== "answer"));

  const one = buildCustomerStatement({ who: "  familias de mi   vecindario. " }, "es");
  assert.strictEqual(one.filledCount, 1);
  assert.strictEqual(one.text, "Ayudo a familias de mi vecindario con [problema] en [dónde] ofreciendo [qué vendes]. Me eligen porque [por qué tú].", "only the typed answer appears; the rest stay blank");

  // Grammar-safe: no template verb has to agree with a learner answer, so singular and plural both read correctly.
  for (const lang of ["es", "en"] as const) {
    const fixed = buildCustomerStatement({}, lang).parts.filter((p) => p.kind === "text").map((p) => p.text).join("|");
    assert.ok(!/necesita|necesitan|\bneeds?\b|\bwho\b|\bque\b/.test(fixed), `${lang} template still has a verb/relative clause that must agree with the answer: ${fixed}`);
  }
  const plural = buildCustomerStatement({ who: "familias de mi vecindario", problem: "pasteles de cumpleaños con poco aviso", where: "mi vecindario", offer: "pasteles personalizados", why: "cumplo la fecha" }, "es").text;
  const singular = buildCustomerStatement({ who: "una familia ocupada", problem: "su pastel de cumpleaños", where: "San José", offer: "pasteles personalizados", why: "cumplo la fecha" }, "es").text;
  assert.strictEqual(plural, "Ayudo a familias de mi vecindario con pasteles de cumpleaños con poco aviso en mi vecindario ofreciendo pasteles personalizados. Me eligen porque cumplo la fecha.");
  assert.strictEqual(singular, "Ayudo a una familia ocupada con su pastel de cumpleaños en San José ofreciendo pasteles personalizados. Me eligen porque cumplo la fecha.");
  // All five answers are used, in both languages, and messy punctuation never doubles up.
  const messy = buildCustomerStatement({ who: "families.", problem: ", a special cake;", where: "my area!!", offer: "cakes.,", why: "  I deliver on time?  " }, "en");
  assert.strictEqual(messy.text, "I help families with a special cake in my area by offering cakes. They choose me because I deliver on time.");
  assert.ok(!/\.\.|,\.|;\.|\s\.|\s,| {2}/.test(messy.text), "no duplicate or dangling punctuation");
  assert.strictEqual(messy.parts.filter((p) => p.kind === "answer").length, 5);
  if (activity.type === "activity") for (const f of activity.fields) assert.ok(!none.text.includes(f.placeholder.es.replace("p. ej. ", "")), "placeholder examples must never leak into the sentence");

  const full = buildCustomerStatement({ offer: "cakes", who: "families", problem: "a special cake", where: "my neighborhood", why: "I deliver on time!" }, "en");
  assert.strictEqual(full.complete, true);
  assert.strictEqual(full.text, "I help families with a special cake in my neighborhood by offering cakes. They choose me because I deliver on time.");
  assert.strictEqual(cleanStatementAnswer("x".repeat(500)).length, MAX_STATEMENT_ANSWER_LENGTH);
  assert.strictEqual(cleanStatementAnswer(null), "");

  const ui = stripComments(read(`${LESSON_UI_DIR}/LessonActivityCustomerStatement.tsx`));
  assert.ok(ui.includes("buildCustomerStatement(") && ui.includes("htmlFor={id}") && ui.includes('aria-live="polite"'), "activity needs labels and a polite live region");
  assert.ok(!/prompts|renderPrompt|generate|suggest/i.test(ui), "the activity must not generate or suggest answers");
});

check("G2 legacy adapter: the 7 other published lessons become an honest reduced structure made ONLY of stored text", () => {
  const others = PUBLISHED_SEED_KEYS.filter((k) => k !== "who_is_your_customer");
  assert.strictEqual(others.length, 7);
  for (const key of others) {
    const seed = seedLesson(key);
    assert.ok((seed.bodyEs ?? "").length > 1200 && (seed.bodyEn ?? "").length > 1200, `${key}: could not read the stored bodies`);
    for (const body of [seed.bodyEs, seed.bodyEn]) {
      const parsed = parseLegacyBody(body);
      assert.strictEqual(parsed.structured, true, `${key}: stored body was not recognised`);
      assert.strictEqual(parsed.steps.length, 5, `${key}: expected five stored practical steps`);
    }
    const pkg = legacyLessonToPackage(seed, ["checklist_x"]);
    assert.strictEqual(pkg.source, "legacy");
    assert.deepStrictEqual(pkg.blocks.map((b) => b.type), ["explain", "steps", "note", "resource"], `${key}: reduced structure`);
    assert.ok(!pkg.audio && !pkg.blocks.some((b) => ["hook", "example", "activity", "ai_prompt", "compare", "visual_model"].includes(b.type)), `${key}: adapter must not pretend to be a flagship package`);
    const r = validateLessonPackage(pkg, { prompts: LEARNING_PROMPTS });
    assert.deepStrictEqual(r.errors, [], `${key}: ${r.errors.join(" | ")}`);

    // Every emitted sentence is a verbatim slice of the stored body (labels are the only added words).
    const labelTexts = new Set<string>(Object.values(LEGACY_SECTION_LABELS).flatMap((l) => [l.es, l.en]));
    const emitted: [string, string][] = [];
    for (const b of pkg.blocks) {
      if (b.type === "explain") for (const c of b.chunks) emitted.push([c.body.es, c.body.en]);
      if (b.type === "steps") for (const i of b.items) emitted.push([i.es, i.en]);
      if (b.type === "note") emitted.push([b.body.es, b.body.en]);
    }
    assert.ok(emitted.length >= 8, `${key}: intro + why + 5 steps + note`);
    for (const [esText, enText] of emitted) {
      assert.ok(!labelTexts.has(esText) && (seed.bodyEs ?? "").includes(esText), `${key}: adapter invented ES text: ${esText.slice(0, 50)}`);
      assert.ok((seed.bodyEn ?? "").includes(enText), `${key}: adapter invented EN text: ${enText.slice(0, 50)}`);
    }
    assert.deepStrictEqual(pkg.meta.title, { es: seed.titleEs, en: seed.titleEn }, "legacy titles render exactly as stored (no DB mutation, no silent rewrite)");
  }
  // Unknown shapes never fall back to one essay box, and never throw.
  const odd = legacyLessonToPackage({ lessonKey: "odd", titleEs: "t", titleEn: "t", summaryEs: "s", summaryEn: "s", bodyEs: "Uno.\n\nDos.\n\nTres.", bodyEn: "One.\n\nTwo.", estimatedMinutes: 5 });
  assert.deepStrictEqual(odd.blocks.map((b) => b.type), ["explain"]);
  assert.ok(odd.blocks[0].type === "explain" && odd.blocks[0].chunks.length === 3);
  assert.doesNotThrow(() => legacyLessonToPackage({ lessonKey: "empty", titleEs: "t", titleEn: "t", summaryEs: "", summaryEn: "", bodyEs: null, bodyEn: null, estimatedMinutes: 5 }));
});

check("G2: all 8 published lessons resolve through ONE renderer; no plain essay box remains; planned lessons stay unreachable", () => {
  assert.strictEqual(Object.keys(CODE_OWNED_LESSON_PACKAGES)[0], "who_is_your_customer", "the flagship stays the reference package");
  for (const key of PUBLISHED_SEED_KEYS) assert.strictEqual(key in CODE_OWNED_LESSON_PACKAGES, key === "who_is_your_customer", "no seeded lesson other than the flagship has been upgraded yet");
  for (const key of PUBLISHED_SEED_KEYS) {
    const pkg = resolveLessonPackage(seedLesson(key));
    assert.strictEqual(pkg.lessonKey, key);
    assert.strictEqual(pkg.source, key === "who_is_your_customer" ? "package" : "legacy");
    assert.ok(pkg.blocks.some((b) => b.type === "explain"));
  }
  for (const key of PLANNED_SEED_KEYS) assert.strictEqual(getCodeOwnedLessonPackage(key), null, `planned lesson ${key} must not get a package in G2`);
  for (const rel of LESSON_ALL_FILES) for (const key of PLANNED_SEED_KEYS) assert.ok(!stripComments(read(rel)).includes(key), `${rel} references planned lesson ${key}`);

  const page = read(LESSON_PAGE);
  assert.ok(page.includes("getPublishedLessonByKey(lessonKey)") && page.includes("if (!lesson) notFound();"), "a planned/draft/archived lesson must still 404");
  assert.ok(page.includes("resolveLessonPackage(lesson, relatedResourceKeys)") && page.includes("<LessonRenderer"), "the page must render through the package renderer");
  assert.ok(page.includes("params: Promise<{ lessonKey: string }>") && page.includes("journeyFromSearchParams(sp)"));
  for (const rel of [LESSON_PAGE, ...LESSON_SERVER_UI]) {
    const src = stripComments(read(rel));
    assert.ok(!src.includes("whitespace-pre-line"), `${rel} still renders a whitespace-pre-line essay`);
    assert.ok(!/\{body\}|lesson\.bodyEs|lesson\.bodyEn/.test(src), `${rel} still prints the raw stored body`);
  }
  assert.ok(read("app/(site)/dashboard/business-tools/concierge/_components/ActionCard.tsx").includes("/aprender/leccion/${data.relatedLessonKey}"), "Concierge deep link intact");
  assert.ok(read("app/(site)/dashboard/business-tools/idea-builder/IdeaBuilderWizard.tsx").includes("/aprender/leccion/${l.lessonKey}"), "Idea Builder deep link intact");
});

check("G2 renderer: server shell with small client islands; modes are anchors in one document and only appear when real", () => {
  for (const rel of LESSON_SERVER_UI) assert.ok(!/^["']use client["']/m.test(read(rel)), `${rel} must stay a server component`);
  for (const rel of LESSON_CLIENT_UI) assert.ok(/^["']use client["']/m.test(read(rel)), `${rel} must be a client island`);
  const renderer = read(`${LESSON_UI_DIR}/LessonRenderer.tsx`);
  assert.ok(renderer.includes('{ read: "leer", listen: "escuchar", do: "hacer", askAi: "preguntar-ia" }'));
  assert.ok(!/role="tab|aria-selected|useState/.test(stripComments(renderer)), "modes must be anchors, not tabs that remove content");
  assert.ok(renderer.includes("if (showListen) modes.push") && renderer.includes("if (prompt) modes.push") && renderer.includes("if (doBlockId) modes.push"), "a mode chip appears only when that mode exists");
  assert.strictEqual((renderer.match(/<h1\b/g) ?? []).length, 1, "exactly one h1");
  assert.ok(renderer.includes("sticky top-[3.25rem]"), "mode bar sticks below the fixed site header");
  assert.ok(renderer.includes("overflow-x-clip") && !stripComments(renderer).includes("overflow-x-hidden"), "overflow-x-hidden on <main> would break the sticky mode bar — use overflow-x-clip");
  assert.ok(renderer.includes("LessonProgressButton"), "existing account progress stays wired for legacy lessons (semantics unchanged until G5)");
  for (const type of ["hook", "outcomes", "explain", "visual_model", "example", "compare", "activity", "ai_prompt", "mistakes", "glossary", "checklist", "resource", "verify", "pro_help", "recap", "steps", "note"]) {
    assert.ok(renderer.includes(`case "${type}":`), `renderer does not handle block type ${type}`);
  }
});

check("G2 owner-QA: the flagship (structured package) never renders the legacy one-click account completion; legacy lessons keep it untouched", () => {
  const renderer = stripComments(read(`${LESSON_UI_DIR}/LessonRenderer.tsx`));
  assert.strictEqual((renderer.match(/<LessonProgressButton\b/g) ?? []).length, 1, "the legacy account control must be rendered from exactly one place");
  assert.ok(
    /\{pkg\.source === "legacy" \? \(\s*<div data-legacy-account-progress>[\s\S]{0,400}?<LessonProgressButton lessonKey=\{pkg\.lessonKey\} lang=\{lang\} \/>[\s\S]{0,120}?\) : null\}/.test(renderer),
    "LessonProgressButton must sit behind the source === \"legacy\" guard",
  );
  assert.strictEqual(FLAGSHIP.source, "package", "the flagship is a structured package → the guard hides the account control for it");
  assert.strictEqual(resolveLessonPackage(seedLesson("who_is_your_customer")).source, "package");
  assert.strictEqual(resolveLessonPackage(seedLesson("revenue_vs_profit")).source, "legacy", "legacy lessons keep their existing progress behaviour");
  assert.ok(renderer.includes("<LessonLocalCompletion"), "the flagship closes with the device-local completion pattern");
  // Untouched for the later G5 replacement: component, API actions, schema, capability grant.
  const button = read(`${APRENDER_DIR}/_components/LessonProgressButton.tsx`);
  assert.ok(button.includes('action: "start"') && button.includes('action: "complete"'), "LessonProgressButton semantics must be unchanged");
  assert.ok(LEARNING_REPOSITORY_SRC.includes('source: "lesson_completed"') && LEARNING_REPOSITORY_SRC.includes("capability_key: lesson.capabilityKey"), "capability grant logic must be unchanged");
});

check("G2 owner-QA: compact phone breadcrumb — one back target + a non-link checkpoint label; full linked breadcrumb from sm; neutral mode still works", () => {
  const renderer = stripComments(read(`${LESSON_UI_DIR}/LessonRenderer.tsx`));
  assert.ok(renderer.includes('<li className={journey && pathwayHref ? "hidden sm:block" : undefined}>'), "with a journey the Learning Center link is desktop-only; with no journey it stays the phone back target");
  assert.ok(renderer.includes('<FiArrowLeft className="h-4 w-4 sm:hidden" aria-hidden />'), "on phones the journey link is the single back target");
  assert.ok(/<span className="[^"]*sm:hidden[^"]*" data-checkpoint-label>\s*\{checkpointText\}\s*<\/span>/.test(renderer), "on phones the checkpoint is a compact non-link label");
  assert.ok(renderer.includes("className={`hidden sm:inline-flex ${LEARNING_LINK}`}"), "from sm the checkpoint is a real link again");
  assert.ok(renderer.includes("flex flex-col items-start gap-0") && renderer.includes("sm:flex-row sm:flex-wrap"), "breadcrumb stacks compactly on phones, wraps in a row from sm");
  const header = renderer.slice(renderer.indexOf("<header"), renderer.indexOf("</header>"));
  assert.strictEqual((header.match(/<Link\b/g) ?? []).length, 3, "home, journey and checkpoint links only");
  for (const m of header.matchAll(/<Link\b[\s\S]{0,200}?>/g)) assert.ok(m[0].includes("LEARNING_LINK"), "every breadcrumb control keeps the ≥44 px target");
  assert.strictEqual((renderer.match(/<h1\b/g) ?? []).length, 1);
  assert.strictEqual(lessonCopy("es").header.checkpointLabel, "Punto");
  assert.strictEqual(lessonCopy("en").header.checkpointLabel, "Checkpoint");
});

check("G2 owner-QA: the normal lesson URL shows no Listen mode without a valid recording; ?audio=preview stays an owner script-review switch", () => {
  assert.strictEqual(hasPlayableAudio(FLAGSHIP, "es"), false);
  assert.strictEqual(hasPlayableAudio(FLAGSHIP, "en"), false);
  const renderer = stripComments(read(`${LESSON_UI_DIR}/LessonRenderer.tsx`));
  assert.ok(renderer.includes("const showListen = Boolean(pkg.audio) && (playable || audioPreview);"));
  assert.ok(renderer.includes("if (showListen) modes.push") && renderer.includes("const listenSection = showListen && pkg.audio ?"), "no Listen chip and no Listen section unless showListen");
  assert.ok(renderer.includes("if (showListen && pkg.audio) metaItems.push"), "the header must not advertise a listening time when nothing can be played");
  assert.ok(read(LESSON_PAGE).includes('audioPreview={first(sp.audio) === "preview"}'), "preview is opt-in by URL only");
  for (const rel of [...APRENDER_G1_FILES, LESSON_PAGE, ...LESSON_SERVER_UI]) assert.ok(!stripComments(read(rel)).includes("audio=preview"), `${rel} links to the preview switch — it must never be public navigation`);
});

check("G2 journey-aware NEXT: never exposes an unpublished lesson; prefers the package's wish only once it is published", () => {
  const published = PUBLISHED_SEED_KEYS.map((k, i) => lesson({ id: `n${i}`, lessonKey: k, status: "published" }));
  // The flagship prefers nothing inside a journey (the journey order decides); the resolver contract is tested with an explicit preference.
  assert.deepStrictEqual(FLAGSHIP.next?.preferred, { neutral: ["customer_conversations", "know_your_competition"] });
  const preferred = ["know_your_competition"];
  const n1 = resolveNextLesson({ lessonKey: "who_is_your_customer", journey: "idea", lessons: published, preferred });
  assert.strictEqual(n1?.lesson.lessonKey, "revenue_vs_profit", "an unpublished preferred lesson must be skipped for the next PUBLISHED one");
  const withPlanned = [...published, lesson({ id: "kp", lessonKey: "know_your_competition", status: "planned" })];
  assert.strictEqual(resolveNextLesson({ lessonKey: "who_is_your_customer", journey: "idea", lessons: withPlanned, preferred })?.lesson.lessonKey, "revenue_vs_profit");
  const withPublished = [...published, lesson({ id: "kc", lessonKey: "know_your_competition", status: "published" })];
  assert.strictEqual(resolveNextLesson({ lessonKey: "who_is_your_customer", journey: "idea", lessons: withPublished, preferred })?.lesson.lessonKey, "know_your_competition");
  assert.strictEqual(resolveNextLesson({ lessonKey: "who_is_your_customer", journey: "negocio", lessons: published })?.lesson.lessonKey, "revenue_vs_profit");
  assert.strictEqual(resolveNextLesson({ lessonKey: "who_is_your_customer", journey: null, lessons: published })?.orderJourney, "idea", "no journey → neutral order, lesson still valid");
  assert.strictEqual(resolveNextLesson({ lessonKey: "advertising_fundamentals", journey: "negocio", lessons: published }), null, "last lesson of a journey has no next");
  assert.strictEqual(resolveNextLesson({ lessonKey: "not_a_lesson", journey: "idea", lessons: published }), null);
  const onlyDrafts = PUBLISHED_SEED_KEYS.map((k, i) => lesson({ id: `d${i}`, lessonKey: k, status: k === "who_is_your_customer" ? "published" : "draft" }));
  assert.strictEqual(resolveNextLesson({ lessonKey: "who_is_your_customer", journey: "empezando", lessons: onlyDrafts }), null);
  for (const j of ["idea", "empezando", "negocio"] as const) {
    for (const k of PUBLISHED_SEED_KEYS) {
      const n = resolveNextLesson({ lessonKey: k, journey: j, lessons: withPlanned, preferred: ["know_your_competition", "branding_basics"] });
      assert.ok(n === null || n.lesson.status === "published", `${j}/${k}: NEXT leaked a non-published lesson`);
    }
  }
  assert.strictEqual(journeyFromSearchParams({ journey: "hack" }), null, "unknown journey values are ignored");
});

check("G2 audio: a separate conversational ES/EN teaching script (~8–10 min), driving-safe, and NO player without a real recording", () => {
  const audio = FLAGSHIP.audio!;
  assert.deepStrictEqual(audio.segments.map((s) => s.kind), ["hook", "learn", "story", "concept", "reflect", "action", "parked", "recap", "next"]);
  for (const lang of ["es", "en"] as const) {
    const total = audio.segments.reduce((n, s) => n + words(s.text[lang]), 0);
    assert.ok(total >= 950 && total <= 1600, `${lang} script is ${total} words — expected roughly 8–10 spoken minutes`);
  }
  assert.ok(audio.segments.find((s) => s.kind === "reflect")?.pauseSeconds, "the reflection needs a real pause");
  const parked = audio.segments.find((s) => s.kind === "parked")!;
  assert.ok(/Cuando est[eé]s estacionado, o ya en casa/.test(parked.text.es) && /When you're parked, or back at home/.test(parked.text.en));
  assert.ok(/Si vas manejando, ahorita solo escucha/.test(parked.text.es) && /If you're driving, for now just listen/.test(parked.text.en));
  for (const s of audio.segments.filter((x) => x.kind !== "parked")) {
    assert.ok(!/abre esta lecci|tu tel[eé]fono|copia|pantalla|open this lesson|your phone|\bcopy\b|\bscreen\b|\btap\b/i.test(`${s.text.es} ${s.text.en}`), `segment ${s.id} asks for the screen outside the parked instruction`);
  }
  // Not a reading of the page: no explain chunk is recited verbatim.
  const explain = FLAGSHIP.blocks.find((b) => b.type === "explain")!;
  const spoken = audio.segments.map((s) => s.text.es).join(" ");
  if (explain.type === "explain") for (const c of explain.chunks) assert.ok(!spoken.includes(c.body.es), "the audio script must not read the page body aloud");
  assert.ok(/ejemplo que inventamos/.test(spoken), "Rosa must be declared an invented example in the audio too");

  assert.strictEqual(audio.assets, undefined, "no recording exists yet");
  assert.strictEqual(hasPlayableAudio(FLAGSHIP, "es"), false);
  assert.strictEqual(hasPlayableAudio(FLAGSHIP, "en"), false);
  const stale = clone(FLAGSHIP);
  stale.audio!.assets = { es: { src: "/x.mp3", mime: "audio/mpeg", durationSeconds: 540, scriptVersion: 2, sourceKind: "human" } };
  assert.strictEqual(hasPlayableAudio(stale, "es"), false, "a recording of another script version is never played");
  const fresh = clone(FLAGSHIP);
  fresh.audio!.assets = { es: { src: "/x.mp3", mime: "audio/mpeg", durationSeconds: 540, scriptVersion: 1, sourceKind: "human" } };
  assert.strictEqual(hasPlayableAudio(fresh, "es"), true, "adding an asset is all Coach needs to do — content architecture is unchanged");
  assert.strictEqual(hasPlayableAudio(fresh, "en"), false);

  const renderer = stripComments(read(`${LESSON_UI_DIR}/LessonRenderer.tsx`));
  assert.ok(renderer.includes("const showListen = Boolean(pkg.audio) && (playable || audioPreview);"), "Listen only renders with a real asset or an explicit preview");
  assert.ok(/\{playable && pkg\.audio\.assets\?\.\[lang\] \? \(\s*<div className="mt-4">\s*<LessonAudioPlayer/.test(renderer), "the player renders only behind hasPlayableAudio");
  assert.ok(renderer.includes("copy.audio.previewBadge"), "preview state must be clearly labelled");
  assert.ok(read(LESSON_PAGE).includes('audioPreview={first(sp.audio) === "preview"}'));
  const player = read(`${LESSON_UI_DIR}/LessonAudioPlayer.tsx`);
  assert.ok(player.includes("<audio ref={ref} controls") && !/autoPlay|autoplay/.test(stripComments(player)), "native controls, never autoplay");
});

check("G2 SAVE + completion: print CSS sheet (no PDF library); completion is a local visual pattern — no timers, no new grants", () => {
  const sheet = read(`${LESSON_UI_DIR}/LessonPrintSheet.tsx`);
  assert.ok(sheet.includes("@media print") && sheet.includes("window.print()") && sheet.includes("id={LESSON_SHEET_ID}"));
  assert.ok(sheet.includes("resultText") && sheet.includes("buildCustomerStatement(") && sheet.includes("promptText") && sheet.includes("checklist.map"), "sheet = learner statement + checklist + AI prompt");
  assert.strictEqual(lessonCopy("es").print.sheetTitle, "Mi hoja");
  const completion = stripComments(read(`${LESSON_UI_DIR}/LessonLocalCompletion.tsx`));
  assert.ok(!/setTimeout|setInterval|Date\.now|performance\.now|fetch\(/.test(completion), "completion must not use timers or the network");
  for (const rel of LESSON_CLIENT_UI) assert.ok(!/learning\/progress|capability/i.test(stripComments(read(rel))), `${rel} must not touch server progress or capability records`);
  const progress = read("app/api/dashboard/business/learning/progress/route.ts");
  assert.ok(progress.includes('body.action === "start" || body.action === "complete"'), "progress API actions unchanged in G2");
  assert.ok(MIGRATION.includes("status IN ('started', 'completed')"), "progress schema unchanged");
});

check("G2: no migration, no schema change, no reach into Home / BR / Rentas / Concierge", () => {
  const migrations = fs.readdirSync(path.join(ROOT, "supabase/migrations")).filter((f) => /learning/i.test(f));
  assert.deepStrictEqual(migrations.sort(), ["20260807120000_business_learning_center_foundation.sql", "20260807130000_business_learning_center_privilege_hardening.sql"], "no learning migration has been added since TODAY-1 — content batches are reviewed seeds, never migrations");
  for (const rel of LESSON_ALL_FILES) {
    const src = read(rel);
    assert.ok(!/from ["'][^"']*\/(home|bienes-raices|rentas|concierge)\//.test(src), `${rel} reaches outside the Learning Center`);
    assert.ok(!src.includes("/publicar"), `${rel} links to /publicar`);
    assert.ok(!/Business Concierge|HealthMap|healthMap/.test(stripComments(src)), `${rel} renders Concierge UI`);
    assert.ok(!/partner|sponsor|patrocin/i.test(stripComments(src)), `${rel} names a partner or sponsor`);
  }
});

check("G2 accessibility + visual language: 44px targets, labels, text alternative, no colour-only meaning, approved palette, no hidden-by-animation content", () => {
  const TARGET_OK = /min-h-11|min-h-12|min-h-\[2\.875rem\]|LEARNING_BTN_PRIMARY|LEARNING_BTN_OUTLINE|LEARNING_LINK/;
  for (const rel of [...LESSON_SERVER_UI, ...LESSON_CLIENT_UI].filter((f) => f.endsWith(".tsx"))) {
    const src = read(rel);
    for (const m of src.matchAll(/<(Link|a|button|summary)\b/g)) {
      const tag = src.slice(m.index ?? 0, (m.index ?? 0) + 700);
      assert.ok(TARGET_OK.test(tag), `${rel}: <${m[1]}> without a ≥44 px touch-target class → ${tag.slice(0, 90).replace(/\s+/g, " ")}`);
    }
    for (const m of src.matchAll(/<input\b/g)) {
      const tag = src.slice(m.index ?? 0, (m.index ?? 0) + 700);
      assert.ok(/type="checkbox"/.test(tag) ? src.includes("min-h-12 cursor-pointer") : TARGET_OK.test(tag), `${rel}: input without a ≥44 px target`);
    }
    assert.ok(!src.includes("framer-motion") && !/opacity-0\b/.test(stripComments(src)), `${rel} hides content behind animation`);
    assert.ok(!/overflow-x-(auto|scroll)|snap-x/.test(stripComments(src)), `${rel} introduces sideways scrolling`);
    assert.ok(!/purple|violet|fuchsia|indigo|backdrop-blur-(md|lg|xl)|bg-gradient/.test(stripComments(src)), `${rel} drifts from the approved visual language`);
  }
  const visuals = read(`${LESSON_UI_DIR}/lessonVisuals.tsx`);
  for (const tag of visuals.match(/<svg\b[^>]*>/g) ?? []) assert.ok(tag.includes("aria-hidden"), "lesson SVGs are decorative; meaning is carried by text");
  const blocks = read(`${LESSON_UI_DIR}/LessonBlocks.tsx`);
  assert.ok(blocks.includes("block.textAlternative[lang]") && blocks.includes("<figcaption"), "the hook visual needs a rendered text alternative");
  assert.ok(blocks.includes("copy.sections.weakMark") && blocks.includes("copy.sections.strongMark") && blocks.includes("<FiX") && blocks.includes("<FiCheck"), "weak/strong must be carried by icon + words, not colour alone");
  assert.ok(blocks.includes("md:hidden") && blocks.includes("flex-col"), "the visual model reads vertically on phones");
  assert.ok(read(`${LESSON_UI_DIR}/LessonPromptBlock.tsx`).includes('role="status"') && read(`${LESSON_UI_DIR}/LessonChecklist.tsx`).includes("htmlFor={id}"));

  const hexes = (src: string) => new Set((src.match(/#[0-9A-Fa-f]{6}\b/g) ?? []).map((h) => h.toUpperCase()));
  const approved = new Set<string>();
  for (const rel of [
    `${APRENDER_DIR}/_components/learningUi.ts`, `${APRENDER_DIR}/_components/learningGlyphs.tsx`, `${APRENDER_DIR}/_components/LearningToolkit.tsx`,
    `${APRENDER_DIR}/_components/LearningAccessClose.tsx`, `${APRENDER_DIR}/_components/LearningTopicTiles.tsx`, `${APRENDER_DIR}/page.tsx`,
  ]) for (const h of hexes(read(rel))) approved.add(h);
  for (const rel of [...LESSON_SERVER_UI, ...LESSON_CLIENT_UI]) for (const h of hexes(read(rel))) assert.ok(approved.has(h), `${rel} introduces a colour outside the approved Learning palette: ${h}`);
});

// ---------------------------------------------------------------------------
// Gate G3 — Master Curriculum Matrix (docs). A light guard on the control document: stable keys are
// never lost, every row has one home checkpoint, and the planned pathways never contradict the
// code-owned journey map that is live today.
// ---------------------------------------------------------------------------

check("G3 matrix: 61 unique universal rows (40 V1 / 19 V1.1 / 2 V2; EIN lesson restored as row 61); all 16 seeded lesson keys appear exactly once; agrees with the live journey map", () => {
  const rel = "docs/learning-center-curriculum-matrix.md";
  assert.ok(exists(rel), `missing ${rel}`);
  const doc = read(rel);
  for (let n = 1; n <= 22; n++) assert.ok(doc.includes(`\n## ${n}. `), `matrix is missing section ${n}`);

  const identity = doc.slice(doc.indexOf("### 5.1"), doc.indexOf("**Checkpoint coverage"));
  const rows = identity
    .split("\n")
    .filter((line) => /^\| \d+ \| `[a-z_]+` \|/.test(line))
    .map((line) => {
      const cells = line.split("|").map((c) => c.trim());
      return { n: Number(cells[1]), key: cells[2].replace(/`/g, ""), src: cells[5], cls: cells[6], cp: cells[7], depth: cells[10].split("/") };
    });
  assert.strictEqual(rows.length, 61, `expected 61 universal rows, found ${rows.length}`);
  assert.strictEqual(new Set(rows.map((r) => r.key)).size, 61, "lesson keys must be unique");
  // Row numbers are stable identifiers, not positions: row 61 (EIN, restored by owner decision OD-1A) sits after row 13.
  assert.deepStrictEqual([...rows.map((r) => r.n)].sort((a, b) => a - b), Array.from({ length: 61 }, (_, i) => i + 1), "row ids are exactly 1–61");
  const ein = rows.find((r) => r.key === "ein_and_tax_id_awareness");
  assert.ok(ein && ein.n === 61 && ein.cls === "V1" && ein.cp === "2" && ein.depth.join("/") === "–/C/L", "ein_and_tax_id_awareness must be its own V1 lesson in CP2 (Starting core, Business light)");
  assert.ok(!/merges the former EIN/i.test(doc), "the EIN lesson must not be merged into business_structure_concepts");
  const byClass = (c: string) => rows.filter((r) => r.cls === c).length;
  assert.deepStrictEqual([byClass("V1"), byClass("V1.1"), byClass("V2")], [40, 19, 2]);

  for (const key of [...PUBLISHED_SEED_KEYS, ...PLANNED_SEED_KEYS]) {
    assert.strictEqual(rows.filter((r) => r.key === key).length, 1, `seed lesson ${key} must be exactly one canonical matrix row`);
  }
  for (const key of PUBLISHED_SEED_KEYS) assert.strictEqual(rows.find((r) => r.key === key)?.src, "PUB", `${key} must be marked published`);
  for (const key of PLANNED_SEED_KEYS) assert.strictEqual(rows.find((r) => r.key === key)?.src, "PLN", `${key} must be marked planned`);

  for (const r of rows) {
    assert.ok(/^[1-7]$/.test(r.cp), `${r.key}: exactly one home checkpoint (1–7)`);
    assert.ok(r.depth.length === 3 && r.depth.every((d) => ["C", "L", "D", "–"].includes(d)), `${r.key}: depth must be I/E/N`);
    assert.ok(r.depth.some((d) => d !== "–"), `${r.key}: belongs to no pathway`);
  }
  for (let cp = 1; cp <= 7; cp++) assert.ok(rows.some((r) => r.cp === String(cp) && r.cls === "V1"), `checkpoint ${cp} has no V1 lesson`);
  const v1In = (i: number) => rows.filter((r) => r.cls === "V1" && r.depth[i] !== "–").length;
  assert.deepStrictEqual([v1In(0), v1In(1), v1In(2)], [20, 40, 36], "V1 pathway sizes (Idea / Starting / Business)");

  // Frozen capability keys of seeded lessons whose key differs from the lesson_key are recorded in the matrix.
  for (const cap of ["know_your_customer", "consistent_business_info", "healthy_capacity_boundaries", "review_response_basics", "referral_program_basics", "simple_analytics_basics"]) {
    assert.ok(doc.includes("`" + cap + "`") && MIGRATION.includes("'" + cap + "'"), `capability key ${cap} must be recorded in the matrix and exist in the seed`);
  }

  // The matrix agrees with what is live today in learningJourneys.ts.
  const cpIndex: Record<string, string> = { entender: "1", construir: "2", preparar: "3", visible: "4", crecer: "5", proteger: "6", siguiente: "7" };
  for (const [key, cp] of Object.entries(LEARNING_LESSON_CHECKPOINT)) {
    assert.strictEqual(rows.find((r) => r.key === key)?.cp, cpIndex[cp], `${key}: matrix checkpoint disagrees with learningJourneys.ts`);
  }
  const col = { idea: 0, empezando: 1, negocio: 2 } as const;
  for (const j of LEARNING_JOURNEY_KEYS) {
    for (const key of LEARNING_JOURNEY_LESSON_KEYS[j]) {
      assert.notStrictEqual(rows.find((r) => r.key === key)?.depth[col[j]], "–", `${key} is live in the ${j} journey but the matrix excludes it`);
    }
  }

  assert.ok(!/sponsor|patrocin/i.test(doc), "the matrix must not name a sponsor");
  assert.ok(read("docs/business-learning-center-content-batch-02.md").includes("SUPERSEDED"), "the old batch doc must point to the matrix");
});

// ---------------------------------------------------------------------------
// Gate G4-I1 — Idea batch 1: three authored LessonPackages (what_problem_do_you_solve ·
// customer_conversations · know_your_competition), the generic guided activity, their stage-aware AI
// template sets, their audio scripts, the journey-map additions, and the first reviewed data seed
// (3 new rows + D3 Spanish accent repair). The publication gate is never weakened.
// ---------------------------------------------------------------------------

const BATCH_I1_PACKAGES = BATCH_I1_KEYS.map((k) => CODE_OWNED_LESSON_PACKAGES[k]);
const activityOf = (pkg: LessonPackage) => pkg.blocks.find((b): b is Extract<LessonPackage["blocks"][number], { type: "activity" }> => b.type === "activity")!;
const promptBlockOf = (pkg: LessonPackage) => pkg.blocks.find((b): b is Extract<LessonPackage["blocks"][number], { type: "ai_prompt" }> => b.type === "ai_prompt")!;
const promptsOf = (pkg: LessonPackage) => [promptBlockOf(pkg).promptKey, ...(promptBlockOf(pkg).moreTemplateKeys ?? [])].map((k) => LEARNING_PROMPTS[k]);
const lf = (text: string) => text.replace(/\r\n/g, "\n");
const SEED_SQL = exists(SEED_I1_SQL) ? lf(read(SEED_I1_SQL)) : "";
const SEED_LF_LITERALS = new Set(sqlLiterals(lf(MIGRATION)));
const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
const PART_B_BANNER = "-- Part B — D3 Spanish accent repair";
const PART_C_BANNER = "-- PART C — REVIEWED ENGLISH GRAMMAR REPAIRS";
const SEED_PART_B = SEED_SQL.slice(SEED_SQL.indexOf(PART_B_BANNER), SEED_SQL.lastIndexOf("-- -----", SEED_SQL.indexOf(PART_C_BANNER)));
const SEED_PART_C = SEED_SQL.slice(SEED_SQL.indexOf(PART_C_BANNER));

check("G4-I1 scope: exactly three new packages are authored (4 code-owned in total); the EIN lesson and every other matrix row stay unauthored", () => {
  assert.deepStrictEqual(Object.keys(CODE_OWNED_LESSON_PACKAGES), ["who_is_your_customer", ...BATCH_I1_KEYS]);
  assert.strictEqual(getCodeOwnedLessonPackage("ein_and_tax_id_awareness"), null, "the EIN lesson is restored in the matrix only — not authored in this gate");
  for (const rel of BATCH_I1_FILES) assert.ok(exists(rel), `missing ${rel}`);
  assert.strictEqual(Object.keys(LEARNING_PROMPTS).length, 12, "3 flagship templates + 3 per batch lesson");
});

check("G4-I1 validator: all three packages pass with zero errors and zero warnings; evergreen, not consequential; full ES/EN parity", () => {
  for (const pkg of BATCH_I1_PACKAGES) {
    const r = validateLessonPackage(pkg, { prompts: LEARNING_PROMPTS });
    assert.deepStrictEqual(r.errors, [], `${pkg.lessonKey}: ${r.errors.join(" | ")}`);
    assert.deepStrictEqual(r.warnings, [], `${pkg.lessonKey}: ${r.warnings.join(" | ")}`);
    assert.strictEqual(pkg.source, "package");
    assert.strictEqual(pkg.meta.truthClass, "evergreen");
    assert.strictEqual(pkg.meta.consequential, false);
    assert.deepStrictEqual(collectParityProblems(pkg), []);
    for (const type of [...REQUIRED_PACKAGE_BLOCKS, "activity", "ai_prompt", "mistakes", "checklist", "verify"] as const) {
      assert.ok(pkg.blocks.some((b) => b.type === type), `${pkg.lessonKey}: missing ${type}`);
    }
    const verify = pkg.blocks.find((b) => b.type === "verify")!;
    if (verify.type === "verify") assert.deepStrictEqual(verify.doctrine, { es: "La IA ayuda. Tú verificas.", en: "AI helps. You verify." });
    const example = pkg.blocks.find((b) => b.type === "example")!;
    if (example.type === "example") {
      assert.deepStrictEqual(example.label, { es: "Ejemplo ilustrativo", en: "Illustrative example" }, "invented examples are always labelled");
      assert.ok(example.variants.some((v) => v.journey === "idea") && example.variants.some((v) => v.journey === "empezando"));
    }
    assert.ok(SPANISH_DIACRITICS.test(JSON.stringify(pkg)), `${pkg.lessonKey}: Spanish must be properly accented`);
  }
});

check("G4-I1 composition: the three lessons are not clones — each has its own hook visual, its own block order and its own activity", () => {
  const hooks = BATCH_I1_PACKAGES.map((p) => { const h = p.blocks.find((b) => b.type === "hook")!; return h.type === "hook" ? h.visualKey : ""; });
  assert.deepStrictEqual(hooks, ["product_vs_problem", "pitch_vs_ask", "alternatives_fork"]);
  const visuals = read(`${LESSON_UI_DIR}/lessonVisuals.tsx`);
  for (const key of hooks) assert.ok(visuals.includes(`case "${key}":`), `lessonVisuals.tsx does not draw ${key}`);
  const orders = [FLAGSHIP, ...BATCH_I1_PACKAGES].map((p) => p.blocks.map((b) => b.type).join(">"));
  assert.strictEqual(new Set(orders).size, 4, "every authored lesson has its own block sequence");
  assert.deepStrictEqual(BATCH_I1_PACKAGES.map((p) => activityOf(p).activityKey), ["problem_statement_builder", "conversation_plan_builder", "alternatives_grid"], "activity keys match the curriculum matrix");
  for (const p of BATCH_I1_PACKAGES) {
    const hook = p.blocks.find((b) => b.type === "hook")!;
    if (hook.type === "hook") assert.ok(hook.textAlternative.es.length > 120 && hook.textAlternative.en.length > 120, `${p.lessonKey}: the visual needs a full text alternative`);
  }
});

check("G4-I1 activities: results are built ONLY from the learner's words — blanks stay blanks, every answer appears in the result, each has a result bridge into the AI lab", () => {
  for (const pkg of BATCH_I1_PACKAGES) {
    const a = activityOf(pkg);
    assert.ok(a.result, `${pkg.lessonKey}: a guided activity declares its result`);
    assert.ok(a.resultBridge && a.resultBridge.points.length >= 3, `${pkg.lessonKey}: result bridge`);
    assert.deepStrictEqual(a.resultBridge!.title, { es: "¿Y ahora qué hago con esto?", en: "What do I do with this now?" });
    for (const lang of ["es", "en"] as const) {
      const empty = buildGuidedResult(a.fields, a.result!, {}, lang);
      assert.strictEqual(empty.filledCount, 0);
      assert.strictEqual(empty.complete, false);
      assert.strictEqual((empty.text.match(/\[[^\]]+\]/g) ?? []).length, a.fields.length, `${pkg.lessonKey}.${lang}: every unanswered question is a visible blank`);
      const answers = Object.fromEntries(a.fields.map((f, i) => [f.key, `respuesta ${String.fromCharCode(97 + i)}`]));
      const full = buildGuidedResult(a.fields, a.result!, answers, lang);
      assert.strictEqual(full.complete, true);
      assert.ok(!/\[[^\]]+\]/.test(full.text), "no blank remains once everything is answered");
      for (const v of Object.values(answers)) assert.ok(full.text.includes(v), `${pkg.lessonKey}.${lang}: answer missing from the result`);
      const one = buildGuidedResult(a.fields, a.result!, { [a.fields[0].key]: "  solo   esto.  " }, lang);
      assert.strictEqual(one.filledCount, 1);
      assert.ok(one.text.includes("solo esto") && !one.text.includes("solo esto."), "answers are cleaned, never completed");
    }
  }
  const problem = activityOf(CODE_OWNED_LESSON_PACKAGES.what_problem_do_you_solve);
  const sentence = buildGuidedResult(problem.fields, problem.result!, { who: "enfermeras con turnos de 12 horas", wrong: "no tener tiempo para lavar", often: "cada semana", today: "acumular ropa", cost: "su día libre" }, "es").text;
  assert.strictEqual(sentence, "Para enfermeras con turnos de 12 horas, el problema es no tener tiempo para lavar. Pasa cada semana. Hoy la salida es acumular ropa, y el costo es su día libre.");
  assert.strictEqual(cleanGuidedAnswer("uno\n\n  dos  \n", true), "uno\ndos", "multi-line answers keep their lines");

  const broken = clone(CODE_OWNED_LESSON_PACKAGES.customer_conversations);
  const act = activityOf(broken);
  act.result!.sections = act.result!.sections!.filter((s) => !s.fieldKeys.includes("change"));
  assert.ok(validateLessonPackage(broken, { prompts: LEARNING_PROMPTS }).errors.some((e) => e.includes('"change" is collected but never shown')), "the validator refuses an answer that is collected and then dropped");
  const noResult = clone(CODE_OWNED_LESSON_PACKAGES.know_your_competition);
  delete activityOf(noResult).result;
  assert.ok(!validateLessonPackage(noResult, { prompts: LEARNING_PROMPTS }).ok, "a guided activity without a declared result is invalid");
});

check("G4-I1 UI: one generic guided activity renders all three (the renderer stays data-driven); the flagship builder is untouched; DO anchors the activity", () => {
  const renderer = read(`${LESSON_UI_DIR}/LessonRenderer.tsx`);
  assert.ok(renderer.includes("<LessonActivityGuided") && renderer.includes("b.result ?"), "guided activities are chosen by data (result), not by lesson");
  for (const key of BATCH_I1_KEYS) assert.ok(!stripComments(renderer).includes(key), `LessonRenderer must not special-case ${key}`);
  assert.ok(renderer.includes('blocks.find((b) => b.type === "activity") ?? blocks.find((b) => b.type === "checklist")'), "“Hacer” points at the activity even when practical steps come first");
  const guided = read(`${LESSON_UI_DIR}/LessonActivityGuided.tsx`);
  assert.ok(guided.startsWith('"use client";') && guided.includes("buildGuidedResult(") && guided.includes("<textarea") && guided.includes("data-result-bridge"));
  assert.ok(guided.includes("<label htmlFor={id}") && guided.includes('aria-live="polite"'), "labelled inputs and an announced result");
  assert.ok(!/\bfetch\(|XMLHttpRequest|sendBeacon|\/api\//.test(stripComments(guided)), "the guided activity sends nothing over the network");
  const sheet = read(`${LESSON_UI_DIR}/LessonPrintSheet.tsx`);
  assert.ok(sheet.includes("buildGuidedResult(guided.fields, guided.result, state.answers, lang)") && sheet.includes("guided.result.printLabel[lang]"), "“Mi hoja” prints the guided result");
  assert.ok(lessonCopy("es").activity.progressOf === "de" && lessonCopy("en").activity.progressOf === "of");
});

check("G4-I1 AI labs: three stage-aware, assistant-neutral templates per lesson, auto-filled ONLY from that lesson's activity; missing stays missing", () => {
  for (const pkg of BATCH_I1_PACKAGES) {
    const a = activityOf(pkg);
    const set = promptsOf(pkg);
    assert.strictEqual(set.length, 3, `${pkg.lessonKey}: exactly three templates`);
    assert.strictEqual(set[0].promptKey, pkg.lessonKey, "the primary template carries the lesson key");
    for (const p of set) {
      assert.deepStrictEqual(validateLessonPrompt(p).errors, []);
      assert.ok(p.purpose && p.whyItWorks.length >= 3 && p.privacy.never.length >= 4 && /verificas/.test(p.verify.es) && /verify/i.test(p.verify.en), `${p.promptKey}: purpose · why · privacy · verify`);
      assert.deepStrictEqual(p.fields.filter((f) => f.prefillFrom?.kind === "activity_field").map((f) => (f.prefillFrom as { fieldKey: string }).fieldKey), a.fields.map((f) => f.key), `${p.promptKey}: every activity answer feeds the template`);
      assert.deepStrictEqual(editablePromptFields(p).map((f) => f.token), editablePromptFields(set[0]).map((f) => f.token), "one context form serves the whole lab");
      const bodies = [resolvePromptBody(p, null), resolvePromptBody(p, "idea"), resolvePromptBody(p, "empezando"), resolvePromptBody(p, "negocio")];
      assert.strictEqual(new Set(bodies.map((b) => b.es)).size, 4, `${p.promptKey}: four different ES conversations`);
      assert.strictEqual(new Set(bodies.map((b) => b.en)).size, 4, `${p.promptKey}: four different EN conversations`);
      assert.strictEqual(resolvePromptBody(p, "otro" as never), p.body, "unknown journey → neutral");
      assert.ok(/antes de gastar/.test(bodies[1].es) && /Ya decid[ií] empezar/.test(bodies[2].es) && /Ya opero un negocio/.test(bodies[3].es), `${p.promptKey}: idea explores · empezando prepares · negocio operates`);
      for (const b of bodies) {
        assert.ok(/No inventes|no inventes|inventadas|No saques conclusiones|No presentes datos/.test(b.es) && /[Dd]o not invent|made up|Do not draw conclusions|Do not present market facts/.test(b.en), `${p.promptKey}: every conversation forbids invention`);
        assert.ok(!/chatgpt|openai|claude|gemini|copilot|anthropic|mistral|perplexity|deepseek/i.test(b.es + b.en), `${p.promptKey}: assistant-neutral`);
      }
      const answers = Object.fromEntries(a.fields.map((f) => [f.key, `dato-${f.key}`]));
      const values = resolvePromptValues(p, { answers, typed: { city: "San José", idea: "lavandería móvil", customer: "enfermeras" }, journey: "idea", lang: "es" });
      const filled = renderPrompt(p, "es", values, "idea");
      assert.deepStrictEqual(filled.missing, [], `${p.promptKey}: fully filled`);
      for (const f of a.fields) assert.ok(filled.text.includes(`dato-${f.key}`));
      const blank = renderPrompt(p, "es", resolvePromptValues(p, { answers: {}, typed: {}, journey: null, lang: "es" }), null);
      assert.strictEqual(blank.missing.length, p.fields.length, "nothing is guessed: every missing value stays a visible [placeholder]");
    }
  }
  const practice = LEARNING_PROMPTS.customer_conversations_practice;
  assert.ok(/solo pr[aá]ctica/i.test(practice.title.es) && /practice only/i.test(practice.title.en), "the rehearsal is labelled as practice");
  assert.ok(/ESTO ES SOLO UN ENSAYO/.test(practice.body.es) && /No son evidencia/.test(practice.body.es) && /not evidence/.test(practice.body.en), "an AI rehearsal is never evidence");
  for (const p of promptsOf(CODE_OWNED_LESSON_PACKAGES.know_your_competition)) {
    for (const b of [p.body, ...Object.values(p.variants ?? {}).map((v) => v.body)]) {
      assert.ok(/No inventes nombres de negocios, precios, horarios, reseñas/.test(b.es) && /Do not invent business names, prices, hours, reviews/.test(b.en), `${p.promptKey}: no invented competitor facts`);
      assert.ok(/p[uú]blica y actual/.test(b.es) && /public, current/.test(b.en) && /No me propongas engañar/.test(b.es) && /Do not suggest deceiving/.test(b.en), `${p.promptKey}: public, current, honest research only`);
    }
    assert.ok(/puede inventar negocios, precios y reseñas/.test(p.verify.es) && /can invent businesses, prices, and reviews/.test(p.verify.en));
  }
});

check("G4-I1 competition lesson: teaches honest research — no scraping, no deception, no copying, no trusting an AI for competitor facts", () => {
  const text = JSON.stringify(CODE_OWNED_LESSON_PACKAGES.know_your_competition);
  assert.ok(/no te hagas pasar por cliente para sacar información privada/.test(text) && /do not pose as a customer to extract private information/.test(text));
  assert.ok(/no copies/.test(text) && /do not copy/.test(text));
  assert.ok(/puede inventar nombres, precios y reseñas/.test(text) && /can invent names, prices, and reviews/.test(text));
  assert.ok(/no hacer nada/.test(text) && /do nothing/.test(text), "the invisible alternatives are taught");
  assert.ok(!/scrap/i.test(text.replace(/no scraping/gi, "")), "the lesson never proposes scraping");
  assert.ok(CODE_OWNED_LESSON_PACKAGES.know_your_competition.blocks.some((b) => b.type === "note"), "the honesty boundary is its own block");
});

check("G4-I1 LISTEN: a real ES/EN teaching script per lesson (9 segments, written for the ear, screen instructions only when parked); no recording → no player", () => {
  for (const pkg of BATCH_I1_PACKAGES) {
    const audio = pkg.audio!;
    assert.ok(audio, `${pkg.lessonKey}: audio script`);
    assert.strictEqual(audio.scriptVersion, 1);
    assert.strictEqual(audio.assets, undefined, "no recording exists");
    assert.ok(!hasPlayableAudio(pkg, "es") && !hasPlayableAudio(pkg, "en"));
    assert.deepStrictEqual(audio.segments.map((s) => s.kind), ["hook", "learn", "story", "concept", "reflect", "action", "parked", "recap", "next"]);
    for (const lang of ["es", "en"] as const) {
      const total = audio.segments.reduce((n, s) => n + words(s.text[lang]), 0);
      assert.ok(total >= 650 && total <= 1100, `${pkg.lessonKey}.${lang}: ${total} words`);
      assert.ok(Math.abs(total / 115 - audio.estimatedMinutes) <= 1.5, `${pkg.lessonKey}.${lang}: estimatedMinutes must be honest (${total} words)`);
      for (const s of audio.segments) {
        if (s.kind !== "parked") assert.ok(!/abre la lecci[oó]n|open the lesson|toca |tap |haz clic|click/i.test(s.text[lang]), `${pkg.lessonKey}.${s.id}.${lang}: screen instructions belong in the parked segment`);
      }
      const parked = audio.segments.find((s) => s.kind === "parked")!;
      assert.ok(/estacionado o en casa|parked or at home/.test(parked.text[lang]));
      const story = audio.segments.find((s) => s.kind === "story")!;
      assert.ok(/inventado|made-up/.test(story.text[lang]), "the example is announced as invented");
      assert.ok(/La IA ayuda\. Tú verificas\.|AI helps\. You verify\./.test(audio.segments[audio.segments.length - 1].text[lang]));
    }
    assert.ok(audio.segments.find((s) => s.kind === "reflect")!.pauseSeconds, "reflection carries a deliberate pause");
    const page = JSON.stringify(pkg.blocks);
    for (const s of audio.segments) assert.ok(!page.includes(s.text.es.slice(0, 80)), `${pkg.lessonKey}.${s.id}: the script is not a reading of the page`);
  }
});

check("G4-I1 journeys: the three lessons join the code-owned map at the matrix's depth, in the matrix's order, with their own framing per journey", () => {
  const at = (j: "idea" | "empezando" | "negocio", key: string) => LEARNING_JOURNEY_LESSONS[j].find((e) => e.lessonKey === key);
  assert.deepStrictEqual(LEARNING_JOURNEY_LESSON_KEYS.idea.slice(0, 4), ["what_problem_do_you_solve", "who_is_your_customer", "customer_conversations", "know_your_competition"]);
  assert.deepStrictEqual(LEARNING_JOURNEY_LESSON_KEYS.empezando.slice(0, 4), ["who_is_your_customer", "what_problem_do_you_solve", "customer_conversations", "know_your_competition"]);
  assert.deepStrictEqual(LEARNING_JOURNEY_LESSON_KEYS.negocio.slice(0, 3), ["who_is_your_customer", "customer_conversations", "know_your_competition"]);
  assert.ok(!LEARNING_JOURNEY_LESSON_KEYS.negocio.includes("what_problem_do_you_solve"), "matrix row 1 is C/L/– : not in the existing-business pathway");
  assert.deepStrictEqual([at("idea", "what_problem_do_you_solve")?.depth, at("empezando", "what_problem_do_you_solve")?.depth], ["core", "light"]);
  assert.deepStrictEqual([at("idea", "customer_conversations")?.depth, at("empezando", "customer_conversations")?.depth, at("negocio", "customer_conversations")?.depth], ["core", "core", "light"]);
  assert.deepStrictEqual([at("idea", "know_your_competition")?.depth, at("empezando", "know_your_competition")?.depth, at("negocio", "know_your_competition")?.depth], ["core", "light", "deep"]);
  for (const key of BATCH_I1_KEYS) assert.strictEqual(LEARNING_LESSON_CHECKPOINT[key], "entender");
  for (const key of ["customer_conversations", "know_your_competition"]) {
    assert.strictEqual(new Set((["idea", "empezando", "negocio"] as const).map((j) => at(j, key)!.framing.es)).size, 3, `${key}: each journey frames the lesson differently`);
  }
});

check("G4-I1 publication gate: unpublished batch lessons are never surfaced, counted or linked; NEXT walks the journey order once they are published", () => {
  // Today's database: the 8 TODAY-1 lessons only. The batch keys are in the map but have no published row.
  const published = PUBLISHED_SEED_KEYS.map((k, i) => lesson({ id: `p${i}`, lessonKey: k, status: "published" }));
  for (const j of LEARNING_JOURNEY_KEYS) {
    const resolved = resolveJourneyLessons(j, published).map((r) => r.lessonKey);
    for (const key of BATCH_I1_KEYS) assert.ok(!resolved.includes(key), `${j}: ${key} must not appear without a published row`);
    assert.strictEqual(resolved.length, j === "idea" ? 3 : 8, `${j}: counts stay truthful`);
  }
  assert.strictEqual(resolveNextLesson({ lessonKey: "who_is_your_customer", journey: "idea", lessons: published, preferred: FLAGSHIP.next?.preferred?.idea ?? [] })?.lesson.lessonKey, "revenue_vs_profit", "unpublished lessons are skipped, never linked");
  const planned = [...published, ...BATCH_I1_KEYS.map((k, i) => lesson({ id: `d${i}`, lessonKey: k, status: "draft" }))];
  assert.strictEqual(resolveNextLesson({ lessonKey: "who_is_your_customer", journey: "idea", lessons: planned, preferred: [] })?.lesson.lessonKey, "revenue_vs_profit");
  assert.strictEqual(filterPublishedLessons(planned).length, 8);

  // After the seed is applied: the journey order carries the learner through the batch.
  const after = [...published, ...BATCH_I1_KEYS.map((k, i) => lesson({ id: `b${i}`, lessonKey: k, status: "published" }))];
  const next = (key: string, journey: "idea" | "empezando" | "negocio" | null, preferred: string[] = []) => resolveNextLesson({ lessonKey: key, journey, lessons: after, preferred })?.lesson.lessonKey;
  assert.strictEqual(next("what_problem_do_you_solve", "idea"), "who_is_your_customer");
  assert.strictEqual(next("who_is_your_customer", "idea", FLAGSHIP.next?.preferred?.idea ?? []), "customer_conversations", "the flagship no longer jumps over customer_conversations");
  assert.strictEqual(next("customer_conversations", "idea"), "know_your_competition");
  assert.strictEqual(next("know_your_competition", "idea"), "revenue_vs_profit");
  assert.strictEqual(next("who_is_your_customer", "negocio"), "customer_conversations");
  assert.strictEqual(next("who_is_your_customer", null, FLAGSHIP.next?.preferred?.neutral ?? []), "customer_conversations");
  assert.strictEqual(resolveJourneyLessons("idea", after).length, 6);

  const page = read(LESSON_PAGE);
  assert.ok(page.includes("getPublishedLessonByKey") && page.includes("notFound()"), "the lesson page 404s without a published row");
  // The only query flags the page reads are lang, journey and the audio-script preview. Nothing can unlock an unpublished lesson.
  assert.deepStrictEqual([...new Set([...stripComments(page).matchAll(/\bsp\.([a-zA-Z]+)/g)].map((m) => m[1]))].sort(), ["audio", "journey", "lang"].filter((k) => stripComments(page).includes(`sp.${k}`)).sort(), "no preview/bypass query flag was added for QA");
  assert.ok(!/bypass|draft|unpublished|includeUnpublished|status\s*[!=]==/i.test(stripComments(page)), "the lesson page never reasons about non-published states");
});

check("G4-I1 seed: ONE additive, data-only file — exactly three new published rows, generated from the packages; deterministic; not applied by this gate", () => {
  assert.ok(exists(SEED_I1_SQL), "seed file missing");
  assert.strictEqual(SEED_SQL, buildSeedSql(MIGRATION), "the seed file must equal the generator output (re-run the generator, never hand-edit)");
  // QUARANTINE (G4-I1.1): a content batch is a REVIEWED seed. It must never sit where `supabase db push` would apply it.
  assert.strictEqual(SEED_I1_SQL, "supabase/reviewed-seeds/learning-center/20260918_content_batch_i1.sql");
  const migrationFiles = fs.readdirSync(path.join(ROOT, "supabase/migrations"));
  assert.deepStrictEqual(migrationFiles.filter((f) => /content[_-]?batch|reviewed[_-]?seed|_i1\b|batch_i\d/i.test(f)), [], "no content-batch SQL may live under supabase/migrations/");
  for (const f of migrationFiles.filter((m) => m > "20260916150000_business_profile_foundation.sql")) {
    const sql = read(`supabase/migrations/${f}`);
    for (const key of BATCH_I1_KEYS) assert.ok(!sql.includes(`'${key}'`), `${f} seeds ${key} — I-1 content must not be applied through a migration`);
  }
  assert.deepStrictEqual(fs.readdirSync(path.join(ROOT, "supabase/reviewed-seeds/learning-center")), [path.basename(SEED_I1_SQL), path.basename(SEED_I1A_REPAIRS_SQL), path.basename(SEED_I1A1_CLEANUP_SQL)].sort(), "the reviewed I-1 seed, its derived I-1A repair artifact and the I-1A.1 supplemental cleanup — nothing else");
  assert.ok(SEED_SQL.includes("REVIEWED SEED — NOT A MIGRATION") && SEED_SQL.includes("DO NOT move it into supabase/migrations/") && SEED_SQL.includes("blind `supabase db push`"), "the file itself says how it may and may not be applied");
  assert.strictEqual(buildSeedSql(MIGRATION), buildSeedSql(MIGRATION), "generation is deterministic");
  assert.ok(!/now\(\)|random|uuid/i.test(SEED_SQL.replace(/'published', now\(\)/g, "")), "the only non-literal value is published_at = now() on the three inserts");
  assert.ok(exists(SEED_I1_RUNBOOK), "apply runbook missing");

  const code = SEED_SQL.split("\n").filter((l) => !l.startsWith("--")).join("\n");
  assert.ok(!/\b(CREATE|ALTER|DROP|TRUNCATE|DELETE|GRANT|REVOKE|POLICY|TRIGGER|FUNCTION|INDEX)\b/.test(code.replace(/'(?:[^']|'')*'/g, "''")), "data only: no DDL, no deletes");
  const tables = [...new Set([...code.matchAll(/public\.([a-z_]+)/g)].map((m) => m[1]))].sort();
  assert.deepStrictEqual(tables, ["business_learning_categories", "business_learning_lessons", "business_learning_resources"], "no unrelated table is touched");
  assert.strictEqual((code.match(/^INSERT INTO /gm) ?? []).length, 3);
  assert.strictEqual((code.match(/^ON CONFLICT \(lesson_key\) DO NOTHING;$/gm) ?? []).length, 3, "additive and idempotent");

  const literals = sqlLiterals(SEED_SQL);
  for (const row of SEED_I1_LESSONS) {
    const i = literals.indexOf(row.pkg.lessonKey);
    assert.ok(i !== -1, `${row.pkg.lessonKey} not seeded`);
    const [titleEs, titleEn, summaryEs, summaryEn, bodyEs, bodyEn, level, capability] = literals.slice(i + 1, i + 9);
    assert.deepStrictEqual({ es: titleEs, en: titleEn }, row.pkg.meta.title, "the row title is the package title");
    assert.deepStrictEqual([summaryEs, summaryEn], [row.summary.es, row.summary.en]);
    assert.strictEqual(bodyEs, packageToPlainText(row.pkg, "es"), "body_es is the package's own plain-text rendition");
    assert.strictEqual(bodyEn, packageToPlainText(row.pkg, "en"));
    assert.ok(isPublishableBody(bodyEs, bodyEn) && bodyEs.length > 1200 && bodyEn.length > 1200, "bodies satisfy the published-body rule");
    assert.ok(SPANISH_DIACRITICS.test(bodyEs) && SPANISH_DIACRITICS.test(titleEs + summaryEs), "new Spanish content is accented from day one");
    assert.ok(summaryEs.length <= 500 && summaryEn.length <= 500 && titleEs.length <= 200);
    assert.strictEqual(level, "foundation");
    assert.strictEqual(capability, row.pkg.lessonKey, "capability_key of a new row equals its lesson_key (matrix §5.1)");
    for (const d of row.dimensionKeys) assert.ok(isKnownHealthDimensionKey(d), `unknown health dimension ${d}`);
    assert.strictEqual(row.categoryKey, "clientes_y_demanda");
    assert.ok(!MIGRATION.includes(`'${row.pkg.lessonKey}'`), "the key is new — never a rename of a seeded lesson");
    // The stored body round-trips through the legacy reader too (search, fallbacks): never an empty page.
    assert.doesNotThrow(() => parseLegacyBody(bodyEs));
  }
  assert.deepStrictEqual(SEED_I1_LESSONS.map((r) => r.sortOrder), [3, 4, 5], "after the two rows already seeded in the category");
});

check("G4-I1 D3: the accent repair changes ONLY diacritics and ¿ ¡ — provably; guarded by the original value; ledger is complete; English untouched", () => {
  const repairs = buildAccentRepairs(MIGRATION);
  assert.ok(repairs.length >= 60, `expected a broad repair, got ${repairs.length}`);
  for (const r of repairs) {
    assert.strictEqual(stripMarks(r.after), r.before, `${r.key}.${r.column}: more than accents changed`);
    assert.notStrictEqual(r.after, r.before);
    assert.ok(r.column.endsWith("_es"), "only Spanish columns");
    assert.ok(SEED_LF_LITERALS.has(r.before), `${r.key}.${r.column}: 'before' is not the seeded value`);
    for (const [a, b] of changedWords(r)) assert.strictEqual(stripMarks(b), a);
  }
  assert.ok(!/_en = /.test(SEED_PART_B), "D3 updates no English column");
  assert.strictEqual((SEED_PART_B.match(/^UPDATE public\./gm) ?? []).length, repairs.length);
  assert.strictEqual((SEED_PART_B.match(/AND md5\(replace\([a-z_]+, chr\(13\), ''\)\) = '[0-9a-f]{32}';$/gm) ?? []).length, repairs.length, "every UPDATE is guarded by the original value");
  assert.strictEqual(repairs.length, 75);
  assert.strictEqual(sha256(SEED_PART_B.trimEnd()), "bc364975af0df89f556ac36bed4ebe32286d07f732032ffa0e458c26bedafdca", "Part B (D3) must stay byte-identical to the reviewed G4-I1 repair");

  // Meaning-dependent words are repaired only inside reviewed phrases.
  assert.strictEqual(repairSpanishAccents("Practica decir que no"), "Practica decir que no", "imperative stays unaccented");
  assert.strictEqual(repairSpanishAccents("una oportunidad perdida, no solo una molestia"), "una oportunidad perdida, no solo una molestia");
  assert.strictEqual(repairSpanishAccents("le hablan directamente a esta persona"), "le hablan directamente a esta persona");
  assert.strictEqual(repairSpanishAccents("si le compartes mi contacto"), "si le compartes mi contacto");
  assert.strictEqual(repairSpanishAccents("Por que importa: tu negocio esta leccion"), "Por qué importa: tu negocio esta lección");
  assert.strictEqual(repairSpanishAccents("Como definir a tu cliente ideal para escribir mensajes mas claros."), "Cómo definir a tu cliente ideal para escribir mensajes más claros.");

  // Every published body is repaired, keeps its structure, and still parses for the legacy renderer.
  for (const key of PUBLISHED_SEED_KEYS) {
    const body = repairs.find((r) => r.key === key && r.column === "body_es");
    assert.ok(body, `${key}: body not repaired`);
    assert.ok(body!.after.includes("Por qué importa:") && body!.after.includes("Pasos prácticos:") && SPANISH_DIACRITICS.test(body!.after));
    const parsed = parseLegacyBody(body!.after);
    assert.ok(parsed.structured && parsed.steps.length >= 4, `${key}: the repaired body must still parse`);
    assert.strictEqual(parsed.steps.length, parseLegacyBody(body!.before).steps.length);
  }
  assert.ok(repairs.some((r) => r.key === "who_is_your_customer" && r.column === "title_es" && r.after === "Quién es tu cliente"));

  assert.strictEqual(lf(read(SEED_I1_LEDGER)), buildLedger(MIGRATION), "the ledger must equal the generator output");
  const ledger = lf(read(SEED_I1_LEDGER));
  for (const r of repairs) assert.ok(ledger.includes(`\`${r.key}\` | ${r.column} |`), `ledger is missing ${r.key}.${r.column}`);
});

check("G4-I1.2/I1.3 Part C: exactly five owner-approved English grammar repairs — guarded, chained, idempotent; no other English text and no historical migration is touched", () => {
  assert.deepStrictEqual(
    ENGLISH_GRAMMAR_REPAIRS.map((r) => [r.table, r.key, r.column, r.from, r.to]),
    [
      ["business_learning_categories", "proteccion_y_datos", "summary_en", "customers information", "customers' information"],
      ["business_learning_lessons", "customer_data_protection", "summary_en", "customers information", "customers' information"],
      ["business_learning_lessons", "reviews_and_customer_response", "body_en", "many people decisions", "many people's decisions"],
      ["business_learning_lessons", "reviews_and_customer_response", "body_en", "customers experience", "customers' experience"],
      ["business_learning_lessons", "reviews_and_customer_response", "body_en", "customers opinions", "customers' opinions"],
    ],
    "only the five approved before → after pairs",
  );
  const fixes = buildEnglishRepairs(MIGRATION);
  assert.strictEqual(fixes.length, 5);
  for (const r of fixes) {
    assert.strictEqual(r.before.split(r.from).length, 2, `${r.key}.${r.column}: the phrase occurs exactly once`);
    assert.strictEqual(r.after, r.before.replace(r.from, r.to), "nothing but the approved phrase changes");
    const plain = (text: string) => text.replace(/'/g, "").replace("peoples decisions", "people decisions");
    assert.strictEqual(plain(r.after), plain(r.before), `${r.key}.${r.column}: grammar only — an apostrophe (and the possessive s of people's)`);
  }
  // The first repair of each column starts from the value TODAY-1 seeded; the second repair of the same body is chained to the first.
  for (const r of [fixes[0], fixes[1], fixes[2]]) assert.ok(SEED_LF_LITERALS.has(r.before), `${r.key}.${r.column}: 'before' is not the seeded value`);
  assert.strictEqual(fixes[3].before, fixes[2].after, "C4 is guarded by the value C3 leaves behind");
  assert.strictEqual(fixes[4].before, fixes[3].after, "C5 is guarded by the value C3 and C4 leave behind");
  assert.ok(!SEED_LF_LITERALS.has(fixes[3].before) && !SEED_LF_LITERALS.has(fixes[4].before));
  assert.deepStrictEqual([fixes[2], fixes[3], fixes[4]].map((r) => `${r.table}.${r.key}.${r.column}`), Array(3).fill("business_learning_lessons.reviews_and_customer_response.body_en"), "C3 → C4 → C5 are one chain on one column");
  const chainEnd = fixes[4].after;
  assert.strictEqual(chainEnd, fixes[2].before.replace("many people decisions", "many people's decisions").replace("customers experience", "customers' experience").replace("customers opinions", "customers' opinions"), "the chain ends at the seeded body with exactly the three approved phrases repaired");
  assert.strictEqual((chainEnd.match(/'/g) ?? []).length - (fixes[2].before.match(/'/g) ?? []).length, 3, "three apostrophes — nothing else — were added to that body");

  // Part C of the file: exactly these five UPDATEs, each guarded by the md5 of the value it expects.
  assert.ok(SEED_SQL.indexOf(PART_B_BANNER) > 0 && SEED_SQL.indexOf(PART_C_BANNER) > SEED_SQL.indexOf(PART_B_BANNER), "Part C is a clearly separated final section");
  const updates = SEED_PART_C.match(/^UPDATE public\.[a-z_]+ SET [a-z_]+ = /gm) ?? [];
  assert.deepStrictEqual(updates, fixes.map((r) => `UPDATE public.${r.table} SET ${r.column} = `));
  assert.strictEqual((SEED_PART_C.match(/^WHERE (category_key|lesson_key) = '[a-z_]+' AND md5\(replace\((summary_en|body_en), chr\(13\), ''\)\) = '[0-9a-f]{32}';$/gm) ?? []).length, 5, "every Part C UPDATE targets one row by key and is md5-guarded");
  const literals = sqlLiterals(SEED_PART_C);
  for (const r of fixes) {
    assert.ok(literals.includes(r.after), `${r.key}.${r.column}: the SET value is the repaired text`);
    assert.ok(literals.includes(createHash("md5").update(r.before, "utf8").digest("hex")), `${r.key}.${r.column}: guarded by the expected value`);
  }
  // Idempotent: the FINAL value of each repaired column matches no guard (C3's result is, by design, C4's guard, and C4's is C5's — C5's result is nobody's).
  const finals = new Map(fixes.map((r) => [`${r.table}.${r.key}.${r.column}`, r.after]));
  assert.strictEqual(finals.size, 3, "five repairs land on three columns");
  for (const value of finals.values()) assert.ok(!literals.includes(createHash("md5").update(value, "utf8").digest("hex")), "a fully repaired row matches no guard → re-running is a no-op");
  assert.ok(!/INSERT|_es = /.test(SEED_PART_C.split("\n").filter((l) => !l.startsWith("--")).join("\n").replace(/'(?:[^']|'')*'/g, "''")), "Part C contains nothing but its five English UPDATEs");

  // Whole file: 3 inserts + 75 D3 repairs + 5 English repairs = 80 UPDATEs — and no other English column anywhere.
  assert.strictEqual((SEED_SQL.match(/^INSERT INTO /gm) ?? []).length, 3);
  assert.strictEqual((SEED_SQL.match(/^UPDATE public\./gm) ?? []).length, 80);
  assert.strictEqual((SEED_SQL.match(/^UPDATE public\.[a-z_]+ SET [a-z_]*_en = /gm) ?? []).length, 5, "no other English column is modified");
  assert.strictEqual(SEED_SQL.indexOf("_en = "), SEED_PART_C.indexOf("_en = ") + SEED_SQL.indexOf(PART_C_BANNER), "English updates exist only inside Part C");

  // The historical TODAY-1 migration is never the correction vehicle.
  assert.strictEqual(sha256(lf(MIGRATION)), "c9db46631b5ebb96d35a14836f553d84d9dd5796a8c8c0083e8315e0d60eee50", "the TODAY-1 foundation migration must remain byte-identical");
  assert.ok(MIGRATION.includes("your customers information") && MIGRATION.includes("many people decisions") && MIGRATION.includes("its customers opinions"), "the defects are repaired by the reviewed seed, not by rewriting history");

  const ledger = lf(read(SEED_I1_LEDGER));
  assert.ok(ledger.includes("## 3. Part C — reviewed English grammar repairs"));
  for (const [i, r] of fixes.entries()) assert.ok(ledger.includes(`| C${i + 1} | ${r.table} | \`${r.key}\` | ${r.column} | ${r.from} | ${r.to} | grammar-only repair |`), `ledger is missing C${i + 1}`);
  const runbook = read(SEED_I1_RUNBOOK);
  assert.ok(runbook.includes("DO NOT use a blind `supabase db push`") && runbook.includes("customers'' information") && runbook.includes("many people''s decisions") && runbook.includes("customers'' opinions") && runbook.includes("80 `UPDATE` in total") && runbook.includes("Stop. Return to Coach."), "the runbook verifies the five English repairs and keeps the no-blind-push rule");
});

check("I-1A repair artifact: Parts B + C ONLY, derived byte-for-byte from the reviewed seed — 80 guarded UPDATEs in one asserting transaction; no Part A, no insert, no delete, no DDL", () => {
  assert.ok(exists(SEED_I1A_REPAIRS_SQL), "I-1A artifact missing");
  const artifact = lf(read(SEED_I1A_REPAIRS_SQL));
  assert.strictEqual(artifact, buildRepairSql(MIGRATION), "the I-1A artifact must equal the generator output (never hand-edit)");
  assert.strictEqual(buildRepairSql(MIGRATION), buildRepairSql(MIGRATION), "generation is deterministic");
  assert.ok(SEED_I1A_REPAIRS_SQL.startsWith("supabase/reviewed-seeds/learning-center/") && !SEED_I1A_REPAIRS_SQL.includes("/migrations/"), "reviewed seed, never a migration");
  assert.deepStrictEqual(CANONICAL_PROJECT, { name: "Leonix Media", ref: "xuieateniufcrsfdomwl" });

  // 1. Exactly Parts B + C of the canonical seed — sliced, not re-authored.
  const seedRepairs = SEED_SQL.slice(SEED_SQL.lastIndexOf("-- -----", SEED_SQL.indexOf(PART_B_BANNER))).trimEnd();
  assert.ok(artifact.includes("BEGIN;\n\n" + seedRepairs + "\n\n-- ----"), "the repair statements are Parts B and C of the reviewed seed, byte for byte");
  const statements = artifact.split("\n").filter((l) => !l.startsWith("--")).join("\n");
  const bare = statements.replace(/'(?:[^']|'')*'/g, "''");
  assert.strictEqual((statements.match(/^UPDATE public\./gm) ?? []).length, 80);
  assert.strictEqual((statements.match(/^UPDATE public\.[a-z_]+ SET [a-z_]*_es = /gm) ?? []).length, 75, "Part B: 75 Spanish repairs");
  assert.strictEqual((statements.match(/^UPDATE public\.[a-z_]+ SET [a-z_]*_en = /gm) ?? []).length, 5, "Part C: 5 English repairs");
  assert.strictEqual((statements.match(/^WHERE [a-z_]+ = '[a-z_]+' AND md5\(replace\([a-z_]+, chr\(13\), ''\)\) = '[0-9a-f]{32}';$/gm) ?? []).length, 80, "every UPDATE targets one row by key and is md5-guarded");

  // 2–3. Part A is absent: no INSERT, and the I-1 keys appear only inside the assertion that they do NOT exist.
  assert.ok(!/\bINSERT\b/i.test(bare) && !artifact.includes("Part A — new lessons") && !artifact.includes("ON CONFLICT"), "no lesson insert");
  for (const key of BATCH_I1_KEYS) {
    assert.strictEqual(artifact.split(`'${key}'`).length - 1, 1, `${key} appears once — in the must-not-exist assertion`);
  }
  assert.ok(/WHERE lesson_key IN \('what_problem_do_you_solve', 'customer_conversations', 'know_your_competition'\);\n {2}IF n <> 0 THEN RAISE EXCEPTION/.test(artifact));

  // 4–5. No schema mutation, nothing destructive.
  assert.ok(!/\b(CREATE|ALTER|DROP|TRUNCATE|DELETE|GRANT|REVOKE|POLICY|TRIGGER|FUNCTION|INDEX|COPY|EXECUTE)\b/i.test(bare), "no DDL, no delete, nothing dynamic");

  // 6. Only the intended tables and columns.
  assert.deepStrictEqual([...new Set([...bare.matchAll(/public\.([a-z_]+)/g)].map((m) => m[1]))].sort(), ["business_learning_categories", "business_learning_lessons", "business_learning_resources"]);
  assert.deepStrictEqual([...new Set([...statements.matchAll(/^UPDATE public\.[a-z_]+ SET ([a-z_]+) = /gm)].map((m) => m[1]))].sort(), ["body_en", "body_es", "summary_en", "summary_es", "title_es"], "text columns only — never status, sort_order, flags or keys");
  assert.ok(!/business_identity_flags|business_learning_progress|business_capability_records/.test(artifact));

  // One transaction that cannot commit a partial or unexpected result.
  assert.strictEqual((statements.match(/^BEGIN;$/gm) ?? []).length, 1);
  assert.strictEqual((statements.match(/^COMMIT;$/gm) ?? []).length, 1);
  assert.ok(statements.indexOf("BEGIN;") < statements.indexOf("UPDATE public.") && statements.lastIndexOf("UPDATE public.") < statements.indexOf("DO $i1a$") && statements.indexOf("$i1a$;") < statements.indexOf("COMMIT;"), "BEGIN → repairs → assertions → COMMIT");
  assert.strictEqual((statements.match(/RAISE EXCEPTION/g) ?? []).length, 3, "value mismatch · lesson count · I-1 keys");
  const finals = expectedRepairedValues(MIGRATION);
  assert.strictEqual(finals.length, 78, "80 repairs land on 78 columns (C3 → C4 → C5 end in one value)");
  for (const r of finals) assert.ok(artifact.includes(`('${r.key}', '${r.column}', '${createHash("md5").update(r.after, "utf8").digest("hex")}')`), `assertion block is missing ${r.key}.${r.column}`);

  // The runbook is scoped to the canonical project and keeps I-1A and I-1B apart.
  assert.ok(!exists("docs/learning-center-i1-staging-apply-runbook.md"), "the staging-named runbook must be gone");
  const runbook = read(SEED_I1_RUNBOOK);
  assert.ok(runbook.includes("xuieateniufcrsfdomwl") && runbook.includes("Leonix Media") && runbook.includes("There is no staging database"));
  assert.ok(/PROHIBITED: `cgeehvnfyrdoperdotdh`/.test(runbook) && runbook.includes("not a fallback"), "the retiring project is explicitly prohibited");
  assert.ok(runbook.includes("# I-1A — live content repairs (Parts B + C)") && runbook.includes("# I-1B — new-lesson insert / publish (Part A) — NOT AUTHORIZED"));
  assert.ok(!/apply (it )?to staging|staging first|STAGING ONLY/i.test(runbook), "no instruction may treat staging as a target");
  assert.ok(artifact.includes("ref xuieateniufcrsfdomwl") && !artifact.includes("cgeehvnfyrdoperdotdh") && !SEED_SQL.includes("staging first"));
});

check("I-1A.1 supplemental cleanup: exactly two guarded accent repairs in their own artifact; the executed I-1A artifact, Part B and the seed stay byte-identical; sign-in prompt is accented", () => {
  // The executed I-1A artifact is immutable history.
  assert.strictEqual(sha256(lf(read(SEED_I1A_REPAIRS_SQL))), "286f99aacfd60bf39e4dd928b44982cf42c36c70b0e87ff418fcfd3a470fb6c9", "the executed I-1A artifact must never change");
  assert.strictEqual(lf(read(SEED_I1A_REPAIRS_SQL)), buildRepairSql(MIGRATION), "…and the generator still reproduces it exactly");
  const generator = read("scripts/generate-learning-content-seed-i1.ts");
  assert.ok(!generator.includes("writeFileSync(path.join(ROOT, SEED_I1A_REPAIRS_SQL)"), "--write must never rewrite the executed I-1A artifact");

  assert.deepStrictEqual(
    SUPPLEMENTAL_ACCENT_REPAIRS.map((r) => [r.key, r.column, r.from, r.to]),
    [
      ["consistent_business_information", "summary_es", "Por que tu nombre", "Por qué tu nombre"],
      ["healthy_boundaries_and_capacity", "body_es", "y tu terminas agotado", "y tú terminas agotado"],
    ],
    "only the two approved pairs",
  );
  const d3 = buildAccentRepairs(MIGRATION);
  const fixes = buildSupplementalRepairs(MIGRATION);
  assert.strictEqual(fixes.length, 2);
  fixes.forEach((r, i) => {
    const pair = SUPPLEMENTAL_ACCENT_REPAIRS[i];
    const left = d3.find((x) => x.table === r.table && x.key === r.key && x.column === r.column)!;
    assert.strictEqual(r.before, left.after, `${r.key}.${r.column}: guarded by the exact value I-1A left behind`);
    assert.strictEqual(r.before.split(pair.from).length, 2, "the phrase occurs exactly once");
    assert.ok(!r.before.includes(pair.to), "the corrected form is not already present");
    assert.strictEqual(r.after, r.before.replace(pair.from, pair.to));
    assert.strictEqual(stripMarks(r.after), stripMarks(r.before), "an accent — nothing else");
    assert.strictEqual(r.after.length, r.before.length);
    assert.strictEqual(r.table, "business_learning_lessons");
  });

  const artifact = lf(read(SEED_I1A1_CLEANUP_SQL));
  assert.strictEqual(artifact, buildSupplementalSql(MIGRATION), "the I-1A.1 artifact must equal the generator output");
  assert.ok(SEED_I1A1_CLEANUP_SQL.startsWith("supabase/reviewed-seeds/learning-center/"), "reviewed seed, never a migration");
  const statements = artifact.split("\n").filter((l) => !l.startsWith("--")).join("\n");
  const bare = statements.replace(/'(?:[^']|'')*'/g, "''");
  assert.deepStrictEqual(statements.match(/^UPDATE public\.[a-z_]+ SET [a-z_]+ = /gm), ["UPDATE public.business_learning_lessons SET summary_es = ", "UPDATE public.business_learning_lessons SET body_es = "], "exactly two UPDATEs, on the two approved columns");
  assert.strictEqual((statements.match(/^WHERE lesson_key = '[a-z_]+' AND md5\(replace\((summary_es|body_es), chr\(13\), ''\)\) = '[0-9a-f]{32}';$/gm) ?? []).length, 2, "each targets one row by key and is md5-guarded");
  assert.ok(!/\b(INSERT|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|POLICY|TRIGGER|FUNCTION|INDEX|COPY|EXECUTE)\b/i.test(bare), "no insert, no delete, no DDL");
  assert.deepStrictEqual([...new Set([...bare.matchAll(/public\.([a-z_]+)/g)].map((m) => m[1]))], ["business_learning_lessons"]);
  assert.strictEqual((statements.match(/^BEGIN;$/gm) ?? []).length + (statements.match(/^COMMIT;$/gm) ?? []).length, 2);
  assert.strictEqual((statements.match(/RAISE EXCEPTION/g) ?? []).length, 3, "final values · lesson count · I-1 keys");
  const literals = sqlLiterals(artifact);
  for (const r of fixes) {
    assert.ok(literals.includes(r.after) && literals.includes(createHash("md5").update(r.before, "utf8").digest("hex")) && literals.includes(createHash("md5").update(r.after, "utf8").digest("hex")));
    assert.notStrictEqual(createHash("md5").update(r.after, "utf8").digest("hex"), createHash("md5").update(r.before, "utf8").digest("hex"), "after the apply the guard matches nothing");
  }
  // None of the 80 I-1A repairs is repeated here.
  const i1aGuards = new Set([...lf(read(SEED_I1A_REPAIRS_SQL)).matchAll(/chr\(13\), ''\)\) = '([0-9a-f]{32})';/g)].map((m) => m[1]));
  for (const m of artifact.matchAll(/chr\(13\), ''\)\) = '([0-9a-f]{32})';/g)) assert.ok(!i1aGuards.has(m[1]), "an I-1A guard must not reappear in the supplemental artifact");
  assert.ok(!artifact.includes("_en = ") && !artifact.includes("cgeehvnfyrdoperdotdh") && artifact.includes("ref xuieateniufcrsfdomwl"));

  // History is recorded as 80 + 2, never as one transaction of 82.
  const runbook = read(SEED_I1_RUNBOOK);
  assert.ok(runbook.includes("# I-1A.1 — supplemental accent cleanup") && runbook.includes("80 + 2") && !/\b82 (guarded )?(UPDATE|repairs)/i.test(runbook));
  const ledger = lf(read(SEED_I1_LEDGER));
  assert.ok(ledger.includes("## 4. I-1A.1 — supplemental accent cleanup") && ledger.includes("| S1 |") && ledger.includes("| S2 |"));

  // UI chrome: the sign-in prompt is accented in the canonical Learning copy; EN untouched.
  assert.strictEqual(learningCopy("es").signInPrompt, "Inicia sesión para guardar tu progreso.");
  assert.strictEqual(learningCopy("en").signInPrompt, "Sign in to save your progress.");
  assert.ok(!/Inicia sesion/.test(read(`${APRENDER_DIR}/learningCopy.ts`)), "no unaccented “Inicia sesion” remains in the Learning copy");
});

check("G4-I1 doctrine: no provider names, no sponsor, no guarantees, no asserted legal requirements in the new lessons", () => {
  for (const pkg of BATCH_I1_PACKAGES) {
    const text = JSON.stringify(pkg) + JSON.stringify(promptsOf(pkg));
    assert.ok(!/chatgpt|openai|claude|gemini|copilot|anthropic/i.test(text), `${pkg.lessonKey}: assistant-neutral`);
    assert.ok(!/sponsor|patrocin/i.test(text));
    assert.ok(!/garantiz|guarantee/i.test(text), `${pkg.lessonKey}: no guarantees`);
    assert.ok(!/la ley exige|required by law|debes registrar|you must register/i.test(text));
    assert.ok(!/Leonix/.test(text), `${pkg.lessonKey}: useful without Leonix — no commercial mention`);
  }
});

console.log(`\n${passed} check(s) passed${failed ? `, ${failed} FAILED` : ""}.`);
if (failed > 0) {
  console.log("\nSome checks failed.");
  process.exit(1);
} else {
  console.log("\nAll checks passed.");
}
