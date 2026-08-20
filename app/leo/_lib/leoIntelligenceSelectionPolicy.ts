/**
 * LEO-19B — Intelligence Provider Selection Policy (pure / offline).
 *
 * Capability → eligible types → policy filters → preferred order → fallback plan.
 * Selection != execution permission. Selection != external call.
 * Governance remains authoritative and separate.
 */

import type { LeoGovernanceLevel } from "@/app/leo/_lib/leoTypes";
import type {
  LeoIntelligenceCapability,
  LeoIntelligenceRouteResult,
} from "@/app/leo/_lib/leoIntelligenceRouter";
import {
  eligibleProviderTypesForCapability,
  getLeoIntelligenceProviderEntry,
  type LeoIntelligenceProviderType,
  type LeoProviderAvailabilityState,
  LEO_19B_REGISTRY_NOT_CLAIMING,
} from "@/app/leo/_lib/leoIntelligenceProviderRegistry";

export const LEO_SELECTION_CONFIDENCE = ["HIGH", "MEDIUM", "LOW", "NONE"] as const;
export type LeoSelectionConfidence = (typeof LEO_SELECTION_CONFIDENCE)[number];

export type LeoIntelligenceSelectionInput = {
  /** From LEO-19A router (preferred). */
  route?: LeoIntelligenceRouteResult | null;
  /** Direct capability if route not supplied. */
  capability?: LeoIntelligenceCapability | null;
  /** Governance floor hint — never grants approval. */
  requiredGovernanceLevel?: LeoGovernanceLevel | null;
  /**
   * Optional declared unavailability overrides (offline testing / future ops).
   * Never populated from live external probes in this gate.
   */
  declaredUnavailable?: readonly LeoIntelligenceProviderType[];
  /**
   * When true (default), NOT_CONNECTED providers may still be *selected as plan*
   * but executionAllowed remains false. When false, treat NOT_CONNECTED as
   * unavailable and fall through fallbacks to NONE.
   */
  allowNotConnectedAsPlan?: boolean;
};

export type LeoIntelligenceSelectionResult = {
  requestedCapability: LeoIntelligenceCapability;
  eligibleProviderTypes: readonly LeoIntelligenceProviderType[];
  selectedProviderType: LeoIntelligenceProviderType;
  selectionReason: string;
  fallbackPlan: readonly LeoIntelligenceProviderType[];
  governanceConstraints: {
    requiredGovernanceLevel: LeoGovernanceLevel;
    capabilityIsNotAuthority: true;
    selectionDoesNotGrantExecution: true;
  };
  /** Always false in LEO-19B — no live invocation. */
  executionAllowed: false;
  limitations: readonly string[];
  confidence: LeoSelectionConfidence;
  notClaiming: readonly string[];
};

export const LEO_19B_SELECTION_NOT_CLAIMING = [
  ...LEO_19B_REGISTRY_NOT_CLAIMING,
  "Selection is not provider availability proof",
  "Fallback never silently downgrades safety",
] as const;

function isDeclaredUnavailable(
  type: LeoIntelligenceProviderType,
  declaredUnavailable: readonly LeoIntelligenceProviderType[] | undefined,
): boolean {
  return Boolean(declaredUnavailable?.includes(type));
}

function effectiveAvailability(
  type: LeoIntelligenceProviderType,
  declaredUnavailable: readonly LeoIntelligenceProviderType[] | undefined,
): LeoProviderAvailabilityState {
  if (type === "NONE") return "REGISTERED";
  if (isDeclaredUnavailable(type, declaredUnavailable)) return "DECLARED_UNAVAILABLE";
  const entry = getLeoIntelligenceProviderEntry(type);
  return entry?.availabilityState ?? "DECLARED_UNAVAILABLE";
}

/**
 * Prefer:
 * 1. best capability match
 * 2. least unnecessary privilege (narrower types first in eligibility order)
 * 3. least unnecessary external exposure (supportsExternalActions always false)
 * 4. governance compatibility (no execution grant)
 * 5. deterministic fallback
 * 6. truthful NONE when nothing valid
 */
