/**
 * Package B — Contextual Opportunity / Sponsorship Bridge verifier.
 * Mirrors the program6-creative-studio-verifier.ts / program7-verifier.ts pattern exactly:
 * mechanically inspects the migration SQL and source architecture. No live DB connection.
 *
 * Run: npx tsx scripts/business-opportunity-verifier.ts
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

type VerifyCheck = { name: string; passed: boolean; detail?: string };

const BASE = process.cwd();
const MIGRATION_PATH = join(BASE, "supabase", "migrations", "20260820120000_business_creative_opportunities_foundation.sql");

function readMigrationSql(): string {
  if (!existsSync(MIGRATION_PATH)) throw new Error(`Migration file not found: ${MIGRATION_PATH}`);
  return readFileSync(MIGRATION_PATH, "utf-8");
}

function readSourceFile(relPath: string): string {
  const fullPath = join(BASE, relPath);
  if (!existsSync(fullPath)) throw new Error(`Source file not found: ${fullPath}`);
  return readFileSync(fullPath, "utf-8");
}

function verifyMigration(): VerifyCheck[] {
  const sql = readMigrationSql();
  const checks: VerifyCheck[] = [];

  checks.push({ name: "RLS enabled on business_creative_opportunities", passed: sql.includes("ALTER TABLE public.business_creative_opportunities ENABLE ROW LEVEL SECURITY") });
  checks.push({ name: "PUBLIC/anon/authenticated revoked", passed: sql.includes("REVOKE ALL PRIVILEGES ON TABLE public.business_creative_opportunities FROM PUBLIC") && sql.includes("REVOKE ALL PRIVILEGES ON TABLE public.business_creative_opportunities FROM anon") && sql.includes("REVOKE ALL PRIVILEGES ON TABLE public.business_creative_opportunities FROM authenticated") });
  checks.push({ name: "service_role grant is SELECT, INSERT, UPDATE only (mutable, not append-only)", passed: sql.includes("GRANT SELECT, INSERT, UPDATE ON TABLE public.business_creative_opportunities TO service_role") });
  checks.push({ name: "business_id FK to businesses(id) ON DELETE CASCADE", passed: /business_id uuid NOT NULL REFERENCES public\.businesses\(id\) ON DELETE CASCADE/.test(sql) });
  checks.push({ name: "lifecycle_state CHECK is bounded to the 5 canonical states", passed: sql.includes("'suggested', 'reviewed', 'approved', 'dismissed', 'creative_requested'") });
  checks.push({ name: "opportunity_type CHECK is bounded", passed: sql.includes("'editorial_match', 'sponsored_feature', 'seasonal_campaign', 'category_feature', 'business_campaign'") });
  checks.push({ name: "Actor attribution CHECK present", passed: sql.includes("business_creative_opportunities_created_actor_chk") });
  checks.push({ name: "Reviewed-fields-atomic CHECK present (no partial review record)", passed: sql.includes("business_creative_opportunities_reviewed_atomic_chk") });
  checks.push({ name: "creative_requested state <=> job id set (CHECK enforced)", passed: sql.includes("business_creative_opportunities_creative_requested_chk") });
  checks.push({ name: "Composite same-business FK job<->opportunity (both directions)", passed: sql.includes("business_creative_jobs_source_opportunity_business_fk") && sql.includes("business_creative_opportunities_creative_job_business_fk") });
  checks.push({ name: "Feature flag inserted disabled by default", passed: sql.includes("'business_creative_opportunities', false, false, '{}'") });

  // ─── Absolute data exclusions (Package B, section 5) ────────────────────
  const forbiddenColumns = ["send_email", "send_sms", "call_customer", "outreach_queued", "contract_created", "payment_requested", "sponsorship_confirmed", "pricing_accepted", "auto_publish"];
  for (const col of forbiddenColumns) {
    checks.push({ name: `No automated-execution column "${col}"`, passed: !sql.toLowerCase().includes(col) });
  }

  return checks;
}

function verifyDomainAndSecurity(): VerifyCheck[] {
  const checks: VerifyCheck[] = [];

  const typesContent = readSourceFile("app/lib/business/opportunity/types.ts");
  checks.push({ name: "OpportunityLifecycleState is a bounded enum", passed: typesContent.includes('"suggested"') && typesContent.includes('"creative_requested"') });
  checks.push({ name: "isValidOpportunityStateTransition exported", passed: typesContent.includes("export function isValidOpportunityStateTransition") });
  checks.push({ name: "matchReasons required on CreativeOpportunity (never confidence-only)", passed: typesContent.includes("matchReasons: readonly OpportunityMatchReason[]") && typesContent.includes("confidence:") });
  const forbiddenFieldNames = ["sendEmail", "sendSms", "callCustomer", "outreachQueued", "contractCreated", "paymentRequested", "sponsorshipConfirmed", "pricingAccepted", "autoPublish"];
  for (const f of forbiddenFieldNames) {
    checks.push({ name: `Domain type has no "${f}" field`, passed: !typesContent.includes(f) });
  }

  const repoContent = readSourceFile("app/lib/business/opportunity/repository.ts");
  checks.push({ name: "getOpportunityById filters by BOTH id and business_id (cross-business boundary)", passed: /\.eq\("id", opportunityId\)\s*\n?\s*\.eq\("business_id", businessId\)/.test(repoContent) });
  checks.push({ name: "listOpportunitiesForBusiness scoped by business_id", passed: /listOpportunitiesForBusiness[\s\S]{0,300}\.eq\("business_id", businessId\)/.test(repoContent) });
  checks.push({ name: "Every mutation re-fetches via getOpportunityById before transitioning (re-validates business boundary + state)", passed: (repoContent.match(/await getOpportunityById\(businessId, opportunityId\)/g) ?? []).length >= 2 });
  checks.push({ name: "Invalid transitions rejected via isValidOpportunityStateTransition before any UPDATE", passed: repoContent.includes("if (!isValidOpportunityStateTransition(existing.lifecycleState, toState))") || repoContent.includes('isValidOpportunityStateTransition(existing.lifecycleState, "creative_requested")') });

  // ─── Cross-business security (Package B, Gate 20 — mandatory) ───────────
  // Every single-row UPDATE in the repository must scope on BOTH id and business_id so a
  // Business A actor's opportunityId can never resolve to, or mutate, a Business B row merely by
  // guessing/reusing a UUID. Checked individually for every UPDATE call site, not just once.
  const updateBlocks = repoContent.split(".update(").slice(1);
  checks.push({ name: `Every UPDATE call site (${updateBlocks.length} found) scopes on business_id before .select()`, passed: updateBlocks.length > 0 && updateBlocks.every((block) => /\.eq\("business_id", businessId\)/.test(block.split(".select(")[0])) });
  checks.push({ name: "createOpportunity always writes the caller's businessId (cannot target another business)", passed: /createOpportunity[\s\S]{0,400}business_id: businessId,/.test(repoContent) });

  const routeContent = readSourceFile("app/api/admin/businesses/[businessId]/opportunities/[opportunityId]/route.ts");
  checks.push({ name: "Review/approve/dismiss route requires review_opportunity capability", passed: routeContent.includes('"review_opportunity"') });
  checks.push({ name: "Review/approve/dismiss route requires authorized Sales Workspace access", passed: routeContent.includes("requireSalesWorkspaceAccess") });

  const listRouteContent = readSourceFile("app/api/admin/businesses/[businessId]/opportunities/route.ts");
  checks.push({ name: "List/generate route requires view_opportunities capability", passed: listRouteContent.includes('"view_opportunities"') });
  checks.push({ name: "List/generate route accepts owner bootstrap through shared helper (not a parallel staff session)", passed: listRouteContent.includes("salesActorToOpportunityActor") && !listRouteContent.includes("roster_required") });

  const reviewRouteContent = readSourceFile("app/api/admin/businesses/[businessId]/opportunities/[opportunityId]/route.ts");
  checks.push({ name: "Review route accepts owner bootstrap through shared helper", passed: reviewRouteContent.includes("salesActorToOpportunityActor") && !reviewRouteContent.includes("roster_required") });

  return checks;
}

function verifyMatchEngineAndReadiness(): VerifyCheck[] {
  const checks: VerifyCheck[] = [];

  const matchEngineContent = readSourceFile("app/lib/business/opportunity/matchEngine.ts");
  checks.push({ name: "Match engine is deterministic (no AI/provider import)", passed: !matchEngineContent.includes("providerRegistry") && !matchEngineContent.includes("generateText") });
  checks.push({ name: "Match produces human-readable ES/EN reasons", passed: matchEngineContent.includes("explanationEs") && matchEngineContent.includes("explanationEn") });
  checks.push({ name: "Confidence derived transparently, not a black-box import", passed: matchEngineContent.includes("reasons.length") });

  const readinessContent = readSourceFile("app/lib/business/opportunity/readinessAdapter.ts");
  checks.push({ name: "Readiness adapter reuses checkReadinessGate (real Health Map gate)", passed: readinessContent.includes("checkReadinessGate") });
  checks.push({ name: "Readiness adapter reuses ownerGoalIsKnown (real owner-goal evaluation)", passed: readinessContent.includes("ownerGoalIsKnown") });
  checks.push({ name: "Lion Code rule reused, not reinvented (documented as identical to sixTests.ts)", passed: readinessContent.includes("testLionCode") });
  checks.push({ name: "Not-ready opportunities are surfaced, not hidden (recommendedForAction, not a filter)", passed: readinessContent.includes("recommendedForAction") && !readinessContent.includes("filter(") });

  const editorialContent = readSourceFile("app/lib/business/opportunity/editorialSource.ts");
  checks.push({ name: "Editorial seam is read-only (no create/update/delete exports)", passed: !editorialContent.includes("export async function create") && !editorialContent.includes("export async function update") && !editorialContent.includes("export async function delete") });
  checks.push({ name: "Editorial registry is category-based, not customer-specific (uses BroadBusinessType)", passed: editorialContent.includes("suggestedBusinessCategories: readonly BroadBusinessType[]") });
  checks.push({ name: "No magazine CMS duplication (does not import magazine manifest types)", passed: !editorialContent.includes("magazineManifestTypes") });

  return checks;
}

function verifyCreativeBridge(): VerifyCheck[] {
  const checks: VerifyCheck[] = [];

  const bridgeRouteContent = readSourceFile("app/api/admin/businesses/[businessId]/opportunities/[opportunityId]/creative-request/route.ts");
  checks.push({ name: "Creative bridge reuses existing createJob (no second creative pipeline)", passed: bridgeRouteContent.includes('from "@/app/lib/business/creativeStudio/repository"') && bridgeRouteContent.includes("createJob(") });
  checks.push({ name: "Creative bridge only proceeds from an 'approved' opportunity", passed: bridgeRouteContent.includes('opportunity.lifecycleState !== "approved"') });
  checks.push({ name: "Creative bridge requires create_opportunity_creative_request capability", passed: bridgeRouteContent.includes('"create_opportunity_creative_request"') });
  checks.push({ name: "Creative bridge does not auto-generate creative (no call to /generate)", passed: !bridgeRouteContent.includes("generateText") && !bridgeRouteContent.includes("resolveCreativeProvider") });
  checks.push({ name: "Traceability preserved: job seeded with sourceOpportunityId", passed: bridgeRouteContent.includes("sourceOpportunityId: opportunity.id") });
  checks.push({ name: "Opportunity marked creative_requested with job back-reference", passed: bridgeRouteContent.includes("markOpportunityCreativeRequested(businessId, opportunityId, job.id)") });

  const jobTypesContent = readSourceFile("app/lib/business/creativeStudio/types.ts");
  checks.push({ name: "CreativeJob carries sourceOpportunityId (nullable, backward compatible)", passed: jobTypesContent.includes("sourceOpportunityId: string | null") });

  return checks;
}

function verifySponsorshipTruth(): VerifyCheck[] {
  const checks: VerifyCheck[] = [];
  const typesContent = readSourceFile("app/lib/business/opportunity/types.ts");
  checks.push({ name: "Doctrine documents approved != confirmed sponsor", passed: typesContent.toLowerCase().includes("approved != confirmed sponsor") || typesContent.toLowerCase().includes("approved opportunity") });
  checks.push({ name: "No sponsorship-confirmation field on the opportunity domain type", passed: !typesContent.includes("sponsorshipConfirmed") && !typesContent.includes("sponsorConfirmed") });
  return checks;
}

function main() {
  console.log("\n=== Business Opportunity (Package B) Verifier ===\n");

  const allChecks = [
    ...verifyMigration(),
    ...verifyDomainAndSecurity(),
    ...verifyMatchEngineAndReadiness(),
    ...verifyCreativeBridge(),
    ...verifySponsorshipTruth(),
  ];

  let passed = 0;
  let failed = 0;
  for (const check of allChecks) {
    const status = check.passed ? "PASS" : "FAIL";
    if (check.passed) passed++; else failed++;
    console.log(`  [${status}] ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed (total ${allChecks.length}) ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
