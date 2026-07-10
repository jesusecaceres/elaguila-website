"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import type { RestauranteCoupon, RestauranteDaySchedule, RestauranteFeaturedDish, RestauranteServiceMode } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import {
  RESTAURANTE_CONTACT_PLACEHOLDERS,
  RESTAURANTE_CUISINES,
  RESTAURANTE_EVENT_SIZES,
  RESTAURANTE_HIGHLIGHTS,
  RESTAURANTE_LANGUAGES,
  RESTAURANTE_PRICE_LEVELS,
  TAXONOMY_KEY_OTHER,
  TAXONOMY_KEY_OTHER_LANG,
} from "@/app/clasificados/restaurantes/application/restauranteTaxonomy";
import { RestauranteUploadRow } from "@/app/clasificados/restaurantes/application/RestauranteUploadRow";
import { useRestauranteDraft } from "@/app/clasificados/restaurantes/application/useRestauranteDraft";
import { saveRestauranteDraftToStorageResolved } from "@/app/clasificados/restaurantes/application/restauranteDraftStorage";
import {
  satisfiesRestauranteMinimumDraftForPreview,
  satisfiesRestauranteServiceModes,
} from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";
import {
  readRestauranteImageAsDataUrl,
  readRestauranteImageAsDataUrlWithInstantPreview,
  RESTAURANTE_GRID_IMAGE_COMPRESSION_OPTS,
  RESTAURANTE_HERO_IMAGE_COMPRESSION_OPTS,
} from "@/app/clasificados/restaurantes/application/compressRestauranteImage";
import { RestauranteMediaPreviewImg } from "@/app/clasificados/restaurantes/application/RestauranteMediaPreviewImg";
import { RestaurantePublishMediaBuckets } from "@/app/clasificados/restaurantes/application/RestaurantePublishMediaBuckets";
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { buildRestaurantePublishPayload } from "@/app/clasificados/restaurantes/application/buildRestaurantePublishPayload";
import { resolveRestauranteDraftMediaToRemoteUrls } from "@/app/clasificados/restaurantes/application/restauranteDraftPublishPrepare";
import {
  redirectRestauranteDashboardCouponAddonCheckout,
  restauranteCouponAddonUpgradeLabel,
  restauranteCouponEditHref,
  restauranteOffersModuleHeading,
} from "@/app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { clasificadosPreviewPublishCopy } from "@/app/lib/clasificados/clasificadosUiChromeCopy";
import {
  resolveClasificadosPublishLang,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import {
  labelForBusinessType,
  labelForCuisine,
  labelForHighlight,
  labelForLanguage,
  labelForPriceLevel,
  restauranteDayLabel,
  restauranteEventSizeLabel,
  restauranteFormServiceOptionLabel,
  restaurantePreviewGateCopy,
  type RestauranteAppUiLang,
} from "./restauranteApplicationUiCopy";
import {
  restauranteApplicationFormCopy,
  restauranteSectionHeading,
} from "./restauranteApplicationFormCopy";
import { buildDashboardMisAnunciosReturnPath } from "@/app/lib/listingPlans/revenueOsReturnPath";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { buildRestauranteApplicationSectionNavItems } from "./restauranteApplicationSectionModel";
import { RestauranteApplicationSectionNav } from "./RestauranteApplicationSectionNav";
import { RestauranteAmenitiesFormBlock } from "./RestauranteAmenitiesFormBlock";
import { RestauranteExternalVideoUrlsSection } from "./RestauranteExternalVideoUrlsSection";
import {
  buildRestauranteFormServicePatch,
  isDuplicateCustomLanguage,
  isRestauranteFormServiceSelected,
  RESTAURANTE_FORM_BUSINESS_TYPES,
  RESTAURANTE_FORM_SERVICE_OPTIONS,
  RESTAURANTE_MAX_CUSTOM_LANGUAGES,
  RESTAURANTE_US_STATE_OPTIONS,
  resolveRestauranteCustomLanguages,
} from "@/app/lib/clasificados/restaurantes/restauranteFormCleanupConfig";

const PREVIEW_HREF = "/clasificados/restaurantes/preview";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)] sm:p-6";

/** Visible step panel — one lettered section at a time (draft stays in parent; fields remount from draft). */
const stepPanel = CARD;

/** Stacks I / J / K — visually dominant vs. canonical service modes + channel rows below */
const PRIMARY_OP_CARD =
  "flex h-full flex-col rounded-2xl border-2 border-[color:var(--lx-gold-border)]/70 bg-gradient-to-b from-[color:var(--lx-section)] to-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.18)] ring-2 ring-[color:var(--lx-gold-border)]/25";

/** Secondary fulfillment toggles — lighter visual weight */
const SECONDARY_CHANNEL_CLUSTER =
  "rounded-2xl border border-dashed border-[color:var(--lx-nav-border)]/90 bg-[color:var(--lx-section)]/40 p-4";

const OTHER_INPUT =
  "mt-1.5 w-full max-w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm text-[color:var(--lx-text)]";

/** UI cap for additional cuisine tags (stored arrays may be longer from older sessions; user can only add up to this). */
const MAX_ADDITIONAL_CUISINES = 3;

const DAY_ROW_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

function dayRows(lang: RestauranteAppUiLang) {
  return DAY_ROW_KEYS.map((key) => ({
    key,
    label: restauranteDayLabel(key, lang),
  }));
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{children}</h2>;
}

function FieldLabel({
  children,
  optional,
  required,
  lang = "es",
}: {
  children: React.ReactNode;
  optional?: boolean;
  required?: boolean;
  lang?: RestauranteAppUiLang;
}) {
  const showStar = Boolean(required) && !optional;
  const optionalLabel = clasificadosPreviewPublishCopy(lang).optional;
  return (
    <label className="block text-sm font-semibold text-[color:var(--lx-text-2)]">
      {children}
      {optional ? <span className="ml-1 font-normal text-[color:var(--lx-muted)]">({optionalLabel.toLowerCase()})</span> : null}
      {showStar ? (
        <span className="ml-0.5 text-red-600" aria-hidden>
          *
        </span>
      ) : null}
    </label>
  );
}

