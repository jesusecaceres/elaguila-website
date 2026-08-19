import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { AdminStatCard } from "@/app/admin/_components/AdminStatCard";
import { adminCtaChip, adminCtaChipCompact, adminDesktopTableOnly, adminMobileCardList, adminTableWrap, adminTableZebraRow } from "@/app/admin/_components/adminTheme";
import { dbListCandidateReviews } from "@/app/lib/recursos/server/communityResourceCandidateReviewsDb";
import { candidateReviewDispositionLabel, isEvidenceComplete } from "@/app/lib/recursos/verificationEvidence";
import { getPrimaryCategoryLabel } from "@/app/lib/recursos/categories";
import { getUrgencyLabel } from "@/app/lib/recursos/urgency";
import type { CandidateResourceRecord } from "@/app/lib/recursos/sourceIngestion";
import candidatesData from "@/data/recursos/candidates/scc-community-resource-guide-2023.json";

export const dynamic = "force-dynamic";

const CANDIDATES = candidatesData as unknown as CandidateResourceRecord[];

const DISPOSITION_BADGE: Record<string, string> = {
  pending: "border border-slate-300 bg-slate-50 text-slate-700",
  ready_for_promotion: "border border-amber-200 bg-amber-50 text-amber-950",
  promoted: "border border-emerald-200 bg-emerald-50 text-emerald-950",
  dropped: "border border-rose-200 bg-rose-50 text-rose-900",
};

