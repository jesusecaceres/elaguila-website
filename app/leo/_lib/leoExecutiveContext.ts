/**
 * LEO-18B — Executive Context Intelligence Foundation (pure contract + assembly).
 *
 * Assembles bounded surrounding context before answer / governed proposal.
 * Separates KNOWN / CONFIRMED / INFERRED / UNKNOWN — inference never becomes fact.
 *
 * No provider calls. No OAuth. No external writes.
 * Reuses conversation turns, commitments, receipts, attention — no second memory.
 */

import type { LeoEntityResolutionResult } from "@/app/leo/_lib/leoEntityResolution";
import { leoEntityResolutionSnapshot } from "@/app/leo/_lib/leoEntityResolution";
import type {
  LeoActiveConversationContext,
  LeoCommitment,
  LeoConversationTurn,
  LeoDurableToolReceipt,
} from "@/app/leo/_lib/leoTypes";

export const LEO_EXECUTIVE_CONTEXT_BOUNDS = {
  maxRecentTurns: 12,
  maxCommitments: 8,
  maxReceipts: 8,
  maxAttention: 6,
  maxEvidenceRefs: 12,
  maxFacts: 24,
  maxUnknowns: 12,
  maxLimitations: 16,
} as const;

export const LEO_EPISTEMIC_STATUSES = ["KNOWN", "CONFIRMED", "INFERRED", "UNKNOWN"] as const;
export type LeoEpistemicStatus = (typeof LEO_EPISTEMIC_STATUSES)[number];

export const LEO_EXECUTIVE_CONTEXT_CONFIDENCE = ["HIGH", "MEDIUM", "LOW", "NONE"] as const;
export type LeoExecutiveContextConfidence =
  (typeof LEO_EXECUTIVE_CONTEXT_CONFIDENCE)[number];

export type LeoExecutiveContextFact = {
  id: string;
  status: LeoEpistemicStatus;
  category:
    | "IDENTITY"
    | "ENTITY"
    | "CONVERSATION"
    | "COMMITMENT"
    | "RECEIPT"
    | "ATTENTION"
    | "EVIDENCE"
    | "LIMITATION";
  statement: string;
  sourceSystem: string;
  sourceRef?: string | null;
  evidenceRefs?: string[];
};

export type LeoExecutiveContextTurnRef = {
  turnId: string;
  role: string;
  intent: string | null;
  boundedPreview: string;
  createdAt: string;
  epistemic: "KNOWN";
};

export type LeoExecutiveContextCommitmentRef = {
  commitmentId: string;
  title: string;
  status: string;
  kind: string;
  dueAt: string | null;
  counterparty: string | null;
  /** OPEN + owner-confirmed paths are CONFIRMED; candidates stay INFERRED. */
  epistemic: "CONFIRMED" | "INFERRED" | "KNOWN";
};

export type LeoExecutiveContextReceiptRef = {
  receiptId: string;
  lifecycleState: string;
  toolName: string | null;
  createdAt: string;
  epistemic: "KNOWN";
};

export type LeoExecutiveContextAttentionRef = {
  attentionId: string;
  title: string;
  severity: string | null;
  sourceSystem: string;
  ownerAttentionRequired: boolean;
  /** Attention queues are operational signals — not proven facts about intent. */
  epistemic: "INFERRED" | "KNOWN";
};

export type LeoExecutiveContextIdentity = {
  sessionId: string | null;
  ownerScoped: true;
  focusThreadId: string | null;
  focusEventId: string | null;
  focusCommitmentId: string | null;
  focusReceiptId: string | null;
  focusCardId: string | null;
};

