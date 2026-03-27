"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { createEmptyEnVentaFreeState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { loadEnVentaPreviewDraft, loadLatestEnVentaPreviewDraft, loadEnVentaPreviewDraftMeta } from "./enVentaPreviewDraft";
import { buildEnVentaPreviewModel } from "./buildEnVentaPreviewModel";
import { EnVentaPreviewGallery } from "./EnVentaPreviewGallery";
import { EnVentaPreviewSellerCard } from "./EnVentaPreviewSellerCard";
import { publishEnVentaFromDraft } from "../publish/enVentaPublishFromDraft";
import { EnVentaPreviewShell } from "./EnVentaPreviewShell";

const PAGE_BG_STYLE: CSSProperties = {
  backgroundColor: "#F3EBDD",
  backgroundImage: `
    radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.2), transparent 55%),
    radial-gradient(ellipse 55% 40% at 100% 30%, rgba(255, 255, 255, 0.45), transparent 52%),
    radial-gradient(ellipse 45% 35% at 0% 75%, rgba(201, 164, 74, 0.1), transparent 50%)
  `,
};

const EMPTY = {
  es: {
    title: "Sin borrador para mostrar",
    body: "Completa tu anuncio en Publicar y vuelve a abrir la vista previa desde allí.",
    edit: "Ir a editar",
  },
  en: {
    title: "No draft to preview",
    body: "Fill in your listing in Publish, then open preview again from there.",
    edit: "Go to editor",
  },
} as const;

const BUYER = {
  es: {
    share: "Compartir",
    save: "Guardar",
    saved: "Guardado",
    report: "Reportar",
    reportHint: "Disponible cuando el anuncio esté publicado.",
    toastShare: "Enlace copiado",
    toastSaveOn: "Marcado en esta vista previa",
    toastSaveOff: "Quitado de esta vista previa",
    contactH: "Contactar al vendedor",
    makeOffer: "Hacer oferta",
    makeOfferHint: "Puedes proponer un precio por correo.",
    locationH: "Ubicación",
    mapArea: "Mapa / zona",
    openMaps: "Abrir en Google Maps",
    distanceH: "Distancia",
    distanceZero: "Ingresa tu ZIP, ciudad o usa tu ubicación actual.",
    distanceSoon: "Calculando…",
    distanceUnknown: "No disponible para esta ubicación.",
    approxMiles: (n: number) => `Aproximadamente ${n} millas`,
    startPointLabel: "Tu punto de partida",
    startPointPlaceholder: "Código postal o ciudad",
    useMyLocation: "Usar mi ubicación",
    locationNotAvailable: "Ubicación no disponible en este dispositivo.",
    locationDenied: "Permiso denegado. Puedes ingresar tu ZIP o ciudad.",
    close: "Cerrar",
  },
  en: {
    share: "Share",
    save: "Save",
    saved: "Saved",
    report: "Report",
    reportHint: "Available once the listing is published.",
    toastShare: "Link copied",
    toastSaveOn: "Saved for this preview",
    toastSaveOff: "Removed from this preview",
    contactH: "Contact the seller",
    makeOffer: "Make an offer",
    makeOfferHint: "You can propose a price by email.",
    locationH: "Location",
    mapArea: "Map / area",
    openMaps: "Open in Google Maps",
    distanceH: "Distance",
    distanceZero: "Enter your ZIP, city, or use your current location.",
    distanceSoon: "Calculating…",
    distanceUnknown: "Not available for this location.",
    approxMiles: (n: number) => `Approximately ${n} miles`,
    startPointLabel: "Your starting point",
    startPointPlaceholder: "ZIP code or city",
    useMyLocation: "Use my location",
    locationNotAvailable: "Location is not available on this device.",
    locationDenied: "Permission denied. You can enter your ZIP or city instead.",
    close: "Close",
  },
} as const;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function roundMiles(miles: number): number {
  if (!Number.isFinite(miles)) return 0;
  return Math.max(1, Math.round(miles));
}

