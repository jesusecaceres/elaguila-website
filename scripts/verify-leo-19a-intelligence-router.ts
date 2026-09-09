/**
 * LEO-19A Intelligence Router Foundation verifier (static / fixture-safe).
 *
 * Run:
 *   npx tsx scripts/verify-leo-19a-intelligence-router.ts
 *
 * Does NOT call live providers. Does NOT use API keys.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  LEO_FUTURE_PROVIDER_TYPES,
  LEO_INTELLIGENCE_CAPABILITIES,
  leoIntelligenceRouteSnapshot,
  routeLeoIntelligence,
} from "../app/leo/_lib/leoIntelligenceRouter";
import { assessLeoGovernance } from "../app/leo/_lib/leoGovernanceEngine";
import { routeLeoConversation } from "../app/leo/_lib/leoConversationRouter";
import { buildLeoConversationProposalCandidate } from "../app/leo/_lib/leoConversationProposalBridge";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_BRANCH = "integration/leo-executive-operating-intelligence-2026-08";

function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}
function exists(rel: string): boolean {
  return existsSync(path.join(ROOT, rel));
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
check(branch === EXPECTED_BRANCH, "correct integration branch");

check(exists("app/leo/_lib/leoIntelligenceRouter.ts"), "router exists");
check(exists("app/leo/_lib/leoGovernanceEngine.ts"), "governance engine preserved");
check(exists("app/leo/_lib/leoConversationService.ts"), "conversation service preserved");
check(exists("app/leo/_lib/leoActionProposalService.ts"), "proposal system preserved");

for (const cap of [
  "EXECUTIVE_REASONING",
  "ENGINEERING_REASONING",
  "CREATIVE_REASONING",
  "RESEARCH_REASONING",
  "DATA_ANALYSIS",
  "UNKNOWN",
] as const) {
  check(LEO_INTELLIGENCE_CAPABILITIES.includes(cap), `capability ${cap}`);
}

for (const p of [
  "reasoning_model",
  "coding_agent",
  "creative_model",
  "research_engine",
  "data_analysis_engine",
] as const) {
  check(LEO_FUTURE_PROVIDER_TYPES.includes(p), `future provider type ${p}`);
}

const routerSrc = src("app/leo/_lib/leoIntelligenceRouter.ts");
check(!/\b(openai|anthropic|gemini|googleapis|api[_-]?key|OPENAI|ANTHROPIC)\b/i.test(routerSrc), "no vendor/API key hardcoding");
check(!/\bfetch\s*\(|axios|createClient\(|@ai-sdk\b/i.test(routerSrc), "no external calls / SDK clients");
check(!exists("app/leo/_lib/leoIntelligenceRouterV2.ts"), "no duplicate intelligence router");
check(!exists("app/leo/_lib/leoModelSelector.ts"), "no autonomous model selector");

// --- Deterministic classification ---
{
  const exec = routeLeoIntelligence({
    question: "Should we raise pricing for enterprise advertisers next quarter?",
  });
  check(exec.requestedCapability === "EXECUTIVE_REASONING", "executive: pricing/strategy");
  check(exec.confidence === "HIGH", "executive confidence HIGH");
  check(exec.futureProviderType === "reasoning_model", "executive → reasoning_model");
  check(exec.reason.toLowerCase().includes("strategy") || exec.reason.toLowerCase().includes("pricing") || exec.reason.toLowerCase().includes("tradeoff") || exec.reason.toLowerCase().includes("business"), "executive reason present");

  const eng = routeLeoIntelligence({
    question: "Fix production now.",
    actionKind: "DEPLOY_PRODUCTION",
  });
  check(eng.requestedCapability === "ENGINEERING_REASONING", "engineering: fix production");
  check(eng.futureProviderType === "coding_agent", "engineering → coding_agent");
  check(eng.requiredGovernanceLevel === "RED", "engineering suggests RED floor");
  check(eng.governanceRemainsAuthoritative === true, "governance remains authoritative flag");
  check(eng.blockedActions.includes("DEPLOY_PRODUCTION"), "deploy blocked by router doctrine");
  check(eng.blockedActions.includes("CALL_EXTERNAL_MODEL"), "external model call blocked");
  check(eng.notClaiming.some((n) => /not permission/i.test(n)), "selection is not permission");

  // Governance still decides — separate engine
  const gov = assessLeoGovernance({ actionKind: "DEPLOY_PRODUCTION" });
  check(gov.level === "RED" || gov.level === "NEVER", "governance still classifies deploy as high risk");
  check(gov.executionAllowed === false, "governance: execution not allowed");
  check(gov.approvalRequired === true || gov.level === "NEVER", "governance: approval required or NEVER");

  const creative = routeLeoIntelligence({
    question: "Help me with branding and creative direction for the spring campaign.",
  });
  check(creative.requestedCapability === "CREATIVE_REASONING", "creative classification");
  check(creative.futureProviderType === "creative_model", "creative → creative_model");

  const research = routeLeoIntelligence({
    question: "Do competitive analysis and market research on local Spanish media.",
  });
  check(research.requestedCapability === "RESEARCH_REASONING", "research classification");
  check(research.futureProviderType === "research_engine", "research → research_engine");

  const data = routeLeoIntelligence({
    question: "Show conversion rate trends and KPI metrics for last month.",
  });
  check(data.requestedCapability === "DATA_ANALYSIS", "data analysis classification");
  check(data.futureProviderType === "data_analysis_engine", "data → data_analysis_engine");

  const unknown = routeLeoIntelligence({ question: "asdf qwerty" });
  check(unknown.requestedCapability === "UNKNOWN", "unknown requests handled safely");
  check(unknown.futureProviderType === "none", "unknown → none provider type");
  check(unknown.confidence === "LOW" || unknown.confidence === "NONE", "unknown confidence low/none");
}

// --- Snapshot ---
{
  const r = routeLeoIntelligence({ question: "Leadership tradeoffs for hiring." });
  const snap = leoIntelligenceRouteSnapshot(r);
  check(snap.requestedCapability === "EXECUTIVE_REASONING", "snapshot capability");
  check(snap.governanceRemainsAuthoritative === true, "snapshot governance flag");
}

// --- Conversation / proposal systems still pass patterns ---
{
  const convSrc = src("app/leo/_lib/leoConversationService.ts");
  check(convSrc.includes("routeLeoIntelligence"), "conversation integrates intelligence router");
  check(convSrc.includes("intelligenceRoute"), "conversation exposes intelligenceRoute");

  const route = routeLeoConversation({ question: "Send John an email." });
  check(route.intent === "CAPABILITY_GOVERNANCE", "existing conversation routing still works");

  const cand = buildLeoConversationProposalCandidate({
    question: 'Send an email to alex@example.com saying "hello"',
  });
  check(cand.status === "PROPOSABLE", "existing proposal system still works");
}

// --- No new governance / action engines ---
check(!exists("app/leo/_lib/leoGovernanceEngineV2.ts"), "no duplicate governance engine");
check(!exists("app/leo/_lib/leoActionEngineV2.ts"), "no new action engine");

console.log("");
if (failures > 0) {
  console.error(`LEO-19A verifier FAILED with ${failures} failure(s).`);
  process.exit(1);
}
console.log("LEO-19A verifier PASSED.");
process.exit(0);
