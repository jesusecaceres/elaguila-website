"use client";

import { useEffect, useState } from "react";
import { FiHeart } from "react-icons/fi";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  trackBrLikeGlobal,
  trackBrListingShareGlobal,
  type BrGlobalAnalyticsContext,
} from "@/app/lib/clasificados/bienes-raices/analytics/bienesRaicesGlobalAnalytics";

const COPY = {
  es: {
    like: "Me gusta",
    share: "Compartir",
    unpublishedHint: "Disponible cuando el anuncio esté publicado.",
  },
  en: {
    like: "Like",
    share: "Share",
    unpublishedHint: "Available when the listing is published.",
  },
} as const;

const btnShell =
  "max-w-none w-auto [&>button]:min-h-[40px] [&>button]:rounded-xl [&>button]:border [&>button]:border-[#E8DFD0] [&>button]:bg-white/95 [&>button]:px-3 [&>button]:py-2 [&>button]:text-xs [&>button]:font-bold [&>button]:text-[#2A2620] [&>button]:shadow-sm [&>button]:hover:border-[#C9B46A]/55 [&>button]:hover:bg-[#FFFCF7]";

type Props = {
  lang: "es" | "en";
  mode: "live" | "preview";
  /** Internal listings.id UUID — analytics source_id + like key. */
  listingUuid?: string | null;
  leonixAdId?: string | null;
  listingUrl?: string;
  listingTitle?: string;
  ownerUserId?: string | null;
  /** Optional server-provided durable count; otherwise fetched from user_liked_listings. */
  likeCount?: number;
  className?: string;
};

async function fetchDurableLikeCount(listingUuid: string): Promise<number> {
  try {
    const sb = createSupabaseBrowserClient();
    const { count, error } = await sb
      .from("user_liked_listings")
      .select("listing_id", { count: "exact", head: true })
      .eq("listing_id", listingUuid);
    if (error) return 0;
    return typeof count === "number" && Number.isFinite(count) ? Math.max(0, count) : 0;
  } catch {
    return 0;
  }
}

/**
 * Bienes Raíces engagement row — real like/share against exact listing UUID.
 * Preview mode is visual-only (no analytics writes).
 */
export function BrEngagementRow({
  lang,
  mode,
  listingUuid,
  leonixAdId,
  listingUrl,
  listingTitle,
  ownerUserId,
  likeCount: likeCountProp,
  className = "",
}: Props) {
  const uuid = (listingUuid ?? "").trim();
  const ctx: BrGlobalAnalyticsContext = {
    listingUuid: uuid,
    leonixAdId: leonixAdId?.trim() || undefined,
  };
  const persist = mode === "live" && Boolean(uuid);
  const [likeCount, setLikeCount] = useState(() =>
    typeof likeCountProp === "number" && Number.isFinite(likeCountProp)
      ? Math.max(0, Math.floor(likeCountProp))
      : 0,
  );
  const [countReady, setCountReady] = useState(typeof likeCountProp === "number");

  useEffect(() => {
    if (typeof likeCountProp === "number" && Number.isFinite(likeCountProp)) {
      setLikeCount(Math.max(0, Math.floor(likeCountProp)));
      setCountReady(true);
      return;
    }
    if (mode !== "live" || !uuid) {
      setLikeCount(0);
      setCountReady(true);
      return;
    }
    let cancelled = false;
    void fetchDurableLikeCount(uuid).then((n) => {
      if (!cancelled) {
        setLikeCount(n);
        setCountReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [likeCountProp, mode, uuid]);

  if (mode === "preview") {
    return (
      <div
        className={`flex flex-wrap items-center gap-2 ${className}`}
        data-br-engagement-row="preview"
        aria-label={COPY[lang].like}
      >
        <button
          type="button"
          disabled
          title={COPY[lang].unpublishedHint}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#E8DFD0] bg-white/80 px-3 py-2 text-xs font-bold text-[#2A2620] opacity-60"
        >
          <FiHeart className="h-4 w-4 shrink-0 text-[#7A1E2C]/70" aria-hidden />
          <span className="sr-only">{COPY[lang].unpublishedHint}</span>
        </button>
        <LeonixShareButton
          listingId={null}
          listingUrl={listingUrl}
          listingTitle={listingTitle}
          lang={lang}
          variant="small"
          persistEngagement={false}
          category="bienes-raices"
          className={btnShell}
        />
      </div>
    );
  }

  if (!uuid) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
      data-br-engagement-row="live"
      data-br-listing-uuid={uuid}
    >
      <LeonixLikeButton
        listingId={uuid}
        ownerUserId={ownerUserId}
        variant="small"
        lang={lang}
        category="bienes-raices"
        persistEngagement={persist}
        countDisplay="numeric"
        likeCount={countReady ? likeCount : 0}
        recordLikeEvent={(isLike) => trackBrLikeGlobal(ctx, isLike)}
        className={btnShell}
      />
      <LeonixShareButton
        listingId={uuid}
        listingUrl={listingUrl}
        listingTitle={listingTitle}
        lang={lang}
        variant="small"
        category="bienes-raices"
        ownerUserId={ownerUserId}
        persistEngagement={persist}
        directNativeShare
        recordShareEvent={(shareMethod) => trackBrListingShareGlobal(ctx, shareMethod)}
        className={btnShell}
      />
    </div>
  );
}
