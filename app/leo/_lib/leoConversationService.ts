/**
 * LEO-7 Conversation Service — owner-only evidence retrieval orchestration.
 * LEO-10: optional constrained synthesis after deterministic retrieval + governance.
 *
 * No writes. No external execution. No automatic Living Book writes.
 * Provider calls live in leoAi* modules — not inlined here.
 */
import "server-only";

import { getLeoAttentionBrief } from "@/app/leo/_lib/leoAttentionService";
import { getLeoClientCareWatch } from "@/app/leo/_lib/leoClientCareService";
import {
  answerStateFromEvidence,
  composeAttentionSummary,
  composeCapabilityOverviewSummary,
  composeClientCareSummary,
  composeDecisionSummary,
  composeGovernanceSummary,
  composeMemorySummary,
  composeProjectIntelligenceSummary,
  composeReasonSummary,
  suggestedQuestionsForIntent,
} from "@/app/leo/_lib/leoConversationComposer";
import {
  LEO_CONVERSATION_BOUNDS,
  routeLeoConversation,
} from "@/app/leo/_lib/leoConversationRouter";
import { assessLeoGovernance } from "@/app/leo/_lib/leoGovernanceEngine";
import { buildLeoDecisionBrief } from "@/app/leo/_lib/leoDecisionEngine";
import { leoListActiveMemoryForSubject, leoListRecentMemory } from "@/app/leo/_lib/leoLivingBookService";
import { getLeoListingReasonChain } from "@/app/leo/_lib/leoReasonChain";
import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { isConsequentialActionRequest } from "@/app/leo/_lib/leoPreparationEngine";
import { isLeoPreparationKind, runLeoPreparation } from "@/app/leo/_lib/leoPreparationService";
import { enrichLeoConversationWithAi } from "@/app/leo/_lib/leoAiReasoningEngine";
import {
  composeToolCatalogCapabilitySummary,
  getLeoToolCatalog,
} from "@/app/leo/_lib/leoToolCatalog";
import {
  composeLeoProjectIntelligenceSummary,
  getLeoProjectSnapshot,
} from "@/app/leo/_lib/leoProjectIntelligenceService";
import type {
  LeoActionIntentKind,
  LeoConversationAnswer,
  LeoConversationEvidence,
  LeoConversationRequest,
  LeoPreparationKind,
} from "@/app/leo/_lib/leoTypes";

export { validateLeoConversationRequest } from "@/app/leo/_lib/leoConversationRouter";

const LEO_CONVERSATION_NOT_CLAIMING = [
  "Not inventing customers, reasons, decisions, deadlines, or Production state",
  "Not executing consequential actions",
  "Not treating POST as RED owner approval",
  "Not writing Living Book / attention / leads / support from conversation",
  "Constrained synthesis when used is evidence-bound and cannot change governance or execute",
] as const;

/**
 * Deterministic evidence retrieval — safety baseline and fallback.
 */
