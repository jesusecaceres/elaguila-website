'use client';

import Link from 'next/link';

const categories = [
  { slug: 'servicios', label: 'Servicios' },
  { slug: 'empleos', label: 'Empleos' },
  { slug: 'rentas', label: 'Rentas' },
  { slug: 'en-venta', label: 'En Venta' },
  { slug: 'autos', label: 'Autos' },
  { slug: 'clases', label: 'Clases' },
  { slug: 'comunidad', label: 'Comunidad' },
];

export default function CategoryTabs() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {categories.map(cat => (
        <Link
          key={cat.slug}
          href={`/clasificados/${cat.slug}`}
          className="rounded-xl border border-gold/30 bg-black/40 hover:bg-black/60 transition p-6 text-center text-white font-semibold"
        >
          {cat.label}
        </Link>
      ))}
    </div>
  );
}