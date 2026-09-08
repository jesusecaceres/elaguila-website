"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

type Lang = "es" | "en";

type RelatedRow = {
  id: string;
  title: string | null;
  price: number | null;
  is_free: boolean | null;
  images: string[] | null;
  leonix_ad_id: string | null;
};

/**
 * Gate G29 — real, price-proximity related items for En Venta/Varios, replacing the previous
 * decorative "see similar" link that fetched zero listings. Reuses the exact same public read
 * path (`public.listings` where category='en-venta' and status='active', anon key) as
 * `queryEnVentaBrowseListings` — a category-scoped fetch here rather than importing that
 * 800-row browse query, since this only ever needs a small candidate pool to rank client-side by
 * price proximity, the same shape of ranking `buildRelatedPublicListings` already does for Autos
 * Dealer inventory. Falls back to the original "browse similar" link when the real fetch finds
 * nothing (new listing, sparse category) — never an empty section, never a broken promise.
 */
export function EnVentaRelatedRail({
  lang,
  q,
  currentListingId,
  currentPrice,
}: {
  lang: Lang;
  q: string;
  /** Excluded from its own related results. */
  currentListingId?: string;
  /** Used to rank candidates by price proximity; omitted ranks by recency only. */
  currentPrice?: number | null;
}) {
  const [related, setRelated] = useState<RelatedRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("listings")
          .select("id, title, price, is_free, images, leonix_ad_id")
          .eq("category", "en-venta")
          .eq("status", "active")
          .eq("is_published", true)
          .order("republish_sort_at", { ascending: false, nullsFirst: true })
          .limit(30);
        if (cancelled) return;
        if (error || !data?.length) {
          setRelated([]);
          return;
        }
        const pool = (data as RelatedRow[]).filter((r) => r.id && r.id !== currentListingId);
        const ranked =
          typeof currentPrice === "number"
            ? [...pool].sort((a, b) => {
                const da = a.price == null ? Number.POSITIVE_INFINITY : Math.abs(a.price - currentPrice);
                const db = b.price == null ? Number.POSITIVE_INFINITY : Math.abs(b.price - currentPrice);
                return da - db;
              })
            : pool;
        setRelated(ranked.slice(0, 4));
      } catch {
        if (!cancelled) setRelated([]);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [currentListingId, currentPrice]);

  const qq = q.trim().slice(0, 48);
  const browseHref = qq ? `/clasificados/en-venta/results?lang=${lang}&q=${encodeURIComponent(qq)}` : `/clasificados/en-venta/results?lang=${lang}`;

  if (related !== null && related.length === 0) {
    if (!qq) return null;
    return (
      <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
        <h2 className="text-sm font-bold text-[#111111]">{lang === "es" ? "Relacionados" : "Related"}</h2>
        <p className="mt-1 text-sm text-[#111111]/65">
          {lang === "es" ? "Explora más artículos similares en Varios." : "Browse similar For Sale listings."}
        </p>
        <Link href={browseHref} className="mt-3 inline-flex rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white">
          {lang === "es" ? "Ver similares" : "See similar"}
        </Link>
      </section>
    );
  }

  if (!related || related.length === 0) return null;

  return (
    <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
      <h2 className="text-sm font-bold text-[#111111]">{lang === "es" ? "Relacionados" : "Related"}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {related.map((r) => (
          <Link
            key={r.id}
            href={`/clasificados/anuncio/${encodeURIComponent(r.id)}?lang=${lang}`}
            className="block overflow-hidden rounded-lg border border-black/10 bg-white"
          >
            {r.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.images[0]} alt={r.title ?? ""} className="h-24 w-full object-cover" />
            ) : (
              <div className="h-24 w-full bg-black/5" />
            )}
            <div className="p-2">
              <p className="truncate text-xs font-semibold text-[#111111]">{r.title ?? "—"}</p>
              <p className="text-xs text-[#111111]/70">
                {r.is_free ? (lang === "es" ? "Gratis" : "Free") : r.price != null ? `$${r.price.toLocaleString(lang === "es" ? "es-US" : "en-US")}` : "—"}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <Link href={browseHref} className="mt-3 inline-flex rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white">
        {lang === "es" ? "Ver más similares" : "See more similar"}
      </Link>
    </section>
  );
}