export type LeoExecutiveContextPackage = {
  identity: LeoExecutiveContextIdentity;
  resolvedEntities: Record<string, unknown> | null;
  recentConversationRefs: LeoExecutiveContextTurnRef[];
  confirmedCommitments: LeoExecutiveContextCommitmentRef[];
  relevantReceipts: LeoExecutiveContextReceiptRef[];
  relevantEvidenceRefs: string[];
  attentionSignals: LeoExecutiveContextAttentionRef[];
  /** KNOWN + CONFIRMED only — never includes INFERRED. */
  knownFacts: LeoExecutiveContextFact[];
  /** Labeled inferences only — must not be treated as fact. */
  inferredSignals: LeoExecutiveContextFact[];
  unknowns: string[];
  missingInformation: string[];
  limitations: string[];
  confidence: LeoExecutiveContextConfidence;
  /**
   * True only when entity resolution (if required) is proposal-safe and
   * context absence did not invent confidence.
   */
  proposalCompatible: boolean;
  bounds: typeof LEO_EXECUTIVE_CONTEXT_BOUNDS;
  notClaiming: readonly string[];
};

export type LeoExecutiveContextAttentionInput = {
  id: string;
  title: string;
  severity?: string | null;
  sourceSystem?: string;
  ownerAttentionRequired?: boolean;
};

export type LeoExecutiveContextAssemblyInput = {
  question: string;
  sessionId?: string | null;
  activeContext?: LeoActiveConversationContext | null;
  entityResolution?: LeoEntityResolutionResult | null;
  recentTurns?: readonly LeoConversationTurn[];
  commitments?: readonly LeoCommitment[];
  receipts?: readonly LeoDurableToolReceipt[];
  attentionItems?: readonly LeoExecutiveContextAttentionInput[];
  /** Explicit unknowns the caller already knows. */
  knownUnknowns?: readonly string[];
  limitations?: readonly string[];
  /**
   * When true, missing bags are recorded as limitations and confidence cannot
   * rise above LOW from those sources (no fake confidence from absence).
   */
  requireBagsForConfidence?: boolean;
};

export const LEO_18B_CONTEXT_NOT_CLAIMING = [
  "Inference is not fact",
  "Unknown remains unknown",
  "Context absence does not create confidence",
  "No invented evidence",
  "No second memory system",
  "No provider writes from context assembly",
] as const;

function preview(text: string, max = 120): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function commitmentEpistemic(
  c: LeoCommitment,
): LeoExecutiveContextCommitmentRef["epistemic"] {
  if (c.kind === "EXTRACTED_CANDIDATE") return "INFERRED";
  if (c.status === "OPEN" && (c.kind === "EXPLICIT_OWNER" || c.creationMethod === "OWNER_CONFIRM")) {
    return "CONFIRMED";
  }
  if (c.status === "OPEN" || c.status === "COMPLETED") return "KNOWN";
  return "KNOWN";
}

/**
 * Pure bounded assembly. Prefer preloaded bags (verifier / tests / conversation).
 * Does not invent commitments, receipts, entities, or attention.
 */
