"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validateBusinessBasics, validateContact } from "@/app/lib/business/validation";
import type { DuplicateWarningResult } from "@/app/lib/business/types";
import { businessIdentityCopy, type Lang } from "../_components/businessIdentityCopy";
import { businessApiFetch } from "../_components/businessApiClient";
import { WizardShell, type SaveState } from "./WizardShell";
import { Step1Basics } from "./_steps/Step1Basics";
import { Step2TypeStage } from "./_steps/Step2TypeStage";
import { Step3ServiceArea } from "./_steps/Step3ServiceArea";
import { Step4Contacts } from "./_steps/Step4Contacts";
import { Step5Ownership } from "./_steps/Step5Ownership";
import { Step6Listing } from "./_steps/Step6Listing";
import { Step7Review } from "./_steps/Step7Review";
import { emptyWizardPayload, newContactDraft, type WizardDraftPayload } from "./wizardTypes";

const TOTAL_STEPS = 7;

type DraftListItem = { id: string; intentKey: string; currentStep: number; draftPayload: unknown };

export function OnboardingWizard({ lang, intentKey }: { lang: Lang; intentKey: string }) {
  const router = useRouter();
  const t = businessIdentityCopy(lang);
  const [hydrated, setHydrated] = useState(false);
  const [draftRowId, setDraftRowId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [payload, setPayload] = useState<WizardDraftPayload>(() => emptyWizardPayload(lang));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [duplicate, setDuplicate] = useState<DuplicateWarningResult | null>(null);
  const [acknowledgedDuplicate, setAcknowledgedDuplicate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from the server draft (source of truth) on mount — supports hard-refresh and
  // cross-device resume, since the draft lives server-side keyed by (user, intentKey).
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const result = await businessApiFetch<{ drafts: DraftListItem[] }>("/api/dashboard/business/drafts");
      if (cancelled) return;
      if (result.ok) {
        const existing = result.data.drafts.find((d) => d.intentKey === intentKey);
        if (existing) {
          setDraftRowId(existing.id);
          setStep(Math.min(Math.max(existing.currentStep, 1), TOTAL_STEPS));
          const p = existing.draftPayload as Partial<WizardDraftPayload> | undefined;
          if (p && p.schemaVersion === 1) {
            setPayload({
              ...emptyWizardPayload(lang),
              ...p,
              contacts: Array.isArray(p.contacts) && p.contacts.length > 0 ? p.contacts : [newContactDraft()],
            } as WizardDraftPayload);
          } else {
            setPayload({ ...emptyWizardPayload(lang), contacts: [newContactDraft()] });
          }
        } else {
          setPayload({ ...emptyWizardPayload(lang), contacts: [newContactDraft()] });
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
    async (nextStep: number, nextPayload: WizardDraftPayload) => {
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

  function validateCurrentStep(): boolean {
    setFieldErrors([]);
    if (step === 1) {
      const result = validateBusinessBasics({
        displayName: payload.basics.displayName,
        broadBusinessType: payload.typeStage.broadBusinessType || "placeholder",
        businessStage: payload.typeStage.businessStage || "placeholder",
        primaryLanguage: payload.basics.primaryLanguage,
      });
      if (!result.ok && result.errors.some((e) => e.field === "displayName")) {
        setFieldErrors([t.wizard.errors.validation]);
        return false;
      }
      return true;
    }
    if (step === 2) {
      return payload.typeStage.broadBusinessType.length > 0 && payload.typeStage.businessStage.length > 0;
    }
    if (step === 3) {
      return payload.serviceArea.areaKind.length > 0 && payload.serviceArea.rawText.trim().length > 0;
    }
    if (step === 4) {
      if (payload.contacts.length === 0) {
        setFieldErrors([t.wizard.step4.atLeastOne]);
        return false;
      }
      const validContacts = payload.contacts.filter((c) => c.contactType && c.rawValue.trim());
      if (validContacts.length === 0) {
        setFieldErrors([t.wizard.step4.atLeastOne]);
        return false;
      }
      for (const c of validContacts) {
        const result = validateContact({
          contactType: c.contactType,
          rawValue: c.rawValue,
          preferredChannel: c.preferredChannel,
          channelKind: c.channelKind,
          isPrimary: c.isPrimary,
        });
        if (!result.ok) {
          setFieldErrors([t.wizard.errors.validation]);
          return false;
        }
      }
      return true;
    }
    if (step === 5) {
      return payload.ownershipConfirmation.confirmed;
    }
    if (step === 6) {
      return true; // skip is always valid; source/id validity is checked at finalize time
    }
    return true;
  }

  async function handleNext() {
    if (!validateCurrentStep()) return;
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    await persist(nextStep, payload);
    setStep(nextStep);
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
        listingSource: payload.listingCandidate?.listingSource,
        listingId: payload.listingCandidate?.listingId,
      }),
    });
    if (result.ok) setDuplicate(result.data.result);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    const validContacts = payload.contacts.filter((c) => c.contactType && c.rawValue.trim());
    const result = await businessApiFetch<{ businessId: string }>("/api/dashboard/business/finalize", {
      method: "POST",
      body: JSON.stringify({
        draftId: draftRowId,
        basics: {
          displayName: payload.basics.displayName,
          broadBusinessType: payload.typeStage.broadBusinessType,
          businessStage: payload.typeStage.businessStage,
          primaryLanguage: payload.basics.primaryLanguage,
        },
        contacts: validContacts.map((c) => ({ contactType: c.contactType, value: c.rawValue, preferredChannel: c.preferredChannel, channelKind: c.channelKind, isPrimary: c.isPrimary })),
        serviceAreas: [{ areaKind: payload.serviceArea.areaKind, rawText: payload.serviceArea.rawText, isPrimary: true }],
        ownershipConfirmed: payload.ownershipConfirmation.confirmed,
        listingCandidate: payload.listingCandidate && payload.listingCandidate.listingSource && payload.listingCandidate.listingId ? payload.listingCandidate : null,
        acknowledgedDuplicateWarning: acknowledgedDuplicate,
      }),
    });
    setSubmitting(false);
    if (result.ok) {
      router.push(`/dashboard/business-tools/business/${result.data.businessId}?lang=${lang}`);
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

  const nextDisabled = step === 4 && payload.contacts.filter((c) => c.contactType && c.rawValue.trim()).length === 0;

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
    >
      {step === 1 ? <Step1Basics t={t.wizard.step1} payload={payload} onChange={setPayload} errors={fieldErrors} /> : null}
      {step === 2 ? <Step2TypeStage t={t.wizard.step2} payload={payload} onChange={setPayload} /> : null}
      {step === 3 ? <Step3ServiceArea t={t.wizard.step3} payload={payload} onChange={setPayload} /> : null}
      {step === 4 ? <Step4Contacts t={t.wizard.step4} payload={payload} onChange={setPayload} errors={fieldErrors} /> : null}
      {step === 5 ? <Step5Ownership t={t.wizard.step5} payload={payload} onChange={setPayload} /> : null}
      {step === 6 ? <Step6Listing t={t.wizard.step6} payload={payload} onChange={setPayload} /> : null}
      {step === 7 ? (
        <Step7Review
          t={t.wizard.step7}
          duplicateT={t.duplicate}
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
