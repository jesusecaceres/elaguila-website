"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  validateAuthorization,
  validateContact,
  validateCountryField,
  validateCustomLink,
  validateOperatingModels,
  validatePreferredResponseMethod,
  validateServiceCoverage,
  type AuthorizationInput,
} from "@/app/lib/business/validation";
import type { DuplicateWarningResult, PrimaryLanguage } from "@/app/lib/business/types";
import { businessIdentityCopy, type Lang } from "../_components/businessIdentityCopy";
import { businessApiFetch } from "../_components/businessApiClient";
import { BusinessIdentityLangSwitch } from "../_components/BusinessIdentityLangSwitch";
import { WizardShell, type SaveState } from "./WizardShell";
import { Step1SetupLanguage } from "./_steps/Step1SetupLanguage";
import { Step2BusinessIdentity } from "./_steps/Step2BusinessIdentity";
import { Step3CategoryStage } from "./_steps/Step3CategoryStage";
import { Step4OperatingModel } from "./_steps/Step4OperatingModel";
import { Step5Location } from "./_steps/Step5Location";
import { Step6ContactsProfiles } from "./_steps/Step6ContactsProfiles";
import { Step7Authorization } from "./_steps/Step7Authorization";
import { Step8OwnedListings } from "./_steps/Step8OwnedListings";
import { Step9Review } from "./_steps/Step9Review";
import {
  composeServiceAreaAreaKind,
  composeServiceAreaRawText,
  deriveEffectiveOperatingModels,
  emptyWizardPayloadV2,
  isLegacyV1Payload,
  migrateDraftV1ToV2,
  newContactDraftV2,
  type WizardDraftPayloadV2,
} from "./wizardTypes";

const TOTAL_STEPS = 9;

type DraftListItem = { id: string; intentKey: string; currentStep: number; draftPayload: unknown };

