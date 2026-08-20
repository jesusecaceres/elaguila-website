/**
 * LEO conversation composer — deterministic evidence-backed owner summaries.
 * Executive language only — no construction-gate / Top-N / signal jargon.
 */
import type {
  LeoAttentionBrief,
  LeoClientCareWatchResult,
  LeoCommunicationExecutiveSnapshot,
  LeoCommunicationSubtype,
  LeoConversationAnswerState,
  LeoConversationIntent,
  LeoDecisionBrief,
  LeoGovernanceAssessment,
  LeoListingReasonChain,
  LeoMemoryRecord,
  LeoProjectExecutiveSnapshot,
  LeoProjectSnapshot,
} from "@/app/leo/_lib/leoTypes";
import { composeGoogleFailureDiagnosticLine } from "@/app/leo/_lib/leoGoogleConnectionDiagnostic";
import { composeLeoGmailExecutiveSummary } from "@/app/leo/_lib/leoGmailTriageUpgrade";

export {
  composeGoogleConnectionDiagnosticSummary,
  isLeoGoogleDiagnosticQuestion,
} from "@/app/leo/_lib/leoGoogleConnectionDiagnostic";

export function composeAttentionSummary(brief: LeoAttentionBrief): string {
  const runtime = brief as LeoAttentionBrief & {
    visibleItems?: LeoAttentionBrief["items"];
    dispositionAvailability?: string;
  };
  const items = runtime.visibleItems ?? brief.items;
  const n = items.length;
  const actionable = brief.actionableCount;
  if (n === 0) {
    return "No priorities currently qualify for executive attention from available Leonix evidence.";
  }
  if (n === 1) {
    return `1 priority needs your attention right now${
      actionable > 1 ? ` (${actionable} actionable items across available evidence)` : ""
    }.`;
  }
  return `${n} priorities need your attention right now. There are ${actionable} actionable item${
    actionable === 1 ? "" : "s"
  } across the available Leonix evidence.`;
}

export function composeClientCareSummary(watch: LeoClientCareWatchResult): string {
  const overdue = watch.signals.filter((s) => s.kind === "FOLLOW_UP_OVERDUE").length;
  const needsReply = watch.signals.filter((s) => s.kind === "NEEDS_REPLY").length;
  const openSupport = watch.signals.filter((s) => s.kind === "OPEN_SUPPORT").length;
  const stale = watch.signals.filter((s) => s.kind === "STALE_ACTIVE_LEAD").length;
  if (watch.signals.length === 0) {
    return "No client-care items need attention from currently available bounded sources.";
  }
  const parts: string[] = [];
  if (needsReply > 0) {
    parts.push(
      `${needsReply} ${needsReply === 1 ? "is" : "are"} waiting for a reply`,
    );
  }
  if (overdue > 0) {
    parts.push(
      `${overdue} ${overdue === 1 ? "has" : "have"} an explicit overdue follow-up`,
    );
  }
  if (openSupport > 0) {
    parts.push(`${openSupport} open support ${openSupport === 1 ? "item" : "items"}`);
  }
  if (stale > 0) {
    parts.push(
      `${stale} heuristic stale active ${stale === 1 ? "lead" : "leads"} (not treated as missed commitments)`,
    );
  }
  const detail = parts.length ? ` ${parts.join("; ")}.` : ".";
  return `${watch.signals.length} client-care ${watch.signals.length === 1 ? "item needs" : "items need"} attention.${detail}`;
}

export function composeReasonSummary(chain: LeoListingReasonChain): string {
  const primary = chain.primaryReason;
  if (!primary) {
    return `For this listing, the original reason was not persisted or is unavailable. LEO will not invent a cause.${
      chain.observabilityGap ? " An observability gap is noted." : ""
    }`;
  }
  const reasonText = primary.humanReadableReason?.trim();
  return `Listing reason quality is ${chain.provenanceQuality.toLowerCase()} (${chain.explanationState.toLowerCase()})${
    reasonText ? `: ${reasonText.slice(0, 180)}` : ""
  }.${chain.observabilityGap ? " An observability gap is noted." : ""}`;
}

