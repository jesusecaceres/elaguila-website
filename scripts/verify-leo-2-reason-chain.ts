/**
 * LEO-2 Listing Reason Chain — targeted construction verifier.
 *
 * Run: npx tsx scripts/verify-leo-2-reason-chain.ts
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assembleLeoListingReasonChain } from "../app/leo/_lib/leoReasonChainAssemble";
import type { ListingModerationReviewSummary } from "../app/admin/_lib/listingModerationReviewTypes";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(path.join(ROOT, rel));
}

function leoApiSurfaceOk(): boolean {
  if (exists("app/leo/page.tsx")) return false;
  if (!exists("app/api/leo")) return true;
  if (!exists("app/api/leo/conversation/route.ts")) return false;
  const routes: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name === "route.ts") routes.push(path.relative(path.join(ROOT, "app/api/leo"), p).replace(/\\/g, "/"));
    }
  };
  walk(path.join(ROOT, "app/api/leo"));
  return routes.length === 1 && routes[0] === "conversation/route.ts";
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

function fakeStoredReview(partial: Partial<ListingModerationReviewSummary>): ListingModerationReviewSummary {
  return {
    id: partial.id ?? "rev-1",
    listing_id: partial.listing_id ?? "listing-1",
    leonix_ad_id: partial.leonix_ad_id ?? "LX-1",
    decision: partial.decision ?? "needs_review",
    source: partial.source ?? "ai",
    reason_category: partial.reason_category ?? "spam",
    reason_text: partial.reason_text ?? "Looks like spam.",
    confidence: partial.confidence ?? "high",
    risk_level: partial.risk_level ?? "medium",
    recommended_action: partial.recommended_action ?? "review_manually",
    policy_flags: partial.policy_flags ?? ["spam"],
    keyword_flags: partial.keyword_flags ?? ["spam"],
    category_rules: partial.category_rules ?? null,
    scanner_summary: partial.scanner_summary ?? null,
    admin_summary: partial.admin_summary ?? null,
    policy_version: partial.policy_version ?? "2.0.0",
    model: partial.model ?? "gpt-4o-mini",
    reviewed_at: partial.reviewed_at ?? "2026-08-01T00:00:00.000Z",
    error_message: partial.error_message ?? null,
  };
}

function main() {
  const chainPath = "app/leo/_lib/leoReasonChain.ts";
  const assemblePath = "app/leo/_lib/leoReasonChainAssemble.ts";
  const typesPath = "app/leo/_lib/leoTypes.ts";
  const adapterPath = "app/leo/_lib/leoAdminTruthAdapter.ts";

  check(exists(chainPath), "Reason-chain loader module exists");
  check(exists(assemblePath), "Reason-chain pure assembler exists");
  check(src(chainPath).includes('import "server-only"'), "Reason-chain loader is server-only");
  check(!src(assemblePath).includes('import "server-only"'), "Pure assembler is not server-only (fixture-safe)");

  const chain = src(chainPath);
  const assemble = src(assemblePath);
  const types = src(typesPath);
  const adapter = src(adapterPath);

  check(
    !/\.insert\s*\(|\.update\s*\(|\.upsert\s*\(|\.delete\s*\(|\.rpc\s*\(/.test(chain + assemble),
    "Reason-chain modules contain no write operations",
  );
  check(
    !/openai\.com|chat\.completions|generateText|generateObject|from ["']openai["']|@ai-sdk|anthropic|runListingAiModeration/i.test(
      chain + assemble,
    ),
    "Reason-chain modules contain no AI/provider calls",
  );
  check(
    !/business-concierge|BusinessConcierge|diyConcierge|app\/lib\/business/i.test(chain + assemble),
    "Reason-chain does not import Business Concierge",
  );
  check(leoApiSurfaceOk(), "No LEO UI; API limited to conversation route if present");
  check(!/CREATE TABLE|supabase\/migrations/.test(chain + assemble + types), "No schema/migration dependency added");

  check(
    types.includes("USER_REPORT") &&
      types.includes("STORED_MODERATION_REVIEW") &&
      types.includes("STATUS_ONLY") &&
      types.includes("UNKNOWN") &&
      types.includes("PERSISTED") &&
      types.includes("DERIVED") &&
      types.includes("MISSING") &&
      types.includes("EXPLAINED") &&
      types.includes("observabilityGap"),
    "leoTypes reason-chain contract includes sources, quality, explanation, observability gap",
  );
  check(
    !/AI_GENERATED|LLM_EXPLANATION|likely reason|guess the reason/i.test(types),
    "No AI interpretation contract in leoTypes",
  );

  check(
    chain.includes("getLeoListingReasonChain") && assemble.includes("assembleLeoListingReasonChain"),
    "Public assemble + getLeoListingReasonChain exports exist",
  );
  check(
    chain.includes("fetchListingFlagContextMaps") && chain.includes("requireLeoOwnerAccess"),
    "Loader reuses Admin flag context + LEO owner access",
  );
  check(
    chain.includes("fetchListingFlagContextMaps(supabase, [id], [])"),
    "Loader does not request owner emails (empty owner id list)",
  );
  check(
    !adapter.includes("getLeoListingReasonChain") && !adapter.includes("assembleLeoListingReasonChain"),
    "LEO-1 executive snapshot does not N+1 into reason-chain queries",
  );

  // --- Fixtures ---
  const withReport = assembleLeoListingReasonChain({
    listingId: "listing-1",
    status: "flagged",
    pendingReportReason: "Scam pricing",
    storedAiReview: fakeStoredReview({ reason_text: "AI also noted spam" }),
  });
  check(
    withReport.primaryReason?.sourceType === "USER_REPORT" &&
      withReport.primaryReason.humanReadableReason === "Scam pricing" &&
      withReport.primaryReason.quality === "PERSISTED",
    "Fixture: persisted user-report reason becomes primary evidence",
  );
  check(
    withReport.evidence.some((e) => e.sourceType === "STORED_MODERATION_REVIEW") &&
      withReport.evidence.some((e) => e.sourceType === "STATUS_ONLY"),
    "Fixture: secondary stored-review and status evidence are preserved",
  );
  check(withReport.explanationState === "EXPLAINED" && withReport.observabilityGap === false, "Fixture: report path is EXPLAINED");

  const withStoredAi = assembleLeoListingReasonChain({
    listingId: "listing-2",
    status: "flagged",
    storedAiReview: fakeStoredReview({ reason_category: "scam", reason_text: "Payment scam patterns" }),
  });
  check(
    withStoredAi.primaryReason?.sourceType === "STORED_MODERATION_REVIEW" &&
      withStoredAi.primaryReason.humanReadableReason === "Payment scam patterns" &&
      withStoredAi.primaryReason.reasonCode === "scam" &&
      withStoredAi.primaryReason.quality === "PERSISTED",
    "Fixture: persisted moderation review becomes primary evidence",
  );

  const statusOnly = assembleLeoListingReasonChain({
    listingId: "listing-3",
    status: "flagged",
  });
  check(
    statusOnly.primaryReason?.sourceType === "STATUS_ONLY" &&
      statusOnly.primaryReason.quality === "DERIVED" &&
      statusOnly.observabilityGap === true &&
      statusOnly.explanationState === "PARTIALLY_EXPLAINED",
    "Fixture: status-only is DERIVED, marks observability gap, does not invent cause",
  );
  check(
    !/likely|probably|guess|inferred original/i.test(JSON.stringify(statusOnly)),
    "Fixture: status-only output has no guess-reason language",
  );

  const missing = assembleLeoListingReasonChain({
    listingId: "listing-4",
    status: "active",
  });
  check(
    missing.explanationState === "UNKNOWN" &&
      missing.provenanceQuality === "MISSING" &&
      missing.evidence.some((e) => e.sourceType === "UNKNOWN" && e.quality === "MISSING"),
    "Fixture: missing provenance returns UNKNOWN / MISSING",
  );

  const withManual = assembleLeoListingReasonChain({
    listingId: "listing-5",
    status: "pending_review",
    sourceTable: "empleos_public_listings",
    reviewNotes: "Staff: verify employer",
  });
  check(
    withManual.primaryReason?.sourceType === "MANUAL_MODERATION" &&
      withManual.primaryReason.quality === "PERSISTED" &&
      withManual.evidence.some((e) => e.quality === "DERIVED"),
    "Fixture: manual note is PERSISTED primary; derived status kept as secondary",
  );

  const unavailableAi = assembleLeoListingReasonChain({
    listingId: "listing-6",
    status: "flagged",
    storedAiReview: fakeStoredReview({ decision: "unavailable", reason_text: null, source: "ai" }),
  });
  check(
    unavailableAi.primaryReason?.sourceType === "STATUS_ONLY" &&
      !unavailableAi.evidence.some(
        (e) => e.sourceType === "STORED_MODERATION_REVIEW" && e.humanReadableReason != null,
      ),
    "Fixture: unavailable AI review is not treated as a persisted cause",
  );

  check(
    !/ownerEmail|ownerPhone|contact_email|contact_phone|raw_result|raw_input|SUPABASE_SERVICE_ROLE|OPENAI_API_KEY|RESEND_API_KEY/.test(
      chain + assemble,
    ),
    "No raw PII dump or secret env references in reason-chain modules",
  );
  check(
    !/guess the reason|likely reason|probably because|invent cause/i.test(chain + assemble),
    "No guess-reason behavior phrases in reason-chain source",
  );

  if (failures > 0) {
    console.error(`\nLEO-2 verifier FAILED with ${failures} check(s).`);
    process.exit(1);
  }
  console.log("\nLEO-2 verifier PASSED.");
}

main();
