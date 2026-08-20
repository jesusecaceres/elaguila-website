/**
 * LEO-19D — REASONING_MODEL transport-only adapter.
 *
 * Translates provider-neutral envelope → existing callLeoAiProvider.
 * Does NOT own governance, validation, fallback, or final answers.
 */
import "server-only";

import { isLeoAiConfigured } from "@/app/leo/_lib/leoAiConfig";
import { callLeoAiProvider } from "@/app/leo/_lib/leoAiProvider";
import {
  buildLeoAiSystemPromptFromEnvelope,
  buildLeoAiUserPayloadFromEnvelope,
} from "@/app/leo/_lib/leoAiPromptBuilders";
import {
  buildFailClosedInvocationResult,
  LEO_19C_ADAPTER_NOT_CLAIMING,
  LEO_EMPTY_EXECUTION_CLAIMS,
  type LeoIntelligenceInvocationRequest,
  type LeoIntelligenceInvocationResult,
  type LeoIntelligenceProviderAdapter,
} from "@/app/leo/_lib/leoIntelligenceProviderAdapter";
import type { LeoIntelligenceCapability } from "@/app/leo/_lib/leoIntelligenceRouter";

const REASONING_CAPABILITIES: readonly LeoIntelligenceCapability[] = [
  "EXECUTIVE_REASONING",
  "ENGINEERING_REASONING",
  "CREATIVE_REASONING",
  "RESEARCH_REASONING",
  "DATA_ANALYSIS",
];

function mapTransportError(
  error: string,
): LeoIntelligenceInvocationResult["failureCategory"] {
  if (error === "provider_unconfigured") return "NOT_CONNECTED";
  if (error === "provider_timeout") return "TIMEOUT";
  if (error === "empty_provider_response") return "PROVIDER_ERROR";
  return "PROVIDER_ERROR";
}

export const leoReasoningModelAdapter: LeoIntelligenceProviderAdapter = {
  providerType: "REASONING_MODEL",
  supportedCapabilities: REASONING_CAPABILITIES,
  get isConnected() {
    return isLeoAiConfigured();
  },
  canHandle(request: LeoIntelligenceInvocationRequest): boolean {
    return (
      request.selectedProviderType === "REASONING_MODEL" &&
      request.reasoningEnvelope != null &&
      request.reasoningEnvelope.requiredOutputSchema === "LEO_AI_REASONED_ANSWER_V1"
    );
  },
  async invoke(
    request: LeoIntelligenceInvocationRequest,
  ): Promise<LeoIntelligenceInvocationResult> {
    const envelope = request.reasoningEnvelope ?? null;
    if (!envelope) {
      return buildFailClosedInvocationResult({
        status: "INVALID_REQUEST",
        providerType: "REASONING_MODEL",
        capability: request.requestedCapability,
        correlationId: request.correlationId,
        summary: "REASONING_MODEL adapter requires a reasoningEnvelope.",
      });
    }

    if (!isLeoAiConfigured()) {
      return buildFailClosedInvocationResult({
        status: "NOT_CONNECTED",
        providerType: "REASONING_MODEL",
        capability: request.requestedCapability,
        correlationId: request.correlationId,
        summary: "REASONING_MODEL config not present — transport not available.",
      });
    }

    // Governance firewall: adapter never grants execution.
    if (request.governance.executionAllowed !== false) {
      return buildFailClosedInvocationResult({
        status: "GOVERNANCE_BLOCKED",
        providerType: "REASONING_MODEL",
        capability: request.requestedCapability,
        correlationId: request.correlationId,
        summary: "Adapter refused — executionAllowed must remain false.",
      });
    }

    const systemPrompt = buildLeoAiSystemPromptFromEnvelope(envelope);
    const userPayload = buildLeoAiUserPayloadFromEnvelope(envelope);
    const provider = await callLeoAiProvider({ systemPrompt, userPayload });

    if (!provider.ok) {
      const failure = mapTransportError(provider.error);
      return buildFailClosedInvocationResult({
        status: failure ?? "PROVIDER_ERROR",
        providerType: "REASONING_MODEL",
        capability: request.requestedCapability,
        correlationId: request.correlationId,
        summary: `Provider transport failed (${provider.error}).`,
        limitations: [
          "Transport-only adapter — LEO retains validation and fallback.",
          ...LEO_19C_ADAPTER_NOT_CLAIMING.slice(0, 2),
        ],
      });
    }

    return {
      status: "OK",
      failureCategory: null,
      providerType: "REASONING_MODEL",
      capability: request.requestedCapability,
      summary: null,
      structuredOutput: {
        rawJsonText: provider.text,
        model: provider.model,
        requiredOutputSchema: envelope.requiredOutputSchema,
      },
      evidenceReferences: [...envelope.evidenceIds],
      limitations: [
        "Transport succeeded — LEO must validate before treating as truth.",
        "Provider output does not grant authority.",
      ],
      confidence: "NONE",
      warnings: [],
      usagePlaceholder: {
        inputUnits: null,
        outputUnits: null,
        note: "Usage metering not recorded in this gate.",
      },
      errorClassification: null,
      executionClaims: { ...LEO_EMPTY_EXECUTION_CLAIMS },
      externalSideEffects: false,
      verificationState: "NOT_VERIFIED",
      observability: {
        correlationId: request.correlationId,
        receiptCompatible: true,
        receiptCreated: false,
        reportingCompatible: true,
        reportEmitted: false,
      },
      notClaiming: LEO_19C_ADAPTER_NOT_CLAIMING,
    };
  },
};

