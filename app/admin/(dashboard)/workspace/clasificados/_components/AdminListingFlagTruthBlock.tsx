import { classifyGenericListingFlagTruth, type AdminReviewFlagSourceKind } from "@/app/admin/_lib/adminReviewFlagTruth";
import type { ListingFlagReportContext } from "@/app/admin/_lib/adminReviewFlagContext";

const BADGE_STYLES: Record<AdminReviewFlagSourceKind, string> = {
  ai_moderation: "border-[#1E4A7A]/40 bg-[#EEF4FC] text-[#1E4A7A]",
  user_report: "border-[#C9782F]/50 bg-[#FFF4E8] text-[#8B4A12]",
  manual_admin: "border-[#7A1E2C]/35 bg-[#FDF2F4] text-[#7A1E2C]",
  status_flagged: "border-[#C9B46A]/50 bg-[#FFFCF7] text-[#5C4E2E]",
  unknown_legacy: "border-[#E8DFD0] bg-[#FAF7F2] text-[#7A7164]",
  unknown: "border-[#E8DFD0] bg-[#FAF7F2] text-[#9A9084]",
};

type Props = {
  status: string | null | undefined;
  report?: ListingFlagReportContext | null;
  compact?: boolean;
};

export function AdminListingFlagTruthBlock({ status, report, compact = false }: Props) {
  const truth = classifyGenericListingFlagTruth(status, report ?? undefined);
  const st = (status ?? "").toLowerCase();
  if (st !== "flagged" && st !== "pending") return null;

  return (
    <div
      className={`min-w-0 ${compact ? "mt-1.5" : "mt-2 rounded-lg border border-[#E8DFD0]/70 bg-[#FFFCF7]/80 p-2"}`}
      data-testid="admin-listing-flag-truth"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${BADGE_STYLES[truth.sourceKind]}`}
          data-testid="admin-flag-source-badge"
        >
          {truth.sourceLabel}
        </span>
        {report?.pendingReportCount ? (
          <span className="text-[10px] font-semibold text-[#8B4A12]">{report.pendingReportCount} pending report(s)</span>
        ) : null}
      </div>
      <p className={`${compact ? "mt-1 text-[11px]" : "mt-1.5 text-xs"} leading-snug text-[#5C5346] break-words`}>
        {truth.ownerFacingExplanation}
      </p>
      {truth.secondaryFallback && truth.sourceKind !== "unknown_legacy" ? (
        <p className="mt-0.5 text-[10px] text-[#9A9084]">{truth.secondaryFallback}</p>
      ) : null}
    </div>
  );
}
