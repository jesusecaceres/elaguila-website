import type { ReactNode } from "react";
import { CreativeTruthPacket } from "./CreativeTruthPacket";
import { CreateBriefForm, GenerateDraftButton, ProviderAvailabilityRow } from "./CreativeStudioActions";
import type { SnapshotCategory } from "@/app/lib/business/creativeStudio/types";
import type {
  CreativeBrief,
  CreativeExport,
  CreativeInputSnapshot,
  CreativeJob,
  CreativeJobVersion,
  CreativeProviderRun,
  CreativeReview,
} from "@/app/lib/business/creativeStudio/types";
import { buildNewBriefPrefill, type NewBriefPrefill } from "@/app/lib/business/creativeStudio/briefPrefill";
import {
  getLastProviderRunForJob,
  getLatestBriefForJob,
  getLatestSnapshotForJob,
  listExportsForJob,
  listReviewsForJob,
  listVersionsForJob,
} from "@/app/lib/business/creativeStudio/repository";

export type CreativeJobWorkspace = {
  job: CreativeJob;
  snapshot: CreativeInputSnapshot | null;
  snapshotLoadError: boolean;
  brief: CreativeBrief | null;
  briefPrefill: NewBriefPrefill | null;
  currentVersion: CreativeJobVersion | null;
  lastRun: CreativeProviderRun | null;
  reviews: CreativeReview[];
  exports: CreativeExport[];
  opportunityTitle: string | null;
};

export async function loadCreativeJobWorkspaces(
  businessId: string,
  jobs: CreativeJob[],
  opportunities: readonly { id: string; titleEn: string }[],
): Promise<CreativeJobWorkspace[]> {
  const loaded = await Promise.all(jobs.map(async (job) => {
    const opportunityTitle = job.sourceOpportunityId
      ? opportunities.find((row) => row.id === job.sourceOpportunityId)?.titleEn ?? null
      : null;
    try {
      const [snapshot, brief, versions, reviewRows, exportRows, lastRun] = await Promise.all([
        getLatestSnapshotForJob(businessId, job.id),
        getLatestBriefForJob(businessId, job.id),
        listVersionsForJob(businessId, job.id),
        listReviewsForJob(businessId, job.id),
        listExportsForJob(businessId, job.id),
        getLastProviderRunForJob(businessId, job.id),
      ]);
      return {
        job,
        snapshot,
        snapshotLoadError: false,
        brief,
        briefPrefill: null as NewBriefPrefill | null,
        currentVersion: versions[0] ?? null,
        lastRun,
        reviews: reviewRows,
        exports: exportRows,
        opportunityTitle,
      };
    } catch {
      return {
        job,
        snapshot: null,
        snapshotLoadError: true,
        brief: null,
        briefPrefill: null as NewBriefPrefill | null,
        currentVersion: null,
        lastRun: null,
        reviews: [],
        exports: [],
        opportunityTitle,
      };
    }
  }));

  if (loaded.some((row) => !row.brief)) {
    const prefill = await buildNewBriefPrefill(businessId);
    return loaded.map((row) => (row.brief ? row : { ...row, briefPrefill: prefill }));
  }
  return loaded;
}