export function composeMemorySummary(records: LeoMemoryRecord[], subjectLabel: string): string {
  if (records.length === 0) {
    return `No active executive memories found for ${subjectLabel}. LEO never invents memory.`;
  }
  const decisions = records.filter(
    (r) => r.epistemicType === "active_decision" || r.epistemicType === "historical_decision",
  ).length;
  return `Found ${records.length} active memory ${records.length === 1 ? "record" : "records"} for ${subjectLabel}${
    decisions > 0 ? ` (${decisions} decision-typed)` : ""
  }.`;
}

export function composeGovernanceSummary(g: LeoGovernanceAssessment): string {
  if (g.level === "NEVER") {
    return `LEO will not bypass governance. Requests to override approval controls are blocked.${
      g.blockedReason ? ` ${g.blockedReason}` : ""
    }`.trim();
  }
  if (g.level === "RED") {
    return "This is a RED action. It requires Chuy's explicit approval before any future execution path could proceed. LEO cannot execute this action yet. Preparation may be planned only.";
  }
  if (g.level === "YELLOW") {
    return "This is a YELLOW action — preparation only. LEO cannot execute this action yet.";
  }
  return "This is a GREEN action — safe read, analysis, or explanation. No consequential execution.";
}

export function composeDecisionSummary(brief: LeoDecisionBrief): string {
  const owner = brief.ownerDecisionRequired ? " Owner judgment is required." : "";
  return `Decision support: ${brief.recommendationState.replace(/_/g, " ").toLowerCase()}; governance ${brief.governance.level}; ${brief.challenges.length} challenge note(s).${owner}`;
}

export function composeCapabilityOverviewSummary(catalogSummary?: string): string {
  if (catalogSummary?.trim()) return catalogSummary.trim();
  return [
    "LEO can help you operate Leonix as an executive cockpit — without inventing facts or executing consequential actions.",
    "",
    "Available tools: Executive intelligence · Client Care · Memory · Decision support · Preparation · Admin capabilities (read).",
    "",
    "Governance: GREEN read/analyze · YELLOW prepare only · RED requires Chuy approval · NEVER blocked.",
    "",
    "Not configured yet: GitHub project intelligence · Vercel project intelligence (when tokens are absent).",
    "",
    "Not connected yet: background monitoring, notifications, Business Concierge connection, voice, and autonomous execution.",
  ].join("\n");
}

export function composeProjectIntelligenceSummary(text: string): string {
  return text.trim() || "No project intelligence evidence is available yet.";
}

