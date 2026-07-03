"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  isOfertaLocalActiveByDates,
  isOfertaLocalExpired,
} from "@/app/lib/ofertas-locales/ofertasLocalesFormatting";
import {
  buildOfertaLocalMailtoHref,
  buildOfertaLocalTelHref,
  buildOfertaLocalWhatsAppHref,
  digitalCouponCtaLabel,
  formatOfertaLocalDateRange,
  getOfertaLocalMarketDisplayLabel,
  getOfertaLocalPreviewHeroAsset,
  getOfertaLocalSocialLinkPillClass,
  getOfertaLocalSocialLinksByCategory,
  labelForBusinessCategory,
  labelForOfferType,
  labelForPrimaryAdFormatLane,
  membershipCtaLabel,
  buildOfertaLocalPreviewLocationLine,
  resolveOfertaLocalContactEmail,
  resolveOfertaLocalDirectionsHref,
  resolveOfertaLocalWebsiteHref,
  shouldShowDigitalCouponBlock,
  shouldShowMembershipBlock,
} from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import type { OfertaLocalDraft, OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OfertasFutureCouponWalletCard } from "./OfertasFutureCouponWalletCard";
import { OfertasFutureRoutePlannerCard } from "./OfertasFutureRoutePlannerCard";
import { OfertasFutureShoppingListCard } from "./OfertasFutureShoppingListCard";
import { OfertasLocalesPreviewHeroVisual } from "./OfertasLocalesPreviewHeroVisual";
import { OfertasLocalesPreviewProductGrid } from "./OfertasLocalesPreviewProductGrid";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

const PAGE_BG = "bg-[#FFFCF7]";
const PAGE_MAX = "mx-auto w-full max-w-[1240px] px-4 py-8 pb-20 sm:px-6 lg:py-10";
const CARD = "rounded-2xl border border-[#D4C4A8]/80 bg-white shadow-sm";
const BTN_PRIMARY =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45";
const BTN_OUTLINE =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D4C4A8] bg-[#FFFCF7] px-4 py-2.5 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function ContactButton({
  href,
  label,
  external,
  primary,
}: {
  href: string;
  label: string;
  external?: boolean;
  primary?: boolean;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      className={primary ? BTN_PRIMARY : BTN_OUTLINE}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {label}
    </a>
  );
}

function SocialPill({ href, label, pillClass }: { href: string; label: string; pillClass: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        "inline-flex min-h-11 items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold",
        pillClass
      )}
    >
      {label}
    </a>
  );
}

