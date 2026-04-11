"use client";

import { useEffect, useState } from "react";

/**
 * Opens the Leonix cookie preferences layer without clearing existing consent.
 * Dispatches a global event consumed by `LeonixCookieConsent`.
 */
export function CookiePreferencesTrigger({
  className = "text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold)] underline-offset-4 hover:text-[color:var(--lx-gold)] transition",
  labelEs = "Preferencias de cookies",
  labelEn = "Cookie preferences",
}: {
  className?: string;
  labelEs?: string;
  labelEn?: string;
}) {
  const [label, setLabel] = useState(labelEs);

  useEffect(() => {
    setLabel(window.location.pathname.startsWith("/en") ? labelEn : labelEs);
  }, [labelEs, labelEn]);

  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new CustomEvent("leonix-consent-preferences"))}>
      {label}
    </button>
  );
}
