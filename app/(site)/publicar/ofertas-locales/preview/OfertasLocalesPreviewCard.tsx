"use client";

import Link from "next/link";
import {
  OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS,
  OFERTAS_LOCALES_PRODUCT_NAME,
} from "@/app/lib/ofertas-locales/ofertasLocalesConstants";
import {
  isOfertaLocalActiveByDates,
  isOfertaLocalExpired,
} from "@/app/lib/ofertas-locales/ofertasLocalesFormatting";
import { getOfertaLocalSocialLinks } from "@/app/lib/ofertas-locales/ofertasLocalesApplicationHelpers";
import {
  buildOfertaLocalTelHref,
  buildOfertaLocalWhatsAppHref,
  digitalCouponCtaLabel,
  formatOfertaLocalDateRange,
  getOfertaLocalMarketDisplayLabel,
  hasOfertaLocalCouponAsset,
  hasOfertaLocalFlyerAsset,
  labelForBusinessCategory,
  labelForOfferType,
  labelForPrimaryAdFormatLane,
  membershipCtaLabel,
  resolveOfertaLocalDirectionsHref,
  resolveOfertaLocalWebsiteHref,
  shouldShowDigitalCouponBlock,
  shouldShowMembershipBlock,
} from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import {
  isOfertaLocalCouponPromotionFlow,
  isOfertaLocalWeeklyFlyerFlow,
} from "@/app/lib/ofertas-locales/ofertasLocalesApplicationHelpers";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OfertasLocalesPreviewAssetCards } from "./OfertasLocalesPreviewAssetCards";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

