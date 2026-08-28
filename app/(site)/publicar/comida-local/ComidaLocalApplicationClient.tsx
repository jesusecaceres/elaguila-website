"use client";

import CityAutocomplete from "@/app/components/CityAutocomplete";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { normalizeLang, replaceLangInHref } from "@/app/lib/language";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { postComidaLocalPublishApi } from "@/app/lib/clasificados/comida-local/comidaLocalPublishClient";
import {
  clearComidaLocalDraftStorage,
  comidaLocalEditWorkspaceStorageKey,
  saveComidaLocalDraftToStorage,
} from "@/app/lib/clasificados/comida-local/comidaLocalDraftPersistence";
import {
  clearComidaLocalEditContext,
  fetchOwnerComidaLocalListingForEdit,
  readComidaLocalEditContext,
  writeComidaLocalEditContext,
} from "@/app/lib/clasificados/comida-local/comidaLocalListingEditContext";
import { resolveDraftPrecedence } from "@/app/lib/listingDrafts/draftWorkspaceContract";
import { useBusinessApplicationLeaveGuard } from "@/app/lib/businessApplications/useBusinessApplicationLeaveGuard";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { PhoneInput } from "@/app/components/forms/PhoneInput";
import { LanguagesInput } from "@/app/components/forms/LanguagesInput";
import { HoursEditor, type HoursEditorDayRow } from "@/app/components/forms/HoursEditor";
import { AddedConfirmationBadge, useAddedConfirmation } from "@/app/components/forms/AddedConfirmation";
import {
  COMIDA_LOCAL_BUSINESS_TYPE_OPTIONS,
  COMIDA_LOCAL_FOOD_TYPE_OPTIONS,
  COMIDA_LOCAL_GALLERY_MAX,
  COMIDA_LOCAL_HIGHLIGHT_OPTIONS,
  COMIDA_LOCAL_LANGUAGE_OPTIONS,
  COMIDA_LOCAL_PAYMENT_OPTIONS,
  COMIDA_LOCAL_PRICE_LEVEL_OPTIONS,
  COMIDA_LOCAL_PRODUCT_NAME,
  COMIDA_LOCAL_SECTIONS,
  COMIDA_LOCAL_SERVICE_OPTIONS,
} from "@/app/lib/clasificados/comida-local/comidaLocalConstants";
import { syncComidaLocalCityFromInput } from "@/app/lib/clasificados/comida-local/comidaLocalCity";
import {
  COMIDA_LOCAL_FIELD_COPY,
  COMIDA_LOCAL_HIGHLIGHTS_DISCLAIMER,
  COMIDA_LOCAL_SHELL_COPY,
  resolveComidaLocalFieldCopy,
} from "@/app/lib/clasificados/comida-local/comidaLocalFieldCopy";
import {
  formatComidaLocalPhoneInput,
  isValidComidaLocalExternalUrl,
  normalizeComidaLocalSocialInput,
} from "@/app/lib/clasificados/comida-local/comidaLocalFormatting";
import type {
  ComidaLocalDraft,
  ComidaLocalHighlightOption,
  ComidaLocalLanguageOption,
  ComidaLocalPaymentMethod,
  ComidaLocalPriceLevel,
  ComidaLocalSectionKey,
  ComidaLocalServiceOption,
  ComidaLocalSocialPlatform,
} from "@/app/lib/clasificados/comida-local/comidaLocalTypes";
import { useComidaLocalDraft } from "@/app/lib/clasificados/comida-local/useComidaLocalDraft";
import {
  validateComidaLocalDraftForFuturePublish,
  validateComidaLocalDraftForPreview,
} from "@/app/lib/clasificados/comida-local/comidaLocalValidation";
import { ComidaLocalValidationPanel } from "./ComidaLocalValidationPanel";
import { ComidaLocalGalleryUpload } from "./components/ComidaLocalGalleryUpload";
import { ComidaLocalImageUploadField } from "./components/ComidaLocalImageUploadField";

const PAGE_BG = "bg-[#FFFCF7]";
const CARD = "rounded-lg border border-[#D4C4A8]/80 bg-[#FFFCF7] shadow-sm";
const INPUT =
  "w-full rounded-lg border border-[#D4C4A8]/90 bg-white px-3 py-2.5 text-sm text-[#1E1814] placeholder:text-[#1E1814]/40 focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/20";
const INPUT_INVALID = "border-red-400/80 focus:ring-red-300/40";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/70";
const HELPER = "mt-1 text-xs leading-relaxed text-[#1E1814]/60";
const INLINE_WARN = "mt-1 text-xs text-red-700";
const SECTION_TITLE =
  "border-l-[3px] border-[#7A1E2C] pl-3 text-base font-semibold text-[#1E1814]";
const CHIP_ON =
  "rounded-lg border border-[#7A1E2C] bg-[#7A1E2C]/10 px-3 py-1.5 text-sm font-medium text-[#7A1E2C]";
const CHIP_OFF =
  "rounded-lg border border-[#D4C4A8] bg-white px-3 py-1.5 text-sm text-[#1E1814]/80 hover:border-[#7A1E2C]/40";

/** Case- and accent-insensitive key for custom-language duplicate detection (contract shared
 * items 33/39, bounded version) — mirrors Servicios' `normalizeServiceOfferedDedupeKey`. */
function normalizeComidaLocalLanguageToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * True when `candidate` duplicates an already-added custom language, or one of
 * COMIDA_LOCAL_LANGUAGE_OPTIONS' own fixed/suggested labels (in either ES or EN) — e.g. typing
 * "French"/"francés" is fine, but "Spanish"/"español" duplicates the fixed "es" option. Bounded
 * lookup against this finite list only; no open-ended cross-language dictionary (item 39 scope).
 */
function isDuplicateComidaLocalCustomLanguage(candidate: string, existingCustoms: string[]): boolean {
  const norm = normalizeComidaLocalLanguageToken(candidate);
  if (!norm) return true;
  if (existingCustoms.some((v) => normalizeComidaLocalLanguageToken(v) === norm)) return true;
  return COMIDA_LOCAL_LANGUAGE_OPTIONS.some((o) => {
    if (o.value === "otro") return false;
    return (
      normalizeComidaLocalLanguageToken(o.labelEs) === norm ||
      normalizeComidaLocalLanguageToken(o.labelEn) === norm
    );
  });
}

const WEEKDAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const WEEKDAY_LABELS: Record<(typeof WEEKDAY_ORDER)[number], { es: string; en: string }> = {
  monday: { es: "Lunes", en: "Monday" },
  tuesday: { es: "Martes", en: "Tuesday" },
  wednesday: { es: "Miércoles", en: "Wednesday" },
  thursday: { es: "Jueves", en: "Thursday" },
  friday: { es: "Viernes", en: "Friday" },
  saturday: { es: "Sábado", en: "Saturday" },
  sunday: { es: "Domingo", en: "Sunday" },
};

const SOCIAL_ACCENT: Record<ComidaLocalSocialPlatform, string> = {
  instagram: "focus:ring-[#E4405F]/30 border-[#E4405F]/25",
  facebook: "focus:ring-[#1877F2]/30 border-[#1877F2]/25",
  tiktok: "focus:ring-[#010101]/20 border-[#010101]/15",
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FieldBlock({
  fieldKey,
  es,
  children,
  warning,
}: {
  fieldKey: keyof typeof COMIDA_LOCAL_FIELD_COPY;
  es: boolean;
  children: ReactNode;
  warning?: string;
}) {
  const copy = resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY[fieldKey], es);
  return (
    <div className="space-y-1.5">
      <label className={LABEL}>
        {copy.label}
        {copy.optional ? (
          <span className="ml-1 font-normal normal-case text-[#1E1814]/45">
            {es ? "(opcional)" : "(optional)"}
          </span>
        ) : null}
      </label>
      {children}
      {warning ? <p className={INLINE_WARN}>{warning}</p> : null}
      <p className={HELPER}>{copy.helper}</p>
    </div>
  );
}

