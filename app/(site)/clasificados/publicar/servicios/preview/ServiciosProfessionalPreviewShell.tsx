"use client";

import Image from "next/image";
import { FiMapPin } from "react-icons/fi";
import type { ServiciosProfileResolved, ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { serviciosImageUnoptimized } from "@/app/servicios/lib/serviciosMediaUrl";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { SV } from "@/app/servicios/components/serviciosDesignTokens";
import {
  hasAboutSectionResolved,
  hasBusinessHighlightsResolved,
  hasGallerySectionResolved,
  hasHeroIdentityResolved,
  hasQuickFactsResolved,
  hasReviewsSectionResolved,
  hasServicesSectionResolved,
  hasTrustSectionResolved,
} from "@/app/servicios/lib/serviciosProfilePresence";
import { ServiciosQuickFacts } from "@/app/servicios/components/ServiciosQuickFacts";
import { ServiciosAbout } from "@/app/servicios/components/ServiciosAbout";
import { ServiciosTrustSection } from "@/app/servicios/components/ServiciosTrustSection";
import { ServiciosOfferedSection } from "@/app/servicios/components/ServiciosServicesGrid";
import { ServiciosGalleryWithTabs } from "@/app/servicios/components/ServiciosGalleryWithTabs";
import { ServiciosReviews } from "@/app/servicios/components/ServiciosReviews";
import { ServiciosBusinessHubContactCard } from "@/app/servicios/components/ServiciosBusinessHubContactCard";
import { ServiciosPromocionesCard } from "@/app/servicios/components/ServiciosPromocionesCard";
import { ServiciosHighlightsSection } from "@/app/servicios/components/ServiciosHighlightsSection";

const CHIP =
  "inline-flex max-w-full shrink-0 items-center rounded-full border border-[#D4C4A8]/90 bg-[#EBDCC4] px-2.5 py-1 text-[11px] font-semibold leading-tight text-[#1E1814] sm:text-xs";

function getPreviewCtas(template: ServiciosListingTemplate, lang: ServiciosLang) {
  if (template === "legal_provider") {
    return lang === "en"
      ? { primary: "Call for Consultation", servicesTitle: "Practice areas" }
      : { primary: "Llamar para consulta", servicesTitle: "Áreas de práctica" };
  }
  if (template === "clinic_provider") {
    return lang === "en"
      ? { primary: "Request Appointment", servicesTitle: "Services & care" }
      : { primary: "Solicitar cita", servicesTitle: "Servicios y atención" };
  }
  if (template === "financial_provider") {
    return lang === "en"
      ? { primary: "Request Help", servicesTitle: "Tax & accounting" }
      : { primary: "Solicitar ayuda", servicesTitle: "Impuestos y contabilidad" };
  }
  if (template === "advisor_provider") {
    return lang === "en"
      ? { primary: "Schedule Consultation", servicesTitle: "Consulting services" }
      : { primary: "Agendar consulta", servicesTitle: "Servicios de consultoría" };
  }
  return lang === "en"
    ? { primary: "Contact", servicesTitle: "Services" }
    : { primary: "Contactar", servicesTitle: "Servicios" };
}

function cleanChipLabel(raw: string): string {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  if (lower === "otro" || lower === "other") return "";
  if (lower.startsWith("otro:") || lower.startsWith("other:")) {
    return t.split(":").slice(1).join(":").trim();
  }
  return t;
}

function collectServiceChips(profile: ServiciosProfileResolved, max: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string) => {
    const c = cleanChipLabel(raw);
    if (!c) return;
    const key = c.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(c);
  };
  for (const s of profile.services) add(s.title);
  const spec = profile.about?.specialtiesLine?.trim();
  if (spec) {
    for (const part of spec.split(/[,;|·]/)) add(part);
  }
  return out.slice(0, max);
}