function googleMapsDirHref(origin: string, destination: string): string {
  const o = origin.trim();
  const d = destination.trim();
  if (!o || !d) return "";
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}`;
}

function googleMapsDirHrefFromCoords(origin: { lat: number; lng: number }, destination: string): string {
  if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) return "";
  const d = destination.trim();
  if (!d) return "";
  return googleMapsDirHref(`${origin.lat},${origin.lng}`, d);
}

function chipClass(tone: "success" | "neutral" | "muted") {
  if (tone === "success") {
    return "inline-flex items-center gap-1 rounded-full border border-[#C9B46A]/45 bg-[#FBF7EF] px-2.5 py-1 text-xs font-semibold text-[#3D3428]";
  }
  if (tone === "neutral") {
    return "inline-flex items-center gap-1 rounded-full border border-[#E8DFD0] bg-[#FFFCF7] px-2.5 py-1 text-xs font-semibold text-[#3D3428]/90";
  }
  return "inline-flex items-center gap-1 rounded-full border border-[#E8DFD0]/80 bg-white/80 px-2.5 py-1 text-xs font-semibold text-[#5C5346]/85";
}

function chipIcon(key: string): string {
  if (key === "pickup" || key === "meetup" || key === "local") return "📍";
  if (key === "condition") return "✓";
  return "";
}

function relativeTimeLabel(ts: number, lang: "es" | "en"): string {
  const diffMs = Date.now() - ts;
  if (!Number.isFinite(diffMs) || diffMs < 0) return lang === "es" ? "Hace un momento" : "Just now";
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return lang === "es" ? "Hace un momento" : "Just now";
  if (mins < 60) return lang === "es" ? `Hace ${mins} min` : `${mins} min ago`;
  if (hours < 24) return lang === "es" ? (hours === 1 ? "Hace 1 hora" : `Hace ${hours} horas`) : (hours === 1 ? "1 hour ago" : `${hours} hours ago`);
  return lang === "es" ? (days === 1 ? "Hace 1 día" : `Hace ${days} días`) : (days === 1 ? "1 day ago" : `${days} days ago`);
}

function ContactIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"
        fill="currentColor"
      />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function previewHeartKey(plan: "free" | "pro") {
  return `en-venta-preview-heart-${plan}`;
}

export function EnVentaPreviewPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp?.get("lang") === "en" ? "en" : "es";
  const plan = sp?.get("plan") === "pro" ? "pro" : "free";
  const tEmpty = EMPTY[lang];
  const tBuyer = BUYER[lang];

  const editBackHref =
    plan === "pro"
      ? `/clasificados/publicar/en-venta/pro?lang=${lang}`
      : `/clasificados/publicar/en-venta/free?lang=${lang}`;
  const previewHrefFree = `/clasificados/en-venta/preview?lang=${lang}&plan=free`;
  const previewHrefPro = `/clasificados/en-venta/preview?lang=${lang}&plan=pro`;
  const [draft, setDraft] = useState<EnVentaFreeApplicationState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);
  const [savedLocal, setSavedLocal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [buyerStart, setBuyerStart] = useState("");
  const [buyerGeoStatus, setBuyerGeoStatus] = useState<"idle" | "requesting" | "granted" | "denied" | "unavailable">(
    "idle"
  );
  const [buyerCoords, setBuyerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);
  const [distanceStatus, setDistanceStatus] = useState<"idle" | "computing" | "ready" | "unavailable">("idle");

  useEffect(() => {
    const loaded = loadLatestEnVentaPreviewDraft(plan);
    setDraft(loaded?.draft ?? null);
    setHydrated(true);
  }, [plan]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setSavedLocal(sessionStorage.getItem(previewHeartKey(plan)) === "1");
    } catch {
      setSavedLocal(false);
    }
  }, [plan]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const state = draft ?? createEmptyEnVentaFreeState();
  const hasDraft = draft !== null;

  const vm = useMemo(() => buildEnVentaPreviewModel(state, lang, plan), [state, lang, plan]);
  const draftMeta = useMemo(() => loadEnVentaPreviewDraftMeta(), [plan]);
  const shellStatusLine = useMemo(() => {
    if (draftMeta?.updatedAt) return relativeTimeLabel(draftMeta.updatedAt, lang);
    return vm.shellStatusLine;
  }, [draftMeta?.updatedAt, lang, vm.shellStatusLine]);

  async function onPublish() {
    setPublishErr(null);
    const latest = loadLatestEnVentaPreviewDraft(plan)?.draft ?? loadEnVentaPreviewDraft(plan) ?? draft;
    if (!latest) {
      setPublishErr(lang === "es" ? "No hay borrador." : "No draft.");
      return;
    }
    setPublishing(true);
    try {
      const result = await publishEnVentaFromDraft(latest, lang, plan);
      if (!result.ok) {
        setPublishErr(result.error);
        return;
      }
      router.push(`/clasificados/anuncio/${result.listingId}?lang=${lang}`);
    } finally {
      setPublishing(false);
    }
  }

  const onShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: vm.title, url });
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast(tBuyer.toastShare);
    } catch {
      setToast(lang === "es" ? "No se pudo copiar" : "Could not copy");
    }
  }, [lang, tBuyer.toastShare, vm.title]);

  const onToggleSave = useCallback(() => {
    const next = !savedLocal;
    setSavedLocal(next);
    try {
      sessionStorage.setItem(previewHeartKey(plan), next ? "1" : "0");
    } catch {
      /* ignore */
    }
    setToast(next ? tBuyer.toastSaveOn : tBuyer.toastSaveOff);
  }, [plan, savedLocal, tBuyer.toastSaveOff, tBuyer.toastSaveOn]);

  const listingDistanceKey = useMemo(() => {
    const city = state.city.trim();
    const zip = state.zip.trim();
    // Prefer ZIP if available (works for more inputs), else fall back to city.
    return zip || city;
  }, [state.city, state.zip]);

  const destinationForMaps = useMemo(() => {
    // Prefer explicit city/zip string, fall back to rendered location line.
    const city = state.city.trim();
    const zip = state.zip.trim();
    return [city, zip].filter(Boolean).join(" ") || vm.locationLine || "";
  }, [state.city, state.zip, vm.locationLine]);

  const mapsHref = useMemo(() => {
    if (!destinationForMaps) return vm.locationMapHref ?? null;
    if (buyerCoords) {
      const href = googleMapsDirHrefFromCoords(buyerCoords, destinationForMaps);
      return href || (vm.locationMapHref ?? null);
    }
    if (buyerStart.trim()) {
      const href = googleMapsDirHref(buyerStart, destinationForMaps);
      return href || (vm.locationMapHref ?? null);
    }
    return vm.locationMapHref ?? null;
  }, [buyerCoords, buyerStart, destinationForMaps, vm.locationMapHref]);

  useEffect(() => {
    if (!listingDistanceKey.trim()) {
      setDistanceMiles(null);
      setDistanceStatus("idle");
      return;
    }

    const viewerText = buyerStart.trim();
    const viewerCoords = buyerCoords;
    if (!viewerText && !viewerCoords) {
      setDistanceMiles(null);
      setDistanceStatus("idle");
      return;
    }

    setDistanceStatus("computing");
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      const url = new URL("/api/clasificados/distance", window.location.origin);
      url.searchParams.set("listing", listingDistanceKey);
      if (viewerCoords) {
        url.searchParams.set("viewerLat", String(viewerCoords.lat));
        url.searchParams.set("viewerLng", String(viewerCoords.lng));
      } else {
        url.searchParams.set("viewer", viewerText);
      }

      fetch(url.toString(), { signal: ctrl.signal })
        .then(async (r) => {
          if (!r.ok) throw new Error(`distance_http_${r.status}`);
          const data = (await r.json()) as { miles: number | null };
          const miles = typeof data?.miles === "number" && Number.isFinite(data.miles) ? data.miles : null;
          if (miles === null) {
            setDistanceMiles(null);
            setDistanceStatus("unavailable");
          } else {
            setDistanceMiles(miles);
            setDistanceStatus("ready");
          }
        })
        .catch((e) => {
          if (e?.name === "AbortError") return;
          setDistanceMiles(null);
          setDistanceStatus("unavailable");
        });
    }, 450);

    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [buyerCoords, buyerStart, listingDistanceKey]);

  const shell = (children: ReactNode) => (
    <div className="relative min-h-screen text-[#2C2416]" style={PAGE_BG_STYLE}>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      {children}
    </div>
  );

  if (!hydrated) {
    return shell(
      <main className="relative">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-[#5C5346]/80">
          {lang === "es" ? "Cargando vista previa…" : "Loading preview…"}
        </div>
      </main>
    );
  }

  if (!hasDraft) {
    return shell(
      <main className="relative">
        <div className="mx-auto max-w-lg px-4 pb-16 pt-24">
          <h1 className="text-xl font-bold text-[#1E1810]">{tEmpty.title}</h1>
          <p className="mt-2 text-sm text-[#5C5346]/90">{tEmpty.body}</p>
          <a
            href={editBackHref}
            className="mt-6 inline-flex rounded-2xl bg-[#2A2620] px-5 py-2.5 text-sm font-semibold text-[#FAF7F2] shadow-md transition hover:bg-[#1a1814]"
          >
            {tEmpty.edit}
          </a>
        </div>
      </main>
    );
  }

  const mainTop = (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex flex-wrap items-start gap-2">
          <h1 className="text-[1.65rem] font-bold tracking-tight text-[#1E1810] sm:text-[1.85rem]">{vm.title}</h1>
          {plan === "pro" ? (
            <span className="mt-1 inline-flex rounded-full border border-[#C9B46A]/55 bg-gradient-to-r from-[#FBF7EF] to-[#F3EBDD] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5C4E2E]">
              Pro
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 text-xs font-semibold tracking-wide text-[#7A7164]">{shellStatusLine}</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <p className="text-3xl font-bold tracking-tight text-[#1E1810] sm:text-[2.15rem]">{vm.priceLine}</p>
          {vm.priceDrop ? (
            <span className="rounded-full border border-[#C9B46A]/50 bg-[#FBF7EF] px-2.5 py-1 text-xs font-bold text-[#5C4E2E]">
              {lang === "es" ? "Precio reducido" : "Reduced price"}
            </span>
          ) : null}
        </div>
        {vm.priceDrop ? (
          <p className="mt-1 text-sm text-[#7A7164] line-through">{vm.priceDrop.previousLine}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleSave}
            className={cx(
              "inline-flex min-h-[40px] items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold transition",
              savedLocal
                ? "border-[#C9A84A] bg-[#FBF7EF] text-[#3D3428]"
                : "border-[#E8DFD0] bg-white/90 text-[#3D3428] hover:border-[#D4C4A8]"
            )}
          >
            <span aria-hidden>{savedLocal ? "❤️" : "💛"}</span>
            {savedLocal ? tBuyer.saved : tBuyer.save}
          </button>
          <button
            type="button"
            onClick={() => void onShare()}
            className="inline-flex min-h-[40px] items-center rounded-2xl border border-[#E8DFD0] bg-white/90 px-3 py-2 text-xs font-bold text-[#3D3428] transition hover:border-[#D4C4A8]"
          >
            ↗️ {tBuyer.share}
          </button>
          <button
            type="button"
            disabled
            title={tBuyer.reportHint}
            className="inline-flex min-h-[40px] cursor-not-allowed items-center rounded-2xl border border-[#E8DFD0]/80 bg-white/50 px-3 py-2 text-xs font-bold text-[#7A7164]/70"
          >
            🚩 {tBuyer.report}
          </button>
        </div>
      </div>

      {vm.chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {vm.chips.map((c) => (
            <span key={c.key} className={chipClass(c.tone)}>
              {chipIcon(c.key) ? <span aria-hidden>{chipIcon(c.key)} </span> : null}
              {c.text}
            </span>
          ))}
        </div>
      ) : null}

      {vm.negotiable && vm.offerMailtoHref ? (
        <p className="text-sm text-[#3D3428]/90">
          <a
            href={vm.offerMailtoHref}
            className="font-semibold text-[#6B5B2E] underline decoration-[#C9B46A]/60 underline-offset-2 hover:text-[#1E1810]"
          >
            {tBuyer.makeOffer}
          </a>
          <span className="text-[#5C5346]/85"> — {tBuyer.makeOfferHint}</span>
        </p>
      ) : null}

      {vm.classificationLine ? (
        <p className="text-sm font-medium leading-snug text-[#5C5346]">{vm.classificationLine}</p>
      ) : null}

      {vm.locationLine ? (
        <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/82 p-4 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.1)] sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{tBuyer.locationH}</p>
            <p className="mt-2 flex items-start gap-2 text-sm font-semibold leading-snug text-[#1E1810]">
              <MapPinIcon className="mt-0.5 shrink-0 text-[#8A8070]" />
              <span className="min-w-0 break-words">{vm.locationLine}</span>
            </p>
            <p className="mt-2 max-w-2xl text-xs leading-snug text-[#7A7164]/95">
              {vm.locationApproximateNote}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-[#E8DFD0]/80 bg-white/70 p-3.5 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{tBuyer.distanceH}</p>
              <p className="text-[11px] font-medium text-[#7A7164]/90">{lang === "es" ? "Vista previa" : "Preview"}</p>
            </div>
            <p className="mt-1 text-sm font-semibold leading-snug text-[#1E1810]">
              {distanceStatus === "ready" && distanceMiles !== null
                ? tBuyer.approxMiles(roundMiles(distanceMiles))
                : distanceStatus === "computing"
                  ? tBuyer.distanceSoon
                  : distanceStatus === "unavailable"
                    ? tBuyer.distanceUnknown
                    : tBuyer.distanceZero}
            </p>
            <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2">
              <label className="min-w-0 w-full sm:flex-1 sm:min-w-[12rem]">
                <span className="sr-only">{tBuyer.startPointLabel}</span>
                <input
                  value={buyerStart}
                  onChange={(e) => setBuyerStart(e.target.value)}
                  placeholder={tBuyer.startPointPlaceholder}
                  className="w-full rounded-2xl border border-[#E8DFD0] bg-white/90 px-3 py-2 text-sm font-semibold text-[#1E1810] placeholder:text-[#8A8070] outline-none transition focus:border-[#C9B46A]/70"
                  inputMode="search"
                />
              </label>
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator === "undefined" || !navigator.geolocation) {
                      setBuyerGeoStatus("unavailable");
                      setToast(tBuyer.locationNotAvailable);
                      return;
                    }
                    setBuyerGeoStatus("requesting");
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setBuyerGeoStatus("granted");
                        setBuyerCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        setToast(lang === "es" ? "Ubicación lista." : "Location ready.");
                      },
                      (err) => {
                        if (err?.code === 1) {
                          setBuyerGeoStatus("denied");
                          setToast(tBuyer.locationDenied);
                        } else {
                          setBuyerGeoStatus("unavailable");
                          setToast(tBuyer.locationNotAvailable);
                        }
                      },
                      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
                    );
                  }}
                  className={cx(
                    "inline-flex min-h-[40px] items-center justify-center rounded-2xl border px-3 py-2 text-xs font-bold transition",
                    buyerGeoStatus === "requesting"
                      ? "cursor-wait border-[#E8DFD0]/80 bg-white/60 text-[#7A7164]"
                      : "border-[#E8DFD0] bg-white/90 text-[#3D3428] hover:border-[#D4C4A8]"
                  )}
                >
                  {buyerGeoStatus === "requesting" ? (lang === "es" ? "Solicitando…" : "Requesting…") : `📡 ${tBuyer.useMyLocation}`}
                </button>
                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-[#E8DFD0] bg-white/90 px-3 py-2 text-xs font-bold text-[#3D3428] transition hover:border-[#D4C4A8]"
                >
                  📍 {tBuyer.mapArea}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/80 p-4 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.1)]">
        <h2 className="text-sm font-bold text-[#1E1810]">{tBuyer.contactH}</h2>
        {vm.contactActions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {vm.contactActions.map((a) => (
              <a
                key={a.id}
                href={a.href}
                className={cx(
                  "inline-flex min-h-[44px] items-center justify-center rounded-2xl border px-3 py-2 text-xs font-bold transition",
                  plan === "pro"
                    ? "border-[#C9B46A]/55 bg-white text-[#1E1810] shadow-sm hover:bg-[#FFFCF7]"
                    : "border-[#E8DFD0] bg-white/90 text-[#1E1810] hover:border-[#D4C4A8]"
                )}
              >
                {a.label}
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#7A7164]/90">
            {lang === "es" ? "Añade teléfono, correo o WhatsApp en el formulario de contacto." : "Add phone, email, or WhatsApp in the contact step."}
          </p>
        )}
        {vm.contactActions.length === 0 && vm.primaryCtaHref !== "#" ? (
          <a
            href={vm.primaryCtaHref}
            className={cx(
              "mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-[#FAF7F2] shadow-md transition",
              "bg-[#2A2620] hover:bg-[#1a1814] active:scale-[0.99]"
            )}
          >
            <ContactIcon className="h-5 w-5 shrink-0 text-[#FAF7F2]" />
            {vm.primaryCtaLabel}
          </a>
        ) : null}
        <p className="mt-3 text-center text-[11px] leading-relaxed text-[#7A7164]/95">{vm.trustNote}</p>
      </div>
    </div>
  );

  const descriptionCard = vm.description ? (
    <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/80 p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.1)]">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2C2416]/90">{vm.description}</p>
    </div>
  ) : null;

  const specsCard =
    vm.specRows.length > 0 ? (
      <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 p-5 shadow-inner">
        <dl className="space-y-3">
          {vm.specRows.map((row, idx) => (
            <div
              key={`${row.label}-${idx}`}
              className="grid grid-cols-1 gap-1 border-b border-[#E8DFD0]/60 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,38%)_1fr] sm:gap-4"
            >
              <dt className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{row.label}</dt>
              <dd className="text-sm font-medium text-[#1E1810]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    ) : null;

  const extrasCards = vm.extraParagraphs.length ? (
    <div className="flex flex-col gap-4">
      {vm.extraParagraphs.map((block) => (
        <div key={block.title} className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/70 p-5">
          <h3 className="text-sm font-bold text-[#1E1810]">{block.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#2C2416]/88">{block.body}</p>
        </div>
      ))}
    </div>
  ) : null;

  const deliveryCard = (
    <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/80 p-5">
      <h3 className="text-sm font-bold text-[#1E1810]">{vm.deliveryHeading}</h3>
      {vm.deliveryLines.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-[#2C2416]/88">
          {vm.deliveryLines.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#C9B46A]/80" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[#7A7164]/90">
          {lang === "es" ? "Sin opciones de entrega indicadas." : "No delivery options specified."}
        </p>
      )}
    </div>
  );

  const lowerContent = (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-8">{descriptionCard}</div>
      <div className="lg:col-span-4">{specsCard}</div>
      <div className="lg:col-span-7">{extrasCards}</div>
      <div className="lg:col-span-5">{deliveryCard}</div>
    </div>
  );

  const seller = (
    <EnVentaPreviewSellerCard
      initials={vm.sellerInitials}
      name={vm.sellerName}
      subline={vm.sellerSubline}
      showProBadge={plan === "pro"}
    />
  );

  return shell(
    <>
      {toast ? (
        <div
          className="fixed bottom-24 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 rounded-2xl border border-[#E8DFD0] bg-[#1E1810] px-4 py-2 text-center text-xs font-semibold text-[#FAF7F2] shadow-lg lg:bottom-8"
          role="status"
        >
          {toast}
        </div>
      ) : null}

      <EnVentaPreviewShell
        lang={lang}
        plan={plan}
        previewTitle={vm.shellPlanLabel}
        editBackHref={editBackHref}
        previewHrefFree={previewHrefFree}
        previewHrefPro={previewHrefPro}
        publishing={publishing}
        publishErr={publishErr}
        onPublish={onPublish}
      >
        <main className="relative pb-8 text-[#2C2416] lg:pb-12">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
            <div className="rounded-[2rem] border border-[#E8DFD0]/90 bg-[#FFFDF7]/80 p-4 shadow-[0_18px_48px_rgba(42,36,22,0.12),inset_0_1px_0_rgba(255,255,255,0.85)] sm:p-6 lg:p-7">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-6">
              <div className="order-1 lg:col-span-5 lg:row-start-1">
                <div className="space-y-4">
                  <EnVentaPreviewGallery
                    orderedImages={vm.gallery.orderedImages}
                    videoUrl={vm.gallery.videoUrl}
                    showVideo={vm.gallery.showVideo}
                    photoCountLabel={vm.gallery.photoCountLabel}
                    lang={lang}
                    plan={plan}
                  />
                  <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/80 p-4 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.1)]">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">
                        {lang === "es" ? "Analíticas" : "Analytics"}
                      </p>
                      <p className="text-[11px] font-medium text-[#7A7164]/90">
                        {lang === "es" ? "Vista previa" : "Preview"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { k: "views", icon: "👁️", label: lang === "es" ? "Vistas" : "Views" },
                        { k: "shares", icon: "📤", label: lang === "es" ? "Compartidos" : "Shares" },
                        { k: "saves", icon: "💛", label: lang === "es" ? "Guardados" : "Saves" },
                        { k: "contacts", icon: "💬", label: lang === "es" ? "Contactos" : "Contacts" },
                      ].map((m) => (
                        <div key={m.k} className="rounded-2xl border border-[#E8DFD0]/90 bg-white/70 px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
                            {m.icon} {m.label}
                          </p>
                          <p className="mt-0.5 text-lg font-extrabold tracking-tight text-[#1E1810]">—</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-2 lg:col-span-4 lg:col-start-6 lg:row-start-1">{mainTop}</div>

              <div className="order-3 lg:col-span-3 lg:col-start-10 lg:row-span-2 lg:row-start-1">
                <div className="flex flex-col gap-4 lg:sticky lg:top-[calc(9rem+1px)]">{seller}</div>
              </div>

              <div className="order-4 lg:col-span-9 lg:row-start-2">{lowerContent}</div>
            </div>
            </div>
          </div>
        </main>
      </EnVentaPreviewShell>

      {mapOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
            onClick={() => setMapOpen(false)}
            aria-label={tBuyer.close}
          />
          <div className="relative w-full max-w-lg rounded-[1.75rem] border border-[#E8DFD0]/90 bg-[#FFFCF7] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1E1810]">{tBuyer.mapArea}</p>
                {vm.locationLine ? (
                  <p className="mt-1 text-xs font-medium text-[#7A7164]">
                    {lang === "es" ? "Zona aproximada:" : "Approximate area:"} <span className="text-[#3D3428]">{vm.locationLine}</span>
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="inline-flex min-h-[36px] items-center rounded-2xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-bold text-[#3D3428]"
              >
                {tBuyer.close}
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#E8DFD0]/80 bg-white/70 p-4">
              <p className="text-xs leading-relaxed text-[#7A7164]/95">{vm.locationApproximateNote}</p>
              <p className="mt-3 text-sm font-semibold text-[#1E1810]">
                {tBuyer.distanceH}:{" "}
                {distanceStatus === "ready" && distanceMiles !== null
                  ? tBuyer.approxMiles(roundMiles(distanceMiles))
                  : distanceStatus === "computing"
                    ? tBuyer.distanceSoon
                    : distanceStatus === "unavailable"
                      ? tBuyer.distanceUnknown
                      : tBuyer.distanceZero}
              </p>
            </div>

            {mapsHref ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full min-h-[44px] items-center justify-center rounded-2xl bg-[#2A2620] px-4 py-3 text-sm font-bold text-[#FAF7F2] shadow-md transition hover:bg-[#1a1814]"
              >
                ↗️ {tBuyer.openMaps}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
