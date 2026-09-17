/**
 * LEO-19D — Provider-neutral reasoning envelope.
 *
 * Bridges LeoAiEvidenceBundle into the LEO-19 runtime without raw
 * systemPrompt / userPayload / HTTP payloads on the universal contract.
 */
import type {
  LeoAiEvidenceBundle,
  LeoAiEvidenceItem,
  LeoConversationIntent,
  LeoGovernanceLevel,
  LeoPreparedActionStatus,
  LeoTruthAvailability,
} from "@/app/leo/_lib/leoTypes";

export const LEO_AI_REASONED_ANSWER_SCHEMA = "LEO_AI_REASONED_ANSWER_V1" as const;

export type LeoIntelligenceReasoningTrustClass =
  | "SYSTEM_POLICY"
  | "TRUSTED_INTERNAL"
  | "EXTERNAL_UNTRUSTED"
  | "OWNER_QUESTION";

export type LeoIntelligenceReasoningFact = {
  id: string;
  sourceType: string;
  statement: string;
  provenanceLabel: string;
  truthState: LeoTruthAvailability;
  canonicalRef: string | null;
  trustClass: LeoIntelligenceReasoningTrustClass;
};

/**
 * Bounded, provider-neutral reasoning inputs owned by LEO.
 * No secrets, tokens, env values, or unlimited history.
 */
export type LeoIntelligenceReasoningEnvelope = {
  question: string;
  intent: LeoConversationIntent;
  facts: LeoIntelligenceReasoningFact[];
  evidenceIds: string[];
  unknowns: string[];
  limitations: string[];
  policyNotes: readonly string[];
  governanceLevel: LeoGovernanceLevel | null;
  governanceSummary: string | null;
  approvalRequired: boolean;
  executionAllowed: false;
  preparationAllowed: boolean;
  preparedStatus: LeoPreparedActionStatus | null;
  listingReasonUnknown: boolean;
  consequentialDecision: boolean;
  externalUntrustedNotes: string[];
  requiredOutputSchema: typeof LEO_AI_REASONED_ANSWER_SCHEMA;
  recentConversationTurns: Array<{ role: "USER" | "LEO"; text: string }>;
};

function mapFact(f: LeoAiEvidenceItem): LeoIntelligenceReasoningFact {
  return {
    id: f.id,
    sourceType: f.sourceType,
    statement: f.statement,
    provenanceLabel: f.provenanceLabel,
    truthState: f.truthState,
    canonicalRef: f.canonicalRef,
    trustClass: f.trustClass,
  };
}

/** Map existing LEO-10 evidence bundle → provider-neutral envelope. */
export function mapLeoAiEvidenceBundleToReasoningEnvelope(
  bundle: LeoAiEvidenceBundle,
): LeoIntelligenceReasoningEnvelope {
  const facts = bundle.facts.map(mapFact);
  return {
    question: bundle.question,
    intent: bundle.intent,
    facts,
    evidenceIds: facts.map((f) => f.id),
    unknowns: [...bundle.unknowns],
    limitations: [...bundle.limitations],
    policyNotes: bundle.policyNotes,
    governanceLevel: bundle.governanceLevel,
    governanceSummary: bundle.governanceSummary,
    approvalRequired: bundle.approvalRequired,
    executionAllowed: false,
    preparationAllowed: bundle.preparationAllowed,
    preparedStatus: bundle.preparedStatus,
    listingReasonUnknown: bundle.listingReasonUnknown,
    consequentialDecision: bundle.consequentialDecision,
    externalUntrustedNotes: [...bundle.externalUntrustedNotes],
    requiredOutputSchema: LEO_AI_REASONED_ANSWER_SCHEMA,
    recentConversationTurns: [...(bundle.recentConversationTurns ?? [])],
  };
}

/** Rebuild a LeoAiEvidenceBundle-shaped object for existing validation (ids/facts only). */
export function reasoningEnvelopeToValidationBundle(
  envelope: LeoIntelligenceReasoningEnvelope,
): LeoAiEvidenceBundle {
  return {
    correlationKey: `envelope:${envelope.intent}`,
    intent: envelope.intent,
    question: envelope.question,
    facts: envelope.facts.map((f) => ({
      id: f.id,
      sourceType: f.sourceType,
      statement: f.statement,
      provenanceLabel: f.provenanceLabel,
      truthState: f.truthState,
      canonicalRef: f.canonicalRef,
      trustClass: f.trustClass,
    })),
    unknowns: envelope.unknowns,
    limitations: envelope.limitations,
    governanceLevel: envelope.governanceLevel,
    governanceSummary: envelope.governanceSummary,
    approvalRequired: envelope.approvalRequired,
    executionAllowed: false,
    preparationAllowed: envelope.preparationAllowed,
    listingReasonUnknown: envelope.listingReasonUnknown,
    consequentialDecision: envelope.consequentialDecision,
    preparedStatus: envelope.preparedStatus,
    externalUntrustedNotes: envelope.externalUntrustedNotes,
    policyNotes: envelope.policyNotes,
    recentConversationTurns: [...(envelope.recentConversationTurns ?? [])],
  };
}
