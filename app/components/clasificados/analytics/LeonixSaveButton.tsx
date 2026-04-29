"use client";

import { useState } from "react";
import { FiBookmark } from "react-icons/fi";
import { trackListingSave } from "@/app/lib/clasificadosAnalytics";

type Props = {
  listingId: string;
  isSaved?: boolean;
  onToggle?: (isSaved: boolean) => void;
  variant?: "default" | "small" | "large";
  className?: string;
  lang?: "es" | "en";
  category?: string;
  ownerUserId?: string;
};

const LABELS = {
  es: {
    save: "Guardar",
    saved: "Guardado",
    saving: "Guardando..."
  },
  en: {
    save: "Save",
    saved: "Saved", 
    saving: "Saving..."
  }
} as const;

/**
 * Interactive save button following Leonix design system
 * Handles save/unsave actions with analytics tracking
 */
export function LeonixSaveButton({ 
  listingId,
  isSaved: initialSaved = false,
  onToggle,
  variant = "default",
  className = "",
  lang = "es",
  category,
  ownerUserId
}: Props) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);
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
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      // Track analytics event
      await trackListingSave(listingId, !isSaved, {
        category,
        ownerUserId,
        eventSource: "cta_card",
        metadata: { previousState: isSaved }
      });
      
      // Update local state
      const newState = !isSaved;
      setIsSaved(newState);
      
      // Call parent callback if provided
      if (onToggle) {
        onToggle(newState);
      }
      
    } catch (error) {
      console.warn("Save toggle failed:", error);
      // Optionally revert state on error
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <button
      onClick={handleToggle}
      disabled={isSaving}
      className={`
        inline-flex items-center gap-2 rounded-full font-medium
        transition-all duration-200
        ${isSaved 
          ? "bg-[#D4A574] text-white border border-[#D4A574] hover:bg-[#C19A6B]" 
          : "bg-white text-[#1A1A1A] border border-[#D4A574] hover:bg-[#FFFAF0]"
        }
        ${sizeClasses[variant]}
        ${className}
      `}
      aria-label={isSaved ? labels.saved : labels.save}
    >
      <FiBookmark className={`${iconSizes[variant]} ${isSaved ? "fill-current" : ""}`} />
      <span>
        {isSaving ? labels.saving : (isSaved ? labels.saved : labels.save)}
      </span>
    </button>
  );
}
