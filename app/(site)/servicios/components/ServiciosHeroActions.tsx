"use client";

import { useState } from "react";
import { FiShare2, FiBookmark } from "react-icons/fi";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";

interface ServiciosHeroActionsProps {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  onQuoteClick: () => void;
}

export function ServiciosHeroActions({ profile, lang, onQuoteClick }: ServiciosHeroActionsProps) {
  // Share functionality
  const handleShare = async () => {
    const url = window.location.href;
    const title = profile.identity.businessName;
    
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // User cancelled or error, fallback to copy
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add toast notification here
      console.log('URL copied to clipboard');
    });
  };

  // Save functionality
  const getSaveKey = () => `servicios-saved-${profile.identity.slug}`;
  
  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(getSaveKey()) === 'true';
  });

  const handleSave = () => {
    const saved = !isSaved;
    setIsSaved(saved);
    if (typeof window !== 'undefined') {
      if (saved) {
        localStorage.setItem(getSaveKey(), 'true');
      } else {
        localStorage.removeItem(getSaveKey());
      }
    }
  };

  return (
    <>
      <button
        onClick={onQuoteClick}
        className="mt-4 w-full rounded-xl bg-[#3B66AD] px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-[0.97] active:scale-[0.99] sm:text-base"
      >
        {lang === "en" ? "Request quote" : "Pedir cotización"}
      </button>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-xs font-medium text-[color:var(--lx-text)] shadow-sm transition hover:border-[#3B66AD]/35"
        >
          <FiShare2 className="h-3.5 w-3.5" />
          {lang === "en" ? "Share" : "Compartir"}
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 rounded-lg border border-black/[0.08] px-3 py-2 text-xs font-medium shadow-sm transition ${
            isSaved 
              ? 'bg-[#3B66AD]/10 border-[#3B66AD]/35 text-[#3B66AD]' 
              : 'bg-white border-black/[0.08] text-[color:var(--lx-text)] hover:border-[#3B66AD]/35'
          }`}
        >
          <FiBookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
          {isSaved ? (lang === "en" ? "Saved" : "Guardado") : (lang === "en" ? "Save" : "Guardar")}
        </button>
      </div>
    </>
  );
}
