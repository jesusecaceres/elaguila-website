/**
 * LEO-19B Provider Registry + Selection Policy verifier (static / offline).
 *
 * Run:
 *   npx tsx scripts/verify-leo-19b-provider-selection.ts
 *
 * No live providers. No API keys. No network.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { routeLeoIntelligence } from "../app/leo/_lib/leoIntelligenceRouter";
import {
  eligibleProviderTypesForCapability,
  LEO_INTELLIGENCE_PROVIDER_TYPES,
  listLeoIntelligenceProviderRegistry,
} from "../app/leo/_lib/leoIntelligenceProviderRegistry";
import {
  selectLeoIntelligenceProvider,
  selectProviderForIntelligenceRoute,
} from "../app/leo/_lib/leoIntelligenceSelectionPolicy";
import { assessLeoGovernance } from "../app/leo/_lib/leoGovernanceEngine";
import { routeLeoConversation } from "../app/leo/_lib/leoConversationRouter";

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

check(exists("app/leo/_lib/leoIntelligenceProviderRegistry.ts"), "provider registry exists");
check(exists("app/leo/_lib/leoIntelligenceSelectionPolicy.ts"), "selection policy exists");
check(exists("app/leo/_lib/leoIntelligenceRouter.ts"), "LEO-19A router preserved");

const registrySrc = src("app/leo/_lib/leoIntelligenceProviderRegistry.ts");
const policySrc = src("app/leo/_lib/leoIntelligenceSelectionPolicy.ts");
const combined = registrySrc + policySrc;

check(
  !/\b(openai|anthropic|gemini|claude|googleapis|api[_-]?key|OPENAI_API_KEY|ANTHROPIC)\b/i.test(
    combined,
  ),
  "vendor names / API keys not hardcoded",
);
check(!/\bfetch\s*\(|axios|@ai-sdk|openai\.|Anthropic\(/i.test(combined), "no provider SDKs / network calls");
check(!/sk-[a-zA-Z0-9]{10,}/.test(combined), "no API key material");

for (const t of [
  "REASONING_MODEL",
  "CODING_AGENT",
  "CREATIVE_MODEL",
  "RESEARCH_ENGINE",
  "DATA_ANALYSIS_ENGINE",
  "NONE",
] as const) {
  check(LEO_INTELLIGENCE_PROVIDER_TYPES.includes(t), `registry type ${t}`);
}

const registry = listLeoIntelligenceProviderRegistry();
check(registry.every((e) => e.supportsExternalActions === false), "no external actions in registry");
check(
  registry.filter((e) => e.providerType !== "NONE").every((e) => e.availabilityState === "NOT_CONNECTED"),
  "non-NONE providers honestly NOT_CONNECTED",
);

// --- Capability eligibility ---
check(
  eligibleProviderTypesForCapability("EXECUTIVE_REASONING")[0] === "REASONING_MODEL",
  "EXECUTIVE_REASONING prefers REASONING_MODEL",
);
check(
  eligibleProviderTypesForCapability("ENGINEERING_REASONING")[0] === "CODING_AGENT",
  "ENGINEERING_REASONING prefers CODING_AGENT",
);
check(
  eligibleProviderTypesForCapability("ENGINEERING_REASONING").includes("REASONING_MODEL"),
  "ENGINEERING_REASONING allows REASONING_MODEL fallback",
);
check(
  eligibleProviderTypesForCapability("CREATIVE_REASONING")[0] === "CREATIVE_MODEL",
  "CREATIVE_REASONING prefers CREATIVE_MODEL",
);
check(
  eligibleProviderTypesForCapability("RESEARCH_REASONING")[0] === "RESEARCH_ENGINE",
  "RESEARCH_REASONING prefers RESEARCH_ENGINE",
);
check(
  eligibleProviderTypesForCapability("DATA_ANALYSIS")[0] === "DATA_ANALYSIS_ENGINE",
  "DATA_ANALYSIS prefers DATA_ANALYSIS_ENGINE",
);
check(
  eligibleProviderTypesForCapability("UNKNOWN")[0] === "NONE",
  "UNKNOWN resolves safely to NONE",
);

// --- Selection preferences ---
{
  const exec = selectProviderForIntelligenceRoute(
    routeLeoIntelligence({ question: "Should we raise pricing next quarter?" }),
  );
  check(exec.selectedProviderType === "REASONING_MODEL", "selection: executive → REASONING_MODEL");
  check(exec.executionAllowed === false, "selection does not grant execution (executive)");

  const eng = selectProviderForIntelligenceRoute(
    routeLeoIntelligence({
      question: "Fix production now.",
      actionKind: "DEPLOY_PRODUCTION",
    }),
  );
  check(eng.selectedProviderType === "CODING_AGENT", "selection: engineering → CODING_AGENT");
  check(eng.executionAllowed === false, "selection does not grant execution (engineering)");
  check(
    eng.governanceConstraints.requiredGovernanceLevel === "RED",
    "engineering selection preserves RED governance floor",
  );
  check(eng.governanceConstraints.capabilityIsNotAuthority === true, "CAPABILITY != AUTHORITY");

  const gov = assessLeoGovernance({ actionKind: "DEPLOY_PRODUCTION" });
  check(gov.executionAllowed === false, "governance remains separate (deploy blocked)");
  check(gov.level === "RED" || gov.level === "NEVER", "governance still high-risk for deploy");

  const research = selectProviderForIntelligenceRoute(
    routeLeoIntelligence({ question: "Do competitive analysis and market research." }),
  );
  check(research.selectedProviderType === "RESEARCH_ENGINE", "selection: research → RESEARCH_ENGINE");

  const creative = selectProviderForIntelligenceRoute(
    routeLeoIntelligence({ question: "Help with branding and creative direction." }),
  );
  check(creative.selectedProviderType === "CREATIVE_MODEL", "selection: creative → CREATIVE_MODEL");

  const data = selectProviderForIntelligenceRoute(
    routeLeoIntelligence({ question: "Show KPI metrics and conversion trends." }),
  );
  check(data.selectedProviderType === "DATA_ANALYSIS_ENGINE", "selection: data → DATA_ANALYSIS_ENGINE");

  const unknown = selectLeoIntelligenceProvider({ capability: "UNKNOWN" });
  check(unknown.selectedProviderType === "NONE", "UNKNOWN → NONE");
  check(unknown.executionAllowed === false, "UNKNOWN selection not executable");
}

// --- Deterministic fallback when primary unavailable ---
{
  const fb = selectLeoIntelligenceProvider({
    capability: "ENGINEERING_REASONING",
    requiredGovernanceLevel: "RED",
    declaredUnavailable: ["CODING_AGENT"],
  });
  check(fb.selectedProviderType === "REASONING_MODEL", "fallback: CODING_AGENT unavailable → REASONING_MODEL");
  check(fb.executionAllowed === false, "fallback does not grant execution");
  check(
    fb.limitations.some((l) => /unavailable|fallback|NOT_CONNECTED|plan only|executionAllowed/i.test(l)),
    "fallback records limitations (no fake success)",
  );

  const none = selectLeoIntelligenceProvider({
    capability: "ENGINEERING_REASONING",
    declaredUnavailable: ["CODING_AGENT", "REASONING_MODEL"],
  });
  check(none.selectedProviderType === "NONE", "no valid fallback → NONE");
  check(none.limitations.some((l) => /fail-closed|NONE|no invented/i.test(l)), "fail-closed limitation");
}

// --- Send email does not grant SEND authority via selection ---
{
  const send = selectProviderForIntelligenceRoute(
    routeLeoIntelligence({
      question: "Send customer email now.",
      actionKind: "SEND_EXTERNAL",
    }),
  );
  check(send.executionAllowed === false, "send path: selection does not grant SEND");
  check(
    send.governanceConstraints.selectionDoesNotGrantExecution === true,
    "send path: selectionDoesNotGrantExecution",
  );
  check(
    send.limitations.some((l) => /AUTHORITY|execution|Governance/i.test(l)),
    "send path limitations preserve authority boundary",
  );
}

// --- Conversation compatibility ---
{
  const convSrc = src("app/leo/_lib/leoConversationService.ts");
  check(convSrc.includes("selectProviderForIntelligenceRoute"), "conversation integrates selection");
  check(convSrc.includes("providerSelection"), "conversation attaches providerSelection snapshot");
  const route = routeLeoConversation({ question: "What needs my attention?" });
  check(typeof route.intent === "string", "conversation path remains compatible");
}

// --- LEO-19A regression ---
{
  console.log("--- LEO-19A regression ---");
  try {
    execSync("npx tsx scripts/verify-leo-19a-intelligence-router.ts", {
      cwd: ROOT,
      stdio: "inherit",
      encoding: "utf8",
    });
    check(true, "LEO-19A verifier still passes");
  } catch {
    check(false, "LEO-19A verifier still passes");
  }
}

console.log("");
if (failures > 0) {
  console.error(`LEO-19B verifier FAILED with ${failures} failure(s).`);
  process.exit(1);
}
console.log("LEO-19B verifier PASSED.");
process.exit(0);
