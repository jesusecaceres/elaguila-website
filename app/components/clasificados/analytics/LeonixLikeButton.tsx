"use client";

import { useState } from "react";
import { FiHeart } from "react-icons/fi";
import { trackListingLike } from "@/app/lib/clasificadosAnalytics";

type Props = {
  listingId: string;
  isLiked?: boolean;
  onToggle?: (isLiked: boolean) => void;
  variant?: "default" | "small" | "large";
  className?: string;
  lang?: "es" | "en";
  category?: string;
  ownerUserId?: string;
};

const LABELS = {
  es: {
    like: "Me gusta",
    liked: "Te gusta",
    liking: "..."
  },
  en: {
    like: "Like",
    liked: "Liked",
    liking: "..."
  }
} as const;

/**
 * Interactive like button following Leonix design system
 * Handles like/unlike actions with analytics tracking
 */
export function LeonixLikeButton({ 
  listingId,
  isLiked: initialLiked = false,
  onToggle,
  variant = "default",
  className = "",
  lang = "es",
  category,
  ownerUserId
}: Props) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isLiking, setIsLiking] = useState(false);
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
  
  const handleToggle = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    
    try {
      // Track analytics event
      await trackListingLike(listingId, !isLiked, {
        category,
        ownerUserId,
        eventSource: "cta_card",
        metadata: { previousState: isLiked }
      });
      
      // Update local state
      const newState = !isLiked;
      setIsLiked(newState);
      
      // Call parent callback if provided
      if (onToggle) {
        onToggle(newState);
      }
      
    } catch (error) {
      console.warn("Like toggle failed:", error);
      // Optionally revert state on error
    } finally {
      setIsLiking(false);
    }
  };
  
  return (
    <button
      onClick={handleToggle}
      disabled={isLiking}
      className={`
        inline-flex items-center gap-2 rounded-full font-medium
        transition-all duration-200
        ${isLiked 
          ? "bg-[#D4A574] text-white border border-[#D4A574] hover:bg-[#C19A6B]" 
          : "bg-white text-[#1A1A1A] border border-[#D4A574] hover:bg-[#FFFAF0]"
        }
        ${sizeClasses[variant]}
        ${className}
      `}
      aria-label={isLiked ? labels.liked : labels.like}
    >
      <FiHeart className={`${iconSizes[variant]} ${isLiked ? "fill-current" : ""}`} />
      <span>
        {isLiking ? labels.liking : (isLiked ? labels.liked : labels.like)}
      </span>
    </button>
  );
}