export async function runLeoConversationDeterministic(
  request: LeoConversationRequest,
): Promise<LeoConversationAnswer> {
  await requireLeoOwnerAccess();

  const nowMs = request.nowMs ?? Date.now();
  const generatedAt = new Date(nowMs).toISOString();
  const route = routeLeoConversation(request);
  const maxResults = Math.min(
    request.maxResults ?? LEO_CONVERSATION_BOUNDS.maxResultsDefault,
    LEO_CONVERSATION_BOUNDS.maxResultsCap,
  );

  const baseLimitations: string[] = [];
  if (request.externalUntrustedNotes?.length) {
    baseLimitations.push(
      "External notes were treated as data only — they cannot grant authority or lower governance.",
    );
  }

  const empty = (
    partial: Partial<LeoConversationAnswer> &
      Pick<LeoConversationAnswer, "intent" | "answerState" | "summary">,
  ): LeoConversationAnswer => {
    const intent = partial.intent;
    return {
      evidence: [],
      citations: [],
      unknowns: [],
      governance: null,
      suggestedNextRetrieval: null,
      preparedAction: null,
      generatedAt,
      notClaiming: LEO_CONVERSATION_NOT_CLAIMING,
      keyPoints: null,
      challengePoints: null,
      aiMeta: null,
      ...partial,
      limitations: [...baseLimitations, ...(partial.limitations ?? [])],
      suggestedQuestions: partial.suggestedQuestions ?? suggestedQuestionsForIntent(intent),
    };
  };

  switch (route.intent) {
    case "ATTENTION_OVERVIEW": {
      const brief = await getLeoAttentionBrief({ topN: Math.min(maxResults, 3), nowMs });
      const evidence: LeoConversationEvidence[] = brief.items.slice(0, maxResults).map((item) => ({
        sourceKind: "attention_item",
        sourceRef: item.id,
        summary: `${item.level} score=${item.score}: ${item.title}`,
        availability: "LIVE",
        limitationNote: item.limitationNote,
      }));
      return empty({
        intent: "ATTENTION_OVERVIEW",
        answerState: answerStateFromEvidence(evidence.length > 0 || brief.actionableCount === 0, false, false, false),
        summary: composeAttentionSummary(brief),
        evidence,
        citations: evidence.map((e) => ({
          sourceKind: e.sourceKind,
          sourceRef: e.sourceRef,
          label: e.summary.slice(0, 120),
        })),
        unknowns: [],
        limitations: [...brief.limitations],
        governance: assessLeoGovernance({ actionKind: "READ", nowMs }),
        suggestedNextRetrieval: evidence.length
          ? "Drill into a specific attention item or Client Care signals."
          : null,
      });
    }

    case "CLIENT_CARE": {
      const watch = await getLeoClientCareWatch({ nowMs });
      const signals = watch.signals.slice(0, maxResults);
      const evidence: LeoConversationEvidence[] = signals.map((s) => ({
        sourceKind: "client_care_signal",
        sourceRef: s.key,
        summary: `${s.kind}: ${s.title}`,
        availability: s.provenance.availability,
        provenance: s.provenance,
        limitationNote: s.limitationNote,
      }));
      return empty({
        intent: "CLIENT_CARE",
        answerState: "ANSWERED",
        summary: composeClientCareSummary(watch),
        evidence,
        citations: evidence.map((e) => ({
          sourceKind: e.sourceKind,
          sourceRef: e.sourceRef,
          label: e.summary.slice(0, 120),
        })),
        limitations: [...watch.limitations],
        governance: assessLeoGovernance({ actionKind: "READ", nowMs }),
        suggestedNextRetrieval: "Open Launch Leads or support queues for operational follow-through.",
      });
    }

    case "LISTING_REASON": {
      const listingId = request.listingId?.trim() ?? "";
      if (!listingId) {
        return empty({
          intent: "LISTING_REASON",
          answerState: "INSUFFICIENT_EVIDENCE",
          summary: "A listing id is required for reason-chain retrieval. No entity was guessed.",
          unknowns: ["listingId"],
          suggestedNextRetrieval: "Retry with explicit listingId.",
          governance: assessLeoGovernance({ actionKind: "ANALYZE", nowMs }),
        });
      }
      const chain = await getLeoListingReasonChain(listingId);
      const evidence: LeoConversationEvidence[] = chain.evidence.slice(0, maxResults).map((e, i) => ({
        sourceKind: "listing_reason",
        sourceRef: e.sourceId ?? `${chain.entityId}:${i}`,
        summary: `${e.sourceType} quality=${e.quality}${e.humanReadableReason ? `: ${e.humanReadableReason.slice(0, 160)}` : ""}`,
        availability: e.quality === "MISSING" ? "UNAVAILABLE" : e.quality === "DERIVED" ? "PARTIAL" : "LIVE",
        limitationNote: chain.limitationNote,
      }));
      return empty({
        intent: "LISTING_REASON",
        answerState: chain.primaryReason ? "ANSWERED" : "PARTIALLY_ANSWERED",
        summary: composeReasonSummary(chain),
        evidence,
        citations: evidence.map((e) => ({
          sourceKind: e.sourceKind,
          sourceRef: e.sourceRef,
          label: e.summary.slice(0, 120),
        })),
        unknowns: chain.primaryReason ? [] : ["primary persisted reason"],
        limitations: [chain.limitationNote, ...chain.notClaiming].filter(Boolean) as string[],
        governance: assessLeoGovernance({ actionKind: "ANALYZE", nowMs }),
      });
    }

    case "MEMORY_LOOKUP": {
      const subject = request.memorySubject;
      const limit = Math.min(maxResults, LEO_CONVERSATION_BOUNDS.maxMemoryLookup);
      if (!subject?.subjectType?.trim() || !subject?.subjectKey?.trim()) {
        const recent = await leoListRecentMemory(Math.min(5, limit));
        return empty({
          intent: "MEMORY_LOOKUP",
          answerState: "INSUFFICIENT_EVIDENCE",
          summary:
            recent.length > 0
              ? `Memory subjectType/subjectKey required for targeted lookup. ${recent.length} recent record(s) exist globally (ids only, not dumped).`
              : "Memory subjectType/subjectKey required for targeted lookup. No subject was guessed from prose.",
          unknowns: ["memorySubject.subjectType", "memorySubject.subjectKey"],
          evidence: recent.slice(0, limit).map((r) => ({
            sourceKind: "leo_memory",
            sourceRef: r.id,
            summary: `${r.epistemicType} status=${r.status} subject=${r.subject.subjectType}:${r.subject.subjectKey}`,
            availability: "LIVE",
          })),
          suggestedNextRetrieval: "Retry with memorySubject { subjectType, subjectKey }.",
          governance: assessLeoGovernance({ actionKind: "READ", nowMs }),
        });
      }
      const records = await leoListActiveMemoryForSubject(subject.subjectType, subject.subjectKey, limit);
      const label = `${subject.subjectType}:${subject.subjectKey}`;
      const evidence: LeoConversationEvidence[] = records.map((r) => ({
        sourceKind: "leo_memory",
        sourceRef: r.id,
        summary: `${r.epistemicType}: ${r.statement.slice(0, 200)}`,
        availability: "LIVE",
      }));
      return empty({
        intent: "MEMORY_LOOKUP",
        answerState: "ANSWERED",
        summary: composeMemorySummary(records, label),
        evidence,
        citations: evidence.map((e) => ({
          sourceKind: e.sourceKind,
          sourceRef: e.sourceRef,
          label: e.summary.slice(0, 120),
        })),
        governance: assessLeoGovernance({ actionKind: "READ", nowMs }),
      });
    }

    case "DECISION_SUPPORT": {
      if (!request.decisionContext) {
        return empty({
          intent: "DECISION_SUPPORT",
          answerState: "INSUFFICIENT_EVIDENCE",
          summary: "Explicit decisionContext is required for decision support. No decision was invented.",
          unknowns: ["decisionContext"],
          suggestedNextRetrieval: "Provide structured decisionContext (question, options, facts).",
          governance: assessLeoGovernance({ actionKind: "ANALYZE", nowMs }),
        });
      }
      const brief = buildLeoDecisionBrief({ ...request.decisionContext, nowMs });
      const blocked = brief.governance.level === "NEVER";
      return empty({
        intent: "DECISION_SUPPORT",
        answerState: blocked
          ? "BLOCKED_BY_GOVERNANCE"
          : brief.recommendationState === "INSUFFICIENT_EVIDENCE"
            ? "INSUFFICIENT_EVIDENCE"
            : "ANSWERED",
        summary: composeDecisionSummary(brief),
        evidence: [
          {
            sourceKind: "decision_brief",
            sourceRef: brief.decisionKey,
            summary: `state=${brief.recommendationState}; challenges=${brief.challenges.length}`,
            availability: "LIVE",
          },
        ],
        citations: [
          {
            sourceKind: "decision_brief",
            sourceRef: brief.decisionKey,
            label: brief.question.slice(0, 120),
          },
        ],
        unknowns: [...brief.unknowns],
        limitations: [...brief.limitations],
        governance: brief.governance,
        suggestedNextRetrieval: brief.ownerDecisionRequired
          ? "Owner judgment required — POST is not RED approval."
          : null,
      });
    }

    case "CAPABILITY_OVERVIEW": {
      const catalog = getLeoToolCatalog(nowMs);
      const governance = assessLeoGovernance({ actionKind: "READ", nowMs });
      return empty({
        intent: "CAPABILITY_OVERVIEW",
        answerState: "ANSWERED",
        summary: composeCapabilityOverviewSummary(composeToolCatalogCapabilitySummary(catalog)),
        evidence: catalog.humanGroups.map((g) => ({
          sourceKind: "tool_catalog_group",
          sourceRef: g.label,
          summary: `${g.label} — ${g.status}`,
          availability: g.status === "available" ? ("LIVE" as const) : ("UNAVAILABLE" as const),
        })),
        citations: [
          {
            sourceKind: "tool_catalog",
            sourceRef: "leo-tool-registry",
            label: "LEO tool catalog",
          },
        ],
        limitations: [
          ...catalog.notConfigured.map((t) => `${t.name}: not configured`),
          "Background monitoring, notifications, Concierge connection, voice, and autonomous execution are not connected yet.",
        ],
        governance,
        suggestedNextRetrieval: "Ask about priorities, who is waiting, project status, or what LEO can prepare.",
        suggestedQuestions: [
          "What needs my attention?",
          "Who is waiting on us?",
          "What branch is LEO on?",
        ],
      });
    }

    case "PROJECT_INTELLIGENCE": {
      const snapshot = await getLeoProjectSnapshot({ nowMs });
      const governance = assessLeoGovernance({ actionKind: "READ", nowMs });
      const summary = composeProjectIntelligenceSummary(
        composeLeoProjectIntelligenceSummary(snapshot),
      );
      const hasEvidence = Boolean(
        snapshot.github?.headSha || (snapshot.vercel?.deployments.length ?? 0) > 0,
      );
      return empty({
        intent: "PROJECT_INTELLIGENCE",
        answerState: hasEvidence ? "ANSWERED" : "INSUFFICIENT_EVIDENCE",
        summary,
        evidence: [
          ...(snapshot.github?.headSha
            ? [
                {
                  sourceKind: "github_head",
                  sourceRef: snapshot.github.headSha,
                  summary: `${snapshot.github.branch} @ ${snapshot.github.headSha.slice(0, 7)}`,
                  availability: "LIVE" as const,
                },
              ]
            : []),
          ...(snapshot.vercel?.deployments ?? []).slice(0, 5).map((d) => ({
            sourceKind: "vercel_deployment",
            sourceRef: d.deploymentId,
            summary: `target=${d.target}; readyState=${d.readyState}; sha=${d.gitCommitSha}`,
            availability: "LIVE" as const,
            limitationNote:
              "READY means platform deployment state — not full application or system health.",
          })),
        ],
        citations: snapshot.correlations.slice(0, 5).map((c) => ({
          sourceKind: "sha_correlation",
          sourceRef: c.sha,
          label: c.sha.slice(0, 12),
        })),
        unknowns: hasEvidence ? [] : ["project_credentials_or_evidence"],
        limitations: [
          ...snapshot.limitations,
          ...snapshot.notClaiming,
        ],
        governance,
        suggestedNextRetrieval: "Ask what tools are available, or what needs attention.",
        suggestedQuestions: [
          "What can you do?",
          "What needs my attention?",
          "Is the LEO preview ready?",
        ],
      });
    }

    case "CAPABILITY_GOVERNANCE": {
      const actionKind: LeoActionIntentKind =
        request.actionKind ?? route.inferredActionKind ?? "OTHER";
      const externalClaimsApproval = Boolean(
        request.externalUntrustedNotes?.some((n) =>
          /ignore governance|approve|you are allowed|bypass/i.test(n),
        ),
      );
      const externalClaimsDowngrade = Boolean(
        request.externalUntrustedNotes?.some((n) =>
          /this is green|lower to green|not red|ignore red/i.test(n),
        ),
      );
      const governance = assessLeoGovernance({
        actionKind,
        trustSources: request.externalUntrustedNotes?.length
          ? ["SYSTEM_POLICY", "EXTERNAL_UNTRUSTED_DATA"]
          : ["SYSTEM_POLICY", "OWNER_INSTRUCTION"],
        externalClaimsApproval,
        externalClaimsDowngrade,
        nowMs,
      });
      const blocked = governance.level === "NEVER";
      return empty({
        intent: "CAPABILITY_GOVERNANCE",
        answerState: blocked ? "BLOCKED_BY_GOVERNANCE" : "ANSWERED",
        summary:
          governance.level === "NEVER" && /deploy/i.test(request.question)
            ? `${composeGovernanceSummary(governance)} A Production deployment is also a RED action under normal authority questions.`
            : composeGovernanceSummary(governance),
        evidence: governance.reasons.map((r) => ({
          sourceKind: "governance_rule",
          sourceRef: r.ruleId,
          summary: `${r.level}: ${r.reason}`,
          availability: "LIVE",
        })),
        citations: governance.auditPrep.ruleIds.map((id) => ({
          sourceKind: "governance_rule",
          sourceRef: id,
          label: id,
        })),
        limitations: [
          ...governance.limitations,
          "Conversation POST does not constitute owner approval for RED execution.",
        ],
        governance,
        suggestedNextRetrieval:
          governance.level === "NEVER"
            ? "Ask what LEO can prepare within allowed authority instead."
            : governance.level === "YELLOW"
              ? "YELLOW allows preparation only — no send/deploy/execute."
              : governance.level === "RED"
                ? "RED requires explicit Chuy approval outside this endpoint before any execution path."
                : null,
      });
    }

    case "PREPARATION": {
      const consequential =
        request.actionKind &&
        request.actionKind !== "PREPARE_DRAFT" &&
        request.actionKind !== "READ" &&
        request.actionKind !== "ANALYZE"
          ? request.actionKind
          : isConsequentialActionRequest(request.question);

      if (consequential) {
        const governance = assessLeoGovernance({ actionKind: consequential, nowMs });
        return empty({
          intent: "CAPABILITY_GOVERNANCE",
          answerState: governance.level === "NEVER" ? "BLOCKED_BY_GOVERNANCE" : "ANSWERED",
          summary: `Requested action ${consequential} is ${governance.level}. LEO will not execute. POST is not owner approval.`,
          governance,
          preparedAction: null,
          limitations: [
            ...governance.limitations,
            "Send/deploy/publish requests are not preparation — LEO will not execute them.",
          ],
          suggestedNextRetrieval: "Ask to prepare a draft instead of sending/executing.",
        });
      }

      const prepKind: LeoPreparationKind =
        request.preparationKind && isLeoPreparationKind(request.preparationKind)
          ? request.preparationKind
          : route.inferredPreparationKind && isLeoPreparationKind(route.inferredPreparationKind)
            ? route.inferredPreparationKind
            : "INTERNAL_TASK_DRAFT";

      const watcherKind =
        request.watcherKind ??
        (prepKind === "FOLLOW_UP_DRAFT" || prepKind === "CLIENT_CARE_PLAN"
          ? "FOLLOW_UP"
          : prepKind === "REVIEW_PLAN"
            ? "ATTENTION"
            : prepKind === "DECISION_BRIEF"
              ? "DECISION_REVIEW"
              : "CLIENT_CARE");

      const result = await runLeoPreparation({
        preparationKind: prepKind,
        watcherKind: prepKind === "DECISION_BRIEF" && !request.decisionContext ? null : watcherKind,
        entityId: request.entityId,
        decisionContext: request.decisionContext,
        requestedActionKind: null,
        maxFindings: maxResults,
        nowMs,
        question: request.question,
      });

      if (!result.preparation.ok || !result.preparation.prepared) {
        return empty({
          intent: "PREPARATION",
          answerState: "BLOCKED_BY_GOVERNANCE",
          summary: result.preparation.message,
          governance: result.preparation.governance,
          preparedAction: null,
          limitations: result.preparation.governance.limitations,
        });
      }

      const prepared = result.preparation.prepared;
      return empty({
        intent: "PREPARATION",
        answerState: "ANSWERED",
        summary: `YELLOW preparation ready: ${prepared.preparationKind.replace(/_/g, " ").toLowerCase()}. Status: prepared, not executed.`,
        evidence: (result.watcherResult?.findings ?? []).slice(0, maxResults).map((f) => ({
          sourceKind: "watcher_finding",
          sourceRef: f.key,
          summary: f.summary,
          availability: "LIVE" as const,
        })),
        citations: prepared.sourceEvidenceRefs.slice(0, 10).map((ref) => ({
          sourceKind: "preparation_evidence",
          sourceRef: ref,
          label: ref.slice(0, 120),
        })),
        unknowns: prepared.unknowns,
        limitations: prepared.limitations,
        governance: prepared.governance,
        preparedAction: prepared,
        suggestedNextRetrieval: "Review draftSteps. Any send/deploy remains a separate RED approval path.",
      });
    }

    default:
      return empty({
        intent: "UNKNOWN",
        answerState: "UNSUPPORTED_INTENT",
        summary:
          "I do not have a supported deterministic retrieval path for this question. No answer was fabricated.",
        unknowns: ["supported_intent"],
        suggestedNextRetrieval:
          "Try Attention, Client Care, Listing Reason (with listingId), Memory (with subject), Decision Support, Preparation, Capability overview, or Capability/Governance.",
        governance: assessLeoGovernance({ actionKind: "ANALYZE", nowMs }),
      });
  }
}

/**
 * Owner-admin conversation turn — deterministic retrieval, then optional constrained synthesis.
 */
export async function runLeoConversation(request: LeoConversationRequest): Promise<LeoConversationAnswer> {
  const deterministic = await runLeoConversationDeterministic(request);
  return enrichLeoConversationWithAi({ request, deterministic });
}
