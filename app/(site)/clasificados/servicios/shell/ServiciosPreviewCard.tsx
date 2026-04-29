"use client";

import Image from "next/image";
import { FiExternalLink, FiMail, FiMapPin, FiPhone, FiInstagram, FiFacebook, FiYoutube, FiHeart, FiBookmark, FiShare2, FiMessageCircle, FiGlobe } from "react-icons/fi";
import { FaTiktok, FaWhatsapp } from "react-icons/fa";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import type { ServiciosProfileResolved } from "@/app/(site)/servicios/types/serviciosBusinessProfile";

const PREVIEW_CARD =
  "rounded-3xl border border-[#D4A574]/30 bg-[#FFFAF0] shadow-[0_12px_48px_-20px_rgba(212,165,116,0.15)] overflow-hidden";

const MEDIA_CONTAINER = "relative aspect-[16/10] overflow-hidden bg-[#F5F0E8]";

const INFO_SECTION = "p-6 space-y-4";

const TITLE_SECTION = "space-y-2";

const CATEGORY_LINE = "text-sm font-medium text-[#7A7A7A] uppercase tracking-wide";

const BUSINESS_NAME = "text-2xl font-bold text-[#1A1A1A] leading-tight sm:text-3xl";

const LOCATION_ROW = "flex items-center gap-2 text-sm text-[#4A4A4A]";

const HOURS_ROW = "flex items-center gap-2 text-sm font-medium";

const HOURS_OPEN = "text-[#2A7F3E] bg-[#E8F5E8] px-2 py-1 rounded-full";

const HOURS_CLOSED = "text-[#D97706] bg-[#FEF3C7] px-2 py-1 rounded-full";

const SERVICE_MODES = "flex flex-wrap gap-2 mt-3";

const SERVICE_CHIP = "px-3 py-1 rounded-full bg-[#D4A574]/10 text-[#D4A574] text-xs font-medium border border-[#D4A574]/20";

const CTA_SECTION = "flex flex-wrap gap-3 mt-6";

const CTA_BUTTON = "inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 border";

const CTA_PRIMARY = "bg-[#D4A574] text-white border-[#D4A574] hover:bg-[#C19A6B]";

const CTA_SECONDARY = "bg-white text-[#1A1A1A] border-[#E5E5E5] hover:bg-[#FFFAF0] hover:border-[#D4A574]";

const ENGAGEMENT_SECTION = "mt-6 pt-6 border-t border-[#E5E5E5]/50";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating.toFixed(1)} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => {
        const v = rating - i;
        const pct = Math.round(Math.min(1, Math.max(0, v)) * 100);
        return (
          <span key={i} className="relative h-4 w-[1.05em] text-[15px] leading-none">
            <span className="absolute text-white/35" aria-hidden>★</span>
            <span className="absolute overflow-hidden text-[#f0d78c]" style={{ width: `${pct}%` }} aria-hidden>★</span>
          </span>
        );
      })}
    </div>
  );
}

interface ServiciosPreviewCardProps {
  data: ServiciosProfileResolved;
  className?: string;
  lang?: "es" | "en";
  showEngagementMetrics?: boolean;
  listingId?: string;
}

/**
 * Premium Leonix Servicios Preview Card
 * Follows LEONIX_PREVIEW_CARD_CONTRACT.md with engagement metrics integration
 * Adapted for service providers inspired by Yelp/Thumbtack/Angi-style profiles
 */
