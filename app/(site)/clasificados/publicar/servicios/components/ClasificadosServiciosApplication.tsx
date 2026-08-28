"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FiCheck, FiImage, FiPlus, FiUpload, FiX } from "react-icons/fi";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";
import {
  clearLeonixReturningToEditSessionFlag,
  markPublishFlowOpeningPreview,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { useBusinessApplicationLeaveGuard } from "@/app/lib/businessApplications/useBusinessApplicationLeaveGuard";
import { PhoneInput } from "@/app/components/forms/PhoneInput";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { LanguagesInput } from "@/app/components/forms/LanguagesInput";
import {
  HoursEditor,
  type HoursEditorDayRow,
  type HoursEditorDaySchedule,
  type HoursEditorSpecialHoursEntry,
} from "@/app/components/forms/HoursEditor";
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
  ClasificadosServiciosCouponRow,
  DayKey,
  GalleryItem,
  ServiciosLang,
  ServiciosSpecialHoursEntry,
} from "../lib/clasificadosServiciosApplicationTypes";
import {
  LANGUAGE_OPTION_CHIPS,
  SERVICIOS_MAX_VIDEO_URLS,
  shortenServiciosVideoUrlDisplay,
} from "../lib/clasificadosServiciosApplicationTypes";
import {
  bootstrapServiciosApplicationStateSync,
  clearServiciosPreviewReturnHandoff,
  persistServiciosDraftForPreviewNavigation,
  rehydrateServiciosApplicationMedia,
} from "../lib/clasificadosServiciosPreviewHandoff";
import {
  isLeonixLbUsCountry,
  US_STATE_OPTIONS,
} from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";
import {
  clearServiciosDraftStorageAndIdb,
  saveClasificadosServiciosApplicationResolved,
} from "../lib/clasificadosServiciosStorage";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import {
  startServiciosDashboardOffersAddonCheckout,
  serviciosListingPreviewHref,
  serviciosOffersAddonUpgradeLabel,
  serviciosOffersAddonUpgradeBusyLabel,
  serviciosOffersModuleHeading,
  serviciosOffersEditHref,
} from "@/app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout";
import {
  getServiciosApplicationStepLabels,
  getServiciosApplicationStepShortLabels,
  migrateServiciosApplicationStepIndex,
  SERVICIOS_APPLICATION_STEP_COUNT,
} from "../lib/serviciosApplicationStepLabels";
import ListingRulesConfirmationSection from "@/app/clasificados/en-venta/shared/components/ListingRulesConfirmationSection";
import type { PublishReadinessMissingItem } from "../lib/serviciosPublishReadiness";
import { evaluateServiciosPreviewReadiness } from "../lib/serviciosPreviewReadiness";
import { isJunkServiciosQuickFactLabel } from "../lib/serviciosContactVisibility";
import {
  getServiciosCredentialPlaceholders,
  resolveServiciosApplicationTemplate,
} from "../lib/serviciosApplicationTemplateCopy";
import {
  clasificadosServiciosApplicationHasProgress,
  createDefaultClasificadosServiciosState,
  WEEK_DAY_LABELS,
} from "../lib/defaultClasificadosServiciosState";
import { mergeStateForBusinessTypeChange } from "../lib/presetStateMerge";
import {
  CUSTOM_CHIP_MAX_LENGTH,
  MAX_CUSTOM_SERVICES_OFFERED,
  MAX_CUSTOM_QUICK_FACTS,
  MAX_QUICK_FACTS_SELECTION,
  MAX_REASONS_SELECTION,
  MAX_SERVICES_SELECTION,
  enforceServiciosSelectionCaps,
} from "../lib/serviciosSelectionCaps";
import { BUSINESS_HIGHLIGHT_PRESET_CHIPS } from "../lib/businessHighlightPresets";
import { evaluateAddCustomBusinessHighlight } from "../lib/serviciosCustomBusinessHighlights";
import { evaluateAddCustomServiceOffered, normalizeServiceOfferedDedupeKey } from "../lib/serviciosCustomServicesOffered";
import { evaluateAddCustomQuickFact } from "../lib/serviciosCustomQuickFacts";
import {
  BUSINESS_HIGHLIGHT_LABEL_MAX,
  MAX_BUSINESS_HIGHLIGHT_PRESET_SELECTION,
  MAX_CUSTOM_BUSINESS_HIGHLIGHTS,
} from "../lib/serviciosHighlightCaps";
import { digitsOnly, formatPhoneInputDisplay, formatWhatsAppInputDisplay } from "../lib/serviciosPhoneUi";
import { resolveServiciosBusinessHighlightVisual } from "@/app/(site)/clasificados/servicios/lib/serviciosBusinessHighlightVisual";
import { resolveServiciosServiceVisual } from "@/app/(site)/clasificados/servicios/lib/serviciosServiceVisualCatalog";
import {
  isProbablyValidWebUrl,
  newGalleryId,
  newVideoId,
  normalizeHttpUrl,
} from "../lib/socialAndUrlHelpers";
import { normalizeStrictExternalVideoUrl } from "@/app/lib/media/externalVideoUrlValidation";
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
  MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS_PER_GROUP,
  SERVICIOS_AMENITY_CUSTOM_GROUP_IDS,
  SERVICIOS_AMENITY_GROUPS,
  SERVICIOS_AMENITY_OPTIONS,
  evaluateAddCustomAmenityOptionForGroup,
  sanitizeServiciosAmenityOptionIds,
} from "@/app/servicios/lib/serviciosAmenitiesCatalog";
import { ServiciosAmenityBadge } from "@/app/servicios/components/ServiciosAmenityBadge";
import { evaluateAddCertificationLabel } from "@/app/servicios/lib/serviciosCredentialsCustom";
import { isValidEmail } from "../lib/leonixContactCtaPriority";
import {
  MAX_SERVICIOS_CERTIFICATIONS,
  SERVICIOS_CERTIFICATION_LABEL_MAX,
  SERVICIOS_CREDENTIAL_STRING_MAX,
} from "@/app/servicios/lib/serviciosCredentialsCatalog";
import { primeServiciosExistingPublicSlug } from "../lib/serviciosPublishClient";
import {
  serviciosPublishedToApplicationDraft,
  type ServiciosEditIdentity,
  type ServiciosPublishedListingHydrationSource,
} from "../lib/serviciosPublishedToApplicationDraft";

const DEBOUNCE_MS = 500;
const GALLERY_MAX = 24;

const inputClass =
  "mt-1 w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-base leading-snug text-neutral-900 shadow-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD] sm:text-sm";
const textareaClass =
  "mt-1 w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-base leading-relaxed text-neutral-900 shadow-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD] sm:text-sm";
const inputWarn = "border-amber-400 bg-amber-50/50";
const sectionCard =
  "rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6";
const labelClass = "text-sm font-semibold text-neutral-800";

type ServiciosEditHydrationState =
  | { status: "idle"; message?: never }
  | { status: "loading"; message?: never }
  | { status: "ready"; message?: never }
  | { status: "error"; message: string };

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{children}</h2>;
}

/** Coupons/offers step index (see step === 6 render block). */
const SERVICIOS_COUPON_STEP_INDEX = 6;

