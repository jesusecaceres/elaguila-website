/**
 * LEO-19B — Intelligence Provider Registry (offline / model-agnostic).
 *
 * Registers provider *types*, not vendors. No API keys, SDKs, network, or
 * live availability probes. Declared metadata only.
 */

import type { LeoIntelligenceCapability } from "@/app/leo/_lib/leoIntelligenceRouter";

/** Canonical provider types — never brand/vendor names. */
export const LEO_INTELLIGENCE_PROVIDER_TYPES = [
  "REASONING_MODEL",
  "CODING_AGENT",
  "CREATIVE_MODEL",
  "RESEARCH_ENGINE",
  "DATA_ANALYSIS_ENGINE",
  "NONE",
] as const;

export type LeoIntelligenceProviderType = (typeof LEO_INTELLIGENCE_PROVIDER_TYPES)[number];

/**
 * Declared availability only — never live external probe results.
 * NOT_CONNECTED is the honest default in this gate (no live providers).
 */
export const LEO_PROVIDER_AVAILABILITY_STATES = [
  "REGISTERED",
  "NOT_CONNECTED",
  "DECLARED_UNAVAILABLE",
] as const;

export type LeoProviderAvailabilityState = (typeof LEO_PROVIDER_AVAILABILITY_STATES)[number];

export type LeoIntelligenceProviderRegistryEntry = {
  providerType: LeoIntelligenceProviderType;
  supportedCapabilities: readonly LeoIntelligenceCapability[];
  strengths: readonly string[];
  limitations: readonly string[];
  riskRestrictions: readonly string[];
  supportsStructuredOutput: boolean;
  supportsToolUse: boolean;
  supportsLongContext: boolean;
  supportsResearch: boolean;
  supportsCodeExecution: boolean;
  supportsImageGeneration: boolean;
  /** Always false in registry doctrine for this gate — external actions are not granted by type. */
  supportsExternalActions: false;
  availabilityState: LeoProviderAvailabilityState;
  /** Lower number = higher preference within eligibility. */
  priority: number;
  fallbackProviderTypes: readonly LeoIntelligenceProviderType[];
};

export const LEO_19B_REGISTRY_NOT_CLAIMING = [
  "Registry is not a live connection",
  "No vendor hardcoded",
  "No API key stored",
  "No SDK client",
  "Selection is not execution",
  "CAPABILITY != AUTHORITY",
] as const;

/**
 * Static offline registry. All entries are NOT_CONNECTED — honest about no live providers.
 */