export default async function RecursosCandidatesAdminPage(props: { searchParams?: Promise<{ priority?: string; status_saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const priorityFilter = sp.priority ? Number(sp.priority) : null;

  const { rows: reviews, unavailable } = await dbListCandidateReviews();
  const reviewByCandidateId = new Map(reviews.map((r) => [r.candidateId, r]));

  const joined = CANDIDATES.map((candidate) => ({
    candidate,
    review: reviewByCandidateId.get(candidate.candidateId) ?? null,
  })).sort((a, b) => a.candidate.verificationPriority - b.candidate.verificationPriority || a.candidate.organizationName.localeCompare(b.candidate.organizationName));

  const visible = priorityFilter ? joined.filter((j) => j.candidate.verificationPriority === priorityFilter) : joined;

  const counts = {
    total: CANDIDATES.length,
    priority1: CANDIDATES.filter((c) => c.verificationPriority === 1).length,
    priority2: CANDIDATES.filter((c) => c.verificationPriority === 2).length,
    priority3: CANDIDATES.filter((c) => c.verificationPriority === 3).length,
    promoted: joined.filter((j) => j.review?.disposition === "promoted").length,
    readyForPromotion: joined.filter((j) => j.review?.disposition === "ready_for_promotion").length,
    dropped: joined.filter((j) => j.review?.disposition === "dropped").length,
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos"
        title="Candidate resources — 2023 SCC PDF"
        subtitle="Discovery leads only. Nothing here is public, verified, or a community_resources record until a human confirms it against a CURRENT official source and promotes it."
      />

      <AdminPagePurposeCard
        title="Candidate review queue"
        purpose="Work the 2023 Santa Clara County Community Resource Guide candidate inventory into verified Recursos records, one at a time, current-source-first."
        dataSource="Immutable source: data/recursos/candidates/scc-community-resource-guide-2023.json (never written to). Review/evidence state: Supabase public.community_resource_candidate_reviews."
        status="real"
        safeActions={["Open a candidate and record current-source evidence", "Mark a candidate dropped (obsolete)", "Promote a ready candidate into an inactive, needs_review resource"]}
        nextGate="Promoted candidates still need manual review + the existing Verify action on /admin/recursos before they can ever become active/public."
        warningNote="The 2023 PDF is not current truth. Every field shown from the PDF is a lead, not a fact — confirm it live before trusting it."
      />

      {unavailable ? (
        <p className="mb-6 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          Supabase is not configured or unreachable — candidate review state cannot load. The candidate list below still
          renders from the static JSON, but evidence/disposition will show as empty until Supabase is available.
        </p>
      ) : null}
      {sp.status_saved ? <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">Saved.</p> : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard title="Total candidates" value={counts.total} />
        <AdminStatCard title="Priority 1 (crisis/safety)" value={counts.priority1} accent="rose" />
        <AdminStatCard title="Ready for promotion" value={counts.readyForPromotion} accent={counts.readyForPromotion > 0 ? "amber" : "default"} />
        <AdminStatCard title="Promoted" value={counts.promoted} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/recursos/candidatos" className={`${adminCtaChip} ${adminCtaChipCompact} ${!priorityFilter ? "font-bold underline" : ""}`}>
          All ({counts.total})
        </Link>
        <Link href="/admin/recursos/candidatos?priority=1" className={`${adminCtaChip} ${adminCtaChipCompact} ${priorityFilter === 1 ? "font-bold underline" : ""}`}>
          Priority 1 ({counts.priority1})
        </Link>
        <Link href="/admin/recursos/candidatos?priority=2" className={`${adminCtaChip} ${adminCtaChipCompact} ${priorityFilter === 2 ? "font-bold underline" : ""}`}>
          Priority 2 ({counts.priority2})
        </Link>
        <Link href="/admin/recursos/candidatos?priority=3" className={`${adminCtaChip} ${adminCtaChipCompact} ${priorityFilter === 3 ? "font-bold underline" : ""}`}>
          Priority 3 ({counts.priority3})
        </Link>
      </div>

      <div className={`${adminDesktopTableOnly} ${adminTableWrap}`}>
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--lx-border)]/70 text-xs font-bold uppercase tracking-wide text-[#7A7164]">
              <th className="px-4 py-3">Organization / program</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Urgency</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Source page(s)</th>
              <th className="px-4 py-3">Disposition</th>
              <th className="px-4 py-3">Evidence</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ candidate, review }) => (
              <tr key={candidate.candidateId} className={adminTableZebraRow}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#1E1810]">{candidate.organizationName}</p>
                  {candidate.programName ? <p className="text-xs text-[#7A7164]">{candidate.programName}</p> : null}
                </td>
                <td className="px-4 py-3 text-[#5C5346]">P{candidate.verificationPriority}</td>
                <td className="px-4 py-3 text-[#5C5346]">{getUrgencyLabel(candidate.suggestedUrgencyLevel, "en")}</td>
                <td className="px-4 py-3 text-[#5C5346]">{getPrimaryCategoryLabel(candidate.suggestedPrimaryCategory, "en")}</td>
                <td className="px-4 py-3 text-xs text-[#7A7164]">{candidate.sourcePages.join(", ")}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${DISPOSITION_BADGE[review?.disposition ?? "pending"]}`}>
                    {candidateReviewDispositionLabel(review?.disposition ?? "pending")}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#7A7164]">{review && isEvidenceComplete(review) ? "Complete" : "Incomplete"}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/recursos/candidatos/${encodeURIComponent(candidate.candidateId)}`} className={`${adminCtaChip} ${adminCtaChipCompact}`}>
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={adminMobileCardList}>
        {visible.map(({ candidate, review }) => (
          <div key={candidate.candidateId} className="rounded-2xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-[#1E1810]">{candidate.organizationName}</p>
                {candidate.programName ? <p className="text-xs text-[#7A7164]">{candidate.programName}</p> : null}
              </div>
              <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${DISPOSITION_BADGE[review?.disposition ?? "pending"]}`}>
                {candidateReviewDispositionLabel(review?.disposition ?? "pending")}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#5C5346]">
              <div>
                <dt className="text-[#7A7164]">Priority</dt>
                <dd>P{candidate.verificationPriority}</dd>
              </div>
              <div>
                <dt className="text-[#7A7164]">Category</dt>
                <dd>{getPrimaryCategoryLabel(candidate.suggestedPrimaryCategory, "en")}</dd>
              </div>
            </dl>
            <div className="mt-3">
              <Link href={`/admin/recursos/candidatos/${encodeURIComponent(candidate.candidateId)}`} className={`${adminCtaChip} ${adminCtaChipCompact}`}>
                Review
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
