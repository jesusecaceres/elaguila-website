"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaBookmark } from "react-icons/fa";
import { FiBookmark } from "react-icons/fi";
import { trackListingSave } from "@/app/lib/clasificadosAnalytics";
import { createSupabaseBrowserClient, getBrowserAuthUserForEngagement } from "@/app/lib/supabase/browser";
import { formatEngagementWriteErrorForDev, logEngagementWriteFailure } from "@/app/lib/leonixEngagementClientDiagnostics";

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
    savedDashboard: "Guardado en tu dashboard",
  },
  en: {
    save: "Save",
    saved: "Saved",
    saving: "Saving...",
    preview: "Preview",
    savedDashboard: "Saved to your dashboard",
  },
} as const;

function engagementNeedAuthMsg(lang: "es" | "en") {
  return lang === "en" ? "Sign in to save this listing." : "Inicia sesión para guardar este anuncio.";
}

function engagementWriteFailedMsg(lang: "es" | "en") {
  return lang === "en" ? "Could not save. Please try again." : "No se pudo guardar. Inténtalo de nuevo.";
}

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
  const [postSaveDashboardHint, setPostSaveDashboardHint] = useState(false);
  const [engageErr, setEngageErr] = useState<string | null>(null);
  const labels = LABELS[lang];
  const userToggledRef = useRef(false);
  const hintClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    return () => {
      if (hintClearRef.current) clearTimeout(hintClearRef.current);
    };
  }, [effectiveId]);

  useEffect(() => {
    if (!allowEngage || !effectiveId) {
      setHydrated(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const sb = createSupabaseBrowserClient();
      const user = await getBrowserAuthUserForEngagement();
      if (cancelled) return;
      if (userToggledRef.current) {
        if (!cancelled) setHydrated(true);
        return;
      }
      if (user) {
        const { data } = await sb
          .from("user_saved_listings")
          .select("listing_id")
          .eq("user_id", user.id)
          .eq("listing_id", effectiveId)
          .maybeSingle();
        if (!cancelled && !userToggledRef.current) setIsSaved(!!data);
      } else if (!cancelled && !userToggledRef.current) {
        setIsSaved(false);
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [allowEngage, effectiveId]);

  useEffect(() => {
    if (!allowEngage || !effectiveId) return;
    const sb = createSupabaseBrowserClient();
    const { data } = sb.auth.onAuthStateChange(() => {
      if (userToggledRef.current) return;
      void (async () => {
        const user = await getBrowserAuthUserForEngagement();
        if (userToggledRef.current) return;
        if (user) {
          const { data: row } = await sb
            .from("user_saved_listings")
            .select("listing_id")
            .eq("user_id", user.id)
            .eq("listing_id", effectiveId)
            .maybeSingle();
          if (!userToggledRef.current) setIsSaved(!!row);
        } else if (!userToggledRef.current) {
          setIsSaved(false);
        }
      })();
    });
    return () => data.subscription.unsubscribe();
  }, [allowEngage, effectiveId]);

  const handleToggle = useCallback(async () => {
    if (isSaving) return;
    if (!allowEngage || !effectiveId) return;

    const prev = isSaved;
    const nextState = !prev;

    const sb = createSupabaseBrowserClient();
    const user = await getBrowserAuthUserForEngagement();
    if (!user) {
      setEngageErr(engagementNeedAuthMsg(lang));
      const here = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search || ""}` : "/clasificados";
      window.setTimeout(() => {
        window.location.href = `/login?redirect=${encodeURIComponent(here)}`;
      }, 1200);
      return;
    }

    userToggledRef.current = true;
    setIsSaving(true);
    setEngageErr(null);
    setIsSaved(nextState);
    if (hintClearRef.current) clearTimeout(hintClearRef.current);
    setPostSaveDashboardHint(false);

    try {
      if (nextState) {
        const { error } = await sb
          .from("user_saved_listings")
          .upsert({ user_id: user.id, listing_id: effectiveId }, { onConflict: "user_id,listing_id" });
        if (error) {
          setIsSaved(prev);
          userToggledRef.current = false;
          logEngagementWriteFailure({
            table: "user_saved_listings",
            op: "upsert",
            listingKeyLen: effectiveId.length,
            hasUser: true,
            err: error,
          });
          setEngageErr(formatEngagementWriteErrorForDev(engagementWriteFailedMsg(lang), error));
          return;
        }
        setPostSaveDashboardHint(true);
        hintClearRef.current = setTimeout(() => setPostSaveDashboardHint(false), 8000);
      } else {
        const { error } = await sb.from("user_saved_listings").delete().eq("user_id", user.id).eq("listing_id", effectiveId);
        if (error) {
          setIsSaved(prev);
          userToggledRef.current = false;
          logEngagementWriteFailure({
            table: "user_saved_listings",
            op: "delete",
            listingKeyLen: effectiveId.length,
            hasUser: true,
            err: error,
          });
          setEngageErr(formatEngagementWriteErrorForDev(engagementWriteFailedMsg(lang), error));
          return;
        }
      }

      const ar = await trackListingSave(effectiveId, nextState, {
        category,
        ownerUserId: ownerUserId ?? undefined,
        eventSource: "cta_card",
        metadata: {},
      });
      if (!ar.ok && process.env.NODE_ENV === "development") {
        console.warn("[lx-engagement] listing_analytics after save toggle failed", ar);
      }

      onToggle?.(nextState);
    } finally {
      setIsSaving(false);
    }
  }, [allowEngage, effectiveId, isSaved, isSaving, onToggle, category, ownerUserId, lang]);

  const inert = !allowEngage || !effectiveId;

  return (
    <div className="flex w-full max-w-[13.5rem] flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={() => void handleToggle()}
        disabled={isSaving || !hydrated || inert}
        title={inert ? labels.preview : undefined}
        data-leonix-save-active={isSaved && !inert ? "1" : "0"}
        aria-pressed={inert ? undefined : isSaved}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200",
          sizeClasses[variant],
          className,
          inert ? "opacity-60 cursor-not-allowed" : "",
          isSaved && !inert
            ? "!bg-amber-100 !text-amber-950 !shadow-md !ring-2 !ring-amber-500 !ring-offset-1 !ring-offset-white font-bold"
            : "!bg-white !text-neutral-900 !shadow-sm !ring-1 !ring-neutral-300 hover:!bg-amber-50/90",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={inert ? labels.preview : isSaved ? labels.saved : labels.save}
        aria-disabled={inert || !hydrated}
      >
        {isSaved ? (
          <FaBookmark className={`${iconSizes[variant]} shrink-0 text-amber-600`} aria-hidden />
        ) : (
          <FiBookmark className={`${iconSizes[variant]} shrink-0 stroke-neutral-700 text-neutral-700`} aria-hidden />
        )}
        <span className={isSaved && !inert ? "text-amber-950" : ""}>
          {isSaving ? labels.saving : inert ? labels.preview : isSaved ? labels.saved : labels.save}
        </span>
      </button>
      {postSaveDashboardHint && isSaved && !inert ? (
        <p
          className="text-center text-[10px] font-semibold leading-snug text-amber-900 sm:text-[11px]"
          role="status"
          aria-live="polite"
          data-leonix-save-dashboard-hint="1"
        >
          {labels.savedDashboard}
        </p>
      ) : null}
      {engageErr ? (
        <p className="text-center text-[10px] font-semibold leading-snug text-red-800 sm:text-[11px]" role="alert" data-leonix-save-error="1">
          {engageErr}
        </p>
      ) : null}
    </div>
  );
}
