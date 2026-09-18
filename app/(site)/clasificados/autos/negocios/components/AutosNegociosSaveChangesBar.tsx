"use client";

/**
 * Autos Dealer lifecycle closeout (Gate 6/7/8/9, 2026-09-18) — the "Guardar cambios / Save
 * changes" action for an existing (canonical) Dealer parent or child vehicle opened for edit from
 * the dashboard. Route intent (an existing `listingId`) decides this shows instead of the $399
 * checkout checkpoint — lifecycle status (pending_payment vs active) never does. It PATCHes the
 * SAME row via the existing ensurePendingDealerListing()/PATCH-by-id path; no new payment, no new
 * row, no status change.
 */
export function AutosNegociosSaveChangesBar({
  lang,
  busy,
  error,
  saved,
  onSave,
}: {
  lang: "es" | "en";
  busy: boolean;
  error: string | null;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0" role="status" aria-live="polite">
          {error ? (
            <p className="text-sm font-semibold text-red-800">{error}</p>
          ) : saved ? (
            <p className="text-sm font-semibold text-emerald-800">
              {lang === "es" ? "Cambios guardados." : "Changes saved."}
            </p>
          ) : (
            <p className="text-sm text-[color:var(--lx-muted)]">
              {lang === "es" ? "Estás editando un anuncio existente." : "You're editing an existing listing."}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)] disabled:opacity-60"
        >
          {busy ? (lang === "es" ? "Guardando…" : "Saving…") : lang === "es" ? "Guardar cambios" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
