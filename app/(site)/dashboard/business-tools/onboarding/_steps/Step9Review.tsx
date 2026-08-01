"use client";

import {
  AUTHORIZATION_ROLES,
  BROAD_BUSINESS_TYPES,
  BUSINESS_STAGES,
  CONTACT_CAPABILITIES,
  CONTACT_LABELS,
  CUSTOM_LINK_TYPES,
  DIGITAL_PROFILE_PLATFORMS,
  OPERATING_MODELS,
  PREFERRED_RESPONSE_METHODS,
  SALES_CHANNELS,
  SALES_RELATIONSHIPS,
} from "@/app/lib/business/constants";
import { countryLabel } from "@/app/lib/business/countries";
import { businessLanguageLabel } from "@/app/lib/business/languages";
import type { DuplicateWarningResult } from "@/app/lib/business/types";
import type { BusinessIdentityCopy, Lang } from "../../_components/businessIdentityCopy";
import { deriveEffectiveOperatingModels, physicalAddressSummary, summarizeServiceCoverage, type WizardDraftPayloadV2 } from "../wizardTypes";
import { formatUsPhoneForDisplay } from "./Step6ContactsProfiles";

function labelFrom(list: readonly { value: string; es: string; en: string }[], value: string, lang: Lang): string {
  return list.find((o) => o.value === value)?.[lang] ?? value;
}

/**
 * Gate BCO-3R-B.5 — customer-facing review must never show the raw `contactType` enum ("phone")
 * or raw canonical digits ("14088021531"); it shows the owner's chosen label ("Principal"/"Main")
 * and a formatted value instead. Canonical storage is untouched — this is display-only.
 */
function contactSummaryLine(c: WizardDraftPayloadV2["contacts"][number], lang: Lang): string {
  const label = labelFrom(CONTACT_LABELS, c.label, lang);
  const value = c.contactType === "phone" ? formatUsPhoneForDisplay(c.rawValue) : c.rawValue;
  return `${label} · ${value}`;
}

