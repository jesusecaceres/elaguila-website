"use client";

import { CategoryKey } from "../config/categoryConfig";
import ListingCard from "./ListingCard";
import PlaceholderCard from "./PlaceholderCard";
import { ClassifiedItem } from "../../data/classifieds";

export default function ListingsGrid({
  listings,
  category,
  lang,
  sidebarCollapsed,
}: {
  listings: ClassifiedItem[];
  category: CategoryKey;
  lang: "es" | "en";
  sidebarCollapsed?: boolean;
}) {
  // NOTE: category is kept for future per-category rendering rules
  void category;

  // 🔹 NO LISTINGS → show CTA + trust note
if (!listings.length) {
  const heading =
    lang === "es"
      ? "No hay anuncios con estos filtros"
      : "No listings match these filters";

  const body =
    lang === "es"
      ? "Prueba quitar filtros o publica el primero. Protegemos la plataforma con detección anti‑spam y verificaciones."
      : "Try removing filters or post the first one. We protect the platform with anti-spam detection and verification checks.";

  return (
    <div className="mt-8">
      <div className="mb-4 rounded-2xl border border-white/12 bg-white/7 p-4 text-sm text-white">
        <div className="font-semibold text-white">{heading}</div>
        <div className="mt-1 text-white">{body}</div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        <PlaceholderCard />
      </div>
    </div>
  );
}


  // 🔹 REAL LISTINGS → show cards
  // With filters sidebar open, keep 3 columns (spec). If collapsed/full-width, allow 4 on xl.
  return (
    <div
      className={
        "mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 " +
        (sidebarCollapsed ? "xl:grid-cols-4" : "")
      }
    >
      {listings.map((item) => (
        <ListingCard key={item.id} item={item} lang={lang} />
      ))}
    </div>
  );
}
