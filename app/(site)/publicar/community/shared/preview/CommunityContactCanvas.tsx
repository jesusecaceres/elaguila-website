"use client";

import type { ComponentType } from "react";
import { useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { EmailContactOptionsSheet } from "@/app/components/clasificados/EmailContactOptionsSheet";
import {
  digitsOnly,
  formatPhoneInputDisplay,
} from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiGlobe, FiMail, FiMapPin, FiMessageSquare, FiPhone } from "react-icons/fi";

import {
  buildCommunityMapQuery,
  googleMapsSearchUrl,
  mailtoCommunity,
  smsUri,
  telUriFromUs10,
  usPhoneDigits10,
  websiteHref,
  whatsAppUri,
} from "../lib/communityContactCtas";
import { normalizeSocialUrlForOpen } from "../lib/communityWebsiteAndSocial";
import type { ClasesQuickDraft, ComunidadQuickDraft } from "../types/communityQuickDraft";

const GH = {
  cream: "#FCF9F2",
  burgundy: "#7B2D42",
  burgundyLight: "#9B3A52",
  gold: "#C9A84C",
  goldBorder: "#C9B46A",
  amber: "#FFBF00",
  charcoal: "#2A2826",
  muted: "#6B5E4E",
  green: "#1B4332",
  greenBg: "#E8F3EA",
} as const;

const SMS_BODY = {
  clases: {
    es: "Vi tu clase en Leonix Media y quisiera más información.",
    en: "I saw your class on Leonix Media and would like more information.",
  },
  comunidad: {
    es: "Vi tu evento en Leonix Media y quisiera más información.",
    en: "I saw your event on Leonix Media and would like more information.",
  },
} as const;

const MAIL_SUBJECT = {
  clases: {
    es: "Información sobre tu clase en Leonix Media",
    en: "About your class on Leonix Media",
  },
  comunidad: {
    es: "Información sobre tu evento en Leonix Media",
    en: "About your event on Leonix Media",
  },
} as const;

const UI = {
  es: {
    contactTitle: "Contacto del organizador",
    socialTitle: "Síguenos",
    locationTitle: "Lugar del evento",
    moreTitle: "Más información",
    trustLabel: "Publicado en Leonix",
    call: "Llamar",
    text: "Enviar texto",
    email: "Escribir correo",
    website: "Sitio web / Registro",
    map: "Ver en el mapa",
    copyEmail: "Copiar correo",
    copyPhone: "Copiar teléfono",
  },
  en: {
    contactTitle: "Organizer contact",
    socialTitle: "Follow us",
    locationTitle: "Event location",
    moreTitle: "More information",
    trustLabel: "Published on Leonix",
    call: "Call",
    text: "Text message",
    email: "Email",
    website: "Website / Register",
    map: "View on map",
    copyEmail: "Copy email",
    copyPhone: "Copy phone",
  },
} as const;

const SOCIAL_ARIA = {
  es: {
    facebook: "Abrir Facebook",
    instagram: "Abrir Instagram",
    tiktok: "Abrir TikTok",
    youtube: "Abrir YouTube",
    x: "Abrir X / Twitter",
    linkedin: "Abrir LinkedIn",
  },
  en: {
    facebook: "Open Facebook",
    instagram: "Open Instagram",
    tiktok: "Open TikTok",
    youtube: "Open YouTube",
    x: "Open X / Twitter",
    linkedin: "Open LinkedIn",
  },
} as const;

type Draft = ClasesQuickDraft | ComunidadQuickDraft;

function kindOf(d: Draft): "clases" | "comunidad" {
  return d.kind;
}

function btnPrimaryClass(disabled?: boolean): string {
  return [
    "inline-flex min-h-[40px] min-w-0 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold shadow-sm transition",
    disabled ? "cursor-not-allowed opacity-40" : "hover:opacity-95",
  ].join(" ");
}

