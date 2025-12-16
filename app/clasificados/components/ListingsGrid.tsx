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
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <PlaceholderCard />
      </div>
    );
  }

  // 🔹 REAL LISTINGS → show cards
  return (
    <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((item) => (
        <ListingCard key={item.id} item={item} />
      ))}
    </div>
  );
}
