"use client";

import { useState } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

const COPY: Record<
  Lang,
  { button: string; help: string; denied: string; success: string }
> = {
  es: {
    button: "Usar mi ubicación",
    help: "Solo al hacer clic pedimos acceso a tu ubicación aproximada. No reemplaza la ciudad que escribas en el filtro.",
    denied: "No pudimos leer tu ubicación. Puedes seguir buscando por ciudad o código postal.",
    success:
      "Ubicación obtenida (aprox.). Ajusta ciudad o código postal si quieres acotar — no cambiamos tus filtros solos.",
  },
  en: {
    button: "Use my location",
    help: "We only request approximate location after you tap. It does not override the city you typed.",
    denied: "We couldn’t read your location. Keep searching by city or ZIP.",
    success:
      "Location captured (approx.). Refine city or ZIP if needed — we didn’t change your filters automatically.",
  },
};

/**
 * Explicit geolocation only (no request on load). Does not patch URL — avoids overriding manual city.
 */
export function BienesRaicesUseLocationButton({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const [msg, setMsg] = useState<"idle" | "denied" | "success">("idle");

  const onClick = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setMsg("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setMsg("success"),
      () => setMsg("denied"),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 }
    );
  };

  return (
    <div className="mt-2 space-y-2">
      <p className="text-[11px] leading-snug text-[#5C5346]/80">{t.help}</p>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#C9B46A]/45 bg-white px-4 py-2 text-xs font-bold text-[#3D3630] shadow-sm transition hover:border-[#B8954A]/70"
      >
        {t.button}
      </button>
      {msg === "denied" ? (
        <p className="text-xs text-[#8B4513]" role="status">
          {t.denied}
        </p>
      ) : null}
      {msg === "success" ? (
        <p className="text-xs text-[#4A7C59]" role="status">
          {t.success}
        </p>
      ) : null}
    </div>
  );
}
