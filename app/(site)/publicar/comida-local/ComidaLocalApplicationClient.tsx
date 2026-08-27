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
  COMIDA_LOCAL_SHELL_COPY,
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
  children,
  warning,
}: {
  fieldKey: keyof typeof COMIDA_LOCAL_FIELD_COPY;
  children: ReactNode;
  warning?: string;
}) {
  const copy = COMIDA_LOCAL_FIELD_COPY[fieldKey];
  return (
    <div className="space-y-1.5">
      <label className={LABEL}>
        {copy.label}
        {copy.optional ? (
          <span className="ml-1 font-normal normal-case text-[#1E1814]/45">(opcional)</span>
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

function formatSavedAt(ts: number | null): string | null {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleTimeString("es-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return null;
  }
}

export default function ComidaLocalApplicationClient() {
  const searchParams = useSearchParams();
  const routeLang = normalizeLang(searchParams?.get("lang"));
  const es = routeLang !== "en";
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
  const { draft, setDraft, updateDraft, resetDraft, hasLoadedDraft, lastSavedAt } = useComidaLocalDraft({
    storageKey: editStorageKey,
  });

  useBusinessApplicationLeaveGuard({
    isDirty: hasLoadedDraft && Boolean(draft.businessName?.trim()),
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

  const previewIssues = useMemo(() => validateComidaLocalDraftForPreview(draft), [draft]);
  const publishIssues = useMemo(() => validateComidaLocalDraftForFuturePublish(draft), [draft]);
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
      return normalizeComidaLocalSocialInput(t, platform) ? undefined : "Enlace o usuario no válido para esta red.";
    },
    [touched]
  );

  const locationUrlWarning = useMemo(() => {
    const t = draft.locationUrl.trim();
    if (!t || !touched.locationUrl) return undefined;
    return isValidComidaLocalExternalUrl(t) ? undefined : "URL no válida.";
  }, [draft.locationUrl, touched.locationUrl]);

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
  const savedLabel = formatSavedAt(lastSavedAt);

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
        lang: "es",
        accessToken: token,
      });
      if (!res.ok || !data.ok) {
        const issueMsg = data.issues?.map((i) => i.message).filter(Boolean).join(" ");
        setPublishError(issueMsg || data.detail || data.error || COMIDA_LOCAL_SHELL_COPY.publishErrorGeneric);
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
      setPublishError(COMIDA_LOCAL_SHELL_COPY.publishErrorGeneric);
    } finally {
      setPublishBusy(false);
    }
  }, [draft, editHydration.status, editListingId, editStorageKey, publishBusy, publishReady]);

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
            {COMIDA_LOCAL_SHELL_COPY.pageTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#1E1814]/75">
            {COMIDA_LOCAL_SHELL_COPY.pageSubtitle}
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
              {COMIDA_LOCAL_SHELL_COPY.scaffoldNotice}
              {savedLabel ? ` · ${COMIDA_LOCAL_SHELL_COPY.draftSaved} (${savedLabel})` : null}
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
              {editListingId ? (es ? "Descartar cambios" : "Discard changes") : COMIDA_LOCAL_SHELL_COPY.resetDraft}
            </button>
          </div>
        </header>

        <div className="mb-6">
          <ComidaLocalValidationPanel
            previewIssues={previewIssues}
            publishIssues={publishIssues}
            publishReady={publishReady}
          />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <nav className="lg:w-52 lg:shrink-0" aria-label="Secciones del formulario">
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
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 flex-1 space-y-6">
            {activeSection === "identidad" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="identidad">
                <h2 className={SECTION_TITLE}>Identidad</h2>
                <div className="mt-5 space-y-5">
                  <FieldBlock fieldKey="businessName">
                    <input
                      className={INPUT}
                      value={draft.businessName}
                      onChange={(e) => updateDraft({ businessName: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.businessName.placeholder}
                      autoComplete="organization"
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="foodType">
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
                      <option value="">{COMIDA_LOCAL_FIELD_COPY.foodType.placeholder}</option>
                      {COMIDA_LOCAL_FOOD_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </FieldBlock>
                  {showFoodTypeCustom ? (
                    <FieldBlock fieldKey="foodTypeCustom">
                      <input
                        className={INPUT}
                        value={draft.foodTypeCustom}
                        onChange={(e) => updateDraft({ foodTypeCustom: e.target.value })}
                        placeholder={COMIDA_LOCAL_FIELD_COPY.foodTypeCustom.placeholder}
                      />
                    </FieldBlock>
                  ) : null}
                  <FieldBlock fieldKey="businessType">
                    <select
                      className={INPUT}
                      value={draft.businessType}
                      onChange={(e) =>
                        updateDraft({
                          businessType: e.target.value as ComidaLocalDraft["businessType"],
                          businessTypeCustom:
                            e.target.value === "otro" ? draft.businessTypeCustom : "",
                        })
                      }
                    >
                      <option value="">{COMIDA_LOCAL_FIELD_COPY.businessType.placeholder}</option>
                      {COMIDA_LOCAL_BUSINESS_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {es ? o.labelEs : o.labelEn}
                        </option>
                      ))}
                    </select>
                  </FieldBlock>
                  {showBusinessTypeCustom ? (
                    <FieldBlock fieldKey="businessTypeCustom">
                      <input
                        className={INPUT}
                        value={draft.businessTypeCustom}
                        onChange={(e) => updateDraft({ businessTypeCustom: e.target.value })}
                        placeholder={COMIDA_LOCAL_FIELD_COPY.businessTypeCustom.placeholder}
                      />
                    </FieldBlock>
                  ) : null}
                </div>
              </section>
            )}

            {activeSection === "zona" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="zona">
                <h2 className={SECTION_TITLE}>Zona</h2>
                <div className="mt-5 space-y-5">
                  <FieldBlock
                    fieldKey="cityDisplay"
                    warning={
                      cityInvalid ? "Selecciona una ciudad de la lista NorCal." : undefined
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
                      placeholder={COMIDA_LOCAL_FIELD_COPY.cityDisplay.placeholder}
                      lang="es"
                      variant="light"
                      className={cx(INPUT, cityInvalid && INPUT_INVALID)}
                      stripInvalidOnBlur
                      invalid={cityInvalid}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="zoneNote">
                    <input
                      className={INPUT}
                      value={draft.zoneNote}
                      onChange={(e) => updateDraft({ zoneNote: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.zoneNote.placeholder}
                      onBlur={() => markTouched("zoneNote")}
                    />
                  </FieldBlock>
                </div>
              </section>
            )}

            {activeSection === "que-vendes" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="que-vendes">
                <h2 className={SECTION_TITLE}>Qué vendes</h2>
                <div className="mt-5 space-y-5">
                  {sellerCategory === "catering" ? (
                    <SellerTypeBanner
                      text={
                        es
                          ? "Para catering, describe tamaños de evento, mínimos de pedido y con cuánta anticipación reservar. Agrega tu formulario de cotización en «Enlaces adicionales» (sección Contacto)."
                          : "For catering, describe event sizes, order minimums, and how much advance notice you need. Add your quote form under “Additional links” (Contact section)."
                      }
                    />
                  ) : null}
                  {sellerCategory === "meal_prep" ? (
                    <SellerTypeBanner
                      text={
                        es
                          ? "Para meal prep, describe tu menú semanal y cómo se ordena. Agrega tu enlace de pedidos en «Enlaces adicionales» (sección Contacto)."
                          : "For meal prep, describe your weekly menu and how to order. Add your order link under “Additional links” (Contact section)."
                      }
                    />
                  ) : null}
                  <FieldBlock fieldKey="queVendes">
                    <textarea
                      className={cx(INPUT, "min-h-[120px] resize-y")}
                      value={draft.queVendes}
                      onChange={(e) => updateDraft({ queVendes: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.queVendes.placeholder}
                      rows={5}
                    />
                  </FieldBlock>
                </div>
              </section>
            )}

            {activeSection === "contacto" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="contacto">
                <h2 className={SECTION_TITLE}>Contacto</h2>
                <div className="mt-5 space-y-5">
                  <FieldBlock fieldKey="phone">
                    <PhoneInput
                      className={INPUT}
                      value={draft.phone}
                      onChange={(next) => updateDraft({ phone: next })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.phone.placeholder}
                      autoComplete="tel"
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="whatsapp">
                    <input
                      className={INPUT}
                      type="tel"
                      inputMode="tel"
                      value={draft.whatsapp}
                      onChange={(e) =>
                        updateDraft({ whatsapp: formatComidaLocalPhoneInput(e.target.value) })
                      }
                      placeholder={COMIDA_LOCAL_FIELD_COPY.whatsapp.placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="email">
                    <input
                      className={INPUT}
                      type="email"
                      inputMode="email"
                      value={draft.email}
                      onChange={(e) => updateDraft({ email: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.email.placeholder}
                      autoComplete="email"
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="instagramUrl" warning={socialWarning("instagram", draft.instagramUrl)}>
                    <input
                      className={cx(INPUT, SOCIAL_ACCENT.instagram)}
                      value={draft.instagramUrl}
                      onChange={(e) => updateDraft({ instagramUrl: e.target.value })}
                      onBlur={() => handleSocialBlur("instagram", "instagramUrl")}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.instagramUrl.placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="facebookUrl" warning={socialWarning("facebook", draft.facebookUrl)}>
                    <input
                      className={cx(INPUT, SOCIAL_ACCENT.facebook)}
                      value={draft.facebookUrl}
                      onChange={(e) => updateDraft({ facebookUrl: e.target.value })}
                      onBlur={() => handleSocialBlur("facebook", "facebookUrl")}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.facebookUrl.placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="tiktokUrl" warning={socialWarning("tiktok", draft.tiktokUrl)}>
                    <input
                      className={cx(INPUT, SOCIAL_ACCENT.tiktok)}
                      value={draft.tiktokUrl}
                      onChange={(e) => updateDraft({ tiktokUrl: e.target.value })}
                      onBlur={() => handleSocialBlur("tiktok", "tiktokUrl")}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.tiktokUrl.placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="additionalWebsites">
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
                            placeholder="Ej. Menú"
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
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft({
                              additionalWebsites: [...draft.additionalWebsites, { label: "", url: "" }],
                            })
                          }
                          className="rounded-lg border border-dashed border-[#D4C4A8] px-3 py-2 text-xs font-medium text-[#1E1814]/70 hover:border-[#7A1E2C]/40"
                        >
                          {es ? "+ Agregar enlace" : "+ Add link"}
                        </button>
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
                        es
                          ? "Como vendedor móvil, «Encuéntrame hoy» es tu herramienta principal — complétalo cada vez que cambies de lugar."
                          : "As a mobile seller, “Find me today” is your main tool — fill it in every time you move."
                      }
                    />
                  ) : null}
                  <FieldBlock fieldKey="locationNote">
                    <textarea
                      className={cx(INPUT, "min-h-[80px] resize-y")}
                      value={draft.locationNote}
                      onChange={(e) => updateDraft({ locationNote: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.locationNote.placeholder}
                      rows={3}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="locationUrl" warning={locationUrlWarning}>
                    <input
                      className={cx(INPUT, locationUrlWarning && INPUT_INVALID)}
                      value={draft.locationUrl}
                      onChange={(e) => updateDraft({ locationUrl: e.target.value })}
                      onBlur={handleLocationUrlBlur}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.locationUrl.placeholder}
                    />
                  </FieldBlock>
                  <FieldBlock fieldKey="availabilityNote">
                    <input
                      className={INPUT}
                      value={draft.availabilityNote}
                      onChange={(e) => updateDraft({ availabilityNote: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.availabilityNote.placeholder}
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
                  <FieldBlock fieldKey="serviceOptions">
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
                    <FieldBlock fieldKey="serviceOptionOtherCustom">
                      <input
                        className={INPUT}
                        value={draft.serviceOptionOtherCustom}
                        onChange={(e) => updateDraft({ serviceOptionOtherCustom: e.target.value })}
                        placeholder={COMIDA_LOCAL_FIELD_COPY.serviceOptionOtherCustom.placeholder}
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
                  <FieldBlock fieldKey="businessAddressLine">
                    <input
                      className={INPUT}
                      value={draft.businessAddressLine}
                      onChange={(e) => updateDraft({ businessAddressLine: e.target.value })}
                      placeholder={COMIDA_LOCAL_FIELD_COPY.businessAddressLine.placeholder}
                    />
                  </FieldBlock>
                  {draft.businessAddressLine.trim() ? (
                    <FieldBlock fieldKey="showAddressPublicly">
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
                <h2 className={SECTION_TITLE}>Extras</h2>
                <div className="mt-5 space-y-5">
                  <FieldBlock fieldKey="paymentMethods">
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
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </FieldBlock>
                  {showPaymentOther ? (
                    <FieldBlock fieldKey="paymentOtherNote">
                      <input
                        className={INPUT}
                        value={draft.paymentOtherNote}
                        onChange={(e) => updateDraft({ paymentOtherNote: e.target.value })}
                        placeholder={COMIDA_LOCAL_FIELD_COPY.paymentOtherNote.placeholder}
                      />
                    </FieldBlock>
                  ) : null}
                  <FieldBlock fieldKey="priceLevel">
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
                  <FieldBlock fieldKey="languages">
                    <LanguagesInput
                      options={COMIDA_LOCAL_LANGUAGE_OPTIONS.map((o) => ({
                        key: o.value,
                        label: o.label,
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
                        updateDraft({ customLanguages: [...draft.customLanguages, value] });
                        setCustomLanguageInput("");
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
                  </FieldBlock>
                  <FieldBlock fieldKey="highlights">
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
                  {showHighlightsOther ? (
                    <FieldBlock fieldKey="highlightsOtherCustom">
                      <input
                        className={INPUT}
                        value={draft.highlightsOtherCustom}
                        onChange={(e) => updateDraft({ highlightsOtherCustom: e.target.value })}
                        placeholder={COMIDA_LOCAL_FIELD_COPY.highlightsOtherCustom.placeholder}
                      />
                    </FieldBlock>
                  ) : null}
                </div>
              </section>
            )}

            {activeSection === "fotos" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="fotos">
                <h2 className={SECTION_TITLE}>Fotos</h2>
                <p className="mt-2 text-xs text-[#1E1814]/60">
                  {COMIDA_LOCAL_SHELL_COPY.photosDeferredNote}
                </p>
                <div className="mt-5 space-y-6">
                  <ComidaLocalImageUploadField
                    role="main"
                    label={COMIDA_LOCAL_FIELD_COPY.mainPhoto.label}
                    helper={COMIDA_LOCAL_FIELD_COPY.mainPhoto.helper}
                    draftListingId={draft.draftListingId}
                    image={draft.mainPhoto}
                    onImageChange={(mainPhoto) => updateDraft({ mainPhoto })}
                  />
                  <ComidaLocalImageUploadField
                    role="logo"
                    label={COMIDA_LOCAL_FIELD_COPY.logoImage.label}
                    helper={COMIDA_LOCAL_FIELD_COPY.logoImage.helper}
                    optional
                    draftListingId={draft.draftListingId}
                    image={draft.logoImage}
                    minHeightClass="min-h-[100px]"
                    onImageChange={(logoImage) => updateDraft({ logoImage })}
                  />
                  <ComidaLocalGalleryUpload
                    draftListingId={draft.draftListingId}
                    images={draft.galleryImages}
                    onChange={(galleryImages) =>
                      updateDraft({ galleryImages: galleryImages.slice(0, COMIDA_LOCAL_GALLERY_MAX) })
                    }
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
                    : COMIDA_LOCAL_SHELL_COPY.publishSuccessTitle}
                </p>
                <p className="mt-1 text-emerald-900/90">
                  {editListingId
                    ? es
                      ? "Se actualizó el mismo anuncio publicado — mismo ID Leonix, misma dirección pública."
                      : "The same published listing was updated — same Leonix ID, same public address."
                    : COMIDA_LOCAL_SHELL_COPY.publishSuccessBody}
                </p>
                {publishSuccess.leonixAdId ? (
                  <p className="mt-2 text-xs text-emerald-800/90">
                    ID Leonix:{" "}
                    <span className="font-mono font-medium">{publishSuccess.leonixAdId}</span>
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={comidaLocalHubHref}
                    className="inline-flex rounded-lg border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
                  >
                    {COMIDA_LOCAL_SHELL_COPY.publishSuccessViewResults}
                  </Link>
                  <Link
                    href={publishSuccess.publicPath}
                    className="inline-flex rounded-lg border border-emerald-600/60 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                  >
                    {COMIDA_LOCAL_SHELL_COPY.publishSuccessViewListing}
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
                <p className="text-sm font-medium text-[#1E1814]">Vista previa</p>
                <p className="mt-1 text-sm text-[#1E1814]/68">
                  {previewReady
                    ? "Revisa cómo se verá tu ficha antes de publicar."
                    : "Completa los campos de la guía «Para vista previa» para abrir la vista previa."}
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
                  {COMIDA_LOCAL_SHELL_COPY.viewPreview}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed shrink-0 rounded-xl bg-[#7A1E2C]/40 px-5 py-2.5 text-sm font-semibold text-[#FFFCF7]"
                  title={COMIDA_LOCAL_SHELL_COPY.previewSoon}
                >
                  {COMIDA_LOCAL_SHELL_COPY.viewPreview}
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