export function OnboardingWizard({ lang, intentKey }: { lang: Lang; intentKey: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/business-tools/onboarding";
  const searchParams = useSearchParams();
  const t = businessIdentityCopy(lang);
  const [hydrated, setHydrated] = useState(false);
  const [draftRowId, setDraftRowId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [payload, setPayload] = useState<WizardDraftPayloadV2>(() => emptyWizardPayloadV2(lang));
  const [justMigrated, setJustMigrated] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [duplicate, setDuplicate] = useState<DuplicateWarningResult | null>(null);
  const [acknowledgedDuplicate, setAcknowledgedDuplicate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const result = await businessApiFetch<{ drafts: DraftListItem[] }>("/api/dashboard/business/drafts");
      if (cancelled) return;
      if (result.ok) {
        const existing = result.data.drafts.find((d) => d.intentKey === intentKey);
        if (existing) {
          setDraftRowId(existing.id);
          const raw = existing.draftPayload;
          if (isLegacyV1Payload(raw)) {
            const migrated = migrateDraftV1ToV2(raw, lang);
            // The active URL language is always the source of truth (Gate BCO-3R-B.1 fix) —
            // a stored/migrated language must never silently diverge from what the owner is
            // actually looking at, or Review/completed views can show a different language
            // than the rest of the screen.
            setPayload({ ...migrated, setupLanguage: lang, contacts: migrated.contacts.length > 0 ? migrated.contacts : [newContactDraftV2()] });
            setJustMigrated(true);
            setStep(1);
          } else {
            const p = raw as Partial<WizardDraftPayloadV2> | undefined;
            if (p && p.schemaVersion === 2) {
              const clampedStep = Math.min(Math.max(existing.currentStep, 1), TOTAL_STEPS);
              const resolvedPayload = {
                ...emptyWizardPayloadV2(lang),
                ...p,
                setupLanguage: lang,
                contacts: Array.isArray(p.contacts) && p.contacts.length > 0 ? p.contacts : [newContactDraftV2()],
              } as WizardDraftPayloadV2;
              setPayload(resolvedPayload);
              setStep(clampedStep);
              if (p.setupLanguage && p.setupLanguage !== lang) {
                void persist(clampedStep, resolvedPayload);
              }
            } else {
              setPayload({ ...emptyWizardPayloadV2(lang), contacts: [newContactDraftV2()] });
            }
          }
        } else {
          setPayload({ ...emptyWizardPayloadV2(lang), contacts: [newContactDraftV2()] });
        }
      }
      setHydrated(true);
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [intentKey]);

  const persist = useCallback(
    async (nextStep: number, nextPayload: WizardDraftPayloadV2) => {
      setSaveState("saving");
      const result = await businessApiFetch<{ draft: { id: string } }>("/api/dashboard/business/drafts", {
        method: "POST",
        body: JSON.stringify({ intentKey, currentStep: nextStep, draftPayload: { ...nextPayload, updatedByStep: nextStep } }),
      });
      if (result.ok) {
        setDraftRowId(result.data.draft.id);
        setSaveState("saved");
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => setSaveState("idle"), 2000);
      } else {
        setSaveState("failed");
      }
    },
    [intentKey],
  );

  function handleLanguageSelect(next: PrimaryLanguage) {
    const nextPayload = { ...payload, setupLanguage: next };
    setPayload(nextPayload);
    void persist(step, nextPayload);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("lang", next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function validateCurrentStep(): boolean {
    setFieldErrors([]);
    if (step === 1) {
      return Boolean(payload.setupLanguage);
    }
    if (step === 2) {
      if (!payload.basics.displayName.trim()) {
        setFieldErrors([t.wizard.errors.validation]);
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!payload.typeStage.broadBusinessType || !payload.typeStage.businessStage) {
        setFieldErrors(["broadBusinessType"]);
        return false;
      }
      return true;
    }
    if (step === 4) {
      const result = validateOperatingModels(payload.operatingModel.operatingModels);
      if (!result.ok) {
        setFieldErrors([t.wizard.errors.validation]);
        return false;
      }
      return true;
    }
    if (step === 5) {
      const result = validateCountryField(payload.serviceArea.country);
      if (!result.ok) {
        setFieldErrors(["country"]);
        return false;
      }
      const details = payload.serviceArea.structuredDetails;
      const coverage = details.coverage ?? ({ schemaVersion: 1, level: "" } as const);
      const coverageResult = validateServiceCoverage({
        country: payload.serviceArea.country,
        coverage,
        baseCity: details.baseCity || details.city,
      });
      if (!coverageResult.ok) {
        setFieldErrors(["coverage"]);
        return false;
      }
      return true;
    }
    if (step === 6) {
      const validContacts = payload.contacts.filter((c) => c.contactType && c.rawValue.trim());
      if (validContacts.length === 0) {
        setFieldErrors(["contacts"]);
        return false;
      }
      for (const c of validContacts) {
        const result = validateContact({
          contactType: c.contactType,
          rawValue: c.rawValue,
          preferredChannel: c.preferredChannel,
          channelKind: c.channelKind,
          isPrimary: c.isPrimary,
          label: c.label,
          visibility: c.visibility,
          capabilities: c.capabilities,
        });
        if (!result.ok) {
          setFieldErrors([t.wizard.errors.validation]);
          return false;
        }
      }
      const preferenceResult = validatePreferredResponseMethod({
        method: payload.preferredResponseMethod || null,
        contacts: validContacts.map((c) => ({ contactType: c.contactType, capabilities: c.capabilities })),
      });
      if (!preferenceResult.ok) {
        setFieldErrors([t.wizard.errors.validation]);
        return false;
      }
      for (const link of payload.customLinks) {
        if (!link.linkType && !link.rawUrl.trim() && !link.customLabel.trim()) continue; // blank/never-touched row, ignore
        const result = validateCustomLink({ linkType: link.linkType, customLabel: link.customLabel, rawUrl: link.rawUrl });
        if (!result.ok) {
          setFieldErrors([t.wizard.errors.validation]);
          return false;
        }
      }
      return true;
    }
    if (step === 7) {
      const input: AuthorizationInput = {
        confirmed: payload.ownershipAuthorization.confirmed,
        role: payload.ownershipAuthorization.role,
        representativeRelationship: payload.ownershipAuthorization.representativeRelationship,
        representativeContactEmail: payload.ownershipAuthorization.representativeContactEmail,
      };
      const result = validateAuthorization(input);
      if (!result.ok) {
        setFieldErrors([t.wizard.errors.validation]);
        return false;
      }
      return true;
    }
    return true; // step 8 (listings) is always optional; step 9 has its own submit gate
  }

  async function handleNext() {
    if (!validateCurrentStep()) return;
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    await persist(nextStep, payload);
    setStep(nextStep);
    setJustMigrated(false);
    if (nextStep === TOTAL_STEPS) void runDuplicateCheck();
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function runDuplicateCheck() {
    const result = await businessApiFetch<{ result: DuplicateWarningResult }>("/api/dashboard/business/duplicates", {
      method: "POST",
      body: JSON.stringify({
        displayName: payload.basics.displayName,
        listingSource: payload.selectedListingCandidates[0]?.listingSource,
        listingId: payload.selectedListingCandidates[0]?.listingId,
      }),
    });
    if (result.ok) setDuplicate(result.data.result);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    const validContacts = payload.contacts.filter((c) => c.contactType && c.rawValue.trim());
    const validDigitalProfiles = payload.digitalProfiles.filter((p) => p.platform && p.handleOrUrl.trim());
    const validCustomLinks = payload.customLinks.filter((l) => l.linkType && l.rawUrl.trim());
    const details = payload.serviceArea.structuredDetails;

    const result = await businessApiFetch<{ businessId: string }>("/api/dashboard/business/finalize-v3", {
      method: "POST",
      body: JSON.stringify({
        draftId: draftRowId,
        basics: {
          displayName: payload.basics.displayName,
          broadBusinessType: payload.typeStage.broadBusinessType,
          specificBusinessType: payload.typeStage.specificBusinessType,
          customSpecificType: payload.typeStage.customSpecificType,
          businessStage: payload.typeStage.businessStage,
          primaryLanguage: payload.setupLanguage,
          businessPrimaryLanguage: payload.basics.businessPrimaryLanguage,
          businessAdditionalLanguages: payload.basics.businessAdditionalLanguages,
          yearStarted: payload.basics.yearStarted,
        },
        operatingModel: {
          operatingModels: deriveEffectiveOperatingModels(payload.operatingModel.operatingModels),
          salesRelationships: payload.operatingModel.salesRelationships,
          salesChannels: payload.operatingModel.salesChannels,
        },
        contacts: validContacts.map((c) => ({
          contactType: c.contactType,
          value: c.rawValue,
          preferredChannel: c.preferredChannel,
          channelKind: c.channelKind,
          isPrimary: c.isPrimary,
          label: c.label,
          visibility: c.visibility,
          capabilities: c.capabilities,
        })),
        preferredResponseMethod: payload.preferredResponseMethod || null,
        serviceAreas: [
          {
            areaKind: composeServiceAreaAreaKind(details),
            rawText: composeServiceAreaRawText(payload.serviceArea.country, details),
            isPrimary: true,
            country: payload.serviceArea.country,
            structuredDetails: details,
          },
        ],
        digitalProfiles: validDigitalProfiles.map((p) => ({ platform: p.platform, handleOrUrl: p.handleOrUrl })),
        customLinks: validCustomLinks.map((l) => ({ linkType: l.linkType, customLabel: l.customLabel, rawUrl: l.rawUrl })),
        authorization: {
          confirmed: payload.ownershipAuthorization.confirmed,
          role: payload.ownershipAuthorization.role,
          representativeRelationship: payload.ownershipAuthorization.representativeRelationship,
          representativeContactEmail: payload.ownershipAuthorization.representativeContactEmail,
          representativeNote: payload.ownershipAuthorization.representativeNote,
        },
        listingCandidates: payload.selectedListingCandidates,
        acknowledgedDuplicateWarning: acknowledgedDuplicate,
      }),
    });
    setSubmitting(false);
    if (result.ok) {
      router.push(`/dashboard/business-tools/business/${result.data.businessId}?lang=${lang}`);
      return;
    }
    if (result.error === "duplicate_warning_unacknowledged") {
      setDuplicate({ level: "exact", candidates: duplicate?.candidates ?? [] });
      setSubmitError(t.wizard.errors.validation);
      return;
    }
    setSubmitError(result.status === 0 ? t.wizard.errors.network : t.wizard.errors.generic);
  }

  if (!hydrated) {
    return (
      <div role="status" aria-live="polite" className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">
        {t.common.loading}
      </div>
    );
  }

  const nextDisabled = step === 6 && payload.contacts.filter((c) => c.contactType && c.rawValue.trim()).length === 0;

  return (
    <WizardShell
      t={t.wizard}
      step={step}
      totalSteps={TOTAL_STEPS}
      saveState={saveState}
      onBack={handleBack}
      onNext={() => void handleNext()}
      nextDisabled={nextDisabled}
      hideNext={step === TOTAL_STEPS}
      langSwitch={<BusinessIdentityLangSwitch lang={lang} onBeforeSwitch={handleLanguageSelect} />}
    >
      {justMigrated ? (
        <div role="status" className="mb-4 rounded-2xl border border-[#C9A84A]/45 bg-[#FBF7EF] p-4 text-sm text-[#5C5346]">
          <p className="font-bold text-[#1E1810]">{t.drafts.migratedNoticeTitle}</p>
          <p className="mt-1">{t.drafts.migratedNoticeBody}</p>
        </div>
      ) : null}

      {step === 1 ? (
        <Step1SetupLanguage
          t={t.wizard.step1}
          purpose={t.wizard.purpose}
          privacyShort={t.wizard.privacyShort}
          legend={t.wizard.requiredOptionalLegend}
          value={payload.setupLanguage}
          onSelect={handleLanguageSelect}
        />
      ) : null}
      {step === 2 ? (
        <Step2BusinessIdentity t={t.wizard.step2} whyWeAskLabel={t.wizard.why} lang={lang} payload={payload} onChange={setPayload} errors={fieldErrors} />
      ) : null}
      {step === 3 ? <Step3CategoryStage t={t.wizard.step3} lang={lang} payload={payload} onChange={setPayload} errors={fieldErrors} /> : null}
      {step === 4 ? <Step4OperatingModel t={t.wizard.step4} whyWeAskLabel={t.wizard.why} lang={lang} payload={payload} onChange={setPayload} /> : null}
      {step === 5 ? <Step5Location t={t.wizard.step5} lang={lang} payload={payload} onChange={setPayload} errors={fieldErrors} /> : null}
      {step === 6 ? (
        <Step6ContactsProfiles t={t.wizard.step6} whyWeAskLabel={t.wizard.why} lang={lang} payload={payload} onChange={setPayload} errors={fieldErrors} />
      ) : null}
      {step === 7 ? <Step7Authorization t={t.wizard.step7} lang={lang} payload={payload} onChange={setPayload} errors={fieldErrors} /> : null}
      {step === 8 ? <Step8OwnedListings t={t.wizard.step8} lang={lang} payload={payload} onChange={setPayload} /> : null}
      {step === 9 ? (
        <Step9Review
          t={t.wizard.step9}
          duplicateT={t.duplicate}
          privacyFull={t.wizard.privacyFull}
          coverageSummaryT={t.wizard.step5.coverage.summary}
          lang={lang}
          payload={payload}
          duplicate={duplicate}
          acknowledged={acknowledgedDuplicate}
          onAcknowledge={setAcknowledgedDuplicate}
          onEditStep={setStep}
          onSubmit={() => void handleSubmit()}
          submitting={submitting}
          submitError={submitError}
        />
      ) : null}
    </WizardShell>
  );
}
