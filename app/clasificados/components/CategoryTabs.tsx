'use client';

import Link from 'next/link';

type Category = {
  slug: string;
  label: string;
};

const topCategories: Category[] = [
  { slug: 'rentas', label: 'Rentas' },
  { slug: 'empleos', label: 'Empleos' },
  { slug: 'autos', label: 'Autos' },
  { slug: 'en-venta', label: 'En Venta' },
];

const bottomCategories: Category[] = [
  { slug: 'servicios', label: 'Servicios' },
  { slug: 'clases', label: 'Clases' },
  { slug: 'comunidad', label: 'Comunidad' },
];

export default function CategoryTabs() {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {topCategories.map(cat => (
          <CategoryButton key={cat.slug} slug={cat.slug} label={cat.label} />
        ))}
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
          {bottomCategories.map(cat => (
            <CategoryButton key={cat.slug} slug={cat.slug} label={cat.label} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryButton({ slug, label }: Category) {
  return (
    <Link
      href={`/clasificados/${slug}`}
      className="rounded-xl border border-yellow-400/30 bg-black hover:bg-[#1a1100] transition p-6 text-center font-semibold text-white"
    >
      {label}
    </Link>
  );
}