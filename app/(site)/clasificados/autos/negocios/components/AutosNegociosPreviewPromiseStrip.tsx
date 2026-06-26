"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCamera,
  FiClock,
  FiCreditCard,
  FiGrid,
  FiHash,
  FiMapPin,
  FiUsers,
} from "react-icons/fi";
import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  AUTOS_PREVIEW_SECTION_IDS,
  autosPreviewPromiseStripClass,
  autosPreviewPromiseStripItemClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

type PromiseItem = {
  key: string;
  sectionId: string;
  fallbackIds?: string[];
  icon: React.ReactNode;
  labelEs: string;
  labelEn: string;
};

const ITEMS: PromiseItem[] = [
  { key: "gallery", sectionId: AUTOS_PREVIEW_SECTION_IDS.gallery, icon: <FiCamera className="h-4 w-4 text-[#7A1E2C]" aria-hidden />, labelEs: "Galería de fotos", labelEn: "Photo gallery" },
  { key: "price", sectionId: AUTOS_PREVIEW_SECTION_IDS.hero, icon: <FiMapPin className="h-4 w-4 text-[#7A1E2C]" aria-hidden />, labelEs: "Precio y ubicación", labelEn: "Price & location" },
  {
    key: "details",
    sectionId: AUTOS_PREVIEW_SECTION_IDS.specs,
    fallbackIds: [AUTOS_PREVIEW_SECTION_IDS.highlights, AUTOS_PREVIEW_SECTION_IDS.description],
    icon: <FiGrid className="h-4 w-4 text-[#7A1E2C]" aria-hidden />,
    labelEs: "Detalles del vehículo",
    labelEn: "Vehicle details",
  },
  { key: "hub", sectionId: AUTOS_PREVIEW_SECTION_IDS.businessHub, icon: <FiUsers className="h-4 w-4 text-[#7A1E2C]" aria-hidden />, labelEs: "Business Hub del concesionario", labelEn: "Dealer Business Hub" },
  { key: "finance", sectionId: AUTOS_PREVIEW_SECTION_IDS.financing, icon: <FiCreditCard className="h-4 w-4 text-[#7A1E2C]" aria-hidden />, labelEs: "Financiamiento si aplica", labelEn: "Financing if applicable" },
  { key: "inventory", sectionId: AUTOS_PREVIEW_SECTION_IDS.relatedInventory, icon: <FiClock className="h-4 w-4 text-[#7A1E2C]" aria-hidden />, labelEs: "Vehículos adicionales", labelEn: "Additional vehicles" },
  { key: "id", sectionId: AUTOS_PREVIEW_SECTION_IDS.resultsCard, icon: <FiHash className="h-4 w-4 text-[#7A1E2C]" aria-hidden />, labelEs: "ID Leonix del anuncio", labelEn: "Leonix listing ID" },
];

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Draft-preview advertiser promise strip — anchor-scroll to preview sections when present. */
export function AutosNegociosPreviewPromiseStrip({ lang }: { lang: AutosClassifiedsLang }) {
  const [resolvedTargets, setResolvedTargets] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const resolveId = (item: PromiseItem): string | null => {
      const candidates = [item.sectionId, ...(item.fallbackIds ?? [])];
      for (const id of candidates) {
        if (document.getElementById(id)) return id;
      }
      return null;
    };
    const map = new Map<string, string>();
    for (const item of ITEMS) {
      const resolved = resolveId(item);
      if (resolved) map.set(item.key, resolved);
    }
    setResolvedTargets(map);
  }, []);

  const visibleItems = useMemo(
    () => ITEMS.filter((item) => resolvedTargets.has(item.key)),
    [resolvedTargets],
  );

  const onJump = useCallback((sectionId: string) => {
    scrollToSection(sectionId);
  }, []);

  if (visibleItems.length === 0) return null;

  return (
    <section
      className="mt-8 border-t border-[#D6C7AD]/55 bg-[#FAF7F2] py-6"
      aria-label={lang === "es" ? "Ir a sección de la vista previa" : "Jump to preview section"}
      data-autos-preview-promise-strip="1"
    >
      <div className={autosPreviewPromiseStripClass}>
        {visibleItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={autosPreviewPromiseStripItemClass}
            onClick={() => onJump(resolvedTargets.get(item.key)!)}
          >
            {item.icon}
            <span className="text-[10px] font-semibold leading-tight text-[#1F241C]">
              {lang === "es" ? item.labelEs : item.labelEn}
            </span>
          </button>
        ))}
      </div>
      <p className="mx-auto mt-4 max-w-[1320px] px-4 text-center text-[11px] leading-relaxed text-[#5C5346] lg:px-8">
        {lang === "es"
          ? "Toca una tarjeta para ir a esa sección de la vista previa del anuncio."
          : "Tap a card to jump to that section of the listing preview."}
      </p>
    </section>
  );
}
