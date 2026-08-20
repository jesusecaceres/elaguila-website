/**
 * LEO-19E — Intelligence runtime health + observability contract.
 *
 * Separate operational facts. Observability only — no second telemetry DB,
 * no raw prompts/responses/secrets, no governance mutation, no provider writes.
 *
 * Doctrine: WORKER DEGRADED ≠ LEO DOWN when deterministic Leonix truth remains.
 */
import type {
  LeoAiAnswerMeta,
  LeoAiFallbackReason,
  LeoAiReasoningMode,
  LeoGovernanceLevel,
  LeoIntelligenceRuntimeFailureClass,
  LeoIntelligenceRuntimeObservation,
  LeoSystemHealthComponent,
  LeoSystemHealthState,
} from "@/app/leo/_lib/leoTypes";
import type {
  LeoExecutiveSeverity,
  LeoExecutiveSignal,
  LeoExecutiveSignalStatus,
} from "@/app/leo/_lib/leoExecutiveReportingTypes";
import { buildLeoExecutiveSignal } from "@/app/leo/_lib/leoExecutiveReportingAdapter";
import { isLeoAiCredentialPresent } from "@/app/leo/_lib/leoAiConfigPresence";

export type {
  LeoIntelligenceRuntimeFailureClass,
  LeoIntelligenceRuntimeObservation,
} from "@/app/leo/_lib/leoTypes";

/** Explicit stage stamps — each is independent of the others. */
export const LEO_INTELLIGENCE_RUNTIME_STAGES = [
  "TYPE_REGISTERED",
  "ADAPTER_IMPLEMENTED",
  "CONFIG_PRESENT",
  "RUNTIME_AVAILABLE",
  "CALL_NOT_ATTEMPTED",
  "CALL_SUCCEEDED",
  "CALL_FAILED",
  "VALIDATION_SUCCEEDED",
  "VALIDATION_REJECTED",
  "FALLBACK_USED",
] as const;

export type LeoIntelligenceRuntimeStage = (typeof LEO_INTELLIGENCE_RUNTIME_STAGES)[number];

/** Stable operational failure classes (safe — no raw provider bodies). */
export const LEO_INTELLIGENCE_RUNTIME_FAILURE_CLASSES: readonly LeoIntelligenceRuntimeFailureClass[] = [
  "NOT_CONNECTED",
  "PROVIDER_UNAVAILABLE",
  "TIMEOUT",
  "PROVIDER_ERROR",
  "INVALID_MODEL_OUTPUT",
  "VALIDATION_REJECTED",
  "INSUFFICIENT_EVIDENCE",
  "INTENT_NOT_AI_ELIGIBLE",
  "NONE",
] as const;

export type LeoIntelligenceRuntimeHealthSignalKind =
  | "INTELLIGENCE_PROVIDER_NOT_CONFIGURED"
  | "INTELLIGENCE_PROVIDER_FAILURE"
  | "INTELLIGENCE_PROVIDER_TIMEOUT"
  | "INTELLIGENCE_VALIDATION_REJECTED"
  | "INTELLIGENCE_FALLBACK_USED"
  | "INTELLIGENCE_RUNTIME_HEALTHY";

export const LEO_INTELLIGENCE_RUNTIME_NOT_RECORDING = [
  "raw_prompt",
  "raw_provider_response",
  "api_key",
  "oauth_token",
  "full_evidence_bundle",
  "full_conversation_text",
] as const;

export type LeoIntelligenceRuntimeReceiptCompatibility = {
  receiptCompatible: true;
  durablePersistAttempted: false;
  durablePersistSupportedWithoutMigration: false;
  limitation: string;
};

/** Typed receipt hook — no fake persistence (tool receipts are action-lifecycle, not AI synthesis). */
export function leoIntelligenceRuntimeReceiptCompatibility(): LeoIntelligenceRuntimeReceiptCompatibility {
  return {
    receiptCompatible: true,
    durablePersistAttempted: false,
    durablePersistSupportedWithoutMigration: false,
    limitation:
      "leo_tool_receipts remains the tool-action lifecycle ledger. Intelligence-runtime observation is receipt-compatible in metadata only; durable AI-health rows require a future schema decision — no migration in LEO-19E.",
  };
}

