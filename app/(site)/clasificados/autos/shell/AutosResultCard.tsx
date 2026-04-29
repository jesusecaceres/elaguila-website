"use client";

import Image from "next/image";
import Link from "next/link";
import { FiMapPin, FiCalendar, FiEye, FiHeart, FiBookmark, FiShare2 } from "react-icons/fi";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { trackClasificadosEvent } from "@/app/lib/clasificadosAnalytics";
import type { AutosPublicListing } from "../data/autosPublicSampleTypes";

const RESULT_CARD =
  "rounded-3xl border border-[#D4A574]/30 bg-[#FFFAF0] shadow-[0_12px_48px_-20px_rgba(212,165,116,0.15)] overflow-hidden transition-all duration-200 hover:border-[#D4A574]/50 hover:shadow-[0_16px_56px_-24px_rgba(212,165,116,0.20)]";

const MEDIA_CONTAINER = "relative aspect-[16/10] overflow-hidden bg-[#F5F0E8]";

const INFO_SECTION = "p-5 space-y-3";

const VEHICLE_TITLE = "text-xl font-bold text-[#1A1A1A] leading-tight sm:text-2xl line-clamp-2";

const PRICE_LINE = "text-2xl font-bold text-[#2A7F3E] leading-tight sm:text-3xl";

const FACTS_ROW = "flex flex-wrap gap-2 mt-2";

const FACT_CHIP = "px-2 py-1 rounded-full bg-[#D4A574]/10 text-[#D4A574] text-xs font-medium border border-[#D4A574]/20";

const LOCATION_ROW = "flex items-center gap-2 text-sm text-[#4A4A4A]";

const SELLER_ROW = "flex items-center justify-between mt-3 pt-3 border-t border-[#E5E5E5]/50";

const SELLER_INFO = "flex items-center gap-2 min-w-0 flex-1";

const SELLER_CHIP = "px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide";

const DEALER_CHIP = "bg-[#D4A574]/20 text-[#D4A574] border border-[#D4A574]/30";

const PRIVATE_CHIP = "bg-[#E5E5E5]/50 text-[#4A4A4A] border border-[#D5D5D5]";

const CTA_BUTTON = "inline-flex items-center justify-center min-h-[44px] min-w-[6rem] rounded-full border border-[#D4A574]/50 bg-[linear-gradient(135deg,rgba(212,165,116,0.12),rgba(193,154,107,0.08))] px-4 text-[11px] font-bold text-[#1A1A1A] transition-all duration-200 hover:border-[#D4A574] hover:bg-[linear-gradient(135deg,rgba(212,165,116,0.18),rgba(193,154,107,0.12))]";

const ENGAGEMENT_ROW = "flex items-center gap-2 mt-3 pt-3 border-t border-[#E5E5E5]/50";

interface AutosResultCardProps {
  listing: AutosPublicListing;
  className?: string;
  lang?: "es" | "en";
  showEngagementMetrics?: boolean;
  compact?: boolean;
}

/**
 * Premium Leonix Autos Result Card
 * Follows LEONIX_PREVIEW_CARD_CONTRACT.md with engagement metrics integration
 * Adapted for vehicle search results with Leonix styling and mobile-first design
 */
