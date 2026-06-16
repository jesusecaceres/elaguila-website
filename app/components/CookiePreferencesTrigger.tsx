"use client";

import { useEffect, useState } from "react";

/**
 * Opens the Leonix cookie preferences layer without clearing existing consent.
 * Dispatches a global event consumed by `LeonixCookieConsent`.
 */
export function CookiePreferencesTrigger({
  className = "text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold)] underline-offset-4 hover:text-[color:var(--lx-gold)] transition",
  label,
  labelEs = "Preferencias de cookies",
  labelEn = "Cookie preferences",
}: {
  className?: string;
  /** When set, used directly instead of pathname-based es/en toggle. */
  label?: string;
  labelEs?: string;
  labelEn?: string;
}) {
  const [resolvedLabel, setResolvedLabel] = useState(label ?? labelEs);

  useEffect(() => {
    if (label) {
      setResolvedLabel(label);
      return;
    }
    setResolvedLabel(window.location.pathname.startsWith("/en") ? labelEn : labelEs);
  }, [label, labelEs, labelEn]);

  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new CustomEvent("leonix-consent-preferences"))}>
      {resolvedLabel}
    </button>
  );
}
