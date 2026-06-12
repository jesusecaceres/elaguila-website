"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  hasOfertaLocalAddressAccepted,
  hasOfertaLocalDirectionsAccepted,
  hasOfertaLocalUrlAccepted,
  getOfertaLocalApplicationBasePriceMonthly,
  getOfertaLocalProductDisplayLabel,
  isOfertaLocalCouponPromotionFlow,
  isOfertaLocalWeeklyFlyerFlow,
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
  normalizeOfertaLocalStateInput,
  normalizeOfertaLocalUrlInput,
  normalizeOfertaLocalZipInput,
} from "@/app/lib/ofertas-locales/ofertasLocalesFormatting";
import {
  buildBusinessCategoryChangePatch,
  businessCategoryShowsSubtypeDropdown,
  businessCategoryUsesCustomTypeText,
  getSubtypeLabelForBusinessCategory,
  getSubtypeOptionsForBusinessCategory,
} from "@/app/lib/ofertas-locales/ofertasLocalesBusinessCategoryUx";
import { saveOfertaLocalDraftToStorage } from "@/app/lib/ofertas-locales/ofertasLocalesDraftPersistence";
import { validateOfertaLocalDraftForServerPublish } from "@/app/lib/ofertas-locales/ofertasLocalesPublishMapper";
import { submitOfertaLocalDraftForReview } from "@/app/lib/ofertas-locales/ofertasLocalesPublishSubmit";
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
import { useOfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { useOfertasLocalesDraft } from "@/app/lib/ofertas-locales/useOfertasLocalesDraft";
import {
  validateOfertaLocalDraftForFuturePublish,
  validateOfertaLocalDraftForPreview,
} from "@/app/lib/ofertas-locales/ofertasLocalesValidation";
import { OfertasLocalesAiItemReviewPanel } from "./OfertasLocalesAiItemReviewPanel";
import { OfertasLocalesAiScanPanel } from "./OfertasLocalesAiScanPanel";
import { OfertasLocalesClickableItemPreviewPanel } from "./OfertasLocalesClickableItemPreviewPanel";
import { OfertasLocalesDraftAssetSection } from "./OfertasLocalesDraftAssetSection";
import {
  OFERTAS_LOCALES_SHELL_COPY,
  ofertasLocalesAppCopy,
} from "./ofertasLocalesApplicationCopy";
import { OfertasLocalesValidationPanel } from "./OfertasLocalesValidationPanel";
import { OfertasLocalesWizardProgress } from "./OfertasLocalesWizardProgress";

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

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function parseServiceZips(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((z) => normalizeOfertaLocalZipInput(z))
    .filter((z) => z.length === 5);
}

function formatServiceZipsDisplay(zips: string[]): string {
  return zips.join(", ");
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
  const lang = useOfertasLocalesAppLang();
  const c = ofertasLocalesAppCopy(lang);
  const { draft, updateDraft, resetDraft, hasLoadedDraft, lastSavedAt } = useOfertasLocalesDraft();
  const [step, setStep] = useState<OfertasLocalesWizardStepId>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{ id: string; status: string } | null>(null);
  const [lastScanJobId, setLastScanJobId] = useState<string | null>(null);

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

  const savedLabel = formatSavedAt(lastSavedAt, lang);
  const serviceZipsDisplay = formatServiceZipsDisplay(draft.serviceZipCodes);
  const addressAccepted = hasOfertaLocalAddressAccepted(draft);
  const directionsAccepted = hasOfertaLocalDirectionsAccepted(draft);
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
        | "directionsUrl"
        | "membershipUrl"
        | "digitalCouponUrl"
        | "facebookUrl"
        | "instagramUrl"
        | "tiktokUrl"
        | "youtubeUrl"
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
      const result = await submitOfertaLocalDraftForReview(draft);
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
    } catch {
      setSubmitError(c.submitFailed);
    } finally {
      setSubmitting(false);
    }
  }, [c.submitFailed, draft]);

  const goNext = useCallback(() => {
    setStep((s) => clampWizardStep(s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
                href="/contacto"
                className="mt-3 inline-flex text-xs font-semibold text-[#7A1E2C] underline"
              >
                {c.reviewContactLeonix}
              </Link>
            </div>

            <div className={cx(CALLOUT, "border-[#D4C4A8]/50 bg-white")}>
              <p className="font-semibold text-[#7A1E2C]">{c.leonixPartnerTitle}</p>
              <p className="mt-1 text-xs leading-relaxed">{c.step1LeonixPartnerBody}</p>
              <Link
                href="/contacto"
                className="mt-3 inline-flex text-xs font-semibold text-[#7A1E2C] underline"
              >
                {c.leonixPartnerCta}
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
            <FieldBlock label={lang === "en" ? "Offer title" : "Título de la oferta"}>
              <input
                className={INPUT}
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
              />
            </FieldBlock>
            {(isCouponPromo) && !isFlyer ? (
              <FieldBlock label={c.descriptionLabel} optional optionalLabel={c.optional}>
                <textarea
                  className={cx(INPUT, "min-h-[80px] resize-y")}
                  value={draft.description}
                  onChange={(e) => updateDraft({ description: e.target.value })}
                />
              </FieldBlock>
            ) : null}
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
                <FieldBlock label={c.laneShoppingFlyerTitleLabel} helper={c.flyerTitleHelper}>
                  <input
                    className={INPUT}
                    value={draft.flyerTitle}
                    onChange={(e) => updateDraft({ flyerTitle: e.target.value })}
                  />
                </FieldBlock>
                <FieldBlock label={c.laneShoppingFlyerDescriptionLabel} optional optionalLabel={c.optional}>
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
                <FieldBlock label={c.laneCouponPromotionTitleLabel}>
                  <input
                    className={INPUT}
                    value={draft.title}
                    onChange={(e) => updateDraft({ title: e.target.value })}
                  />
                </FieldBlock>
                <FieldBlock label={c.laneCouponTextLabel} helper={c.couponTextHelper}>
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
            <div className="grid gap-4 sm:grid-cols-3">
              <FieldBlock label={lang === "en" ? "City" : "Ciudad"} helper={c.cityHelper}>
                <input
                  className={INPUT}
                  value={draft.city}
                  onChange={(e) => updateDraft({ city: e.target.value })}
                />
              </FieldBlock>
              <FieldBlock label={lang === "en" ? "State" : "Estado"} optional optionalLabel={c.optional}>
                <input
                  className={INPUT}
                  value={draft.state}
                  onChange={(e) =>
                    updateDraft({ state: normalizeOfertaLocalStateInput(e.target.value) })
                  }
                  maxLength={2}
                  placeholder={lang === "en" ? "State" : "Estado"}
                  autoComplete="address-level1"
                />
              </FieldBlock>
              <FieldBlock label="ZIP" helper={c.zipHelper}>
                <input
                  className={INPUT}
                  value={draft.zipCode}
                  onChange={(e) =>
                    updateDraft({ zipCode: normalizeOfertaLocalZipInput(e.target.value) })
                  }
                  inputMode="numeric"
                  maxLength={5}
                  autoComplete="postal-code"
                />
              </FieldBlock>
            </div>
            <FieldBlock
              label={lang === "en" ? "Service ZIP codes" : "ZIPs de servicio"}
              optional
              optionalLabel={c.optional}
              helper={c.serviceZipHelper}
            >
              <input
                className={INPUT}
                value={serviceZipsDisplay}
                onChange={(e) => updateDraft({ serviceZipCodes: parseServiceZips(e.target.value) })}
              />
            </FieldBlock>
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
            <FieldBlock
              label={lang === "en" ? "Directions / map URL" : "URL de mapa / direcciones"}
              optional
              optionalLabel={c.optional}
              helper={c.directionsHelper}
              confirm={directionsAccepted ? c.directionsAccepted : undefined}
            >
              <input
                className={INPUT}
                value={draft.directionsUrl}
                onChange={(e) => updateDraft({ directionsUrl: e.target.value })}
                onBlur={() => handleUrlBlur("directionsUrl")}
                placeholder="Google Maps"
              />
            </FieldBlock>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            {!primaryFormat ? (
              <p className="text-sm text-[#1E1814]/55">
                {lang === "en"
                  ? "Choose your primary format in Step 1 first."
                  : "Elige el formato principal en el Paso 1."}
              </p>
            ) : null}
            {isShoppingLane ? (
              <>
                <OfertasLocalesDraftAssetSection
                  bucket="flyerAssets"
                  draft={draft}
                  updateDraft={updateDraft}
                  lang={lang}
                  sectionTitleOverride={c.laneShoppingMainFlyerAsset}
                  showAiScanFormatsHint={draft.wantsAiSearchableSpecials}
                />
                <div className="border-t border-[#D4C4A8]/50 pt-4">
                  <OfertasLocalesDraftAssetSection
                    bucket="couponAssets"
                    draft={draft}
                    updateDraft={updateDraft}
                    lang={lang}
                    sectionTitleOverride={c.laneShoppingAdditionalCoupons}
                    showAiScanFormatsHint={draft.wantsAiSearchableSpecials}
                  />
                </div>
              </>
            ) : null}
            {isCouponsLane ? (
              <>
                <OfertasLocalesDraftAssetSection
                  bucket="couponAssets"
                  draft={draft}
                  updateDraft={updateDraft}
                  lang={lang}
                  sectionTitleOverride={c.laneCouponMainAsset}
                  showAiScanFormatsHint={draft.wantsAiSearchableSpecials}
                />
                <div className="border-t border-[#D4C4A8]/50 pt-4">
                  <OfertasLocalesDraftAssetSection
                    bucket="flyerAssets"
                    draft={draft}
                    updateDraft={updateDraft}
                    lang={lang}
                    sectionTitleOverride={c.laneCouponAdditionalPromo}
                    showAiScanFormatsHint={draft.wantsAiSearchableSpecials}
                  />
                </div>
              </>
            ) : null}
            {draft.wantsAiSearchableSpecials ? (
              <>
                <OfertasLocalesAiScanPanel
                  draft={draft}
                  lang={lang}
                  ofertaLocalId={submitSuccess?.id}
                  onScanComplete={setLastScanJobId}
                />
                <OfertasLocalesAiItemReviewPanel
                  lang={lang}
                  ofertaLocalId={submitSuccess?.id}
                  scanJobId={lastScanJobId}
                />
                <OfertasLocalesClickableItemPreviewPanel
                  lang={lang}
                  ofertaLocalId={submitSuccess?.id}
                  scanJobId={lastScanJobId}
                  draft={draft}
                />
              </>
            ) : null}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
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

            <div className="space-y-4 rounded-xl border border-[#D4C4A8]/50 bg-white p-4">
              <p className="text-sm font-medium text-[#1E1814]">{c.socialSectionTitle}</p>
              <p className={HELPER}>{c.socialSectionHelper}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["facebookUrl", c.socialFacebook],
                    ["instagramUrl", c.socialInstagram],
                    ["tiktokUrl", c.socialTiktok],
                    ["youtubeUrl", c.socialYoutube],
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

            <div className={CALLOUT}>
              <p className="font-semibold text-[#7A1E2C]">{c.leonixPartnerTitle}</p>
              <p className="mt-1 text-xs leading-relaxed">{c.step1LeonixPartnerBody}</p>
              <Link
                href="/contacto"
                className="mt-3 inline-flex text-xs font-semibold text-[#7A1E2C] underline"
              >
                {c.leonixPartnerCta}
              </Link>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            {submitSuccess ? (
              <div className="rounded-xl border border-emerald-300/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="font-semibold">{c.submitSuccessTitle}</p>
                <p className="mt-1 text-xs">{c.submitSuccessBody}</p>
                <p className="mt-2 text-xs text-emerald-900/85">{c.submitNotPublicUntilReview}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#7A1E2C]/20 bg-[#7A1E2C]/5 px-4 py-3 text-sm text-[#1E1814]">
                <p className="text-xs">{c.submitNotPublicUntilReview}</p>
              </div>
            )}
            {submitError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {submitError}
              </p>
            ) : null}

            <OfertasLocalesValidationPanel
              previewIssues={previewIssues}
              publishIssues={publishIssues}
              previewReady={previewReady}
              publishFieldsReady={publishFieldsReady}
              lang={lang}
            />

            {draft.wantsAiSearchableSpecials ? (
              <>
                <OfertasLocalesAiScanPanel
                  draft={draft}
                  lang={lang}
                  ofertaLocalId={submitSuccess?.id}
                  onScanComplete={setLastScanJobId}
                />
                <OfertasLocalesAiItemReviewPanel
                  lang={lang}
                  ofertaLocalId={submitSuccess?.id}
                  scanJobId={lastScanJobId}
                />
                <OfertasLocalesClickableItemPreviewPanel
                  lang={lang}
                  ofertaLocalId={submitSuccess?.id}
                  scanJobId={lastScanJobId}
                  draft={draft}
                />
              </>
            ) : null}

            <div>
              {/* OFERTAS_LOCALES_APPLICATION_DIGITAL_PRICING_KEYS — review shows selected base product only (Stack 9B). */}
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
                <div className="rounded-xl border border-[#D4C4A8]/60 bg-[#FDF8F0]/80 px-4 py-3 text-sm">
                  <p className="font-medium text-[#1E1814]">{c.step1MoreExposureTitle}</p>
                  <p className="mt-1 text-xs text-[#1E1814]/65">{c.reviewContactLeonix}</p>
                </div>
                <div className="rounded-xl border border-[#D4C4A8]/60 bg-white px-4 py-3 text-sm">
                  <p className="font-medium text-[#1E1814]">{c.leonixPartnerTitle}</p>
                  <p className="mt-1 text-xs text-[#1E1814]/65">
                    {c.reviewContactLeonix} · {c.reviewInviteOnly}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#1E1814]/55">{c.flatPricingCopy}</p>
              <p className="mt-2 text-xs text-[#1E1814]/55">{c.publishNotBuilt}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" className={BTN_SECONDARY} onClick={handleSaveDraft}>
                {c.saveDraft}
              </button>
              <button
                type="button"
                className={BTN_SECONDARY}
                onClick={() => {
                  const msg =
                    lang === "en"
                      ? "Reset the draft saved on this device?"
                      : "¿Restablecer el borrador guardado en este dispositivo?";
                  if (window.confirm(msg)) resetDraft();
                }}
              >
                {c.resetDraft}
              </button>
              <Link href={previewHref} className={BTN_PRIMARY}>
                {c.previewLink}
              </Link>
              <button
                type="button"
                className={BTN_PRIMARY}
                disabled={!publishFieldsReady || submitting}
                onClick={() => void handleSubmitForReview()}
              >
                {submitting ? c.submittingForReview : c.submitForReview}
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
                  <button type="button" className={BTN_PRIMARY} onClick={goNext}>
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
    </div>
  );
}
