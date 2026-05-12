"use client";

import { useCallback, useEffect, useState } from "react";
import { FiHeart } from "react-icons/fi";
import { trackListingLike } from "@/app/lib/clasificadosAnalytics";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

type Props = {
  listingId: string | null | undefined;
  isLiked?: boolean;
  onToggle?: (isLiked: boolean) => void;
  variant?: "default" | "small" | "large";
  className?: string;
  lang?: "es" | "en";
  category?: string;
  ownerUserId?: string | null;
  /**
   * When false, no analytics or `user_liked_listings` writes (preview / marketing).
   * Default: true when `listingId` is non-empty.
   */
  persistEngagement?: boolean;
};

const LABELS = {
  es: {
    like: "Me gusta",
    liked: "Te gusta",
    liking: "...",
    preview: "Vista previa",
  },
  en: {
    like: "Like",
    liked: "Liked",
    liking: "...",
    preview: "Preview",
  },
} as const;

function sessionLikeKey(listingId: string) {
  return `lx_like_session_v1:${listingId}`;
}

/**
 * Like / unlike with durable state for signed-in users (`user_liked_listings`).
 * Anonymous: session-only heart state + analytics (no DB row).
 */
export function LeonixLikeButton({
  listingId,
  isLiked: initialLiked = false,
  onToggle,
  variant = "default",
  className = "",
  lang = "es",
  category,
  ownerUserId,
  persistEngagement,
}: Props) {
  const effectiveId = (listingId ?? "").trim();
  const allowEngage = persistEngagement !== false && Boolean(effectiveId);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isLiking, setIsLiking] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const labels = LABELS[lang];

  const sizeClasses = {
    small: "px-3 py-1.5 text-sm",
    default: "px-4 py-2 text-sm",
    large: "px-5 py-3 text-base",
  };

  const iconSizes = {
    small: "h-4 w-4",
    default: "h-4 w-4",
    large: "h-5 w-5",
  };

  useEffect(() => {
    setIsLiked(initialLiked);
  }, [initialLiked]);

  useEffect(() => {
    if (!allowEngage || !effectiveId) {
      setHydrated(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const sb = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (cancelled) return;
      if (user) {
        const { data } = await sb
          .from("user_liked_listings")
          .select("listing_id")
          .eq("user_id", user.id)
          .eq("listing_id", effectiveId)
          .maybeSingle();
        if (!cancelled) setIsLiked(!!data);
      } else {
        try {
          if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(sessionLikeKey(effectiveId)) === "1") {
            setIsLiked(true);
          }
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [allowEngage, effectiveId]);

  const handleToggle = useCallback(async () => {
    if (isLiking) return;
    if (!allowEngage || !effectiveId) return;

    setIsLiking(true);
    const nextState = !isLiked;

    try {
      const sb = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();

      if (user) {
        if (nextState) {
          const { error } = await sb
            .from("user_liked_listings")
            .upsert({ user_id: user.id, listing_id: effectiveId }, { onConflict: "user_id,listing_id" });
          if (error) return;
        } else {
          const { error } = await sb.from("user_liked_listings").delete().eq("user_id", user.id).eq("listing_id", effectiveId);
          if (error) return;
        }
      } else {
        try {
          if (nextState) sessionStorage.setItem(sessionLikeKey(effectiveId), "1");
          else sessionStorage.removeItem(sessionLikeKey(effectiveId));
        } catch {
          /* ignore */
        }
      }

      await trackListingLike(effectiveId, nextState, {
        category,
        ownerUserId: ownerUserId ?? undefined,
        eventSource: "cta_card",
        metadata: { authenticated: Boolean(user) },
      });

      setIsLiked(nextState);
      onToggle?.(nextState);
    } finally {
      setIsLiking(false);
    }
  }, [allowEngage, effectiveId, isLiked, isLiking, onToggle, category, ownerUserId]);

  const inert = !allowEngage || !effectiveId;

  return (
    <button
      type="button"
      onClick={() => void handleToggle()}
      disabled={isLiking || !hydrated || inert}
      title={inert ? labels.preview : undefined}
      data-leonix-like-active={isLiked && !inert ? "1" : "0"}
      aria-pressed={inert ? undefined : isLiked}
      className={`
        inline-flex items-center gap-2 rounded-full font-medium
        transition-all duration-200
        ${
          isLiked
            ? "bg-rose-50/95 text-rose-950 ring-2 ring-rose-400/90 shadow-sm hover:bg-rose-100/95"
            : "bg-white/95 text-[#1A1A1A] ring-1 ring-black/10 hover:bg-[#FFFAF0]"
        }
        ${inert ? "opacity-60 cursor-not-allowed" : ""}
        ${isLiked && !inert ? "font-semibold" : ""}
        ${sizeClasses[variant]}
        ${className}
      `}
      aria-label={inert ? labels.preview : isLiked ? labels.liked : labels.like}
      aria-disabled={inert || !hydrated}
    >
      <FiHeart
        className={`${iconSizes[variant]} shrink-0 ${
          isLiked ? "fill-rose-600 stroke-rose-700 text-rose-600" : "fill-transparent stroke-current text-current"
        }`}
        aria-hidden
      />
      <span>{isLiking ? labels.liking : inert ? labels.preview : isLiked ? labels.liked : labels.like}</span>
    </button>
  );
}