export function mapFallbackReasonToFailureClass(
  reason: LeoAiFallbackReason | null | undefined,
): LeoIntelligenceRuntimeFailureClass {
  if (!reason) return "NONE";
  switch (reason) {
    case "PROVIDER_NOT_CONFIGURED":
      return "NOT_CONNECTED";
    case "PROVIDER_TIMEOUT":
      return "TIMEOUT";
    case "PROVIDER_ERROR":
      return "PROVIDER_ERROR";
    case "INVALID_MODEL_OUTPUT":
      return "INVALID_MODEL_OUTPUT";
    case "GROUNDING_VALIDATION_FAILED":
      return "VALIDATION_REJECTED";
    case "INSUFFICIENT_EVIDENCE":
      return "INSUFFICIENT_EVIDENCE";
    case "INTENT_NOT_AI_ELIGIBLE":
      return "INTENT_NOT_AI_ELIGIBLE";
    default:
      return "PROVIDER_ERROR";
  }
}

export function mapInvocationStatusToFailureClass(
  status: string | null | undefined,
): LeoIntelligenceRuntimeFailureClass {
  if (!status || status === "OK") return "NONE";
  if (status === "NOT_CONNECTED" || status === "NO_PROVIDER") return "NOT_CONNECTED";
  if (status === "TIMEOUT") return "TIMEOUT";
  if (status === "PROVIDER_UNAVAILABLE") return "PROVIDER_UNAVAILABLE";
  if (status === "INVALID_REQUEST" || status === "NORMALIZATION_ERROR") return "PROVIDER_ERROR";
  return "PROVIDER_ERROR";
}

export type BuildLeoIntelligenceRuntimeObservationInput = {
  correlationId?: string | null;
  capability?: string | null;
  configPresent: boolean;
  adapterImplemented?: boolean;
  callAttempted: boolean;
  callSucceeded: boolean;
  validationSucceeded: boolean;
  validationRejected: boolean;
  fallbackUsed: boolean;
  failureClass?: LeoIntelligenceRuntimeFailureClass;
  reasoningMode: LeoAiReasoningMode;
  latencyMs?: number | null;
  governanceLevel?: LeoGovernanceLevel | null;
  nowMs?: number;
};

/**
 * Build a truthful observation. Stages are independent facts.
 * CONFIG_PRESENT does not imply CALL_SUCCEEDED.
 * CALL_SUCCEEDED does not imply VALIDATION_SUCCEEDED.
 */
export function buildLeoIntelligenceRuntimeObservation(
  input: BuildLeoIntelligenceRuntimeObservationInput,
): LeoIntelligenceRuntimeObservation {
  const configPresent = input.configPresent;
  const callSucceeded = input.callSucceeded;
  const callFailed = input.callAttempted && !callSucceeded;
  const validationSucceeded = input.validationSucceeded;
  const validationRejected = input.validationRejected;
  const fallbackUsed = input.fallbackUsed;
  const failureClass =
    input.failureClass ??
    (callFailed
      ? "PROVIDER_ERROR"
      : validationRejected
        ? "VALIDATION_REJECTED"
        : "NONE");

  const workerDegraded =
    (configPresent && (callFailed || validationRejected)) ||
    (fallbackUsed &&
      failureClass !== "INTENT_NOT_AI_ELIGIBLE" &&
      failureClass !== "NONE" &&
      failureClass !== "INSUFFICIENT_EVIDENCE");

  return {
    generatedAt: new Date(input.nowMs ?? Date.now()).toISOString(),
    correlationId: input.correlationId?.trim() || null,
    providerType: "REASONING_MODEL",
    capability: input.capability ?? null,
    typeRegistered: true,
    adapterImplemented: input.adapterImplemented ?? true,
    configPresent,
    runtimeAvailable: configPresent,
    callAttempted: input.callAttempted,
    callSucceeded,
    callFailed,
    validationSucceeded,
    validationRejected,
    fallbackUsed,
    failureClass,
    reasoningMode: input.reasoningMode,
    latencyMs: input.latencyMs ?? null,
    workerDegraded,
    leoOperational: true,
    governanceLevel: input.governanceLevel ?? null,
    governanceUnchangedByHealth: true,
    notRecording: LEO_INTELLIGENCE_RUNTIME_NOT_RECORDING,
  };
}

