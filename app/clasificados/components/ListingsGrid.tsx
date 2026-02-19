"use client";

import { CategoryKey } from "../config/categoryConfig";
import ListingCard from "./ListingCard";
import PlaceholderCard from "./PlaceholderCard";
import { ClassifiedItem } from "../../data/classifieds";

export default function ListingsGrid({
  listings,
  category,
  lang,
}: {
  listings: ClassifiedItem[];
  category: CategoryKey;
  lang: "es" | "en";
}) {
  // 🔹 NO LISTINGS → show placeholder CTA
  if (!listings.length) {
    return (
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        <PlaceholderCard />
      </div>
    );
  }

  // 🔹 REAL LISTINGS → show cards
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {listings.map((item) => (
        <ListingCard key={item.id} item={item} />
      ))}
    </div>
  );
}
