"use client";

import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";

/**
 * Draft/preview-only engagement strip — visual like count without public analytics writes.
 */
export function AutosNegociosPreviewEngagementStrip({
  lang,
  className = "",
}: {
  lang: "es" | "en";
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-end gap-2 ${className}`}
      data-autos-preview-engagement="1"
      aria-label={lang === "es" ? "Interacción (vista previa)" : "Engagement (preview)"}
    >
      <LeonixLikeButton
        listingId={null}
        variant="small"
        lang={lang}
        category="autos"
        persistEngagement={false}
        likeCount={0}
        countDisplay="numeric"
        numericShowZero
        previewLabelMode="iconOnly"
      />
    </div>
  );
}
