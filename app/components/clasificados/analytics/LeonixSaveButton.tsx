"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaBookmark, FaHeart } from "react-icons/fa";
import { FiBookmark, FiHeart } from "react-icons/fi";
import { trackListingSave } from "@/app/lib/clasificadosAnalytics";
import { createSupabaseBrowserClient, getBrowserAuthUserForEngagement } from "@/app/lib/supabase/browser";
import { formatEngagementWriteErrorForDev, logEngagementWriteFailure } from "@/app/lib/leonixEngagementClientDiagnostics";
import {
  deleteSavedListingForUser,
  readSavedListingForUser,
  upsertSavedListingForUser,
} from "@/app/lib/savedListingsRuntime";

type Props = {
  /** Analytics / engagement alias key (may be Leonix display id for likes/shares). */
  listingId: string | null | undefined;
  /** DB key for `saved_listings.listing_id` — use listing UUID for `listings` table rows. */
  savedListingKey?: string | null;
  isSaved?: boolean;
  onToggle?: (isSaved: boolean) => void;
  variant?: "default" | "small" | "large";
  className?: string;
  lang?: "es" | "en";
  category?: string;
  ownerUserId?: string | null;
  /** When false, no analytics or `saved_listings` writes. */
  persistEngagement?: boolean;
  /** When set, replaces default clasificados analytics insert. */
  recordSaveEvent?: (isSave: boolean) => void | Promise<void>;
  /** Optional G2A identity fields (Servicios: source_table + source_id for Guardados). */
  saveExtras?: {
    category?: string;
    source_table?: string;
    source_id?: string;
    canonical_ad_id?: string;
  };
  /** Visual icon for save — default bookmark; Varios uses heart. */
  iconStyle?: "bookmark" | "heart";
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
  savedListingKey,
  isSaved: initialSaved = false,
  onToggle,
  variant = "default",
  className = "",
  lang = "es",
  category,
  ownerUserId,
  persistEngagement,
  recordSaveEvent,
  saveExtras,
  iconStyle = "bookmark",
}: Props) {
  const effectiveId = (listingId ?? "").trim();
  const dbListingId = (savedListingKey ?? listingId ?? "").trim();
  const allowEngage = persistEngagement !== false && Boolean(dbListingId);
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
  }, [dbListingId]);

  useEffect(() => {
    if (!allowEngage || !dbListingId) {
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
        const { saved } = await readSavedListingForUser(sb, user.id, dbListingId);
        if (!cancelled && !userToggledRef.current) setIsSaved(saved);
      } else if (!cancelled && !userToggledRef.current) {
        setIsSaved(false);
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [allowEngage, dbListingId]);

  useEffect(() => {
    if (!allowEngage || !dbListingId) return;
    const sb = createSupabaseBrowserClient();
    const { data } = sb.auth.onAuthStateChange(() => {
      if (userToggledRef.current) return;
      void (async () => {
        const user = await getBrowserAuthUserForEngagement();
        if (userToggledRef.current) return;
        if (user) {
          const { saved } = await readSavedListingForUser(sb, user.id, dbListingId);
          if (!userToggledRef.current) setIsSaved(saved);
        } else if (!userToggledRef.current) {
          setIsSaved(false);
        }
      })();
    });
    return () => data.subscription.unsubscribe();
  }, [allowEngage, dbListingId]);

  const handleToggle = useCallback(async () => {
    if (isSaving) return;
    if (!allowEngage || !dbListingId) return;

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
        const { error, table } = await upsertSavedListingForUser(sb, user.id, dbListingId, saveExtras);
        if (error) {
          setIsSaved(prev);
          userToggledRef.current = false;
          logEngagementWriteFailure({
            table,
            op: "insert",
            listingKeyLen: dbListingId.length,
            hasUser: true,
            err: error,
          });
          setEngageErr(formatEngagementWriteErrorForDev(engagementWriteFailedMsg(lang), error));
          return;
        }
        setPostSaveDashboardHint(true);
        hintClearRef.current = setTimeout(() => setPostSaveDashboardHint(false), 8000);
      } else {
        const { error, table } = await deleteSavedListingForUser(sb, user.id, dbListingId);
        if (error) {
          setIsSaved(prev);
          userToggledRef.current = false;
          logEngagementWriteFailure({
            table,
            op: "delete",
            listingKeyLen: dbListingId.length,
            hasUser: true,
            err: error,
          });
          setEngageErr(formatEngagementWriteErrorForDev(engagementWriteFailedMsg(lang), error));
          return;
        }
      }

      if (recordSaveEvent) {
        await recordSaveEvent(nextState);
      } else {
        const analyticsKey = effectiveId || dbListingId;
        const ar = await trackListingSave(analyticsKey, nextState, {
          category,
          ownerUserId: ownerUserId ?? undefined,
          eventSource: "cta_card",
          metadata: {},
        });
        if (!ar.ok && process.env.NODE_ENV === "development") {
          console.warn("[lx-engagement] listing_analytics after save toggle failed", ar);
        }
      }

      onToggle?.(nextState);
    } finally {
      setIsSaving(false);
    }
  }, [allowEngage, dbListingId, effectiveId, isSaved, isSaving, onToggle, category, ownerUserId, lang, saveExtras, recordSaveEvent]);

  const inert = !allowEngage || !dbListingId;

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
            ? iconStyle === "heart"
              ? "!bg-[#FBF0F2] !text-[#7A1E2C] !shadow-sm !ring-2 !ring-[#7A1E2C]/25 !ring-offset-1 !ring-offset-white font-semibold"
              : "!bg-amber-100 !text-amber-950 !shadow-md !ring-2 !ring-amber-500 !ring-offset-1 !ring-offset-white font-bold"
            : "!bg-white !text-neutral-900 !shadow-sm !ring-1 !ring-neutral-300 hover:!bg-amber-50/90",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={inert ? labels.preview : isSaved ? labels.saved : labels.save}
        aria-disabled={inert || !hydrated}
      >
        {iconStyle === "heart" ? (
          isSaved ? (
            <FaHeart className={`${iconSizes[variant]} shrink-0 text-[#7A1E2C]`} aria-hidden />
          ) : (
            <FiHeart className={`${iconSizes[variant]} shrink-0 text-[#5C5346]`} aria-hidden />
          )
        ) : isSaved ? (
          <FaBookmark className={`${iconSizes[variant]} shrink-0 text-amber-600`} aria-hidden />
        ) : (
          <FiBookmark className={`${iconSizes[variant]} shrink-0 stroke-neutral-700 text-neutral-700`} aria-hidden />
        )}
        <span className={isSaved && !inert ? (iconStyle === "heart" ? "text-[#7A1E2C]" : "text-amber-950") : ""}>
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
