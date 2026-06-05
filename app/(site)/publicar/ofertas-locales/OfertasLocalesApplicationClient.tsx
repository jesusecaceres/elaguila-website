"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  hasOfertaLocalAddressAccepted,
  hasOfertaLocalDirectionsAccepted,
  hasOfertaLocalUrlAccepted,
  isOfertaLocalCouponFlow,
  isOfertaLocalGeneralPromotionFlow,
  isOfertaLocalWeeklyFlyerFlow,
} from "@/app/lib/ofertas-locales/ofertasLocalesApplicationHelpers";
import {
  OFERTAS_LOCALES_APPLICATION_DIGITAL_PRICING_KEYS,
  OFERTAS_LOCALES_BUSINESS_CATEGORY_OPTIONS,
  OFERTAS_LOCALES_DIGITAL_FIRST_VALUE_PROPS,
  OFERTAS_LOCALES_FEATURED_PLACEMENT_SCOPE_OPTIONS,
  OFERTAS_LOCALES_MARKET_TYPE_OPTIONS,
  OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS,
  OFERTAS_LOCALES_OFFER_TYPE_OPTIONS,
  OFERTAS_LOCALES_PRICING,
  OFERTAS_LOCALES_PRODUCT_NAME,
} from "@/app/lib/ofertas-locales/ofertasLocalesConstants";
import {
  formatOfertaLocalPhoneDisplay,
  normalizeOfertaLocalUrlInput,
  normalizeOfertaLocalZipInput,
} from "@/app/lib/ofertas-locales/ofertasLocalesFormatting";
import { saveOfertaLocalDraftToStorage } from "@/app/lib/ofertas-locales/ofertasLocalesDraftPersistence";
import { validateOfertaLocalDraftForServerPublish } from "@/app/lib/ofertas-locales/ofertasLocalesPublishMapper";
import { submitOfertaLocalDraftForReview } from "@/app/lib/ofertas-locales/ofertasLocalesPublishSubmit";
import type {
  OfertaLocalBusinessCategory,
  OfertaLocalMarketType,
  OfertaLocalOfferType,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { useOfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { useOfertasLocalesDraft } from "@/app/lib/ofertas-locales/useOfertasLocalesDraft";
import {
  validateOfertaLocalDraftForFuturePublish,
  validateOfertaLocalDraftForPreview,
} from "@/app/lib/ofertas-locales/ofertasLocalesValidation";
import { OfertasLocalesDraftAssetSection } from "./OfertasLocalesDraftAssetSection";
import {
  OFERTAS_LOCALES_SHELL_COPY,
  ofertasLocalesAppCopy,
} from "./ofertasLocalesApplicationCopy";
import { OfertasLocalesValidationPanel } from "./OfertasLocalesValidationPanel";

const PAGE_BG = "bg-[#FFFCF7]";
const CARD = "rounded-2xl border border-[#D4C4A8]/80 bg-[#FFFCF7] shadow-sm";
const INPUT =
  "w-full rounded-xl border border-[#D4C4A8]/90 bg-white px-3 py-2.5 text-sm text-[#1E1814] placeholder:text-[#1E1814]/40 focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/25";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/70";
const HELPER = "mt-1 text-xs leading-relaxed text-[#1E1814]/60";
const CONFIRM = "mt-1 text-xs font-medium text-emerald-800";
const SECTION_TITLE = "text-lg font-semibold text-[#1E1814]";
const CHIP_ON =
  "rounded-lg border border-[#7A1E2C] bg-[#7A1E2C]/10 px-3 py-1.5 text-sm font-medium text-[#7A1E2C]";
const CHIP_OFF =
  "rounded-lg border border-[#D4C4A8] bg-white px-3 py-1.5 text-sm text-[#1E1814]/80 hover:border-[#7A1E2C]/40";
const BTN_PRIMARY =
  "rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45";
const BTN_SECONDARY =
  "rounded-xl border border-[#D4C4A8] bg-white px-4 py-2.5 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45";
const CALLOUT =
  "rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-4 py-3 text-sm text-[#1E1814]/75";

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

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={cx(CARD, "p-5 sm:p-6")}>
      <h2 className={SECTION_TITLE}>{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{ id: string; status: string } | null>(null);

  const previewIssues = useMemo(() => validateOfertaLocalDraftForPreview(draft), [draft]);
  const publishIssues = useMemo(() => validateOfertaLocalDraftForFuturePublish(draft), [draft]);
  const serverPublishIssues = useMemo(() => validateOfertaLocalDraftForServerPublish(draft), [draft]);
  const previewReady = previewIssues.length === 0;
  const publishFieldsReady = serverPublishIssues.every((i) => i.severity !== "error");

  const isFlyer = isOfertaLocalWeeklyFlyerFlow(draft.offerType);
  const isCoupon = isOfertaLocalCouponFlow(draft.offerType);
  const isGeneral = isOfertaLocalGeneralPromotionFlow(draft.offerType);

  const savedLabel = formatSavedAt(lastSavedAt, lang);
  const serviceZipsDisplay = formatServiceZipsDisplay(draft.serviceZipCodes);
  const addressAccepted = hasOfertaLocalAddressAccepted(draft);
  const directionsAccepted = hasOfertaLocalDirectionsAccepted(draft);
  const membershipUrlAccepted = hasOfertaLocalUrlAccepted(draft.membershipUrl);
  const digitalCouponUrlAccepted = hasOfertaLocalUrlAccepted(draft.digitalCouponUrl);

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

  return (
    <div className={cx("min-h-screen", PAGE_BG)}>
      <div className="mx-auto max-w-3xl px-4 py-8 pb-16 sm:px-6">
        <header className="mb-8 border-b border-[#D4C4A8]/60 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A1E2C]">
            Leonix · {OFERTAS_LOCALES_PRODUCT_NAME}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#1E1814] sm:text-3xl">{c.pageTitle}</h1>
          <p className="mt-2 text-sm text-[#1E1814]/75">{c.pageSubtitle}</p>
          <p className="mt-2 text-sm font-medium text-[#7A1E2C]">{c.digitalFirstTagline}</p>
          <ul className="mt-3 space-y-1 text-xs text-[#1E1814]/65">
            {OFERTAS_LOCALES_DIGITAL_FIRST_VALUE_PROPS.slice(0, 3).map((prop) => (
              <li key={prop}>· {prop}</li>
            ))}
          </ul>
          <p className="mt-3 rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-3 py-2 text-xs text-[#1E1814]/70">
            {c.scaffoldNotice}
            {savedLabel ? ` · ${c.draftSaved} (${savedLabel})` : null}
          </p>
        </header>

        <div className="space-y-6">
          <SectionCard title={c.offerTypeSection}>
            <div className="flex flex-wrap gap-2">
              {OFERTAS_LOCALES_OFFER_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={draft.offerType === opt.value ? CHIP_ON : CHIP_OFF}
                  onClick={() => updateDraft({ offerType: opt.value as OfertaLocalOfferType })}
                >
                  {lang === "en" ? opt.labelEn : opt.labelEs}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={c.businessSection}>
            <FieldBlock label={lang === "en" ? "Business category" : "Categoría del negocio"}>
              <select
                className={INPUT}
                value={draft.businessCategory}
                onChange={(e) =>
                  updateDraft({ businessCategory: e.target.value as OfertaLocalBusinessCategory | "" })
                }
              >
                <option value="">{c.selectPlaceholder}</option>
                {OFERTAS_LOCALES_BUSINESS_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {lang === "en" ? opt.labelEn : opt.labelEs}
                  </option>
                ))}
              </select>
            </FieldBlock>
            <FieldBlock label={lang === "en" ? "Market type" : "Tipo de mercado"} optional optionalLabel={c.optional}>
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
                {OFERTAS_LOCALES_MARKET_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {lang === "en" ? opt.labelEn : opt.labelEs}
                  </option>
                ))}
              </select>
            </FieldBlock>
            {draft.marketType === "other" ? (
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
            {(isGeneral || isCoupon) && !isFlyer ? (
              <FieldBlock label={c.descriptionLabel} optional>
                <textarea
                  className={cx(INPUT, "min-h-[80px] resize-y")}
                  value={draft.description}
                  onChange={(e) => updateDraft({ description: e.target.value })}
                />
              </FieldBlock>
            ) : null}
          </SectionCard>

          <SectionCard
            title={
              isCoupon ? c.offerDetailsCoupon : isFlyer ? c.offerDetailsFlyer : c.offerDetailsGeneral
            }
          >
            {isFlyer || isGeneral ? (
              <FieldBlock label={c.flyerTitleLabel} optional={!isFlyer} helper={isFlyer ? c.flyerTitleHelper : undefined}>
                <input
                  className={INPUT}
                  value={draft.flyerTitle}
                  onChange={(e) => updateDraft({ flyerTitle: e.target.value })}
                />
              </FieldBlock>
            ) : null}
            {isCoupon || isGeneral || isFlyer ? (
              <FieldBlock
                label={c.couponTextLabel}
                optional={isFlyer}
                helper={isCoupon ? c.couponTextHelper : undefined}
              >
                <textarea
                  className={cx(INPUT, "min-h-[80px] resize-y")}
                  value={draft.couponText}
                  onChange={(e) => updateDraft({ couponText: e.target.value })}
                />
              </FieldBlock>
            ) : null}
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
          </SectionCard>

          <SectionCard title={c.locationSection}>
            <FieldBlock
              label={lang === "en" ? "Address" : "Dirección"}
              optional
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
              <FieldBlock label={lang === "en" ? "State" : "Estado"} optional>
                <input
                  className={INPUT}
                  value={draft.state}
                  onChange={(e) => updateDraft({ state: e.target.value })}
                  maxLength={2}
                  placeholder="CA"
                />
              </FieldBlock>
              <FieldBlock label="ZIP">
                <input
                  className={INPUT}
                  value={draft.zipCode}
                  onChange={(e) =>
                    updateDraft({ zipCode: normalizeOfertaLocalZipInput(e.target.value) })
                  }
                  inputMode="numeric"
                  maxLength={5}
                />
              </FieldBlock>
            </div>
            <FieldBlock
              label={lang === "en" ? "Service ZIP codes" : "ZIPs de servicio"}
              optional
              helper={lang === "en" ? "Separate with commas." : "Separa con comas."}
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
                  placeholder="(408) 555-1234"
                />
              </FieldBlock>
              <FieldBlock label="WhatsApp" optional>
                <input
                  className={INPUT}
                  value={draft.whatsapp}
                  onChange={(e) => updateDraft({ whatsapp: formatOfertaLocalPhoneDisplay(e.target.value) })}
                  inputMode="tel"
                />
              </FieldBlock>
            </div>
            <FieldBlock label={lang === "en" ? "Website" : "Sitio web"} optional>
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
          </SectionCard>

          <SectionCard title={c.membershipSection}>
            <p className="text-sm text-[#1E1814]/75">{c.membershipQuestion}</p>
            <p className="text-xs text-[#1E1814]/55">
              {c.membershipCtaStandard} · {c.digitalCouponCtaStandard}
            </p>
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
              confirm={membershipUrlAccepted ? c.urlAccepted : undefined}
            >
              <input
                className={INPUT}
                value={draft.membershipUrl}
                onChange={(e) => updateDraft({ membershipUrl: e.target.value })}
                onBlur={() => handleUrlBlur("membershipUrl")}
              />
            </FieldBlock>
            <FieldBlock label={lang === "en" ? "Membership note" : "Nota de membresía"} optional>
              <textarea
                className={cx(INPUT, "min-h-[60px] resize-y")}
                value={draft.membershipNote}
                onChange={(e) => updateDraft({ membershipNote: e.target.value })}
              />
            </FieldBlock>
            <FieldBlock
              label={lang === "en" ? "Digital coupon URL" : "URL de cupón digital"}
              optional
              confirm={digitalCouponUrlAccepted ? c.urlAccepted : undefined}
            >
              <input
                className={INPUT}
                value={draft.digitalCouponUrl}
                onChange={(e) => updateDraft({ digitalCouponUrl: e.target.value })}
                onBlur={() => handleUrlBlur("digitalCouponUrl")}
              />
            </FieldBlock>
            <FieldBlock label={lang === "en" ? "Digital coupon note" : "Nota de cupón digital"} optional>
              <textarea
                className={cx(INPUT, "min-h-[60px] resize-y")}
                value={draft.digitalCouponNote}
                onChange={(e) => updateDraft({ digitalCouponNote: e.target.value })}
              />
            </FieldBlock>
          </SectionCard>

          <div className={CALLOUT}>
            <p className="font-semibold text-[#7A1E2C]">{c.leonixPartnerTitle}</p>
            <p className="mt-1 text-xs leading-relaxed">{c.leonixPartnerBody}</p>
            <Link
              href="/contacto"
              className="mt-3 inline-flex text-xs font-semibold text-[#7A1E2C] underline"
            >
              {c.leonixPartnerCta}
            </Link>
          </div>

          <SectionCard title={c.pricingSectionTitle}>
            <div className="space-y-3">
              {OFERTAS_LOCALES_APPLICATION_DIGITAL_PRICING_KEYS.map((key) => {
                const pkg = OFERTAS_LOCALES_PRICING[key];
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-3 text-sm"
                  >
                    <p className="font-medium text-[#1E1814]">{pkg.label}</p>
                    <p className="mt-1 text-[#1E1814]/75">
                      {c.regularRateLabel}: {formatUsd(pkg.regularPriceMonthly)}/mo ·{" "}
                      {c.partnerRateLabel}: {formatUsd(pkg.pickupPartnerPriceMonthly)}/mo
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-[#1E1814]/65">
              <span className="font-medium">{c.moreExposureTitle}</span> {c.moreExposureBody}
            </p>
            <label className="mt-4 flex items-start gap-2 text-sm text-[#1E1814]">
              <input
                type="checkbox"
                checked={draft.wantsAiSearchableSpecials}
                onChange={(e) => updateDraft({ wantsAiSearchableSpecials: e.target.checked })}
                className="mt-1 rounded border-[#D4C4A8] text-[#7A1E2C] focus:ring-[#7A1E2C]/30"
              />
              <span>
                <span className="font-medium">{c.aiAddOnLabel}</span>
                {draft.wantsAiSearchableSpecials ? (
                  <span className="mt-1 block text-xs text-[#1E1814]/65">{c.aiAddOnHelper}</span>
                ) : null}
              </span>
            </label>
          </SectionCard>

          <SectionCard title={c.assetsSection}>
            {!draft.offerType ? (
              <p className="text-sm text-[#1E1814]/55">
                {lang === "en" ? "Choose an offer type first." : "Elige un tipo de oferta primero."}
              </p>
            ) : null}
            {(isFlyer || isGeneral) && !isCoupon ? (
              <OfertasLocalesDraftAssetSection
                bucket="flyerAssets"
                draft={draft}
                updateDraft={updateDraft}
                lang={lang}
                sectionTitleOverride={c.assetsSectionFlyer}
              />
            ) : null}
            {isCoupon || isGeneral ? (
              <div className={isFlyer && !isCoupon ? "border-t border-[#D4C4A8]/50 pt-4" : ""}>
                <OfertasLocalesDraftAssetSection
                  bucket="couponAssets"
                  draft={draft}
                  updateDraft={updateDraft}
                  lang={lang}
                  sectionTitleOverride={
                    isFlyer && !isCoupon ? c.assetsSectionFlyerOptional : c.assetsSectionCoupon
                  }
                />
              </div>
            ) : null}
            {isFlyer && isCoupon ? null : null}
          </SectionCard>

          <SectionCard title={c.socialSectionTitle}>
            <p className={HELPER}>{c.socialSectionHelper}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldBlock
                label={c.socialFacebook}
                optional
                optionalLabel={c.optional}
                confirm={hasOfertaLocalUrlAccepted(draft.facebookUrl) ? c.urlAccepted : undefined}
              >
                <input
                  className={INPUT}
                  value={draft.facebookUrl}
                  onChange={(e) => updateDraft({ facebookUrl: e.target.value })}
                  onBlur={() => handleUrlBlur("facebookUrl")}
                  placeholder="https://…"
                />
              </FieldBlock>
              <FieldBlock
                label={c.socialInstagram}
                optional
                optionalLabel={c.optional}
                confirm={hasOfertaLocalUrlAccepted(draft.instagramUrl) ? c.urlAccepted : undefined}
              >
                <input
                  className={INPUT}
                  value={draft.instagramUrl}
                  onChange={(e) => updateDraft({ instagramUrl: e.target.value })}
                  onBlur={() => handleUrlBlur("instagramUrl")}
                  placeholder="https://…"
                />
              </FieldBlock>
              <FieldBlock
                label={c.socialTiktok}
                optional
                optionalLabel={c.optional}
                confirm={hasOfertaLocalUrlAccepted(draft.tiktokUrl) ? c.urlAccepted : undefined}
              >
                <input
                  className={INPUT}
                  value={draft.tiktokUrl}
                  onChange={(e) => updateDraft({ tiktokUrl: e.target.value })}
                  onBlur={() => handleUrlBlur("tiktokUrl")}
                  placeholder="https://…"
                />
              </FieldBlock>
              <FieldBlock
                label={c.socialYoutube}
                optional
                optionalLabel={c.optional}
                confirm={hasOfertaLocalUrlAccepted(draft.youtubeUrl) ? c.urlAccepted : undefined}
              >
                <input
                  className={INPUT}
                  value={draft.youtubeUrl}
                  onChange={(e) => updateDraft({ youtubeUrl: e.target.value })}
                  onBlur={() => handleUrlBlur("youtubeUrl")}
                  placeholder="https://…"
                />
              </FieldBlock>
              <FieldBlock
                label={c.socialGoogleBusiness}
                optional
                optionalLabel={c.optional}
                confirm={hasOfertaLocalUrlAccepted(draft.googleBusinessUrl) ? c.urlAccepted : undefined}
              >
                <input
                  className={INPUT}
                  value={draft.googleBusinessUrl}
                  onChange={(e) => updateDraft({ googleBusinessUrl: e.target.value })}
                  onBlur={() => handleUrlBlur("googleBusinessUrl")}
                  placeholder="https://…"
                />
              </FieldBlock>
            </div>
          </SectionCard>

          <SectionCard title={c.featuredSectionTitle}>
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
          </SectionCard>

          <SectionCard title={c.validationSection}>
            {submitSuccess ? (
              <div className="mb-4 rounded-xl border border-emerald-300/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <p className="font-semibold">{c.submitSuccessTitle}</p>
                <p className="mt-1 text-xs">{c.submitSuccessBody}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-emerald-800/60">
                  ID: {submitSuccess.id} · {submitSuccess.status}
                </p>
              </div>
            ) : null}
            {submitError ? (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
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
            <div className="flex flex-wrap gap-3 pt-2">
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
              <Link
                href={previewHref}
                className={BTN_PRIMARY}
                title={OFERTAS_LOCALES_SHELL_COPY.previewDisabled}
              >
                {c.previewLink}
              </Link>
              <button
                type="button"
                className={BTN_PRIMARY}
                disabled={!publishFieldsReady || submitting}
                title={OFERTAS_LOCALES_SHELL_COPY.publishDisabled}
                onClick={() => void handleSubmitForReview()}
              >
                {submitting ? c.submittingForReview : c.submitForReview}
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Foundation fields preserved for draft compatibility — hidden from main UI (Stack 6.5A). */}
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
