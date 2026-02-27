'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Lang = 'es' | 'en';

type Category = {
  slug: string;
  label: { es: string; en: string };
};

const topCategories: Category[] = [
  { slug: 'rentas', label: { es: 'Rentas', en: 'Rentals' } },
  { slug: 'empleos', label: { es: 'Empleos', en: 'Jobs' } },
  { slug: 'autos', label: { es: 'Autos', en: 'Autos' } },
  { slug: 'restaurantes', label: { es: 'Restaurantes', en: 'Restaurants' } },
  { slug: 'en-venta', label: { es: 'En Venta', en: 'For Sale' } },
];

const bottomCategories: Category[] = [
  { slug: 'servicios', label: { es: 'Servicios', en: 'Services' } },
  { slug: 'clases', label: { es: 'Clases', en: 'Classes' } },
  { slug: 'comunidad', label: { es: 'Comunidad', en: 'Community' } },
  { slug: 'travel', label: { es: 'Viajes', en: 'Travel' } },
];

function withLang(href: string, lang: Lang) {
  const joiner = href.includes('?') ? '&' : '?';
  return `${href}${joiner}lang=${lang}`;
}

export default function CategoryTabs() {
  const sp = useSearchParams();
  const lang = (sp?.get('lang') === 'en' ? 'en' : 'es') as Lang;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {topCategories.map((cat) => (
          <CategoryButton key={cat.slug} slug={cat.slug} label={cat.label[lang]} lang={lang} />
        ))}
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl w-full">
          {bottomCategories.map((cat) => (
            <CategoryButton key={cat.slug} slug={cat.slug} label={cat.label[lang]} lang={lang} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryButton({ slug, label, lang }: { slug: string; label: string; lang: Lang }) {
  return (
    <Link
      href={withLang(`/clasificados/lista?cat=${slug}`, lang)}
      className="rounded-xl border border-yellow-500/30 bg-white/8 hover:bg-white/10 hover:border-yellow-500/30 transition p-6 text-center font-semibold text-white shadow-sm"
    >
      {label}
    </Link>
  );
}
