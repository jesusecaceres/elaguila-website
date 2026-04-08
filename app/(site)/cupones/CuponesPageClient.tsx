"use client";

import CouponCard from "@/app/components/CouponCard";
import type { CuponesMerged } from "@/app/lib/siteSectionContent/cuponesPageMerge";

export function CuponesPageClient({ lang, merged }: { lang: "es" | "en"; merged: CuponesMerged }) {
  const title = lang === "es" ? merged.titleEs : merged.titleEn;
  const intro = lang === "es" ? merged.introEs : merged.introEn;

  const coupons = merged.coupons.map((c) => ({
    title: lang === "es" ? c.titleEs : c.titleEn,
    business: lang === "es" ? c.businessEs : c.businessEn,
    description: lang === "es" ? c.descriptionEs : c.descriptionEn,
    image: c.image,
    expiration: lang === "es" ? c.expiresEs : c.expiresEn,
    lang,
  }));

  return (
    <main className="min-h-screen w-full bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="pt-28 px-6 pb-20 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-[color:var(--lx-text)] mb-2">{title}</h1>
        <p className="text-[color:var(--lx-muted)] mb-8">{intro}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((c, i) => (
            <CouponCard key={`${c.title}-${i}`} {...c} />
          ))}
        </div>
      </div>
    </main>
  );
}
