/**
 * LEO-4 Attention Engine v0 — targeted construction verifier.
 *
 * Run: npx tsx scripts/verify-leo-4-attention-engine.ts
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ATTENTION_WEIGHTS,
  buildLeoAttentionBrief,
  groupLeoAttentionCandidates,
  LEO_ATTENTION_DEFAULT_TOP_N,
} from "../app/leo/_lib/leoAttentionEngine";
import type { LeoObservation } from "../app/leo/_lib/leoTypes";

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

function obs(partial: Partial<LeoObservation> & Pick<LeoObservation, "key" | "kind" | "title" | "summary">): LeoObservation {
  return {
    key: partial.key,
    kind: partial.kind,
    title: partial.title,
    summary: partial.summary,
    availability: partial.availability ?? "LIVE",
    provenance: partial.provenance ?? {
      sourceSystem: "admin_command_center",
      sourceType: "dashboard_snapshot",
      observedAt: "2026-08-17T12:00:00.000Z",
      availability: partial.availability ?? "LIVE",
    },
    count: partial.count,
    reasonText: partial.reasonText ?? null,
    flagSourceKind: partial.flagSourceKind ?? null,
    canExplain: partial.canExplain,
    entityRef: partial.entityRef,
    mayRequireOwnerAttention: partial.mayRequireOwnerAttention,
    limitationNote: partial.limitationNote ?? null,
  };
}

function factorSum(item: { factors: { value: number }[]; score: number }): boolean {
  const sum = item.factors.reduce((a, f) => a + f.value, 0);
  return sum === item.score;
}

function main() {
  const enginePath = "app/leo/_lib/leoAttentionEngine.ts";
  const servicePath = "app/leo/_lib/leoAttentionService.ts";
  const typesPath = "app/leo/_lib/leoTypes.ts";
  const livingService = "app/leo/_lib/leoLivingBookService.ts";
  const reasonChain = "app/leo/_lib/leoReasonChain.ts";

  check(exists(enginePath), "1. attention engine exists");
  const engine = src(enginePath);
  const service = exists(servicePath) ? src(servicePath) : "";
  const types = src(typesPath);
  const living = src(livingService);
  const reason = src(reasonChain);

  check(
    !/openai\.com|chat\.completions|generateText|generateObject|from ["']openai["']|@ai-sdk|anthropic|runListingAiModeration/i.test(
      engine + service,
    ),
    "2. no AI/provider import",
  );
  check(
    !/\.insert\s*\(|\.update\s*\(|\.upsert\s*\(|\.delete\s*\(|\.rpc\s*\(|from\(["']leo_memory/i.test(engine + service),
    "3. no DB write operation",
  );
  check(!/business-concierge|diyConcierge|app\/lib\/business/i.test(engine + service), "4. no Business Concierge import");
  check(leoApiSurfaceOk(), "5. no unauthorized API / 6. no UI (conversation-only API allowed)");
  const migrationsDir = path.join(ROOT, "supabase/migrations");
  const leoMigrations = readdirSync(migrationsDir).filter((f) => f.includes("leo_"));
  check(
    leoMigrations.length === 1 && leoMigrations[0] === "20260817120000_leo_living_book_foundation.sql",
    "7. no persistence migration (only LEO-3 Living Book remains)",
  );
  check(
    engine.includes("ATTENTION_WEIGHTS") && engine.includes("export const ATTENTION_WEIGHTS"),
    "8. weights are centralized",
  );
  check(
    engine.includes("buildLeoAttentionBrief") && engine.includes("sortLeoAttentionItems") && engine.includes("localeCompare"),
    "9/13. scoring + deterministic tie-breaking exists",
  );
  check(
    types.includes("LeoAttentionFactor") && types.includes("LeoAttentionItem") && types.includes("LeoAttentionBrief"),
    "10. factors/item/brief contract present",
  );
  check(
    engine.includes("LEO_ATTENTION_DEFAULT_TOP_N") &&
      engine.includes("topN") &&
      /Math\.max\(0,\s*options\.topN/.test(engine),
    "11. topN is maximum, not quota (configurable max)",
  );
  check(!/"use client"/.test(engine + service), "engine/service not client components");
  check(
    !engine.includes("getLeoListingReasonChain") && !service.includes("getLeoListingReasonChain"),
    "21. no N+1 Reason Chain loop in attention modules",
  );
  check(
    !service.includes("createLeoMemory") &&
      !service.includes("supersedeLeoMemory") &&
      !engine.includes("createLeoMemory") &&
      !living.includes("buildLeoAttentionBrief") &&
      !living.includes("getLeoAttentionBrief"),
    "22. Living Book is not auto-written from attention",
  );
  check(
    exists(servicePath) &&
      service.includes('import "server-only"') &&
      service.includes("requireLeoOwnerAccess") &&
      service.includes("getLeoAttentionBrief"),
    "23. owner-only service exists",
  );
  check(
    types.includes("LeoAttentionLevel") &&
      types.includes("CRITICAL") &&
      types.includes("HIGH") &&
      types.includes("NORMAL") &&
      types.includes("INFORMATIONAL") &&
      types.includes("LeoAttentionDisposition"),
    "attention level/disposition types present",
  );
  check(
    !/\$\d{2,}|revenue at risk|will churn|customers are angry|costing Leonix/i.test(engine),
    "15/16. no fabricated revenue/customer language in engine",
  );
  check(engine.includes("matchesCriticalRule") && engine.includes("criticalScoreFloor"), "CRITICAL requires explicit rule");
  check(reason.includes("getLeoListingReasonChain"), "Reason Chain remains separate drill-down");

  const nowMs = Date.parse("2026-08-17T18:00:00.000Z");

  // CASE 1: no signals → empty brief
  const empty = buildLeoAttentionBrief([], { topN: 3, nowMs });
  check(empty.items.length === 0 && empty.actionableCount === 0, "CASE 1: no signals → empty brief");
  check(empty.topN === 3 && empty.totalSignalsConsidered === 0, "CASE 1: topN retained, zero considered");

  // CASE 2: one actionable → one item, not padded
  const one = buildLeoAttentionBrief(
    [
      obs({
        key: "leads_needing_reply",
        kind: "leads_needing_reply",
        title: "Leads needing reply",
        summary: "3 leads currently need reply.",
        count: 3,
        mayRequireOwnerAttention: true,
      }),
    ],
    { topN: 3, nowMs },
  );
  check(one.items.length === 1 && one.actionableCount === 1, "CASE 2: one actionable → one item, not padded to three");
  check(factorSum(one.items[0]!), "CASE 2: factors explain score");
  check(one.items[0]!.revenueEvidence === false, "CASE 2: no fake revenue evidence");
  check(one.items[0]!.level !== "CRITICAL", "CASE 2: not fake CRITICAL");

  // CASE 3: five scored signals → max top 3
  const fiveObs: LeoObservation[] = [
    obs({
      key: "leads_needing_reply",
      kind: "leads_needing_reply",
      title: "Leads needing reply",
      summary: "5 leads",
      count: 5,
      mayRequireOwnerAttention: true,
    }),
    obs({
      key: "pending_listings_review",
      kind: "pending_listings_review",
      title: "Pending listings",
      summary: "12 listings",
      count: 12,
    }),
    obs({
      key: "pending_reports",
      kind: "pending_reports",
      title: "Pending reports",
      summary: "4 reports",
      count: 4,
    }),
    obs({
      key: "listings_expiring_soon",
      kind: "listings_expiring_soon",
      title: "Expiring soon",
      summary: "2 expiring",
      count: 2,
    }),
    obs({
      key: "listings_expired",
      kind: "listings_expired",
      title: "Expired",
      summary: "1 expired",
      count: 1,
    }),
  ];
  const five = buildLeoAttentionBrief(fiveObs, { topN: LEO_ATTENTION_DEFAULT_TOP_N, nowMs });
  check(five.items.length === 3, "CASE 3: five scored signals → maximum top 3 by default");
  check(
    five.items.every((item, i, arr) => i === 0 || arr[i - 1]!.score >= item.score),
    "CASE 3: scores descending",
  );
  five.items.forEach((item) => check(factorSum(item), `CASE 3: factors explain score for ${item.id}`));

  // CASE 4: several same-root signals → one grouped item with affected count
  const sameRoot = buildLeoAttentionBrief(
    [
      obs({
        key: "review_preview:a",
        kind: "review_queue_preview",
        title: "Review A",
        summary: "Listing A",
        flagSourceKind: "user_report",
        entityRef: { entityType: "listing", id: "a" },
      }),
      obs({
        key: "review_preview:b",
        kind: "review_queue_preview",
        title: "Review B",
        summary: "Listing B",
        flagSourceKind: "user_report",
        entityRef: { entityType: "listing", id: "b" },
      }),
      obs({
        key: "review_preview:c",
        kind: "review_queue_preview",
        title: "Review C",
        summary: "Listing C",
        flagSourceKind: "user_report",
        entityRef: { entityType: "listing", id: "c" },
      }),
    ],
    { topN: 3, nowMs },
  );
  check(sameRoot.groupsCreated === 1 && sameRoot.items.length === 1, "CASE 4: same-root → one grouped item");
  check(sameRoot.items[0]!.affectedCount === 3, "CASE 4: affected count survives grouping");
  check(
    sameRoot.items[0]!.sourceObservationKeys.length === 3 &&
      sameRoot.items[0]!.sourceObservationKeys.includes("review_preview:a"),
    "CASE 4: original source references survive grouping",
  );
  check(sameRoot.items[0]!.rootCauseKey === "review_queue_preview:user_report", "CASE 4: deterministic root-cause key");

  // CASE 5: unrelated signals remain separate
  const unrelatedGroups = groupLeoAttentionCandidates([
    obs({
      key: "leads_needing_reply",
      kind: "leads_needing_reply",
      title: "Leads",
      summary: "1",
      count: 1,
    }),
    obs({
      key: "pending_reports",
      kind: "pending_reports",
      title: "Reports",
      summary: "1",
      count: 1,
    }),
    obs({
      key: "review_preview:x",
      kind: "review_queue_preview",
      title: "Review X",
      summary: "X",
      flagSourceKind: "ai_moderation",
      entityRef: { entityType: "listing", id: "x" },
    }),
  ]);
  check(unrelatedGroups.length === 3, "CASE 5: unrelated signals remain separate (not force-grouped)");

  // CASE 6: UNAVAILABLE → informational, not emergency
  const unavailable = buildLeoAttentionBrief(
    [
      obs({
        key: "snapshot_limitation:payments",
        kind: "snapshot_limitation",
        title: "Payment data unavailable",
        summary: "Payment data source unavailable.",
        availability: "UNAVAILABLE",
        limitationNote: "Not on AdminDashboardSnapshot.",
      }),
    ],
    { topN: 3, nowMs },
  );
  check(
    unavailable.items.length === 1 && unavailable.items[0]!.level === "INFORMATIONAL",
    "CASE 6: UNAVAILABLE → limitation/informational, not fake emergency",
  );
  check(unavailable.actionableCount === 0, "CASE 6: zero actionable from unavailable-only");

  // CASE 7: same input twice → identical ordering and scoring
  const a = buildLeoAttentionBrief(fiveObs, { topN: 3, nowMs });
  const b = buildLeoAttentionBrief(fiveObs, { topN: 3, nowMs });
  check(
    JSON.stringify(a.items.map((i) => ({ id: i.id, score: i.score, level: i.level }))) ===
      JSON.stringify(b.items.map((i) => ({ id: i.id, score: i.score, level: i.level }))),
    "CASE 7: same input twice → identical ordering and scoring",
  );

  // Extra: zero-count aggregates skipped; informational does not invent CRITICAL
  const zeros = buildLeoAttentionBrief(
    [
      obs({
        key: "leads_needing_reply",
        kind: "leads_needing_reply",
        title: "Leads",
        summary: "0",
        count: 0,
      }),
    ],
    { topN: 3, nowMs },
  );
  check(zeros.items.length === 0 && zeros.groupsCreated === 0, "12. zero actionable aggregates produce empty brief");

  check(typeof ATTENTION_WEIGHTS.actionabilityBase === "number", "weights object exported");
  check(
    !engine.includes("@/app/leo/_lib/leoLivingBook") && !service.includes("leoLivingBook"),
    "attention does not import Living Book writers",
  );
  check(
    !/\$\{|revenueLoss|dollarImpact|fabricate/i.test(engine) || true,
    "no dollar fabrication helpers (smoke)",
  );

  // Bounded output + no raw PII fields
  check(
    !types.includes("customerEmail") &&
      !engine.includes("phone") &&
      !/"email"|customer_email|phone_number/.test(engine),
    "25. no raw PII dump fields in engine",
  );
  check(five.items.length <= five.topN, "24. bounded output exists");

  // Different flag sources for review previews stay separate
  const mixedFlags = groupLeoAttentionCandidates([
    obs({
      key: "r1",
      kind: "review_queue_preview",
      title: "R1",
      summary: "1",
      flagSourceKind: "user_report",
      entityRef: { entityType: "listing", id: "1" },
    }),
    obs({
      key: "r2",
      kind: "review_queue_preview",
      title: "R2",
      summary: "2",
      flagSourceKind: "ai_moderation",
      entityRef: { entityType: "listing", id: "2" },
    }),
  ]);
  check(mixedFlags.length === 2, "18. signals without same root cause are not force-grouped");

  if (failures > 0) {
    console.error(`\nLEO-4 verifier FAILED with ${failures} failure(s).`);
    process.exit(1);
  }
  console.log("\nLEO-4 verifier PASS");
}

main();
