"use client";

import Image from "next/image";
import { FiExternalLink, FiMail, FiMapPin, FiPhone, FiInstagram, FiFacebook, FiYoutube, FiClock, FiStar } from "react-icons/fi";
import { FaTiktok, FaWhatsapp } from "react-icons/fa";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import type { RestaurantDetailShellData } from "./restaurantDetailShellTypes";
import { RestauranteGroupedFeaturesSection } from "./RestauranteGroupedFeaturesSection";
import { RestauranteLockedGallerySection } from "./RestauranteLockedGallerySection";

// Leonix premium visual tokens
const LEONIX_PAGE_BG = "#F4F1EB";
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

const SECTION_CARD = "rounded-3xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_8px_32px_-8px_rgba(212,165,116,0.15)] overflow-hidden";
const SECTION_PADDING = "p-6 sm:p-8";
const SECTION_TITLE = "text-2xl font-bold text-[#1F1A17] mb-6 tracking-tight";
const SECTION_DESCRIPTION = "text-base text-[#5A5148] leading-relaxed";
const SUBSECTION_TITLE = "text-lg font-semibold text-[#1F1A17] mb-4";
const DETAIL_LABEL = "text-sm font-semibold text-[#5A5148] mb-2";
const DETAIL_VALUE = "text-base text-[#1F1A17]";

const CTA_BUTTON = "inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-base transition-all duration-200 border min-h-[44px]";
const CTA_PRIMARY = "bg-[#2C1810] text-white border-[#2C1810] hover:bg-[#1A1412] shadow-md";
const CTA_SECONDARY = "bg-white text-[#1F1A17] border-[#D8C2A0] hover:bg-[#FFFAF3] hover:border-[#BEA98E] shadow-sm";

const SERVICE_CHIP = "px-3 py-1.5 rounded-full bg-[#F6EBDD] text-[#1F1A17] text-xs font-semibold border border-[#D8C2A0] inline-flex items-center gap-1";

interface RestauranteAdStoryPreviewProps {
  data: RestaurantDetailShellData;
}