export function AutosResultCard({ 
  listing, 
  className = "", 
  lang = "es",
  showEngagementMetrics = true,
  compact = false
}: AutosResultCardProps) {
  // Track click when card is clicked
  const handleCardClick = () => {
    void trackClasificadosEvent({
      listing_id: listing.id,
      category: "autos",
      event_type: "listing_open",
      event_source: "search_results",
      owner_user_id: listing.id, // This would be the actual owner ID in production
      metadata: { 
        sellerType: listing.sellerType,
        vehicleType: listing.condition,
        price: listing.price
      }
    });
  };

  const isDealer = listing.sellerType === "dealer";
  const hasMonthlyEstimate = Boolean(listing.monthlyEstimate);

  // Build vehicle facts for compact display
  const vehicleFacts = [];
  if (listing.condition) {
    const conditionLabel = listing.condition === "new" ? "Nuevo" : 
                          listing.condition === "used" ? "Usado" : 
                          "Certificado";
    vehicleFacts.push(conditionLabel);
  }
  if (listing.bodyStyle) vehicleFacts.push(listing.bodyStyle);
  if (listing.transmission) vehicleFacts.push(listing.transmission);
  if (listing.drivetrain) vehicleFacts.push(listing.drivetrain);
  if (listing.fuelType) vehicleFacts.push(listing.fuelType);

  // Format location
  const locationDisplay = `${listing.city}, ${listing.state}`;

  // Format mileage
  const formatMileage = (miles: number) => {
    if (miles >= 1000000) return `${(miles / 1000000).toFixed(1)}M mi`;
    if (miles >= 1000) return `${(miles / 1000).toFixed(0)}K mi`;
    return `${miles.toLocaleString()} mi`;
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Build href for detail page
  const detailHref = `/clasificados/autos/${listing.id}?lang=${lang}`;

  const sellerName = isDealer ? listing.dealerName : listing.privateSellerLabel;
  const sellerLabel = isDealer ? "Concesionario" : "Vendedor privado";

  return (
    <Link 
      href={detailHref}
      onClick={handleCardClick}
      className={`${RESULT_CARD} ${compact ? "max-w-full" : ""} ${className}`}
    >
      {/* Media Block */}
      <div className={MEDIA_CONTAINER}>
        <Image
          src={listing.primaryImageUrl}
          alt={listing.vehicleTitle}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 26vw"
        />
        {listing.featured && (
          <span className="absolute left-2.5 top-2.5 rounded-full border border-[#D4A574]/50 bg-[#FFFAF0] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#D4A574] shadow-sm">
            Destacado
          </span>
        )}
      </div>

      {/* Info Section */}
      <div className={INFO_SECTION}>
        {/* Vehicle Title */}
        <h3 className={VEHICLE_TITLE}>
          {listing.vehicleTitle}
        </h3>

        {/* Price */}
        <div className={PRICE_LINE}>
          {formatPrice(listing.price)}
        </div>

        {/* Monthly Estimate */}
        {hasMonthlyEstimate && (
          <p className="text-xs font-semibold text-[#4A4A4A]">
            {listing.monthlyEstimate}
          </p>
        )}

        {/* Vehicle Facts */}
        {vehicleFacts.length > 0 && (
          <div className={FACTS_ROW}>
            {vehicleFacts.slice(0, 3).map((fact, index) => (
              <span key={index} className={FACT_CHIP}>
                {fact}
              </span>
            ))}
            {vehicleFacts.length > 3 && (
              <span className={FACT_CHIP}>
                +{vehicleFacts.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Location and Mileage */}
        <div className={LOCATION_ROW}>
          <FiMapPin className="w-4 h-4 text-[#D4A574] flex-shrink-0" />
          <span className="truncate">{locationDisplay}</span>
          <span className="text-[#7A7A7A]">•</span>
          <span>{formatMileage(listing.mileage)}</span>
        </div>

        {/* Seller Information */}
        <div className={SELLER_ROW}>
          <div className={SELLER_INFO}>
            <span className="min-w-0 truncate text-sm font-semibold text-[#1A1A1A]">
              {sellerName}
            </span>
            <span className={`${SELLER_CHIP} ${isDealer ? DEALER_CHIP : PRIVATE_CHIP}`}>
              {sellerLabel}
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <span className={CTA_BUTTON}>
            Ver detalles
          </span>
        </div>

        {/* Engagement Metrics */}
        {showEngagementMetrics && (
          <div className={ENGAGEMENT_ROW}>
            <div className="flex items-center gap-3 flex-1">
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
                listingTitle={listing.vehicleTitle}
                listingUrl={typeof window !== "undefined" ? `${window.location.origin}${detailHref}` : ""}
                variant="small"
                lang={lang}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