function SellerTypeBanner({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-[#7A1E2C]/25 bg-[#7A1E2C]/5 px-3 py-2 text-xs leading-relaxed text-[#1E1814]/80">
      {text}
    </p>
  );
}

/** Gate C-023/C-053/C-068 — shared array-backed "Other" custom-value list: an Add button plus
 * independently-removable chips, mirroring the LanguagesInput custom-entry UX. Blank/whitespace
 * entries are blocked and near-duplicate (case-insensitive, trimmed) entries are ignored. */
function CustomChipListField({
  values,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
  addLabel,
  removeAriaLabel,
  maxLength = 80,
  justAdded,
  addedLabel,
}: {
  values: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  addLabel: string;
  removeAriaLabel: (value: string) => string;
  maxLength?: number;
  /** Owner UX doctrine (INPUT -> ACCEPTED -> PERSISTED): true for a brief moment right after a
   * genuinely successful add, driven by the caller's own `useAddedConfirmation()` instance so
   * each of this component's call sites (business type / service mode / highlights) flashes
   * independently. */
  justAdded: boolean;
  addedLabel: string;
}) {
  return (
    <div className="space-y-2">
      {values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <span
              key={`${value}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#7A1E2C]/25 bg-[#7A1E2C]/5 px-3 py-1 text-sm font-medium text-[#7A1E2C]"
            >
              {value}
              <button
                type="button"
                className="ml-0.5 rounded-full px-1 text-[#7A1E2C]/60 hover:text-[#7A1E2C]"
                aria-label={removeAriaLabel(value)}
                onClick={() => onRemove(index)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={cx(INPUT, "min-w-[10rem] flex-1")}
          maxLength={maxLength}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 rounded-lg border border-dashed border-[#D4C4A8] px-3 py-2 text-xs font-medium text-[#1E1814]/70 hover:border-[#7A1E2C]/40"
        >
          {addLabel}
        </button>
        <AddedConfirmationBadge visible={justAdded} label={addedLabel} />
      </div>
    </div>
  );
}

function formatSavedAt(ts: number | null, es: boolean): string | null {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleTimeString(es ? "es-US" : "en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return null;
  }
}

export default function ComidaLocalApplicationClient() {
  const searchParams = useSearchParams();
  const routeLang = normalizeLang(searchParams?.get("lang"));
  const es = routeLang !== "en";
  const shellCopy = COMIDA_LOCAL_SHELL_COPY[es ? "es" : "en"];
  const comidaLocalHubHref = replaceLangInHref("/clasificados/comida-local", routeLang);
  const editListingIdForHrefs = ((searchParams?.get("edit") ?? "") === "1" ? searchParams?.get("listingId") ?? "" : "").trim();
  const comidaLocalPreviewHref = replaceLangInHref(
    editListingIdForHrefs
      ? `/clasificados/comida-local/preview?edit=1&listingId=${encodeURIComponent(editListingIdForHrefs)}`
      : "/clasificados/comida-local/preview",
    routeLang,
  );

  /* Globalization Package A closure — dedicated listing-edit mode. The edit workspace lives
   * under its own per-listing key (draftWorkspaceContract Rule 1 — never the new-ad key), the
   * row hydrates from its own stored listing_json (owner-scoped), and publishing routes into
   * the server's same-row update branch via the row's own draft_listing_id (id, slug, Leonix
   * Ad ID, status, payment, and ownership all preserved server-side). Gate D19 — editing an
   * already-published (already-paid) listing saves directly with no re-checkout, matching the
   * locked "no recharge on active-paid-edit" doctrine used by every other paid category. */
  const editListingId = ((searchParams?.get("edit") ?? "") === "1" ? searchParams?.get("listingId") ?? "" : "").trim();
  const editStorageKey = editListingId ? comidaLocalEditWorkspaceStorageKey(editListingId) : undefined;
  const { draft, setDraft, updateDraft, resetDraft, hasLoadedDraft, lastSavedAt, isDraftDirty } = useComidaLocalDraft({
    storageKey: editStorageKey,
  });

  useBusinessApplicationLeaveGuard({
    isDirty: hasLoadedDraft && Boolean(draft.businessName?.trim()) && isDraftDirty,
    persist: () => {
      if (editStorageKey) saveComidaLocalDraftToStorage(draft, editStorageKey);
      else saveComidaLocalDraftToStorage(draft);
    },
  });
  const [editHydration, setEditHydration] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; leonixAdId: string | null; publicPath: string }
    | { status: "error"; message: string }
  >({ status: editListingId ? "loading" : "idle" });
  const [staleDraftNotice, setStaleDraftNotice] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ComidaLocalSectionKey>("identidad");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [customLanguageInput, setCustomLanguageInput] = useState("");
  const [businessTypeCustomInput, setBusinessTypeCustomInput] = useState("");
  const [serviceOptionOtherInput, setServiceOptionOtherInput] = useState("");
  const [highlightsOtherInput, setHighlightsOtherInput] = useState("");
  // Owner UX doctrine — each explicit Add/Accept flow owns its own independent "just added"
  // flash state so, e.g., adding a highlight never flashes a confirmation next to service mode.
  const businessTypeAddedConfirmation = useAddedConfirmation();
  const serviceOptionOtherAddedConfirmation = useAddedConfirmation();
  const highlightsOtherAddedConfirmation = useAddedConfirmation();
  const customLanguageAddedConfirmation = useAddedConfirmation();
  const additionalWebsiteAddedConfirmation = useAddedConfirmation();
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<{
    publicPath: string;
    leonixAdId?: string;
  } | null>(null);

  useEffect(() => {
    if (!editListingId || !hasLoadedDraft) return;
    let cancelled = false;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      const ownerUserId = auth.user?.id?.trim();
      if (!ownerUserId) {
        if (!cancelled) {
          setEditHydration({
            status: "error",
            message: es ? "Inicia sesión para editar tu anuncio de Comida Local." : "Sign in to edit your Comida Local listing.",
          });
        }
        return;
      }
      const result = await fetchOwnerComidaLocalListingForEdit(supabase, { ownerUserId, listingId: editListingId });
      if (cancelled) return;
      if (!result.ok) {
        setEditHydration({
          status: "error",
          message:
            result.reason === "not_editable_legacy_row"
              ? es
                ? "Este anuncio no se puede editar todavía. Contacta a soporte de Leonix."
                : "This listing cannot be edited yet. Contact Leonix support."
              : es
                ? "No se pudo cargar el anuncio para editar. Verifica que sea tuyo e inténtalo de nuevo."
                : "Could not load the listing for editing. Verify it is yours and try again.",
        });
        return;
      }
      // Staleness precedence (draftWorkspaceContract Rule 3): a local edit workspace only
      // outranks the row it was hydrated from while that row is unchanged. A workspace whose
      // draftListingId does not match the row is invalid (e.g. an accidental empty autosave)
      // and is always replaced.
      const marker = readComidaLocalEditContext();
      const workspaceValid =
        marker?.listingId === editListingId && draft.draftListingId === result.context.draftListingId;
      const precedence = resolveDraftPrecedence({
        hasLocalWorkspace: workspaceValid,
        localSourceUpdatedAt: workspaceValid ? marker?.sourceUpdatedAt ?? null : null,
        dbUpdatedAt: result.context.sourceUpdatedAt,
      });
      if (!workspaceValid || precedence !== "local") {
        setDraft(result.draft);
        if (editStorageKey) saveComidaLocalDraftToStorage(result.draft, editStorageKey);
        if (workspaceValid && precedence === "db-newer-conflict") {
          setStaleDraftNotice(
            es
              ? "Este anuncio cambió desde tu último borrador local. Se cargó la versión publicada más reciente; el borrador antiguo se descartó."
              : "This listing changed since your last local draft. The latest published version was loaded; the outdated draft was discarded.",
          );
        }
      }
      writeComidaLocalEditContext(result.context);
      setEditHydration({
        status: "ready",
        leonixAdId: result.context.leonixAdId,
        publicPath: `/clasificados/comida-local/${encodeURIComponent(result.context.slug)}`,
      });
    })();
    return () => {
      cancelled = true;
    };
    // draft.draftListingId is intentionally read once post-load; re-running on each keystroke
    // would re-fight the owner's edits.
  }, [editListingId, hasLoadedDraft, es, editStorageKey]);

  const previewIssues = useMemo(() => validateComidaLocalDraftForPreview(draft, es), [draft, es]);
  const publishIssues = useMemo(() => validateComidaLocalDraftForFuturePublish(draft, es), [draft, es]);
  const publishReady = publishIssues.every((i) => i.severity !== "error");
  const previewReady = previewIssues.length === 0;

  const markTouched = useCallback((key: string) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const socialWarning = useCallback(
    (platform: ComidaLocalSocialPlatform, raw: string): string | undefined => {
      const t = raw.trim();
      if (!t) return undefined;
      if (!touched[platform]) return undefined;
      return normalizeComidaLocalSocialInput(t, platform)
        ? undefined
        : es
          ? "Enlace o usuario no válido para esta red."
          : "Invalid link or username for this network.";
    },
    [touched, es]
  );

  const locationUrlWarning = useMemo(() => {
    const t = draft.locationUrl.trim();
    if (!t || !touched.locationUrl) return undefined;
    return isValidComidaLocalExternalUrl(t) ? undefined : es ? "URL no válida." : "Invalid URL.";
  }, [draft.locationUrl, touched.locationUrl, es]);

  const handleSocialBlur = useCallback(
    (platform: ComidaLocalSocialPlatform, field: keyof Pick<ComidaLocalDraft, "instagramUrl" | "facebookUrl" | "tiktokUrl">) => {
      markTouched(platform);
      const raw = draft[field].trim();
      if (!raw) return;
      const normalized = normalizeComidaLocalSocialInput(raw, platform);
      if (normalized && normalized !== raw) {
        updateDraft({ [field]: normalized } as Partial<ComidaLocalDraft>);
      }
    },
    [draft, markTouched, updateDraft]
  );

  const handleLocationUrlBlur = useCallback(() => {
    markTouched("locationUrl");
    const raw = draft.locationUrl.trim();
    if (!raw) return;
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    if (isValidComidaLocalExternalUrl(withScheme)) {
      updateDraft({ locationUrl: withScheme });
    }
  }, [draft.locationUrl, markTouched, updateDraft]);

  const addBusinessTypeCustomValue = useCallback(() => {
    const value = businessTypeCustomInput.trim();
    if (!value) return;
    setBusinessTypeCustomInput("");
    if (draft.businessTypeCustomValues.some((v) => v.toLowerCase() === value.toLowerCase())) return;
    updateDraft({ businessTypeCustomValues: [...draft.businessTypeCustomValues, value] });
    businessTypeAddedConfirmation.flash();
  }, [businessTypeCustomInput, draft.businessTypeCustomValues, updateDraft, businessTypeAddedConfirmation]);

  const removeBusinessTypeCustomValue = useCallback(
    (index: number) => {
      updateDraft({
        businessTypeCustomValues: draft.businessTypeCustomValues.filter((_, i) => i !== index),
      });
    },
    [draft.businessTypeCustomValues, updateDraft]
  );

  const addServiceOptionOtherValue = useCallback(() => {
    const value = serviceOptionOtherInput.trim();
    if (!value) return;
    setServiceOptionOtherInput("");
    if (draft.serviceOptionOtherCustomValues.some((v) => v.toLowerCase() === value.toLowerCase())) return;
    updateDraft({
      serviceOptionOtherCustomValues: [...draft.serviceOptionOtherCustomValues, value],
    });
    serviceOptionOtherAddedConfirmation.flash();
  }, [
    serviceOptionOtherInput,
    draft.serviceOptionOtherCustomValues,
    updateDraft,
    serviceOptionOtherAddedConfirmation,
  ]);

  const removeServiceOptionOtherValue = useCallback(
    (index: number) => {
      updateDraft({
        serviceOptionOtherCustomValues: draft.serviceOptionOtherCustomValues.filter(
          (_, i) => i !== index
        ),
      });
    },
    [draft.serviceOptionOtherCustomValues, updateDraft]
  );

  const addHighlightsOtherValue = useCallback(() => {
    const value = highlightsOtherInput.trim();
    if (!value) return;
    setHighlightsOtherInput("");
    if (draft.highlightsOtherCustomValues.some((v) => v.toLowerCase() === value.toLowerCase())) return;
    updateDraft({ highlightsOtherCustomValues: [...draft.highlightsOtherCustomValues, value] });
    highlightsOtherAddedConfirmation.flash();
  }, [
    highlightsOtherInput,
    draft.highlightsOtherCustomValues,
    updateDraft,
    highlightsOtherAddedConfirmation,
  ]);

  const removeHighlightsOtherValue = useCallback(
    (index: number) => {
      updateDraft({
        highlightsOtherCustomValues: draft.highlightsOtherCustomValues.filter((_, i) => i !== index),
      });
    },
    [draft.highlightsOtherCustomValues, updateDraft]
  );

  const hoursDays: HoursEditorDayRow[] = WEEKDAY_ORDER.map((key) => {
    const sched = draft.weeklyHours[key];
    return {
      key,
      label: es ? WEEKDAY_LABELS[key].es : WEEKDAY_LABELS[key].en,
      schedule: {
        closed: sched?.closed ?? true,
        openTime: sched?.openTime,
        closeTime: sched?.closeTime,
      },
    };
  });

  const cityValue = draft.cityDisplay || draft.cityCanonical;
  const cityInvalid =
    touched.city &&
    Boolean(cityValue.trim()) &&
    !syncComidaLocalCityFromInput(cityValue).cityCanonical;

  /** Gate D3 — seller-type buckets driving conditional section copy/visibility. One
   * application, no separate forms; only emphasis/visibility of already-shared fields changes. */
  const sellerCategory = useMemo((): "mobile" | "home_kitchen" | "catering" | "meal_prep" | null => {
    switch (draft.businessType) {
      case "food_truck":
      case "puesto":
      case "mercado":
      case "delivery_only":
      case "pop_up":
      case "feria":
        return "mobile";
      case "comida_casa":
      case "chef_privado":
      case "panaderia":
        return "home_kitchen";
      case "catering":
        return "catering";
      case "meal_prep":
        return "meal_prep";
      default:
        return null;
    }
  }, [draft.businessType]);

  const showFoodTypeCustom = draft.foodType === "otro";
  const showBusinessTypeCustom = draft.businessType === "otro";
  const showServiceOptionOther = draft.serviceOptions.includes("other");
  const showHighlightsOther = draft.highlights.includes("otro");
  const showPaymentOther = draft.paymentMethods.includes("other");
  const savedLabel = formatSavedAt(lastSavedAt, es);

  /** Gate C-024/C-027/C-034-038 — structural per-seller-type field visibility (not just banner
   * copy). One application; only visibility of additive fields changes with `businessType`. */
  const isEventOrMarketSeller =
    draft.businessType === "pop_up" || draft.businessType === "feria" || draft.businessType === "mercado";
  const showMobileOrderLink = sellerCategory === "mobile" || draft.businessType === "chef_privado";
  const showEventScheduleNote = isEventOrMarketSeller;
  const showCateringExtras = sellerCategory === "catering";
  const showMealPrepExtras = sellerCategory === "meal_prep";
  const showChefPrivadoBanner = draft.businessType === "chef_privado";
  const showBakeryBanner = draft.businessType === "panaderia";

  const handlePublish = useCallback(async () => {
    if (!publishReady || publishBusy) return;
    if (editListingId && editHydration.status !== "ready") return;
    setPublishError(null);
    setPublishSuccess(null);
    setPublishBusy(true);
    try {
      if (editStorageKey) saveComidaLocalDraftToStorage(draft, editStorageKey);
      else saveComidaLocalDraftToStorage(draft);
      const supabase = createSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? null;
      const draftListingId = draft.draftListingId.trim();
      const { res, data } = await postComidaLocalPublishApi({
        draft,
        draftListingId,
        packageTier: "basic",
        lang: es ? "es" : "en",
        accessToken: token,
      });
      if (!res.ok || !data.ok) {
        const issueMsg = data.issues?.map((i) => i.message).filter(Boolean).join(" ");
        setPublishError(issueMsg || data.detail || data.error || shellCopy.publishErrorGeneric);
        return;
      }
      if (data.publicPath) {
        setPublishSuccess({
          publicPath: data.publicPath,
          leonixAdId:
            typeof data.leonix_ad_id === "string" && data.leonix_ad_id.trim()
              ? data.leonix_ad_id.trim()
              : undefined,
        });
        // Package A closure — a confirmed same-row save ends this edit session: the edit
        // workspace and context marker are cleared (the new-ad draft key is never touched).
        if (editListingId && editStorageKey) {
          clearComidaLocalDraftStorage(editStorageKey);
          clearComidaLocalEditContext();
          setStaleDraftNotice(null);
        }
      }
    } catch {
      setPublishError(shellCopy.publishErrorGeneric);
    } finally {
      setPublishBusy(false);
    }
  }, [draft, editHydration.status, editListingId, editStorageKey, es, publishBusy, publishReady]);

  if (!hasLoadedDraft || (editListingId && editHydration.status === "loading")) {
    return (
      <div className={cx("min-h-screen", PAGE_BG)}>
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-[#1E1814]/60">
          {editListingId ? (es ? "Cargando tu anuncio…" : "Loading your listing…") : "Cargando borrador…"}
        </div>
      </div>
    );
  }

  if (editListingId && editHydration.status === "error") {
    return (
      <div className={cx("min-h-screen", PAGE_BG)}>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-sm font-semibold text-red-900">{editHydration.message}</p>
          <Link
            href={replaceLangInHref("/dashboard/mis-anuncios?cat=comida-local", routeLang)}
            className="mt-6 inline-flex rounded-xl border border-[#7A1E2C] bg-[#7A1E2C] px-5 py-2.5 text-sm font-semibold text-[#FFFCF7] hover:bg-[#6a1a26]"
          >
            {es ? "Volver a Mis anuncios" : "Back to My listings"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("min-h-screen", PAGE_BG)}>
      <div className="mx-auto max-w-6xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <header className="mb-6 border-b border-[#D4C4A8]/60 pb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A1E2C]">
            Leonix Clasificados · {COMIDA_LOCAL_PRODUCT_NAME}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#1E1814] sm:text-3xl">
            {shellCopy.pageTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#1E1814]/75">
            {shellCopy.pageSubtitle}
          </p>
          {editListingId && editHydration.status === "ready" ? (
            <div className="mt-3 rounded-lg border border-[#7A1E2C]/30 bg-[#7A1E2C]/5 px-3 py-2 text-xs leading-relaxed text-[#1E1814]">
              <span className="font-bold text-[#7A1E2C]">
                {es ? "Editando anuncio publicado" : "Editing published listing"}
              </span>
              {editHydration.leonixAdId ? (
                <span className="ml-2 font-mono">{editHydration.leonixAdId}</span>
              ) : null}
              <span className="ml-2 text-[#1E1814]/65">
                {es
                  ? "Al guardar, se actualiza el mismo anuncio — sin duplicados ni pagos."
                  : "Saving updates this same listing — no duplicates, no payments."}
              </span>
            </div>
          ) : null}
          {staleDraftNotice ? (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950" role="status">
              {staleDraftNotice}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="rounded-lg border border-[#D4C4A8]/70 bg-[#FDF8F0] px-3 py-2 text-xs leading-relaxed text-[#1E1814]/70">
              {shellCopy.scaffoldNotice}
              {savedLabel ? ` · ${shellCopy.draftSaved} (${savedLabel})` : null}
            </p>
            <button
              type="button"
              onClick={() => {
                const confirmMsg = editListingId
                  ? es
                    ? "¿Descartar los cambios sin guardar y recargar la versión publicada?"
                    : "Discard unsaved changes and reload the published version?"
                  : "¿Borrar el borrador guardado en este dispositivo?";
                if (window.confirm(confirmMsg)) {
                  if (editListingId) {
                    // Package A closure — safe discard: clear only the edit workspace/marker
                    // and re-enter the edit flow (fresh DB hydration). Published row untouched.
                    if (editStorageKey) clearComidaLocalDraftStorage(editStorageKey);
                    clearComidaLocalEditContext();
                    window.location.reload();
                    return;
                  }
                  resetDraft();
                  setTouched({});
                }
              }}
              className="text-xs font-medium text-[#7A1E2C] underline-offset-2 hover:underline"
            >
              {editListingId ? (es ? "Descartar cambios" : "Discard changes") : shellCopy.resetDraft}
            </button>
          </div>
        </header>

        <div className="mb-6">
          <ComidaLocalValidationPanel
            previewIssues={previewIssues}
            publishIssues={publishIssues}
            publishReady={publishReady}
            es={es}
          />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <nav className="lg:w-52 lg:shrink-0" aria-label={es ? "Secciones del formulario" : "Form sections"}>
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {COMIDA_LOCAL_SECTIONS.map((s) => (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(s.key)}
                    className={cx(
                      "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      activeSection === s.key
                        ? "bg-[#7A1E2C] font-medium text-[#FFFCF7]"
                        : "text-[#1E1814]/80 hover:bg-[#D4C4A8]/30"
                    )}
                  >
                    {es ? s.titleEs : s.titleEn}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 flex-1 space-y-6">
            {activeSection === "identidad" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="identidad">
                <h2 className={SECTION_TITLE}>{es ? "Identidad" : "Identity"}</h2>
                <div className="mt-5 space-y-5">
                  <FieldBlock fieldKey="businessName" es={es}>
                    <input
                      className={INPUT}
                      value={draft.businessName}
                      onChange={(e) => updateDraft({ businessName: e.target.value })}
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.businessName, es).placeholder}
                      autoComplete="organization"
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="foodType" es={es}>
                    <select
                      className={INPUT}
                      value={draft.foodType}
                      onChange={(e) =>
                        updateDraft({
                          foodType: e.target.value as ComidaLocalDraft["foodType"],
                          foodTypeCustom:
                            e.target.value === "otro" ? draft.foodTypeCustom : "",
                        })
                      }
                    >
                      <option value="">{resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.foodType, es).placeholder}</option>
                      {COMIDA_LOCAL_FOOD_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {es ? o.labelEs : o.labelEn}
                        </option>
                      ))}
                    </select>
                  </FieldBlock>
                  {showFoodTypeCustom ? (
                    <FieldBlock fieldKey="foodTypeCustom" es={es}>
                      <input
                        className={INPUT}
                        value={draft.foodTypeCustom}
                        onChange={(e) => updateDraft({ foodTypeCustom: e.target.value })}
                        placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.foodTypeCustom, es).placeholder}
                      />
                    </FieldBlock>
                  ) : null}
                  <FieldBlock fieldKey="businessType" es={es}>
                    <select
                      className={INPUT}
                      value={draft.businessType}
                      onChange={(e) =>
                        updateDraft({
                          businessType: e.target.value as ComidaLocalDraft["businessType"],
                          businessTypeCustom:
                            e.target.value === "otro" ? draft.businessTypeCustom : "",
                          businessTypeCustomValues:
                            e.target.value === "otro" ? draft.businessTypeCustomValues : [],
                        })
                      }
                    >
                      <option value="">{resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.businessType, es).placeholder}</option>
                      {COMIDA_LOCAL_BUSINESS_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {es ? o.labelEs : o.labelEn}
                        </option>
                      ))}
                    </select>
                  </FieldBlock>
                  {showBusinessTypeCustom ? (
                    <FieldBlock fieldKey="businessTypeCustom" es={es}>
                      <CustomChipListField
                        values={draft.businessTypeCustomValues}
                        inputValue={businessTypeCustomInput}
                        onInputChange={setBusinessTypeCustomInput}
                        onAdd={addBusinessTypeCustomValue}
                        onRemove={removeBusinessTypeCustomValue}
                        placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.businessTypeCustom, es).placeholder}
                        addLabel={es ? "Agregar" : "Add"}
                        removeAriaLabel={(value) => (es ? `Quitar ${value}` : `Remove ${value}`)}
                        justAdded={businessTypeAddedConfirmation.visible}
                        addedLabel={es ? "Añadido" : "Added"}
                      />
                    </FieldBlock>
                  ) : null}
                </div>
              </section>
            )}

            {activeSection === "zona" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="zona">
                <h2 className={SECTION_TITLE}>{es ? "Zona" : "Area"}</h2>
                <div className="mt-5 space-y-5">
                  <FieldBlock
                    fieldKey="cityDisplay"
                    es={es}
                    warning={
                      cityInvalid
                        ? es
                          ? "Selecciona una ciudad de la lista NorCal."
                          : "Select a city from the NorCal list."
                        : undefined
                    }
                  >
                    <CityAutocomplete
                      value={cityValue}
                      onChange={(v) => {
                        const synced = syncComidaLocalCityFromInput(v);
                        updateDraft(synced);
                        if (synced.cityCanonical) markTouched("city");
                      }}
                      onSelect={() => markTouched("city")}
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.cityDisplay, es).placeholder}
                      lang="es"
                      variant="light"
                      className={cx(INPUT, cityInvalid && INPUT_INVALID)}
                      stripInvalidOnBlur
                      invalid={cityInvalid}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="zoneNote" es={es}>
                    <input
                      className={INPUT}
                      value={draft.zoneNote}
                      onChange={(e) => updateDraft({ zoneNote: e.target.value })}
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.zoneNote, es).placeholder}
                      onBlur={() => markTouched("zoneNote")}
                    />
                  </FieldBlock>
                  {showCateringExtras ? (
                    <FieldBlock fieldKey="cateringServiceRadiusNote" es={es}>
                      <input
                        className={INPUT}
                        value={draft.cateringServiceRadiusNote}
                        onChange={(e) => updateDraft({ cateringServiceRadiusNote: e.target.value })}
                        placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.cateringServiceRadiusNote, es).placeholder}
                      />
                    </FieldBlock>
                  ) : null}
                </div>
              </section>
            )}

            {activeSection === "que-vendes" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="que-vendes">
                <h2 className={SECTION_TITLE}>{es ? "Qué vendes" : "What you sell"}</h2>
                <div className="mt-5 space-y-5">
                  {sellerCategory === "catering" ? (
                    <SellerTypeBanner
                      text={
                        es
                          ? "Para catering, usa «Información de eventos» abajo para tamaños de evento, mínimos y anticipación. Agrega tu formulario de cotización en «Enlaces adicionales» (sección Contacto)."
                          : "For catering, use “Event information” below for event sizes, minimums, and lead time. Add your quote form under “Additional links” (Contact section)."
                      }
                    />
                  ) : null}
                  {showChefPrivadoBanner ? (
                    <SellerTypeBanner
                      text={
                        es
                          ? "Como chef privado, describe tus servicios de reservación/consulta y usa el «Enlace de pedidos o contacto» (sección Encuéntrame Hoy) para que agenden contigo."
                          : "As a private chef, describe your booking/consultation services and use the “Order or contact link” (Find Me Today section) so people can book with you."
                      }
                    />
                  ) : null}
                  {sellerCategory === "meal_prep" ? (
                    <SellerTypeBanner
                      text={
                        es
                          ? "Para meal prep, describe tu menú semanal. Usa «Frecuencia del meal prep» y «Enlace de pedidos de meal prep» abajo para cómo y cuándo ordenar."
                          : "For meal prep, describe your weekly menu. Use “Meal prep schedule” and “Meal prep order link” below for how and when to order."
                      }
                    />
                  ) : null}
                  {showBakeryBanner ? (
                    <SellerTypeBanner
                      text={
                        es
                          ? "Como panadería/repostería, menciona si haces pedidos por encargo (pasteles, eventos), con cuánta anticipación y si atiendes alergias/restricciones."
                          : "As a bakery/dessert shop, mention whether you take custom orders (cakes, events), how much notice you need, and any allergy/dietary accommodations."
                      }
                    />
                  ) : null}
                  <FieldBlock fieldKey="queVendes" es={es}>
                    <textarea
                      className={cx(INPUT, "min-h-[120px] resize-y")}
                      value={draft.queVendes}
                      onChange={(e) => updateDraft({ queVendes: e.target.value })}
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.queVendes, es).placeholder}
                      rows={5}
                    />
                  </FieldBlock>
                  {showCateringExtras ? (
                    <FieldBlock fieldKey="cateringEventInfoNote" es={es}>
                      <textarea
                        className={cx(INPUT, "min-h-[90px] resize-y")}
                        value={draft.cateringEventInfoNote}
                        onChange={(e) => updateDraft({ cateringEventInfoNote: e.target.value })}
                        placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.cateringEventInfoNote, es).placeholder}
                        rows={3}
                      />
                    </FieldBlock>
                  ) : null}
                  {showMealPrepExtras ? (
                    <FieldBlock fieldKey="mealPrepOrderUrl" es={es}>
                      <input
                        className={INPUT}
                        value={draft.mealPrepOrderUrl}
                        onChange={(e) => updateDraft({ mealPrepOrderUrl: e.target.value })}
                        placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.mealPrepOrderUrl, es).placeholder}
                      />
                    </FieldBlock>
                  ) : null}
                </div>
              </section>
            )}

            {activeSection === "contacto" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="contacto">
                <h2 className={SECTION_TITLE}>{es ? "Contacto" : "Contact"}</h2>
                <div className="mt-5 space-y-5">
                  <FieldBlock fieldKey="phone" es={es}>
                    <PhoneInput
                      className={INPUT}
                      value={draft.phone}
                      onChange={(next) => updateDraft({ phone: next })}
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.phone, es).placeholder}
                      autoComplete="tel"
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="whatsapp" es={es}>
                    <input
                      className={INPUT}
                      type="tel"
                      inputMode="tel"
                      value={draft.whatsapp}
                      onChange={(e) =>
                        updateDraft({ whatsapp: formatComidaLocalPhoneInput(e.target.value) })
                      }
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.whatsapp, es).placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="email" es={es}>
                    <input
                      className={INPUT}
                      type="email"
                      inputMode="email"
                      value={draft.email}
                      onChange={(e) => updateDraft({ email: e.target.value })}
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.email, es).placeholder}
                      autoComplete="email"
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="instagramUrl" es={es} warning={socialWarning("instagram", draft.instagramUrl)}>
                    <input
                      className={cx(INPUT, SOCIAL_ACCENT.instagram)}
                      value={draft.instagramUrl}
                      onChange={(e) => updateDraft({ instagramUrl: e.target.value })}
                      onBlur={() => handleSocialBlur("instagram", "instagramUrl")}
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.instagramUrl, es).placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="facebookUrl" es={es} warning={socialWarning("facebook", draft.facebookUrl)}>
                    <input
                      className={cx(INPUT, SOCIAL_ACCENT.facebook)}
                      value={draft.facebookUrl}
                      onChange={(e) => updateDraft({ facebookUrl: e.target.value })}
                      onBlur={() => handleSocialBlur("facebook", "facebookUrl")}
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.facebookUrl, es).placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="tiktokUrl" es={es} warning={socialWarning("tiktok", draft.tiktokUrl)}>
                    <input
                      className={cx(INPUT, SOCIAL_ACCENT.tiktok)}
                      value={draft.tiktokUrl}
                      onChange={(e) => updateDraft({ tiktokUrl: e.target.value })}
                      onBlur={() => handleSocialBlur("tiktok", "tiktokUrl")}
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.tiktokUrl, es).placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="additionalWebsites" es={es}>
                    <div className="space-y-2">
                      {draft.additionalWebsites.map((site, i) => (
                        <div key={i} className="flex flex-col gap-2 sm:flex-row">
                          <input
                            className={cx(INPUT, "sm:w-40")}
                            value={site.label}
                            onChange={(e) => {
                              const next = draft.additionalWebsites.slice();
                              next[i] = { ...next[i], label: e.target.value };
                              updateDraft({ additionalWebsites: next });
                            }}
                            placeholder={es ? "Ej. Menú" : "e.g. Menu"}
                          />
                          <input
                            className={cx(INPUT, "flex-1")}
                            value={site.url}
                            onChange={(e) => {
                              const next = draft.additionalWebsites.slice();
                              next[i] = { ...next[i], url: e.target.value };
                              updateDraft({ additionalWebsites: next });
                            }}
                            placeholder="https://…"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft({
                                additionalWebsites: draft.additionalWebsites.filter((_, j) => j !== i),
                              })
                            }
                            className="shrink-0 rounded-lg border border-[#D4C4A8] px-3 py-2 text-xs font-medium text-[#7A1E2C] hover:border-[#7A1E2C]/40"
                          >
                            {es ? "Quitar" : "Remove"}
                          </button>
                        </div>
                      ))}
                      {draft.additionalWebsites.length < 6 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              updateDraft({
                                additionalWebsites: [...draft.additionalWebsites, { label: "", url: "" }],
                              });
                              additionalWebsiteAddedConfirmation.flash();
                            }}
                            className="rounded-lg border border-dashed border-[#D4C4A8] px-3 py-2 text-xs font-medium text-[#1E1814]/70 hover:border-[#7A1E2C]/40"
                          >
                            {es ? "+ Agregar enlace" : "+ Add link"}
                          </button>
                          <AddedConfirmationBadge
                            visible={additionalWebsiteAddedConfirmation.visible}
                            label={es ? "Enlace añadido" : "Link added"}
                          />
                        </div>
                      ) : null}
                    </div>
                  </FieldBlock>
                </div>
              </section>
            )}

            {activeSection === "ubicacion" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="ubicacion">
                <h2 className={SECTION_TITLE}>{es ? "Encuéntrame Hoy" : "Find Me Today"}</h2>
                <p className="mt-1 text-xs text-[#1E1814]/55">
                  {es
                    ? "Dónde estás hoy, tu disponibilidad y cómo pueden recibir la comida. Tu dirección fija va aparte y es privada por defecto."
                    : "Where you are today, your availability, and how people can get your food. Your fixed address is separate and private by default."}
                </p>
                <div className="mt-5 space-y-5">
                  {sellerCategory === "mobile" ? (
                    <SellerTypeBanner
                      text={
                        draft.businessType === "delivery_only"
                          ? es
                            ? "Como negocio de solo entrega, no necesitas una ubicación pública fija — usa el «Enlace de pedidos o contacto» abajo para que te encuentren."
                            : "As a delivery-only business, you don't need a fixed public location — use the “Order or contact link” below so people can find you."
                          : isEventOrMarketSeller
                            ? es
                              ? "Como vendedor de eventos/mercados, agrega la fecha y lugar de tu próximo evento abajo, además de «Encuéntrame hoy»."
                              : "As an event/market seller, add your next event's date and location below, in addition to “Find me today.”"
                            : es
                              ? "Como vendedor móvil, «Encuéntrame hoy» es tu herramienta principal — complétalo cada vez que cambies de lugar."
                              : "As a mobile seller, “Find me today” is your main tool — fill it in every time you move."
                      }
                    />
                  ) : null}
                  <FieldBlock fieldKey="locationNote" es={es}>
                    <textarea
                      className={cx(INPUT, "min-h-[80px] resize-y")}
                      value={draft.locationNote}
                      onChange={(e) => updateDraft({ locationNote: e.target.value })}
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.locationNote, es).placeholder}
                      rows={3}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="locationUrl" es={es} warning={locationUrlWarning}>
                    <input
                      className={cx(INPUT, locationUrlWarning && INPUT_INVALID)}
                      value={draft.locationUrl}
                      onChange={(e) => updateDraft({ locationUrl: e.target.value })}
                      onBlur={handleLocationUrlBlur}
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.locationUrl, es).placeholder}
                    />
                  </FieldBlock>
                  {showMobileOrderLink ? (
                    <FieldBlock fieldKey="mobileOrderLinkUrl" es={es}>
                      <input
                        className={INPUT}
                        value={draft.mobileOrderLinkUrl}
                        onChange={(e) => updateDraft({ mobileOrderLinkUrl: e.target.value })}
                        placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.mobileOrderLinkUrl, es).placeholder}
                      />
                    </FieldBlock>
                  ) : null}
                  {showEventScheduleNote ? (
                    <FieldBlock fieldKey="eventScheduleNote" es={es}>
                      <input
                        className={INPUT}
                        value={draft.eventScheduleNote}
                        onChange={(e) => updateDraft({ eventScheduleNote: e.target.value })}
                        placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.eventScheduleNote, es).placeholder}
                      />
                    </FieldBlock>
                  ) : null}
                  <FieldBlock fieldKey="availabilityNote" es={es}>
                    <input
                      className={INPUT}
                      value={draft.availabilityNote}
                      onChange={(e) => updateDraft({ availabilityNote: e.target.value })}
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.availabilityNote, es).placeholder}
                    />
                  </FieldBlock>
                  <div className="space-y-1.5">
                    <label className={LABEL}>
                      {es ? "Horario semanal" : "Weekly hours"}
                      <span className="ml-1 font-normal normal-case text-[#1E1814]/45">
                        {es ? "(opcional)" : "(optional)"}
                      </span>
                    </label>
                    <HoursEditor
                      days={hoursDays}
                      closedLabel={es ? "Cerrado" : "Closed"}
                      onDayChange={(key, next) =>
                        updateDraft({
                          weeklyHours: { ...draft.weeklyHours, [key]: next },
                        })
                      }
                    />
                    <p className={HELPER}>
                      {es
                        ? "Opcional y aparte de «Encuéntrame hoy». Déjalo vacío si tu horario cambia todo el tiempo."
                        : "Optional and separate from “Find me today.” Leave it blank if your schedule changes constantly."}
                    </p>
                  </div>
                  {showMealPrepExtras ? (
                    <FieldBlock fieldKey="mealPrepScheduleNote" es={es}>
                      <input
                        className={INPUT}
                        value={draft.mealPrepScheduleNote}
                        onChange={(e) => updateDraft({ mealPrepScheduleNote: e.target.value })}
                        placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.mealPrepScheduleNote, es).placeholder}
                      />
                    </FieldBlock>
                  ) : null}
                  <FieldBlock fieldKey="serviceOptions" es={es}>
                    <div className="flex flex-wrap gap-2">
                      {COMIDA_LOCAL_SERVICE_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={
                            draft.serviceOptions.includes(o.value) ? CHIP_ON : CHIP_OFF
                          }
                          onClick={() =>
                            updateDraft({
                              serviceOptions: toggleInList(
                                draft.serviceOptions,
                                o.value as ComidaLocalServiceOption
                              ),
                            })
                          }
                        >
                          {es ? o.labelEs : o.labelEn}
                        </button>
                      ))}
                    </div>
                  </FieldBlock>
                  {showServiceOptionOther ? (
                    <FieldBlock fieldKey="serviceOptionOtherCustom" es={es}>
                      <CustomChipListField
                        values={draft.serviceOptionOtherCustomValues}
                        inputValue={serviceOptionOtherInput}
                        onInputChange={setServiceOptionOtherInput}
                        onAdd={addServiceOptionOtherValue}
                        onRemove={removeServiceOptionOtherValue}
                        placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.serviceOptionOtherCustom, es).placeholder}
                        addLabel={es ? "Agregar" : "Add"}
                        removeAriaLabel={(value) => (es ? `Quitar ${value}` : `Remove ${value}`)}
                        justAdded={serviceOptionOtherAddedConfirmation.visible}
                        addedLabel={es ? "Añadido" : "Added"}
                      />
                    </FieldBlock>
                  ) : null}
                  {sellerCategory === "home_kitchen" ? (
                    <SellerTypeBanner
                      text={
                        es
                          ? "Como cocina en casa, tu dirección se mantiene privada a menos que actives mostrarla abajo. Solo tu ciudad/zona es pública por defecto."
                          : "As a home kitchen, your address stays private unless you turn on showing it below. Only your city/zone is public by default."
                      }
                    />
                  ) : null}
                  <FieldBlock fieldKey="businessAddressLine" es={es}>
                    <input
                      className={INPUT}
                      value={draft.businessAddressLine}
                      onChange={(e) => updateDraft({ businessAddressLine: e.target.value })}
                      placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.businessAddressLine, es).placeholder}
                    />
                  </FieldBlock>
                  {draft.businessAddressLine.trim() ? (
                    <FieldBlock fieldKey="showAddressPublicly" es={es}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={draft.showAddressPublicly}
                        onClick={() => updateDraft({ showAddressPublicly: !draft.showAddressPublicly })}
                        className={draft.showAddressPublicly ? CHIP_ON : CHIP_OFF}
                      >
                        {draft.showAddressPublicly
                          ? es
                            ? "Sí, mostrar dirección"
                            : "Yes, show address"
                          : es
                            ? "No, mantener privada"
                            : "No, keep private"}
                      </button>
                    </FieldBlock>
                  ) : null}
                </div>
              </section>
            )}

            {activeSection === "extras" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="extras">
                {/* "Extras" is intentionally identical in both languages — a real shared word, not an untranslated string. */}
                <h2 className={SECTION_TITLE}>Extras</h2>
                <div className="mt-5 space-y-5">
                  <FieldBlock fieldKey="paymentMethods" es={es}>
                    <div className="flex flex-wrap gap-2">
                      {COMIDA_LOCAL_PAYMENT_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={
                            draft.paymentMethods.includes(o.value) ? CHIP_ON : CHIP_OFF
                          }
                          onClick={() =>
                            updateDraft({
                              paymentMethods: toggleInList(
                                draft.paymentMethods,
                                o.value as ComidaLocalPaymentMethod
                              ),
                            })
                          }
                        >
                          {es ? o.labelEs : o.labelEn}
                        </button>
                      ))}
                    </div>
                  </FieldBlock>
                  {showPaymentOther ? (
                    <FieldBlock fieldKey="paymentOtherNote" es={es}>
                      <input
                        className={INPUT}
                        value={draft.paymentOtherNote}
                        onChange={(e) => updateDraft({ paymentOtherNote: e.target.value })}
                        placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.paymentOtherNote, es).placeholder}
                      />
                    </FieldBlock>
                  ) : null}
                  <FieldBlock fieldKey="priceLevel" es={es}>
                    <div className="flex flex-wrap gap-2">
                      {COMIDA_LOCAL_PRICE_LEVEL_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={draft.priceLevel === o.value ? CHIP_ON : CHIP_OFF}
                          onClick={() =>
                            updateDraft({
                              priceLevel:
                                draft.priceLevel === o.value
                                  ? ""
                                  : (o.value as ComidaLocalPriceLevel),
                            })
                          }
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </FieldBlock>
                  <FieldBlock fieldKey="languages" es={es}>
                    <LanguagesInput
                      options={COMIDA_LOCAL_LANGUAGE_OPTIONS.map((o) => ({
                        key: o.value,
                        label: es ? o.labelEs : o.labelEn,
                      }))}
                      selectedKeys={draft.languages}
                      onToggle={(key) =>
                        updateDraft({
                          languages: toggleInList(
                            draft.languages,
                            key as ComidaLocalLanguageOption
                          ),
                        })
                      }
                      otherKey="otro"
                      customValues={draft.customLanguages}
                      customInputValue={customLanguageInput}
                      onCustomInputChange={setCustomLanguageInput}
                      onAddCustom={() => {
                        const value = customLanguageInput.trim();
                        if (!value) return;
                        if (isDuplicateComidaLocalCustomLanguage(value, draft.customLanguages)) {
                          setCustomLanguageInput("");
                          return;
                        }
                        updateDraft({ customLanguages: [...draft.customLanguages, value] });
                        setCustomLanguageInput("");
                        customLanguageAddedConfirmation.flash();
                      }}
                      onRemoveCustom={(index) =>
                        updateDraft({
                          customLanguages: draft.customLanguages.filter((_, i) => i !== index),
                        })
                      }
                      labels={{
                        otherLabel: es ? "Otro idioma" : "Other language",
                        otherPlaceholder: es ? "Ej. mixteco" : "e.g. Mixtec",
                        add: es ? "Agregar" : "Add",
                        removeAria: (value) => (es ? `Quitar ${value}` : `Remove ${value}`),
                      }}
                    />
                    <AddedConfirmationBadge
                      visible={customLanguageAddedConfirmation.visible}
                      label={es ? "Idioma añadido" : "Language added"}
                      className="mt-2"
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="highlights" es={es}>
                    <div className="flex flex-wrap gap-2">
                      {COMIDA_LOCAL_HIGHLIGHT_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={
                            draft.highlights.includes(o.value) ? CHIP_ON : CHIP_OFF
                          }
                          onClick={() =>
                            updateDraft({
                              highlights: toggleInList(
                                draft.highlights,
                                o.value as ComidaLocalHighlightOption
                              ),
                            })
                          }
                        >
                          {es ? o.labelEs : o.labelEn}
                        </button>
                      ))}
                    </div>
                  </FieldBlock>
                  <p className="text-xs italic leading-relaxed text-[#1E1814]/55">
                    {es ? COMIDA_LOCAL_HIGHLIGHTS_DISCLAIMER.es : COMIDA_LOCAL_HIGHLIGHTS_DISCLAIMER.en}
                  </p>
                  {showHighlightsOther ? (
                    <FieldBlock fieldKey="highlightsOtherCustom" es={es}>
                      <CustomChipListField
                        values={draft.highlightsOtherCustomValues}
                        inputValue={highlightsOtherInput}
                        onInputChange={setHighlightsOtherInput}
                        onAdd={addHighlightsOtherValue}
                        onRemove={removeHighlightsOtherValue}
                        placeholder={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.highlightsOtherCustom, es).placeholder}
                        addLabel={es ? "Agregar" : "Add"}
                        removeAriaLabel={(value) => (es ? `Quitar ${value}` : `Remove ${value}`)}
                        justAdded={highlightsOtherAddedConfirmation.visible}
                        addedLabel={es ? "Añadido" : "Added"}
                      />
                    </FieldBlock>
                  ) : null}
                </div>
              </section>
            )}

            {activeSection === "fotos" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="fotos">
                <h2 className={SECTION_TITLE}>{es ? "Fotos" : "Photos"}</h2>
                <p className="mt-2 text-xs text-[#1E1814]/60">
                  {shellCopy.photosDeferredNote}
                </p>
                <div className="mt-5 space-y-6">
                  <ComidaLocalImageUploadField
                    role="main"
                    label={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.mainPhoto, es).label}
                    helper={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.mainPhoto, es).helper}
                    draftListingId={draft.draftListingId}
                    image={draft.mainPhoto}
                    onImageChange={(mainPhoto) => updateDraft({ mainPhoto })}
                    es={es}
                  />
                  <ComidaLocalImageUploadField
                    role="logo"
                    label={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.logoImage, es).label}
                    helper={resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.logoImage, es).helper}
                    optional
                    draftListingId={draft.draftListingId}
                    image={draft.logoImage}
                    minHeightClass="min-h-[100px]"
                    onImageChange={(logoImage) => updateDraft({ logoImage })}
                    es={es}
                  />
                  <ComidaLocalGalleryUpload
                    draftListingId={draft.draftListingId}
                    images={draft.galleryImages}
                    onChange={(galleryImages) =>
                      updateDraft({ galleryImages: galleryImages.slice(0, COMIDA_LOCAL_GALLERY_MAX) })
                    }
                    es={es}
                  />
                </div>
              </section>
            )}

            {publishError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                {publishError}
              </div>
            ) : null}

            {publishSuccess ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
                <p className="font-semibold">
                  {editListingId
                    ? es
                      ? "Cambios guardados en tu anuncio."
                      : "Changes saved to your listing."
                    : shellCopy.publishSuccessTitle}
                </p>
                <p className="mt-1 text-emerald-900/90">
                  {editListingId
                    ? es
                      ? "Se actualizó el mismo anuncio publicado — mismo ID Leonix, misma dirección pública."
                      : "The same published listing was updated — same Leonix ID, same public address."
                    : shellCopy.publishSuccessBody}
                </p>
                {publishSuccess.leonixAdId ? (
                  <p className="mt-2 text-xs text-emerald-800/90">
                    {es ? "ID Leonix" : "Leonix ID"}:{" "}
                    <span className="font-mono font-medium">{publishSuccess.leonixAdId}</span>
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={comidaLocalHubHref}
                    className="inline-flex rounded-lg border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
                  >
                    {shellCopy.publishSuccessViewResults}
                  </Link>
                  <Link
                    href={publishSuccess.publicPath}
                    className="inline-flex rounded-lg border border-emerald-600/60 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                  >
                    {shellCopy.publishSuccessViewListing}
                  </Link>
                </div>
              </div>
            ) : null}

            <div
              className={cx(
                CARD,
                "flex flex-col gap-4 border-[#D4C4A8]/70 bg-[#FDF8F0] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1E1814]">{es ? "Vista previa" : "Preview"}</p>
                <p className="mt-1 text-sm text-[#1E1814]/68">
                  {previewReady
                    ? es
                      ? "Revisa cómo se verá tu ficha antes de publicar."
                      : "Review how your listing will look before publishing."
                    : es
                      ? "Completa los campos de la guía «Para vista previa» para abrir la vista previa."
                      : "Complete the fields in the “For preview” checklist to open the preview."}
                </p>
                {!previewReady && previewIssues.length > 0 ? (
                  <ul className="mt-2 space-y-0.5 text-xs text-[#7A1E2C]/90">
                    {previewIssues.map((issue) => (
                      <li key={`cta-${issue.field}-${issue.message}`}>{issue.message}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {previewReady ? (
                <Link
                  href={comidaLocalPreviewHref}
                  onClick={markPublishFlowOpeningPreview}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#7A1E2C] bg-[#7A1E2C] px-5 py-2.5 text-sm font-semibold text-[#FFFCF7] hover:bg-[#6a1a26]"
                >
                  {shellCopy.viewPreview}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed shrink-0 rounded-xl bg-[#7A1E2C]/40 px-5 py-2.5 text-sm font-semibold text-[#FFFCF7]"
                  title={shellCopy.previewSoon}
                >
                  {shellCopy.viewPreview}
                </button>
              )}
            </div>

            {editListingId ? (
              <div
                className={cx(
                  CARD,
                  "flex flex-col gap-4 border-[#7A1E2C]/15 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1E1814]">
                    {es ? "Guardar cambios en tu anuncio" : "Save changes to your listing"}
                  </p>
                  <p className="mt-1 text-sm text-[#1E1814]/70">
                    {publishReady
                      ? es
                        ? "Se actualizará el mismo anuncio publicado — sin duplicados ni pagos."
                        : "The same published listing will be updated — no duplicates, no payments."
                      : es
                        ? "Completa los campos de «Lista para publicar» para habilitar el guardado."
                        : "Complete the “Ready to publish” fields to enable saving."}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!publishReady || publishBusy}
                  onClick={() => void handlePublish()}
                  className={cx(
                    "inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold",
                    publishReady && !publishBusy
                      ? "border border-[#7A1E2C] bg-[#7A1E2C] text-[#FFFCF7] hover:bg-[#6a1a26]"
                      : "cursor-not-allowed border border-[#7A1E2C]/30 bg-[#7A1E2C]/40 text-[#FFFCF7]"
                  )}
                >
                  {publishBusy
                    ? es
                      ? "Guardando…"
                      : "Saving…"
                    : es
                      ? "Guardar cambios"
                      : "Save changes"}
                </button>
              </div>
            ) : (
              // Gate D19 — no direct-publish bypass for a brand-new listing. The only path to
              // publish is Preview → PublishCheckoutCheckpoint → Stripe → webhook activation.
              <p className="px-1 text-center text-xs text-[#1E1814]/55">
                {es
                  ? "Publicar requiere pasar por la vista previa y el pago seguro."
                  : "Publishing requires going through preview and secure payment."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
