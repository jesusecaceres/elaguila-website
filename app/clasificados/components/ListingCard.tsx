"use client";

import { ClassifiedItem } from "../../data/classifieds";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ListingCard({ item }: { item: ClassifiedItem }) {
  return (
    <div
      className={cx(
        "rounded-2xl border",
        "border-white/10 bg-white/5",
        "p-4 sm:p-5",
        "shadow-sm transition",
        "hover:-translate-y-[1px] hover:bg-white/7"
      )}
    >
      <h3 className="mb-1 text-base sm:text-lg font-semibold text-gray-100 leading-snug">
        {item.title}
      </h3>
      <p className="mb-2 text-sm text-gray-300 line-clamp-2">{item.description}</p>
      <span className="text-[11px] sm:text-xs text-gray-400">{`Publicado: ${item.createdAt}`}</span>
    </div>
  );
}