/** LEO-13 question-aware communication summary — concise, no raw dumps. */
export function composeCommunicationIntelligenceSummary(
  snap: LeoCommunicationExecutiveSnapshot,
  subtype?: LeoCommunicationSubtype | null,
): string {
  const kind = subtype ?? snap.subtype ?? "EMAIL";

  if (snap.overallAvailability === "NOT_CONFIGURED") {
    return "Google Workspace is not configured for LEO yet.";
  }

  if (kind === "CALENDAR") {
    if (snap.calendar.availability === "NOT_CONFIGURED") {
      return "Google Workspace is not configured for LEO yet.";
    }
    if (snap.calendar.availability !== "AVAILABLE" && snap.calendar.availability !== "PARTIAL") {
      const line = composeGoogleFailureDiagnosticLine("calendar", snap.runtimeDiagnostic);
      return line
        ? `LEO could not read Calendar right now.\n${line}`
        : "LEO could not read Calendar right now.";
    }
    const q = (snap.ownerQuestion ?? "").toLowerCase();
    if (/tomorrow/.test(q)) {
      if (snap.calendar.tomorrowEvents.length === 0) {
        return snap.calendar.availability === "AVAILABLE"
          ? "No meetings were found for tomorrow in the bounded calendar window."
          : "Tomorrow’s meetings are not fully proven from current calendar evidence.";
      }
      const titles = snap.calendar.tomorrowEvents
        .slice(0, 5)
        .map((e) => e.title ?? "Untitled")
        .join("; ");
      return `Tomorrow: ${titles}.`;
    }
    if (/next meeting|attending/.test(q)) {
      const next = snap.calendar.nextEvent;
      if (!next) return "No upcoming meeting was found in the bounded calendar window.";
      if (/attending/.test(q)) {
        const names = (next.attendees ?? [])
          .map((a) => a.displayName || a.email)
          .filter(Boolean)
          .slice(0, 8);
        return names.length
          ? `Next meeting “${next.title ?? "Untitled"}” attendees: ${names.join(", ")}.`
          : `Next meeting “${next.title ?? "Untitled"}” — attendee list not fully available.`;
      }
      return `Next meeting: “${next.title ?? "Untitled"}” at ${next.start ?? "unknown time"}.`;
    }
    if (snap.calendar.todayEvents.length === 0) {
      return "No meetings were found for today in the bounded calendar window.";
    }
    const titles = snap.calendar.todayEvents
      .slice(0, 5)
      .map((e) => e.title ?? "Untitled")
      .join("; ");
    return `Today: ${titles}.`;
  }

  if (kind === "MEETING_PREP") {
    const next = snap.calendar.nextEvent;
    if (!next) {
      return "No upcoming meeting is available to prepare. Status remains NOT_EXECUTED — LEO will not send or modify calendar.";
    }
    return `Prepared a YELLOW meeting brief for “${next.title ?? "Untitled"}” (${next.start ?? "time unknown"}). Status: PREPARED / NOT_EXECUTED. Email and calendar text remain untrusted data.`;
  }

  // EMAIL
  if (snap.gmail.availability === "NOT_CONFIGURED") {
    return "Google Workspace is not configured for LEO yet.";
  }
  if (snap.gmail.availability !== "AVAILABLE" && snap.gmail.availability !== "PARTIAL") {
    const line = composeGoogleFailureDiagnosticLine("gmail", snap.runtimeDiagnostic);
    return line
      ? `LEO could not read Gmail right now.\n${line}`
      : "LEO could not read Gmail right now.";
  }
  return composeLeoGmailExecutiveSummary({
    counts: snap.gmail.executiveCounts,
    cards: snap.gmail.emailCards,
    ownerQuestion: snap.ownerQuestion,
    gmailAvailable: true,
  });
}

/**
 * Strip Git trailer metadata from owner-facing commit display.
 * Does not alter underlying evidence objects.
 */
export function sanitizeLeoCommitMessageForOwner(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter(
      (l) =>
        !/^(co-authored-by|signed-off-by|reviewed-by|acked-by|reported-by|tested-by|helped-by)\s*:/i.test(
          l,
        ),
    );
  const first = lines[0] ?? "";
  return first.replace(/\b[\w.+-]+@[\w.-]+\.\w+\b/g, "").replace(/\s{2,}/g, " ").trim();
}

export type LeoProjectQuestionKind =
  | "BRANCH"
  | "LATEST_COMMIT"
  | "PREVIEW_STATUS"
  | "PRODUCTION_COMPARISON"
  | "RECENT_CHANGES"
  | "QA_NEXT"
  | "GENERAL_PROJECT_STATUS";

