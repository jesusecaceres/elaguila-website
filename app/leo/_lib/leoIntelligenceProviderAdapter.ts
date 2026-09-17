/**
 * LEO-19C — Intelligence Provider Adapter Runtime Contract (offline).
 *
 * Universal seam between selection policy and future provider adapters.
 * Vendor-specific code must never leak into conversation/router core.
 *
 * No API keys. No SDKs. No HTTP. No live model invocation.
 * CAPABILITY != AUTHORITY. Adapters are workers — LEO governance is authority.
 */

import type { LeoGovernanceLevel } from "@/app/leo/_lib/leoTypes";
import type {
  LeoIntelligenceAllowedAction,
  LeoIntelligenceBlockedAction,
  LeoIntelligenceCapability,
} from "@/app/leo/_lib/leoIntelligenceRouter";
import type { LeoIntelligenceProviderType } from "@/app/leo/_lib/leoIntelligenceProviderRegistry";
import type { LeoIntelligenceReasoningEnvelope } from "@/app/leo/_lib/leoIntelligenceReasoningEnvelope";

export const LEO_INTELLIGENCE_INVOCATION_STATUSES = [
  "OK",
  "NOT_CONNECTED",
  "NO_PROVIDER",
  "UNAVAILABLE",
  "CAPABILITY_MISMATCH",
  "GOVERNANCE_BLOCKED",
  "INVALID_REQUEST",
  "PROVIDER_UNAVAILABLE",
  "TIMEOUT",
  "PROVIDER_ERROR",
  "NORMALIZATION_ERROR",
] as const;

export type LeoIntelligenceInvocationStatus =
  (typeof LEO_INTELLIGENCE_INVOCATION_STATUSES)[number];

/** Deterministic failure categories (subset of statuses that are non-OK). */
export const LEO_INTELLIGENCE_FAILURE_CATEGORIES = [
  "NO_PROVIDER",
  "NOT_CONNECTED",
  "CAPABILITY_MISMATCH",
  "GOVERNANCE_BLOCKED",
  "INVALID_REQUEST",
  "PROVIDER_UNAVAILABLE",
  "TIMEOUT",
  "PROVIDER_ERROR",
  "NORMALIZATION_ERROR",
] as const;

export type LeoIntelligenceFailureCategory =
  (typeof LEO_INTELLIGENCE_FAILURE_CATEGORIES)[number];

export type LeoIntelligenceOperationClass =
  | "ANALYZE"
  | "SUMMARIZE"
  | "COMPARE"
  | "DRAFT"
  | "RESEARCH_READ"
  | "CLARIFY";

export type LeoIntelligenceOutputShape =
  | "TEXT_SUMMARY"
  | "STRUCTURED_JSON"
  | "RECOMMENDATION_LIST"
  | "NONE";

/**
 * Minimum-necessary context exposure — never full memory / inbox / calendar dumps.
 */
export type LeoIntelligenceProviderExposure = {
  includeExecutiveContextSummary: boolean;
  includeResolvedEntityLabels: boolean;
  includeFocusRefs: boolean;
  /** Always false in this gate — no full memory dump. */
  includeFullMemory: false;
  /** Always false — no full conversation history dump. */
  includeFullConversationHistory: false;
  /** Always false — no full email/calendar/report corpora. */
  includeFullExternalCorpora: false;
  maxContextChars: number;
  notes: readonly string[];
};

export const LEO_DEFAULT_PROVIDER_EXPOSURE: LeoIntelligenceProviderExposure = {
  includeExecutiveContextSummary: true,
  includeResolvedEntityLabels: true,
  includeFocusRefs: true,
  includeFullMemory: false,
  includeFullConversationHistory: false,
  includeFullExternalCorpora: false,
  maxContextChars: 4000,
  notes: [
    "Minimum necessary context only.",
    "Full LEO memory / inbox / calendar / reports are not exposed by default.",
  ],
};

export type LeoIntelligenceGovernanceSnapshot = {
  requiredGovernanceLevel: LeoGovernanceLevel;
  capabilityIsNotAuthority: true;
  selectionDoesNotGrantExecution: true;
  executionAllowed: false;
  /** Operations the adapter must not claim authority for. */
  blockedOperations: readonly LeoIntelligenceBlockedAction[];
  allowedOperationClass: LeoIntelligenceOperationClass;
};

/**
 * Bounded normalized request for adapters.
 * No secrets, OAuth tokens, env vars, or unlimited history.
 */
export type LeoIntelligenceInvocationRequest = {
  requestId: string;
  correlationId: string;
  requestedCapability: LeoIntelligenceCapability;
  selectedProviderType: LeoIntelligenceProviderType;
  /** Bounded task text (question / outcome) — not raw DB objects. */
  task: string;
  /** Optional short executive context summary (already bounded upstream). */
  boundedExecutiveContextSummary: string | null;
  governance: LeoIntelligenceGovernanceSnapshot;
  allowedActions: readonly LeoIntelligenceAllowedAction[];
  blockedActions: readonly LeoIntelligenceBlockedAction[];
  requestedOutputShape: LeoIntelligenceOutputShape;
  evidenceRequirements: readonly string[];
  exposure: LeoIntelligenceProviderExposure;
  /** Soft timeout hint (ms) — adapters may ignore offline. */
  timeoutHintMs: number | null;
  /**
   * LEO-19D: optional provider-neutral reasoning envelope.
   * Required for REASONING_MODEL; absent for other provider types.
   * Never raw systemPrompt / HTTP payloads.
   */
  reasoningEnvelope?: LeoIntelligenceReasoningEnvelope | null;
  /** Explicit doctrine stamps. */
  notClaiming: readonly string[];
};

