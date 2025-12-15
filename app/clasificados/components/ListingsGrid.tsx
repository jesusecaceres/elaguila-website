
'use client';

import ListingCard from './ListingCard';
import { classifieds, ClassifiedItem } from '../../data/classifieds';

export default function ListingsGrid({ category }: { category: string }) {
  const items = classifieds.filter(item => item.category === category);

  if (!items.length) {
    return (
      <div className="text-center py-32 text-white/70">
        No hay anuncios en esta categoría todavía.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {items.map((item: ClassifiedItem) => (
        <ListingCard key={item.id} item={item} />
      ))}
    </div>
  );
}
