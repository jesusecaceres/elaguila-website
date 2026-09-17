/**
 * LEO-19C/19D — Intelligence Invocation Coordinator.
 *
 * Receives router + selection → builds bounded request → locates adapter →
 * enforces type/governance → invokes adapter.
 *
 * LEO-19D: REASONING_MODEL resolves to leoReasoningModelAdapter when config present.
 * Conversation AI entry remains enrichLeoConversationWithAi (architecture C) —
 * this service does not create a second synthesis path for conversation.
 *
 * No fake receipts. Fail closed.
 */
import type { LeoGovernanceLevel } from "@/app/leo/_lib/leoTypes";
import type {
  LeoIntelligenceAllowedAction,
  LeoIntelligenceBlockedAction,
  LeoIntelligenceRouteResult,
} from "@/app/leo/_lib/leoIntelligenceRouter";
import type { LeoIntelligenceSelectionResult } from "@/app/leo/_lib/leoIntelligenceSelectionPolicy";
import type { LeoIntelligenceProviderType } from "@/app/leo/_lib/leoIntelligenceProviderRegistry";
import type { LeoIntelligenceReasoningEnvelope } from "@/app/leo/_lib/leoIntelligenceReasoningEnvelope";
import {
  buildFailClosedInvocationResult,
  LEO_19C_ADAPTER_NOT_CLAIMING,
  LEO_DEFAULT_PROVIDER_EXPOSURE,
  type LeoIntelligenceInvocationRequest,
  type LeoIntelligenceInvocationResult,
  type LeoIntelligenceOperationClass,
  type LeoIntelligenceOutputShape,
  type LeoIntelligenceProviderAdapter,
  type LeoIntelligenceProviderExposure,
} from "@/app/leo/_lib/leoIntelligenceProviderAdapter";
import {
  createLeoNullIntelligenceProviderAdapter,
  leoNullIntelligenceProviderAdapter,
} from "@/app/leo/_lib/leoNullIntelligenceProviderAdapter";
import { isLeoAiCredentialPresent } from "@/app/leo/_lib/leoAiConfigPresence";

export type LeoIntelligenceInvocationServiceInput = {
  question: string;
  route: LeoIntelligenceRouteResult;
  selection: LeoIntelligenceSelectionResult;
  /** Optional short executive context summary — already bounded. */
  boundedExecutiveContextSummary?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  /** Optional reasoning envelope for REASONING_MODEL. */
  reasoningEnvelope?: LeoIntelligenceReasoningEnvelope | null;
  /** Inject adapters; defaults include REASONING_MODEL + null. */
  adapters?: readonly LeoIntelligenceProviderAdapter[];
  exposureOverrides?: Partial<LeoIntelligenceProviderExposure>;
};

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function operationClassForCapability(
  capability: LeoIntelligenceRouteResult["requestedCapability"],
): LeoIntelligenceOperationClass {
  switch (capability) {
    case "RESEARCH_REASONING":
      return "RESEARCH_READ";
    case "DATA_ANALYSIS":
      return "ANALYZE";
    case "UNKNOWN":
      return "CLARIFY";
    default:
      return "DRAFT";
  }
}

function outputShapeForCapability(
  capability: LeoIntelligenceRouteResult["requestedCapability"],
): LeoIntelligenceOutputShape {
  if (capability === "UNKNOWN") return "NONE";
  if (capability === "DATA_ANALYSIS") return "STRUCTURED_JSON";
  return "TEXT_SUMMARY";
}

