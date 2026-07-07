"use client";

import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import { FiAward, FiCopy, FiGlobe, FiLock, FiMail, FiMapPin, FiPhone, FiShare2 } from "react-icons/fi";
import { FaGoogle, FaWhatsapp } from "react-icons/fa";
import {
  SiFacebook,
  SiInstagram,
  SiLinkedin,
  SiPinterest,
  SiSnapchat,
  SiTiktok,
  SiX,
  SiYelp,
  SiYoutube,
} from "react-icons/si";
import {
  isOfertaLocalActiveByDates,
  isOfertaLocalExpired,
} from "@/app/lib/ofertas-locales/ofertasLocalesFormatting";
import type { OfertaLocalSocialLink, OfertaLocalSocialLinkKey } from "@/app/lib/ofertas-locales/ofertasLocalesApplicationHelpers";
import {
  buildOfertaLocalMailtoHref,
  buildOfertaLocalTelHref,
  buildOfertaLocalWhatsAppHref,
  digitalCouponCtaLabel,
  formatOfertaLocalDateRange,
  getOfertaLocalMarketDisplayLabel,
  getOfertaLocalPreviewHeroAsset,
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
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import type { SupportedLang } from "@/app/lib/language";
import { LeonixMobileScrollRail } from "@/app/(site)/components/mobile/LeonixMobileScrollRail";
import { LeonixResponsiveShell } from "@/app/(site)/components/mobile/LeonixResponsiveShell";
import { OfertasLocalesPreviewHeroVisual } from "./OfertasLocalesPreviewHeroVisual";
import { OfertasLocalesMiniMapPreview } from "./OfertasLocalesMiniMapPreview";
import { OfertasLocalesPreviewProductGrid } from "./OfertasLocalesPreviewProductGrid";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

const SECTION_ANCHOR = "scroll-mt-24";
const CHIP =
  "inline-flex min-h-9 shrink-0 items-center rounded-full border border-[#D4C4A8] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#7A1E2C] shadow-sm transition hover:border-[#7A1E2C]/40 hover:bg-[#FDF8F0] sm:px-3 sm:py-2 sm:text-xs";
const STICKY_ACTION =
  "flex min-h-10 min-w-[40px] flex-1 flex-col items-center justify-center gap-0 rounded-md px-0.5 py-1 text-[9px] font-semibold leading-tight text-[#1E1814] transition hover:bg-[#FDF8F0] sm:min-h-11 sm:min-w-[44px] sm:gap-0.5 sm:rounded-lg sm:px-1 sm:py-1.5 sm:text-[10px]";
const CARD = "rounded-2xl border border-[#D4C4A8]/80 bg-white shadow-sm";
const BTN_PRIMARY =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45";
const BTN_OUTLINE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#D4C4A8] bg-[#FFFCF7] px-4 py-2.5 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40";
const BTN_WHATSAPP =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#20BD5A]";
const HUB_SECTION =
  "border-b border-[#E8D9C4]/80 pb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1E1814]";

const SOCIAL_BRAND: Record<OfertaLocalSocialLinkKey, { background: string; color: string; border?: string }> = {
  facebook: { background: "#1877F2", color: "#FFFFFF" },
  instagram: {
    background: "linear-gradient(135deg, #833AB4 0%, #E1306C 45%, #F77737 100%)",
    color: "#FFFFFF",
  },
  tiktok: { background: "#010101", color: "#FFFFFF" },
  xTwitter: { background: "#000000", color: "#FFFFFF" },
  youtube: { background: "#FF0000", color: "#FFFFFF" },
  linkedin: { background: "#0A66C2", color: "#FFFFFF" },
  snapchat: { background: "#FFFC00", color: "#000000", border: "1px solid rgba(0,0,0,0.12)" },
  pinterest: { background: "#E60023", color: "#FFFFFF" },
  googleBusiness: { background: "#4285F4", color: "#FFFFFF" },
  googleReview: { background: "#FBBC04", color: "#1E1814" },
  yelp: { background: "#D32323", color: "#FFFFFF" },
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function SocialBrandIcon({ linkKey }: { linkKey: OfertaLocalSocialLinkKey }) {
  const cls = "h-5 w-5 shrink-0";
  const p = { className: cls, "aria-hidden": true as const };
  switch (linkKey) {
    case "facebook":
      return <SiFacebook {...p} />;
    case "instagram":
      return <SiInstagram {...p} />;
    case "tiktok":
      return <SiTiktok {...p} />;
    case "xTwitter":
      return <SiX {...p} />;
    case "youtube":
      return <SiYoutube {...p} />;
    case "linkedin":
      return <SiLinkedin {...p} />;
    case "snapchat":
      return <SiSnapchat {...p} />;
    case "pinterest":
      return <SiPinterest {...p} />;
    case "googleBusiness":
    case "googleReview":
      return <FaGoogle {...p} />;
    case "yelp":
      return <SiYelp {...p} />;
    default:
      return <FiGlobe {...p} />;
  }
}

function ContactButton({
  href,
  label,
  external,
  primary,
  whatsapp,
  icon,
  className,
}: {
  href: string;
  label: string;
  external?: boolean;
  primary?: boolean;
  whatsapp?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  if (!href) return null;
  const btnClass = whatsapp ? BTN_WHATSAPP : primary ? BTN_PRIMARY : BTN_OUTLINE;
  return (
    <a
      href={href}
      className={cx(btnClass, className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {icon}
      {label}
    </a>
  );
}

function SocialLinkButton({ link }: { link: OfertaLocalSocialLink }) {
  const style = SOCIAL_BRAND[link.key];
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 min-w-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition hover:opacity-90"
      style={{ background: style.background, color: style.color, border: style.border }}
      title={link.label}
    >
      <SocialBrandIcon linkKey={link.key} />
      <span className="hidden sm:inline">{link.label}</span>
    </a>
  );
}

type SectionNavItem = { id: string; label: string };

function PreviewSectionNav({ items, lang }: { items: SectionNavItem[]; lang: OfertasLocalesAppLang }) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  if (items.length === 0) return null;
  return (
    <nav
      className="mb-3 lg:hidden"
      aria-label={lang === "en" ? c.sectionNavAriaEn : c.sectionNavAriaEs}
    >
      <LeonixMobileScrollRail
        lang={lang}
        desktopMode="none"
        showRailDots={false}
        showScrollControls={false}
        ariaLabel={lang === "en" ? c.sectionNavAriaEn : c.sectionNavAriaEs}
        label={lang === "en" ? c.goToSectionEn : c.goToSectionEs}
      >
        {items.map((item) => (
          <a key={item.id} href={`#${item.id}`} className={CHIP}>
            {item.label}
          </a>
        ))}
      </LeonixMobileScrollRail>
    </nav>
  );
}

function HubCollapsibleGroup({
  id,
  title,
  defaultOpen,
  lang,
  children,
}: {
  id?: string;
  title: string;
  defaultOpen?: boolean;
  lang: OfertasLocalesAppLang;
  children: ReactNode;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  return (
    <div {...(id ? { id } : {})} className={SECTION_ANCHOR}>
      {/* Mobile: collapsible group */}
      <details
        className="rounded-lg border border-[#E8D9C4]/50 bg-[#FFFCF7]/50 p-2.5 lg:hidden lg:rounded-xl lg:p-4"
        open={defaultOpen}
      >
        <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 py-0.5 [&::-webkit-details-marker]:hidden">
          <span className={HUB_SECTION}>{title}</span>
          <span className="text-[9px] font-medium text-[#1E1814]/40 sm:text-[10px] sm:text-[#1E1814]/45">
            {lang === "en" ? c.openSectionEn : c.openSectionEs}
          </span>
        </summary>
        <div className="mt-2 sm:mt-3">{children}</div>
      </details>
      {/* Desktop: always open, Gate 1 premium grid cell */}
      <div className="hidden lg:block">
        <h3 className={HUB_SECTION}>{title}</h3>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function MobileStickyActionBar({
  lang,
  heroHref,
  flyerLabel,
  directionsHref,
  telHref,
  waHref,
  shareCopied,
  onShare,
}: {
  lang: OfertasLocalesAppLang;
  heroHref: string;
  flyerLabel: string;
  directionsHref: string;
  telHref: string;
  waHref: string;
  shareCopied: boolean;
  onShare: () => void;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D4C4A8]/70 bg-[#FFFCF7]/96 px-1 py-1 shadow-[0_-2px_12px_rgba(30,24,20,0.06)] backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))" }}
      role="region"
      aria-label={lang === "en" ? c.quickActionsEn : c.quickActionsEs}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5">
        {heroHref ? (
          <a href={heroHref} target="_blank" rel="noopener noreferrer" className={STICKY_ACTION}>
            <FiGlobe className="h-4 w-4 text-[#7A1E2C] sm:h-5 sm:w-5" aria-hidden />
            <span className="max-w-[4.5rem] truncate">{flyerLabel}</span>
          </a>
        ) : null}
        {directionsHref ? (
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className={STICKY_ACTION}
            aria-label={lang === "en" ? c.directions : c.directionsEs}
          >
            <FiMapPin className="h-4 w-4 text-[#7A1E2C] sm:h-5 sm:w-5" aria-hidden />
            <span className="max-w-[4.5rem] truncate">{lang === "en" ? c.directions : c.directionsEs}</span>
          </a>
        ) : null}
        {telHref ? (
          <a href={telHref} className={STICKY_ACTION} aria-label={lang === "en" ? c.call : c.callEs}>
            <FiPhone className="h-4 w-4 text-[#7A1E2C] sm:h-5 sm:w-5" aria-hidden />
            <span>{lang === "en" ? c.call : c.callEs}</span>
          </a>
        ) : null}
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className={STICKY_ACTION}
            aria-label={c.whatsapp}
          >
            <FaWhatsapp className="h-4 w-4 text-[#25D366] sm:h-5 sm:w-5" aria-hidden />
            <span className="max-w-[4.5rem] truncate">{c.whatsapp}</span>
          </a>
        ) : null}
        <button type="button" className={STICKY_ACTION} onClick={onShare} aria-label={lang === "en" ? c.shareEn : c.shareEs}>
          <FiShare2 className="h-4 w-4 text-[#7A1E2C] sm:h-5 sm:w-5" aria-hidden />
          <span className="max-w-[4.5rem] truncate">
            {shareCopied
              ? lang === "en"
                ? c.shareCopiedEn
                : c.shareCopiedEs
              : lang === "en"
                ? c.shareEn
                : c.shareEs}
          </span>
        </button>
      </div>
    </div>
  );
}

function PreviewBusinessHub({
  draft,
  lang,
  telHref,
  waHref,
  webHref,
  mailtoHref,
  directionsHref,
  locationLine,
}: {
  draft: OfertaLocalDraft;
  lang: OfertasLocalesAppLang;
  telHref: string;
  waHref: string;
  webHref: string;
  mailtoHref: string;
  directionsHref: string;
  locationLine: string;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  const contactEmail = resolveOfertaLocalContactEmail(draft);
  const followLinks = getOfertaLocalSocialLinksByCategory(draft, "follow");
  const reviewLinks = getOfertaLocalSocialLinksByCategory(draft, "review");
  const businessLinks = getOfertaLocalSocialLinksByCategory(draft, "business");
  const [emailCopied, setEmailCopied] = useState(false);

  const copyEmail = useCallback(async () => {
    if (!contactEmail) return;
    try {
      await navigator.clipboard.writeText(contactEmail);
      setEmailCopied(true);
      window.setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      setEmailCopied(false);
    }
  }, [contactEmail]);

  const hasContact = Boolean(telHref || waHref || webHref || contactEmail);
  const hasLocation = Boolean(locationLine || directionsHref);
  const hasFollow = followLinks.length > 0;
  const hasReviews = reviewLinks.length > 0;
  const hasBusiness = businessLinks.length > 0;

  if (!hasContact && !hasLocation && !hasFollow && !hasReviews && !hasBusiness) return null;

  const defaultOpenContact = hasContact;
  const defaultOpenLocation = !hasContact && hasLocation;
  const defaultOpenSocial = !hasContact && !hasLocation && (hasFollow || hasReviews || hasBusiness);

  return (
    <section className={cx(CARD, "mt-6 p-3 sm:p-5 lg:mt-8 lg:p-6")}>
      <h2 className="font-serif text-lg font-semibold text-[#1E1814] sm:text-xl">
        {lang === "en" ? c.businessHubEn : c.businessHubEs}
      </h2>
      <p className="mt-0.5 text-[11px] text-[#1E1814]/50 sm:mt-1 sm:text-xs sm:text-[#1E1814]/55">
        {lang === "en" ? c.businessHubSubtitleEn : c.businessHubSubtitleEs}
      </p>

      <div className="mt-3 space-y-2 sm:mt-6 sm:space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        {hasContact ? (
          <HubCollapsibleGroup
            id="contacto"
            title={lang === "en" ? c.contactBusinessEn : c.contactBusinessEs}
            defaultOpen={defaultOpenContact}
            lang={lang}
          >
            <div className="flex flex-wrap gap-2">
              <ContactButton href={telHref} label={lang === "en" ? c.call : c.callEs} icon={<FiPhone className="h-4 w-4" aria-hidden />} />
              <ContactButton
                href={waHref}
                label={c.whatsapp}
                external
                whatsapp
                icon={<FaWhatsapp className="h-4 w-4" aria-hidden />}
              />
              <ContactButton
                href={webHref}
                label={lang === "en" ? c.website : c.websiteEs}
                external
                icon={<FiGlobe className="h-4 w-4" aria-hidden />}
              />
            </div>
            {contactEmail ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 text-sm text-[#1E1814]/85">
                  <FiMail className="h-4 w-4 text-[#7A1E2C]" aria-hidden />
                  {contactEmail}
                </span>
                {mailtoHref ? (
                  <a href={mailtoHref} className={BTN_OUTLINE}>
                    {lang === "en" ? c.emailEn : c.emailEs}
                  </a>
                ) : null}
                <button type="button" className={BTN_OUTLINE} onClick={() => void copyEmail()}>
                  <FiCopy className="h-4 w-4" aria-hidden />
                  {emailCopied
                    ? lang === "en"
                      ? c.shareCopiedEn
                      : c.shareCopiedEs
                    : lang === "en"
                      ? c.copyEmailEn
                      : c.copyEmailEs}
                </button>
              </div>
            ) : null}
          </HubCollapsibleGroup>
        ) : null}

        {hasLocation ? (
          <HubCollapsibleGroup
            id="ubicacion"
            title={lang === "en" ? c.ourLocationEn : c.ourLocationEs}
            defaultOpen={defaultOpenLocation}
            lang={lang}
          >
            {locationLine ? (
              <OfertasLocalesMiniMapPreview
                locationLine={locationLine}
                directionsHref={directionsHref}
                lang={lang}
              />
            ) : directionsHref ? (
              <a href={directionsHref} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARY}>
                <FiMapPin className="h-4 w-4" aria-hidden />
                {lang === "en" ? c.directions : c.directionsEs}
              </a>
            ) : null}
          </HubCollapsibleGroup>
        ) : null}

        {hasFollow ? (
          <HubCollapsibleGroup
            id="redes"
            title={lang === "en" ? c.followUsEn : c.followUsEs}
            defaultOpen={defaultOpenSocial}
            lang={lang}
          >
            <div className="flex flex-wrap gap-2">
              {followLinks.map((link) => (
                <SocialLinkButton key={link.key} link={link} />
              ))}
            </div>
          </HubCollapsibleGroup>
        ) : null}

        {hasReviews ? (
          <HubCollapsibleGroup
            id={hasFollow ? undefined : "redes"}
            title={lang === "en" ? c.reviewsEn : c.reviewsEs}
            defaultOpen={!hasFollow && defaultOpenSocial}
            lang={lang}
          >
            <div className="flex flex-wrap gap-2">
              {reviewLinks.map((link) => (
                <SocialLinkButton key={link.key} link={link} />
              ))}
            </div>
          </HubCollapsibleGroup>
        ) : null}

        {hasBusiness ? (
          <HubCollapsibleGroup
            id={hasFollow || hasReviews ? undefined : "redes"}
            title={lang === "en" ? c.moreInfoEn : c.moreInfoEs}
            defaultOpen={!hasFollow && !hasReviews && defaultOpenSocial}
            lang={lang}
          >
            <div className="flex flex-wrap gap-2">
              {businessLinks.map((link) => (
                <SocialLinkButton key={link.key} link={link} />
              ))}
            </div>
          </HubCollapsibleGroup>
        ) : null}
      </div>
    </section>
  );
}

function OwnerPreviewControls({
  lang,
  editHref,
  editReviewHref,
  publishing,
  aiNeedsReviewCount,
  onSubmitForReview,
}: {
  lang: OfertasLocalesAppLang;
  editHref: string;
  editReviewHref: string;
  publishing: boolean;
  aiNeedsReviewCount: number;
  onSubmitForReview?: () => void;
}) {
  const c = OFERTAS_LOCALES_PREVIEW_COPY;
  return (
    <div className="mb-5 rounded-lg border border-[#D4C4A8]/70 bg-[#FDF8F0]/60 p-3 sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/50">
        {lang === "en" ? c.previewControlsEn : c.previewControlsEs}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link href={editHref} className={cx(BTN_OUTLINE, "min-h-10 px-3 py-2 text-xs sm:text-sm")}>
          {lang === "en" ? c.backToEditEn : c.backToEdit}
        </Link>
        <Link href={editReviewHref} className={cx(BTN_OUTLINE, "min-h-10 px-3 py-2 text-xs sm:text-sm")}>
          {lang === "en" ? c.backToReviewEn : c.backToReviewEs}
        </Link>
        <button
          type="button"
          className={cx(BTN_PRIMARY, "min-h-10 px-3 py-2 text-xs sm:text-sm")}
          disabled={publishing || aiNeedsReviewCount > 0 || !onSubmitForReview}
          onClick={onSubmitForReview}
          title={
            aiNeedsReviewCount > 0
              ? lang === "en"
                ? c.submitBlockedEn
                : c.submitBlockedEs
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
    </div>
  );
}

export function OfertasLocalesPreviewCard({
  draft,
  lang = "es",
  routeLang,
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
  routeLang?: SupportedLang;
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
  const resolvedRouteLang = routeLang ?? lang;
  const editHref = withClasificadosPublishLang("/publicar/ofertas-locales", resolvedRouteLang);
  const editReviewHref = withClasificadosPublishLang("/publicar/ofertas-locales", resolvedRouteLang, { step: 7 });
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
  const mailtoHref = buildOfertaLocalMailtoHref(draft.email, draft.businessName);
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
        await navigator.share({ title: draft.title || draft.businessName, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* cancelled */
    }
  }, [draft.businessName, draft.title]);

  const defaultOfferTitle = lang === "en" ? c.defaultOfferTitleEn : c.defaultOfferTitleEs;

  const contactEmail = resolveOfertaLocalContactEmail(draft);
  const followLinks = getOfertaLocalSocialLinksByCategory(draft, "follow");
  const reviewLinks = getOfertaLocalSocialLinksByCategory(draft, "review");
  const businessLinks = getOfertaLocalSocialLinksByCategory(draft, "business");
  const hasContactNav = Boolean(telHref || waHref || webHref || contactEmail);
  const hasLocationNav = Boolean(locationLine || directionsHref);
  const hasSocialNav = followLinks.length > 0 || reviewLinks.length > 0 || businessLinks.length > 0;

  const sectionNavItems: SectionNavItem[] = [
    { id: "oferta", label: lang === "en" ? c.sectionOfferEn : c.sectionOfferEs },
    { id: "volante", label: lang === "en" ? c.sectionFlyerEn : c.sectionFlyerEs },
  ];
  if (draft.wantsAiSearchableSpecials) {
    sectionNavItems.push({
      id: "productos",
      label: lang === "en" ? c.sectionProductsEn : c.sectionProductsEs,
    });
  }
  if (hasContactNav) {
    sectionNavItems.push({
      id: "contacto",
      label: lang === "en" ? c.sectionContactEn : c.sectionContactEs,
    });
  }
  if (hasLocationNav) {
    sectionNavItems.push({
      id: "ubicacion",
      label: lang === "en" ? c.sectionLocationEn : c.sectionLocationEs,
    });
  }
  if (hasSocialNav) {
    sectionNavItems.push({
      id: "redes",
      label: lang === "en" ? c.sectionSocialEn : c.sectionSocialEs,
    });
  }
  sectionNavItems.push({
    id: "proximamente",
    label: lang === "en" ? c.sectionComingSoonEn : c.sectionComingSoonEs,
  });

  const flyerStickyLabel =
    heroAsset?.kind === "coupon"
      ? lang === "en"
        ? c.viewCouponEn
        : c.viewCouponEs
      : lang === "en"
        ? c.viewFlyerEn
        : c.viewFlyerEs;

  return (
    <>
      <LeonixResponsiveShell
        as="div"
        maxWidth="preview"
        background="ivory"
        safeBottom="compact"
        className="min-h-screen"
        containerClassName="py-4 sm:py-6 lg:py-10"
      >
        {/* 1. Preview notice — compact owner cue */}
        <div className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-[#7A1E2C]/20 bg-[#7A1E2C]/[0.04] px-2.5 py-1.5 text-center sm:mb-5 sm:px-3 sm:py-2">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#7A1E2C]/60" aria-hidden />
          <p className="text-xs font-medium text-[#7A1E2C]">
            {lang === "en" ? c.previewNoticeEn : c.previewNoticeEs}
          </p>
        </div>

        <OwnerPreviewControls
          lang={lang}
          editHref={editHref}
          editReviewHref={editReviewHref}
          publishing={publishing}
          aiNeedsReviewCount={aiNeedsReviewCount}
          onSubmitForReview={onSubmitForReview}
        />

        {/* 2. Page header */}
        <header className="mb-4 min-w-0 text-center lg:mb-8 lg:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B8860B] sm:text-xs">Leonix</p>
          <h1 className="mt-1.5 break-words font-serif text-[1.6rem] font-bold leading-snug text-[#7A1E2C] sm:mt-2 sm:text-4xl sm:leading-tight">
            {lang === "en" ? c.pageTitleEn : c.pageTitleEs}
          </h1>
          <p className="mx-auto mt-1.5 max-w-xs break-words text-xs leading-relaxed text-[#1E1814]/55 sm:mt-2 sm:max-w-2xl sm:text-sm sm:text-[#1E1814]/65 lg:mx-0">
            {lang === "en" ? c.pageSubtitleEn : c.pageSubtitleEs}
          </p>
        </header>

        <PreviewSectionNav items={sectionNavItems} lang={lang} />

        {/* 3. Title / info section — business meta + rewards (no duplicated contact CTA cluster) */}
        <section id="oferta" className={cx(SECTION_ANCHOR, CARD, "p-4 sm:p-5 lg:p-6")}>
          <div className="flex flex-wrap gap-2">
            {primaryFormatLabel ? (
              <span className="rounded-lg border border-[#D4C4A8] bg-[#FDF8F0] px-2.5 py-1 text-xs font-semibold text-[#7A1E2C]">
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

          {/* Business name — larger and stronger so it breathes */}
          <h2 className="mt-3 break-words font-serif text-2xl font-bold leading-tight text-[#1E1814] sm:text-3xl lg:text-[2.5rem]">
            {draft.businessName.trim() || draft.title.trim() || defaultOfferTitle}
          </h2>
          {draft.businessName.trim() && draft.title.trim() ? (
            <p className="mt-1.5 font-serif text-base font-semibold text-[#7A1E2C] sm:text-lg">
              {draft.title}
            </p>
          ) : null}

          {(categoryLabel || marketLabel) ? (
            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[#1E1814]/60 sm:text-sm">
              {categoryLabel ? <span>{categoryLabel}</span> : null}
              {marketLabel ? (
                <span>
                  {categoryLabel ? "· " : ""}
                  {marketLabel}
                </span>
              ) : null}
            </div>
          ) : null}

          {(dateRange || locationLine) ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {dateRange ? (
                <div className="rounded-lg border border-[#D4C4A8]/60 bg-[#FDF8F0]/50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7A1E2C]">
                    {lang === "en" ? c.validLabelEn : c.validLabelEs}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-[#1E1814]">{dateRange}</p>
                </div>
              ) : null}
              {locationLine ? (
                <p className="flex items-start gap-2 rounded-lg border border-[#D4C4A8]/40 bg-white px-3 py-2 text-sm leading-relaxed text-[#1E1814]/80">
                  <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B8860B]" aria-hidden />
                  <span>{locationLine}</span>
                </p>
              ) : null}
            </div>
          ) : null}

          {expired ? (
            <p className="mt-3 rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {lang === "en" ? c.expiredWarning : c.expiredWarningEs}
            </p>
          ) : null}
          {notYetActive ? (
            <p className="mt-3 rounded-lg border border-[#D4C4A8] bg-[#FDF8F0] px-3 py-2 text-xs text-[#1E1814]/70">
              {lang === "en" ? c.notYetActive : c.notYetActiveEs}
            </p>
          ) : null}

          {draft.description.trim() ? (
            <div className="mt-4 border-t border-[#D4C4A8]/50 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#1E1814]/55">
                {lang === "en" ? c.aboutBusinessEn : c.aboutBusinessEs}
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#1E1814]/80">
                {draft.description}
              </p>
            </div>
          ) : null}

          {draft.couponText.trim() ? (
            <div className="mt-4 rounded-xl border border-[#7A1E2C]/20 bg-gradient-to-br from-[#7A1E2C]/8 to-[#FDF8F0] px-4 py-3">
              <p className="text-xs font-semibold uppercase text-[#7A1E2C]">
                {lang === "en" ? c.couponPromotionEn : c.couponPromotionEs}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#1E1814]">{draft.couponText}</p>
            </div>
          ) : null}

          {/* Compact rewards / membership sub-block (moved in from the old floating side rail) */}
          {(showMembership && membershipHref) || (showDigitalCoupon && digitalCouponHref) ? (
            <div className="mt-4 rounded-xl border border-[#7A1E2C]/20 bg-[#FDF8F0]/60 p-3 sm:p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#7A1E2C]">
                <FiAward className="h-3.5 w-3.5" aria-hidden />
                {lang === "en" ? c.membershipTitleEn : c.membershipTitleEs}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#1E1814]/60">
                {lang === "en" ? c.membershipCopyEn : c.membershipCopyEs}
              </p>
              <div className="mt-3 grid gap-2 min-[400px]:grid-cols-2">
                {showMembership && membershipHref ? (
                  <a
                    href={membershipHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cx(BTN_PRIMARY, "w-full")}
                  >
                    {membershipCtaLabel(lang)}
                  </a>
                ) : null}
                {showDigitalCoupon && digitalCouponHref ? (
                  <a
                    href={digitalCouponHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cx(BTN_OUTLINE, "w-full")}
                  >
                    {digitalCouponCtaLabel(lang)}
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8D9C4]/50 pt-3">
            <p className="text-[11px] font-medium text-[#2D5A3D]">
              {lang === "en" ? c.publishedOnLeonixEn : c.publishedOnLeonixEs}
            </p>
            <button type="button" className={cx(BTN_OUTLINE, "gap-2")} onClick={() => void handleShare()}>
              <FiShare2 className="h-4 w-4 shrink-0" aria-hidden />
              {shareCopied
                ? lang === "en"
                  ? c.shareCopiedEn
                  : c.shareCopiedEs
                : lang === "en"
                  ? c.shareEn
                  : c.shareEs}
            </button>
          </div>
        </section>

        {/* 4. Flyer hero — the star of the page */}
        <section id="volante" className={cx(SECTION_ANCHOR, "mt-4 sm:mt-6")}>
          <div className="mx-auto w-full max-w-2xl lg:max-w-3xl">
            <OfertasLocalesPreviewHeroVisual draft={draft} heroAsset={heroAsset} lang={lang} compactMobile />
          </div>
        </section>

        {/* 6. Business Hub */}
        <PreviewBusinessHub
          draft={draft}
          lang={lang}
          telHref={telHref}
          waHref={waHref}
          webHref={webHref}
          mailtoHref={mailtoHref}
          directionsHref={directionsHref}
          locationLine={locationLine}
        />

        {/* 7. Product grid */}
        <OfertasLocalesPreviewProductGrid
          draft={draft}
          items={approvedAiItems}
          lang={lang}
          loading={aiReviewLoading}
          error={aiReviewError}
          needsReviewCount={aiNeedsReviewCount}
          totalCount={aiTotalCount}
          heroAsset={heroAsset}
          heroFlyerLabel={
            heroAsset?.kind === "coupon"
              ? lang === "en"
                ? c.viewCouponEn
                : c.viewCouponEs
              : lang === "en"
                ? c.viewFlyerEn
                : c.viewFlyerEs
          }
          directionsHref={directionsHref}
          websiteHref={webHref}
        />

        {/* Future modules */}
        <section
          id="proximamente"
          className={`${SECTION_ANCHOR} mt-8`}
          aria-label={lang === "en" ? c.futureModulesEn : c.futureModulesEs}
        >
          <h2 className="font-serif text-base font-semibold text-[#1E1814]/80">
            {lang === "en" ? c.futureModulesEn : c.futureModulesEs}
          </h2>
          <p className="mt-1 text-xs text-[#1E1814]/50">
            {lang === "en" ? c.futureModulesNoteEn : c.futureModulesNoteEs}
          </p>
          {/* Neutralized future roadmap — one non-interactive info card (no live-looking buttons). */}
          <div className="mt-3 rounded-xl border border-dashed border-[#D4C4A8]/70 bg-[#FDF8F0]/50 p-4">
            <p className="flex items-start gap-2 text-xs font-medium leading-relaxed text-[#1E1814]/60">
              <FiLock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B8860B]" aria-hidden />
              {lang === "en" ? c.comingSoonListsRoutesEn : c.comingSoonListsRoutesEs}
            </p>
          </div>
        </section>

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

        {/* 9. Owner controls */}
        <section className="mt-8 rounded-xl border border-[#7A1E2C]/20 bg-[#7A1E2C]/5 p-4 sm:p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#7A1E2C]">
            {lang === "en" ? c.ownerControlsEn : c.ownerControlsEs}
          </h2>

          {publishSuccess ? (
            <div className="mt-4 rounded-xl border border-emerald-300/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-semibold">{lang === "en" ? c.submitSuccessEn : c.submitSuccessEs}</p>
              <p className="mt-1 text-xs">{lang === "en" ? c.submitSuccessNoteEn : c.submitSuccessNoteEs}</p>
            </div>
          ) : null}
          {publishError ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {publishError}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={editHref} className={BTN_PRIMARY}>
              {lang === "en" ? c.backToEditEn : c.backToEdit}
            </Link>
            <Link href={editReviewHref} className={BTN_OUTLINE}>
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
                    ? c.submitBlockedEn
                    : c.submitBlockedEs
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
      </LeonixResponsiveShell>

      <MobileStickyActionBar
        lang={lang}
        heroHref={heroAsset?.href ?? ""}
        flyerLabel={flyerStickyLabel}
        directionsHref={directionsHref}
        telHref={telHref}
        waHref={waHref}
        shareCopied={shareCopied}
        onShare={() => void handleShare()}
      />
    </>
  );
}