/** Deterministic project question subtype — no AI. */
export function inferLeoProjectQuestionKind(question?: string | null): LeoProjectQuestionKind {
  const q = (question ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) return "GENERAL_PROJECT_STATUS";
  if (/\bwhat should i qa\b|\bqa next\b|\bwhat should i (test|review)\b/.test(q)) return "QA_NEXT";
  if (
    /\bis production on the same (commit|version)\b|\bis production running this commit\b|\bdoes production match this commit\b|\bis production on the (latest )?leo commit\b|\bis production caught up with leo\b|\bis production (on this|behind)\b|\bproduction on this commit\b|\bproduction (vs|versus) (leo|branch)\b/.test(
      q,
    )
  ) {
    return "PRODUCTION_COMPARISON";
  }
  if (
    /\bis the (leo )?preview ready\b|\bleo preview ready\b|\bis preview ready\b|\bdid the deployment fail\b/.test(
      q,
    )
  ) {
    return "PREVIEW_STATUS";
  }
  if (/\bwhat branch is leo on\b|\bwhat branch are we on\b/.test(q)) return "BRANCH";
  if (/\blatest (leo )?commit\b|\bwhat is the latest (leo )?commit\b/.test(q)) return "LATEST_COMMIT";
  if (
    /\bwhat changed (today|recently)\b|\bwhat changed in the repo\b|\bwhat did we (build|finish)\b/.test(
      q,
    )
  ) {
    return "RECENT_CHANGES";
  }
  if (
    /\bwhat is the leo project status\b|\bproject (status|intelligence)\b|\bwhat is deployed\b|\bwhat happened with leo\b/.test(
      q,
    )
  ) {
    return "GENERAL_PROJECT_STATUS";
  }
  return "GENERAL_PROJECT_STATUS";
}

function shortSha(sha: string | null | undefined): string {
  return sha ? sha.slice(0, 7) : "unknown";
}

function composeLegacyProjectSummary(snapshot: LeoProjectSnapshot): string {
  const parts: string[] = [];
  if (snapshot.github?.headSha) {
    const msg = sanitizeLeoCommitMessageForOwner(snapshot.github.headMessage);
    parts.push(
      `GitHub ${snapshot.github.fullName} branch ${snapshot.github.branch ?? "unknown"} head ${shortSha(snapshot.github.headSha)}${
        msg ? ` — ${msg}` : ""
      }.`,
    );
  } else if (snapshot.github?.availability === "NOT_CONFIGURED") {
    parts.push("GitHub project intelligence is not configured.");
  }
  const deps = snapshot.vercel?.deployments ?? [];
  if (deps.length > 0) {
    const latest = deps[0];
    parts.push(
      `Latest Vercel deployment ${latest.deploymentId.slice(0, 8)} target ${
        latest.target ?? "unknown"
      } is platform-state ${latest.readyState ?? "unknown"}. READY describes deployment state, not full application health.`,
    );
  } else if (snapshot.vercel?.availability === "NOT_CONFIGURED") {
    parts.push("Vercel project intelligence is not configured.");
  }
  return parts.join(" ") || "No project intelligence evidence is available yet.";
}

