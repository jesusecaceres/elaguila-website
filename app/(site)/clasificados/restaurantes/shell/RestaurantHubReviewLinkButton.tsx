"use client";

import { FiExternalLink } from "react-icons/fi";
import { RCH_LX } from "./restaurantContactHubLeonix";

function GoogleMark() {
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-lg font-bold leading-none shadow-sm"
      aria-hidden
    >
      <span style={{ color: "#4285F4" }}>G</span>
    </span>
  );
}

function YelpMark() {
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-black tracking-tighter text-white shadow-sm"
      style={{ backgroundColor: "#D32323" }}
      aria-hidden
    >
      yelp
    </span>
  );
}

export function RestaurantHubReviewLinkButton({
  reviewId,
  label,
  lang,
  onClick,
}: {
  reviewId: string;
  label: string;
  lang: "es" | "en";
  onClick: () => void;
}) {
  const isGoogle = reviewId === "google-reviews";
  const isYelp = reviewId === "yelp";
  const defaultLabel = isGoogle
    ? lang === "en"
      ? "Reviews on Google"
      : "Opiniones en Google"
    : isYelp
      ? lang === "en"
        ? "Reviews on Yelp"
        : "Opiniones en Yelp"
      : label;
  const displayLabel = label?.trim() || defaultLabel;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-lg border-2 px-3.5 py-3 text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
      style={{
        borderColor: isYelp ? "rgba(211, 35, 35, 0.35)" : isGoogle ? "rgba(66, 133, 244, 0.25)" : RCH_LX.goldBorder,
        backgroundColor: isYelp ? "#FFF8F8" : isGoogle ? "#FFFFFF" : RCH_LX.ivory,
      }}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        {isGoogle ? <GoogleMark /> : isYelp ? <YelpMark /> : <FiExternalLink className="h-5 w-5 shrink-0" style={{ color: RCH_LX.gold }} aria-hidden />}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold leading-snug text-[#1E1814]">{displayLabel}</span>
          <span className="mt-0.5 block text-xs font-medium text-[#6F6254]">
            {lang === "en" ? "Open reviews" : "Abrir reseñas"}
          </span>
        </span>
      </span>
      <FiExternalLink className="h-4 w-4 shrink-0 text-[#6F6254]" aria-hidden />
    </button>
  );
}
