import { FiClock, FiGlobe, FiMapPin, FiMessageCircle, FiPhone, FiZap } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import type { ServiciosBusinessProfile, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { nonEmpty } from "../lib/serviciosProfileVisibility";
import { ServiciosLeadForm } from "./ServiciosLeadForm";
import { ServiciosStarRating } from "./ServiciosStarRating";
import { ServiciosSidebarAreasMap } from "./ServiciosSidebarAreasMap";
import { ServiciosOfferCard } from "./ServiciosOfferCard";
import { SV } from "./serviciosDesignTokens";

export function ServiciosSidebar({ profile, lang }: { profile: ServiciosBusinessProfile; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const rating = profile.rating;
  const reviewCount = profile.reviewCount;
  const phone = profile.phone?.trim();
  const website = profile.websiteUrl?.trim();
  const websiteLabel = profile.websiteLabel?.trim() || L.visitWebsite;
  const hours = profile.hours;
  const location = profile.locationSummary?.trim();
  const primaryCta = profile.primaryCtaLabel?.trim() || L.requestQuote;
  const featured = profile.isFeatured;
  const featuredLabel = profile.featuredLabel?.trim() || L.featured;

  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";

  return (
    <div className="flex flex-col gap-5 lg:sticky lg:top-5 lg:self-start">
      <div
        className="rounded-2xl border p-6 shadow-md"
        style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadow }}
      >
        {featured ? (
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
        ) : null}

        <div className={featured || (rating != null && reviewCount != null) ? "pt-4" : ""}>
          {phone ? (
            <a
              href={telHref}
              className="flex items-center gap-2 text-sm font-semibold text-[color:var(--lx-text)] hover:text-[#3B66AD]"
            >
              <FiPhone className="h-4 w-4 shrink-0 text-[#3B66AD]" aria-hidden />
              {phone}
            </a>
          ) : null}

          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 text-sm font-semibold text-[#3B66AD] hover:underline ${phone ? "mt-3" : ""}`}
            >
              <FiGlobe className="h-4 w-4 shrink-0" aria-hidden />
              {websiteLabel}
            </a>
          ) : null}

          <button
            type="button"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-[0.97]"
            style={{ backgroundColor: SV.blue, boxShadow: "0 12px 32px rgba(59,102,173,0.28)" }}
          >
            <FiZap className="h-5 w-5" aria-hidden />
            {primaryCta}
          </button>

          {phone || profile.messageEnabled === true ? (
            <div
              className={`mt-3 grid gap-2 ${phone && profile.messageEnabled === true ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {phone ? (
                <a
                  href={telHref}
                  className="flex items-center justify-center rounded-xl border border-black/[0.1] bg-white py-3 text-sm font-semibold text-[color:var(--lx-text)] transition hover:border-[#3B66AD]/35"
                >
                  <FiPhone className="mr-2 h-4 w-4 text-[#3B66AD]" aria-hidden />
                  {L.call}
                </a>
              ) : null}
              {profile.messageEnabled === true ? (
                <button
                  type="button"
                  className="flex items-center justify-center rounded-xl border border-black/[0.1] bg-white py-3 text-sm font-semibold text-[color:var(--lx-text)] transition hover:border-[#3B66AD]/35"
                >
                  <FiMessageCircle className="mr-2 h-4 w-4 text-[#3B66AD]" aria-hidden />
                  {L.message}
                </button>
              ) : null}
            </div>
          ) : null}

          {hours?.openNowLabel && nonEmpty(hours.todayHoursLine) ? (
            <p className="mt-5 flex items-start gap-2 text-xs text-[color:var(--lx-text-2)]">
              <FiClock className="mt-0.5 h-4 w-4 shrink-0 text-[#3B66AD]" aria-hidden />
              <span>
                <span className="font-semibold text-[color:var(--lx-text)]">{hours.openNowLabel}:</span>{" "}
                {hours.todayHoursLine}
              </span>
            </p>
          ) : null}

          {location ? (
            <p className="mt-3 flex items-start gap-2 text-xs text-[color:var(--lx-text-2)]">
              <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#3B66AD]" aria-hidden />
              {location}
            </p>
          ) : null}

          <ServiciosLeadForm lang={lang} />
        </div>
      </div>

      <ServiciosSidebarAreasMap profile={profile} lang={lang} />

      <ServiciosOfferCard profile={profile} lang={lang} />
    </div>
  );
}
