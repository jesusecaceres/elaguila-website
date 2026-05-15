"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import CityAutocomplete from "@/app/components/CityAutocomplete";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const RAIL_CARD =
  "rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]";

const COPY = {
  es: {
    actionsTitle: "Acciones",
    share: "Compartir",
    copyLink: "Copiar enlace",
    copyInfo: "Copiar info",
    organizedBy: "Organizado por",
    location: "Ubicación",
    listingCity: "Ciudad del anuncio:",
    distanceLabel: "Calcula la distancia desde tu ciudad",
    distancePlaceholder: "Ingresa tu ciudad",
    viewContact: "Ver contacto",
    manageListing: "Gestionar anuncio",
    previewNote:
      "Vista previa: las acciones de guardar y reportar estarán disponibles cuando publiques el anuncio.",
    views: "personas vieron este anuncio",
    viewsToday: "visitas hoy",
  },
  en: {
    actionsTitle: "Actions",
    share: "Share",
    copyLink: "Copy link",
    copyInfo: "Copy info",
    organizedBy: "Organized by",
    location: "Location",
    listingCity: "Listing city:",
    distanceLabel: "Calculate distance from your city",
    distancePlaceholder: "Enter your city",
    viewContact: "View contact",
    manageListing: "Manage listing",
    previewNote: "Preview: save and report actions will be available after you publish.",
    views: "people viewed this listing",
    viewsToday: "views today",
  },
} as const;

type Props = {
  lang: Lang;
  mode: "preview" | "published";
  organizerName: string;
  city: string;
  listingId?: string;
  isOwner?: boolean;
  saved?: boolean;
  onSave?: () => void;
  onShare?: () => void;
  onCopyLink?: () => void;
  onCopyInfo?: () => void;
};

export function CommunityQuickPublicDetailSidebar({
  lang,
  mode,
  organizerName,
  city,
  listingId,
  isOwner = false,
  saved = false,
  onSave,
  onShare,
  onCopyLink,
  onCopyInfo,
}: Props) {
  const t = COPY[lang];
  const isPreview = mode === "preview";

  const [viewCount, setViewCount] = useState<number | null>(null);
  const [viewsToday, setViewsToday] = useState<number | null>(null);
  const [viewerCityInput, setViewerCityInput] = useState("");
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);

  useEffect(() => {
    if (isPreview || !listingId) return;
    fetch(`/api/clasificados/listings/${encodeURIComponent(listingId)}/views`)
      .then((res) => res.json())
      .then((data: { count?: number; todayCount?: number }) => {
        setViewCount(typeof data.count === "number" ? data.count : 0);
        setViewsToday(typeof data.todayCount === "number" ? data.todayCount : 0);
      })
      .catch(() => {
        setViewCount(0);
        setViewsToday(0);
      });
  }, [isPreview, listingId]);

  useEffect(() => {
    if (!viewerCityInput.trim() || !city) {
      setDistanceMiles(null);
      return;
    }
    fetch(
      `/api/clasificados/distance?viewer=${encodeURIComponent(viewerCityInput.trim())}&listing=${encodeURIComponent(city)}`,
    )
      .then((r) => r.json())
      .then((data: { miles?: number | null }) => setDistanceMiles(data.miles ?? null))
      .catch(() => setDistanceMiles(null));
  }, [viewerCityInput, city]);

  const scrollToContact = () => {
    document.getElementById("contact-actions")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {!isPreview && viewCount !== null ? (
        <div className={cx(RAIL_CARD, "p-4 space-y-1")}>
          <p className="text-sm text-[#111111]">
            👁 {viewCount} {t.views}
          </p>
          {viewsToday !== null && viewsToday >= 0 ? (
            <p className="text-sm text-[#111111]">
              🔥 {viewsToday} {t.viewsToday}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={cx(RAIL_CARD, "p-6")}>
        <div className="text-xl font-bold text-[#111111]">{t.actionsTitle}</div>

        <div className="mt-4 space-y-3">
          {!isPreview && onSave ? (
            <button
              type="button"
              onClick={onSave}
              className="w-full px-5 py-3 rounded-full font-semibold transition border border-black/10 bg-[#D9D9D9]/40 text-[#111111] hover:bg-[#D9D9D9]/55"
            >
              {saved ? (lang === "es" ? "★ Guardado" : "★ Saved") : lang === "es" ? "☆ Guardar" : "☆ Save"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onShare}
            className="w-full px-5 py-3 rounded-full font-semibold transition border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]/40 text-[#111111] hover:bg-[#D9D9D9]/55"
          >
            {t.share}
          </button>

          <button
            type="button"
            onClick={onCopyLink}
            className="w-full px-5 py-3 rounded-full font-semibold transition border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]/40 text-[#111111] hover:bg-[#D9D9D9]/55"
          >
            {t.copyLink}
          </button>

          <button
            type="button"
            onClick={onCopyInfo}
            className="w-full px-5 py-3 rounded-full font-semibold transition border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)]/40 text-[#111111] hover:bg-[#D9D9D9]/55"
          >
            {t.copyInfo}
          </button>

          {!isPreview && isOwner ? (
            <Link
              href={`/dashboard/mis-anuncios?lang=${lang}`}
              className="flex w-full items-center justify-center rounded-full border border-[#A98C2A]/55 bg-[#FFFCF7] px-5 py-3 text-center text-sm font-semibold text-[#2A2626] transition hover:bg-[#F4EBD8]"
            >
              {t.manageListing}
            </Link>
          ) : null}

          {isPreview ? <p className="text-xs text-[#111111]/75 pt-1">{t.previewNote}</p> : null}
        </div>
      </div>

      <div className={cx("seller-card", RAIL_CARD, "p-6")}>
        <h4 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">{t.organizedBy}</h4>
        <p className="text-base font-bold text-[#111111]">{organizerName.trim() || "—"}</p>
        <div className="mt-3">
          <button
            type="button"
            className="px-4 py-2 rounded-xl font-semibold bg-[#C9B46A] text-[#111111] hover:opacity-90 transition"
            onClick={scrollToContact}
          >
            {t.viewContact}
          </button>
        </div>
      </div>

      <div className={cx(RAIL_CARD, "p-6")}>
        <h3 className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">{t.location}</h3>
        <p className="text-sm text-[#111111] mb-2">
          {t.listingCity} {city || "—"}
        </p>
        <label className="block text-sm text-[#111111]/80 mb-1">{t.distanceLabel}</label>
        <CityAutocomplete
          value={viewerCityInput}
          onChange={setViewerCityInput}
          placeholder={t.distancePlaceholder}
          lang={lang}
          variant="light"
          className="mt-1"
        />
        {distanceMiles !== null ? (
          <p className="mt-2 text-sm text-[#111111]/80">
            {lang === "es"
              ? `Aproximadamente ${Math.round(distanceMiles)} millas de distancia`
              : `Approximately ${Math.round(distanceMiles)} miles away`}
          </p>
        ) : null}
      </div>
    </>
  );
}
