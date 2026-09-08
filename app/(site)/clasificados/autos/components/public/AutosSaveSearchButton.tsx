"use client";

/**
 * Saved Search 03 — Autos results "Guardar búsqueda / Save search" CTA.
 *
 * The current CANONICAL filter state (`applied.filters`/`applied.q` from the results shell — the
 * committed, URL-reflected state, never the in-progress draft) is routed through the Saved
 * Search 02 adapter (`autosFilterStateToSavedSearch`) — this component never builds
 * `filter_payload` itself. Truthful saved-state is read from the server list (fingerprint
 * comparison using the exact same deterministic function the server uses), not decided
 * client-side. No notification/alert promise anywhere in this copy.
 */
import { useEffect, useMemo, useState } from "react";
import { autosFilterStateToSavedSearch } from "@/app/lib/saved-search/autos/savedSearchAutosAdapter";
import { buildSavedSearchFingerprintBrowser } from "@/app/lib/saved-search/savedSearchFingerprintBrowser";
import { hasSavedSearchSession, listSavedSearchesClient, saveSavedSearchClient } from "@/app/lib/saved-search/savedSearchClient";
import type { AutosPublicFilterState } from "@/app/clasificados/autos/filters/autosPublicFilterTypes";

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

export function AutosSaveSearchButton({
  filters,
  searchQ,
  lang,
}: {
  filters: AutosPublicFilterState;
  searchQ: string;
  lang: "es" | "en";
}) {
  const t = COPY[lang];
  const [state, setState] = useState<SaveState>("checking");

  // Recomputed only when the actual normalized criteria change (via its stable stringified
  // form) — filters/searchQ are new object/string references on every parent render otherwise.
  const normalized = useMemo(() => autosFilterStateToSavedSearch(filters, searchQ), [filters, searchQ]);
  const normalizedKey = JSON.stringify(normalized);

  // Truthful saved-state check — server-authoritative. A background probe failure (signed out,
  // network) just leaves the button in its normal clickable "save" state; it never fabricates a
  // saved/error state from a check the user didn't initiate. Fingerprint is computed client-side
  // via Web Crypto (`savedSearchFingerprintBrowser.ts`) — Node's `crypto` cannot run in the
  // browser — but hashes the exact same canonical input the server hashes, so the comparison
  // against `row.fingerprint` below is genuinely apples-to-apples.
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
        listSavedSearchesClient({ category: "autos" }),
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
