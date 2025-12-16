"use client";

import PlaceholderCard from "./PlaceholderCard";
import { CategoryKey } from "../config/categoryConfig";

type Listing = {
  id: string;
  title: string;
  description: string;
  image?: string;
  featured?: boolean;
};

export default function ListingsGrid({
  listings,
  category,
  lang,
}: {
  listings: Listing[];
  category: CategoryKey;
  lang: "es" | "en";
}) {
  if (!listings.length) {
    return (
      <p className="mt-12 text-center text-white/60">
        {lang === "es"
          ? "No hay anuncios en esta categoría todavía."
          : "No listings in this category yet."}
      </p>
    );
  }

  return (
    <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((item) => (
        <PlaceholderCard key={item.id} item={item} />
      ))}
    </div>
  );
}