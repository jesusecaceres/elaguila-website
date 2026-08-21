import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminCardBase, adminCtaChip, adminCtaChipCompact, adminStubBadgeClass } from "@/app/admin/_components/adminTheme";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { dbGetResourceIntakeJob } from "@/app/lib/recursos/intake/server/resourceIntakeJobsDb";
import { dbGetSourceDocument } from "@/app/lib/recursos/intake/server/sourceDocumentsDb";
import { dbListCandidateIdsCreatedByJob, dbListVerificationEventsForJob } from "@/app/lib/recursos/intake/server/verificationEventsDb";
import { dbGetCandidateReview } from "@/app/lib/recursos/server/communityResourceCandidateReviewsDb";
import { decodeProposalFromDiscrepancies } from "@/app/lib/recursos/intake/urlCandidateProposal";
import { buildSupersessionSummary } from "@/app/lib/recursos/intake/server/buildSupersessionSummary";
import { ENTITY_TYPES, ENTITY_TYPE_LABEL, type EntityType } from "@/app/lib/recursos/intake/entityType";

export const dynamic = "force-dynamic";

const MATCH_LABEL: Record<string, string> = {
  NEW: "Nuevo",
  LIKELY_MATCH: "Posible coincidencia",
  POSSIBLE_DUPLICATE: "Posible duplicado",
  EXISTING_RESOURCE_UPDATE: "Actualización de recurso existente",
};
const MATCH_BADGE: Record<string, string> = {
  NEW: "border border-emerald-200 bg-emerald-50 text-emerald-950",
  LIKELY_MATCH: "border border-amber-200 bg-amber-50 text-amber-950",
  POSSIBLE_DUPLICATE: "border border-rose-200 bg-rose-50 text-rose-900",
  EXISTING_RESOURCE_UPDATE: "border border-sky-200 bg-sky-50 text-sky-950",
};

function extractMatchClassification(notes: string | null): string {
  const m = /Clasificación de coincidencia:\s*([A-Z_]+)/.exec(notes ?? "");
  return m?.[1] ?? "NEW";
}

