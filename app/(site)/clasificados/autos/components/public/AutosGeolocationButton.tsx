"use client";

import { useCallback, useEffect, useState } from "react";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import type { AutosPublicBlueprintCopy } from "../../lib/autosPublicBlueprintCopy";

type GeoPayload = {
  city: string;
  zip: string;
};

/**
 * Requests geolocation only on explicit user action (secure contexts only).
 * Uses BigDataCloud client reverse-geocode (no API key) to prefill canonical city + ZIP when possible.
 */
export function AutosGeolocationButton({
  copy,
  onResolved,
  className = "",
}: {
  copy: AutosPublicBlueprintCopy;
  onResolved: (patch: GeoPayload) => void;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "denied" | "insecure">("idle");

  useEffect(() => {
    if (status !== "denied" && status !== "insecure") return;
    const t = window.setTimeout(() => setStatus("idle"), 6000);
    return () => window.clearTimeout(t);
  }, [status]);

  const onClick = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setStatus("denied");
      return;
    }
    if (!window.isSecureContext) {
      setStatus("insecure");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
          const r = await fetch(url);
          const j = (await r.json()) as {
            city?: string;
            locality?: string;
            postcode?: string;
          };
          const rawCity = (j.city || j.locality || "").trim();
          const canon = rawCity ? getCanonicalCityName(rawCity) || rawCity : "";
          const zip = String(j.postcode ?? "")
            .replace(/\D/g, "")
            .slice(0, 5);
          if (canon || zip) {
            onResolved({ city: canon, zip });
            setStatus("idle");
            return;
          }
        } catch {
          /* fall through */
        }
        setStatus("denied");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 },
    );
  }, [onResolved]);

  const label =
    status === "loading"
      ? copy.resultsLocationLoading
      : status === "denied"
        ? copy.resultsLocationDenied
        : status === "insecure"
          ? copy.resultsLocationInsecure
          : copy.resultsUseLocation;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <button
        type="button"
        className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 text-xs font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)] ${className}`}
        onClick={onClick}
        disabled={status === "loading"}
      >
        {label}
      </button>
      {status === "idle" || status === "insecure" ? (
        <p className="max-w-[16rem] text-[10px] leading-snug text-[color:var(--lx-muted)]">
          {status === "insecure" ? copy.resultsLocationInsecure : copy.resultsLocationHint}
        </p>
      ) : null}
    </div>
  );
}
