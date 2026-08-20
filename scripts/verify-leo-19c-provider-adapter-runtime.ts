/**
 * LEO-19C Intelligence Provider Adapter Runtime verifier (offline).
 *
 * Run:
 *   npx tsx scripts/verify-leo-19c-provider-adapter-runtime.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { routeLeoIntelligence } from "../app/leo/_lib/leoIntelligenceRouter";
import { selectProviderForIntelligenceRoute } from "../app/leo/_lib/leoIntelligenceSelectionPolicy";
import {
  LEO_DEFAULT_PROVIDER_EXPOSURE,
  LEO_EMPTY_EXECUTION_CLAIMS,
  LEO_INTELLIGENCE_FAILURE_CATEGORIES,
  containsForbiddenExecutionClaimLanguage,
  governanceLevelPreserved,
} from "../app/leo/_lib/leoIntelligenceProviderAdapter";
import { createLeoNullIntelligenceProviderAdapter } from "../app/leo/_lib/leoNullIntelligenceProviderAdapter";
import {
  buildLeoIntelligenceInvocationRequest,
  invokeLeoIntelligenceProvider,
  leoIntelligenceInvocationReadinessSnapshot,
} from "../app/leo/_lib/leoIntelligenceInvocationService";
import { assessLeoGovernance } from "../app/leo/_lib/leoGovernanceEngine";

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

check(exists("app/leo/_lib/leoIntelligenceProviderAdapter.ts"), "universal adapter contract exists");
check(exists("app/leo/_lib/leoNullIntelligenceProviderAdapter.ts"), "null/offline adapter exists");
check(exists("app/leo/_lib/leoIntelligenceInvocationService.ts"), "invocation service exists");

const adapterSrc = src("app/leo/_lib/leoIntelligenceProviderAdapter.ts");
const nullSrc = src("app/leo/_lib/leoNullIntelligenceProviderAdapter.ts");
const invSrc = src("app/leo/_lib/leoIntelligenceInvocationService.ts");
const combined = adapterSrc + nullSrc + invSrc;

check(adapterSrc.includes("LeoIntelligenceInvocationRequest"), "normalized request exists");
check(adapterSrc.includes("LeoIntelligenceInvocationResult"), "normalized result exists");
check(adapterSrc.includes("LeoIntelligenceProviderAdapter"), "adapter interface exists");
check(adapterSrc.includes("providerType"), "adapter declares provider type");
check(adapterSrc.includes("supportedCapabilities"), "adapter declares capabilities");

check(
  !/\b(openai|anthropic|gemini|claude\.ai|googleapis|OPENAI_API_KEY|ANTHROPIC)\b/i.test(combined),
  "no vendor hardcoding in runtime contract",
);
check(!/\bfetch\s*\(|axios|@ai-sdk|openai\.|new Anthropic/i.test(combined), "no provider SDKs / HTTP");
check(!/sk-[a-zA-Z0-9]{10,}/.test(combined), "no API keys");
check(!exists(".env.leo-19c"), "no env file added for 19C");

check(LEO_DEFAULT_PROVIDER_EXPOSURE.includeFullMemory === false, "minimum-context: no full memory");
check(
  LEO_DEFAULT_PROVIDER_EXPOSURE.includeFullConversationHistory === false,
  "minimum-context: no full conversation history",
);
check(
  LEO_DEFAULT_PROVIDER_EXPOSURE.includeFullExternalCorpora === false,
  "minimum-context: no full external corpora",
);

for (const c of [
  "NO_PROVIDER",
  "NOT_CONNECTED",
  "CAPABILITY_MISMATCH",
  "GOVERNANCE_BLOCKED",
  "INVALID_REQUEST",
  "PROVIDER_UNAVAILABLE",
  "TIMEOUT",
  "PROVIDER_ERROR",
  "NORMALIZATION_ERROR",
] as const) {
  check(LEO_INTELLIGENCE_FAILURE_CATEGORIES.includes(c), `failure category ${c}`);
}

check(LEO_EMPTY_EXECUTION_CLAIMS.sent === false, "executionClaims.sent false");
check(LEO_EMPTY_EXECUTION_CLAIMS.deployed === false, "executionClaims.deployed false");

async function main(): Promise<void> {
  // --- Offline adapter truth ---
  {
    const route = routeLeoIntelligence({
      question: "Should we raise pricing next quarter?",
    });
    const selection = selectProviderForIntelligenceRoute(route);
    check(selection.selectedProviderType === "REASONING_MODEL", "selection still authoritative (executive)");

    const { request, result, adapterUsed } = await invokeLeoIntelligenceProvider({
      question: "Should we raise pricing next quarter?",
      route,
      selection,
      boundedExecutiveContextSummary: "confidence=MEDIUM; knownFacts=2",
    });

    check(request.exposure.includeFullMemory === false, "request exposure: no full memory");
    check(!("oauthToken" in request) && !("apiKey" in request), "no secrets in invocation request");
    check(result.status === "NOT_CONNECTED", "NOT_CONNECTED fails truthfully");
    check(result.externalSideEffects === false, "no external side effects");
    check(result.executionClaims.sent === false, "no fake sent claim");
    check(result.summary != null && !containsForbiddenExecutionClaimLanguage(result.summary), "no forbidden claim language");
    check(result.observability.receiptCreated === false, "no fake receipt created");
    check(result.observability.receiptCompatible === true, "receipt-compatible hook present");
    check(result.observability.reportingCompatible === true, "reporting-compatible hook present");
    check(result.observability.reportEmitted === false, "no fake report emitted");
    check(adapterUsed.isConnected === false, "adapter used is offline");
    check(result.confidence === "NONE", "no fake successful provider confidence");
  }

  {
    const route = routeLeoIntelligence({ question: "asdf qwerty" });
    const selection = selectProviderForIntelligenceRoute(route);
    const { result } = await invokeLeoIntelligenceProvider({
      question: "asdf qwerty",
      route,
      selection,
    });
    check(
      result.status === "NO_PROVIDER" || selection.selectedProviderType === "NONE",
      "UNKNOWN/NONE fails truthfully",
    );
    if (selection.selectedProviderType === "NONE") {
      check(result.status === "NO_PROVIDER", "NONE → NO_PROVIDER status");
    }
  }

  // --- Governance firewall ---
  {
    const route = routeLeoIntelligence({
      question: "Fix production now.",
      actionKind: "DEPLOY_PRODUCTION",
    });
    const selection = selectProviderForIntelligenceRoute(route);
    check(selection.executionAllowed === false, "provider cannot grant execution permission");
    check(
      selection.governanceConstraints.requiredGovernanceLevel === "RED",
      "RED governance floor retained into selection",
    );

    const { request, result } = await invokeLeoIntelligenceProvider({
      question: "Fix production now.",
      route,
      selection,
    });
    check(request.governance.requiredGovernanceLevel === "RED", "request carries RED floor");
    check(request.governance.executionAllowed === false, "request executionAllowed false");
    check(governanceLevelPreserved("RED", result), "RED governance cannot be downgraded by result");
    check(result.executionClaims.deployed === false, "adapter cannot claim deployed");

    const gov = assessLeoGovernance({ actionKind: "DEPLOY_PRODUCTION" });
    check(gov.executionAllowed === false, "governance engine still blocks deploy");
  }

  // --- Null adapter shape ---
  {
    const nullAdapter = createLeoNullIntelligenceProviderAdapter("CODING_AGENT");
    check(nullAdapter.providerType === "CODING_AGENT", "null adapter declares provider type");
    check(nullAdapter.isConnected === false, "null adapter not connected");
    check(nullAdapter.supportedCapabilities.length > 0, "null adapter declares capabilities");
  }

  // --- Readiness snapshot (conversation-safe; LEO-19D connection truth) ---
  {
    const route = routeLeoIntelligence({ question: "Market research on competitors." });
    const selection = selectProviderForIntelligenceRoute(route);
    const snap = leoIntelligenceInvocationReadinessSnapshot({ selection });
    check(typeof snap.typeRegistered === "boolean", "readiness typeRegistered present");
    check(typeof snap.adapterImplemented === "boolean", "readiness adapterImplemented present");
    check(typeof snap.configPresent === "boolean", "readiness configPresent present");
    check(typeof snap.runtimeAvailable === "boolean", "readiness runtimeAvailable present");
    check(snap.connected === snap.runtimeAvailable, "connected mirrors runtimeAvailable");
    check(snap.invocationPossible === (snap.runtimeAvailable && selection.selectedProviderType === "REASONING_MODEL"), "invocationPossible follows config truth");
    check(snap.executionAllowed === false, "readiness executionAllowed false");
  }

  // --- No duplicate systems ---
  check(!exists("app/leo/_lib/leoIntelligenceReceiptSystem.ts"), "no duplicate receipt system");
  check(!exists("app/leo/_lib/leoIntelligenceReportingEngine.ts"), "no duplicate reporting system");
  check(exists("app/leo/_lib/leoToolReceiptService.ts"), "existing receipt system preserved");
  check(exists("app/leo/_lib/leoExecutiveReportingService.ts"), "existing reporting system preserved");

  // --- Conversation integration ---
  {
    const convSrc = src("app/leo/_lib/leoConversationService.ts");
    check(convSrc.includes("invocationReadiness"), "conversation includes invocation readiness");
    check(!convSrc.includes("invokeLeoIntelligenceProvider"), "conversation does not live-invoke providers");
  }

  // --- Request builder exposure hard-lock ---
  {
    const route = routeLeoIntelligence({ question: "Strategy tradeoffs." });
    const selection = selectProviderForIntelligenceRoute(route);
    const req = buildLeoIntelligenceInvocationRequest({
      question: "Strategy tradeoffs.",
      route,
      selection,
      exposureOverrides: {
        includeFullMemory: true as unknown as false,
        includeFullConversationHistory: true as unknown as false,
        maxContextChars: 999999,
      },
    });
    check(req.exposure.includeFullMemory === false, "override cannot enable full memory");
    check(req.exposure.includeFullConversationHistory === false, "override cannot enable full history");
    check(req.exposure.maxContextChars <= 4000, "context chars remain bounded");
  }

  // --- Regressions ---
  console.log("--- LEO-19A regression ---");
  try {
    execSync("npx tsx scripts/verify-leo-19a-intelligence-router.ts", {
      cwd: ROOT,
      stdio: "inherit",
      encoding: "utf8",
    });
    check(true, "LEO-19A verifier passes");
  } catch {
    check(false, "LEO-19A verifier passes");
  }

  console.log("--- LEO-19B regression ---");
  try {
    execSync("npx tsx scripts/verify-leo-19b-provider-selection.ts", {
      cwd: ROOT,
      stdio: "inherit",
      encoding: "utf8",
    });
    check(true, "LEO-19B verifier passes");
  } catch {
    check(false, "LEO-19B verifier passes");
  }

  console.log("");
  if (failures > 0) {
    console.error(`LEO-19C verifier FAILED with ${failures} failure(s).`);
    process.exit(1);
  }
  console.log("LEO-19C verifier PASSED.");
  process.exit(0);
}

void main();
