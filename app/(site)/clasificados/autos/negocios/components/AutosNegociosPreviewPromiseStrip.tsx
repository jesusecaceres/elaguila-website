"use client";

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
  autosPreviewPromiseStripClass,
  autosPreviewPromiseStripItemClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

type PromiseItem = {
  key: string;
  icon: React.ReactNode;
  labelEs: string;
  labelEn: string;
};

const ITEMS: PromiseItem[] = [
  { key: "gallery", icon: <FiCamera className="h-4 w-4 text-[#7A1E2C]" aria-hidden />, labelEs: "Galería de fotos", labelEn: "Photo gallery" },
  { key: "price", icon: <FiMapPin className="h-4 w-4 text-[#7A1E2C]" aria-hidden />, labelEs: "Precio y ubicación", labelEn: "Price & location" },
  { key: "details", icon: <FiGrid className="h-4 w-4 text-[#7A1E2C]" aria-hidden />, labelEs: "Detalles del vehículo", labelEn: "Vehicle details" },
  { key: "hub", icon: <FiUsers className="h-4 w-4 text-[#7A1E2C]" aria-hidden />, labelEs: "Business Hub del concesionario", labelEn: "Dealer Business Hub" },
  { key: "finance", icon: <FiCreditCard className="h-4 w-4 text-[#7A1E2C]" aria-hidden />, labelEs: "Financiamiento si aplica", labelEn: "Financing if applicable" },
  { key: "inventory", icon: <FiClock className="h-4 w-4 text-[#7A1E2C]" aria-hidden />, labelEs: "Vehículos adicionales", labelEn: "Additional vehicles" },
  { key: "id", icon: <FiHash className="h-4 w-4 text-[#7A1E2C]" aria-hidden />, labelEs: "ID Leonix del anuncio", labelEn: "Leonix listing ID" },
];

/** Draft-preview advertiser promise strip — informational only, no fake buyer CTAs. */
export function AutosNegociosPreviewPromiseStrip({ lang }: { lang: AutosClassifiedsLang }) {
  return (
    <section
      className="mt-8 border-t border-[#D6C7AD]/55 bg-[#FAF7F2] py-6"
      aria-label={lang === "es" ? "Qué incluye esta vista previa" : "What this preview includes"}
      data-autos-preview-promise-strip="1"
    >
      <div className={autosPreviewPromiseStripClass}>
        {ITEMS.map((item) => (
          <div key={item.key} className={autosPreviewPromiseStripItemClass}>
            {item.icon}
            <span className="text-[10px] font-semibold leading-tight text-[#1F241C]">
              {lang === "es" ? item.labelEs : item.labelEn}
            </span>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-4 max-w-[1320px] px-4 text-center text-[11px] leading-relaxed text-[#5C5346] lg:px-8">
        {lang === "es"
          ? "Representación visual basada en la experiencia real de Leonix — borrador de vista previa para anunciantes."
          : "Visual representation based on the real Leonix experience — draft preview for advertisers."}
      </p>
    </section>
  );
}