export type LeoIntelligenceExecutionClaims = {
  sent: false;
  deployed: false;
  scheduled: false;
  published: false;
  modified: false;
  paid: false;
  deleted: false;
  completedExternally: false;
};

export const LEO_EMPTY_EXECUTION_CLAIMS: LeoIntelligenceExecutionClaims = {
  sent: false,
  deployed: false,
  scheduled: false,
  published: false,
  modified: false,
  paid: false,
  deleted: false,
  completedExternally: false,
};

/**
 * Normalized adapter result — vendor fields never leak into conversation core.
 */
export type LeoIntelligenceInvocationResult = {
  status: LeoIntelligenceInvocationStatus;
  failureCategory: LeoIntelligenceFailureCategory | null;
  providerType: LeoIntelligenceProviderType;
  capability: LeoIntelligenceCapability;
  summary: string | null;
  structuredOutput: Record<string, unknown> | null;
  evidenceReferences: readonly string[];
  limitations: readonly string[];
  confidence: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  warnings: readonly string[];
  /** Placeholder only — no live usage metering in this gate. */
  usagePlaceholder: {
    inputUnits: null;
    outputUnits: null;
    note: string;
  };
  errorClassification: LeoIntelligenceFailureCategory | null;
  executionClaims: LeoIntelligenceExecutionClaims;
  /** Always false in LEO-19C. */
  externalSideEffects: false;
  verificationState: "NOT_VERIFIED" | "N_A";
  /** Optional hook for future leo_tool_receipts correlation — never a fake receipt. */
  observability: {
    correlationId: string;
    receiptCompatible: true;
    receiptCreated: false;
    reportingCompatible: true;
    reportEmitted: false;
  };
  notClaiming: readonly string[];
};

export const LEO_19C_ADAPTER_NOT_CLAIMING = [
  "Adapters are workers — LEO is the operator",
  "Provider output does not grant authority",
  "CAPABILITY != AUTHORITY",
  "No secrets in invocation contract",
  "No live model invocation in this gate",
  "externalSideEffects remain false",
  "No fake sent/deployed/scheduled claims",
] as const;

/**
 * Universal provider adapter interface.
 * Future vendor adapters implement this — never call conversation/router internals.
 */
export type LeoIntelligenceProviderAdapter = {
  readonly providerType: LeoIntelligenceProviderType;
  readonly supportedCapabilities: readonly LeoIntelligenceCapability[];
  /** Declared connection — offline adapters return false. */
  readonly isConnected: boolean;
  canHandle(request: LeoIntelligenceInvocationRequest): boolean;
  invoke(request: LeoIntelligenceInvocationRequest): Promise<LeoIntelligenceInvocationResult>;
};

export function isLeoIntelligenceFailureStatus(
  status: LeoIntelligenceInvocationStatus,
): status is LeoIntelligenceFailureCategory {
  return (LEO_INTELLIGENCE_FAILURE_CATEGORIES as readonly string[]).includes(status);
}

/** Guard: adapters never emit a mutable governance level — request floor is preserved. */
export function governanceLevelPreserved(
  _requestLevel: LeoGovernanceLevel,
  result: LeoIntelligenceInvocationResult,
): boolean {
  // No governance downgrade channel exists on results; execution claims stay false.
  return result.externalSideEffects === false && result.executionClaims.deployed === false;
}

/**
 * Detect forbidden false-success language in adapter summaries.
 */
export function containsForbiddenExecutionClaimLanguage(text: string | null | undefined): boolean {
  if (!text) return false;
  return /\b(sent|deployed|scheduled|published|paid|deleted|completed externally|successfully executed)\b/i.test(
    text,
  );
}

export function buildFailClosedInvocationResult(input: {
  status: LeoIntelligenceFailureCategory;
  providerType: LeoIntelligenceProviderType;
  capability: LeoIntelligenceCapability;
  correlationId: string;
  summary: string;
  limitations?: readonly string[];
  warnings?: readonly string[];
}): LeoIntelligenceInvocationResult {
  return {
    status: input.status,
    failureCategory: input.status,
    providerType: input.providerType,
    capability: input.capability,
    summary: input.summary,
    structuredOutput: null,
    evidenceReferences: [],
    limitations: [
      ...(input.limitations ?? []),
      "Fail-closed: no fabricated intelligence output.",
      ...LEO_19C_ADAPTER_NOT_CLAIMING.slice(0, 3),
    ],
    confidence: "NONE",
    warnings: [...(input.warnings ?? [])],
    usagePlaceholder: {
      inputUnits: null,
      outputUnits: null,
      note: "Usage not applicable — offline / not invoked.",
    },
    errorClassification: input.status,
    executionClaims: { ...LEO_EMPTY_EXECUTION_CLAIMS },
    externalSideEffects: false,
    verificationState: "N_A",
    observability: {
      correlationId: input.correlationId,
      receiptCompatible: true,
      receiptCreated: false,
      reportingCompatible: true,
      reportEmitted: false,
    },
    notClaiming: LEO_19C_ADAPTER_NOT_CLAIMING,
  };
}
