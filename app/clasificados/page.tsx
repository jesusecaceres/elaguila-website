'use client';

import ClassifiedsHero from './components/ClassifiedsHero';
import CategoryTabs from './components/CategoryTabs';
import EmptyState from './components/EmptyState';

export default function ClassifiedsPage() {
  return (
    <main className="relative z-10">
      <ClassifiedsHero />
      <section className="max-w-7xl mx-auto px-6 py-12">
        <CategoryTabs />
        <div className="mt-16">
          <EmptyState />
        </div>
      </section>
    </main>
  );
}