/** Derive observation from existing LeoAiAnswerMeta (+ optional call/validation flags). */
export function observationFromLeoAiAnswerMeta(
  meta: LeoAiAnswerMeta,
  extras?: {
    correlationId?: string | null;
    capability?: string | null;
    callAttempted?: boolean;
    validationSucceeded?: boolean;
    validationRejected?: boolean;
    latencyMs?: number | null;
    nowMs?: number;
  },
): LeoIntelligenceRuntimeObservation {
  const callAttempted =
    extras?.callAttempted ??
    (meta.fallbackReason === "PROVIDER_TIMEOUT" ||
      meta.fallbackReason === "PROVIDER_ERROR" ||
      meta.fallbackReason === "INVALID_MODEL_OUTPUT" ||
      meta.fallbackReason === "GROUNDING_VALIDATION_FAILED" ||
      meta.providerSucceeded ||
      (meta.providerAvailable && meta.fallbackUsed && meta.groundingState === "AI_UNAVAILABLE"));

  const validationSucceeded =
    extras?.validationSucceeded ?? (meta.aiUsed && meta.providerSucceeded && !meta.fallbackUsed);
  const validationRejected =
    extras?.validationRejected ??
    (meta.fallbackReason === "GROUNDING_VALIDATION_FAILED" ||
      meta.fallbackReason === "INVALID_MODEL_OUTPUT" ||
      meta.groundingState === "AI_REJECTED");

  return buildLeoIntelligenceRuntimeObservation({
    correlationId: extras?.correlationId,
    capability: extras?.capability,
    configPresent: meta.providerAvailable,
    callAttempted: Boolean(callAttempted),
    callSucceeded: meta.providerSucceeded,
    validationSucceeded,
    validationRejected,
    fallbackUsed: meta.fallbackUsed,
    failureClass: mapFallbackReasonToFailureClass(meta.fallbackReason),
    reasoningMode: meta.reasoningMode,
    latencyMs: extras?.latencyMs,
    governanceLevel: meta.governanceLevel,
    nowMs: extras?.nowMs,
  });
}

/**
 * Attention policy — prevent alert fatigue.
 * One isolated fallback is operational metadata, not a critical interruption.
 * Repetition cannot be calculated without persistence — no fake trending.
 */
export function shouldEscalateIntelligenceRuntimeAttention(
  observation: LeoIntelligenceRuntimeObservation,
): boolean {
  if (!observation.leoOperational) return true;
  return false;
}

export function intelligenceRuntimeAttentionLimitation(): string {
  return "Repeated intelligence-provider failure trends are not persisted yet — current-state health only (no fake trending).";
}

/** Map observation → system health component. Worker degraded ≠ LEO down. */
export function mapIntelligenceRuntimeToSystemHealthComponent(
  observation: LeoIntelligenceRuntimeObservation | null,
  configPresentFallback?: boolean,
): LeoSystemHealthComponent {
  const configPresent = observation?.configPresent ?? configPresentFallback ?? isLeoAiCredentialPresent();

  let state: LeoSystemHealthState = "UNKNOWN";
  let ownerMessage: string | null = null;

  if (!configPresent) {
    state = "NOT_CONFIGURED";
    ownerMessage =
      "Intelligence worker is not configured. LEO still answers from Leonix evidence when available.";
  } else if (!observation) {
    state = "HEALTHY";
    ownerMessage = null;
  } else if (observation.callFailed && observation.failureClass === "TIMEOUT") {
    state = "DEGRADED";
    ownerMessage =
      "Intelligence worker timed out on the last attempt. LEO remains operational via deterministic answers.";
  } else if (observation.callFailed) {
    state = "DEGRADED";
    ownerMessage =
      "Intelligence worker failed on the last attempt. LEO remains operational via deterministic answers.";
  } else if (observation.validationRejected) {
    state = "DEGRADED";
    ownerMessage =
      "Intelligence worker output was rejected by validation. LEO remains operational via deterministic answers.";
  } else {
    state = "HEALTHY";
    ownerMessage = null;
  }

  return {
    key: "intelligence_reasoning",
    label: "Intelligence reasoning worker",
    state,
    ownerMessage,
  };
}