/**
 * Thin transport entry for the reasoning engine (architecture C).
 * Builds a minimal invocation request and calls the REASONING_MODEL adapter once.
 */
export async function invokeLeoReasoningModelTransport(input: {
  envelope: NonNullable<LeoIntelligenceInvocationRequest["reasoningEnvelope"]>;
  requestedCapability?: LeoIntelligenceCapability;
  correlationId?: string | null;
  requestId?: string | null;
}): Promise<LeoIntelligenceInvocationResult> {
  const correlationId =
    input.correlationId?.trim() ||
    `corr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const requestId =
    input.requestId?.trim() ||
    `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const request: LeoIntelligenceInvocationRequest = {
    requestId,
    correlationId,
    requestedCapability: input.requestedCapability ?? "EXECUTIVE_REASONING",
    selectedProviderType: "REASONING_MODEL",
    task: input.envelope.question,
    boundedExecutiveContextSummary: null,
    governance: {
      requiredGovernanceLevel: input.envelope.governanceLevel ?? "GREEN",
      capabilityIsNotAuthority: true,
      selectionDoesNotGrantExecution: true,
      executionAllowed: false,
      blockedOperations: [
        "EXECUTE_PROVIDER_WRITE",
        "DEPLOY_PRODUCTION",
        "BYPASS_GOVERNANCE",
        "SEND_EXTERNAL",
        "MUTATE_CALENDAR",
        "SELECT_VENDOR_AUTONOMOUSLY",
        "CALL_EXTERNAL_MODEL",
      ],
      allowedOperationClass: "DRAFT",
    },
    allowedActions: ["ANALYZE", "SUMMARIZE", "COMPARE", "DRAFT_RECOMMENDATION", "REQUEST_CLARIFICATION"],
    blockedActions: [
      "EXECUTE_PROVIDER_WRITE",
      "DEPLOY_PRODUCTION",
      "BYPASS_GOVERNANCE",
      "SEND_EXTERNAL",
      "MUTATE_CALENDAR",
      "SELECT_VENDOR_AUTONOMOUSLY",
      "CALL_EXTERNAL_MODEL",
    ],
    requestedOutputShape: "STRUCTURED_JSON",
    evidenceRequirements: [
      "Do not invent evidence",
      "Do not claim external side effects",
      "Provider output does not grant authority",
    ],
    exposure: {
      includeExecutiveContextSummary: true,
      includeResolvedEntityLabels: true,
      includeFocusRefs: true,
      includeFullMemory: false,
      includeFullConversationHistory: false,
      includeFullExternalCorpora: false,
      maxContextChars: 4000,
      notes: ["Minimum necessary context only."],
    },
    timeoutHintMs: null,
    reasoningEnvelope: input.envelope,
    notClaiming: LEO_19C_ADAPTER_NOT_CLAIMING,
  };

  return leoReasoningModelAdapter.invoke(request);
}

/** Runtime connection truth for readiness metadata (not registry catalog). */
export function getLeoReasoningModelRuntimeTruth(): {
  providerType: "REASONING_MODEL";
  typeRegistered: true;
  adapterImplemented: true;
  configPresent: boolean;
  runtimeAvailable: boolean;
} {
  const configPresent = isLeoAiConfigured();
  return {
    providerType: "REASONING_MODEL",
    typeRegistered: true,
    adapterImplemented: true,
    configPresent,
    runtimeAvailable: configPresent,
  };
}
