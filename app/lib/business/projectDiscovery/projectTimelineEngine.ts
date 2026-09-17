/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — compact project timeline (MD
 * <project_timeline>). Pure function only. Deliberately derives ONLY from timestamps this codebase
 * already persists (blueprint version lifecycle timestamps, feedback capture timestamps, the
 * derived moment every release-blocking QA item last became resolved) — no event-sourcing
 * platform, no new event table.
 */
export interface TimelineEvent {
  key: string;
  labelEs: string;
  labelEn: string;
  at: string;
}

export interface TimelineBlueprintVersion {
  version: number;
  createdAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  releasedAt: string | null;
  handoffCompletedAt: string | null;
}

export interface TimelineFeedbackEntry {
  feedbackType: "approved" | "change_requested" | "needs_clarification" | "general";
  createdAt: string;
}

const FEEDBACK_LABEL: Record<TimelineFeedbackEntry["feedbackType"], { es: string; en: string }> = {
  approved: { es: "El cliente aprobó un elemento", en: "Client approved an item" },
  change_requested: { es: "El cliente solicitó un cambio", en: "Client requested a change" },
  needs_clarification: { es: "Se necesita aclaración del cliente", en: "Client clarification needed" },
  general: { es: "Retroalimentación del cliente registrada", en: "Client feedback recorded" },
};

export function buildProjectTimeline(input: {
  blueprintVersions: readonly TimelineBlueprintVersion[];
  feedback: readonly TimelineFeedbackEntry[];
  qaPassedAt: string | null;
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const v of input.blueprintVersions) {
    events.push({ key: `blueprint_generated_v${v.version}`, labelEs: `Plan del proyecto generado (v${v.version})`, labelEn: `Project blueprint generated (v${v.version})`, at: v.createdAt });
    if (v.reviewedAt) events.push({ key: `internal_review_v${v.version}`, labelEs: `Revisión interna completa (v${v.version})`, labelEn: `Internal review complete (v${v.version})`, at: v.reviewedAt });
    if (v.approvedAt) events.push({ key: `approved_v${v.version}`, labelEs: `Aprobado para construcción (v${v.version})`, labelEn: `Approved for build (v${v.version})`, at: v.approvedAt });
    if (v.releasedAt) events.push({ key: `released_v${v.version}`, labelEs: `Lanzado / entregado (v${v.version})`, labelEn: `Launched / delivered (v${v.version})`, at: v.releasedAt });
    if (v.handoffCompletedAt) events.push({ key: `handoff_complete_v${v.version}`, labelEs: `Entrega completada (v${v.version})`, labelEn: `Handoff complete (v${v.version})`, at: v.handoffCompletedAt });
  }

  input.feedback.forEach((f, i) => {
    const label = FEEDBACK_LABEL[f.feedbackType];
    events.push({ key: `feedback_${i}_${f.createdAt}`, labelEs: label.es, labelEn: label.en, at: f.createdAt });
  });

  if (input.qaPassedAt) {
    events.push({ key: "qa_passed", labelEs: "Control de calidad aprobado", labelEn: "QA passed", at: input.qaPassedAt });
  }

  return events.sort((a, b) => a.at.localeCompare(b.at));
}
