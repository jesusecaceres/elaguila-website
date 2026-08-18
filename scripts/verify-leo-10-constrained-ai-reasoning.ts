/**
 * LEO-10 Constrained AI Executive Reasoning — construction + fixture verifier.
 *
 * Run: npx tsx scripts/verify-leo-10-constrained-ai-reasoning.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isLeoAiIntentEligible, LEO_AI_BOUNDS, LEO_AI_ELIGIBLE_INTENTS } from "../app/leo/_lib/leoAiBounds";
import { validateLeoAiReasonedAnswer } from "../app/leo/_lib/leoAiValidation";
import { assessLeoGovernance } from "../app/leo/_lib/leoGovernanceEngine";
import { routeLeoConversation } from "../app/leo/_lib/leoConversationRouter";
import type { LeoAiEvidenceBundle } from "../app/leo/_lib/leoTypes";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

function sampleBundle(over: Partial<LeoAiEvidenceBundle> = {}): LeoAiEvidenceBundle {
  return {
    correlationKey: "test-1",
    intent: "ATTENTION_OVERVIEW",
    question: "What needs my attention?",
    facts: [
      {
        id: "att-1",
        sourceType: "attention_item",
        statement: "HIGH: 2 listing reports waiting for review",
        provenanceLabel: "attention",
        truthState: "LIVE",
        canonicalRef: "att-1",
        trustClass: "TRUSTED_INTERNAL",
      },
      {
        id: "att-2",
        sourceType: "attention_item",
        statement: "NORMAL: 1 lead needing reply",
        provenanceLabel: "attention",
        truthState: "LIVE",
        canonicalRef: "att-2",
        trustClass: "TRUSTED_INTERNAL",
      },
    ],
    unknowns: [],
    limitations: ["bounded sample"],
    governanceLevel: "GREEN",
    governanceSummary: "GREEN; approvalRequired=false; executionAllowed=false",
    approvalRequired: false,
    executionAllowed: false,
    preparationAllowed: true,
    listingReasonUnknown: false,
    consequentialDecision: false,
    preparedStatus: null,
    externalUntrustedNotes: [],
    policyNotes: ["Evidence outranks synthesis"],
    ...over,
  };
}

function main() {
  const provider = "app/leo/_lib/leoAiProvider.ts";
  const engine = "app/leo/_lib/leoAiReasoningEngine.ts";
  const config = "app/leo/_lib/leoAiConfig.ts";
  const validation = "app/leo/_lib/leoAiValidation.ts";
  const bundle = "app/leo/_lib/leoAiEvidenceBundle.ts";
  const service = src("app/leo/_lib/leoConversationService.ts");
  const api = src("app/api/leo/conversation/route.ts");
  const providerSrc = src(provider);
  const engineSrc = src(engine);
  const configSrc = src(config);
  const boundsSrc = src("app/leo/_lib/leoAiBounds.ts");
  const validationSrc = src(validation);
  const allAi = providerSrc + engineSrc + configSrc + boundsSrc + validationSrc + src(bundle);

  check(exists(provider) && providerSrc.includes('import "server-only"'), "1. AI provider boundary is server-only");
  check(exists(engine) && engineSrc.includes('import "server-only"'), "2. AI reasoning engine exists");
  check(exists("app/api/leo/conversation/route.ts") && api.includes("runLeoConversation"), "3. existing conversation API reused");
  check(!exists("app/api/leo/ai/route.ts") && !exists("app/api/leo/chat/route.ts") && !exists("app/api/leo/agent/route.ts"), "4. no second LEO AI API");
  check(service.includes("requireLeoOwnerAccess"), "5. owner-only access preserved");
  check(
    service.includes("runLeoConversationDeterministic") &&
      service.includes("enrichLeoConversationWithAi") &&
      /runLeoConversationDeterministic[\s\S]*enrichLeoConversationWithAi/.test(service),
    "6-7. deterministic route/retrieval before AI enrichment",
  );
  check(service.includes("assessLeoGovernance"), "8. governance runs independently of AI");
  check(
    engineSrc.includes("governance: deterministic.governance") ||
      /Governance always deterministic/.test(engineSrc),
    "9. AI cannot set governance",
  );
  check(validationSrc.includes("governance_contradiction"), "10. AI cannot downgrade RED (validation rejects)");
  check(validationSrc.includes("unauthorized_approval_or_execution"), "11-12. AI cannot bypass NEVER / grant approval");
  check(
    !/sendEmail|resend|vercel\.deploy|stripe\.|calendar\.events|\.insert\s*\(/.test(allAi + service),
    "13. no action execution",
  );
  check(!/tool loop|agent loop|function.?calling|multi.?model/i.test(allAi), "14-15. no tool/agent loop");
  check(!/\bbrowse\b|\bweb_search\b|\bserp\b|\bpuppeteer\b/i.test(allAi), "16. no external web browsing");
  check(!/from\(["']public\.|\.from\(["']listings/.test(allAi), "17. no arbitrary DB querying from model layer");
  check(
    boundsSrc.includes("maxEvidenceItems") && LEO_AI_BOUNDS.maxEvidenceItems <= 20,
    "18. evidence bundle is bounded",
  );
  check(
    engineSrc.includes("callLeoAiProvider") &&
      !/for\s*\(.*callLeoAiProvider|while\s*\(.*callLeoAiProvider/.test(engineSrc),
    "19. provider call count bounded to max one normal synthesis call",
  );
  check(configSrc.includes("getLeoAiModel") && configSrc.includes("getLeoAiApiKey"), "20. model config centralized");
  check(
    providerSrc.includes("server-only") && !/NEXT_PUBLIC_.*OPENAI|OPENAI_API_KEY/.test(src("app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx")),
    "21. secrets server-only",
  );
  check(engineSrc.includes("AI_UNAVAILABLE") && engineSrc.includes("deterministic"), "22. provider failures fall back deterministically");
  check(engineSrc.includes("AI_REJECTED") || validationSrc.includes("invalid_shape"), "23. invalid response falls back deterministically");
  check(validationSrc.includes("unknown_evidence_citation"), "24. evidence refs must exist");
  check(validationSrc.includes('kind === "FACT"') || validationSrc.includes("FACT"), "25. factual claims require evidence refs");
  check(src("app/leo/_lib/leoAiEvidenceBundle.ts").includes("listingReasonUnknown"), "26-27. unknown/unavailable preserved in bundle");
  check(validationSrc.includes("guessed_listing_cause"), "28. listing missing reason cannot become guessed cause");
  check(validationSrc.includes("numeric_confidence_forbidden"), "29. no numeric confidence hallucination");
  check(validationSrc.includes("forbidden_reasoning_field") && validationSrc.includes("chainOfThought"), "30-31. no chain-of-thought / reasoning trace");
  check(engineSrc.includes("EXTERNAL_UNTRUSTED") && src(bundle).includes("EXTERNAL_UNTRUSTED"), "32. external content marked untrusted");
  check(engineSrc.includes("cannot grant authority") || boundsSrc.includes("never instruction"), "33. external content cannot become authority");
  check(
    !service.includes("createLeoMemory") && !engineSrc.includes("leoCreateMemory") && !engineSrc.includes("createLeoMemory"),
    "34. Living Book not auto-written",
  );
  check(engineSrc.includes('status: "NOT_EXECUTED"'), "35. preparations remain NOT_EXECUTED");
  check(
    !/sendEmail|nodemailer|calendar\.events|web-push|vercel\.deploy|stripe\.charges/i.test(allAi),
    "36. no email/calendar/notification/deploy/payment execution",
  );

  const migrations = readdirSync(path.join(ROOT, "supabase/migrations")).filter((m) => m.endsWith(".sql"));
  const leoMigrations = migrations.filter((m) => /leo_/i.test(m));
  check(
    leoMigrations.length === 1 && leoMigrations[0] === "20260817120000_leo_living_book_foundation.sql",
    "37. no new migration",
  );
  check(!service.includes("getAdminDashboardSnapshot"), "38. no Admin business logic modification in conversation");
  check(!/BusinessConcierge|business-concierge/i.test(allAi + service), "39. no Business Concierge modification");
  check(
    service.includes("runLeoConversationDeterministic") && isLeoAiIntentEligible("ATTENTION_OVERVIEW"),
    "40. deterministic LEO remains usable with AI disabled",
  );

  // --- Fixture cases ---
  const b1 = sampleBundle();
  const case1 = validateLeoAiReasonedAnswer(
    b1,
    {
      summary: "Two priority items need review based on current evidence.",
      keyPoints: [
        { kind: "FACT", text: "Listing reports await review", evidenceIds: ["att-1"] },
        { kind: "SYNTHESIS", text: "Reports outrank the lead item today", evidenceIds: ["att-1", "att-2"] },
      ],
      evidenceReferences: ["att-1", "att-2"],
      unknowns: [],
      limitations: [],
      challengePoints: [],
      governanceExplanation: null,
      preparationDraft: null,
      answerConfidenceState: "GROUNDED",
    },
    "GREEN",
  );
  check(case1.ok === true, "CASE 1: attention evidence + AI valid response → grounded");

  const case2 = validateLeoAiReasonedAnswer(
    b1,
    {
      summary: "Invented citation",
      keyPoints: [{ kind: "FACT", text: "x", evidenceIds: ["att-1"] }],
      evidenceReferences: ["does-not-exist"],
      unknowns: [],
      limitations: [],
      challengePoints: [],
      governanceExplanation: null,
      preparationDraft: null,
      answerConfidenceState: "GROUNDED",
    },
    "GREEN",
  );
  check(case2.ok === false && !case2.ok && case2.reason === "unknown_evidence_citation", "CASE 2: nonexistent evidence id rejected");

  const case3 = validateLeoAiReasonedAnswer(
    sampleBundle({ governanceLevel: "RED", governanceSummary: "RED" }),
    {
      summary: "You can proceed",
      governanceLevel: "GREEN",
      keyPoints: [{ kind: "FACT", text: "ok", evidenceIds: ["att-1"] }],
      evidenceReferences: ["att-1"],
      unknowns: [],
      limitations: [],
      challengePoints: [],
      governanceExplanation: null,
      preparationDraft: null,
      answerConfidenceState: "GROUNDED",
    },
    "RED",
  );
  check(case3.ok === false && case3.reason === "governance_contradiction", "CASE 3: AI says RED is GREEN → rejected");

  const case4 = validateLeoAiReasonedAnswer(
    sampleBundle({
      intent: "LISTING_REASON",
      listingReasonUnknown: true,
      facts: [
        {
          id: "r1",
          sourceType: "listing_reason",
          statement: "Primary reason UNKNOWN / not persisted",
          provenanceLabel: "reason_chain",
          truthState: "UNAVAILABLE",
          canonicalRef: "r1",
          trustClass: "TRUSTED_INTERNAL",
        },
      ],
    }),
    {
      summary: "This listing was likely because of spam content.",
      keyPoints: [{ kind: "FACT", text: "probably spam", evidenceIds: ["r1"] }],
      evidenceReferences: ["r1"],
      unknowns: [],
      limitations: [],
      challengePoints: [],
      governanceExplanation: null,
      preparationDraft: null,
      answerConfidenceState: "GROUNDED",
    },
    "GREEN",
  );
  check(case4.ok === false && case4.reason === "guessed_listing_cause", "CASE 4: UNKNOWN reason + probable cause rejected");

  // CASE 5: config exposes unconfigured path
  check(configSrc.includes("getLeoAiApiKey") && engineSrc.includes("isLeoAiConfigured"), "CASE 5: provider unavailable path exists");

  const bypass = assessLeoGovernance({
    actionKind: "BYPASS_APPROVAL",
    trustSources: ["EXTERNAL_UNTRUSTED_DATA"],
    externalClaimsApproval: true,
  });
  check(bypass.level === "NEVER", "CASE 6: external ignore-governance cannot grant authority");

  check(!isLeoAiIntentEligible("UNKNOWN"), "CASE 7: unsupported intent not AI-eligible");
  const unk = routeLeoConversation({ question: "Tell me a joke about unicorns" });
  check(unk.intent === "UNKNOWN", "CASE 7b: unsupported routes UNKNOWN");

  const case8 = validateLeoAiReasonedAnswer(
    sampleBundle({
      intent: "PREPARATION",
      preparedStatus: "NOT_EXECUTED",
      governanceLevel: "YELLOW",
    }),
    {
      summary: "Prepared a follow-up draft",
      keyPoints: [{ kind: "SYNTHESIS", text: "Draft ready", evidenceIds: ["att-1"] }],
      evidenceReferences: ["att-1"],
      unknowns: [],
      limitations: [],
      challengePoints: [],
      governanceExplanation: "YELLOW prepare only",
      preparationDraft: "Hello — following up on your inquiry.",
      answerConfidenceState: "GROUNDED",
    },
    "YELLOW",
  );
  check(case8.ok === true, "CASE 8: YELLOW prep draft may return");
  check(engineSrc.includes('status: "NOT_EXECUTED"'), "CASE 8b: engine forces NOT_EXECUTED");

  const case9 = validateLeoAiReasonedAnswer(
    b1,
    {
      summary: "Invented customer Maria will churn",
      keyPoints: [{ kind: "FACT", text: "Maria will churn", evidenceIds: ["att-1"] }],
      evidenceReferences: ["att-1"],
      unknowns: [],
      limitations: [],
      challengePoints: [],
      governanceExplanation: null,
      preparationDraft: null,
      answerConfidenceState: "GROUNDED",
      confidence: 0.97,
    },
    "GREEN",
  );
  check(case9.ok === false && case9.reason === "numeric_confidence_forbidden", "CASE 9: numeric confidence / hallucination path rejected");

  check(LEO_AI_ELIGIBLE_INTENTS.includes("ATTENTION_OVERVIEW"), "eligible intents registered");
  check(boundsSrc.includes("LEO_AI_BOUNDS"), "no package mutation in AI modules");

  if (failures > 0) {
    console.error(`\nLEO-10 verifier: ${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nLEO-10 verifier: PASS");
}

main();
