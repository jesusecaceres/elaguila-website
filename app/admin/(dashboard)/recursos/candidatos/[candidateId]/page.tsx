import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminCardBase } from "@/app/admin/_components/adminTheme";
import { ExecutiveHubConfirmSubmitButton } from "@/app/admin/_components/executiveHub/ExecutiveHubConfirmSubmitButton";
import { CandidateReviewForm } from "@/app/admin/_components/recursos/CandidateReviewForm";
import { VerificationTimeline } from "@/app/admin/_components/recursos/VerificationTimeline";
import { dropCandidateAction, promoteCandidateAction } from "@/app/admin/recursosCandidateActions";
import { dbGetCandidateReview } from "@/app/lib/recursos/server/communityResourceCandidateReviewsDb";
import { dbListVerificationEventsForCandidate } from "@/app/lib/recursos/intake/server/verificationEventsDb";
import { isEvidenceSufficientForPriority1 } from "@/app/lib/recursos/verificationEvidence";
import { getPrimaryCategoryLabel } from "@/app/lib/recursos/categories";
import { getUrgencyLabel } from "@/app/lib/recursos/urgency";
import type { CandidateResourceRecord } from "@/app/lib/recursos/sourceIngestion";
import candidatesData from "@/data/recursos/candidates/scc-community-resource-guide-2023.json";

export const dynamic = "force-dynamic";

const CANDIDATES = candidatesData as unknown as CandidateResourceRecord[];

export default async function RecursosCandidateDetailPage(props: {
  params: Promise<{ candidateId: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  const { candidateId } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const candidate = CANDIDATES.find((c) => c.candidateId === candidateId);
  if (!candidate) notFound();

  const [review, timeline] = await Promise.all([dbGetCandidateReview(candidateId), dbListVerificationEventsForCandidate(candidateId)]);
  const canPromote =
    review &&
    !review.promotedResourceId &&
    review.disposition === "ready_for_promotion" &&
    review.organizationConfirmedActive === true &&
    Boolean(review.currentSourceUrl) &&
    isEvidenceSufficientForPriority1(review, candidate);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos — Candidate review"
        title={candidate.organizationName}
        subtitle={candidate.programName ?? undefined}
        rightSlot={
          <Link href="/admin/recursos/candidatos" className={adminBtnPrimary}>
            ← Back to queue
          </Link>
        }
      />

      {sp.saved ? <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">Saved.</p> : null}
      {sp.error ? <p className="mb-6 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{sp.error}</p> : null}
      {review?.promotedResourceId ? (
        <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          Already promoted to{" "}
          <Link href={`/admin/recursos/${review.promotedResourceId}`} className="font-bold underline">
            community_resources record {review.promotedResourceId}
          </Link>
          . Continue that record&apos;s verification on the main Recursos admin page.
        </p>
      ) : null}

      <section className={`${adminCardBase} mb-6 p-4 sm:p-5`}>
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#7A2E2E]">2023 PDF source data — NOT current truth</h3>
        <p className="mt-1 text-xs leading-snug text-[#7A7164]">
          Everything below is exactly what the 2023 Santa Clara County Community Resource Guide said. It is a discovery lead,
          not a fact. Confirm each item against a current official source in the evidence form below before relying on it.
        </p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Suggested category / urgency</dt>
            <dd className="text-sm text-[#1E1810]">
              {getPrimaryCategoryLabel(candidate.suggestedPrimaryCategory, "en")} · {getUrgencyLabel(candidate.suggestedUrgencyLevel, "en")} · Priority {candidate.verificationPriority}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Source page(s)</dt>
            <dd className="text-sm text-[#1E1810]">{candidate.sourcePages.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">PDF-listed phone / crisis phone</dt>
            <dd className="text-sm text-[#1E1810]">{candidate.phone ?? candidate.crisisPhone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">PDF-listed website</dt>
            <dd className="text-sm text-[#1E1810]">{candidate.websiteUrl ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Services (as printed)</dt>
            <dd className="text-sm text-[#1E1810]">{candidate.services.join("; ") || "—"}</dd>
          </div>
          {candidate.is24Hours ? (
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">PDF claims 24/7</dt>
              <dd className="text-sm text-[#1E1810]">Yes per 2023 source — must be explicitly re-confirmed, never assumed still true.</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <CandidateReviewForm candidateId={candidateId} review={review} />

      <div className="mt-6 flex flex-wrap gap-3">
        <form action={promoteCandidateAction}>
          <input type="hidden" name="candidateId" value={candidateId} />
          <ExecutiveHubConfirmSubmitButton
            confirmMessage="Promote this candidate into an inactive, needs_review community_resources record? This does not publish or verify it."
            className={`${adminBtnPrimary} ${canPromote ? "" : "pointer-events-none opacity-40"}`}
          >
            Promote (creates inactive, needs_review record)
          </ExecutiveHubConfirmSubmitButton>
        </form>
        <form action={dropCandidateAction}>
          <input type="hidden" name="candidateId" value={candidateId} />
          <ExecutiveHubConfirmSubmitButton
            confirmMessage="Mark this candidate dropped (obsolete)? The 2023 source evidence is preserved either way, never deleted."
            className="rounded-lg border border-rose-800 bg-rose-800 px-4 py-2 text-sm font-bold text-white hover:bg-rose-900"
          >
            Drop (obsolete)
          </ExecutiveHubConfirmSubmitButton>
        </form>
      </div>
      {!canPromote ? (
        <p className="mt-2 text-xs text-[#8B7E70]">
          Promote unlocks once evidence confirms the organization is active, cites a current official source, has disposition
          &quot;Ready for promotion&quot;, and — for help-now candidates — meets the stricter Priority-1 evidence bar.
        </p>
      ) : null}

      <div className="mt-6">
        <VerificationTimeline events={timeline} title="Historial de este candidato (interno)" compact />
      </div>
    </div>
  );
}
