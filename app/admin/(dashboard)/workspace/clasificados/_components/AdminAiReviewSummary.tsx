import type { ListingModerationReviewSummary } from "@/app/admin/_lib/listingModerationReviewTypes";
import {
  formatFlagList,
  formatRecommendedAction,
  formatRiskLevel,
} from "@/app/admin/_lib/listingModerationDisplay";

function formatReviewedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : null;
  } catch {
    return null;
  }
}

type Props = {
  review: ListingModerationReviewSummary;
  compact?: boolean;
};

export function AdminAiReviewSummary({ review, compact = false }: Props) {
  const reviewedAt = formatReviewedAt(review.reviewed_at);
  const riskLabel = formatRiskLevel(review.risk_level);
  const actionLabel = formatRecommendedAction(review.recommended_action);
  const policyList = formatFlagList(review.policy_flags, compact ? 2 : 6);
  const keywordList = formatFlagList(review.keyword_flags, compact ? 2 : 6);
  const textSize = compact ? "text-[10px]" : "text-xs";

  return (
    <div className={`space-y-1 ${textSize} text-[#5C5346]`} data-testid="admin-ai-review-summary">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md border border-[#1E4A7A]/40 bg-[#EEF4FC] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#1E4A7A]">
          AI
        </span>
        <span className="rounded-md border border-[#1E4A7A]/30 bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#1E4A7A]">
          {review.decision.replace("_", " ")}
        </span>
        {review.risk_level ? (
          <span className="rounded-md border border-[#7A1E2C]/25 bg-[#FDF2F4] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#7A1E2C]">
            {riskLabel ?? review.risk_level}
          </span>
        ) : null}
      </div>

      <p className="leading-snug break-words">
        {review.reason_category ? (
          <>
            Category: <span className="font-semibold">{review.reason_category}</span>
            {review.confidence ? (
              <>
                {" "}
                · Confidence: <span className="font-semibold">{review.confidence}</span>
              </>
            ) : null}
            {reviewedAt ? (
              <>
                {" "}
                · Reviewed: <span className="font-semibold">{reviewedAt}</span>
              </>
            ) : null}
          </>
        ) : null}
      </p>

      {actionLabel ? (
        <p className="font-semibold text-[#3D3428]">
          Recommended: <span className="font-normal">{actionLabel}</span>
        </p>
      ) : null}

      {review.reason_text ? <p className="leading-snug break-words">{review.reason_text}</p> : null}

      {review.model ? (
        <p className="text-[#9A9084]">
          Model: <span className="font-mono">{review.model}</span>
        </p>
      ) : null}

      {(policyList || keywordList || review.scanner_summary) && !compact ? (
        <details className="rounded-md border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-2">
          <summary className="cursor-pointer font-semibold text-[#5C5346]">AI policy details</summary>
          <div className="mt-2 space-y-1">
            {policyList ? (
              <p>
                Policy flags: <span className="font-semibold">{policyList}</span>
              </p>
            ) : null}
            {keywordList ? (
              <p>
                Keyword flags: <span className="font-semibold">{keywordList}</span>
              </p>
            ) : null}
            {review.category_rules?.length ? (
              <p>
                Category rules: <span className="font-semibold">{formatFlagList(review.category_rules, 6)}</span>
              </p>
            ) : null}
            {review.scanner_summary ? <p className="text-[#7A7164]">{review.scanner_summary}</p> : null}
            {review.admin_summary && review.admin_summary !== review.reason_text ? (
              <p className="text-[#7A7164]">{review.admin_summary}</p>
            ) : null}
          </div>
        </details>
      ) : compact && (policyList || keywordList) ? (
        <p className="text-[#9A9084]">
          {policyList ? `Policy: ${policyList}` : null}
          {policyList && keywordList ? " · " : null}
          {keywordList ? `Keywords: ${keywordList}` : null}
        </p>
      ) : null}
    </div>
  );
}
