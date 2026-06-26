"use client";

import { FiExternalLink } from "react-icons/fi";
import type { AutosNegociosLang } from "../lib/autosNegociosLang";
import type { AutosNegociosBusinessHubReviewLink } from "../lib/autosNegociosBusinessHubContactTypes";
import { autosPreviewRectReviewCardClass } from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

function GoogleMark() {
  return (
    <span
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#D6C7AD]/60 bg-white text-base font-bold leading-none"
      aria-hidden
    >
      <span style={{ color: "#4285F4" }}>G</span>
    </span>
  );
}

function YelpMark() {
  return (
    <span
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[11px] font-black tracking-tighter text-white"
      style={{ backgroundColor: "#D32323" }}
      aria-hidden
    >
      yelp
    </span>
  );
}

export function AutosNegociosHubReviewLinkButton({
  link,
  lang,
}: {
  link: AutosNegociosBusinessHubReviewLink;
  lang: AutosNegociosLang;
}) {
  const isGoogle = link.id === "google";
  const isYelp = link.id === "yelp";

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={autosPreviewRectReviewCardClass}
      style={{
        borderColor: isYelp ? "rgba(211, 35, 35, 0.35)" : isGoogle ? "rgba(66, 133, 244, 0.28)" : "#D6C7AD",
        backgroundColor: isYelp ? "#FFF8F8" : isGoogle ? "#FFFFFF" : "#FFFCF7",
      }}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        {isGoogle ? <GoogleMark /> : isYelp ? <YelpMark /> : <FiExternalLink className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold leading-snug text-[#1F241C]">{link.label}</span>
          <span className="mt-0.5 block text-xs font-medium text-[#5C5346]">
            {lang === "en" ? "Open reviews" : "Abrir reseñas"}
          </span>
        </span>
      </span>
      <FiExternalLink className="h-4 w-4 shrink-0 text-[#8A7A68]" aria-hidden />
    </a>
  );
}
