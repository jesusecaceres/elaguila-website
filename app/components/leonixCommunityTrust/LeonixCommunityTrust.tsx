"use client";

/**
 * Globalization Build 03 — Leonix Community Trust: native, category-aware endorsement chips.
 * NOT a star rating. NOT a heart/like. The lion (🦁) is the Leonix endorsement signal — no image
 * asset is used (Gate 19): a plain Unicode glyph is genuinely preferable at chip size and carries
 * zero risk of misrepresenting the official crest (`public/logo-clean.png`, untouched).
 *
 * One client-side summary fetch on mount (mirrors the already-proven `SavedSearchButton`/
 * `AutosSaveSearchButton` integration pattern already live in this app for exactly this kind of
 * "engagement state on an existing client card" case) — a single bounded request loads every
 * chip's real count + the viewer's own vote state in one shot (Gate 18/34: no N+1). Toggling is a
 * single authenticated request that awaits the server's real count before updating the chip
 * (Gate 16: truth over animation) — never a local optimistic count that could disagree with the
 * database.
 */
import { useCallback, useEffect, useState } from "react";
import {
  fetchLeonixEndorsementSummary,
  hasLeonixEndorsementSession,
  toggleLeonixEndorsementVoteClient,
  type LeonixEndorsementSummaryEntry,
} from "@/app/lib/leonixCommunityTrust/leonixEndorsementClient";
import { trackLeonixEndorsementToggle } from "@/app/lib/leonixCommunityTrust/leonixEndorsementAnalytics";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { LeonixEndorsementCategory } from "@/app/lib/leonixCommunityTrust/leonixEndorsementRegistry";

type ChipState = "idle" | "toggling";

const COPY = {
  es: {
    title: "Comunidad en Leonix",
    firstToEndorse: "Sé de los primeros en reconocer lo que hace bien este negocio.",
    signInRequired: "Inicia sesión para endosar.",
    error: "No se pudo completar la acción. Intenta de nuevo.",
  },
  en: {
    title: "Community on Leonix",
    firstToEndorse: "Be among the first to endorse what this business does well.",
    signInRequired: "Sign in to endorse.",
    error: "That action didn't go through. Please try again.",
  },
} as const;

export function LeonixCommunityTrust({
  category,
  targetId,
  ownerUserId = null,
  lang,
  surface,
}: {
  category: LeonixEndorsementCategory;
  /** The durable business identity being endorsed (Gate 13) — never a disposable ad UUID when a
   * durable profile exists. */
  targetId: string;
  ownerUserId?: string | null;
  lang: "es" | "en";
  /** Free-text surface tag for analytics metadata (e.g. "restaurantes_hub", "servicios_hub"). */
  surface: string;
}) {
  const t = COPY[lang];
  const [entries, setEntries] = useState<LeonixEndorsementSummaryEntry[] | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [chipState, setChipState] = useState<ChipState>("idle");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [signInHintKey, setSignInHintKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchLeonixEndorsementSummary(category, targetId);
      if (cancelled) return;
      setEntries(res.ok ? res.summary : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [category, targetId]);

  const handleTap = useCallback(
    async (endorsementKey: string) => {
      if (chipState === "toggling") return;
      setErrorKey(null);
      setSignInHintKey(null);

      const signedIn = await hasLeonixEndorsementSession();
      if (!signedIn) {
        setSignInHintKey(endorsementKey);
        const here = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
        window.setTimeout(() => {
          window.location.href = `/login?lang=${lang}&redirect=${encodeURIComponent(here)}`;
        }, 1200);
        return;
      }

      setChipState("toggling");
      setBusyKey(endorsementKey);
      const result = await toggleLeonixEndorsementVoteClient({ category, targetId, endorsementKey, ownerUserId });
      if (!result.ok) {
        setErrorKey(endorsementKey);
        setChipState("idle");
        setBusyKey(null);
        return;
      }
      setEntries((prev) =>
        (prev ?? []).map((e) => (e.key === endorsementKey ? { ...e, count: result.count, userVoted: result.active } : e)),
      );
      setChipState("idle");
      setBusyKey(null);

      try {
        const sb = createSupabaseBrowserClient();
        const { data } = await sb.auth.getSession();
        trackLeonixEndorsementToggle({
          category,
          targetId,
          endorsementKey,
          active: result.active,
          surface,
          accessToken: data.session?.access_token ?? null,
        });
      } catch {
        /* analytics is never count truth */
      }
    },
    [category, targetId, ownerUserId, lang, surface, chipState],
  );

  if (entries === null) return null;
  if (entries.length === 0) return null;

  const totalEndorsements = entries.reduce((sum, e) => sum + e.count, 0);
  const isZero = totalEndorsements === 0;

  return (
    <section aria-labelledby="leonix-community-trust-heading" className="min-w-0">
      <h3
        id="leonix-community-trust-heading"
        className="border-b border-[#E8D9C4]/80 pb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1E1814] sm:text-sm"
      >
        {t.title}
      </h3>
      {isZero ? <p className="mt-2 text-[11px] leading-snug text-[#6F6254]">{t.firstToEndorse}</p> : null}
      <ul className="mt-2 flex flex-wrap gap-2" role="list">
        {entries.map((entry) => {
          const label = lang === "en" ? entry.en : entry.es;
          const busy = busyKey === entry.key && chipState === "toggling";
          return (
            <li key={entry.key}>
              <button
                type="button"
                onClick={() => void handleTap(entry.key)}
                disabled={busy}
                aria-pressed={entry.userVoted}
                aria-label={`${label} · ${entry.count}`}
                className={
                  entry.userVoted
                    ? "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border-2 border-[#C9A84A] bg-[#FBF3DE] px-3 py-2 text-xs font-semibold text-[#5C4A1F] shadow-sm transition disabled:cursor-default disabled:opacity-80"
                    : "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#D6C7AD] bg-white px-3 py-2 text-xs font-semibold text-[#1A1A1A] shadow-sm transition hover:bg-[#FAF6EE] disabled:cursor-default disabled:opacity-80"
                }
              >
                <span aria-hidden="true">🦁{entry.userVoted ? "✓" : ""}</span>
                <span>
                  {label} <span className="tabular-nums text-[#6F6254]">· {entry.count}</span>
                </span>
              </button>
              {signInHintKey === entry.key ? (
                <p role="status" className="mt-1 text-[11px] leading-snug text-[#5C5346]">
                  {t.signInRequired}
                </p>
              ) : null}
              {errorKey === entry.key ? (
                <p role="alert" className="mt-1 text-[11px] leading-snug text-[#7A1E2C]">
                  {t.error}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
