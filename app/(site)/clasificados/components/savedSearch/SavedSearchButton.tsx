"use client";

/**
 * Saved Search 06 — generic "Guardar búsqueda / Save search" CTA, shared by Bienes Raíces and
 * Rentas results pages. Extracted from `AutosSaveSearchButton.tsx`'s proven logic (deliberately
 * NOT touched — zero regression risk to the already-Production Autos component) so BR/Rentas don't
 * each clone ~150 lines of identical checking/saving/signed-out logic (Gate 21: "reuse the Autos
 * interaction pattern... do not create a second API route"). The caller supplies the already
 * category-adapted `normalized` input (via that category's own `*FilterStateToSavedSearch`
 * adapter) — this component itself contains no category-specific logic at all.
 */
import { useEffect, useMemo, useState } from "react";
import { buildSavedSearchFingerprintBrowser } from "@/app/lib/saved-search/savedSearchFingerprintBrowser";
import { hasSavedSearchSession, listSavedSearchesClient, saveSavedSearchClient } from "@/app/lib/saved-search/savedSearchClient";
import type { SavedSearchNormalizedInput } from "@/app/lib/saved-search/savedSearchTypes";

type SaveState = "checking" | "unsaved" | "saved-active" | "saving" | "error" | "signed-out";

const COPY = {
  es: {
    save: "Guardar búsqueda",
    saved: "Búsqueda guardada",
    saving: "Guardando…",
    hint: "Guarda esta búsqueda para volver a encontrarla fácilmente.",
    error: "No pudimos guardar tu búsqueda. Intenta de nuevo.",
    signInRequired: "Inicia sesión para guardar tu búsqueda.",
  },
  en: {
    save: "Save search",
    saved: "Search saved",
    saving: "Saving…",
    hint: "Save this search so you can quickly return to it later.",
    error: "We couldn't save your search. Please try again.",
    signInRequired: "Sign in to save your search.",
  },
} as const;

export function SavedSearchButton({
  normalized,
  lang,
}: {
  normalized: SavedSearchNormalizedInput;
  lang: "es" | "en";
}) {
  const t = COPY[lang];
  const [state, setState] = useState<SaveState>("checking");

  const normalizedKey = JSON.stringify(normalized);

  // Truthful saved-state check — server-authoritative. See `AutosSaveSearchButton.tsx` for the
  // full rationale (identical here): a background probe failure just leaves the button in its
  // normal clickable "save" state, never fabricating a saved/error state from an unrequested check.
  useEffect(() => {
    let cancelled = false;
    async function check() {
      const signedIn = await hasSavedSearchSession();
      if (cancelled) return;
      if (!signedIn) {
        setState("unsaved");
        return;
      }
      const [fingerprint, res] = await Promise.all([
        buildSavedSearchFingerprintBrowser(normalized),
        listSavedSearchesClient({ category: normalized.category }),
      ]);
      if (cancelled) return;
      if (!res.ok) {
        setState("unsaved");
        return;
      }
      const match = res.data.savedSearches.find((row) => row.fingerprint === fingerprint && row.isActive);
      setState(match ? "saved-active" : "unsaved");
    }
    setState("checking");
    void check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedKey]);

  const handleClick = async () => {
    if (state === "saved-active" || state === "saving" || state === "checking") return;

    const signedIn = await hasSavedSearchSession();
    if (!signedIn) {
      setState("signed-out");
      const here = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      window.setTimeout(() => {
        window.location.href = `/login?lang=${lang}&redirect=${encodeURIComponent(here)}`;
      }, 1200);
      return;
    }

    setState("saving");
    const res = await saveSavedSearchClient(normalized);
    if (!res.ok) {
      setState("error");
      return;
    }
    setState("saved-active");
  };

  const disabled = state === "checking" || state === "saving" || state === "saved-active";

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled}
        aria-pressed={state === "saved-active"}
        title={t.hint}
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#D6C7AD] bg-white px-3 py-2 text-xs font-semibold text-[#1A1A1A] shadow-sm transition hover:bg-[#FAF6EE] disabled:cursor-default disabled:opacity-80"
      >
        {state === "saved-active" ? (
          <>
            <span aria-hidden>✓</span> {t.saved}
          </>
        ) : state === "saving" ? (
          t.saving
        ) : (
          t.save
        )}
      </button>
      {state === "signed-out" ? (
        <p role="status" className="text-[11px] leading-snug text-[#5C5346]">
          {t.signInRequired}
        </p>
      ) : null}
      {state === "error" ? (
        <p role="alert" className="text-[11px] leading-snug text-[#7A1E2C]">
          {t.error}
        </p>
      ) : null}
    </div>
  );
}
