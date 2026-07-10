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
import { FaFacebook, FaInstagram, FaLinkedin, FaPinterest, FaSnapchat, FaTiktok, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiExternalLink, FiGlobe, FiMail, FiMapPin, FiMessageSquare, FiPhone } from "react-icons/fi";

import { CommunityLeonixMapVisual } from "./CommunityLeonixMapVisual";
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
import { normalizeWebsiteForOpen, normalizeSocialUrlForOpen } from "../lib/communityWebsiteAndSocial";
import type { ClasesClassLinks, ClasesQuickDraft, ComunidadEventLinks, ComunidadQuickDraft } from "../types/communityQuickDraft";
import {
  trackCommunityPhoneClick,
  trackCommunityWhatsAppClick,
  trackCommunityMessageClick,
  trackCommunityEmailClick,
  trackCommunityWebsiteClick,
  type CommunityGlobalAnalyticsCtx,
} from "@/app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics";

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

function buildCommunityLocationLine({
  address,
  city,
  state,
  zipCode,
  country,
}: {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}): string {
  const parts: string[] = [];
  if (address.trim()) parts.push(address.trim());
  if (city.trim()) parts.push(city.trim());
  if (state.trim()) parts.push(state.trim());
  if (zipCode.trim()) parts.push(zipCode.trim());
  if (country.trim()) parts.push(country.trim());
  return parts.join(", ");
}

function buildCommunityGoogleMapsEmbedUrl(locationLine: string): string {
  if (!locationLine.trim()) return "";
  const encoded = encodeURIComponent(locationLine.trim());
  return `https://www.google.com/maps?q=${encoded}&output=embed`;
}

function buildCommunityGoogleMapsDirectionsUrl(locationLine: string): string {
  if (!locationLine.trim()) return "";
  const encoded = encodeURIComponent(locationLine.trim());
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
}

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

const UI_COMUNIDAD = {
  es: {
    contactTitle: "Contacto del organizador",
    socialTitle: "Síguenos",
    locationTitle: "Lugar del evento",
    moreTitle: "Más información",
    trustLabel: "Publicado en Leonix",
    call: "Llamar",
    text: "Enviar texto",
    email: "Escribir correo",
    website: "Sitio web del evento",
    register: "Registrarse",
    tickets: "Boletos",
    donate: "Donar",
    eventProgram: "Programa del evento",
    eventGuide: "Guía del evento",
    vendors: "Vendedores",
    foodVendors: "Comida / puestos",
    sponsors: "Patrocinadores",
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
    website: "Event website",
    register: "Register",
    tickets: "Tickets",
    donate: "Donate",
    eventProgram: "Event program",
    eventGuide: "Event guide",
    vendors: "Vendors",
    foodVendors: "Food / vendors",
    sponsors: "Sponsors",
    map: "View on map",
    copyEmail: "Copy email",
    copyPhone: "Copy phone",
  },
} as const;

