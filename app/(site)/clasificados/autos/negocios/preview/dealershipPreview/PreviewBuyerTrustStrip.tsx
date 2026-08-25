"use client";

import { FiInfo, FiLifeBuoy, FiShield, FiUsers } from "react-icons/fi";
import {
  autosPreviewBuyerTrustStripClass,
  autosPreviewPremiumCardClass,
} from "./previewPremiumTokens";

/**
 * Honest buyer trust strip — operational Leonix promises only.
 * No unverifiable “verified inventory”, warranty, or certification claims.
 */
export function PreviewBuyerTrustStrip({ lang }: { lang: "es" | "en" }) {
  const items =
    lang === "es"
      ? [
          {
            key: "transparent",
            icon: <FiInfo className="h-5 w-5 text-[#7A1E2C]" aria-hidden />,
            title: "Información transparente",
            body: "Datos reales del anuncio para que tomes una decisión clara.",
          },
          {
            key: "dealers",
            icon: <FiUsers className="h-5 w-5 text-[#7A1E2C]" aria-hidden />,
            title: "Negocios confiables",
            body: "Conectamos compradores con concesionarios en Leonix.",
          },
          {
            key: "clear",
            icon: <FiShield className="h-5 w-5 text-[#7A1E2C]" aria-hidden />,
            title: "Datos claros para decidir",
            body: "Precio, millaje y contacto del dealer cuando el anunciante los proporciona.",
          },
          {
            key: "support",
            icon: <FiLifeBuoy className="h-5 w-5 text-[#7A1E2C]" aria-hidden />,
            title: "Soporte de confianza",
            body: "Estamos aquí para ayudarte en cada paso de tu búsqueda.",
          },
        ]
      : [
          {
            key: "transparent",
            icon: <FiInfo className="h-5 w-5 text-[#7A1E2C]" aria-hidden />,
            title: "Transparent information",
            body: "Real listing data so you can decide with clarity.",
          },
          {
            key: "dealers",
            icon: <FiUsers className="h-5 w-5 text-[#7A1E2C]" aria-hidden />,
            title: "Trusted businesses",
            body: "We connect buyers with dealerships on Leonix.",
          },
          {
            key: "clear",
            icon: <FiShield className="h-5 w-5 text-[#7A1E2C]" aria-hidden />,
            title: "Clear data to decide",
            body: "Price, mileage, and dealer contact when the advertiser provides them.",
          },
          {
            key: "support",
            icon: <FiLifeBuoy className="h-5 w-5 text-[#7A1E2C]" aria-hidden />,
            title: "Trusted support",
            body: "We’re here to help at each step of your search.",
          },
        ];

  return (
    <section
      className={`${autosPreviewPremiumCardClass} p-4 sm:p-5`}
      data-autos-buyer-trust-strip="1"
      aria-label={lang === "es" ? "Compromisos Leonix" : "Leonix promises"}
    >
      <ul className={autosPreviewBuyerTrustStripClass}>
        {items.map((item) => (
          <li key={item.key} className="flex gap-3 rounded-[12px] border border-[#D6C7AD]/55 bg-[#FFFCF7] px-3 py-3">
            <span className="mt-0.5 shrink-0">{item.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#1F241C]">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#5C5346]">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
