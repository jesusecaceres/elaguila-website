import { FiClock, FiGlobe, FiMail, FiMapPin, FiPhone, FiZap } from "react-icons/fi";
import { FaFacebook, FaInstagram, FaLinkedin, FaStar, FaTiktok, FaWhatsapp, FaYoutube } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { nonEmpty } from "../lib/serviciosProfilePrimitives";
import {
  appendWhatsAppPrefill,
  buildServiciosSecondaryActions,
  resolveServiciosQuoteDestination,
  SERVICIOS_UNIVERSAL_QUOTE_MESSAGE_ES,
  type ServiciosQuoteDestinationKind,
  type ServiciosSecondaryAction,
} from "../lib/serviciosContactActions";
import { ServiciosStarRating } from "./ServiciosStarRating";
import { ServiciosActionPanelAreasMap } from "./ServiciosActionPanelAreasMap";
import { ServiciosOfferCard } from "./ServiciosOfferCard";
import { ServiciosTrackedLink } from "./ServiciosTrackedLink";
import { SV } from "./serviciosDesignTokens";

// Leonix premium visual tokens matching Restaurantes
const LEONIX_CARD_SURFACE = "#FFFAF3";
const LEONIX_BORDER = "#D8C2A0";
const LEONIX_PRIMARY_TEXT = "#1F1A17";
const LEONIX_SECONDARY_TEXT = "#5A5148";
const LEONIX_MUTED_TEXT = "#8B7E70";
const LEONIX_GOLD_ACCENT = "#BEA98E";
const LEONIX_DARK_CTA = "#2C1810";
const LEONIX_SUCCESS_GREEN = "#1A4D2E";
const LEONIX_INFO_BLUE = "#355C7D";
const LEONIX_ELEVATED_CHIP = "#F6EBDD";

function secondaryLabel(
  L: ReturnType<typeof getServiciosProfileLabels>,
  a: ServiciosSecondaryAction,
): string {
  switch (a.labelKey) {
    case "whatsapp":
      return L.whatsapp;
    case "call":
      return L.call;
    case "callOffice":
      return L.callOffice;
    case "email":
      return L.email;
    case "visitWebsite":
      return L.visitWebsite;
    default:
      return a.labelKey;
  }
}

function analyticsForQuoteKind(kind: ServiciosQuoteDestinationKind): string {
  if (kind === "sms") return "cta_quote_sms_click";
  if (kind === "whatsapp") return "cta_whatsapp_click";
  if (kind === "tel") return "cta_call_click";
  if (kind === "mailto") return "cta_email_click";
  return "cta_website_click";
}

function analyticsForSecondaryId(id: ServiciosSecondaryAction["id"]): string {
  if (id === "whatsapp") return "cta_whatsapp_click";
  if (id === "call" || id === "callOffice") return "cta_call_click";
  if (id === "email") return "cta_email_click";
  return "cta_website_click";
}

function SecondaryIcon({ id }: { id: ServiciosSecondaryAction["id"] }) {
  const c = "h-4 w-4 shrink-0 text-[#3B66AD]";
  if (id === "whatsapp") return <FaWhatsapp className="h-4 w-4 shrink-0 text-[#25D366]" aria-hidden />;
  if (id === "email") return <FiMail className={c} aria-hidden />;
  if (id === "website") return <FiGlobe className={c} aria-hidden />;
  if (id === "call" || id === "callOffice") return <FiPhone className={c} aria-hidden />;
  return <FiPhone className={c} aria-hidden />;
}

