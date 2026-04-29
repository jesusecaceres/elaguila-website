"use client";

import Image from "next/image";
import Link from "next/link";
import { FiMapPin, FiPhone, FiHeart, FiBookmark, FiShare2, FiClock, FiStar } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";

const RESULT_CARD =
  "rounded-3xl border border-[#D4A574]/30 bg-[#FFFAF0] shadow-[0_12px_48px_-20px_rgba(212,165,116,0.15)] overflow-hidden";

const MEDIA_CONTAINER = "relative aspect-[16/10] overflow-hidden bg-[#F5F0E8]";

const INFO_SECTION = "p-6 space-y-4";

const TITLE_SECTION = "space-y-2";

const CUISINE_LINE = "text-sm font-medium text-[#7A7A7A] uppercase tracking-wide";

const RESTAURANT_NAME = "text-xl font-bold text-[#1A1A1A] leading-tight sm:text-2xl";

const LOCATION_ROW = "flex items-center gap-2 text-sm text-[#4A4A4A]";

const HOURS_ROW = "flex items-center gap-2 text-sm font-medium";

const HOURS_OPEN = "text-[#2A7F3E] bg-[#E8F5E8] px-2 py-1 rounded-full";

const HOURS_CLOSED = "text-[#D97706] bg-[#FEF3C7] px-2 py-1 rounded-full";

const SERVICE_MODES = "flex flex-wrap gap-2 mt-3";

const SERVICE_CHIP = "px-3 py-1 rounded-full bg-[#D4A574]/10 text-[#D4A574] text-xs font-medium border border-[#D4A574]/20";

const RATING_ROW = "flex items-center gap-2 mt-2";

const CTA_SECTION = "flex flex-wrap gap-3 mt-6";

const CTA_BUTTON = "inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 border";

const CTA_PRIMARY = "bg-[#D4A574] text-white border-[#D4A574] hover:bg-[#C19A6B]";

const CTA_SECONDARY = "bg-white text-[#1A1A1A] border-[#E5E5E5] hover:bg-[#FFFAF0] hover:border-[#D4A574]";

const ENGAGEMENT_SECTION = "mt-6 pt-6 border-t border-[#E5E5E5]/50";

interface RestauranteResultCardProps {
  listing: RestaurantesPublicBlueprintRow;
  className?: string;
  lang?: "es" | "en";
  showEngagementMetrics?: boolean;
}

/**
 * Premium Leonix Restaurante Result Card
 * Follows LEONIX_PREVIEW_CARD_CONTRACT.md with engagement metrics integration
 * Matches the approved RestaurantePreviewCard design system
 */
export function RestauranteResultCard({ 
  listing, 
  className = "", 
  lang = "es",
  showEngagementMetrics = true
}: RestauranteResultCardProps) {
  const hasImage = listing.imageSrc;
  const hasLocation = listing.city || listing.neighborhood;
  const hasServiceModes = listing.serviceModes && listing.serviceModes.length > 0;
  const hasRating = listing.rating;
  
  // Build location line from available fields
  const locationLine = listing.neighborhood 
    ? `${listing.city}${listing.neighborhood ? `, ${listing.neighborhood}` : ""}`
    : listing.city;

  // Build detail href
  const detailHref = listing.slug 
    ? `/clasificados/restaurantes/${encodeURIComponent(listing.slug)}`
    : `/clasificados/restaurantes/results?q=${encodeURIComponent(listing.name)}`;

  return (
    <div className={`${RESULT_CARD} ${className}`}>
      {/* Media Block */}
      <div className={MEDIA_CONTAINER}>
        {hasImage ? (
          <Image
            src={listing.imageSrc}
            alt={listing.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4A574]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiStar className="w-8 h-8 text-[#D4A574]" />
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
          {/* Restaurant Name */}
          <Link href={detailHref} className="block">
            <h3 className={RESTAURANT_NAME + " hover:text-[#D4A574] transition-colors"}>
              {listing.name}
            </h3>
          </Link>

          {/* Cuisine Type */}
          {listing.cuisineLine && (
            <p className={CUISINE_LINE}>{listing.cuisineLine}</p>
          )}

          {/* Location */}
          {hasLocation && (
            <div className={LOCATION_ROW}>
              <FiMapPin className="w-4 h-4 text-[#D4A574]" />
              <span>{locationLine}</span>
            </div>
          )}

          {/* Open Status Demo */}
          {listing.openNowDemo && (
            <div className={HOURS_ROW}>
              <FiClock className="w-4 h-4 text-[#D4A574]" />
              <span className={HOURS_OPEN}>Abierto ahora</span>
            </div>
          )}

          {/* Service Modes */}
          {hasServiceModes && (
            <div className={SERVICE_MODES}>
              {listing.serviceModes.map((mode, index) => (
                <span key={index} className={SERVICE_CHIP}>
                  {mode}
                </span>
              ))}
            </div>
          )}

          {/* Rating */}
          {hasRating && (
            <div className={RATING_ROW}>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <FiStar 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(listing.rating) ? "text-[#D4A574] fill-current" : "text-[#D4A574]/30"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-[#4A4A4A]">{listing.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className={CTA_SECTION}>
          <Link href={detailHref} className={`${CTA_BUTTON} ${CTA_PRIMARY}`}>
            Ver restaurante
          </Link>
          
          {/* Contact options will be available when contact fields are added to the data model */}
        </div>

        {/* Engagement Section */}
        {showEngagementMetrics && (
          <div className={ENGAGEMENT_SECTION}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wide">
                Interacción
              </h4>
            </div>
            
            {/* Engagement Actions */}
            <div className="flex items-center gap-3 mb-4">
              <LeonixLikeButton
                listingId={listing.id}
                ownerUserId={listing.id}
                variant="small"
                lang={lang}
              />
              <LeonixSaveButton
                listingId={listing.id}
                ownerUserId={listing.id}
                variant="small"
                lang={lang}
              />
              <LeonixShareButton
                listingId={listing.id}
                ownerUserId={listing.id}
                listingTitle={listing.name}
                listingUrl={typeof window !== "undefined" ? window.location.origin + detailHref : ""}
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