const UI_CLASES = {
  es: {
    contactTitle: "Contacto del instructor / organizador",
    socialTitle: "Síguenos",
    locationTitle: "Lugar de la clase",
    moreTitle: "Más información de la clase",
    trustLabel: "Publicado en Leonix",
    call: "Llamar",
    text: "Enviar texto",
    email: "Escribir correo",
    website: "Sitio web de la clase",
    register: "Registrarse",
    pay: "Pagar",
    tickets: "Boletos",
    donate: "Donar",
    materials: "Materiales",
    syllabus: "Programa / temario",
    classGuide: "Guía de la clase",
    instructorPage: "Página del instructor",
    studentPortal: "Portal del estudiante",
    vendors: "Vendedores / recursos",
    foodVendors: "Comida / puestos",
    sponsors: "Patrocinadores",
    map: "Ver en el mapa",
    copyEmail: "Copiar correo",
    copyPhone: "Copiar teléfono",
  },
  en: {
    contactTitle: "Instructor / organizer contact",
    socialTitle: "Follow us",
    locationTitle: "Class location",
    moreTitle: "More class information",
    trustLabel: "Published on Leonix",
    call: "Call",
    text: "Text message",
    email: "Email",
    website: "Class website",
    register: "Register",
    pay: "Pay",
    tickets: "Tickets",
    donate: "Donate",
    materials: "Materials",
    syllabus: "Program / syllabus",
    classGuide: "Class guide",
    instructorPage: "Instructor page",
    studentPortal: "Student portal",
    vendors: "Vendors / resources",
    foodVendors: "Food / vendors",
    sponsors: "Sponsors",
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
    snapchat: "Abrir Snapchat",
    pinterest: "Abrir Pinterest",
  },
  en: {
    facebook: "Open Facebook",
    instagram: "Open Instagram",
    tiktok: "Open TikTok",
    youtube: "Open YouTube",
    x: "Open X / Twitter",
    linkedin: "Open LinkedIn",
    snapchat: "Open Snapchat",
    pinterest: "Open Pinterest",
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
  analyticsCtx,
  locationOnlineLabel,
}: {
  draft: Draft;
  lang: Lang;
  /** Optional DOM id for scroll targets (e.g. published anuncio “Ver contacto”). */
  sectionHtmlId?: string;
  /** When provided, real analytics events fire on every CTA click. Omit in preview mode. */
  analyticsCtx?: CommunityGlobalAnalyticsCtx;
  /** When class/event is online-only, show this instead of a physical map. */
  locationOnlineLabel?: string;
}) {
  const k = kindOf(draft);
  const t = k === "clases" ? UI_CLASES[lang] : UI_COMUNIDAD[lang];
  const [emailOpen, setEmailOpen] = useState(false);
  const phone10 = usPhoneDigits10(draft.phone);
  const wa10 = usPhoneDigits10(draft.whatsapp);
  const smsRaw = draft.smsPhone.trim() ? draft.smsPhone : draft.phone;
  const sms10 = usPhoneDigits10(smsRaw);
  const email = draft.email.trim();
  const web = websiteHref(draft.website);
  const eventLinks: ComunidadEventLinks | null =
    draft.kind === "comunidad" ? (draft as ComunidadQuickDraft).eventLinks : null;
  const classLinks: ClasesClassLinks | null =
    draft.kind === "clases" ? (draft as ClasesQuickDraft).classLinks : null;

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

  const locationLine = buildCommunityLocationLine({
    address: draft.addressLine1,
    city: cityDisplay,
    state: st,
    zipCode: zip,
    country,
  });
  const mapsEmbedUrl = buildCommunityGoogleMapsEmbedUrl(locationLine);
  const mapsDirectionsUrl = buildCommunityGoogleMapsDirectionsUrl(locationLine);

  const smsBody = SMS_BODY[k][lang];
  const mailSub = MAIL_SUBJECT[k][lang];
  const mailHref = email ? mailtoCommunity({ to: email, subject: mailSub }) : "";

  const sAria = SOCIAL_ARIA[lang];
  const socialItems: {
    key: string;
    href: string | null;
    Icon: ComponentType<{ className?: string }>;
    ariaLabel: string;
    label: string;
    brandColor: string;
  }[] = [
    { key: "fb", href: normalizeSocialUrlForOpen(draft.socialLinks.facebook, "facebook"), Icon: FaFacebook, ariaLabel: sAria.facebook, label: "Facebook", brandColor: "#1877F2" },
    { key: "ig", href: normalizeSocialUrlForOpen(draft.socialLinks.instagram, "instagram"), Icon: FaInstagram, ariaLabel: sAria.instagram, label: "Instagram", brandColor: "#E4405F" },
    { key: "tt", href: normalizeSocialUrlForOpen(draft.socialLinks.tiktok, "tiktok"), Icon: FaTiktok, ariaLabel: sAria.tiktok, label: "TikTok", brandColor: "#000000" },
    { key: "yt", href: normalizeSocialUrlForOpen(draft.socialLinks.youtube, "youtube"), Icon: FaYoutube, ariaLabel: sAria.youtube, label: "YouTube", brandColor: "#FF0000" },
    { key: "x", href: normalizeSocialUrlForOpen(draft.socialLinks.xTwitter, "xTwitter"), Icon: FaXTwitter, ariaLabel: sAria.x, label: "X", brandColor: "#000000" },
    { key: "li", href: normalizeSocialUrlForOpen(draft.socialLinks.linkedin, "linkedin"), Icon: FaLinkedin, ariaLabel: sAria.linkedin, label: "LinkedIn", brandColor: "#0A66C2" },
    { key: "sc", href: normalizeSocialUrlForOpen(draft.socialLinks.snapchat ?? "", "snapchat"), Icon: FaSnapchat, ariaLabel: sAria.snapchat, label: "Snapchat", brandColor: "#FFFC00" },
    { key: "pi", href: normalizeSocialUrlForOpen(draft.socialLinks.pinterest ?? "", "pinterest"), Icon: FaPinterest, ariaLabel: sAria.pinterest, label: "Pinterest", brandColor: "#E60023" },
  ].filter((x) => x.href);

  /** Build the ordered list of event-specific useful link CTAs (Comunidad only). */
  const eventLinkItems: { key: string; href: string; label: string }[] = [];
  if (eventLinks) {
    const el = eventLinks;
    const push = (key: string, raw: string, label: string) => {
      const href = normalizeWebsiteForOpen(raw);
      if (href) eventLinkItems.push({ key, href, label });
    };
    const tc = UI_COMUNIDAD[lang];
    push("reg", el.registrationUrl, tc.register);
    push("tix", el.ticketsUrl, tc.tickets);
    push("don", el.donationUrl, tc.donate);
    push("prg", el.eventProgramUrl, tc.eventProgram);
    push("gui", el.eventGuideUrl, tc.eventGuide);
    push("vnd", el.vendorListUrl, tc.vendors);
    push("fvd", el.foodVendorsUrl, tc.foodVendors);
    push("spo", el.sponsorsUrl, tc.sponsors);
    if (el.customLink1Label.trim() && normalizeWebsiteForOpen(el.customLink1Url)) {
      push("c1", el.customLink1Url, el.customLink1Label.trim());
    }
    if (el.customLink2Label.trim() && normalizeWebsiteForOpen(el.customLink2Url)) {
      push("c2", el.customLink2Url, el.customLink2Label.trim());
    }
  }

  /** Build the ordered list of class-specific useful link CTAs (Clases only). */
  const classLinkItems: { key: string; href: string; label: string }[] = [];
  if (classLinks) {
    const cl = classLinks;
    const tc = UI_CLASES[lang];
    const push = (key: string, raw: string, label: string) => {
      const href = normalizeWebsiteForOpen(raw);
      if (href) classLinkItems.push({ key, href, label });
    };
    push("reg", cl.registrationUrl, tc.register);
    push("pay", cl.paymentUrl, tc.pay);
    push("tix", cl.ticketsUrl, tc.tickets);
    push("don", cl.donationUrl, tc.donate);
    push("mat", cl.classMaterialsUrl, tc.materials);
    push("syl", cl.syllabusUrl, tc.syllabus);
    push("gui", cl.classGuideUrl, tc.classGuide);
    push("ins", cl.instructorPageUrl, tc.instructorPage);
    push("stu", cl.studentPortalUrl, tc.studentPortal);
    push("vnd", cl.vendorsResourcesUrl, tc.vendors);
    push("fvd", cl.foodVendorsUrl, tc.foodVendors);
    push("spo", cl.sponsorsUrl, tc.sponsors);
    if (cl.customLink1Label.trim() && normalizeWebsiteForOpen(cl.customLink1Url)) {
      push("c1", cl.customLink1Url, cl.customLink1Label.trim());
    }
    if (cl.customLink2Label.trim() && normalizeWebsiteForOpen(cl.customLink2Url)) {
      push("c2", cl.customLink2Url, cl.customLink2Label.trim());
    }
  }

  const allLinkItems = k === "clases" ? classLinkItems : eventLinkItems;

  const hasContactActions = !!(phone10 || wa10 || sms10 || email);
  const hasPhysicalLocation = !!(draft.venue.trim() || draft.addressLine1.trim() || cityStateZip);
  const hasOnlineLocation = Boolean(locationOnlineLabel?.trim()) && !hasPhysicalLocation;
  const hasLocation = hasPhysicalLocation || hasOnlineLocation;
  const hasMoreInfo = !!(web || allLinkItems.length);

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
                  onClick={() => analyticsCtx && trackCommunityPhoneClick(analyticsCtx)}
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
                  onClick={() => analyticsCtx && trackCommunityWhatsAppClick(analyticsCtx)}
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
                  onClick={() => analyticsCtx && trackCommunityMessageClick(analyticsCtx)}
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
                  onClick={() => { setEmailOpen(true); analyticsCtx && trackCommunityEmailClick(analyticsCtx); }}
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
              {socialItems.map(({ key, href, Icon, ariaLabel, label, brandColor }) => (
                <a
                  key={key}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={ariaLabel}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#C9B46A]/45 bg-[#FFFDF8] px-3 py-1.5 text-xs font-semibold text-[#3D3428] transition hover:border-[#C9B46A] hover:bg-[#FCF9F2]"
                  style={{ color: brandColor === "#FFFC00" ? "#3D3428" : brandColor }}
                >
                  <span className="h-4 w-4 shrink-0" style={{ color: brandColor }} aria-hidden>
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Section 3: More information / event links ───────────────────── */}
        {hasMoreInfo ? (
          <div className="space-y-2">
            <h3
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: GH.burgundy }}
            >
              {t.moreTitle}
            </h3>
            <div className="flex flex-wrap gap-2">
              {web ? (
                <a
                  href={web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnPrimaryClass()}
                  style={{ backgroundColor: GH.cream, color: GH.charcoal, border: `1.5px solid ${GH.burgundy}` }}
                  onClick={() => analyticsCtx && trackCommunityWebsiteClick(analyticsCtx, "website")}
                >
                  <FiGlobe className="h-4 w-4 shrink-0" aria-hidden />
                  {t.website}
                </a>
              ) : null}
              {allLinkItems.map(({ key, href, label }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnPrimaryClass()}
                  style={{ backgroundColor: GH.cream, color: GH.charcoal, border: `1.5px solid ${GH.burgundy}` }}
                  onClick={() => analyticsCtx && trackCommunityWebsiteClick(analyticsCtx, key)}
                >
                  <FiExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                  {label}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Section 4: Event / class location card ─────────────────────── */}
        {hasLocation ? (
          <div className="space-y-3 rounded-xl border border-[#C9B46A]/35 bg-white/70 p-3 sm:p-4">
            <h3
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: GH.burgundy }}
            >
              {t.locationTitle}
            </h3>
            {hasOnlineLocation ? (
              <p className="text-sm font-bold" style={{ color: GH.charcoal }}>
                {locationOnlineLabel}
              </p>
            ) : (
              <>
                {draft.venue.trim() ? (
                  <p className="text-sm font-semibold" style={{ color: GH.charcoal }}>
                    {draft.venue.trim()}
                  </p>
                ) : null}
                {cityStateZip ? (
                  <p className="text-base font-bold" style={{ color: GH.charcoal }}>
                    {cityStateZip}
                  </p>
                ) : null}
                {draft.addressLine1.trim() ? (
                  <p className="text-sm" style={{ color: GH.muted }}>{draft.addressLine1.trim()}</p>
                ) : null}
                {draft.addressLine2?.trim() ? (
                  <p className="text-sm" style={{ color: GH.muted }}>{draft.addressLine2.trim()}</p>
                ) : null}
                {country ? (
                  <p className="text-sm" style={{ color: GH.muted }}>{country}</p>
                ) : null}
                {mapsEmbedUrl && locationLine ? (
                  <div className="mt-2 space-y-2">
                    <div className="overflow-hidden rounded-lg h-[160px] sm:h-[200px]">
                      <iframe
                        src={mapsEmbedUrl}
                        title={lang === "es" ? "Mapa del lugar del evento" : "Event location map"}
                        className="h-full w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                    {mapsDirectionsUrl ? (
                      <a
                        href={mapsDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${btnPrimaryClass()} w-full sm:w-auto`}
                        style={{ backgroundColor: GH.burgundy, color: "#FFFCF7" }}
                      >
                        <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
                        {t.map}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}

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
