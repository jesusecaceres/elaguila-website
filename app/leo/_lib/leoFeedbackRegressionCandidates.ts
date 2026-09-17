/**
 * LEO-22C — Structured feedback → regression candidates.
 * High-confidence structured cases only. Notes never become executable tests.
 */

import type {
  LeoFeedbackFailureClass,
  LeoFeedbackRecord,
  LeoRegressionCandidate,
} from "@/app/leo/_lib/leoFeedbackTypes";

export function leoFeedbackToRegressionCandidate(
  row: Pick<
    LeoFeedbackRecord,
    "id" | "failureClass" | "requestSnapshot" | "expectedDestination" | "activeWorkspace" | "polarity"
  >,
): LeoRegressionCandidate | null {
  if (row.polarity !== "NEGATIVE") return null;
  if (row.failureClass !== "NAVIGATION") return null;
  const input = row.requestSnapshot?.trim() ?? "";
  const expected = row.expectedDestination?.trim() ?? "";
  if (!input || !expected) return null;
  return {
    input,
    observed: row.activeWorkspace,
    expected,
    failureClass: row.failureClass as LeoFeedbackFailureClass,
    feedbackId: row.id,
    eligible: true,
  };
}

export function leoCollectRegressionCandidates(
  rows: Array<
    Pick<
      LeoFeedbackRecord,
      "id" | "failureClass" | "requestSnapshot" | "expectedDestination" | "activeWorkspace" | "polarity"
    >
  >,
): LeoRegressionCandidate[] {
  return rows
    .map(leoFeedbackToRegressionCandidate)
    .filter((c): c is LeoRegressionCandidate => c != null)
    .slice(0, 40);
}
