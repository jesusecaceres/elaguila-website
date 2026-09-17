/**
 * LEO-19C — Null / offline intelligence provider adapter.
 *
 * Proves runtime plumbing without any live provider.
 * Returns truthful NOT_CONNECTED / NO_PROVIDER / UNAVAILABLE results.
 * Never fabricates intelligence output or provider success.
 */
import type { LeoIntelligenceCapability } from "@/app/leo/_lib/leoIntelligenceRouter";
import type { LeoIntelligenceProviderType } from "@/app/leo/_lib/leoIntelligenceProviderRegistry";
import {
  buildFailClosedInvocationResult,
  type LeoIntelligenceInvocationRequest,
  type LeoIntelligenceInvocationResult,
  type LeoIntelligenceProviderAdapter,
  LEO_19C_ADAPTER_NOT_CLAIMING,
} from "@/app/leo/_lib/leoIntelligenceProviderAdapter";

const ALL_CAPS: readonly LeoIntelligenceCapability[] = [
  "EXECUTIVE_REASONING",
  "ENGINEERING_REASONING",
  "CREATIVE_REASONING",
  "RESEARCH_REASONING",
  "DATA_ANALYSIS",
  "UNKNOWN",
];

/**
 * Offline adapter registered for every provider type (and NONE).
 * isConnected is always false — honest about no live wiring.
 */
export function createLeoNullIntelligenceProviderAdapter(
  providerType: LeoIntelligenceProviderType,
): LeoIntelligenceProviderAdapter {
  return {
    providerType,
    supportedCapabilities: ALL_CAPS,
    isConnected: false,
    canHandle(request: LeoIntelligenceInvocationRequest): boolean {
      // Null adapter can "handle" any request for its declared type — by failing closed.
      return request.selectedProviderType === providerType || providerType === "NONE";
    },
    async invoke(
      request: LeoIntelligenceInvocationRequest,
    ): Promise<LeoIntelligenceInvocationResult> {
      if (request.selectedProviderType === "NONE" || providerType === "NONE") {
        return buildFailClosedInvocationResult({
          status: "NO_PROVIDER",
          providerType: "NONE",
          capability: request.requestedCapability,
          correlationId: request.correlationId,
          summary: "No intelligence provider selected (NONE).",
          limitations: [
            "Offline null adapter — no model invoked.",
            ...LEO_19C_ADAPTER_NOT_CLAIMING.slice(0, 2),
          ],
        });
      }

      return buildFailClosedInvocationResult({
        status: "NOT_CONNECTED",
        providerType: request.selectedProviderType,
        capability: request.requestedCapability,
        correlationId: request.correlationId,
        summary: `Provider type ${request.selectedProviderType} is NOT_CONNECTED — no live invocation.`,
        limitations: [
          "Offline null adapter — plumbing only.",
          "Provider availability is not proven by selection.",
          "No fabricated intelligence content.",
        ],
        warnings: ["Future connected adapters may replace this null adapter for the same type."],
      });
    },
  };
}

/** Default offline adapter used when no connected adapter is registered. */
export const leoNullIntelligenceProviderAdapter: LeoIntelligenceProviderAdapter =
  createLeoNullIntelligenceProviderAdapter("NONE");