export function ClasificadosServiciosApplication() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );
  const editParam = searchParams?.get("edit") ?? "";
  const editListingSlug = searchParams?.get("listingSlug")?.trim() ?? "";
  const editListingId = searchParams?.get("listingId")?.trim() ?? "";
  const editLeonixAdId = searchParams?.get("leonixAdId")?.trim() ?? "";
  const listingIdentity = Boolean(editListingSlug || editListingId || editLeonixAdId);
  const dashboardSource = searchParams?.get("source") === "dashboard";
  const dashboardMode = searchParams?.get("mode") ?? "";
  const focusCoupon = searchParams?.get("focus") === "coupon-upgrade";
  const returnPanel = searchParams?.get("returnPanel") ?? "";
  const isDashboardListingEditMode =
    dashboardSource && dashboardMode === "listing-edit" && listingIdentity;
  const isDashboardOffersEditMode =
    dashboardSource &&
    (dashboardMode === "offers-edit" || dashboardMode === "coupon-edit") &&
    listingIdentity;
  const isDashboardOffersAddonMode =
    dashboardSource &&
    (dashboardMode === "offers-addon" || dashboardMode === "coupon-addon") &&
    listingIdentity;
  const isExistingDashboardListingMode =
    isDashboardListingEditMode || isDashboardOffersEditMode || isDashboardOffersAddonMode;
  const editRequested =
    isExistingDashboardListingMode || (editParam === "1" && listingIdentity);
  const dashboardReturnHref = appendLangToPath(
    returnPanel === "servicios" ? "/dashboard/servicios" : "/dashboard/servicios",
    routeLang,
  );
  const copy = getClasificadosServiciosCopy(lang);
  const labels = copy.labels as any;
  const couponDecisionTitle = labels.couponDecisionTitle || (lang === "en" ? "Add featured coupons?" : "¿Quieres agregar cupones destacados?");
  const couponDecisionBody = labels.couponDecisionBody || (lang === "en" ? "For +$99/month, show up to 4 featured coupons inside your service listing." : "Por +$99/mes puedes mostrar hasta 4 cupones destacados dentro de tu anuncio de servicios.");
  const couponDecisionAdd = labels.couponDecisionAdd || (lang === "en" ? "Add coupons" : "Agregar cupones");
  const couponDecisionSkip = labels.couponDecisionSkip || (lang === "en" ? "Continue without coupons" : "Continuar sin cupones");

  const [hydrated, setHydrated] = useState(false);
  const [previewGateMissing, setPreviewGateMissing] = useState<PublishReadinessMissingItem[] | null>(null);
  const [state, setState] = useState<ClasificadosServiciosApplicationState>(() => createDefaultClasificadosServiciosState());
  const [editHydration, setEditHydration] = useState<ServiciosEditHydrationState>({ status: editRequested ? "loading" : "idle" });
  const [editIdentity, setEditIdentity] = useState<ServiciosEditIdentity | null>(null);
  const [newFieldsMissing, setNewFieldsMissing] = useState<string[]>([]);
  const [languageOtherPending, setLanguageOtherPending] = useState("");
  const [serviceAreaPending, setServiceAreaPending] = useState("");

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
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const couponImageInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const createEmptyCouponRow = useCallback((): ClasificadosServiciosCouponRow => {
    return {
      title: "",
      description: "",
      regularPrice: "",
      specialPrice: "",
      savings: "",
      imageUrl: "",
      url: "",
      couponCode: "",
      expirationDate: "",
      redemptionNote: "",
      ctaLabel: "",
    };
  }, []);
  const [logoUrlDraft, setLogoUrlDraft] = useState("");
  const [galleryUrlDraft, setGalleryUrlDraft] = useState("");
  const [videoUrlDraft, setVideoUrlDraft] = useState("");
  const [galleryZoneActive, setGalleryZoneActive] = useState(false);
  const [couponDetailOpen, setCouponDetailOpen] = useState(false);
  const [leonixRulesOpen, setLeonixRulesOpen] = useState(false);
  const [finalStepPublishBlocked, setFinalStepPublishBlocked] = useState<string | null>(null);
  const [mediaFlash, setMediaFlash] = useState<string | null>(null);
  const [dashboardAddonCheckoutBusy, setDashboardAddonCheckoutBusy] = useState(false);
  const [dashboardContextErr, setDashboardContextErr] = useState<string | null>(null);
  const focusCouponAppliedRef = useRef(false);

  const startDashboardOffersAddonCheckout = useCallback(async () => {
    if (!editListingId) {
      setDashboardContextErr(
        lang === "en"
          ? "Listing id is missing. Return to the dashboard and try again."
          : "Falta el identificador del anuncio. Vuelve al panel e intenta de nuevo.",
      );
      return;
    }
    setDashboardAddonCheckoutBusy(true);
    setDashboardContextErr(null);
    try {
      // Package C Build 3 (C5/C6) — repurposed: coupons/offers are included in the $399/mo base
      // package, so this only verifies real capability server-side (no Stripe checkout) and then
      // moves to the offers-edit mode for the same listing to reveal the editor.
      const result = await startServiciosDashboardOffersAddonCheckout({
        listingId: editListingId,
        leonixAdId: editLeonixAdId || null,
        lang,
      });
      if (!result.ok) {
        setDashboardContextErr(result.userMessage);
        setDashboardAddonCheckoutBusy(false);
        return;
      }
      router.replace(
        serviciosOffersEditHref({
          lang,
          listingId: editListingId,
          listingSlug: editListingSlug || null,
          leonixAdId: editLeonixAdId || null,
        }),
      );
    } catch {
      setDashboardContextErr(
        lang === "en"
          ? "We could not enable the offers module."
          : "No pudimos activar el módulo de ofertas.",
      );
      setDashboardAddonCheckoutBusy(false);
    }
  }, [editListingId, editLeonixAdId, editListingSlug, lang, router]);

  const stateRef = useRef(state);
  stateRef.current = state;
  // Tracks the exact state object last written to storage so the leave-guard can tell
  // "nothing changed since the last successful save" apart from "form has content".
  const lastPersistedStateRef = useRef<typeof state | null>(null);

  useEffect(() => {
    if (!mediaFlash) return;
    const t = window.setTimeout(() => setMediaFlash(null), 4500);
    return () => window.clearTimeout(t);
  }, [mediaFlash]);

  useEffect(() => {
    if (!couponDetailOpen && !leonixRulesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setCouponDetailOpen(false);
        setLeonixRulesOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [couponDetailOpen, leonixRulesOpen]);

  useLayoutEffect(() => {
    clearLeonixReturningToEditSessionFlag();
    if (editRequested) {
      setHydrated(false);
      return;
    }
    primeServiciosExistingPublicSlug(null);
    setEditIdentity(null);
    setNewFieldsMissing([]);
    setEditHydration({ status: "idle" });
    // Always try to restore from storage first to survive hard refresh
    setState((prev) => {
      const sync = bootstrapServiciosApplicationStateSync();
      return {
        ...sync,
        applicationStepIndex: migrateServiciosApplicationStepIndex(sync.applicationStepIndex),
      };
    });
    setHydrated(true);
  }, [editRequested]);

  // Initialize pricing based on product query param from checkpoint (new listing only — never dashboard edit).
  useEffect(() => {
    if (isExistingDashboardListingMode) return;
    if (hydrated && !state.listingProduct) {
      const productParam = searchParams?.get("product");
      if (productParam === "servicios_profesionales") {
        setState((prev) => ({
          ...prev,
          listingProduct: "servicios_profesionales",
          baseMonthlyPrice: 399,
          categoryPlan: lang === "en" ? "Professional services — $399/mes" : "Servicios profesionales — $399/mes",
        }));
      }
    }
  }, [hydrated, state.listingProduct, searchParams, lang, setState, isExistingDashboardListingMode]);

  useEffect(() => {
    if (!editRequested) return;
    let cancelled = false;
    setHydrated(false);
    setEditHydration({ status: "loading" });

    void (async () => {
      try {
        if (dashboardSource) {
          await clearServiciosDraftStorageAndIdb();
        }

        const sb = createSupabaseBrowserClient();
        const { data: sess } = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
        const accessToken = sess.session?.access_token ?? null;
        if (!accessToken) {
          throw new Error(lang === "en" ? "Log in to edit this published listing." : "Inicia sesión para editar este anuncio publicado.");
        }

        const q = new URLSearchParams();
        if (editListingId) q.set("id", editListingId);
        else if (editListingSlug) q.set("slug", editListingSlug);
        else if (editLeonixAdId) q.set("leonixAdId", editLeonixAdId);
        const res = await fetch(`/api/clasificados/servicios/my-listing?${q.toString()}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });
        const data = (await res.json()) as { ok?: boolean; listing?: ServiciosPublishedListingHydrationSource; error?: string };
        if (!res.ok || !data.ok || !data.listing) {
          throw new Error(
            lang === "en"
              ? "We could not load this listing for editing. Check that it belongs to your account."
              : "No pudimos cargar este anuncio para editarlo. Confirma que pertenece a tu cuenta.",
          );
        }

        const hydratedListing = serviciosPublishedToApplicationDraft(data.listing);
        if (cancelled) return;
        setState(hydratedListing.state);
        setEditIdentity(hydratedListing.editIdentity);
        setNewFieldsMissing(hydratedListing.newFieldsMissing);
        primeServiciosExistingPublicSlug(hydratedListing.editIdentity.slug);
        await saveClasificadosServiciosApplicationResolved(hydratedListing.state);
        setEditHydration({ status: "ready" });
        setHydrated(true);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : lang === "en" ? "Listing edit load failed." : "No se pudo cargar el anuncio.";
        setEditHydration({ status: "error", message });
        setHydrated(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editRequested, editListingId, editListingSlug, editLeonixAdId, lang, dashboardSource]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void (async () => {
      const full = await rehydrateServiciosApplicationMedia(stateRef.current);
      if (cancelled) return;
      setState(full);
      await saveClasificadosServiciosApplicationResolved(full);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => {
      void saveClasificadosServiciosApplicationResolved(state);
      lastPersistedStateRef.current = state;
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [state, hydrated]);

  // Dashboard offers-edit / offers-addon deep link — jump to the coupon step after hydration (once).
  useEffect(() => {
    if (!hydrated) return;
    if (!focusCoupon) return;
    if (focusCouponAppliedRef.current) return;
    focusCouponAppliedRef.current = true;
    goToStep(SERVICIOS_COUPON_STEP_INDEX);
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        document.getElementById("servicios-step-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  }, [hydrated, focusCoupon, goToStep]);

  useEffect(() => {
    if (!hydrated) return;
    const flush = () => {
      void saveClasificadosServiciosApplicationResolved(stateRef.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hydrated]);

  useEffect(() => {
    if (step !== 6) setFinalStepPublishBlocked(null);
  }, [step]);

  useEffect(() => {
    if (
      step === 7 &&
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
    state.promotions,
    state.coupons,
    state.couponFlyer,
    state.couponsAddOn,
    state.couponMoreOffers,
  ]);

  useBusinessApplicationLeaveGuard({
    isDirty:
      hydrated &&
      state.businessName.trim().length > 0 &&
      lastPersistedStateRef.current !== state,
    persist: () => {
      void saveClasificadosServiciosApplicationResolved(stateRef.current);
      lastPersistedStateRef.current = stateRef.current;
    },
  });

  // Golden-loop: dashboard listing edit → listing-bound preview (keeps identity/mode/focus).
  // New application → plain seller preview from local draft.
  const previewHref = isExistingDashboardListingMode
    ? serviciosListingPreviewHref({
        lang,
        listingId: editListingId || null,
        listingSlug: editListingSlug || null,
        leonixAdId: editLeonixAdId || null,
        mode: isDashboardOffersEditMode ? "offers-edit" : isDashboardOffersAddonMode ? "offers-addon" : "listing-edit",
        focus: focusCoupon ? "coupon-upgrade" : null,
      })
    : withClasificadosPublishLang("/clasificados/publicar/servicios/preview", routeLang);
  const publicarHref = withClasificadosPublishLang("/clasificados/publicar", routeLang);

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

  const deleteApplicationDraft = useCallback(async () => {
    if (!window.confirm(copy.deleteConfirm)) return;
    clearServiciosPreviewReturnHandoff();
    await clearServiciosDraftStorageAndIdb();
    primeServiciosExistingPublicSlug(null);
    setEditIdentity(null);
    setNewFieldsMissing([]);
    setEditHydration({ status: "idle" });
    setState(createDefaultClasificadosServiciosState());
    setPreviewGateMissing(null);
  }, [copy.deleteConfirm]);

  const preset = useMemo(() => getBusinessTypePreset(state.businessTypeId), [state.businessTypeId]);

  const listingTemplate = useMemo(
    () => resolveServiciosApplicationTemplate(state.businessTypeId),
    [state.businessTypeId],
  );

  const credentialPlaceholders = useMemo(
    () => getServiciosCredentialPlaceholders(listingTemplate, lang),
    [listingTemplate, lang],
  );

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
  const emailInvalid = state.email.trim().length > 0 && !isValidEmail(state.email);
  const whatsappBizInvalid = state.whatsappBusinessUrl.trim().length > 0 && !isProbablyValidWebUrl(state.whatsappBusinessUrl);
  const socialInvalid = {
    ig: state.socialInstagram.trim() && !isProbablyValidWebUrl(state.socialInstagram),
    fb: state.socialFacebook.trim() && !isProbablyValidWebUrl(state.socialFacebook),
    yt: state.socialYoutube.trim() && !isProbablyValidWebUrl(state.socialYoutube),
    tt: state.socialTiktok.trim() && !isProbablyValidWebUrl(state.socialTiktok),
    li: state.socialLinkedin.trim() && !isProbablyValidWebUrl(state.socialLinkedin),
    x: state.socialX.trim() && !isProbablyValidWebUrl(state.socialX),
    sc: state.socialSnapchat.trim() && !isProbablyValidWebUrl(state.socialSnapchat),
    google: state.googleReviewsUrl.trim() && !isProbablyValidWebUrl(state.googleReviewsUrl),
    googleBusiness: state.googleBusinessUrl.trim() && !isProbablyValidWebUrl(state.googleBusinessUrl),
    yelp: state.yelpReviewsUrl.trim() && !isProbablyValidWebUrl(state.yelpReviewsUrl),
    extra1: state.extraLink1Url.trim() && !isProbablyValidWebUrl(state.extraLink1Url),
    extra2: state.extraLink2Url.trim() && !isProbablyValidWebUrl(state.extraLink2Url),
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

  /** `languageOtherLines` stays a single newline-joined string in storage (unchanged field/shape);
   * these only adapt it to the shared LanguagesInput's removable-chip list presentation. */
  const customLanguageLines = useMemo(
    () => state.languageOtherLines.split("\n").map((l) => l.trim()).filter(Boolean),
    [state.languageOtherLines],
  );

  // Shared item 39 — the fixed language options' own labels (both locales), so typing "French"/
  // "francés" as a custom entry is blocked the same way an already-added custom duplicate is,
  // regardless of whether "Inglés/English" is currently selected.
  const FIXED_LANGUAGE_LABELS = useMemo(
    () => ["español", "spanish", "inglés", "ingles", "english"].map(normalizeServiceOfferedDedupeKey),
    [],
  );

  const addCustomLanguage = useCallback(() => {
    const trimmed = languageOtherPending.trim();
    if (!trimmed) return;
    const candidateKey = normalizeServiceOfferedDedupeKey(trimmed);
    if (FIXED_LANGUAGE_LABELS.includes(candidateKey)) {
      setLanguageOtherPending("");
      return;
    }
    setState((s) => {
      const existing = s.languageOtherLines.split("\n").map((l) => l.trim()).filter(Boolean);
      if (existing.some((v) => normalizeServiceOfferedDedupeKey(v) === candidateKey)) return s;
      return { ...s, languageOtherLines: [...existing, trimmed].join("\n") };
    });
    setLanguageOtherPending("");
  }, [languageOtherPending, FIXED_LANGUAGE_LABELS]);

  const removeCustomLanguageAt = useCallback((index: number) => {
    setState((s) => {
      const existing = s.languageOtherLines.split("\n").map((l) => l.trim()).filter(Boolean);
      return { ...s, languageOtherLines: existing.filter((_, i) => i !== index).join("\n") };
    });
  }, []);

  /** `serviceAreaNotes` stays the same free-text string field/shape in storage (no migration) —
   * each area is one newline-delimited line, same pattern as `languageOtherLines`. Comma is
   * NEVER treated as a delimiter here so an area label containing a comma (e.g. "San Jose, CA")
   * stays one chip (S-073). A one-time legacy comma-joined draft is migrated to newline-joined
   * form in `clasificadosServiciosApplicationNormalize.ts` on hydrate, not here. */
  const serviceAreaChips = useMemo(
    () => state.serviceAreaNotes.split("\n").map((s) => s.trim()).filter(Boolean),
    [state.serviceAreaNotes],
  );

  const addServiceArea = useCallback(() => {
    const trimmed = serviceAreaPending.trim();
    if (!trimmed) return;
    setState((s) => {
      const existing = s.serviceAreaNotes.split("\n").map((v) => v.trim()).filter(Boolean);
      if (existing.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return s;
      return { ...s, serviceAreaNotes: [...existing, trimmed].join("\n") };
    });
    setServiceAreaPending("");
  }, [serviceAreaPending]);

  const removeServiceAreaAt = useCallback((index: number) => {
    setState((s) => {
      const existing = s.serviceAreaNotes.split("\n").map((v) => v.trim()).filter(Boolean);
      return { ...s, serviceAreaNotes: existing.filter((_, i) => i !== index).join("\n") };
    });
  }, []);

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
        field === "selectedReasonIds"
          ? prev.customReasonIncluded && prev.customReasonLabel.trim()
            ? 1
            : 0
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
    () => state.selectedQuickFactIds.length,
    [state.selectedQuickFactIds],
  );
  const businessHighlightSelectionCount = useMemo(
    () => state.selectedBusinessHighlightIds.length,
    [state.selectedBusinessHighlightIds],
  );

  const pickFileToUrl = async (file: File | null, field: "logoUrl") => {
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

  const addVideoUrl = () => {
    const raw = videoUrlDraft.trim();
    if (!raw) return;
    // Globalization Package B (Gate B3) — Servicios previously accepted any web URL for a
    // video slot (the only paid lane with no video validator). Now gated by the shared strict
    // validator (https-only, URL-parseable, never blob:/data:) — same semantics as Autos'.
    const strictNormalized = normalizeStrictExternalVideoUrl(raw);
    if (!strictNormalized || !isProbablyValidWebUrl(raw)) {
      setMediaFlash(copy.labels.invalidUrl);
      return;
    }
    const normalizedUrl = normalizeHttpUrl(strictNormalized);
    setState((prev) => {
      if (prev.videos.length >= SERVICIOS_MAX_VIDEO_URLS) {
        queueMicrotask(() =>
          setMediaFlash(copy.labels.videosLimitHint.replace("{max}", String(SERVICIOS_MAX_VIDEO_URLS))),
        );
        return prev;
      }
      const duplicate = prev.videos.some(
        (v) => v.url.trim().toLowerCase() === normalizedUrl.trim().toLowerCase(),
      );
      if (duplicate) {
        queueMicrotask(() => setMediaFlash(copy.labels.videoDuplicateUrl));
        return prev;
      }
      const row = { id: newVideoId(), url: normalizedUrl, source: "url" as const };
      const next = [...prev.videos, row].slice(0, SERVICIOS_MAX_VIDEO_URLS);
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

  const applyUrlFallback = (field: "logoUrl", draft: string, clearDraft: () => void) => {
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

  /** Adapter only — `state.hours` stays the same DayHoursRow[] shape/keys ("open"/"close" strings,
   * never undefined); the shared HoursEditor's optional openTime/closeTime schedule shape is
   * translated at this boundary so no draft field is renamed. */
  const hoursEditorDays: HoursEditorDayRow[] = state.hours.map((row) => ({
    key: row.day,
    label: WEEK_DAY_LABELS[row.day][lang],
    schedule: { closed: row.closed, openTime: row.open || undefined, closeTime: row.close || undefined },
  }));

  const onHoursEditorDayChange = (day: string, next: HoursEditorDaySchedule) => {
    updateHour(day as DayKey, { closed: next.closed, open: next.openTime ?? "", close: next.closeTime ?? "" });
  };

  /** Multi-entry special hours (contract §3.4 items 46-48) — Add/change/remove for the shared
   * HoursEditor's `specialHoursList` prop. Each entry gets its own id so it can be independently
   * edited/removed without disturbing the others. */
  const addSpecialHoursEntry = useCallback(() => {
    setState((s) => ({
      ...s,
      specialHoursEntries: [
        ...s.specialHoursEntries,
        { id: `special_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, label: "", note: "" },
      ],
    }));
  }, []);

  const changeSpecialHoursEntry = useCallback(
    (id: string, patch: Partial<Pick<ServiciosSpecialHoursEntry, "label" | "note">>) => {
      setState((s) => ({
        ...s,
        specialHoursEntries: s.specialHoursEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
    },
    [],
  );

  const removeSpecialHoursEntry = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      specialHoursEntries: s.specialHoursEntries.filter((e) => e.id !== id),
    }));
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F6F0E2] text-[#3D2C12]">
      {isExistingDashboardListingMode && editHydration.status === "error" ? (
        <main className="mx-auto max-w-lg px-4 pb-16 pt-24 sm:pt-28">
          <h1 className="text-xl font-bold text-[#3D2C12]">
            {lang === "en" ? "Edit mode could not load" : "No se pudo cargar el modo edición"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-red-900">{editHydration.message}</p>
          <Link
            href={dashboardReturnHref}
            className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#3B66AD] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699]"
          >
            {lang === "en" ? "Back to dashboard" : "Volver al panel"}
          </Link>
        </main>
      ) : isExistingDashboardListingMode && (editHydration.status === "loading" || !hydrated) ? (
        <main className="mx-auto max-w-lg px-4 pb-16 pt-24 sm:pt-28">
          <p className="text-sm font-semibold text-[#5D4A25]" role="status">
            {lang === "en" ? "Loading saved listing for editing…" : "Cargando anuncio publicado…"}
          </p>
        </main>
      ) : (
      <>
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-24 sm:pb-12 sm:pt-28">
        <div className="mb-6 rounded-2xl border border-[#D8C79A]/60 bg-[#FFFDF7]/95 p-4 shadow-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7a62]">Leonix Clasificados</p>
          <h1 className="mt-2 text-xl font-extrabold tracking-tight text-[#3D2C12] sm:text-2xl">{copy.pageTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5D4A25]/90">{copy.pageSubtitle}</p>
          <Link
            href={isExistingDashboardListingMode ? dashboardReturnHref : publicarHref}
            className="mt-2 inline-flex min-h-[40px] items-center text-xs font-medium text-[#5D4A25]/85 underline underline-offset-2 hover:text-[#3D2C12]"
          >
            {isExistingDashboardListingMode ? (lang === "en" ? "← Back to dashboard" : "← Volver al panel") : copy.linkBack}
          </Link>

          {editHydration.status === "loading" ? (
            <div className="mt-4 rounded-xl border border-[#D8C79A]/70 bg-[#FBF7EF] px-3 py-2 text-sm font-semibold text-[#5D4A25]" role="status">
              {lang === "en" ? "Loading saved listing for editing…" : "Cargando anuncio guardado para editar…"}
            </div>
          ) : null}
          {editHydration.status === "error" ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
              <p className="font-bold">{lang === "en" ? "Edit mode could not load" : "No se pudo cargar el modo edición"}</p>
              <p className="mt-1">{editHydration.message}</p>
            </div>
          ) : null}
          {editIdentity ? (
            <div className="mt-4 rounded-xl border border-[#C9782F]/35 bg-[#FFF4E8] px-3 py-2 text-sm text-[#5D3418]" data-servicios-edit-mode="published">
              <p className="font-bold">{lang === "en" ? "Editing published listing" : "Editando anuncio publicado"}</p>
              <p className="mt-1 text-xs leading-relaxed">
                {editIdentity.leonixAdId ? (
                  <>
                    <span className="font-semibold">{lang === "en" ? "Leonix Ad ID" : "ID Leonix"}:</span>{" "}
                    <span className="font-mono">{editIdentity.leonixAdId}</span>
                    <span> · </span>
                  </>
                ) : null}
                <span className="font-semibold">Status:</span> {editIdentity.status}
                {editIdentity.slug ? (
                  <>
                    <span> · </span>
                    <span className="font-semibold">Slug:</span> <span className="font-mono">{editIdentity.slug}</span>
                  </>
                ) : null}
              </p>
              <p className="mt-1 text-xs leading-relaxed">
                {lang === "en"
                  ? "Changes will update this listing after review/publish."
                  : "Los cambios actualizarán este anuncio después de revisión/publicación."}
              </p>
            </div>
          ) : null}
          {newFieldsMissing.length > 0 ? (
            <div className="mt-3 rounded-xl border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-orange-950" data-servicios-new-fields-available="1">
              <p className="font-bold">{lang === "en" ? "New fields available" : "Nuevos campos disponibles"}</p>
              <p className="mt-1 text-xs leading-relaxed">
                {lang === "en"
                  ? "Review new fields before updating your public ad."
                  : "Revisa los nuevos campos antes de actualizar tu anuncio público."}
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            <Link
              href={lang === "es" ? "?lang=en" : "?lang=es"}
              className="inline-flex min-h-[40px] items-center text-xs font-semibold text-[#5D4A25] underline underline-offset-2 hover:text-[#3B66AD]"
            >
              {copy.langToggle}
            </Link>
          </div>

          <div className="mt-4 border-t border-[#D8C79A]/40 pt-4">
            {/* Pricing Summary */}
            {state.categoryPlan && state.baseMonthlyPrice ? (
              <div className="mb-4 rounded-xl border border-[#C9782F]/50 bg-[#FFFDF7]/50 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#8a7a62]">
                      {lang === "en" ? "Selected plan:" : "Plan seleccionado:"}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#3D2C12]">
                      {state.categoryPlan}
                    </p>
                    {state.couponsAddOn && (
                      <p className="mt-1 text-xs text-[#5D4A25]/90">
                        + {lang === "en" ? "Coupons — included" : "Cupones — incluidos"}
                      </p>
                    )}
                  </div>
                  {isExistingDashboardListingMode ? (
                    <Link
                      href={dashboardReturnHref}
                      className="text-xs font-semibold text-[#5D4A25]/85 underline underline-offset-2 hover:text-[#3D2C12]"
                    >
                      {lang === "en" ? "Back to dashboard" : "Volver al panel"}
                    </Link>
                  ) : (
                    <Link
                      href="/clasificados/publicar/servicios/checkpoint"
                      className="text-xs font-semibold text-[#5D4A25]/85 underline underline-offset-2 hover:text-[#3D2C12]"
                    >
                      {lang === "en" ? "Change plan" : "Cambiar plan"}
                    </Link>
                  )}
                </div>
              </div>
            ) : null}

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
              ? "¿No encuentras tu categoría? Elige “Otro servicio” y detalla en servicios y descripción."
              : "Don’t see your trade? Pick “Other service,” then describe your offer in Services and About."}
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
            {BUSINESS_TYPE_PRESETS
              .filter((p) => p.id !== "servicio_no_listado")
              // Sort only the rendered/mapped list by the locale-appropriate display label —
              // BUSINESS_TYPE_PRESETS itself keeps its declaration order, and stored `value`/id
              // is untouched, so sorting can never affect stored canonical IDs (S-011).
              .slice()
              .sort((a, b) =>
                (lang === "en" ? a.labelEn : a.labelEs).localeCompare(lang === "en" ? b.labelEn : b.labelEs, lang),
              )
              .map((p) => (
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
              {copy.labels.cityHelpDetail.trim() ? (
                <p className="mt-0.5 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.cityHelpDetail}</p>
              ) : null}
              <CityAutocomplete
                className={inputClass}
                value={state.city}
                placeholder={copy.labels.cityPlaceholder}
                onChange={(next) => setState((s) => ({ ...s, city: next }))}
                lang={lang}
                variant="light"
                freeText
              />
            </div>
            <div>
              <label className={labelClass}>{copy.labels.state}</label>
              {isLeonixLbUsCountry(state.country) ? (
                <select
                  className={inputClass}
                  value={state.state}
                  onChange={(e) => setState((s) => ({ ...s, state: e.target.value }))}
                  autoComplete="address-level1"
                >
                  {US_STATE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.code} — {lang === "es" && opt.code === "CA" ? "California" : opt.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputClass}
                  value={state.state}
                  placeholder={copy.labels.statePlaceholder}
                  onChange={(e) => setState((s) => ({ ...s, state: e.target.value }))}
                  autoComplete="address-level1"
                />
              )}
            </div>
            <div>
              <label className={labelClass}>{copy.labels.country}</label>
              <input
                className={inputClass}
                value={state.country}
                placeholder={copy.labels.countryPlaceholder}
                onChange={(e) => setState((s) => ({ ...s, country: e.target.value }))}
                autoComplete="country-name"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{copy.labels.serviceAreas}</label>
              <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.serviceAreasHelp}</p>
              {serviceAreaChips.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {serviceAreaChips.map((area, index) => (
                    <span
                      key={`${area}-${index}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#D8C79A] bg-white px-3 py-1 text-sm font-medium text-[#3D2C12]"
                    >
                      {area}
                      <button
                        type="button"
                        className="ml-0.5 rounded-full px-1 text-[#6b5c42] hover:text-[#3D2C12]"
                        aria-label={lang === "es" ? `Quitar ${area}` : `Remove ${area}`}
                        onClick={() => removeServiceAreaAt(index)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  className={`${inputClass} flex-1 min-w-[10rem]`}
                  placeholder={copy.labels.serviceAreasHelp}
                  value={serviceAreaPending}
                  onChange={(e) => setServiceAreaPending(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addServiceArea();
                    }
                  }}
                />
                <button
                  type="button"
                  className="shrink-0 rounded-xl border border-[#D8C79A] bg-white px-4 py-2 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFFCF2]"
                  onClick={addServiceArea}
                >
                  {lang === "es" ? "Añadir" : "Add"}
                </button>
              </div>
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
                  {isLeonixLbUsCountry(state.physicalCountry) ? (
                    <select
                      className={inputClass}
                      value={state.physicalRegion}
                      onChange={(e) => setState((s) => ({ ...s, physicalRegion: e.target.value }))}
                      autoComplete="address-level1"
                    >
                      {US_STATE_OPTIONS.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.code} — {lang === "es" && opt.code === "CA" ? "California" : opt.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={inputClass}
                      value={state.physicalRegion}
                      placeholder={copy.labels.statePlaceholder}
                      onChange={(e) => setState((s) => ({ ...s, physicalRegion: e.target.value }))}
                      autoComplete="address-level1"
                    />
                  )}
                </div>
                <div>
                  <label className={labelClass}>{copy.labels.physicalCountry}</label>
                  <input
                    className={inputClass}
                    value={state.physicalCountry}
                    placeholder={copy.labels.countryPlaceholder}
                    onChange={(e) => setState((s) => ({ ...s, physicalCountry: e.target.value }))}
                    autoComplete="country-name"
                  />
                </div>
                <div className="sm:col-span-2 sm:max-w-xs">
                  <label className={labelClass}>{copy.labels.physicalPostalCode}</label>
                  {copy.labels.physicalPostalCodeHelp.trim() ? (
                    <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.physicalPostalCodeHelp}</p>
                  ) : null}
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
                  <PhoneInput
                    className={inputClass}
                    autoComplete="tel"
                    placeholder={lang === "es" ? "(713) 555-0100" : "(713) 555-0100"}
                    value={state.phone}
                    onChange={(next) => setState((s) => ({ ...s, phone: next }))}
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
                  <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.whatsappHelp}</p>
                  <input
                    className={`${inputClass} mt-2`}
                    type="tel"
                    inputMode="tel"
                    placeholder={lang === "es" ? "+1 713 555 0100" : "+1 713 555 0100"}
                    value={formatWhatsAppInputDisplay(state.whatsapp)}
                    onChange={(e) => setState((s) => ({ ...s, whatsapp: formatWhatsAppInputDisplay(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>{copy.labels.whatsappBusinessUrl}</label>
                  <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.whatsappBusinessUrlHelp}</p>
                  <input
                    className={`${inputClass} mt-2 ${whatsappBizInvalid ? inputWarn : ""}`}
                    type="url"
                    inputMode="url"
                    placeholder={lang === "es" ? "https://wa.me/message/… o https://whatsapp.com/channel/…" : "https://wa.me/message/… or https://whatsapp.com/channel/…"}
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
                    ["socialX", copy.labels.xTwitter, state.socialX, socialInvalid.x, "https://x.com/tunegocio"] as const,
                    ["socialSnapchat", copy.labels.snapchat, state.socialSnapchat, socialInvalid.sc, "https://www.snapchat.com/add/cuenta"] as const,
                  ] as const
                ).map(([key, lab, val, inv, ph]) => (
                  <div key={key} className="min-w-0">
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
              <h3 className="text-base font-bold text-[#3D2C12]">{copy.labels.contactReviewsHeading}</h3>
              <p className="mt-1 text-xs text-[#6b5c42]">
                {lang === "es"
                  ? "Solo enlaces a tus perfiles de opiniones — no inventamos calificaciones."
                  : "Links to your review profiles only — we never invent ratings."}
              </p>
              <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                <div className="min-w-0 sm:col-span-2">
                  <label className={labelClass}>{copy.labels.googleBusiness}</label>
                  <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.googleBusinessHint}</p>
                  <input
                    className={`${inputClass} mt-2 ${socialInvalid.googleBusiness ? inputWarn : ""}`}
                    type="url"
                    inputMode="url"
                    placeholder="https://business.google.com/…"
                    value={state.googleBusinessUrl}
                    onChange={(e) => setState((s) => ({ ...s, googleBusinessUrl: e.target.value }))}
                  />
                  {socialInvalid.googleBusiness ? (
                    <p className="mt-1 text-xs text-amber-800">{copy.labels.invalidUrl}</p>
                  ) : null}
                </div>
                {(
                  [
                    ["googleReviewsUrl", copy.labels.googleReviews, state.googleReviewsUrl, socialInvalid.google, "https://g.page/r/…/review"] as const,
                    ["yelpReviewsUrl", copy.labels.yelpReviews, state.yelpReviewsUrl, socialInvalid.yelp, "https://www.yelp.com/biz/…"] as const,
                  ] as const
                ).map(([key, lab, val, inv, ph]) => (
                  <div key={key} className="min-w-0">
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
              <h3 className="text-base font-bold text-[#3D2C12]">{copy.labels.contactExtraLinksHeading}</h3>
              <div className="mt-4 grid min-w-0 gap-4">
                {(
                  [
                    {
                      urlKey: "extraLink1Url" as const,
                      labelKey: "extraLink1Label" as const,
                      urlVal: state.extraLink1Url,
                      labelVal: state.extraLink1Label,
                      urlInv: socialInvalid.extra1,
                    },
                    {
                      urlKey: "extraLink2Url" as const,
                      labelKey: "extraLink2Label" as const,
                      urlVal: state.extraLink2Url,
                      labelVal: state.extraLink2Label,
                      urlInv: socialInvalid.extra2,
                    },
                  ] as const
                ).map((row, idx) => (
                  <div key={row.urlKey} className="grid min-w-0 gap-3 rounded-2xl border border-[#D8C79A]/40 bg-[#FFFCF7]/80 p-4 sm:grid-cols-2">
                    <div className="min-w-0 sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#6b5c42]">
                        {lang === "en" ? `Link ${idx + 1}` : `Enlace ${idx + 1}`}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <label className={labelClass}>{copy.labels.extraLinkUrl}</label>
                      <input
                        className={`${inputClass} ${row.urlInv ? inputWarn : ""}`}
                        type="url"
                        inputMode="url"
                        placeholder="https://"
                        value={row.urlVal}
                        onChange={(e) => setState((s) => ({ ...s, [row.urlKey]: e.target.value }))}
                      />
                      {row.urlInv ? <p className="mt-1 text-xs text-amber-800">{copy.labels.invalidUrl}</p> : null}
                    </div>
                    <div className="min-w-0">
                      <label className={labelClass}>{copy.labels.extraLinkLabel}</label>
                      <p className="mb-1 text-[11px] text-[#6b5c42]">{copy.labels.extraLinkLabelHelp}</p>
                      <input
                        className={inputClass}
                        type="text"
                        maxLength={48}
                        placeholder={lang === "es" ? "Agendar cita" : "Book appointment"}
                        value={row.labelVal}
                        onChange={(e) => setState((s) => ({ ...s, [row.labelKey]: e.target.value }))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 mt-2 border-t border-[#D8C79A]/35 pt-6">
              <p className={labelClass}>{copy.labels.languages}</p>
              <LanguagesInput
                className="mt-2"
                options={LANGUAGE_OPTION_CHIPS.map((c) => ({ key: c.id, label: lang === "en" ? c.en : c.es }))}
                selectedKeys={state.languageIds}
                onToggle={toggleLangChip}
                otherKey="lang_otro"
                customValues={customLanguageLines}
                customInputValue={languageOtherPending}
                onCustomInputChange={setLanguageOtherPending}
                onAddCustom={addCustomLanguage}
                onRemoveCustom={removeCustomLanguageAt}
                labels={{
                  otherLabel: copy.labels.languageOtherLabel,
                  otherHelper: copy.labels.languageOtherHelp,
                  otherPlaceholder: copy.labels.languageOtherPlaceholder,
                  add: lang === "en" ? "Add" : "Añadir",
                  removeAria: (value) => (lang === "en" ? `Remove ${value}` : `Quitar ${value}`),
                }}
              />
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
              ? "* Requiere al menos una imagen destacada en la galería."
              : "* Requires at least one featured gallery image."}
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs leading-relaxed text-[#6b5c42]">
            <li>{copy.labels.galleryFeaturedHint}</li>
            <li>{copy.labels.galleryMoreHint}</li>
            <li>{copy.labels.galleryMultiSelectHint}</li>
            <li>{copy.labels.videosHint}</li>
          </ul>

          <div className="mt-6 max-w-md">
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
            <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.videosHint}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.videosHelper}</p>
            <p className="mt-2 text-xs font-semibold tabular-nums text-[#5D4A25]">
              {copy.labels.videosCountLine
                .replace("{n}", String(state.videos.length))
                .replace("{max}", String(SERVICIOS_MAX_VIDEO_URLS))}
            </p>
            {state.videos.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {state.videos.map((v, index) => {
                  const url = v.url ?? "";
                  const isLegacyFile = url.startsWith("data:") || v.source === "file";
                  const badge = isLegacyFile ? copy.labels.videoFromFile : copy.labels.videoLinkBadge;
                  return (
                    <li
                      key={v.id}
                      className="flex flex-col gap-3 rounded-xl border border-[#D8C79A]/70 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#8a7a62]">
                          {lang === "en" ? `Video ${index + 1}` : `VIDEO ${index + 1}`}
                        </p>
                        <span className="mt-1 inline-flex rounded-full bg-[#3B66AD]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2d528d]">
                          {badge}
                        </span>
                        <p className="mt-1 truncate text-sm text-[#3D2C12]" title={isLegacyFile ? undefined : url}>
                          {shortenServiciosVideoUrlDisplay(url)}
                        </p>
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
                          className="min-h-[44px] shrink-0 rounded-lg border border-[#D8C79A]/80 px-3 py-1.5 text-xs font-semibold text-[#3D2C12] hover:bg-[#FFFCF7]"
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
            {state.videos.length < SERVICIOS_MAX_VIDEO_URLS ? (
              <div className="mt-4 max-w-lg">
                <label className={labelClass}>{copy.labels.videoUrlLabel}</label>
                <div className="mt-1 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
                  <input
                    className={`${inputClass} mt-0 min-w-0 sm:max-w-md sm:flex-1`}
                    placeholder={copy.labels.videoUrlPlaceholder}
                    value={videoUrlDraft}
                    onChange={(e) => setVideoUrlDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addVideoUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!videoUrlDraft.trim()}
                    className="inline-flex min-h-[44px] w-full shrink-0 touch-manipulation items-center justify-center rounded-xl border border-[#D8C79A]/80 bg-[#FFFCF7] px-4 text-sm font-semibold text-[#3D2C12] hover:border-[#3B66AD]/45 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    onClick={addVideoUrl}
                  >
                    {copy.labels.addVideoUrl}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs font-medium text-[#8a7a62]">
                {copy.labels.videosLimitHint.replace("{max}", String(SERVICIOS_MAX_VIDEO_URLS))}
              </p>
            )}
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
            placeholder={copy.labels.businessFocusPlaceholder}
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
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.selectionMaxReasons}</p>
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
              <div className="mt-6 rounded-xl border border-[#D8C79A]/50 bg-[#FFFCF7]/80 px-4 py-3">
                <h3 className="text-sm font-bold text-[#3D2C12]">{copy.labels.simpleOfferPhrasesTitle}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#5D4A25]/90">{copy.labels.simpleOfferPhrasesHelper}</p>
              </div>
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
                {preset.quickFacts
                  .filter((c: ChipDef) => !isJunkServiciosQuickFactLabel(chipLabel(c, lang)))
                  .map((c: ChipDef) => {
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
              </div>
              {quickFactsSelectionCount >= MAX_QUICK_FACTS_SELECTION ? (
                <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.selectionMaxQuickFacts}</p>
              ) : null}
              <label className={`mt-6 block ${labelClass}`}>{copy.labels.customQuickFact}</label>
              <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.customChipShortHint}</p>
              <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  className={inputClass}
                  placeholder={copy.labels.customChipPlaceholder}
                  maxLength={CUSTOM_CHIP_MAX_LENGTH}
                  value={state.customQuickFactLabel}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, CUSTOM_CHIP_MAX_LENGTH);
                    setState((s) => ({ ...s, customQuickFactLabel: v }));
                  }}
                />
                <button
                  type="button"
                  disabled={
                    !state.customQuickFactLabel.trim() ||
                    state.customQuickFacts.length >= MAX_CUSTOM_QUICK_FACTS
                  }
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  onClick={() => {
                    setState((prev) => {
                      const r = evaluateAddCustomQuickFact(prev, lang, prev.customQuickFactLabel);
                      if (!r.ok) return prev;
                      return enforceServiciosSelectionCaps({
                        ...prev,
                        customQuickFacts: [...prev.customQuickFacts, r.label],
                        customQuickFactLabel: "",
                      });
                    });
                  }}
                >
                  {copy.labels.addCustomChip}
                </button>
              </div>
              {state.customQuickFacts.length >= MAX_CUSTOM_QUICK_FACTS ? (
                <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.customQuickFactsMax}</p>
              ) : null}
              {state.customQuickFacts.length > 0 ? (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-[#3D2C12]">{copy.labels.addedQuickFactsSection}</p>
                  <div className="-mx-1 mt-2 flex flex-wrap gap-2 px-1">
                    {state.customQuickFacts.map((label, i) => (
                      <button
                        key={`cqf-${i}-${label}`}
                        type="button"
                        title={label}
                        aria-label={`${copy.labels.remove}: ${label}`}
                        onClick={() =>
                          setState((prev) =>
                            enforceServiciosSelectionCaps({
                              ...prev,
                              customQuickFacts: prev.customQuickFacts.filter((_, j) => j !== i),
                            }),
                          )
                        }
                        className="inline-flex max-w-full min-w-0 min-h-[40px] touch-manipulation items-center gap-1.5 rounded-full border border-[#3B66AD] bg-[#3B66AD]/10 px-3 py-2 text-left text-sm font-medium text-[#1e3a5f] ring-1 ring-[#3B66AD]/20 transition active:scale-[0.99] hover:bg-[#3B66AD]/15"
                      >
                        <span className="min-w-0 max-w-[14rem] truncate sm:max-w-[18rem]">{label}</span>
                        <FiX className="h-3.5 w-3.5 shrink-0 text-[#1e3a5f]/70" aria-hidden />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
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

          <div className="mt-5 space-y-6">
            {SERVICIOS_AMENITY_GROUPS.filter((g) => g.id !== "other").map((group) => {
              const options = SERVICIOS_AMENITY_OPTIONS.filter((o) => o.groupId === group.id);
              const groupCustoms = state.customAmenityOptionsByGroup?.[group.id] ?? [];
              const pendingGroupValue = state.pendingCustomAmenityOptionByGroup?.[group.id] ?? "";
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

                  <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                    <input
                      className={inputClass}
                      placeholder={copy.labels.amenitiesPlaceholder}
                      maxLength={CUSTOM_SERVICIOS_AMENITY_LABEL_MAX}
                      value={pendingGroupValue}
                      onChange={(e) => {
                        const v = e.target.value.slice(0, CUSTOM_SERVICIOS_AMENITY_LABEL_MAX);
                        setState((s) => ({
                          ...s,
                          pendingCustomAmenityOptionByGroup: {
                            ...s.pendingCustomAmenityOptionByGroup,
                            [group.id]: v,
                          },
                        }));
                      }}
                    />
                    <button
                      type="button"
                      disabled={
                        !pendingGroupValue.trim() ||
                        groupCustoms.length >= MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS_PER_GROUP
                      }
                      className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      onClick={() => {
                        setState((prev) => {
                          const bucket = prev.customAmenityOptionsByGroup?.[group.id] ?? [];
                          const pending = prev.pendingCustomAmenityOptionByGroup?.[group.id] ?? "";
                          const r = evaluateAddCustomAmenityOptionForGroup(bucket, pending);
                          if (!r.ok) return prev;
                          return enforceServiciosSelectionCaps({
                            ...prev,
                            customAmenityOptionsByGroup: {
                              ...prev.customAmenityOptionsByGroup,
                              [group.id]: [...bucket, r.label],
                            },
                            pendingCustomAmenityOptionByGroup: {
                              ...prev.pendingCustomAmenityOptionByGroup,
                              [group.id]: "",
                            },
                          });
                        });
                      }}
                    >
                      {copy.labels.amenitiesAdd}
                    </button>
                  </div>

                  {groupCustoms.length >= MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS_PER_GROUP ? (
                    <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.amenitiesCustomMax}</p>
                  ) : null}

                  {groupCustoms.length > 0 ? (
                    <div className="-mx-1 mt-2 flex flex-wrap gap-2 px-1">
                      {groupCustoms.map((label, i) => (
                        <button
                          key={`amenity-${group.id}-${i}-${label}`}
                          type="button"
                          title={label}
                          aria-label={`${copy.labels.remove}: ${label}`}
                          onClick={() =>
                            setState((prev) =>
                              enforceServiciosSelectionCaps({
                                ...prev,
                                customAmenityOptionsByGroup: {
                                  ...prev.customAmenityOptionsByGroup,
                                  [group.id]: (prev.customAmenityOptionsByGroup?.[group.id] ?? []).filter(
                                    (_, j) => j !== i,
                                  ),
                                },
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
                  ) : null}
                </div>
              );
            })}
          </div>
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
            placeholder={credentialPlaceholders.licenseType}
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
            placeholder={credentialPlaceholders.licenseNumber}
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
            placeholder={credentialPlaceholders.licenseAuthority}
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
            placeholder={credentialPlaceholders.insuranceType}
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
          <p className="mt-1 text-xs text-[#8a7a62]">{copy.labels.certificationsHint}</p>
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

        {step === 5 ? (
          <>
        {/* Hours */}
        <section className={sectionCard}>
          <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.hours}</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.hoursOutputHint}</p>
          <HoursEditor
            className="mt-4"
            days={hoursEditorDays}
            onDayChange={onHoursEditorDayChange}
            closedLabel={copy.labels.closed}
            specialHoursList={{
              entries: state.specialHoursEntries,
              onAdd: addSpecialHoursEntry,
              onEntryChange: changeSpecialHoursEntry,
              onRemove: removeSpecialHoursEntry,
              sectionLabel: copy.labels.specialHoursSectionLabel,
              sectionHelper: copy.labels.specialHoursSectionHelper,
              addLabel: copy.labels.specialHoursAdd,
              labelPlaceholder: copy.labels.specialHoursLabelPlaceholder,
              notePlaceholder: copy.labels.specialHoursNotePlaceholder,
              removeAriaLabel: (entry: HoursEditorSpecialHoursEntry) =>
                entry.label.trim()
                  ? `${copy.labels.specialHoursRemoveAria}: ${entry.label.trim()}`
                  : copy.labels.specialHoursRemoveAria,
            }}
          />
        </section>
          </>
        ) : null}

        {step === 6 ? (
          <>
            {/* Coupons section - only shows when add-on is enabled */}
            {state.couponsAddOn ? (
              <section className={sectionCard} aria-labelledby="sec-coupons">
                <div className="flex items-center justify-between">
                  <SectionTitle>{copy.labels.couponsFeaturedStepTitle}</SectionTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[color:var(--lx-text)]">
                      {lang === "en" ? "Coupons enabled — included" : "Cupones activados — incluidos"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          couponsAddOn: false,
                          couponsMonthlyPrice: 0,
                          coupons: [],
                        }));
                      }}
                      className="text-sm font-semibold text-red-700 underline"
                    >
                      {lang === "en" ? "Remove" : "Quitar"}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                  {copy.labels.couponsFeaturedStepBody}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">
                  {copy.labels.couponsFeaturedStepSimpleHint}
                </p>
                <div className="mt-4 grid gap-4">
                {(state.coupons ?? []).map((coupon, i) => (
                  <div key={i} className="rounded-xl border border-[color:var(--lx-nav-border)] bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{lang === "en" ? `Coupon ${i + 1}` : `Cupón ${i + 1}`}</span>
                      <button type="button" className="text-sm text-red-700 underline" onClick={() => {
                        setState((s) => ({
                          ...s,
                          coupons: s.coupons.length > 1
                            ? s.coupons.filter((_, j) => j !== i)
                            : [createEmptyCouponRow()],
                        }));
                      }}>
                        {lang === "en" ? "Remove" : "Quitar"}
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#6b5c42]">
                          {lang === "en" ? "Coupon title" : "Título del cupón"}
                        </label>
                        <p className="mt-1 text-xs text-[#5D4A25]/80">
                          {lang === "en" ? "Ex: 2x1 on tacos, 10% off, Family combo" : "Ej. 2x1 en tacos, 10% de descuento, Combo familiar"}
                        </p>
                        <input
                          className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                          value={coupon.title}
                          onChange={(e) => {
                            setState((s) => {
                              const next = [...s.coupons];
                              const cur = next[i] ?? createEmptyCouponRow();
                              next[i] = { ...cur, title: e.target.value.slice(0, 120) };
                              return { ...s, coupons: next };
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6b5c42]">
                          {lang === "en" ? "Description" : "Descripción"}
                        </label>
                        <p className="mt-1 text-xs text-[#5D4A25]/80">
                          {lang === "en" ? "Describe the offer, conditions, or restrictions." : "Describe la oferta, condiciones o restricciones."}
                        </p>
                        <textarea
                          className="mt-1 min-h-[64px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                          value={coupon.description}
                          onChange={(e) => {
                            setState((s) => {
                              const next = [...s.coupons];
                              const cur = next[i] ?? createEmptyCouponRow();
                              next[i] = { ...cur, description: e.target.value.slice(0, 800) };
                              return { ...s, coupons: next };
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6b5c42]">
                          {lang === "en" ? "Coupon code (optional)" : "Código de cupón (opcional)"}
                        </label>
                        <p className="mt-1 text-xs text-[#5D4A25]/80">
                          {lang === "en" ? "Code the customer must mention or enter (if applicable)." : "Código que el cliente debe mencionar o ingresar (si aplica)."}
                        </p>
                        <input
                          className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                          value={coupon.couponCode ?? ""}
                          onChange={(e) => {
                            setState((s) => {
                              const next = [...s.coupons];
                              const cur = next[i] ?? createEmptyCouponRow();
                              next[i] = { ...cur, couponCode: e.target.value };
                              return { ...s, coupons: next };
                            });
                          }}
                          placeholder={lang === "en" ? "Ex: LEONIX10" : "Ej: LEONIX10"}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6b5c42]">
                          {lang === "en" ? "Expiration date (optional)" : "Fecha de expiración (opcional)"}
                        </label>
                        <p className="mt-1 text-xs text-[#5D4A25]/80">
                          {lang === "en" ? "Expiration deadline (if applicable)." : "Fecha límite de vigencia (si aplica)."}
                        </p>
                        <input
                          className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                          type="date"
                          value={coupon.expirationDate ?? ""}
                          onChange={(e) => {
                            setState((s) => {
                              const next = [...s.coupons];
                              const cur = next[i] ?? createEmptyCouponRow();
                              next[i] = { ...cur, expirationDate: e.target.value };
                              return { ...s, coupons: next };
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6b5c42]">
                          {lang === "en" ? "Redemption note (optional)" : "Nota de canje (opcional)"}
                        </label>
                        <p className="mt-1 text-xs text-[#5D4A25]/80">
                          {lang === "en" ? "Ex: Mention this coupon when ordering." : "Ej. Menciona este cupón al ordenar."}
                        </p>
                        <textarea
                          className="mt-1 min-h-[64px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                          value={coupon.redemptionNote ?? ""}
                          onChange={(e) => {
                            setState((s) => {
                              const next = [...s.coupons];
                              const cur = next[i] ?? createEmptyCouponRow();
                              next[i] = { ...cur, redemptionNote: e.target.value };
                              return { ...s, coupons: next };
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6b5c42]">
                          {lang === "en" ? "Coupon image (optional)" : "Imagen del cupón (opcional)"}
                        </label>
                        <p className="mt-1 text-xs text-[#5D4A25]/80">
                          {lang === "en" ? "Upload a coupon image or paste a URL." : "Sube una imagen del cupón o pega una URL."}
                        </p>
                        <div className="mt-1 space-y-2">
                          <div
                            className="rounded-xl border border-dashed border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/25 p-3"
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "copy";
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              const f = e.dataTransfer.files?.[0];
                              if (!f?.type.startsWith("image/")) return;
                              void readFileAsDataUrl(f).then((url) => {
                                setState((s) => {
                                  const next = [...s.coupons];
                                  const cur = next[i] ?? createEmptyCouponRow();
                                  next[i] = { ...cur, imageUrl: url };
                                  return { ...s, coupons: next };
                                });
                              });
                            }}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              className="block w-full text-sm text-[color:var(--lx-text-2)] file:mr-4 file:rounded-full file:border-0 file:bg-[color:var(--lx-section)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[color:var(--lx-text)] hover:file:bg-[color:var(--lx-nav-hover)]"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  void readFileAsDataUrl(f).then((url) => {
                                    setState((s) => {
                                      const next = [...s.coupons];
                                      const cur = next[i] ?? createEmptyCouponRow();
                                      next[i] = { ...cur, imageUrl: url };
                                      return { ...s, coupons: next };
                                    });
                                  });
                                }
                              }}
                            />
                            <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                              {lang === "en" ? "Or drag and drop an image" : "O arrastra y suelta una imagen"}
                            </p>
                          </div>
                          <input
                            className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                            value={coupon.imageUrl ?? ""}
                            onChange={(e) => {
                              setState((s) => {
                                const next = [...s.coupons];
                                const cur = next[i] ?? createEmptyCouponRow();
                                next[i] = { ...cur, imageUrl: e.target.value };
                                return { ...s, coupons: next };
                              });
                            }}
                            placeholder={lang === "en" ? "Or paste image URL" : "O pega URL de imagen"}
                          />
                          {coupon.imageUrl && (
                            <div className="mt-2 flex items-center gap-2">
                              <img src={coupon.imageUrl} alt="" className="h-20 w-20 rounded-lg border border-[color:var(--lx-nav-border)] object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setState((s) => {
                                    const next = [...s.coupons];
                                    const cur = next[i] ?? createEmptyCouponRow();
                                    next[i] = { ...cur, imageUrl: "" };
                                    return { ...s, coupons: next };
                                  });
                                }}
                                className="text-xs font-semibold text-red-600 hover:text-red-700"
                              >
                                {lang === "en" ? "Remove" : "Eliminar"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(state.coupons ?? []).length < 4 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        coupons: [...(s.coupons || []), createEmptyCouponRow()],
                      }))
                    }
                    className="rounded-full border border-dashed border-[color:var(--lx-gold-border)] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
                  >
                    {lang === "en" ? "+ Add coupon" : "+ Añadir cupón"}
                  </button>
                ) : null}
              </div>

          <div className="mt-6 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4">
            <label className="block text-xs font-semibold text-[#6b5c42]">
              {lang === "en" ? "Coupon or promotions flyer" : "Flyer de cupones o promociones"}
            </label>
            <p className="mt-1 text-xs text-[#5D4A25]/80">
              {lang === "en" ? "Upload or paste an image with more promotions. It will appear below the main coupons." : "Sube o pega una imagen con más promociones. Se mostrará debajo de los cupones principales."}
            </p>
            <div className="mt-2 space-y-2">
              <div
                className="rounded-xl border border-dashed border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/25 p-3"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (!f?.type.startsWith("image/")) return;
                  void readFileAsDataUrl(f).then((url) =>
                    setState((s) => ({
                      ...s,
                      couponFlyer: { imageUrl: url },
                    })),
                  );
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-[color:var(--lx-text-2)] file:mr-4 file:rounded-full file:border-0 file:bg-[color:var(--lx-section)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[color:var(--lx-text)] hover:file:bg-[color:var(--lx-nav-hover)]"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      void readFileAsDataUrl(f).then((url) =>
                        setState((s) => ({
                          ...s,
                          couponFlyer: { imageUrl: url },
                        })),
                      );
                    }
                  }}
                />
                <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                  {lang === "en" ? "Or drag and drop an image" : "O arrastra y suelta una imagen"}
                </p>
              </div>
              <input
                className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={state.couponFlyer?.imageUrl ?? ""}
                onChange={(e) => setState((s) => ({ ...s, couponFlyer: { imageUrl: e.target.value } }))}
                placeholder={lang === "en" ? "Or paste image URL" : "O pega URL de imagen"}
              />
              {state.couponFlyer?.imageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={state.couponFlyer.imageUrl} alt="" className="h-20 w-20 rounded-lg border border-[color:var(--lx-nav-border)] object-cover" />
                  <button
                    type="button"
                    onClick={() => setState((s) => ({ ...s, couponFlyer: { imageUrl: "" } }))}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    {lang === "en" ? "Remove" : "Eliminar"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4">
            <label className="block text-xs font-semibold text-[#6b5c42]">
              {lang === "en" ? "Link to see more offers" : "Enlace para ver más ofertas"}
            </label>
            <p className="mt-1 text-xs text-[#5D4A25]/80">
              {lang === "en" ? "External URL where customers can see more coupons or promotions." : "URL externa donde los clientes pueden ver más cupones o promociones."}
            </p>
            <input
              className="mt-2 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
              value={state.couponMoreOffers?.url ?? ""}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  couponMoreOffers: { ...(s.couponMoreOffers || { url: "", buttonLabel: "" }), url: e.target.value },
                }))
              }
              placeholder={lang === "en" ? "https://example.com/more-coupons" : "https://ejemplo.com/mas-cupones"}
            />
            <div className="mt-3">
              <label className="block text-xs font-semibold text-[#6b5c42]">
                {lang === "en" ? "Button text" : "Texto del botón"}
              </label>
              <p className="mt-1 text-xs text-[#5D4A25]/80">
                {lang === "en" ? "Custom button text (default: See more coupons)." : "Texto personalizado para el botón (por defecto: Ver más cupones)."}
              </p>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={state.couponMoreOffers?.buttonLabel ?? ""}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    couponMoreOffers: { ...(s.couponMoreOffers || { url: "", buttonLabel: "" }), buttonLabel: e.target.value },
                  }))
                }
                placeholder={lang === "en" ? "e.g. See menu with specials" : "Ej. Ver menú con especiales"}
              />
            </div>
          </div>
              </section>
            ) : isExistingDashboardListingMode ? (
              /* Dashboard existing-listing offers-module activation — capability check only, included
                 in the $399/mo base package; no separate Stripe checkout (see
                 startServiciosDashboardOffersAddonCheckout). */
              <>
                <SectionTitle>{serviciosOffersModuleHeading(lang)}</SectionTitle>
                <div className="mt-6 rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-gradient-to-b from-[color:var(--lx-section)] to-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.18)] ring-2 ring-[color:var(--lx-gold-border)]/25">
                  <h3 className="text-lg font-bold text-[color:var(--lx-text)]">{serviciosOffersModuleHeading(lang)}</h3>
                  <p className="mt-1 text-sm font-semibold text-[color:var(--lx-text)]">
                    {lang === "en" ? "Included with your plan" : "Incluido en tu plan"}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                    {lang === "en"
                      ? "Add up to 4 featured offers/coupons to your listing to attract more customers. Activate the module, then you can save your offers."
                      : "Agrega hasta 4 ofertas/cupones destacados a tu anuncio para atraer más clientes. Activa el módulo y luego podrás guardar tus ofertas."}
                  </p>
                  <button
                    type="button"
                    disabled={dashboardAddonCheckoutBusy}
                    onClick={() => void startDashboardOffersAddonCheckout()}
                    className="mt-4 min-h-[44px] rounded-full bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)] disabled:opacity-50"
                  >
                    {dashboardAddonCheckoutBusy
                      ? serviciosOffersAddonUpgradeBusyLabel(lang)
                      : serviciosOffersAddonUpgradeLabel(lang)}
                  </button>
                  {dashboardContextErr ? (
                    <p className="mt-3 text-sm font-medium text-red-700" role="status">
                      {dashboardContextErr}
                    </p>
                  ) : null}
                  <div className="mt-4">
                    <Link href={dashboardReturnHref} className="text-sm font-semibold text-[color:var(--lx-text)] underline">
                      {lang === "en" ? "Back to dashboard" : "Volver al panel"}
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              /* Coupon decision card - show when add-on is not yet enabled */
              <>
                <SectionTitle>{copy.labels.couponsFeaturedStepTitle}</SectionTitle>
                <div className="mt-6 rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-gradient-to-b from-[color:var(--lx-section)] to-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.18)] ring-2 ring-[color:var(--lx-gold-border)]/25">
                  <div>
                    <h3 className="text-lg font-bold text-[color:var(--lx-text)]">
                      {copy.labels.couponsFeaturedStepTitle}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-[color:var(--lx-text)]">
                      {lang === "en" ? "Included with your plan" : "Incluido en tu plan"}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                      {lang === "en" ? "No extra cost — included inside your listing." : "Sin costo adicional — incluido dentro de tu anuncio."}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                      {copy.labels.couponsFeaturedStepBody}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">
                      {copy.labels.couponsFeaturedStepSimpleHint}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setCouponDetailOpen(true)}
                      className="min-h-[44px] shrink-0 rounded-full border-2 border-[color:var(--lx-gold-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                    >
                      {lang === "en" ? "See more" : "Ver más"}
                    </button>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setState((s) => ({
                            ...s,
                            couponsAddOn: true,
                            couponsMonthlyPrice: 0,
                            coupons: s.coupons && s.coupons.length > 0 ? s.coupons : [createEmptyCouponRow()],
                          }));
                        }}
                        className="min-h-[44px] shrink-0 rounded-full bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)]"
                      >
                        {lang === "en" ? "Add coupons" : "Agregar cupones"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setState((s) => ({
                            ...s,
                            couponsAddOn: false,
                            couponsMonthlyPrice: 0,
                            coupons: [],
                            applicationStepIndex: 7,
                          }));
                        }}
                        className="min-h-[44px] shrink-0 rounded-full border border-[color:var(--lx-nav-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                      >
                        {lang === "en" ? "Continue without coupons" : "Continuar sin cupones"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        ) : null}

        {step === 7 ? (
          <>
            <div className={`${sectionCard} mb-4`}>
              <p className="text-sm leading-relaxed text-[#5D4A25]/90">
                {lang === "en"
                  ? "Read Leonix rules before confirming."
                  : "Lee las reglas de Leonix antes de confirmar."}
              </p>
              <button
                type="button"
                onClick={() => setLeonixRulesOpen(true)}
                className="mt-2 inline-flex min-h-[44px] items-center text-sm font-semibold text-[#1E1810] underline underline-offset-2 hover:text-[#3D2C12]"
              >
                {lang === "en" ? "View Leonix rules" : "Ver reglas de Leonix"}
              </button>
            </div>
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

              {/* Pricing summary — hidden in dashboard edit modes (no $399 base recharge from an existing listing). */}
              {!isExistingDashboardListingMode && state.baseMonthlyPrice > 0 && (
                <div className="mt-5 rounded-xl border border-[#C9782F]/50 bg-[#FFFDF7]/50 px-4 py-3">
                  <p className="text-xs font-semibold text-[#8a7a62]">
                    {lang === "en" ? "Pricing summary" : "Resumen de precios"}
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#5D4A25]">{state.categoryPlan}</span>
                      <span className="font-semibold text-[#3D2C12]">${state.baseMonthlyPrice}/mes</span>
                    </div>
                    {state.couponsAddOn && state.couponsMonthlyPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#5D4A25]">
                          {lang === "en" ? "Coupons add-on" : "Complemento de cupones"}
                        </span>
                        <span className="font-semibold text-[#3D2C12]">
                          +${state.couponsMonthlyPrice}/mes
                        </span>
                      </div>
                    )}
                    {state.couponsAddOn && state.couponsMonthlyPrice <= 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#5D4A25]">
                          {lang === "en" ? "Coupons & offers" : "Cupones y ofertas"}
                        </span>
                        <span className="font-semibold text-[#3D2C12]">
                          {lang === "en" ? "Included" : "Incluido"}
                        </span>
                      </div>
                    )}
                    <div className="mt-2 flex justify-between border-t border-[#D8C79A]/40 pt-2">
                      <span className="font-semibold text-[#3D2C12]">
                        {lang === "en" ? "Total monthly" : "Total mensual"}
                      </span>
                      <span className="font-bold text-[#C9782F]">
                        ${state.baseMonthlyPrice + (state.couponsMonthlyPrice || 0)}/mes
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
                          if (pendingQuickFact) {
                            const r = evaluateAddCustomQuickFact(w, lang, pendingQuickFact);
                            w = r.ok
                              ? enforceServiciosSelectionCaps({
                                  ...w,
                                  customQuickFacts: [...w.customQuickFacts, r.label],
                                  customQuickFactLabel: "",
                                })
                              : enforceServiciosSelectionCaps({ ...w, customQuickFactLabel: "" });
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
                            customQuickFacts: w.customQuickFacts,
                            customQuickFactIncluded: w.customQuickFactIncluded,
                            customQuickFactLabel: w.customQuickFactLabel,
                            selectedBusinessHighlightIds: w.selectedBusinessHighlightIds,
                            customBusinessHighlights: w.customBusinessHighlights,
                            customBusinessHighlightLabel: w.customBusinessHighlightLabel,
                          };
                        })()
                      : {}),
                    ...(s.applicationStepIndex === 4
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
                          for (const groupId of SERVICIOS_AMENITY_CUSTOM_GROUP_IDS) {
                            const pendingGroupAmenity = (w.pendingCustomAmenityOptionByGroup?.[groupId] ?? "").trim();
                            if (!pendingGroupAmenity) continue;
                            const bucket = w.customAmenityOptionsByGroup?.[groupId] ?? [];
                            const r = evaluateAddCustomAmenityOptionForGroup(bucket, pendingGroupAmenity);
                            w = r.ok
                              ? enforceServiciosSelectionCaps({
                                  ...w,
                                  customAmenityOptionsByGroup: {
                                    ...w.customAmenityOptionsByGroup,
                                    [groupId]: [...bucket, r.label],
                                  },
                                  pendingCustomAmenityOptionByGroup: {
                                    ...w.pendingCustomAmenityOptionByGroup,
                                    [groupId]: "",
                                  },
                                })
                              : enforceServiciosSelectionCaps({
                                  ...w,
                                  pendingCustomAmenityOptionByGroup: {
                                    ...w.pendingCustomAmenityOptionByGroup,
                                    [groupId]: "",
                                  },
                                });
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
                            customAmenityOptionsByGroup: w.customAmenityOptionsByGroup,
                            pendingCustomAmenityOptionByGroup: w.pendingCustomAmenityOptionByGroup,
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

      {couponDetailOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setCouponDetailOpen(false)}
        >
          <div
            className="max-h-[min(90vh,640px)] max-w-lg overflow-y-auto rounded-2xl bg-[#FFFCF7] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#1E1810]">
              {lang === "en" ? "Featured coupons and offers" : "Cupones y ofertas destacadas"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5C5346]">
              {lang === "en"
                ? "Featured coupons and offers are included with your plan at no extra cost — show up to 4 offers inside your listing. Use it for clear discounts, packages, specials, or promotions with conditions."
                : "Cupones y ofertas destacadas están incluidos en tu plan sin costo adicional — muestra hasta 4 ofertas dentro de tu anuncio. Úsalo para descuentos claros, paquetes, especiales o promociones con condiciones."}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#5C5346]">
              {lang === "en"
                ? "For simple highlights like “24/7”, “licensed”, “free estimates”, or “emergency service”, use Services and quick details."
                : "Si solo quieres frases simples como “24/7”, “licenciado”, “estimados gratis” o “servicio de emergencia”, usa Servicios y datos rápidos."}
            </p>
            <p className="mt-3 text-sm font-semibold text-[#5C5346]">
              {lang === "en"
                ? "They are added to the final summary if you activate them."
                : "Se agregan al resumen final si los activas."}
            </p>
            <button
              type="button"
              onClick={() => setCouponDetailOpen(false)}
              className="mt-6 min-h-[44px] w-full rounded-full bg-[#1E1810] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3D2C12]"
            >
              {lang === "en" ? "Close" : "Cerrar"}
            </button>
          </div>
        </div>
      ) : null}

      {leonixRulesOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setLeonixRulesOpen(false)}
        >
          <div
            className="max-h-[min(90vh,640px)] max-w-lg overflow-y-auto rounded-2xl bg-[#FFFCF7] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#1E1810]">
              {lang === "en" ? "Leonix publishing rules" : "Reglas de publicación de Leonix"}
            </h2>
            <ul className="mt-4 space-y-2">
              {(lang === "en"
                ? [
                    "Listing information must be truthful, current, and belong to your business.",
                    "Do not publish illegal, misleading, discriminatory, sexually explicit, or dangerous services.",
                    "You must have permission to use the photos, logos, text, and links you upload.",
                    "Leonix may review, pause, reject, or remove listings that violate the rules.",
                    "Payment does not guarantee approval if the listing violates our rules.",
                    "You are responsible for the information, prices, promotions, licenses, and contact details published.",
                  ]
                : [
                    "La información del anuncio debe ser verdadera, actualizada y pertenecer a tu negocio.",
                    "No publiques servicios ilegales, engañosos, discriminatorios, sexuales explícitos o peligrosos.",
                    "Debes tener permiso para usar las fotos, logos, textos y enlaces que subes.",
                    "Leonix puede revisar, pausar, rechazar o eliminar anuncios que violen las reglas.",
                    "El pago no garantiza aprobación si el anuncio viola nuestras reglas.",
                    "Eres responsable por la información, precios, promociones, licencias y datos de contacto publicados.",
                  ]
              ).map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-sm text-[#5C5346]">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setLeonixRulesOpen(false)}
              className="mt-6 min-h-[44px] w-full rounded-full bg-[#1E1810] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3D2C12]"
            >
              {lang === "en" ? "Got it" : "Entendido"}
            </button>
          </div>
        </div>
      ) : null}
      </>
      )}
    </div>
  );
}
