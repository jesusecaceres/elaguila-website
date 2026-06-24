"use client";

import { useState, useCallback, type ReactNode } from "react";
import {
  FiClock,
  FiCopy,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiPhone,
  FiShoppingBag,
  FiCalendar,
  FiMenu,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import type { IconType } from "react-icons";
import {
  buildSendEmailIntent,
  CtaActionSheet,
  type CtaContactShareExtras,
  type CtaSheetIntent,
} from "@/app/components/cta";
import type { RestaurantContactHubData, RestaurantHubButton } from "../application/buildRestaurantContactHub";
import {
  restaurantesAnalyticsTrackMeta,
  trackRestaurantesListingCta,
} from "../lib/restaurantesCtaTracking";
import { RestauranteShellDataUrlModal } from "./RestauranteShellDataUrlModal";
import { RestaurantContactHubFauxMap } from "./RestaurantContactHubFauxMap";
import { RestaurantHubReviewLinkButton } from "./RestaurantHubReviewLinkButton";
import {
  restaurantHubSocialBrandStyle,
  RestaurantHubSocialBrandIcon,
  restaurantSocialIdToPlatform,
} from "./restaurantContactHubSocialBrand";
import {
  RCH_CTA_PRIMARY,
  RCH_CTA_SECONDARY,
  RCH_CTA_WHATSAPP,
  RCH_HUB_CARD,
  RCH_LX,
  RCH_LINK_CARD,
  RCH_SOCIAL_CHIP,
} from "./restaurantContactHubLeonix";

function HubSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="border-b border-[#E8D9C4]/80 pb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1E1814] sm:text-sm">
      {children}
    </h3>
  );
}

function parseWhatsAppHref(href: string): { digits: string; message: string } {
  try {
    const url = new URL(href);
    return {
      digits: url.pathname.replace(/\D/g, ""),
      message: url.searchParams.get("text") ?? "",
    };
  } catch {
    return { digits: href.replace(/\D/g, ""), message: "" };
  }
}

function iconForButton(btn: RestaurantHubButton): IconType {
  switch (btn.action) {
    case "call":
      return FiPhone;
    case "sms":
      return FiMessageSquare;
    case "whatsapp":
      return FaWhatsapp;
    case "email":
      return FiMail;
    case "order":
      return FiShoppingBag;
    case "booking":
      return FiCalendar;
    case "menu":
      return FiMenu;
    case "website":
      return FiGlobe;
    case "directions":
      return FiMapPin;
    default:
      return FiGlobe;
  }
}

