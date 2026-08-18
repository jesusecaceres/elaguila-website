/**
 * LEO-11 internal tool adapters — wrap proven LEO services (no logic duplication).
 */
import "server-only";

import { summarizeLeoAdminCapabilities } from "@/app/leo/_lib/leoAdminCapabilitiesAdapter";
import { getLeoAttentionBrief } from "@/app/leo/_lib/leoAttentionService";
import { getLeoClientCareWatch } from "@/app/leo/_lib/leoClientCareService";
import { buildLeoDecisionBrief } from "@/app/leo/_lib/leoDecisionEngine";
import {
  leoListActiveMemoryForSubject,
  leoListRecentMemory,
} from "@/app/leo/_lib/leoLivingBookService";
import {
  composeLeoProjectIntelligenceSummary,
  getLeoProjectExecutiveSnapshot,
} from "@/app/leo/_lib/leoProjectIntelligenceService";
import {
  getLeoCommunicationExecutiveSnapshot,
  getLeoGmailThreadForTool,
  getLeoMeetingIntelligenceForNext,
} from "@/app/leo/_lib/leoCommunicationIntelligenceService";
import { readLeoGmailInbox } from "@/app/leo/_lib/leoGmailAdapter";
import { readLeoCalendarEvents } from "@/app/leo/_lib/leoCalendarAdapter";
import { runLeoPreparation } from "@/app/leo/_lib/leoPreparationService";
import { getLeoListingReasonChain } from "@/app/leo/_lib/leoReasonChain";
import { getLeoToolCatalog } from "@/app/leo/_lib/leoToolCatalog";
import { readLeoGithubRepository } from "@/app/leo/_lib/leoGithubProjectAdapter";
import { readLeoVercelDeployments } from "@/app/leo/_lib/leoVercelProjectAdapter";
import { LEO_PROJECT_DEFAULT_BRANCH } from "@/app/leo/_lib/leoToolRegistry";
import { evaluateLeoWatcherRequest } from "@/app/leo/_lib/leoWatcherEngine";
import { isLeoWatcherKind } from "@/app/leo/_lib/leoWatcherRegistry";
import type {
  LeoConversationEvidence,
  LeoDecisionContext,
  LeoPreparationKind,
  LeoToolId,
  LeoToolOperationMode,
} from "@/app/leo/_lib/leoTypes";

export type LeoToolAdapterSuccess = {
  ok: true;
  summary: string;
  evidence: LeoConversationEvidence[];
  data: unknown;
  unknowns: string[];
  limitations: string[];
};

export type LeoToolAdapterFailure = {
  ok: false;
  errorCode: string;
  summary: string;
  limitations: string[];
  unknowns?: string[];
};

