import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminCardBase } from "@/app/admin/_components/adminTheme";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { ExecutiveHubConfirmSubmitButton } from "@/app/admin/_components/executiveHub/ExecutiveHubConfirmSubmitButton";
import { CandidateReviewForm } from "@/app/admin/_components/recursos/CandidateReviewForm";
import { VerificationTimeline } from "@/app/admin/_components/recursos/VerificationTimeline";
import { dropUrlCandidateAction, promoteUrlCandidateAction, saveUrlCandidateReviewAction } from "@/app/admin/recursosUrlCandidateActions";
import { dbGetCandidateReview } from "@/app/lib/recursos/server/communityResourceCandidateReviewsDb";
import { isEvidenceSufficientForPriority1 } from "@/app/lib/recursos/verificationEvidence";
import { decodeProposalFromDiscrepancies } from "@/app/lib/recursos/intake/urlCandidateProposal";
import { decodeMatchMetadata } from "@/app/lib/recursos/intake/candidateMatchMetadata";
import { dbListPendingResourceChangeProposalsForResource } from "@/app/lib/recursos/intake/server/resourceChangeProposalsDb";
import { dbListVerificationEventsForCandidate } from "@/app/lib/recursos/intake/server/verificationEventsDb";
import { getPrimaryCategoryLabel } from "@/app/lib/recursos/categories";
import { getUrgencyLabel } from "@/app/lib/recursos/urgency";

export const dynamic = "force-dynamic";

const MATCH_LABEL: Record<string, string> = {
  NEW: "Nuevo — sin coincidencia con recursos existentes",
  LIKELY_MATCH: "Posible coincidencia con un recurso existente",
  POSSIBLE_DUPLICATE: "Posible duplicado — múltiples recursos comparten una señal fuerte",
  EXISTING_RESOURCE_UPDATE: "Coincide con un recurso ya publicado",
};
const MATCH_BADGE: Record<string, string> = {
  NEW: "border border-emerald-200 bg-emerald-50 text-emerald-950",
  LIKELY_MATCH: "border border-amber-200 bg-amber-50 text-amber-950",
  POSSIBLE_DUPLICATE: "border border-rose-200 bg-rose-50 text-rose-900",
  EXISTING_RESOURCE_UPDATE: "border border-sky-200 bg-sky-50 text-sky-950",
};

export default async function RecursosUrlCandidateDetailPage(props: {
  params: Promise<{ candidateId: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  await requireLeonixAdminPermission("can_manage_recursos");

  const { candidateId } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  if (!candidateId.startsWith("url-") && !candidateId.startsWith("pdf-")) notFound();

  const review = await dbGetCandidateReview(candidateId);
  if (!review) notFound();

  const proposal = decodeProposalFromDiscrepancies(review.discrepanciesFromPdf);
  const match = decodeMatchMetadata(review.discrepanciesFromPdf);
  const pendingChanges = match.matchedResourceId ? await dbListPendingResourceChangeProposalsForResource(match.matchedResourceId) : [];
  const timeline = await dbListVerificationEventsForCandidate(candidateId);

  // Gate 5L: a candidate already classified as an update to an existing resource should not be
  // promoted into a SECOND resource — the primary workflow is reviewing the change proposals
  // already generated for the matched resource, not creating a duplicate. Promotion stays
  // blocked for this classification regardless of evidence completeness.
  const isExistingUpdate = match.classification === "EXISTING_RESOURCE_UPDATE" && Boolean(match.matchedResourceId);
  const canPromote =
    !isExistingUpdate &&
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#5C4E2E]">Coincidencia con recursos existentes</h3>
          <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${MATCH_BADGE[match.classification] ?? ""}`}>
            {match.classification}
          </span>
        </div>
        <p className="mt-1 text-xs leading-snug text-[#7A7164]">{MATCH_LABEL[match.classification] ?? match.classification}</p>
        {match.reasons.length > 0 ? <p className="mt-1 text-[11px] text-[#8B7E70]">Señales: {match.reasons.join(", ")}</p> : null}

        {isExistingUpdate ? (
          <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs text-sky-950">
            <p>
              Este candidato coincide con{" "}
              <Link href={`/admin/recursos/${match.matchedResourceId}`} className="font-bold underline">
                un recurso ya publicado
              </Link>
              . La promoción está bloqueada — el flujo correcto es revisar los cambios propuestos, no crear un recurso duplicado.
            </p>
            <p className="mt-1 font-bold">{pendingChanges.length} cambio(s) pendiente(s) para este recurso.</p>
            <Link href="/admin/recursos/cambios" className="mt-2 inline-flex items-center gap-1 font-bold underline">
              Revisar cambios →
            </Link>
          </div>
        ) : match.classification === "POSSIBLE_DUPLICATE" ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-900">
            Advertencia: múltiples recursos existentes comparten una señal fuerte con este candidato. Revisa manualmente antes de promover.
          </p>
        ) : match.classification === "LIKELY_MATCH" ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-950">
            Advertencia: este candidato podría coincidir con un recurso existente. Confirma antes de promover para evitar un duplicado.
          </p>
        ) : null}
      </section>

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
          {isExistingUpdate
            ? "Promover está deshabilitado porque este candidato coincide con un recurso ya publicado — usa la cola de Cambios en su lugar."
            : 'Promover se habilita cuando la evidencia confirma que la organización está activa, cita una fuente oficial actual, tiene disposición "Ready for promotion", y — para candidatos ayuda-ahora — cumple el estándar de evidencia Prioridad 1.'}
        </p>
      ) : null}

      <div className="mt-6">
        <VerificationTimeline events={timeline} title="Historial de este candidato (interno)" compact />
      </div>
    </div>
  );
}
