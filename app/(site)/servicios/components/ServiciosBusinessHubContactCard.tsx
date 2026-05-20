"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  FiClock,
  FiExternalLink,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiPhone,
  FiZap,
} from "react-icons/fi";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaStar,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiPinterest, SiSnapchat } from "react-icons/si";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { nonEmpty } from "../lib/serviciosProfilePrimitives";
import {
  resolveServiciosQuoteDestination,
  serviciosUniversalQuoteMessage,
  type ServiciosQuoteDestinationKind,
} from "../lib/serviciosContactActions";
import {
  buildServiciosGetQuoteIntent,
  buildServiciosSendEmailIntentFromMailto,
  extractWaMeDigitsFromHref,
  serviciosContactShareExtras,
  trackServiciosListingCta,
} from "../lib/serviciosCtaIntents";
import {
  mapServiciosProfileToBusinessHubContact,
  serviciosBusinessHubHasVisibleContent,
} from "../lib/mapServiciosProfileToBusinessHubContact";
import type {
  ServiciosBusinessHubReviewLink,
  ServiciosBusinessHubSocialLink,
} from "../lib/serviciosBusinessHubContactTypes";
import { ServiciosStarRating } from "./ServiciosStarRating";
import { ServiciosActionPanelAreasMap } from "./ServiciosActionPanelAreasMap";
import { ServiciosOfferCard } from "./ServiciosOfferCard";
import { ContactEmailMenu } from "@/app/components/contact/ContactEmailMenu";
import { CtaActionSheet } from "@/app/components/cta/CtaActionSheet";
import type { CtaSheetIntent } from "@/app/components/cta/types";
import { SV } from "./serviciosDesignTokens";

const HUB_CTA_BG = "var(--lx-blue, #2F5F9E)";
const HUB_GOLD = "var(--lx-gold, #D4AF37)";

function analyticsForQuoteKind(kind: ServiciosQuoteDestinationKind): string {
  if (kind === "sms") return "cta_quote_sms_click";
  if (kind === "whatsapp") return "cta_whatsapp_click";
  if (kind === "tel") return "cta_call_click";
  if (kind === "mailto") return "cta_email_click";
  return "cta_website_click";
}