/** Current-state config probe for system health (no last-call required). */
export function intelligenceRuntimeConfigSystemHealthState(): LeoSystemHealthState {
  return isLeoAiCredentialPresent() ? "HEALTHY" : "NOT_CONFIGURED";
}

/**
 * Convert observation into EXEC-REPORTS HEALTH signals.
 * Routine success → empty (no noisy attention).
 * Degraded/unconfigured → bounded HEALTH signals.
 */
export function buildLeoIntelligenceRuntimeExecutiveSignals(input: {
  observation?: LeoIntelligenceRuntimeObservation | null;
  configPresent?: boolean;
  nowMs?: number;
}): LeoExecutiveSignal[] {
  const nowMs = input.nowMs ?? Date.now();
  const obs = input.observation ?? null;
  const configPresent = obs?.configPresent ?? input.configPresent ?? isLeoAiCredentialPresent();
  const signals: LeoExecutiveSignal[] = [];

  if (!configPresent) {
    signals.push(
      buildLeoExecutiveSignal({
        domain: "LEO",
        sourceKind: "intelligence_runtime",
        sourceRef: "not_configured",
        nowMs,
        title: "Intelligence worker not configured",
        summary:
          "REASONING_MODEL credentials are not present. LEO remains useful with deterministic Leonix evidence.",
        signalType: "SYSTEM_HEALTH",
        severity: "INFORMATIONAL" as LeoExecutiveSeverity,
        status: "NOT_IMPLEMENTED" as LeoExecutiveSignalStatus,
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/leo",
        evidenceRefs: ["leo:intelligence_runtime:not_configured"],
        availability: "NOT_IMPLEMENTED",
        metadataSummary: "INTELLIGENCE_PROVIDER_NOT_CONFIGURED",
        priorityRank: 7,
      }),
    );
    return signals;
  }

  if (!obs) {
    return signals;
  }

  if (obs.callSucceeded && obs.validationSucceeded && !obs.fallbackUsed) {
    return signals;
  }

  if (obs.failureClass === "TIMEOUT") {
    signals.push(
      buildLeoExecutiveSignal({
        domain: "LEO",
        sourceKind: "intelligence_runtime",
        sourceRef: "timeout",
        nowMs,
        title: "Intelligence worker timeout",
        summary:
          "Provider transport timed out. Deterministic Leonix answer was used. Worker degraded ≠ LEO down.",
        signalType: "SYSTEM_HEALTH",
        severity: "NORMAL",
        status: "DEGRADED",
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/leo",
        evidenceRefs: ["leo:intelligence_runtime:timeout"],
        availability: "PARTIAL",
        metadataSummary: "INTELLIGENCE_PROVIDER_TIMEOUT",
        priorityRank: 5,
      }),
    );
  } else if (obs.callFailed) {
    signals.push(
      buildLeoExecutiveSignal({
        domain: "LEO",
        sourceKind: "intelligence_runtime",
        sourceRef: "provider_failure",
        nowMs,
        title: "Intelligence worker transport failure",
        summary:
          "Provider transport failed. Deterministic Leonix answer was used. Configured-but-failing is distinct from unconfigured.",
        signalType: "SYSTEM_HEALTH",
        severity: "NORMAL",
        status: "DEGRADED",
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/leo",
        evidenceRefs: ["leo:intelligence_runtime:failure"],
        availability: "PARTIAL",
        metadataSummary: "INTELLIGENCE_PROVIDER_FAILURE",
        priorityRank: 5,
      }),
    );
  } else if (obs.validationRejected) {
    signals.push(
      buildLeoExecutiveSignal({
        domain: "LEO",
        sourceKind: "intelligence_runtime",
        sourceRef: "validation_rejected",
        nowMs,
        title: "Intelligence validation rejected provider output",
        summary:
          "Provider returned output that failed LEO validation. Deterministic answer used. Validation rejection ≠ transport failure.",
        signalType: "SYSTEM_HEALTH",
        severity: "NORMAL",
        status: "DEGRADED",
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/leo",
        evidenceRefs: ["leo:intelligence_runtime:validation"],
        availability: "PARTIAL",
        metadataSummary: "INTELLIGENCE_VALIDATION_REJECTED",
        priorityRank: 5,
      }),
    );
  } else if (
    obs.fallbackUsed &&
    obs.failureClass !== "INTENT_NOT_AI_ELIGIBLE" &&
    obs.failureClass !== "INSUFFICIENT_EVIDENCE"
  ) {
    signals.push(
      buildLeoExecutiveSignal({
        domain: "LEO",
        sourceKind: "intelligence_runtime",
        sourceRef: "fallback",
        nowMs,
        title: "Intelligence fallback used",
        summary:
          "LEO answered from Leonix evidence after worker path did not complete. Single fallback is operational metadata, not a critical alert.",
        signalType: "SYSTEM_HEALTH",
        severity: "INFORMATIONAL",
        status: "INFORMATIONAL",
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/leo",
        evidenceRefs: ["leo:intelligence_runtime:fallback"],
        availability: "PARTIAL",
        metadataSummary: "INTELLIGENCE_FALLBACK_USED",
        priorityRank: 7,
      }),
    );
  }

  return signals;
}