export function ServiciosPreviewCard({ 
  data, 
  className = "", 
  lang = "es",
  showEngagementMetrics = true,
  listingId
}: ServiciosPreviewCardProps) {
  const hasHeroImage = data.hero.logoUrl || data.hero.coverImageUrl;
  const hasLocation = data.hero.locationSummary;
  const hasHours = data.contact.hours;
  const hasTrustRating = data.hero.rating;
  const hasCtas = data.contact.phoneDisplay || data.contact.websiteHref || data.contact.messageEnabled;

  // Determine primary media
  const primaryMedia = data.hero.logoUrl || data.hero.coverImageUrl;

  return (
    <div className={`${PREVIEW_CARD} ${className}`}>
      {/* Media Block */}
      <div className={MEDIA_CONTAINER}>
        {hasHeroImage ? (
          <Image
            src={primaryMedia!}
            alt={data.hero.logoAlt || data.hero.coverImageAlt || data.identity.businessName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4A574]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiGlobe className="w-8 h-8 text-[#D4A574]" />
              </div>
              <p className="text-sm font-medium text-[#7A7A7A]">Imagen no disponible</p>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className={INFO_SECTION}>
        {/* Title Section */}
        <div className={TITLE_SECTION}>
          {/* Trust Rating */}
          {hasTrustRating && data.hero.rating && (
            <div className="mb-3">
              <StarRow rating={data.hero.rating} />
              <p className="text-xs text-[#7A7A7A] mt-1">
                {data.hero.reviewCount} reseña{data.hero.reviewCount !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* Verification Badge */}
          {data.hero.badges?.some(badge => badge.kind === "verified") && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#2A7F3E]/10 text-[#2A7F3E] text-xs font-medium border border-[#2A7F3E]/20">
                <span className="w-2 h-2 bg-[#2A7F3E] rounded-full"></span>
                Verificado por Leonix
              </span>
            </div>
          )}

          {/* Business Name */}
          <h1 className={BUSINESS_NAME}>{data.identity.businessName}</h1>

          {/* Service Category Line */}
          {data.hero.categoryLine && (
            <p className={CATEGORY_LINE}>{data.hero.categoryLine}</p>
          )}

          {/* Location Row */}
          {hasLocation && (
            <div className={LOCATION_ROW}>
              <FiMapPin className="w-4 h-4 text-[#D4A574]" />
              <span>{data.hero.locationSummary}</span>
            </div>
          )}

          {/* Hours Status */}
          {hasHours && data.contact.hours?.openNowLabel && (
            <div className={HOURS_ROW}>
              <span className={data.contact.hours.openNowLabel?.includes("Abierto") ? HOURS_OPEN : HOURS_CLOSED}>
                {data.contact.hours.openNowLabel}
              </span>
              {data.contact.hours?.todayHoursLine && (
                <span className="text-[#7A7A7A] text-xs">
                  {data.contact.hours.todayHoursLine}
                </span>
              )}
            </div>
          )}

          {/* Service Quick Facts */}
          {data.quickFacts.length > 0 && (
            <div className={SERVICE_MODES}>
              {data.quickFacts.slice(0, 3).map((fact, index) => (
                <span key={index} className={SERVICE_CHIP}>
                  {fact.label}
                </span>
              ))}
              {data.quickFacts.length > 3 && (
                <span className={SERVICE_CHIP}>
                  +{data.quickFacts.length - 3} más
                </span>
              )}
            </div>
          )}
        </div>

        {/* CTA Section */}
        {hasCtas && (
          <div className={CTA_SECTION}>
            {data.contact.phoneDisplay && (
              <a
                href={data.contact.phoneTelHref || "#"}
                className={`${CTA_BUTTON} ${CTA_PRIMARY}`}
              >
                <FiPhone className="w-4 h-4" />
                Llamar
              </a>
            )}
            {data.contact.messageEnabled && (
              <a
                href="#"
                className={`${CTA_BUTTON} ${CTA_SECONDARY}`}
                onClick={(e) => {
                  e.preventDefault();
                  // Handle message action
                }}
              >
                <FiMessageCircle className="w-4 h-4" />
                Enviar mensaje
              </a>
            )}
            {data.contact.websiteHref && (
              <a
                href={data.contact.websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CTA_BUTTON} ${CTA_SECONDARY}`}
              >
                <FiGlobe className="w-4 h-4" />
                Sitio web
              </a>
            )}
            {data.contact.socialLinks?.whatsapp && (
              <a
                href={data.contact.socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CTA_BUTTON} ${CTA_SECONDARY}`}
              >
                <FaWhatsapp className="w-4 h-4" />
                WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Engagement Section */}
        {showEngagementMetrics && listingId && (
          <div className={ENGAGEMENT_SECTION}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
                Interacción
              </h3>
            </div>
            
            {/* Engagement Actions */}
            <div className="flex items-center gap-3 mb-4">
              <LeonixLikeButton
                listingId={listingId}
                ownerUserId={data.identity.slug}
                variant="small"
                lang={lang}
              />
              <LeonixSaveButton
                listingId={listingId}
                ownerUserId={data.identity.slug}
                variant="small"
                lang={lang}
              />
              <LeonixShareButton
                listingId={listingId}
                ownerUserId={data.identity.slug}
                listingTitle={data.identity.businessName}
                listingUrl={typeof window !== "undefined" ? window.location.href : ""}
                variant="small"
                lang={lang}
              />
            </div>

            {/* Note about real metrics */}
            <div className="text-xs text-[#7A7A7A] italic">
              Las métricas de engagement se mostrarán cuando estén disponibles
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