/** Sticky contact / quote panel (right column). */
export function ServiciosActionPanel({
  profile,
  lang,
  listingSlug,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  /** When set, outbound CTAs emit lightweight analytics events. */
  listingSlug?: string;
}) {
  const L = getServiciosProfileLabels(lang);
  const rating = profile.hero.rating;
  const reviewCount = profile.hero.reviewCount;
  const hours = profile.contact.hours;
  const location = profile.hero.locationSummary?.trim();
  const primaryCtaLabel = profile.contact.primaryCtaLabel?.trim() || L.requestQuote;
  const social = profile.contact.socialLinks;
  const featured = profile.contact.isFeatured;
  const featuredLabel = profile.contact.featuredLabel?.trim() || L.featured;

  const quote = resolveServiciosQuoteDestination(profile, lang);
  const quoteHref = quote
    ? quote.kind === "whatsapp"
      ? appendWhatsAppPrefill(quote.href, SERVICIOS_UNIVERSAL_QUOTE_MESSAGE_ES)
      : quote.href
    : null;
  const secondary = buildServiciosSecondaryActions(profile, quote);
  const whatsappInConversionRail =
    quote?.kind === "whatsapp" || secondary.some((s) => s.id === "whatsapp");

  const linkBase =
    "flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full border px-3 py-3 text-sm font-semibold shadow-sm transition hover:shadow-md";
  const primaryClass =
    "flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-[0.97] active:scale-[0.99]";

  const headerBlock = featured ? (
    <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] pb-4">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A84A]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#9a7b28]">
        <FaStar className="h-3.5 w-3.5 text-[#C9A84A]" aria-hidden />
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
    <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] pb-4">
      <ServiciosStarRating value={rating} size="sm" />
      <span className="text-xs font-semibold text-[color:var(--lx-text-2)]">
        {rating.toFixed(1)} ({reviewCount})
      </span>
    </div>
  ) : null;

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div
        className="rounded-3xl border p-4 shadow-md sm:p-6"
        style={{ 
          backgroundColor: LEONIX_CARD_SURFACE, 
          borderColor: LEONIX_BORDER, 
          boxShadow: "0_8px_32px_-8px_rgba(212,165,116,0.15)" 
        }}
      >
        {headerBlock}

        <div className={headerBlock ? "pt-4" : ""}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]">
            {lang === "en" ? "Contact" : "Contacto"}
          </p>

          {quote && quoteHref ? (
            listingSlug ? (
              <ServiciosTrackedLink
                listingSlug={listingSlug}
                eventType={analyticsForQuoteKind(quote.kind)}
                href={quoteHref}
                {...(quote.kind === "website" || quote.kind === "whatsapp"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className={`${primaryClass} mt-3`}
                style={{ backgroundColor: LEONIX_DARK_CTA, boxShadow: "0 12px 32px rgba(44,24,16,0.28)" }}
              >
                <FiZap className="h-5 w-5 shrink-0" aria-hidden />
                {primaryCtaLabel}
              </ServiciosTrackedLink>
            ) : (
              <a
                href={quoteHref}
                {...(quote.kind === "website" || quote.kind === "whatsapp"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className={`${primaryClass} mt-3`}
                style={{ backgroundColor: LEONIX_DARK_CTA, boxShadow: "0 12px 32px rgba(44,24,16,0.28)" }}
              >
                <FiZap className="h-5 w-5 shrink-0" aria-hidden />
                {primaryCtaLabel}
              </a>
            )
          ) : null}

          {secondary.length > 0 ? (
            <div className={`flex flex-col gap-2 ${quote ? "mt-3" : "mt-3"}`}>
              {secondary.map((a) =>
                listingSlug ? (
                  <ServiciosTrackedLink
                    key={`${a.id}-${a.href}`}
                    listingSlug={listingSlug}
                    eventType={analyticsForSecondaryId(a.id)}
                    href={a.href}
                    {...(a.id === "website" || a.id === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={`${linkBase}`}
                style={{ 
                  backgroundColor: "white", 
                  borderColor: LEONIX_BORDER, 
                  color: LEONIX_PRIMARY_TEXT 
                }}
                  >
                    <SecondaryIcon id={a.id} />
                    {secondaryLabel(L, a)}
                  </ServiciosTrackedLink>
                ) : (
                  <a
                    key={`${a.id}-${a.href}`}
                    href={a.href}
                    {...(a.id === "website" || a.id === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={`${linkBase}`}
                style={{ 
                  backgroundColor: "white", 
                  borderColor: LEONIX_BORDER, 
                  color: LEONIX_PRIMARY_TEXT 
                }}
                  >
                    <SecondaryIcon id={a.id} />
                    {secondaryLabel(L, a)}
                  </a>
                ),
              )}
            </div>
          ) : null}

          {social &&
          (social.instagram ||
            social.facebook ||
            social.youtube ||
            social.tiktok ||
            social.linkedin ||
            (!whatsappInConversionRail && social.whatsapp)) ? (
            <div
              className={`flex flex-wrap gap-2 sm:gap-2.5 ${quote || secondary.length > 0 ? "mt-5 border-t border-black/[0.06] pt-4" : "mt-4"}`}
            >
              {social.instagram ? (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border shadow-sm transition hover:shadow-md sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0"
                  style={{ 
                    backgroundColor: LEONIX_ELEVATED_CHIP, 
                    borderColor: LEONIX_BORDER, 
                    color: LEONIX_PRIMARY_TEXT 
                  }}
                  aria-label="Instagram"
                >
                  <FaInstagram className="h-4 w-4" aria-hidden />
                </a>
              ) : null}
              {social.facebook ? (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border shadow-sm transition hover:shadow-md sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0"
                  style={{ 
                    backgroundColor: LEONIX_ELEVATED_CHIP, 
                    borderColor: LEONIX_BORDER, 
                    color: LEONIX_PRIMARY_TEXT 
                  }}
                  aria-label="Facebook"
                >
                  <FaFacebook className="h-4 w-4" aria-hidden />
                </a>
              ) : null}
              {social.youtube ? (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border shadow-sm transition hover:shadow-md sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0"
                  style={{ 
                    backgroundColor: LEONIX_ELEVATED_CHIP, 
                    borderColor: LEONIX_BORDER, 
                    color: LEONIX_PRIMARY_TEXT 
                  }}
                  aria-label="YouTube"
                >
                  <FaYoutube className="h-4 w-4" aria-hidden />
                </a>
              ) : null}
              {social.tiktok ? (
                <a
                  href={social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border shadow-sm transition hover:shadow-md sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0"
                  style={{ 
                    backgroundColor: LEONIX_ELEVATED_CHIP, 
                    borderColor: LEONIX_BORDER, 
                    color: LEONIX_PRIMARY_TEXT 
                  }}
                  aria-label="TikTok"
                >
                  <FaTiktok className="h-4 w-4" aria-hidden />
                </a>
              ) : null}
              {social.linkedin ? (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border shadow-sm transition hover:shadow-md sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0"
                  style={{ 
                    backgroundColor: LEONIX_ELEVATED_CHIP, 
                    borderColor: LEONIX_BORDER, 
                    color: LEONIX_PRIMARY_TEXT 
                  }}
                  aria-label="LinkedIn"
                >
                  <FaLinkedin className="h-4 w-4" aria-hidden />
                </a>
              ) : null}
              {!whatsappInConversionRail && social.whatsapp ? (
                <a
                  href={social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border shadow-sm transition hover:shadow-md sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0"
                  style={{ 
                    backgroundColor: LEONIX_ELEVATED_CHIP, 
                    borderColor: LEONIX_BORDER, 
                    color: "#25D366" 
                  }}
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp className="h-5 w-5" aria-hidden />
                </a>
              ) : null}
            </div>
          ) : null}

          {hours?.openNowLabel && nonEmpty(hours.todayHoursLine) ? (
            <p
              className={`mt-5 flex items-start gap-2 text-xs text-[color:var(--lx-text-2)] ${
                quote || secondary.length > 0 || social ? "border-t border-black/[0.06] pt-4" : ""
              }`}
            >
              <FiClock className="mt-0.5 h-4 w-4 shrink-0 text-[#3B66AD]" aria-hidden />
              <span>
                <span className="font-semibold text-[color:var(--lx-text)]">{hours.openNowLabel}:</span>{" "}
                {hours.todayHoursLine}
              </span>
            </p>
          ) : null}

          {hours?.weeklyRows && hours.weeklyRows.length > 0 ? (
            <div className="mt-4 border-t border-black/[0.06] pt-4">
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
          ) : null}

          {location ? (
            <p className="mt-3 flex items-start gap-2 text-xs text-[color:var(--lx-text-2)]">
              <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#3B66AD]" aria-hidden />
              {location}
            </p>
          ) : null}

          {profile.contact.physicalAddressDisplay ? (
            <div className="mt-3 border-t border-black/[0.06] pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]">{L.physicalLocation}</p>
              <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-[color:var(--lx-text)]">
                {profile.contact.physicalAddressDisplay}
              </p>
              {profile.contact.mapsSearchHref ? (
                listingSlug ? (
                  <ServiciosTrackedLink
                    listingSlug={listingSlug}
                    eventType="cta_maps_click"
                    href={profile.contact.mapsSearchHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-lg text-sm font-semibold text-[#3B66AD] hover:underline"
                  >
                    <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
                    {L.openInMaps}
                  </ServiciosTrackedLink>
                ) : (
                  <a
                    href={profile.contact.mapsSearchHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-lg text-sm font-semibold text-[#3B66AD] hover:underline"
                  >
                    <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
                    {L.openInMaps}
                  </a>
                )
              ) : null}
            </div>
          ) : profile.contact.mapsSearchHref ? (
            listingSlug ? (
              <ServiciosTrackedLink
                listingSlug={listingSlug}
                eventType="cta_maps_click"
                href={profile.contact.mapsSearchHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold text-[#3B66AD] hover:underline"
              >
                <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
                {L.openInMaps}
              </ServiciosTrackedLink>
            ) : (
              <a
                href={profile.contact.mapsSearchHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold text-[#3B66AD] hover:underline"
              >
                <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
                {L.openInMaps}
              </a>
            )
          ) : null}
        </div>
      </div>

      <ServiciosActionPanelAreasMap profile={profile} lang={lang} />

      <ServiciosOfferCard profile={profile} lang={lang} />
    </div>
  );
}
