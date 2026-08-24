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
  return Promise.all(jobs.map(async (job) => {
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
        currentVersion: null,
        lastRun: null,
        reviews: [],
        exports: [],
        opportunityTitle,
      };
    }
  }));
}

function jobStatusMeaning(status: string): string {
  switch (status) {
    case "generated":
      return "Generated — output exists. Not approved and not published.";
    case "approved":
      return "Approved — staff/owner approved this job. Not published.";
    case "in_review":
    case "owner_review":
      return "In review — human assessment. Not client acceptance.";
    case "archived":
      return "Archived.";
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
    { label: "Status", value: brief.status },
    { label: "Business goal", value: brief.businessGoal },
    { label: "Campaign objective", value: brief.campaignObjective },
    { label: "Reader need", value: brief.readerNeed },
    { label: "Audience", value: brief.targetAudience },
    { label: "Primary message", value: brief.primaryMessage },
    { label: "Offer", value: brief.offer },
    { label: "CTA", value: brief.cta },
    { label: "Contact path", value: brief.contactPath },
    { label: "QR target", value: brief.qrTarget },
    { label: "Image strategy", value: brief.imageStrategy },
    { label: "Desired action", value: brief.desiredAction },
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
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Missing assets</dt>
          <dd className="break-words text-xs text-[#3D3428]">{brief.missingAssetDescriptions.join("; ")}</dd>
        </div>
      ) : null}
      {brief.prohibitedClaims.length > 0 ? (
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Prohibited claims</dt>
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
  const { job, snapshot, snapshotLoadError, brief, currentVersion, lastRun, reviews, exports, opportunityTitle } = workspace;
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

      <Step title="1. Input — Creative Truth Packet">
        <CreativeTruthPacket
          snapshot={snapshot ? { id: snapshot.id, version: snapshot.version, snapshotTimestamp: snapshot.snapshotTimestamp, categories: snapshot.categories as readonly SnapshotCategory[] } : null}
          loadError={snapshotLoadError}
        />
      </Step>

      <Step title="2. Brief — derived working direction">
        {brief ? (
          <BriefReadout brief={brief} />
        ) : (
          <CreateBriefForm businessId={businessId} jobId={job.id} canCreateBrief={canCreateBrief} creativeLane={job.creativeLane} />
        )}
      </Step>

      <Step title="3. Create — generate from snapshot + brief">
        {lastRun ? (
          <p className="mb-2 break-words text-xs text-[#7A7164]">
            Last provider run: {lastRun.providerKey} · {lastRun.status}
            {lastRun.errorState ? ` · ${lastRun.errorState}` : ""} · {new Date(lastRun.createdAt).toLocaleString()}
          </p>
        ) : null}
        {lastRun?.errorState === "provider_unavailable" ? (
          <p className="mb-2 text-sm text-[#7A7164]">Creative generation provider is not available.</p>
        ) : lastRun?.status === "failed" ? (
          <p className="mb-2 text-xs text-red-700">Last generation failed. No fake output was created.</p>
        ) : null}
        <GenerateDraftButton
          businessId={businessId}
          jobId={job.id}
          canGenerate={canGenerate}
          hasBrief={Boolean(brief)}
          providerAvailable={providerAvailable}
        />
      </Step>

      <Step title="4. Review — human assessment">
        {generatedReady ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#1E1810]">Generated copy (not approved, not published)</p>
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
          <p className="text-xs text-[#7A7164]">No generated output is stored yet.</p>
        )}
        {reviews.length === 0 ? (
          <p className="mt-2 text-xs text-[#7A7164]">No review notes are stored. Generated is not approved. Reviewed is not client accepted.</p>
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

      <Step title="5. Export / handoff — not publication">
        <p className="text-xs text-[#7A7164]">Canva remains manual finishing / handoff. Export is not website, magazine, social, email, or SMS publish.</p>
        {generatedExport.length === 0 && exports.length === 0 ? (
          <p className="mt-2 text-sm text-[#7A7164]">No approved export is ready.</p>
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
        <p className="mt-2 text-xs font-semibold text-[#1E1810]">Ready for Canva finishing</p>
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
        <li>Input</li>
        <li className="hidden sm:inline">→</li>
        <li>Brief</li>
        <li className="hidden sm:inline">→</li>
        <li>Create</li>
        <li className="hidden sm:inline">→</li>
        <li>Review</li>
        <li className="hidden sm:inline">→</li>
        <li>Export / Handoff</li>
      </ol>

      <ProviderAvailabilityRow providerAvailability={providerAvailability} />
      {!imageGenerationLive ? (
        <p className="text-xs text-[#7A7164]">Image generation remains feature-gated and is not enabled here. No image-generation button is shown.</p>
      ) : (
        <p className="text-xs text-[#7A7164]">Image generation flag is live on this server, but Gate 07 does not add an image-generation button.</p>
      )}

      {jobs.length === 0 ? (
        <p className="text-sm text-[#7A7164]">No creative work has been requested yet.</p>
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
