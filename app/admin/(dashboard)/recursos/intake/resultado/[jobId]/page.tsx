import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminCardBase, adminStubBadgeClass } from "@/app/admin/_components/adminTheme";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { dbGetResourceIntakeJob } from "@/app/lib/recursos/intake/server/resourceIntakeJobsDb";
import { dbGetCandidateReview } from "@/app/lib/recursos/server/communityResourceCandidateReviewsDb";
import { decodeProposalFromDiscrepancies } from "@/app/lib/recursos/intake/urlCandidateProposal";
import { getPrimaryCategoryLabel } from "@/app/lib/recursos/categories";
import { getUrgencyLabel } from "@/app/lib/recursos/urgency";

export const dynamic = "force-dynamic";

const MATCH_LABEL: Record<string, string> = {
  NEW: "Nuevo — sin coincidencia con recursos existentes",
  LIKELY_MATCH: "Posible coincidencia — señal fuerte con un recurso existente",
  POSSIBLE_DUPLICATE: "Posible duplicado — múltiples recursos comparten una señal",
  EXISTING_RESOURCE_UPDATE: "Actualización de recurso existente",
};

const MATCH_BADGE: Record<string, string> = {
  NEW: "border border-emerald-200 bg-emerald-50 text-emerald-950",
  LIKELY_MATCH: "border border-amber-200 bg-amber-50 text-amber-950",
  POSSIBLE_DUPLICATE: "border border-rose-200 bg-rose-50 text-rose-900",
  EXISTING_RESOURCE_UPDATE: "border border-sky-200 bg-sky-50 text-sky-950",
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{label}</dt>
      <dd className="text-sm text-[#1E1810]">{value || "—"}</dd>
    </div>
  );
}

export default async function RecursosIntakeResultPage(props: {
  params: Promise<{ jobId: string }>;
  searchParams?: Promise<{ candidateId?: string }>;
}) {
  await requireLeonixAdminPermission("can_manage_recursos");

  const { jobId } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const candidateId = sp.candidateId ?? "";

  const job = await dbGetResourceIntakeJob(jobId);
  if (!job) notFound();

  const review = candidateId ? await dbGetCandidateReview(candidateId) : null;
  const proposal = review ? decodeProposalFromDiscrepancies(review.discrepanciesFromPdf) : null;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos — Intake"
        title="Resultado del análisis"
        subtitle="Este candidato aún NO está verificado ni publicado. Todo lo mostrado aquí es una propuesta que requiere revisión humana."
        rightSlot={
          <Link href="/admin/recursos/intake" className={adminBtnPrimary}>
            ← Nuevo intake
          </Link>
        }
      />

      <div className={`${adminCardBase} mb-6 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#1E1810]">Trabajo de intake #{job.id.slice(0, 8)}</h2>
          <span className={adminStubBadgeClass}>{job.status}</span>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Tipo de fuente" value={job.sourceType} />
          <Field label="Proveedor" value={job.provider} />
          <Field label="Candidatos creados" value={String(job.candidatesCreatedCount)} />
          <Field label="Coincidencias encontradas" value={String(job.matchesFoundCount)} />
        </dl>
        {job.errorMessage ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{job.errorMessage}</p>
        ) : null}
      </div>

      {!review || !proposal ? (
        <div className={`${adminCardBase} p-5`}>
          <p className="text-sm text-[#5C5346]">
            {job.status === "failed"
              ? "El análisis falló — no se creó ningún candidato. Revisa el mensaje de error arriba e intenta con otra URL."
              : "No se encontró un candidato asociado a este trabajo."}
          </p>
        </div>
      ) : (
        <div className={`${adminCardBase} p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#1E1810]">{proposal.organizationName}</h2>
              {proposal.programName ? <p className="text-sm text-[#7A7164]">{proposal.programName}</p> : null}
            </div>
            <span className="inline-flex rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
              Sin verificar
            </span>
          </div>

          {(() => {
            const match = /Clasificación de coincidencia:\s*([A-Z_]+)/.exec(review.verificationNotes ?? "");
            const classification = match?.[1] ?? "NEW";
            return (
              <p className="mt-4 rounded-lg border border-[#C9B46A]/40 bg-[#FFFCF7] px-4 py-3 text-xs leading-relaxed text-[#5C4E2E]">
                Clasificación de coincidencia:{" "}
                <span className={`ml-1 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${MATCH_BADGE[classification] ?? ""}`}>
                  {MATCH_LABEL[classification] ?? classification}
                </span>
              </p>
            );
          })()}

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Categoría propuesta" value={getPrimaryCategoryLabel(proposal.suggestedPrimaryCategory, "es")} />
            <Field label="Urgencia propuesta" value={getUrgencyLabel(proposal.suggestedUrgencyLevel, "es")} />
            <Field label="Teléfono propuesto" value={proposal.phone} />
            <Field label="Teléfono de crisis propuesto" value={proposal.crisisPhone} />
            <Field label="Email propuesto" value={proposal.email} />
            <Field label="Sitio web" value={proposal.websiteUrl} />
            <Field label="Dirección propuesta" value={proposal.addressWithheldForSafety ? "Retenida por seguridad — no propuesta" : proposal.addressLine1} />
            <Field label="Fuente oficial" value={review.currentSourceUrl} />
          </dl>

          {review.verificationNotes ? (
            <p className="mt-5 rounded-lg border border-[color:var(--lx-border)] bg-white/70 px-4 py-3 text-xs leading-relaxed text-[#5C5346]">
              {review.verificationNotes}
            </p>
          ) : null}

          <div className="mt-6">
            <Link href={`/admin/recursos/candidatos/url/${encodeURIComponent(candidateId)}`} className={adminBtnPrimary}>
              Revisar candidato →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