function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* silent */
    }
  }, [value]);
  return (
    <button
      type="button"
      onClick={copy}
      className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded text-[#6F6254] transition hover:text-[#1E1814]"
      aria-label="Copy"
      title="Copy"
    >
      {copied ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <FiCopy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function hubButtonToCtaType(
  action: RestaurantHubButton["action"],
): "phone" | "whatsapp" | "email" | "website" | "directions" | "order" | "reserve" | "menu" | "review" | "message" | "general" {
  switch (action) {
    case "call":
      return "phone";
    case "whatsapp":
      return "whatsapp";
    case "email":
      return "email";
    case "sms":
      return "message";
    case "directions":
      return "directions";
    case "website":
      return "website";
    case "menu":
      return "menu";
    case "order":
      return "order";
    case "booking":
      return "reserve";
    case "review":
      return "review";
    default:
      return "general";
  }
}

function reviewProviderFromButtonId(id: string): string | undefined {
  if (id === "google-reviews") return "google";
  if (id === "yelp") return "yelp";
  return undefined;
}

const COMPACT_CTA =
  "inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/55";

export function RestaurantContactHub({
  hub,
  lang = "es",
  contactShareExtras,
  listingId,
  listingSourceId,
  listingSlug,
  ownerUserId,
}: {
  hub: RestaurantContactHubData;
  lang?: "es" | "en";
  contactShareExtras?: CtaContactShareExtras | null;
  listingId?: string;
  listingSourceId?: string;
  listingSlug?: string;
  ownerUserId?: string | null;
}) {
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const [dataModal, setDataModal] = useState<{ href: string; title: string } | null>(null);

  const extras = contactShareExtras ?? {
    email: undefined,
    websiteUrl: undefined,
  };

  const labels = {
    contact: lang === "en" ? "Contact us" : "Contáctanos",
    orderReserve: lang === "en" ? "Order or reserve" : "Ordena o reserva",
    reviews: lang === "en" ? "Reviews" : "Opiniones",
    social: lang === "en" ? "Follow us" : "Síguenos",
    find: lang === "en" ? "Find us online" : "Búscanos aquí",
    location: lang === "en" ? "Our location" : "Nuestra ubicación",
    hours: lang === "en" ? "Hours" : "Horarios",
  };

  const openIntent = (intent: CtaSheetIntent | null) => {
    if (intent) setCtaIntent(intent);
  };

  const analyticsBase = restaurantesAnalyticsTrackMeta({
    listingSlug,
    sourceId: listingSourceId,
    engagementListingId: listingId,
    source: "contact_hub",
  });

  const emitCtaAnalytics = (btn: RestaurantHubButton, extra?: Record<string, unknown>) => {
    if (!(listingSourceId ?? "").trim()) return;
    const ctaType = hubButtonToCtaType(btn.action);
    trackRestaurantesListingCta(ctaType, {
      ...analyticsBase,
      hubButtonId: btn.id,
      ...(ctaType === "review" ? { provider: reviewProviderFromButtonId(btn.id) } : {}),
      ...(extra ?? {}),
    });
  };

  const openButton = (btn: RestaurantHubButton, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const href = btn.href.trim();
    if (!href) return;
    emitCtaAnalytics(btn);

    if (btn.action === "call") {
      window.location.href = href.startsWith("tel:") ? href : `tel:${href.replace(/^tel:/i, "")}`;
      return;
    }
    if (btn.action === "sms") {
      window.location.href = href.startsWith("sms:") ? href : `sms:${href}`;
      return;
    }
    if (btn.action === "whatsapp") {
      const { digits, message } = parseWhatsAppHref(href);
      const waUrl = message
        ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
        : `https://wa.me/${digits}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (btn.action === "email") {
      const raw = href.replace(/^mailto:/i, "");
      const [emailPart, query = ""] = raw.split("?");
      const params = new URLSearchParams(query);
      let email = emailPart;
      try {
        email = decodeURIComponent(emailPart);
      } catch {
        /* keep raw */
      }
      openIntent(
        buildSendEmailIntent({
          email,
          subject: btn.emailSubject ?? params.get("subject") ?? "",
          body: btn.emailBody ?? params.get("body") ?? "",
          contactShareExtras: extras,
        }),
      );
      return;
    }
    if (btn.action === "directions") {
      const url = /^https?:\/\//i.test(href)
        ? href
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(href)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    if (btn.action === "social" || btn.action === "review") {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    if (href.startsWith("data:") || href.startsWith("blob:")) {
      setDataModal({ href, title: btn.label });
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const openSocial = (socialId: string, url: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const platform = restaurantSocialIdToPlatform(socialId);
    emitCtaAnalytics(
      { id: socialId, label: "", href: url, action: "social" },
      platform ? { platform } : undefined,
    );
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openMaps = (mapsHref: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    emitCtaAnalytics({ id: "maps", label: "", href: mapsHref, action: "directions" });
    window.open(mapsHref, "_blank", "noopener,noreferrer");
  };

  const findUsLinks = [...hub.findUs, ...hub.catering];

  const callBtn = hub.contactUs.find((b) => b.id === "call");
  const gridContact = hub.contactUs.filter((b) => b.id !== "call");
  const showContact = hub.contactUs.length > 0;

  const contactGridClass =
    gridContact.length === 1
      ? "mt-2 grid max-w-full grid-cols-1 gap-2"
      : gridContact.length === 3
        ? "mt-2 grid grid-cols-2 gap-2 [&>*:last-child]:col-span-2"
        : "mt-2 grid grid-cols-2 gap-2";

  const orderGridClass =
    hub.orderReserve.length === 1 ? "mt-2 flex flex-col gap-2" : "mt-2 grid grid-cols-2 gap-2";

  const showLocation =
    hub.location &&
    (hub.location.addressLine1 || hub.location.addressLine2 || hub.location.supportingText || hub.location.mapsHref);

  const showHours = Boolean(
    hub.hours?.weeklyRows?.length || hub.hours?.specialNote || hub.hours?.todayHoursLine,
  );

  const showSecondary = hub.reviews.length > 0 || hub.social.length > 0 || findUsLinks.length > 0;

  const renderOrderButton = (btn: RestaurantHubButton) => {
    const Icon = iconForButton(btn);
    const isPrimaryAction = btn.id === "order" && btn.fullWidth;
    const className = isPrimaryAction ? `${COMPACT_CTA} border-0 text-[#FFFCF7]` : `${RCH_LINK_CARD} min-h-[44px] py-2.5`;
    const style = isPrimaryAction
      ? { backgroundColor: RCH_LX.burgundy, boxShadow: "0 6px 18px rgba(92, 22, 34, 0.24)" }
      : undefined;
    return (
      <button key={btn.id} type="button" className={className} style={style} onClick={(e) => openButton(btn, e)}>
        <Icon className="h-4 w-4 shrink-0" style={{ color: isPrimaryAction ? RCH_LX.gold : RCH_LX.burgundy }} aria-hidden />
        <span className="min-w-0 flex-1">{btn.label}</span>
      </button>
    );
  };

  return (
    <>
      <article className={RCH_HUB_CARD} data-restaurant-contact-hub="1">
        <div
          className="pointer-events-none -mx-4 -mt-4 mb-3 h-0.5 bg-gradient-to-r from-transparent via-[#C9A84A]/55 to-transparent sm:-mx-5 sm:-mt-5"
          aria-hidden
        />

        {/* Primary Business Hub — 3 columns on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-4 lg:items-start">
          {/* Column 1: Contact + order actions */}
          {(showContact || hub.orderReserve.length > 0) ? (
            <div className="min-w-0 space-y-3">
              {showContact ? (
                <section aria-labelledby="rest-hub-contact-heading">
                  <HubSectionTitle>
                    <span id="rest-hub-contact-heading">{labels.contact}</span>
                  </HubSectionTitle>
                  {callBtn ? (
                    <button
                      type="button"
                      className={`${COMPACT_CTA} mt-2 w-full border-0 text-[#FFFCF7]`}
                      style={{ backgroundColor: RCH_LX.burgundy, boxShadow: "0 8px 22px rgba(92, 22, 34, 0.28)" }}
                      onClick={(e) => openButton(callBtn, e)}
                    >
                      <FiPhone className="h-4 w-4 shrink-0" aria-hidden />
                      <span>{callBtn.label}</span>
                    </button>
                  ) : null}
                  {gridContact.length > 0 ? (
                    <div className={contactGridClass}>
                      {gridContact.map((btn) => {
                        const Icon = iconForButton(btn);
                        const isWhatsApp = btn.id === "whatsapp";
                        const isSecondary = btn.id === "sms" || btn.id === "email";
                        return (
                          <button
                            key={btn.id}
                            type="button"
                            className={
                              isSecondary
                                ? `${RCH_CTA_SECONDARY} min-h-[44px] py-2`
                                : isWhatsApp
                                  ? `${RCH_CTA_WHATSAPP} min-h-[44px] py-2`
                                  : `${COMPACT_CTA} border-0 text-[#FFFCF7]`
                            }
                            style={
                              isSecondary
                                ? undefined
                                : isWhatsApp
                                  ? { backgroundColor: RCH_LX.whatsApp, boxShadow: RCH_LX.whatsAppShadow }
                                  : { backgroundColor: RCH_LX.burgundy, boxShadow: "0 4px 12px rgba(92, 22, 34, 0.18)" }
                            }
                            onClick={(e) => openButton(btn, e)}
                          >
                            <Icon className="h-4 w-4 shrink-0" aria-hidden />
                            <span>{btn.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {hub.orderReserve.length > 0 ? (
                <section aria-labelledby="rest-hub-order-heading">
                  <HubSectionTitle>
                    <span id="rest-hub-order-heading">{labels.orderReserve}</span>
                  </HubSectionTitle>
                  <div className={orderGridClass}>{hub.orderReserve.map(renderOrderButton)}</div>
                </section>
              ) : null}
            </div>
          ) : null}

          {/* Column 2: Location + map */}
          {showLocation ? (
            <section aria-labelledby="rest-hub-location-heading" className="min-w-0">
              <HubSectionTitle>
                <span id="rest-hub-location-heading">{labels.location}</span>
              </HubSectionTitle>
              {hub.location!.addressLine1 ? (
                <p className="mt-2 flex items-start gap-1 text-sm font-medium leading-snug text-[#1E1814]">
                  <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                  <span className="flex-1">{hub.location!.addressLine1}</span>
                  <CopyChip
                    value={[hub.location!.addressLine1, hub.location!.addressLine2].filter(Boolean).join(", ")}
                  />
                </p>
              ) : null}
              {hub.location!.addressLine2 ? (
                <p className="mt-0.5 text-xs text-[#6F6254]">{hub.location!.addressLine2}</p>
              ) : null}
              {hub.location!.supportingText ? (
                <p
                  className="mt-2 rounded-lg border px-2.5 py-1.5 text-xs text-[#1E1814]"
                  style={{ borderColor: RCH_LX.goldBorder, backgroundColor: RCH_LX.ivory }}
                >
                  {hub.location!.supportingText}
                </p>
              ) : null}
              {(hub.location!.mapsHref || hub.location!.addressLine1) && (
                <div className="mt-2 overflow-hidden rounded-lg border border-[#D4C4A8] shadow-sm ring-1 ring-[#C9A84A]/15">
                  <RestaurantContactHubFauxMap />
                </div>
              )}
              {hub.location!.mapsHref ? (
                <button
                  type="button"
                  className={`${COMPACT_CTA} mt-2 w-full border-2 border-[#C9A84A]/40 text-[#FFFCF7]`}
                  style={{ backgroundColor: RCH_LX.burgundy, boxShadow: "0 6px 18px rgba(92, 22, 34, 0.24)" }}
                  onClick={(e) => openMaps(hub.location!.mapsHref!, e)}
                >
                  <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
                  {hub.location!.mapsLabel}
                </button>
              ) : null}
            </section>
          ) : null}

          {/* Column 3: Hours */}
          {showHours && hub.hours ? (
            <section aria-labelledby="rest-hub-hours-heading" className="min-w-0">
              <HubSectionTitle>
                <span id="rest-hub-hours-heading">{labels.hours}</span>
              </HubSectionTitle>
              {hub.hours.openNowLabel && hub.hours.todayHoursLine ? (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-[#6F6254]">
                  <FiClock className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: RCH_LX.burgundy }} aria-hidden />
                  <span>
                    <span className="font-semibold text-[#1E1814]">{hub.hours.openNowLabel}:</span>{" "}
                    {hub.hours.todayHoursLine}
                  </span>
                </p>
              ) : null}
              {hub.hours.weeklyRows.length > 0 ? (
                <ul className="mt-2 space-y-0.5">
                  {hub.hours.weeklyRows.map((r, i) => (
                    <li
                      key={`${r.dayLabel}-${i}`}
                      className={`flex justify-between gap-2 text-[11px] sm:text-xs ${r.isToday ? "rounded bg-[#F5F0E8]/90 px-1.5 py-0.5" : ""}`}
                    >
                      <span className="min-w-0 shrink font-medium text-[#1E1814]">
                        {r.dayLabel}
                        {r.isToday ? (lang === "en" ? " · Today" : " · Hoy") : ""}
                      </span>
                      <span className="shrink-0 text-right tabular-nums text-[#6F6254]">{r.line}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {hub.hours.specialNote ? (
                <p className="mt-2 rounded-lg bg-[#F6EBDD]/80 px-2 py-1.5 text-[11px] font-medium text-[#6F6254]">
                  {hub.hours.specialNote}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        {/* Secondary row: reviews, social, find-us — compact below hub */}
        {showSecondary ? (
          <div
            className="mt-4 grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4"
            style={{ borderColor: RCH_LX.divider }}
          >
            {hub.reviews.length > 0 ? (
              <section aria-labelledby="rest-hub-reviews-heading" className="min-w-0">
                <HubSectionTitle>
                  <span id="rest-hub-reviews-heading">{labels.reviews}</span>
                </HubSectionTitle>
                <div className="mt-2 flex flex-col gap-2">
                  {hub.reviews.map((btn) => (
                    <RestaurantHubReviewLinkButton
                      key={btn.id}
                      reviewId={btn.id}
                      label={btn.label}
                      lang={lang}
                      onClick={() => openButton(btn)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {hub.social.length > 0 ? (
              <section aria-labelledby="rest-hub-social-heading" className="min-w-0">
                <HubSectionTitle>
                  <span id="rest-hub-social-heading">{labels.social}</span>
                </HubSectionTitle>
                <div className="mt-2 flex max-w-full flex-wrap gap-2">
                  {hub.social.map((s) => {
                    const platform = restaurantSocialIdToPlatform(s.id);
                    if (!platform) return null;
                    const brand = restaurantHubSocialBrandStyle(platform);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={(e) => openSocial(s.id, s.url, e)}
                        className={RCH_SOCIAL_CHIP}
                        style={{
                          background: brand.background,
                          color: brand.color,
                          border: brand.border ?? "2px solid transparent",
                        }}
                        aria-label={s.label}
                      >
                        <span className="inline-flex" style={{ color: brand.color }}>
                          <RestaurantHubSocialBrandIcon platform={platform} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {findUsLinks.length > 0 ? (
              <section aria-labelledby="rest-hub-find-heading" className="min-w-0 sm:col-span-2 lg:col-span-1">
                <HubSectionTitle>
                  <span id="rest-hub-find-heading">{labels.find}</span>
                </HubSectionTitle>
                <div className="mt-2 flex flex-col gap-2">
                  {findUsLinks.map((btn) => {
                    const Icon = iconForButton(btn);
                    return (
                      <button
                        key={btn.id}
                        type="button"
                        className={`${RCH_LINK_CARD} min-h-[44px] py-2.5`}
                        onClick={(e) => openButton(btn, e)}
                      >
                        <Icon className="h-4 w-4 shrink-0" style={{ color: RCH_LX.burgundy }} aria-hidden />
                        <span className="min-w-0 flex-1 break-words">{btn.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </article>

      <CtaActionSheet open={ctaIntent != null} onClose={() => setCtaIntent(null)} intent={ctaIntent} lang={lang} />
      <RestauranteShellDataUrlModal
        open={dataModal != null}
        onClose={() => setDataModal(null)}
        href={dataModal?.href ?? ""}
        title={dataModal?.title ?? ""}
      />
    </>
  );
}
