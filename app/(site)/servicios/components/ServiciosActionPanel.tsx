import { FiClock, FiGlobe, FiMail, FiMapPin, FiPhone, FiZap } from "react-icons/fi";
import { FaFacebook, FaInstagram, FaLinkedin, FaStar, FaTiktok, FaWhatsapp, FaYoutube } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { nonEmpty } from "../lib/serviciosProfilePrimitives";
import {
  buildServiciosSecondaryActions,
  resolveServiciosQuoteDestination,
  type ServiciosQuoteDestinationKind,
  type ServiciosSecondaryAction,
} from "../lib/serviciosContactActions";
import { ServiciosStarRating } from "./ServiciosStarRating";
import { ServiciosActionPanelAreasMap } from "./ServiciosActionPanelAreasMap";
import { ServiciosOfferCard } from "./ServiciosOfferCard";
import { ServiciosTrackedLink } from "./ServiciosTrackedLink";
import { SV } from "./serviciosDesignTokens";

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
  const secondary = buildServiciosSecondaryActions(profile, quote);
  const whatsappInConversionRail =
    quote?.kind === "whatsapp" || secondary.some((s) => s.id === "whatsapp");

  const linkBase =
    "flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-3 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#3B66AD]/40 hover:shadow-md";
  const primaryClass =
    "flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-[0.97] active:scale-[0.99]";

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
        className="rounded-2xl border p-4 shadow-md sm:p-6"
        style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadow }}
      >
        {headerBlock}

        <div className={headerBlock ? "pt-4" : ""}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]">
            {lang === "en" ? "Contact" : "Contacto"}
          </p>

          {quote ? (
            listingSlug ? (
              <ServiciosTrackedLink
                listingSlug={listingSlug}
                eventType={analyticsForQuoteKind(quote.kind)}
                href={quote.href}
                {...(quote.kind === "website" || quote.kind === "whatsapp"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className={`${primaryClass} mt-3`}
                style={{ backgroundColor: SV.blue, boxShadow: "0 12px 32px rgba(59,102,173,0.28)" }}
              >
                <FiZap className="h-5 w-5 shrink-0" aria-hidden />
                {primaryCtaLabel}
              </ServiciosTrackedLink>
            ) : (
              <a
                href={quote.href}
                {...(quote.kind === "website" || quote.kind === "whatsapp"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className={`${primaryClass} mt-3`}
                style={{ backgroundColor: SV.blue, boxShadow: "0 12px 32px rgba(59,102,173,0.28)" }}
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
                    className={linkBase}
                  >
                    <SecondaryIcon id={a.id} />
                    {secondaryLabel(L, a)}
                  </ServiciosTrackedLink>
                ) : (
                  <a
                    key={`${a.id}-${a.href}`}
                    href={a.href}
                    {...(a.id === "website" || a.id === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={linkBase}
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
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#3B66AD] shadow-sm transition hover:border-[#3B66AD]/35 sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0"
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
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#3B66AD] shadow-sm transition hover:border-[#3B66AD]/35 sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0"
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
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#3B66AD] shadow-sm transition hover:border-[#3B66AD]/35 sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0"
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
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#3B66AD] shadow-sm transition hover:border-[#3B66AD]/35 sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0"
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
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#3B66AD] shadow-sm transition hover:border-[#3B66AD]/35 sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0"
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
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#25D366] shadow-sm transition hover:border-[#25D366]/45 sm:h-10 sm:w-10 sm:min-h-0 sm:min-w-0"
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
