'use client';

import { ClassifiedItem } from '../../data/classifieds';

export default function ListingCard({ item }: { item: ClassifiedItem }) {
  return (
    <div className="rounded-2xl border border-yellow-600/20 bg-black/30 p-5 shadow-sm transition hover:-translate-y-[1px] hover:bg-black/35">
      <h3 className="mb-1.5 text-lg font-semibold text-yellow-100">
        {item.title}
      </h3>
      <p className="mb-4 text-sm text-gray-300">
        {item.description}
      </p>
      <span className="text-xs text-gray-400">
        {`Publicado: ${item.createdAt}`}
      </span>
    </div>
  );
}
