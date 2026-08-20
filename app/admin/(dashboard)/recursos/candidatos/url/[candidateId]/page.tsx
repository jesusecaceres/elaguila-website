import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminCardBase } from "@/app/admin/_components/adminTheme";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { ExecutiveHubConfirmSubmitButton } from "@/app/admin/_components/executiveHub/ExecutiveHubConfirmSubmitButton";
import { CandidateReviewForm } from "@/app/admin/_components/recursos/CandidateReviewForm";
import { dropUrlCandidateAction, promoteUrlCandidateAction, saveUrlCandidateReviewAction } from "@/app/admin/recursosUrlCandidateActions";
import { dbGetCandidateReview } from "@/app/lib/recursos/server/communityResourceCandidateReviewsDb";
import { isEvidenceSufficientForPriority1 } from "@/app/lib/recursos/verificationEvidence";
import { decodeProposalFromDiscrepancies } from "@/app/lib/recursos/intake/urlCandidateProposal";
import { getPrimaryCategoryLabel } from "@/app/lib/recursos/categories";
import { getUrgencyLabel } from "@/app/lib/recursos/urgency";

export const dynamic = "force-dynamic";

export default async function RecursosUrlCandidateDetailPage(props: {
  params: Promise<{ candidateId: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  await requireLeonixAdminPermission("can_manage_recursos");

  const { candidateId } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  if (!candidateId.startsWith("url-")) notFound();

  const review = await dbGetCandidateReview(candidateId);
  if (!review) notFound();

  const proposal = decodeProposalFromDiscrepancies(review.discrepanciesFromPdf);
  const canPromote =
    !review.promotedResourceId &&
    review.disposition === "ready_for_promotion" &&
    review.organizationConfirmedActive === true &&
    Boolean(review.currentSourceUrl) &&
    isEvidenceSufficientForPriority1(review, { suggestedUrgencyLevel: proposal.suggestedUrgencyLevel ?? "i-need-help", is24Hours: proposal.is24Hours });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos — Candidato de intake por URL"
        title={proposal.organizationName || candidateId}
        subtitle={proposal.programName ?? undefined}
        rightSlot={
          <Link href="/admin/recursos/candidatos" className={adminBtnPrimary}>
            ← Volver a la cola
          </Link>
        }
      />

      {sp.saved ? <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">Guardado.</p> : null}
      {sp.error ? <p className="mb-6 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{sp.error}</p> : null}
      {review.promotedResourceId ? (
        <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          Ya promovido a{" "}
          <Link href={`/admin/recursos/${review.promotedResourceId}`} className="font-bold underline">
            community_resources {review.promotedResourceId}
          </Link>
          . Continúa la verificación desde el panel principal de Recursos.
        </p>
      ) : null}

      <section className={`${adminCardBase} mb-6 p-4 sm:p-5`}>
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#7A2E2E]">Propuesta de intake por URL — NO es verdad verificada</h3>
        <p className="mt-1 text-xs leading-snug text-[#7A7164]">
          Todo lo siguiente proviene de un análisis automático (extracción determinística {" "}
          {review.currentSourceUrl ? <>de <a href={review.currentSourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{review.currentSourceUrl}</a></> : null}
          {" "}+ propuesta de IA cuando estaba disponible). Confirma cada campo contra la fuente oficial antes de confiar en él.
        </p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Categoría / urgencia propuestas</dt>
            <dd className="text-sm text-[#1E1810]">
              {getPrimaryCategoryLabel(proposal.suggestedPrimaryCategory ?? "community-support", "es")} · {getUrgencyLabel(proposal.suggestedUrgencyLevel ?? "i-need-help", "es")}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Teléfono / crisis propuesto</dt>
            <dd className="text-sm text-[#1E1810]">{proposal.phone ?? proposal.crisisPhone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Sitio web</dt>
            <dd className="text-sm text-[#1E1810]">{proposal.websiteUrl ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Dirección propuesta</dt>
            <dd className="text-sm text-[#1E1810]">{proposal.addressWithheldForSafety ? "Retenida por seguridad — no propuesta" : proposal.addressLine1 ?? "—"}</dd>
          </div>
          {proposal.is24Hours ? (
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Afirma 24/7</dt>
              <dd className="text-sm text-[#1E1810]">Propuesto — debe confirmarse explícitamente, nunca asumirse.</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <CandidateReviewForm candidateId={candidateId} review={review} action={saveUrlCandidateReviewAction} />

      <div className="mt-6 flex flex-wrap gap-3">
        <form action={promoteUrlCandidateAction}>
          <input type="hidden" name="candidateId" value={candidateId} />
          <ExecutiveHubConfirmSubmitButton
            confirmMessage="¿Promover este candidato a un registro inactivo, needs_review de community_resources? Esto no lo publica ni lo verifica."
            className={`${adminBtnPrimary} ${canPromote ? "" : "pointer-events-none opacity-40"}`}
          >
            Promover (crea registro inactivo, needs_review)
          </ExecutiveHubConfirmSubmitButton>
        </form>
        <form action={dropUrlCandidateAction}>
          <input type="hidden" name="candidateId" value={candidateId} />
          <ExecutiveHubConfirmSubmitButton
            confirmMessage="¿Marcar este candidato como descartado? La evidencia se conserva, nunca se elimina."
            className="rounded-lg border border-rose-800 bg-rose-800 px-4 py-2 text-sm font-bold text-white hover:bg-rose-900"
          >
            Descartar
          </ExecutiveHubConfirmSubmitButton>
        </form>
      </div>
      {!canPromote ? (
        <p className="mt-2 text-xs text-[#8B7E70]">
          Promover se habilita cuando la evidencia confirma que la organización está activa, cita una fuente oficial actual, tiene
          disposición &quot;Ready for promotion&quot;, y — para candidatos ayuda-ahora — cumple el estándar de evidencia Prioridad 1.
        </p>
      ) : null}
    </div>
  );
}