function StarRow({ rating, lang }: { rating: number; lang: ServiciosLang }) {
  const aria =
    lang === "en" ? `${rating.toFixed(1)} out of 5 stars` : `${rating.toFixed(1)} de 5 estrellas`;
  return (
    <div className="flex items-center gap-1" role="img" aria-label={aria}>
      {Array.from({ length: 5 }, (_, i) => {
        const v = rating - i;
        const pct = Math.round(Math.min(1, Math.max(0, v)) * 100);
        return (
          <span key={i} className="relative h-3.5 w-[0.9em] text-[12px] leading-none">
            <span className="absolute text-[#d4cfc4]" aria-hidden>
              ★
            </span>
            <span className="absolute overflow-hidden text-[#C9A84A]" style={{ width: `${pct}%` }} aria-hidden>
              ★
            </span>
          </span>
        );
      })}
      <span className="ml-0.5 text-xs font-bold text-[#2A2620]">{rating.toFixed(1)}</span>
    </div>
  );
}

function headerAccent(template: ServiciosListingTemplate): string {
  if (template === "legal_provider") return "from-[#2A2620] via-[#3B2117] to-[#4A4036]";
  if (template === "clinic_provider") return "from-[#3B66AD] via-[#2f5699] to-[#6F7A3A]";
  if (template === "financial_provider") return "from-[#5a6a2f] via-[#6F7A3A] to-[#3B66AD]";
  return "from-[#6F7A3A] via-[#5a6a2f] to-[#D4AF37]";
}