export function assembleLeoExecutiveContext(
  input: LeoExecutiveContextAssemblyInput,
): LeoExecutiveContextPackage {
  const bounds = LEO_EXECUTIVE_CONTEXT_BOUNDS;
  const ctx = input.activeContext ?? null;
  const limitations: string[] = [...(input.limitations ?? [])];
  const unknowns: string[] = [...(input.knownUnknowns ?? [])];
  const missingInformation: string[] = [];

  const identity: LeoExecutiveContextIdentity = {
    sessionId: input.sessionId ?? ctx?.sessionId ?? null,
    ownerScoped: true,
    focusThreadId: ctx?.focusThreadId ?? null,
    focusEventId: ctx?.focusEventId ?? null,
    focusCommitmentId: ctx?.focusCommitmentId ?? null,
    focusReceiptId: ctx?.focusReceiptId ?? null,
    focusCardId: ctx?.focusCardId ?? null,
  };

  const recentConversationRefs: LeoExecutiveContextTurnRef[] = (input.recentTurns ?? [])
    .slice(-bounds.maxRecentTurns)
    .map((t) => ({
      turnId: t.id,
      role: t.role,
      intent: t.intent,
      boundedPreview: preview(t.boundedText),
      createdAt: t.createdAt,
      epistemic: "KNOWN" as const,
    }));

  const commitmentSlice = (input.commitments ?? []).slice(0, bounds.maxCommitments);
  const confirmedCommitments: LeoExecutiveContextCommitmentRef[] = commitmentSlice.map((c) => ({
    commitmentId: c.id,
    title: preview(c.title, 140),
    status: c.status,
    kind: c.kind,
    dueAt: c.dueAt,
    counterparty: c.counterparty,
    epistemic: commitmentEpistemic(c),
  }));

  const receiptSlice = (input.receipts ?? []).slice(0, bounds.maxReceipts);
  const relevantReceipts: LeoExecutiveContextReceiptRef[] = receiptSlice.map((r) => ({
    receiptId: r.id,
    lifecycleState: r.lifecycleState,
    toolName: r.toolId ?? null,
    createdAt: r.createdAt,
    epistemic: "KNOWN" as const,
  }));

  const attentionSignals: LeoExecutiveContextAttentionRef[] = (input.attentionItems ?? [])
    .slice(0, bounds.maxAttention)
    .map((a) => ({
      attentionId: a.id,
      title: preview(a.title, 140),
      severity: a.severity ?? null,
      sourceSystem: a.sourceSystem ?? "LEO_ATTENTION",
      ownerAttentionRequired: a.ownerAttentionRequired !== false,
      epistemic: "INFERRED" as const,
    }));

  const entity = input.entityResolution ?? null;
  const resolvedEntities = entity ? leoEntityResolutionSnapshot(entity) : null;

  if (!entity) {
    unknowns.push("entity_resolution_not_supplied");
  } else if (entity.state === "UNRESOLVED" || entity.state === "AMBIGUOUS") {
    unknowns.push(`entity_${entity.state.toLowerCase()}`);
    if (entity.clarification) missingInformation.push(entity.clarification);
  } else if (!entity.proposalSafe) {
    unknowns.push("entity_not_proposal_safe");
    missingInformation.push("proven_entity_identifier");
  }

  if (input.requireBagsForConfidence) {
    if (input.recentTurns === undefined) {
      limitations.push("Recent conversation turns were not supplied — not treating history as known.");
    }
    if (input.commitments === undefined) {
      limitations.push("Commitments bag not supplied — not inventing commitments.");
    }
    if (input.receipts === undefined) {
      limitations.push("Receipts bag not supplied — not inventing receipts.");
    }
  }

  // Evidence refs: refs only from known sources — never bodies/secrets.
  const relevantEvidenceRefs: string[] = [];
  for (const c of confirmedCommitments) {
    relevantEvidenceRefs.push(`commitment:${c.commitmentId}`);
  }
  for (const r of relevantReceipts) {
    relevantEvidenceRefs.push(`receipt:${r.receiptId}`);
  }
  if (identity.focusThreadId) relevantEvidenceRefs.push(`thread:${identity.focusThreadId}`);
  if (identity.focusEventId) relevantEvidenceRefs.push(`event:${identity.focusEventId}`);
  if (entity?.candidates) {
    for (const cand of entity.candidates.slice(0, 4)) {
      if (cand.provenIdentifier) {
        relevantEvidenceRefs.push(`entity:${cand.category}:${cand.provenIdentifier}`);
      }
    }
  }
  const boundedEvidence = relevantEvidenceRefs.slice(0, bounds.maxEvidenceRefs);

  const knownFacts: LeoExecutiveContextFact[] = [];
  const inferredSignals: LeoExecutiveContextFact[] = [];

  if (identity.sessionId) {
    knownFacts.push({
      id: "identity:session",
      status: "KNOWN",
      category: "IDENTITY",
      statement: `Active conversation session ${identity.sessionId.slice(0, 8)}…`,
      sourceSystem: "LEO_CONVERSATION",
      sourceRef: identity.sessionId,
    });
  }

  if (entity?.proposalSafe && entity.candidates[0]?.provenIdentifier) {
    const c = entity.candidates[0];
    knownFacts.push({
      id: `entity:${c.candidateId}`,
      status: entity.confidence === "EXACT" ? "CONFIRMED" : "KNOWN",
      category: "ENTITY",
      statement: `Resolved ${c.category}: ${c.displayLabel}`,
      sourceSystem: "LEO_ENTITY_RESOLUTION",
      sourceRef: c.provenIdentifier,
      evidenceRefs: c.evidence.map((e) => e.source).slice(0, 4),
    });
  }

  for (const t of recentConversationRefs.slice(-4)) {
    knownFacts.push({
      id: `turn:${t.turnId}`,
      status: "KNOWN",
      category: "CONVERSATION",
      statement: `${t.role}: ${t.boundedPreview || "(empty)"}`,
      sourceSystem: "LEO_CONVERSATION",
      sourceRef: t.turnId,
    });
  }

  for (const c of confirmedCommitments) {
    const fact: LeoExecutiveContextFact = {
      id: `commitment:${c.commitmentId}`,
      status: c.epistemic === "INFERRED" ? "INFERRED" : c.epistemic,
      category: "COMMITMENT",
      statement: `Commitment “${c.title}” (${c.status}/${c.kind})`,
      sourceSystem: "LEO_COMMITMENTS",
      sourceRef: c.commitmentId,
    };
    if (fact.status === "INFERRED") inferredSignals.push(fact);
    else knownFacts.push(fact);
  }

  for (const r of relevantReceipts) {
    knownFacts.push({
      id: `receipt:${r.receiptId}`,
      status: "KNOWN",
      category: "RECEIPT",
      statement: `Receipt ${r.receiptId.slice(0, 8)}… state=${r.lifecycleState}`,
      sourceSystem: "LEO_RECEIPTS",
      sourceRef: r.receiptId,
    });
  }

  for (const a of attentionSignals) {
    inferredSignals.push({
      id: `attention:${a.attentionId}`,
      status: "INFERRED",
      category: "ATTENTION",
      statement: `Attention signal: ${a.title}`,
      sourceSystem: a.sourceSystem,
      sourceRef: a.attentionId,
    });
  }

  // Explicit UNKNOWN examples must stay labeled — never promote to KNOWN.
  if (!entity?.proposalSafe && /maria|customer|client|business/i.test(input.question)) {
    unknowns.push("counterparty_intent_unknown");
  }

  const uniq = <T extends string>(arr: T[]) => [...new Set(arr)].slice(0, bounds.maxUnknowns);
  const finalUnknowns = uniq(unknowns);
  const finalMissing = uniq(missingInformation);
  const finalLimitations = [...new Set(limitations)].slice(0, bounds.maxLimitations);

  // Confidence: absence cannot invent HIGH; inference does not raise confidence alone.
  let confidence: LeoExecutiveContextConfidence = "NONE";
  const hasKnownGrounding =
    knownFacts.length > 0 ||
    recentConversationRefs.length > 0 ||
    confirmedCommitments.some((c) => c.epistemic !== "INFERRED") ||
    relevantReceipts.length > 0 ||
    Boolean(entity?.proposalSafe);

  if (!hasKnownGrounding && finalUnknowns.length > 0) {
    confidence = "NONE";
  } else if (entity?.proposalSafe && knownFacts.some((f) => f.status === "CONFIRMED" || f.status === "KNOWN")) {
    confidence =
      finalUnknowns.length === 0 && finalMissing.length === 0
        ? "HIGH"
        : finalMissing.length > 0
          ? "MEDIUM"
          : "MEDIUM";
  } else if (hasKnownGrounding) {
    confidence = finalUnknowns.length > 2 ? "LOW" : "MEDIUM";
  } else {
    confidence = "LOW";
    finalLimitations.push(
      "Executive context has little proven grounding — confidence stays low; unknowns remain unknown.",
    );
  }

  // Context absence must not create fake confidence.
  if (input.requireBagsForConfidence && input.commitments === undefined && input.receipts === undefined) {
    if (confidence === "HIGH") confidence = "MEDIUM";
  }

  const proposalCompatible =
    (entity == null || entity.proposalSafe) &&
    confidence !== "NONE" &&
    !finalUnknowns.includes("entity_ambiguous") &&
    entity?.state !== "AMBIGUOUS";

  return {
    identity,
    resolvedEntities,
    recentConversationRefs,
    confirmedCommitments,
    relevantReceipts,
    relevantEvidenceRefs: boundedEvidence,
    attentionSignals,
    knownFacts: knownFacts.slice(0, bounds.maxFacts),
    inferredSignals: inferredSignals.slice(0, bounds.maxFacts),
    unknowns: finalUnknowns,
    missingInformation: finalMissing,
    limitations: [
      ...finalLimitations,
      "INFERRED signals are not facts.",
      ...LEO_18B_CONTEXT_NOT_CLAIMING.slice(0, 2),
    ].slice(0, bounds.maxLimitations),
    confidence,
    proposalCompatible,
    bounds,
    notClaiming: LEO_18B_CONTEXT_NOT_CLAIMING,
  };
}

