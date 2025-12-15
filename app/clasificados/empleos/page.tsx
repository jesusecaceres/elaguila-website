
'use client';

import { useSearchParams } from 'next/navigation';
import CategoryHero from '../components/CategoryHero';
import EmptyCategory from '../components/EmptyCategory';

type Props = {
  
  
};

export default function Page() {
  const titleEs = 'Empleos';
  const titleEn = 'Jobs';
  const params = useSearchParams();
  const lang = params.get('lang') === 'en' ? 'en' : 'es';

  const title = lang === 'en' ? titleEn : titleEs;

  return (
    <main className="bg-black text-white min-h-screen">
      <CategoryHero title={title} />
      <section className="max-w-6xl mx-auto px-6 py-24">
        <EmptyCategory />
      </section>
    </main>
  );
}
