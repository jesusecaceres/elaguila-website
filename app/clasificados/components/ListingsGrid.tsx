
'use client';

import ListingCard from './ListingCard';
import PlaceholderCard from './PlaceholderCard';
import { classifieds, ClassifiedItem } from '../../data/classifieds';

export default function ListingsGrid({ category }: { category: string }) {
  const items = classifieds.filter(item => item.category === category);

  const MIN_CARDS = 4;
  const placeholdersNeeded = Math.max(0, MIN_CARDS - items.length);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {items.map((item: ClassifiedItem) => (
        <ListingCard key={item.id} item={item} />
      ))}

      {Array.from({ length: placeholdersNeeded }).map((_, i) => (
        <PlaceholderCard key={`placeholder-${i}`} />
      ))}
    </div>
  );
}
