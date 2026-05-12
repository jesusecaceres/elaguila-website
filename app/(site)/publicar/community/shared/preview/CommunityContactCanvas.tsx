"use client";

import type { ComponentType } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  digitsOnly,
  formatPhoneInputDisplay,
} from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiGlobe, FiMail, FiMapPin, FiMessageSquare, FiPhone } from "react-icons/fi";

import { COMMUNITY_DISCOVERY_REGION } from "../constants/communityRegion";
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
  orange: "#E67E22",
  amber: "#FFBF00",
  charcoal: "#333333",
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
    contactTitle: "Contacto",
    locationTitle: "Ubicación",
    call: "Llamar",
    text: "Enviar texto",
    email: "Escribir correo",
    website: "Sitio web",
    map: "Cómo llegar",
    discovery: "Región de descubrimiento",
  },
  en: {
    contactTitle: "Contact",
    locationTitle: "Location",
    call: "Call",
    text: "Text message",
    email: "Email",
    website: "Website",
    map: "Get directions",
    discovery: "Discovery region",
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

export function CommunityContactCanvas({ draft, lang }: { draft: Draft; lang: Lang }) {
  const t = UI[lang];
  const k = kindOf(draft);
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
  const st = draft.state.trim() || "CA";
  const zip = draft.zip.trim();
  const cityStateZip = zip ? `${cityDisplay}, ${st} ${zip}` : cityDisplay ? `${cityDisplay}, ${st}` : "";

  const smsBody = SMS_BODY[k][lang];
  const mailSub = MAIL_SUBJECT[k][lang];

  const socialItems: {
    key: string;
    href: string | null;
    Icon: ComponentType<{ className?: string }>;
    label: string;
  }[] = [
    {
      key: "fb",
      href: normalizeSocialUrlForOpen(draft.socialLinks.facebook),
      Icon: FaFacebook,
      label: "Facebook",
    },
    {
      key: "ig",
      href: normalizeSocialUrlForOpen(draft.socialLinks.instagram),
      Icon: FaInstagram,
      label: "Instagram",
    },
    {
      key: "tt",
      href: normalizeSocialUrlForOpen(draft.socialLinks.tiktok),
      Icon: FaTiktok,
      label: "TikTok",
    },
    {
      key: "yt",
      href: normalizeSocialUrlForOpen(draft.socialLinks.youtube),
      Icon: FaYoutube,
      label: "YouTube",
    },
    {
      key: "x",
      href: normalizeSocialUrlForOpen(draft.socialLinks.xTwitter),
      Icon: FaXTwitter,
      label: "X",
    },
    {
      key: "li",
      href: normalizeSocialUrlForOpen(draft.socialLinks.linkedin),
      Icon: FaLinkedin,
      label: "LinkedIn",
    },
  ].filter((x) => x.href);

  return (
    <section
      className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-black/10 shadow-sm"
      style={{ backgroundColor: GH.cream, color: GH.charcoal }}
    >
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${GH.orange}, ${GH.amber})`,
        }}
        aria-hidden
      />
      <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5 lg:gap-6">
        <div className="min-w-0 space-y-3">
          <h2 className="text-base font-extrabold tracking-tight" style={{ color: GH.charcoal }}>
            {t.contactTitle}
          </h2>
          {draft.organizer.trim() ? (
            <p className="text-sm font-semibold opacity-90">{draft.organizer.trim()}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {phone10 ? (
              <a
                href={telUriFromUs10(phone10)}
                className={btnPrimaryClass()}
                style={{ backgroundColor: GH.orange, color: "#FFFCF7" }}
              >
                <FiPhone className="h-4 w-4 shrink-0" aria-hidden />
                {t.call}{" "}
                <span className="font-semibold">{formatPhoneInputDisplay(digitsOnly(draft.phone))}</span>
              </a>
            ) : null}
            {wa10 ? (
              <a
                href={whatsAppUri(wa10, smsBody)}
                target="_blank"
                rel="noopener noreferrer"
                className={btnPrimaryClass()}
                style={{ backgroundColor: GH.amber, color: GH.charcoal }}
              >
                <FaWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
                WhatsApp
              </a>
            ) : null}
            {sms10 ? (
              <a
                href={smsUri(sms10, smsBody)}
                className={btnPrimaryClass()}
                style={{ backgroundColor: GH.cream, color: GH.charcoal, border: `2px solid ${GH.orange}` }}
              >
                <FiMessageSquare className="h-4 w-4 shrink-0" aria-hidden />
                {t.text}
              </a>
            ) : null}
            {email ? (
              <a
                href={mailtoCommunity({ to: email, subject: mailSub })}
                className={btnPrimaryClass()}
                style={{ backgroundColor: GH.cream, color: GH.charcoal, border: `2px solid ${GH.amber}` }}
              >
                <FiMail className="h-4 w-4 shrink-0" aria-hidden />
                {t.email}
              </a>
            ) : null}
            {web ? (
              <a
                href={web}
                target="_blank"
                rel="noopener noreferrer"
                className={btnPrimaryClass()}
                style={{ backgroundColor: GH.cream, color: GH.charcoal, border: `2px solid ${GH.orange}` }}
              >
                <FiGlobe className="h-4 w-4 shrink-0" aria-hidden />
                {t.website}
              </a>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 space-y-2 rounded-xl border border-black/10 bg-white/70 p-3 sm:p-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: GH.orange }}>
            {t.locationTitle}
          </h3>
          {draft.venue.trim() ? <p className="text-sm font-semibold">{draft.venue.trim()}</p> : null}
          {draft.addressLine1.trim() ? <p className="text-sm">{draft.addressLine1.trim()}</p> : null}
          {cityDisplay ? <p className="text-sm font-semibold">{cityStateZip}</p> : null}
          <p className="text-[11px] opacity-70">
            {t.discovery}: {COMMUNITY_DISCOVERY_REGION}
          </p>
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={btnPrimaryClass()}
              style={{ backgroundColor: GH.orange, color: "#FFFCF7" }}
            >
              <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
              {t.map}
            </a>
          ) : null}
        </div>
      </div>

      {socialItems.length ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-black/10 px-4 py-3 sm:px-5">
          <span className="text-xs font-bold uppercase tracking-wide opacity-70">
            {lang === "es" ? "Redes" : "Social"}
          </span>
          <div className="flex flex-wrap gap-2">
            {socialItems.map(({ key, href, Icon, label }) => (
              <a
                key={key}
                href={href!}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-lg transition hover:border-black/25"
                style={{ color: GH.orange }}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
