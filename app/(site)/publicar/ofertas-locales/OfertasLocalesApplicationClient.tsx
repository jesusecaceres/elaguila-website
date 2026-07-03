"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  hasOfertaLocalAddressAccepted,
  hasOfertaLocalUrlAccepted,
  getOfertaLocalApplicationBasePriceMonthly,
  getOfertaLocalProductDisplayLabel,
  isOfertaLocalCouponPromotionFlow,
  isOfertaLocalEmailFormatValid,
  isOfertaLocalWeeklyFlyerFlow,
  normalizeOfertaLocalEmailInput,
  resolveOfertaLocalContactEmail,
} from "@/app/lib/ofertas-locales/ofertasLocalesApplicationHelpers";
import {
  OFERTAS_LOCALES_AI_PRODUCT_SEARCH_ADDON_DISPLAY_MONTHLY,
  OFERTAS_LOCALES_BUSINESS_CATEGORY_OPTIONS,
  OFERTAS_LOCALES_COUPON_PROMOTION_SUBTYPE_OPTIONS,
  OFERTAS_LOCALES_DIGITAL_FIRST_VALUE_PROPS,
  OFERTAS_LOCALES_FEATURED_PLACEMENT_SCOPE_OPTIONS,
  OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS,
  OFERTAS_LOCALES_PRODUCT_NAME,
} from "@/app/lib/ofertas-locales/ofertasLocalesConstants";
import {
  OFERTAS_LOCALES_PRIMARY_AD_FORMAT_OPTIONS,
  buildPrimaryAdFormatChangePatch,
  inferPrimaryAdFormatFromDraft,
  isOfertaLocalLocalCouponsLane,
  isOfertaLocalShoppingSpecialsLane,
} from "@/app/lib/ofertas-locales/ofertasLocalesTwoLaneProductModel";
import {
  formatOfertaLocalPhoneDisplay,
  normalizeOfertaLocalUrlInput,
} from "@/app/lib/ofertas-locales/ofertasLocalesFormatting";
import {
  OfertaLocalPostalInput,
  OfertaLocalRegionStateInput,
} from "@/app/lib/ofertas-locales/ofertasLocalesLocationFieldControls";
import {
  OFERTA_LOCAL_COUNTRY_SUGGESTIONS,
  OFERTA_LOCAL_DEFAULT_COUNTRY,
  OFERTA_LOCAL_NORCAL_CITY_SUGGESTIONS,
} from "@/app/lib/ofertas-locales/ofertasLocalesLocationHelpers";
import {
  buildBusinessCategoryChangePatch,
  businessCategoryShowsSubtypeDropdown,
  businessCategoryUsesCustomTypeText,
  getSubtypeLabelForBusinessCategory,
  getSubtypeOptionsForBusinessCategory,
} from "@/app/lib/ofertas-locales/ofertasLocalesBusinessCategoryUx";
import { saveOfertaLocalDraftToStorage } from "@/app/lib/ofertas-locales/ofertasLocalesDraftPersistence";
import {
  clearOfertaLocalAiScanSession,
  loadOfertaLocalAiScanSession,
  saveOfertaLocalAiScanSession,
} from "@/app/lib/ofertas-locales/ofertasLocalesAiScanRecordPersistence";
import { validateOfertaLocalDraftForServerPublish } from "@/app/lib/ofertas-locales/ofertasLocalesPublishMapper";
import { submitOfertaLocalDraftForReview } from "@/app/lib/ofertas-locales/ofertasLocalesPublishSubmit";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type {
  OfertaLocalBusinessCategory,
  OfertaLocalMarketType,
  OfertaLocalOfferType,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import {
  clampWizardStep,
  getOfertasLocalesWizardStepHints,
  OFERTAS_LOCALES_WIZARD_STEP_COUNT,
  OFERTAS_LOCALES_WIZARD_STEPS,
  wizardStepTitle,
  type OfertasLocalesWizardStepId,
} from "@/app/lib/ofertas-locales/ofertasLocalesWizardSteps";
import { useSearchParams } from "next/navigation";
import { normalizeLang } from "@/app/lib/language";
import { publicContactHref } from "@/app/lib/leonix/publicRouteHrefs";
import { useOfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { useOfertasLocalesDraft } from "@/app/lib/ofertas-locales/useOfertasLocalesDraft";
import {
  validateOfertaLocalDraftForFuturePublish,
  validateOfertaLocalDraftForPreview,
} from "@/app/lib/ofertas-locales/ofertasLocalesValidation";
import { OfertasLocalesAiScanReviewWorkspace } from "./OfertasLocalesAiScanReviewWorkspace";
import { OfertasLocalesAiScanPanel } from "./OfertasLocalesAiScanPanel";
import { OfertasLocalesClickableItemPreviewPanel } from "./OfertasLocalesClickableItemPreviewPanel";
import { OfertasLocalesDraftAssetSection } from "./OfertasLocalesDraftAssetSection";
import { OfertasLocalesUploadedFilesSummary } from "./OfertasLocalesUploadedFilesSummary";
import {
  OFERTAS_LOCALES_SHELL_COPY,
  ofertasLocalesAppCopy,
} from "./ofertasLocalesApplicationCopy";
import { OfertasLocalesValidationPanel } from "./OfertasLocalesValidationPanel";
import { ofertaLocalDraftHasUnuploadedAssetMetadata } from "@/app/lib/ofertas-locales/ofertasLocalesStep5AssetLayout";
import { OfertasLocalesWizardProgress } from "./OfertasLocalesWizardProgress";
import type { OfertaLocalAiReviewGateState } from "./OfertasLocalesAiItemReviewPanel";

function formatOfertaLocalCopyTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

const PAGE_BG = "bg-[#FFFCF7]";
const CARD = "rounded-2xl border border-[#D4C4A8]/80 bg-[#FFFCF7] shadow-sm";
const INPUT =
  "w-full rounded-xl border border-[#D4C4A8]/90 bg-white px-3 py-2.5 text-sm text-[#1E1814] placeholder:text-[#1E1814]/40 focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/25";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/70";
const HELPER = "mt-1 text-xs leading-relaxed text-[#1E1814]/60";
const CONFIRM = "mt-1 text-xs font-medium text-emerald-800";
const SECTION_TITLE = "text-lg font-semibold text-[#1E1814]";
const BTN_PRIMARY =
  "rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45";
const BTN_SECONDARY =
  "rounded-xl border border-[#D4C4A8] bg-white px-4 py-2.5 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45";
const CALLOUT =
  "rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-4 py-3 text-sm text-[#1E1814]/75";
const HINT_BOX =
  "rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900";
const ERROR_BOX =
  "rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function FieldBlock({
  label,
  helper,
  optional,
  optionalLabel = "opcional",
  confirm,
  children,
}: {
  label: string;
  helper?: string;
  optional?: boolean;
  optionalLabel?: string;
  confirm?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className={LABEL}>
        {label}
        {optional ? (
          <span className="ml-1 font-normal normal-case text-[#1E1814]/45">({optionalLabel})</span>
        ) : null}
      </label>
      {children}
      {helper ? <p className={HELPER}>{helper}</p> : null}
      {confirm ? <p className={CONFIRM}>{confirm}</p> : null}
    </div>
  );
}

