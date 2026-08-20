/**
 * LEO-10 / LEO-19D constrained executive reasoning engine.
 * At most one provider call. Validates structured output. Falls back on failure.
 *
 * Architecture C: orchestrator owns evidence / validation / fallback.
 * Transport goes through REASONING_MODEL adapter (invokeLeoReasoningModelTransport).
 */
import "server-only";

import { isLeoAiIntentEligible, LEO_AI_BOUNDS } from "@/app/leo/_lib/leoAiBounds";
import { isLeoAiConfigured } from "@/app/leo/_lib/leoAiConfig";
import { buildLeoAiEvidenceBundle } from "@/app/leo/_lib/leoAiEvidenceBundle";
import { mapLeoAiEvidenceBundleToReasoningEnvelope } from "@/app/leo/_lib/leoIntelligenceReasoningEnvelope";
import { invokeLeoReasoningModelTransport } from "@/app/leo/_lib/leoReasoningModelAdapter";
import { validateLeoAiReasonedAnswer } from "@/app/leo/_lib/leoAiValidation";
import type {
  LeoAiAnswerMeta,
  LeoAiEvidenceBundle,
  LeoAiFallbackReason,
  LeoAiReasonedAnswer,
  LeoConversationAnswer,
  LeoConversationRequest,
} from "@/app/leo/_lib/leoTypes";

const OWNER_PRAYER =
  "Chuy, go pray about it. Hard work. God first. Que ruja el León. 🦁";

const QUIET_FALLBACK_NOTE = "LEO answered directly from Leonix evidence.";

function withMeta(
  answer: LeoConversationAnswer,
  meta: LeoAiAnswerMeta,
): LeoConversationAnswer {
  return {
    ...answer,
    aiMeta: meta,
    keyPoints: answer.keyPoints ?? null,
    challengePoints: answer.challengePoints ?? null,
  };
}

function applyReasoned(
  deterministic: LeoConversationAnswer,
  reasoned: LeoAiReasonedAnswer,
  bundle: LeoAiEvidenceBundle,
): LeoConversationAnswer {
  let summary = reasoned.summary;
  if (bundle.consequentialDecision && reasoned.keyPoints.some((k) => k.kind === "RECOMMENDATION")) {
    if (!summary.includes("Que ruja el León")) {
      summary = `${summary.trim()}\n\n${OWNER_PRAYER}`;
    }
  }

  const limitations = [
    ...new Set([...deterministic.limitations, ...reasoned.limitations]),
  ].slice(0, LEO_AI_BOUNDS.maxLimitations + 4);

  const unknowns = [...new Set([...deterministic.unknowns, ...reasoned.unknowns])].slice(
    0,
    LEO_AI_BOUNDS.maxUnknowns + 4,
  );

  let preparedAction = deterministic.preparedAction;
  if (preparedAction && reasoned.preparationDraft) {
    preparedAction = {
      ...preparedAction,
      draftBody: reasoned.preparationDraft,
      status: "NOT_EXECUTED",
      executionAllowed: false,
    };
  }

  return withMeta(
    {
      ...deterministic,
      summary,
      unknowns,
      limitations,
      keyPoints: reasoned.keyPoints,
      challengePoints: reasoned.challengePoints.length
        ? reasoned.challengePoints
        : reasoned.keyPoints.filter((k) => k.kind === "CHALLENGE").map((k) => k.text),
      preparedAction,
      governance: deterministic.governance,
    },
    {
      reasoningMode: "AI",
      aiUsed: true,
      providerAvailable: true,
      providerSucceeded: true,
      fallbackUsed: false,
      fallbackReason: null,
      evidenceCount: bundle.facts.length,
      intent: deterministic.intent,
      governanceLevel: deterministic.governance?.level ?? null,
      groundingState: reasoned.answerConfidenceState,
    },
  );
}

function mapInvocationFailure(
  status: string | null | undefined,
): LeoAiFallbackReason {
  if (status === "NOT_CONNECTED" || status === "NO_PROVIDER") return "PROVIDER_NOT_CONFIGURED";
  if (status === "TIMEOUT") return "PROVIDER_TIMEOUT";
  return "PROVIDER_ERROR";
}

/**
 * Attempt constrained synthesis. On any failure, return deterministic answer with meta.
 * Never throws for provider issues. Never leaks secrets or raw provider bodies.
 * Exactly one transport call maximum per eligible owner query (via REASONING_MODEL adapter).
 */
