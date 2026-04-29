"use client";

import Image from "next/image";
import { FiExternalLink, FiMail, FiMapPin, FiPhone, FiInstagram, FiFacebook, FiYoutube, FiEye, FiHeart, FiBookmark, FiShare2 } from "react-icons/fi";
import { FaTiktok, FaWhatsapp } from "react-icons/fa";
import { LeonixEngagementBar } from "@/app/components/clasificados/analytics/LeonixEngagementBar";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { trackRestaurantesListingView, trackRestaurantesSave, trackRestaurantesLike, trackRestaurantesShare } from "../analytics/restaurantesAnalytics";
import type { RestaurantDetailShellData } from "./restaurantDetailShellTypes";

const PREVIEW_CARD =
  "rounded-3xl border border-[#D4A574]/30 bg-[#FFFAF0] shadow-[0_12px_48px_-20px_rgba(212,165,116,0.15)] overflow-hidden";

const MEDIA_CONTAINER = "relative aspect-[16/10] overflow-hidden bg-[#F5F0E8]";

const INFO_SECTION = "p-6 space-y-4";

const TITLE_SECTION = "space-y-2";

const CUISINE_LINE = "text-sm font-medium text-[#7A7A7A] uppercase tracking-wide";

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

interface RestaurantePreviewCardProps {
  data: RestaurantDetailShellData;
  className?: string;
  lang?: "es" | "en";
  showEngagementMetrics?: boolean;
  listingId?: string;
}

/**
 * Premium Leonix Restaurantes Preview Card
 * Follows LEONIX_PREVIEW_CARD_CONTRACT.md with engagement metrics integration
 */
export function RestaurantePreviewCard({ 
  data, 
  className = "", 
  lang = "es",
  showEngagementMetrics = true,
  listingId
}: RestaurantePreviewCardProps) {
  // Track view when card is rendered
  React.useEffect(() => {
    if (listingId) {
      void trackRestaurantesListingView(listingId, {
        ownerUserId: data.id, // This would be the actual owner ID in production
        eventSource: "card",
        metadata: { cardType: "preview" }
      });
    }
  }, [listingId, data.id]);

  const hasHeroImage = data.heroImageUrl;
  const hasLocation = data.businessName && (data.contact?.addressLine1 || data.contact?.mapsSearchQuery);
  const hasHours = data.hoursPreview;
  const hasServiceModes = data.quickInfo?.some(item => item.key === "service");
  const hasTrustRating = data.trustRating;
  const hasCtas = data.primaryCtas && data.primaryCtas.length > 0;

  // Extract service modes from quick info
  const serviceModes = data.quickInfo?.filter(item => item.key === "service") ?? [];

  return (
    <div className={`${PREVIEW_CARD} ${className}`}>
      {/* Media Block */}
      <div className={MEDIA_CONTAINER}>
        {hasHeroImage ? (
          <Image
            src={data.heroImageUrl!}
            alt={data.heroImageAlt || data.businessName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4A574]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiMapPin className="w-8 h-8 text-[#D4A574]" />
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
          {hasTrustRating && data.trustRating && (
            <div className="mb-3">
              <StarRow rating={data.trustRating.average} />
              <p className="text-xs text-[#7A7A7A] mt-1">
                {data.trustRating.count} reseña{data.trustRating.count !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* Business Name */}
          <h1 className={BUSINESS_NAME}>{data.businessName}</h1>

          {/* Cuisine Type Line */}
          {data.cuisineTypeLine && (
            <p className={CUISINE_LINE}>{data.cuisineTypeLine}</p>
          )}

          {/* Location Row */}
          {hasLocation && (
            <div className={LOCATION_ROW}>
              <FiMapPin className="w-4 h-4 text-[#D4A574]" />
              <span>
                {data.contact?.addressLine1 || 
                 (data.contact?.mapsSearchQuery ? data.contact.mapsSearchQuery.split(",")[0] : "Ubicación no disponible")}
              </span>
            </div>
          )}

          {/* Hours Status */}
          {hasHours && (
            <div className={HOURS_ROW}>
              <span className={data.hoursPreview.status === "open" ? HOURS_OPEN : HOURS_CLOSED}>
                {data.hoursPreview.statusLine}
              </span>
            </div>
          )}

          {/* Service Modes */}
          {hasServiceModes && serviceModes.length > 0 && (
            <div className={SERVICE_MODES}>
              {serviceModes.map((mode, index) => (
                <span key={index} className={SERVICE_CHIP}>
                  {mode.value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        {hasCtas && (
          <div className={CTA_SECTION}>
            {data.primaryCtas.slice(0, 3).map((cta, index) => {
              const isPrimary = index === 0;
              const buttonClass = isPrimary ? CTA_PRIMARY : CTA_SECONDARY;
              
              return (
                <a
                  key={cta.key}
                  href={cta.href}
                  className={`${CTA_BUTTON} ${buttonClass} ${!cta.enabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => {
                    if (cta.enabled && listingId) {
                      // Track CTA clicks
                      const ctaType = cta.key === "call" ? "phone" : 
                                     cta.key === "whatsapp" ? "whatsapp" :
                                     cta.key === "website" ? "website" : "general";
                      void trackRestaurantesCtaClick(listingId, ctaType as any, {
                        eventSource: "card",
                        metadata: { ctaKey: cta.key }
                      });
                    }
                  }}
                >
                  {cta.key === "call" && <FiPhone className="w-4 h-4" />}
                  {cta.key === "whatsapp" && <FaWhatsapp className="w-4 h-4" />}
                  {cta.key === "website" && <FiExternalLink className="w-4 h-4" />}
                  {cta.key === "message" && <FiMail className="w-4 h-4" />}
                  {cta.label}
                </a>
              );
            })}
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
                ownerUserId={data.id}
                variant="small"
                lang={lang}
              />
              <LeonixSaveButton
                listingId={listingId}
                ownerUserId={data.id}
                variant="small"
                lang={lang}
              />
              <LeonixShareButton
                listingId={listingId}
                ownerUserId={data.id}
                listingTitle={data.businessName}
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

// Import React for useEffect
import React from "react";

// Import the missing function
async function trackRestaurantesCtaClick(
  listingId: string,
  ctaType: "phone" | "whatsapp" | "website" | "directions" | "order" | "reserve" | "general",
  options: {
    ownerUserId?: string;
    eventSource?: string;
    metadata?: Record<string, any>;
  }
) {
  // This would use the shared analytics system
  console.log("CTA click tracked:", { listingId, ctaType, options });
}
