"use client";

import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";

/**
 * Compact Servicios Like — visible display is count + heart only (e.g. `1 ♥`).
 * Real like/unlike + DB-backed count via LeonixLikeButton.
 */
export function ServiciosLikeEngagementCluster({
  listingId,
  ownerUserId,
  lang,
  publicLikeCount,
  persistEngagement = true,
  variant = "small",
  tone = "hero",
  className = "",
  recordLikeEvent,
}: {
  listingId: string;
  ownerUserId?: string | null;
  lang: ServiciosLang;
  publicLikeCount?: number;
  persistEngagement?: boolean;
  variant?: "default" | "small" | "large";
  tone?: "hero" | "hub";
  className?: string;
  recordLikeEvent?: (isLike: boolean) => void | Promise<void>;
}) {
  const likeCueN =
    typeof publicLikeCount === "number" && Number.isFinite(publicLikeCount)
      ? Math.max(0, Math.floor(publicLikeCount))
      : 0;

  const toneClass =
    tone === "hero"
      ? "!shadow-sm !ring-1 !ring-white/35"
      : "!shadow-sm !ring-1 !ring-[color:var(--lx-border,#E8D7B8)]";

  return (
    <div className={className.trim()} data-servicios-like-cluster="1" data-servicios-like-compact="1">
      <LeonixLikeButton
        listingId={listingId}
        ownerUserId={ownerUserId ?? undefined}
        variant={variant}
        lang={lang}
        category="servicios"
        persistEngagement={persistEngagement}
        recordLikeEvent={recordLikeEvent}
        likeCount={likeCueN}
        countDisplay="numeric"
        numericShowZero
        previewLabelMode="iconOnly"
        className={`!inline-flex !w-auto !max-w-none !flex-row-reverse !gap-1 !rounded-full ${toneClass}`}
      />
    </div>
  );
}
