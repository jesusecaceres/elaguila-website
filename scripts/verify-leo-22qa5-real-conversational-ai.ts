/**
 * LEO-22QA.5 — Real conversational AI completion (source + fixture contract).
 *
 *   npx tsx scripts/verify-leo-22qa5-real-conversational-ai.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { isLeoAiIntentEligible, LEO_AI_POLICY_NOTES } from "../app/leo/_lib/leoAiBounds";
import { buildLeoAiSystemPromptFromEnvelope } from "../app/leo/_lib/leoAiPromptBuilders";
import { validateLeoAiReasonedAnswer } from "../app/leo/_lib/leoAiValidation";
import {
  classifyLeoConversationFallback,
  LEO_GENERAL_REASONING_UNAVAILABLE_SUMMARY,
} from "../app/leo/_lib/leoConversationFallback";
import { routeLeoConversation } from "../app/leo/_lib/leoConversationRouter";
import { mapLeoAiEvidenceBundleToReasoningEnvelope } from "../app/leo/_lib/leoIntelligenceReasoningEnvelope";
import type { LeoAiEvidenceBundle } from "../app/leo/_lib/leoTypes";

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
  "app/leo/_lib/leoAiReasoningEngine.ts",
  "app/leo/_lib/leoAiPromptBuilders.ts",
  "app/leo/_lib/leoAiValidation.ts",
  "app/leo/_lib/leoReasoningModelAdapter.ts",
  "app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx",
];
for (const f of files) check(exists(f), `exists ${f}`);

const engine = src("app/leo/_lib/leoAiReasoningEngine.ts");
const panel = src("app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx");
const adapter = src("app/leo/_lib/leoReasoningModelAdapter.ts");
const persist = src("app/leo/_lib/leoConversationService.ts");
const gmail = src("app/leo/_lib/leoGoogleWorkspaceConfig.ts");

check(engine.includes("invokeLeoReasoningModelTransport"), "canonical reasoning transport");
check(engine.includes('deterministic.intent !== "GENERAL_REASONING"'), "GENERAL_REASONING is not skipped as UNKNOWN");
check(engine.includes("bundle.facts.length === 0") && engine.includes("GENERAL_REASONING"), "zero-evidence general reasoning allowed");
check(engine.includes("LEO_GENERAL_REASONING_UNAVAILABLE_SUMMARY"), "canned copy only on fallback");
check(adapter.includes("invokeLeoReasoningModelTransport") || adapter.includes("export async function invokeLeoReasoningModelTransport"), "provider-independent adapter");
check(persist.includes("boundLeoConversationTurnsForAi"), "bounded conversation history attached");
check(panel.includes('onSubmit={(text) => submit(text)}') && panel.includes('fetch("/api/leo/conversation"'), "Hands-Free and typed share submit path");
check(gmail.includes('v.trim().toLowerCase() === "true"'), "Gmail write flag unchanged");

const greeting = routeLeoConversation({ question: "Good morning Coach, how are you doing today?" });
check(greeting.intent === "GENERAL_REASONING", "A: greeting routes GENERAL_REASONING");
check(isLeoAiIntentEligible("GENERAL_REASONING"), "A: GENERAL_REASONING is AI eligible");

const launch = routeLeoConversation({
  question: "Help me think through whether October 2 is a good magazine launch date.",
});
check(
  launch.intent === "GENERAL_REASONING" || launch.intent === "DECISION_SUPPORT",
  "B: launch-date thinking is GENERAL_REASONING or DECISION_SUPPORT",
);

check(
  classifyLeoConversationFallback("What is my current Stripe balance?") === "COMPANY_FACT_REQUIRES_EVIDENCE",
  "C: stripe balance is company-fact",
);
check(
  routeLeoConversation({ question: "What is my current Stripe balance?" }).intent === "UNKNOWN",
  "C: ungrounded AI fact answer not allowed",
);

const emptyBundle: LeoAiEvidenceBundle = {
  correlationKey: "fixture-general",
  intent: "GENERAL_REASONING",
  question: "Good morning Coach, how are you doing today?",
  facts: [],
  unknowns: [],
  limitations: [],
  governanceLevel: "GREEN",
  governanceSummary: "GREEN",
  approvalRequired: false,
  executionAllowed: false,
  preparationAllowed: false,
  listingReasonUnknown: false,
  consequentialDecision: false,
  preparedStatus: null,
  externalUntrustedNotes: [],
  policyNotes: LEO_AI_POLICY_NOTES,
  recentConversationTurns: [],
};

const greetingJson = {
  summary:
    "Good morning, Coach. I'm here and ready — want to walk the day, or should we pressure-test that October launch?",
  keyPoints: [
    { kind: "SYNTHESIS", text: "Greeting acknowledged; offer to plan the day or the launch.", evidenceIds: [] },
  ],
  evidenceReferences: [],
  unknowns: [],
  limitations: [],
  challengePoints: [],
  governanceExplanation: null,
  preparationDraft: null,
  answerConfidenceState: "PARTIALLY_GROUNDED",
};

const validated = validateLeoAiReasonedAnswer(emptyBundle, greetingJson, "GREEN");
check(validated.ok === true, "D: zero-evidence conversational JSON survives validation");
check(
  validated.ok &&
    validated.reasoned.summary.includes("Good morning") &&
    !validated.reasoned.summary.includes("I'll reason in general terms"),
  "D: successful model summary is the owner-facing reply",
);

const invented = validateLeoAiReasonedAnswer(
  emptyBundle,
  {
    ...greetingJson,
    summary: "Your current Stripe balance is $48,221.13.",
  },
  "GREEN",
);
check(invented.ok === false, "C/D: invented live company fact is rejected");

check(
  LEO_GENERAL_REASONING_UNAVAILABLE_SUMMARY.includes("unavailable") &&
    !LEO_GENERAL_REASONING_UNAVAILABLE_SUMMARY.includes("I'll reason in general terms"),
  "E: failed-provider fallback is honest, not canned success copy",
);

const envelope = mapLeoAiEvidenceBundleToReasoningEnvelope(emptyBundle);
const sys = buildLeoAiSystemPromptFromEnvelope(envelope);
check(sys.includes("Speak naturally") || sys.includes("speaking with Chuy"), "prompt is conversational");
check(!sys.includes("rewrite and explain ONLY the provided trusted evidence"), "general prompt is not evidence-rewrite-only");

check(
  !process.env.LEO_GMAIL_REPLY_WRITE_ENABLED ||
    process.env.LEO_GMAIL_REPLY_WRITE_ENABLED.trim().toLowerCase() !== "true",
  "write flag remains OFF",
);

const elapsedMs = Date.now() - started;
if (failures > 0) {
  console.error(`\nLEO-22QA.5 verifier FAILED (${failures}) in ${elapsedMs}ms`);
  process.exit(1);
}
console.log(`\nLEO-22QA.5 verifier PASSED in ${elapsedMs}ms`);