/**
 * Morning brief warning — only meaningful current problems.
 * Never emit "AI healthy" noise.
 */
export function leoIntelligenceRuntimeMorningBriefWarning(input: {
  configPresent?: boolean;
  observation?: LeoIntelligenceRuntimeObservation | null;
}): string | null {
  const configPresent = input.configPresent ?? isLeoAiCredentialPresent();
  const obs = input.observation ?? null;

  if (!configPresent) {
    return "Intelligence worker is not configured — LEO still uses Leonix evidence directly.";
  }
  if (!obs) return null;
  if (obs.callFailed && obs.failureClass === "TIMEOUT") {
    return "Intelligence worker timed out recently — answers may use Leonix evidence directly.";
  }
  if (obs.callFailed) {
    return "Intelligence worker failed recently — answers may use Leonix evidence directly.";
  }
  if (obs.validationRejected) {
    return "Intelligence worker output was rejected by validation — answers may use Leonix evidence directly.";
  }
  return null;
}

/** Owner-facing line only when health meaningfully affects the answer (no vendor jargon). */
export function leoIntelligenceRuntimeOwnerFacingNote(
  observation: LeoIntelligenceRuntimeObservation,
): string | null {
  if (!observation.fallbackUsed) return null;
  if (observation.failureClass === "INTENT_NOT_AI_ELIGIBLE") return null;
  if (observation.failureClass === "INSUFFICIENT_EVIDENCE") return null;
  if (!observation.configPresent) {
    return "Answered from Leonix evidence (intelligence worker not configured).";
  }
  if (observation.validationRejected) {
    return "Answered from Leonix evidence (worker output did not pass validation).";
  }
  if (observation.callFailed) {
    return "Answered from Leonix evidence (intelligence worker unavailable).";
  }
  return null;
}

/** Prove stage independence for verifiers via fixture construction. */
export function assertRuntimeStageIndependence(obs: LeoIntelligenceRuntimeObservation): {
  configDoesNotImplyCallSuccess: boolean;
  callSuccessDoesNotImplyValidation: boolean;
  workerDegradedDoesNotImplyLeoDown: boolean;
} {
  return {
    configDoesNotImplyCallSuccess: obs.configPresent === true && obs.callSucceeded === false,
    callSuccessDoesNotImplyValidation: obs.callSucceeded === true && obs.validationSucceeded === false,
    workerDegradedDoesNotImplyLeoDown: obs.workerDegraded === true && obs.leoOperational === true,
  };
}

export function stagesAsRecord(
  obs: LeoIntelligenceRuntimeObservation,
): Record<LeoIntelligenceRuntimeStage, boolean> {
  return {
    TYPE_REGISTERED: obs.typeRegistered,
    ADAPTER_IMPLEMENTED: obs.adapterImplemented,
    CONFIG_PRESENT: obs.configPresent,
    RUNTIME_AVAILABLE: obs.runtimeAvailable,
    CALL_NOT_ATTEMPTED: !obs.callAttempted,
    CALL_SUCCEEDED: obs.callSucceeded,
    CALL_FAILED: obs.callFailed,
    VALIDATION_SUCCEEDED: obs.validationSucceeded,
    VALIDATION_REJECTED: obs.validationRejected,
    FALLBACK_USED: obs.fallbackUsed,
  };
}
