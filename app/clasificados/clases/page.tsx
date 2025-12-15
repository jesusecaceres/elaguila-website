
'use client';

import { useSearchParams } from 'next/navigation';
import CategoryHero from '../components/CategoryHero';
import ListingsGrid from '../components/ListingsGrid';

export default function Page() {
  const params = useSearchParams();
  const lang = params.get('lang') === 'en' ? 'en' : 'es';

  const titleEs = 'Clases';
  const titleEn = 'Classes';

  const title = lang === 'en' ? titleEn : titleEs;

  return (
    <main className="bg-black text-white min-h-screen">
      <CategoryHero title={title} />
      <section className="max-w-6xl mx-auto px-6 py-24">
        <ListingsGrid category="clases" />
      </section>
    </main>
  );
}
