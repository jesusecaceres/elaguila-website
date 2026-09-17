"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccessResolution, BusinessOnboardingDraft } from "@/app/lib/business/types";
import { businessIdentityCopy, type Lang } from "./businessIdentityCopy";
import { PreviewSection } from "./PreviewSection";
import { DraftList } from "./DraftList";
import { businessApiFetch } from "./businessApiClient";

/**
 * The Business Identity access-state experience (Phase 3). Consumes
 * GET /api/dashboard/business/access (Package 2) and renders the correct state — this is the
 * only place in the UI that decides which experience the current user sees. Never fabricates
 * eligibility, never shows a dead access-denied screen (every non-eligible state still shows
 * the truthful, inspirational preview), never claims a future capability exists today.
 */
export function BusinessIdentityAccessPanel({ lang, userId }: { lang: Lang; userId: string | null }) {
  const router = useRouter();
  const t = businessIdentityCopy(lang);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState<AccessResolution | null>(null);
  const [drafts, setDrafts] = useState<readonly BusinessOnboardingDraft[]>([]);
  const [errored, setErrored] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrored(false);
    const result = await businessApiFetch<{ resolution: AccessResolution }>("/api/dashboard/business/access");
    if (!result.ok) {
      setErrored(true);
      setLoading(false);
      return;
    }
    setResolution(result.data.resolution);
    if (result.data.resolution.state === "resume_single_draft") setDrafts([result.data.resolution.draft]);
    else if (result.data.resolution.state === "choose_draft") setDrafts(result.data.resolution.drafts);
    else setDrafts([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;
    void load();
  }, [userId, load]);

  function goToOnboarding(intentKey?: string) {
    const q = new URLSearchParams({ lang });
    if (intentKey) q.set("intent", intentKey);
    router.push(`/dashboard/business-tools/onboarding?${q.toString()}`);
  }

  function handleStartAnother() {
    goToOnboarding();
  }

  function handleResume(draft: BusinessOnboardingDraft) {
    goToOnboarding(draft.intentKey);
  }

  function handleDeleted(draftId: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    void load();
  }

  if (!userId) {
    return <p className="text-sm text-[#5C5346]">{t.access.signInRequired}</p>;
  }

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">
        {t.access.loading}
      </div>
    );
  }

  if (errored || !resolution) {
    return (
      <div role="alert" className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-8 text-center">
        <p className="text-sm text-[#5C5346]">{t.common.error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-xs font-semibold text-[#3D3428] hover:bg-[#FAF7F2]"
        >
          {t.common.retry}
        </button>
      </div>
    );
  }

  switch (resolution.state) {
    case "signed_out":
      return <p className="text-sm text-[#5C5346]">{t.access.signInRequired}</p>;

    case "feature_unavailable":
      return (
        <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-8 text-center">
          <h2 className="text-base font-bold text-[#1E1810]">{t.access.unavailableTitle}</h2>
          <p className="mt-2 text-sm text-[#5C5346]/95">{t.access.unavailableBody}</p>
        </div>
      );

    case "preview_only":
      return <PreviewSection t={t.preview} />;

    case "ineligible":
      return (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.access.ineligibleTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{t.access.ineligibleBody}</p>
          </div>
          <PreviewSection t={t.preview} />
        </div>
      );

    case "ambiguous":
      return (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#C9A84A]/40 bg-[#FBF7EF] p-6 sm:p-8">
            <h2 className="text-base font-bold text-[#1E1810]">{t.access.ambiguousTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{t.access.ambiguousBody}</p>
            <a
              href="mailto:hola@leonix.com?subject=Business%20Concierge%20Review"
              className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#C9A84A]/55 bg-white px-4 py-2 text-xs font-semibold text-[#3D3428] hover:bg-[#FAF7F2]"
            >
              {t.access.ambiguousCta}
            </a>
          </div>
          <PreviewSection t={t.preview} />
        </div>
      );

    case "eligible_start":
      return (
        <div className="rounded-3xl border border-[#C9A84A]/40 bg-gradient-to-br from-[#FFFCF7] to-[#F3EBDD]/90 p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#1E1810]">{t.access.eligibleTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{t.access.eligibleBody}</p>
          <button
            type="button"
            onClick={() => handleStartAnother()}
            className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
          >
            {t.access.eligibleCta}
          </button>
        </div>
      );

    case "resume_single_draft":
    case "choose_draft":
      return (
        <DraftList
          drafts={drafts}
          lang={lang}
          t={t.drafts}
          stepLabels={t.wizard.stepLabels}
          onResume={handleResume}
          onDeleted={handleDeleted}
          onStartAnother={handleStartAnother}
        />
      );

    case "existing_business":
      return (
        <div className="rounded-3xl border border-[#C9A84A]/40 bg-[#FFFCF7]/95 p-6 text-center sm:p-8">
          <p className="text-sm text-[#5C5346]">
            {lang === "es" ? "Tu negocio ya está configurado." : "Your business is already set up."}
          </p>
          <a
            href={`/dashboard/business-tools/business/${resolution.business.id}?lang=${lang}`}
            className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
          >
            {resolution.business.displayName}
          </a>
        </div>
      );

    case "error":
    default:
      return (
        <div role="alert" className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-8 text-center">
          <p className="text-sm text-[#5C5346]">{t.common.error}</p>
        </div>
      );
  }
}