export function ServiciosProfessionalPreviewShell({
  profile,
  lang,
  template,
  cityFallback,
  draftSlug,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  template: ServiciosListingTemplate;
  cityFallback?: string;
  draftSlug?: string;
}) {
  const ctas = getPreviewCtas(template, lang);
  const chips = collectServiceChips(profile, 6);
  const category = profile.hero.categoryLine?.trim();
  const location =
    profile.hero.locationSummary?.trim() || cityFallback?.trim() || "";
  const snippet = profile.about?.text?.trim().slice(0, 200);
  const thumb =
    profile.hero.logoUrl || profile.gallery[0]?.url || profile.hero.coverImageUrl || null;
  const ratingValue =
    typeof profile.hero.rating === "number" && Number.isFinite(profile.hero.rating) && profile.hero.rating > 0
      ? profile.hero.rating
      : undefined;
  const reviewCount =
    typeof profile.hero.reviewCount === "number" && profile.hero.reviewCount > 0
      ? profile.hero.reviewCount
      : undefined;
  const languageBadges = profile.hero.badges.filter((b) => b.kind === "spanish" || b.kind === "custom");

  if (!hasHeroIdentityResolved(profile)) {
    return null;
  }

  return (
    <div
      className="min-w-0 overflow-x-hidden rounded-2xl border shadow-sm sm:rounded-3xl"
      style={{ backgroundColor: SV.bg, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <div className={`bg-gradient-to-r ${headerAccent(template)} px-4 py-5 text-white sm:px-6 sm:py-6`}>
        <div className="flex gap-3 sm:gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/30 bg-white/10 sm:h-20 sm:w-20">
            {thumb ? (
              <Image
                src={thumb}
                alt={profile.hero.logoAlt || profile.identity.businessName}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized={serviciosImageUnoptimized(thumb)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold uppercase tracking-wide text-white/70">
                {profile.identity.businessName.slice(0, 2)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-lg font-bold leading-snug sm:text-xl md:text-2xl">
              {profile.identity.businessName}
            </h1>
            {category ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-white/85 sm:text-sm">{category}</p>
            ) : null}
            {location ? (
              <p className="flex items-start gap-1.5 text-xs text-white/90 sm:text-sm">
                <FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="line-clamp-2">{location}</span>
              </p>
            ) : null}
            {ratingValue != null ? (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <div className="rounded-md bg-white/15 px-2 py-0.5">
                  <StarRow rating={ratingValue} lang={lang} />
                </div>
                {reviewCount != null ? (
                  <span className="text-[11px] font-medium text-white/85">
                    {lang === "en" ? `(${reviewCount} reviews)` : `(${reviewCount} reseñas)`}
                  </span>
                ) : null}
              </div>
            ) : null}
            {languageBadges.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-1">
                {languageBadges.map((b) => (
                  <span
                    key={`${b.kind}-${b.label}`}
                    className="rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white"
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-b border-[#E8D9C4]/80 bg-[#FFFDF9] px-4 py-3 sm:px-6">
        <a
          href="#servicios-preview-contact"
          className="inline-flex min-h-[44px] w-full max-w-md items-center justify-center rounded-xl bg-gradient-to-r from-[#6F7A3A] to-[#5a6a2f] px-4 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/50"
        >
          {ctas.primary}
        </a>
        <p className="mt-2 text-[11px] text-[#6F6254]">
          {lang === "en"
            ? "Preview — contact actions use your saved phone, WhatsApp, and email below."
            : "Vista previa — el contacto usa el teléfono, WhatsApp y correo que guardaste abajo."}
        </p>
      </div>

      {(chips.length > 0 || snippet) && (
        <div className="space-y-2 border-b border-[#E8D9C4]/60 px-4 py-3 sm:px-6 sm:py-4">
          {chips.length > 0 ? (
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#6F6254]">{ctas.servicesTitle}</p>
              <div className="flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <span key={chip} className={CHIP}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {snippet ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-[#4A4A4A]">{snippet}</p>
          ) : null}
        </div>
      )}

      <div className="px-3 py-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:gap-10">
          <div className="order-1 flex min-w-0 flex-col gap-5 sm:gap-6">
            {hasQuickFactsResolved(profile) ? (
              <ServiciosQuickFacts facts={profile.quickFacts} lang={lang} compact />
            ) : null}

            {hasTrustSectionResolved(profile) ? (
              <ServiciosTrustSection profile={profile} lang={lang} />
            ) : null}

            {hasAboutSectionResolved(profile) ? <ServiciosAbout profile={profile} lang={lang} /> : null}

            <div id="servicios-preview-contact" className="lg:hidden">
              <ServiciosBusinessHubContactCard
                profile={profile}
                lang={lang}
                directContactFasterResponseHint
                showOfferSidebarTeaser={false}
              />
            </div>

            {hasGallerySectionResolved(profile) ? (
              <ServiciosGalleryWithTabs profile={profile} lang={lang} />
            ) : null}

            <div className="lg:hidden">
              <ServiciosPromocionesCard profile={profile} lang={lang} />
            </div>

            {hasServicesSectionResolved(profile) ? (
              <ServiciosOfferedSection services={profile.services} lang={lang} profileForQuote={profile} />
            ) : null}

            {hasBusinessHighlightsResolved(profile) ? (
              <ServiciosHighlightsSection highlights={profile.highlights} lang={lang} />
            ) : null}

            {hasReviewsSectionResolved(profile) ? (
              <ServiciosReviews profile={profile} lang={lang} />
            ) : null}
          </div>

          <aside className="order-2 hidden min-w-0 lg:block lg:sticky lg:top-4 lg:self-start">
            <ServiciosBusinessHubContactCard
              profile={profile}
              lang={lang}
              directContactFasterResponseHint
              showOfferSidebarTeaser={false}
            />
            <div className="mt-5">
              <ServiciosPromocionesCard profile={profile} lang={lang} />
            </div>
          </aside>
        </div>

        {draftSlug?.trim() ? (
          <p className="mx-auto mt-8 max-w-3xl border-t border-black/[0.06] pt-4 text-center text-[11px] leading-relaxed text-[#7A7164]">
            {lang === "en" ? "Draft URL slug" : "URL borrador"}: {draftSlug.trim()}
          </p>
        ) : null}
      </div>
    </div>
  );
}
