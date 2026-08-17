"use client";

import { FiExternalLink } from "react-icons/fi";
import type { SharedConnectionHubReviewLink } from "../sharedConnectionHubContactTypes";

/**
 * Global Business Hub OS — Level A, link-only external review button.
 *
 * No provider API exists anywhere in this app, so this component NEVER renders a star rating or
 * review count, even if `link.rating`/`link.reviewCount` happen to be set on the input (reserved
 * for a future real provider integration, never owner-typed, never invented — see
 * `SharedConnectionHubReviewLink`'s own doc comment). It only ever renders a plain outbound
 * "Open reviews" link. Visuals (Google "G" mark, Yelp badge) lifted from the proven Servicios
 * `ServiciosHubReviewLinkButton.tsx` pattern.
 */
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

const COPY = {
  es: { google: "Ver reseñas en Google", yelp: "Ver en Yelp", open: "Abrir reseñas" },
  en: { google: "See reviews on Google", yelp: "See on Yelp", open: "Open reviews" },
} as const;

export function SharedConnectionHubReviewButton({
  link,
  lang,
  onClick,
  goldBorder = "rgba(201, 168, 74, 0.45)",
  ivory = "#FBF6EC",
  gold = "#C9A84A",
}: {
  link: SharedConnectionHubReviewLink;
  lang: "es" | "en";
  onClick: () => void;
  /** Category-supplied accent colors so the button matches the surrounding card, not a hardcoded theme. */
  goldBorder?: string;
  ivory?: string;
  gold?: string;
}) {
  const isGoogle = link.provider === "google";
  const isYelp = link.provider === "yelp";
  const copy = COPY[lang];
  const defaultLabel = isGoogle ? copy.google : isYelp ? copy.yelp : link.label;
  const displayLabel = link.label?.trim() || defaultLabel;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-lg border-2 px-3.5 py-3 text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
      style={{
        borderColor: isYelp ? "rgba(211, 35, 35, 0.35)" : isGoogle ? "rgba(66, 133, 244, 0.25)" : goldBorder,
        backgroundColor: isYelp ? "#FFF8F8" : isGoogle ? "#FFFFFF" : ivory,
      }}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        {isGoogle ? <GoogleMark /> : isYelp ? <YelpMark /> : <FiExternalLink className="h-5 w-5 shrink-0" style={{ color: gold }} aria-hidden />}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold leading-snug text-[#1E1814]">{displayLabel}</span>
          <span className="mt-0.5 block text-xs font-medium text-[#6F6254]">{copy.open}</span>
        </span>
      </span>
      <FiExternalLink className="h-4 w-4 shrink-0 text-[#6F6254]" aria-hidden />
    </button>
  );
}
