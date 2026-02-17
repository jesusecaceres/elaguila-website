'use client';

import { ClassifiedItem } from '../../data/classifieds';

export default function ListingCard({ item }: { item: ClassifiedItem }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition">
      <h3 className="text-lg font-semibold text-slate-900 mb-1.5">
        {item.title}
      </h3>
      <p className="text-slate-600 text-sm mb-4">
        {item.description}
      </p>
      <span className="text-xs text-slate-500">
        Publicado: {item.createdAt}
      </span>
    </div>
  );
}
