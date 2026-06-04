"use client";

import Link from "next/link";
import { useCallback, useMemo, type ReactNode } from "react";
import {
  OFERTAS_LOCALES_BUSINESS_CATEGORY_OPTIONS,
  OFERTAS_LOCALES_DIGITAL_FIRST_VALUE_PROPS,
  OFERTAS_LOCALES_MARKET_TYPE_OPTIONS,
  OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS,
  OFERTAS_LOCALES_MAGAZINE_DISTRIBUTION_STATUS_OPTIONS,
  OFERTAS_LOCALES_OFFER_TYPE_OPTIONS,
  OFERTAS_LOCALES_PICKUP_PARTNER_PRICING_NOTE,
  OFERTAS_LOCALES_PRICING,
  OFERTAS_LOCALES_PRODUCT_NAME,
} from "@/app/lib/ofertas-locales/ofertasLocalesConstants";
import {
  normalizeOfertaLocalPhoneInput,
  normalizeOfertaLocalUrlInput,
  normalizeOfertaLocalZipInput,
} from "@/app/lib/ofertas-locales/ofertasLocalesFormatting";
import type {
  OfertaLocalBusinessCategory,
  OfertaLocalMagazineDistributionStatus,
  OfertaLocalMarketType,
  OfertaLocalOfferType,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { useOfertasLocalesDraft } from "@/app/lib/ofertas-locales/useOfertasLocalesDraft";
import { saveOfertaLocalDraftToStorage } from "@/app/lib/ofertas-locales/ofertasLocalesDraftPersistence";
import {
  validateOfertaLocalDraftForFuturePublish,
  validateOfertaLocalDraftForPreview,
} from "@/app/lib/ofertas-locales/ofertasLocalesValidation";
import { OFERTAS_LOCALES_SHELL_COPY } from "./ofertasLocalesApplicationCopy";
import { OfertasLocalesValidationPanel } from "./OfertasLocalesValidationPanel";

const PAGE_BG = "bg-[#FFFCF7]";
const CARD = "rounded-2xl border border-[#D4C4A8]/80 bg-[#FFFCF7] shadow-sm";
const INPUT =
  "w-full rounded-xl border border-[#D4C4A8]/90 bg-white px-3 py-2.5 text-sm text-[#1E1814] placeholder:text-[#1E1814]/40 focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/25";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/70";
const HELPER = "mt-1 text-xs leading-relaxed text-[#1E1814]/60";
const SECTION_TITLE = "text-lg font-semibold text-[#1E1814]";
const CHIP_ON =
  "rounded-lg border border-[#7A1E2C] bg-[#7A1E2C]/10 px-3 py-1.5 text-sm font-medium text-[#7A1E2C]";
const CHIP_OFF =
  "rounded-lg border border-[#D4C4A8] bg-white px-3 py-1.5 text-sm text-[#1E1814]/80 hover:border-[#7A1E2C]/40";
const BTN_PRIMARY =
  "rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45";
const BTN_SECONDARY =
  "rounded-xl border border-[#D4C4A8] bg-white px-4 py-2.5 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45";
const PLACEHOLDER_BOX =
  "rounded-xl border border-dashed border-[#D4C4A8] bg-[#FDF8F0]/80 px-4 py-6 text-center text-sm text-[#1E1814]/55";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatPhoneDisplay(raw: string): string {
  const d = normalizeOfertaLocalPhoneInput(raw).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
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
  children,
}: {
  label: string;
  helper?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className={LABEL}>
        {label}
        {optional ? (
          <span className="ml-1 font-normal normal-case text-[#1E1814]/45">(opcional)</span>
        ) : null}
      </label>
      {children}
      {helper ? <p className={HELPER}>{helper}</p> : null}
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

export default function OfertasLocalesApplicationClient() {
  const { draft, updateDraft, resetDraft, hasLoadedDraft, lastSavedAt } = useOfertasLocalesDraft();

  const previewIssues = useMemo(() => validateOfertaLocalDraftForPreview(draft), [draft]);
  const publishIssues = useMemo(() => validateOfertaLocalDraftForFuturePublish(draft), [draft]);
  const previewReady = previewIssues.length === 0;
  const publishFieldsReady = publishIssues.every((i) => i.severity !== "error");

  const savedLabel = formatSavedAt(lastSavedAt);
  const serviceZipsDisplay = formatServiceZipsDisplay(draft.serviceZipCodes);

  const handleUrlBlur = useCallback(
    (field: "websiteUrl" | "directionsUrl" | "membershipUrl" | "digitalCouponUrl") => {
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

  if (!hasLoadedDraft) {
    return (
      <div className={cx("min-h-screen", PAGE_BG)}>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-[#1E1814]/60">
          Cargando borrador…
        </div>
      </div>
    );
  }

  return (
    <div className={cx("min-h-screen", PAGE_BG)}>
      <div className="mx-auto max-w-3xl px-4 py-8 pb-16 sm:px-6">
        {/* 1. Hero */}
        <header className="mb-8 border-b border-[#D4C4A8]/60 pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A1E2C]">
            Leonix · {OFERTAS_LOCALES_PRODUCT_NAME}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#1E1814] sm:text-3xl">
            {OFERTAS_LOCALES_SHELL_COPY.pageTitle}
          </h1>
          <p className="mt-2 text-sm text-[#1E1814]/75">{OFERTAS_LOCALES_SHELL_COPY.pageSubtitle}</p>
          <p className="mt-2 text-sm font-medium text-[#7A1E2C]">
            {OFERTAS_LOCALES_SHELL_COPY.digitalFirstTagline}
          </p>
          <ul className="mt-3 space-y-1 text-xs text-[#1E1814]/65">
            {OFERTAS_LOCALES_DIGITAL_FIRST_VALUE_PROPS.slice(0, 4).map((prop) => (
              <li key={prop}>· {prop}</li>
            ))}
          </ul>
          <p className="mt-3 rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-3 py-2 text-xs text-[#1E1814]/70">
            {OFERTAS_LOCALES_SHELL_COPY.scaffoldNotice}
            {savedLabel ? ` · ${OFERTAS_LOCALES_SHELL_COPY.draftSaved} (${savedLabel})` : null}
          </p>
        </header>

        <div className="space-y-6">
          {/* 2. Offer type */}
          <SectionCard title="Tipo de oferta">
            <div className="flex flex-wrap gap-2">
              {OFERTAS_LOCALES_OFFER_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={draft.offerType === opt.value ? CHIP_ON : CHIP_OFF}
                  onClick={() => updateDraft({ offerType: opt.value as OfertaLocalOfferType })}
                >
                  {opt.labelEs}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* 3. Business details */}
          <SectionCard title="Detalles del negocio">
            <FieldBlock label="Categoría del negocio">
              <select
                className={INPUT}
                value={draft.businessCategory}
                onChange={(e) =>
                  updateDraft({ businessCategory: e.target.value as OfertaLocalBusinessCategory | "" })
                }
              >
                <option value="">Selecciona…</option>
                {OFERTAS_LOCALES_BUSINESS_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.labelEs}
                  </option>
                ))}
              </select>
            </FieldBlock>
            <FieldBlock label="Tipo de mercado" optional>
              <select
                className={INPUT}
                value={draft.marketType}
                onChange={(e) =>
                  updateDraft({ marketType: e.target.value as OfertaLocalMarketType | "" })
                }
              >
                <option value="">Selecciona…</option>
                {OFERTAS_LOCALES_MARKET_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.labelEs}
                  </option>
                ))}
              </select>
            </FieldBlock>
            <FieldBlock label="Nombre del negocio">
              <input
                className={INPUT}
                value={draft.businessName}
                onChange={(e) => updateDraft({ businessName: e.target.value })}
                autoComplete="organization"
              />
            </FieldBlock>
            <FieldBlock label="Título de la oferta">
              <input
                className={INPUT}
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
              />
            </FieldBlock>
            <FieldBlock label="Descripción" optional>
              <textarea
                className={cx(INPUT, "min-h-[100px] resize-y")}
                value={draft.description}
                onChange={(e) => updateDraft({ description: e.target.value })}
              />
            </FieldBlock>
          </SectionCard>

          {/* 4. Offer details */}
          <SectionCard title="Detalles de la oferta">
            <FieldBlock label="Título del volante" optional helper="Para volantes semanales.">
              <input
                className={INPUT}
                value={draft.flyerTitle}
                onChange={(e) => updateDraft({ flyerTitle: e.target.value })}
              />
            </FieldBlock>
            <FieldBlock label="Texto del cupón" optional helper="Para cupones y promociones.">
              <textarea
                className={cx(INPUT, "min-h-[80px] resize-y")}
                value={draft.couponText}
                onChange={(e) => updateDraft({ couponText: e.target.value })}
              />
            </FieldBlock>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldBlock label="Válido desde">
                <input
                  type="date"
                  className={INPUT}
                  value={draft.validFrom}
                  onChange={(e) => updateDraft({ validFrom: e.target.value })}
                />
              </FieldBlock>
              <FieldBlock label="Válido hasta">
                <input
                  type="date"
                  className={INPUT}
                  value={draft.validUntil}
                  onChange={(e) => updateDraft({ validUntil: e.target.value })}
                />
              </FieldBlock>
            </div>
          </SectionCard>

          {/* 5. Location and contact */}
          <SectionCard title="Ubicación y contacto">
            <FieldBlock label="Dirección" optional>
              <input
                className={INPUT}
                value={draft.address}
                onChange={(e) => updateDraft({ address: e.target.value })}
                autoComplete="street-address"
              />
            </FieldBlock>
            <div className="grid gap-4 sm:grid-cols-3">
              <FieldBlock label="Ciudad">
                <input
                  className={INPUT}
                  value={draft.city}
                  onChange={(e) => updateDraft({ city: e.target.value })}
                />
              </FieldBlock>
              <FieldBlock label="Estado" optional>
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
              label="ZIPs de servicio"
              optional
              helper="Separa con comas (ej. 94533, 94534)."
            >
              <input
                className={INPUT}
                value={serviceZipsDisplay}
                onChange={(e) => updateDraft({ serviceZipCodes: parseServiceZips(e.target.value) })}
                placeholder="94533, 94534"
              />
            </FieldBlock>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldBlock label="Teléfono">
                <input
                  className={INPUT}
                  value={draft.phone}
                  onChange={(e) => updateDraft({ phone: formatPhoneDisplay(e.target.value) })}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </FieldBlock>
              <FieldBlock label="WhatsApp" optional>
                <input
                  className={INPUT}
                  value={draft.whatsapp}
                  onChange={(e) => updateDraft({ whatsapp: formatPhoneDisplay(e.target.value) })}
                  inputMode="tel"
                />
              </FieldBlock>
            </div>
            <FieldBlock label="Sitio web" optional>
              <input
                className={INPUT}
                value={draft.websiteUrl}
                onChange={(e) => updateDraft({ websiteUrl: e.target.value })}
                onBlur={() => handleUrlBlur("websiteUrl")}
                placeholder="https://"
              />
            </FieldBlock>
            <FieldBlock label="URL de direcciones" optional>
              <input
                className={INPUT}
                value={draft.directionsUrl}
                onChange={(e) => updateDraft({ directionsUrl: e.target.value })}
                onBlur={() => handleUrlBlur("directionsUrl")}
                placeholder="Google Maps u otro enlace"
              />
            </FieldBlock>
          </SectionCard>

          {/* 6. Rewards / membership / digital coupons */}
          <SectionCard title="Recompensas y cupones digitales">
            <p className="text-sm text-[#1E1814]/75">{OFERTAS_LOCALES_SHELL_COPY.membershipHelperEn}</p>
            <p className="text-sm text-[#1E1814]/75">{OFERTAS_LOCALES_SHELL_COPY.membershipHelperEn2}</p>
            <p className="text-xs text-[#1E1814]/60">{OFERTAS_LOCALES_SHELL_COPY.membershipHelperEs}</p>
            <label className="flex items-center gap-2 text-sm text-[#1E1814]">
              <input
                type="checkbox"
                checked={draft.requiresMembershipForDeals}
                onChange={(e) => updateDraft({ requiresMembershipForDeals: e.target.checked })}
                className="rounded border-[#D4C4A8] text-[#7A1E2C] focus:ring-[#7A1E2C]/30"
              />
              Requiere cuenta de recompensas para estas ofertas
            </label>
            <FieldBlock label="URL de membresía / recompensas" optional>
              <input
                className={INPUT}
                value={draft.membershipUrl}
                onChange={(e) => updateDraft({ membershipUrl: e.target.value })}
                onBlur={() => handleUrlBlur("membershipUrl")}
              />
            </FieldBlock>
            <FieldBlock
              label="Etiqueta CTA de membresía"
              optional
              helper={`Ej. ${OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS.joinRewardsEs} / ${OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS.joinRewardsEn}`}
            >
              <input
                className={INPUT}
                value={draft.membershipCtaLabel}
                onChange={(e) => updateDraft({ membershipCtaLabel: e.target.value })}
                placeholder={OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS.signUpBeforeYouGoEs}
              />
            </FieldBlock>
            <FieldBlock label="Nota de membresía" optional>
              <textarea
                className={cx(INPUT, "min-h-[60px] resize-y")}
                value={draft.membershipNote}
                onChange={(e) => updateDraft({ membershipNote: e.target.value })}
              />
            </FieldBlock>
            <FieldBlock label="URL de cupón digital" optional>
              <input
                className={INPUT}
                value={draft.digitalCouponUrl}
                onChange={(e) => updateDraft({ digitalCouponUrl: e.target.value })}
                onBlur={() => handleUrlBlur("digitalCouponUrl")}
              />
            </FieldBlock>
            <FieldBlock
              label="Nota de cupón digital"
              optional
              helper={`Ej. ${OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS.activateDigitalCouponsEs}`}
            >
              <textarea
                className={cx(INPUT, "min-h-[60px] resize-y")}
                value={draft.digitalCouponNote}
                onChange={(e) => updateDraft({ digitalCouponNote: e.target.value })}
              />
            </FieldBlock>
          </SectionCard>

          {/* 7. Magazine pickup partner */}
          <SectionCard title="Socio de recogida de revista">
            <p className="text-sm text-[#1E1814]/75">{OFERTAS_LOCALES_SHELL_COPY.magazinePartnerHelper}</p>
            <p className="text-xs text-[#1E1814]/55">
              Opción de distribución — no es el producto principal para supermercados.
            </p>
            <label className="flex items-center gap-2 text-sm text-[#1E1814]">
              <input
                type="checkbox"
                checked={draft.isMagazinePickupPartner}
                onChange={(e) => updateDraft({ isMagazinePickupPartner: e.target.checked })}
                className="rounded border-[#D4C4A8] text-[#7A1E2C] focus:ring-[#7A1E2C]/30"
              />
              Interés en ser socio de recogida Leonix
            </label>
            <FieldBlock label="Estado de distribución">
              <select
                className={INPUT}
                value={draft.magazineDistributionStatus}
                onChange={(e) =>
                  updateDraft({
                    magazineDistributionStatus: e.target.value as OfertaLocalMagazineDistributionStatus,
                  })
                }
              >
                {OFERTAS_LOCALES_MAGAZINE_DISTRIBUTION_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.labelEs}
                  </option>
                ))}
              </select>
            </FieldBlock>
            <FieldBlock label="Estimado mensual de entregas" optional>
              <input
                className={INPUT}
                value={draft.magazineMonthlyDropEstimate}
                onChange={(e) => updateDraft({ magazineMonthlyDropEstimate: e.target.value })}
                placeholder="ej. 200 revistas/mes"
              />
            </FieldBlock>
            <FieldBlock label="Notas de recogida" optional>
              <textarea
                className={cx(INPUT, "min-h-[60px] resize-y")}
                value={draft.magazinePickupNotes}
                onChange={(e) => updateDraft({ magazinePickupNotes: e.target.value })}
              />
            </FieldBlock>
          </SectionCard>

          {/* 8. Pricing preview */}
          <SectionCard title={OFERTAS_LOCALES_SHELL_COPY.pricingSectionTitle}>
            <p className="text-xs text-[#1E1814]/65">{OFERTAS_LOCALES_SHELL_COPY.magazinePartnerNote}</p>
            <p className="text-xs text-[#1E1814]/55">{OFERTAS_LOCALES_PICKUP_PARTNER_PRICING_NOTE}</p>
            <div className="overflow-x-auto">
              <table className="mt-2 w-full min-w-[320px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#D4C4A8]/80 text-[#1E1814]/60">
                    <th className="py-2 pr-3 font-semibold uppercase tracking-wide">Plan</th>
                    <th className="py-2 pr-3 font-semibold uppercase tracking-wide">Regular</th>
                    <th className="py-2 font-semibold uppercase tracking-wide">Socio recogida</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(OFERTAS_LOCALES_PRICING).map((pkg) => (
                    <tr key={pkg.label} className="border-b border-[#D4C4A8]/40">
                      <td className="py-2.5 pr-3 text-[#1E1814]">
                        {pkg.label}
                        {pkg.isAddOn ? (
                          <span className="ml-1 text-[#1E1814]/45">(add-on)</span>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-3 text-[#1E1814]/80">
                        {formatUsd(pkg.regularPriceMonthly)}/mo
                      </td>
                      <td className="py-2.5 font-medium text-[#7A1E2C]">
                        {formatUsd(pkg.pickupPartnerPriceMonthly)}/mo
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 9. Future upload placeholder */}
          <SectionCard title="Archivos (próximamente)">
            <div className={PLACEHOLDER_BOX}>{OFERTAS_LOCALES_SHELL_COPY.uploadFlyerPlaceholder}</div>
            <div className={PLACEHOLDER_BOX}>{OFERTAS_LOCALES_SHELL_COPY.uploadCouponPlaceholder}</div>
          </SectionCard>

          {/* 10. Validation and actions */}
          <SectionCard title="Validación y acciones">
            <OfertasLocalesValidationPanel
              previewIssues={previewIssues}
              publishIssues={publishIssues}
              previewReady={previewReady}
              publishFieldsReady={publishFieldsReady}
            />
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="button" className={BTN_SECONDARY} onClick={handleSaveDraft}>
                {OFERTAS_LOCALES_SHELL_COPY.saveDraft}
              </button>
              <button
                type="button"
                className={BTN_SECONDARY}
                onClick={() => {
                  if (window.confirm("¿Restablecer el borrador guardado en este dispositivo?")) {
                    resetDraft();
                  }
                }}
              >
                {OFERTAS_LOCALES_SHELL_COPY.resetDraft}
              </button>
              <Link href="/publicar/ofertas-locales/preview" className={BTN_PRIMARY}>
                {OFERTAS_LOCALES_SHELL_COPY.previewLink}
              </Link>
              <button type="button" className={BTN_PRIMARY} disabled title="Gate futuro">
                {OFERTAS_LOCALES_SHELL_COPY.publishDisabled}
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