/** Question-aware executive project summary — concise by default. */
export function composeExecutiveProjectSummary(
  exec: LeoProjectExecutiveSnapshot,
  question?: string | null,
): string {
  const kind = inferLeoProjectQuestionKind(question ?? exec.ownerQuestion);
  const sha = shortSha(exec.leoHead.sha);
  const cleanMsg = sanitizeLeoCommitMessageForOwner(exec.leoHead.message);

  if (!exec.configurationState.github.configured && !exec.configurationState.vercel.configured) {
    return "Project intelligence is not configured yet. Set LEO_GITHUB_TOKEN and/or LEO_VERCEL_TOKEN for live evidence.";
  }

  switch (kind) {
    case "BRANCH": {
      if (!exec.leoHead.sha) {
        return exec.configurationState.github.configured
          ? "LEO branch head is currently unavailable from GitHub evidence."
          : "GitHub project intelligence is not configured.";
      }
      return `LEO is on \`${exec.leoBranch}\` at commit \`${sha}\`.`;
    }
    case "LATEST_COMMIT": {
      if (!exec.leoHead.sha) {
        return "The latest LEO commit is currently unavailable from GitHub evidence.";
      }
      return cleanMsg
        ? `The latest LEO commit is \`${sha}\` — “${cleanMsg}.”`
        : `The latest LEO commit is \`${sha}\`.`;
    }
    case "PREVIEW_STATUS": {
      const preview = exec.latestLeoPreview ?? exec.correlation.previewForHead;
      const states = new Set(exec.correlation.states);
      if (
        states.has("BRANCH_HEAD_PREVIEW_READY") ||
        (preview?.readyState ?? "").toUpperCase() === "READY"
      ) {
        const pSha = shortSha(preview?.gitCommitSha ?? exec.leoHead.sha);
        return `Yes. The latest LEO Preview for commit \`${pSha}\` is READY in Vercel. READY describes deployment state, not full application health.`;
      }
      if (states.has("BRANCH_HEAD_PREVIEW_BUILDING")) {
        return "The latest LEO Preview is still building.";
      }
      if (states.has("BRANCH_HEAD_PREVIEW_FAILED")) {
        return "The latest LEO Preview failed to build.";
      }
      if (states.has("BRANCH_HEAD_NO_PREVIEW")) {
        return "No Preview deployment was found for the exact branch-head commit.";
      }
      if (!exec.configurationState.vercel.configured) {
        return "Vercel project intelligence is not configured.";
      }
      return "Preview status is not fully proven from current Vercel evidence.";
    }
    case "PRODUCTION_COMPARISON": {
      if (exec.correlation.productionMatchesHead === true) {
        return "Yes. Production is running the same commit as the current LEO branch.";
      }
      if (exec.correlation.productionMatchesHead === false) {
        if (exec.correlation.productionBehindBranch === true) {
          return "No. Production is behind the current LEO branch.";
        }
        return "No. Production is on a different commit than the current LEO branch.";
      }
      if (!exec.configurationState.vercel.configured && !exec.leoHead.sha) {
        return "Production comparison is unavailable — project intelligence is not fully configured.";
      }
      return "Production vs LEO commit relationship is not fully proven from exact SHA evidence yet.";
    }
    case "RECENT_CHANGES": {
      const changes = exec.recentChanges.slice(0, 5);
      if (changes.length === 0) {
        return "No recent commit evidence is available yet.";
      }
      const lines = changes.map((c, i) => {
        const msg = sanitizeLeoCommitMessageForOwner(c.message) || shortSha(c.sha);
        return `${i + 1}. \`${shortSha(c.sha)}\` — ${msg}`;
      });
      return `Recent LEO changes:\n${lines.join("\n")}`;
    }
    case "QA_NEXT": {
      const prodNote =
        exec.correlation.productionMatchesHead === false
          ? " Production is on a different commit."
          : "";
      if (exec.qaAdvice.state === "QA_PREVIEW") {
        return `The current branch-head Preview is READY, so the next evidence-based step is Preview QA.${prodNote} READY describes deployment state, not full application health.`;
      }
      if (exec.qaAdvice.state === "WAIT_FOR_BUILD") {
        return "The latest branch-head Preview is still building. Wait for the build to finish before QA.";
      }
      if (exec.qaAdvice.state === "INVESTIGATE_BUILD_FAILURE") {
        return "The latest branch-head Preview failed to build. Investigate the failed Preview before QA.";
      }
      return `${exec.qaAdvice.summary} ${exec.qaAdvice.nextStep}`.trim();
    }
    case "GENERAL_PROJECT_STATUS":
    default: {
      const sentences: string[] = [];
      if (exec.leoHead.sha) {
        sentences.push(`LEO is on \`${exec.leoBranch}\` at \`${sha}\`.`);
      }
      const states = new Set(exec.correlation.states);
      if (states.has("BRANCH_HEAD_PREVIEW_READY")) {
        sentences.push(
          "Branch-head Preview is READY (deployment state only — not full application health).",
        );
      } else if (states.has("BRANCH_HEAD_PREVIEW_BUILDING")) {
        sentences.push("Branch-head Preview is still building.");
      } else if (states.has("BRANCH_HEAD_PREVIEW_FAILED")) {
        sentences.push("Branch-head Preview failed to build.");
      }
      if (exec.correlation.productionMatchesHead === true) {
        sentences.push("Production matches the current LEO commit.");
      } else if (exec.correlation.productionMatchesHead === false) {
        sentences.push(
          exec.correlation.productionBehindBranch
            ? "Production is behind the current LEO branch."
            : "Production is on a different commit.",
        );
      }
      if (exec.qaAdvice.state === "QA_PREVIEW") {
        sentences.push("Next evidence-based step: Preview QA.");
      } else if (exec.qaAdvice.state === "WAIT_FOR_BUILD") {
        sentences.push("Next step: wait for the Preview build.");
      } else if (exec.qaAdvice.state === "INVESTIGATE_BUILD_FAILURE") {
        sentences.push("Next step: investigate the Preview build failure.");
      }
      return sentences.slice(0, 4).join(" ") || "No project intelligence evidence is available yet.";
    }
  }
}

