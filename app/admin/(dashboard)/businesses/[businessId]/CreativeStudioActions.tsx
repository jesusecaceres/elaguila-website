"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CREATIVE_LANES } from "@/app/lib/business/creativeStudio/constants";

export type CreativeProviderAvailability = {
  gemini: boolean;
  openai: boolean;
};

function readApiError(data: { error?: string; detail?: string }, fallback: string): string {
  if (typeof data.detail === "string" && data.detail.trim()) return data.detail;
  if (typeof data.error === "string" && data.error.trim()) return data.error;
  return fallback;
}

export function ProviderAvailabilityRow({ providerAvailability }: { providerAvailability?: CreativeProviderAvailability }) {
  if (!providerAvailability) return null;
  const anyConfigured = providerAvailability.gemini || providerAvailability.openai;
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[#7A7164]">Generation providers:</span>
        {([
          { label: "Gemini", configured: providerAvailability.gemini },
          { label: "OpenAI", configured: providerAvailability.openai },
        ] as const).map((entry) => (
          <span
            key={entry.label}
            className={`rounded px-2 py-0.5 font-medium ${entry.configured ? "bg-emerald-100 text-emerald-800" : "bg-[#EDE6D6] text-[#7A7164]"}`}
          >
            {entry.label} {entry.configured ? "configured" : "not configured"}
          </span>
        ))}
      </div>
      {!anyConfigured ? (
        <p className="text-sm text-[#7A7164]">Creative generation provider is not available.</p>
      ) : null}
    </div>
  );
}

export function GenerateDraftButton({
  businessId,
  jobId,
  canGenerate,
  hasBrief,
  providerAvailable,
}: {
  businessId: string;
  jobId: string;
  canGenerate: boolean;
  hasBrief: boolean;
  providerAvailable: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canGenerate) {
    return <p className="text-xs text-[#7A7164]">Generation remains a manager / super-admin action.</p>;
  }
  if (!hasBrief) {
    return <p className="text-xs text-[#7A7164]">A Creative Brief is required before generation.</p>;
  }
  if (!providerAvailable) {
    return <p className="text-sm text-[#7A7164]">Creative generation provider is not available.</p>;
  }

  async function run() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/creative-studio/jobs/${jobId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({} as { error?: string; detail?: string }));
    setSubmitting(false);
    if (!res.ok) {
      setError(readApiError(data, "Could not generate. No output was created."));
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={submitting}
        onClick={() => void run()}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Generating…" : "Generate draft"}
      </button>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function CreateBriefForm({
  businessId,
  jobId,
  canCreateBrief,
  creativeLane,
}: {
  businessId: string;
  jobId: string;
  canCreateBrief: boolean;
  creativeLane: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessGoal, setBusinessGoal] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("");
  const [readerNeed, setReaderNeed] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [primaryMessage, setPrimaryMessage] = useState("");
  const [cta, setCta] = useState("");
  const [contactPath, setContactPath] = useState("");
  const [imageStrategy, setImageStrategy] = useState("");
  const [desiredAction, setDesiredAction] = useState("");
  const [lane, setLane] = useState(creativeLane || CREATIVE_LANES[0]);

  if (!canCreateBrief) {
    return <p className="text-xs text-[#7A7164]">Creating a Creative Brief remains a manager / super-admin action.</p>;
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/creative-studio/jobs/${jobId}/briefs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessGoal,
        campaignObjective,
        readerNeed,
        targetAudience,
        primaryMessage,
        cta,
        contactPath,
        imageStrategy,
        desiredAction,
        creativeLane: lane,
      }),
    });
    const data = await res.json().catch(() => ({} as { error?: string; detail?: string }));
    setSubmitting(false);
    if (!res.ok) {
      setError(readApiError(data, "Could not save the Creative Brief."));
      return;
    }
    router.refresh();
  }

  const fieldClass = "min-h-[44px] w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs text-[#1E1810]";

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="text-xs text-[#7A7164]">Creative Brief is derived working direction. It is not the Truth Packet.</p>
      <input className={fieldClass} value={businessGoal} onChange={(e) => setBusinessGoal(e.target.value)} placeholder="Business goal" required />
      <input className={fieldClass} value={campaignObjective} onChange={(e) => setCampaignObjective(e.target.value)} placeholder="Campaign objective" required />
      <input className={fieldClass} value={readerNeed} onChange={(e) => setReaderNeed(e.target.value)} placeholder="Reader need" required />
      <input className={fieldClass} value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Target audience" required />
      <textarea className={fieldClass} value={primaryMessage} onChange={(e) => setPrimaryMessage(e.target.value)} placeholder="Primary message" rows={2} required />
      <input className={fieldClass} value={cta} onChange={(e) => setCta(e.target.value)} placeholder="CTA" required />
      <input className={`${fieldClass} break-all`} value={contactPath} onChange={(e) => setContactPath(e.target.value)} placeholder="Contact path" required />
      <input className={fieldClass} value={imageStrategy} onChange={(e) => setImageStrategy(e.target.value)} placeholder="Image strategy" required />
      <input className={fieldClass} value={desiredAction} onChange={(e) => setDesiredAction(e.target.value)} placeholder="Desired action" required />
      <select className={fieldClass} value={lane} onChange={(e) => setLane(e.target.value)}>
        {CREATIVE_LANES.map((option) => (
          <option key={option} value={option}>{option.replace(/_/g, " ")}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save Creative Brief"}
      </button>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </form>
  );
}

export function CreativeStudioPanel({
  providerAvailability,
}: {
  businessId: string;
  jobs?: unknown;
  providerAvailability?: CreativeProviderAvailability;
}) {
  return <ProviderAvailabilityRow providerAvailability={providerAvailability} />;
}
