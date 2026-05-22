"use client";

import { useState, type ReactNode } from "react";
import {
  FiExternalLink,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiShoppingBag,
  FiCalendar,
  FiMenu,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { SiFacebook, SiInstagram, SiTiktok, SiYoutube, SiYelp } from "react-icons/si";
import type { IconType } from "react-icons";
import {
  buildCallIntent,
  buildDirectionsIntent,
  buildSendEmailIntent,
  buildSendMessageIntent,
  buildWebsiteIntent,
  buildWhatsAppMessageIntent,
  buildSocialLinkIntent,
  CtaActionSheet,
  type CtaContactShareExtras,
  type CtaSheetIntent,
} from "@/app/components/cta";
import type { RestaurantContactHubData, RestaurantHubButton } from "../application/buildRestaurantContactHub";
import { RestauranteShellDataUrlModal } from "./RestauranteShellDataUrlModal";

const SECTION_HEAD =
  "text-[11px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]";

const BTN =
  "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 text-sm font-semibold text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] active:scale-[0.99]";

const BTN_PRIMARY =
  "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[14px] bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold tracking-tight text-[color:var(--lx-card)] shadow-[0_8px_24px_-6px_rgba(26,22,18,0.35)] transition hover:bg-[color:var(--lx-cta-dark-hover)] active:scale-[0.99]";

const SOCIAL_BTN =
  "inline-flex h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]";

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

function parseSmsHref(href: string): { phone: string; message: string } {
  const raw = href.replace(/^sms:/i, "");
  const [phonePart, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  return {
    phone: phonePart ?? "",
    message: params.get("body") ?? "",
  };
}

function iconForButton(btn: RestaurantHubButton): IconType {
  switch (btn.action) {
    case "call":
      return FiPhone;
    case "sms":
      return FiMessageCircle;
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
    case "review":
      return FiExternalLink;
    default:
      return FiGlobe;
  }
}

function socialIcon(id: string): IconType {
  switch (id) {
    case "instagram":
      return SiInstagram;
    case "facebook":
      return SiFacebook;
    case "tiktok":
      return SiTiktok;
    case "youtube":
      return SiYoutube;
    default:
      return FiGlobe;
  }
}

function reviewIcon(id: string): IconType {
  if (id === "yelp") return SiYelp;
  return FiExternalLink;
}

export function RestaurantContactHub({
  hub,
  lang = "es",
  contactShareExtras,
}: {
  hub: RestaurantContactHubData;
  lang?: "es" | "en";
  contactShareExtras?: CtaContactShareExtras | null;
}) {
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const [dataModal, setDataModal] = useState<{ href: string; title: string } | null>(null);

  const extras = contactShareExtras ?? {
    email: undefined,
    websiteUrl: undefined,
  };

  const openIntent = (intent: CtaSheetIntent | null) => {
    if (intent) setCtaIntent(intent);
  };

  const openButton = (btn: RestaurantHubButton, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const href = btn.href.trim();
    if (!href) return;

    if (btn.action === "call") {
      openIntent(buildCallIntent({ phone: href.replace(/^tel:/i, ""), contactShareExtras: extras }));
      return;
    }
    if (btn.action === "sms") {
      const parsed = parseSmsHref(href);
      openIntent(buildSendMessageIntent({ phone: parsed.phone, message: parsed.message, contactShareExtras: extras }));
      return;
    }
    if (btn.action === "whatsapp") {
      const { digits, message } = parseWhatsAppHref(href);
      openIntent(buildWhatsAppMessageIntent({ whatsappDigits: digits, message, contactShareExtras: extras }));
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
      openIntent(buildDirectionsIntent({ addressOrUrl: href, isMapsUrl: /^https?:\/\//i.test(href), contactShareExtras: extras }));
      return;
    }
    if (btn.action === "social" || btn.action === "review") {
      openIntent(buildSocialLinkIntent({ url: href, headline: btn.label }));
      return;
    }
    if (href.startsWith("data:") || href.startsWith("blob:")) {
      setDataModal({ href, title: btn.label });
      return;
    }
    const kind =
      btn.action === "order" ? "order" : btn.action === "booking" ? "booking" : btn.action === "menu" ? "menu" : "website";
    openIntent(buildWebsiteIntent({ url: href, headline: btn.label, kind }));
  };

  const openSocial = (url: string, label: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    openIntent(buildSocialLinkIntent({ url, headline: label }));
  };

  const openMaps = (mapsHref: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    openIntent(buildDirectionsIntent({ addressOrUrl: mapsHref, isMapsUrl: true, contactShareExtras: extras }));
  };

  const renderGrid = (buttons: RestaurantHubButton[]) => (
    <div className={`grid gap-2.5 ${buttons.length >= 2 ? "grid-cols-2" : "grid-cols-1"}`}>
      {buttons.map((btn) => {
        const Icon = iconForButton(btn);
        const className = btn.fullWidth ? BTN_PRIMARY : BTN;
        return (
          <button key={btn.id} type="button" className={className} onClick={(e) => openButton(btn, e)}>
            <Icon className="h-[1.1rem] w-[1.1rem] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
            {btn.label}
          </button>
        );
      })}
    </div>
  );

  const section = (title: string, children: ReactNode) => (
    <div className="space-y-3">
      <p className={SECTION_HEAD}>{title}</p>
      {children}
    </div>
  );

  const labels = {
    contact: lang === "en" ? "Contact us" : "Contáctanos",
    social: lang === "en" ? "Follow us" : "Síguenos",
    reviews: lang === "en" ? "Reviews" : "Opiniones",
    find: lang === "en" ? "Find us" : "Encuéntranos aquí",
    location: lang === "en" ? "Our location" : "Nuestra ubicación",
    catering: lang === "en" ? "Catering & events" : "Catering y eventos",
  };

  return (
    <>
      <div className="space-y-6">
        {hub.contactUs.length > 0 ? section(labels.contact, renderGrid(hub.contactUs)) : null}

        {hub.social.length > 0
          ? section(
              labels.social,
              <div className="flex flex-wrap gap-2">
                {hub.social.map((s) => {
                  const Icon = socialIcon(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={SOCIAL_BTN}
                      aria-label={s.label}
                      onClick={(e) => openSocial(s.url, s.label, e)}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </button>
                  );
                })}
              </div>,
            )
          : null}

        {hub.reviews.length > 0
          ? section(
              labels.reviews,
              <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                {hub.reviews.map((btn) => {
                  const Icon = reviewIcon(btn.id);
                  return (
                    <button key={btn.id} type="button" className={`${BTN} sm:flex-1`} onClick={(e) => openButton(btn, e)}>
                      <Icon className="h-[1.1rem] w-[1.1rem] shrink-0" aria-hidden />
                      {btn.label}
                    </button>
                  );
                })}
              </div>,
            )
          : null}

        {hub.findUs.length > 0 ? section(labels.find, renderGrid(hub.findUs)) : null}

        {hub.catering.length > 0 ? section(labels.catering, renderGrid(hub.catering)) : null}

        {hub.location &&
        (hub.location.addressLine1 || hub.location.addressLine2 || hub.location.supportingText || hub.location.mapsHref) ? (
          <div className="space-y-3">
            <p className={SECTION_HEAD}>{labels.location}</p>
            <div className="space-y-2 text-sm text-[color:var(--lx-text-2)]">
              {hub.location.addressLine1 ? (
                <p className="font-medium text-[color:var(--lx-text)]">{hub.location.addressLine1}</p>
              ) : null}
              {hub.location.addressLine2 ? <p>{hub.location.addressLine2}</p> : null}
              {hub.location.supportingText ? (
                <p className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 py-2 text-[color:var(--lx-text)]">
                  {hub.location.supportingText}
                </p>
              ) : null}
            </div>
            {hub.location.mapsHref ? (
              <button type="button" className={BTN_PRIMARY} onClick={(e) => openMaps(hub.location!.mapsHref!, e)}>
                <FiMapPin className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
                {hub.location.mapsLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

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
