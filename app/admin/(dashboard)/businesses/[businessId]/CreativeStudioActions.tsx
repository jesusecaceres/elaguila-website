"use client";

import { useState } from "react";

interface CreativeJob {
  id: string;
  assetType: string;
  language: string;
  format: string;
  archetype: string;
  status: string;
  riskClass: string;
  createdAt: string;
}

interface CreativeProviderAvailability {
  gemini: boolean;
  openai: boolean;
}

/** Package A — truthful, non-interactive provider status. Never renders a button for an unconfigured provider. */
function ProviderAvailabilityRow({ providerAvailability }: { providerAvailability?: CreativeProviderAvailability }) {
  if (!providerAvailability) return null;
  const entries: Array<{ label: string; configured: boolean }> = [
    { label: "Gemini", configured: providerAvailability.gemini },
    { label: "OpenAI", configured: providerAvailability.openai },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-gray-500">Generation providers:</span>
      {entries.map((e) => (
        <span
          key={e.label}
          className={`rounded px-2 py-0.5 font-medium ${e.configured ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
        >
          {e.label} {e.configured ? "configured" : "not configured"}
        </span>
      ))}
    </div>
  );
}

export function CreativeStudioPanel({
  businessId,
  jobs,
  providerAvailability,
}: {
  businessId: string;
  jobs: CreativeJob[];
  providerAvailability?: CreativeProviderAvailability;
}) {
  const [showNewJob, setShowNewJob] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Creative Studio</h3>
        <button
          onClick={() => setShowNewJob(!showNewJob)}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showNewJob ? "Cancel" : "New Creative Job"}
        </button>
      </div>

      <ProviderAvailabilityRow providerAvailability={providerAvailability} />

      {jobs.length === 0 && !showNewJob && (
        <p className="text-sm text-gray-500">No creative jobs yet.</p>
      )}

      {jobs.length > 0 && (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id} className="border border-gray-200 rounded p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{job.assetType.replace(/_/g, " ")}</span>
                <span className={`px-2 py-0.5 text-xs rounded ${statusColor(job.status)}`}>{job.status}</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {job.format} · {job.archetype.replace(/_/g, " ")} · {job.language} · {job.riskClass}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewJob && (
        <div className="border border-gray-200 rounded p-3 space-y-3 text-sm">
          <p className="text-gray-600">New creative job flow:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-gray-500">
            <li>Choose Purpose</li>
            <li>Choose Asset Type</li>
            <li>Choose Format</li>
            <li>Assemble Verified Inputs</li>
            <li>Review Missing Truth</li>
            <li>Select Creative Lane</li>
            <li>Select/Recommend Archetype</li>
            <li>Build Brief</li>
            <li>Approve Brief</li>
            <li>Generate Draft</li>
            <li>Review Composition</li>
            <li>Request Changes</li>
            <li>Approve</li>
            <li>Export Production Pack</li>
          </ol>
          <p className="text-xs text-gray-400">
            Package A added the real generation engine (doctrine + OpenAI/Gemini provider execution) as API routes.
            The full step-by-step job-creation wizard UI shown above is a separate, not-yet-built package.
          </p>
        </div>
      )}
    </div>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case "approved": return "bg-green-100 text-green-700";
    case "in_review": return "bg-yellow-100 text-yellow-700";
    case "owner_review": return "bg-blue-100 text-blue-700";
    case "draft": return "bg-gray-100 text-gray-600";
    case "changes_requested": return "bg-orange-100 text-orange-700";
    default: return "bg-gray-100 text-gray-600";
  }
}
