"use client";

import { useCallback, useEffect, useState } from "react";
import { FiBookmark } from "react-icons/fi";
import { trackListingSave } from "@/app/lib/clasificadosAnalytics";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

type Props = {
  listingId: string | null | undefined;
  isSaved?: boolean;
  onToggle?: (isSaved: boolean) => void;
  variant?: "default" | "small" | "large";
  className?: string;
  lang?: "es" | "en";
  category?: string;
  ownerUserId?: string | null;
  /** When false, no analytics or `user_saved_listings` writes. */
  persistEngagement?: boolean;
};

const LABELS = {
  es: {
    save: "Guardar",
    saved: "Guardado",
    saving: "Guardando...",
    preview: "Vista previa",
  },
  en: {
    save: "Save",
    saved: "Saved",
    saving: "Saving...",
    preview: "Preview",
  },
} as const;

export function LeonixSaveButton({
  listingId,
  isSaved: initialSaved = false,
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
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);
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
    setIsSaved(initialSaved);
  }, [initialSaved]);

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
          .from("user_saved_listings")
          .select("listing_id")
          .eq("user_id", user.id)
          .eq("listing_id", effectiveId)
          .maybeSingle();
        if (!cancelled) setIsSaved(!!data);
      } else if (!cancelled) {
        setIsSaved(false);
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [allowEngage, effectiveId]);

  const handleToggle = useCallback(async () => {
    if (isSaving) return;
    if (!allowEngage || !effectiveId) return;

    setIsSaving(true);
    const nextState = !isSaved;

    try {
      const sb = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        const here = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search || ""}` : "/clasificados";
        window.location.href = `/login?redirect=${encodeURIComponent(here)}`;
        return;
      }

      if (nextState) {
        const { error } = await sb
          .from("user_saved_listings")
          .upsert({ user_id: user.id, listing_id: effectiveId }, { onConflict: "user_id,listing_id" });
        if (error) return;
      } else {
        const { error } = await sb.from("user_saved_listings").delete().eq("user_id", user.id).eq("listing_id", effectiveId);
        if (error) return;
      }

      await trackListingSave(effectiveId, nextState, {
        category,
        ownerUserId: ownerUserId ?? undefined,
        eventSource: "cta_card",
        metadata: {},
      });

      setIsSaved(nextState);
      onToggle?.(nextState);
    } finally {
      setIsSaving(false);
    }
  }, [allowEngage, effectiveId, isSaved, isSaving, onToggle, category, ownerUserId]);

  const inert = !allowEngage || !effectiveId;

  return (
    <button
      type="button"
      onClick={() => void handleToggle()}
      disabled={isSaving || !hydrated || inert}
      title={inert ? labels.preview : undefined}
      data-leonix-save-active={isSaved && !inert ? "1" : "0"}
      aria-pressed={inert ? undefined : isSaved}
      className={`
        inline-flex items-center gap-2 rounded-full font-medium
        transition-all duration-200
        ${
          isSaved
            ? "bg-amber-50/95 text-amber-950 ring-2 ring-amber-400/85 shadow-sm hover:bg-amber-100/95"
            : "bg-white/95 text-[#1A1A1A] ring-1 ring-black/10 hover:bg-[#FFFAF0]"
        }
        ${inert ? "opacity-60 cursor-not-allowed" : ""}
        ${isSaved && !inert ? "font-semibold" : ""}
        ${sizeClasses[variant]}
        ${className}
      `}
      aria-label={inert ? labels.preview : isSaved ? labels.saved : labels.save}
      aria-disabled={inert || !hydrated}
    >
      <FiBookmark
        className={`${iconSizes[variant]} shrink-0 ${
          isSaved ? "fill-amber-600 stroke-amber-800 text-amber-600" : "fill-transparent stroke-current text-current"
        }`}
        aria-hidden
      />
      <span>{isSaving ? labels.saving : inert ? labels.preview : isSaved ? labels.saved : labels.save}</span>
    </button>
  );
}
