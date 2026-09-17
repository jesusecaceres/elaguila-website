/**
 * LEO-22C — Bounded feedback quality metrics. No invented percentages.
 */

import type {
  LeoFeedbackFailureCategory,
  LeoFeedbackFailureClass,
  LeoFeedbackQualitySnapshot,
  LeoFeedbackRecord,
} from "@/app/leo/_lib/leoFeedbackTypes";

export function aggregateLeoFeedbackQuality(
  rows: Pick<LeoFeedbackRecord, "polarity" | "failureCategory" | "failureClass">[],
): LeoFeedbackQualitySnapshot {
  if (!rows.length) {
    return {
      ratedResponses: 0,
      positiveCount: 0,
      negativeCount: 0,
      positiveRate: null,
      negativeByFailureClass: {},
      topNegativeCategory: null,
      navigationErrorCount: 0,
      voiceRecognitionErrorCount: 0,
      dataQualityErrorCount: 0,
      limitation: "No rated responses yet.",
    };
  }

  const unique = rows;
  const positiveCount = unique.filter((r) => r.polarity === "POSITIVE").length;
  const negativeCount = unique.filter((r) => r.polarity === "NEGATIVE").length;
  const ratedResponses = unique.length;
  const negativeByFailureClass: Partial<Record<LeoFeedbackFailureClass, number>> = {};
  const categoryCounts: Partial<Record<LeoFeedbackFailureCategory, number>> = {};

  for (const row of unique) {
    if (row.polarity !== "NEGATIVE") continue;
    if (row.failureClass) {
      negativeByFailureClass[row.failureClass] = (negativeByFailureClass[row.failureClass] ?? 0) + 1;
    }
    if (row.failureCategory) {
      categoryCounts[row.failureCategory] = (categoryCounts[row.failureCategory] ?? 0) + 1;
    }
  }

  let topNegativeCategory: LeoFeedbackFailureCategory | null = null;
  let top = 0;
  for (const [cat, n] of Object.entries(categoryCounts) as [LeoFeedbackFailureCategory, number][]) {
    if (n > top) {
      top = n;
      topNegativeCategory = cat;
    }
  }

  return {
    ratedResponses,
    positiveCount,
    negativeCount,
    positiveRate: ratedResponses > 0 ? positiveCount / ratedResponses : null,
    negativeByFailureClass,
    topNegativeCategory,
    navigationErrorCount: negativeByFailureClass.NAVIGATION ?? 0,
    voiceRecognitionErrorCount: negativeByFailureClass.VOICE_RECOGNITION ?? 0,
    dataQualityErrorCount: negativeByFailureClass.DATA_QUALITY ?? 0,
    limitation: null,
  };
}