export function selectLeoIntelligenceProvider(
  input: LeoIntelligenceSelectionInput,
): LeoIntelligenceSelectionResult {
  const capability: LeoIntelligenceCapability =
    input.route?.requestedCapability ?? input.capability ?? "UNKNOWN";
  const governanceLevel: LeoGovernanceLevel =
    input.route?.requiredGovernanceLevel ??
    input.requiredGovernanceLevel ??
    "GREEN";
  const allowNotConnectedAsPlan = input.allowNotConnectedAsPlan !== false;

  const eligible = eligibleProviderTypesForCapability(capability);
  const limitations: string[] = [
    "Provider selection is offline planning only — no model was invoked.",
    "CAPABILITY != AUTHORITY — selection does not grant execution.",
    "Governance remains authoritative over any future provider use.",
  ];

  if (governanceLevel === "RED" || governanceLevel === "NEVER") {
    limitations.push(
      `Governance floor ${governanceLevel} — selection cannot authorize deploy/send/execute.`,
    );
  }

  // Build ordered candidate list: eligibility order, then each entry's declared fallbacks.
  const ordered: LeoIntelligenceProviderType[] = [];
  const seen = new Set<LeoIntelligenceProviderType>();
  const push = (t: LeoIntelligenceProviderType) => {
    if (seen.has(t)) return;
    seen.add(t);
    ordered.push(t);
  };
  for (const t of eligible) {
    push(t);
    const entry = getLeoIntelligenceProviderEntry(t);
    for (const fb of entry?.fallbackProviderTypes ?? []) push(fb);
  }
  push("NONE");

  const fallbackPlan = ordered.filter((t) => t !== eligible[0]);

  let selected: LeoIntelligenceProviderType = "NONE";
  let selectionReason = "No valid provider type — fail closed to NONE.";
  let confidence: LeoSelectionConfidence = "NONE";

  for (const candidate of ordered) {
    if (candidate === "NONE") {
      selected = "NONE";
      selectionReason =
        capability === "UNKNOWN"
          ? "Capability UNKNOWN — no provider selected (NONE)."
          : "No capability-compatible provider available after fallbacks — NONE.";
      confidence = capability === "UNKNOWN" ? "LOW" : "NONE";
      limitations.push("Fail-closed: no invented provider success.");
      break;
    }

    const avail = effectiveAvailability(candidate, input.declaredUnavailable);
    if (avail === "DECLARED_UNAVAILABLE") {
      limitations.push(
        `${candidate} declared unavailable — trying next fallback (no fake success).`,
      );
      continue;
    }

    if (avail === "NOT_CONNECTED" && !allowNotConnectedAsPlan) {
      limitations.push(
        `${candidate} is NOT_CONNECTED and plan-only selection disabled — trying fallback.`,
      );
      continue;
    }

    // Privilege check: do not pick a broader type before a narrower eligible primary
    // when primary is usable — eligibility order already encodes least privilege.
    const entry = getLeoIntelligenceProviderEntry(candidate);
    if (!entry) {
      limitations.push(`${candidate} missing from registry — skipped.`);
      continue;
    }

    // Capability compatibility: candidate must support capability OR be an explicit
    // eligibility/fallback for that capability (REASONING_MODEL synthesis fallbacks).
    const supports =
      entry.supportedCapabilities.includes(capability) ||
      eligible.includes(candidate) ||
      (candidate === "REASONING_MODEL" && capability !== "UNKNOWN");

    if (!supports) {
      limitations.push(
        `${candidate} unrelated to ${capability} — refused (no silent misroute).`,
      );
      continue;
    }

    // Never select a type that claims external actions (registry forbids it anyway).
    if (entry.supportsExternalActions) {
      limitations.push(`${candidate} claims external actions — refused.`);
      continue;
    }

    selected = candidate;
    const isPrimary = candidate === eligible[0];
    selectionReason = isPrimary
      ? `Best capability match for ${capability}: ${candidate}.`
      : `Primary unavailable or skipped — deterministic fallback to ${candidate} for ${capability}.`;
    confidence = isPrimary
      ? input.route?.confidence === "HIGH"
        ? "HIGH"
        : input.route?.confidence === "MEDIUM"
          ? "MEDIUM"
          : "MEDIUM"
      : "LOW";

    if (avail === "NOT_CONNECTED") {
      limitations.push(
        `${candidate} selected as plan only — NOT_CONNECTED; not availability proof; not invoked.`,
      );
    }
    break;
  }

  // Never pretend success / availability.
  if (selected !== "NONE") {
    limitations.push("executionAllowed=false — selection is not invocation.");
  }

  return {
    requestedCapability: capability,
    eligibleProviderTypes: eligible,
    selectedProviderType: selected,
    selectionReason,
    fallbackPlan:
      selected === "NONE"
        ? []
        : fallbackPlan.filter((t) => t !== selected),
    governanceConstraints: {
      requiredGovernanceLevel: governanceLevel,
      capabilityIsNotAuthority: true,
      selectionDoesNotGrantExecution: true,
    },
    executionAllowed: false,
    limitations,
    confidence,
    notClaiming: LEO_19B_SELECTION_NOT_CLAIMING,
  };
}

/** Bounded snapshot safe for conversation enrichment (no secrets, no vendors). */
export function leoIntelligenceSelectionSnapshot(
  result: LeoIntelligenceSelectionResult,
): Record<string, unknown> {
  return {
    requestedCapability: result.requestedCapability,
    eligibleProviderTypes: [...result.eligibleProviderTypes],
    selectedProviderType: result.selectedProviderType,
    selectionReason: result.selectionReason,
    fallbackPlan: [...result.fallbackPlan],
    governanceConstraints: { ...result.governanceConstraints },
    executionAllowed: false,
    confidence: result.confidence,
    limitations: [...result.limitations].slice(0, 8),
    notClaiming: [...result.notClaiming],
  };
}

/**
 * Compose 19A route + 19B selection for conversation enrichment.
 */
export function selectProviderForIntelligenceRoute(
  route: LeoIntelligenceRouteResult,
  options?: Omit<LeoIntelligenceSelectionInput, "route">,
): LeoIntelligenceSelectionResult {
  return selectLeoIntelligenceProvider({
    ...options,
    route,
  });
}
