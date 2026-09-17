"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared "value accepted" confirmation primitive (owner UX doctrine: an explicit Add/Accept flow
 * must show INPUT -> ACCEPTED -> PERSISTED, not just silently drop the typed value into a chip
 * list). `flash()` is called only on a genuinely successful add (never for blank/whitespace/
 * duplicate/invalid/failed cases) and shows the badge for `durationMs`, then hides it — the
 * persisted chip/row itself remains the permanent record, this is only the momentary
 * confirmation that Leonix actually took the value.
 */
export function useAddedConfirmation(durationMs = 2200) {
  const [visible, setVisible] = useState(false);
  const [rejectedMessage, setRejectedMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const flash = useCallback(() => {
    setRejectedMessage(null);
    setVisible(true);
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisible(false), durationMs);
  }, [durationMs]);

  /**
   * Servicios Owner QA (⚠️6 / ⚠️68) — the truthful opposite of `flash()`: the value was NOT taken
   * (duplicate / at the limit / invalid). Never shows the success badge; the caller keeps the typed
   * text so the owner can correct it. Cleared by the next successful `flash()` or `clearRejection()`.
   */
  const reject = useCallback((message: string) => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    setVisible(false);
    setRejectedMessage(message);
  }, []);
  const clearRejection = useCallback(() => setRejectedMessage(null), []);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return { visible, flash, rejectedMessage, reject, clearRejection };
}

/**
 * Bilingual "✓ Añadido"-style badge. Not color-only: always pairs a checkmark glyph with real
 * text, and uses `role="status"`/`aria-live="polite"` so screen readers announce it too.
 */
export function AddedConfirmationBadge({
  visible,
  label,
  className = "",
  rejectedMessage = null,
}: {
  visible: boolean;
  label: string;
  className?: string;
  /** When set (and not `visible`), shows why the value was not added — never styled as success. */
  rejectedMessage?: string | null;
}) {
  if (!visible && rejectedMessage) {
    return (
      <span
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ${className}`}
        data-added-confirmation="rejected"
      >
        {rejectedMessage}
      </span>
    );
  }
  if (!visible) return null;
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ${className}`}
    >
      <span aria-hidden="true">✓</span>
      {label}
    </span>
  );
}