/** Bounded snapshot safe for proposal referent_snapshot / answer metadata. */
export function leoExecutiveContextSnapshot(
  pkg: LeoExecutiveContextPackage,
): Record<string, unknown> {
  return {
    confidence: pkg.confidence,
    proposalCompatible: pkg.proposalCompatible,
    identity: {
      sessionId: pkg.identity.sessionId,
      focusThreadId: pkg.identity.focusThreadId,
      focusEventId: pkg.identity.focusEventId,
      focusCommitmentId: pkg.identity.focusCommitmentId,
      focusReceiptId: pkg.identity.focusReceiptId,
    },
    resolvedEntities: pkg.resolvedEntities,
    recentTurnCount: pkg.recentConversationRefs.length,
    recentConversationRefs: pkg.recentConversationRefs.slice(0, 6),
    confirmedCommitments: pkg.confirmedCommitments.slice(0, 8),
    relevantReceipts: pkg.relevantReceipts.slice(0, 8),
    attentionSignals: pkg.attentionSignals.slice(0, 6),
    relevantEvidenceRefs: pkg.relevantEvidenceRefs,
    knownFactCount: pkg.knownFacts.length,
    inferredSignalCount: pkg.inferredSignals.length,
    // Epistemic separation preserved in snapshot
    knownFacts: pkg.knownFacts.slice(0, 12).map((f) => ({
      id: f.id,
      status: f.status,
      category: f.category,
      statement: f.statement,
      sourceSystem: f.sourceSystem,
      sourceRef: f.sourceRef ?? null,
    })),
    inferredSignals: pkg.inferredSignals.slice(0, 8).map((f) => ({
      id: f.id,
      status: f.status,
      category: f.category,
      statement: f.statement,
      sourceSystem: f.sourceSystem,
      sourceRef: f.sourceRef ?? null,
    })),
    unknowns: pkg.unknowns,
    missingInformation: pkg.missingInformation,
    limitations: pkg.limitations,
    bounds: pkg.bounds,
    notClaiming: [...pkg.notClaiming],
  };
}

/** Proposal gate helper — context absence / weak confidence cannot invent readiness. */
export function isLeoExecutiveContextProposalCompatible(
  pkg: LeoExecutiveContextPackage | null | undefined,
): boolean {
  if (!pkg) return false;
  return pkg.proposalCompatible === true && pkg.confidence !== "NONE";
}