export async function enrichLeoConversationWithAi(args: {
  request: LeoConversationRequest;
  deterministic: LeoConversationAnswer;
}): Promise<LeoConversationAnswer> {
  const { request, deterministic } = args;
  const providerAvailable = isLeoAiConfigured();

  const baseMeta = (partial: Partial<LeoAiAnswerMeta>): LeoAiAnswerMeta => ({
    reasoningMode: "DETERMINISTIC",
    aiUsed: false,
    providerAvailable,
    providerSucceeded: false,
    fallbackUsed: true,
    fallbackReason: "INTENT_NOT_AI_ELIGIBLE",
    evidenceCount: deterministic.evidence.length,
    intent: deterministic.intent,
    governanceLevel: deterministic.governance?.level ?? null,
    groundingState: "AI_SKIPPED",
    ...partial,
  });

  if (deterministic.intent === "UNKNOWN" || deterministic.answerState === "UNSUPPORTED_INTENT") {
    return withMeta(
      deterministic,
      baseMeta({
        fallbackUsed: false,
        fallbackReason: "INTENT_NOT_AI_ELIGIBLE",
        groundingState: "AI_SKIPPED",
      }),
    );
  }

  if (!isLeoAiIntentEligible(deterministic.intent)) {
    return withMeta(
      deterministic,
      baseMeta({
        fallbackUsed: false,
        fallbackReason: "INTENT_NOT_AI_ELIGIBLE",
        groundingState: "AI_SKIPPED",
      }),
    );
  }

  if (!providerAvailable) {
    return withMeta(
      {
        ...deterministic,
        limitations: [...deterministic.limitations, QUIET_FALLBACK_NOTE],
      },
      baseMeta({
        groundingState: "AI_UNAVAILABLE",
        fallbackReason: "PROVIDER_NOT_CONFIGURED",
      }),
    );
  }

  const bundle = buildLeoAiEvidenceBundle({ request, answer: deterministic });
  if (
    bundle.facts.length === 0 &&
    deterministic.intent !== "CAPABILITY_GOVERNANCE" &&
    deterministic.intent !== "CAPABILITY_OVERVIEW" &&
    deterministic.intent !== "PROJECT_INTELLIGENCE"
  ) {
    return withMeta(
      deterministic,
      baseMeta({
        groundingState: "INSUFFICIENT_EVIDENCE",
        evidenceCount: 0,
        fallbackReason: "INSUFFICIENT_EVIDENCE",
      }),
    );
  }

  const envelope = mapLeoAiEvidenceBundleToReasoningEnvelope(bundle);
  const invocation = await invokeLeoReasoningModelTransport({
    envelope,
    correlationId: bundle.correlationKey,
  });

  if (invocation.status !== "OK") {
    return withMeta(
      {
        ...deterministic,
        limitations: [...deterministic.limitations, QUIET_FALLBACK_NOTE],
      },
      baseMeta({
        groundingState: "AI_UNAVAILABLE",
        evidenceCount: bundle.facts.length,
        fallbackReason: mapInvocationFailure(invocation.failureCategory ?? invocation.status),
      }),
    );
  }

  const rawText =
    typeof invocation.structuredOutput?.rawJsonText === "string"
      ? invocation.structuredOutput.rawJsonText
      : null;

  if (!rawText) {
    return withMeta(
      {
        ...deterministic,
        limitations: [...deterministic.limitations, QUIET_FALLBACK_NOTE],
      },
      baseMeta({
        groundingState: "AI_REJECTED",
        evidenceCount: bundle.facts.length,
        fallbackReason: "INVALID_MODEL_OUTPUT",
      }),
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return withMeta(
      {
        ...deterministic,
        limitations: [...deterministic.limitations, QUIET_FALLBACK_NOTE],
      },
      baseMeta({
        groundingState: "AI_REJECTED",
        evidenceCount: bundle.facts.length,
        fallbackReason: "INVALID_MODEL_OUTPUT",
      }),
    );
  }

  const validated = validateLeoAiReasonedAnswer(
    bundle,
    parsed,
    deterministic.governance?.level ?? null,
  );

  if (!validated.ok) {
    return withMeta(
      {
        ...deterministic,
        limitations: [...deterministic.limitations, QUIET_FALLBACK_NOTE],
      },
      baseMeta({
        groundingState: "AI_REJECTED",
        evidenceCount: bundle.facts.length,
        fallbackReason:
          validated.reason === "invalid_shape" || validated.reason === "summary_invalid"
            ? "INVALID_MODEL_OUTPUT"
            : "GROUNDING_VALIDATION_FAILED",
      }),
    );
  }

  return applyReasoned(deterministic, validated.reasoned, bundle);
}

/** Test helper — run validation path without provider. */
export function leoAiValidateFixture(
  bundle: LeoAiEvidenceBundle,
  raw: unknown,
): ReturnType<typeof validateLeoAiReasonedAnswer> {
  return validateLeoAiReasonedAnswer(bundle, raw, bundle.governanceLevel);
}
