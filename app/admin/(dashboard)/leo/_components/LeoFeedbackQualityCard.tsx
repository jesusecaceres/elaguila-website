"use client";

import { useEffect, useState } from "react";

import { adminCardBase } from "@/app/admin/_components/adminTheme";
import type { LeoFeedbackQualitySnapshot } from "@/app/leo/_lib/leoFeedbackTypes";

export function LeoFeedbackQualityCard() {
  const [snapshot, setSnapshot] = useState<LeoFeedbackQualitySnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/leo/feedback", { credentials: "same-origin" });
        const json = (await res.json()) as { ok?: boolean; snapshot?: LeoFeedbackQualitySnapshot };
        if (!cancelled && json.ok && json.snapshot) setSnapshot(json.snapshot);
      } catch {
        if (!cancelled) {
          setSnapshot({
            ratedResponses: 0,
            positiveCount: 0,
            negativeCount: 0,
            positiveRate: null,
            negativeByFailureClass: {},
            topNegativeCategory: null,
            navigationErrorCount: 0,
            voiceRecognitionErrorCount: 0,
            dataQualityErrorCount: 0,
            limitation: "Feedback metrics are unavailable right now.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!snapshot) return null;

  return (
    <section className={`${adminCardBase} mt-3 min-w-0 p-3`} data-leo-feedback-quality>
      <h3 className="text-sm font-bold text-[#1E1810]">Where LEO is failing</h3>
      {snapshot.limitation && snapshot.ratedResponses === 0 ? (
        <p className="mt-2 text-xs leading-relaxed text-[#5C5346]">{snapshot.limitation}</p>
      ) : (
        <ul className="mt-2 space-y-1 text-xs text-[#5C5346]">
          <li>Rated responses: {snapshot.ratedResponses}</li>
          <li>Positive: {snapshot.positiveCount}</li>
          <li>Negative: {snapshot.negativeCount}</li>
          <li>
            Positive rate:{" "}
            {snapshot.positiveRate == null ? "not enough data" : `${Math.round(snapshot.positiveRate * 100)}%`}
          </li>
          <li>Navigation errors: {snapshot.navigationErrorCount}</li>
          <li>Voice recognition errors: {snapshot.voiceRecognitionErrorCount}</li>
          <li>Data-quality errors: {snapshot.dataQualityErrorCount}</li>
          <li>Top negative category: {snapshot.topNegativeCategory ?? "none"}</li>
        </ul>
      )}
    </section>
  );
}
