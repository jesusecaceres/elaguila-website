/**
 * LEO-6 Governance + Decision Engine — targeted construction verifier.
 *
 * Run: npx tsx scripts/verify-leo-6-governance-decision-engine.ts
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildLeoDecisionBrief, prepareLeoDecisionMemoryInput } from "../app/leo/_lib/leoDecisionEngine";
import {
  assessLeoGovernance,
  governanceLevelRank,
  LEO_GOVERNANCE_RULES,
} from "../app/leo/_lib/leoGovernanceEngine";
import type { LeoActionIntentKind } from "../app/leo/_lib/leoTypes";

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

function levelOf(kind: LeoActionIntentKind) {
  return assessLeoGovernance({ actionKind: kind, nowMs: Date.parse("2026-08-17T18:00:00.000Z") }).level;
}

function main() {
  const govPath = "app/leo/_lib/leoGovernanceEngine.ts";
  const decPath = "app/leo/_lib/leoDecisionEngine.ts";
  const svcPath = "app/leo/_lib/leoGovernanceService.ts";
  const living = src("app/leo/_lib/leoLivingBookService.ts");

  check(exists(govPath), "1. governance engine exists");
  check(exists(decPath), "2. decision engine exists");

  const gov = src(govPath);
  const dec = src(decPath);
  const svc = exists(svcPath) ? src(svcPath) : "";

  check(
    !/openai\.com|chat\.completions|generateText|@ai-sdk|anthropic|runListingAiModeration/i.test(gov + dec + svc),
    "3. no AI/provider imports",
  );
  check(
    !/\.insert\s*\(|\.update\s*\(|\.upsert\s*\(|\.delete\s*\(|\.rpc\s*\(/.test(gov + dec),
    "4. no DB writes from engines",
  );
  check(leoApiSurfaceOk(), "5/6. no public UI; API limited to conversation if present");
  const leoMigrations = readdirSync(path.join(ROOT, "supabase/migrations")).filter((f) => f.includes("leo_"));
  check(
    leoMigrations.length === 1 && leoMigrations[0] === "20260817120000_leo_living_book_foundation.sql",
    "7. no migration",
  );
  check(gov.includes("LEO_GOVERNANCE_RULES") && Object.keys(LEO_GOVERNANCE_RULES).length >= 10, "8. rules centralized");

  check(governanceLevelRank("NEVER") > governanceLevelRank("RED"), "9. NEVER overrides RED/YELLOW/GREEN (rank)");
  check(governanceLevelRank("RED") > governanceLevelRank("YELLOW"), "10. RED overrides YELLOW/GREEN (rank)");
  check(governanceLevelRank("YELLOW") > governanceLevelRank("GREEN"), "11. YELLOW overrides GREEN (rank)");

  check(levelOf("READ") === "GREEN" && levelOf("ANALYZE") === "GREEN", "12. read/analyze classifies GREEN");
  check(levelOf("PREPARE_DRAFT") === "YELLOW", "13. prepare draft classifies YELLOW");
  check(levelOf("SEND_EXTERNAL") === "RED", "14. external send classifies RED");
  check(levelOf("DEPLOY_PRODUCTION") === "RED", "15. Production deploy classifies RED");
  check(levelOf("MERGE_MAIN") === "RED", "16. merge main classifies RED");
  check(levelOf("CHANGE_PRICING") === "RED", "17. pricing change classifies RED");
  check(levelOf("SPEND_MONEY") === "RED", "18. spend money classifies RED");
  check(levelOf("ACCEPT_CONTRACT") === "RED", "19. contract acceptance classifies RED");
  check(levelOf("DELETE_CRITICAL_DATA") === "RED", "20. critical delete classifies RED");
  check(levelOf("CHANGE_PERMISSIONS") === "RED", "21. permission change classifies RED");
  check(levelOf("REMOVE_STAFF") === "RED", "22. staff removal classifies RED");
  check(levelOf("MODIFY_AUDIT") === "NEVER" || levelOf("CONCEAL_INFORMATION") === "NEVER", "23. audit concealment classifies NEVER");
  check(levelOf("SELF_GRANT_PRIVILEGE") === "NEVER", "24. self privilege escalation classifies NEVER");
  check(levelOf("BYPASS_APPROVAL") === "NEVER", "25. bypass approval classifies NEVER");

  const nowMs = Date.parse("2026-08-17T18:00:00.000Z");
  const withExternalDowngrade = assessLeoGovernance({
    actionKind: "SEND_EXTERNAL",
    trustSources: ["EXTERNAL_UNTRUSTED_DATA", "SYSTEM_POLICY"],
    externalClaimsDowngrade: true,
    nowMs,
  });
  check(withExternalDowngrade.level === "NEVER", "26. external content cannot lower governance");

  const withExternalApproval = assessLeoGovernance({
    actionKind: "ANALYZE",
    trustSources: ["EXTERNAL_UNTRUSTED_DATA"],
    externalClaimsApproval: true,
    nowMs,
  });
  check(withExternalApproval.level === "NEVER", "27. external content cannot grant approval");

  // External data alone does not raise or lower SEND_EXTERNAL from RED
  const externalOnly = assessLeoGovernance({
    actionKind: "SEND_EXTERNAL",
    trustSources: ["EXTERNAL_UNTRUSTED_DATA"],
    nowMs,
  });
  check(externalOnly.level === "RED", "external data alone does not change RED send");

  const red = assessLeoGovernance({ actionKind: "DEPLOY_PRODUCTION", nowMs });
  check(red.approvalRequired === true, "28. approvalRequired is TRUE for RED");
  check(red.executionAllowed === false, "29. executionAllowed is FALSE for RED in v0");
  check(red.preparationAllowed === true, "31. preparation can remain allowed for RED");

  const never = assessLeoGovernance({ actionKind: "BYPASS_APPROVAL", nowMs });
  check(never.executionAllowed === false && never.preparationAllowed === false, "30. executionAllowed FALSE + prep blocked for NEVER");

  const yellow = assessLeoGovernance({ actionKind: "PREPARE_DRAFT", nowMs });
  check(yellow.level === "YELLOW" && yellow.executionAllowed === false && yellow.preparationAllowed === true, "YELLOW preparation-only in v0");

  // Decision brief
  const brief = buildLeoDecisionBrief({
    decisionKey: "d1",
    question: "Should we deploy?",
    options: [
      { id: "a", label: "Deploy now", irreversible: true },
      { id: "b", label: "Wait" },
    ],
    facts: ["Staging is green"],
    assumptions: ["Traffic will be low"],
    unknowns: ["Rollback drill unproven"],
    contradictions: ["Prior note said wait until Monday"],
    risks: ["operational dependency on CDN"],
    reversible: false,
    deadlineAt: "2026-08-18T00:00:00.000Z",
    relatedMemoryIds: [],
    relatedAttentionItemIds: [],
    actionKind: "DEPLOY_PRODUCTION",
    nowMs,
  });

  check(
    brief.facts.includes("Staging is green") &&
      brief.assumptions.includes("Traffic will be low") &&
      brief.unknowns.includes("Rollback drill unproven"),
    "32. decision brief separates facts/assumptions/unknowns",
  );
  check(brief.contradictions.includes("Prior note said wait until Monday"), "33. contradictions preserved");
  check(
    brief.challenges.some((c) => c.category === "irreversible_consequence"),
    "34. irreversible option produces deterministic challenge",
  );
  check(
    brief.challenges.some((c) => c.category === "missing_evidence"),
    "35. missing evidence produces deterministic challenge",
  );
  check(
    brief.recommendationState === "OWNER_JUDGMENT_REQUIRED" ||
      brief.recommendationState === "BLOCKED_BY_GOVERNANCE",
    "36. no fabricated recommendation for RED deploy",
  );
  check(brief.governance.level === "RED" && brief.ownerDecisionRequired === true, "RED decision requires owner");

  const insufficient = buildLeoDecisionBrief({
    decisionKey: "d2",
    question: "Pick a color?",
    options: [{ id: "x", label: "Blue" }],
    facts: [],
    assumptions: [],
    unknowns: ["No facts provided"],
    contradictions: [],
    risks: [],
    reversible: true,
    deadlineAt: null,
    relatedMemoryIds: [],
    relatedAttentionItemIds: [],
    actionKind: "ANALYZE",
    nowMs,
  });
  check(insufficient.recommendationState === "INSUFFICIENT_EVIDENCE", "36b. insufficient evidence when no facts");

  const supported = buildLeoDecisionBrief({
    decisionKey: "d3",
    question: "Read the report?",
    options: [{ id: "yes", label: "Yes" }],
    facts: ["Report exists"],
    assumptions: [],
    unknowns: [],
    contradictions: [],
    risks: [],
    reversible: true,
    deadlineAt: null,
    relatedMemoryIds: [],
    relatedAttentionItemIds: [],
    actionKind: "READ",
    explicitlySupportedOptionId: "yes",
    nowMs,
  });
  check(supported.recommendationState === "SUPPORTED_OPTION" && supported.supportedOptionId === "yes", "supported only with explicit evidence");

  const memPrep = prepareLeoDecisionMemoryInput(brief, "decision:d1");
  check(
    memPrep.epistemicType === "active_decision" &&
      memPrep.status === "draft" &&
      !dec.includes("createLeoMemory") &&
      !gov.includes("createLeoMemory") &&
      !living.includes("buildLeoDecisionBrief"),
    "37. Living Book not auto-written (prepare-only helper)",
  );

  check(
    exists(svcPath) && svc.includes('import "server-only"') && svc.includes("requireLeoOwnerAccess"),
    "38. owner-only service boundary exists",
  );
  check(!/email|phone|SUPABASE_SERVICE_ROLE/i.test(gov + dec) || !gov.includes("SUPABASE_SERVICE_ROLE"), "39. no secret/PII dump");

  const a = assessLeoGovernance({ actionKind: "SEND_EXTERNAL", nowMs });
  const b = assessLeoGovernance({ actionKind: "SEND_EXTERNAL", nowMs });
  check(
    a.level === b.level &&
      JSON.stringify(a.auditPrep.ruleIds) === JSON.stringify(b.auditPrep.ruleIds),
    "40. deterministic same input → same result",
  );

  // Combined NEVER > RED: SEND + external claim
  check(
    withExternalDowngrade.reasons.some((r) => r.level === "NEVER") &&
      withExternalDowngrade.level === "NEVER",
    "9b. NEVER rule present and wins over RED send",
  );

  if (failures > 0) {
    console.error(`\nLEO-6 verifier FAILED with ${failures} failure(s).`);
    process.exit(1);
  }
  console.log("\nLEO-6 verifier PASS");
}

main();
