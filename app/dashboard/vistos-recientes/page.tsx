"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { getRecentlyViewedIds } from "../../lib/recentlyViewed";
import { SAMPLE_LISTINGS } from "@/app/data/classifieds/sampleListings";
import { formatListingPrice } from "@/app/lib/formatListingPrice";

type Lang = "es" | "en";

type Listing = {
  id: string;
  category: string;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  postedAgo: { es: string; en: string };
  blurb: { es: string; en: string };
};

export default function VistosRecientesPage() {
  const searchParams = useSearchParams();
  const lang: Lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";

  const t = lang === "es"
    ? { title: "Vistos recientemente", back: "Volver a mi cuenta", empty: "Aún no has visto ningún anuncio." }
    : { title: "Recently viewed", back: "Back to my account", empty: "You haven't viewed any listings yet." };

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    let mounted = true;
    getRecentlyViewedIds().then((ids) => {
      if (!mounted) return;
      if (ids.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }
      const all = SAMPLE_LISTINGS as unknown as Listing[];
      const byId = new Map(all.map((l) => [l.id, l]));
      const found = ids.map((id) => byId.get(id)).filter(Boolean) as Listing[];
      setListings(found);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-2xl font-semibold text-yellow-400">{t.title}</h1>
        {loading ? (
          <p className="mt-4 text-white/70">{lang === "es" ? "Cargando…" : "Loading…"}</p>
        ) : listings.length === 0 ? (
          <p className="mt-4 text-white/70">{t.empty}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {listings.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/clasificados/anuncio/${item.id}?lang=${lang}`}
                  className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10"
                >
                  <span className="font-medium">{item.title[lang]}</span>
                  <span className="ml-2 text-white/70 text-sm">
                    {formatListingPrice(item.priceLabel[lang], { lang })} · {item.city}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/dashboard?lang=${lang}`}
          className="mt-6 inline-block rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          {t.back}
        </Link>
      </main>
    </div>
  );
}