/** Compose from executive or legacy snapshot. */
export function composeLeoProjectIntelligenceSummary(
  snapshot: LeoProjectSnapshot | LeoProjectExecutiveSnapshot,
  question?: string | null,
): string {
  if ("leoHead" in snapshot && "correlation" in snapshot) {
    return composeExecutiveProjectSummary(snapshot, question ?? snapshot.ownerQuestion);
  }
  return composeLegacyProjectSummary(snapshot);
}

/** Safe follow-up chips — no execution implications. */
export function suggestedQuestionsForIntent(intent: LeoConversationIntent): string[] {
  switch (intent) {
    case "ATTENTION_OVERVIEW":
      return ["Who is waiting on us?", "What can you prepare for me?", "What can you do?"];
    case "CLIENT_CARE":
      return ["Prepare a follow-up plan.", "What needs my attention?", "What can you do?"];
    case "CAPABILITY_OVERVIEW":
      return ["What needs my attention?", "Who is waiting on us?", "What can you prepare for me?"];
    case "PROJECT_INTELLIGENCE":
      return ["What changed recently?", "What should I QA next?", "What needs my attention?"];
    case "COMMUNICATION_INTELLIGENCE":
      return [
        "What meetings do I have today?",
        "Who is waiting on my reply?",
        "Prepare me for my next meeting.",
      ];
    case "COMMITMENT_INTELLIGENCE":
      return [
        "What is overdue?",
        "What is due soon?",
        "What commitments have no due date?",
        "What did I complete?",
      ];
    case "RECEIPT_INTELLIGENCE":
      return [
        "What did you prepare?",
        "What failed?",
        "What is waiting for my approval?",
        "Show recent leo actions.",
      ];
    case "MORNING_BRIEF":
      return [
        "Who is waiting on me?",
        "Show overdue commitments.",
        "What can wait?",
        "Prepare me for my next meeting.",
        "What did LEO prepare?",
      ];
    case "CAPABILITY_GOVERNANCE":
      return ["What can you prepare instead?", "What can you do?", "What needs my attention?"];
    case "PREPARATION":
      return ["What needs my attention?", "Who is waiting on us?", "What can you do?"];
    case "LISTING_REASON":
      return ["What needs my attention?", "What can you do?"];
    case "DECISION_SUPPORT":
      return ["What can you prepare for me?", "What can you do?"];
    case "MEMORY_LOOKUP":
      return ["What needs my attention?", "What can you do?"];
    default:
      return ["What needs my attention?", "Who is waiting on us?", "What can you do?"];
  }
}

export function answerStateFromEvidence(
  hasEvidence: boolean,
  missingRequired: boolean,
  blocked: boolean,
  unsupported: boolean,
): LeoConversationAnswerState {
  if (blocked) return "BLOCKED_BY_GOVERNANCE";
  if (unsupported) return "UNSUPPORTED_INTENT";
  if (missingRequired) return "INSUFFICIENT_EVIDENCE";
  if (hasEvidence) return "ANSWERED";
  return "PARTIALLY_ANSWERED";
}
