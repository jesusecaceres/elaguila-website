"use client";

import { useCallback, useState } from "react";

type Lang = "es" | "en";

const copy: Record<
  Lang,
  {
    use: string;
    loading: string;
    denied: string;
    unavailable: string;
    failed: string;
  }
> = {
  es: {
    use: "Usar mi ubicación",
    loading: "Ubicando…",
    denied: "Permiso denegado — escribe ciudad o código postal.",
    unavailable: "Ubicación no disponible en este navegador.",
    failed: "No pudimos obtener la zona. Inténtalo de nuevo o escribe la ciudad.",
  },
  en: {
    use: "Use my location",
    loading: "Locating…",
    denied: "Permission denied — type a city or ZIP.",
    unavailable: "Location is not available in this browser.",
    failed: "We couldn’t resolve your area. Try again or type your city.",
  },
};

/**
 * Reverse-geocode via BigDataCloud client API (no key; HTTPS; approximate city/ZIP only).
 * Does not persist coordinates — only fills the city/area text field.
 */
async function reverseGeocodeToLine(lat: number, lon: number, lang: Lang): Promise<string | null> {
  const loc = lang === "en" ? "en" : "es";
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(String(lat))}&longitude=${encodeURIComponent(String(lon))}&localityLanguage=${loc}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = (await res.json()) as {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    postcode?: string;
  };
  const city = j.city || j.locality || "";
  const zip = j.postcode || "";
  const line = [city, zip].filter(Boolean).join(", ").trim();
  return line || null;
}

export function ServiciosUseMyLocationButton({
  lang,
  formId,
  cityInputName = "city",
}: {
  lang: Lang;
  /** Form containing `cityInputName` */
  formId: string;
  cityInputName?: string;
}) {
  const t = copy[lang];
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onClick = useCallback(() => {
    setHint(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setHint(t.unavailable);
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const line = await reverseGeocodeToLine(pos.coords.latitude, pos.coords.longitude, lang);
          const form = document.getElementById(formId);
          const input = form?.querySelector<HTMLInputElement>(`input[name="${cityInputName}"]`);
          if (line && input) {
            input.value = line;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            setHint(null);
          } else {
            setHint(t.failed);
          }
        } catch {
          setHint(t.failed);
        } finally {
          setBusy(false);
        }
      },
      () => {
        setBusy(false);
        setHint(t.denied);
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 },
    );
  }, [cityInputName, formId, lang, t.denied, t.failed, t.unavailable]);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="inline-flex min-h-[40px] w-fit items-center justify-center rounded-full border border-[#1a3352]/18 bg-white px-3.5 text-[12px] font-bold text-[#1a3352] shadow-sm transition hover:bg-[#fafcff] disabled:opacity-60"
      >
        {busy ? t.loading : t.use}
      </button>
      {hint ? <p className="max-w-md text-[11px] leading-snug text-[#64748b]">{hint}</p> : null}
    </div>
  );
}