function emailFromMailtoHref(href: string): string {
  const h = href.trim();
  if (!h.toLowerCase().startsWith("mailto:")) return "";
  try {
    return decodeURIComponent(h.slice(7).split(/[?#]/)[0] ?? "");
  } catch {
    return h.slice(7).split(/[?#]/)[0] ?? "";
  }
}

function socialHeadline(platform: ServiciosBusinessHubSocialLink["platform"]): string {
  const map: Record<ServiciosBusinessHubSocialLink["platform"], string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    x: "X",
    youtube: "YouTube",
    linkedin: "LinkedIn",
    snapchat: "Snapchat",
    pinterest: "Pinterest",
  };
  return map[platform];
}

function SocialPlatformIcon({ platform }: { platform: ServiciosBusinessHubSocialLink["platform"] }) {
  const cls = "h-5 w-5 shrink-0";
  switch (platform) {
    case "facebook":
      return <FaFacebook className={cls} aria-hidden />;
    case "instagram":
      return <FaInstagram className={cls} aria-hidden />;
    case "tiktok":
      return <FaTiktok className={cls} aria-hidden />;
    case "x":
      return <FaXTwitter className={cls} aria-hidden />;
    case "youtube":
      return <FaYoutube className={cls} aria-hidden />;
    case "linkedin":
      return <FaLinkedin className={cls} aria-hidden />;
    case "snapchat":
      return <SiSnapchat className={cls} aria-hidden />;
    case "pinterest":
      return <SiPinterest className={cls} aria-hidden />;
    default:
      return <FiGlobe className={cls} aria-hidden />;
  }
}

function HubSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-sm font-bold tracking-tight text-[color:var(--lx-text)] sm:text-base">{children}</h3>
  );
}

function HubDivider() {
  return <hr className="my-5 border-0 border-t sm:my-6" style={{ borderColor: SV.borderSoft }} />;
}

type ContactAction = { id: string; label: string; onClick: () => void; icon: ReactNode };

/**
 * Servicios Business Hub contact card — light Leonix surface, navy/gold CTAs.
 * Renders only sections backed by existing published profile data.
 */
export function ServiciosBusinessHubContactCard({
  profile,
  lang,
  listingSlug,
  listingShareUrl,
  directContactFasterResponseHint = false,
  showOfferSidebarTeaser = true,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  listingSlug?: string;
  listingShareUrl?: string;
  directContactFasterResponseHint?: boolean;
  showOfferSidebarTeaser?: boolean;
}) {
  const L = getServiciosProfileLabels(lang);
  const vm = useMemo(() => mapServiciosProfileToBusinessHubContact(profile, lang), [profile, lang]);
  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);

  const openCtaSheet = useCallback(
    (intent: CtaSheetIntent, trackEvent?: string) => {
      if (trackEvent) trackServiciosListingCta(listingSlug, trackEvent, { source: "business_hub" });
      setCtaIntent(intent);
      setCtaOpen(true);
    },
    [listingSlug],
  );

  const closeCtaSheet = useCallback(() => {
    setCtaOpen(false);
    setCtaIntent(null);
  }, []);

  const hours = profile.contact.hours;
  const quoteEarly = resolveServiciosQuoteDestination(profile, lang);
  const showPrimaryQuoteEarly =
    quoteEarly &&
    ((quoteEarly.kind === "mailto" && quoteEarly.href) ||
      quoteEarly.kind === "sms" ||
      quoteEarly.kind === "whatsapp");

  if (
    !serviciosBusinessHubHasVisibleContent(vm, {
      hasPrimaryQuote: Boolean(showPrimaryQuoteEarly),
      hasHours: Boolean(hours?.weeklyRows?.length || (hours?.openNowLabel && hours?.todayHoursLine)),
      isFeatured: Boolean(profile.contact.isFeatured),
    })
  ) {
    return null;
  }

  const contactExtras = serviciosContactShareExtras(profile, listingSlug, listingShareUrl);
  const quote = resolveServiciosQuoteDestination(profile, lang);
  const quoteMsgText = serviciosUniversalQuoteMessage(lang);
  const primaryCtaLabel = profile.contact.primaryCtaLabel?.trim() || L.requestQuote;
  const primaryMailto = quote?.kind === "mailto" ? quote.href : null;
  const primaryEmailAddr =
    profile.contact.email?.trim() ||
    (profile.contact.emailMailtoHref ? emailFromMailtoHref(profile.contact.emailMailtoHref) : "") ||
    (primaryMailto ? emailFromMailtoHref(primaryMailto) : "");
  const rating = profile.hero.rating;
  const reviewCount = profile.hero.reviewCount;
  const featured = profile.contact.isFeatured;
  const featuredLabel = profile.contact.featuredLabel?.trim() || L.featured;

  const openPrimaryQuoteSheet = () => {
    const intent = buildServiciosGetQuoteIntent(profile, lang, { listingSlug, listingShareUrl });
    if (!intent || !quote) return;
    openCtaSheet(intent, analyticsForQuoteKind(quote.kind));
  };

  const openPrimaryMailtoSheet = () => {
    if (!primaryMailto) return;
    const intent = buildServiciosSendEmailIntentFromMailto(primaryMailto, lang, listingSlug, listingShareUrl);
    if (!intent) return;
    openCtaSheet(intent, analyticsForQuoteKind("mailto"));
  };

  const openCall = () => {
    const href = profile.contact.phoneTelHref?.trim();
    if (!href) return;
    const raw = href.replace(/^tel:/i, "").trim();
    openCtaSheet({ kind: "call", phone: raw, contactShareExtras: contactExtras }, "cta_call_click");
  };

  const openMessage = () => {
    if (!vm.contact.messageSmsHref) return;
    const phone = profile.contact.quoteMessagePhone?.trim() || profile.contact.phoneDisplay?.trim() || "";
    openCtaSheet(
      {
        kind: "send_message",
        message: quoteMsgText,
        phone,
        contactShareExtras: contactExtras,
      },
      "cta_quote_sms_click",
    );
  };

  const openWhatsApp = () => {
    const href = vm.contact.whatsappHref;
    if (!href) return;
    const digits = extractWaMeDigitsFromHref(href);
    if (digits.replace(/\D/g, "").length < 8) return;
    openCtaSheet(
      {
        kind: "send_message",
        message: "",
        phone: digits,
        whatsappDigits: digits,
        contactShareExtras: contactExtras,
      },
      "cta_whatsapp_click",
    );
  };

  const openEmail = () => {
    const mailto = vm.contact.emailMailto;
    if (!mailto) return;
    const intent = buildServiciosSendEmailIntentFromMailto(mailto, lang, listingSlug, listingShareUrl);
    if (!intent) return;
    openCtaSheet(intent, "cta_email_click");
  };

  const openSocialOutbound = (url: string, headline: string) => {
    openCtaSheet({ kind: "social_link", url, headline }, "cta_website_click");
  };

  const openLink = (url: string) => {
    openCtaSheet({ kind: "website", url }, "cta_website_click");
  };

  const openReviewLink = (link: ServiciosBusinessHubReviewLink) => {
    openCtaSheet({ kind: "website", url: link.url }, "cta_website_click");
  };

  const openDirectionsSheet = (addressOrUrl: string, isMapsUrl: boolean) => {
    openCtaSheet(
      { kind: "directions", addressOrUrl, isMapsUrl, contactShareExtras: contactExtras },
      "cta_maps_click",
    );
  };

  const contactActions: ContactAction[] = [];
  if (profile.contact.phoneTelHref) {
    contactActions.push({
      id: "call",
      label: lang === "en" ? "Call" : "Llamar",
      onClick: openCall,
      icon: <FiPhone className="h-5 w-5" style={{ color: HUB_GOLD }} aria-hidden />,
    });
  }
  if (vm.contact.messageSmsHref) {
    contactActions.push({
      id: "message",
      label: lang === "en" ? "Message" : "Mensaje",
      onClick: openMessage,
      icon: <FiMessageSquare className="h-5 w-5" style={{ color: HUB_GOLD }} aria-hidden />,
    });
  }
  if (vm.contact.whatsappHref) {
    contactActions.push({
      id: "whatsapp",
      label: "WhatsApp",
      onClick: openWhatsApp,
      icon: <FaWhatsapp className="h-5 w-5" style={{ color: HUB_GOLD }} aria-hidden />,
    });
  }
  if (vm.contact.emailMailto) {
    contactActions.push({
      id: "email",
      label: lang === "en" ? "Email" : "Correo",
      onClick: openEmail,
      icon: <FiMail className="h-5 w-5" style={{ color: HUB_GOLD }} aria-hidden />,
    });
  }

  const hasContactGrid = contactActions.length > 0;
  const showSocial = vm.social.length > 0;
  const showReviews = vm.reviews.length > 0;
  const showMore = vm.moreLinks.length > 0;
  const showLocation = Boolean(vm.location?.addressDisplay?.trim() || vm.location?.mapsHref);

  const primaryClass =
    "flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-[0.97] active:scale-[0.99]";

  const contactBtnClass =
    "flex min-h-[44px] flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-center text-xs font-semibold text-white shadow-md transition hover:opacity-[0.97] active:scale-[0.99] sm:text-sm";

  const socialChipClass =
    "flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border shadow-sm transition hover:shadow-md sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0";

  const showPrimaryQuote =
    quote &&
    ((quote.kind === "mailto" && primaryMailto) ||
      quote.kind === "sms" ||
      quote.kind === "whatsapp");

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <article
        className="overflow-hidden rounded-3xl border p-4 shadow-md sm:p-6"
        style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadow }}
        data-servicios-business-hub="1"
      >
        {featured ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b pb-4" style={{ borderColor: SV.borderSoft }}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-text)]"
              style={{ backgroundColor: SV.goldSoft, border: `1px solid ${SV.goldBorder}` }}
            >
              <FaStar className="h-3.5 w-3.5" style={{ color: HUB_GOLD }} aria-hidden />
              {featuredLabel}
            </span>
            {rating != null && reviewCount != null ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--lx-text-2)]">
                <ServiciosStarRating value={rating} size="sm" />
                {rating.toFixed(1)} ({reviewCount} {lang === "en" ? "reviews" : "reseñas"})
              </span>
            ) : null}
          </div>
        ) : rating != null && reviewCount != null ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b pb-4" style={{ borderColor: SV.borderSoft }}>
            <ServiciosStarRating value={rating} size="sm" />
            <span className="text-xs font-semibold text-[color:var(--lx-text-2)]">
              {rating.toFixed(1)} ({reviewCount})
            </span>
          </div>
        ) : null}

        {showPrimaryQuote && quote?.kind === "mailto" && primaryMailto && primaryEmailAddr ? (
          <ContactEmailMenu
            email={primaryEmailAddr}
            mailtoHref={primaryMailto}
            messagePlain={quoteMsgText}
            lang={lang}
            listingSlug={listingSlug}
            analyticsEventType={analyticsForQuoteKind("mailto")}
            triggerClassName={`${primaryClass} ${hasContactGrid ? "mb-4" : ""} justify-between`}
            triggerStyle={{ backgroundColor: HUB_CTA_BG, boxShadow: "0 12px 32px rgba(47, 95, 158, 0.22)" }}
          >
            <FiZap className="h-5 w-5 shrink-0" style={{ color: HUB_GOLD }} aria-hidden />
            {primaryCtaLabel}
          </ContactEmailMenu>
        ) : showPrimaryQuote && quote?.kind === "mailto" && primaryMailto ? (
          <button
            type="button"
            className={`${primaryClass} ${hasContactGrid ? "mb-4" : ""} w-full border-0`}
            style={{ backgroundColor: HUB_CTA_BG, boxShadow: "0 12px 32px rgba(47, 95, 158, 0.22)" }}
            onClick={openPrimaryMailtoSheet}
          >
            <FiZap className="h-5 w-5 shrink-0" style={{ color: HUB_GOLD }} aria-hidden />
            {primaryCtaLabel}
          </button>
        ) : showPrimaryQuote && quote && (quote.kind === "sms" || quote.kind === "whatsapp") ? (
          <button
            type="button"
            className={`${primaryClass} ${hasContactGrid ? "mb-4" : ""} w-full border-0`}
            style={{ backgroundColor: HUB_CTA_BG, boxShadow: "0 12px 32px rgba(47, 95, 158, 0.22)" }}
            onClick={openPrimaryQuoteSheet}
          >
            <FiZap className="h-5 w-5 shrink-0" style={{ color: HUB_GOLD }} aria-hidden />
            {primaryCtaLabel}
          </button>
        ) : null}

        {hasContactGrid ? (
          <section aria-labelledby="hub-contact-heading">
            <HubSectionTitle>
              <span id="hub-contact-heading">{lang === "en" ? "Contact us" : "Contáctanos"}</span>
            </HubSectionTitle>
            {directContactFasterResponseHint ? (
              <p className="mt-2 text-xs leading-snug text-[color:var(--lx-text-2)]" data-servicios-direct-contact-hint="1">
                {lang === "en"
                  ? "Contact the business directly for a faster response."
                  : "Contacta directamente al negocio para una respuesta más rápida."}
              </p>
            ) : null}
            <div
              className={`mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 ${
                contactActions.length === 1 ? "max-w-[50%]" : ""
              }`}
            >
              {contactActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className={`${contactBtnClass} w-full border-0`}
                  style={{ backgroundColor: HUB_CTA_BG }}
                  onClick={action.onClick}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {hours?.openNowLabel && nonEmpty(hours.todayHoursLine) ? (
          <>
            {hasContactGrid || showPrimaryQuote ? <HubDivider /> : null}
            <p className="flex items-start gap-2 text-xs text-[color:var(--lx-text-2)]">
              <FiClock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: HUB_CTA_BG }} aria-hidden />
              <span>
                <span className="font-semibold text-[color:var(--lx-text)]">{hours.openNowLabel}:</span>{" "}
                {hours.todayHoursLine}
              </span>
            </p>
          </>
        ) : null}

        {hours?.weeklyRows && hours.weeklyRows.length > 0 ? (
          <>
            <HubDivider />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]">{L.weeklyHours}</p>
              <ul className="mt-2 space-y-1.5">
                {hours.weeklyRows.map((r, i) => (
                  <li key={`${r.dayLabel}-${i}`} className="flex justify-between gap-3 text-xs text-[color:var(--lx-text-2)]">
                    <span className="min-w-0 shrink font-medium text-[color:var(--lx-text)]">{r.dayLabel}</span>
                    <span className="shrink-0 text-right tabular-nums">{r.line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        {showSocial ? (
          <>
            <HubDivider />
            <section aria-labelledby="hub-social-heading">
              <HubSectionTitle>
                <span id="hub-social-heading">{lang === "en" ? "Follow us" : "Síguenos"}</span>
              </HubSectionTitle>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-text-2)]">
                {lang === "en"
                  ? "Find us here, don't forget to follow and like."
                  : "Encuéntranos aquí, no olvides seguir y dar like."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {vm.social.map((link) => (
                  <button
                    key={link.platform}
                    type="button"
                    onClick={() => openSocialOutbound(link.url, socialHeadline(link.platform))}
                    className={socialChipClass}
                    style={{
                      backgroundColor: "#fff",
                      borderColor: SV.border,
                      color: SV.text,
                    }}
                    aria-label={socialHeadline(link.platform)}
                  >
                    <SocialPlatformIcon platform={link.platform} />
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {showReviews ? (
          <>
            <HubDivider />
            <section aria-labelledby="hub-reviews-heading">
              <HubSectionTitle>
                <span id="hub-reviews-heading">{lang === "en" ? "Reviews" : "Opiniones"}</span>
              </HubSectionTitle>
              <div className="mt-3 flex flex-col gap-2">
                {vm.reviews.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => openReviewLink(link)}
                    className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border bg-white px-3 py-3 text-left text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:shadow-md"
                    style={{ borderColor: SV.border }}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {link.rating != null ? (
                        <ServiciosStarRating value={link.rating} size="sm" />
                      ) : (
                        <FiExternalLink className="h-4 w-4 shrink-0" style={{ color: HUB_GOLD }} aria-hidden />
                      )}
                      <span className="truncate">{link.label}</span>
                    </span>
                    {link.reviewCount != null ? (
                      <span className="shrink-0 text-xs text-[color:var(--lx-text-2)]">({link.reviewCount})</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {showMore ? (
          <>
            <HubDivider />
            <section aria-labelledby="hub-more-heading">
              <HubSectionTitle>
                <span id="hub-more-heading">{lang === "en" ? "Find us here" : "Encuéntranos aquí"}</span>
              </HubSectionTitle>
              <div className="mt-3 flex flex-col gap-2">
                {vm.moreLinks.map((link, i) => (
                  <button
                    key={`${link.label}-${i}`}
                    type="button"
                    onClick={() => openLink(link.url)}
                    className="flex min-h-[44px] w-full items-center gap-2 rounded-xl border bg-white px-3 py-3 text-left text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:shadow-md"
                    style={{ borderColor: SV.border }}
                  >
                    <FiGlobe className="h-4 w-4 shrink-0" style={{ color: HUB_GOLD }} aria-hidden />
                    <span className="truncate">{link.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {showLocation ? (
          <>
            <HubDivider />
            <section aria-labelledby="hub-location-heading">
              <HubSectionTitle>
                <span id="hub-location-heading">{lang === "en" ? "Our location" : "Nuestra ubicación"}</span>
              </HubSectionTitle>
              {vm.location?.addressDisplay?.trim() ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[color:var(--lx-text)]">
                  {vm.location.addressDisplay}
                </p>
              ) : null}
              <div
                className="mt-3 flex aspect-[16/9] w-full items-center justify-center rounded-xl border"
                style={{ backgroundColor: SV.accentSoft, borderColor: SV.border }}
                aria-hidden
              >
                <FiMapPin className="h-8 w-8 opacity-40" style={{ color: HUB_CTA_BG }} />
              </div>
              {vm.location?.mapsHref ? (
                <button
                  type="button"
                  className={`${primaryClass} mt-3 w-full border-0`}
                  style={{ backgroundColor: HUB_CTA_BG, boxShadow: "0 8px 24px rgba(47, 95, 158, 0.18)" }}
                  onClick={() => openDirectionsSheet(vm.location!.mapsHref!, true)}
                >
                  <FiMapPin className="h-5 w-5 shrink-0" style={{ color: HUB_GOLD }} aria-hidden />
                  {lang === "en" ? "View on map" : "Ver en el mapa"}
                </button>
              ) : null}
            </section>
          </>
        ) : null}

        {vm.showLeonixVerifiedCue ? (
          <>
            <HubDivider />
            <p className="text-center text-[11px] font-medium tracking-wide text-[color:var(--lx-text-2)] opacity-80">
              {lang === "en" ? "Ad verified by Leonix" : "Anuncio verificado por Leonix"}
            </p>
          </>
        ) : null}
      </article>

      <ServiciosActionPanelAreasMap
        profile={profile}
        lang={lang}
        onOpenServiceAreaMap={() => {
          const href = profile.contact.mapsSearchHref?.trim();
          const areaText = profile.serviceAreas.items.map((x) => x.label).filter(Boolean).join(", ");
          const fallback =
            href ||
            (areaText ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(areaText)}` : "");
          if (!fallback) return;
          openDirectionsSheet(fallback, /^https?:\/\//i.test(fallback));
        }}
      />

      {showOfferSidebarTeaser ? <ServiciosOfferCard profile={profile} lang={lang} /> : null}

      <CtaActionSheet open={ctaOpen} onClose={closeCtaSheet} intent={ctaIntent} lang={lang} />
    </div>
  );
}