export default async function RecursosPdfIntakeJobPage(props: { params: Promise<{ jobId: string }> }) {
  await requireLeonixAdminPermission("can_manage_recursos");
  const { jobId } = await props.params;

  const job = await dbGetResourceIntakeJob(jobId);
  if (!job) notFound();

  const [sourceDocument, candidateIds, jobEvents] = await Promise.all([
    job.sourceDocumentId ? dbGetSourceDocument(job.sourceDocumentId) : Promise.resolve(null),
    dbListCandidateIdsCreatedByJob(jobId),
    dbListVerificationEventsForJob(jobId),
  ]);

  const candidateReviews = await Promise.all(candidateIds.map((id) => dbGetCandidateReview(id)));
  const candidates = candidateReviews
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .map((review) => ({
      review,
      proposal: decodeProposalFromDiscrepancies(review.discrepanciesFromPdf),
      classification: extractMatchClassification(review.verificationNotes),
    }));

  const breakdown = {
    NEW: candidates.filter((c) => c.classification === "NEW").length,
    LIKELY_MATCH: candidates.filter((c) => c.classification === "LIKELY_MATCH").length,
    POSSIBLE_DUPLICATE: candidates.filter((c) => c.classification === "POSSIBLE_DUPLICATE").length,
    EXISTING_RESOURCE_UPDATE: candidates.filter((c) => c.classification === "EXISTING_RESOURCE_UPDATE").length,
  };

  // Gate ES-7K: group by entity type — every candidate carries its own entityType (decoded above
  // via decodeProposalFromDiscrepancies, defaulting to PRIMARY_RESOURCE for pre-ES-7 candidates).
  const candidatesByEntityType = new Map<EntityType, typeof candidates>();
  for (const t of ENTITY_TYPES) candidatesByEntityType.set(t, []);
  for (const c of candidates) {
    const list = candidatesByEntityType.get(c.proposal.entityType) ?? [];
    list.push(c);
    candidatesByEntityType.set(c.proposal.entityType, list);
  }

  // PARTNER_ORGANIZATION entities matched to an already-existing resource never create a
  // candidate row (ES-7D) — their only durable record is this resource-scoped evidence_recorded
  // event. LOCATION/REFERRAL_LINK entities (ES-7N: never a candidate, ever) are the same shape —
  // distinguished by the literal note prefix entityCandidateCreation.ts always writes.
  const matchedPartnerEvents = jobEvents.filter((e) => e.eventType === "evidence_recorded" && e.resourceId && e.notes?.startsWith("PARTNER_ORGANIZATION"));
  const nonCandidateEvents = jobEvents.filter((e) => e.eventType === "evidence_recorded" && (e.notes?.startsWith("LOCATION") || e.notes?.startsWith("REFERRAL_LINK")));

  const supersessionSummary = sourceDocument?.supersedesDocumentId
    ? await buildSupersessionSummary(sourceDocument.supersedesDocumentId, candidates.map((c) => c.proposal.organizationName))
    : null;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos — Intake de PDF"
        title="Resultado del análisis de PDF"
        subtitle="Ningún candidato aquí está verificado ni publicado. Todo requiere revisión humana antes de convertirse en un recurso público."
        rightSlot={
          <Link href="/admin/recursos/intake" className={adminBtnPrimary}>
            ← Nuevo intake
          </Link>
        }
      />

      <div className={`${adminCardBase} mb-6 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#1E1810]">{sourceDocument?.title ?? `Trabajo #${job.id.slice(0, 8)}`}</h2>
          <span className={adminStubBadgeClass}>{job.status}</span>
        </div>
        {sourceDocument?.originalFilename ? <p className="mt-1 text-xs text-[#7A7164]">{sourceDocument.originalFilename}</p> : null}
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Tipo de fuente</dt>
            <dd className="text-sm text-[#1E1810]">{job.sourceType}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Proveedor</dt>
            <dd className="text-sm text-[#1E1810]">{job.provider ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Páginas procesadas</dt>
            <dd className="text-sm text-[#1E1810]">{job.pagesProcessed}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Candidatos creados</dt>
            <dd className="text-sm text-[#1E1810]">{job.candidatesCreatedCount}</dd>
          </div>
        </dl>
        {job.errorMessage ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{job.errorMessage}</p>
        ) : null}
        {job.status === "failed" ? (
          <p className="mt-3 text-xs text-[#8B7E70]">
            Para reintentar, sube el mismo PDF de nuevo desde{" "}
            <Link href="/admin/recursos/intake" className="underline">
              Nuevo intake
            </Link>{" "}
            — el archivo ya está identificado por su huella (hash), así que no se duplicará el almacenamiento.
          </p>
        ) : null}
      </div>

      {supersessionSummary ? (
        <div className={`${adminCardBase} mb-6 p-5`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C4E2E]">Resumen de edición actualizada</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Comparación informativa contra la edición anterior de esta guía. La ausencia de un recurso en la nueva edición NUNCA
            desactiva nada automáticamente — solo se marca para revisión humana.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Sin cambios</dt>
              <dd className="text-xl font-bold text-[#1E1810]">{supersessionSummary.existingUnchangedCount}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Cambiados</dt>
              <dd className="text-xl font-bold text-[#1E1810]">{supersessionSummary.existingChangedCount}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Candidatos nuevos</dt>
              <dd className="text-xl font-bold text-[#1E1810]">{supersessionSummary.newCandidateCount}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Posiblemente descontinuados</dt>
              <dd className="text-xl font-bold text-[#1E1810]">{supersessionSummary.possiblyDiscontinued.length}</dd>
            </div>
          </dl>
          {supersessionSummary.possiblyDiscontinued.length > 0 ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
              <p className="font-bold">No aparecen en la nueva edición (informativo — requiere confirmación humana):</p>
              <ul className="mt-1 list-inside list-disc">
                {supersessionSummary.possiblyDiscontinued.map((r) => (
                  <li key={r.resourceId}>
                    <Link href={`/admin/recursos/${r.resourceId}`} className="underline capitalize">
                      {r.organizationName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {candidates.length === 0 && matchedPartnerEvents.length === 0 && nonCandidateEvents.length === 0 ? (
        <div className={`${adminCardBase} p-5`}>
          <p className="text-sm text-[#5C5346]">
            {job.status === "failed"
              ? "El análisis falló — no se creó ningún candidato."
              : job.status === "processing"
                ? "El procesamiento sigue en curso — recarga esta página en unos momentos."
                : "No se encontraron entidades en este documento."}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(breakdown) as (keyof typeof breakdown)[]).map((k) => (
              <div key={k} className={`${adminCardBase} p-4`}>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{MATCH_LABEL[k]}</p>
                <p className="mt-1 text-2xl font-bold text-[#1E1810]">{breakdown[k]}</p>
              </div>
            ))}
          </div>

          {/* Gate ES-7K: grouped by entity type — makes it obvious which entities did/did not create a candidate. */}
          <div className="space-y-6">
            {ENTITY_TYPES.map((entityType) => {
              const group = candidatesByEntityType.get(entityType) ?? [];
              if (entityType !== "LOCATION" && entityType !== "REFERRAL_LINK" && group.length === 0) return null;
              return (
                <section key={entityType}>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#5C4E2E]">
                    {ENTITY_TYPE_LABEL[entityType]} ({entityType === "LOCATION" || entityType === "REFERRAL_LINK" ? 0 : group.length})
                  </h2>

                  {(entityType === "LOCATION" || entityType === "REFERRAL_LINK") ? (
                    <>
                      <p className="mb-2 text-xs text-[#7A7164]">
                        Estas entidades NUNCA crean un candidato automáticamente — se preservan como evidencia adjunta a su
                        entidad principal (o al trabajo de intake si no se pudo resolver un padre).
                      </p>
                      {nonCandidateEvents.filter((e) => e.notes?.startsWith(entityType)).length === 0 ? (
                        <p className="text-xs text-[#8B7E70]">Ninguna encontrada en este trabajo.</p>
                      ) : (
                        <div className="space-y-2">
                          {nonCandidateEvents
                            .filter((e) => e.notes?.startsWith(entityType))
                            .map((e) => (
                              <div key={e.id} className={`${adminCardBase} p-3 text-sm text-[#5C5346]`}>
                                <p>{e.notes}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-wide text-[#8B7E70]">
                                  {e.candidateId ? `Adjunta a la entidad ${e.candidateId}` : "Sin entidad principal resuelta — revisión manual"}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  ) : entityType === "PARTNER_ORGANIZATION" && matchedPartnerEvents.length > 0 ? (
                    <>
                      <div className="mb-3 space-y-2">
                        {matchedPartnerEvents.map((e) => (
                          <div key={e.id} className={`${adminCardBase} flex flex-wrap items-center justify-between gap-2 p-3`}>
                            <p className="text-sm text-[#5C5346]">{e.notes}</p>
                            {e.resourceId ? (
                              <Link href={`/admin/recursos/${e.resourceId}`} className={`${adminCtaChip} ${adminCtaChipCompact}`}>
                                Ver recurso existente
                              </Link>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      {group.length === 0 ? null : (
                        <div className="space-y-3">
                          {group.map(({ review, proposal, classification }) => (
                            <div key={review.candidateId} className={`${adminCardBase} flex flex-wrap items-center justify-between gap-3 p-4`}>
                              <div className="min-w-0">
                                <p className="font-semibold text-[#1E1810]">{proposal.organizationName}</p>
                                {proposal.programName ? <p className="text-xs text-[#7A7164]">{proposal.programName}</p> : null}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${MATCH_BADGE[classification] ?? ""}`}>
                                  {MATCH_LABEL[classification] ?? classification}
                                </span>
                                <Link href={`/admin/recursos/candidatos/url/${encodeURIComponent(review.candidateId)}`} className={`${adminCtaChip} ${adminCtaChipCompact}`}>
                                  Revisar
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      {group.map(({ review, proposal, classification }) => (
                        <div key={review.candidateId} className={`${adminCardBase} flex flex-wrap items-center justify-between gap-3 p-4`}>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1E1810]">{proposal.organizationName}</p>
                            {proposal.programName ? <p className="text-xs text-[#7A7164]">{proposal.programName}</p> : null}
                            {proposal.parentOrganizationName ? (
                              <p className="text-xs text-[#8B7E70]">Bajo: {proposal.parentOrganizationName}</p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${MATCH_BADGE[classification] ?? ""}`}>
                              {MATCH_LABEL[classification] ?? classification}
                            </span>
                            <Link href={`/admin/recursos/candidatos/url/${encodeURIComponent(review.candidateId)}`} className={`${adminCtaChip} ${adminCtaChipCompact}`}>
                              Revisar
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