export function RestauranteAdStoryPreview({ data }: RestauranteAdStoryPreviewProps) {
  // Helper functions
  const hasHeroImage = data.heroImageUrl;
  const hasContactInfo = data.contact;
  const hasMenuHighlights = data.menuHighlights && data.menuHighlights.length > 0;
  const hasGallery = data.venueGallery || data.gallery;
  const hasHours = data.hoursDetail;
  const hasTrustInfo = data.trustRating || data.trustLight;
  const hasStackSections = data.stackSections && data.stackSections.length > 0;

  // CTA data extraction
  const primaryCtas = data.primaryCtas || [];
  const contactCtas = primaryCtas.filter(cta => 
    ['call', 'whatsapp', 'message', 'website'].includes(cta.key)
  );
  const actionCtas = primaryCtas.filter(cta => 
    ['menu', 'menuAsset', 'reserve', 'order'].includes(cta.key)
  );

  return (
    <div className="space-y-8" style={{ background: LEONIX_PAGE_BG }}>
      
      {/* A. Cover / Hero Zone */}
      <section className={SECTION_CARD}>
        {hasHeroImage ? (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={data.heroImageUrl!}
              alt={data.heroImageAlt || data.businessName}
              fill
              className="object-cover"
              priority
            />
            {/* Premium dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
            
            {/* Hero content - centered */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8 text-white text-center">
              <div className="max-w-4xl mx-auto space-y-4">
                {/* Business logo */}
                {data.businessLogo && (
                  <div className="mb-6 flex justify-center">
                    <Image
                      src={data.businessLogo}
                      alt={`${data.businessName} logo`}
                      width={120}
                      height={120}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/20 p-4 object-contain shadow-xl"
                    />
                  </div>
                )}
                
                {/* Business name */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-2xl">
                  {data.businessName}
                </h1>
                
                {/* Cuisine and type */}
                {data.cuisineTypeLine && (
                  <div className="flex flex-wrap justify-center gap-2 text-lg sm:text-xl font-medium drop-shadow">
                    {data.cuisineTypeLine.split(' · ').map((cuisine, index) => (
                      <span key={index} className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                        {cuisine.trim()}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Status, hours, neighborhood row */}
                <div className="flex flex-wrap justify-center items-center gap-3 text-sm sm:text-base">
                  {/* Hours status */}
                  <span className={`px-4 py-2 rounded-full font-semibold backdrop-blur-sm ${
                    data.hoursPreview.status === 'open' 
                      ? 'bg-green-500/30 text-white border border-green-400/50' 
                      : 'bg-red-500/30 text-white border border-red-400/50'
                  }`}>
                    {data.hoursPreview.status === 'open' ? '🟢 Abierto ahora' : '🔴 Cerrado'}
                  </span>
                  
                  {/* Neighborhood/Zone */}
                  {(() => {
                    // Get neighborhood from quickInfo (priority: neighborhood -> nothing)
                    const neighborhoodItem = data.quickInfo?.find(item => item.key === 'neighborhood');
                    const locationDisplay = neighborhoodItem?.value || '';
                    
                    if (!locationDisplay) return null;
                    
                    return (
                      <span className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-1">
                        <FiMapPin className="w-4 h-4" />
                        {locationDisplay}
                      </span>
                    );
                  })()}
                  
                  {/* Rating */}
                  {data.trustRating && (
                    <span className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm flex items-center gap-1">
                      <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{data.trustRating.average.toFixed(1)}</span>
                      <span className="text-white/80">({data.trustRating.count})</span>
                    </span>
                  )}
                </div>
                
                {/* Full address */}
                {data.contact?.addressLine1 && (
                  <div className="text-base sm:text-lg drop-shadow">
                    <span className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm inline-block">
                      {data.contact.addressLine1}
                      {data.contact?.addressLine2 && `, ${data.contact.addressLine2}`}
                    </span>
                  </div>
                )}
                
                {/* Hero CTA row */}
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  {primaryCtas
                    .filter(cta => ['call', 'website', 'directions', 'whatsapp', 'order', 'reserve'].includes(cta.key))
                    .slice(0, 6)
                    .map((cta, index) => {
                      const isPrimary = index === 0;
                      const buttonClass = isPrimary 
                        ? "bg-white text-[#1F1A17] border-white hover:bg-gray-100 shadow-lg" 
                        : "bg-white/20 text-white border-white/50 hover:bg-white/30 backdrop-blur-sm";
                      
                      return (
                        <a
                          key={cta.key}
                          href={cta.href}
                          className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 border min-h-[44px] ${buttonClass}`}
                          {...(cta.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {cta.key === "call" && <FiPhone className="w-4 h-4" />}
                          {cta.key === "website" && <FiExternalLink className="w-4 h-4" />}
                          {cta.key === "directions" && <FiMapPin className="w-4 h-4" />}
                          {cta.key === "whatsapp" && <FaWhatsapp className="w-4 h-4" />}
                          {cta.key === "order" && <span>🛒</span>}
                          {cta.key === "reserve" && <span>📅</span>}
                          {cta.label}
                        </a>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Fallback hero without image
          <div className={`${SECTION_PADDING} text-center`}>
            <div className="max-w-4xl mx-auto space-y-6">
                            
              {/* Business name */}
              <h1 className="text-4xl sm:text-5xl font-bold text-[#1F1A17] leading-tight">
                {data.businessName}
              </h1>
              
              {/* Cuisine and type */}
              {data.cuisineTypeLine && (
                <div className="flex flex-wrap justify-center gap-2 text-lg sm:text-xl font-medium">
                  {data.cuisineTypeLine.split(' · ').map((cuisine, index) => (
                    <span key={index} className="px-3 py-1 bg-[#F6EBDD] rounded-full text-[#1F1A17]">
                      {cuisine.trim()}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Status, hours, neighborhood row */}
              <div className="flex flex-wrap justify-center items-center gap-3 text-sm sm:text-base">
                {/* Hours status */}
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  data.hoursPreview.status === 'open' 
                    ? 'bg-[#1A4D2E] text-white' 
                    : 'bg-[#BEA98E] text-[#1F1A17]'
                }`}>
                  {data.hoursPreview.status === 'open' ? '🟢 Abierto ahora' : '🔴 Cerrado'}
                </span>
                
                {/* Neighborhood */}
                {(() => {
                  // Get neighborhood from quickInfo (priority: neighborhood -> nothing)
                  const neighborhoodItem = data.quickInfo?.find(item => item.key === 'neighborhood');
                  const locationDisplay = neighborhoodItem?.value || '';
                  
                  if (!locationDisplay) return null;
                  
                  return (
                    <span className="px-4 py-2 bg-[#F6EBDD] rounded-full text-[#1F1A17] flex items-center gap-1">
                      <FiMapPin className="w-4 h-4" />
                      {locationDisplay}
                    </span>
                  );
                })()}
                
                {/* Rating */}
                {data.trustRating && (
                  <span className="px-4 py-2 bg-[#F6EBDD] rounded-full text-[#1F1A17] flex items-center gap-1">
                    <FiStar className="w-4 h-4 text-yellow-600 fill-current" />
                    <span>{data.trustRating.average.toFixed(1)}</span>
                    <span className="text-[#5A5148]">({data.trustRating.count})</span>
                  </span>
                )}
              </div>
              
              {/* Full address */}
              {data.contact?.addressLine1 && (
                <div className="text-base sm:text-lg">
                  <span className="px-4 py-2 bg-[#F6EBDD] rounded-lg text-[#1F1A17] inline-block">
                    {data.contact.addressLine1}
                    {data.contact?.addressLine2 && `, ${data.contact.addressLine2}`}
                  </span>
                </div>
              )}
              
              {/* Hero CTA row */}
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                {primaryCtas
                  .filter(cta => ['call', 'website', 'directions', 'whatsapp', 'order', 'reserve'].includes(cta.key))
                  .slice(0, 6)
                  .map((cta, index) => {
                    const isPrimary = index === 0;
                    const buttonClass = isPrimary 
                      ? "bg-[#2C1810] text-white border-[#2C1810] hover:bg-[#1A1412] shadow-md" 
                      : "bg-white text-[#1F1A17] border-[#D8C2A0] hover:bg-[#FFFAF3] hover:border-[#BEA98E] shadow-sm";
                    
                    return (
                      <a
                        key={cta.key}
                        href={cta.href}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 border min-h-[44px] ${buttonClass}`}
                        {...(cta.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {cta.key === "call" && <FiPhone className="w-4 h-4" />}
                        {cta.key === "website" && <FiExternalLink className="w-4 h-4" />}
                        {cta.key === "directions" && <FiMapPin className="w-4 h-4" />}
                        {cta.key === "whatsapp" && <FaWhatsapp className="w-4 h-4" />}
                        {cta.key === "order" && <span>🛒</span>}
                        {cta.key === "reserve" && <span>📅</span>}
                        {cta.label}
                      </a>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* B. Story / About Zone */}
      {(data.aboutBody || data.summaryShort) && (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            <h2 className={SECTION_TITLE}>Sobre el Negocio</h2>
            <div className="prose prose-lg max-w-none">
              {data.aboutBody ? (
                <div className="text-base text-[#1F1A17] leading-relaxed whitespace-pre-wrap">
                  {data.aboutBody}
                </div>
              ) : (
                <p className="text-base text-[#1F1A17] leading-relaxed">
                  {data.summaryShort}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* C. Hook / Quick Understanding Zone */}
      {data.groupedFeatures && (
        <RestauranteGroupedFeaturesSection features={data.groupedFeatures} />
      )}

      
      {/* D. Proof / Featured Menu Zone */}
      {hasMenuHighlights && (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            <h2 className={SECTION_TITLE}>Platos Destacados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {data.menuHighlights!.map((dish, index) => (
                <div key={index} className="bg-white rounded-2xl border border-[#D8C2A0] p-4 shadow-sm">
                  {dish.imageUrl && (
                    <div className="relative aspect-[16/10] mb-4 rounded-xl overflow-hidden">
                      <Image
                        src={dish.imageUrl}
                        alt={dish.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-[#1F1A17]">{dish.name}</h3>
                    {dish.supportingLine && (
                      <p className="text-sm text-[#5A5148]">{dish.supportingLine}</p>
                    )}
                    {dish.badge && (
                      <span className="inline-block px-2 py-1 bg-[#F6EBDD] text-[#1F1A17] text-xs font-semibold rounded-full">
                        {dish.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* E. Proof / Media Gallery Zone */}
      <RestauranteLockedGallerySection galleryBundle={data.venueGallery} />

      
      
      {/* H. Details / Hours Zone */}
      {hasHours && (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            <h2 className={SECTION_TITLE}>Horarios</h2>
            <div className="space-y-4">
              {/* Current status */}
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  data.hoursPreview.status === 'open' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {data.hoursPreview.status === 'open' ? '🟢 Abierto ahora' : '🔴 Cerrado'}
                </span>
                <span className="text-[#5A5148]">{data.hoursPreview.statusLine}</span>
              </div>
              
              {/* Hours table */}
              {data.hoursDetail && (
                <div className="bg-white rounded-2xl border border-[#D8C2A0] p-6">
                  <dl className="space-y-3">
                    {data.hoursDetail.rows.map((row, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-[#D8C2A0]/30 last:border-0">
                        <dt className="font-semibold text-[#1F1A17]">{row.dayLabel}</dt>
                        <dd className="text-[#5A5148]">{row.line}</dd>
                      </div>
                    ))}
                  </dl>
                  
                  {/* Special notes */}
                  {data.hoursDetail.specialNote && (
                    <div className="mt-4 p-4 bg-[#F6EBDD] rounded-xl">
                      <p className="text-sm text-[#1F1A17]">
                        <strong>Nota especial:</strong> {data.hoursDetail.specialNote}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* I. Conversion / Contact and Location Card */}
      {hasContactInfo && (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            <h2 className={SECTION_TITLE}>Contacto y Ubicación</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div>
                <h3 className={SUBSECTION_TITLE}>Información de Contacto</h3>
                <div className="space-y-4">
                  {data.contact?.phoneDisplay && (
                    <div className="flex items-center gap-3">
                      <FiPhone className="w-5 h-5 text-[#BEA98E]" />
                      <a href={`tel:${data.contact.phoneTelHref}`} className="text-[#1F1A17] hover:text-[#BEA98E]">
                        {data.contact.phoneDisplay}
                      </a>
                    </div>
                  )}
                  
                  {data.contact?.email && (
                    <div className="flex items-center gap-3">
                      <FiMail className="w-5 h-5 text-[#BEA98E]" />
                      <a href={`mailto:${data.contact.email}`} className="text-[#1F1A17] hover:text-[#BEA98E]">
                        {data.contact.email}
                      </a>
                    </div>
                  )}
                  
                  {data.contact?.websiteDisplay && data.contact?.websiteHref && (
                    <div className="flex items-center gap-3">
                      <FiExternalLink className="w-5 h-5 text-[#BEA98E]" />
                      <a 
                        href={data.contact.websiteHref} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#1F1A17] hover:text-[#BEA98E]"
                      >
                        {data.contact.websiteDisplay}
                      </a>
                    </div>
                  )}
                  
                  {data.contact?.whatsappHref && (
                    <div className="flex items-center gap-3">
                      <FaWhatsapp className="w-5 h-5 text-[#BEA98E]" />
                      <a 
                        href={data.contact.whatsappHref} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#1F1A17] hover:text-[#BEA98E]"
                      >
                        WhatsApp
                      </a>
                    </div>
                  )}
                  
                  {/* Menu links */}
                  {(data.contact?.menuFileHref || data.fullMenuCta) && (
                    <div className="pt-4 border-t border-[#D8C2A0]/30">
                      <h4 className="font-semibold text-[#1F1A17] mb-3">Menú</h4>
                      {data.contact?.menuFileHref && (
                        <a 
                          href={data.contact?.menuFileHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#F6EBDD] text-[#1F1A17] rounded-full text-sm font-semibold hover:bg-[#BEA98E] transition-colors"
                        >
                          📋 Ver menú
                        </a>
                      )}
                      {data.fullMenuCta && (
                        <a 
                          href={data.fullMenuCta.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#F6EBDD] text-[#1F1A17] rounded-full text-sm font-semibold hover:bg-[#BEA98E] transition-colors ml-2"
                        >
                          📋 {data.fullMenuCta.label}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Location Information */}
              <div>
                <h3 className={SUBSECTION_TITLE}>Ubicación</h3>
                <div className="space-y-4">
                  {data.contact?.addressLine1 && (
                    <div className="flex items-start gap-3">
                      <FiMapPin className="w-5 h-5 text-[#BEA98E] mt-1" />
                      <div>
                        <p className="text-[#1F1A17]">{data.contact.addressLine1}</p>
                        {data.contact?.addressLine2 && (
                          <p className="text-[#5A5148]">{data.contact.addressLine2}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Social Links */}
                  <div className="pt-4 border-t border-[#D8C2A0]/30">
                    <h4 className="font-semibold text-[#1F1A17] mb-3">Redes Sociales</h4>
                    <div className="flex flex-wrap gap-3">
                      {data.contact?.instagramHref && (
                        <a 
                          href={data.contact.instagramHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-[#F6EBDD] text-[#1F1A17] rounded-full text-sm font-semibold hover:bg-[#BEA98E] transition-colors"
                        >
                          <FiInstagram className="w-4 h-4" />
                          Instagram
                        </a>
                      )}
                      
                      {data.contact?.facebookHref && (
                        <a 
                          href={data.contact.facebookHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-[#F6EBDD] text-[#1F1A17] rounded-full text-sm font-semibold hover:bg-[#BEA98E] transition-colors"
                        >
                          <FiFacebook className="w-4 h-4" />
                          Facebook
                        </a>
                      )}
                      
                      {data.contact?.tiktokHref && (
                        <a 
                          href={data.contact.tiktokHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-[#F6EBDD] text-[#1F1A17] rounded-full text-sm font-semibold hover:bg-[#BEA98E] transition-colors"
                        >
                          <FaTiktok className="w-4 h-4" />
                          TikTok
                        </a>
                      )}
                      
                      {data.contact?.youtubeHref && (
                        <a 
                          href={data.contact.youtubeHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-[#F6EBDD] text-[#1F1A17] rounded-full text-sm font-semibold hover:bg-[#BEA98E] transition-colors"
                        >
                          <FiYoutube className="w-4 h-4" />
                          YouTube
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* K. Bottom Contact Canvas - Final Conversion */}
      {primaryCtas.length > 0 && (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            <div className="text-center mb-8">
              <h2 className={SECTION_TITLE}>Contacto Rápido</h2>
              <p className={SECTION_DESCRIPTION}>
                Ponte en contacto directamente con el restaurante para reservar, hacer pedidos o resolver tus dudas.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              {primaryCtas
                .filter(cta => ['call', 'website', 'directions', 'whatsapp', 'order', 'reserve', 'message'].includes(cta.key))
                .slice(0, 7)
                .map((cta, index) => {
                  const isPrimary = index === 0;
                  const buttonClass = isPrimary ? CTA_PRIMARY : CTA_SECONDARY;
                  
                  return (
                    <a
                      key={cta.key}
                      href={cta.href}
                      className={`${CTA_BUTTON} ${buttonClass} ${!cta.enabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      {...(cta.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {cta.key === "call" && <FiPhone className="w-4 h-4" />}
                      {cta.key === "website" && <FiExternalLink className="w-4 h-4" />}
                      {cta.key === "directions" && <FiMapPin className="w-4 h-4" />}
                      {cta.key === "whatsapp" && <FaWhatsapp className="w-4 h-4" />}
                      {cta.key === "order" && <span>🛒</span>}
                      {cta.key === "reserve" && <span>📅</span>}
                      {cta.key === "message" && <FiMail className="w-4 h-4" />}
                      {cta.label}
                    </a>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* J. Trust / External Proof Zone */}
      {hasTrustInfo && (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            <h2 className={SECTION_TITLE}>Prueba Externa</h2>
            
            {/* Rating display */}
            {data.trustRating && (
              <div className="bg-white rounded-2xl border border-[#D8C2A0] p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <FiStar 
                        key={i} 
                        className={`w-5 h-5 ${
                          i < Math.floor(data.trustRating!.average) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#1F1A17]">
                      {data.trustRating.average.toFixed(1)} de 5
                    </p>
                    <p className="text-sm text-[#5A5148]">
                      {data.trustRating.count} reseñas
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Trust light information */}
            {data.trustLight && (
              <div className="bg-white rounded-2xl border border-[#D8C2A0] p-6">
                <p className="text-base text-[#1F1A17] leading-relaxed mb-4">
                  {data.trustLight.summaryLine}
                </p>
                
                {data.trustLight.externalTrustHref && data.trustLight.externalTrustLabel && (
                  <a
                    href={data.trustLight.externalTrustHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#BEA98E] text-[#1F1A17] rounded-full font-semibold hover:bg-[#D8C2A0] transition-colors"
                  >
                    {data.trustLight.externalTrustLabel}
                    <FiExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* K. Conditional Stack Zones */}
      {hasStackSections && (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            <h2 className={SECTION_TITLE}>Información Adicional</h2>
            <div className="space-y-6">
              {data.stackSections!.map((stack, index) => (
                <div key={stack.id} className="bg-white rounded-2xl border border-[#D8C2A0] p-6">
                  <h3 className={SUBSECTION_TITLE}>{stack.title}</h3>
                  <dl className="space-y-3 mt-4">
                    {stack.rows.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex justify-between items-center py-2 border-b border-[#D8C2A0]/30 last:border-0">
                        <dt className="font-semibold text-[#1F1A17]">{row.label}</dt>
                        <dd className="text-[#5A5148]">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Additional Action CTAs */}
      {actionCtas.length > 0 && (
        <section className={SECTION_CARD}>
          <div className={SECTION_PADDING}>
            <h2 className={SECTION_TITLE}>Acciones</h2>
            <div className="flex flex-wrap gap-3">
              {actionCtas.map((cta, index) => (
                <a
                  key={cta.key}
                  href={cta.href}
                  className={`${CTA_BUTTON} ${CTA_SECONDARY} ${!cta.enabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {cta.key === "menu" && <span>📋</span>}
                  {cta.key === "menuAsset" && <span>📋</span>}
                  {cta.key === "reserve" && <span>📅</span>}
                  {cta.key === "order" && <span>🛒</span>}
                  {cta.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