function EmailRow({ email, mailtoHref, lang }: { email: string; mailtoHref: string; lang: OfertasLocalesAppLang }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [email]);
  if (!email) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-[#1E1814]/85">{email}</span>
      {mailtoHref ? (
        <a href={mailtoHref} className={BTN_OUTLINE}>
          {lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.emailEn : OFERTAS_LOCALES_PREVIEW_COPY.emailEs}
        </a>
      ) : null}
      <button type="button" className={BTN_OUTLINE} onClick={() => void handleCopy()}>
        {copied
          ? lang === "en"
            ? OFERTAS_LOCALES_PREVIEW_COPY.shareCopiedEn
            : OFERTAS_LOCALES_PREVIEW_COPY.shareCopiedEs
          : lang === "en"
            ? OFERTAS_LOCALES_PREVIEW_COPY.copyEmailEn
            : OFERTAS_LOCALES_PREVIEW_COPY.copyEmailEs}
      </button>
    </div>
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
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const offerLabel = labelForOfferType(draft.offerType, lang);
  const primaryFormatLabel = labelForPrimaryAdFormatLane(draft, lang);
  const categoryLabel = labelForBusinessCategory(draft.businessCategory, lang);
  const marketLabel = getOfertaLocalMarketDisplayLabel(draft, lang);
  const dateRange = formatOfertaLocalDateRange(draft.validFrom, draft.validUntil);
  const expired = draft.validUntil.trim() ? isOfertaLocalExpired(draft.validUntil) : false;
  const notYetActive =
    draft.validFrom.trim() && draft.validUntil.trim()
      ? !isOfertaLocalActiveByDates(draft.validFrom, draft.validUntil) && !expired
      : false;

  const heroAsset = getOfertaLocalPreviewHeroAsset(draft);
  const locationLine = buildOfertaLocalPreviewLocationLine(draft);
  const telHref = buildOfertaLocalTelHref(draft.phone);
  const waHref = buildOfertaLocalWhatsAppHref(draft.whatsapp || draft.phone, draft.businessName);
  const webHref = resolveOfertaLocalWebsiteHref(draft.websiteUrl);
  const directionsHref = resolveOfertaLocalDirectionsHref(draft);
  const contactEmail = resolveOfertaLocalContactEmail(draft);
  const mailtoHref = buildOfertaLocalMailtoHref(draft.email, draft.businessName);
  const followLinks = getOfertaLocalSocialLinksByCategory(draft, "follow");
  const reviewLinks = getOfertaLocalSocialLinksByCategory(draft, "review");
  const businessLinks = getOfertaLocalSocialLinksByCategory(draft, "business");
  const showMembership = shouldShowMembershipBlock(draft);
  const showDigitalCoupon = shouldShowDigitalCouponBlock(draft);
  const membershipHref = resolveOfertaLocalWebsiteHref(draft.membershipUrl);
  const digitalCouponHref = resolveOfertaLocalWebsiteHref(draft.digitalCouponUrl);
  const hasAiProducts = draft.wantsAiSearchableSpecials && approvedAiItems.length > 0;

  const [shareCopied, setShareCopied] = useState(false);
  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: draft.title || draft.businessName,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* user cancelled share */
    }
  }, [draft.businessName, draft.title]);

  return (
    <div className={cx("min-h-screen", PAGE_BG)}>
      <div className={PAGE_MAX}>
        {/* Preview notice */}
        <div className="mb-6 rounded-xl border border-[#7A1E2C]/25 bg-[#7A1E2C]/5 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-[#7A1E2C]">
            {lang === "en" ? c.previewNoticeEn : c.previewNoticeEs}
          </p>
          <p className="mt-1 text-xs text-[#1E1814]/65">
            {lang === "en" ? c.previewNoticeEs : c.previewNoticeEn}
          </p>
        </div>

        {/* Page title */}
        <header className="mb-8 text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#B8860B]">Leonix</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#7A1E2C] sm:text-4xl">
            {lang === "en" ? c.pageTitleEn : c.pageTitleEs}
          </h1>
          <p className="mt-2 text-sm text-[#1E1814]/65">
            {lang === "en" ? c.pageSubtitleEn : c.pageSubtitleEs}
          </p>
        </header>

        {/* Hero 3-column layout */}
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left — flyer/coupon visual */}
          <div className="lg:col-span-4">
            <OfertasLocalesPreviewHeroVisual draft={draft} heroAsset={heroAsset} lang={lang} />
          </div>

          {/* Center — offer hub */}
          <div className="lg:col-span-5">
            <div className={cx(CARD, "h-full p-5 sm:p-6")}>
              <div className="flex flex-wrap gap-2">
                {primaryFormatLabel ? (
                  <span className="rounded-lg border border-[#D4C4A8] bg-[#FDF8F0] px-2.5 py-1 text-xs font-medium text-[#7A1E2C]">
                    {primaryFormatLabel}
                  </span>
                ) : null}
                {offerLabel && offerLabel !== primaryFormatLabel ? (
                  <span className="rounded-lg border border-[#D4C4A8]/80 bg-white px-2.5 py-1 text-xs text-[#1E1814]/75">
                    {offerLabel}
                  </span>
                ) : null}
                {draft.wantsAiSearchableSpecials ? (
                  <span className="rounded-lg border border-emerald-300/80 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900">
                    {lang === "en" ? c.aiSearchableEn : c.aiSearchableEs}
                  </span>
                ) : null}
              </div>

              {draft.businessName.trim() ? (
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#B8860B]">
                  {draft.businessName}
                </p>
              ) : null}
              <h2 className="mt-1 font-serif text-2xl font-bold leading-tight text-[#1E1814] sm:text-3xl">
                {draft.title.trim() || (lang === "en" ? "Local offer" : "Oferta local")}
              </h2>

              <div className="mt-2 flex flex-wrap gap-x-2 text-xs text-[#1E1814]/60">
                {categoryLabel ? <span>{categoryLabel}</span> : null}
                {marketLabel ? (
                  <span>
                    {categoryLabel ? "· " : ""}
                    {marketLabel}
                  </span>
                ) : null}
              </div>

              {dateRange ? (
                <p className="mt-4 text-sm text-[#1E1814]/75">
                  <span className="font-semibold">
                    {lang === "en" ? `${c.validLabelEn}: ` : `${c.validLabelEs}: `}
                  </span>
                  {dateRange}
                </p>
              ) : null}

              {expired ? (
                <p className="mt-3 rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {c.expiredWarningEs}
                </p>
              ) : null}
              {notYetActive ? (
                <p className="mt-3 rounded-lg border border-[#D4C4A8] bg-[#FDF8F0] px-3 py-2 text-xs text-[#1E1814]/70">
                  {c.notYetActiveEs}
                </p>
              ) : null}

              {locationLine ? (
                <p className="mt-4 text-sm text-[#1E1814]/80">{locationLine}</p>
              ) : null}

              {draft.description.trim() ? (
                <div className="mt-5 border-t border-[#D4C4A8]/50 pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[#1E1814]/55">
                    {lang === "en" ? c.aboutBusinessEn : c.aboutBusinessEs}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#1E1814]/80">
                    {draft.description}
                  </p>
                </div>
              ) : null}

              {draft.couponText.trim() ? (
                <div className="mt-4 rounded-xl border border-[#7A1E2C]/20 bg-[#7A1E2C]/5 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-[#7A1E2C]">
                    {lang === "en" ? c.couponPromotionEn : c.couponPromotionEs}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#1E1814]">{draft.couponText}</p>
                </div>
              ) : null}

              <p className="mt-5 text-center text-xs font-medium text-emerald-800">
                {lang === "en" ? c.publishedOnLeonixEn : c.publishedOnLeonixEs}
              </p>

              {/* Primary CTAs */}
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {heroAsset?.href ? (
                  <ContactButton
                    href={heroAsset.href}
                    label={lang === "en" ? c.viewOfferEn : c.viewOfferEs}
                    external
                    primary
                  />
                ) : null}
                <button type="button" className={BTN_OUTLINE} onClick={() => void handleShare()}>
                  {shareCopied
                    ? lang === "en"
                      ? c.shareCopiedEn
                      : c.shareCopiedEs
                    : lang === "en"
                      ? c.shareEn
                      : c.shareEs}
                </button>
                <ContactButton
                  href={directionsHref}
                  label={lang === "en" ? c.directions : c.directionsEs}
                  external
                />
                <ContactButton
                  href={telHref}
                  label={lang === "en" ? c.call : c.callEs}
                />
                <ContactButton href={waHref} label={c.whatsapp} external />
                <ContactButton
                  href={webHref}
                  label={lang === "en" ? c.website : c.websiteEs}
                  external
                />
              </div>

              {contactEmail ? (
                <div className="mt-4 border-t border-[#D4C4A8]/50 pt-4">
                  <EmailRow email={contactEmail} mailtoHref={mailtoHref} lang={lang} />
                </div>
              ) : null}

              {/* Social inline */}
              {followLinks.length || reviewLinks.length || businessLinks.length ? (
                <div className="mt-5 space-y-4 border-t border-[#D4C4A8]/50 pt-4">
                  {followLinks.length > 0 ? (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#1E1814]/55">
                        {lang === "en" ? c.followUsEn : c.followUsEs}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {followLinks.map((link) => (
                          <SocialPill
                            key={link.key}
                            href={link.url}
                            label={link.label}
                            pillClass={getOfertaLocalSocialLinkPillClass(link.key)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {reviewLinks.length > 0 ? (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#1E1814]/55">
                        {lang === "en" ? c.reviewsEn : c.reviewsEs}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {reviewLinks.map((link) => (
                          <SocialPill
                            key={link.key}
                            href={link.url}
                            label={link.label}
                            pillClass={getOfertaLocalSocialLinkPillClass(link.key)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {businessLinks.length > 0 ? (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#1E1814]/55">
                        {lang === "en" ? c.googleBusinessEn : c.googleBusinessEs}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {businessLinks.map((link) => (
                          <SocialPill
                            key={link.key}
                            href={link.url}
                            label={link.label}
                            pillClass={getOfertaLocalSocialLinkPillClass(link.key)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* Right — action / future cards */}
          <div className="space-y-4 lg:col-span-3">
            {directionsHref && locationLine ? (
              <div className={cx(CARD, "p-4")}>
                <h3 className="font-serif text-lg font-semibold text-[#1E1814]">
                  {lang === "en" ? c.directionsCardTitleEn : c.directionsCardTitleEs}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#1E1814]/65">{locationLine}</p>
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cx(BTN_PRIMARY, "mt-4 w-full")}
                >
                  {lang === "en" ? c.directions : c.directionsEs}
                </a>
              </div>
            ) : null}

            {(telHref || waHref || contactEmail || webHref) ? (
              <div className={cx(CARD, "p-4")}>
                <h3 className="font-serif text-lg font-semibold text-[#1E1814]">
                  {lang === "en" ? c.contactBusinessEn : c.contactBusinessEs}
                </h3>
                <div className="mt-3 grid gap-2">
                  <ContactButton href={telHref} label={lang === "en" ? c.call : c.callEs} />
                  <ContactButton href={waHref} label={c.whatsapp} external />
                  <ContactButton
                    href={webHref}
                    label={lang === "en" ? c.website : c.websiteEs}
                    external
                  />
                </div>
              </div>
            ) : null}

            <OfertasFutureShoppingListCard lang={lang} />
            <OfertasFutureRoutePlannerCard lang={lang} />
            <OfertasFutureCouponWalletCard lang={lang} />

            {showMembership && membershipHref ? (
              <div className={cx(CARD, "border-[#7A1E2C]/20 p-4")}>
                <h3 className="text-sm font-semibold text-[#7A1E2C]">
                  {lang === "en" ? "Rewards / membership" : "Recompensas / membresía"}
                </h3>
                <a
                  href={membershipHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cx(BTN_PRIMARY, "mt-3 w-full")}
                >
                  {membershipCtaLabel(lang)}
                </a>
              </div>
            ) : null}

            {showDigitalCoupon && digitalCouponHref ? (
              <div className={cx(CARD, "p-4")}>
                <h3 className="text-sm font-semibold text-[#1E1814]">
                  {lang === "en" ? "Digital coupon" : "Cupón digital"}
                </h3>
                <a
                  href={digitalCouponHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cx(BTN_PRIMARY, "mt-3 w-full")}
                >
                  {digitalCouponCtaLabel(lang)}
                </a>
              </div>
            ) : null}
          </div>
        </div>

        {/* Product grid */}
        <OfertasLocalesPreviewProductGrid
          draft={draft}
          items={approvedAiItems}
          lang={lang}
          loading={aiReviewLoading}
          error={aiReviewError}
          needsReviewCount={aiNeedsReviewCount}
          totalCount={aiTotalCount}
        />

        {/* Intent notes */}
        {draft.wantsFeaturedPlacement ? (
          <p className="mt-6 rounded-xl border border-[#D4C4A8]/60 bg-[#FDF8F0]/80 px-4 py-3 text-center text-xs text-[#1E1814]/60">
            {lang === "en" ? c.featuredInterestEn : c.featuredInterestEs}
          </p>
        ) : null}

        <span className="sr-only" aria-hidden>
          {String(draft.isMagazinePickupPartner)}
          {draft.magazineDistributionStatus}
          {hasAiProducts ? "ai-products" : ""}
        </span>

        {/* Owner preview controls — separated from shopper CTAs */}
        <section className="mt-10 rounded-2xl border border-[#7A1E2C]/20 bg-[#7A1E2C]/5 p-5 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7A1E2C]">
            {lang === "en" ? c.ownerControlsEn : c.ownerControlsEs}
          </h2>

          {publishSuccess ? (
            <div className="mt-4 rounded-xl border border-emerald-300/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
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
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {publishError}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/publicar/ofertas-locales?lang=${lang}`} className={BTN_PRIMARY}>
              {lang === "en" ? c.backToEditEn : c.backToEdit}
            </Link>
            <Link href={`/publicar/ofertas-locales?lang=${lang}&step=7`} className={BTN_OUTLINE}>
              {lang === "en" ? c.backToReviewEn : c.backToReviewEs}
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
                  ? c.submittingEn
                  : c.submittingEs
                : lang === "en"
                  ? c.submitForReviewEn
                  : c.submitForReviewEs}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
