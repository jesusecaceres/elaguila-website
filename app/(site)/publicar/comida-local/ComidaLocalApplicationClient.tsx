"use client";

import CityAutocomplete from "@/app/components/CityAutocomplete";
import Link from "next/link";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { postComidaLocalPublishApi } from "@/app/lib/clasificados/comida-local/comidaLocalPublishClient";
import { saveComidaLocalDraftToStorage } from "@/app/lib/clasificados/comida-local/comidaLocalDraftPersistence";
import {
  COMIDA_LOCAL_FOOD_TYPE_OPTIONS,
  COMIDA_LOCAL_GALLERY_MAX,
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
const CARD = "rounded-2xl border border-[#D4C4A8]/80 bg-[#FFFCF7] shadow-sm";
const INPUT =
  "w-full rounded-xl border border-[#D4C4A8]/90 bg-white px-3 py-2.5 text-sm text-[#1E1814] placeholder:text-[#1E1814]/40 focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/25";
const INPUT_INVALID = "border-red-400/80 focus:ring-red-300/40";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/70";
const HELPER = "mt-1 text-xs leading-relaxed text-[#1E1814]/60";
const INLINE_WARN = "mt-1 text-xs text-red-700";
const SECTION_TITLE = "text-lg font-semibold text-[#1E1814]";
const CHIP_ON =
  "rounded-lg border border-[#7A1E2C] bg-[#7A1E2C]/10 px-3 py-1.5 text-sm font-medium text-[#7A1E2C]";
const CHIP_OFF =
  "rounded-lg border border-[#D4C4A8] bg-white px-3 py-1.5 text-sm text-[#1E1814]/80 hover:border-[#7A1E2C]/40";

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

function formatSavedAt(ts: number | null): string | null {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleTimeString("es-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return null;
  }
}

export default function ComidaLocalApplicationClient() {
  const { draft, updateDraft, resetDraft, hasLoadedDraft, lastSavedAt } = useComidaLocalDraft();
  const [activeSection, setActiveSection] = useState<ComidaLocalSectionKey>("identidad");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccessPath, setPublishSuccessPath] = useState<string | null>(null);

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

  const cityValue = draft.cityDisplay || draft.cityCanonical;
  const cityInvalid =
    touched.city &&
    Boolean(cityValue.trim()) &&
    !syncComidaLocalCityFromInput(cityValue).cityCanonical;

  const showFoodTypeCustom = draft.foodType === "otro";
  const showPaymentOther = draft.paymentMethods.includes("other");
  const savedLabel = formatSavedAt(lastSavedAt);

  const handlePublish = useCallback(async () => {
    if (!publishReady || publishBusy) return;
    setPublishError(null);
    setPublishSuccessPath(null);
    setPublishBusy(true);
    try {
      saveComidaLocalDraftToStorage(draft);
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
        setPublishSuccessPath(data.publicPath);
      }
    } catch {
      setPublishError(COMIDA_LOCAL_SHELL_COPY.publishErrorGeneric);
    } finally {
      setPublishBusy(false);
    }
  }, [draft, publishBusy, publishReady]);

  if (!hasLoadedDraft) {
    return (
      <div className={cx("min-h-screen", PAGE_BG)}>
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-[#1E1814]/60">
          Cargando borrador…
        </div>
      </div>
    );
  }

  return (
    <div className={cx("min-h-screen", PAGE_BG)}>
      <div className="mx-auto max-w-6xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <header className="mb-8 border-b border-[#D4C4A8]/60 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A1E2C]">
            Leonix Clasificados · {COMIDA_LOCAL_PRODUCT_NAME}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#1E1814] sm:text-3xl">
            {COMIDA_LOCAL_SHELL_COPY.pageTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#1E1814]/75">
            {COMIDA_LOCAL_SHELL_COPY.pageSubtitle}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-3 py-2 text-xs text-[#1E1814]/70">
              {COMIDA_LOCAL_SHELL_COPY.scaffoldNotice}
              {savedLabel ? ` · ${COMIDA_LOCAL_SHELL_COPY.draftSaved} (${savedLabel})` : null}
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("¿Borrar el borrador guardado en este dispositivo?")) {
                  resetDraft();
                  setTouched({});
                }
              }}
              className="text-xs font-medium text-[#7A1E2C] underline-offset-2 hover:underline"
            >
              {COMIDA_LOCAL_SHELL_COPY.resetDraft}
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
                <div className="mt-5">
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
                    <input
                      className={INPUT}
                      type="tel"
                      inputMode="tel"
                      value={draft.phone}
                      onChange={(e) =>
                        updateDraft({ phone: formatComidaLocalPhoneInput(e.target.value) })
                      }
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
                </div>
              </section>
            )}

            {activeSection === "ubicacion" && (
              <section className={cx(CARD, "p-5 sm:p-6")} id="ubicacion">
                <h2 className={SECTION_TITLE}>Ubicación y disponibilidad</h2>
                <div className="mt-5 space-y-5">
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
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </FieldBlock>
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
                    <div className="flex flex-wrap gap-2">
                      {COMIDA_LOCAL_LANGUAGE_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={
                            draft.languages.includes(o.value) ? CHIP_ON : CHIP_OFF
                          }
                          onClick={() =>
                            updateDraft({
                              languages: toggleInList(
                                draft.languages,
                                o.value as ComidaLocalLanguageOption
                              ),
                            })
                          }
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </FieldBlock>
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
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                {publishError}
              </div>
            ) : null}

            {publishSuccessPath ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
                <p className="font-semibold">{COMIDA_LOCAL_SHELL_COPY.publishSuccessTitle}</p>
                <p className="mt-1 text-emerald-900/90">
                  Tu ficha ya está en resultados públicos cuando el inventario esté disponible.
                </p>
                <Link
                  href={publishSuccessPath}
                  className="mt-3 inline-flex rounded-lg border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
                >
                  Ver ficha publicada
                </Link>
              </div>
            ) : null}

            <div
              className={cx(
                CARD,
                "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              )}
            >
              <div className="min-w-0">
                <p className="text-sm text-[#1E1814]/70">
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
                  href="/clasificados/comida-local/preview"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#7A1E2C] bg-[#7A1E2C] px-5 py-2.5 text-sm font-semibold text-[#FFFCF7] hover:bg-[#6a1a26]"
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

            <div
              className={cx(
                CARD,
                "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1E1814]">Publicar en Comida Local</p>
                <p className="mt-1 text-sm text-[#1E1814]/70">
                  {publishReady
                    ? "Cuando publiques, tu ficha aparecerá en /clasificados/comida-local con un ID Leonix COMIDA-…"
                    : "Completa los campos de «Lista para publicar» para habilitar la publicación."}
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
                {publishBusy ? COMIDA_LOCAL_SHELL_COPY.publishing : COMIDA_LOCAL_SHELL_COPY.publishFicha}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
