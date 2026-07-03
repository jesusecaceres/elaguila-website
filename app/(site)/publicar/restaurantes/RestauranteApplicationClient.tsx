"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import type { RestauranteCoupon, RestauranteDaySchedule, RestauranteFeaturedDish, RestauranteServiceMode } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import {
  labelForLanguage,
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

const DAY_ROWS: { key: keyof Pick<RestauranteListingDraft, "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday">; label: string }[] = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{children}</h2>;
}

function FieldLabel({
  children,
  optional,
  required,
}: {
  children: React.ReactNode;
  optional?: boolean;
  /** Structural requirement for premium preview / open-card (shows *). */
  required?: boolean;
}) {
  const showStar = Boolean(required) && !optional;
  return (
    <label className="block text-sm font-semibold text-[color:var(--lx-text-2)]">
      {children}
      {optional ? <span className="ml-1 font-normal text-[color:var(--lx-muted)]">(opcional)</span> : null}
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
  const lang = searchParams?.get("lang") === "en" ? "en" : "es";
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

  // Initialize pricing based on product query param
  useEffect(() => {
    if (hydrated && !draft.productType) {
      const productParam = searchParams?.get("product");
      const isMobile = productParam === "mobile_food_vendor";
      const productType = isMobile ? "mobile_food_vendor" : "established_restaurant";
      const baseMonthlyPrice = isMobile ? 199 : 399;
      setDraftPatch({
        productType,
        baseMonthlyPrice,
      });
    }
  }, [hydrated, draft.productType, setDraftPatch, searchParams]);

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

  const sectionNavItems = useMemo(() => buildRestauranteApplicationSectionNavItems(draft), [draft]);

  const [activeSectionId, setActiveSectionId] = useState("restaurantes-section-a");

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
    if (publishPlanLane === "pro") return `${PREVIEW_HREF}?plan=pro`;
    return PREVIEW_HREF; // No plan parameter for base tier
  }, [publishPlanLane]);

  const goPreview = useCallback(async () => {
    // Service modes are no longer required for preview - default assumption is brick-and-mortar restaurant
    setServiceErr(false);
    await saveRestauranteDraftToStorageResolved(draftRef.current);
    window.location.href = previewHrefWithPlan;
  }, [draftRef, previewHrefWithPlan]);

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
        {lang === "en" ? "Loading draft…" : "Cargando borrador…"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 sm:py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">{lang === "en" ? "Leonix Classifieds" : "Leonix Clasificados"}</p>
        <h1 className="mt-2 text-2xl font-bold text-[color:var(--lx-text)] sm:text-3xl">{lang === "en" ? "Publish restaurant" : "Publicar restaurante"}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
          {lang === "en"
            ? "Completed fields will appear in the preview. Empty fields will not be shown to the buyer."
            : "Los campos completados aparecerán en la vista previa. Los campos vacíos no se mostrarán al comprador."}
        </p>
        <p className="mt-2 text-xs text-[color:var(--lx-muted)]">
          {lang === "en"
            ? "Draft in this browser session: persists when navigating to preview, returning, and refreshing in the same tab; discarded when closing the tab or browser. Key "
            : "Borrador en esta sesión del navegador: se mantiene al ir a vista previa, volver y actualizar la página en la misma pestaña; al cerrar la pestaña o el navegador se descarta. Clave "}
          <code className="rounded bg-[color:var(--lx-section)] px-1">restaurantes-draft</code>{lang === "en" ? " (session storage)." : " (almacenamiento de sesión)."}
        </p>
      </div>

      {/* Final coupon upsell reminder */}
      {(!draft.couponUpgradeEnabled && minPreviewOk) ? (
        <div className="mt-6 rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-gradient-to-b from-[color:var(--lx-section)] to-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.18)] ring-2 ring-[color:var(--lx-gold-border)]/25">
          <h3 className="text-lg font-bold text-[color:var(--lx-text)]">
            {lang === "en" ? "Want to attract more customers with coupons?" : "¿Quieres atraer más clientes con cupones?"}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
            {lang === "en"
              ? "$99/month to show featured offers inside your restaurant ad. You can publish up to 4 main coupons and add a flyer or external link for more promotions."
              : "$99/mes para mostrar ofertas destacadas dentro de tu anuncio. Puedes publicar hasta 4 cupones principales y agregar un flyer o enlace externo para más promociones."}
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
              {lang === "en" ? "Add coupons" : "Agregar cupones"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftPatch({ couponUpgradeEnabled: false });
              }}
              className="min-h-[44px] rounded-full border border-[color:var(--lx-nav-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
            >
              {lang === "en" ? "Continue without coupons" : "Continuar sin cupones"}
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
          <p className="font-semibold">No se puede usar &quot;Vista previa&quot; todavía</p>
          <p className="mt-1">
            Completa los campos mínimos requeridos para una vista previa publicable: nombre, tipo, cocina, ciudad, foto principal, al menos un contacto y señal de horario.
          </p>
        </div>
      ) : null}
      {!minPreviewOk ? (
        <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
          Para una vista previa publicable completa: nombre, tipo, cocina, ciudad, foto principal, al menos un contacto y
          señal de horario.
        </p>
      ) : null}

      <div className="lg:hidden sticky top-14 z-30 -mx-4 mb-4 border-b border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-page)]/95 px-4 py-2.5 backdrop-blur-md">
        <RestauranteApplicationSectionNav
          variant="chips"
          sections={sectionNavItems}
          activeId={activeSectionId}
          onSelect={setActiveSectionId}
        />
      </div>

      <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <aside className="mb-6 hidden lg:mb-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-card)]/90 p-3 shadow-sm backdrop-blur-sm">
            <RestauranteApplicationSectionNav
              sections={sectionNavItems}
              activeId={activeSectionId}
              onSelect={setActiveSectionId}
            />
          </div>
        </aside>

        <div className="min-w-0 flex flex-col gap-6">
        {/* A */}
        {activeSectionId === "restaurantes-section-a" ? (
        <section id="restaurantes-section-a" className={stepPanel}>
          <SectionTitle>A · Identidad del negocio</SectionTitle>
          <HelperText>
            Esta sección define cómo te reconocen en resultados y en la ficha: nombre, cocinas y ciudad canónica son la base
            del anuncio.
          </HelperText>
          <div className="mt-4 grid gap-4">
            <div>
              <FieldLabel required>Nombre del negocio</FieldLabel>
              <HelperText>Título principal del listado y de la tarjeta abierta.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.businessName}
                onChange={(e) => setDraftPatch({ businessName: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel required>Tipo de negocio</FieldLabel>
              <HelperText>Clasificación del negocio; ayuda a filtros y contexto en la ficha.</HelperText>
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
                <option value="">Seleccionar…</option>
                {RESTAURANTE_FORM_BUSINESS_TYPES.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.labelEs}
                  </option>
                ))}
              </select>
            </div>
            {draft.businessType === TAXONOMY_KEY_OTHER ? (
              <div>
                <FieldLabel>Especifica el tipo (Otro)</FieldLabel>
                <input
                  className={OTHER_INPUT}
                  maxLength={80}
                  placeholder="Ej. cocina oculta especializada"
                  value={draft.businessTypeCustom ?? ""}
                  onChange={(e) => setDraftPatch({ businessTypeCustom: e.target.value || undefined })}
                />
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required>Cocina principal</FieldLabel>
                <HelperText>
                  Identidad culinaria principal: en la ficha aparece en la <strong className="text-[color:var(--lx-text-2)]">línea de cocina bajo el título</strong> del héroe y alimenta datos estructurados para filtros. Una sola elección.
                </HelperText>
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
                  <option value="">Seleccionar…</option>
                  {RESTAURANTE_CUISINES.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.labelEs}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel optional>Cocina secundaria</FieldLabel>
                <HelperText>
                  Segunda identidad culinaria opcional: se une a la principal en la <strong className="text-[color:var(--lx-text-2)]">misma línea bajo el título</strong>. No sustituye la principal. Una sola elección.
                </HelperText>
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
                  <option value="">—</option>
                  {RESTAURANTE_CUISINES.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.labelEs}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {draft.primaryCuisine === TAXONOMY_KEY_OTHER ? (
              <div>
                <FieldLabel>Especifica la cocina principal (Otra)</FieldLabel>
                <HelperText>Texto corto que verá el comprador donde corresponda «Otra» en cocina principal.</HelperText>
                <input
                  className={OTHER_INPUT}
                  maxLength={80}
                  placeholder="Ej. Sichuan, Oaxaca, fusión indo-mexicana…"
                  value={draft.primaryCuisineCustom ?? ""}
                  onChange={(e) => setDraftPatch({ primaryCuisineCustom: e.target.value || undefined })}
                />
              </div>
            ) : null}
            {draft.secondaryCuisine === TAXONOMY_KEY_OTHER ? (
              <div>
                <FieldLabel>Especifica la cocina secundaria (Otra)</FieldLabel>
                <HelperText>Complementa la etiqueta cuando la secundaria es «Otra».</HelperText>
                <input
                  className={OTHER_INPUT}
                  maxLength={80}
                  placeholder="Breve descripción"
                  value={draft.secondaryCuisineCustom ?? ""}
                  onChange={(e) => setDraftPatch({ secondaryCuisineCustom: e.target.value || undefined })}
                />
              </div>
            ) : null}
            <div>
              <FieldLabel optional>Cocinas adicionales</FieldLabel>
              <HelperText>
                Etiquetas de apoyo para descubrimiento: en la ficha salen como <strong className="text-[color:var(--lx-text-2)]">chips «Descub.»</strong> bajo la línea principal/secundaria, no en esa línea. Por eso existen las tres: identidad clara + etiquetas selectivas. Elige hasta{" "}
                <strong className="font-semibold text-[color:var(--lx-text-2)]">{MAX_ADDITIONAL_CUISINES}</strong>. La ciudad
                canónica y la cocina principal siguen anclando filtros y resultados.
              </HelperText>
              <p className="mt-1 text-xs font-medium text-[color:var(--lx-text-2)]">
                {(draft.additionalCuisines ?? []).length}/{MAX_ADDITIONAL_CUISINES} seleccionadas
                {(draft.additionalCuisines ?? []).length > MAX_ADDITIONAL_CUISINES ? (
                  <span className="ml-1 text-amber-800">
                    — Tienes más etiquetas de las recomendadas; desmarca hasta {MAX_ADDITIONAL_CUISINES} para un listado más
                    limpio.
                  </span>
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
                        <span className="min-w-0">{o.labelEs}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {(draft.additionalCuisines ?? []).includes(TAXONOMY_KEY_OTHER) ? (
                <div className="mt-3">
                  <FieldLabel optional>Especifica “Otra” en cocinas adicionales</FieldLabel>
                  <HelperText>Una línea clara; se muestra donde aplique la etiqueta «Otra».</HelperText>
                  <input
                    className={OTHER_INPUT}
                    maxLength={80}
                    placeholder="Una línea, p. ej. comida nikkei"
                    value={draft.additionalCuisineOtherCustom ?? ""}
                    onChange={(e) => setDraftPatch({ additionalCuisineOtherCustom: e.target.value || undefined })}
                  />
                </div>
              ) : null}
            </div>
            <div>
              <FieldLabel optional>
                Sobre nosotros <span className="font-normal text-[color:var(--lx-muted)]">(recomendado)</span>
              </FieldLabel>
              <HelperText>
                Cuéntales a los clientes la historia, ambiente, especialidades o experiencia del restaurante. Aparece más abajo
                en la ficha, no en la cabecera.
              </HelperText>
              <textarea
                className="mt-1 min-h-[120px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.longDescription ?? ""}
                onChange={(e) => setDraftPatch({ longDescription: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Zona del restaurante</FieldLabel>
              <HelperText>
                Texto libre de zona o distrito: aparece en la tarjeta <strong className="text-[color:var(--lx-text-2)]">«Zona»</strong> de la franja de información rápida, junto a la ciudad canónica. No sustituye la ciudad estructurada ni los filtros NorCal.
              </HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.neighborhood ?? ""}
                onChange={(e) => setDraftPatch({ neighborhood: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Nivel de precio</FieldLabel>
              <HelperText>Referencia rápida en la ficha cuando la completes.</HelperText>
              <select
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.priceLevel ?? ""}
                onChange={(e) => setDraftPatch({ priceLevel: (e.target.value as RestauranteListingDraft["priceLevel"]) || undefined })}
              >
                <option value="">—</option>
                {RESTAURANTE_PRICE_LEVELS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.labelEs}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel optional>Idiomas</FieldLabel>
              <HelperText>
                Idiomas en los que el equipo puede atender al cliente en persona, por teléfono o mensaje — no es una lista
                decorativa. Aparecen en la franja de información rápida como una línea compacta. Si seleccionas <strong className="text-[color:var(--lx-text-2)]">Otro</strong>, especifica el idioma concreto.
              </HelperText>
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
                    <span className="min-w-0">{o.labelEs}</span>
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
                            aria-label={`Quitar ${lang}`}
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
                      <FieldLabel optional>Especifica el idioma (Otro)</FieldLabel>
                      <HelperText>
                        Escribe el idioma concreto y pulsa Añadir. Máximo {RESTAURANTE_MAX_CUSTOM_LANGUAGES} idiomas
                        personalizados.
                      </HelperText>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className={`${OTHER_INPUT} mt-0 flex-1 min-w-[10rem]`}
                          maxLength={48}
                          placeholder="Ej. portugués, ASL…"
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
                          Añadir
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
          <SectionTitle>B · Modelo de operación</SectionTitle>
          <p className="mt-2 text-xs text-[color:var(--lx-text-2)]">
            Los <strong>modos de servicio</strong> son opcionales. Por defecto se asume restaurante físico/local. Usa esta
            sección si el negocio también ofrece catering/eventos, delivery, takeout, reservas, etc. La selección mejora el
            listado pero no se requiere para vista previa.
          </p>
          <HelperText>
            Marca <strong className="text-[color:var(--lx-text)]">Catering y eventos</strong> si necesitas la sección extra{" "}
            <strong>K</strong>. Usa <strong className="text-[color:var(--lx-text)]">Modos y servicios disponibles</strong>{" "}
            para la identidad de servicio en datos y vista previa.
          </HelperText>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">
            Catering y eventos (stack K)
          </p>
          <div className="mt-4 max-w-xl">
            <div className={PRIMARY_OP_CARD}>
              <div className="text-base font-bold text-[color:var(--lx-text)]">Catering y eventos</div>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">
                Activa la configuración de <strong className="text-[color:var(--lx-text-2)]">catering y eventos</strong>.
              </p>
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
                  Catering
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
                  Comida para eventos
                </label>
              </div>
              {(draft.cateringAvailable || draft.eventFoodService) && (
                <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)]/60 bg-[color:var(--lx-section)]/40 p-4">
                  <p className="text-sm font-semibold text-[color:var(--lx-text)] mb-3">Configuración de catering y eventos</p>
                  <div className="space-y-3">
                    <div>
                      <FieldLabel optional>Tamaños de evento</FieldLabel>
                      <HelperText>Capacidad de eventos que puedes atender.</HelperText>
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
                            {size.labelEs}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <FieldLabel optional>URL de consulta de catering</FieldLabel>
                      <HelperText>Enlace para que los clientes soliciten información de catering.</HelperText>
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
              Modos y servicios disponibles <span className="text-red-600">*</span>
            </p>
            <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
              Una sola lista para comer en local, para llevar, entrega, recogida, reservas, catering, eventos y más. Al
              menos una opción para la vista previa con validación.
            </p>
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
                  <span className="min-w-0">{o.labelEs}</span>
                </label>
              ))}
            </div>
          </div>
          {(draft.serviceModes ?? []).includes(TAXONOMY_KEY_OTHER as RestauranteServiceMode) ? (
            <div className="mt-3 max-w-lg">
              <FieldLabel optional>Especifica el modo de servicio (Otro)</FieldLabel>
              <HelperText>
                Texto corto que verá el cliente en la <strong className="text-[color:var(--lx-text-2)]">franja Servicio</strong>{" "}
                (información rápida) y como etiqueta «Modo: …» cuando aplique; forma parte de la identidad canónica igual que
                los demás modos marcados.
              </HelperText>
              <input
                className={OTHER_INPUT}
                maxLength={64}
                placeholder="Ej. venta en ferias, solo suscripciones…"
                value={draft.serviceModeOtherCustom ?? ""}
                onChange={(e) => setDraftPatch({ serviceModeOtherCustom: e.target.value || undefined })}
              />
            </div>
          ) : null}
          {deliveryRelevant && (
            <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)]/60 bg-[color:var(--lx-section)]/40 p-4">
              <p className="text-sm font-semibold text-[color:var(--lx-text)] mb-3">Configuración de entrega</p>
              <div>
                <FieldLabel optional>Radio de entrega (millas)</FieldLabel>
                <HelperText>
                  Alcance aproximado cuando ofreces <strong className="text-[color:var(--lx-text-2)]">entrega</strong>. Déjalo vacío si no entregas o si prefieres no especificar radio.
                </HelperText>
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
          <SectionTitle>C · Horarios</SectionTitle>
          <p className="mt-2 text-xs text-[color:var(--lx-text-2)]">
            <span className="font-semibold text-red-600">*</span> Completa cada día (cerrado u horario) o indica la situación
            con las notas de abajo — necesario para la vista previa estructural.
          </p>
          <HelperText>
            La cuadrícula semanal es la base en la ficha. Las notas <strong>no sustituyen</strong> horarios salvo que así lo
            indiques; sirven para excepciones, feriados o cambios puntuales visibles junto al bloque de horas.
          </HelperText>
          <div className="mt-4 space-y-3">
            {DAY_ROWS.map(({ key, label }) => {
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
                    Cerrado
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
              <FieldLabel optional>Nota de horario especial</FieldLabel>
              <HelperText>
                Aviso <strong className="text-[color:var(--lx-text-2)]">recurrente o general</strong> (p. ej. «cerrado lunes
                festivos», «cocina cierra a las 9 pm»): no reemplaza la cuadrícula semanal. Se muestra en el resumen de horario cuando aplica y en el bloque
                «Horarios completos» bajo la lista de días.
              </HelperText>
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
          <SectionTitle>D · Contacto y CTAs</SectionTitle>
          <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
            <span className="text-red-600">*</span> Al menos una vía de contacto (sitio, teléfono, correo, redes, menú/archivo,
            etc.) para la vista previa mínima.
          </p>
          <HelperText>
            Los enlaces web se convierten en botones en la ficha. <strong className="text-[color:var(--lx-text-2)]">Menú URL</strong>{" "}
            abre la carta en el sitio del restaurante (vista previa: confirmación y luego pestaña nueva).{" "}
            <strong className="text-[color:var(--lx-text-2)]">Menú archivo</strong> se abre en un visor dentro de la vista previa
            (PDF/imagen). Si hay ambos, verás dos botones: menú en línea y carta en archivo; el bloque de contacto también puede
            repetir el archivo para descarga/visualización.
          </HelperText>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-[color:var(--lx-nav-border)]/70 bg-[color:var(--lx-section)]/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Contacto principal</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel optional>Sitio web</FieldLabel>
                  <HelperText>Destino principal de tu marca; botón «Sitio web» en la fila de acciones.</HelperText>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.websiteUrl}
                    value={draft.websiteUrl ?? ""}
                    onChange={(e) => setDraftPatch({ websiteUrl: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <FieldLabel optional>Teléfono</FieldLabel>
                  <HelperText>Visible y usable para «Llamar»; se formateará automáticamente como (408) 555-1234.</HelperText>
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
                  <FieldLabel optional>WhatsApp (número)</FieldLabel>
                  <HelperText>Genera el botón de WhatsApp con el número en formato internacional.</HelperText>
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
                  <FieldLabel optional>Correo</FieldLabel>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Redes sociales</p>
              <HelperText className="!mt-0">Enlaces a perfiles; iconos de plataforma en la ficha solo cuando completes la URL.</HelperText>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["instagramUrl", "Instagram (URL)"],
                    ["facebookUrl", "Facebook (URL)"],
                    ["tiktokUrl", "TikTok (URL)"],
                    ["youtubeUrl", "YouTube (URL)"],
                    ["snapchatUrl", "Snapchat (URL)"],
                    ["xTwitterUrl", "X / Twitter (URL)"],
                  ] as const
                ).map(([key, lab]) => (
                  <div key={key}>
                    <FieldLabel optional>{lab}</FieldLabel>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Opiniones / reputación</p>
              <HelperText className="!mt-0">
                Enlaces opcionales a reseñas públicas; solo aparecen en la ficha cuando los completes.
              </HelperText>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel optional>Google reseñas o perfil</FieldLabel>
                  <HelperText>
                    Enlace a tu perfil de Google o reseñas públicas. Aparece como acceso de opiniones cuando lo completas.
                  </HelperText>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.googleReviewUrl}
                    value={draft.googleReviewUrl ?? ""}
                    onChange={(e) => setDraftPatch({ googleReviewUrl: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <FieldLabel optional>Yelp</FieldLabel>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Acciones de restaurante</p>
              <HelperText className="!mt-0">
                Enlaces de reservas, pedidos y menú. El archivo de menú se abre en visor dentro de la vista previa.
              </HelperText>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel optional>Reservas (URL)</FieldLabel>
                  <HelperText>Enlace directo a reservar. Botón «Reservar» si existe.</HelperText>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.reservationUrl}
                    value={draft.reservationUrl ?? ""}
                    onChange={(e) => setDraftPatch({ reservationUrl: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <FieldLabel optional>Pedidos (URL)</FieldLabel>
                  <HelperText>Donde el cliente ordena en línea. Botón «Ordenar» si existe.</HelperText>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.orderUrl}
                    value={draft.orderUrl ?? ""}
                    onChange={(e) => setDraftPatch({ orderUrl: e.target.value || undefined })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel optional>Menú (URL)</FieldLabel>
                  <HelperText>Página pública donde está la carta en línea.</HelperText>
                  <input
                    className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                    placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.menuUrl}
                    value={draft.menuUrl ?? ""}
                    onChange={(e) => setDraftPatch({ menuUrl: e.target.value || undefined })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel optional>Menú (archivo — vista previa local)</FieldLabel>
                  <HelperText>
                    PDF o imagen de la carta guardada en el borrador de sesión.{" "}
                    <strong className="text-[color:var(--lx-text-2)]">Estado actual:</strong>{" "}
                    {draft.menuFile ? "✅ Archivo aceptado y listo para vista previa" : "⭕ Sin archivo"}
                  </HelperText>
                  <RestauranteUploadRow
                    buttonLabel="Subir archivo"
                    helperText="PDF o imagen. Se guarda en el borrador de sesión."
                    accept="image/*,application/pdf"
                    selectedLabel={
                      uploadLabels.menu ?? (draft.menuFile ? "✅ Archivo guardado en el borrador" : null)
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
                      <span className="text-xs font-medium text-green-700">✅ Archivo aceptado</span>
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
                        Quitar archivo
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
          <SectionTitle>E · Ubicación del establecimiento</SectionTitle>
          <HelperText>
            Esta dirección se usa para mostrar a los clientes dónde está tu restaurante y para generar el botón de mapa /
            direcciones en la ficha.
          </HelperText>
          <div className="mt-4 grid gap-3">
            <div>
              <FieldLabel optional>Dirección / número y calle</FieldLabel>
              <HelperText>Calle y número del local.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.addressLine1 ?? ""}
                onChange={(e) => setDraftPatch({ addressLine1: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Dirección línea 2</FieldLabel>
              <HelperText>Suite, piso, edificio o indicaciones; opcional.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.addressLine2 ?? ""}
                onChange={(e) => setDraftPatch({ addressLine2: e.target.value || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>Ciudad</FieldLabel>
              <HelperText>
                Sugerencias de ciudades de California cuando coinciden; puedes escribir cualquier ciudad.
              </HelperText>
              <CityAutocomplete
                lang="es"
                variant="light"
                freeText
                value={draft.cityCanonical}
                onChange={(v) => setDraftPatch({ cityCanonical: v })}
                placeholder="Ej. San José, Portland, Austin…"
              />
            </div>
            <div>
              <FieldLabel optional>Estado / Región</FieldLabel>
              <HelperText>Estado, provincia o región donde opera el restaurante.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.state ?? ""}
                onChange={(e) => setDraftPatch({ state: e.target.value || undefined })}
                placeholder="Ej. California, Jalisco, Madrid…"
              />
            </div>
            <div>
              <FieldLabel optional>Código postal</FieldLabel>
              <HelperText>Código postal de 5 dígitos; se incluye en la dirección y en la búsqueda del mapa.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                inputMode="numeric"
                value={draft.zipCode ?? ""}
                onChange={(e) => setDraftPatch({ zipCode: e.target.value.replace(/\D/g, "").slice(0, 5) || undefined })}
              />
            </div>
            <div>
              <FieldLabel optional>País</FieldLabel>
              <HelperText>País donde opera el restaurante. Se usa para búsqueda y claridad para los clientes.</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.country ?? ""}
                onChange={(e) => setDraftPatch({ country: e.target.value || undefined })}
                placeholder="Ej. Estados Unidos, México, España…"
              />
            </div>
          </div>
        </section>
        ) : null}

        {/* F */}
        {activeSectionId === "restaurantes-section-f" ? (
        <section id="restaurantes-section-f" className={stepPanel}>
          <SectionTitle>F · Platos destacados (máx. 4)</SectionTitle>
          <HelperText>
            Módulo propio en la ficha abierta (no es la galería G): vende el menú con foto + título + nota. En vista previa
            los dos primeros destacan; el resto se despliega con «Ver más platillos». El precio se muestra en formato USD
            limpio; el enlace es opcional por plato.
          </HelperText>
          <div className="mt-4 space-y-6">
            {(draft.featuredDishes ?? []).map((dish, i) => (
              <div key={i} className="rounded-xl border border-[color:var(--lx-nav-border)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">Plato {i + 1}</span>
                  <button type="button" className="text-sm text-red-700 underline" onClick={() => removeFeatured(i)}>
                    Quitar
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FieldLabel>Título</FieldLabel>
                    <HelperText>Nombre del plato en el bloque «Platillos destacados».</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={dish.title}
                      onChange={(e) => patchFeatured(i, { title: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Nota corta</FieldLabel>
                    <HelperText>Subtítulo bajo el título (ingredientes, estilo).</HelperText>
                    <textarea
                      className="mt-1 min-h-[64px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={dish.shortNote}
                      onChange={(e) => patchFeatured(i, { shortNote: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional>Precio / etiqueta</FieldLabel>
                    <HelperText>Número o texto; si es importe, la ficha lo formatea como USD (ej. 12 → $12.00).</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={dish.priceLabel ?? ""}
                      onChange={(e) => patchFeatured(i, { priceLabel: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional>Enlace al menú</FieldLabel>
                    <HelperText>Opcional: ancla a una sección del menú online si aplica.</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      placeholder={RESTAURANTE_CONTACT_PLACEHOLDERS.menuUrl}
                      value={dish.menuLink ?? ""}
                      onChange={(e) => patchFeatured(i, { menuLink: e.target.value || undefined })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Imagen</FieldLabel>
                    <HelperText>Foto del plato; sin foto el bloque igual muestra el título con marcador visual.</HelperText>
                    <div className="space-y-2">
                      <RestauranteUploadRow
                        buttonLabel={featuredUploading[i] ? "Subiendo..." : "Subir imagen"}
                        helperText="Foto del plato."
                        accept="image/*"
                        disabled={featuredUploading[i]}
                        selectedLabel={
                          featuredUploading[i] 
                            ? "📤 Procesando imagen..." 
                            : uploadLabels[`featured-${i}`] ?? (dish.image ? "✅ Imagen guardada en el borrador" : null)
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
                          Procesando imagen...
                        </div>
                      )}
                      {dish.image && !featuredUploading[i] ? (
                        <div className="relative mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-lg border border-green-200">
                          <div className="absolute top-1 right-1 z-10 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            ✅ Lista
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
                + Añadir plato
              </button>
            ) : null}
          </div>
        </section>
        ) : null}

        {/* G */}
        {activeSectionId === "restaurantes-section-g" ? (
        <section id="restaurantes-section-g" className={stepPanel}>
          {!draft.couponUpgradeEnabled ? (
            <>
              <SectionTitle>G · Cupones y ofertas</SectionTitle>
              <div className="mt-6 rounded-2xl border-2 border-[color:var(--lx-gold-border)] bg-gradient-to-b from-[color:var(--lx-section)] to-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.18)] ring-2 ring-[color:var(--lx-gold-border)]/25">
                <div>
                  <h3 className="text-lg font-bold text-[color:var(--lx-text)]">
                    {lang === "en" ? "Do you want to add featured coupons to your profile?" : "¿Quieres agregar cupones destacados a tu perfil?"}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-[color:var(--lx-text)]">+${lang === "en" ? "99/month" : "99/mes"}</p>
                  <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                    {lang === "en" ? "Special price for restaurants. Previously $199/month as a standalone product." : "Precio especial para restaurantes. Antes era $199/mes como producto independiente."}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                    {lang === "en"
                      ? "Add up to 4 featured coupons within your profile. You can promote combos, seasonal discounts, lunch specials, catering, or events. Customers will be able to share the coupon by link, message, email, or compatible apps."
                      : "Agrega hasta 4 cupones destacados dentro de tu perfil. Puedes promocionar combos, descuentos de temporada, especiales de almuerzo, catering o eventos. Los clientes podrán compartir el cupón por enlace, mensaje, email o apps compatibles."}
                  </p>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setCouponDetailDrawer(true)}
                    className="min-h-[44px] shrink-0 rounded-full border-2 border-[color:var(--lx-gold-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                  >
                    {lang === "en" ? "See more" : "Ver más"}
                  </button>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setDraftPatch({ couponUpgradeEnabled: true, couponMonthlyPrice: 99 });
                      }}
                      className="min-h-[44px] shrink-0 rounded-full bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)]"
                    >
                      {lang === "en" ? "Add coupons for $99/month" : "Agregar cupones por $99/mes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftPatch({ couponUpgradeEnabled: false, couponMonthlyPrice: undefined });
                      }}
                      className="min-h-[44px] shrink-0 rounded-full border border-[color:var(--lx-nav-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
                    >
                      {lang === "en" ? "Continue without coupons" : "Continuar sin cupones"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <SectionTitle>I · Cupones destacados</SectionTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[color:var(--lx-text)]">
                    {lang === "en" ? "Coupons enabled — +$99/month" : "Cupones activados — +$99/mes"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftPatch({ couponUpgradeEnabled: false, couponMonthlyPrice: undefined });
                    }}
                    className="text-sm font-semibold text-red-700 underline"
                  >
                    {lang === "en" ? "Remove" : "Quitar"}
                  </button>
                </div>
              </div>
              <HelperText>
                Agrega hasta <strong className="text-[color:var(--lx-text-2)]">4</strong> ofertas para que los clientes tengan una razón clara para visitar, ordenar o compartir tu restaurante.
              </HelperText>
              <div className="mt-4 grid gap-4">
            {(draft.coupons ?? []).map((coupon, i) => (
              <div key={i} className="rounded-xl border border-[color:var(--lx-nav-border)] bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">Cupón {i + 1}</span>
                  <button type="button" className="text-sm text-red-700 underline" onClick={() => removeCoupon(i)}>
                    Quitar
                  </button>
                </div>
                <div className="mt-3 grid gap-3">
                  <div>
                    <FieldLabel>Título del cupón</FieldLabel>
                    <HelperText>Ej. "2x1 en tacos", "10% de descuento", "Combo familiar"</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={coupon.title}
                      onChange={(e) => patchCoupon(i, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel>Descripción</FieldLabel>
                    <HelperText>Describe la oferta, condiciones o restricciones.</HelperText>
                    <textarea
                      className="mt-1 min-h-[64px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={coupon.description}
                      onChange={(e) => patchCoupon(i, { description: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional>Código de cupón</FieldLabel>
                    <HelperText>Código que el cliente debe mencionar o ingresar (si aplica).</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={coupon.couponCode ?? ""}
                      onChange={(e) => patchCoupon(i, { couponCode: e.target.value || undefined })}
                      placeholder="Ej. LEONIX10"
                    />
                  </div>
                  <div>
                    <FieldLabel optional>Fecha de expiración</FieldLabel>
                    <HelperText>Fecha límite de vigencia (si aplica).</HelperText>
                    <input
                      className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      type="date"
                      value={coupon.expirationDate ?? ""}
                      onChange={(e) => patchCoupon(i, { expirationDate: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional>Nota de canje</FieldLabel>
                    <HelperText>Ej. Menciona este cupón al ordenar.</HelperText>
                    <textarea
                      className="mt-1 min-h-[64px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                      value={coupon.redemptionNote ?? ""}
                      onChange={(e) => patchCoupon(i, { redemptionNote: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <FieldLabel optional>Imagen del cupón</FieldLabel>
                    <HelperText>Sube una imagen del cupón o pega una URL.</HelperText>
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
                          {uploadLabels[`coupon-${i}`] ? `✅ ${uploadLabels[`coupon-${i}`]}` : lang === "en" ? "Or drag and drop an image" : "O arrastra y suelta una imagen"}
                        </p>
                      </div>
                      <input
                        className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                        value={coupon.imageUrl ?? ""}
                        onChange={(e) => patchCoupon(i, { imageUrl: e.target.value || undefined })}
                        placeholder={lang === "en" ? "Or paste image URL" : "O pega URL de imagen"}
                      />
                      {coupon.imageUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={coupon.imageUrl} alt="" className="h-20 w-20 rounded-lg border border-[color:var(--lx-nav-border)] object-cover" />
                          <button
                            type="button"
                            onClick={() => patchCoupon(i, { imageUrl: undefined })}
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
            {(draft.coupons ?? []).length < 4 ? (
              <button
                type="button"
                onClick={addCoupon}
                className="rounded-full border border-dashed border-[color:var(--lx-gold-border)] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
              >
                + Añadir cupón
              </button>
            ) : null}
          </div>

          <div className="mt-6 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4">
            <FieldLabel optional>Flyer de cupones o promociones</FieldLabel>
            <HelperText>Sube o pega una imagen con más promociones. Se mostrará debajo de los cupones principales.</HelperText>
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
                  {uploadLabels.flyer ? `✅ ${uploadLabels.flyer}` : lang === "en" ? "Or drag and drop an image" : "O arrastra y suelta una imagen"}
                </p>
              </div>
              <input
                className="w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.couponFlyer?.imageUrl ?? ""}
                onChange={(e) => setDraftPatch({ couponFlyer: { imageUrl: e.target.value || undefined } })}
                placeholder={lang === "en" ? "Or paste image URL" : "O pega URL de imagen"}
              />
              {draft.couponFlyer?.imageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={draft.couponFlyer.imageUrl} alt="" className="h-20 w-20 rounded-lg border border-[color:var(--lx-nav-border)] object-cover" />
                  <button
                    type="button"
                    onClick={() => setDraftPatch({ couponFlyer: { imageUrl: undefined } })}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    {lang === "en" ? "Remove" : "Eliminar"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4">
            <FieldLabel optional>Enlace para ver más ofertas</FieldLabel>
            <HelperText>URL externa donde los clientes pueden ver más cupones o promociones.</HelperText>
            <input
              className="mt-2 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
              value={draft.couponMoreOffers?.url ?? ""}
              onChange={(e) => setDraftPatch({ couponMoreOffers: { ...draft.couponMoreOffers, url: e.target.value || undefined } })}
              placeholder="https://ejemplo.com/mas-cupones"
            />
            <div className="mt-3">
              <FieldLabel optional>Texto del botón</FieldLabel>
              <HelperText>Texto personalizado para el botón (por defecto: "Ver más cupones").</HelperText>
              <input
                className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm"
                value={draft.couponMoreOffers?.buttonLabel ?? ""}
                onChange={(e) => setDraftPatch({ couponMoreOffers: { ...draft.couponMoreOffers, buttonLabel: e.target.value || undefined } })}
                placeholder="Ej. Ver menú con especiales"
              />
            </div>
          </div>
            </>
          )}
        </section>
        ) : null}

        {/* H */}
        {activeSectionId === "restaurantes-section-h" ? (
        <section id="restaurantes-section-h" className={stepPanel}>
          <SectionTitle>H · Galería y medios</SectionTitle>
          <HelperText>
            <strong className="text-[color:var(--lx-text-2)]">Hero</strong> = ancla visual superior de la ficha.{" "}
            <strong className="text-[color:var(--lx-text-2)]">Interiores / Comida / Exterior</strong> = grupos
            etiquetados en el detalle (no sustituyen a los platillos F). Usa <strong className="text-[color:var(--lx-text-2)]">Video opcional</strong>{" "}
            para hasta 4 enlaces externos (YouTube, TikTok, etc.).
          </HelperText>
          <div className="mt-4 grid gap-4">
            <div>
              <FieldLabel required>Foto principal (hero)</FieldLabel>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                Si no subes hero, la <strong>primera imagen</strong> del orden en G (galería) actúa como portada en vista previa,
                resultados y publicación.
              </p>
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
                  buttonLabel={mediaUploading.hero ? "Subiendo..." : "Subir imagen"}
                  helperText="Clic o arrastra una imagen aquí. Miniatura en cuanto se guarde en el borrador de sesión."
                  accept="image/*"
                  disabled={mediaUploading.hero}
                  selectedLabel={
                    mediaUploading.hero 
                      ? "📤 Procesando imagen..."
                      : uploadLabels.hero ??
                        (draft.heroImage?.trim()
                          ? "✅ Imagen guardada en el borrador"
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
                    Procesando imagen hero...
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
                        Reemplazar
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
                        Quitar imagen
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
              <FieldLabel optional>Logo del negocio</FieldLabel>
              <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                Logo opcional que aparecerá como una pequeña insignia redonda sobre la imagen hero. 
                Formato cuadrado recomendado. Se mostrará en la esquina superior izquierda de la imagen hero.
              </p>
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
                  buttonLabel={mediaUploading.logo ? "Subiendo..." : "Subir logo"}
                  helperText="Clic o arrastra una imagen cuadrada aquí. El logo se mostrará como una insignia redonda."
                  accept="image/*"
                  disabled={mediaUploading.logo}
                  selectedLabel={
                    mediaUploading.logo 
                      ? "📤 Procesando logo..."
                      : uploadLabels.logo ?? 
                        (draft.businessLogo?.trim()
                          ? "✅ Logo guardado en el borrador"
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
                    Procesando logo...
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
                        alt="Logo del negocio"
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
                        Reemplazar
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
                        Quitar logo
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
            <RestauranteExternalVideoUrlsSection draft={draft} setDraftPatch={setDraftPatch} />
          </div>
        </section>
        ) : null}

        {/* I */}
        {activeSectionId === "restaurantes-section-i" ? (
        <section id="restaurantes-section-i" className={stepPanel}>
          <SectionTitle>I · Destacados del lugar</SectionTitle>
          <p className="mt-2 text-sm text-[color:var(--lx-muted)]">
            Máximo <strong className="text-[color:var(--lx-text-2)]">6</strong> etiquetas en la ficha; aquí no puedes pasar de
            seis seleccionadas.
          </p>
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
                  <span className="min-w-0">{o.labelEs}</span>
                </label>
              );
            })}
          </div>
        </section>
        ) : null}

        {/* J — Amenidades y más */}
        {activeSectionId === "restaurantes-section-j" ? (
          <section id="restaurantes-section-j" className={stepPanel}>
            <SectionTitle>J · Amenidades y más</SectionTitle>
            <HelperText>
              Opcional. No es obligatorio para publicar. Las opciones aparecen en la vista previa y en la ficha pública
              solo cuando marcas al menos una.
            </HelperText>
            <RestauranteAmenitiesFormBlock draft={draft} setDraftPatch={setDraftPatch} />
          </section>
        ) : null}

        {/* K */}
        {(draft.cateringAvailable || draft.eventFoodService) && activeSectionId === "restaurantes-section-k" ? (
          <section id="restaurantes-section-k" className={stepPanel}>
            <SectionTitle>K · Catering y eventos</SectionTitle>
            <HelperText>
              Alcance de <strong className="text-[color:var(--lx-text-2)]">catering y comida para eventos</strong>. Aquí
              defines anticipación, dónde solicitar cotización y radio de servicio.
            </HelperText>
            <div className="mt-4 grid gap-3">
              <div>
                <FieldLabel optional>Tamaños de evento</FieldLabel>
                <HelperText>Qué tamaños de grupo puedes atender.</HelperText>
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
                      {o.labelEs}
                    </label>
                  ))}
                </div>
              </div>
              {(
                [
                  ["bookingLeadTimeText", "Anticipación de reserva"],
                  ["cateringInquiryUrl", "URL de solicitud"],
                  ["cateringNote", "Nota"],
                ] as const
              ).map(([k, lab]) => (
                <div key={k}>
                  <FieldLabel optional>{lab}</FieldLabel>
                  {k === "bookingLeadTimeText" ? (
                    <HelperText>Con cuánta anticipación deben contactarte (ej. «mín. 2 semanas»).</HelperText>
                  ) : k === "cateringInquiryUrl" ? (
                    <HelperText>Formulario o página donde el cliente pide presupuesto.</HelperText>
                  ) : (
                    <HelperText>Añade algo importante para eventos: mínimo de personas, montaje, cargos extra por distancia o condiciones especiales.</HelperText>
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
                <FieldLabel optional>Radio de servicio (millas)</FieldLabel>
                <HelperText>Distancia aproximada desde tu base de operación donde ofreces catering o servicio en sitio.</HelperText>
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
          <SectionTitle>Final · Confirmación antes de la vista previa</SectionTitle>
          <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">
            {lang === "en"
              ? "Check these boxes before reviewing your ad. Payment is completed after the preview."
              : "Marca estas casillas antes de revisar tu anuncio. El pago se completa después de la vista previa."}
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
                {lang === "en"
                  ? "I confirm that the restaurant information is truthful and up to date."
                  : "Confirmo que la información del restaurante es veraz y actualizada."}
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
                {lang === "en"
                  ? "I confirm that the photos, dishes, hours, offers, and contact details represent my business correctly."
                  : "Confirmo que las fotos, platillos, horarios, ofertas y datos de contacto representan mi negocio correctamente."}
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
                {lang === "en"
                  ? "I confirm that my ad complies with Leonix rules and that I am responsible for the published information."
                  : "Confirmo que mi anuncio cumple con las reglas de Leonix y que soy responsable por la información publicada."}
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
                  {lang === "en"
                    ? "I confirm that the coupons and promotions are valid, with correct expiration dates and clear terms."
                    : "Confirmo que los cupones y promociones son válidos, con fechas de expiración correctas y términos claros."}
                </span>
              </label>
            ) : null}
          </div>
          {!canContinueToPreview ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">
                {lang === "en" ? "To enable Preview, complete the following:" : "Para habilitar Vista previa, completa lo siguiente:"}
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                {!minPreviewOk && (
                  <li>• {lang === "en" ? "Complete minimum required fields" : "Completa los campos mínimos requeridos"}</li>
                )}
                {!confirmBusinessInfo && (
                  <li>• {lang === "en" ? "Confirm restaurant information is correct" : "Confirma que la información del restaurante es correcta"}</li>
                )}
                {!confirmPhotosRepresent && (
                  <li>• {lang === "en" ? "Confirm photos and data represent your business" : "Confirma que las fotos y datos representan tu negocio"}</li>
                )}
                {!confirmCommunityRules && (
                  <li>• {lang === "en" ? "Confirm you comply with Leonix rules" : "Confirma que cumples las reglas de Leonix"}</li>
                )}
                {hasCouponContent && !confirmCouponTerms && (
                  <li>• {lang === "en" ? "Confirm promotions are valid" : "Confirma que las promociones son válidas"}</li>
                )}
              </ul>
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={goPreview}
                disabled={!canContinueToPreview}
                className="min-h-[44px] rounded-full bg-[color:var(--lx-text)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lang === "en" ? "Preview" : "Vista previa"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("¿Eliminar toda la solicitud y empezar de nuevo? Esta acción no se puede deshacer.")) {
                    void resetDraft();
                  }
                }}
                className="min-h-[44px] rounded-full border border-[color:var(--lx-nav-border)] bg-white px-6 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                {lang === "en" ? "Delete request" : "Eliminar solicitud"}
              </button>
            </div>
            <button
              type="button"
              onClick={goPreview}
              disabled={!canContinueToPreview}
              className="min-h-[44px] w-full rounded-full bg-[color:var(--lx-text)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--lx-text-2)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[200px]"
            >
              {lang === "en" ? "Continue to preview" : "Continuar a vista previa"}
            </button>
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
            Atrás
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
            Siguiente
          </button>
        </div>
        </div>
      </div>

      {/* Coupon Detail Drawer */}
      {couponDetailDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setCouponDetailDrawer(false)}>
          <div className="max-w-lg rounded-2xl bg-[#FFFCF7] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-[#1E1810]">
              {lang === "en" ? "What's included with Featured Coupons" : "Qué incluye Cupones Destacados"}
            </h2>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{lang === "en" ? "Up to 4 main coupons within the restaurant profile" : "Hasta 4 cupones principales dentro del perfil del restaurante"}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{lang === "en" ? "Fields for title, description, code, expiration, and redemption note" : "Campos para título, descripción, código, vencimiento y nota de canje"}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{lang === "en" ? "Option to add coupon flyer/image or promotion image" : "Opción para agregar flyer/imagen del cupón o promoción"}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{lang === "en" ? "Option to add external URL for coupon, menu, landing page, or promotion" : "Opción para agregar URL externa de cupón, menú, landing page o promoción"}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{lang === "en" ? "Customer can share coupon by link, SMS/email/app share when supported" : "El cliente puede compartir el cupón por enlace, SMS/email/app share cuando esté disponible"}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{lang === "en" ? "Coupons appear below \"House Specialties\" on the public profile" : "Los cupones aparecen debajo de \"Especialidades de la Casa\" en la ficha pública"}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{lang === "en" ? "Coupons carry Leonix branding / \"Published on Leonix\" where appropriate" : "Los cupones llevan marca Leonix / \"Publicado en Leonix\" donde corresponda"}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#5C5346]">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                <span>{lang === "en" ? "Final review before publication" : "Revisión final antes de publicación"}</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setCouponDetailDrawer(false)}
              className="mt-6 min-h-[44px] w-full rounded-full bg-[#1E1810] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3D2C12]"
            >
              {lang === "en" ? "Close" : "Cerrar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