export const LEO_INTELLIGENCE_PROVIDER_REGISTRY: readonly LeoIntelligenceProviderRegistryEntry[] = [
  {
    providerType: "REASONING_MODEL",
    supportedCapabilities: [
      "EXECUTIVE_REASONING",
      "ENGINEERING_REASONING",
      "CREATIVE_REASONING",
      "RESEARCH_REASONING",
      "DATA_ANALYSIS",
    ],
    strengths: [
      "Strategy and tradeoff analysis",
      "Structured recommendations",
      "Synthesis across context",
    ],
    limitations: [
      "Not a substitute for specialized coding agents",
      "Not live-connected in this gate",
      "Does not grant execution authority",
    ],
    riskRestrictions: [
      "Must not bypass governance",
      "Must not perform external writes",
    ],
    supportsStructuredOutput: true,
    supportsToolUse: false,
    supportsLongContext: true,
    supportsResearch: false,
    supportsCodeExecution: false,
    supportsImageGeneration: false,
    supportsExternalActions: false,
    availabilityState: "NOT_CONNECTED",
    priority: 20,
    fallbackProviderTypes: ["NONE"],
  },
  {
    providerType: "CODING_AGENT",
    supportedCapabilities: ["ENGINEERING_REASONING"],
    strengths: [
      "Debugging and architecture review",
      "Technical analysis",
      "Code-oriented reasoning",
    ],
    limitations: [
      "Not for executive strategy as primary",
      "Not live-connected in this gate",
      "Does not deploy or mutate systems",
    ],
    riskRestrictions: [
      "Must not deploy production autonomously",
      "Must not bypass approval",
    ],
    supportsStructuredOutput: true,
    supportsToolUse: true,
    supportsLongContext: true,
    supportsResearch: false,
    supportsCodeExecution: false,
    supportsImageGeneration: false,
    supportsExternalActions: false,
    availabilityState: "NOT_CONNECTED",
    priority: 10,
    fallbackProviderTypes: ["REASONING_MODEL", "NONE"],
  },
  {
    providerType: "CREATIVE_MODEL",
    supportedCapabilities: ["CREATIVE_REASONING"],
    strengths: ["Branding", "Design concepts", "Content direction"],
    limitations: [
      "Not for production engineering",
      "Not live-connected in this gate",
      "Image generation flagged only as future capability — not invoked here",
    ],
    riskRestrictions: ["Must not publish externally without governance"],
    supportsStructuredOutput: true,
    supportsToolUse: false,
    supportsLongContext: false,
    supportsResearch: false,
    supportsCodeExecution: false,
    supportsImageGeneration: true,
    supportsExternalActions: false,
    availabilityState: "NOT_CONNECTED",
    priority: 10,
    fallbackProviderTypes: ["REASONING_MODEL", "NONE"],
  },
  {
    providerType: "RESEARCH_ENGINE",
    supportedCapabilities: ["RESEARCH_REASONING"],
    strengths: ["Market research", "Competitive analysis", "Technology discovery"],
    limitations: [
      "Not live-connected in this gate",
      "Research output is untrusted until evidenced",
      "Does not grant send/deploy authority",
    ],
    riskRestrictions: [
      "Read-oriented research only unless governance elevates",
      "No silent external actions",
    ],
    supportsStructuredOutput: true,
    supportsToolUse: false,
    supportsLongContext: true,
    supportsResearch: true,
    supportsCodeExecution: false,
    supportsImageGeneration: false,
    supportsExternalActions: false,
    availabilityState: "NOT_CONNECTED",
    priority: 10,
    fallbackProviderTypes: ["REASONING_MODEL", "NONE"],
  },
  {
    providerType: "DATA_ANALYSIS_ENGINE",
    supportedCapabilities: ["DATA_ANALYSIS"],
    strengths: ["Metrics", "Reports", "Trend analysis"],
    limitations: [
      "Not live-connected in this gate",
      "Does not invent missing metrics",
      "Does not execute financial writes",
    ],
    riskRestrictions: ["No spend or billing mutations"],
    supportsStructuredOutput: true,
    supportsToolUse: false,
    supportsLongContext: true,
    supportsResearch: false,
    supportsCodeExecution: false,
    supportsImageGeneration: false,
    supportsExternalActions: false,
    availabilityState: "NOT_CONNECTED",
    priority: 10,
    fallbackProviderTypes: ["REASONING_MODEL", "NONE"],
  },
  {
    providerType: "NONE",
    supportedCapabilities: ["UNKNOWN"],
    strengths: ["Fail-closed when no valid provider exists"],
    limitations: [
      "No intelligence provider selected",
      "Clarification or governance path required",
    ],
    riskRestrictions: ["Must not invent provider success"],
    supportsStructuredOutput: false,
    supportsToolUse: false,
    supportsLongContext: false,
    supportsResearch: false,
    supportsCodeExecution: false,
    supportsImageGeneration: false,
    supportsExternalActions: false,
    availabilityState: "REGISTERED",
    priority: 100,
    fallbackProviderTypes: [],
  },
] as const;

export function getLeoIntelligenceProviderEntry(
  providerType: LeoIntelligenceProviderType,
): LeoIntelligenceProviderRegistryEntry | null {
  return (
    LEO_INTELLIGENCE_PROVIDER_REGISTRY.find((e) => e.providerType === providerType) ?? null
  );
}

export function listLeoIntelligenceProviderRegistry(): readonly LeoIntelligenceProviderRegistryEntry[] {
  return LEO_INTELLIGENCE_PROVIDER_REGISTRY;
}

export function isLeoIntelligenceProviderType(v: unknown): v is LeoIntelligenceProviderType {
  return (
    typeof v === "string" &&
    (LEO_INTELLIGENCE_PROVIDER_TYPES as readonly string[]).includes(v)
  );
}

/**
 * Map LEO-19A lowercase futureProviderType → registry provider type.
 */
export function mapFutureProviderTypeToRegistry(
  future: string | null | undefined,
): LeoIntelligenceProviderType {
  switch (future) {
    case "reasoning_model":
      return "REASONING_MODEL";
    case "coding_agent":
      return "CODING_AGENT";
    case "creative_model":
      return "CREATIVE_MODEL";
    case "research_engine":
      return "RESEARCH_ENGINE";
    case "data_analysis_engine":
      return "DATA_ANALYSIS_ENGINE";
    default:
      return "NONE";
  }
}

/**
 * Deterministic capability → ordered eligible provider types (primary first).
 * Does not check live availability — eligibility only.
 */
export function eligibleProviderTypesForCapability(
  capability: LeoIntelligenceCapability,
): readonly LeoIntelligenceProviderType[] {
  switch (capability) {
    case "EXECUTIVE_REASONING":
      return ["REASONING_MODEL"];
    case "ENGINEERING_REASONING":
      return ["CODING_AGENT", "REASONING_MODEL"];
    case "CREATIVE_REASONING":
      return ["CREATIVE_MODEL", "REASONING_MODEL"];
    case "RESEARCH_REASONING":
      return ["RESEARCH_ENGINE", "REASONING_MODEL"];
    case "DATA_ANALYSIS":
      return ["DATA_ANALYSIS_ENGINE", "REASONING_MODEL"];
    case "UNKNOWN":
    default:
      return ["NONE"];
  }
}
