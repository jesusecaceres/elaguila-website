"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  hasOfertaLocalAddressAccepted,
  hasOfertaLocalUrlAccepted,
  isOfertaLocalAiIncludedInPackage,
  isOfertaLocalEmailFormatValid,
  normalizeOfertaLocalEmailInput,
  resolveOfertaLocalContactEmail,
} from "@/app/lib/ofertas-locales/ofertasLocalesApplicationHelpers";
import {
  OFERTAS_LOCALES_BUSINESS_CATEGORY_OPTIONS,
  OFERTAS_LOCALES_COUPON_PROMOTION_SUBTYPE_OPTIONS,
  OFERTAS_LOCALES_DIGITAL_FIRST_VALUE_PROPS,
  OFERTAS_LOCALES_FEATURED_PLACEMENT_SCOPE_OPTIONS,
  OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS,
  OFERTAS_LOCALES_PRODUCT_NAME,
  OFERTAS_LOCALES_PUBLISH_PRODUCT_CATALOG,
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
import {
  loadOfertaLocalSubmissionSession,
  loadOfertaLocalWizardStep,
  sanitizeAssetList,
  saveOfertaLocalWizardStep,
} from "@/app/lib/ofertas-locales/ofertasLocalesDraftPersistence";
import { uploadOfertaLocalDraftAsset } from "@/app/lib/ofertas-locales/ofertasLocalesAssetUpload";
import { validateOfertaLocalClientAssetFile } from "@/app/lib/ofertas-locales/ofertasLocalesClientUploadValidation";
import { getOfertaLocalBusinessLogoUrl } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import {
  clearOfertaLocalAiScanSession,
  loadOfertaLocalAiScanSession,
  saveOfertaLocalAiScanSession,
} from "@/app/lib/ofertas-locales/ofertasLocalesAiScanRecordPersistence";
import { validateOfertaLocalDraftForServerPublish } from "@/app/lib/ofertas-locales/ofertasLocalesPublishMapper";
import { fetchOfertaLocalReviewItems } from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewClient";
import { summarizeScopedItemReviewCounts } from "@/app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type {
  OfertaLocalBusinessCategory,
  OfertaLocalDraft,
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { normalizeLang } from "@/app/lib/language";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { publicContactHref } from "@/app/lib/leonix/publicRouteHrefs";
import { useOfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { useOfertasLocalesDraft } from "@/app/lib/ofertas-locales/useOfertasLocalesDraft";
import { validateOfertaLocalDraftForPreview } from "@/app/lib/ofertas-locales/ofertasLocalesValidation";
import { OfertasLocalesAiScanReviewWorkspace } from "./OfertasLocalesAiScanReviewWorkspace";
import { OfertasLocalesAiScanPanel } from "./OfertasLocalesAiScanPanel";
import { OfertasLocalesCommercialSummary } from "./OfertasLocalesCommercialSummary";
import { OfertasLocalesDraftAssetSection } from "./OfertasLocalesDraftAssetSection";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";
import { OfertasLocalesValidationPanel } from "./OfertasLocalesValidationPanel";
import {
  ofertaLocalDraftHasUnuploadedAssetMetadata,
  splitOfertaLocalPrimaryFlyerAssets,
} from "@/app/lib/ofertas-locales/ofertasLocalesStep5AssetLayout";
import {
  activeOfertaLocalDraftAssets,
  assetHasExternalUrlReady,
  assetHasUploadedWithUrl,
} from "@/app/lib/ofertas-locales/ofertasLocalesDraftAssetHelpers";
import { OfertasLocalesWizardProgress } from "./OfertasLocalesWizardProgress";
import type { OfertaLocalAiReviewGateState } from "./OfertasLocalesAiItemReviewPanel";

function formatOfertaLocalCopyTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

type Step5CheckpointCardProps = {
  title: string;
  isOpen: boolean;
  isLocked: boolean;
  isComplete: boolean;
  lockMessage?: string;
  summary?: ReactNode;
  collapsedActions?: ReactNode;
  onToggle?: () => void;
  children?: ReactNode;
};

function Step5CheckpointCard({
  title,
  isOpen,
  isLocked,
  isComplete,
  lockMessage,
  summary,
  collapsedActions,
  onToggle,
  children,
}: Step5CheckpointCardProps) {
  return (
    <div
      className={cx(
        "overflow-hidden rounded-xl border shadow-sm",
        isLocked ? "border-[#D4C4A8]/50 bg-[#FDF8F0]/60" : "border-[#D4C4A8]/70 bg-white",
        isComplete && !isOpen ? "bg-[#FDF8F0]/90" : ""
      )}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        onClick={onToggle}
        disabled={isLocked && !isComplete}
        aria-expanded={isOpen}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#1E1814]">{title}</span>
          {!isOpen && summary ? (
            <span className="mt-1 block text-xs leading-relaxed text-[#1E1814]/65">{summary}</span>
          ) : null}
          {isLocked && lockMessage ? (
            <span className="mt-1 block text-xs text-[#1E1814]/55">{lockMessage}</span>
          ) : null}
        </span>
        <span
          className={cx(
            "shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
            isComplete
              ? "border-emerald-300/80 bg-emerald-50 text-emerald-900"
              : isLocked
                ? "border-[#D4C4A8] bg-white text-[#1E1814]/45"
                : isOpen
                  ? "border-[#7A1E2C]/30 bg-[#7A1E2C]/5 text-[#7A1E2C]"
                  : "border-[#D4C4A8] bg-[#FDF8F0] text-[#1E1814]/55"
          )}
        >
          {isComplete ? "✓" : isLocked ? "—" : isOpen ? "●" : "○"}
        </span>
      </button>
      {isOpen && !isLocked ? <div className="border-t border-[#D4C4A8]/50 px-4 py-4">{children}</div> : null}
      {!isOpen && !isLocked && collapsedActions ? (
        <div className="flex flex-wrap gap-2 border-t border-[#D4C4A8]/40 px-4 pb-3 pt-2">
          {collapsedActions}
        </div>
      ) : null}
    </div>
  );
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
  const router = useRouter();
  const pathname = usePathname();
  const requestedInitialStep = searchParams?.get("step") ?? "";
  const requestedProduct = searchParams?.get("product") ?? "";
  const requestedIntent = searchParams?.get("intent") ?? "";
  const requestedFresh = searchParams?.get("fresh") ?? "";
  const requestedReview = searchParams?.get("review") ?? "";
  const requestedListingId = searchParams?.get("listing") ?? searchParams?.get("id") ?? "";
  const routeLang = normalizeLang(searchParams?.get("lang"));
  const lang = useOfertasLocalesAppLang();
  const c = ofertasLocalesAppCopy(lang);
  const contactMoreExposureHref = publicContactHref({
    lang: routeLang,
    sourcePage: "publicar-ofertas-locales",
    sourceCta: "more_exposure_contact",
    inquiryType: "advertising",
  });
  const [signedIn, setSignedIn] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const { draft, updateDraft, resetDraft, hasLoadedDraft, lastSavedAt } = useOfertasLocalesDraft({
    ownerId,
    signals: {
      intent: requestedIntent,
      fresh: requestedFresh,
      step: requestedInitialStep,
      listingId: requestedListingId,
      review: requestedReview,
    },
  });
  const [step, setStep] = useState<OfertasLocalesWizardStepId>(1);
  const [step5PendingFileCount, setStep5PendingFileCount] = useState(0);
  const [submitSuccess, setSubmitSuccess] = useState<{ id: string; status: string } | null>(null);
  const stepRestoredRef = useRef(false);
  const canonicalRecoveryAttemptedRef = useRef(false);
  const urlIdSyncedRef = useRef(false);
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
    scanTotalPages: null,
    scanCompletedPages: null,
  });
  const [step5UploadEditing, setStep5UploadEditing] = useState(false);
  const [step5ManualCheckpoint, setStep5ManualCheckpoint] = useState<
    "upload" | "scan" | "review" | null
  >(null);
  // Ephemeral only (by design — see Gate D ticket's VIEW-STATE PERSISTENCE section):
  // a hard refresh always returns to "files"; all review decisions stay DB-backed
  // and are recovered independently of this toggle.
  const [step5ReviewView, setStep5ReviewView] = useState<"files" | "products">("files");
  const reviewWorkbenchRef = useRef<HTMLElement>(null);
  // Consolidated to 3 confirmations (Gate F ⚠️42) — businessInfo + filesDates
  // merged into one, aiItems stays required only for AI-included packages.
  const [step7Confirmations, setStep7Confirmations] = useState({
    businessFiles: false,
    aiItems: false,
    leonixRules: false,
  });
  const initialStepAppliedRef = useRef(false);
  const initialProductAppliedRef = useRef(false);

  const effectiveOfertaLocalId = submitSuccess?.id ?? aiScanRecordId;
  const aiIncludedInPackage = isOfertaLocalAiIncludedInPackage(draft);
  const showFullWidthReviewDesk =
    step === 5 &&
    aiIncludedInPackage &&
    Boolean(effectiveOfertaLocalId?.trim()) &&
    step5ReviewView === "products";
  const hasExistingAiScan =
    aiIncludedInPackage &&
    Boolean(lastScanJobId || aiReviewGate.totalItems > 0 || aiReviewGate.activeScanJobId);

  useEffect(() => {
    if (!hasLoadedDraft || initialStepAppliedRef.current) return;
    initialStepAppliedRef.current = true;
    const requested = Number.parseInt(requestedInitialStep, 10);
    if (Number.isFinite(requested)) {
      setStep(clampWizardStep(requested));
      return;
    }
    const storedStep = loadOfertaLocalWizardStep(draft.applicationSessionId);
    if (storedStep) setStep(clampWizardStep(storedStep));
  }, [draft.applicationSessionId, hasLoadedDraft, requestedInitialStep]);

  useEffect(() => {
    if (!hasLoadedDraft) return;
    saveOfertaLocalWizardStep(draft.applicationSessionId, step);
  }, [draft.applicationSessionId, hasLoadedDraft, step]);

  useEffect(() => {
    if (!hasLoadedDraft || stepRestoredRef.current) return;
    stepRestoredRef.current = true;
    const storedSubmission = loadOfertaLocalSubmissionSession(draft.applicationSessionId);
    if (storedSubmission) {
      setSubmitSuccess({ id: storedSubmission.id, status: storedSubmission.status });
      setAiScanRecordId(storedSubmission.id);
    }
  }, [draft.applicationSessionId, hasLoadedDraft]);

  // Canonical DB recovery — covers the case where browser-local draft state
  // is unavailable (a different Preview deployment origin, device, cleared
  // storage) but a durable ?id= is present in the URL. Local draft state
  // always wins when it exists; this only fires when the id is still empty
  // after the local-storage restoration above.
  useEffect(() => {
    if (!hasLoadedDraft || canonicalRecoveryAttemptedRef.current) return;
    const idToRecover = requestedListingId.trim();
    if (!idToRecover || effectiveOfertaLocalId) {
      canonicalRecoveryAttemptedRef.current = true;
      return;
    }
    canonicalRecoveryAttemptedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const sb = createSupabaseBrowserClient();
        const { data } = await sb.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const res = await fetch(`/api/ofertas-locales/owner/${encodeURIComponent(idToRecover)}?lang=${lang}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as {
          ok?: boolean;
          offer?: { id?: string; status?: string };
          draftPatch?: Record<string, unknown> | null;
        };
        if (cancelled || !body?.ok || !body.offer?.id) return;
        setAiScanRecordId(body.offer.id);
        setSubmitSuccess({ id: body.offer.id, status: body.offer.status ?? "pending_review" });
        saveOfertaLocalAiScanSession({ ofertaLocalId: body.offer.id, lastScanJobId: null });
        if (body.draftPatch) {
          const patch: Record<string, unknown> = { ...body.draftPatch };
          if ("flyerAssets" in patch) patch.flyerAssets = sanitizeAssetList(patch.flyerAssets);
          if ("couponAssets" in patch) patch.couponAssets = sanitizeAssetList(patch.couponAssets);
          updateDraft(patch as Partial<OfertaLocalDraft>);
        }
      } catch {
        // Network error recovering the canonical row — leave whatever local
        // draft state already loaded untouched.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasLoadedDraft, requestedListingId, effectiveOfertaLocalId, lang, updateDraft]);

  // Durable identity — once a canonical id is known, reflect it in the URL
  // so a bookmark, share, or reload from a storage-less context (a new
  // Preview deployment origin, a different device) can still recover the
  // application via the canonical-DB-recovery effect above.
  useEffect(() => {
    if (!effectiveOfertaLocalId || urlIdSyncedRef.current) return;
    urlIdSyncedRef.current = true;
    if (requestedListingId.trim() === effectiveOfertaLocalId.trim()) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("id", effectiveOfertaLocalId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [effectiveOfertaLocalId, requestedListingId, pathname, router, searchParams]);

  useEffect(() => {
    if (!hasLoadedDraft) return;
    if (requestedReview === "1" || requestedReview === "true") {
      setStep(5);
      setStep5ManualCheckpoint("review");
      setStep5ReviewView("products");
      window.setTimeout(() => {
        reviewWorkbenchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        reviewWorkbenchRef.current?.focus();
      }, 200);
    }
  }, [hasLoadedDraft, requestedReview]);

  useEffect(() => {
    if (!hasLoadedDraft || initialProductAppliedRef.current) return;
    const normalizedProduct = requestedProduct.trim().toLowerCase();
    const requestedLane =
      normalizedProduct === "coupon_promotion" ||
      normalizedProduct === "coupons" ||
      normalizedProduct === "local_coupons"
        ? "local_coupons"
        : normalizedProduct === "weekly_flyer" ||
            normalizedProduct === "interactive_flyer" ||
            normalizedProduct === "shopping_specials"
          ? "shopping_specials"
          : "";
    if (!requestedLane) return;
    initialProductAppliedRef.current = true;
    const currentLane = inferPrimaryAdFormatFromDraft(draft);
    if (currentLane === requestedLane) return;
    const hasDraftContent = Boolean(
      draft.businessName.trim() ||
        draft.title.trim() ||
        draft.description.trim() ||
        draft.couponText.trim() ||
        draft.flyerAssets.some((asset) => asset.status !== "removed") ||
        draft.couponAssets.some((asset) => asset.status !== "removed")
    );
    if (hasDraftContent) {
      const ok = window.confirm(
        lang === "en"
          ? "Switch this application to the selected product lane? Some flyer/coupon wording may change."
          : "¿Cambiar esta solicitud al producto seleccionado? Algunos textos de volante/cupón pueden cambiar."
      );
      if (!ok) return;
    }
    updateDraft({
      ...buildPrimaryAdFormatChangePatch(draft, requestedLane),
      wantsAiSearchableSpecials: true,
    });
  }, [draft, hasLoadedDraft, lang, requestedProduct, updateDraft]);

  useEffect(() => {
    // Guarded so this can't re-persist a stale pre-hydration id in the same
    // commit as useOfertasLocalesDraft's own mount effect clearing it.
    if (!hasLoadedDraft) return;
    saveOfertaLocalAiScanSession({
      ofertaLocalId: effectiveOfertaLocalId,
      lastScanJobId,
    });
  }, [effectiveOfertaLocalId, hasLoadedDraft, lastScanJobId]);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    void sb.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session?.access_token));
      setOwnerId(data.session?.user?.id ?? null);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.access_token));
      setOwnerId(session?.user?.id ?? null);
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

  // LIVE QA CORRECTION: aiReviewGate was previously only ever populated by
  // OfertasLocalesAiItemReviewPanel's own effect, which only runs while the
  // dedicated review workspace is mounted (step5ReviewView === "products").
  // On a cold hard refresh, step5ReviewView defaults back to "files" (by
  // design — Gate D), so the workspace never mounts, aiReviewGate stays at
  // its zeroed initial value, and step5ReviewComplete falsely reads as
  // incomplete even when every item was already approved. This reconstructs
  // the same gate state directly from the existing certified read path
  // (fetchOfertaLocalReviewItems — no new API) so the Files view is correct
  // BEFORE the user ever opens the workspace. Once the workspace does mount,
  // its own live effect takes over and this one no-ops (guarded below).
  useEffect(() => {
    if (!aiIncludedInPackage) return;
    if (!effectiveOfertaLocalId?.trim()) return;
    if (!lastScanJobId) return;
    if (aiReviewGate.totalItems > 0) return;
    let cancelled = false;
    void fetchOfertaLocalReviewItems(effectiveOfertaLocalId, lastScanJobId).then((result) => {
      if (cancelled || !result.ok) return;
      const items = result.items ?? [];
      if (items.length === 0) return;
      const scoped = summarizeScopedItemReviewCounts(items);
      const scanJob = result.scanJobs?.find((job) => job.id === lastScanJobId) ?? result.scanJobs?.[0] ?? null;
      setAiReviewGate({
        activeSourceAssetId: null,
        activeScanJobId: lastScanJobId,
        totalItems: items.length,
        needsReviewCount: scoped.pending + scoped.needs_review,
        approvedCount: scoped.approved,
        rejectedCount: scoped.rejected,
        reviewLaterCount: scoped.needs_review,
        scanTotalPages: scanJob?.totalPages ?? null,
        scanCompletedPages: scanJob?.completedPages ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [aiIncludedInPackage, effectiveOfertaLocalId, lastScanJobId, aiReviewGate.totalItems]);

  const handleStartFresh = useCallback(() => {
    const msg =
      lang === "en"
        ? `Are you sure? ${c.startOverDeviceWarning} You will start again at Step 1.`
        : `¿Estás seguro? ${c.startOverDeviceWarning} Empezarás otra vez en el Paso 1.`;
    if (!window.confirm(msg)) return;
    clearOfertaLocalAiScanSession();
    resetDraft();
    if (searchParams?.has("id")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("id");
      urlIdSyncedRef.current = false;
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : `${pathname}`, { scroll: false });
    }
    setSubmitSuccess(null);
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
      scanTotalPages: null,
      scanCompletedPages: null,
    });
    setStep5UploadEditing(false);
    setStep5ManualCheckpoint(null);
    setStep7Confirmations({
      businessFiles: false,
      aiItems: false,
      leonixRules: false,
    });
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [c.startOverDeviceWarning, lang, pathname, resetDraft, router, searchParams]);

  useEffect(() => {
    if (!hasLoadedDraft) return;
    if (aiIncludedInPackage && !draft.wantsAiSearchableSpecials) {
      updateDraft({ wantsAiSearchableSpecials: true });
    }
  }, [aiIncludedInPackage, draft.wantsAiSearchableSpecials, hasLoadedDraft, updateDraft]);

  const previewIssues = useMemo(() => validateOfertaLocalDraftForPreview(draft), [draft]);
  // ownerId is required here — validateOfertaLocalDraftForServerPublish checks it
  // internally, and passing serverPublishIssues (not a separate ownerId-blind
  // validator) into the panel below keeps the shown issues and the ready/not-ready
  // state always in sync (Gate F ⚠️47).
  const serverPublishIssues = useMemo(
    () => validateOfertaLocalDraftForServerPublish(draft, ownerId),
    [draft, ownerId]
  );
  const previewReady = previewIssues.length === 0;
  const publishFieldsReady = serverPublishIssues.every((i) => i.severity !== "error");

  const isShoppingLane = isOfertaLocalShoppingSpecialsLane(draft);
  const isCouponsLane = isOfertaLocalLocalCouponsLane(draft);

  const step5UploadComplete = useMemo(() => {
    if (step5PendingFileCount > 0 || ofertaLocalDraftHasUnuploadedAssetMetadata(draft)) {
      return false;
    }
    if (isShoppingLane) {
      const { primary } = splitOfertaLocalPrimaryFlyerAssets(draft.flyerAssets);
      return (
        primary != null &&
        (assetHasUploadedWithUrl(primary) || assetHasExternalUrlReady(primary))
      );
    }
    if (isCouponsLane) {
      const main = activeOfertaLocalDraftAssets(draft.couponAssets)[0];
      return main != null && (assetHasUploadedWithUrl(main) || assetHasExternalUrlReady(main));
    }
    return false;
  }, [draft, isCouponsLane, isShoppingLane, step5PendingFileCount]);

  const step5ScanRequired = aiIncludedInPackage;
  const step5ScanComplete = !step5ScanRequired || hasExistingAiScan;
  // Zero extracted candidates is never "review complete" — that's an
  // extraction failure/empty result, not a reviewed set. Only a real,
  // non-empty candidate list with nothing left pending counts as complete.
  const step5ReviewComplete =
    !step5ScanRequired ||
    (step5ScanComplete && aiReviewGate.totalItems > 0 && aiReviewGate.needsReviewCount === 0);
  const step5ReviewTouched =
    aiReviewGate.approvedCount + aiReviewGate.rejectedCount + aiReviewGate.reviewLaterCount > 0;
  const step5ReviewOpenCtaLabel = step5ReviewComplete
    ? c.step5ViewReviewCta
    : step5ReviewTouched
      ? c.step5ContinueReviewCta
      : c.step5CheckpointReviewProductsCta;

  const step5ActiveCheckpoint = useMemo((): "upload" | "scan" | "review" | "complete" => {
    if (!step5UploadComplete) return "upload";
    if (step5ScanRequired && !step5ScanComplete) return "scan";
    if (step5ScanRequired && !step5ReviewComplete) return "review";
    return "complete";
  }, [step5ReviewComplete, step5ScanComplete, step5ScanRequired, step5UploadComplete]);

  const step5PrimaryAssetSummary = useMemo(() => {
    if (isShoppingLane) {
      const { primary } = splitOfertaLocalPrimaryFlyerAssets(draft.flyerAssets);
      if (!primary) return null;
      const ready = assetHasUploadedWithUrl(primary) || assetHasExternalUrlReady(primary);
      return {
        label:
          primary.fileName || primary.url || (lang === "en" ? "Flyer file" : "Archivo de volante"),
        ready,
        href: primary.url.trim() || null,
      };
    }
    if (isCouponsLane) {
      const main = activeOfertaLocalDraftAssets(draft.couponAssets)[0];
      if (!main) return null;
      const ready = assetHasUploadedWithUrl(main) || assetHasExternalUrlReady(main);
      return {
        label: main.fileName || main.url || (lang === "en" ? "Coupon file" : "Archivo de cupón"),
        ready,
        href: main.url.trim() || null,
      };
    }
    return null;
  }, [draft, isCouponsLane, isShoppingLane, lang]);

  const step5UploadCardOpen =
    step5ManualCheckpoint === "upload" ||
    step5UploadEditing ||
    (!step5UploadComplete && step5ActiveCheckpoint === "upload");
  const step5ScanCardOpen =
    step5ManualCheckpoint === "scan" ||
    (step5ScanRequired &&
      step5UploadComplete &&
      !step5UploadEditing &&
      !step5ScanComplete &&
      step5ActiveCheckpoint === "scan");
  const step5ReviewCardOpen =
    step5ManualCheckpoint === "review" ||
    (step5ScanRequired &&
      step5ScanComplete &&
      !step5UploadEditing &&
      !step5ReviewComplete &&
      step5ActiveCheckpoint === "review");

  const openProductReviewWorkspace = useCallback(() => {
    // View-state only — never re-triggers a scan or touches persisted review data.
    setStep5ReviewView("products");
    setStep5ManualCheckpoint(null);
    window.setTimeout(() => {
      reviewWorkbenchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      reviewWorkbenchRef.current?.focus();
    }, 50);
  }, []);

  const handleBackToFiles = useCallback(() => {
    // Draft, uploaded assets, scan results, and review decisions are all
    // DB/local-draft persisted already — this only flips which sub-screen
    // of Step 5 is visible.
    setStep5ReviewView("files");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (step !== 5) {
      setStep5UploadEditing(false);
      setStep5ManualCheckpoint(null);
      setStep5ReviewView("files");
    }
  }, [step]);

  const primaryFormat = inferPrimaryAdFormatFromDraft(draft);
  const emailMalformed =
    draft.email.trim().length > 0 && !isOfertaLocalEmailFormatValid(draft.email);
  const step7ConfirmationsComplete = useMemo(() => {
    if (emailMalformed) return false;
    const base = step7Confirmations.businessFiles && step7Confirmations.leonixRules;
    if (aiIncludedInPackage) {
      return base && step7Confirmations.aiItems;
    }
    return base;
  }, [aiIncludedInPackage, emailMalformed, step7Confirmations]);

  const savedLabel = formatSavedAt(lastSavedAt, lang);
  const addressAccepted = hasOfertaLocalAddressAccepted(draft);
  const websiteUrlAccepted = hasOfertaLocalUrlAccepted(draft.websiteUrl);
  const businessLogoUrlAccepted = hasOfertaLocalUrlAccepted(draft.businessLogoUrl);
  const resolvedBusinessLogoUrl = getOfertaLocalBusinessLogoUrl(draft);
  const businessLogoAssetId = useMemo(() => crypto.randomUUID(), []);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const membershipUrlAccepted = hasOfertaLocalUrlAccepted(draft.membershipUrl);
  const digitalCouponUrlAccepted = hasOfertaLocalUrlAccepted(draft.digitalCouponUrl);

  const stepMeta = OFERTAS_LOCALES_WIZARD_STEPS[step - 1];
  const stepHints = useMemo(() => getOfertasLocalesWizardStepHints(step, draft, lang), [step, draft, lang]);
  const progressLabel =
    lang === "en"
      ? `Step ${step} of ${OFERTAS_LOCALES_WIZARD_STEP_COUNT}`
      : `Paso ${step} de ${OFERTAS_LOCALES_WIZARD_STEP_COUNT}`;

  useEffect(() => {
    // Guarded so this can't apply the default against the pre-hydration
    // empty draft and clobber a real restored value.
    if (!hasLoadedDraft) return;
    if (!draft.membershipCtaLabel.trim()) {
      updateDraft({
        membershipCtaLabel: OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS.signUpBeforeYouGoEs,
      });
    }
  }, [draft.membershipCtaLabel, hasLoadedDraft, updateDraft]);

  const handleBusinessLogoFile = useCallback(
    async (file: File) => {
      const validation = validateOfertaLocalClientAssetFile(file, "logo", lang);
      if (!validation.ok) {
        setLogoUploadError(validation.errors[0] ?? c.businessLogoUploadFailed);
        return;
      }
      setLogoUploading(true);
      setLogoUploadError(null);
      try {
        const result = await uploadOfertaLocalDraftAsset({
          file,
          assetKind: "logo",
          assetId: businessLogoAssetId,
        });
        if (!result.ok || !result.publicUrl) {
          setLogoUploadError(result.errors?.[0] ?? result.detail ?? c.businessLogoUploadFailed);
          return;
        }
        updateDraft({
          businessLogoUploadedUrl: result.publicUrl,
          businessLogoUploadedFileName: result.fileName ?? file.name,
        });
      } catch {
        setLogoUploadError(c.businessLogoUploadFailed);
      } finally {
        setLogoUploading(false);
        if (logoFileInputRef.current) logoFileInputRef.current.value = "";
      }
    },
    [businessLogoAssetId, c.businessLogoUploadFailed, lang, updateDraft]
  );

  const handleUrlBlur = useCallback(
    (
      field:
        | "websiteUrl"
        | "businessLogoUrl"
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

  const goNext = useCallback(() => {
    if (step === 5) {
      if (!step5UploadComplete) return;
      if (aiIncludedInPackage && (!step5ScanComplete || !step5ReviewComplete)) return;
    }
    setStep((s) => clampWizardStep(s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [
    aiIncludedInPackage,
    step,
    step5ReviewComplete,
    step5ScanComplete,
    step5UploadComplete,
  ]);

  const step5UploadBlocksContinue = useMemo(() => {
    if (step !== 5) return false;
    return !step5UploadComplete;
  }, [step, step5UploadComplete]);

  const step5HasBlockingWork = useMemo(() => {
    if (!step5UploadComplete) return true;
    if (!aiIncludedInPackage) return false;
    return !step5ScanComplete || !step5ReviewComplete;
  }, [
    aiIncludedInPackage,
    step5ReviewComplete,
    step5ScanComplete,
    step5UploadComplete,
  ]);

  const step5BlocksContinue = useMemo(() => {
    if (step !== 5) return false;
    return step5HasBlockingWork;
  }, [step, step5HasBlockingWork]);

  const step5AiReviewBlocksContinue =
    step === 5 && aiIncludedInPackage && step5ScanComplete && !step5ReviewComplete;

  const step5AiReviewBlockMessage = c.step5CheckpointLockedNext;

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

  const previewHref = withClasificadosPublishLang("/publicar/ofertas-locales/preview", routeLang, {
    intent: "continue",
  });

  const goToStep6 = useCallback(() => {
    setStep5ManualCheckpoint(null);
    setStep(6);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
                const isFlyerLane = lane.value === "shopping_specials";
                const catalog = isFlyerLane
                  ? OFERTAS_LOCALES_PUBLISH_PRODUCT_CATALOG.interactive_flyer
                  : OFERTAS_LOCALES_PUBLISH_PRODUCT_CATALOG.coupons;
                const title = isFlyerLane ? c.step1InteractiveFlyerTitle : c.step1CouponsTitle;
                const cta = isFlyerLane ? c.step1InteractiveFlyerCta : c.step1CouponsCta;
                const description = isFlyerLane
                  ? c.step1InteractiveFlyerDescription
                  : c.step1CouponsDescription;
                const bullets = isFlyerLane
                  ? c.step1InteractiveFlyerBullets
                  : c.step1CouponsBullets;
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
                    onClick={() =>
                      updateDraft({
                        ...buildPrimaryAdFormatChangePatch(draft, lane.value),
                        wantsAiSearchableSpecials: true,
                      })
                    }
                  >
                    <p className="text-base font-semibold text-[#1E1814]">{title}</p>
                    <p className="mt-1 text-lg font-bold text-[#7A1E2C]">
                      {formatUsd(catalog.displayPriceUsd)}
                      {c.perDuration}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#7A1E2C]/90">{c.aiIncludedLabel}</p>
                    <p className="mt-2 text-xs leading-relaxed text-[#1E1814]/70">{description}</p>
                    <ul className="mt-3 space-y-1 text-xs leading-relaxed text-[#1E1814]/70">
                      {bullets.map((item) => (
                        <li key={item}>· {item}</li>
                      ))}
                    </ul>
                    <span className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white">
                      {cta}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs text-[#1E1814]/55">{c.step1PackageNote}</p>

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
              label={lang === "en" ? "Business logo" : "Logo del negocio"}
              helper={c.businessLogoHelper}
              optional
              optionalLabel={c.optional}
              confirm={
                draft.businessLogoUploadedUrl.trim()
                  ? c.businessLogoUploaded
                  : businessLogoUrlAccepted
                    ? c.urlAccepted
                    : undefined
              }
            >
              <div className="space-y-3">
                <input
                  className={INPUT}
                  value={draft.businessLogoUrl}
                  onChange={(e) => updateDraft({ businessLogoUrl: e.target.value })}
                  onBlur={() => handleUrlBlur("businessLogoUrl")}
                  placeholder="https://"
                  inputMode="url"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleBusinessLogoFile(file);
                    }}
                  />
                  <button
                    type="button"
                    className="min-h-11 rounded-xl border border-[#D4C4A8] bg-[#FFFCF7] px-4 py-2.5 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={logoUploading}
                    onClick={() => logoFileInputRef.current?.click()}
                  >
                    {logoUploading ? c.businessLogoUploading : c.businessLogoUploadButton}
                  </button>
                  <span className="text-xs text-[#1E1814]/50">{c.businessLogoUploadFormats}</span>
                  {draft.businessLogoUploadedUrl.trim() ? (
                    <button
                      type="button"
                      className="min-h-11 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-800 hover:bg-red-50"
                      onClick={() =>
                        updateDraft({
                          businessLogoUploadedUrl: "",
                          businessLogoUploadedFileName: "",
                        })
                      }
                    >
                      {c.businessLogoRemoveUpload}
                    </button>
                  ) : null}
                </div>
                {logoUploadError ? (
                  <p className="text-xs font-medium text-red-700">{logoUploadError}</p>
                ) : null}
                {resolvedBusinessLogoUrl ? (
                  <div className="flex items-center gap-3 rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0]/80 p-2.5">
                    <img
                      src={resolvedBusinessLogoUrl}
                      alt={lang === "en" ? "Business logo preview" : "Vista previa del logo"}
                      className="h-14 w-14 rounded-lg border border-[#D4C4A8]/60 bg-white object-contain p-1"
                    />
                    <p className="min-w-0 truncate text-xs text-[#1E1814]/60">
                      {draft.businessLogoUploadedFileName.trim() ||
                        draft.businessLogoUrl.trim() ||
                        (lang === "en" ? "Logo ready" : "Logo listo")}
                    </p>
                  </div>
                ) : null}
              </div>
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
        const uploadCheckpointTitle = isCouponsLane
          ? c.step5CheckpointUploadCouponTitle
          : c.step5CheckpointUploadTitle;
        const uploadCompleteLabel = isCouponsLane
          ? c.step5CheckpointUploadCouponComplete
          : c.step5CheckpointUploadComplete;
        const scanLockedMessage = isCouponsLane
          ? c.step5CheckpointLockedScanCoupon
          : c.step5CheckpointLockedScan;
        const reviewLockedMessage = isCouponsLane
          ? c.step5CheckpointLockedReviewCoupon
          : c.step5CheckpointLockedReview;

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
                    ? "Upload your full weekly flyer. AI analysis is included and prepares product suggestions for review."
                    : "Sube tu volante semanal completo. El análisis con IA está incluido y prepara sugerencias para revisión."
                }
                primaryFlyerMultiPageHelper={c.laneShoppingMainFlyerMultiPageHelper}
                showAiScanFormatsHint={aiIncludedInPackage}
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
                  showAiScanFormatsHint={aiIncludedInPackage}
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
                    showAiScanFormatsHint={aiIncludedInPackage}
                    onPendingUploadsChange={(count) => reportStep5SectionPending("add-promo", count)}
                  />
                </div>
              </>
            ) : null}
          </>
        );

        return (
          <div className="space-y-3">
            {step5ReviewView === "products" ? (
              <div className="space-y-1.5 rounded-xl border border-[#D4C4A8]/60 bg-[#FDF8F0]/50 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A1E2C]/70">
                  {c.step5ReviewScreenBreadcrumb}
                </p>
                <h3 className="text-lg font-semibold text-[#1E1814]">{c.step5ReviewScreenTitle}</h3>
                <p className="text-sm text-[#1E1814]/70">{c.step5ReviewScreenSubtitle}</p>
                {aiReviewGate.totalItems > 0 ? (
                  <p className="text-xs font-medium text-[#7A1E2C]">
                    {formatOfertaLocalCopyTemplate(c.step5ReviewScreenSummary, {
                      count: aiReviewGate.totalItems,
                      pages: aiReviewGate.scanTotalPages ?? 0,
                    })}
                  </p>
                ) : null}
                <p className="text-xs text-[#1E1814]/60">{c.step5ReviewWorkspaceOpenHint}</p>
              </div>
            ) : (
              <>
                {step5ReviewComplete && step5UploadComplete ? (
                  <div className="rounded-xl border border-emerald-300/80 bg-emerald-50 px-4 py-4">
                    <p className="text-base font-semibold text-emerald-950">{c.step5CheckpointReviewComplete}</p>
                    {aiReviewGate.totalItems > 0 ? (
                      <p className="mt-1 text-sm text-emerald-900">
                        {formatOfertaLocalCopyTemplate(c.step5ReviewCompleteCount, {
                          count: aiReviewGate.totalItems,
                        })}
                      </p>
                    ) : null}
                    <button type="button" className={`${BTN_PRIMARY} mt-4 min-h-11`} onClick={goToStep6}>
                      {c.step5ContinueToNextStep}
                    </button>
                  </div>
                ) : null}
                {!primaryFormat ? (
                  <p className="text-sm text-[#1E1814]/55">
                    {lang === "en"
                      ? "Choose your primary format in Step 1 first."
                      : "Elige el formato principal en el Paso 1."}
                  </p>
                ) : (
                  <>
                    <Step5CheckpointCard
                      title={uploadCheckpointTitle}
                      isOpen={step5UploadCardOpen}
                      isLocked={false}
                      isComplete={step5UploadComplete}
                      summary={
                        step5PrimaryAssetSummary ? (
                          <>
                            {uploadCompleteLabel} · {step5PrimaryAssetSummary.label} ·{" "}
                            {step5PrimaryAssetSummary.ready
                              ? c.step5CheckpointFileReady
                              : c.step5CheckpointFilePending}
                          </>
                        ) : undefined
                      }
                      collapsedActions={
                        step5UploadComplete ? (
                          <>
                            {step5PrimaryAssetSummary?.href ? (
                              <a
                                href={step5PrimaryAssetSummary.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={BTN_SECONDARY}
                              >
                                {c.step5CheckpointViewFile}
                              </a>
                            ) : null}
                            <button
                              type="button"
                              className={BTN_SECONDARY}
                              onClick={() => {
                                setStep5UploadEditing(true);
                                setStep5ManualCheckpoint("upload");
                              }}
                            >
                              {c.step5CheckpointEditFiles}
                            </button>
                          </>
                        ) : undefined
                      }
                      onToggle={() => {
                        if (step5UploadCardOpen && step5UploadComplete) {
                          setStep5UploadEditing(false);
                          setStep5ManualCheckpoint(null);
                        } else {
                          setStep5UploadEditing(true);
                          setStep5ManualCheckpoint("upload");
                        }
                      }}
                    >
                      <div className="space-y-4">
                        <p className="text-xs leading-relaxed text-[#1E1814]/65">{c.step5UploadLimitsHint}</p>
                        {assetUploadSections}
                        {step5UploadBlocksContinue ? (
                          <p className={HINT_BOX}>{c.step5UploadBeforeContinueWarning}</p>
                        ) : null}
                        {step5UploadComplete ? (
                          <button
                            type="button"
                            className={BTN_SECONDARY}
                            onClick={() => {
                              setStep5UploadEditing(false);
                              setStep5ManualCheckpoint(null);
                            }}
                          >
                            {c.uploadedFilesHideEditor}
                          </button>
                        ) : null}
                      </div>
                    </Step5CheckpointCard>

                    {step5ScanRequired ? (
                      <Step5CheckpointCard
                        title={c.step5CheckpointScanTitle}
                        isOpen={step5ScanCardOpen}
                        isLocked={!step5UploadComplete}
                        isComplete={step5ScanComplete}
                        lockMessage={!step5UploadComplete ? scanLockedMessage : undefined}
                        summary={
                          step5ScanComplete ? (
                            <>
                              {c.step5CheckpointScanComplete}
                              {aiReviewGate.totalItems > 0
                                ? ` · ${formatOfertaLocalCopyTemplate(c.step5CheckpointProductsFound, {
                                    count: aiReviewGate.totalItems,
                                  })}`
                                : null}
                            </>
                          ) : undefined
                        }
                        onToggle={() => {
                          if (!step5UploadComplete) return;
                          setStep5ManualCheckpoint(step5ScanCardOpen ? null : "scan");
                        }}
                      >
                        <OfertasLocalesAiScanPanel
                          draft={draft}
                          lang={lang}
                          ofertaLocalId={effectiveOfertaLocalId}
                          signedIn={signedIn}
                          compactMode
                          scanComplete={step5ScanComplete && !scanPollingActive}
                          itemsFoundCount={aiReviewGate.totalItems}
                          onScanStarted={handleScanStarted}
                          onScanComplete={(scanJobId) => {
                            handleScanComplete(scanJobId);
                            setStep5ManualCheckpoint(null);
                          }}
                          onScanFinished={handleScanFinished}
                          onOfertaLocalIdChange={handleAiScanRecordId}
                        />
                      </Step5CheckpointCard>
                    ) : null}

                    {step5ScanRequired ? (
                      <Step5CheckpointCard
                        title={c.step5CheckpointReviewTitle}
                        isOpen={step5ReviewCardOpen}
                        isLocked={!step5ScanComplete}
                        isComplete={step5ReviewComplete}
                        lockMessage={!step5ScanComplete ? reviewLockedMessage : undefined}
                        summary={
                          step5ReviewComplete
                            ? c.step5CheckpointReviewComplete
                            : step5ScanComplete
                              ? (
                                <>
                                  {c.step5ScanCompleteCheckTitle}
                                  {aiReviewGate.totalItems > 0
                                    ? ` · ${formatOfertaLocalCopyTemplate(c.step5CheckpointProductsFound, {
                                        count: aiReviewGate.totalItems,
                                      })}`
                                    : ""}
                                  {aiReviewGate.scanTotalPages
                                    ? ` · ${formatOfertaLocalCopyTemplate(c.step5ScanPagesProcessed, {
                                        count: aiReviewGate.scanTotalPages,
                                      })}`
                                    : ""}
                                </>
                              )
                              : undefined
                        }
                        collapsedActions={
                          step5ScanComplete ? (
                            <button type="button" className={BTN_PRIMARY} onClick={openProductReviewWorkspace}>
                              {step5ReviewOpenCtaLabel}
                            </button>
                          ) : undefined
                        }
                        onToggle={() => {
                          if (!step5ScanComplete) return;
                          setStep5ManualCheckpoint(step5ReviewCardOpen ? null : "review");
                        }}
                      >
                        <div className="space-y-3">
                          {step5ReviewComplete ? (
                            <>
                              <p className="text-sm font-medium text-emerald-900">{c.step5CheckpointReviewComplete}</p>
                              <button type="button" className={BTN_PRIMARY} onClick={openProductReviewWorkspace}>
                                {c.step5ViewReviewCta}
                              </button>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-emerald-900">{c.step5ScanCompleteCheckTitle}</p>
                              {aiReviewGate.totalItems > 0 ? (
                                <p className="text-xs text-[#1E1814]/70">
                                  {formatOfertaLocalCopyTemplate(c.step5CheckpointProductsFound, {
                                    count: aiReviewGate.totalItems,
                                  })}
                                </p>
                              ) : null}
                              {aiReviewGate.scanTotalPages ? (
                                <p className="text-xs text-[#1E1814]/70">
                                  {formatOfertaLocalCopyTemplate(c.step5ScanPagesProcessed, {
                                    count: aiReviewGate.scanTotalPages,
                                  })}
                                </p>
                              ) : null}
                              <button type="button" className={BTN_PRIMARY} onClick={openProductReviewWorkspace}>
                                {step5ReviewOpenCtaLabel}
                              </button>
                            </>
                          )}
                        </div>
                      </Step5CheckpointCard>
                    ) : null}

                    {step5AiReviewBlocksContinue ? (
                      <p className={ERROR_BOX}>{step5AiReviewBlockMessage}</p>
                    ) : null}
                  </>
                )}
              </>
            )}

            {step5ReviewView === "products" ? null : (
              <div className="rounded-xl border border-[#D4C4A8]/60 bg-[#FDF8F0]/50 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#1E1814]/45">
                  {c.startOverNeedQuestion}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#1E1814]/55">{c.startOverDeviceWarning}</p>
                <button
                  type="button"
                  className="mt-3 min-h-11 rounded-xl border border-[#D4C4A8] bg-white px-3 py-2 text-xs font-medium text-[#1E1814]/70 hover:border-red-300 hover:text-red-800"
                  onClick={handleStartFresh}
                >
                  {c.startOverDeleteCta}
                </button>
              </div>
            )}
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
                  onChange={(e) => updateDraft({ email: e.target.value })}
                  onBlur={(e) => updateDraft({ email: normalizeOfertaLocalEmailInput(e.target.value) })}
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

            {/* Featured placement remains gated off until that product is live. */}
            {false ? ( // eslint-disable-line no-constant-condition
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

            {aiIncludedInPackage && hasExistingAiScan ? (
              <details className="rounded-xl border border-[#7A1E2C]/25 bg-[#7A1E2C]/5 px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold text-[#7A1E2C]">
                  {c.step7ScanSummaryTitle}
                </summary>
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
                  <button
                    type="button"
                    className={BTN_SECONDARY}
                    onClick={() => {
                      setStep(5);
                      setStep5ReviewView("products");
                    }}
                  >
                    {c.step7ContinueReviewing}
                  </button>
                </div>
              </details>
            ) : null}

            {aiIncludedInPackage && !hasExistingAiScan ? (
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
            ) : null}

            <OfertasLocalesValidationPanel
              previewIssues={previewIssues}
              publishIssues={serverPublishIssues}
              previewReady={previewReady}
              publishFieldsReady={publishFieldsReady}
              lang={lang}
            />

            <div className="space-y-3 rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-4">
              <p className="text-sm font-semibold text-[#1E1814]">{c.step7ConfirmBeforePreview}</p>
              <label className="flex items-start gap-3 text-sm text-[#1E1814]">
                <input
                  type="checkbox"
                  checked={step7Confirmations.businessFiles}
                  onChange={(e) =>
                    setStep7Confirmations((prev) => ({ ...prev, businessFiles: e.target.checked }))
                  }
                  className="mt-1 rounded border-[#D4C4A8] text-[#7A1E2C] focus:ring-[#7A1E2C]/30"
                />
                <span>{c.step7ConfirmBusinessFiles}</span>
              </label>
              {aiIncludedInPackage ? (
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
                <ul className="space-y-1 text-xs font-medium text-amber-900">
                  {emailMalformed ? <li>· {c.step7BlockerEmail}</li> : null}
                  {!step7Confirmations.businessFiles ? <li>· {c.step7BlockerBusinessFiles}</li> : null}
                  {aiIncludedInPackage && (aiReviewGate.needsReviewCount > 0 || !step7Confirmations.aiItems) ? (
                    <li>· {c.step7BlockerAiReview}</li>
                  ) : null}
                  {!step7Confirmations.leonixRules ? <li>· {c.step7BlockerLeonixRules}</li> : null}
                </ul>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              {step7ConfirmationsComplete ? (
                <Link href={previewHref} className={`${BTN_PRIMARY} min-h-11`}>
                  {c.step7ViewPreview}
                </Link>
              ) : (
                <span
                  className={cx(BTN_PRIMARY, "min-h-11 cursor-not-allowed opacity-45")}
                  aria-disabled="true"
                  title={c.step7PreviewGatedHelper}
                >
                  {c.step7ViewPreview}
                </span>
              )}
            </div>

            <OfertasLocalesCommercialSummary draft={draft} lang={lang} />
            <p className="text-xs text-[#1E1814]/55">{c.publishNotBuilt}</p>

            <div className="rounded-xl border border-[#D4C4A8]/60 bg-[#FDF8F0]/50 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#1E1814]/45">
                {c.startOverNeedQuestion}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#1E1814]/55">{c.startOverDeviceWarning}</p>
              <button
                type="button"
                className="mt-3 min-h-11 rounded-xl border border-[#D4C4A8] bg-white px-3 py-2 text-xs font-medium text-[#1E1814]/70 hover:border-red-300 hover:text-red-800"
                onClick={handleStartFresh}
              >
                {c.startOverDeleteCta}
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
                // Quick-jump navigation is intentionally permissive — required-field
                // and publish/scan validation still gate the relevant ACTION, but must
                // never trap a customer on a step via Atrás/Siguiente-only navigation.
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

              {step === 5 && step5ReviewView === "products" ? null : step < 7 ? (
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
          ref={reviewWorkbenchRef}
          tabIndex={-1}
          aria-label={lang === "en" ? "AI scan review desk" : "Mesa de revisión de escaneo AI"}
          className="border-t border-[#D4C4A8]/70 bg-[#FAF6F0] px-4 py-8 sm:px-6 lg:py-10 focus:outline-none"
        >
          <div className="mx-auto w-full max-w-[min(100vw-2rem,1600px)]">
            <button
              type="button"
              className={`${BTN_SECONDARY} mb-4`}
              onClick={handleBackToFiles}
            >
              {c.step5BackToFiles}
            </button>
            <OfertasLocalesAiScanReviewWorkspace
              lang={lang}
              draft={draft}
              ofertaLocalId={effectiveOfertaLocalId}
              lastScanJobId={lastScanJobId}
              scanPollingActive={scanPollingActive}
              scanRefreshToken={scanRefreshToken}
              reviewMode={isCouponsLane ? "coupon" : "weekly"}
              onReviewGateChange={handleAiReviewGateChange}
              onContinueToNextStep={goToStep6}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
