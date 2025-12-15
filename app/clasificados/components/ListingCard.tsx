
'use client';

import { ClassifiedItem } from '../../data/classifieds';

export default function ListingCard({ item }: { item: ClassifiedItem }) {
  return (
    <div className="rounded-xl border border-yellow-400/20 bg-black p-6 hover:bg-[#140d00] transition">
      <h3 className="text-xl font-semibold text-yellow-400 mb-2">
        {item.title}
      </h3>
      <p className="text-white/70 text-sm mb-4">
        {item.description}
      </p>
      <span className="text-xs text-white/50">
        Publicado: {item.createdAt}
      </span>
    </div>
  );
}