function boundTask(question: string, max = 2000): string {
  const t = question.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function boundSummary(s: string | null | undefined, max = 800): string | null {
  if (!s) return null;
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Config truth without importing the live adapter (keeps offline verifiers free of server-only). */
function reasoningModelConfigPresent(): boolean {
  return isLeoAiCredentialPresent();
}

async function loadLeoReasoningModelAdapter(): Promise<LeoIntelligenceProviderAdapter> {
  const mod = await import("@/app/leo/_lib/leoReasoningModelAdapter");
  return mod.leoReasoningModelAdapter;
}

/**
 * Build normalized invocation request from router + selection.
 * Enforces minimum-necessary context exposure.
 */
export function buildLeoIntelligenceInvocationRequest(input: {
  question: string;
  route: LeoIntelligenceRouteResult;
  selection: LeoIntelligenceSelectionResult;
  boundedExecutiveContextSummary?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  reasoningEnvelope?: LeoIntelligenceReasoningEnvelope | null;
  exposureOverrides?: Partial<LeoIntelligenceProviderExposure>;
}): LeoIntelligenceInvocationRequest {
  const exposure: LeoIntelligenceProviderExposure = {
    ...LEO_DEFAULT_PROVIDER_EXPOSURE,
    ...input.exposureOverrides,
    // Hard locks — never allow full dumps via override.
    includeFullMemory: false,
    includeFullConversationHistory: false,
    includeFullExternalCorpora: false,
    maxContextChars: Math.min(
      input.exposureOverrides?.maxContextChars ?? LEO_DEFAULT_PROVIDER_EXPOSURE.maxContextChars,
      LEO_DEFAULT_PROVIDER_EXPOSURE.maxContextChars,
    ),
  };

  const governanceLevel: LeoGovernanceLevel =
    input.selection.governanceConstraints.requiredGovernanceLevel ??
    input.route.requiredGovernanceLevel;

  return {
    requestId: input.requestId?.trim() || newId("inv"),
    correlationId: input.correlationId?.trim() || newId("corr"),
    requestedCapability: input.route.requestedCapability,
    selectedProviderType: input.selection.selectedProviderType,
    task: boundTask(input.question),
    boundedExecutiveContextSummary: exposure.includeExecutiveContextSummary
      ? boundSummary(input.boundedExecutiveContextSummary, exposure.maxContextChars)
      : null,
    governance: {
      requiredGovernanceLevel: governanceLevel,
      capabilityIsNotAuthority: true,
      selectionDoesNotGrantExecution: true,
      executionAllowed: false,
      blockedOperations: input.route.blockedActions,
      allowedOperationClass: operationClassForCapability(input.route.requestedCapability),
    },
    allowedActions: input.route.allowedActions as readonly LeoIntelligenceAllowedAction[],
    blockedActions: input.route.blockedActions as readonly LeoIntelligenceBlockedAction[],
    requestedOutputShape: outputShapeForCapability(input.route.requestedCapability),
    evidenceRequirements: [
      "Do not invent evidence",
      "Do not claim external side effects",
      "Provider output does not grant authority",
    ],
    exposure,
    timeoutHintMs: null,
    reasoningEnvelope: input.reasoningEnvelope ?? null,
    notClaiming: LEO_19C_ADAPTER_NOT_CLAIMING,
  };
}

function defaultAdaptersFor(
  selected: LeoIntelligenceProviderType,
): LeoIntelligenceProviderAdapter[] {
  // Live REASONING_MODEL adapter is resolved asynchronously in invoke when envelope+config present.
  if (selected === "REASONING_MODEL") {
    return [createLeoNullIntelligenceProviderAdapter("REASONING_MODEL")];
  }
  if (selected === "NONE") {
    return [leoNullIntelligenceProviderAdapter];
  }
  return [createLeoNullIntelligenceProviderAdapter(selected)];
}

function resolveAdapter(
  selected: LeoIntelligenceProviderType,
  adapters: readonly LeoIntelligenceProviderAdapter[],
): LeoIntelligenceProviderAdapter {
  const connected = adapters.find(
    (a) => a.providerType === selected && a.isConnected && a.supportedCapabilities.length > 0,
  );
  if (connected) return connected;

  const offlineForType = adapters.find((a) => a.providerType === selected && !a.isConnected);
  if (offlineForType) return offlineForType;

  if (selected === "NONE") return leoNullIntelligenceProviderAdapter;
  return createLeoNullIntelligenceProviderAdapter(selected);
}

function enforceGovernanceFirewall(
  request: LeoIntelligenceInvocationRequest,
  result: LeoIntelligenceInvocationResult,
): LeoIntelligenceInvocationResult {
  // RED/NEVER cannot be downgraded — adapters have no governance mutation field.
  // Strip any accidental execution claims / side effects.
  const level = request.governance.requiredGovernanceLevel;
  const limitations = [...result.limitations];
  if (level === "RED" || level === "NEVER") {
    limitations.push(
      `Governance floor ${level} preserved — provider output cannot authorize execution.`,
    );
  }
  if (result.externalSideEffects !== false) {
    return buildFailClosedInvocationResult({
      status: "NORMALIZATION_ERROR",
      providerType: result.providerType,
      capability: result.capability,
      correlationId: request.correlationId,
      summary: "Adapter attempted to claim external side effects — rejected.",
    });
  }

  // Ensure executionClaims stay false.
  return {
    ...result,
    executionClaims: {
      sent: false,
      deployed: false,
      scheduled: false,
      published: false,
      modified: false,
      paid: false,
      deleted: false,
      completedExternally: false,
    },
    externalSideEffects: false,
    limitations,
    observability: {
      ...result.observability,
      correlationId: request.correlationId,
      receiptCompatible: true,
      receiptCreated: false,
      reportingCompatible: true,
      reportEmitted: false,
    },
  };
}

/**
 * Invoke intelligence provider through the universal adapter seam.
 * REASONING_MODEL uses live transport adapter when config present; otherwise null.
 * Conversation synthesis still enters only via enrichLeoConversationWithAi.
 */
export async function invokeLeoIntelligenceProvider(
  input: LeoIntelligenceInvocationServiceInput,
): Promise<{
  request: LeoIntelligenceInvocationRequest;
  result: LeoIntelligenceInvocationResult;
  adapterUsed: { providerType: LeoIntelligenceProviderType; isConnected: boolean };
}> {
  const request = buildLeoIntelligenceInvocationRequest(input);

  // Invalid request guards
  if (!request.task.trim()) {
    const result = buildFailClosedInvocationResult({
      status: "INVALID_REQUEST",
      providerType: request.selectedProviderType,
      capability: request.requestedCapability,
      correlationId: request.correlationId,
      summary: "Invocation request task is empty.",
    });
    return {
      request,
      result,
      adapterUsed: { providerType: request.selectedProviderType, isConnected: false },
    };
  }

  // Capability mismatch vs selection
  if (input.selection.requestedCapability !== input.route.requestedCapability) {
    const result = buildFailClosedInvocationResult({
      status: "CAPABILITY_MISMATCH",
      providerType: request.selectedProviderType,
      capability: request.requestedCapability,
      correlationId: request.correlationId,
      summary: "Route capability and selection capability disagree.",
    });
    return {
      request,
      result,
      adapterUsed: { providerType: request.selectedProviderType, isConnected: false },
    };
  }

  // Live REASONING_MODEL requires envelope + config. Without either → offline/null.
  if (
    request.selectedProviderType === "REASONING_MODEL" &&
    request.reasoningEnvelope &&
    reasoningModelConfigPresent()
  ) {
    const reasoningAdapter =
      input.adapters?.find((a) => a.providerType === "REASONING_MODEL" && a.isConnected) ??
      (await loadLeoReasoningModelAdapter());

    if (!reasoningAdapter.canHandle(request)) {
      const result = buildFailClosedInvocationResult({
        status: "INVALID_REQUEST",
        providerType: request.selectedProviderType,
        capability: request.requestedCapability,
        correlationId: request.correlationId,
        summary: "REASONING_MODEL adapter rejected request (envelope/schema).",
      });
      return {
        request,
        result,
        adapterUsed: {
          providerType: reasoningAdapter.providerType,
          isConnected: reasoningAdapter.isConnected,
        },
      };
    }

    const raw = await reasoningAdapter.invoke(request);
    const result = enforceGovernanceFirewall(request, raw);
    return {
      request,
      result,
      adapterUsed: {
        providerType: reasoningAdapter.providerType,
        isConnected: reasoningAdapter.isConnected,
      },
    };
  }

  const adapters = input.adapters?.length
    ? input.adapters
    : defaultAdaptersFor(request.selectedProviderType);

  const adapter =
    request.selectedProviderType === "REASONING_MODEL"
      ? createLeoNullIntelligenceProviderAdapter("REASONING_MODEL")
      : resolveAdapter(request.selectedProviderType, adapters);

  // Type compatibility
  if (
    adapter.providerType !== request.selectedProviderType &&
    request.selectedProviderType !== "NONE" &&
    adapter.providerType !== "NONE"
  ) {
    const result = buildFailClosedInvocationResult({
      status: "CAPABILITY_MISMATCH",
      providerType: request.selectedProviderType,
      capability: request.requestedCapability,
      correlationId: request.correlationId,
      summary: "Adapter provider type does not match selection.",
    });
    return {
      request,
      result,
      adapterUsed: { providerType: adapter.providerType, isConnected: adapter.isConnected },
    };
  }

  if (!adapter.canHandle(request)) {
    const result = buildFailClosedInvocationResult({
      status:
        request.selectedProviderType === "REASONING_MODEL" && !request.reasoningEnvelope
          ? "INVALID_REQUEST"
          : "PROVIDER_UNAVAILABLE",
      providerType: request.selectedProviderType,
      capability: request.requestedCapability,
      correlationId: request.correlationId,
      summary:
        request.selectedProviderType === "REASONING_MODEL" && !request.reasoningEnvelope
          ? "REASONING_MODEL requires reasoningEnvelope."
          : "No compatible adapter canHandle this request.",
    });
    return {
      request,
      result,
      adapterUsed: { providerType: adapter.providerType, isConnected: adapter.isConnected },
    };
  }

  // Non-reasoning connected adapters remain disabled (only REASONING_MODEL is live in 19D).
  if (adapter.isConnected && adapter.providerType !== "REASONING_MODEL") {
    const result = buildFailClosedInvocationResult({
      status: "PROVIDER_UNAVAILABLE",
      providerType: request.selectedProviderType,
      capability: request.requestedCapability,
      correlationId: request.correlationId,
      summary: "Only REASONING_MODEL live transport is enabled in LEO-19D.",
    });
    return {
      request,
      result,
      adapterUsed: { providerType: adapter.providerType, isConnected: false },
    };
  }

  const raw = await adapter.invoke(request);
  const result = enforceGovernanceFirewall(request, raw);

  return {
    request,
    result,
    adapterUsed: { providerType: adapter.providerType, isConnected: adapter.isConnected },
  };
}

/** Bounded readiness snapshot for conversation metadata — no second AI invocation. */
export function leoIntelligenceInvocationReadinessSnapshot(input: {
  selection: LeoIntelligenceSelectionResult;
  result?: LeoIntelligenceInvocationResult | null;
}): Record<string, unknown> {
  const selected = input.selection.selectedProviderType;
  const configPresent = selected === "REASONING_MODEL" ? reasoningModelConfigPresent() : false;
  const adapterImplemented =
    selected === "REASONING_MODEL" || selected === "NONE" ? true : false;
  const runtimeAvailable = selected === "REASONING_MODEL" ? configPresent : false;
  const callAttempted = input.result != null;
  const callSuccess = input.result?.status === "OK";
  const validationSuccess = false; // validation owned by engine; not claimed here

  return {
    selectedProviderType: selected,
    typeRegistered: true,
    adapterImplemented,
    configPresent,
    runtimeAvailable,
    connected: runtimeAvailable,
    invocationPossible: runtimeAvailable && selected === "REASONING_MODEL",
    callAttempted,
    callSuccess,
    validationSuccess,
    status:
      input.result?.status ??
      (selected === "NONE"
        ? "NO_PROVIDER"
        : runtimeAvailable
          ? "RUNTIME_AVAILABLE"
          : "NOT_CONNECTED"),
    executionAllowed: false,
    externalSideEffects: false,
    limitation:
      selected === "NONE"
        ? "No provider selected — invocation not possible."
        : selected === "REASONING_MODEL"
          ? runtimeAvailable
            ? "REASONING_MODEL runtime available — conversation AI enters only via enrichLeoConversationWithAi."
            : "REASONING_MODEL adapter implemented but config not present — NOT_CONNECTED."
          : "Provider type selected as plan only — no live adapter in this gate.",
    receiptCreated: false,
    notClaiming: [...LEO_19C_ADAPTER_NOT_CLAIMING],
  };
}
