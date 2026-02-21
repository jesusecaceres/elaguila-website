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

  // 🔹 NO LISTINGS → show placeholder CTA
  if (!listings.length) {
    return (
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        <PlaceholderCard />
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