export type LeoToolAdapterResult = LeoToolAdapterSuccess | LeoToolAdapterFailure;

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function invokeLeoToolAdapter(args: {
  toolId: LeoToolId;
  operation: LeoToolOperationMode;
  parameters?: Record<string, unknown>;
  nowMs: number;
}): Promise<LeoToolAdapterResult> {
  const { toolId, operation, parameters = {}, nowMs } = args;

  switch (toolId) {
    case "leo.attention.read": {
      const brief = await getLeoAttentionBrief({ nowMs });
      return {
        ok: true,
        summary: `${brief.items.length} attention priorit${brief.items.length === 1 ? "y" : "ies"}; ${brief.actionableCount} actionable.`,
        evidence: brief.items.slice(0, 8).map((i) => ({
          sourceKind: "attention_item",
          sourceRef: i.id,
          summary: i.title,
          availability: "LIVE" as const,
        })),
        data: brief,
        unknowns: [],
        limitations: [...brief.limitations],
      };
    }

    case "leo.clientCare.read": {
      const watch = await getLeoClientCareWatch({ nowMs });
      return {
        ok: true,
        summary: `${watch.signals.length} client-care item${watch.signals.length === 1 ? "" : "s"} from bounded sources.`,
        evidence: watch.signals.slice(0, 10).map((s) => ({
          sourceKind: "client_care_signal",
          sourceRef: s.key,
          summary: s.title,
          availability: "LIVE" as const,
        })),
        data: watch,
        unknowns: [],
        limitations: [...watch.limitations],
      };
    }

    case "leo.reasonChain.read": {
      const listingId = asString(parameters.listingId);
      if (!listingId) {
        return {
          ok: false,
          errorCode: "MISSING_LISTING_ID",
          summary: "listingId is required for listing reason chain.",
          limitations: ["Provide an explicit listingId parameter."],
          unknowns: ["listingId"],
        };
      }
      const chain = await getLeoListingReasonChain(listingId);
      return {
        ok: true,
        summary: chain.primaryReason
          ? `Listing reason quality ${chain.provenanceQuality}.`
          : "Original listing reason unavailable — LEO will not invent a cause.",
        evidence: [
          {
            sourceKind: "listing_reason_chain",
            sourceRef: listingId,
            summary: chain.primaryReason?.humanReadableReason?.slice(0, 160) ?? "reason unavailable",
            availability: chain.primaryReason ? "LIVE" : "UNAVAILABLE",
          },
        ],
        data: chain,
        unknowns: chain.primaryReason ? [] : ["listing_flag_reason"],
        limitations: chain.observabilityGap ? ["Observability gap noted."] : [],
      };
    }

    case "leo.memory.read": {
      const subjectType = asString(parameters.subjectType);
      const subjectKey = asString(parameters.subjectKey);
      const records =
        subjectType && subjectKey
          ? await leoListActiveMemoryForSubject(subjectType, subjectKey, 20)
          : await leoListRecentMemory(12);
      return {
        ok: true,
        summary:
          records.length === 0
            ? "No active executive memories found. LEO never invents memory."
            : `Found ${records.length} memory record(s).`,
        evidence: records.slice(0, 10).map((r) => ({
          sourceKind: "leo_memory",
          sourceRef: r.id,
          summary: r.statement.slice(0, 160),
          availability: "LIVE" as const,
        })),
        data: records,
        unknowns: records.length === 0 ? ["memory"] : [],
        limitations: [],
      };
    }

    case "leo.decision.analyze": {
      const ctx = parameters.decisionContext as LeoDecisionContext | undefined;
      if (!ctx || typeof ctx !== "object") {
        return {
          ok: false,
          errorCode: "MISSING_DECISION_CONTEXT",
          summary: "decisionContext is required for decision analysis.",
          limitations: ["Provide a structured decisionContext parameter."],
          unknowns: ["decisionContext"],
        };
      }
      const brief = buildLeoDecisionBrief({ ...ctx, nowMs: ctx.nowMs ?? nowMs });
      return {
        ok: true,
        summary: `Decision ${brief.recommendationState}; governance ${brief.governance.level}.`,
        evidence: [
          {
            sourceKind: "decision_brief",
            sourceRef: brief.decisionKey,
            summary: brief.question.slice(0, 160),
            availability: "LIVE",
          },
        ],
        data: brief,
        unknowns: [...brief.unknowns],
        limitations: [...brief.limitations],
      };
    }

    case "leo.watcher.run": {
      const kindRaw = asString(parameters.watcherKind);
      if (!kindRaw || !isLeoWatcherKind(kindRaw)) {
        return {
          ok: false,
          errorCode: "UNSUPPORTED_WATCHER",
          summary: "Supported watcherKind required.",
          limitations: ["Use a registered on-demand watcher kind."],
        };
      }
      // Watcher engine is pure; service layer usually loads evidence first.
      // For tool bus v0, run with empty evidence bundle → truthful empty findings.
      const result = evaluateLeoWatcherRequest(
        { watcherKind: kindRaw, nowMs, maxFindings: 10 },
        {},
      );
      if (!("findings" in result)) {
        return {
          ok: false,
          errorCode: "WATCHER_FAILED",
          summary: result.message ?? "Watcher evaluation failed.",
          limitations: ["On-demand watcher could not run with current evidence."],
        };
      }
      return {
        ok: true,
        summary: `Watcher ${kindRaw}: ${result.totalFindings} finding(s).`,
        evidence: result.findings.slice(0, 10).map((f) => ({
          sourceKind: "watcher_finding",
          sourceRef: f.key,
          summary: f.summary,
          availability: "LIVE" as const,
        })),
        data: result,
        unknowns: [],
        limitations: [
          ...result.limitations,
          "Tool invocation used on-demand watcher without preloaded external writes.",
        ],
      };
    }

    case "leo.preparation.prepare": {
      if (operation !== "PREPARE") {
        return {
          ok: false,
          errorCode: "OPERATION_MISMATCH",
          summary: "preparation.prepare requires PREPARE operation.",
          limitations: [],
        };
      }
      const prepKind = (asString(parameters.preparationKind) ??
        "INTERNAL_TASK_DRAFT") as LeoPreparationKind;
      const result = await runLeoPreparation({
        preparationKind: prepKind,
        watcherKind: null,
        nowMs,
        question: asString(parameters.question),
      });
      if (!result.preparation.ok || !result.preparation.prepared) {
        return {
          ok: false,
          errorCode: "PREPARATION_BLOCKED",
          summary: result.preparation.message,
          limitations: result.preparation.governance.limitations,
        };
      }
      const prepared = result.preparation.prepared;
      return {
        ok: true,
        summary: `YELLOW preparation ready: ${prepared.preparationKind}. Status: PREPARED, NOT_EXECUTED.`,
        evidence: prepared.sourceEvidenceRefs.slice(0, 8).map((ref) => ({
          sourceKind: "preparation_evidence",
          sourceRef: ref,
          summary: ref.slice(0, 120),
          availability: "LIVE" as const,
        })),
        data: prepared,
        unknowns: [...prepared.unknowns],
        limitations: [...prepared.limitations],
      };
    }

    case "leo.capabilities.read": {
      const catalog = getLeoToolCatalog(nowMs);
      return {
        ok: true,
        summary: `Tool catalog: ${catalog.available.length} available, ${catalog.notConfigured.length} not configured, ${catalog.partial.length} partial.`,
        evidence: catalog.humanGroups.map((g) => ({
          sourceKind: "tool_catalog_group",
          sourceRef: g.label,
          summary: `${g.label} — ${g.status}`,
          availability: g.status === "available" ? ("LIVE" as const) : ("UNAVAILABLE" as const),
        })),
        data: catalog,
        unknowns: [],
        limitations: [],
      };
    }

    case "leo.adminCapabilities.read": {
      const summary = summarizeLeoAdminCapabilities();
      return {
        ok: true,
        summary: summary.summary,
        evidence: summary.actions.slice(0, 20).map((a) => ({
          sourceKind: "admin_os_action",
          sourceRef: a.key,
          summary: `${a.label}: ${a.status} / ${a.riskLevel} — ${a.leoNote}`,
          availability:
            a.leoAvailability === "AVAILABLE"
              ? ("LIVE" as const)
              : a.leoAvailability === "PARTIAL"
                ? ("PARTIAL" as const)
                : ("UNAVAILABLE" as const),
        })),
        data: summary,
        unknowns: [],
        limitations: [
          "LEO does not execute Admin actions.",
          "PLANNED Admin actions are not available.",
          "NEEDS LIVE PROOF Admin actions are not fully verified.",
        ],
      };
    }

    case "leo.project.github.read": {
      const g = await readLeoGithubRepository({
        branch: asString(parameters.branch),
      });
      if (!g.ok) {
        return {
          ok: false,
          errorCode: g.errorCode,
          summary: g.limitations[0] ?? "GitHub read unavailable.",
          limitations: g.limitations,
        };
      }
      return {
        ok: true,
        summary: `GitHub ${g.snapshot.fullName} branch ${g.snapshot.branch ?? "unknown"} head ${
          g.snapshot.headSha?.slice(0, 7) ?? "unknown"
        }.`,
        evidence: [
          {
            sourceKind: "github_repo",
            sourceRef: g.snapshot.fullName,
            summary: `branch=${g.snapshot.branch}; sha=${g.snapshot.headSha}`,
            availability: "LIVE",
          },
          ...g.snapshot.recentCommits.slice(0, 5).map((c) => ({
            sourceKind: "github_commit",
            sourceRef: c.sha,
            summary: c.message,
            availability: "LIVE" as const,
          })),
        ],
        data: g.snapshot,
        unknowns: [],
        limitations: g.snapshot.limitations,
      };
    }

    case "leo.project.vercel.read": {
      const v = await readLeoVercelDeployments({
        leoBranch: asString(parameters.branch) ?? LEO_PROJECT_DEFAULT_BRANCH,
      });
      if (!v.ok) {
        return {
          ok: false,
          errorCode: v.errorCode,
          summary: v.limitations[0] ?? "Vercel read unavailable.",
          limitations: v.limitations,
        };
      }
      const latest = v.latestPreview ?? v.deployments[0];
      return {
        ok: true,
        summary: latest
          ? `Vercel ${v.projectName}: latest deployment ${latest.deploymentId.slice(0, 8)} platform-state ${
              latest.readyState ?? "unknown"
            } (Vercel deployment state — not system health).`
          : `Vercel ${v.projectName}: no recent deployments returned.`,
        evidence: v.deployments.slice(0, 8).map((d) => ({
          sourceKind: "vercel_deployment",
          sourceRef: d.deploymentId,
          summary: `target=${d.target}; readyState=${d.readyState}; sha=${d.gitCommitSha}`,
          availability: "LIVE" as const,
          limitationNote:
            "READY means Vercel deployment state READY — not system health.",
        })),
        data: v,
        unknowns: [],
        limitations: v.limitations,
      };
    }

    case "leo.project.snapshot.read": {
      const exec = await getLeoProjectExecutiveSnapshot({
        branch: asString(parameters.branch),
        nowMs,
        question: asString(parameters.question),
      });
      return {
        ok: true,
        summary: composeLeoProjectIntelligenceSummary(exec),
        evidence: [
          ...(exec.leoHead.sha
            ? [
                {
                  sourceKind: "github_head",
                  sourceRef: exec.leoHead.sha,
                  summary: `branch ${exec.leoBranch} @ ${exec.leoHead.sha.slice(0, 7)}`,
                  availability: "LIVE" as const,
                },
              ]
            : []),
          ...exec.correlation.states.slice(0, 5).map((s) => ({
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
        data: exec,
        unknowns: [],
        limitations: exec.limitations,
      };
    }

    case "leo.email.inbox.read": {
      const inbox = await readLeoGmailInbox({
        maxResults:
          typeof parameters.maxResults === "number" ? parameters.maxResults : undefined,
      });
      if (inbox.availability !== "AVAILABLE" && inbox.availability !== "PARTIAL") {
        return {
          ok: false,
          errorCode: inbox.errorCode ?? "GMAIL_UNAVAILABLE",
          summary:
            inbox.availability === "NOT_CONFIGURED"
              ? "Gmail is not configured."
              : "Gmail inbox unavailable.",
          limitations: inbox.limitations,
        };
      }
      return {
        ok: true,
        summary: `Bounded Gmail inbox: ${inbox.messages.length} recent message(s).`,
        evidence: inbox.messages.slice(0, 8).map((m) => ({
          sourceKind: "email_message",
          sourceRef: m.messageId,
          summary: `${m.subject ?? "(no subject)"} — ${m.sender ?? "unknown sender"}`,
          availability: "LIVE" as const,
          limitationNote: "EXTERNAL_UNTRUSTED_DATA",
        })),
        data: inbox,
        unknowns: [],
        limitations: inbox.limitations,
      };
    }

    case "leo.email.thread.read": {
      const threadId = asString(parameters.threadId);
      if (!threadId) {
        return {
          ok: false,
          errorCode: "THREAD_ID_REQUIRED",
          summary: "threadId is required.",
          limitations: [],
        };
      }
      const thread = await getLeoGmailThreadForTool(threadId);
      if (thread.availability !== "AVAILABLE" && thread.availability !== "PARTIAL") {
        return {
          ok: false,
          errorCode: thread.errorCode ?? "GMAIL_THREAD_UNAVAILABLE",
          summary:
            thread.availability === "NOT_CONFIGURED"
              ? "Gmail is not configured."
              : "Gmail thread unavailable.",
          limitations: thread.limitations,
        };
      }
      return {
        ok: true,
        summary: `Bounded Gmail thread: ${thread.messages.length} message(s).`,
        evidence: thread.messages.slice(0, 8).map((m) => ({
          sourceKind: "email_message",
          sourceRef: m.messageId,
          summary: `${m.subject ?? "(no subject)"} — ${m.sender ?? "unknown"}`,
          availability: "LIVE" as const,
          limitationNote: "EXTERNAL_UNTRUSTED_DATA",
        })),
        data: thread,
        unknowns: [],
        limitations: thread.limitations,
      };
    }

    case "leo.calendar.events.read": {
      const cal = await readLeoCalendarEvents({
        nowMs,
        maxResults:
          typeof parameters.maxResults === "number" ? parameters.maxResults : undefined,
        timeMinIso: asString(parameters.timeMinIso),
        timeMaxIso: asString(parameters.timeMaxIso),
      });
      if (cal.availability !== "AVAILABLE" && cal.availability !== "PARTIAL") {
        return {
          ok: false,
          errorCode: cal.errorCode ?? "CALENDAR_UNAVAILABLE",
          summary:
            cal.availability === "NOT_CONFIGURED"
              ? "Calendar is not configured."
              : "Calendar events unavailable.",
          limitations: cal.limitations,
        };
      }
      return {
        ok: true,
        summary: `Bounded calendar window: ${cal.events.length} event(s).`,
        evidence: cal.events.slice(0, 8).map((e) => ({
          sourceKind: "external_calendar_event",
          sourceRef: e.eventId,
          summary: `${e.title ?? "(untitled)"} @ ${e.start ?? "unknown time"}`,
          availability: "LIVE" as const,
          limitationNote: "EXTERNAL_UNTRUSTED_DATA",
        })),
        data: cal,
        unknowns: [],
        limitations: cal.limitations,
      };
    }

    case "leo.communication.snapshot.read": {
      const snap = await getLeoCommunicationExecutiveSnapshot({
        nowMs,
        question: asString(parameters.question),
      });
      if (snap.overallAvailability === "NOT_CONFIGURED") {
        return {
          ok: false,
          errorCode: "GOOGLE_NOT_CONFIGURED",
          summary: "Google Workspace communication intelligence is not configured.",
          limitations: snap.limitations,
        };
      }
      return {
        ok: true,
        summary: `Communication snapshot availability=${snap.overallAvailability}; gmail=${snap.gmail.recentMessages.length}; calendar upcoming=${snap.calendar.upcomingEvents.length}.`,
        evidence: [
          ...snap.gmail.recentMessages.slice(0, 5).map((m) => ({
            sourceKind: "email_message",
            sourceRef: m.messageId,
            summary: m.subject ?? m.messageId,
            availability: "LIVE" as const,
            limitationNote: "EXTERNAL_UNTRUSTED_DATA",
          })),
          ...snap.calendar.upcomingEvents.slice(0, 5).map((e) => ({
            sourceKind: "external_calendar_event",
            sourceRef: e.eventId,
            summary: e.title ?? e.eventId,
            availability: "LIVE" as const,
            limitationNote: "EXTERNAL_UNTRUSTED_DATA",
          })),
        ],
        data: snap,
        unknowns: snap.unknowns,
        limitations: snap.limitations,
      };
    }

    case "leo.meeting.prepare": {
      if (operation !== "PREPARE") {
        return {
          ok: false,
          errorCode: "OPERATION_MISMATCH",
          summary: "meeting.prepare requires PREPARE operation.",
          limitations: [],
        };
      }
      const meetingIntel = await getLeoMeetingIntelligenceForNext({ nowMs });
      const prep = await runLeoPreparation({
        preparationKind: "MEETING_BRIEF",
        watcherKind: null,
        nowMs,
        question: asString(parameters.question) ?? "Prepare me for my next meeting.",
      });
      if (!prep.preparation.ok || !prep.preparation.prepared) {
        return {
          ok: false,
          errorCode: "MEETING_PREP_BLOCKED",
          summary: prep.preparation.message,
          limitations: [
            ...prep.preparation.governance.limitations,
            ...meetingIntel.limitations,
          ],
        };
      }
      const prepared = prep.preparation.prepared;
      return {
        ok: true,
        summary: `YELLOW meeting preparation ready. Status: PREPARED, NOT_EXECUTED. Related emails: ${meetingIntel.relatedEmailEvidence.length}.`,
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
        data: { prepared, meetingIntel },
        unknowns: [...prepared.unknowns, ...meetingIntel.unknowns],
        limitations: [...prepared.limitations, ...meetingIntel.limitations],
      };
    }

    default:
      return {
        ok: false,
        errorCode: "ADAPTER_NOT_IMPLEMENTED",
        summary: "No adapter for this tool.",
        limitations: [],
      };
  }
}
