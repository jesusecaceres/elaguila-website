"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FiCheck, FiImage, FiPlus, FiUpload, FiX } from "react-icons/fi";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";
import {
  clearLeonixReturningToEditSessionFlag,
  markPublishFlowOpeningPreview,
  useLeonixPublishLeaveGuard,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import {
  BUSINESS_TYPE_PRESETS,
  chipLabel,
  getBusinessTypePreset,
} from "../lib/businessTypePresets";
import { getClasificadosServiciosCopy } from "../lib/clasificadosServiciosApplicationCopy";
import { ServiciosPublishSortableGallery } from "./ServiciosPublishSortableGallery";
import type {
  ChipDef,
  ClasificadosServiciosApplicationState,
  DayKey,
  GalleryItem,
  ServiciosLang,
} from "../lib/clasificadosServiciosApplicationTypes";
import { LANGUAGE_OPTION_CHIPS } from "../lib/clasificadosServiciosApplicationTypes";
import {
  bootstrapServiciosApplicationStateAsync,
  clearServiciosPreviewReturnHandoff,
  persistServiciosDraftForPreviewNavigation,
} from "../lib/clasificadosServiciosPreviewHandoff";
import {
  clearServiciosDraftStorageAndIdb,
  saveClasificadosServiciosApplicationResolved,
} from "../lib/clasificadosServiciosStorage";
import {
  getServiciosApplicationStepLabels,
  getServiciosApplicationStepShortLabels,
  SERVICIOS_APPLICATION_STEP_COUNT,
} from "../lib/serviciosApplicationStepLabels";
import ListingRulesConfirmationSection from "@/app/clasificados/en-venta/shared/components/ListingRulesConfirmationSection";
import type { PublishReadinessMissingItem } from "../lib/serviciosPublishReadiness";
import { evaluateServiciosPreviewReadiness } from "../lib/serviciosPreviewReadiness";
import {
  clasificadosServiciosApplicationHasProgress,
  createDefaultClasificadosServiciosState,
  WEEK_DAY_LABELS,
} from "../lib/defaultClasificadosServiciosState";
import { mergeStateForBusinessTypeChange } from "../lib/presetStateMerge";
import {
  CUSTOM_CHIP_MAX_LENGTH,
  MAX_CUSTOM_SERVICES_OFFERED,
  MAX_QUICK_FACTS_SELECTION,
  MAX_REASONS_SELECTION,
  MAX_SERVICES_SELECTION,
  enforceServiciosSelectionCaps,
} from "../lib/serviciosSelectionCaps";
import { BUSINESS_HIGHLIGHT_PRESET_CHIPS } from "../lib/businessHighlightPresets";
import { evaluateAddCustomBusinessHighlight } from "../lib/serviciosCustomBusinessHighlights";
import { evaluateAddCustomServiceOffered } from "../lib/serviciosCustomServicesOffered";
import {
  BUSINESS_HIGHLIGHT_LABEL_MAX,
  MAX_BUSINESS_HIGHLIGHT_PRESET_SELECTION,
  MAX_CUSTOM_BUSINESS_HIGHLIGHTS,
} from "../lib/serviciosHighlightCaps";
import { isValidEmail } from "../lib/leonixContactCtaPriority";
import { digitsOnly, formatPhoneInputDisplay } from "../lib/serviciosPhoneUi";
import { resolveServiciosBusinessHighlightVisual } from "@/app/(site)/clasificados/servicios/lib/serviciosBusinessHighlightVisual";
import { resolveServiciosServiceVisual } from "@/app/(site)/clasificados/servicios/lib/serviciosServiceVisualCatalog";
import {
  isProbablyValidWebUrl,
  newGalleryId,
  newVideoId,
  normalizeHttpUrl,
} from "../lib/socialAndUrlHelpers";
import { ServiciosPublishModal } from "./ServiciosPublishModal";
import {
  CUSTOM_PAYMENT_LABEL_MAX,
  MAX_CUSTOM_PAYMENT_METHODS,
  MAX_SERVICIOS_PAYMENT_METHODS_SELECTED,
  SERVICIOS_PAYMENT_METHOD_ORDER,
  sanitizeServiciosPaymentMethodIds,
} from "@/app/servicios/lib/serviciosPaymentMethodCatalog";
import { ServiciosPaymentMethodBadge } from "@/app/servicios/components/ServiciosPaymentMethodBadge";
import { evaluateAddCustomPaymentMethod } from "../lib/serviciosCustomPaymentMethods";
import {
  CUSTOM_SERVICIOS_AMENITY_LABEL_MAX,
  MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS,
  SERVICIOS_AMENITY_GROUPS,
  SERVICIOS_AMENITY_OPTIONS,
  sanitizeServiciosAmenityOptionIds,
} from "@/app/servicios/lib/serviciosAmenitiesCatalog";
import { ServiciosAmenityBadge } from "@/app/servicios/components/ServiciosAmenityBadge";
import { evaluateAddCustomAmenityOption } from "../lib/serviciosCustomAmenityOptions";
import { evaluateAddCertificationLabel } from "@/app/servicios/lib/serviciosCredentialsCustom";
import {
  MAX_SERVICIOS_CERTIFICATIONS,
  SERVICIOS_CERTIFICATION_LABEL_MAX,
  SERVICIOS_CREDENTIAL_STRING_MAX,
} from "@/app/servicios/lib/serviciosCredentialsCatalog";

const DEBOUNCE_MS = 500;
const GALLERY_MAX = 24;
const VIDEO_MAX = 2;

const inputClass =
  "mt-1 w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-base leading-snug text-neutral-900 shadow-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD] sm:text-sm";
const inputWarn = "border-amber-400 bg-amber-50/50";
const sectionCard =
  "rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6";
const labelClass = "text-sm font-semibold text-neutral-800";

function toggleId(list: string[], id: string, on: boolean): string[] {
  const set = new Set(list);
  if (on) set.add(id);
  else set.delete(id);
  return Array.from(set);
}

function Chip({
  selected,
  onClick,
  children,
  className,
  truncateLabel,
  labelTitle,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Merged into the chip button (e.g. max width / truncate) */
  className?: string;
  /** Wrap label text for ellipsis on small screens */
  truncateLabel?: boolean;
  /** Full label for hover tooltip (custom chips) */
  labelTitle?: string;
}) {
  const inner =
    truncateLabel ? (
      <span className="min-w-0 max-w-full truncate text-left" title={labelTitle}>
        {children}
      </span>
    ) : (
      children
    );
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex min-h-[40px] min-w-0 max-w-full touch-manipulation items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition active:scale-[0.99] sm:min-h-0 sm:py-1.5",
        selected
          ? "border-[#3B66AD] bg-[#3B66AD]/10 text-[#1e3a5f] ring-1 ring-[#3B66AD]/20"
          : "border-neutral-200 bg-neutral-50/80 text-neutral-700 hover:border-neutral-300",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {selected ? <FiCheck className="h-3.5 w-3.5 shrink-0 text-[#3B66AD]" aria-hidden /> : null}
      {inner}
    </button>
  );
}

