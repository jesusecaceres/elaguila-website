"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaHeart } from "react-icons/fa";
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
    likeError: "No se pudo guardar tu me gusta. Intenta iniciar sesión.",
  },
  en: {
    like: "Like",
    liked: "Liked",
    liking: "...",
    preview: "Preview",
    likeError: "Could not save your like. Try signing in.",
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
  const [engageErr, setEngageErr] = useState<string | null>(null);
  const labels = LABELS[lang];
  /** After a user toggle, do not let async hydration overwrite UI (Strict Mode / slow network races). */
  const userToggledRef = useRef(false);

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
    if (!engageErr) return;
    const t = setTimeout(() => setEngageErr(null), 8000);
    return () => clearTimeout(t);
  }, [engageErr]);

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
      if (userToggledRef.current) {
        if (!cancelled) setHydrated(true);
        return;
      }
      if (user) {
        const { data } = await sb
          .from("user_liked_listings")
          .select("listing_id")
          .eq("user_id", user.id)
          .eq("listing_id", effectiveId)
          .maybeSingle();
        if (!cancelled && !userToggledRef.current) setIsLiked(!!data);
      } else {
        try {
          if (
            !userToggledRef.current &&
            typeof sessionStorage !== "undefined" &&
            sessionStorage.getItem(sessionLikeKey(effectiveId)) === "1"
          ) {
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

    const prev = isLiked;
    const nextState = !prev;
    userToggledRef.current = true;
    setIsLiking(true);
    setEngageErr(null);
    setIsLiked(nextState);

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
          if (error) {
            setIsLiked(prev);
            userToggledRef.current = false;
            setEngageErr(lang === "en" ? LABELS.en.likeError : LABELS.es.likeError);
            return;
          }
        } else {
          const { error } = await sb.from("user_liked_listings").delete().eq("user_id", user.id).eq("listing_id", effectiveId);
          if (error) {
            setIsLiked(prev);
            userToggledRef.current = false;
            setEngageErr(lang === "en" ? LABELS.en.likeError : LABELS.es.likeError);
            return;
          }
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

      onToggle?.(nextState);
    } finally {
      setIsLiking(false);
    }
  }, [allowEngage, effectiveId, isLiked, isLiking, onToggle, category, ownerUserId, lang]);

  const inert = !allowEngage || !effectiveId;

  return (
    <div className="flex w-full max-w-[13.5rem] flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={() => void handleToggle()}
        disabled={isLiking || !hydrated || inert}
        title={inert ? labels.preview : undefined}
        data-leonix-like-active={isLiked && !inert ? "1" : "0"}
        aria-pressed={inert ? undefined : isLiked}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200",
          sizeClasses[variant],
          className,
          inert ? "opacity-60 cursor-not-allowed" : "",
          isLiked && !inert
            ? "!bg-rose-100 !text-rose-900 !shadow-md !ring-2 !ring-rose-500 !ring-offset-1 !ring-offset-white font-bold"
            : "!bg-white !text-neutral-900 !shadow-sm !ring-1 !ring-neutral-300 hover:!bg-rose-50/90",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={inert ? labels.preview : isLiked ? labels.liked : labels.like}
        aria-disabled={inert || !hydrated}
      >
        {isLiked ? (
          <FaHeart className={`${iconSizes[variant]} shrink-0 text-red-600`} aria-hidden />
        ) : (
          <FiHeart className={`${iconSizes[variant]} shrink-0 stroke-neutral-700 text-neutral-700`} aria-hidden />
        )}
        <span className={isLiked && !inert ? "text-rose-950" : ""}>
          {isLiking ? labels.liking : inert ? labels.preview : isLiked ? labels.liked : labels.like}
        </span>
      </button>
      {engageErr ? (
        <p className="text-center text-[10px] font-semibold leading-snug text-red-800 sm:text-[11px]" role="alert" data-leonix-like-error="1">
          {engageErr}
        </p>
      ) : null}
    </div>
  );
}
