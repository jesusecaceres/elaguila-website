"use client";

import { useState, useCallback, type ReactNode } from "react";
import {
  FiCopy,
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
  buildSendEmailIntent,
  CtaActionSheet,
  type CtaContactShareExtras,
  type CtaSheetIntent,
} from "@/app/components/cta";
import type { RestaurantContactHubData, RestaurantHubButton } from "../application/buildRestaurantContactHub";
import { trackRestaurantesCtaClick } from "../analytics/restaurantesAnalytics";
import { RestauranteShellDataUrlModal } from "./RestauranteShellDataUrlModal";
import { RestaurantContactHubFauxMap } from "./RestaurantContactHubFauxMap";

const SECTION_HEAD =
  "text-[11px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]";

const BTN =
  "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 text-sm font-semibold text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] active:scale-[0.99]";

const BTN_PRIMARY =
  "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[14px] bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold tracking-tight text-[color:var(--lx-card)] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)] active:scale-[0.99]";

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

function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* silent */ }
  }, [value]);
  return (
    <button
      type="button"
      onClick={copy}
      className="ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded text-[color:var(--lx-muted)] transition hover:text-[color:var(--lx-text)]"
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
): "phone" | "whatsapp" | "website" | "directions" | "order" | "reserve" | "general" {
  switch (action) {
    case "call":
      return "phone";
    case "whatsapp":
      return "whatsapp";
    case "directions":
      return "directions";
    case "website":
    case "menu":
      return "website";
    case "order":
      return "order";
    case "booking":
      return "reserve";
    default:
      return "general";
  }
}

export function RestaurantContactHub({
  hub,
  lang = "es",
  contactShareExtras,
  listingId,
  ownerUserId,
}: {
  hub: RestaurantContactHubData;
  lang?: "es" | "en";
  contactShareExtras?: CtaContactShareExtras | null;
  listingId?: string;
  ownerUserId?: string | null;
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

  const emitCtaAnalytics = (btn: RestaurantHubButton) => {
    const lid = (listingId ?? "").trim();
    if (!lid) return;
    void trackRestaurantesCtaClick(lid, hubButtonToCtaType(btn.action), {
      ownerUserId: ownerUserId ?? undefined,
      eventSource: "detail",
      metadata: { hubButtonId: btn.id },
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

  const openSocial = (url: string, _label: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    emitCtaAnalytics({ id: "social", label: "", href: url, action: "social" });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openMaps = (mapsHref: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    emitCtaAnalytics({ id: "maps", label: "", href: mapsHref, action: "directions" });
    window.open(mapsHref, "_blank", "noopener,noreferrer");
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
                <p className="flex items-center font-medium text-[color:var(--lx-text)]">
                  <span>{hub.location.addressLine1}</span>
                  <CopyChip value={[hub.location.addressLine1, hub.location.addressLine2].filter(Boolean).join(", ")} />
                </p>
              ) : null}
              {hub.location.addressLine2 ? <p>{hub.location.addressLine2}</p> : null}
              {hub.location.supportingText ? (
                <p className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 py-2 text-[color:var(--lx-text)]">
                  {hub.location.supportingText}
                </p>
              ) : null}
            </div>
            {hub.location.mapsHref || hub.location.addressLine1 ? <RestaurantContactHubFauxMap /> : null}
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
