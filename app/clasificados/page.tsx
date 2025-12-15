'use client';

import ClassifiedsHero from './components/ClassifiedsHero';
import CategoryTabs from './components/CategoryTabs';
import EmptyState from './components/EmptyState';

export default function ClassifiedsPage() {
  return (
    <main className="bg-black text-white min-h-screen">
      <ClassifiedsHero />
      <section className="max-w-7xl mx-auto px-6 py-20">
        <CategoryTabs />
        <div className="mt-20">
          <EmptyState />
        </div>
      </section>
    </main>
  );
}