export function Step9Review({
  t,
  duplicateT,
  privacyFull,
  coverageSummaryT,
  lang,
  payload,
  duplicate,
  acknowledged,
  onAcknowledge,
  onEditStep,
  onSubmit,
  submitting,
  submitError,
}: {
  t: BusinessIdentityCopy["wizard"]["step9"];
  duplicateT: BusinessIdentityCopy["duplicate"];
  privacyFull: BusinessIdentityCopy["wizard"]["privacyFull"];
  coverageSummaryT: BusinessIdentityCopy["wizard"]["step5"]["coverage"]["summary"];
  lang: Lang;
  payload: WizardDraftPayloadV2;
  duplicate: DuplicateWarningResult | null;
  acknowledged: boolean;
  onAcknowledge: (v: boolean) => void;
  onEditStep: (step: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const needsAcknowledgement = duplicate?.level === "exact" && !acknowledged;
  const primaryContact = payload.contacts.find((c) => c.isPrimary) ?? payload.contacts[0];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>

      <ReviewRow label={t.sectionSetup} onEdit={() => onEditStep(1)} editLabel={t.edit}>
        {payload.setupLanguage === "es" ? "Español" : "English"}
      </ReviewRow>

      <ReviewRow label={t.sectionIdentity} onEdit={() => onEditStep(2)} editLabel={t.edit}>
        {payload.basics.displayName || "—"}
        {payload.basics.businessPrimaryLanguage ? ` · ${businessLanguageLabel(payload.basics.businessPrimaryLanguage, lang)}` : ""}
      </ReviewRow>

      <ReviewRow label={t.sectionCategoryStage} onEdit={() => onEditStep(3)} editLabel={t.edit}>
        {payload.typeStage.broadBusinessType ? labelFrom(BROAD_BUSINESS_TYPES, payload.typeStage.broadBusinessType, lang) : "—"}
        {payload.typeStage.businessStage ? ` — ${labelFrom(BUSINESS_STAGES, payload.typeStage.businessStage, lang)}` : ""}
      </ReviewRow>

      <ReviewRow label={t.sectionOperatingModel} onEdit={() => onEditStep(4)} editLabel={t.edit}>
        {(() => {
          const effective = deriveEffectiveOperatingModels(payload.operatingModel.operatingModels);
          return effective.length > 0 ? effective.map((m) => labelFrom(OPERATING_MODELS, m, lang)).join(", ") : t.noneSelected;
        })()}
      </ReviewRow>
      <ReviewRow label={t.sectionRelationships} onEdit={() => onEditStep(4)} editLabel={t.edit}>
        {payload.operatingModel.salesRelationships.length > 0
          ? payload.operatingModel.salesRelationships.map((m) => labelFrom(SALES_RELATIONSHIPS, m, lang)).join(", ")
          : t.noneSelected}
      </ReviewRow>
      <ReviewRow label={t.sectionChannels} onEdit={() => onEditStep(4)} editLabel={t.edit}>
        {payload.operatingModel.salesChannels.length > 0 ? payload.operatingModel.salesChannels.map((m) => labelFrom(SALES_CHANNELS, m, lang)).join(", ") : t.noneSelected}
      </ReviewRow>

      {/* Gate BCO-3R-B.5 — business country, physical address, and service area are three
          independent facts (a business can be based in one country and serve another) and are
          never collapsed into a single misleading line. */}
      <ReviewRow label={t.sectionBusinessCountry} onEdit={() => onEditStep(5)} editLabel={t.edit}>
        {payload.serviceArea.country ? countryLabel(payload.serviceArea.country, lang) : "—"}
      </ReviewRow>

      {(() => {
        const address = physicalAddressSummary(payload.serviceArea.structuredDetails, payload.serviceArea.country, lang);
        return address ? (
          <ReviewRow label={t.sectionLocation} onEdit={() => onEditStep(5)} editLabel={t.edit}>
            {address}
          </ReviewRow>
        ) : null;
      })()}

      <ReviewRow label={t.sectionCoverage} onEdit={() => onEditStep(5)} editLabel={t.edit}>
        {summarizeServiceCoverage(payload.serviceArea.country, payload.serviceArea.structuredDetails, lang, coverageSummaryT)}
      </ReviewRow>

      <ReviewRow label={t.sectionContacts} onEdit={() => onEditStep(6)} editLabel={t.edit}>
        {primaryContact ? (
          <>
            <span>
              {contactSummaryLine(primaryContact, lang)}
              {payload.contacts.length > 1 ? ` (+${payload.contacts.length - 1})` : ""}
            </span>
            {primaryContact.contactType === "phone" && primaryContact.capabilities.length > 0 ? (
              <span className="mt-0.5 block text-xs text-[#7A7164]">
                {primaryContact.capabilities.map((cap) => labelFrom(CONTACT_CAPABILITIES, cap, lang)).join(" · ")}
              </span>
            ) : null}
          </>
        ) : (
          "—"
        )}
      </ReviewRow>
      <ReviewRow label={t.sectionPreferredChannel} onEdit={() => onEditStep(6)} editLabel={t.edit}>
        {payload.preferredResponseMethod ? labelFrom(PREFERRED_RESPONSE_METHODS, payload.preferredResponseMethod, lang) : t.noneSelected}
      </ReviewRow>
      <ReviewRow label={t.sectionDigitalProfiles} onEdit={() => onEditStep(6)} editLabel={t.edit}>
        {payload.digitalProfiles.length > 0
          ? payload.digitalProfiles.map((p) => labelFrom(DIGITAL_PROFILE_PLATFORMS, p.platform, lang)).join(", ")
          : t.noneSelected}
      </ReviewRow>
      <ReviewRow label={t.sectionCustomLinks} onEdit={() => onEditStep(6)} editLabel={t.edit}>
        {payload.customLinks.filter((l) => l.linkType).length > 0
          ? payload.customLinks.filter((l) => l.linkType).map((l) => labelFrom(CUSTOM_LINK_TYPES, l.linkType, lang)).join(", ")
          : t.noneSelected}
      </ReviewRow>

      <ReviewRow label={t.sectionAuthorization} onEdit={() => onEditStep(7)} editLabel={t.edit}>
        {payload.ownershipAuthorization.role ? labelFrom(AUTHORIZATION_ROLES, payload.ownershipAuthorization.role, lang) : "—"}
        {payload.ownershipAuthorization.confirmed ? ` · ${t.confirmedYes}` : ""}
      </ReviewRow>

      <ReviewRow label={t.sectionListings} onEdit={() => onEditStep(8)} editLabel={t.edit}>
        {payload.selectedListingCandidates.length > 0
          ? `${t.listingConfirmed} (${payload.selectedListingCandidates.length})`
          : payload.listingsSkipped
            ? t.listingSkipped
            : t.listingNoneFound}
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

      <section className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/60 p-4">
        <h3 className="text-sm font-bold text-[#1E1810]">{t.finalExplanation.title}</h3>
        <ul className="mt-2 space-y-1">
          {t.finalExplanation.items.map((item) => (
            <li key={item} className="flex gap-2 text-xs text-[#5C5346]">
              <span aria-hidden="true">·</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-dashed border-[#D6C7AD] bg-[#FBF7EF]/60 p-4">
        <h3 className="text-sm font-bold text-[#1E1810]">{privacyFull.title}</h3>
        {privacyFull.body.split("\n\n").map((para) => (
          <p key={para} className="mt-1.5 text-xs text-[#5C5346]">
            {para}
          </p>
        ))}
      </section>

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
    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/60 p-4">
      <div className="min-w-0 flex-1 basis-[220px]">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8A6B1F]">{label}</p>
        <div className="mt-1 break-words text-sm text-[#1E1810]">{children}</div>
      </div>
      <button type="button" onClick={onEdit} className="min-h-[32px] shrink-0 text-xs font-semibold text-[#7A1E2C] underline">
        {editLabel}
      </button>
    </div>
  );
}