function jobStatusMeaning(status: string): string {
  switch (status) {
    case "draft":
      return "Borrador — el Paquete de Verdad Creativa y el brief aún se están preparando. No está listo para generación. / Draft — Creative Truth Packet and brief are still being prepared. Not ready for generation.";
    case "ready_for_generation":
      return "Listo para generación — el brief está completo. Esperando una generación de borrador activada explícitamente por un humano. / Ready for generation — brief is complete. Awaiting an explicit, human-triggered draft generation.";
    case "generated":
      return "Generado — el resultado existe. No está aprobado ni publicado. / Generated — output exists. Not approved and not published.";
    case "changes_requested":
      return "Cambios solicitados — un revisor pidió una revisión antes de continuar. / Changes requested — a reviewer asked for a revision before this can move forward.";
    case "in_review":
    case "owner_review":
      return "En revisión — evaluación humana. No es aceptación del cliente. / In review — human assessment. Not client acceptance.";
    case "approved":
      return "Aprobado — el personal/propietario aprobó este trabajo. No está publicado. / Approved — staff/owner approved this job. Not published.";
    case "archived":
      return "Archivado. / Archived.";
    default:
      return status.replace(/_/g, " ");
  }
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#E8DFD0] bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function BriefReadout({ brief }: { brief: CreativeBrief }) {
  const rows: { label: string; value: string | null }[] = [
    { label: "Estado / Status", value: brief.status },
    { label: "Objetivo de negocio / Business goal", value: brief.businessGoal },
    { label: "Objetivo de campaña / Campaign objective", value: brief.campaignObjective },
    { label: "Necesidad del lector / Reader need", value: brief.readerNeed },
    { label: "Público / Audience", value: brief.targetAudience },
    { label: "Mensaje principal / Primary message", value: brief.primaryMessage },
    { label: "Oferta / Offer", value: brief.offer },
    { label: "CTA", value: brief.cta },
    { label: "Ruta de contacto / Contact path", value: brief.contactPath },
    { label: "Destino QR / QR target", value: brief.qrTarget },
    { label: "Estrategia de imagen / Image strategy", value: brief.imageStrategy },
    { label: "Acción deseada / Desired action", value: brief.desiredAction },
  ];
  return (
    <dl className="space-y-2">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">{row.label}</dt>
          <dd className="break-all text-xs text-[#3D3428]">{row.value?.trim() ? row.value : "—"}</dd>
        </div>
      ))}
      {brief.missingAssetDescriptions.length > 0 ? (
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Recursos faltantes / Missing assets</dt>
          <dd className="break-words text-xs text-[#3D3428]">{brief.missingAssetDescriptions.join("; ")}</dd>
        </div>
      ) : null}
      {brief.prohibitedClaims.length > 0 ? (
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Reclamos prohibidos / Prohibited claims</dt>
          <dd className="break-words text-xs text-[#3D3428]">{brief.prohibitedClaims.join("; ")}</dd>
        </div>
      ) : null}
    </dl>
  );
}

