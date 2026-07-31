"use client";

import type { BusinessIdentityCopy } from "../../_components/businessIdentityCopy";
import type { DuplicateWarningResult } from "@/app/lib/business/types";
import type { WizardDraftPayload } from "../wizardTypes";

export function Step7Review({
  t,
  duplicateT,
  payload,
  duplicate,
  acknowledged,
  onAcknowledge,
  onEditStep,
  onSubmit,
  submitting,
  submitError,
}: {
  t: BusinessIdentityCopy["wizard"]["step7"];
  duplicateT: BusinessIdentityCopy["duplicate"];
  payload: WizardDraftPayload;
  duplicate: DuplicateWarningResult | null;
  acknowledged: boolean;
  onAcknowledge: (value: boolean) => void;
  onEditStep: (step: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const primaryContact = payload.contacts.find((c) => c.isPrimary) ?? payload.contacts[0];
  const needsAcknowledgement = duplicate?.level === "exact" && !acknowledged;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>

      <ReviewRow label={t.sectionBasics} onEdit={() => onEditStep(1)} editLabel={t.edit}>
        <p className="text-sm text-[#1E1810]">{payload.basics.displayName}</p>
      </ReviewRow>

      <ReviewRow label={t.sectionTypeStage} onEdit={() => onEditStep(2)} editLabel={t.edit}>
        <p className="text-sm text-[#1E1810]">
          {payload.typeStage.broadBusinessType} — {payload.typeStage.businessStage}
        </p>
      </ReviewRow>

      <ReviewRow label={t.sectionServiceArea} onEdit={() => onEditStep(3)} editLabel={t.edit}>
        <p className="text-sm text-[#1E1810]">{payload.serviceArea.rawText}</p>
      </ReviewRow>

      <ReviewRow label={t.sectionContact} onEdit={() => onEditStep(4)} editLabel={t.edit}>
        <p className="text-sm text-[#1E1810]">
          {primaryContact ? `${primaryContact.contactType}: ${primaryContact.rawValue}` : "—"}
        </p>
      </ReviewRow>

      <ReviewRow label={t.sectionOwnership} onEdit={() => onEditStep(5)} editLabel={t.edit}>
        <p className="text-sm text-[#1E1810]">{payload.ownershipConfirmation.confirmed ? t.confirmedYes : "—"}</p>
      </ReviewRow>

      <ReviewRow label={t.sectionListing} onEdit={() => onEditStep(6)} editLabel={t.edit}>
        <p className="text-sm text-[#1E1810]">
          {payload.listingCandidate ? `${payload.listingCandidate.listingSource} / ${payload.listingCandidate.listingId}` : t.noListing}
        </p>
      </ReviewRow>

      {duplicate && duplicate.level !== "none" ? (
        <div role="alert" className="rounded-2xl border border-[#C9A84A]/45 bg-[#FBF7EF] p-4">
          <p className="text-sm font-bold text-[#1E1810]">
            {duplicate.level === "exact" ? duplicateT.exactTitle : duplicate.level === "probable" ? duplicateT.probableTitle : duplicateT.possibleTitle}
          </p>
          <p className="mt-1 text-sm text-[#5C5346]">
            {duplicate.level === "exact" ? duplicateT.exactBody : duplicate.level === "probable" ? duplicateT.probableBody : duplicateT.possibleBody}
          </p>
          {duplicate.level === "exact" ? (
            <label className="mt-3 flex items-center gap-2 text-sm text-[#3D3428]">
              <input type="checkbox" checked={acknowledged} onChange={(e) => onAcknowledge(e.target.checked)} className="h-4 w-4" />
              {t.duplicateAcknowledge}
            </label>
          ) : null}
        </div>
      ) : null}

      {submitError ? (
        <p role="alert" className="text-sm text-[#7A1E2C]">
          {submitError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || needsAcknowledgement}
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-3 text-sm font-bold text-[#1E1810] shadow-md hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? t.submitting : t.submit}
      </button>
    </div>
  );
}

function ReviewRow({ label, editLabel, onEdit, children }: { label: string; editLabel: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/60 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8A6B1F]">{label}</p>
        <div className="mt-1">{children}</div>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-xs font-semibold text-[#7A1E2C] underline">
        {editLabel}
      </button>
    </div>
  );
}
