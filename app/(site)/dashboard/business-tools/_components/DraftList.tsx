"use client";

import { useState } from "react";
import type { BusinessOnboardingDraft } from "@/app/lib/business/types";
import type { BusinessIdentityCopy, Lang } from "./businessIdentityCopy";
import { businessApiFetch } from "./businessApiClient";

function draftLabel(draft: BusinessOnboardingDraft, untitled: string): string {
  const name = draft.draftPayload.basics?.displayName?.trim();
  return name && name.length > 0 ? name : untitled;
}

function formatDate(iso: string, lang: Lang): string {
  try {
    return new Date(iso).toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export function DraftList({
  drafts,
  lang,
  t,
  stepLabels,
  onResume,
  onDeleted,
  onStartAnother,
}: {
  drafts: readonly BusinessOnboardingDraft[];
  lang: Lang;
  t: BusinessIdentityCopy["drafts"];
  stepLabels: readonly string[];
  onResume: (draft: BusinessOnboardingDraft) => void;
  onDeleted: (draftId: string) => void;
  onStartAnother: () => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await businessApiFetch(`/api/dashboard/business/drafts/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setConfirmingId(null);
    if (result.ok) onDeleted(id);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-[#1E1810]">{drafts.length > 1 ? t.multipleTitle : t.resumeTitle}</h2>
      <ul className="space-y-3">
        {drafts.map((draft) => {
          const stepIndex = Math.min(Math.max(draft.currentStep, 1), stepLabels.length) - 1;
          const stepLabel = stepLabels[stepIndex] ?? "";
          return (
            <li key={draft.id} className="rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-sm">
              <p className="text-sm font-bold text-[#1E1810]">{draftLabel(draft, t.untitled)}</p>
              <p className="mt-1 text-xs text-[#7A7164]">
                {t.step} {draft.currentStep} {t.of} {stepLabels.length} — {stepLabel}
              </p>
              <p className="mt-0.5 text-xs text-[#7A7164]">
                {t.lastUpdated}: {formatDate(draft.updatedAt, lang)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onResume(draft)}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 py-2 text-xs font-semibold text-[#1E1810] shadow-sm hover:brightness-[1.03]"
                >
                  {t.resume}
                </button>
                {confirmingId === draft.id ? (
                  <div role="alertdialog" aria-labelledby={`delete-confirm-${draft.id}`} className="flex items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-1.5">
                    <span id={`delete-confirm-${draft.id}`} className="text-xs text-[#3D3428]">
                      {t.deleteConfirmTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDelete(draft.id)}
                      disabled={deletingId === draft.id}
                      className="text-xs font-semibold text-[#7A1E2C] underline disabled:opacity-50"
                    >
                      {t.deleteConfirmYes}
                    </button>
                    <button type="button" onClick={() => setConfirmingId(null)} className="text-xs text-[#5C5346] underline">
                      {t.deleteConfirmNo}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(draft.id)}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-xs font-semibold text-[#3D3428] hover:bg-[#FAF7F2]"
                  >
                    {t.delete}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-[#7A7164]">{t.expiresNote}</p>
      <button
        type="button"
        onClick={onStartAnother}
        className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-xs font-semibold text-[#3D3428] hover:bg-[#FAF7F2]"
      >
        {t.startAnother}
      </button>
    </div>
  );
}