export function CreativeJobCard({
  workspace,
  businessId,
  canGenerate,
  canCreateBrief,
  providerAvailable,
}: {
  workspace: CreativeJobWorkspace;
  businessId: string;
  canGenerate: boolean;
  canCreateBrief: boolean;
  providerAvailable: boolean;
}) {
  const { job, snapshot, snapshotLoadError, brief, briefPrefill, currentVersion, lastRun, reviews, exports, opportunityTitle } = workspace;
  const generatedReady = Boolean(currentVersion);
  const generatedExport = exports.filter((row) => row.status === "generated");

  return (
    <article className="space-y-3 rounded-2xl border border-[#C9A84A]/40 bg-[#FFFDF7] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#1E1810]">{job.assetType.replace(/_/g, " ")}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-[#8A6B1F]">
            {job.format} · {job.archetype.replace(/_/g, " ")} · {job.language} · {job.riskClass}
          </p>
        </div>
        <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 text-[10px] font-bold text-[#3D3428]">{job.status.replace(/_/g, " ")}</span>
      </div>
      <p className="text-xs text-[#3D3428]">{jobStatusMeaning(job.status)}</p>
      <p className="text-[10px] text-[#7A7164]">
        Created {new Date(job.createdAt).toLocaleString()} by {job.createdByEmail} ({job.createdByRole}).
      </p>
      <p className="text-[10px] text-[#7A7164]">Leonix staff shell uses Leonix colors. Client creative must use this job&apos;s stored client truth, not Leonix cream/burgundy/gold.</p>

      {job.sourceOpportunityId ? (
        <p className="break-words text-xs text-[#3D3428]">
          Triggered from opportunity{opportunityTitle ? `: ${opportunityTitle}` : ""}. Approved opportunity is not client acceptance and not confirmed sponsorship.{" "}
          <a href="#opportunity" className="font-semibold text-[#7A1E2C] underline">Review Opportunities</a>
        </p>
      ) : null}
      {job.sourceRecommendationId ? (
        <p className="text-xs text-[#3D3428]">
          Recommendation context is recorded on this job.{" "}
          <a href="#recommend" className="font-semibold text-[#7A1E2C] underline">Review Next Right Move</a>
        </p>
      ) : (
        <p className="text-xs text-[#7A7164]">
          No canonical recommendation link on this job.{" "}
          <a href="#recommend" className="font-semibold text-[#7A1E2C] underline">Review Next Right Move</a>
        </p>
      )}

      <Step title="1. Entrada — Paquete de Verdad Creativa / 1. Input — Creative Truth Packet">
        <CreativeTruthPacket
          snapshot={snapshot ? { id: snapshot.id, version: snapshot.version, snapshotTimestamp: snapshot.snapshotTimestamp, categories: snapshot.categories as readonly SnapshotCategory[] } : null}
          loadError={snapshotLoadError}
        />
      </Step>

      <Step title="2. Brief — dirección de trabajo derivada / 2. Brief — derived working direction">
        {brief ? (
          <BriefReadout brief={brief} />
        ) : (
          <CreateBriefForm
            businessId={businessId}
            jobId={job.id}
            canCreateBrief={canCreateBrief}
            creativeLane={job.creativeLane}
            prefill={briefPrefill}
          />
        )}
      </Step>

      <Step title="3. Crear — generar a partir de la instantánea + brief / 3. Create — generate from snapshot + brief">
        {lastRun ? (
          <p className="mb-2 break-words text-xs text-[#7A7164]">
            Last provider run: {lastRun.providerKey} · {lastRun.status}
            {lastRun.errorState ? ` · ${lastRun.errorState}` : ""} · {new Date(lastRun.createdAt).toLocaleString()}
          </p>
        ) : null}
        {lastRun?.errorState === "provider_unavailable" ? (
          <p className="mb-2 text-sm text-[#7A7164]">El proveedor de generación creativa no está disponible. / Creative generation provider is not available.</p>
        ) : lastRun?.status === "failed" ? (
          <p className="mb-2 text-xs text-red-700">La última generación falló. No se creó ningún resultado falso. / Last generation failed. No fake output was created.</p>
        ) : null}
        <GenerateDraftButton
          businessId={businessId}
          jobId={job.id}
          canGenerate={canGenerate}
          hasBrief={Boolean(brief)}
          providerAvailable={providerAvailable}
        />
      </Step>

      <Step title="4. Revisión — evaluación humana / 4. Review — human assessment">
        {generatedReady ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#1E1810]">Copia generada (no aprobada, no publicada) / Generated copy (not approved, not published)</p>
            {currentVersion?.generatedHeadlines?.length ? (
              <ul className="list-disc space-y-1 pl-4 text-xs text-[#3D3428]">
                {currentVersion.generatedHeadlines.map((line) => <li key={line} className="break-words">{line}</li>)}
              </ul>
            ) : null}
            {currentVersion?.generatedBodyCopy?.length ? (
              <div className="space-y-1 text-xs text-[#3D3428]">
                {currentVersion.generatedBodyCopy.map((line) => <p key={line} className="break-words">{line}</p>)}
              </div>
            ) : null}
            {currentVersion?.generatedCta ? <p className="break-words text-xs text-[#3D3428]">CTA: {currentVersion.generatedCta}</p> : null}
            {currentVersion?.generatedDisclaimer ? <p className="break-words text-xs text-[#7A7164]">{currentVersion.generatedDisclaimer}</p> : null}
          </div>
        ) : (
          <p className="text-xs text-[#7A7164]">Aún no hay resultado generado guardado. / No generated output is stored yet.</p>
        )}
        {reviews.length === 0 ? (
          <p className="mt-2 text-xs text-[#7A7164]">No hay notas de revisión guardadas. Generado no es aprobado. Revisado no es aceptado por el cliente. / No review notes are stored. Generated is not approved. Reviewed is not client accepted.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {reviews.map((review, index) => (
              <li key={`${review.createdAt}-${index}`} className="break-words text-xs text-[#3D3428]">
                {review.severity} · {review.issueType.replace(/_/g, " ")}: {review.issueDescription}
              </li>
            ))}
          </ul>
        )}
      </Step>

      <Step title="5. Exportar / entrega — no es publicación / 5. Export / handoff — not publication">
        <p className="text-xs text-[#7A7164]">Canva sigue siendo un acabado / entrega manual. Exportar no es publicar en sitio web, revista, redes sociales, correo electrónico o SMS. / Canva remains manual finishing / handoff. Export is not website, magazine, social, email, or SMS publish.</p>
        {generatedExport.length === 0 && exports.length === 0 ? (
          <p className="mt-2 text-sm text-[#7A7164]">No hay ninguna exportación aprobada lista. / No approved export is ready.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {exports.map((row) => (
              <li key={`${row.exportType}-${row.createdAt}`} className="break-words text-xs text-[#3D3428]">
                {row.exportType.replace(/_/g, " ")} · {row.status} · {new Date(row.createdAt).toLocaleString()}
                {row.generatedAt ? ` · generated ${new Date(row.generatedAt).toLocaleString()}` : ""}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs font-semibold text-[#1E1810]">Listo para acabado en Canva / Ready for Canva finishing</p>
        <p className="text-[10px] text-[#7A7164]">Manual production pack / Canva handoff. No Canva API is claimed.</p>
      </Step>
    </article>
  );
}

export function CreativeJourney({
  businessId,
  jobs,
  providerAvailability,
  canGenerate,
  canCreateBrief,
  imageGenerationLive,
}: {
  businessId: string;
  jobs: CreativeJobWorkspace[];
  providerAvailability: { gemini: boolean; openai: boolean };
  canGenerate: boolean;
  canCreateBrief: boolean;
  imageGenerationLive: boolean;
}) {
  const providerAvailable = providerAvailability.gemini || providerAvailability.openai;

  return (
    <div className="mt-3 space-y-4">
      <ol className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F] sm:flex-row sm:flex-wrap">
        <li>Entrada / Input</li>
        <li className="hidden sm:inline">→</li>
        <li>Brief</li>
        <li className="hidden sm:inline">→</li>
        <li>Crear / Create</li>
        <li className="hidden sm:inline">→</li>
        <li>Revisión / Review</li>
        <li className="hidden sm:inline">→</li>
        <li>Exportar / Entrega / Export / Handoff</li>
      </ol>

      <ProviderAvailabilityRow providerAvailability={providerAvailability} />
      {!imageGenerationLive ? (
        <p className="text-xs text-[#7A7164]">La generación de imágenes sigue restringida por función y no está habilitada aquí. No se muestra ningún botón de generación de imágenes. / Image generation remains feature-gated and is not enabled here. No image-generation button is shown.</p>
      ) : (
        <p className="text-xs text-[#7A7164]">La bandera de generación de imágenes está activa en este servidor, pero Gate 07 no agrega un botón de generación de imágenes. / Image generation flag is live on this server, but Gate 07 does not add an image-generation button.</p>
      )}

      {jobs.length === 0 ? (
        <p className="text-sm text-[#7A7164]">Aún no se ha creado ninguna solicitud creativa. / No creative request has been created yet.</p>
      ) : (
        jobs.map((workspace) => (
          <CreativeJobCard
            key={workspace.job.id}
            workspace={workspace}
            businessId={businessId}
            canGenerate={canGenerate}
            canCreateBrief={canCreateBrief}
            providerAvailable={providerAvailable}
          />
        ))
      )}
    </div>
  );
}
