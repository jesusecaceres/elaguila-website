"use client";

import { useState } from "react";
import { FiShare2, FiLink, FiMessageCircle, FiMail } from "react-icons/fi";
import { trackListingShare } from "@/app/lib/clasificadosAnalytics";

type Props = {
  listingId: string | null | undefined;
  listingUrl?: string;
  listingTitle?: string;
  variant?: "default" | "small" | "large";
  className?: string;
  lang?: "es" | "en";
  category?: string;
  ownerUserId?: string | null;
  /** When false, share UI works but analytics are not recorded. */
  persistEngagement?: boolean;
  /**
   * When true, viewports ≤767px use `navigator.share` (then clipboard fallback) instead of a dropdown.
   * Avoids menus clipped inside overflow-hidden cards (e.g. restaurant results on mobile).
   */
  preferNativeShareOnNarrowViewports?: boolean;
};

const LABELS = {
  es: {
    share: "Compartir",
    sharing: "Compartiendo...",
    copyLink: "Copiar enlace",
    copied: "¡Copiado!",
    shareVia: "Compartir vía"
  },
  en: {
    share: "Share",
    sharing: "Sharing...",
    copyLink: "Copy link",
    copied: "Copied!",
    shareVia: "Share via"
  }
} as const;

/**
 * Interactive share button following Leonix design system
 * Handles share actions with analytics tracking
 */
export function LeonixShareButton({ 
  listingId,
  listingUrl,
  listingTitle,
  variant = "default",
  className = "",
  lang = "es",
  category,
  ownerUserId,
  preferNativeShareOnNarrowViewports = false,
  persistEngagement,
}: Props) {
  const effectiveId = (listingId ?? "").trim();
  const allowTrack = persistEngagement !== false && Boolean(effectiveId);

  const trackShare = async (shareMethod: string, extraMeta?: Record<string, unknown>) => {
    if (!allowTrack || !effectiveId) return;
    await trackListingShare(effectiveId, {
      category,
      ownerUserId: ownerUserId ?? undefined,
      eventSource: "cta_card",
      shareMethod,
      metadata: { listingTitle: listingTitle || "", ...extraMeta },
    });
  };
  const [isSharing, setIsSharing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  /** Shown only after narrow-viewport clipboard fallback (not dropdown copy). */
  const [mobileInlineCopyAck, setMobileInlineCopyAck] = useState(false);
  const labels = LABELS[lang];
  
  const sizeClasses = {
    small: "px-3 py-1.5 text-sm",
    default: "px-4 py-2 text-sm",
    large: "px-5 py-3 text-base"
  };
  
  const iconSizes = {
    small: "h-4 w-4",
    default: "h-4 w-4",
    large: "h-5 w-5"
  };
  
  const handleCopyLink = async () => {
    if (!listingUrl) return;
    
    try {
      await navigator.clipboard.writeText(listingUrl);
      setCopySuccess(true);
      
      await trackShare("copy_link");
      
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.warn("Copy to clipboard failed:", error);
    }
  };
  
  const handleShareButtonClick = async () => {
    const narrow =
      preferNativeShareOnNarrowViewports &&
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;

    if (narrow) {
      const url = (listingUrl ?? "").trim();
      const title = (listingTitle ?? "").trim() || (typeof document !== "undefined" ? document.title : "");
      if (!url) {
        setShowDropdown((v) => !v);
        return;
      }
      const text =
        lang === "en"
          ? `Check out this restaurant on Leonix Media: ${title}`.trim()
          : `Mira este restaurante en Leonix Media: ${title}`.trim();

      setIsSharing(true);
      try {
        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
          try {
            await navigator.share({ title, text, url });
            await trackShare("web_share", { listingTitle: title });
            return;
          } catch (err: unknown) {
            const n = err && typeof err === "object" && "name" in err ? (err as { name: string }).name : "";
            if (n === "AbortError") return;
          }
        }
        await navigator.clipboard.writeText(url);
        setMobileInlineCopyAck(true);
        await trackShare("copy_link", { listingTitle: title });
        window.setTimeout(() => setMobileInlineCopyAck(false), 2200);
      } catch {
        setShowDropdown(true);
      } finally {
        setIsSharing(false);
      }
      return;
    }

    setShowDropdown((v) => !v);
  };

  const handleShareMethod = async (method: string) => {
    setIsSharing(true);
    
    try {
      await trackShare(method);
      
      // Handle different share methods
      const safeUrl = listingUrl || "";
      const safeTitle = listingTitle || "";
      
      switch (method) {
        case "whatsapp":
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${safeTitle} ${safeUrl}`)}`;
          window.open(whatsappUrl, "_blank");
          break;
        case "facebook":
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(safeUrl)}`;
          window.open(facebookUrl, "_blank");
          break;
        case "twitter":
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(safeTitle)}&url=${encodeURIComponent(safeUrl)}`;
          window.open(twitterUrl, "_blank");
          break;
        case "email":
          const emailUrl = `mailto:?subject=${encodeURIComponent(safeTitle)}&body=${encodeURIComponent(safeUrl)}`;
          window.location.href = emailUrl;
          break;
      }
      
      setShowDropdown(false);
    } catch (error) {
      console.warn("Share failed:", error);
    } finally {
      setIsSharing(false);
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => void handleShareButtonClick()}
        disabled={isSharing}
        className={`
          inline-flex items-center gap-2 rounded-full font-medium
          bg-white text-[#1A1A1A] border border-[#D4A574]
          hover:bg-[#FFFAF0] transition-all duration-200
          ${sizeClasses[variant]}
        `}
        aria-label={labels.share}
      >
        <FiShare2 className={iconSizes[variant]} />
        <span>{isSharing ? labels.sharing : labels.share}</span>
      </button>

      {preferNativeShareOnNarrowViewports && mobileInlineCopyAck ? (
        <p className="mt-1 text-xs font-medium text-emerald-800" role="status">
          {labels.copied}
        </p>
      ) : null}
      
      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-white border border-[#E5E5E5] shadow-lg z-50">
          <div className="p-2">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#FFFAF0] transition-colors"
            >
              <FiLink className="h-4 w-4 text-[#D4A574]" />
              <span className="text-sm text-[#1A1A1A]">
                {copySuccess ? labels.copied : labels.copyLink}
              </span>
            </button>
            
            {/* Share Methods */}
            <div className="pt-2 mt-2 border-t border-[#E5E5E5]">
              <p className="px-3 py-1 text-xs font-medium text-[#7A7A7A]">
                {labels.shareVia}
              </p>
              
              <button
                onClick={() => handleShareMethod("whatsapp")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#FFFAF0] transition-colors"
              >
                <FiMessageCircle className="h-4 w-4 text-[#25D366]" />
                <span className="text-sm text-[#1A1A1A]">WhatsApp</span>
              </button>
              
              <button
                onClick={() => handleShareMethod("facebook")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#FFFAF0] transition-colors"
              >
                <FiShare2 className="h-4 w-4 text-[#1877F2]" />
                <span className="text-sm text-[#1A1A1A]">Facebook</span>
              </button>
              
              <button
                onClick={() => handleShareMethod("twitter")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#FFFAF0] transition-colors"
              >
                <FiShare2 className="h-4 w-4 text-[#1DA1F2]" />
                <span className="text-sm text-[#1A1A1A]">Twitter</span>
              </button>
              
              <button
                onClick={() => handleShareMethod("email")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#FFFAF0] transition-colors"
              >
                <FiMail className="h-4 w-4 text-[#D4A574]" />
                <span className="text-sm text-[#1A1A1A]">Email</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Backdrop */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
