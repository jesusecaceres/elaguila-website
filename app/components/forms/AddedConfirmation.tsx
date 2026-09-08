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
  const timerRef = useRef<number | null>(null);

  const flash = useCallback(() => {
    setVisible(true);
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setVisible(false), durationMs);
  }, [durationMs]);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return { visible, flash };
}

/**
 * Bilingual "✓ Añadido"-style badge. Not color-only: always pairs a checkmark glyph with real
 * text, and uses `role="status"`/`aria-live="polite"` so screen readers announce it too.
 */
export function AddedConfirmationBadge({
  visible,
  label,
  className = "",
}: {
  visible: boolean;
  label: string;
  className?: string;
}) {
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
