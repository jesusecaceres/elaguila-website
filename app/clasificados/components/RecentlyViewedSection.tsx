"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRecentlyViewedIds } from "@/app/lib/recentlyViewed";
import { SAMPLE_LISTINGS } from "../../data/classifieds/sampleListings";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
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
  hasImage: boolean;
  sellerType: string;
};

function stripLeonixImagesBlockRv(desc: string): string {
  return desc.replace(/\s*\[LEONIX_IMAGES\][\s\S]*?\[\/LEONIX_IMAGES\]\s*/g, "\n").trim();
}

function extractLeonixImageUrlsRv(description: string | null | undefined): string[] {
  if (!description) return [];
  const m = description.match(/\[LEONIX_IMAGES\]([\s\S]*?)\[\/LEONIX_IMAGES\]/);
  if (!m) return [];
  const block = m[1];
  const urls: string[] = [];
  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    const um = /^url=(.+)$/i.exec(trimmed);
    if (um?.[1]) urls.push(um[1].trim());
  }
  return urls;
}

function imageUrlsFromJsonbRv(images: unknown): string[] {
  if (images == null) return [];
  if (Array.isArray(images)) {
    return images
      .map((item) => {
        if (typeof item === "string" && item.trim()) return item.trim();
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          const url = (obj.url ?? obj.src ?? obj.path) as string | undefined;
          if (typeof url === "string" && url.trim()) return url.trim();
        }
        return null;
      })
      .filter((u): u is string => u != null);
  }
  return [];
}

function postedAgoFromCreatedRv(createdAt: string | null | undefined): { es: string; en: string } {
  if (!createdAt) return { es: "", en: "" };
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return { es: "", en: "" };
  const diffMins = Math.floor((Date.now() - created) / (1000 * 60));
  const diffHours = Math.floor((Date.now() - created) / (1000 * 60 * 60));
  const diffDays = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
  if (diffMins < 60) {
    return {
      es: diffMins <= 1 ? "hace 1 min" : `hace ${diffMins} min`,
      en: diffMins <= 1 ? "1 min ago" : `${diffMins} min ago`,
    };
  }
  if (diffHours < 24) {
    return {
      es: diffHours === 1 ? "hace 1 h" : `hace ${diffHours} h`,
      en: diffHours === 1 ? "1 h ago" : `${diffHours} h ago`,
    };
  }
  return {
    es: diffDays === 1 ? "hace 1 día" : `hace ${diffDays} días`,
    en: diffDays === 1 ? "1 day ago" : `${diffDays} days ago`,
  };
}

function mapDbRowToRecentListing(row: Record<string, unknown>): Listing | null {
  if (row.is_published === false) return null;
  if (row.status !== "active") return null;

  const rawDesc = String(row.description ?? "");
  const blurbText = stripLeonixImagesBlockRv(rawDesc).trim() || rawDesc.trim();
  const fromJson = imageUrlsFromJsonbRv(row.images);
  const fromMarker = extractLeonixImageUrlsRv(rawDesc);
  const merged = [...new Set([...fromJson, ...fromMarker])];
  const hasImage = merged.length > 0;

  const isFree = Boolean(row.is_free);
  const priceRaw = row.price;
  const priceNum =
    typeof priceRaw === "number" ? priceRaw : Number(String(priceRaw ?? "").replace(/[^0-9.]/g, ""));
  const priceLabel = {
    es: formatListingPrice(Number.isFinite(priceNum) ? priceNum : 0, { lang: "es", isFree }),
    en: formatListingPrice(Number.isFinite(priceNum) ? priceNum : 0, { lang: "en", isFree }),
  };

  const createdRaw = typeof row.created_at === "string" ? row.created_at : null;
  const sellerType = row.seller_type === "business" ? "business" : "personal";

  return {
    id: String(row.id ?? ""),
    category: typeof row.category === "string" ? row.category : "",
    title: { es: String(row.title ?? "").trim(), en: String(row.title ?? "").trim() },
    priceLabel,
    city: String(row.city ?? "").trim(),
    postedAgo: postedAgoFromCreatedRv(createdRaw),
    blurb: { es: blurbText, en: blurbText },
    hasImage,
    sellerType,
  };
}

export default function RecentlyViewedSection({ lang }: { lang: Lang }) {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    let mounted = true;
    void getRecentlyViewedIds()
      .then(async (ids) => {
      if (!mounted || ids.length === 0) return;
      const allSample = SAMPLE_LISTINGS as unknown as Listing[];
      const sampleById = new Map(allSample.map((l) => [l.id, l]));

      const missing = [...new Set(ids.filter((id) => !sampleById.has(id)))];

      const dbById = new Map<string, Listing>();
      if (missing.length > 0) {
        try {
          const supabase = createSupabaseBrowserClient();
          const { data, error } = await supabase
            .from("listings")
            .select(
              "id, title, description, city, category, price, is_free, images, created_at, seller_type, status"
            )
            .eq("status", "active")
            .in("id", missing);
          if (!error && data && mounted) {
            const rows = data as Record<string, unknown>[];
            for (const row of rows) {
              const m = mapDbRowToRecentListing(row);
              if (m) dbById.set(m.id, m);
            }
          }
        } catch {
          /* fail soft: sample-only for unresolved ids */
        }
      }

      if (!mounted) return;

      const found: Listing[] = [];
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        const fromSample = sampleById.get(id);
        if (fromSample) {
          found.push(fromSample);
          continue;
        }
        const fromDb = dbById.get(id);
        if (fromDb) found.push(fromDb);
      }
      setListings(found);
      })
      .catch(() => {
        /* fail soft: leave listings empty */
      });
    return () => {
      mounted = false;
    };
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