const PAGE_BG = "bg-[#FFFCF7]";
const CARD = "rounded-2xl border border-[#D4C4A8]/80 bg-white shadow-sm";
const BTN_PRIMARY =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45";
const BTN_OUTLINE =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D4C4A8] bg-[#FFFCF7] px-4 py-2.5 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40";
const PLACEHOLDER =
  "rounded-xl border border-dashed border-[#D4C4A8] bg-[#FDF8F0]/80 px-4 py-8 text-center text-sm text-[#1E1814]/55";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function ContactButton({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      className={BTN_OUTLINE}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {label}
    </a>
  );
}

function formatPreviewPrice(item: OfertaLocalItemReviewViewModel, lang: OfertasLocalesAppLang): string {
  const text = (item.offerText || item.priceText).trim();
  if (text) return text;
  if (typeof item.priceAmount === "number" && Number.isFinite(item.priceAmount)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(item.priceAmount);
  }
  return lang === "en" ? "Price not listed" : "Precio no disponible";
}

function AiDealPreviewCard({
  item,
  draft,
  lang,
}: {
  item: OfertaLocalItemReviewViewModel;
  draft: OfertaLocalDraft;
  lang: OfertasLocalesAppLang;
}) {
  const title = (item.couponTitle || item.itemName).trim();
  const price = formatPreviewPrice(item, lang);
  const dateRange = formatOfertaLocalDateRange(item.validFrom ?? draft.validFrom, item.validUntil ?? draft.validUntil);
  const details = (item.description || item.terms || item.dealType).trim();
  const cropUrl = item.sourceCropUrl.trim();

  return (
    <article className="overflow-hidden rounded-2xl border border-[#D4C4A8]/80 bg-white shadow-sm">
      {cropUrl ? (
        <div className="bg-[#FDF8F0]/80 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cropUrl}
            alt={title || (lang === "en" ? "Approved deal clip" : "Recorte aprobado")}
            className="mx-auto max-h-56 w-full rounded-xl border border-[#D4C4A8]/60 object-contain"
          />
        </div>
      ) : (
        <div className="bg-[#FDF8F0]/80 px-4 py-8 text-center text-xs text-[#1E1814]/55">
          {lang === "en" ? "No clip available yet." : "Sin recorte disponible todavía."}
        </div>
      )}
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-300/80 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-900">
            {lang === "en" ? "Ready to publish" : "Listo para publicar"}
          </span>
          {item.sourcePage != null ? (
            <span className="rounded-full border border-[#D4C4A8] bg-[#FDF8F0] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/65">
              {lang === "en" ? "Page" : "Página"} {item.sourcePage}
            </span>
          ) : null}
          {item.category ? (
            <span className="rounded-full border border-[#D4C4A8] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/65">
              {item.category}
            </span>
          ) : null}
          {dateRange ? (
            <span className="rounded-full border border-[#D4C4A8] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/65">
              {dateRange}
            </span>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7A1E2C]">
            {item.businessName || draft.businessName || OFERTAS_LOCALES_PRODUCT_NAME}
          </p>
          <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-tight text-[#1E1814]">
            {title || (lang === "en" ? "Approved deal" : "Oferta aprobada")}
          </h3>
        </div>
        <p className="rounded-xl bg-[#7A1E2C]/10 px-3 py-2 text-xl font-extrabold text-[#7A1E2C]">
          {price}
        </p>
        {details ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-[#1E1814]/75">{details}</p>
        ) : null}
      </div>
    </article>
  );
}

export function OfertasLocalesPreviewCard({
  draft,
  lang = "es",
  approvedAiItems = [],
  aiReviewLoading = false,
  aiReviewError = null,
  aiNeedsReviewCount = 0,
  aiTotalCount = 0,
  publishing = false,
  publishError = null,
  publishSuccess = null,
  onSubmitForReview,
}: {
  draft: OfertaLocalDraft;
  lang?: OfertasLocalesAppLang;
  approvedAiItems?: OfertaLocalItemReviewViewModel[];
  aiReviewLoading?: boolean;
  aiReviewError?: string | null;
  aiNeedsReviewCount?: number;
  aiTotalCount?: number;
  publishing?: boolean;
  publishError?: string | null;
  publishSuccess?: { id: string; status: string } | null;
  onSubmitForReview?: () => void;
}) {
  const offerLabel = labelForOfferType(draft.offerType, lang);
  const primaryFormatLabel = labelForPrimaryAdFormatLane(draft, lang);
  const categoryLabel = labelForBusinessCategory(draft.businessCategory, lang);
  const marketLabel = getOfertaLocalMarketDisplayLabel(draft, lang);
  const isFlyer = isOfertaLocalWeeklyFlyerFlow(draft.offerType);
  const isCouponPromo = isOfertaLocalCouponPromotionFlow(draft.offerType);
  const dateRange = formatOfertaLocalDateRange(draft.validFrom, draft.validUntil);
  const expired = draft.validUntil.trim() ? isOfertaLocalExpired(draft.validUntil) : false;
  const notYetActive =
    draft.validFrom.trim() && draft.validUntil.trim()
      ? !isOfertaLocalActiveByDates(draft.validFrom, draft.validUntil) && !expired
      : false;

  const telHref = buildOfertaLocalTelHref(draft.phone);
  const waHref = buildOfertaLocalWhatsAppHref(draft.whatsapp || draft.phone, draft.businessName);
  const webHref = resolveOfertaLocalWebsiteHref(draft.websiteUrl);
  const directionsHref = resolveOfertaLocalDirectionsHref(draft);

  const locationLine = [draft.address, draft.city, draft.state, draft.zipCode]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(", ");

  const showMembership = shouldShowMembershipBlock(draft);
  const showDigitalCoupon = shouldShowDigitalCouponBlock(draft);
  const socialLinks = getOfertaLocalSocialLinks(draft);
  const membershipHref = resolveOfertaLocalWebsiteHref(draft.membershipUrl);
  const digitalCouponHref = resolveOfertaLocalWebsiteHref(draft.digitalCouponUrl);
  const previewNotice =
    lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.previewNoticeEn : OFERTAS_LOCALES_PREVIEW_COPY.previewNoticeEs;

  return (
    <div className={cx("min-h-screen", PAGE_BG)}>
      <div className="mx-auto max-w-lg px-4 py-8 pb-16 sm:px-6">
        {/* A. Preview notice */}
        <div className="mb-6 rounded-xl border border-[#7A1E2C]/25 bg-[#7A1E2C]/5 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-[#7A1E2C]">{previewNotice}</p>
          <p className="mt-1 text-xs text-[#1E1814]/65">
            {lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.previewNoticeEs : OFERTAS_LOCALES_PREVIEW_COPY.previewNoticeEn}
          </p>
        </div>

        {/* B. Offer hero */}
        <header className={cx(CARD, "p-5 sm:p-6")}>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A1E2C]">
            Leonix · {OFERTAS_LOCALES_PRODUCT_NAME}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {primaryFormatLabel ? (
              <span className="inline-block rounded-lg border border-[#D4C4A8] bg-[#FDF8F0] px-2.5 py-1 text-xs font-medium text-[#7A1E2C]">
                {primaryFormatLabel}
              </span>
            ) : null}
            {offerLabel && offerLabel !== primaryFormatLabel ? (
              <span className="inline-block rounded-lg border border-[#D4C4A8]/80 bg-white px-2.5 py-1 text-xs font-medium text-[#1E1814]/75">
                {offerLabel}
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-[#1E1814]">
            {draft.title.trim() || "Oferta local"}
          </h1>
          {draft.businessName.trim() ? (
            <p className="mt-1 text-base font-medium text-[#1E1814]/85">{draft.businessName}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#1E1814]/60">
            {categoryLabel ? <span>{categoryLabel}</span> : null}
            {marketLabel ? (
              <span>
                {categoryLabel ? "· " : ""}
                {marketLabel}
              </span>
            ) : null}
          </div>
          {dateRange ? (
            <p className="mt-3 text-sm text-[#1E1814]/75">
              <span className="font-semibold text-[#1E1814]/80">
                {lang === "en" ? "Valid: " : "Válido: "}
              </span>
              {dateRange}
            </p>
          ) : null}
          {expired ? (
            <p className="mt-2 rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {OFERTAS_LOCALES_PREVIEW_COPY.expiredWarningEs}
              <span className="mt-0.5 block text-[#1E1814]/55">
                {OFERTAS_LOCALES_PREVIEW_COPY.expiredWarning}
              </span>
            </p>
          ) : null}
          {notYetActive ? (
            <p className="mt-2 rounded-lg border border-[#D4C4A8] bg-[#FDF8F0] px-3 py-2 text-xs text-[#1E1814]/70">
              {OFERTAS_LOCALES_PREVIEW_COPY.notYetActiveEs}
            </p>
          ) : null}
        </header>

        <div className="mt-4 space-y-4">
          {draft.wantsAiSearchableSpecials ? (
            <section className={cx(CARD, "p-5")}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1E1814]/70">
                    {lang === "en" ? "Reviewed AI deals" : "Ofertas AI revisadas"}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#1E1814]/60">
                    {lang === "en"
                      ? "Only approved AI suggestions appear in this preview. Rejected and needs-review items are excluded."
                      : "Solo las sugerencias AI aprobadas aparecen en esta vista previa. Las rechazadas y pendientes se excluyen."}
                  </p>
                </div>
                <span className="rounded-full border border-[#D4C4A8] bg-[#FDF8F0] px-3 py-1 text-xs font-semibold text-[#7A1E2C]">
                  {approvedAiItems.length}/{aiTotalCount} {lang === "en" ? "approved" : "aprobadas"}
                </span>
              </div>
              {aiReviewLoading ? (
                <p className="mt-4 text-sm text-[#1E1814]/60">
                  {lang === "en" ? "Loading reviewed deals…" : "Cargando ofertas revisadas…"}
                </p>
              ) : null}
              {aiReviewError ? (
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {aiReviewError}
                </p>
              ) : null}
              {aiNeedsReviewCount > 0 ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
                  {lang === "en"
                    ? `Finish reviewing ${aiNeedsReviewCount} AI suggestion(s) before submitting.`
                    : `Termina de revisar ${aiNeedsReviewCount} sugerencia(s) AI antes de enviar.`}
                </p>
              ) : null}
              {!aiReviewLoading && approvedAiItems.length === 0 ? (
                <div className={cx(PLACEHOLDER, "mt-4")}>
                  {lang === "en"
                    ? "No approved AI deal cards yet. Go back to Step 5 to approve or reject suggestions."
                    : "Todavía no hay tarjetas AI aprobadas. Regresa al Paso 5 para aprobar o rechazar sugerencias."}
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {approvedAiItems.map((item) => (
                    <AiDealPreviewCard key={item.id} item={item} draft={draft} lang={lang} />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {/* C. Offer content */}
          <section className={cx(CARD, "p-5")}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1E1814]/70">
              {lang === "en" ? "Deal details" : "Detalles de la oferta"}
            </h2>
            {draft.description.trim() ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#1E1814]/85">
                {draft.description}
              </p>
            ) : null}
            {draft.couponText.trim() ? (
              <div className="mt-4 rounded-xl border border-[#7A1E2C]/20 bg-[#7A1E2C]/5 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-[#7A1E2C]">
                  {lang === "en" ? "Coupon" : "Cupón"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[#1E1814]">{draft.couponText}</p>
              </div>
            ) : null}
          {isFlyer && (draft.flyerTitle.trim() || draft.title.trim()) ? (
            <p className="mt-3 text-sm text-[#1E1814]/75">
              <span className="font-medium">{lang === "en" ? "Flyer: " : "Volante: "}</span>
              {draft.flyerTitle.trim() || draft.title}
            </p>
          ) : null}
          {isFlyer ? (
            <OfertasLocalesPreviewAssetCards
              draft={draft}
              bucket="flyerAssets"
              title={OFERTAS_LOCALES_PREVIEW_COPY.assetsSectionFlyer}
              lang={lang}
            />
          ) : null}
          {isFlyer && !hasOfertaLocalFlyerAsset(draft) ? (
            <div className={cx(PLACEHOLDER, "mt-4")}>
              {lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.flyerPlaceholder : OFERTAS_LOCALES_PREVIEW_COPY.flyerPlaceholderEs}
            </div>
          ) : null}
          {isCouponPromo ? (
            <OfertasLocalesPreviewAssetCards
              draft={draft}
              bucket="couponAssets"
              title={OFERTAS_LOCALES_PREVIEW_COPY.assetsSectionCoupon}
              lang={lang}
            />
          ) : null}
          {isCouponPromo && !hasOfertaLocalCouponAsset(draft) && draft.couponText.trim() ? (
            <div className={cx(PLACEHOLDER, "mt-3")}>
              {lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.couponAssetPlaceholder : OFERTAS_LOCALES_PREVIEW_COPY.couponAssetPlaceholder}
            </div>
          ) : null}
          </section>

          {/* D. Business / location */}
          <section className={cx(CARD, "p-5")}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1E1814]/70">
              {lang === "en" ? "Business and location" : "Negocio y ubicación"}
            </h2>
            {locationLine ? (
              <p className="mt-3 text-sm text-[#1E1814]/85">{locationLine}</p>
            ) : (
              <p className="mt-3 text-sm text-[#1E1814]/45">
                {lang === "en" ? "Location not listed in the draft." : "Ubicación no indicada en el borrador."}
              </p>
            )}
            {draft.serviceZipCodes.length > 0 ? (
              <p className="mt-2 text-xs text-[#1E1814]/60">
                {lang === "en" ? "Service ZIPs: " : "ZIPs de servicio: "}
                {draft.serviceZipCodes.join(", ")}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <ContactButton
                href={telHref}
                label={lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.call : OFERTAS_LOCALES_PREVIEW_COPY.callEs}
              />
              <ContactButton href={waHref} label={OFERTAS_LOCALES_PREVIEW_COPY.whatsapp} external />
              <ContactButton
                href={webHref}
                label={lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.website : OFERTAS_LOCALES_PREVIEW_COPY.websiteEs}
                external
              />
              <ContactButton
                href={directionsHref}
                label={lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.directions : OFERTAS_LOCALES_PREVIEW_COPY.directionsEs}
                external
              />
            </div>
          </section>

          {/* E. Membership */}
          {showMembership ? (
            <section className={cx(CARD, "border-[#7A1E2C]/20 p-5")}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7A1E2C]">
                {lang === "en" ? "Rewards / membership" : "Recompensas / membresía"}
              </h2>
              {draft.requiresMembershipForDeals ? (
                <p className="mt-2 text-xs font-medium text-[#7A1E2C]">
                  {lang === "en"
                    ? "A rewards account is required for these deals"
                    : "Se requiere cuenta de recompensas para estas ofertas"}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-[#1E1814]/80">{OFERTAS_LOCALES_PREVIEW_COPY.membershipCopyEn}</p>
              <p className="mt-1 text-xs text-[#1E1814]/60">{OFERTAS_LOCALES_PREVIEW_COPY.membershipCopyEs}</p>
              {draft.membershipNote.trim() ? (
                <p className="mt-2 text-sm text-[#1E1814]/75">{draft.membershipNote}</p>
              ) : null}
              {membershipHref ? (
                <a
                  href={membershipHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cx(BTN_PRIMARY, "mt-4")}
                >
                  {membershipCtaLabel(lang)}
                </a>
              ) : (
                <p className="mt-3 text-xs text-[#1E1814]/50">
                  {lang === "en"
                    ? `${OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS.signUpBeforeYouGoEn} — URL pending`
                    : `${OFERTAS_LOCALES_MEMBERSHIP_CTA_DEFAULTS.signUpBeforeYouGoEs} — URL pendiente`}
                </p>
              )}
            </section>
          ) : null}

          {/* F. Digital coupon */}
          {showDigitalCoupon ? (
            <section className={cx(CARD, "p-5")}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1E1814]/70">
                {lang === "en" ? "Digital coupon" : "Cupón digital"}
              </h2>
              {draft.digitalCouponNote.trim() ? (
                <p className="mt-2 text-sm text-[#1E1814]/80">{draft.digitalCouponNote}</p>
              ) : null}
              {digitalCouponHref ? (
                <a
                  href={digitalCouponHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cx(BTN_PRIMARY, "mt-4")}
                >
                  {digitalCouponCtaLabel(lang)}
                </a>
              ) : null}
            </section>
          ) : null}

          {/* Social links — only when URLs exist (Stack 8) */}
          {socialLinks.length > 0 ? (
            <section className={cx(CARD, "p-5")}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1E1814]/70">
                {lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.followUsEn : OFERTAS_LOCALES_PREVIEW_COPY.followUsEs}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.key}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={BTN_OUTLINE}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {/* G. AI interest (intent only — not active) */}
          {draft.wantsAiSearchableSpecials ? (
            <p className="rounded-xl border border-[#D4C4A8]/60 bg-[#FDF8F0]/80 px-4 py-3 text-center text-xs text-[#1E1814]/60">
              {lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.aiInterestEn : OFERTAS_LOCALES_PREVIEW_COPY.aiInterestEs}
            </p>
          ) : null}

          {/* Featured placement intent — internal note only, not active placement */}
          {draft.wantsFeaturedPlacement ? (
            <p className="rounded-xl border border-[#D4C4A8]/60 bg-[#FDF8F0]/80 px-4 py-3 text-center text-xs text-[#1E1814]/60">
              {lang === "en"
                ? OFERTAS_LOCALES_PREVIEW_COPY.featuredInterestEn
                : OFERTAS_LOCALES_PREVIEW_COPY.featuredInterestEs}
            </p>
          ) : null}

          <span className="sr-only" aria-hidden>
            {String(draft.isMagazinePickupPartner)}
            {draft.magazineDistributionStatus}
          </span>

          {/* H. AI teaser */}
          <p className="text-center text-[10px] uppercase tracking-wide text-[#1E1814]/40">
            {OFERTAS_LOCALES_PREVIEW_COPY.aiTeaser}
            <span className="mx-1">·</span>
            {OFERTAS_LOCALES_PREVIEW_COPY.aiTeaserEs}
          </p>

          {/* I. Actions */}
          {publishSuccess ? (
            <div className="rounded-xl border border-emerald-300/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-semibold">
                {lang === "en" ? "Submitted for Leonix review." : "Enviado para revisión de Leonix."}
              </p>
              <p className="mt-1 text-xs">
                {lang === "en"
                  ? "Your listing is not public until the Leonix team approves it."
                  : "Tu anuncio no será público hasta que el equipo de Leonix lo apruebe."}
              </p>
            </div>
          ) : null}
          {publishError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {publishError}
            </p>
          ) : null}
          <div className="grid gap-3 pt-2 sm:flex sm:flex-wrap">
            <Link href={`/publicar/ofertas-locales?lang=${lang}`} className={BTN_PRIMARY}>
              {lang === "en"
                ? OFERTAS_LOCALES_PREVIEW_COPY.backToEditEn
                : OFERTAS_LOCALES_PREVIEW_COPY.backToEdit}
            </Link>
            <Link href={`/publicar/ofertas-locales?lang=${lang}`} className={BTN_OUTLINE}>
              {lang === "en" ? "Back to review" : "Volver a revisión"}
            </Link>
            <button
              type="button"
              className={BTN_PRIMARY}
              disabled={publishing || aiNeedsReviewCount > 0 || !onSubmitForReview}
              onClick={onSubmitForReview}
              title={
                aiNeedsReviewCount > 0
                  ? lang === "en"
                    ? "Finish AI review before submitting"
                    : "Termina la revisión AI antes de enviar"
                  : undefined
              }
            >
              {publishing
                ? lang === "en"
                  ? "Submitting…"
                  : "Enviando…"
                : lang === "en"
                  ? "Submit for review"
                  : "Enviar para revisión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