export function CommunityContactCanvas({
  draft,
  lang,
  sectionHtmlId,
}: {
  draft: Draft;
  lang: Lang;
  /** Optional DOM id for scroll targets (e.g. published anuncio “Ver contacto”). */
  sectionHtmlId?: string;
}) {
  const t = UI[lang];
  const k = kindOf(draft);
  const [emailOpen, setEmailOpen] = useState(false);
  const phone10 = usPhoneDigits10(draft.phone);
  const wa10 = usPhoneDigits10(draft.whatsapp);
  const smsRaw = draft.smsPhone.trim() ? draft.smsPhone : draft.phone;
  const sms10 = usPhoneDigits10(smsRaw);
  const email = draft.email.trim();
  const web = websiteHref(draft.website);
  const mapQ = buildCommunityMapQuery({
    addressLine1: draft.addressLine1,
    publicCity: draft.publicCity,
    state: draft.state,
    zip: draft.zip,
  });
  const mapsUrl = mapQ ? googleMapsSearchUrl(mapQ) : null;

  const cityDisplay =
    getCanonicalCityName(draft.publicCity.trim()) || draft.publicCity.trim() || "";
  const st = draft.state.trim();
  const zip = draft.zip.trim();
  const country = draft.country?.trim() ?? "";
  const locationParts: string[] = [];
  if (cityDisplay) locationParts.push(cityDisplay);
  if (st && zip) locationParts.push(`${st} ${zip}`);
  else if (st) locationParts.push(st);
  else if (zip) locationParts.push(zip);
  if (country) locationParts.push(country);
  const cityStateZip = locationParts.join(", ");

  const smsBody = SMS_BODY[k][lang];
  const mailSub = MAIL_SUBJECT[k][lang];
  const mailHref = email ? mailtoCommunity({ to: email, subject: mailSub }) : "";

  const sAria = SOCIAL_ARIA[lang];
  const socialItems: {
    key: string;
    href: string | null;
    Icon: ComponentType<{ className?: string }>;
    ariaLabel: string;
  }[] = [
    {
      key: "fb",
      href: normalizeSocialUrlForOpen(draft.socialLinks.facebook, "facebook"),
      Icon: FaFacebook,
      ariaLabel: sAria.facebook,
    },
    {
      key: "ig",
      href: normalizeSocialUrlForOpen(draft.socialLinks.instagram, "instagram"),
      Icon: FaInstagram,
      ariaLabel: sAria.instagram,
    },
    {
      key: "tt",
      href: normalizeSocialUrlForOpen(draft.socialLinks.tiktok, "tiktok"),
      Icon: FaTiktok,
      ariaLabel: sAria.tiktok,
    },
    {
      key: "yt",
      href: normalizeSocialUrlForOpen(draft.socialLinks.youtube, "youtube"),
      Icon: FaYoutube,
      ariaLabel: sAria.youtube,
    },
    {
      key: "x",
      href: normalizeSocialUrlForOpen(draft.socialLinks.xTwitter, "xTwitter"),
      Icon: FaXTwitter,
      ariaLabel: sAria.x,
    },
    {
      key: "li",
      href: normalizeSocialUrlForOpen(draft.socialLinks.linkedin, "linkedin"),
      Icon: FaLinkedin,
      ariaLabel: sAria.linkedin,
    },
  ].filter((x) => x.href);

  const hasContactActions = !!(phone10 || wa10 || sms10 || email);
  const hasLocation = !!(draft.venue.trim() || draft.addressLine1.trim() || cityStateZip);

  return (
    <section
      id={sectionHtmlId}
      data-testid="community-contact-location"
      className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-[#C9B46A]/40 shadow-md"
      style={{ backgroundColor: GH.cream, color: GH.charcoal }}
    >
      {/* Leonix brand accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${GH.burgundy}, ${GH.gold})` }}
        aria-hidden
      />

      <div className="space-y-5 p-4 sm:p-6">

        {/* ── Section 1: Organizer contact actions ───────────────────────── */}
        {hasContactActions ? (
          <div className="space-y-3">
            <h2
              className="text-sm font-extrabold uppercase tracking-widest"
              style={{ color: GH.burgundy }}
            >
              {t.contactTitle}
            </h2>
            {draft.organizer.trim() ? (
              <p className="text-sm font-semibold" style={{ color: GH.charcoal }}>
                {draft.organizer.trim()}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {phone10 ? (
                <a
                  href={telUriFromUs10(phone10)}
                  className={btnPrimaryClass()}
                  style={{ backgroundColor: GH.burgundy, color: "#FFFCF7" }}
                >
                  <FiPhone className="h-4 w-4 shrink-0" aria-hidden />
                  {t.call}{" "}
                  <span className="font-semibold tabular-nums">{formatPhoneInputDisplay(digitsOnly(draft.phone))}</span>
                </a>
              ) : null}
              {wa10 ? (
                <a
                  href={whatsAppUri(wa10, smsBody)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnPrimaryClass()}
                  style={{ backgroundColor: "#25D366", color: "#FFFCF7" }}
                >
                  <FaWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
                  WhatsApp
                </a>
              ) : null}
              {sms10 ? (
                <a
                  href={smsUri(sms10, smsBody)}
                  className={btnPrimaryClass()}
                  style={{ backgroundColor: GH.cream, color: GH.charcoal, border: `1.5px solid ${GH.burgundy}` }}
                >
                  <FiMessageSquare className="h-4 w-4 shrink-0" aria-hidden />
                  {t.text}
                </a>
              ) : null}
              {email ? (
                <button
                  type="button"
                  className={btnPrimaryClass()}
                  style={{ backgroundColor: GH.cream, color: GH.charcoal, border: `1.5px solid ${GH.goldBorder}` }}
                  onClick={() => setEmailOpen(true)}
                >
                  <FiMail className="h-4 w-4 shrink-0" aria-hidden />
                  {t.email}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* ── Section 2: Social links (Síguenos) ──────────────────────────── */}
        {socialItems.length ? (
          <div
            className="space-y-2 rounded-xl border border-[#C9B46A]/35 bg-white/55 p-3 ring-1 ring-[#C9B46A]/15"
            data-testid="community-contact-social-icons"
          >
            <div
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: GH.burgundy }}
            >
              {t.socialTitle}
            </div>
            <div className="flex flex-wrap gap-2">
              {socialItems.map(({ key, href, Icon, ariaLabel }) => (
                <a
                  key={key}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={ariaLabel}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#C9B46A]/50 bg-[#FFFDF8] text-lg transition hover:border-[#C9B46A] hover:bg-[#FCF9F2]"
                  style={{ color: GH.burgundy }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Section 3: Website / More information ───────────────────────── */}
        {web ? (
          <div className="space-y-2">
            <h3
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: GH.burgundy }}
            >
              {t.moreTitle}
            </h3>
            <a
              href={web}
              target="_blank"
              rel="noopener noreferrer"
              className={btnPrimaryClass()}
              style={{ backgroundColor: GH.cream, color: GH.charcoal, border: `1.5px solid ${GH.burgundy}` }}
            >
              <FiGlobe className="h-4 w-4 shrink-0" aria-hidden />
              {t.website}
            </a>
          </div>
        ) : null}

        {/* ── Section 4: Event location card ──────────────────────────────── */}
        {hasLocation ? (
          <div className="rounded-xl border border-[#C9B46A]/35 bg-white/70 p-3 sm:p-4 space-y-2">
            <h3
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: GH.burgundy }}
            >
              {t.locationTitle}
            </h3>
            {draft.venue.trim() ? (
              <p className="text-sm font-semibold" style={{ color: GH.charcoal }}>
                {draft.venue.trim()}
              </p>
            ) : null}
            {draft.addressLine1.trim() ? (
              <p className="text-sm" style={{ color: GH.muted }}>{draft.addressLine1.trim()}</p>
            ) : null}
            {draft.addressLine2?.trim() ? (
              <p className="text-sm" style={{ color: GH.muted }}>{draft.addressLine2.trim()}</p>
            ) : null}
            {cityStateZip ? (
              <p className="text-sm font-medium" style={{ color: GH.charcoal }}>{cityStateZip}</p>
            ) : null}
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnPrimaryClass()} mt-1`}
                style={{ backgroundColor: GH.burgundy, color: "#FFFCF7" }}
              >
                <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
                {t.map}
              </a>
            ) : null}
          </div>
        ) : null}

        {/* ── Section 6: Trust cue ────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pt-1">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold"
            style={{ borderColor: GH.goldBorder, color: GH.green, backgroundColor: GH.greenBg }}
          >
            {t.trustLabel}
          </span>
        </div>

      </div>

      {email ? (
        <EmailContactOptionsSheet
          open={emailOpen}
          onClose={() => setEmailOpen(false)}
          email={email}
          lang={lang}
          mailtoHref={mailHref}
          mailtoSubject={mailSub}
        />
      ) : null}
    </section>
  );
}
