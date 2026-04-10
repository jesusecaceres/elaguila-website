"use client";

import { useCallback, useState } from "react";
import { FaLocationArrow } from "react-icons/fa";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { reverseGeocodeLatLng } from "../lib/empleosReverseGeocode";

type Props = {
  lang: Lang;
  onFilled: (p: { city: string; state: string; zip: string }) => void;
  className?: string;
};

export function EmpleosUseLocationButton({ lang, onFilled, className }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = useCallback(() => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError(lang === "es" ? "Tu navegador no permite ubicación." : "Location is not available in this browser.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const fill = await reverseGeocodeLatLng(pos.coords.latitude, pos.coords.longitude);
          if (fill) {
            onFilled(fill);
            setError(null);
          } else {
            setError(lang === "es" ? "No pudimos leer ciudad desde el mapa." : "Could not resolve city from coordinates.");
          }
        } catch {
          setError(lang === "es" ? "Error al consultar ubicación." : "Location lookup failed.");
        } finally {
          setBusy(false);
        }
      },
      () => {
        setBusy(false);
        setError(lang === "es" ? "Permiso denegado o ubicación no disponible." : "Permission denied or location unavailable.");
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 },
    );
  }, [lang, onFilled]);

  const label =
    lang === "es" ? "Usar mi ubicación (aprox.)" : "Use my location (approx.)";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#D9A23A]/50 bg-[#FFF8EC] px-3 text-sm font-semibold text-[#5C4A32] shadow-sm transition hover:bg-[#FFF0DA] disabled:opacity-60 sm:w-auto"
      >
        <FaLocationArrow className="h-4 w-4 shrink-0 text-[#B8892C]" aria-hidden />
        {busy ? (lang === "es" ? "Ubicando…" : "Locating…") : label}
      </button>
      {error ? <p className="mt-1.5 text-xs text-[#8B4513]">{error}</p> : null}
      <p className="mt-1 text-[11px] leading-relaxed text-[#7A756E]">
        {lang === "es"
          ? "Solo al hacer clic pedimos permiso. Aproximamos ciudad y CP; no vendemos tu ubicación."
          : "We only ask permission when you tap. We approximate city and ZIP; we do not sell your location."}
      </p>
    </div>
  );
}
