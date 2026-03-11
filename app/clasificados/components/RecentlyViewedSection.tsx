"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRecentlyViewedIds } from "@/app/lib/recentlyViewed";
import { SAMPLE_LISTINGS } from "../../data/classifieds/sampleListings";

type Lang = "es" | "en";

type Listing = {
  id: string;
  category: string;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  postedAgo: { es: string; en: string };
  blurb: { es: string; en: string };
  hasImage: boolean;
  sellerType: string;
};

export default function RecentlyViewedSection({ lang }: { lang: Lang }) {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    let mounted = true;
    getRecentlyViewedIds().then((ids) => {
      if (!mounted || ids.length === 0) return;
      const all = SAMPLE_LISTINGS as unknown as Listing[];
      const byId = new Map(all.map((l) => [l.id, l]));
      const found = ids.map((id) => byId.get(id)).filter(Boolean) as Listing[];
      setListings(found);
    });
    return () => { mounted = false; };
  }, []);

  if (listings.length === 0) return null;

  const title = lang === "es" ? "Anuncios que viste recientemente" : "Recently viewed listings";

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-[#111111] mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
        {listings.map((item) => (
          <Link
            key={item.id}
            href={`/clasificados/anuncio/${item.id}?lang=${lang}`}
            className="flex-shrink-0 w-72 snap-start rounded-2xl border border-[#C9B46A]/70 bg-[#F5F5F5] p-4 hover:bg-[#EFEFEF] transition block"
          >
            <div className="text-base font-bold text-[#111111] leading-snug line-clamp-2">
              {item.title[lang]}
            </div>
            <div className="mt-1 text-sm font-semibold text-[#111111]">
              {item.priceLabel[lang]}
            </div>
            <div className="mt-1 text-xs text-[#111111]">
              {item.city} · {item.postedAgo[lang]}
            </div>
            <div className="mt-2 text-sm text-[#111111] line-clamp-2">
              {item.blurb[lang]}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
