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
  composeCommunicationIntelligenceSummary,
  composeGoogleConnectionDiagnosticSummary,
  composeReasonSummary,
  isLeoGoogleDiagnosticQuestion,
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
  buildLeoActiveConversationContext,
  buildTurnContextRefs,
  extractEntityRefsFromCards,
  extractReceiptIdsFromAnswer,
  extractRefsFromResultCard,
  extractResultCardRefsFromAnswer,
  LEO_ACTIVE_CONTEXT_TURN_WINDOW,
} from "@/app/leo/_lib/leoConversationContext";
import {
  referentBlocksMutation,
  resolveLeoConversationReferent,
} from "@/app/leo/_lib/leoConversationReferents";
import {
  leoAppendConversationTurn,
  leoAppendUserTurnIdempotent,
  leoEnsureConversationSession,
  leoListActiveConversationContextTurns,
} from "@/app/leo/_lib/leoConversationSessionService";
import type {
  LeoActiveConversationContext,
  LeoActionIntentKind,
  LeoConversationAnswer,
  LeoConversationEvidence,
  LeoConversationPersistenceState,
  LeoConversationRequest,
  LeoConversationTurn,
  LeoPreparationKind,
  LeoResultCard,
} from "@/app/leo/_lib/leoTypes";
import {
  composeToolCatalogCapabilitySummary,
  getLeoToolCatalog,
} from "@/app/leo/_lib/leoToolCatalog";
import {
  composeLeoProjectIntelligenceSummary,
  getLeoProjectExecutiveSnapshot,
} from "@/app/leo/_lib/leoProjectIntelligenceService";
import {
  getLeoCommunicationExecutiveSnapshot,
  getLeoMeetingIntelligenceForNext,
} from "@/app/leo/_lib/leoCommunicationIntelligenceService";
import { getLeoMorningBrief } from "@/app/leo/_lib/leoMorningBriefService";
import {
  composeLeoExecutiveReportingSummary,
  executiveSignalsToResultCards,
  filterExecutiveSnapshotByQuestion,
  getLeoExecutiveReportingSnapshot,
} from "@/app/leo/_lib/leoExecutiveReportingService";
import {
  composeLeoBusinessConciergeExecutiveSummary,
} from "@/app/leo/_lib/leoBusinessConciergeBridge";
import { getLeoBusinessConciergeContextFromRefs } from "@/app/leo/_lib/leoBusinessConciergeBridgeService";
import { mapConciergeContextToResultCard } from "@/app/leo/_lib/leoResultCards";
import {
  buildLeoCommitmentIntelligence,
  cardDueStateForCommitment,
  parseLeoCommitmentQueryKind,
} from "@/app/leo/_lib/leoCommitmentIntelligence";
import { leoListCommitments } from "@/app/leo/_lib/leoCommitmentService";
import { leoListOwnerAttentionAcks } from "@/app/leo/_lib/leoAttentionAckService";
import {
  decorateCommitmentCardsWithDispositions,
  decorateEmailCardsWithDispositions,
} from "@/app/leo/_lib/leoAttentionRuntime";
import {
  buildLeoReceiptIntelligence,
  parseLeoReceiptQueryKind,
} from "@/app/leo/_lib/leoReceiptIntelligence";
import { leoListRecentToolReceipts } from "@/app/leo/_lib/leoToolReceiptService";

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

  // Owner-only Google connection diagnostic — does not require COMMUNICATION_INTELLIGENCE route.
  if (isLeoGoogleDiagnosticQuestion(request.question)) {
    const snap = await getLeoCommunicationExecutiveSnapshot({
      nowMs,
      question: request.question,
      subtype: "EMAIL",
    });
    const summary = composeGoogleConnectionDiagnosticSummary(snap.runtimeDiagnostic);
    return empty({
      intent: "COMMUNICATION_INTELLIGENCE",
      answerState: "ANSWERED",
      summary,
      limitations: [
        ...snap.limitations,
        "Diagnostic reports sanitized status codes only — no secrets or provider payloads.",
      ],
      unknowns: snap.unknowns,
      suggestedQuestions: [
        "Who emailed me?",
        "What meetings do I have today?",
        "Diagnose Google connection.",
      ],
    });
  }

  switch (route.intent) {
    case "MORNING_BRIEF": {
      const brief = await getLeoMorningBrief({ nowMs });
      const cards = brief.sections.flatMap((s) => s.cards).slice(0, maxResults);
      const evidence: LeoConversationEvidence[] = brief.topPriorities.map((p) => ({
        sourceKind: "morning_brief_priority",
        sourceRef: p.evidenceRef ?? p.cardId ?? `priority-${p.rank}`,
        summary: `${p.what}: ${p.why}`.slice(0, 160),
        availability: "LIVE",
        limitationNote: null,
      }));
      return empty({
        intent: "MORNING_BRIEF",
        answerState: brief.overallState === "UNAVAILABLE" ? "INSUFFICIENT_EVIDENCE" : "ANSWERED",
        summary: brief.headline,
        spokenSummary: brief.spokenSummary,
        keyPoints: brief.topPriorities.map((p) => ({
          kind: "FACT" as const,
          text: `${p.what} — ${p.why}${p.dueOrTime ? ` (${p.dueOrTime})` : ""}`,
          evidenceIds: [],
        })),
        resultCards: cards,
        evidence,
        citations: evidence.map((e) => ({
          sourceKind: e.sourceKind,
          sourceRef: e.sourceRef,
          label: e.summary.slice(0, 120),
        })),
        unknowns: brief.unknowns,
        limitations: brief.limitations,
        governance: assessLeoGovernance({ actionKind: "READ", nowMs }),
        suggestedQuestions: [
          "Who is waiting on me?",
          "Show overdue commitments.",
          "What can wait?",
          "Prepare me for my next meeting.",
          "What did LEO prepare?",
        ],
        suggestedNextRetrieval: "Ask about a specific section or drill into commitments or email.",
      });
    }

    case "EXECUTIVE_REPORTING": {
      const full = await getLeoExecutiveReportingSnapshot({ nowMs, limit: 8 });
      const snap = filterExecutiveSnapshotByQuestion(full, request.question ?? "");
      const cards = executiveSignalsToResultCards(
        [...snap.attention, ...snap.signals.filter((s) => !s.ownerAttentionRequired)].slice(0, maxResults),
      );
      const evidence: LeoConversationEvidence[] = snap.signals.slice(0, 12).map((s) => ({
        sourceKind: `exec_${s.domain.toLowerCase()}`,
        sourceRef: s.signalId,
        summary: s.title.slice(0, 160),
        availability: s.availability === "AVAILABLE" || s.availability === "EMPTY" ? "LIVE" : "PARTIAL",
        limitationNote: s.availability === "UNAVAILABLE" ? "Source unavailable." : null,
      }));
      return empty({
        intent: "EXECUTIVE_REPORTING",
        answerState: snap.overallAvailability === "UNAVAILABLE" ? "INSUFFICIENT_EVIDENCE" : "ANSWERED",
        summary: composeLeoExecutiveReportingSummary(snap),
        spokenSummary: composeLeoExecutiveReportingSummary(snap),
        keyPoints: snap.attention.slice(0, 5).map((s) => ({
          kind: "FACT" as const,
          text: s.title,
          evidenceIds: [],
        })),
        resultCards: cards,
        evidence,
        citations: evidence.map((e) => ({
          sourceKind: e.sourceKind,
          sourceRef: e.sourceRef,
          label: e.summary.slice(0, 120),
        })),
        unknowns: snap.adapterHealth
          .filter((h) => h.availability === "UNAVAILABLE" || h.availability === "NOT_IMPLEMENTED")
          .map((h) => h.domain.toLowerCase()),
        limitations: snap.limitations,
        governance: assessLeoGovernance({ actionKind: "READ", nowMs }),
        suggestedQuestions: [
          "How are newsletters doing?",
          "Show sales and payment issues.",
          "What is happening in Iglesias?",
          "What needs my attention?",
        ],
        suggestedNextRetrieval: "Open a specific admin queue or ask about one domain.",
      });
    }

    case "BUSINESS_CONCIERGE_CONTEXT": {
      const result = await getLeoBusinessConciergeContextFromRefs({
        nowMs,
        selectedEntityRef: request.clientContext?.selectedEntityRef,
        focusEntityRef: request.clientContext?.selectedEntityRef,
        requiresBusinessTarget: true,
      });

      if (result.status === "AMBIGUOUS") {
        return empty({
          intent: "BUSINESS_CONCIERGE_CONTEXT",
          answerState: "INSUFFICIENT_EVIDENCE",
          summary: result.clarification,
          unknowns: ["business_ref_ambiguous"],
          suggestedNextRetrieval: "Select one client or lead card, then ask again.",
          governance: assessLeoGovernance({ actionKind: "READ", nowMs }),
        });
      }

      if (result.status === "NONE") {
        return empty({
          intent: "BUSINESS_CONCIERGE_CONTEXT",
          answerState: "INSUFFICIENT_EVIDENCE",
          summary: result.summary,
          unknowns: ["business_ref_unresolved"],
          limitations: [
            "Business Concierge bridge requires a canonical business identity — LEO will not guess from display name alone.",
          ],
          suggestedNextRetrieval: "Select a client-care card or specify a lead from Launch Leads.",
          governance: assessLeoGovernance({ actionKind: "READ", nowMs }),
          suggestedQuestions: [
            "Who is waiting on me?",
            "What can concierge do for this business?",
          ],
        });
      }

      const ctx = result.context;
      const card = mapConciergeContextToResultCard(ctx);
      const evidence: LeoConversationEvidence[] = ctx.evidenceRefs.slice(0, maxResults).map((ref) => ({
        sourceKind: "business_concierge",
        sourceRef: ref,
        summary: ref.slice(0, 120),
        availability: ctx.availability === "UNAVAILABLE" ? "UNAVAILABLE" : "LIVE",
        limitationNote: null,
      }));

      return empty({
        intent: "BUSINESS_CONCIERGE_CONTEXT",
        answerState:
          ctx.availability === "UNAVAILABLE" ? "INSUFFICIENT_EVIDENCE" : "ANSWERED",
        summary: composeLeoBusinessConciergeExecutiveSummary(ctx),
        spokenSummary: ctx.spokenSummary,
        keyPoints: [
          ...(ctx.profileSummary
            ? [{ kind: "FACT" as const, text: ctx.profileSummary, evidenceIds: [] }]
            : []),
          ...ctx.openNeeds.slice(0, 3).map((n) => ({
            kind: "UNKNOWN" as const,
            text: n,
            evidenceIds: [] as string[],
          })),
        ],
        resultCards: [card],
        evidence,
        citations: evidence.map((e) => ({
          sourceKind: e.sourceKind,
          sourceRef: e.sourceRef,
          label: e.summary.slice(0, 120),
        })),
        unknowns: ctx.unknowns,
        limitations: ctx.limitations,
        governance: assessLeoGovernance({ actionKind: "READ", nowMs }),
        suggestedQuestions: [
          "Who is waiting on me?",
          "What tools can help this client?",
          "What is missing from this business profile?",
        ],
        suggestedNextRetrieval: "Open Launch Leads for operational follow-through — LEO does not run Concierge.",
      });
    }

    case "ATTENTION_OVERVIEW": {
      const brief = await getLeoAttentionBrief({ topN: Math.min(maxResults, 3), nowMs });
      const visible = brief.visibleItems ?? brief.items;
      const evidence: LeoConversationEvidence[] = visible.slice(0, maxResults).map((item) => ({
        sourceKind: "attention_item",
        sourceRef: item.id,
        summary: `${item.level} score=${item.score}: ${item.title}`,
        availability: "LIVE",
        limitationNote: item.limitationNote,
      }));
      return empty({
        intent: "ATTENTION_OVERVIEW",
        answerState: answerStateFromEvidence(
          evidence.length > 0 || brief.actionableCount === 0,
          false,
          false,
          false,
        ),
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
      const exec = await getLeoProjectExecutiveSnapshot({
        nowMs,
        question: request.question,
      });
      const governance = assessLeoGovernance({ actionKind: "READ", nowMs });
      const summary = composeProjectIntelligenceSummary(
        composeLeoProjectIntelligenceSummary(exec),
      );
      const hasEvidence = Boolean(
        exec.leoHead.sha ||
          exec.latestLeoPreview ||
          exec.latestProduction ||
          exec.recentChanges.length > 0,
      );
      return empty({
        intent: "PROJECT_INTELLIGENCE",
        answerState: hasEvidence ? "ANSWERED" : "INSUFFICIENT_EVIDENCE",
        summary,
        evidence: [
          ...(exec.leoHead.sha
            ? [
                {
                  sourceKind: "github_head",
                  sourceRef: exec.leoHead.sha,
                  summary: `${exec.leoBranch} @ ${exec.leoHead.sha.slice(0, 7)}`,
                  availability: "LIVE" as const,
                },
              ]
            : []),
          ...(exec.mainHead.sha
            ? [
                {
                  sourceKind: "github_main_head",
                  sourceRef: exec.mainHead.sha,
                  summary: `main @ ${exec.mainHead.sha.slice(0, 7)}`,
                  availability: "LIVE" as const,
                },
              ]
            : []),
          ...exec.recentChanges.slice(0, 5).map((c) => ({
            sourceKind: "github_commit",
            sourceRef: c.sha,
            summary: `${c.classification}: ${c.message.split("\n")[0] ?? ""}`.replace(
              /\bco-authored-by:.*$/i,
              "",
            ).trim(),
            availability: "LIVE" as const,
          })),
          ...(exec.latestLeoPreview
            ? [
                {
                  sourceKind: "vercel_preview",
                  sourceRef: exec.latestLeoPreview.deploymentId,
                  summary: `Preview readyState=${exec.latestLeoPreview.readyState}; sha=${exec.latestLeoPreview.gitCommitSha}`,
                  availability: "LIVE" as const,
                  limitationNote:
                    "READY means Vercel deployment state READY — not system health.",
                },
              ]
            : []),
          ...(exec.latestProduction
            ? [
                {
                  sourceKind: "vercel_production",
                  sourceRef: exec.latestProduction.deploymentId,
                  summary: `Production readyState=${exec.latestProduction.readyState}; sha=${exec.latestProduction.gitCommitSha}`,
                  availability: "LIVE" as const,
                  limitationNote:
                    "READY means Vercel deployment state READY — not system health.",
                },
              ]
            : []),
          ...exec.correlation.states.slice(0, 6).map((s) => ({
            sourceKind: "project_correlation",
            sourceRef: s,
            summary: s.replace(/_/g, " "),
            availability: "LIVE" as const,
          })),
          {
            sourceKind: "project_qa_advice",
            sourceRef: exec.qaAdvice.state,
            summary: exec.qaAdvice.summary,
            availability: "LIVE" as const,
          },
        ],
        citations: exec.timeline.slice(0, 8).map((t) => ({
          sourceKind: t.type.toLowerCase(),
          sourceRef: t.id,
          label: t.label.slice(0, 80),
        })),
        unknowns: hasEvidence ? [] : ["project_credentials_or_evidence"],
        limitations: [
          ...exec.limitations,
          ...exec.notClaiming,
          ...exec.qaAdvice.limitations.filter((l) => /does not recommend deploying/i.test(l)),
        ],
        governance,
        suggestedNextRetrieval: "Ask what changed recently, or what needs attention outside project status.",
        suggestedQuestions: [
          "What changed recently?",
          "What should I QA next?",
          "What needs my attention?",
        ],
      });
    }

    case "COMMUNICATION_INTELLIGENCE": {
      const subtype = route.inferredCommunicationSubtype ?? "EMAIL";
      const snap = await getLeoCommunicationExecutiveSnapshot({
        nowMs,
        question: request.question,
        subtype,
      });

      // Inject external untrusted notes from email/calendar text for governance immunity tests
      const externalInjectionNotes = [
        ...(request.externalUntrustedNotes ?? []),
        ...snap.gmail.recentMessages
          .slice(0, 3)
          .map((m) => m.snippet)
          .filter((s): s is string => Boolean(s)),
        ...[snap.calendar.nextEvent?.description]
          .filter((s): s is string => Boolean(s)),
      ];

      if (subtype === "MEETING_PREP") {
        const meetingIntel = await getLeoMeetingIntelligenceForNext({ nowMs });
        const prep = await runLeoPreparation({
          preparationKind: "MEETING_BRIEF",
          watcherKind: null,
          nowMs,
          question: request.question,
        });
        const governance = prep.preparation.ok
          ? prep.preparation.prepared.governance
          : prep.preparation.governance;
        const prepared = prep.preparation.ok ? prep.preparation.prepared : null;
        const summary = composeCommunicationIntelligenceSummary(snap, "MEETING_PREP");
        return empty({
          intent: "COMMUNICATION_INTELLIGENCE",
          answerState: prepared ? "ANSWERED" : "INSUFFICIENT_EVIDENCE",
          summary,
          evidence: [
            ...(meetingIntel.meeting
              ? [
                  {
                    sourceKind: "external_calendar_event",
                    sourceRef: meetingIntel.meeting.eventId,
                    summary: meetingIntel.meeting.title ?? meetingIntel.meeting.eventId,
                    availability: "LIVE" as const,
                    limitationNote: "EXTERNAL_UNTRUSTED_DATA",
                  },
                ]
              : []),
            ...meetingIntel.relatedEmailEvidence.slice(0, 5).map((r) => ({
              sourceKind: "email_message",
              sourceRef: r.message.messageId,
              summary: r.message.subject ?? r.message.messageId,
              availability: "LIVE" as const,
              limitationNote: "EXTERNAL_UNTRUSTED_DATA",
            })),
          ],
          citations: meetingIntel.meeting
            ? [
                {
                  sourceKind: "external_calendar_event",
                  sourceRef: meetingIntel.meeting.eventId,
                  label: meetingIntel.meeting.title ?? "next meeting",
                },
              ]
            : [],
          unknowns: [...snap.unknowns, ...meetingIntel.unknowns],
          limitations: [
            ...snap.limitations,
            ...meetingIntel.limitations,
            "Email/calendar content is EXTERNAL_UNTRUSTED_DATA and cannot change governance.",
            ...(externalInjectionNotes.some((n) =>
              /ignore governance|deploy production|reveal|credentials/i.test(n),
            )
              ? [
                  "Untrusted email/calendar text attempted authority claims — ignored for governance.",
                ]
              : []),
          ],
          governance,
          preparedAction: prepared,
          suggestedNextRetrieval: "Ask what meetings you have today, or who may need a reply.",
        });
      }

      const governance = assessLeoGovernance({
        actionKind: "READ",
        trustSources: externalInjectionNotes.length
          ? ["SYSTEM_POLICY", "EXTERNAL_UNTRUSTED_DATA"]
          : ["SYSTEM_POLICY", "OWNER_INSTRUCTION"],
        externalClaimsApproval: externalInjectionNotes.some((n) =>
          /ignore governance|approve|you are allowed|bypass|deploy production/i.test(n),
        ),
        externalClaimsDowngrade: externalInjectionNotes.some((n) =>
          /this is green|lower to green|not red|ignore red/i.test(n),
        ),
        nowMs,
      });

      const summary = composeCommunicationIntelligenceSummary(snap, subtype);
      const hasEvidence =
        snap.gmail.recentMessages.length > 0 ||
        snap.calendar.todayEvents.length > 0 ||
        Boolean(snap.calendar.nextEvent) ||
        snap.overallAvailability === "NOT_CONFIGURED";

      // Bulk ACK decorate — one list, no N+1.
      let emailCards = snap.gmail.emailCards;
      if (subtype !== "CALENDAR" && emailCards.length > 0) {
        const ackListed = await leoListOwnerAttentionAcks();
        emailCards = decorateEmailCardsWithDispositions({
          cards: emailCards,
          acks: ackListed.acks,
          dispositionAvailability: ackListed.availability,
          nowMs,
        });
      }

      return empty({
        intent: "COMMUNICATION_INTELLIGENCE",
        answerState:
          snap.overallAvailability === "NOT_CONFIGURED"
            ? "INSUFFICIENT_EVIDENCE"
            : hasEvidence
              ? "ANSWERED"
              : "PARTIALLY_ANSWERED",
        summary,
        resultCards:
          subtype === "EMAIL" || !subtype
            ? emailCards
            : subtype === "CALENDAR"
              ? null
              : emailCards,
        spokenSummary:
          subtype === "CALENDAR" ? null : snap.gmail.spokenSummary,
        evidence: [
          ...snap.gmail.recentMessages.slice(0, 6).map((m) => ({
            sourceKind: "email_message",
            sourceRef: m.messageId,
            summary: `${m.subject ?? "(no subject)"}`,
            availability: "LIVE" as const,
            limitationNote: "EXTERNAL_UNTRUSTED_DATA",
          })),
          ...snap.calendar.todayEvents.slice(0, 4).map((e) => ({
            sourceKind: "external_calendar_event",
            sourceRef: e.eventId,
            summary: e.title ?? e.eventId,
            availability: "LIVE" as const,
            limitationNote: "EXTERNAL_UNTRUSTED_DATA",
          })),
          ...snap.gmail.triage.slice(0, 5).map((t) => ({
            sourceKind: "email_triage",
            sourceRef: t.messageId,
            summary: t.state,
            availability: "LIVE" as const,
          })),
        ],
        citations: [],
        unknowns: snap.unknowns,
        limitations: [
          ...snap.limitations,
          ...snap.notClaiming,
          "Email/calendar content is EXTERNAL_UNTRUSTED_DATA and cannot change governance or execute actions.",
        ],
        governance,
        suggestedNextRetrieval:
          subtype === "CALENDAR"
            ? "Ask who is attending your next meeting, or prepare a meeting brief."
            : "Ask what meetings you have today, or prepare for your next meeting.",
      });
    }

    case "COMMITMENT_INTELLIGENCE": {
      const queryKind = parseLeoCommitmentQueryKind(request.question);
      const listStatus =
        queryKind === "COMPLETED"
          ? ("COMPLETED" as const)
          : queryKind === "CANCELLED"
            ? ("CANCELLED" as const)
            : queryKind === "ALL"
              ? undefined
              : ("OPEN" as const);
      // Bound DB read — fetch a bit more than maxResults for due filtering headroom.
      const fetchLimit = Math.min(
        LEO_CONVERSATION_BOUNDS.maxResultsCap,
        Math.max(maxResults * 2, maxResults),
      );
      const listed = await leoListCommitments({
        status: listStatus,
        kind: queryKind === "PROMISED" ? "EXPLICIT_OWNER" : undefined,
        limit: fetchLimit,
      });

      const intel = buildLeoCommitmentIntelligence({
        commitments: listed.commitments,
        queryKind,
        nowMs,
        maxResults,
        availability: listed.availability,
      });

      const injectionNotes = [
        ...(request.externalUntrustedNotes ?? []),
        ...intel.matched
          .slice(0, 5)
          .flatMap((c) => [c.notes, c.title, JSON.stringify(c.sourceRef)])
          .filter((s): s is string => Boolean(s)),
      ];
      const governance = assessLeoGovernance({
        actionKind: "READ",
        trustSources: injectionNotes.some((n) =>
          /ignore governance|deploy production|bypass/i.test(n),
        )
          ? ["SYSTEM_POLICY", "EXTERNAL_UNTRUSTED_DATA"]
          : ["SYSTEM_POLICY", "OWNER_INSTRUCTION"],
        externalClaimsApproval: injectionNotes.some((n) =>
          /ignore governance|deploy production|bypass|approve/i.test(n),
        ),
        nowMs,
      });

      const evidence: LeoConversationEvidence[] = intel.matched.map((c) => ({
        sourceKind: "leo_commitment",
        sourceRef: c.id,
        summary: `${c.kind}/${c.status}/${cardDueStateForCommitment(c, nowMs)}: ${c.title}`.slice(
          0,
          160,
        ),
        availability: listed.availability === "UNAVAILABLE" ? "UNAVAILABLE" : "LIVE",
        limitationNote:
          c.kind === "EXTRACTED_CANDIDATE"
            ? "Candidate — not a confirmed owner promise"
            : c.notes
              ? "Commitment notes may include EXTERNAL_UNTRUSTED_DATA"
              : null,
      }));

      const ackListed = await leoListOwnerAttentionAcks();
      const decoratedCards = decorateCommitmentCardsWithDispositions({
        cards: intel.cards,
        acks: ackListed.acks,
        dispositionAvailability: ackListed.availability,
        nowMs,
      });

      return empty({
        intent: "COMMITMENT_INTELLIGENCE",
        answerState:
          listed.availability === "UNAVAILABLE"
            ? "INSUFFICIENT_EVIDENCE"
            : intel.matched.length > 0
              ? "ANSWERED"
              : "ANSWERED",
        summary: intel.summary,
        resultCards: decoratedCards,
        spokenSummary: intel.spokenSummary,
        evidence,
        citations: evidence.map((e) => ({
          sourceKind: e.sourceKind,
          sourceRef: e.sourceRef,
          label: e.summary.slice(0, 120),
        })),
        unknowns: intel.unknowns,
        limitations: [
          ...intel.limitations,
          ...(injectionNotes.some((n) =>
            /ignore governance|deploy production/i.test(n),
          )
            ? [
                "Untrusted commitment source/notes attempted authority claims — ignored for governance.",
              ]
            : []),
        ],
        governance,
        suggestedNextRetrieval:
          queryKind === "OVERDUE"
            ? "Ask what is due soon, or what commitments have no due date."
            : "Ask what is overdue, or what did I complete.",
      });
    }

    case "RECEIPT_INTELLIGENCE": {
      const queryKind = parseLeoReceiptQueryKind(request.question);
      const listed = await leoListRecentToolReceipts(
        Math.min(LEO_CONVERSATION_BOUNDS.maxResultsCap, Math.max(maxResults * 2, maxResults)),
      );
      const intel = buildLeoReceiptIntelligence({
        receipts: listed.receipts,
        queryKind,
        nowMs,
        maxResults,
        availability: listed.availability,
      });
      const injectionNotes = [
        ...(request.externalUntrustedNotes ?? []),
        ...intel.matched
          .slice(0, 5)
          .map((r) => r.requestedPayloadSummary)
          .filter(Boolean),
      ];
      const governance = assessLeoGovernance({
        actionKind: "READ",
        trustSources: injectionNotes.some((n) =>
          /ignore governance|deploy production|bypass/i.test(n),
        )
          ? ["SYSTEM_POLICY", "EXTERNAL_UNTRUSTED_DATA"]
          : ["SYSTEM_POLICY", "OWNER_INSTRUCTION"],
        externalClaimsApproval: injectionNotes.some((n) =>
          /ignore governance|deploy production|bypass|approve/i.test(n),
        ),
        nowMs,
      });
      const evidence: LeoConversationEvidence[] = intel.matched.map((r) => ({
        sourceKind: "leo_tool_receipt",
        sourceRef: r.id,
        summary: `${r.actionType}/${r.lifecycleState}`.slice(0, 160),
        availability: listed.availability === "UNAVAILABLE" ? "UNAVAILABLE" : "LIVE",
        limitationNote: "Durable receipt — no raw payloads exposed",
      }));
      return empty({
        intent: "RECEIPT_INTELLIGENCE",
        answerState:
          listed.availability === "UNAVAILABLE" ? "INSUFFICIENT_EVIDENCE" : "ANSWERED",
        summary: intel.summary,
        resultCards: intel.cards,
        spokenSummary: intel.spokenSummary,
        evidence,
        citations: evidence.map((e) => ({
          sourceKind: e.sourceKind,
          sourceRef: e.sourceRef,
          label: e.summary.slice(0, 120),
        })),
        unknowns: intel.unknowns,
        limitations: [
          ...intel.limitations,
          ...(injectionNotes.some((n) => /ignore governance|deploy production/i.test(n))
            ? [
                "Untrusted receipt/source text attempted authority claims — ignored for governance.",
              ]
            : []),
        ],
        governance,
        suggestedNextRetrieval: "Ask what did you prepare, or what is waiting for my approval.",
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

const PERSISTENCE_LIMITATION =
  "Conversation history persistence is currently unavailable.";

export type LeoPersistentConversationResult =
  | {
      ok: true;
      answer: LeoConversationAnswer;
    }
  | {
      ok: false;
      error:
        | "session_not_found"
        | "session_archived"
        | "session_unavailable"
        | "create_failed";
      message: string;
      newSessionRequired?: boolean;
    };

function clarificationAnswer(input: {
  summary: string;
  intent: LeoConversationAnswer["intent"];
  nowMs: number;
  sessionId: string | null;
  persistenceState: LeoConversationPersistenceState;
  conversationContext: LeoActiveConversationContext | null;
  limitations?: string[];
}): LeoConversationAnswer {
  return {
    intent: input.intent,
    answerState: "PARTIALLY_ANSWERED",
    summary: input.summary,
    evidence: [],
    citations: [],
    unknowns: ["referent_ambiguous"],
    limitations: [
      ...(input.limitations ?? []),
      "No action was prepared or executed while the referent is ambiguous.",
    ],
    governance: assessLeoGovernance({ actionKind: "ANALYZE", nowMs: input.nowMs }),
    suggestedNextRetrieval: "Name the item, or say the first/second/third one.",
    preparedAction: null,
    generatedAt: new Date(input.nowMs).toISOString(),
    notClaiming: LEO_CONVERSATION_NOT_CLAIMING,
    resultCards: null,
    spokenSummary: input.summary.slice(0, 220),
    sessionId: input.sessionId,
    turnId: null,
    userTurnId: null,
    persistenceState: input.persistenceState,
    conversationContext: input.conversationContext,
    suggestedQuestions: ["The first one", "The second one", "Never mind"],
  };
}

function applyResolvedReferentToRequest(
  request: LeoConversationRequest,
  resolution: Extract<ReturnType<typeof resolveLeoConversationReferent>, { status: "RESOLVED" }>,
): LeoConversationRequest {
  const next: LeoConversationRequest = { ...request };
  if (resolution.suggestedIntent && !request.intent) {
    next.intent = resolution.suggestedIntent;
  }
  if (resolution.commitmentId) {
    next.entityId = resolution.commitmentId;
  } else if (resolution.messageId) {
    next.entityId = resolution.messageId;
  } else if (resolution.threadId) {
    next.entityId = resolution.threadId;
  } else if (resolution.eventId) {
    next.entityId = resolution.eventId;
  } else if (resolution.receiptId) {
    next.entityId = resolution.receiptId;
  } else if (resolution.entityRef?.id) {
    next.entityId = resolution.entityRef.id;
  }
  if (resolution.entityRef) {
    next.clientContext = {
      ...request.clientContext,
      selectedEntityRef: resolution.entityRef,
      selectedCardId: resolution.cardId ?? request.clientContext?.selectedCardId ?? null,
    };
  }
  return next;
}

function focusFromAnswerCards(cards: LeoResultCard[] | null | undefined): {
  focusCardId: string | null;
  entityRefs: ReturnType<typeof extractEntityRefsFromCards>;
  cardRefs: string[];
  receiptIds: string[];
  contextExtras: Record<string, unknown>;
} {
  const cardRefs = extractResultCardRefsFromAnswer(cards);
  const entityRefs = extractEntityRefsFromCards(cards);
  const contextExtras: Record<string, unknown> = {};
  let focusCardId: string | null = null;
  if (cards?.length === 1) {
    const refs = extractRefsFromResultCard(cards[0]);
    focusCardId = cards[0].cardId;
    if (refs.threadId) contextExtras.threadId = refs.threadId;
    if (refs.messageId) contextExtras.messageId = refs.messageId;
    if (refs.eventId) contextExtras.eventId = refs.eventId;
    if (refs.commitmentId) contextExtras.commitmentId = refs.commitmentId;
    if (refs.receiptId) contextExtras.receiptId = refs.receiptId;
    contextExtras.focusCardId = focusCardId;
  } else if (cards && cards.length > 1) {
    contextExtras.focusCardId = cards[0]?.cardId;
    focusCardId = cards[0]?.cardId ?? null;
  }
  return {
    focusCardId,
    entityRefs,
    cardRefs,
    receiptIds: extractReceiptIdsFromAnswer({ cards }),
    contextExtras,
  };
}

/**
 * LEO-14.6: durable session create/resume + turn persistence + referent context.
 * Persistence failure never blocks core conversation answers.
 */
export async function runLeoPersistentConversation(
  request: LeoConversationRequest,
): Promise<LeoPersistentConversationResult> {
  const nowMs = request.nowMs ?? Date.now();
  const persistenceLimitations: string[] = [];
  let persistenceState: LeoConversationPersistenceState = "SKIPPED";
  let sessionId: string | null = null;
  let recentTurns: LeoConversationTurn[] = [];

  const ensured = await leoEnsureConversationSession({
    sessionId: request.sessionId,
    firstQuestion: request.question,
  });

  if (!ensured.ok) {
    if (
      ensured.error === "session_not_found" ||
      ensured.error === "session_archived" ||
      ensured.error === "create_failed"
    ) {
      // Invalid continuity must not silently invent a new session.
      if (request.sessionId) {
        return {
          ok: false,
          error: ensured.error === "create_failed" ? "session_unavailable" : ensured.error,
          message:
            ensured.error === "session_archived"
              ? "That conversation was archived. Start a new session."
              : ensured.error === "session_not_found"
                ? "That conversation session is unavailable. Start a new session."
                : "Could not create a conversation session.",
          newSessionRequired: ensured.newSessionRequired,
        };
      }
    }
    if (ensured.error === "persistence_unavailable" || ensured.error === "create_failed") {
      persistenceState = "NOT_PERSISTED_UNAVAILABLE";
      persistenceLimitations.push(PERSISTENCE_LIMITATION);
    }
  } else {
    sessionId = ensured.session.id;
    persistenceState = "PERSISTED";
    const listed = await leoListActiveConversationContextTurns(
      sessionId,
      LEO_ACTIVE_CONTEXT_TURN_WINDOW,
    );
    if (listed.availability === "UNAVAILABLE") {
      persistenceState = "NOT_PERSISTED_UNAVAILABLE";
      persistenceLimitations.push(PERSISTENCE_LIMITATION);
      recentTurns = [];
    } else {
      recentTurns = listed.turns;
    }
  }

  let activeContext = buildLeoActiveConversationContext({
    sessionId,
    turns: recentTurns,
    clientContext: request.clientContext,
    nowMs,
  });

  const resolution = resolveLeoConversationReferent({
    question: request.question,
    context: activeContext,
    cards: null,
  });

  // Ambiguous referent with mutation intent — clarify, do not prepare/execute.
  if (resolution.status === "AMBIGUOUS" && (referentBlocksMutation(resolution) || resolution.blocksMutation)) {
    const answer = clarificationAnswer({
      summary: resolution.clarification,
      intent: resolution.suggestedIntent ?? "UNKNOWN",
      nowMs,
      sessionId,
      persistenceState,
      conversationContext: activeContext,
      limitations: persistenceLimitations,
    });

    if (sessionId && persistenceState === "PERSISTED") {
      const userTurn = await leoAppendUserTurnIdempotent({
        sessionId,
        boundedText: request.question,
        intent: answer.intent,
        selectedEntityRefs: request.clientContext?.selectedEntityRef
          ? [request.clientContext.selectedEntityRef]
          : [],
        contextRefs: buildTurnContextRefs({
          clientRequestId: request.clientRequestId,
          active: activeContext,
        }),
        clientRequestId: request.clientRequestId,
        recentTurns,
      });
      if (userTurn.ok) {
        answer.userTurnId = userTurn.turn.id;
        const leoTurn = await leoAppendConversationTurn({
          sessionId,
          role: "LEO",
          boundedText: answer.summary,
          intent: answer.intent,
          resultCardRefs: [],
          contextRefs: buildTurnContextRefs({ active: activeContext }),
        });
        if (leoTurn.ok) {
          answer.turnId = leoTurn.turn.id;
          persistenceState = "PERSISTED";
        } else if (leoTurn.availability === "UNAVAILABLE") {
          persistenceState = "NOT_PERSISTED_UNAVAILABLE";
          answer.limitations = [...answer.limitations, PERSISTENCE_LIMITATION];
        } else {
          persistenceState = "FAILED";
        }
      } else if (userTurn.availability === "UNAVAILABLE") {
        persistenceState = "NOT_PERSISTED_UNAVAILABLE";
        answer.limitations = [...answer.limitations, PERSISTENCE_LIMITATION];
      }
    }

    answer.sessionId = sessionId;
    answer.persistenceState = persistenceState;
    return { ok: true, answer };
  }

  let workingRequest = request;
  if (resolution.status === "RESOLVED") {
    workingRequest = applyResolvedReferentToRequest(request, resolution);
    activeContext = {
      ...activeContext,
      focusCardId: resolution.cardId ?? activeContext.focusCardId,
      focusEntityRef: resolution.entityRef ?? activeContext.focusEntityRef,
      focusThreadId: resolution.threadId ?? activeContext.focusThreadId,
      focusMessageId: resolution.messageId ?? activeContext.focusMessageId,
      focusEventId: resolution.eventId ?? activeContext.focusEventId,
      focusCommitmentId: resolution.commitmentId ?? activeContext.focusCommitmentId,
      focusReceiptId: resolution.receiptId ?? activeContext.focusReceiptId,
      focus: {
        cardId: resolution.cardId ?? undefined,
        entityRef: resolution.entityRef ?? undefined,
        threadId: resolution.threadId ?? undefined,
        messageId: resolution.messageId ?? undefined,
        eventId: resolution.eventId ?? undefined,
        commitmentId: resolution.commitmentId ?? undefined,
        receiptId: resolution.receiptId ?? undefined,
      },
    };
  }

  let userTurnId: string | null = null;
  if (sessionId && persistenceState === "PERSISTED") {
    const userTurn = await leoAppendUserTurnIdempotent({
      sessionId,
      boundedText: request.question,
      intent: workingRequest.intent ?? null,
      selectedEntityRefs: [
        ...(request.clientContext?.selectedEntityRef
          ? [request.clientContext.selectedEntityRef]
          : []),
        ...(resolution.status === "RESOLVED" && resolution.entityRef
          ? [resolution.entityRef]
          : []),
      ].slice(0, 5),
      contextRefs: buildTurnContextRefs({
        clientRequestId: request.clientRequestId,
        active: activeContext,
      }),
      clientRequestId: request.clientRequestId,
      recentTurns,
    });
    if (userTurn.ok) {
      userTurnId = userTurn.turn.id;
    } else if (userTurn.availability === "UNAVAILABLE") {
      persistenceState = "NOT_PERSISTED_UNAVAILABLE";
      persistenceLimitations.push(PERSISTENCE_LIMITATION);
      sessionId = sessionId; // keep known session id only if created earlier; still valid
    } else {
      persistenceState = "FAILED";
    }
  }

  // Core intelligence — unchanged authority path.
  const answer = await runLeoConversation(workingRequest);

  const extracted = focusFromAnswerCards(answer.resultCards);
  const postContext = buildLeoActiveConversationContext({
    sessionId,
    turns: recentTurns,
    latestCards: answer.resultCards,
    clientContext: request.clientContext,
    nowMs,
  });

  let leoTurnId: string | null = null;
  if (sessionId && (persistenceState === "PERSISTED" || persistenceState === "FAILED")) {
    // Only append LEO turn when we still believe persistence is up (or retry after user fail).
    if (persistenceState === "PERSISTED" || userTurnId) {
      const leoTurn = await leoAppendConversationTurn({
        sessionId,
        role: "LEO",
        boundedText: (answer.spokenSummary || answer.summary).slice(0, 4000),
        intent: answer.intent,
        resultCardRefs: extracted.cardRefs,
        selectedEntityRefs: extracted.entityRefs,
        receiptIds: extracted.receiptIds,
        contextRefs: buildTurnContextRefs({
          active: postContext,
          focus: {
            cardId: extracted.focusCardId ?? undefined,
            entityRef: extracted.entityRefs[0],
            threadId:
              typeof extracted.contextExtras.threadId === "string"
                ? extracted.contextExtras.threadId
                : undefined,
            messageId:
              typeof extracted.contextExtras.messageId === "string"
                ? extracted.contextExtras.messageId
                : undefined,
            eventId:
              typeof extracted.contextExtras.eventId === "string"
                ? extracted.contextExtras.eventId
                : undefined,
            commitmentId:
              typeof extracted.contextExtras.commitmentId === "string"
                ? extracted.contextExtras.commitmentId
                : undefined,
            receiptId:
              typeof extracted.contextExtras.receiptId === "string"
                ? extracted.contextExtras.receiptId
                : undefined,
          },
        }),
      });
      if (leoTurn.ok) {
        leoTurnId = leoTurn.turn.id;
        persistenceState = "PERSISTED";
      } else if (leoTurn.availability === "UNAVAILABLE") {
        persistenceState = "NOT_PERSISTED_UNAVAILABLE";
        persistenceLimitations.push(PERSISTENCE_LIMITATION);
      } else {
        persistenceState = "FAILED";
      }
    }
  }

  const finalContext = buildLeoActiveConversationContext({
    sessionId,
    turns: recentTurns,
    latestCards: answer.resultCards,
    clientContext: request.clientContext,
    nowMs,
  });

  return {
    ok: true,
    answer: {
      ...answer,
      sessionId:
        persistenceState === "NOT_PERSISTED_UNAVAILABLE" && !ensured.ok ? null : sessionId,
      turnId: leoTurnId,
      userTurnId,
      persistenceState,
      conversationContext: finalContext,
      limitations: [...answer.limitations, ...persistenceLimitations],
    },
  };
}
