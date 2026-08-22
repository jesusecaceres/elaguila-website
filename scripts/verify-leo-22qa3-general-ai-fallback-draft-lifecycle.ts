/**
 * LEO-22QA.3 — General AI fallback + composer draft lifecycle (source contract).
 *
 *   npx tsx scripts/verify-leo-22qa3-general-ai-fallback-draft-lifecycle.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { classifyLeoConversationFallback } from "../app/leo/_lib/leoConversationFallback";
import { routeLeoConversation } from "../app/leo/_lib/leoConversationRouter";
import { isLeoAiIntentEligible } from "../app/leo/_lib/leoAiBounds";
import { parseLeoComposerDraft, serializeLeoComposerDraft } from "../app/leo/_lib/leoPwaCapabilities";
import { resolveLeoPresentationIntent } from "../app/leo/_lib/leoPresentationIntent";

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

const started = Date.now();
const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
check(branch === EXPECTED_BRANCH, "correct integration branch");

const files = [
  "app/leo/_lib/leoConversationFallback.ts",
  "app/leo/_lib/leoConversationRouter.ts",
  "app/leo/_lib/leoConversationService.ts",
  "app/leo/_lib/leoAiReasoningEngine.ts",
  "app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx",
  "app/leo/_lib/leoPwaCapabilities.ts",
];
for (const f of files) check(exists(f), `exists ${f}`);

const routerSrc = src("app/leo/_lib/leoConversationRouter.ts");
const engineSrc = src("app/leo/_lib/leoAiReasoningEngine.ts");
const panelSrc = src("app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx");
const serviceSrc = src("app/leo/_lib/leoConversationService.ts");
const gmailCfg = src("app/leo/_lib/leoGoogleWorkspaceConfig.ts");

check(
  routerSrc.indexOf("classifyLeoConversationFallback") >
    routerSrc.indexOf("isLeoMemoryLookupQuestion") ||
    routerSrc.includes("general reasoning / conversation fallback"),
  "fallback runs after deterministic patterns",
);
check(routerSrc.includes("GENERAL_REASONING"), "router has GENERAL_REASONING outcome");
check(engineSrc.includes("invokeLeoReasoningModelTransport"), "existing reasoning transport used");
check(engineSrc.includes("GENERAL_REASONING"), "AI engine allows general reasoning");
check(serviceSrc.includes('intent: "GENERAL_REASONING"'), "service handles general reasoning");
check(
  !serviceSrc.includes("I do not have a supported deterministic retrieval path for this question"),
  "generic deterministic refusal is no longer the default for unmatched questions",
);
check(panelSrc.includes("leoIntentIsWorkspaceCommand"), "presentation intents evaluated client-side");
check(panelSrc.includes('fetch("/api/leo/conversation"'), "canonical conversation POST preserved");
check(panelSrc.includes("onSubmit={(text) => submit(text)}"), "Hands-Free uses same submit path");
check(panelSrc.includes("parseLeoComposerDraft") && panelSrc.includes("serializeLeoComposerDraft"), "typed draft lifecycle");
check(panelSrc.includes("writeDraft(\"\")") && panelSrc.includes("setQuestion(\"\")"), "submit/nav/new conversation clear composer/draft");
check(panelSrc.includes("retryLocalId"), "failed-turn retry preserved");
check(gmailCfg.includes('v.trim().toLowerCase() === "true"'), "Gmail write flag unchanged");
check(!panelSrc.includes("leoExecuteGovernedConnectedAction"), "no RED bypass");

check(
  routeLeoConversation({ question: "Good morning, how are you doing?" }).intent === "GENERAL_REASONING",
  "good morning routes to general reasoning",
);
check(
  routeLeoConversation({ question: "Help me think through an October magazine launch." }).intent ===
    "GENERAL_REASONING",
  "planning/reasoning routes to general reasoning",
);
check(
  classifyLeoConversationFallback("What is my current Stripe balance?") === "COMPANY_FACT_REQUIRES_EVIDENCE",
  "stripe balance is company-fact protected",
);
check(
  routeLeoConversation({ question: "What is my current Stripe balance?" }).intent === "UNKNOWN",
  "company fact does not use general fallback",
);
check(
  routeLeoConversation({ question: "What needs my attention today?" }).intent === "ATTENTION_OVERVIEW",
  "deterministic attention routing preserved",
);
check(isLeoAiIntentEligible("GENERAL_REASONING"), "GENERAL_REASONING is AI-eligible");
check(
  resolveLeoPresentationIntent("Take me to my reports").kind === "PRESENT",
  "take me to my reports stays presentation",
);
check(
  resolveLeoPresentationIntent("Take me to Gmail").kind === "PRESENT" ||
    resolveLeoPresentationIntent("Take me to gmail").kind === "PRESENT",
  "take me to gmail stays presentation",
);
check(parseLeoComposerDraft("What needs my attention today Take me to my reports") === "", "legacy concatenated draft does not restore");
check(
  parseLeoComposerDraft(
    serializeLeoComposerDraft("unsent note", "UNSENT_DRAFT"),
  ) === "unsent note",
  "unsent draft round-trips",
);
check(parseLeoComposerDraft(serializeLeoComposerDraft("gone", "SUBMITTED_SUCCESS")) === "", "submitted draft does not restore");
check(
  !process.env.LEO_GMAIL_REPLY_WRITE_ENABLED ||
    process.env.LEO_GMAIL_REPLY_WRITE_ENABLED.trim().toLowerCase() !== "true",
  "write flag remains OFF",
);

const elapsedMs = Date.now() - started;
if (failures > 0) {
  console.error(`\nLEO-22QA.3 verifier FAILED (${failures}) in ${elapsedMs}ms`);
  process.exit(1);
}
console.log(`\nLEO-22QA.3 verifier PASSED in ${elapsedMs}ms`);
