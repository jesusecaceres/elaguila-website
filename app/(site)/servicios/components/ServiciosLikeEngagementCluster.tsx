"use client";

import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";

/**
 * Like button + persisted public count in one connected pill (hero / hub engagement rows).
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
}: {
  listingId: string;
  ownerUserId?: string | null;
  lang: ServiciosLang;
  publicLikeCount?: number;
  persistEngagement?: boolean;
  variant?: "default" | "small" | "large";
  tone?: "hero" | "hub";
  className?: string;
}) {
  const likeCueN =
    typeof publicLikeCount === "number" && Number.isFinite(publicLikeCount)
      ? Math.max(0, Math.floor(publicLikeCount))
      : 0;

  const countLabel =
    lang === "en"
      ? likeCueN === 1
        ? "1 like"
        : `${likeCueN} likes`
      : likeCueN === 1
        ? "1 me gusta"
        : `${likeCueN} me gusta`;

  const shellClass =
    tone === "hero"
      ? "inline-flex max-w-full items-stretch overflow-hidden rounded-full shadow-sm ring-1 ring-white/35"
      : "inline-flex max-w-full items-stretch overflow-hidden rounded-full shadow-sm ring-1 ring-[color:var(--lx-border,#E8D7B8)]";

  const countClass =
    tone === "hero"
      ? "flex min-h-[44px] items-center border-l border-white/25 bg-white/10 px-2.5 text-[11px] font-semibold tabular-nums text-white/95"
      : "flex min-h-[44px] items-center border-l border-[color:var(--lx-border,#E8D7B8)] bg-[color:var(--lx-surface-2,#FAF7F2)] px-2.5 text-[11px] font-semibold tabular-nums text-[color:var(--lx-text-2)]";

  return (
    <div className={`${shellClass} ${className}`.trim()} data-servicios-like-cluster="1">
      <LeonixLikeButton
        listingId={listingId}
        ownerUserId={ownerUserId ?? undefined}
        variant={variant}
        lang={lang}
        category="servicios"
        persistEngagement={persistEngagement}
        className="!rounded-none !rounded-l-full !shadow-none"
      />
      {likeCueN > 0 ? (
        <span className={countClass} data-servicios-like-cluster-count="1">
          <span aria-hidden className="mr-0.5">
            ·
          </span>
          <span aria-hidden>❤️</span> {countLabel}
        </span>
      ) : null}
    </div>
  );
}
