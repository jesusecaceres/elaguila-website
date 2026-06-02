"use client";

import { FiExternalLink } from "react-icons/fi";
import type { AutosNegociosLang } from "../lib/autosNegociosLang";
import type { AutosNegociosBusinessHubReviewLink } from "../lib/autosNegociosBusinessHubContactTypes";

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
      className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-[14px] border-2 px-3.5 py-3 text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-gold)]/45"
      style={{
        borderColor: isYelp ? "rgba(211, 35, 35, 0.35)" : isGoogle ? "rgba(66, 133, 244, 0.25)" : "var(--lx-gold-border)",
        backgroundColor: isYelp ? "#FFF8F8" : isGoogle ? "#FFFFFF" : "#FFFCF7",
      }}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        {isGoogle ? <GoogleMark /> : isYelp ? <YelpMark /> : <FiExternalLink className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold leading-snug text-[color:var(--lx-text)]">{link.label}</span>
          <span className="mt-0.5 block text-xs font-medium text-[color:var(--lx-muted)]">
            {lang === "en" ? "Open reviews" : "Abrir reseñas"}
          </span>
        </span>
      </span>
      <FiExternalLink className="h-4 w-4 shrink-0 text-[color:var(--lx-muted)]" aria-hidden />
    </a>
  );
}