export function ClasificadosServiciosApplication() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: ServiciosLang = searchParams?.get("lang") === "en" ? "en" : "es";
  const copy = getClasificadosServiciosCopy(lang);

  const [hydrated, setHydrated] = useState(false);
  const [previewGateMissing, setPreviewGateMissing] = useState<PublishReadinessMissingItem[] | null>(null);
  const [state, setState] = useState<ClasificadosServiciosApplicationState>(() => createDefaultClasificadosServiciosState());

  const stepLabels = useMemo(() => getServiciosApplicationStepLabels(lang), [lang]);
  const stepShortLabels = useMemo(() => getServiciosApplicationStepShortLabels(lang), [lang]);
  const totalSteps = SERVICIOS_APPLICATION_STEP_COUNT;
  const step = state.applicationStepIndex;
  const canGoBack = step > 0;
  const canGoNext = step < totalSteps - 1;
  const stepLabelActive = stepLabels[step] ?? "";

  const goToStep = useCallback((n: number) => {
    setState((s) => ({
      ...s,
      applicationStepIndex: Math.max(0, Math.min(SERVICIOS_APPLICATION_STEP_COUNT - 1, n)),
    }));
  }, []);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const offerImageInputRef = useRef<HTMLInputElement>(null);
  const offerPdfInputRef = useRef<HTMLInputElement>(null);
  const [logoUrlDraft, setLogoUrlDraft] = useState("");
  const [coverUrlDraft, setCoverUrlDraft] = useState("");
  const [galleryUrlDraft, setGalleryUrlDraft] = useState("");
  const [videoUrlDraft, setVideoUrlDraft] = useState("");
  const [galleryZoneActive, setGalleryZoneActive] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [finalStepPublishBlocked, setFinalStepPublishBlocked] = useState<string | null>(null);
  const [mediaFlash, setMediaFlash] = useState<string | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!mediaFlash) return;
    const t = window.setTimeout(() => setMediaFlash(null), 4500);
    return () => window.clearTimeout(t);
  }, [mediaFlash]);

  useLayoutEffect(() => {
    clearLeonixReturningToEditSessionFlag();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await bootstrapServiciosApplicationStateAsync();
      if (!cancelled) {
        setState(next);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => void saveClasificadosServiciosApplicationResolved(state), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [state, hydrated]);

  useEffect(() => {
    if (step !== 8) setFinalStepPublishBlocked(null);
  }, [step]);

  useEffect(() => {
    if (
      step === 8 &&
      state.confirmListingAccurate &&
      state.confirmPhotosRepresentBusiness &&
      state.confirmCommunityRules
    ) {
      setFinalStepPublishBlocked(null);
    }
  }, [
    step,
    state.confirmListingAccurate,
    state.confirmPhotosRepresentBusiness,
    state.confirmCommunityRules,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    void saveClasificadosServiciosApplicationResolved(state);
   
  }, [
    hydrated,
    state.gallery,
    state.videos,
    state.featuredGalleryIds,
    state.coverUrl,
    state.logoUrl,
    state.offerImageUrl,
    state.offerPdfUrl,
  ]);

  useLeonixPublishLeaveGuard({
    lang,
    isDirty: hydrated && clasificadosServiciosApplicationHasProgress(state),
    muxAssetIds: [],
  });

  const previewHref = `/clasificados/publicar/servicios/preview?lang=${lang}`;
  const publicarHref = `/clasificados/publicar?lang=${lang}`;

  const goStrictPreview = useCallback(async () => {
    const r = evaluateServiciosPreviewReadiness(stateRef.current, lang);
    if (!r.ok) {
      setPreviewGateMissing(r.missing);
      const first = r.missing[0];
      if (first) {
        goToStep(first.stepIndex);
      }
      document.getElementById("servicios-step-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setPreviewGateMissing(null);
    markPublishFlowOpeningPreview();
    if (!(await persistServiciosDraftForPreviewNavigation(stateRef.current))) {
      setMediaFlash(copy.storageWriteFailed);
      return;
    }
    router.push(previewHref);
  }, [copy.storageWriteFailed, lang, previewHref, router, goToStep]);

  const openPublishModalFromFinalStep = useCallback(() => {
    const s = stateRef.current;
    if (!s.confirmListingAccurate || !s.confirmPhotosRepresentBusiness || !s.confirmCommunityRules) {
      setFinalStepPublishBlocked(copy.publishConfirmMissing);
      return;
    }
    setFinalStepPublishBlocked(null);
    setPublishOpen(true);
  }, [copy.publishConfirmMissing]);

  const deleteApplicationDraft = useCallback(async () => {
    if (!window.confirm(copy.deleteConfirm)) return;
    clearServiciosPreviewReturnHandoff();
    await clearServiciosDraftStorageAndIdb();
    setState(createDefaultClasificadosServiciosState());
    setPreviewGateMissing(null);
  }, [copy.deleteConfirm]);

  const preset = useMemo(() => getBusinessTypePreset(state.businessTypeId), [state.businessTypeId]);

  const contactSummaryLines = useMemo(() => {
    const L = copy.labels;
    const lines: string[] = [];
    if (state.enableWhatsapp && (digitsOnly(state.whatsapp).length >= 8 || (state.whatsappBusinessUrl.trim() && isProbablyValidWebUrl(state.whatsappBusinessUrl)))) {
      lines.push(L.contactSummaryWhatsapp);
    }
    if (state.enableCall && digitsOnly(state.phone).length >= 8) lines.push(L.contactSummaryCall);
    if (state.enableEmail && isValidEmail(state.email)) lines.push(L.contactSummaryEmail);
    if (state.enableWebsite && state.website.trim() && isProbablyValidWebUrl(state.website)) {
      lines.push(L.contactSummaryWebsite);
    }
    return lines;
  }, [
    copy.labels,
    state.enableCall,
    state.enableEmail,
    state.enableWebsite,
    state.enableWhatsapp,
    state.email,
    state.phone,
    state.website,
    state.whatsapp,
    state.whatsappBusinessUrl,
  ]);

  const listingPhase = useMemo(() => {
    const r = evaluateServiciosPreviewReadiness(state, lang);
    if (r.ok) return "publish" as const;
    if (state.businessTypeId && state.businessName.trim().length >= 2) return "preview" as const;
    return "draft" as const;
  }, [state, lang]);

  const listingPhaseLine =
    listingPhase === "publish"
      ? copy.listingPhasePublish
      : listingPhase === "preview"
        ? copy.listingPhasePreview
        : copy.listingPhaseDraft;

  const setBusinessType = useCallback((id: string) => {
    setState((prev) => mergeStateForBusinessTypeChange(prev, id));
  }, []);

  const websiteInvalid = state.website.trim() && !isProbablyValidWebUrl(state.website);
  const offerLinkInvalid = state.offerLink.trim() && !isProbablyValidWebUrl(state.offerLink);
  const emailInvalid = state.email.trim().length > 0 && !isValidEmail(state.email);
  const whatsappBizInvalid = state.whatsappBusinessUrl.trim().length > 0 && !isProbablyValidWebUrl(state.whatsappBusinessUrl);
  const socialInvalid = {
    ig: state.socialInstagram.trim() && !isProbablyValidWebUrl(state.socialInstagram),
    fb: state.socialFacebook.trim() && !isProbablyValidWebUrl(state.socialFacebook),
    yt: state.socialYoutube.trim() && !isProbablyValidWebUrl(state.socialYoutube),
    tt: state.socialTiktok.trim() && !isProbablyValidWebUrl(state.socialTiktok),
    li: state.socialLinkedin.trim() && !isProbablyValidWebUrl(state.socialLinkedin),
  };

  const toggleLangChip = (id: string) => {
    setState((prev) => {
      const on = !prev.languageIds.includes(id);
      if (!on && prev.languageIds.length <= 1) return prev;
      const languageIds = toggleId(prev.languageIds, id, on);
      let languageOtherLines = prev.languageOtherLines;
      if (id === "lang_otro" && !on) languageOtherLines = "";
      return { ...prev, languageIds, languageOtherLines };
    });
  };

  const toggleChipList = (
    field:
      | "selectedServiceIds"
      | "selectedReasonIds"
      | "selectedQuickFactIds"
      | "selectedBusinessHighlightIds",
    id: string,
  ) => {
    setState((prev) => {
      const cur = prev[field];
      const on = !cur.includes(id);
      if (!on) {
        return { ...prev, [field]: toggleId(cur, id, false) };
      }
      const max =
        field === "selectedServiceIds"
          ? MAX_SERVICES_SELECTION
          : field === "selectedReasonIds"
            ? MAX_REASONS_SELECTION
            : field === "selectedQuickFactIds"
              ? MAX_QUICK_FACTS_SELECTION
              : MAX_BUSINESS_HIGHLIGHT_PRESET_SELECTION;
      const customSlot =
        field === "selectedServiceIds" || field === "selectedBusinessHighlightIds"
          ? 0
          : field === "selectedReasonIds"
            ? prev.customReasonIncluded && prev.customReasonLabel.trim()
              ? 1
              : 0
            : prev.customQuickFactIncluded && prev.customQuickFactLabel.trim()
              ? 1
              : 0;
      if (cur.length + customSlot >= max) return prev;
      return { ...prev, [field]: toggleId(cur, id, true) };
    });
  };

  const serviceSelectionCount = useMemo(() => state.selectedServiceIds.length, [state.selectedServiceIds]);
  const reasonsSelectionCount = useMemo(
    () =>
      state.selectedReasonIds.length + (state.customReasonIncluded && state.customReasonLabel.trim() ? 1 : 0),
    [state.customReasonIncluded, state.customReasonLabel, state.selectedReasonIds],
  );
  const quickFactsSelectionCount = useMemo(
    () =>
      state.selectedQuickFactIds.length +
      (state.customQuickFactIncluded && state.customQuickFactLabel.trim() ? 1 : 0),
    [state.customQuickFactIncluded, state.customQuickFactLabel, state.selectedQuickFactIds],
  );
  const businessHighlightSelectionCount = useMemo(
    () => state.selectedBusinessHighlightIds.length,
    [state.selectedBusinessHighlightIds],
  );

  const pickFileToUrl = async (file: File | null, field: "logoUrl" | "coverUrl") => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMediaFlash(copy.labels.mediaWrongFileType);
      return;
    }
    const url = await readFileAsDataUrl(file);
    setState((prev) => ({ ...prev, [field]: url }));
  };

  const addGalleryFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const filesArr = Array.from(files);
    const arr = filesArr.filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0 && filesArr.length > 0) {
      setMediaFlash(copy.labels.mediaWrongFileType);
      return;
    }
    const additions: GalleryItem[] = [];
    for (const f of arr) {
      const url = await readFileAsDataUrl(f);
      additions.push({ id: newGalleryId(), url, source: "file" as const });
    }
    setState((prev) => {
      const room = Math.max(0, GALLERY_MAX - prev.gallery.length);
      if (room === 0) {
        queueMicrotask(() =>
          setMediaFlash(copy.labels.galleryLimitHint.replace("{max}", String(GALLERY_MAX))),
        );
        return prev;
      }
      const use = additions.slice(0, room);
      if (additions.length > use.length) {
        queueMicrotask(() =>
          setMediaFlash(copy.labels.galleryPartialAdd.replace("{max}", String(GALLERY_MAX))),
        );
      }
      const gallery = [...prev.gallery, ...use];
      const gIds = new Set(gallery.map((g) => g.id));
      const fg = prev.featuredGalleryIds.filter((id) => gIds.has(id));
      for (const a of use) {
        if (fg.length >= 4) break;
        if (!fg.includes(a.id)) fg.push(a.id);
      }
      return { ...prev, gallery, featuredGalleryIds: fg.slice(0, 4) };
    });
  };

  const addGalleryUrl = () => {
    const raw = galleryUrlDraft.trim();
    if (!raw) return;
    if (!isProbablyValidWebUrl(raw)) {
      setMediaFlash(copy.labels.invalidUrl);
      return;
    }
    const id = newGalleryId();
    setState((prev) => {
      if (prev.gallery.length >= GALLERY_MAX) {
        queueMicrotask(() =>
          setMediaFlash(copy.labels.galleryLimitHint.replace("{max}", String(GALLERY_MAX))),
        );
        return prev;
      }
      const gallery = [...prev.gallery, { id, url: normalizeHttpUrl(raw), source: "url" as const }];
      const gIds = new Set(gallery.map((g) => g.id));
      const fg = prev.featuredGalleryIds.filter((x) => gIds.has(x));
      if (fg.length < 4 && !fg.includes(id)) fg.push(id);
      return { ...prev, gallery, featuredGalleryIds: fg.slice(0, 4) };
    });
    setGalleryUrlDraft("");
  };

  const toggleFeaturedGallery = (id: string) => {
    setState((prev) => {
      let fg = [...prev.featuredGalleryIds];
      if (fg.includes(id)) fg = fg.filter((x) => x !== id);
      else {
        if (fg.length >= 4) fg = fg.slice(1);
        fg.push(id);
      }
      return { ...prev, featuredGalleryIds: fg.slice(0, 4) };
    });
  };

  const addVideoFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setMediaFlash(copy.labels.mediaWrongVideoType);
      return;
    }
    const url = await readFileAsDataUrl(file);
    setState((prev) => {
      if (prev.videos.length >= VIDEO_MAX) {
        queueMicrotask(() =>
          setMediaFlash(copy.labels.videosLimitHint.replace("{max}", String(VIDEO_MAX))),
        );
        return prev;
      }
      const row = { id: newVideoId(), url, source: "file" as const };
      const next = [...prev.videos, row].slice(0, VIDEO_MAX);
      if (prev.videos.length === 0) {
        return { ...prev, videos: [{ ...row, isPrimary: true }] };
      }
      const primaryId = prev.videos.find((v) => v.isPrimary === true)?.id ?? prev.videos[0]!.id;
      return { ...prev, videos: next.map((v) => ({ ...v, isPrimary: v.id === primaryId })) };
    });
  };

  const addVideoUrl = () => {
    const raw = videoUrlDraft.trim();
    if (!raw) return;
    if (!isProbablyValidWebUrl(raw)) {
      setMediaFlash(copy.labels.invalidUrl);
      return;
    }
    setState((prev) => {
      if (prev.videos.length >= VIDEO_MAX) {
        queueMicrotask(() =>
          setMediaFlash(copy.labels.videosLimitHint.replace("{max}", String(VIDEO_MAX))),
        );
        return prev;
      }
      const row = { id: newVideoId(), url: normalizeHttpUrl(raw), source: "url" as const };
      const next = [...prev.videos, row].slice(0, VIDEO_MAX);
      if (prev.videos.length === 0) {
        return { ...prev, videos: [{ ...row, isPrimary: true }] };
      }
      const primaryId = prev.videos.find((v) => v.isPrimary === true)?.id ?? prev.videos[0]!.id;
      return { ...prev, videos: next.map((v) => ({ ...v, isPrimary: v.id === primaryId })) };
    });
    setVideoUrlDraft("");
  };

  const setPrimaryVideoId = (id: string) => {
    setState((prev) => ({
      ...prev,
      videos: prev.videos.map((v) => ({ ...v, isPrimary: v.id === id })),
    }));
  };

  const applyUrlFallback = (field: "logoUrl" | "coverUrl", draft: string, clearDraft: () => void) => {
    const t = draft.trim();
    if (!t) return;
    if (!isProbablyValidWebUrl(t)) {
      setMediaFlash(copy.labels.invalidUrl);
      return;
    }
    setState((prev) => ({ ...prev, [field]: normalizeHttpUrl(t) }));
    clearDraft();
  };

  const updateHour = (day: DayKey, patch: Partial<(typeof state.hours)[0]>) => {
    setState((prev) => ({
      ...prev,
      hours: prev.hours.map((row) => (row.day === day ? { ...row, ...patch } : row)),
    }));
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F6F0E2] text-[#3D2C12]">
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:pb-12 sm:pt-8">
        <div className="mb-6 rounded-2xl border border-[#D8C79A]/60 bg-[#FFFDF7]/95 p-4 shadow-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7a62]">Leonix Clasificados</p>
          <h1 className="mt-2 text-xl font-extrabold tracking-tight text-[#3D2C12] sm:text-2xl">{copy.pageTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5D4A25]/90">{copy.pageSubtitle}</p>
          <Link
            href={publicarHref}
            className="mt-2 inline-flex min-h-[40px] items-center text-xs font-medium text-[#5D4A25]/85 underline underline-offset-2 hover:text-[#3D2C12]"
          >
            {copy.linkBack}
          </Link>

          <div className="mt-4 flex justify-end">
            <Link
              href={lang === "es" ? "?lang=en" : "?lang=es"}
              className="inline-flex min-h-[40px] items-center text-xs font-semibold text-[#5D4A25] underline underline-offset-2 hover:text-[#3B66AD]"
            >
              {copy.langToggle}
            </Link>
          </div>

          <div className="mt-4 border-t border-[#D8C79A]/40 pt-4">
            {hydrated ? (
              <p className="text-xs leading-relaxed text-[#7a6a52]">
                <span className="font-medium text-[#6b5c42]">{listingPhaseLine}</span>
                <span className="text-[#8a7a62]"> · </span>
                <span>{copy.saveHint}</span>
              </p>
            ) : (
              <p className="text-xs text-[#8a7a62]">…</p>
            )}
            {previewGateMissing?.length ? (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950" role="status">
                <p className="font-semibold leading-snug">{copy.previewMissingBanner}</p>
                <ul className="mt-2 list-inside list-disc space-y-2">
                  {previewGateMissing.map((m) => (
                    <li key={m.id} className="leading-snug">
                      <span className="font-semibold text-amber-950">
                        {stepLabels[m.stepIndex] ?? `${lang === "es" ? "Paso" : "Step"} ${m.stepIndex + 1}`}
                      </span>
                      <span className="text-amber-950/90"> — {m.label}</span>{" "}
                      <button
                        type="button"
                        className="ml-1 align-baseline text-xs font-semibold text-[#2d528d] underline underline-offset-2"
                        onClick={() => goToStep(m.stepIndex)}
                      >
                        {copy.goToStep.replace("{n}", String(m.stepIndex + 1))}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="lg:sticky lg:top-24 lg:w-60 lg:shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] lg:hidden">
              {stepShortLabels.map((short, i) => (
                <button
                  key={`servicios-step-tab-${i}`}
                  type="button"
                  onClick={() => goToStep(i)}
                  className={[
                    "shrink-0 touch-manipulation rounded-full border px-3 py-2 text-left text-xs font-semibold transition",
                    step === i
                      ? "border-[#3B66AD] bg-[#3B66AD]/10 text-[#1e3a5f] ring-1 ring-[#3B66AD]/20"
                      : "border-[#D8C79A]/70 bg-white/90 text-[#5D4A25] hover:border-[#3B66AD]/40",
                  ].join(" ")}
                >
                  <span className="tabular-nums text-[#8a7a62]">{i + 1}.</span> {short}
                </button>
              ))}
            </div>
            <nav
              className="hidden rounded-2xl border border-[#D8C79A]/50 bg-[#FFFDF7]/90 p-3 shadow-sm lg:block"
              aria-label={lang === "es" ? "Pasos del formulario" : "Form steps"}
            >
              <ol className="space-y-1">
                {stepLabels.map((lab, i) => (
                  <li key={lab}>
                    <button
                      type="button"
                      onClick={() => goToStep(i)}
                      className={[
                        "flex w-full touch-manipulation items-start gap-2 rounded-xl px-2 py-2 text-left text-sm transition",
                        step === i
                          ? "bg-[#3B66AD]/12 font-semibold text-[#1e3a5f] ring-1 ring-[#3B66AD]/20"
                          : "text-[#5D4A25] hover:bg-white/80",
                      ].join(" ")}
                    >
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F6F0E2] text-xs font-bold tabular-nums text-[#3D2C12]">
                        {i + 1}
                      </span>
                      <span className="min-w-0 leading-snug">{lab}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div id="servicios-step-panel" className="min-w-0 flex-1 space-y-4">
            <div className="rounded-xl border border-[#D8C79A]/50 bg-[#FFFDF7]/80 px-3 py-2.5 text-sm text-[#5D4A25] shadow-sm">
              <span className="font-medium text-[#8a7a62]">{lang === "es" ? "Paso" : "Step"}</span>{" "}
              <strong className="tabular-nums text-[#3D2C12]">{step + 1}</strong>
              <span className="text-[#8a7a62]"> / {totalSteps}</span>
              <span className="text-[#8a7a62]"> · </span>
              <span className="font-semibold text-[#3D2C12]">{stepLabelActive}</span>
            </div>

        {mediaFlash ? (
          <p
            className="rounded-xl border border-amber-200/90 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-950 shadow-sm"
            role="status"
            aria-live="polite"
          >
            {mediaFlash}
          </p>
        ) : null}
        {step === 0 ? (
          <>
        {/* 1 · Tipo */}
        <section className={sectionCard} aria-labelledby="sec-type">
          <h2 id="sec-type" className="text-lg font-bold text-[#3D2C12]">
            {copy.sections.type}
          </h2>
          <p className="mt-1 text-sm text-[#5D4A25]/85">
            {lang === "es"
              ? "Elige el giro real de tu negocio. No necesitas navegar árboles de categorías."
              : "Pick your real trade. No category trees to navigate."}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#6b5c42]">
            {lang === "es"
              ? "¿No encuentras tu categoría? Usa “Otro servicio” o “No veo mi categoría” y detalla en servicios y descripción."
              : "Don’t see your trade? Pick “Other service” or “I don’t see my category,” then describe your offer in Services and About."}
          </p>
          <label className={`mt-4 block ${labelClass}`}>
            {copy.labels.businessType} <span className="text-red-600">*</span>
          </label>
          <select
            className={inputClass}
            value={state.businessTypeId}
            onChange={(e) => setBusinessType(e.target.value)}
            required
          >
            <option value="">{lang === "es" ? "Selecciona…" : "Select…"}</option>
            {BUSINESS_TYPE_PRESETS.filter(p => p.id !== "servicio_no_listado").map((p) => (
              <option key={p.id} value={p.id}>
                {lang === "en" ? p.labelEn : p.labelEs}
              </option>
            ))}
          </select>

          {state.businessTypeId === "servicio_otro_generico" && (
            <div className="mt-4">
              <label className={`block ${labelClass}`}>
                {lang === "es" ? "Describe tu servicio" : "Describe your service"}
              </label>
              <input
                className={inputClass}
                value={state.customServiceDescription ?? ""}
                onChange={(e) => setState((s) => ({ ...s, customServiceDescription: e.target.value }))}
                placeholder={lang === "es" ? "Ej. Reparación de celulares" : "e.g. Cell phone repair"}
              />
            </div>
          )}

          <div className="mt-4 text-sm">
            <button
              type="button"
              onClick={() => console.log("No veo mi categoría clicked - placeholder for help modal")}
              className="text-[#3B66AD] underline hover:text-[#2f5699]"
            >
              {lang === "es" ? "¿No ves tu categoría?" : "Don't see your category?"}
            </button>
          </div>
        </section>
          </>
        ) : null}

        {step === 1 ? (
          <>
        {/* 2 · Basic */}
        <section className={sectionCard} aria-labelledby="sec-basic">
          <h2 id="sec-basic" className="text-lg font-bold text-[#3D2C12]">
            {copy.sections.basic}
          </h2>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>
                {copy.labels.businessName} <span className="text-red-600">*</span>
              </label>
              <input
                className={inputClass}
                value={state.businessName}
                onChange={(e) => setState((s) => ({ ...s, businessName: e.target.value }))}
                autoComplete="organization"
              />
            </div>
            <div>
              <label className={labelClass}>
                {copy.labels.city} <span className="text-red-600">*</span>
              </label>
              {copy.labels.cityHelp.trim() ? (
                <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.cityHelp}</p>
              ) : null}
              <input
                className={inputClass}
                value={state.city}
                placeholder={copy.labels.cityPlaceholder}
                onChange={(e) => setState((s) => ({ ...s, city: e.target.value }))}
                autoComplete="address-level2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{copy.labels.serviceAreas}</label>
              <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.serviceAreasHelp}</p>
              <textarea
                className={inputClass}
                rows={2}
                value={state.serviceAreaNotes}
                onChange={(e) => setState((s) => ({ ...s, serviceAreaNotes: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-2 mt-1 border-t border-[#D8C79A]/35 pt-6">
              <h3 className="text-base font-bold text-[#3D2C12]">{copy.labels.physicalAddressSection}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.physicalAddressIntro}</p>
              <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>{copy.labels.physicalStreet}</label>
                  <input
                    className={inputClass}
                    value={state.physicalStreet}
                    onChange={(e) => setState((s) => ({ ...s, physicalStreet: e.target.value }))}
                    autoComplete="street-address"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{copy.labels.physicalSuite}</label>
                  <input
                    className={inputClass}
                    value={state.physicalSuite}
                    onChange={(e) => setState((s) => ({ ...s, physicalSuite: e.target.value }))}
                    autoComplete="address-line2"
                  />
                </div>
                <div>
                  <label className={labelClass}>{copy.labels.physicalAddressCity}</label>
                  <input
                    className={inputClass}
                    value={state.physicalAddressCity}
                    onChange={(e) => setState((s) => ({ ...s, physicalAddressCity: e.target.value }))}
                    autoComplete="address-level2"
                  />
                </div>
                <div>
                  <label className={labelClass}>{copy.labels.physicalRegion}</label>
                  <input
                    className={inputClass}
                    value={state.physicalRegion}
                    onChange={(e) => setState((s) => ({ ...s, physicalRegion: e.target.value }))}
                    autoComplete="address-level1"
                  />
                </div>
                <div className="sm:col-span-2 sm:max-w-xs">
                  <label className={labelClass}>{copy.labels.physicalPostalCode}</label>
                  <input
                    className={inputClass}
                    value={state.physicalPostalCode}
                    onChange={(e) => setState((s) => ({ ...s, physicalPostalCode: e.target.value }))}
                    autoComplete="postal-code"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 mt-2 border-t border-[#D8C79A]/35 pt-6">
              <h3 className="text-base font-bold text-[#3D2C12]">{copy.labels.contactPhonesHeading}</h3>
              <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{copy.labels.phone}</label>
                  <input
                    className={inputClass}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder={lang === "es" ? "(713) 555-0100" : "(713) 555-0100"}
                    value={formatPhoneInputDisplay(state.phone)}
                    onChange={(e) => setState((s) => ({ ...s, phone: formatPhoneInputDisplay(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>{copy.labels.phoneOffice}</label>
                  <input
                    className={inputClass}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder={lang === "es" ? "(415) 555-0199" : "(415) 555-0199"}
                    value={formatPhoneInputDisplay(state.phoneOffice)}
                    onChange={(e) => setState((s) => ({ ...s, phoneOffice: formatPhoneInputDisplay(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>{copy.labels.whatsapp}</label>
                  <input
                    className={inputClass}
                    type="tel"
                    inputMode="numeric"
                    placeholder={lang === "es" ? "(713) 555-0100" : "(713) 555-0100"}
                    value={formatPhoneInputDisplay(state.whatsapp)}
                    onChange={(e) => setState((s) => ({ ...s, whatsapp: formatPhoneInputDisplay(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>{copy.labels.whatsappBusinessUrl}</label>
                  <input
                    className={`${inputClass} ${whatsappBizInvalid ? inputWarn : ""}`}
                    type="url"
                    inputMode="url"
                    placeholder={lang === "es" ? "https://wa.me/… o https://api.whatsapp.com/…" : "https://wa.me/…"}
                    value={state.whatsappBusinessUrl}
                    onChange={(e) => setState((s) => ({ ...s, whatsappBusinessUrl: e.target.value }))}
                  />
                  {whatsappBizInvalid ? <p className="mt-1 text-xs text-amber-800">{copy.labels.invalidUrl}</p> : null}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{copy.labels.quoteMessagePhone}</label>
                  <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.quoteMessagePhoneHelp}</p>
                  <input
                    className={`${inputClass} mt-2`}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder={lang === "es" ? "(408) 555-7777" : "(408) 555-7777"}
                    value={formatPhoneInputDisplay(state.quoteMessagePhone)}
                    onChange={(e) => setState((s) => ({ ...s, quoteMessagePhone: formatPhoneInputDisplay(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 mt-2 border-t border-[#D8C79A]/35 pt-6">
              <h3 className="text-base font-bold text-[#3D2C12]">{copy.labels.contactEmailWebHeading}</h3>
              <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{copy.labels.email}</label>
                  <input
                    className={`${inputClass} ${emailInvalid ? inputWarn : ""}`}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={lang === "es" ? "contacto@tunegocio.com" : "hello@yourbusiness.com"}
                    value={state.email}
                    onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
                  />
                  {emailInvalid ? <p className="mt-1 text-xs text-amber-800">{copy.labels.invalidEmail}</p> : null}
                </div>
                <div>
                  <label className={labelClass}>{copy.labels.website}</label>
                  <input
                    className={`${inputClass} ${websiteInvalid ? inputWarn : ""}`}
                    type="url"
                    inputMode="url"
                    placeholder={lang === "es" ? "https://www.tunegocio.com" : "https://www.yourbusiness.com"}
                    value={state.website}
                    onChange={(e) => setState((s) => ({ ...s, website: e.target.value }))}
                  />
                  {websiteInvalid ? <p className="mt-1 text-xs text-amber-800">{copy.labels.invalidUrl}</p> : null}
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 mt-2 border-t border-[#D8C79A]/35 pt-6">
              <h3 className="text-base font-bold text-[#3D2C12]">{copy.labels.contactSocialHeading}</h3>
              <p className="mt-1 text-xs text-[#6b5c42]">
                {lang === "es"
                  ? "Pega la URL pública de cada red (perfil o página), no solo el nombre de usuario."
                  : "Paste each network’s public profile or page URL, not just a handle."}
              </p>
              <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                {(
                  [
                    ["socialInstagram", copy.labels.instagram, state.socialInstagram, socialInvalid.ig, "https://www.instagram.com/tunegocio"] as const,
                    ["socialFacebook", copy.labels.facebook, state.socialFacebook, socialInvalid.fb, "https://www.facebook.com/tunegocio"] as const,
                    ["socialYoutube", copy.labels.youtube, state.socialYoutube, socialInvalid.yt, "https://www.youtube.com/@canal"] as const,
                    ["socialTiktok", copy.labels.tiktok, state.socialTiktok, socialInvalid.tt, "https://www.tiktok.com/@cuenta"] as const,
                    ["socialLinkedin", copy.labels.linkedin, state.socialLinkedin, socialInvalid.li, "https://www.linkedin.com/company/…"] as const,
                  ] as const
                ).map(([key, lab, val, inv, ph]) => (
                  <div key={key}>
                    <label className={labelClass}>{lab}</label>
                    <input
                      className={`${inputClass} ${inv ? inputWarn : ""}`}
                      type="url"
                      inputMode="url"
                      placeholder={ph}
                      value={val}
                      onChange={(e) => setState((s) => ({ ...s, [key]: e.target.value }))}
                    />
                    {inv ? <p className="mt-1 text-xs text-amber-800">{copy.labels.invalidUrl}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 mt-2 border-t border-[#D8C79A]/35 pt-6">
              <p className={labelClass}>{copy.labels.languages}</p>
              <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0">
                {LANGUAGE_OPTION_CHIPS.map((c) => (
                  <Chip
                    key={c.id}
                    selected={state.languageIds.includes(c.id)}
                    onClick={() => toggleLangChip(c.id)}
                  >
                    {lang === "en" ? c.en : c.es}
                  </Chip>
                ))}
              </div>
              {state.languageIds.includes("lang_otro") ? (
                <label className={`mt-3 block ${labelClass}`}>
                  {copy.labels.languageOtherLabel}
                  <p className="mt-1 text-xs font-normal text-[#6b5c42]">{copy.labels.languageOtherHelp}</p>
                  <textarea
                    className={`${inputClass} min-h-[88px]`}
                    value={state.languageOtherLines}
                    placeholder={copy.labels.languageOtherPlaceholder}
                    onChange={(e) => setState((s) => ({ ...s, languageOtherLines: e.target.value }))}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
              ) : null}
            </div>
          </div>
        </section>
          </>
        ) : null}

        {step === 2 ? (
          <>
        {/* 3 · Media */}
        <section className={sectionCard} aria-labelledby="sec-media">
          <h2 id="sec-media" className="text-lg font-bold text-[#3D2C12]">
            {copy.sections.media}{" "}
            <span className="text-sm font-semibold text-red-600" aria-hidden>
              *
            </span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5D4A25]/90">{copy.labels.mediaStructureIntro}</p>
          <p className="mt-1 text-xs font-medium text-[#8a4a12]">
            {lang === "es"
              ? "* Requiere portada o al menos una imagen destacada en la galería."
              : "* Requires a cover or at least one featured gallery image."}
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs leading-relaxed text-[#6b5c42]">
            <li>{copy.labels.galleryFeaturedHint}</li>
            <li>{copy.labels.galleryMoreHint}</li>
            <li>{copy.labels.galleryMultiSelectHint}</li>
            <li>{copy.labels.videosHint}</li>
          </ul>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <p className={labelClass}>{copy.labels.logo}</p>
              <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.logoHelp}</p>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pickFileToUrl(e.target.files?.[0] ?? null, "logoUrl")} />
              <div
                role="button"
                tabIndex={0}
                aria-label={state.logoUrl ? copy.labels.replace : copy.labels.upload}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    logoInputRef.current?.click();
                  }
                }}
                onClick={() => logoInputRef.current?.click()}
                className="mt-2 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8C79A]/80 bg-[#FFFCF7] px-4 py-8 text-center transition hover:border-[#3B66AD]/50"
              >
                {state.logoUrl ? (
                  <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-neutral-200 bg-white ring-2 ring-[#3B66AD]/15">
                    <Image src={state.logoUrl} alt="" fill className="object-contain" unoptimized />
                  </div>
                ) : (
                  <>
                    <FiUpload className="h-8 w-8 text-[#B28A2F]" aria-hidden />
                    <span className="mt-2 text-sm font-semibold text-[#3D2C12]">{copy.labels.upload}</span>
                  </>
                )}
              </div>
              {state.logoUrl ? (
                <p className="mt-2 text-xs font-medium text-[#2d528d]">{copy.labels.mediaUploadedBadge}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {state.logoUrl ? (
                  <>
                    <button
                      type="button"
                      className="min-h-[40px] text-xs font-semibold text-[#3B66AD] underline"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {copy.labels.replace}
                    </button>
                    <button type="button" className="min-h-[40px] text-xs font-semibold text-red-700 underline" onClick={() => setState((s) => ({ ...s, logoUrl: "" }))}>
                      {copy.labels.remove}
                    </button>
                  </>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-[#5D4A25]/75">{copy.labels.urlFallback}</p>
              <div className="mt-1 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  className={`${inputClass} sm:min-w-0 sm:flex-1`}
                  placeholder="https://"
                  value={logoUrlDraft}
                  onChange={(e) => setLogoUrlDraft(e.target.value)}
                />
                <button
                  type="button"
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 py-2 text-sm font-semibold text-white sm:px-3"
                  onClick={() => applyUrlFallback("logoUrl", logoUrlDraft, () => setLogoUrlDraft(""))}
                >
                  {copy.labels.addUrl}
                </button>
              </div>
            </div>

            <div>
              <p className={labelClass}>{copy.labels.cover}</p>
              <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.coverHelp}</p>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pickFileToUrl(e.target.files?.[0] ?? null, "coverUrl")} />
              <div
                role="button"
                tabIndex={0}
                aria-label={state.coverUrl ? copy.labels.replace : copy.labels.upload}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    coverInputRef.current?.click();
                  }
                }}
                onClick={() => coverInputRef.current?.click()}
                className="mt-2 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8C79A]/80 bg-[#FFFCF7] px-4 py-8 text-center hover:border-[#3B66AD]/50"
              >
                {state.coverUrl ? (
                  <div className="relative h-40 w-full max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 ring-2 ring-[#3B66AD]/15">
                    <Image src={state.coverUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <>
                    <FiImage className="h-10 w-10 text-[#B28A2F]" aria-hidden />
                    <span className="mt-2 text-sm font-semibold text-[#3D2C12]">{copy.labels.upload}</span>
                  </>
                )}
              </div>
              {state.coverUrl ? (
                <p className="mt-2 text-xs font-medium text-[#2d528d]">{copy.labels.mediaUploadedBadge}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {state.coverUrl ? (
                  <>
                    <button type="button" className="min-h-[40px] text-xs font-semibold text-[#3B66AD] underline" onClick={() => coverInputRef.current?.click()}>
                      {copy.labels.replace}
                    </button>
                    <button type="button" className="min-h-[40px] text-xs font-semibold text-red-700 underline" onClick={() => setState((s) => ({ ...s, coverUrl: "" }))}>
                      {copy.labels.remove}
                    </button>
                  </>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-[#5D4A25]/75">{copy.labels.urlFallback}</p>
              <div className="mt-1 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  className={`${inputClass} sm:min-w-0 sm:flex-1`}
                  placeholder="https://"
                  value={coverUrlDraft}
                  onChange={(e) => setCoverUrlDraft(e.target.value)}
                />
                <button
                  type="button"
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 py-2 text-sm font-semibold text-white sm:px-3"
                  onClick={() => applyUrlFallback("coverUrl", coverUrlDraft, () => setCoverUrlDraft(""))}
                >
                  {copy.labels.addUrl}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-[#D8C79A]/30 pt-8">
            <p className={labelClass}>{copy.labels.gallery}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.galleryListOrderHint}</p>
            <p className="mt-2 text-xs font-semibold tabular-nums text-[#5D4A25]">
              {copy.labels.galleryCountLine.replace("{n}", String(state.gallery.length)).replace("{max}", String(GALLERY_MAX))}
            </p>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void addGalleryFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div
              role="button"
              tabIndex={0}
              aria-label={`${copy.labels.upload} — ${copy.labels.gallery}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  galleryInputRef.current?.click();
                }
              }}
              onClick={() => galleryInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setGalleryZoneActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                const rel = e.relatedTarget as Node | null;
                if (rel && e.currentTarget.contains(rel)) return;
                setGalleryZoneActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setGalleryZoneActive(false);
                void addGalleryFiles(e.dataTransfer.files);
              }}
              className={[
                "mt-3 flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition",
                galleryZoneActive
                  ? "border-[#3B66AD] bg-[#3B66AD]/5"
                  : "border-[#D8C79A]/80 bg-[#FFFCF7] hover:border-[#3B66AD]/45",
              ].join(" ")}
            >
              <FiUpload className="h-7 w-7 text-[#B28A2F]" aria-hidden />
              <span className="mt-2 text-sm font-semibold text-[#3D2C12]">{copy.labels.upload}</span>
              <span className="mt-1 max-w-sm text-xs text-[#6b5c42]">{copy.labels.dropzone}</span>
            </div>
            <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
              <input
                className={`${inputClass} min-w-0 sm:max-w-md sm:flex-1`}
                placeholder="https://…"
                value={galleryUrlDraft}
                onChange={(e) => setGalleryUrlDraft(e.target.value)}
              />
              <button
                type="button"
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-semibold text-white"
                onClick={addGalleryUrl}
              >
                {copy.labels.addUrl}
              </button>
            </div>
            {state.gallery.length >= GALLERY_MAX ? (
              <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.galleryLimitHint.replace("{max}", String(GALLERY_MAX))}</p>
            ) : null}
            {state.gallery.length > 0 ? (
              <p className="mt-3 text-xs font-semibold text-[#5D4A25]">
                {copy.labels.galleryStatusLine
                  .replace("{total}", String(state.gallery.length))
                  .replace("{featured}", String(state.featuredGalleryIds.length))}
              </p>
            ) : null}
            {state.gallery.length > 0 ? (
              <>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#5D4A25]">{copy.labels.featuredStripTitle}</p>
                <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.featuredStripHint}</p>
              </>
            ) : null}
            {state.gallery.length === 0 ? (
              <p className="mt-4 text-sm text-[#8a7a62]">{copy.labels.emptyGallery}</p>
            ) : (
              <ServiciosPublishSortableGallery
                gallery={state.gallery}
                featuredGalleryIds={state.featuredGalleryIds}
                lang={lang}
                copy={{
                  assetFromFile: copy.labels.assetFromFile,
                  assetFromUrl: copy.labels.assetFromUrl,
                  featuredToggle: copy.labels.featuredToggle,
                }}
                onReorder={(nextGallery, nextFeaturedIds) =>
                  setState((s) => ({ ...s, gallery: nextGallery, featuredGalleryIds: nextFeaturedIds }))
                }
                onRemove={(id) =>
                  setState((s) => ({
                    ...s,
                    gallery: s.gallery.filter((x) => x.id !== id),
                    featuredGalleryIds: s.featuredGalleryIds.filter((fid) => fid !== id),
                  }))
                }
                onToggleFeatured={toggleFeaturedGallery}
              />
            )}
          </div>

          <div className="mt-10 border-t border-[#D8C79A]/40 pt-8">
            <p className={labelClass}>{copy.labels.videosTitle}</p>
            <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.videosHint}</p>
            <p className="mt-2 text-xs font-semibold tabular-nums text-[#5D4A25]">
              {copy.labels.videosCountLine.replace("{n}", String(state.videos.length)).replace("{max}", String(VIDEO_MAX))}
            </p>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => void addVideoFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={state.videos.length >= VIDEO_MAX}
              className="mt-3 inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D8C79A]/80 bg-[#FFFCF7] px-4 py-3 text-sm font-semibold text-[#3D2C12] hover:border-[#3B66AD]/45 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <FiPlus className="h-4 w-4" aria-hidden />
              {copy.labels.upload}
            </button>
            <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
              <input
                className={`${inputClass} min-w-0 sm:max-w-md sm:flex-1`}
                placeholder={copy.labels.videoUrlPlaceholder}
                value={videoUrlDraft}
                onChange={(e) => setVideoUrlDraft(e.target.value)}
              />
              <button
                type="button"
                disabled={state.videos.length >= VIDEO_MAX}
                className="inline-flex min-h-[44px] w-full shrink-0 touch-manipulation items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
                onClick={addVideoUrl}
              >
                {copy.labels.addVideoUrl}
              </button>
            </div>
            {state.videos.length >= VIDEO_MAX ? (
              <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.videosLimitHint.replace("{max}", String(VIDEO_MAX))}</p>
            ) : null}
            {state.videos.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {state.videos.map((v) => {
                  const url = v.url ?? "";
                  const isData = url.startsWith("data:");
                  const previewLine = isData ? copy.labels.videoFromFile : copy.labels.videoFromUrl;
                  const detail = isData ? "—" : url.length > 56 ? `${url.slice(0, 56)}…` : url || "—";
                  return (
                    <li
                      key={v.id}
                      className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="inline-flex rounded-full bg-[#3B66AD]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2d528d]">
                          {previewLine}
                        </span>
                        <p className="mt-1 break-all text-xs font-medium text-[#3D2C12]">{detail}</p>
                        {url && (url.startsWith("data:video") || url.startsWith("http")) ? (
                          <video
                            src={url}
                            controls
                            muted
                            playsInline
                            className="mt-2 max-h-44 w-full rounded-lg border border-neutral-200 bg-black/5"
                          />
                        ) : null}
                      </div>
                      <div className="flex w-full flex-col gap-2 border-t border-neutral-100 pt-2 sm:w-auto sm:flex-row sm:items-center sm:border-t-0 sm:pt-0">
                        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-xs font-medium text-[#5D4A25]">
                          <input
                            type="radio"
                            name="primary-video"
                            checked={v.isPrimary === true}
                            onChange={() => setPrimaryVideoId(v.id)}
                            className="h-4 w-4 text-[#3B66AD]"
                          />
                          {copy.labels.videoPrimary}
                        </label>
                        <button
                          type="button"
                          className="min-h-[44px] self-start text-left text-xs font-semibold text-red-700 hover:underline sm:self-center"
                          onClick={() => setState((s) => ({ ...s, videos: s.videos.filter((x) => x.id !== v.id) }))}
                        >
                          {copy.labels.remove}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </section>
          </>
        ) : null}

        {step === 3 ? (
          <>
        {/* 4 · About */}
        <section className={sectionCard}>
          <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.about}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/80">{copy.labels.aboutHelper}</p>
          <p className="mt-2 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.aboutServicesGapNote}</p>
          <label className={`mt-4 block ${labelClass}`}>
            {copy.labels.about} <span className="text-red-600">*</span>
          </label>
          <textarea
            className={inputClass}
            rows={5}
            value={state.aboutText}
            onChange={(e) => setState((s) => ({ ...s, aboutText: e.target.value }))}
          />
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.businessFocus}</label>
          <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.businessFocusHelper}</p>
          <input
            className={inputClass}
            value={state.specialtiesLine}
            maxLength={90}
            onChange={(e) => setState((s) => ({ ...s, specialtiesLine: e.target.value }))}
          />
        </section>
          </>
        ) : null}

        {step === 4 ? (
          <>
        {preset ? (
          <>
            <section className={sectionCard}>
              <h2 className="text-lg font-bold text-[#3D2C12]">
                {copy.sections.services}{" "}
                <span className="text-sm font-semibold text-red-600" aria-hidden>
                  *
                </span>
              </h2>
              <p className="mt-1 text-sm text-[#5D4A25]/85">{copy.labels.servicesHint}</p>
              <p className="mt-4 text-sm font-semibold text-[#3D2C12]">{copy.labels.servicesSuggestedHeading}</p>
              <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0">
                {preset.suggestedServices.map((c: ChipDef) => {
                  const selected = state.selectedServiceIds.includes(c.id);
                  const disabled = !selected && serviceSelectionCount >= MAX_SERVICES_SELECTION;
                  return (
                    <Chip
                      key={c.id}
                      selected={selected}
                      onClick={() => {
                        if (disabled) return;
                        toggleChipList("selectedServiceIds", c.id);
                      }}
                      className={disabled ? "cursor-not-allowed opacity-45" : undefined}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[0.95rem] leading-none" aria-hidden>
                          {
                            resolveServiciosServiceVisual({
                              id: c.id,
                              label: chipLabel(c, lang),
                              businessTypeId: state.businessTypeId,
                            }).emoji
                          }
                        </span>
                        {chipLabel(c, lang)}
                      </span>
                    </Chip>
                  );
                })}
              </div>
              {serviceSelectionCount >= MAX_SERVICES_SELECTION ? (
                <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.selectionMaxSuggestedPresets}</p>
              ) : null}
              <label className={`mt-6 block ${labelClass}`}>{copy.labels.addOtherServiceHeading}</label>
              <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.customChipShortHint}</p>
              <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  className={inputClass}
                  placeholder={copy.labels.customServicePlaceholder}
                  maxLength={CUSTOM_CHIP_MAX_LENGTH}
                  value={state.customServiceLabel}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, CUSTOM_CHIP_MAX_LENGTH);
                    setState((s) => ({ ...s, customServiceLabel: v }));
                  }}
                />
                <button
                  type="button"
                  disabled={
                    !state.customServiceLabel.trim() ||
                    state.customServicesOffered.length >= MAX_CUSTOM_SERVICES_OFFERED
                  }
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  onClick={() => {
                    setState((prev) => {
                      const r = evaluateAddCustomServiceOffered(prev, lang, prev.customServiceLabel);
                      if (!r.ok) return prev;
                      return enforceServiciosSelectionCaps({
                        ...prev,
                        customServicesOffered: [...prev.customServicesOffered, r.label],
                        customServiceLabel: "",
                      });
                    });
                  }}
                >
                  {copy.labels.addCustomChip}
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.customServicesHelperHint}</p>
              {state.customServicesOffered.length >= MAX_CUSTOM_SERVICES_OFFERED ? (
                <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.customServicesMax}</p>
              ) : null}
              {state.customServicesOffered.length > 0 ? (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-[#3D2C12]">{copy.labels.addedCustomServicesSection}</p>
                  <div className="-mx-1 mt-2 flex flex-wrap gap-2 px-1">
                    {state.customServicesOffered.map((label, i) => (
                      <button
                        key={`cso-${i}-${label}`}
                        type="button"
                        title={label}
                        aria-label={`${copy.labels.remove}: ${label}`}
                        onClick={() =>
                          setState((prev) =>
                            enforceServiciosSelectionCaps({
                              ...prev,
                              customServicesOffered: prev.customServicesOffered.filter((_, j) => j !== i),
                            }),
                          )
                        }
                        className="inline-flex max-w-full min-w-0 min-h-[40px] touch-manipulation items-center gap-1.5 rounded-full border border-[#3B66AD] bg-[#3B66AD]/10 px-3 py-2 text-left text-sm font-medium text-[#1e3a5f] ring-1 ring-[#3B66AD]/20 transition active:scale-[0.99] hover:bg-[#3B66AD]/15"
                      >
                        <span className="shrink-0 text-[0.95rem] leading-none" aria-hidden>
                          {
                            resolveServiciosServiceVisual({
                              id: `custom_offer_${i}`,
                              label,
                              businessTypeId: state.businessTypeId,
                            }).emoji
                          }
                        </span>
                        <span className="min-w-0 max-w-[14rem] truncate sm:max-w-[18rem]">{label}</span>
                        <FiX className="h-3.5 w-3.5 shrink-0 text-[#1e3a5f]/70" aria-hidden />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section className={sectionCard}>
              <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.reasons}</h2>
              <p className="mt-1 text-sm text-[#5D4A25]/85">{copy.labels.reasonsHint}</p>
              <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0">
                {preset.reasonsToChoose.map((c: ChipDef) => {
                  const selected = state.selectedReasonIds.includes(c.id);
                  const disabled = !selected && reasonsSelectionCount >= MAX_REASONS_SELECTION;
                  return (
                    <Chip
                      key={c.id}
                      selected={selected}
                      onClick={() => {
                        if (disabled) return;
                        toggleChipList("selectedReasonIds", c.id);
                      }}
                      className={disabled ? "cursor-not-allowed opacity-45" : undefined}
                    >
                      {chipLabel(c, lang)}
                    </Chip>
                  );
                })}
                {state.customReasonIncluded && state.customReasonLabel.trim() ? (
                  <Chip
                    selected
                    truncateLabel
                    labelTitle={state.customReasonLabel.trim()}
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        customReasonIncluded: false,
                        customReasonLabel: "",
                      }))
                    }
                  >
                    {state.customReasonLabel.trim()}
                  </Chip>
                ) : null}
              </div>
              {reasonsSelectionCount >= MAX_REASONS_SELECTION ? (
                <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.selectionMaxThree}</p>
              ) : null}
              <label className={`mt-6 block ${labelClass}`}>{copy.labels.customReason}</label>
              <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.customChipShortHint}</p>
              <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  className={inputClass}
                  placeholder={copy.labels.customChipPlaceholder}
                  maxLength={CUSTOM_CHIP_MAX_LENGTH}
                  disabled={
                    !state.customReasonIncluded && state.selectedReasonIds.length >= MAX_REASONS_SELECTION
                  }
                  value={state.customReasonLabel}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, CUSTOM_CHIP_MAX_LENGTH);
                    setState((s) => ({
                      ...s,
                      customReasonLabel: v,
                      customReasonIncluded: v.trim().length > 0 ? s.customReasonIncluded : false,
                    }));
                  }}
                />
                {state.customReasonIncluded ? (
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-neutral-50 sm:w-auto"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        customReasonIncluded: false,
                        customReasonLabel: "",
                      }))
                    }
                  >
                    {copy.labels.remove}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={
                      !state.customReasonLabel.trim() ||
                      state.selectedReasonIds.length +
                        (state.customReasonIncluded ? 1 : 0) >=
                        MAX_REASONS_SELECTION
                    }
                    className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    onClick={() => {
                      const t = state.customReasonLabel.trim();
                      if (!t) return;
                      if (
                        state.selectedReasonIds.length +
                          (state.customReasonIncluded ? 1 : 0) >=
                        MAX_REASONS_SELECTION
                      ) {
                        return;
                      }
                      setState((s) => ({
                        ...s,
                        customReasonIncluded: true,
                        customReasonLabel: t.slice(0, CUSTOM_CHIP_MAX_LENGTH),
                      }));
                    }}
                  >
                    {copy.labels.addCustomChip}
                  </button>
                )}
              </div>
            </section>

            <section className={sectionCard}>
              <h2 className="text-lg font-bold text-[#3D2C12]">{copy.labels.highlightsSectionTitle}</h2>
              <p className="mt-1 text-sm text-[#5D4A25]/85">{copy.labels.highlightsSectionHelper}</p>
              <p className="mt-4 text-sm font-semibold text-[#3D2C12]">{copy.labels.highlightsSuggestedHeading}</p>
              <div className="-mx-1 mt-2 flex flex-wrap gap-2 px-1 pb-1">
                {BUSINESS_HIGHLIGHT_PRESET_CHIPS.map((c: ChipDef) => {
                  const selected = state.selectedBusinessHighlightIds.includes(c.id);
                  const disabled = !selected && businessHighlightSelectionCount >= MAX_BUSINESS_HIGHLIGHT_PRESET_SELECTION;
                  return (
                    <Chip
                      key={c.id}
                      selected={selected}
                      onClick={() => {
                        if (disabled) return;
                        toggleChipList("selectedBusinessHighlightIds", c.id);
                      }}
                      className={disabled ? "cursor-not-allowed opacity-45" : undefined}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[0.95rem] leading-none" aria-hidden>
                          {
                            resolveServiciosBusinessHighlightVisual({
                              id: `bh_preset_${c.id}`,
                              label: chipLabel(c, lang),
                            }).emoji
                          }
                        </span>
                        {chipLabel(c, lang)}
                      </span>
                    </Chip>
                  );
                })}
              </div>
              {businessHighlightSelectionCount >= MAX_BUSINESS_HIGHLIGHT_PRESET_SELECTION ? (
                <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.selectionMaxPresetHighlights}</p>
              ) : null}
              <label className={`mt-6 block ${labelClass}`}>{copy.labels.addOtherHighlightHeading}</label>
              <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.customChipShortHint}</p>
              <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  className={inputClass}
                  placeholder={copy.labels.highlightCustomPlaceholder}
                  maxLength={BUSINESS_HIGHLIGHT_LABEL_MAX}
                  value={state.customBusinessHighlightLabel}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, BUSINESS_HIGHLIGHT_LABEL_MAX);
                    setState((s) => ({ ...s, customBusinessHighlightLabel: v }));
                  }}
                />
                <button
                  type="button"
                  disabled={
                    !state.customBusinessHighlightLabel.trim() ||
                    state.customBusinessHighlights.length >= MAX_CUSTOM_BUSINESS_HIGHLIGHTS
                  }
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  onClick={() => {
                    setState((prev) => {
                      const r = evaluateAddCustomBusinessHighlight(prev, lang, prev.customBusinessHighlightLabel);
                      if (!r.ok) return prev;
                      return enforceServiciosSelectionCaps({
                        ...prev,
                        customBusinessHighlights: [...prev.customBusinessHighlights, r.label],
                        customBusinessHighlightLabel: "",
                      });
                    });
                  }}
                >
                  {copy.labels.addCustomChip}
                </button>
              </div>
              {state.customBusinessHighlights.length >= MAX_CUSTOM_BUSINESS_HIGHLIGHTS ? (
                <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.customHighlightsMax}</p>
              ) : null}
              {state.customBusinessHighlights.length > 0 ? (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-[#3D2C12]">{copy.labels.addedHighlightsSection}</p>
                  <div className="-mx-1 mt-2 flex flex-wrap gap-2 px-1">
                    {state.customBusinessHighlights.map((label, i) => (
                      <button
                        key={`cbh-${i}-${label}`}
                        type="button"
                        title={label}
                        aria-label={`${copy.labels.remove}: ${label}`}
                        onClick={() =>
                          setState((prev) =>
                            enforceServiciosSelectionCaps({
                              ...prev,
                              customBusinessHighlights: prev.customBusinessHighlights.filter((_, j) => j !== i),
                            }),
                          )
                        }
                        className="inline-flex max-w-full min-w-0 min-h-[40px] touch-manipulation items-center gap-1.5 rounded-full border border-[#3B66AD] bg-[#3B66AD]/10 px-3 py-2 text-left text-sm font-medium text-[#1e3a5f] ring-1 ring-[#3B66AD]/20 transition active:scale-[0.99] hover:bg-[#3B66AD]/15"
                      >
                        <span className="shrink-0 text-[0.95rem] leading-none" aria-hidden>
                          {
                            resolveServiciosBusinessHighlightVisual({
                              id: `bh_custom_${i}`,
                              label,
                            }).emoji
                          }
                        </span>
                        <span className="min-w-0 max-w-[14rem] truncate sm:max-w-[18rem]">{label}</span>
                        <FiX className="h-3.5 w-3.5 shrink-0 text-[#1e3a5f]/70" aria-hidden />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section className={sectionCard}>
              <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.quickFacts}</h2>
              <p className="mt-1 text-sm text-[#5D4A25]/85">{copy.labels.quickHint}</p>
              <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0">
                {preset.quickFacts.map((c: ChipDef) => {
                  const selected = state.selectedQuickFactIds.includes(c.id);
                  const disabled = !selected && quickFactsSelectionCount >= MAX_QUICK_FACTS_SELECTION;
                  return (
                    <Chip
                      key={c.id}
                      selected={selected}
                      onClick={() => {
                        if (disabled) return;
                        toggleChipList("selectedQuickFactIds", c.id);
                      }}
                      className={disabled ? "cursor-not-allowed opacity-45" : undefined}
                    >
                      {chipLabel(c, lang)}
                    </Chip>
                  );
                })}
                {state.customQuickFactIncluded && state.customQuickFactLabel.trim() ? (
                  <Chip
                    selected
                    truncateLabel
                    labelTitle={state.customQuickFactLabel.trim()}
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        customQuickFactIncluded: false,
                        customQuickFactLabel: "",
                      }))
                    }
                  >
                    {state.customQuickFactLabel.trim()}
                  </Chip>
                ) : null}
              </div>
              {quickFactsSelectionCount >= MAX_QUICK_FACTS_SELECTION ? (
                <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.selectionMaxThree}</p>
              ) : null}
              <label className={`mt-6 block ${labelClass}`}>{copy.labels.customQuickFact}</label>
              <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.customChipShortHint}</p>
              <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  className={inputClass}
                  placeholder={copy.labels.customChipPlaceholder}
                  maxLength={CUSTOM_CHIP_MAX_LENGTH}
                  disabled={
                    !state.customQuickFactIncluded &&
                    state.selectedQuickFactIds.length >= MAX_QUICK_FACTS_SELECTION
                  }
                  value={state.customQuickFactLabel}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, CUSTOM_CHIP_MAX_LENGTH);
                    setState((s) => ({
                      ...s,
                      customQuickFactLabel: v,
                      customQuickFactIncluded: v.trim().length > 0 ? s.customQuickFactIncluded : false,
                    }));
                  }}
                />
                {state.customQuickFactIncluded ? (
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-neutral-50 sm:w-auto"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        customQuickFactIncluded: false,
                        customQuickFactLabel: "",
                      }))
                    }
                  >
                    {copy.labels.remove}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={
                      !state.customQuickFactLabel.trim() ||
                      state.selectedQuickFactIds.length +
                        (state.customQuickFactIncluded ? 1 : 0) >=
                        MAX_QUICK_FACTS_SELECTION
                    }
                    className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    onClick={() => {
                      const t = state.customQuickFactLabel.trim();
                      if (!t) return;
                      if (
                        state.selectedQuickFactIds.length +
                          (state.customQuickFactIncluded ? 1 : 0) >=
                        MAX_QUICK_FACTS_SELECTION
                      ) {
                        return;
                      }
                      setState((s) => ({
                        ...s,
                        customQuickFactIncluded: true,
                        customQuickFactLabel: t.slice(0, CUSTOM_CHIP_MAX_LENGTH),
                      }));
                    }}
                  >
                    {copy.labels.addCustomChip}
                  </button>
                )}
              </div>
            </section>
          </>
        ) : (
          <section className={`${sectionCard} border-dashed border-amber-300/80 bg-amber-50/40`}>
            <p className="text-sm font-medium text-amber-900">
              {lang === "es"
                ? "Selecciona un tipo de negocio arriba para ver servicios sugeridos, motivos y datos rápidos."
                : "Choose a business type above to unlock suggested services, reasons, and quick facts."}
            </p>
          </section>
        )}
          </>
        ) : null}

        {step === 5 ? (
          <>
        {/* Contact visibility */}
        <section className={sectionCard}>
          <h2 className="text-lg font-bold text-[#3D2C12]">
            {copy.sections.contact}{" "}
            <span className="text-sm font-semibold text-red-600" aria-hidden>
              *
            </span>
          </h2>
          <p className="mt-1 text-xs text-[#6b5c42]">
            {lang === "es"
              ? "* Activa al menos un método de contacto válido con los datos del paso “Datos básicos y contacto”."
              : "* Turn on at least one valid contact method with matching details from “Basics & contact.”"}
          </p>

          <div className="mt-6 rounded-xl border border-[#D8C79A]/40 bg-[#FFFCF7]/90 p-4">
            <p className="text-sm font-bold text-[#3D2C12]">{copy.labels.contactDataHeading}</p>
            <ul className="mt-2 space-y-1.5 text-sm text-[#5D4A25]">
              <li>
                <span className="font-medium text-[#3D2C12]">{copy.labels.phone}:</span>{" "}
                {state.phone.trim() ? formatPhoneInputDisplay(state.phone) : "—"}
              </li>
              <li>
                <span className="font-medium text-[#3D2C12]">{copy.labels.phoneOffice}:</span>{" "}
                {state.phoneOffice.trim() ? formatPhoneInputDisplay(state.phoneOffice) : "—"}
              </li>
              <li>
                <span className="font-medium text-[#3D2C12]">{copy.labels.whatsapp}:</span>{" "}
                {state.whatsapp.trim() ? formatPhoneInputDisplay(state.whatsapp) : "—"}
              </li>
              <li>
                <span className="font-medium text-[#3D2C12]">{copy.labels.whatsappBusinessUrl}:</span>{" "}
                {state.whatsappBusinessUrl.trim() ? state.whatsappBusinessUrl.trim() : "—"}
              </li>
              <li>
                <span className="font-medium text-[#3D2C12]">{copy.labels.email}:</span> {state.email.trim() ? state.email.trim() : "—"}
              </li>
              <li>
                <span className="font-medium text-[#3D2C12]">{copy.labels.website}:</span>{" "}
                {state.website.trim() ? state.website.trim() : "—"}
              </li>
            </ul>
            <p className="mt-3 text-xs text-[#6b5c42]">
              {lang === "es"
                ? "Edita estos datos en el paso “Datos básicos y contacto”."
                : "Edit these fields under “Basics & contact.”"}
            </p>
          </div>

          <div className="mt-6">
            <p className="text-sm font-bold text-[#3D2C12]">{copy.labels.contactVisibleHeading}</p>
            <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.contactSummaryIntro}</p>
            {contactSummaryLines.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-sm text-[#5D4A25]">
                {contactSummaryLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-amber-900/90">{copy.labels.contactSummaryNone}</p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.contactPrimaryCtaHelp}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm sm:min-h-0">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
                  checked={state.enableWhatsapp}
                  onChange={(e) => setState((s) => ({ ...s, enableWhatsapp: e.target.checked }))}
                />
                {copy.labels.enableWhatsapp}
              </label>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm sm:min-h-0">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
                  checked={state.enableCall}
                  onChange={(e) => setState((s) => ({ ...s, enableCall: e.target.checked }))}
                />
                {copy.labels.enableCall}
              </label>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm sm:min-h-0">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
                  checked={state.enableEmail}
                  onChange={(e) => setState((s) => ({ ...s, enableEmail: e.target.checked }))}
                />
                {copy.labels.enableEmail}
              </label>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm sm:min-h-0">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
                  checked={state.enableWebsite}
                  onChange={(e) => setState((s) => ({ ...s, enableWebsite: e.target.checked }))}
                />
                {copy.labels.enableWebsite}
              </label>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.contactMessageFootnote}</p>
          </div>
        </section>

        <section className={sectionCard} aria-labelledby="sec-payments">
          <h2 id="sec-payments" className="text-lg font-bold text-[#3D2C12]">
            {copy.labels.paymentsSection}
          </h2>
          <p className="mt-1 text-sm text-[#5D4A25]/85">{copy.labels.paymentsSectionHint}</p>

          <p className="mt-5 text-sm font-semibold text-[#3D2C12]">{copy.labels.paymentsStandardHeading}</p>
          <div className="-mx-1 mt-2 flex flex-wrap gap-2 px-1 pb-1">
            {SERVICIOS_PAYMENT_METHOD_ORDER.map((id) => {
              const selected = sanitizeServiciosPaymentMethodIds(state.paymentMethodIds).includes(id);
              return (
                <Chip
                  key={id}
                  selected={selected}
                  onClick={() => {
                    setState((prev) => {
                      const cur = new Set(sanitizeServiciosPaymentMethodIds(prev.paymentMethodIds));
                      if (cur.has(id)) cur.delete(id);
                      else {
                        if (cur.size >= MAX_SERVICIOS_PAYMENT_METHODS_SELECTED) return prev;
                        cur.add(id);
                      }
                      return enforceServiciosSelectionCaps({
                        ...prev,
                        paymentMethodIds: sanitizeServiciosPaymentMethodIds([...cur]),
                      });
                    });
                  }}
                >
                  <ServiciosPaymentMethodBadge lang={lang} standardId={id} compact />
                </Chip>
              );
            })}
          </div>

          <label className={`mt-6 block ${labelClass}`}>{copy.labels.paymentsOtherLabel}</label>
          <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              className={inputClass}
              placeholder={copy.labels.paymentsPlaceholder}
              maxLength={CUSTOM_PAYMENT_LABEL_MAX}
              value={state.customPaymentMethodLabel}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  customPaymentMethodLabel: e.target.value.slice(0, CUSTOM_PAYMENT_LABEL_MAX),
                }))
              }
            />
            <button
              type="button"
              disabled={
                !state.customPaymentMethodLabel.trim() ||
                state.customPaymentMethods.length >= MAX_CUSTOM_PAYMENT_METHODS
              }
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              onClick={() => {
                setState((prev) => {
                  const r = evaluateAddCustomPaymentMethod(prev, prev.customPaymentMethodLabel);
                  if (!r.ok) return prev;
                  return enforceServiciosSelectionCaps({
                    ...prev,
                    customPaymentMethods: [...prev.customPaymentMethods, r.label],
                    customPaymentMethodLabel: "",
                  });
                });
              }}
            >
              {copy.labels.paymentsAdd}
            </button>
          </div>
          {state.customPaymentMethods.length >= MAX_CUSTOM_PAYMENT_METHODS ? (
            <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.paymentsCustomMax}</p>
          ) : null}
          {state.customPaymentMethods.length > 0 ? (
            <div className="mt-5">
              <p className="text-sm font-semibold text-[#3D2C12]">{copy.labels.paymentsAddedList}</p>
              <div className="-mx-1 mt-2 flex flex-wrap gap-2 px-1">
                {state.customPaymentMethods.map((label, i) => (
                  <button
                    key={`cpay-${i}-${label}`}
                    type="button"
                    title={label}
                    aria-label={`${copy.labels.remove}: ${label}`}
                    onClick={() =>
                      setState((prev) =>
                        enforceServiciosSelectionCaps({
                          ...prev,
                          customPaymentMethods: prev.customPaymentMethods.filter((_, j) => j !== i),
                        }),
                      )
                    }
                    className="inline-flex max-w-full min-w-0 min-h-[40px] touch-manipulation items-center gap-1.5 rounded-full border border-[#3B66AD] bg-[#3B66AD]/10 px-3 py-2 text-left text-sm font-medium text-[#1e3a5f] ring-1 ring-[#3B66AD]/20"
                  >
                    <ServiciosPaymentMethodBadge lang={lang} customLabel={label} compact />
                    <FiX className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className={sectionCard} aria-labelledby="sec-amenities">
          <h2 id="sec-amenities" className="text-lg font-bold text-[#3D2C12]">
            {copy.labels.amenitiesSection}
          </h2>
          <p className="mt-1 text-sm text-[#5D4A25]/85">{copy.labels.amenitiesSectionHint}</p>

          <div className="mt-5 space-y-5">
            {SERVICIOS_AMENITY_GROUPS.filter((g) => g.id !== "other").map((group) => {
              const options = SERVICIOS_AMENITY_OPTIONS.filter((o) => o.groupId === group.id);
              if (options.length === 0) return null;
              return (
                <div key={group.id}>
                  <p className="text-sm font-semibold text-[#3D2C12]">{group.label[lang]}</p>
                  <div className="-mx-1 mt-2 flex flex-wrap gap-2 px-1 pb-1">
                    {options.map((opt) => {
                      const selected = sanitizeServiciosAmenityOptionIds(state.amenityOptionIds).includes(opt.id);
                      return (
                        <Chip
                          key={opt.id}
                          selected={selected}
                          onClick={() => {
                            setState((prev) => {
                              const cur = new Set(sanitizeServiciosAmenityOptionIds(prev.amenityOptionIds));
                              if (cur.has(opt.id)) cur.delete(opt.id);
                              else cur.add(opt.id);
                              return enforceServiciosSelectionCaps({
                                ...prev,
                                amenityOptionIds: sanitizeServiciosAmenityOptionIds([...cur]),
                              });
                            });
                          }}
                        >
                          <ServiciosAmenityBadge lang={lang} standardId={opt.id} compact />
                        </Chip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <label className={`mt-6 block ${labelClass}`}>{copy.labels.amenitiesOtherLabel}</label>
          <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              className={inputClass}
              placeholder={copy.labels.amenitiesPlaceholder}
              maxLength={CUSTOM_SERVICIOS_AMENITY_LABEL_MAX}
              value={state.pendingCustomAmenityOption}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  pendingCustomAmenityOption: e.target.value.slice(0, CUSTOM_SERVICIOS_AMENITY_LABEL_MAX),
                }))
              }
            />
            <button
              type="button"
              disabled={
                !state.pendingCustomAmenityOption.trim() ||
                state.customAmenityOptions.length >= MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS
              }
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              onClick={() => {
                setState((prev) => {
                  const r = evaluateAddCustomAmenityOption(prev, prev.pendingCustomAmenityOption);
                  if (!r.ok) return prev;
                  return enforceServiciosSelectionCaps({
                    ...prev,
                    customAmenityOptions: [...prev.customAmenityOptions, r.label],
                    pendingCustomAmenityOption: "",
                  });
                });
              }}
            >
              {copy.labels.amenitiesAdd}
            </button>
          </div>

          {state.customAmenityOptions.length >= MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS ? (
            <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.amenitiesCustomMax}</p>
          ) : null}

          {state.customAmenityOptions.length > 0 ? (
            <div className="mt-5">
              <p className="text-sm font-semibold text-[#3D2C12]">{copy.labels.amenitiesAddedList}</p>
              <div className="-mx-1 mt-2 flex flex-wrap gap-2 px-1">
                {state.customAmenityOptions.map((label, i) => (
                  <button
                    key={`amenity-${i}-${label}`}
                    type="button"
                    title={label}
                    aria-label={`${copy.labels.remove}: ${label}`}
                    onClick={() =>
                      setState((prev) =>
                        enforceServiciosSelectionCaps({
                          ...prev,
                          customAmenityOptions: prev.customAmenityOptions.filter((_, j) => j !== i),
                        }),
                      )
                    }
                    className="inline-flex max-w-full min-w-0 min-h-[40px] touch-manipulation items-center gap-1.5 rounded-full border border-[#3B66AD] bg-[#3B66AD]/10 px-3 py-2 text-left text-sm font-medium text-[#1e3a5f] ring-1 ring-[#3B66AD]/20"
                  >
                    <ServiciosAmenityBadge lang={lang} customLabel={label} compact />
                    <FiX className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className={sectionCard} aria-labelledby="sec-credentials">
          <h2 id="sec-credentials" className="text-lg font-bold text-[#3D2C12]">
            {copy.labels.credentialsSection}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#5D4A25]/90">{copy.labels.credentialsSectionHint}</p>

          <label className={`mt-5 flex min-h-[44px] cursor-pointer items-center gap-2 text-sm sm:min-h-0`}>
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
              checked={state.hasLicense}
              onChange={(e) =>
                setState((s) => enforceServiciosSelectionCaps({ ...s, hasLicense: e.target.checked }))
              }
            />
            {copy.labels.hasLicense}
          </label>
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.licenseType}</label>
          <input
            className={inputClass}
            disabled={!state.hasLicense}
            placeholder={copy.labels.licenseTypePlaceholder}
            maxLength={SERVICIOS_CREDENTIAL_STRING_MAX.licenseType}
            value={state.licenseType}
            onChange={(e) =>
              setState((s) =>
                enforceServiciosSelectionCaps({
                  ...s,
                  licenseType: e.target.value.slice(0, SERVICIOS_CREDENTIAL_STRING_MAX.licenseType),
                }),
              )
            }
          />
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.licenseNumber}</label>
          <input
            className={inputClass}
            disabled={!state.hasLicense}
            maxLength={SERVICIOS_CREDENTIAL_STRING_MAX.licenseNumber}
            value={state.licenseNumber}
            onChange={(e) =>
              setState((s) =>
                enforceServiciosSelectionCaps({
                  ...s,
                  licenseNumber: e.target.value.slice(0, SERVICIOS_CREDENTIAL_STRING_MAX.licenseNumber),
                }),
              )
            }
          />
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.licenseAuthority}</label>
          <input
            className={inputClass}
            disabled={!state.hasLicense}
            placeholder={copy.labels.licenseAuthorityPlaceholder}
            maxLength={SERVICIOS_CREDENTIAL_STRING_MAX.licenseAuthority}
            value={state.licenseAuthority}
            onChange={(e) =>
              setState((s) =>
                enforceServiciosSelectionCaps({
                  ...s,
                  licenseAuthority: e.target.value.slice(0, SERVICIOS_CREDENTIAL_STRING_MAX.licenseAuthority),
                }),
              )
            }
          />
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.licenseExpiration}</label>
          <input
            type="date"
            className={inputClass}
            disabled={!state.hasLicense}
            value={state.licenseExpiration}
            onChange={(e) =>
              setState((s) =>
                enforceServiciosSelectionCaps({
                  ...s,
                  licenseExpiration: e.target.value.slice(0, SERVICIOS_CREDENTIAL_STRING_MAX.licenseExpiration),
                }),
              )
            }
          />

          <label className={`mt-6 flex min-h-[44px] cursor-pointer items-center gap-2 text-sm sm:min-h-0`}>
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
              checked={state.isInsured}
              onChange={(e) =>
                setState((s) => enforceServiciosSelectionCaps({ ...s, isInsured: e.target.checked }))
              }
            />
            {copy.labels.hasInsurance}
          </label>
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.insuranceType}</label>
          <input
            className={inputClass}
            disabled={!state.isInsured}
            placeholder={copy.labels.insuranceTypePlaceholder}
            maxLength={SERVICIOS_CREDENTIAL_STRING_MAX.insuranceType}
            value={state.insuranceType}
            onChange={(e) =>
              setState((s) =>
                enforceServiciosSelectionCaps({
                  ...s,
                  insuranceType: e.target.value.slice(0, SERVICIOS_CREDENTIAL_STRING_MAX.insuranceType),
                }),
              )
            }
          />

          <label className={`mt-6 block ${labelClass}`}>{copy.labels.certificationsLabel}</label>
          <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              className={inputClass}
              placeholder={copy.labels.certificationsPlaceholder}
              maxLength={SERVICIOS_CERTIFICATION_LABEL_MAX}
              value={state.pendingCertification}
              onChange={(e) =>
                setState((s) =>
                  enforceServiciosSelectionCaps({
                    ...s,
                    pendingCertification: e.target.value.slice(0, SERVICIOS_CERTIFICATION_LABEL_MAX),
                  }),
                )
              }
            />
            <button
              type="button"
              disabled={
                !state.pendingCertification.trim() ||
                state.certifications.length >= MAX_SERVICIOS_CERTIFICATIONS ||
                !evaluateAddCertificationLabel({
                  certifications: state.certifications,
                  raw: state.pendingCertification,
                }).ok
              }
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              onClick={() => {
                setState((prev) => {
                  const r = evaluateAddCertificationLabel({
                    certifications: prev.certifications,
                    raw: prev.pendingCertification,
                  });
                  if (!r.ok) return prev;
                  return enforceServiciosSelectionCaps({
                    ...prev,
                    certifications: [...prev.certifications, r.label],
                    pendingCertification: "",
                  });
                });
              }}
            >
              {copy.labels.certificationsAdd}
            </button>
          </div>
          {state.certifications.length >= MAX_SERVICIOS_CERTIFICATIONS ? (
            <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.certificationsCustomMax}</p>
          ) : null}
          {state.certifications.length > 0 ? (
            <div className="mt-5">
              <p className="text-sm font-semibold text-[#3D2C12]">{copy.labels.certificationsAddedList}</p>
              <div className="-mx-1 mt-2 flex flex-wrap gap-2 px-1">
                {state.certifications.map((label, i) => (
                  <button
                    key={`cert-${i}-${label}`}
                    type="button"
                    title={label}
                    aria-label={`${copy.labels.remove}: ${label}`}
                    onClick={() =>
                      setState((prev) =>
                        enforceServiciosSelectionCaps({
                          ...prev,
                          certifications: prev.certifications.filter((_, j) => j !== i),
                        }),
                      )
                    }
                    className="inline-flex max-w-full min-w-0 min-h-[40px] touch-manipulation items-center gap-1.5 rounded-full border border-[#3B66AD] bg-[#3B66AD]/10 px-3 py-2 text-left text-sm font-medium text-[#1e3a5f] ring-1 ring-[#3B66AD]/20"
                  >
                    <span className="min-w-0 break-words">{label}</span>
                    <FiX className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <label className={`mt-6 block ${labelClass}`}>{copy.labels.licenseDocumentLink}</label>
          <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.licenseDocumentLinkHelp}</p>
          <input
            className={inputClass}
            type="url"
            placeholder="https://"
            maxLength={SERVICIOS_CREDENTIAL_STRING_MAX.documentUrl}
            value={state.licenseDocumentUrl}
            onChange={(e) =>
              setState((s) =>
                enforceServiciosSelectionCaps({
                  ...s,
                  licenseDocumentUrl: e.target.value.slice(0, SERVICIOS_CREDENTIAL_STRING_MAX.documentUrl),
                }),
              )
            }
          />
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.insuranceDocumentLink}</label>
          <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.insuranceDocumentLinkHelp}</p>
          <input
            className={inputClass}
            type="url"
            placeholder="https://"
            maxLength={SERVICIOS_CREDENTIAL_STRING_MAX.documentUrl}
            value={state.insuranceDocumentUrl}
            onChange={(e) =>
              setState((s) =>
                enforceServiciosSelectionCaps({
                  ...s,
                  insuranceDocumentUrl: e.target.value.slice(0, SERVICIOS_CREDENTIAL_STRING_MAX.documentUrl),
                }),
              )
            }
          />
        </section>
          </>
        ) : null}

        {step === 6 ? (
          <>
        {/* Hours */}
        <section className={sectionCard}>
          <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.hours}</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.hoursOutputHint}</p>
          <div className="mt-4 space-y-3">
            {state.hours.map((row) => (
              <div
                key={row.day}
                className="flex flex-col gap-2 rounded-xl border border-neutral-100 bg-[#FFFCF7] px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:py-2"
              >
                <span className="shrink-0 text-sm font-semibold text-[#3D2C12] sm:w-28">{WEEK_DAY_LABELS[row.day][lang]}</span>
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                  <label className="flex min-h-[40px] cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={row.closed}
                      onChange={(e) => updateHour(row.day, { closed: e.target.checked })}
                      className="h-4 w-4 rounded"
                    />
                    {copy.labels.closed}
                  </label>
                  {!row.closed ? (
                    <>
                      <input
                        type="time"
                        className={`${inputClass} w-[min(100%,9rem)] max-w-[140px] sm:w-auto`}
                        value={row.open}
                        onChange={(e) => updateHour(row.day, { open: e.target.value })}
                      />
                      <span className="text-neutral-500">—</span>
                      <input
                        type="time"
                        className={`${inputClass} w-[min(100%,9rem)] max-w-[140px] sm:w-auto`}
                        value={row.close}
                        onChange={(e) => updateHour(row.day, { close: e.target.value })}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
          </>
        ) : null}

        {step === 7 ? (
          <>
        {/* Promoción (testimonials hidden — state preserved in draft) */}
        <section className={sectionCard} aria-labelledby="sec-promo">
          <h2 id="sec-promo" className="text-lg font-bold text-[#3D2C12]">
            {copy.sections.offer}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5D4A25]/90">{copy.labels.promoSectionIntro}</p>
          <label className={`mt-5 block ${labelClass}`}>{copy.labels.offerTitle}</label>
          <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.offerTitleHelp}</p>
          <input
            className={inputClass}
            value={state.offerTitle}
            onChange={(e) => setState((s) => ({ ...s, offerTitle: e.target.value }))}
          />
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.offerDetails}</label>
          <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.offerDetailsHelp}</p>
          <textarea className={inputClass} rows={3} value={state.offerDetails} onChange={(e) => setState((s) => ({ ...s, offerDetails: e.target.value }))} />
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.offerLink}</label>
          <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.offerLinkHelp}</p>
          <input
            className={`${inputClass} ${offerLinkInvalid ? inputWarn : ""}`}
            type="url"
            placeholder="https://"
            value={state.offerLink}
            onChange={(e) => setState((s) => ({ ...s, offerLink: e.target.value }))}
          />
          {offerLinkInvalid ? <p className="mt-1 text-xs text-amber-800">{copy.labels.invalidUrl}</p> : null}
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.offerImage}</label>
          <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.offerImageHelp}</p>
          <input
            ref={offerImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (!f.type.startsWith("image/")) {
                setMediaFlash(copy.labels.mediaWrongFileType);
                e.target.value = "";
                return;
              }
              void readFileAsDataUrl(f).then((url) => setState((s) => ({ ...s, offerImageUrl: url })));
            }}
          />
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center rounded-xl border border-[#D8C79A]/80 bg-white px-3 py-2 text-xs font-semibold text-[#3D2C12]"
                onClick={() => offerImageInputRef.current?.click()}
              >
                {copy.labels.upload}
              </button>
              {state.offerImageUrl ? (
                <button
                  type="button"
                  className="min-h-[44px] text-xs font-semibold text-red-700 underline"
                  onClick={() => setState((s) => ({ ...s, offerImageUrl: "" }))}
                >
                  {copy.labels.remove}
                </button>
              ) : null}
            </div>
            {state.offerImageUrl ? (
              <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                  <Image src={state.offerImageUrl} alt="" fill className="object-cover" unoptimized />
                </div>
                <p className="text-xs font-medium text-[#2d528d]">{copy.labels.mediaUploadedBadge}</p>
              </div>
            ) : null}
          </div>
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.offerPdf}</label>
          <input
            ref={offerPdfInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.type !== "application/pdf") {
                setMediaFlash(copy.labels.mediaWrongPdfType);
                e.target.value = "";
                return;
              }
              void readFileAsDataUrl(f).then((url) => setState((s) => ({ ...s, offerPdfUrl: url })));
            }}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-[#D8C79A]/80 bg-white px-3 py-2 text-xs font-semibold text-[#3D2C12]"
              onClick={() => offerPdfInputRef.current?.click()}
            >
              {copy.labels.upload}
            </button>
            {state.offerPdfUrl ? (
              <>
                <span className="inline-flex items-center rounded-full bg-[#3B66AD]/10 px-2.5 py-1 text-[11px] font-semibold text-[#2d528d]">PDF</span>
                <button
                  type="button"
                  className="min-h-[44px] text-xs font-semibold text-red-700 underline"
                  onClick={() => setState((s) => ({ ...s, offerPdfUrl: "" }))}
                >
                  {copy.labels.remove}
                </button>
              </>
            ) : null}
          </div>
          <p className={`mt-6 ${labelClass}`}>{copy.labels.offerPrimaryLabel}</p>
          <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0">
            {(
              [
                ["none", copy.labels.offerPrimaryNone] as const,
                ["link", copy.labels.offerPrimaryLink] as const,
                ["image", copy.labels.offerPrimaryImage] as const,
                ["pdf", copy.labels.offerPrimaryPdf] as const,
              ] as const
            ).map(([val, lab]) => (
              <Chip key={val} selected={state.offerPrimaryAsset === val} onClick={() => setState((s) => ({ ...s, offerPrimaryAsset: val }))}>
                {lab}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.offerAssetContractNote}</p>
        </section>
          </>
        ) : null}

        {step === 8 ? (
          <>
            <ListingRulesConfirmationSection
              lang={lang}
              subject="servicios"
              confirmAccurate={state.confirmListingAccurate}
              confirmPhotos={state.confirmPhotosRepresentBusiness}
              confirmRules={state.confirmCommunityRules}
              onAccurate={(v) => setState((s) => ({ ...s, confirmListingAccurate: v }))}
              onPhotos={(v) => setState((s) => ({ ...s, confirmPhotosRepresentBusiness: v }))}
              onRules={(v) => setState((s) => ({ ...s, confirmCommunityRules: v }))}
            />
            <section className={sectionCard} aria-labelledby="sec-review">
              <h2 id="sec-review" className="text-lg font-bold text-[#3D2C12]">
                {lang === "es" ? "Revisión final" : "Final review"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5D4A25]/90">{copy.labels.finalStepActionsIntro}</p>
              {hydrated ? (
                <p className="mt-3 rounded-lg border border-[#D8C79A]/40 bg-[#FFFCF7] px-3 py-2 text-sm font-medium text-[#6b5c42]">{listingPhaseLine}</p>
              ) : null}
              <div className="mt-6 flex flex-col gap-3 border-t border-[#D8C79A]/40 pt-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
                  <button
                    type="button"
                    onClick={() => {
                      setFinalStepPublishBlocked(null);
                      goStrictPreview();
                    }}
                    className="inline-flex min-h-[48px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-xl bg-[#3B66AD] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#2f5699] sm:max-w-xs"
                  >
                    {copy.previewCta}
                  </button>
                  <button
                    type="button"
                    onClick={openPublishModalFromFinalStep}
                    className="inline-flex min-h-[48px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-xl border-2 border-[#3B66AD]/45 bg-white px-4 py-3 text-sm font-bold leading-tight text-[#2f5699] shadow-sm transition hover:bg-[#3B66AD]/5 sm:max-w-xs"
                  >
                    {copy.publishCta}
                  </button>
                </div>
                {finalStepPublishBlocked ? (
                  <p className="text-sm font-medium text-amber-900" role="status">
                    {finalStepPublishBlocked}
                  </p>
                ) : null}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={deleteApplicationDraft}
                    className="text-xs font-medium text-red-800/90 underline decoration-red-800/30 underline-offset-2 hover:text-red-950"
                  >
                    {copy.deleteApplication}
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D8C79A]/40 pt-4">
              <button
                type="button"
                disabled={!canGoBack}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    applicationStepIndex: Math.max(0, s.applicationStepIndex - 1),
                  }))
                }
                className="inline-flex min-h-[48px] min-w-[7.5rem] touch-manipulation items-center justify-center rounded-xl border border-[#D8C79A]/80 bg-white px-4 py-2.5 text-sm font-semibold text-[#3D2C12] shadow-sm transition hover:bg-[#FFFCF7] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {lang === "es" ? "Anterior" : "Back"}
              </button>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    ...(s.applicationStepIndex === 4
                      ? (() => {
                          let w: ClasificadosServiciosApplicationState = { ...s };
                          const pendingService = w.customServiceLabel.trim();
                          if (pendingService) {
                            const r = evaluateAddCustomServiceOffered(w, lang, pendingService);
                            w = r.ok
                              ? enforceServiciosSelectionCaps({
                                  ...w,
                                  customServicesOffered: [...w.customServicesOffered, r.label],
                                  customServiceLabel: "",
                                })
                              : enforceServiciosSelectionCaps({ ...w, customServiceLabel: "" });
                          }

                          const pendingReason = w.customReasonLabel.trim();
                          if (!w.customReasonIncluded && pendingReason) {
                            const total =
                              w.selectedReasonIds.length +
                              (w.customReasonIncluded && w.customReasonLabel.trim() ? 1 : 0);
                            if (total < MAX_REASONS_SELECTION) {
                              w = {
                                ...w,
                                customReasonIncluded: true,
                                customReasonLabel: pendingReason.slice(0, CUSTOM_CHIP_MAX_LENGTH),
                              };
                            }
                          }

                          const pendingQuickFact = w.customQuickFactLabel.trim();
                          if (!w.customQuickFactIncluded && pendingQuickFact) {
                            const total =
                              w.selectedQuickFactIds.length +
                              (w.customQuickFactIncluded && w.customQuickFactLabel.trim() ? 1 : 0);
                            if (total < MAX_QUICK_FACTS_SELECTION) {
                              w = {
                                ...w,
                                customQuickFactIncluded: true,
                                customQuickFactLabel: pendingQuickFact.slice(0, CUSTOM_CHIP_MAX_LENGTH),
                              };
                            }
                          }

                          const pendingHighlight = w.customBusinessHighlightLabel.trim();
                          if (pendingHighlight) {
                            const r = evaluateAddCustomBusinessHighlight(w, lang, pendingHighlight);
                            w = r.ok
                              ? enforceServiciosSelectionCaps({
                                  ...w,
                                  customBusinessHighlights: [...w.customBusinessHighlights, r.label],
                                  customBusinessHighlightLabel: "",
                                })
                              : enforceServiciosSelectionCaps({ ...w, customBusinessHighlightLabel: "" });
                          }

                          return {
                            customServicesOffered: w.customServicesOffered,
                            customServiceLabel: w.customServiceLabel,
                            customServiceIncluded: w.customServiceIncluded,
                            customReasonIncluded: w.customReasonIncluded,
                            customReasonLabel: w.customReasonLabel,
                            customQuickFactIncluded: w.customQuickFactIncluded,
                            customQuickFactLabel: w.customQuickFactLabel,
                            selectedBusinessHighlightIds: w.selectedBusinessHighlightIds,
                            customBusinessHighlights: w.customBusinessHighlights,
                            customBusinessHighlightLabel: w.customBusinessHighlightLabel,
                          };
                        })()
                      : {}),
                    ...(s.applicationStepIndex === 5
                      ? (() => {
                          let w: ClasificadosServiciosApplicationState = { ...s };
                          const pending = w.customPaymentMethodLabel.trim();
                          if (pending) {
                            const r = evaluateAddCustomPaymentMethod(w, pending);
                            w = r.ok
                              ? enforceServiciosSelectionCaps({
                                  ...w,
                                  customPaymentMethods: [...w.customPaymentMethods, r.label],
                                  customPaymentMethodLabel: "",
                                })
                              : enforceServiciosSelectionCaps({ ...w, customPaymentMethodLabel: "" });
                          }
                          const pendingAmenity = w.pendingCustomAmenityOption.trim();
                          if (pendingAmenity) {
                            const r = evaluateAddCustomAmenityOption(w, pendingAmenity);
                            w = r.ok
                              ? enforceServiciosSelectionCaps({
                                  ...w,
                                  customAmenityOptions: [...w.customAmenityOptions, r.label],
                                  pendingCustomAmenityOption: "",
                                })
                              : enforceServiciosSelectionCaps({ ...w, pendingCustomAmenityOption: "" });
                          }
                          const pendingCert = w.pendingCertification.trim();
                          if (pendingCert) {
                            const r = evaluateAddCertificationLabel({
                              certifications: w.certifications,
                              raw: pendingCert,
                            });
                            w = r.ok
                              ? enforceServiciosSelectionCaps({
                                  ...w,
                                  certifications: [...w.certifications, r.label],
                                  pendingCertification: "",
                                })
                              : enforceServiciosSelectionCaps({ ...w, pendingCertification: "" });
                          }
                          return {
                            paymentMethodIds: w.paymentMethodIds,
                            customPaymentMethods: w.customPaymentMethods,
                            customPaymentMethodLabel: w.customPaymentMethodLabel,
                            amenityOptionIds: w.amenityOptionIds,
                            customAmenityOptions: w.customAmenityOptions,
                            pendingCustomAmenityOption: w.pendingCustomAmenityOption,
                            certifications: w.certifications,
                            pendingCertification: w.pendingCertification,
                          };
                        })()
                      : {}),
                    applicationStepIndex: Math.min(totalSteps - 1, s.applicationStepIndex + 1),
                  }))
                }
                className="inline-flex min-h-[48px] min-w-[7.5rem] touch-manipulation items-center justify-center rounded-xl bg-[#3B66AD] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2f5699] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {lang === "es" ? "Siguiente" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <ServiciosPublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        state={state}
        lang={lang}
        copy={copy}
        onPersistDraft={async () => {
          await saveClasificadosServiciosApplicationResolved(stateRef.current);
        }}
        getLatestState={() => stateRef.current}
      />
    </div>
  );
}