function HelperText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)] sm:max-w-2xl${className ? ` ${className}` : ""}`}>
      {children}
    </p>
  );
}

/** Decorative leading marker for publish chips; label text remains the accessible name. */
function TaxonomyChipLeading({ chipEmoji }: { chipEmoji?: string }) {
  if (!chipEmoji) return null;
  return (
    <span className="shrink-0 select-none text-sm leading-none" aria-hidden="true">
      {chipEmoji}
    </span>
  );
}

export default function RestauranteApplicationClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );
  const previewGate = useMemo(() => restaurantePreviewGateCopy(lang), [lang]);
  const fc = useMemo(() => restauranteApplicationFormCopy(lang), [lang]);
  const dashboardSource = searchParams?.get("source") === "dashboard";
  const dashboardMode = searchParams?.get("mode");
  const dashboardListingId = searchParams?.get("listingId")?.trim() ?? "";
  const dashboardLeonixAdId = searchParams?.get("leonixAdId")?.trim() || null;
  const focusCoupon = searchParams?.get("focus") === "coupon-upgrade";
  const returnPanel = searchParams?.get("returnPanel");
  const isDashboardCouponEditMode =
    dashboardSource &&
    (dashboardMode === "coupon-edit" || dashboardMode === "dashboard-edit") &&
    Boolean(dashboardListingId);
  const isDashboardListingEditMode =
    dashboardSource &&
    (dashboardMode === "listing-edit" || dashboardMode === "dashboard-listing-edit") &&
    Boolean(dashboardListingId);
  const isDashboardAddonMode =
    dashboardSource &&
    (dashboardMode === "coupon-addon" || dashboardMode === "dashboard-addon") &&
    Boolean(dashboardListingId);
  const isExistingDashboardListingMode =
    isDashboardListingEditMode || isDashboardCouponEditMode || isDashboardAddonMode;
  const dashboardReturnHref =
    returnPanel === "restaurantes"
      ? appendLangToPath("/dashboard/restaurantes", routeLang)
      : buildDashboardMisAnunciosReturnPath(lang, "restaurantes");
  const { hydrated, draft, draftRef, setDraftPatch, resetDraft } = useRestauranteDraft();
  const [serviceErr, setServiceErr] = useState(false);
  /** Pending text before user confirms custom language with Añadir. */
  const [languageOtherPending, setLanguageOtherPending] = useState("");
  /** Display names for last picked files (draft stores data URLs only). */
  const [uploadLabels, setUploadLabels] = useState<Record<string, string>>({});
  /** Coupon detail drawer state */
  const [couponDetailDrawer, setCouponDetailDrawer] = useState(false);
  /** Publish confirmation checkbox states */
  const [confirmBusinessInfo, setConfirmBusinessInfo] = useState(false);
  const [confirmPhotosRepresent, setConfirmPhotosRepresent] = useState(false);
  const [confirmCommunityRules, setConfirmCommunityRules] = useState(false);
  const [confirmCouponTerms, setConfirmCouponTerms] = useState(false);
  /** Coupon image upload state */
  const [couponImageUploading, setCouponImageUploading] = useState<Record<number, boolean>>({});
  /** Flyer image upload state */
  const [flyerImageUploading, setFlyerImageUploading] = useState(false);
  const [dashboardAddonCheckoutBusy, setDashboardAddonCheckoutBusy] = useState(false);
  const [dashboardSaveBusy, setDashboardSaveBusy] = useState(false);
  const [dashboardContextErr, setDashboardContextErr] = useState<string | null>(null);

  // Initialize pricing based on product query param
  useEffect(() => {
    if (hydrated && !draft.productType && !isExistingDashboardListingMode) {
      const productParam = searchParams?.get("product");
      const isMobile = productParam === "mobile_food_vendor";
      const productType = isMobile ? "mobile_food_vendor" : "established_restaurant";
      const baseMonthlyPrice = isMobile ? 199 : 399;
      setDraftPatch({
        productType,
        baseMonthlyPrice,
      });
    }
  }, [hydrated, draft.productType, setDraftPatch, searchParams, isExistingDashboardListingMode]);

  const dashboardCouponCheckoutReturnPath = useMemo(() => {
    if (!dashboardListingId) return undefined;
    return restauranteCouponEditHref({
      lang,
      listingId: dashboardListingId,
      leonixAdId: dashboardLeonixAdId,
      returnPanel: returnPanel === "restaurantes" ? "restaurantes" : undefined,
    });
  }, [dashboardListingId, dashboardLeonixAdId, lang, returnPanel]);

  const startDashboardAddonCheckout = useCallback(async () => {
    if (!dashboardListingId) {
      setDashboardContextErr(fc.dashboard.missingListingId);
      return;
    }
    setDashboardAddonCheckoutBusy(true);
    setDashboardContextErr(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      const result = await redirectRestauranteDashboardCouponAddonCheckout({
        listingId: dashboardListingId,
        leonixAdId: dashboardLeonixAdId,
        lang,
        customerEmail: auth.user?.email ?? null,
        returnPath: dashboardCouponCheckoutReturnPath,
      });
      if (!result.ok) {
        setDashboardContextErr(result.userMessage);
        setDashboardAddonCheckoutBusy(false);
      }
    } catch {
      setDashboardContextErr(fc.dashboard.couponCheckoutFailed);
      setDashboardAddonCheckoutBusy(false);
    }
  }, [dashboardListingId, dashboardLeonixAdId, lang, dashboardCouponCheckoutReturnPath, fc]);

  const saveExistingDashboardListing = useCallback(async () => {
    if (!isExistingDashboardListingMode || !dashboardListingId) return;
    if (isDashboardCouponEditMode && !draftRef.current.couponUpgradeEnabled) {
      setDashboardContextErr(fc.dashboard.enableOffersBeforeSave);
      return;
    }
    setDashboardSaveBusy(true);
    setDashboardContextErr(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      const ownerUserId = auth.user?.id?.trim();
      if (!ownerUserId) {
        setDashboardContextErr(fc.dashboard.signInToSave);
        setDashboardSaveBusy(false);
        return;
      }

      let draftForSave = mergeRestauranteDraft(draftRef.current);
      try {
        draftForSave = await resolveRestauranteDraftMediaToRemoteUrls(draftForSave);
      } catch {
        setDashboardContextErr(fc.dashboard.imagesPrepareFailed);
        setDashboardSaveBusy(false);
        return;
      }

      await saveRestauranteDraftToStorageResolved(draftForSave);
      const payload = buildRestaurantePublishPayload(draftForSave, ownerUserId, undefined, lang);
      const res = await fetch("/api/clasificados/restaurantes/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (res.ok && j.ok) {
        router.push(dashboardReturnHref);
        return;
      }
      setDashboardContextErr(fc.dashboard.saveChangesFailedRetry);
    } catch {
      setDashboardContextErr(fc.dashboard.saveChangesFailed);
    } finally {
      setDashboardSaveBusy(false);
    }
  }, [
    isExistingDashboardListingMode,
    isDashboardCouponEditMode,
    dashboardListingId,
    draftRef,
    lang,
    router,
    dashboardReturnHref,
    fc,
  ]);

  const minPreviewOk = useMemo(() => satisfiesRestauranteMinimumDraftForPreview(draft), [draft]);

  /** Check if coupon/flyer/more-offers content meaningfully exists */
  const hasCouponContent = useMemo(() => {
    return (
      Boolean(draft.couponUpgradeEnabled) ||
      (draft.coupons ?? []).some((coupon) =>
        Boolean(
          coupon.title?.trim() ||
          coupon.description?.trim() ||
          coupon.couponCode?.trim() ||
          coupon.expirationDate?.trim() ||
          coupon.redemptionNote?.trim() ||
          coupon.imageUrl?.trim()
        )
      ) ||
      Boolean(draft.couponFlyer?.imageUrl?.trim()) ||
      Boolean(draft.couponMoreOffers?.url?.trim()) ||
      Boolean(draft.couponMoreOffers?.buttonLabel?.trim())
    );
  }, [
    draft.couponUpgradeEnabled,
    draft.coupons,
    draft.couponFlyer?.imageUrl,
    draft.couponMoreOffers?.url,
    draft.couponMoreOffers?.buttonLabel,
  ]);

  /** Final preview confirmation gate */
  const finalPreviewConfirmationsOk = useMemo(() => {
    return (
      confirmBusinessInfo &&
      confirmPhotosRepresent &&
      confirmCommunityRules &&
      (!hasCouponContent || confirmCouponTerms)
    );
  }, [confirmBusinessInfo, confirmPhotosRepresent, confirmCommunityRules, hasCouponContent, confirmCouponTerms]);

  /** Can continue to preview */
  const canContinueToPreview = minPreviewOk && finalPreviewConfirmationsOk;

  const serviceOk = useMemo(() => satisfiesRestauranteServiceModes(draft.serviceModes), [draft.serviceModes]);
  const deliveryRelevant = useMemo(
    () =>
      Boolean(draft.delivery) ||
      (draft.serviceModes ?? []).includes("delivery" as RestauranteServiceMode),
    [draft.delivery, draft.serviceModes]
  );

  const setDay = useCallback(
    (key: keyof RestauranteListingDraft, sched: RestauranteDaySchedule) => {
      setDraftPatch({ [key]: sched } as Partial<RestauranteListingDraft>);
    },
    [setDraftPatch]
  );

  const sectionNavItems = useMemo(() => buildRestauranteApplicationSectionNavItems(draft, lang), [draft, lang]);

  const [activeSectionId, setActiveSectionId] = useState("restaurantes-section-a");

  useEffect(() => {
    if (hydrated && focusCoupon) {
      setActiveSectionId("restaurantes-section-g");
    }
  }, [hydrated, focusCoupon]);

  useEffect(() => {
    setActiveSectionId((prev) => {
      const ids = sectionNavItems.map((s) => s.id);
      if (ids.includes(prev)) return prev;
      return ids[0] ?? prev;
    });
  }, [sectionNavItems]);

  const activeStepIndex = useMemo(() => {
    const i = sectionNavItems.findIndex((s) => s.id === activeSectionId);
    return i < 0 ? 0 : i;
  }, [sectionNavItems, activeSectionId]);

  const phonePresent = useMemo(() => Boolean(draft.phoneNumber?.trim()), [draft.phoneNumber]);

  useEffect(() => {
    if (!phonePresent && draft.allowMessageCTA) {
      setDraftPatch({ allowMessageCTA: false });
    }
  }, [phonePresent, draft.allowMessageCTA, setDraftPatch]);

  /** Matches `/publicar/restaurantes?plan=pro` from paquetes — carried into preview → publish POST.
   * Internal mapping: missing plan defaults to base tier for API compatibility, but user-facing URLs omit plan parameter. */
  const publishPlanLane = searchParams?.get("plan") === "pro" ? "pro" : undefined;
  const previewHrefWithPlan = useMemo(() => {
    const extra = publishPlanLane === "pro" ? { plan: "pro" } : undefined;
    return withClasificadosPublishLang(PREVIEW_HREF, routeLang, extra);
  }, [publishPlanLane, routeLang]);

  const goPreview = useCallback(async () => {
    if (isExistingDashboardListingMode) return;
    // Service modes are no longer required for preview - default assumption is brick-and-mortar restaurant
    setServiceErr(false);
    await saveRestauranteDraftToStorageResolved(draftRef.current);
    window.location.href = previewHrefWithPlan;
  }, [draftRef, previewHrefWithPlan, isExistingDashboardListingMode]);

  const toggleHighlight = useCallback(
    (key: string) => {
      const cur = draft.highlights ?? [];
      if (cur.includes(key)) {
        setDraftPatch({ highlights: cur.filter((k) => k !== key) });
        return;
      }
      if (cur.length >= 6) return;
      setDraftPatch({ highlights: [...cur, key] });
    },
    [draft.highlights, setDraftPatch]
  );

  const customLanguages = useMemo(() => resolveRestauranteCustomLanguages(draft), [draft]);

  const toggleLanguage = useCallback(
    (key: string) => {
      const cur = draft.languagesSpoken ?? [];
      const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
      const patch: Partial<RestauranteListingDraft> = { languagesSpoken: next };
      if (key === TAXONOMY_KEY_OTHER_LANG && cur.includes(key) && !next.includes(key)) {
        patch.languageOtherCustom = undefined;
        patch.customLanguages = undefined;
        setLanguageOtherPending("");
      }
      setDraftPatch(patch);
    },
    [draft.languagesSpoken, setDraftPatch]
  );

  const addCustomLanguage = useCallback(() => {
    const trimmed = languageOtherPending.trim();
    if (!trimmed) return;
    const existing = resolveRestauranteCustomLanguages(draft);
    if (existing.length >= RESTAURANTE_MAX_CUSTOM_LANGUAGES) return;
    if (isDuplicateCustomLanguage(trimmed, draft.languagesSpoken, existing, labelForLanguage)) {
      return;
    }
    const nextCustom = [...existing, trimmed];
    const cur = draft.languagesSpoken ?? [];
    const patch: Partial<RestauranteListingDraft> = {
      customLanguages: nextCustom,
      languageOtherCustom: nextCustom[0],
      languagesSpoken: cur.includes(TAXONOMY_KEY_OTHER_LANG) ? cur : [...cur, TAXONOMY_KEY_OTHER_LANG],
    };
    setDraftPatch(patch);
    setLanguageOtherPending("");
  }, [draft, languageOtherPending, setDraftPatch]);

  const removeCustomLanguageAt = useCallback(
    (index: number) => {
      const existing = resolveRestauranteCustomLanguages(draft);
      const nextCustom = existing.filter((_, i) => i !== index);
      const cur = draft.languagesSpoken ?? [];
      const patch: Partial<RestauranteListingDraft> = {
        customLanguages: nextCustom.length ? nextCustom : undefined,
        languageOtherCustom: nextCustom[0],
      };
      if (!nextCustom.length) {
        patch.languagesSpoken = cur.filter((k) => k !== TAXONOMY_KEY_OTHER_LANG);
      }
      setDraftPatch(patch);
      setLanguageOtherPending("");
    },
    [draft, setDraftPatch]
  );

  const toggleAdditionalCuisine = useCallback(
    (key: string) => {
      const cur = draft.additionalCuisines ?? [];
      if (cur.includes(key)) {
        const next = cur.filter((k) => k !== key);
        const patch: Partial<RestauranteListingDraft> = { additionalCuisines: next };
        if (key === TAXONOMY_KEY_OTHER) patch.additionalCuisineOtherCustom = undefined;
        setDraftPatch(patch);
        return;
      }
      if (cur.length >= MAX_ADDITIONAL_CUISINES) return;
      setDraftPatch({ additionalCuisines: [...cur, key] });
    },
    [draft.additionalCuisines, setDraftPatch]
  );

  const toggleFormService = useCallback(
    (opt: (typeof RESTAURANTE_FORM_SERVICE_OPTIONS)[number]) => {
      setDraftPatch(buildRestauranteFormServicePatch(draft, opt));
      setServiceErr(false);
    },
    [draft, setDraftPatch]
  );

  const patchFeatured = useCallback(
    (index: number, patch: Partial<RestauranteFeaturedDish>) => {
      const list = [...(draft.featuredDishes ?? [])];
      while (list.length <= index) list.push({ title: "", shortNote: "", image: "" });
      list[index] = { ...list[index], ...patch };
      setDraftPatch({ featuredDishes: list.slice(0, 4) });
    },
    [draft.featuredDishes, setDraftPatch]
  );

  const removeFeatured = useCallback(
    (index: number) => {
      const list = [...(draft.featuredDishes ?? [])];
      list.splice(index, 1);
      setDraftPatch({ featuredDishes: list });
    },
    [draft.featuredDishes, setDraftPatch]
  );

  const addCoupon = useCallback(() => {
    const list = [...(draft.coupons ?? [])];
    if (list.length >= 4) return;
    list.push({ title: "", description: "" });
    setDraftPatch({ coupons: list });
  }, [draft.coupons, setDraftPatch]);

  const patchCoupon = useCallback(
    (index: number, patch: Partial<RestauranteCoupon>) => {
      const list = [...(draft.coupons ?? [])];
      list[index] = { ...list[index], ...patch };
      setDraftPatch({ coupons: list });
    },
    [draft.coupons, setDraftPatch]
  );

  const removeCoupon = useCallback(
    (index: number) => {
      const list = [...(draft.coupons ?? [])];
      list.splice(index, 1);
      setDraftPatch({ coupons: list });
    },
    [draft.coupons, setDraftPatch]
  );

  const formatPhoneNumber = useCallback((phone: string): string => {
    if (!phone) return "";
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "");
    
    // Handle US phone numbers (10 or 11 digits with leading 1)
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    // Return original if it doesn't match expected format
    return phone;
  }, []);

  const normalizePhoneInput = useCallback((input: string): string => {
    // Allow user to type normally but format on blur
    return input.replace(/\D/g, "").slice(0, 11);
  }, []);

  const [featuredUploading, setFeaturedUploading] = useState<Record<number, boolean>>({});
  const [heroPreviewSrc, setHeroPreviewSrc] = useState<string | null>(null);
  const [logoPreviewSrc, setLogoPreviewSrc] = useState<string | null>(null);

  const uploadFeaturedImage = useCallback(async (index: number, file: File) => {
    setFeaturedUploading((prev) => ({ ...prev, [index]: true }));
    setUploadLabels((p) => ({ ...p, [`featured-${index}`]: file.name }));

    try {
      const imageDataUrl = await readRestauranteImageAsDataUrl(file, RESTAURANTE_GRID_IMAGE_COMPRESSION_OPTS);
      patchFeatured(index, { image: imageDataUrl });
    } catch (error) {
      console.error("Failed to upload featured image:", error);
      setUploadLabels((p) => {
        const n = { ...p };
        delete n[`featured-${index}`];
        return n;
      });
    } finally {
      setFeaturedUploading((prev) => ({ ...prev, [index]: false }));
    }
  }, [patchFeatured]);

  const [mediaUploading, setMediaUploading] = useState<Record<string, boolean>>({});

  const uploadLogoImage = useCallback(async (file: File) => {
    setMediaUploading((prev) => ({ ...prev, logo: true }));
    setUploadLabels((p) => ({ ...p, logo: file.name }));

    try {
      const dataUrl = await readRestauranteImageAsDataUrlWithInstantPreview(
        file,
        setLogoPreviewSrc,
        RESTAURANTE_HERO_IMAGE_COMPRESSION_OPTS,
      );
      if (dataUrl?.trim().startsWith("data:image")) {
        setDraftPatch({ businessLogo: dataUrl });
        setUploadLabels((p) => ({ ...p, logo: file.name }));
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      setUploadLabels((p) => {
        const n = { ...p };
        delete n.logo;
        return n;
      });
    } finally {
      setLogoPreviewSrc(null);
      setMediaUploading((prev) => ({ ...prev, logo: false }));
    }
  }, [setDraftPatch]);

  const uploadHeroImage = useCallback(async (file: File) => {
    setMediaUploading((prev) => ({ ...prev, hero: true }));
    setUploadLabels((p) => ({ ...p, hero: file.name }));

    try {
      const dataUrl = await readRestauranteImageAsDataUrlWithInstantPreview(
        file,
        setHeroPreviewSrc,
        RESTAURANTE_HERO_IMAGE_COMPRESSION_OPTS,
      );
      if (!dataUrl?.trim().startsWith("data:image")) {
        throw new Error("Invalid image format");
      }
      setDraftPatch({ heroImage: dataUrl });
    } catch (error) {
      console.error("Failed to upload hero image:", error);
      setUploadLabels((p) => {
        const n = { ...p };
        delete n.hero;
        return n;
      });
    } finally {
      setHeroPreviewSrc(null);
      setMediaUploading((prev) => ({ ...prev, hero: false }));
    }
  }, [setDraftPatch]);

  const uploadCouponImage = useCallback(async (index: number, file: File) => {
    setCouponImageUploading((prev) => ({ ...prev, [index]: true }));
    setUploadLabels((p) => ({ ...p, [`coupon-${index}`]: file.name }));

    try {
      const dataUrl = await readRestauranteImageAsDataUrl(file, RESTAURANTE_GRID_IMAGE_COMPRESSION_OPTS);
      if (!dataUrl?.trim().startsWith("data:image")) {
        throw new Error("Invalid image format");
      }
      const coupons = [...(draft.coupons ?? [])];
      if (coupons[index]) {
        coupons[index] = { ...coupons[index], imageUrl: dataUrl };
        setDraftPatch({ coupons });
      }
    } catch (error) {
      console.error("Failed to upload coupon image:", error);
      setUploadLabels((p) => {
        const n = { ...p };
        delete n[`coupon-${index}`];
        return n;
      });
    } finally {
      setCouponImageUploading((prev) => {
        const n = { ...prev };
        delete n[index];
        return n;
      });
    }
  }, [draft.coupons, setDraftPatch]);

  const uploadFlyerImage = useCallback(async (file: File) => {
    setFlyerImageUploading(true);
    setUploadLabels((p) => ({ ...p, flyer: file.name }));

    try {
      const dataUrl = await readRestauranteImageAsDataUrl(file, RESTAURANTE_GRID_IMAGE_COMPRESSION_OPTS);
      if (!dataUrl?.trim().startsWith("data:image")) {
        throw new Error("Invalid image format");
      }
      setDraftPatch({ couponFlyer: { imageUrl: dataUrl } });
    } catch (error) {
      console.error("Failed to upload flyer image:", error);
      setUploadLabels((p) => {
        const n = { ...p };
        delete n.flyer;
        return n;
      });
    } finally {
      setFlyerImageUploading(false);
    }
  }, [setDraftPatch]);

  const addFeaturedSlot = useCallback(() => {
    const list = [...(draft.featuredDishes ?? [])];
    if (list.length >= 4) return;
    list.push({ title: "", shortNote: "", image: "" });
    setDraftPatch({ featuredDishes: list });
  }, [draft.featuredDishes, setDraftPatch]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-[color:var(--lx-muted)]">
        {fc.header.loadingDraft}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 sm:py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">{fc.header.brand}</p>
        <h1 className="mt-2 text-2xl font-bold text-[color:var(--lx-text)] sm:text-3xl">{fc.header.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
          {fc.header.intro}
        </p>
        <p className="mt-2 text-xs text-[color:var(--lx-muted)]">
          {fc.header.draftNote}
          <code className="rounded bg-[color:var(--lx-section)] px-1">restaurantes-draft</code>{fc.header.draftNoteSuffix}
        </p>
      </div>

      {dashboardContextErr ? (
        <div
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {dashboardContextErr}
        </div>
      ) : null}

      {isDashboardAddonMode ? (
        <div className="mb-6 rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-gradient-to-b from-[color:var(--lx-section)] to-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.18)]">
          <p className="text-sm font-semibold text-[color:var(--lx-text)]">
            {fc.dashboard.addonModeMessage}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={dashboardAddonCheckoutBusy}
              onClick={() => void startDashboardAddonCheckout()}
              className="min-h-[44px] rounded-full bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)] disabled:opacity-50"
            >
              {dashboardAddonCheckoutBusy ? fc.common.startingCheckout : restauranteCouponAddonUpgradeLabel(lang)}
            </button>
            <Link
              href={dashboardReturnHref}
              className="inline-flex min-h-[44px] items-center rounded-full border border-[color:var(--lx-nav-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)]"
            >
              {fc.common.backToDashboard}
            </Link>
          </div>
        </div>
      ) : null}

      {isDashboardCouponEditMode ? (
        <div className="mb-6 rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] p-5">
          <p className="text-sm font-semibold text-[color:var(--lx-text)]">
            {fc.dashboard.couponEditModeMessage}
          </p>
          <Link
            href={dashboardReturnHref}
            className="mt-3 inline-flex text-sm font-semibold text-[color:var(--lx-text)] underline"
          >
            {fc.common.backToDashboard}
          </Link>
        </div>
      ) : null}

      {isDashboardListingEditMode ? (
        <div className="mb-6 rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] p-5">
          <p className="text-sm font-semibold text-[color:var(--lx-text)]">
            {fc.dashboard.listingEditModeMessage}
          </p>
          <Link
            href={dashboardReturnHref}
            className="mt-3 inline-flex text-sm font-semibold text-[color:var(--lx-text)] underline"
          >
            {fc.common.backToDashboard}
          </Link>
        </div>
      ) : null}

      {dashboardSource && focusCoupon && !dashboardListingId ? (
        <div
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          {fc.dashboard.focusCouponMissingListingId}
        </div>
      ) : null}

      {/* Final coupon upsell reminder */}
      {(!draft.couponUpgradeEnabled && minPreviewOk && !isExistingDashboardListingMode) ? (
        <div className="mt-6 rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-gradient-to-b from-[color:var(--lx-section)] to-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.18)] ring-2 ring-[color:var(--lx-gold-border)]/25">
          <h3 className="text-lg font-bold text-[color:var(--lx-text)]">
            {fc.couponUpsell.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
            {fc.couponUpsell.body}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setActiveSectionId("restaurantes-section-g");
                setDraftPatch({ couponUpgradeEnabled: true });
              }}
              className="min-h-[44px] rounded-full bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)]"
            >
              {fc.couponUpsell.addCoupons}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftPatch({ couponUpgradeEnabled: false });
              }}
              className="min-h-[44px] rounded-full border border-[color:var(--lx-nav-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
            >
              {fc.couponUpsell.continueWithoutCoupons}
            </button>
          </div>
        </div>
      ) : null}

      {serviceErr ? (
        <div
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
          aria-live="polite"
        >
          <p className="font-semibold">{previewGate.previewBlockedTitle}</p>
          <p className="mt-1">{previewGate.previewBlockedBody}</p>
        </div>
      ) : null}
      {!minPreviewOk ? (
        <p className="mt-2 text-sm text-[color:var(--lx-muted)]">{previewGate.previewHint}</p>
      ) : null}

      <div className="lg:hidden sticky top-14 z-30 -mx-4 mb-4 border-b border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-page)]/95 px-4 py-2.5 backdrop-blur-md">
        <RestauranteApplicationSectionNav
          variant="chips"
          sections={sectionNavItems}
          activeId={activeSectionId}
          onSelect={setActiveSectionId}
          lang={lang}
        />
      </div>

      <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <aside className="mb-6 hidden lg:mb-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-card)]/90 p-3 shadow-sm backdrop-blur-sm">
            <RestauranteApplicationSectionNav
              sections={sectionNavItems}
              activeId={activeSectionId}
              onSelect={setActiveSectionId}
              lang={lang}
            />
          </div>
        </aside>

        <div className="min-w-0 flex flex-col gap-6">
        {/* A */}
        {activeSectionId === "restaurantes-section-a" ? (
        <section id="restaurantes-section-a" className={stepPanel}>
          <SectionTitle>{restauranteSectionHeading("A", "a", lang)}</SectionTitle>
          <HelperText>{fc.sectionA.intro}</HelperText>
          <div className="mt-4 grid gap-4">
            <div>
              <FieldLabel required lang={lang}>{fc.sectionA.businessNameLabel}</FieldLabel>
              <HelperText>{fc.sectionA.businessNameHelper}</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.businessName}
                onChange={(e) => setDraftPatch({ businessName: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel required lang={lang}>{fc.sectionA.businessTypeLabel}</FieldLabel>
              <HelperText>{fc.sectionA.businessTypeHelper}</HelperText>
              <select
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.businessType}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftPatch({
                    businessType: v,
                    businessTypeCustom: v === TAXONOMY_KEY_OTHER ? draft.businessTypeCustom : undefined,
                  });
                }}
              >
                <option value="">{fc.common.selectPlaceholder}</option>
                {RESTAURANTE_FORM_BUSINESS_TYPES.map((o) => (
                  <option key={o.key} value={o.key}>
                    {labelForBusinessType(o.key, lang)}
                  </option>
                ))}
              </select>
            </div>
            {draft.businessType === TAXONOMY_KEY_OTHER ? (
              <div>
                <FieldLabel>{fc.sectionA.businessTypeOtherLabel}</FieldLabel>
                <input
                  className={OTHER_INPUT}
                  maxLength={80}
                  placeholder={fc.sectionA.businessTypeOtherPlaceholder}
                  value={draft.businessTypeCustom ?? ""}
                  onChange={(e) => setDraftPatch({ businessTypeCustom: e.target.value || undefined })}
                />
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required lang={lang}>{fc.sectionA.primaryCuisineLabel}</FieldLabel>
                <HelperText>{fc.sectionA.primaryCuisineHelper}</HelperText>
                <select
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.primaryCuisine}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraftPatch({
                      primaryCuisine: v,
                      primaryCuisineCustom: v === TAXONOMY_KEY_OTHER ? draft.primaryCuisineCustom : undefined,
                    });
                  }}
                >
                  <option value="">{fc.common.selectPlaceholder}</option>
                  {RESTAURANTE_CUISINES.map((o) => (
                    <option key={o.key} value={o.key}>
                      {labelForCuisine(o.key, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel optional lang={lang}>{fc.sectionA.secondaryCuisineLabel}</FieldLabel>
                <HelperText>{fc.sectionA.secondaryCuisineHelper}</HelperText>
                <select
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.secondaryCuisine ?? ""}
                  onChange={(e) => {
                    const v = e.target.value || undefined;
                    setDraftPatch({
                      secondaryCuisine: v,
                      secondaryCuisineCustom: v === TAXONOMY_KEY_OTHER ? draft.secondaryCuisineCustom : undefined,
                    });
                  }}
                >
                  <option value="">{fc.common.dashPlaceholder}</option>
                  {RESTAURANTE_CUISINES.map((o) => (
                    <option key={o.key} value={o.key}>
                      {labelForCuisine(o.key, lang)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {draft.primaryCuisine === TAXONOMY_KEY_OTHER ? (
              <div>
                <FieldLabel>{fc.sectionA.primaryCuisineOtherLabel}</FieldLabel>
                <HelperText>{fc.sectionA.primaryCuisineOtherHelper}</HelperText>
                <input
                  className={OTHER_INPUT}
                  maxLength={80}
                  placeholder={fc.sectionA.primaryCuisineOtherPlaceholder}
                  value={draft.primaryCuisineCustom ?? ""}
                  onChange={(e) => setDraftPatch({ primaryCuisineCustom: e.target.value || undefined })}
                />
              </div>
            ) : null}
            {draft.secondaryCuisine === TAXONOMY_KEY_OTHER ? (
              <div>
                <FieldLabel>{fc.sectionA.secondaryCuisineOtherLabel}</FieldLabel>
                <HelperText>{fc.sectionA.secondaryCuisineOtherHelper}</HelperText>
                <input
                  className={OTHER_INPUT}
                  maxLength={80}
                  placeholder={fc.sectionA.secondaryCuisineOtherPlaceholder}
                  value={draft.secondaryCuisineCustom ?? ""}
                  onChange={(e) => setDraftPatch({ secondaryCuisineCustom: e.target.value || undefined })}
                />
              </div>
            ) : null}
            <div>
              <FieldLabel optional lang={lang}>{fc.sectionA.additionalCuisinesLabel}</FieldLabel>
              <HelperText>{fc.sectionA.additionalCuisinesHelper}</HelperText>
              <p className="mt-1 text-xs font-medium text-[color:var(--lx-text-2)]">
                {(draft.additionalCuisines ?? []).length}/{MAX_ADDITIONAL_CUISINES} {fc.sectionA.additionalCuisinesCountSuffix}
                {(draft.additionalCuisines ?? []).length > MAX_ADDITIONAL_CUISINES ? (
                  <span className="ml-1 text-amber-800">{fc.sectionA.additionalCuisinesOverCapWarning}</span>
                ) : null}
              </p>
              <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/60 p-3">
                <div className="flex flex-wrap gap-2">
                  {RESTAURANTE_CUISINES.map((o) => {
                    const cur = draft.additionalCuisines ?? [];
                    const checked = cur.includes(o.key);
                    const atCap = cur.length >= MAX_ADDITIONAL_CUISINES && !checked;
                    return (
                      <label
                        key={o.key}
                        className={`inline-flex items-center gap-1.5 text-sm ${atCap ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="shrink-0"
                          checked={checked}
                          disabled={atCap}
                          onChange={() => toggleAdditionalCuisine(o.key)}
                        />
                        <TaxonomyChipLeading chipEmoji={o.chipEmoji} />
                        <span className="min-w-0">{labelForCuisine(o.key, lang)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {(draft.additionalCuisines ?? []).includes(TAXONOMY_KEY_OTHER) ? (
                <div className="mt-3">
                  <FieldLabel optional lang={lang}>{fc.sectionA.additionalCuisineOtherLabel}</FieldLabel>
                  <HelperText>{fc.sectionA.additionalCuisineOtherHelper}</HelperText>
                  <input
                    className={OTHER_INPUT}
                    maxLength={80}
                    placeholder={fc.sectionA.additionalCuisineOtherPlaceholder}
                    value={draft.additionalCuisineOtherCustom ?? ""}
                    onChange={(e) => setDraftPatch({ additionalCuisineOtherCustom: e.target.value || undefined })}
                  />
                </div>
              ) : null}
            </div>
            <div>
              <FieldLabel optional lang={lang}>
                {fc.sectionA.aboutUsLabel}{" "}
                <span className="font-normal text-[color:var(--lx-muted)]">({fc.common.recommended})</span>
              </FieldLabel>
              <HelperText>{fc.sectionA.aboutUsHelper}</HelperText>
              <textarea
                className="mt-1 min-h-[120px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.longDescription ?? ""}
                onChange={(e) => setDraftPatch({ longDescription: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional lang={lang}>{fc.sectionA.neighborhoodLabel}</FieldLabel>
              <HelperText>{fc.sectionA.neighborhoodHelper}</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.neighborhood ?? ""}
                onChange={(e) => setDraftPatch({ neighborhood: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional lang={lang}>{fc.sectionA.priceLevelLabel}</FieldLabel>
              <HelperText>{fc.sectionA.priceLevelHelper}</HelperText>
              <select
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.priceLevel ?? ""}
                onChange={(e) => setDraftPatch({ priceLevel: (e.target.value as RestauranteListingDraft["priceLevel"]) || undefined })}
              >
                <option value="">{fc.common.dashPlaceholder}</option>
                {RESTAURANTE_PRICE_LEVELS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {labelForPriceLevel(o.key, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel optional lang={lang}>{fc.sectionA.languagesLabel}</FieldLabel>
              <HelperText>{fc.sectionA.languagesHelper}</HelperText>
              <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/40 p-3">
                {RESTAURANTE_LANGUAGES.map((o) => (
                  <label key={o.key} className="inline-flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      className="shrink-0"
                      checked={(draft.languagesSpoken ?? []).includes(o.key)}
                      onChange={() => toggleLanguage(o.key)}
                    />
                    <TaxonomyChipLeading chipEmoji={o.chipEmoji} />
                    <span className="min-w-0">{labelForLanguage(o.key, lang)}</span>
                  </label>
                ))}
              </div>
              {(draft.languagesSpoken ?? []).includes(TAXONOMY_KEY_OTHER_LANG) ? (
                <div className="mt-3 max-w-md space-y-3">
                  {customLanguages.length ? (
                    <div className="flex flex-wrap gap-2">
                      {customLanguages.map((lang, index) => (
                        <span
                          key={`${lang}-${index}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--lx-nav-border)] bg-white px-3 py-1 text-sm font-medium text-[color:var(--lx-text)]"
                        >
                          {lang}
                          <button
                            type="button"
                            className="ml-0.5 rounded-full px-1 text-[color:var(--lx-muted)] hover:text-[color:var(--lx-text)]"
                            aria-label={`${fc.common.removeLanguageAria} ${lang}`}
                            onClick={() => removeCustomLanguageAt(index)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {customLanguages.length < RESTAURANTE_MAX_CUSTOM_LANGUAGES ? (
                    <>
                      <FieldLabel optional lang={lang}>{fc.sectionA.languageOtherLabel}</FieldLabel>
                      <HelperText>{fc.sectionA.languageOtherHelper}</HelperText>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className={`${OTHER_INPUT} mt-0 flex-1 min-w-[10rem]`}
                          maxLength={48}
                          placeholder={fc.sectionA.languageOtherPlaceholder}
                          value={languageOtherPending}
                          onChange={(e) => setLanguageOtherPending(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomLanguage();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="shrink-0 rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
                          onClick={addCustomLanguage}
                        >
                          {fc.common.add}
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>
        ) : null}

        {/* B */}
        {activeSectionId === "restaurantes-section-b" ? (
        <section id="restaurantes-section-b" className={stepPanel}>
          <SectionTitle>{restauranteSectionHeading("B", "b", lang)}</SectionTitle>
          <p className="mt-2 text-xs text-[color:var(--lx-text-2)]">{fc.sectionB.serviceModesIntro}</p>
          <HelperText>{fc.sectionB.helper}</HelperText>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">
            {fc.sectionB.cateringStackLabel}
          </p>
          <div className="mt-4 max-w-xl">
            <div className={PRIMARY_OP_CARD}>
              <div className="text-base font-bold text-[color:var(--lx-text)]">{fc.sectionB.cateringCardTitle}</div>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">{fc.sectionB.cateringCardBody}</p>
              <div className="mt-3 space-y-2.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[color:var(--lx-nav-border)]"
                    checked={Boolean(draft.cateringAvailable)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const patch: Partial<RestauranteListingDraft> = { cateringAvailable: checked };
                      if (checked) patch.cateringEventsStack = { ...draft.cateringEventsStack };
                      setDraftPatch(patch);
                    }}
                  />
                  {fc.sectionB.cateringCheckbox}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[color:var(--lx-nav-border)]"
                    checked={Boolean(draft.eventFoodService)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const patch: Partial<RestauranteListingDraft> = { eventFoodService: checked };
                      if (checked) patch.cateringEventsStack = { ...draft.cateringEventsStack };
                      setDraftPatch(patch);
                    }}
                  />
                  {fc.sectionB.eventFoodCheckbox}
                </label>
              </div>
              {(draft.cateringAvailable || draft.eventFoodService) && (
                <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)]/60 bg-[color:var(--lx-section)]/40 p-4">
                  <p className="text-sm font-semibold text-[color:var(--lx-text)] mb-3">{fc.sectionB.cateringConfigTitle}</p>
                  <div className="space-y-3">
                    <div>
                      <FieldLabel optional lang={lang}>{fc.sectionB.eventSizesLabel}</FieldLabel>
                      <HelperText>{fc.sectionB.eventSizesHelper}</HelperText>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {RESTAURANTE_EVENT_SIZES.map((size) => (
                          <label key={size.key} className="inline-flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={(draft.cateringEventsStack?.eventSizesSupported ?? []).includes(size.key)}
                              onChange={(e) => {
                                const current = draft.cateringEventsStack?.eventSizesSupported ?? [];
                                const next = e.target.checked
                                  ? [...current, size.key]
                                  : current.filter((k) => k !== size.key);
                                setDraftPatch({
                                  cateringEventsStack: { ...draft.cateringEventsStack, eventSizesSupported: next },
                                });
                              }}
                            />
                            {restauranteEventSizeLabel(size.key, size.labelEs, lang)}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <FieldLabel optional lang={lang}>{fc.sectionB.cateringInquiryUrlLabel}</FieldLabel>
                      <HelperText>{fc.sectionB.cateringInquiryUrlHelper}</HelperText>
                      <input
                        className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                        value={draft.cateringEventsStack?.cateringInquiryUrl ?? ""}
                        onChange={(e) =>
                          setDraftPatch({
                            cateringEventsStack: { ...draft.cateringEventsStack, cateringInquiryUrl: e.target.value || undefined },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-[color:var(--lx-nav-border)] pt-6">
            <p className="text-sm font-semibold text-[color:var(--lx-text)]">
              {fc.sectionB.serviceModesTitle} <span className="text-red-600">*</span>
            </p>
            <p className="mt-2 text-sm text-[color:var(--lx-muted)]">{fc.sectionB.serviceModesBody}</p>
          </div>

          <div className="mt-3 rounded-2xl border border-[color:var(--lx-nav-border)]/85 bg-white/50 p-3 sm:p-4">
            <div className="flex flex-wrap gap-2">
              {RESTAURANTE_FORM_SERVICE_OPTIONS.map((o) => (
                <label
                  key={o.kind === "mode" ? o.key : o.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 py-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    className="shrink-0"
                    checked={isRestauranteFormServiceSelected(draft, o)}
                    onChange={() => toggleFormService(o)}
                  />
                  <TaxonomyChipLeading chipEmoji={o.chipEmoji} />
                  <span className="min-w-0">{restauranteFormServiceOptionLabel(o, lang)}</span>
                </label>
              ))}
            </div>
          </div>
          {(draft.serviceModes ?? []).includes(TAXONOMY_KEY_OTHER as RestauranteServiceMode) ? (
            <div className="mt-3 max-w-lg">
              <FieldLabel optional lang={lang}>{fc.sectionB.serviceModeOtherLabel}</FieldLabel>
              <HelperText>{fc.sectionB.serviceModeOtherHelper}</HelperText>
              <input
                className={OTHER_INPUT}
                maxLength={64}
                placeholder={fc.sectionB.serviceModeOtherPlaceholder}
                value={draft.serviceModeOtherCustom ?? ""}
                onChange={(e) => setDraftPatch({ serviceModeOtherCustom: e.target.value || undefined })}
              />
            </div>
          ) : null}
          {deliveryRelevant && (
            <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)]/60 bg-[color:var(--lx-section)]/40 p-4">
              <p className="text-sm font-semibold text-[color:var(--lx-text)] mb-3">{fc.sectionB.deliveryConfigTitle}</p>
              <div>
                <FieldLabel optional lang={lang}>{fc.sectionB.deliveryRadiusLabel}</FieldLabel>
                <HelperText>{fc.sectionB.deliveryRadiusHelper}</HelperText>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.deliveryRadiusMiles ?? ""}
                  onChange={(e) =>
                    setDraftPatch({
                      deliveryRadiusMiles: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}
        </section>
        ) : null}

        {/* C */}
        {activeSectionId === "restaurantes-section-c" ? (
        <section id="restaurantes-section-c" className={stepPanel}>
          <SectionTitle>{restauranteSectionHeading("C", "c", lang)}</SectionTitle>
          <p className="mt-2 text-xs text-[color:var(--lx-text-2)]">
            <span className="font-semibold text-red-600">*</span> {fc.sectionC.requiredNote}
          </p>
          <HelperText>{fc.sectionC.helper}</HelperText>
          <div className="mt-4 space-y-3">
            {dayRows(lang).map(({ key, label }) => {
              const s = draft[key] as RestauranteDaySchedule;
              return (
                <div
                  key={key}
                  className="grid gap-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-3 sm:grid-cols-[120px_1fr_1fr_auto]"
                >
                  <div className="font-semibold text-sm text-[color:var(--lx-text)]">{label}</div>
                  <label className="flex items-center gap-2 text-sm sm:col-span-3 lg:col-span-1">
                    <input
                      type="checkbox"
                      checked={s.closed}
                      onChange={(e) =>
                        setDay(key, { closed: e.target.checked, openTime: s.openTime, closeTime: s.closeTime })
                      }
                    />
                    {fc.common.closed}
                  </label>
                  <input
                    type="time"
                    disabled={s.closed}
                    className="rounded-lg border border-[color:var(--lx-nav-border)] px-2 py-1 text-sm disabled:opacity-50"
                    value={s.openTime ?? ""}
                    onChange={(e) => setDay(key, { ...s, openTime: e.target.value || undefined })}
                  />
                  <input
                    type="time"
                    disabled={s.closed}
                    className="rounded-lg border border-[color:var(--lx-nav-border)] px-2 py-1 text-sm disabled:opacity-50"
                    value={s.closeTime ?? ""}
                    onChange={(e) => setDay(key, { ...s, closeTime: e.target.value || undefined })}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid gap-3">
            <div>
              <FieldLabel optional lang={lang}>{fc.sectionC.specialHoursLabel}</FieldLabel>
              <HelperText>{fc.sectionC.specialHoursHelper}</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.specialHoursNote ?? ""}
                onChange={(e) => setDraftPatch({ specialHoursNote: e.target.value || undefined })}
              />
            </div>
          </div>
        </section>
        ) : null}

        {/* D */}
        {activeSectionId === "restaurantes-section-d" ? (
        <section id="restaurantes-section-d" className={stepPanel}>
          <SectionTitle>{restauranteSectionHeading("D", "d", lang)}</SectionTitle>
          <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
            <span className="text-red-600">*</span> {fc.sectionD.requiredNote}
          </p>
          <HelperText>{fc.sectionD.helper}</HelperText>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-section)]/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">{fc.sectionD.primaryContactHeader}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel optional lang={lang}>{fc.sectionD.websiteLabel}</FieldLabel>
                  <HelperText>{fc.sectionD.websiteHelper}</HelperText>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.websiteUrl}
                    value={draft.websiteUrl ?? ""}
                    onChange={(e) => setDraftPatch({ websiteUrl: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <FieldLabel optional lang={lang}>{fc.sectionD.phoneLabel}</FieldLabel>
                  <HelperText>{fc.sectionD.phoneHelper}</HelperText>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.phoneNumber}
                    value={draft.phoneNumber ?? ""}
                    onChange={(e) => setDraftPatch({ phoneNumber: normalizePhoneInput(e.target.value) || undefined })}
                    onBlur={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      if (formatted) setDraftPatch({ phoneNumber: formatted });
                    }}
                  />
                </div>
                <div>
                  <FieldLabel optional lang={lang}>{fc.sectionD.whatsAppLabel}</FieldLabel>
                  <HelperText>{fc.sectionD.whatsAppHelper}</HelperText>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.whatsAppNumber}
                    value={draft.whatsAppNumber ?? ""}
                    onChange={(e) => setDraftPatch({ whatsAppNumber: normalizePhoneInput(e.target.value) || undefined })}
                    onBlur={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      if (formatted) setDraftPatch({ whatsAppNumber: formatted });
                    }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel optional lang={lang}>{fc.sectionD.emailLabel}</FieldLabel>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.email}
                    value={draft.email ?? ""}
                    onChange={(e) => setDraftPatch({ email: e.target.value || undefined })}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-section)]/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">{fc.sectionD.socialHeader}</p>
              <HelperText className="!mt-0">{fc.sectionD.socialHelper}</HelperText>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["instagramUrl", fc.sectionD.instagramLabel],
                    ["facebookUrl", fc.sectionD.facebookLabel],
                    ["tiktokUrl", fc.sectionD.tiktokLabel],
                    ["youtubeUrl", fc.sectionD.youtubeLabel],
                    ["snapchatUrl", fc.sectionD.snapchatLabel],
                    ["xTwitterUrl", fc.sectionD.xTwitterLabel],
                  ] as const
                ).map(([key, lab]) => (
                  <div key={key}>
                    <FieldLabel optional lang={lang}>{lab}</FieldLabel>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS[key] ?? undefined}
                      value={(draft[key] as string | undefined) ?? ""}
                      onChange={(e) => setDraftPatch({ [key]: e.target.value || undefined } as Partial<RestauranteListingDraft>)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-section)]/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">{fc.sectionD.reviewsHeader}</p>
              <HelperText className="!mt-0">{fc.sectionD.reviewsHelper}</HelperText>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel optional lang={lang}>{fc.sectionD.googleReviewsLabel}</FieldLabel>
                  <HelperText>{fc.sectionD.googleReviewsHelper}</HelperText>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.googleReviewUrl}
                    value={draft.googleReviewUrl ?? ""}
                    onChange={(e) => setDraftPatch({ googleReviewUrl: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <FieldLabel optional lang={lang}>{fc.sectionD.yelpLabel}</FieldLabel>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.yelpReviewUrl}
                    value={draft.yelpReviewUrl ?? ""}
                    onChange={(e) => setDraftPatch({ yelpReviewUrl: e.target.value || undefined })}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-section)]/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">{fc.sectionD.actionsHeader}</p>
              <HelperText className="!mt-0">{fc.sectionD.actionsHelper}</HelperText>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel optional lang={lang}>{fc.sectionD.reservationLabel}</FieldLabel>
                  <HelperText>{fc.sectionD.reservationHelper}</HelperText>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.reservationUrl}
                    value={draft.reservationUrl ?? ""}
                    onChange={(e) => setDraftPatch({ reservationUrl: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <FieldLabel optional lang={lang}>{fc.sectionD.orderLabel}</FieldLabel>
                  <HelperText>{fc.sectionD.orderHelper}</HelperText>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.orderUrl}
                    value={draft.orderUrl ?? ""}
                    onChange={(e) => setDraftPatch({ orderUrl: e.target.value || undefined })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel optional lang={lang}>{fc.sectionD.menuUrlLabel}</FieldLabel>
                  <HelperText>{fc.sectionD.menuUrlHelper}</HelperText>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.menuUrl}
                    value={draft.menuUrl ?? ""}
                    onChange={(e) => setDraftPatch({ menuUrl: e.target.value || undefined })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel optional lang={lang}>{fc.sectionD.menuFileLabel}</FieldLabel>
                  <HelperText>
                    {fc.sectionD.menuFileHelperPrefix}{" "}
                    {draft.menuFile ? fc.sectionD.menuFileReady : fc.sectionD.menuFileEmpty}
                  </HelperText>
                  <RestauranteUploadRow
                    buttonLabel={fc.common.uploadFile}
                    helperText={fc.sectionD.menuFileUploadHelper}
                    accept="image/*,application/pdf"
                    selectedLabel={
                      uploadLabels.menu ?? (draft.menuFile ? fc.common.fileSavedInDraft : null)
                    }
                    onFilesSelected={async (files) => {
                      const f = files?.[0];
                      if (!f) {
                        setDraftPatch({ menuFile: undefined });
                        setUploadLabels((p) => {
                          const n = { ...p };
                          delete n.menu;
                          return n;
                        });
                        return;
                      }
                      setUploadLabels((p) => ({ ...p, menu: f.name }));
                      setDraftPatch({ menuFile: await readFileAsDataUrl(f) });
                    }}
                  />
                  {draft.menuFile ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-medium text-green-700">{fc.common.fileAccepted}</span>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-800 underline"
                        onClick={() => {
                          setDraftPatch({ menuFile: undefined });
                          setUploadLabels((p) => {
                            const n = { ...p };
                            delete n.menu;
                            return n;
                          });
                        }}
                      >
                        {fc.common.removeFile}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
        ) : null}

        {/* E */}
        {activeSectionId === "restaurantes-section-e" ? (
        <section id="restaurantes-section-e" className={stepPanel}>
          <SectionTitle>{restauranteSectionHeading("E", "e", lang)}</SectionTitle>
          <HelperText>{fc.sectionE.intro}</HelperText>
          <div className="mt-4 grid gap-3">
            <div>
              <FieldLabel optional lang={lang}>{fc.sectionE.addressLine1Label}</FieldLabel>
              <HelperText>{fc.sectionE.addressLine1Helper}</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.addressLine1 ?? ""}
                onChange={(e) => setDraftPatch({ addressLine1: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional lang={lang}>{fc.sectionE.addressLine2Label}</FieldLabel>
              <HelperText>{fc.sectionE.addressLine2Helper}</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.addressLine2 ?? ""}
                onChange={(e) => setDraftPatch({ addressLine2: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional lang={lang}>{fc.sectionE.cityLabel}</FieldLabel>
              <HelperText>{fc.sectionE.cityHelper}</HelperText>
              <CityAutocomplete
                lang={lang}
                variant="light"
                freeText
                value={draft.cityCanonical}
                onChange={(v) => setDraftPatch({ cityCanonical: v })}
                placeholder={fc.sectionE.cityPlaceholder}
              />
            </div>
            <div>
              <FieldLabel optional lang={lang}>{fc.sectionE.stateLabel}</FieldLabel>
              <HelperText>{fc.sectionE.stateHelper}</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.state ?? ""}
                onChange={(e) => setDraftPatch({ state: e.target.value || undefined })}
                placeholder={fc.sectionE.statePlaceholder}
              />
            </div>
            <div>
              <FieldLabel optional lang={lang}>{fc.sectionE.zipLabel}</FieldLabel>
              <HelperText>{fc.sectionE.zipHelper}</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                inputMode="numeric"
                value={draft.zipCode ?? ""}
                onChange={(e) => setDraftPatch({ zipCode: e.target.value.replace(/\D/g, "").slice(0, 5) || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional lang={lang}>{fc.sectionE.countryLabel}</FieldLabel>
              <HelperText>{fc.sectionE.countryHelper}</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.country ?? ""}
                onChange={(e) => setDraftPatch({ country: e.target.value || undefined })}
                placeholder={fc.sectionE.countryPlaceholder}
              />
            </div>
          </div>
        </section>
        ) : null}

        {/* F */}
        {activeSectionId === "restaurantes-section-f" ? (
        <section id="restaurantes-section-f" className={stepPanel}>
          <SectionTitle>{fc.sectionF.title}</SectionTitle>
          <HelperText>{fc.sectionF.intro}</HelperText>
          <div className="mt-4 space-y-6">
            {(draft.featuredDishes ?? []).map((dish, i) => (
              <div key={i} className="rounded-xl border border-[color:var(--lx-nav-border)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{fc.common.dishNumber} {i + 1}</span>
                  <button type="button" className="text-sm text-red-700 underline" onClick={() => removeFeatured(i)}>
                    {fc.common.remove}
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FieldLabel>{fc.sectionF.dishTitleLabel}</FieldLabel>
                    <HelperText>{fc.sectionF.dishTitleHelper}</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={dish.title}
                      onChange={(e) => patchFeatured(i, { title: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>{fc.sectionF.dishNoteLabel}</FieldLabel>
                    <HelperText>{fc.sectionF.dishNoteHelper}</HelperText>
                    <textarea
                      className="mt-1 min-h-[64px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={dish.shortNote}
                      onChange={(e) => patchFeatured(i, { shortNote: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional lang={lang}>{fc.sectionF.dishPriceLabel}</FieldLabel>
                    <HelperText>{fc.sectionF.dishPriceHelper}</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={dish.priceLabel ?? ""}
                      onChange={(e) => patchFeatured(i, { priceLabel: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional lang={lang}>{fc.sectionF.dishMenuLinkLabel}</FieldLabel>
                    <HelperText>{fc.sectionF.dishMenuLinkHelper}</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.menuUrl}
                      value={dish.menuLink ?? ""}
                      onChange={(e) => patchFeatured(i, { menuLink: e.target.value || undefined })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>{fc.sectionF.dishImageLabel}</FieldLabel>
                    <HelperText>{fc.sectionF.dishImageHelper}</HelperText>
                    <div className="space-y-2">
                      <RestauranteUploadRow
                        buttonLabel={featuredUploading[i] ? fc.common.uploading : fc.common.uploadImage}
                        helperText={fc.sectionF.dishImageUploadHelper}
                        accept="image/*"
                        disabled={featuredUploading[i]}
                        selectedLabel={
                          featuredUploading[i]
                            ? `📤 ${fc.common.processingImage}`
                            : uploadLabels[`featured-${i}`] ?? (dish.image ? fc.common.savedInDraft : null)
                        }
                        onFilesSelected={async (files) => {
                          const f = files?.[0];
                          if (!f) return;
                          await uploadFeaturedImage(i, f);
                        }}
                      />
                      {featuredUploading[i] && (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          {fc.common.processingImage}
                        </div>
                      )}
                      {dish.image && !featuredUploading[i] ? (
                        <div className="relative mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-lg border border-green-200">
                          <div className="absolute top-1 right-1 z-10 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            {fc.common.ready}
                          </div>
                          <RestauranteMediaPreviewImg
                            src={dish.image}
                            draftListingId={draft.draftListingId}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                            width={320}
                            height={180}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(draft.featuredDishes ?? []).length < 4 ? (
              <button
                type="button"
                onClick={addFeaturedSlot}
                className="rounded-full border border-dashed border-[color:var(--lx-gold-border)] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
              >
                {fc.common.addDish}
              </button>
            ) : null}
          </div>
        </section>
        ) : null}

        {/* G */}
        {activeSectionId === "restaurantes-section-g" ? (
        <section id="restaurantes-section-g" className={stepPanel}>
          {!draft.couponUpgradeEnabled ? (
            isExistingDashboardListingMode ? (
              <>
                <SectionTitle>G · {restauranteOffersModuleHeading(lang)}</SectionTitle>
                <div className="mt-6 rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-gradient-to-b from-[color:var(--lx-section)] to-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.18)] ring-2 ring-[color:var(--lx-gold-border)]/25">
                  <h3 className="text-lg font-bold text-[color:var(--lx-text)]">
                    {restauranteOffersModuleHeading(lang)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                    {fc.sectionG.dashboardAddonBody}
                  </p>
                  <button
                    type="button"
                    disabled={dashboardAddonCheckoutBusy}
                    onClick={() => void startDashboardAddonCheckout()}
                    className="mt-4 min-h-[44px] rounded-full bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)] disabled:opacity-50"
                  >
                    {dashboardAddonCheckoutBusy ? fc.common.startingCheckout : restauranteCouponAddonUpgradeLabel(lang)}
                  </button>
                </div>
              </>
            ) : (
            <>
              <SectionTitle>{restauranteSectionHeading("G", "g", lang)}</SectionTitle>
              <div className="mt-6 rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-gradient-to-b from-[color:var(--lx-section)] to-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.18)] ring-2 ring-[color:var(--lx-gold-border)]/25">
                <div>
                  <h3 className="text-lg font-bold text-[color:var(--lx-text)]">
                    {fc.sectionG.upsellQuestion}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-[color:var(--lx-text)]">+${fc.sectionG.upsellPrice}</p>
                  <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                    {fc.sectionG.upsellPriceNote}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                    {fc.sectionG.upsellBody}
                  </p>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setCouponDetailDrawer(true)}
                    className="min-h-[44px] shrink-0 rounded-full border-2 border-[color:var(--lx-gold-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                  >
                    {fc.common.seeMore}
                  </button>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setDraftPatch({ couponUpgradeEnabled: true, couponMonthlyPrice: 99 });
                      }}
                      className="min-h-[44px] shrink-0 rounded-full bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)]"
                    >
                      {fc.sectionG.addCouponsForPrice}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftPatch({ couponUpgradeEnabled: false, couponMonthlyPrice: undefined });
                      }}
                      className="min-h-[44px] shrink-0 rounded-full border border-[color:var(--lx-nav-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                    >
                      {fc.couponUpsell.continueWithoutCoupons}
                    </button>
                  </div>
                </div>
              </div>
            </>
            )
          ) : (
            <>
              <div className="flex items-center justify-between">
                <SectionTitle>G · {restauranteOffersModuleHeading(lang)}</SectionTitle>
                {!isExistingDashboardListingMode ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[color:var(--lx-text)]">
                    {fc.sectionG.couponsEnabled}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftPatch({ couponUpgradeEnabled: false, couponMonthlyPrice: undefined });
                    }}
                    className="text-sm font-semibold text-red-700 underline"
                  >
                    {fc.common.remove}
                  </button>
                </div>
                ) : null}
              </div>
              <HelperText>{fc.sectionG.enabledHelper}</HelperText>
              <div className="mt-4 grid gap-4">
            {(draft.coupons ?? []).map((coupon, i) => (
              <div key={i} className="rounded-xl border border-[color:var(--lx-nav-border)] bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{fc.common.couponNumber} {i + 1}</span>
                  <button type="button" className="text-sm text-red-700 underline" onClick={() => removeCoupon(i)}>
                    {fc.common.remove}
                  </button>
                </div>
                <div className="mt-3 grid gap-3">
                  <div>
                    <FieldLabel>{fc.sectionG.couponTitleLabel}</FieldLabel>
                    <HelperText>{fc.sectionG.couponTitleHelper}</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={coupon.title}
                      onChange={(e) => patchCoupon(i, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel>{fc.sectionG.couponDescriptionLabel}</FieldLabel>
                    <HelperText>{fc.sectionG.couponDescriptionHelper}</HelperText>
                    <textarea
                      className="mt-1 min-h-[64px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={coupon.description}
                      onChange={(e) => patchCoupon(i, { description: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional lang={lang}>{fc.sectionG.couponCodeLabel}</FieldLabel>
                    <HelperText>{fc.sectionG.couponCodeHelper}</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={coupon.couponCode ?? ""}
                      onChange={(e) => patchCoupon(i, { couponCode: e.target.value || undefined })}
                      placeholder={fc.sectionG.couponCodePlaceholder}
                    />
                  </div>
                  <div>
                    <FieldLabel optional lang={lang}>{fc.sectionG.couponExpirationLabel}</FieldLabel>
                    <HelperText>{fc.sectionG.couponExpirationHelper}</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      type="date"
                      value={coupon.expirationDate ?? ""}
                      onChange={(e) => patchCoupon(i, { expirationDate: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional lang={lang}>{fc.sectionG.couponRedemptionLabel}</FieldLabel>
                    <HelperText>{fc.sectionG.couponRedemptionHelper}</HelperText>
                    <textarea
                      className="mt-1 min-h-[64px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={coupon.redemptionNote ?? ""}
                      onChange={(e) => patchCoupon(i, { redemptionNote: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional lang={lang}>{fc.sectionG.couponImageLabel}</FieldLabel>
                    <HelperText>{fc.sectionG.couponImageHelper}</HelperText>
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
                          await uploadCouponImage(i, f);
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="block w-full text-sm text-[color:var(--lx-text-2)] file:mr-4 file:rounded-full file:border-0 file:bg-[color:var(--lx-section)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[color:var(--lx-text)] hover:file:bg-[color:var(--lx-nav-hover)]"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) await uploadCouponImage(i, f);
                          }}
                        />
                        <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                          {uploadLabels[`coupon-${i}`] ? `✅ ${uploadLabels[`coupon-${i}`]}` : fc.common.dragDropImage}
                        </p>
                      </div>
                      <input
                        className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                        value={coupon.imageUrl ?? ""}
                        onChange={(e) => patchCoupon(i, { imageUrl: e.target.value || undefined })}
                        placeholder={fc.common.pasteImageUrl}
                      />
                      {coupon.imageUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <RestauranteMediaPreviewImg
                            src={coupon.imageUrl}
                            draftListingId={draft.draftListingId}
                            alt=""
                            className="h-20 w-20 rounded-lg border border-[color:var(--lx-nav-border)] object-cover"
                            width={80}
                            height={80}
                          />
                          <button
                            type="button"
                            onClick={() => patchCoupon(i, { imageUrl: undefined })}
                            className="text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            {fc.common.delete}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(draft.coupons ?? []).length < 4 ? (
              <button
                type="button"
                onClick={addCoupon}
                className="rounded-full border border-dashed border-[color:var(--lx-gold-border)] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
              >
                {fc.common.addCoupon}
              </button>
            ) : null}
          </div>

          <div className="mt-6 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4">
            <FieldLabel optional lang={lang}>{fc.sectionG.flyerLabel}</FieldLabel>
            <HelperText>{fc.sectionG.flyerHelper}</HelperText>
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
                  await uploadFlyerImage(f);
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-[color:var(--lx-text-2)] file:mr-4 file:rounded-full file:border-0 file:bg-[color:var(--lx-section)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[color:var(--lx-text)] hover:file:bg-[color:var(--lx-nav-hover)]"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) await uploadFlyerImage(f);
                  }}
                />
                <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                  {uploadLabels.flyer ? `✅ ${uploadLabels.flyer}` : fc.common.dragDropImage}
                </p>
              </div>
              <input
                className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.couponFlyer?.imageUrl ?? ""}
                onChange={(e) => setDraftPatch({ couponFlyer: { imageUrl: e.target.value || undefined } })}
                placeholder={fc.common.pasteImageUrl}
              />
              {draft.couponFlyer?.imageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <RestauranteMediaPreviewImg
                    src={draft.couponFlyer.imageUrl}
                    draftListingId={draft.draftListingId}
                    alt=""
                    className="h-20 w-20 rounded-lg border border-[color:var(--lx-nav-border)] object-cover"
                    width={80}
                    height={80}
                  />
                  <button
                    type="button"
                    onClick={() => setDraftPatch({ couponFlyer: { imageUrl: undefined } })}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    {fc.common.delete}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4">
            <FieldLabel optional lang={lang}>{fc.sectionG.moreOffersUrlLabel}</FieldLabel>
            <HelperText>{fc.sectionG.moreOffersUrlHelper}</HelperText>
            <input
              className="mt-2 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
              value={draft.couponMoreOffers?.url ?? ""}
              onChange={(e) => setDraftPatch({ couponMoreOffers: { ...draft.couponMoreOffers, url: e.target.value || undefined } })}
              placeholder={fc.sectionG.moreOffersUrlPlaceholder}
            />
            <div className="mt-3">
              <FieldLabel optional lang={lang}>{fc.sectionG.moreOffersButtonLabel}</FieldLabel>
              <HelperText>{fc.sectionG.moreOffersButtonHelper}</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.couponMoreOffers?.buttonLabel ?? ""}
                onChange={(e) => setDraftPatch({ couponMoreOffers: { ...draft.couponMoreOffers, buttonLabel: e.target.value || undefined } })}
                placeholder={fc.sectionG.moreOffersButtonPlaceholder}
              />
            </div>
          </div>
          {(isDashboardCouponEditMode || (isDashboardListingEditMode && draft.couponUpgradeEnabled)) ? (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-[color:var(--lx-nav-border)] pt-6">
              <button
                type="button"
                disabled={dashboardSaveBusy}
                onClick={() => void saveExistingDashboardListing()}
                className="min-h-[44px] rounded-full bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)] disabled:opacity-50"
              >
                {dashboardSaveBusy ? fc.common.saving : fc.dashboard.saveOffers}
              </button>
              <Link
                href={dashboardReturnHref}
                className="inline-flex min-h-[44px] items-center rounded-full border border-[color:var(--lx-nav-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)]"
              >
                {fc.common.backToDashboard}
              </Link>
            </div>
          ) : null}
            </>
          )}
        </section>
        ) : null}

        {/* H */}
        {activeSectionId === "restaurantes-section-h" ? (
        <section id="restaurantes-section-h" className={stepPanel}>
          <SectionTitle>{restauranteSectionHeading("H", "h", lang)}</SectionTitle>
          <HelperText>{fc.sectionH.intro}</HelperText>
          <div className="mt-4 grid gap-4">
            <div>
              <FieldLabel required lang={lang}>{fc.sectionH.heroLabel}</FieldLabel>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{fc.sectionH.heroFallbackNote}</p>
              <div
                className="mt-2 rounded-xl border border-dashed border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/25 p-3"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (!f?.type.startsWith("image/")) return;
                  await uploadHeroImage(f);
                }}
              >
                <RestauranteUploadRow
                  buttonLabel={mediaUploading.hero ? fc.common.uploading : fc.common.uploadImage}
                  helperText={fc.sectionH.heroUploadHelper}
                  accept="image/*"
                  disabled={mediaUploading.hero}
                  selectedLabel={
                    mediaUploading.hero
                      ? `📤 ${fc.common.processingImage}`
                      : uploadLabels.hero ??
                        (draft.heroImage?.trim()
                          ? fc.common.savedInDraft
                          : null)
                  }
                  onFilesSelected={async (files) => {
                    const f = files?.[0];
                    if (!f) {
                      setDraftPatch({ heroImage: "" });
                      setUploadLabels((p) => {
                        const n = { ...p };
                        delete n.hero;
                        return n;
                      });
                      return;
                    }
                    await uploadHeroImage(f);
                  }}
                />
                {mediaUploading.hero && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    {fc.common.processingHeroImage}
                  </div>
                )}
              </div>
              {(heroPreviewSrc || draft.heroImage?.trim()) ? (
                <>
                  <div className="relative mt-3 w-full max-w-md overflow-hidden rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] shadow-sm">
                    <div className="relative aspect-[16/9] min-h-[120px] w-full">
                      <RestauranteMediaPreviewImg
                        src={heroPreviewSrc ?? draft.heroImage}
                        draftListingId={draft.draftListingId}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="eager"
                        decoding="async"
                        width={640}
                        height={360}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-[color:var(--lx-nav-border)] bg-white/80 px-3 py-2">
                      <button
                        type="button"
                        className="rounded-lg border border-[color:var(--lx-nav-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
                        onClick={() => document.getElementById("restaurante-hero-file")?.click()}
                      >
                        {fc.common.replace}
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-800 underline"
                        onClick={() => {
                          setDraftPatch({ heroImage: "" });
                          setUploadLabels((p) => {
                            const n = { ...p };
                            delete n.hero;
                            return n;
                          });
                        }}
                      >
                        {fc.common.removeImage}
                      </button>
                    </div>
                  </div>
                  <input
                    id="restaurante-hero-file"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-hidden
                    onChange={(e) => {
                      const list = e.target.files;
                      void (async () => {
                        const file = list?.[0];
                        if (!file) return;
                        try {
                          const dataUrl = await readRestauranteImageAsDataUrlWithInstantPreview(
                            file,
                            setHeroPreviewSrc,
                            RESTAURANTE_HERO_IMAGE_COMPRESSION_OPTS,
                          );
                          if (dataUrl?.trim().startsWith("data:image")) {
                            setDraftPatch({ heroImage: dataUrl });
                            setUploadLabels((p) => ({ ...p, hero: file.name }));
                          }
                        } finally {
                          setHeroPreviewSrc(null);
                          e.target.value = "";
                        }
                      })();
                    }}
                  />
                </>
              ) : null}
            </div>
            
            {/* Business Logo Upload */}
            <div>
              <FieldLabel optional lang={lang}>{fc.sectionH.logoLabel}</FieldLabel>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{fc.sectionH.logoHelper}</p>
              <div
                className="mt-2 rounded-xl border border-dashed border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/25 p-3"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (!f?.type.startsWith("image/")) return;
                  await uploadLogoImage(f);
                }}
              >
                <RestauranteUploadRow
                  buttonLabel={mediaUploading.logo ? fc.common.uploading : fc.common.uploadLogo}
                  helperText={fc.sectionH.logoUploadHelper}
                  accept="image/*"
                  disabled={mediaUploading.logo}
                  selectedLabel={
                    mediaUploading.logo
                      ? `📤 ${fc.common.processingLogo}`
                      : uploadLabels.logo ??
                        (draft.businessLogo?.trim()
                          ? fc.common.logoSavedInDraft
                          : null)
                  }
                  onFilesSelected={async (files) => {
                    const f = files?.[0];
                    if (!f) {
                      setDraftPatch({ businessLogo: "" });
                      setUploadLabels((p) => {
                        const n = { ...p };
                        delete n.logo;
                        return n;
                      });
                      return;
                    }
                    await uploadLogoImage(f);
                  }}
                />
                {mediaUploading.logo && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    {fc.common.processingLogo}
                  </div>
                )}
              </div>
              {(logoPreviewSrc || draft.businessLogo?.trim()) ? (
                <>
                  <div className="relative mt-3 w-32 h-32 overflow-hidden rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] shadow-sm">
                    <div className="relative aspect-[1/1] w-full h-full">
                      <RestauranteMediaPreviewImg
                        src={logoPreviewSrc ?? draft.businessLogo}
                        draftListingId={draft.draftListingId}
                        alt={fc.sectionH.logoAlt}
                        className="absolute inset-0 h-full w-full object-contain"
                        loading="lazy"
                        decoding="async"
                        width={128}
                        height={128}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-[color:var(--lx-nav-border)] bg-white/80 px-3 py-2">
                      <button
                        type="button"
                        className="rounded-lg border border-[color:var(--lx-nav-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
                        onClick={() => document.getElementById("restaurante-logo-file")?.click()}
                      >
                        {fc.common.replace}
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-800 underline"
                        onClick={() => {
                          setDraftPatch({ businessLogo: "" });
                          setUploadLabels((p) => {
                            const n = { ...p };
                            delete n.logo;
                            return n;
                          });
                        }}
                      >
                        {fc.common.removeLogo}
                      </button>
                    </div>
                  </div>
                  <input
                    id="restaurante-logo-file"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-hidden
                    onChange={(e) => {
                      const list = e.target.files;
                      void (async () => {
                        const file = list?.[0];
                        if (!file) return;
                        try {
                          const dataUrl = await readRestauranteImageAsDataUrlWithInstantPreview(
                            file,
                            setLogoPreviewSrc,
                            RESTAURANTE_HERO_IMAGE_COMPRESSION_OPTS,
                          );
                          if (dataUrl?.trim().startsWith("data:image")) {
                            setDraftPatch({ businessLogo: dataUrl });
                            setUploadLabels((p) => ({ ...p, logo: file.name }));
                          }
                        } finally {
                          setLogoPreviewSrc(null);
                          e.target.value = "";
                        }
                      })();
                    }}
                  />
                </>
              ) : null}
            </div>
            
            <RestaurantePublishMediaBuckets
              draft={draft}
              onChange={setDraftPatch}
            />
            <RestauranteExternalVideoUrlsSection draft={draft} setDraftPatch={setDraftPatch} lang={lang} />
          </div>
        </section>
        ) : null}

        {/* I */}
        {activeSectionId === "restaurantes-section-i" ? (
        <section id="restaurantes-section-i" className={stepPanel}>
          <SectionTitle>{restauranteSectionHeading("I", "i", lang)}</SectionTitle>
          <p className="mt-2 text-sm text-[color:var(--lx-muted)]">{fc.sectionI.intro}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {RESTAURANTE_HIGHLIGHTS.map((o) => {
              const cur = draft.highlights ?? [];
              const checked = cur.includes(o.key);
              const atCap = cur.length >= 6 && !checked;
              return (
                <label
                  key={o.key}
                  className={`inline-flex items-center gap-1.5 rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 py-1.5 text-sm ${atCap ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="shrink-0"
                    disabled={atCap}
                    checked={checked}
                    onChange={() => toggleHighlight(o.key)}
                  />
                  <TaxonomyChipLeading chipEmoji={o.chipEmoji} />
                  <span className="min-w-0">{labelForHighlight(o.key, lang)}</span>
                </label>
              );
            })}
          </div>
        </section>
        ) : null}

        {/* J — Amenidades y más */}
        {activeSectionId === "restaurantes-section-j" ? (
          <section id="restaurantes-section-j" className={stepPanel}>
            <SectionTitle>{restauranteSectionHeading("J", "j", lang)}</SectionTitle>
            <HelperText>{fc.sectionJ.intro}</HelperText>
            <RestauranteAmenitiesFormBlock draft={draft} setDraftPatch={setDraftPatch} lang={lang} />
          </section>
        ) : null}

        {/* K */}
        {(draft.cateringAvailable || draft.eventFoodService) && activeSectionId === "restaurantes-section-k" ? (
          <section id="restaurantes-section-k" className={stepPanel}>
            <SectionTitle>{restauranteSectionHeading("K", "k", lang)}</SectionTitle>
            <HelperText>{fc.sectionK.intro}</HelperText>
            <div className="mt-4 grid gap-3">
              <div>
                <FieldLabel optional lang={lang}>{fc.sectionK.eventSizesLabel}</FieldLabel>
                <HelperText>{fc.sectionK.eventSizesHelper}</HelperText>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RESTAURANTE_EVENT_SIZES.map((o) => (
                    <label key={o.key} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(draft.cateringEventsStack?.eventSizesSupported ?? []).includes(o.key)}
                        onChange={() => {
                          const cur = draft.cateringEventsStack?.eventSizesSupported ?? [];
                          const next = cur.includes(o.key) ? cur.filter((x) => x !== o.key) : [...cur, o.key];
                          setDraftPatch({
                            cateringEventsStack: { ...draft.cateringEventsStack, eventSizesSupported: next },
                          });
                        }}
                      />
                      {restauranteEventSizeLabel(o.key, o.labelEs, lang)}
                    </label>
                  ))}
                </div>
              </div>
              {(
                [
                  ["bookingLeadTimeText", fc.sectionK.bookingLeadTimeLabel],
                  ["cateringInquiryUrl", fc.sectionK.inquiryUrlLabel],
                  ["cateringNote", fc.sectionK.cateringNoteLabel],
                ] as const
              ).map(([k, lab]) => (
                <div key={k}>
                  <FieldLabel optional lang={lang}>{lab}</FieldLabel>
                  {k === "bookingLeadTimeText" ? (
                    <HelperText>{fc.sectionK.bookingLeadTimeHelper}</HelperText>
                  ) : k === "cateringInquiryUrl" ? (
                    <HelperText>{fc.sectionK.inquiryUrlHelper}</HelperText>
                  ) : (
                    <HelperText>{fc.sectionK.cateringNoteHelper}</HelperText>
                  )}
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    value={(draft.cateringEventsStack?.[k] as string | undefined) ?? ""}
                    onChange={(e) =>
                      setDraftPatch({
                        cateringEventsStack: { ...draft.cateringEventsStack, [k]: e.target.value || undefined },
                      })
                    }
                  />
                </div>
              ))}
              <div>
                <FieldLabel optional lang={lang}>{fc.sectionK.serviceRadiusLabel}</FieldLabel>
                <HelperText>{fc.sectionK.serviceRadiusHelper}</HelperText>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                  value={draft.cateringEventsStack?.serviceRadiusMiles ?? ""}
                  onChange={(e) =>
                    setDraftPatch({
                      cateringEventsStack: {
                        ...draft.cateringEventsStack,
                        serviceRadiusMiles: e.target.value === "" ? undefined : Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* Final — Confirmación antes de la vista previa */}
        {activeSectionId === "restaurantes-section-final" ? (
        <section id="restaurantes-section-final" className={stepPanel}>
          <SectionTitle>{fc.sectionFinal.title}</SectionTitle>
          <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">
            {isExistingDashboardListingMode ? fc.sectionFinal.introDashboard : fc.sectionFinal.introNew}
          </p>
          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--lx-nav-border)]"
                checked={confirmBusinessInfo}
                onChange={(e) => setConfirmBusinessInfo(e.target.checked)}
              />
              <span className="text-sm text-[color:var(--lx-text)]">
                {fc.sectionFinal.confirmBusinessInfo}
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--lx-nav-border)]"
                checked={confirmPhotosRepresent}
                onChange={(e) => setConfirmPhotosRepresent(e.target.checked)}
              />
              <span className="text-sm text-[color:var(--lx-text)]">
                {fc.sectionFinal.confirmPhotosRepresent}
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--lx-nav-border)]"
                checked={confirmCommunityRules}
                onChange={(e) => setConfirmCommunityRules(e.target.checked)}
              />
              <span className="text-sm text-[color:var(--lx-text)]">
                {fc.sectionFinal.confirmCommunityRules}
              </span>
            </label>
            {hasCouponContent ? (
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--lx-nav-border)]"
                  checked={confirmCouponTerms}
                  onChange={(e) => setConfirmCouponTerms(e.target.checked)}
                />
                <span className="text-sm text-[color:var(--lx-text)]">
                  {fc.sectionFinal.confirmCouponTerms}
                </span>
              </label>
            ) : null}
          </div>
          {!canContinueToPreview ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">
                {fc.sectionFinal.previewGateTitle}
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                {!minPreviewOk && (
                  <li>• {fc.sectionFinal.previewGateMinFields}</li>
                )}
                {!confirmBusinessInfo && (
                  <li>• {fc.sectionFinal.previewGateConfirmInfo}</li>
                )}
                {!confirmPhotosRepresent && (
                  <li>• {fc.sectionFinal.previewGateConfirmPhotos}</li>
                )}
                {!confirmCommunityRules && (
                  <li>• {fc.sectionFinal.previewGateConfirmRules}</li>
                )}
                {hasCouponContent && !confirmCouponTerms && (
                  <li>• {fc.sectionFinal.previewGateConfirmPromos}</li>
                )}
              </ul>
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {isExistingDashboardListingMode ? (
              <>
                <button
                  type="button"
                  disabled={dashboardSaveBusy}
                  onClick={() => void saveExistingDashboardListing()}
                  className="min-h-[44px] rounded-full bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)] disabled:opacity-50"
                >
                  {dashboardSaveBusy ? fc.common.saving : fc.dashboard.saveRestaurantChanges}
                </button>
                <Link
                  href={dashboardReturnHref}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)]"
                >
                  {fc.common.backToDashboard}
                </Link>
              </>
            ) : (
            <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={goPreview}
                disabled={!canContinueToPreview}
                className="min-h-[44px] rounded-full bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fc.sectionFinal.preview}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(previewGate.deleteConfirm)) {
                    void resetDraft();
                  }
                }}
                className="min-h-[44px] rounded-full border border-[color:var(--lx-nav-border)] bg-white px-6 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                {fc.sectionFinal.deleteRequest}
              </button>
            </div>
            <button
              type="button"
              onClick={goPreview}
              disabled={!canContinueToPreview}
              className="min-h-[44px] w-full rounded-full bg-[color:var(--lx-text)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[200px]"
            >
              {fc.sectionFinal.continueToPreview}
            </button>
            </>
            )}
          </div>
        </section>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--lx-nav-border)] pt-6">
          <button
            type="button"
            className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={activeStepIndex <= 0}
            onClick={() => {
              const prev = sectionNavItems[activeStepIndex - 1];
              if (prev) setActiveSectionId(prev.id);
            }}
          >
            {fc.common.back}
          </button>
          <button
            type="button"
            className="rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={activeStepIndex >= sectionNavItems.length - 1}
            onClick={() => {
              const next = sectionNavItems[activeStepIndex + 1];
              if (next) setActiveSectionId(next.id);
            }}
          >
            {fc.common.next}
          </button>
        </div>
        </div>
      </div>

      {/* Coupon Detail Drawer */}
      {couponDetailDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setCouponDetailDrawer(false)}>
          <div className="max-w-lg rounded-2xl bg-[#FFFCF7] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-[#1E1810]">
              {fc.sectionG.drawerTitle}
            </h2>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{fc.sectionG.drawerItem1}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{fc.sectionG.drawerItem2}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{fc.sectionG.drawerItem3}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{fc.sectionG.drawerItem4}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{fc.sectionG.drawerItem5}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{fc.sectionG.drawerItem6}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{fc.sectionG.drawerItem7}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{fc.sectionG.drawerItem8}</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setCouponDetailDrawer(false)}
              className="mt-6 min-h-[44px] w-full rounded-full bg-[#1E1810] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3D2C12]"
            >
              {fc.common.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
