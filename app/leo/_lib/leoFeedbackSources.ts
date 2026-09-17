/**
 * LEO-22C — Evidence-backed source extraction from an existing answer.
 * Never invents citations. Strips secrets.
 */

import type { LeoConversationAnswer, LeoConversationEvidence } from "@/app/leo/_lib/leoTypes";
import type { LeoFeedbackSourceRef } from "@/app/leo/_lib/leoFeedbackTypes";

const SECRETISH = /token|secret|authorization|password|api[_-]?key/i;

export function extractLeoAnswerSourceRefs(answer: LeoConversationAnswer | null | undefined): LeoFeedbackSourceRef[] {
  if (!answer) return [];
  const out: LeoFeedbackSourceRef[] = [];

  for (const ev of answer.evidence ?? []) {
    const ref = sanitizeEvidence(ev);
    if (ref) out.push(ref);
  }
  for (const c of answer.citations ?? []) {
    if (SECRETISH.test(c.sourceRef) || SECRETISH.test(c.label)) continue;
    out.push({
      sourceKind: c.sourceKind.slice(0, 80),
      sourceRef: c.sourceRef.slice(0, 240),
      label: c.label.slice(0, 200),
    });
  }
  return out.slice(0, 12);
}

function sanitizeEvidence(ev: LeoConversationEvidence): LeoFeedbackSourceRef | null {
  if (SECRETISH.test(ev.sourceRef) || SECRETISH.test(ev.summary)) return null;
  return {
    sourceKind: ev.sourceKind.slice(0, 80),
    sourceRef: ev.sourceRef.slice(0, 240),
    label: ev.summary.slice(0, 200),
  };
}