function formatSavedAt(ts: number | null, lang: "es" | "en"): string | null {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleTimeString(lang === "en" ? "en-US" : "es-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export default function OfertasLocalesApplicationClient() {
  const searchParams = useSearchParams();
  const routeLang = normalizeLang(searchParams?.get("lang"));
  const lang = useOfertasLocalesAppLang();
  const c = ofertasLocalesAppCopy(lang);
  const contactMoreExposureHref = publicContactHref({
    lang: routeLang,
    sourcePage: "publicar-ofertas-locales",
    sourceCta: "more_exposure_contact",
    inquiryType: "advertising",
  });
  const { draft, updateDraft, resetDraft, hasLoadedDraft, lastSavedAt } = useOfertasLocalesDraft();
  const [step, setStep] = useState<OfertasLocalesWizardStepId>(1);
  const [step5PendingFileCount, setStep5PendingFileCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{ id: string; status: string } | null>(null);
  const [aiScanRecordId, setAiScanRecordId] = useState<string | null>(
    () => loadOfertaLocalAiScanSession().ofertaLocalId
  );
  const [lastScanJobId, setLastScanJobId] = useState<string | null>(
    () => loadOfertaLocalAiScanSession().lastScanJobId
  );
  const [scanPollingActive, setScanPollingActive] = useState(false);
  const [scanRefreshToken, setScanRefreshToken] = useState(0);
  const [aiReviewGate, setAiReviewGate] = useState<OfertaLocalAiReviewGateState>({
    activeSourceAssetId: null,
    activeScanJobId: null,
    totalItems: 0,
    needsReviewCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    reviewLaterCount: 0,
  });
  const [uploadEditorOpen, setUploadEditorOpen] = useState(false);
  const [step7Confirmations, setStep7Confirmations] = useState({
    businessInfo: false,
    filesDates: false,
    aiItems: false,
    leonixRules: false,
  });
  const [signedIn, setSignedIn] = useState(true);

  const effectiveOfertaLocalId = submitSuccess?.id ?? aiScanRecordId;
  const showFullWidthReviewDesk =
    step === 5 &&
    draft.wantsAiSearchableSpecials &&
    Boolean(effectiveOfertaLocalId?.trim());
  const hasExistingAiScan =
    draft.wantsAiSearchableSpecials &&
    Boolean(lastScanJobId || aiReviewGate.totalItems > 0 || aiReviewGate.activeScanJobId);
  const collapseUploadForReview = false;

  useEffect(() => {
    saveOfertaLocalAiScanSession({
      ofertaLocalId: effectiveOfertaLocalId,
      lastScanJobId,
    });
  }, [effectiveOfertaLocalId, lastScanJobId]);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    void sb.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session?.access_token));
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.access_token));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleAiScanRecordId = useCallback((id: string) => {
    setAiScanRecordId(id);
  }, []);

  const handleScanStarted = useCallback(() => {
    setScanPollingActive(true);
  }, []);

  const handleScanComplete = useCallback((scanJobId: string) => {
    setLastScanJobId(scanJobId);
    setScanRefreshToken((token) => token + 1);
  }, []);

  const handleScanFinished = useCallback(() => {
    setScanPollingActive(false);
    setScanRefreshToken((token) => token + 1);
  }, []);

  const handleAiReviewGateChange = useCallback((state: OfertaLocalAiReviewGateState) => {
    setAiReviewGate(state);
  }, []);

  const handleStartFresh = useCallback(() => {
    const msg =
      lang === "en"
        ? `Are you sure? ${c.startOverDeviceWarning} You will start again at Step 1.`
        : `¿Estás seguro? ${c.startOverDeviceWarning} Empezarás otra vez en el Paso 1.`;
    if (!window.confirm(msg)) return;
    clearOfertaLocalAiScanSession();
    resetDraft();
    setSubmitSuccess(null);
    setSubmitError(null);
    setAiScanRecordId(null);
    setLastScanJobId(null);
    setScanPollingActive(false);
    setScanRefreshToken((token) => token + 1);
    setAiReviewGate({
      activeSourceAssetId: null,
      activeScanJobId: null,
      totalItems: 0,
      needsReviewCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      reviewLaterCount: 0,
    });
    setUploadEditorOpen(false);
    setStep7Confirmations({
      businessInfo: false,
      filesDates: false,
      aiItems: false,
      leonixRules: false,
    });
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [c.startOverDeviceWarning, lang, resetDraft]);

  const previewIssues = useMemo(() => validateOfertaLocalDraftForPreview(draft), [draft]);
  const publishIssues = useMemo(() => validateOfertaLocalDraftForFuturePublish(draft), [draft]);
  const serverPublishIssues = useMemo(() => validateOfertaLocalDraftForServerPublish(draft), [draft]);
  const previewReady = previewIssues.length === 0;
  const publishFieldsReady = serverPublishIssues.every((i) => i.severity !== "error");

  const isFlyer = isOfertaLocalWeeklyFlyerFlow(draft.offerType);
  const isCouponPromo = isOfertaLocalCouponPromotionFlow(draft.offerType);
  const isShoppingLane = isOfertaLocalShoppingSpecialsLane(draft);
  const isCouponsLane = isOfertaLocalLocalCouponsLane(draft);
  const primaryFormat = inferPrimaryAdFormatFromDraft(draft);
  const basePriceMonthly = getOfertaLocalApplicationBasePriceMonthly(draft);
  const estimatedMonthlyTotal =
    basePriceMonthly != null
      ? basePriceMonthly +
        (draft.wantsAiSearchableSpecials ? OFERTAS_LOCALES_AI_PRODUCT_SEARCH_ADDON_DISPLAY_MONTHLY : 0)
      : null;
  const emailMalformed =
    draft.email.trim().length > 0 && !isOfertaLocalEmailFormatValid(draft.email);
  const step7ConfirmationsComplete = useMemo(() => {
    if (emailMalformed) return false;
    const base =
      step7Confirmations.businessInfo &&
      step7Confirmations.filesDates &&
      step7Confirmations.leonixRules;
    if (draft.wantsAiSearchableSpecials) {
      return base && step7Confirmations.aiItems;
    }
    return base;
  }, [draft.wantsAiSearchableSpecials, emailMalformed, step7Confirmations]);

  const savedLabel = formatSavedAt(lastSavedAt, lang);
  const addressAccepted = hasOfertaLocalAddressAccepted(draft);
  const websiteUrlAccepted = hasOfertaLocalUrlAccepted(draft.websiteUrl);
  const membershipUrlAccepted = hasOfertaLocalUrlAccepted(draft.membershipUrl);
  const digitalCouponUrlAccepted = hasOfertaLocalUrlAccepted(draft.digitalCouponUrl);

  const stepMeta = OFERTAS_LOCALES_WIZARD_STEPS[step - 1];
  const stepHints = useMemo(() => getOfertasLocalesWizardStepHints(step, draft, lang), [step, draft, lang]);
  const progressLabel =
    lang === "en"
      ? `Step ${step} of ${OFERTAS_LOCALES_WIZARD_STEP_COUNT}`
      : `Paso ${step} de ${OFERTAS_LOCALES_WIZARD_STEP_COUNT}`;

  useEffect(() => {
    if (!draft.membershipCtaLabel.trim()) {
      updateDraft({
        membershipCtaLabel: OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS.signUpBeforeYouGoEs,
      });
    }
  }, [draft.membershipCtaLabel, updateDraft]);

  const handleUrlBlur = useCallback(
    (
      field:
        | "websiteUrl"
        | "membershipUrl"
        | "digitalCouponUrl"
        | "facebookUrl"
        | "instagramUrl"
        | "tiktokUrl"
        | "youtubeUrl"
        | "xTwitterUrl"
        | "linkedinUrl"
        | "snapchatUrl"
        | "pinterestUrl"
        | "googleBusinessUrl"
        | "googleReviewUrl"
        | "yelpUrl"
    ) => {
      const raw = draft[field].trim();
      if (!raw) return;
      const normalized = normalizeOfertaLocalUrlInput(raw);
      if (normalized) updateDraft({ [field]: normalized });
    },
    [draft, updateDraft]
  );

  const handleSaveDraft = useCallback(() => {
    saveOfertaLocalDraftToStorage(draft);
  }, [draft]);

  const handleSubmitForReview = useCallback(async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      saveOfertaLocalDraftToStorage(draft);
      const result = await submitOfertaLocalDraftForReview(draft, {
        ofertaLocalId: aiReviewGate.activeSourceAssetId ? effectiveOfertaLocalId ?? null : null,
        scanJobId: aiReviewGate.activeScanJobId,
      });
      if (!result.ok) {
        const msg =
          result.issues?.map((i) => i.message).join(" ") ||
          result.detail ||
          result.error ||
          c.submitFailed;
        setSubmitError(msg);
        return;
      }
      setSubmitSuccess({ id: result.id, status: result.status });
      setAiScanRecordId(result.id);
    } catch {
      setSubmitError(c.submitFailed);
    } finally {
      setSubmitting(false);
    }
  }, [aiReviewGate.activeScanJobId, aiReviewGate.activeSourceAssetId, c.submitFailed, draft, effectiveOfertaLocalId]);

  const goNext = useCallback(() => {
    if (step === 5) {
      const hasPending =
        step5PendingFileCount > 0 || ofertaLocalDraftHasUnuploadedAssetMetadata(draft);
      const hasAiReviewPending = aiReviewGate.totalItems > 0 && aiReviewGate.needsReviewCount > 0;
      if (hasPending || hasAiReviewPending) return;
    }
    setStep((s) => clampWizardStep(s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [aiReviewGate.needsReviewCount, aiReviewGate.totalItems, draft, step, step5PendingFileCount]);

  const step5UploadBlocksContinue = useMemo(() => {
    if (step !== 5) return false;
    return step5PendingFileCount > 0 || ofertaLocalDraftHasUnuploadedAssetMetadata(draft);
  }, [draft, step, step5PendingFileCount]);

  const step5HasBlockingWork = useMemo(() => {
    const uploadBlocked = step5PendingFileCount > 0 || ofertaLocalDraftHasUnuploadedAssetMetadata(draft);
    const aiReviewBlocked = aiReviewGate.totalItems > 0 && aiReviewGate.needsReviewCount > 0;
    return uploadBlocked || aiReviewBlocked;
  }, [aiReviewGate.needsReviewCount, aiReviewGate.totalItems, draft, step5PendingFileCount]);

  const step5BlocksContinue = useMemo(() => {
    if (step !== 5) return false;
    return step5HasBlockingWork;
  }, [step, step5HasBlockingWork]);

  const step5AiReviewBlocksContinue =
    step === 5 && aiReviewGate.totalItems > 0 && aiReviewGate.needsReviewCount > 0;

  const step5AiReviewBlockMessage =
    lang === "en"
      ? `Finish reviewing the AI suggestions before continuing. You still have ${aiReviewGate.needsReviewCount} item(s) that need review.`
      : `Termina de revisar las sugerencias de AI antes de continuar. Todavía tienes ${aiReviewGate.needsReviewCount} producto(s) pendientes de revisión.`;

  const step5PendingBySectionRef = useRef<Map<string, number>>(new Map());

  const reportStep5SectionPending = useCallback((sectionKey: string, count: number) => {
    step5PendingBySectionRef.current.set(sectionKey, count);
    const total = [...step5PendingBySectionRef.current.values()].reduce((sum, n) => sum + n, 0);
    setStep5PendingFileCount(total);
  }, []);

  useEffect(() => {
    if (step !== 5) {
      step5PendingBySectionRef.current.clear();
      setStep5PendingFileCount(0);
    }
  }, [step]);

  const goBack = useCallback(() => {
    setStep((s) => clampWizardStep(s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const previewHref = `/publicar/ofertas-locales/preview?lang=${lang}`;

  if (!hasLoadedDraft) {
    return (
      <div className={cx("min-h-screen", PAGE_BG)}>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-[#1E1814]/60">
          {lang === "en" ? "Loading draft…" : "Cargando borrador…"}
        </div>
      </div>
    );
  }

  function renderStepHints() {
    if (step === 7 || stepHints.length === 0) return null;
    return (
      <ul className={cx(HINT_BOX, "mb-4 space-y-1")}>
        {stepHints.map((hint) => (
          <li key={hint}>· {hint}</li>
        ))}
      </ul>
    );
  }

  function renderStepContent() {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-[#1E1814]">{c.step1PrimaryFormatQuestion}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {OFERTAS_LOCALES_PRIMARY_AD_FORMAT_OPTIONS.map((lane) => {
                const selected = primaryFormat === lane.value;
                return (
                  <button
                    key={lane.value}
                    type="button"
                    className={cx(
                      "rounded-2xl border p-5 text-left transition-all",
                      selected
                        ? "border-[#7A1E2C] bg-[#7A1E2C]/5 shadow-sm ring-2 ring-[#7A1E2C]/15"
                        : "border-[#D4C4A8]/80 bg-white hover:border-[#7A1E2C]/35"
                    )}
                    onClick={() => updateDraft(buildPrimaryAdFormatChangePatch(draft, lane.value))}
                  >
                    <p className="text-base font-semibold text-[#1E1814]">
                      {lang === "en" ? lane.titleEn : lane.titleEs}
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#7A1E2C]">
                      {formatUsd(lane.priceDisplayMonthly)}
                      {c.perMonth}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[#1E1814]/70">
                      {lang === "en" ? lane.descriptionEn : lane.descriptionEs}
                    </p>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs text-[#1E1814]/55">{c.flatPricingCopy}</p>

            <button
              type="button"
              className={cx(
                "w-full rounded-2xl border p-5 text-left transition-all",
                draft.wantsAiSearchableSpecials
                  ? "border-[#7A1E2C] bg-[#7A1E2C]/5 ring-2 ring-[#7A1E2C]/15"
                  : "border-[#D4C4A8]/80 bg-white hover:border-[#7A1E2C]/35"
              )}
              onClick={() =>
                updateDraft({ wantsAiSearchableSpecials: !draft.wantsAiSearchableSpecials })
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[#1E1814]">{c.aiProductSearchTitle}</p>
                  <p className="mt-1 text-lg font-bold text-[#7A1E2C]">{c.aiProductSearchPrice}</p>
                </div>
                <span
                  className={cx(
                    "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs",
                    draft.wantsAiSearchableSpecials
                      ? "border-[#7A1E2C] bg-[#7A1E2C] text-white"
                      : "border-[#D4C4A8] bg-white"
                  )}
                >
                  {draft.wantsAiSearchableSpecials ? "✓" : ""}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#1E1814]/75">
                {isShoppingLane
                  ? c.aiShoppingLaneBody
                  : isCouponsLane
                    ? c.aiCouponsLaneBody
                    : c.aiProductSearchBody}
              </p>
            </button>

            <div className={CALLOUT}>
              <p className="font-semibold text-[#7A1E2C]">{c.step1MoreExposureTitle}</p>
              <p className="mt-1 text-xs leading-relaxed">{c.step1MoreExposureBody}</p>
              <Link
                href={contactMoreExposureHref}
                className="mt-3 inline-flex text-xs font-semibold text-[#7A1E2C] underline"
              >
                {c.step1MoreExposureCta}
              </Link>
            </div>
          </div>
        );

      case 2: {
        const subtypeOptions = getSubtypeOptionsForBusinessCategory(draft.businessCategory);
        const showSubtypeDropdown = businessCategoryShowsSubtypeDropdown(draft.businessCategory);
        const showOtherBusinessInput = businessCategoryUsesCustomTypeText(draft.businessCategory);
        const subtypeLabel = getSubtypeLabelForBusinessCategory(draft.businessCategory, lang);
        return (
          <div className="space-y-4">
            <FieldBlock label={lang === "en" ? "Business category" : "Categoría del negocio"}>
              <select
                className={INPUT}
                value={draft.businessCategory}
                onChange={(e) => {
                  const next = e.target.value as OfertaLocalBusinessCategory | "";
                  updateDraft(buildBusinessCategoryChangePatch(draft, next));
                }}
              >
                <option value="">{c.selectPlaceholder}</option>
                {OFERTAS_LOCALES_BUSINESS_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {lang === "en" ? opt.labelEn : opt.labelEs}
                  </option>
                ))}
              </select>
            </FieldBlock>
            {showSubtypeDropdown ? (
              <FieldBlock label={subtypeLabel} optional optionalLabel={c.optional}>
                <select
                  className={INPUT}
                  value={draft.marketType}
                  onChange={(e) => {
                    const marketType = e.target.value as OfertaLocalMarketType | "";
                    updateDraft({
                      marketType,
                      customMarketType: marketType === "other" ? draft.customMarketType : "",
                    });
                  }}
                >
                  <option value="">{c.selectPlaceholder}</option>
                  {subtypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {lang === "en" ? opt.labelEn : opt.labelEs}
                    </option>
                  ))}
                </select>
              </FieldBlock>
            ) : null}
            {showOtherBusinessInput ? (
              <FieldBlock label={subtypeLabel}>
                <input
                  className={INPUT}
                  value={draft.customMarketType}
                  onChange={(e) => updateDraft({ customMarketType: e.target.value })}
                  placeholder={
                    lang === "en"
                      ? "Example: pet store, classes, repairs, local services"
                      : "Ej. tienda de mascotas, clases, reparación, servicios locales"
                  }
                />
              </FieldBlock>
            ) : null}
            {draft.marketType === "other" && !showOtherBusinessInput ? (
              <FieldBlock label={c.customMarketLabel} helper={c.customMarketHelper}>
                <input
                  className={INPUT}
                  value={draft.customMarketType}
                  onChange={(e) => updateDraft({ customMarketType: e.target.value })}
                />
              </FieldBlock>
            ) : null}
            <FieldBlock label={lang === "en" ? "Business name" : "Nombre del negocio"}>
              <input
                className={INPUT}
                value={draft.businessName}
                onChange={(e) => updateDraft({ businessName: e.target.value })}
                autoComplete="organization"
              />
            </FieldBlock>
            <FieldBlock
              label={
                isCouponsLane
                  ? c.step2PromotionTitleLabel
                  : c.step2OfferTitleLabel
              }
            >
              <input
                className={INPUT}
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
              />
            </FieldBlock>
          </div>
        );
      }

      case 3:
        return (
          <div className="space-y-4">
            {!primaryFormat ? (
              <p className="text-sm text-[#1E1814]/55">
                {lang === "en"
                  ? "Choose your primary format in Step 1 first."
                  : "Elige el formato principal en el Paso 1."}
              </p>
            ) : null}
            {isCouponsLane ? (
              <FieldBlock label={c.promotionSubtypeLabel} optional optionalLabel={c.optional}>
                <select
                  className={INPUT}
                  value={draft.offerType}
                  onChange={(e) =>
                    updateDraft({ offerType: e.target.value as OfertaLocalOfferType })
                  }
                >
                  {OFERTAS_LOCALES_COUPON_PROMOTION_SUBTYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {lang === "en" ? opt.labelEn : opt.labelEs}
                    </option>
                  ))}
                </select>
              </FieldBlock>
            ) : null}
            {isShoppingLane ? (
              <>
                <p className={SECTION_TITLE}>{c.laneShoppingSectionTitle}</p>
                <FieldBlock
                  label={c.laneShoppingFlyerDescriptionLabel}
                  helper={c.laneShoppingFlyerDescriptionHelper}
                  optional
                  optionalLabel={c.optional}
                >
                  <textarea
                    className={cx(INPUT, "min-h-[80px] resize-y")}
                    value={draft.description}
                    onChange={(e) => updateDraft({ description: e.target.value })}
                  />
                </FieldBlock>
              </>
            ) : null}
            {isCouponsLane ? (
              <>
                <p className={SECTION_TITLE}>{c.laneCouponSectionTitle}</p>
                <FieldBlock label={c.laneCouponTextLabel} helper={c.laneCouponTextHelper}>
                  <textarea
                    className={cx(INPUT, "min-h-[80px] resize-y")}
                    value={draft.couponText}
                    onChange={(e) => updateDraft({ couponText: e.target.value })}
                  />
                </FieldBlock>
                <FieldBlock label={c.laneCouponTermsLabel} optional optionalLabel={c.optional}>
                  <textarea
                    className={cx(INPUT, "min-h-[80px] resize-y")}
                    value={draft.description}
                    onChange={(e) => updateDraft({ description: e.target.value })}
                  />
                </FieldBlock>
              </>
            ) : null}
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1E1814]/70">
              {isShoppingLane ? c.laneShoppingSpecialDatesLabel : c.laneCouponValidDatesLabel}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldBlock label={c.validFrom}>
                <input
                  type="date"
                  className={INPUT}
                  value={draft.validFrom}
                  onChange={(e) => updateDraft({ validFrom: e.target.value })}
                />
              </FieldBlock>
              <FieldBlock label={c.validUntil}>
                <input
                  type="date"
                  className={INPUT}
                  value={draft.validUntil}
                  onChange={(e) => updateDraft({ validUntil: e.target.value })}
                />
              </FieldBlock>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#D4C4A8]/80 bg-[#FDF8F0]/90 px-4 py-3 text-sm leading-relaxed text-[#1E1814]/75">
              {c.locationStepIntro}
            </div>
            <FieldBlock
              label={lang === "en" ? "Address" : "Dirección"}
              optional
              optionalLabel={c.optional}
              helper={c.addressHelper}
              confirm={addressAccepted ? c.addressAccepted : undefined}
            >
              <input
                className={INPUT}
                value={draft.address}
                onChange={(e) => updateDraft({ address: e.target.value })}
                autoComplete="street-address"
              />
            </FieldBlock>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldBlock label={c.locationCityLabel} helper={c.cityHelper}>
                <input
                  className={INPUT}
                  value={draft.city}
                  onChange={(e) => updateDraft({ city: e.target.value })}
                  autoComplete="address-level2"
                  list="oferta-local-norcal-city-suggestions"
                  placeholder={lang === "en" ? "Example: San Jose, Toronto, Guadalajara" : "Ej. San José, Toronto, Guadalajara"}
                />
                <datalist id="oferta-local-norcal-city-suggestions">
                  {OFERTA_LOCAL_NORCAL_CITY_SUGGESTIONS.map((cityName) => (
                    <option key={cityName} value={cityName} />
                  ))}
                </datalist>
              </FieldBlock>
              <FieldBlock
                label={c.locationCountryLabel}
              >
                <input
                  className={INPUT}
                  value={draft.country}
                  onChange={(e) => updateDraft({ country: e.target.value })}
                  maxLength={80}
                  autoComplete="country-name"
                  list="oferta-local-country-suggestions"
                  placeholder={c.locationCountryPlaceholder}
                />
                <datalist id="oferta-local-country-suggestions">
                  {OFERTA_LOCAL_COUNTRY_SUGGESTIONS.map((countryName) => (
                    <option key={countryName} value={countryName} />
                  ))}
                </datalist>
              </FieldBlock>
              <FieldBlock
                label={c.locationStateLabel}
                optional
                optionalLabel={c.optional}
              >
                <OfertaLocalRegionStateInput
                  country={draft.country || OFERTA_LOCAL_DEFAULT_COUNTRY}
                  value={draft.state}
                  onChange={(state) => updateDraft({ state })}
                  inputClassName={INPUT}
                  lang={lang}
                  selectPlaceholder={c.selectPlaceholder}
                />
              </FieldBlock>
              <FieldBlock label={c.locationPostalLabel} helper={c.zipHelper}>
                <OfertaLocalPostalInput
                  value={draft.zipCode}
                  onChange={(zipCode) => updateDraft({ zipCode })}
                  inputClassName={INPUT}
                  placeholder={lang === "en" ? "12345, K1A 0B1, 44100" : "12345, K1A 0B1, 44100"}
                />
              </FieldBlock>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldBlock label={lang === "en" ? "Phone" : "Teléfono"}>
                <input
                  className={INPUT}
                  value={draft.phone}
                  onChange={(e) => updateDraft({ phone: formatOfertaLocalPhoneDisplay(e.target.value) })}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(555) 123-4567"
                />
              </FieldBlock>
              <FieldBlock label="WhatsApp" optional optionalLabel={c.optional}>
                <input
                  className={INPUT}
                  value={draft.whatsapp}
                  onChange={(e) => updateDraft({ whatsapp: formatOfertaLocalPhoneDisplay(e.target.value) })}
                  inputMode="tel"
                />
              </FieldBlock>
            </div>
            <FieldBlock
              label={lang === "en" ? "Website" : "Sitio web"}
              optional
              optionalLabel={c.optional}
              confirm={websiteUrlAccepted ? c.urlAccepted : undefined}
            >
              <input
                className={INPUT}
                value={draft.websiteUrl}
                onChange={(e) => updateDraft({ websiteUrl: e.target.value })}
                onBlur={() => handleUrlBlur("websiteUrl")}
                placeholder="https://"
              />
            </FieldBlock>
          </div>
        );

      case 5: {
        const showCompactUploads = collapseUploadForReview && !uploadEditorOpen;
        const assetUploadSections = (
          <>
            {isShoppingLane ? (
              <OfertasLocalesDraftAssetSection
                bucket="flyerAssets"
                draft={draft}
                updateDraft={updateDraft}
                lang={lang}
                sectionMode="primaryMainFlyer"
                sectionTitleOverride={lang === "en" ? "Main flyer" : "Volante principal"}
                sectionHelper={
                  lang === "en"
                    ? "Upload your full weekly flyer. AI product extraction is available when you select the AI add-on."
                    : "Sube tu volante semanal completo. La extracción AI de productos está disponible si seleccionas el complemento AI."
                }
                primaryFlyerMultiPageHelper={c.laneShoppingMainFlyerMultiPageHelper}
                showAiScanFormatsHint={draft.wantsAiSearchableSpecials}
                onPendingUploadsChange={(count) => reportStep5SectionPending("primary-flyer", count)}
              />
            ) : null}
            {isCouponsLane ? (
              <>
                <OfertasLocalesDraftAssetSection
                  bucket="couponAssets"
                  draft={draft}
                  updateDraft={updateDraft}
                  lang={lang}
                  sectionMode="mainCoupons"
                  sectionTitleOverride={c.laneCouponMainAsset}
                  sectionHelper={c.laneCouponMainAssetHelper}
                  showAiScanFormatsHint={draft.wantsAiSearchableSpecials}
                  onPendingUploadsChange={(count) => reportStep5SectionPending("main-coupons", count)}
                />
                <div className="border-t border-[#D4C4A8]/50 pt-4">
                  <OfertasLocalesDraftAssetSection
                    bucket="flyerAssets"
                    draft={draft}
                    updateDraft={updateDraft}
                    lang={lang}
                    sectionMode="additionalPromo"
                    sectionTitleOverride={c.laneCouponAdditionalPromo}
                    showAiScanFormatsHint={draft.wantsAiSearchableSpecials}
                    onPendingUploadsChange={(count) => reportStep5SectionPending("add-promo", count)}
                  />
                </div>
              </>
            ) : null}
          </>
        );
        return (
          <div className="space-y-4">
            {!primaryFormat ? (
              <p className="text-sm text-[#1E1814]/55">
                {lang === "en"
                  ? "Choose your primary format in Step 1 first."
                  : "Elige el formato principal en el Paso 1."}
              </p>
            ) : showCompactUploads ? (
              <OfertasLocalesUploadedFilesSummary
                lang={lang}
                draft={draft}
                onEditFiles={() => setUploadEditorOpen(true)}
              />
            ) : (
              <>
                {!collapseUploadForReview ? (
                  <div className="rounded-xl border border-[#D4C4A8]/80 bg-[#FDF8F0]/90 px-4 py-3 text-sm leading-relaxed text-[#1E1814]/75">
                    <p>{c.step5UploadWeeklyFlyerHint}</p>
                    <p className="mt-2">{c.step5UploadLimitsHint}</p>
                  </div>
                ) : null}
                {assetUploadSections}
                {collapseUploadForReview && uploadEditorOpen ? (
                  <button
                    type="button"
                    className={BTN_SECONDARY}
                    onClick={() => setUploadEditorOpen(false)}
                  >
                    {c.uploadedFilesHideEditor}
                  </button>
                ) : null}
              </>
            )}
            {step5UploadBlocksContinue ? (
              <p className={HINT_BOX}>{c.step5UploadBeforeContinueWarning}</p>
            ) : null}
            {step5AiReviewBlocksContinue ? (
              <p className={ERROR_BOX}>{step5AiReviewBlockMessage}</p>
            ) : null}
            {draft.wantsAiSearchableSpecials ? (
              <>
                <OfertasLocalesAiScanPanel
                  draft={draft}
                  lang={lang}
                  ofertaLocalId={effectiveOfertaLocalId}
                  signedIn={signedIn}
                  onScanStarted={handleScanStarted}
                  onScanComplete={handleScanComplete}
                  onScanFinished={handleScanFinished}
                  onOfertaLocalIdChange={handleAiScanRecordId}
                />
                {!showFullWidthReviewDesk ? (
                  <OfertasLocalesClickableItemPreviewPanel
                    lang={lang}
                    ofertaLocalId={effectiveOfertaLocalId}
                    scanJobId={lastScanJobId}
                    draft={draft}
                  />
                ) : null}
              </>
            ) : null}
            <div className="rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1E1814]/55">
                {lang === "en" ? "Need to start over?" : "¿Necesitas empezar de nuevo?"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#1E1814]/65">{c.startOverDeviceWarning}</p>
              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-800 hover:bg-red-50 sm:w-auto"
                onClick={handleStartFresh}
              >
                {lang === "en" ? "Delete this application and start over" : "Borrar esta solicitud y empezar de nuevo"}
              </button>
            </div>
          </div>
        );
      }

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-4 rounded-xl border border-[#D4C4A8]/50 bg-white p-4">
              <div>
                <p className="text-sm font-semibold text-[#1E1814]">{c.socialSectionTitle}</p>
                <p className="mt-1 text-xs font-medium text-[#7A1E2C]">{c.socialSectionSubtitle}</p>
                <p className={cx(HELPER, "mt-2")}>{c.socialSectionHelper}</p>
                <p className="mt-2 text-xs leading-relaxed text-[#1E1814]/60">
                  {c.socialLinksVisibilityHelper}
                </p>
              </div>
              <FieldBlock
                label={c.socialEmail}
                optional
                optionalLabel={c.optional}
                confirm={resolveOfertaLocalContactEmail(draft) ? c.urlAccepted : undefined}
                helper={emailMalformed ? c.socialEmailInvalid : undefined}
              >
                <input
                  className={INPUT}
                  type="email"
                  value={draft.email}
                  onChange={(e) =>
                    updateDraft({ email: normalizeOfertaLocalEmailInput(e.target.value) })
                  }
                  placeholder={lang === "en" ? "hello@business.com" : "hola@negocio.com"}
                  inputMode="email"
                  autoComplete="email"
                />
              </FieldBlock>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["facebookUrl", c.socialFacebook],
                    ["instagramUrl", c.socialInstagram],
                    ["tiktokUrl", c.socialTiktok],
                    ["youtubeUrl", c.socialYoutube],
                    ["xTwitterUrl", c.socialXTwitter],
                    ["linkedinUrl", c.socialLinkedin],
                    ["snapchatUrl", c.socialSnapchat],
                    ["pinterestUrl", c.socialPinterest],
                    ["googleBusinessUrl", c.socialGoogleBusiness],
                    ["googleReviewUrl", c.socialGoogleReview],
                    ["yelpUrl", c.socialYelp],
                  ] as const
                ).map(([field, label]) => (
                  <FieldBlock
                    key={field}
                    label={label}
                    optional
                    optionalLabel={c.optional}
                    confirm={hasOfertaLocalUrlAccepted(draft[field]) ? c.urlAccepted : undefined}
                  >
                    <input
                      className={INPUT}
                      value={draft[field]}
                      onChange={(e) => updateDraft({ [field]: e.target.value })}
                      onBlur={() => handleUrlBlur(field)}
                      placeholder="https://…"
                    />
                  </FieldBlock>
                ))}
              </div>
            </div>

            {isShoppingLane ? (
              <div className="space-y-4 rounded-xl border border-[#D4C4A8]/50 bg-white p-4">
                <p className="text-sm font-semibold text-[#1E1814]">{c.membershipSectionTitle}</p>
                <p className="text-xs leading-relaxed text-[#1E1814]/65">{c.membershipSectionPurpose}</p>
                <p className="text-xs leading-relaxed text-[#1E1814]/55">{c.membershipTrafficCopy}</p>
                <label className="flex items-center gap-2 text-sm text-[#1E1814]">
                  <input
                    type="checkbox"
                    checked={draft.requiresMembershipForDeals}
                    onChange={(e) => updateDraft({ requiresMembershipForDeals: e.target.checked })}
                    className="rounded border-[#D4C4A8] text-[#7A1E2C] focus:ring-[#7A1E2C]/30"
                  />
                  {lang === "en"
                    ? "Offers require membership or rewards account"
                    : "Las ofertas requieren membresía o cuenta de recompensas"}
                </label>
                <FieldBlock
                  label={lang === "en" ? "Membership / rewards URL" : "URL de membresía / recompensas"}
                  optional
                  optionalLabel={c.optional}
                  confirm={membershipUrlAccepted ? c.urlAccepted : undefined}
                >
                  <input
                    className={INPUT}
                    value={draft.membershipUrl}
                    onChange={(e) => updateDraft({ membershipUrl: e.target.value })}
                    onBlur={() => handleUrlBlur("membershipUrl")}
                  />
                </FieldBlock>
                <FieldBlock
                  label={c.membershipCustomerInstructionLabel}
                  optional
                  optionalLabel={c.optional}
                >
                  <textarea
                    className={cx(INPUT, "min-h-[60px] resize-y")}
                    value={draft.membershipNote}
                    onChange={(e) => updateDraft({ membershipNote: e.target.value })}
                  />
                </FieldBlock>
              </div>
            ) : null}

            {isCouponsLane ? (
              <div className="space-y-4 rounded-xl border border-[#D4C4A8]/50 bg-white p-4">
                <p className="text-sm font-semibold text-[#1E1814]">
                  {lang === "en" ? "Digital coupon" : "Cupón digital"}
                </p>
                <FieldBlock
                  label={lang === "en" ? "Digital coupon URL" : "URL de cupón digital"}
                  optional
                  optionalLabel={c.optional}
                  confirm={digitalCouponUrlAccepted ? c.urlAccepted : undefined}
                >
                  <input
                    className={INPUT}
                    value={draft.digitalCouponUrl}
                    onChange={(e) => updateDraft({ digitalCouponUrl: e.target.value })}
                    onBlur={() => handleUrlBlur("digitalCouponUrl")}
                  />
                </FieldBlock>
                <FieldBlock
                  label={c.digitalCouponCustomerInstructionLabel}
                  optional
                  optionalLabel={c.optional}
                >
                  <textarea
                    className={cx(INPUT, "min-h-[60px] resize-y")}
                    value={draft.digitalCouponNote}
                    onChange={(e) => updateDraft({ digitalCouponNote: e.target.value })}
                  />
                </FieldBlock>
              </div>
            ) : null}

            {false ? (
            <div className="space-y-4 rounded-xl border border-[#D4C4A8]/50 bg-white p-4">
              <p className="text-sm font-medium text-[#1E1814]">{c.featuredSectionTitle}</p>
              <p className={HELPER}>{c.featuredQuestion}</p>
              <label className="flex items-start gap-2 text-sm text-[#1E1814]">
                <input
                  type="checkbox"
                  checked={draft.wantsFeaturedPlacement}
                  onChange={(e) =>
                    updateDraft({
                      wantsFeaturedPlacement: e.target.checked,
                      isFeaturedRequested: e.target.checked,
                      featuredPlacementScope: e.target.checked ? draft.featuredPlacementScope : "none",
                    })
                  }
                  className="mt-1 rounded border-[#D4C4A8] text-[#7A1E2C] focus:ring-[#7A1E2C]/30"
                />
                <span className="font-medium">{c.featuredCheckbox}</span>
              </label>
              {draft.wantsFeaturedPlacement ? (
                <FieldBlock label={c.featuredScopeLabel} optional optionalLabel={c.optional}>
                  <select
                    className={INPUT}
                    value={draft.featuredPlacementScope === "none" ? "" : draft.featuredPlacementScope}
                    onChange={(e) =>
                      updateDraft({
                        featuredPlacementScope: (e.target.value ||
                          "none") as typeof draft.featuredPlacementScope,
                      })
                    }
                  >
                    <option value="">{c.selectPlaceholder}</option>
                    {OFERTAS_LOCALES_FEATURED_PLACEMENT_SCOPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {lang === "en" ? opt.labelEn : opt.labelEs}
                      </option>
                    ))}
                  </select>
                </FieldBlock>
              ) : null}
            </div>
            ) : null}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0]/90 px-4 py-4">
              <h3 className="text-base font-semibold text-[#1E1814]">{c.step7FinalReviewTitle}</h3>
              {submitSuccess ? (
                <div className="mt-3 rounded-lg border border-emerald-300/80 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  <p className="font-semibold">{c.submitSuccessTitle}</p>
                  <p className="mt-1 text-xs">{c.submitSuccessBody}</p>
                  <p className="mt-2 text-xs text-emerald-900/85">{c.submitNotPublicUntilReview}</p>
                </div>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-[#1E1814]/70">{c.submitNotPublicUntilReview}</p>
              )}
            </div>
            {submitError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {submitError}
              </p>
            ) : null}

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1E1814]/70">
                {c.pricingSectionTitle}
              </h3>
              <div className="mt-3 space-y-2">
                {basePriceMonthly != null && draft.offerType ? (
                  <div className="rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-3 text-sm">
                    <p className="font-medium text-[#1E1814]">
                      {getOfertaLocalProductDisplayLabel(draft, lang)}
                    </p>
                    <p className="mt-1 text-xs text-[#1E1814]/75">
                      {formatUsd(basePriceMonthly)}
                      {c.perMonth}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#1E1814]/55">
                    {lang === "en" ? "Select a product in Step 1." : "Elige un producto en el Paso 1."}
                  </p>
                )}
                {draft.wantsAiSearchableSpecials ? (
                  <div className="rounded-xl border border-[#7A1E2C]/25 bg-[#7A1E2C]/5 px-4 py-3 text-sm">
                    <p className="font-medium text-[#1E1814]">{c.aiProductSearchTitle}</p>
                    <p className="mt-1 text-xs text-[#1E1814]/75">
                      +{formatUsd(OFERTAS_LOCALES_AI_PRODUCT_SEARCH_ADDON_DISPLAY_MONTHLY)}
                      {c.perMonth}
                    </p>
                  </div>
                ) : null}
                {estimatedMonthlyTotal != null ? (
                  <div className="rounded-xl border border-[#7A1E2C]/30 bg-white px-4 py-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#1E1814]/60">
                      {c.step7EstimatedTotal}
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#7A1E2C]">
                      {formatUsd(estimatedMonthlyTotal)}
                      {c.perMonth}
                    </p>
                  </div>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-[#1E1814]/55">{c.flatPricingCopy}</p>
              <p className="mt-2 text-xs text-[#1E1814]/55">{c.publishNotBuilt}</p>
            </div>

            {draft.wantsAiSearchableSpecials && hasExistingAiScan ? (
              <div className="rounded-xl border border-[#7A1E2C]/25 bg-[#7A1E2C]/5 px-4 py-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#7A1E2C]">
                  {c.step7ScanSummaryTitle}
                </h3>
                <ul className="mt-3 space-y-1.5 text-sm text-[#1E1814]">
                  <li>{formatOfertaLocalCopyTemplate(c.step7ScanSummaryTotal, { total: aiReviewGate.totalItems })}</li>
                  <li>{formatOfertaLocalCopyTemplate(c.step7ScanSummaryApproved, { approved: aiReviewGate.approvedCount })}</li>
                  <li>
                    {formatOfertaLocalCopyTemplate(c.step7ScanSummaryReviewLater, {
                      reviewLater: aiReviewGate.reviewLaterCount,
                    })}
                  </li>
                  <li>{formatOfertaLocalCopyTemplate(c.step7ScanSummaryRejected, { rejected: aiReviewGate.rejectedCount })}</li>
                  <li>
                    {formatOfertaLocalCopyTemplate(c.step7ScanSummaryRemaining, {
                      remaining: aiReviewGate.needsReviewCount,
                    })}
                  </li>
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className={BTN_PRIMARY} onClick={() => setStep(5)}>
                    {c.step7ContinueReviewing}
                  </button>
                  {aiReviewGate.needsReviewCount > 0 ? (
                    <button type="button" className={BTN_SECONDARY} onClick={() => setStep(5)}>
                      {c.step7ReviewLaterItems}
                    </button>
                  ) : null}
                  {aiReviewGate.rejectedCount > 0 ? (
                    <button type="button" className={BTN_SECONDARY} onClick={() => setStep(5)}>
                      {c.step7ReviewRejectedItems}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {draft.wantsAiSearchableSpecials ? (
              hasExistingAiScan ? (
                <details className="rounded-xl border border-amber-200/80 bg-amber-50/40 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold text-amber-950">
                    {c.step7RescanSectionTitle}
                  </summary>
                  <p className="mt-2 text-xs leading-relaxed text-amber-950/80">{c.step7RescanWarning}</p>
                  <div className="mt-4">
                    <OfertasLocalesAiScanPanel
                      draft={draft}
                      lang={lang}
                      ofertaLocalId={effectiveOfertaLocalId}
                      signedIn={signedIn}
                      onScanStarted={handleScanStarted}
                      onScanComplete={handleScanComplete}
                      onScanFinished={handleScanFinished}
                      onOfertaLocalIdChange={handleAiScanRecordId}
                    />
                  </div>
                </details>
              ) : (
                <>
                  <OfertasLocalesAiScanPanel
                    draft={draft}
                    lang={lang}
                    ofertaLocalId={effectiveOfertaLocalId}
                    signedIn={signedIn}
                    onScanStarted={handleScanStarted}
                    onScanComplete={handleScanComplete}
                    onScanFinished={handleScanFinished}
                    onOfertaLocalIdChange={handleAiScanRecordId}
                  />
                  {!showFullWidthReviewDesk ? (
                    <OfertasLocalesClickableItemPreviewPanel
                      lang={lang}
                      ofertaLocalId={effectiveOfertaLocalId}
                      scanJobId={lastScanJobId}
                      draft={draft}
                    />
                  ) : null}
                </>
              )
            ) : null}

            <OfertasLocalesValidationPanel
              previewIssues={previewIssues}
              publishIssues={publishIssues}
              previewReady={previewReady}
              publishFieldsReady={publishFieldsReady}
              lang={lang}
            />

            <div className="space-y-3 rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-4">
              <p className="text-sm font-semibold text-[#1E1814]">
                {lang === "en" ? "Confirm before preview" : "Confirma antes de la vista previa"}
              </p>
              <label className="flex items-start gap-3 text-sm text-[#1E1814]">
                <input
                  type="checkbox"
                  checked={step7Confirmations.businessInfo}
                  onChange={(e) =>
                    setStep7Confirmations((prev) => ({ ...prev, businessInfo: e.target.checked }))
                  }
                  className="mt-1 rounded border-[#D4C4A8] text-[#7A1E2C] focus:ring-[#7A1E2C]/30"
                />
                <span>{c.step7ConfirmBusiness}</span>
              </label>
              <label className="flex items-start gap-3 text-sm text-[#1E1814]">
                <input
                  type="checkbox"
                  checked={step7Confirmations.filesDates}
                  onChange={(e) =>
                    setStep7Confirmations((prev) => ({ ...prev, filesDates: e.target.checked }))
                  }
                  className="mt-1 rounded border-[#D4C4A8] text-[#7A1E2C] focus:ring-[#7A1E2C]/30"
                />
                <span>{c.step7ConfirmFiles}</span>
              </label>
              {draft.wantsAiSearchableSpecials ? (
                <label className="flex items-start gap-3 text-sm text-[#1E1814]">
                  <input
                    type="checkbox"
                    checked={step7Confirmations.aiItems}
                    onChange={(e) =>
                      setStep7Confirmations((prev) => ({ ...prev, aiItems: e.target.checked }))
                    }
                    className="mt-1 rounded border-[#D4C4A8] text-[#7A1E2C] focus:ring-[#7A1E2C]/30"
                  />
                  <span>{c.step7ConfirmAi}</span>
                </label>
              ) : null}
              <label className="flex items-start gap-3 text-sm text-[#1E1814]">
                <input
                  type="checkbox"
                  checked={step7Confirmations.leonixRules}
                  onChange={(e) =>
                    setStep7Confirmations((prev) => ({ ...prev, leonixRules: e.target.checked }))
                  }
                  className="mt-1 rounded border-[#D4C4A8] text-[#7A1E2C] focus:ring-[#7A1E2C]/30"
                />
                <span>{c.step7ConfirmRules}</span>
              </label>
              {!step7ConfirmationsComplete ? (
                <p className="text-xs text-[#1E1814]/60">{c.step7PreviewGatedHelper}</p>
              ) : null}
              {draft.wantsAiSearchableSpecials && aiReviewGate.needsReviewCount > 0 ? (
                <p className="text-xs font-medium text-amber-900">{c.step7AiIncompleteHelper}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" className={BTN_SECONDARY} onClick={handleSaveDraft}>
                {c.saveDraft}
              </button>
              {step7ConfirmationsComplete ? (
                <Link href={previewHref} className={BTN_PRIMARY}>
                  {c.previewLink}
                </Link>
              ) : (
                <span
                  className={cx(BTN_PRIMARY, "cursor-not-allowed opacity-45")}
                  aria-disabled="true"
                  title={c.step7PreviewGatedHelper}
                >
                  {c.previewLink}
                </span>
              )}
              <button
                type="button"
                className={BTN_PRIMARY}
                disabled={
                  !publishFieldsReady ||
                  submitting ||
                  (draft.wantsAiSearchableSpecials && aiReviewGate.needsReviewCount > 0)
                }
                onClick={() => void handleSubmitForReview()}
              >
                {submitting ? c.submittingForReview : c.submitForReview}
              </button>
            </div>

            <div className="rounded-xl border border-red-200/80 bg-red-50/40 px-4 py-4">
              <p className="text-sm font-semibold text-red-900">{c.step7DeleteStartOverTitle}</p>
              <p className="mt-2 text-xs leading-relaxed text-red-900/80">{c.startOverDeviceWarning}</p>
              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-800 hover:bg-red-50 sm:w-auto"
                onClick={handleStartFresh}
              >
                {lang === "en"
                  ? "Delete this application and start over"
                  : "Borrar esta solicitud y empezar de nuevo"}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className={cx("min-h-screen", PAGE_BG)}>
      <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 lg:pb-16">
        <header className="mb-6 border-b border-[#D4C4A8]/60 pb-6 lg:mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A1E2C]">
            Leonix · {OFERTAS_LOCALES_PRODUCT_NAME}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#1E1814] sm:text-3xl">{c.pageTitle}</h1>
          {step === 1 ? (
            <>
              <p className="mt-2 text-sm text-[#1E1814]/75">{c.pageSubtitle}</p>
              <p className="mt-2 text-sm font-medium text-[#7A1E2C]">{c.digitalFirstTagline}</p>
              <ul className="mt-3 space-y-1 text-xs text-[#1E1814]/65">
                {OFERTAS_LOCALES_DIGITAL_FIRST_VALUE_PROPS.slice(0, 3).map((prop) => (
                  <li key={prop}>· {prop}</li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="mt-3 rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-3 py-2 text-xs text-[#1E1814]/70">
            {c.scaffoldNotice}
            {savedLabel ? ` · ${c.draftSaved} (${savedLabel})` : null}
          </p>
        </header>

        <div className="lg:flex lg:items-start lg:gap-10">
          <aside className="lg:w-52 lg:shrink-0">
            <OfertasLocalesWizardProgress
              currentStep={step}
              lang={lang}
              progressLabel={progressLabel}
              onStepClick={(s) => {
                if (step === 5 && s > 5 && step5HasBlockingWork) return;
                setStep(s);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-4 hidden lg:block">
              <p className="text-xs font-medium uppercase tracking-wide text-[#1E1814]/50">
                {progressLabel}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#1E1814]">
                {wizardStepTitle(stepMeta, lang)}
              </h2>
            </div>

            <section className={cx(CARD, "p-5 sm:p-6")}>
              <h2 className={cx(SECTION_TITLE, "lg:sr-only")}>{wizardStepTitle(stepMeta, lang)}</h2>
              <div className="mt-4">
                {renderStepHints()}
                {renderStepContent()}
              </div>

              {step < 7 ? (
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#D4C4A8]/50 pt-6">
                  <button
                    type="button"
                    className={BTN_SECONDARY}
                    onClick={goBack}
                    disabled={step <= 1}
                  >
                    {c.wizardBack}
                  </button>
                  <button
                    type="button"
                    className={BTN_PRIMARY}
                    onClick={goNext}
                    disabled={step5BlocksContinue}
                  >
                    {c.wizardNext}
                  </button>
                </div>
              ) : (
                <div className="mt-8 border-t border-[#D4C4A8]/50 pt-6">
                  <button type="button" className={BTN_SECONDARY} onClick={goBack}>
                    {c.wizardBack}
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        <span className="sr-only" aria-hidden>
          {draft.membershipCtaLabel}
          {String(draft.isMagazinePickupPartner)}
          {draft.magazineDistributionStatus}
          {draft.magazinePickupNotes}
          {draft.magazineMonthlyDropEstimate}
        </span>
      </div>

      {showFullWidthReviewDesk ? (
        <section
          aria-label={lang === "en" ? "AI scan review desk" : "Mesa de revisión de escaneo AI"}
          className="border-t border-[#D4C4A8]/70 bg-[#FAF6F0] px-4 py-8 sm:px-6 lg:py-10"
        >
          <div className="mx-auto w-full max-w-[min(100vw-2rem,1600px)]">
            <OfertasLocalesAiScanReviewWorkspace
              lang={lang}
              draft={draft}
              ofertaLocalId={effectiveOfertaLocalId}
              lastScanJobId={lastScanJobId}
              scanPollingActive={scanPollingActive}
              scanRefreshToken={scanRefreshToken}
              reviewMode={isCouponsLane ? "coupon" : "weekly"}
              onReviewGateChange={handleAiReviewGateChange}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
